import { jest } from '@jest/globals';
import { MoveTool } from '../ui/editor/MoveTool.js';

// Mock dependencies
jest.mock('../ui/editor/GizmoVisualizer.js', () => ({
  GizmoVisualizer: jest.fn(() => ({
    createGizmo: jest.fn(),
    updatePosition: jest.fn(),
    clear: jest.fn(),
  })),
}));

jest.mock('../services/StructureService.js', () => ({
  StructureService: {
    update: jest.fn(),
  },
}));

jest.mock('../services/CameraService.js', () => ({
  CameraService: {
    update: jest.fn(),
  },
}));

jest.mock('../Core/CoordinateUtils.js', () => ({
  latlonFromXY: jest.fn(),
}));

import { StructureService } from '../services/StructureService.js';
import { CameraService } from '../services/CameraService.js';

describe('MoveTool', () => {
  let mockViewer;
  let mockSelection;
  let moveTool;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock viewer
    mockViewer = {
      scene: {
        canvas: {},
        screenSpaceCameraController: {
          enableRotate: true,
          enableTranslate: true,
          enableZoom: true,
          enableTilt: true,
          enableLook: true,
        },
        globe: {
          pick: jest.fn(),
        },
      },
      camera: {
        getPickRay: jest.fn(() => ({ origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: -1 } })),
      },
      entities: {
        add: jest.fn(),
        remove: jest.fn(),
      },
    };

    // Create mock selection
    mockSelection = {
      getSelected: jest.fn(),
      onChange: jest.fn(),
    };

    // Create MoveTool instance
    moveTool = new MoveTool(mockViewer, mockSelection);
  });

  afterEach(() => {
    // Clean up
    if (moveTool.active) {
      moveTool.deactivate();
    }
  });

  describe('constructor', () => {
    test('should initialize with correct default values', () => {
      expect(moveTool.viewer).toBe(mockViewer);
      expect(moveTool.selection).toBe(mockSelection);
      expect(moveTool.active).toBe(false);
      expect(moveTool.moving).toBe(false);
      expect(moveTool.isDragging).toBe(false);
      expect(moveTool.GIZMO_SCALE).toBe(50);
      expect(moveTool.gizmoEntities).toEqual([]);
    });

    test('should create ScreenSpaceEventHandler', () => {
      expect(moveTool.handler).toBeDefined();
    });
  });

  describe('activate/deactivate', () => {
    test('should activate tool correctly', () => {
      const setupHandlersSpy = jest.spyOn(moveTool, 'setupHandlers');
      const showGizmoSpy = jest.spyOn(moveTool, 'showGizmo');

      moveTool.activate();

      expect(moveTool.active).toBe(true);
      expect(setupHandlersSpy).toHaveBeenCalledTimes(1);
      expect(showGizmoSpy).toHaveBeenCalledTimes(1);
    });

    test('should deactivate tool correctly', () => {
      moveTool.active = true;
      const removeHandlersSpy = jest.spyOn(moveTool, 'removeHandlers');
      const clearGizmoSpy = jest.spyOn(moveTool, 'clearGizmo');

      moveTool.deactivate();

      expect(moveTool.active).toBe(false);
      expect(moveTool.moving).toBe(false);
      expect(moveTool.isDragging).toBe(false);
      expect(removeHandlersSpy).toHaveBeenCalledTimes(1);
      expect(clearGizmoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('persistPosition', () => {
    test('should persist camera position correctly', async () => {
      // Arrange
      const mockEntity = {
        id: 'camera1',
        model: {}, // Indicates it's a camera
        position: {
          getValue: jest.fn(() => ({ x: 1, y: 2, z: 3 })),
        },
        properties: {
          rotation: {
            getValue: jest.fn(() => 45),
          },
        },
      };

      CameraService.update.mockResolvedValue({ success: true });

      // Act
      await moveTool.persistPosition(mockEntity);

      // Assert
      expect(CameraService.update).toHaveBeenCalledWith('camera1', {
        position: [1, 2, 3], // Direct values from the mock
        height: 3,
        rotation: 45,
      });
    });

    test('should persist structure position correctly', async () => {
      // Arrange
      const mockEntity = {
        id: 'structure1',
        box: {}, // Indicates it's a structure
        position: {
          getValue: jest.fn(() => ({ x: 1, y: 2, z: 3 })),
        },
      };

      StructureService.update.mockResolvedValue({ success: true });

      // Act
      await moveTool.persistPosition(mockEntity);

      // Assert
      expect(StructureService.update).toHaveBeenCalledWith('structure1', {
        position: [1, 2], // Only lon/lat for structures
      });
    });

    test('should handle service errors gracefully', async () => {
      // Arrange
      const mockEntity = {
        id: 'structure1',
        box: {},
        position: {
          getValue: jest.fn(() => ({ x: 1, y: 2, z: 3 })),
        },
      };

      const error = new Error('Update failed');
      StructureService.update.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await moveTool.persistPosition(mockEntity);

      // Assert
      expect(StructureService.update).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to persist position:', error);

      consoleErrorSpy.mockRestore();
    });

    test('should handle missing rotation property', async () => {
      // Arrange
      const mockEntity = {
        id: 'camera1',
        model: {},
        position: {
          getValue: jest.fn(() => ({ x: 1, y: 2, z: 3 })),
        },
        properties: {}, // No rotation property
      };

      CameraService.update.mockResolvedValue({ success: true });

      // Act
      await moveTool.persistPosition(mockEntity);

      // Assert
      expect(CameraService.update).toHaveBeenCalledWith('camera1', {
        position: [1, 2, 3],
        height: 3,
        rotation: 0, // Default rotation
      });
    });
  });

  describe('calculateNewPosition', () => {
    test('should calculate new position correctly', () => {
      // Arrange
      const mockEntity = {
        position: {
          getValue: jest.fn(() => ({ x: 0, y: 0, z: 100 })), // 100m height
        },
      };

      const mousePosition = { x: 100, y: 100 };

      // Mock globe.pick to return a position
      mockViewer.scene.globe.pick.mockReturnValue({ x: 10, y: 20, z: 50 });

      // Act
      const result = moveTool.calculateNewPosition(mockEntity, mousePosition);

      // Assert
      expect(mockViewer.camera.getPickRay).toHaveBeenCalledWith(mousePosition);
      expect(mockViewer.scene.globe.pick).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      // Result should maintain original height (100) but use picked lon/lat
    });

    test('should return null when pick ray fails', () => {
      // Arrange
      const mockEntity = {
        position: {
          getValue: jest.fn(() => ({ x: 0, y: 0, z: 100 })),
        },
      };

      mockViewer.camera.getPickRay.mockReturnValue(null);

      // Act
      const result = moveTool.calculateNewPosition(mockEntity, null);

      // Assert
      expect(result).toBeNull();
    });

    test('should return null when globe pick fails', () => {
      // Arrange
      const mockEntity = {
        position: {
          getValue: jest.fn(() => ({ x: 0, y: 0, z: 100 })),
        },
      };

      mockViewer.scene.globe.pick.mockReturnValue(null);

      // Act
      const result = moveTool.calculateNewPosition(mockEntity, { x: 0, y: 0 });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isFiniteCartesian3', () => {
    test('should return true for valid Cartesian3', () => {
      const validCart = { x: 1.0, y: 2.0, z: 3.0 };
      expect(moveTool.isFiniteCartesian3(validCart)).toBe(true);
    });

    test('should return false for invalid Cartesian3', () => {
      expect(moveTool.isFiniteCartesian3(null)).toBeFalsy();
      expect(moveTool.isFiniteCartesian3({ x: 1, y: 2 })).toBeFalsy();
      expect(moveTool.isFiniteCartesian3({ x: 1, y: 2, z: NaN })).toBeFalsy();
      expect(moveTool.isFiniteCartesian3({ x: 1, y: 2, z: Infinity })).toBeFalsy();
    });
  });

  describe('getRotationDegrees', () => {
    test('should return rotation from property callback', () => {
      const mockEntity = {
        properties: {
          rotation: {
            getValue: jest.fn(() => 90),
          },
        },
      };

      const result = moveTool.getRotationDegrees(mockEntity);
      expect(result).toBe(90);
    });

    test('should return rotation from direct property value', () => {
      const mockEntity = {
        properties: {
          rotation: 45,
        },
      };

      const result = moveTool.getRotationDegrees(mockEntity);
      expect(result).toBe(45);
    });

    test('should convert string rotation to number', () => {
      const mockEntity = {
        properties: {
          rotation: {
            getValue: jest.fn(() => '30'),
          },
        },
      };

      const result = moveTool.getRotationDegrees(mockEntity);
      expect(result).toBe(30);
    });

    test('should return 0 for invalid rotation values', () => {
      expect(moveTool.getRotationDegrees({})).toBe(0);
      expect(moveTool.getRotationDegrees({ properties: {} })).toBe(0);
      expect(moveTool.getRotationDegrees({
        properties: {
          rotation: {
            getValue: jest.fn(() => NaN),
          },
        },
      })).toBe(0);
    });
  });
});
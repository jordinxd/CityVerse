import { jest } from '@jest/globals';
import { MoveTool } from '../ui/editor/MoveTool.js';

/*
  Mock GizmoVisualizer so the MoveTool does not create real 3D gizmos.
  The constructor returns an object with the methods used by MoveTool.
*/
jest.mock('../ui/editor/GizmoVisualizer.js', () => ({
  GizmoVisualizer: jest.fn(() => ({
    createGizmo: jest.fn(),
    updatePosition: jest.fn(),
    clear: jest.fn(),
  })),
}));

/*
  Mock backend services to avoid real network or database operations.
  These mocks allow us to verify which data would be sent.
*/
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

/*
  Mock coordinate conversion utilities used during movement calculations.
*/
jest.mock('../Core/CoordinateUtils.js', () => ({
  latlonFromXY: jest.fn(),
}));

// Import mocked services after jest.mock
import { StructureService } from '../services/StructureService.js';
import { CameraService } from '../services/CameraService.js';

describe('MoveTool', () => {
  let mockViewer;
  let mockSelection;
  let moveTool;

  beforeEach(() => {
    // Reset all mock call history and behavior before every test
    jest.clearAllMocks();

    /*
      Create a minimal fake Cesium viewer object that provides
      only the properties and functions required by MoveTool.
    */
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
        // Simulate ray casting from mouse position into the scene
        getPickRay: jest.fn(() => ({
          origin: { x: 0, y: 0, z: 0 },
          direction: { x: 0, y: 0, z: -1 },
        })),
      },
      entities: {
        add: jest.fn(),
        remove: jest.fn(),
      },
    };

    /*
      Mock selection system used to determine which entity is currently selected.
    */
    mockSelection = {
      getSelected: jest.fn(),
      onChange: jest.fn(),
    };

    // Create a new MoveTool instance for each test
    moveTool = new MoveTool(mockViewer, mockSelection);
  });

  afterEach(() => {
    /*
      Ensure the tool is deactivated after each test to avoid
      event handlers or internal state leaking into other tests.
    */
    if (moveTool.active) {
      moveTool.deactivate();
    }
  });

  describe('constructor', () => {
    test('should initialize with correct default values', () => {
      // Verify constructor assigns dependencies and default state correctly
      expect(moveTool.viewer).toBe(mockViewer);
      expect(moveTool.selection).toBe(mockSelection);
      expect(moveTool.active).toBe(false);
      expect(moveTool.moving).toBe(false);
      expect(moveTool.isDragging).toBe(false);
      expect(moveTool.GIZMO_SCALE).toBe(50);
      expect(moveTool.gizmoEntities).toEqual([]);
    });

    test('should create ScreenSpaceEventHandler', () => {
      // MoveTool should create an input handler for mouse interaction
      expect(moveTool.handler).toBeDefined();
    });
  });

  describe('activate/deactivate', () => {
    test('should activate tool correctly', () => {
      // Spy on internal setup functions
      const setupHandlersSpy = jest.spyOn(moveTool, 'setupHandlers');
      const showGizmoSpy = jest.spyOn(moveTool, 'showGizmo');

      // Activate the tool
      moveTool.activate();

      // Verify state change and setup behavior
      expect(moveTool.active).toBe(true);
      expect(setupHandlersSpy).toHaveBeenCalledTimes(1);
      expect(showGizmoSpy).toHaveBeenCalledTimes(1);
    });

    test('should deactivate tool correctly', () => {
      // Simulate already-active tool
      moveTool.active = true;

      const removeHandlersSpy = jest.spyOn(moveTool, 'removeHandlers');
      const clearGizmoSpy = jest.spyOn(moveTool, 'clearGizmo');

      // Deactivate the tool
      moveTool.deactivate();

      // Verify state reset and cleanup behavior
      expect(moveTool.active).toBe(false);
      expect(moveTool.moving).toBe(false);
      expect(moveTool.isDragging).toBe(false);
      expect(removeHandlersSpy).toHaveBeenCalledTimes(1);
      expect(clearGizmoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('persistPosition', () => {
    test('should persist camera position correctly', async () => {
      // Arrange: mock a camera entity
      const mockEntity = {
        id: 'camera1',
        model: {}, // Presence of model indicates camera entity
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

      // Assert: camera service is called with converted payload
      expect(CameraService.update).toHaveBeenCalledWith('camera1', {
        position: [1, 2, 3],
        height: 3,
        rotation: 45,
      });
    });

    test('should persist structure position correctly', async () => {
      // Arrange: mock a structure entity
      const mockEntity = {
        id: 'structure1',
        box: {}, // Presence of box indicates structure entity
        position: {
          getValue: jest.fn(() => ({ x: 1, y: 2, z: 3 })),
        },
      };

      StructureService.update.mockResolvedValue({ success: true });

      // Act
      await moveTool.persistPosition(mockEntity);

      // Assert: only longitude/latitude are stored for structures
      expect(StructureService.update).toHaveBeenCalledWith('structure1', {
        position: [1, 2],
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

      // Silence console output while capturing calls
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await moveTool.persistPosition(mockEntity);

      // Assert: error is logged but does not crash execution
      expect(StructureService.update).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to persist position:', error);

      consoleErrorSpy.mockRestore();
    });

    test('should handle missing rotation property', async () => {
      // Arrange: camera entity without rotation property
      const mockEntity = {
        id: 'camera1',
        model: {},
        position: {
          getValue: jest.fn(() => ({ x: 1, y: 2, z: 3 })),
        },
        properties: {},
      };

      CameraService.update.mockResolvedValue({ success: true });

      // Act
      await moveTool.persistPosition(mockEntity);

      // Assert: default rotation of 0 is applied
      expect(CameraService.update).toHaveBeenCalledWith('camera1', {
        position: [1, 2, 3],
        height: 3,
        rotation: 0,
      });
    });
  });

  describe('calculateNewPosition', () => {
    test('should calculate new position correctly', () => {
      // Arrange
      const mockEntity = {
        position: {
          getValue: jest.fn(() => ({ x: 0, y: 0, z: 100 })), // Original height
        },
      };

      const mousePosition = { x: 100, y: 100 };

      // Simulate globe intersection result
      mockViewer.scene.globe.pick.mockReturnValue({ x: 10, y: 20, z: 50 });

      // Act
      const result = moveTool.calculateNewPosition(mockEntity, mousePosition);

      // Assert
      expect(mockViewer.camera.getPickRay).toHaveBeenCalledWith(mousePosition);
      expect(mockViewer.scene.globe.pick).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();

      // Result should combine picked X/Y with original Z (height preservation)
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
      expect(
          moveTool.getRotationDegrees({
            properties: {
              rotation: {
                getValue: jest.fn(() => NaN),
              },
            },
          })
      ).toBe(0);
    });
  });
});

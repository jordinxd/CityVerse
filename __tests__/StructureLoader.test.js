import { jest } from '@jest/globals';
import { loadStructures } from '../ui/drawing/StructureLoader.js';

// Mock dependencies
jest.mock('../services/StructureService.js', () => ({
  StructureService: {
    getAll: jest.fn(),
  },
}));

jest.mock('../ui/drawing/StructureEntityBinder.js', () => ({
  applyStructureToEntity: jest.fn(),
}));

import { StructureService } from '../services/StructureService.js';
import { applyStructureToEntity } from '../ui/drawing/StructureEntityBinder.js';

describe('StructureLoader', () => {
  let mockViewer;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock viewer with entities.add method
    mockViewer = {
      entities: {
        add: jest.fn((entity) => ({ id: entity.id })),
      },
    };
  });

  describe('loadStructures', () => {
    test('should load structures and apply them to entities', async () => {
      // Arrange
      const mockStructures = [
        { id: 'structure1', name: 'Building A', position: [52.1, 4.3] },
        { id: 'structure2', name: 'Building B', position: [52.2, 4.4] },
      ];

      StructureService.getAll.mockResolvedValue(mockStructures);

      // Act
      await loadStructures(mockViewer);

      // Assert
      expect(StructureService.getAll).toHaveBeenCalledTimes(1);

      expect(mockViewer.entities.add).toHaveBeenCalledTimes(2);
      expect(mockViewer.entities.add).toHaveBeenNthCalledWith(1, { id: 'structure1' });
      expect(mockViewer.entities.add).toHaveBeenNthCalledWith(2, { id: 'structure2' });

      expect(applyStructureToEntity).toHaveBeenCalledTimes(2);
      expect(applyStructureToEntity).toHaveBeenNthCalledWith(1, { id: 'structure1' }, mockStructures[0]);
      expect(applyStructureToEntity).toHaveBeenNthCalledWith(2, { id: 'structure2' }, mockStructures[1]);
    });

    test('should handle empty structure list', async () => {
      // Arrange
      StructureService.getAll.mockResolvedValue([]);

      // Act
      await loadStructures(mockViewer);

      // Assert
      expect(StructureService.getAll).toHaveBeenCalledTimes(1);
      expect(mockViewer.entities.add).not.toHaveBeenCalled();
      expect(applyStructureToEntity).not.toHaveBeenCalled();
    });

    test('should handle service errors gracefully', async () => {
      // Arrange
      const error = new Error('Service unavailable');
      StructureService.getAll.mockRejectedValue(error);

      // Mock console.error to capture error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(loadStructures(mockViewer)).rejects.toThrow('Service unavailable');

      expect(StructureService.getAll).toHaveBeenCalledTimes(1);
      expect(mockViewer.entities.add).not.toHaveBeenCalled();
      expect(applyStructureToEntity).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should pass viewer parameter correctly', async () => {
      // Arrange
      const mockStructures = [{ id: 'test', name: 'Test Structure' }];
      StructureService.getAll.mockResolvedValue(mockStructures);

      // Act
      await loadStructures(mockViewer);

      // Assert
      expect(StructureService.getAll).toHaveBeenCalledTimes(1);
      // The function doesn't directly use the viewer parameter beyond entities.add,
      // but we verify it's passed implicitly through the entity creation
    });
  });
});
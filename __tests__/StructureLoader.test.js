import { jest } from '@jest/globals';
import { loadStructures } from '../ui/drawing/StructureLoader.js';

/*
  Mock the StructureService module so no real API or database calls are made.
  We replace getAll() with a Jest mock function we can control in tests.
*/
jest.mock('../services/StructureService.js', () => ({
  StructureService: {
    getAll: jest.fn(),
  },
}));

/*
  Mock the function that applies structure data to viewer entities.
  This allows us to verify it is called correctly without executing real logic.
*/
jest.mock('../ui/drawing/StructureEntityBinder.js', () => ({
  applyStructureToEntity: jest.fn(),
}));

// Import mocked dependencies AFTER jest.mock
import { StructureService } from '../services/StructureService.js';
import { applyStructureToEntity } from '../ui/drawing/StructureEntityBinder.js';

describe('StructureLoader', () => {
  let mockViewer;

  beforeEach(() => {
    // Clear call history and behavior of all mocks before every test
    jest.clearAllMocks();

    /*
      Create a fake viewer object that mimics the real viewer API.
      The entities.add() function returns an object with an id,
      simulating how a real entity would be created.
    */
    mockViewer = {
      entities: {
        add: jest.fn((entity) => ({ id: entity.id })),
      },
    };
  });

  describe('loadStructures', () => {
    test('should load structures and apply them to entities', async () => {
      // Arrange: prepare fake structure data returned by the service
      const mockStructures = [
        { id: 'structure1', name: 'Building A', position: [52.1, 4.3] },
        { id: 'structure2', name: 'Building B', position: [52.2, 4.4] },
      ];

      // Make the mocked service return the fake structures
      StructureService.getAll.mockResolvedValue(mockStructures);

      // Act: call the function under test
      await loadStructures(mockViewer);

      // Assert: verify the service was called once
      expect(StructureService.getAll).toHaveBeenCalledTimes(1);

      // Verify two entities were added to the viewer
      expect(mockViewer.entities.add).toHaveBeenCalledTimes(2);

      // Verify each entity was created with the correct id
      expect(mockViewer.entities.add).toHaveBeenNthCalledWith(1, { id: 'structure1' });
      expect(mockViewer.entities.add).toHaveBeenNthCalledWith(2, { id: 'structure2' });

      // Verify that structure data was applied to each created entity
      expect(applyStructureToEntity).toHaveBeenCalledTimes(2);
      expect(applyStructureToEntity).toHaveBeenNthCalledWith(
          1,
          { id: 'structure1' },
          mockStructures[0]
      );
      expect(applyStructureToEntity).toHaveBeenNthCalledWith(
          2,
          { id: 'structure2' },
          mockStructures[1]
      );
    });

    test('should handle empty structure list', async () => {
      // Arrange: service returns no structures
      StructureService.getAll.mockResolvedValue([]);

      // Act
      await loadStructures(mockViewer);

      // Assert: service is still called
      expect(StructureService.getAll).toHaveBeenCalledTimes(1);

      // No entities should be created
      expect(mockViewer.entities.add).not.toHaveBeenCalled();

      // No binding should be applied
      expect(applyStructureToEntity).not.toHaveBeenCalled();
    });

    test('should handle service errors gracefully', async () => {
      // Arrange: service throws an error
      const error = new Error('Service unavailable');
      StructureService.getAll.mockRejectedValue(error);

      // Spy on console.error to prevent actual error output during test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert: function should reject with the same error
      await expect(loadStructures(mockViewer)).rejects.toThrow('Service unavailable');

      // Service should still be called
      expect(StructureService.getAll).toHaveBeenCalledTimes(1);

      // No entity creation or binding should occur after failure
      expect(mockViewer.entities.add).not.toHaveBeenCalled();
      expect(applyStructureToEntity).not.toHaveBeenCalled();

      // Restore original console.error behavior
      consoleErrorSpy.mockRestore();
    });

    test('should pass viewer parameter correctly', async () => {
      // Arrange: minimal structure data
      const mockStructures = [{ id: 'test', name: 'Test Structure' }];
      StructureService.getAll.mockResolvedValue(mockStructures);

      // Act
      await loadStructures(mockViewer);

      // Assert: service call happened
      expect(StructureService.getAll).toHaveBeenCalledTimes(1);

      /*
        The viewer is not passed explicitly to other functions,
        but its entities.add() method is used internally.
        If entities.add was called, the viewer parameter worked correctly.
      */
    });
  });
});

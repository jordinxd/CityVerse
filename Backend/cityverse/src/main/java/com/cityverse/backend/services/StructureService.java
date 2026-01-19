package com.cityverse.backend.services;

import com.cityverse.backend.models.Structure;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.util.List;

/*
 * Service layer responsible for managing Structure objects.
 * Data is persisted in a JSON file using the generic JsonFileService.
 */
@Service
public class StructureService extends JsonFileService<Structure> {

    /*
     * Initializes the service with:
     * - the path to the JSON storage file
     * - the type reference used for JSON deserialization
     */
    public StructureService() {
        super("data/structures.json", new TypeReference<List<Structure>>() {});
    }

    /*
     * Retrieves all structures from the JSON file.
     */
    public List<Structure> getAll() {
        return readAll();
    }

    /*
     * Adds a new structure to the JSON storage.
     */
    public void add(Structure s) {
        List<Structure> list = readAll();
        list.add(s);
        writeAll(list);
    }

    /*
     * Partially updates an existing structure.
     * Only fields that are not null in the 'changes' object are applied.
     */
    public Structure updatePartial(String id, Structure changes) {
        List<Structure> list = readAll();

        // Iterate through all stored structures to find the matching ID
        for (int i = 0; i < list.size(); i++) {
            Structure current = list.get(i);

            if (current.getId().equals(id)) {

                // Apply updates only to provided (non-null) fields
                if (changes.getPosition() != null)
                    current.setPosition(changes.getPosition());

                if (changes.getRotation() != null)
                    current.setRotation(changes.getRotation());

                if (changes.getWidth() != null)
                    current.setWidth(changes.getWidth());

                if (changes.getDepth() != null)
                    current.setDepth(changes.getDepth());

                if (changes.getHeight() != null)
                    current.setHeight(changes.getHeight());

                if (changes.getStyle() != null)
                    current.setStyle(changes.getStyle());

                if (changes.getType() != null)
                    current.setType(changes.getType());

                // Persist updated list back to the JSON file
                writeAll(list);

                // Return the updated structure
                return current;
            }
        }

        // No structure found with the given ID
        throw new RuntimeException("Structure not found: " + id);
    }

    /*
     * Deletes a structure by ID from the JSON storage.
     */
    public void delete(String id) {
        List<Structure> list = readAll();

        // Remove all structures matching the given ID
        list.removeIf(s -> s.getId().equals(id));

        // Persist updated list back to file
        writeAll(list);
    }

}

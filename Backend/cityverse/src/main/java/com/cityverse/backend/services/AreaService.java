package com.cityverse.backend.services;

import com.cityverse.backend.models.Area;
import com.cityverse.backend.models.PolygonEntity;
import com.cityverse.backend.repository.PolygonRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/*
 * Service layer responsible for business logic related to Area objects.
 * It converts between database entities (PolygonEntity) and API models (Area).
 */
@Service
public class AreaService {

    /*
     * Repository used to access polygon records from the database.
     */
    private final PolygonRepository polygonRepository;

    /*
     * ObjectMapper used to convert polygon coordinate data
     * between JSON (String) and Java collections.
     */
    private final ObjectMapper objectMapper;

    /*
     * Constructor injection of dependencies.
     */
    public AreaService(PolygonRepository polygonRepository, ObjectMapper objectMapper) {
        this.polygonRepository = polygonRepository;
        this.objectMapper = objectMapper;
    }

    /*
     * Retrieves all polygon entities from the database,
     * converts them to Area domain objects, and returns them.
     */
    public List<Area> getAll() {
        List<PolygonEntity> polygons = polygonRepository.findAll();
        List<Area> areas = new ArrayList<>();

        // Convert each PolygonEntity into an Area object
        for (PolygonEntity p : polygons) {
            Area area = new Area();

            // Map basic fields
            area.setId(String.valueOf(p.getId()));
            area.setName(p.getName());

            /*
             * Convert JSON string of coordinates into:
             * List<List<Double>> representing polygon vertices.
             */
            try {
                List<List<Double>> coords = objectMapper.readValue(
                        p.getCoordinates(),
                        new TypeReference<List<List<Double>>>() {}
                );
                area.setPolygon(coords);
            } catch (Exception e) {
                // Fallback to empty polygon if parsing fails
                e.printStackTrace();
                area.setPolygon(new ArrayList<>());
            }

            // Temporary static configuration for allowed agent types
            area.setAllowedTypes(List.of("Drone", "Robot"));

            // Temporary static styling configuration
            area.setStyle(Map.of("color", "blue"));

            areas.add(area);
        }

        return areas;
    }

    /*
     * Saves a new Area by converting it into a PolygonEntity
     * and persisting it in the database.
     */
    public Area add(Area area) {
        try {
            PolygonEntity entity = new PolygonEntity();

            // Copy simple properties
            entity.setName(area.getName());

            // Convert polygon coordinates to JSON for storage
            String coordsJson = objectMapper.writeValueAsString(area.getPolygon());
            entity.setCoordinates(coordsJson);

            // Assign placeholder values (likely temporary or foreign keys)
            entity.setAgentId(1);
            entity.setObjectId(1);

            // Save entity and update Area with generated ID
            PolygonEntity saved = polygonRepository.save(entity);
            area.setId(String.valueOf(saved.getId()));

        } catch (Exception e) {
            // Log conversion or database errors
            e.printStackTrace();
        }

        return area;
    }

    /*
     * Deletes an area by converting the string ID to an integer
     * and delegating deletion to the repository.
     */
    public void delete(String id) {
        try {
            Integer polygonId = Integer.parseInt(id);
            polygonRepository.deleteById(polygonId);
        } catch (NumberFormatException e) {
            // Handle invalid numeric ID format
            e.printStackTrace();
        }
    }
}

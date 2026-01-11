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

@Service
public class AreaService {

    private final PolygonRepository polygonRepository;
    private final ObjectMapper objectMapper;

    public AreaService(PolygonRepository polygonRepository, ObjectMapper objectMapper) {
        this.polygonRepository = polygonRepository;
        this.objectMapper = objectMapper;
    }

    public List<Area> getAll() {
        List<PolygonEntity> polygons = polygonRepository.findAll();
        List<Area> areas = new ArrayList<>();

        for (PolygonEntity p : polygons) {
            Area area = new Area();
            area.setId(String.valueOf(p.getId()));
            area.setName(p.getName());

            try {
                List<List<Double>> coords = objectMapper.readValue(
                        p.getCoordinates(),
                        new TypeReference<List<List<Double>>>() {}
                );
                area.setPolygon(coords);
            } catch (Exception e) {
                e.printStackTrace();
                area.setPolygon(new ArrayList<>());
            }

            area.setAllowedTypes(List.of("Drone", "Robot"));
            area.setStyle(Map.of("color", "blue"));

            areas.add(area);
        }

        return areas;
    }

    public Area add(Area area) {
        try {
            PolygonEntity entity = new PolygonEntity();
            entity.setName(area.getName());

            String coordsJson = objectMapper.writeValueAsString(area.getPolygon());
            entity.setCoordinates(coordsJson);

            entity.setAgentId(1);
            entity.setScenarioId(1);
            entity.setObjectId(1);

            PolygonEntity saved = polygonRepository.save(entity);
            area.setId(String.valueOf(saved.getId()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return area;
    }

    public void delete(String id) {
        try {
            Integer polygonId = Integer.parseInt(id);
            polygonRepository.deleteById(polygonId);
        } catch (NumberFormatException e) {
            e.printStackTrace();
        }
    }
}

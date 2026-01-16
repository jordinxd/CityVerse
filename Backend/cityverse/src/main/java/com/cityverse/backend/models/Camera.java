package com.cityverse.backend.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;

@Entity
@Table(name = "Agent")
public class Camera {

    @Id
    @Column(name = "ID", nullable = false)
    private String id;

    // Converted to JSON string in DB. Crucial for placement.
    @Column(name = "cameraPosition", columnDefinition = "JSON")
    @Convert(converter = DoubleListConverter.class)
    private List<Double> position;

    @Column(name = "rotation")
    private Double rotation;

    @Column(name = "height")
    private Double height;

    // Kept this for your future screenshot feature
    @Column(name = "imagePath")
    private String imagePath;

    // Added timestamp to track creation time
    @Column(name = "timestamp", insertable = false, updatable = false)
    private String timestamp;

    public Camera() {}

    // --- GETTERS & SETTERS ---

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<Double> getPosition() {
        return position;
    }

    public void setPosition(List<Double> position) {
        this.position = position;
    }

    public Double getRotation() {
        return rotation;
    }

    public void setRotation(Double rotation) {
        this.rotation = rotation;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }
}

/**
 * Converter to handle List<Double> <-> JSON String conversion.
 */
@Converter
class DoubleListConverter implements AttributeConverter<List<Double>, String> {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Double> attribute) {
        try {
            // If list is null or empty, return null to DB
            return (attribute == null || attribute.isEmpty()) ? null : mapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting list to JSON", e);
        }
    }

    @Override
    public List<Double> convertToEntityAttribute(String dbData) {
        try {
            // Check for null or empty JSON string
            if (dbData == null || dbData.isEmpty()) return null;
            return mapper.readValue(dbData, new TypeReference<List<Double>>() {});
        } catch (IOException e) {
            throw new RuntimeException("Error converting JSON to list", e);
        }
    }
}
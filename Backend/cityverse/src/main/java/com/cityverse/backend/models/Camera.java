package com.cityverse.backend.models;

import java.util.List;
import java.util.UUID;

public class Camera {
    private String id; // Use String like Structure instead of UUID
    private String type; // Add type like Structure
    private List<Double> position; // [longitude, latitude, height] like structures
    private Double rotation; // Like structures
    private Double width; // Like structures
    private Double depth; // Like structures
    private Double height; // Like structures

    public Camera() {}

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public Double getWidth() {
        return width;
    }

    public void setWidth(Double width) {
        this.width = width;
    }

    public Double getDepth() {
        return depth;
    }

    public void setDepth(Double depth) {
        this.depth = depth;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }
}
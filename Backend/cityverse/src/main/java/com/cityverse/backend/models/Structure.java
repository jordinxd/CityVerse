package com.cityverse.backend.models;

import java.util.List;
import java.util.Map;

public class Structure {
    private String id;
    private String type;
    private List<Double> position;
    private Double rotation;
    private Double width;
    private Double depth;
    private Double height;
    private Map<String, Object> style;

    public Structure() {}

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<Double> getPosition() { return position; }
    public void setPosition(List<Double> position) { this.position = position; }

    public Double getRotation() { return rotation; }
    public void setRotation(double rotation) { this.rotation = rotation; }

    public Double getWidth() { return width; }
    public void setWidth(double width) { this.width = width; }

    public Double getDepth() { return depth; }
    public void setDepth(double depth) { this.depth = depth; }

    public Double getHeight() { return height; }
    public void setHeight(double height) { this.height = height; }

    public Map<String, Object> getStyle() { return style; }
    public void setStyle(Map<String, Object> style) { this.style = style; }
}

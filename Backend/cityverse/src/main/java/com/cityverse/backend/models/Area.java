package com.cityverse.backend.models;

import java.util.List;
import java.util.Map;

public class Area {
    private String id;
    private String name;
    private List<List<Double>> polygon;
    private List<String> allowedTypes;
    private Map<String, Object> style;

    public Area() {}

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<List<Double>> getPolygon() { return polygon; }
    public void setPolygon(List<List<Double>> polygon) { this.polygon = polygon; }

    public List<String> getAllowedTypes() { return allowedTypes; }
    public void setAllowedTypes(List<String> allowedTypes) { this.allowedTypes = allowedTypes; }

    public Map<String, Object> getStyle() { return style; }
    public void setStyle(Map<String, Object> style) { this.style = style; }
}

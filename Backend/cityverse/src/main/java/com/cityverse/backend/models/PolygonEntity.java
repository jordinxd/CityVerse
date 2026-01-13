package com.cityverse.backend.models;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "polygon")
public class PolygonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "scenario_id")
    private Integer scenarioId;

    @Column(name = "object_id")
    private Integer objectId;

    @Column(name = "agent_id")
    private Integer agentId;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String coordinates; // JSON string

    @Column(name = "created_at")
    private Timestamp createdAt;

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getScenarioId() { return scenarioId; }
    public void setScenarioId(Integer scenarioId) { this.scenarioId = scenarioId; }

    public Integer getObjectId() { return objectId; }
    public void setObjectId(Integer objectId) { this.objectId = objectId; }

    public Integer getAgentId() { return agentId; }
    public void setAgentId(Integer agentId) { this.agentId = agentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCoordinates() { return coordinates; }
    public void setCoordinates(String coordinates) { this.coordinates = coordinates; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}

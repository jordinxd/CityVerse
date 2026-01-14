package com.cityverse.backend.models;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "llmanalysis")
public class LlmAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "polygon_id", nullable = false)
    private Integer polygonId;

    @Column(name = "analysis", columnDefinition = "TEXT")
    private String analysis;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private Timestamp createdAt;

    public LlmAnalysisEntity() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getPolygonId() { return polygonId; }
    public void setPolygonId(Integer polygonId) { this.polygonId = polygonId; }

    public String getAnalysis() { return analysis; }
    public void setAnalysis(String analysis) { this.analysis = analysis; }

    public Timestamp getCreatedAt() { return createdAt; }
}

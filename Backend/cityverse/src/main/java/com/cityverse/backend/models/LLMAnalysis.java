package com.cityverse.backend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "LLMAnalysis")
public class LLMAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "agentId", nullable = false)
    private String agentId;

    @Column(columnDefinition = "JSON")
    private String response;

    // --- CONSTRUCTORS ---
    public LLMAnalysis() {}

    // --- GETTERS & SETTERS ---
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }
}
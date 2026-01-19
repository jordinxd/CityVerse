package com.cityverse.backend.repository;

import com.cityverse.backend.models.LLMAnalysis; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LLMAnalysisRepository extends JpaRepository<LLMAnalysis, Long> {
    Optional<LLMAnalysis> findTopByAgentIdOrderByIdDesc(String agentId);
}
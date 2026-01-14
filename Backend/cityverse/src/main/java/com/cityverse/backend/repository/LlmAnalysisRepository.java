package com.cityverse.backend.repository;

import com.cityverse.backend.models.LlmAnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LlmAnalysisRepository extends JpaRepository<LlmAnalysisEntity, Integer> {
    List<LlmAnalysisEntity> findByPolygonId(Integer polygonId);
}

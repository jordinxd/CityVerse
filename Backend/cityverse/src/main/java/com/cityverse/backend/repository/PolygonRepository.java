package com.cityverse.backend.repository;

import com.cityverse.backend.models.PolygonEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PolygonRepository extends JpaRepository<PolygonEntity, Integer> {
}

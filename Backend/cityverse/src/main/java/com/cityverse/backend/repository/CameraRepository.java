package com.cityverse.backend.repository;

import com.cityverse.backend.models.Camera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Interface for database operations on the Agent table (mapped to Camera entity).
 */
@Repository
public interface CameraRepository extends JpaRepository<Camera, String> {
}
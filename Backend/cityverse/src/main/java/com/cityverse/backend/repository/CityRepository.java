package com.cityverse.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cityverse.backend.models.City;

public interface CityRepository extends JpaRepository<City, Long> {
}

package com.cityverse.backend.controllers;

import org.springframework.web.bind.annotation.*;
import com.cityverse.backend.models.City;
import com.cityverse.backend.repository.CityRepository;

import java.util.List;

@RestController
@RequestMapping("/cities")
public class CityController {

    private final CityRepository cityRepository;

    public CityController(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    @GetMapping
    public List<City> getAllCities() {
        return cityRepository.findAll();
    }

    @PostMapping
    public City createCity(@RequestBody City city) {
        return cityRepository.save(city);
    }
}

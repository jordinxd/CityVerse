package com.cityverse.backend.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cityverse.backend.models.Camera;
import com.cityverse.backend.services.CameraService;

/*
 * REST controller responsible for handling HTTP requests related to Camera entities.
 * It exposes CRUD endpoints and delegates business logic to the CameraService.
 */
@RestController
@RequestMapping("/cameras") // Base path for all camera-related endpoints
public class CameraController {

    /*
     * Service layer that contains camera-related business logic
     * (database access, validation, updates, etc.).
     */
    private final CameraService service;

    /*
     * Constructor injection of CameraService.
     * Spring automatically injects the dependency.
     */
    public CameraController(CameraService service) {
        this.service = service;
    }

    /*
     * Handles HTTP GET requests to /cameras
     * Returns a list of all cameras stored in the system.
     */
    @GetMapping
    public List<Camera> getAll() {
        return service.getAll();
    }

    /*
     * Handles HTTP POST requests to /cameras
     * Expects a Camera object in JSON format in the request body.
     * Saves the camera and returns the created object.
     */
    @PostMapping
    public Camera create(@RequestBody Camera s) {
        service.add(s);
        return s;
    }

    /*
     * Handles HTTP PUT requests to /cameras/{id}
     * Performs a partial update on an existing camera.
     * Only the provided fields in the request body are updated.
     */
    @PutMapping("/{id}")
    public Camera updateCamera(
            @PathVariable String id,
            @RequestBody Camera partial
    ) {
        return service.updatePartial(id, partial);
    }

    /*
     * Handles HTTP DELETE requests to /cameras/{id}
     * Deletes the camera with the given ID.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}

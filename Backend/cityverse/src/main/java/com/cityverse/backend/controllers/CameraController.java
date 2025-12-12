package com.cityverse.backend.controllers;

import com.cityverse.backend.models.Camera;
import com.cityverse.backend.services.CameraService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// REST controller to manage cameras: list, create, and delete
@RestController
@RequestMapping("/cameras")
public class CameraController {

    private final CameraService service;

    // Inject the CameraService
    public CameraController(CameraService service) {
        this.service = service;
    }

    // GET /cameras - return all cameras
    @GetMapping
    public List<Camera> getAll() {
        return service.getAll();
    }

    // POST /cameras - create a new camera
    @PostMapping
    public Camera create(@RequestBody Camera c) {
        service.add(c); // add to backend storage
        return c;       // return the saved camera
    }

    // DELETE /cameras/{id} - remove camera by ID
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id); // delete from backend storage
    }
}

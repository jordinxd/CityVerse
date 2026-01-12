package com.cityverse.backend.controllers;

import com.cityverse.backend.models.Camera;
import com.cityverse.backend.services.CameraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/cameras")
public class CameraController {
    private final CameraService cameraService;

    public CameraController(CameraService cameraService) {
        this.cameraService = cameraService;
    }

    @GetMapping
    public List<Camera> getAllCameras() {
        return cameraService.getAll();
    }

    @PostMapping
    public ResponseEntity<Camera> createCamera(@RequestBody Camera camera) {
        // Generate UUID if not provided
        if (camera.getId() == null) {
            camera.setId(UUID.randomUUID());
        }
        cameraService.add(camera);
        return ResponseEntity.ok(camera);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCamera(@PathVariable UUID id) {
        cameraService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
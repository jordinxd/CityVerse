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

@RestController
@RequestMapping("/cameras")
public class CameraController {

    private final CameraService service;

    public CameraController(CameraService service) {
        this.service = service;
    }

    @GetMapping
    public List<Camera> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Camera create(@RequestBody Camera s) {
        service.add(s);
        return s;
    }

    @PutMapping("/{id}")
    public Camera updateCamera(
            @PathVariable String id,
            @RequestBody Camera partial
    ) {
        return service.updatePartial(id, partial);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
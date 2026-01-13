package com.cityverse.backend.services;

import com.cityverse.backend.models.Camera;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.List;

import org.springframework.stereotype.Service;

// Service for managing camera data: load, add, and delete cameras stored in a JSON file
@Service
public class CameraService extends JsonFileService<Camera> {

    // Initialize service with cameras.json file and type reference
    public CameraService() {
        super("data/cameras.json", new TypeReference<List<Camera>>() {});
    }

    // Get all stored cameras
    public List<Camera> getAll() {
        return readAll();
    }

    // Add a new camera and save to file
    public void add(Camera c) {
        List<Camera> list = readAll();   // Read existing cameras
        list.add(c);                     // Add new camera
        System.err.println("Adding camera: " + c.getId()); // Log for debugging
        writeAll(list);                  // Persist updated list
    }

    // Delete a camera by ID and update file
    public void delete(String id) {
        List<Camera> list = readAll();
        list.removeIf(c -> c.getId().equals(id)); // Remove matching camera
        writeAll(list);                           // Persist changes
    }
}

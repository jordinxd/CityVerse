package com.cityverse.backend.services;

import com.cityverse.backend.models.Camera;
import com.cityverse.backend.repository.CameraRepository; // Let op: 'repositories' meervoud
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;

@Service
public class CameraService {

    private final CameraRepository repository;

    public CameraService(CameraRepository repository) {
        this.repository = repository;
    }

    /**
     * Retrieve all cameras from the database.
     */
    public List<Camera> getAll() {
        return repository.findAll();
    }

    /**
     * Save a new camera to the database.
     */
    public void add(Camera camera) {
        repository.save(camera);
    }

    /**
     * 1. Slaat de base64 string op als .png bestand
     * 2. Update de database met het pad
     */
    public String saveScreenshot(String agentId, String base64Image) {
    try {
        Path storageDir = Paths.get("AI_Functionality", "screenshots");
        
        if (!Files.exists(storageDir)) {
            Files.createDirectories(storageDir);
        }

        // ... Create filename and add png extention ...
        String cleanBase64 = base64Image.contains(",") ? base64Image.split(",")[1] : base64Image;
        String filename = "agent_" + agentId + "_" + System.currentTimeMillis() + ".png";
        Path destinationFile = storageDir.resolve(filename);

        // ... Base 64 to PNG ...
        byte[] imageBytes = Base64.getDecoder().decode(cleanBase64);
        try (FileOutputStream fos = new FileOutputStream(destinationFile.toFile())) {
            fos.write(imageBytes);
        }

        // ... database update ...
        Camera agent = repository.findById(agentId).orElseThrow(() -> new RuntimeException("Agent niet gevonden"));
        agent.setImagePath(destinationFile.toAbsolutePath().toString());
        repository.save(agent);

        return destinationFile.toAbsolutePath().toString();

    } catch (Exception e) {
        // ... error handling
        throw new RuntimeException(e);
    }
}

    /**
     * Update specific fields of an existing camera.
     */
    public Camera updatePartial(String id, Camera changes) {
        return repository.findById(id).map(existingCamera -> {
            
            if (changes.getPosition() != null) {
                existingCamera.setPosition(changes.getPosition());
            }

            if (changes.getRotation() != null) {
                existingCamera.setRotation(changes.getRotation());
            }

            if (changes.getImagePath() != null) {
                existingCamera.setImagePath(changes.getImagePath());
            }

            if (changes.getHeight() != null) {
                existingCamera.setHeight(changes.getHeight());
            }

            return repository.save(existingCamera);
        }).orElseThrow(() -> new RuntimeException("Camera not found with ID: " + id));
    }

    /**
     * Delete a camera by its ID.
     */
    public void delete(String id) {
        repository.deleteById(id);
    }

    public Camera findById(String id) {
    return repository.findById(id).orElse(null);
}
}
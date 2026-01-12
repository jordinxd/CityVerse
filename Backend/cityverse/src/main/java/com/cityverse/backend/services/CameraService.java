package com.cityverse.backend.services;

import com.cityverse.backend.models.Camera;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CameraService extends JsonFileService<Camera> {

    public CameraService() {
        super("data/cameras.json", new TypeReference<List<Camera>>() {});
    }

    public List<Camera> getAll() {
        return readAll();
    }

    public void add(Camera camera) {
        List<Camera> list = readAll();
        list.add(camera);
        writeAll(list);
    }

    public void delete(UUID id) {
        List<Camera> list = readAll();
        list.removeIf(c -> c.getId().equals(id));
        writeAll(list);
    }
}
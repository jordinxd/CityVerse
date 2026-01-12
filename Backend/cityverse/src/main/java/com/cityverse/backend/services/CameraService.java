package com.cityverse.backend.services;

import com.cityverse.backend.models.Camera;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public Camera updatePartial(String id, Camera changes) {
        List<Camera> list = readAll();

        for (int i = 0; i < list.size(); i++) {
            Camera current = list.get(i);

            if (current.getId().equals(id)) {

                if (changes.getPosition() != null)
                    current.setPosition(changes.getPosition());

                if (changes.getRotation() != null)
                    current.setRotation(changes.getRotation());

                if (changes.getWidth() != null)
                    current.setWidth(changes.getWidth());

                if (changes.getDepth() != null)
                    current.setDepth(changes.getDepth());

                if (changes.getHeight() != null)
                    current.setHeight(changes.getHeight());

                writeAll(list);
                return current;
            }
        }

        throw new RuntimeException("Camera not found: " + id);
    }

    public void delete(String id) {
        List<Camera> list = readAll();
        list.removeIf(c -> c.getId().equals(id));
        writeAll(list);
    }
}
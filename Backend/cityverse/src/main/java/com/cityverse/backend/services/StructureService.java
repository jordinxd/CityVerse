package com.cityverse.backend.services;

import com.cityverse.backend.models.Structure;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StructureService extends JsonFileService<Structure> {

    public StructureService() {
        super("data/structures.json", new TypeReference<List<Structure>>() {});
    }

    public List<Structure> getAll() {
        return readAll();
    }

    public void add(Structure s) {
        List<Structure> list = readAll();
        list.add(s);
        writeAll(list);
    }

    public Structure updatePartial(String id, Structure changes) {
    List<Structure> list = readAll();

    for (int i = 0; i < list.size(); i++) {
        Structure current = list.get(i);

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

            if (changes.getStyle() != null)
                current.setStyle(changes.getStyle());

            writeAll(list);
            return current;
        }
    }

    throw new RuntimeException("Structure not found: " + id);
}


    public void delete(String id) {
        List<Structure> list = readAll();
        list.removeIf(s -> s.getId().equals(id));
        writeAll(list);
    }

}

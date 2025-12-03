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

    public void delete(String id) {
        List<Structure> list = readAll();
        list.removeIf(s -> s.getId().equals(id));
        writeAll(list);
    }
}

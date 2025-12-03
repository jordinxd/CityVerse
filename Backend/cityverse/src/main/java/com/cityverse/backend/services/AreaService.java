package com.cityverse.backend.services;

import com.cityverse.backend.models.Area;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AreaService extends JsonFileService<Area> {

    public AreaService() {
        super("data/areas.json", new TypeReference<List<Area>>() {});
    }

    public List<Area> getAll() {
        return readAll();
    }

    public void add(Area area) {
        List<Area> list = readAll();
        list.add(area);
        writeAll(list);
    }

    public void delete(String id) {
        List<Area> list = readAll();
        list.removeIf(a -> a.getId().equals(id));
        writeAll(list);
    }
}

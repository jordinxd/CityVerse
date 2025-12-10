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

import com.cityverse.backend.models.Structure;
import com.cityverse.backend.services.StructureService;

@RestController
@RequestMapping("/structures")
public class StructureController {

    private final StructureService service;

    public StructureController(StructureService service) {
        this.service = service;
    }

    @GetMapping
    public List<Structure> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Structure create(@RequestBody Structure s) {
        service.add(s);
        return s;
    }

    @PutMapping("/{id}")
    public Structure updateStructure(@PathVariable String id, @RequestBody Structure updated) {
        List<Structure> list = service.getAll();

        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getId().equals(id)) {
                list.set(i, updated);
                service.writeAll(list);
                return updated;
            }
        }

        throw new RuntimeException("Structure not found: " + id);
    }


    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}

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

/*
 * REST controller responsible for handling HTTP requests related to Structure entities.
 * Acts as the API layer between clients and the StructureService.
 */
@RestController
@RequestMapping("/structures") // Base path for all structure-related endpoints
public class StructureController {

    /*
     * Service layer dependency that contains business logic
     * for creating, retrieving, updating, and deleting structures.
     */
    private final StructureService service;

    /*
     * Constructor injection of StructureService.
     * Spring automatically provides the instance at runtime.
     */
    public StructureController(StructureService service) {
        this.service = service;
    }

    /*
     * Handles HTTP GET requests to /structures
     * Returns all structures stored in the system.
     */
    @GetMapping
    public List<Structure> getAll() {
        return service.getAll();
    }

    /*
     * Handles HTTP POST requests to /structures
     * Expects a Structure object in JSON format in the request body.
     * Saves the structure and returns the created object.
     */
    @PostMapping
    public Structure create(@RequestBody Structure s) {
        service.add(s);
        return s;
    }

    /*
     * Handles HTTP PUT requests to /structures/{id}
     * Performs a partial update on the structure with the given ID.
     * Only the provided fields in the request body are modified.
     */
    @PutMapping("/{id}")
    public Structure updateStructure(
            @PathVariable String id,
            @RequestBody Structure partial
    ) {
        return service.updatePartial(id, partial);
    }

    /*
     * Handles HTTP DELETE requests to /structures/{id}
     * Deletes the structure with the specified ID.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}

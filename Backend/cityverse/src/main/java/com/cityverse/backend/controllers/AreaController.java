package com.cityverse.backend.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cityverse.backend.models.Area;
import com.cityverse.backend.services.AreaService;

/*
 * This controller exposes REST endpoints for managing Area entities.
 * It acts as the HTTP interface between clients (frontend) and the service layer.
 */
@RestController
@RequestMapping("/areas") // Base URL for all endpoints in this controller
public class AreaController {

    /*
     * Service layer dependency that contains the business logic
     * for retrieving, creating, and deleting areas.
     */
    private final AreaService service;

    /*
     * Constructor injection of AreaService.
     * Spring automatically provides an instance at runtime.
     */
    public AreaController(AreaService service) {
        this.service = service;
    }

    /*
     * Handles HTTP GET requests to /areas
     * Returns a list of all areas from the database.
     */
    @GetMapping
    public List<Area> getAll() {
        return service.getAll();
    }

    /*
     * Handles HTTP POST requests to /areas
     * Expects an Area object in the request body (JSON).
     * Saves the new area and returns the stored version.
     */
    @PostMapping
    public Area create(@RequestBody Area area) {
        Area saved = service.add(area);
        return saved;
    }

    /*
     * Handles HTTP DELETE requests to /areas/{id}
     * Deletes the area with the given ID.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {

        // Log the incoming delete request (useful for debugging)
        System.out.println("AreaController: DELETE /areas/" + id);

        // Delegate deletion to the service layer
        service.delete(id);

        // Confirm deletion in logs
        System.out.println("AreaController: Deleted area with id: " + id);
    }
}

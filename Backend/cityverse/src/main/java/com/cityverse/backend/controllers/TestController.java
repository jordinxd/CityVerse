package com.cityverse.backend.controllers;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/hello")
public Map<String, String> hello() {
    return Map.of("message", "Hello from backend!");
}

}

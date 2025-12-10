package com.cityverse.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api") // Dit zorgt dat alle URL's beginnen met /api
public class AgentController {

    @GetMapping("/run-ai")
    public String runAi() {
        try {
            String pythonScriptPath = "C:\\Users\\karst\\Documents\\GitHub\\CityVerse\\AI_Functionality\\ai.py";
            ProcessBuilder pb = new ProcessBuilder("python", pythonScriptPath);
            
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader in = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String jsonOutput = in.lines().collect(Collectors.joining());
            
            return jsonOutput;

        } catch (Exception e) {
            e.printStackTrace();
            // Stuur een foutmelding terug in JSON formaat zodat de frontend niet crasht
            return "{\"quality_of_life_score\": 0, \"justification\": \"Server error: Kon Python script niet starten.\"}";
        }
    }
}
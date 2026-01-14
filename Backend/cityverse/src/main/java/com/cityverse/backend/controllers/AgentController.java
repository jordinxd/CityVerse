package com.cityverse.backend.controllers;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api") // Dit zorgt dat alle URL's beginnen met /api
public class AgentController {

    @GetMapping("/run-ai")
    public String runAi() {
        try {
            Path scriptPath = findScriptPath();

            // macOS/Linux convention: python3
            // Set in IntelliJ Run Config (macOS): PYTHON_BIN=/opt/homebrew/bin/python3
            // Set in Windows Run Config: PYTHON_BIN=python (or full path if needed)
            String pythonBin = System.getenv().getOrDefault("PYTHON_BIN", "python3");

            ProcessBuilder pb = new ProcessBuilder(pythonBin, scriptPath.toString());
            pb.redirectErrorStream(true);

            Process p = pb.start();

            String output;
            try (BufferedReader in = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                output = in.lines().collect(Collectors.joining("\n"));
            }

            int exit = p.waitFor();
            if (exit != 0) {
                return "{\"quality_of_life_score\": 0, \"justification\": \"Python failed (exit "
                        + exit + "). Output: " + escapeJson(output) + "\"}";
            }

            return output;

        } catch (Exception e) {
            e.printStackTrace();
            // Stuur een foutmelding terug in JSON formaat zodat de frontend niet crasht
            return "{\"quality_of_life_score\": 0, \"justification\": \"Server error: Kon Python script niet starten.\"}";
        }
    }

    /**
     * Finds AI_Functionality/ai.py by walking upwards from the current working directory.
     * This avoids hardcoding paths and works regardless of where the backend is started from.
     */
    private static Path findScriptPath() throws Exception {
        Path dir = Paths.get("").toAbsolutePath(); // current working dir
        for (int i = 0; i < 10; i++) { // search up to 10 levels
            Path candidate = dir.resolve("AI_Functionality").resolve("ai.py");
            if (Files.exists(candidate)) return candidate;

            Path parent = dir.getParent();
            if (parent == null) break;
            dir = parent;
        }

        throw new Exception("Could not find AI_Functionality/ai.py starting from: " +
                Paths.get("").toAbsolutePath());
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}

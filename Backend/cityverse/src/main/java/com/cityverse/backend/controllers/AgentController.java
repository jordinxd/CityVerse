package com.cityverse.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class AgentController {

    @GetMapping("/run-ai")
    public String runAi() {
        try {
            // 1. Get project root directory (where Spring Boot is started)
            Path projectRoot = Paths.get(System.getProperty("user.dir"));

            // 2. Build path to AI script dynamically
            Path pythonScriptPath = projectRoot
                    .resolve("AI_Functionality")
                    .resolve("ai.py");

            // 3. Start Python process
            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    pythonScriptPath.toAbsolutePath().toString()
            );

            pb.redirectErrorStream(true);
            Process p = pb.start();

            // 4. Read output
            BufferedReader in = new BufferedReader(
                    new InputStreamReader(p.getInputStream())
            );

            String jsonOutput = in.lines().collect(Collectors.joining());

            return jsonOutput;

        } catch (Exception e) {
            e.printStackTrace();

            return """
            {
              "quality_of_life_score": 0,
              "justification": "Server error: Kon Python script niet starten."
            }
            """;
        }
    }
}

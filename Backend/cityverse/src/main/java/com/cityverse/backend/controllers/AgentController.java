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
            Path projectRoot = Paths.get(System.getProperty("user.dir"));

            Path pythonScriptPath = projectRoot
                    .resolve("AI_Functionality")
                    .resolve("ai.py");

            ProcessBuilder pb = new ProcessBuilder(
                    "python",
                    pythonScriptPath.toAbsolutePath().toString()
            );

            pb.redirectErrorStream(true);
            Process p = pb.start();

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

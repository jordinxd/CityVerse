package com.cityverse.backend.controllers;

import com.cityverse.backend.models.LlmAnalysisEntity;
import com.cityverse.backend.repository.LlmAnalysisRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
@RequestMapping("/api")
public class AgentController {

    private final LlmAnalysisRepository llmAnalysisRepository;

    public AgentController(LlmAnalysisRepository llmAnalysisRepository) {
        this.llmAnalysisRepository = llmAnalysisRepository;
    }

    @GetMapping("/run-ai")
    public String runAi(@RequestParam Integer polygonId) {
        String jsonOutput;

        try {
            // Run the Python AI script
            jsonOutput = runPythonAiScript();

            // Parse the output minimally to check if it's an error
            boolean isError = jsonOutput.contains("\"quality_of_life_score\": -1")
                    && jsonOutput.contains("Systeem Error");

            // Only save if it's not an error
            if (!isError) {
                LlmAnalysisEntity analysis = new LlmAnalysisEntity();
                analysis.setPolygonId(polygonId);
                analysis.setAnalysis(jsonOutput);
                llmAnalysisRepository.save(analysis);
            }

        } catch (Exception e) {
            e.printStackTrace();
            jsonOutput = """
        {
            "quality_of_life_score": 0,
            "justification": "Server error: AI script failed."
        }
        """;
        }

        return jsonOutput;
    }


    private String runPythonAiScript() throws Exception {
        Path projectRoot = Paths.get(System.getProperty("user.dir"));
        Path pythonScriptPath = projectRoot.resolve("AI_Functionality").resolve("ai.py");

        ProcessBuilder pb = new ProcessBuilder(
                "python",
                pythonScriptPath.toAbsolutePath().toString()
        );
        pb.redirectErrorStream(true);

        Process process = pb.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            return reader.lines().collect(Collectors.joining());
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

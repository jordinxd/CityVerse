package com.cityverse.backend.controllers;

import com.cityverse.backend.models.LlmAnalysisEntity;
import com.cityverse.backend.repository.LlmAnalysisRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;

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

            // Save the result to the database
            LlmAnalysisEntity analysis = new LlmAnalysisEntity();
            analysis.setPolygonId(polygonId);
            analysis.setAnalysis(jsonOutput);
            llmAnalysisRepository.save(analysis);

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
}

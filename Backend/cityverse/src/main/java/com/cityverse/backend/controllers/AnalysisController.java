package com.cityverse.backend.controllers;

import com.cityverse.backend.models.LLMAnalysis;
import com.cityverse.backend.repository.LLMAnalysisRepository;
import com.cityverse.backend.services.CameraService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;

/**
 * Controller responsible for handling AI analysis requests.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS},
             allowCredentials = "true")

public class AnalysisController {

    private final LLMAnalysisRepository llmAnalysisRepository;
    private final CameraService cameraService;

    public AnalysisController(LLMAnalysisRepository llmAnalysisRepository, CameraService cameraService) {
        this.llmAnalysisRepository = llmAnalysisRepository;
        this.cameraService = cameraService;
    }

    public static class AnalysisRequest {
        public String agentId;
        public String imageBase64;
    }

    @PostMapping("/analyze-pov")
    public String runAi(@RequestBody AnalysisRequest request) {
        String jsonOutput;

        try {
            // 1. Save screenshot locally
            String savedFilePath = cameraService.saveScreenshot(request.agentId, request.imageBase64);
            String absoluteImagePath = new File(savedFilePath).getAbsolutePath();

            // 2. Run Python script with the image path
            jsonOutput = runPythonAiScript(absoluteImagePath);

            // 3. Validate output
            boolean isError = jsonOutput == null || 
                              jsonOutput.trim().isEmpty() || 
                              jsonOutput.contains("System Error") ||
                              jsonOutput.contains("Java Error");

            // 4. Save to DB if successful
            if (!isError) {
                LLMAnalysis analysis = new LLMAnalysis();
                analysis.setAgentId(request.agentId);
                analysis.setResponse(jsonOutput);
                llmAnalysisRepository.save(analysis);
            }

        } catch (Exception e) {
            e.printStackTrace();
            
            String safeMessage = e.getMessage() == null ? "Onbekende fout" : e.getMessage();
            safeMessage = safeMessage
                    .replace("\\", "\\\\")  // Vervang enkele \ door dubbele \\
                    .replace("\"", "'")     // Vervang dubbele quotes door enkele
                    .replace("\r", " ")     // Verwijder enters
                    .replace("\n", " ");
            
            jsonOutput = String.format("""
            {
                "quality_of_life_score": 0,
                "justification": "Server Error: %s"
            }
            """, safeMessage);
        }

        return jsonOutput;
    }

    @GetMapping("/analysis")
    public ResponseEntity<LLMAnalysis> getAnalysis(@RequestParam String agentId) {
        return llmAnalysisRepository.findTopByAgentIdOrderByIdDesc(agentId)
                .map(analysis -> ResponseEntity.ok(analysis)) 
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping(value = "/camera/{agentId}/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getAgentImage(@PathVariable String agentId) {
        try {
            // 1. Haal de agent op uit de DB
            var agent = cameraService.findById(agentId);
            if (agent == null || agent.getImagePath() == null) {
                return ResponseEntity.notFound().build();
            }

            // 2
            File imgFile = new File(agent.getImagePath());

            if (!imgFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            // 3. Stuur de bytes terug naar de browser
            byte[] imageBytes = Files.readAllBytes(imgFile.toPath());
            return ResponseEntity.ok(imageBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private String runPythonAiScript(String imagePath) throws Exception {
        Path pythonScriptPath = findScriptPath();
        
        String pythonCommand = System.getProperty("os.name").toLowerCase().contains("win") ? "python" : "python3";

        ProcessBuilder pb = new ProcessBuilder(
                pythonCommand,
                pythonScriptPath.toAbsolutePath().toString(),
                imagePath
        );
        
        pb.redirectErrorStream(true);

        Process process = pb.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String output = reader.lines().collect(Collectors.joining("\n"));
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                System.err.println("Python Script Error Output: " + output);
                throw new Exception("Python script failed with exit code " + exitCode);
            }
            
            return output;
        }
    }

    /**
     * Zoekt naar het script op de locatie: Backend/cityverse/AI_Functionality/ai.py
     */
    private static Path findScriptPath() throws Exception {
        Path rootDir = Paths.get("").toAbsolutePath();
        
        // OPTIE 1: De structuur zoals je vroeg (vanaf de root van de repo)
        // Pad: Backend/cityverse/AI_Functionality/ai.py
        Path scriptPath = rootDir
                .resolve("AI_Functionality")
                .resolve("ai.py");

        // OPTIE 2: Fallback voor als je project al geopend is IN de 'Backend' map
        // Pad: cityverse/AI_Functionality/ai.py
        if (!Files.exists(scriptPath)) {
            Path fallbackPath = rootDir
                .resolve("Backend")
                    .resolve("cityverse")
                    .resolve("AI_Functionality")
                    .resolve("ai.py");
            
            if (Files.exists(fallbackPath)) {
                return fallbackPath;
            }
            
            throw new Exception("Script not found at: " + scriptPath);
        }

        return scriptPath;
    }
}
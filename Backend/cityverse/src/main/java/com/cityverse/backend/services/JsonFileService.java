package com.cityverse.backend.services;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonFileService<T> {

    private final ObjectMapper mapper = new ObjectMapper();
    private final File file;
    private final TypeReference<List<T>> typeReference;

    public JsonFileService(String path, TypeReference<List<T>> typeReference) {
        // Resolve to absolute path: use project root data directory or user home as fallback
        // First try to find the project root by looking for a data directory
        File projectRoot = findProjectRoot();
        File baseDir = new File(projectRoot, "data");
        
        System.out.println("JsonFileService: projectRoot=" + projectRoot.getAbsolutePath());
        System.out.println("JsonFileService: checking baseDir=" + baseDir.getAbsolutePath() + " exists=" + baseDir.exists());
        
        // Fallback to user home if project data dir doesn't exist
        if (!baseDir.exists()) {
            System.out.println("JsonFileService: project data dir not found, falling back to home directory");
            baseDir = new File(System.getProperty("user.home"), ".cityverse-data");
        }
        
        if (!baseDir.exists()) {
            baseDir.mkdirs();
        }
        String fileName = new File(path).getName(); // Extract "areas.json" or "structures.json"
        this.file = new File(baseDir, fileName);
        this.typeReference = typeReference;
        
        System.out.println("JsonFileService: Using file=" + this.file.getAbsolutePath());
        
        // If the external file doesn't exist, attempt to copy the default
        // resource packaged under `src/main/resources` to a writable file
        // so the application can read and update it at runtime.
        if (!this.file.exists()) {
            try (InputStream is = Thread.currentThread()
                    .getContextClassLoader()
                    .getResourceAsStream(path)) {
                if (is != null) {
                    Files.copy(is, this.file.toPath(), StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("JsonFileService: Initialized " + this.file.getAbsolutePath());
                }
            } catch (IOException e) {
                // If copying fails, we'll fall back to returning empty lists on read
                System.err.println("JsonFileService: Failed to initialize " + this.file.getAbsolutePath());
                e.printStackTrace();
            }
        } else {
            System.out.println("JsonFileService: Using existing " + this.file.getAbsolutePath());
        }
    }

    public List<T> readAll() {
        try {
            if (!file.exists() || file.length() == 0) return new ArrayList<>();
            return mapper.readValue(file, typeReference);
        } catch (IOException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public void writeAll(List<T> list) {
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(file, list);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Find the CityVerse project root by searching for the Backend/cityverse subdirectory.
     * This ensures we find the correct project root, not a local data dir.
     */
    private static File findProjectRoot() {
        File current = new File(".").getAbsoluteFile();
        int depth = 0;
        while (current != null && depth < 10) {
            // Look for the CityVerse project root: it should contain both Backend/ and data/
            File backend = new File(current, "Backend");
            File data = new File(current, "data");
            
            // The real root has Backend/cityverse subdirectory
            File backendCityverse = new File(current, "Backend/cityverse");
            if (backendCityverse.exists() && backendCityverse.isDirectory() && data.exists()) {
                System.out.println("JsonFileService: Found project root at: " + current.getAbsolutePath());
                return current;
            }
            
            current = current.getParentFile();
            depth++;
        }
        // Fallback: return current directory but mark it as potentially wrong
        File fallback = new File(".").getAbsoluteFile();
        System.out.println("JsonFileService: WARNING - Could not find project root, using fallback: " + fallback.getAbsolutePath());
        return fallback;
    }
}

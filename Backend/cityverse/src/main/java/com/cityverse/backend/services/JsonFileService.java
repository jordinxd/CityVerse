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
        this.file = new File(path);
        this.typeReference = typeReference;
        // If the external file doesn't exist, attempt to copy the default
        // resource packaged under `src/main/resources` to a writable file
        // so the application can read and update it at runtime.
        if (!this.file.exists()) {
            try (InputStream is = Thread.currentThread()
                    .getContextClassLoader()
                    .getResourceAsStream(path)) {
                if (is != null) {
                    File parent = this.file.getParentFile();
                    if (parent != null && !parent.exists()) parent.mkdirs();
                    Files.copy(is, this.file.toPath(), StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                // If copying fails, we'll fall back to returning empty lists on read
                e.printStackTrace();
            }
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
}

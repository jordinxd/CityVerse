import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

const AREAS_FILE = "./data/areas.json";

function readAreas() {
    try {
        return JSON.parse(fs.readFileSync(AREAS_FILE, "utf8"));
    } catch (err) {
        console.error("Error reading areas.json:", err);
        return [];
    }
}

function writeAreas(areas) {
    fs.writeFileSync(AREAS_FILE, JSON.stringify(areas, null, 2));
}

// TEST endpoint
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from the backend!" });
});

// GET all areas
app.get("/areas", (req, res) => {
    const areas = readAreas();
    res.json(areas);
});

// POST new area
app.post("/areas", (req, res) => {
    const area = req.body;

    if (!area || !area.name || !Array.isArray(area.polygon)) {
        return res.status(400).json({ error: "Invalid area payload" });
    }

    const areas = readAreas();
    areas.push(area);
    writeAreas(areas);

    res.status(201).json(area);
});

app.listen(PORT, () => {
    console.log(`Backend is running on http://localhost:${PORT}`);
});

import { Router } from "express";
import fs from "fs";

const router = Router();
const FILE = "./data/areas.json";

const read = () => {
    try {
        const data = fs.readFileSync(FILE, "utf8");

        // If file is empty or only whitespace, return empty array
        if (!data.trim()) return [];

        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading", FILE, ":", err);
        return [];
    }
};


const write = (data) => {
    try {
        fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing", FILE, ":", err);
    }
};

// GET all areas
router.get("/", (req, res) => {
    res.json(read());
});

// CREATE new area
router.post("/", (req, res) => {
    const area = req.body;

    if (!area || !area.name || !Array.isArray(area.polygon)) {
        return res.status(400).json({ error: "Invalid area payload" });
    }

    const areas = read();
    areas.push(area);
    write(areas);

    res.status(201).json(area);
});

// OPTIONAL — DELETE an area (we’ll use this soon)
router.delete("/:id", (req, res) => {
    const areas = read();
    const updated = areas.filter(a => a.id !== req.params.id);
    write(updated);

    res.json({ message: "Area deleted" });
});

export default router;

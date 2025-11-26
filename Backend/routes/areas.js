import { Router } from "express";
import fs from "fs";

const router = Router();
const FILE = "./data/areas.json";

const read = () => {
    try {
        return JSON.parse(fs.readFileSync(FILE, "utf8"));
    } catch (err) {
        console.error("Error reading areas.json:", err);
        return [];
    }
};

const write = (data) =>
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

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

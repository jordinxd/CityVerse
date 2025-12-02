import { Router } from "express";
import fs from "fs";

const router = Router();
const FILE = "./data/structures.json";

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

router.get("/", (req, res) => {
    res.json(read());
});

router.post("/", (req, res) => {
    const structures = read();
    const s = req.body;

    if (!s || !Array.isArray(s.position)) {
        return res.status(400).json({ error: "Invalid structure" });
    }

    structures.push(s);
    write(structures);

    res.status(201).json(s);
});

router.delete("/:id", (req, res) => {
    const list = read();
    const filtered = list.filter(x => x.id !== req.params.id);
    write(filtered);
    res.json({ message: "Structure deleted" });
});

export default router;

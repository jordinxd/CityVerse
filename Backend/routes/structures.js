import { Router } from "express";
import fs from "fs";

const router = Router();
const FILE = "./data/structures.json";

const read = () => JSON.parse(fs.readFileSync(FILE, "utf8"));
const write = (data) => fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

router.get("/", (req, res) => {
    res.json(read());
});

router.post("/", (req, res) => {
    console.log("POST /structures received:", req.body);
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
    res.json({ message: "Deleted" });
});

export default router;

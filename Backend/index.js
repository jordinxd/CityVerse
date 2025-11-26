import express from "express";
import cors from "cors";

import areasRoute from "./routes/areas.js";
import structuresRoute from "./routes/structures.js";

const app = express();
const PORT = 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Mount routes cleanly
app.use("/areas", areasRoute);
app.use("/structures", structuresRoute);

// Test endpoint
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from the backend!" });
});

app.listen(PORT, () => {
    console.log(`Backend is running on http://localhost:${PORT}`);
});

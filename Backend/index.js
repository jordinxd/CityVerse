import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

// Allow all origins (development only)
app.use(cors({
    origin: "*"
}));

app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from the backend!" });
});

app.listen(PORT, () => {
    console.log(`Backend is running on http://localhost:${PORT}`);
});

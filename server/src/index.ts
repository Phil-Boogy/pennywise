import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import "./db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: "http://localhost:5173", // Vite's default dev port
    credentials: true, // allows cookies to be sent cross-origin (needed for JWT refresh tokens later)
}));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
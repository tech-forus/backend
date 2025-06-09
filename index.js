// index.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import adminRoute from "./routes/adminRoute.js";
import connectDatabase from "./db/db.js";
import authRoute from "./routes/authRoute.js";
import transporterRoute from "./routes/transporterRoute.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────
app.use(morgan("dev"));
app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── DATABASE ────────────────────────────────────────────────────────────────
connectDatabase();


// ─── EXISTING AUTH ROUTES ────────────────────────────────────────────────────
app.use("/api/auth", authRoute);
app.use("/api/transporter", transporterRoute);
app.use("/api/admin", adminRoute);

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});

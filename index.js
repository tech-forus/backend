// index.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import adminRoute from "./routes/adminRoute.js";
import connectDatabase from "./db/db.js";
import authRoute from "./routes/authRoute.js";
import transporterRoute from "./routes/transporterRoute.js";
import biddingRoute from "./routes/biddingRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// ─── CORS SETUP ───────────────────────────────────────────────────────────────
const allowedOrigins = ['https://peaceful-halva-d8c713.netlify.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(morgan("dev"));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── DATABASE ────────────────────────────────────────────────────────────────
connectDatabase();

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoute);
app.use("/api/transporter", transporterRoute);
app.use("/api/admin", adminRoute);
app.use("/api/bidding", biddingRoute);

// ─── FILE UPLOAD DEMO ENDPOINT ────────────────────────────────────────────────
app.post('/upload', async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No records provided'
    });
  }

  try {
    console.log("Received records:", records);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});

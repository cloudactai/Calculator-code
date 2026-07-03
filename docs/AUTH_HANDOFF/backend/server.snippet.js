// server.js wiring — graft these pieces into your Express app. ORDER MATTERS:
// CORS -> security headers -> express.json() -> mount auth routes.
//
// The two things that make cross-domain auth work:
//   1. CORS `credentials: true` and the origin reflected from FRONTEND_URL.
//   2. The frontend sending `credentials: "include"` on every fetch (see the
//      frontend wiring notes).
//
// You do NOT need cookie-parser — authMiddleware reads cookies itself.

const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./src/routes/authRoutes");

const app = express();
const REQUEST_SIZE_LIMIT = "5mb"; // room for base64 avatar uploads

// ── CORS ────────────────────────────────────────────────────────────────────
// Allow the Vercel frontend origin(s) from FRONTEND_URL (comma-separated
// FRONTEND_URLS also supported for extra/preview origins).
function getAllowedOrigins() {
  const values = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // same-origin / curl / server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true, // REQUIRED so the browser sends/receives the auth cookie
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
};

app.set("trust proxy", 1); // Render is behind a proxy; lets req.secure + req.ip work
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ── Security headers (optional but recommended) ──────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return next();
});

// ── Body parser + routes ─────────────────────────────────────────────────────
app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));

app.use("/api", authRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});

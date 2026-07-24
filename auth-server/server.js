// Auth API server (from docs/AUTH_HANDOFF/backend/server.snippet.js). ORDER
// MATTERS: CORS -> security headers -> express.json() -> mount auth routes.
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
const mattersRoutes = require("./src/routes/mattersRoutes");
const calculatorDataRoutes = require("./src/routes/calculatorDataRoutes");
const formsRoutes = require("./src/routes/formsRoutes");
const calculationReportsRoutes = require("./src/routes/calculationReportsRoutes");

const app = express();
const REQUEST_SIZE_LIMIT = "30mb"; // supports a base64-encoded completed PDF up to the 20 MB Forms limit

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
// Legacy-compatible per-user data routes (matters + saved calculations); the
// frontend's old /v1 modules point here now instead of the law-firm backend.
// Calculator reference data (tax brackets, dynamic values, child support
// tables).  No auth required — this is public reference data.  Mounted BEFORE
// mattersRoutes so that its authMiddleware doesn't block these public routes.
app.use("/v1", calculatorDataRoutes);
app.use("/v1", formsRoutes);
app.use("/v1", mattersRoutes);
app.use("/v1", calculationReportsRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── Error handler ────────────────────────────────────────────────────────────
// Without this, a CORS rejection (or any middleware throw) falls through to
// Express's default handler and returns an opaque HTML 500 page.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === "Origin not allowed by CORS") {
    return res.status(403).json({ ok: false, message: "Origin not allowed." });
  }
  // express.json() throws on unparseable bodies — client error, not ours.
  if (err && (err.type === "entity.parse.failed" || err.status === 400)) {
    return res.status(400).json({ ok: false, message: "Invalid JSON body." });
  }
  console.error("Unhandled error:", err?.message || err);
  return res.status(500).json({ ok: false, message: "Internal server error." });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});

// JWT auth middleware. Accepts the token from an `Authorization: Bearer <jwt>`
// header OR from the session cookie. Parses cookies by hand, so you do NOT need
// the cookie-parser package. Copy verbatim.
const jwt = require("jsonwebtoken");
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
const ACCESS_COOKIE_NAME = "AccessToken";
const REFRESH_COOKIE_NAME = "RefreshToken";

function getAuthToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") {
    return null;
  }
  const [scheme, token] = header.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

function getCookieToken(req, names = [AUTH_COOKIE_NAME, ACCESS_COOKIE_NAME]) {
  const rawCookie = req?.headers?.cookie;
  if (!rawCookie || typeof rawCookie !== "string") return null;
  const wanted = new Set(names);
  const cookies = rawCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const entry of cookies) {
    const eqIndex = entry.indexOf("=");
    if (eqIndex <= 0) continue;
    const name = entry.slice(0, eqIndex).trim();
    const value = entry.slice(eqIndex + 1).trim();
    if (wanted.has(name) && value) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

const DEV_BYPASS_USER_ID = process.env.DEV_BYPASS_USER_ID || null;

function authMiddleware(req, res, next) {
  const token = getAuthToken(req) || getCookieToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  // Local dev bypass: accept the fake token the frontend seeds in dev mode.
  if (token === "dev-bypass-token" && DEV_BYPASS_USER_ID) {
    req.user = { id: DEV_BYPASS_USER_ID, userId: DEV_BYPASS_USER_ID };
    req.userId = DEV_BYPASS_USER_ID;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, userId: payload.userId };
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  authMiddleware,
  getAuthToken,
  getCookieToken,
  AUTH_COOKIE_NAME,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
};

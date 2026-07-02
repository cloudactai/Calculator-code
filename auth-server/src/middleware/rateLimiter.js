// In-memory rate limiter + expiring counter. Used by authRoutes for per-IP
// request throttling and per-(ip,email) login-failure lockout. Copy verbatim.
// Note: in-memory means per-process; fine for a single Render instance. If you
// scale to multiple instances, back this with Redis instead.
function cleanupExpired(map, now) {
  for (const [key, entry] of map.entries()) {
    if (!entry || entry.expiresAt <= now) {
      map.delete(key);
    }
  }
}

function createExpiringCounter({ windowMs }) {
  const tracker = new Map();

  function increment(key) {
    const now = Date.now();
    cleanupExpired(tracker, now);
    const current = tracker.get(key);
    if (!current || current.expiresAt <= now) {
      tracker.set(key, { count: 1, expiresAt: now + windowMs });
      return 1;
    }
    current.count += 1;
    current.expiresAt = now + windowMs;
    tracker.set(key, current);
    return current.count;
  }

  function getCount(key) {
    const now = Date.now();
    cleanupExpired(tracker, now);
    const current = tracker.get(key);
    return current ? current.count : 0;
  }

  function reset(key) {
    tracker.delete(key);
  }

  return { increment, getCount, reset };
}

function createRateLimiter({
  windowMs,
  maxRequests,
  errorMessage = "Too many requests. Please try again shortly.",
  keyFn = (req) => req.ip || "unknown",
}) {
  const counter = createExpiringCounter({ windowMs });

  return function rateLimiter(req, res, next) {
    const key = keyFn(req);
    const nextCount = counter.increment(key);
    if (nextCount > maxRequests) {
      return res.status(429).json({ error: errorMessage });
    }
    return next();
  };
}

module.exports = { createRateLimiter, createExpiringCounter };

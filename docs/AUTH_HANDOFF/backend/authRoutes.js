// Personal auth routes. Mount with: app.use("/api", authRoutes)
//
// Endpoints:
//   POST /api/signup              create account (unverified) + send verify email
//   POST /api/login               email+password -> session cookies
//   POST /api/verify-email        token -> verified + auto-login (session cookies)
//   POST /api/resend-verification resend the verify email
//   POST /api/forgot-password     send reset email (generic response, no user enum)
//   POST /api/reset-password      token + new password -> update
//   GET  /api/me                  current user (auth required)
//   GET  /api/profile             profile (auth required)
//   PUT  /api/profile             update name/jobTitle/avatar (auth required)
//   POST /api/profile/password    change password (auth required)
//   POST /api/logout              clear cookies
//
// Removed vs the source project: law-firm/subscriber creation, Clio/QBO OAuth
// status, and the legacy MySQL lookups. This is a pure personal login.
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../../prismaClient");
const apiEmail = require("../services/apiEmail");
const {
  authMiddleware,
  AUTH_COOKIE_NAME,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} = require("../middleware/authMiddleware");
const {
  createRateLimiter,
  createExpiringCounter,
} = require("../middleware/rateLimiter");

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
// New accounts start unverified and must confirm via the emailed link before
// they can log in. Defaults on; set EMAIL_VERIFICATION_REQUIRED=false to disable
// (local dev without email credentials).
const EMAIL_VERIFICATION_REQUIRED =
  process.env.EMAIL_VERIFICATION_REQUIRED !== "false";
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 60;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const PROFILE_IMAGE_MAX_LENGTH = 1_500_000;
const loginFailureCounter = createExpiringCounter({
  windowMs: LOGIN_FAILURE_WINDOW_MS,
});

const authRateLimiter = createRateLimiter({
  windowMs: REQUEST_WINDOW_MS,
  maxRequests: MAX_REQUESTS_PER_IP,
  errorMessage: "Too many auth requests. Try again later.",
});

router.use(authRateLimiter);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function sendAuthError(res, err, fallbackMessage = "Internal server error.") {
  if (err?.code === "EMAIL_CONFIG" || err?.code === "EMAIL_SEND_FAILED") {
    return res.status(503).json({
      ok: false,
      message: err?.message || "Email service is unavailable.",
    });
  }
  return res.status(500).json({ ok: false, message: fallbackMessage });
}

function getLoginFailureKey(req, email) {
  return `${req.ip || "unknown"}:${normalizeEmail(email)}`;
}
function registerLoginFailure(req, email) {
  loginFailureCounter.increment(getLoginFailureKey(req, email));
}
function clearLoginFailure(req, email) {
  loginFailureCounter.reset(getLoginFailureKey(req, email));
}
function isLoginBlocked(req, email) {
  return (
    loginFailureCounter.getCount(getLoginFailureKey(req, email)) >= MAX_LOGIN_FAILURES
  );
}

// Cross-domain cookies: Secure + SameSite=None ONLY in production. Locally (http)
// this uses SameSite=Lax so it still works without HTTPS. Set NODE_ENV=production
// on Render or the browser will drop the cookie (see README §7).
function buildCookieOptions(maxAge) {
  const secure = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge,
    path: "/",
  };
}
function buildClearCookieOptions() {
  const secure = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  return { httpOnly: true, secure, sameSite: secure ? "none" : "lax", path: "/" };
}

function createAuthTokens(user) {
  const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
  const refreshToken = jwt.sign(
    { userId: user.id, tokenType: "refresh" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },
  );
  return { accessToken, refreshToken };
}

function setAuthCookies(res, tokens) {
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, buildCookieOptions(24 * 60 * 60 * 1000));
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, buildCookieOptions(30 * 24 * 60 * 60 * 1000));
  res.cookie(AUTH_COOKIE_NAME, tokens.accessToken, buildCookieOptions(24 * 60 * 60 * 1000));
}

function clearAuthCookies(res) {
  [ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, AUTH_COOKIE_NAME].forEach((name) => {
    res.clearCookie(name, buildClearCookieOptions());
  });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    jobTitle: user.jobTitle || null,
    profilePic: user.profilePic || null,
    emailVerifiedAt: user.emailVerifiedAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const ID_ONLY_USER_SELECT = { id: true };
const PUBLIC_AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  jobTitle: true,
  profilePic: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
};
const PASSWORD_AUTH_USER_SELECT = { ...PUBLIC_AUTH_USER_SELECT, passwordHash: true };
const EMAIL_FLOW_USER_SELECT = { id: true, email: true, name: true, emailVerifiedAt: true };
const PASSWORD_ONLY_USER_SELECT = { id: true, passwordHash: true };

function normalizeProfileText(value, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeProfileImage(value) {
  const image = String(value || "").trim();
  if (!image) return null;
  if (image.length > PROFILE_IMAGE_MAX_LENGTH) {
    throw new Error("Profile image is too large.");
  }
  if (!/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(image)) {
    throw new Error("Profile image format is not supported.");
  }
  return image;
}

router.post("/signup", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const name = String(req.body?.name || req.body?.user_name || "").trim();

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email and password are required." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ ok: false, message: "Invalid email format." });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: PUBLIC_AUTH_USER_SELECT,
    });
    if (existing && existing.emailVerifiedAt) {
      return res.status(409).json({
        ok: false,
        message: "An account with this email already exists. Please sign in instead.",
      });
    }

    const verificationToken = randomToken();
    const accountData = {
      name: name || existing?.name || null,
      passwordHash: await bcrypt.hash(password, 12),
      ...(EMAIL_VERIFICATION_REQUIRED
        ? {
            emailVerificationTokenHash: tokenHash(verificationToken),
            emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }
        : { emailVerifiedAt: new Date() }),
    };

    // An existing-but-unverified row means a previous signup never got confirmed
    // (e.g. the email never arrived). Reuse that row: refresh credentials + token
    // and re-send, rather than dead-ending with "already exists".
    const resumingUnverified = Boolean(existing);
    const user = resumingUnverified
      ? await prisma.user.update({
          where: { id: existing.id },
          data: accountData,
          select: PUBLIC_AUTH_USER_SELECT,
        })
      : await prisma.user.create({
          data: { email, ...accountData },
          select: PUBLIC_AUTH_USER_SELECT,
        });

    if (EMAIL_VERIFICATION_REQUIRED) {
      try {
        await apiEmail.sendVerificationEmail(
          email,
          user.name || email,
          `${frontendUrl()}/verify-email?token=${verificationToken}`,
        );
      } catch (emailErr) {
        // The verification email is the only way this account becomes usable, so
        // don't leave a brand-new unverified, unreachable row behind if it fails
        // to send. Only roll back rows we just created here.
        if (!resumingUnverified) {
          await prisma.user
            .delete({ where: { id: user.id }, select: ID_ONLY_USER_SELECT })
            .catch(() => {});
        }
        throw emailErr;
      }
    }

    return res.status(resumingUnverified ? 200 : 201).json({
      ok: true,
      message: EMAIL_VERIFICATION_REQUIRED
        ? resumingUnverified
          ? "This email is already registered but not yet verified. We've sent a new verification link — please check your inbox."
          : "Account created. Please check your email to verify your account."
        : "Account created. You can now sign in.",
      user: publicUser(user),
    });
  } catch (err) {
    console.log("POST /api/signup failed:", err?.message || err);
    return sendAuthError(res, err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Email and password are required." });
    }
    if (isLoginBlocked(req, email)) {
      return res.status(429).json({
        ok: false,
        message: "Too many failed login attempts. Try again later.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: PASSWORD_AUTH_USER_SELECT,
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      registerLoginFailure(req, email);
      return res.status(401).json({ ok: false, message: "Invalid email or password." });
    }
    // Verification is enforced on login regardless of the flag: an account can
    // never sign in while emailVerifiedAt is null.
    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        ok: false,
        message: "Please verify your email before signing in.",
      });
    }

    clearLoginFailure(req, email);
    const tokens = createAuthTokens(user);
    setAuthCookies(res, tokens);
    return res.json({
      ok: true,
      user: publicUser(user),
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    console.log("POST /api/login failed:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Internal server error." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required." });
    }

    const genericMessage = "If that email exists, a password reset link has been sent.";
    const user = await prisma.user.findUnique({
      where: { email },
      select: EMAIL_FLOW_USER_SELECT,
    });
    // Don't reveal whether the email exists / is verified.
    if (!user || !user.emailVerifiedAt) {
      return res.json({ ok: true, message: genericMessage });
    }

    const resetToken = randomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: tokenHash(resetToken),
        resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      select: ID_ONLY_USER_SELECT,
    });

    await apiEmail.sendPasswordResetEmail(
      user.email,
      user.name || user.email,
      `${frontendUrl()}/reset-password?token=${resetToken}`,
    );

    return res.json({ ok: true, message: genericMessage });
  } catch (err) {
    console.log("POST /api/forgot-password failed:", err?.message || err);
    return sendAuthError(res, err);
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ ok: false, message: "Invalid email format." });
    }

    const genericMessage =
      "If that email exists and is not yet verified, a verification email has been sent.";
    const user = await prisma.user.findUnique({
      where: { email },
      select: EMAIL_FLOW_USER_SELECT,
    });
    if (!user || user.emailVerifiedAt) {
      return res.json({ ok: true, message: genericMessage });
    }

    const verificationToken = randomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: tokenHash(verificationToken),
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      select: ID_ONLY_USER_SELECT,
    });

    await apiEmail.sendVerificationEmail(
      user.email,
      user.name || user.email,
      `${frontendUrl()}/verify-email?token=${verificationToken}`,
    );

    return res.json({ ok: true, message: "Verification email sent. Check your inbox." });
  } catch (err) {
    console.log("POST /api/resend-verification failed:", err?.message || err);
    return sendAuthError(res, err);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token || req.query?.code;
    const password = String(req.body?.password || "");

    if (!token || !password) {
      return res.status(400).json({ ok: false, message: "Token and password are required." });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
    }
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: tokenHash(token),
        resetPasswordExpiresAt: { gt: new Date() },
      },
      select: ID_ONLY_USER_SELECT,
    });
    if (!user) {
      return res.status(400).json({ ok: false, message: "Reset link is invalid or expired." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
      select: ID_ONLY_USER_SELECT,
    });

    return res.json({ ok: true, message: "Password reset successful." });
  } catch (err) {
    console.log("POST /api/reset-password failed:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Internal server error." });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token || req.query?.code;
    if (!token) {
      return res.status(400).json({ ok: false, message: "Token is required." });
    }
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash(token),
        emailVerificationExpiresAt: { gt: new Date() },
      },
      select: ID_ONLY_USER_SELECT,
    });
    if (!user) {
      return res.status(400).json({ ok: false, message: "Verification link is invalid or expired." });
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
      select: PUBLIC_AUTH_USER_SELECT,
    });

    // Log the user in on successful verification so they flow straight into the
    // app instead of being bounced to sign-in. Mirrors the login flow.
    const tokens = createAuthTokens(verifiedUser);
    setAuthCookies(res, tokens);

    return res.json({
      ok: true,
      message: "Email verified. You're now signed in.",
      user: publicUser(verifiedUser),
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    console.log("POST /api/verify-email failed:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Internal server error." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: PUBLIC_AUTH_USER_SELECT,
    });
    if (!user) {
      clearAuthCookies(res);
      return res.status(404).json({ ok: false, message: "User not found." });
    }
    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    console.log("GET /api/me failed:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Internal server error." });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: PUBLIC_AUTH_USER_SELECT,
    });
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found." });
    }
    const profile = publicUser(user);
    return res.json({ ok: true, profile, user: profile });
  } catch (err) {
    console.log("GET /api/profile failed:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Internal server error." });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const name = normalizeProfileText(req.body?.displayName || req.body?.name || req.body?.username);
    const jobTitle = normalizeProfileText(req.body?.jobTitle || req.body?.job_title);
    const hasProfilePic =
      Object.prototype.hasOwnProperty.call(req.body || {}, "profilePic") ||
      Object.prototype.hasOwnProperty.call(req.body || {}, "profile_pic");
    const profilePic = hasProfilePic
      ? normalizeProfileImage(req.body?.profilePic || req.body?.profile_pic)
      : undefined;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || null,
        jobTitle: jobTitle || null,
        ...(hasProfilePic ? { profilePic } : {}),
      },
      select: PUBLIC_AUTH_USER_SELECT,
    });

    const profile = publicUser(user);
    return res.json({ ok: true, profile, user: profile });
  } catch (err) {
    console.log("PUT /api/profile failed:", err?.message || err);
    return res.status(400).json({ ok: false, message: err?.message || "Failed to save profile." });
  }
});

router.post("/profile/password", authMiddleware, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ ok: false, message: "All password fields are required." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ ok: false, message: "New passwords do not match." });
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: PASSWORD_ONLY_USER_SELECT,
    });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ ok: false, message: "Current password is incorrect." });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
      select: ID_ONLY_USER_SELECT,
    });
    clearAuthCookies(res);
    return res.json({ ok: true, message: "Password updated." });
  } catch (err) {
    console.log("POST /api/profile/password failed:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Internal server error." });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookies(res);
  return res.json({ ok: true });
});

module.exports = router;

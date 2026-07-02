# Frontend wiring — hook your existing UI to the auth API

You already have the sign-in and create-account UI. This is exactly how to wire
the submit handlers to the backend. **Three rules apply to every call:**

1. Build the URL with `apiPath(import.meta.env.VITE_API_BACKEND_URL_X, "/api/x")`.
2. Always pass **`credentials: "include"`** (so the session cookie is sent/stored).
3. After **verify-email** and after **login**, redirect **straight to your app's
   home page** — not to any firm/Clio onboarding.

Import once per file: `import { apiPath } from "../../lib/apiUrls";`

---

## Create account (your signup form's onSubmit)

```jsx
const response = await fetch(
  apiPath(import.meta.env.VITE_API_BACKEND_URL_SIGNUP, "/api/signup"),
  {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  }
);
const data = await response.json().catch(() => ({}));
if (response.ok) {
  // Email verification is on: send them to a "check your email" screen.
  if (data?.user?.emailVerifiedAt) {
    navigate("/login", { state: { email, justRegistered: true } }); // verification disabled
  } else {
    navigate("/verify-email", { state: { email } });                // normal path
  }
} else {
  setError(data?.message || "Failed to create account.");
}
```

## Sign in (your login form's onSubmit)

```jsx
const response = await fetch(
  apiPath(import.meta.env.VITE_API_BACKEND_URL_LOGIN, "/api/login"),
  {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }
);
if (response.ok) {
  navigate("/home");            // <-- YOUR app home. (source repo used "/user-input")
} else {
  const data = await response.json().catch(() => ({}));
  if (response.status === 403 && data?.message?.includes("verify")) {
    setError("Please verify your email before signing in. Check your inbox.");
  } else {
    setError(data?.message || "Invalid email or password.");
  }
}
```

## Verify email (page at /verify-email, reads ?token= and auto-verifies)

```jsx
const token = new URLSearchParams(location.search).get("token");
// on mount, if token present:
const response = await fetch(
  apiPath(import.meta.env.VITE_API_BACKEND_URL_VERIFY_EMAIL, "/api/verify-email"),
  {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }
);
const data = await response.json().catch(() => ({}));
if (response.ok) {
  // Backend already set the session cookies -> user is signed in.
  navigate("/home", { replace: true });   // <-- go straight to YOUR app.
  //  IMPORTANT: the source repo navigated to "/add-law-firm" here. For a personal
  //  login, send them to your app home instead — NO firm/Clio onboarding.
} else {
  setError(data?.message || "Verification link is invalid or expired.");
}
```

Resend button on that page:
```jsx
await fetch(
  apiPath(import.meta.env.VITE_API_BACKEND_URL_RESEND_VERIFICATION, "/api/resend-verification"),
  { method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }
);
```

## Forgot password → check email

```jsx
await fetch(
  apiPath(import.meta.env.VITE_API_BACKEND_URL_FORGOT_PASSWORD, "/api/forgot-password"),
  { method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }
);
navigate("/check-email", { state: { email } });
```

## Reset password (page at /reset-password, reads ?token=)

```jsx
const token = new URLSearchParams(location.search).get("token");
const response = await fetch(
  apiPath(import.meta.env.VITE_API_BACKEND_URL_RESET_PASSWORD, "/api/reset-password"),
  { method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }
);
if (response.ok) navigate("/login");
else setError((await response.json().catch(() => ({})))?.message || "Reset failed.");
```

## Session check / logout (for your app shell)

```jsx
// "Am I logged in?" — call on app load; 401 -> redirect to /login.
const res = await fetch(apiPath(import.meta.env.VITE_API_BACKEND_URL_ME, "/api/me"),
  { credentials: "include" });
const me = res.ok ? (await res.json()).user : null;

// Logout
await fetch(apiPath(import.meta.env.VITE_API_BACKEND_URL_LOGOUT, "/api/logout"),
  { method: "POST", credentials: "include" });
```

---

## Router — the auth routes you need

Reuse your existing UI components; just register these paths (react-router example):

```jsx
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="/verify-email" element={<VerifyEmail />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/check-email" element={<CheckEmail />} />
<Route path="/reset-password" element={<ResetPassword />} />
{/* ...then your actual app routes, e.g. <Route path="/home" .../> */}
```

## Env vars (frontend, on Vercel)

Only `VITE_API_BASE_URL` is required — set it to your backend host and every call
above resolves. The `VITE_API_BACKEND_URL_*` names are optional per-endpoint
overrides (see `../ENV_VARS.md`). Remember: **Vite inlines these at build time, so
redeploy after changing them.**

# Personal Sign-in & Create-Account — Method Handoff

**For the other project's Claude.** This folder is a self-contained recipe for the
sign-in / create-account system used in the CloudAct **Report-Creation** repo,
**stripped down to a personal login** — no law-firm name, no Clio, no QBO, no
onboarding steps, no legacy MySQL. Just: **create account → verify email →
auto-signed-in → straight into the app.**

The UI for the sign-in and create-account pages already exists on your side. What
you need from here is the **method**: the backend endpoints, the email sender, the
database shape, the cookie/JWT session, and exactly which **Render** and **Vercel**
env vars make it all work. Every code file in this folder is ready to copy; the
only edits are noted inline.

> This is a distilled sibling of the source repo's own handoff docs
> (`docs/EMAIL_VERIFICATION_HANDOFF.md` and `docs/CLIO_FORM9A2_AUTOMATION.md`).
> The Clio → Form 9A2 automation and the webhook/reminder-email path are
> **deliberately excluded** — see §9.

---

## Accounts & access you need (read first)

To stand up this personal app you need **three** accounts — **Git, Render, Vercel**.
You do **not** need Azure/Entra, GoDaddy/DNS, or the legacy MySQL DB, because you're
**reusing the existing `notifications@cloudforlawfirms.com` email sender**.

| Account | For | Needed? |
|---|---|---|
| **Git** (the project repo) | push the code | ✅ |
| **Render** | backend Web Service + a **new Postgres DB** + env vars | ✅ (the DB is a resource you create inside Render, not a separate account) |
| **Vercel** | frontend host + `VITE_API_BASE_URL` | ✅ |
| **Microsoft / Entra / Azure** | email app registration | ❌ not needed when reusing the mailbox |
| **GoDaddy / DNS** | SPF/DKIM/DMARC for the sender domain | ❌ already set for that domain; unchanged |
| **Legacy MySQL** | old firm/subscriber DB | ❌ removed from this personal build |

**Reusing the email sender = no Azure work.** You copy the four `EMAIL_MICROSOFT_*`
values from the existing Render service into the new one and you're done — Microsoft
Graph's app-only auth authenticates by the tenant/client/secret, **not** by which
backend sends the mail, so a new server sending from the same mailbox needs no Entra,
Exchange, or DNS changes. Full detail + the shared-secret caveat: `ENV_VARS.md`.

---

## 1. The flow (what we're building)

```
Create account (name + email + password)
        │  POST /api/signup
        ▼
Account row created, UNVERIFIED
        │  Microsoft Graph sends a branded "Verify your email" link
        ▼
User clicks the link  →  /verify-email?token=…
        │  POST /api/verify-email   (token → emailVerifiedAt set)
        ▼
Backend sets the session cookies  →  user is auto-signed-in
        ▼
Frontend redirects straight to your app's main page   ← NO add-law-firm / connect step
```

Sign-in is the same session mechanism without the email step:

```
Sign in (email + password)  →  POST /api/login  →  session cookies set  →  app page
```

Password reset is included too (forgot-password → email → reset-password), because
it reuses the exact same email sender and token pattern and you'll want it.

**Two things make this "personal, not firm":**
1. The database has **only a `User`** table — no `Subscriber`/law-firm, no Clio/QBO
   token columns, no Microsoft-connection columns, no webhook columns.
2. After verify/login the frontend goes **directly to your app**, not to an
   "Add a Law Firm" or "Connect Clio & QBO" screen.

---

## 2. Architecture at a glance

| Layer | Tech | Hosted on |
|---|---|---|
| Frontend (your existing UI) | React + Vite + react-router | **Vercel** |
| Backend API | Node + Express 5 | **Render** (Web Service) |
| Database | Postgres via Prisma (`@prisma/adapter-pg`) | **Render Postgres** (or any Postgres) |
| Auth email | **Microsoft Graph** app-only `Mail.Send` | Azure/Entra app registration |
| Session | JWT in **httpOnly cookies** (`SameSite=None; Secure` cross-domain) | — |

Frontend and backend are on **different domains** (Vercel vs Render), so the
session cookie must be `SameSite=None; Secure`. That is the single most important
gotcha — see §7.

---

## 3. Files in this folder (copy these)

### Backend (Node/Express)
| File | What it is | Copy as-is? |
|---|---|---|
| `backend/schema.prisma` | The **personal-only** `User` model (nothing else). | Yes — this is the whole DB. |
| `backend/prismaClient.js` | Prisma client wired to Postgres via the pg adapter (auto-SSL for Render). | Yes. |
| `backend/prisma.config.ts` | Prisma config pointing at the schema + `DATABASE_URL`. | Yes. |
| `backend/authMiddleware.js` | Verifies the JWT from the `Authorization` header **or** cookie. Parses cookies itself — **no `cookie-parser` needed.** | Yes. |
| `backend/rateLimiter.js` | In-memory rate limiter + login-failure counter used by the routes. | Yes. |
| `backend/microsoftGraphEmail.js` | **The Microsoft Graph email send.** OAuth client-credentials token + `sendMail` (with optional inline logo attachment). | Yes. |
| `backend/apiEmail.js` | Branded HTML email facade (verify + reset templates, inline logo, logo-less fallback). | Yes. Drop the logo import if you don't have one. |
| `backend/authRoutes.js` | **All the endpoints:** signup, login, verify-email, resend-verification, forgot/reset-password, me, profile, logout. Firm/Clio/QBO already removed. | Yes. |
| `backend/server.snippet.js` | The **exact** Express wiring: CORS with credentials, security headers, `express.json`, and `app.use("/api", authRoutes)`. Graft into your server. | Graft. |
| `backend/package.deps.md` | The npm dependencies + `start` script to add. | Follow. |

### Frontend (React)
| File | What it is |
|---|---|
| `frontend/apiUrls.js` | The `apiPath()` helper the pages use to resolve the backend URL from env vars. Copy to `src/lib/apiUrls.js`. |
| `frontend/AUTH_WIRING.md` | How to hook your **existing** sign-in / create-account UI to the endpoints (fetch snippets, `credentials:"include"`, and the redirect targets to change). |

### Env vars
| File | What it is |
|---|---|
| `ENV_VARS.md` | The exact **Render** and **Vercel** env-var checklist, with which are required vs optional and how to fill each. **Start here when you're ready to deploy.** |

You also need one binary asset if you want the logo in emails:
`backend/src/services/email/assets/<your-logo>.png` (see `apiEmail.js`). Emails
send fine without it — the facade falls back to a text wordmark.

---

## 4. Backend setup steps

1. **Install deps** (see `backend/package.deps.md`):
   `express cors bcryptjs jsonwebtoken @prisma/client @prisma/adapter-pg pg dotenv`
   and dev-dep `prisma`.
2. **Drop in the files** from `backend/` at the matching paths in your API:
   - `schema.prisma` → `prisma/schema.prisma`
   - `prisma.config.ts` → `prisma.config.ts`
   - `prismaClient.js` → `prismaClient.js`
   - `authMiddleware.js` → `src/middleware/authMiddleware.js`
   - `rateLimiter.js` → `src/middleware/rateLimiter.js`
   - `microsoftGraphEmail.js` → `src/services/email/microsoftGraphEmail.js`
   - `apiEmail.js` → `src/services/apiEmail.js`
   - `authRoutes.js` → `src/routes/authRoutes.js`
3. **Wire the server** using `server.snippet.js` (CORS + `express.json` + mount the
   routes at `/api`). Order matters: CORS first, then `express.json()`, then
   `app.use("/api", authRoutes)`.
4. **Create the DB tables:** run `npx prisma migrate dev --name init` locally
   (creates the migration), commit it. In production the `start` script runs
   `npx prisma migrate deploy` automatically.
5. **Set the env vars** (§6 + `ENV_VARS.md`) locally in a `.env` and on Render.

## 5. Frontend setup steps

1. Copy `frontend/apiUrls.js` to `src/lib/apiUrls.js`.
2. In your **existing** create-account and sign-in components, wire the submit
   handlers to the endpoints exactly as shown in `frontend/AUTH_WIRING.md`. The
   critical bits: **`credentials: "include"`** on every fetch, and the
   `apiPath(import.meta.env.VITE_API_BACKEND_URL_X, "/api/x")` pattern.
3. Add routes for `/verify-email`, `/forgot-password`, `/reset-password` (you can
   reuse your UI). After **verify** and after **login**, redirect to **your app's
   home page** — *not* to any firm/Clio onboarding.
4. Set the frontend env var(s) on Vercel (§6).

---

## 6. Environment variables (the part you must not guess)

Full details + how to obtain each value are in **`ENV_VARS.md`**. Summary:

### Backend — set on **Render** (Service → Environment)
```
DATABASE_URL=postgres://…                 # Postgres connection string
JWT_SECRET=<long random string>           # signs the session JWTs
FRONTEND_URL=https://<your-vercel-domain> # CORS allow-list + email link base
NODE_ENV=production                        # REQUIRED: makes cookies Secure+SameSite=None

# Microsoft Graph email sender:
EMAIL_MICROSOFT_TENANT_ID=…
EMAIL_MICROSOFT_CLIENT_ID=…
EMAIL_MICROSOFT_CLIENT_SECRET=…            # EXPIRES — see ENV_VARS.md §"secret expiry"
EMAIL_MICROSOFT_SENDER_EMAIL=notifications@yourdomain.com

# Optional:
# EMAIL_VERIFICATION_REQUIRED=false        # dev only: skip the email step
# AUTH_COOKIE_NAME=auth_token              # override cookie name if you like
```

### Frontend — set on **Vercel** (Project → Settings → Environment Variables)
```
VITE_API_BASE_URL=https://<your-render-backend-host>
```
That single var is enough — every endpoint resolves through it. The per-endpoint
`VITE_API_BACKEND_URL_*` vars are **optional overrides**; if you set even one, it
**overrides** `VITE_API_BASE_URL` for that call, so either set them all to the same
backend host or don't set them at all. (This exact mismatch bit the source repo —
see §7.)

> **Reusing the CloudAct email sender (the chosen plan):** don't create anything in
> Microsoft. Have the user copy the four `EMAIL_MICROSOFT_*` values from the
> **existing** `report-creation-q1m0` Render service (Environment tab — the secret
> value is viewable there) and paste them into the new project's Render service. The
> sender mailbox and domain are unchanged, so **no Entra/Azure/DNS work is needed.**
> The only shared-secret caveat and the (optional) way to split them later are in
> `ENV_VARS.md`. These values are intentionally **not** written into this repo, since
> committing a secret would leak it.

---

## 7. Gotchas — read before you debug

1. **Cross-domain cookies need `NODE_ENV=production`.** The cookie options in
   `authRoutes.js` set `secure` + `sameSite:"none"` **only when `NODE_ENV` is
   `production`**. On Render you must set `NODE_ENV=production` or the browser will
   drop the session cookie and the user "logs in" but every `/api/me` returns 401.
   Locally (http) it uses `sameSite:"lax"` so it still works.

2. **CORS must send credentials AND name the exact origin.** The server sets
   `credentials: true` and reflects only origins in `FRONTEND_URL`. A trailing
   slash or `http` vs `https` mismatch = blocked request. `FRONTEND_URL` must be
   the exact Vercel origin (e.g. `https://app.example.com`, no trailing slash).

3. **The per-endpoint env-var override trap.** On the frontend, any
   `VITE_API_BACKEND_URL_*` that's set **wins over** `VITE_API_BASE_URL` for that
   call. If one is left pointing at an old/dead host, that single call silently
   talks to the wrong backend while everything else works. Rule: set only
   `VITE_API_BASE_URL`, or point every per-endpoint var at the same host.

4. **The Microsoft client secret EXPIRES.** `EMAIL_MICROSOFT_CLIENT_SECRET` is an
   Azure app secret (6–24 mo). When it expires, **all** verify/reset emails stop
   (`Microsoft Graph token request failed: 401`). Rotate it in Entra → App
   registrations → Certificates & secrets, then update it on Render. Record the
   expiry and set a reminder. (See `ENV_VARS.md`.)

5. **Verification is enforced at login regardless of the flag.** `login` returns
   403 if `emailVerifiedAt` is null. `EMAIL_VERIFICATION_REQUIRED=false` only makes
   *new signups* start verified (for local dev); it is not a login bypass.

6. **Email deliverability depends on DNS.** SPF/DKIM/DMARC for your sender domain
   must be in place or emails land in spam. That's a domain/DNS task, not code.

---

## 8. Testing checklist

- [ ] `POST /api/signup` with a real inbox → account row created, verification email arrives.
- [ ] Click the email link → `/verify-email` → response sets cookies → you land on the app page **signed in** (check `GET /api/me` returns the user).
- [ ] Log out, `POST /api/login` → cookies set → app page.
- [ ] Wrong password 5× → `429 Too many failed login attempts`.
- [ ] Forgot password → email → reset-password → can log in with the new password.
- [ ] In the browser devtools, confirm the session cookie has `Secure` + `SameSite=None` in production.

---

## 9. What was intentionally left out

- **Law-firm / `Subscriber`** creation (`POST /api/law-firm`) and the legacy MySQL
  `apiDb` subscriber lookups — removed. No firm name anywhere.
- **Clio & QBO** OAuth, token storage columns, `GET /api/oauth/status`, connect
  screens — removed.
- **Clio webhooks → Form 9A2 reminder email** (`clioWebhooks.js`,
  `sendReportReminderEmail`, the `express.raw` webhook mount, `PendingReportLink`)
  — removed. The Microsoft Graph sender in this folder is the *same* transport that
  powered those, but here it only sends verify + reset.

If the personal app later needs any of these, they layer on top of this without
changing the auth core.

# Environment Variables — Render (backend) & Vercel (frontend)

This is the complete env-var checklist for the personal sign-in/create-account
system. Nothing here is in the code — it all lives in the hosting dashboards.

---

## Accounts & access you need

Three accounts stand up the whole app. You do **not** need Azure, GoDaddy/DNS, or the
legacy MySQL DB, because you're reusing the existing email sender (see the Microsoft
section below).

| Account | For | Needed? |
|---|---|---|
| **Git** (the project repo) | push the code | ✅ |
| **Render** | backend Web Service + a **new Postgres DB** + env vars | ✅ (the DB is a resource you create inside Render, not a separate account) |
| **Vercel** | frontend host + `VITE_API_BASE_URL` | ✅ |
| **Microsoft / Entra / Azure** | the email app registration | ❌ not needed when reusing the mailbox |
| **GoDaddy / DNS** | SPF/DKIM/DMARC for `cloudforlawfirms.com` | ❌ already set for that domain; unchanged when sending from the same mailbox |
| **Legacy MySQL** | old firm/subscriber DB | ❌ removed from this personal build |

You still need the four `EMAIL_MICROSOFT_*` **values**, but they get copied from the
existing Render service — you don't have to log into Azure to get them.

---

## Backend — Render → your Web Service → **Environment**

| Variable | Required | What to set it to | How to get it |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string. | Render Postgres → "Connections" → **Internal** URL if the DB and service are in the same Render account/region (no SSL needed), else the **External** URL (the code auto-enables SSL for `*.render.com` hosts). |
| `JWT_SECRET` | ✅ | A long random secret that signs session JWTs. | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Keep it secret; rotating it logs everyone out. |
| `FRONTEND_URL` | ✅ | The **exact** Vercel origin, no trailing slash, e.g. `https://app.example.com`. | Your Vercel project's production domain. Used for BOTH the CORS allow-list and the base of email links. |
| `NODE_ENV` | ✅ | `production` | Literal. **Must** be `production` in prod or the cross-domain session cookie is dropped (see README §7). |
| `EMAIL_MICROSOFT_TENANT_ID` | ✅ | Azure AD tenant ID (GUID). | **Reuse:** copy from the existing Render service. (From scratch: Entra → app registration → Overview → "Directory (tenant) ID".) |
| `EMAIL_MICROSOFT_CLIENT_ID` | ✅ | The app registration's client ID (GUID). | **Reuse:** copy from the existing Render service. (From scratch: Entra → App registrations → your app → Overview → "Application (client) ID".) |
| `EMAIL_MICROSOFT_CLIENT_SECRET` | ✅ | The client secret **value**. | **Reuse:** copy from the existing Render service. (From scratch: Entra → your app → Certificates & secrets → New client secret → copy the **Value** immediately.) **This expires — see below.** |
| `EMAIL_MICROSOFT_SENDER_EMAIL` | ✅ | `notifications@cloudforlawfirms.com` (same mailbox as before). | Reuse the same value. |
| `EMAIL_VERIFICATION_REQUIRED` | ⬜ optional | `false` to skip the email step (local dev only). Omit/`true` in prod. | Literal. |
| `AUTH_COOKIE_NAME` | ⬜ optional | Override the primary cookie name (default `auth_token`). | Literal. |
| `FRONTEND_URLS` | ⬜ optional | Extra comma-separated allowed origins (e.g. a preview domain). | Optional; `FRONTEND_URL` alone is usually enough. |

### Reusing the existing CloudAct email sender (the chosen plan — no Azure work)

You're sending from the same mailbox (`notifications@cloudforlawfirms.com`), so reuse
the existing Microsoft Graph app as-is:

1. Open the **existing** backend's Render service → **Environment** and copy the
   values of `EMAIL_MICROSOFT_TENANT_ID`, `EMAIL_MICROSOFT_CLIENT_ID`,
   `EMAIL_MICROSOFT_CLIENT_SECRET`, and `EMAIL_MICROSOFT_SENDER_EMAIL`.
2. Paste the same four values into the **new** project's Render service.
3. Deploy and send a test signup — the verification email should arrive.

**No Entra / Azure / Exchange / DNS changes are required, even though the emails now
come from a different backend.** Microsoft Graph's app-only (client-credentials) flow
authenticates by tenant + client + secret — **not** by which server or IP makes the
call, and there's no redirect URI or origin restriction for this flow. Same mailbox
means the existing Exchange `ApplicationAccessPolicy` already allows it; same domain
means SPF/DKIM/DMARC are already valid.

> **If you can't reveal the secret value on Render:** regenerate one in Entra
> (App registrations → the app → Certificates & secrets → New client secret) and put
> the new value in **both** the old and new services. That's the only case where
> reuse requires an Azure login.

**Shared-secret caveat (fine for now).** Both projects now use the same
`EMAIL_MICROSOFT_CLIENT_SECRET`, so when it expires **both** stop sending at once
(`Microsoft Graph token request failed: 401`) and both need the new value. The plan is
to reuse it now and split later only if needed. To split: mint a **separate** client
secret in the **same** app registration and give the new project its own value +
expiry. Record the expiry date and set a reminder either way.

### From scratch (only if you ever set up a brand-new sender instead)
Entra → App registrations → your app → API permissions → Microsoft Graph
**Application** permission **`Mail.Send`** with **admin consent**; scope it to the
sender mailbox via an Exchange **ApplicationAccessPolicy**; create a client secret and
record its 6–24 month expiry.

### Backend `start` script
Set the service's start command to run migrations then boot:
```
npx prisma migrate deploy && node server.js
```

---

## Frontend — Vercel → Project → **Settings → Environment Variables**

| Variable | Required | What to set it to |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | The backend's public host, e.g. `https://your-api.onrender.com` (no trailing slash). Every `/api/*` call resolves through this. |
| `VITE_API_BACKEND_URL_LOGIN` | ⬜ | Optional full-URL override for `/api/login`. |
| `VITE_API_BACKEND_URL_SIGNUP` | ⬜ | Optional override for `/api/signup`. |
| `VITE_API_BACKEND_URL_VERIFY_EMAIL` | ⬜ | Optional override for `/api/verify-email`. |
| `VITE_API_BACKEND_URL_RESEND_VERIFICATION` | ⬜ | Optional override for `/api/resend-verification`. |
| `VITE_API_BACKEND_URL_FORGOT_PASSWORD` | ⬜ | Optional override for `/api/forgot-password`. |
| `VITE_API_BACKEND_URL_RESET_PASSWORD` | ⬜ | Optional override for `/api/reset-password`. |
| `VITE_API_BACKEND_URL_ME` | ⬜ | Optional override for `/api/me`. |
| `VITE_API_BACKEND_URL_LOGOUT` | ⬜ | Optional override for `/api/logout`. |
| `VITE_API_BACKEND_URL_PROFILE` | ⬜ | Optional override for `/api/profile`. |

> **Recommended: set only `VITE_API_BASE_URL`.** The per-endpoint vars exist for
> flexibility, but each one that's set **overrides** the base URL for that call. If
> any is left stale/pointing elsewhere, that single request silently goes to the
> wrong backend. If you use them, point them ALL at the same host.

**Vite note:** these must be prefixed `VITE_` to be exposed to the browser, and the
frontend must be **rebuilt/redeployed** after changing them (Vite inlines them at
build time — changing them in Vercel without a redeploy does nothing).

**Vercel deploy note:** on the Hobby plan, only commits by the account owner deploy
("commit author does not have contributing access"). If a teammate needs to deploy,
upgrade to Pro or have the owner push/redeploy.

---

## Paste-over checklist (copy old → new)

Open **Render → the existing `report-creation-q1m0` service → Environment**. Four
values get copied verbatim into the new service; the rest are new/unique to this app.

| Key | Where its value comes from |
|---|---|
| `EMAIL_MICROSOFT_TENANT_ID` | **Copy** from the old Render service. |
| `EMAIL_MICROSOFT_CLIENT_ID` | **Copy** from the old Render service. |
| `EMAIL_MICROSOFT_CLIENT_SECRET` | **Copy** from the old Render service (click the reveal/eye icon). |
| `EMAIL_MICROSOFT_SENDER_EMAIL` | `notifications@cloudforlawfirms.com` (same mailbox). |
| `DATABASE_URL` | **New** — the Postgres you create for this project in Render. |
| `JWT_SECRET` | **New** — generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `FRONTEND_URL` | **New** — this project's Vercel domain (no trailing slash). |
| `NODE_ENV` | `production`. |
| `VITE_API_BASE_URL` (Vercel) | **New** — this project's Render backend host. |

> If `EMAIL_MICROSOFT_CLIENT_SECRET` won't reveal on Render, regenerate one in Entra
> (App registrations → the app → Certificates & secrets → New client secret) and set
> the new value in **both** the old and new services.

---

## Quick copy blocks

**Render (backend):**
```
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=https://<your-vercel-domain>
NODE_ENV=production
EMAIL_MICROSOFT_TENANT_ID=          # reuse: copy from existing Render service
EMAIL_MICROSOFT_CLIENT_ID=          # reuse: copy from existing Render service
EMAIL_MICROSOFT_CLIENT_SECRET=      # reuse: copy from existing Render service
EMAIL_MICROSOFT_SENDER_EMAIL=notifications@cloudforlawfirms.com
```

**Vercel (frontend):**
```
VITE_API_BASE_URL=https://<your-render-backend-host>
```

---

## Getting the real values (they're not in the repo — on purpose)

The Microsoft Graph credentials live only in the Render dashboard; they are
deliberately **not** written into this repo, because committing a secret would leak
it into git history. To reuse them, the user copies the four `EMAIL_MICROSOFT_*`
values from the existing **`report-creation-q1m0`** Render service (Environment tab —
the secret value is viewable there) into the new project's Render service, as in the
Microsoft section above. If the value can't be revealed, regenerate it in Entra and
update **both** services.

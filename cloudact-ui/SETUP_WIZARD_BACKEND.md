# Setup Wizard backend — current wiring + future decoupling

Notes for moving the setup wizard's backend off the shared report-generation
account later. Captured 2026-06-18. None of this affects the calculators, which
are live and self-contained.

## Current state
- The wizard (AddLawFirm → ConnectClio) calls the **shared Report-Creation Node
  backend** at `https://report-creation.onrender.com`.
- To let the new UI (`https://calculator-ai-ui.vercel.app`) use it, its origin was
  appended to Report-Creation's `FRONTEND_URL` / `FRONTEND_URLS` (the CORS
  allow-list) — a Render dashboard change on the **report-generation–owned**
  service. This is the access coupling we want to remove.
- Still blocked on Marc regardless of hosting: Report-Creation's `JWT_SECRET`
  must equal the legacy backend's signing secret so the Bearer `AccessToken` is
  accepted (and `userId`/`sid` must map correctly).

## The problem to fix later
Operating/configuring the wizard backend needs access to the report-generation
Render account (which holds unrelated secrets). We want the wizard backend under
the calculator / CloudAct-app team's control instead.

## Endpoints the wizard hits
| Call | Type | CORS-sensitive? |
|---|---|---|
| `POST /api/law-firm` | JSON fetch + Bearer | yes |
| `GET /api/oauth/status`, `POST /api/logout` | JSON fetch + Bearer | yes |
| `/oauth/clio/start`, `/oauth/qbo/start` | JSON fetch → returns `authUrl` | yes |
| `/oauth/clio/disconnect`, `/oauth/qbo/disconnect` | JSON fetch | yes |
| browser → `authUrl` → Clio/QBO → registered `redirect_uri` (Report-Creation `/oauth/.../callback`) → back to frontend `?oauth=clio` | full-page redirect | no (but runs *through* Report-Creation) |

## Where cloudact-ui points (env)
- `REACT_APP_SETUP_WIZARD_API_URL` — base origin; defaults to
  `report-creation.onrender.com` (see `src/config.ts` → `SETUP_WIZARD_API`).
- Per-endpoint overrides (take precedence): `REACT_APP_API_BACKEND_URL_LAW_FIRM`,
  `REACT_APP_API_BACKEND_URL_OAUTH_STATUS`, `REACT_APP_API_BACKEND_URL_LOGOUT`
  (see `src/components/SetupWizard/apiUrls.js`).

So repointing the wizard at a different backend is a **config change only** — no
code change in the UI.

## Option 1 — Proxy the JSON calls through the calculator Flask backend (small)
The browser only ever calls `calculator-code-x2b4.onrender.com` (CORS already
open, team-owned); Flask forwards server-to-server to Report-Creation. Removes
the CORS/account dependency for the `/api/*` data calls. Does **not** move OAuth.

Additive route in `app.py` (touches none of Marc's calculator functions):

```python
import requests
REPORT_CREATION = "https://report-creation.onrender.com"

@app.route("/api/<path:subpath>", methods=["GET", "POST"])
@app.route("/oauth/<path:subpath>", methods=["GET", "POST"])
def setup_wizard_proxy(subpath):
    base = "/api/" if request.path.startswith("/api/") else "/oauth/"
    r = requests.request(
        request.method, f"{REPORT_CREATION}{base}{subpath}",
        headers={"Authorization": request.headers.get("Authorization", ""),
                 "Content-Type": "application/json"},
        data=request.get_data(), params=request.args,
    )
    return (r.content, r.status_code,
            {"Content-Type": r.headers.get("Content-Type", "application/json")})
```

Then set `REACT_APP_SETUP_WIZARD_API_URL=https://calculator-code-x2b4.onrender.com`
and add `requests` to `requirements.txt`. Caveat: the Clio/QBO connect redirect
still completes on Report-Creation (see below).

## Option 2 — Run your own Report-Creation instance (full independence)
Deploy a copy of the Report-Creation Node service on a **team-owned Render
account**, then point `REACT_APP_SETUP_WIZARD_API_URL` at it. Configure on the
new instance:
- CORS allow-list = the cloudact-ui origin
- `JWT_SECRET` = legacy backend's signing secret (Marc)
- Clio/QBO client id + secret, and a database for token storage
- Register the new instance's callback URL(s) with the Clio/QBO app (or create a
  fresh Clio/QBO app for full isolation)

This is the clean version of "copy it over": copy the whole purpose-built
service, not its secrets into the stateless calculator backend.

## Why you can't just copy the secrets into the calculator backend
OAuth needs more than secrets:
1. **Callback registration** — Clio/QBO only redirect to URLs registered in their
   developer console; needs that access (or a new app). The secret doesn't grant it.
2. **Token storage** — OAuth yields access/refresh tokens that must persist; the
   Flask calculator backend is stateless (no DB).
3. **Exchange/refresh logic** — code to swap the auth code for tokens, handle
   `state`/CSRF, and refresh — i.e. reimplementing Report-Creation.
4. **Tokens must live where they're consumed** — Report-Generation uses them;
   storing them in the calculator backend orphans them from their consumer.
5. **Secret sprawl** — duplicating a client secret = more leak/rotation surface.

## New instance — full setup checklist
> ⚠️ Exact env-var names must be confirmed against the **Report-Creation repo's
> `.env.example` / README** (entry point ~ `backend/server.js`). Names below
> marked *(confirm)* are inferred from the wizard's calls, not verified.

**1. Service**
- New Render **Web Service** from the Report-Creation repo, on a **team-owned**
  Render account. Build/start per that repo (`npm install` / `npm start`).
- Note its URL, e.g. `https://cloudact-report-creation.onrender.com`.

**2. Database** (the backend persists law firms + OAuth tokens)
- Provision a DB (Render Postgres, or whatever the repo uses).
- `DATABASE_URL` *(confirm — could be a Mongo URI instead)*.
- Run its migrations/schema step. Fresh DB is fine for a clean start.

**3. Auth**
- `JWT_SECRET` = the **legacy backend's** signing secret (from **Marc**) so the
  Bearer `AccessToken` from cloudact-ui validates. Confirm it reads `userId`/`sid`
  from the token the same way.

**4. Frontend wiring**
- `FRONTEND_URL` = `https://calculator-ai-ui.vercel.app` (post-OAuth redirect target)
- `FRONTEND_URLS` = `https://calculator-ai-ui.vercel.app` (CORS allow-list; add
  `http://localhost:3000` for local dev)

**5. Clio OAuth**
- `CLIO_CLIENT_ID`, `CLIO_CLIENT_SECRET` *(confirm names)*
- `CLIO_REDIRECT_URI` = `https://<new-render>/oauth/clio/callback`
- **Register that redirect URI in the Clio developer app** (Clio only redirects to
  registered URIs). New Clio app = full isolation + fresh secrets; reusing the
  existing app = must obtain its secrets.
- `CLIO_REGION`/base URL *(confirm, if the repo supports app.clio.com vs EU/CA)*

**6. QuickBooks (QBO) OAuth**
- `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET` *(confirm names)*
- `QBO_REDIRECT_URI` = `https://<new-render>/oauth/qbo/callback`
- **Register that redirect URI in the Intuit developer app.**
- `QBO_ENVIRONMENT` sandbox vs production *(confirm)*

**7. Misc** *(confirm from repo)*
- `NODE_ENV=production`; `PORT` (Render injects — app must read `process.env.PORT`).
- `SESSION_SECRET` / cookie settings if it uses sessions.
- Any encryption key if it encrypts stored tokens at rest.

**8. Point the UI at it**
- Vercel `calculator-ai-ui` project → set `REACT_APP_SETUP_WIZARD_API_URL` =
  `https://<new-render>` → redeploy. (No UI code change needed.)

**Secret sourcing:** to avoid the report-generation account entirely, create
**your own Clio + Intuit developer apps** (fresh client id/secret, your own
redirect URIs). Reusing the existing apps means copying their secrets, which
still requires access to where those live. `JWT_SECRET` comes from Marc either way.

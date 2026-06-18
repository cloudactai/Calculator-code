# CloudAct UI — Migration & Release Handoff

Context for continuing the cloudact-ui migration + release. Read this first.

## What this is
We migrated the full CloudAct React app (the old `cloudact-frontend-main`) into
the **Calculator-code** repo under `cloudact-ui/`, to release it on a new domain
alongside Marc's AI calculator. Marc's Flask calculator and his static
`frontend/` chat UI are untouched.

## Repo / branch
- Repo: `github.com/cloudactai/Calculator-code`
- Branch: **`frontend-domain-migration`** (NOT merged to main yet)
- App lives in: `cloudact-ui/` (Create React App, React 17, react-router-dom v5)
- Local path: `/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code`
  (note the trailing space in `Frontend ` — quote the path)

## What's been done (all committed + pushed on the branch)
1. Migrated the React app into `cloudact-ui/`, secrets moved to env vars.
2. Signup crash fix (missing `type` in a Redux dispatch).
3. Dev-only auth bypass: `REACT_APP_DEV_BYPASS_AUTH=true` in `cloudact-ui/.env`
   signs you in as a fake ADMIN so the UI can be browsed with no backend
   (`npm start` only; inert in production builds).
4. `vercel.json` builds with `CI=false` (CRA treats lint warnings as errors on CI).
5. **Family Law calculators widget** (`src/components/FamilyLawChat/`): floating
   bottom-right popup for signed-in users. All **three** of Marc's calculators
   are now integrated as header tabs (matches `calculator-code` `frontend/index.html`):
   - **Child Support** — AI assistant, `POST /chat` (working)
   - **Income Tax** — AI assistant, `POST /tax-chat` (working)
   - **Spousal Support** — structured form (SSAG without-child), `POST /spousal-calculate`
     (form is built + wired; the deployed endpoint is currently broken — see note below)

   The two AI assistants keep separate conversations; switching tabs preserves
   each. (This is the headline feature.)
6. **Trimmed sidebar** (`Navbar.js`, `TRIMMED_SIDEBAR = true`): only Home +
   Family Law Tools (Matter, Calculator, Forms) + Settings/Logout.
7. **Logo** swapped to the Report-Generation `cloudact-logo.svg`.
8. **Two-step setup wizard** (`src/components/SetupWizard/`): ported faithfully
   from Report-Generation — AddLawFirm (step 1, `/setupwizard`) → ConnectClio
   (step 2, `/setupwizard/connect`). Sends the `AccessToken` as a Bearer header.

## The three backends (important)
| Backend | URL | Used by | Status |
|---|---|---|---|
| Legacy `/v1` | `api.cloudforlawfirms.com/v1` | main app: login, users, roles, SID, tasks, reports, matters | existing prod |
| Flask calculator | `calculator-code-x2b4.onrender.com` | the calculators widget: `/chat` (child support), `/tax-chat` (income tax), `/spousal-calculate` (spousal form) | `/chat` + `/tax-chat` working, CORS open; `/spousal-calculate` **broken server-side** (see note) |
| Report-Creation (Node) | `report-creation.onrender.com` | the setup wizard (`/api/*`, `/oauth/*`) | needs config (below) |

Defaults are baked into `cloudact-ui/src/config.ts`, overridable via env vars.

> **Spousal backend bug (needs Marc).** The deployed `/spousal-calculate` route
> reads `party1_net_income`/`party2_net_income` from the request but passes them
> to `calculate_spousal_support_no_children(...)`, whose signature expects
> `party1_gross_income`/`party2_gross_income` (in `spousal_support.py`). Result:
> the endpoint throws `unexpected keyword argument 'party1_net_income'` for every
> request, so the spousal form can't get a result yet. Fix is one of: rename the
> route's reads to `*_gross_income`, or rename the function params to `*_net`.
> Marc's own `frontend/spousal.html` is also out of sync (sends `party1_income`).
> The widget already sends both `*_net_income` and `*_gross_income` (same gross
> value) and reads `net_income_diff` with a `gross_income_diff` fallback, so it
> will start working as soon as the backend route/function names line up — no
> frontend change needed.

## Release plan

### Step 1 — Deploy cloudact-ui to Vercel (NEW project, not the existing one)
The existing `calculator-code` Vercel project deploys Marc's `frontend/` (chat
calculators) — DO NOT reconfigure it. Create a SEPARATE project:
- Add New → Project → import `cloudactai/Calculator-code` again
- **Root Directory = `cloudact-ui`** (the key setting)
- Framework: Create React App (auto-detected)
- Env var: `REACT_APP_ENVIRONMENT=PROD` (or `DEV` to test against dev backend)
- **Production Branch = `frontend-domain-migration`** (Settings → Git), since
  cloudact-ui isn't on `main` yet
- Deploy → get a URL like `cloudact-ui-xxx.vercel.app`

### Step 2 — Report-Creation backend config on Render (for the wizard)
On the **report-creation** Render service (NOT Calculator-code):
- `FRONTEND_URL` / `FRONTEND_URLS`: **append** the new cloudact-ui Vercel URL
  (comma-separated; keep the existing `report-generation-eta.vercel.app`). This
  is the CORS allow-list. Do this AFTER Step 1 (need the URL first).

### Step 3 — JWT / login bridging (needs Marc — the real open question)
The wizard sends the `AccessToken` (issued by the **legacy** backend) as a Bearer
token to the Report-Creation backend, which verifies it with `JWT_SECRET`.
- For it to be accepted, Report-Creation's `JWT_SECRET` must equal the **legacy
  backend's** signing secret (only Marc / the legacy server owner has it).
- Caveat: changing Report-Creation's `JWT_SECRET` re-keys it and invalidates the
  existing Report-Generation logins (one-time re-login). Coordinate with Marc.
- Also test: Report-Creation reads `userId` + `sid` from the token payload; if
  the legacy token names those differently, a one-line backend tweak is needed.

## Status summary
- **Frontend: done.** Builds clean (`CI=false npm run build`).
- **All three calculators integrated** into the bottom-right widget: Child
  Support + Income Tax (AI chats, working) and Spousal Support (form, wired —
  blocked only by the backend bug noted above).
- **Setup wizard: code complete and wired**; full function depends on the
  Report-Creation CORS update + shared JWT secret — both backend/Marc, not frontend.
- **`frontend-domain-migration` was merged to `main`** (PR #4, commit `0d72fd1`).
  Marc then added the recursive spousal work on top (`origin/main` @ `9351bb7`).
  The local `frontend-domain-migration` branch is now **behind** `origin/main`;
  the latest calculator code lives on `main`. The cloudact-ui changes in this
  session are on the local branch and not yet committed/pushed.

## How to run locally
```
cd "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/cloudact-ui"
echo "REACT_APP_DEV_BYPASS_AUTH=true" > .env   # fake-admin login, no backend
npm install && npm start
```
Land in the app → trimmed sidebar → blue chat button bottom-right (try
"I need to calculate child support"). Wizard at `/setupwizard`.

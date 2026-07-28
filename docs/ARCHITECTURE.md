# Repository architecture & deployment

This is the map of the whole system: what each piece is, where it runs, how the
pieces talk to each other, which environment variable does what, and where to look
when something breaks. Read this first if you're new to the project or you're trying
to figure out "which thing is down."

> **About the screenshots.** This doc references four dashboard screenshots that live
> in [images/](images/). If they're not there yet, save the four captures into
> `docs/images/` with these exact names:
>
> | File | What it shows |
> |---|---|
> | `render-flask-env.png` | Render → **Calculator-code** (Flask) → Environment |
> | `vercel-overview.png` | Vercel → **calculator-ai-ui** → Overview |
> | `render-auth-env.png` | Render → **Calculator-code-auth** (Node) → Environment |
> | `vercel-env.png` | Vercel → **calculator-ai-ui** → Environment Variables |
>
> The captions below describe each one in full, so the doc is still complete even
> before the images are dropped in.

---

## The big picture

There are **four** moving parts plus the git repo. Three are hosted services; one is a
database.

```mermaid
flowchart TD
    User([Lawyer's browser])

    subgraph Vercel["Vercel — calculator-ai-ui (React / CRA)"]
      UI[app.cloudforlawfirms.com<br/>the SPA]
    end

    subgraph RenderAuth["Render — Calculator-code-auth (Node/Express + Prisma)"]
      AUTH[calculator-code-auth.onrender.com<br/>/api/* auth + /v1 data]
    end

    subgraph RenderFlask["Render — Calculator-code (Python/Flask)"]
      FLASK[calculator-code-x2b4.onrender.com<br/>AI chat + report PDFs]
    end

    subgraph AWS["AWS RDS — PostgreSQL"]
      DB[(matters, forms, folders,<br/>users, tasks)]
    end

    Graph[[Microsoft Graph<br/>email sending]]

    User --> UI
    UI -->|REACT_APP_API_BASE_URL<br/>login, matters, forms, folders| AUTH
    UI -->|CALCULATOR_API<br/>/chat, /intake-chat, /download-report| FLASK
    AUTH -->|DATABASE_URL Prisma/pg over SSL| DB
    AUTH -->|EMAIL_MICROSOFT_*| Graph
```

| Piece | Tech | Host | In this repo | Public URL |
|---|---|---|---|---|
| **Frontend UI** | React (create-react-app) | **Vercel** (`calculator-ai-ui`) | [cloudact-ui/](../cloudact-ui/) | `app.cloudforlawfirms.com` (+ `calculator-ai-ui.vercel.app`) |
| **Auth + data API** | Node.js / Express 5 / Prisma | **Render** (`Calculator-code-auth`) | [auth-server/](../auth-server/) | `calculator-code-auth.onrender.com` |
| **AI / report backend** | Python / Flask / gunicorn | **Render** (`Calculator-code`) | [app.py](../app.py) + calculators | `calculator-code-x2b4.onrender.com` |
| **Database** | PostgreSQL | **AWS RDS** | schema in [auth-server/prisma/](../auth-server/prisma/) | (private, via `DATABASE_URL`) |

Everything deploys off the **`main`** branch of `cloudactai/Calculator-code`. In the
screenshots all three services are on the same commit (`e6e814b`, "Merge pull request
#58 from cloudactai/marc"), which is what "everything is in sync" looks like.

---

## 1. Frontend — Vercel (`calculator-ai-ui`)

![Vercel — calculator-ai-ui Overview](images/vercel-overview.png)

The React SPA (built from [cloudact-ui/](../cloudact-ui/)). It's the CloudAct Solutions
sign-in + the whole app the lawyer uses (Matters, Forms, calculators). Key facts from
the Overview screenshot:

- **Project:** `calculator-ai-ui` under the **CloudactAi** Vercel team (Hobby plan).
- **Production domain:** `app.cloudforlawfirms.com` (with `calculator-ai-ui.vercel.app`
  as the Vercel-generated alias).
- **Deploys on push to `main`** — "To update your Production Deployment, push to the
  main branch." Each merged PR triggers a build.
- It's a **create-react-app** build, not Vite. This matters: env vars are
  `process.env.REACT_APP_*`, inlined **at build time**. Changing an env var in Vercel
  does nothing until you **redeploy**.
- SPA routing is handled by [vercel.json](../vercel.json), which rewrites every path to
  `/index.html` so client-side React Router works on refresh.

> **Hobby-plan deploy quirk:** only commits by the account owner auto-deploy. If a
> teammate's merge doesn't deploy ("commit author does not have contributing access"),
> the owner has to push/redeploy, or the team upgrades to Pro.

### Frontend environment variables

![Vercel — Environment Variables](images/vercel-env.png)

Only two are set (screenshot 4), and that's by design — the frontend has smart
defaults in [cloudact-ui/src/config.ts](../cloudact-ui/src/config.ts) and
[cloudact-ui/src/utils/dataAxios.js](../cloudact-ui/src/utils/dataAxios.js):

| Variable | Purpose |
|---|---|
| `REACT_APP_API_BASE_URL` | Base URL of the **auth-server** (the Node service). Everything the app loads/saves — login, matters, forms, folders, task states — goes here. `dataAxios.js` normalizes it to the `/v1` data API and the same host serves `/api/*` for auth. If unset in production it falls back to `https://calculator-code-auth.onrender.com/v1`. |
| `REACT_APP_ENVIRONMENT` | Build environment tag: `DEV` / `QA` / `PROD` / `LOCAL` (marked *Sensitive*). Read in `config.ts`; selects which environment profile the app assumes. |

Two more that are **not** set here but exist as optional overrides in `config.ts`:

- `REACT_APP_CALCULATOR_API_URL` → the **Flask** backend. Unset, so it uses the baked-in
  default `https://calculator-code-x2b4.onrender.com`. This is the `CALCULATOR_API`
  the AI chat panels and report download use.
- `REACT_APP_SETUP_WIZARD_API_URL` → a legacy Report-Creation Node backend
  (`report-creation.onrender.com`), only used by the setup wizard.

> **Doc mismatch to be aware of:** the older handoff doc
> [AUTH_HANDOFF/ENV_VARS.md](AUTH_HANDOFF/ENV_VARS.md) talks about `VITE_*` variables
> and "Render Postgres." That was written for a Vite build against a Render database.
> The **current** app uses **CRA (`REACT_APP_*`)** and an **AWS** database. Trust this
> doc and the screenshots over the Vite references.

---

## 2. AI / report backend — Render (`Calculator-code`, Flask)

![Render — Calculator-code (Flask) Environment](images/render-flask-env.png)

The Python service ([app.py](../app.py), started with `web: gunicorn app:app` via
[Procfile](../Procfile)). It powers everything conversational and every generated PDF —
the child/spousal support calculators, the matter-intake agent, and the downloadable
reports. It is **stateless** and talks only to Anthropic; it does **not** touch the
database (all persistence is the frontend calling the auth-server). From the screenshot:

- **Service name:** `Calculator-code` · **Type:** Web Service · **Runtime:** Python 3 ·
  **Instance:** **Free**.
- **Service ID:** `srv-d8c47m0js32c7384tscg`.
- **Public URL:** `https://calculator-code-x2b4.onrender.com` (this is the frontend's
  `CALCULATOR_API` default).
- Deploys from `cloudactai/Calculator-code`, branch `main`.

### Its environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Auth for the Anthropic API. Every chat/report call uses it. If it's missing, expired, or over quota, **all** AI features fail (chat replies error, reports won't generate). |
| `CLAUDE_MODEL` | Which Claude model to call. Read in `app.py` as `os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")` — so if unset it defaults to `claude-sonnet-4-6`. Set it here to pin/upgrade the model without a code change. |

> **Free-instance cold starts.** A Free Render web service spins down when idle and
> takes ~30–60s to wake. That's exactly why the chat panels show *"Warming up the
> server — first reply can take ~30s…"* and why the frontend axios timeout is 75s
> ([utils/axios.js](../cloudact-ui/src/utils/axios.js)). A slow **first** message after
> a quiet period is normal, not a bug.

---

## 3. Auth + data API — Render (`Calculator-code-auth`, Node)

![Render — Calculator-code-auth Environment](images/render-auth-env.png)

The Node/Express + Prisma service ([auth-server/](../auth-server/), entry
[auth-server/server.js](../auth-server/server.js)). This is the **only** thing that
reads and writes the database. It serves two families of routes:

- `/api/*` — accounts & sessions: signup, login, verify-email, forgot/reset password,
  `/api/me`, logout. Sessions are JWTs in a cross-domain cookie.
- `/v1/*` — the app data: matters, forms, folders, task states, form-template PDFs
  (everything [cloudact-ui/src/services/formsService.js](../cloudact-ui/src/services/formsService.js)
  and the matter Redux actions call).

From the screenshot: **Service ID** `srv-d939g4vavr4c73bma26g`, name
`Calculator-code-auth`. Its **start command** runs migrations then boots:
`npx prisma migrate deploy && node server.js` (see [package.json](../auth-server/package.json)).

### Its environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string → the **AWS RDS** database (see §4). Prisma/`pg` connect through it; SSL is auto-enabled for `*.rds.amazonaws.com` hosts ([prismaClient.js](../auth-server/prismaClient.js)). This is the single most critical secret — if it's wrong/expired, the whole app can't load or save anything. |
| `JWT_SECRET` | Long random secret that signs session JWTs. **Rotating it logs everyone out.** |
| `FRONTEND_URL` | The exact Vercel origin (`https://app.cloudforlawfirms.com`, no trailing slash). Used for **CORS** *and* as the base of links in verification/reset emails. |
| `NODE_ENV` | Must be `production` in prod — otherwise the cross-domain session cookie is dropped by the browser and logins silently don't stick. |
| `EMAIL_MICROSOFT_TENANT_ID` | Microsoft Graph (Entra) tenant ID — used to **send** transactional email (verify, reset). |
| `EMAIL_MICROSOFT_CLIENT_ID` | The Graph app-registration client ID. |
| `EMAIL_MICROSOFT_CLIENT_SECRET` | The Graph app client secret. **This one expires** (see the caveat below). |
| `EMAIL_MICROSOFT_SENDER_EMAIL` | The from-address, `notifications@cloudforlawfirms.com`. |
| `EMAIL_VERIFICATION_REQUIRED` | `true`/`false` — whether new signups must verify email before use. `false` is a dev convenience, not a login bypass. |

> **Email uses Microsoft Graph.** The four `EMAIL_MICROSOFT_*` values authenticate an
> app-only (client-credentials) Microsoft Graph call with `Mail.Send` on the shared
> mailbox — that's how the auth-server sends verification/reset email. A **separate**
> doc will cover the Graph email flow in depth; for here, just know these four vars are
> the email sender's credentials and they were copied from the older `report-creation`
> Render service.
>
> **Shared-secret caveat:** the client secret is currently shared with that other
> service, so when it expires **both** stop sending at once — the tell is
> `Microsoft Graph token request failed: 401` in the logs. Record its expiry and set a
> reminder.

---

## 4. Database — AWS RDS (PostgreSQL)

The database is **PostgreSQL on AWS RDS**, reached only by the auth-server via
`DATABASE_URL`. The schema is Prisma-managed:

- Schema: [auth-server/prisma/schema.prisma](../auth-server/prisma/) — `datasource db`
  is `provider = "postgresql"`, `url = env("DATABASE_URL")`.
- Connection: [auth-server/prismaClient.js](../auth-server/prismaClient.js) wires Prisma
  through the `pg` `Pool`, and **auto-enables SSL** when the host matches
  `*.rds.amazonaws.com` (also `*.render.com` / `*.neon.tech`).
- Migrations are applied on every deploy by the start command
  (`npx prisma migrate deploy`).

It holds users/sessions plus all matter data: matters, intake sections, forms,
folders, and per-matter task states.

### If the AWS database credential/token "expires"

The connection string is a standard user/password (+ SSL) URL, so nothing expires on a
timer *inside the app*. A failure means the credential in `DATABASE_URL` stopped
working at the AWS side — a **rotated master password**, a **revoked/expired IAM
database-auth token** (if IAM auth is used, those are valid ~15 min and must be
regenerated), an RDS endpoint change, or the security group/SSL requirement changing.

**How to recognize it (symptoms, from the outside in):**

1. In the **browser**, the app loads the shell but Matters/Forms show "Unable to
   load…", and network calls to `…/v1/*` return **500** (not 401 — a 401 is a
   *login/session* problem, i.e. `JWT_SECRET`/cookie, not the DB).
2. In the **auth-server Render logs** (§ logs below) you'll see Prisma/`pg` connection
   errors — e.g. `password authentication failed for user`, `no pg_hba.conf entry`,
   `SSL required`, `getaddrinfo ENOTFOUND …rds.amazonaws.com`, or connection timeouts.
   The Flask service and its AI chat keep working (it has no DB), which is a quick way
   to confirm the fault is DB-only.
3. If the start command can't migrate, the **deploy itself fails** at
   `prisma migrate deploy`.

**Where to fix it:** update `DATABASE_URL` in **Render → Calculator-code-auth →
Environment** with the new/rotated credential (or a freshly minted IAM token), verify
the RDS endpoint/port and that its security group allows Render's egress, and redeploy.

> The exact AWS auth mechanism (static password vs. IAM database authentication vs.
> Secrets Manager rotation) isn't encoded in this repo — confirm which one this RDS
> instance uses so the runbook above can name the precise regeneration step. The
> symptoms and the "update `DATABASE_URL` + redeploy" fix hold either way.

---

## Where to look for logs

| You're debugging… | Go to |
|---|---|
| A page not loading, save failing, login issues, **DB errors** | **Render → Calculator-code-auth → Logs** (and **Events** for deploy/crash history). This is the busiest log. |
| AI chat not replying, report PDF not generating, Anthropic/model errors | **Render → Calculator-code → Logs**. Look for Anthropic 401/429 or model-name errors. |
| Email not arriving (verify/reset) | **Render → Calculator-code-auth → Logs** — search for `Microsoft Graph`. A `401` there = expired `EMAIL_MICROSOFT_CLIENT_SECRET`. |
| Build failed, wrong env var baked in, routing/404 on refresh | **Vercel → calculator-ai-ui → Deployments** (build logs) and **Logs/Observability** (runtime/edge). Remember CRA inlines env vars at build — rebuild after changing them. |
| Slow first request after idle | Expected Free-tier cold start on the Render services; check **Events** to confirm a spin-up, not a crash. |
| Database-level (slow queries, storage, connections) | **AWS RDS console** → the instance's **Monitoring**/CloudWatch and **Logs & events**. |

Both Render services also have **Shell** and **Metrics** tabs; the auth-server's Shell
is handy for running one-off Prisma commands against the live DB.

---

## How a request actually flows

- **Sign in / load matters / save a form** → browser → `REACT_APP_API_BASE_URL`
  (auth-server on Render) → Prisma → **AWS RDS**. Response comes back through the same
  chain.
- **Ask the AI / download a support report** → browser → `CALCULATOR_API` (Flask on
  Render) → Anthropic → PDF/text back. **No database involved.**
- **Sign up / reset password** → auth-server writes the user + calls **Microsoft
  Graph** to email the link (whose base is `FRONTEND_URL`).

So a useful triage shortcut: **if the AI chat works but data won't load, it's the
auth-server or the DB; if data loads but AI is dead, it's the Flask service or
Anthropic.**

---

## Deploying

1. Merge to **`main`** on `cloudactai/Calculator-code`.
2. **Vercel** auto-builds the frontend from `cloudact-ui/`.
3. **Render** builds both backend services from the same repo (each service has its own
   root/branch config). The auth-server runs `prisma migrate deploy` on boot. You can
   also **Manual Deploy** from each Render service.
4. Sanity check: the commit hash shown as **Live** on both Render services and as the
   **Production Deployment** on Vercel should match (they were all `e6e814b` in the
   screenshots).

---

## Quick reference

| Thing | Value |
|---|---|
| Repo | `cloudactai/Calculator-code`, branch `main` |
| Frontend (Vercel) | `calculator-ai-ui` → `app.cloudforlawfirms.com` |
| Auth/data API (Render) | `Calculator-code-auth` → `calculator-code-auth.onrender.com` · `srv-d939g4vavr4c73bma26g` |
| AI/report API (Render) | `Calculator-code` → `calculator-code-x2b4.onrender.com` · `srv-d8c47m0js32c7384tscg` |
| Database | PostgreSQL on **AWS RDS** (via `DATABASE_URL`) |
| Email | Microsoft Graph (`EMAIL_MICROSOFT_*`), sender `notifications@cloudforlawfirms.com` |

See also: [MATTERS.md](MATTERS.md), [FORMS.md](FORMS.md), and the auth handoff notes in
[AUTH_HANDOFF/](AUTH_HANDOFF/).
</content>

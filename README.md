# Calculator-code

CloudAct Solutions legal-professional platform — child support, spousal support,
and tax calculators with AI chat assistants, matter intake, court-form filling,
and agreement drafting for Canadian family law.

## Architecture

The system has four parts, all deployed from this repo's `main` branch:

| Service | Tech | Host | Directory | URL |
|---|---|---|---|---|
| **Frontend** | React (CRA) | Vercel | `cloudact-ui/` | `app.cloudforlawfirms.com` |
| **Auth + data API** | Node / Express / Prisma | Render | `auth-server/` | `calculator-code-auth.onrender.com` |
| **AI / report backend** | Python / Flask | Render | `app.py` + calculators | `calculator-code-x2b4.onrender.com` |
| **Database** | PostgreSQL | AWS RDS | `auth-server/prisma/` (schema) | private |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full deployment topology,
environment variables, request flows, and troubleshooting.

## Local development

### Prerequisites

- Python 3.10+ (tested with 3.12)
- Node.js 18+ (tested with 22)
- PostgreSQL (or access to the hosted RDS instance)

### Flask backend (AI chat + calculators)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in your keys
python app.py
```

Runs at http://localhost:5050. Requires `ANTHROPIC_API_KEY` at minimum.

### Auth server (data API)

```bash
cd auth-server
npm install
cp ../.env.example .env   # or set DATABASE_URL and JWT_SECRET directly
npm run dev
```

Runs at http://localhost:8080. Requires `DATABASE_URL` and `JWT_SECRET`.

### Frontend (React)

```bash
cd cloudact-ui
npm install
cp .env.example .env   # defaults to LOCAL environment
npm start
```

Runs at http://localhost:3000. See `cloudact-ui/.env.example` for all options.

## Testing

```bash
# Flask backend
pytest test_tax.py test_spousal_support.py test_agreement_endpoints.py

# Auth server
cd auth-server && npm test

# Frontend
cd cloudact-ui && npm test
```

## Documentation

Detailed documentation lives in [`docs/`](docs/):

| Document | Covers |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Deployment topology, env vars, request flows, logs |
| [CALCULATORS.md](docs/CALCULATORS.md) | Child/spousal/tax engines, AI chat workflows, PDF reports |
| [TAXES.md](docs/TAXES.md) | Tax engine internals, adding years/provinces |
| [MATTERS.md](docs/MATTERS.md) | Matter workflow, intake, agreements, task list |
| [FORMS.md](docs/FORMS.md) | Court-form filling, PDF templates, prefill engine |
| [AUTHENTICATION.md](docs/AUTHENTICATION.md) | Sign-in flow, JWT sessions, profile |
| [SECURITY.md](docs/SECURITY.md) | Data storage, transmission, compliance |

## Province support

The platform supports **Ontario (ON)**, **British Columbia (BC)**, **Alberta (AB)**,
**Saskatchewan (SK)**, and **Manitoba (MB)** for child support, spousal support, and
tax calculations. See [TAXES.md](docs/TAXES.md) for adding a new province.

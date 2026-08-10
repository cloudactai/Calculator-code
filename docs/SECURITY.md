# Security compliance

How user data is stored, transmitted, and protected across the three services. Start
here if you are auditing the platform's security posture, investigating a data-exposure
concern, or need to verify that sensitive information is handled correctly.

> **Related docs.** For the deployment topology and environment variables see
> [ARCHITECTURE.md](ARCHITECTURE.md). For the authentication flow and session cookies
> see [AUTHENTICATION.md](AUTHENTICATION.md). For the calculator and AI chat endpoints
> that this document's rules apply to see [CALCULATORS.md](CALCULATORS.md).

---

## Data storage architecture

The application uses a two-tier storage model.

The **calculator backend** (Flask on Render) is stateless — it writes no user data to
disk or a database. All session data exists only in browser JavaScript memory and is
cleared on page close. Generated PDF reports are additionally cached in a temporary
server-side directory on Render for immediate download, but no user-submitted data is
persisted.

**Persistent storage** is handled separately by the authenticated auth server
(Node.js / Express / Prisma) backed by a PostgreSQL database hosted on AWS. This
database stores user accounts, matter records, calculation results, and PDF
attachments. Data flows from the calculator backend to the AWS database only through
the authenticated frontend after explicit user action (the **Save to Matter** button).

---

## API key management

`ANTHROPIC_API_KEY` is a server-side environment variable (`.env` locally, dashboard
variable on Render). It is never exposed to the browser or included in frontend code.

Database credentials for the AWS PostgreSQL instance are held only by the auth server
as environment variables and are never exposed to the calculator backend or the
frontend.

---

## CORS

Flask-CORS is configured on the calculator backend to permit cross-origin requests
from the frontend. In a production hardening step, this should be restricted to the
known frontend domain. The auth server enforces its own CORS policy scoped to the
authenticated frontend origin.

---

## HTTPS

All communication between the frontend, calculator backend, and auth server occurs
over HTTPS. Render enforces TLS for the calculator backend; the auth server uses its
own TLS termination for the AWS-backed API.

---

## Authentication and authorization

The auth server enforces user authentication (session tokens / JWT) on every matter
read and write. The calculator backend does not accept or store credentials — all
persisted matter data flows through the authenticated frontend, which attaches the
user's session token to auth-server requests. Users can only read and write matter
records they own or have been granted access to.

For full details on the session model, cookie handling, and token lifecycle see
[AUTHENTICATION.md](AUTHENTICATION.md).

---

## Input validation

All endpoints validate required fields and return descriptive JSON error messages on
invalid input. No raw exception details are exposed to the client.

---

## SIN protection

The T1 extraction endpoint (`/t1-extract`) explicitly never extracts or outputs Social
Insurance Numbers from uploaded tax returns. SINs are never transmitted to the AI, never
included in API responses, and never written to the AWS database.

---

## Session metadata privacy

Law firm name, firm ID, lawyer name, province, and matter identifiers are sent to the
AI for context but hidden from the user-visible chat bubble (via the `aiOnly` channel
in `buildContextMessage` — see [CALCULATORS.md](CALCULATORS.md)). This prevents
sensitive firm data from appearing in the UI where it could be inadvertently shared
via screenshots or screen recordings.

---

## Data-at-rest protection

Matter records, calculation results, and attached PDF reports stored in the AWS
PostgreSQL database are protected by AWS-managed encryption at rest. Backups follow the
auth server's retention policy.

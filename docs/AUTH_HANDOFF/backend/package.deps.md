# Backend dependencies & scripts

## Install

```bash
npm install express cors bcryptjs jsonwebtoken @prisma/client @prisma/adapter-pg pg dotenv
npm install --save-dev prisma
```

Node 18+ is required (the email sender uses the built-in global `fetch`).

| Package | Used by |
|---|---|
| `express` (v5) | HTTP server + router |
| `cors` | Cross-origin + credentials |
| `bcryptjs` | Password hashing (cost 12) |
| `jsonwebtoken` | Session JWTs |
| `@prisma/client` + `prisma` | ORM / migrations |
| `@prisma/adapter-pg` + `pg` | Postgres driver adapter (see `prismaClient.js`) |
| `dotenv` | Load `.env` locally |

> No `cookie-parser` — `authMiddleware.js` parses cookies itself.

## package.json `scripts`

```json
{
  "scripts": {
    "start": "npx prisma migrate deploy && node server.js",
    "dev": "node server.js"
  }
}
```

`start` runs pending DB migrations before booting — this is what Render should run.

## First-time DB setup

```bash
# after setting DATABASE_URL in .env
npx prisma migrate dev --name init   # creates prisma/migrations + the User table
```

Commit the generated `prisma/migrations/` folder; `prisma migrate deploy` (in the
`start` script) applies it in production.

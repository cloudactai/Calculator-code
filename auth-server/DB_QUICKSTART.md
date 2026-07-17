# Database Quickstart

A short map of the database and how to write to it.

## What the database is

- It's a **Postgres** database.
- Code never talks to Postgres directly — it goes through **Prisma** (a library that
  turns JavaScript into SQL for you).
- All tables live in one file: [`prisma/schema.prisma`](prisma/schema.prisma).
- The frontend **never** writes to the DB. It calls an HTTP route in
  [`src/routes/mattersRoutes.js`](src/routes/mattersRoutes.js), and that route runs Prisma.

**Flow:** Frontend → route in `mattersRoutes.js` → `prisma.*` call → row saved in Postgres.

## The tables that matter here

| Table | Holds |
|---|---|
| `User` | accounts |
| `Matter` | a case/file a user is working on |
| `MatterFormDocument` | one filled-out form — includes the generated PDF (`generatedPdf` bytes) |
| `MatterFormPdfRevision` | each saved version of a PDF (`pdf` bytes + `checksum`) |

The PDF is stored **as bytes inside the table** — there is no separate cloud drive/bucket.

## How to write / read

Three operations, all through Prisma:

```js
// CREATE a row
await prisma.matterFormPdfRevision.create({
  data: { documentId, revision, checksum, pdf: pdfBytes },
});

// UPDATE a row
await prisma.matterFormDocument.update({
  where: { id: documentId },
  data: { generatedPdf: pdfBytes, status: "COMPLETED" },
});

// READ rows
await prisma.matterFormDocument.findMany({
  where: { matterId },
});
```

A real example already in the code — `POST /create_folder` in
[`src/routes/mattersRoutes.js`](src/routes/mattersRoutes.js) (~line 806):

```js
router.post("/create_folder", async (req, res) => {
  const matter = await findMatter(req.user.id, matter_id);   // scope to the logged-in user
  if (!matter) return res.status(404).json(errorBody("Matter not found."));
  const saved = await prisma.matterFolder.upsert({ /* ... */ });
  return res.json(ok(saved));
});
```

**Always scope writes to the logged-in user** (`req.user.id` / `findMatter`) so one user
can never touch another user's data.

## Local setup

```bash
cd auth-server
cp .env.example .env
# Point DATABASE_URL at your OWN local Postgres, e.g.
#   DATABASE_URL=postgresql://localhost:5432/cloudact_dev
# Generate your own JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm install
npx prisma migrate deploy   # builds all the tables
npm run dev
```

Do **not** use the production `DATABASE_URL` or any real secrets — develop against your own local DB.

## Adding a new column or table

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name short-description` (runs against your local DB and
   creates a migration file to commit).

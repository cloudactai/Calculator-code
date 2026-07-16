# Legacy Ontario Forms export

This folder was generated from `cloud-act-api-master` and
`cloudact-frontend-main`. It contains the 25 catalogued Ontario templates for
which both a PDF and JSON field map exist. The importer intentionally excludes
forms without a PDF; see `audit.json` for the full list.

Validate without a database:

```bash
node scripts/import-form-templates.js form-template-export --dry-run
```

After applying the Prisma migration in an environment with `DATABASE_URL`,
import the templates:

```bash
node scripts/import-form-templates.js form-template-export
```

On Render's 512 MB instance, import one template per Shell command so each PDF
buffer is released when the Node process exits:

```bash
node scripts/import-form-templates.js form-template-export --doc-id Form13_1
```

The equivalent Render Shell command for the complete catalog is:

```bash
npm run forms:import:render-safe && npm run forms:backfill
```

No Render Shell is required in production: `npm start` runs a one-time,
memory-safe bootstrap whenever fewer than the expected templates exist.

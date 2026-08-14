# Forms template export

Every shipped court-form template: a background PDF plus the JSON field map the
editor overlays on it. `catalog.json` is the picker's index and `audit.json` the
per-template field count.

The first 25 Ontario templates came from `cloud-act-api-master` and
`cloudact-frontend-main`; everything since is built from the government sites by
the pipelines in `auth-server/tools/` — `on-forms/` for Ontario (135 of the 140
published family-law forms), `bc-forms/` for British Columbia (213). Both write
their staging to gitignored `_incoming*/` directories; only the promoted
templates live here.

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
npm run forms:import:render-safe
```

No Render Shell is required in production: `npm start` runs a one-time,
memory-safe bootstrap whenever fewer than the expected templates exist.

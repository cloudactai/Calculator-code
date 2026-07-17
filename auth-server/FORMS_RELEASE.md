# Forms database backend release controls

`FORMS_DATABASE_BACKEND` controls the database-backed Forms router.

- Omit it or set it to `true` to enable Forms (the current production-safe default).
- Set it to `false`, `0`, or `off` to return `503` for Forms requests during a controlled rollback.

Before using the rollback setting, verify that the intended fallback is available for the cohort. The current frontend has been migrated to the Forms API, so this flag is a safe stop-control, not an automatic redirect to an old host.

Release validation still requires a staging environment, two test users, representative matters, and a monitored deployment. Those activities are deliberately not automated by this repository.

## Template mapping publication

Form Mapper publishes an immutable mapping version through the Forms API. To authorize
specific administrators, set `FORMS_TEMPLATE_ADMIN_USER_IDS` to their comma-separated
database user IDs. If it is unset, publication is denied rather than relying on the
client-side Super Admin route guard. Existing form documents continue to load the exact
template version they were created with.

## Monitoring signals

Forms requests emit structured Render logs by default: `forms_request` for writes
and failures (including `409` save conflicts), and `forms_pdf_saved` for completed
PDF revisions. The latter includes only revision number, PDF byte size, and client
generation duration—never a matter number, user ID, or field value. Set
`FORMS_REQUEST_METRICS=false` only if this logging must be disabled.

Completed PDFs are stored once per immutable revision in 512 KB PostgreSQL
chunks. The document record keeps only the latest revision number and timestamp;
reads still fall back to the older `generatedPdf` column for documents created
before revision storage was added. Chunked revisions are streamed back one chunk
at a time so downloads stay within Render's memory limit as well.

The active client uploads completed PDFs as binary `application/pdf`, avoiding
base64 request expansion. The API retains JSON/base64 input only temporarily so
already-deployed clients can finish a save during the rollout window.

Completed-PDF writes have a 30-second transaction timeout because several
production templates are multi-megabyte files; ordinary Forms transactions keep
Prisma's default timeout.

Chunk payloads are committed independently; a short final transaction makes a
revision visible only after every chunk is stored and advances the document's
revision pointer. Incomplete revisions are never served or listed.

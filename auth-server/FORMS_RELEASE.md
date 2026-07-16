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

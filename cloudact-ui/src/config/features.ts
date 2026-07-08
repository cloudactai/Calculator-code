// Feature flags for the personal (non-law-firm) build.
//
// Saved calculations now use the personal auth-server's per-user Postgres data
// routes, not the retired law-firm /v1 backend.
export const FEATURES = {
  SAVED_CALCULATIONS: true,
};

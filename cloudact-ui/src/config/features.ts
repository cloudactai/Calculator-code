// Feature flags for the personal (non-law-firm) build.
//
// Saved calculations — save/load/list/delete, the matter-picker welcome
// screen, and the calculator reports page — still call the legacy law-firm
// /v1 backend, which this build does not run. They are hidden until they get
// a new backend home (natural fit: the auth-server's Postgres, per-user).
// Flip to true once that migration lands.
export const FEATURES = {
  SAVED_CALCULATIONS: false,
};

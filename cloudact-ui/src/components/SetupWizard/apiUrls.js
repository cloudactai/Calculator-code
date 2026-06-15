// Ported from Report-Generation. Returns the env override if set, else the
// relative fallback path. Lets each setup-wizard endpoint be repointed at the
// backend that serves the /api/* auth routes.
function trimValue(value) {
  return String(value || "").trim();
}

export function apiPath(envValue, fallbackPath) {
  const configured = trimValue(envValue);
  return configured || fallbackPath;
}

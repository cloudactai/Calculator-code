// From docs/AUTH_HANDOFF/frontend/apiUrls.js, adapted for CRA: this app uses
// create-react-app, so env vars are process.env.REACT_APP_* (inlined at build
// time), not Vite's import.meta.env.VITE_*.
//
// apiPath(perEndpointEnv, fallbackPath) resolves an auth-API URL:
//   - if the per-endpoint env var is set, use it verbatim (full URL);
//   - else prefix REACT_APP_API_BASE_URL to the fallback path.
// Set REACT_APP_API_BASE_URL once and every endpoint resolves. Per-endpoint
// overrides silently win over the base URL, so either set them all to the same
// host or don't set them at all (see docs/AUTH_HANDOFF/README.md §7).

function trimValue(value) {
  return String(value || "").trim();
}

export function apiPath(envValue, fallbackPath) {
  const configured = trimValue(envValue);
  if (configured) return configured;
  // Fall back to a single backend base URL so a missing per-endpoint env var
  // doesn't send the request to the frontend's own origin (which returns 405).
  // With no base URL either (local dev), the relative path goes through the
  // CRA dev-server proxy (see setupProxy.js).
  const base = trimValue(process.env.REACT_APP_API_BASE_URL).replace(/\/+$/, "");
  return base ? `${base}${fallbackPath}` : fallbackPath;
}

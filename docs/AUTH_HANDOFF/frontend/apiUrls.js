// Copy to: src/lib/apiUrls.js
//
// apiPath(perEndpointEnv, fallbackPath) resolves an API URL:
//   - if the per-endpoint env var is set, use it verbatim (full URL);
//   - else prefix VITE_API_BASE_URL to the fallback path.
// Set VITE_API_BASE_URL once and every endpoint resolves. (See README §7 for the
// per-endpoint override trap.)

function trimValue(value) {
  return String(value || "").trim();
}

export function apiPath(envValue, fallbackPath) {
  const configured = trimValue(envValue);
  if (configured) return configured;
  // Fall back to a single backend base URL so a missing per-endpoint env var
  // doesn't send the request to the frontend's own origin (which returns 405).
  const base = trimValue(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, "");
  return base ? `${base}${fallbackPath}` : fallbackPath;
}

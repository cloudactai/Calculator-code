// Ported from Report-Generation. Returns the env override if set, else the
// relative fallback path. Lets each setup-wizard endpoint be repointed at the
// backend that serves the /api/* auth routes.
import { getAuthToken } from "../../utils/authToken";

function trimValue(value) {
  return String(value || "").trim();
}

export function apiPath(envValue, fallbackPath) {
  const configured = trimValue(envValue);
  return configured || fallbackPath;
}

// Send the CloudAct AccessToken as a Bearer header, matching how the rest of
// cloudact-ui authenticates (src/utils/axios.js). The Report-Creation backend
// accepts either a Bearer token or the AccessToken cookie; using the header
// avoids relying on the cookie being readable cross-domain. Returns an empty
// object when there's no token so we never send "Bearer undefined".
export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

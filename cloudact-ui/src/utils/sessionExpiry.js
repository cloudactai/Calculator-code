// A 401 has two very different meanings and the UI used to treat them alike —
// by saying nothing at all.
//
// If a request carried a token and the server rejected it, the user *had* a
// session and it has since died: access tokens are minted with a 24h expiry
// and nothing in the app ever spends the refresh token to renew one, so every
// session reaches this state after a day. That deserves to be announced.
//
// If a request carried no token, this is a pre-login or startup call. The
// route guard already covers that case, and announcing it is exactly the
// noise commit e7e6c4f set out to stop. So the presence of a token on the
// failed request — not the bare 401 — is what separates the two.

// These endpoints answer 401 as an ordinary result ("wrong password", "already
// signed out"), never as an expired session.
const SELF_ANNOUNCING_AUTH_PATHS = [
  "/login",
  "/logout",
  "/signup",
  "/register",
  "/forgot",
  "/reset",
];

// Set by each client's request interceptor, so this check does not depend on
// how a given axios version stores outgoing headers.
export const AUTH_FLAG = "__sentAuthToken";

export const isSessionExpiry = (error) => {
  if (error?.response?.status !== 401) return false;

  const config = error.config || {};
  if (config.skipUnauthorizedModal) return false;

  const url = String(config.url || "");
  if (SELF_ANNOUNCING_AUTH_PATHS.some((path) => url.includes(path))) return false;

  return config[AUTH_FLAG] === true;
};

const NOTIFY_COOLDOWN_MS = 30000;
let lastNotifiedAt = 0;

// Opening a matter fires a dozen calls at once, and an expired token fails all
// of them. The user should be told once, not once per request.
export const notifySessionExpired = () => {
  const now = Date.now();
  if (now - lastNotifiedAt < NOTIFY_COOLDOWN_MS) return;
  lastNotifiedAt = now;
  window.dispatchEvent(new CustomEvent("unauthorized"));
};

// Shared by both axios clients: announce a dead session, then let the caller's
// own catch block run as before.
export const reportIfSessionExpired = (error) => {
  if (isSessionExpiry(error)) notifySessionExpired();
};

// Lets a caller phrase its own error honestly instead of blaming the resource
// it was fetching.
export const isUnauthorized = (error) => error?.response?.status === 401;

export const resetSessionExpiryNotice = () => {
  lastNotifiedAt = 0;
};

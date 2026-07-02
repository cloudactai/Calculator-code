/**
 * PERSONAL AUTH SESSION BRIDGE
 * ----------------------------
 * The real session is the httpOnly JWT cookie set by the auth-server
 * (auth-server/src/routes/authRoutes.js). But this app's UI still reads login
 * state from the encrypted client cookies the legacy backend used to set
 * (allUserInfo, currentUserRole, access_pages, ...) via the Redux store's
 * initial state (src/store/index.js).
 *
 * This module bridges the two: after a successful /api/login or
 * /api/verify-email it builds the legacy-shaped user object from the auth
 * server's `user` payload and seeds those cookies — same shape devBypass.js
 * uses — so every existing page works unchanged. No law firm, no Clio/QBO:
 * the personal user is an ADMIN of their own account and all pages are
 * accessible.
 */
import Cookies from "js-cookie";
import { encrypt } from "./Encrypted";

// Routes.jsx gates pages on these flags (state.accessPages.response.auth_*).
// A personal account gets everything.
const ALL_ACCESS = {
  auth_archive: true,
  auth_calculator: true,
  auth_compliance_billing: true,
  auth_compliance_forms: true,
  auth_dashboard: true,
  auth_five_steps: true,
  auth_forms: true,
  auth_law_tools: true,
  auth_matters: true,
  auth_monthly_checklists: true,
  auth_operational_report: true,
  auth_report_history: true,
  auth_reports: true,
  auth_run_report: true,
  auth_settings: true,
  auth_tasks: true,
  auth_trust_deposit_slip: true,
  auth_workflow: true,
};

const SESSION_COOKIE_NAMES = [
  "token",
  "allUserInfo",
  "allUserInfo1",
  "allUserInfo2",
  "allUserInfo3",
  "isUserLogged",
  "currentUserRole",
  "access_pages",
  "companyInfo",
  "userProfile",
  "authClio",
  "authIntuit",
  "province",
  "AccessToken",
  "RefreshToken",
  "authToken",
  "jwt",
  "jwtToken",
];

// Build the legacy userInfo shape (role array etc.) from the auth server's
// public user object ({ id, email, name, jobTitle, profilePic, ... }).
export function buildLegacyUserInfo(user) {
  const fullName = String(user?.name || "").trim();
  const [firstName, ...restName] = fullName ? fullName.split(/\s+/) : [""];

  const base = {
    id: user?.id,
    uid: user?.id,
    sid: user?.id,
    first_name: firstName || user?.email || "",
    last_name: restName.join(" "),
    name: fullName || user?.email || "",
    email: user?.email || "",
    province: "ON",
    region: "ON",
    // No Clio/QBO in the personal build — marked connected so nothing tries
    // to bounce the user into the legacy setup wizard.
    authClio: true,
    authIntuit: true,
  };

  return {
    ...base,
    last_refreshed_at: new Date().toISOString(),
    role: [{ ...base, role: "ADMIN" }],
  };
}

// Seed the client-side cookies the UI reads. `userInfo` is the object from
// buildLegacyUserInfo(); `accessToken` is the JWT the auth server returns
// (also set as an httpOnly cookie server-side).
export function seedSessionCookies(userInfo, accessToken) {
  const opts = { path: "/" };
  const role = userInfo.role[0];

  Cookies.set("allUserInfo", encrypt(userInfo), opts);
  Cookies.set("currentUserRole", encrypt(role), opts);
  Cookies.set("access_pages", encrypt(ALL_ACCESS), opts);
  Cookies.set("userProfile", encrypt(role), opts);
  Cookies.set("authClio", "true", opts);
  Cookies.set("authIntuit", "true", opts);
  Cookies.set("province", JSON.stringify(userInfo.province || "ON"), opts);
  if (accessToken) {
    Cookies.set("AccessToken", accessToken, opts);
  }
}

export function clearClientSessionCookies() {
  const opts = { path: "/" };
  SESSION_COOKIE_NAMES.forEach((name) => Cookies.remove(name, opts));
}

// One-stop helper for login/verify success handlers.
export function establishSession(user, accessToken) {
  clearClientSessionCookies();
  const userInfo = buildLegacyUserInfo(user);
  seedSessionCookies(userInfo, accessToken);
  return userInfo;
}

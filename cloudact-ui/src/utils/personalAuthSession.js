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
import { decrypt, encrypt } from "./Encrypted";

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
  "allUserInfo4",
  "allUserInfo5",
  "allUserInfo6",
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

export const isPersonalAuthUser = (user) => {
  if (!user) return false;
  const roleUser = Array.isArray(user.role) ? user.role[0] : null;
  const id = user.id || user.uid || roleUser?.id || roleUser?.uid;
  const sid = user.sid || roleUser?.sid;
  return Boolean(user.personal_auth || (id && sid && String(id) === String(sid)));
};

// Build the legacy userInfo shape (role array etc.) from the auth server's
// public user object ({ id, email, name, jobTitle, profilePic, ... }).
export function buildLegacyUserInfo(user) {
  const fullName = String(user?.name || "").trim();
  const [firstName, ...restName] = fullName ? fullName.split(/\s+/) : [""];
  const email = user?.email || "";
  const displayName =
    user?.username || user?.user_name || fullName || email || "CloudAct User";
  const first = user?.first_name || user?.firstName || firstName || displayName;
  const last = user?.last_name || user?.lastName || restName.join(" ");

  const base = {
    id: user?.id,
    uid: user?.id,
    sid: user?.id,
    personal_auth: true,
    first_name: first,
    last_name: last,
    name: displayName,
    username: displayName,
    user_name: displayName,
    email,
    description: user?.description || "",
    phone_number: user?.phone_number || user?.phoneNumber || "",
    profile_pic: user?.profilePic || user?.profile_pic || "",
    signature: user?.signature || "",
    province: "ON",
    region: "ON",
    // No Clio/QBO in the personal build — marked connected so nothing tries
    // to bounce the user into the legacy setup wizard.
    authClio: true,
    authIntuit: true,
    company_name: "Personal Account",
    short_firmname: displayName,
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
  Cookies.set(
    "companyInfo",
    encrypt({
      legaladdress: {
        Line1: "",
        CountrySubDivisionCode: userInfo.province || "ON",
        Country: "Canada",
      },
    }),
    opts
  );
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

export function updatePersonalSessionProfile(profile) {
  const opts = { path: "/" };
  const currentCookie = Cookies.get("allUserInfo");
  const current = currentCookie ? decrypt(currentCookie) : null;

  if (!isPersonalAuthUser(current)) {
    return null;
  }

  const username =
    profile.username ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    current.username ||
    current.name ||
    current.email;

  const nextUserInfo = {
    ...current,
    first_name: profile.first_name ?? current.first_name,
    last_name: profile.last_name ?? current.last_name,
    username,
    user_name: username,
    name: username,
    email: profile.email ?? current.email,
    description: profile.description ?? current.description,
    phone_number: profile.phone_number ?? current.phone_number,
    profile_pic: profile.profile_pic ?? current.profile_pic,
    TFA: profile.TFA ?? current.TFA,
  };

  nextUserInfo.role = (nextUserInfo.role || []).map((role) => ({
    ...role,
    ...nextUserInfo,
    role: role.role,
  }));

  const currentRole = nextUserInfo.role[0] || nextUserInfo;
  Cookies.set("allUserInfo", encrypt(nextUserInfo), opts);
  Cookies.set("currentUserRole", encrypt(currentRole), opts);
  Cookies.set("userProfile", encrypt(currentRole), opts);
  return currentRole;
}

// One-stop helper for login/verify success handlers.
export function establishSession(user, accessToken) {
  clearClientSessionCookies();
  const userInfo = buildLegacyUserInfo(user);
  seedSessionCookies(userInfo, accessToken);
  return userInfo;
}

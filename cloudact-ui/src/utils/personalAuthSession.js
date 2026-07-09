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
import {
  getProfileMedia,
  saveProfileMedia,
  clearProfileMedia,
  stripProfileMedia,
} from "./profileMedia";

// Routes.jsx gates pages on these flags (state.accessPages.response.auth_*).
// A personal account gets everything.
export const ALL_ACCESS = {
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

export function buildPersonalCompanyInfo(userInfo = {}) {
  return {
    company_name: userInfo.company_name || "Personal Account",
    short_firmname:
      userInfo.short_firmname || userInfo.username || userInfo.email || "Personal Account",
    legaladdress: {
      Line1: userInfo.street || "",
      CountrySubDivisionCode:
        userInfo.address_province || userInfo.province || "ON",
      Country: userInfo.country || "Canada",
    },
  };
}

export function buildPersonalProfileInfo(userInfo = {}) {
  return {
    ...userInfo,
    first_name: userInfo.first_name || userInfo.firstName || userInfo.name || "",
    last_name: userInfo.last_name || userInfo.lastName || "",
    username: userInfo.username || userInfo.name || userInfo.email || "CloudAct User",
    email: userInfo.email || "",
    profile_pic: userInfo.profile_pic || userInfo.profilePic || "",
  };
}

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
    street: user?.street || "",
    address_province: user?.addressProvince || user?.address_province || "",
    country: user?.country || "",
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

  // Keep base64 avatar/signature OUT of cookies (see profileMedia.js): stash
  // them in localStorage and write only the lean, image-free objects, or the
  // oversized cookies get silently dropped and the session breaks.
  saveProfileMedia({
    profile_pic: userInfo.profile_pic,
    signature: userInfo.signature,
  });
  const leanUserInfo = stripProfileMedia(userInfo);
  const role = leanUserInfo.role[0];

  Cookies.set("allUserInfo", encrypt(leanUserInfo), opts);
  Cookies.set("currentUserRole", encrypt(role), opts);
  Cookies.set("access_pages", encrypt(ALL_ACCESS), opts);
  Cookies.set("userProfile", encrypt(role), opts);
  Cookies.set("companyInfo", encrypt(buildPersonalCompanyInfo(leanUserInfo)), opts);
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
  clearProfileMedia();
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
    street: profile.street ?? current.street,
    address_province: profile.address_province ?? current.address_province,
    country: profile.country ?? current.country,
    TFA: profile.TFA ?? current.TFA,
  };

  // Media lives in localStorage, not the (stripped) cookie — so the fallback
  // for an unchanged image is the stored media, never `current.*`.
  const media = getProfileMedia();
  saveProfileMedia({
    profile_pic: profile.profile_pic ?? media.profile_pic,
    signature: profile.signature ?? media.signature,
  });

  nextUserInfo.role = (nextUserInfo.role || []).map((role) => ({
    ...role,
    ...nextUserInfo,
    role: role.role,
  }));

  const leanUserInfo = stripProfileMedia(nextUserInfo);
  const currentRole = leanUserInfo.role[0] || leanUserInfo;
  Cookies.set("allUserInfo", encrypt(leanUserInfo), opts);
  Cookies.set("currentUserRole", encrypt(currentRole), opts);
  Cookies.set("userProfile", encrypt(currentRole), opts);
  // The Address panel reads from companyInfo, so refresh it too — otherwise a
  // saved address wouldn't show until the next login rebuilds the cookie.
  Cookies.set("companyInfo", encrypt(buildPersonalCompanyInfo(leanUserInfo)), opts);
  return currentRole;
}

// One-stop helper for login/verify success handlers.
export function establishSession(user, accessToken) {
  clearClientSessionCookies();
  const userInfo = buildLegacyUserInfo(user);
  seedSessionCookies(userInfo, accessToken);
  return userInfo;
}

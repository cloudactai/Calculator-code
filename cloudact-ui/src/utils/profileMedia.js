// Profile images (avatar + signature) are base64 data URLs that can be tens of
// KB. They must NEVER be written into cookies: browsers silently drop any
// cookie over ~4KB, which would take the whole session (allUserInfo,
// currentUserRole, userProfile) down with it and blank the app. So we keep the
// images in localStorage (megabytes of headroom) and re-attach them onto the
// user objects when they're read back.
const PROFILE_MEDIA_KEY = "profileMedia";

export function getProfileMedia() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_MEDIA_KEY) || "{}") || {};
  } catch (_) {
    return {};
  }
}

// Merge in the provided fields (undefined = leave as-is) and persist.
export function saveProfileMedia({ profile_pic, signature } = {}) {
  try {
    const current = getProfileMedia();
    const next = {
      profile_pic: profile_pic !== undefined ? profile_pic : current.profile_pic,
      signature: signature !== undefined ? signature : current.signature,
    };
    localStorage.setItem(PROFILE_MEDIA_KEY, JSON.stringify(next));
  } catch (_) {
    /* localStorage unavailable (private mode / quota) — non-fatal */
  }
}

export function clearProfileMedia() {
  try {
    localStorage.removeItem(PROFILE_MEDIA_KEY);
  } catch (_) {
    /* no-op */
  }
}

// Return a shallow clone with the base64 media fields emptied, including inside
// a nested `role` array. Used right before writing a user object to a cookie.
export function stripProfileMedia(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const clone = { ...obj, profile_pic: "", signature: "" };
  if (Array.isArray(clone.role)) {
    clone.role = clone.role.map((r) =>
      r && typeof r === "object" ? { ...r, profile_pic: "", signature: "" } : r
    );
  }
  return clone;
}

// Re-attach the stored media onto a user object read back from a cookie.
export function attachProfileMedia(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const { profile_pic, signature } = getProfileMedia();
  const merged = {
    ...obj,
    profile_pic: obj.profile_pic || profile_pic || "",
    signature: obj.signature || signature || "",
  };
  if (Array.isArray(merged.role)) {
    merged.role = merged.role.map((r) =>
      r && typeof r === "object"
        ? {
            ...r,
            profile_pic: r.profile_pic || profile_pic || "",
            signature: r.signature || signature || "",
          }
        : r
    );
  }
  return merged;
}

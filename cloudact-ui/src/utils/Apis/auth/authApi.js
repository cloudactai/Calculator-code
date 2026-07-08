// Personal auth API client (auth-server /api/* endpoints).
// Wired per docs/AUTH_HANDOFF/frontend/AUTH_WIRING.md, adapted for CRA:
//   - every call sends credentials: "include" so the httpOnly session cookie
//     is stored/sent cross-domain;
//   - URLs resolve through apiPath(): per-endpoint REACT_APP_API_BACKEND_URL_*
//     override wins, else REACT_APP_API_BASE_URL + path, else a relative path
//     that the CRA dev proxy forwards to the local auth server.
import { apiPath } from "../../../lib/apiUrls";

async function request(url, { method = "POST", body } = {}) {
  const response = await fetch(url, {
    method,
    credentials: "include", // REQUIRED for the cross-domain session cookie
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export const signup = ({ name, email, password }) =>
  request(apiPath(process.env.REACT_APP_API_BACKEND_URL_SIGNUP, "/api/signup"), {
    body: { name, email, password },
  });

export const login = ({ email, password }) =>
  request(apiPath(process.env.REACT_APP_API_BACKEND_URL_LOGIN, "/api/login"), {
    body: { email, password },
  });

export const verifyEmail = (token) =>
  request(
    apiPath(process.env.REACT_APP_API_BACKEND_URL_VERIFY_EMAIL, "/api/verify-email"),
    { body: { token } }
  );

export const resendVerification = (email) =>
  request(
    apiPath(
      process.env.REACT_APP_API_BACKEND_URL_RESEND_VERIFICATION,
      "/api/resend-verification"
    ),
    { body: { email } }
  );

export const forgotPassword = (email) =>
  request(
    apiPath(
      process.env.REACT_APP_API_BACKEND_URL_FORGOT_PASSWORD,
      "/api/forgot-password"
    ),
    { body: { email } }
  );

export const resetPassword = ({ token, password }) =>
  request(
    apiPath(
      process.env.REACT_APP_API_BACKEND_URL_RESET_PASSWORD,
      "/api/reset-password"
    ),
    { body: { token, password } }
  );

export const me = () =>
  request(apiPath(process.env.REACT_APP_API_BACKEND_URL_ME, "/api/me"), {
    method: "GET",
  });

export const getProfile = () =>
  request(apiPath(process.env.REACT_APP_API_BACKEND_URL_PROFILE, "/api/profile"), {
    method: "GET",
  });

// Partial profile update against the auth server. Send only the fields you want
// to change (e.g. { profilePic } for a photo-only update); the backend leaves
// omitted columns untouched.
export const updateProfile = (body) =>
  request(apiPath(process.env.REACT_APP_API_BACKEND_URL_PROFILE, "/api/profile"), {
    method: "PUT",
    body,
  });

export const changePassword = ({ currentPassword, newPassword, confirmPassword }) =>
  request(
    apiPath(
      process.env.REACT_APP_API_BACKEND_URL_PROFILE_PASSWORD,
      "/api/profile/password"
    ),
    { body: { currentPassword, newPassword, confirmPassword } }
  );

export const logout = () =>
  request(apiPath(process.env.REACT_APP_API_BACKEND_URL_LOGOUT, "/api/logout"));

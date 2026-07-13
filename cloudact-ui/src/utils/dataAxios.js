import axios from "axios";
import { getAuthToken } from "./authToken";

const DEFAULT_PRODUCTION_DATA_API =
  "https://calculator-code-auth.onrender.com/v1";

function trimValue(value) {
  return String(value || "").trim();
}

function toDataApiBase(value) {
  const base = trimValue(value).replace(/\/+$/, "");
  if (!base) return "";

  if (base.endsWith("/api/v1")) return base.replace(/\/api\/v1$/, "/v1");
  if (base.endsWith("/api")) return base.replace(/\/api$/, "/v1");
  if (base.endsWith("/v1")) return base;

  return `${base}/v1`;
}

function resolveDataApiBase() {
  const dataApiOverride = trimValue(process.env.REACT_APP_API_BACKEND_URL_DATA);
  if (dataApiOverride) return toDataApiBase(dataApiOverride);

  const authApiBase = trimValue(process.env.REACT_APP_API_BASE_URL);
  if (authApiBase) return toDataApiBase(authApiBase);

  return process.env.NODE_ENV === "production"
    ? DEFAULT_PRODUCTION_DATA_API
    : "/v1";
}

const dataApiBase = resolveDataApiBase();

// Single source of truth for the backend base URL. The legacy `axios` client
// imports this so ALL frontend traffic goes to the auth-server (Postgres),
// never the retired law-firm /v1 backend.
export const DATA_API_BASE = dataApiBase;

const instance = axios.create({
  baseURL: dataApiBase,
  withCredentials: true,
  // The Render free-tier backend cold-starts in ~30-60s after idle; a 20s
  // timeout made the first matters/saved-calc call after a quiet period fail.
  timeout: 75000,
});

// Fire-and-forget wake-up call (see src/index.tsx). Uses the sibling /api
// health endpoint on the same host as the /v1 data routes.
export function warmUpDataApi() {
  const healthUrl = `${dataApiBase.replace(/\/v1$/, "")}/api/health`;
  axios.get(healthUrl, { timeout: 75000 }).catch(() => {});
}

instance.interceptors.request.use(
  function (config) {
    const token = getAuthToken();
    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default instance;

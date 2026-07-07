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

const instance = axios.create({
  baseURL: dataApiBase,
  withCredentials: true,
  timeout: 20000,
});

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

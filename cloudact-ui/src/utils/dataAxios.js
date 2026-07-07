import axios from "axios";
import { getAuthToken } from "./authToken";

const DEFAULT_PRODUCTION_DATA_API =
  "https://calculator-code-auth.onrender.com/v1";

function trimValue(value) {
  return String(value || "").trim();
}

function resolveDataApiBase() {
  const dataApiOverride = trimValue(process.env.REACT_APP_API_BACKEND_URL_DATA);
  if (dataApiOverride) return dataApiOverride;

  const authApiBase = trimValue(process.env.REACT_APP_API_BASE_URL).replace(
    /\/+$/,
    ""
  );
  if (authApiBase) return `${authApiBase}/v1`;

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

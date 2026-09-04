import axios from "axios";
import { getAuthToken } from "./authToken";
import { DATA_API_BASE } from "./dataAxios";
import { AUTH_FLAG, reportIfSessionExpired } from "./sessionExpiry";

const instance = axios.create({
  // Points at the auth-server (Postgres), same as dataAxios — the legacy
  // law-firm /v1 backend is no longer contacted. Endpoints the auth-server
  // doesn't implement return 404 (handled by callers) instead of hitting legacy.
  baseURL: DATA_API_BASE,
  withCredentials: true,
  // Matches dataAxios: the Render backend cold-starts in ~30-60s after idle,
  // so a short timeout would fail the first call after a quiet period.
  timeout: 75000,
});

instance.interceptors.request.use(
  function (config) {
    const token = getAuthToken();
    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config[AUTH_FLAG] = true;
    } else {
      delete config.headers.Authorization;
      config[AUTH_FLAG] = false;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    reportIfSessionExpired(error);
    return Promise.reject(error);
  }
);

export default instance;

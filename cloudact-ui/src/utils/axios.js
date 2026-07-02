import axios from "axios";
import { APIS, REACT_APP_ENVIRONMENT } from "../config";
import { getAuthToken } from "./authToken";

const ignoreUnauthorizedModalFor = [
  "/login",
  "/logout",
  "/profile/info",
  "/getcompanydata/",
  "companyInfo/",
  "/update/companyData/",
];

const shouldShowUnauthorizedModal = (error) => {
  const url = error.config?.url || "";

  if (error.config?.skipUnauthorizedModal) {
    return false;
  }

  return !ignoreUnauthorizedModalFor.some((path) => url.includes(path));
};

const instance = axios.create({
  baseURL:
    REACT_APP_ENVIRONMENT === 'DEV' ? APIS.dev :
    REACT_APP_ENVIRONMENT === 'QA' ? APIS.QA :
    REACT_APP_ENVIRONMENT === 'PROD' ? APIS.prod :
     REACT_APP_ENVIRONMENT === 'LOCAL' ? APIS.local :
     APIS.local,
  withCredentials: true,
  // Fail fast instead of hanging the UI when the legacy /v1 backend is
  // unreachable. Without a timeout, a dead host spins loaders forever.
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

instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (
      error.response &&
      error.response.status === 401 &&
      shouldShowUnauthorizedModal(error)
    ) {
      window.dispatchEvent(new CustomEvent('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default instance;

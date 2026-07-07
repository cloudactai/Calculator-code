import axios from "axios";
import { apiPath } from "../lib/apiUrls";
import { getAuthToken } from "./authToken";

const dataApiBase = apiPath(process.env.REACT_APP_API_BACKEND_URL_DATA, "/v1");

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

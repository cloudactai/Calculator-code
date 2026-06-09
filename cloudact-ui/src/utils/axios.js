import axios from "axios";
import { APIS, REACT_APP_ENVIRONMENT } from "../config";
import Cookies from 'js-cookie';

// Function to get token from cookies
const getToken = () => {
  return Cookies.get('AccessToken');
};

const instance = axios.create({
  baseURL: 
    REACT_APP_ENVIRONMENT === 'DEV' ? APIS.dev : 
    REACT_APP_ENVIRONMENT === 'QA' ? APIS.QA : 
    REACT_APP_ENVIRONMENT === 'PROD' ? APIS.prod : 
     REACT_APP_ENVIRONMENT === 'LOCAL' ? APIS.local :
     APIS.local, 
  withCredentials: true, 
});

instance.interceptors.request.use(
  function (config) {
    const token = getToken();
    config.headers.Authorization = token ? `Bearer ${token}` : '';
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
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new CustomEvent('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default instance;

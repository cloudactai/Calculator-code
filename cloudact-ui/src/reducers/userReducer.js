import {
  FULL_REFRESH_FAIL,
  FULL_REFRESH_REQUEST,
  FULL_REFRESH_SUCCESS,
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
  USER_REGISTER_FAIL,
  USER_LOGIN_AUTH_FAIL,
  USER_LOGIN_AUTH_REQUEST,
  USER_LOGIN_AUTH_SUCCESS,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_CHANGE_FAIL,
  USER_CHANGE_REQUEST,
  USER_CHANGE_SUCCESS,
  USER_2FA_FAIL,
  USER_2FA_REQUEST,
  USER_2FA_SUCCESS,
  USER_OPT_FAIL,
  USER_LOGIN_AUTH_EMPTY,
  USER_OPT_REQUEST,
  USER_PROFILE_INFO_FAIL,
  USER_PROFILE_INFO_SUCCESS,
  USER_PROFILE_INFO_REQUEST,
  USER_OPT_SUCCESS,
  USER_PROFILE_INFO_CHANGE_REQUEST,
  USER_PROFILE_INFO_CHANGE_SUCCESS,
  USER_PROFILE_INFO_CHANGE_FAIL,
  USER_PROFILE_INFO_CHANGE_EMPTY,
  USER_SIDEBAR_COLLAPSE,
  USER_SIDEBAR_EXPAND,
} from "../constants/userConstants";

export const userLoginReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_LOGIN_REQUEST:
      return { loading: true };
    case USER_LOGIN_SUCCESS:
      return { loading: false, userInfo: action.payload };
    case USER_LOGIN_FAIL:
      return { loading: false, error: action.payload };
    case USER_LOGOUT:
      return {};
    default:
      return state;
  }
};

export const userRegisterReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_REGISTER_REQUEST:
      return { loading: true };
    case USER_REGISTER_SUCCESS:
      return { loading: false, message: action.payload };
    case USER_REGISTER_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userChangeReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_CHANGE_REQUEST:
      return { loading: true };

    case USER_CHANGE_SUCCESS:
      return { ...state, loading: false, userRole: action.payload };

    case USER_SIDEBAR_COLLAPSE:
      return { ...state, sidebarCollapse: true };

    case USER_SIDEBAR_EXPAND:
      return { ...state, sidebarCollapse: false };

    case USER_CHANGE_FAIL:
      return { loading: false, userRole: "Cannot change user" };

    default:
      return state;
  }
};

export const fullRefreshReducer = (state = {}, action) => {
  switch (action.type) {
    case FULL_REFRESH_REQUEST:
      return { loading: true };
    case FULL_REFRESH_SUCCESS:
      return { message: action.payload, loading: false };
    case FULL_REFRESH_FAIL:
      return { error: action.payload, loading: false };
    default:
      return state;
  }
};

export const user2FAVerificationReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_2FA_REQUEST:
      return { loading: true };

    case USER_2FA_SUCCESS:
      return { loading: false, response: action.payload };

    case USER_2FA_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const userOPTMatchReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_OPT_REQUEST:
      return { loading: true };

    case USER_OPT_SUCCESS:
      return { loading: false, response: action.payload };

    case USER_OPT_FAIL:
      return { loading: false, response: false };

    default:
      return state;
  }
};

export const userProfileInfoChangeReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_PROFILE_INFO_CHANGE_REQUEST:
      return { loading: true };

    case USER_PROFILE_INFO_CHANGE_SUCCESS:
      return { loading: false, response: action.payload };

    case USER_PROFILE_INFO_CHANGE_FAIL:
      return { loading: false, error: action.payload };

    case USER_PROFILE_INFO_CHANGE_EMPTY:
      return {};

    default:
      return state;
  }
};

export const userLoginAuthReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_LOGIN_AUTH_REQUEST:
      return { loading: true };

    case USER_LOGIN_AUTH_SUCCESS:
      return { loading: false, response: action.payload };

    case USER_LOGIN_AUTH_FAIL:
      return { loading: false, error: action.payload };

    case USER_LOGIN_AUTH_EMPTY:
      return {};
    default:
      return state;
  }
};

export const userProfileInfoReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_PROFILE_INFO_REQUEST:
      return { loading: true, response: action.payload };

    case USER_PROFILE_INFO_SUCCESS:
      return { loading: false, response: action.payload };

    case USER_PROFILE_INFO_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

import Cookies from "js-cookie";
import {
  FULL_REFRESH_FAIL,
  FULL_REFRESH_REQUEST,
  FULL_REFRESH_SUCCESS,
  USER_2FA_FAIL,
  USER_2FA_REQUEST,
  USER_2FA_SUCCESS,
  USER_CHANGE_SUCCESS,
  USER_LOGIN_AUTH_EMPTY,
  USER_LOGIN_AUTH_SUCCESS,
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
  USER_OPT_FAIL,
  USER_OPT_REQUEST,
  USER_OPT_SUCCESS,
  USER_PROFILE_INFO_CHANGE_FAIL,
  USER_PROFILE_INFO_CHANGE_REQUEST,
  USER_PROFILE_INFO_CHANGE_SUCCESS,
  USER_PROFILE_INFO_FAIL,
  USER_PROFILE_INFO_REQUEST,
  USER_PROFILE_INFO_SUCCESS,
  USER_REGISTER_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_SIDEBAR_COLLAPSE,
  USER_SIDEBAR_EXPAND,
} from "../constants/userConstants";
import store from "../store";
import axios from "../utils/axios";
import { getUserId, getUserSID, updateCookiesInfo } from "../utils/helpers";
import { companyInfoAction } from "./companyActions";
import { persistAuthTokens } from "../utils/authToken";
import CookiesParser from "../utils/cookieParser/Cookies";
import toast from "react-hot-toast"
import * as authApi from "../utils/Apis/auth/authApi";
import {
  clearClientSessionCookies,
  establishSession,
} from "../utils/personalAuthSession";

// Personal login: POST /api/login on the auth-server. The server sets httpOnly
// session cookies; establishSession() seeds the legacy client cookies the rest
// of the UI reads. No law-firm/OTP/2FA branches — that backend is gone.
export const userLoginAction = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: USER_LOGIN_REQUEST });
    clearClientSessionCookies();

    const { ok, status, data } = await authApi.login({ email, password });

    if (!ok) {
      dispatch({
        type: USER_LOGIN_FAIL,
        payload:
          status === 403
            ? "Please verify your email before signing in. Check your inbox."
            : data?.message || "Invalid email or password.",
      });
      return;
    }

    const userInfo = establishSession(data.user, data.accessToken);

    dispatch({ type: USER_CHANGE_SUCCESS, payload: userInfo.role[0] });
    dispatch({ type: USER_LOGIN_SUCCESS, payload: userInfo });
  } catch (error) {
    dispatch({
      type: USER_LOGIN_FAIL,
      payload: "Unable to reach the sign-in service. Please try again.",
    });
  }
};


export const userProfileInfoAction = () => async (dispatch) => {
  try {
    dispatch({ type: USER_PROFILE_INFO_REQUEST });

    const {
      data: { data },
    } = await axios.get(`/profile/info`);

    console.log("userProfile", data.body);
    CookiesParser.set("userProfile", data.body);

    if (data.code === 200 && data.status !== "error") {
      console.log("send ", data.body);
      dispatch({ type: USER_PROFILE_INFO_SUCCESS, payload: data.body });
    } else {

      dispatch({ type: USER_PROFILE_INFO_FAIL, payload: data });
    }
  } catch (error) {
    if (error?.response?.status !== 401) {
      toast.error(error.message)
    }
    dispatch({ type: USER_PROFILE_INFO_FAIL, payload: error });
  }
};

export const userProfileInfoChangeAction = (obj) => async (dispatch) => {
  try {
    dispatch({ type: USER_PROFILE_INFO_CHANGE_REQUEST });

    const {
      data: { data },
    } = await axios.put(`/profile/info`, obj);

    if (data.code === 200 && data.status !== "error") {
      const changedInfo = {
        username: obj.first_name + " " + obj.last_name,
      };
      updateCookiesInfo(changedInfo);
      dispatch({ type: USER_PROFILE_INFO_CHANGE_SUCCESS, payload: data.body });
      toast.success(data.body.message)
      // window.location.href = "/";
    } else {
      toast.error(data.message.error)
      dispatch({ type: USER_PROFILE_INFO_CHANGE_FAIL, payload: data });
    }
  } catch (error) {
    toast.error('Internal Server Error')
    dispatch({ type: USER_PROFILE_INFO_CHANGE_FAIL, payload: error });
  }
};

// export const userLogoutActionV1 = () => (dispatch) => {
//   const cookies_name = [
//     "token",
//     "allUserInfo",
//     "isUserLogged",
//     "authClio",
//     "authIntuit",
//     "currentUserRole",
//     "checklistId",
//     "access_pages",
//     "companyInfo",
//     "userProfile",
//     "calculatorLabel",
//     "DiagnoseConnection",
//     "AccessToken",
//     "RefreshToken",
//     "province"
//   ];

//   cookies_name.forEach((e) => {
//     Cookies.remove(e, { path: "/" });
//   });
// const response = await.post("/logout");

// dispatch({ type: USER_LOGOUT });
// dispatch({ type: USER_LOGIN_AUTH_EMPTY });
// document.location.href = "/signIn";
// };
export const userLogoutAction = () => async (dispatch) => {
  const cookiesName = [
    "token",
    "allUserInfo",
    "allUserInfo1",
    "allUserInfo2",
    "allUserInfo3",
    "isUserLogged",
    "authClio",
    "authIntuit",
    "currentUserRole",
    "checklistId",
    "access_pages",
    "companyInfo",
    "userProfile",
    "calculatorLabel",
    "AccessToken",
    "DiagnoseConnection",
    "RefreshToken",
    "province"
  ];

  cookiesName.forEach((cookie) => {
    Cookies.remove(cookie, { path: "/" });
  });

  // Clear the httpOnly session cookies on the auth-server. Local logout must
  // succeed even if the API call fails (offline, server down), so this is
  // best-effort.
  try {
    await authApi.logout();
  } catch (error) {
    console.error("Logout API call failed", error);
  }

  dispatch({ type: USER_LOGOUT });
  dispatch({ type: USER_LOGIN_AUTH_EMPTY });

  window.location.href = "/signIn";
};


export const userChangeAction = (newUser) => (dispatch) => {
  console.log('✌️newUser --->', newUser);
  CookiesParser.set("currentUserRole", newUser, {
    path: "/",
  });

  Cookies.set("authClio", JSON.stringify(newUser.authClio), {
    path: "/",
  });
  Cookies.set("authIntuit", JSON.stringify(newUser.authIntuit), {
    path: "/",
  });
  Cookies.set("province", JSON.stringify(newUser.province), {
    path: "/",
  });

  console.log("new User", newUser);
  dispatch(companyInfoAction());
  dispatch({ type: USER_CHANGE_SUCCESS, payload: newUser });
};

// Personal signup: POST /api/signup on the auth-server. Creates the account
// unverified and emails a verification link; the success message drives the
// "check your email" alert in SignNewUser.
export const userRegisterAction =
  (userNameEmailPassword) => async (dispatch) => {
    try {
      dispatch({ type: USER_REGISTER_REQUEST });
      const { user_name, name, email, password } = JSON.parse(
        userNameEmailPassword
      );

      const { ok, data } = await authApi.signup({
        name: name || user_name,
        email,
        password,
      });

      if (ok) {
        dispatch({
          type: USER_REGISTER_SUCCESS,
          payload:
            data?.message ||
            "Account created. Please check your email to verify your account.",
        });
      } else {
        dispatch({
          type: USER_REGISTER_FAIL,
          payload: data?.message || "Registration failed.",
        });
      }
    } catch (error) {
      console.log("error", error);
      dispatch({
        type: USER_REGISTER_FAIL,
        payload:
          "Registration failed. Please check your connection and try again.",
      });
    }
  };

export const fullRefreshAction = () => async (dispatch) => {
  try {
    dispatch({ type: FULL_REFRESH_REQUEST });
    console.log("full refresh request");

    const res = await axios.get(
      `/full/refresh?uid=${getUserId()}&sid=${getUserSID()}&source=fullrefresh`
    );

    console.log("data in redux full refresh ", res);

    if (res.data.data.code === 200 && res.data.data.status !== "error") {
      console.log("full refresh done in redux", res.data);
      dispatch({ type: FULL_REFRESH_SUCCESS, payload: res.data.data.body });
    } else {
      console.log("res error ", res.data);
      dispatch({ type: FULL_REFRESH_FAIL, payload: res.data.data.body });
    }
  } catch (error) {
    console.log("error in full refresh redux", error);
    dispatch({ type: FULL_REFRESH_FAIL, payload: "Full Refresh failed" });
  }
};


export const fullRefreshActionFromDashboard = () => async (dispatch) => {
  try {
    dispatch({ type: FULL_REFRESH_REQUEST });
    console.log("full refresh request");

    const res = await axios.get(
      `/full/refresh?uid=${getUserId()}&sid=${getUserSID()}&source=dashboard`
    );

    console.log("data in redux full refresh ", res);

    if (res.data.data.code === 200 && res.data.data.status !== "error") {
      console.log("full refresh done in redux", res.data);
      dispatch({ type: FULL_REFRESH_SUCCESS, payload: res.data.data.body });
    } else {
      console.log("res error ", res.data);
      dispatch({ type: FULL_REFRESH_FAIL, payload: res.data.data.body });
    }
  } catch (error) {
    console.log("error in full refresh redux", error);
    dispatch({ type: FULL_REFRESH_FAIL, payload: "Full Refresh failed" });
  }
};

export const user2FAVerificationAction =
  (verificationObj) => async (dispatch) => {
    console.log("verification obj", verificationObj);
    try {
      dispatch({ type: USER_2FA_REQUEST });

      console.log("user 2fa request send");

      const res = await axios.post(`/phone/authentication`, verificationObj);

      if (res.data.data.code === 200 && res.data.data.status === "success") {
        dispatch({ type: USER_2FA_SUCCESS, payload: res.data.data.body });
      } else {
        throw res.message;
      }
    } catch (error) {
      console.log("user 2FA verification error", error);
      dispatch({ type: USER_2FA_FAIL, payload: false });
    }
  };

export const changeInfoInUserInfo = (info) => async (dispatch) => {
  const userInfo = store.getState().userLogin.userInfo;
  const newUserInfo = { ...userInfo, ...info };
  dispatch({ type: USER_LOGIN_SUCCESS, payload: newUserInfo });
};

export const userOPTMatchAction = (matchObj) => async (dispatch) => {
  try {
    dispatch({ type: USER_OPT_REQUEST });

    console.log("user match request send");

    const res = await axios.post(`/verify/2fa/code`, matchObj);

    console.log("res", res);
    if (matchObj.type === "validate") {
      if (res.data.data.code === 200 && res.data.data.status === "success") {
        console.log("ress", res.data.data.body);

        dispatch({ type: USER_OPT_SUCCESS, payload: res.data.data.body });
      } else {
        throw res.message;
      }
    } else if (matchObj.type === "validate_login") {
      if (res.data.data.code === 200 && res.data.data.status === "success") {
        console.log("validate login");

        console.log("resrrssrdsrdsrds", res.data.data.body);
        CookiesParser.set("allUserInfo", res.data.data.body, {
          path: "/",
        });
        persistAuthTokens(res.data.data);

        Cookies.set("authClio", JSON.stringify(res.data.data.body.authClio), {
          path: "/",
        });
        Cookies.set("province", JSON.stringify(res.data.data.body.province), {
          path: "/",
        });
        Cookies.set(
          "authIntuit",
          JSON.stringify(res.data.data.body.authIntuit),
          {
            path: "/",
          }
        );

        dispatch(userChangeAction(res.data.data.body.role[0]));

        dispatch({ type: USER_LOGIN_SUCCESS, payload: res.data.data.body });
      } else {
        throw res.message;
      }
    } else {
      throw res.message;
    }
  } catch (error) {
    console.log("user match verification error", error);
    dispatch({ type: USER_OPT_FAIL, payload: error });
  }
};

export const toggleSidebar = () => async (dispatch, state) => {
  dispatch({
    type:
      state().userChange.sidebarCollapse === false
        ? USER_SIDEBAR_COLLAPSE
        : USER_SIDEBAR_EXPAND,
  });
};

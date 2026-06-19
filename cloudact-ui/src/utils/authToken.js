import Cookies from "js-cookie";
import { decrypt } from "./Encrypted";

const accessTokenFields = ["AccessToken", "accessToken", "access_token", "token"];
const refreshTokenFields = ["RefreshToken", "refreshToken", "refresh_token"];
const authCookieOptions = { path: "/" };

const pickToken = (source, fields) => {
  if (!source) {
    return null;
  }

  for (const field of fields) {
    const value = source[field];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (value) {
      return value;
    }
  }

  return null;
};

export const getAccessTokenFromBody = (body) => pickToken(body, accessTokenFields);

export const getRefreshTokenFromBody = (body) => pickToken(body, refreshTokenFields);

export const getAuthToken = () => {
  const accessToken = Cookies.get("AccessToken");

  if (accessToken) {
    return accessToken;
  }

  const userInfoCookie = Cookies.get("allUserInfo");
  const userInfo = userInfoCookie ? decrypt(userInfoCookie) : null;

  return getAccessTokenFromBody(userInfo);
};

export const persistAuthTokens = (body) => {
  const accessToken = getAccessTokenFromBody(body);
  const refreshToken = getRefreshTokenFromBody(body);

  if (accessToken) {
    Cookies.set("AccessToken", accessToken, authCookieOptions);
  }

  if (refreshToken) {
    Cookies.set("RefreshToken", refreshToken, authCookieOptions);
  }
};

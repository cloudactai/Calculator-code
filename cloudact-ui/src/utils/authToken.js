import Cookies from "js-cookie";
import { decrypt } from "./Encrypted";

const accessTokenFields = [
  "AccessToken",
  "accessToken",
  "access_token",
  "authToken",
  "jwt",
  "jwtToken",
  "token",
];
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

const payloadCandidates = (payload) => [
  payload,
  payload?.body,
  payload?.data,
  payload?.data?.body,
];

const pickTokenFromPayload = (payload, fields) => {
  for (const candidate of payloadCandidates(payload)) {
    const token = pickToken(candidate, fields);

    if (token) {
      return token;
    }
  }

  return null;
};

export const getAccessTokenFromBody = (body) => pickTokenFromPayload(body, accessTokenFields);

export const getRefreshTokenFromBody = (body) => pickTokenFromPayload(body, refreshTokenFields);

export const getAuthToken = () => {
  const accessToken = Cookies.get("AccessToken");

  if (accessToken) {
    return accessToken;
  }

  const userInfoCookie = Cookies.get("allUserInfo");
  const userInfo = userInfoCookie ? decrypt(userInfoCookie) : null;

  return pickTokenFromPayload(userInfo, accessTokenFields);
};

export const persistAuthTokens = (payload) => {
  const accessToken = pickTokenFromPayload(payload, accessTokenFields);
  const refreshToken = pickTokenFromPayload(payload, refreshTokenFields);

  if (accessToken) {
    Cookies.set("AccessToken", accessToken, authCookieOptions);
  }

  if (refreshToken) {
    Cookies.set("RefreshToken", refreshToken, authCookieOptions);
  }
};

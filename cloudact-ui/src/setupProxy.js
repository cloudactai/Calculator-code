/**
 * CRA dev proxy - forwards API calls to local backends:
 *   /v1/*  -> personal auth server data routes (auth-server/, localhost:8080)
 *   /api/* -> personal auth server auth routes (auth-server/, localhost:8080)
 * Everything else (webpack hot-update, static assets, etc.) stays local.
 *
 * In production the auth URLs come from REACT_APP_API_BASE_URL instead
 * (see src/lib/apiUrls.js).
 */
const proxy = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    proxy("/v1", {
      target: process.env.AUTH_PROXY_TARGET || "http://localhost:8080",
      changeOrigin: true,
      logLevel: "silent",
    })
  );
  app.use(
    proxy("/api", {
      target: process.env.AUTH_PROXY_TARGET || "http://localhost:8080",
      changeOrigin: true,
      logLevel: "silent",
    })
  );
};

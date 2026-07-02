/**
 * CRA dev proxy — only forwards /v1/* API calls to the backend.
 * Everything else (webpack hot-update, static assets, etc.) stays local.
 */
const proxy = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    proxy("/v1", {
      target: "http://localhost:3001",
      changeOrigin: true,
      logLevel: "silent",
    })
  );
};

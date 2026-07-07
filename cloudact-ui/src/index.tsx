// Must be first: seeds auth cookies (dev only) before the store reads them
import "./utils/devBypass";
import React from "react";
import ReactDOM from "react-dom";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./styles/scss/main.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import "./assets/css/bootstrap.min.css";
import "./assets/css/all.min.css";
import "./assets/css/main.css";
import "./assets/css/pages/matters.css";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store/index";

// TEMPORARY deploy test — shows in the BROWSER DevTools console (not Vercel's
// Logs tab; this is a static frontend, logs run client-side). Revert freely.
console.log(
  "[vercel-console-test] cloudact-ui bundle is live — deployed 2026-07-07 from main"
);

ReactDOM.render(
  <Provider store={store}>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <App />
    </LocalizationProvider>
  </Provider>,
  document.getElementById("root") as HTMLDivElement
);

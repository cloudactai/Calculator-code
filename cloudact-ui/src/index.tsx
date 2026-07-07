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

// Wake the auth/data backend as soon as the app loads. The Render free tier
// spins the service down when idle and takes ~30-60s to cold-start; pinging
// health here means it is usually awake by the time the user hits a data
// page (matters, saved calculations) instead of timing out their first call.
import { warmUpDataApi } from "./utils/dataAxios";
warmUpDataApi();

ReactDOM.render(
  <Provider store={store}>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <App />
    </LocalizationProvider>
  </Provider>,
  document.getElementById("root") as HTMLDivElement
);

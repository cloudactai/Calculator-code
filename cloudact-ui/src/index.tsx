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

ReactDOM.render(
  <Provider store={store}>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <App />
    </LocalizationProvider>
  </Provider>,
  document.getElementById("root") as HTMLDivElement
);

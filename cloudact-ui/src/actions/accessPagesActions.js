import Cookies from "js-cookie";

import {
  ACCESS_PAGES_REQUEST,
  ACCESS_PAGES_FAIL,
  ACCESS_PAGES_SUCCESS,
} from "../constants/accessPagesConstants";
import authPagesApi from "../utils/Apis/setup/auth_pages.jsx";
import CookiesParser from "../utils/cookieParser/Cookies";

export const accessPagesAction =
  (state = {}, action) =>
  async (dispatch) => {
    try {
      dispatch({ type: ACCESS_PAGES_REQUEST });

      const {
        data: { data },
      } = await authPagesApi();
      console.log("data access", data);

      if (data.code === 200 && data.status === "success") {
        if (data.body.length > 0) {
          dispatch({ type: ACCESS_PAGES_SUCCESS, payload: data.body[0] });
          CookiesParser.set("access_pages", data.body[0], {
            path: "/",        
          });
        }
      } else {
        dispatch({ type: ACCESS_PAGES_FAIL, payload: "Error" });
      }
    } catch (err) {
      dispatch({ type: ACCESS_PAGES_FAIL, payload: "Error" });
    }
  };

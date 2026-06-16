import Cookies from "js-cookie";
import {
  MATTER_CLIENT_REQUEST,
  MATTER_CLIENT_FAIL,
  MATTER_CLIENT_SUCCESS,
  CLIENT_DETAILS_FROM_FILE_REQUEST,
  CLIENT_DETAILS_FROM_FILE_SUCCESS,
  CLIENT_DETAILS_FROM_FILE_FAIL,
  CLEAR_CLIENT_DETAILS_FROM_FILE_REQUEST,
  CLEAR_CLIENT_DETAILS_FROM_FILE_FAIL,
} from "../constants/matterConstants";
import axios from "../utils/axios";
import { getUserSID } from "../utils/helpers";

export const matterClientsAction = () => async (dispatch) => {
  try {
    dispatch({ type: MATTER_CLIENT_REQUEST });

    const { data } = await axios.get(`/clients?sid=${getUserSID()}`);
    if (data.data.code === 200 && data.data.status !== "error") {
      const {
        data: { body },
      } = data;
      const flags = [];
      const filteredData = body.filter((item) => {
        if (flags[item.client_id]) {
          return false;
        }
        flags[item.client_id] = true;
        return true;
      });

      dispatch({ type: MATTER_CLIENT_SUCCESS, payload: filteredData });
    } else {
      console.log(" in else error statement");
      dispatch({ type: MATTER_CLIENT_FAIL, payload: data.data.message || "" });
    }
  } catch (error) {
    console.log("error in reducer", error);
    dispatch({ type: MATTER_CLIENT_FAIL, payload: error });
  }
};

export const setMatterId = (matterId) => {
  return {
    type: "SET_MATTER_ID",
    payload: matterId,
  };
};

export const clientDetailsFromFileAction =
  (matterDisplayNbr) => async (dispatch) => {
    try {
      dispatch({ type: CLIENT_DETAILS_FROM_FILE_REQUEST });

      const { data } = await axios.get(
        `/task/getData/${matterDisplayNbr}/${getUserSID()}`
      );

      if (data.data.code === 200 && data.data.status !== "error") {
        const {
          data: { body },
        } = data;
        dispatch({
          type: CLIENT_DETAILS_FROM_FILE_SUCCESS,
          payload: body.data[0],
        });
      } else {
        dispatch({
          type: CLIENT_DETAILS_FROM_FILE_FAIL,
          payload: data.sqlMessage,
        });
      }
    } catch (error) {
      console.log("clientDetailsFromFileAction ERROR", error);
      dispatch({ type: CLIENT_DETAILS_FROM_FILE_FAIL, payload: error });
    }
  };

export const clearClientDetailsFromFileAction = () => (dispatch) => {
  try {
    dispatch({ type: CLEAR_CLIENT_DETAILS_FROM_FILE_REQUEST });
  } catch (error) {
    dispatch({ type: CLEAR_CLIENT_DETAILS_FROM_FILE_FAIL, payload: error });
  }
};

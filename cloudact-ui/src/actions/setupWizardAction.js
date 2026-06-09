import {
  TAX_AND_FINANCIAL_FAIL,
  TAX_AND_FINANCIAL_REQUEST,
  TAX_AND_FINANCIAL_SUCCESS,
} from "../constants/setupWIzardConstants";

export const taxAndFinancialDetailsAction = (payload) => async (dispatch) => {
  try {
    dispatch({ type: TAX_AND_FINANCIAL_REQUEST });

    dispatch({ type: TAX_AND_FINANCIAL_SUCCESS, payload });
  } catch (err) {
    dispatch({ type: TAX_AND_FINANCIAL_FAIL, payload: "Error" });
  }
};

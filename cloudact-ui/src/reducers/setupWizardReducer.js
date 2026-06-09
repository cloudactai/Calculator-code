import {
  TAX_AND_FINANCIAL_FAIL,
  TAX_AND_FINANCIAL_SUCCESS,
  TAX_AND_FINANCIAL_REQUEST,
} from "../constants/setupWIzardConstants";

export const setupWizardReducer = (state = {}, action) => {
  switch (action.type) {
    case TAX_AND_FINANCIAL_REQUEST:
      return {
        ...state,
        taxAndFinancialDetails: {
          ...state.taxAndFinancialDetails,
          loading: true,
        },
      };
    case TAX_AND_FINANCIAL_SUCCESS:
      return {
        ...state,
        taxAndFinancialDetails: {
          ...state.taxAndFinancialDetails,
          data: action.payload,
          loading: false,
        },
      };
    case TAX_AND_FINANCIAL_FAIL:
      return {
        ...state,
        taxAndFinancialDetails: {
          ...state.taxAndFinancialDetails,
          error: action.payload,
          loading: false,
        },
      };
    default:
      return state;
  }
};

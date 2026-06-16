import { DYNAMIC_VALUES } from "../constants/dynamicValuesConstants";

export const dynamicValuesAction = (dynamicValues) => async (dispatch) => {
  dispatch({ type: DYNAMIC_VALUES, payload: dynamicValues });
};

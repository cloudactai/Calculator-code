import { DYNAMIC_VALUES } from "../constants/dynamicValuesConstants";

export const dynamicValuesReducer = (state = {}, action) => {
  switch (action.type) {
    case DYNAMIC_VALUES:
      return { data: action.payload };
    default:
      return state;
  }
};

import { SAVE_FILE_DATA_FAIL, SAVE_FILE_DATA_REQUEST, SAVE_FILE_DATA_SUCCESS,SAVE_FILE_DATA_RESET } from "./saveFileDataConstants";


// Initial state
const initialState = {
    loading: false,
    data: null,
    error: null
  };
  
  // Reducer
  export const saveFileDataReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SAVE_FILE_DATA_REQUEST':
        return {
          ...state,
          loading: true,
          error: null
        };
      case 'SAVE_FILE_DATA_SUCCESS':
        return {
          ...state,
          loading: false,
          response: action.payload,
          error: null
        };
      case 'SAVE_FILE_DATA_FAILURE':
        return {
          ...state,
          loading: false,
          error: action.payload
        };
      case 'SAVE_FILE_DATA_RESET':
        return initialState;
      default:
        return state;
    }
  };

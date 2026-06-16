import {GET_FILES_MATTERS_REQUEST,GET_FILES_MATTERS_SUCCESS,GET_FILES_MATTERS_FAIL,GET_FILES_MATTERS_RESET} from './getMattersFilesConstants';

const initialState = {
    loading: true,
    data: null,
    error: null,
  };

  export const getMatterFilesReducer = (state = initialState, action) => {

    switch (action.type) {
      case GET_FILES_MATTERS_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case GET_FILES_MATTERS_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case GET_FILES_MATTERS_RESET:
        return {
          ...state,
          loading: false,
          data: null
        };
      case GET_FILES_MATTERS_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };




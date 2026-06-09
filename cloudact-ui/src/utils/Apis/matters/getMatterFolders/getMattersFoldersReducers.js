import {GET_FOLDERS_MATTERS_REQUEST,GET_FOLDERS_MATTERS_SUCCESS,GET_FOLDERS_MATTERS_FAIL} from './getMattersFoldersConstants';

const initialState = {
    loading: true,
    data: null,
    error: null,
  };

  export const getMatterFoldersReducer = (state = initialState, action) => {
    switch (action.type) {
      case GET_FOLDERS_MATTERS_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case GET_FOLDERS_MATTERS_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case GET_FOLDERS_MATTERS_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };



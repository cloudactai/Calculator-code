import {GET_SINGLE_MATTERS_REQUEST,GET_SINGLE_MATTERS_SUCCESS,GET_SINGLE_MATTERS_FAIL, GET_SINGLE_MATTERS_RESET }from './getSingleMattersConstants';

const initialState = {
    loading: true,
    data: { code: 200, status: "success", body: [] },
    error: null,
  };


  export const getSingleMatterReducer = (state = initialState, action) => {
    switch (action.type) {
      case GET_SINGLE_MATTERS_REQUEST:


        return {
          ...state,
          loading: true,
          data: { code: 200, status: "success", body: [] },
          error: null,
        };
      case GET_SINGLE_MATTERS_SUCCESS:

        return {
          ...state,
          loading: false,
          data: action.payload,
        };
        case GET_SINGLE_MATTERS_RESET:

        return {
          ...state,
          loading: false,
          data: { code: 200, status: "success", body: [] },
        };
      case GET_SINGLE_MATTERS_FAIL:
        return {
          ...state,
          loading: false,
          data: { code: 200, status: "success", body: [] },
          error: action.payload,
        };
      default:
        return state;
    }
  };

  
 

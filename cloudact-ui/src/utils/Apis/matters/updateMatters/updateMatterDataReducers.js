import {UPDATE_MATTERS_REQUEST,UPDATE_MATTERS_SUCCESS,UPDATE_MATTERS_FAIL, UPDATE_MATTERS_RESET }from './updateMatterDataConstants';

const initialState = {
    loading: true,
    data: null,
    error: null,
  };


  export const updateMatterDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case UPDATE_MATTERS_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case UPDATE_MATTERS_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case UPDATE_MATTERS_RESET:
        return {
          ...state,
          loading: false,
          error: action.payload,
          data: null
        };
      case UPDATE_MATTERS_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
 


import * as types from './getCourtsConstants';

const initialState = {
    loading: true,
    response: null,
    error: null,
  };



export const getAllCourtsReducer = (state = initialState, action) => {
    switch (action.type) {
        case types.GET_COURTS_REQUEST:
            return {...state, loading: true, error: null};

        case types.GET_COURTS_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case types.GET_COURTS_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }
}


import * as types from './getMattersConstants';

const initialState = {
    loading: true,
    response: null,
    error: null,
  };



export const getMattersReducer = (state = initialState, action) => {
    switch (action.type) {
        case types.GET_MATTERS_REQUEST:
            return {...state, loading: true, error: null};

        case types.GET_MATTERS_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case types.GET_MATTERS_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }
}


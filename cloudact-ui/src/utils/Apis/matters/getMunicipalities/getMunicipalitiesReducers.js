import * as types from './getMunicipalitiesConstants';

const initialState = {
    loading: true,
    response: null,
    error: null,
  };



export const getMunicipalitiesReducer = (state = initialState, action) => {
    switch (action.type) {
        case types.GET_MUNICIPALITIES_REQUEST:
            return {...state, loading: true, error: null};

        case types.GET_MUNICIPALITIES_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case types.GET_MUNICIPALITIES_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }
}


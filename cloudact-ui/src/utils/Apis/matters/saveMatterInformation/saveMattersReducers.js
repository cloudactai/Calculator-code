import { SAVE_MATTERS_FAIL, SAVE_MATTERS_REQUEST, SAVE_MATTERS_SUCCESS } from "./saveMattersConstants";


const initialState = {
    loading: true,
    data: null,
    error: null,
  };

export const saveMattersReducer = (state = initialState, action) => {
    
    switch (action.type) {
        case SAVE_MATTERS_REQUEST:
            return {...state, loading: true, error: null};

        case SAVE_MATTERS_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case SAVE_MATTERS_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }

}



import { CREATE_MATTERS_REQUEST,CREATE_MATTERS_SUCCESS,CREATE_MATTERS_FAIL } from "./createMattersConstants";


export const createMattersReducer = (state = {}, action) => {
    switch (action.type) {
        case CREATE_MATTERS_REQUEST:
            return {...state, loading: true, error: null};

        case CREATE_MATTERS_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case CREATE_MATTERS_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }
}


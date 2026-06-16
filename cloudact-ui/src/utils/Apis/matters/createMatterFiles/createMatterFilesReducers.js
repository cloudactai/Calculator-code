import { CREATE_FILES_REQUEST,CREATE_FILES_SUCCESS,CREATE_FILES_FAIL } from "./createMatterFilesConstants";


export const createMatterFilesReducer = (state = {}, action) => {
    switch (action.type) {
        case CREATE_FILES_REQUEST:
            return {...state, loading: true, error: null};

        case CREATE_FILES_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case CREATE_FILES_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }
}


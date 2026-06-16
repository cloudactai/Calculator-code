import { CREATE_FOLDERS_REQUEST,CREATE_FOLDERS_SUCCESS,CREATE_FOLDERS_FAIL } from "./createMatterFoldersConstants";


export const createMatterFoldersReducer = (state = {}, action) => {
    switch (action.type) {
        case CREATE_FOLDERS_REQUEST:
            return {...state, loading: true, error: null};

        case CREATE_FOLDERS_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case CREATE_FOLDERS_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }
}


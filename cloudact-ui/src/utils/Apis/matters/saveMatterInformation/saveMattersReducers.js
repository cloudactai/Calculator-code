import { SAVE_MATTERS_FAIL, SAVE_MATTERS_REQUEST, SAVE_MATTERS_SUCCESS, SAVE_MATTERS_RESET } from "./saveMattersConstants";


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

        // Without this, saveMatterReset() was a no-op: `response` stayed set after
        // the first save, so re-entering /5-steps instantly re-fired the success
        // toast + redirect back to Tasks.
        case SAVE_MATTERS_RESET:
            return {...state, loading: false, response: null, error: null};

        default:
            return state;
    }

}



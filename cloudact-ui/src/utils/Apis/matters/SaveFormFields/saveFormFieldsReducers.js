import { SAVE_FORM_FIELDS_FAIL, SAVE_FORM_FIELDS_REQUEST, SAVE_FORM_FIELDS_SUCCESS,SAVE_FORM_FIELDS_RESET } from "./saveFormFieldsConstants";


const initialState = {
    loading: true,
    data: null,
    error: null,
  };

export const saveFormFieldsDataReducer = (state = initialState, action) => {
    
    switch (action.type) {
        case SAVE_FORM_FIELDS_REQUEST:
            return {...state, loading: true, error: null};

        case SAVE_FORM_FIELDS_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

            case SAVE_FORM_FIELDS_RESET:
            return {...state, loading: false, response: null, error: null};

        case SAVE_FORM_FIELDS_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }

}



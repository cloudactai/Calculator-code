import { GET_FILE_DATA_FAIL, GET_FILE_DATA_REQUEST, GET_FILE_DATA_SUCCESS, GET_FILE_DATA_RESET } from "./getFileDataConstants";


const initialState = {
    loading: true,
    data: null,
    error: null,
  };

export const getFileDataReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_FILE_DATA_REQUEST:
            return {...state, loading: true, error: null};

        case GET_FILE_DATA_SUCCESS:
            return {...state, loading: false, response: action.payload, error: null};

        case GET_FILE_DATA_RESET:
            return {...state, loading: false, response: null, error: null};

        case GET_FILE_DATA_FAIL:
            console.log(action.type)
            return {...state, loading: false, response:null, error: null};

        default:
            return state;
    }

}




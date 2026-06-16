import { ACCESS_PAGES_FAIL, ACCESS_PAGES_REQUEST, ACCESS_PAGES_SUCCESS } from "../constants/accessPagesConstants";

export const accessPagesReducer = (state = {}, action) => {
    switch (action.type) {
        case ACCESS_PAGES_REQUEST:
            return { loading: true, response: action.payload }

        case ACCESS_PAGES_SUCCESS:
            return { loading: false, response: action.payload }

        case ACCESS_PAGES_FAIL:
            return { loading: false, error: action.payload }

        default:
            return state;
    }
}
import { COMPANY_INFO_REQUEST, COMPANY_INFO_SUCCESS, COMPANY_INFO_FAIL } from '../constants/companyConstants';

export const companyInformationReducer = (state = {}, action) => {
    switch (action.type) {
        case COMPANY_INFO_REQUEST:
            return { loading: true }
        case COMPANY_INFO_SUCCESS:
            return { loading: false, companyInfo: action.payload }
        case COMPANY_INFO_FAIL:
            return { loading: false, error: action.payload }

        default:
            return state;
    }
}


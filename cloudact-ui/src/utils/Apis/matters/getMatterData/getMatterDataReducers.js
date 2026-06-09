import * as types from './getMatterDataConstants';

const initialState = {
    data: null,
    error: null,
  };

  export const getMatterDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_MATTER_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_MATTER_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_MATTER_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_MATTER_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };

  export const getSingleMatterCourtDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_COURT_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_COURT_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_COURT_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_COURT_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };



   export const getSingleMatterBackgroundDataReducer = (state = initialState, action) => {
   
    switch (action.type) {
      case types.GET_SINGLE_MATTERS_BACKGROUND_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_BACKGROUND_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_BACKGROUND_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_BACKGROUND_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };


  export const getSingleMatterRelationshipDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };

  export const getSingleMatterChildrenDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_CHILDREN_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_CHILDREN_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_CHILDREN_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_CHILDREN_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };

  export const getSingleMatterEmploymentDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };
  // GET_SINGLE_MATTERS_INCOMEBENEFITS_
  export const getSingleMatterIncomeBenefitsDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };
 

  export const getSingleMatterAssetsDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_ASSETS_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_ASSETS_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_ASSETS_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_ASSETS_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };

  export const getSingleMatterExpenseDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_EXPENSE_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_EXPENSE_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_EXPENSE_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_EXPENSE_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };

  export const getSingleMatterDebtDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_DEBT_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_DEBT_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_DEBT_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_DEBT_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };

  export const getSingleMatterOtherPersonsDataReducer = (state = initialState, action) => {

    switch (action.type) {
      case types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_SUCCESS:
        return {
          ...state,
          loading: false,
          data: action.payload,
        };
      case types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_RESET:
        return {
          ...state,
          loading: false,
          error: null,
        };
      default:
        return state;
    }
  };
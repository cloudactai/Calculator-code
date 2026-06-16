import {
  MATTER_CLIENT_REQUEST,
  MATTER_CLIENT_FAIL,
  MATTER_CLIENT_SUCCESS,
  CLIENT_DETAILS_FROM_FILE_REQUEST,
  CLIENT_DETAILS_FROM_FILE_SUCCESS,
  CLIENT_DETAILS_FROM_FILE_FAIL,
  CLEAR_CLIENT_DETAILS_FROM_FILE_REQUEST,
  CLEAR_CLIENT_DETAILS_FROM_FILE_FAIL,
} from "../constants/matterConstants";

export const matterClientReducer = (state = {}, action) => {
  switch (action.type) {
    case MATTER_CLIENT_REQUEST:
      return { loading: true };

    case MATTER_CLIENT_SUCCESS:
      return { loading: false, data: action.payload };

    case MATTER_CLIENT_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

const initialState = {
  matterId: null,
};

export const matterReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_MATTER_ID":
      return {
        ...state,
        matterId: action.payload,
      };
    default:
      return state;
  }
};

export const clientDetailsFromFileReducer = (state = {}, action) => {
  switch (action.type) {
    case CLIENT_DETAILS_FROM_FILE_REQUEST:
      return { loading: true };
    case CLIENT_DETAILS_FROM_FILE_SUCCESS:
      return {
        loading: false,
        data: {
          ...action.payload,
          child_1_DOB:
            (new RegExp(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/).test(
              action.payload.child_1_DOB
            ) &&
              action.payload.child_1_DOB) ||
            "",
          child_2_DOB:
            (new RegExp(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/).test(
              action.payload.child_2_DOB
            ) &&
              action.payload.child_2_DOB) ||
            "",
          child_3_DOB:
            new RegExp(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/).test(
              action.payload.child_3_DOB
            ) === true
              ? action.payload.child_3_DOB
              : "",
          client_DOB:
            (new RegExp(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/).test(
              action.payload.client_DOB
            ) &&
              action.payload.client_DOB) ||
            "",
          opposing_party_DOB:
            new RegExp(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/).test(
              action.payload.opposing_party_DOB
            ) === true
              ? action.payload.opposing_party_DOB
              : "",
          date_of_marriage:
            (new RegExp(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/).test(
              action.payload.date_of_marriage
            ) &&
              action.payload.date_of_marriage) ||
            "",
          date_of_separation:
            (new RegExp(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/).test(
              action.payload.date_of_separation
            ) &&
              action.payload.date_of_separation) ||
            "",
        },
      };
    case CLIENT_DETAILS_FROM_FILE_FAIL:
      return { loading: false, error: action.payload };
    case CLEAR_CLIENT_DETAILS_FROM_FILE_REQUEST:
      return { data: {} };
    case CLEAR_CLIENT_DETAILS_FROM_FILE_FAIL:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

import { fetchRequest } from "../../../fetchRequest";
import * as types from './createMatterFilesConstants';

export const postFileDataRequest = () => ({
    type: types.CREATE_FILES_REQUEST,
  });
  
  export const postFileDataSuccess = (data) => ({
    type: types.CREATE_FILES_SUCCESS,
    payload: data,
  });
  
  export const postFileDataFailure = (error) => ({
    type: types.CREATE_FILES_FAIL,
    payload: error,
  });

//   export const postFileDataReset = () => (
//     {
//     type: types.GET_MATTERS_RESET
//     }
//     );

export const createMatterFiles = (postData) => {

    return async (dispatch) => {

        dispatch(postFileDataRequest());
        try {
        const { data } = await fetchRequest("post", `add_files/`, postData);
        // const data = await response.json();

        dispatch(postFileDataSuccess(data.data));
        } catch (error) {

        dispatch(postFileDataFailure(error));
        }
    };
    };
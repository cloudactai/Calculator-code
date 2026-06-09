import { fetchRequest } from "../../../fetchRequest";
import * as types from './createMatterFoldersConstants';

export const postFolderDataRequest = () => ({
    type: types.CREATE_FOLDERS_REQUEST,
  });
  
  export const postFolderDataSuccess = (data) => ({
    type: types.CREATE_FOLDERS_SUCCESS,
    payload: data,
  });
  
  export const postFolderDataFailure = (error) => ({
    type: types.CREATE_FOLDERS_FAIL,
    payload: error,
  });

//   export const postFolderDataReset = () => (
//     {
//     type: types.GET_MATTERS_RESET
//     }
//     );

export const createMatterFolder = (postData) => {

    return async (dispatch) => {

        dispatch(postFolderDataRequest());
        try {
        const { data } = await fetchRequest("post", `create_folder/`, postData);
        // const data = await response.json();

        dispatch(postFolderDataSuccess(data.data));
        } catch (error) {

        dispatch(postFolderDataFailure(error));
        }
    };
    };
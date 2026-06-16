import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";
import {GET_FOLDERS_MATTERS_REQUEST,GET_FOLDERS_MATTERS_SUCCESS,GET_FOLDERS_MATTERS_FAIL} from './getMattersFoldersConstants';

export const fetchDataRequest = () => ({
    type: GET_FOLDERS_MATTERS_REQUEST,
  });
  
  export const fetchDataSuccess = (data) => ({
    type: GET_FOLDERS_MATTERS_SUCCESS,
    payload: data,
  });
  
  export const fetchDataFailure = (error) => ({
    type: GET_FOLDERS_MATTERS_FAIL,
    payload: error,
  });


  export const getMatterFolders = (getData) => {
    
    return async (dispatch) => {
      dispatch(fetchDataRequest());
      try {
        const { data } = await fetchRequest("get", `get_folders/${getUserSID()}/${getData}`);

        dispatch(fetchDataSuccess(data.data));
      } catch (error) {

        dispatch(fetchDataFailure(error));
      }
        
    };
  };

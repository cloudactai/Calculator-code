import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";
import {GET_FILES_MATTERS_REQUEST,GET_FILES_MATTERS_SUCCESS,GET_FILES_MATTERS_FAIL, GET_FILES_MATTERS_RESET} from './getMattersFilesConstants';

export const fetchDataRequest = () => ({
    type: GET_FILES_MATTERS_REQUEST,
  });
  
  export const fetchDataSuccess = (data) => ({
    type: GET_FILES_MATTERS_SUCCESS,
    payload: data,
  });
  
  export const fetchDataFailure = (error) => ({
    type: GET_FILES_MATTERS_FAIL,
    payload: error,
  });

  export const fetchDataReset = () => ({
    type: GET_FILES_MATTERS_RESET,
  });


  export const getMatterFiles = (matter_id, folder_id) => {
    
    return async (dispatch) => {
      dispatch(fetchDataRequest());
      try {
        const { data } = await fetchRequest("get", `get_files/${getUserSID()}/${matter_id}/${folder_id}`);
        dispatch(fetchDataSuccess(data.data));
      } catch (error) {

        dispatch(fetchDataFailure(error));
      }
        
    };
  };

  export const getMatterFilesReset = () => {
    return async (dispatch) => {
      dispatch(fetchDataReset());
    }
  }

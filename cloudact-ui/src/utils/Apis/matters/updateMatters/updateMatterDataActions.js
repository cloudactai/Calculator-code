import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";
import * as types from './updateMatterDataConstants';


export const postDataRequest = () => ({
    type: types.UPDATE_MATTERS_REQUEST,
  });
  
  export const postDataSuccess = (data) => ({
    type: types.UPDATE_MATTERS_SUCCESS,
    payload: data,
  });
  
  export const postDataFailure = (error) => ({
    type: types.UPDATE_MATTERS_FAIL,
    payload: error,
  });

  export const postDataReset = () => (
    {
    type: types.UPDATE_MATTERS_RESET
    }
    );


  export const updateMatterData = (postData) => {

    return async (dispatch) => {

      dispatch(postDataRequest());
      try {
      const { data } = await fetchRequest("post", `update_matter/${getUserSID()}/${postData.matter_id}/${postData.type}`, postData.data);
        
      dispatch(postDataSuccess(data.data));
      } catch (error) {

      dispatch(postDataFailure(error));
      }
  };

  };

  export const updateMatterReset = () => async dispatch => {
    dispatch(postDataReset());
  };
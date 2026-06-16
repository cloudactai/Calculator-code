import { fetchRequest } from "../../../fetchRequest";
import { getUserSID, getUserRole } from "../../../helpers";
import { SAVE_FILE_DATA_FAIL, SAVE_FILE_DATA_REQUEST, SAVE_FILE_DATA_RESET, SAVE_FILE_DATA_SUCCESS } from "./saveFileDataConstants";




export const saveFileDataRequest = () => ({
    type: SAVE_FILE_DATA_REQUEST,
  });
  
  export const saveFileDataSuccess = (data) => ({
    type: SAVE_FILE_DATA_SUCCESS,
    payload: data,
  });
  
  export const saveFileDataFailure = (error) => ({
    type: SAVE_FILE_DATA_FAIL,
    payload: error,
  });

  export const saveFileDataResets = () => (
    {
    type: SAVE_FILE_DATA_RESET
    }
    );

export const saveFileData = (saveData, state = {}, action) => async (dispatch) => {
    try {
        dispatch(saveFileDataRequest());
        let user_info = getUserRole();
        // Add user_info to saveData
        const updatedSaveData = {
          ...saveData,
          short_firmname: user_info[0].short_firmname
      };
        const { data } = await fetchRequest("post", `save_file_data/${getUserSID()}/${saveData.matterId}`, updatedSaveData);
        
        console.log("🚀 ~ saveFileData ~ data:", data)
        if (data.data.code === 200) {
            dispatch(saveFileDataSuccess(data.data.body));
        } else {
            dispatch(saveFileDataFailure("Error"));
        }
    } catch (err) {
        dispatch(saveFileDataFailure("Error"));
    }
    // Only dispatch reset if needed
    // dispatch(saveFileDataResets());
};

export const saveFileDataReset = () => async dispatch => {
  dispatch(saveFileDataResets());
};

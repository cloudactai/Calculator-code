import { fetchRequest } from "../../../fetchRequest";
import { getUserSID, getUserRole } from "../../../helpers";
import * as types from './getFileDataConstants';




export const getFileDataRequest = () => ({
  type: types.GET_FILE_DATA_REQUEST,
});

export const getFileDataSuccess = (data) => ({
  type: types.GET_FILE_DATA_SUCCESS,
  payload: data,
});

export const getFileDataFailure = (error) => ({
  type: types.GET_FILE_DATA_FAIL,
  payload: error,
});

export const getFileDataResets = () => ({
  type: types.GET_FILE_DATA_RESET
});

export const getFileData = (saveData, state = {}, action) => async (dispatch) => {
  try {
    // dispatch({ type: types.GET_FILE_DATA_REQUEST });
    dispatch(getFileDataRequest());
    let user_info = getUserRole();
    const { data } = await fetchRequest("get", `get_file_data/${getUserSID()}/${user_info[0].short_firmname}/${saveData.matterId}/${saveData.folder_id}/${saveData.file_id}`);

    if (data.code === 200) {
      dispatch({ type: types.GET_FILE_DATA_SUCCESS, payload: data.data })
    } else {
      dispatch({ type: types.GET_FILE_DATA_FAIL, payload: "Error" })
    }

  } catch (err) {
    dispatch({ type: types.GET_FILE_DATA_FAIL, payload: "Error" })

  }
}

export const getFileDataReset = () => async dispatch => {
  console.log("🚀 ~ getFileDataReset ~ dispatch:")
  dispatch(getFileDataResets())
};


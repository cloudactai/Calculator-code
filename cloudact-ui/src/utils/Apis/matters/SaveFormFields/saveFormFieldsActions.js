import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";
import * as types from './saveFormFieldsConstants';




export const saveFileDataRequest = () => ({
    type: types.SAVE_FORM_FIELDS_REQUEST,
  });
  
  export const saveFileDataSuccess = (data) => ({
    type: types.SAVE_FORM_FIELDS_SUCCESS,
    payload: data,
  });
  
  export const saveFileDataFailure = (error) => ({
    type: types.SAVE_FORM_FIELDS_FAIL,
    payload: error,
  });

  export const saveFileDataResets = () => (
    {
    type: types.SAVE_FORM_FIELDS_RESET
    }
    );

export const saveFileData = (saveData,state = {}, action) => async (dispatch) => {
console.log("🚀 ~ saveFileData ~ saveData:", saveData)

    try {
        // dispatch({ type: types.SAVE_FORM_FIELDS_REQUEST });
        dispatch(saveFileDataRequest());
        const { data } = await fetchRequest("post", `SAVE_FORM_FIELDS/${getUserSID()}/${saveData.matterId}`, saveData);

        if (data.data.code === 200) {
            dispatch({ type: types.SAVE_FORM_FIELDS_SUCCESS, payload: data.data.body })
        } else {
            dispatch({ type: types.SAVE_FORM_FIELDS_FAIL, payload: "Error" })
        }

    } catch (err) {
        dispatch({ type: types.SAVE_FORM_FIELDS_FAIL, payload: "Error" })

    }
}

export const saveFileDataReset = () => async dispatch => {
  dispatch(saveFileDataResets());
};

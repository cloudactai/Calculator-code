import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";
import * as types from './saveMattersConstants';




export const saveDataRequest = () => ({
    type: types.SAVE_MATTERS_REQUEST,
  });
  
  export const saveDataSuccess = (data) => ({
    type: types.SAVE_MATTERS_SUCCESS,
    payload: data,
  });
  
  export const saveDataFailure = (error) => ({
    type: types.SAVE_MATTERS_FAIL,
    payload: error,
  });

  export const saveDataReset = () => (
    {
    type: types.SAVE_MATTERS_RESET
    }
    );

export const saveMatter = (saveData,state = {}, action) => async (dispatch) => {

    try {
        // dispatch({ type: types.SAVE_MATTERS_REQUEST });
        dispatch(saveDataRequest());
        const { data } = await fetchRequest("post", `save_matter/${getUserSID()}/${saveData.matter_id}`, saveData);

        console.log("🚀 ~ saveMatter ~ data:", data)
        if (data.data.code === 200) {
            dispatch({ type: types.SAVE_MATTERS_SUCCESS, payload: data.data.body })
        } else {
            dispatch({ type: types.SAVE_MATTERS_FAIL, payload: "Error" })
        }

    } catch (err) {
        dispatch({ type: types.SAVE_MATTERS_FAIL, payload: "Error" })

    }
}

export const saveMatterReset = () => async dispatch => {
  dispatch(saveDataReset());
};

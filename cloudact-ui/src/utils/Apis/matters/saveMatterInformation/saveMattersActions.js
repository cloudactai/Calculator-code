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

// AI intake is intentionally a separate endpoint: it can only patch stored
// values and returns the authoritative saved snapshot plus completion state.
export const patchMatterIntake = ({ matter_id, patches }) => async (dispatch) => {
  dispatch(saveDataRequest());
  try {
    const { data } = await fetchRequest(
      "post",
      `patch_matter_intake/${getUserSID()}/${matter_id}`,
      { source: "ai-intake", patches }
    );
    if (data?.data?.code !== 200) throw new Error("AI intake patch was rejected.");
    dispatch({ type: types.SAVE_MATTERS_SUCCESS, payload: data.data.body });
    return data.data.body;
  } catch (err) {
    dispatch({ type: types.SAVE_MATTERS_FAIL, payload: "Error" });
    throw err;
  }
};

export const saveMatterReset = () => async dispatch => {
  dispatch(saveDataReset());
};

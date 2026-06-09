import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";
import * as types from "./getCourtsConstants";

export const fetchDataRequest = () => ({
    type: types.GET_COURTS_REQUEST,
  });
  
  export const fetchDataSuccess = (data) => ({
    type: types.GET_COURTS_SUCCESS,
    payload: data,
  });
  
  export const fetchDataFailure = (error) => ({
    type: types.GET_COURTS_FAIL,
    payload: error,
  });

  export const fetchDataReset = () => (
    {
    type: types.GET_COURTS_RESET
    }
    );

export const getAllCourts = (province) => {


    return async (dispatch) => {
        dispatch(fetchDataRequest());
        try {
        const { data } = await fetchRequest("get", `get_courts/${getUserSID()}/${province}`);
        // const data = await response.json();

        
        dispatch(fetchDataSuccess(data.data));
        } catch (error) {

        dispatch(fetchDataFailure(error));
        }
    };
    };

// export const getAllMatters = (state = {}, action) => async (dispatch) => {

//     try {
//         dispatch({ type: GET_COURTS_REQUEST });
//         const { data } = await fetchRequest("get", `get_matters/${getUserSID()}`);
        

//         if (data.data.code === 200 && data.data.status === "success") {
//             console.log('Save Matter Response', data)
//             dispatch({ type: GET_COURTS_SUCCESS, payload: data.data.body })
//         } else {
//             dispatch({ type: GET_COURTS_FAIL, payload: "Error" })
//         }

//     } catch (err) {
//         dispatch({ type: GET_COURTS_FAIL, payload: "Error" })

//     }
// }

import { fetchRequest } from '../../../fetchRequest'
import { getUserSID } from '../../../helpers'
import * as types from './getMatterDataConstants'

export const fetchMatterDataRequest = () => ({
  type: types.GET_MATTER_DATA_REQUEST
})

export const fetchMatterDataSuccess = data => ({
  type: types.GET_MATTER_DATA_SUCCESS,
  payload: data
})

export const fetchMatterDataFailure = error => ({
  type: types.GET_MATTER_DATA_FAIL,
  payload: error
})

export const fetchMatterDataReset = () => ({
  type: types.GET_MATTER_DATA_RESET
})

export const getMatterData = (getData) => {
  return async dispatch => {
    dispatch(fetchMatterDataRequest())
    try {
      const { data } = await fetchRequest(
        'get',
        `get_single_matter_data_all/${getUserSID()}/${getData}`
      )

        dispatch({ type: types.GET_MATTER_DATA_SUCCESS, payload: data.data})
      
      // dispatch(fetchMatterDataSuccess(data.data))
    } catch (error) {
      dispatch(fetchMatterDataFailure(error))
    }
  }
}

// export const fetchMatterDataRequest  = dataType =>  async dispatch =>  {

//     dispatch({ type: types.GET_MATTER_DATA_REQUEST})
// }

export const getMatterDataReset = (dataType) => async dispatch => {
 
    dispatch({ type: types.GET_MATTER_DATA_RESET})
  // dispatch(ResetMatterSingleData(dataType))
}

export const getMatterDataFail = (dataType) => async dispatch => {
  
    dispatch({ type: types.GET_MATTER_DATA_FAIL})
  // dispatch(ResetMatterSingleData(dataType))
}

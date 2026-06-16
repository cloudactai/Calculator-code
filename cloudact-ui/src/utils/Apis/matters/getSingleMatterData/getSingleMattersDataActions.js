import { fetchRequest } from '../../../fetchRequest'
import { getUserSID } from '../../../helpers'
import * as types from './getSingleMattersDataConstants'

export const fetchMatterDataRequest = () => ({
  type: types.GET_SINGLE_MATTERS_DATA_REQUEST
})

export const fetchMatterDataSuccess = data => ({
  type: types.GET_SINGLE_MATTERS_DATA_SUCCESS,
  payload: data
})

export const fetchMatterDataFailure = error => ({
  type: types.GET_SINGLE_MATTERS_DATA_FAIL,
  payload: error
})

export const fetchMatterDataReset = () => ({
  type: types.GET_SINGLE_MATTERS_DATA_RESET
})

export const getSingleMatterData = (getData, dataType) => {
  return async dispatch => {
    dispatch(fetchSingleMatterDataRequest(dataType))
    try {
      const { data } = await fetchRequest(
        'get',
        `get_single_matter_data/${getUserSID()}/${getData}/${dataType}`
      )

      if (dataType === 'court') {
        dispatch({ type: types.GET_SINGLE_MATTERS_COURT_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'background') {
        dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'relationship') {
        dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'children') {
        dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'employment') {
        dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'incomeBenefits') {
        dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'assets') {
        dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'expenses') {
        dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'debtsLiabilities') {
        
        dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_SUCCESS, payload: data.data})
      }
      if (dataType === 'otherPersons') {
        dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_SUCCESS, payload: data.data})
      }
      // dispatch(fetchMatterDataSuccess(data.data))
    } catch (error) {
      dispatch(fetchMatterDataFailure(error))
    }
  }
}

export const fetchSingleMatterDataRequest  = dataType =>  async dispatch =>  {

  if (dataType === 'court') {
    dispatch({ type: types.GET_SINGLE_MATTERS_COURT_DATA_REQUEST})
  }
  if (dataType === 'background') {
    dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_REQUEST})
  }
  if (dataType === 'relationship') {
    dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_REQUEST})
  }
  if (dataType === 'children') {
    dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_REQUEST})
  }
  if (dataType === 'employment') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_REQUEST})
  }
  if (dataType === 'incomeBenefits') {
    dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_REQUEST})
  }
  if (dataType === 'assets') {
    dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_REQUEST})
  }
  if (dataType === 'expenses') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_REQUEST})
  }
  if (dataType === 'debtsLiabilities') {
    dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_REQUEST})
  }
  if (dataType === 'otherPersons') {
    dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_REQUEST})
  }

}

export const getSingleMatterDataReset = (dataType) => async dispatch => {
  // console.log('Single Matter Reset', dataType)
  if (dataType === 'relationship') {
    dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_RESET})
  }
  if (dataType === 'background') {
    dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_RESET})
  }
  if (dataType === 'employment') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_RESET})
  }
  if (dataType === 'assets') {
    dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_RESET})
  }
  if (dataType === 'children') {
    dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_RESET})
  }
  if (dataType === 'incomeBenefits') {
    dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_RESET})
  }
  if (dataType === 'expenses') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_RESET})
  }
  if (dataType === 'debtsLiabilities') {
    dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_RESET})
  }
  if (dataType === 'otherPersons') {
    dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_RESET})
  }
  // dispatch(ResetMatterSingleData(dataType))
}

export const getSingleMatterDataFail = (dataType) => async dispatch => {
  // console.log('Single Matter Reset', dataType)
  if (dataType === 'relationship') {
    dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_FAIL})
  }
  if (dataType === 'background') {
    dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_FAIL})
  }
  if (dataType === 'employment') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_FAIL})
  }
  if (dataType === 'assets') {
    dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_FAIL})
  }
  if (dataType === 'children') {
    dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_FAIL})
  }
  if (dataType === 'incomeBenefits') {
    dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_FAIL})
  }
  if (dataType === 'expenses') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_FAIL})
  }
  if (dataType === 'debtsLiabilities') {
    dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_FAIL})
  }
  if (dataType === 'otherPersons') {
    dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_FAIL})
  }
  // dispatch(ResetMatterSingleData(dataType))
}

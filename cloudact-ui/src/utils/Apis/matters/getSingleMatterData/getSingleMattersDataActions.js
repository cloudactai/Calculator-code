import { fetchRequest } from '../../../fetchRequest'
import { getUserSID } from '../../../helpers'
import * as types from './getSingleMattersDataConstants'

const normalizeDataType = dataType =>
  dataType === 'debt' ? 'debtsLiabilities' : dataType

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
    const normalizedDataType = normalizeDataType(dataType)
    dispatch(fetchSingleMatterDataRequest(normalizedDataType))
    try {
      const { data } = await fetchRequest(
        'get',
        `get_single_matter_data/${getUserSID()}/${getData}/${normalizedDataType}`
      )

      if (normalizedDataType === 'court') {
        dispatch({ type: types.GET_SINGLE_MATTERS_COURT_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'background') {
        dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'relationship') {
        dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'children') {
        dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'employment') {
        dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'incomeBenefits') {
        dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'assets') {
        dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'expenses') {
        dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'debtsLiabilities') {
        
        dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_SUCCESS, payload: data.data})
      }
      if (normalizedDataType === 'otherPersons') {
        dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_SUCCESS, payload: data.data})
      }
      // dispatch(fetchMatterDataSuccess(data.data))
    } catch (error) {
      dispatch(getSingleMatterDataFail(normalizedDataType))
      dispatch(fetchMatterDataFailure(error))
    }
  }
}

export const fetchSingleMatterDataRequest  = dataType =>  async dispatch =>  {
  const normalizedDataType = normalizeDataType(dataType)

  if (normalizedDataType === 'court') {
    dispatch({ type: types.GET_SINGLE_MATTERS_COURT_DATA_REQUEST})
  }
  if (normalizedDataType === 'background') {
    dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_REQUEST})
  }
  if (normalizedDataType === 'relationship') {
    dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_REQUEST})
  }
  if (normalizedDataType === 'children') {
    dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_REQUEST})
  }
  if (normalizedDataType === 'employment') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_REQUEST})
  }
  if (normalizedDataType === 'incomeBenefits') {
    dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_REQUEST})
  }
  if (normalizedDataType === 'assets') {
    dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_REQUEST})
  }
  if (normalizedDataType === 'expenses') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_REQUEST})
  }
  if (normalizedDataType === 'debtsLiabilities') {
    dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_REQUEST})
  }
  if (normalizedDataType === 'otherPersons') {
    dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_REQUEST})
  }

}

export const getSingleMatterDataReset = (dataType) => async dispatch => {
  // console.log('Single Matter Reset', dataType)
  const normalizedDataType = normalizeDataType(dataType)
  if (normalizedDataType === 'relationship') {
    dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_RESET})
  }
  if (normalizedDataType === 'background') {
    dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_RESET})
  }
  if (normalizedDataType === 'employment') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_RESET})
  }
  if (normalizedDataType === 'assets') {
    dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_RESET})
  }
  if (normalizedDataType === 'children') {
    dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_RESET})
  }
  if (normalizedDataType === 'incomeBenefits') {
    dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_RESET})
  }
  if (normalizedDataType === 'expenses') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_RESET})
  }
  if (normalizedDataType === 'debtsLiabilities') {
    dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_RESET})
  }
  if (normalizedDataType === 'otherPersons') {
    dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_RESET})
  }
  // dispatch(ResetMatterSingleData(dataType))
}

export const getSingleMatterDataFail = (dataType) => async dispatch => {
  // console.log('Single Matter Reset', dataType)
  const normalizedDataType = normalizeDataType(dataType)
  if (normalizedDataType === 'relationship') {
    dispatch({ type: types.GET_SINGLE_MATTERS_RELATIONSHIP_DATA_FAIL})
  }
  if (normalizedDataType === 'background') {
    dispatch({ type: types.GET_SINGLE_MATTERS_BACKGROUND_DATA_FAIL})
  }
  if (normalizedDataType === 'employment') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EMPLOYMENT_DATA_FAIL})
  }
  if (normalizedDataType === 'assets') {
    dispatch({ type: types.GET_SINGLE_MATTERS_ASSETS_DATA_FAIL})
  }
  if (normalizedDataType === 'children') {
    dispatch({ type: types.GET_SINGLE_MATTERS_CHILDREN_DATA_FAIL})
  }
  if (normalizedDataType === 'incomeBenefits') {
    dispatch({ type: types.GET_SINGLE_MATTERS_INCOMEBENEFITS_DATA_FAIL})
  }
  if (normalizedDataType === 'expenses') {
    dispatch({ type: types.GET_SINGLE_MATTERS_EXPENSE_DATA_FAIL})
  }
  if (normalizedDataType === 'debtsLiabilities') {
    dispatch({ type: types.GET_SINGLE_MATTERS_DEBT_DATA_FAIL})
  }
  if (normalizedDataType === 'otherPersons') {
    dispatch({ type: types.GET_SINGLE_MATTERS_OTHER_PERSONS_DATA_FAIL})
  }
  // dispatch(ResetMatterSingleData(dataType))
}

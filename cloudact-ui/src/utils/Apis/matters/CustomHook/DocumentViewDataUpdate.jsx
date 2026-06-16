import { useDispatch, useSelector } from 'react-redux'
import { getSingleMatterData } from '../getSingleMatterData/getSingleMattersDataActions'
import {
  selectDataSingleMatterAssetsData,
  selectDataSingleMatterAssetsError,
  selectDataSingleMatterAssetsLoading,
  selectDataSingleMatterBackgroundData,
  selectDataSingleMatterChildrenData,
  selectDataSingleMatterChildrenError,
  selectDataSingleMatterChildrenLoading,
  selectDataSingleMatterEmploymentData,
  selectDataSingleMatterEmploymentError,
  selectDataSingleMatterEmploymentLoading,
  selectDataSingleMatterError,
  selectDataSingleMatterExpenseData,
  selectDataSingleMatterExpenseError,
  selectDataSingleMatterExpenseLoading,
  selectDataSingleMatterIncomeBenefitsData,
  selectDataSingleMatterIncomeBenefitsError,
  selectDataSingleMatterIncomeBenefitsLoading,
  selectDataSingleMatterLoading,
  selectDataSingleMatterRelationshipData,
  selectDataSingleMatterRelationshipError,
  selectDataSingleMatterRelationshipLoading,
  selectSingleMatterCourtData,
  selectSingleMatterCourtError,
  selectSingleMatterCourtLoading
} from '../getSingleMatterData/getSingleMattersDataSelectors'
import { useEffect } from 'react'

export function AssetsData (matterId) {
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'assets'))
    }
    fetchData()
  }, [dispatch,matterId])

  const selectAssetsData = useSelector(selectDataSingleMatterAssetsData)
  const selectAssetsDataLoading = useSelector(
    selectDataSingleMatterAssetsLoading
  )
  const selectAssetsDataError = useSelector(selectDataSingleMatterAssetsError)
  return {
    selectAssetsData,
    selectAssetsDataLoading,
    selectAssetsDataError
  }
}

export function ChildrenData (matterId) {
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'children'))
    }
    fetchData()
  }, [dispatch,matterId])

  const selectChildrenData = useSelector(selectDataSingleMatterChildrenData)
  const selectChildrenDataLoading = useSelector(
    selectDataSingleMatterChildrenLoading
  )
  const selectChildrenDataError = useSelector(
    selectDataSingleMatterChildrenError
  )

  return {
    selectChildrenData,
    selectChildrenDataLoading,
    selectChildrenDataError
  }
}

export function RelationshipData (matterId) {
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'relationship'))
    }
    fetchData()
  }, [dispatch,matterId])

  const selectRelationship = useSelector(selectDataSingleMatterRelationshipData)
  const selectRelationshipLoading = useSelector(
    selectDataSingleMatterRelationshipLoading
  )
  const selectRelationshipError = useSelector(
    selectDataSingleMatterRelationshipError
  )

  return {
    selectRelationship,
    selectRelationshipLoading,
    selectRelationshipError
  }
}

export function CourtData (matterId) {
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'court'))
    }
    fetchData()
  }, [dispatch,matterId])

  const selectCourt = useSelector(selectSingleMatterCourtData)
  const selectCourtLoading = useSelector(selectSingleMatterCourtLoading)
  const selectCourtError = useSelector(selectSingleMatterCourtError)

  return {
    selectCourt,
    selectCourtLoading,
    selectCourtError
  }
}

export function IncomeBenefits (matterId) {
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'incomeBenefits'))
    }
    fetchData()
  }, [dispatch,matterId])

  const selectIncomeData = useSelector(selectDataSingleMatterIncomeBenefitsData)
  const selectIncomeDataLoading = useSelector(
    selectDataSingleMatterIncomeBenefitsLoading
  )
  const selectIncomeDataError = useSelector(
    selectDataSingleMatterIncomeBenefitsError
  )

  return {
    selectIncomeData,
    selectIncomeDataLoading,
    selectIncomeDataError
  }
}

export function EmploymentData (matterId) {
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'employment'))
    }
    fetchData()
  }, [dispatch,matterId])

  const employmentData = useSelector(selectDataSingleMatterEmploymentData)
  const selectEmploymentDataLoading = useSelector(
    selectDataSingleMatterEmploymentLoading
  )
  const selectEmploymentDataError = useSelector(
    selectDataSingleMatterEmploymentError
  )

  const selectEmployment = employmentData?.body.reduce((acc, cur) => {
    if (cur.role === 'Client') {
      acc.client = cur
    } else if (cur.role === 'Opposing Party') {
      acc.opposingParty = cur
    }
    return acc
  }, {})

  return {
    selectEmployment,
    selectEmploymentDataLoading,
    selectEmploymentDataError
  }
}

export function ExpenseData (matterId) {
  console.log('expenses')
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'expenses'))
    }
    fetchData()
  }, [dispatch,matterId])

  const selectExpenseData = useSelector(selectDataSingleMatterExpenseData)
  const selectExpenseDataLoading = useSelector(
    selectDataSingleMatterExpenseLoading
  )
  const selectExpenseDataError = useSelector(selectDataSingleMatterExpenseError)

  return {
    selectExpenseData,
    selectExpenseDataLoading,
    selectExpenseDataError
  }
}

export function BackgroundData (matterId) {
  const dispatch = useDispatch();
  useEffect(() => {
    
      dispatch(getSingleMatterData(matterId, 'background'))
 
  }, [dispatch,matterId])

  const selectBackground = useSelector(selectDataSingleMatterBackgroundData)
  const selectBackgroundLoading = useSelector(selectDataSingleMatterLoading)
  const selectBackgroundError = useSelector(selectDataSingleMatterError)

  return {
    selectBackground,
    selectBackgroundLoading,
    selectBackgroundError
  }
}



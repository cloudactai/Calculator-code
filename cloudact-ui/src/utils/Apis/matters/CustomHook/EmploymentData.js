import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions"
import { selectDataSingleMatterEmploymentData, selectDataSingleMatterEmploymentError, selectDataSingleMatterEmploymentLoading } from "../getSingleMatterData/getSingleMattersDataSelectors"

export function EmploymentData(matterId) {
  const dispatch = useDispatch()
  
  useEffect(() => {
    const fetchData = async () => {
       dispatch(getSingleMatterData(matterId, 'employment'))
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


export function EmploymentStatus(data) {
  let employmentInfo = {};

  if (data) {
    employmentInfo = data.reduce((acc, cur) => {
      if (cur.role === 'Client') {
        acc.client = cur;
      } else if (cur.role === 'Opposing Party') {
        acc.opposingParty = cur;
      }
      return acc; // Ensure acc is returned here
    }, {});
  }

  return { employmentInfo }; // Return an object containing employmentInfo
}
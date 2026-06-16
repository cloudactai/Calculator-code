import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions"
import { selectDataSingleMatterDebtData, selectDataSingleMatterDebtError, selectDataSingleMatterDebtLoading} from "../getSingleMatterData/getSingleMattersDataSelectors"

export function DebtData (matterId) {
    const dispatch = useDispatch()
    useEffect(() => {
      const fetchData = async () => {
         dispatch(getSingleMatterData(matterId, 'debtsLiabilities'))
      }
      fetchData()
    }, [dispatch,matterId])
  
    const selectDebt = useSelector(selectDataSingleMatterDebtData)
    const selectDebtLoading = useSelector(selectDataSingleMatterDebtLoading)
    const selectDebtError = useSelector(selectDataSingleMatterDebtError)
  
    return {
      selectDebt,
      selectDebtLoading,
      selectDebtError
    }
  }
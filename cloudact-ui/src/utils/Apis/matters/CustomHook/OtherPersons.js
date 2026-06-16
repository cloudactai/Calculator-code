import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions"
import { selectDataSingleMatterOtherPersonsData, selectDataSingleMatterOtherPersonsError, selectDataSingleMatterOtherPersonsLoading} from "../getSingleMatterData/getSingleMattersDataSelectors"

export function OtherPersons(matterId) {
    const dispatch = useDispatch()
    useEffect(() => {
        const fetchData = async () => {
            await dispatch(getSingleMatterData(matterId, 'otherPersons'))
        }
        fetchData()
    }, [dispatch,matterId])

    const selectOtherPersons = useSelector(selectDataSingleMatterOtherPersonsData)
    const selectOtherPersonsLoading = useSelector(selectDataSingleMatterOtherPersonsLoading)
    const selectOtherPersonsError = useSelector(selectDataSingleMatterOtherPersonsError)

    return {
        selectOtherPersons,
        selectOtherPersonsLoading,
        selectOtherPersonsError
    }
}
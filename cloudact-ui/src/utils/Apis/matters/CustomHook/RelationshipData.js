import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions"
import { selectDataSingleMatterRelationshipData, selectDataSingleMatterRelationshipError, selectDataSingleMatterRelationshipLoading } from "../getSingleMatterData/getSingleMattersDataSelectors"

export function RelationshipData (matterId) {
    const dispatch = useDispatch()
    useEffect(() => {
      const fetchData = async () => {
       dispatch(getSingleMatterData(matterId, 'relationship'))
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
  
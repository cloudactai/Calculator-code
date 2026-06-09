import { useDispatch, useSelector } from "react-redux";
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions";
import {
  selectDataSingleMatterBackgroundData,
  selectDataSingleMatterChildrenData,
  selectDataSingleMatterEmploymentData,
  selectDataSingleMatterIncomeBenefitsData,
  selectDataSingleMatterLoading,
  selectDataSingleMatterRelationshipData,
  selectDataSingleMatterRelationshipLoading,
  selectSingleMatterCourtData
} from "../getSingleMatterData/getSingleMattersDataSelectors";
import { useEffect } from "react";

// Custom hook to fetch data for a single matter
const useSingleMatterData = (matterId) => {

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getSingleMatterData(matterId, 'background'));
      await dispatch(getSingleMatterData(matterId, 'court'));
      await dispatch(getSingleMatterData(matterId, 'relationship'));
      await dispatch(getSingleMatterData(matterId, 'children'));
      await dispatch(getSingleMatterData(matterId, 'employment'));
      await dispatch(getSingleMatterData(matterId, 'incomeBenefits'))
    };
    fetchData();
  }, [dispatch, matterId]);

  const selectCourt = useSelector(selectSingleMatterCourtData);
  const selectBackground = useSelector(selectDataSingleMatterBackgroundData);
  const selectBackgroundLoading = useSelector(selectDataSingleMatterLoading);
  const selectRelationship = useSelector(selectDataSingleMatterRelationshipData);
  const selectRelationshipLoading = useSelector(selectDataSingleMatterRelationshipLoading);
  const selectChildren = useSelector(selectDataSingleMatterChildrenData);
  const employmentData = useSelector(selectDataSingleMatterEmploymentData);
  const selectIncomeData = useSelector(selectDataSingleMatterIncomeBenefitsData)


  const selectEmployment = employmentData?.body.reduce((acc, cur) => {
    if (cur.role === 'Client') {
      acc.client = cur
    } else if (cur.role === 'Opposing Party') {
      acc.opposingParty = cur
    }
    return acc
  }, {})

  return {
    selectCourt,
    selectBackground,
    selectBackgroundLoading,
    selectRelationship,
    selectRelationshipLoading,
    selectChildren,
    selectEmployment,
    selectIncomeData
  };
};


export default useSingleMatterData;
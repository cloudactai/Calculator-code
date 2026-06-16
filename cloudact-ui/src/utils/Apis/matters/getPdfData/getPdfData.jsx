import { useDispatch } from "react-redux";
import { getSingleMatterData } from "../getSingleMatterData/getSingleMattersDataActions";
import { useEffect } from "react";

export const GetPDFData = (matterNumber) => {
    const dispatch = useDispatch();

    
    useEffect(() => {
        const fetchData = async () => {
            await dispatch(getSingleMatterData(matterNumber, 'background'));
        };
        fetchData();
    },[]);
    
}
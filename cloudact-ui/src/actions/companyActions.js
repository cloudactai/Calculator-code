import Cookies from "js-cookie";
import { COMPANY_INFO_FAIL, COMPANY_INFO_REQUEST, COMPANY_INFO_SUCCESS } from "../constants/companyConstants";
import { fetchRequest } from "../utils/fetchRequest";
import { getUserSID } from "../utils/helpers";
import CookiesParser from "../utils/cookieParser/Cookies";
import axios from "../utils/axios";

export const companyInfoAction = (state = {}, action) => async (dispatch) => {
    try {
        const sid = getUserSID();
        const companyDataResponse = await axios.get(`/getcompanydata/${sid}`);
        console.log("Company Data Response:", companyDataResponse.data);

        // If company data is already available, skip the API call
        if (companyDataResponse.data.code === 200) {
            if(companyDataResponse.data.data[0].companyInfo != null) return; // Exit early if company info is available
        }
        dispatch({ type: COMPANY_INFO_REQUEST });

        // Fetch company data if not available
        const { data } = await fetchRequest("get", `companyInfo/${getUserSID()}`);

        console.log("Company Info:", data);

        if (data && data.data.code === 200 && data.data.status === "success") {
            console.log("Company Info success");

            const companyDataBody = data.data.body; // Extract the company data

            // Store company data in cookies
            CookiesParser.set("companyInfo", companyDataBody, { path: "/" });

            // Dispatch success action to store in Redux state
            dispatch({ type: COMPANY_INFO_SUCCESS, payload: companyDataBody });

            // Call the updateCompanyData function with the fetched data
            await updateCompanyData(companyDataBody);
        } else {
            dispatch({ type: COMPANY_INFO_FAIL, payload: "Error in company data" });
        }
    } catch (err) {
        dispatch({ type: COMPANY_INFO_FAIL, payload: "Error" });
        console.error("Error in company info action:", err);
    }
};

// Function to update province
const updateCompanyData = async (companyData) => {
    axios.put(`/update/companyData/${getUserSID()}`, { companyData })
      .then((res) => {
        console.log("companyData updated successfully:", res.data);
      })
      .catch((err) => {
        console.error("Error updating province:", err);
      });
  };
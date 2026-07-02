import Navbar from "../Dashboard/Navbar/Navbar";
import InfoHeader from "../Dashboard/InfoHeader";
import { useSelector } from "react-redux";
import axios from "../../utils/axios";
import { getUserSID, getUserId, getCurrentUserFromCookies, updateInfoInCurrentUser } from "../../utils/helpers";
import toast from "react-hot-toast";
import React, { useEffect } from "react";
import { Roles } from "../../routes/Role.types";

const isPersonalAuthUser = (user) => {
  if (!user) return false;
  const roleUser = Array.isArray(user.role) ? user.role[0] : null;
  const id = user.id || user.uid || roleUser?.id || roleUser?.uid;
  const sid = user.sid || roleUser?.sid;
  return Boolean(id && sid && String(id) === String(sid));
};

const Layout = ({ children, title }) => {
  const { sidebarCollapse } = useSelector((state) => state.userChange);



  // live update province with QBO check everytime user open app or switch
  // useEffect(() => {
  //   console.log("err2332323", getUserSID(), getCurrentUserFromCookies().role);
  //   if(getCurrentUserFromCookies().role != Roles.SUPERADMIN){
  //     axios.get(`/companyinfo/${getUserSID()}`).then((res) => {
  //       const {CountrySubDivisionCode } = res.data.data.body.legaladdress;
  //         let updateData = {
  //           sid: getUserSID(),
  //           province: CountrySubDivisionCode
  //         }
  //         console.log('updateData',updateData)
  //         if(CountrySubDivisionCode !== getCurrentUserFromCookies().province){
  //           axios.put(
  //             `/update/province`, updateData).then((res) => {
  //               const { data } = res.data;
  //               updateInfoInCurrentUser({province:CountrySubDivisionCode})

  //           }).catch((err) => {
  //             console.log('err',err)
  //             toast.error('Current province not match with QBO province')
  //           });
  //         }

  //     }).catch((err) => {
  //       console.error('Error getting company info or Token expired Please reconnect again')
  //       // toast.error('Error getting company info or Token expired Please reconnect again')
  //     });
  //   }
  // },[])


  const fetchCompanyData = async () => {
    try {
      console.log("Fetching company data...");
      const sid = getUserSID();

      const res = await axios.get(`/companyinfo/${sid}`);
      console.log("Company Info Response:", res);

      if (res.data.data.code === 200) {
        const companyData = res.data.data.body;
        const { CountrySubDivisionCode } = companyData.legaladdress;

        // Update province info in the current user session
        updateInfoInCurrentUser({ province: CountrySubDivisionCode });

        // Now, update company data
        await updateCompanyData(companyData);
      } else if (res.data.data.code === 400) {
        toast.error(res.data.data.message.message);
      } else {
        throw new Error("Unexpected response code");
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast.error("Internal Server Error");
    }
  };

  const updateCompanyData = async (companyData) => {
    try {
      const sid = getUserSID();
      const res = await axios.put(`/update/companyData/${sid}`, { companyData });
      console.log("Company data updated successfully:", res.data);
    } catch (error) {
      console.error("Error updating company data:", error);
      toast.error("Failed to update province");
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      console.log("Checking user role and fetching company data...");
      const user = getCurrentUserFromCookies();

      if (isPersonalAuthUser(user)) {
        console.log("Personal auth user detected; skipping legacy company data fetch.");
        return;
      }

      if (user.role !== "SUPERADMIN") {
        try {
          const sid = getUserSID();
          const companyDataResponse = await axios.get(`/getcompanydata/${sid}`);
          console.log("Company Data Response:", companyDataResponse.data);

          console.log("Company Data Response:", companyDataResponse.data);

          const isSuccess = companyDataResponse.data.code === 200;
          const companyInfo = companyDataResponse.data.data[0]?.companyInfo;

          if (isSuccess) {
            if (!companyInfo) {
              console.log("Company data exists, but company info is missing. Fetching company info...");
              await fetchCompanyData();
            } else {
              console.log("Company data already exists, skipping API call", companyInfo);
            }
          } else {
            console.log("Company data not found. Fetching company info...");
            await fetchCompanyData();
          }

        } catch (error) {
          console.error("Error fetching company data:", error);
          if (error?.response?.status !== 401) {
            toast.error("Failed to fetch company data.");
          }
        }
      }
    };

    fetchData();
  }, []); // Runs only on the initial render


  return (
    <section className={`wrapper ${sidebarCollapse ? "mini" : ""}`}>
      <aside className="mainSide">
        <Navbar />
      </aside>
      <main>
        <InfoHeader title={title} />
        {children}
      </main>
    </section>
  );
};

export default Layout;

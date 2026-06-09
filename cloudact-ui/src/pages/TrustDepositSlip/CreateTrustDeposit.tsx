import React from "react"; 
import { useSelector } from "react-redux";

import Layout from "../../components/LayoutComponents/Layout";
import TaskTypeFormTrustDeposit from "./TaskTypeFormTrustDeposit.tsx";
import { RootState } from "./interface/trustDepositInterface";


const CreateTrustDeposit: React.FC = () => {

  // get user data from redux to display username
  const { userInfo } = useSelector((state:RootState) => state.userLogin);
  
  return (
    <Layout title={`Welcome ${userInfo?.username ? userInfo?.username : ""}`}>
      <h5 className="calcTitle mb-0">Tasks / Add Trust Deposit Slip</h5>
      <div className="row">
        <div className="col-md-10 offset-md-1">
          <TaskTypeFormTrustDeposit/>
        </div>
      </div>
    </Layout>
  );
};

export default CreateTrustDeposit;

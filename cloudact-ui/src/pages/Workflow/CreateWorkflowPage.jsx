import React from "react";
import Layout from "../../components/LayoutComponents/Layout";
// import BreadCrumb from "../components/BreadCrumb";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import WorkflowTypeForm from "../../components/Workflow/WorkflowTypeForm";

const CreateWorkflowPage = ({ type }) => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const location = useLocation();

  const typeForm =  "WORKFLOW_FORM";

  return (
    <Layout title={`Welcome ${userInfo?.username ? userInfo?.username : ""}`}>
      <h5 className="calcTitle mb-0">Workflow / Add Workflow</h5>
      {/* <BreadCrumb options={[{ option: "Tasks", link: "/tasks" }]} currentPage={currPage}/> */}
      <div className="row">
        <div className="col-md-10 offset-md-1">
       <WorkflowTypeForm type={typeForm} />
        </div>
      </div>
    </Layout>
  );
};

export default CreateWorkflowPage;

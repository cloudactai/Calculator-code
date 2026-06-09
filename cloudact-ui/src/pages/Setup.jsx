import React from "react";
import SetupDashboard from "../components/Setup/SetupDashboard";
import Layout from "../components/LayoutComponents/Layout";

const Setup = ({ userInfo }) => {
  return (
    <Layout title="Settings">
      <SetupDashboard />
       {/* <h2 className="heading-2 mx-4">Welcome {userInfo.username}</h2> */}
    </Layout>
  );
};

export default Setup;

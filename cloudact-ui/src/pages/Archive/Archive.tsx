import React from "react";
import Layout from "../../components/LayoutComponents/Layout";
import { useSelector } from "react-redux";
import ArchiveComplianceTable from "./ArchiveComplianceTable";
import FooterDash from "../../components/Dashboard/FooterDash/FooterDash";
import ArchiveChecklist from "./ArchiveChecklist";
import ArchiveReportTable from "./ArchiveReportTable";
import ArchiveBilling from "./ArchiveBilling";
import { ArchiveFilterOptions } from "./interface/Archive";
import { RootState } from "../TrustDepositSlipNew/interface/trustdepoInterface";
import ArchiveWorkflowList from "./ArchiveWorkflow";

const Archive: React.FC = () => {
  const { response } = useSelector((state: RootState) => state.userProfileInfo);

  const [ArchiveFilter, setArchiveFilter] =
    React.useState<ArchiveFilterOptions>("Reports");

  return (
    <Layout title={`Welcome ${response?.username || ""}`}>
      {(() => {
        console.log("ArchiveFilter", ArchiveFilter); // Log ArchiveFilter before the switch

        switch (ArchiveFilter) {
          case "Monthly Checklist":
            return (
              <ArchiveChecklist
                setArchiveFilter={setArchiveFilter}
                ArchiveFilter={ArchiveFilter}
              />
            );
          case "Compliance Form":
            return (
              <ArchiveComplianceTable
                setArchiveFilter={setArchiveFilter}
                ArchiveFilter={ArchiveFilter}
              />
            );
          case "Billing":
            console.log("Billing");
            return (
              <ArchiveBilling
                setArchiveFilter={setArchiveFilter}
                ArchiveFilter={ArchiveFilter}
              />
            );
          case "Workflow":
            return (
              <ArchiveWorkflowList
                setArchiveFilter={setArchiveFilter}
                ArchiveFilter={ArchiveFilter}
              />
            );
          default:
            return (
              <ArchiveReportTable
                setArchiveFilter={setArchiveFilter}
                ArchiveFilter={ArchiveFilter}
              />
            );
        }
      })()}
      <FooterDash />
    </Layout>
  );
};

export default Archive;

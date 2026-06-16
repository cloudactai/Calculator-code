import useQuery from "../../hooks/useQuery";
import Layout from "../../components/LayoutComponents/Layout";
import {
  getCurrentUserFromCookies,
  getLayoutTitle
} from "../../utils/helpers";
import ComplianceFormON from "./ComplianceFormON";
import ComplianceFormAB from "./ComplianceFormAB";
import ComplianceFormBC from "./ComplianceFormBC";


const ComplianceForm: React.FC = () => {
  // Get the query parameters and the task state from the history
  const query = useQuery();
  const step = parseInt(query.get("step") || "0", 10);


  
  return (
    <>
      <Layout title={getLayoutTitle(step)}>

      {
        getCurrentUserFromCookies().province =='ON' ?
        <ComplianceFormON/> : 
        getCurrentUserFromCookies().province == 'BC' ?
        <ComplianceFormBC/>  : <ComplianceFormAB/>
      }

      </Layout>
    </>

  );
};

export default ComplianceForm;


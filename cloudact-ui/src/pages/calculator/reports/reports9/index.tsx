import { Col, Row, Table } from "react-bootstrap";
import { ColumnSimple, TableColumnsCompare ,TableColumnsCompareLumpsum} from "../reports3";
import {
  showElementForReportType,
} from "..";


const Reports9 = ({ data }: { data: any }) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;

   

  return (
    <div className="pagePDF">
      <span className="headingPDF">RESTRUCTURING </span>
   
      <CalculationTable data={data} />
      <div className="paginationPDF">
        Page{" "}
        {showElementForReportType(calculatorType, reportType, 5, "currentPage")}{" "}
        of{" "}
        {showElementForReportType(
          calculatorType,
          reportType,
          "otherDetails",
          "totalPages"
        )}
      </div>
    </div>
  );
};

const CalculationTable = ({ data }: { data: any }) => {
  return (
    <>
      <Row className="">
        <Col>
          <AllCalculationTable values={data} />
        </Col>
      </Row>
    </>
  );
};

const AllCalculationTable = ({
  values,
}: {
  values: {
    scenarios:any,
  
  };
}) => {
  const {
    scenarios
  } = values;

  const maxLength = Math.max(
    scenarios.scenario1.cashFlowsAndDurations.length,
    scenarios.scenario2.cashFlowsAndDurations.length,
    scenarios.scenario3.cashFlowsAndDurations.length
  );
 



  const senerios = ["scenario1", "scenario2", "scenario3"];

  return (
    <>
      <div
        className="tableOuterPDF transparent"
        style={{ margin: "10px 0 0 0" }}
      >
     

<table >
      <thead>
        <tr>
          <th>Restructuring</th>
          <th>Scenario 1</th>
          <th>Scenario 2</th>
          <th>Scenario 3</th>
        </tr>
      </thead>
      <tbody>
        {[...Array(maxLength).keys()].map((value, index) => (
          <>
            <tr key={index}>
              <td>Support payment </td>
              <td> {scenarios.scenario1.cashFlowsAndDurations[index]?.cashFlows || ''}</td>
              <td>
                {scenarios.scenario2.cashFlowsAndDurations[index]?.cashFlows || ''}
              </td>
              <td>
                {scenarios.scenario3.cashFlowsAndDurations[index]?.cashFlows || ''}
              </td>
            </tr>

         

            <tr key={index}>
              <td>For (duration) </td>
              <td>{scenarios.scenario1.cashFlowsAndDurations[index]?.duration || ''}</td>
              <td>
                {scenarios.scenario2.cashFlowsAndDurations[index]?.duration || ''}
              </td>
              <td>
                {scenarios.scenario3.cashFlowsAndDurations[index]?.duration || ''}
              </td>
            </tr>


            

            {index !== maxLength - 1 && (
              <tr>
                <td colSpan={4}>
                  <p style={{ fontSize: '12.3px'  , textAlign:"center" , margin:0 , padding:"5px"}}>And then</p>
                </td>
              </tr>
            )}

          </>
        ))}

        <tr>
          <td>Support Total</td>
          <td>{scenarios.scenario1.npvResult}</td>
          <td>{scenarios.scenario2.npvResult}</td>
          <td>{scenarios.scenario3.npvResult}</td>
        </tr>
      </tbody>
    </table>


     


      </div>
    
    </>
  );
};



export default Reports9;

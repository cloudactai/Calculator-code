import { Col, Row } from "react-bootstrap";
import { formatNumberInThousands } from "../../../utils/helpers/Formatting";
import { propsTableParams } from "./Screen2";

const AfterCalculationsTable = ({
  values,
}: {
  low: propsTableParams;
  med: propsTableParams;
  high: propsTableParams;
}) => {
  const { low, med, high } = values;


  const headings = [
    "Parties",
    "Income",
    "Taxes",
    "Credits",
    "Child Support",
    "Notional ChildSupport",
    "Special Expenses",
    "Percentage",
    "Spousal Support",
  ];

  return (
    <Row>
      <Col xs={2}>
        {headings.map((e) => (
          <h4 style={{fontSize: "1.1rem"}} className=" fw-bold"> {e}</h4>
        ))}
      </Col>

<Col xs={10}>
      <Row>
      <CalculationsForDifferentRates values={low} />
      <CalculationsForDifferentRates values={med} />
      <CalculationsForDifferentRates values={high} />
      </Row>
</Col>
    </Row>
  );
};

const CalculationsForDifferentRates = ({
  values,
}: {
  values: propsTableParams;
}) => {

  // if (values.notionalChildSupport.party1 > values.notionalChildSupport.party2) {
  //   values.notionalChildSupport.party1 = 0;
  // } else {
  //   values.notionalChildSupport.party2 = 0;
  // }

  return (
      <>
        <Col>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom fw-bold">Party 1</div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.incomes?.party1)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.taxesAndDeductions?.party1)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.benefitsAndCredits?.party1)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.childSupport?.party1)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.notionalChildSupport?.party1)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.specialExpenses?.party1)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">{values?.percentage}%</div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.spousalSupport?.party1)}
          </div>
        </Col>

        <Col>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom fw-bold">Party 2</div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.incomes?.party2)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.taxesAndDeductions?.party2)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.benefitsAndCredits?.party2)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.childSupport?.party2)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.notionalChildSupport?.party2)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.specialExpenses?.party2)}
          </div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">{values?.percentage}%</div>
          <div style={{fontSize: "1.2rem"}} className=" border-bottom">
            {formatNumberInThousands(values?.spousalSupport?.party2)}
          </div>
        </Col>
      </>
  );
};

export default AfterCalculationsTable;

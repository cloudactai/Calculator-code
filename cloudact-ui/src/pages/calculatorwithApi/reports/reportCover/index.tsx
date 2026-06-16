import {
  conditionForCustodialFormula,
  conditionForOnlyChild,
  conditionForWithoutChild,
} from "..";
import { momentFunction } from "../../../../utils/moment";
import {
  WITHOUT_CHILD_FORMULA,
  CUSTODIAL_FORMULA,
  ONLY_CHILD,
} from "../../Calculator.ts";

const index = ({ data }: any) => {
  const report_type = data.report_type;
  const calculator_type = data.calculator_type;

  const typeOfReport = (
    reportType: WITHOUT_CHILD_FORMULA | ONLY_CHILD | CUSTODIAL_FORMULA,
    calculatorType: string
  ) => {
    if (conditionForWithoutChild(reportType, calculatorType)) {
      return "Spousal Support";
    } else if (conditionForOnlyChild(reportType, calculatorType)) {
      return "Child Support";
    } else if (conditionForCustodialFormula(reportType, calculatorType)) {
      return "Child and Spousal Support";
    }
  };

  return (
    <div className="pagePDF first">
      {/* <span className="titlePDF">CLOUD1 ACT {data?.background?.party1FirstName} and{" "}{data?.background?.party2FirstName} {typeOfReport(report_type, calculator_type)} Case</span> */}
      <div className="middleElementPDF">
        <span className="titlePDF">
          <strong>
            Report on {typeOfReport(report_type, calculator_type)} for{" "}
            {data?.background?.party1FirstName} and{" "}
            {data?.background?.party2FirstName} on{" "}
            {momentFunction.formatDate(data?.updated_at)}.
          </strong>
        </span>
        <span className="textPDF">
          Results and calculation details drawn from Cloud Act online
          calculator.
        </span>
      </div>
    </div>
  );
};

export default index;

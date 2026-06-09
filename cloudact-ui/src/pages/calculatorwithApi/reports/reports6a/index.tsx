import { Col, Table } from "react-bootstrap";
import { removeNegSignAndWrapInBrackets, showElementForReportType } from "..";
import { formatNumber } from "../../../../utils/helpers/Formatting";
import { getProvinceForm } from "../../../../utils/helpers/province";
import { aboutYourChildrenState } from "../../screen1/Screen1";
import {
  filterEmployedIncome10100AndSum,
  filterSelfEmployedIncomeAndSum,
  MinimumAgeOfChildren,
} from "../../screen2/Screen2";
import { totalInArray } from "../../../../utils/helpers";

const Reports6a = ({ data }: any) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;

  console.log("report for child desb", data.childDisabilityBenefitParty1);

  return (
    <div className="pagePDF">
      <span className="headingPDF">TAX PROFILE</span>
      <span className="textPDF" style={{ margin: "10px 0 0 0" }}>
        The taxes paid and benefits received by each party will vary depending
        on the amount of spousal support that is paid. Detailed tax profiles for
        each party and each scenario are set out below.
      </span>
      {data && <CalculationTable data={data} />}
      <div className="paginationPDF">
        Page{" "}
        {showElementForReportType(calculatorType, reportType, 7, "currentPage")}{" "}
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

const limitValueForChildExpenses = (
  childSupportVal: number,
  aboutTheChildren: aboutYourChildrenState
) => {
  if (MinimumAgeOfChildren(aboutTheChildren) < 7) {
    if (childSupportVal > 8000) {
      return 8000;
    }
  } else if (
    MinimumAgeOfChildren(aboutTheChildren) >= 7 &&
    MinimumAgeOfChildren(aboutTheChildren) <= 17
  ) {
    if (childSupportVal > 5000) {
      return 5000;
    }
  }
  return childSupportVal;
};

const CalculationTable = ({ data }: any) => {
  const taxesAndDeductions = [
    {
      key: "Federal Tax",
      value: {
        party1Low:
          data?.federalTaxValues?.party1Low > 0
            ? data?.federalTaxValues?.party1Low
            : 0,
        party1Med:
          data?.federalTaxValues?.party1Med > 0
            ? data?.federalTaxValues?.party1Med
            : 0,
        party1High:
          data?.federalTaxValues?.party1High > 0
            ? data?.federalTaxValues?.party1High
            : 0,
        party2Low:
          data?.federalTaxValues?.party2Low > 0
            ? data?.federalTaxValues?.party2Low
            : 0,
        party2Med:
          data?.federalTaxValues?.party2Med > 0
            ? data?.federalTaxValues?.party2Med
            : 0,
        party2High:
          data?.federalTaxValues?.party2High > 0
            ? data?.federalTaxValues?.party2High
            : 0,
      },
    },
    {
      key: `${getProvinceForm(data?.background.party1province)} Tax`,
      value: {
        party1Low: data?.ontarioTaxValues?.party1Low,
        party1Med: data?.ontarioTaxValues?.party1Med,
        party1High: data?.ontarioTaxValues?.party1High,
        party2Low: data?.ontarioTaxValues?.party2Low,
        party2Med: data?.ontarioTaxValues?.party2Med,
        party2High: data?.ontarioTaxValues?.party2High,
      },
    },
    {
      key: "CPP and EI for Employed",
      value: {
        party1Low: data?.CPPandEIValues?.party1Low,
        party1Med: data?.CPPandEIValues?.party1Med,
        party1High: data?.CPPandEIValues?.party1High,
        party2Low: data?.CPPandEIValues?.party2Low,
        party2Med: data?.CPPandEIValues?.party2Med,
        party2High: data?.CPPandEIValues?.party2High,
      },
    },
    {
      key: "CPP and EI for Self Employed",
      value: {
        party1Low: data?.CPPandEISelfEmployedValues?.party1Low,
        party1Med: data?.CPPandEISelfEmployedValues?.party1Med,
        party1High: data?.CPPandEISelfEmployedValues?.party1High,
        party2Low: data?.CPPandEISelfEmployedValues?.party2Low,
        party2Med: data?.CPPandEISelfEmployedValues?.party2Med,
        party2High: data?.CPPandEISelfEmployedValues?.party2High,
      },
    },
    {
      key: "Provincial Credits",
      value: {
        party1Low: data?.provincialCredits?.party1 * -1,
        party1Med: data?.provincialCredits?.party1 * -1,
        party1High: data?.provincialCredits?.party1 * -1,
        party2Low: data?.provincialCredits?.party2 * -1,
        party2Med: data?.provincialCredits?.party2 * -1,
        party2High: data?.provincialCredits?.party2 * -1,
      },
    },
    {
      key: "Total",
      value: {
        party1Low: totalInArray([
          data?.federalTaxValues?.party1Low > 0
            ? data?.federalTaxValues?.party1Low
            : 0,
          data?.ontarioTaxValues?.party1Low,
          data?.CPPandEIValues?.party1Low,
          data?.CPPandEISelfEmployedValues?.party1Low,
          data?.provincialCredits?.party1 * -1,
        ]),
        party1Med: totalInArray([
          data?.federalTaxValues?.party1Med > 0
            ? data?.federalTaxValues?.party1Med
            : 0,
          data?.ontarioTaxValues?.party1Med,
          data?.CPPandEIValues?.party1Med,
          data?.CPPandEISelfEmployedValues?.party1Med,
          data?.provincialCredits?.party1 * -1,
        ]),
        party1High: totalInArray([
          data?.federalTaxValues?.party1High > 0
            ? data?.federalTaxValues?.party1High
            : 0,
          data?.ontarioTaxValues?.party1High,
          data?.CPPandEIValues?.party1High,
          data?.CPPandEISelfEmployedValues?.party1High,
          data?.provincialCredits?.party1 * -1,
        ]),
        party2Low: totalInArray([
          data?.federalTaxValues?.party2Low > 0
            ? data?.federalTaxValues?.party2Low
            : 0,
          data?.ontarioTaxValues?.party2Low,
          data?.CPPandEIValues?.party2Low,
          data?.CPPandEISelfEmployedValues?.party2Low,
          data?.provincialCredits?.party1 * -1,
        ]),
        party2Med: totalInArray([
          data?.federalTaxValues?.party2Med > 0
            ? data?.federalTaxValues?.party2Med
            : 0,
          data?.ontarioTaxValues?.party2Med,
          data?.CPPandEIValues?.party2Med,
          data?.CPPandEISelfEmployedValues?.party2Med,
          data?.provincialCredits?.party1 * -1,
        ]),
        party2High: totalInArray([
          data?.federalTaxValues?.party2High > 0
            ? data?.federalTaxValues?.party2High
            : 0,
          data?.ontarioTaxValues?.party2High,
          data?.CPPandEIValues?.party2High,
          data?.CPPandEISelfEmployedValues?.party2High,
          data?.provincialCredits?.party1 * -1,
        ]),
      },
    },
  ];
  const benefits = [
    {
      key: "Canada Child Benefit",
      value: {
        party1Low: data?.canadaChildBenefitValues?.party1Low,
        party1Med: data?.canadaChildBenefitValues?.party1Med,
        party1High: data?.canadaChildBenefitValues?.party1High,
        party2Low: data?.canadaChildBenefitValues?.party2Low,
        party2Med: data?.canadaChildBenefitValues?.party2Med,
        party2High: data?.canadaChildBenefitValues?.party2High,
      },
    },

    {
      key: "Child Disability ",
      value: {
        party1Low: data?.childDisabilityBenefitParty1,
        party1Med: data?.childDisabilityBenefitParty1,
        party1High: data?.childDisabilityBenefitParty1,
        party2Low: data?.childDisabilityBenefitParty2,
        party2Med: data?.childDisabilityBenefitParty2,
        party2High: data?.childDisabilityBenefitParty2,
      },
    },

    {
      key: "Climate action incentive",
      value: {
        party1Low: data?.climateChangeValWithSpecialExpenses?.party1Low,
        party1Med: data?.climateChangeValWithSpecialExpenses?.party1Med,
        party1High: data?.climateChangeValWithSpecialExpenses?.party1High,
        party2Low: data?.climateChangeValWithSpecialExpenses?.party2Low,
        party2Med: data?.climateChangeValWithSpecialExpenses?.party2Med,
        party2High: data?.climateChangeValWithSpecialExpenses?.party2High,
      },
    },
    {
      key: "Canada Workers Benefit",
      value: {
        party1Low: data?.canadaWorkersBenefitWithSpecialExpenses?.party1Low,
        party1Med: data?.canadaWorkersBenefitWithSpecialExpenses?.party1Med,
        party1High: data?.canadaWorkersBenefitWithSpecialExpenses?.party1High,
        party2Low: data?.canadaWorkersBenefitWithSpecialExpenses?.party2Low,
        party2Med: data?.canadaWorkersBenefitWithSpecialExpenses?.party2Med,
        party2High: data?.canadaWorkersBenefitWithSpecialExpenses?.party2High,
      },
    },
    {
      key: "GST/HST Benefit",
      value: {
        party1Low: data?.GSTHSTValues?.party1Low,
        party1Med: data?.GSTHSTValues?.party1Med,
        party1High: data?.GSTHSTValues?.party1High,
        party2Low: data?.GSTHSTValues?.party2Low,
        party2Med: data?.GSTHSTValues?.party2Med,
        party2High: data?.GSTHSTValues?.party2High,
      },
    },
    {
      key: `${getProvinceForm(data?.background.party1province)} Child Benefit`,
      value: {
        party1Low: data?.ontarioChildBenefitValues?.party1Low,
        party1Med: data?.ontarioChildBenefitValues?.party1Med,
        party1High: data?.ontarioChildBenefitValues?.party1High,
        party2Low: data?.ontarioChildBenefitValues?.party2Low,
        party2Med: data?.ontarioChildBenefitValues?.party2Med,
        party2High: data?.ontarioChildBenefitValues?.party2High,
      },
    },
    {
      key: `${getProvinceForm(
        data?.background.party1province
      )} Sales Tax Credit`,
      value: {
        party1Low: data?.ontarioSalesTaxValues?.party1Low,
        party1Med: data?.ontarioSalesTaxValues?.party1Med,
        party1High: data?.ontarioSalesTaxValues?.party1High,
        party2Low: data?.ontarioSalesTaxValues?.party2Low,
        party2Med: data?.ontarioSalesTaxValues?.party2Med,
        party2High: data?.ontarioSalesTaxValues?.party2High,
      },
    },
    {
      key: "Total",
      value: {
        party1Low: totalInArray([
          data?.canadaChildBenefitValues?.party1Low,
          data?.childDisabilityBenefitParty1,
          data?.climateChangeValWithSpecialExpenses?.party1Low,
          data?.canadaWorkersBenefitWithSpecialExpenses?.party1Low,
          data?.GSTHSTValues?.party1Low,
          data?.ontarioChildBenefitValues?.party1Low,
          data?.ontarioSalesTaxValues?.party1Low,
        ]),
        party1Med: totalInArray([
          data?.canadaChildBenefitValues?.party1Med,
          data?.childDisabilityBenefitParty1,
          data?.climateChangeValWithSpecialExpenses?.party1Med,
          data?.canadaWorkersBenefitWithSpecialExpenses?.party1Med,
          data?.GSTHSTValues?.party1Med,
          data?.ontarioChildBenefitValues?.party1Med,
          data?.ontarioSalesTaxValues?.party1Med,
        ]),
        party1High: totalInArray([
          data?.canadaChildBenefitValues?.party1High,
          data?.childDisabilityBenefitParty1,
          data?.climateChangeValWithSpecialExpenses?.party1High,
          data?.canadaWorkersBenefitWithSpecialExpenses?.party1High,
          data?.GSTHSTValues?.party1High,
          data?.ontarioChildBenefitValues?.party1High,
          data?.ontarioSalesTaxValues?.party1High,
        ]),
        party2Low: totalInArray([
          data?.canadaChildBenefitValues?.party2Low,
          data?.childDisabilityBenefitParty2,
          data?.climateChangeValWithSpecialExpenses?.party2Low,
          data?.canadaWorkersBenefitWithSpecialExpenses?.party2Low,
          data?.GSTHSTValues?.party2Low,
          data?.ontarioChildBenefitValues?.party2Low,
          data?.ontarioSalesTaxValues?.party2Low,
        ]),
        party2Med: totalInArray([
          data?.canadaChildBenefitValues?.party2Med,
          data?.childDisabilityBenefitParty2,
          data?.climateChangeValWithSpecialExpenses?.party2Med,
          data?.canadaWorkersBenefitWithSpecialExpenses?.party2Med,
          data?.GSTHSTValues?.party2Med,
          data?.ontarioChildBenefitValues?.party2Med,
          data?.ontarioSalesTaxValues?.party2Med,
        ]),
        party2High: totalInArray([
          data?.canadaChildBenefitValues?.party2High,
          data?.childDisabilityBenefitParty2,
          data?.climateChangeValWithSpecialExpenses?.party2High,
          data?.canadaWorkersBenefitWithSpecialExpenses?.party2High,
          data?.GSTHSTValues?.party2High,
          data?.ontarioChildBenefitValues?.party2High,
          data?.ontarioSalesTaxValues?.party2High,
        ]),
      },
    },
  ];

  return (
    <div className="tableOuterPDF transparent" style={{ margin: "10px 0 0 0" }}>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Party 1</th>
            <th>Party 1</th>
            <th>Party 1</th>
            <th>Party 2</th>
            <th>Party 2</th>
            <th>Party 2</th>
          </tr>
          <tr>
            <th></th>
            <th>Low</th>
            <th>Med</th>
            <th>High</th>
            <th>Low</th>
            <th>Med</th>
            <th>High</th>
          </tr>
        </thead>
        <tbody>
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Taxes And Deductions</strong>
          </span>
          {taxesAndDeductions.map((e) => (
            <TableColumns data={e} />
          ))}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Benefits</strong>
          </span>
          {benefits.map((e) => (
            <TableColumns data={e} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const TableColumns = ({
  data,
}: {
  data: {
    key: string;
    value: {
      party1Low: number;
      party1Med: number;
      party1High: number;
      party2Low: number;
      party2Med: number;
      party2High: number;
    };
  };
}) => {
  return (
    <tr>
      <td>{data.key}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value?.party1Low)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value?.party1Med)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value?.party1High)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value?.party2Low)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value?.party2Med)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value?.party2High)}</td>
    </tr>
  );
};

export default Reports6a;

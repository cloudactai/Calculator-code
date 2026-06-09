import { Col, Row, Table } from "react-bootstrap";
import { propsTableParams, twoPartyStates } from "../../screen2/Screen2";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  ColumnSimple,
  TableColumnsCompare,
  TableColumnsCompareLumpsum,
} from "../reports3";
import {
  INDIPriorToSupport,
  removeNegSignAndWrapInBrackets,
  showElementForReportType,
} from "..";
import {
  formatNumberInThousands,
  formatNumber,
} from "../../../../utils/helpers/Formatting";
import { determineFederalTaxON } from "../../../../utils/helpers/calculator/FederalTax/FederalTax";
import { WITHOUT_CHILD_FORMULA } from "../../Calculator";
import { calculateTaxesParty } from "./Taxes";
import { dynamicValues } from "../../../../utils/helpers/calculator/creditTaxCalculationFormulas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Column = (isNumber: boolean, val: number | string) => {
  return isNumber ? formatNumberInThousands(val) : val;
};

const renderTd = (
  isNumber: boolean,
  val: number | string,
  fw_bold: boolean = false,
  text_end: boolean = false
) => {
  return (
    <td
      style={{ fontSize: "1rem" }}
      className={`${fw_bold ? "fw-bold" : ""} ${text_end ? "text-end" : ""}`}
    >
      {Column(isNumber, val)}
    </td>
  );
};

const Reports5 = ({ data }: { data: any }) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;

  return (
    <div className="pagePDF">
      <span className="headingPDF">NET CASHFLOW ANALYSIS</span>
      <span className="textPDF" style={{ margin: "10px 0 0 0" }}>
        The net after tax cash budget below is intended to be a reference point
        to assist the parties in understanding the cash that would be available
        to budget with on a monthly and annual basis.
      </span>
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
    totalIncomeParty1: number;
    totalIncomeParty2: number;
    childSupport: any;
    calculator_type: String;
    specialExpenses: any;
    spousalSupport: any;
    TaxesAndDeductions: twoPartyStates;
    Benefits: twoPartyStates;
    netAfterTaxAnnualCashFlow: twoPartyStates;
    lowPropsCalTable: propsTableParams;
    medPropsCalTable: propsTableParams;
    highPropsCalTable: propsTableParams;
    fetchedDynamicValues: dynamicValues;
    lumpsum: any;
    lumpsum_duration: any;
    lumpsum_rate: any;
    insurenceReport: any;
    insurence_duration: any;
    insurence_child_duration: any;
    insurence_rate: any;
    includeLifeInsurence: boolean;
    includeLumpsum: boolen;
    specialExpensesArr: {
      party1: [{ label: String; value: String; amount: String }];
      party2: [{ label: String; value: String; amount: String }];
    };
  };
}) => {
  const {
    totalIncomeParty1,
    totalIncomeParty2,
    childSupport,
    specialExpenses,
    spousalSupport,
    lowPropsCalTable,
    medPropsCalTable,
    highPropsCalTable,
    specialExpensesArr,
    calculator_type,
    lumpsum,
    lumpsum_duration,
    lumpsum_rate,
    insurenceReport,
    insurence_duration,
    insurence_child_duration,
    insurence_rate,
    includeLifeInsurence,
    includeLumpsum,
  } = values;

  console.log("values for lumpsum", values);

  const childCareExpensesParty1 = specialExpensesArr.party1.filter(
    (data) => data.value === "21400"
  )[0]?.amount;
  const childCareExpensesParty2 = specialExpensesArr.party2.filter(
    (data) => data.value === "21400"
  )[0]?.amount;
  const partyGivenBy =
    specialExpensesArr.party1.filter((data: any) => data.value === "21400")[0]
      ?.value >
    specialExpensesArr.party2.filter((data: any) => data.value === "21400")[0]
      ?.value
      ? 2
      : 1;

  const taxAnnualCashFlow = (
    totalIncome: number,
    taxes: number,
    ChildSupport: number,
    SpecialExpenses: number,
    spousalSupport: number,
    benefit: number,
    childSupportSpecialExpense: number = 0
  ) => {
    return (
      totalIncome +
      taxes +
      ChildSupport +
      SpecialExpenses +
      spousalSupport +
      benefit +
      childSupportSpecialExpense
    );
  };

  // const calculateFederalTax = (province, Income, ) => {
  //   determineFederalTaxON
  // }

  const spousalSupportForParty =
    spousalSupport?.spousalSupport1Low > spousalSupport?.spousalSupport2Low
      ? 1
      : 2;

  const isFirstPartyPayingSecond = (data: any) => {
    return data?.givenTo !== data?.party2;
  };

  const party1Paying: boolean = isFirstPartyPayingSecond(values);

  const spousalSupportActual = {
    Low1:
      spousalSupportForParty === 1
        ? spousalSupport?.spousalSupport1Low
        : spousalSupport?.spousalSupport2Low,

    Med1:
      spousalSupportForParty === 1
        ? spousalSupport?.spousalSupport1Med
        : spousalSupport?.spousalSupport2Med,

    High1:
      spousalSupportForParty === 1
        ? spousalSupport?.spousalSupport1High
        : spousalSupport?.spousalSupport2High,

    Low2:
      spousalSupportForParty === 1
        ? spousalSupport?.spousalSupport1Low
        : spousalSupport?.spousalSupport2Low,

    Med2:
      spousalSupportForParty === 1
        ? spousalSupport?.spousalSupport1Med
        : spousalSupport?.spousalSupport2Med,

    High2:
      spousalSupportForParty === 1
        ? spousalSupport?.spousalSupport1High
        : spousalSupport?.spousalSupport2High,
  };

  const spousalSupportDeductions = {
    party1Low: party1Paying
      ? spousalSupportActual.Low1 * 12
      : -Math.abs(spousalSupportActual.Low1 * 12),
    party1Med: party1Paying
      ? spousalSupportActual.Med1 * 12
      : -Math.abs(spousalSupportActual.Med1 * 12),
    party1High: party1Paying
      ? spousalSupportActual.High1 * 12
      : -Math.abs(spousalSupportActual.High1 * 12),
    party2Low: party1Paying
      ? -Math.abs(spousalSupportActual.Low2 * 12)
      : spousalSupportActual.Low2 * 12,
    party2Med: party1Paying
      ? -Math.abs(spousalSupportActual.Med2 * 12)
      : spousalSupportActual.Med2 * 12,
    party2High: party1Paying
      ? -Math.abs(spousalSupportActual.High2 * 12)
      : spousalSupportActual.High2 * 12,

    isNumber: true,
  };

  const taxableIncomeValues = {
    party1Low:
      values?.totalIncomeParty1 +
      spousalSupportDeductions.party1Low -
      values?.enhancedCPPDeduction.party1,
    party1Med:
      values?.totalIncomeParty1 +
      spousalSupportDeductions.party1Med -
      values?.enhancedCPPDeduction.party1,
    party1High:
      values?.totalIncomeParty1 +
      spousalSupportDeductions.party1High -
      values?.enhancedCPPDeduction.party1,
    party2Low:
      values?.totalIncomeParty2 +
      spousalSupportDeductions.party2Low -
      values?.enhancedCPPDeduction.party2,
    party2Med:
      values?.totalIncomeParty2 +
      spousalSupportDeductions.party2Med -
      values?.enhancedCPPDeduction.party2,
    party2High:
      values?.totalIncomeParty2 +
      spousalSupportDeductions.party2High -
      values?.enhancedCPPDeduction.party2,
  };

  const taxesObj = (partyNum: 1 | 2, type: "Low" | "Med" | "High") => {
    let taxableIncome;
    let creditParams;
    let childCareExpenses;
    let employedIncome;
    let provincialCredits;
    if (partyNum === 1) {
      employedIncome = values?.employedIncome10100Party1;
      childCareExpenses = values?.childCareExpenses1;
      creditParams = values?.getParamsForCalculatingAllCredits1;
      provincialCredits = values?.allCreditsParty1?.totalOntarioCredits;
      if (type === "Low") {
        taxableIncome = taxableIncomeValues.party1Low;
      } else if (type === "Med") {
        taxableIncome = taxableIncomeValues.party1Med;
      } else {
        taxableIncome = taxableIncomeValues.party1High;
      }
    } else {
      employedIncome = values?.employedIncome10100Party2;
      childCareExpenses = values?.childCareExpenses2;
      creditParams = values?.getParamsForCalculatingAllCredits2;
      provincialCredits = values?.allCreditsParty2?.totalOntarioCredits;
      if (type === "Low") {
        taxableIncome = taxableIncomeValues.party2Low;
      } else if (type === "Med") {
        taxableIncome = taxableIncomeValues.party2Med;
      } else {
        taxableIncome = taxableIncomeValues.party2High;
      }
    }

    const obj = {
      aboutTheChildren: values?.aboutTheChildren,
      federalTaxParams: {
        fetchedFederalValuesDB: values?.fetchedFederalValuesDB,
        taxableIncome: taxableIncome,
        paramsForCalculatingAllCredits: {
          ...creditParams,
          taxableIncome: taxableIncome,
        },
      },
      ontarioTaxParams: {
        taxBrackets: values?.fetchedProvincialTaxDB,
        fetchedHealthTaxDB: values?.fetchedHealthTaxDB,
        taxableIncome: taxableIncome,
        employedIncome,
        provincialCredits: provincialCredits,
        screen1: values?.getParamsForCalculatingAllCredits1.screen1,
        // getParamsForCalculatingAllCredits: { ...creditParams, taxableIncome: taxableIncome },
      },
      CPPForEmployed: {
        employedIncome: employedIncome,
        dynamicValues: creditParams?.dynamicValues,
        selfEmployedIncome: creditParams?.selfEmployedIncome,
      },
      CPPForSelfEmployed: {
        employedIncome: employedIncome,
        dynamicValues: creditParams?.dynamicValues,
        selfEmployedIncome: creditParams?.selfEmployedIncome,
      },
      provincialCreditsParams: {
        childCareExpenses: childCareExpenses,
        taxableAmountAfterSupport: taxableIncome,
        rates: values?.fetchedONCareTaxDB,
      },
      provinceParty1: "ON",
      provinceParty2: "ON",
    };
    console.log("main func", obj);

    return obj;
  };

  const taxesObj1Low = calculateTaxesParty(
    taxesObj(1, "Low"),
    values.fetchedDynamicValues
  );
  const taxesObj1Med = calculateTaxesParty(
    taxesObj(1, "Med"),
    values.fetchedDynamicValues
  );
  const taxesObj1High = calculateTaxesParty(
    taxesObj(1, "High"),
    values.fetchedDynamicValues
  );
  const taxesObj2Low = calculateTaxesParty(
    taxesObj(2, "Low"),
    values.fetchedDynamicValues
  );
  const taxesObj2Med = calculateTaxesParty(
    taxesObj(2, "Med"),
    values.fetchedDynamicValues
  );
  const taxesObj2High = calculateTaxesParty(
    taxesObj(2, "High"),
    values.fetchedDynamicValues
  );

  //do not change its type
  let TaxesValues = {
    party1Low: lowPropsCalTable?.taxesAndDeductions?.party1 * -1,
    party1Med: medPropsCalTable?.taxesAndDeductions?.party1 * -1,
    party1High: highPropsCalTable?.taxesAndDeductions?.party1 * -1,
    party2Low: lowPropsCalTable?.taxesAndDeductions?.party2 * -1,
    party2Med: medPropsCalTable?.taxesAndDeductions?.party2 * -1,
    party2High: highPropsCalTable?.taxesAndDeductions?.party2 * -1,
    isNumber: true,
    isString: false,
  };

  if (values?.report_type === WITHOUT_CHILD_FORMULA) {
    TaxesValues = {
      party1Low: taxesObj1Low,
      party1Med: taxesObj1Med,
      party1High: taxesObj1High,
      party2Low: taxesObj2Low,
      party2Med: taxesObj2Med,
      party2High: taxesObj2High,
      isNumber: true,
      isString: false,
    };
  }

  const childSupportActual = (partyNum: number) => {
    if (!party1Paying && partyNum === 1) {
      return -1 * childSupport.childSupport1;
    } else if (partyNum === 2 && !party1Paying) {
      return childSupport.childSupport1;
    }

    if (party1Paying && partyNum === 1) {
      return -1 * childSupport.childSupport2;
    } else if (party1Paying && partyNum === 2) {
      return childSupport.childSupport2;
    }
  };

  const childSupportActualValues = {
    party1Low: childSupportActual(1),
    party1Med: childSupportActual(1),
    party1High: childSupportActual(1),
    party2Low: childSupportActual(2),
    party2Med: childSupportActual(2),
    party2High: childSupportActual(2),
    isNumber: true,
  };

  const netAfterTaxAnnualCash = {
    party1Low: taxAnnualCashFlow(
      totalIncomeParty1,
      TaxesValues.party1Low,
      childSupportActualValues?.party1Low,
      0,
      spousalSupportDeductions?.party1Low,
      lowPropsCalTable?.benefitsAndCredits?.party1,
      partyGivenBy === 1
        ? specialExpenses?.specialExpensesLow1 * -1
        : specialExpenses?.specialExpensesLow1
    ),

    party1Med: taxAnnualCashFlow(
      totalIncomeParty1,
      TaxesValues.party1Med,
      childSupportActualValues?.party1Med,
      0,
      spousalSupportDeductions?.party1Med,
      medPropsCalTable?.benefitsAndCredits?.party1,
      partyGivenBy === 1
        ? specialExpenses?.specialExpensesMed1 * -1
        : specialExpenses?.specialExpensesMed1
    ),

    party1High: taxAnnualCashFlow(
      totalIncomeParty1,
      TaxesValues.party1High,
      childSupportActualValues?.party1High,
      0,
      spousalSupportDeductions?.party1High,
      highPropsCalTable?.benefitsAndCredits?.party1,
      partyGivenBy === 1
        ? specialExpenses?.specialExpensesHigh1 * -1
        : specialExpenses?.specialExpensesHigh1
    ),

    party2Low: taxAnnualCashFlow(
      totalIncomeParty2,
      TaxesValues.party2Low,
      childSupportActualValues?.party2Low,
      0,
      spousalSupportDeductions?.party2Low,
      lowPropsCalTable?.benefitsAndCredits?.party2,
      partyGivenBy === 2
        ? specialExpenses?.specialExpensesLow1 * -1
        : specialExpenses?.specialExpensesLow1
    ),

    party2Med: taxAnnualCashFlow(
      totalIncomeParty2,
      TaxesValues.party2Med,
      childSupportActualValues?.party2Med,
      0,
      spousalSupportDeductions?.party2Med,
      medPropsCalTable?.benefitsAndCredits?.party2,
      partyGivenBy === 2
        ? specialExpenses?.specialExpensesMed1 * -1
        : specialExpenses?.specialExpensesMed1
    ),

    party2High: taxAnnualCashFlow(
      totalIncomeParty2,
      TaxesValues.party2High,
      childSupportActualValues?.party2High,
      0,
      spousalSupportDeductions?.party2High,
      highPropsCalTable?.benefitsAndCredits?.party2,
      partyGivenBy === 2
        ? specialExpenses?.specialExpensesHigh1 * -1
        : specialExpenses?.specialExpensesHigh1
    ),
    isNumber: false,
    isString: true,
  };

  const childSupportNeg = () => {
    const count = values.aboutTheChildren.count;

    if (totalIncomeParty1 > totalIncomeParty2 && count.party2 > count.party1) {
    } else if (
      totalIncomeParty1 < totalIncomeParty2 &&
      count.party1 < count.party2
    ) {
    }
  };

  childSupportNeg();

  const tableData = [
    {
      key: "Pre-Support annual Income",
      value: {
        party1Low: totalIncomeParty1,
        party1Med: totalIncomeParty1,
        party1High: totalIncomeParty1,
        party2Low: totalIncomeParty2,
        party2Med: totalIncomeParty2,
        party2High: totalIncomeParty2,
        isNumber: true,
      },
    },
    {
      key: "Pre-Support monthly Income",
      value: {
        party1Low: totalIncomeParty1 / 12,
        party1Med: totalIncomeParty1 / 12,
        party1High: totalIncomeParty1 / 12,
        party2Low: totalIncomeParty2 / 12,
        party2Med: totalIncomeParty2 / 12,
        party2High: totalIncomeParty2 / 12,
        isNumber: true,
      },
    },
    {
      key: "% of INDI prior to support",
      value: {
        party1Low: INDIPriorToSupport(totalIncomeParty1, totalIncomeParty2, 1),
        party1Med: INDIPriorToSupport(totalIncomeParty1, totalIncomeParty2, 1),
        party1High: INDIPriorToSupport(totalIncomeParty1, totalIncomeParty2, 1),
        party2Low: INDIPriorToSupport(totalIncomeParty1, totalIncomeParty2, 2),
        party2Med: INDIPriorToSupport(totalIncomeParty1, totalIncomeParty2, 2),
        party2High: INDIPriorToSupport(totalIncomeParty1, totalIncomeParty2, 2),
        isNumber: false,
      },
    },
    {
      key: "Child Support",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          childSupportActualValues.party1Low
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          childSupportActualValues.party1Med
        ),
        party1High: removeNegSignAndWrapInBrackets(
          childSupportActualValues.party1High
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          childSupportActualValues.party2Low
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          childSupportActualValues.party2Med
        ),
        party2High: removeNegSignAndWrapInBrackets(
          childSupportActualValues.party2High
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Child (Special expenses)",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          partyGivenBy === 1
            ? specialExpenses?.specialExpensesLow1 * -1
            : specialExpenses?.specialExpensesLow1
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          partyGivenBy === 1
            ? specialExpenses?.specialExpensesMed1 * -1
            : specialExpenses?.specialExpensesMed1
        ),
        party1High: removeNegSignAndWrapInBrackets(
          partyGivenBy === 1
            ? specialExpenses?.specialExpensesHigh1 * -1
            : specialExpenses?.specialExpensesHigh1
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          partyGivenBy === 2
            ? specialExpenses?.specialExpensesLow1 * -1
            : specialExpenses?.specialExpensesLow1
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          partyGivenBy === 2
            ? specialExpenses?.specialExpensesMed1 * -1
            : specialExpenses?.specialExpensesMed1
        ),
        party2High: removeNegSignAndWrapInBrackets(
          partyGivenBy === 2
            ? specialExpenses?.specialExpensesHigh1 * -1
            : specialExpenses?.specialExpensesHigh1
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Spousal Support",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          spousalSupportDeductions.party1Low
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          spousalSupportDeductions.party1Med
        ),
        party1High: removeNegSignAndWrapInBrackets(
          spousalSupportDeductions.party1High
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          spousalSupportDeductions.party2Low
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          spousalSupportDeductions.party2Med
        ),
        party2High: removeNegSignAndWrapInBrackets(
          spousalSupportDeductions.party2High
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Taxes",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(TaxesValues.party1Low),
        party1Med: removeNegSignAndWrapInBrackets(TaxesValues.party1Med),
        party1High: removeNegSignAndWrapInBrackets(TaxesValues.party1High),
        party2Low: removeNegSignAndWrapInBrackets(TaxesValues.party2Low),
        party2Med: removeNegSignAndWrapInBrackets(TaxesValues.party2Med),
        party2High: removeNegSignAndWrapInBrackets(TaxesValues.party2High),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Benefits",
      value: {
        party1Low: lowPropsCalTable?.benefitsAndCredits?.party1,
        party1Med: medPropsCalTable?.benefitsAndCredits?.party1,
        party1High: highPropsCalTable?.benefitsAndCredits?.party1,
        party2Low: lowPropsCalTable?.benefitsAndCredits?.party2,
        party2Med: medPropsCalTable?.benefitsAndCredits?.party2,
        party2High: highPropsCalTable?.benefitsAndCredits?.party2,
        isNumber: true,
      },
    },
    {
      key: "Net After tax annual Cash flow",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party1Low
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party1Med
        ),
        party1High: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party1High
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party2Low
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party2Med
        ),
        party2High: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party2High
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Net After tax monthly Cash flow",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party1Low / 12
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party1Med / 12
        ),
        party1High: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party1High / 12
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party2Low / 12
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party2Med / 12
        ),
        party2High: removeNegSignAndWrapInBrackets(
          netAfterTaxAnnualCash.party2High / 12
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "% of INDI after support",
      value: {
        party1Low: INDIPriorToSupport(
          netAfterTaxAnnualCash.party1Low,
          netAfterTaxAnnualCash.party2Low,
          1
        ),
        party1Med: INDIPriorToSupport(
          netAfterTaxAnnualCash.party1Med,
          netAfterTaxAnnualCash.party2Med,
          1
        ),
        party1High: INDIPriorToSupport(
          netAfterTaxAnnualCash.party1High,
          netAfterTaxAnnualCash.party2High,
          1
        ),
        party2Low: INDIPriorToSupport(
          netAfterTaxAnnualCash.party1Low,
          netAfterTaxAnnualCash.party2Low,
          2
        ),
        party2Med: INDIPriorToSupport(
          netAfterTaxAnnualCash.party1Med,
          netAfterTaxAnnualCash.party2Med,
          2
        ),
        party2High: INDIPriorToSupport(
          netAfterTaxAnnualCash.party1High,
          netAfterTaxAnnualCash.party2High,
          2
        ),
        isNumber: false,
        isString: false,
      },
    },
  ];

  const tableDataLumpsum =
    calculator_type == "CHILD_AND_SPOUSAL_SUPPORT"
      ? includeLifeInsurence
        ? [
            {
              key: "Spousal Support Lump Sum",
              value: {
                Low: lumpsum.lowparty2,
                Med: lumpsum.midparty2,
                High: lumpsum.highparty2,
                isNumber: false,
                isString: true,
              },
            },
            {
              key: "Spousal Support Lump Sum (duration)",
              value: {
                Low: lumpsum_duration,
                Med: lumpsum_duration,
                High: lumpsum_duration,
                isNumber: false,
                isString: true,
              },
            },
            {
              key: "Spousal Support Lump Sum (discount rate)",
              value: {
                Low: lumpsum_rate,
                Med: lumpsum_rate,
                High: lumpsum_rate,
                isNumber: false,
                isString: false,
              },
            },
            {
              key: "Life Insurance Estimate",
              value: {
                Low: insurenceReport.lowparty2,
                Med: insurenceReport.midparty2,
                High: insurenceReport.highparty2,
                isNumber: false,
                isString: true,
              },
            },

            {
              key: "Life Insurance Estimate (spousal discount rate)",
              value: {
                Low: insurence_duration,
                Med: insurence_duration,
                High: insurence_duration,
                isNumber: false,
                isString: true,
              },
            },
            {
              key: "Life Insurance Estimate ( child discount rate)",
              value: {
                Low: insurence_child_duration,
                Med: insurence_child_duration,
                High: insurence_child_duration,
                isNumber: false,
                isString: true,
              },
            },
            {
              key: "Life Insurance Estimate (  discount rate)",
              value: {
                Low: insurence_rate,
                Med: insurence_rate,
                High: insurence_rate,
                isNumber: false,
                isString: false,
              },
            },
          ]
        : [
            {
              key: "Spousal Support Lump Sum",
              value: {
                Low: lumpsum?.lowparty2,
                Med: lumpsum?.midparty2,
                High: lumpsum?.highparty2,
                isNumber: false,
                isString: true,
              },
            },
            {
              key: "Spousal Support Lump Sum (duration)",
              value: {
                Low: lumpsum_duration,
                Med: lumpsum_duration,
                High: lumpsum_duration,
                isNumber: false,
                isString: true,
              },
            },
            {
              key: "Spousal Support Lump Sum (discount rate)",
              value: {
                Low: lumpsum_rate,
                Med: lumpsum_rate,
                High: lumpsum_rate,
                isNumber: false,
                isString: false,
              },
            },
          ]
      : [
          {
            key: "Spousal Support Lump Sum",
            value: {
              Low: lumpsum.lowparty2,
              Med: lumpsum.midparty2,
              High: lumpsum.highparty2,
              isNumber: false,
              isString: true,
            },
          },
          {
            key: "Spousal Support Lump Sum (duration)",
            value: {
              Low: lumpsum_duration,
              Med: lumpsum_duration,
              High: lumpsum_duration,
              isNumber: false,
              isString: true,
            },
          },
          {
            key: "Spousal Support Lump Sum (discount rate)",
            value: {
              Low: lumpsum_rate,
              Med: lumpsum_rate,
              High: lumpsum_rate,
              isNumber: false,
              isString: false,
            },
          },
        ];

  const heading = [
    values?.background?.party1FirstName,
    values?.background.party2FirstName,
    values?.background?.party1FirstName,
    values?.background?.party2FirstName,
    values?.background?.party1FirstName,
    values?.background?.party2FirstName,
  ];

  const lowMedHigh = ["Low", "Mid", "High"];

  return (
    <>
      <div
        className="tableOuterPDF transparent"
        style={{ margin: "10px 0 0 0" }}
      >
        <table>
          <thead>
            <tr>
              <th></th>
              {lowMedHigh.map((e) => (
                <th className="text-center" colSpan={2}>
                  {e}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              {heading.map((e) => ColumnSimple(e, false))}
            </tr>
          </thead>
          <tbody>
            {tableData
              .filter((h) => {
                if (values.calculator_type === "CHILD_SUPPORT_CAL") {
                  return h.key !== "Spousal Support";
                } else {
                  return h;
                }
              })
              .map((e) => {
                return <TableColumnsCompare data={e} />;
              })}
          </tbody>
        </table>

        {includeLifeInsurence || includeLumpsum ? (
          calculator_type == "CHILD_AND_SPOUSAL_SUPPORT" ||
          calculator_type == "SPOUSAL_SUPPORT" ? (
            <table className="mt-3">
              <thead>
                <tr>
                  <th></th>
                  {lowMedHigh.map((e) => (
                    <th colSpan={1}>{e}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableDataLumpsum.map((e) => {
                  return <TableColumnsCompareLumpsum data={e} />;
                })}
              </tbody>
            </table>
          ) : (
            ""
          )
        ) : (
          ""
        )}
      </div>
      <div className="chartOuterPDF" style={{ margin: "55px 0 0 0" }}>
        {[
          {
            first: {
              indiPriorParty1: tableData[2].value.party1Low,
              indiPriorParty2: tableData[2].value.party2Low,

              indiAfterParty1: tableData[tableData.length - 1].value.party1Low,
              indiAfterParty2: tableData[tableData.length - 1].value.party2Low,
            },
          },
          {
            first: {
              indiPriorParty1: tableData[2].value.party1Med,
              indiPriorParty2: tableData[2].value.party2Med,

              indiAfterParty1: tableData[tableData.length - 1].value.party1Med,
              indiAfterParty2: tableData[tableData.length - 1].value.party2Med,
            },
          },
          {
            first: {
              indiPriorParty1: tableData[2].value.party1High,
              indiPriorParty2: tableData[2].value.party2High,

              indiAfterParty1: tableData[tableData.length - 1].value.party1High,
              indiAfterParty2: tableData[tableData.length - 1].value.party2High,
            },
          },
        ].map((e) => {
          return (
            <div>
              <BarGraphs values={{ ...e, heading }} />
            </div>
          );
        })}
      </div>
    </>
  );
};

const BarGraphs = ({ values }: { values: any }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 4,
          font: {
            size: 8,
          },
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "center", // top, center, bottom
          },
          distributed: true,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };
  const labels = ["Before support", "After support"];
  const data = {
    labels,
    datasets: [
      {
        label: `${values.heading[0]}`,
        data: [values.first.indiPriorParty1, values.first.indiAfterParty1],
        barThickness: 16,
        barPercentage: 0.7,
        maxBarThickness: 18,
        backgroundColor: "rgba(255, 99, 132, 1)",
      },
      {
        label: `${values.heading[1]}`,
        data: [values.first.indiPriorParty2, values.first.indiAfterParty2],
        barThickness: 16,
        barPercentage: 0.7,
        maxBarThickness: 18,
        backgroundColor: "rgba(53, 162, 235, 1)",
      },
    ],
  };
  return <Bar options={options} data={data} />;
};

export default Reports5;

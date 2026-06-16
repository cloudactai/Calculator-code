import { momentFunction } from "../../../../utils/moment";
import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../../screen1/Screen1";
import { Col, Table } from "react-bootstrap";
import { ColumnSimple, TableColumnsCompare } from "../reports3";
import { removeNegSignAndWrapInBrackets, showElementForReportType } from "..";
import { render0IfValueIsNegative } from "../../../../utils/helpers";

const Reports4 = ({ data }: { data: any }) => {
  const isFirstPartyPayingSecond = (data: any) => {
    return data?.givenTo !== data?.party2;
  };
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;
  return (
    <div className="pagePDF">
      <div>
        <div className="calculator_reports w-100 m-auto ">
          <h4 className="headingPDF">CALCULATION DETAILS - SPOUSAL SUPPORT</h4>
          <SpousalSupportHeading />
          <CalculationsTable data={data} />
          <SpousalSupportDuration data={data} />
        </div>
      </div>
      <div
        className="paginationPDF"
        // style={{ maxHeight: "5vh" }}
      >
        Page{" "}
        {showElementForReportType(calculatorType, reportType, 4, "currentPage")}{" "}
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

const SpousalSupportHeading = () => {
  return (
    <>
      <div className="textPDF" style={{ margin: "10px 0 0 0" }}>
        <strong>C. SPOUSAL SUPPORT QUANTUM</strong>
      </div>
      <div className="textPDF">
        <div
          style={{ margin: "4px 0 0 0", background: "#eee" }}
          className="p-2"
        >
          The With Child support formula: Spousal support calculated below is
          based on a percentage of individual net disposable income. Support
          payments in the low, mid and high scenario will ensure the recipient a
          minimum of 40%, 43% and 46% of the total net disposable income
          respectively.
        </div>
      </div>
      <div className="textPDF" style={{ margin: "4px 0 8px 0" }}>
        Calculation details (Annual) for each of the low, mid and high spousal
        support scenario are set out in the table below.
      </div>
    </>
  );
};

const CalculationsTable = ({ data }: { data: any }) => {
  const childCareExpensesParty1 = data.specialExpensesArr.party1.filter(
    (data: any) => data.value === "21400"
  )[0]?.amount;
  const childCareExpensesParty2 = data.specialExpensesArr.party2.filter(
    (data: any) => data.value === "21400"
  )[0]?.amount;
  const partyGivenBy =
    data?.specialExpensesArr.party1.filter(
      (data: any) => data.value === "21400"
    )[0]?.value >
    data?.specialExpensesArr.party2.filter(
      (data: any) => data.value === "21400"
    )[0]?.value
      ? 2
      : 1;
  const lowPropsCalTable = data.lowPropsCalTable;
  const medPropsCalTable = data.medPropsCalTable;
  const highPropsCalTable = data.highPropsCalTable;
  const tableData = [
    {
      key: "Guideline Income",
      value: {
        party1Low: lowPropsCalTable?.incomes?.party1,
        party1Med: medPropsCalTable?.incomes?.party1,
        party1High: highPropsCalTable?.incomes?.party1,
        party2Low: lowPropsCalTable?.incomes?.party2,
        party2Med: medPropsCalTable?.incomes?.party2,
        party2High: highPropsCalTable?.incomes?.party2,
        isNumber: true,
      },
    },
    {
      key: "Taxes and deductions",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          lowPropsCalTable?.taxesAndDeductions?.party1 * -1
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          medPropsCalTable?.taxesAndDeductions?.party1 * -1
        ),
        party1High: removeNegSignAndWrapInBrackets(
          highPropsCalTable?.taxesAndDeductions?.party1 * -1
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          lowPropsCalTable?.taxesAndDeductions?.party2 * -1
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          medPropsCalTable?.taxesAndDeductions?.party2 * -1
        ),
        party2High: removeNegSignAndWrapInBrackets(
          highPropsCalTable?.taxesAndDeductions?.party2 * -1
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Benefits and credits",
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
      key: "Child Support",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          lowPropsCalTable?.childSupport?.party1 * -1
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          medPropsCalTable?.childSupport?.party1 * -1
        ),
        party1High: removeNegSignAndWrapInBrackets(
          highPropsCalTable?.childSupport?.party1 * -1
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          lowPropsCalTable?.childSupport?.party2 * -1
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          medPropsCalTable?.childSupport?.party2 * -1
        ),
        party2High: removeNegSignAndWrapInBrackets(
          highPropsCalTable?.childSupport?.party2 * -1
        ),
        isString: true,
      },
    },
    {
      key: "Notional Child Support",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          lowPropsCalTable?.notionalChildSupport?.party1 * -1
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          medPropsCalTable?.notionalChildSupport?.party1 * -1
        ),
        party1High: removeNegSignAndWrapInBrackets(
          highPropsCalTable?.notionalChildSupport?.party1 * -1
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          lowPropsCalTable?.notionalChildSupport?.party2 * -1
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          medPropsCalTable?.notionalChildSupport?.party2 * -1
        ),
        party2High: removeNegSignAndWrapInBrackets(
          highPropsCalTable?.notionalChildSupport?.party2 * -1
        ),
        isString: true,
      },
    },
    {
      key: "Special Expenses paid",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(childCareExpensesParty1 * -1),
        party1Med: removeNegSignAndWrapInBrackets(childCareExpensesParty1 * -1),
        party1High: removeNegSignAndWrapInBrackets(
          childCareExpensesParty1 * -1
        ),
        party2Low: removeNegSignAndWrapInBrackets(childCareExpensesParty2 * -1),
        party2Med: removeNegSignAndWrapInBrackets(childCareExpensesParty2 * -1),
        party2High: removeNegSignAndWrapInBrackets(
          childCareExpensesParty2 * -1
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Special Expenses",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          partyGivenBy === 1
            ? data?.specialExpenses?.specialExpensesLow1 * -1
            : data?.specialExpenses?.specialExpensesLow1
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          partyGivenBy === 1
            ? data?.specialExpenses?.specialExpensesMed1 * -1
            : data?.specialExpenses?.specialExpensesMed1
        ),
        party1High: removeNegSignAndWrapInBrackets(
          partyGivenBy === 1
            ? data?.specialExpenses?.specialExpensesHigh1 * -1
            : data?.specialExpenses?.specialExpensesHigh1
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          partyGivenBy === 2
            ? data?.specialExpenses?.specialExpensesLow1 * -1
            : data?.specialExpenses?.specialExpensesLow1
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          partyGivenBy === 2
            ? data?.specialExpenses?.specialExpensesMed1 * -1
            : data?.specialExpenses?.specialExpensesMed1
        ),
        party2High: removeNegSignAndWrapInBrackets(
          partyGivenBy === 2
            ? data?.specialExpenses?.specialExpensesHigh1 * -1
            : data?.specialExpenses?.specialExpensesHigh1
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Percentage",
      value: {
        party1Low: "40",
        party1Med: "43",
        party1High: "46",
        party2Low: "40",
        party2Med: "43",
        party2High: "46",
        isNumber: false,
      },
    },
    {
      key: "Spousal Support",
      value: {
        party1Low: lowPropsCalTable?.spousalSupport?.party1 * 12,
        party1Med: medPropsCalTable?.spousalSupport?.party1 * 12,
        party1High: highPropsCalTable?.spousalSupport?.party1 * 12,
        party2Low: lowPropsCalTable?.spousalSupport?.party2 * 12,
        party2Med: medPropsCalTable?.spousalSupport?.party2 * 12,
        party2High: highPropsCalTable?.spousalSupport?.party2 * 12,
        isNumber: true,
      },
    },
  ];

  const heading = [
    data?.background?.party1FirstName,
    data?.background.party2FirstName,
    data?.background?.party1FirstName,
    data?.background?.party2FirstName,
    data?.background?.party1FirstName,
    data?.background?.party2FirstName,
  ];

  const lowMedHigh = ["Low", "Mid", "High"];

  return (
    <Col className="tableOuterPDF transparent">
      <Table className="w-100">
        <thead>
          <tr>
            <th> </th>
            {lowMedHigh.map((e) => (
              <th className="text-center" colSpan={2}>
                {e}
              </th>
            ))}
          </tr>
          <tr>
            <th> </th>
            {heading.map((e) => ColumnSimple(e, false))}
          </tr>
        </thead>

        <tbody>
          {tableData.map((e) => {
            return <TableColumnsCompare data={e} />;
          })}
        </tbody>
      </Table>
    </Col>
  );
};

const SpousalSupportDuration = ({ data }: { data: any }) => {
  const durationOfRelationship = () => {
    return momentFunction.differenceBetweenTwoDates(
      data?.aboutTheRelationship?.dateOfMarriage,
      data?.aboutTheRelationship?.dateOfSeparation
    );
  };

  const yearsUntilFullTimeSchool = (data: aboutYourChildrenState): number => {
    //difference between dateofBirth and 1 january of the current year.
    const agesArray = data?.childrenInfo.map(({ dateOfBirth }) =>
      momentFunction.differenceBetweenNowAndJanuaryOfYear(dateOfBirth)
    );

    //1 jan, the child should be six

    let minAge = 0;
    if (agesArray && agesArray.length > 0) {
      minAge = Math.min(...agesArray);
    }

    return minAge;
  };

  const ruleOf65 = (
    data: aboutTheRelationshipState,
    personAgeReceivingSupport: number
  ) => {
    const livingTogether = momentFunction.differenceBetweenTwoDates(
      data?.dateOfMarriage,
      data?.dateOfSeparation
    );

    return (
      livingTogether >= 20 || livingTogether + personAgeReceivingSupport >= 65
    );
  };

  return (
    <div className="textPDF">
      <div style={{ background: "#eee", margin: "4px 0 0 0" }}>
        <div>D. SPOUSAL SUPPORT DURATION</div>
        This report also provides a range of the intented duration of spousal
        support from the date of separation. The time period for which spousal
        support is payable is calculated based on the duration of relationship,
        age of parties and the age of the children (if any).
      </div>

      <div
        className="d-flex justify-content-between"
        style={{ margin: "10px 0 0 0" }}
      >
        <div className="heading-5">Duration of relationship </div>
        <div className="heading-5">{durationOfRelationship()} years </div>
      </div>
      <div className="d-flex justify-content-between">
        {/* //calculate age of person who gets spousal support  */}
        <div className="heading-5">Age of recipient at separation</div>
        <div className="heading-5">
          {" "}
          {momentFunction.differenceBetweenNowAndThen(
            data?.background?.party1DateOfBirth
          )}{" "}
          years
        </div>
      </div>

      <div className="d-flex justify-content-between ">
        <div className="heading-5">Years Until Full Time School </div>
        <div className="heading-5">
          {render0IfValueIsNegative(
            5 - yearsUntilFullTimeSchool(data?.aboutTheChildren)
          )}
        </div>
      </div>
      <div className="d-flex justify-content-between">
        <div className="heading-5">Years Until End of School </div>
        <div className="heading-5">
          {17 - yearsUntilFullTimeSchool(data?.aboutTheChildren)}
        </div>
      </div>
      <div className="d-flex justify-content-between">
        <div className="heading-5">Over 20 year Relationship? </div>
        <div className="heading-5">
          {" "}
          {durationOfRelationship() >= 20 ? "Yes" : "No"}{" "}
        </div>
      </div>
      <div className="d-flex justify-content-between">
        <div className="heading-5">Rule of 65 applies? </div>
        <div className="heading-5">
          {ruleOf65(data?.aboutTheRelationship, data?.personAgeReceivingSupport)
            ? "Yes"
            : "No"}
        </div>
      </div>
      <div className="d-flex justify-content-between">
        <div className="heading-5">Duration of Support </div>
        <div className="heading-5">
          {data?.durationOfSupport?.slice(0, 1) > 9999999
            ? "Indefinite"
            : data?.durationOfSupport?.slice(0, 1)}
          {data?.durationOfSupport?.slice(1, 2) > 9999999
            ? ""
            : " - " + data?.durationOfSupport?.slice(1, 2)}
        </div>
      </div>
    </div>
  );
};

export default Reports4;

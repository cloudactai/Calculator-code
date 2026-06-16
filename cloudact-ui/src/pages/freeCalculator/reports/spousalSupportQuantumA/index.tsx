import { momentFunction } from "../../../../utils/moment";
import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../../screen1/Screen1";
import { Col, Table } from "react-bootstrap";
import { ColumnSimple, TableColumnsCompare } from "../reports3";
import { showElementForReportType } from "..";
import { formatNumberInThousands } from "../../../../utils/helpers/Formatting";

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

const SpousalSupportQuantum = ({ data }: { data: any }) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;
  return (
    <>
      <div style={{ minHeight: "115vh", padding: "10rem" }}>
        <div className="calculator_reports w-100 p-5 m-auto ">
          <h4 className="heading-4 p-2 heading-blue heading-border-blue sub-heading">
            CALCULATION DETAILS - SPOUSAL SUPPORT
          </h4>
          <SpousalSupportHeading />
          <CalculationsTable data={data} />
          <SpousalSupportDuration data={data} />
        </div>
      </div>
      <div
        className="text-center py-3 d-flex justify-content-center align-items-end heading-6 page_break"
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
    </>
  );
};

const SpousalSupportHeading = () => {
  return (
    <>
      <div className="heading-5 heading-blue">A. SPOUSAL SUPPORT QUANTUM</div>
      <div className="heading-5 py-3" style={{ background: "#eee" }}>
        The Without Child support formula: The range here is 1.5-2%, times the
        income difference between the spouse's gross income, times the years of
        cohabitation to a maximum of 50% of that income difference.
      </div>
      <div className="heading-5 py-3">
        Calculation details (Annual) for each of the low, mid and high spousal
        support scenario are set out in the table below.
      </div>
    </>
  );
};

const CalculationsTable = ({ data }: { data: any }) => {
  const lowPropsCalTable = data.lowPropsCalTable;
  const medPropsCalTable = data.medPropsCalTable;
  const highPropsCalTable = data.highPropsCalTable;

  const yearsOfmarriage = momentFunction.differenceBetweenTwoDates(
    data?.aboutTheRelationship?.dateOfMarriage,
    data?.aboutTheRelationship?.dateOfSeparation
  );

  const grossIncomeDiff = () => {
    return data.totalIncomeParty1 - data.totalIncomeParty2;
  };

  const tableData = [
    {
      key: "Years of marriage/cohabitation",
      value: {
        party1Low: yearsOfmarriage.toFixed(0),
        party1Med: yearsOfmarriage.toFixed(0),
        party1High: yearsOfmarriage.toFixed(0),
        party2Low: "",
        party2Med: "",
        party2High: "",
        isNumber: true,
      },
    },
    {
      key: "Percent per year of marriage/cohabitation ",
      value: {
        party1Low: 1.5 + "%",
        party1Med: 1.75 + "%",
        party1High: 2.0 + "%",
        party2Low: "",
        party2Med: "",
        party2High: "",
        isNumber: true,
      },
    },
    {
      key: "Applicable percentage ",
      value: {
        party1Low:
          (lowPropsCalTable?.applicablePercentage * 100).toFixed(2) + "%",
        party1Med:
          (medPropsCalTable?.applicablePercentage * 100).toFixed(2) + "%",
        party1High:
          (highPropsCalTable?.applicablePercentage * 100).toFixed(2) + "%",
        party2Low: "",
        party2Med: "",
        party2High: "",
        isNumber: true,
      },
    },
    {
      key: "Gross Income Differential  ",
      value: {
        party1Low: grossIncomeDiff(),
        party1Med: grossIncomeDiff(),
        party1High: grossIncomeDiff(),
        party2Low: "",
        party2Med: "",
        party2High: "",
        isNumber: true,
      },
    },
    {
      key: "SSAG range as calculated ",
      value: {
        party1Low: grossIncomeDiff() * lowPropsCalTable?.applicablePercentage,
        party1Med: grossIncomeDiff() * medPropsCalTable?.applicablePercentage,
        party1High: grossIncomeDiff() * highPropsCalTable?.applicablePercentage,
        party2Low: "",
        party2Med: "",
        party2High: "",
        isNumber: true,
      },
    },
    {
      key: "50% Recipient NDI cap on range ",
      value: {
        party1Low: "",
        party1Med: "",
        party1High:
          highPropsCalTable?.applicablePercentage >= 0.5
            ? (highPropsCalTable?.spousalSupport?.party2 ||
                highPropsCalTable?.spousalSupport?.party1) * 12
            : "",
        party2Low: "",
        party2Med: "",
        party2High: "",
        isNumber: true,
      },
    },

    {
      key: "Spousal Support",
      value: {
        party1Low:
          (lowPropsCalTable?.spousalSupport?.party2 ||
            lowPropsCalTable?.spousalSupport?.party1) * 12,
        party1Med:
          (medPropsCalTable?.spousalSupport?.party2 ||
            medPropsCalTable?.spousalSupport?.party1) * 12,
        party1High:
          (highPropsCalTable?.spousalSupport?.party2 ||
            highPropsCalTable?.spousalSupport?.party1) * 12,
        party2Low: "",
        party2Med: "",
        party2High: "",
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

  const lowMedHigh = ["Low", "", "Mid", "", "High", ""];

  return (
    <Col>
      <Table className="w-100">
        <tbody>
          <tr>
            <th> </th>
            {lowMedHigh.map((e) => ColumnSimple(e, false))}
          </tr>

          {tableData.map((e) => {
            return <TableColumnsCompare data={e} />;
          })}
        </tbody>
      </Table>
    </Col>
  );
};

const LowMedHighTable = (val: {
  party1Low: number;
  party2Low: number;
  party1Med: number;
  party2Med: number;
  party1High: number;
  party2High: number;
}) => {
  return (
    <tr>
      <td>{val.party1Low}</td>
      <td>{val.party2Low}</td>
      <td>{val.party1Med}</td>
      <td>{val.party2Med}</td>
      <td>{val.party1High}</td>
      <td>{val.party2High}</td>
    </tr>
  );
};

const SpousalSupportDuration = ({ data }: { data: any }) => {
  const durationOfRelationship = () => {
    console.log("dates", {
      date: data?.aboutTheRelationship,
    });
    return momentFunction.differenceBetweenTwoDates(
      data?.aboutTheRelationship?.dateOfMarriage,
      data?.aboutTheRelationship?.dateOfSeparation
    );
  };

  const yearsUntilFullTimeSchool = (data: aboutYourChildrenState): number => {
    const agesArray = data?.childrenInfo.map(({ dateOfBirth }) =>
      momentFunction.differenceBetweenNowAndThen(dateOfBirth)
    );

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

  const keyValue = (key: string, value: string | number) => {
    return { key, value };
  };

  const ruleOf65Condition = () => {
    return ruleOf65(data?.aboutTheRelationship, data?.personAgeReceivingSupport)
      ? "Yes"
      : "No";
  };

  const singleColumnData = [
    keyValue("Duration of Relationship", durationOfRelationship() + " years"),

    keyValue(
      "Age of recipient at separation",
      momentFunction.differenceBetweenNowAndThen(
        data?.background?.party1DateOfBirth
      ) + " years"
    ),

    keyValue("Years Until Full Time School", "Not applicable"),

    keyValue("Years Until End of School", "Not applicable"),

    keyValue(
      "Over 20 year Relationship?",
      durationOfRelationship() > 20 ? "Yes" : "No"
    ),

    keyValue("Rule of 65 applies?", ruleOf65Condition()),

    keyValue(
      "Duration of Support ",
      data?.durationOfSupport?.slice(0, 1) > 9999999
        ? "Indefinite Duration"
        : data?.durationOfSupport?.slice(0, 1) +
            data?.durationOfSupport?.slice(1, 2) >
          9999999
        ? ""
        : " - " + data?.durationOfSupport?.slice(1, 2)
    ),
  ];

  const SingleColumn = (key: string, value: number | string) => {
    return (
      <div className="d-flex justify-content-between">
        <div className="heading-5">{key}</div>
        <div className="heading-5">{value}</div>
      </div>
    );
  };

  return (
    <>
      <div className="heading-5 p-3 my-4" style={{ background: "#eee" }}>
        <div className="heading-blue">B. SPOUSAL SUPPORT DURATION</div>
        This report also provides a range of the intented duration of spousal
        support from the date of separation. The time period for which spousal
        support is payable is calculated based on the duration of relationship,
        age of parties and the age of the children (if any).
      </div>

      {singleColumnData.map((e) => SingleColumn(e.key, e.value))}
    </>
  );
};

export default SpousalSupportQuantum;

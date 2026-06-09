import { ReactJSXElement } from "@emotion/react/types/jsx-namespace";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { ReactElement } from "react";
import { Pie } from "react-chartjs-2";
import {
  conditionForOnlyChild,
  conditionForWithoutChild,
  showElementForReportType,
} from "..";
import { formatNumberInThousands } from "../../../../utils/helpers/Formatting";
import { SPOUSAL_SUPPORT_CAL, WITHOUT_CHILD_FORMULA } from "../../Calculator";
import { totalNumberOfChildren } from "../../screen2/Screen2";
import {
  determineTypeOfSplitting,
  getNumberOfChildrenWithParty1,
  getNumberOfChildrenWithParty2,
} from "../../screen4/Screen4";
ChartJS.register(ArcElement, Tooltip, Legend);

const index = ({ data }: { data: any }) => {
  const supportGivenTo = data?.childSupport?.givenTo;
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;
  const partyGivenBy =
    data.specialExpensesArr.party1.filter(
      (data: any) => data.value === "21400"
    )[0]?.value >
    data.specialExpensesArr.party2.filter(
      (data: any) => data.value === "21400"
    )[0]?.value
      ? 2
      : 1;

  const findOtherSupport = (supportGiven: string, data: any) => {
    if (supportGiven === data?.background?.party1FirstName) {
      return data?.background?.party2FirstName;
    } else {
      return data?.background?.party1FirstName;
    }
  };

  const childSupport1 = childSupportGreater() / 12;

  const spousalSupport1 =
    data?.spousalSupport?.spousalSupport1Low >
    data?.spousalSupport?.spousalSupport2Low
      ? data?.spousalSupport?.spousalSupport1Low
      : data?.spousalSupport?.spousalSupport2Low;

  const support1 =
    partyGivenBy === 1
      ? data?.specialExpenses?.specialExpensesLow1
      : data?.specialExpenses?.specialExpensesLow2;

  const spousalSupport2 =
    data?.spousalSupport?.spousalSupport1Med >
    data?.spousalSupport?.spousalSupport2Med
      ? data?.spousalSupport?.spousalSupport1Med
      : data?.spousalSupport?.spousalSupport2Med;

  const support2 =
    partyGivenBy === 1
      ? data?.specialExpenses?.specialExpensesMed1
      : data?.specialExpenses?.specialExpensesMed2;

  const spousalSupport3 =
    data?.spousalSupport?.spousalSupport1High >
    data?.spousalSupport?.spousalSupport2High
      ? data?.spousalSupport?.spousalSupport1High
      : data?.spousalSupport?.spousalSupport2High;

  const support3 =
    partyGivenBy === 1
      ? data?.specialExpenses?.specialExpensesHigh1
      : data?.specialExpenses?.specialExpensesHigh2;

  function getNumberOfChildWithParties() {
    return data.aboutTheChildren.count;
  }

  function childSupportGreater() {
    //if the custody is of splitting, then we need to net it off.
    //11802(party1) - 7008(party2)
    //this diff will go to party 2.

    //if party1 has child then child support will go to party 1 otherwise vice-versa.
    const childSupportParty1 = data.childSupport.childSupport1; //1351
    const childSupportParty2 = data.childSupport.childSupport2; //0

    const typeOfSplitting = determineTypeOfSplitting(
      getNumberOfChildWithParties(),
      totalNumberOfChildren(data.aboutTheChildren)
    );

    // if (typeOfSplitting === "SPLIT" || typeOfSplitting === "SHARED") {
    //   if (childSupportParty1 > childSupportParty2) {
    //     return childSupportParty1 - childSupportParty2;
    //   } else {
    //     return childSupportParty2 - childSupportParty1;
    //   }
    // }

    //which party has child will get the amount calculated by other party.
    //refer majority party excel file.
     if (
      getNumberOfChildrenWithParty1(getNumberOfChildWithParties()) >
      getNumberOfChildrenWithParty2(getNumberOfChildWithParties())
    ) {
      console.log("party 1 has more children");
      return childSupportParty2;
    } else if (
      getNumberOfChildrenWithParty2(getNumberOfChildWithParties()) >
      getNumberOfChildrenWithParty1(getNumberOfChildWithParties())
    ) {
      return childSupportParty1;
    } else {
      return Math.max(childSupportParty1, childSupportParty2);
    }
  }

  const columns = [
    showElementForReportType(
      calculatorType,
      reportType,
      2,
      "ChildSupportHeading"
    )
      ? {
          key: "Child Support",
          value: `${findOtherSupport(
            supportGivenTo,
            data
          )} pays ${supportGivenTo} a basic Table amount of child support of ${formatNumberInThousands(
            childSupport1
          )} per month (Per CSG-Table Amount).  Depending on the amount of spousal support payable, ${findOtherSupport(
            supportGivenTo,
            data
          )} pays between ${formatNumberInThousands(
            support1 / 12
          )} to ${formatNumberInThousands(
            support3 / 12
          )} per month towards the special expenses`,
        }
      : null,

    showElementForReportType(
      calculatorType,
      reportType,
      2,
      "SpousalSupportHeading"
    )
      ? {
          key: "Spousal Support",
          value: `If entitlement is established, ${findOtherSupport(
            supportGivenTo,
            data
          )} pays ${supportGivenTo} spousal support between ${formatNumberInThousands(
            spousalSupport1
          )} to ${formatNumberInThousands(
            spousalSupport3
          )} per month (midpoint of ${formatNumberInThousands(
            spousalSupport2
          )}) for an undetermined period from the date of separation (Per SSAG- ${
            reportType === WITHOUT_CHILD_FORMULA &&
            calculatorType === SPOUSAL_SUPPORT_CAL
              ? "without "
              : "with "
          } Child support Formula)`,
        }
      : null,
  ];

  const ScenerioDetails = data.childSupport
    ? [
        {
          ScenerioNo: "1-Low",
          childSupport: childSupport1,
          spousalSupport: spousalSupport1,
          support: support1,
          party1: data?.background?.party1FirstName,
          party2: data?.background?.party2FirstName,
          givenTo: supportGivenTo,
        },
        {
          ScenerioNo: "2-Mid",
          childSupport: childSupport1,
          spousalSupport: spousalSupport2,
          support: support2,
          party1: data?.background?.party1FirstName,
          party2: data?.background?.party2FirstName,
          givenTo: supportGivenTo,
        },
        {
          ScenerioNo: "3-High",
          childSupport: childSupport1,
          spousalSupport: spousalSupport3,
          support: support3,
          party1: data?.background?.party1FirstName,
          party2: data?.background?.party2FirstName,
          givenTo: supportGivenTo,
        },
      ]
    : [];

  return (
    <>
      <div className="pagePDF">
        <span className="headingPDF">RESULT SUMMARY</span>
        {data && (
          <>
            <RenderAllColumns columns={columns} />
            <RenderAllScenerioDetails
              columns={ScenerioDetails}
              reportType={reportType}
              calculatorType={calculatorType}
            />
          </>
        )}
        <div className="paginationPDF">
          Page{" "}
          {showElementForReportType(
            calculatorType,
            reportType,
            2,
            "currentPage"
          )}{" "}
          of{" "}
          {showElementForReportType(
            calculatorType,
            reportType,
            "otherDetails",
            "totalPages"
          )}
        </div>
      </div>
    </>
  );
};

const RenderAllColumns = ({
  columns,
}: {
  columns: Array<{ key: string; value: string }>;
}): ReactElement => {
  return (
    <div>
      {columns.map((column: { key: string; value: string }) => {
        if (column !== null) {
          return <ColumnsWithoutBorders data={column} />;
        }
      })}
    </div>
  );
};

const RenderAllScenerioDetails = ({
  columns,
  reportType,
  calculatorType,
}: {
  columns: Array<any>;
  reportType: string;
  calculatorType: string;
}): ReactElement => {
  return (
    <>
      {columns.map((column: any) => {
        return (
          <Scenerios
            data={column}
            reportType={reportType}
            calculatorType={calculatorType}
          />
        );
      })}
      {/* <div className="d-flex align-items-center mt-5">
        {columns.map((column) => {
          return (
            <div className="pieChartPDF">
              <PieChart
                values={column}
                reportType={reportType}
                calculatorType={calculatorType}
              />
            </div>
          );
        })}
      </div> */}
    </>
  );
};

const ColumnsWithoutBorders = ({
  data,
}: {
  data: { key: string; value: string };
}): JSX.Element => {
  return (
    <>
      <div className="textLabelPDF">
        <span
          className="textPDF"
          style={{ minWidth: "55px", fontWeight: "bolder", padding: "0" }}
        >
          {data.key}
        </span>
        <span className="textPDF">{data.value}</span>
      </div>
    </>
  );
};

const isFirstPartyPayingSecond = (data: any) => {
  return data.givenTo !== data?.party2;
};

const Scenerios = ({
  data,
  reportType,
  calculatorType,
}: any): ReactJSXElement => {
  return (
    <>
      <span
        className="textPDF"
        style={{ margin: "40px 0 0 0", textAlign: "center" }}
      >
        <strong>Scenerio {data.ScenerioNo}</strong>
      </span>
      <div className="summaryPDF">
        <span className="textPDF">
          <img src="/images/userBlue.png"></img>
          <strong>{data?.party1}</strong>
        </span>
        <div className="arrowPDF">
          {showElementForReportType(
            calculatorType,
            reportType,
            2,
            "ChildSupport"
          ) ? (
            <Diagram data={data}>
              Child Support {formatNumberInThousands(data.childSupport)}
            </Diagram>
          ) : null}
          {showElementForReportType(
            calculatorType,
            reportType,
            2,
            "SpousalSupport"
          ) ? (
            <Diagram data={data}>
              Spousal Support {formatNumberInThousands(data.spousalSupport)}
            </Diagram>
          ) : null}
          {showElementForReportType(
            calculatorType,
            reportType,
            2,
            "ChildSupportSpecialExpenses"
          ) ? (
            <Diagram data={data}>
              Special Expenses Support{" "}
              {formatNumberInThousands(data.support / 12)}
            </Diagram>
          ) : null}
        </div>
        <span className="textPDF">
          <img src="/images/userYellow.png"></img>
          <strong>{data?.party2}</strong>
        </span>
      </div>
      {/* <div className="pieChartPDF">
        <PieChart
          values={data}
          reportType={reportType}
          calculatorType={calculatorType}
        />
      </div> */}
    </>
  );
};

const PieChart = ({ values, reportType, calculatorType }: any) => {
  const data = {
    labelsForWITHOUT_CHILD: ["Spousal Support"],
    labelsForONLY_CHILD: ["Child Support", "Support"],
    labelsForCUSTODIAL_FORMULA: ["Child Support", "Spousal Support", "Support"],

    labels: conditionForWithoutChild(reportType, calculatorType)
      ? ["Spousal Support"]
      : conditionForOnlyChild(reportType, calculatorType)
      ? ["Child Support", "Support"]
      : ["Child Support", "Spousal Support", "Support"],

    datasets: [
      {
        label: "Percentage of Supports",

        dataForWITHOUT_CHILD: [values?.childSupport],
        dataForONLY_CHILD: [values?.spousalSupport],
        dataForCUSTODIAL_FORMULA: [values?.support],

        data: conditionForWithoutChild(reportType, calculatorType)
          ? [values?.spousalSupport]
          : conditionForOnlyChild(reportType, calculatorType)
          ? [values?.childSupport, values?.support]
          : [values?.spousalSupport, values?.childSupport, values?.support],

        backgroundColor: conditionForWithoutChild(reportType, calculatorType)
          ? ["rgba(255, 99, 132, 1)"]
          : conditionForOnlyChild(reportType, calculatorType)
          ? ["rgba(255, 206, 86, 1)", "rgba(54, 162, 235, 1)"]
          : [
              "rgba(255, 99, 132, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
            ],

        borderColor: conditionForWithoutChild(reportType, calculatorType)
          ? ["rgba(255, 99, 132, 1)"]
          : conditionForOnlyChild(reportType, calculatorType)
          ? ["rgba(255, 206, 86, 1)", "rgba(54, 162, 235, 1)"]
          : [
              "rgba(255, 99, 132, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
            ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Pie
      width="185px"
      data={data}
      aria-label="Hello World"
      options={{
        animation: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              boxWidth: 4,
              font: {
                size: 8,
              },
            },
          },

          subtitle: {
            display: true,
            text: "Custom Chart Subtitle",
          },
          // title: {
          //   display: true,
          //   text: "",
          // },
        },
      }}
    />
  );
};

const BlackArrow = ({ reverse }: { reverse: boolean }) => {
  return (
    <img
      src="/images/blueArrowNew.png"
      style={{ transform: reverse ? "rotate(180deg)" : "" }}
      alt={`Which party pays other party`}
    />
  );
};

const Diagram = ({ children, data }: { children: any; data: any }) => {
  return (
    <div className="arrow">
      <span className="textPDF">{children}</span>
      <BlackArrow reverse={isFirstPartyPayingSecond(data)} />
    </div>
  );
};

export default index;

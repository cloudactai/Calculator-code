import React from "react";
import { Data } from ".";
import { showElementForReportType } from "..";
import { render0IfValueIsNegative } from "../../../../utils/helpers";
import {
  formatNumber,
  formatNumberInThousands,
} from "../../../../utils/helpers/Formatting";
import { getProvinceForm } from "../../../../utils/helpers/province";
import { momentFunction } from "../../../../utils/moment";
import {
  aboutYourChildrenState,
  findNumberOfYearsOfFinishing,
  findNumberOfYearsOfStarting,
} from "../../screen1/Screen1";
import { mapAmountFieldAndTotal } from "../../screen2/Screen2";

// type Props = {
//   data: {
//     background: backgroundState;
//     aboutTheChildren: aboutYourChildrenState;
//     aboutTheRelationship: aboutTheRelationshipState;
//   };
// };

const Reports1 = ({ data }: any) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;

  console.log("disabilityCreditsreport",data)

  return (
    <div className="pagePDF">
      <span className="headingPDF">CALCULATION INPUT</span>
      <span className="textPDF" style={{ margin: "10px 0 0 0" }}>
        The tables below set out the information on which this report is based,
        and with which support is calculated in this report. Changing these
        inputs will change the support calculation. All inputs should be
        verified for accuracy.
      </span>
      {data.background && (
        <div>
          <DetailsAboutParties
            data={{
              ...data?.background,
              income: data?.income,
              totalDeductions: data?.deductions?.party1,
              guidelineIncome: data?.guidelineIncome?.party1,
              specialExpensesArr: data?.specialExpensesArr,
            }}
            partyNum={1}
          />
          <DetailsAboutParties
            data={{
              ...data?.background,
              income: data?.income,
              totalDeductions: data?.deductions?.party2,
              guidelineIncome: data?.guidelineIncome?.party2,
              specialExpensesArr: data?.specialExpensesArr,
            }}
            partyNum={2}
          />

          {showElementForReportType(
            calculatorType,
            reportType,
            1,
            "childrenInfo"
          ) ? (
            <ChildrenDetails
              screenData={data}
              aboutTheChildren={data.aboutTheChildren}
            />
          ) : null}
          <ImportantDates
            aboutTheRelationship={{
              ...data?.aboutTheRelationship,
              tax_year: data?.tax_year,
              aboutTheChildren: data?.aboutTheChildren,
              reportType: reportType,
              calculatorType: calculatorType,
              startsSchool: render0IfValueIsNegative(
                5 - yearsUntilFullTimeSchool(data?.aboutTheChildren)
              ),
              finishesSchool:
                17 - yearsUntilFullTimeSchool(data?.aboutTheChildren),
            }}
          />
        </div>
      )}
      <div className="paginationPDF">
        Page{" "}
        {showElementForReportType(calculatorType, reportType, 1, "currentPage")}{" "}
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

const DetailsAboutParties = ({
  data,
  partyNum,
}: {
  data: any;
  partyNum: number;
}) => {

  const childCareExpensesParty1 = data.specialExpensesArr.party1.filter(
    (data: any) => data.value === "21400"
  )[0]?.amount;
  const childCareExpensesParty2 = data.specialExpensesArr.party2.filter(
    (data: any) => data.value === "21400"
  )[0]?.amount;
  const partyGivenBy =
    (data?.specialExpensesArr.party1.filter(
      (data: any) => data.value === "21400"
    )[0]?.amount || 0) >
    (data?.specialExpensesArr.party2.filter(
      (data: any) => data.value === "21400"
    )[0]?.amount || 0)
      ? 2
      : 1;

  return (
    <React.Fragment>
      {partyNum === 1 ? (
        <>
          <span className="textPDF" style={{ margin: "30px 10px 10px 10px" }}>
            <strong>
              {data?.party1FirstName} {data?.party1LastName},{" "}
              {momentFunction.formatDate(data?.party1DateOfBirth)}, Resident of{" "}
              {getProvinceForm(data?.party1province)}
            </strong>
          </span>
          <div className="tableOuterPDF">
            <table>
              <tbody>
                <tr>
                  <td>
                    <strong>
                      {data?.income?.party1[0]?.label.split("-")[1]}
                    </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumberInThousands(
                      mapAmountFieldAndTotal(data?.income?.party1)
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>
                      Guideline Income adjustment: Deduct Employment expenses
                    </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(data?.guidelineIncome)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Guideline Income</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumberInThousands(
                      mapAmountFieldAndTotal(data?.income?.party1) +
                        data?.guidelineIncome
                    )}
                  </td>
                </tr>

                {
                  data.party1eligibleForDisability == "Yes" &&
                  <tr>
                  <td>
                    <strong>Eligible for disabiity benefit </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                   Yes
                  </td>
                </tr>
                }

                


                {partyGivenBy !== partyNum && (
                  <tr>
                    <td>
                      <strong>Special expenses (Child care expenses)</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatNumber(childCareExpensesParty1)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <span className="textPDF" style={{ margin: "30px 10px 10px 10px" }}>
            <strong>
              {data?.party2FirstName} {data?.party2LastName},{" "}
              {momentFunction.formatDate(data?.party2DateOfBirth)}, Resident of{" "}
              {getProvinceForm(data?.party2province)}
            </strong>
          </span>
          <div className="tableOuterPDF">
            <table>
              <tbody>
                <tr>
                  <td>
                    <strong>
                      {data?.income?.party2[0]?.label.split("-")[1]}
                    </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumberInThousands(
                      mapAmountFieldAndTotal(data?.income?.party2)
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>
                      Guideline Income adjustment: Deduct Employment expenses
                    </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(data?.guidelineIncome)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Guideline Income</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(
                      mapAmountFieldAndTotal(data?.income?.party2) +
                        data?.guidelineIncome
                    )}
                  </td>
                </tr>

                {
                  data.party2eligibleForDisability == "Yes" &&
                  <tr>
                  <td>
                    <strong>Eligible for disabiity benefit </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                  Yes
                  </td>
                </tr>
                }






                {partyGivenBy != partyNum && (
                  <tr>
                    <td>
                      <strong>Special expenses (Child care expenses)</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatNumber(childCareExpensesParty2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </React.Fragment>
  );
};

const ChildrenDetails = ({
  aboutTheChildren,
  screenData,
}: {
  aboutTheChildren: aboutYourChildrenState;
  screenData: any;
}) => {
  const data = aboutTheChildren.childrenInfo;

  // const csgTableApplicable = (dateOfBirth: string) => {
  //   const diff = momentFunction.differenceBetweenNowAndThen(dateOfBirth)
  //   return diff > 17;
  // }

  return (
    <div className="tableOuterPDF" style={{ margin: "40px 0 0 0" }}>
      <table>
        <thead>
          <tr>
            <th>Children</th>
            <th>Date Of Birth</th>
            <th>Lives With</th>
            <th>CSG Table Applicable</th>
            <th>Other</th>
          </tr>
        </thead>
        {data.map((e) => {
          
          return (
            <tbody>
              <tr>
                <td>{e.name}</td>
                <td>{momentFunction.formatDate(e.dateOfBirth)}</td>
                <td>{e.custodyArrangement}</td>
                <td>{e.CSGTable}</td>
                {/* <td>None</td> */}
                <td>{e.childHasDisability == "Yes" ? "Eligible to Disability benefit" : "None"}</td>
                
              </tr>
            </tbody>
          );
        })}
      </table>
    </div>
  );
};

const startsFullTimeSchool = (aboutTheChildren: aboutYourChildrenState) => {
  // const youngestChild = formulaFindYoungestChild(aboutTheChildren);

  const youngestChild: number = Math.max(
    ...aboutTheChildren.childrenInfo.map((e) => e.dateOfBirth)
  );

  const startingYears = findNumberOfYearsOfStarting(youngestChild);
  const finishingYears = findNumberOfYearsOfFinishing(youngestChild);

  return [startingYears, finishingYears];
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

const ImportantDates = ({
  aboutTheRelationship,
}: {
  aboutTheRelationship: any;
}) => {
  const columns = [
    showElementForReportType(
      aboutTheRelationship.calculatorType,
      aboutTheRelationship.reportType,
      1,
      "aboutTheRelationshipValues"
    )
      ? {
          key: "Date of Marriage / Cohabitation",
          value: momentFunction.formatDate(aboutTheRelationship.dateOfMarriage),
        }
      : null,

    showElementForReportType(
      aboutTheRelationship.calculatorType,
      aboutTheRelationship.reportType,
      1,
      "aboutTheRelationshipValues"
    )
      ? {
          key: "Date of Separation",
          value: momentFunction.formatDate(
            aboutTheRelationship.dateOfSeparation
          ),
        }
      : null,

    showElementForReportType(
      aboutTheRelationship.calculatorType,
      aboutTheRelationship.reportType,
      1,
      "otherValues"
    )
      ? {
          key: "Estimated No of years until youngest child starts full time school",
          value: aboutTheRelationship.startsSchool,
        }
      : null,

    showElementForReportType(
      aboutTheRelationship.calculatorType,
      aboutTheRelationship.reportType,
      1,
      "otherValues"
    )
      ? {
          key: "Estimated No of years until youngest child finishes high school",
          value: aboutTheRelationship.finishesSchool,
        }
      : null,

    showElementForReportType(
      aboutTheRelationship.calculatorType,
      aboutTheRelationship.reportType,
      1,
      "taxYear"
    )
      ? {
          key: "Tax Year",
          value: aboutTheRelationship.tax_year,
        }
      : null,
  ];

  return (
    <div className="mt-4">
      {columns.map((column) => {
        if (column !== null) return <ColumnsWithBorders data={column} />;
      })}
    </div>
  );
};

const ColumnsWithBorders = ({
  data,
}: {
  data: { key: string; value: string };
}) => {
  return (
    <div className="tableOuterPDF" style={{ margin: "0px 0 0 0" }}>
      <table>
        <tr>
          <td>
            <strong>{data.key}</strong>
          </td>
          <td style={{ textAlign: "right" }}>{data.value}</td>
        </tr>
      </table>
    </div>
  );
};

export default Reports1;

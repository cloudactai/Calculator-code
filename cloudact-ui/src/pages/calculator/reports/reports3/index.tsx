import { Table, Col, Row } from "react-bootstrap";
import {
  INDIPriorToSupport,
  removeNegSignAndWrapInBrackets,
  showElementForReportType,
} from "..";
import {
  formatNumberInThousands,
  formatNumber,
} from "../../../../utils/helpers/Formatting";

export const ColumnSimple = (
  val: number | string,
  text_end: boolean = false
) => {
  return <th>{val}</th>;
};

const Reports3 = ({ data }: { data: any }) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;
  const specialExpenses = data?.taxesWithSpecialExpenses?.party1Low;

  return (
    <div className="pagePDF">
      <ChildSupportHeadings />
      <ChildSupportTable data={data} />
      {specialExpenses > 0 && (
        <>
          <SpecialExpensesHeadings />
          <CalculationsTable data={data} />
        </>
      )}
      <div className="paginationPDF">
        Page{" "}
        {showElementForReportType(calculatorType, reportType, 3, "currentPage")}{" "}
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

const ChildSupportHeadings = () => {
  return (
    <>
      <span className="headingPDF">CALCULATION DETAILS - CHILD SUPPORT</span>
      <span className="textPDF" style={{ margin: "10px 0 0 0" }}>
        <strong>A. CHILD SUPPORT (section 3)</strong>
      </span>
      <span className="textPDF" style={{ margin: "4px 0 0 0" }}>
        Section 3 Child support is a monthly amount calculated based on the
        payor's pre-tax income as set out in the Federal Child Support
        Guidelines. It is paid to assist with the cost of raising children.{" "}
        <br></br>
        <br></br>Section 3 Child support calculation details are shown in the
        table below.
      </span>
    </>
  );
};

const SpecialExpensesHeadings = () => {
  return (
    <>
      <span className="textPDF" style={{ margin: "40px 0 0 0" }}>
        <strong>B. SPECIAL EXPENSES (section 7)</strong>
      </span>
      <span className="textPDF" style={{ margin: "4px 0 0 0" }}>
        Section 7 Child support is paid to assist with certain ''special''
        expenses such as child care, education and other agreed-upon
        extraordinary expenses. Under section 7(2) of the Federal Child Support
        Guidelines, these expenses are shared by both parents in proportion to
        their incomes. The cost that is shared is the net cost of the expenses,
        after accounting for any tax credits or benefits received in relation to
        the expense. <br></br>
        <br></br>Calculation details (Annual) for section 7 child support are
        shown in the table below.
      </span>
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

  const specialExpensesValues = {
    party1Low: childCareExpensesParty1 || 0,
    party1Med: childCareExpensesParty1 || 0,
    party1High: childCareExpensesParty1 || 0,
    party2Low: childCareExpensesParty2 || 0,
    party2Med: childCareExpensesParty2 || 0,
    party2High: childCareExpensesParty2 || 0,
    isNumber: true,
  };

  const changeInBenefits = {
    party1Low:
      data?.benefitsValuesWithoutSpecialExpenses?.party1Low -
      data?.benefitsValues?.party1Low,
    party1Med:
      data?.benefitsValuesWithoutSpecialExpenses?.party1Med -
      data?.benefitsValues?.party1Med,
    party1High:
      data?.benefitsValuesWithoutSpecialExpenses?.party1High -
      data?.benefitsValues?.party1High,
    party2Low:
      data?.benefitsValuesWithoutSpecialExpenses?.party2Low -
      data?.benefitsValues?.party2Low,
    party2Med:
      data?.benefitsValuesWithoutSpecialExpenses?.party2Med -
      data?.benefitsValues?.party2Med,
    party2High:
      data?.benefitsValuesWithoutSpecialExpenses?.party2High -
      data?.benefitsValues?.party2High,
    isNumber: true,
  };

  const whoGetsSpousalSupport = (): 1 | 2 => {
    return data?.spousalSupport?.spousalSupport1Low >
      data?.spousalSupport?.spousalSupport2Low
      ? 1
      : 2;
  };

  const spousalSupportValues = {
    party1Low:
      whoGetsSpousalSupport() === 1
        ? data?.spousalSupport?.spousalSupport1Low * 12
        : -Math.abs(data?.spousalSupport?.spousalSupport2Low * 12),
    party1Med:
      whoGetsSpousalSupport() === 1
        ? data?.spousalSupport?.spousalSupport1Med * 12
        : -Math.abs(data?.spousalSupport?.spousalSupport2Med * 12),
    party1High:
      whoGetsSpousalSupport() === 1
        ? data?.spousalSupport?.spousalSupport1High * 12
        : -Math.abs(data?.spousalSupport?.spousalSupport2High * 12),
    party2Low:
      whoGetsSpousalSupport() === 1
        ? -Math.abs(data?.spousalSupport?.spousalSupport1Low * 12)
        : data?.spousalSupport?.spousalSupport2Low * 12,
    party2Med:
      whoGetsSpousalSupport() === 1
        ? -Math.abs(data?.spousalSupport?.spousalSupport1Med * 12)
        : data?.spousalSupport?.spousalSupport2Med * 12,
    party2High:
      whoGetsSpousalSupport() === 1
        ? -Math.abs(data?.spousalSupport?.spousalSupport1High * 12)
        : data?.spousalSupport?.spousalSupport2High * 12,
    isNumber: true,
  };

  const adjustedIncomeValues = {
    party1Low: data?.totalIncomeParty1 + spousalSupportValues.party1Low,
    party1Med: data?.totalIncomeParty1 + spousalSupportValues.party1Med,
    party1High: data?.totalIncomeParty1 + spousalSupportValues.party1High,
    party2Low: data?.totalIncomeParty2 + spousalSupportValues.party2Low,
    party2Med: data?.totalIncomeParty2 + spousalSupportValues.party2Med,
    party2High: data?.totalIncomeParty2 + spousalSupportValues.party2High,
    isNumber: true,
  };

  const changeInTaxes = {
    party1Low: specialExpensesValues.party1Low
      ? data?.taxesWithoutSpecialExpenses?.party1Low -
        data?.taxesWithSpecialExpenses?.party1Low
      : 0,
    party1Med: specialExpensesValues.party1Med
      ? data?.taxesWithoutSpecialExpenses?.party1Med -
        data?.taxesWithSpecialExpenses?.party1Med
      : 0,
    party1High: specialExpensesValues.party1High
      ? data?.taxesWithoutSpecialExpenses?.party1High -
        data?.taxesWithSpecialExpenses?.party1High
      : 0,
    party2Low: specialExpensesValues.party2Low
      ? data?.taxesWithoutSpecialExpenses?.party2Low -
        data?.taxesWithSpecialExpenses?.party2Low
      : 0,
    party2Med: specialExpensesValues.party2Med
      ? data?.taxesWithoutSpecialExpenses?.party2Med -
        data?.taxesWithSpecialExpenses?.party2Med
      : 0,
    party2High: specialExpensesValues.party2High
      ? data?.taxesWithoutSpecialExpenses?.party2High -
        data?.taxesWithSpecialExpenses?.party2High
      : 0,
  };

  const changeInTaxesAndBenefit = {
    party1Low: data?.changeInTaxesAndBenefit?.changeInTaxesAndBenefitLow1,
    party1Med: data?.changeInTaxesAndBenefit?.changeInTaxesAndBenefitMed1,
    party1High: data?.changeInTaxesAndBenefit?.changeInTaxesAndBenefitHigh1,
    party2Low: data?.changeInTaxesAndBenefit?.changeInTaxesAndBenefitLow2,
    party2Med: data?.changeInTaxesAndBenefit?.changeInTaxesAndBenefitMed2,
    party2High: data?.changeInTaxesAndBenefit?.changeInTaxesAndBenefitHigh2,
  };

  const netExpensesPaid = {
    party1Low: Number(
      (
        specialExpensesValues.party1Low -
        (data?.benefitsValuesWithoutSpecialExpenses?.party1Low -
          data?.benefitsValues?.party1Low) +
        changeInTaxes.party1Low
      ).toFixed(2)
    ),

    party1Med: Number(
      (
        specialExpensesValues.party1Med -
        (data?.benefitsValuesWithoutSpecialExpenses?.party1Med -
          data?.benefitsValues?.party1Med) +
        changeInTaxes.party1Med
      ).toFixed(2)
    ),

    party1High: Number(
      (
        specialExpensesValues.party1High -
        (data?.benefitsValuesWithoutSpecialExpenses?.party1High -
          data?.benefitsValues?.party1High) +
        changeInTaxes.party1High
      ).toFixed(2)
    ),

    party2Low: Number(
      (
        specialExpensesValues.party2Low -
        (data?.benefitsValuesWithoutSpecialExpenses?.party2Low -
          data?.benefitsValues?.party2Low) +
        changeInTaxes.party2Low
      ).toFixed(2)
    ),

    party2Med: Number(
      (
        specialExpensesValues.party2Med -
        (data?.benefitsValuesWithoutSpecialExpenses?.party2Med -
          data?.benefitsValues?.party2Med) +
        changeInTaxes.party2Med
      ).toFixed(2)
    ),

    party2High: Number(
      (
        specialExpensesValues.party2High -
        (data?.benefitsValuesWithoutSpecialExpenses?.party2High -
          data?.benefitsValues?.party2High) +
        changeInTaxes.party2High
      ).toFixed(2)
    ),

    isNumber: true,
  };

  const tableData = [
    {
      key: "Total Expenses Paid",
      value: specialExpensesValues,
    },
    // {
    //   key: "Change in Benefits",
    //   value: changeInBenefits,
    // },
    {
      key: "Change in taxes & Benefits",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          changeInTaxesAndBenefit.party1Low
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          changeInTaxesAndBenefit.party1Med
        ),
        party1High: removeNegSignAndWrapInBrackets(
          changeInTaxesAndBenefit.party1High
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          changeInTaxesAndBenefit.party2Low
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          changeInTaxesAndBenefit.party2Med
        ),
        party2High: removeNegSignAndWrapInBrackets(
          changeInTaxesAndBenefit.party2High
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Net Expenses paid",
      value: netExpensesPaid,
    },
    {
      key: "Guideline Income",
      value: {
        party1Low: data?.totalIncomeParty1,
        party1Med: data?.totalIncomeParty1,
        party1High: data?.totalIncomeParty1,
        party2Low: data?.totalIncomeParty2,
        party2Med: data?.totalIncomeParty2,
        party2High: data?.totalIncomeParty2,
        isNumber: true,
      },
    },
    {
      key: "Spousal support",
      value: {
        party1Low: removeNegSignAndWrapInBrackets(
          spousalSupportValues?.party1Low
        ),
        party1Med: removeNegSignAndWrapInBrackets(
          spousalSupportValues?.party1Med
        ),
        party1High: removeNegSignAndWrapInBrackets(
          spousalSupportValues?.party1High
        ),
        party2Low: removeNegSignAndWrapInBrackets(
          spousalSupportValues?.party2Low
        ),
        party2Med: removeNegSignAndWrapInBrackets(
          spousalSupportValues?.party2Med
        ),
        party2High: removeNegSignAndWrapInBrackets(
          spousalSupportValues?.party2High
        ),
        isNumber: false,
        isString: true,
      },
    },
    {
      key: "Adjusted Income",
      value: adjustedIncomeValues,
    },
    {
      key: "Share of expenses",
      value: {
        party1Low: INDIPriorToSupport(
          adjustedIncomeValues.party1Low,
          adjustedIncomeValues.party2Low,
          1
        ),
        party1Med: INDIPriorToSupport(
          adjustedIncomeValues.party1Med,
          adjustedIncomeValues.party2Med,
          1
        ),
        party1High: INDIPriorToSupport(
          adjustedIncomeValues.party1High,
          adjustedIncomeValues.party2High,
          1
        ),
        party2Low: INDIPriorToSupport(
          adjustedIncomeValues.party1Low,
          adjustedIncomeValues.party2Low,
          2
        ),
        party2Med: INDIPriorToSupport(
          adjustedIncomeValues.party1Med,
          adjustedIncomeValues.party2Med,
          2
        ),
        party2High: INDIPriorToSupport(
          adjustedIncomeValues.party1High,
          adjustedIncomeValues.party2High,
          2
        ),
        isNumber: false,
      },
    },
    {
      key: "Expense Support",
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
    <div className="tableOuterPDF transparent">
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
              if (data.calculator_type === "CHILD_SUPPORT_CAL") {
                return h.key !== "Spousal support";
              } else {
                return h;
              }
            })
            .map((e) => {
              return <TableColumnsCompare data={e} />;
            })}
        </tbody>
      </table>
    </div>
  );
};

const Column = (
  isNumber: boolean,
  isNeg: boolean,
  isStr: boolean,
  val: number
) => {
  return isNumber || isNeg ? formatNumber(val) : isStr ? val : val + "%";
};

const renderTd = (
  isNumber: boolean,
  isNeg: boolean,
  isStr: boolean,
  val: number,
  fw_bold: boolean = false,
  text_end: boolean = false
) => {
  return <td>{Column(isNumber, isNeg, isStr, val)}</td>;
};

export const TableColumnsCompare = ({ data }: { data: any }) => {
  const renderTH = (val: string) => {
    return (
      <td>
        <strong>{val}</strong>
      </td>
    );
  };

  const dataRender = [
    data.value.party1Low,
    data.value.party2Low,
    data.value.party1Med,
    data.value.party2Med,
    data.value.party1High,
    data.value.party2High,
  ];

  return (
    <tr>
      {renderTH(data.key)}
      {dataRender.map((e) =>
        renderTd(
          data.value.isNumber,
          data?.value?.isNeg ? data?.value?.isNeg : false,
          data?.value?.isString ? data?.value?.isString : false,
          e
        )
      )}
    </tr>
  );
};

export const TableColumnsCompareLumpsum = ({ data }: { data: any }) => {
  const renderTH = (val: string) => {
    return (
      <td>
        <strong>{val}</strong>
      </td>
    );
  };

  const dataRender = [
    data.value.Low,
    data.value.Med,
    data.value.High,
  ];

  return (
    <tr>
      {renderTH(data.key)}
      {dataRender.map((e) =>
        renderTd(
          data.value.isNumber,
          data?.value?.isNeg ? data?.value?.isNeg : false,
          data?.value?.isString ? data?.value?.isString : false,
          e
        )
      )}
    </tr>
  );
};


const ChildSupportTable = ({ data }: { data: any }) => {
  return (
    <div className="tableOuterPDF transparent">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>{data?.background?.party1FirstName}</th>
            <th>{data?.background?.party2FirstName}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Total Income</strong>
            </td>
            <td>{formatNumberInThousands(data?.totalIncomeParty1)}</td>
            <td>{formatNumberInThousands(data?.totalIncomeParty2)}</td>
          </tr>
          <tr>
            <td>
              <strong>CG Guideline Income </strong>
            </td>
            <td>
              {formatNumber(
                data?.guidelineIncome?.party1 + data?.totalIncomeParty1
              )}
            </td>
            <td>
              {formatNumber(
                data?.guidelineIncome?.party2 + data?.totalIncomeParty2
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Eligible children </strong>
            </td>
            <td>{data?.aboutTheChildren?.count?.party2}</td>
            <td>{data?.aboutTheChildren?.count?.party1}</td>
          </tr>
          <tr>
            <td>
              <strong>Total Child Support </strong>
            </td>
            <td>
              {formatNumberInThousands(data?.childSupport?.childSupport1)}
            </td>
            <td>
              {formatNumberInThousands(data?.childSupport?.childSupport2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Reports3;

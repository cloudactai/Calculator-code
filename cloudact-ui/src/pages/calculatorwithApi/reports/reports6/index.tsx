import { Col, Table } from "react-bootstrap";
import { removeNegSignAndWrapInBrackets, showElementForReportType } from "..";
import { formatNumber } from "../../../../utils/helpers/Formatting";
import { getProvinceForm } from "../../../../utils/helpers/province";
import { aboutYourChildrenState } from "../../screen1/Screen1";
import {
  filterEmployedIncome10100AndSum,
  filterSelfEmployedIncomeAndSum,
  MinimumAgeOfChildren,
  partyIncomeAndAmount,
} from "../../screen2/Screen2";

const Reports6 = ({ data }: any) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;

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
        {showElementForReportType(calculatorType, reportType, 6, "currentPage")}{" "}
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

function calculateAge(dob: number): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function limitChildExpense(
  childSupportVal: number,
  aboutTheChildren: aboutYourChildrenState,
  child: string
): number {
  const chosenChild = child ? child : aboutTheChildren.childrenInfo[0].name;
  const childInfo = aboutTheChildren.childrenInfo.find(
    (c) => c.name === chosenChild
  );

  if (!childInfo) {
    // Handle the case where the child information is not found
    return 0;
  }

  const age = calculateAge(childInfo.dateOfBirth);

  if (age < 7) {
    // If age is less than 7, limit to 8000
    return Math.min(childSupportVal, 8000);
  } else if (age >= 7 && age <= 17) {
    // If age is between 7 and 17, limit to 5000
    return Math.min(childSupportVal, 5000);
  } else {
    // Handle other age ranges if needed
    return 0;
  }
}

function capAndAccumulateChildExpense(
  deductions: partyIncomeAndAmount,
  aboutTheChildren: aboutYourChildrenState
) {
  const childCareExpenses = deductions.filter((d) => d.value === "21400");

  const accumulateAndSum = childCareExpenses
    ?.map((ce) => limitChildExpense(ce.amount, aboutTheChildren, ce?.child))
    .reduce((acc, sum) => acc + parseInt(sum), 0);

  return accumulateAndSum;
}

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
  const childCareExpensesParty1 = capAndAccumulateChildExpense(
    data.deductions.party1,
    data.aboutTheChildren
  );
  const childCareExpensesParty2 = capAndAccumulateChildExpense(
    data.deductions.party2,
    data.aboutTheChildren
  );
  const isFirstPartyPayingSecond = (data: any) => {
    return data?.givenTo !== data?.party2;
  };

  const party1Paying: boolean = isFirstPartyPayingSecond(data);

  const employment10100Income = {
    party1: filterEmployedIncome10100AndSum(data?.income?.party1),
    party2: filterEmployedIncome10100AndSum(data?.income?.party2),
  };

  const selfEmploymentIncome = {
    party1: filterSelfEmployedIncomeAndSum(data?.income?.party1),
    party2: filterSelfEmployedIncomeAndSum(data?.income?.party2),
  };

  const spousalSupportForParty =
    data?.spousalSupport?.spousalSupport1Low >
    data?.spousalSupport?.spousalSupport2Low
      ? 1
      : 2;

  const spousalSupportActual = {
    Low1:
      spousalSupportForParty === 1
        ? data?.spousalSupport?.spousalSupport1Low
        : data?.spousalSupport?.spousalSupport2Low,

    Med1:
      spousalSupportForParty === 1
        ? data?.spousalSupport?.spousalSupport1Med
        : data?.spousalSupport?.spousalSupport2Med,

    High1:
      spousalSupportForParty === 1
        ? data?.spousalSupport?.spousalSupport1High
        : data?.spousalSupport?.spousalSupport2High,

    Low2:
      spousalSupportForParty === 1
        ? data?.spousalSupport?.spousalSupport1Low
        : data?.spousalSupport?.spousalSupport2Low,

    Med2:
      spousalSupportForParty === 1
        ? data?.spousalSupport?.spousalSupport1Med
        : data?.spousalSupport?.spousalSupport2Med,

    High2:
      spousalSupportForParty === 1
        ? data?.spousalSupport?.spousalSupport1High
        : data?.spousalSupport?.spousalSupport2High,
  };

  const spousalSupportDeductions = {
    party1Low: party1Paying
      ? Math.abs(data?.spousalSupport?.spousalSupport2Low)
      : -Math.abs(data?.spousalSupport?.spousalSupport2Low) * 12,

    party1Med: party1Paying
      ? Math.abs(data?.spousalSupport?.spousalSupport2Med)
      : -Math.abs(data?.spousalSupport?.spousalSupport2Med) * 12,

    party1High: party1Paying
      ? Math.abs(data?.spousalSupport?.spousalSupport2High)
      : -Math.abs(data?.spousalSupport?.spousalSupport2High) * 12,

    party2Low: party1Paying
      ? -Math.abs(data?.spousalSupport?.spousalSupport2Low)
      : Math.abs(data?.spousalSupport?.spousalSupport2Low) * 12,

    party2Med: party1Paying
      ? -Math.abs(data?.spousalSupport?.spousalSupport2Med)
      : Math.abs(data?.spousalSupport?.spousalSupport2Med) * 12,

    party2High: party1Paying
      ? -Math.abs(data?.spousalSupport?.spousalSupport2High)
      : Math.abs(data?.spousalSupport?.spousalSupport2High) * 12,
  };

  const incomeHeadings = [
    {
      key: "Employment",
      value: {
        party1Low: employment10100Income.party1,
        party1Med: employment10100Income.party1,
        party1High: employment10100Income.party1,
        party2Low: employment10100Income.party2,
        party2Med: employment10100Income.party2,
        party2High: employment10100Income.party2,
      },
    },

    {
      key: "Self Employment",
      value: {
        party1Low: selfEmploymentIncome.party1,
        party1Med: selfEmploymentIncome.party1,
        party1High: selfEmploymentIncome.party1,
        party2Low: selfEmploymentIncome.party2,
        party2Med: selfEmploymentIncome.party2,
        party2High: selfEmploymentIncome.party2,
      },
    },
    {
      key: "Spousal Support",
      value: spousalSupportDeductions,
    },
  ];

  const deductionHeadings = [
    {
      key: "CPP Deductions",
      value: {
        party1Low: data?.cppDeductions?.party1,
        party1Med: data?.cppDeductions?.party1,
        party1High: data?.cppDeductions?.party1,
        party2Low: data?.cppDeductions?.party2,
        party2Med: data?.cppDeductions?.party2,
        party2High: data?.cppDeductions?.party2,
      },
    },
    {
      key: "Child Care Expenses",
      value: {
        party1Low: childCareExpensesParty1 || 0,
        party1Med: childCareExpensesParty1 || 0,
        party1High: childCareExpensesParty1 || 0,
        party2Low: childCareExpensesParty2 || 0,
        party2Med: childCareExpensesParty2 || 0,
        party2High: childCareExpensesParty2 || 0,
      },
    },
    {
      key: "Additional based on user input",
      value: {
        party1Low: 0,
        party1Med: 0,
        party1High: 0,
        party2Low: 0,
        party2Med: 0,
        party2High: 0,
      },
    },
    {
      key: "Taxable Income",
      value: {
        party1Low:
          data?.totalIncomeParty1 +
          spousalSupportDeductions.party1Low -
          data?.cppDeductions.party1 -
          (childCareExpensesParty1 || 0),
        party1Med:
          data?.totalIncomeParty1 +
          spousalSupportDeductions.party1Med -
          data?.cppDeductions.party1 -
          (childCareExpensesParty1 || 0),
        party1High:
          data?.totalIncomeParty1 +
          spousalSupportDeductions.party1High -
          data?.cppDeductions.party1 -
          (childCareExpensesParty1 || 0),
        party2Low:
          data?.totalIncomeParty2 +
          spousalSupportDeductions.party2Low -
          data?.cppDeductions.party2 -
          (childCareExpensesParty2 || 0),
        party2Med:
          data?.totalIncomeParty2 +
          spousalSupportDeductions.party2Med -
          data?.cppDeductions.party2 -
          (childCareExpensesParty2 || 0),
        party2High:
          data?.totalIncomeParty2 +
          spousalSupportDeductions.party2High -
          data?.cppDeductions.party2 -
          (childCareExpensesParty2 || 0),
      },
    },
  ];

  const federalCredits = [
    {
      key: "Basic Personal Amount",
      value: {
        party1Low: data?.allCreditsParty1?.basicPersonalAmountFederal,
        party1Med: data?.allCreditsParty1?.basicPersonalAmountFederal,
        party1High: data?.allCreditsParty1?.basicPersonalAmountFederal,
        party2Low: data?.allCreditsParty2?.basicPersonalAmountFederal,
        party2Med: data?.allCreditsParty2?.basicPersonalAmountFederal,
        party2High: data?.allCreditsParty2?.basicPersonalAmountFederal,
      },
    },
    {
      key: "Age Amount",
      value: {
        party1Low: data?.allCreditsParty1?.ageAmount,
        party1Med: data?.allCreditsParty1?.ageAmount,
        party1High: data?.allCreditsParty1?.ageAmount,
        party2Low: data?.allCreditsParty2?.ageAmount,
        party2Med: data?.allCreditsParty2?.ageAmount,
        party2High: data?.allCreditsParty2?.ageAmount,
      },
    },
    {
      key: "Eligible Dependent",
      value: {
        party1Low: data?.allCreditsParty1?.amountForEligibleDependent,
        party1Med: data?.allCreditsParty1?.amountForEligibleDependent,
        party1High: data?.allCreditsParty1?.amountForEligibleDependent,
        party2Low: data?.allCreditsParty2?.amountForEligibleDependent,
        party2Med: data?.allCreditsParty2?.amountForEligibleDependent,
        party2High: data?.allCreditsParty2?.amountForEligibleDependent,
      },
    },
    {
      key: "CPP",
      value: {
        party1Low: data?.allCreditsParty1?.baseCPPContribution,
        party1Med: data?.allCreditsParty1?.baseCPPContribution,
        party1High: data?.allCreditsParty1?.baseCPPContribution,
        party2Low: data?.allCreditsParty2?.baseCPPContribution,
        party2Med: data?.allCreditsParty2?.baseCPPContribution,
        party2High: data?.allCreditsParty2?.baseCPPContribution,
      },
    },
    {
      key: "EI",
      value: {
        party1Low: data?.allCreditsParty1?.EIPremiums,
        party1Med: data?.allCreditsParty1?.EIPremiums,
        party1High: data?.allCreditsParty1?.EIPremiums,
        party2Low: data?.allCreditsParty2?.EIPremiums,
        party2Med: data?.allCreditsParty2?.EIPremiums,
        party2High: data?.allCreditsParty2?.EIPremiums,
      },
    },
    {
      key: "Canada Employment",
      value: {
        party1Low: data?.allCreditsParty1?.canadaEmploymentAmount,
        party1Med: data?.allCreditsParty1?.canadaEmploymentAmount,
        party1High: data?.allCreditsParty1?.canadaEmploymentAmount,
        party2Low: data?.allCreditsParty2?.canadaEmploymentAmount,
        party2Med: data?.allCreditsParty2?.canadaEmploymentAmount,
        party2High: data?.allCreditsParty2?.canadaEmploymentAmount,
      },
    },
    {
      key: "Additional based on user input",
      value: {
        party1Low: 0,
        party1Med: 0,
        party1High: 0,
        party2Low: 0,
        party2Med: 0,
        party2High: 0,
      },
    },
    {
      key: "Disability Amount (Self) ",

      value: {
        party1Low: data.allCreditsParty1.disabilityCredits,
        party1Med: data.allCreditsParty1.disabilityCredits,
        party1High: data.allCreditsParty1.disabilityCredits,
        party2Low: data.allCreditsParty2.disabilityCredits,
        party2Med: data.allCreditsParty2.disabilityCredits,
        party2High: data.allCreditsParty2.disabilityCredits,
      },
    },
  ];

  const provincialCredit = [
    {
      key: "Basic Personal Amount",
      value: {
        party1Low: data?.allCreditsParty1?.basicPersonalAmountOntario,
        party1Med: data?.allCreditsParty1?.basicPersonalAmountOntario,
        party1High: data?.allCreditsParty1?.basicPersonalAmountOntario,
        party2Low: data?.allCreditsParty2?.basicPersonalAmountOntario,
        party2Med: data?.allCreditsParty2?.basicPersonalAmountOntario,
        party2High: data?.allCreditsParty2?.basicPersonalAmountOntario,
      },
    },
    {
      key: "Eligible Dependent",
      value: {
        party1Low: data?.allCreditsParty1?.amountForEligibleDependentOntario,
        party1Med: data?.allCreditsParty1?.amountForEligibleDependentOntario,
        party1High: data?.allCreditsParty1?.amountForEligibleDependentOntario,
        party2Low: data?.allCreditsParty2?.amountForEligibleDependentOntario,
        party2Med: data?.allCreditsParty2?.amountForEligibleDependentOntario,
        party2High: data?.allCreditsParty2?.amountForEligibleDependentOntario,
      },
    },
    {
      key: "LIFT",
      value: {
        party1Low: data?.LIFT?.party1Low,
        party1Med: data?.LIFT?.party1Med,
        party1High: data?.LIFT?.party1High,
        party2Low: data?.LIFT?.party2Low,
        party2Med: data?.LIFT?.party2Med,
        party2High: data?.LIFT?.party2High,
      },
    },
    {
      key: "Additional Based on user Input",
      value: {
        party1Low: 0,
        party1Med: 0,
        party1High: 0,
        party2Low: 0,
        party2Med: 0,
        party2High: 0,
      },
    },

    {
      key: `Disability Amount (Self)_ ${getProvinceForm(
        data?.background.party1province
      )} `,
      value: {
        party1Low: data.allCreditsParty1.disabilityCreditsProv,
        party1Med: data.allCreditsParty1.disabilityCreditsProv,
        party1High: data.allCreditsParty1.disabilityCreditsProv,
        party2Low: data.allCreditsParty2.disabilityCreditsProv,
        party2Med: data.allCreditsParty2.disabilityCreditsProv,
        party2High: data.allCreditsParty2.disabilityCreditsProv,
      },
    },
  ];

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
          {incomeHeadings
            .filter((h) => {
              if (data.calculator_type === "CHILD_SUPPORT_CAL") {
                return h.key !== "Spousal Support";
              } else {
                return h;
              }
            })
            .map((e) => {
              return <TableColumns data={e} />;
            })}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Deductions</strong>
          </span>
          {deductionHeadings.map((e) => (
            <TableColumns data={e} />
          ))}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Federal Credits</strong>
          </span>
          {federalCredits.map((e) => (
            <TableColumns data={e} />
          ))}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Provincial Credits</strong>
          </span>
          {provincialCredit.map((e) => (
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
      <td>{removeNegSignAndWrapInBrackets(data.value.party1Low)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value.party1Med)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value.party1High)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value.party2Low)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value.party2Med)}</td>
      <td>{removeNegSignAndWrapInBrackets(data.value.party2High)}</td>
    </tr>
  );
};

export default Reports6;

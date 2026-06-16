import {
  showElementForReportType,
} from "..";
import { removeNegSignAndWrapInBrackets } from "..";
import { ratioData } from "./ratioData";


const Reports10 = ({ data }: { data: any }) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;
  console.log("report on Page10", data)





  return (
    <div className="pagePDF">
      <span className="headingPDF">HOUSEHOLD INCOME RATIO</span>

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


const CalculateTotalTax = (...data: number[]) => {
  return Math.round(Number(data.reduce((acc, add) => acc + add)))
}

const getNumberOfChildrenWithParty1 = (numChildren: { party1: String }) => {
  return numChildren.party1;
}

const getNumberOfChildrenWithParty2 = (numChildren: { party1: String }) => {
  return numChildren.party2;
};

const getNumberOfAdultChildrenWithParty2 = (numChildren: { party1: String }) => {
  return numChildren.party2WithAdultChild + 1;
};

const getNumberOfAdultChildrenWithParty1 = (numChildren: { party1: String }) => {
  return numChildren.party1WithAdultChild + 1;
};



const calculateRatioUsingChildAndAdultInfo = (count: { child: number | String, adults: number | String }) => {
  return ratioData.filter((item) => {
    return item.adults == count.adults && item.child == count.child
  })
}

const calulateRatioWithHouseholdAndIncome = (annualIncome: any, householdratio: any) => {
  return (annualIncome / householdratio).toFixed(2);
}

const UniversalChildCareBenefit = (data: Array<T>) => {
  return data.filter((p) => p.value === "11700")
    .reduce((acc, inc) => acc + parseInt(inc.amount), 0);
}


const CalculationTable = ({ data }: any) => {

  const { totalIncomeParty1,
    gettaxsAndDedutionByIncome,
    totalIncomeParty2,
    aboutTheChildren,
    undueHardshipIncome,
    spousalSupport,
    federalTaxValues,
    ontarioTaxValues,
    CPPandEIValues,
    childSupport,
    allCreditsParty1,
    allCreditsParty2,

    otherhouseholdmember,
  } = data;

  console.log("gettaxsAndDedutionByIncome", gettaxsAndDedutionByIncome)


  let universalIncomeparty1 = UniversalChildCareBenefit(data.income.party1);
  let universalIncomeparty2 = UniversalChildCareBenefit(data.income?.party2);
  let allTaxAndPayableParty1Low = CalculateTotalTax(allCreditsParty1.EIPremiums, allCreditsParty1.baseCPPContribution, ontarioTaxValues.party1Low, federalTaxValues.party1Low, spousalSupport.spousalSupport2Low, universalIncomeparty1)
  let allTaxAndPayableParty2Low = CalculateTotalTax(allCreditsParty2.EIPremiums, allCreditsParty2.baseCPPContribution, ontarioTaxValues.party2Low, federalTaxValues.party2Low, spousalSupport.spousalSupport1Low, universalIncomeparty2)

  let allTaxAndPayableParty1Med = CalculateTotalTax(allCreditsParty1.EIPremiums, allCreditsParty1.baseCPPContribution, ontarioTaxValues.party1Med, federalTaxValues.party1Med, spousalSupport.spousalSupport2Med, universalIncomeparty1)
  let allTaxAndPayableParty2Med = CalculateTotalTax(allCreditsParty2.EIPremiums, allCreditsParty2.baseCPPContribution, ontarioTaxValues.party2Med, federalTaxValues.party2Med, spousalSupport.spousalSupport1Med, universalIncomeparty2)

  let allTaxAndPayableParty1High = CalculateTotalTax(allCreditsParty1.EIPremiums, allCreditsParty1.baseCPPContribution, ontarioTaxValues.party1High, federalTaxValues.party1High, spousalSupport.spousalSupport2High, universalIncomeparty1)
  let allTaxAndPayableParty2High = CalculateTotalTax(allCreditsParty2.EIPremiums, allCreditsParty2.baseCPPContribution, ontarioTaxValues.party2High, federalTaxValues.party2High, spousalSupport.spousalSupport1High, universalIncomeparty2)

  let TotalDeductionsparty1 = CalculateTotalTax(undueHardshipIncome.party1, childSupport.childSupport2 * 12, 0);
  let TotalDeductionsparty2 = CalculateTotalTax(undueHardshipIncome.party2, childSupport.childSupport1 * 12, 0)

  let TotalAdditionparty1 = CalculateTotalTax(childSupport.childSupport1 * 12, 0);
  let TotalAdditionparty2 = CalculateTotalTax(childSupport.childSupport2 * 12, 0);


  let TotalIncomeTocompareStandardOflivinglow = totalIncomeParty1 - CalculateTotalTax(allCreditsParty1.EIPremiums, allCreditsParty1.baseCPPContribution, ontarioTaxValues.party1Low, federalTaxValues.party1Low, spousalSupport.spousalSupport2Low, universalIncomeparty1)

  const getAllAdditionsParty1 = (data) => {

    return data.reduce((ecc, add) => Number(ecc) + Number(add.AdjustmentIncome), 0)
  }
  const getAllAdditionsParty2 = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.AdjustmentIncome), 0)
  }

  const getAllDeductionsParty1 = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.deductionIncome), 0)
  }
  const getAllDeductionsParty2 = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.deductionIncome), 0)
  }

  const getAllIncomeParty1 = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.income), 0)
  }
  const getAllIncomeParty2 = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.income), 0)
  }

  const getHouseholdFedData = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.federalTax.federalTaxOnIncome), 0)
  }

  const getHouseholdEIpremiumData = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.eiPremiumsAmt), 0)
  }

  const getHouseholdCPPData = (data) => {
    return data.reduce((ecc, add) => Number(ecc) + Number(add.baseCPPContribution), 0)
  }



  const householdDetails = [
    {
      key: "Adults",
      value: {
        party1Low: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count),
        party1Med: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count),
        party1High: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count),
        party1otherhousehold: 0,
        party2Low: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count),
        party2Med: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count),
        party2High: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count),
        party2otherhousehold: 0,
        isString: true,
        isNumber: false
      },
    },

    {
      key: "Children",
      value: {
        party1Low: getNumberOfChildrenWithParty1(aboutTheChildren.count),
        party1Med: getNumberOfChildrenWithParty1(aboutTheChildren.count),
        party1High: getNumberOfChildrenWithParty1(aboutTheChildren.count),
        party1otherhousehold: 0,

        party2Low: getNumberOfChildrenWithParty2(aboutTheChildren.count),
        party2Med: getNumberOfChildrenWithParty2(aboutTheChildren.count),
        party2High: getNumberOfChildrenWithParty2(aboutTheChildren.count),
        party2otherhousehold: 0,

        isString: true,
        isNumber: false
      },
    },
    {
      key: "Annual income",
      value: {
        party1Low: totalIncomeParty1,
        party1Med: totalIncomeParty1,
        party1High: totalIncomeParty1,
        party1otherhousehold: getAllIncomeParty1(otherhouseholdmember.party1),
        party2Low: totalIncomeParty2,
        party2Med: totalIncomeParty2,
        party2High: totalIncomeParty2,
        party2otherhousehold: getAllIncomeParty2(otherhouseholdmember.party2),

        isString: false,
        isNumber: true

      },
    },
  ];

  const IncomePayable = [
    {
      key: "Universal Child Care Benefit (UCCB)",
      value: {
        party1Low: universalIncomeparty1,
        party1Med: universalIncomeparty1,
        party1High: universalIncomeparty1,
        party1otherhousehold: 0,
        party2Low: universalIncomeparty2,
        party2Med: universalIncomeparty2,
        party2High: universalIncomeparty2,
        party2otherhousehold: 0,
        isString: false,
        isNumber: true
      },
    },
    {
      key: "Spousal support received fron the other parent",
      value: {
        party1Low: Math.round(spousalSupport.spousalSupport2Low),
        party1Med: Math.round(spousalSupport.spousalSupport2Med),
        party1High: Math.round(spousalSupport.spousalSupport2High),
        party1otherhousehold: 0,
        party2Low: Math.round(spousalSupport.spousalSupport1Low),
        party2Med: Math.round(spousalSupport.spousalSupport1Med),
        party2High: Math.round(spousalSupport.spousalSupport1High),
        party2otherhousehold: 0,
        isString: false,
        isNumber: true
      },
    },
    {
      key: "Federal taxes payable",
      value: {
        party1Low: Math.round(federalTaxValues.party1Low),
        party1Med: Math.round(federalTaxValues.party1Med),
        party1High: Math.round(federalTaxValues.party1High),
        party1otherhousehold: getHouseholdFedData(gettaxsAndDedutionByIncome.party1),
        party2Low: Math.round(federalTaxValues.party2Low),
        party2Med: Math.round(federalTaxValues.party2Med),
        party2High: Math.round(federalTaxValues.party2High),
        party2otherhousehold: getHouseholdFedData(gettaxsAndDedutionByIncome.party2),
        isString: false,
        isNumber: true
      },
    },

    {
      key: "Provincial or territorial taxes payable",
      value: {
        party1Low: Math.round(ontarioTaxValues.party1Low),
        party1Med: Math.round(ontarioTaxValues.party1Med),
        party1High: Math.round(ontarioTaxValues.party1High),
        party1otherhousehold: 0,
        party2Low: Math.round(ontarioTaxValues.party2Low),
        party2Med: Math.round(ontarioTaxValues.party2Med),
        party2High: Math.round(ontarioTaxValues.party2High),
        party2otherhousehold: 0,
        isString: false,
        isNumber: true
      },
    },

    {
      key: "EI premium payable",
      value: {

        party1Low: Math.round(allCreditsParty1.EIPremiums),
        party1Med: Math.round(allCreditsParty1.EIPremiums),
        party1High: Math.round(allCreditsParty1.EIPremiums),
        party1otherhousehold: getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1),
        party2Low: Math.round(allCreditsParty2.EIPremiums),
        party2Med: Math.round(allCreditsParty2.EIPremiums),
        party2High: Math.round(allCreditsParty2.EIPremiums),
        party2otherhousehold: getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2),
        isString: false,
        isNumber: true


      },
    },

    {
      key: "CPP premium payable",
      value: {
        party1Low: Math.round(allCreditsParty1.baseCPPContribution),
        party1Med: Math.round(allCreditsParty1.baseCPPContribution),
        party1High: Math.round(allCreditsParty1.baseCPPContribution),
        party1otherhousehold: getHouseholdCPPData(gettaxsAndDedutionByIncome.party1),
        party2Low: Math.round(allCreditsParty2.baseCPPContribution),
        party2Med: Math.round(allCreditsParty2.baseCPPContribution),
        party2High: Math.round(allCreditsParty2.baseCPPContribution),
        party2otherhousehold: getHouseholdCPPData(gettaxsAndDedutionByIncome.party2),
        isString: false,
        isNumber: true
      },
    },

    {
      key: "Total taxes and premium payable",
      value: {
        party1Low: allTaxAndPayableParty1Low,
        party1Med: allTaxAndPayableParty1Med,
        party1High: allTaxAndPayableParty1High,
        party1otherhousehold: CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
        party2Low: allTaxAndPayableParty2Low,
        party2Med: allTaxAndPayableParty2Med,
        party2High: allTaxAndPayableParty2High,
        party2otherhousehold: CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)),
        isString: false,
        isNumber: true
      },
    },

    {
      key: "Annual income to compare standards of living",
      value: {
        party1Low: totalIncomeParty1 - allTaxAndPayableParty1Low,
        party1Med: totalIncomeParty1 - allTaxAndPayableParty1Med,
        party1High: totalIncomeParty1 - allTaxAndPayableParty1High,
        party1otherhousehold: getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
        party2Low: totalIncomeParty2 - allTaxAndPayableParty2Low,
        party2Med: totalIncomeParty2 - allTaxAndPayableParty2Med,
        party2High: totalIncomeParty2 - allTaxAndPayableParty2High,
        party2otherhousehold: getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)),
        isString: false,
        isNumber: true
      },
    },



  ];

  const Deductions = [
    {
      key: "Annual amount related to undue hardship",
      value: {
        party1Low: undueHardshipIncome.party1,
        party1Med: undueHardshipIncome.party1,
        party1High: undueHardshipIncome.party1,
        party1otherhousehold: 0,
        party2Low: undueHardshipIncome.party2,
        party2Med: undueHardshipIncome.party2,
        party2High: undueHardshipIncome.party2,
        party2otherhousehold: 0,
        isString: false,
        isNumber: true
      },
    },
    {
      key: "Annual amount of child support paid",
      value: {
        party1Low: childSupport.childSupport2 * 12,
        party1Med: childSupport.childSupport2 * 12,
        party1High: childSupport.childSupport2 * 12,
        party1otherhousehold: 0,
        party2Low: childSupport.childSupport1 * 12,
        party2Med: childSupport.childSupport1 * 12,
        party2High: childSupport.childSupport1 * 12,
        party2otherhousehold: 0,
        isString: false,
        isNumber: true
      },
    },
    {
      key: "Annual amount of child and spousal support paid by household member",
      value: {
        party1Low: 0,
        party1Med: 0,
        party1High: 0,
        party1otherhousehold: getAllDeductionsParty1(otherhouseholdmember.party1),
        party2Low: 0,
        party2Med: 0,
        party2High: 0,
        party2otherhousehold: getAllDeductionsParty2(otherhouseholdmember.party2),
        isString: false,
        isNumber: true
      },
    },

    {
      key: "Total deductions",
      value: {
        party1Low: TotalDeductionsparty1,
        party1Med: TotalDeductionsparty1,
        party1High: TotalDeductionsparty1,
        party1otherhousehold: getAllDeductionsParty1(otherhouseholdmember.party1),
        party2Low: TotalDeductionsparty2,
        party2Med: TotalDeductionsparty2,
        party2High: TotalDeductionsparty2,
        party2otherhousehold: getAllDeductionsParty2(otherhouseholdmember.party2),
        isString: false,
        isNumber: true
      },
    },


  ];

  const Additions = [
    {
      key: "Annual amount of child support you would receive from the other parent",
      value: {
        party1Low: childSupport.childSupport1 * 12,
        party1Med: childSupport.childSupport1 * 12,
        party1High: childSupport.childSupport1 * 12,
        party1otherhousehold: 0,
        party2Low: childSupport.childSupport2 * 12,
        party2Med: childSupport.childSupport2 * 12,
        party2High: childSupport.childSupport2 * 12,
        party2otherhousehold: 0,
        isString: false,
        isNumber: true
      },
    },
    {
      key: "Annual amount of child support received by you or any other household member for another child",
      value: {
        party1Low: 0,
        party1Med: 0,
        party1High: 0,
        party1otherhousehold: getAllAdditionsParty1(otherhouseholdmember.party1),
        party2Low: 0,
        party2Med: 0,
        party2High: 0,
        party2otherhousehold: getAllAdditionsParty2(otherhouseholdmember.party2),
        isString: false,
        isNumber: true
      },
    },

    {
      key: "Total addition",
      value: {
        party1Low: TotalAdditionparty1,
        party1Med: TotalAdditionparty1,
        party1High: TotalAdditionparty1,
        party1otherhousehold: getAllAdditionsParty1(otherhouseholdmember.party1),
        party2Low: TotalAdditionparty2,
        party2Med: TotalAdditionparty2,
        party2High: TotalAdditionparty2,
        party2otherhousehold: getAllAdditionsParty2(otherhouseholdmember.party2),
        isString: false,
        isNumber: true
      },
    },
  ];

  const totalRatio = [
    {
      key: "Adjusted annual income",
      value: {
        party1Low: CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1Low, TotalDeductionsparty1, TotalAdditionparty1),
        party1Med: CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1Med, TotalDeductionsparty1, TotalAdditionparty1),
        party1High: CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1High, TotalDeductionsparty1, TotalAdditionparty1),
        party1otherhousehold: CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
          getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
        ),

        party2Low: CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2Low, TotalDeductionsparty2, TotalAdditionparty2),
        party2Med: CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2Med, TotalDeductionsparty2, TotalAdditionparty2),
        party2High: CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2High, TotalDeductionsparty2, TotalAdditionparty2),
        party2otherhousehold:
          CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2))),
        isString: false,
        isNumber: true
      }
    },
    {
      key: "Total annual income for all members of party 1 household",
      value: {
        party1Low: CalculateTotalTax(
          totalIncomeParty1 - allTaxAndPayableParty1Low, TotalDeductionsparty1, TotalAdditionparty1
          ,
          CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
            getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
          )
        ),
        party1Med: CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1Med, TotalDeductionsparty1, TotalAdditionparty1, CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
          getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
        )),
        party1High: CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1High, TotalDeductionsparty1, TotalAdditionparty1, CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
          getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
        )),
        party1otherhousehold: CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
          getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
        ),
        party2Low: CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2Low, TotalDeductionsparty2, TotalAdditionparty2,
          CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)))
        ),
        party2Med: CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2Med, TotalDeductionsparty2, TotalAdditionparty2,
          CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)))),
        party2High: CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2High, TotalDeductionsparty2, TotalAdditionparty2,
          CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)))),
        party2otherhousehold: CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2))),

        isString: false,
        isNumber: true
      }
    }
    ,
    {
      key: "Low income measures",
      value: {
        party1Low: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty1(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count) })[0]?.amount,
        party1Med: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty1(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count) })[0]?.amount,
        party1High: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty1(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count) })[0]?.amount,
        party1otherhousehold: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty1(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count) })[0]?.amount,
        party2Low: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty2(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count) })[0]?.amount,
        party2Med: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty2(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count) })[0]?.amount,
        party2High: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty2(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count) })[0]?.amount,
        party2otherhousehold: calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty2(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count) })[0]?.amount,
        isString: false,
        isNumber: true
      }
    },
    {
      key: "Household income ratio",
      value: {

        party1Low: calulateRatioWithHouseholdAndIncome(
          CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1Low, TotalDeductionsparty1, TotalAdditionparty1,
            CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
              getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
            )
          ),
          calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty1(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count) })[0]?.amount),





        party1Med: calulateRatioWithHouseholdAndIncome(
          CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1Med, TotalDeductionsparty1, TotalAdditionparty1, CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
            getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
          )
          ),
          calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty1(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count) })[0]?.amount),


        party1High: calulateRatioWithHouseholdAndIncome(
          CalculateTotalTax(totalIncomeParty1 - allTaxAndPayableParty1High, TotalDeductionsparty1, TotalAdditionparty1,
            CalculateTotalTax(getAllAdditionsParty1(otherhouseholdmember.party1), getAllDeductionsParty1(otherhouseholdmember.party1),
              getAllIncomeParty1(otherhouseholdmember.party1) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party1), getHouseholdCPPData(gettaxsAndDedutionByIncome.party1), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party1)),
            )),
          calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty1(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty1(aboutTheChildren.count) })[0]?.amount),



        party1otherhousehold: 0,

        party2Low: calulateRatioWithHouseholdAndIncome(
          CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2Low, TotalDeductionsparty2, TotalAdditionparty2,
            CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)))),
          calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty2(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count) })[0]?.amount),


        party2Med: calulateRatioWithHouseholdAndIncome(
          CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2Med, TotalDeductionsparty2, TotalAdditionparty2,
            CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)))),
          calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty2(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count) })[0]?.amount),


        party2High: calulateRatioWithHouseholdAndIncome(
          CalculateTotalTax(totalIncomeParty2 - allTaxAndPayableParty2High, TotalDeductionsparty2, TotalAdditionparty2,
            CalculateTotalTax(getAllAdditionsParty2(otherhouseholdmember.party2), getAllDeductionsParty2(otherhouseholdmember.party2), getAllIncomeParty2(otherhouseholdmember.party2) - CalculateTotalTax(getHouseholdFedData(gettaxsAndDedutionByIncome.party2), getHouseholdCPPData(gettaxsAndDedutionByIncome.party2), getHouseholdEIpremiumData(gettaxsAndDedutionByIncome.party2)))),
          calculateRatioUsingChildAndAdultInfo(data = { child: getNumberOfChildrenWithParty2(aboutTheChildren.count), adults: getNumberOfAdultChildrenWithParty2(aboutTheChildren.count) })[0]?.amount),


        party2otherhousehold: 0,
        isString: true,
        isNumber: false
      }
    }


  ]


  return (
    <div className="tableOuterPDF transparent" style={{ margin: "10px 0 0 0" }}>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Party 1</th>
            <th>Party 1</th>
            <th>Party 1</th>
            <th>Other household</th>
            <th>Party 2</th>
            <th>Party 2</th>
            <th>Party 2</th>
            <th>Other household</th>

          </tr>
          <tr>
            <th></th>
            <th>Low</th>
            <th>Med</th>
            <th>High</th>
            <th></th>

            <th>Low</th>
            <th>Med</th>
            <th>High</th>
            <th></th>

          </tr>
        </thead>
        <tbody>
          {householdDetails.map((e) => {
            return <TableColumns data={e} />;
          })}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Income And Payables</strong>
          </span>
          {IncomePayable.map((e) => (
            <TableColumns data={e} />
          ))}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Deductions</strong>
          </span>
          {Deductions.map((e) => (
            <TableColumns data={e} />
          ))}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>Additions</strong>
          </span>
          {Additions.map((e) => (
            <TableColumns data={e} />
          ))}
          <span
            className="textPDF"
            style={{ margin: "20px 10px 10px", padding: "0" }}
          >
            <strong>TotalRatio</strong>
          </span>
          {totalRatio.map((e) => (
            <TableColumns data={e} />
          ))}



        </tbody>
      </table>
    </div>
  );
};

export const TableColumns = ({
  data
}: {
  data: {
    key: string;
    value: {
      party1Low: number;
      party1Med: number;
      party1High: number;
      party1otherhousehold: number;
      party2Low: number;
      party2Med: number;
      party2High: number;
      party2otherhousehold: number;
      isNumber: boolean;
      isString: boolean
    };
  };

}) => {


  return (
    <tr>
      <td>{data.key}</td>
      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party1Low) : data.value.party1Low}</td>
      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party1Med) : data.value.party1Med}</td>
      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party1High) : data.value.party1High}</td>
      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party1otherhousehold) : data.value.party1otherhousehold}</td>

      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party2Low) : data.value.party2Low}</td>
      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party2Med) : data.value.party2Med}</td>
      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party2High) : data.value.party2High}</td>
      <td>{data.value.isNumber ? removeNegSignAndWrapInBrackets(data.value.party2otherhousehold) : data.value.party2otherhousehold}</td>

    </tr>
  );
};

export default Reports10;







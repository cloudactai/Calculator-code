import {
  backgroundState,
  childInfo,
  ItypeOfSplitting,
} from "../../../pages/calculator/Calculator";
import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../../../pages/calculator/screen1/Screen1";
import {
  dynamicValues,
  totalFederalCredits,
  totalOntarioCredits,
} from "./creditTaxCalculationFormulas";
import { momentFunction } from "../../moment";
import { replaceLastThreeChars } from "../../helpers";
import { findRateForFederalTax } from "../../../pages/calculator/screen2/Screen2";
import store from "../../../store";

const formulaForFedTax = (data: any, taxableIncome: number) => {
  // =MAX(I22+(F15-K22)*J22 - (F25*15%),0)

  return Number(
    (
      data.Basic +
      (taxableIncome - data.Income_over) * data.Rate -
      totalFederalCredits(data) * 0.15
    ).toFixed(4)
  );
};

interface formulaForProvTaxInterface {
  Basic: number;
  Income_over: number;
  Rate: number;
  ageForPerson: number;
  totalIncome: number;
  taxableIncome: number;
  childSupport: {
    party1: number;
    party2: number;
  };
  screen1: {
    background: backgroundState;
    aboutTheRelationship: aboutTheRelationshipState;
    aboutTheChildren: aboutYourChildrenState;
  };
  year: number;
  partyNum: number;
  selfEmployedIncome: number;
  employedIncome10100: number;
  employedIncome: number;
  dynamicValues: dynamicValues;
  rateBasicValuesForProv?: any;
  rateBasicValuesForHealth?: any;
  bothIncomes?: {
    party1: number;
    party2: number;
  };
  provincialCredits: number;
}

const taxSimpleI26 = (
  data: formulaForProvTaxInterface,
  taxableIncome: number
) => {
  // =MAX(I23+(F13-K23)*J23 - (F24*5.05%)-I27,0)

  // =MAX(I23+(F15-K23)*J23 - (F26*5.05%)-I31,0)

  //use rate Basic Values for prov

  const val = Number(
    Math.max(
      data.rateBasicValuesForProv.Basic +
      (taxableIncome - data.rateBasicValuesForProv.Income_over) *
      data.rateBasicValuesForProv.Rate -
      data.provincialCredits * 0.0505,

      //     -  lowIncomeCredit(data.employedIncome, taxableIncome),
      0
    )
  );
  //bug
  // console.log("&& Ontario Tax on Income", {
  //   taxableIncome: taxableIncome,
  //   rateBasicValuesForProv: data.rateBasicValuesForProv,
  //   ontarioTaxOnIncome: data.rateBasicValuesForProv.Basic +
  //     (taxableIncome - data.rateBasicValuesForProv.Income_over) * data.rateBasicValuesForProv.Rate,

  //   ontarioTaxOnIncomeVal: {
  //     basic: data.rateBasicValuesForProv.Basic,
  //     taxableIncome: taxableIncome,
  //     IncomeOver: data.rateBasicValuesForProv.Income_over,
  //     rate: data.rateBasicValuesForProv.Rate
  //   },

  //   ontarioTaxDeductions: totalOntarioCreditsVal *
  //     0.0505 -
  //     lowIncomeCredit(data, taxableIncome),

  //   ontarioTaxDeductionsVal: {
  //     totalOntarioCredits: totalOntarioCreditsVal,
  //     lowIncomeCredit: lowIncomeCredit(data, taxableIncome)
  //   }

  // })

  return val;
};

const lowIncomeCredit = (
  employedIncome: number,
  taxableIncome: number
): number => {
  const { ONLIFTAmount, ONLIFTIndividual, ONLIFTReductionRate } =
    store.getState().dynamicValues.data;
  // =MAX(MAX(MIN(F4*5.05%,850),0)-MAX(F13-30000,0)*10%,0)
  const result = Number(
    Math.max(
      Math.max(Math.min(employedIncome * 0.0505, ONLIFTAmount), 0) -
      Math.max(taxableIncome - ONLIFTIndividual, 0) * ONLIFTReductionRate,
      0
    ).toFixed(4)
  );

  return result;
};

const taxSimplePart2 = (
  screen1: { aboutTheChildren: aboutYourChildrenState },
  ontarioTaxPart2: number
): number => {
  // =I30-MAX((251+IF(N26>0,464,0))*2-I30,0)
  const { ONTaxReductionBase, ONTaxReductionDep } =
    store.getState().dynamicValues.data;
  let addChildAmount = 0;

  if (screen1.aboutTheChildren.numberOfChildren > 0) {
    addChildAmount = ONTaxReductionDep;
  }

  const taxSimplePart2Val =
    ontarioTaxPart2 -
    Math.max((ONTaxReductionBase + addChildAmount) * 2 - ontarioTaxPart2, 0);

  return taxSimplePart2Val;
};

interface provincialCreditsParams {
  childCareExpenses: number;
  taxableAmountAfterSupport: number;
  rates: any;
}

const formulaForProvincialCredits = (
  data: provincialCreditsParams,
  year: number
) => {
  // =IF(F9>0,-((F9)*VLOOKUP((F9+F15),AF7:AH45,3,TRUE))*(1+20%),0)
  let val = 0;
  if (data.childCareExpenses > 0 && data.rates.length > 0) {
    const incomeOver = data.childCareExpenses + data.taxableAmountAfterSupport;
    const res = findRateForFederalTax(data.rates, incomeOver)[0];
    const provinceCreditPercentage = year === 2021 ? 0.2 : 0;
    val = data.childCareExpenses * res?.Rate * (1 + provinceCreditPercentage);
  }

  // console.log("provincial Credits BC", { val, data })

  //This amount should be negative
  console.log("checkprovincialcredit data", val)
  return val;
};

const formulaForProvTax = (
  data: formulaForProvTaxInterface,
  taxableIncome: number
): number => {
  const { ONSurtaxThreshold1, ONSurtaxThreshold2 } =
    store.getState().dynamicValues.data;
  let total = 0;

  if (data.rateBasicValuesForHealth && data.rateBasicValuesForProv) {
    const ontarioTaxPart1 = taxSimpleI26(data, taxableIncome);
    const Surtax = Number(
      Math.max((ontarioTaxPart1 - ONSurtaxThreshold1) * 0.2, 0) +
      Math.max((ontarioTaxPart1 - ONSurtaxThreshold2) * 0.36, 0)
    );
    const ontarioTaxPart1Surtax = Number(ontarioTaxPart1 + Surtax);
    const ontarioTaxPart2 = taxSimplePart2(data.screen1, ontarioTaxPart1Surtax);

    total =
      Math.max(
        ontarioTaxPart2 - lowIncomeCredit(data.employedIncome, taxableIncome),
        0
      ) +
      data.rateBasicValuesForHealth.Basic +
      (taxableIncome - data.rateBasicValuesForHealth.Income_over) *
      data.rateBasicValuesForHealth.Rate;
    //      + Math.max((ontarioTaxPart2 - ONSurtaxThreshold1) * 0.2, 0) +
    //      Math.max((ontarioTaxPart2 - ONSurtaxThreshold2) * 0.36, 0)
  }

  return total;
};

const calculateBaseAmount = (
  data: childInfo[],
  dynamicValues: dynamicValues
) => {
  let TotalBaseAmount = 0;

  data.forEach((element) => {
    let age = momentFunction.differenceBetweenNowAndThen(element.dateOfBirth);
    //two more else if statements for age 17 and age 18
    if (age < 6) {
      TotalBaseAmount += dynamicValues["ChildBenefitBaseAmountLess6"];
    } else if (age >= 6 && age <= 17) {
      TotalBaseAmount += dynamicValues["ChildBenefitBaseAmountMore6"];
    } else {
      TotalBaseAmount = 0;
    }
  });

  return TotalBaseAmount;
};

const calculateDisabilityAmount = (
  data: childInfo[],
  dynamicValues: dynamicValues,
  taxableIncome: any
) => {
  let TotalDisibilityAmount = 0;

  data.forEach((element, key, array) => {
    if (element.childHasDisability == "Yes") {
      // if(array.length == 1 ){
      //   TotalDisibilityAmount = Math.max(
      //     dynamicValues?.ChildDisabilityBaseAmt -
      //     (Math.max(taxableIncome - dynamicValues?.ChildDisabilityThreshold ,0)
      //     * dynamicValues?.ChildDisabilityReductionTwoOrMore) ,0)
      // }

      if (array.length == 1) {
        TotalDisibilityAmount = Math.max(
          dynamicValues?.ChildDisabilityBaseAmt -
          Math.max(
            taxableIncome - dynamicValues?.ChildDisabilityThreshold,
            0
          ) *
          dynamicValues?.ChildDisabilityReductionOneChild,
          0
        );
      } else if (array.length >= 1) {
        TotalDisibilityAmount = Math.max(
          dynamicValues?.ChildDisabilityBaseAmt -
          Math.max(
            taxableIncome - dynamicValues?.ChildDisabilityThreshold,
            0
          ) *
          dynamicValues?.ChildDisabilityReductionTwoOrMore,
          0
        );
      }
    }
  });

  // if(data.length == 1){

  //   TotalDisibilityAmount = Math.max(
  //   dynamicValues?.ChildDisabilityBaseAmt -
  //   (Math.max(taxableIncome - dynamicValues?.ChildDisabilityThreshold ,0)
  //   * dynamicValues?.ChildDisabilityReductionOneChild) ,0)

  // }else if(data.length >= 1){
  //   console.log("case case 2" , dynamicValues?.ChildDisabilityReductionTwoOrMore)

  //   TotalDisibilityAmount = Math.max(
  //     dynamicValues?.ChildDisabilityBaseAmt -
  //     (Math.max(taxableIncome - dynamicValues?.ChildDisabilityThreshold ,0)
  //     * dynamicValues?.ChildDisabilityReductionTwoOrMore) ,0)
  // }

  return TotalDisibilityAmount;
};

const determinePercentageAccordingToNumChildren = (numChildren: number) => {
  const obj: Record<number, number> = {
    0: 0,
    1: 0.07,
    2: 0.135,
    3: 0.19,
    4: 0.23,
  };

  return numChildren > 4 ? obj[4] : obj[numChildren];
};

const calculateBaseAndPercentageAccordingToNumChildren = (
  noChildren: number,
  dynamicValues: dynamicValues
) => {
  let base = dynamicValues["CAChildBenefitBase4Child"];
  let percentage = 0.095;

  if (noChildren === 1) {
    base = dynamicValues["CAChildBenefitBase1Child"];
    percentage = 0.032;
  } else if (noChildren === 2) {
    base = dynamicValues["CAChildBenefitBase2Child"];
    percentage = 0.057;
  } else if (noChildren === 3) {
    base = dynamicValues["CAChildBenefitBase3Child"];
    percentage = 0.08;
  }

  return {
    base,
    percentage,
  };
};

const calculateDeductionsInChildBenefit = (
  taxableIncome: number,
  noChildren: number,
  dynamicValues: dynamicValues
) => {
  let totalDeductions = 0;
  // =IF(F15<69395,MAX((F15-32028) * VLOOKUP(N26,Q31:R34,2,FALSE),0),  MAX( VLOOKUP(N26,T31:V34,2,FALSE) + (F15-69395) * VLOOKUP(N26,T31:V34,3,FALSE),0))
  if (noChildren > 0) {
    if (taxableIncome < dynamicValues["CAChildBenefitReduHighThreshold"]) {
      totalDeductions =
        (taxableIncome - dynamicValues["CAChildBenefitReduLowerThreshold"]) *
        determinePercentageAccordingToNumChildren(noChildren);

      totalDeductions = Math.max(totalDeductions, 0);
    } else {
      const baseAndPercentageAccorToNumChildren =
        calculateBaseAndPercentageAccordingToNumChildren(
          noChildren,
          dynamicValues
        );

      totalDeductions = Math.max(
        baseAndPercentageAccorToNumChildren.base +
        (taxableIncome - dynamicValues["CAChildBenefitReduHighThreshold"]) *
        baseAndPercentageAccorToNumChildren.percentage,
        0
      );
    }
  }

  return totalDeductions;
};

const calculateChildrenLivingWithDetailsParty1 = (
  data: childInfo[],
  name: string
) => {
  const val = data.filter(
    (e) => e.custodyArrangement === "Party 1" || e.custodyArrangement === name
  );

  return val;
};

const calculateChildrenLivingWithDetailsParty2 = (
  data: childInfo[],
  name: string
) => {
  const val = data.filter(
    (e) => e.custodyArrangement === "Party 2" || e.custodyArrangement === name
  );

  return val;
};

const calculateChildrenLivingWithDetailsShared = (data: childInfo[]) => {
  const val = data.filter((e) => e.custodyArrangement === "Shared");
  return val;
};

const formulaForCanadaChildBenefit = (
  data: aboutYourChildrenState,
  taxableIncome: number,
  typeOfSplitting: ItypeOfSplitting,
  name: string,
  partyNum: number,
  dynamicValues: dynamicValues
) => {
  const childrenLivingWithShared = calculateChildrenLivingWithDetailsShared(
    data.childrenInfo
  );

  let childrenLivingWithParty =
    partyNum === 1
      ? calculateChildrenLivingWithDetailsParty1(data.childrenInfo, name)
      : calculateChildrenLivingWithDetailsParty2(data.childrenInfo, name);

  if (typeOfSplitting === "SHARED") {
    childrenLivingWithParty = childrenLivingWithShared;
  }

  let totalBaseAmountHybrid = 0;
  let totalDeductionsHybrid = 0;

  let totalBaseAmount = calculateBaseAmount(
    childrenLivingWithParty,
    dynamicValues
  );

  if (typeOfSplitting === "HYBRID") {
    totalBaseAmountHybrid = calculateBaseAmount(
      childrenLivingWithShared,
      dynamicValues
    );
  }

  let totalDeductions = calculateDeductionsInChildBenefit(
    taxableIncome,
    childrenLivingWithParty.length,
    dynamicValues
  );

  if (typeOfSplitting === "HYBRID") {
    totalDeductionsHybrid = calculateDeductionsInChildBenefit(
      taxableIncome,
      childrenLivingWithShared.length,
      dynamicValues
    );
  }

  let result =
    totalBaseAmount -
    Math.abs(totalDeductions) +
    (totalBaseAmountHybrid - Math.abs(totalDeductionsHybrid)) / 2;


  return result;
};

const formulaForChildDisabilityBenefit = (
  data: aboutYourChildrenState,
  taxableIncome: number,
  typeOfSplitting: ItypeOfSplitting,
  name: string,
  partyNum: number,
  dynamicValues: dynamicValues
) => {
  const childrenLivingWithShared = calculateChildrenLivingWithDetailsShared(
    data.childrenInfo
  );

  let childrenLivingWithParty =
    partyNum === 1
      ? calculateChildrenLivingWithDetailsParty1(data.childrenInfo, name)
      : calculateChildrenLivingWithDetailsParty2(data.childrenInfo, name);

  if (typeOfSplitting === "SHARED") {
    childrenLivingWithParty = childrenLivingWithShared;
  }

  let totalBaseAmount = 0;

  if (typeOfSplitting === "HYBRID") {
    totalBaseAmount = calculateDisabilityAmountWithHybrid(
      data,
      dynamicValues,
      taxableIncome,
      name,
      partyNum
    );
  } else {
    totalBaseAmount = calculateDisabilityAmount(
      childrenLivingWithParty,
      dynamicValues,
      taxableIncome
    );
  }

  return totalBaseAmount;
};

const calculateDisabilityAmountWithHybrid = (
  data: childInfo[],
  dynamicValues: dynamicValues,
  taxableIncome: any,
  name: any,
  partyNum: 1 | 2
) => {
  let result = 0;
  let party1HasChild = false;
  let party2HasChild = false;

  if (partyNum == 1) {
    party1HasChild = data?.childrenInfo?.some((childInfo) => {
      return childInfo.custodyArrangement == name;
    });
  }

  if (partyNum == 2) {
    party2HasChild = data?.childrenInfo?.some((childInfo) => {
      return childInfo.custodyArrangement === name;
    });
  }

  data?.childrenInfo?.map((ele, index, array) => {
    if (ele.childHasDisability == "Yes") {
      result = Math.max(
        dynamicValues?.ChildDisabilityBaseAmt -
        Math.max(taxableIncome - dynamicValues?.ChildDisabilityThreshold, 0) *
        dynamicValues?.ChildDisabilityReductionTwoOrMore,
        0
      );

      if (partyNum === 2 && !party2HasChild) {
        result /= 2;
      }
      if (partyNum === 1 && !party1HasChild) {
        result /= 2;
      }

      return result;
    }
  });

  return result;
};

const formulaFindYoungestChild = (data: childInfo[]): number => {
  return Math.min(
    ...data.map(({ dateOfBirth }) =>
      momentFunction.differenceBetweenNowAndThen(dateOfBirth)
    )
  );
};

const formulaCalculateDurationLow = (
  yearsLivingTogether: number,
  youngestChild: number
): number => {
  //Max(years living together*0.5,6 - youngest child’s age)
  return Math.max(yearsLivingTogether * 0.5, 6 - youngestChild);
};

const formulaCalculateDurationHigh = (
  yearsLivingTogether: number,
  youngestChild: number
): number => {
  // Max(years living together*1, 18 -youngest child’s age)
  return Math.max(yearsLivingTogether * 1, 18 - youngestChild);
};

export const determineSpecialCase = (
  data: formulaForCalculatingDurationOfSupportParams,
  yearsLivingTogether: number
): boolean => {
  return (
    yearsLivingTogether >= 20 ||
    yearsLivingTogether + data.personAgeReceivingSupport >= 65
  );
};

interface formulaForCalculatingDurationOfSupportParams {
  childInfo: childInfo[];
  background: backgroundState;
  relationship: aboutTheRelationshipState;
  personAgeReceivingSupport: number;
}

export const determineSpecialCaseWithoutChildren = (
  data: formulaForCalculatingDurationOfSupportParams,
  yearsLivingTogether: number
) => {
  return (
    momentFunction.differenceBetweenNowAndThen(
      data.background.party1DateOfBirth
    ) +
    yearsLivingTogether >
    65 || yearsLivingTogether > 20
  );
};

const formulaForCalculatingDurationOfSupport = (
  data: formulaForCalculatingDurationOfSupportParams
): number[] => {
  const findYearsOfLivingTogether: number =
    momentFunction.differenceBetweenTwoDates(
      data.relationship.dateOfMarriage,
      data.relationship.dateOfSeparation
    );

  let calculateDurationLow: number = 999999999;
  let calculateDurationHigh: number = 999999999;

  if (data.childInfo.length > 0) {
    const findYoungestChild: number = formulaFindYoungestChild(data.childInfo);

    const isSpecialCase = determineSpecialCase(data, findYearsOfLivingTogether);

    if (!isSpecialCase) {
      calculateDurationLow = formulaCalculateDurationLow(
        findYearsOfLivingTogether,
        findYoungestChild
      );
      calculateDurationHigh = formulaCalculateDurationHigh(
        findYearsOfLivingTogether,
        findYoungestChild
      );
    }

    return [calculateDurationLow, calculateDurationHigh];
  } else {
    const isSpecialCase = determineSpecialCaseWithoutChildren(
      data,
      findYearsOfLivingTogether
    );

    if (!isSpecialCase) {
      calculateDurationLow = findYearsOfLivingTogether * 0.5;
      calculateDurationHigh = findYearsOfLivingTogether;
    }

    return [calculateDurationLow, calculateDurationHigh];
  }
};

const formulaForGSTHSTBenefits = (
  taxableIncome: number,
  noChildrenWithEachParty: number,
  typeOfSplitting: ItypeOfSplitting
) => {
  const { GSTBaseCredit, GSTDependentCredit, GSTBaseAmount, GSTAddCreditThreshold } =
    store.getState().dynamicValues.data;

  // =MAX(299+ 157 * (N26 - 1) - MAX((F13-38892),0)*5%,0)
  let val = 0;
  let AdditionalCredit = 0

  if (noChildrenWithEachParty > 0) {
    val = GSTBaseCredit + GSTDependentCredit * (noChildrenWithEachParty - 1);

    if (typeOfSplitting === "SHARED") {
      val = val / 2;
    }
  }

  // let AdditionalCredit = Math.min(Math.max(taxableIncome - GSTAddCreditThreshold,0)) * 0.02 
  // , GSTDependentCredit
  // )
  if (noChildrenWithEachParty > 0) {
    AdditionalCredit = GSTDependentCredit
  } else {
    AdditionalCredit = Math.min(Math.max(taxableIncome - GSTAddCreditThreshold, 0) * 0.02, GSTDependentCredit)
  }

  if (typeOfSplitting === "SHARED") {
    if (AdditionalCredit === GSTDependentCredit) {
      AdditionalCredit = AdditionalCredit / 2
    }
  }


  const calc = Math.max(
    GSTBaseCredit + AdditionalCredit +
    // GSTDependentCredit +
    val -
    Math.max(taxableIncome - GSTBaseAmount, 0) * 0.05,
    0
  );

  return calc;
};

const formulaForOntarioSalesTax = (
  taxableIncome: number,
  noChildrenWithEachParty: number,
  typeOfSplitting: ItypeOfSplitting
) => {
  const {
    ONSalesTaxBase,
    ONSalesTaxThresholdFamily,
    ONSalesTaxThresholdSingle,
  } = store.getState().dynamicValues.data;
  //

  // =IF(O26>0,MAX( (316 + 316*(O26)) - MAX((G15-30415)*4%,0), 0 )
  //  , MAX( (316 + 316*(O26)) - MAX((G15-24332)*4%,0), 0 ))

  if (noChildrenWithEachParty > 0) {
    // return Math.max(316 + 316 * noChildrenWithEachParty - Math.max((taxableIncome - 30415) * 0.04, 0), 0)

    // console.log("&& sales tax", {
    //   taxableIncome,
    //   noChildrenWithEachParty,
    //     multiply: 158 * noChildrenWithEachParty,
    //     firstpartFormula: 316 + (158 * noChildrenWithEachParty),
    //     secondPart: Math.max((taxableIncome - 30415) * 0.04, 0),
    //     fullPart: Math.max(316 + (158 * noChildrenWithEachParty) - Math.max((taxableIncome - 30415) * 0.04, 0), 0)
    // })
    let multiplyBy =
      typeOfSplitting === "SHARED" ? ONSalesTaxBase / 2 : ONSalesTaxBase;

    return Math.max(
      ONSalesTaxBase +
      multiplyBy * noChildrenWithEachParty -
      Math.max((taxableIncome - ONSalesTaxThresholdFamily) * 0.04, 0),
      0
    );
  }

  return Math.max(
    ONSalesTaxBase +
    ONSalesTaxBase * noChildrenWithEachParty -
    Math.max((taxableIncome - ONSalesTaxThresholdSingle) * 0.04, 0),
    0
  );
};

const calculateSelfEmployedDeductions = (
  selfEmployedIncome: number,
  data: dynamicValues
) => {
  //=(MIN(F5,61600)-3500)*10.9%
  const val1 =
    (Math.min(selfEmployedIncome, data.SelfEmployedEnhCPPThreshold) - 3500) *
    data.SelfEmployedEnhCPPRate;

  //=I6*0.908257
  // const val2 = val1 * 0.908257;

  //=I7*50%+(I6-I7)

  // console.log("Enhanced CPP deductions 2", val2, val1, val2 * 0.5 + (val1 - val2));

  return val1; //  val2 * 0.5 + (val1 - val2);
};

interface formulaEnhancedCPPdeductionParams {
  employedIncome: number;
  selfEmployedIncome: number;
  data: dynamicValues;
}

const formulaEnhancedCPPdeduction = ({
  employedIncome,
  selfEmployedIncome,
  data,
}: formulaEnhancedCPPdeductionParams) => {
  // =IF(F4>0,MAX(MIN((B5-3500)*0.005,290.5),0),IF(F5>0,I8,0))

  // console.log("data in Enhanced CPP", data)

  if (employedIncome > 0) {
    let CPP2Amt = 0
    if (employedIncome <= data.CPP2PenEarning) {
      CPP2Amt = 0;
    } else if (employedIncome > data.CPP2MaxPenEarning) {
      CPP2Amt = data.CPP2MaxAmt;
    } else {
      CPP2Amt = (employedIncome - data.CPP2PenEarning) * data.CPP2Rate;
    }

    return Math.max(
      Math.min(
        (employedIncome - 3500) * data.EnhancedCPPDeductionRate,
        data.EnhancedCPPDeductionLimit
      ),
      0
    ) + CPP2Amt;
  } else if (selfEmployedIncome > 0) {
    let CPP2Amt = 0
    if (selfEmployedIncome <= data.CPP2PenEarning) {
      CPP2Amt = 0;
    } else if (selfEmployedIncome > data.CPP2MaxPenEarning) {
      CPP2Amt = data.CPP2MaxAmt * 2;
    } else {
      CPP2Amt = (selfEmployedIncome - data.CPP2PenEarning) * data.CPP2Rate * 2;
    }
    return (
      calculateSelfEmployedDeductions(selfEmployedIncome, data) -
      Math.max(
        Math.min(
          (selfEmployedIncome + employedIncome - 3500) * 0.0495,
          Number(data.BaseCPPLimit)
        ),
        0
      ) + CPP2Amt
    );
  } else {
    return 0;
  }
};

const parametersForCalculatingChildSupport = (
  incomeOver: string,
  numChildren: number,
  province: string
) => {
  return {
    incomeOver: replaceLastThreeChars(incomeOver),
    numChildren,
    province,
  };
};

const spousalSupportFormulaByRate = (
  houseHoldIncome1: number,
  houseHoldIncome2: number,
  rate: number
): number => {

  const val = Number(
    (
      ((houseHoldIncome1 + houseHoldIncome2) * rate -
        Math.min(...[houseHoldIncome1, houseHoldIncome2])) /
      12
    ).toFixed(4)
  );

  return val > 0 ? val : 0;
};

const spousalSupportLowFormula = (
  houseHoldIncome1: number,
  houseHoldIncome2: number
): number => {
  return Number(
    (
      ((houseHoldIncome1 + houseHoldIncome2) * 0.4 -
        Math.min(...[houseHoldIncome1, houseHoldIncome2])) /
      12
    ).toFixed(4)
  );
};
const spousalSupportHighFormula = (
  houseHoldIncome1: number,
  houseHoldIncome2: number
): number => {
  return Number(
    (
      ((houseHoldIncome1 + houseHoldIncome2) * 0.46 -
        Math.min(...[houseHoldIncome1, houseHoldIncome2])) /
      12
    ).toFixed(4)
  );
};

const formulaForChildSupport = (data: any) => {
  const formula =
    data.basic + (data.totalIncomeParty - data.income_over) * (data.rate / 100);

  return formula > 0 ? formula : 0;
};

const calculateSpousalSupport = (data: {
  partyNum: number;
  taxableIncomeAfterSupport: number;
  totalTaxes: number;
  totalBenefits: number;
  childSupport: number;
}) => {
  const val =
    Number(data.taxableIncomeAfterSupport) -
    Number(data.totalTaxes) +
    Number(data.totalBenefits) -
    Number(data.childSupport);

  return val > 0 ? val : 0;
};

export {
  formulaForFedTax,
  formulaForChildSupport,
  calculateSpousalSupport,
  formulaForCalculatingDurationOfSupport,
  formulaForProvTax,
  formulaForCanadaChildBenefit,
  spousalSupportHighFormula,
  formulaForProvincialCredits,
  spousalSupportLowFormula,
  lowIncomeCredit,
  spousalSupportFormulaByRate,
  taxSimpleI26,
  parametersForCalculatingChildSupport,
  formulaForGSTHSTBenefits,
  formulaEnhancedCPPdeduction,
  formulaForOntarioSalesTax,
  calculateDeductionsInChildBenefit,
  calculateBaseAmount,
  formulaFindYoungestChild,
  formulaForChildDisabilityBenefit,
};

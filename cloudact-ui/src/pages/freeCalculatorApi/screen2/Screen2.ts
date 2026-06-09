import Cookies from "js-cookie";
import { fetchAllDynamicValues, fetchChildSupportValues } from "../../../utils/Apis/calculator/fetchAllDynamicValues";
import { fetchAllValuesInTaxRefDB } from "../../../utils/Apis/calculator/fetchAllValuesInTaxRefDB";
import { dynamicValues } from "../../../utils/helpers/calculator/creditTaxCalculationFormulas";
import { spousalSupportFormulaByRate } from "../../../utils/helpers/calculator/taxCalculationFormula";
import { momentFunction } from "../../../utils/moment";
import { backgroundState, ItypeOfSplitting, Province } from "../Calculator";
import { aboutYourChildrenState } from "../screen1/Screen1";

//interfaces used in calculator.
interface incomeDropdown {
  label: string;
  value: string;
}

export interface IFixedValues {
  party1: {
    isFixed: boolean,
    value: number,
  },
  party2: {
    isFixed: boolean,
    value: number,
  }
}

export interface partyIncomeAndAmount {
  label: string;
  amount: string;
  value: string;
}

export interface IncomeState {
  party1: partyIncomeAndAmount[];
  party2: partyIncomeAndAmount[];
}

export interface twoPartyStates {
  party1: number;
  party2: number;
}

interface calculateSpousalSupportAccToSalaryDiffParams
  extends limitForSpousalHighExceededParams {
  houseHoldIncome1: number;
  houseHoldIncome2: number;
  yearsLivingTogether: number;
}

export interface calculateLowMedHighOnWithoutChildrenReturn {
  low: number;
  med: number;
  high: number;
}

interface limitForSpousalHighExceededParams {
  disposibleIncome1: number;
  disposibleIncome2: number;
}

interface DisposableIncome {
  taxableIncome: number;
  totalTaxes: number;
  totalBenefits: number;
  childSupport: number;
}

export interface propsTableParams {
  incomes: twoPartyStates;
  taxesAndDeductions: twoPartyStates;
  benefitsAndCredits: twoPartyStates;
  childSupport: twoPartyStates;
  notionalChildSupport: twoPartyStates;
  specialExpenses: twoPartyStates;
  applicablePercentage: number;
  percentage: number;
  spousalSupport: twoPartyStates;
}

export class partyIncome {
  constructor(
    public label: string,
    public amount: string,
    public value: string
  ) { }
}

//static dropdown data for benefits 
export const fedBenefitTypeDropdown: incomeDropdown[] = [
  {
    label: "Canada Child Benefit",
    value: "-",
  },
  {
    label: "Canada Child Disability Benefit",
    value: "-",
  },
  {
    label: "GST HST Benefit",
    value: "-",
  },
  {
    label: "Climate action incentive",
    value: "-",
  },
];

export const provBenefitONTypeDropdown: incomeDropdown[] = [
  {
    label: "Ontario Child Benefit",
    value: "-",
  },
  {
    label: "Ontario Sales Tax Credit",
    value: "-",
  },
  {
    label: "Energy and Property Tax Credit",
    value: "-",
  },
  {
    label: "Northern Ontario Energy Credit",
    value: "-",
  },
  {
    label: "Senior Homeowners' Property Tax Grant",
    value: "-",
  },
];

//static dropdown values for BC benefits.
export const provBenefitBCTypeDropdown: incomeDropdown[] = [
  {
    label: "BC Childhood Opportunity Benefit",
    value: "-",
  },
  {
    label: "BC Climate action tax credit",
    value: "-",
  },
  {
    label: "Sales Tax Credit ",
    value: "-",
  },
];


//static dropdown values for guideline income 
export const guidelineIncomeTypeDropdown: incomeDropdown[] = [
  {
    label: "Deduct Employment expenses",
    value: "-",
  },
  {
    label: "Deduct Taxable child support received",
    value: "-",
  },
  {
    label: "Deduct Spousal support received from other parent",
    value: "-",
  },
  {
    label: "Deduct Universal Child Care Benefit (UCCB)",
    value: "-",
  },
  {
    label: "Deduct Split pension amount",
    value: "-",
  },
  {
    label:
      "Deduct Social assistance received for other members (identify portion for other family member from Line 14500)",
    value: "-",
  },
  {
    label:
      "Deduct Excess portions of dividends from taxable Canadian Corporations (Total dividends received from T5 slips",
    value: "-",
  },
  {
    label: "Deduct Actual business investment losses",
    value: "-",
  },
  {
    label: "Deduct Carrying charges",
    value: "-",
  },
  {
    label: "Deduct Prior period earnings",
    value: "-",
  },
  {
    label: "Deduct Partnership or sole proprietorship income",
    value: "-",
  },
  {
    label: "Add Capital gains and capital losses",
    value: "-",
  },
  {
    label: "Add Net self employment income",
    value: "-",
  },
  {
    label: "Add Capital cost allowance for property",
    value: "-",
  },
  {
    label: "Add Employee stock options",
    value: "-",
  },
  {
    label: "Add Pattern of income adjustment (s 17)",
    value: "-",
  },
  {
    label: "Deduct Patter of income adjustment (s 17)",
    value: "-",
  },
  {
    label: "Add Non-recurring loss (s 17)",
    value: "-",
  },
  {
    label: "Add Income (s 18- Shareholder, director or officer)",
    value: "-",
  },
  {
    label: "Add Income (s 19- Impute income)",
    value: "-",
  },
];

export const specialExpensesDropdown: incomeDropdown[] = [
  { label: "Child Care expenses", value: "21400" },
  { label: "Medical Expenses ", value: "33099" },
  { label: "Extraordinary education expenses", value: "32400" },
  { label: "Post-Secondary expenses", value: "32300" },
  { label: "Extraordinary extracurricular expenses", value: "-" },
];

export const incomeTypeDropdown: incomeDropdown[] = [
  {
    label: "10100 - Employment Income",
    value: "10100",
  },
  {
    label: "12000 - Taxable amount of eligible dividends",
    value: "12000",
  },
  {
    label: "12100 - Interest and other investment income",
    value: "12100",
  },
  {
    label: "Line 25 - Self employed Business/Professional/Commission Income ",
    value: "Line 25",
  },
  {
    label: "10400 - Other employment income",
    value: "10400",
  },
  {
    label: "11300 - Old age security pension",
    value: "11300",
  },
  {
    label: "11400 - CPP or QPP benefits",
    value: "11400",
  },
  {
    label: "11500 - Other pensions and superannuation",
    value: "11500",
  },
  {
    label: "11600 - Elected split-pension amount ",
    value: "11600",
  },
  {
    label: "11700 - Universal child care benefit (UCCB) ",
    value: "11700",
  },
  {
    label: "11900 - Employment insurance and other benefits",
    value: "11900",
  },
  {
    label:
      "12200 - Net partnership income: limited or non-active partners only",
    value: "12200",
  },
  {
    label: "12500 - Registered disability savings plan income",
    value: "12500",
  },
  {
    label: "12600 - Rental income",
    value: "12600",
  },
  {
    label: "12700 - Taxable capital gains ",
    value: "12700",
  },
  {
    label: "12800 - Support payments received",
    value: "12800",
  },
  {
    label: "12900 - Registered retirement savings plan income",
    value: "12900",
  },
  {
    label: "13000 - Other income",
    value: "13000",
  },
  {
    label:
      "13010 - Taxable scholarship, fellowships, bursaries, and artists' project grants",
    value: "13010",
  },
  {
    label: "14400 - Workers' compensation benefits",
    value: "14400",
  },
  {
    label: "14500 - Social assistance payments",
    value: "14500",
  },
  {
    label: "14600 - Net federal supplements",
    value: "14600",
  },
];

export const determineTypeOfCredits = (creditId: string): string => {
  if (String(creditId)[0] === "3") {
    return "FED";
  } else {
    return "PROV";
  }
};

// =================== SPECIAL EXPENSES ================

const determineMedicalExpensesDeduction = (creditId: string): boolean => {
  return creditId === "33099";
};

export const filterMedicalExpenses = (data: partyIncomeAndAmount[]) => {
  const val = data.filter((e) => determineMedicalExpensesDeduction(e.value));
  return val;
};

export const filterMedicalExpensesAndSum = (data: partyIncomeAndAmount[]) => {
  const val = filterMedicalExpenses(data).reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );

  return val;
};

export const determineChildCareExpensesDeduction = (deductionID: string): boolean => {
  //21400 - child Care expenses.
  return deductionID === "21400";
};

export const filterChildCareExpenses = (data: partyIncomeAndAmount[]) => {
  const val = data.filter((e) => determineChildCareExpensesDeduction(e.value));

  return val;
};

export const filterOtherDeductionsExceptSpecialExpenses = (
  data: partyIncomeAndAmount[]
) => {
  const val = data.filter((e) => !determineChildCareExpensesDeduction(e.value));

  return val;
};

export const filterOtherCreditsExceptSpecialExpenses = (
  data: partyIncomeAndAmount[]
) => {
  const val = data.filter((e) => !determineMedicalExpensesDeduction(e.value));

  return val;
};

export const filterChildCareExpensesAndSum = (data: partyIncomeAndAmount[]) => {
  const val = filterChildCareExpenses(data).reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );
  return val;
};

const determinePostSecondaryExpensesDeduction = (creditId: string): boolean => {
  return creditId === "32300";
};

const determineExtraOrdinaryEducationExpensesDeduction = (
  creditId: string
): boolean => {
  return creditId === "32400";
};

const filterExtracurricularExpensesAndSum = (creditId: string): boolean => {
  return creditId === "";
};
// =================== SPECIAL EXPENSES ================

//total self employed income function
export const determineSelfEmployedIncome = (incomeId: string): boolean => {
  return incomeId === "Line 25";
};

//total employed income function
export const determineEmployedIncome10100 = (incomeId: string): boolean => {
  return incomeId === "10100";
};

export const proportionOfIncome = (
  income1: number,
  income2: number,
  partyNum: number
) => {
  const totalIncome = income1 + income2;

  if (partyNum === 1) {
    return income1 / totalIncome;
  }

  return income2 / totalIncome;
};

export const filterDeductionsOtherThanSpecialExpenses = (
  data: partyIncomeAndAmount[]
) => {
  const val = data
    .filter((e) => determineChildCareExpensesDeduction(e.value) === false)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  return val;
};

export const filterEmployedIncome10100AndSum = (
  data: partyIncomeAndAmount[]
) => {
  if (data && data.length > 0) {
    const val = data
      .filter((e) => determineEmployedIncome10100(e.value))
      .reduce((acc, curr) => acc + Math.round(Number(curr.amount)), 0);
    return val;
  }

  return 0;
};

export const filterSelfEmployedIncomeAndSum = (
  data: partyIncomeAndAmount[]
) => {
  if (data && data.length > 0) {
    const val = data
      .filter((e) => determineSelfEmployedIncome(e.value))
      .reduce((acc, curr) => acc + Math.round(Number(curr.amount)), 0);
    return val;
  }

  return 0;
};

export const filterOtherIncomesAndSum = (data: partyIncomeAndAmount[]) => {
  const val = data
    .filter((e) => determineSelfEmployedIncome(e.value) === false)
    .reduce((acc, curr) => acc + Math.round(Number(curr.amount)), 0);
  return val;
};

export const filterAllIncomesExceptEmployedAndSelfEmployedAndSum = (
  data: partyIncomeAndAmount[]
) => {
  const val = data
    .filter(
      (e) =>
        determineSelfEmployedIncome(e.value) === false &&
        determineEmployedIncome10100(e.value) === false
    )
    .reduce((acc, curr) => acc + Math.round(Number(curr.amount)), 0);
  return val;
};

export const mapAmountFieldAndTotal = (data: partyIncomeAndAmount[]) => {
  return data
    .map(({ amount }) => Number(amount))
    .reduce((curr, acc) => curr + acc, 0);
};

export const filterFederalCreditsAndSum = (data: partyIncomeAndAmount[]) => {
  return data
    .filter((e) => {
      return determineTypeOfCredits(e.value) === "FED";
    })
    .reduce((acc, curr) => acc + Math.round(Number(curr.amount)), 0);
};

export const filterProvincialCreditsAndSum = (data: partyIncomeAndAmount[]) => {
  return data
    .filter((e) => {
      return determineTypeOfCredits(e.value) === "PROV";
    })
    .reduce((acc, curr) => acc + Math.round(Number(curr.amount)), 0);
};

export const totalNumberOfChildren = (
  screen1AboutTheChildren: aboutYourChildrenState
) => {
  return screen1AboutTheChildren.numberOfChildren;
};

//============================ without Children ================================


export const determineWhichPartyHasGreaterIncomeAndChild = (
  data: aboutYourChildrenState,
  incomes: { totalIncomeParty1: number; totalIncomeParty2: number }
) => {
 

  const numberOfChildrenWithParty1 = data.count.party1;
  const numberOfChildrenWithParty2 = data.count.party2;
  const totalNumberOfChildren = Number(data.numberOfChildren);
  const numberOfChildrenWithShared = data.count.shared;

  if (totalNumberOfChildren > 0 && numberOfChildrenWithShared === 0) {
    if (
      incomes.totalIncomeParty1 > incomes.totalIncomeParty2 &&
      numberOfChildrenWithParty1 === totalNumberOfChildren
    ) {
      return true;
    } else if (
      incomes.totalIncomeParty1 < incomes.totalIncomeParty2 &&
      numberOfChildrenWithParty2 === totalNumberOfChildren
    ) {
      return true;
    }
  }

  return false;
};

export const calculateLowMedHighOnWithoutChildren = (
  yearsLivingTogther: number
): calculateLowMedHighOnWithoutChildrenReturn => {
  const low = Math.min(0.015 * yearsLivingTogther, 0.5);
  const med = Math.min(0.0175 * yearsLivingTogther, 0.5);
  const high = Math.min(0.02 * yearsLivingTogther, 0.5);

  return {
    low,
    med,
    high,
  };
};


export const calculateSpousalSupportAccToSalaryDiff = (
  data: calculateSpousalSupportAccToSalaryDiffParams
) => {
  const grossIncomeDiff = Math.abs(
    data.houseHoldIncome1 - data.houseHoldIncome2
  );

  const { low, med, high }: calculateLowMedHighOnWithoutChildrenReturn =
    calculateLowMedHighOnWithoutChildren(data.yearsLivingTogether);

  const lowSupport = (low * grossIncomeDiff) / 12;
  const medSupport = (med * grossIncomeDiff) / 12;
  let highSupport = (high * grossIncomeDiff) / 12;
  // let highLimit = limitForSpousalHighExceeded({disposibleIncome1: data.disposibleIncome1, disposibleIncome2: data.disposibleIncome2})

  return {
    low,
    med,
    high,
    lowSupport,
    medSupport,
    highSupport,
    // highLimit
  };
};


export const limitForSpousalHighExceeded = (
  data: limitForSpousalHighExceededParams
): number => {
  const support = spousalSupportFormulaByRate(
    data.disposibleIncome1,
    data.disposibleIncome2,
    0.5
  );

  return support;
};

//============== calculate Disposable Income ================


export const calculateDisposableIncome = (data: DisposableIncome) => {
  const val =
    Number(data.taxableIncome) -
    Number(data.totalTaxes) +
    Number(data.totalBenefits) -
    Number(data.childSupport);

  return val > 0 ? val : 0;
};

export const separateValuesDB = (
  data: Array<{ Province: string }>,
  province: Province
) => {


  const federalValues = data.filter(({ Province }) => Province === "FED");
  const provincialValues = data.filter(
    ({ Province }) => Province === province
  );
  const HealthValues = data.filter(
    ({ Province }) => Province === province + "-Health"
  );
  const OnCareValues = data.filter(({ Province }) => Province === "ON-Ccare");
  const OnMrateValues = data.filter(({ Province }) => Province === "ON-Mrate");

  return {
    federalValues,
    provincialValues,
    HealthValues,
    OnCareValues,
    OnMrateValues,
  };
};

export const findRateForFederalTax = (allValues: any[], incomeOver: number) => {
  return allValues.filter(
    ({ From, To }) => From <= incomeOver && To >= incomeOver
  );
};

export const MinimumAgeOfChildren = (data: aboutYourChildrenState) => {
  const info = data.childrenInfo.map((e) => {
    return momentFunction.differenceBetweenNowAndThen(e.dateOfBirth);
  });

  return Math.min(...info);
};



export const convertArrToObj = (data: dynamicValues[]) => {
  const obj = {};
  data.forEach((e) => {
    obj[e.Key] = Number(e.Value);
  });



  return obj;
  // const obj: dynamicValues[] =  data.filter((e) => e.Key === Key);
  // return Number(obj[0].Value);
};

export const fetchAllValuesFromDB = (
  year: number,
  province: Province,
  numChild: string
): Promise<{ dynamicValues: Array<any>; TaxValues: Array<any>, childSupportValues: Array<any> }> => {
  return new Promise((resolve, reject) => {
    Promise.all([
      fetchAllDynamicValues(year, province),
      fetchAllValuesInTaxRefDB(year),
      fetchChildSupportValues(year, province, numChild)
    ])
      .then(([dynamicValues, TaxValues, childSupportValues]) => {

        resolve({ dynamicValues, TaxValues, childSupportValues });
      })
      .catch((err) => {
        // console.log("Error Fetching Values from DB", err);
        reject(err);
      });
  });
};


export const ifSharedDivideBy2 = (
  splittingCase: ItypeOfSplitting,
  val: number
) => {
  if (splittingCase === "SHARED") {
    return Number(val) / 2;
  }
  return Number(val);
};

export const CSGOverrideValues = (
  aboutTheChildren: aboutYourChildrenState,
  background: backgroundState,
  partyNum: number
): number[] => {
  const partyName =
    partyNum === 1 ? background.party1FirstName : background.party2FirstName;

  const CSGOverrideValues: number[] = [];

  aboutTheChildren.childrenInfo.forEach((child) => {
    if (
      child.CSGTable === "Yes" &&
      child.custodyArrangement === partyName &&
      child.ChildSupportOverride > 0
    ) {
      CSGOverrideValues.push(child.ChildSupportOverride);
    }
  });

  return CSGOverrideValues;
};

export const filterPositiveValuesAndSum = (data: partyIncomeAndAmount[]) => {
  const posValues = data.filter((val) => Number(val.amount) >= 0);

  return mapAmountFieldAndTotal(posValues);
};

export const filterNegativeValuesAndSum = (data: partyIncomeAndAmount[]) => {
  const negValues = data.filter((val) => Number(val.amount) < 0);

  return mapAmountFieldAndTotal(negValues);
};

export const getCalculatorLabelFromCookies = () => {
  const data = Cookies.get("calculatorLabel");

  if (data) {
    return JSON.parse(data);
  }
}

export const noOfSharedChildrenInHybrid = (screen1: { aboutTheChildren: aboutYourChildrenState }, typeOfSplitting: ItypeOfSplitting): number => {
  if (typeOfSplitting === "HYBRID") {
    const sharedNum = screen1.aboutTheChildren.count.sharedWithAdultChild;

    return sharedNum;
  }

  return 0;

  // if (partyNum === 1) {
  //   const [actualChildren, noOfChildrenWithParty] = [screen1.aboutTheChildren.count.party1WithAdultChild, screen1.aboutTheChildren.count.party1];
  //     // 0 < 1
  //   if (actualChildren < noOfChildrenWithParty) {
  //     return noOfChildrenWithParty - sharedNum;
  //     //1 - 1;
  //   } else {
  //     return 0;
  //   }
  // } else {
  //   const [actualChildren, noOfChildrenWithParty] = [screen1.aboutTheChildren.count.party2WithAdultChild, screen1.aboutTheChildren.count.party2];

  //   if (actualChildren < noOfChildrenWithParty) {
  //     return noOfChildrenWithParty - sharedNum;
  //   } else {
  //     return 0;
  //   }
  // }
}

export const noOfActualChildrenInHybrid = (screen1: { aboutTheChildren: aboutYourChildrenState }, partyNum: 1 | 2): number => {
  return partyNum === 1 ? screen1.aboutTheChildren.count.party1WithAdultChild : screen1.aboutTheChildren.count.party2WithAdultChild;
}

export const noOfChildrenForBenefits = (screen1: { aboutTheChildren: aboutYourChildrenState }, partyNum: 1 | 2, typeOfSplitting: ItypeOfSplitting): number => {
  if (typeOfSplitting === "HYBRID") {
    return noOfActualChildrenInHybrid(screen1, partyNum);
  } else {
    return partyNum === 1 ? screen1.aboutTheChildren.count.party1 : screen1.aboutTheChildren.count.party2;
  }
}

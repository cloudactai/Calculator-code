import { formatNumber } from "../../../utils/helpers/Formatting";
import {
  CHILD_AND_SPOUSAL_SUPPORT_CAL,
  CHILD_SUPPORT_CAL,
  CUSTODIAL_FORMULA,
  ONLY_CHILD,
  SPOUSAL_SUPPORT_CAL,
  WITHOUT_CHILD_FORMULA,
} from "../Calculator";

export const INDIPriorToSupport = (
  party1Income: number,
  party2Income: number,
  partyNum: number
) => {
  const totalIncome = party1Income + party2Income;

  let INDIPrior = (party1Income / totalIncome) * 100;

  if (partyNum === 2) {
    INDIPrior = 100 - INDIPrior;
  }

  return INDIPrior.toFixed(2);
};

export const conditionForOnlyChild = (
  reportType: string,
  calculatorType: string
) => {
  return (
    (reportType === ONLY_CHILD || reportType === CUSTODIAL_FORMULA) &&
    calculatorType === CHILD_SUPPORT_CAL
  );
};

export const conditionForWithoutChild = (
  reportType: string,
  calculatorType: string
) => {
  return (
    reportType === WITHOUT_CHILD_FORMULA &&
    (calculatorType === SPOUSAL_SUPPORT_CAL ||
      calculatorType === CHILD_AND_SPOUSAL_SUPPORT_CAL)
  );
};

export const conditionForCustodialFormula = (
  reportType: string,
  calculatorType: string
) => {
  // return (reportType === CUSTODIAL_FORMULA && (calculatorType === CHILD_AND_SPOUSAL_SUPPORT_CAL  || calculatorType === CHILD_SUPPORT_CAL)) || (reportType === ONLY_CHILD && calculatorType === CHILD_AND_SPOUSAL_SUPPORT_CAL);
  return (
    (reportType === CUSTODIAL_FORMULA &&
      (calculatorType === CHILD_AND_SPOUSAL_SUPPORT_CAL ||
        calculatorType === CHILD_SUPPORT_CAL)) ||
    (reportType === ONLY_CHILD &&
      calculatorType === CHILD_AND_SPOUSAL_SUPPORT_CAL)
  );
};

export const showElementForReportType = (
  calculator_type: string,
  type: string,
  Page: number | string,
  elem: string
) => {
  console.log("conidtinchildparent",type ,calculator_type )

  if (conditionForOnlyChild(type, calculator_type)) {
    console.log("conidtinchild",type ,calculator_type )
    return showElementForReportType0(Page, elem);
  }

  if (conditionForWithoutChild(type, calculator_type)) {
    console.log("conditionForWithoutChild",type ,calculator_type )

    return showElementForReportType1(Page, elem);
  }
  if (conditionForCustodialFormula(type, calculator_type)) {
    console.log("conditionForCustodialFormula",type ,calculator_type )

    return showElementForReportType2(Page, elem);
  }
};

export const wrapInBracketsIfNeg = (val: string) => {
  return Number(val) > 0 ? val : "(" + val + ")";
};

export interface Page {
  Page: boolean;
  currentPage: number;
}

export interface Page1 extends Page {
  party1Info: boolean;
  party2Info: boolean;
  childrenInfo: boolean;
  ImportantDatesTable: boolean;
  taxYear: boolean;
  aboutTheRelationshipValues: boolean;
  otherValues: boolean;
}

export interface Page2 extends Page {
  ChildSupportHeading: boolean;
  SpousalSupportHeading: boolean;
  LowValues: boolean;
  MedValues: boolean;
  HighValues: boolean;
  SpousalSupport: boolean;
  ChildSupport: boolean;
  ChildSupportSpecialExpenses: boolean;
}

export interface Page3 extends Page {
  childSupportHeading: boolean;
  childSupportTable: boolean;
  specialExpensesHeading: boolean;
  specialExpensesTable: boolean;
  lowValues: boolean;
  medValues: boolean;
  highValues: boolean;
}

export interface Page4 extends Page {
  SpousalSupportQuantumHeading: boolean;
  SpousalSupportQuantumTable: boolean;
  SpousalSupportDurationHeading: boolean;
  SpousalSupportDurationTable: boolean;
}

export interface Page5 extends Page {
  Page: boolean;
  lowValues: boolean;
  medValues: boolean;
  highValues: boolean;
  barGraph1: boolean;
  barGraph2: boolean;
  barGraph3: boolean;
}

export interface Page6 extends Page {}

export interface Page7 extends Page {}
export interface Page8 extends Page {}
export interface Page9 extends Page {}
export interface Page10 extends Page {}


export interface AllPagesElement {
  0: Page;
  1: Page1;
  2: Page2;
  3: Page3;
  4: Page4;
  5: Page5;
  6: Page6;
  7: Page7;
  8: Page8;
  9: Page9;
  10: Page10;

  otherDetails: {
    totalPages: number;
  };
}

const showElementForReportType0 = (Page: number | string, elem: string) => {
  const allElements: AllPagesElement = {
    0: {
      Page: true,
      currentPage: 0,
    },
    1: {
      Page: true,
      party1Info: true,
      party2Info: true,
      childrenInfo: true,
      ImportantDatesTable: true,
      taxYear: true,
      aboutTheRelationshipValues: false,
      otherValues: false,
      currentPage: 1,
    },
    2: {
      Page: true,
      ChildSupportHeading: true,
      SpousalSupportHeading: false,
      LowValues: true,
      MedValues: false,
      HighValues: false,
      SpousalSupport: false,
      ChildSupport: true,
      ChildSupportSpecialExpenses: true,
      currentPage: 2,
    },
    3: {
      Page: true,
      childSupportHeading: true,
      childSupportTable: true,
      specialExpensesHeading: true,
      specialExpensesTable: true,
      lowValues: true,
      medValues: true,
      highValues: true,
      currentPage: 3,
    },
    4: {
      Page: false,
      SpousalSupportQuantumHeading: false,
      SpousalSupportQuantumTable: false,
      SpousalSupportDurationHeading: false,
      SpousalSupportDurationTable: false,
      currentPage: 3,
    },
    5: {
      Page: true,
      lowValues: true,
      medValues: false,
      highValues: false,
      barGraph1: true,
      barGraph2: false,
      barGraph3: false,
      currentPage: 4,
    },
    6: {
      Page: true,
      currentPage: 5,
    },
    7: {
      Page: true,
      currentPage: 6,
    },
    8: {
      Page: true,
      currentPage: 7,
    },
    9: {
      Page: false,
      currentPage: 6,
    },
    10: {
      Page: true,
      currentPage: 5,
    },

    otherDetails: {
      totalPages: 9,
    },
  };

  if (Page in allElements) {
    const obj = allElements[Page];
    return obj[elem];
  }
};

const showElementForReportType1 = (Page: number | string, elem: string) => {
  const allElements: AllPagesElement = {
    0: {
      Page: true,
      currentPage: 0,
    },
    1: {
      Page: true,
      party1Info: true,
      party2Info: true,
      childrenInfo: false,
      ImportantDatesTable: true,
      taxYear: true,
      aboutTheRelationshipValues: true,
      otherValues: false,
      currentPage: 1,
    },
    2: {
      Page: true,
      SpousalSupport: true,
      ChildSupportHeading: false,
      SpousalSupportHeading: true,
      LowValues: true,
      MedValues: true,
      HighValues: true,
      ChildSupport: false,
      ChildSupportSpecialExpenses: false,
      currentPage: 2,
    },
    3: {
      Page: false,
      childSupportHeading: true,
      childSupportTable: true,
      specialExpensesHeading: true,
      specialExpensesTable: true,
      lowValues: true,
      medValues: true,
      highValues: true,
      currentPage: 3,
    },
    4: {
      Page: false,
      SpousalSupportQuantumHeading: false,
      SpousalSupportQuantumTable: false,
      SpousalSupportDurationHeading: false,
      SpousalSupportDurationTable: false,
      currentPage: 3,
    },
    8: {
      Page: true,
      currentPage: 7,
    },
    9: {
      Page: true,
      currentPage: 3,
    },
    5: {
      Page: true,
      lowValues: true,
      medValues: true,
      highValues: true,
      barGraph1: true,
      barGraph2: true,
      barGraph3: true,
      currentPage: 4,
    },
    6: {
      Page: true,
      currentPage: 5,
    },
    7: {
      Page: true,
      currentPage: 6,
    },
    otherDetails: {
      totalPages: 7,
    },
  };

  if (Page in allElements) {
    const obj = allElements[Page];
    return obj[elem];
  }
};

const showElementForReportType2 = (Page: number | string, elem: string) => {
  const allElements: AllPagesElement = {
    0: {
      Page: true,
      currentPage: 0,
    },
    1: {
      Page: true,
      party1Info: true,
      party2Info: true,
      childrenInfo: true,
      ImportantDatesTable: true,
      aboutTheRelationshipValues: true,
      taxYear: true,
      otherValues: true,
      currentPage: 1,
    },
    2: {
      Page: true,
      ChildSupportHeading: true,
      SpousalSupportHeading: true,
      LowValues: true,
      MedValues: true,
      HighValues: true,
      SpousalSupport: true,
      ChildSupport: true,
      ChildSupportSpecialExpenses: true,
      currentPage: 2,
    },
    3: {
      Page: true,
      childSupportHeading: true,
      childSupportTable: true,
      specialExpensesHeading: true,
      specialExpensesTable: true,
      lowValues: true,
      medValues: true,
      highValues: true,
      currentPage: 3,
    },
    4: {
      Page: true,
      SpousalSupportQuantumHeading: true,
      SpousalSupportQuantumTable: true,
      SpousalSupportDurationHeading: true,
      SpousalSupportDurationTable: true,
      currentPage: 4,
    },
    5: {
      Page: true,
      lowValues: true,
      medValues: true,
      highValues: true,
      barGraph1: true,
      barGraph2: true,
      barGraph3: true,
      currentPage: 5,
    },
    6: {
      Page: true,
      currentPage: 6,
    },
    7: {
      Page: true,
      currentPage: 7,
    },
    8: {
      Page: true,
      currentPage: 8,
    },
    9: {
      Page: true,
      currentPage: 9,
    },
    10: {
      Page: true,
      currentPage: 10,
    },
    otherDetails: {
      totalPages: 11,
    },
  };

  if (Page in allElements) {
    const obj = allElements[Page];
    return obj[elem];
  }
};

export const removeNegSignAndWrapInBrackets = (value: number) => {
  return value >= 0
    ? formatNumber(value)
    : "(" + formatNumber(Math.abs(value)) + ")";
};

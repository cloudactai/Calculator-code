import { IFixedValues, IncomeState, twoPartyStates } from "./screen2/Screen2";
import Cookies from "js-cookie";


export interface backgroundState {
  label: string;
  description: string;
  party1FirstName: string;
  party2FirstName: string;
  party1LastName: string;
  party2LastName: string;
  party1DateOfBirth: string;
  party2DateOfBirth: string;
  party1province: Province;
  party2province: Province;
  party1LiveInOntario: "Yes" | "No";
  party2LiveInOntario: "Yes" | "No";
  party1LiveInRural: "Yes" | "No";
  party2LiveInRural: "Yes" | "No";
  party1eligibleForDisability: "Yes" | "No";
  party2eligibleForDisability: "Yes" | "No";
  party1ExemptFromCanadaPension: "Yes" | "No";
  party2ExemptFromCanadaPension: "Yes" | "No";
  party1ExemptFromEmploymentPremium: "Yes" | "No";
  party2ExemptFromEmploymentPremium: "Yes" | "No";
}

export interface childInfo {
  name: string;
  dateOfBirth: number;
  custodyArrangement: string;
  childHasDisability: "No" | "Yes";
  childOfRelationship: "Yes" | "No";
  adultChildStillALegalDependant: "Yes" | "No";
  childIncome: number;
  CSGTable: "Yes" | "No";
  ChildSupportOverride: number;
  numberOfYearsOfStartingSchool: number;
  numberOfYearsOfFinishingSchool: number;
}

export interface calculatorScreen2State {
  income: IncomeState;
  benefits: IncomeState;
  deductions: IncomeState;
  specialExpensesArr: IncomeState;
  guidelineIncome: IncomeState;
  totalIncomeParty1: number;
  totalIncomeParty2: number;
  childSupport: {
    childSupport1: number;
    childSupport2: number;
    givenTo: string;
  };
  spousalSupport: {
    spousalSupport1Med: number;
    spousalSupport2Med: number;
    spousalSupport1Low: number;
    spousalSupport2Low: number;
    spousalSupport1High: number;
    spousalSupport2High: number;
    givenTo: string;
  };
  durationOfSupport: number[];
  specialExpenses: {
    specialExpensesLow1: number;
    specialExpensesLow2: number;
    specialExpensesMed1: number;
    specialExpensesMed2: number;
    specialExpensesHigh1: number;
    specialExpensesHigh2: number;
  };
  maximumChildLivesWith: number;
  childSupportReadOnly: twoPartyStates;
  canadaChildBenefitFixed: IFixedValues;
  provChildBenefitFixed: IFixedValues;
  GSTHSTBenefitFixed: IFixedValues;
  ClimateActionBenefitFixed: IFixedValues;
  salesTaxBenefitFixed: IFixedValues;
  basicPersonalAmountFederalFixed: IFixedValues;
  amountForEligibleDependentFixed: IFixedValues;
  baseCPPContributionFixed: IFixedValues;
  eiPremiumFixed: IFixedValues;
  canadaEmploymentAmountFixed: IFixedValues;
  basicPersonalAmountProvincialFixed: IFixedValues;
  amountForEligibleDependentProvincialFixed: IFixedValues;
  changeInTaxesAndBenefit: {
    changeInTaxesAndBenefitLow1: number;
    changeInTaxesAndBenefitLow2: number;
    changeInTaxesAndBenefitMed1: number;
    changeInTaxesAndBenefitMed2: number;
    changeInTaxesAndBenefitHigh1: number;
    changeInTaxesAndBenefitHigh2: number;
  };
}

export const getCalculatorIdFromQuery = (value: Object) => {
  const id = value.get("id");

  return id ? parseInt(id) : getCookieCalculatorId();
};

export const getCalculatorTypeFromQuery = (value: Object) => {
  const type = value.get("type");
  return type ? type.toString() : null;
};

export const getCookieCalculatorId = () => {
  let cookieData = Cookies.get("calculatorId");
  if (cookieData) {
    cookieData = JSON.parse(Cookies.get("calculatorId"));
  } else {
    cookieData = null;
  }

  return cookieData;
};

export const clearCookieForCalculatorLabel = () => {
  Cookies.set(
    "calculatorLabel",
    JSON.stringify({ label: "", description: "" }),
    { path: "/" }
  );
};

// =============== Report Constants ================
export const ONLY_CHILD = "ONLY_CHILD";
export const WITHOUT_CHILD_FORMULA = "WITHOUT_CHILD_FORMULA";
export const CUSTODIAL_FORMULA = "CUSTODIAL_FORMULA";

// =================== Calculator Type Constants ============
export const CHILD_SUPPORT_CAL = "CHILD_SUPPORT_CAL";
export const SPOUSAL_SUPPORT_CAL = "SPOUSAL_SUPPORT";
export const CHILD_AND_SPOUSAL_SUPPORT_CAL = "CHILD_AND_SPOUSAL_SUPPORT";

//PROVINCE TYPE
export type Province = "ON" | "BC" | "AB" | "";

export type ItypeOfSplitting = "SPLIT" | "SEPARATED" | "SHARED" | "HYBRID";

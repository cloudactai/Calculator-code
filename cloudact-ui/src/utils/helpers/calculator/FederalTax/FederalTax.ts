import { findRateForFederalTax } from "../../../../pages/calculator/screen2/Screen2";
import { formulaForFedTax } from "../taxCalculationFormula";

interface FederalTaxON {
  taxableIncome: number;
  fetchedFederalValuesDB: Object[];
  paramsForCalculatingAllCredits: (partyNum: 1 | 2) => void;
  setMaxVal: boolean;
}

const determineFederalTaxON = (data: FederalTaxON): number => {
  const {
    fetchedFederalValuesDB,
    taxableIncome,
    paramsForCalculatingAllCredits,
  } = data;

  const rateBasicValues = findRateForFederalTax(
    fetchedFederalValuesDB,
    taxableIncome
  )[0];

  // console.log("&& fed log 1", {
  //   taxableIncome,
  //   rateBasicValues,
  //   paramsForCalculatingAllCredits: paramsForCalculatingAllCredits,
  //   val: formulaForFedTax(
  //     { ...rateBasicValues, ...paramsForCalculatingAllCredits },
  //     taxableIncome
  //   ),
  // });

  return formulaForFedTax(
    { ...rateBasicValues, ...paramsForCalculatingAllCredits },
    taxableIncome
  );
};

interface FederalTaxBC {
  taxableIncome: number;
  fetchedFederalValuesDB: Object[];
  totalFederalCredits: number;
}

const determineFederalTaxForAllProv = (data: FederalTaxBC) => {
  const { fetchedFederalValuesDB, taxableIncome } = data;

  const rateBasicValues = findRateForFederalTax(
    fetchedFederalValuesDB,
    taxableIncome
  )[0];

  // =(F15-K22)*J22+I22
  const federalTaxOnIncomeLine =
    (taxableIncome - rateBasicValues?.Income_over) * rateBasicValues?.Rate +
    rateBasicValues?.Basic;

  // // =-F25*15%
  const effectOfTaxCredits: number = -Math.abs(data.totalFederalCredits * 0.15);

  const val: number = federalTaxOnIncomeLine + effectOfTaxCredits;

  return val;
};

const determineFederalTaxAB = () => {};

export {
  determineFederalTaxON,
  determineFederalTaxAB,
  determineFederalTaxForAllProv,
};

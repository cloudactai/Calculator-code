import {
  aboutYourChildrenState,
  aboutTheRelationshipState,
} from "./../../../../pages/calculator/screen1/Screen1";
import { backgroundState } from "../../../../pages/calculator/Calculator";
import { findRateForFederalTax } from "../../../../pages/calculator/screen2/Screen2";
import { allInfo } from "../creditTaxCalculationFormulas";
import { formulaForProvTax } from "../taxCalculationFormula";
import store from "../../../../store";

interface ProvTax {
  fetchedHealthTaxDB: Object[];
  taxBrackets: Object[];
  taxableIncome: number;
  provincialCredits: number;
  screen1: {
    background: backgroundState;
    aboutTheChildren: aboutYourChildrenState;
    aboutTheRelationship: aboutTheRelationshipState;
  };
  employedIncome: number;
}

export const determineProvTaxON = (obj: ProvTax): number => {
  const {
    taxableIncome,
    fetchedHealthTaxDB,
    taxBrackets,
    provincialCredits,
    screen1,
    employedIncome,
  } = obj;

  const rateBasicValuesForProv = findRateForFederalTax(
    taxBrackets,
    taxableIncome
  )[0];

  const rateBasicValuesForHealth = findRateForFederalTax(
    fetchedHealthTaxDB,
    taxableIncome
  )[0];

  const rates = {
    rateBasicValuesForProv,
    rateBasicValuesForHealth,
  };

  const provTax = formulaForProvTax(
    {
      ...rates,
      provincialCredits,
      employedIncome,
      screen1,
    },
    taxableIncome
  );

  console.log("&& prov Tax logs 2", {
    provTax,
    rates,
    taxableIncome,
    fetchedHealthTaxDB,
    taxBrackets,
    provincialCredits,
  });

  return provTax;
};

interface IProvTaxBC {
  taxableIncome: number;
  provincialCredits: number;
  fetchedProvincialTaxDB: Object[];
  fetchedHealthTaxDB: Object[];
}

export const determineProvTaxBC = (data: IProvTaxBC) => {
  // =481+MAX((F15-21418)*0.0356,0)
  const {
    TaxReductionBase,
    TaxReductionThresholdCalc,
    TaxReductionThresholdEligibility,
  } = store.getState().dynamicValues.data;
  const rateBasicValuesForProv = findRateForFederalTax(
    data.fetchedProvincialTaxDB,
    data.taxableIncome
  )[0];

  // const rateBasicValuesForHealth = findRateForFederalTax(
  //   data.fetchedHealthTaxDB,
  //   data.taxableIncome
  // )[0];

  const taxReductionCalc =
    TaxReductionBase +
    Math.max((data.taxableIncome - TaxReductionThresholdCalc) * 0.0356, 0);
  // =IF(F15>=34929,0,I46)
  const BCTaxReduction =
    data.taxableIncome >= TaxReductionThresholdEligibility
      ? 0
      : taxReductionCalc;
  const BCTaxOnIncome = Math.max(
    rateBasicValuesForProv?.Basic +
      (data.taxableIncome - rateBasicValuesForProv?.Income_over) *
        rateBasicValuesForProv?.Rate
  );
  const EffectOfTaxCredits = -Math.abs(data.provincialCredits * 0.0506);

  const val = Math.max(BCTaxOnIncome + EffectOfTaxCredits - BCTaxReduction, 0);

  // console.log("Prov Tax BC", {
  //   rateBasicValuesForHealth,
  //   rateBasicValuesForProv,
  //   taxReductionCalc,
  //   data,
  //   BCTaxOnIncome,
  //   BCTaxReduction,
  //   EffectOfTaxCredits,
  //   val
  // });

  return val;
};

export interface IProvincialTaxAB {
  taxableIncome: number;
  fetchedHealthTaxDB: Array<any>;
  provincialCredits: number;
  taxBrackets: Array<any>;
}

export const determineProvTaxAB = (obj: IProvincialTaxAB): number => {
  let taxReduction = 0;
  let result = 0;


  console.log("innertaxprovtaxfile case 4",obj?.taxableIncome)


  if (obj?.taxBrackets?.length > 0) {
    const findTaxBracket = findRateForFederalTax(
      obj.taxBrackets,
      Math.max(obj.taxableIncome,0)
    )[0];

    console.log("findTaxBracket",findTaxBracket)

    // console.log("innertaxprovtaxfile case 1",findTaxBracket?.Basic)
    // console.log("innertaxprovtaxfile case 2",(obj.taxableIncome - findTaxBracket?.Income_over))
    // console.log("innertaxprovtaxfile case 3",findTaxBracket?.Rate)


    //basic, income_over and rate from DB and taxable Income from screen2.
    const taxOnIncome = Math.max(
      findTaxBracket?.Basic +
        (obj.taxableIncome - findTaxBracket?.Income_over) *
          findTaxBracket?.Rate,
      0
    );

   


    //total federal Credits * 10%;
    const effectOfTaxCredits = obj.provincialCredits * 0.1;

    if (obj.taxableIncome < 34929) {
    }
   


    //effect of tax credits should be minused..
    result = Math.max(taxOnIncome - effectOfTaxCredits - taxReduction, 0);
  }
  // return Number(result);
  console.log("determineProvTaxABreuslt",result)
  return result;

};

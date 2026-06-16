import {
  baseCPPContribution,
  dynamicValues,
  EIPremiums,
} from "../../../../utils/helpers/calculator/creditTaxCalculationFormulas";
import { determineFederalTaxON } from "../../../../utils/helpers/calculator/FederalTax/FederalTax";
import { determineProvTaxON } from "../../../../utils/helpers/calculator/ProvincialTax/provincialTax";
import {
  formulaEnhancedCPPdeduction,
  formulaForProvincialCredits,
} from "../../../../utils/helpers/calculator/taxCalculationFormula";
import { CanadaWorkersBenefitFormula } from "../../../../utils/helpers/calculator/WorkersBenefit/workersBenefits";
import { Province } from "../../Calculator";
import { aboutYourChildrenState } from "../../screen1/Screen1";

interface ICPPForEmployed {
  employedIncome: number;
  dynamicValues: dynamicValues;
  selfEmployedIncome: number;
}

const CPPForEmployed = (data: ICPPForEmployed) => {
   console.log(`cpp employed ${data.employedIncome}`, {
    eiPremiums: EIPremiums({
      employedIncome: data.employedIncome,
      dynamicValues: data.dynamicValues,
    }),
    baseCPPContribution: baseCPPContribution({
      employedIncome: data.employedIncome,
      selfEmployedIncome: data.selfEmployedIncome,
      dynamicValues: data.dynamicValues,
    }),
    enhancedCPP: formulaEnhancedCPPdeduction({
      employedIncome: data.employedIncome,
      selfEmployedIncome: data.selfEmployedIncome,
      data: data.dynamicValues,
    }),
  });
  return (
    EIPremiums({
      employedIncome: data.employedIncome,
      dynamicValues: data.dynamicValues,
    }) +
    baseCPPContribution({
      employedIncome: data.employedIncome,
      selfEmployedIncome: data.selfEmployedIncome,
      dynamicValues: data.dynamicValues,
    }) +
    formulaEnhancedCPPdeduction({
      employedIncome: data.employedIncome,
      selfEmployedIncome: data.selfEmployedIncome,
      data: data.dynamicValues,
    })
  );
};

const CPPForSelfEmployed = (data: ICPPForEmployed) => {
  if (data.selfEmployedIncome > 0) {
    return CPPForEmployed(data);
  }
  return 0;
};

export const calculateTaxesParty = (
  data: {
    federalTaxParams: {
      fetchedFederalValuesDB: Object[];
      taxableIncome: number;
      paramsForCalculatingAllCredits: Object;
    };
    ontarioTaxParams: {
      fetchedProvincialTaxDB: Object[];
      fetchedHealthTaxDB: Object[];
      taxableIncome: number;
      getParamsForCalculatingAllCredits: Object;
    };
    CPPForEmployed: ICPPForEmployed;
    CPPForSelfEmployed: ICPPForEmployed;
    provincialCreditsParams: {
      childCareExpenses: number;
      taxableAmountAfterSupport: number;
      rates: Object[];
    };
    aboutTheChildren: aboutYourChildrenState;
    provinceParty1: Province;
    provinceParty2: Province;
  },
  dynamicValues: dynamicValues
) => {
  if (data.provinceParty1 === "ON") {
    // console.log(
    //   `Our main calculation &${data.federalTaxParams.taxableIncome}`,
    //   data,
    //   {
    //     federalTax: determineFederalTaxON(data.federalTaxParams),
    //     ontarioTax: determineProvTaxON(data.ontarioTaxParams),
    //     provincialCredits: formulaForProvincialCredits(
    //       data.provincialCreditsParams
    //     ),
    //     CPPForEmployed: CPPForEmployed(data.CPPForEmployed),
    //     CPPForSelfEmployed: CPPForSelfEmployed(data.CPPForSelfEmployed),
    //     canadaWorkersBenefit: CanadaWorkersBenefitFormula({ partyNum: 1, taxableIncome: data.federalTaxParams.taxableIncome, aboutTheChildren: data.aboutTheChildren, totalIncome: data.CPPForEmployed.employedIncome })
    //   }
    // );

    return (
      determineFederalTaxON(data.federalTaxParams) +
      determineProvTaxON(data.ontarioTaxParams) +
      formulaForProvincialCredits(
        data.provincialCreditsParams,
        dynamicValues.year
      ) +
      CPPForSelfEmployed(data.CPPForSelfEmployed) +
      CPPForEmployed(data.CPPForEmployed) -
      CanadaWorkersBenefitFormula(
        {
          partyNum: 1,
          taxableIncome: data.federalTaxParams.taxableIncome,
          aboutTheChildren: data.aboutTheChildren,
          totalIncome: data.CPPForEmployed.employedIncome,
        },
        dynamicValues,
        "ON"
      )
    );
  }
};

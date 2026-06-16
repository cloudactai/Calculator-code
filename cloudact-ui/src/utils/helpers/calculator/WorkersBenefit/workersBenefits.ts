import { aboutYourChildrenState } from "../../../../pages/calculator/screen1/Screen1";
import { dynamicValues } from "../creditTaxCalculationFormulas";

interface ICanadaWorkersBenefit {
  taxableIncome: number;
  aboutTheChildren: aboutYourChildrenState;
  partyNum: 1 | 2;
  totalIncome: number;
  background : {
    party1eligibleForDisability : "Yes" | "No" ,
    party2eligibleForDisability : "Yes" | "No"
  };
}

export const CanadaWorkersBenefitFormula = (
  data: ICanadaWorkersBenefit,
  dynamicValues: dynamicValues,
  province: String
) => {
  let res = 0;
  let reduction = 0;



  let NumChildren =
    data.partyNum === 1
      ? data.aboutTheChildren.count.party1
      : data.aboutTheChildren.count.party2;

    console.log("workerBenefits number of child",NumChildren)  

  let basicMinVal =
    NumChildren > 0
      ? province === "AB"
        ? dynamicValues["ABWorkerBenefitFamMax"]
        : dynamicValues["CAWorkerBenefitFamMax"]
      : province === "AB"
      ? dynamicValues["ABWorkerBenefitSingleMax"]
      : dynamicValues["CAWorkerBenefitSingleMax"];



  let basic = Math.min(
    (data.totalIncome - 3000) *
      (province === "AB" ? dynamicValues["ABWorkerBenefitPercentage"]! : 0.27),
    basicMinVal!
  );




  if (NumChildren === 0) {
    reduction = Math.max(
      (data.taxableIncome -
        (province === "AB"
          ? dynamicValues["ABWorkerBenefitSingleThreshold"]!
          : dynamicValues["CAWorkerBenefitSingleThreshold"])) *
        0.15,
      0
    );
  } else if (NumChildren > 0) {
    reduction = Math.max(
      (data.taxableIncome -
        (province === "AB"
          ? dynamicValues["ABWorkerBenefitFamThreshold"]!
          : dynamicValues["CAWorkerBenefitFamThreshold"])) *
        0.15,
      0
    );
  }

  res = Math.max(basic - reduction, 0);
  
  if( data.partyNum == 1 && data?.background?.party1eligibleForDisability == "Yes" 
   ){
    let  Calculate_Reduction = 0 ;
    let CalculateBase = Math.min(
      (data.totalIncome - dynamicValues.CAWorkerBenefitDisabBaseThreshold) 
    * dynamicValues.CAWorkerBenefitDisabBasePercent,
     dynamicValues.CAWorkerBenefitDisabBase);
    
     if (NumChildren === 0) { 
      Calculate_Reduction = Math.max( 
        ( data.taxableIncome  - dynamicValues.CAWorkerBenefitDisabRedThresholdSingle) 
         * dynamicValues.CAWorkerBenefitDisabRedRateSingle  ,0)

     }else if(NumChildren > 0){
      Calculate_Reduction = Math.max( 
        ( data.taxableIncome  - dynamicValues.CAWorkerBenefitDisabRedThresholdFamily) 
         * dynamicValues.CAWorkerBenefitDisabRedRateFamily  ,0)
     }
  
 
    let finalresult = CalculateBase - Calculate_Reduction;
 
    if(finalresult > 0) {
      res = res 
      + finalresult
    }

  }

  if(data.partyNum == 2 && data?.background?.party2eligibleForDisability == "Yes"){
    let Calculate_Reduction = 0;
    let CalculateBase = Math.min(
      (data.totalIncome - dynamicValues.CAWorkerBenefitDisabBaseThreshold) 
    * dynamicValues.CAWorkerBenefitDisabBasePercent,
     dynamicValues.CAWorkerBenefitDisabBase);

     if (NumChildren === 0) { 
      Calculate_Reduction = Math.max( 
        ( data.taxableIncome  - dynamicValues.CAWorkerBenefitDisabRedThresholdSingle) 
         * dynamicValues.CAWorkerBenefitDisabRedRateSingle  ,0)

     }else if(NumChildren > 0){
       Calculate_Reduction = Math.max( 
        ( data.taxableIncome  - dynamicValues.CAWorkerBenefitDisabRedThresholdFamily) 
         * dynamicValues.CAWorkerBenefitDisabRedRateFamily  ,0)
     }
    let finalresult = CalculateBase - Calculate_Reduction
  
    if(finalresult > 0) {
      
      res = res 
      + finalresult
    }
  }

  return res;
};


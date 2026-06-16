import { backgroundState } from "../../../pages/calculator/Calculator";
import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../../../pages/calculator/screen1/Screen1";
import store from "../../../store";

const basicPersonalAmountFederalFormula = (data: allInfo) => {
  // if income < 151978
  //13808

  //else if income > 216511
  //12421

  //else income < 151978 && income > 216511
  //calculation

  if (data.totalIncome <= 151978) {
    return data.dynamicValues.BasicPersonalAmountFed;
  } else if (data.totalIncome > 151978 && data.totalIncome <= 216510) {
    let val = 0;
    val =
      12421 + (1387 - 1387 * (Math.max(data.totalIncome - 151978, 0) / 64533));

    return Math.max(val, data.dynamicValues.BasicPersonalAmountFed);
  } else {
    //use DB
    return 12421;
  }
};

const basicDisabilityAmountFormula = (data: allInfo) => {
  console.log("datafordisabiltyfrom db", data?.dynamicValues)

  let amount = data?.dynamicValues?.DisabilityAmount

  return amount

}

const basicDisabilityAmountFormulaProv = (data: allInfo) => {
  let amount = data?.dynamicValues?.DisabilityProvAmount

  return amount
}


const basicPersonalAmountOntario = (data: allInfo): number => {
  return data.dynamicValues.BasicPersonalAmount;
};

interface basicPersonalAmountFederalType {
  totalIncome: number;
}

interface ageAmount extends basicPersonalAmountFederalType {
  ageForPerson: number;
}

export interface dynamicValues {
  ABClimateActionBase?: number;
  ABClimateActionChildUnder19?: number;
  ABClimateActionChildFirstChild?: number;
  ABWorkerBenefitFamMax?: number;
  ABWorkerBenefitSingleMax?: number;
  ABWorkerBenefitSingleThreshold?: number;
  ABWorkerBenefitFamThreshold?: number;
  ABWorkerBenefitPercentage?: number;
  AmountForEligibleDependentFed: number;
  AmountForEligibleDependent?: number;
  AmountForEligibleDependentOntario?: number;
  BasicPersonalAmount?: number;
  BaseCPPLimit?: number;
  BasicPersonalAmountFed: number;
  BasicPersonalAmountOntario?: number;
  CanadaEmploymentAmountLimit: number;
  EILimit: number;
  EnhancedCPPDeductionLimit: number;
  EnhancedCPPDeductionRate: number;
  SelfEmployedEnhCPPRate: number;
  SelfEmployedEnhCPPThreshold: number;
  ChildBenefitThresholdofBase: number;
  ChildBenefitThresholdofWorking: number;
  ChildBenefitWorking1ChildAmt: number;
  ChildBenefitWorking2ChildAmt: number;
  ChildBenefitWorking3ChildAmt: number;
  ChildBenefitWorking4ChildAmt: number;
  ChildBenefitBase3ChildAmt: number;
  ChildBenefitBase4ChildAmt: number;
  ChildBenefitBase1ChildAmt: number;
  ChildBenefitBase2ChildAmt: number;
  ChildBenefitBaseAddlChildAmt: number;
  ChildBenefitThreshold1ChildAmt: number;
  ChildBenefitThreshold2ChildAmt: number;
  ChildBenefitThresholdAddlChildAmt: number;
  ChildBenefitBasic: number;
  ChildBenefitDeduction: number;
  ChildBenefitBaseAmountLess6: number;
  ChildBenefitBaseAmountMore6: number;
  CAChildBenefitBase4Child: number;
  CAChildBenefitBase1Child: number;
  CAChildBenefitBase2Child: number;
  CAChildBenefitBase3Child: number;
  CAChildBenefitReduHighThreshold: number;
  CAChildBenefitReduLowerThreshold: number;
  CAWorkerBenefitFamMax: number;
  CAWorkerBenefitSingleMax: number;
  CAWorkerBenefitFamThreshold: number;
  CAWorkerBenefitSingleThreshold: number;
  EIRate: number;
  AgeAmtBase: number;
  AgeAmtLowerThreshold: number;
  GSTBaseCredit: number;
  GSTDependentCredit: number;
  GSTBaseAmount: number;
  BCChildBenefitLowerThreshold: number;
  BCClimateActionBasic: number;
  BCClimateActionAddl: number;
  BCClimateActionSingleThreshold: number;
  BCClimateActionFamilyThreshold: number;
  TaxReductionBase: number;
  TaxReductionThresholdCalc: number;
  TaxReductionThresholdEligibility: number;
  ONSurtaxThreshold1: number;
  ONSurtaxThreshold2: number;
  ONTaxReductionBase: number;
  ONTaxReductionDep: number;
  ONLIFTAmount: number;
  ONLIFTIndividual: number;
  ONLIFTReductionRate: number;
  ONSalesTaxBase: number;
  ONSalesTaxThresholdFamily: number;
  ONSalesTaxThresholdSingle: number;
  ONClimateActionBase: number;
  ONClimateActionChildUnder19: number;
  ONClimateActionChildFirstChild: number;
  year: number;
  province: string;
  CPP2MaxAmt: number;
  CPP2MaxPenEarning: number;
  CPP2PenEarning: number;
  CPP2Rate: number;
}

export interface allInfo extends ageAmount {
  screen1: {
    background: backgroundState;
    aboutTheChildren: aboutYourChildrenState;
    aboutTheRelationship: aboutTheRelationshipState;
  };
  childSupport: {
    party1: number;
    party2: number;
  };
  dynamicValues: dynamicValues;
  partyNum: number;
  selfEmployedIncome: number;
  taxableIncome: number;
  employedIncome: number;
  bothIncomes: {
    party1: number;
    party2: number;
  };
}

const ageAmountFormula = (data: allInfo) => {
  //  =IF(F1>=65,MAX(7713-MAX((F14-38893),0)*0.15,0),0)
  const { AgeAmtBase, AgeAmtLowerThreshold } =
    store.getState().dynamicValues.data;

  if (data.ageForPerson >= 65) {
    return Math.max(
      AgeAmtBase -
      Math.max(data.taxableIncome - AgeAmtLowerThreshold, 0) * 0.15,
      0
    );
  } else {
    return 0;
  }
};

const maximumChildLivesWith = (data: allInfo) => {
  const numberOfChildrenWithParty1 = data.screen1.aboutTheChildren.count.party1;
  const numberOfChildrenWithParty2 = data.screen1.aboutTheChildren.count.party2;
  const numberOfChildrenWithShared = data.screen1.aboutTheChildren.count.shared;

  //if age of child is >= 18. then NoofChildren will be one minused.
  const totalNumberOfChildren = Number(
    data.screen1.aboutTheChildren.numberOfChildren
  );

  if (totalNumberOfChildren === 0) {
    return 0;
  } else if (
    (numberOfChildrenWithParty1 > 0 || numberOfChildrenWithParty2 > 0) &&
    numberOfChildrenWithShared > 0
  ) {
    if (numberOfChildrenWithParty1 > numberOfChildrenWithParty2) {
      return 1;
    } else {
      return 2;
    }
  } else {
    //shared case
    if (totalNumberOfChildren === numberOfChildrenWithShared) {
      if (data.childSupport.party1 > data.childSupport.party2) {
        return 2;
      } else if (data.childSupport.party2 > data.childSupport.party1) {
        return 1;
      }

      if (data.bothIncomes.party1 > data.bothIncomes.party2) {
        return 2;
      } else if (data.bothIncomes.party2 > data.bothIncomes.party1) {
        return 1;
      } else {
        return 0;
      }
    }
    //hybrid case
    // else if ((numberOfChildrenWithParty1 > 0 || numberOfChildrenWithParty2 > 0) && numberOfChildrenWithShared > 0) {
    //   if (numberOfChildrenWithParty1 > 0 && data.partyNum === 1) {
    //     return 1;
    //   } else if (numberOfChildrenWithParty2 > 0 && data.partyNum === 2) {
    //     return 2;
    //   }
    // }

    //majority parenting case
    else if (numberOfChildrenWithParty1 > 0 && data.partyNum === 1) {
      return 1;
    } else if (numberOfChildrenWithParty2 > 0 && data.partyNum === 2) {
      return 2;
    } else if (
      numberOfChildrenWithParty1 === numberOfChildrenWithParty2 ||
      (numberOfChildrenWithParty1 > 0 && numberOfChildrenWithParty2 > 0)
    ) {
      return 4;
    }
  }
};

const whichPartyGetsAmountForEligibleDependent = (data: allInfo) => {
  return maximumChildLivesWith(data);
};

const amountForEligibleDependentOntario = (data: allInfo): number => {
  const result = whichPartyGetsAmountForEligibleDependent(data);

  if (data.partyNum === 1 && result === 1) {
    return data.dynamicValues.AmountForEligibleDependent;
  } else if (data.partyNum === 2 && result === 2) {
    return data.dynamicValues.AmountForEligibleDependent;
  } else if (result === 4) {
    return data.dynamicValues.AmountForEligibleDependent;
  } else {
    return 0;
  }
};

const amountForEligibleDependent = (data: allInfo) => {
  const result = whichPartyGetsAmountForEligibleDependent(data);

  if (data.partyNum === 1 && result === 1) {
    return basicPersonalAmountFederalFormula(data);
  } else if (data.partyNum === 2 && result === 2) {
    return basicPersonalAmountFederalFormula(data);
  } else if (result === 4) {
    return basicPersonalAmountFederalFormula(data);
  } else {
    return 0;
  }
};

//passing only employed Income 10100 to it.
const baseCPPContribution = (data: {
  selfEmployedIncome: number;
  employedIncome: number;
  dynamicValues: dynamicValues;
}) => {
  // =MAX(MIN(((SUM(F4:F5)-3500)*0.0495),2875.95),0)
  const total = Math.max(
    Math.min(
      (data.selfEmployedIncome + data.employedIncome - 3500) * 0.0495,
      data.dynamicValues.BaseCPPLimit
    ),
    0
  );

  return total;
};

const EIPremiums = (data: {
  employedIncome: number;
  dynamicValues: dynamicValues;
}) => {
  // =MIN(F4*0.0158,889.54)
  const total = Math.min(
    data.employedIncome * data.dynamicValues.EIRate,
    data.dynamicValues.EILimit
  );
  // console.log("logs EI Premiums", total);
  return total;
};

const canadaEmploymentAmount = (data: allInfo) => {
  // =IF(F4>0,MIN(1257,F4),0)
  if (data.employedIncome > 0) {
    return Math.min(
      data.dynamicValues.CanadaEmploymentAmountLimit,
      data.employedIncome
    );
  } else {
    return 0;
  }
};

const totalFederalCredits = (data: allInfo): number => {
  return Number(
    basicPersonalAmountFederalFormula(data) +
    ageAmountFormula(data) +
    amountForEligibleDependent(data) +
    baseCPPContribution(data) +
    EIPremiums(data) +
    canadaEmploymentAmount(data)
  );
};

const totalOntarioCredits = (data: allInfo) => {
  // =SUM(F22:F23)+IF(F1>=65,MAX(5312-(F14-39546)*0.15,0),0)+F19+F20
  let result: number = 0;
  result +=
    basicPersonalAmountOntario(data) + amountForEligibleDependentOntario(data);

  if (data.ageForPerson >= 65) {
    result += Math.max(5312 - (data.taxableIncome - 39546) * 0.15, 0);
  }

  result += baseCPPContribution(data) + EIPremiums(data);

  return result;
};

export interface calculateAllCreditsInterface {
  basicPersonalAmountFederal: number;
  ageAmount: number;
  amountForEligibleDependent: number;
  baseCPPContribution: number;
  EIPremiums: number;
  canadaEmploymentAmount: number;
  amountForEligibleDependentOntario: number;
  basicPersonalAmountOntario: number;
  totalFederalCredits: number;
  totalOntarioCredits: number;
  otherFederalCredits?: number;
  otherOntarioCredits?: number;
}

export {
  canadaEmploymentAmount,
  basicPersonalAmountOntario,
  basicPersonalAmountFederalFormula,
  EIPremiums,
  maximumChildLivesWith,
  ageAmountFormula,
  whichPartyGetsAmountForEligibleDependent,
  baseCPPContribution,
  amountForEligibleDependent,
  amountForEligibleDependentOntario,
  totalFederalCredits,
  totalOntarioCredits,
  basicDisabilityAmountFormula,
  basicDisabilityAmountFormulaProv
};

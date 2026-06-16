import store from "../../../store";
import { ItypeOfSplitting } from "../Calculator";
import {
  aboutYourChildrenState,
  aboutTheRelationshipState,
} from "./../screen1/Screen1";
import {
  noOfChildrenForBenefits,
  noOfSharedChildrenInHybrid,
  twoPartyStates,
} from "./restructure/Restructuring";

export const climateActionIncentiveBC = (
  aboutTheChildren: aboutYourChildrenState,
  incomes: twoPartyStates,
  taxableIncome: twoPartyStates,
  typeOfSplitting: ItypeOfSplitting,
  partyNum: 1 | 2
): number => {
  const {
    BCClimateActionBasic,
    BCClimateActionAddl,
    BCClimateActionSingleThreshold,
    BCClimateActionFamilyThreshold,
    BCClimateActionFirstChild,
  } = store.getState().dynamicValues.data;
  let noOfChildren =
    partyNum === 1
      ? aboutTheChildren.count.party1
      : aboutTheChildren.count.party2;
  let base = BCClimateActionBasic;

  let taxedIncome =
    partyNum === 1 ? taxableIncome.party1 : taxableIncome.party2;

  let singleReduction =
    noOfChildren < 1
      ? Math.max((taxedIncome - BCClimateActionSingleThreshold) * 0.02, 0)
      : 0;
  let familyReduction =
    noOfChildren > 0
      ? Math.max((taxedIncome - BCClimateActionFamilyThreshold) * 0.02, 0)
      : 0;

  for (let i = 1; i <= noOfChildren; i++) {
    if (i === 1) {
      base += BCClimateActionFirstChild;
    } else {
      base += BCClimateActionAddl;
    }
  }

  const val = Math.max(base - (singleReduction + familyReduction), 0);

  console.log("all climate Action", {
    base,
    val,
    singleReduction,
    familyReduction,
    noOfChildren,
  });

  if (typeOfSplitting === "SHARED") {
    if (partyNum === 1) {
      if (incomes.party1 > incomes.party2) {
        return 0;
      } else {
        return val / 2;
      }
    } else {
      if (incomes.party1 < incomes.party2) {
        return 0;
      } else {
        return val / 2;
      }
    }
  }

  return val;
};

export const climateActionIncentiveON = (
  screen1: any,
  typeOfSplitting: ItypeOfSplitting,
  partyNum: 1 | 2
): number => {
  const {
    ONClimateActionBase,
    ONClimateActionChildUnder19,
    ONClimateActionChildFirstChild,
  } = store.getState().dynamicValues.data;
  //for Individual
  let sum = ONClimateActionBase;
  let noOfChildren =
    partyNum === 1
      ? noOfChildrenForBenefits(screen1, 1, typeOfSplitting)
      : noOfChildrenForBenefits(screen1, 2, typeOfSplitting);
  let sharedChildren =
    partyNum === 1
      ? noOfSharedChildrenInHybrid(screen1, 1)
      : noOfSharedChildrenInHybrid(screen1, 2);

  // let perChildUnder19 = aboutTheChildren.childrenInfo.map((child) => momentFunction.differenceBetweenNowAndThen(child.dateOfBirth) < 19)

  //first child in single parent family
  // console.log("&&&&&&", { typeOfSplitting,noOfChildren,sharedChildren } );
  if (typeOfSplitting === "HYBRID") {
    if (noOfChildren > 0) {
      sum += 0;
    } else if (noOfChildren === 0 && sharedChildren > 0) {
      sum += ONClimateActionChildFirstChild / 2;
    }
  }

  if (noOfChildren > 0) {
    if (noOfChildren >= 1) {
      if (typeOfSplitting === "SHARED") {
        sum += ONClimateActionChildFirstChild / 2;
      } else {
        sum += ONClimateActionChildFirstChild;
      }
    }
  }

  //per child under 19
  if (typeOfSplitting === "SHARED") {
    sum += Math.max(
      ((noOfChildren + sharedChildren - 1) * ONClimateActionChildUnder19) / 2,
      0
    );
  } else {
    sum += Math.max(
      (noOfChildren + sharedChildren - 1) * ONClimateActionChildUnder19,
      0
    );
  }
  // console.log("&&&&1", { sum } );
  return sum;
};

export const climateActionIncentiveAB = (
  screen1: any,
  typeOfSplitting: ItypeOfSplitting,
  partyNum: 1 | 2
): number => {
  const {
    ABClimateActionBase,
    ABClimateActionChildUnder19,
    ABClimateActionChildFirstChild,
  } = store.getState().dynamicValues.data;
  //for Individual
  let sum = ABClimateActionBase;
  let noOfChildren =
    partyNum === 1
      ? noOfChildrenForBenefits(screen1, 1, typeOfSplitting)
      : noOfChildrenForBenefits(screen1, 2, typeOfSplitting);
  let sharedChildren =
    partyNum === 1
      ? noOfSharedChildrenInHybrid(screen1, 1)
      : noOfSharedChildrenInHybrid(screen1, 2);

  // let perChildUnder19 = aboutTheChildren.childrenInfo.map((child) => momentFunction.differenceBetweenNowAndThen(child.dateOfBirth) < 19)

  //first child in single parent family
  // console.log("&&&&&&", { typeOfSplitting,noOfChildren,sharedChildren } );
  if (typeOfSplitting === "HYBRID") {
    if (noOfChildren > 0) {
      sum += 0;
    } else if (noOfChildren === 0 && sharedChildren > 0) {
      sum += ABClimateActionChildFirstChild / 2;
    }
  }

  if (noOfChildren > 0) {
    if (noOfChildren >= 1) {
      if (typeOfSplitting === "SHARED") {
        sum += ABClimateActionChildFirstChild / 2;
      } else {
        sum += ABClimateActionChildFirstChild;
      }
    }
  }

  //per child under 19
  if (typeOfSplitting === "SHARED") {
    sum += Math.max(
      ((noOfChildren + sharedChildren - 1) * ABClimateActionChildUnder19) / 2,
      0
    );
  } else {
    sum += Math.max(
      (noOfChildren + sharedChildren - 1) * ABClimateActionChildUnder19,
      0
    );
  }
  // console.log("&&&&1", { sum } );
  return sum;
};

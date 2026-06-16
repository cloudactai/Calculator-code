import { totalNumberOfChildren } from "../screen2/Screen2";
import { apiCalculatorById } from "../../../utils/Apis/calculator/Calculator_values_id";
import { getBodyStatusCode } from "../../../utils/helpers";
import { ItypeOfSplitting } from "../Calculator";

export interface supportObject {
  spousalSupport: number,
  childSupport: number,
  childSpecialExpense: number,
  totalSupport: number,
  spousalSupportGivenTo: string,
  childSupportGivenTo: string,
  childSupportSpecialExpenses: number,
}

export interface supportQuantum {
  support1: supportObject,
  support2: supportObject,
  support3: supportObject,
  spousalSupportDurationRange: string,
  loading: boolean,
  supportGivenTo: string,
}

interface NUMCHILDREN {
  party1: number,
  party2: number,
  shared: number,
  party1WithAdultChild: number,
  party2WithAdultChild: number,
  sharedWithAdultChild: number,
}


export const getNumberOfChildrenWithParty2 = (numChildren: NUMCHILDREN) => {
  //the num children gets changed in case of split child. E.g husband will pay for children of wife.

  return numChildren.party2;
};

export const getNumberOfChildrenWithParty1 = (numChildren: NUMCHILDREN) => {
  //the num children gets changed in case of split child. E.g husband will pay for children of wife.

  return numChildren.party1;
};

export const getNumberOfChildrenWithSharing = (numChildren: NUMCHILDREN) => {
  //the num children gets changed in case of split child. E.g husband will pay for children of wife.
  return numChildren.shared;
};

export const determineTypeOfSplitting = (numChildren: NUMCHILDREN, totalNumberOfChildren: number): ItypeOfSplitting => {
  //doubt when it is split and separated.
  //husband: 1, support given for 2 children 
  //wife: 2, support given for 1 child.
  //If husband: 0,



  if ((numChildren.party1WithAdultChild > 0 || numChildren.party2WithAdultChild > 0) && numChildren.shared > 0) {
    return "HYBRID";
  }

  if (numChildren.shared > 0) {
    return 'SHARED';
  }

  if (totalNumberOfChildren !== 0) {
    if (numChildren.party1 === 0 && numChildren.party2 === totalNumberOfChildren) {
      //it is not shared but it will behave like Shared.
      return 'SEPARATED';
    } else if (numChildren.party2 === 0 && numChildren.party1 === totalNumberOfChildren) {
      return "SEPARATED";
    }
  }


  // else if(numChildren.party1 > 0 && numChildren.party2 > 0)
  // {
  //   return "SPLIT";               
  // }

  return "SPLIT"
}

export const changeReportIncompleteToComplete = async (id: number | string | undefined) => {
  const res = await apiCalculatorById.edit_value(Number(id), { status: "DONE" })
  return res;
}

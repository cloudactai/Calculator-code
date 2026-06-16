import { momentFunction } from "../../../utils/moment";
import { childInfo } from "../Calculator";

export interface showMoreOptionsState {
  party1: boolean,
  party2: boolean,
  aboutTheChildrenInfo: boolean,
  aboutTheChildrenNumberInfo: number,
}

export interface aboutYourChildrenState {
  numberOfChildren: number,
  numberOfChildrenWithAdultChild: number,
  count: {
    party1: number,
    party2: number,
    shared: number,
    party1WithAdultChild: number,
    party2WithAdultChild: number,
    sharedWithAdultChild: number,
  },
  childrenInfo: childInfo[],
}

export interface aboutTheRelationshipState {
  dateOfMarriage: number | string,
  dateOfSeparation: number | string,
}

export const findNumberOfYearsOfStarting = (dateOfBirth: number) => {
  const diff = momentFunction.differenceBetweenNowAndThen(dateOfBirth);


  //needs to be verified..
  return diff > 6 ? 0 : 6 - diff;
}

export const findNumberOfYearsOfFinishing = (dateOfBirth: number) => {
  const diff = momentFunction.differenceBetweenNowAndThen(dateOfBirth)

  return diff > 18 ? 0 : 18 - diff;
}
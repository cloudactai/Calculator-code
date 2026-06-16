import { replaceLastThreeChars } from "../../../utils/helpers";
import { Province } from "../Calculator";

export const childSupportValuesFor = (
  childInfo: Object,
  totalNumberOfChildren: number,
  totalChildrenMinusOverride: number
): string => {
  const values = Object.values(childInfo);

  return [
    ...values,
    totalNumberOfChildren,
    totalChildrenMinusOverride,
  ].toString();
};

export const fetchChildSupportDetails = (
  data: Array<any>,
  income: string,
  numChild: number,
  province: Province
) => {
  const manipulateIncome = replaceLastThreeChars(income);
  let filterInfo;

  if (manipulateIncome > 150000) {
    filterInfo = data.filter(
      (e) =>
        e.no_of_Children === numChild &&
        e.province === province &&
        e.income_over === 150000
    );
  } else {
    filterInfo = data.filter(
      (e) =>
        e.no_of_Children === numChild &&
        e.province === province &&
        e.income_over === manipulateIncome
    );
  }

  console.log("fetch child support", {
    income,
    province,
    numChild,
    data,
    filterInfo,
    manipulateIncome,
  });

  return filterInfo;
};

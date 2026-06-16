import {
  ItypeOfSplitting,
  Province,
} from "../../../../pages/calculator/Calculator";
import store from "../../../../store";
import { dynamicValues } from "../creditTaxCalculationFormulas";

export const formulaForChildBenefit = (
  province: Province,
  taxableIncome: number,
  noChildrenWithEachParty: number,
  typeOfSplitting: ItypeOfSplitting,
  dynamicValues: dynamicValues
): number => {
  if (province === "ON") {
    return formulaForOntarioChildBenefit(
      taxableIncome,
      noChildrenWithEachParty,
      typeOfSplitting,
      dynamicValues
    );
  } else if (province === "BC") {
    return formulaForBritishColumbiaChildBenefit(
      taxableIncome,
      noChildrenWithEachParty,
      typeOfSplitting,
      dynamicValues
    );
  } else if (province === "AB") {
    return formulaForAlbertaChildBenefit(
      taxableIncome,
      noChildrenWithEachParty,
      typeOfSplitting,
      dynamicValues
    );
  }

  return 0;
};

// const calculateChildBaseBC = (
//   taxableIncome: number,
//   numChildren: number,
//   typeOfSplitting: "SPLIT" | "SEPARATED" | "SHARED"
// ) => {

//   //if shared

//   let totalChildBase = 0;

//   for (let i = 0; i < numChildren; i++) {
//     let maxChildBase = 1600;
//     let minChildBase = 700;
//     let ChildBase;

//     //for first child
//     if (i === 0) {
//       maxChildBase = 1600;
//       minChildBase = 700;

//       //if taxable Income is less than 25275 then maxChildBase will be added to totalbase else minChildBase will be added.
//       ChildBase = taxableIncome <= 25275 ? maxChildBase : minChildBase;
//       totalChildBase += ChildBase;
//     } else if (i === 1) {
//       //for second child
//       maxChildBase = 1000;
//       minChildBase = 680;

//       //if taxable Income is less than 25275 then maxChildBase will be added to totalbase else minChildBase will be added.
//       ChildBase = taxableIncome <= 25275 ? maxChildBase : minChildBase;
//       totalChildBase += ChildBase;
//     } else if (i >= 2) {
//       //for third child and above
//       maxChildBase = 800;
//       minChildBase = 660;

//       //if taxable Income is less than 25275 then maxChildBase will be added to totalbase else minChildBase will be added.
//       ChildBase = taxableIncome <= 25275 ? maxChildBase : minChildBase;
//       totalChildBase += ChildBase;
//     }
//   }

//   return totalChildBase;
// };

// const calculateChildBaseBC = (
//   taxableIncome: number,
//   numChildren: number,
//   typeOfSplitting: ItypeOfSplitting
// ): number => {
//   console.log(
//     "child base",
//     determineChildBaseForEachChild(taxableIncome, numChildren)
//   );
//   return determineChildBaseForEachChild(taxableIncome, numChildren);
// };

// export const formulaForBritishColumbiaChildBenefit = (
//   taxableIncome: number,
//   noChildrenWithEachParty: number,
//   typeOfSplitting: ItypeOfSplitting
// ): number => {
//   if (noChildrenWithEachParty === 0) return 0;

//   const basic = calculateChildBaseBC(
//     taxableIncome,
//     noChildrenWithEachParty,
//     typeOfSplitting
//   );
//   // =MAX((G15-25275)*0.04,0)
//   let deductions = 0;
//   if (taxableIncome > 25275 && taxableIncome < 80880) {
//     deductions = Math.max((taxableIncome - 25275) * 0.04, 0);
//   }

//   const val = Math.max(basic - deductions, 690);

//   console.log("Child Benefit", {
//     val,
//   });

//   return val;
// };

export const formulaForOntarioChildBenefit = (
  taxableIncome: number,
  noChildrenWithEachParty: number,
  typeOfSplitting: ItypeOfSplitting,
  dynamicValues: dynamicValues
): number => {
  // console.log("logs Ontario child benefit", { taxableIncome, noChildrenWithEachParty, dynamicValues });

  let baseAmount = dynamicValues.ChildBenefitBasic * noChildrenWithEachParty;
  //make dynamic values.

  if (typeOfSplitting === "SHARED") {
    baseAmount =
      (dynamicValues.ChildBenefitBasic / 2) * noChildrenWithEachParty;
  }

  return Math.max(
    baseAmount -
      Math.max(taxableIncome - dynamicValues.ChildBenefitDeduction, 0) * 0.08,
    0
  );
};

//================================= British Columbia ====================================
const childBenefitThreshold = (
  numChildren: number,
  typeOfSplitting: ItypeOfSplitting,
  dynamicValues: dynamicValues
) => {
  if (typeOfSplitting === "SHARED") {
    if (numChildren === 1)
      return dynamicValues["ChildBenefitThreshold1ChildAmt"] / 2;
    else if (numChildren === 2)
      return (
        (dynamicValues["ChildBenefitThreshold1ChildAmt"] +
          dynamicValues["ChildBenefitThreshold2ChildAmt"]) /
        2
      );
    else if (numChildren === 3)
      return (
        (dynamicValues["ChildBenefitThreshold1ChildAmt"] +
          dynamicValues["ChildBenefitThreshold2ChildAmt"] +
          dynamicValues["ChildBenefitThresholdAddlChildAmt"]) /
        2
      );
    else if (numChildren >= 4)
      return (
        (dynamicValues["ChildBenefitThreshold1ChildAmt"] +
          dynamicValues["ChildBenefitThreshold2ChildAmt"] +
          dynamicValues["ChildBenefitThresholdAddlChildAmt"] * 2) /
        2
      );
    else return 0;
  } else {
    if (numChildren === 1)
      return dynamicValues["ChildBenefitThreshold1ChildAmt"];
    else if (numChildren === 2)
      return (
        dynamicValues["ChildBenefitThreshold1ChildAmt"] +
        dynamicValues["ChildBenefitThreshold2ChildAmt"]
      );
    else if (numChildren === 3)
      return (
        dynamicValues["ChildBenefitThreshold1ChildAmt"] +
        dynamicValues["ChildBenefitThreshold2ChildAmt"] +
        dynamicValues["ChildBenefitThresholdAddlChildAmt"]
      );
    else if (numChildren >= 4)
      return (
        dynamicValues["ChildBenefitThreshold1ChildAmt"] +
        dynamicValues["ChildBenefitThreshold2ChildAmt"] +
        dynamicValues["ChildBenefitThresholdAddlChildAmt"] * 2
      );
    else return 0;
  }
};

const calculateChildBaseBC = (
  numChildren: number,
  typeOfSplitting: ItypeOfSplitting,
  dynamicValues: dynamicValues
): number => {
  if (typeOfSplitting === "SHARED") {
    if (numChildren === 1)
      return dynamicValues["ChildBenefitBase1ChildAmt"] / 2;
    else if (numChildren === 2)
      return (
        (dynamicValues["ChildBenefitBase1ChildAmt"] +
          dynamicValues["ChildBenefitBase2ChildAmt"]) /
        2
      );
    else if (numChildren === 3)
      return (
        (dynamicValues["ChildBenefitBase1ChildAmt"] +
          dynamicValues["ChildBenefitBase2ChildAmt"] +
          dynamicValues["ChildBenefitBaseAddlChildAmt"]) /
        2
      );
    else if (numChildren >= 4)
      return (
        (dynamicValues["ChildBenefitBase1ChildAmt"] +
          dynamicValues["ChildBenefitBase2ChildAmt"] +
          dynamicValues["ChildBenefitBaseAddlChildAmt"] * 2) /
        2
      );
    else return 0;
  } else {
    if (numChildren === 1) return dynamicValues["ChildBenefitBase1ChildAmt"];
    else if (numChildren === 2)
      return (
        dynamicValues["ChildBenefitBase1ChildAmt"] +
        dynamicValues["ChildBenefitBase2ChildAmt"]
      );
    else if (numChildren === 3)
      return (
        dynamicValues["ChildBenefitBase1ChildAmt"] +
        dynamicValues["ChildBenefitBase2ChildAmt"] +
        dynamicValues["ChildBenefitBaseAddlChildAmt"]
      );
    else if (numChildren === 4)
      return (
        dynamicValues["ChildBenefitBase1ChildAmt"] +
        dynamicValues["ChildBenefitBase2ChildAmt"] +
        dynamicValues["ChildBenefitBaseAddlChildAmt"] * 2
      );
    else if (numChildren >= 5)
      return (
        dynamicValues["ChildBenefitBase1ChildAmt"] +
        dynamicValues["ChildBenefitBase2ChildAmt"] +
        dynamicValues["ChildBenefitBaseAddlChildAmt"] * 3
      );
    else return 0;
  }
};

export const formulaForBritishColumbiaChildBenefit = (
  taxableIncome: number,
  noChildrenWithEachParty: number,
  typeOfSplitting: ItypeOfSplitting,
  dynamicValues: dynamicValues
): number => {
  const { BCChildBenefitLowerThreshold } = store.getState().dynamicValues.data;
  if (noChildrenWithEachParty === 0) return 0;

  const basic = calculateChildBaseBC(
    noChildrenWithEachParty,
    typeOfSplitting,
    dynamicValues
  );

  // =MAX((G15-25275)*0.04,0)
  let deductions = Math.max(
    (taxableIncome - BCChildBenefitLowerThreshold) * 0.04,
    0
  );

  const val = Math.max(
    basic - deductions,
    childBenefitThreshold(
      noChildrenWithEachParty,
      typeOfSplitting,
      dynamicValues
    )
  );

  return val;
};

//========================================== ALBERTA ===============================

const calculateChildBaseAB = (
  numChildren: number,
  typeOfSplitting: ItypeOfSplitting,
  comp: "FAMILY" | "WORKING",
  dynamicValues: dynamicValues
): number => {
  let result = 0;

  if (comp === "FAMILY") {
    const obj: Record<number, number> = {
      0: 0,
      1: dynamicValues["ChildBenefitBase1ChildAmt"],
      2:
        dynamicValues["ChildBenefitBase1ChildAmt"] +
        dynamicValues["ChildBenefitBase2ChildAmt"],
      3:
        dynamicValues["ChildBenefitBase1ChildAmt"] +
        dynamicValues["ChildBenefitBase2ChildAmt"] +
        dynamicValues["ChildBenefitBase3ChildAmt"],
      4:
        dynamicValues["ChildBenefitBase1ChildAmt"] +
        dynamicValues["ChildBenefitBase2ChildAmt"] +
        dynamicValues["ChildBenefitBase3ChildAmt"] +
        dynamicValues["ChildBenefitBase4ChildAmt"],
    };

    if (numChildren >= 4) {
      result = obj[4];
    } else {
      result = obj[numChildren];
    }
  } else {
    const obj: Record<number, number> = {
      0: 0,
      1: dynamicValues["ChildBenefitWorking1ChildAmt"],
      2:
        dynamicValues["ChildBenefitWorking1ChildAmt"] +
        dynamicValues["ChildBenefitWorking2ChildAmt"],
      3:
        dynamicValues["ChildBenefitWorking1ChildAmt"] +
        dynamicValues["ChildBenefitWorking2ChildAmt"] +
        dynamicValues["ChildBenefitWorking3ChildAmt"],
      4:
        dynamicValues["ChildBenefitWorking1ChildAmt"] +
        dynamicValues["ChildBenefitWorking2ChildAmt"] +
        dynamicValues["ChildBenefitWorking3ChildAmt"] +
        dynamicValues["ChildBenefitWorking4ChildAmt"],
    };

    if (numChildren >= 4) {
      result = obj[4];
    } else {
      result = obj[numChildren];
    }
  }

  return result;
};

const calculateChildPercentageAB = (
  numChildren: number,
  typeOfSplitting: ItypeOfSplitting,
  comp: "FAMILY" | "WORKING"
): number => {
  let result = 0;

  if (comp === "FAMILY") {
    const obj: Record<number, number> = {
      0: 0,
      1: 0.0805,
      2: 0.1407,
      3: 0.1609,
      4: 0.2011,
    };

    if (numChildren >= 4) {
      result = obj[4];
    } else {
      result = obj[numChildren];
    }
  } else {
    const obj: { [key: number]: number } = {
      0: 0,
      1: 0.034,
      2: 0.0649,
      3: 0.0834,
      4: 0.0895,
    };

    if (numChildren >= 4) {
      result = obj[4];
    } else {
      result = obj[numChildren];
    }
  }

  return result;
};

export const formulaForAlbertaChildBenefit = (
  taxableIncome: number,
  noChildrenWithEachParty: number,
  typeOfSplitting: ItypeOfSplitting,
  dynamicValues: dynamicValues
): number => {
  //both the component have the same formulas.
  let result = 0;

  const childBenefitCommonLogicAB = (obj: {
    basic: number;
    reductionThresholdDeduction: number;
    reductionPercentage: number;
  }): number => {
    let total = 0;

    const values: {
      [key: string]: number | (() => number);
      calcReduction: () => number;
    } = {
      calcBasic: obj.basic,
      calcReductionThreshold:
        obj.basic > 0
          ? Math.max(taxableIncome - obj.reductionThresholdDeduction, 0)
          : 0,
      calcReductionPercentage: obj.reductionPercentage,
      calcReduction: function (): number {
        return (
          Number(this.calcReductionThreshold) *
          Number(this.calcReductionPercentage)
        );
      },
    };

    total = Math.max(Number(values.calcBasic) - values.calcReduction(), 0);

    // console.log("logs AB Child Benefit 3", {
    //   total,
    //   values
    // })

    return total;
  };

  //for calculating this we need Net family income component and working income component

  //param for family income
  const netFamily = {
    //determining the basic from the calculateChildBaseAB. These are hardcoded for now but need to be dynamic in future.
    basic:
      noChildrenWithEachParty > 0
        ? calculateChildBaseAB(
            noChildrenWithEachParty,
            typeOfSplitting,
            "FAMILY",
            dynamicValues
          )
        : 0,
    reductionThresholdDeduction: dynamicValues["ChildBenefitThresholdofBase"],
    reductionPercentage:
      noChildrenWithEachParty > 0
        ? calculateChildPercentageAB(
            noChildrenWithEachParty,
            typeOfSplitting,
            "FAMILY"
          )
        : 0,
  };

  //param for working income
  const workingIncome = {
    basic:
      noChildrenWithEachParty > 0
        ? calculateChildBaseAB(
            noChildrenWithEachParty,
            typeOfSplitting,
            "WORKING",
            dynamicValues
          )
        : 0,
    reductionThresholdDeduction:
      dynamicValues["ChildBenefitThresholdofWorking"],
    reductionPercentage:
      noChildrenWithEachParty > 0
        ? calculateChildPercentageAB(
            noChildrenWithEachParty,
            typeOfSplitting,
            "WORKING"
          )
        : 0,
  };

  result += childBenefitCommonLogicAB(netFamily);

  // console.log("logs AB Child Benefit 1", result, netFamily, workingIncome);

  result += childBenefitCommonLogicAB(workingIncome);

  // console.log("logs AB Child Benefit 2", result, netFamily, workingIncome);

  return Math.min(result, 5120);
};

import { totalOntarioCredits } from "./creditTaxCalculationFormulas";
import {
  calculateBaseAmount,
  calculateDeductionsInChildBenefit,
  formulaForCanadaChildBenefit,
  formulaForProvTax,
  lowIncomeCredit,
  taxSimpleI26,
} from "./taxCalculationFormula";

it("gets the correct value of Canada Child Benefit Base Amount", () => {
 const data = [{
    name: "sadf",
    dateOfBirth: "2009-08-25",
    custodyArrangement: "Party 1",
    childHasDisability: "No",
    childOfRelationship: "Yes",
    adultChildStillALegalDependant: "Yes",
    childIncome: 0,
  }];

  expect(calculateBaseAmount(data)).toBe(5765);
//   expect(calculateBaseAmount(data)).toBe(6833);
});

it('get the correct amount for canada child benefit deductions', () => {
    expect(calculateDeductionsInChildBenefit(
        64709, 1
    )).toBe(2287.67)
})

it("gets the correct value for low Income Credit", () => {
 const obj = {
   totalIncome: 35000,
 }
  expect(lowIncomeCredit(obj, 34842)).toBe(365.8);
})


it('get the correct value for total Ontario Credits', () => {
  const obj = {
    Basic: 0,
  Income_over: 35000,
  Rate: 0.05,
  ageForPerson: 1,
  totalIncome: 35000,
  taxableIncome: 50842,
  year: 2021,
  screen1: {
    aboutTheChildren: {
      count: {
        party1: 0, 
        party2: 0,
        shared: 0
      },
      numberOfChildren: 0,
    }
  },
  childSupport: {
    party1: 0,
    party2: 0
  },
  partyNum: 1,
  }

  expect(totalOntarioCredits(obj)).toBe(22230.25);
})

// it('get the correct value for taxSimpleI26', () => {
//   const obj = {
//     Basic: 0,
//   Income_over: 0,
//   Rate: 0.05,
//   ageForPerson: 1,
//   totalIncome: 35000,
//   taxableIncome: 34842,
//   year: 2021,
//   screen1: {
//     aboutTheChildren: {
//       count: {
//         party1: 1, 
//         party2: 0,
//         shared: 0
//       },
//       numberOfChildren: 1,
//     },
//   },
//   childSupport: {
//     party1: 0,
//     party2: 0
//   },
//   partyNum: 1,
//   }

//   expect(taxSimpleI26(obj, 34842)).toBe(253.67);
// })


// it("gets the correct value for provincial tax", () => {
//   const obj = {
//     Basic: 0,
//   Income_over: 0,
//   Rate: 0.05,
//   ageForPerson: 1,
//   totalIncome: 35000,
//   taxableIncome: 34842,
//   year: 2021,
//   screen1: {
//     aboutTheChildren: {
//       count: {
//         party1: 1, 
//         party2: 1,
//         shared: 0
//       }
//     }
//   },
//   childSupport: {
//     party1: 0,
//     party2: 0
//   },
//   partyNum: 1,
//   }

//   expect(formulaForProvTax(obj, 34842)).toBe(253.67);
// })
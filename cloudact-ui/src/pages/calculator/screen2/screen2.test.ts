import { formulaForFedTax, formulaForProvTax, formulaForCanadaChildBenefit, formulaForChildSupport } from '../../../utils/helpers/calculator/taxCalculationFormula'

it('gets the correct value for Federal Tax', () => {
  const data = {
    Basic: 7353,
    From: 49020,
    Income_over: 49020,
    Province: "FED",
    Rate: 0.205,
    To: 98040,
    Year: 2021,
    id: 2,
    totalIncome: 65000,
  }

  console.log(formulaForFedTax(data, 64709.5));

  expect(formulaForFedTax(data, 64709.5)).toBe("5673.57");
})

// it('gets the correct value for Provincial Tax', () => {
//   const data = {
//     Basic: 0,
//     From: 20000,
//     Income_over: 20000,
//     Province: "ON-Health",
//     Rate: 6,
//     To: 25000,
//     Year: 2021,
//     id: 12,
//   }

//     expect(formulaForProvTax(data, 22000)).toBe("3490.56");
// })


// it('gets the correct value for Child Support', () => {


// })
import { totalFederalCredits, totalOntarioCredits } from "./creditTaxCalculationFormulas"



it('gets the correct value for Federal Credits', () => {
    const data = {
      ageForPerson: 34, 
      totalIncome: 65000,
    }
    
     
      expect(totalFederalCredits(data)).toBe(32638.49);
  })
  
it('gets the correct value for OntarioCredits', () => {
    const data = {
      ageForPerson: 34, 
      totalIncome: 65000,
    }
    
      console.log(totalOntarioCredits(data));
  
      expect(totalOntarioCredits(data)).toBe(23883.49);
  })
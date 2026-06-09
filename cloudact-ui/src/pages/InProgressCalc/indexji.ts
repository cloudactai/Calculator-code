export interface  Screen1State {
      label: string,
      description: string,
      party1FirstName:  string,
      party2FirstName: string,
      party1LastName: string,
      party2LastName: string,
      party1DateOfBirth: string,
      party2DateOfBirth: string,
      party1province:string,
      party2province: string,
      party1LiveInOntario: "Yes" | "No";
      party2LiveInOntario: "Yes" | "No";
      party1LiveInRural: "Yes" | "No";
      party2LiveInRural: "Yes" | "No";
      party1eligibleForDisability: "Yes" | "No";
      party2eligibleForDisability: "Yes" | "No";
      party1ExemptFromCanadaPension: "Yes" | "No";
      party2ExemptFromCanadaPension: "Yes" | "No";
      party1ExemptFromEmploymentPremium: "Yes" | "No";
      party2ExemptFromEmploymentPremium: "Yes" | "No";
      calulationType: string;
  }

export interface  Screen2State{
    amount: number,
    inf:number
  }  
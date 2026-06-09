import Screen1 from "./Screens/Screen1";
import Screen2 from "./Screens/Screen2";
import {CHILD_SUPPORT_CAL , SPOUSAL_SUPPORT_CAL, CHILD_AND_SPOUSAL_SUPPORT_CAL} from "./constants/constants"
import React, {useState} from "react"
import { Screen1State  ,Screen2State} from "./indexji";

const typeOfCalculations = [
    {
      value: "Child Support",
      type: CHILD_SUPPORT_CAL,
    },
    {
      value: "Spousal Support",
      type: SPOUSAL_SUPPORT_CAL,
    },
    {
      value: "Child and Spousal Support",
      type: CHILD_AND_SPOUSAL_SUPPORT_CAL,
    },
];



const ProgressCal =()=>{


    const [screen1data, setScreen1Data] = useState<Screen1State>({
      label: "",
      description: "",
      party1FirstName:  "Party 1 ",
      party2FirstName:  "Party 2",
      party1LastName: "",
      party2LastName: "",
      party1DateOfBirth: '',
      party2DateOfBirth: '',
      party1province:"ON",
      party2province: "ON",
      party1LiveInOntario:
       "No" ,
      party2LiveInOntario:
       "No"
          ,
      party1LiveInRural: "No",
      party2LiveInRural: "No",
      party1eligibleForDisability: "No",
      party2eligibleForDisability: "No",
      party1ExemptFromCanadaPension: "No",
      party2ExemptFromCanadaPension: "No",
      party1ExemptFromEmploymentPremium: "No",
      party2ExemptFromEmploymentPremium: "No",
      calulationType: CHILD_SUPPORT_CAL
    });

    const [screen2data , setScreen2Data] = useState<Screen2State>({
        amount: 1,
        inf:1
    })


    const Screen1Props={
        screen1data,
        setScreen1Data,
        typeOfCalculations
    }

    const Screen2Props={
      Screen1Props
    }

    

    

    return (
        <>
        <div className="lawCalculator justify-content-center freeVersion">

          <div className="row">

           <div className="col-6">
            <Screen1 {...Screen1Props}/>
           </div>

            <div className="col-6 quantumRange">
            <Screen2 />
            </div>

          </div>
               
        </div>
        </>
    )
}

export default ProgressCal
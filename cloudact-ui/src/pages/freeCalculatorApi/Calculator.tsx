import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import useAPI from "../../hooks/useAPI";
// @ts-ignore
import useQuery from "../../hooks/useQuery";
import { Store } from "../../store/store";
import {
  backgroundState,
  calculatorScreen2State,
  childInfo,

  SPOUSAL_SUPPORT_CAL,
  CHILD_SUPPORT_CAL,
  CHILD_AND_SPOUSAL_SUPPORT_CAL
} from "./Calculator";

// @ts-ignore

import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "./screen1/Screen1";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import Screen1 from "./screen1/Screen1.tsx";

// @ts-ignore
import Screen4 from "./screen4/Screen4.tsx";
import Screen4temp from "./screen4/Screen4temp";



const Calculator = () => {

  const [calculatorState, setCalculatorState] = useState({
    currentFormNumber: 1,
    label: '',
    description: '',
    savedBy: '',
  });


  const data = useSelector((state: Store) => state.getinf)
  const activeForm = useQuery();


  const getCurrentStepFromQuery = (): number => {
    const step = activeForm.get("step");
    return step ? parseInt(step) : 1;
  };



  //screen 1
  class newChildInfo implements childInfo {
    childHasDisability: "No" | "Yes";
    childOfRelationship: "Yes" | "No";
    adultChildStillALegalDependant: "Yes" | "No";
    childIncome: number;
    CSGTable: "Yes" | "No";
    ChildSupportOverride: number;
    numberOfYearsOfStartingSchool: number;
    numberOfYearsOfFinishingSchool: number;

    constructor(
      public name: string,
      public dateOfBirth: number,
      public custodyArrangement: string
    ) {
      this.childHasDisability = "No";
      this.childOfRelationship = "Yes";
      this.adultChildStillALegalDependant = "Yes";
      this.childIncome = 0;
      this.numberOfYearsOfStartingSchool = 0;
      this.numberOfYearsOfFinishingSchool = 0;
      this.ChildSupportOverride = 0;
      this.CSGTable = "Yes";
    }
  }

  const [selectedType, setSelectedType] = useState({
    type: "Child Support",
    calculatorType: CHILD_SUPPORT_CAL,
  });

  useEffect(() => {
    if (selectedType.calculatorType == SPOUSAL_SUPPORT_CAL) {
      setAboutTheChildren({
        ...aboutTheChildren, numberOfChildren: 0,
        numberOfChildrenWithAdultChild: 0,
        count: {
          ...aboutTheChildren.count,
          party1: 0,
          party1WithAdultChild: 0
        },
        childrenInfo: []

      })

    }
    else {
      setAboutTheChildren({
        ...aboutTheChildren, numberOfChildren: 1,
        numberOfChildrenWithAdultChild: 1,
        count: {
          ...aboutTheChildren.count,
          party1: 1,
          party1WithAdultChild: 1
        },

      })
    }
  }, [selectedType])






  useEffect(() => {
    const currStepNumber: number = getCurrentStepFromQuery();

    setCalculatorState((prevState) => ({
      ...prevState,
      currentFormNumber: currStepNumber,
    }));
  }, [getCurrentStepFromQuery()]);


  const [background, setBackground] = useState<backgroundState>({
    label: "",
    description: "",
    party1FirstName: "Party 1 ",
    party2FirstName: "Party 2",
    party1LastName: "",
    party2LastName: "",
    party1DateOfBirth: '',
    party2DateOfBirth: '',
    party1province: "ON",
    party2province: "ON",
    party1LiveInOntario:
      "No",
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
  });



  const [aboutTheRelationship, setAboutTheRelationship] = useState
    <aboutTheRelationshipState>({
      dateOfMarriage: '',
      dateOfSeparation: '',
    });



  const [aboutTheChildren, setAboutTheChildren] = useState<aboutYourChildrenState>({
    numberOfChildren: selectedType.calculatorType === SPOUSAL_SUPPORT_CAL ? 0 : 1,
    numberOfChildrenWithAdultChild: selectedType.calculatorType === SPOUSAL_SUPPORT_CAL
      ? 0
      : 1,
    count: {
      party1: selectedType.calculatorType === SPOUSAL_SUPPORT_CAL ? 0 : 1,
      party2: 0,
      shared: 0,
      party1WithAdultChild:
        selectedType.calculatorType === SPOUSAL_SUPPORT_CAL ? 0 : 1,
      party2WithAdultChild: 0,
      sharedWithAdultChild: 0,
    },
    childrenInfo:
      data && data?.no_of_children > 0
        ? Array(data?.no_of_children)
          .fill(data?.no_of_children)
          .map((item, index) => {
            return {
              name: data[`child_${index + 1}_name`] as string,
              dateOfBirth: data[`child_${index + 1}_DOB`] as string,
              custodyArrangement: childLivesWith(
                data[`child_${index + 1}_lives_with`] as string
              ),
              childHasDisability: "No",
              childOfRelationship: "Yes",
              adultChildStillALegalDependant: "Yes",
              childIncome: 0,
              CSGTable: "Yes",
              ChildSupportOverride: 0,
              numberOfYearsOfStartingSchool: 0,
              numberOfYearsOfFinishingSchool: 0,
            };
          })
        :
        [],
  });

  
  const [screen2, setScreen2] = useState<calculatorScreen2State>({
    income: {
      party1: [{ label: "", amount: "0", value: "" }],
      party2: [{ label: "", amount: "0", value: "" }],
    },
    benefits: {
      party1: [
        {
          label: "",
          amount: "0",
          value: "",
        },
      ],
      party2: [
        {
          label: "",
          value: "",
          amount: "0",
        },
      ],
    },
    deductions: {
      party1: [
        {
          label: "",
          amount: "0",
          value: "",
        },
      ],
      party2: [
        {
          label: "",
          value: "",
          amount: "0",
        },
      ],
    },
    tax_year: -1,
    totalIncomeParty1: 0,
    totalIncomeParty2: 0,
    childSupport: {
      childSupport1: 0,
      childSupport2: 0,
      givenTo: "",
    },
    spousalSupport: {
      spousalSupport1Med: 0,
      spousalSupport2Med: 0,
      spousalSupport1Low: 0,
      spousalSupport2Low: 0,
      spousalSupport1High: 0,
      spousalSupport2High: 0,
      givenTo: "",
    },
    durationOfSupport: [0, 0],
    specialExpenses: 0,
    guidelineIncome: {
      party1: [
        {
          label: "",
          amount: "0",
          value: "",
        },
      ],
      party2: [
        {
          label: "",
          value: "",
          amount: "0",
        },
      ],
    },
    specialExpensesArr: {
      party1: [
        {
          label: "",
          amount: "0",
          value: "",
        },
      ],
      party2: [
        {
          label: "",
          value: "",
          amount: "0",
        },
      ],
    },
    childSupportReadOnly: { party1: 0, party2: 0 },
    canadaChildBenefitFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    ClimateActionBenefitFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    provChildBenefitFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    GSTHSTBenefitFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    salesTaxBenefitFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    basicPersonalAmountFederalFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    amountForEligibleDependentFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    baseCPPContributionFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    eiPremiumFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    canadaEmploymentAmountFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    basicPersonalAmountProvincialFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    amountForEligibleDependentProvincialFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    changeInTaxesAndBenefit: {
      changeInTaxesAndBenefitLow1: 0,
      changeInTaxesAndBenefitLow2: 0,
      changeInTaxesAndBenefitMed1: 0,
      changeInTaxesAndBenefitMed2: 0,
      changeInTaxesAndBenefitHigh1: 0,
      changeInTaxesAndBenefitHigh2: 0,
    },
  });

  const [screen3, setScreen3] = useState({});
  const [screen4, setScreen4] = useState({});

  const [isLoading, setLoading] = useState(false)
  const [is4thdisplay, setis4thDisplay] = useState(false)

  useEffect(() => {

    const details = aboutTheChildren.childrenInfo;
    const totalNumberOfChildren = Number(
      aboutTheChildren.numberOfChildrenWithAdultChild
    );
    const currentNumberOfChildren = aboutTheChildren.childrenInfo.length;
    const remainingChildren = totalNumberOfChildren - currentNumberOfChildren;
    aboutTheChildren.numberOfChildren = totalNumberOfChildren;

    if (totalNumberOfChildren >= 0 && totalNumberOfChildren <= 10) {
      if (remainingChildren > 0) {
        for (let i = 0; i < remainingChildren; i++) {
          details.push(
            new newChildInfo(`Child ${currentNumberOfChildren + 1}`, "", "")
          );
        }
      } else {
        for (let i = 0; i < Math.abs(remainingChildren); i++) {
          details.pop();
        }
      }

      setAboutTheChildren({ ...aboutTheChildren, childrenInfo: details });
    } else {
      setAboutTheChildren({
        ...aboutTheChildren,
        numberOfChildrenWithAdultChild: 10,
      });
    }
  }, [aboutTheChildren.numberOfChildrenWithAdultChild]);

  const setBackgroundFunc = (obj: any) => {
    setBackground({ ...background, [obj.target.name]: obj.target.value });
  };

  const setBackgroundStateByObj = (obj: any) => {
    setBackground({ ...background, ...obj });
  };

  const setAboutTheChildrenFunc = (obj: any) => {
    setAboutTheChildren({
      ...aboutTheChildren,
      [obj.target.name]: obj.target.value,
    });
  };

  const setAboutTheChildrenDetailsFunc = (
    e: any,
    index: number,
    key: number
  ): void => {
    const details = aboutTheChildren.childrenInfo;

    details[index][key] = e.target.value;


    setAboutTheChildren({ ...aboutTheChildren, childrenInfo: details });
  };

  const setAboutTheChildrenStateByObjFunc = (obj: any) => {

    setAboutTheChildren({
      ...aboutTheChildren,
      ...obj,
    });
  };

  const setAboutTheRelationshipFunc = (obj: any) => {

    setAboutTheRelationship({
      ...aboutTheRelationship,
      [obj.target.name]: obj.target.value,
    });
  };

  const settingScreen2StateFromChild = (data: any) => {
    setScreen2(data);
  };

  const settingScreen3StateFromChild = (obj: any) => {
    setScreen3(obj);
  };

  const settingScreen4StateFromChild = (obj: any) => {
    setScreen4(obj);
  };

  const screen1Props = () => {
    return { background, aboutTheChildren, aboutTheRelationship };
  };

  const allPropsScreen1 = {
    typeOfCalculatorSelected: selectedType.calculatorType,
    background: background,
    setBackground: setBackgroundFunc,
    aboutTheChildren: aboutTheChildren,
    setAboutTheChildren: setAboutTheChildrenFunc,
    aboutTheRelationship: aboutTheRelationship,
    setBackgroundStateByObj: setBackgroundStateByObj,
    setAboutTheRelationship: setAboutTheRelationshipFunc,
    setAboutTheChildrenDetails: setAboutTheChildrenDetailsFunc,
    setAboutTheChildrenStateByObj: setAboutTheChildrenStateByObjFunc,
    incomeDetails: screen2.income,
  };


  //screen 2
  const allPropsScreen2 = {
    settingScreen2StateFromChild: settingScreen2StateFromChild,
    typeOfCalculatorSelected: selectedType.calculatorType,
    screen1: screen1Props(),
    screen2: screen2,
    calculatorState: calculatorState,
    setBackground: setBackgroundStateByObj,
    setis4thDisplay,
    setLoading
  };

  //screen 4
  const allPropsScreen4 = {
    typeOfCalculatorSelected: selectedType.calculatorType,
    settingScreen4StateFromChild: settingScreen4StateFromChild,
    screen1: screen1Props(),
    screen2: screen2,
    screen3: screen3,
  };


  return (

    <div className="lawCalculator justify-content-center freeVersion">
      {isLoading ? (
        <Loader isLoading={isLoading} />
      ) : (
        <>
          <div className="row">
            <div className="col-6">
              <Screen1 {...allPropsScreen1} setLoading={setLoading} selectedType={selectedType} setSelectedType={setSelectedType} props={allPropsScreen2} />
            </div>

            <div className="col-6 quantumRange">
              {
                is4thdisplay ?
                  <Screen4 {...allPropsScreen4} /> :
                  <Screen4temp {...allPropsScreen4} />
              }

            </div>

          </div>
        </>
      )}
    </div>

  );
};

export default Calculator;

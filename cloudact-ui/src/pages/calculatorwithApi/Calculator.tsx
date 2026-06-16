import Cookies from "js-cookie";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../actions/userActions";
import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import useAPI from "../../hooks/useAPI";
// @ts-ignore
import useQuery from "../../hooks/useQuery";
import { Store } from "../../store/store";
import { getAllUserInfo } from "../../utils/helpers";
import {
  backgroundState,
  calculatorScreen2State,
  childInfo,
  getCalculatorIdFromQuery,
  getCalculatorTypeFromQuery,
  SPOUSAL_SUPPORT_CAL,
} from "./Calculator";
// @ts-ignore
import StepNumber from "./checkoutSteps/StepNumber.tsx";
import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "./screen1/Screen1";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import Screen1 from "./screen1/Screen1.tsx";
import { getCalculatorLabelFromCookies } from "./screen2/Screen2";
// @ts-ignore
import Screen2 from "./screen2/Screen2.tsx";
// @ts-ignore
import Screen4 from "./screen4/Screen4.tsx";

const Calculator = () => {
  const dispatch = useDispatch();
  const [calculatorState, setCalculatorState] = useState({
    currentFormNumber: 1,
    label: getCalculatorLabelFromCookies().label,
    description: getCalculatorLabelFromCookies().description,
    savedBy: getAllUserInfo().username,
  });
  const { data } = useSelector((state: Store) => state.clientDetailsFromFile);
  const { userInfo } = useSelector((state: Store) => state.userLogin);
  const activeForm = useQuery();

  const getCurrentStepFromQuery = (): number => {
    const step = activeForm.get("step");
    return step ? parseInt(step) : 1;
  };

  const getCurrentIdFromQuery = (): number | null => {
    const id = getCalculatorIdFromQuery(activeForm);

    Cookies.set("calculatorId", JSON.stringify(id), { path: "/" });

    return id ? parseInt(id) : null;
  };

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

  const query = useQuery();

  const [typeOfCalculatorSelected, setTypeOfCalculatorSelected] = useState(
    getCalculatorTypeFromQuery(query)
  );

  const [background, setBackground] = useState<backgroundState>({
    label: "",
    description: "",
    party1FirstName: data?.client_name || "Party 1",
    party2FirstName: data?.opposing_party_name || "Party 2",
    party1LastName: "",
    party2LastName: "",
    party1DateOfBirth: data?.client_DOB,
    party2DateOfBirth: data?.opposing_party_DOB,
    party1province: data?.client_province || "ON",
    party2province: data?.opposing_party_province || "ON",
    party1LiveInOntario:
      data?.client_province && data?.client_province === "ON" ? "Yes" : "No",
    party2LiveInOntario:
      data?.opposing_party_province && data?.opposing_party_province === "ON"
        ? "Yes"
        : "No",
    party1LiveInRural: "No",
    party2LiveInRural: "No",
    party1eligibleForDisability: "No",
    party2eligibleForDisability: "No",
    party1ExemptFromCanadaPension: "No",
    party2ExemptFromCanadaPension: "No",
    party1ExemptFromEmploymentPremium: "No",
    party2ExemptFromEmploymentPremium: "No",
  });

  const [aboutTheRelationship, setAboutTheRelationship] =
    useState<aboutTheRelationshipState>({
      dateOfMarriage: data?.date_of_marriage,
      dateOfSeparation: data?.date_of_separation,
    });
  const [aboutTheChildren, setAboutTheChildren] =
    useState<aboutYourChildrenState>({
      numberOfChildren:typeOfCalculatorSelected === SPOUSAL_SUPPORT_CAL ? 0 : 1,
      numberOfChildrenWithAdultChild:typeOfCalculatorSelected === SPOUSAL_SUPPORT_CAL
          ? 0
          : data?.no_of_children || 1,
      count: {
        party1: typeOfCalculatorSelected === SPOUSAL_SUPPORT_CAL ? 0 : 1,
        party2: 0,
        shared: 0,
        party1WithAdultChild:
          typeOfCalculatorSelected === SPOUSAL_SUPPORT_CAL ? 0 : 1,
        party2WithAdultChild: 0,
        sharedWithAdultChild: 0,
      },
      childrenInfo:
        data?.no_of_children > 0
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
          : [],
    });

  function childLivesWith(custodyArragement: string) {
    switch (custodyArragement) {
      case "Client":
        return data?.client_name;
      case "Opposing party ":
        return data?.opposing_party_name;
      case "Shared Parenting":
        return "Shared";
      default:
        return data?.client_name;
    }
  }

  const [screen2, setScreen2] = useState<calculatorScreen2State>({
    income: {
      party1: [{ label: "", amount: "0", value: "" }],
      party2: [{ label: "", amount: "0", value: "" }],
    },
    undueHardshipIncome : {
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
          child: ""
        },
      ],
      party2: [
        {
          label: "",
          value: "",
          amount: "0",
          child: ""
        },
      ],
    },

    otherhouseholdmember:{
      party1: [
        { label: "", income: "0",deductionIncome:"0",AdjustmentIncome:"0", value: "" },
      ],
      party2: [
        { label: "", income: "0",deductionIncome:"0",AdjustmentIncome:"0", value: "" },
      ],
    },
    childSupportReadOnly: { party1: 0, party2: 0 },
    canadaChildBenefitFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },

    ChildDisabilityBenefitFixed: {
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
    basicPartyDisabilityFixed: {
      party1: { value: 0, isFixed: false },
      party2: { value: 0, isFixed: false },
    },
    basicPartyDisabilityProvFixed: {
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
  
  const [nonTaxableincome , setNonTaxableincome] = useState({
    party1:  [{ label: "", amount: "0", value: "", tooltip: "" }],
    party2:  [{ label: "", amount: "0", value: "", tolltip: "" }],
  })


    // change this to useRef below
  const [calpercentage, setCalPercentage] = useState({
    low: 40,
    mid: 43,
    high: 46,
  });

  const calpercentageRef = useRef({
    low: 40,
    mid: 43,
    high: 46,
  });


  const updateCalPercentage = (newValues) => {
    calpercentageRef.current = {
      ...calpercentageRef.current,
      ...newValues,
    };
  };

  const [specificamount, setspecificamount] = useState({
    low: 0,
    mid: 0,
    high: 0,
  });

  const [specialExpensePercentage, setspecialExpensePercentage] = useState({
    low: 0,
    mid: 0,
    high: 0,
  });

  const [editingPercentage, setEditingPercentage] = useState({
    low: false,
    mid: false,
    high: false,
  });

  const [editingSpecificAmount, setEditingSpecificAmount] = useState({
    low: false,
    mid: false,
    high: false,
  });

  const [lumpsum, setLumpsum] = useState({
    discount_rate: 1.3,
    duration: "",
  });

  const [lifeInsurence, setLifeInsurence] = useState({
    discount_rate: 1.3,
    duration: "",
    age_till_child_support_pay: "",
  });

  const valueswithoutSpousalSupport = useRef({
    party1: 0,
    party2: 0,
  });

  const [taxeswithAddSupport, settaxeswithAddSupport] = useState({
    party1: 0,
    party2: 0,
  });

  const [includeLumpsum, setIncludeLumpsum] = useState(false);
  const [includeLifeInsurence, setIncludeLifeInsurence] = useState(false);
  const [undueHardship, setundueHardship] = useState({
    party1: false,
    party2: false
  });
  // change this to useRef
  const [scenarios, setScenarios] = useState({
    scenario1: { discountRate: 0, cashFlowsAndDurations: [], npvResult: null },
    scenario2: { discountRate: 0, cashFlowsAndDurations: [], npvResult: null },
    scenario3: { discountRate: 0, cashFlowsAndDurations: [], npvResult: null },
  });


  const [restructioring, setRestructioring] = useState(false);

  const [allApiDataCal ,setAllApiDataCal] = useState(null)


  let restructionbtnref = useRef(null)


  useEffect(() => {
    const currStepNumber: number = getCurrentStepFromQuery();

    setCalculatorState((prevState) => ({
      ...prevState,
      currentFormNumber: currStepNumber,
    }));
  }, [getCurrentStepFromQuery()]);

  const { isLoading, requestAction } = useAPI({
    url: `calculator/get_data_by_stored_id/${getCurrentIdFromQuery()}`,
    method: "GET",
  });

  useEffect(() => {
    dispatch(toggleSidebar());
    requestAction()
      .then((res) => {
        const { data, label, description, created_by } = res.data[0];

        const dataParsing = JSON.parse(data);
        setBackground({
          ...dataParsing.background,
          label: label,
          description: description,
        });
        
        if(dataParsing?.nonTaxableincome){
          setNonTaxableincome((prev)=>({
            ...prev,
            party1:dataParsing.nonTaxableincome.party1,
            party2:dataParsing.nonTaxableincome.party2
        }))
        }
       

        setTypeOfCalculatorSelected(dataParsing.calculator_type);
        setAboutTheChildren(dataParsing.aboutTheChildren);
        setAboutTheRelationship(dataParsing.aboutTheRelationship);
        if(dataParsing?.undueHardship){
          setundueHardship((prev)=>({
            ...prev , party1: dataParsing.undueHardship.party1 ,
             party2 :dataParsing.undueHardship.party2
          }))
        }
        
        setScreen2((prev) => ({
          ...prev,
          income: dataParsing.income,
          undueHardshipIncome : dataParsing.undueHardshipIncome,
          otherhouseholdmember:dataParsing.otherhouseholdmember,
          benefits: dataParsing.benefits,
          deductions: dataParsing.deductions,
          tax_year: dataParsing.tax_year,
          guidelineIncome: dataParsing.guidelineIncome,
          specialExpensesArr: dataParsing.specialExpensesArr,
          canadaChildBenefitFixed: dataParsing.canadaChildBenefitFixed,
          ChildDisabilityBenefitFixed: dataParsing.ChildDisabilityBenefitFixed,
          provChildBenefitFixed: dataParsing.provChildBenefitFixed,
          GSTHSTBenefitFixed: dataParsing.GSTHSTBenefitFixed,
          ClimateActionBenefitFixed: dataParsing.ClimateActionBenefitFixed,
          salesTaxBenefitFixed: dataParsing.salesTaxBenefitFixed,
          basicPersonalAmountFederalFixed:
            dataParsing.basicPersonalAmountFederalFixed,
          basicPartyDisabilityFixed: dataParsing.basicPartyDisabilityFixed,
          amountForEligibleDependentFixed:
            dataParsing.amountForEligibleDependentFixed,
          baseCPPContributionFixed: dataParsing.baseCPPContributionFixed,
          eiPremiumFixed: dataParsing.eiPremiumFixed,
          canadaEmploymentAmountFixed: dataParsing.canadaEmploymentAmountFixed,
          basicPersonalAmountProvincialFixed:
            dataParsing.basicPersonalAmountProvincialFixed,
          amountForEligibleDependentProvincialFixed:
            dataParsing.amountForEligibleDependentProvincialFixed,
        }));

        setCalculatorState((prev) => ({
          ...prev,
          label,
          description,
          savedBy: created_by,
        }));
      })
      .catch((err) => console.log("err", err));

    return () => {
      dispatch(toggleSidebar());
    };
  }, []);

  useEffect(() => {
    const details = aboutTheChildren.childrenInfo;
    const totalNumberOfChildren = Number(
      aboutTheChildren.numberOfChildrenWithAdultChild
    );
    const currentNumberOfChildren = aboutTheChildren.childrenInfo.length;
    const remainingChildren = totalNumberOfChildren - currentNumberOfChildren;
    aboutTheChildren.numberOfChildren = totalNumberOfChildren;

    const childDetails = [];
    if (totalNumberOfChildren >= 0 && totalNumberOfChildren <= 10) {
      for (let i = 0; i < totalNumberOfChildren; i++) {
        childDetails.push(
          new newChildInfo(
            `Child ${i + 1}`,
            details[i]?.dateOfBirth,
            details[i]?.custodyArrangement
          )
        );
      }
      setAboutTheChildren({ ...aboutTheChildren, childrenInfo: childDetails });
    } else {
      setAboutTheChildren({
        ...aboutTheChildren,
        childrenInfo: childDetails,
        numberOfChildrenWithAdultChild: 10,
      });
    }

    // if (totalNumberOfChildren >= 0 && totalNumberOfChildren <= 10) {
    //   if (remainingChildren > 0) {
    //     for (let i = 0; i < remainingChildren; i++) {
    //       details.push(
    //         new newChildInfo(`Child ${currentNumberOfChildren + 1}`, "", "")
    //       );
    //     }
    //   } else {
    //     for (let i = 0; i < Math.abs(remainingChildren); i++) {
    //       details.pop();
    //     }
    //   }

    //   setAboutTheChildren({ ...aboutTheChildren, childrenInfo: details });
    // } else {
    //   setAboutTheChildren({
    //     ...aboutTheChildren,
    //     numberOfChildrenWithAdultChild: 10,
    //   });
    // }
  }, [aboutTheChildren.numberOfChildrenWithAdultChild]);

  const setBackgroundFunc = (obj: any) => {
    setBackground({
      ...background,
      [obj.target.name]: obj.target.checked
        ? obj.target.checked
          ? "Yes"
          : "No"
        : obj.target.value,
    });
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

  

  const screen1Props = () => {
    return { background, aboutTheChildren, aboutTheRelationship };
  };

  const allPropsScreen1 = {
    typeOfCalculatorSelected,
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
    calpercentage: calpercentage,
    setCalPercentage: setCalPercentage,
    // replace cal p
    updateCalPercentage:updateCalPercentage,
    calpercentageRef:calpercentageRef?.current,
    specificamount: specificamount,
    setspecificamount: setspecificamount,
    editingPercentage: editingPercentage,
    setEditingPercentage: setEditingPercentage,
    editingSpecificAmount: editingSpecificAmount,
    setEditingSpecificAmount: setEditingSpecificAmount,
    specialExpensePercentage: specialExpensePercentage,
    setspecialExpensePercentage: setspecialExpensePercentage,
    lumpsum: lumpsum,
    setLumpsum: setLumpsum,
    includeLumpsum: includeLumpsum,
    setIncludeLumpsum: setIncludeLumpsum,
    lifeInsurence: lifeInsurence,
    setLifeInsurence: setLifeInsurence,
    includeLifeInsurence: includeLifeInsurence,
    setIncludeLifeInsurence: setIncludeLifeInsurence,
  };

  //screen 2
  const allPropsScreen2 = {
    settingScreen2StateFromChild: settingScreen2StateFromChild,
    typeOfCalculatorSelected,
    screen1: screen1Props(),
    screen2: screen2,
    calculatorState: calculatorState,
    setBackground: setBackgroundStateByObj,
    calpercentage: calpercentage,
    setCalPercentage: setCalPercentage,
    //replce c
    updateCalPercentage:updateCalPercentage,
    calpercentageRef:calpercentageRef?.current,

    specificamount:specificamount,
    specialExpensePercentage:specialExpensePercentage,
    valueswithoutSpousalSupport:valueswithoutSpousalSupport,
    lumpsum:lumpsum,
    lifeInsurence:lifeInsurence,
    includeLumpsum :includeLumpsum , 
    includeLifeInsurence:includeLifeInsurence,
    taxeswithAddSupport:taxeswithAddSupport, 
    settaxeswithAddSupport:settaxeswithAddSupport
    ,
    scenarios:
    scenarios, setScenarios :  setScenarios,
    restructioring:restructioring,
    setRestructioring:setRestructioring,
    undueHardship:undueHardship, setundueHardship:setundueHardship,
    restructionbtnref:restructionbtnref ,
    nonTaxableincome , setNonTaxableincome,
    allApiDataCal ,setAllApiDataCal
  };

  //screen 4
  const allPropsScreen4 = {
    typeOfCalculatorSelected,
    screen1: screen1Props(),
    screen2: screen2,
    lumpsum:lumpsum,
    lifeInsurence:lifeInsurence,
    includeLumpsum :includeLumpsum , 
    includeLifeInsurence:includeLifeInsurence,
    scenarios:
    scenarios, setScenarios :  setScenarios,
    restructioring:restructioring, setRestructioring:setRestructioring,
    allApiDataCal ,setAllApiDataCal
  };

  const renderTypeOfCalculationSelected = () => {
    switch (allPropsScreen1.typeOfCalculatorSelected) {
      case "CHILD_AND_SPOUSAL_SUPPORT":
        return "Child and Spousal Support";
      case "CHILD_SUPPORT_CAL":
        return "Child Support";
      case "SPOUSAL_SUPPORT":
        return "Spousal Support";
      default:
        break;
    }
  };

  return (
    <Layout title={`Welcome ${userInfo?.username ? userInfo?.username : ""}`}>
      <h5 className="calcTitle">{renderTypeOfCalculationSelected()}</h5>
      <div className="lawCalculator justify-content-center">
        <div className="status">
          <StepNumber
            activeFormNumber={calculatorState.currentFormNumber}
            calculatorId={getCurrentIdFromQuery()}
            activeForm1Data={allPropsScreen1}
            activeForm2Data={allPropsScreen2}
            activeForm3Data={{
              allPropsScreen4,
              typeOfCalculatorSelected:
                allPropsScreen1.typeOfCalculatorSelected,
            }}
          />
        </div>
        {isLoading ? (
          <Loader isLoading={isLoading} />
        ) : (
          <>
            {calculatorState.currentFormNumber === 1 && (
              <div className="col-md-8">
                <div className="formView">
                  <Screen1 {...allPropsScreen1} />
                </div>
              </div>
            )}
            {calculatorState.currentFormNumber === 2 && (
              <div className="formView">
                <Screen2 {...allPropsScreen2} />
              </div>
            )}
            {calculatorState.currentFormNumber === 3 && (
              <div className="col-md-7">
                <div className="formView">
                  <Screen4 {...allPropsScreen4} props={allPropsScreen2}/>          
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Calculator;

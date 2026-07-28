import Cookies from "js-cookie";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../actions/userActions";
import { clearClientDetailsFromFileAction } from "../../actions/matterActions";
import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import useAPI from "../../hooks/useAPI";
// @ts-ignore
import useQuery from "../../hooks/useQuery";
import { Store } from "../../store/store";
import { getAllUserInfo, getUserSID } from "../../utils/helpers";
import Restruction from "./screen4/Restruction";
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
import { FormInformation } from "../../utils/Apis/matters/CustomHook/PDFData.jsx";
import { fetchRequest } from "../../utils/fetchRequest";
import CONSTANTS from "./TollTipConstants.js";

const Calculator = () => {
  const dispatch = useDispatch();
  const [calculatorState, setCalculatorState] = useState({
    currentFormNumber: 1,
    label: getCalculatorLabelFromCookies()?.label ?? "",
    description: getCalculatorLabelFromCookies()?.description ?? "",
    savedBy: getAllUserInfo()?.username ?? "",
  });
  const dateRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/g;
  const { data } = useSelector((state: Store) => state.clientDetailsFromFile);
  const { userInfo } = useSelector((state: Store) => state.userLogin);
  const activeForm = useQuery();
  const initialState = {
    matter_data: {
      financial_year_expenses: null,
      financial_year_income_benefits: "",
      valuation_date: null,
      matter_id: "",
    },
    court_info: {
      courtName: "",
      courtFileNumber: "",
      courtOfficeAddress: "",
    },
    applicant: {
      fullLegalName: "",
      address: "",
      phoneAndFax: "",
      email: "",
      province: "",
      municipality: "",
      dateOfBirth: "",
    },
    applicantsLawyer: {
      fullLegalName: "",
      address: "",
      phoneAndFax: "",
      email: "",
    },
    respondent: {
      fullLegalName: "",
      address: "",
      phoneAndFax: "",
      email: "",
      province: "",
      municipality: "",
      dateOfBirth: "",
    },
    respondentsLawyer: {
      fullLegalName: "",
      address: "",
      phoneAndFax: "",
      email: "",
    },
    theChildren: [
      {
        fullLegalName:"",
        birthdate:"",
        nowLivingWith:""
      }
    ],
    expenses: {
      client: {
        automaticDeductions: {},
        housing: {},
        utilities: {},
        householdExpenses: {},
        childcare: {},
        transportation: {},
        health: {},
        personal: {},
        other: {},
        totalMonthlyExpenses: 0,
        totalYearlyExpenses: 0,
      },
      opposingParty: {
        automaticDeductions: {},
        housing: {},
        utilities: {},
        householdExpenses: {},
        childcare: {},
        transportation: {},
        health: {},
        personal: {},
        other: {},
        totalMonthlyExpenses: 0,
        totalYearlyExpenses: 0,
      },
    },
    specialExpenses: {
      client: [],
      opposingParty: [],
    },
    applicationType: {},
    assets: {
      dateOfMarriage: "",
      dateOfValuation: null,
      dateOfCommencement: "",
      land: [],
      household: [],
      bank: [],
      life: [],
      interests: [],
      moneyOwed: [],
      otherProperty: [],
      debts: [],
      property: {},
      excluded: {
        category: "",
        details: "",
        onValuationDate: "",
        total: "",
      },
      disposed: {
        category: "",
        details: "",
        onValuationDate: "",
        total: "",
      },
      calculations: {
        allProperty: "",
        subtractDeductions: {
          deductions: "",
          balance: "",
        },
        subtractExcluded: {
          deductions: "",
          balance: "",
        },
        netFamilyProperty: "",
      },
      totalValue: 0,
    },
    debts: {
      totalValue: 0,
    },
    income: {
      client: {
        employmentIncome: "",
        commissionTipsBonuses: "",
        selfEmploymentIncome: "",
        employmentInsuranceBenefits: "",
        workersCompensationBenefits: "",
        socialAssistanceIncome: "",
        interestInvestmentIncome: "",
        pensionIncome: "",
        spousalSupport: "",
        childTaxBenefits: "",
        otherIncome: "",
      },
      opposingParty: {
        employmentIncome: "",
        commissionTipsBonuses: "",
        selfEmploymentIncome: "",
        employmentInsuranceBenefits: "",
        workersCompensationBenefits: "",
        socialAssistanceIncome: "",
        interestInvestmentIncome: "",
        pensionIncome: "",
        spousalSupport: "",
        childTaxBenefits: "",
        otherIncome: "",
      },
    },
    benefits: {
      client: {
        medicalInsuranceCover: "",
        companyCar: "",
        useOfRoom: "",
        otherBenefit: "",
      },
      opposingParty: {
        medicalInsuranceCover: "",
        companyCar: "",
        useOfRoom: "",
        otherBenefit: "",
      },
    },
    relationshipDates: {
      marriedOn: {
        checked: false,
        date: "",
      },
      startedLivingTogetherOn: {
        checked: false,
        date: "",
      },
      separatedOn: {
        checked: false,
        date: "",
      },
      isNeverLivedTogether: {
        checked: "",
      },
      placeOfMarriage: "",
    },
    filledBy: "",
    filler: {
      fullLegalName: "",
      province: "",
    },
    employmentStatus: {},
    otherIncomeEarners: {
      liveAlone: false,
      isLivingWith: false,
      livingWith: "",
      isAdults: false,
      adults: "",
      isChildren: false,
      children: 0,
      partner: {
        isWorks: "",
        worksAt: "",
        isEarns: "",
        earns: "",
        earnsPer: "",
        contributions: "",
        contributionsPer: "",
      },
    },
  };

  const [matterData, setMatterData] = useState(initialState);
  
  const getCurrentStepFromQuery = (): number => {
    const step = activeForm.get("step");
    return step ? parseInt(step) : 1;
  };

  const getCurrentIdFromQuery = (): number | null => {
    const id = getCalculatorIdFromQuery(activeForm);

    Cookies.set("calculatorId", JSON.stringify(id), { path: "/" });

    return id ? parseInt(id) : null;
  };

  const storedMatterId = JSON.parse(localStorage.getItem('selectedCalculatorMatterNumber') || '""');
  const matter_id = useSelector((state: Store) => state.matter.matterId) || storedMatterId;


  const { documentInfo, loading } =  FormInformation(matter_id);
  
  useEffect(() => {
    if (documentInfo) {
      setMatterData(documentInfo);
    }
  }, [loading, documentInfo])

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
      numberOfChildren:
        typeOfCalculatorSelected === SPOUSAL_SUPPORT_CAL ? 0 : 1,
      numberOfChildrenWithAdultChild:
        typeOfCalculatorSelected === SPOUSAL_SUPPORT_CAL
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
  console.log("screen2 bef",screen2)

  useEffect(() => {
    if (matterData) {
      setBackground(prevBackground => ({
        ...prevBackground,
        party1FirstName: matterData?.applicant.fullLegalName || "Party 1",
        party2FirstName: matterData.respondent.fullLegalName || "Party 2",
        party1LastName: matterData.applicant.fullLegalName.split(' ').pop() || "",
        party2LastName: matterData.respondent.fullLegalName.split(' ').pop() || "",
        party1DateOfBirth: matterData.applicant.dateOfBirth,
        party2DateOfBirth: matterData.respondent.dateOfBirth || "",
        party1province:  "ON",
        party2province:  "ON",
        party1LiveInOntario: matterData.applicant.province === "ON" ? "Yes" : "No",
        party2LiveInOntario: matterData.respondent.province === "ON" ? "Yes" : "No",
      }));

      setAboutTheRelationship({
        dateOfMarriage: matterData?.relationshipDates.marriedOn.date,
        dateOfSeparation: matterData?.relationshipDates.separatedOn.date,
      });

      if (matterData.theChildren) {
        setAboutTheChildren(prevState => ({
          ...prevState,
          numberOfChildren: matterData.theChildren.length,
          numberOfChildrenWithAdultChild: matterData.theChildren.length,

          childrenInfo: matterData.theChildren.map(child => ({
            name: child.fullLegalName,
            dateOfBirth: child.birthdate,
            custodyArrangement: "",
            childHasDisability: "No",
            childOfRelationship: "Yes",
            adultChildStillALegalDependant: "Yes",
            childIncome: 0,
            CSGTable: "Yes",
            ChildSupportOverride: 0,
            numberOfYearsOfStartingSchool: 0,
            numberOfYearsOfFinishingSchool: 0,
          })),
        }));
      }

      // Prefill screen 2 income data from matter records
      if (matterData.income) {
        setScreen2(prevState => {
          const processIncome = (partyData, initialPartyData) => {
            if (!partyData) return initialPartyData;
            const newIncome = Object.entries(partyData)
              .filter(([, amount]) => amount !== "" && amount !== "0" && amount != null)
              .map(([label, amount]) => ({
                label,
                amount: String(amount),
                value: String(amount),
                tooltip: CONSTANTS[label] || "",
              }));
            return newIncome.length > 0 ? newIncome : initialPartyData;
          };

          return {
            ...prevState,
            income: {
              party1: processIncome(matterData.income.client, prevState.income.party1),
              party2: processIncome(matterData.income.opposingParty, prevState.income.party2),
            },
          };
        });
      }
    }
  }, [matterData]);

  const [nonTaxableincome , setNonTaxableincome] = useState({
    party1:  [{ label: "", amount: "0", value: "", tooltip: "" }],
    party2:  [{ label: "", amount: "0", value: "", tolltip: "" }],
  })

  const [allApiDataCal ,setAllApiDataCal] = useState(null);
  console.log("allApiDataCalallApiDataCal",allApiDataCal);
  


  const [screen3, setScreen3] = useState({});
  const [screen4, setScreen4] = useState({});

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


  let restructionbtnref = useRef(null)

  const CalculateRefFOrRestruction=()=>{
    restructionbtnref?.current?.click();
  } 
  

  


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

    // Only a saved calculation (?id=... in the URL) has server data to load.
    // A fresh calculator must not block on the legacy backend at all —
    // otherwise opening /calculator hangs on a dead /v1 host.
    if (getCurrentIdFromQuery() === null) {
      return () => {
        dispatch(toggleSidebar());
        dispatch(clearClientDetailsFromFileAction());
        Cookies.remove("calculatorLabel");
      };
    }

    requestAction()
      .then((res) => {
        // Fetch failed (backend down / calculation not found): keep the
        // fresh-calculator state instead of crashing on missing data.
        if (!res?.data?.[0]) return;
        const { data, label, description, created_by } = res.data[0];

        const dataParsing = JSON.parse(data);
        console.log("dataParsing",dataParsing)
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
       

        setNonTaxableincome((prev)=>({
            ...prev,
            party1:dataParsing.nonTaxableincome.party1,
            party2:dataParsing.nonTaxableincome.party2
        }))
        
       

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
      .catch((err) =>  console.log("err", err));

    return () => {
      dispatch(toggleSidebar());
      dispatch(clearClientDetailsFromFileAction());
      Cookies.remove("calculatorLabel");
    };
  }, []);

  // ── Load previously saved calculator state from the matter's DB record ──
  useEffect(() => {
    if (!matter_id || getCurrentIdFromQuery() !== null) return; // skip if loading a legacy saved calc
    fetchRequest("get", `get_single_matter_data/${getUserSID()}/${matter_id}/calculatorState`)
      .then(({ data }) => {
        const rows = data?.data?.body ?? data?.data ?? [];
        const saved = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        if (!saved) return;
        console.log("[Calculator] Restoring calculator state from DB");

        if (saved.background) setBackground((prev) => ({ ...prev, ...saved.background }));
        if (saved.aboutTheChildren) setAboutTheChildren(saved.aboutTheChildren);
        if (saved.aboutTheRelationship) setAboutTheRelationship(saved.aboutTheRelationship);
        if (saved.calculator_type) setTypeOfCalculatorSelected(saved.calculator_type);

        setScreen2((prev) => ({
          ...prev,
          ...(saved.income && { income: saved.income }),
          ...(saved.undueHardshipIncome && { undueHardshipIncome: saved.undueHardshipIncome }),
          ...(saved.benefits && { benefits: saved.benefits }),
          ...(saved.deductions && { deductions: saved.deductions }),
          ...(saved.tax_year != null && { tax_year: saved.tax_year }),
          ...(saved.guidelineIncome && { guidelineIncome: saved.guidelineIncome }),
          ...(saved.specialExpensesArr && { specialExpensesArr: saved.specialExpensesArr }),
          ...(saved.otherhouseholdmember && { otherhouseholdmember: saved.otherhouseholdmember }),
          ...(saved.canadaChildBenefitFixed && { canadaChildBenefitFixed: saved.canadaChildBenefitFixed }),
          ...(saved.ChildDisabilityBenefitFixed && { ChildDisabilityBenefitFixed: saved.ChildDisabilityBenefitFixed }),
          ...(saved.ClimateActionBenefitFixed && { ClimateActionBenefitFixed: saved.ClimateActionBenefitFixed }),
          ...(saved.provChildBenefitFixed && { provChildBenefitFixed: saved.provChildBenefitFixed }),
          ...(saved.GSTHSTBenefitFixed && { GSTHSTBenefitFixed: saved.GSTHSTBenefitFixed }),
          ...(saved.salesTaxBenefitFixed && { salesTaxBenefitFixed: saved.salesTaxBenefitFixed }),
          ...(saved.basicPersonalAmountFederalFixed && { basicPersonalAmountFederalFixed: saved.basicPersonalAmountFederalFixed }),
          ...(saved.basicPartyDisabilityFixed && { basicPartyDisabilityFixed: saved.basicPartyDisabilityFixed }),
          ...(saved.basicPartyDisabilityProvFixed && { basicPartyDisabilityProvFixed: saved.basicPartyDisabilityProvFixed }),
          ...(saved.amountForEligibleDependentFixed && { amountForEligibleDependentFixed: saved.amountForEligibleDependentFixed }),
          ...(saved.baseCPPContributionFixed && { baseCPPContributionFixed: saved.baseCPPContributionFixed }),
          ...(saved.eiPremiumFixed && { eiPremiumFixed: saved.eiPremiumFixed }),
          ...(saved.canadaEmploymentAmountFixed && { canadaEmploymentAmountFixed: saved.canadaEmploymentAmountFixed }),
          ...(saved.basicPersonalAmountProvincialFixed && { basicPersonalAmountProvincialFixed: saved.basicPersonalAmountProvincialFixed }),
          ...(saved.amountForEligibleDependentProvincialFixed && { amountForEligibleDependentProvincialFixed: saved.amountForEligibleDependentProvincialFixed }),
        }));

        if (saved.nonTaxableincome) {
          setNonTaxableincome(saved.nonTaxableincome);
        }
        if (saved.undueHardship) {
          setundueHardship(saved.undueHardship);
        }
      })
      .catch((err) => {
        console.warn("[Calculator] Failed to load calculator state:", err);
      });
  }, [matter_id]);

  // ── Restore state from a saved MatterCalculationReport ("View Calculation") ──
  useEffect(() => {
    const raw = localStorage.getItem("viewCalculationData");
    if (!raw) return;
    localStorage.removeItem("viewCalculationData");

    try {
      const saved = JSON.parse(raw);
      const input = saved.inputData || {};
      const full = input._fullState; // present for manual-calculator saves

      if (full) {
        // Full restore from manual calculator save
        if (full.background) setBackground((prev) => ({ ...prev, ...full.background }));
        if (full.aboutTheChildren) setAboutTheChildren(full.aboutTheChildren);
        if (full.aboutTheRelationship) setAboutTheRelationship(full.aboutTheRelationship);
        if (full.calculator_type) setTypeOfCalculatorSelected(full.calculator_type);
        if (full.screen2) {
          setScreen2((prev) => ({ ...prev, ...full.screen2 }));
        }
      } else {
        // Partial restore from AI chat saves (limited fields)
        if (input.party1_name || input.party2_name) {
          setBackground((prev) => ({
            ...prev,
            party1FirstName: input.party1_name || prev.party1FirstName,
            party2FirstName: input.party2_name || prev.party2FirstName,
          }));
        }
        const p1Income = input.party1_income || input.party1_gross_income;
        const p2Income = input.party2_income || input.party2_gross_income;
        if (p1Income || p2Income) {
          setScreen2((prev) => ({
            ...prev,
            income: {
              party1: [{ label: "Employment Income", amount: String(p1Income || 0), value: String(p1Income || 0) }],
              party2: [{ label: "Employment Income", amount: String(p2Income || 0), value: String(p2Income || 0) }],
            },
          }));
        }
        if (input.children && typeof input.children === "number" && input.children > 0) {
          setAboutTheChildren((prev) => ({
            ...prev,
            numberOfChildren: input.children,
            numberOfChildrenWithAdultChild: input.children,
          }));
        }
        // Set calculator type from calculationType field
        if (saved.calculationType === "spousal_support") {
          setTypeOfCalculatorSelected(SPOUSAL_SUPPORT_CAL);
        }
      }

      // Jump to step 2 (income screen) so user sees populated data
      setCalculatorState((prev) => ({ ...prev, currentFormNumber: 2 }));
      console.log("[Calculator] Restored state from viewCalculationData");
    } catch (err) {
      console.warn("[Calculator] Failed to restore viewCalculationData:", err);
    }
  }, []);

  // commenting out the children rendering. replaced it with other useEffect that fetches children info using matter number
  // useEffect(() => {
  //   const details = aboutTheChildren.childrenInfo;
  //   const totalNumberOfChildren = Number(
  //     aboutTheChildren.numberOfChildrenWithAdultChild
  //   );
  //   const currentNumberOfChildren = aboutTheChildren.childrenInfo.length;
  //   const remainingChildren = totalNumberOfChildren - currentNumberOfChildren;
  //   aboutTheChildren.numberOfChildren = totalNumberOfChildren;

  //   const childDetails = [];
  //   if (totalNumberOfChildren >= 0 && totalNumberOfChildren <= 10) {
  //     for (let i = 0; i < totalNumberOfChildren; i++) {
  //       childDetails.push(
  //         new newChildInfo(
  //           `Child ${i + 1}`,
  //           details[i]?.dateOfBirth,
  //           details[i]?.custodyArrangement
  //         )
  //       );
  //     }
  //     setAboutTheChildren({ ...aboutTheChildren, childrenInfo: childDetails });
  //   } else {
  //     setAboutTheChildren({
  //       ...aboutTheChildren,
  //       childrenInfo: childDetails,
  //       numberOfChildrenWithAdultChild: 10,
  //     });
  //   }

  //   // if (totalNumberOfChildren >= 0 && totalNumberOfChildren <= 10) {
  //   //   if (remainingChildren > 0) {
  //   //     for (let i = 0; i < remainingChildren; i++) {
  //   //       details.push(
  //   //         new newChildInfo(`Child ${currentNumberOfChildren + 1}`, "", "")
  //   //       );
  //   //     }
  //   //   } else {
  //   //     for (let i = 0; i < Math.abs(remainingChildren); i++) {
  //   //       details.pop();
  //   //     }
  //   //   }

  //   //   setAboutTheChildren({ ...aboutTheChildren, childrenInfo: details });
  //   // } else {
  //   //   setAboutTheChildren({
  //   //     ...aboutTheChildren,
  //   //     numberOfChildrenWithAdultChild: 10,
  //   //   });
  //   // }
  // }, [aboutTheChildren.numberOfChildrenWithAdultChild]);

  useEffect(() => {
    const details = aboutTheChildren.childrenInfo;
    const totalNumberOfChildren = Number(
      aboutTheChildren.numberOfChildrenWithAdultChild
    );
    const currentNumberOfChildren = aboutTheChildren.childrenInfo.length;
    const remainingChildren = totalNumberOfChildren - currentNumberOfChildren;

    // Ensure the number of children stays within a reasonable range
    const maxChildren = 10;
    const safeTotalNumberOfChildren = Math.min(totalNumberOfChildren, maxChildren);

    // update the number of children to the safe value 
    setAboutTheChildren(prevState => ({
      ...prevState,
      numberOfChildren: safeTotalNumberOfChildren,
      numberOfChildrenWithAdultChild: safeTotalNumberOfChildren,
    }));

    const childDetails = [];

    if (safeTotalNumberOfChildren >= 0) {
      for (let i = 0; i < safeTotalNumberOfChildren; i++) {
        // Reuse existing data if available, otherwise create a new child
        const existingChild = details[i];
        childDetails.push(
          existingChild ? {
            ...existingChild,
            name: existingChild.name || `Child ${i + 1}`, // Keep existing name or default
          } :
            new newChildInfo(
              `Child ${i + 1}`,
              "", // Initial date of birth
              ""  // Initial custody arrangement
            )
        );
      }
      setAboutTheChildren(prevState => ({ ...prevState, childrenInfo: childDetails }));
    }
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
    settingScreen4StateFromChild: settingScreen4StateFromChild,
    screen1: screen1Props(),
    screen2: screen2,
    screen3: screen3,
    lumpsum:lumpsum,
    lifeInsurence:lifeInsurence,
    includeLumpsum :includeLumpsum , 
    includeLifeInsurence:includeLifeInsurence,
    scenarios:
    scenarios, setScenarios :  setScenarios,
    restructioring:restructioring, setRestructioring:setRestructioring
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
    <Layout title={`Welcome ${userInfo?.username ? userInfo.username : ""}`}>
      <h5 className="calcTitle">{renderTypeOfCalculationSelected()}</h5>
      <div className="lawCalculator justify-content-center">
        <div className="status">
          <StepNumber
            activeFormNumber={calculatorState.currentFormNumber}
            calculatorId={getCurrentIdFromQuery()}
            matterId={matter_id}
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
                  {/* <Restruction {...allPropsScreen2  } /> */}
                  {/* <Restruction {...allPropsScreen2  } />
                  <button onClick={CalculateRefFOrRestruction}>Calculate</button> */}
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

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { dynamicValuesAction } from "../../../../actions/dynamicValuesAction";
import Loader from "../../../../components/Loader";
import useQuery from "../../../../hooks/useQuery";
import { AUTH_ROUTES } from "../../../../routes/Routes.types";
import { apiCalculatorById } from "../../../../utils/Apis/calculator/Calculator_values_id";
import { SaveAllCalculatorValuesByID } from "../../../../utils/Apis/calculator/SaveAllCalculatorValuesByID";
import { getDistinctYearsInTaxRef } from "../../../../utils/Apis/getDistinctYearsInTaxRef";
import {
  addAllNumbersInArr,
  render0IfValueIsNegative,
} from "../../../../utils/helpers";
import { formulaForChildBenefit } from "../../../../utils/helpers/calculator/ChildBenefit/ChildBenefit";
import InputCustom from "../../../../components/InputCustom";
import CONSTANTS from "../../TollTipConstants";

import {
  ageAmountFormula,
  allInfo,
  amountForEligibleDependent,
  amountForEligibleDependentOntario,
  baseCPPContribution,
  basicPersonalAmountFederalFormula,
  basicPersonalAmountOntario,
  calculateAllCreditsInterface,
  canadaEmploymentAmount,
  dynamicValues,
  EIPremiums,
  basicDisabilityAmountFormula,
  basicDisabilityAmountFormulaProv,
  maximumChildLivesWith,
} from "../../../../utils/helpers/calculator/creditTaxCalculationFormulas";

import { determineFederalTaxForAllProv } from "../../../../utils/helpers/calculator/FederalTax/FederalTax";
import {
  determineProvTaxAB,
  determineProvTaxBC,
  determineProvTaxON,
  IProvincialTaxAB,
} from "../../../../utils/helpers/calculator/ProvincialTax/provincialTax";
import {
  formulaEnhancedCPPdeduction,
  formulaForCalculatingDurationOfSupport,
  formulaForCanadaChildBenefit,
  formulaForChildSupport,
  formulaForGSTHSTBenefits,
  formulaForOntarioSalesTax,
  formulaForProvincialCredits,
  lowIncomeCredit,
  spousalSupportFormulaByRate,
  formulaForChildDisabilityBenefit,
} from "../../../../utils/helpers/calculator/taxCalculationFormula";
import { CanadaWorkersBenefitFormula } from "../../../../utils/helpers/calculator/WorkersBenefit/workersBenefits";
import { momentFunction } from "../../../../utils/moment";
import {
  backgroundState,
  calculatorScreen2State,
  CUSTODIAL_FORMULA,
  getCalculatorIdFromQuery,
  ItypeOfSplitting,
  Province,
} from "../../Calculator";

import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../../screen1/Screen1";
import {
  determineTypeOfSplitting,
  getNumberOfChildrenWithParty1,
  getNumberOfChildrenWithParty2,
} from "../Screen4";
import {
  childSupportValuesFor,
  fetchChildSupportDetails,
} from "../childInfo.service";
import {
  climateActionIncentiveAB,
  climateActionIncentiveBC,
  climateActionIncentiveON,
} from "../climateAction.service";
import {
  convertArrToObj,
  CSGOverrideValues,
  determineWhichPartyHasGreaterIncomeAndChild,
  fetchAllValuesFromDB,
  filterDeductionsOtherThanSpecialExpenses,
  filterEmployedIncome10100AndSum,
  filterFederalCreditsAndSum,
  filterProvincialCreditsAndSum,
  filterSelfEmployedIncomeAndSum,
  findRateForFederalTax,
  IFixedValues,
  ifSharedDivideBy2,
  mapAmountFieldAndTotal,
  noOfChildrenForBenefits,
  noOfSharedChildrenInHybrid,
  partyIncomeAndAmount,
  separateValuesDB,
  totalNumberOfChildren,
  twoPartyStates,
} from "./Restructuring";

import "./Restructuring.css"


type Props = {
  settingScreen2StateFromChild: (obj: any) => void;
  screen1: {
    background: backgroundState;
    aboutTheRelationship: aboutTheRelationshipState;
    aboutTheChildren: aboutYourChildrenState;
  };
  screen2: calculatorScreen2State;
  calculatorState: {
    savedBy: string;
    label: string;
    description: string;
    currentFormNumber: number;
  };
  typeOfCalculatorSelected: string;
  setBackground: any;
  calpercentageRef: any;
  specificamount: any;
  specialExpensePercentage: any;
  valueswithoutSpousalSupport: any;
  lumpsum: any,
  lifeInsurence: any,
  includeLumpsum: any,
  includeLifeInsurence: any,
  taxeswithAddSupport: any, settaxeswithAddSupport: any,
  scenarios: any,
  setScenarios: any,
  restructioringTaxState: any,
  restructionbtnref: any,
  handleChildData: any,
  scenarioKey:any
};

const Restructuring = ({
  screen1,
  screen2,
  calpercentageRef,
  specificamount,
  valueswithoutSpousalSupport,
  setScenarios,
  handleChildData,
  scenarioKey, scenarios,
  lumpsum,
  lifeInsurence,

}: Props) => {
  const calculatorId = useQuery();
  const dispatch = useDispatch();

  console.log("calpercentageRefinrestructiion",calpercentageRef)


  const {
    data: { province },
  } = useSelector((state) => state.dynamicValues);

  const [rows, setRows] = useState([{ cashFlows: 0, duration: 0 }]);
  const [resResultAFterCal ,setresResultAFterCal] = useState('')
  const [discountRate, setDiscountRate] = useState(1.3);

  
  const spousalSupportGivenTo = () => {
    return spousalSupportMed.current.party1 > spousalSupportMed.current.party2
      ? party1Name()
      : party2Name();
  };


  const globallowSupport = useRef(0);
  const globalmedSupport = useRef(0);
  const globalhighSupport = useRef(0);



  const fixedObj = {
    party1: { value: 0, isFixed: false },
    party2: { value: 0, isFixed: false },
  };

  //edited and fixed values.
  const [canadaChildBenefitFixed, setCanadaChildBenefitFixed] =
    useState<IFixedValues>(
      screen2?.canadaChildBenefitFixed
        ? screen2?.canadaChildBenefitFixed
        : fixedObj
    );

  const [ChildDisabilityBenefitFixed, setChildDisabilityBenefitFixed] =
    useState<IFixedValues>(
      screen2?.ChildDisabilityBenefitFixed
        ? screen2?.ChildDisabilityBenefitFixed
        : fixedObj
    );

  const [provChildBenefitFixed, setProvChildBenefitFixed] =
    useState<IFixedValues>(
      screen2?.provChildBenefitFixed ? screen2?.provChildBenefitFixed : fixedObj
    );




  const [GSTHSTBenefitFixed, setGSTHSTBenefitFixed] = useState<IFixedValues>(
    screen2?.GSTHSTBenefitFixed ? screen2?.GSTHSTBenefitFixed : fixedObj
  );

  const [ClimateActionBenefitFixed, setClimateActionBenefitFixed] =
    useState<IFixedValues>(
      screen2?.ClimateActionBenefitFixed
        ? screen2?.ClimateActionBenefitFixed
        : fixedObj
    );

  const [salesTaxBenefitFixed, setSalesTaxBenefitFixed] =
    useState<IFixedValues>(
      screen2?.salesTaxBenefitFixed ? screen2?.salesTaxBenefitFixed : fixedObj
    );

  const [basicPersonalAmountFederalFixed, setBasicPersonalAmountFederalFixed] =
    useState<IFixedValues>(
      screen2?.basicPersonalAmountFederalFixed
        ? screen2?.basicPersonalAmountFederalFixed
        : fixedObj
    );

  const [basicPartyDisabilityFixed, setbasicPartyDisabilityFixed] =
    useState<IFixedValues>(
      screen2?.basicPartyDisabilityFixed
        ? screen2?.basicPartyDisabilityFixed
        : fixedObj
    );

  const [basicPartyDisabilityProvFixed, setbasicPartyDisabilityProvFixed] =
    useState<IFixedValues>(
      screen2?.basicPartyDisabilityProvFixed
        ? screen2?.basicPartyDisabilityProvFixed
        : fixedObj
    );

  const [amountForEligibleDependentFixed, setAmountForEligibleDependentFixed] =
    useState<IFixedValues>(
      screen2?.amountForEligibleDependentFixed
        ? screen2?.amountForEligibleDependentFixed
        : fixedObj
    );

  const [baseCPPContributionFixed, setBaseCPPContributionFixed] =
    useState<IFixedValues>(
      screen2?.baseCPPContributionFixed
        ? screen2?.baseCPPContributionFixed
        : fixedObj
    );

  const [eiPremiumFixed, setEiPremiumFixed] = useState<IFixedValues>(
    screen2?.eiPremiumFixed ? screen2?.eiPremiumFixed : fixedObj
  );

  const [canadaEmploymentAmountFixed, setCanadaEmploymentAmountFixed] =
    useState<IFixedValues>(
      screen2?.canadaEmploymentAmountFixed
        ? screen2?.canadaEmploymentAmountFixed
        : fixedObj
    );

  const [
    basicPersonalAmountProvincialFixed,
    setBasicPersonalAmountProvincialFixed,
  ] = useState<IFixedValues>(
    screen2?.basicPersonalAmountProvincialFixed
      ? screen2?.basicPersonalAmountProvincialFixed
      : fixedObj
  );

  const [
    amountForEligibleDependentProvincialFixed,
    setAmountForEligibleDependentProvincialFixed,
  ] = useState<IFixedValues>(
    screen2?.amountForEligibleDependentProvincialFixed
      ? screen2?.amountForEligibleDependentProvincialFixed
      : fixedObj
  );


  const [guidelineIncome, setGuidelineIncome] = useState({
    party1: screen2?.guidelineIncome
      ? screen2.guidelineIncome.party1
      : [{ label: "", amount: "0", value: "", tooltip: "" }],
    party2: screen2?.guidelineIncome
      ? screen2.guidelineIncome.party2
      : [
        {
          label: "",
          amount: "0",
          value: "",
          tooltip: "",
        },
      ],
  });

  const [specialExpensesArr, setSpecialExpensesArr] = useState({
    party1: screen2?.specialExpensesArr
      ? screen2.specialExpensesArr.party1
      : [{ label: "", amount: "0", value: "", child: "", tooltip: "" }],
    party2: screen2?.specialExpensesArr
      ? screen2.specialExpensesArr.party2
      : [
        {
          label: "",
          amount: "0",
          value: "",
          child: "",
          tooltip: "",
        },
      ],
  });

  const [income, setIncome] = useState({
    party1: screen2?.income
      ? screen2.income.party1
      : [{ label: "", amount: "0", value: "", tooltip: "" }],
    party2: screen2?.income?.party2
      ? screen2.income.party2
      : [{ label: "", amount: "0", value: "", tolltip: "" }],
  });

  const [deductions, setDeductions] = useState({
    party1: screen2?.deductions
      ? screen2.deductions.party1
      : [
        {
          label: "",
          amount: "0",
          value: "",
        },
      ],
    party2: screen2?.deductions
      ? screen2.deductions.party2
      : [
        {
          label: "",
          value: "",
          amount: "0",
        },
      ],
  });
  const [benefits, setBenefits] = useState({
    party1: screen2?.benefits
      ? screen2.benefits.party1
      : [
        {
          label: "",
          amount: "0",
          value: "",
        },
      ],
    party2: screen2?.benefits
      ? screen2.benefits.party2
      : [
        {
          label: "",
          amount: "0",
          value: "",
        },
      ],
  });

  interface IBenefitsForParties {
    party1: { fed: partyIncomeAndAmount[]; prov: partyIncomeAndAmount[] };
    party2: { fed: partyIncomeAndAmount[]; prov: partyIncomeAndAmount[] };
  }

 
  //Type of splitting for children, it will determine which type of calculation case we are going to use.
  const [typeOfSplitting, setTypeOfSplitting] =
    useState<ItypeOfSplitting>("SPLIT");

  
  const [distinctYears, setDistinctYears] = useState({
    allYears: [{ year: 0 }],
    selectedYear: 0,
  });


 

  let marginalTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const marginalReciprocalTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const [fetchedFederalValuesDB, setFetchedFederalValuesDB] = useState<
    Object[]
  >([]);
  const [fetchedProvincialTaxDB, setFetchedProvincialTaxDB] = useState<
    Object[]
  >([]);
  const [fetchedHealthTaxDB, setFetchedHealthTaxDB] = useState<Object[]>([]);
  const [fetchedONCareTaxDB, setFetchedONCareTaxDB] = useState<Object[]>([]);
  const [fetchedONMrateTaxDB, setFetchedONMrateTaxDB] = useState<Object[]>([]);
  const [fetchedDynamicValues, setFetchedDynamicValues] =
    useState<dynamicValues>({
      AmountForEligibleDependentFed: 0,
      AmountForEligibleDependentOntario: 0,
      BaseCPPLimit: 0,
      BasicPersonalAmountFed: 0,
      BasicPersonalAmountOntario: 0,
      CanadaEmploymentAmountLimit: 0,
      ChildBenefitDeduction: 0,
      ChildBenefitBasic: 0,
      EILimit: 0,
      EnhancedCPPDeductionLimit: 0,
      EnhancedCPPDeductionRate: 0,
      SelfEmployedEnhCPPRate: 0,
      SelfEmployedEnhCPPThreshold: 0,
      ChildBenefitBaseAmountLess6: 0,
      ChildBenefitBaseAmountMore6: 0,
      ChildBenefitBase3ChildAmt: 0,
      ChildBenefitBase4ChildAmt: 0,
      ChildBenefitBase1ChildAmt: 0,
      ChildBenefitBase2ChildAmt: 0,
      ChildBenefitBaseAddlChildAmt: 0,
      ChildBenefitThreshold1ChildAmt: 0,
      ChildBenefitThreshold2ChildAmt: 0,
      ChildBenefitThresholdAddlChildAmt: 0,
      ChildBenefitWorking1ChildAmt: 0,
      ChildBenefitWorking2ChildAmt: 0,
      ChildBenefitThresholdofBase: 0,
      ChildBenefitThresholdofWorking: 0,
      ChildBenefitWorking3ChildAmt: 0,
      ChildBenefitWorking4ChildAmt: 0,
      CAChildBenefitBase4Child: 0,
      CAChildBenefitBase1Child: 0,
      CAChildBenefitBase2Child: 0,
      CAChildBenefitBase3Child: 0,
      CAChildBenefitReduHighThreshold: 0,
      CAChildBenefitReduLowerThreshold: 0,
      CAWorkerBenefitFamMax: 0,
      CAWorkerBenefitSingleMax: 0,
      CAWorkerBenefitFamThreshold: 0,
      CAWorkerBenefitSingleThreshold: 0,
      EIRate: 0,
      AgeAmtBase: 0,
      AgeAmtLowerThreshold: 0,
      GSTBaseCredit: 0,
      GSTDependentCredit: 0,
      GSTBaseAmount: 0,
      BCChildBenefitLowerThreshold: 0,
      BCClimateActionBasic: 0,
      BCClimateActionAddl: 0,
      BCClimateActionSingleThreshold: 0,
      BCClimateActionFamilyThreshold: 0,
      TaxReductionBase: 0,
      TaxReductionThresholdCalc: 0,
      TaxReductionThresholdEligibility: 0,
      ONSurtaxThreshold1: 0,
      ONSurtaxThreshold2: 0,
      ONTaxReductionBase: 0,
      ONTaxReductionDep: 0,
      ONLIFTAmount: 0,
      ONLIFTIndividual: 0,
      ONLIFTReductionRate: 0,
      ONSalesTaxBase: 0,
      ONSalesTaxThresholdFamily: 0,
      ONSalesTaxThresholdSingle: 0,
      ONClimateActionBase: 0,
      ONClimateActionChildUnder19: 0,
      ONClimateActionChildFirstChild: 0,
      year: 0,
      province: "",
    });

  const [fetchedChildSupportValues, setFetchedChildSupportValues] = useState(
    []
  );



  let supportReceived = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const [loading, setLoading] = useState(true);

 ;

  let taxesWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let taxesWithoutSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });



  let federalTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let enhancedCPPDeduction = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let deductableSupport = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let provincialTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let provincialCredits = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let childBenefit = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let childDisabilityBenefit = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let GSTHSTBenefit = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let OntarioChildBenefit = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let ontarioSalesTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let canadaWorkersBenefitTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });


  let climateChangeVal = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const notionalAmountRef = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const childSupportRef = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const childSupportReadOnly = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const spousalSupportMed = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const spousalSupportHigh = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });
  const spousalSupportLow = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });


  const childCareExpenses = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const [count, setCount] = useState(0);

  const [originalValues, setOriginalValues] = useState<any>({
    income: {},
    deductions: {},
    benefits: {},
    enhancedCPPDeductionParty1: 0,
    enhancedCPPDeductionParty2: 0,
    federalTaxParty1: 0,
    federalTaxParty2: 0,
    provincialTaxParty1: 0,
    provincialTaxParty2: 0,
    provincialCreditsParty1: 0,
    provincialCreditsParty2: 0,
    canadaChildBenefitParty1: childBenefit.current.party1,
    canadaChildBenefitParty2: childBenefit.current.party2,
    canadaChildDisabilityBenefitParty1: childDisabilityBenefit.current.party1,
    canadaChildDisabilityBenefitParty2: childDisabilityBenefit.current.party2,
    gstHstBenefitParty1: 0,
    gstHstBenefitParty2: 0,
    ontarioChildBenefitParty1: 0,
    ontarioChildBenefitParty2: 0,
    ontarioSalesTaxParty1: 0,
    ontarioSalesTaxParty2: 0,
    ageAmountParty1: 0,
    ageAmountParty2: 0,
    totalFederalCreditsParty1: 0,
    totalFederalCreditsParty2: 0,
    totalOntarioCreditsParty1: 0,
    totalOntarioCreditsParty2: 0,
    taxableIncomeAfterSupportParty1: 0,
    taxableIncomeAfterSupportParty2: 0,
    totalTaxesParty1: 0,
    totalTaxesParty2: 0,
    totalBenefitsParty1: 0,
    totalBenefitsParty2: 0,
    specialExpenses: {
      party1: 0,
      party2: 0,
    },
    childCareExpenses: {
      party1: 0,
      party2: 0,
    },
  });


  const specialExpensesRef = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });


  let allCreditsParty1 = useRef<calculateAllCreditsInterface>({
    basicPersonalAmountFederal: 0,
    ageAmount: 0,
    amountForEligibleDependent: 0,
    baseCPPContribution: 0,
    EIPremiums: 0,
    canadaEmploymentAmount: 0,
    basicPersonalAmountOntario: 0,
    amountForEligibleDependentOntario: 0,
    otherFederalCredits: 0,
    otherOntarioCredits: 0,
    totalFederalCredits: 0,
    totalOntarioCredits: 0,
    disabilityCredits: 0,
    disabilityCreditsProv: 0,
  });

  let allCreditsParty2 = useRef<calculateAllCreditsInterface>({
    basicPersonalAmountFederal: 0,
    ageAmount: 0,
    amountForEligibleDependent: 0,
    baseCPPContribution: 0,
    EIPremiums: 0,
    canadaEmploymentAmount: 0,
    basicPersonalAmountOntario: 0,
    amountForEligibleDependentOntario: 0,
    otherFederalCredits: 0,
    otherOntarioCredits: 0,
    totalFederalCredits: 0,
    totalOntarioCredits: 0,
    disabilityCredits: 0,
    disabilityCreditsProv: 0,
  });


  // ====================== Background Info ===============

  const party1Name = () => {
    return screen1.background.party1FirstName;
  };

  const party2Name = () => {
    return screen1.background.party2FirstName;
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await apiCalculatorById.get_value(Number(getCalculatorIdFromQuery(calculatorId)));
      const SceneriosData = JSON.parse(data.report_data)?.scenarios;
   
      setScenarios((prevScenarios) => ({
        ...prevScenarios,
        scenario1: SceneriosData?.scenario1 ?? prevScenarios.scenario1,
        scenario2: SceneriosData?.scenario2 ?? prevScenarios.scenario2,
        scenario3: SceneriosData?.scenario3 ?? prevScenarios.scenario3,
      }));
    };

    fetchData();
  }, [Number(getCalculatorIdFromQuery(calculatorId))]);


  //======================= Income ========================

  const employedIncome10100Party1 = () => {
    return filterEmployedIncome10100AndSum(income.party1);
  };

  const employedIncome10100Party2 = () => {
    return filterEmployedIncome10100AndSum(income.party2);
  };

  const nonTaxableIncomeParty1 = () => {
    return income.party1
      .filter((p) => p.value === "14700")
      .reduce((acc, inc) => acc + parseInt(inc.amount), 0);
  };

  const nonTaxableIncomeParty2 = () => {
    return income.party2
      .filter((p) => p.value === "14700")
      .reduce((acc, inc) => acc + parseInt(inc.amount), 0);
  };

  const selfEmployedIncomeParty1 = () => {
    return filterSelfEmployedIncomeAndSum(income.party1);
  };

  const selfEmployedIncomeParty2 = () => {
    return filterSelfEmployedIncomeAndSum(income.party2);
  };

  const totalIncomeByIncomeState = (state: partyIncomeAndAmount[]) => {
    return mapAmountFieldAndTotal(state);
  };

  const getTaxableIncomeAfterSupportParty1 = () => {
    const val =
      totalIncomeByIncomeState(income.party1) +
      supportReceived.current.party1 -
      getTotalDeductionsParty1() -
      nonTaxableIncomeParty1();

    return val;
  };

  const getTaxableIncomeAfterSupportParty2 = () => {

    const val =
      totalIncomeByIncomeState(income.party2) +
      supportReceived.current.party2 -
      getTotalDeductionsParty2() -
      nonTaxableIncomeParty2();

    return val;
  };

  //=================== Credits ====================

  const totalOtherFederalCreditsParty = (data: partyIncomeAndAmount[]) => {
    return filterFederalCreditsAndSum(data);
  };

  const totalOtherOntarioCreditsParty = (data: partyIncomeAndAmount[]) => {
    return filterProvincialCreditsAndSum(data);
  };

  //canada workers benefits will not be included here.
  const getTotalDeductionsParty1 = () => {
    const specialExpenses =
      specialExpensesRef.current.party1 !== 0
        ? Math.min(
          employedIncome10100Party1() * (2 / 3),
          capAndAccumulateChildExpense(deductions.party1)
        )
        : 0;
    return (
      deductableSupport.current.party1 +
      // enhancedCPPDeduction.party1 +
      calculateEnhancedCPPDeductions(1) +
      specialExpenses +
      //totalIncomeByIncomeState(specialExpensesArr.party1) +
      filterDeductionsOtherThanSpecialExpenses(deductions.party1)
    );
  };

  const getTotalDeductionsParty2 = () => {
    const specialExpenses =
      specialExpensesRef.current.party2 !== 0
        ? Math.min(
          employedIncome10100Party2() * (2 / 3),
          capAndAccumulateChildExpense(deductions.party2)
        )
        : 0;
    return (
      deductableSupport.current.party2 +
      calculateEnhancedCPPDeductions(2) +
      // enhancedCPPDeduction.party2 +
      specialExpenses +
      //totalIncomeByIncomeState(specialExpensesArr.party2) +
      filterDeductionsOtherThanSpecialExpenses(deductions.party2)
    );
  };

  const getProvinceOfParty1 = (): Province => {
    return screen1.background.party1province;
  };

  const getProvinceOfParty2 = (): Province => {
    return screen1.background.party2province;
  };

 
  // ============== TAXES ===============

  const calculateCanadaWorkersBenefit1 = (): number => {
    const nonTaxableIncomeExist = !!income.party1.find(
      (p) => p.value === "14700"
    );
    return nonTaxableIncomeExist
      ? 0
      : CanadaWorkersBenefitFormula(
        {
          partyNum: 1,
          taxableIncome: getTaxableIncomeAfterSupportParty1(),
          aboutTheChildren: screen1.aboutTheChildren,
          totalIncome: totalIncomeByIncomeState(income.party1),
          background: screen1.background,
        },
        fetchedDynamicValues,
        screen1.background.party1province
      );
  };

  const calculateCanadaWorkersBenefit2 = (): number => {
    const nonTaxableIncomeExist = !!income.party2.find(
      (p) => p.value === "14700"
    );
    return nonTaxableIncomeExist
      ? 0
      : CanadaWorkersBenefitFormula(
        {
          partyNum: 2,
          taxableIncome: getTaxableIncomeAfterSupportParty2(),
          aboutTheChildren: screen1.aboutTheChildren,
          totalIncome: totalIncomeByIncomeState(income.party2),
          background: screen1.background,
        },
        fetchedDynamicValues,
        screen1.background.party2province
      );
  };

  const calculateCanadaWorkersBenefits = (partyNum: 1 | 2): number => {
    if (partyNum === 1) return calculateCanadaWorkersBenefit1();
    else return calculateCanadaWorkersBenefit2();
  };

  const calculateAllCanadaWorkersBenefit = () => {
    canadaWorkersBenefitTax.current = {
      party1: calculateCanadaWorkersBenefits(1),
      party2: calculateCanadaWorkersBenefits(2),
    };
  };

  const calculateCPPandEIDeductionsForSelfEmployed = (partyNum: number) => {
    // =IF(F5>0,SUM(F19:F20)+F7,0)
    if (selfEmployedIncomeParty1() > 0 && partyNum === 1) {
      return (
        EIPremiums({
          employedIncome: employedIncome10100Party1(),
          dynamicValues: fetchedDynamicValues,
        }) +
        baseCPPContribution({
          selfEmployedIncome: selfEmployedIncomeParty1(),
          employedIncome: employedIncome10100Party1(),
          dynamicValues: fetchedDynamicValues,
        }) +
        calculateEnhancedCPPDeductions(1)
      );
    } else if (selfEmployedIncomeParty2() > 0 && partyNum === 2) {
      return (
        EIPremiums({
          employedIncome: employedIncome10100Party2(),
          dynamicValues: fetchedDynamicValues,
        }) +
        baseCPPContribution({
          selfEmployedIncome: selfEmployedIncomeParty2(),
          employedIncome: employedIncome10100Party2(),
          dynamicValues: fetchedDynamicValues,
        }) +
        calculateEnhancedCPPDeductions(2)
      );
    }

    return 0;
  };


  const calculateCPPandELDeductionsForEmployed = (
    partyNum: number = 2
  ): number => {
    // =IF(F4>0,SUM(F19:F20)+F7,0)
    //removed income from if statement
    // && employedIncome10100Party1() > 0
    //&& employedIncome10100Party2() > 0
    if (partyNum === 1 && employedIncome10100Party1() > 0) {
      return (
        EIPremiums({
          employedIncome: employedIncome10100Party1(),
          dynamicValues: fetchedDynamicValues,
        }) +
        baseCPPContribution({
          employedIncome: employedIncome10100Party1(),
          selfEmployedIncome: selfEmployedIncomeParty1(),
          dynamicValues: fetchedDynamicValues,
        }) +
        +calculateEnhancedCPPDeductions(1)
      );
    } else if (partyNum === 2 && employedIncome10100Party2() > 0) {
      const EIValue = EIPremiums({
        employedIncome: employedIncome10100Party2(),
        dynamicValues: fetchedDynamicValues,
      });

      const baseCPPContributionValue = baseCPPContribution({
        employedIncome: employedIncome10100Party2(),
        selfEmployedIncome: selfEmployedIncomeParty2(),
        dynamicValues: fetchedDynamicValues,
      });

      const EnhancedCPPDeductionsValue = calculateEnhancedCPPDeductions(2);

      const total =
        baseCPPContributionValue + EIValue + EnhancedCPPDeductionsValue;

      // console.log("logs CPP and EI Deductions for Employed", total, baseCPPContribution, EnhancedCPPDeductionsValue, EIValue);

      return total;
    }

    return 0;
  };

  //===================== ASSIGN VALUES =====================


  const assignValueForSpousalSupport = (
    spousalAmount1: number,
    spousalAmount2: number,
    result: number,
    rate: number
  ) => {
  
    if (spousalAmount1 > spousalAmount2) {
      if (rate === calpercentageRef.low / 100) {
        spousalSupportLow.current.party1 = 0;
        spousalSupportLow.current.party2 = specificamount.low
          ? specificamount.low
          : result;
      } else if (rate === calpercentageRef.mid / 100) {
        spousalSupportMed.current.party1 = 0;
        spousalSupportMed.current.party2 = specificamount.mid
          ? specificamount.mid
          : result;
      } else {
        spousalSupportHigh.current.party1 = 0;
        spousalSupportHigh.current.party2 = specificamount.high
          ? specificamount.high
          : result;
      }
    } else if (spousalAmount2 > spousalAmount1) {
      if (rate === calpercentageRef.low / 100) {
        spousalSupportLow.current.party1 = specificamount.low
          ? specificamount.low
          : result;
        spousalSupportLow.current.party2 = 0;
      } else if (rate === calpercentageRef.mid / 100) {
        spousalSupportMed.current.party1 = specificamount.mid
          ? specificamount.mid
          : result;
        spousalSupportMed.current.party2 = 0;
      } else {
        spousalSupportHigh.current.party1 = specificamount.high
          ? specificamount.high
          : result;
        spousalSupportHigh.current.party2 = 0;
      }
    }
  };

  const numberOfChildrenForCalculatingChildSupport = (partyNum: number) => {
    if (typeOfSplitting === "SPLIT" || typeOfSplitting === "HYBRID") {
      if (partyNum === 1) {
        //swapping children.
        return getNumberOfChildrenWithParty2(screen1.aboutTheChildren.count);
      } else {
        return getNumberOfChildrenWithParty1(screen1.aboutTheChildren.count);
      }
    } else {
      //sending total no of children
      return totalNumberOfChildren(screen1.aboutTheChildren);
    }

  };

  const calculateDisposableIncome1WithoutEnhancedCPP = (
    childSupport: number
  ) => {
  
    const val =
      Number(totalIncomeByIncomeState(income.party1)) +
      Number(totalIncomeByIncomeState(guidelineIncome.party1)) -
      Number(calculateTotalTaxes(1)) +
      Number(sumAllBenefits(1)) -
      Number(childSupport) -
      specialExpensesRef.current.party1;

    return val;
  };

  const calculateDisposableIncome2WithoutEnhancedCPP = (
    childSupport: number
  ) => {
    const val =
      Number(totalIncomeByIncomeState(income.party2)) +
      Number(totalIncomeByIncomeState(guidelineIncome.party2)) -
      Number(calculateTotalTaxes(2)) +
      Number(sumAllBenefits(2)) -
      Number(childSupport) -
      specialExpensesRef.current.party2;

    return val;
  };

  const calculateChildSupport = () => {

    const CSGOverrideValuesParty1 = CSGOverrideValues(
      screen1.aboutTheChildren,
      screen1.background,
      1
    );

    const CSGOverrideValuesParty2 = CSGOverrideValues(
      screen1.aboutTheChildren,
      screen1.background,
      2
    );

    const totalIncomeParty1WithGuideline = totalIncomeByIncomeState([
      ...income.party1,
      ...guidelineIncome.party1,
    ]).toString();
    const totalIncomeParty2WithGuideline = totalIncomeByIncomeState([
      ...income.party2,
      ...guidelineIncome.party2,
    ]).toString();

    //finding the notional and child support for each party.
    const childSupportFilteredValues = {
      res1: fetchChildSupportDetails(
        fetchedChildSupportValues,
        totalIncomeParty1WithGuideline,
        numberOfChildrenForCalculatingChildSupport(1) -
        CSGOverrideValuesParty1.length,
        getProvinceOfParty1()
      )[0],

      res2: fetchChildSupportDetails(
        fetchedChildSupportValues,
        totalIncomeParty2WithGuideline,
        numberOfChildrenForCalculatingChildSupport(2) -
        CSGOverrideValuesParty2.length,
        getProvinceOfParty2()
      )[0],

      notionalAmount1: fetchChildSupportDetails(
        fetchedChildSupportValues,
        totalIncomeParty1WithGuideline,
        numberOfChildrenForCalculatingChildSupport(2),
        getProvinceOfParty1()
      )[0],

      notionalAmount2: fetchChildSupportDetails(
        fetchedChildSupportValues,
        totalIncomeParty2WithGuideline,
        numberOfChildrenForCalculatingChildSupport(1),
        getProvinceOfParty2()
      )[0],
    };

    const party1ChildSupportParams = {
      ...childSupportFilteredValues.res1,
      totalIncomeParty: Number(totalIncomeParty1WithGuideline),
    };

    const party2ChildSupportParams = {
      ...childSupportFilteredValues.res2,
      totalIncomeParty: Number(totalIncomeParty2WithGuideline),
    };

    const notionalAmount1Params = {
      ...childSupportFilteredValues.notionalAmount1,
      totalIncomeParty: Number(totalIncomeParty1WithGuideline),
    };

    const notionalAmount2Params = {
      ...childSupportFilteredValues.notionalAmount2,
      totalIncomeParty: Number(totalIncomeParty2WithGuideline),
    };

    // Calculating the child support for each party
    const party1ChildSupport = formulaForChildSupport(party1ChildSupportParams);

    const party2ChildSupport = formulaForChildSupport(party2ChildSupportParams);

    const party1NotionalAmount = formulaForChildSupport(notionalAmount1Params);
    const party2NotionalAmount = formulaForChildSupport(notionalAmount2Params);

    // maximumChildLivesWith function tells which party will get notional amount and other credits.
    const childLivesWithParty1 = maximumChildLivesWith(
      getParamsForCalculatingAllCredits(1)
    );
    const childLivesWithParty2 = maximumChildLivesWith(
      getParamsForCalculatingAllCredits(2)
    );

    const incomes = {
      totalIncomeParty1: totalIncomeByIncomeState(income.party1),
      totalIncomeParty2: totalIncomeByIncomeState(income.party2),
    };

    if (
      (totalNumberOfChildren(screen1.aboutTheChildren) === 0 ||
        determineWhichPartyHasGreaterIncomeAndChild(
          screen1.aboutTheChildren,
          incomes
        )) &&
      fetchedONMrateTaxDB.length > 0
    ) {
      const calculateMarginalTax1 = findRateForFederalTax(
        fetchedONMrateTaxDB,
        getTaxableIncomeAfterSupportParty1()
      )[0];
      const calculateMarginalTax2 = findRateForFederalTax(
        fetchedONMrateTaxDB,
        getTaxableIncomeAfterSupportParty2()
      )[0];



      if (calculateMarginalTax1 && calculateMarginalTax2) {
        const marginalReciprocalTaxParty1 =
          Number(1 - calculateMarginalTax1.Rate) || 0;
        const marginalReciprocalTaxParty2 =
          Number(1 - calculateMarginalTax2.Rate) || 0;

        marginalTax.current = {
          party1: Number(calculateMarginalTax1.Rate),
          party2: Number(calculateMarginalTax2.Rate),
        };

        marginalReciprocalTax.current = {
          party1: marginalReciprocalTaxParty1,
          party2: marginalReciprocalTaxParty2,
        };

        notionalAmountRef.current = {
          party1:
            childLivesWithParty1 === 1
              ? Number(party1NotionalAmount * 12) / marginalReciprocalTaxParty1
              : 0,
          party2:
            childLivesWithParty2 === 2
              ? Number(party2NotionalAmount * 12) / marginalReciprocalTaxParty2
              : 0,
        };

        childSupportRef.current = {
          party1:
            childLivesWithParty2 === 2
              ? (Number(party1ChildSupport * 12) +
                addAllNumbersInArr(CSGOverrideValuesParty1) * 12) /
              marginalReciprocalTaxParty1
              : 0,
          party2:
            childLivesWithParty1 === 1
              ? (Number(party2ChildSupport * 12) +
                addAllNumbersInArr(CSGOverrideValuesParty2) * 12) /
              marginalReciprocalTaxParty2
              : 0,
        };

      }
    } else {
      //for shared case we need to assign child support in this manner.
      if (typeOfSplitting === "SHARED") {
        notionalAmountRef.current = {
          party1: 0,
          party2: 0,
        };

        childSupportRef.current = {
          party1:
            Number(party1ChildSupport * 12) +
            addAllNumbersInArr(CSGOverrideValuesParty1) * 12,

          party2:
            Number(party2ChildSupport * 12) +
            addAllNumbersInArr(CSGOverrideValuesParty2) * 12,
        };
      } else {
        //For SPLIT | HYBRID cases

        //   //if party has child, then notional support will be there but actual support will be zero
        notionalAmountRef.current = {
          party1:
            childLivesWithParty1 === 1
              ? Number(party1NotionalAmount * 12)
              : // + addAllNumbersInArr(CSGOverrideValuesParty1) * 12
              0,
          party2:
            childLivesWithParty2 === 2
              ? Number(party2NotionalAmount * 12)
              : // + addAllNumbersInArr(CSGOverrideValuesParty2) * 12
              0,
        };

        const obj = {
          party1:
            Number(party1ChildSupport * 12) +
            addAllNumbersInArr(CSGOverrideValuesParty1) * 12,
          party2:
            Number(party2ChildSupport * 12) +
            addAllNumbersInArr(CSGOverrideValuesParty2) * 12,
        };
        //do not modify this. Setting child support based upon if child is living with party
        //party 2 has two children > party 1 has one child.

        childSupportReadOnly.current = obj;
        childSupportRef.current = {
          party1: childLivesWithParty2 === 2 ? obj.party1 : 0,
          party2: childLivesWithParty1 === 1 ? obj.party2 : 0,
        };
        // console.log("Setting Child Support", childSupportRef.current, notionalAmountRef.current, party1ChildSupport, childLivesWithParty1, childLivesWithParty2, party2ChildSupport, party1NotionalAmount, party2NotionalAmount)
      }
    }

    return {
      party1:
        Number(party1ChildSupport * 12) +
        addAllNumbersInArr(CSGOverrideValuesParty1) * 12,
      party2:
        Number(party2ChildSupport * 12) +
        addAllNumbersInArr(CSGOverrideValuesParty2) * 12,
    };
  };

  const iterativeFormula = (rate: number, time: number ,cashflows:any,duration:any,discountRate:any) => {
   
    return new Promise(async (resolve, reject) => {

   
      calculateAllOperationsForParty1();
      calculateAllOperationsForParty2();

      const houseHoldIncome1 = calculateDisposableIncome1WithoutEnhancedCPP(
        childSupportRef.current.party1 + notionalAmountRef.current.party1
      );

      //use childSupportTotal2
      const houseHoldIncome2 = calculateDisposableIncome2WithoutEnhancedCPP(
        childSupportRef.current.party2 + notionalAmountRef.current.party2
      );

      let spousalSupportVal;
     
      if (time === 0) {
        if (rate === calpercentageRef.low / 100)
          spousalSupportVal = cashflows ? cashflows/12 : globallowSupport.current;
          // spousalSupportVal = cashflows ? cashflows : globallowSupport.current;

        if (rate === calpercentageRef.mid / 100)
          spousalSupportVal = cashflows ? cashflows/12 : globalmedSupport.current;
          // spousalSupportVal = cashflows ? cashflows : globalmedSupport.current;

        if (rate === calpercentageRef.high / 100)
          spousalSupportVal = cashflows ? cashflows/12 : globalhighSupport.current;
          // spousalSupportVal = cashflows ? cashflows : globalhighSupport.current;




      } else {
        spousalSupportVal = cashflows ? cashflows/12 :
        // spousalSupportVal = cashflows ? cashflows :

          spousalSupportFormulaByRate(
            houseHoldIncome1,
            houseHoldIncome2,
            rate
          );
      }

      if (time === 2) {
        assignValueForSpousalSupport(
          houseHoldIncome1,
          houseHoldIncome2,
          spousalSupportVal,
          rate
        );
      }

      const deductableTaxRes = assignDeductableTax({
        houseHoldIncome1: houseHoldIncome1,
        houseHoldIncome2: houseHoldIncome2,
        spousalSupp1: Number(spousalSupportVal),
        spousalSupp2: Number(spousalSupportVal),
      });

      let determineWhichPartyTaxReturns = calculateTotalTaxes(1) > calculateTotalTaxes(2) ? calculateTotalTaxes(1) : calculateTotalTaxes(2);
      

 

      resolve({
        deductableTaxRes,
        spousalSupportMedium: spousalSupportVal,
        taxValueAfterAddSupport: determineWhichPartyTaxReturns
      });

     

    });
  };

  const storeBasicValues = () => {
    //these values will be stored and used for resetting.
    setOriginalValues({
      income: income,
      deductions: deductions,
      benefits: benefits,
      enhancedCPPDeductionParty1: enhancedCPPDeduction.current.party1,
      enhancedCPPDeductionParty2: enhancedCPPDeduction.current.party2,
      federalTaxParty1: federalTax.current.party1,
      federalTaxParty2: federalTax.current.party2,
      provincialTaxParty1: provincialTax.current.party1,
      provincialTaxParty2: provincialTax.current.party2,
      provincialCreditsParty1: provincialCredits.current.party1,
      provincialCreditsParty2: provincialCredits.current.party2,
      canadaChildBenefitParty1: childBenefit.current.party1,
      canadaChildBenefitParty2: childBenefit.current.party2,
      canadaChildDisabilityBenefitsParty1:
        childDisabilityBenefit.current.party1,
      canadaChildDisabilityBenefitsParty2:
        childDisabilityBenefit.current.party2,
      gstHstBenefitParty1: GSTHSTBenefit.current.party1,
      gstHstBenefitParty2: GSTHSTBenefit.current.party2,
      ontarioChildBenefitParty1: OntarioChildBenefit.current.party1,
      ontarioChildBenefitParty2: OntarioChildBenefit.current.party2,
      ontarioSalesTaxParty1: ontarioSalesTax.current.party1,
      ontarioSalesTaxParty2: ontarioSalesTax.current.party2,
      ageAmountParty1: allCreditsParty1.current.ageAmount,
      ageAmountParty2: allCreditsParty2.current.ageAmount,
      totalFederalCreditsParty1:
        allCreditsParty1.current.totalFederalCredits +
        totalOtherFederalCreditsParty(benefits.party1),
      totalFederalCreditsParty2:
        allCreditsParty2.current.totalFederalCredits +
        totalOtherFederalCreditsParty(benefits.party2),
      totalOntarioCreditsParty1:
        allCreditsParty1.current.totalOntarioCredits +
        totalOtherOntarioCreditsParty(benefits.party1),
      totalOntarioCreditsParty2:
        allCreditsParty2.current.totalOntarioCredits +
        totalOtherOntarioCreditsParty(benefits.party2),
      totalTaxesParty1: calculateTotalTaxes(1),
      totalTaxesParty2: calculateTotalTaxes(2),
      totalBenefitsParty1: sumAllBenefits(1),
      taxableIncomeAfterSupportParty1: getTaxableIncomeAfterSupportParty1(),
      totalBenefitsParty2: sumAllBenefits(2),
      taxableIncomeAfterSupportParty2: getTaxableIncomeAfterSupportParty2(),
      specialExpenses: {
        party1: specialExpensesRef.current.party1,
        party2: specialExpensesRef.current.party2,
      },
      childCareExpenses: {
        party1: childCareExpenses.current.party1,
        party2: childCareExpenses.current.party2,
      },
    });
  };


  //one time iterate
  const calculateChildAndSpousalSupportManually = (
    rate: number,
    time: number = 0,
    cashflows:any, 
    duration:any, 
    discountRate:any
  ) => {
    //Can refactor this.
    return new Promise((resolve, reject) => {
      iterativeFormula(rate, time,cashflows,duration,discountRate)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const sumAllFederalCredits = (partyNum: 1 | 2) => {
    const creditSelection =
      partyNum === 1 ? allCreditsParty1.current : allCreditsParty2.current;

    const {
      basicPersonalAmountFederal,
      ageAmount,
      amountForEligibleDependent,
      baseCPPContribution,
      EIPremiums,
      canadaEmploymentAmount,
      disabilityCredits,
      disabilityCreditsProv,
    } = creditSelection;

    const val =
      basicPersonalAmountFederal +
      disabilityCredits +
      disabilityCreditsProv +
      ageAmount +
      amountForEligibleDependent +
      baseCPPContribution +
      EIPremiums +
      canadaEmploymentAmount;

    return val;
  };


  //==================================== FEDERAL TAX ===========================

  const calculateFedTax1 = (): number => {
    const obj = {
      taxableIncome: getTaxableIncomeAfterSupportParty1(),
      totalFederalCredits: sumAllFederalCredits(1),
      fetchedFederalValuesDB,
    };
    if (fetchedFederalValuesDB.length > 0) {
      return determineFederalTaxForAllProv(obj);
    }

    return 0;
  };

  const calculateFedTax2 = (): number => {
    const obj = {
      taxableIncome: getTaxableIncomeAfterSupportParty2(),
      totalFederalCredits: sumAllFederalCredits(2),
      fetchedFederalValuesDB,
    };

    if (fetchedFederalValuesDB.length > 0) {
      return determineFederalTaxForAllProv(obj);
    }
    return 0;
  };

  const calculateAllFederalTax = () => {
    const val = {
      party1: Math.max(determineFederalTax(1), 0),
      party2: Math.max(determineFederalTax(2), 0),
    };

    federalTax.current = val;
  };

  const determineFederalTax = (partyNum: number) => {
    if (partyNum === 1) {
      return calculateFedTax1();
    } else {
      return calculateFedTax2();
    }
  };

  //=================================== PROVINCIAL TAX =======================================
  const calculateProvTax1 = (province: Province): number => {
    if (province === "ON") {
      const objON = {
        fetchedHealthTaxDB,
        taxBrackets: fetchedProvincialTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(1)),
        screen1: screen1,
        employedIncome: employedIncome10100Party1(),
      };
    
      return determineProvTaxON(objON);
    } else if (province === "BC" && fetchedProvincialTaxDB.length > 0) {
      const objBC = {
        fetchedProvincialTaxDB,
        fetchedHealthTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(1)),
      };
      return determineProvTaxBC(objBC);
    } else if (province === "AB") {
      const objAB: IProvincialTaxAB = {
        fetchedHealthTaxDB,
        taxBrackets: fetchedProvincialTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(1)),
      };

     
      return determineProvTaxAB(objAB);
    }
  };
  const calculateProvTax2 = (province: Province): number => {
    if (province === "ON") {
      const objON = {
        fetchedHealthTaxDB,
        taxBrackets: fetchedProvincialTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty2(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(2)),
        screen1: screen1,
        employedIncome: employedIncome10100Party2(),
      };
   
      return determineProvTaxON(objON);
    } else if (province === "BC" && fetchedProvincialTaxDB.length > 0) {
      const objBC = {
        fetchedProvincialTaxDB,
        fetchedHealthTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty2(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(2)),
      };

      return determineProvTaxBC(objBC);
    } else if (province === "AB") {
      //need to change this
      const objAB: IProvincialTaxAB = {
        fetchedHealthTaxDB,
        taxBrackets: fetchedProvincialTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty2(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(2)),
      };

      return determineProvTaxAB(objAB);
    }
  };

  const paramsForProvincialCredits = (partyNum: 1 | 2) => {
    if (partyNum === 1) {
      return {
        basicPersonalAmountOntario:
          allCreditsParty1.current.basicPersonalAmountOntario,
        amountForEligibleDependent:
          allCreditsParty1.current.amountForEligibleDependentOntario,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        baseCPPContribution: allCreditsParty1.current.baseCPPContribution,
        eiPremiums: allCreditsParty1.current.EIPremiums,
        ageForPerson: momentFunction.calculateNumberOfYears(
          screen1.background.party1DateOfBirth
        ),
      };
    } else {
      return {
        basicPersonalAmountOntario:
          allCreditsParty2.current.basicPersonalAmountOntario,
        amountForEligibleDependent:
          allCreditsParty2.current.amountForEligibleDependentOntario,
        taxableIncome: getTaxableIncomeAfterSupportParty2(),
        baseCPPContribution: allCreditsParty2.current.baseCPPContribution,
        eiPremiums: allCreditsParty2.current.EIPremiums,
        ageForPerson: momentFunction.calculateNumberOfYears(
          screen1.background.party2DateOfBirth
        ),
      };
    }
  };

  const determineProvTax = (province: Province, partyNum: 1 | 2) => {
    if (partyNum === 1) {
      return calculateProvTax1(province);
    } else {
      return calculateProvTax2(province);
    }
  };

  const calculateAllProvincialTax = (province: Province): void => {
    provincialTax.current = {
      party1: determineProvTax(province, 1),
      party2: determineProvTax(province, 2),
    };
  };

  const resetFederalTaxes = () => {
    federalTax.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearTaxesWithoutSpecialExpenses = () => {
    taxesWithoutSpecialExpenses.current = {
      party1Low: 0,
      party2Low: 0,
      party1Med: 0,
      party2Med: 0,
      party1High: 0,
      party2High: 0,
    };
  };

  const resetProvincialTaxes = () => {
    provincialTax.current = {
      party1: 0,
      party2:0,
    };
  };

  const resetEnhancedCPPDeduction = () => {
    enhancedCPPDeduction.current = {
      party1: 0,
      party2: 0,
    };
  };

  const resetProvincialCredits = () => {
    provincialCredits.current = {
      party1: 0,
      party2:0,
    };
  };

  const resetGSTHSTBenefits = () => {
    GSTHSTBenefit.current = {
      party1: 0,
      party2: 0,
    };
  };


  const resetCanadaChildBenefits = () => {
    childBenefit.current = {
      party1: 0,
      party2: 0,
    };
  };

  const resetOntarioChildBenefits = () => {
    OntarioChildBenefit.current = {
      party1: 0,
      party2: 0,
    };
  };

  const resetOntarioSalesTaxes = () => {
    ontarioSalesTax.current = {
      party1: 0,
      party2: 0,
    };
  };

  const resetAllCredits = () => {
    allCreditsParty1.current = {
      ...allCreditsParty1.current,
      ageAmount: 0,
      totalFederalCredits: 0,
      totalOntarioCredits: 0,
    };

    allCreditsParty2.current = {
      ...allCreditsParty2.current,
      ageAmount: 0,
      totalFederalCredits: 0,
      totalOntarioCredits: 0,
    };
  };

  const resetChildCareExpenses = () => {
    childCareExpenses.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearDeductableSupport = () => {
    deductableSupport.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearSupportReceived = () => {
    supportReceived.current = {
      party1: 0,
      party2: 0,
    };
  };


  const resetAllValues = () => {

    // resetting all the values
    resetFederalTaxes();
    resetProvincialTaxes();
    resetEnhancedCPPDeduction();
    resetProvincialCredits();
    resetGSTHSTBenefits();
    resetCanadaChildBenefits();
    resetGSTHSTBenefits();
    resetOntarioChildBenefits();
    resetOntarioSalesTaxes();
    resetAllCredits();
    resetChildCareExpenses();
    clearDeductableSupport();
    clearSupportReceived();
  };


  /// =========================== TOTAL TAX ========================================

  const calculateTotalTaxes = (partyNum: number) => {
    return partyNum === 1
      ? Math.round(
        Number(
          addAllNumbersInArr([
            Number(determineProvTax(getProvinceOfParty1(), 1)),
            Number(federalTax.current.party1),
            calculateCPPandELDeductionsForEmployed(1),
            calculateCPPandEIDeductionsForSelfEmployed(1),
            -calculateCanadaWorkersBenefits(1),
            -Number(calculateProvincialCreditsParty1()),
          ]).toFixed(4)
        )
      )
      : Math.round(
        Number(
          addAllNumbersInArr([
            Number(determineProvTax(getProvinceOfParty1(), 2)),
            Number(federalTax.current.party2),
            calculateCPPandELDeductionsForEmployed(2),
            calculateCPPandEIDeductionsForSelfEmployed(2),
            -calculateCanadaWorkersBenefits(2),
            -Number(calculateProvincialCreditsParty2()),
          ]).toFixed(4)
        )
      );
  };

  // ================================= BENEFITS ================================


  const childBenefitParty1 = () => {

    let val = 0;

    val = render0IfValueIsNegative(
      Number(
        formulaForCanadaChildBenefit(
          screen1.aboutTheChildren,
          getTaxableIncomeAfterSupportParty1(),
          typeOfSplitting,
          party1Name(),
          1,
          fetchedDynamicValues
        )
      )
    );

    val = ifSharedDivideBy2(typeOfSplitting, val);
    return val;
  };

  const childBenefitParty2 = () => {
    let val = 0;

    val = render0IfValueIsNegative(
      Number(
        formulaForCanadaChildBenefit(
          screen1.aboutTheChildren,
          getTaxableIncomeAfterSupportParty2(),
          typeOfSplitting,
          party2Name(),
          2,
          fetchedDynamicValues
        )
      )
    );

    val = ifSharedDivideBy2(typeOfSplitting, val);
    return val;
  };

  const childDisabilityBenefitParty1 = () => {
    let val = 0;

    val = render0IfValueIsNegative(
      Number(
        formulaForChildDisabilityBenefit(
          screen1.aboutTheChildren,
          totalIncomeByIncomeState(income.party1),
          typeOfSplitting,
          party1Name(),
          1,
          fetchedDynamicValues
        )
      )
    );

    val = ifSharedDivideBy2(typeOfSplitting, val);
    return val;
  };

  const childDisabilityBenefitParty2 = () => {
    let val = 0;
    val = render0IfValueIsNegative(
      Number(
        formulaForChildDisabilityBenefit(
          screen1.aboutTheChildren,
          totalIncomeByIncomeState(income.party2),
          typeOfSplitting,
          party2Name(),
          2,
          fetchedDynamicValues
        )
      )
    );

    val = ifSharedDivideBy2(typeOfSplitting, val);

    return val;
  };

  const determinChildDisabilityBenefit = () => {
    if (!ChildDisabilityBenefitFixed.party1.isFixed) {
      childDisabilityBenefit.current.party1 =  childDisabilityBenefitParty1();
    }

    if (!ChildDisabilityBenefitFixed.party2.isFixed) {
      childDisabilityBenefit.current.party2 =  childDisabilityBenefitParty2();
    }
  };

  const determineChildBenefit = () => {
    if (!canadaChildBenefitFixed.party1.isFixed) {

      childBenefit.current.party1 =  childBenefitParty1() ;
    }

    if (!canadaChildBenefitFixed.party2.isFixed) {

      childBenefit.current.party2 =  childBenefitParty2() ;


    }
  };

  const GSTHSTBenefitsParty1 = () => {
    let val = Number(
      formulaForGSTHSTBenefits(
        getTaxableIncomeAfterSupportParty1(),
        noOfChildrenForBenefits(screen1, 1, typeOfSplitting),
        typeOfSplitting
      )
    );

    for (
      let i = 0;
      i < noOfSharedChildrenInHybrid(screen1, typeOfSplitting);
      i++
    ) {
      val += val / 2;
    }

    return val;
  };

  const GSTHSTBenefitsParty2 = () => {
    let val = Number(
      formulaForGSTHSTBenefits(
        getTaxableIncomeAfterSupportParty2(),
        noOfChildrenForBenefits(screen1, 2, typeOfSplitting),
        typeOfSplitting
      )
    );

    for (
      let i = 0;
      i < noOfSharedChildrenInHybrid(screen1, typeOfSplitting);
      i++
    ) {
      val += val / 2;
    }

    return val;
  };

  const determineGSTHSTBenefits = () => {
    if (!GSTHSTBenefitFixed.party1.isFixed) {
      GSTHSTBenefit.current.party1 =  GSTHSTBenefitsParty1() ;
    }

    if (!GSTHSTBenefitFixed.party2.isFixed) {
      GSTHSTBenefit.current.party2 = GSTHSTBenefitsParty2() ;
    }
  };

  const ontarioChildBenefitParty1 = () => {
    let val = 0;

    val = render0IfValueIsNegative(
      formulaForChildBenefit(
        getProvinceOfParty1(),
        getTaxableIncomeAfterSupportParty1(),
        noOfChildrenForBenefits(screen1, 1, typeOfSplitting),
        typeOfSplitting,
        fetchedDynamicValues
      )
    );

    for (
      let i = 0;
      i < noOfSharedChildrenInHybrid(screen1, typeOfSplitting);
      i++
    ) {
      val += val / 2;
    }

    return ifSharedDivideBy2(typeOfSplitting, val);
  };

  const ontarioChildBenefitParty2 = () => {
    let val = 0;

    val = render0IfValueIsNegative(
      formulaForChildBenefit(
        getProvinceOfParty1(),
        getTaxableIncomeAfterSupportParty2(),
        noOfChildrenForBenefits(screen1, 2, typeOfSplitting),
        typeOfSplitting,
        fetchedDynamicValues
      )
    );

    // console.log("logs Ontario child benefit", val);
    for (
      let i = 0;
      i < noOfSharedChildrenInHybrid(screen1, typeOfSplitting);
      i++
    ) {
      val += val / 2;
    }

    return ifSharedDivideBy2(typeOfSplitting, val);
  };

  const determineOntarioChildBenefit = () => {
    if (!provChildBenefitFixed.party1.isFixed) {
      OntarioChildBenefit.current.party1 =  ontarioChildBenefitParty1();
    }

    if (!provChildBenefitFixed.party2.isFixed) {
      OntarioChildBenefit.current.party2 =  ontarioChildBenefitParty2() ;
    }
  };

  //======================== CLIMATE CHANGE ===================

  const calculateClimateChangeTax1 = (province: Province): number => {
    if (province === "BC") {
      const incomes = {
        party1: totalIncomeByIncomeState(income.party1),
        party2: totalIncomeByIncomeState(income.party2),
      };
      const taxableIncome = {
        party1: getTaxableIncomeAfterSupportParty1(),
        party2: getTaxableIncomeAfterSupportParty2(),
      };

      return climateActionIncentiveBC(
        screen1.aboutTheChildren,
        incomes,
        taxableIncome,
        typeOfSplitting,
        1
      );
    } else if (province === "ON") {
      return climateActionIncentiveON(screen1, typeOfSplitting, 1);
    } else if (province === "AB") {
      //doubt
      return climateActionIncentiveAB(screen1, typeOfSplitting, 1);
    }
  };

  const calculateClimateChangeTax2 = (province: Province): number => {
    if (province === "BC") {
      const incomes = {
        party1: totalIncomeByIncomeState(income.party1),
        party2: totalIncomeByIncomeState(income.party2),
      };
      const taxableIncome = {
        party1: getTaxableIncomeAfterSupportParty1(),
        party2: getTaxableIncomeAfterSupportParty2(),
      };
      return climateActionIncentiveBC(
        screen1.aboutTheChildren,
        incomes,
        taxableIncome,
        typeOfSplitting,
        2
      );
    } else if (province === "ON") {
      //using same formula for AB and ON
      if (typeOfSplitting === "SHARED") {
        if (childSupportRef.current.party2 > childSupportRef.current.party1) {
          return 300;
        }
      }

      return climateActionIncentiveON(screen1, typeOfSplitting, 2);
    } else if (province === "AB") {
      return climateActionIncentiveAB(screen1, typeOfSplitting, 2);
    }
  };

  const calculateClimateChange = (partyNum: 1 | 2): number => {
    if (partyNum === 1)
      return calculateClimateChangeTax1(getProvinceOfParty1());
    else return calculateClimateChangeTax2(getProvinceOfParty1());
  };

  const calculateAllClimateChange = () => {
    if (!ClimateActionBenefitFixed.party1.isFixed) {
      climateChangeVal.current.party1 =  calculateClimateChange(1);
    }

    if (!ClimateActionBenefitFixed.party2.isFixed) {
      climateChangeVal.current.party2 =  calculateClimateChange(2) ;
    }
  };

  //====================== ONTARIO SALES TAX ========================

  const ontarioSalesTaxParty1 = (province: Province) => {
    if (province === "ON") {
      let val = formulaForOntarioSalesTax(
        getTaxableIncomeAfterSupportParty1(),
        noOfChildrenForBenefits(screen1, 1, typeOfSplitting),
        typeOfSplitting
      );

      for (
        let i = 0;
        i < noOfSharedChildrenInHybrid(screen1, typeOfSplitting);
        i++
      ) {
        val += val / 2;
      }

      return val;
    }

    return 0;
  };

  const ontarioSalesTaxParty2 = (province: Province) => {
    if (province === "ON") {
      let val = formulaForOntarioSalesTax(
        getTaxableIncomeAfterSupportParty2(),
        noOfChildrenForBenefits(screen1, 2, typeOfSplitting),
        typeOfSplitting
      );

      for (
        let i = 0;
        i < noOfSharedChildrenInHybrid(screen1, typeOfSplitting);
        i++
      ) {
        val += val / 2;
      }

      return val;
    }

    return 0;
  };

  const determineOntarioSalesTax = () => {
    if (!salesTaxBenefitFixed.party1.isFixed) {
      ontarioSalesTax.current.party1 =  ontarioSalesTaxParty1(
        getProvinceOfParty1()
      ) ;
    }

    if (!salesTaxBenefitFixed.party2.isFixed) {
      ontarioSalesTax.current.party2 = ontarioSalesTaxParty2(
        getProvinceOfParty2()
      ) ;
    }
  };

  const sumAllBenefits = (partyNum: number = 2) => {
    if (partyNum === 1) {
      return render0IfValueIsNegative(
        Number(
          (
            Number(ontarioSalesTax.current.party1) +
            Number(OntarioChildBenefit.current.party1) +
            Number(GSTHSTBenefit.current.party1) +
            Number(childBenefit.current.party1) +
            Number(climateChangeVal.current.party1) +
            Number(childDisabilityBenefit.current.party1)
          ).toFixed(4)
        )
      );
    } else {
     
      return render0IfValueIsNegative(
        Number(
          (
            Number(ontarioSalesTax.current.party2) +
            Number(OntarioChildBenefit.current.party2) +
            Number(GSTHSTBenefit.current.party2) +
            Number(childBenefit.current.party2) +
            Number(climateChangeVal.current.party2) +
            Number(childDisabilityBenefit.current.party2)
          ).toFixed(4)
        )
      );
    }
  };

  const assignDeductableTax = (
    data: any
  ): { party1: number; party2: number } => {
    const spousalSupportParty1 = data.spousalSupp1 * 12;
    const spousalSupportParty2 = data.spousalSupp2 * 12;
  

    if (data.houseHoldIncome1 > data.houseHoldIncome2) {
      deductableSupport.current = {
        party1: spousalSupportParty1,
        party2: 0,
      };

      supportReceived.current = {
        party1: 0,
        party2: spousalSupportParty1,
      };

      return {
        party1: spousalSupportParty1,
        party2: 0,
      };
    } else {
      deductableSupport.current = {
        party1: 0,
        party2: spousalSupportParty2,
      };

      supportReceived.current = {
        party2: 0,
        party1: spousalSupportParty2,
      };

      return {
        party1: 0,
        party2: spousalSupportParty2,
      };
    }
  };

  const calculateSpousalSupportAuto = async (data: {
    highLimit: boolean;
    lowTaxes: boolean;
    medTaxes: boolean;
    highTaxes: boolean;
    specialExpensesLow: boolean;
    specialExpensesMed: boolean;
    specialExpensesHigh: boolean;
    cashflows: any, duration: any, discountRate: any
  }) => {

 
    await calculateChildAndSpousalSupportManually(
      calpercentageRef.low / 100,
      2,
      data.cashflows, 
      data.duration, 
      data.discountRate
    );


    await calculateChildAndSpousalSupportManually(
      calpercentageRef.mid / 100,
      2,
      data.cashflows, 
      data.duration, 
      data.discountRate
    );

    return await calculateChildAndSpousalSupportManually(
      calpercentageRef.high / 100,
      2,
      data.cashflows, 
      data.duration, 
      data.discountRate
    );
  };


  const calculateChildAndSpousalSupportAuto = async (cashflows, duration, discountRate,flag) => {

    //reset all values before calculation 
    resetAllValues()
    storeBasicValues();
    calculateChildSupport();


    let taxvalue = await calculateSpousalSupportAuto({
      highLimit: true,
      lowTaxes: false,
      medTaxes: false,
      highTaxes: false,
      specialExpensesLow: false,
      specialExpensesMed: false,
      specialExpensesHigh: false,
      cashflows, duration, discountRate
    });
     
    //get value from screen2 tax without add support( this tax is calcuated on screen2 before itertive formula)
    let calculateWhichPartyDeservedOverrideSupport = valueswithoutSpousalSupport?.current?.party1 > valueswithoutSpousalSupport?.current?.party2 ? valueswithoutSpousalSupport?.current?.party1 : valueswithoutSpousalSupport?.current?.party2;
    
    // tax when add support -(minus) tax which get from screen2 (for e.g calculateWhichPartyDeservedOverrideSupport)
    let taxEffectofSpousalSupport = taxvalue?.taxValueAfterAddSupport - calculateWhichPartyDeservedOverrideSupport;

    //add cashflow +(plus) recived value from taxEffectofSpousalSupport ;
    let AfterTaxCostSpousalSuppport = parseInt(cashflows) + taxEffectofSpousalSupport;

    //return cashflow for show in report and duration , amount for calculated npv
    return { cashFlows: cashflows, duration: duration ,amount :AfterTaxCostSpousalSuppport }

  };



  const getParamsForCalculatingAllCredits = (partyNum: number): allInfo => {
    const incomeForParty =
      partyNum === 1
        ? totalIncomeByIncomeState(income.party1)
        : totalIncomeByIncomeState(income.party2);
    const ageForPerson =
      partyNum === 1
        ? momentFunction.calculateNumberOfYears(
          screen1.background.party1DateOfBirth
        )
        : momentFunction.calculateNumberOfYears(
          screen1.background.party2DateOfBirth
        );
    const selfEmployedIncome =
      partyNum === 1 ? selfEmployedIncomeParty1() : selfEmployedIncomeParty2();
    const taxableIncome =
      partyNum === 1
        ? getTaxableIncomeAfterSupportParty1()
        : getTaxableIncomeAfterSupportParty2();
    const employedIncome =
      partyNum === 1
        ? employedIncome10100Party1()
        : employedIncome10100Party2();


    return {
      screen1: screen1,
      childSupport: {
        party1: childSupportRef.current.party1,
        party2: childSupportRef.current.party2,
      },
      partyNum: partyNum,
      dynamicValues: fetchedDynamicValues,
      selfEmployedIncome: selfEmployedIncome,
      employedIncome: employedIncome,
      taxableIncome: taxableIncome,
      totalIncome: incomeForParty,
      ageForPerson: ageForPerson,
      bothIncomes: {
        party1: totalIncomeByIncomeState(income.party1),
        party2: totalIncomeByIncomeState(income.party2),
      },
    };
  };

  const formulaCreditsForParty = (partyNum: 1 | 2) => {
    return calculateAllCredits(
      getParamsForCalculatingAllCredits(partyNum),
      partyNum
    );
  };

  const calculateCreditsForParty = (partyNum: 1 | 2) => {
    partyNum === 1
      ? (allCreditsParty1.current = {
        ...formulaCreditsForParty(1),
      })
      : (allCreditsParty2.current = {
        ...formulaCreditsForParty(2),
      });
  };

  const fetchDistinctTaxYears = () => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      getDistinctYearsInTaxRef()
        .then((res) => {
          const year =
            screen2.tax_year !== -1
              ? screen2.tax_year
              : res[res.length - 1].year;

          setDistinctYears({
            allYears: res,
            selectedYear: year,
          });

          fetchFederalDBValues(year, getProvinceOfParty1()).then((res) => {
            resolve(true);
          });
        })
        .catch((err) => {
          console.log("err", err);
          reject(false);
        });
    });
  };


  const calculateEnhancedCPPDeductions = (partyNum: 1 | 2) => {
    let total = 0;

    if (partyNum === 1) {
      total = formulaEnhancedCPPdeduction({
        employedIncome: employedIncome10100Party1(),
        selfEmployedIncome: selfEmployedIncomeParty1(),
        data: fetchedDynamicValues,
      });
    } else {
      total = formulaEnhancedCPPdeduction({
        employedIncome: employedIncome10100Party2(),
        selfEmployedIncome: selfEmployedIncomeParty2(),
        data: fetchedDynamicValues,
      });
    }
    return total;
  };

  const calculateAndSetEnhancedCPPDeductions = () => {
    let val1 = calculateEnhancedCPPDeductions(1);
    let val2 = calculateEnhancedCPPDeductions(2);

    enhancedCPPDeduction.current = {
      party1: val1,
      party2: val2,
    };
  };

  const personAgeReceivingSupport = () => {
    return spousalSupportMed.current.party1 > spousalSupportMed.current.party2
      ? screen1.background.party1DateOfBirth
      : screen1.background.party2DateOfBirth;
  };

  const calculateDurationOfSupport = () => {
    const obj = {
      childInfo: screen1.aboutTheChildren.childrenInfo,
      background: screen1.background,
      relationship: screen1.aboutTheRelationship,
      personAgeReceivingSupport: momentFunction.differenceBetweenNowAndThen(
        personAgeReceivingSupport()
      ),
    };

    return formulaForCalculatingDurationOfSupport(obj);
  };

  const fetchFederalDBValues = (year: number, province: Province) => {
    const CSGOverrideValuesParty = CSGOverrideValues(
      screen1.aboutTheChildren,
      screen1.background,
      1
    );
    return new Promise((resolve, reject) => {
      setLoading(true);
      fetchAllValuesFromDB(
        year,
        province,
        childSupportValuesFor(
          screen1.aboutTheChildren.count,
          screen1.aboutTheChildren.numberOfChildren,
          screen1.aboutTheChildren.numberOfChildren -
          CSGOverrideValuesParty?.length
        )
      )
        .then((res) => {   
          setFetchedChildSupportValues(res.childSupportValues);
          const {
            federalValues,
            provincialValues,
            HealthValues,
            OnCareValues,
            OnMrateValues,
          } = separateValuesDB(res.TaxValues, province);

          setFetchedFederalValuesDB(federalValues);
          setFetchedProvincialTaxDB(provincialValues);
          setFetchedHealthTaxDB(HealthValues);
          setFetchedONCareTaxDB(OnCareValues);
          setFetchedONMrateTaxDB(OnMrateValues);
          const obj = convertArrToObj(res.dynamicValues);

          setFetchedDynamicValues({ ...obj, year, province });

          resolve(true);
        })
        .catch((err) => {
          console.log(`Error Fetching Values from DB ${err}`);
          // alert(`Error Fetching Values from DB ${err}`);
          reject(err);
        });
    });
  };

  const modifyScreen1PropIfChildIsAbove18 = () => {
    const screen1Data = { ...screen1.aboutTheChildren };
    let isChildGreaterThan18WithParty1 = 0;
    let isChildGreaterThan18WithParty2 = 0;

    screen1Data.childrenInfo.forEach((e) => {
      if (
        momentFunction.differenceBetweenNowAndThen(e.dateOfBirth) >= 18 &&
        e.custodyArrangement === screen1.background.party1FirstName
      ) {
        isChildGreaterThan18WithParty1++;
      }
    });

    screen1Data.childrenInfo.forEach((e) => {
      if (
        momentFunction.differenceBetweenNowAndThen(e.dateOfBirth) >= 18 &&
        e.custodyArrangement === screen1.background.party2FirstName
      ) {
        isChildGreaterThan18WithParty2++;
      }
    });

    if (isChildGreaterThan18WithParty1 > 0) {
      screen1Data.numberOfChildren -= isChildGreaterThan18WithParty1;
      screen1Data.count.party1 -= isChildGreaterThan18WithParty1;
    }

    if (isChildGreaterThan18WithParty2 > 0) {
      screen1Data.numberOfChildren -= isChildGreaterThan18WithParty2;
      screen1Data.count.party2 -= isChildGreaterThan18WithParty2;
    }
  };

  const modifyScreen1PropsIfChildShared = () => {
    const sharedChildren = screen1.aboutTheChildren.count.shared;

    if (
      determineTypeOfSplitting(
        screen1.aboutTheChildren.count,
        totalNumberOfChildren(screen1.aboutTheChildren)
      ) === "SHARED"
    ) {
      screen1.aboutTheChildren.count.party1 = sharedChildren;
      screen1.aboutTheChildren.count.party2 = sharedChildren;
    }

    // When the type of calculator is HYBRID, then the number of shared children will be added.
    else if (
      determineTypeOfSplitting(
        screen1.aboutTheChildren.count,
        totalNumberOfChildren(screen1.aboutTheChildren)
      ) === "HYBRID"
    ) {
      screen1.aboutTheChildren.count.party1 += sharedChildren;
      screen1.aboutTheChildren.count.party2 += sharedChildren;
    }

    // for better understanding, study excel sheet and look at react states in inspector.
  };

  useEffect(() => {
    setLoading(true);
    determineAndSetTypeOfSplitting();
    fetchDistinctTaxYears().then((response) => {
      calculateDurationOfSupport();
      modifyScreen1PropIfChildIsAbove18();
      modifyScreen1PropsIfChildShared();
      calculateChildSupport();

      setCount((prev: any) => prev + 1);
      setLoading(false);

    });

    syncUpSpecialExpensesWithBenefitAndDeduction();
  }, []);


  useEffect(() => {
    dispatch(dynamicValuesAction(fetchedDynamicValues));
  }, [fetchedDynamicValues]);

  useEffect(() => {
    calculateChildSupport();
  }, [
    totalIncomeByIncomeState(income.party1),
    totalIncomeByIncomeState(income.party2),
    loading,
  ]);

  useEffect(() => {
    setOriginalValues({
      ...originalValues,
      childCareExpenses: {
        party1: childCareExpenses.current.party1,
        party2: childCareExpenses.current.party2,
      },
    });
  }, [childCareExpenses]);

  function syncUpParty2Deduction(
    specialExpensesArr: {
      party1: partyIncomeAndAmount[];
      party2: partyIncomeAndAmount[];
    },
    value: string
  ) {
    const party1Details = specialExpensesArr.party1;
    const party1DeductionDetails = deductions.party1.filter(
      (p: any) => p.value !== value
    );
    const party2Details = specialExpensesArr.party2;
    const party2DeductionDetails = deductions.party2.filter(
      (p: any) => p.value !== value
    );

    const childCareSpecialExpense1 = party1Details.filter(
      (p) => p.value === value
    );
    const childCareSpecialExpense2 = party2Details.filter(
      (p) => p.value === value
    );

    childCareSpecialExpense1.forEach((se) => {
      party1DeductionDetails.push(se);
    });
    childCareSpecialExpense2.forEach((se) => {
      party2DeductionDetails.push(se);
    });
    setDeductions({
      ...deductions,
      party1: party1DeductionDetails,
      party2: party2DeductionDetails,
    });
  }

  function syncUpParty2Benefit(
    specialExpensesArr: {
      party1: partyIncomeAndAmount[];
      party2: partyIncomeAndAmount[];
    },
    value: string
  ) {
    const party2Details = specialExpensesArr.party2;

    const childCareSpecialExpenseIndex = party2Details.findIndex(
      (detail) => detail.value === value
    );
    if (childCareSpecialExpenseIndex !== -1) {
      const childCareExpenseFromSpecialExpense = party2Details.find(
        (detail) => detail.value === value
      )!;
      const party2BenefitDetails = benefits.party2;
      const benefitIndex = party2BenefitDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (benefitIndex === -1) {
        const formattedIndex = party2BenefitDetails.length;
        party2BenefitDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setBenefits((prev: any) => {
          return { ...prev, party2: party2BenefitDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party2Details.find(
          (detail) => detail.value === value
        )!;
        const findExistingIndex = party2BenefitDetails.findIndex(
          (detail: any) => detail.value === value
        );
        party2BenefitDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setBenefits((prev: any) => {
          return { ...prev, party2: party2BenefitDetails };
        });
      }
    } else {
      const party2BenefitDetails = benefits.party2;
      const benefitIndex = party2BenefitDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (benefitIndex !== -1) {
        party2BenefitDetails.splice(benefitIndex, 1);
        setBenefits((prev: any) => {
          return { ...prev, party2: party2BenefitDetails };
        });
      }
    }
  }

  function syncUpParty1Benefit(
    specialExpensesArr: {
      party1: partyIncomeAndAmount[];
      party2: partyIncomeAndAmount[];
    },
    value: string
  ) {
    const party1Details = specialExpensesArr.party1;

    const childCareSpecialExpenseIndex = party1Details.findIndex(
      (detail) => detail.value === value
    );
    if (childCareSpecialExpenseIndex !== -1) {
      const childCareExpenseFromSpecialExpense = party1Details.find(
        (detail) => detail.value === value
      )!;
      const party1BenefitDetails = benefits.party1;
      const benefitIndex = party1BenefitDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (benefitIndex === -1) {
        const formattedIndex = party1BenefitDetails.length;
        party1BenefitDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setBenefits((prev: any) => {
          return { ...prev, party1: party1BenefitDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party1Details.find(
          (detail) => detail.value === value
        )!;
        const findExistingIndex = party1BenefitDetails.findIndex(
          (detail: any) => detail.value === value
        );
        party1BenefitDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setBenefits((prev: any) => {
          return { ...prev, party1: party1BenefitDetails };
        });
      }
    } else {
      const party1BenefitDetails = benefits.party1;
      const benefitIndex = party1BenefitDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (benefitIndex !== -1) {
        party1BenefitDetails.splice(benefitIndex, 1);
        setBenefits((prev: any) => {
          return { ...prev, party1: party1BenefitDetails };
        });
      }
    }
  }

  function syncUpParty1Deduction(
    specialExpensesArr: {
      party1: partyIncomeAndAmount[];
      party2: partyIncomeAndAmount[];
    },
    value: string
  ) {
    const party1Details = specialExpensesArr.party1;
    const party1DeductionDetails = deductions.party1.filter(
      (p: any) => p.value !== value
    );
    const party2Details = specialExpensesArr.party2;
    const party2DeductionDetails = deductions.party2.filter(
      (p: any) => p.value !== value
    );

    const childCareSpecialExpense1 = party1Details.filter(
      (p: any) => p.value === value
    );
    const childCareSpecialExpense2 = party2Details.filter(
      (p) => p.value === value
    );

    childCareSpecialExpense1.forEach((se) => {
      party1DeductionDetails.push(se);
    });
    childCareSpecialExpense2.forEach((se) => {
      party2DeductionDetails.push(se);
    });
    setDeductions({
      ...deductions,
      party1: party1DeductionDetails,
      party2: party2DeductionDetails,
    });
  }


  const syncUpSpecialExpensesWithBenefitAndDeduction = () => {
    syncUpParty1Deduction(specialExpensesArr, "21400");
    syncUpParty2Deduction(specialExpensesArr, "21400");

    syncUpParty1Benefit(specialExpensesArr, "33099");
    syncUpParty1Benefit(specialExpensesArr, "32400");
    syncUpParty1Benefit(specialExpensesArr, "32300");

    syncUpParty2Benefit(specialExpensesArr, "33099");
    syncUpParty2Benefit(specialExpensesArr, "32400");
    syncUpParty2Benefit(specialExpensesArr, "32300");
  };

  const determineAndSetTypeOfSplitting = () => {
    setTypeOfSplitting(
      determineTypeOfSplitting(
        screen1.aboutTheChildren.count,
        totalNumberOfChildren(screen1.aboutTheChildren)
      )
    );
  };

  function calculateAge(dob: number): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  function limitChildExpense(
    childSupportVal: number,
    aboutTheChildren: aboutYourChildrenState,
    child: string
  ): number {
    const chosenChild = child ? child : aboutTheChildren.childrenInfo[0].name;
    const childInfo = aboutTheChildren.childrenInfo.find(
      (c) => c.name === chosenChild
    );

    if (!childInfo) {
      // Handle the case where the child information is not found
      return 0;
    }

    const age = calculateAge(childInfo.dateOfBirth);

    if (age < 7) {
      // If age is less than 7, limit to 8000
      return Math.min(childSupportVal, 8000);
    } else if (age >= 7 && age <= 17) {
      // If age is between 7 and 17, limit to 5000
      return Math.min(childSupportVal, 5000);
    } else {
      // Handle other age ranges if needed
      return 0;
    }
  }

  function capAndAccumulateChildExpense(deductions: partyIncomeAndAmount) {
    const childCareExpenses = deductions.filter((d) => d.value === "21400");

    const accumulateAndSum = childCareExpenses
      ?.map((ce) =>
        limitChildExpense(ce.amount, screen1.aboutTheChildren, ce?.child)
      )
      .reduce((acc, sum) => acc + parseInt(sum), 0);

    return accumulateAndSum;
  }

  const calculateProvincialCreditsParty1 = () => {
  
    return province === "ON"
      ? formulaForProvincialCredits(
        {
          childCareExpenses: Math.min(
            employedIncome10100Party1() * (2 / 3),
            capAndAccumulateChildExpense(deductions.party1)
          ),
          taxableAmountAfterSupport: getTaxableIncomeAfterSupportParty1(),
          rates: fetchedONCareTaxDB,
        },
        distinctYears.selectedYear
      )
      : 0;
  };

  const calculateProvincialCreditsParty2 = () => {
    return province === "ON"
      ? formulaForProvincialCredits(
        {
          childCareExpenses: Math.min(
            employedIncome10100Party2() * (2 / 3),
            capAndAccumulateChildExpense(deductions.party2)
          ),
          taxableAmountAfterSupport: getTaxableIncomeAfterSupportParty2(),
          rates: fetchedONCareTaxDB,
        },
        distinctYears.selectedYear
      )
      : 0;
  };

  const calculateAndSetProvincialCredits = (partyNum: number) => {
    if (partyNum === 1) {
      provincialCredits.current = {
        ...provincialCredits.current,
        party1: calculateProvincialCreditsParty1(),
      };
    } else {
      provincialCredits.current = {
        ...provincialCredits.current,
        party2: calculateProvincialCreditsParty2(),
      };
    }
  };

  const calculateAllOperationsForParty1 = () => {
    calculateAllFederalTax();
    calculateAllProvincialTax(getProvinceOfParty1());
    calculateAllClimateChange();
    calculateAllCanadaWorkersBenefit();
    calculateCreditsForParty(1);
    determineChildBenefit();
    determinChildDisabilityBenefit();

    determineGSTHSTBenefits();
    determineOntarioChildBenefit();
    determineOntarioSalesTax();
    calculateAndSetEnhancedCPPDeductions();
    calculateAndSetProvincialCredits(1);
  };

  const calculateAllOperationsForParty2 = () => {
    //doubt for province. Should we use same province or diff.
    calculateAllFederalTax();
    calculateAllProvincialTax(getProvinceOfParty1());
    calculateAllClimateChange();
    calculateAllCanadaWorkersBenefit();
    calculateCreditsForParty(2);
    determineChildBenefit();
    determinChildDisabilityBenefit();
    determineGSTHSTBenefits();
    determineOntarioChildBenefit();
    determineOntarioSalesTax();
    calculateAndSetEnhancedCPPDeductions();
    calculateAndSetProvincialCredits(2);
  };

  useEffect(() => {
    // if (fetchedFederalValuesDB.length > 0) {
    calculateTotalTaxes(1);
    calculateTotalTaxes(2);
    calculateAllOperationsForParty1();
    calculateAllOperationsForParty2();
    // }
  }, [count, childCareExpenses]);

  useEffect(() => {
    syncUpParty2Benefit(specialExpensesArr, "33099");
    syncUpParty2Benefit(specialExpensesArr, "32400");
    syncUpParty2Benefit(specialExpensesArr, "32300");
    syncUpParty1Deduction(specialExpensesArr, "21400");
    syncUpParty2Deduction(specialExpensesArr, "21400");
    syncUpParty1Benefit(specialExpensesArr, "33099");
    syncUpParty1Benefit(specialExpensesArr, "32400");
    syncUpParty1Benefit(specialExpensesArr, "32300");
  }, [specialExpensesArr]);


  //need partyNum also
  const calculateAllCredits = (
    data: allInfo,
    partyNum: 1 | 2
  ): calculateAllCreditsInterface => {
    let basicPersonalAmountFederalVal = 0;
    let amountForEligibleDependentVal = 0;
    let baseCPPContributionVal = 0;
    let EIPremiumVal = 0;
    let canadaEmploymentAmountVal = 0;
    let basicPersonalAmountProvincialVal = 0;
    let amountForEligibleDependentProvincialVal = 0;
    let basicPartyDisabilityFixedVal = 0;
    let basicPartyDisabilityFixedProvVal = 0;

    if (partyNum === 1) {
      if (!basicPersonalAmountFederalFixed.party1.isFixed) {
        basicPersonalAmountFederalVal = basicPersonalAmountFederalFormula(data);
      } else {
        basicPersonalAmountFederalVal =
          basicPersonalAmountFederalFixed.party1.value;
      }

      if (!basicPartyDisabilityFixed.party1.isFixed) {
        if (data.screen1.background.party1eligibleForDisability == "Yes") {
          basicPartyDisabilityFixedVal = basicDisabilityAmountFormula(data);
          basicPartyDisabilityFixedProvVal =
            basicDisabilityAmountFormulaProv(data);
        } else {
          basicPartyDisabilityFixedVal = basicPartyDisabilityFixed.party1.value;
          basicPartyDisabilityFixedProvVal =
            basicPartyDisabilityProvFixed.party1.value;
        }

        // basicPartyDisabilityFixedVal = basicDisabilityAmountFormula(data)
      } else {
        basicPartyDisabilityFixedVal = basicPartyDisabilityFixed.party1.value;
        basicPartyDisabilityFixedProvVal =
          basicPartyDisabilityProvFixed.party1.value;
      }

      if (!amountForEligibleDependentFixed.party1.isFixed) {
        amountForEligibleDependentVal = amountForEligibleDependent(data);
      } else {
        amountForEligibleDependentVal =
          amountForEligibleDependentFixed.party1.value;
      }

      if (!baseCPPContributionFixed.party1.isFixed) {
        baseCPPContributionVal = baseCPPContribution(data);
      } else {
        baseCPPContributionVal = baseCPPContributionFixed.party1.value;
      }

      if (!eiPremiumFixed.party1.isFixed) {
        EIPremiumVal = EIPremiums(data);
      } else {
        EIPremiumVal = eiPremiumFixed.party1.value;
      }

      if (!canadaEmploymentAmountFixed.party1.isFixed) {
        canadaEmploymentAmountVal = canadaEmploymentAmount(data);
      } else {
        canadaEmploymentAmountVal = canadaEmploymentAmountFixed.party1.value;
      }

      if (!basicPersonalAmountProvincialFixed.party1.isFixed) {
        basicPersonalAmountProvincialVal = basicPersonalAmountOntario(data);
      } else {
        basicPersonalAmountProvincialVal =
          basicPersonalAmountProvincialFixed.party1.value;
      }

      if (!amountForEligibleDependentProvincialFixed.party1.isFixed) {
        amountForEligibleDependentProvincialVal =
          amountForEligibleDependentOntario(data);
      } else {
        amountForEligibleDependentProvincialVal =
          amountForEligibleDependentProvincialFixed.party1.value;
      }
    } else {
      //for party 2
      if (!basicPersonalAmountFederalFixed.party2.isFixed) {
        basicPersonalAmountFederalVal = basicPersonalAmountFederalFormula(data);
      } else {
        basicPersonalAmountFederalVal =
          basicPersonalAmountFederalFixed.party2.value;
      }

      if (!basicPartyDisabilityFixed.party2.isFixed) {
        if (data.screen1.background.party2eligibleForDisability == "Yes") {
          basicPartyDisabilityFixedVal = basicDisabilityAmountFormula(data);
          basicPartyDisabilityFixedProvVal =
            basicDisabilityAmountFormulaProv(data);
        } else {
          basicPartyDisabilityFixedVal = basicPartyDisabilityFixed.party2.value;
          basicPartyDisabilityFixedProvVal =
            basicPartyDisabilityProvFixed.party2.value;
        }
      } else {
        basicPartyDisabilityFixedVal = basicPartyDisabilityFixed.party2.value;
        basicPartyDisabilityFixedProvVal =
          basicPartyDisabilityProvFixed.party2.value;
      }

      if (!amountForEligibleDependentFixed.party2.isFixed) {
        amountForEligibleDependentVal = amountForEligibleDependent(data);
      } else {
        amountForEligibleDependentVal =
          amountForEligibleDependentFixed.party2.value;
      }

      if (!baseCPPContributionFixed.party2.isFixed) {
        baseCPPContributionVal = baseCPPContribution(data);
      } else {
        baseCPPContributionVal = baseCPPContributionFixed.party2.value;
      }

      if (!eiPremiumFixed.party2.isFixed) {
        EIPremiumVal = EIPremiums(data);
      } else {
        EIPremiumVal = eiPremiumFixed.party2.value;
      }

      if (!canadaEmploymentAmountFixed.party2.isFixed) {
        canadaEmploymentAmountVal = canadaEmploymentAmount(data);
      } else {
        canadaEmploymentAmountVal = canadaEmploymentAmountFixed.party2.value;
      }

      if (!basicPersonalAmountProvincialFixed.party2.isFixed) {
        basicPersonalAmountProvincialVal = basicPersonalAmountOntario(data);
      } else {
        basicPersonalAmountProvincialVal =
          basicPersonalAmountProvincialFixed.party2.value;
      }

      if (!amountForEligibleDependentProvincialFixed.party2.isFixed) {
        amountForEligibleDependentProvincialVal =
          amountForEligibleDependentOntario(data);
      } else {
        amountForEligibleDependentProvincialVal =
          amountForEligibleDependentProvincialFixed.party2.value;
      }
    }

    let val = {
      basicPersonalAmountFederal: basicPersonalAmountFederalVal,
      disabilityCredits: basicPartyDisabilityFixedVal,
      disabilityCreditsProv: basicPartyDisabilityFixedProvVal,
      amountForEligibleDependent: amountForEligibleDependentVal,
      amountForEligibleDependentOntario:
        amountForEligibleDependentProvincialVal,
      EIPremiums: EIPremiumVal,
      canadaEmploymentAmount: canadaEmploymentAmountVal,
      basicPersonalAmountOntario: basicPersonalAmountProvincialVal,
      baseCPPContribution: baseCPPContributionVal,
      ageAmount: ageAmountFormula(data),
      totalFederalCredits: sumAllFederalCredits(partyNum),
      totalOntarioCredits: totalOntarioCredits(
        paramsForProvincialCredits(partyNum)
      ),
    };
    return val;
  };

  const totalOntarioCredits = (data: any) => {
    // =SUM(F22:F23)+IF(F1>=65,MAX(5312-(F14-39546)*0.15,0),0)+F19+F20
    let result: number = 0;

    result += data.basicPersonalAmountOntario + data.amountForEligibleDependent;
    // basicPersonalAmountOntario(data) + amountForEligibleDependentOntario(data);

    if (data.ageForPerson >= 65) {
      result += Math.max(5312 - (data.taxableIncome - 39546) * 0.15, 0);
    }

    result += data.baseCPPContribution + data.eiPremiums;

    return result;
  };


  const handleInputChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
  };

  const handleNextClick = async () => {
 
  const newValues: { cashFlows: any; duration: any; amount: number; }[] = [];

  //using loop for calculate-override support tax on by one and push in Array for calculate NPV(net present value); 
   for (const row of rows) {
  const value = await calculateChildAndSpousalSupportAuto(row.cashFlows, row.duration, discountRate, "calculate");
  newValues.push(value);
  }


  let totalNPV = 0;
  let cumulativeDuration = 0;

  newValues.forEach(({ amount, duration }) => {
    let npv = 0;
    for (let t = 1; t <= Number(duration); t++) {
      npv += amount / Math.pow(1 + discountRate / 100, t + Number(cumulativeDuration));
    }
    // using cumulativeDuration just to start next iteration from next duration like if pervious is end in 3 next start from 4.
    cumulativeDuration +=  Number(duration); 
    totalNPV += npv;
  });

   setresResultAFterCal( Math.round(totalNPV.toFixed(2)))
    
     // set result and flow in parent state for save in db and show in report;
    setScenarios((prevScenarios:any) => ({
      ...prevScenarios,
      [scenarioKey]: {
        discountRate,
        cashFlowsAndDurations:newValues,
        npvResult: Math.round(totalNPV.toFixed(2)),
      },
    }));

  };

  

  const resetAllRows=()=>{
   setRows([{ cashFlows: 0, duration: 0 }]);
   setresResultAFterCal('');
  
   setScenarios((prevScenarios) => ({
    ...prevScenarios,
    [scenarioKey]: {
      discountRate : 0 ,
      cashFlowsAndDurations:[],
      npvResult: null,
    },
  }));
  }

  
  useEffect(() => {
    
  
    const initialCashFlowsAndDurations =
    scenarios[scenarioKey]?.cashFlowsAndDurations.length > 0
      ? scenarios[scenarioKey]?.cashFlowsAndDurations
      : [{ cashFlows: 0, duration: 0 }];
    setRows(initialCashFlowsAndDurations);
   
    setDiscountRate(scenarios[scenarioKey]?.discountRate ?scenarios[scenarioKey].discountRate :1.3 );
   
    setresResultAFterCal(scenarios[scenarioKey]?.npvResult);
  }, [scenarioKey]);


  // const calculateNPV = (
  //   cashFlows: number,
  //   duration: number,
  //   discountrate: number
  // ) => {

  //   let npv = 0;
  //   for (let t = 1; t <= duration; t++) {
  //     npv += cashFlows / Math.pow(1 + discountrate / 100, t);
  //   }
  //   return npv.toFixed(2);
  // };



  // const duration_array = calculateDurationOfSupport();
  // const durationofSupport = !(duration_array[0] > 100)
  //   ? Math.round((duration_array[0] + duration_array[1]) / 2)
  //   : 0;
  // const spousalDuration = lumpsum.duration
  //   ? lumpsum.duration
  //   : duration_array[0] > 100
  //   ? CONSTANTS.canada_person_expected_life -
  //     momentFunction.calculateNumberOfYears(
  //       screen1.background.party2DateOfBirth
  //     )
  //   : durationofSupport;
  // const InsurenceDuration = lifeInsurence.age_till_child_support_pay
  //   ? lifeInsurence.age_till_child_support_pay
  //   : 18 -
  //     momentFunction.calculateNumberOfYears(
  //       screen1?.aboutTheChildren?.childrenInfo[0]?.dateOfBirth
  //     );
  // const spousalDurationonInsurence = lifeInsurence.duration
  //   ? lifeInsurence.duration
  //   : spousalDuration;


  // useEffect(()=>{

  //   console.log("screeneeeee2",screen2)



  //   let npvlumpsumLow = 0;
  //   let npvlumpsumMid = 0;
  //   let npvlumpsumHigh = 0;
  //   let npvinsurenceLow = 0;
  //   let npvinsurenceMid = 0;
  //   let npvinsurenceHigh = 0;
  //   let viceversanpvinsurenceLow = 0;
  //   let viceversanpvinsurenceMid = 0;
  //   let viceversanpvinsurenceHigh = 0;
  //   let viceversaChildNpv = 0;




  //   let spousalsupportlow = Math.max(screen2.spousalSupport.spousalSupport1Low, screen2.spousalSupport.spousalSupport2Low)
  //   let spousalsupportmid = Math.max(screen2.spousalSupport.spousalSupport1Med, screen2.spousalSupport.spousalSupport2Med)
  //   let spousalsupporthigh = Math.max(screen2.spousalSupport.spousalSupport1High, screen2.spousalSupport.spousalSupport2High)
  //   let taxablevaluewithAddsupport = Math.max(valueswithoutSpousalSupport.current.party1, valueswithoutSpousalSupport.current.party2)
  //   let taxesWithSpecialExpensesValueLow = Math.max(screen2.taxesWithSpecialExpenses.party1Low, screen2.taxesWithSpecialExpenses.party2Low)
  //   let taxesWithSpecialExpensesValueMid = Math.max(screen2.taxesWithSpecialExpenses.party1Med, screen2.taxesWithSpecialExpenses.party2Med)
  //   let taxesWithSpecialExpensesValueHigh = Math.max(screen2.taxesWithSpecialExpenses.party1High, screen2.taxesWithSpecialExpenses.party2High)



  //   if (screen2.spousalSupport.givenTo == screen1.background.party1FirstName) {
    
  //     npvlumpsumLow = Math.round(
  //       Math.max(Number
  //         (
  //       calculateNPV(
  //         screen2.spousalSupport.spousalSupport1Low * 12 -
  //         (valueswithoutSpousalSupport.current.party2 - screen2.taxesWithSpecialExpenses.party2Low),
  //         spousalDuration, lumpsum.discount_rate)

  //     ), 0)


  //     )
      
  //     npvlumpsumMid = Math.round(
  //       Math.max(
  //         Number(calculateNPV(
  //           screen2.spousalSupport.spousalSupport1Med * 12 - (screen2.taxesWithSpecialExpenses.party2Mid -
  //             taxesWithSpecialExpenses.current.party2Med), spousalDuration, lumpsum.discount_rate))
  //         , 0))


  //     npvlumpsumHigh = Math.round(
  //       Math.max(
  //         Number(
  //           calculateNPV(
  //             screen2.spousalSupport.spousalSupport1High * 12 - (valueswithoutSpousalSupport.current.party2 -
  //               taxesWithSpecialExpenses.current.party2High)
  //             , spousalDuration, lumpsum.discount_rate
  //           ))

  //         , 0))
  //   } else {
  //     console.log("else part")
  //     npvlumpsumLow = Math.round(Math.max(
  //       Number(calculateNPV(
  //         screen2.spousalSupport.spousalSupport2Low * 12 -
  //         (valueswithoutSpousalSupport.current.party1 - screen2.taxesWithSpecialExpenses.party1Low),
  //         spousalDuration, lumpsum.discount_rate))
  //       , 0))


  //     npvlumpsumMid = Math.round(Math.max(Number(calculateNPV(
  //       screen2.spousalSupport.spousalSupport2Med * 12 - (valueswithoutSpousalSupport.current.party1 -
  //         screen2.taxesWithSpecialExpenses.party1Med), spousalDuration, lumpsum.discount_rate)), 0))


  //     npvlumpsumHigh = Math.round(Math.max(Number(
  //       calculateNPV(
  //         screen2.spousalSupport.spousalSupport2High * 12 - (valueswithoutSpousalSupport.current.party1 -
  //           screen2.taxesWithSpecialExpenses.party1High)
  //         , spousalDuration, lumpsum.discount_rate
  //       )
  //     ), 0))


  //   }

  //   if (screen2.childSupport.givenTo == screen1.background.party1FirstName) {
  //     npvinsurenceLow = Math.round(Number(calculateNPV(
  //       spousalsupportlow * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow), spousalDurationonInsurence, lifeInsurence.discount_rate))
  //       +
  //       Number(calculateNPV(screen2.childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate))
  //     )

  //     npvinsurenceMid = Math.round(Number(calculateNPV(
  //       spousalsupportmid * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid), spousalDurationonInsurence, lifeInsurence.discount_rate))
  //       + Number(calculateNPV(screen2.childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate))
  //     )

  //     npvinsurenceHigh = Math.round(Number(calculateNPV(
  //       spousalsupporthigh * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh), spousalDurationonInsurence, lifeInsurence.discount_rate))
  //       + Number(calculateNPV(screen2.childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate))
  //     )
  //   } else {
  //     npvinsurenceLow = Math.round(Number(calculateNPV(
  //       spousalsupportlow * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow), spousalDurationonInsurence, lifeInsurence.discount_rate))
  //       + Number(calculateNPV(screen2.childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate))
  //     )

  //     npvinsurenceMid = Math.round(Number(calculateNPV(
  //       spousalsupportmid * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid), spousalDurationonInsurence, lifeInsurence.discount_rate))
  //       + Number(calculateNPV(screen2.childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate))
  //     )

  //     npvinsurenceHigh = Math.round(Number(calculateNPV(
  //       spousalsupporthigh * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh), spousalDurationonInsurence, lifeInsurence.discount_rate))
  //       + Number(calculateNPV(screen2.childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate))
  //     )
  //   }

  //   if (screen2.childSupport.givenTo == screen1.background.party1FirstName && screen2.spousalSupport.givenTo == screen1.background.party2FirstName) {
  //     viceversaChildNpv = Number(calculateNPV(screen2.childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate));

  //     viceversanpvinsurenceLow = Math.round(Math.max(Number(
  //       calculateNPV(
  //         screen2.spousalSupport.spousalSupport2Low * 12 -
  //         (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow),
  //         spousalDuration, lumpsum.discount_rate)), 0))

  //     viceversanpvinsurenceMid = Math.round(Math.max(Number(
  //       calculateNPV(
  //         screen2.spousalSupport.spousalSupport2Med * 12 -
  //         (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid),
  //         spousalDuration, lumpsum.discount_rate)), 0))

  //     viceversanpvinsurenceHigh = Math.round(Math.max(Number(
  //       calculateNPV(
  //         screen2.spousalSupport.spousalSupport2High * 12 -
  //         (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh),
  //         spousalDuration, lumpsum.discount_rate)), 0))




  //   } else if (
  //     screen2.childSupport.givenTo == screen1.background.party2FirstName && screen2.childSupport.givenTo == screen1.background.party1FirstName) {
  //     viceversaChildNpv = Number(calculateNPV(screen2.childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate));
  //     viceversanpvinsurenceLow = Math.round(Math.max(Number(
  //       calculateNPV(
  //         screen2.spousalSupport.spousalSupport1Low * 12 -
  //         (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow),
  //         spousalDuration, lumpsum.discount_rate)), 0))

  //     viceversanpvinsurenceMid = Math.round(Math.max(Number(
  //       calculateNPV(
  //         screen2.spousalSupport.spousalSupport1Med * 12 -
  //         (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid),
  //         spousalDuration, lumpsum.discount_rate)), 0))

  //     viceversanpvinsurenceHigh = Math.round(Math.max(Number(
  //       calculateNPV(
  //         spousalSupport.spousalSupport1High * 12 -
  //         (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh),
  //         spousalDuration, lumpsum.discount_rate)), 0))
  //   }

  //  let report = {
  //   npvlumpsumLow 
  //   , npvlumpsumMid 
  //   , npvlumpsumHigh 
  //   , npvinsurenceLow 
  //   , npvinsurenceMid 
  //   , npvinsurenceHigh 
  //   , viceversanpvinsurenceLow 
  //   , viceversanpvinsurenceMid 
  //   , viceversanpvinsurenceHigh 
  //   , viceversaChildNpv
  //   }

  //   handleChildData(report)


  //   console.log("allvalues", npvlumpsumLow 
  //   , npvlumpsumMid 
  //   , npvlumpsumHigh 
  //   , npvinsurenceLow 
  //   , npvinsurenceMid 
  //   , npvinsurenceHigh 
  //   , viceversanpvinsurenceLow 
  //   , viceversanpvinsurenceMid 
  //   , viceversanpvinsurenceHigh 
  //   , viceversaChildNpv )


  // },[])


  


  return (
    <>

      <Loader isLoading={loading} loadingMsg={"Calculating..."} />

      <div className='tableInnerRow'>

      <div>
        <table style={{ width: "100%" }}>
          <tr>
            <td><strong>Discount Rate (%):</strong></td>
            <td>  <InputCustom
              handleChange={(e) => setDiscountRate(parseFloat(e.target.value))}
              type="number"
              classNames="form-control"
              value={discountRate}
            /></td>
          </tr>
        </table>


        <div className='d-flex'>
          <label> 
          </label>
        </div>


        <div className="tableOuter m-0 p-0">
          <table className="table customGrid">
            <thead>
              <tr>
                <th style={{paddingLeft:"5px"}}>Amount</th>
                <th className="text-center">
                  Years
                </th>
                <th className="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {
                rows.map((row, index) => (
                  <>
                    <tr>
                   
                      <td style={{paddingLeft:"5px"}}>
                        <div className="form-group">
                          <input
                            className="form-control"
                            value={row.cashFlows}
                            onChange={(e) => handleInputChange(index, 'cashFlows', e.target.value)}
                          
                          />
                   
                        </div>
                      </td>
                      <td>
                        <div className="form-group">
                          <input
                            type="number"
                            className="m-auto"
                            style={{maxWidth: "50px"}}
                            value={row.duration}
                            onChange={(e) => handleInputChange(index, 'duration', e.target.value)}          
                        />
                        </div>
                      </td>

                      <td>
                        <button className="btn btnPrimary rounded-pill mb-4" onClick={()=>setRows([...rows, { cashFlows: '', duration: '' }])}>+Add</button>
                      </td>
                    </tr>
                  </>
                ))
              }

            </tbody>
          </table>
          <div  style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="btn btn-sm btnPrimary rounded-pill mt-2" style={{backgroundColor:"#73C3FD"}} onClick={handleNextClick}>Calculate NPV</button>
            <button className="btn  btn-sm btnPrimary rounded-pill mt-2" style={{backgroundColor:"#73C3FD"}}  onClick={resetAllRows}>Reset</button>

          </div>
          {resResultAFterCal !== null && (
            <div className='text-center' >
              <strong>NPV Result: {resResultAFterCal}</strong>
            </div>
          )}
        </div>
      </div>

    </div>
    </>


  );
};

export default Restructuring;

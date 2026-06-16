import Cookies from "js-cookie";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Dropdown, { Option } from "react-dropdown";
import { default as NumberFormat } from "react-number-format";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { dynamicValuesAction } from "../../../actions/dynamicValuesAction";
import InputCustom from "../../../components/InputCustom";
import Loader from "../../../components/Loader";
import ModalInputCenter from "../../../components/ModalInputCenter";
import HideElement from "../../../HOC/HideElement";
import useQuery from "../../../hooks/useQuery";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import { apiCalculatorById } from "../../../utils/Apis/calculator/Calculator_values_id";
import { SaveAllCalculatorValuesByID } from "../../../utils/Apis/calculator/SaveAllCalculatorValuesByID";
import { getDistinctYearsInTaxRef } from "../../../utils/Apis/getDistinctYearsInTaxRef";
import {
  addAllNumbersInArr,
  getAllUserInfo,
  getUserSID,
  isENVPROD,
  render0IfValueIsNegative,
} from "../../../utils/helpers";
import { formulaForChildBenefit } from "../../../utils/helpers/calculator/ChildBenefit/ChildBenefit";
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
  maximumChildLivesWith,
} from "../../../utils/helpers/calculator/creditTaxCalculationFormulas";
import { determineFederalTaxForAllProv } from "../../../utils/helpers/calculator/FederalTax/FederalTax";
import {
  determineProvTaxAB,
  determineProvTaxBC,
  determineProvTaxON,
  IProvincialTaxAB,
} from "../../../utils/helpers/calculator/ProvincialTax/provincialTax";
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
} from "../../../utils/helpers/calculator/taxCalculationFormula";
import { CanadaWorkersBenefitFormula } from "../../../utils/helpers/calculator/WorkersBenefit/workersBenefits";
import {
  
  formatNumberInThousands,
} from "../../../utils/helpers/Formatting";
import { momentFunction } from "../../../utils/moment";
import {
  backgroundState,
  calculatorScreen2State,
  CUSTODIAL_FORMULA,
  getCalculatorIdFromQuery,
  ItypeOfSplitting,
  ONLY_CHILD,
  Province,
  WITHOUT_CHILD_FORMULA,
} from "../Calculator";

import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../screen1/Screen1";

import {
  determineTypeOfSplitting,
  getNumberOfChildrenWithParty1,
  getNumberOfChildrenWithParty2,
} from "../screen4/Screen4";
import {
  childSupportValuesFor,
  fetchChildSupportDetails,
} from "./childInfo.service";
import {
  climateActionIncentiveAB,
  climateActionIncentiveBC,
  climateActionIncentiveON,
} from "./climateAction.service";
import {
  calculateDisposableIncome,
  calculateSpousalSupportAccToSalaryDiff,
  convertArrToObj,
  CSGOverrideValues,
  determineTypeOfCredits,
  determineWhichPartyHasGreaterIncomeAndChild,
  fedBenefitTypeDropdown,
  fetchAllValuesFromDB,
  filterChildCareExpensesAndSum,
  filterDeductionsOtherThanSpecialExpenses,
  filterEmployedIncome10100AndSum,
  filterFederalCreditsAndSum,
  filterMedicalExpensesAndSum,
  filterNegativeValuesAndSum,
  filterOtherCreditsExceptSpecialExpenses,
  filterOtherDeductionsExceptSpecialExpenses,
  filterPositiveValuesAndSum,
  filterProvincialCreditsAndSum,
  filterSelfEmployedIncomeAndSum,
  findRateForFederalTax,
  getCalculatorLabelFromCookies,
  guidelineIncomeTypeDropdown,
  IFixedValues,
  ifSharedDivideBy2,
  incomeTypeDropdown,
  mapAmountFieldAndTotal,
  MinimumAgeOfChildren,
  noOfChildrenForBenefits,
  noOfSharedChildrenInHybrid,
  partyIncome,
  partyIncomeAndAmount,
  propsTableParams,
  provBenefitBCTypeDropdown,
  provBenefitONTypeDropdown,
  separateValuesDB,
  specialExpensesDropdown,
  totalNumberOfChildren,
  twoPartyStates,
} from "./Screen2";
import { getSvg } from "../AssetsFreeCalculator/Svg";

type Props = {
  settingScreen2StateFromChild: (obj: any) => void;
  screen1: {
    background: backgroundState;
    aboutTheRelationship: aboutTheRelationshipState;
    aboutTheChildren: aboutYourChildrenState;
  };
  screen2: calculatorScreen2State;

  typeOfCalculatorSelected: string;
  setBackground: any;
  setis4thDisplay: any;
  myBtnRef: any;
};

const Screen2 = ({
  typeOfCalculatorSelected,
  settingScreen2StateFromChild,
  screen1,
  screen2,
  setBackground,
  setis4thDisplay,
  myBtnRef,
}: Props) => {
  const calculatorId = useQuery();
  const [showAlertFillAllDetails, setShowAlertFillAllDetails] = useState(false);
  const dispatch = useDispatch();
  const {
    data: { province },
  } = useSelector((state) => state.dynamicValues);

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

  let typeOfReport = useRef(CUSTODIAL_FORMULA);

  const [guidelineIncome, setGuidelineIncome] = useState({
    party1: screen2?.guidelineIncome
      ? screen2.guidelineIncome.party1
      : [{ label: "", amount: "0", value: "" }],
    party2: screen2?.guidelineIncome
      ? screen2.guidelineIncome.party2
      : [
          {
            label: "",
            amount: "0",
            value: "",
          },
        ],
  });

  const [specialExpensesArr, setSpecialExpensesArr] = useState({
    party1: screen2?.specialExpensesArr
      ? screen2.specialExpensesArr.party1
      : [{ label: "", amount: "0", value: "", child: "" }],
    party2: screen2?.specialExpensesArr
      ? screen2.specialExpensesArr.party2
      : [
          {
            label: "",
            amount: "0",
            value: "",
            child: "",
          },
        ],
  });

  const [income, setIncome] = useState({
    party1: screen2?.income
      ? screen2.income.party1
      : [{ label: "", amount: "0", value: "" }],
    party2: screen2?.income?.party2
      ? screen2.income.party2
      : [{ label: "", amount: "0", value: "" }],
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

  const [benefitsForParties, setBenefitsForParties] =
    useState<IBenefitsForParties>({
      party1: {
        fed: [{ label: "", amount: "0", value: "" }],
        prov: [{ label: "", amount: "0", value: "" }],
      },
      party2: {
        fed: [{ label: "", amount: "0", value: "" }],
        prov: [
          {
            label: "",
            amount: "0",
            value: "",
          },
        ],
      },
    });

  //Type of splitting for children, it will determine which type of calculation case we are going to use.
  const [typeOfSplitting, setTypeOfSplitting] =
    useState<ItypeOfSplitting>("SPLIT");

  // This is for high scenerio.
  const applicablePercentage = useRef({
    low: 0,
    med: 0,
    high: 0,
  });

  const [distinctYears, setDistinctYears] = useState({
    allYears: [{ year: 2023 }],
    selectedYear: 2023,
  });

  console.log("distinctYears", distinctYears);

  const [showSaveCalculatorValues, setShowSaveCalculatorValues] =
    useState(false);

  //arrays for matching the values and know when to stop iteration.

  //for low scenerio.
  let matchResultsLow = useRef<number[]>([]);
  let matchResultsLowWithoutSpecialExpenses = useRef<number[]>([]);

  // for mid scenerio
  let matchResults = useRef<number[]>([]);
  let matchResultsWithoutSpecialExpenses = useRef<number[]>([]);

  //for high scenerio
  let matchResultsHigh = useRef<number[]>([]);
  let matchResultsHighWithoutSpecialExpenses = useRef<number[]>([]);

  //make three array for low, med, high special expenses.
  let specialExpensesLow = useRef<number[]>([]);
  let specialExpensesMed = useRef<number[]>([]);
  let specialExpensesHigh = useRef<number[]>([]);

  let marginalTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const marginalReciprocalTax = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  console.log("marginalReciprocalTax", marginalReciprocalTax);

  const [fetchedFederalValuesDB, setFetchedFederalValuesDB] = useState<
    Object[]
  >([]);
  const [fetchedProvincialTaxDB, setFetchedProvincialTaxDB] = useState<
    Object[]
  >([]);
  const [fetchedHealthTaxDB, setFetchedHealthTaxDB] = useState<Object[]>([]);
  const [fetchedONCareTaxDB, setFetchedONCareTaxDB] = useState<Object[]>([]);
  const [fetchedONMrateTaxDB, setFetchedONMrateTaxDB] = useState<Object[]>([]);
  console.log("fetchedONMrateTaxDB", fetchedONMrateTaxDB);
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

  const [showCalculationCompleted, setShowCalculationCompleted] =
    useState(false);

  let supportReceived = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const [loading, setLoading] = useState(false);
  const [screen2loader, setScreen2Loader] = useState(false);

  let benefitsValues = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let benefitsValuesWithoutSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

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

  let taxableIncomeWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let federalTaxWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let ontarioTaxWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let CPPandEIWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let CPPandEISelfEmployedWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let LIFTWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let canadaChildBenefitWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let GSTHSTBenefitWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let ontarioChildBenefitWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let ontarioSalesTaxCreditWithSpecialExpenses = useRef({
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

  let canadaWorkersBenefitWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
  });

  let climateChangeValWithSpecialExpenses = useRef({
    party1Low: 0,
    party2Low: 0,
    party1Med: 0,
    party2Med: 0,
    party1High: 0,
    party2High: 0,
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

  let specialExpensesLowVal = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });
  let specialExpensesMedVal = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  let specialExpensesHighVal = useRef<twoPartyStates>({
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

  const changeInTaxesAndBenefitLow = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });
  const changeInTaxesAndBenefitMed = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });
  const changeInTaxesAndBenefitHigh = useRef<twoPartyStates>({
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

  console.log("originalValues", originalValues);

  const [specialExpenses, setSpecialExpenses] = useState<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const specialExpensesRef = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const [storedCalculatorValues, setStoredCalculatorValues] = useState({
    label: "",
    description: "",
    savedBy: "",
    error: "",
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
  });

  const changeParty1Dropdown = (
    e: { value: string; label: string },
    index: number
  ): void => {
    const party1Details = income.party1;
    party1Details[index]["value"] = e.value;
    party1Details[index]["label"] = e.label;

    setIncome({ ...income, party1: party1Details });
  };

  const changeParty1Amount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party1Details = income.party1;

    party1Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

    setIncome({ ...income, party1: party1Details });
  };

  const changeParty2Dropdown = (
    e: { value: string; label: string },
    index: number
  ): void => {
    const party2Details = income.party2;
    party2Details[index]["value"] = e.value;
    party2Details[index]["label"] = e.label;

    setIncome({ ...income, party2: party2Details });
  };

  const changeParty2Amount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party2Details = income.party2;
    party2Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

    setIncome({ ...income, party2: party2Details });
  };

  const addIncomeToParty1 = () => {
    setIncome((prev) => ({
      ...income,
      party1: [...prev.party1, new partyIncome("", "0", "")],
    }));
  };

  const addIncomeToParty2 = () => {
    setIncome((prev) => ({
      ...income,
      party2: [...prev.party2, new partyIncome("", "0", "")],
    }));
  };

  // ====================== Background Info ===============

  const party1Name = () => {
    return screen1.background.party1FirstName;
  };

  const party2Name = () => {
    return screen1.background.party2FirstName;
  };

  const childSupportGivenTo = () => {
    if (screen1.aboutTheChildren.numberOfChildren > 0) {
      if (
        getNumberOfChildrenWithParty1(screen1.aboutTheChildren.count) >
        getNumberOfChildrenWithParty2(screen1.aboutTheChildren.count)
      ) {
        return party1Name();
      } else {
        return party2Name();
      }
    } else {
      return spousalSupportGivenTo();
    }
  };

  const spousalSupportGivenTo = () => {
    return spousalSupportMed.current.party1 > spousalSupportMed.current.party2
      ? party1Name()
      : party2Name();
  };

  const passStateToParentAndNextPage = async (
    id: number,
    saveValues: boolean
  ) => {
    const obj = {
      income: income,
      deductions,
      benefits,
      guidelineIncome,
      specialExpensesArr,
      tax_year: distinctYears.selectedYear,
      totalIncomeParty1: totalIncomeByIncomeState(income.party1),
      totalIncomeParty2: totalIncomeByIncomeState(income.party2),
      childSupport: {
        childSupport1: marginalReciprocalTax.current.party1
          ? childSupportRef.current.party1 *
            marginalReciprocalTax.current.party1
          : childSupportRef.current.party1,
        childSupport2: marginalReciprocalTax.current.party2
          ? childSupportRef.current.party2 *
            marginalReciprocalTax.current.party2
          : childSupportRef.current.party2,
        givenTo: childSupportGivenTo(),
      },
      childSupportReadOnly: childSupportReadOnly.current,
      spousalSupport: {
        spousalSupport1Med: spousalSupportMed.current.party1,
        spousalSupport2Med: spousalSupportMed.current.party2,
        spousalSupport1Low: spousalSupportLow.current.party1,
        spousalSupport2Low: spousalSupportLow.current.party2,
        spousalSupport1High: spousalSupportHigh.current.party1,
        spousalSupport2High: spousalSupportHigh.current.party2,
        givenTo: spousalSupportGivenTo(),
      },
      changeInTaxesAndBenefit: {
        changeInTaxesAndBenefitLow1: changeInTaxesAndBenefitLow.current.party1,
        changeInTaxesAndBenefitLow2: changeInTaxesAndBenefitLow.current.party2,
        changeInTaxesAndBenefitMed1: changeInTaxesAndBenefitMed.current.party1,
        changeInTaxesAndBenefitMed2: changeInTaxesAndBenefitMed.current.party2,
        changeInTaxesAndBenefitHigh1:
          changeInTaxesAndBenefitHigh.current.party1,
        changeInTaxesAndBenefitHigh2:
          changeInTaxesAndBenefitHigh.current.party2,
      },
      maximumChildLivesWith: maximumChildLivesWith(
        getParamsForCalculatingAllCredits(1)
      ),
      durationOfSupport: calculateDurationOfSupport(),
      specialExpenses: {
        specialExpensesLow1: specialExpensesLowVal.current.party1,
        specialExpensesLow2: specialExpensesLowVal.current.party2,
        specialExpensesMed1: specialExpensesMedVal.current.party1,
        specialExpensesMed2: specialExpensesMedVal.current.party2,
        specialExpensesHigh1: specialExpensesHighVal.current.party1,
        specialExpensesHigh2: specialExpensesHighVal.current.party2,
      },
      canadaChildBenefitFixed: canadaChildBenefitFixed,
      provChildBenefitFixed: provChildBenefitFixed,
      GSTHSTBenefitFixed: GSTHSTBenefitFixed,
      ClimateActionBenefitFixed: ClimateActionBenefitFixed,
      salesTaxBenefitFixed: salesTaxBenefitFixed,
      basicPersonalAmountFederalFixed: basicPersonalAmountFederalFixed,
      amountForEligibleDependentFixed: amountForEligibleDependentFixed,
      baseCPPContributionFixed: baseCPPContributionFixed,
      eiPremiumFixed: eiPremiumFixed,
      canadaEmploymentAmountFixed: canadaEmploymentAmountFixed,
      basicPersonalAmountProvincialFixed: basicPersonalAmountProvincialFixed,
      amountForEligibleDependentProvincialFixed:
        amountForEligibleDependentProvincialFixed,
    };

    syncUpParty1Deduction(specialExpensesArr, "21400");
    syncUpParty2Deduction(specialExpensesArr, "21400");
    calculateAndSetProvincialCredits(1);
    calculateAndSetProvincialCredits(2);

    const report_data = {
      ...obj,
      background: screen1.background,
      aboutTheRelationship: screen1.aboutTheRelationship,
      aboutTheChildren: screen1.aboutTheChildren,
      benefits: screen2.benefits,
      deductions: screen2.deductions,
      totalDeductions: {
        party1: getTotalDeductionsParty1(),
        party2: getTotalDeductionsParty2(),
      },
      lowPropsCalTable,
      medPropsCalTable,
      highPropsCalTable,
      personAgeReceivingSupport: personAgeReceivingSupport(),
      cppDeductions: {
        party1: calculateEnhancedCPPDeductions(1),
        party2: calculateEnhancedCPPDeductions(2),
      },
      federalTaxValues: federalTaxWithSpecialExpenses.current,
      ontarioTaxValues: ontarioTaxWithSpecialExpenses.current,
      CPPandEIValues: CPPandEIWithSpecialExpenses.current,
      CPPandEISelfEmployedValues:
        CPPandEISelfEmployedWithSpecialExpenses.current,
      benefitsValues: benefitsValues.current,
      benefitsValuesWithoutSpecialExpenses:
        benefitsValuesWithoutSpecialExpenses.current,
      taxesWithSpecialExpenses: taxesWithSpecialExpenses.current,
      allCreditsParty1: allCreditsParty1.current,
      allCreditsParty2: allCreditsParty2.current,
      LIFT: LIFTWithSpecialExpenses.current,
      taxableIncomeValues: taxableIncomeWithSpecialExpenses.current,
      GSTHSTValues: GSTHSTBenefitWithSpecialExpenses.current,
      canadaChildBenefitValues: canadaChildBenefitWithSpecialExpenses.current,
      ontarioChildBenefitValues: ontarioChildBenefitWithSpecialExpenses.current,
      ontarioSalesTaxValues: ontarioSalesTaxCreditWithSpecialExpenses.current,
      taxesWithoutSpecialExpenses: taxesWithoutSpecialExpenses.current,
      updated_at: new Date(),
      report_type: typeOfReport.current,
      calculator_type: typeOfCalculatorSelected,
      fetchedFederalValuesDB,
      fetchedProvincialTaxDB,
      fetchedHealthTaxDB,
      fetchedONCareTaxDB,
      fetchedDynamicValues,
      getParamsForCalculatingAllCredits1: getParamsForCalculatingAllCredits(1),
      getParamsForCalculatingAllCredits2: getParamsForCalculatingAllCredits(2),
      employedIncome10100Party1: employedIncome10100Party1(),
      employedIncome10100Party2: employedIncome10100Party2(),
      getTotalSpecialExpensesParty1: getTotalSpecialExpensesParty1(),
      getTotalSpecialExpensesParty2: getTotalSpecialExpensesParty2(),
      childCareExpenses1: limitValueForChildExpenses(
        filterChildCareExpensesAndSum(deductions.party1),
        screen1.aboutTheChildren
      ),
      childCareExpenses2: limitValueForChildExpenses(
        filterChildCareExpensesAndSum(deductions.party2),
        screen1.aboutTheChildren
      ),
      enhancedCPPDeduction: enhancedCPPDeduction.current,
      guidelineIncomeObj: guidelineIncome,
      guidelineIncome: {
        party1: totalIncomeByIncomeState(guidelineIncome.party1),
        party2: totalIncomeByIncomeState(guidelineIncome.party2),
      },
      climateActionIncentive: climateChangeVal.current,
      canadaWorkersBenefitTax: canadaWorkersBenefitTax.current,
      canadaWorkersBenefitWithSpecialExpenses:
        canadaWorkersBenefitWithSpecialExpenses.current,
      climateChangeValWithSpecialExpenses:
        climateChangeValWithSpecialExpenses.current,
      provincialCredits: {
        party1: provincialCredits.current.party1,
        party2: provincialCredits.current.party2,
      },
    };
    if ((id !== null || isNaN(id) === false) && saveValues) {
      await apiCalculatorById.edit_value(id, {
        report_data: report_data,
      });
    }

    settingScreen2StateFromChild({
      ...obj,
    });

    // history.push(
    //   `freecalculator?id=${getCalculatorIdFromQuery(
    //     calculatorId
    //   )}&step=3&saveValues=${saveValues}`
    // );
  };

  //======================= Income ========================

  const employedIncome10100Party1 = () => {
    return filterEmployedIncome10100AndSum(income.party1);
  };

  const employedIncome10100Party2 = () => {
    return filterEmployedIncome10100AndSum(income.party2);
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
      getTotalDeductionsParty1();

    return val;
  };

  const getTaxableIncomeAfterSupportParty2 = () => {
    const val =
      totalIncomeByIncomeState(income.party2) +
      supportReceived.current.party2 -
      // specialExpenses.party2 -
      getTotalDeductionsParty2();

    return val;
  };

  //=================== Credits ====================

  const totalOtherFederalCreditsParty = (data: partyIncomeAndAmount[]) => {
    return filterFederalCreditsAndSum(data);
  };

  const totalOtherOntarioCreditsParty = (data: partyIncomeAndAmount[]) => {
    return filterProvincialCreditsAndSum(data);
  };

  // ============================= SPECIAL EXPENSES ==================================
  const clearSpecialExpensesToZero = () => {
    const newDeductions1 = filterOtherDeductionsExceptSpecialExpenses(
      deductions.party1
    );
    const newDeductions2 = filterOtherDeductionsExceptSpecialExpenses(
      deductions.party2
    );

    const newBenefits1 = filterOtherCreditsExceptSpecialExpenses(
      benefits.party1
    );
    const newBenefits2 = filterOtherCreditsExceptSpecialExpenses(
      benefits.party2
    );

    setDeductions({ party1: newDeductions1, party2: newDeductions2 });
    setBenefits({ party1: newBenefits1, party2: newBenefits2 });
    setSpecialExpenses({
      party1: 0,
      party2: 0,
    });
    specialExpensesRef.current = {
      party1: 0,
      party2: 0,
    };
    childCareExpenses.current = {
      party1: 0,
      party2: 0,
    };
  };

  const getTotalSpecialExpensesParty1 = () => {
    //child care expenses, medical expenses
    return (
      filterChildCareExpensesAndSum(deductions.party1) +
      filterMedicalExpensesAndSum(benefits.party1)
    );
  };

  const getTotalSpecialExpensesParty2 = () => {
    //child care expenses, medical expenses
    return (
      filterChildCareExpensesAndSum(deductions.party2) +
      filterMedicalExpensesAndSum(benefits.party2)
    );
  };

  const getTotalSpecialExpensesForBothParties = () => {
    return getTotalSpecialExpensesParty1() + getTotalSpecialExpensesParty2();
  };

  //canada workers benefits will not be included here.
  const getTotalDeductionsParty1 = () => {
    const specialExpenses =
      specialExpensesRef.current.party1 !== 0
        ? limitValueForChildExpenses(
            filterChildCareExpensesAndSum(deductions.party1),
            screen1.aboutTheChildren
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
    // console.log("Total Deductions {data.party2Name()}", {
    //   deductableSupport: deductableSupport.current,
    //   calculateEnhancedCPPDeductions: calculateEnhancedCPPDeductions(2),
    //   childCareExpenses: limitValueForChildExpenses(
    //     filterChildCareExpensesAndSum(deductions.party2),
    //     screen1.aboutTheChildren
    //   ),
    //   canadaWorkers: canadaWorkersBenefitTax.current,
    //   totalIncomeSpecialExpenses: totalIncomeByIncomeState(
    //     specialExpensesArr.party2
    //   ),
    //   filterDeductionsOtherThanSpecialExpenses:
    //     filterDeductionsOtherThanSpecialExpenses(deductions.party2),
    // });
    const specialExpenses =
      specialExpensesRef.current.party2 !== 0
        ? limitValueForChildExpenses(
            filterChildCareExpensesAndSum(deductions.party2),
            screen1.aboutTheChildren
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

  const getDeductionsMinusBenefits = (partyNum: number) => {
    let val = 0;
    if (partyNum === 1) {
      val = calculateTotalTaxes(1) - sumAllBenefits(1);
    } else {
      val = calculateTotalTaxes(2) - sumAllBenefits(2);
    }

    return val;
  };

  // ============== TAXES ===============

  const calculateCanadaWorkersBenefit1 = (): number => {
    return CanadaWorkersBenefitFormula(
      {
        partyNum: 1,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        aboutTheChildren: screen1.aboutTheChildren,
        totalIncome: totalIncomeByIncomeState(income.party1),
      },
      fetchedDynamicValues,
      screen1.background.party1province
    );
  };

  const calculateCanadaWorkersBenefit2 = (): number => {
    return CanadaWorkersBenefitFormula(
      {
        partyNum: 2,
        taxableIncome: getTaxableIncomeAfterSupportParty2(),
        aboutTheChildren: screen1.aboutTheChildren,
        totalIncome: totalIncomeByIncomeState(income.party2),
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

  const assignValuesAfterAllCalculations = () => {
    setLoading(false);
  };

  const assignValuesToLowKeys = () => {
    taxesWithSpecialExpenses.current.party1Low = calculateTotalTaxes(1);
    taxesWithSpecialExpenses.current.party2Low = calculateTotalTaxes(2);

    // Number(ontarioSalesTax.current.party1) +
    //   Number(OntarioChildBenefit.current.party1) +
    //   Number(GSTHSTBenefit.current.party1) +
    //   Number(childBenefit.current.party1) +
    //   Number(climateChangeVal.current.party1)

    benefitsValues.current.party1Low = sumAllBenefits(1);
    benefitsValues.current.party2Low = sumAllBenefits(2);

    federalTaxWithSpecialExpenses.current.party1Low = determineFederalTax(1);
    federalTaxWithSpecialExpenses.current.party2Low = determineFederalTax(2);

    ontarioTaxWithSpecialExpenses.current.party1Low = calculateProvTax1(
      getProvinceOfParty1()
    );
    ontarioTaxWithSpecialExpenses.current.party2Low = calculateProvTax2(
      getProvinceOfParty1()
    );

    CPPandEIWithSpecialExpenses.current.party1Low =
      calculateCPPandELDeductionsForEmployed(1);
    CPPandEIWithSpecialExpenses.current.party2Low =
      calculateCPPandELDeductionsForEmployed(2);

    CPPandEISelfEmployedWithSpecialExpenses.current.party1Low =
      calculateCPPandEIDeductionsForSelfEmployed(1);
    CPPandEISelfEmployedWithSpecialExpenses.current.party2Low =
      calculateCPPandEIDeductionsForSelfEmployed(2);

    LIFTWithSpecialExpenses.current.party1Low = lowIncomeCredit(
      { totalIncome: totalIncomeByIncomeState(income.party1) },
      getTaxableIncomeAfterSupportParty1()
    );
    LIFTWithSpecialExpenses.current.party2Low = lowIncomeCredit(
      { totalIncome: totalIncomeByIncomeState(income.party2) },
      getTaxableIncomeAfterSupportParty2()
    );

    taxableIncomeWithSpecialExpenses.current.party1Low =
      getTaxableIncomeAfterSupportParty1();
    taxableIncomeWithSpecialExpenses.current.party2Low =
      getTaxableIncomeAfterSupportParty2();

    canadaChildBenefitWithSpecialExpenses.current.party1Low =
      childBenefit.current.party1;
    canadaChildBenefitWithSpecialExpenses.current.party2Low =
      childBenefit.current.party2;

    GSTHSTBenefitWithSpecialExpenses.current.party1Low =
      GSTHSTBenefit.current.party1;
    GSTHSTBenefitWithSpecialExpenses.current.party2Low =
      GSTHSTBenefit.current.party2;

    ontarioChildBenefitWithSpecialExpenses.current.party1Low =
      OntarioChildBenefit.current.party1;
    ontarioChildBenefitWithSpecialExpenses.current.party2Low =
      OntarioChildBenefit.current.party2;

    ontarioSalesTaxCreditWithSpecialExpenses.current.party1Low =
      ontarioSalesTax.current.party1;
    ontarioSalesTaxCreditWithSpecialExpenses.current.party2Low =
      ontarioSalesTax.current.party2;

    canadaWorkersBenefitWithSpecialExpenses.current.party1Low =
      canadaWorkersBenefitTax.current.party1;
    canadaWorkersBenefitWithSpecialExpenses.current.party2Low =
      canadaWorkersBenefitTax.current.party2;

    climateChangeValWithSpecialExpenses.current.party1Low =
      climateChangeVal.current.party1;
    climateChangeValWithSpecialExpenses.current.party2Low =
      climateChangeVal.current.party2;
  };

  const assignValuesToMedKeys = () => {
    taxesWithSpecialExpenses.current.party1Med = calculateTotalTaxes(1);
    taxesWithSpecialExpenses.current.party2Med = calculateTotalTaxes(2);

    benefitsValues.current.party1Med = sumAllBenefits(1);
    benefitsValues.current.party2Med = sumAllBenefits(2);

    federalTaxWithSpecialExpenses.current.party1Med = determineFederalTax(1);
    federalTaxWithSpecialExpenses.current.party2Med = determineFederalTax(2);

    ontarioTaxWithSpecialExpenses.current.party1Med = calculateProvTax1(
      getProvinceOfParty1()
    );
    ontarioTaxWithSpecialExpenses.current.party2Med = calculateProvTax2(
      getProvinceOfParty1()
    );

    CPPandEIWithSpecialExpenses.current.party1Med =
      calculateCPPandELDeductionsForEmployed(1);
    CPPandEIWithSpecialExpenses.current.party2Med =
      calculateCPPandELDeductionsForEmployed(2);

    CPPandEISelfEmployedWithSpecialExpenses.current.party1Med =
      calculateCPPandEIDeductionsForSelfEmployed(1);
    CPPandEISelfEmployedWithSpecialExpenses.current.party2Med =
      calculateCPPandEIDeductionsForSelfEmployed(2);

    LIFTWithSpecialExpenses.current.party1Med = lowIncomeCredit(
      { totalIncome: totalIncomeByIncomeState(income.party1) },
      getTaxableIncomeAfterSupportParty1()
    );
    LIFTWithSpecialExpenses.current.party2Med = lowIncomeCredit(
      { totalIncome: totalIncomeByIncomeState(income.party2) },
      getTaxableIncomeAfterSupportParty2()
    );

    taxableIncomeWithSpecialExpenses.current.party1Med =
      getTaxableIncomeAfterSupportParty1();
    taxableIncomeWithSpecialExpenses.current.party2Med =
      getTaxableIncomeAfterSupportParty2();

    canadaChildBenefitWithSpecialExpenses.current.party1Med =
      childBenefit.current.party1;
    canadaChildBenefitWithSpecialExpenses.current.party2Med =
      childBenefit.current.party2;

    GSTHSTBenefitWithSpecialExpenses.current.party1Med =
      GSTHSTBenefit.current.party1;
    GSTHSTBenefitWithSpecialExpenses.current.party2Med =
      GSTHSTBenefit.current.party2;

    ontarioChildBenefitWithSpecialExpenses.current.party1Med =
      OntarioChildBenefit.current.party1;
    ontarioChildBenefitWithSpecialExpenses.current.party2Med =
      OntarioChildBenefit.current.party2;

    ontarioSalesTaxCreditWithSpecialExpenses.current.party1Med =
      ontarioSalesTax.current.party1;
    ontarioSalesTaxCreditWithSpecialExpenses.current.party2Med =
      ontarioSalesTax.current.party2;

    canadaWorkersBenefitWithSpecialExpenses.current.party1Med =
      canadaWorkersBenefitTax.current.party1;
    canadaWorkersBenefitWithSpecialExpenses.current.party2Med =
      canadaWorkersBenefitTax.current.party2;

    climateChangeValWithSpecialExpenses.current.party1Med =
      climateChangeVal.current.party1;
    climateChangeValWithSpecialExpenses.current.party2Med =
      climateChangeVal.current.party2;
  };

  const assignValuesToHighKeys = () => {
    taxesWithSpecialExpenses.current.party1High = calculateTotalTaxes(1);
    taxesWithSpecialExpenses.current.party2High = calculateTotalTaxes(2);

    benefitsValues.current.party1High = sumAllBenefits(1);
    benefitsValues.current.party2High = sumAllBenefits(2);

    federalTaxWithSpecialExpenses.current.party1High = determineFederalTax(1);
    federalTaxWithSpecialExpenses.current.party2High = determineFederalTax(2);

    ontarioTaxWithSpecialExpenses.current.party1High = calculateProvTax1(
      getProvinceOfParty1()
    );
    ontarioTaxWithSpecialExpenses.current.party2High = calculateProvTax2(
      getProvinceOfParty1()
    );

    CPPandEIWithSpecialExpenses.current.party1High =
      calculateCPPandELDeductionsForEmployed(1);
    CPPandEIWithSpecialExpenses.current.party2High =
      calculateCPPandELDeductionsForEmployed(2);

    CPPandEISelfEmployedWithSpecialExpenses.current.party1High =
      calculateCPPandEIDeductionsForSelfEmployed(1);
    CPPandEISelfEmployedWithSpecialExpenses.current.party2High =
      calculateCPPandEIDeductionsForSelfEmployed(2);

    LIFTWithSpecialExpenses.current.party1High = lowIncomeCredit(
      { totalIncome: totalIncomeByIncomeState(income.party1) },
      getTaxableIncomeAfterSupportParty1()
    );
    LIFTWithSpecialExpenses.current.party2High = lowIncomeCredit(
      { totalIncome: totalIncomeByIncomeState(income.party2) },
      getTaxableIncomeAfterSupportParty2()
    );

    taxableIncomeWithSpecialExpenses.current.party1High =
      getTaxableIncomeAfterSupportParty1();
    taxableIncomeWithSpecialExpenses.current.party2High =
      getTaxableIncomeAfterSupportParty2();

    canadaChildBenefitWithSpecialExpenses.current.party1High =
      childBenefit.current.party1;
    canadaChildBenefitWithSpecialExpenses.current.party2High =
      childBenefit.current.party2;

    GSTHSTBenefitWithSpecialExpenses.current.party1High =
      GSTHSTBenefit.current.party1;
    GSTHSTBenefitWithSpecialExpenses.current.party2High =
      GSTHSTBenefit.current.party2;

    ontarioChildBenefitWithSpecialExpenses.current.party1High =
      OntarioChildBenefit.current.party1;
    ontarioChildBenefitWithSpecialExpenses.current.party2High =
      OntarioChildBenefit.current.party2;

    ontarioSalesTaxCreditWithSpecialExpenses.current.party1High =
      ontarioSalesTax.current.party1;
    ontarioSalesTaxCreditWithSpecialExpenses.current.party2High =
      ontarioSalesTax.current.party2;

    canadaWorkersBenefitWithSpecialExpenses.current.party1High =
      canadaWorkersBenefitTax.current.party1;
    canadaWorkersBenefitWithSpecialExpenses.current.party2High =
      canadaWorkersBenefitTax.current.party2;

    climateChangeValWithSpecialExpenses.current.party1High =
      climateChangeVal.current.party1;
    climateChangeValWithSpecialExpenses.current.party2High =
      climateChangeVal.current.party2;
  };

  const assignValuesToHighKeysWithoutSpecialExpenses = () => {
    taxesWithoutSpecialExpenses.current.party1High =
      getDeductionsMinusBenefits(1);
    taxesWithoutSpecialExpenses.current.party2High =
      getDeductionsMinusBenefits(2);

    benefitsValuesWithoutSpecialExpenses.current.party1High = sumAllBenefits(1);
    benefitsValuesWithoutSpecialExpenses.current.party2High = sumAllBenefits(2);
  };

  const assignValuesToMedKeysWithoutSpecialExpenses = () => {
    taxesWithoutSpecialExpenses.current.party1Med =
      getDeductionsMinusBenefits(1);
    taxesWithoutSpecialExpenses.current.party2Med =
      getDeductionsMinusBenefits(2);

    benefitsValuesWithoutSpecialExpenses.current.party1Med = sumAllBenefits(1);
    benefitsValuesWithoutSpecialExpenses.current.party2Med = sumAllBenefits(2);
  };

  const assignValuesToLowKeysWithoutSpecialExpenses = () => {
    taxesWithoutSpecialExpenses.current.party1Low =
      getDeductionsMinusBenefits(1);
    taxesWithoutSpecialExpenses.current.party2Low =
      getDeductionsMinusBenefits(2);

    benefitsValuesWithoutSpecialExpenses.current.party1Low = sumAllBenefits(1);
    benefitsValuesWithoutSpecialExpenses.current.party2Low = sumAllBenefits(2);
  };

  const assignValueForSpousalSupport = (
    spousalAmount1: number,
    spousalAmount2: number,
    result: number,
    rate: number
  ) => {
    // console.log("Assigning Spousal support", {
    //   spousalAmount1,
    //   spousalAmount2,
    //   result,
    //   rate,
    // });
    console.log("result spousalAmount1", spousalAmount1);
    console.log("result spousalAmount2", spousalAmount2);
    console.log("result diff", result);
    console.log("result rate", rate);

    if (spousalAmount1 > spousalAmount2) {
      if (rate === 0.4) {
        spousalSupportLow.current.party1 = 0;
        spousalSupportLow.current.party2 = result;
      } else if (rate === 0.43) {
        spousalSupportMed.current.party1 = 0;
        spousalSupportMed.current.party2 = result;
      } else {
        spousalSupportHigh.current.party1 = 0;
        spousalSupportHigh.current.party2 = result;
      }
    } else if (spousalAmount2 > spousalAmount1) {
      if (rate === 0.4) {
        spousalSupportLow.current.party1 = result;
        spousalSupportLow.current.party2 = 0;
      } else if (rate === 0.43) {
        spousalSupportMed.current.party1 = result;
        spousalSupportMed.current.party2 = 0;
      } else {
        spousalSupportHigh.current.party1 = result;
        spousalSupportHigh.current.party2 = 0;
      }
    }
  };

  const limitValueForChildExpenses = (
    childSupportVal: number,
    aboutTheChildren: aboutYourChildrenState
  ) => {
    if (MinimumAgeOfChildren(aboutTheChildren) < 7) {
      if (childSupportVal > 8000) {
        return 8000;
      }
    } else if (
      MinimumAgeOfChildren(aboutTheChildren) >= 7 &&
      MinimumAgeOfChildren(aboutTheChildren) <= 17
    ) {
      if (childSupportVal > 5000) {
        return 5000;
      }
    }
    return childSupportVal;
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

    //else if type of splitting hybrid.
    //
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

  const whichPartyPayedSpecialExpenses = () => {
    const party1Deductions = filterChildCareExpensesAndSum(deductions.party1);
    const party2Deductions = filterChildCareExpensesAndSum(deductions.party2);

    const party1Benefits = filterMedicalExpensesAndSum(benefits.party1);
    const party2Benefits = filterMedicalExpensesAndSum(benefits.party2);

    if (party1Deductions > party2Deductions) {
      return 1;
    } else if (party1Benefits > party2Benefits) {
      return 1;
    } else {
      return 2;
    }
  };

  const calculateChildSupport = () => {
    //For Party 1
    //declare variable notionalChildSupport1 = 0;
    //if split case, then totalNumberofchildren - noOfChildrenOfTheParty2
    //find child support using above data (res).
    //notionalChildSupport1 = res;

    //For {data.party2Name()}
    //declare variable notionalChildSupport2 = 0;
    //if split case, then totalNumberofchildren - noOfChildrenOfTheParty1
    //find child support using above data (res).
    //notionalChildSupport2 = res;

    //add childSupportTotal = notionalSupport + actualChildSupport in case of split
    //then use this childSupportTotal in household income.

    //actual Child support = notional child support when shared,

    // for understanding this deeply, please refer the excel sheet.
    const CSGOverrideValuesParty1 = CSGOverrideValues(
      screen1.aboutTheChildren,
      screen1.background,
      1
    );

    console.log("CSGOverrideValuesParty1", CSGOverrideValuesParty1);

    const CSGOverrideValuesParty2 = CSGOverrideValues(
      screen1.aboutTheChildren,
      screen1.background,
      2
    );

    console.log("CSGOverrideValuesParty2", CSGOverrideValuesParty2);

    const totalIncomeParty1WithGuideline = totalIncomeByIncomeState([
      ...income.party1,
      ...guidelineIncome.party1,
    ]).toString();

    console.log(
      "totalIncomeParty1WithGuideline",
      totalIncomeParty1WithGuideline
    );

    const totalIncomeParty2WithGuideline = totalIncomeByIncomeState([
      ...income.party2,
      ...guidelineIncome.party2,
    ]).toString();

    console.log(
      "totalIncomeParty2WithGuideline",
      totalIncomeParty2WithGuideline
    );

    console.log("fetchedChildSupportValues", fetchedChildSupportValues);
    console.log("CSGOverrideValuesParty1.length", CSGOverrideValuesParty1);
    console.log(
      "numberOfChildrenForCalculatingChildSupport(1)",
      numberOfChildrenForCalculatingChildSupport(1) -
        CSGOverrideValuesParty1.length
    );
    console.log("getProvinceOfParty1()", getProvinceOfParty1());

    console.log("CSGOverrideValuesParty2.length", CSGOverrideValuesParty2);
    console.log(
      "numberOfChildrenForCalculatingChildSupport(2)",
      numberOfChildrenForCalculatingChildSupport(1) -
        CSGOverrideValuesParty1.length
    );
    console.log("getProvinceOfParty1()", getProvinceOfParty2());

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
        numberOfChildrenForCalculatingChildSupport(2) -
          CSGOverrideValuesParty2.length,
        getProvinceOfParty1()
      )[0],

      notionalAmount2: fetchChildSupportDetails(
        fetchedChildSupportValues,
        totalIncomeParty2WithGuideline,
        numberOfChildrenForCalculatingChildSupport(1) -
          CSGOverrideValuesParty1.length,
        getProvinceOfParty2()
      )[0],
    };

    console.log("childSupportFilteredValues", childSupportFilteredValues);

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
      console.log("in if condition");
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
              ? Number(party1NotionalAmount * 12) +
                addAllNumbersInArr(CSGOverrideValuesParty1) * 12
              : 0,
          party2:
            childLivesWithParty2 === 2
              ? Number(party2NotionalAmount * 12) +
                addAllNumbersInArr(CSGOverrideValuesParty2) * 12
              : 0,
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

  const iterativeFormula = (rate: number, time: number) => {
    // Save original Values.
    // pass rate as parameter in manually function
    // when function return value, call reset function to restore original Values.
    return new Promise(async (resolve, reject) => {
      // calculate Child Support in two ways.
      // actual support and notional support.
      // So, find the notional support
      // which party has children, has the notional amount.

      //calculating all the taxes, credits and calculations for both parties
      calculateAllOperationsForParty1();
      calculateAllOperationsForParty2();

      const houseHoldIncome1 = calculateDisposableIncome1WithoutEnhancedCPP(
        childSupportRef.current.party1 + notionalAmountRef.current.party1
      );

      console.log(
        "childSupportRef.current.party1",
        childSupportRef.current.party1
      );
      console.log(
        "notionalAmountRef.current.party1",
        notionalAmountRef.current.party1
      );
      console.log(
        "childSupportRef.current.party2",
        childSupportRef.current.party2
      );
      console.log(
        "notionalAmountRef.current.party2",
        notionalAmountRef.current.party2
      );

      //use childSupportTotal2
      const houseHoldIncome2 = calculateDisposableIncome2WithoutEnhancedCPP(
        childSupportRef.current.party2 + notionalAmountRef.current.party2
      );

      console.log("houseHoldIncome2", houseHoldIncome2);

      let spousalSupportVal;

      if (time === 0) {
        if (rate === 0.4) spousalSupportVal = globallowSupport.current;
        if (rate === 0.43) spousalSupportVal = globalmedSupport.current;
        if (rate === 0.46) spousalSupportVal = globalhighSupport.current;
      } else {
        spousalSupportVal = spousalSupportFormulaByRate(
          houseHoldIncome1,
          houseHoldIncome2,
          rate
        );
      }

      //parameter .40, .43, .46, .50
      // let spousalSupportVal = spousalSupportFormulaByRate(
      //   houseHoldIncome1,
      //   houseHoldIncome2,
      //   rate
      // );

      //assigning spousal support when we have calculated for the spousal support with special expenses.
      if (time === 2) {
        let count = 0;
        console.log("count ka count", (count = count + 1));
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

      // console.log("result*", {
      //   houseHoldIncome1,
      //   houseHoldIncome2,
      //   householdIncomeTotal: houseHoldIncome2 + houseHoldIncome1,
      //   spousalsupport: spousalSupportVal,
      //   deductableTaxRes,
      //   rate,
      //   time,
      //   taxesWithoutSpecialExpenses,
      // });

      //In these arrays we are storing the spousal support for tracking and knowning where do we need to stop.
      if (rate === 0.4 && time === 1) {
        matchResultsLowWithoutSpecialExpenses.current.push(spousalSupportVal);
        //store value for tax

        assignValuesToLowKeysWithoutSpecialExpenses();
        // console.log("& pushing to low one Tax", taxesWithoutSpecialExpenses);
      } else if (rate === 0.43 && time === 1) {
        matchResultsWithoutSpecialExpenses.current.push(spousalSupportVal);
        // console.log("& pushing to med one Tax", taxesWithoutSpecialExpenses);

        assignValuesToMedKeysWithoutSpecialExpenses();
      } else if (rate === 0.46 && time === 1) {
        matchResultsHighWithoutSpecialExpenses.current.push(spousalSupportVal);
        // console.log("& pushing to high one Tax", taxesWithoutSpecialExpenses);

        assignValuesToHighKeysWithoutSpecialExpenses();
      } else if (rate === 0.4 && time === 2) {
        // storing values for tracking the spousal support for low case in majority parenting scenerio.
        specialExpensesLow.current.push(spousalSupportVal);

        // assigning values for low case when the spousal support with the special expenses is calculated.
        assignValuesToLowKeys();
      } else if (rate === 0.43 && time === 2) {
        // storing values for tracking the spousal support for med case in majority parenting scenerio.
        specialExpensesMed.current.push(spousalSupportVal);

        // assigning values for med case when the spousal support with the special expenses is calculated.
        assignValuesToMedKeys();
      } else if (rate === 0.46 && time === 2) {
        //storing values for tracking the spousal support for high case in majority parenting scenerio.
        specialExpensesHigh.current.push(spousalSupportVal);

        // assigning values for high case when the spousal support with the special expenses is calculated.
        assignValuesToHighKeys();
      } else if (time === 0) {
        //This is the case for HIGH scenerio.
        // for the high case we do not iterate. We just calculate once.
        // This is the logic for assigning values in low, med and high cases in HIGH Scenerio.
        if (rate === 0.4) assignValuesToLowKeys();
        else if (rate === 0.43) assignValuesToMedKeys();
        else if (rate === 0.46) assignValuesToHighKeys();
        // if (matchResultsHigh.current.length === 1) assignValuesToLowKeys();
        // else if (matchResultsHigh.current.length === 3) assignValuesToMedKeys();
        // else assignValuesToHighKeys();

        // matchResultsHigh.current.push(spousalSupportVal);
        // console.log("Tracking HIGH case array", matchResultsHigh);
      }

      resolve({
        deductableTaxRes,
        spousalSupportMedium: spousalSupportVal,
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

  const calculateSpecialExpenseSupport = (
    taxesWithoutSpecialExpenses: {
      party1Low: number;
      party2Low: number;
      party1Med: number;
      party2Med: number;
      party1High: number;
      party2High: number;
    },
    type: "Low" | "Med" | "High"
  ) => {
    //When time === 1, then calculations are done with special expenses as ZERO.

    //When time === 2, then we are assigning special expenses to the variables which will be used for calculations. This is because we want to see the difference between the taxes when special expenses are zero and when they have some value.

    let taxesWithoutSpecialExpensesType1 =
      type === "Low"
        ? taxesWithoutSpecialExpenses.party1Low
        : type === "Med"
        ? taxesWithoutSpecialExpenses.party1Med
        : taxesWithoutSpecialExpenses.party1High;

    let taxesWithoutSpecialExpensesType2 =
      type === "Low"
        ? taxesWithoutSpecialExpenses.party2Low
        : type === "Med"
        ? taxesWithoutSpecialExpenses.party2Med
        : taxesWithoutSpecialExpenses.party2High;

    const party1TaxesMinusDeductions =
      taxesWithoutSpecialExpensesType1 - getDeductionsMinusBenefits(1);

    const party2TaxesMinusDeductions =
      taxesWithoutSpecialExpensesType2 - getDeductionsMinusBenefits(2);

    const partyWhoPayed = whichPartyPayedSpecialExpenses();
    let amountToBeDeducted = 0;

    if (partyWhoPayed === 1) {
      // console.log("party 1 payed");
      amountToBeDeducted = party1TaxesMinusDeductions;
      if (type === "Low") {
        changeInTaxesAndBenefitLow.current.party1 = amountToBeDeducted;
      } else if (type === "Med") {
        changeInTaxesAndBenefitMed.current.party1 = amountToBeDeducted;
      } else {
        changeInTaxesAndBenefitHigh.current.party1 = amountToBeDeducted;
      }
    } else if (partyWhoPayed === 2) {
      // console.log("party 2 payed");
      amountToBeDeducted = party2TaxesMinusDeductions;
      if (type === "Low") {
        changeInTaxesAndBenefitLow.current.party2 = amountToBeDeducted;
      } else if (type === "Med") {
        changeInTaxesAndBenefitMed.current.party2 = amountToBeDeducted;
      } else {
        changeInTaxesAndBenefitHigh.current.party2 = amountToBeDeducted;
      }
    }
    const totalAmountToBeShared =
      getTotalSpecialExpensesForBothParties() - amountToBeDeducted;

    //if else statement
    let householdIncome = 0;
    let percentageParty1 = 0;
    let percentageParty2 = 0;

    if (supportReceived.current.party1 > supportReceived.current.party2) {
      householdIncome =
        totalIncomeByIncomeState(income.party1) +
        supportReceived.current.party1 +
        totalIncomeByIncomeState(income.party2) -
        deductableSupport.current.party2;

      percentageParty1 =
        Number(
          totalIncomeByIncomeState(income.party1) +
            supportReceived.current.party1
        ) / householdIncome;

      percentageParty2 =
        Number(
          totalIncomeByIncomeState(income.party2) -
            deductableSupport.current.party2
        ) / householdIncome;
    } else {
      householdIncome =
        totalIncomeByIncomeState(income.party1) -
        deductableSupport.current.party1 +
        totalIncomeByIncomeState(income.party2) +
        supportReceived.current.party2;

      percentageParty2 =
        Number(
          totalIncomeByIncomeState(income.party2) +
            supportReceived.current.party2
        ) / householdIncome;

      percentageParty1 =
        Number(
          totalIncomeByIncomeState(income.party1) -
            deductableSupport.current.party1
        ) / householdIncome;
    }

    //if else statement
    let annualPaymentByPayingParty1 = 0;
    let annualPaymentByPayingParty2 = 0;

    if (partyWhoPayed === 1) {
      annualPaymentByPayingParty2 = totalAmountToBeShared * percentageParty2;
      annualPaymentByPayingParty1 =
        getTotalSpecialExpensesForBothParties() - annualPaymentByPayingParty2;
    } else {
      annualPaymentByPayingParty1 = totalAmountToBeShared * percentageParty1;
      annualPaymentByPayingParty2 =
        getTotalSpecialExpensesForBothParties() - annualPaymentByPayingParty1;
    }
    //return this thing in special expenses functions

    const obj = {
      party1: annualPaymentByPayingParty1,
      party2: annualPaymentByPayingParty2,
    };

    setSpecialExpenses(obj);
    specialExpensesRef.current = obj;

    if (type === "Low") {
      specialExpensesLowVal.current = {
        party1: annualPaymentByPayingParty1,
        party2: annualPaymentByPayingParty2,
      };
    } else if (type === "Med") {
      specialExpensesMedVal.current = {
        party1: annualPaymentByPayingParty1,
        party2: annualPaymentByPayingParty2,
      };
    } else {
      specialExpensesHighVal.current = {
        party1: annualPaymentByPayingParty1,
        party2: annualPaymentByPayingParty2,
      };
    }

    return obj;
  };

  //one time iterate
  const calculateChildAndSpousalSupportManually = (
    rate: number,
    time: number = 0
  ) => {
    //Can refactor this.
    return new Promise((resolve, reject) => {
      iterativeFormula(rate, time)
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
    } = creditSelection;

    const val =
      basicPersonalAmountFederal +
      ageAmount +
      amountForEligibleDependent +
      baseCPPContribution +
      EIPremiums +
      canadaEmploymentAmount;

    return val;
  };

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

      // console.log("logs AB prov obj 1", objAB);

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

  /// =========================== TOTAL TAX ========================================

  const calculateTotalTaxes = (partyNum: number) => {
    // !!federal tax is wrong.
    // !!Provincial Tax is wrong
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
    // for BC we do not need to divide by 2.
    // for ON we need to.
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

    // console.log("canada Child benefit", val);

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

  const determineChildBenefit = () => {
    if (!canadaChildBenefitFixed.party1.isFixed) {
      childBenefit.current.party1 = childBenefitParty1();
    }

    if (!canadaChildBenefitFixed.party2.isFixed) {
      childBenefit.current.party2 = childBenefitParty2();
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
      GSTHSTBenefit.current.party1 = GSTHSTBenefitsParty1();
    }

    if (!GSTHSTBenefitFixed.party2.isFixed) {
      GSTHSTBenefit.current.party2 = GSTHSTBenefitsParty2();
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
      OntarioChildBenefit.current.party1 = ontarioChildBenefitParty1();
    }

    if (!provChildBenefitFixed.party2.isFixed) {
      OntarioChildBenefit.current.party2 = ontarioChildBenefitParty2();
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
      climateChangeVal.current.party1 = calculateClimateChange(1);
    }

    if (!ClimateActionBenefitFixed.party2.isFixed) {
      climateChangeVal.current.party2 = calculateClimateChange(2);
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
      ontarioSalesTax.current.party1 = ontarioSalesTaxParty1(
        getProvinceOfParty1()
      );
    }

    if (!salesTaxBenefitFixed.party2.isFixed) {
      ontarioSalesTax.current.party2 = ontarioSalesTaxParty2(
        getProvinceOfParty2()
      );
    }
  };

  const sumAllBenefits = (partyNum: number = 2) => {
    // console.log("&& total benefits", partyNum, {
    //   ontarioSalesTax: ontarioSalesTax.current,
    //   OntarioChildBenefit: OntarioChildBenefit.current,
    //   GSTHST: GSTHSTBenefit.current,
    //   childBenefit: childBenefit.current,
    //   climateChangeVal: climateChangeVal.current,
    //   totalParty1: Number(
    //     (
    //       Number(ontarioSalesTax.current.party1) +
    //       Number(OntarioChildBenefit.current.party1) +
    //       Number(GSTHSTBenefit.current.party1) +
    //       Number(childBenefit.current.party1) +
    //       Number(climateChangeVal.current.party1)
    //     ).toFixed(4)
    //   ),
    //   totalParty2: Number(
    //     (
    //       Number(ontarioSalesTax.current.party2) +
    //       Number(OntarioChildBenefit.current.party2) +
    //       Number(GSTHSTBenefit.current.party2) +
    //       Number(childBenefit.current.party2) +
    //       Number(climateChangeVal.current.party2)
    //     ).toFixed(4)
    //   ),
    // });

    if (partyNum === 1) {
      return render0IfValueIsNegative(
        Number(
          (
            Number(ontarioSalesTax.current.party1) +
            Number(OntarioChildBenefit.current.party1) +
            Number(GSTHSTBenefit.current.party1) +
            Number(childBenefit.current.party1) +
            Number(climateChangeVal.current.party1)
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
            Number(climateChangeVal.current.party2)
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

      //set support received for party1 here

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
  }) => {
    setLoading(true);

    async function waitUntil(rate: number, time: number) {
      return await new Promise<number>((resolve, reject) => {
        const ifStatementAccToRate = (
          rate: number,
          count: number,
          time: number
        ) => {
          //for low case and without special expenses.
          if (rate === 0.4 && time === 0) {
            return (
              Number(
                matchResultsLow.current[matchResultsLow.current.length - 1]
              ) ===
                Number(
                  matchResultsLow.current[matchResultsLow.current.length - 6]
                ) || count === 25
            );
          }
          //for mid case and without special expenses.
          else if (rate === 0.43 && time === 0) {
            return (
              Number(matchResults.current[matchResults.current.length - 1]) ===
                Number(matchResults.current[matchResults.current.length - 6]) ||
              count === 25
            );
          }
          //for low case and with special expenses.
          else if (rate === 0.4 && time === 1) {
            return (
              Number(
                matchResultsLowWithoutSpecialExpenses.current[
                  matchResultsLowWithoutSpecialExpenses.current.length - 1
                ]
              ) ===
                Number(
                  matchResultsLowWithoutSpecialExpenses.current[
                    matchResultsLowWithoutSpecialExpenses.current.length - 6
                  ]
                ) || count === 25
            );
          }
          //for mid case and with special expenses.
          else if (rate === 0.43 && time === 1) {
            return (
              Number(
                matchResultsWithoutSpecialExpenses.current[
                  matchResultsWithoutSpecialExpenses.current.length - 1
                ]
              ) ===
                Number(
                  matchResultsWithoutSpecialExpenses.current[
                    matchResultsWithoutSpecialExpenses.current.length - 6
                  ]
                ) || count === 25
            );
          }
          //for high case and with special expenses.
          else if (rate === 0.46 && time === 1) {
            return (
              Number(
                matchResultsHighWithoutSpecialExpenses.current[
                  matchResultsHighWithoutSpecialExpenses.current.length - 1
                ]
              ) ===
                Number(
                  matchResultsHighWithoutSpecialExpenses.current[
                    matchResultsHighWithoutSpecialExpenses.current.length - 6
                  ]
                ) || count === 25
            );
          } else if (rate === 0.4 && time === 2) {
            return (
              Number(
                specialExpensesLow.current[
                  specialExpensesLow.current.length - 1
                ]
              ) ===
                Number(
                  specialExpensesLow.current[
                    specialExpensesLow.current.length - 6
                  ]
                ) || count === 25
            );
          } else if (rate === 0.43 && time === 2) {
            return (
              Number(
                specialExpensesMed.current[
                  specialExpensesMed.current.length - 1
                ]
              ) ===
                Number(
                  specialExpensesMed.current[
                    specialExpensesMed.current.length - 6
                  ]
                ) || count === 25
            );
          } else if (rate === 0.46 && time === 2) {
            return (
              Number(
                specialExpensesHigh.current[
                  specialExpensesHigh.current.length - 1
                ]
              ) ===
                Number(
                  specialExpensesHigh.current[
                    specialExpensesHigh.current.length - 6
                  ]
                ) || count === 25
            );
          }
          // for high cases and without special expenses.
          else if (time === 0) {
            return (
              Number(
                matchResultsHigh.current[matchResultsHigh.current.length - 1]
              ) ===
                Number(
                  matchResultsHigh.current[matchResultsHigh.current.length - 6]
                ) || count === 25
            );
          }
        };

        const resolveAccToRate = (
          rate: 0.4 | 0.43 | 0.46,
          time: 0 | 1 | 2
        ): number | undefined => {
          if (rate === 0.4 && time === 1) {
            // console.log("&* in low Tax column");
            const val =
              matchResultsLowWithoutSpecialExpenses.current[
                matchResultsLowWithoutSpecialExpenses.current.length - 1
              ];

            return val;
          } else if (rate === 0.43 && time === 1) {
            // console.log("&* in med Tax column");
            const val =
              matchResultsWithoutSpecialExpenses.current[
                matchResultsWithoutSpecialExpenses.current.length - 1
              ];
            return val;
          } else if (rate === 0.46 && time === 1) {
            // console.log("&* in high Tax column");
            const val =
              matchResultsHighWithoutSpecialExpenses.current[
                matchResultsHighWithoutSpecialExpenses.current.length - 1
              ];
            return val;
          } else if (rate === 0.4 && time === 2) {
            // console.log("&* in low Tax column");
            const val =
              specialExpensesLow.current[specialExpensesLow.current.length - 1];
            return val;
          } else if (rate === 0.43 && time === 2) {
            // console.log("&* in med Tax column");
            const val =
              specialExpensesMed.current[specialExpensesMed.current.length - 1];
            return val;
          } else if (rate === 0.46 && time === 2) {
            // console.log("&* in high Tax column");
            const val =
              specialExpensesHigh.current[
                specialExpensesHigh.current.length - 1
              ];
            return val;
          } else if (time === 0) {
            const val =
              matchResultsHigh.current[matchResultsHigh.current.length - 1];
            return val;
          }
        };

        let count = 0;

        const timer = setInterval(
          async (rateParam, time) => {
            // console.log("&* set interval called ", rateParam, time);
            if (ifStatementAccToRate(rateParam, count, time)) {
              clearInterval(timer);
              // refButtonResetValues.current.click();
              resetAllValues();

              count = 0;
              return resolve(resolveAccToRate(rateParam, time));
            }
            try {
              count++;
              console.log("countkabapp", count);
              if (rateParam === 0.4 && time === 1) {
                //run with special expenses zero on first time.
                clearSpecialExpensesToZero();
                //save the value of the taxes in variable
                await calculateChildAndSpousalSupportManually(0.4, 1);

                //when I have constant taxes value
                //then the iterative function again
                //set special expenses accordingly.

                //keep calling function.
              } else if (rateParam === 0.43 && time === 1) {
                clearSpecialExpensesToZero();
                await calculateChildAndSpousalSupportManually(0.43, 1);
                // console.log(
                //   "&* Med one Tax work",
                //   matchResultsWithoutSpecialExpenses
                // );
              } else if (rateParam === 0.46 && time === 1) {
                clearSpecialExpensesToZero();
                await calculateChildAndSpousalSupportManually(0.46, 1);

                // console.log(
                //   "&* High one Tax work",
                //   matchResultsHighWithoutSpecialExpenses
                // );
              } else if (rateParam === 0.4 && time === 2) {
                syncUpParty1Deduction(specialExpensesArr, "21400");
                syncUpParty2Deduction(specialExpensesArr, "21400");
                // assigning the special expenses variable the value and then calculating it
                if (getTotalSpecialExpensesForBothParties() > 0) {
                  calculateSpecialExpenseSupport(
                    taxesWithoutSpecialExpenses.current,
                    "Low"
                  );
                }

                await calculateChildAndSpousalSupportManually(0.4, 2);
                // console.log(
                //   "&* Low one Special Expenses work",
                //   specialExpensesLow
                // );
              } else if (rateParam === 0.43 && time === 2) {
                syncUpParty1Deduction(specialExpensesArr, "21400");
                syncUpParty2Deduction(specialExpensesArr, "21400");
                // assigning the special expenses variable the value and then calculating it
                if (getTotalSpecialExpensesForBothParties() > 0) {
                  calculateSpecialExpenseSupport(
                    taxesWithoutSpecialExpenses.current,
                    "Med"
                  );
                }
                await calculateChildAndSpousalSupportManually(0.43, 2);

                // console.log(
                //   "&* Med one Special Expenses work",
                //   specialExpensesMed
                // );
              } else if (rateParam === 0.46 && time === 2) {
                syncUpParty1Deduction(specialExpensesArr, "21400");
                syncUpParty2Deduction(specialExpensesArr, "21400");
                // assigning the special expenses variable the value and then calculating it

                if (getTotalSpecialExpensesForBothParties() > 0) {
                  calculateSpecialExpenseSupport(
                    taxesWithoutSpecialExpenses.current,
                    "High"
                  );
                }
                await calculateChildAndSpousalSupportManually(0.46, 2);
                // console.log(
                //   "&* High one Special Expenses work",
                //   specialExpensesHigh
                // );
              }
              //This condition runs for the HIGH scenerio.
              else if (rateParam === 0.5 && time === 0) {
                await calculateChildAndSpousalSupportManually(0.5, 0);

                // console.log("&* High Limit one work", matchResultsHigh);
              }
            } catch (err) {
              // console.log("err in iterative formula", err);
              window.location.href = "/calculator";
              clearInterval(timer);
              reject(err);
            }
          },
          1,
          rate,
          time
        );
      });
    }

    //queue method

    if (data.lowTaxes) {
      await waitUntil(0.4, 1);
    }
    if (data.medTaxes) {
      await waitUntil(0.43, 1);
    }
    if (data.highTaxes) {
      await waitUntil(0.46, 1);
    }

    if (data.highLimit) {
      //await waitUntil(0.5, 0);
      // console.log("&* response High Limit", resHighLimit);

      const { lowSupport, medSupport, highSupport, high, med, low } =
        calculateSpousalSupportAccToSalaryDiff({
          disposibleIncome1: calculateDisposableIncome({
            taxableIncome: getTaxableIncomeAfterSupportParty1(),
            totalTaxes: calculateTotalTaxes(1),
            totalBenefits: sumAllBenefits(1),
            childSupport: 0,
          }),
          disposibleIncome2: calculateDisposableIncome({
            taxableIncome: getTaxableIncomeAfterSupportParty2(),
            totalTaxes: calculateTotalTaxes(2),
            totalBenefits: sumAllBenefits(2),
            childSupport: 0,
          }),

          houseHoldIncome1:
            totalIncomeByIncomeState(income.party1) -
            childSupportRef.current.party1 -
            notionalAmountRef.current.party1,

          houseHoldIncome2:
            totalIncomeByIncomeState(income.party2) -
            childSupportRef.current.party2 -
            notionalAmountRef.current.party2,

          yearsLivingTogether: momentFunction.differenceBetweenTwoDates(
            screen1.aboutTheRelationship.dateOfMarriage,
            screen1.aboutTheRelationship.dateOfSeparation
          ),
        });

      globallowSupport.current = lowSupport;
      globalmedSupport.current = medSupport;
      globalhighSupport.current = highSupport;

      assignValueForSpousalSupport(
        totalIncomeByIncomeState(income.party1),
        totalIncomeByIncomeState(income.party2),
        lowSupport,
        0.4
      );
      await iterativeFormula(0.4, 0);
      assignValueForSpousalSupport(
        totalIncomeByIncomeState(income.party1),
        totalIncomeByIncomeState(income.party2),
        medSupport,
        0.43
      );
      await iterativeFormula(0.43, 0);

      let diffHighSupport = highSupport;
      let assignedHighLimit = matchResultsHigh;

      if (high >= 0.5) {
        // console.log("&* entered 0.5 if block", matchResultsHigh);
        diffHighSupport =
          matchResultsHigh.current[matchResultsHigh.current.length - 1];
      }

      assignValueForSpousalSupport(
        totalIncomeByIncomeState(income.party1),
        totalIncomeByIncomeState(income.party2),
        diffHighSupport,
        0.46
      );
      await iterativeFormula(0.46, 0);

      applicablePercentage.current.low = low;
      applicablePercentage.current.med = med;
      applicablePercentage.current.high = high;

      assignValuesAfterAllCalculations();
    }

    if (data.specialExpensesLow) {
      await waitUntil(0.4, 2);
    }
    if (data.specialExpensesMed) {
      await waitUntil(0.43, 2);
    }
    if (data.specialExpensesHigh) {
      await waitUntil(0.46, 2);
      console.log("go in specialExpensesHigh");
    }

    assignValuesAfterAllCalculations();

    setShowCalculationCompleted(true);
    setShowSaveCalculatorValues(true);
  };

  const calculateChildAndSpousalSupportAuto = async () => {
    setis4thDisplay(false);
    if (checkIfAllMandatoryValuesAreFilled()) {
      // resetAllValues()
      //storing the original values. These values are stored because we would reset these values after the calculation for low, med, high.
      storeBasicValues();

      // We need to calculate child support before calculating anything. First Child support will be calculated and stored in useRef variables. Then these variables are used in all the calculations.
      calculateChildSupport();

      const incomes = {
        totalIncomeParty1: totalIncomeByIncomeState(income.party1),
        totalIncomeParty2: totalIncomeByIncomeState(income.party2),
      };

      if (totalNumberOfChildren(screen1.aboutTheChildren) === 0) {
        // High Case
        typeOfReport.current = WITHOUT_CHILD_FORMULA;
        console.log("if 1");

        await calculateSpousalSupportAuto({
          highLimit: true,
          lowTaxes: false,
          medTaxes: false,
          highTaxes: false,
          specialExpensesLow: false,
          specialExpensesMed: false,
          specialExpensesHigh: false,
        });
      } else if (
        determineWhichPartyHasGreaterIncomeAndChild(
          screen1.aboutTheChildren,
          incomes
        )
      ) {
        // High Case
        console.log("if 2");

        typeOfReport.current = ONLY_CHILD;
        await calculateSpousalSupportAuto({
          highLimit: true,
          lowTaxes: false,
          medTaxes: false,
          highTaxes: false,
          specialExpensesLow: false,
          specialExpensesMed: false,
          specialExpensesHigh: false,
        });
      } else if (totalNumberOfChildren(screen1.aboutTheChildren) > 0) {
        typeOfReport.current = CUSTODIAL_FORMULA;
        console.log("if 3");

        await calculateSpousalSupportAuto({
          highLimit: false,
          lowTaxes: true,
          medTaxes: true,
          highTaxes: true,
          specialExpensesLow: true,
          specialExpensesMed: true,
          specialExpensesHigh: true,
        });
      }

      passStateToParentAndNextPage(
        Number(getCalculatorIdFromQuery(calculatorId)),
        false
      );

      setis4thDisplay(true);

      //else if if any party has more income and also have child custody,
      //then spousal support will be calculated by years of living together (same as highlimit and when there is no child.)
    }
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

    // console.log("child support in credits", childSupport);

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
          // otherFederalCredits: totalCreditsParty1(),
        })
      : (allCreditsParty2.current = {
          ...formulaCreditsForParty(2),
          // otherFederalCredits: totalCreditsParty2(),
        });
  };

  const fetchDistinctTaxYears = () => {
    setScreen2Loader(true);
    return new Promise((resolve, reject) => {
      // setLoading(true);
      getDistinctYearsInTaxRef()
        .then((res) => {
          const year =
            screen2.tax_year !== -1
              ? screen2.tax_year
              : res[res.length - 1].year;

          setDistinctYears({
            allYears: [res[res.length - 2], res[res.length - 1]],
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

  const clearDeductableSupport = () => {
    deductableSupport.current = {
      party1: 0,
      party2: 0,
    };
  };

 
  const clearProvincialTaxes = () => {
    provincialTax.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearOntarioSalesTax = () => {
    ontarioSalesTax.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearBenefitsValues = () => {
    benefitsValues.current = {
      party1Low: 0,
      party2Low: 0,
      party1Med: 0,
      party2Med: 0,
      party1High: 0,
      party2High: 0,
    };
  };

  const clearEnhancedCPPDeduction = () => {
    enhancedCPPDeduction.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearFederalTaxes = () => {
    federalTax.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearTaxesWithSpecialExpenses = () => {
    taxesWithSpecialExpenses.current = {
      party1Low: 0,
      party2Low: 0,
      party1Med: 0,
      party2Med: 0,
      party1High: 0,
      party2High: 0,
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
      party1: originalValues.provincialTaxParty1,
      party2: originalValues.provincialTaxParty2,
    };
  };

  const resetFederalTaxes = () => {
    federalTax.current = {
      party1: originalValues.federalTaxParty1,
      party2: originalValues.federalTaxParty2,
    };
  };

  const resetCanadaChildBenefits = () => {
    childBenefit.current = {
      party1: originalValues.canadaChildBenefitParty1,
      party2: originalValues.canadaChildBenefitParty2,
    };
  };

  const resetGSTHSTBenefits = () => {
    GSTHSTBenefit.current = {
      party1: originalValues.gstHstBenefitParty1,
      party2: originalValues.gstHstBenefitParty2,
    };
  };

  const resetOntarioChildBenefits = () => {
    OntarioChildBenefit.current = {
      party1: originalValues.ontarioChildBenefitParty1,
      party2: originalValues.ontarioChildBenefitParty2,
    };
  };

  const resetOntarioSalesTaxes = () => {
    ontarioSalesTax.current = {
      party1: originalValues.ontarioSalesTaxParty1,
      party2: originalValues.ontarioSalesTaxParty2,
    };
  };

  const resetAllCredits = () => {
    allCreditsParty1.current = {
      ...allCreditsParty1.current,
      ageAmount: originalValues.ageAmountParty1,
      totalFederalCredits: originalValues.totalFederalCreditsParty1,
      totalOntarioCredits: originalValues.totalOntarioCreditsParty1,
    };

    allCreditsParty2.current = {
      ...allCreditsParty2.current,
      ageAmount: originalValues.ageAmountParty2,
      totalFederalCredits: originalValues.totalFederalCreditsParty2,
      totalOntarioCredits: originalValues.totalOntarioCreditsParty2,
    };
  };

  const resetChildCareExpenses = () => {
    childCareExpenses.current = {
      party1: originalValues.childCareExpenses.party1,
      party2: originalValues.childCareExpenses.party2,
    };
  };

  const resetEnhancedCPPDeduction = () => {
    enhancedCPPDeduction.current = {
      party1: originalValues.enhancedCPPDeductionParty1,
      party2: originalValues.enhancedCPPDeductionParty2,
    };
  };

  const clearSupportReceived = () => {
    supportReceived.current = {
      party1: 0,
      party2: 0,
    };
  };

  const resetProvincialCredits = () => {
    provincialCredits.current = {
      party1: originalValues.provincialCreditsParty1,
      party2: originalValues.provincialCreditsParty2,
    };
  };

  const fetchFederalDBValues = (year: number, province: Province) => {
    return new Promise((resolve, reject) => {
      // setLoading(true);

      fetchAllValuesFromDB(
        year,
        province,
        childSupportValuesFor(
          screen1.aboutTheChildren.count,
          screen1.aboutTheChildren.numberOfChildren
        )
      )
        .then((res) => {
          // fetchChildSupportValues(year, province, "1,23,4").then((childSupportValues) => {
          //   console.log("values", childSupportValues);
          //   // setFetchedChildSupportValues(childSupportValues)
          //   resolve(true)
          // }).catch((err) => { console.log("err", err); reject(false) });

          setFetchedChildSupportValues(res.childSupportValues);
          console.log("res.childSupportValues", res.childSupportValues);

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

          //year to be added later in DB
          resolve(true);
        })
        .catch((err) => {
          console.log(`Error Fetching Values from DB ${err}`);
          // alert(`Error Fetching Values from DB ${err}`);
          reject(err);
        });
    });
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
    //modifying the values for number of children.

    const sharedChildren = screen1.aboutTheChildren.count.shared;

    // When the type of calculator is SHARED, then the number of children will be equal.
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
    // setLoading(true);

    determineAndSetTypeOfSplitting();
    fetchDistinctTaxYears().then((response) => {
      calculateDurationOfSupport();
      // checkIfScreen1OptionsFilled();
      modifyScreen1PropIfChildIsAbove18();
      modifyScreen1PropsIfChildShared();
      // calculateChildSupport();

      setCount((prev) => prev + 1);
      setLoading(false);
      setScreen2Loader(false);

      // setTimeout(() => {
      //   calculateAllOperationsForParty1();

      //   calculateAllOperationsForParty2();
      // }, 2000);
    });

    syncUpSpecialExpensesWithBenefitAndDeduction();
  }, [
    screen1?.background?.party1province,
    screen1.aboutTheChildren.count,
    screen1?.background?.party2province,
  ]);

  useEffect(() => {
    // calculateChildSupport()
  }, [screen1.aboutTheChildren]);

  useEffect(() => {
    dispatch(dynamicValuesAction(fetchedDynamicValues));
  }, [fetchedDynamicValues]);

  useEffect(() => {
    // calculateChildSupport();
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
    const party2Details = specialExpensesArr.party2;

    const childCareSpecialExpenseIndex = party2Details.findIndex(
      (detail) => detail.value === value
    );
    if (childCareSpecialExpenseIndex !== -1) {
      const childCareExpenseFromSpecialExpense = party2Details.find(
        (detail) => detail.value === value
      )!;
      childCareExpenses.current = {
        party1: childCareExpenses.current.party1,
        party2: parseInt(childCareExpenseFromSpecialExpense.amount),
      };
      const party2DeductionDetails = deductions.party2;
      const deductionIndex = party2DeductionDetails.findIndex(
        (detail) => detail.value === value
      );
      if (deductionIndex === -1) {
        const formattedIndex = party2DeductionDetails.length;
        party2DeductionDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setDeductions((prev) => {
          return { ...prev, party2: party2DeductionDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party2Details.find(
          (detail) => detail.value === value
        )!;
        const findExistingIndex = party2DeductionDetails.findIndex(
          (detail) => detail.value === value
        );
        party2DeductionDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setDeductions((prev) => {
          return { ...prev, party2: party2DeductionDetails };
        });
      }
    } else {
      const party2DeductionDetails = deductions.party2;
      const deductionIndex = party2DeductionDetails.findIndex(
        (detail) => detail.value === value
      );
      if (deductionIndex !== -1) {
        party2DeductionDetails.splice(deductionIndex, 1);
        setDeductions((prev) => {
          return { ...prev, party2: party2DeductionDetails };
        });
      }
    }
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
        (detail) => detail.value === value
      );
      if (benefitIndex === -1) {
        const formattedIndex = party2BenefitDetails.length;
        party2BenefitDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setBenefits((prev) => {
          return { ...prev, party2: party2BenefitDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party2Details.find(
          (detail) => detail.value === value
        )!;
        const findExistingIndex = party2BenefitDetails.findIndex(
          (detail) => detail.value === value
        );
        party2BenefitDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setBenefits((prev) => {
          return { ...prev, party2: party2BenefitDetails };
        });
      }
    } else {
      const party2BenefitDetails = benefits.party2;
      const benefitIndex = party2BenefitDetails.findIndex(
        (detail) => detail.value === value
      );
      if (benefitIndex !== -1) {
        party2BenefitDetails.splice(benefitIndex, 1);
        setBenefits((prev) => {
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
        (detail) => detail.value === value
      );
      if (benefitIndex === -1) {
        const formattedIndex = party1BenefitDetails.length;
        party1BenefitDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setBenefits((prev) => {
          return { ...prev, party1: party1BenefitDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party1Details.find(
          (detail) => detail.value === value
        )!;
        const findExistingIndex = party1BenefitDetails.findIndex(
          (detail) => detail.value === value
        );
        party1BenefitDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setBenefits((prev) => {
          return { ...prev, party1: party1BenefitDetails };
        });
      }
    } else {
      const party1BenefitDetails = benefits.party1;
      const benefitIndex = party1BenefitDetails.findIndex(
        (detail) => detail.value === value
      );
      if (benefitIndex !== -1) {
        party1BenefitDetails.splice(benefitIndex, 1);
        setBenefits((prev) => {
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

    const childCareSpecialExpenseIndex = party1Details.findIndex(
      (detail) => detail.value === value
    );
    if (childCareSpecialExpenseIndex !== -1) {
      const childCareExpenseFromSpecialExpense = party1Details.find(
        (detail) => detail.value === value
      )!;
      const party1DeductionDetails = deductions.party1;
      const deductionIndex = party1DeductionDetails.findIndex(
        (detail) => detail.value === value
      );
      if (deductionIndex === -1) {
        const formattedIndex = party1DeductionDetails.length;
        party1DeductionDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setDeductions((prev) => {
          return { ...prev, party1: party1DeductionDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party1Details.find(
          (detail) => detail.value === value
        )!;
        childCareExpenses.current = {
          party1: parseInt(childCareExpenseFromSpecialExpense.amount),
          party2: childCareExpenses.current.party2,
        };
        const findExistingIndex = party1DeductionDetails.findIndex(
          (detail) => detail.value === value
        );
        party1DeductionDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setDeductions((prev) => {
          return { ...prev, party1: party1DeductionDetails };
        });
      }
    } else {
      const party1DeductionDetails = deductions.party1;
      const deductionIndex = party1DeductionDetails.findIndex(
        (detail) => detail.value === value
      );
      if (deductionIndex !== -1) {
        party1DeductionDetails.splice(deductionIndex, 1);
        setDeductions((prev) => {
          return { ...prev, party1: party1DeductionDetails };
        });
      }
    }
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

  const calculateProvincialCreditsParty1 = () => {
    return province === "ON"
      ? formulaForProvincialCredits(
          {
            childCareExpenses: limitValueForChildExpenses(
              childCareExpenses.current.party1,
              screen1.aboutTheChildren
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
            childCareExpenses: limitValueForChildExpenses(
              childCareExpenses.current.party2,
              screen1.aboutTheChildren
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

  const deleteElementInIncomeArray = (index: number, partyNum: number) => {
    const incomesState =
      partyNum === 1 ? [...income.party1] : [...income.party2];
    incomesState.splice(index, 1);

    partyNum === 1
      ? setIncome({ ...income, party1: incomesState })
      : setIncome({ ...income, party2: incomesState });
  };

  const lowPropsCalTable: propsTableParams = {
    incomes: {
      party1: totalIncomeByIncomeState(income.party1),
      party2: totalIncomeByIncomeState(income.party2),
    },
    taxesAndDeductions: {
      party1: taxesWithSpecialExpenses.current.party1Low,
      party2: taxesWithSpecialExpenses.current.party2Low,
    },
    benefitsAndCredits: {
      party1: benefitsValues.current.party1Low,
      party2: benefitsValues.current.party2Low,
    },
    childSupport: {
      party1:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(2)) === 2
          ? childSupportRef.current.party1
          : 0,
      party2:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(1)) === 1
          ? childSupportRef.current.party2
          : 0,
    },
    notionalChildSupport: {
      party1:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(1)) === 1
          ? notionalAmountRef.current.party1
          : 0,
      party2:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(2)) === 2
          ? notionalAmountRef.current.party2
          : 0,
    },
    applicablePercentage: applicablePercentage.current.low,
    specialExpenses: specialExpensesLowVal.current,
    percentage: 40,
    spousalSupport: spousalSupportLow.current,
  };

  const medPropsCalTable: propsTableParams = {
    incomes: {
      party1: totalIncomeByIncomeState(income.party1),
      party2: totalIncomeByIncomeState(income.party2),
    },
    taxesAndDeductions: {
      party1: taxesWithSpecialExpenses.current.party1Med,
      party2: taxesWithSpecialExpenses.current.party2Med,
    },
    benefitsAndCredits: {
      party1: benefitsValues.current.party1Med,
      party2: benefitsValues.current.party2Med,
    },
    childSupport: {
      party1:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(2)) === 2
          ? childSupportRef.current.party1
          : 0,
      party2:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(1)) === 1
          ? childSupportRef.current.party2
          : 0,
    },
    notionalChildSupport: {
      party1:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(1)) === 1
          ? notionalAmountRef.current.party1
          : 0,
      party2:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(2)) === 2
          ? notionalAmountRef.current.party2
          : 0,
    },
    specialExpenses: specialExpensesMedVal.current,
    applicablePercentage: applicablePercentage.current.med,

    percentage: 43,
    spousalSupport: spousalSupportMed.current,
  };

  const highPropsCalTable: propsTableParams = {
    incomes: {
      party1: totalIncomeByIncomeState(income.party1),
      party2: totalIncomeByIncomeState(income.party2),
    },
    taxesAndDeductions: {
      party1: taxesWithSpecialExpenses.current.party1High,
      party2: taxesWithSpecialExpenses.current.party2High,
    },
    benefitsAndCredits: {
      party1: benefitsValues.current.party1High,
      party2: benefitsValues.current.party2High,
    },
    childSupport: {
      party1:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(2)) === 2
          ? childSupportRef.current.party1
          : 0,
      party2:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(1)) === 1
          ? childSupportRef.current.party2
          : 0,
    },
    notionalChildSupport: {
      party1:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(1)) === 1
          ? notionalAmountRef.current.party1
          : 0,
      party2:
        maximumChildLivesWith(getParamsForCalculatingAllCredits(2)) === 2
          ? notionalAmountRef.current.party2
          : 0,
    },
    specialExpenses: specialExpensesHighVal.current,
    applicablePercentage: applicablePercentage.current.high,
    percentage: 46,
    spousalSupport: spousalSupportHigh.current,
  };

  const clearAllCreditsParty1 = () => {
    allCreditsParty1.current = {
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
    };
  };

  const clearAllCreditsParty2 = () => {
    allCreditsParty2.current = {
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
    };
  };

  const clearChildBenefit = () => {
    childBenefit.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearOntarioChildBenefit = () => {
    OntarioChildBenefit.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearGSTHSTBenefit = () => {
    GSTHSTBenefit.current = {
      party1: 0,
      party2: 0,
    };
  };

  const clearProvincialCredits = () => {
    provincialCredits.current = {
      party1: 0,
      party2: 0,
    };
  };

  const allValuesRefreshed = () => {
    setIncome({
      party1: [{ label: "", amount: "0", value: "" }],
      party2: [{ label: "", amount: "0", value: "" }],
    });
    setDeductions({
      party1: [{ label: "", amount: "0", value: "" }],
      party2: [{ label: "", amount: "0", value: "" }],
    });
    setBenefits({
      party1: [{ label: "", amount: "0", value: "" }],
      party2: [{ label: "", amount: "0", value: "" }],
    });

    childSupportRef.current = { party1: 0, party2: 0 };
    notionalAmountRef.current = { party1: 0, party2: 0 };
    // setDeductableSupport({});
    clearProvincialCredits();
    clearGSTHSTBenefit();
    clearOntarioChildBenefit();
    clearChildBenefit();
    clearAllCreditsParty2();
    clearAllCreditsParty1();
    clearEnhancedCPPDeduction();
    clearOntarioSalesTax();
    clearProvincialTaxes();
    clearFederalTaxes();
    clearDeductableSupport();
    clearBenefitsValues();
    clearTaxesWithSpecialExpenses();
    clearTaxesWithoutSpecialExpenses();
    // setSupportReceived({});
    clearSupportReceived();
    setShowCalculationCompleted(false);
  };

  const changeYearAndRefresh = (event) => {
    setDistinctYears({
      ...distinctYears,
      selectedYear: event.label,
    });
    fetchFederalDBValues(event.label, getProvinceOfParty1()).then((res) => {
      allValuesRefreshed();
      setLoading(false);
    });
  };

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

    if (partyNum === 1) {
      if (!basicPersonalAmountFederalFixed.party1.isFixed) {
        basicPersonalAmountFederalVal = basicPersonalAmountFederalFormula(data);
      } else {
        basicPersonalAmountFederalVal =
          basicPersonalAmountFederalFixed.party1.value;
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

  const checkIfAllMandatoryValuesAreFilled = () => {
    let areDetailsFilled = true;

    if (!allMandatoryFieldsFilled()) {
      areDetailsFilled = false;
      setShowAlertFillAllDetails(true);
    }

    return areDetailsFilled;
  };

  type IncomeTypeProps = [partyIncomeAndAmount[], partyIncomeAndAmount[]];

  const areAllIncomeTypeFilled = (partyIncome: IncomeTypeProps) => {
    return partyIncome
      .flat()
      .every((item) => !Object.values(item).some((value) => value === ""));
  };

  function allMandatoryFieldsFilled() {
    return areAllIncomeTypeFilled([income.party1, income.party2]);
  }

  const AlertFillAllDetails = () => {
    return (
      <ModalInputCenter
        heading="Please fill all details"
        handleClick={() => {
          setShowAlertFillAllDetails(false);
        }}
        changeShow={() => setShowAlertFillAllDetails(false)}
        show={showAlertFillAllDetails}
        action="Ok"
        cancelOption="Cancel"
      >
        <p className="heading-5">
          Please fill all the details to proceed further!
        </p>
      </ModalInputCenter>
    );
  };

  return (
    <>
      {/* <OverviewCal screen1={screen1} incomeDetails={{party1: totalIncomeByIncomeState(income.party1),party2: totalIncomeByIncomeState(income.party2),}}taxDetails={{ party1: 0, party2: 0 }}/> */}
      <div className="Pbody">
        <Loader isLoading={screen2loader} loadingMsg={"Calculating..."} />
      </div>
      {/* <div className="panel"> */}
      <div className="pHead">
        <span className="h5">
          {getSvg('Tax Year')}
         
          Tax Year
        </span>
        <div className="controls">
          <div className="form-group mb-0" style={{ width: "300px" }}>
            <Dropdown
              options={distinctYears.allYears.map(({ year }) => year)}
              placeholder="Select Tax Year*"
              value={`${distinctYears.selectedYear}`}
              onChange={(event) => {
                changeYearAndRefresh(event);
              }}
            ></Dropdown>
          </div>
        </div>
      </div>

      <div className="pBody">
        <div className="row">
          <div className="col-md-4">
            <div className="form-group" style={{ margin: "0" }}>
              <label>Income Type*</label>
            </div>
            <div className="form-group" style={{ margin: "10px 0 0 0" }}>
              <label>Income Amount*</label>
            </div>
          </div>
          <div className="col-md-4">
            {income.party1.map((e, index) => {
              return (
                <>
                  <div className="form-group">
                    {index > 0 && (
                      <span
                        className="crossBtn"
                        onClick={() => deleteElementInIncomeArray(index, 1)}
                      >
                        <i className="fas fa-times"></i>
                      </span>
                    )}
                    <Dropdown
                      options={incomeTypeDropdown}
                      placeholder="Select Income Type"
                      onChange={(event: any) => {
                        changeParty1Dropdown(event, index);
                        calculateAllOperationsForParty1();
                      }}
                      value={e.label}
                    ></Dropdown>
                    <NumberFormat
                      value={e.amount}
                      className="form-control"
                      inputMode="numeric"
                      thousandSeparator={true}
                      decimalScale={3}
                      defaultValue={0}
                      prefix={"$"}
                      onChange={(e) => {
                        changeParty1Amount(e, index);
                        calculateAllOperationsForParty1();
                        calculateAllOperationsForParty2();
                      }}
                      // onBlur={() => {
                      //   calculateChildSupport();
                      // }}
                    />
                  </div>
                </>
              );
            })}
            <div className="addBtn">
              <span>
                Total:{" "}
                {formatNumberInThousands(
                  totalIncomeByIncomeState(income.party1)
                )}
              </span>
              <a onClick={addIncomeToParty1}>+ Add Income</a>
            </div>
          </div>
          <div className="col-md-4">
            {/* <span className="heading">{party2Name()}</span> */}
            {income.party2.map((e, index) => {
              return (
                <>
                  <div className="form-group">
                    {index > 0 && (
                      <span
                        className="crossBtn"
                        onClick={() => deleteElementInIncomeArray(index, 2)}
                      >
                        <i className="fas fa-times"></i>
                      </span>
                    )}
                    <Dropdown
                      options={incomeTypeDropdown}
                      placeholder="Select Income Type"
                      onChange={(event: any) => {
                        changeParty2Dropdown(event, index);
                        calculateAllOperationsForParty2();
                      }}
                      value={e.label}
                    ></Dropdown>
                    <NumberFormat
                      value={e.amount}
                      className="form-control"
                      inputMode="numeric"
                      defaultValue={0}
                      decimalScale={3}
                      thousandSeparator={true}
                      prefix={"$"}
                      onChange={(e: React.SyntheticEvent<HTMLInputElement>) => {
                        changeParty2Amount(e, index);
                        calculateAllOperationsForParty1();
                        calculateAllOperationsForParty2();
                      }}
                   
                    />
                  </div>
                </>
              );
            })}
            <div className="addBtn">
              <span>
                Total:{" "}
                {formatNumberInThousands(
                  totalIncomeByIncomeState(income.party2)
                )}
              </span>
              <a onClick={addIncomeToParty2}>+ Add Income</a>
            </div>
          </div>
        </div>
      </div>

      {showAlertFillAllDetails && AlertFillAllDetails()}

      <div className="btnGroup">
        <button
          ref={myBtnRef}
          className={`btn btnPrimary rounded-pill d-none`}
          id="calculator_button"
          onClick={() => {
            calculateChildAndSpousalSupportAuto();
          }}
        >
          Calculate
        </button>
      </div>
    </>
  );
};

export default Screen2;

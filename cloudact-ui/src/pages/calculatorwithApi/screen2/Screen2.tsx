import Cookies from "js-cookie";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Col, Container, Row, Table } from "react-bootstrap";
import Dropdown, { Option } from "react-dropdown";
import { default as NumberFormat } from "react-number-format";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { dynamicValuesAction } from "../../../actions/dynamicValuesAction";
import InputCustom from "../../../components/InputCustom";
import CustomSwitch from "../../../components/LayoutComponents/CustomeSwitch/CustomSwitch";
import Loader from "../../../components/Loader";
import ModalInputCenter from "../../../components/ModalInputCenter";
import HideElement from "../../../HOC/HideElement";
import InfoIcon from "@mui/icons-material/Info";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import useQuery from "../../../hooks/useQuery";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import { apiCalculatorById } from "../../../utils/Apis/calculator/Calculator_values_id";
import { SaveAllCalculatorValuesByID } from "../../../utils/Apis/calculator/SaveAllCalculatorValuesByID";
import { fetchAllCalculatorDatawithTaxs } from "../../../utils/Apis/calculator/fetchAllCalculatorDatawithTaxs";
import { calcSpousalSupportFlask } from "../../../utils/Apis/calculator/calcSpousalSupportFlask";
import { calcChildSupportFlask } from "../../../utils/Apis/calculator/calcChildSupportFlask";
import { fetchSpecificTaxandDeductionforAmount } from "../../../utils/Apis/calculator/fetchSpecificTaxandDeductionforAmount";
import { getDistinctYearsInTaxRef } from "../../../utils/Apis/getDistinctYearsInTaxRef";
import {
  addAllNumbersInArr,
  getAllUserInfo,
  getUserSID,
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
  basicDisabilityAmountFormula,
  basicDisabilityAmountFormulaProv,
  maximumChildLivesWith,
} from "../../../utils/helpers/calculator/creditTaxCalculationFormulas";
import { Tooltip as ReactTooltip } from "react-tooltip";
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
  formulaForGSTHSTBenefits,
  formulaForOntarioSalesTax,
  formulaForProvincialCredits,
  lowIncomeCredit,
  spousalSupportFormulaByRate,
  formulaForChildDisabilityBenefit,
} from "../../../utils/helpers/calculator/taxCalculationFormula";
import { CanadaWorkersBenefitFormula } from "../../../utils/helpers/calculator/WorkersBenefit/workersBenefits";
import {
  formatNumber,
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
import { dropdownCredit, dropdownDeductions } from "../screen3/screen3";
import {
  determineTypeOfSplitting,
  getNumberOfChildrenWithParty1,
  getNumberOfChildrenWithParty2,
} from "../screen4/Screen4";
import {
  childSupportValuesFor,
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
  filterEmployedIncomeSumWithAllincome,
  filterFederalCreditsAndSum,
  filterMedicalExpensesAndSum,
  filterNegativeValuesAndSum,
  filterOtherCreditsExceptSpecialExpenses,
  filterOtherDeductionsExceptSpecialExpenses,
  filterPositiveValuesAndSum,
  filterProvincialCreditsAndSum,
  filterSelfEmployedIncomeAndSum,
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
  partyIncomeOtherHousehold,
  partyIncomeAndAmount,
  propsTableParams,
  provBenefitBCTypeDropdown,
  provBenefitONTypeDropdown,
  separateValuesDB,
  specialExpensesDropdown,
  totalNumberOfChildren,
  twoPartyStates,
  undueHardshipIncomeTypeDropdown
} from "./Screen2";
import CONSTANTS from "../TollTipConstants";
import CustomCheckbox from "../../../components/LayoutComponents/CustomCheckbox/CustomCheckbox";
import { getSvg } from "../assets/Svgs";

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
  // setCalPercentage: any;
  specificamount: any;
  specialExpensePercentage: any;
  valueswithoutSpousalSupport: any;
  lumpsum: any,
  lifeInsurence: any,
  includeLumpsum: any,
  includeLifeInsurence: any,
  taxeswithAddSupport: any,
  settaxeswithAddSupport: any,
  scenarios: any,
  setScenarios: any,
  setRestructioring: any,
  restructioring: any,
  undueHardship: any,
  setundueHardship: any,
  nonTaxableincome: any,
  setNonTaxableincome: any,
  updateCalPercentage:any,
  // calpercentageRef:any,
};

const Screen2 = ({
  typeOfCalculatorSelected,
  settingScreen2StateFromChild,
  screen1,
  screen2,
  calculatorState,
  setBackground,
  // calpercentageRef,
  // setCalPercentage,
  specificamount,
  specialExpensePercentage,
  valueswithoutSpousalSupport,
  lumpsum,
  lifeInsurence,
  includeLumpsum,
  includeLifeInsurence,
  taxeswithAddSupport,
  settaxeswithAddSupport,
  scenarios,
  setScenarios,
  setRestructioring,
  restructioring,
  undueHardship,
  setundueHardship,
  nonTaxableincome,
  setNonTaxableincome,
  updateCalPercentage,
  calpercentageRef,
  allApiDataCal ,setAllApiDataCal


}: Props) => {

  
  const history = useHistory();
  const calculatorId = useQuery();
  const [showAlertFillAllDetails, setShowAlertFillAllDetails] = useState(false);
  const [showApiError, setShowApiError] = useState(false);
  const spousalSupportIterativeRef = useRef<{
    monthly_low: number;
    monthly_mid: number;
    monthly_high: number;
  } | null>(null);

  // const [taxeswithAddSupport, settaxeswithAddSupport] = useState({
  //   party1: 0,
  //   party2: 0,
  // });

  const dispatch = useDispatch();
  const {
    data: { province },
  } = useSelector((state) => state.dynamicValues);

  let incomeNumberInput = useRef() as MutableRefObject<HTMLButtonElement>;
  let lowIterationButton = useRef() as MutableRefObject<HTMLButtonElement>;
  let medIterationButton = useRef() as MutableRefObject<HTMLButtonElement>;
  let highIterationButton = useRef() as MutableRefObject<HTMLButtonElement>;

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

  let typeOfReport = useRef(CUSTODIAL_FORMULA);

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

  const [undueHardshipIncome, setUndueHardshipIncome] = useState({
    party1: screen2?.undueHardshipIncome
      ? screen2.undueHardshipIncome.party1
      : [{ label: "", amount: "0", value: "", tooltip: "" }],
    party2: screen2?.undueHardshipIncome
      ? screen2.undueHardshipIncome.party2 : [{ label: "", amount: "0", value: "", tooltip: "" }],
  })

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

  const [otherhouseholdmember, setOtherHouseholdMember] = useState({
    party1: screen2?.otherhouseholdmember
      ? screen2.otherhouseholdmember.party1
      : [{ label: "", income: "0",deductionIncome:"0",AdjustmentIncome:"0", value: "" }],
    party2: screen2?.otherhouseholdmember
      ? screen2.otherhouseholdmember.party2
      : [{ label: "", income: "0",deductionIncome:"0",AdjustmentIncome:"0", value: "" }],
  })

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
    allYears: [{ year: 0 }],
    selectedYear: 0,
  });

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

  // let valueswithoutSpousalSupport = useRef({
  //   party1: 0,
  //   party2: 0,
  // })


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

  const [showCalculationCompleted, setShowCalculationCompleted] =
    useState(false);

  let supportReceived = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const [loading, setLoading] = useState(true);

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

  const disposableIncomeRef = useRef({
    party1Low: 0, party1Mid: 0, party1High: 0,
    party2Low: 0, party2Mid: 0, party2High: 0,
  });
  const taxesFromApiRef = useRef({
    party1Low: 0, party1Mid: 0, party1High: 0,
    party2Low: 0, party2Mid: 0, party2High: 0,
  });
  const benefitsFromApiRef = useRef({
    party1Low: 0, party1Mid: 0, party1High: 0,
    party2Low: 0, party2Mid: 0, party2High: 0,
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

  const ChildSupportInitValue = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const ChildSupportInitpaidBy = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  })

 
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

  const [specialExpenses, setSpecialExpenses] = useState<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const specialExpensesRef = useRef<twoPartyStates>({
    party1: 0,
    party2: 0,
  });

  const [storedCalculatorValues, setStoredCalculatorValues] = useState({
    label: calculatorState.label || getCalculatorLabelFromCookies().label,
    description:
      calculatorState.description ||
      getCalculatorLabelFromCookies().description ||
      screen1.background.party1FirstName,
    savedBy: calculatorState.savedBy || getAllUserInfo().username,
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


  const [isCheckedSwitch, setIsCheckedSwitch] = useState({
    Canada_Child_benefit_party1: true,
    Canada_Child_benefit_party2: true,
    GST_HST_Benefit_party1: true,
    GST_HST_Benefit_party2: true,
    PROV_Child_benefit_party1: true,
    PROV_Child_benefit_party2: true,
    PROV_Climate_Action_Incentive_party1: true,
    PROV_Climate_Action_Incentive_party2: true,
    PROV_Sales_Tax_Party1: true,
    PROV_Sales_Tax_Party2: true,
    Child_Disability_Party1: true,
    Child_Disability_Party2: true,

  });






  // const [tooltipmessage ,setTooltipmessage] =useState({tooltip:''})

  // const [specificamount, setspecificamount] = useState({
  //   low: 0,
  //   mid: 0,
  //   high: 0,
  // });

  const changeParty1GuidelineDropdown = (
    e: { value: string; label: string; tooltip?: string },
    index: number
  ): void => {
    const party1Details = guidelineIncome.party1;
    party1Details[index]["value"] = e.value;
    party1Details[index]["label"] = e.label;
    party1Details[index]["tooltip"] = e.tooltip;

    setGuidelineIncome((prev) => ({
      ...prev,
      party1: party1Details,
    }));
  };

  const changeParty2undueHardshipDropdown = (
    e: { value: string; label: string; tooltip?: string },
    index: number
  ): void => {
    const party2Details = undueHardshipIncome.party2;
    party2Details[index]["value"] = e.value;
    party2Details[index]["label"] = e.label;
    party2Details[index]["tooltip"] = e.tooltip;

    setUndueHardshipIncome((prev) => ({
      ...prev,
      party2: party2Details,
    }));
  };

  const changeParty1undueHardshipDropdown = (
    e: { value: string; label: string; tooltip?: string },
    index: number
  ): void => {
    const party1Details = undueHardshipIncome.party1;
    party1Details[index]["value"] = e.value;
    party1Details[index]["label"] = e.label;
    party1Details[index]["tooltip"] = e.tooltip;

    setUndueHardshipIncome((prev) => ({
      ...prev,
      party1: party1Details,
    }));
  };


  const changeParty2GuidelineDropdown = (e: Option, index: number): void => {
    const party2Details = guidelineIncome.party2;

    party2Details[index]["value"] = e.value;
    party2Details[index]["label"] = e.label;
    party2Details[index]["tooltip"] = e.tooltip;

    setGuidelineIncome((prev) => ({
      ...prev,
      party2: party2Details,
    }));
  };

  const changeParty1Dropdown = (
    e: { value: string; label: string; tooltip?: string },
    index: number
  ): void => {


    if (e.value == "14700") {
      const party1Details = nonTaxableincome.party1;
      party1Details[index]["value"] = e.value;
      party1Details[index]["label"] = e.label;
      party1Details[index]["tooltip"] = e.tooltip;

      const party1DetailsIncome = income.party1;
      // party1DetailsIncome[index]["value"] = "";
      // party1DetailsIncome[index]["label"] = "";
      // party1DetailsIncome[index]["tooltip"] = "";
      party1DetailsIncome[index]["amount"] = "0";



      setNonTaxableincome({ ...nonTaxableincome, party1: party1Details })
      setIncome({ ...income, party1: party1DetailsIncome });

    } else {

      const party1Details = income.party1;
      party1Details[index]["value"] = e.value;
      party1Details[index]["label"] = e.label;
      party1Details[index]["tooltip"] = e.tooltip;

      const party1DetailsNontax = nonTaxableincome.party1;
      party1DetailsNontax[index]["value"] = "";
      party1DetailsNontax[index]["label"] = "";
      party1DetailsNontax[index]["tooltip"] = "";
      party1DetailsNontax[index]["amount"] = "0";


      setNonTaxableincome({ ...nonTaxableincome, party1: party1DetailsNontax })

      setIncome({ ...income, party1: party1Details });
    }


    // const party1Details = income.party1;
    // party1Details[index]["value"] = e.value;
    // party1Details[index]["label"] = e.label;
    // party1Details[index]["tooltip"] = e.tooltip;

    // setIncome({ ...income, party1: party1Details });



  };
  const changeParty2Dropdown = (
    e: { value: string; label: string; tooltip?: string },
    index: number
  ): void => {

    if (e.value == "14700") {
      const party2Details = nonTaxableincome.party2;
      party2Details[index]["value"] = e.value;
      party2Details[index]["label"] = e.label;
      party2Details[index]["tooltip"] = e.tooltip;

      const party2DetailsIncome = income.party2;
      // party1DetailsIncome[index]["value"] = "";
      // party1DetailsIncome[index]["label"] = "";
      // party1DetailsIncome[index]["tooltip"] = "";
      party2DetailsIncome[index]["amount"] = "0";


      setNonTaxableincome({ ...nonTaxableincome, party2: party2Details })
      setIncome({ ...income, party2: party2DetailsIncome });

    } else {

      const party2Details = income.party2;
      party2Details[index]["value"] = e.value;
      party2Details[index]["label"] = e.label;
      party2Details[index]["tooltip"] = e.tooltip;

      const party2DetailsNontax = nonTaxableincome.party2;
      party2DetailsNontax[index]["value"] = "";
      party2DetailsNontax[index]["label"] = "";
      party2DetailsNontax[index]["tooltip"] = "";
      party2DetailsNontax[index]["amount"] = "0";


      setNonTaxableincome({ ...nonTaxableincome, party2: party2DetailsNontax })

      setIncome({ ...income, party2: party2Details });
    }

    // const party2Details = income.party2;
    // party2Details[index]["value"] = e.value;
    // party2Details[index]["label"] = e.label;
    // party2Details[index]["tooltip"] = e.tooltip;

    // setIncome({ ...income, party2: party2Details });
  };


  const changeParty1Amount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {

    // const party1Details = income.party1;

    // party1Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

    // setIncome({ ...income, party1: party1Details });

    if (nonTaxableincome.party1[index].value === "14700") {
      let nonTaxableDetails = nonTaxableincome.party1;
      nonTaxableDetails[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

      setNonTaxableincome({
        ...nonTaxableincome,
        party1: nonTaxableDetails,
      });
    } else {
      const taxableDetails = income.party1;

      taxableDetails[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

      setIncome({
        ...income,
        party1: taxableDetails,
      });


    }

  };

  const changeParty2Amount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    // const party2Details = income.party2;
    // party2Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

    // setIncome({ ...income, party2: party2Details });

    if (nonTaxableincome.party2[index].value === "14700") {
      let nonTaxableDetails = nonTaxableincome.party2;
      nonTaxableDetails[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

      setNonTaxableincome({
        ...nonTaxableincome,
        party2: nonTaxableDetails,
      });
    } else {
      const party2Details = income.party2;
      party2Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

      setIncome({ ...income, party2: party2Details });
    }

  };


  const changeParty1DeductionsDropdown = (
    e: { value: string; label: string },
    index: number
  ): void => {
    const party1Details = deductions.party1;
    party1Details[index]["value"] = e.value;
    party1Details[index]["label"] = e.label;
    setDeductions({ ...deductions, party1: party1Details });

    syncUpParty1SpecialExpenses(party1Details, "21400");
  };

  const changeParty2DeductionsDropdown = (
    e: { value: string; label: string },
    index: number
  ): void => {
    const party2Details = deductions.party2;
    party2Details[index]["value"] = e.value;
    party2Details[index]["label"] = e.label;

    setDeductions({ ...deductions, party2: party2Details });

    syncUpParty2SpecialExpenses(party2Details, "21400");
  };

  const changeParty2SpecialExpensesDropdown = (
    e: { value: string; label: string; tooltip: string },
    index: number
  ): void => {
    const party2Details = specialExpensesArr.party2;
    const isNameInChildrenInfo = screen1.aboutTheChildren.childrenInfo.some(
      (child) => child.name === e.value
    );

    if (isNameInChildrenInfo) {
      party2Details[index]["child"] = e.value;
    } else {
      party2Details[index]["value"] = e.value;
      party2Details[index]["label"] = e.label;
      party2Details[index]["tooltip"] = e.tooltip;
    }

    setSpecialExpensesArr({ ...specialExpensesArr, party2: party2Details });

    syncUpParty2Deduction(specialExpensesArr, "21400");
    syncUpParty2Benefit(specialExpensesArr, "33099");
    syncUpParty2Benefit(specialExpensesArr, "32400");
    syncUpParty2Benefit(specialExpensesArr, "32300");
  };

  const changeParty1SpecialExpensesDropdown = (
    e: { value: string; label: string; tooltip: string },
    index: number
  ): void => {
    const party1Details = specialExpensesArr.party1;
    const isNameInChildrenInfo = screen1.aboutTheChildren.childrenInfo.some(
      (child) => child.name === e.value
    );
    if (isNameInChildrenInfo) {
      party1Details[index]["child"] = e.value;
    } else {
      party1Details[index]["tooltip"] = e.tooltip;
      party1Details[index]["value"] = e.value;
      party1Details[index]["label"] = e.label;
    }
    setSpecialExpensesArr({ ...specialExpensesArr, party1: party1Details });

    syncUpParty1Deduction(specialExpensesArr, "21400");
    syncUpParty1Benefit(specialExpensesArr, "33099");
    syncUpParty1Benefit(specialExpensesArr, "32400");
    syncUpParty1Benefit(specialExpensesArr, "32300");
  };

  const changeParty1DeductionAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party1Details = deductions.party1;
    party1Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");
    setDeductions({ ...deductions, party1: party1Details });

    syncUpParty1SpecialExpenses(party1Details, "21400");
  };

  const changeParty2DeductionAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party2Details = deductions.party2;

    party2Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");
    setDeductions({ ...deductions, party2: party2Details });

    syncUpParty2SpecialExpenses(party2Details, "21400");
  };

  const changeParty1SpecialExpensesAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party1Details = specialExpensesArr.party1;

    party1Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

    setSpecialExpensesArr({ ...specialExpensesArr, party1: party1Details });

    syncUpParty1Deduction(specialExpensesArr, "21400");
    syncUpParty1Benefit(specialExpensesArr, "33099");
    syncUpParty1Benefit(specialExpensesArr, "32400");
    syncUpParty1Benefit(specialExpensesArr, "32300");
  };

  const changeParty2SpecialExpensesAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party2Details = specialExpensesArr.party2;

    party2Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");
    setSpecialExpensesArr({ ...specialExpensesArr, party2: party2Details });

    syncUpParty2Deduction(specialExpensesArr, "21400");
    syncUpParty2Benefit(specialExpensesArr, "33099");
    syncUpParty2Benefit(specialExpensesArr, "32400");
    syncUpParty2Benefit(specialExpensesArr, "32300");
  };

  const changeParty1otherHouseHoldMemberIncomeAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number) => {

    const party1Details = otherhouseholdmember.party1;

    party1Details[index]["income"] = e.currentTarget.value.replace(/[$,]/g, "");
    setOtherHouseholdMember({ ...otherhouseholdmember, party1: party1Details });
  }

  const changeParty2otherHouseHoldMemberIncomeAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number) => {

    const party2Details = otherhouseholdmember.party2;

    party2Details[index]["income"] = e.currentTarget.value.replace(/[$,]/g, "");
    setOtherHouseholdMember({ ...otherhouseholdmember, party2: party2Details });
  }

  const changeParty1otherHouseHoldMemberDeductionAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number) =>{

      const party1Details = otherhouseholdmember.party1;

    party1Details[index]["deductionIncome"] = e.currentTarget.value.replace(/[$,]/g, "");
    setOtherHouseholdMember({ ...otherhouseholdmember, party1: party1Details });

  }

  const changeParty2otherHouseHoldMemberDeductionAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number) =>{

      const party2Details = otherhouseholdmember.party2;

    party2Details[index]["deductionIncome"] = e.currentTarget.value.replace(/[$,]/g, "");
    setOtherHouseholdMember({ ...otherhouseholdmember, party2: party2Details });

  }

  const changeParty2otherHouseHoldMemberAdditionAmount =(
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number)=>{
      const party2Details = otherhouseholdmember.party2;

      party2Details[index]["AdjustmentIncome"] = e.currentTarget.value.replace(/[$,]/g, "");
      setOtherHouseholdMember({ ...otherhouseholdmember, party2: party2Details });
  
  }

  const changeParty1otherHouseHoldMemberAdditionAmount =(
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number)=>{
      const party1Details = otherhouseholdmember.party1;

      party1Details[index]["AdjustmentIncome"] = e.currentTarget.value.replace(/[$,]/g, "");
      setOtherHouseholdMember({ ...otherhouseholdmember, party1: party1Details });
  
  }


 
  



  const changeParty1GuidelineIncomeAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party1Details = guidelineIncome.party1;
    if (party1Details[index]["label"].split(" ", 2)[0] === "Add") {
      party1Details[index]["amount"] = e.currentTarget.value.replace(
        /[$,]/g,
        ""
      );
    } else {
      party1Details[index]["amount"] = -Math.abs(
        e.currentTarget.value.replace(/[$,]/g, "")
      );
    }

    setGuidelineIncome({ ...guidelineIncome, party1: party1Details });
  };

  const changeParty2GuidelineIncomeAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party2Details = guidelineIncome.party2;
    if (party2Details[index]["label"].split(" ", 2)[0] === "Add") {
      party2Details[index]["amount"] = e.currentTarget.value.replace(
        /[$,]/g,
        ""
      );
    } else {
      party2Details[index]["amount"] = -Math.abs(
        e.currentTarget.value.replace(/[$,]/g, "")
      );
    }

    setGuidelineIncome({ ...guidelineIncome, party2: party2Details });
  };

  const changeParty1undueHardshipIncomeAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party1Details = undueHardshipIncome.party1;

    party1Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

    setUndueHardshipIncome({ ...undueHardshipIncome, party1: party1Details });
  };

  const changeParty2undueHardshipIncomeAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ): void => {
    const party2Details = undueHardshipIncome.party2;

    party2Details[index]["amount"] = e.currentTarget.value.replace(/[$,]/g, "");

    setUndueHardshipIncome({ ...undueHardshipIncome, party2: party2Details });
  };


  const addGuidelineIncomeToParty1 = () => {
    setGuidelineIncome((prev) => ({
      ...guidelineIncome,
      party1: [...prev.party1, new partyIncome("", "0", "")],
    }));
  };

  const addGuidelineIncomeToParty2 = () => {
    setGuidelineIncome((prev) => ({
      ...guidelineIncome,
      party2: [...prev.party2, new partyIncome("", "0", "")],
    }));
  };

  const addundueHardshipIncomeToParty1 = () => {
    setUndueHardshipIncome((prev) => ({
      ...undueHardshipIncome,
      party1: [...prev.party1, new partyIncome("", "0", "")],
    }));
  };

  const addundueHardshipIncomeToParty2 = () => {
    setUndueHardshipIncome((prev) => ({
      ...undueHardshipIncome,
      party2: [...prev.party2, new partyIncome("", "0", "")],
    }));
  };


  const addSpecialExpensesToParty1 = () => {
    setSpecialExpensesArr((prev) => ({
      ...specialExpensesArr,
      party1: [...prev.party1, new partyIncome("", "0", "")],
    }));
  };

  const addSpecialExpensesToParty2 = () => {
    setSpecialExpensesArr((prev) => ({
      ...specialExpensesArr,
      party2: [...prev.party2, new partyIncome("", "0", "")],
    }));
  };

  const addAnotherHouseHoldMemberParty1 = () => {

    setOtherHouseholdMember((prev) => ({
      ...otherhouseholdmember,
      party1: [...prev.party1, new partyIncomeOtherHousehold("", "0", "0","0")],
    }));
  }

  const addAnotherHouseHoldMemberParty2 = () => {

    setOtherHouseholdMember((prev) => ({
      ...otherhouseholdmember,
      party2: [...prev.party2, new partyIncomeOtherHousehold("", "0", "0","0")],
    }));
  }



  const addIncomeToParty1 = () => {
    setIncome((prev) => ({
      ...income,
      party1: [...prev.party1, new partyIncome("", "0", "")],
    }));

    setNonTaxableincome((prev) => ({
      ...nonTaxableincome,
      party1: [...prev.party1, new partyIncome("", "0", "")],
    }))
  };

  const addIncomeToParty2 = () => {
    setIncome((prev) => ({
      ...income,
      party2: [...prev.party2, new partyIncome("", "0", "")],
    }));

    setNonTaxableincome((prev) => ({
      ...nonTaxableincome,
      party2: [...prev.party2, new partyIncome("", "0", "")],
    }))
  };

  //========================= Add Benefits Dropdown ========================

  const addProvBenefitsToParty1 = () => {
    setBenefitsForParties((prev) => ({
      party1: {
        fed: prev.party1.fed,
        prov: [...prev.party1.prov, new partyIncome("", "0", "")],
      },
      party2: {
        fed: prev.party2.fed,
        prov: prev.party2.prov,
      },
    }));
  };

  const addFedBenefitsToParty1 = () => {
    setBenefitsForParties((prev) => ({
      party1: {
        fed: [...prev.party1.fed, new partyIncome("", "0", "")],
        prov: prev.party1.prov,
      },
      party2: {
        fed: prev.party2.fed,
        prov: prev.party2.prov,
      },
    }));
  };

  const addFedBenefitsToParty2 = () => {
    setBenefitsForParties((prev) => ({
      party1: {
        fed: prev.party1.fed,
        prov: prev.party1.prov,
      },
      party2: {
        fed: [...prev.party2.fed, new partyIncome("", "0", "")],
        prov: prev.party2.prov,
      },
    }));
  };

  const addProvBenefitsToParty2 = () => {
    return setBenefitsForParties((prev) => ({
      party1: {
        fed: prev.party1.fed,
        prov: prev.party1.prov,
      },
      party2: {
        fed: prev.party2.fed,
        prov: [...prev.party2.prov, new partyIncome("", "0", "")],
      },
    }));
  };

  const deleteProvBenefits = (index: number, partyNum: 1 | 2) => {
    return setBenefitsForParties((prev) => ({
      party1: {
        fed: prev.party1.fed,
        prov:
          partyNum === 1
            ? [
              ...prev.party1.prov.slice(0, index),
              ...prev.party1.prov.slice(index + 1),
            ]
            : prev.party1.prov,
      },
      party2: {
        fed: prev.party2.fed,
        prov:
          partyNum === 2
            ? [
              ...prev.party2.prov.slice(0, index),
              ...prev.party2.prov.slice(index + 1),
            ]
            : prev.party2.prov,
      },
    }));
  };

  const deleteFedBenefits = (index: number, partyNum: 1 | 2) => {
    return setBenefitsForParties((prev) => ({
      party1: {
        fed:
          partyNum === 1
            ? [
              ...prev.party1.fed.slice(0, index),
              ...prev.party1.fed.slice(index + 1),
            ]
            : prev.party1.fed,
        prov: prev.party1.prov,
      },
      party2: {
        fed:
          partyNum === 2
            ? [
              ...prev.party2.fed.slice(0, index),
              ...prev.party2.fed.slice(index + 1),
            ]
            : prev.party2.fed,
        prov: prev.party2.prov,
      },
    }));
  };

  const changeProvDeductionAmount = (
    e: React.BaseSyntheticEvent<HTMLInputElement>,
    index: number,
    partyNum: 1 | 2
  ): void => {
    return setBenefitsForParties((prev) => ({
      party1: {
        fed: prev.party1.fed,
        prov:
          partyNum === 1
            ? prev.party1.prov.map((vl, idx) => {
              if (index === idx) {
                vl.amount = e.target.value.replace(/[$,]/g, "");
              }

              return vl;
            })
            : prev.party1.prov,
      },
      party2: {
        fed: prev.party2.fed,
        prov:
          partyNum === 2
            ? prev.party2.prov.map((vl, idx) => {
              if (index === idx) {
                vl.amount = e.target.value.replace(/[$,]/g, "");
              }

              return vl;
            })
            : prev.party2.prov,
      },
    }));
  };

  const changeProvBenefitsDropdown = (
    e: { value: string; label: string },
    index: number,
    partyNum: 1 | 2
  ) => {
    return setBenefitsForParties((prev) => ({
      party1: {
        fed: prev.party1.fed,
        prov:
          partyNum === 1
            ? prev.party1.prov.map((vl, idx) => {
              if (index === idx) {
                vl.label = e.label;
              }

              return vl;
            })
            : prev.party1.prov,
      },
      party2: {
        fed: prev.party2.fed,
        prov:
          partyNum === 2
            ? prev.party2.prov.map((vl, idx) => {
              if (index === idx) {
                vl.label = e.label;
              }

              return vl;
            })
            : prev.party2.prov,
      },
    }));
  };

  const changeFedBenefitsDropdown = (
    e: { value: string; label: string },
    index: number,
    partyNum: 1 | 2
  ) => {
    return setBenefitsForParties((prev) => ({
      party1: {
        fed:
          partyNum === 1
            ? prev.party1.fed.map((vl, idx) => {
              if (index === idx) {
                vl.label = e.label;
              }

              return vl;
            })
            : prev.party1.fed,
        prov: prev.party1.prov,
      },
      party2: {
        fed:
          partyNum === 2
            ? prev.party2.fed.map((vl, idx) => {
              if (index === idx) {
                vl.label = e.label;
              }

              return vl;
            })
            : prev.party2.fed,
        prov: prev.party2.prov,
      },
    }));
  };

  const changeFedDeductionAmount = (
    e: React.BaseSyntheticEvent<HTMLInputElement>,
    index: number,
    partyNum: 1 | 2
  ) => {
    return setBenefitsForParties((prev) => ({
      party1: {
        fed:
          partyNum === 1
            ? prev.party1.fed.map((vl, idx) => {
              if (index === idx) {
                vl.amount = e.target.value.replace(/[$,]/g, "");
              }

              return vl;
            })
            : prev.party1.fed,
        prov: prev.party1.prov,
      },
      party2: {
        fed:
          partyNum === 2
            ? prev.party2.fed.map((vl, idx) => {
              if (index === idx) {
                vl.amount = e.target.value.replace(/[$,]/g, "");
              }
              return vl;
            })
            : prev.party2.fed,
        prov: prev.party2.prov,
      },
    }));
  };

  // ======================== Add Deductions ======================

  const addDeductionsToParty1 = () => {
    setDeductions((prev) => ({
      ...deductions,
      party1: [...prev.party1, { label: "", amount: "0", value: "" }],
    }));
  };

  const addDeductionsToParty2 = () => {
    setDeductions((prev) => ({
      ...deductions,
      party2: [...prev.party2, { label: "", amount: "0", value: "" }],
    }));
  };

  // ======================== Add Credits ======================

  const addCreditsToParty1 = () => {
    setBenefits((prev) => ({
      ...benefits,
      party1: [...prev.party1, { label: "", amount: "0", value: "" }],
    }));
  };

  const addCreditsToParty2 = () => {
    setBenefits((prev) => ({
      ...benefits,
      party2: [...prev.party2, { label: "", amount: "0", value: "" }],
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



  // Inside your component

  useEffect(() => {
    const fetchData = async () => {
      const calculatorIdValue = getCalculatorIdFromQuery(calculatorId);
      const parsedId = Number(calculatorIdValue);
      if (!calculatorIdValue || calculatorIdValue === 'null' || isNaN(parsedId)) return;
      const data = await apiCalculatorById.get_value(parsedId);


      const SceneriosData = JSON.parse(data.report_data)?.scenarios;
      const ExtractedData = JSON.parse(data.report_data)?.restructioring;

      setRestructioring(ExtractedData)

      setScenarios((prevScenarios) => ({
        ...prevScenarios,
        scenario1: SceneriosData?.scenario1 ?? prevScenarios.scenario1,
        scenario2: SceneriosData?.scenario2 ?? prevScenarios.scenario2,
        scenario3: SceneriosData?.scenario3 ?? prevScenarios.scenario3,
      }));

      const TaxAmountForLumpSumAndInsurence = JSON.parse(data.report_data)?.valueswithoutSpousalSupport
      if (TaxAmountForLumpSumAndInsurence) {
        valueswithoutSpousalSupport.current = TaxAmountForLumpSumAndInsurence;
        // setRestructioring(true)
      }
    };

    fetchData().catch(() => {});
  }, [Number(getCalculatorIdFromQuery(calculatorId))]);

  


  const passStateToParentAndNextPage = async (
    id: number,
    saveValues: boolean
  ) => {


      let gettaxbyIncome = {
        tax_year: distinctYears.selectedYear,
        "others": [
  
          ...(otherhouseholdmember?.party1.map((element) => {
            return {
              "parent": screen1.background.party1FirstName,
              "personal": {
                "province": screen1.background.party1province,
                "options": {
                  "disable": 0
                }
              },
              "finacials": {
                "emp_income": element.income,
                "self_income": 0,
                "other_income": 0,
                "non_taxable_income": 0
              }
            }
          })),
  
          ...(otherhouseholdmember?.party2.map((element) => {
            return {
              "parent": screen1.background.party2FirstName,
              "personal": {
                "province": screen1.background.party1province,
                "options": {
                  "disable": 0
                }
              },
              "finacials": {
                "emp_income": element.income,
                "self_income": 0,
                "other_income": 0,
                "non_taxable_income": 0
              }
            }
          }))
  
        ]
      }
  
      const AlldataofTaxAnddedution = await fetchSpecificTaxandDeductionforAmount(gettaxbyIncome)
     

    let childSupport = {
      childSupport1: marginalReciprocalTax.current.party1
        ? childSupportRef.current.party1 * marginalReciprocalTax.current.party1
        : childSupportRef.current.party1,
      childSupport2: marginalReciprocalTax.current.party2
        ? childSupportRef.current.party2 * marginalReciprocalTax.current.party2
        : childSupportRef.current.party2,
      givenTo: childSupportGivenTo(),
    };

    let spousalSupport = {
      spousalSupport1Med: specificamount.mid
        ? specificamount.mid
        : spousalSupportMed.current.party1,
      spousalSupport2Med: specificamount.mid
        ? specificamount.mid
        : spousalSupportMed.current.party2,
      spousalSupport1Low: specificamount.low
        ? specificamount.low
        : spousalSupportLow.current.party1,
      spousalSupport2Low: specificamount.low
        ? specificamount.low
        : spousalSupportLow.current.party2,
      spousalSupport1High: specificamount.high
        ? specificamount.high
        : spousalSupportHigh.current.party1,
      spousalSupport2High: specificamount.high
        ? specificamount.high
        : spousalSupportHigh.current.party2,

      givenTo: spousalSupportGivenTo(),
    }


    let npvlumpsumLow = 0;
    let npvlumpsumMid = 0;
    let npvlumpsumHigh = 0;
    let npvinsurenceLow = 0;
    let npvinsurenceMid = 0;
    let npvinsurenceHigh = 0;
    let viceversanpvinsurenceLow = 0;
    let viceversanpvinsurenceMid = 0;
    let viceversanpvinsurenceHigh = 0;
    let viceversaChildNpv = 0;




    let spousalsupportlow = Math.max(spousalSupport.spousalSupport1Low, spousalSupport.spousalSupport2Low)
    let spousalsupportmid = Math.max(spousalSupport.spousalSupport1Med, spousalSupport.spousalSupport2Med)
    let spousalsupporthigh = Math.max(spousalSupport.spousalSupport1High, spousalSupport.spousalSupport2High)
    let taxablevaluewithAddsupport = Math.max(taxeswithAddSupport.party1, taxeswithAddSupport.party2)
    let taxesWithSpecialExpensesValueLow = Math.max(taxesWithSpecialExpenses.current.party2Low, taxesWithSpecialExpenses.current.party1Low)
    let taxesWithSpecialExpensesValueMid = Math.max(taxesWithSpecialExpenses.current.party2Med, taxesWithSpecialExpenses.current.party1Med)
    let taxesWithSpecialExpensesValueHigh = Math.max(taxesWithSpecialExpenses.current.party2High, taxesWithSpecialExpenses.current.party1High)


    if (spousalSupport.givenTo == screen1.background.party1FirstName) {
      npvlumpsumLow = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport1Low * 12 -
          (taxeswithAddSupport.party2 - taxesWithSpecialExpenses.current.party1Low),
          spousalDuration, lumpsum.discount_rate)), 0))

      npvlumpsumMid = Math.round(
        Math.max(
          Number(calculateNPV(
            spousalSupport.spousalSupport1Med * 12 - (taxeswithAddSupport.party2 -
              taxesWithSpecialExpenses.current.party2Med), spousalDuration, lumpsum.discount_rate))
          , 0))


      npvlumpsumHigh = Math.round(
        Math.max(
          Number(
            calculateNPV(
              spousalSupport.spousalSupport1High * 12 - (taxeswithAddSupport.party2 -
                taxesWithSpecialExpenses.current.party2High)
              , spousalDuration, lumpsum.discount_rate
            ))

          , 0))
    } else {

      npvlumpsumLow = Math.round(Math.max(
        Number(calculateNPV(
          spousalSupport.spousalSupport2Low * 12 -
          (taxeswithAddSupport.party1 - taxesWithSpecialExpenses.current.party1Low),
          spousalDuration, lumpsum.discount_rate))
        , 0))


      npvlumpsumMid = Math.round(Math.max(Number(calculateNPV(
        spousalSupport.spousalSupport2Med * 12 - (taxeswithAddSupport.party1 -
          taxesWithSpecialExpenses.current.party1Med), spousalDuration, lumpsum.discount_rate)),
        0))


      npvlumpsumHigh = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport2High * 12 - (taxeswithAddSupport.party1 -
            taxesWithSpecialExpenses.current.party1High)
          , spousalDuration, lumpsum.discount_rate
        )
      ), 0))

    }


    if (childSupport.givenTo == screen1.background.party1FirstName) {
      npvinsurenceLow = Math.round(Number(calculateNPV(
        spousalsupportlow * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow), spousalDurationonInsurence, lifeInsurence.discount_rate))
        +
        Number(calculateNPV(childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate))
      )

      npvinsurenceMid = Math.round(Number(calculateNPV(
        spousalsupportmid * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid), spousalDurationonInsurence, lifeInsurence.discount_rate))
        + Number(calculateNPV(childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate))
      )

      npvinsurenceHigh = Math.round(Number(calculateNPV(
        spousalsupporthigh * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh), spousalDurationonInsurence, lifeInsurence.discount_rate))
        + Number(calculateNPV(childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate))
      )
    } else {
      npvinsurenceLow = Math.round(Number(calculateNPV(
        spousalsupportlow * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow), spousalDurationonInsurence, lifeInsurence.discount_rate))
        + Number(calculateNPV(childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate))
      )

      npvinsurenceMid = Math.round(Number(calculateNPV(
        spousalsupportmid * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid), spousalDurationonInsurence, lifeInsurence.discount_rate))
        + Number(calculateNPV(childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate))
      )

      npvinsurenceHigh = Math.round(Number(calculateNPV(
        spousalsupporthigh * 12 - (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh), spousalDurationonInsurence, lifeInsurence.discount_rate))
        + Number(calculateNPV(childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate))
      )
    }

    if (childSupport.givenTo == screen1.background.party1FirstName && spousalSupport.givenTo == screen1.background.party2FirstName) {
      viceversaChildNpv = Number(calculateNPV(childSupport.childSupport2, InsurenceDuration, lifeInsurence.discount_rate));

      viceversanpvinsurenceLow = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport2Low * 12 -
          (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow),
          spousalDuration, lumpsum.discount_rate)), 0))

      viceversanpvinsurenceMid = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport2Med * 12 -
          (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid),
          spousalDuration, lumpsum.discount_rate)), 0))

      viceversanpvinsurenceHigh = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport2High * 12 -
          (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh),
          spousalDuration, lumpsum.discount_rate)), 0))




    } else if (
      childSupport.givenTo == screen1.background.party2FirstName && childSupport.givenTo == screen1.background.party1FirstName) {
      viceversaChildNpv = Number(calculateNPV(childSupport.childSupport1, InsurenceDuration, lifeInsurence.discount_rate));
      viceversanpvinsurenceLow = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport1Low * 12 -
          (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueLow),
          spousalDuration, lumpsum.discount_rate)), 0))

      viceversanpvinsurenceMid = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport1Med * 12 -
          (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueMid),
          spousalDuration, lumpsum.discount_rate)), 0))

      viceversanpvinsurenceHigh = Math.round(Math.max(Number(
        calculateNPV(
          spousalSupport.spousalSupport1High * 12 -
          (taxablevaluewithAddsupport - taxesWithSpecialExpensesValueHigh),
          spousalDuration, lumpsum.discount_rate)), 0))
    }


    let lumpsumReport = {
      highparty2: npvlumpsumHigh,
      midparty2: npvlumpsumMid,
      lowparty2: npvlumpsumLow,
    };

    let insurenceReport = {
      highparty2: npvinsurenceHigh,
      midparty2: npvinsurenceMid,
      lowparty2: npvinsurenceLow,
    };

    let viceversaReport = {
      highparty2: viceversanpvinsurenceHigh,
      midparty2: viceversanpvinsurenceMid,
      lowparty2: viceversanpvinsurenceLow,
      child: viceversaChildNpv,
    };


    const obj = {
      income: income,
      gettaxsAndDedutionByIncome : {
        party1 :AlldataofTaxAnddedution.filter((element) => element.parent == screen1.background.party1FirstName),
        party2 :AlldataofTaxAnddedution.filter((element) => element.parent == screen1.background.party2FirstName) 
      } ,
      otherhouseholdmember:otherhouseholdmember,
      nonTaxableincome: nonTaxableincome,
      undueHardshipIncome: undueHardshipIncome,
      restructioring: restructioring,
      undueHardship: undueHardship,
      deductions,
      benefits,
      guidelineIncome,
      specialExpensesArr,
      lumpsumReport: lumpsumReport,
      insurenceReport: insurenceReport,
      viceversaReport: viceversaReport,
      tax_year: distinctYears.selectedYear,
      dobParty1: momentFunction.calculateNumberOfYears(
        screen1.background.party1DateOfBirth
      ),
      dobParty2: momentFunction.calculateNumberOfYears(
        screen1.background.party2DateOfBirth
      ),
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
        spousalSupport1Med: specificamount.mid
          ? specificamount.mid
          : spousalSupportMed.current.party1,
        spousalSupport2Med: specificamount.mid
          ? specificamount.mid
          : spousalSupportMed.current.party2,
        spousalSupport1Low: specificamount.low
          ? specificamount.low
          : spousalSupportLow.current.party1,
        spousalSupport2Low: specificamount.low
          ? specificamount.low
          : spousalSupportLow.current.party2,
        spousalSupport1High: specificamount.high
          ? specificamount.high
          : spousalSupportHigh.current.party1,
        spousalSupport2High: specificamount.high
          ? specificamount.high
          : spousalSupportHigh.current.party2,

        // spousalSupport1Med:  spousalSupportMed.current.party1,
        // spousalSupport2Med:  spousalSupportMed.current.party2,
        // spousalSupport1Low:  spousalSupportLow.current.party1,
        // spousalSupport2Low:  spousalSupportLow.current.party2,
        // spousalSupport1High:  spousalSupportHigh.current.party1,
        // spousalSupport2High:  spousalSupportHigh.current.party2,

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
      taxesWithoutSpecialExpenses: taxesWithoutSpecialExpenses.current,
      taxesWithSpecialExpenses: taxesWithSpecialExpenses.current,
      specialExpenses: {
        specialExpensesLow1: specialExpensesLowVal.current.party1,
        specialExpensesLow2: specialExpensesLowVal.current.party2,
        specialExpensesMed1: specialExpensesMedVal.current.party1,
        specialExpensesMed2: specialExpensesMedVal.current.party2,
        specialExpensesHigh1: specialExpensesHighVal.current.party1,
        specialExpensesHigh2: specialExpensesHighVal.current.party2,
      },
      canadaChildBenefitFixed: canadaChildBenefitFixed,
      valueswithoutSpousalSupport: valueswithoutSpousalSupport.current,
      provChildBenefitFixed: provChildBenefitFixed,
      GSTHSTBenefitFixed: GSTHSTBenefitFixed,
      ClimateActionBenefitFixed: ClimateActionBenefitFixed,
      salesTaxBenefitFixed: salesTaxBenefitFixed,
      basicPersonalAmountFederalFixed: basicPersonalAmountFederalFixed,
      basicPartyDisabilityFixed: basicPartyDisabilityFixed,
      basicPartyDisabilityProvFixed: basicPartyDisabilityProvFixed,
      amountForEligibleDependentFixed: amountForEligibleDependentFixed,
      baseCPPContributionFixed: baseCPPContributionFixed,
      eiPremiumFixed: eiPremiumFixed,
      canadaEmploymentAmountFixed: canadaEmploymentAmountFixed,
      basicPersonalAmountProvincialFixed: basicPersonalAmountProvincialFixed,
      amountForEligibleDependentProvincialFixed:
        amountForEligibleDependentProvincialFixed,
      disposableIncome: disposableIncomeRef.current,
      taxesFromApi: taxesFromApiRef.current,
      benefitsFromApi: benefitsFromApiRef.current,
    };

    syncUpParty1Deduction(specialExpensesArr, "21400");
    syncUpParty2Deduction(specialExpensesArr, "21400");
    calculateAndSetProvincialCredits(1);
    calculateAndSetProvincialCredits(2);

    const report_data = {
      ...obj,
      background: screen1.background,
      scenarios: scenarios,
      aboutTheRelationship: screen1.aboutTheRelationship,
      aboutTheChildren: screen1.aboutTheChildren,
      benefits: screen2.benefits,
      includeLumpsum: includeLumpsum,
      includeLifeInsurence: includeLifeInsurence,
      lumpsum: lumpsumReport,
      lumpsum_duration: spousalDuration,
      lumpsum_rate: lumpsum.discount_rate,
      insurenceReport: insurenceReport,
      childDisabilityBenefitParty1: childDisabilityBenefit.current.party1,
      childDisabilityBenefitParty2: childDisabilityBenefit.current.party2,
      disabilityCredits: basicPartyDisabilityFixed,
      disabilityCreditsProv: basicPartyDisabilityProvFixed,
      insurence_duration: spousalDurationonInsurence,
      insurence_child_duration: InsurenceDuration,
      insurence_rate: lifeInsurence.discount_rate,
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
      undueHardshipIncome: {
        party1: totalIncomeByIncomeState(undueHardshipIncome.party1),
        party2: totalIncomeByIncomeState(undueHardshipIncome.party2),
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
      report_data: report_data
    });

    history.push(
      `${AUTH_ROUTES.API_CALCULATOR
      }?id=${getCalculatorIdFromQuery(
        calculatorId
      )}&step=3&saveValues=${saveValues}`
    );
  };

  //======================= Income ========================

  const employedIncome10100Party1 = () => {
    return filterEmployedIncome10100AndSum(income.party1);
  };

  const employedIncome10100Party2 = () => {
    return filterEmployedIncome10100AndSum(income.party2);
  };

  const AllemployedIncomeParty1 = () => {
    return filterEmployedIncomeSumWithAllincome(income.party1);
  };

  const AllemployedIncomeParty2 = () => {
    return filterEmployedIncomeSumWithAllincome(income.party2);
  };


  const nonTaxableIncomeParty1 = () => {
    return nonTaxableincome.party1
      .filter((p) => p.value === "14700")
      .reduce((acc, inc) => acc + parseInt(inc.amount), 0);
  };


  const nonTaxableIncomeParty2 = () => {
    return nonTaxableincome.party2
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
      getTotalDeductionsParty1()

    return val;
  };


  const getTaxableIncomeAfterSupportParty2 = () => {

    const val = totalIncomeByIncomeState(income.party2) +

      supportReceived.current.party2 -
      // specialExpenses.party2 -
      getTotalDeductionsParty2()

  

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

  //if need to change prince change here..>>
  //canada workers benefits will not be included here.
  const getTotalDeductionsParty1 = () => {
    const specialExpenses =
      specialExpensesRef.current.party1 !== 0
        ? Math.min(
          AllemployedIncomeParty1() * (2 / 3),
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
          AllemployedIncomeParty2() * (2 / 3),
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

  const getDateofBirthParty=(PartyNum:number)=>{
    let BirthDate = PartyNum == 1 ? screen1.background.party1DateOfBirth : screen1.background.party2DateOfBirth
    return momentFunction.formatDate(BirthDate)
  }

  const getDateofMarriage=()=>{
    return momentFunction.formatDate(screen1.aboutTheRelationship.dateOfMarriage)
  }

  const getDateofSeparation=()=>{
    return momentFunction.formatDate(screen1.aboutTheRelationship.dateOfSeparation)
  }

    

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
    // const nonTaxableIncomeExist = !!income.party1.find(
    //   (p) => p.value === "14700"
    // );
    // return nonTaxableIncomeExist
    //   ? 0
    //   : 

    return CanadaWorkersBenefitFormula(
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
    // const nonTaxableIncomeExist = !!income.party2.find(
    //   (p) => p.value === "14700"
    // );
    // return nonTaxableIncomeExist
    //   ? 0
    //   : 

    return CanadaWorkersBenefitFormula(
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
        }, nonTaxableIncomeParty1()) +
        baseCPPContribution({
          selfEmployedIncome: selfEmployedIncomeParty1(),
          employedIncome: employedIncome10100Party1(),
          dynamicValues: fetchedDynamicValues,
        }, nonTaxableIncomeParty1()) +
        calculateEnhancedCPPDeductions(1)
      );
    } else if (selfEmployedIncomeParty2() > 0 && partyNum === 2) {

   
      return (
        EIPremiums({
          employedIncome: employedIncome10100Party2(),
          dynamicValues: fetchedDynamicValues,
        }, nonTaxableIncomeParty2()) +
        baseCPPContribution({
          selfEmployedIncome: selfEmployedIncomeParty2(),
          employedIncome: employedIncome10100Party2(),
          dynamicValues: fetchedDynamicValues,
        }, nonTaxableIncomeParty2()) +
        calculateEnhancedCPPDeductions(2)
      );


    }

    return 0;
  };

  const changeParty1BenefitsDropdown = (e, index: number) => {
    const party1Details = benefits.party1;
    party1Details[index]["value"] = e.value;
    party1Details[index]["label"] = e.label;
    setBenefits({ ...benefits, party1: party1Details });
    syncUpParty1SpecialExpenses(party1Details, "33099");
    syncUpParty1SpecialExpenses(party1Details, "32400");
    syncUpParty1SpecialExpenses(party1Details, "32300");
  };

  const setTypeOfCredit = (
    typeOfCredit: string,
    amount: number,
    partyNum: number
  ) => {
    if (partyNum === 1 && typeOfCredit === "FED") {
      allCreditsParty1.current = {
        ...allCreditsParty1.current,
        otherFederalCredits: amount,
      };
    } else if (partyNum === 1 && typeOfCredit === "PROV") {
      allCreditsParty1.current = {
        ...allCreditsParty1.current,
        otherOntarioCredits: amount,
      };
    } else if (partyNum === 2 && typeOfCredit === "FED") {
      allCreditsParty2.current = {
        ...allCreditsParty2.current,
        otherFederalCredits: amount,
      };
    } else if (partyNum === 2 && typeOfCredit === "PROV") {
      allCreditsParty2.current = {
        ...allCreditsParty2.current,
        otherOntarioCredits: amount,
      };
    }
  };

  const changeParty1BenefitsAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ) => {
    const party1Details = benefits.party1;
    const amount = e.currentTarget.value.replace(/[$,]/g, "");
    party1Details[index]["amount"] = amount;
    setBenefits({ ...benefits, party1: party1Details });

    setTypeOfCredit(determineTypeOfCredits(e), amount, 1);
    syncUpParty1SpecialExpenses(party1Details, "33099");
    syncUpParty1SpecialExpenses(party1Details, "32400");
    syncUpParty1SpecialExpenses(party1Details, "32300");
  };
  const changeParty2BenefitsDropdown = (e, index: number) => {
    const party2Details = benefits.party2;
    party2Details[index]["value"] = e.value;
    party2Details[index]["label"] = e.label;
    setBenefits({ ...benefits, party2: party2Details });
    syncUpParty2SpecialExpenses(party2Details, "33099");
    syncUpParty2SpecialExpenses(party2Details, "32400");
    syncUpParty2SpecialExpenses(party2Details, "32300");
  };

  const changeParty2BenefitsAmount = (
    e: React.SyntheticEvent<HTMLInputElement>,
    index: number
  ) => {
    const party2Details = benefits.party2;
    const amount = e.currentTarget.value.replace(/[$,]/g, "");
    party2Details[index]["amount"] = amount;
    setBenefits({ ...benefits, party2: party2Details });
    setTypeOfCredit(determineTypeOfCredits(e), amount, 2);
    syncUpParty2SpecialExpenses(party2Details, "33099");
    syncUpParty2SpecialExpenses(party2Details, "32400");
    syncUpParty2SpecialExpenses(party2Details, "32300");
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
        }, nonTaxableIncomeParty1()) +
        baseCPPContribution({
          employedIncome: employedIncome10100Party1(),
          selfEmployedIncome: selfEmployedIncomeParty1(),
          dynamicValues: fetchedDynamicValues,
        }, nonTaxableIncomeParty1()) +
        +calculateEnhancedCPPDeductions(1)
      );
    } else if (partyNum === 2 && employedIncome10100Party2() > 0) {
      const EIValue = EIPremiums({
        employedIncome: employedIncome10100Party2(),
        dynamicValues: fetchedDynamicValues,
      }, nonTaxableIncomeParty2());

      const baseCPPContributionValue = baseCPPContribution({
        employedIncome: employedIncome10100Party2(),
        selfEmployedIncome: selfEmployedIncomeParty2(),
        dynamicValues: fetchedDynamicValues,
      }, nonTaxableIncomeParty2());

      const EnhancedCPPDeductionsValue = calculateEnhancedCPPDeductions(2);

      const total =
        baseCPPContributionValue + EIValue + EnhancedCPPDeductionsValue;


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
      Number(isNaN(calculateTotalTaxes(1)) ? 0 : calculateTotalTaxes(1)) +
      // Number(calculateTotalTaxes(1)) +
      Number(sumAllBenefits(1)) -
      Number(childSupport) -
      specialExpensesRef.current.party1;



    return val + nonTaxableIncomeParty1();
  };

  const calculateDisposableIncome2WithoutEnhancedCPP = (
    childSupport: number
  ) => {

  
    const val =


      Number(totalIncomeByIncomeState(income.party2)) +
      Number(totalIncomeByIncomeState(guidelineIncome.party2)) -
      Number(isNaN(calculateTotalTaxes(2)) ? 0 : calculateTotalTaxes(2)) +
      // Number(calculateTotalTaxes(2)) +
      Number(sumAllBenefits(2)) -
      Number(childSupport) -
      specialExpensesRef.current.party2;


    return val + nonTaxableIncomeParty2();
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

  const calculateChildSupport = async () => {
    // Build guideline incomes (regular + schedule III + non-taxable)
    const totalIncomeParty1WithGuideline = totalIncomeByIncomeState([
      ...income.party1,
      ...guidelineIncome.party1,
      ...nonTaxableincome.party1
    ]);

    const totalIncomeParty2WithGuideline = totalIncomeByIncomeState([
      ...income.party2,
      ...guidelineIncome.party2,
      ...nonTaxableincome.party2
    ]);

    // Map frontend child objects to Flask payload format
    const childrenPayload = (screen1.aboutTheChildren.childrenInfo || []).map((child: any) => ({
      name: child.name || "",
      csg_table: child.CSGTable || "No",
      child_support_override: Number(child.ChildSupportOverride) || 0,
      custody_arrangement: child.custodyArrangement || "Party 1",
    }));

    const flaskResult = await calcChildSupportFlask({
      party1_income: totalIncomeParty1WithGuideline,
      party2_income: totalIncomeParty2WithGuideline,
      party1_name: screen1.background.party1FirstName || "Party 1",
      party2_name: screen1.background.party2FirstName || "Party 2",
      party1_province: getProvinceOfParty1(),
      party2_province: getProvinceOfParty2(),
      children: childrenPayload,
    });

    if (!flaskResult) {
      console.error("[calculateChildSupport] Flask /calculate returned null");
      return { party1: 0, party2: 0 };
    }

    // Populate all refs from the Flask response
    ChildSupportInitValue.current = {
      party1: flaskResult.child_support_init.party1_annual,
      party2: flaskResult.child_support_init.party2_annual,
    };

    childSupportRef.current = {
      party1: flaskResult.child_support_ref.party1_annual,
      party2: flaskResult.child_support_ref.party2_annual,
    };

    notionalAmountRef.current = {
      party1: flaskResult.notional_amount_ref.party1_annual,
      party2: flaskResult.notional_amount_ref.party2_annual,
    };

    childSupportReadOnly.current = {
      party1: flaskResult.party1_annual,
      party2: flaskResult.party2_annual,
    };

    return {
      party1: flaskResult.party1_annual,
      party2: flaskResult.party2_annual,
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

   let houseHoldIncome1 = 0;
   let houseHoldIncome2 = 0;


   if(typeOfSplitting == "SHARED"){
    if(rate == 0.50){
       houseHoldIncome1 = calculateDisposableIncome1WithoutEnhancedCPP(
        childSupportRef.current.party1 + notionalAmountRef.current.party1
      );


      //use childSupportTotal2
       houseHoldIncome2 = calculateDisposableIncome2WithoutEnhancedCPP(
        childSupportRef.current.party2 + notionalAmountRef.current.party2
      );
      
    }else{
       houseHoldIncome1 = calculateDisposableIncome1WithoutEnhancedCPP(
        ChildSupportInitValue.current.party1 + notionalAmountRef.current.party1
      );


      //use childSupportTotal2
       houseHoldIncome2 = calculateDisposableIncome2WithoutEnhancedCPP(
        ChildSupportInitValue.current.party2 + notionalAmountRef.current.party2
      );
    }
   }else{
    houseHoldIncome1 = calculateDisposableIncome1WithoutEnhancedCPP(
      childSupportRef.current.party1 + notionalAmountRef.current.party1
    );


    //use childSupportTotal2
     houseHoldIncome2 = calculateDisposableIncome2WithoutEnhancedCPP(
      childSupportRef.current.party2 + notionalAmountRef.current.party2
    );
   }


   console.log('houseHoldIncome2 in iterative',houseHoldIncome1)
   console.log('houseHoldIncome2 in iterative p2',houseHoldIncome2)

     


      let spousalSupportVal;

      if (time === 0) {
        if (rate === calpercentageRef.low / 100)
          spousalSupportVal = globallowSupport.current;
        if (rate === calpercentageRef.mid / 100)
          spousalSupportVal = globalmedSupport.current;
        if (rate === calpercentageRef.high / 100)
          spousalSupportVal = globalhighSupport.current;

      } else {
        spousalSupportVal =
          spousalSupportFormulaByRate(
            houseHoldIncome1,
            houseHoldIncome2,
            rate
          )
      }

    

      //assigning spousal support when we have calculated for the spousal support with special expenses.
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



      //In these arrays we are storing the spousal support for tracking and knowning where do we need to stop.
      if (rate === calpercentageRef.low / 100 && time === 1) {
        matchResultsLowWithoutSpecialExpenses.current.push(spousalSupportVal);

        //store value for tax

        assignValuesToLowKeysWithoutSpecialExpenses();
        // console.log("& pushing to low one Tax", taxesWithoutSpecialExpenses);
      } else if (rate === calpercentageRef.mid / 100 && time === 1) {
        matchResultsWithoutSpecialExpenses.current.push(spousalSupportVal);
        // console.log("& pushing to med one Tax", taxesWithoutSpecialExpenses);

        assignValuesToMedKeysWithoutSpecialExpenses();
      } else if (rate === calpercentageRef.high / 100 && time === 1) {
        matchResultsHighWithoutSpecialExpenses.current.push(spousalSupportVal);
        // console.log("& pushing to high one Tax", taxesWithoutSpecialExpenses);

        assignValuesToHighKeysWithoutSpecialExpenses();
      } else if (rate === calpercentageRef.low / 100 && time === 2) {
        // storing values for tracking the spousal support for low case in majority parenting scenerio.
        specialExpensesLow.current.push(spousalSupportVal);

        // assigning values for low case when the spousal support with the special expenses is calculated.
        assignValuesToLowKeys();
      } else if (rate === calpercentageRef.mid / 100 && time === 2) {
        // storing values for tracking the spousal support for med case in majority parenting scenerio.
        specialExpensesMed.current.push(spousalSupportVal);

        // assigning values for med case when the spousal support with the special expenses is calculated.
        assignValuesToMedKeys();
      } else if (rate === calpercentageRef.high / 100 && time === 2) {
        //storing values for tracking the spousal support for high case in majority parenting scenerio.
        specialExpensesHigh.current.push(spousalSupportVal);


        // assigning values for high case when the spousal support with the special expenses is calculated.
        assignValuesToHighKeys();
      } else if (time === 0) {
        //This is the case for HIGH scenerio.
        // for the high case we do not iterate. We just calculate once.
        // This is the logic for assigning values in low, med and high cases in HIGH Scenerio.
        if (rate === calpercentageRef.low / 100) assignValuesToLowKeys();
        else if (rate === calpercentageRef.mid / 100) assignValuesToMedKeys();
        else if (rate === calpercentageRef.high / 100) assignValuesToHighKeys();
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

  const calculateSpecialExpenseSupport = (
    taxesWithoutSpecialExpenses: {
      party1Low: number;
      party2Low: number;
      party1Med: number;
      party2Med: number;
      party1High: number;
      party2High: number;
    },
    type: "Low" | "Med" | "High",
    overWritepercentage: number
  ) => {
    //When time === 1, then calculations are done with special expenses as ZERO.

    //When time === 2, then we are assigning special expenses to the variables which will be used for calculations. This is because we want to see the difference between the taxes when special expenses are zero and when they have some value.

    //When you pass  overWritepercentage from setting modal this well overwrite you special expenses % percentage value and calculate value accordingly .

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
    // let percentageParty1 = specialExpensePercentage.low ? specialExpensePercentage.low : 0;
    // let percentageParty2 = specialExpensePercentage.low ? specialExpensePercentage.low: 0;

    let percentageParty1 = 0;
    let percentageParty2 = 0;

    if (supportReceived.current.party1 > supportReceived.current.party2) {
      householdIncome =
        totalIncomeByIncomeState(income.party1) +
        supportReceived.current.party1 +
        totalIncomeByIncomeState(income.party2) -
        deductableSupport.current.party2;

      percentageParty1 = overWritepercentage
        ? overWritepercentage / 100
        : Number(
          totalIncomeByIncomeState(income.party1) +
          supportReceived.current.party1
        ) / householdIncome;

      percentageParty2 = overWritepercentage
        ? overWritepercentage / 100
        : Number(
          totalIncomeByIncomeState(income.party2) -
          deductableSupport.current.party2
        ) / householdIncome;
    } else {
      householdIncome =
        totalIncomeByIncomeState(income.party1) -
        deductableSupport.current.party1 +
        totalIncomeByIncomeState(income.party2) +
        supportReceived.current.party2;

      percentageParty2 = overWritepercentage
        ? overWritepercentage / 100
        : Number(
          totalIncomeByIncomeState(income.party2) +
          supportReceived.current.party2
        ) / householdIncome;

      percentageParty1 = overWritepercentage
        ? overWritepercentage / 100
        : Number(
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

    //total special expense - annualPaymentByPayingParty1
    // console.log("&* total amount to be shared", {
    //   taxesWithoutSpecialExpensesType1,
    //   taxesWithoutSpecialExpensesType2,
    //   totalTaxes1: calculateTotalTaxes(1),
    //   totalTaxes2: calculateTotalTaxes(2),
    //   totalBenefits1: sumAllBenefits(1),
    //   totalBenefits2: sumAllBenefits(2),
    //   partyWhoPayed,
    //   amountToBeDeducted,
    //   party1TaxesMinusDeductions,
    //   party2TaxesMinusDeductions,
    //   totalAmountToBeShared,
    //   householdIncome,
    //   percentageParty1,
    //   percentageParty2,
    //   spousalSupportHigh,
    //   deductableSupport,
    //   supportReceived,
    //   annualPaymentByPayingParty1,
    //   annualPaymentByPayingParty2,
    //   annualPaymentMonthly1: annualPaymentByPayingParty1 / 12,
    //   annualPaymentMonthly2: annualPaymentByPayingParty2 / 12,
    //   result: obj,
    // });

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
      disabilityCredits,
      disabilityCreditsProv,
    } = creditSelection;
    

    const val =
      basicPersonalAmountFederal +
      disabilityCredits +
      ageAmount +
      amountForEligibleDependent +
      baseCPPContribution +
      EIPremiums +
      canadaEmploymentAmount;

    return val;
  };

  // const sumAllProvCredits = (partyNum: 1 | 2) => {
  //   //Wrong calculation not the same in Excel.
  //   // =SUM(G23:G24)+IF(G1>=65,MAX(5312-(G15-39546)*0.15,0),0)+G20+G21
  //   const creditSelection =
  //     partyNum === 1 ? allCreditsParty1.current : allCreditsParty2.current;
  //   const {
  //     basicPersonalAmountOntario,
  //     amountForEligibleDependentOntario,
  //     baseCPPContribution,
  //     EIPremiums,
  //   } = creditSelection;

  //   const val =
  //     basicPersonalAmountOntario +
  //     amountForEligibleDependentOntario +
  //     baseCPPContribution +
  //     EIPremiums;

  //   return val;
  // };

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

  const calculateFedTax1ForOtherhouseholdmember = (): number => {
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

  const calculateFedTax2ForOtherhouseholdmember = (): number => {
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

  const calculateFederalTaxForotherHouseholdmember=()=>{
    const val = {
      party1: Math.max(determineFederalTaxForotherHouseholdmember(1), 0),
      party2: Math.max(determineFederalTaxForotherHouseholdmember(2), 0),
    };


  }

  const determineFederalTax = (partyNum: number) => {
    if (partyNum === 1) {
      return calculateFedTax1();
    } else {
      return calculateFedTax2();
    }
  };

  const determineFederalTaxForotherHouseholdmember = (partyNum: number) => {
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
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(1), nonTaxableIncomeParty1()),
        screen1: screen1,
        employedIncome: employedIncome10100Party1(),
      };

      return determineProvTaxON(objON);
    } else if (province === "BC" && fetchedProvincialTaxDB.length > 0) {
      const objBC = {
        fetchedProvincialTaxDB,
        fetchedHealthTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(1), nonTaxableIncomeParty1()),
      };
      return determineProvTaxBC(objBC);
    } else if (province === "AB") {
      const objAB: IProvincialTaxAB = {
        fetchedHealthTaxDB,
        taxBrackets: fetchedProvincialTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(1), nonTaxableIncomeParty1()),
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
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(2), nonTaxableIncomeParty2()),
        screen1: screen1,
        employedIncome: employedIncome10100Party2(),
      };

      return determineProvTaxON(objON);
    } else if (province === "BC" && fetchedProvincialTaxDB.length > 0) {
      const objBC = {
        fetchedProvincialTaxDB,
        fetchedHealthTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty2(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(2), nonTaxableIncomeParty2()),
      };

      return determineProvTaxBC(objBC);
    } else if (province === "AB") {
      //need to change this
      const objAB: IProvincialTaxAB = {
        fetchedHealthTaxDB,
        taxBrackets: fetchedProvincialTaxDB,
        taxableIncome: getTaxableIncomeAfterSupportParty2(),
        provincialCredits: totalOntarioCredits(paramsForProvincialCredits(2), nonTaxableIncomeParty2()),
      };

      console.log("getprovinceofparty2inner", objAB)

      return determineProvTaxAB(objAB);
    }
  };



  const paramsForProvincialCredits = (partyNum: 1 | 2) => {
    if (partyNum === 1) {
      return {
        basicPersonalAmountOntario: allCreditsParty1.current.basicPersonalAmountOntario,
        amountForEligibleDependent: allCreditsParty1.current.amountForEligibleDependentOntario,
        taxableIncome: getTaxableIncomeAfterSupportParty1(),
        baseCPPContribution: allCreditsParty1.current.baseCPPContribution,
        eiPremiums: allCreditsParty1.current.EIPremiums,
        disabilityCreditsProv: allCreditsParty1.current.disabilityCreditsProv,
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
        disabilityCreditsProv: allCreditsParty2.current.disabilityCreditsProv,
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


  useEffect(() => {
    determineChildBenefit();
    determinChildDisabilityBenefit();
    determineGSTHSTBenefits();
    determineOntarioChildBenefit();
    determineOntarioSalesTax();
    calculateAllClimateChange();

  }, [isCheckedSwitch]);

  const checkAnyChildisShared = (data: Array) => {
    return data.some((ele) => ele.custodyArrangement === "Shared");
  }

  useEffect(() => {


    if (checkAnyChildisShared(screen1.aboutTheChildren.childrenInfo)) {
      // setCalPercentage((prev) => ({
      //   ...prev,
      //   high: 50
      // }))

      calpercentageRef = {
        low:40,
        mid:43,
        high:50
      }
      

    }

  }, []);

  useEffect(()=>{
    // console.log("check in useEffect disposeable income new ", calculateDisposableIncome1WithoutEnhancedCPP(
    //   ChildSupportInitValue.current.party1 + notionalAmountRef.current.party1
    // ))

    console.log("check in useEffect disposeable income old p1",calculateDisposableIncome1WithoutEnhancedCPP(
      childSupportRef.current.party1 + notionalAmountRef.current.party1
    ))

    console.log("check in useEffect disposeable income old p2",calculateDisposableIncome2WithoutEnhancedCPP(
      childSupportRef.current.party2 + notionalAmountRef.current.party2
    ))
    


  },[income])

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

    // console.log("canada Child benefit", val);

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
      childDisabilityBenefit.current.party1 = isCheckedSwitch.Child_Disability_Party1 ? childDisabilityBenefitParty1() : 0;
    }

    if (!ChildDisabilityBenefitFixed.party2.isFixed) {
      childDisabilityBenefit.current.party2 = isCheckedSwitch.Child_Disability_Party2 ? childDisabilityBenefitParty2() : 0;
    }
  };

  const determineChildBenefit = () => {
    if (!canadaChildBenefitFixed.party1.isFixed) {

      childBenefit.current.party1 = isCheckedSwitch.Canada_Child_benefit_party1 ? childBenefitParty1() : 0;
    }

    if (!canadaChildBenefitFixed.party2.isFixed) {

      childBenefit.current.party2 = isCheckedSwitch.Canada_Child_benefit_party2 ? childBenefitParty2() : 0;


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
      GSTHSTBenefit.current.party1 = isCheckedSwitch.GST_HST_Benefit_party1 ? GSTHSTBenefitsParty1() : 0;
    }

    if (!GSTHSTBenefitFixed.party2.isFixed) {
      GSTHSTBenefit.current.party2 = isCheckedSwitch.GST_HST_Benefit_party2 ? GSTHSTBenefitsParty2() : 0;
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

    if( getProvinceOfParty1() == "BC"){
      return val
    }else{
      return ifSharedDivideBy2(typeOfSplitting, val);

    }

 
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

    if( getProvinceOfParty2() == "BC"){
      return val
    }else{
      return ifSharedDivideBy2(typeOfSplitting, val);

    }
    
  };

  const determineOntarioChildBenefit = () => {
    if (!provChildBenefitFixed.party1.isFixed) {
      OntarioChildBenefit.current.party1 = isCheckedSwitch.PROV_Child_benefit_party1 ? ontarioChildBenefitParty1() : 0;
    }

    if (!provChildBenefitFixed.party2.isFixed) {
      OntarioChildBenefit.current.party2 = isCheckedSwitch.PROV_Child_benefit_party2 ? ontarioChildBenefitParty2() : 0;
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
      climateChangeVal.current.party1 = isCheckedSwitch.PROV_Climate_Action_Incentive_party1 ? calculateClimateChange(1) : 0;
    }

    if (!ClimateActionBenefitFixed.party2.isFixed) {
      climateChangeVal.current.party2 = isCheckedSwitch.PROV_Climate_Action_Incentive_party2 ? calculateClimateChange(2) : 0;
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
      ontarioSalesTax.current.party1 = isCheckedSwitch.PROV_Sales_Tax_Party1 ? ontarioSalesTaxParty1(
        getProvinceOfParty1()
      ) : 0;
    }

    if (!salesTaxBenefitFixed.party2.isFixed) {
      ontarioSalesTax.current.party2 = isCheckedSwitch.PROV_Sales_Tax_Party2 ? ontarioSalesTaxParty2(
        getProvinceOfParty2()
      ) : 0;
    }
  };

  const sumAllBenefits = (partyNum: number = 2) => {


    console.log("check sums party1", partyNum, Number(ontarioSalesTax.current.party1),
      Number(OntarioChildBenefit.current.party1),
      Number(GSTHSTBenefit.current.party1),
      Number(childBenefit.current.party1),
      Number(climateChangeVal.current.party1),
      Number(childDisabilityBenefit.current.party1))

    console.log("check sums party2", partyNum, Number(ontarioSalesTax.current.party2),
      Number(OntarioChildBenefit.current.party2),
      Number(GSTHSTBenefit.current.party2),
      Number(childBenefit.current.party2),
      Number(climateChangeVal.current.party2),
      Number(childDisabilityBenefit.current.party2))

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


    //  75000 , 26045
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

  console.log("screen1.aboutTheChildren",screen1.aboutTheChildren)




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
          if (rate === calpercentageRef.low / 100 && time === 0) {
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
          else if (rate === calpercentageRef.mid / 100 && time === 0) {
            return (
              Number(matchResults.current[matchResults.current.length - 1]) ===
              Number(matchResults.current[matchResults.current.length - 6]) ||
              count === 25
            );
          }
          //for low case and with special expenses.
          else if (rate === calpercentageRef.low / 100 && time === 1) {
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
          else if (rate === calpercentageRef.mid / 100 && time === 1) {
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
          else if (rate === calpercentageRef.high / 100 && time === 1) {
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
          }
          else if (rate === calpercentageRef.low / 100 && time === 2) {
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
          } else if (rate === calpercentageRef.mid / 100 && time === 2) {
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
          } else if (rate === calpercentageRef.high / 100 && time === 2) {
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
          rate: calpercentageRef.low | calpercentageRef.mid | calpercentageRef.high,
          time: 0 | 1 | 2
        ): number | undefined => {
          if (rate === calpercentageRef.low / 100 && time === 1) {
            // console.log("&* in low Tax column");

            const val =
              matchResultsLowWithoutSpecialExpenses.current[
              matchResultsLowWithoutSpecialExpenses.current.length - 1
              ];

            return val;
          } else if (rate === calpercentageRef.mid / 100 && time === 1) {
            // console.log("&* in med Tax column");
            const val =
              matchResultsWithoutSpecialExpenses.current[
              matchResultsWithoutSpecialExpenses.current.length - 1
              ];

            return val;
          } else if (rate === calpercentageRef.high / 100 && time === 1) {
            // console.log("&* in high Tax column");
            const val =
              matchResultsHighWithoutSpecialExpenses.current[
              matchResultsHighWithoutSpecialExpenses.current.length - 1
              ];
            return val;
          } else if (rate === calpercentageRef.low / 100 && time === 2) {
            // console.log("&* in low Tax column");
            const val =
              specialExpensesLow.current[specialExpensesLow.current.length - 1];
            return val;
          } else if (rate === calpercentageRef.mid / 100 && time === 2) {
            // console.log("&* in med Tax column");
            const val =
              specialExpensesMed.current[specialExpensesMed.current.length - 1];

            return val;
          } else if (rate === calpercentageRef.high / 100 && time === 2) {
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
            // return specificamount.high ?  specificamount.high : val
          }
        };

        let count = 0;

        const timer = setInterval(async (rateParam, time) => {
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
            if (rateParam === calpercentageRef.low / 100 && time === 1) {
              //run with special expenses zero on first time.
              clearSpecialExpensesToZero();
              //save the value of the taxes in variable
              await calculateChildAndSpousalSupportManually(
                calpercentageRef.low / 100,
                1
              );

              //when I have constant taxes value
              //then the iterative function again
              //set special expenses accordingly.

              //keep calling function.
            }
            else if (rateParam === calpercentageRef.mid / 100 && time === 1) {
              clearSpecialExpensesToZero();
              await calculateChildAndSpousalSupportManually(
                calpercentageRef.mid / 100,
                1
              );
              // console.log(
              //   "&* Med one Tax work",
              //   matchResultsWithoutSpecialExpenses
              // );
            }
            else if (rateParam === calpercentageRef.high / 100 && time === 1) {
              clearSpecialExpensesToZero();
              await calculateChildAndSpousalSupportManually(
                calpercentageRef.high / 100,
                1
              );

              // console.log(
              //   "&* High one Tax work",
              //   matchResultsHighWithoutSpecialExpenses
              // );
            }
            else if (rateParam === calpercentageRef.low / 100 && time === 2) {
              syncUpParty1Deduction(specialExpensesArr, "21400");
              syncUpParty2Deduction(specialExpensesArr, "21400");

              // assigning the special expenses variable the value and then calculating it
              if (getTotalSpecialExpensesForBothParties() > 0) {
                calculateSpecialExpenseSupport(
                  taxesWithoutSpecialExpenses.current,
                  "Low",
                  specialExpensePercentage.low
                );
              }

              await calculateChildAndSpousalSupportManually(
                calpercentageRef.low / 100,
                2
              );
              // console.log(
              //   "&* Low one Special Expenses work",
              //   specialExpensesLow
              // );
            }
            else if (rateParam === calpercentageRef.mid / 100 && time === 2) {
              syncUpParty1Deduction(specialExpensesArr, "21400");
              syncUpParty2Deduction(specialExpensesArr, "21400");
              // assigning the special expenses variable the value and then calculating it
              if (getTotalSpecialExpensesForBothParties() > 0) {
                calculateSpecialExpenseSupport(
                  taxesWithoutSpecialExpenses.current,
                  "Med",
                  specialExpensePercentage.mid
                );
              }
              await calculateChildAndSpousalSupportManually(
                calpercentageRef.mid / 100,
                2
              );

              // console.log(
              //   "&* Med one Special Expenses work",
              //   specialExpensesMed
              // );
            }
            else if (rateParam === calpercentageRef.high / 100 && time === 2) {
              syncUpParty1Deduction(specialExpensesArr, "21400");
              syncUpParty2Deduction(specialExpensesArr, "21400");
              // assigning the special expenses variable the value and then calculating it

              if (getTotalSpecialExpensesForBothParties() > 0) {
                calculateSpecialExpenseSupport(
                  taxesWithoutSpecialExpenses.current,
                  "High",
                  specialExpensePercentage.high
                );
              }
              await calculateChildAndSpousalSupportManually(
                calpercentageRef.high / 100,
                2
              );
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
            console.log("err in iterative formula", err);
            // window.location.href = "/calculator";
            clearInterval(timer);
            reject(err);
          }

        }, 1, rate, time);
      });
    }

    //queue method
    if (data.lowTaxes) {
      //clearSpecialExpensesToZero();
      await waitUntil(calpercentageRef.low / 100, 1);
      // console.log("&* response Low Tax 2", resTaxLow2);
    }
    if (data.medTaxes) {
      //clearSpecialExpensesToZero();
      await waitUntil(calpercentageRef.mid / 100, 1);
      // console.log("&* response Low Tax 2", resTaxMed2);
    }
    if (data.highTaxes) {
      // refButtonResetSpecialExpense.current.click();
      //clearSpecialExpensesToZero();
      await waitUntil(calpercentageRef.high / 100, 1);
      // console.log("&* response High Tax 2", resTaxHigh2);
    }

    if (data.highLimit) {

      //await waitUntil(0.5, 0);
      // console.log("&* response High Limit", resHighLimit);

      let { lowSupport, medSupport, highSupport, high, med, low } =
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
        calpercentageRef.low / 100
      );
      await iterativeFormula(calpercentageRef.low / 100, 0);

      assignValueForSpousalSupport(
        totalIncomeByIncomeState(income.party1),
        totalIncomeByIncomeState(income.party2),
        medSupport,
        calpercentageRef.mid / 100
      );
      await iterativeFormula(calpercentageRef.mid / 100, 0);

      let diffHighSupport = highSupport;

      let assignedHighLimit = matchResultsHigh;


      if (high >= 0.5) {
        // set high from 46 to 50 in case of high >= 50%
        calpercentageRef = {
          low:40,
          mid:43,
          high:50
        }
    
         // we need to run iterative in that case if high >= 50%   
        await calculateSpousalSupportAuto({
          highLimit: false,
          lowTaxes: true,
          medTaxes: true,
          highTaxes: true,
          specialExpensesLow: true,
          specialExpensesMed: true,
          specialExpensesHigh: true,
        });

        // get high value and pass on next function as same we calculate low , mid.
        diffHighSupport =
          matchResultsHighWithoutSpecialExpenses.current[matchResultsHighWithoutSpecialExpenses.current.length - 1];

         
          // set again in case of (high >= 50%) cause if you dont do this its change your low mid in iterative. 
          assignValueForSpousalSupport(
            totalIncomeByIncomeState(income.party1),
            totalIncomeByIncomeState(income.party2),
            lowSupport,
            calpercentageRef.low / 100
          );
          await iterativeFormula(calpercentageRef.low / 100, 0);
    
          assignValueForSpousalSupport(
            totalIncomeByIncomeState(income.party1),
            totalIncomeByIncomeState(income.party2),
            medSupport,
            calpercentageRef.mid / 100
          );
          await iterativeFormula(calpercentageRef.mid / 100, 0);


      }

     
      assignValueForSpousalSupport(
        totalIncomeByIncomeState(income.party1),
        totalIncomeByIncomeState(income.party2),
        diffHighSupport,
        calpercentageRef.high / 100
      );
      await iterativeFormula(calpercentageRef.high / 100, 0);

      applicablePercentage.current.low = low;
      applicablePercentage.current.med = med;
      applicablePercentage.current.high = high;

      assignValuesAfterAllCalculations();
    }

    if (data.specialExpensesLow) {
      await waitUntil(calpercentageRef.low / 100, 2);
      // console.log("&* Taxes low", Taxes);
    }
    if (data.specialExpensesMed) {
      await waitUntil(calpercentageRef.mid / 100, 2);

      // console.log("&* Taxes Med", Taxes);
    }
    if (data.specialExpensesHigh) {
      await waitUntil(calpercentageRef.high / 100, 2);
      // console.log("&* Taxes High", Taxes);
    }

    assignValuesAfterAllCalculations();

    // console.log(
    //   "&* response for taxes",
    //   taxesWithSpecialExpenses,
    //   taxesWithoutSpecialExpenses
    // );
    setShowCalculationCompleted(true);
    setShowSaveCalculatorValues(true);
  };

  const calculateChildAndSpousalSupportAuto = async () => {

    // console.log('Screen1Allinfo', screen1)
    // console.log('Screen2Allinfo', screen2)

    let objforApi = {
      "tax_year": distinctYears?.selectedYear,
      "typeofsupport": typeOfCalculatorSelected,
      "party1": {
          "personal": {
              "name": party1Name(),
              "dob": getDateofBirthParty(1),
              "province": getProvinceOfParty1(),
              "options": {
                  "disable": 0
              }
          },
          "finacials": {
              "emp_income": employedIncome10100Party1(),
              "self_income": 0,
              "other_income": 0,
              "non_taxable_income": 0
          },
           "enable_benefits": {
              "canadianchild":1,
              "gsthst":1,
              "provincechild":1,
              "climate":1,
              "disability":1
          }
      },
      "party2": {
          "personal": {
              "name": party2Name(),
              "dob": getDateofBirthParty(2),
              "province": getProvinceOfParty2(),
              "options": {
                  "disable": 0
              }
          },
          "finacials": {
              "emp_income": employedIncome10100Party2(),
              "self_income": 0,
              "other_income": 0,
              "non_taxable_income": 0
          },
           "enable_benefits": {
              "canadianchild":1,
              "gsthst":1,
              "provincechild":1,
              "climate":1,
              "disability":1
          }
      },
      "relationship": {
          "dom": getDateofMarriage(),
          "dos": getDateofSeparation()
      },
      "childrens": screen1.aboutTheChildren.childrenInfo,
      "childcareexpenses": specialExpensesArr,
      "otherdeductions": [],
      "rates": {
          "low": {"rate": calpercentageRef.low, "spousal_support": -1},
          "med": {"rate": calpercentageRef.mid, "spousal_support": -1},
          "high": {"rate": calpercentageRef.high, "spousal_support": -1}
      }
    }

    if (checkIfAllMandatoryValuesAreFilled()) {
      storeBasicValues();
      // Child support must run first — the iterative spousal formula needs CS
      // amounts (payor's Table CS and recipient's notional CS) as inputs.
      await calculateChildSupport();

      // Gross annual incomes — sent directly to the Python iterative API.
      // The backend (calculate_spousal_support_iterative) accepts gross income
      // and runs tax computation on each iteration so SS and taxes converge together.
      const party1GrossAnnual = totalIncomeByIncomeState(income.party1) + nonTaxableIncomeParty1();
      const party2GrossAnnual = totalIncomeByIncomeState(income.party2) + nonTaxableIncomeParty2();
      const party1Age = momentFunction.differenceBetweenNowAndThen(screen1.background.party1DateOfBirth);
      const party2Age = momentFunction.differenceBetweenNowAndThen(screen1.background.party2DateOfBirth);
      const yearsOfRelationship = momentFunction.differenceBetweenTwoDates(
        screen1.aboutTheRelationship.dateOfMarriage,
        screen1.aboutTheRelationship.dateOfSeparation
      );

      // When children are present the Python backend uses calculate_spousal_support_iterative
      // (the with-children SSAG formula) which converges SS ↔ taxes across ~6 iterations.
      // When children is empty it uses the without-children formula instead.
      // Either way gross income is the input — the backend handles tax computation internally.
      const childrenPayload = (screen1.aboutTheChildren.childrenInfo || []).map((child: any) => ({
        date_of_birth: momentFunction.formatDate(child.dateOfBirth, "YYYY-MM-DD"),
        custody_arrangement: child.custodyArrangement || "Party 1",
        child_has_disability: child.childHasDisability === "Yes",
      }));

      const spousalIterativeResult = await calcSpousalSupportFlask({
        party1_gross_income: party1GrossAnnual,
        party2_gross_income: party2GrossAnnual,
        party1_age: party1Age,
        recipient_age: party2Age,
        years: yearsOfRelationship,
        province: getProvinceOfParty1(),
        year: distinctYears?.selectedYear ?? new Date().getFullYear(),
        children: childrenPayload,
      });

      // Store in ref so passStateToParentAndNextPage uses Python values
      // instead of the local JS formula when building screen2.spousalSupport.
      if (spousalIterativeResult) {
        spousalSupportIterativeRef.current = spousalIterativeResult;

        // Store INDI (disposable income) values, mapping payor/recipient → party1/party2
        const payorIsParty1 = party1GrossAnnual >= party2GrossAnnual;
        if (payorIsParty1) {
          disposableIncomeRef.current = {
            party1Low: spousalIterativeResult.payor_indi_low ?? 0,
            party1Mid: spousalIterativeResult.payor_indi_mid ?? 0,
            party1High: spousalIterativeResult.payor_indi_high ?? 0,
            party2Low: spousalIterativeResult.recipient_indi_low ?? 0,
            party2Mid: spousalIterativeResult.recipient_indi_mid ?? 0,
            party2High: spousalIterativeResult.recipient_indi_high ?? 0,
          };
        } else {
          disposableIncomeRef.current = {
            party1Low: spousalIterativeResult.recipient_indi_low ?? 0,
            party1Mid: spousalIterativeResult.recipient_indi_mid ?? 0,
            party1High: spousalIterativeResult.recipient_indi_high ?? 0,
            party2Low: spousalIterativeResult.payor_indi_low ?? 0,
            party2Mid: spousalIterativeResult.payor_indi_mid ?? 0,
            party2High: spousalIterativeResult.payor_indi_high ?? 0,
          };
        }

        // Store taxes and benefits from API, mapping payor/recipient → party1/party2
        if (payorIsParty1) {
          taxesFromApiRef.current = {
            party1Low: spousalIterativeResult.payor_taxes_low ?? 0,
            party1Mid: spousalIterativeResult.payor_taxes_mid ?? 0,
            party1High: spousalIterativeResult.payor_taxes_high ?? 0,
            party2Low: spousalIterativeResult.recipient_taxes_low ?? 0,
            party2Mid: spousalIterativeResult.recipient_taxes_mid ?? 0,
            party2High: spousalIterativeResult.recipient_taxes_high ?? 0,
          };
          benefitsFromApiRef.current = {
            party1Low: spousalIterativeResult.payor_benefits_low ?? 0,
            party1Mid: spousalIterativeResult.payor_benefits_mid ?? 0,
            party1High: spousalIterativeResult.payor_benefits_high ?? 0,
            party2Low: spousalIterativeResult.recipient_benefits_low ?? 0,
            party2Mid: spousalIterativeResult.recipient_benefits_mid ?? 0,
            party2High: spousalIterativeResult.recipient_benefits_high ?? 0,
          };
        } else {
          taxesFromApiRef.current = {
            party1Low: spousalIterativeResult.recipient_taxes_low ?? 0,
            party1Mid: spousalIterativeResult.recipient_taxes_mid ?? 0,
            party1High: spousalIterativeResult.recipient_taxes_high ?? 0,
            party2Low: spousalIterativeResult.payor_taxes_low ?? 0,
            party2Mid: spousalIterativeResult.payor_taxes_mid ?? 0,
            party2High: spousalIterativeResult.payor_taxes_high ?? 0,
          };
          benefitsFromApiRef.current = {
            party1Low: spousalIterativeResult.recipient_benefits_low ?? 0,
            party1Mid: spousalIterativeResult.recipient_benefits_mid ?? 0,
            party1High: spousalIterativeResult.recipient_benefits_high ?? 0,
            party2Low: spousalIterativeResult.payor_benefits_low ?? 0,
            party2Mid: spousalIterativeResult.payor_benefits_mid ?? 0,
            party2High: spousalIterativeResult.payor_benefits_high ?? 0,
          };
        }
      }

      Cookies.set('demo_cal_data', JSON.stringify(objforApi), { path: '/' });

      const {data} = await fetchAllCalculatorDatawithTaxs(objforApi);

      // Overlay the iterative monthly amounts so Screen4 reads the Python values
      // via support_quantum_low/med/high rather than whatever /calculator returns.
      const apiDataWithIterative = {
        ...data,
        ...(spousalIterativeResult ? {
          support_quantum_low: spousalIterativeResult.monthly_low,
          support_quantum_med: spousalIterativeResult.monthly_mid,
          support_quantum_high: spousalIterativeResult.monthly_high,
          spousal_iterative: spousalIterativeResult,
        } : {}),
      };
      setAllApiDataCal(apiDataWithIterative);

      // console.log('checkDataExistence', data)

      const incomes = {
        totalIncomeParty1: party1GrossAnnual,
        totalIncomeParty2: party2GrossAnnual,
      };

      if (spousalIterativeResult) {
        // Python iterative API succeeded — set the report type for downstream
        // report generation but skip the JS spousal support calculation entirely.
        if (totalNumberOfChildren(screen1.aboutTheChildren) === 0) {
          typeOfReport.current = WITHOUT_CHILD_FORMULA;
        } else if (determineWhichPartyHasGreaterIncomeAndChild(screen1.aboutTheChildren, incomes)) {
          typeOfReport.current = ONLY_CHILD;
        } else if (totalNumberOfChildren(screen1.aboutTheChildren) > 0) {
          typeOfReport.current = CUSTODIAL_FORMULA;
        }
        assignValuesAfterAllCalculations();
        setShowCalculationCompleted(true);
        setShowSaveCalculatorValues(true);
      } else {
        // Python iterative API unreachable — show error modal instead of
        // silently falling back to the JS formula.
        setShowApiError(true);
      }
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
    return new Promise((resolve) => {
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

          fetchFederalDBValues(year, getProvinceOfParty1())
            .then(() => resolve(true))
            .catch(() => resolve(true));
        })
        .catch(() => {
          setDistinctYears({
            allYears: [{ year: 2025 }],
            selectedYear: 2025,
          });
          resolve(true);
        });
    });
  };

  const checkIfScreen1OptionsFilled = () => {
    if (
      screen1.background.party1DateOfBirth === "" ||
      screen1.background.party2DateOfBirth === "" ||
      getProvinceOfParty1() === "" ||
      getProvinceOfParty2() === ""
    ) {
      history.push(
        `${AUTH_ROUTES.API_CALCULATOR
        }?step=1`
      );
    }
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

    // console.log(
    //   "Enhanced CPP deductions",
    //   total,
    //   employedIncome10100Party2(),
    //   selfEmployedIncomeParty2(),
    //   fetchedDynamicValues
    // );

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

  const allValuesObjToStoreInDB = () => {
    const { label, description, savedBy } = storedCalculatorValues;

    const requiredValues = {
      sid: getUserSID(),
      label,
      description,
      status: "INPROGRESS",
      created_by: savedBy,
      type: typeOfReport.current,
      calculator_type: typeOfCalculatorSelected,
      id: getCalculatorIdFromQuery(calculatorId),
      report_url: " ",
    };

    const obj = {
      ...requiredValues,
      data: {
        income,
        undueHardshipIncome,
        otherhouseholdmember,
        nonTaxableincome,
        undueHardship,
        deductions,
        benefits,
        guidelineIncome,
        specialExpensesArr,
        aboutTheChildren: screen1.aboutTheChildren,
        background: screen1.background,
        aboutTheRelationship: screen1.aboutTheRelationship,
        tax_year: distinctYears.selectedYear,
        calculator_type: typeOfCalculatorSelected,
        canadaChildBenefitFixed: canadaChildBenefitFixed,
        provChildBenefitFixed: provChildBenefitFixed,
        GSTHSTBenefitFixed: GSTHSTBenefitFixed,
        ClimateActionBenefitFixed: ClimateActionBenefitFixed,
        salesTaxBenefitFixed: salesTaxBenefitFixed,
        basicPersonalAmountFederalFixed: basicPersonalAmountFederalFixed,
        basicPartyDisabilityFixed: basicPartyDisabilityFixed,
        basicPartyDisabilityProvFixed: basicPartyDisabilityProvFixed,
        amountForEligibleDependentFixed: amountForEligibleDependentFixed,
        baseCPPContributionFixed: baseCPPContributionFixed,
        eiPremiumFixed: eiPremiumFixed,
        canadaEmploymentAmountFixed: canadaEmploymentAmountFixed,
        basicPersonalAmountProvincialFixed: basicPersonalAmountProvincialFixed,
        amountForEligibleDependentProvincialFixed:
          amountForEligibleDependentProvincialFixed,
        disposableIncome: disposableIncomeRef.current,
        taxesFromApi: taxesFromApiRef.current,
        benefitsFromApi: benefitsFromApiRef.current,
      },
    };

    return obj;
  };

  const saveValuesToDB = async (obj: any) => {
    const data = await SaveAllCalculatorValuesByID(obj);

    if (data.status === "error") {
      setStoredCalculatorValues((prev) => ({
        ...prev,
        error: `Label name with ${prev.label} already exists. Please Change Label Name`,
      }));
    } else {
      setStoredCalculatorValues((prev) => ({
        ...prev,
        error: "",
      }));

      calculatorId.set("id", data.id);

      setShowSaveCalculatorValues(false);

      Cookies.set("calculatorId", JSON.stringify(data.id), { path: "/" });

      passStateToParentAndNextPage(data.id, true);
    }
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

  const resetSpecialExpenses = () => {
    specialExpensesRef.current = {
      party1: originalValues.specialExpenses.party1,
      party2: originalValues.specialExpenses.party2,
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

  const resetIncome = () => {
    setIncome({
      party1: originalValues.income.party1,
      party2: originalValues.income.party2,
    });
  };

  const resetDeductions = () => {
    setDeductions({
      party1: originalValues.deductions.party1,
      party2: originalValues.deductions.party2,
    });
  };

  const resetBenefits = () => {
    setBenefits({
      party1: originalValues.benefits.party1,
      party2: originalValues.benefits.party2,
    });
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

          // fetchChildSupportValues(year, province, "1,23,4").then((childSupportValues) => {
          //   console.log("values", childSupportValues);
          //   // setFetchedChildSupportValues(childSupportValues)
          //   resolve(true)
          // }).catch((err) => { console.log("err", err); reject(false) });

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
          console.log("checkratiokeyts", res)
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
    setLoading(true);
    determineAndSetTypeOfSplitting();
    fetchDistinctTaxYears().then(async (response) => {
      calculateDurationOfSupport();
      checkIfScreen1OptionsFilled();
      modifyScreen1PropIfChildIsAbove18();
      modifyScreen1PropsIfChildShared();
      await calculateChildSupport();

      setCount((prev: any) => prev + 1);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    syncUpSpecialExpensesWithBenefitAndDeduction();
  }, []);

  const duration_array = calculateDurationOfSupport();
  const durationofSupport = !(duration_array[0] > 100)
    ? Math.round((duration_array[0] + duration_array[1]) / 2)
    : 0;
  const spousalDuration = lumpsum.duration
    ? lumpsum.duration
    : duration_array[0] > 100
      ? CONSTANTS.canada_person_expected_life -
      momentFunction.calculateNumberOfYears(
        screen1.background.party2DateOfBirth
      )
      : durationofSupport;
  const InsurenceDuration = lifeInsurence.age_till_child_support_pay
    ? lifeInsurence.age_till_child_support_pay
    : 18 -
    momentFunction.calculateNumberOfYears(
      screen1?.aboutTheChildren?.childrenInfo[0]?.dateOfBirth
    );
  const spousalDurationonInsurence = lifeInsurence.duration
    ? lifeInsurence.duration
    : spousalDuration;

  const calculateNPV = (
    cashFlows: number,
    duration: number,
    discountrate: number
  ) => {
    let npv = 0;
    for (let t = 1; t <= duration; t++) {
      npv += cashFlows / Math.pow(1 + discountrate / 100, t);
    }
    return npv.toFixed(2);
  };

  // const { spousalSupport2Low, spousalSupport2Med, spousalSupport2High  , spousalSupport1Low, spousalSupport1Med, spousalSupport1High} = screen2?.spousalSupport;
  // const { party1High, party1Med, party1Low  , party2High, party2Med, party2Low} = screen2?.taxesWithSpecialExpenses;

  //party1:calculateTotalTaxes(1) party2: calculateTotalTaxes(2)

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

  function syncUpParty2SpecialExpenses(
    deductions: partyIncomeAndAmount[],
    value: string
  ) {
    const party2Details = deductions;

    const childCareSpecialExpenseIndex = party2Details.findIndex(
      (detail) => detail.value === value
    );
    if (childCareSpecialExpenseIndex !== -1) {
      const childCareExpenseFromSpecialExpense = party2Details.find(
        (detail) => detail.value === value
      )!;
      const party2DeductionDetails = specialExpensesArr.party2;
      const deductionIndex = party2DeductionDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (deductionIndex === -1) {
        const formattedIndex = party2DeductionDetails.length;
        party2DeductionDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setSpecialExpensesArr((prev: any) => {
          return { ...prev, party2: party2DeductionDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party2Details.find(
          (detail) => detail.value === value
        )!;
        const findExistingIndex = party2DeductionDetails.findIndex(
          (detail: any) => detail.value === value
        );
        party2DeductionDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setSpecialExpensesArr((prev: any) => {
          return { ...prev, party2: party2DeductionDetails };
        });
      }
    } else {
      const party2DeductionDetails = specialExpensesArr.party2;
      const deductionIndex = party2DeductionDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (deductionIndex !== -1) {
        party2DeductionDetails.splice(deductionIndex, 1);
        setSpecialExpensesArr((prev: any) => {
          return { ...prev, party2: party2DeductionDetails };
        });
      }
    }
  }

  function syncUpParty1SpecialExpenses(
    deductions: partyIncomeAndAmount[],
    value: string
  ) {
    const party1Details = deductions;

    const childCareSpecialExpenseIndex = party1Details.findIndex(
      (detail) => detail.value === value
    );
    if (childCareSpecialExpenseIndex !== -1) {
      const childCareExpenseFromSpecialExpense = party1Details.find(
        (detail) => detail.value === value
      )!;
      const party1DeductionDetails = specialExpensesArr.party1;
      const deductionIndex = party1DeductionDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (deductionIndex === -1) {
        const formattedIndex = party1DeductionDetails.length;
        party1DeductionDetails[formattedIndex] = {
          ...childCareExpenseFromSpecialExpense,
        };
        setSpecialExpensesArr((prev: any) => {
          return { ...prev, party1: party1DeductionDetails };
        });
      } else {
        const childCareExpenseFromSpecialExpense = party1Details.find(
          (detail) => detail.value === value
        )!;
        const findExistingIndex = party1DeductionDetails.findIndex(
          (detail: any) => detail.value === value
        );
        party1DeductionDetails[findExistingIndex]["amount"] =
          childCareExpenseFromSpecialExpense.amount;
        setSpecialExpensesArr((prev: any) => {
          return { ...prev, party1: party1DeductionDetails };
        });
      }
    } else {
      const party1DeductionDetails = specialExpensesArr.party1;
      const deductionIndex = party1DeductionDetails.findIndex(
        (detail: any) => detail.value === value
      );
      if (deductionIndex !== -1) {
        party1DeductionDetails.splice(deductionIndex, 1);
        setSpecialExpensesArr((prev: any) => {
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
            AllemployedIncomeParty1() * (2 / 3),
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
            AllemployedIncomeParty2() * (2 / 3),
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

  const deleteElementInGuidelineArray = (index: number, partyNum: number) => {
    const guidelineState =
      partyNum === 1
        ? [...guidelineIncome.party1]
        : [...guidelineIncome.party2];

    guidelineState.splice(index, 1);

    partyNum === 1
      ? setGuidelineIncome({ ...guidelineIncome, party1: guidelineState })
      : setGuidelineIncome({ ...guidelineIncome, party2: guidelineState });
  };

  const deleteElementInUndueHardshipArray = (index: number, partyNum: number) => {
    const undueHardshipState =

      partyNum === 1 ? [...undueHardshipIncome.party1] : [...undueHardshipIncome.party2];
    undueHardshipState.splice(index, 1);

    partyNum === 1
      ? setUndueHardshipIncome({ ...undueHardshipIncome, party1: undueHardshipState })
      : setUndueHardshipIncome({ ...undueHardshipIncome, party2: undueHardshipState });
  }

  const deleteElementInIncomeArray = (index: number, partyNum: number) => {
    const incomesState =
      partyNum === 1 ? [...income.party1] : [...income.party2];
    incomesState.splice(index, 1);

    const nontaxableState = partyNum === 1 ? [...nonTaxableincome.party1] : [...nonTaxableincome.party2];
    nontaxableState.splice(index, 1);

    partyNum === 1
      ? setIncome({ ...income, party1: incomesState })
      : setIncome({ ...income, party2: incomesState });

    partyNum === 1
      ? setNonTaxableincome({ ...nonTaxableincome, party1: nontaxableState })
      : setNonTaxableincome({ ...nonTaxableincome, party2: nontaxableState });

  };

  const deleteElementInDeductionsArray = (index: number, partyNum: number) => {
    const deductionsState =
      partyNum === 1 ? [...deductions.party1] : [...deductions.party2];

    deductionsState.splice(index, 1);
    partyNum === 1
      ? setDeductions({ ...deductions, party1: deductionsState })
      : setDeductions({ ...deductions, party2: deductionsState });

    if (partyNum === 2) {
      syncUpParty2SpecialExpenses(deductionsState, "21400");
    } else {
      syncUpParty1SpecialExpenses(deductionsState, "21400");
    }
  };

  const deleteElementInCreditsArray = (index: number, partyNum: number) => {
    const CreditsState =
      partyNum === 1 ? [...benefits.party1] : [...benefits.party2];

    CreditsState.splice(index, 1);
    partyNum === 1
      ? setBenefits({ ...benefits, party1: CreditsState })
      : setBenefits({ ...benefits, party2: CreditsState });

    if (partyNum === 2) {
      syncUpParty2SpecialExpenses(CreditsState, "33099");
      syncUpParty2SpecialExpenses(CreditsState, "32400");
      syncUpParty2SpecialExpenses(CreditsState, "32300");
    } else {
      syncUpParty1SpecialExpenses(CreditsState, "33099");
      syncUpParty1SpecialExpenses(CreditsState, "32400");
      syncUpParty1SpecialExpenses(CreditsState, "32300");
    }
  };

  const deleteElementInSpecialExpensesArray = (
    index: number,
    partyNum: number
  ) => {
    const SpecialExpensesState =
      partyNum === 1
        ? [...specialExpensesArr.party1]
        : [...specialExpensesArr.party2];

    SpecialExpensesState.splice(index, 1);
    partyNum === 1
      ? setSpecialExpensesArr({
        ...specialExpensesArr,
        party1: SpecialExpensesState,
      })
      : setSpecialExpensesArr({
        ...specialExpensesArr,
        party2: SpecialExpensesState,
      });

    if (partyNum === 2) {
      syncUpParty2Deduction(specialExpensesArr, "21400");
      syncUpParty2Benefit(specialExpensesArr, "33099");
      syncUpParty2Benefit(specialExpensesArr, "32400");
      syncUpParty2Benefit(specialExpensesArr, "32300");
    } else {
      syncUpParty1Deduction(specialExpensesArr, "21400");
      syncUpParty1Benefit(specialExpensesArr, "33099");
      syncUpParty1Benefit(specialExpensesArr, "32400");
      syncUpParty1Benefit(specialExpensesArr, "32300");
    }
  };

  const deleteElementInHouseholdMemberArray = (
    index: number,
    partyNum: number) => {



    const OtherhouseHoldmemberState =
      partyNum === 1
        ? [...otherhouseholdmember.party1]
        : [...otherhouseholdmember.party2];

    OtherhouseHoldmemberState.splice(index, 1);
    partyNum === 1
      ? setOtherHouseholdMember({
        ...otherhouseholdmember,
        party1: OtherhouseHoldmemberState,
      })
      : setOtherHouseholdMember({
        ...otherhouseholdmember,
        party2: OtherhouseHoldmemberState,
      });


  }

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
      disabilityCredits: 0,
      disabilityCreditsProv: 0,
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
      disabilityCredits: 0,
      disabilityCreditsProv: 0,
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

  const clearChildDisabilityBenefit = () => {
    childDisabilityBenefit.current = {
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
    clearChildDisabilityBenefit();
    // setSupportReceived({});
    clearSupportReceived();
    setShowCalculationCompleted(false);
  };

  const changeYearAndRefresh = (event: any) => {
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
        baseCPPContributionVal = baseCPPContribution(data, nonTaxableIncomeParty1());
      } else {
        baseCPPContributionVal = baseCPPContributionFixed.party1.value;
      }

      if (!eiPremiumFixed.party1.isFixed) {
        EIPremiumVal = EIPremiums(data, nonTaxableIncomeParty1());
        console.log("EIPremiumValchecking", EIPremiumVal)
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
        baseCPPContributionVal = baseCPPContribution(data, nonTaxableIncomeParty2());
        console.log("baseCPPContributionVal", baseCPPContributionVal)
      } else {
        baseCPPContributionVal = baseCPPContributionFixed.party2.value;
      }

      if (!eiPremiumFixed.party2.isFixed) {
        EIPremiumVal = EIPremiums(data, nonTaxableIncomeParty2());
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
        paramsForProvincialCredits(partyNum),
        partyNum == 1 ? nonTaxableIncomeParty1() : nonTaxableIncomeParty2()
      ),
    };

    // let val = {
    //   basicPersonalAmountFederal: basicPersonalAmountFederalVal,
    //   amountForEligibleDependent: amountForEligibleDependentVal,
    //   amountForEligibleDependentOntario: amountForEligibleDependentProvincialVal,
    //   EIPremiums: EIPremiumVal,
    //   canadaEmploymentAmount: canadaEmploymentAmountVal,
    //   basicPersonalAmountOntario: basicPersonalAmountProvincialVal,
    //   baseCPPContribution: baseCPPContributionVal,
    //   ageAmount: ageAmountFormula(data),
    //   totalFederalCredits: totalFederalCredits(data),
    //   totalOntarioCredits: totalOntarioCredits(data),
    // };

    return val;
  };

  const totalOntarioCredits = (data: any, nontaxableincome: number) => {
    // =SUM(F22:F23)+IF(F1>=65,MAX(5312-(F14-39546)*0.15,0),0)+F19+F20
    let result: number = 0;


    result += data.basicPersonalAmountOntario + data.amountForEligibleDependent;
    // basicPersonalAmountOntario(data) + amountForEligibleDependentOntario(data);

    if (data.ageForPerson >= 65) {
      result += Math.max(5312 - (data.taxableIncome - 39546) * 0.15, 0);
    }

    result += data.baseCPPContribution + data.eiPremiums;
    result += data.disabilityCreditsProv


    return result;
  };

  const changeFixedValues = (
    name:
      | "CCB"
      | "PCB"
      | "GST"
      | "CAI"
      | "STB"
      | "BPAF"
      | "AEDF"
      | "BCPPC"
      | "EIP"
      | "CEA"
      | "BPAP"
      | "AEDP",
    event: any,
    partyNum: number
  ) => {
    const purifyValue = Number(event.target.value.replace(/[$,]/g, ""));

    console.log("purifyValuefun>",purifyValue)

    switch (name) {
      //canada child benefit
      case "CCB":
        if (partyNum === 1) {
          childBenefit.current.party1 = purifyValue;
          setCanadaChildBenefitFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          childBenefit.current.party2 = purifyValue;
          setCanadaChildBenefitFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      //provincial child benefit
      case "PCB":
        if (partyNum === 1) {
          OntarioChildBenefit.current.party1 = purifyValue;
          setProvChildBenefitFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          OntarioChildBenefit.current.party2 = purifyValue;
          setProvChildBenefitFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "GST":
        if (partyNum === 1) {
          GSTHSTBenefit.current.party1 = purifyValue;
          setGSTHSTBenefitFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          GSTHSTBenefit.current.party2 = purifyValue;
          setGSTHSTBenefitFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "CAI":
        if (partyNum === 1) {
          climateChangeVal.current.party1 = purifyValue;

          setClimateActionBenefitFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          climateChangeVal.current.party2 = purifyValue;

          setClimateActionBenefitFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "STB":
        if (partyNum === 1) {
          ontarioSalesTax.current.party1 = purifyValue;

          setSalesTaxBenefitFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          ontarioSalesTax.current.party2 = purifyValue;

          setSalesTaxBenefitFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "BPAF":
        if (partyNum === 1) {
          allCreditsParty1.current.basicPersonalAmountFederal = purifyValue;

          setBasicPersonalAmountFederalFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          allCreditsParty2.current.basicPersonalAmountFederal = purifyValue;

          setBasicPersonalAmountFederalFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "AEDF":
        if (partyNum === 1) {
          allCreditsParty1.current.amountForEligibleDependent = purifyValue;

          setAmountForEligibleDependentFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          allCreditsParty2.current.amountForEligibleDependent = purifyValue;

          setAmountForEligibleDependentFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "BCPPC":
        if (partyNum === 1) {
          allCreditsParty1.current.baseCPPContribution = purifyValue;

          setBaseCPPContributionFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          allCreditsParty2.current.baseCPPContribution = purifyValue;

          setBaseCPPContributionFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "EIP":
        if (partyNum === 1) {
          allCreditsParty1.current.EIPremiums = purifyValue;

          setEiPremiumFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          allCreditsParty2.current.EIPremiums = purifyValue;

          setEiPremiumFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "CEA":
        if (partyNum === 1) {
          allCreditsParty1.current.canadaEmploymentAmount = purifyValue;

          setCanadaEmploymentAmountFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          allCreditsParty2.current.canadaEmploymentAmount = purifyValue;

          setCanadaEmploymentAmountFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "BPAP":
        if (partyNum === 1) {
          allCreditsParty1.current.basicPersonalAmountOntario = purifyValue;

          setBasicPersonalAmountProvincialFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          allCreditsParty2.current.basicPersonalAmountOntario = purifyValue;

          setBasicPersonalAmountProvincialFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      case "AEDP":
        if (partyNum === 1) {
          allCreditsParty1.current.amountForEligibleDependentOntario =
            purifyValue;

          setAmountForEligibleDependentProvincialFixed((prev: any) => ({
            ...prev,
            party1: { value: purifyValue, isFixed: true },
          }));
        } else {
          allCreditsParty2.current.amountForEligibleDependentOntario =
            purifyValue;

          setAmountForEligibleDependentProvincialFixed((prev: any) => ({
            ...prev,
            party2: { value: purifyValue, isFixed: true },
          }));
        }
        break;

      default:
        break;
    }
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
    let allvalues = [...income.party1, ...income.party2, ...nonTaxableincome.party1, ...nonTaxableincome.party2];

    let filternonEmptyarray = allvalues.filter((item) => {
      return item.label !== ''
    })

    //prev manditory work like this areAllIncomeTypeFilled([...income.party1 , ...income.party2])
    return areAllIncomeTypeFilled(filternonEmptyarray);
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

  const ApiErrorModal = () => {
    return (
      <ModalInputCenter
        heading="Calculation Failed"
        handleClick={() => setShowApiError(false)}
        changeShow={() => setShowApiError(false)}
        show={showApiError}
        action="Ok"
        cancelOption="Cancel"
      >
        <p className="heading-5">
          The spousal support calculation could not be completed. Please check your connection and try again.
        </p>
      </ModalInputCenter>
    );
  };

  const getvaluewithoutSpousalSupport = () => {

    settaxeswithAddSupport({
      party1: calculateTotalTaxes(1),
      party2: calculateTotalTaxes(2),
    });

    valueswithoutSpousalSupport.current.party2 = calculateTotalTaxes(2);
    valueswithoutSpousalSupport.current.party1 = calculateTotalTaxes(1);
  };

  useEffect(() => {
    if (!isNaN(calculateTotalTaxes(1)) || !isNaN(calculateTotalTaxes(2))) {
      if (!(calculateTotalTaxes(1) == 0) || !(calculateTotalTaxes(2) == 0))
        getvaluewithoutSpousalSupport();
    }
  }, [income]);




  useEffect(() => {
    sumAllBenefits(1);
    sumAllBenefits(2)
  }, [isCheckedSwitch]);

 



  const handleundueHardship = (e) => {
    const { checked, name } = e.target;
    setundueHardship((prev) => ({
      ...prev, [name]: checked
    }))
  }



  return (
    <>
      {/* <OverviewCal screen1={screen1} incomeDetails={{party1: totalIncomeByIncomeState(income.party1),party2: totalIncomeByIncomeState(income.party2),}}taxDetails={{ party1: 0, party2: 0 }}/> */}
      <Loader isLoading={loading} loadingMsg={"Calculating..."} />
      <div className="panel">
        <div className="row">
          <div className="col-md-7 divider">
            <div className="pHead">
              <span className="h5">
                {getSvg("Tax Year")}
                
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
              <div className="pHead pt-0">
                <span className="h5">
               
                  {getSvg("Income")}
                  Income
                </span>
              </div>
              <span className="text">
                Enter all recurring annual amount of income for both parties.
                This information can be found from the 'Total Income' page (line
                15000) of the respective parties' last T1 tax return.
              </span>
              <div className="row">
                <div className="col-md-6">
                  <span className="heading">{party1Name()}</span>

                  <CustomCheckbox
                    ChangeFun={handleundueHardship}
                    label={"Undue Hardship"}
                    checked={undueHardship.party1}
                    name="party1"

                  />
                  {/* <p>{tooltipmessage}</p> */}
                  {income.party1.map((e, index) => {

                    let nontaxamt = nonTaxableincome.party1[index]?.value;
                    let currentAmount;
                    if (nontaxamt === "14700") {
                      currentAmount = nonTaxableincome.party1[index]?.amount;
                    } else {
                      currentAmount = e.amount;
                    }

                    let nontaxamtDropdown = nonTaxableincome.party1[index]?.value;
                    let currentDropdown;
                    if (nontaxamtDropdown === "14700") {
                      currentDropdown = nonTaxableincome.party1[index]?.label;
                    } else {
                      currentDropdown = e.label;
                    }



                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                deleteElementInIncomeArray(index, 1)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          {e?.tooltip && (
                            <>
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="tooltip-left">
                                    {e?.tooltip}
                                  </Tooltip>
                                }
                              >
                                <span className="infoIcon">
                                  <InfoIcon
                                    fontSize="small"
                                    style={{ color: "grey" }}
                                  />
                                </span>
                              </OverlayTrigger>
                            </>
                          )}

                          <Dropdown
                            options={incomeTypeDropdown}
                            placeholder="Select Income Type"
                            onChange={(event: any) => {
                              const selectedOption = incomeTypeDropdown.find(
                                (option) => option.value === event.value
                              );

                              changeParty1Dropdown(selectedOption, index);
                              calculateAllOperationsForParty1();
                            }}
                            value={currentDropdown}
                          ></Dropdown>
                          <NumberFormat
                            value={currentAmount}
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
                            onBlur={() => {
                              calculateChildSupport();
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
                        totalIncomeByIncomeState(income.party1) +
                        totalIncomeByIncomeState(nonTaxableincome.party1)

                      )}
                    </span>
                    <a onClick={addIncomeToParty1}>+ Add Income</a>
                  </div>
                </div>
                <div className="col-md-6">
                  <span className="heading">{party2Name()}</span>

                  <CustomCheckbox
                    ChangeFun={handleundueHardship}
                    label={"Undue Hardship"}
                    checked={undueHardship.party2}
                    name="party2"

                  />

                  {income.party2.map((e, index) => {

                    let nontaxamt = nonTaxableincome.party2[index]?.value;
                    let currentAmount;
                    if (nontaxamt === "14700") {
                      currentAmount = nonTaxableincome.party2[index]?.amount;
                    } else {
                      currentAmount = e.amount;
                    }

                    let nontaxamtDropdown = nonTaxableincome.party2[index]?.value;
                    let currentDropdown;
                    if (nontaxamtDropdown === "14700") {
                      currentDropdown = nonTaxableincome.party2[index]?.label;
                    } else {
                      currentDropdown = e.label;
                    }



                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                deleteElementInIncomeArray(index, 2)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}

                          {e?.tooltip && (
                            <>
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="tooltip-left">
                                    {e?.tooltip}
                                  </Tooltip>
                                }
                              >
                                <span className="infoIcon">
                                  <InfoIcon
                                    fontSize="small"
                                    style={{ color: "grey" }}
                                  />
                                </span>
                              </OverlayTrigger>
                            </>
                          )}

                          <Dropdown
                            options={incomeTypeDropdown}
                            placeholder="Select Income Type"
                            onChange={(event: any) => {
                              const selectedOption = incomeTypeDropdown.find(
                                (option) => option.value === event.value
                              );

                              changeParty2Dropdown(selectedOption, index);
                              calculateAllOperationsForParty2();
                            }}
                            value={currentDropdown}
                          ></Dropdown>
                          <NumberFormat
                            value={currentAmount}
                            className="form-control"
                            inputMode="numeric"
                            defaultValue={0}
                            decimalScale={3}
                            thousandSeparator={true}
                            prefix={"$"}
                            onChange={(
                              e: React.SyntheticEvent<HTMLInputElement>
                            ) => {
                              changeParty2Amount(e, index);
                              calculateAllOperationsForParty1();
                              calculateAllOperationsForParty2();
                            }}
                            onBlur={() => {
                              calculateChildSupport();
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
                        totalIncomeByIncomeState(income.party2) +
                        totalIncomeByIncomeState(nonTaxableincome.party2)
                      )}
                    </span>
                    <a onClick={addIncomeToParty2}>+ Add Income</a>
                  </div>
                </div>
              </div>

              {/* conditional rendering for undue hardship --start */}
              {
                (undueHardship.party1 || undueHardship.party2) &&
                <>
                  <div className="pHead">
                    <span className="h5">
                      
                      {
                        getSvg('Undue Hardship')
                      }
                      Undue Hardship
                    </span>
                  </div>

                  <span className="text">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Harum saepe atque ullam repellat magni optio ducimus nostrum molestias ut,
                    laudantium hic officiis commodi. Tempora voluptatibus quaerat accusantium
                    nostrum repellendus harum.
                  </span>
                </>
              }


              <div className="row">
                <div className="col-md-6">
                  {
                    undueHardship.party1 && <>
                      {undueHardshipIncome.party1.map((e, index) => {
                        return (
                          <>
                            <div className="form-group">
                              {index > 0 && (
                                <span
                                  className="crossBtn"
                                  onClick={() =>
                                    deleteElementInUndueHardshipArray(index, 1)
                                  }
                                >
                                  <i className="fas fa-times"></i>
                                </span>
                              )}
                              {e?.tooltip && (
                                <>
                                  <OverlayTrigger
                                    placement="left"
                                    overlay={
                                      <Tooltip id="tooltip-left">
                                        {e?.tooltip}
                                      </Tooltip>
                                    }
                                  >
                                    <span className="infoIcon">
                                      <InfoIcon
                                        fontSize="small"
                                        style={{ color: "grey" }}
                                      />
                                    </span>
                                  </OverlayTrigger>
                                </>
                              )}

                              <Dropdown
                                options={undueHardshipIncomeTypeDropdown}
                                placeholder="Select Undue Hardship Type "
                                onChange={(event) => {
                                  const selectedOption =
                                    undueHardshipIncomeTypeDropdown.find(
                                      (option) => option.value === event.value
                                    );
                                  changeParty1undueHardshipDropdown(
                                    selectedOption,
                                    index
                                  );
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
                                  changeParty1undueHardshipIncomeAmount(e, index);
                                }}
                                onBlur={() => {
                                  calculateAllOperationsForParty1();
                                  calculateAllOperationsForParty2();
                                  calculateChildSupport();
                                }}
                              />
                            </div>
                          </>
                        );
                      })}
                      <div className="addBtn">
                        <span>
                          Total:{" "}
                          {formatNumber(
                            totalIncomeByIncomeState(undueHardshipIncome.party1)
                          )}
                        </span>
                        <a onClick={addundueHardshipIncomeToParty1}>
                          + Add Adjustment Income
                        </a>
                      </div>
                    </>
                  }

                </div>

                <div className="col-md-6">
                  {
                    undueHardship.party2 && <>
                      {undueHardshipIncome.party2.map((e, index) => {
                        return (
                          <>
                            <div className="form-group">
                              {index > 0 && (
                                <span
                                  className="crossBtn"
                                  onClick={() =>
                                    deleteElementInUndueHardshipArray(index, 2)
                                  }
                                >
                                  <i className="fas fa-times"></i>
                                </span>
                              )}

                              {e?.tooltip && (
                                <>
                                  <OverlayTrigger
                                    placement="left"
                                    overlay={
                                      <Tooltip id="tooltip-left">
                                        {e?.tooltip}
                                      </Tooltip>
                                    }
                                  >
                                    <span className="infoIcon">
                                      <InfoIcon
                                        fontSize="small"
                                        style={{ color: "grey" }}
                                      />
                                    </span>
                                  </OverlayTrigger>
                                </>
                              )}

                              <Dropdown
                                options={undueHardshipIncomeTypeDropdown}
                                placeholder="Select Undue Hardship Type "
                                onChange={(event) => {
                                  const selectedOption =
                                    undueHardshipIncomeTypeDropdown.find(
                                      (option) => option.value === event.value
                                    );
                                  changeParty2undueHardshipDropdown(
                                    selectedOption,
                                    index
                                  );
                                  calculateAllOperationsForParty2();
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
                                  changeParty2undueHardshipIncomeAmount(e, index);
                                }}
                                onBlur={() => {
                                  calculateAllOperationsForParty1();
                                  calculateAllOperationsForParty2();
                                  calculateChildSupport();
                                }}
                              />
                            </div>
                          </>
                        );
                      })}
                      <div className="addBtn">
                        <span>
                          Total:{" "}
                          {formatNumber(
                            totalIncomeByIncomeState(undueHardshipIncome.party2)
                          )}
                        </span>
                        <a onClick={addundueHardshipIncomeToParty2}>
                          + Add Adjustment Income
                        </a>
                      </div>
                    </>
                  }
                </div>
              </div>

              {/* conditional rendering for undue hardship end-- */}

              {showSaveCalculatorValues && (
                <ModalInputCenter
                  show={showSaveCalculatorValues}
                  heading="Do you want to save your progress"
                  action="Save and Next"
                  size="md"
                  optionalWidth={false}
                  cancelOption="Don't Save and Next"
                  changeShow={() =>
                    passStateToParentAndNextPage(
                      Number(getCalculatorIdFromQuery(calculatorId)),
                      false
                    )
                  }
                  handleClick={() => {
                    const { label, description, savedBy } =
                      storedCalculatorValues;

                    if (label && description && savedBy) {
                      Cookies.set(
                        "calculatorLabel",
                        JSON.stringify(storedCalculatorValues),
                        { path: "/" }
                      );
                      saveValuesToDB(allValuesObjToStoreInDB());
                    } else if (!label || !description || !savedBy) {
                      setStoredCalculatorValues((prev) => ({
                        ...prev,
                        error: "Please Fill all the values",
                      }));
                    }
                  }}
                >
                  <>
                    <InputCustom
                      type="text"
                      margin="1.8rem 0rem"
                      label="Name"
                      disabled={getCalculatorIdFromQuery(calculatorId)}
                      value={storedCalculatorValues.label}
                      handleChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) => {
                        setStoredCalculatorValues((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }));
                        setBackground({ label: e.target.value });
                      }}
                    />
                    <InputCustom
                      type="text"
                      margin="1.8rem 0rem"
                      label="Client Name"
                      disabled={getCalculatorIdFromQuery(calculatorId)}
                      value={storedCalculatorValues.description}
                      handleChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStoredCalculatorValues((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                    <InputCustom
                      type="text"
                      margin="1.8rem 0rem"
                      label="Saved By"
                      disabled={true}
                      value={storedCalculatorValues.savedBy}
                      handleChange={() =>
                        setStoredCalculatorValues((prev) => ({
                          ...prev,
                          savedBy: getAllUserInfo().username,
                        }))
                      }
                    />
                    {storedCalculatorValues.error && (
                      <div className="heading-5 text-danger">
                        {storedCalculatorValues.error}
                      </div>
                    )}
                  </>
                </ModalInputCenter>
              )}
              <div className="pHead">
                <span className="h5">
                  {getSvg('Adjustment to Total Income')}
                  Adjustment to Total Income
                </span>
              </div>
              <span className="text">
                Adjustments to Total Income may be required to calculate
                support. Schedule III of the Child Support Guidelines lists most
                of the adjustments.
              </span>
              <div className="row">
                <div className="col-md-6">
                  {guidelineIncome.party1.map((e, index) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                deleteElementInGuidelineArray(index, 1)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          {e?.tooltip && (
                            <>
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="tooltip-left">
                                    {e?.tooltip}
                                  </Tooltip>
                                }
                              >
                                <span className="infoIcon">
                                  <InfoIcon
                                    fontSize="small"
                                    style={{ color: "grey" }}
                                  />
                                </span>
                              </OverlayTrigger>
                            </>
                          )}

                          <Dropdown
                            options={guidelineIncomeTypeDropdown}
                            placeholder="Select Adjustment Income Type"
                            onChange={(event) => {
                              const selectedOption =
                                guidelineIncomeTypeDropdown.find(
                                  (option) => option.value === event.value
                                );
                              changeParty1GuidelineDropdown(
                                selectedOption,
                                index
                              );
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
                              changeParty1GuidelineIncomeAmount(e, index);
                            }}
                            onBlur={() => {
                              calculateAllOperationsForParty1();
                              calculateAllOperationsForParty2();
                              calculateChildSupport();
                            }}
                          />
                        </div>
                      </>
                    );
                  })}
                  <div className="addBtn">
                    <span>
                      Total:{" "}
                      {formatNumber(
                        totalIncomeByIncomeState(guidelineIncome.party1)
                      )}
                    </span>
                    <a onClick={addGuidelineIncomeToParty1}>
                      + Add Adjustment Income
                    </a>
                  </div>
                </div>
                <div className="col-md-6">
                  {guidelineIncome.party2.map((e, index) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                deleteElementInGuidelineArray(index, 2)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}

                          {e?.tooltip && (
                            <>
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="tooltip-left">
                                    {e?.tooltip}
                                  </Tooltip>
                                }
                              >
                                <span className="infoIcon">
                                  <InfoIcon
                                    fontSize="small"
                                    style={{ color: "grey" }}
                                  />
                                </span>
                              </OverlayTrigger>
                            </>
                          )}

                          <Dropdown
                            options={guidelineIncomeTypeDropdown}
                            placeholder="Select Adjustment Income Type"
                            onChange={(event: Option) => {
                              const selectedOption =
                                guidelineIncomeTypeDropdown.find(
                                  (option) => option.value === event.value
                                );

                              changeParty2GuidelineDropdown(
                                selectedOption,
                                index
                              );
                              calculateAllOperationsForParty2();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.amount}
                            inputMode="numeric"
                            defaultValue={0}
                            decimalScale={3}
                            thousandSeparator={true}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty2GuidelineIncomeAmount(e, index);
                            }}
                            onBlur={() => {
                              calculateAllOperationsForParty2();
                              calculateAllOperationsForParty1();
                              calculateChildSupport();
                            }}
                          />
                        </div>
                      </>
                    );
                  })}
                  <div className="addBtn">
                    <span>
                      Total:{" "}
                      {formatNumber(
                        totalIncomeByIncomeState(guidelineIncome.party2)
                      )}
                    </span>
                    <a onClick={addGuidelineIncomeToParty2}>
                      + Add Adjustment Income
                    </a>
                  </div>
                </div>
              </div>
              <span className="pHead">
                <span className="h5">
                  {getSvg('Special Expenses')}
                  Special Expenses
                </span>
              </span>
              <span className="text">
                Enter the total annual amount of all special child-related
                expenses. These expenses will be apportioned based on the income
                of each party to get the s7 child special expenses support
              </span>
              {showAlertFillAllDetails && AlertFillAllDetails()}
              {showApiError && ApiErrorModal()}
              <div className="row">
                <div className="col-md-6">
                  {specialExpensesArr.party1.map((e: any, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() => {
                                deleteElementInSpecialExpensesArray(index, 1);
                                calculateAllOperationsForParty1();
                                calculateAllOperationsForParty2();
                                calculateChildSupport();
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}

                          {e?.tooltip && (
                            <>
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="tooltip-left">
                                    {e?.tooltip}
                                  </Tooltip>
                                }
                              >
                                <span className="infoIcon">
                                  <InfoIcon
                                    fontSize="small"
                                    style={{ color: "grey" }}
                                  />
                                </span>
                              </OverlayTrigger>
                            </>
                          )}

                          <Dropdown
                            options={specialExpensesDropdown}
                            placeholder="Select Special Expenses Type"
                            onChange={(event) => {
                              const selectedOption =
                                specialExpensesDropdown.find(
                                  (option) => option.value === event.value
                                );

                              changeParty1SpecialExpensesDropdown(
                                selectedOption,
                                index
                              );
                              calculateAllOperationsForParty1();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.amount}
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty1SpecialExpensesAmount(e, index);
                            }}
                            onBlur={() => {
                              calculateAllOperationsForParty1();
                              calculateAllOperationsForParty2();
                              calculateChildSupport();
                            }}
                          />
                          {screen1 && screen1?.aboutTheChildren?.childrenInfo && (
                            <Dropdown
                              options={screen1?.aboutTheChildren?.childrenInfo?.map(
                                (child) => ({
                                  label: child.name,
                                  value: child.name,
                                })
                              )}
                              placeholder="Select Child"
                              onChange={(event) => {
                                changeParty1SpecialExpensesDropdown(
                                  event,
                                  index
                                );
                                calculateAllOperationsForParty1();
                              }}
                              value={e.child}
                            ></Dropdown>
                          )}
                        </div>
                      </>
                    );
                  })}
                  <div className="addBtn">
                    <span>
                      Total:{" "}
                      {formatNumber(
                        totalIncomeByIncomeState(specialExpensesArr.party1)
                      )}
                    </span>
                    <a onClick={addSpecialExpensesToParty1}>
                      + Add Special Expenses
                    </a>
                  </div>
                </div>
                <div className="col-md-6">
                  {specialExpensesArr.party2.map((e, index) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() => {
                                deleteElementInSpecialExpensesArray(index, 2);
                                calculateAllOperationsForParty1();
                                calculateAllOperationsForParty2();
                                calculateChildSupport();
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}

                          {e?.tooltip && (
                            <>
                              <OverlayTrigger
                                placement="left"
                                overlay={
                                  <Tooltip id="tooltip-left">
                                    {e?.tooltip}
                                  </Tooltip>
                                }
                              >
                                <span className="infoIcon">
                                  <InfoIcon
                                    fontSize="small"
                                    style={{ color: "grey" }}
                                  />
                                </span>
                              </OverlayTrigger>
                            </>
                          )}


                          <Dropdown
                            options={specialExpensesDropdown}
                            placeholder="Select Special Expenses Type"
                            onChange={(event) => {
                              const selectedOption =
                                specialExpensesDropdown.find(
                                  (option) => option.value === event.value
                                );

                              changeParty2SpecialExpensesDropdown(
                                selectedOption,
                                index
                              );
                              calculateAllOperationsForParty2();
                            }}
                            value={e.label}
                          ></Dropdown>

                          <NumberFormat
                            className="form-control"
                            value={e.amount}
                            inputMode="numeric"
                            defaultValue={0}
                            decimalScale={3}
                            thousandSeparator={true}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty2SpecialExpensesAmount(e, index);
                            }}
                            onBlur={() => {
                              calculateAllOperationsForParty2();
                              calculateAllOperationsForParty1();
                              calculateChildSupport();
                            }}
                          />


                          {screen1 && screen1?.aboutTheChildren?.childrenInfo && (
                            <Dropdown
                              options={screen1?.aboutTheChildren?.childrenInfo?.map(
                                (child) => ({
                                  label: child.name,
                                  value: child.name,
                                })
                              )}

                              placeholder="Select Child"
                              onChange={(event) => {
                                changeParty2SpecialExpensesDropdown(
                                  event,
                                  index
                                );
                                calculateAllOperationsForParty2();
                              }}
                              value={e.child}
                            ></Dropdown>
                          )}
                        </div>
                      </>
                    );
                  })}
                  <div className="addBtn">
                    <span>
                      Total:{" "}
                      {formatNumber(
                        totalIncomeByIncomeState(specialExpensesArr.party2)
                      )}
                    </span>
                    <a onClick={addSpecialExpensesToParty2}>
                      + Add Special Expenses
                    </a>
                  </div>
                </div>
              </div>

              
                {
                  (undueHardship.party1 || undueHardship.party2) && 
                  <>
                  <div className="pHead">
                  <span className="h5">
                  
                    {getSvg('Other household member')}
                    Other household member
                  </span>
                </div>
                <span className="text">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae debitis cum, adipisci nostrum asperiores officia earum sequi aspernatur tenetur maxime eius eligendi pariatur laborum ad rerum delectus, vero provident soluta.
                </span>
                </>

                  
              }
            
             


              <div className="row">

                <div className="col-md-6">
                  {
                    console.log("checkinmapotherhouseholdmember",otherhouseholdmember.party1)
                  }
                {
                  
                    undueHardship.party1 &&
                    <>
                     {otherhouseholdmember.party1.map((e: any, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() => {
                                deleteElementInHouseholdMemberArray(index, 1);
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}



                          <Dropdown
                            placeholder="Income"
                            disabled
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.income}
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty1otherHouseHoldMemberIncomeAmount(e, index);
                            }}

                        


                          />

                          <Dropdown
                            placeholder="Deduction from income"
                            disabled
                            className="mt-2"
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.deductionIncome}
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty1otherHouseHoldMemberDeductionAmount(e, index);
                            }}

                          
                          />

                          <Dropdown
                            placeholder="Adjustment to income"
                            disabled
                            className="mt-2"
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.AdjustmentIncome}
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty1otherHouseHoldMemberAdditionAmount(e, index);
                            }}

                          />



                        </div>
                      </>
                    );
                  })}

                  <div className="addBtn">
                    {/* <span>
                      Total:{" "}
                      {formatNumber(
                        totalIncomeByIncomeState(specialExpensesArr.party1)
                      )}
                    </span> */}
                    <a onClick={addAnotherHouseHoldMemberParty1}>
                      + Add Another Household Member
                    </a>
                  </div>
                    </>
                    }
                 


                </div>


                <div className="col-md-6">
                {
                    undueHardship.party2 &&
                    <>
                      {otherhouseholdmember.party2.map((e: any, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() => {
                                deleteElementInHouseholdMemberArray(index, 2);
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}



                          <Dropdown
                            placeholder="Income"
                            disabled
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.income}
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty2otherHouseHoldMemberIncomeAmount(e, index);
                            }}

                          />

                          <Dropdown
                            placeholder="Deduction from income"
                            disabled
                            className="mt-2"
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.deductionIncome}
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty2otherHouseHoldMemberDeductionAmount(e, index);
                            }}


                           
                          />

                          <Dropdown
                            placeholder="Adjustment to income"
                            disabled
                            className="mt-2"
                          ></Dropdown>
                          <NumberFormat
                            className="form-control"
                            value={e.AdjustmentIncome}
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            onChange={(e) => {
                              changeParty2otherHouseHoldMemberAdditionAmount(e, index);
                            }}
                            

                          />



                        </div>
                      </>
                    );
                  })}

                  <div className="addBtn">
                    {/* <span>
                      Total:{" "}
                      {formatNumber(
                        totalIncomeByIncomeState(specialExpensesArr.party1)
                      )}
                    </span> */}
                    <a onClick={addAnotherHouseHoldMemberParty2}>
                      + Add Another Household Member
                    </a>
                  </div>
                    </>

                }
                


                </div>

              </div>

            </div>
          </div>
          <div className="col-md-5">
            <div className="pHead">
              <span className="h5">
               
                {getSvg("Review")}
                Review
              </span>
            </div>
            <div className="pBody">
              <span className="text">
                The calculator automatically calculates the credits and benefits
                you and your spouse are likely to receive. Add or override any
                credits, deductions or benefits that are not automatically
                calculated below
              </span>
              <Table className="reviewGrid">



                <RenderCalculationValues
                  data={{
                    income,
                    isCheckedSwitch,
                    setIsCheckedSwitch,
                    deductions,
                    benefits,
                    supportReceived,
                    benefitsForParties,
                    addFedBenefitsToParty1,
                    addFedBenefitsToParty2,
                    addProvBenefitsToParty1,
                    addProvBenefitsToParty2,
                    deleteProvBenefits,
                    deleteFedBenefits,
                    changeFedBenefitsDropdown,
                    changeProvBenefitsDropdown,
                    changeFedDeductionAmount,
                    changeProvDeductionAmount,
                    totaltaxes1: calculateTotalTaxes(1),
                    totaltaxes2: calculateTotalTaxes(2),
                    federalTax: federalTax.current,
                    totalDeduction: {
                      party1: getTotalDeductionsParty1(),
                      party2: getTotalDeductionsParty2(),
                    },
                    specialExpensesArr,
                    calculateCPPandELDeductionsForEmployed: {
                      party1: calculateCPPandELDeductionsForEmployed(1),
                      party2: calculateCPPandELDeductionsForEmployed(2),
                    },
                    calculateCPPandEIDeductionsForSelfEmployed: {
                      party1: calculateCPPandEIDeductionsForSelfEmployed(1),
                      party2: calculateCPPandEIDeductionsForSelfEmployed(2),
                    },
                    party1Name,
                    party2Name,
                    enhancedCPPDeduction: enhancedCPPDeduction.current,
                    childBenefit: childBenefit.current,
                    childDisabilityBenefit: childDisabilityBenefit.current,
                    allCreditsParty1: allCreditsParty1.current,
                    allCreditsParty2: allCreditsParty2.current,
                    ontarioSalesTax: ontarioSalesTax.current,
                    OntarioChildBenefit: OntarioChildBenefit.current,
                    GSTHSTBenefit: GSTHSTBenefit.current,
                    provincialTax: provincialTax.current,
                    employedIncome10100Party1,
                    employedIncome10100Party2,
                    AllemployedIncomeParty1,
                    AllemployedIncomeParty2,
                    nonTaxableIncomeParty1,
                    nonTaxableIncomeParty2,
                    selfEmployedIncomeParty1,
                    selfEmployedIncomeParty2,
                    formatNumberInThousands,
                    totalIncomeByIncomeState,
                    filterNegativeValuesAndSum,
                    filterPositiveValuesAndSum,
                    changeFixedValues,
                    screen1: screen1,
                    limitValueForChildExpenses,
                    getChildCareExpensesDeductionParty1:
                      filterChildCareExpensesAndSum(deductions.party1),
                    getChildCareExpensesDeductionParty2:
                      filterChildCareExpensesAndSum(deductions.party2),
                    getTotalDeductionsParty1,
                    getTotalDeductionsParty2,
                    getProvinceOfParty1,
                    sumAllBenefits,
                    guidelineIncome,
                    formatNumber,
                    calculateAllOperationsForParty1,
                    calculateAllOperationsForParty2,
                    changeParty1DeductionAmount,
                    changeParty2DeductionAmount,
                    changeParty1DeductionsDropdown,
                    changeParty2DeductionsDropdown,
                    calculateChildSupport,
                    addDeductionsToParty1,
                    addDeductionsToParty2,
                    deleteElementInDeductionsArray,
                    deleteElementInCreditsArray,
                    changeParty1BenefitsDropdown,
                    changeParty2BenefitsDropdown,
                    changeParty1BenefitsAmount,
                    changeParty2BenefitsAmount,
                    addCreditsToParty1,
                    addCreditsToParty2,
                    climateChangeVal: climateChangeVal.current,
                    canadaWorkersBenefitTax: canadaWorkersBenefitTax.current,
                    totalFederalCredits: {
                      party1: allCreditsParty1.current.totalFederalCredits,
                      party2: allCreditsParty2.current.totalFederalCredits,
                    },
                    totalCredits: {
                      party1: allCreditsParty1.current.totalOntarioCredits,
                      party2: allCreditsParty2.current.totalOntarioCredits,
                    },
                  }}
                />
              </Table>
            </div>
          </div>
        </div>
      </div>
      <div className="btnGroup">
        <button
          className="btn btnPrimary rounded-pill"
          onClick={() =>
            history.push(
              `${AUTH_ROUTES.API_CALCULATOR}?id=${getCalculatorIdFromQuery(
                  calculatorId
                )}&step=1`
            )
          }
        >
          Back
        </button>
        <button
          disabled={loading || showCalculationCompleted}
          className={`btn btnPrimary rounded-pill ${loading || showCalculationCompleted ? "disabled" : ""
            }`}
          onClick={() => {
            calculateChildAndSpousalSupportAuto();
          }}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default Screen2;

class Column {
  constructor(
    public label: string,
    public party1: number | string,
    public party2: number | string,
    public Tolltip?: string,
    public isNumber = true,


  ) { }
}

class BenefitColumn {
  constructor(
    public label: string,
    public party1: number | string,
    public party2: number | string,
    public party1type: number | string,
    public party2type: number | string,
    public isCheckedSwitchParty1: boolean,
    public isCheckedSwitchParty2: boolean,
    public setIsCheckedSwitch: any,
    public nameparty1: string,
    public nameparty2: string,
    public Tolltip?: string,
    public isNumber = true,

  ) { }
}

const RenderCalculationValues = ({ data }: { data: any }) => {
  const [popup, setPopup] = useState({
    deductions: false,
    credits: false,
    benefits: false,
  });


  const onDeductionsAdd = () => {
    setPopup((prev) => ({ ...prev, deductions: !prev.deductions }));
  };

  const onCreditsAdd = () => {
    setPopup((prev) => ({ ...prev, credits: !prev.credits }));
  };

  const onBenefitsAdd = () => {
    setPopup((prev) => ({ ...prev, benefits: !prev.benefits }));
  };

  const incomeData = [
    new Column(
      "Employment Income",
      data.employedIncome10100Party1(),
      data.employedIncome10100Party2()
    ),

    new Column(
      "Non Taxable Income",
      data.nonTaxableIncomeParty1(),
      data.nonTaxableIncomeParty2()
    ),

    new Column(
      "Self Employment Income",
      data.selfEmployedIncomeParty1(),
      data.selfEmployedIncomeParty2()
    ),
  ];

  const Adjustments = [
    new Column(
      "Total Guideline Income",
      formatNumber(
        data.filterPositiveValuesAndSum(data.guidelineIncome.party1) +
        data.filterNegativeValuesAndSum(data.guidelineIncome.party1) +
        data.employedIncome10100Party1() +
        data.selfEmployedIncomeParty1()
      ),
      formatNumber(
        data.filterPositiveValuesAndSum(data.guidelineIncome.party2) +
        data.filterNegativeValuesAndSum(data.guidelineIncome.party2) +
        data.employedIncome10100Party2() +
        data.selfEmployedIncomeParty2()
      )
    ),
  ];

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
        limitChildExpense(ce.amount, data.screen1.aboutTheChildren, ce?.child)
      )
      .reduce((acc, sum) => acc + parseInt(sum), 0);

    return accumulateAndSum;
  }

  const Deductions = [
    new Column(
      "Enhanced CPP Deduction",
      data.enhancedCPPDeduction.party1,
      data.enhancedCPPDeduction.party2
    ),

    new Column(
      "Total Deductions",
      data.totalDeduction.party1,
      data.totalDeduction.party2
    ),

    // commented by clients feedback. You can use it to match the values with excel but do not deploy on application.

    new Column(
      "Child Care Expenses",
      Math.min(
        data.AllemployedIncomeParty1() * (2 / 3),
        capAndAccumulateChildExpense(data.deductions.party1)
      ),
      Math.min(
        data.AllemployedIncomeParty2() * (2 / 3),
        capAndAccumulateChildExpense(data.deductions.party2)
      )
    ),

    // new Column(
    //   "Special Expenses",
    //   data.totalIncomeByIncomeState(data.specialExpensesArr.party1),
    //   data.totalIncomeByIncomeState(data.specialExpensesArr.party2)
    // ),

    // new Column("Federal Tax", data.federalTax.party1, data.federalTax.party2),

    // new Column(
    //   "Provincial Tax",
    //   data.provincialTax.party1,
    //   data.provincialTax.party2
    // ),

    // new Column(
    //   "Support Received",
    //   data.supportReceived.party1,
    //   data.supportReceived.party2
    // ),

    // new Column(
    //   "Canada workers benefits",
    //   formatNumber(-Math.abs(data.canadaWorkersBenefitTax.party1)),
    //   formatNumber(-Math.abs(data.canadaWorkersBenefitTax.party2))
    // ),

    // new Column(
    //   "CPP and EI deduction For Employed",
    //   data.calculateCPPandELDeductionsForEmployed.party1,
    //   data.calculateCPPandELDeductionsForEmployed.party2
    // ),

    // new Column(
    //   "CPP and EI deduction For Employed",
    //   data.calculateCPPandEIDeductionsForSelfEmployed.party1,
    //   data.calculateCPPandEIDeductionsForSelfEmployed.party2
    // ),

    // new Column(
    //   "Total Taxes and Deductions",
    //   data.totaltaxes1,
    //   data.totaltaxes2
    // ),

    // new Column(
    //   "Total Federal Credits",
    //   data.totalFederalCredits.party1,
    //   data.totalFederalCredits.party2
    // ),

    // new Column(
    //   "Total Credits",
    //   data.totalCredits.party1,
    //   data.totalCredits.party2
    // ),
  ];

  const Credits = [
    new Column(
      "Basic personal amount - Federal",
      Number(data.allCreditsParty1.basicPersonalAmountFederal),
      Number(data.allCreditsParty2.basicPersonalAmountFederal),
      CONSTANTS.Basic_personal_amount
    ),

    new Column(
      "Age amount",
      data.allCreditsParty1.ageAmount,
      data.allCreditsParty2.ageAmount,
      CONSTANTS.Age_Amount
    ),

    new Column(
      "Disability Credit-Federal",
      Number(data.allCreditsParty1.disabilityCredits),
      Number(data.allCreditsParty2.disabilityCredits)
    ),

    new Column(
      `Disability Credit-${data.getProvinceOfParty1()}`,
      Number(data.allCreditsParty1.disabilityCreditsProv),
      Number(data.allCreditsParty2.disabilityCreditsProv)
    ),

    new Column(
      "Amount for eligible dependent",
      Number(data.allCreditsParty1.amountForEligibleDependent),
      Number(data.allCreditsParty2.amountForEligibleDependent),
      CONSTANTS.Eligible_dependant_18_years_of_age_or_older
    ),

    new Column(
      "Base CPP Contribution",
      Number(data.allCreditsParty1.baseCPPContribution),
      Number(data.allCreditsParty2.baseCPPContribution)
    ),

    new Column(
      "EI Premium",
      Number(data.allCreditsParty1.EIPremiums),
      Number(data.allCreditsParty2.EIPremiums)
    ),

    new Column(
      "Canada Employment Amount",
      data.allCreditsParty1.canadaEmploymentAmount,
      data.allCreditsParty2.canadaEmploymentAmount
    ),

    new Column(
      `Basic personal amount - ${data.getProvinceOfParty1()}`,
      Number(data.allCreditsParty1.basicPersonalAmountOntario),
      Number(data.allCreditsParty2.basicPersonalAmountOntario)
    ),

    new Column(
      `Amount for Eligible dependent - ${data.getProvinceOfParty1()}`,
      Number(data.allCreditsParty1.amountForEligibleDependentOntario),
      Number(data.allCreditsParty2.amountForEligibleDependentOntario)
    ),
  ];

  const Benefits = [
    new BenefitColumn(
      "Canada Child benefit",
      Number(data.childBenefit.party1),
      Number(data.childBenefit.party2),
      "checkbox",
      "checkbox",
      data.isCheckedSwitch.Canada_Child_benefit_party1,
      data.isCheckedSwitch.Canada_Child_benefit_party2,
      data.setIsCheckedSwitch,
      "Canada_Child_benefit_party1",
      "Canada_Child_benefit_party2",
      CONSTANTS.Canada_Child_Benefits
    ),

    new BenefitColumn(
      "GST/HST Benefit",
      data.GSTHSTBenefit.party1,
      data.GSTHSTBenefit.party2,
      "checkbox",
      "checkbox",
      data.isCheckedSwitch.GST_HST_Benefit_party1,
      data.isCheckedSwitch.GST_HST_Benefit_party2,
      data.setIsCheckedSwitch,
      "GST_HST_Benefit_party1",
      "GST_HST_Benefit_party2",
      CONSTANTS.GSTHST_Benefits
    ),

    new BenefitColumn(
      `${data.getProvinceOfParty1()} Child benefit `,
      Number(data.OntarioChildBenefit.party1),
      Number(data.OntarioChildBenefit.party2),
      "checkbox",
      "checkbox",
      data.isCheckedSwitch.PROV_Child_benefit_party1,
      data.isCheckedSwitch.PROV_Child_benefit_party2,
      data.setIsCheckedSwitch,
      "PROV_Child_benefit_party1",
      "PROV_Child_benefit_party2",

      data.getProvinceOfParty1() == "ON"
        ? CONSTANTS.Ontario_Child_Benefit
        : CONSTANTS.Ontario_Child_Benefit
    ),

    new BenefitColumn(
      `${data.getProvinceOfParty1()} Climate action incentive`,
      data.climateChangeVal.party1,
      data.climateChangeVal.party2,
      "checkbox", "checkbox",
      data.isCheckedSwitch.PROV_Climate_Action_Incentive_party1,
      data.isCheckedSwitch.PROV_Climate_Action_Incentive_party2,
      data.setIsCheckedSwitch,
      "PROV_Climate_Action_Incentive_party1",
      "PROV_Climate_Action_Incentive_party2",
      data.getProvinceOfParty1() == "ON"
        ? CONSTANTS.Climate_action_incentive
        : CONSTANTS.Climate_action_incentive
    ),

    new BenefitColumn(
      `${data.getProvinceOfParty1()} Sales Tax`,
      data.ontarioSalesTax.party1,
      data.ontarioSalesTax.party2,
      "checkbox",
      "checkbox",
      data.isCheckedSwitch.PROV_Sales_Tax_Party1,
      data.isCheckedSwitch.PROV_Sales_Tax_Party2,
      data.setIsCheckedSwitch,
      "PROV_Sales_Tax_Party1",
      "PROV_Sales_Tax_Party2",

      data.getProvinceOfParty1() == "ON"
        ? CONSTANTS.Ontario_Sales_tax_credit
        : CONSTANTS.Ontario_Sales_tax_credit
    ),

    new BenefitColumn(
      ` Child Disability`,
      data.childDisabilityBenefit.party1,
      data.childDisabilityBenefit.party2,
      "checkbox",
      "checkbox",
      data.isCheckedSwitch.Child_Disability_Party1,
      data.isCheckedSwitch.Child_Disability_Party2,
      data.setIsCheckedSwitch,
      "Child_Disability_Party1",
      "Child_Disability_Party2",

    ),

    // new BenefitColumn(
    //   "Total Benefits ",
    //   data.sumAllBenefits(1),
    //   data.sumAllBenefits(2),
    //   "",
    //   "",
    //   data.isCheckedSwitch,
    //   data.setIsCheckedSwitch,
    //   CONSTANTS.Total_Benefit
    // ),
  ];






  const benefitFixedCols = [
    {
      name: "Canada Child Benefit",
      shortName: "CCB",
      value1: data.childBenefit.party1,
      value2: data.childBenefit.party2,
    },
    {
      name: "GST/HST Benefit",
      shortName: "GST",
      value1: data.GSTHSTBenefit.party1,
      value2: data.GSTHSTBenefit.party2,
    },
    {
      name: "Provincial Child Benefit",
      shortName: "PCB",
      value1: data.OntarioChildBenefit.party1,
      value2: data.OntarioChildBenefit.party2,
    },
    {
      name: "Climate Action Incentive",
      shortName: "CAI",
      value1: data.climateChangeVal.party1,
      value2: data.climateChangeVal.party2,
    },
    {
      name: "Provincial Sales Tax",
      shortName: "STB",
      value1: data.ontarioSalesTax.party1,
      value2: data.ontarioSalesTax.party2,
    },
  ];

  const creditsFixedCols = [
    {
      name: "Basic personal amount - Federal",
      shortName: "BPAF",
      value1: data.allCreditsParty1.basicPersonalAmountFederal,
      value2: data.allCreditsParty2.basicPersonalAmountFederal,
    },
    {
      name: "Amount for eligible dependent",
      shortName: "AEDF",
      value1: data.allCreditsParty1.amountForEligibleDependent,
      value2: data.allCreditsParty2.amountForEligibleDependent,
    },
    {
      name: "Base CPP Contribution",
      shortName: "BCPPC",
      value1: data.allCreditsParty1.baseCPPContribution,
      value2: data.allCreditsParty2.baseCPPContribution,
    },
    {
      name: "EI Premium",
      shortName: "EIP",
      value1: data.allCreditsParty1.EIPremiums,
      value2: data.allCreditsParty2.EIPremiums,
    },
    {
      name: "Canada Employment Amount",
      shortName: "CEA",
      value1: data.allCreditsParty1.canadaEmploymentAmount,
      value2: data.allCreditsParty2.canadaEmploymentAmount,
    },
    {
      name: `Basic personal amount - ${data.getProvinceOfParty1()}`,
      shortName: "BPAP",
      value1: data.allCreditsParty1.basicPersonalAmountOntario,
      value2: data.allCreditsParty2.basicPersonalAmountOntario,
    },
    {
      name: `Amount for Eligible dependent - ${data.getProvinceOfParty1()}`,
      shortName: "AEDP",
      value1: data.allCreditsParty1.amountForEligibleDependentOntario,
      value2: data.allCreditsParty2.amountForEligibleDependentOntario,
    },
  ];






  return (
    <>
      <thead>
        <tr>
          <th>Income </th>
          <th>{data.party1Name()}</th>
          <th>{data.party2Name()}</th>
        </tr>
      </thead>
      <tbody>
        {incomeData.map((incomeData, index) => (
          <RenderEachCalculationValue key={index} columnData={incomeData} />
        ))}
        {Adjustments.map((incomeData, index) => (
          <RenderEachCalculationValue key={index} columnData={incomeData} />
        ))}
        <tr>
          <th colSpan="3">Deductions</th>
        </tr>
        {Deductions.map((deductionData, index) => (
          <RenderEachCalculationValue key={index} columnData={deductionData} />
        ))}
        {popup.deductions && (
          <ModalInputCenter
            show={popup.deductions}
            heading="Add Deductions"
            action="ok"
            optionalWidth={true}
            size="xl"
            modalSize="modal-lg"
            cancelOption="cancel"
            changeShow={() => {
              setPopup((prev) => ({ ...prev, deductions: !prev.deductions }));
            }}
            handleClick={() => {
              setPopup((prev) => ({ ...prev, deductions: !prev.deductions }));
            }}
          >
            <div className="row lawCalculator">
              <div className="col-md-6">
                <span className="heading">{data.party1Name()}</span>
                {data.deductions.party1.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                data.deleteElementInDeductionsArray(index, 1)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          <Dropdown
                            options={dropdownDeductions}
                            placeholder="Select Deduction Type"
                            onChange={(event) => {
                              data.changeParty1DeductionsDropdown(event, index);
                              data.calculateAllOperationsForParty1();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            onChange={(event: any) =>
                              data.changeParty1DeductionAmount(event, index)
                            }
                            decimalScale={3}
                            defaultValue={0}
                            value={
                              e.value === "21400"
                                ? data.limitValueForChildExpenses(
                                  filterChildCareExpensesAndSum(
                                    data.deductions.party1
                                  ),
                                  data.screen1.aboutTheChildren
                                )
                                : e.amount === ""
                                  ? 0
                                  : e.amount
                            }
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            disabled={e.value === "21400"}
                            prefix={"$"}
                            onFocus={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              event.target.value =
                                event.target.value === "$0"
                                  ? "$"
                                  : event.target.value === ""
                                    ? "$"
                                    : event.target.value;
                            }}
                            onBlur={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              data.calculateAllOperationsForParty1();
                              data.calculateAllOperationsForParty2();
                              data.calculateChildSupport();
                              event.target.value =
                                event.target.value === "$"
                                  ? "$0"
                                  : event.target.value === ""
                                    ? "$0"
                                    : event.target.value;
                            }}
                          ></NumberFormat>
                        </div>
                      </>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addDeductionsToParty1}>+ Add More Credits</a>
                </div>
              </div>
              <div className="col-md-6">
                <span className="heading">{data.party2Name()}</span>
                {data.deductions.party2.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                data.deleteElementInDeductionsArray(index, 2)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          <Dropdown
                            options={dropdownDeductions}
                            placeholder="Select Deduction Type"
                            onChange={(event) => {
                              data.changeParty2DeductionsDropdown(event, index);
                              data.calculateAllOperationsForParty2();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            onChange={(event: any) =>
                              data.changeParty2DeductionAmount(event, index)
                            }
                            decimalScale={3}
                            defaultValue={0}
                            value={
                              e.value === "21400"
                                ? data.limitValueForChildExpenses(
                                  filterChildCareExpensesAndSum(
                                    data.deductions.party2
                                  ),
                                  data.screen1.aboutTheChildren
                                )
                                : e.amount === ""
                                  ? 0
                                  : e.amount
                            }
                            disabled={e.value === "21400"}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            prefix={"$"}
                            onFocus={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              event.target.value =
                                event.target.value === "$0"
                                  ? "$"
                                  : event.target.value === ""
                                    ? "$"
                                    : event.target.value;
                            }}
                            onBlur={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              data.calculateAllOperationsForParty1();
                              data.calculateAllOperationsForParty2();
                              data.calculateChildSupport();
                              event.target.value =
                                event.target.value === "$"
                                  ? "$0"
                                  : event.target.value === ""
                                    ? "$0"
                                    : event.target.value;
                            }}
                          ></NumberFormat>
                        </div>
                      </>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addDeductionsToParty2}>+ Add More Credits</a>
                </div>
              </div>
            </div>
          </ModalInputCenter>
        )}
        <tr>
          <td colSpan="3">
            <a onClick={onDeductionsAdd}>+ Add/Edit Deductions</a>
          </td>
        </tr>
        <tr>
          <th colSpan="3">Credits</th>
        </tr>
        {Credits.map((creditData, index) => (
          <RenderEachCalculationValue key={index} columnData={creditData} />
        ))}
        {popup.credits && (
          <ModalInputCenter
            show={popup.credits}
            heading="Add Credits"
            action="Ok"
            modalSize="modal-lg"
            size="xl"
            // modalSize="modal-lg"
            cancelOption="Cancel"
            changeShow={() => {
              setPopup((prev) => ({ ...prev, credits: !prev.credits }));
            }}
            handleClick={() => {
              setPopup((prev) => ({ ...prev, credits: !prev.credits }));
            }}
            optionalWidth={true}
          >
            <div className="row lawCalculator">
              <div className="col-md-6">
                <span className="heading">{data.party1Name()}</span>
                {data.benefits.party1.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                data.deleteElementInCreditsArray(index, 1)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          <Dropdown
                            options={dropdownCredit}
                            placeholder="Select Credit Type"
                            onChange={(event) => {
                              data.changeParty1BenefitsDropdown(event, index);
                              data.calculateAllOperationsForParty1();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            onChange={(event: any) =>
                              data.changeParty1BenefitsAmount(event, index)
                            }
                            decimalScale={3}
                            defaultValue={0}
                            value={e.amount === "" ? 0 : e.amount}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            prefix={"$"}
                            onFocus={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              event.target.value =
                                event.target.value === "$0"
                                  ? "$"
                                  : event.target.value === ""
                                    ? "$"
                                    : event.target.value;
                            }}
                            onBlur={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              data.calculateAllOperationsForParty1();
                              data.calculateAllOperationsForParty2();
                              data.calculateChildSupport();
                              event.target.value =
                                event.target.value === "$"
                                  ? "$0"
                                  : event.target.value === ""
                                    ? "$0"
                                    : event.target.value;
                            }}
                          ></NumberFormat>
                        </div>
                      </>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addCreditsToParty1}>+ Add More Credits</a>
                </div>
                {creditsFixedCols.map((e) => (
                  <FixedColumnValues
                    name={e.name}
                    shortName={e.shortName}
                    value={e.value1}
                    partyNum={1}
                    changeFixedValues={data.changeFixedValues}
                  />
                ))}
              </div>
              <div className="col-md-6">
                <span className="heading">{data.party2Name()}</span>
                {data.benefits.party2.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() =>
                                data.deleteElementInCreditsArray(index, 2)
                              }
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          <Dropdown
                            options={dropdownCredit}
                            placeholder="Select Credit Type"
                            onChange={(event) => {
                              data.changeParty2BenefitsDropdown(event, index);
                              data.calculateAllOperationsForParty2();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            onChange={(event: any) =>
                              data.changeParty2BenefitsAmount(event, index)
                            }
                            decimalScale={3}
                            defaultValue={0}
                            value={e.amount === "" ? 0 : e.amount}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            prefix={"$"}
                            onFocus={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              event.target.value =
                                event.target.value === "$0"
                                  ? "$"
                                  : event.target.value === ""
                                    ? "$"
                                    : event.target.value;
                            }}
                            onBlur={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              data.calculateAllOperationsForParty1();
                              data.calculateAllOperationsForParty2();
                              data.calculateChildSupport();
                              event.target.value =
                                event.target.value === "$"
                                  ? "$0"
                                  : event.target.value === ""
                                    ? "$0"
                                    : event.target.value;
                            }}
                          ></NumberFormat>
                        </div>
                      </>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addCreditsToParty2}>+ Add More Credits</a>
                </div>
                {creditsFixedCols.map((e) => (
                  <FixedColumnValues
                    name={e.name}
                    shortName={e.shortName}
                    value={e.value2}
                    partyNum={2}
                    changeFixedValues={data.changeFixedValues}
                  />
                ))}
              </div>
            </div>
          </ModalInputCenter>
        )}
        <tr>
          <td colSpan="3">
            <a onClick={onCreditsAdd}>+ Add/Edit Credits</a>
          </td>
        </tr>
        {popup.benefits && (
          <ModalInputCenter
            show={popup.benefits}
            heading="Add Benefits"
            action="ok"
            size="xl"
            cancelOption="cancel"
            changeShow={() => {
              setPopup((prev) => ({ ...prev, benefits: !prev.benefits }));
            }}
            optionalWidth={true}
            handleClick={() => {
              setPopup((prev) => ({ ...prev, benefits: !prev.benefits }));
            }}
          >
            <div className="row lawCalculator">
              <div className="col-md-6">
                <span className="heading">{data.party1Name()}</span>
                {data.benefitsForParties.party1.fed.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() => data.deleteFedBenefits(index, 2)}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          <Dropdown
                            options={fedBenefitTypeDropdown}
                            placeholder="Select Federal Benefit Type"
                            onChange={(event) => {
                              data.changeFedBenefitsDropdown(event, index, 1);
                              data.calculateAllOperationsForParty1();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            onChange={(
                              event: React.SyntheticEvent<HTMLInputElement>
                            ) => data.changeFedDeductionAmount(event, index, 1)}
                            decimalScale={3}
                            defaultValue={0}
                            value={e.amount === "" ? 0 : e.amount}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            prefix={"$"}
                            onFocus={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              event.target.value =
                                event.target.value === "$0"
                                  ? "$"
                                  : event.target.value === ""
                                    ? "$"
                                    : event.target.value;
                            }}
                            onBlur={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              data.calculateAllOperationsForParty1();
                              data.calculateAllOperationsForParty2();
                              data.calculateChildSupport();
                              event.target.value =
                                event.target.value === "$"
                                  ? "$0"
                                  : event.target.value === ""
                                    ? "$0"
                                    : event.target.value;
                            }}
                          ></NumberFormat>
                        </div>
                      </>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addFedBenefitsToParty1}>
                    + Add More Credits
                  </a>
                </div>
                {data.benefitsForParties.party1.prov.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() => data.deleteProvBenefits(index, 1)}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          <Dropdown
                            options={
                              data.getProvinceOfParty1() === "ON"
                                ? provBenefitONTypeDropdown
                                : provBenefitBCTypeDropdown
                            }
                            placeholder="Select Provincial Benefit Type"
                            onChange={(event) => {
                              data.changeProvBenefitsDropdown(event, index, 1);
                              data.calculateAllOperationsForParty1();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            onChange={(event: any) =>
                              data.changeProvDeductionAmount(event, index, 1)
                            }
                            decimalScale={3}
                            defaultValue={0}
                            value={e.amount === "" ? 0 : e.amount}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            prefix={"$"}
                            onFocus={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              event.target.value =
                                event.target.value === "$0"
                                  ? "$"
                                  : event.target.value === ""
                                    ? "$"
                                    : event.target.value;
                            }}
                            onBlur={(
                              event: React.FocusEvent<HTMLInputElement>
                            ) => {
                              data.calculateAllOperationsForParty1();
                              data.calculateAllOperationsForParty2();
                              data.calculateChildSupport();
                              event.target.value =
                                event.target.value === "$"
                                  ? "$0"
                                  : event.target.value === ""
                                    ? "$0"
                                    : event.target.value;
                            }}
                          ></NumberFormat>
                        </div>
                      </>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addProvBenefitsToParty1}>
                    + Add More Credits
                  </a>
                </div>
              </div>
              <div className="col-md-6"></div>
            </div>
            <div className="d-flex justify-content-between gap-5 mx-2">
              <div className="w-100">
                <div></div>

                <div className="mt-3"></div>

                {benefitFixedCols.map((e) => (
                  <FixedColumnValues
                    name={e.name}
                    shortName={e.shortName}
                    value={e.value1}
                    partyNum={1}
                    changeFixedValues={data.changeFixedValues}
                  />
                ))}
              </div>

              <div className="flex-1 w-100">
                <div>
                  <div className="heading-4 pb-4">{data.party2Name()}</div>

                  {data.benefitsForParties.party2.fed.map(
                    (e: partyIncomeAndAmount, index: number) => {
                      return (
                        <div className="d-flex align-items-center" key={index}>
                          {index > 0 && (
                            <img
                              src="/images/Delete_Todo.png"
                              alt={"delete todo"}
                              className="cursor_pointer mr-1"
                              onClick={() => data.deleteFedBenefits(index, 2)}
                            />
                          )}

                          <div className="w-100">
                            <Dropdown
                              className="heading-5"
                              options={fedBenefitTypeDropdown}
                              placeholder="Select Federal Benefit Type"
                              onChange={(event) => {
                                data.changeFedBenefitsDropdown(event, index, 2);
                                data.calculateAllOperationsForParty1();
                              }}
                              value={e.label}
                            ></Dropdown>

                            <NumberFormat
                              onChange={(
                                event: React.SyntheticEvent<HTMLInputElement>
                              ) =>
                                data.changeFedDeductionAmount(event, index, 2)
                              }
                              decimalScale={3}
                              defaultValue={0}
                              value={e.amount === "" ? 0 : e.amount}
                              className="heading-5 my-4 w-100"
                              inputMode="numeric"
                              thousandSeparator={true}
                              prefix={"$"}
                              onFocus={(
                                event: React.FocusEvent<HTMLInputElement>
                              ) => {
                                event.target.value =
                                  event.target.value === "$0"
                                    ? "$"
                                    : event.target.value === ""
                                      ? "$"
                                      : event.target.value;
                              }}
                              onBlur={(
                                event: React.FocusEvent<HTMLInputElement>
                              ) => {
                                data.calculateAllOperationsForParty1();
                                data.calculateAllOperationsForParty2();
                                data.calculateChildSupport();
                                event.target.value =
                                  event.target.value === "$"
                                    ? "$0"
                                    : event.target.value === ""
                                      ? "$0"
                                      : event.target.value;
                              }}
                            ></NumberFormat>
                          </div>
                        </div>
                      );
                    }
                  )}

                  <div
                    className="heading-5 text-primary-color cursor_pointer"
                    onClick={data.addFedBenefitsToParty2}
                  >
                    + Add Federal Benefits
                  </div>
                </div>

                <div className="mt-3">
                  {data.benefitsForParties.party2.prov.map(
                    (e: partyIncomeAndAmount, index: number) => {
                      return (
                        <div className="d-flex align-items-center" key={index}>
                          {index > 0 && (
                            <img
                              src="/images/Delete_Todo.png"
                              alt={"delete_todo"}
                              className="cursor_pointer mr-1"
                              onClick={() => data.deleteProvBenefits(index, 2)}
                            />
                          )}

                          <div className="w-100">
                            <Dropdown
                              className="heading-5"
                              options={
                                data.getProvinceOfParty1() === "ON"
                                  ? provBenefitONTypeDropdown
                                  : provBenefitBCTypeDropdown
                              }
                              placeholder="Select Provincial Benefit Type"
                              onChange={(event) => {
                                data.changeProvBenefitsDropdown(
                                  event,
                                  index,
                                  2
                                );
                                data.calculateAllOperationsForParty1();
                              }}
                              value={e.label}
                            ></Dropdown>

                            <NumberFormat
                              onChange={(event: any) =>
                                data.changeProvDeductionAmount(event, index, 2)
                              }
                              decimalScale={3}
                              defaultValue={0}
                              value={e.amount === "" ? 0 : e.amount}
                              className="heading-5 my-4 w-100"
                              inputMode="numeric"
                              thousandSeparator={true}
                              prefix={"$"}
                              onFocus={(
                                event: React.FocusEvent<HTMLInputElement>
                              ) => {
                                event.target.value =
                                  event.target.value === "$0"
                                    ? "$"
                                    : event.target.value === ""
                                      ? "$"
                                      : event.target.value;
                              }}
                              onBlur={(
                                event: React.FocusEvent<HTMLInputElement>
                              ) => {
                                data.calculateAllOperationsForParty1();
                                data.calculateAllOperationsForParty2();
                                data.calculateChildSupport();
                                event.target.value =
                                  event.target.value === "$"
                                    ? "$0"
                                    : event.target.value === ""
                                      ? "$0"
                                      : event.target.value;
                              }}
                            ></NumberFormat>
                          </div>
                        </div>
                      );
                    }
                  )}
                  <div
                    className="heading-5 text-primary-color cursor_pointer"
                    onClick={data.addProvBenefitsToParty2}
                  >
                    + Add Provincial Benefits
                  </div>
                </div>

                {benefitFixedCols.map((e) => (
                  <FixedColumnValues
                    name={e.name}
                    shortName={e.shortName}
                    value={e.value2}
                    partyNum={2}
                    changeFixedValues={data.changeFixedValues}
                  />
                ))}
              </div>
            </div>
          </ModalInputCenter>
        )}
        <tr>
          <th colSpan="3">Benefits</th>
          {/* <th colSpan="3"><CustomSwitch isChecked={isCheckedSwitch} handleToggleChange={handleToggleChangeSwitch}/></th> */}


        </tr>
        {Benefits.map((BenefitData: Column, index: number) => (
          <RenderEachCalculationValue key={index} columnData={BenefitData} />
        ))}
        {popup.benefits && (
          <ModalInputCenter
            show={popup.benefits}
            heading="Add Benefits"
            action="ok"
            size="xl"
            modalSize="modal-lg"
            cancelOption="cancel"
            changeShow={() => {
              setPopup((prev) => ({ ...prev, benefits: !prev.benefits }));
            }}
            optionalWidth={true}
            handleClick={() => {
              setPopup((prev) => ({ ...prev, benefits: !prev.benefits }));
            }}
          >
            <div className="row lawCalculator">
              <div className="col-md-6">
                <span className="heading">{data.party1Name()}</span>
                {data.benefitsForParties.party1.fed.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <>
                        <div className="form-group">
                          {index > 0 && (
                            <span
                              className="crossBtn"
                              onClick={() => data.deleteFedBenefits(index, 1)}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          )}
                          <Dropdown
                            options={fedBenefitTypeDropdown}
                            placeholder="Select Federal Benefit Type"
                            onChange={(event) => {
                              data.changeFedBenefitsDropdown(event, index, 1);
                              data.calculateAllOperationsForParty1();
                            }}
                            value={e.label}
                          ></Dropdown>
                          <NumberFormat
                            onChange={(
                              event: React.SyntheticEvent<HTMLInputElement>
                            ) => data.changeFedDeductionAmount(event, index, 1)}
                            decimalScale={3}
                            defaultValue={0}
                            value={e.amount}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            prefix={"$"}
                            onBlur={() => {
                              data.calculateAllOperationsForParty1();
                              data.calculateAllOperationsForParty2();
                              data.calculateChildSupport();
                            }}
                          ></NumberFormat>
                        </div>
                      </>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addFedBenefitsToParty1}>
                    + Add Federal Benefits
                  </a>
                </div>
                {data.benefitsForParties.party1.prov.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <div className="form-group">
                        {index > 0 && (
                          <span
                            className="crossBtn"
                            onClick={() => data.deleteProvBenefits(index, 1)}
                          >
                            <i className="fas fa-times"></i>
                          </span>
                        )}
                        <Dropdown
                          options={
                            data.getProvinceOfParty1() === "ON"
                              ? provBenefitONTypeDropdown
                              : provBenefitBCTypeDropdown
                          }
                          placeholder="Select Provincial Benefit Type"
                          onChange={(event) => {
                            data.changeProvBenefitsDropdown(event, index, 1);
                            data.calculateAllOperationsForParty1();
                          }}
                          value={e.label}
                        ></Dropdown>
                        <NumberFormat
                          onChange={(event: any) =>
                            data.changeProvDeductionAmount(event, index, 1)
                          }
                          decimalScale={3}
                          defaultValue={0}
                          value={e.amount}
                          className="form-control"
                          inputMode="numeric"
                          thousandSeparator={true}
                          prefix={"$"}
                          onBlur={() => {
                            data.calculateAllOperationsForParty1();
                            data.calculateAllOperationsForParty2();
                            data.calculateChildSupport();
                          }}
                        ></NumberFormat>
                      </div>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addProvBenefitsToParty1}>
                    + Add Provincial Benefits
                  </a>
                </div>
                {benefitFixedCols.map((e) => (
                  <FixedColumnValues
                    name={e.name}
                    shortName={e.shortName}
                    value={e.value1}
                    partyNum={1}
                    changeFixedValues={data.changeFixedValues}
                  />
                ))}
              </div>
              <div className="col-md-6">
                <span className="heading">{data.party2Name()}</span>
                {data.benefitsForParties.party2.fed.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <div className="form-group">
                        {index > 0 && (
                          <span
                            className="crossBtn"
                            onClick={() => data.deleteFedBenefits(index, 2)}
                          >
                            <i className="fas fa-times"></i>
                          </span>
                        )}
                        <Dropdown
                          options={fedBenefitTypeDropdown}
                          placeholder="Select Federal Benefit Type"
                          onChange={(event) => {
                            data.changeFedBenefitsDropdown(event, index, 2);
                            data.calculateAllOperationsForParty1();
                          }}
                          value={e.label}
                        ></Dropdown>
                        <NumberFormat
                          onChange={(
                            event: React.SyntheticEvent<HTMLInputElement>
                          ) => data.changeFedDeductionAmount(event, index, 2)}
                          decimalScale={3}
                          defaultValue={0}
                          value={e.amount}
                          className="form-control"
                          inputMode="numeric"
                          thousandSeparator={true}
                          prefix={"$"}
                          onBlur={() => {
                            data.calculateAllOperationsForParty1();
                            data.calculateAllOperationsForParty2();
                            data.calculateChildSupport();
                          }}
                        ></NumberFormat>
                      </div>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addFedBenefitsToParty2}>
                    + Add Federal Benefits
                  </a>
                </div>
                {data.benefitsForParties.party2.prov.map(
                  (e: partyIncomeAndAmount, index: number) => {
                    return (
                      <div className="form-group">
                        {index > 0 && (
                          <span
                            className="crossBtn"
                            onClick={() => data.deleteProvBenefits(index, 2)}
                          >
                            <i className="fas fa-times"></i>
                          </span>
                        )}
                        <Dropdown
                          options={
                            data.getProvinceOfParty1() === "ON"
                              ? provBenefitONTypeDropdown
                              : provBenefitBCTypeDropdown
                          }
                          placeholder="Select Provincial Benefit Type"
                          onChange={(event) => {
                            data.changeProvBenefitsDropdown(event, index, 2);
                            data.calculateAllOperationsForParty1();
                          }}
                          value={e.label}
                        ></Dropdown>
                        <NumberFormat
                          onChange={(event: any) =>
                            data.changeProvDeductionAmount(event, index, 2)
                          }
                          decimalScale={3}
                          defaultValue={0}
                          value={e.amount}
                          className="form-control"
                          inputMode="numeric"
                          thousandSeparator={true}
                          prefix={"$"}
                          onBlur={() => {
                            data.calculateAllOperationsForParty1();
                            data.calculateAllOperationsForParty2();
                            data.calculateChildSupport();
                          }}
                        ></NumberFormat>
                      </div>
                    );
                  }
                )}
                <div className="addBtn mb-3">
                  <a onClick={data.addProvBenefitsToParty2}>
                    + Add Provincial Benefits
                  </a>
                </div>
                {benefitFixedCols.map((e) => (
                  <FixedColumnValues
                    name={e.name}
                    shortName={e.shortName}
                    value={e.value2}
                    partyNum={2}
                    changeFixedValues={data.changeFixedValues}
                  />
                ))}
              </div>
            </div>
          </ModalInputCenter>
        )}
        <tr>
          <td colSpan="3">
            <a onClick={onBenefitsAdd}>+ Edit Benefits</a>
          </td>
        </tr>
      </tbody>
    </>
  );
};

const RenderEachCalculationValue = ({ columnData }: { columnData: Column }) => {


  const handleToggleChangeSwitch = (value, name) => {
    columnData.setIsCheckedSwitch((prev) => ({
      ...prev,
      [name]: !value
    }));
  };



  return (
    <HideElement
      conditionToShow={true}
    // conditionToShow={columnData.party1 !== 0 || columnData.party2 !== 0}

    >
      <tr>
        {columnData.Tolltip ? (
          <OverlayTrigger
            placement="left"
            overlay={
              <Tooltip id="tooltip-left" color="green">
                {columnData.Tolltip}
              </Tooltip>
            }
          >
            <td style={{ cursor: "pointer" }}>
              <InfoIcon fontSize="small" style={{ color: "grey" }} />
              {`${columnData.label}`}
            </td>
          </OverlayTrigger>
        ) : (
          <td>{columnData.label} </td>
        )}



        <td>
          {
            columnData.party1type == "checkbox" ?
              <CustomSwitch isChecked={columnData.isCheckedSwitchParty1} handleToggleChange={() => handleToggleChangeSwitch(columnData.isCheckedSwitchParty1, columnData.nameparty1)} />

              :
              formatNumberInThousands(columnData.party1)}

        </td>
        <td>
          {
            columnData.party2type == "checkbox" ?

              <CustomSwitch isChecked={columnData.isCheckedSwitchParty2}
                handleToggleChange={() => handleToggleChangeSwitch(columnData.isCheckedSwitchParty2, columnData.nameparty2)} />
              :
              formatNumberInThousands(columnData.party2)}

        </td>
      </tr>
    </HideElement>
  );
};

const FixedColumnValues = ({
  changeFixedValues,
  name,
  shortName,
  value,
  partyNum,
}: any) => {
  return (
    <div className="form-group">
      <label>{name}</label>
      <NumberFormat
        onChange={(event: any) => {
          changeFixedValues(shortName, event, partyNum);
        }}
        onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
          event.target.value =
            event.target.value === "$0" ? "$" : event.target.value;
        }}
        onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
          event.target.value =
            event.target.value === "$" ? "$0" : event.target.value;
        }}
        decimalScale={3}
        defaultValue={0}
        value={value}
        className="form-control"
        inputMode="numeric"
        thousandSeparator={true}
        prefix={"$"}
      />
    </div>
  );
};

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
import CAL_PERCENTAGE from "../CalculationPercentage";
import SettingsIcon from "@mui/icons-material/Settings";
import { fetchAllCalculatorDatawithTaxs } from "../../../utils/Apis/calculator/fetchAllCalculatorDatawithTaxs";
import { calcSpousalSupportFlask } from "../../../utils/Apis/calculator/calcSpousalSupportFlask";
import { calcChildSupportFlask } from "../../../utils/Apis/calculator/calcChildSupportFlask";


import useQuery from "../../../hooks/useQuery";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import { apiCalculatorById } from "../../../utils/Apis/calculator/Calculator_values_id";
import { fetchRequest } from "../../../utils/fetchRequest";
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
  formulaForChildSupport,
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
  CHILD_SUPPORT_CAL,
  CUSTODIAL_FORMULA,
  getCalculatorIdFromQuery,
  ItypeOfSplitting,
  ONLY_CHILD,
  Province,
  WITHOUT_CHILD_FORMULA,
} from "../Calculator";
import OverviewCal from "../Overview_Cal";
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
  filterEmployedIncomeSumWithAllincome,
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
  partyIncomeOtherHousehold,
  partyIncomeAndAmount,
  propsTableParams,
  provBenefitBCTypeDropdown,
  provBenefitONTypeDropdown,
  separateValuesDB,
  specialExpensesDropdown,
  totalNumberOfChildren,
  twoPartyStates,
  undueHardshipIncomeTypeDropdown,
  calcValueToIntakeType
} from "./Screen2";
import CONSTANTS from "../TollTipConstants";
import CustomCheckbox from "../../../components/LayoutComponents/CustomCheckbox/CustomCheckbox";
import toast from "react-hot-toast";

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
  rawIntakeData: any,
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
  allApiDataCal ,setAllApiDataCal,
  rawIntakeData,

}: Props) => {

  
  const history = useHistory();
  const calculatorId = useQuery();
  const [showAlertFillAllDetails, setShowAlertFillAllDetails] = useState(false);
  const [showFlaskError, setShowFlaskError] = useState(false);
  const [showNoChildrenError, setShowNoChildrenError] = useState(false);
  const storedMatterNumber = JSON.parse(localStorage.getItem('selectedCalculatorMatterNumber') || '""');

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

  // Counter to force re-render after ref-based calculations update
  const [calcVersion, setCalcVersion] = useState(0);



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
    allYears: [{ year: 2025 }],
    selectedYear: 2025,
  });

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
      CPP2MaxAmt: 0,
      CPP2MaxPenEarning: 0,
      CPP2PenEarning: 0,
      CPP2Rate: 0
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

  // Set to true after Flask sets childSupportRef so the JS calculateChildSupport()
  // useEffect doesn't overwrite the Flask value when loading toggles.
  const childSupportLockedByFlask = useRef<boolean>(false);

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

  // Stores the Flask-determined spousal payor direction so
  // spousalSupportGivenTo() works even when amounts are $0.
  const flaskSpousalPayorIsParty1 = useRef<boolean | null>(null);

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
    // When the Flask API determined direction, use it — this handles
    // the $0 case where both slots are equal and the amount comparison
    // would always default to party2.
    if (flaskSpousalPayorIsParty1.current !== null) {
      return flaskSpousalPayorIsParty1.current ? party2Name() : party1Name();
    }
    return spousalSupportMed.current.party1 > spousalSupportMed.current.party2
      ? party1Name()
      : party2Name();
  };



  // Inside your component

  useEffect(() => {
    const calcId = Number(getCalculatorIdFromQuery(calculatorId));
    // Skip fetch for manual calculators (no saved ID)
    if (!calcId || isNaN(calcId)) return;

    const fetchData = async () => {
      try {
        const data = await apiCalculatorById.get_value(calcId);
        if (!data?.report_data) return;

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
        }
      } catch (err) {
        console.warn("[Calculator] Failed to fetch saved calculator data:", err);
      }
    };

    fetchData();
  }, [Number(getCalculatorIdFromQuery(calculatorId))]);

  


  const passStateToParentAndNextPage = async (
    id: number,
    saveValues: boolean
  ) => {
    console.log("[SAVE-DEBUG] Step 6: passStateToParentAndNextPage entered", { id, saveValues });

    // Build the minimal object Screen4 needs — all heavy computation skipped.
    const _spousalSupport = {
      spousalSupport1Med:  spousalSupportMed.current.party1,
      spousalSupport2Med:  spousalSupportMed.current.party2,
      spousalSupport1Low:  spousalSupportLow.current.party1,
      spousalSupport2Low:  spousalSupportLow.current.party2,
      spousalSupport1High: spousalSupportHigh.current.party1,
      spousalSupport2High: spousalSupportHigh.current.party2,
      givenTo: spousalSupportGivenTo(),
    };

    const _childSupport = {
      childSupport1: childSupportRef.current.party1,
      childSupport2: childSupportRef.current.party2,
      givenTo: childSupportGivenTo(),
    };

    const _obj: any = {
      income,
      spousalSupport: _spousalSupport,
      childSupport: _childSupport,
      childSupportReadOnly: childSupportReadOnly.current,
      tax_year: distinctYears.selectedYear,
      totalIncomeParty1: totalIncomeByIncomeState(income.party1),
      totalIncomeParty2: totalIncomeByIncomeState(income.party2),
      dobParty1: momentFunction.calculateNumberOfYears(screen1.background.party1DateOfBirth),
      dobParty2: momentFunction.calculateNumberOfYears(screen1.background.party2DateOfBirth),
      durationOfSupport: calculateDurationOfSupport(),
      specialExpensesArr,
      otherhouseholdmember,
      nonTaxableincome,
      deductions: screen2.deductions,
      benefits: screen2.benefits,
      guidelineIncome,
      scenarios,
      lumpsumReport:    { highparty2: 0, midparty2: 0, lowparty2: 0 },
      insurenceReport:  { highparty2: 0, midparty2: 0, lowparty2: 0 },
      viceversaReport:  { highparty2: 0, midparty2: 0, lowparty2: 0, child: 0 },
      gettaxsAndDedutionByIncome: { party1: [], party2: [] },
      changeInTaxesAndBenefit: {
        changeInTaxesAndBenefitLow1: changeInTaxesAndBenefitLow.current.party1,
        changeInTaxesAndBenefitLow2: changeInTaxesAndBenefitLow.current.party2,
        changeInTaxesAndBenefitMed1: changeInTaxesAndBenefitMed.current.party1,
        changeInTaxesAndBenefitMed2: changeInTaxesAndBenefitMed.current.party2,
        changeInTaxesAndBenefitHigh1: changeInTaxesAndBenefitHigh.current.party1,
        changeInTaxesAndBenefitHigh2: changeInTaxesAndBenefitHigh.current.party2,
      },
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
      report_type: typeOfReport.current,
      calculator_type: typeOfCalculatorSelected,
      updated_at: new Date(),
      disposableIncome: disposableIncomeRef.current,
      taxesFromApi: taxesFromApiRef.current,
      benefitsFromApi: benefitsFromApiRef.current,

      // ── Report fields needed by reports5, reports6, reports10 ──
      includeLumpsum,
      includeLifeInsurence,
      lumpsum_duration: spousalDuration,
      lumpsum_rate: lumpsum.discount_rate,
      insurence_duration: spousalDurationonInsurence,
      insurence_child_duration: InsurenceDuration,
      insurence_rate: lifeInsurence.discount_rate,
      childDisabilityBenefitParty1: childDisabilityBenefit.current.party1,
      childDisabilityBenefitParty2: childDisabilityBenefit.current.party2,
      disabilityCredits: basicPartyDisabilityFixed,
      disabilityCreditsProv: basicPartyDisabilityProvFixed,
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
      enhancedCPPDeduction: enhancedCPPDeduction.current,
      SecondAdditionalCPPEmployed: {
        party1: SecondAdditionalCPPEmployed(1),
        party2: SecondAdditionalCPPEmployed(2),
      },
      SecondAdditionalCPPSelfEmployed: {
        party1: SecondAdditionalCPPSelfEmployed(1),
        party2: SecondAdditionalCPPSelfEmployed(2),
      },
      federalTaxValues: federalTaxWithSpecialExpenses.current,
      ontarioTaxValues: ontarioTaxWithSpecialExpenses.current,
      CPPandEIValues: CPPandEIWithSpecialExpenses.current,
      CPPandEISelfEmployedValues: CPPandEISelfEmployedWithSpecialExpenses.current,
      benefitsValues: benefitsValues.current,
      benefitsValuesWithoutSpecialExpenses: benefitsValuesWithoutSpecialExpenses.current,
      allCreditsParty1: allCreditsParty1.current,
      allCreditsParty2: allCreditsParty2.current,
      LIFT: LIFTWithSpecialExpenses.current,
      taxableIncomeValues: taxableIncomeWithSpecialExpenses.current,
      GSTHSTValues: GSTHSTBenefitWithSpecialExpenses.current,
      canadaChildBenefitValues: canadaChildBenefitWithSpecialExpenses.current,
      ontarioChildBenefitValues: ontarioChildBenefitWithSpecialExpenses.current,
      ontarioSalesTaxValues: ontarioSalesTaxCreditWithSpecialExpenses.current,
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
      guidelineIncomeObj: guidelineIncome,
      undueHardshipIncome: {
        party1: totalIncomeByIncomeState(undueHardshipIncome.party1),
        party2: totalIncomeByIncomeState(undueHardshipIncome.party2),
      },
      climateActionIncentive: climateChangeVal.current,
      canadaWorkersBenefitTax: canadaWorkersBenefitTax.current,
      canadaWorkersBenefitWithSpecialExpenses: canadaWorkersBenefitWithSpecialExpenses.current,
      climateChangeValWithSpecialExpenses: climateChangeValWithSpecialExpenses.current,
      provincialCredits: {
        party1: provincialCredits.current.party1,
        party2: provincialCredits.current.party2,
      },
      canadaChildBenefitFixed,
      provChildBenefitFixed,
      GSTHSTBenefitFixed,
      ClimateActionBenefitFixed,
      salesTaxBenefitFixed,
      basicPersonalAmountFederalFixed,
      baseCPPContributionFixed,
      eiPremiumFixed,
      canadaEmploymentAmountFixed,
      basicPersonalAmountProvincialFixed,
      amountForEligibleDependentFixed,
      amountForEligibleDependentProvincialFixed,
      valueswithoutSpousalSupport: valueswithoutSpousalSupport.current,
      maximumChildLivesWith: maximumChildLivesWith(
        getParamsForCalculatingAllCredits(1)
      ),
    };

    const _report_data = {
      ..._obj,
      background: screen1.background,
      aboutTheRelationship: screen1.aboutTheRelationship,
      aboutTheChildren: screen1.aboutTheChildren,
    };

    console.log("[SAVE-DEBUG] Step 7: _report_data built", {
      hasBackground: !!_report_data.background,
      hasChildren: !!_report_data.aboutTheChildren,
      hasCppDeductions: !!_report_data.cppDeductions,
      hasEnhancedCPPDeduction: !!_report_data.enhancedCPPDeduction,
      hasSpousalSupport: !!_report_data.spousalSupport,
      hasChildSupport: !!_report_data.childSupport,
      report_type: _report_data.report_type,
      calculator_type: _report_data.calculator_type,
      keys: Object.keys(_report_data),
    });

    // Persist report_data to the DB so Screen4 can load it
    if (id && !isNaN(id) && saveValues) {
      console.log("[SAVE-DEBUG] Step 8: PATCHing report_data to DB for id =", id);
      try {
        const patchResult = await apiCalculatorById.edit_value(id, {
          report_data: _report_data,
        });
        console.log("[SAVE-DEBUG] Step 9: PATCH succeeded", patchResult);
      } catch (err) {
        console.error("[SAVE-DEBUG] Step 9 FAILED: PATCH error", err);
      }
    } else {
      console.log("[SAVE-DEBUG] Step 8: Skipping PATCH (saveValues =", saveValues, ", id =", id, ")");
    }

    settingScreen2StateFromChild({ ..._obj, report_data: _report_data });

    const navUrl = `${AUTH_ROUTES.CALCULATOR}?id=${getCalculatorIdFromQuery(calculatorId)}&step=3&saveValues=${saveValues}`;
    history.push(navUrl);
    return;

    // ── DEAD CODE BELOW — original heavy computation kept for reference ──
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
  
      let AlldataofTaxAnddedution: any[] = [];
      try {
        const _taxResult = await fetchSpecificTaxandDeductionforAmount(gettaxbyIncome);
        AlldataofTaxAnddedution = _taxResult ?? [];
      } catch { /* non-fatal — continue with empty array */ }
     

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
      SecondAdditionalCPPEmployed:{
        party1: SecondAdditionalCPPEmployed(1), 
        party2: SecondAdditionalCPPEmployed(2)
      },

      SecondAdditionalCPPSelfEmployed :{
        party1: SecondAdditionalCPPSelfEmployed(1), 
        party2: SecondAdditionalCPPSelfEmployed(2)
      },


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
      `${AUTH_ROUTES.CALCULATOR
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

    const secoundAdditionalCppEmployed = distinctYears.selectedYear > 2024 ? SecondAdditionalCPPEmployed(1): 0 
    const secondAdditionalCPPSelfEmployed = distinctYears.selectedYear > 2024 ? SecondAdditionalCPPSelfEmployed(1) : 0
    const specialExpenses =
      specialExpensesRef.current.party1 !== 0
        ? Math.min(
          AllemployedIncomeParty1() * (2 / 3),
          capAndAccumulateChildExpense(deductions.party1)
        )
        : 0;

   
    return (
      deductableSupport.current.party1 +
      calculateEnhancedCPPDeductions(1) +
      specialExpenses +
      filterDeductionsOtherThanSpecialExpenses(deductions.party1) +
      secoundAdditionalCppEmployed +
      secondAdditionalCPPSelfEmployed
    );
  };

  const getTotalDeductionsParty2 = () => {

    const secoundAdditionalCppEmployed = distinctYears.selectedYear == 2024 ? SecondAdditionalCPPEmployed(2): 0 ;
    const secondAdditionalCPPSelfEmployed = distinctYears.selectedYear == 2024 ? SecondAdditionalCPPSelfEmployed(2) : 0

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
      specialExpenses +
      filterDeductionsOtherThanSpecialExpenses(deductions.party2) +
      secoundAdditionalCppEmployed +
      secondAdditionalCPPSelfEmployed
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

  // Second additional CPP_ employed for 2024 duducation .
  const SecondAdditionalCPPEmployed  = (partyNum:number)=>{
   // = MIN((MAX((F4-I3),0)*0.04),188) 

  //  if(distinctYears.selectedYear < 2024 ){
  //   return 0
  //  }

  //    let income = 0 
  //    income  = partyNum == 1 ? employedIncome10100Party1() : employedIncome10100Party2();;
     
  //    let CPP2Amt = 0;
  //   if (income <= fetchedDynamicValues.CPP2PenEarning) {
  //     CPP2Amt = 0;
  //   } else if (income > fetchedDynamicValues.CPP2MaxPenEarning) {
  //     CPP2Amt = fetchedDynamicValues.CPP2MaxAmt;
  //   } else {
  //     CPP2Amt =
  //       (income - fetchedDynamicValues.CPP2PenEarning) *
  //       fetchedDynamicValues.CPP2Rate;
  //   }

  //  return CPP2Amt;
      return 0;  
  }


  // Second additional CPP - self employed for 2024
  const SecondAdditionalCPPSelfEmployed  = (partyNum:Number)=>{
    // =MIN((MAX((G5-I3),0)*I4),376)

    // if(distinctYears.selectedYear !== 2024 ){
    //   return 0
    //  }

    // let income = 0 
    //  income  = partyNum == 1 ? selfEmployedIncomeParty1() : selfEmployedIncomeParty2();
    //  let CPP2Amt = 0;
    // if (income <= fetchedDynamicValues.CPP2PenEarning) {
    //   CPP2Amt = 0;
    // } else if (income > fetchedDynamicValues.CPP2MaxPenEarning) {
    //   CPP2Amt = fetchedDynamicValues.CPP2MaxAmt * 2;
    // } else {
    //   CPP2Amt =
    //     (income - fetchedDynamicValues.CPP2PenEarning) *
    //     fetchedDynamicValues.CPP2Rate *
    //     2;
    // }
    // //  let result =  Math.max((income-68500),0) * 0.08;
    // //  return Math.min(result,376) + CPP2Amt

    // return CPP2Amt;
       return 0;

  }



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
        calculateEnhancedCPPDeductions(1) +
        SecondAdditionalCPPSelfEmployed(1)
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
        calculateEnhancedCPPDeductions(2) +
        SecondAdditionalCPPSelfEmployed(2)
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
        + SecondAdditionalCPPEmployed(1)
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
        baseCPPContributionValue + EIValue + EnhancedCPPDeductionsValue + SecondAdditionalCPPEmployed(2);


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

  const calculateChildSupport = () => {
    // All child support calculations are handled by the Flask backend.
    // Skip the JS calculator entirely.
    return;

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

  
    const CSGOverrideValuesParty2 = CSGOverrideValues(
      screen1.aboutTheChildren,
      screen1.background,
      2
    );


    const totalIncomeParty1WithGuideline = totalIncomeByIncomeState([
      ...income.party1,
      ...guidelineIncome.party1,
      ...nonTaxableincome.party1
    ]).toString();

    const totalIncomeParty2WithGuideline = totalIncomeByIncomeState([
      ...income.party2,
      ...guidelineIncome.party2,
      ...nonTaxableincome.party2
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
    ChildSupportInitValue.current.party1 = party1ChildSupport*12;

    const party2ChildSupport = formulaForChildSupport(party2ChildSupportParams);
    ChildSupportInitValue.current.party2 = party2ChildSupport*12;

    // 4th screen child Shared case set in 2nd screen in child is share then support1-2 (vise versa) and use this value on set Support ref
    let childSupportpaidby = 0;

    if (party1ChildSupport > party2ChildSupport) {
      childSupportpaidby = party1ChildSupport - party2ChildSupport;
      
    } else {
      childSupportpaidby = party2ChildSupport - party1ChildSupport;
    }






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
      totalIncomeParty1: totalIncomeByIncomeState(income.party1) + nonTaxableIncomeParty1(),
      totalIncomeParty2: totalIncomeByIncomeState(income.party2) + nonTaxableIncomeParty2(),
    };


    //** High Case conditions and calculation.
    if ((totalNumberOfChildren(screen1.aboutTheChildren) === 0 || determineWhichPartyHasGreaterIncomeAndChild(screen1.aboutTheChildren, incomes)) && fetchedONMrateTaxDB.length > 0) {

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
    }
    else {
      //for shared case we need to assign child support in this manner.
      if (typeOfSplitting === "SHARED") {
        notionalAmountRef.current = {
          party1: 0,
          party2: 0,
        };

        // this part is used for perivious for set child support in shared case and support1-support2 on 4th screen.

        // childSupportRef.current = {
        //   party1:
        //     Number(party1ChildSupport * 12) +
        //     addAllNumbersInArr(CSGOverrideValuesParty1) * 12,

        //   party2:
        //     Number(party2ChildSupport * 12) +
        //     addAllNumbersInArr(CSGOverrideValuesParty2) * 12,
        // };

        //we change this cause we want netamount and do this in highcase(50%)

        childSupportRef.current = {
          party1:
            Number(childSupportpaidby * 12) +
            addAllNumbersInArr(CSGOverrideValuesParty1) * 12,

          party2:
            -(Number(childSupportpaidby * 12) +
              addAllNumbersInArr(CSGOverrideValuesParty2) * 12),
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
      } else if (rate === calpercentageRef.mid / 100 && time === 1) {
        matchResultsWithoutSpecialExpenses.current.push(spousalSupportVal);

        assignValuesToMedKeysWithoutSpecialExpenses();
      } else if (rate === calpercentageRef.high / 100 && time === 1) {
        matchResultsHighWithoutSpecialExpenses.current.push(spousalSupportVal);

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
      amountToBeDeducted = party1TaxesMinusDeductions;
      if (type === "Low") {
        changeInTaxesAndBenefitLow.current.party1 = amountToBeDeducted;
      } else if (type === "Med") {
        changeInTaxesAndBenefitMed.current.party1 = amountToBeDeducted;
      } else {
        changeInTaxesAndBenefitHigh.current.party1 = amountToBeDeducted;
      }
    } else if (partyWhoPayed === 2) {
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

      Number(OntarioChildBenefit.current.party1),
      Number(GSTHSTBenefit.current.party1),
      Number(childBenefit.current.party1),
      Number(climateChangeVal.current.party1),
      Number(childDisabilityBenefit.current.party1),
      Number(OntarioChildBenefit.current.party2),
      Number(GSTHSTBenefit.current.party2),
      Number(childBenefit.current.party2),
      Number(climateChangeVal.current.party2),
      Number(childDisabilityBenefit.current.party2)

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

            const val =
              matchResultsLowWithoutSpecialExpenses.current[
              matchResultsLowWithoutSpecialExpenses.current.length - 1
              ];

            return val;
          } else if (rate === calpercentageRef.mid / 100 && time === 1) {
            const val =
              matchResultsWithoutSpecialExpenses.current[
              matchResultsWithoutSpecialExpenses.current.length - 1
              ];

            return val;
          } else if (rate === calpercentageRef.high / 100 && time === 1) {
            const val =
              matchResultsHighWithoutSpecialExpenses.current[
              matchResultsHighWithoutSpecialExpenses.current.length - 1
              ];
            return val;
          } else if (rate === calpercentageRef.low / 100 && time === 2) {
            const val =
              specialExpensesLow.current[specialExpensesLow.current.length - 1];
            return val;
          } else if (rate === calpercentageRef.mid / 100 && time === 2) {
            const val =
              specialExpensesMed.current[specialExpensesMed.current.length - 1];

            return val;
          } else if (rate === calpercentageRef.high / 100 && time === 2) {
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
            }
            else if (rateParam === calpercentageRef.high / 100 && time === 1) {
              clearSpecialExpensesToZero();
              await calculateChildAndSpousalSupportManually(
                calpercentageRef.high / 100,
                1
              );
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
            }
            //This condition runs for the HIGH scenerio.
            else if (rateParam === 0.5 && time === 0) {
              await calculateChildAndSpousalSupportManually(0.5, 0);
            }
          } catch (err) {
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
    }
    if (data.medTaxes) {
      //clearSpecialExpensesToZero();
      await waitUntil(calpercentageRef.mid / 100, 1);
    }
    if (data.highTaxes) {
      // refButtonResetSpecialExpense.current.click();
      //clearSpecialExpensesToZero();
      await waitUntil(calpercentageRef.high / 100, 1);
    }

    if (data.highLimit) {

      //await waitUntil(0.5, 0);

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
    }
    if (data.specialExpensesMed) {
      await waitUntil(calpercentageRef.mid / 100, 2);
    }
    if (data.specialExpensesHigh) {
      await waitUntil(calpercentageRef.high / 100, 2);
    }

    assignValuesAfterAllCalculations();
  };

  const getDateofBirthParty=(PartyNum:number)=>{
    let BirthDate = PartyNum == 1 ? screen1.background.party1DateOfBirth : screen1.background.party2DateOfBirth
    return momentFunction.formatDate(BirthDate ,"YYYY/MM/DD")
  }


  const getDateofMarriage=()=>{
    return momentFunction.formatDate(screen1.aboutTheRelationship.dateOfMarriage,"YYYY/MM/DD")
  }

  const getDateofSeparation=()=>{
    return momentFunction.formatDate(screen1.aboutTheRelationship.dateOfSeparation,"YYYY/MM/DD")
  }



  const calculateChildAndSpousalSupportAuto = async () => {

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
        // childCareExpenses.current,  
        // {"bywhom":"party2" , "amount": 5000 , "type": "selected option" }

        // specialExpensesArr

        // {"name":"child1", "bywhom":"party2", "amount": 5000, "type": "selected option"}
      // ],
      "otherdeductions": [
      ],    
      "rates": {
          "low": {"rate":calpercentageRef.low, "spousal_support": -1},
          "med": {"rate":calpercentageRef.mid, "spousal_support": -1},
          "high": {"rate":calpercentageRef.high, "spousal_support": -1}
      }
     }

     

    if (checkIfAllMandatoryValuesAreFilled()) {
      setLoading(true);

      try {
      // ── Child-support-only path ────────────────────────────────────────────
      if (typeOfCalculatorSelected === CHILD_SUPPORT_CAL) {
        const childrenList: any[] = screen1.aboutTheChildren.childrenInfo ?? [];
        if (childrenList.length === 0) {
          setShowNoChildrenError(true);
          setLoading(false);
          return;
        }
        const csPayload = {
          party1_income: totalIncomeByIncomeState(income.party1) + nonTaxableIncomeParty1(),
          party2_income: totalIncomeByIncomeState(income.party2) + nonTaxableIncomeParty2(),
          party1_name: party1Name(),
          party2_name: party2Name(),
          children: childrenList.map((c: any) => ({
            name: c.name ?? "",
            csg_table: c.CSGTable ?? "No",
            child_support_override: c.ChildSupportOverride ?? 0,
            custody_arrangement: c.custodyArrangement || "Party 1",
          })),
        };

        const csResult = await calcChildSupportFlask(csPayload);

        if (!csResult) {
          setLoading(false);
          setShowFlaskError(true);
          return;
        }

        // Use gross annual amounts (party1_annual / party2_annual) — always positive.
        // child_support_ref values are post-offset and can be negative; don't use those here.
        childSupportLockedByFlask.current = true;
        childSupportReadOnly.current = {
          party1: csResult.party1_annual,
          party2: csResult.party2_annual,
        };
        childSupportRef.current = {
          party1: csResult.party1_annual,
          party2: csResult.party2_annual,
        };

        Cookies.set('demo_cal_data', JSON.stringify(objforApi), { path: '/' });
        setLoading(false);
        setShowCalculationCompleted(true);
        promptSaveOrContinue();
        return;
      }
      // ── End child-support-only path ───────────────────────────────────────

      const childrenList: any[] = screen1.aboutTheChildren.childrenInfo ?? [];
      const hasChildren = childrenList.length > 0;
      const childAges = childrenList.map((c: any) =>
        momentFunction.differenceBetweenNowAndThen(c.dateOfBirth) as number
      );
      const youngestChildAge = hasChildren ? Math.min(...childAges) : 0;

      const p1Income = totalIncomeByIncomeState(income.party1) + nonTaxableIncomeParty1();
      const p2Income = totalIncomeByIncomeState(income.party2) + nonTaxableIncomeParty2();

      // ── Call /calculate first to get Python CS amounts ───────────────────────

      if (hasChildren) {
        const csPayload = {
          party1_income: p1Income,
          party2_income: p2Income,
          party1_name: party1Name(),
          party2_name: party2Name(),
          children: childrenList.map((c: any) => ({
            name: c.name ?? "",
            csg_table: c.CSGTable ?? "No",
            child_support_override: c.ChildSupportOverride ?? 0,
            custody_arrangement: c.custodyArrangement || "Party 1",
          })),
        };
        const csResult = await calcChildSupportFlask(csPayload);

        if (!csResult) {
          setLoading(false);
          setShowFlaskError(true);
          return;
        }

        // childSupportRef / childSupportReadOnly expect GROSS annual amounts per party
        // (what each party independently owes before any set-off).
        // child_support_ref values are post-offset and party2 can be negative — don't use those here.
        childSupportLockedByFlask.current = true;
        childSupportReadOnly.current = {
          party1: csResult.party1_annual,
          party2: csResult.party2_annual,
        };
        childSupportRef.current = {
          party1: csResult.party1_annual,
          party2: csResult.party2_annual,
        };

      }
      // ── End CS pre-fetch ─────────────────────────────────────────────────────

      // Determine recipient (lower-income party) age for the SSAG formula.
      // The Flask API expects recipient_age to be the actual recipient's age.
      const p1Age = momentFunction.calculateNumberOfYears(screen1.background.party1DateOfBirth);
      const p2Age = momentFunction.calculateNumberOfYears(screen1.background.party2DateOfBirth);
      const recipientAge = p1Income >= p2Income ? p2Age : p1Age;

      const flaskPayload = {
        party1_net_income: p1Income,
        party2_net_income: p2Income,
        party1_name: party1Name(),
        party2_name: party2Name(),
        party1_age: p1Age,
        recipient_age: recipientAge,
        years: momentFunction.differenceBetweenTwoDates(
          screen1.aboutTheRelationship.dateOfMarriage,
          screen1.aboutTheRelationship.dateOfSeparation
        ),
        province: getProvinceOfParty1(),
        children: hasChildren,
        children_list: hasChildren ? childrenList : undefined,
        youngest_child_age: youngestChildAge,
        // Let the Flask API compute CS amounts from children_list + incomes
        // rather than passing potentially wrong-direction values.
      };

      const flaskResult = await calcSpousalSupportFlask(flaskPayload);

      if (flaskResult) {
        // Use the Flask API's payor/recipient determination (based on INDI
        // comparison, matching the old app's disposable-income logic) to
        // assign spousal support to the correct party slot.
        const payorIsParty1 = flaskResult.payor === party1Name();
        flaskSpousalPayorIsParty1.current = payorIsParty1;
        if (payorIsParty1) {
          // Party 1 pays → support given to Party 2
          spousalSupportLow.current.party1  = 0;
          spousalSupportLow.current.party2  = flaskResult.monthly_low;
          spousalSupportMed.current.party1  = 0;
          spousalSupportMed.current.party2  = flaskResult.monthly_med;
          spousalSupportHigh.current.party1 = 0;
          spousalSupportHigh.current.party2 = flaskResult.monthly_high;
        } else {
          // Party 2 pays → support given to Party 1
          spousalSupportLow.current.party1  = flaskResult.monthly_low;
          spousalSupportLow.current.party2  = 0;
          spousalSupportMed.current.party1  = flaskResult.monthly_med;
          spousalSupportMed.current.party2  = 0;
          spousalSupportHigh.current.party1 = flaskResult.monthly_high;
          spousalSupportHigh.current.party2 = 0;
        }

        // Store INDI (disposable income) values, mapping payor/recipient → party1/party2
        if (payorIsParty1) {
          disposableIncomeRef.current = {
            party1Low: flaskResult.payor_indi_low ?? 0,
            party1Mid: flaskResult.payor_indi_mid ?? 0,
            party1High: flaskResult.payor_indi_high ?? 0,
            party2Low: flaskResult.recipient_indi_low ?? 0,
            party2Mid: flaskResult.recipient_indi_mid ?? 0,
            party2High: flaskResult.recipient_indi_high ?? 0,
          };
        } else {
          disposableIncomeRef.current = {
            party1Low: flaskResult.recipient_indi_low ?? 0,
            party1Mid: flaskResult.recipient_indi_mid ?? 0,
            party1High: flaskResult.recipient_indi_high ?? 0,
            party2Low: flaskResult.payor_indi_low ?? 0,
            party2Mid: flaskResult.payor_indi_mid ?? 0,
            party2High: flaskResult.payor_indi_high ?? 0,
          };
        }

        // Store taxes and benefits from API, mapping payor/recipient → party1/party2
        if (payorIsParty1) {
          taxesFromApiRef.current = {
            party1Low: flaskResult.payor_taxes_low ?? 0,
            party1Mid: flaskResult.payor_taxes_mid ?? 0,
            party1High: flaskResult.payor_taxes_high ?? 0,
            party2Low: flaskResult.recipient_taxes_low ?? 0,
            party2Mid: flaskResult.recipient_taxes_mid ?? 0,
            party2High: flaskResult.recipient_taxes_high ?? 0,
          };
          benefitsFromApiRef.current = {
            party1Low: flaskResult.payor_benefits_low ?? 0,
            party1Mid: flaskResult.payor_benefits_mid ?? 0,
            party1High: flaskResult.payor_benefits_high ?? 0,
            party2Low: flaskResult.recipient_benefits_low ?? 0,
            party2Mid: flaskResult.recipient_benefits_mid ?? 0,
            party2High: flaskResult.recipient_benefits_high ?? 0,
          };
        } else {
          taxesFromApiRef.current = {
            party1Low: flaskResult.recipient_taxes_low ?? 0,
            party1Mid: flaskResult.recipient_taxes_mid ?? 0,
            party1High: flaskResult.recipient_taxes_high ?? 0,
            party2Low: flaskResult.payor_taxes_low ?? 0,
            party2Mid: flaskResult.payor_taxes_mid ?? 0,
            party2High: flaskResult.payor_taxes_high ?? 0,
          };
          benefitsFromApiRef.current = {
            party1Low: flaskResult.recipient_benefits_low ?? 0,
            party1Mid: flaskResult.recipient_benefits_mid ?? 0,
            party1High: flaskResult.recipient_benefits_high ?? 0,
            party2Low: flaskResult.payor_benefits_low ?? 0,
            party2Mid: flaskResult.payor_benefits_mid ?? 0,
            party2High: flaskResult.payor_benefits_high ?? 0,
          };
        }
      } else {
        setLoading(false);
        setShowFlaskError(true);
        return;
      }

      Cookies.set('demo_cal_data', JSON.stringify(objforApi), { path: '/' });

      setLoading(false);
      setShowCalculationCompleted(true);
      promptSaveOrContinue();

      //else if if any party has more income and also have child custody,
      //then spousal support will be calculated by years of living together (same as highlimit and when there is no child.)
      } catch (err) {
        console.error("[Calculator] calculateChildAndSpousalSupportAuto error:", err);
        setShowFlaskError(true);
      } finally {
        setLoading(false);
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

  const fetchDistinctTaxYears = async () => {
    setLoading(true);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    );

    try {
      const res = await Promise.race([getDistinctYearsInTaxRef(), timeout]);
      const year = screen2.tax_year !== -1 ? screen2.tax_year : 2025;
      setDistinctYears({ allYears: res, selectedYear: year });

      try {
        await fetchFederalDBValues(year, getProvinceOfParty1());
      } catch {
        // optional — continue without it
      }
    } catch {
      setDistinctYears({ allYears: [{ year: 2025 }], selectedYear: 2025 });
    } finally {
      setLoading(false);
    }
  };
  const checkIfScreen1OptionsFilled = () => {
    if (
      screen1.background.party1DateOfBirth === "" ||
      screen1.background.party2DateOfBirth === "" ||
      getProvinceOfParty1() === "" ||
      getProvinceOfParty2() === ""
    ) {
      history.push(
        `${AUTH_ROUTES.CALCULATOR
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

  const promptSaveOrContinue = () => {
    // Save all calculator form data to the matter's DB record
    if (storedMatterNumber) {
      const calcState = {
        background: screen1.background,
        aboutTheChildren: screen1.aboutTheChildren,
        aboutTheRelationship: screen1.aboutTheRelationship,
        calculator_type: typeOfCalculatorSelected,
        income: screen2.income,
        undueHardshipIncome: screen2.undueHardshipIncome,
        benefits: screen2.benefits,
        deductions: screen2.deductions,
        tax_year: screen2.tax_year,
        guidelineIncome: screen2.guidelineIncome,
        specialExpensesArr: screen2.specialExpensesArr,
        otherhouseholdmember: screen2.otherhouseholdmember,
        nonTaxableincome,
        undueHardship,
        canadaChildBenefitFixed: screen2.canadaChildBenefitFixed,
        ChildDisabilityBenefitFixed: screen2.ChildDisabilityBenefitFixed,
        ClimateActionBenefitFixed: screen2.ClimateActionBenefitFixed,
        provChildBenefitFixed: screen2.provChildBenefitFixed,
        GSTHSTBenefitFixed: screen2.GSTHSTBenefitFixed,
        salesTaxBenefitFixed: screen2.salesTaxBenefitFixed,
        basicPersonalAmountFederalFixed: screen2.basicPersonalAmountFederalFixed,
        basicPartyDisabilityFixed: screen2.basicPartyDisabilityFixed,
        basicPartyDisabilityProvFixed: screen2.basicPartyDisabilityProvFixed,
        amountForEligibleDependentFixed: screen2.amountForEligibleDependentFixed,
        baseCPPContributionFixed: screen2.baseCPPContributionFixed,
        eiPremiumFixed: screen2.eiPremiumFixed,
        canadaEmploymentAmountFixed: screen2.canadaEmploymentAmountFixed,
        basicPersonalAmountProvincialFixed: screen2.basicPersonalAmountProvincialFixed,
        amountForEligibleDependentProvincialFixed: screen2.amountForEligibleDependentProvincialFixed,
      };
      const sid = getUserSID();

      // 1) Save full calculator state
      fetchRequest(
        "post",
        `update_matter/${sid}/${storedMatterNumber}/calculatorState`,
        [calcState]
      ).then(() => {
      }).catch((err) => {
        console.warn("[Calculator] Failed to save calculator state:", err);
      });

      // ── Merge with raw intake data so intake-only fields aren't lost ──
      const rawBg = rawIntakeData?.current?.background || [];
      const rawClientBg = rawBg.find((r: any) => r.role === "Client") || {};
      const rawOpposingBg = rawBg.find((r: any) => r.role === "Opposing Party") || {};
      const rawChildren = rawIntakeData?.current?.children || [];
      const rawRel = rawIntakeData?.current?.relationship || {};

      // 2) Save client/opposing party background details — merged with intake
      const bg = screen1.background;
      fetchRequest(
        "post",
        `update_matter/${sid}/${storedMatterNumber}/background`,
        [
          {
            ...rawClientBg, // preserve intake-only fields (address, phone, email, postalCode, municipality, etc.)
            id: 1,
            role: "Client",
            name: `${bg.party1FirstName || ""} ${bg.party1LastName || ""}`.trim() || "",
            dateOfBirth: bg.party1DateOfBirth || "",
            province: bg.party1province || "",
            liveInOntario: bg.party1LiveInOntario || "",
            liveInRural: bg.party1LiveInRural || "",
            eligibleForDisability: bg.party1eligibleForDisability || "",
            exemptFromCanadaPension: bg.party1ExemptFromCanadaPension || "",
            exemptFromEmploymentPremium: bg.party1ExemptFromEmploymentPremium || "",
          },
          {
            ...rawOpposingBg, // preserve intake-only fields
            id: 2,
            role: "Opposing Party",
            name: `${bg.party2FirstName || ""} ${bg.party2LastName || ""}`.trim() || "",
            dateOfBirth: bg.party2DateOfBirth || "",
            province: bg.party2province || "",
            liveInOntario: bg.party2LiveInOntario || "",
            liveInRural: bg.party2LiveInRural || "",
            eligibleForDisability: bg.party2eligibleForDisability || "",
            exemptFromCanadaPension: bg.party2ExemptFromCanadaPension || "",
            exemptFromEmploymentPremium: bg.party2ExemptFromEmploymentPremium || "",
          },
        ]
      ).then(() => {
      }).catch((err) => {
        console.warn("[Calculator] Failed to save background details:", err);
      });

      // 3) Save children details — merged with intake-only fields
      const childrenRows = (screen1.aboutTheChildren?.childrenInfo || []).map((child: any, i: number) => {
        // Find the matching raw intake child row to preserve extra fields
        const rawChild = rawChildren[i] || {};
        return {
          ...rawChild,
          id: i + 1,
          childName: child.name || "",
          dateOfBirth: child.dateOfBirth || "",
          livesWith: child.custodyArrangement || "",
          childHasDisability: child.childHasDisability || "No",
          childOfRelationship: child.childOfRelationship || "Yes",
          adultChildStillALegalDependant: child.adultChildStillALegalDependant || "Yes",
          childIncome: child.childIncome || 0,
        };
      });
      if (childrenRows.length > 0) {
        fetchRequest(
          "post",
          `update_matter/${sid}/${storedMatterNumber}/children`,
          childrenRows
        ).then(() => {
        }).catch((err) => {
          console.warn("[Calculator] Failed to save children details:", err);
        });
      }

      // 4) Save relationship details — merged with intake-only fields
      const rel = screen1.aboutTheRelationship;
      fetchRequest(
        "post",
        `update_matter/${sid}/${storedMatterNumber}/relationship`,
        [{
          ...rawRel, // preserve dateOfCohabitation, placeOfMarriage, etc.
          id: 1,
          dateOfMarriage: rel.dateOfMarriage || "",
          dateOfSeparation: rel.dateOfSeparation || "",
        }]
      ).then(() => {
      }).catch((err) => {
        console.warn("[Calculator] Failed to save relationship details:", err);
      });

      // 5) Save income to income_benefits so intake forms see calculator changes.
      // Convert calculator's {label, amount, value} items → intake's
      // {type, yearlyAmount, monthlyAmount, role, incomeBenefit} rows.
      // The calculator items now use dropdown labels like "10100 - Employment Income"
      // with value like "10100". Use calcValueToIntakeType to map back to intake names.
      const incomeToIntakeRows = (partyItems: any[], roleLabel: string) =>
        (partyItems || [])
          .filter((item: any) => item.label && item.amount && item.amount !== "0")
          .map((item: any) => ({
            type: calcValueToIntakeType[item.value] || item.label,
            yearlyAmount: String(item.amount || "0"),
            monthlyAmount: String(Math.round(parseFloat(item.amount || "0") / 12)),
            role: roleLabel,
            incomeBenefit: "income",
          }));

      const incomeRows = [
        ...incomeToIntakeRows(screen2.income?.party1, "Client"),
        ...incomeToIntakeRows(screen2.income?.party2, "Opposing Party"),
      ];

      // Preserve existing benefit rows from intake (calculator doesn't modify benefits)
      const rawIncomeBenefits = rawIntakeData?.current?.incomeBenefits || [];
      const clientBenefitRows = rawIncomeBenefits.filter(
        (r: any) => r.role === "Client" && r.incomeBenefit === "benefit"
      );
      const opposingBenefitRows = rawIncomeBenefits.filter(
        (r: any) => (r.role === "Opposing Party" || r.role === "opposingParty") && r.incomeBenefit === "benefit"
      );

      // Post in the shape that UPDATE_SECTION_MAP.incomeBenefits expects:
      // { incomeBenefits: { client: { income: [...] }, opposingParty: { income: [...] } } }
      const incomeBenefitsBody = {
        incomeBenefits: {
          client: {
            income: incomeRows.filter((r: any) => r.role === "Client"),
            benefit: clientBenefitRows,
          },
          opposingParty: {
            income: incomeRows.filter((r: any) => r.role === "Opposing Party"),
            benefit: opposingBenefitRows,
          },
        },
      };
      fetchRequest(
        "post",
        `update_matter/${sid}/${storedMatterNumber}/incomeBenefits`,
        incomeBenefitsBody
      ).then(() => {
      }).catch((err) => {
        console.warn("[Calculator] Failed to save income_benefits:", err);
      });
    }

    passStateToParentAndNextPage(
      Number(getCalculatorIdFromQuery(calculatorId)),
      false
    );
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
          //year to be added later in DB
          resolve(true);
        })
        .catch((err) => {
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
    fetchDistinctTaxYears().then((response) => {
      calculateDurationOfSupport();
      checkIfScreen1OptionsFilled();
      modifyScreen1PropIfChildIsAbove18();
      modifyScreen1PropsIfChildShared();
      calculateChildSupport();

      setCount((prev: any) => prev + 1);
      setLoading(false);
      // setTimeout(() => {
      //   calculateAllOperationsForParty1();

      //   calculateAllOperationsForParty2();
      // }, 2000);
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

   if( specialExpensesRef.current.party1 !== 0 ) {

   }

  

    return province === "ON" &&  specialExpensesRef.current.party1 !== 0 
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

    return province === "ON" &&  specialExpensesRef.current.party2 !== 0 
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

    // if(specialExpensesRef.current.party1 !== 0){
    //   if (partyNum === 1) {
    //     provincialCredits.current = {
    //       ...provincialCredits.current,
    //       party1: calculateProvincialCreditsParty1(),
    //     };
    //   } else {
    //     provincialCredits.current = {
    //       ...provincialCredits.current,
    //       party2: calculateProvincialCreditsParty2(),
    //     };
    //   }

    // }else{
    //   provincialCredits.current = {
    //     party1: 0,
    //     party2: 0,
    //   };
    // }


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
    // Force re-render so RenderCalculationValues picks up fresh ref values
    setCalcVersion((v) => v + 1);
    // }
  }, [count, childCareExpenses, income, nonTaxableincome, fetchedDynamicValues]);

 







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
    fetchFederalDBValues(event.label, getProvinceOfParty1())
      .then((res) => {
        allValuesRefreshed();
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error refreshing tax data for year:", err);
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
      <>
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
        <ModalInputCenter
          heading="Calculation Failed"
          handleClick={() => setShowFlaskError(false)}
          changeShow={() => setShowFlaskError(false)}
          show={showFlaskError}
          action="Ok"
          cancelOption="Cancel"
        >
          <p className="heading-5">
            The spousal support calculation could not be completed. Please ensure the backend is running and try again.
          </p>
        </ModalInputCenter>
        <ModalInputCenter
          heading="No Children Added"
          handleClick={() => setShowNoChildrenError(false)}
          changeShow={() => setShowNoChildrenError(false)}
          show={showNoChildrenError}
          action="Ok"
          cancelOption="Cancel"
        >
          <p className="heading-5">
            Please add at least one child in the Background section before running a child support calculation.
          </p>
        </ModalInputCenter>
      </>
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
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_488_23869)">
                    <path
                      d="M44.5576 13.4129L43.8094 12.6647L43.35 12.2052L42.9325 11.7878L42.4732 11.3285L37.8142 6.66969L37.814 6.66951L37.5918 6.44727V6.48483V12.7369V13.2385V13.7626H44.9073L44.5576 13.4129Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M13.7617 38.7652H17.256H21.2471C21.5249 38.7652 21.7621 38.5881 21.8519 38.3408C21.8767 38.2726 21.8902 38.1987 21.8902 38.1219V30.6367H13.7617V38.7652ZM14.6803 31.9909H16.9434H20.9718V34.0821V34.4435H14.6803V31.9909ZM14.6803 34.9583H20.9718V37.411H14.6803V34.9583Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M4.17969 30.6367V31.3073V35.693V38.1219C4.17969 38.3388 4.28757 38.5309 4.45245 38.6475C4.55719 38.7215 4.68506 38.7652 4.82273 38.7652H4.96503H12.3081V31.0588V30.6367H11.4438H4.17969ZM10.9961 36.3975L9.96412 37.4295L9.9545 37.4391L9.6092 37.7842L9.60105 37.7924L8.24391 36.4352L7.24002 37.4391L7.11844 37.5605L6.88658 37.7924L5.50575 36.4115L5.1523 36.0583L5.50575 35.7048L6.23243 34.9781L6.50963 34.7009L5.1523 33.3436L5.50575 32.9903L6.53332 31.9628L6.88658 31.6095L7.24002 31.9628L8.24391 32.9667L9.2478 31.9628L9.60105 31.6095L9.9545 31.9628L11.3353 33.3436L11.2313 33.4476L10.9821 33.697L10.8766 33.8025L9.97818 34.7009L10.168 34.8908L10.523 35.2457L10.9821 35.7048L11.1662 35.8891L11.1667 35.8897L11.3353 36.0583L10.9961 36.3975Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M36.1383 15.2162V13.3729V12.8713V5.41992H34.4833H33.9816H15.5918C15.4433 5.41992 15.2985 5.43769 15.1601 5.47155C14.3587 5.66585 13.7617 6.38939 13.7617 7.25005V11.8331H21.2471C22.4031 11.8331 23.3437 12.7736 23.3437 13.9298V38.1223C23.3437 38.3023 23.321 38.4772 23.278 38.6441C23.1744 39.0469 22.9538 39.4033 22.6548 39.6746C22.2825 40.0127 21.7884 40.2189 21.2471 40.2189H13.7617V44.802C13.7617 45.7744 14.5239 46.5719 15.4823 46.6287C15.5186 46.631 15.555 46.6321 15.5918 46.6321H17.6189H23.0536H44.1045C45.1137 46.6321 45.9346 45.8112 45.9346 44.802V44.4944V43.9757V15.2162H36.1383ZM42.2118 31.8882C42.6178 32.3288 42.925 32.8759 43.125 33.5142C43.2307 33.8513 43.3079 34.219 43.356 34.6141C43.356 34.6143 43.356 34.6143 43.356 34.6143C43.3959 34.9407 43.4159 35.2853 43.4159 35.6469C43.4159 35.8854 43.4067 36.1171 43.3882 36.341C43.3884 36.3412 43.3882 36.3413 43.3882 36.3413C43.3464 36.8502 43.257 37.3201 43.1211 37.7442C42.9193 38.3747 42.6099 38.9211 42.2016 39.3684C41.3843 40.2642 40.3578 40.7185 39.1507 40.7185C37.9574 40.7185 36.9496 40.2668 36.155 39.376C35.7581 38.9307 35.4579 38.3724 35.2629 37.7164C35.0754 37.0852 34.9803 36.345 34.9803 35.5166C34.9803 34.65 35.1239 33.8598 35.4087 33.1546C35.5654 32.7662 35.7651 32.4039 36.007 32.0684C36.007 32.0682 36.007 32.0682 36.0071 32.068C36.0081 32.0665 36.0092 32.0651 36.0103 32.0636C36.3704 31.5656 36.821 31.1859 37.3495 30.935C37.8171 30.7129 38.3517 30.5893 38.9411 30.5671C38.9413 30.5671 38.9413 30.5671 38.9413 30.5671C39.0066 30.5645 39.0725 30.5632 39.1391 30.5632C39.5941 30.5632 40.0221 30.6243 40.422 30.7458C40.4222 30.7458 40.4222 30.7458 40.4222 30.7458C41.103 30.9525 41.7018 31.3343 42.2118 31.8882ZM40.6211 22.1844L36.9013 29.3861V29.3863L35.4922 32.1143L32.9329 37.0686L32.9326 37.0697L31.7338 39.3904L31.1876 40.4481L31.0478 40.7185H28.1607L28.5386 39.989L30.596 36.0177L30.5965 36.0168L33.0963 31.1911L33.0965 31.1909L38.0001 21.7253L38.1398 21.4555H38.7157H39.2547H40.9975L40.6211 22.1844ZM25.8587 25.0514V25.0512C25.8585 25.051 25.8585 25.051 25.8587 25.0508C25.8585 25.0506 25.8585 25.0506 25.8587 25.0504C26.0167 24.2729 26.3174 23.5739 26.7582 22.9625C27.1185 22.4627 27.5686 22.0815 28.0956 21.8293C28.6141 21.5813 29.2144 21.4555 29.88 21.4555C30.87 21.4555 31.7334 21.7436 32.4553 22.3139H32.4555C32.6313 22.4527 32.7984 22.6082 32.9572 22.7803C33.2081 23.0523 33.4213 23.365 33.5947 23.7144L33.5949 23.7146C33.7024 23.9313 33.7947 24.162 33.8715 24.4063C34.0649 25.0221 34.1628 25.7397 34.1628 26.5391C34.1628 26.8117 34.1507 27.075 34.1267 27.3282C34.0817 27.801 33.9953 28.239 33.8676 28.6367C33.6654 29.2673 33.3554 29.8138 32.9464 30.261C32.9398 30.2684 32.9329 30.2756 32.9261 30.283C32.1111 31.1641 31.0943 31.6108 29.9035 31.6108C28.7088 31.6108 27.6999 31.1615 26.9046 30.2755C26.5066 29.8319 26.2057 29.2736 26.0103 28.6159C25.915 28.2951 25.8435 27.9459 25.7963 27.5708C25.7963 27.5708 25.7962 27.5708 25.7963 27.5706C25.7505 27.2068 25.7273 26.8188 25.7273 26.4091C25.7273 25.9335 25.7712 25.4803 25.8587 25.0514Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M39.1972 33.0391C38.8291 33.0391 38.5397 33.1843 38.2892 33.4958C38.281 33.5059 38.2731 33.5161 38.2649 33.5267C38.1396 33.6895 37.9986 33.9948 37.9157 34.567C37.8713 34.872 37.8438 35.2528 37.8438 35.7282C37.8438 36.9484 38.0752 37.5019 38.2694 37.7511C38.3128 37.8068 38.3571 37.8577 38.4024 37.9036C38.6287 38.1327 38.8815 38.2408 39.1854 38.2408C39.3643 38.2408 39.5245 38.2078 39.6704 38.1396C39.8406 38.06 39.9911 37.9325 40.1289 37.7534C40.2701 37.5696 40.4315 37.2064 40.5072 36.4882C40.5266 36.3028 40.5403 36.0938 40.5466 35.8581C40.5492 35.7643 40.5505 35.666 40.5505 35.5635C40.5505 34.3255 40.3195 33.7715 40.1258 33.5248C39.8656 33.1934 39.5706 33.0391 39.1972 33.0391Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M29.9391 29.1333C30.3212 29.1333 30.6188 28.9782 30.8759 28.6453C31.0687 28.3955 31.2986 27.8129 31.2986 26.456C31.2986 25.2187 31.067 24.6646 30.8727 24.4177C30.6115 24.0862 30.3148 23.9316 29.9391 23.9316C29.5654 23.9316 29.2716 24.0867 29.0145 24.4197C28.8217 24.6695 28.5918 25.2541 28.5918 26.6207C28.5918 27.8491 28.8233 28.4009 29.0175 28.6475C29.2785 28.979 29.5713 29.1333 29.9391 29.1333Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M4.17969 21.0547V21.2284V29.1831H12.3081V21.0547H6.062H4.17969ZM6.44228 23.8926H6.94413H7.01759V23.3486V22.8467V21.9731H9.47023V23.8926H11.3895V26.3452H11.0592H10.5576H9.47023V26.5092V27.011V28.2646H7.01759V26.3452H5.09808V23.8926H6.44228Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M21.4836 19.6024H21.8901V13.9303C21.8901 13.6108 21.656 13.345 21.3503 13.2954C21.3167 13.2899 21.2821 13.2871 21.2469 13.2871H20.8827H20.3476H4.82273C4.48391 13.2871 4.20541 13.5506 4.18135 13.8837C4.18024 13.8991 4.17969 13.9146 4.17969 13.9303V19.6024H16.3716H21.4836Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M21.8902 24.0044V21.0547H21.618H21.1163H13.7617V29.1831H16.8134H21.8902V24.0044ZM14.6803 26.3452V23.8926H20.9718V26.3452H14.6803Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M34.9405 5.41951L35.545 11.9678L35.5909 12.4654L36.0883 12.4195L36.1396 12.4147L37.5928 12.2806L42.9335 11.7876L43.3728 11.7471L44.5739 11.6362L43.6463 10.8653L35.6894 4.25333L34.7617 3.48242L34.8726 4.68357L34.9405 5.41951ZM37.5928 6.48465V6.44708L37.8152 6.66951L43.3269 11.2496L42.4742 11.3283L37.5928 11.7789L36.1396 11.913L36.0424 11.9219L35.4423 5.41951L35.3702 4.63768L37.5928 6.48465Z"
                      fill="#171D34"
                    />
                    <path
                      d="M2.85741 21.3506L3.35482 21.3045L4.18124 21.2283V21.0545H6.06356L11.449 20.5575L12.8963 20.4239L20.9905 19.6766L21.4879 19.6308L21.4851 19.6011H16.3732L12.8502 19.9263L11.4031 20.0599L3.30892 20.8071L2.78764 15.1591C2.75507 14.8058 3.01581 14.492 3.36888 14.4594L4.18124 14.3844L16.0828 13.2858L19.7235 12.9498C19.9881 12.9253 20.2305 13.0656 20.3491 13.2858H20.8843C20.7401 12.7625 20.2364 12.4005 19.6776 12.4522L10.6463 13.2858L4.18291 13.8824L3.32299 13.9618C2.69549 14.0197 2.23213 14.5774 2.29005 15.2049L2.81151 20.853L2.85741 21.3506Z"
                      fill="#171D34"
                    />
                    <path
                      d="M21.1167 21.0555H21.6184L21.5746 20.5814L21.5287 20.084L21.0311 20.1299L12.937 20.8769L12.4395 20.923L12.4855 21.4204L13.2326 29.5146L13.2785 30.012L13.7761 29.9661L21.8701 29.2189L22.3677 29.173L22.3218 28.6756L21.8906 24.0052V29.1839H16.8138L13.7302 29.4685L12.9829 21.3745L13.7622 21.3025L16.4387 21.0555L21.0771 20.6273L21.1167 21.0555Z"
                      fill="#171D34"
                    />
                    <path
                      d="M20.425 23.5371L19.9275 23.583L14.6577 24.0695L14.1602 24.1154L14.2061 24.6129L14.3397 26.0602L14.3856 26.5577L14.8831 26.5117L20.153 26.0253L20.6505 25.9794L20.6045 25.4818L20.471 24.0346L20.425 23.5371ZM14.8372 26.0142L14.7036 24.567L19.9735 24.0805L20.107 25.5277L14.8372 26.0142Z"
                      fill="#171D34"
                    />
                    <path
                      d="M22.1124 38.8191C22.7399 38.7612 23.2033 38.2037 23.1454 37.5762L22.4574 30.1224L22.4115 29.625L21.9139 29.6709L13.8199 30.4181L13.3223 30.464L13.3682 30.9614L13.7642 35.251L14.0886 38.7655L14.1154 39.0556L14.1613 39.553L14.6589 39.5071L22.1124 38.8191ZM14.5902 38.7655L13.8658 30.9155L16.8832 30.637L21.9598 30.1685L22.6478 37.6221C22.6804 37.9751 22.4196 38.289 22.0665 38.3215L21.8543 38.3412C21.7645 38.5884 21.5273 38.7655 21.2496 38.7655H17.2584L14.6128 39.0097L14.5902 38.7655Z"
                      fill="#171D34"
                    />
                    <path
                      d="M21.6681 36.9969L21.6221 36.4994L21.4885 35.0522L21.4426 34.5547L20.9451 34.6006L15.6753 35.0871L15.1777 35.133L15.2237 35.6305L15.3572 37.0777L15.4032 37.5753L15.9007 37.5293L21.1705 37.0429L21.6681 36.9969ZM15.8548 37.0318L15.7212 35.5846L20.991 35.0981L21.1246 36.5453L15.8548 37.0318Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.057 34.4429L20.8971 34.0885L20.9737 34.0815V31.9902H16.9454L15.4019 32.1327L14.9043 32.1786L14.9502 32.676L15.0838 34.1233L15.1132 34.4429L15.1297 34.6209L15.6273 34.5748L17.057 34.4429ZM15.4478 32.6301L20.7176 32.1436L20.8512 33.5909L15.5814 34.0774L15.4478 32.6301Z"
                      fill="#171D34"
                    />
                    <path
                      d="M12.3291 30.098L12.8267 30.0521L12.7808 29.5545L12.3091 24.4451L12.0335 21.4605L11.996 21.0537L11.9877 20.9629L11.4901 21.0088L11.003 21.0537L4.18064 21.6837L3.39603 21.756L2.89844 21.8019L2.94451 22.2995L3.69156 30.3935L3.73745 30.8911L4.18064 30.8502L4.23504 30.8452L6.50614 30.6356L12.3291 30.098ZM4.18915 30.3476L3.44193 22.2536L4.18064 22.1853L11.5361 21.5064L12.2445 29.1822L12.2832 29.6004L4.18915 30.3476Z"
                      fill="#171D34"
                    />
                    <path
                      d="M10.8833 24.4184L10.3857 24.4645L8.97198 24.595L8.84152 23.1812L8.79544 22.6836L8.29803 22.7295L7.01953 22.8475V23.3494L8.34392 23.2271L8.52046 25.1384L10.4316 24.9619L10.5595 26.3461H11.0612L10.9292 24.916L10.8833 24.4184Z"
                      fill="#171D34"
                    />
                    <path
                      d="M8.80957 28.2645L8.83103 28.496L7.38377 28.6296L7.35009 28.2645L7.20741 26.7183L7.02015 26.7355L5.29605 26.8948L5.24535 26.3452L5.16244 25.4475L7.07381 25.2712L6.94668 23.8926H6.44483L6.53032 24.8195L5.11655 24.9499L5.10064 24.9514L4.61914 24.996L4.66503 25.4934L4.79864 26.9407L4.84453 27.4381L5.34194 27.3922L6.7559 27.2618L6.88636 28.6755L6.93225 29.1731L7.42984 29.127L8.87692 28.9936L9.37452 28.9476L9.32844 28.4501L9.31123 28.2645L9.19798 27.0364L9.47278 27.011V26.5092L8.6545 26.5847L8.80957 28.2645Z"
                      fill="#171D34"
                    />
                    <path
                      d="M12.9161 31.0035L12.87 30.5059L12.3726 30.5518L11.4464 30.6372H12.3108V31.0593L12.4185 31.0493L13.1657 39.1434L5.71193 39.8316C5.35886 39.8641 5.04501 39.6032 5.01244 39.2501L4.96766 38.7657H4.82536C4.68768 38.7657 4.55982 38.722 4.45508 38.648L4.51485 39.296C4.57277 39.9235 5.13051 40.3869 5.75801 40.329L13.2116 39.641L13.709 39.5951L13.6631 39.0975L12.9161 31.0035Z"
                      fill="#171D34"
                    />
                    <path
                      d="M3.82519 31.8412L4.18067 35.6923V31.3066L3.7793 31.3437L3.82519 31.8412Z"
                      fill="#171D34"
                    />
                    <path
                      d="M8.64964 34.4455L9.87652 32.9692L10.8784 33.8019L10.9838 33.6964L11.2331 33.447L10.1957 32.585L9.81157 32.2656L9.49217 32.65L8.58469 33.7419L7.49272 32.8345L7.10856 32.5153L6.78917 32.8994L5.86041 34.0173L5.84579 34.0347L5.54102 34.4015L5.92518 34.7208L6.23421 34.9775L7.01733 35.6281L6.10985 36.7203L5.9768 36.8802L5.79046 37.1045L6.17481 37.4239L7.2925 38.3526L7.67685 38.672L7.99624 38.2877L8.90353 37.1957L9.51475 37.7036L9.61097 37.7836L9.9955 38.1032L10.3798 38.4224L10.6991 38.0382L11.628 36.9205L11.9474 36.5362L11.5631 36.2168L11.1685 35.8891L11.168 35.8885L10.4711 35.3095L10.5247 35.2451L10.1698 34.8902L9.76752 35.3744L10.9979 36.3968L11.2437 36.6011L10.3149 37.7188L9.9659 37.4288L8.83858 36.4921L8.59561 36.7845L7.61189 37.9684L7.12022 37.5599L6.49402 37.0395L7.72089 35.5632L6.24457 34.3365L7.17351 33.2188L8.64964 34.4455Z"
                      fill="#171D34"
                    />
                    <path
                      d="M36.1406 13.3722L37.5938 13.238V12.7363L36.1406 12.8705V13.3722Z"
                      fill="#171D34"
                    />
                    <path
                      d="M45.9365 22.8961L45.2276 15.2155L44.982 12.5562L44.9361 12.0586L44.4385 12.1045L43.3516 12.2048L43.811 12.6643L44.4844 12.6021L44.5592 13.4124L44.5916 13.7622L44.7257 15.2155L45.9365 28.3327L47.2039 42.0627C47.2842 42.9336 46.7378 43.7202 45.9365 43.975V44.4937C47.0383 44.2243 47.8088 43.1793 47.7015 42.0167L45.9365 22.8961Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.1567 46.675C16.9517 46.6939 16.7512 46.6782 16.5614 46.6323C15.8208 46.4539 15.2401 45.8207 15.1661 45.0207L14.7449 40.457L17.323 40.219L22.1985 39.769C22.3571 39.7544 22.5101 39.7224 22.6556 39.6748C23.5061 39.398 24.1025 38.5964 24.1025 37.6828C24.1025 37.6186 24.0997 37.5538 24.0936 37.4887L23.3445 29.3737L21.8699 13.3983C21.8086 12.7347 21.4428 12.1712 20.9232 11.8333C20.5414 11.585 20.0769 11.4584 19.5895 11.5034L16.0149 11.8333L12.1358 12.1914L11.7144 7.62774C11.6217 6.62292 12.3637 5.72988 13.3686 5.63717L15.1609 5.47174L15.72 5.42011L33.8281 3.74857L33.9824 5.42011H34.4841L34.3255 3.70267L34.2796 3.20508L33.782 3.25097L13.3227 5.13958C12.0434 5.25764 11.0989 6.39439 11.217 7.67363L11.6382 12.2373L11.6842 12.7349L12.1817 12.689L19.6354 12.001C20.4617 11.9246 21.2013 12.4953 21.3514 13.295C21.3606 13.3441 21.3677 13.3939 21.3723 13.4444L21.8912 19.0654L23.3445 34.8103L23.596 37.5345C23.6341 37.9468 23.5111 38.3377 23.2788 38.6443C23.0174 38.9898 22.6171 39.2287 22.1526 39.2714L14.6991 39.9596L14.2015 40.0055L14.2211 40.219L14.2474 40.5029L14.6687 45.0668C14.727 45.6981 15.0336 46.2481 15.4831 46.6289C15.9439 47.0196 16.5551 47.2322 17.2028 47.1724L23.0544 46.6323H17.6197L17.1567 46.675Z"
                      fill="#171D34"
                    />
                    <path
                      d="M33.8026 24.9589C33.7291 24.1629 33.5655 23.4573 33.3164 22.8617C33.0583 22.2447 32.7017 21.7282 32.2565 21.3267C31.3683 20.5258 30.2964 20.1772 29.0706 20.2903C28.4078 20.3515 27.8216 20.532 27.328 20.8267C26.8264 21.1262 26.4135 21.5473 26.1007 22.0781C25.5066 23.086 25.2678 24.2726 25.3908 25.6046C25.4672 26.4333 25.6303 27.164 25.8754 27.7762C26.1304 28.4132 26.4813 28.9415 26.9185 29.3465C27.7919 30.1557 28.8379 30.5104 30.0274 30.4006C31.223 30.2902 32.2007 29.7439 32.9336 28.7767C33.2997 28.2938 33.5581 27.7211 33.7014 27.0747C33.8403 26.4484 33.8744 25.7366 33.8026 24.9589ZM32.5353 28.475C31.8875 29.33 31.0363 29.8057 29.9815 29.9031C28.9345 29.9997 28.0266 29.692 27.258 28.98C26.4895 28.268 26.033 27.1273 25.8883 25.5587C25.7746 24.3275 25.9889 23.2518 26.5311 22.3317C27.0733 21.4117 27.9353 20.8969 29.1165 20.7879C30.2026 20.6876 31.1379 20.9909 31.9219 21.6977C32.7055 22.4045 33.1668 23.5067 33.3051 25.0048C33.4398 26.4637 33.1832 27.6204 32.5353 28.475Z"
                      fill="#171D34"
                    />
                    <path
                      d="M33.8693 28.6366C33.9969 28.2389 34.0834 27.8009 34.1283 27.3281L32.9277 30.283C32.9346 30.2756 32.9414 30.2684 32.9481 30.261C33.357 29.8137 33.667 29.2672 33.8693 28.6366Z"
                      fill="#171D34"
                    />
                    <path
                      d="M38.7166 21.4551L31.655 38.8955L29.9009 39.0575L33.0973 31.1907L30.5975 36.0164L30.5969 36.0173L29.4381 38.8694L29.1289 39.6305L29.947 39.5549L31.7009 39.3931L31.7348 39.39L32.0038 39.365L32.1182 39.083L32.9335 37.0693L32.9339 37.0682L39.2557 21.4551H38.7166Z"
                      fill="#171D34"
                    />
                    <path
                      d="M43.3682 31.0812C43.1104 30.4641 42.7542 29.9474 42.3095 29.5459C41.4224 28.745 40.3519 28.396 39.1278 28.509C38.4627 28.5705 37.8746 28.7504 37.38 29.0438C37.2105 29.1443 37.0514 29.2585 36.9028 29.3858V29.386C36.6096 29.6371 36.3578 29.9398 36.1502 30.2907C35.8228 30.8442 35.6035 31.4537 35.4936 32.114C35.4377 32.448 35.41 32.795 35.4102 33.1543C35.4103 33.3731 35.4209 33.5962 35.442 33.8238C35.5182 34.6488 35.6809 35.3769 35.9257 35.9883C36.1801 36.6236 36.5303 37.1519 36.9664 37.5588C37.8395 38.3729 38.8846 38.73 40.073 38.6203C41.2749 38.5094 42.2553 37.9628 42.987 36.9956C43.1404 36.7927 43.2747 36.5742 43.3896 36.341C43.3896 36.341 43.3898 36.3409 43.3896 36.3407C43.5486 36.0185 43.6702 35.6686 43.7531 35.2937C43.8917 34.6675 43.9255 33.9556 43.8539 33.1782C43.7805 32.3821 43.6171 31.6765 43.3682 31.0812ZM43.3574 34.6138C43.3574 34.614 43.3574 34.614 43.3574 34.614C43.2703 35.4384 43.0138 36.1318 42.5884 36.6941C41.9422 37.5485 41.0884 38.025 40.0271 38.1229C39.9072 38.134 39.789 38.1397 39.6727 38.1401C39.2227 38.1414 38.8001 38.0627 38.4048 37.9041C38.0119 37.7463 37.6461 37.5093 37.3073 37.1934C36.5395 36.4774 36.0835 35.339 35.9396 33.7779C35.8833 33.1689 35.9063 32.599 36.0084 32.0681C36.0084 32.0679 36.0084 32.0679 36.0086 32.0677C36.1141 31.5185 36.3047 31.0109 36.5802 30.5451C37.122 29.6291 37.9866 29.1162 39.1737 29.0066C40.2584 28.9065 41.1918 29.2098 41.9746 29.9167C42.7575 30.6236 43.2181 31.7259 43.3563 33.2241C43.4024 33.7226 43.4028 34.1858 43.3574 34.6138Z"
                      fill="#171D34"
                    />
                    <path
                      d="M40.7465 31.0248C40.6435 30.9158 40.5358 30.8227 40.4236 30.7455C40.4236 30.7455 40.4236 30.7455 40.4234 30.7455C40.1074 30.5277 39.7556 30.4367 39.3683 30.4724C39.2173 30.4863 39.0755 30.5177 38.9427 30.5668C38.9427 30.5668 38.9425 30.5666 38.9425 30.5668C38.6064 30.6906 38.3283 30.9263 38.1085 31.274C37.8019 31.7592 37.7045 32.6075 37.8163 33.8179C37.8413 34.0882 37.8751 34.3382 37.9181 34.5675C38.001 33.9953 38.142 33.69 38.2672 33.5272C38.2754 33.5166 38.2833 33.5064 38.2915 33.4963C38.2125 32.3275 38.3742 31.7886 38.5308 31.541C38.755 31.1863 39.0358 31.005 39.4142 30.97C39.7861 30.9356 40.0941 31.0621 40.3837 31.3682C40.5992 31.596 40.8801 32.1265 40.9939 33.3593C41.1187 34.7106 40.944 35.312 40.7754 35.5786C40.706 35.6882 40.6309 35.7814 40.5489 35.8586C40.5426 36.0944 40.5289 36.3033 40.5095 36.4887C40.7821 36.3545 41.0113 36.1402 41.1977 35.8456C41.5045 35.3605 41.6026 34.5163 41.4913 33.3133C41.389 32.2043 41.1407 31.4415 40.7465 31.0248Z"
                      fill="#171D34"
                    />
                    <path
                      d="M30.6942 22.8057C30.2988 22.3891 29.8379 22.2051 29.3114 22.2537C28.7845 22.3023 28.3675 22.5693 28.0596 23.0546C27.7517 23.5399 27.6536 24.3881 27.7653 25.5987C27.867 26.7003 28.1153 27.4592 28.5107 27.8757C28.9057 28.2923 29.3628 28.4763 29.8814 28.4284C30.4158 28.3791 30.8373 28.1118 31.1453 27.6265C31.4532 27.1412 31.5516 26.297 31.4406 25.0941C31.3382 23.9849 31.0891 23.2223 30.6942 22.8057ZM30.7234 27.3588C30.498 27.714 30.2159 27.8958 29.8354 27.9309C29.4691 27.9647 29.1634 27.838 28.8731 27.5318C28.657 27.3042 28.3758 26.776 28.2628 25.5527C28.1372 24.1919 28.3124 23.5887 28.4814 23.3223C28.7068 22.967 28.9851 22.7856 29.3573 22.7513C29.7314 22.7167 30.041 22.8433 30.3316 23.1494C30.5478 23.3775 30.8293 23.9079 30.943 25.14C31.0678 26.4912 30.8924 27.0924 30.7234 27.3588Z"
                      fill="#171D34"
                    />
                    <path
                      d="M40.7255 7.72127L41.0641 7.99616C41.2373 8.13661 41.4916 8.11032 41.6322 7.93715C41.7727 7.764 41.7463 7.50967 41.5732 7.36911L41.2345 7.09422C41.2149 7.07825 41.1942 7.06444 41.1727 7.05275C41.0051 6.96155 40.7911 6.99975 40.6665 7.15323C40.5259 7.32636 40.5523 7.58069 40.7255 7.72127Z"
                      fill="#171D34"
                    />
                    <path
                      d="M42.1278 8.86188L42.4664 9.13677C42.6396 9.27731 42.8939 9.25094 43.0345 9.07777C43.1751 8.90462 43.1487 8.65029 42.9755 8.50973L42.6369 8.23484C42.6172 8.21887 42.5965 8.20507 42.575 8.19337C42.4074 8.10218 42.1934 8.14037 42.0688 8.29385C41.9283 8.46698 41.9547 8.72131 42.1278 8.86188Z"
                      fill="#171D34"
                    />
                    <path
                      d="M43.5341 10.0006L43.8727 10.2755C44.0459 10.416 44.3002 10.3896 44.4408 10.2165C44.5813 10.0433 44.5549 9.78897 44.3818 9.64841L44.0431 9.37352C44.0235 9.35755 44.0028 9.34375 43.9813 9.33205C43.8137 9.24084 43.5997 9.27905 43.4751 9.43253C43.3345 9.60568 43.3609 9.86001 43.5341 10.0006Z"
                      fill="#171D34"
                    />
                    <path
                      d="M36.6024 4.33652L36.9411 4.61139C37.1142 4.75187 37.3686 4.72555 37.5091 4.55238C37.6497 4.37923 37.6233 4.1249 37.4501 3.98434L37.1115 3.70945C37.0918 3.69348 37.0711 3.67968 37.0496 3.66798C36.882 3.57679 36.668 3.61498 36.5434 3.76846C36.4029 3.94163 36.4293 4.19596 36.6024 4.33652Z"
                      fill="#171D34"
                    />
                    <path
                      d="M38.0068 5.47716L38.3454 5.75203C38.5185 5.89257 38.7728 5.8662 38.9134 5.69302C39.054 5.51987 39.0276 5.26554 38.8544 5.12497L38.5158 4.85008C38.4961 4.83411 38.4754 4.82031 38.4539 4.80861C38.2863 4.7174 38.0723 4.75562 37.9477 4.9091C37.8072 5.08226 37.8336 5.33659 38.0068 5.47716Z"
                      fill="#171D34"
                    />
                    <path
                      d="M39.4111 6.61776L39.7497 6.89265C39.9229 7.03319 40.1772 7.00678 40.3177 6.83363C40.4583 6.66048 40.4319 6.40615 40.2587 6.26559L39.9201 5.9907C39.9004 5.97473 39.8797 5.96093 39.8582 5.94923C39.6906 5.85804 39.4766 5.89623 39.352 6.04971C39.2115 6.22286 39.2379 6.47719 39.4111 6.61776Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.0087 47.1334L23.5733 47.1572C23.548 47.1586 23.5233 47.1622 23.4996 47.168C23.3141 47.213 23.1812 47.385 23.192 47.5824C23.2042 47.8051 23.3945 47.9758 23.6173 47.9637L24.0528 47.9399C24.2754 47.9277 24.4461 47.7374 24.434 47.5147C24.4218 47.292 24.2315 47.1213 24.0087 47.1334Z"
                      fill="#171D34"
                    />
                    <path
                      d="M25.8154 47.0338L25.3799 47.0576C25.3546 47.059 25.33 47.0626 25.3062 47.0684C25.1208 47.1134 24.9879 47.2854 24.9987 47.4828C25.0108 47.7055 25.2012 47.8762 25.4239 47.8641L25.8594 47.8403C26.082 47.8282 26.2528 47.6378 26.2406 47.4151C26.2285 47.1923 26.0381 47.0217 25.8154 47.0338Z"
                      fill="#171D34"
                    />
                    <path
                      d="M27.622 46.9362L27.1865 46.9599C27.1612 46.9613 27.1366 46.965 27.1129 46.9707C26.9274 47.0157 26.7945 47.1877 26.8053 47.3851C26.8174 47.6078 27.0078 47.7785 27.2305 47.7664L27.666 47.7426C27.8887 47.7304 28.0594 47.5401 28.0473 47.3174C28.0351 47.0947 27.8447 46.924 27.622 46.9362Z"
                      fill="#171D34"
                    />
                    <path
                      d="M18.6826 47.3951L18.2471 47.4189C18.2218 47.4203 18.1972 47.424 18.1734 47.4297C17.988 47.4747 17.8551 47.6468 17.8658 47.8441C17.878 48.0669 18.0684 48.2375 18.2911 48.2254L18.7266 48.2016C18.9492 48.1894 19.12 47.9991 19.1078 47.7764C19.0957 47.5537 18.9053 47.383 18.6826 47.3951Z"
                      fill="#171D34"
                    />
                    <path
                      d="M20.4892 47.2955L20.0537 47.3193C20.0284 47.3207 20.0038 47.3243 19.98 47.3301C19.7946 47.3751 19.6617 47.5471 19.6725 47.7445C19.6846 47.9672 19.875 48.1379 20.0977 48.1258L20.5332 48.102C20.7559 48.0899 20.9266 47.8995 20.9145 47.6768C20.9023 47.4541 20.7119 47.2834 20.4892 47.2955Z"
                      fill="#171D34"
                    />
                    <path
                      d="M22.2939 47.1979L21.8584 47.2216C21.8331 47.223 21.8085 47.2267 21.7847 47.2324C21.5993 47.2774 21.4664 47.4495 21.4772 47.6469C21.4893 47.8696 21.6797 48.0403 21.9024 48.0281L22.3379 48.0043C22.5606 47.9921 22.7313 47.8018 22.7192 47.5791C22.707 47.3564 22.5166 47.1857 22.2939 47.1979Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.2727 12.1462L7.92749 11.4914C8.06539 11.3536 8.06539 11.13 7.92749 10.9921C7.7896 10.8542 7.56602 10.8542 7.42814 10.9921L6.77335 11.6469C6.63545 11.7848 6.63545 12.0084 6.77335 12.1463C6.91124 12.2842 7.1348 12.2841 7.2727 12.1462Z"
                      fill="#171D34"
                    />
                    <path
                      d="M10.0481 9.3689L10.7029 8.71411C10.8408 8.57621 10.8408 8.35265 10.7029 8.21475C10.565 8.07685 10.3414 8.07685 10.2035 8.21475L9.54874 8.86954C9.41084 9.00744 9.41084 9.23102 9.54874 9.3689C9.68663 9.5068 9.91019 9.5068 10.0481 9.3689Z"
                      fill="#171D34"
                    />
                    <path
                      d="M10.2035 12.1463C10.3414 12.2842 10.565 12.2842 10.7029 12.1463C10.8408 12.0084 10.8408 11.7848 10.7029 11.6469L10.0481 10.9921C9.91019 10.8542 9.68663 10.8542 9.54874 10.9921C9.41084 11.13 9.41084 11.3536 9.54874 11.4915L10.2035 12.1463Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.42816 9.3689C7.56606 9.5068 7.78963 9.5068 7.92751 9.3689C8.06541 9.231 8.06541 9.00742 7.92751 8.86954L7.27272 8.21475C7.13482 8.07685 6.91124 8.07685 6.77335 8.21475C6.63545 8.35265 6.63545 8.57623 6.77335 8.71411L7.42816 9.3689Z"
                      fill="#171D34"
                    />
                    <path
                      d="M1.24066 36.2137L0.778135 36.6762C0.680726 36.7736 0.680726 36.9315 0.778135 37.029C0.875545 37.1264 1.03347 37.1264 1.13088 37.029L1.5934 36.5664C1.69081 36.469 1.69081 36.3111 1.5934 36.2137C1.49598 36.1163 1.33807 36.1163 1.24066 36.2137Z"
                      fill="#171D34"
                    />
                    <path
                      d="M3.2016 34.2527L2.73907 34.7153C2.64166 34.8127 2.64166 34.9706 2.73907 35.068C2.83648 35.1654 2.9944 35.1654 3.09181 35.068L3.55434 34.6055C3.65175 34.5081 3.65175 34.3502 3.55434 34.2527C3.45693 34.1553 3.29901 34.1553 3.2016 34.2527Z"
                      fill="#171D34"
                    />
                    <path
                      d="M3.09181 36.2137C2.9944 36.1163 2.83648 36.1163 2.73907 36.2137C2.64166 36.3111 2.64166 36.469 2.73907 36.5664L3.2016 37.029C3.29901 37.1264 3.45693 37.1264 3.55434 37.029C3.65175 36.9315 3.65175 36.7736 3.55434 36.6762L3.09181 36.2137Z"
                      fill="#171D34"
                    />
                    <path
                      d="M1.13087 34.2527C1.03346 34.1553 0.875545 34.1553 0.778135 34.2527C0.680726 34.3502 0.680726 34.5081 0.778135 34.6055L1.24066 35.068C1.33807 35.1654 1.49599 35.1654 1.5934 35.068C1.69081 34.9706 1.69081 34.8127 1.5934 34.7153L1.13087 34.2527Z"
                      fill="#171D34"
                    />
                    <path
                      d="M46.8613 25.0094L47.3239 24.5469C47.4213 24.4495 47.4213 24.2916 47.3239 24.1942C47.2265 24.0967 47.0685 24.0967 46.9711 24.1942L46.5086 24.6567C46.4112 24.7541 46.4112 24.912 46.5086 25.0094C46.606 25.1068 46.7639 25.1068 46.8613 25.0094Z"
                      fill="#171D34"
                    />
                    <path
                      d="M48.8223 23.0485L49.2848 22.586C49.3822 22.4885 49.3822 22.3306 49.2848 22.2332C49.1874 22.1358 49.0295 22.1358 48.9321 22.2332L48.4695 22.6957C48.3721 22.7932 48.3721 22.9511 48.4695 23.0485C48.567 23.1459 48.7249 23.1459 48.8223 23.0485Z"
                      fill="#171D34"
                    />
                    <path
                      d="M48.8223 24.1942C48.7249 24.0967 48.567 24.0967 48.4695 24.1942C48.3721 24.2916 48.3721 24.4495 48.4695 24.5469L48.9321 25.0094C49.0295 25.1068 49.1874 25.1068 49.2848 25.0094C49.3822 24.912 49.3822 24.7541 49.2848 24.6567L48.8223 24.1942Z"
                      fill="#171D34"
                    />
                    <path
                      d="M46.9711 23.0485C47.0685 23.1459 47.2265 23.1459 47.3239 23.0485C47.4213 22.9511 47.4213 22.7932 47.3239 22.6957L46.8613 22.2332C46.7639 22.1358 46.606 22.1358 46.5086 22.2332C46.4112 22.3306 46.4112 22.4885 46.5086 22.586L46.9711 23.0485Z"
                      fill="#171D34"
                    />
                    <path
                      d="M33.4492 2.93715L33.9118 2.47463C34.0092 2.37722 34.0092 2.21929 33.9118 2.12189C33.8144 2.02448 33.6564 2.02448 33.559 2.12189L33.0965 2.58441C32.9991 2.68182 32.9991 2.83974 33.0965 2.93715C33.1939 3.03456 33.3518 3.03456 33.4492 2.93715Z"
                      fill="#171D34"
                    />
                    <path
                      d="M35.4102 0.976216L35.8727 0.513687C35.9701 0.416278 35.9701 0.258357 35.8727 0.160948C35.7753 0.0635382 35.6174 0.0635382 35.52 0.160948L35.0574 0.623478C34.96 0.720887 34.96 0.878807 35.0574 0.976198C35.1548 1.07363 35.3128 1.07363 35.4102 0.976216Z"
                      fill="#171D34"
                    />
                    <path
                      d="M35.52 2.93715C35.6174 3.03456 35.7753 3.03456 35.8727 2.93715C35.9701 2.83974 35.9701 2.68182 35.8727 2.58441L35.4102 2.12189C35.3128 2.02448 35.1548 2.02448 35.0574 2.12189C34.96 2.21929 34.96 2.37722 35.0574 2.47463L35.52 2.93715Z"
                      fill="#171D34"
                    />
                    <path
                      d="M33.559 0.976198C33.6564 1.07361 33.8144 1.07361 33.9118 0.976198C34.0092 0.878789 34.0092 0.720868 33.9118 0.623477L33.4492 0.160948C33.3518 0.0635382 33.1939 0.0635382 33.0965 0.160948C32.9991 0.258357 32.9991 0.416278 33.0965 0.513688L33.559 0.976198Z"
                      fill="#171D34"
                    />
                    <path
                      d="M30.3735 48.9832L29.9109 49.4457C29.8135 49.5431 29.8135 49.7011 29.9109 49.7985C30.0084 49.8959 30.1663 49.8959 30.2637 49.7985L30.7262 49.3359C30.8236 49.2385 30.8236 49.0806 30.7262 48.9832C30.6288 48.8858 30.4709 48.8858 30.3735 48.9832Z"
                      fill="#171D34"
                    />
                    <path
                      d="M32.3344 47.0223L31.8719 47.4848C31.7745 47.5822 31.7745 47.7401 31.8719 47.8375C31.9693 47.935 32.1272 47.935 32.2246 47.8375L32.6872 47.375C32.7846 47.2776 32.7846 47.1197 32.6872 47.0223C32.5897 46.9249 32.4318 46.9249 32.3344 47.0223Z"
                      fill="#171D34"
                    />
                    <path
                      d="M32.2246 48.9832C32.1272 48.8858 31.9693 48.8858 31.8719 48.9832C31.7745 49.0806 31.7745 49.2385 31.8719 49.336L32.3344 49.7985C32.4318 49.8959 32.5897 49.8959 32.6872 49.7985C32.7846 49.7011 32.7846 49.5432 32.6872 49.4457L32.2246 48.9832Z"
                      fill="#171D34"
                    />
                    <path
                      d="M30.2637 47.0223C30.1663 46.9249 30.0084 46.9249 29.9109 47.0223C29.8135 47.1197 29.8135 47.2776 29.9109 47.375L30.3735 47.8375C30.4709 47.935 30.6288 47.935 30.7262 47.8375C30.8236 47.7401 30.8236 47.5822 30.7262 47.4848L30.2637 47.0223Z"
                      fill="#171D34"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_488_23869">
                      <rect width="50" height="50" fill="white" />
                    </clipPath>
                  </defs>
                </svg>{" "}
                Tax Year
              </span>
              <div className="controls">
                <div className="form-group mb-0" style={{ width: "300px" }}>
                  <Dropdown
                    options={distinctYears.allYears.length > 0
                      ? [Math.max(...distinctYears.allYears.map(y => y.year))]
                      : []}
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
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 50 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.26562 3.95312V23.135V27.3919V43.4843L12.1017 47.3204L12.5006 46.9216L12.823 46.5992L15.2443 44.1777L17.1215 46.0549L18.387 47.3204L19.1404 46.5671L19.4628 46.2447L21.5296 44.1777L22.7655 45.4138L23.088 45.7362L24.6722 47.3204L25.7802 46.2124L26.1026 45.89L27.8147 44.1777L28.7321 45.095L29.0546 45.4175L30.9575 47.3204L32.42 45.8579L32.7424 45.5353L34.1001 44.1777L34.6987 44.7763L35.0213 45.0989L37.2426 47.3204L39.0598 45.5033L39.3822 45.1809L41.0787 43.4843V3.95312H8.26562ZM38.0463 28.6119V28.7202H37.0349H35.3056V27.2986V26.4265H35.5511H38.0463V28.6119ZM32.7948 26.4265H33.2507H35.0455V26.8703V27.3264V28.7202H32.3048V26.4265H32.7948ZM24.2188 18.8625V18.5719V18.0255V16.7212V16.5689H25.6404H36.36H36.8159H37.353V18.8625H24.2188ZM23.7404 26.4265H26.0425V26.4431V27.8347V28.2908V28.7202H23.3019V26.4265H23.7404ZM26.3027 28.263V26.4265H26.4967H29.0435V28.7202H26.3027V28.263ZM24.2188 23.2307V20.937H31.2393V23.2307H24.2188ZM29.3038 26.4265H32.0445V28.7202H29.3038V26.4265ZM24.2188 14.4944V12.2007H37.353V14.4944H24.2188ZM23.0416 26.4265V28.7202H20.3009V26.4265H23.0416ZM37.353 7.83256V10.1261H24.2188V9.78554V9.32962V7.93482V7.83256H25.1741H35.4243H35.8802H37.353ZM12.608 14.266C12.3016 13.9614 12.0814 13.6232 11.9346 13.2324C11.7929 12.8551 11.7241 12.4386 11.7241 11.959C11.7241 11.4708 11.8154 11.0084 11.9954 10.5844C11.9985 10.5773 12.0015 10.5704 12.0045 10.5634V10.5632C12.1697 10.1815 12.4043 9.83759 12.7029 9.53936C12.7029 9.53936 12.7029 9.53919 12.7031 9.53919C12.721 9.52139 12.7392 9.50359 12.7577 9.48596C12.9598 9.29251 13.1874 9.12189 13.4372 8.97546C13.5748 8.89502 13.7192 8.82181 13.8698 8.75632C13.8809 8.75145 13.892 8.74658 13.9032 8.74188C14.2189 8.60787 14.5582 8.50896 14.916 8.44616V7.13902H17.0829V8.47504C17.5184 8.55934 17.9172 8.692 18.2723 8.87152C18.6918 9.08327 19.0545 9.36136 19.3504 9.69822C19.827 10.2404 20.1321 10.9474 20.2094 11.6885L20.2614 12.1889H19.1352H17.9479L17.9187 12.0789L17.8584 11.852C17.7123 11.3031 17.4655 10.9343 17.0829 10.7101V11.9336V12.6243V13.7642C18.2608 14.1523 19.1017 14.641 19.6478 15.2536C19.938 15.579 20.1533 15.9504 20.2876 16.3577C20.41 16.7289 20.4697 17.1331 20.4697 17.5933C20.4697 18.1298 20.3817 18.6262 20.2085 19.0685C20.0346 19.5127 19.7744 19.9034 19.4356 20.2302C19.4085 20.2564 19.381 20.2819 19.353 20.3071C19.353 20.3073 19.3528 20.3073 19.3528 20.3073C19.0371 20.5918 18.6586 20.8237 18.2257 20.9978C17.8792 21.137 17.4964 21.2396 17.0829 21.3044V23.0208H14.916V22.7807V21.5803V21.3012C14.5202 21.2336 14.1488 21.1254 13.8075 20.9787C13.3583 20.7854 12.9608 20.5251 12.6262 20.205C12.208 19.8052 11.8937 19.3175 11.694 18.7656C11.6421 18.6225 11.5981 18.475 11.562 18.3237C11.519 18.1442 11.4873 17.9592 11.467 17.7694L11.4134 17.2678H13.7645L13.8384 17.6309C13.9373 18.117 14.1603 18.511 14.489 18.7941C14.6159 18.9034 14.7587 18.9963 14.916 19.0717V15.5273C13.8482 15.1698 13.11 14.7654 12.608 14.266ZM11.298 26.4265H14.0388V28.7202H11.298V26.4265ZM14.2989 26.4265H17.0396V26.9483V27.4042V28.7202H15.3877H14.9316H14.2989V26.4265ZM17.688 28.7202H17.2999V26.9204V26.4265H20.0406V28.7202H17.688ZM11.298 38.8438V30.318H22.1182H26.3751H38.0463V36.7303V37.1864V38.8438H11.298Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M18.0507 17.746C18.0507 17.3303 17.9628 17.0347 17.7656 16.7876C17.6166 16.601 17.396 16.4308 17.0977 16.2734V19.1538C17.3508 19.0709 17.5522 18.9531 17.6993 18.8014C17.9358 18.5576 18.0507 18.2124 18.0507 17.746Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M14.9328 10.582C14.7153 10.6643 14.5415 10.7812 14.4135 10.932C14.2965 11.0697 14.216 11.2363 14.1729 11.4299C14.1475 11.5426 14.1348 11.6643 14.1348 11.7948C14.1348 12.0767 14.1818 12.2939 14.2847 12.4749C14.3153 12.5288 14.3509 12.5795 14.3917 12.6277C14.5143 12.7728 14.6933 12.9078 14.9328 13.0351V10.582Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M21.0593 47.5303L19.4642 46.2438L17.5999 44.7402L16.8004 45.7315L14.8098 48.1997L12.8244 46.5983L12.502 46.9208L14.5251 48.5525L14.8781 48.8371L15.1627 48.4843L17.1229 46.0541L17.6682 45.3778L19.1418 46.5663L20.7747 47.8831L21.1276 48.1678L21.4123 47.815L23.0894 45.7354L22.7669 45.4129L21.0593 47.5303Z"
                      fill="#171D34"
                    />
                    <path
                      d="M41.0793 17.1261L39.6682 3.95258L39.4533 1.94502L39.4049 1.49414L38.954 1.5425L16.4538 3.95258L8.26621 4.82966L6.32783 5.03721L5.87695 5.08541L5.92532 5.53629L8.26621 27.3914V23.1345L6.37603 5.48793L8.26621 5.28541L20.7105 3.95258L39.0024 1.99338L39.2123 3.95258L41.0793 21.3831L43.2127 41.2995L39.8069 45.5224L39.3828 45.1803L39.0603 45.5027L39.5223 45.8753L39.8751 46.1598L40.1598 45.807L43.5655 41.5842L43.6834 41.4381L43.6634 41.2513L41.0793 17.1261Z"
                      fill="#171D34"
                    />
                    <path
                      d="M33.5579 46.1885L32.7435 45.5316L30.0986 43.3984L28.7332 45.0913L27.3085 46.8579L26.1037 45.8863L25.7812 46.2087L27.0239 47.2109L27.3767 47.4955L27.6614 47.1425L29.0556 45.4137L30.1668 44.0361L32.421 45.8542L33.2733 46.5415L33.6263 46.8261L33.9109 46.4732L35.0224 45.0952L34.6998 44.7726L33.5579 46.1885Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.2188 9.78111L35.5039 8.57237L35.9548 8.52401L35.9064 8.0733L35.8802 7.82812H35.4243L35.4557 8.12149L24.2188 9.32519V9.78111Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.2188 7.93039L25.1741 7.82812H24.2188V7.93039Z"
                      fill="#171D34"
                    />
                    <path
                      d="M23.1152 11.9867L23.1635 12.4375L23.3112 13.8165L23.3595 14.2673L23.8103 14.219L35.9682 12.9168L36.419 12.8685L36.3707 12.4176L36.223 11.0387L36.1747 10.5879L35.7239 10.6362L23.566 11.9384L23.1152 11.9867ZM35.7722 11.087L35.9199 12.466L23.762 13.7682L23.6143 12.3893L35.7722 11.087Z"
                      fill="#171D34"
                    />
                    <path
                      d="M36.8853 17.2126L36.8369 16.7619L36.8159 16.5664H36.36L36.386 16.8101L24.2283 18.1123L24.2188 18.023V18.5694L24.2765 18.5632L36.4344 17.2609L36.8853 17.2126Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.2188 16.5664V16.7187L25.6404 16.5664H24.2188Z"
                      fill="#171D34"
                    />
                    <path
                      d="M35.3086 26.4258V27.2978L35.6436 27.2619L35.5954 26.8112L35.5541 26.4258H35.3086Z"
                      fill="#171D34"
                    />
                    <path
                      d="M32.793 26.4258L32.8655 27.103L32.9137 27.5537L33.3646 27.5055L35.0437 27.3257V26.8696L33.3162 27.0547L33.2489 26.4258H32.793Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.2717 22.2064L31.2234 21.7555L31.0757 20.3766L31.0274 19.9258L30.5766 19.9741L24.4977 20.6252L24.0469 20.6735L24.0952 21.1243L24.2429 22.5032L24.2912 22.954L24.742 22.9058L30.8209 22.2546L31.2717 22.2064ZM24.6937 22.455L24.546 21.076L30.6249 20.4249L30.7726 21.8038L24.6937 22.455Z"
                      fill="#171D34"
                    />
                    <path
                      d="M29.8835 27.4225L29.9318 27.8733L30.3826 27.825L32.2061 27.6297L32.6569 27.5814L32.6086 27.1306L32.4609 25.7516L32.4126 25.3008L31.9618 25.3491L30.1383 25.5444L29.6875 25.5927L29.7358 26.0435L29.8835 27.4225ZM32.0101 25.7999L32.1578 27.1789L30.3343 27.3742L30.1866 25.9952L32.0101 25.7999Z"
                      fill="#171D34"
                    />
                    <path
                      d="M29.4341 25.6191L28.9833 25.6674L27.1598 25.8627L26.709 25.911L26.7573 26.3618L26.905 27.7409L26.9532 28.1917L27.4041 28.1434L29.2275 27.9481L29.6784 27.8998L29.6301 27.449L29.4824 26.07L29.4341 25.6191ZM27.3558 27.6926L27.2081 26.3136L29.0315 26.1183L29.1792 27.4973L27.3558 27.6926Z"
                      fill="#171D34"
                    />
                    <path
                      d="M26.0404 26.4424V26.4258H23.7383L23.7658 26.6829L23.9136 28.0619L23.9618 28.5126L24.4127 28.4644L26.0404 28.2901V27.834L24.3643 28.0135L24.2167 26.6345L26.04 26.4392L26.0404 26.4424Z"
                      fill="#171D34"
                    />
                    <path
                      d="M26.3027 26.4258V28.2622L26.689 28.2207L26.6408 27.7699L26.4967 26.4258H26.3027Z"
                      fill="#171D34"
                    />
                    <path
                      d="M21.1891 26.5014L20.7383 26.5497L20.7866 27.0005L20.9343 28.3795L20.9826 28.8303L21.4334 28.7821L23.2569 28.5867L23.7077 28.5385L23.6594 28.0876L23.5117 26.7086L23.4634 26.2578L23.0126 26.3061L21.1891 26.5014ZM23.2086 28.1359L21.3851 28.3312L21.2374 26.9522L23.0609 26.7569L23.2086 28.1359Z"
                      fill="#171D34"
                    />
                    <path
                      d="M19.6502 16.5381C19.4732 16.1476 19.2196 15.8012 18.8965 15.5085C18.2881 14.9575 17.3998 14.5611 16.1876 14.3008L15.8623 11.264C16.2665 11.4462 16.5513 11.7866 16.7548 12.3169L16.8799 12.6422L17.0829 12.6203V11.9297C16.7869 11.2942 16.2871 10.7695 15.3422 10.666L15.7723 14.68C18.4719 15.1819 19.3457 16.2449 19.5118 17.7955C19.719 19.729 18.5921 21.0256 16.4972 21.4482L16.6653 23.0168L16.6744 23.1021L15.4211 23.2363L15.3976 23.0168L15.2441 21.5834C15.1326 21.5844 15.0232 21.5821 14.916 21.5763V22.7767L14.9417 23.0168L14.9704 23.2847L15.0186 23.7354L15.4695 23.6872L16.7226 23.553L17.1734 23.5046L17.1251 23.0538L17.0829 22.6603L16.9906 21.7982C17.0216 21.7898 17.0524 21.7814 17.0829 21.7725C17.4512 21.6675 17.7899 21.5334 18.094 21.3713C18.5425 21.1329 18.9199 20.8328 19.2154 20.4795C19.2635 20.4222 19.3093 20.3634 19.3528 20.3033C19.3528 20.3033 19.353 20.3033 19.353 20.3031C19.5844 19.9849 19.7545 19.6289 19.8601 19.242C19.9854 18.7837 20.0198 18.2808 19.9627 17.7473C19.9137 17.2897 19.8114 16.8942 19.6502 16.5381Z"
                      fill="#171D34"
                    />
                    <path
                      d="M15.1127 20.3787L14.9135 18.5193L14.6337 15.9072C12.3174 15.4565 11.2934 14.6912 11.1152 13.0279C11.0092 12.0393 11.3488 11.1824 12.002 10.5591V10.5589C12.4942 10.0885 13.1647 9.75101 13.957 9.58913L13.8673 8.75202L13.8238 8.34631L14.9135 8.22943L15.0769 8.21197L15.2122 9.47511C17.5169 9.50617 18.402 10.9356 18.6292 11.9982L17.9162 12.0746L17.9454 12.1846H19.1327L19.0725 11.9035C18.9169 11.1749 18.5382 10.5045 18.0065 10.016C17.6764 9.71272 17.2861 9.47477 16.8465 9.30886C16.4742 9.16831 16.0636 9.07863 15.6218 9.04119L15.5278 8.16377L15.4794 7.71289L15.0287 7.76125L14.9135 7.77351L13.7755 7.89543L13.3248 7.94379L13.373 8.3945L13.4347 8.97116L13.464 9.24337C13.1955 9.32078 12.9402 9.41818 12.7006 9.53489C12.7004 9.53489 12.7004 9.53506 12.7004 9.53506C12.6284 9.56999 12.5577 9.60676 12.4885 9.64538C12.0724 9.87712 11.7159 10.1671 11.4287 10.5072C11.1338 10.8563 10.9182 11.2511 10.7877 11.6805C10.6539 12.1213 10.6122 12.5908 10.6643 13.0763C10.7154 13.553 10.8282 13.9599 11.0092 14.3199C11.1968 14.6929 11.4519 15.0056 11.7889 15.2759C12.3412 15.7191 13.1184 16.0424 14.2181 16.2842L14.4865 18.7898L14.5956 19.8084C14.0052 19.5999 13.5788 19.1461 13.3708 18.4906L13.2586 18.1374L12.8903 18.1769L11.5595 18.3194C11.5956 18.4707 11.6396 18.6182 11.6915 18.7613L12.9385 18.6278C13.2836 19.7146 14.1263 20.2897 15.1127 20.3787Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.7559 26.868L17.8041 27.3189L17.9518 28.6979L18.0001 29.1487L18.4509 29.1004L20.2744 28.9051L20.7252 28.8568L20.6769 28.406L20.5292 27.027L20.4809 26.5762L20.0301 26.6245L18.2067 26.8198L17.7559 26.868ZM20.0784 27.0753L20.2262 28.4543L18.4027 28.6496L18.255 27.2706L20.0784 27.0753Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.3047 26.9191V28.7189H17.6928L17.5462 27.3492L17.4978 26.8984L17.3047 26.9191Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.0354 26.9453L15.2146 27.1403L14.7637 27.1886L14.812 27.6395L14.9274 28.7173H15.3835L15.2627 27.5912L17.0354 27.4012V26.9453Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.3037 29.5457L14.7546 29.4974L14.7063 29.0466L14.5586 27.6676L14.5103 27.2168L14.0595 27.2651L12.236 27.4604L11.7852 27.5087L11.8334 27.9595L11.9811 29.3385L12.0294 29.7893L12.4802 29.741L14.3037 29.5457ZM12.2843 27.9112L14.1077 27.7159L14.2555 29.0949L12.432 29.2902L12.2843 27.9112Z"
                      fill="#171D34"
                    />
                    <path
                      d="M13.5078 39.3569L13.4527 38.8422L12.6963 31.7814L26.3739 30.3164H22.117L12.6481 31.3307L12.1973 31.3789L12.2456 31.8298L12.9968 38.8422L13.057 39.4052L13.1052 39.8561L13.5561 39.8078L22.5709 38.8422L38.0451 37.1848V36.7287L18.3131 38.8422L13.5078 39.3569Z"
                      fill="#171D34"
                    />
                    <path
                      d="M38.0466 28.7157V28.6074L37.0352 28.7157H38.0466Z"
                      fill="#171D34"
                    />
                    <path
                      d="M38.4277 25.111L38.3794 24.6602L37.9286 24.7085L36.1051 24.9038L35.6543 24.952L35.7026 25.4029L35.8503 26.7819L35.8986 27.2327L36.3494 27.1844L38.1729 26.9891L38.6237 26.9408L38.5754 26.49L38.4277 25.111ZM36.3011 26.7336L36.1534 25.3546L37.9768 25.1592L38.1246 26.5383L36.3011 26.7336Z"
                      fill="#171D34"
                    />
                    <path
                      d="M18.029 18.1098C17.9269 17.1574 17.4531 16.5313 15.9492 16.1562L16.3894 20.2654C17.5675 19.9832 18.1553 19.2892 18.029 18.1098ZM16.7804 19.6593L16.4737 16.7953C16.7871 16.9201 17.0246 17.0658 17.1926 17.2355C17.4149 17.4601 17.5339 17.7447 17.5781 18.1581C17.6278 18.6218 17.5503 18.9773 17.3411 19.2449C17.211 19.4113 17.0233 19.5499 16.7804 19.6593Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.1062 10.75C12.8876 11.0346 12.5094 11.8492 12.6009 12.704C12.6965 13.5955 13.1569 14.1147 14.5015 14.4402L14.2904 12.4702C14.1875 12.2892 14.1405 12.0721 14.1405 11.7901C14.1405 11.6597 14.1533 11.5379 14.1786 11.4252L14.1062 10.75ZM13.3961 13.4566C13.1969 13.2664 13.0908 13.0194 13.0518 12.6558C13.014 12.3031 13.0763 12.0046 13.2372 11.7681C13.3484 11.6047 13.5088 11.4699 13.7161 11.3649L13.9774 13.8041C13.7257 13.703 13.5334 13.5878 13.3961 13.4566Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.54859 38.2832C7.34619 38.2831 7.18201 38.447 7.18189 38.6494L7.18164 39.0452C7.18159 39.2476 7.34549 39.4118 7.54789 39.4119C7.75029 39.4121 7.91447 39.2481 7.91459 39.0457L7.91484 38.6499C7.91486 38.6269 7.91276 38.6044 7.90873 38.5826C7.87722 38.4123 7.72797 38.2833 7.54859 38.2832Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.54859 39.9238C7.34619 39.9237 7.18201 40.0877 7.18189 40.2901L7.18164 40.6859C7.18151 40.8882 7.34547 41.0524 7.54789 41.0526C7.75029 41.0527 7.91447 40.8887 7.91459 40.6863L7.91484 40.2905C7.91486 40.2676 7.91276 40.2451 7.90873 40.2232C7.87722 40.053 7.72797 39.9239 7.54859 39.9238Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.54859 41.5645C7.34619 41.5643 7.18201 41.7283 7.18189 41.9307L7.18164 42.3265C7.18157 42.5289 7.3455 42.6931 7.54789 42.6932C7.75029 42.6933 7.91447 42.5293 7.91459 42.327L7.91484 41.9312C7.91486 41.9082 7.91276 41.8857 7.90873 41.8639C7.87723 41.6936 7.72797 41.5646 7.54859 41.5645Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.57789 33.4434C7.37549 33.4432 7.21131 33.6072 7.21119 33.8096L7.21094 34.2054C7.21089 34.4077 7.37478 34.572 7.57718 34.5721C7.77959 34.5722 7.94377 34.4082 7.94389 34.2059L7.94414 33.8101C7.94415 33.7871 7.94206 33.7646 7.93802 33.7428C7.90652 33.5725 7.75729 33.4435 7.57789 33.4434Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.57789 35.084C7.37549 35.0839 7.21131 35.2478 7.21119 35.4502L7.21094 35.846C7.2108 36.0484 7.37477 36.2126 7.57718 36.2127C7.77959 36.2129 7.94377 36.0489 7.94389 35.8465L7.94414 35.4507C7.94415 35.4277 7.94205 35.4052 7.93802 35.3834C7.90652 35.2131 7.75729 35.0841 7.57789 35.084Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.57398 36.7266C7.37158 36.7264 7.2074 36.8904 7.20728 37.0928L7.20703 37.4886C7.20696 37.691 7.37089 37.8552 7.57328 37.8553C7.77568 37.8554 7.93986 37.6914 7.93998 37.4891L7.94023 37.0933C7.94025 37.0703 7.93815 37.0478 7.93412 37.026C7.90261 36.8557 7.75338 36.7267 7.57398 36.7266Z"
                      fill="#171D34"
                    />
                    <path
                      d="M28.1083 2.36642L28.5019 2.32468C28.5247 2.32226 28.5469 2.31779 28.5681 2.31144C28.7341 2.26207 28.8466 2.09997 28.8276 1.92159C28.8063 1.72033 28.6258 1.57447 28.4245 1.59583L28.031 1.63757C27.8298 1.659 27.6839 1.83939 27.7052 2.04066C27.7265 2.24192 27.907 2.38778 28.1083 2.36642Z"
                      fill="#171D34"
                    />
                    <path
                      d="M26.4754 2.5383L26.869 2.49655C26.8919 2.49413 26.914 2.48967 26.9353 2.48332C27.1013 2.43395 27.2137 2.27185 27.1948 2.09346C27.1735 1.8922 26.993 1.74634 26.7917 1.7677L26.3982 1.80945C26.1969 1.83079 26.051 2.01126 26.0724 2.21254C26.0937 2.4138 26.2742 2.55964 26.4754 2.5383Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.8426 2.71017L25.2362 2.66843C25.2591 2.66599 25.2812 2.66152 25.3025 2.65519C25.4685 2.60581 25.5809 2.44372 25.562 2.26534C25.5407 2.06408 25.3602 1.91822 25.1589 1.93958L24.7654 1.98132C24.5641 2.00273 24.4182 2.18315 24.4396 2.38441C24.4609 2.58567 24.6414 2.73153 24.8426 2.71017Z"
                      fill="#171D34"
                    />
                    <path
                      d="M32.9266 1.87814L33.3202 1.83639C33.3431 1.83396 33.3652 1.82951 33.3865 1.82316C33.5524 1.77378 33.6649 1.61169 33.646 1.4333C33.6246 1.23205 33.4442 1.08619 33.2429 1.10755L32.8493 1.14929C32.6481 1.17072 32.5022 1.35111 32.5236 1.55238C32.5449 1.75364 32.7253 1.8995 32.9266 1.87814Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.2938 2.05392L31.6874 2.01218C31.7103 2.00974 31.7324 2.00527 31.7537 1.99894C31.9196 1.94956 32.0321 1.78747 32.0132 1.60909C31.9918 1.40781 31.8114 1.26197 31.6101 1.28333L31.2165 1.32507C31.0153 1.34642 30.8694 1.52687 30.8907 1.72816C30.9121 1.92942 31.0925 2.07528 31.2938 2.05392Z"
                      fill="#171D34"
                    />
                    <path
                      d="M29.663 2.22579L30.0565 2.18405C30.0794 2.18161 30.1015 2.17715 30.1228 2.17083C30.2888 2.12145 30.4012 1.95936 30.3823 1.78097C30.361 1.5797 30.1805 1.43386 29.9792 1.4552L29.5857 1.49694C29.3844 1.51835 29.2385 1.69878 29.2599 1.90003C29.2812 2.10129 29.4617 2.24714 29.663 2.22579Z"
                      fill="#171D34"
                    />
                    <path
                      d="M4.68806 31.2208L4.09385 31.815C3.96872 31.9401 3.96872 32.143 4.09385 32.2682C4.21899 32.3933 4.42188 32.3933 4.547 32.2682L5.14121 31.674C5.26635 31.5488 5.26635 31.3459 5.14121 31.2208C5.01607 31.0957 4.8132 31.0957 4.68806 31.2208Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.06655 29.7467L7.66076 29.1525C7.7859 29.0273 7.7859 28.8245 7.66076 28.6993C7.53562 28.5742 7.33273 28.5742 7.20759 28.6993L6.61339 29.2935C6.48825 29.4187 6.48825 29.6216 6.61339 29.7467C6.73852 29.8718 6.94141 29.8718 7.06655 29.7467Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.66074 32.2682C7.78588 32.143 7.78588 31.9401 7.66074 31.815L7.06653 31.2208C6.9414 31.0957 6.73851 31.0957 6.61339 31.2208C6.48825 31.3459 6.48825 31.5488 6.61339 31.674L7.20759 32.2682C7.33271 32.3933 7.5356 32.3933 7.66074 32.2682Z"
                      fill="#171D34"
                    />
                    <path
                      d="M4.547 28.6993C4.42186 28.5742 4.21898 28.5742 4.09385 28.6993C3.96872 28.8245 3.96872 29.0274 4.09385 29.1525L4.68806 29.7467C4.8132 29.8718 5.01609 29.8718 5.14121 29.7467C5.26635 29.6216 5.26635 29.4187 5.14121 29.2935L4.547 28.6993Z"
                      fill="#171D34"
                    />
                    <path
                      d="M23.8181 49.0175L23.3983 49.4372C23.3099 49.5256 23.3099 49.6689 23.3983 49.7573C23.4867 49.8457 23.63 49.8457 23.7184 49.7573L24.1382 49.3376C24.2266 49.2492 24.2266 49.1059 24.1382 49.0175C24.0498 48.9291 23.9065 48.9291 23.8181 49.0175Z"
                      fill="#171D34"
                    />
                    <path
                      d="M25.5954 47.2401L25.1757 47.6599C25.0873 47.7483 25.0873 47.8916 25.1757 47.98C25.2641 48.0684 25.4074 48.0684 25.4958 47.98L25.9155 47.5602C26.0039 47.4718 26.0039 47.3285 25.9155 47.2401C25.8271 47.1517 25.6838 47.1517 25.5954 47.2401Z"
                      fill="#171D34"
                    />
                    <path
                      d="M25.4958 49.0175C25.4074 48.9291 25.2641 48.9291 25.1757 49.0175C25.0873 49.1059 25.0873 49.2492 25.1757 49.3376L25.5954 49.7573C25.6838 49.8457 25.8271 49.8457 25.9155 49.7573C26.0039 49.6689 26.0039 49.5256 25.9155 49.4372L25.4958 49.0175Z"
                      fill="#171D34"
                    />
                    <path
                      d="M23.7184 47.2401C23.63 47.1517 23.4867 47.1517 23.3983 47.2401C23.3099 47.3285 23.3099 47.4718 23.3983 47.5602L23.8181 47.98C23.9065 48.0684 24.0498 48.0684 24.1382 47.98C24.2266 47.8916 24.2266 47.7483 24.1382 47.6599L23.7184 47.2401Z"
                      fill="#171D34"
                    />
                    <path
                      d="M41.8044 8.00535L42.2241 7.58562C42.3125 7.49722 42.3125 7.35391 42.2241 7.26552C42.1357 7.17712 41.9924 7.17712 41.904 7.26552L41.4843 7.68525C41.3959 7.77364 41.3959 7.91695 41.4843 8.00533C41.5727 8.09373 41.716 8.09373 41.8044 8.00535Z"
                      fill="#171D34"
                    />
                    <path
                      d="M43.5817 6.2241L44.0014 5.80437C44.0898 5.71597 44.0898 5.57266 44.0014 5.48427C43.913 5.39587 43.7697 5.39587 43.6813 5.48427L43.2616 5.904C43.1732 5.99239 43.1732 6.1357 43.2616 6.2241C43.35 6.31249 43.4933 6.31249 43.5817 6.2241Z"
                      fill="#171D34"
                    />
                    <path
                      d="M43.6813 8.00533C43.7697 8.09373 43.913 8.09373 44.0014 8.00533C44.0898 7.91694 44.0898 7.77363 44.0014 7.68525L43.5817 7.26552C43.4933 7.17712 43.35 7.17712 43.2616 7.26552C43.1732 7.35391 43.1732 7.49722 43.2616 7.58562L43.6813 8.00533Z"
                      fill="#171D34"
                    />
                    <path
                      d="M41.904 6.2241C41.9924 6.31249 42.1357 6.31249 42.2241 6.2241C42.3125 6.1357 42.3125 5.99239 42.2241 5.904L41.8044 5.48427C41.716 5.39587 41.5727 5.39587 41.4843 5.48427C41.3959 5.57266 41.3959 5.71597 41.4843 5.80437L41.904 6.2241Z"
                      fill="#171D34"
                    />
                    <path
                      d="M13.193 3.58738L13.6128 3.16765C13.7012 3.07925 13.7012 2.93594 13.6128 2.84755C13.5244 2.75915 13.3811 2.75915 13.2927 2.84755L12.8729 3.26728C12.7845 3.35567 12.7845 3.49898 12.8729 3.58738C12.9613 3.67576 13.1046 3.67576 13.193 3.58738Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.9762 1.80613L15.396 1.3864C15.4844 1.298 15.4844 1.15469 15.396 1.0663C15.3076 0.977901 15.1643 0.977901 15.0759 1.0663L14.6561 1.48603C14.5677 1.57442 14.5677 1.71773 14.6561 1.80611C14.7446 1.89453 14.8879 1.89453 14.9762 1.80613Z"
                      fill="#171D34"
                    />
                    <path
                      d="M15.0759 3.58738C15.1643 3.67578 15.3076 3.67578 15.396 3.58738C15.4844 3.49898 15.4844 3.35568 15.396 3.26728L14.9762 2.84755C14.8878 2.75915 14.7445 2.75915 14.6561 2.84755C14.5677 2.93594 14.5677 3.07925 14.6561 3.16765L15.0759 3.58738Z"
                      fill="#171D34"
                    />
                    <path
                      d="M13.2927 1.80613C13.3811 1.89453 13.5244 1.89453 13.6128 1.80613C13.7012 1.71773 13.7012 1.57443 13.6128 1.48603L13.193 1.0663C13.1046 0.977901 12.9613 0.977901 12.8729 1.0663C12.7845 1.15469 12.7845 1.298 12.8729 1.3864L13.2927 1.80613Z"
                      fill="#171D34"
                    />
                    <path
                      d="M43.8317 35.0917L43.412 35.5114C43.3236 35.5998 43.3236 35.7431 43.412 35.8315C43.5004 35.9199 43.6437 35.9199 43.7321 35.8315L44.1518 35.4118C44.2402 35.3234 44.2402 35.1801 44.1518 35.0917C44.0634 35.0033 43.9201 35.0033 43.8317 35.0917Z"
                      fill="#171D34"
                    />
                    <path
                      d="M45.5114 34.0503L45.9311 33.6305C46.0195 33.5421 46.0195 33.3988 45.9311 33.3104C45.8427 33.222 45.6994 33.222 45.611 33.3104L45.1913 33.7302C45.1029 33.8186 45.1029 33.9619 45.1913 34.0503C45.2797 34.1387 45.423 34.1387 45.5114 34.0503Z"
                      fill="#171D34"
                    />
                    <path
                      d="M45.5114 35.0917C45.423 35.0033 45.2797 35.0033 45.1913 35.0917C45.1029 35.1801 45.1029 35.3234 45.1913 35.4118L45.611 35.8315C45.6994 35.9199 45.8427 35.9199 45.9311 35.8315C46.0195 35.7431 46.0195 35.5998 45.9311 35.5114L45.5114 35.0917Z"
                      fill="#171D34"
                    />
                    <path
                      d="M43.7321 33.3104C43.6437 33.222 43.5004 33.222 43.412 33.3104C43.3236 33.3988 43.3236 33.5421 43.412 33.6305L43.8317 34.0503C43.9201 34.1387 44.0634 34.1387 44.1518 34.0503C44.2402 33.9619 44.2402 33.8186 44.1518 33.7302L43.7321 33.3104Z"
                      fill="#171D34"
                    />
                  </svg>
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
                      <svg
                        width="50"
                        height="50"
                        viewBox="0 0 50 50"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.8809 4.31792C17.3955 7.56538 19.0195 10.5944 20.9039 13.6999C20.9087 13.7079 20.9135 13.7157 20.9183 13.7237H22.0772H22.3333L22.0788 10.3434C22.071 10.239 22.0836 10.1377 22.1136 10.0438C22.1634 9.88711 22.2607 9.7504 22.3897 9.65197C22.5075 9.56216 22.6518 9.50441 22.8106 9.49245C22.8308 9.49085 22.8509 9.49005 22.871 9.49005C23.2821 9.49005 23.6302 9.80735 23.6615 10.2242L23.8974 13.3598L23.9249 13.7237H26.3291L26.7993 10.1526L26.9991 8.63564C27.0254 8.43543 27.1245 8.26251 27.266 8.13999C27.4067 8.01779 27.5895 7.94569 27.7849 7.94569C27.8195 7.94569 27.8544 7.94792 27.8895 7.95255C28.3241 8.00982 28.6299 8.40847 28.5728 8.84286L28.04 12.8892L27.9821 13.3294L27.9301 13.7237H28.9848C31.5183 8.95166 33.5517 5.62842 35.4506 3.17141C34.7799 2.88602 34.1136 2.67274 33.4495 2.51896C33.3016 2.48466 33.1539 2.45339 33.0063 2.42499C32.1294 2.25574 31.2558 2.18555 30.3812 2.18555C28.3297 2.18555 26.2729 2.57144 24.1563 2.96834C22.3234 3.31212 20.4536 3.66275 18.4972 3.79372C17.9833 3.82802 17.4636 3.84732 16.937 3.84732C16.6889 3.84732 16.4393 3.84302 16.188 3.83408C16.0078 3.8277 15.8267 3.81893 15.6445 3.80744C15.6603 3.84174 15.6761 3.87604 15.6918 3.91018C15.7546 4.04655 15.8176 4.18233 15.8809 4.31792Z"
                          fill="#73C3FD"
                        />
                        <path
                          d="M30.2623 15.3125H19.815C19.7675 15.3541 19.7201 15.3964 19.6729 15.4392C18.9813 16.0645 18.3145 16.8009 17.6815 17.6253C16.7928 18.7831 15.9707 20.1152 15.2412 21.5587C13.1728 25.6517 11.8477 30.6424 11.8477 35.1098C11.8477 39.4177 13.0827 42.4301 15.6235 44.319C17.7863 45.9269 20.8659 46.7085 25.0386 46.7085C26.8912 46.7085 28.5286 46.5544 29.9657 46.2422C31.5431 45.8997 32.8796 45.3668 33.9955 44.6384C34.1526 44.5358 34.3055 44.4294 34.4538 44.319C36.9946 42.4301 38.2296 39.4177 38.2296 35.1098C38.2296 27.8684 34.7474 19.2512 30.2623 15.3125ZM25.3379 40.8307H25.3314C24.6204 40.8307 24.0418 40.2522 24.0418 39.5412V39.0965C23.6785 39.0574 23.3255 38.9956 22.9878 38.9122C22.3513 38.7549 21.7476 38.519 21.1939 38.2109C21.1564 38.19 21.1191 38.1688 21.0819 38.1473C20.8143 37.9914 20.5536 37.8153 20.3054 37.6224C20.0409 37.417 19.8678 37.1218 19.818 36.7916C19.7679 36.4597 19.8477 36.1264 20.0423 35.853L20.0691 35.8155C20.3102 35.477 20.7026 35.275 21.1188 35.275C21.4102 35.275 21.6861 35.3701 21.9166 35.55C22.2798 35.8337 22.6563 36.065 23.036 36.2376C23.6307 36.5083 24.2922 36.6455 25.0023 36.6455C25.9976 36.6455 26.7559 36.4416 27.2564 36.0395C27.7353 35.6547 27.968 35.1037 27.968 34.355V34.3447C27.968 33.9002 27.8686 33.5504 27.6726 33.3046C27.4586 33.0366 27.1875 32.8402 26.8437 32.7043C26.6808 32.64 26.4965 32.5778 26.2917 32.5179C26.0095 32.4353 25.6886 32.3571 25.3315 32.2842L25.3232 32.2825L25.3149 32.2804C25.2883 32.2739 25.2722 32.2704 25.2641 32.2686C25.2422 32.2643 25.22 32.2589 25.1971 32.2522C25.1513 32.245 25.1045 32.2364 25.0578 32.2263C25.0047 32.215 24.9522 32.2021 24.9013 32.1877C24.5473 32.1172 24.2165 32.0437 23.9097 31.9676C23.39 31.8384 22.9396 31.7015 22.5639 31.5584C21.9091 31.3091 21.346 30.8809 20.89 30.2859C20.6527 29.9761 20.4732 29.6028 20.3569 29.1765C20.2451 28.7675 20.1884 28.2977 20.1884 27.7804V27.7698C20.1884 27.1968 20.2534 26.667 20.3823 26.1848C20.4858 25.7967 20.6308 25.4393 20.8166 25.115C21.0408 24.7239 21.322 24.3809 21.6578 24.0885C21.9577 23.8272 22.3012 23.6064 22.6863 23.4272C22.6895 23.4258 22.6927 23.4242 22.696 23.4228C22.8268 23.3623 22.9629 23.3066 23.1039 23.2561C23.3965 23.1506 23.71 23.0665 24.0418 23.0047V22.4798C24.0418 22.3096 24.075 22.1469 24.1353 21.998C24.1912 21.8593 24.2709 21.7324 24.369 21.6225C24.6054 21.3576 24.9492 21.1904 25.3314 21.1904H25.3379C26.0489 21.1904 26.6275 21.7688 26.6275 22.4798V22.9589C26.7888 22.9841 26.9467 23.0147 27.0997 23.0504C27.6016 23.1677 28.106 23.3456 28.5989 23.5793C28.8237 23.686 29.0493 23.8069 29.2694 23.9387C29.5736 24.1209 29.7844 24.412 29.863 24.7582C29.9417 25.1051 29.8771 25.4594 29.6807 25.756C29.4411 26.1179 29.0387 26.3341 28.6045 26.3341C28.3632 26.3341 28.1272 26.2662 27.9222 26.1377C27.8772 26.1095 27.8321 26.0821 27.7871 26.0554C27.528 25.9016 27.2699 25.7727 27.0179 25.6716C26.528 25.4751 26.0386 25.3755 25.5632 25.3755C24.6419 25.3755 23.9376 25.5783 23.4699 25.9784C23.4562 25.9902 23.4426 26.002 23.4294 26.0139C23.4292 26.0139 23.4292 26.0139 23.429 26.0141C23.0023 26.4008 22.7948 26.9417 22.7948 27.666V27.6764C22.7948 28.117 22.9012 28.4489 23.1199 28.6913C23.3638 28.9612 23.6639 29.1552 24.0371 29.2844C24.4578 29.4302 25.0398 29.5827 25.767 29.7376L25.7913 29.7427L25.8146 29.7505C25.8296 29.7556 25.8452 29.7604 25.8612 29.7649L25.8626 29.7652L25.864 29.7657C25.8814 29.7706 25.8994 29.7755 25.9175 29.78C25.9473 29.7861 25.9787 29.7928 26.0135 29.8003L26.0145 29.8006L26.0156 29.8008C26.0461 29.8076 26.0746 29.8137 26.103 29.8193L26.1094 29.8205L26.1159 29.822C26.3378 29.8724 26.5511 29.9252 26.7556 29.9802C27.3578 30.1418 27.8836 30.3222 28.3247 30.5183C28.7682 30.7159 29.1629 30.9943 29.5038 31.3494C29.6534 31.5051 29.7927 31.6757 29.9211 31.8607C30.1382 32.1735 30.3023 32.5441 30.4091 32.9619C30.5118 33.3645 30.564 33.8227 30.564 34.3238V34.3447C30.564 35.362 30.3438 36.2408 29.9096 36.9569C29.7392 37.2378 29.5371 37.4934 29.3042 37.7223C28.9363 38.0847 28.4917 38.381 27.9746 38.608C27.8504 38.6625 27.7217 38.713 27.5887 38.7594C27.2891 38.864 26.9676 38.9479 26.6275 39.0105V39.5412C26.6275 39.836 26.528 40.1082 26.3606 40.3256C26.2718 40.4414 26.1635 40.5418 26.0408 40.6217C25.8385 40.7537 25.597 40.8307 25.3379 40.8307Z"
                          fill="#73C3FD"
                        />
                        <path
                          d="M16.5349 9.47383C17.5884 11.0069 18.6799 12.5007 19.8719 14.0404L20.0202 14.232L20.2611 14.2047L21.667 14.045L22.1285 13.9925L22.077 13.722H20.918C20.9132 13.714 20.9085 13.7062 20.9037 13.6982L20.2124 13.7767C17.8665 10.7462 15.8182 7.76834 13.853 4.51913C14.2889 4.49712 14.7182 4.46107 15.1418 4.41289C15.39 4.38465 15.6363 4.35227 15.8807 4.31622C16.7756 4.18429 17.6452 4.00243 18.4969 3.79202C19.769 3.47743 21.0008 3.0984 22.2158 2.72463C24.274 2.09132 26.2741 1.47571 28.3125 1.24424C29.985 1.05424 31.6831 1.12252 33.4607 1.65135C33.3096 1.90068 33.1581 2.15784 33.0061 2.42329C33.1536 2.45168 33.3013 2.48295 33.4492 2.51725C33.5764 2.29694 33.7029 2.08286 33.829 1.87468L34.1181 1.3977L33.5835 1.23865C32.6923 0.973363 31.8071 0.813199 30.877 0.748591C30.0346 0.690045 29.1798 0.71222 28.2638 0.81623C26.186 1.05233 24.1966 1.66443 22.0902 2.31258L22.0891 2.3129C20.1981 2.89485 18.2524 3.49354 16.1878 3.83238C16.0231 3.8595 15.8577 3.88486 15.6915 3.90847C15.4932 3.93671 15.2938 3.96223 15.0931 3.98504C14.6693 4.03322 14.2448 4.06815 13.8314 4.08889L13.1113 4.12511L13.4845 4.74199C14.4781 6.38494 15.476 7.93282 16.5349 9.47383Z"
                          fill="#171D34"
                        />
                        <path
                          d="M26.7486 12.9819L26.74 13.4731L27.228 13.4176L27.9817 13.3321L28.0396 12.8919L27.1793 12.9897L27.2656 8.14271L27.2669 8.06757C27.2749 7.62935 26.9258 7.26771 26.4876 7.25989C26.4522 7.25926 26.4173 7.26101 26.383 7.26484C25.9933 7.30919 25.6873 7.63637 25.6801 8.03917L25.5887 13.1703L23.8971 13.3625L23.1998 13.4418L22.543 9.99432C22.5186 9.86606 22.4647 9.75104 22.3894 9.65469C22.2604 9.75311 22.1631 9.88983 22.1133 10.0465C22.116 10.0557 22.1182 10.0653 22.12 10.0749L22.7767 13.5224L22.8516 13.9148L23.2485 13.8697L24.5097 13.7264L25.6374 13.5983L26.0126 13.5557L26.0193 13.178L26.1107 8.04683C26.114 7.86545 26.2518 7.71327 26.4316 7.69285C26.4474 7.69109 26.4639 7.69029 26.4801 7.69061C26.577 7.69237 26.6674 7.73161 26.7347 7.80132C26.8019 7.8712 26.8381 7.96292 26.8363 8.05975L26.799 10.1553L26.7486 12.9819Z"
                          fill="#171D34"
                        />
                        <path
                          d="M36.6569 22.0639C34.7379 18.5191 32.3443 15.6376 29.9169 13.9501L29.7837 13.8574L29.6224 13.8758L19.242 15.0551L19.0807 15.0735L18.9717 15.1936C17.5279 16.7841 16.243 18.985 15.2361 21.5598C14.8571 22.5286 14.5176 23.5503 14.2238 24.6125C13.1503 28.4921 12.7801 32.5723 13.181 36.1018C13.3049 37.192 13.501 38.2067 13.764 39.1179C14.0296 40.0386 14.3724 40.8842 14.7829 41.6314C15.1964 42.3844 15.6917 43.0617 16.2555 43.6446C16.8188 44.2274 17.4676 44.7337 18.184 45.1498C20.5973 46.5513 23.8323 46.9985 28.0736 46.5166C28.731 46.4419 29.3597 46.351 29.9606 46.2433C33.2366 45.6569 35.683 44.5777 37.4046 42.9662C38.0093 42.4 38.5281 41.761 38.9464 41.0667C39.3648 40.3723 39.6957 39.601 39.9298 38.7745C40.1621 37.9542 40.3065 37.0532 40.3588 36.0965C40.4107 35.1496 40.3741 34.1167 40.2503 33.0263C39.8493 29.497 38.5731 25.6038 36.6569 22.0639ZM37.1102 42.6516C36.2617 43.446 35.2264 44.1068 33.9904 44.6394C32.3608 45.3417 30.3829 45.8209 28.0249 46.0887C23.879 46.5596 20.7307 46.1307 18.4003 44.7773C15.6625 43.1873 14.0954 40.3335 13.609 36.0531C12.9078 29.8814 14.6381 22.4148 17.6764 17.6264C18.1802 16.8323 18.72 16.1118 19.2906 15.4831L19.6677 15.4402L20.7831 15.3136L29.6711 14.3038C34.5722 17.7109 39.0049 25.8799 39.8223 33.075C40.3087 37.3555 39.4214 40.4881 37.1102 42.6516Z"
                          fill="#171D34"
                        />
                        <path
                          d="M28.3206 30.5169C27.8795 30.3208 27.3537 30.1404 26.7515 29.9788C26.4948 29.9534 26.2255 29.934 25.9438 29.9201L25.9373 29.9198L25.9307 29.9196C25.9017 29.919 25.8725 29.918 25.8414 29.9166H25.8393C25.8037 29.9151 25.7717 29.914 25.7412 29.9132C25.7227 29.9119 25.7042 29.9102 25.6862 29.9083L25.683 29.908C25.6667 29.9064 25.6504 29.9044 25.6348 29.9021L25.6104 29.8984L25.5857 29.8974C24.8426 29.8713 24.2429 29.8223 23.8035 29.7516C23.4133 29.6892 23.0842 29.5503 22.7972 29.3268C22.5395 29.1261 22.3771 28.8178 22.3007 28.3839L22.2988 28.3736C22.1691 27.6379 22.2907 27.056 22.6705 26.5943C22.86 26.3643 23.1122 26.17 23.4249 26.0127C23.4251 26.0125 23.4251 26.0125 23.4252 26.0125C23.7582 25.8452 24.1597 25.7196 24.6274 25.6371C25.0955 25.5545 25.5949 25.5678 26.1115 25.6762C26.4233 25.7416 26.7502 25.8433 27.083 25.9782C27.3052 26.0683 27.5472 26.0945 27.783 26.054C27.785 26.0537 27.787 26.0533 27.789 26.053C28.2167 25.9776 28.5753 25.6949 28.7484 25.2969C28.8902 24.9706 28.8925 24.6104 28.7546 24.2825C28.6171 23.9551 28.359 23.7051 28.0277 23.5785C27.7881 23.4869 27.545 23.407 27.305 23.3409C26.7791 23.1966 26.2515 23.109 25.7367 23.0806C25.5799 23.072 25.4191 23.0693 25.2558 23.0723L25.1727 22.6006C25.0913 22.1396 24.7729 21.7785 24.3648 21.6211C24.2667 21.731 24.1871 21.8578 24.1311 21.9966C24.4404 22.0821 24.689 22.3383 24.7485 22.6754L24.8975 23.5201C25.1679 23.5001 25.4397 23.4957 25.7131 23.5107C26.1994 23.5375 26.692 23.6193 27.1908 23.7563C27.4181 23.8189 27.6458 23.8937 27.8739 23.9808C28.3305 24.1555 28.5484 24.6768 28.3534 25.1251C28.2343 25.3991 27.9888 25.5805 27.7142 25.6289C27.5611 25.6558 27.399 25.6416 27.2447 25.5789C26.8868 25.4339 26.5387 25.3258 26.2 25.2546C25.6267 25.1343 25.0776 25.1203 24.5526 25.213C23.5364 25.3921 22.7983 25.7614 22.3379 26.3207C21.8777 26.88 21.7231 27.5893 21.8746 28.4485L21.8765 28.4587C21.9715 28.9974 22.1902 29.4 22.5325 29.6666C22.8749 29.9332 23.2756 30.1034 23.7352 30.1769C24.1946 30.2508 24.8066 30.301 25.5705 30.328C25.5922 30.3312 25.6155 30.3342 25.6407 30.3366C25.6658 30.3393 25.6926 30.3417 25.721 30.3436C25.7562 30.3444 25.7899 30.3457 25.8218 30.347C25.8537 30.3484 25.8872 30.3495 25.9226 30.3502C26.795 30.3934 27.5327 30.4901 28.1358 30.6402C28.638 30.7654 29.0925 31.0013 29.4996 31.348C29.1587 30.9929 28.7641 30.7145 28.3206 30.5169Z"
                          fill="#171D34"
                        />
                        <path
                          d="M27.5586 38.5904L27.5878 38.7558C27.7208 38.7094 27.8496 38.659 27.9737 38.6044C28.4909 38.3774 28.9355 38.0812 29.3033 37.7188C29.2266 37.7775 29.147 37.8342 29.0645 37.8893C28.6363 38.1748 28.134 38.4082 27.5586 38.5904Z"
                          fill="#171D34"
                        />
                        <path
                          d="M26.0138 39.7782L25.8678 38.9504C25.3911 39.0048 24.9255 39.0176 24.4716 38.9868C23.8525 38.945 23.2602 38.8262 22.6948 38.6304C22.3823 38.5223 22.0767 38.3894 21.7779 38.2315C21.3692 38.0156 21.2006 37.5181 21.3993 37.1006L21.4191 37.059C21.5436 36.7976 21.7817 36.6298 22.0449 36.5834C22.2282 36.551 22.4237 36.5775 22.6015 36.6719C23.0404 36.9052 23.4791 37.0784 23.9176 37.1914C24.6138 37.371 25.3436 37.3935 26.1074 37.2588C27.1917 37.0676 27.9796 36.6912 28.4713 36.13C28.9629 35.5687 29.1325 34.8551 28.9797 33.9889L28.9779 33.9787C28.8828 33.4401 28.6793 33.0332 28.3669 32.7575C28.0547 32.4822 27.6816 32.3002 27.2477 32.2115C26.8136 32.1229 26.2682 32.0695 25.6111 32.0518C25.5826 32.0499 25.5594 32.0487 25.5419 32.0481C25.5242 32.0478 25.5046 32.046 25.4829 32.0427C25.4339 32.0444 25.3846 32.0443 25.3353 32.0424C25.2857 32.0406 25.2358 32.0373 25.1857 32.0318C24.7176 32.0219 24.2911 32.0004 23.906 31.9674C23.5012 31.9326 23.1423 31.8854 22.829 31.8252C22.2177 31.708 21.6645 31.4224 21.1696 30.9683C20.6746 30.5141 20.3438 29.8132 20.1766 28.8653L20.1747 28.855C20.0076 27.9073 20.0537 27.0728 20.3135 26.3521C20.3339 26.2955 20.3554 26.2396 20.3785 26.1846C20.6469 25.5388 21.0884 25.0015 21.7029 24.5724C22.1273 24.276 22.6288 24.0372 23.2058 23.8549L23.1002 23.2559C22.9592 23.3064 22.8231 23.3621 22.6923 23.4226L22.7178 23.5677C22.3286 23.7139 21.9725 23.8881 21.6541 24.0883C21.5865 24.1307 21.5206 24.1744 21.4563 24.2192C20.7182 24.7348 20.1972 25.4032 19.9081 26.2061C19.624 26.995 19.571 27.9113 19.7505 28.9297L19.7524 28.9401C19.8422 29.4496 19.9796 29.9023 20.1606 30.2858C20.3493 30.6854 20.5909 31.0217 20.8785 31.2856C21.4306 31.7924 22.0596 32.1164 22.748 32.2481C23.3755 32.3686 24.1867 32.4407 25.159 32.4621C25.2115 32.4673 25.2656 32.4708 25.3198 32.4728C25.3675 32.4747 25.4152 32.475 25.4615 32.4742C25.4853 32.4767 25.5081 32.4782 25.5304 32.4787C25.5385 32.479 25.5551 32.4798 25.5826 32.4815L25.591 32.4822L25.5995 32.4823C25.845 32.489 26.0747 32.5008 26.288 32.5177C26.6206 32.5441 26.9129 32.5827 27.1616 32.6334C27.5237 32.7076 27.8249 32.8539 28.0822 33.0806C28.3178 33.2886 28.4765 33.6159 28.5537 34.0535L28.5555 34.0637C28.6855 34.801 28.552 35.3841 28.1473 35.8462C27.7242 36.3293 27.0127 36.6617 26.0326 36.8347C25.3334 36.958 24.658 36.9376 24.0253 36.7744C23.6215 36.6703 23.2106 36.5079 22.8036 36.2916C22.5452 36.1544 22.2571 36.1087 21.9701 36.1592C21.5603 36.2315 21.2089 36.4987 21.0302 36.8739L21.0104 36.9155C20.8662 37.2185 20.8456 37.5605 20.9525 37.8788C20.9844 37.9737 21.0267 38.0635 21.0782 38.1471C21.1985 38.3423 21.3693 38.5028 21.5767 38.6124C21.8932 38.7796 22.222 38.9227 22.554 39.0375C23.0287 39.2019 23.5263 39.3159 24.0381 39.3783C24.1719 39.3946 24.3069 39.4073 24.4424 39.4166C24.7894 39.4402 25.1479 39.4395 25.5124 39.415L25.5896 39.853C25.6449 40.1662 25.8094 40.4331 26.0371 40.6215C26.1597 40.5416 26.2681 40.4412 26.3569 40.3254C26.1821 40.1992 26.0543 40.0073 26.0138 39.7782Z"
                          fill="#171D34"
                        />
                        <path
                          d="M11.4808 39.4543C11.6938 39.4047 11.8267 39.191 11.7771 38.9779C11.753 38.8745 11.729 38.7695 11.7059 38.6658C11.7037 38.6561 11.7012 38.6465 11.6983 38.637C11.6708 38.5461 11.6123 38.4688 11.5313 38.4174C11.4418 38.3606 11.3355 38.3421 11.2321 38.3652C11.0374 38.4087 10.9048 38.5911 10.9237 38.7894C10.9252 38.806 10.9279 38.8227 10.9315 38.8389C10.9553 38.9454 10.9798 39.0528 11.0043 39.158C11.0541 39.3711 11.2677 39.504 11.4808 39.4543Z"
                          fill="#171D34"
                        />
                        <path
                          d="M12.241 40.4346C12.2397 40.4302 12.2383 40.4258 12.2368 40.4214C12.2026 40.3212 12.1684 40.2191 12.135 40.118C12.0663 39.9103 11.8415 39.7971 11.6338 39.8658C11.4492 39.9267 11.3365 40.1103 11.366 40.3023C11.3693 40.3241 11.3746 40.3459 11.3815 40.3669C11.416 40.4713 11.451 40.5757 11.4857 40.6773C11.5562 40.8844 11.7821 40.9955 11.9891 40.9249C12.1918 40.8559 12.3025 40.6381 12.241 40.4346Z"
                          fill="#171D34"
                        />
                        <path
                          d="M12.9133 41.7494C12.9062 41.7258 12.8967 41.7026 12.8849 41.68C12.839 41.5923 12.7911 41.4995 12.7386 41.3963C12.6393 41.2014 12.3999 41.1236 12.205 41.2228C12.0376 41.3081 11.9524 41.5012 12.0026 41.682C12.0096 41.7075 12.0194 41.7326 12.0315 41.7564C12.0857 41.8628 12.1349 41.9582 12.182 42.0481C12.2834 42.2418 12.5237 42.317 12.7175 42.2155C12.8887 42.1258 12.9672 41.9279 12.9133 41.7494Z"
                          fill="#171D34"
                        />
                        <path
                          d="M13.7387 42.9654C13.7276 42.9287 13.7111 42.8934 13.6892 42.8605L13.6724 42.8351C13.6191 42.7548 13.5665 42.6742 13.5163 42.5954C13.3987 42.411 13.153 42.3566 12.9685 42.4742C12.8206 42.5685 12.7517 42.7518 12.8009 42.92C12.8114 42.956 12.827 42.9902 12.8473 43.022C12.9006 43.1057 12.9559 43.1905 13.0115 43.2743L13.028 43.2991C13.0866 43.3874 13.176 43.4476 13.2799 43.4686C13.3838 43.4896 13.4896 43.4689 13.5779 43.4104C13.6662 43.3518 13.7264 43.2623 13.7475 43.1585C13.7607 43.0933 13.7574 43.0273 13.7387 42.9654Z"
                          fill="#171D34"
                        />
                        <path
                          d="M14.6368 43.9752C14.5738 43.9097 14.5037 43.8347 14.4223 43.7459C14.2747 43.5845 14.0232 43.5734 13.8618 43.7211C13.7321 43.8398 13.6959 44.0261 13.7715 44.1846C13.7884 44.2199 13.8104 44.2525 13.837 44.2816C13.923 44.3755 13.9975 44.4552 14.0649 44.5253C14.2166 44.6829 14.4682 44.6878 14.6259 44.5361C14.7023 44.4627 14.7454 44.3638 14.7475 44.2579C14.7481 44.2258 14.7449 44.1942 14.7382 44.1637C14.7226 44.0933 14.688 44.0284 14.6368 43.9752Z"
                          fill="#171D34"
                        />
                        <path
                          d="M15.9715 45.1617C15.9499 45.093 15.9099 45.0313 15.8543 44.9826C15.786 44.9228 15.7096 44.8541 15.621 44.7725C15.46 44.6244 15.2085 44.6349 15.0604 44.7959C14.9414 44.9253 14.9212 45.114 15.0102 45.2655C15.03 45.2992 15.0548 45.3298 15.0838 45.3565C15.1774 45.4427 15.2586 45.5157 15.3317 45.5797C15.4963 45.7238 15.7475 45.7071 15.8916 45.5424C15.9613 45.4627 15.9959 45.3605 15.9889 45.2548C15.9867 45.2228 15.9809 45.1916 15.9715 45.1617Z"
                          fill="#171D34"
                        />
                        <path
                          d="M32.3895 9.32622C32.5543 9.42529 32.7682 9.37202 32.8672 9.20723L33.0609 8.88499C33.0722 8.86626 33.0815 8.84694 33.0889 8.82718C33.1465 8.67311 33.088 8.49505 32.942 8.40724C32.7772 8.30818 32.5633 8.36145 32.4642 8.52624L32.2705 8.84846C32.1715 9.01325 32.2247 9.22716 32.3895 9.32622Z"
                          fill="#171D34"
                        />
                        <path
                          d="M31.5907 10.6641C31.7555 10.7632 31.9694 10.7099 32.0684 10.5451L32.2622 10.2229C32.2734 10.2042 32.2827 10.1848 32.2901 10.1651C32.3477 10.011 32.2892 9.83294 32.1432 9.74513C31.9784 9.64607 31.7645 9.69933 31.6654 9.86412L31.4717 10.1863C31.3726 10.3511 31.4259 10.565 31.5907 10.6641Z"
                          fill="#171D34"
                        />
                        <path
                          d="M31.3385 11.0791C31.1737 10.9801 30.9598 11.0333 30.8607 11.1981L30.667 11.5203C30.568 11.6852 30.6212 11.899 30.786 11.9981C30.9508 12.0971 31.1647 12.0439 31.2637 11.8791L31.4575 11.5569C31.4687 11.5381 31.478 11.5188 31.4854 11.499C31.543 11.345 31.4845 11.1669 31.3385 11.0791Z"
                          fill="#171D34"
                        />
                        <path
                          d="M34.8529 4.5985L34.6592 4.92073C34.5602 5.0855 34.6134 5.29941 34.7781 5.39847C34.9429 5.49755 35.1568 5.44427 35.2559 5.2795L35.4496 4.95726C35.4609 4.93853 35.4702 4.91921 35.4776 4.89944C35.5352 4.74538 35.4767 4.56731 35.3306 4.47951C35.1658 4.38044 34.9519 4.43371 34.8529 4.5985Z"
                          fill="#171D34"
                        />
                        <path
                          d="M34.0521 5.93444L33.8584 6.25667C33.7594 6.42142 33.8126 6.63535 33.9774 6.73441C34.1422 6.83348 34.3561 6.78021 34.4551 6.61542L34.6489 6.29318C34.6601 6.27445 34.6694 6.25512 34.6768 6.23537C34.7344 6.0813 34.6759 5.90324 34.5299 5.81544C34.3651 5.71639 34.1512 5.76965 34.0521 5.93444Z"
                          fill="#171D34"
                        />
                        <path
                          d="M33.1727 8.07427C33.3375 8.17333 33.5514 8.12007 33.6504 7.95528L33.8442 7.63304C33.8554 7.61431 33.8647 7.59497 33.8721 7.57523C33.9297 7.42116 33.8712 7.24309 33.7252 7.15529C33.5604 7.05623 33.3465 7.10949 33.2474 7.27428L33.0537 7.59651C32.9547 7.76136 33.0079 7.97522 33.1727 8.07427Z"
                          fill="#171D34"
                        />
                        <path
                          d="M8.65364 36.5384L8.08916 37.1028C7.97028 37.2217 7.97028 37.4145 8.08916 37.5333C8.20804 37.6522 8.40078 37.6522 8.51964 37.5333L9.08412 36.9688C9.203 36.85 9.203 36.6572 9.08412 36.5384C8.96524 36.4195 8.77252 36.4195 8.65364 36.5384Z"
                          fill="#171D34"
                        />
                        <path
                          d="M10.9122 35.1408L11.4767 34.5763C11.5956 34.4574 11.5956 34.2647 11.4767 34.1458C11.3578 34.0269 11.1651 34.0269 11.0462 34.1458L10.4817 34.7103C10.3629 34.8292 10.3629 35.0219 10.4817 35.1408C10.6006 35.2597 10.7933 35.2597 10.9122 35.1408Z"
                          fill="#171D34"
                        />
                        <path
                          d="M11.4767 37.5333C11.5956 37.4145 11.5956 37.2217 11.4767 37.1029L10.9122 36.5384C10.7933 36.4195 10.6006 36.4195 10.4817 36.5384C10.3629 36.6573 10.3629 36.85 10.4817 36.9689L11.0462 37.5334C11.1651 37.6522 11.3578 37.6522 11.4767 37.5333Z"
                          fill="#171D34"
                        />
                        <path
                          d="M8.51964 34.1458C8.40076 34.0269 8.20802 34.0269 8.08916 34.1458C7.97028 34.2647 7.97028 34.4574 8.08916 34.5763L8.65364 35.1408C8.77252 35.2596 8.96526 35.2596 9.08412 35.1408C9.203 35.0219 9.203 34.8291 9.08412 34.7103L8.51964 34.1458Z"
                          fill="#171D34"
                        />
                        <path
                          d="M34.9061 2.45525L35.3049 2.05652C35.3888 1.97255 35.3888 1.83641 35.3049 1.75243C35.2209 1.66846 35.0848 1.66846 35.0008 1.75243L34.602 2.15117C34.5181 2.23514 34.5181 2.37128 34.602 2.45524C34.686 2.53923 34.8222 2.53923 34.9061 2.45525Z"
                          fill="#171D34"
                        />
                        <path
                          d="M36.5975 0.765802L36.9963 0.367068C37.0802 0.283094 37.0802 0.146955 36.9963 0.0629806C36.9123 -0.0209935 36.7762 -0.0209935 36.6922 0.0629806L36.2934 0.461714C36.2095 0.545688 36.2095 0.681827 36.2934 0.765802C36.3774 0.849776 36.5136 0.849776 36.5975 0.765802Z"
                          fill="#171D34"
                        />
                        <path
                          d="M36.6922 2.45525C36.7762 2.53923 36.9123 2.53923 36.9963 2.45525C37.0802 2.37128 37.0802 2.23514 36.9963 2.15117L36.5975 1.75243C36.5136 1.66846 36.3774 1.66846 36.2934 1.75243C36.2095 1.83641 36.2095 1.97255 36.2934 2.05652L36.6922 2.45525Z"
                          fill="#171D34"
                        />
                        <path
                          d="M35.0008 0.765785C35.0848 0.849759 35.2209 0.849759 35.3049 0.765785C35.3888 0.681811 35.3888 0.545672 35.3049 0.461714L34.9061 0.0629806C34.8222 -0.0209935 34.686 -0.0209935 34.602 0.0629806C34.5181 0.146955 34.5181 0.283093 34.602 0.367067L35.0008 0.765785Z"
                          fill="#171D34"
                        />
                        <path
                          d="M28.7039 48.4536L28.3052 48.8523C28.2212 48.9363 28.2212 49.0725 28.3052 49.1564C28.3891 49.2404 28.5253 49.2404 28.6093 49.1564L29.008 48.7577C29.092 48.6737 29.092 48.5376 29.008 48.4536C28.924 48.3696 28.7879 48.3696 28.7039 48.4536Z"
                          fill="#171D34"
                        />
                        <path
                          d="M30.3914 46.7642L29.9927 47.1629C29.9087 47.2469 29.9087 47.383 29.9927 47.467C30.0766 47.5509 30.2128 47.5509 30.2968 47.467L30.6955 47.0682C30.7795 46.9843 30.7795 46.8481 30.6955 46.7642C30.6115 46.6802 30.4754 46.6802 30.3914 46.7642Z"
                          fill="#171D34"
                        />
                        <path
                          d="M30.2968 48.4536C30.2128 48.3696 30.0766 48.3696 29.9927 48.4536C29.9087 48.5376 29.9087 48.6737 29.9927 48.7577L30.3914 49.1564C30.4754 49.2404 30.6115 49.2404 30.6955 49.1564C30.7795 49.0725 30.7795 48.9363 30.6955 48.8523L30.2968 48.4536Z"
                          fill="#171D34"
                        />
                        <path
                          d="M28.6093 46.7642C28.5253 46.6802 28.3891 46.6802 28.3052 46.7642C28.2212 46.8481 28.2212 46.9843 28.3052 47.0682L28.7039 47.467C28.7879 47.5509 28.924 47.5509 29.008 47.467C29.092 47.383 29.092 47.2469 29.008 47.1629L28.6093 46.7642Z"
                          fill="#171D34"
                        />
                        <path
                          d="M14.1551 11.2075L13.7563 11.6062C13.6724 11.6902 13.6724 11.8263 13.7563 11.9103C13.8403 11.9943 13.9765 11.9943 14.0604 11.9103L14.4592 11.5116C14.5431 11.4276 14.5431 11.2915 14.4592 11.2075C14.3752 11.1235 14.239 11.1235 14.1551 11.2075Z"
                          fill="#171D34"
                        />
                        <path
                          d="M16.1506 9.51415C16.0666 9.43018 15.9305 9.43018 15.8465 9.51415L15.4477 9.91289C15.3638 9.99686 15.3638 10.133 15.4477 10.217C15.5317 10.3009 15.6679 10.3009 15.7518 10.217L16.1506 9.81824C16.2345 9.73427 16.2345 9.59813 16.1506 9.51415Z"
                          fill="#171D34"
                        />
                        <path
                          d="M15.7518 11.2075C15.6679 11.1235 15.5317 11.1235 15.4477 11.2075C15.3638 11.2915 15.3638 11.4276 15.4477 11.5116L15.8465 11.9103C15.9305 11.9943 16.0666 11.9943 16.1506 11.9103C16.2345 11.8264 16.2345 11.6902 16.1506 11.6062L15.7518 11.2075Z"
                          fill="#171D34"
                        />
                        <path
                          d="M14.4592 9.91289L14.0604 9.51415C13.9765 9.43018 13.8403 9.43018 13.7563 9.51415C13.6724 9.59813 13.6724 9.73427 13.7563 9.81824L14.1551 10.217C14.239 10.3009 14.3752 10.3009 14.4592 10.217C14.5431 10.133 14.5431 9.99686 14.4592 9.91289Z"
                          fill="#171D34"
                        />
                        <path
                          d="M39.0604 25.7111L39.4592 25.3124C39.5431 25.2284 39.5431 25.0923 39.4592 25.0083C39.3752 24.9243 39.239 24.9243 39.1551 25.0083L38.7563 25.407C38.6724 25.491 38.6724 25.6271 38.7563 25.7111C38.8403 25.7951 38.9765 25.7951 39.0604 25.7111Z"
                          fill="#171D34"
                        />
                        <path
                          d="M40.7518 24.0217L41.1506 23.6229C41.2345 23.539 41.2345 23.4028 41.1506 23.3188C41.0666 23.2349 40.9305 23.2349 40.8465 23.3188L40.4477 23.7176C40.3638 23.8015 40.3638 23.9377 40.4477 24.0217C40.5317 24.1056 40.6679 24.1056 40.7518 24.0217Z"
                          fill="#171D34"
                        />
                        <path
                          d="M40.7518 25.0083C40.6679 24.9243 40.5317 24.9243 40.4477 25.0083C40.3638 25.0923 40.3638 25.2284 40.4477 25.3124L40.8465 25.7111C40.9305 25.7951 41.0666 25.7951 41.1506 25.7111C41.2345 25.6271 41.2345 25.491 41.1506 25.407L40.7518 25.0083Z"
                          fill="#171D34"
                        />
                        <path
                          d="M39.1551 24.0217C39.239 24.1056 39.3752 24.1056 39.4592 24.0217C39.5431 23.9377 39.5431 23.8015 39.4592 23.7176L39.0604 23.3188C38.9765 23.2349 38.8403 23.2349 38.7563 23.3188C38.6724 23.4028 38.6724 23.539 38.7563 23.6229L39.1551 24.0217Z"
                          fill="#171D34"
                        />
                      </svg>{" "}
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

              <div className="pHead">
                <span className="h5">
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 50 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.8809 4.31792C17.3955 7.56538 19.0195 10.5944 20.9039 13.6999C20.9087 13.7079 20.9135 13.7157 20.9183 13.7237H22.0772H22.3333L22.0788 10.3434C22.071 10.239 22.0836 10.1377 22.1136 10.0438C22.1634 9.88711 22.2607 9.7504 22.3897 9.65197C22.5075 9.56216 22.6518 9.50441 22.8106 9.49245C22.8308 9.49085 22.8509 9.49005 22.871 9.49005C23.2821 9.49005 23.6302 9.80735 23.6615 10.2242L23.8974 13.3598L23.9249 13.7237H26.3291L26.7993 10.1526L26.9991 8.63564C27.0254 8.43543 27.1245 8.26251 27.266 8.13999C27.4067 8.01779 27.5895 7.94569 27.7849 7.94569C27.8195 7.94569 27.8544 7.94792 27.8895 7.95255C28.3241 8.00982 28.6299 8.40847 28.5728 8.84286L28.04 12.8892L27.9821 13.3294L27.9301 13.7237H28.9848C31.5183 8.95166 33.5517 5.62842 35.4506 3.17141C34.7799 2.88602 34.1136 2.67274 33.4495 2.51896C33.3016 2.48466 33.1539 2.45339 33.0063 2.42499C32.1294 2.25574 31.2558 2.18555 30.3812 2.18555C28.3297 2.18555 26.2729 2.57144 24.1563 2.96834C22.3234 3.31212 20.4536 3.66275 18.4972 3.79372C17.9833 3.82802 17.4636 3.84732 16.937 3.84732C16.6889 3.84732 16.4393 3.84302 16.188 3.83408C16.0078 3.8277 15.8267 3.81893 15.6445 3.80744C15.6603 3.84174 15.6761 3.87604 15.6918 3.91018C15.7546 4.04655 15.8176 4.18233 15.8809 4.31792Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M30.2623 15.3125H19.815C19.7675 15.3541 19.7201 15.3964 19.6729 15.4392C18.9813 16.0645 18.3145 16.8009 17.6815 17.6253C16.7928 18.7831 15.9707 20.1152 15.2412 21.5587C13.1728 25.6517 11.8477 30.6424 11.8477 35.1098C11.8477 39.4177 13.0827 42.4301 15.6235 44.319C17.7863 45.9269 20.8659 46.7085 25.0386 46.7085C26.8912 46.7085 28.5286 46.5544 29.9657 46.2422C31.5431 45.8997 32.8796 45.3668 33.9955 44.6384C34.1526 44.5358 34.3055 44.4294 34.4538 44.319C36.9946 42.4301 38.2296 39.4177 38.2296 35.1098C38.2296 27.8684 34.7474 19.2512 30.2623 15.3125ZM25.3379 40.8307H25.3314C24.6204 40.8307 24.0418 40.2522 24.0418 39.5412V39.0965C23.6785 39.0574 23.3255 38.9956 22.9878 38.9122C22.3513 38.7549 21.7476 38.519 21.1939 38.2109C21.1564 38.19 21.1191 38.1688 21.0819 38.1473C20.8143 37.9914 20.5536 37.8153 20.3054 37.6224C20.0409 37.417 19.8678 37.1218 19.818 36.7916C19.7679 36.4597 19.8477 36.1264 20.0423 35.853L20.0691 35.8155C20.3102 35.477 20.7026 35.275 21.1188 35.275C21.4102 35.275 21.6861 35.3701 21.9166 35.55C22.2798 35.8337 22.6563 36.065 23.036 36.2376C23.6307 36.5083 24.2922 36.6455 25.0023 36.6455C25.9976 36.6455 26.7559 36.4416 27.2564 36.0395C27.7353 35.6547 27.968 35.1037 27.968 34.355V34.3447C27.968 33.9002 27.8686 33.5504 27.6726 33.3046C27.4586 33.0366 27.1875 32.8402 26.8437 32.7043C26.6808 32.64 26.4965 32.5778 26.2917 32.5179C26.0095 32.4353 25.6886 32.3571 25.3315 32.2842L25.3232 32.2825L25.3149 32.2804C25.2883 32.2739 25.2722 32.2704 25.2641 32.2686C25.2422 32.2643 25.22 32.2589 25.1971 32.2522C25.1513 32.245 25.1045 32.2364 25.0578 32.2263C25.0047 32.215 24.9522 32.2021 24.9013 32.1877C24.5473 32.1172 24.2165 32.0437 23.9097 31.9676C23.39 31.8384 22.9396 31.7015 22.5639 31.5584C21.9091 31.3091 21.346 30.8809 20.89 30.2859C20.6527 29.9761 20.4732 29.6028 20.3569 29.1765C20.2451 28.7675 20.1884 28.2977 20.1884 27.7804V27.7698C20.1884 27.1968 20.2534 26.667 20.3823 26.1848C20.4858 25.7967 20.6308 25.4393 20.8166 25.115C21.0408 24.7239 21.322 24.3809 21.6578 24.0885C21.9577 23.8272 22.3012 23.6064 22.6863 23.4272C22.6895 23.4258 22.6927 23.4242 22.696 23.4228C22.8268 23.3623 22.9629 23.3066 23.1039 23.2561C23.3965 23.1506 23.71 23.0665 24.0418 23.0047V22.4798C24.0418 22.3096 24.075 22.1469 24.1353 21.998C24.1912 21.8593 24.2709 21.7324 24.369 21.6225C24.6054 21.3576 24.9492 21.1904 25.3314 21.1904H25.3379C26.0489 21.1904 26.6275 21.7688 26.6275 22.4798V22.9589C26.7888 22.9841 26.9467 23.0147 27.0997 23.0504C27.6016 23.1677 28.106 23.3456 28.5989 23.5793C28.8237 23.686 29.0493 23.8069 29.2694 23.9387C29.5736 24.1209 29.7844 24.412 29.863 24.7582C29.9417 25.1051 29.8771 25.4594 29.6807 25.756C29.4411 26.1179 29.0387 26.3341 28.6045 26.3341C28.3632 26.3341 28.1272 26.2662 27.9222 26.1377C27.8772 26.1095 27.8321 26.0821 27.7871 26.0554C27.528 25.9016 27.2699 25.7727 27.0179 25.6716C26.528 25.4751 26.0386 25.3755 25.5632 25.3755C24.6419 25.3755 23.9376 25.5783 23.4699 25.9784C23.4562 25.9902 23.4426 26.002 23.4294 26.0139C23.4292 26.0139 23.4292 26.0139 23.429 26.0141C23.0023 26.4008 22.7948 26.9417 22.7948 27.666V27.6764C22.7948 28.117 22.9012 28.4489 23.1199 28.6913C23.3638 28.9612 23.6639 29.1552 24.0371 29.2844C24.4578 29.4302 25.0398 29.5827 25.767 29.7376L25.7913 29.7427L25.8146 29.7505C25.8296 29.7556 25.8452 29.7604 25.8612 29.7649L25.8626 29.7652L25.864 29.7657C25.8814 29.7706 25.8994 29.7755 25.9175 29.78C25.9473 29.7861 25.9787 29.7928 26.0135 29.8003L26.0145 29.8006L26.0156 29.8008C26.0461 29.8076 26.0746 29.8137 26.103 29.8193L26.1094 29.8205L26.1159 29.822C26.3378 29.8724 26.5511 29.9252 26.7556 29.9802C27.3578 30.1418 27.8836 30.3222 28.3247 30.5183C28.7682 30.7159 29.1629 30.9943 29.5038 31.3494C29.6534 31.5051 29.7927 31.6757 29.9211 31.8607C30.1382 32.1735 30.3023 32.5441 30.4091 32.9619C30.5118 33.3645 30.564 33.8227 30.564 34.3238V34.3447C30.564 35.362 30.3438 36.2408 29.9096 36.9569C29.7392 37.2378 29.5371 37.4934 29.3042 37.7223C28.9363 38.0847 28.4917 38.381 27.9746 38.608C27.8504 38.6625 27.7217 38.713 27.5887 38.7594C27.2891 38.864 26.9676 38.9479 26.6275 39.0105V39.5412C26.6275 39.836 26.528 40.1082 26.3606 40.3256C26.2718 40.4414 26.1635 40.5418 26.0408 40.6217C25.8385 40.7537 25.597 40.8307 25.3379 40.8307Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M16.5349 9.47383C17.5884 11.0069 18.6799 12.5007 19.8719 14.0404L20.0202 14.232L20.2611 14.2047L21.667 14.045L22.1285 13.9925L22.077 13.722H20.918C20.9132 13.714 20.9085 13.7062 20.9037 13.6982L20.2124 13.7767C17.8665 10.7462 15.8182 7.76834 13.853 4.51913C14.2889 4.49712 14.7182 4.46107 15.1418 4.41289C15.39 4.38465 15.6363 4.35227 15.8807 4.31622C16.7756 4.18429 17.6452 4.00243 18.4969 3.79202C19.769 3.47743 21.0008 3.0984 22.2158 2.72463C24.274 2.09132 26.2741 1.47571 28.3125 1.24424C29.985 1.05424 31.6831 1.12252 33.4607 1.65135C33.3096 1.90068 33.1581 2.15784 33.0061 2.42329C33.1536 2.45168 33.3013 2.48295 33.4492 2.51725C33.5764 2.29694 33.7029 2.08286 33.829 1.87468L34.1181 1.3977L33.5835 1.23865C32.6923 0.973363 31.8071 0.813199 30.877 0.748591C30.0346 0.690045 29.1798 0.71222 28.2638 0.81623C26.186 1.05233 24.1966 1.66443 22.0902 2.31258L22.0891 2.3129C20.1981 2.89485 18.2524 3.49354 16.1878 3.83238C16.0231 3.8595 15.8577 3.88486 15.6915 3.90847C15.4932 3.93671 15.2938 3.96223 15.0931 3.98504C14.6693 4.03322 14.2448 4.06815 13.8314 4.08889L13.1113 4.12511L13.4845 4.74199C14.4781 6.38494 15.476 7.93282 16.5349 9.47383Z"
                      fill="#171D34"
                    />
                    <path
                      d="M26.7486 12.9819L26.74 13.4731L27.228 13.4176L27.9817 13.3321L28.0396 12.8919L27.1793 12.9897L27.2656 8.14271L27.2669 8.06757C27.2749 7.62935 26.9258 7.26771 26.4876 7.25989C26.4522 7.25926 26.4173 7.26101 26.383 7.26484C25.9933 7.30919 25.6873 7.63637 25.6801 8.03917L25.5887 13.1703L23.8971 13.3625L23.1998 13.4418L22.543 9.99432C22.5186 9.86606 22.4647 9.75104 22.3894 9.65469C22.2604 9.75311 22.1631 9.88983 22.1133 10.0465C22.116 10.0557 22.1182 10.0653 22.12 10.0749L22.7767 13.5224L22.8516 13.9148L23.2485 13.8697L24.5097 13.7264L25.6374 13.5983L26.0126 13.5557L26.0193 13.178L26.1107 8.04683C26.114 7.86545 26.2518 7.71327 26.4316 7.69285C26.4474 7.69109 26.4639 7.69029 26.4801 7.69061C26.577 7.69237 26.6674 7.73161 26.7347 7.80132C26.8019 7.8712 26.8381 7.96292 26.8363 8.05975L26.799 10.1553L26.7486 12.9819Z"
                      fill="#171D34"
                    />
                    <path
                      d="M36.6569 22.0639C34.7379 18.5191 32.3443 15.6376 29.9169 13.9501L29.7837 13.8574L29.6224 13.8758L19.242 15.0551L19.0807 15.0735L18.9717 15.1936C17.5279 16.7841 16.243 18.985 15.2361 21.5598C14.8571 22.5286 14.5176 23.5503 14.2238 24.6125C13.1503 28.4921 12.7801 32.5723 13.181 36.1018C13.3049 37.192 13.501 38.2067 13.764 39.1179C14.0296 40.0386 14.3724 40.8842 14.7829 41.6314C15.1964 42.3844 15.6917 43.0617 16.2555 43.6446C16.8188 44.2274 17.4676 44.7337 18.184 45.1498C20.5973 46.5513 23.8323 46.9985 28.0736 46.5166C28.731 46.4419 29.3597 46.351 29.9606 46.2433C33.2366 45.6569 35.683 44.5777 37.4046 42.9662C38.0093 42.4 38.5281 41.761 38.9464 41.0667C39.3648 40.3723 39.6957 39.601 39.9298 38.7745C40.1621 37.9542 40.3065 37.0532 40.3588 36.0965C40.4107 35.1496 40.3741 34.1167 40.2503 33.0263C39.8493 29.497 38.5731 25.6038 36.6569 22.0639ZM37.1102 42.6516C36.2617 43.446 35.2264 44.1068 33.9904 44.6394C32.3608 45.3417 30.3829 45.8209 28.0249 46.0887C23.879 46.5596 20.7307 46.1307 18.4003 44.7773C15.6625 43.1873 14.0954 40.3335 13.609 36.0531C12.9078 29.8814 14.6381 22.4148 17.6764 17.6264C18.1802 16.8323 18.72 16.1118 19.2906 15.4831L19.6677 15.4402L20.7831 15.3136L29.6711 14.3038C34.5722 17.7109 39.0049 25.8799 39.8223 33.075C40.3087 37.3555 39.4214 40.4881 37.1102 42.6516Z"
                      fill="#171D34"
                    />
                    <path
                      d="M28.3206 30.5169C27.8795 30.3208 27.3537 30.1404 26.7515 29.9788C26.4948 29.9534 26.2255 29.934 25.9438 29.9201L25.9373 29.9198L25.9307 29.9196C25.9017 29.919 25.8725 29.918 25.8414 29.9166H25.8393C25.8037 29.9151 25.7717 29.914 25.7412 29.9132C25.7227 29.9119 25.7042 29.9102 25.6862 29.9083L25.683 29.908C25.6667 29.9064 25.6504 29.9044 25.6348 29.9021L25.6104 29.8984L25.5857 29.8974C24.8426 29.8713 24.2429 29.8223 23.8035 29.7516C23.4133 29.6892 23.0842 29.5503 22.7972 29.3268C22.5395 29.1261 22.3771 28.8178 22.3007 28.3839L22.2988 28.3736C22.1691 27.6379 22.2907 27.056 22.6705 26.5943C22.86 26.3643 23.1122 26.17 23.4249 26.0127C23.4251 26.0125 23.4251 26.0125 23.4252 26.0125C23.7582 25.8452 24.1597 25.7196 24.6274 25.6371C25.0955 25.5545 25.5949 25.5678 26.1115 25.6762C26.4233 25.7416 26.7502 25.8433 27.083 25.9782C27.3052 26.0683 27.5472 26.0945 27.783 26.054C27.785 26.0537 27.787 26.0533 27.789 26.053C28.2167 25.9776 28.5753 25.6949 28.7484 25.2969C28.8902 24.9706 28.8925 24.6104 28.7546 24.2825C28.6171 23.9551 28.359 23.7051 28.0277 23.5785C27.7881 23.4869 27.545 23.407 27.305 23.3409C26.7791 23.1966 26.2515 23.109 25.7367 23.0806C25.5799 23.072 25.4191 23.0693 25.2558 23.0723L25.1727 22.6006C25.0913 22.1396 24.7729 21.7785 24.3648 21.6211C24.2667 21.731 24.1871 21.8578 24.1311 21.9966C24.4404 22.0821 24.689 22.3383 24.7485 22.6754L24.8975 23.5201C25.1679 23.5001 25.4397 23.4957 25.7131 23.5107C26.1994 23.5375 26.692 23.6193 27.1908 23.7563C27.4181 23.8189 27.6458 23.8937 27.8739 23.9808C28.3305 24.1555 28.5484 24.6768 28.3534 25.1251C28.2343 25.3991 27.9888 25.5805 27.7142 25.6289C27.5611 25.6558 27.399 25.6416 27.2447 25.5789C26.8868 25.4339 26.5387 25.3258 26.2 25.2546C25.6267 25.1343 25.0776 25.1203 24.5526 25.213C23.5364 25.3921 22.7983 25.7614 22.3379 26.3207C21.8777 26.88 21.7231 27.5893 21.8746 28.4485L21.8765 28.4587C21.9715 28.9974 22.1902 29.4 22.5325 29.6666C22.8749 29.9332 23.2756 30.1034 23.7352 30.1769C24.1946 30.2508 24.8066 30.301 25.5705 30.328C25.5922 30.3312 25.6155 30.3342 25.6407 30.3366C25.6658 30.3393 25.6926 30.3417 25.721 30.3436C25.7562 30.3444 25.7899 30.3457 25.8218 30.347C25.8537 30.3484 25.8872 30.3495 25.9226 30.3502C26.795 30.3934 27.5327 30.4901 28.1358 30.6402C28.638 30.7654 29.0925 31.0013 29.4996 31.348C29.1587 30.9929 28.7641 30.7145 28.3206 30.5169Z"
                      fill="#171D34"
                    />
                    <path
                      d="M27.5586 38.5904L27.5878 38.7558C27.7208 38.7094 27.8496 38.659 27.9737 38.6044C28.4909 38.3774 28.9355 38.0812 29.3033 37.7188C29.2266 37.7775 29.147 37.8342 29.0645 37.8893C28.6363 38.1748 28.134 38.4082 27.5586 38.5904Z"
                      fill="#171D34"
                    />
                    <path
                      d="M26.0138 39.7782L25.8678 38.9504C25.3911 39.0048 24.9255 39.0176 24.4716 38.9868C23.8525 38.945 23.2602 38.8262 22.6948 38.6304C22.3823 38.5223 22.0767 38.3894 21.7779 38.2315C21.3692 38.0156 21.2006 37.5181 21.3993 37.1006L21.4191 37.059C21.5436 36.7976 21.7817 36.6298 22.0449 36.5834C22.2282 36.551 22.4237 36.5775 22.6015 36.6719C23.0404 36.9052 23.4791 37.0784 23.9176 37.1914C24.6138 37.371 25.3436 37.3935 26.1074 37.2588C27.1917 37.0676 27.9796 36.6912 28.4713 36.13C28.9629 35.5687 29.1325 34.8551 28.9797 33.9889L28.9779 33.9787C28.8828 33.4401 28.6793 33.0332 28.3669 32.7575C28.0547 32.4822 27.6816 32.3002 27.2477 32.2115C26.8136 32.1229 26.2682 32.0695 25.6111 32.0518C25.5826 32.0499 25.5594 32.0487 25.5419 32.0481C25.5242 32.0478 25.5046 32.046 25.4829 32.0427C25.4339 32.0444 25.3846 32.0443 25.3353 32.0424C25.2857 32.0406 25.2358 32.0373 25.1857 32.0318C24.7176 32.0219 24.2911 32.0004 23.906 31.9674C23.5012 31.9326 23.1423 31.8854 22.829 31.8252C22.2177 31.708 21.6645 31.4224 21.1696 30.9683C20.6746 30.5141 20.3438 29.8132 20.1766 28.8653L20.1747 28.855C20.0076 27.9073 20.0537 27.0728 20.3135 26.3521C20.3339 26.2955 20.3554 26.2396 20.3785 26.1846C20.6469 25.5388 21.0884 25.0015 21.7029 24.5724C22.1273 24.276 22.6288 24.0372 23.2058 23.8549L23.1002 23.2559C22.9592 23.3064 22.8231 23.3621 22.6923 23.4226L22.7178 23.5677C22.3286 23.7139 21.9725 23.8881 21.6541 24.0883C21.5865 24.1307 21.5206 24.1744 21.4563 24.2192C20.7182 24.7348 20.1972 25.4032 19.9081 26.2061C19.624 26.995 19.571 27.9113 19.7505 28.9297L19.7524 28.9401C19.8422 29.4496 19.9796 29.9023 20.1606 30.2858C20.3493 30.6854 20.5909 31.0217 20.8785 31.2856C21.4306 31.7924 22.0596 32.1164 22.748 32.2481C23.3755 32.3686 24.1867 32.4407 25.159 32.4621C25.2115 32.4673 25.2656 32.4708 25.3198 32.4728C25.3675 32.4747 25.4152 32.475 25.4615 32.4742C25.4853 32.4767 25.5081 32.4782 25.5304 32.4787C25.5385 32.479 25.5551 32.4798 25.5826 32.4815L25.591 32.4822L25.5995 32.4823C25.845 32.489 26.0747 32.5008 26.288 32.5177C26.6206 32.5441 26.9129 32.5827 27.1616 32.6334C27.5237 32.7076 27.8249 32.8539 28.0822 33.0806C28.3178 33.2886 28.4765 33.6159 28.5537 34.0535L28.5555 34.0637C28.6855 34.801 28.552 35.3841 28.1473 35.8462C27.7242 36.3293 27.0127 36.6617 26.0326 36.8347C25.3334 36.958 24.658 36.9376 24.0253 36.7744C23.6215 36.6703 23.2106 36.5079 22.8036 36.2916C22.5452 36.1544 22.2571 36.1087 21.9701 36.1592C21.5603 36.2315 21.2089 36.4987 21.0302 36.8739L21.0104 36.9155C20.8662 37.2185 20.8456 37.5605 20.9525 37.8788C20.9844 37.9737 21.0267 38.0635 21.0782 38.1471C21.1985 38.3423 21.3693 38.5028 21.5767 38.6124C21.8932 38.7796 22.222 38.9227 22.554 39.0375C23.0287 39.2019 23.5263 39.3159 24.0381 39.3783C24.1719 39.3946 24.3069 39.4073 24.4424 39.4166C24.7894 39.4402 25.1479 39.4395 25.5124 39.415L25.5896 39.853C25.6449 40.1662 25.8094 40.4331 26.0371 40.6215C26.1597 40.5416 26.2681 40.4412 26.3569 40.3254C26.1821 40.1992 26.0543 40.0073 26.0138 39.7782Z"
                      fill="#171D34"
                    />
                    <path
                      d="M11.4808 39.4543C11.6938 39.4047 11.8267 39.191 11.7771 38.9779C11.753 38.8745 11.729 38.7695 11.7059 38.6658C11.7037 38.6561 11.7012 38.6465 11.6983 38.637C11.6708 38.5461 11.6123 38.4688 11.5313 38.4174C11.4418 38.3606 11.3355 38.3421 11.2321 38.3652C11.0374 38.4087 10.9048 38.5911 10.9237 38.7894C10.9252 38.806 10.9279 38.8227 10.9315 38.8389C10.9553 38.9454 10.9798 39.0528 11.0043 39.158C11.0541 39.3711 11.2677 39.504 11.4808 39.4543Z"
                      fill="#171D34"
                    />
                    <path
                      d="M12.241 40.4346C12.2397 40.4302 12.2383 40.4258 12.2368 40.4214C12.2026 40.3212 12.1684 40.2191 12.135 40.118C12.0663 39.9103 11.8415 39.7971 11.6338 39.8658C11.4492 39.9267 11.3365 40.1103 11.366 40.3023C11.3693 40.3241 11.3746 40.3459 11.3815 40.3669C11.416 40.4713 11.451 40.5757 11.4857 40.6773C11.5562 40.8844 11.7821 40.9955 11.9891 40.9249C12.1918 40.8559 12.3025 40.6381 12.241 40.4346Z"
                      fill="#171D34"
                    />
                    <path
                      d="M12.9133 41.7494C12.9062 41.7258 12.8967 41.7026 12.8849 41.68C12.839 41.5923 12.7911 41.4995 12.7386 41.3963C12.6393 41.2014 12.3999 41.1236 12.205 41.2228C12.0376 41.3081 11.9524 41.5012 12.0026 41.682C12.0096 41.7075 12.0194 41.7326 12.0315 41.7564C12.0857 41.8628 12.1349 41.9582 12.182 42.0481C12.2834 42.2418 12.5237 42.317 12.7175 42.2155C12.8887 42.1258 12.9672 41.9279 12.9133 41.7494Z"
                      fill="#171D34"
                    />
                    <path
                      d="M13.7387 42.9654C13.7276 42.9287 13.7111 42.8934 13.6892 42.8605L13.6724 42.8351C13.6191 42.7548 13.5665 42.6742 13.5163 42.5954C13.3987 42.411 13.153 42.3566 12.9685 42.4742C12.8206 42.5685 12.7517 42.7518 12.8009 42.92C12.8114 42.956 12.827 42.9902 12.8473 43.022C12.9006 43.1057 12.9559 43.1905 13.0115 43.2743L13.028 43.2991C13.0866 43.3874 13.176 43.4476 13.2799 43.4686C13.3838 43.4896 13.4896 43.4689 13.5779 43.4104C13.6662 43.3518 13.7264 43.2623 13.7475 43.1585C13.7607 43.0933 13.7574 43.0273 13.7387 42.9654Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.6368 43.9752C14.5738 43.9097 14.5037 43.8347 14.4223 43.7459C14.2747 43.5845 14.0232 43.5734 13.8618 43.7211C13.7321 43.8398 13.6959 44.0261 13.7715 44.1846C13.7884 44.2199 13.8104 44.2525 13.837 44.2816C13.923 44.3755 13.9975 44.4552 14.0649 44.5253C14.2166 44.6829 14.4682 44.6878 14.6259 44.5361C14.7023 44.4627 14.7454 44.3638 14.7475 44.2579C14.7481 44.2258 14.7449 44.1942 14.7382 44.1637C14.7226 44.0933 14.688 44.0284 14.6368 43.9752Z"
                      fill="#171D34"
                    />
                    <path
                      d="M15.9715 45.1617C15.9499 45.093 15.9099 45.0313 15.8543 44.9826C15.786 44.9228 15.7096 44.8541 15.621 44.7725C15.46 44.6244 15.2085 44.6349 15.0604 44.7959C14.9414 44.9253 14.9212 45.114 15.0102 45.2655C15.03 45.2992 15.0548 45.3298 15.0838 45.3565C15.1774 45.4427 15.2586 45.5157 15.3317 45.5797C15.4963 45.7238 15.7475 45.7071 15.8916 45.5424C15.9613 45.4627 15.9959 45.3605 15.9889 45.2548C15.9867 45.2228 15.9809 45.1916 15.9715 45.1617Z"
                      fill="#171D34"
                    />
                    <path
                      d="M32.3895 9.32622C32.5543 9.42529 32.7682 9.37202 32.8672 9.20723L33.0609 8.88499C33.0722 8.86626 33.0815 8.84694 33.0889 8.82718C33.1465 8.67311 33.088 8.49505 32.942 8.40724C32.7772 8.30818 32.5633 8.36145 32.4642 8.52624L32.2705 8.84846C32.1715 9.01325 32.2247 9.22716 32.3895 9.32622Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.5907 10.6641C31.7555 10.7632 31.9694 10.7099 32.0684 10.5451L32.2622 10.2229C32.2734 10.2042 32.2827 10.1848 32.2901 10.1651C32.3477 10.011 32.2892 9.83294 32.1432 9.74513C31.9784 9.64607 31.7645 9.69933 31.6654 9.86412L31.4717 10.1863C31.3726 10.3511 31.4259 10.565 31.5907 10.6641Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.3385 11.0791C31.1737 10.9801 30.9598 11.0333 30.8607 11.1981L30.667 11.5203C30.568 11.6852 30.6212 11.899 30.786 11.9981C30.9508 12.0971 31.1647 12.0439 31.2637 11.8791L31.4575 11.5569C31.4687 11.5381 31.478 11.5188 31.4854 11.499C31.543 11.345 31.4845 11.1669 31.3385 11.0791Z"
                      fill="#171D34"
                    />
                    <path
                      d="M34.8529 4.5985L34.6592 4.92073C34.5602 5.0855 34.6134 5.29941 34.7781 5.39847C34.9429 5.49755 35.1568 5.44427 35.2559 5.2795L35.4496 4.95726C35.4609 4.93853 35.4702 4.91921 35.4776 4.89944C35.5352 4.74538 35.4767 4.56731 35.3306 4.47951C35.1658 4.38044 34.9519 4.43371 34.8529 4.5985Z"
                      fill="#171D34"
                    />
                    <path
                      d="M34.0521 5.93444L33.8584 6.25667C33.7594 6.42142 33.8126 6.63535 33.9774 6.73441C34.1422 6.83348 34.3561 6.78021 34.4551 6.61542L34.6489 6.29318C34.6601 6.27445 34.6694 6.25512 34.6768 6.23537C34.7344 6.0813 34.6759 5.90324 34.5299 5.81544C34.3651 5.71639 34.1512 5.76965 34.0521 5.93444Z"
                      fill="#171D34"
                    />
                    <path
                      d="M33.1727 8.07427C33.3375 8.17333 33.5514 8.12007 33.6504 7.95528L33.8442 7.63304C33.8554 7.61431 33.8647 7.59497 33.8721 7.57523C33.9297 7.42116 33.8712 7.24309 33.7252 7.15529C33.5604 7.05623 33.3465 7.10949 33.2474 7.27428L33.0537 7.59651C32.9547 7.76136 33.0079 7.97522 33.1727 8.07427Z"
                      fill="#171D34"
                    />
                    <path
                      d="M8.65364 36.5384L8.08916 37.1028C7.97028 37.2217 7.97028 37.4145 8.08916 37.5333C8.20804 37.6522 8.40078 37.6522 8.51964 37.5333L9.08412 36.9688C9.203 36.85 9.203 36.6572 9.08412 36.5384C8.96524 36.4195 8.77252 36.4195 8.65364 36.5384Z"
                      fill="#171D34"
                    />
                    <path
                      d="M10.9122 35.1408L11.4767 34.5763C11.5956 34.4574 11.5956 34.2647 11.4767 34.1458C11.3578 34.0269 11.1651 34.0269 11.0462 34.1458L10.4817 34.7103C10.3629 34.8292 10.3629 35.0219 10.4817 35.1408C10.6006 35.2597 10.7933 35.2597 10.9122 35.1408Z"
                      fill="#171D34"
                    />
                    <path
                      d="M11.4767 37.5333C11.5956 37.4145 11.5956 37.2217 11.4767 37.1029L10.9122 36.5384C10.7933 36.4195 10.6006 36.4195 10.4817 36.5384C10.3629 36.6573 10.3629 36.85 10.4817 36.9689L11.0462 37.5334C11.1651 37.6522 11.3578 37.6522 11.4767 37.5333Z"
                      fill="#171D34"
                    />
                    <path
                      d="M8.51964 34.1458C8.40076 34.0269 8.20802 34.0269 8.08916 34.1458C7.97028 34.2647 7.97028 34.4574 8.08916 34.5763L8.65364 35.1408C8.77252 35.2596 8.96526 35.2596 9.08412 35.1408C9.203 35.0219 9.203 34.8291 9.08412 34.7103L8.51964 34.1458Z"
                      fill="#171D34"
                    />
                    <path
                      d="M34.9061 2.45525L35.3049 2.05652C35.3888 1.97255 35.3888 1.83641 35.3049 1.75243C35.2209 1.66846 35.0848 1.66846 35.0008 1.75243L34.602 2.15117C34.5181 2.23514 34.5181 2.37128 34.602 2.45524C34.686 2.53923 34.8222 2.53923 34.9061 2.45525Z"
                      fill="#171D34"
                    />
                    <path
                      d="M36.5975 0.765802L36.9963 0.367068C37.0802 0.283094 37.0802 0.146955 36.9963 0.0629806C36.9123 -0.0209935 36.7762 -0.0209935 36.6922 0.0629806L36.2934 0.461714C36.2095 0.545688 36.2095 0.681827 36.2934 0.765802C36.3774 0.849776 36.5136 0.849776 36.5975 0.765802Z"
                      fill="#171D34"
                    />
                    <path
                      d="M36.6922 2.45525C36.7762 2.53923 36.9123 2.53923 36.9963 2.45525C37.0802 2.37128 37.0802 2.23514 36.9963 2.15117L36.5975 1.75243C36.5136 1.66846 36.3774 1.66846 36.2934 1.75243C36.2095 1.83641 36.2095 1.97255 36.2934 2.05652L36.6922 2.45525Z"
                      fill="#171D34"
                    />
                    <path
                      d="M35.0008 0.765785C35.0848 0.849759 35.2209 0.849759 35.3049 0.765785C35.3888 0.681811 35.3888 0.545672 35.3049 0.461714L34.9061 0.0629806C34.8222 -0.0209935 34.686 -0.0209935 34.602 0.0629806C34.5181 0.146955 34.5181 0.283093 34.602 0.367067L35.0008 0.765785Z"
                      fill="#171D34"
                    />
                    <path
                      d="M28.7039 48.4536L28.3052 48.8523C28.2212 48.9363 28.2212 49.0725 28.3052 49.1564C28.3891 49.2404 28.5253 49.2404 28.6093 49.1564L29.008 48.7577C29.092 48.6737 29.092 48.5376 29.008 48.4536C28.924 48.3696 28.7879 48.3696 28.7039 48.4536Z"
                      fill="#171D34"
                    />
                    <path
                      d="M30.3914 46.7642L29.9927 47.1629C29.9087 47.2469 29.9087 47.383 29.9927 47.467C30.0766 47.5509 30.2128 47.5509 30.2968 47.467L30.6955 47.0682C30.7795 46.9843 30.7795 46.8481 30.6955 46.7642C30.6115 46.6802 30.4754 46.6802 30.3914 46.7642Z"
                      fill="#171D34"
                    />
                    <path
                      d="M30.2968 48.4536C30.2128 48.3696 30.0766 48.3696 29.9927 48.4536C29.9087 48.5376 29.9087 48.6737 29.9927 48.7577L30.3914 49.1564C30.4754 49.2404 30.6115 49.2404 30.6955 49.1564C30.7795 49.0725 30.7795 48.9363 30.6955 48.8523L30.2968 48.4536Z"
                      fill="#171D34"
                    />
                    <path
                      d="M28.6093 46.7642C28.5253 46.6802 28.3891 46.6802 28.3052 46.7642C28.2212 46.8481 28.2212 46.9843 28.3052 47.0682L28.7039 47.467C28.7879 47.5509 28.924 47.5509 29.008 47.467C29.092 47.383 29.092 47.2469 29.008 47.1629L28.6093 46.7642Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.1551 11.2075L13.7563 11.6062C13.6724 11.6902 13.6724 11.8263 13.7563 11.9103C13.8403 11.9943 13.9765 11.9943 14.0604 11.9103L14.4592 11.5116C14.5431 11.4276 14.5431 11.2915 14.4592 11.2075C14.3752 11.1235 14.239 11.1235 14.1551 11.2075Z"
                      fill="#171D34"
                    />
                    <path
                      d="M16.1506 9.51415C16.0666 9.43018 15.9305 9.43018 15.8465 9.51415L15.4477 9.91289C15.3638 9.99686 15.3638 10.133 15.4477 10.217C15.5317 10.3009 15.6679 10.3009 15.7518 10.217L16.1506 9.81824C16.2345 9.73427 16.2345 9.59813 16.1506 9.51415Z"
                      fill="#171D34"
                    />
                    <path
                      d="M15.7518 11.2075C15.6679 11.1235 15.5317 11.1235 15.4477 11.2075C15.3638 11.2915 15.3638 11.4276 15.4477 11.5116L15.8465 11.9103C15.9305 11.9943 16.0666 11.9943 16.1506 11.9103C16.2345 11.8264 16.2345 11.6902 16.1506 11.6062L15.7518 11.2075Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.4592 9.91289L14.0604 9.51415C13.9765 9.43018 13.8403 9.43018 13.7563 9.51415C13.6724 9.59813 13.6724 9.73427 13.7563 9.81824L14.1551 10.217C14.239 10.3009 14.3752 10.3009 14.4592 10.217C14.5431 10.133 14.5431 9.99686 14.4592 9.91289Z"
                      fill="#171D34"
                    />
                    <path
                      d="M39.0604 25.7111L39.4592 25.3124C39.5431 25.2284 39.5431 25.0923 39.4592 25.0083C39.3752 24.9243 39.239 24.9243 39.1551 25.0083L38.7563 25.407C38.6724 25.491 38.6724 25.6271 38.7563 25.7111C38.8403 25.7951 38.9765 25.7951 39.0604 25.7111Z"
                      fill="#171D34"
                    />
                    <path
                      d="M40.7518 24.0217L41.1506 23.6229C41.2345 23.539 41.2345 23.4028 41.1506 23.3188C41.0666 23.2349 40.9305 23.2349 40.8465 23.3188L40.4477 23.7176C40.3638 23.8015 40.3638 23.9377 40.4477 24.0217C40.5317 24.1056 40.6679 24.1056 40.7518 24.0217Z"
                      fill="#171D34"
                    />
                    <path
                      d="M40.7518 25.0083C40.6679 24.9243 40.5317 24.9243 40.4477 25.0083C40.3638 25.0923 40.3638 25.2284 40.4477 25.3124L40.8465 25.7111C40.9305 25.7951 41.0666 25.7951 41.1506 25.7111C41.2345 25.6271 41.2345 25.491 41.1506 25.407L40.7518 25.0083Z"
                      fill="#171D34"
                    />
                    <path
                      d="M39.1551 24.0217C39.239 24.1056 39.3752 24.1056 39.4592 24.0217C39.5431 23.9377 39.5431 23.8015 39.4592 23.7176L39.0604 23.3188C38.9765 23.2349 38.8403 23.2349 38.7563 23.3188C38.6724 23.4028 38.6724 23.539 38.7563 23.6229L39.1551 24.0217Z"
                      fill="#171D34"
                    />
                  </svg>{" "}
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
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 50 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M27.7639 40.1492C27.5047 40.0762 27.2557 39.9984 27.0182 39.9161C26.8307 39.8515 26.6505 39.7838 26.4778 39.7135C26.4238 39.6916 26.3704 39.6693 26.3179 39.6467C26.1624 39.5801 26.0134 39.511 25.8711 39.44V41.0308C25.8812 41.0688 25.9596 41.2046 26.2035 41.3895C26.3357 41.4895 26.4979 41.5905 26.6857 41.6895C26.8113 41.7557 26.9466 41.8204 27.0914 41.8832C27.3425 41.9924 27.6218 42.0964 27.9265 42.194C29.6208 42.7367 31.8725 43.0357 34.2667 43.0357C37.8553 43.0357 41.1398 42.374 42.4402 41.3895C42.6839 41.2046 42.7623 41.0688 42.7726 41.0308V39.4395C40.8735 40.3868 37.7852 40.9422 34.3234 40.9422C31.8808 40.9422 29.5711 40.6585 27.7639 40.1492Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M35.008 36.7555L34.6441 36.7635V36.7596C34.429 36.7619 34.2146 36.7619 33.9995 36.7596V36.7619L33.6355 36.7555C32.8084 36.7372 31.5233 36.6704 30.0977 36.456C29.0218 36.2942 28.0638 36.0776 27.2383 35.8098C26.9744 35.7245 26.724 35.6337 26.4877 35.5379C26.4844 35.5367 26.4812 35.5352 26.4779 35.534C26.2644 35.4471 26.0616 35.3556 25.8711 35.2603V36.8574C25.8738 36.8859 25.9076 36.9518 26.0014 37.0458C26.127 37.1722 26.3606 37.349 26.7705 37.5527C28.3263 38.3257 30.9969 38.8113 33.9154 38.8517H34.7212C35.461 38.8517 36.2992 38.8029 37.1293 38.7148C37.6792 38.6566 38.2253 38.5809 38.7373 38.491C40.2298 38.2287 41.3988 37.8562 42.1446 37.4072C42.2244 37.3592 42.2993 37.3104 42.3693 37.2607C42.649 37.0613 42.7607 36.9015 42.7726 36.8524V36.4127V35.61V35.2598C41.8625 35.7154 40.685 36.0769 39.2612 36.3376C37.5061 36.6588 35.843 36.7374 35.008 36.7555Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M26.7691 25.091C27.4099 25.4052 28.3829 25.73 29.6335 25.9776C30.9031 26.229 32.4585 26.4006 34.2422 26.4006C34.6254 26.4006 35.013 26.3926 35.4025 26.3766C35.4028 26.3764 35.403 26.3764 35.4033 26.3764C35.8464 26.3584 36.2921 26.3299 36.7365 26.2913C37.6568 26.2115 40.7783 25.8707 42.3175 24.8354C42.7459 24.5423 42.7657 24.4042 42.7662 24.3985C42.7666 24.3969 42.7694 24.3575 42.6556 24.2355L42.6523 24.2316C42.6108 24.1857 42.5639 24.1403 42.5119 24.0952C42.354 23.9581 42.1485 23.8249 41.8997 23.6974C41.6606 23.5745 41.3816 23.4572 41.066 23.3464C40.6228 23.1908 40.1079 23.0484 39.5316 22.9239C37.9869 22.5902 36.0958 22.4062 34.2067 22.4062H34.206C31.6045 22.4064 29.2428 22.7478 27.556 23.3678C27.2664 23.4739 27.0024 23.5861 26.7707 23.7011C26.2625 23.9536 26.0456 24.1524 25.953 24.2749L25.9432 24.2873C25.9409 24.2902 25.9386 24.2929 25.9364 24.2957C25.895 24.3475 25.8747 24.3908 25.8711 24.4042C25.8771 24.4624 26.0408 24.7339 26.7691 25.091Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M34.3205 28.4807C31.2508 28.4807 28.3923 28.0337 26.4778 27.2543C26.3782 27.2139 26.2812 27.1724 26.1864 27.1299C26.078 27.0814 25.9728 27.0316 25.8711 26.9808V28.498C25.8732 28.5124 25.8916 28.556 25.9448 28.6208H26.0071L26.0785 28.7558C26.0812 28.7581 26.0839 28.7604 26.0866 28.7627C26.0919 28.7672 26.0967 28.7713 26.1013 28.7754C26.2632 28.9116 26.4947 29.0564 26.7712 29.1944C27.0369 29.327 27.3448 29.4545 27.6863 29.5737C28.0321 29.6949 28.4041 29.805 28.7987 29.9034C30.3416 30.2886 32.2306 30.4964 34.2491 30.4964C34.815 30.4964 35.3813 30.4797 35.9379 30.4469C37.1947 30.3733 38.4032 30.219 39.4508 29.995C40.9811 29.6677 42.109 29.2043 42.627 28.6906C42.7306 28.5868 42.7662 28.5154 42.7726 28.493V27.5346V26.9805C42.3178 27.2071 41.7947 27.4114 41.214 27.5909C39.3728 28.1602 36.9556 28.4807 34.3205 28.4807Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M26.7702 33.3738C27.3883 33.68 29.7541 34.679 34.2486 34.679C34.5844 34.679 34.9279 34.6731 35.2697 34.6614C37.287 34.5962 39.1846 34.3145 40.6136 33.8685C41.7191 33.5282 42.5816 33.0588 42.761 32.7L42.7615 32.699C42.7636 32.6947 42.7657 32.6907 42.7677 32.6868C42.7762 32.597 42.7755 32.2885 42.7742 31.7135C42.7738 31.5317 42.7734 31.3244 42.7731 31.082C41.83 31.5545 40.6019 31.9252 39.1111 32.1867C37.282 32.5076 35.5602 32.5728 34.6916 32.583C34.6838 32.5835 34.676 32.5839 34.668 32.5841C34.654 32.5844 34.6338 32.5847 34.6089 32.5849C34.4939 32.5858 34.2703 32.5854 34.1183 32.5846C34.0723 32.5843 34.0328 32.5841 34.0048 32.5838C33.9899 32.5837 33.978 32.5835 33.9699 32.5834C33.9658 32.5833 33.9618 32.5832 33.9577 32.583C33.0982 32.5731 31.7609 32.5165 30.2662 32.303C28.7691 32.0891 27.4945 31.7707 26.4779 31.3568C26.2645 31.2699 26.0618 31.1784 25.8711 31.0828V32.6795C25.8748 32.7335 26.0383 33.0112 26.7702 33.3738Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M28.9504 20.8236C28.9506 20.8236 28.9507 20.8234 28.9509 20.8234C29.54 20.7031 30.1683 20.6028 30.8279 20.5247V20.317V18.3081V7.47149C30.8279 6.80659 30.2869 6.26562 29.622 6.26562H29.3234H28.5383H6.11602C5.45112 6.26562 4.91016 6.80659 4.91016 7.47149V25.7926V31.7133V41.2619C4.91016 41.9268 5.45112 42.4678 6.11602 42.4678H6.21342H6.93103H24.3278C24.3228 42.4615 24.3178 42.4555 24.313 42.4494C23.9615 42.013 23.7834 41.5376 23.7834 41.0359C23.7834 38.295 23.7809 35.8567 23.7786 33.7053C23.7731 28.4504 23.7722 25.8072 23.7986 24.6499C23.7986 24.6497 23.7986 24.6497 23.7986 24.6496C23.8083 24.2195 23.8221 23.9946 23.8406 23.9175C23.9775 23.3474 24.3522 22.8274 24.9542 22.3723C25.3588 22.0664 25.8714 21.7866 26.4779 21.5409C27.1802 21.2563 28.0155 21.0147 28.9504 20.8236ZM7.20436 10.1122C7.20436 9.51819 7.68781 9.03474 8.28202 9.03474H22.9004H26.4557H27.456C28.0502 9.03474 28.5337 9.51819 28.5337 10.1122V19.1151C28.5337 19.7093 28.0502 20.1926 27.456 20.1926H8.28202C7.68781 20.1926 7.20436 19.7093 7.20436 19.1151V10.1122ZM8.85148 30.03H12.4589C13.2914 30.03 13.9761 30.6759 14.038 31.4928C14.041 31.5327 14.0427 31.573 14.0427 31.6137C14.0427 31.8372 13.996 32.05 13.9121 32.243C13.6684 32.8041 13.1087 33.1973 12.4589 33.1973H8.94318H8.85148C8.63531 33.1973 8.42928 33.1538 8.24142 33.075C7.67019 32.8356 7.26793 32.2708 7.26793 31.6137C7.26793 30.7405 7.97824 30.03 8.85148 30.03ZM7.26793 25.9537C7.26793 25.0805 7.97824 24.37 8.85148 24.37H12.4589C13.3322 24.37 14.0427 25.0805 14.0427 25.9537C14.0427 26.1038 14.0216 26.2491 13.9825 26.387C13.9032 26.6651 13.7497 26.9123 13.5448 27.1055C13.2611 27.3733 12.8788 27.5374 12.4589 27.5374H8.85148C8.65845 27.5374 8.47344 27.5027 8.30214 27.4391C8.07173 27.3537 7.86659 27.216 7.70081 27.0406C7.43247 26.7568 7.26793 26.3741 7.26793 25.9537ZM14.9511 32.7379C14.7047 32.4939 14.5379 32.1697 14.4935 31.808C14.4857 31.7444 14.4816 31.6794 14.4816 31.6137C14.4816 30.7405 15.1921 30.03 16.0653 30.03H19.6728C20.1133 30.03 20.5123 30.2108 20.7996 30.5021C21.0715 30.7777 21.2435 31.1524 21.2558 31.5664C21.2563 31.582 21.2565 31.5979 21.2565 31.6137C21.2565 32.1707 20.9673 32.6615 20.5314 32.9437C20.2839 33.1042 19.989 33.1973 19.6728 33.1973H16.0653C15.8625 33.1973 15.6684 33.159 15.49 33.089H15.4898C15.2864 33.0096 15.1037 32.8892 14.9511 32.7379ZM21.2565 25.9537C21.2565 26.827 20.546 27.5374 19.6728 27.5374H18.0954H16.0653C15.9211 27.5374 15.7813 27.518 15.6485 27.4817C15.246 27.3718 14.907 27.1069 14.6999 26.7552C14.5612 26.52 14.4816 26.2459 14.4816 25.9537C14.4816 25.0805 15.1921 24.37 16.0653 24.37H19.6728C20.4404 24.37 21.0823 24.9192 21.2262 25.6453C21.2462 25.745 21.2565 25.8481 21.2565 25.9537ZM13.9889 37.683C13.8081 38.3585 13.1906 38.8573 12.4589 38.8573H8.85148C7.97824 38.8573 7.26793 38.1468 7.26793 37.2736C7.26793 36.4003 7.97824 35.6899 8.85148 35.6899H12.4589C13.2278 35.6899 13.8705 36.2406 14.0131 36.9684C14.0325 37.067 14.0427 37.1692 14.0427 37.2736C14.0427 37.4151 14.024 37.5524 13.9889 37.683ZM16.0653 38.8573C15.9127 38.8573 15.7651 38.8356 15.6253 38.795C15.3479 38.7148 15.1016 38.5605 14.9095 38.355C14.7765 38.2132 14.6694 38.0469 14.5957 37.8639C14.522 37.6814 14.4816 37.4821 14.4816 37.2736C14.4816 37.1908 14.488 37.1096 14.5003 37.0302C14.6176 36.2721 15.2749 35.6899 16.0653 35.6899H19.6728C20.103 35.6899 20.4938 35.8624 20.7794 36.1418C20.9673 36.3254 21.1096 36.5553 21.1879 36.8127C21.2326 36.9586 21.2565 37.1133 21.2565 37.2736C21.2565 37.8662 20.9294 38.3838 20.4461 38.6552L20.4459 38.6554C20.2171 38.7839 19.9534 38.8573 19.6728 38.8573H18.7796H17.1802H16.2403H16.0653Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M44.9821 35.7344L44.4824 36.1363C42.9387 37.3782 39.7391 38.4213 36.1322 38.8584C33.173 39.217 30.3798 39.1237 28.4688 38.6025C28.0578 38.4904 27.6882 38.3584 27.3703 38.2101L26.7891 37.939L27.1313 40.7629C27.1764 41.135 27.5481 41.4244 27.8522 41.6017C28.0287 41.7046 28.2371 41.8022 28.4715 41.8917C28.8725 42.0448 29.3477 42.1746 29.884 42.2773C31.7017 42.6258 34.051 42.6543 36.4992 42.3576C38.2779 42.1421 39.9936 41.7732 41.4609 41.2909C43.0053 40.7833 44.1685 40.1796 44.8247 39.5448C45.0775 39.3001 45.3694 38.9303 45.3243 38.5582L44.9821 35.7344ZM44.3294 39.0329C43.1571 40.1669 39.9759 41.2188 36.4135 41.6505C34.0366 41.9386 31.7653 41.9127 30.0181 41.5777C29.5226 41.4828 29.0877 41.3646 28.7256 41.2263C28.5272 41.1505 28.354 41.0698 28.2109 40.9863C27.9464 40.8321 27.8523 40.7068 27.8376 40.6704L27.6462 39.091C27.8467 39.1626 28.0589 39.2289 28.2814 39.2896C30.2779 39.8342 33.1706 39.9347 36.2179 39.5654C39.6546 39.149 42.6537 38.226 44.4249 37.0572L44.6163 38.637C44.6107 38.6759 44.5492 38.8201 44.3294 39.0329Z"
                      fill="#171D34"
                    />
                    <path
                      d="M42.7107 32.7865C40.6265 33.8574 37.8148 34.3857 36.569 34.5791L36.4065 34.6024L36.2857 34.6198C36.066 34.6514 35.8424 34.6809 35.6208 34.7078C35.3995 34.7345 35.1751 34.7593 34.9542 34.7812L34.7692 34.8004C33.5841 34.9076 30.3736 35.1099 27.959 34.4528C27.5486 34.3412 27.1792 34.2089 26.8612 34.06L26.2793 33.7874L26.4916 35.5401C26.7278 35.6359 26.9782 35.7267 27.2421 35.812L27.1365 34.9412C27.3372 35.0132 27.5494 35.0796 27.772 35.14C28.79 35.417 30.0363 35.5785 31.4765 35.6199C32.9174 35.6612 34.2013 35.573 35.0245 35.4917L35.3867 35.4541L35.3863 35.4519C35.6002 35.4283 35.813 35.4024 36.0263 35.3745L36.0268 35.3782L36.3871 35.3266C37.2138 35.208 38.8554 34.93 40.5592 34.3999C41.9413 33.9699 43.0667 33.4693 43.9154 32.9075L44.107 34.4886C44.1009 34.5388 44.0094 34.7108 43.7558 34.9425C43.5053 35.1704 43.1764 35.395 42.7764 35.6122V36.4149C43.3824 36.1174 43.8701 35.8013 44.2355 35.4689C44.6582 35.0828 44.8532 34.726 44.8146 34.4078L44.4723 31.584L43.9729 31.9859C43.6055 32.2813 43.1762 32.5475 42.7107 32.7865Z"
                      fill="#171D34"
                    />
                    <path
                      d="M26.2471 22.7654C25.7705 23.0787 25.4554 23.3725 25.2839 23.6634C25.2217 23.7615 25.1452 23.9102 25.1237 24.074C25.0739 24.4383 25.2851 24.9655 26.5696 25.413C27.4055 25.7043 28.5212 25.9052 29.796 25.9942C31.2573 26.0961 32.8286 26.0471 34.466 25.8487C35.3001 25.7476 36.1493 25.6067 36.9899 25.43C37.9363 25.2311 41.1433 24.4794 42.6756 23.1541L42.6776 23.1524C43.1209 22.7633 43.3172 22.4453 43.3139 22.1212C43.3106 21.7938 43.0955 21.574 42.933 21.4368C42.1262 20.7388 40.5008 20.4576 39.2787 20.3446C37.6561 20.1945 35.7029 20.2402 33.7789 20.4734L33.7781 20.4735C31.1144 20.7963 28.7262 21.4454 27.0535 22.3009C26.7561 22.4528 26.4848 22.6091 26.2471 22.7654ZM33.8638 21.1805L33.8646 21.1805C35.7399 20.9532 37.6393 20.9082 39.2131 21.0538C40.7948 21.2001 41.9509 21.5278 42.4683 21.9765L42.4722 21.9799C42.5998 22.0873 42.6017 22.1268 42.6017 22.1284C42.6017 22.1342 42.5987 22.2738 42.2087 22.6162C40.8052 23.8292 37.7473 24.5429 36.8433 24.7329C36.0227 24.9055 35.194 25.043 34.3803 25.1416C30.8655 25.5675 28.162 25.2136 26.8039 24.7404C26.0379 24.4735 25.8428 24.2236 25.8299 24.1667C25.8318 24.1522 25.8483 24.1026 25.8873 24.0419L25.8956 24.0284C25.9727 23.8957 26.1642 23.6723 26.6383 23.3606C26.8545 23.2185 27.1032 23.0754 27.3778 22.9351C28.9778 22.1167 31.2813 21.4936 33.8638 21.1805Z"
                      fill="#171D34"
                    />
                    <path
                      d="M42.5193 24.1008C42.5713 24.1459 42.6181 24.1913 42.6596 24.2372L42.663 24.2411C42.7768 24.3631 42.7739 24.4025 42.7736 24.4041C42.7731 24.4098 42.7533 24.548 42.3249 24.841C40.7857 25.8763 37.6642 26.2171 36.7439 26.2969C36.2994 26.3356 35.8538 26.364 35.4107 26.382C35.4104 26.382 35.4102 26.382 35.4098 26.3822C35.1515 26.4203 34.8902 26.4556 34.6271 26.4874C31.6676 26.8461 28.8757 26.7535 26.9668 26.2334C26.5558 26.1213 26.1863 25.9894 25.8685 25.8411L25.2871 25.5701L25.6199 28.3157C25.6479 28.5459 25.7912 28.7635 26.0466 28.9633L26.0697 28.9813C26.0783 28.9877 26.0868 28.9939 26.0955 29.0003L26.2091 29.0838L26.2159 29.0829C26.4401 29.2268 26.7255 29.3611 27.0649 29.4822C27.3732 29.592 27.7236 29.69 28.1059 29.7733C28.3304 29.8228 28.5642 29.8668 28.8062 29.9056C28.4116 29.8071 28.0397 29.6971 27.6939 29.5758C27.3523 29.4567 27.0444 29.3292 26.7788 29.1966C26.5022 29.0586 26.2707 28.9138 26.1089 28.7776C26.1043 28.7735 26.0994 28.7694 26.0941 28.7649C26.0914 28.7626 26.0888 28.7603 26.0861 28.758L26.0147 28.623H25.9524C25.8991 28.5582 25.8808 28.5146 25.8786 28.5001V26.983C25.9803 27.0338 26.0856 27.0836 26.194 27.1321L26.1443 26.722C26.3448 26.7935 26.5571 26.86 26.7795 26.9205C28.7738 27.464 31.6654 27.5639 34.7127 27.1946C38.1535 26.7775 41.1537 25.8553 42.923 24.6883L43.105 26.1897C43.1014 26.213 43.0747 26.288 42.9841 26.4036C42.67 26.8012 42.0604 27.21 41.2216 27.5931C41.8022 27.4136 42.3254 27.2093 42.7802 26.9827V27.5368C43.0831 27.3247 43.3468 27.0936 43.5439 26.8441C43.7496 26.5816 43.84 26.335 43.813 26.111L43.4802 23.3652L42.9805 23.7675C42.8402 23.8804 42.6862 23.9917 42.5193 24.1008Z"
                      fill="#171D34"
                    />
                    <path
                      d="M27.0983 41.882C26.9535 41.8191 26.8182 41.7545 26.6926 41.6883C26.5048 41.5893 26.3426 41.4883 26.2104 41.3882C25.9665 41.2034 25.8881 41.0675 25.878 41.0296V39.4388C26.0203 39.5098 26.1693 39.5789 26.3248 39.6455C26.2153 38.7443 26.1097 37.8778 26.0083 37.0461C25.9642 36.6833 25.9207 36.3274 25.878 35.9779C25.7751 35.1349 25.6766 34.3297 25.5828 33.5613C24.9301 28.2215 24.4579 24.3581 24.4681 23.9991C24.5177 23.5867 24.7553 23.1726 25.1741 22.768C25.4943 22.459 25.9191 22.1569 26.4371 21.87C27.1282 21.4872 27.9822 21.1339 28.9576 20.8242C28.0228 21.0153 27.1875 21.2569 26.4852 21.5415C25.8787 21.7872 25.366 22.0669 24.9615 22.3729C24.3594 22.828 23.9848 23.348 23.8479 23.9181C23.8293 23.9952 23.8156 24.2201 23.8058 24.6502C23.8058 24.6503 23.8058 24.6503 23.8058 24.6505C23.9182 25.7998 24.2373 28.4239 24.8758 33.6479C25.1369 35.7832 25.4326 38.2037 25.7624 40.9245C25.8228 41.4226 26.0569 41.8733 26.4581 42.2641C26.4638 42.2695 26.4695 42.275 26.4752 42.2805L8.39561 44.4714C7.73551 44.5514 7.13347 44.0795 7.05352 43.4194L6.93831 42.4684H6.2207L6.34642 43.5053C6.47356 44.5551 7.43138 45.3059 8.48126 45.1785L28.5525 42.7462L27.591 42.2134C27.4051 42.1105 27.2395 41.999 27.0983 41.882Z"
                      fill="#171D34"
                    />
                    <path
                      d="M4.03878 8.53533L4.91594 8.42903L22.7383 6.26926L27.3742 5.70746C27.8545 5.64923 28.3041 5.88321 28.5441 6.26926H29.3292C29.0377 5.4384 28.1978 4.89031 27.2886 5.00036L16.8177 6.26926L4.91594 7.7116L3.95313 7.82823C2.90308 7.95555 2.15253 8.91319 2.27967 9.96324L4.91594 31.7169V25.7962L2.98677 9.87742C2.90682 9.2175 3.37869 8.61546 4.03878 8.53533Z"
                      fill="#171D34"
                    />
                    <path
                      d="M30.832 18.3105V20.3195L31.0689 20.2648L30.832 18.3105Z"
                      fill="#171D34"
                    />
                    <path
                      d="M10.6766 40.5567L14.2579 40.1227C15.1248 40.0177 15.7446 39.2269 15.6396 38.36C15.5345 37.4931 14.7438 36.8733 13.8769 36.9784L10.2956 37.4124C9.4287 37.5175 8.80891 38.3082 8.91395 39.1751C9.01901 40.042 9.80977 40.6618 10.6766 40.5567ZM10.3813 38.1195L13.9625 37.6855C14.4403 37.6276 14.8746 37.968 14.9325 38.4457C14.9904 38.9235 14.65 39.3578 14.1722 39.4157L10.591 39.8497C10.1132 39.9075 9.67894 39.5672 9.62105 39.0894C9.56315 38.6116 9.90354 38.1774 10.3813 38.1195Z"
                      fill="#171D34"
                    />
                    <path
                      d="M8.94785 33.1982C9.01908 32.8383 9.31414 32.549 9.69805 32.5023L13.2793 32.0684C13.516 32.0397 13.7419 32.1088 13.9168 32.2439C14.0007 32.0509 14.0473 31.8381 14.0473 31.6146C14.0473 31.5739 14.0457 31.5336 14.0427 31.4937C13.7857 31.3755 13.4942 31.3247 13.1937 31.3613L9.6124 31.7954C8.91028 31.8805 8.37038 32.415 8.24609 33.0759C8.43395 33.1547 8.63998 33.1982 8.85615 33.1982H8.94785Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.9596 32.7404C14.9142 32.3739 14.7463 32.0518 14.502 31.8105C14.5463 32.1722 14.7131 32.4965 14.9596 32.7404Z"
                      fill="#171D34"
                    />
                    <path
                      d="M9.31532 29.3204L12.8966 28.8864C13.7635 28.7813 14.3833 27.9906 14.2782 27.1237C14.1732 26.2568 13.3824 25.637 12.5155 25.7421L8.93427 26.1761C8.06738 26.2811 7.44758 27.0719 7.55262 27.9388C7.65768 28.8057 8.44842 29.4255 9.31532 29.3204ZM8.25971 27.8531C8.2018 27.3753 8.54219 26.9411 9.01994 26.8832L12.6012 26.4492C13.079 26.3913 13.5132 26.7316 13.5711 27.2094C13.629 27.6872 13.2886 28.1214 12.8109 28.1793L9.22962 28.6133C8.75186 28.6712 8.31761 28.3308 8.25971 27.8531Z"
                      fill="#171D34"
                    />
                    <path
                      d="M20.4515 38.6562L18.7852 38.8582H19.6783C19.959 38.8582 20.2227 38.7848 20.4515 38.6562Z"
                      fill="#171D34"
                    />
                    <path
                      d="M21.1956 36.8155C21.1173 36.558 20.975 36.3281 20.7872 36.1445L17.4577 36.548C16.5909 36.6531 15.971 37.4439 16.0761 38.3107C16.1001 38.5085 16.1598 38.6936 16.2481 38.86H17.1879C16.9717 38.7254 16.8161 38.4975 16.7832 38.2251C16.7253 37.7473 17.0656 37.3132 17.5433 37.2551L21.1246 36.8212C21.1485 36.8183 21.1721 36.8164 21.1956 36.8155Z"
                      fill="#171D34"
                    />
                    <path
                      d="M22.122 31.8757C22.0169 31.0088 21.2262 30.389 20.3593 30.494L16.778 30.928C15.9111 31.0331 15.2913 31.8238 15.3964 32.6907C15.5014 33.5576 16.2922 34.1774 17.1591 34.0723L20.7403 33.6383C21.6072 33.5333 22.227 32.7425 22.122 31.8757ZM20.6546 32.9313L17.0734 33.3653C16.5956 33.4232 16.1614 33.0828 16.1035 32.605C16.0456 32.1273 16.386 31.693 16.8637 31.6351L20.445 31.2011C20.9227 31.1432 21.357 31.4836 21.4149 31.9613C21.4728 32.4391 21.1324 32.8734 20.6546 32.9313Z"
                      fill="#171D34"
                    />
                    <path
                      d="M19.9719 27.3121L18.1026 27.5386H19.6799C20.5531 27.5386 21.2636 26.8281 21.2636 25.9549C21.2636 25.8493 21.2533 25.7462 21.2333 25.6465C20.9237 25.1194 20.3211 24.7967 19.6765 24.8749L16.0952 25.3089C15.3351 25.4009 14.7647 26.0204 14.707 26.7564C14.9141 27.108 15.2532 27.373 15.6556 27.4829C15.5301 27.3516 15.4442 27.1802 15.4207 26.9859C15.3628 26.5081 15.7031 26.0738 16.1809 26.016L19.7622 25.582C20.2399 25.5241 20.6742 25.8644 20.7321 26.3422C20.79 26.8199 20.4497 27.2542 19.9719 27.3121Z"
                      fill="#171D34"
                    />
                    <path
                      d="M7.86651 22.0993L23.5809 20.1949L26.9015 19.7925C27.4912 19.7211 27.9129 19.183 27.8415 18.5932L26.7583 9.65589C26.7291 9.41372 26.6212 9.20004 26.4634 9.03711H22.9081L7.21212 10.9392L6.52407 11.0226C5.93431 11.0941 5.51265 11.6321 5.58406 12.2218L6.66723 21.1593C6.73864 21.7491 7.27658 22.1708 7.86651 22.0993ZM6.6099 11.7297L7.21212 11.6566L25.6447 9.42298C25.8446 9.39858 26.027 9.54157 26.0512 9.74154L27.1344 18.6789C27.1586 18.8788 27.0156 19.0612 26.8156 19.0854L17.6603 20.1949L7.78086 21.3922C7.58089 21.4165 7.39855 21.2735 7.37433 21.0735L6.29116 12.1362C6.26694 11.9362 6.40993 11.7539 6.6099 11.7297Z"
                      fill="#171D34"
                    />
                    <path
                      d="M35.4737 30.5145L35.2766 30.5407C35.2625 30.5424 35.2474 30.5443 35.231 30.5462C35.1079 30.5612 34.9707 30.5773 34.8801 30.5877L34.772 30.5996C33.7309 30.7137 30.1269 31.0297 27.4613 30.3033C27.0515 30.1916 26.6821 30.0592 26.3633 29.9097L25.7812 29.6368L26.1237 32.4622C26.1788 32.9173 26.6654 33.31 27.5698 33.6293C28.3973 33.9214 29.4987 34.1226 30.755 34.2113C32.2126 34.3142 33.8002 34.2635 35.4736 34.0607C35.815 34.0194 36.1635 33.971 36.5087 33.9172C37.6994 33.7336 39.9832 33.2968 41.9004 32.4333C42.1714 32.3125 42.7 32.0611 43.1959 31.7336C43.7873 31.3431 44.1389 30.974 44.2709 30.6052C44.2725 30.6008 44.2741 30.5969 44.2755 30.5931C44.3407 30.4223 44.3407 30.4223 44.2018 29.2968C44.1629 28.9819 44.1146 28.59 44.0516 28.0703L43.9744 27.4336L43.4748 27.8357C41.7008 29.2632 38.1785 30.1554 35.4737 30.5145ZM43.6055 30.3509C43.604 30.3551 43.6024 30.3593 43.6008 30.3638L43.6004 30.3649C43.4655 30.7427 42.6658 31.3125 41.6092 31.7833C40.2443 32.398 38.3943 32.9058 36.3995 33.2133C36.0617 33.266 35.7213 33.3132 35.3879 33.3536C30.9261 33.8943 28.4573 33.1872 27.8069 32.9576C27.0366 32.6857 26.8409 32.4296 26.8307 32.3765L26.6386 30.7914C26.8394 30.8634 27.0517 30.9299 27.274 30.9905C28.333 31.2791 29.6367 31.4417 31.1487 31.474C32.6581 31.5061 33.9925 31.4015 34.847 31.3079C34.851 31.3076 34.8551 31.3072 34.8591 31.3068C34.8672 31.3059 34.879 31.3046 34.8939 31.303C34.9217 31.2999 34.9609 31.2954 35.0066 31.2901C35.1576 31.2726 35.3797 31.2461 35.4936 31.2314C35.5183 31.2282 35.5383 31.2254 35.5522 31.2234C35.5601 31.2223 35.5679 31.221 35.5755 31.2195C36.4366 31.1049 38.1381 30.8331 39.9153 30.2945C41.3639 29.8555 42.5384 29.3397 43.4178 28.7573C43.4472 28.9978 43.4726 29.2036 43.4949 29.384C43.5653 29.9546 43.6031 30.2608 43.6055 30.3509Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.8085 14.9019C32.0588 14.9031 32.2627 14.7012 32.2639 14.4509L32.2663 13.9613C32.2665 13.9329 32.264 13.9051 32.2591 13.8781C32.2211 13.6673 32.0372 13.507 31.8153 13.5059C31.565 13.5046 31.3611 13.7066 31.3598 13.9569L31.3574 14.4464C31.3563 14.6967 31.5581 14.9007 31.8085 14.9019Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.8007 16.9331C32.051 16.9344 32.2549 16.7324 32.2561 16.4821L32.2585 15.9926C32.2587 15.9642 32.2562 15.9363 32.2513 15.9093C32.2133 15.6986 32.0293 15.5382 31.8075 15.5371C31.5571 15.5359 31.3532 15.7378 31.352 15.9881L31.3496 16.4776C31.3484 16.728 31.5503 16.9319 31.8007 16.9331Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.7928 18.9663C32.0432 18.9676 32.2471 18.7656 32.2483 18.5153L32.2507 18.0258C32.2508 17.9974 32.2484 17.9695 32.2435 17.9425C32.2054 17.7318 32.0215 17.5714 31.7997 17.5703C31.5493 17.5691 31.3454 17.771 31.3442 18.0214L31.3418 18.5109C31.3406 18.7612 31.5425 18.9651 31.7928 18.9663Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.871 8.91947C32.1213 8.92069 32.3252 8.71877 32.3264 8.46844L32.3288 7.97892C32.329 7.95048 32.3265 7.92267 32.3216 7.89564C32.2836 7.6849 32.0997 7.52453 31.8778 7.52344C31.6275 7.52221 31.4235 7.72414 31.4223 7.97447L31.4199 8.46397C31.4188 8.71426 31.6206 8.91826 31.871 8.91947Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.8632 10.9488C32.1135 10.95 32.3174 10.7481 32.3186 10.4977L32.321 10.0082C32.3212 9.97978 32.3187 9.95196 32.3138 9.92493C32.2758 9.71419 32.0918 9.55383 31.87 9.55274C31.6196 9.55151 31.4157 9.75346 31.4145 10.0038L31.4121 10.4933C31.4109 10.7436 31.6128 10.9476 31.8632 10.9488Z"
                      fill="#171D34"
                    />
                    <path
                      d="M31.8515 12.982C32.1018 12.9832 32.3057 12.7812 32.3069 12.5309L32.3093 12.0414C32.3095 12.013 32.307 11.9852 32.3021 11.9581C32.2641 11.7474 32.0801 11.587 31.8583 11.5859C31.6079 11.5847 31.404 11.7867 31.4028 12.037L31.4004 12.5265C31.3993 12.7768 31.6011 12.9807 31.8515 12.982Z"
                      fill="#171D34"
                    />
                    <path
                      d="M15.5256 44.744L15.0401 44.8063C15.0119 44.81 14.9846 44.8161 14.9585 44.8245C14.7547 44.8901 14.62 45.0936 14.6483 45.3136C14.6802 45.5619 14.9073 45.7374 15.1556 45.7054L15.6411 45.6431C15.8893 45.6111 16.0648 45.3841 16.0329 45.1358C16.001 44.8875 15.7739 44.7121 15.5256 44.744Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.5393 44.4881L17.0538 44.5505C17.0256 44.5541 16.9983 44.5602 16.9722 44.5686C16.7683 44.6342 16.6337 44.8377 16.6619 45.0578C16.6938 45.3061 16.921 45.4815 17.1692 45.4496L17.6548 45.3872C17.903 45.3553 18.0785 45.1282 18.0466 44.8799C18.0147 44.6316 17.7876 44.4562 17.5393 44.4881Z"
                      fill="#171D34"
                    />
                    <path
                      d="M19.5588 44.2284L19.0733 44.2907C19.0451 44.2943 19.0178 44.3005 18.9917 44.3089C18.7878 44.3745 18.6532 44.578 18.6815 44.798C18.7134 45.0463 18.9405 45.2218 19.1888 45.1898L19.6743 45.1275C19.9226 45.0955 20.098 44.8685 20.0661 44.6202C20.0342 44.3719 19.8071 44.1965 19.5588 44.2284Z"
                      fill="#171D34"
                    />
                    <path
                      d="M9.59008 45.4784L9.10454 45.5407C9.07634 45.5443 9.0491 45.5505 9.02296 45.5589C8.81911 45.6245 8.68445 45.828 8.71273 46.048C8.74462 46.2963 8.97174 46.4717 9.22002 46.4398L9.70554 46.3775C9.95375 46.3455 10.1293 46.1185 10.0974 45.8702C10.0655 45.6219 9.83836 45.4465 9.59008 45.4784Z"
                      fill="#171D34"
                    />
                    <path
                      d="M11.6018 45.2186L11.1163 45.2809C11.0881 45.2846 11.0608 45.2907 11.0347 45.2991C10.8308 45.3647 10.6962 45.5682 10.7244 45.7883C10.7563 46.0366 10.9835 46.212 11.2318 46.1801L11.7173 46.1177C11.9655 46.0858 12.141 45.8587 12.1091 45.6104C12.0772 45.3621 11.8501 45.1867 11.6018 45.2186Z"
                      fill="#171D34"
                    />
                    <path
                      d="M13.6155 44.9588L13.1299 45.0212C13.1017 45.0248 13.0745 45.0309 13.0483 45.0393C12.8445 45.1049 12.7099 45.3084 12.7381 45.5285C12.77 45.7768 12.9971 45.9522 13.2454 45.9203L13.7309 45.8579C13.9793 45.826 14.1547 45.5989 14.1228 45.3506C14.0909 45.1024 13.8637 44.9269 13.6155 44.9588Z"
                      fill="#171D34"
                    />
                    <path
                      d="M34.8456 18.9537C34.9843 18.9537 35.1148 18.8997 35.2129 18.8016L36.044 17.9704C36.2466 17.7679 36.2466 17.4384 36.044 17.2359C35.8415 17.0333 35.512 17.0334 35.3095 17.2359L34.4783 18.067C34.3802 18.1651 34.3262 18.2956 34.3262 18.4343C34.3262 18.5731 34.3802 18.7035 34.4783 18.8016C34.5764 18.8997 34.7068 18.9537 34.8456 18.9537Z"
                      fill="#171D34"
                    />
                    <path
                      d="M38.3746 15.4281C38.5077 15.4281 38.6407 15.3775 38.7419 15.2762L39.5731 14.4451C39.7756 14.2426 39.7756 13.913 39.5731 13.7105C39.3706 13.508 39.041 13.5079 38.8385 13.7105L38.0074 14.5417C37.8048 14.7442 37.8048 15.0737 38.0074 15.2762C38.1086 15.3775 38.2416 15.4281 38.3746 15.4281Z"
                      fill="#171D34"
                    />
                    <path
                      d="M38.8385 18.8016C38.9366 18.8997 39.0671 18.9537 39.2058 18.9537C39.3445 18.9537 39.475 18.8997 39.5731 18.8016C39.6712 18.7035 39.7252 18.5731 39.7252 18.4343C39.7252 18.2956 39.6712 18.1651 39.5731 18.067L38.7419 17.2359C38.5394 17.0333 38.2099 17.0334 38.0074 17.2359C37.8048 17.4384 37.8048 17.7679 38.0074 17.9704L38.8385 18.8016Z"
                      fill="#171D34"
                    />
                    <path
                      d="M35.3095 15.2765C35.4107 15.3777 35.5437 15.4283 35.6767 15.4283C35.8098 15.4283 35.9428 15.3777 36.044 15.2765C36.2466 15.0739 36.2466 14.7444 36.044 14.5419L35.2129 13.7107C35.1148 13.6126 34.9843 13.5586 34.8456 13.5586C34.7068 13.5586 34.5764 13.6126 34.4783 13.7107C34.3802 13.8088 34.3262 13.9393 34.3262 14.078C34.3262 14.2168 34.3802 14.3472 34.4783 14.4453L35.3095 15.2765Z"
                      fill="#171D34"
                    />
                    <path
                      d="M46.4525 37.4884L45.8654 38.0755C45.7142 38.2267 45.7142 38.4728 45.8653 38.624C45.9386 38.6972 46.036 38.7376 46.1396 38.7376C46.2432 38.7376 46.3406 38.6972 46.4138 38.624L47.0009 38.0369C47.1521 37.8857 47.1521 37.6396 47.0009 37.4884C46.8497 37.3372 46.6037 37.3372 46.4525 37.4884Z"
                      fill="#171D34"
                    />
                    <path
                      d="M48.6359 36.2471C48.7352 36.2471 48.8345 36.2093 48.9101 36.1337L49.4972 35.5466C49.6484 35.3954 49.6484 35.1494 49.4972 34.9982C49.346 34.847 49.0999 34.847 48.9487 34.9982L48.3616 35.5853C48.2884 35.6585 48.248 35.7559 48.248 35.8595C48.248 35.9631 48.2884 36.0605 48.3616 36.1337C48.4372 36.2093 48.5365 36.2471 48.6359 36.2471Z"
                      fill="#171D34"
                    />
                    <path
                      d="M48.9101 37.4884C48.7589 37.3372 48.5128 37.3372 48.3616 37.4884C48.2884 37.5616 48.248 37.659 48.248 37.7626C48.248 37.8662 48.2884 37.9636 48.3616 38.0368L48.9487 38.6239C49.0243 38.6995 49.1236 38.7373 49.223 38.7373C49.3223 38.7373 49.4216 38.6995 49.4972 38.6239C49.6484 38.4727 49.6484 38.2267 49.4972 38.0755L48.9101 37.4884Z"
                      fill="#171D34"
                    />
                    <path
                      d="M46.4138 34.9984C46.3406 34.9251 46.2432 34.8848 46.1396 34.8848C46.036 34.8848 45.9386 34.9251 45.8654 34.9984C45.7141 35.1496 45.7141 35.3956 45.8654 35.5468L46.4525 36.1339C46.5281 36.2095 46.6274 36.2473 46.7267 36.2473C46.826 36.2473 46.9253 36.2095 47.0009 36.1339C47.1521 35.9827 47.1521 35.7367 47.0009 35.5855L46.4138 34.9984Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.2609 5.8526C14.3602 5.8526 14.4595 5.8148 14.5351 5.73919L15.1222 5.15209C15.2734 5.00089 15.2734 4.75484 15.1222 4.60364C14.971 4.45243 14.725 4.45243 14.5738 4.60364L13.9867 5.19073C13.9134 5.26397 13.873 5.36137 13.873 5.46495C13.873 5.56853 13.9134 5.66594 13.9867 5.73919C14.0623 5.8148 14.1616 5.8526 14.2609 5.8526Z"
                      fill="#171D34"
                    />
                    <path
                      d="M16.7451 3.36238C16.8444 3.36238 16.9437 3.32458 17.0193 3.24897L17.6064 2.66187C17.7576 2.51067 17.7576 2.2646 17.6064 2.1134C17.4552 1.96219 17.2091 1.96221 17.0579 2.1134L16.4708 2.70051C16.3196 2.8517 16.3196 3.09777 16.4708 3.24897C16.5464 3.32458 16.6457 3.36238 16.7451 3.36238Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.058 5.73919C17.1335 5.81479 17.2328 5.8526 17.3322 5.8526C17.4315 5.8526 17.5308 5.81479 17.6064 5.73919C17.7576 5.58799 17.7576 5.34194 17.6064 5.19074L17.0193 4.60364C16.8681 4.45242 16.622 4.45244 16.4708 4.60364C16.3196 4.75483 16.3196 5.00089 16.4708 5.15208L17.058 5.73919Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.5738 3.24894C14.6494 3.32455 14.7487 3.36235 14.848 3.36235C14.9473 3.36235 15.0466 3.32455 15.1222 3.24894C15.1955 3.1757 15.2358 3.0783 15.2358 2.97472C15.2358 2.87114 15.1955 2.77374 15.1222 2.70052L14.5351 2.11341C14.3839 1.96222 14.1379 1.96218 13.9867 2.1134C13.9134 2.18663 13.873 2.28404 13.873 2.38762C13.873 2.4912 13.9134 2.5886 13.9867 2.66184L14.5738 3.24894Z"
                      fill="#171D34"
                    />
                    <path
                      d="M21.6849 46.631L21.0978 47.2181C20.9466 47.3693 20.9466 47.6153 21.0978 47.7665C21.1734 47.8421 21.2727 47.8799 21.372 47.8799C21.4713 47.8799 21.5706 47.8421 21.6462 47.7665L22.2333 47.1794C22.3845 47.0282 22.3845 46.7822 22.2333 46.631C22.0821 46.4798 21.8361 46.4798 21.6849 46.631Z"
                      fill="#171D34"
                    />
                    <path
                      d="M23.8584 45.3936C23.9577 45.3936 24.057 45.3558 24.1326 45.2802L24.7197 44.6931C24.8709 44.5419 24.8709 44.2959 24.7197 44.1447C24.5685 43.9934 24.3224 43.9934 24.1712 44.1447L23.5841 44.7318C23.4329 44.883 23.4329 45.129 23.5841 45.2802C23.6597 45.3558 23.759 45.3936 23.8584 45.3936Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.1326 46.631C23.9814 46.4798 23.7353 46.4798 23.5841 46.631C23.4329 46.7822 23.4329 47.0283 23.5841 47.1794L24.1712 47.7665C24.2468 47.8422 24.3461 47.88 24.4454 47.8799C24.5447 47.8799 24.6441 47.8421 24.7197 47.7666C24.7929 47.6933 24.8333 47.5959 24.8333 47.4923C24.8333 47.3887 24.7929 47.2913 24.7197 47.2181L24.1326 46.631Z"
                      fill="#171D34"
                    />
                    <path
                      d="M21.6462 44.1447C21.4951 43.9934 21.249 43.9935 21.0978 44.1447C20.9466 44.2959 20.9466 44.5419 21.0978 44.6931L21.6849 45.2802C21.7605 45.3558 21.8598 45.3936 21.9591 45.3936C22.0584 45.3936 22.1577 45.3558 22.2333 45.2802C22.3845 45.129 22.3845 44.883 22.2333 44.7318L21.6462 44.1447Z"
                      fill="#171D34"
                    />
                    <path
                      d="M0.700709 30.7911L0.113606 31.3783C0.0403499 31.4515 0 31.5489 0 31.6525C0 31.7561 0.0403499 31.8535 0.113606 31.9267C0.189196 32.0023 0.288504 32.0401 0.387812 32.0401C0.487137 32.0401 0.586444 32.0023 0.662033 31.9267L1.24914 31.3396C1.40035 31.1884 1.40035 30.9423 1.24914 30.7911C1.09792 30.64 0.851923 30.6399 0.700709 30.7911Z"
                      fill="#171D34"
                    />
                    <path
                      d="M3.18488 28.3029L2.59778 28.89C2.44658 29.0412 2.44656 29.2872 2.59778 29.4384C2.67337 29.514 2.77268 29.5518 2.87198 29.5518C2.97131 29.5518 3.07062 29.514 3.14622 29.4384L3.73331 28.8513C3.80657 28.7781 3.84692 28.6807 3.84692 28.5771C3.84692 28.4735 3.80657 28.3761 3.73331 28.3029C3.58215 28.1516 3.33606 28.1517 3.18488 28.3029Z"
                      fill="#171D34"
                    />
                    <path
                      d="M3.14625 30.7931C2.99503 30.6419 2.74896 30.6419 2.59779 30.7931C2.44657 30.9443 2.44657 31.1903 2.59779 31.3415L3.18489 31.9286C3.26048 32.0042 3.35979 32.0421 3.45911 32.0421C3.55842 32.0421 3.65773 32.0042 3.73332 31.9286C3.88453 31.7774 3.88453 31.5314 3.73332 31.3802L3.14625 30.7931Z"
                      fill="#171D34"
                    />
                    <path
                      d="M0.661855 28.3028C0.510641 28.1516 0.264589 28.1517 0.11341 28.3028C-0.0378035 28.454 -0.0378035 28.7001 0.11341 28.8513L0.700513 29.4384C0.776103 29.514 0.87541 29.5518 0.974718 29.5518C1.07404 29.5518 1.17335 29.514 1.24894 29.4384C1.40015 29.2872 1.40015 29.0411 1.24894 28.8899L0.661855 28.3028Z"
                      fill="#171D34"
                    />
                  </svg>{" "}
                  Special Expenses
                </span>
              </span>
              <span className="text">
                Enter the total annual amount of all special child-related
                expenses. These expenses will be apportioned based on the income
                of each party to get the s7 child special expenses support
              </span>
              {(showAlertFillAllDetails || showFlaskError || showNoChildrenError) && AlertFillAllDetails()}
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
                    <svg
                      width="50"
                      height="50"
                      viewBox="0 0 50 50"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.8809 4.31792C17.3955 7.56538 19.0195 10.5944 20.9039 13.6999C20.9087 13.7079 20.9135 13.7157 20.9183 13.7237H22.0772H22.3333L22.0788 10.3434C22.071 10.239 22.0836 10.1377 22.1136 10.0438C22.1634 9.88711 22.2607 9.7504 22.3897 9.65197C22.5075 9.56216 22.6518 9.50441 22.8106 9.49245C22.8308 9.49085 22.8509 9.49005 22.871 9.49005C23.2821 9.49005 23.6302 9.80735 23.6615 10.2242L23.8974 13.3598L23.9249 13.7237H26.3291L26.7993 10.1526L26.9991 8.63564C27.0254 8.43543 27.1245 8.26251 27.266 8.13999C27.4067 8.01779 27.5895 7.94569 27.7849 7.94569C27.8195 7.94569 27.8544 7.94792 27.8895 7.95255C28.3241 8.00982 28.6299 8.40847 28.5728 8.84286L28.04 12.8892L27.9821 13.3294L27.9301 13.7237H28.9848C31.5183 8.95166 33.5517 5.62842 35.4506 3.17141C34.7799 2.88602 34.1136 2.67274 33.4495 2.51896C33.3016 2.48466 33.1539 2.45339 33.0063 2.42499C32.1294 2.25574 31.2558 2.18555 30.3812 2.18555C28.3297 2.18555 26.2729 2.57144 24.1563 2.96834C22.3234 3.31212 20.4536 3.66275 18.4972 3.79372C17.9833 3.82802 17.4636 3.84732 16.937 3.84732C16.6889 3.84732 16.4393 3.84302 16.188 3.83408C16.0078 3.8277 15.8267 3.81893 15.6445 3.80744C15.6603 3.84174 15.6761 3.87604 15.6918 3.91018C15.7546 4.04655 15.8176 4.18233 15.8809 4.31792Z"
                        fill="#73C3FD"
                      />
                      <path
                        d="M30.2623 15.3125H19.815C19.7675 15.3541 19.7201 15.3964 19.6729 15.4392C18.9813 16.0645 18.3145 16.8009 17.6815 17.6253C16.7928 18.7831 15.9707 20.1152 15.2412 21.5587C13.1728 25.6517 11.8477 30.6424 11.8477 35.1098C11.8477 39.4177 13.0827 42.4301 15.6235 44.319C17.7863 45.9269 20.8659 46.7085 25.0386 46.7085C26.8912 46.7085 28.5286 46.5544 29.9657 46.2422C31.5431 45.8997 32.8796 45.3668 33.9955 44.6384C34.1526 44.5358 34.3055 44.4294 34.4538 44.319C36.9946 42.4301 38.2296 39.4177 38.2296 35.1098C38.2296 27.8684 34.7474 19.2512 30.2623 15.3125ZM25.3379 40.8307H25.3314C24.6204 40.8307 24.0418 40.2522 24.0418 39.5412V39.0965C23.6785 39.0574 23.3255 38.9956 22.9878 38.9122C22.3513 38.7549 21.7476 38.519 21.1939 38.2109C21.1564 38.19 21.1191 38.1688 21.0819 38.1473C20.8143 37.9914 20.5536 37.8153 20.3054 37.6224C20.0409 37.417 19.8678 37.1218 19.818 36.7916C19.7679 36.4597 19.8477 36.1264 20.0423 35.853L20.0691 35.8155C20.3102 35.477 20.7026 35.275 21.1188 35.275C21.4102 35.275 21.6861 35.3701 21.9166 35.55C22.2798 35.8337 22.6563 36.065 23.036 36.2376C23.6307 36.5083 24.2922 36.6455 25.0023 36.6455C25.9976 36.6455 26.7559 36.4416 27.2564 36.0395C27.7353 35.6547 27.968 35.1037 27.968 34.355V34.3447C27.968 33.9002 27.8686 33.5504 27.6726 33.3046C27.4586 33.0366 27.1875 32.8402 26.8437 32.7043C26.6808 32.64 26.4965 32.5778 26.2917 32.5179C26.0095 32.4353 25.6886 32.3571 25.3315 32.2842L25.3232 32.2825L25.3149 32.2804C25.2883 32.2739 25.2722 32.2704 25.2641 32.2686C25.2422 32.2643 25.22 32.2589 25.1971 32.2522C25.1513 32.245 25.1045 32.2364 25.0578 32.2263C25.0047 32.215 24.9522 32.2021 24.9013 32.1877C24.5473 32.1172 24.2165 32.0437 23.9097 31.9676C23.39 31.8384 22.9396 31.7015 22.5639 31.5584C21.9091 31.3091 21.346 30.8809 20.89 30.2859C20.6527 29.9761 20.4732 29.6028 20.3569 29.1765C20.2451 28.7675 20.1884 28.2977 20.1884 27.7804V27.7698C20.1884 27.1968 20.2534 26.667 20.3823 26.1848C20.4858 25.7967 20.6308 25.4393 20.8166 25.115C21.0408 24.7239 21.322 24.3809 21.6578 24.0885C21.9577 23.8272 22.3012 23.6064 22.6863 23.4272C22.6895 23.4258 22.6927 23.4242 22.696 23.4228C22.8268 23.3623 22.9629 23.3066 23.1039 23.2561C23.3965 23.1506 23.71 23.0665 24.0418 23.0047V22.4798C24.0418 22.3096 24.075 22.1469 24.1353 21.998C24.1912 21.8593 24.2709 21.7324 24.369 21.6225C24.6054 21.3576 24.9492 21.1904 25.3314 21.1904H25.3379C26.0489 21.1904 26.6275 21.7688 26.6275 22.4798V22.9589C26.7888 22.9841 26.9467 23.0147 27.0997 23.0504C27.6016 23.1677 28.106 23.3456 28.5989 23.5793C28.8237 23.686 29.0493 23.8069 29.2694 23.9387C29.5736 24.1209 29.7844 24.412 29.863 24.7582C29.9417 25.1051 29.8771 25.4594 29.6807 25.756C29.4411 26.1179 29.0387 26.3341 28.6045 26.3341C28.3632 26.3341 28.1272 26.2662 27.9222 26.1377C27.8772 26.1095 27.8321 26.0821 27.7871 26.0554C27.528 25.9016 27.2699 25.7727 27.0179 25.6716C26.528 25.4751 26.0386 25.3755 25.5632 25.3755C24.6419 25.3755 23.9376 25.5783 23.4699 25.9784C23.4562 25.9902 23.4426 26.002 23.4294 26.0139C23.4292 26.0139 23.4292 26.0139 23.429 26.0141C23.0023 26.4008 22.7948 26.9417 22.7948 27.666V27.6764C22.7948 28.117 22.9012 28.4489 23.1199 28.6913C23.3638 28.9612 23.6639 29.1552 24.0371 29.2844C24.4578 29.4302 25.0398 29.5827 25.767 29.7376L25.7913 29.7427L25.8146 29.7505C25.8296 29.7556 25.8452 29.7604 25.8612 29.7649L25.8626 29.7652L25.864 29.7657C25.8814 29.7706 25.8994 29.7755 25.9175 29.78C25.9473 29.7861 25.9787 29.7928 26.0135 29.8003L26.0145 29.8006L26.0156 29.8008C26.0461 29.8076 26.0746 29.8137 26.103 29.8193L26.1094 29.8205L26.1159 29.822C26.3378 29.8724 26.5511 29.9252 26.7556 29.9802C27.3578 30.1418 27.8836 30.3222 28.3247 30.5183C28.7682 30.7159 29.1629 30.9943 29.5038 31.3494C29.6534 31.5051 29.7927 31.6757 29.9211 31.8607C30.1382 32.1735 30.3023 32.5441 30.4091 32.9619C30.5118 33.3645 30.564 33.8227 30.564 34.3238V34.3447C30.564 35.362 30.3438 36.2408 29.9096 36.9569C29.7392 37.2378 29.5371 37.4934 29.3042 37.7223C28.9363 38.0847 28.4917 38.381 27.9746 38.608C27.8504 38.6625 27.7217 38.713 27.5887 38.7594C27.2891 38.864 26.9676 38.9479 26.6275 39.0105V39.5412C26.6275 39.836 26.528 40.1082 26.3606 40.3256C26.2718 40.4414 26.1635 40.5418 26.0408 40.6217C25.8385 40.7537 25.597 40.8307 25.3379 40.8307Z"
                        fill="#73C3FD"
                      />
                      <path
                        d="M16.5349 9.47383C17.5884 11.0069 18.6799 12.5007 19.8719 14.0404L20.0202 14.232L20.2611 14.2047L21.667 14.045L22.1285 13.9925L22.077 13.722H20.918C20.9132 13.714 20.9085 13.7062 20.9037 13.6982L20.2124 13.7767C17.8665 10.7462 15.8182 7.76834 13.853 4.51913C14.2889 4.49712 14.7182 4.46107 15.1418 4.41289C15.39 4.38465 15.6363 4.35227 15.8807 4.31622C16.7756 4.18429 17.6452 4.00243 18.4969 3.79202C19.769 3.47743 21.0008 3.0984 22.2158 2.72463C24.274 2.09132 26.2741 1.47571 28.3125 1.24424C29.985 1.05424 31.6831 1.12252 33.4607 1.65135C33.3096 1.90068 33.1581 2.15784 33.0061 2.42329C33.1536 2.45168 33.3013 2.48295 33.4492 2.51725C33.5764 2.29694 33.7029 2.08286 33.829 1.87468L34.1181 1.3977L33.5835 1.23865C32.6923 0.973363 31.8071 0.813199 30.877 0.748591C30.0346 0.690045 29.1798 0.71222 28.2638 0.81623C26.186 1.05233 24.1966 1.66443 22.0902 2.31258L22.0891 2.3129C20.1981 2.89485 18.2524 3.49354 16.1878 3.83238C16.0231 3.8595 15.8577 3.88486 15.6915 3.90847C15.4932 3.93671 15.2938 3.96223 15.0931 3.98504C14.6693 4.03322 14.2448 4.06815 13.8314 4.08889L13.1113 4.12511L13.4845 4.74199C14.4781 6.38494 15.476 7.93282 16.5349 9.47383Z"
                        fill="#171D34"
                      />
                      <path
                        d="M26.7486 12.9819L26.74 13.4731L27.228 13.4176L27.9817 13.3321L28.0396 12.8919L27.1793 12.9897L27.2656 8.14271L27.2669 8.06757C27.2749 7.62935 26.9258 7.26771 26.4876 7.25989C26.4522 7.25926 26.4173 7.26101 26.383 7.26484C25.9933 7.30919 25.6873 7.63637 25.6801 8.03917L25.5887 13.1703L23.8971 13.3625L23.1998 13.4418L22.543 9.99432C22.5186 9.86606 22.4647 9.75104 22.3894 9.65469C22.2604 9.75311 22.1631 9.88983 22.1133 10.0465C22.116 10.0557 22.1182 10.0653 22.12 10.0749L22.7767 13.5224L22.8516 13.9148L23.2485 13.8697L24.5097 13.7264L25.6374 13.5983L26.0126 13.5557L26.0193 13.178L26.1107 8.04683C26.114 7.86545 26.2518 7.71327 26.4316 7.69285C26.4474 7.69109 26.4639 7.69029 26.4801 7.69061C26.577 7.69237 26.6674 7.73161 26.7347 7.80132C26.8019 7.8712 26.8381 7.96292 26.8363 8.05975L26.799 10.1553L26.7486 12.9819Z"
                        fill="#171D34"
                      />
                      <path
                        d="M36.6569 22.0639C34.7379 18.5191 32.3443 15.6376 29.9169 13.9501L29.7837 13.8574L29.6224 13.8758L19.242 15.0551L19.0807 15.0735L18.9717 15.1936C17.5279 16.7841 16.243 18.985 15.2361 21.5598C14.8571 22.5286 14.5176 23.5503 14.2238 24.6125C13.1503 28.4921 12.7801 32.5723 13.181 36.1018C13.3049 37.192 13.501 38.2067 13.764 39.1179C14.0296 40.0386 14.3724 40.8842 14.7829 41.6314C15.1964 42.3844 15.6917 43.0617 16.2555 43.6446C16.8188 44.2274 17.4676 44.7337 18.184 45.1498C20.5973 46.5513 23.8323 46.9985 28.0736 46.5166C28.731 46.4419 29.3597 46.351 29.9606 46.2433C33.2366 45.6569 35.683 44.5777 37.4046 42.9662C38.0093 42.4 38.5281 41.761 38.9464 41.0667C39.3648 40.3723 39.6957 39.601 39.9298 38.7745C40.1621 37.9542 40.3065 37.0532 40.3588 36.0965C40.4107 35.1496 40.3741 34.1167 40.2503 33.0263C39.8493 29.497 38.5731 25.6038 36.6569 22.0639ZM37.1102 42.6516C36.2617 43.446 35.2264 44.1068 33.9904 44.6394C32.3608 45.3417 30.3829 45.8209 28.0249 46.0887C23.879 46.5596 20.7307 46.1307 18.4003 44.7773C15.6625 43.1873 14.0954 40.3335 13.609 36.0531C12.9078 29.8814 14.6381 22.4148 17.6764 17.6264C18.1802 16.8323 18.72 16.1118 19.2906 15.4831L19.6677 15.4402L20.7831 15.3136L29.6711 14.3038C34.5722 17.7109 39.0049 25.8799 39.8223 33.075C40.3087 37.3555 39.4214 40.4881 37.1102 42.6516Z"
                        fill="#171D34"
                      />
                      <path
                        d="M28.3206 30.5169C27.8795 30.3208 27.3537 30.1404 26.7515 29.9788C26.4948 29.9534 26.2255 29.934 25.9438 29.9201L25.9373 29.9198L25.9307 29.9196C25.9017 29.919 25.8725 29.918 25.8414 29.9166H25.8393C25.8037 29.9151 25.7717 29.914 25.7412 29.9132C25.7227 29.9119 25.7042 29.9102 25.6862 29.9083L25.683 29.908C25.6667 29.9064 25.6504 29.9044 25.6348 29.9021L25.6104 29.8984L25.5857 29.8974C24.8426 29.8713 24.2429 29.8223 23.8035 29.7516C23.4133 29.6892 23.0842 29.5503 22.7972 29.3268C22.5395 29.1261 22.3771 28.8178 22.3007 28.3839L22.2988 28.3736C22.1691 27.6379 22.2907 27.056 22.6705 26.5943C22.86 26.3643 23.1122 26.17 23.4249 26.0127C23.4251 26.0125 23.4251 26.0125 23.4252 26.0125C23.7582 25.8452 24.1597 25.7196 24.6274 25.6371C25.0955 25.5545 25.5949 25.5678 26.1115 25.6762C26.4233 25.7416 26.7502 25.8433 27.083 25.9782C27.3052 26.0683 27.5472 26.0945 27.783 26.054C27.785 26.0537 27.787 26.0533 27.789 26.053C28.2167 25.9776 28.5753 25.6949 28.7484 25.2969C28.8902 24.9706 28.8925 24.6104 28.7546 24.2825C28.6171 23.9551 28.359 23.7051 28.0277 23.5785C27.7881 23.4869 27.545 23.407 27.305 23.3409C26.7791 23.1966 26.2515 23.109 25.7367 23.0806C25.5799 23.072 25.4191 23.0693 25.2558 23.0723L25.1727 22.6006C25.0913 22.1396 24.7729 21.7785 24.3648 21.6211C24.2667 21.731 24.1871 21.8578 24.1311 21.9966C24.4404 22.0821 24.689 22.3383 24.7485 22.6754L24.8975 23.5201C25.1679 23.5001 25.4397 23.4957 25.7131 23.5107C26.1994 23.5375 26.692 23.6193 27.1908 23.7563C27.4181 23.8189 27.6458 23.8937 27.8739 23.9808C28.3305 24.1555 28.5484 24.6768 28.3534 25.1251C28.2343 25.3991 27.9888 25.5805 27.7142 25.6289C27.5611 25.6558 27.399 25.6416 27.2447 25.5789C26.8868 25.4339 26.5387 25.3258 26.2 25.2546C25.6267 25.1343 25.0776 25.1203 24.5526 25.213C23.5364 25.3921 22.7983 25.7614 22.3379 26.3207C21.8777 26.88 21.7231 27.5893 21.8746 28.4485L21.8765 28.4587C21.9715 28.9974 22.1902 29.4 22.5325 29.6666C22.8749 29.9332 23.2756 30.1034 23.7352 30.1769C24.1946 30.2508 24.8066 30.301 25.5705 30.328C25.5922 30.3312 25.6155 30.3342 25.6407 30.3366C25.6658 30.3393 25.6926 30.3417 25.721 30.3436C25.7562 30.3444 25.7899 30.3457 25.8218 30.347C25.8537 30.3484 25.8872 30.3495 25.9226 30.3502C26.795 30.3934 27.5327 30.4901 28.1358 30.6402C28.638 30.7654 29.0925 31.0013 29.4996 31.348C29.1587 30.9929 28.7641 30.7145 28.3206 30.5169Z"
                        fill="#171D34"
                      />
                      <path
                        d="M27.5586 38.5904L27.5878 38.7558C27.7208 38.7094 27.8496 38.659 27.9737 38.6044C28.4909 38.3774 28.9355 38.0812 29.3033 37.7188C29.2266 37.7775 29.147 37.8342 29.0645 37.8893C28.6363 38.1748 28.134 38.4082 27.5586 38.5904Z"
                        fill="#171D34"
                      />
                      <path
                        d="M26.0138 39.7782L25.8678 38.9504C25.3911 39.0048 24.9255 39.0176 24.4716 38.9868C23.8525 38.945 23.2602 38.8262 22.6948 38.6304C22.3823 38.5223 22.0767 38.3894 21.7779 38.2315C21.3692 38.0156 21.2006 37.5181 21.3993 37.1006L21.4191 37.059C21.5436 36.7976 21.7817 36.6298 22.0449 36.5834C22.2282 36.551 22.4237 36.5775 22.6015 36.6719C23.0404 36.9052 23.4791 37.0784 23.9176 37.1914C24.6138 37.371 25.3436 37.3935 26.1074 37.2588C27.1917 37.0676 27.9796 36.6912 28.4713 36.13C28.9629 35.5687 29.1325 34.8551 28.9797 33.9889L28.9779 33.9787C28.8828 33.4401 28.6793 33.0332 28.3669 32.7575C28.0547 32.4822 27.6816 32.3002 27.2477 32.2115C26.8136 32.1229 26.2682 32.0695 25.6111 32.0518C25.5826 32.0499 25.5594 32.0487 25.5419 32.0481C25.5242 32.0478 25.5046 32.046 25.4829 32.0427C25.4339 32.0444 25.3846 32.0443 25.3353 32.0424C25.2857 32.0406 25.2358 32.0373 25.1857 32.0318C24.7176 32.0219 24.2911 32.0004 23.906 31.9674C23.5012 31.9326 23.1423 31.8854 22.829 31.8252C22.2177 31.708 21.6645 31.4224 21.1696 30.9683C20.6746 30.5141 20.3438 29.8132 20.1766 28.8653L20.1747 28.855C20.0076 27.9073 20.0537 27.0728 20.3135 26.3521C20.3339 26.2955 20.3554 26.2396 20.3785 26.1846C20.6469 25.5388 21.0884 25.0015 21.7029 24.5724C22.1273 24.276 22.6288 24.0372 23.2058 23.8549L23.1002 23.2559C22.9592 23.3064 22.8231 23.3621 22.6923 23.4226L22.7178 23.5677C22.3286 23.7139 21.9725 23.8881 21.6541 24.0883C21.5865 24.1307 21.5206 24.1744 21.4563 24.2192C20.7182 24.7348 20.1972 25.4032 19.9081 26.2061C19.624 26.995 19.571 27.9113 19.7505 28.9297L19.7524 28.9401C19.8422 29.4496 19.9796 29.9023 20.1606 30.2858C20.3493 30.6854 20.5909 31.0217 20.8785 31.2856C21.4306 31.7924 22.0596 32.1164 22.748 32.2481C23.3755 32.3686 24.1867 32.4407 25.159 32.4621C25.2115 32.4673 25.2656 32.4708 25.3198 32.4728C25.3675 32.4747 25.4152 32.475 25.4615 32.4742C25.4853 32.4767 25.5081 32.4782 25.5304 32.4787C25.5385 32.479 25.5551 32.4798 25.5826 32.4815L25.591 32.4822L25.5995 32.4823C25.845 32.489 26.0747 32.5008 26.288 32.5177C26.6206 32.5441 26.9129 32.5827 27.1616 32.6334C27.5237 32.7076 27.8249 32.8539 28.0822 33.0806C28.3178 33.2886 28.4765 33.6159 28.5537 34.0535L28.5555 34.0637C28.6855 34.801 28.552 35.3841 28.1473 35.8462C27.7242 36.3293 27.0127 36.6617 26.0326 36.8347C25.3334 36.958 24.658 36.9376 24.0253 36.7744C23.6215 36.6703 23.2106 36.5079 22.8036 36.2916C22.5452 36.1544 22.2571 36.1087 21.9701 36.1592C21.5603 36.2315 21.2089 36.4987 21.0302 36.8739L21.0104 36.9155C20.8662 37.2185 20.8456 37.5605 20.9525 37.8788C20.9844 37.9737 21.0267 38.0635 21.0782 38.1471C21.1985 38.3423 21.3693 38.5028 21.5767 38.6124C21.8932 38.7796 22.222 38.9227 22.554 39.0375C23.0287 39.2019 23.5263 39.3159 24.0381 39.3783C24.1719 39.3946 24.3069 39.4073 24.4424 39.4166C24.7894 39.4402 25.1479 39.4395 25.5124 39.415L25.5896 39.853C25.6449 40.1662 25.8094 40.4331 26.0371 40.6215C26.1597 40.5416 26.2681 40.4412 26.3569 40.3254C26.1821 40.1992 26.0543 40.0073 26.0138 39.7782Z"
                        fill="#171D34"
                      />
                      <path
                        d="M11.4808 39.4543C11.6938 39.4047 11.8267 39.191 11.7771 38.9779C11.753 38.8745 11.729 38.7695 11.7059 38.6658C11.7037 38.6561 11.7012 38.6465 11.6983 38.637C11.6708 38.5461 11.6123 38.4688 11.5313 38.4174C11.4418 38.3606 11.3355 38.3421 11.2321 38.3652C11.0374 38.4087 10.9048 38.5911 10.9237 38.7894C10.9252 38.806 10.9279 38.8227 10.9315 38.8389C10.9553 38.9454 10.9798 39.0528 11.0043 39.158C11.0541 39.3711 11.2677 39.504 11.4808 39.4543Z"
                        fill="#171D34"
                      />
                      <path
                        d="M12.241 40.4346C12.2397 40.4302 12.2383 40.4258 12.2368 40.4214C12.2026 40.3212 12.1684 40.2191 12.135 40.118C12.0663 39.9103 11.8415 39.7971 11.6338 39.8658C11.4492 39.9267 11.3365 40.1103 11.366 40.3023C11.3693 40.3241 11.3746 40.3459 11.3815 40.3669C11.416 40.4713 11.451 40.5757 11.4857 40.6773C11.5562 40.8844 11.7821 40.9955 11.9891 40.9249C12.1918 40.8559 12.3025 40.6381 12.241 40.4346Z"
                        fill="#171D34"
                      />
                      <path
                        d="M12.9133 41.7494C12.9062 41.7258 12.8967 41.7026 12.8849 41.68C12.839 41.5923 12.7911 41.4995 12.7386 41.3963C12.6393 41.2014 12.3999 41.1236 12.205 41.2228C12.0376 41.3081 11.9524 41.5012 12.0026 41.682C12.0096 41.7075 12.0194 41.7326 12.0315 41.7564C12.0857 41.8628 12.1349 41.9582 12.182 42.0481C12.2834 42.2418 12.5237 42.317 12.7175 42.2155C12.8887 42.1258 12.9672 41.9279 12.9133 41.7494Z"
                        fill="#171D34"
                      />
                      <path
                        d="M13.7387 42.9654C13.7276 42.9287 13.7111 42.8934 13.6892 42.8605L13.6724 42.8351C13.6191 42.7548 13.5665 42.6742 13.5163 42.5954C13.3987 42.411 13.153 42.3566 12.9685 42.4742C12.8206 42.5685 12.7517 42.7518 12.8009 42.92C12.8114 42.956 12.827 42.9902 12.8473 43.022C12.9006 43.1057 12.9559 43.1905 13.0115 43.2743L13.028 43.2991C13.0866 43.3874 13.176 43.4476 13.2799 43.4686C13.3838 43.4896 13.4896 43.4689 13.5779 43.4104C13.6662 43.3518 13.7264 43.2623 13.7475 43.1585C13.7607 43.0933 13.7574 43.0273 13.7387 42.9654Z"
                        fill="#171D34"
                      />
                      <path
                        d="M14.6368 43.9752C14.5738 43.9097 14.5037 43.8347 14.4223 43.7459C14.2747 43.5845 14.0232 43.5734 13.8618 43.7211C13.7321 43.8398 13.6959 44.0261 13.7715 44.1846C13.7884 44.2199 13.8104 44.2525 13.837 44.2816C13.923 44.3755 13.9975 44.4552 14.0649 44.5253C14.2166 44.6829 14.4682 44.6878 14.6259 44.5361C14.7023 44.4627 14.7454 44.3638 14.7475 44.2579C14.7481 44.2258 14.7449 44.1942 14.7382 44.1637C14.7226 44.0933 14.688 44.0284 14.6368 43.9752Z"
                        fill="#171D34"
                      />
                      <path
                        d="M15.9715 45.1617C15.9499 45.093 15.9099 45.0313 15.8543 44.9826C15.786 44.9228 15.7096 44.8541 15.621 44.7725C15.46 44.6244 15.2085 44.6349 15.0604 44.7959C14.9414 44.9253 14.9212 45.114 15.0102 45.2655C15.03 45.2992 15.0548 45.3298 15.0838 45.3565C15.1774 45.4427 15.2586 45.5157 15.3317 45.5797C15.4963 45.7238 15.7475 45.7071 15.8916 45.5424C15.9613 45.4627 15.9959 45.3605 15.9889 45.2548C15.9867 45.2228 15.9809 45.1916 15.9715 45.1617Z"
                        fill="#171D34"
                      />
                      <path
                        d="M32.3895 9.32622C32.5543 9.42529 32.7682 9.37202 32.8672 9.20723L33.0609 8.88499C33.0722 8.86626 33.0815 8.84694 33.0889 8.82718C33.1465 8.67311 33.088 8.49505 32.942 8.40724C32.7772 8.30818 32.5633 8.36145 32.4642 8.52624L32.2705 8.84846C32.1715 9.01325 32.2247 9.22716 32.3895 9.32622Z"
                        fill="#171D34"
                      />
                      <path
                        d="M31.5907 10.6641C31.7555 10.7632 31.9694 10.7099 32.0684 10.5451L32.2622 10.2229C32.2734 10.2042 32.2827 10.1848 32.2901 10.1651C32.3477 10.011 32.2892 9.83294 32.1432 9.74513C31.9784 9.64607 31.7645 9.69933 31.6654 9.86412L31.4717 10.1863C31.3726 10.3511 31.4259 10.565 31.5907 10.6641Z"
                        fill="#171D34"
                      />
                      <path
                        d="M31.3385 11.0791C31.1737 10.9801 30.9598 11.0333 30.8607 11.1981L30.667 11.5203C30.568 11.6852 30.6212 11.899 30.786 11.9981C30.9508 12.0971 31.1647 12.0439 31.2637 11.8791L31.4575 11.5569C31.4687 11.5381 31.478 11.5188 31.4854 11.499C31.543 11.345 31.4845 11.1669 31.3385 11.0791Z"
                        fill="#171D34"
                      />
                      <path
                        d="M34.8529 4.5985L34.6592 4.92073C34.5602 5.0855 34.6134 5.29941 34.7781 5.39847C34.9429 5.49755 35.1568 5.44427 35.2559 5.2795L35.4496 4.95726C35.4609 4.93853 35.4702 4.91921 35.4776 4.89944C35.5352 4.74538 35.4767 4.56731 35.3306 4.47951C35.1658 4.38044 34.9519 4.43371 34.8529 4.5985Z"
                        fill="#171D34"
                      />
                      <path
                        d="M34.0521 5.93444L33.8584 6.25667C33.7594 6.42142 33.8126 6.63535 33.9774 6.73441C34.1422 6.83348 34.3561 6.78021 34.4551 6.61542L34.6489 6.29318C34.6601 6.27445 34.6694 6.25512 34.6768 6.23537C34.7344 6.0813 34.6759 5.90324 34.5299 5.81544C34.3651 5.71639 34.1512 5.76965 34.0521 5.93444Z"
                        fill="#171D34"
                      />
                      <path
                        d="M33.1727 8.07427C33.3375 8.17333 33.5514 8.12007 33.6504 7.95528L33.8442 7.63304C33.8554 7.61431 33.8647 7.59497 33.8721 7.57523C33.9297 7.42116 33.8712 7.24309 33.7252 7.15529C33.5604 7.05623 33.3465 7.10949 33.2474 7.27428L33.0537 7.59651C32.9547 7.76136 33.0079 7.97522 33.1727 8.07427Z"
                        fill="#171D34"
                      />
                      <path
                        d="M8.65364 36.5384L8.08916 37.1028C7.97028 37.2217 7.97028 37.4145 8.08916 37.5333C8.20804 37.6522 8.40078 37.6522 8.51964 37.5333L9.08412 36.9688C9.203 36.85 9.203 36.6572 9.08412 36.5384C8.96524 36.4195 8.77252 36.4195 8.65364 36.5384Z"
                        fill="#171D34"
                      />
                      <path
                        d="M10.9122 35.1408L11.4767 34.5763C11.5956 34.4574 11.5956 34.2647 11.4767 34.1458C11.3578 34.0269 11.1651 34.0269 11.0462 34.1458L10.4817 34.7103C10.3629 34.8292 10.3629 35.0219 10.4817 35.1408C10.6006 35.2597 10.7933 35.2597 10.9122 35.1408Z"
                        fill="#171D34"
                      />
                      <path
                        d="M11.4767 37.5333C11.5956 37.4145 11.5956 37.2217 11.4767 37.1029L10.9122 36.5384C10.7933 36.4195 10.6006 36.4195 10.4817 36.5384C10.3629 36.6573 10.3629 36.85 10.4817 36.9689L11.0462 37.5334C11.1651 37.6522 11.3578 37.6522 11.4767 37.5333Z"
                        fill="#171D34"
                      />
                      <path
                        d="M8.51964 34.1458C8.40076 34.0269 8.20802 34.0269 8.08916 34.1458C7.97028 34.2647 7.97028 34.4574 8.08916 34.5763L8.65364 35.1408C8.77252 35.2596 8.96526 35.2596 9.08412 35.1408C9.203 35.0219 9.203 34.8291 9.08412 34.7103L8.51964 34.1458Z"
                        fill="#171D34"
                      />
                      <path
                        d="M34.9061 2.45525L35.3049 2.05652C35.3888 1.97255 35.3888 1.83641 35.3049 1.75243C35.2209 1.66846 35.0848 1.66846 35.0008 1.75243L34.602 2.15117C34.5181 2.23514 34.5181 2.37128 34.602 2.45524C34.686 2.53923 34.8222 2.53923 34.9061 2.45525Z"
                        fill="#171D34"
                      />
                      <path
                        d="M36.5975 0.765802L36.9963 0.367068C37.0802 0.283094 37.0802 0.146955 36.9963 0.0629806C36.9123 -0.0209935 36.7762 -0.0209935 36.6922 0.0629806L36.2934 0.461714C36.2095 0.545688 36.2095 0.681827 36.2934 0.765802C36.3774 0.849776 36.5136 0.849776 36.5975 0.765802Z"
                        fill="#171D34"
                      />
                      <path
                        d="M36.6922 2.45525C36.7762 2.53923 36.9123 2.53923 36.9963 2.45525C37.0802 2.37128 37.0802 2.23514 36.9963 2.15117L36.5975 1.75243C36.5136 1.66846 36.3774 1.66846 36.2934 1.75243C36.2095 1.83641 36.2095 1.97255 36.2934 2.05652L36.6922 2.45525Z"
                        fill="#171D34"
                      />
                      <path
                        d="M35.0008 0.765785C35.0848 0.849759 35.2209 0.849759 35.3049 0.765785C35.3888 0.681811 35.3888 0.545672 35.3049 0.461714L34.9061 0.0629806C34.8222 -0.0209935 34.686 -0.0209935 34.602 0.0629806C34.5181 0.146955 34.5181 0.283093 34.602 0.367067L35.0008 0.765785Z"
                        fill="#171D34"
                      />
                      <path
                        d="M28.7039 48.4536L28.3052 48.8523C28.2212 48.9363 28.2212 49.0725 28.3052 49.1564C28.3891 49.2404 28.5253 49.2404 28.6093 49.1564L29.008 48.7577C29.092 48.6737 29.092 48.5376 29.008 48.4536C28.924 48.3696 28.7879 48.3696 28.7039 48.4536Z"
                        fill="#171D34"
                      />
                      <path
                        d="M30.3914 46.7642L29.9927 47.1629C29.9087 47.2469 29.9087 47.383 29.9927 47.467C30.0766 47.5509 30.2128 47.5509 30.2968 47.467L30.6955 47.0682C30.7795 46.9843 30.7795 46.8481 30.6955 46.7642C30.6115 46.6802 30.4754 46.6802 30.3914 46.7642Z"
                        fill="#171D34"
                      />
                      <path
                        d="M30.2968 48.4536C30.2128 48.3696 30.0766 48.3696 29.9927 48.4536C29.9087 48.5376 29.9087 48.6737 29.9927 48.7577L30.3914 49.1564C30.4754 49.2404 30.6115 49.2404 30.6955 49.1564C30.7795 49.0725 30.7795 48.9363 30.6955 48.8523L30.2968 48.4536Z"
                        fill="#171D34"
                      />
                      <path
                        d="M28.6093 46.7642C28.5253 46.6802 28.3891 46.6802 28.3052 46.7642C28.2212 46.8481 28.2212 46.9843 28.3052 47.0682L28.7039 47.467C28.7879 47.5509 28.924 47.5509 29.008 47.467C29.092 47.383 29.092 47.2469 29.008 47.1629L28.6093 46.7642Z"
                        fill="#171D34"
                      />
                      <path
                        d="M14.1551 11.2075L13.7563 11.6062C13.6724 11.6902 13.6724 11.8263 13.7563 11.9103C13.8403 11.9943 13.9765 11.9943 14.0604 11.9103L14.4592 11.5116C14.5431 11.4276 14.5431 11.2915 14.4592 11.2075C14.3752 11.1235 14.239 11.1235 14.1551 11.2075Z"
                        fill="#171D34"
                      />
                      <path
                        d="M16.1506 9.51415C16.0666 9.43018 15.9305 9.43018 15.8465 9.51415L15.4477 9.91289C15.3638 9.99686 15.3638 10.133 15.4477 10.217C15.5317 10.3009 15.6679 10.3009 15.7518 10.217L16.1506 9.81824C16.2345 9.73427 16.2345 9.59813 16.1506 9.51415Z"
                        fill="#171D34"
                      />
                      <path
                        d="M15.7518 11.2075C15.6679 11.1235 15.5317 11.1235 15.4477 11.2075C15.3638 11.2915 15.3638 11.4276 15.4477 11.5116L15.8465 11.9103C15.9305 11.9943 16.0666 11.9943 16.1506 11.9103C16.2345 11.8264 16.2345 11.6902 16.1506 11.6062L15.7518 11.2075Z"
                        fill="#171D34"
                      />
                      <path
                        d="M14.4592 9.91289L14.0604 9.51415C13.9765 9.43018 13.8403 9.43018 13.7563 9.51415C13.6724 9.59813 13.6724 9.73427 13.7563 9.81824L14.1551 10.217C14.239 10.3009 14.3752 10.3009 14.4592 10.217C14.5431 10.133 14.5431 9.99686 14.4592 9.91289Z"
                        fill="#171D34"
                      />
                      <path
                        d="M39.0604 25.7111L39.4592 25.3124C39.5431 25.2284 39.5431 25.0923 39.4592 25.0083C39.3752 24.9243 39.239 24.9243 39.1551 25.0083L38.7563 25.407C38.6724 25.491 38.6724 25.6271 38.7563 25.7111C38.8403 25.7951 38.9765 25.7951 39.0604 25.7111Z"
                        fill="#171D34"
                      />
                      <path
                        d="M40.7518 24.0217L41.1506 23.6229C41.2345 23.539 41.2345 23.4028 41.1506 23.3188C41.0666 23.2349 40.9305 23.2349 40.8465 23.3188L40.4477 23.7176C40.3638 23.8015 40.3638 23.9377 40.4477 24.0217C40.5317 24.1056 40.6679 24.1056 40.7518 24.0217Z"
                        fill="#171D34"
                      />
                      <path
                        d="M40.7518 25.0083C40.6679 24.9243 40.5317 24.9243 40.4477 25.0083C40.3638 25.0923 40.3638 25.2284 40.4477 25.3124L40.8465 25.7111C40.9305 25.7951 41.0666 25.7951 41.1506 25.7111C41.2345 25.6271 41.2345 25.491 41.1506 25.407L40.7518 25.0083Z"
                        fill="#171D34"
                      />
                      <path
                        d="M39.1551 24.0217C39.239 24.1056 39.3752 24.1056 39.4592 24.0217C39.5431 23.9377 39.5431 23.8015 39.4592 23.7176L39.0604 23.3188C38.9765 23.2349 38.8403 23.2349 38.7563 23.3188C38.6724 23.4028 38.6724 23.539 38.7563 23.6229L39.1551 24.0217Z"
                        fill="#171D34"
                      />
                    </svg>{" "}
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
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_524_19804)">
                    <path
                      d="M16.2553 29.7441L5.37946 40.62C3.69903 42.3004 3.69903 45.0249 5.37946 46.7053H5.37948C6.21969 47.5455 7.32093 47.9657 8.42217 47.9657C9.52341 47.9657 10.6246 47.5455 11.4649 46.7053L22.3407 35.8295C21.1011 35.0926 19.9564 34.2016 18.9198 33.165C17.8832 32.1284 16.9922 30.9837 16.2553 29.7441Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M37.3113 18.6115C37.5856 19.1897 37.7898 19.7997 37.9191 20.431C38.0291 20.9657 38.0853 21.5156 38.0853 22.0742H40.7051C40.7051 21.447 40.6517 20.8278 40.5456 20.22C40.5079 20.003 40.4634 19.7876 40.4122 19.5738C40.2764 19.0068 40.0937 18.4512 39.8649 17.9093C39.3264 16.6351 38.5556 15.4914 37.574 14.5099C36.5926 13.5283 35.4488 12.7575 34.1747 12.2191C32.8553 11.6616 31.4541 11.3789 30.0098 11.3789V12.3263V12.9812V13.9987C32.1688 13.9987 34.1974 14.8382 35.7216 16.3624C36.3858 17.0265 36.92 17.7865 37.3113 18.6115Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M46.4305 19.9115C46.3902 19.2465 46.3066 18.5835 46.1802 17.9312C45.9937 16.9678 45.7126 16.0192 45.3447 15.1121C44.5792 13.2243 43.4551 11.5312 42.0037 10.0798C40.5523 8.62834 38.8592 7.50428 36.9714 6.73875C36.0643 6.37088 35.1157 6.08978 34.1522 5.90331C33.1984 5.71864 32.2216 5.625 31.2488 5.625C30.276 5.625 29.2991 5.71864 28.3453 5.90331C27.3818 6.08978 26.4334 6.37088 25.5261 6.73875C23.6384 7.50428 21.9454 8.62834 20.4939 10.0798C19.0426 11.5312 17.9185 13.2243 17.153 15.1121C16.7851 16.0192 16.5038 16.9678 16.3174 17.9312C16.1858 18.611 16.1005 19.3023 16.0621 19.9957C16.0468 20.2753 16.0391 20.5551 16.0391 20.8347C16.0391 21.8075 16.1327 22.7844 16.3174 23.7382C16.4495 24.4205 16.6291 25.0954 16.8534 25.7533C16.9457 26.0245 17.0456 26.2926 17.153 26.5573C17.9185 28.4451 19.0426 30.1383 20.4939 31.5896C21.5415 32.637 22.7148 33.5141 23.9966 34.2087L23.9979 34.2095C24.1961 34.3171 24.3972 34.42 24.6007 34.5189C24.9035 34.6659 25.2121 34.8031 25.5261 34.9305C26.4334 35.2984 27.3818 35.5796 28.3453 35.7661C29.2991 35.9508 30.2758 36.0444 31.2486 36.0444H31.2488C32.2216 36.0444 33.1984 35.9508 34.1522 35.7661C35.1157 35.5796 36.0643 35.2985 36.9714 34.9305C38.8592 34.165 40.5523 33.0409 42.0037 31.5896C43.4551 30.1383 44.5792 28.4451 45.3447 26.5573C45.4621 26.2676 45.5708 25.9737 45.6704 25.6764C45.8825 25.0428 46.0533 24.394 46.1802 23.7382C46.3648 22.7844 46.4585 21.8075 46.4585 20.8347C46.4585 20.5271 46.4492 20.2191 46.4305 19.9115ZM19.3495 19.9835V19.9834C19.4543 18.5044 19.8328 17.0411 20.4847 15.6772C20.4847 15.6772 20.4847 15.677 20.4849 15.6769C21.0526 14.4896 21.8273 13.3775 22.8095 12.3954C24.4468 10.7581 26.4457 9.69688 28.5514 9.2118C28.7439 9.16743 28.9375 9.12781 29.1316 9.09327H29.1321C29.8317 8.96803 30.5402 8.90533 31.2488 8.90533H31.2499L31.2494 9.23269C31.2496 9.23269 31.2498 9.23269 31.2499 9.23269L31.2499 8.90533C32.7782 8.90533 34.306 9.19623 35.7425 9.77774C37.1793 10.3596 38.5247 11.232 39.6881 12.3954C40.6522 13.3595 41.4164 14.4488 41.981 15.6115C41.981 15.6115 41.9812 15.6117 41.9812 15.6119C42.6433 16.9753 43.0306 18.4395 43.1434 19.921C43.1434 19.921 43.1434 19.921 43.1434 19.9212C43.3986 23.2742 42.2468 26.7153 39.6881 29.274C37.3614 31.6007 34.3051 32.764 31.2488 32.764C28.1925 32.764 25.1362 31.6007 22.8095 29.274C20.2667 26.7312 19.1133 23.3169 19.3495 19.9835Z"
                      fill="#73C3FD"
                    />
                    <path
                      d="M24.6087 34.5076L23.8526 34.1366C22.6089 33.5263 21.4357 32.7549 20.3654 31.8438C19.2951 30.9327 18.3462 29.8976 17.5453 28.7673L17.0583 28.0801L16.5123 28.7214L6.54232 40.4332C6.10866 40.9426 5.78762 41.5221 5.58813 42.1556C5.39556 42.7671 5.32405 43.4024 5.37558 44.044C5.42712 44.6855 5.59913 45.3013 5.88686 45.8742C6.18492 46.4677 6.59434 46.9885 7.10377 47.4222C7.6132 47.8558 8.1927 48.1769 8.82614 48.3764C9.43763 48.569 10.073 48.6405 10.7145 48.5889C11.3561 48.5374 11.9719 48.3654 12.5448 48.0776C13.1383 47.7796 13.6591 47.3702 14.0927 46.8607L24.0627 35.149L24.6087 34.5076ZM13.5941 46.4362C12.8239 47.341 11.7598 47.8479 10.6621 47.9361C9.56442 48.0243 8.43309 47.6937 7.52829 46.9235H7.52828C5.71868 45.383 5.50051 42.6672 7.041 40.8576L17.011 29.1459C17.8448 30.3225 18.8246 31.3921 19.9409 32.3424C21.0572 33.2927 22.2695 34.0892 23.5641 34.7244L13.5941 46.4362Z"
                      fill="#171D34"
                    />
                    <path
                      d="M47.0573 17.7956C46.9761 16.7843 46.7971 15.7766 46.5255 14.8006C46.2511 13.8143 45.8795 12.8517 45.4213 11.939C44.4675 10.0399 43.1573 8.37331 41.5273 6.98566C39.8972 5.59802 38.043 4.57071 36.0159 3.93239C35.0418 3.62559 34.0322 3.4126 33.0147 3.29915C32.0078 3.18684 30.9845 3.17096 29.9734 3.25216C29.4676 3.29276 28.9631 3.35792 28.4626 3.44682C27.9623 3.53571 27.4664 3.64835 26.9784 3.78407C25.9921 4.05845 25.0293 4.42992 24.1168 4.88832C22.2175 5.84212 20.5511 7.15216 19.1635 8.78226C17.7758 10.4122 16.7485 12.2666 16.1102 14.2937C15.8034 15.2678 15.5902 16.2774 15.4768 17.2948C15.3645 18.3018 15.3488 19.3251 15.43 20.3362C15.5112 21.3475 15.6901 22.3552 15.9617 23.3312C16.1924 24.1603 16.4916 24.9725 16.8535 25.7524C16.6292 25.0944 16.4496 24.4196 16.3175 23.7372C16.1328 22.7834 16.0391 21.8066 16.0391 20.8338C16.0391 20.5541 16.0468 20.2743 16.0622 19.9947C16.0087 19.1195 16.0306 18.2371 16.1277 17.3674C16.2364 16.392 16.4407 15.4242 16.7348 14.4903C17.3467 12.5474 18.3315 10.7698 19.6621 9.20678C20.9926 7.6438 22.5902 6.38778 24.4107 5.47344C25.2854 5.03419 26.2084 4.67795 27.1539 4.41486C28.0898 4.15439 29.0561 3.98282 30.0257 3.90505C30.9954 3.82712 31.9766 3.84219 32.9421 3.94991C33.9174 4.05878 34.8854 4.26293 35.8191 4.55696C37.7622 5.16893 39.5398 6.15383 41.1028 7.48434C42.6658 8.81484 43.9218 10.4125 44.836 12.2329C45.2754 13.1078 45.6315 14.0306 45.8946 14.9761C46.155 15.912 46.3266 16.8783 46.4045 17.8479C46.4595 18.5329 46.4682 19.2236 46.4306 19.9106C46.4492 20.2182 46.4586 20.5261 46.4586 20.8338C46.4586 21.8066 46.3649 22.7834 46.1802 23.7372C46.0534 24.3931 45.8826 25.0419 45.6704 25.6754C45.9429 25.0807 46.1788 24.4677 46.377 23.8381C46.6838 22.8641 46.897 21.8544 47.0104 20.837C47.1227 19.83 47.1385 18.8067 47.0573 17.7956Z"
                      fill="#171D34"
                    />
                    <path
                      d="M38.9806 9.97857C36.4751 7.84563 33.3366 6.93065 30.2901 7.17539L30.3163 7.50177L30.3425 7.82813C33.3486 7.58651 36.2656 8.52731 38.5561 10.4772C40.8466 12.427 42.241 15.1568 42.4825 18.1638C42.7241 21.1707 41.7833 24.0881 39.8335 26.3785C37.8838 28.6689 35.154 30.0633 32.147 30.3049C29.1401 30.5465 26.2227 29.6057 23.9323 27.6559C19.1961 23.6241 18.623 16.4908 22.6549 11.7546C24.6044 9.46452 27.3342 8.0701 30.3414 7.82825L30.3158 7.50183L30.2901 7.17542C30.2897 7.17545 30.2893 7.17547 30.289 7.1755C27.2429 7.42048 24.2889 8.82491 22.1562 11.3302C17.8903 16.3413 18.4966 23.8887 23.5078 28.1546C26.0133 30.2875 29.153 31.2024 32.1994 30.9577C35.2459 30.7129 38.1992 29.3086 40.3322 26.803C44.5981 21.7918 43.9918 14.2444 38.9806 9.97857Z"
                      fill="#171D34"
                    />
                    <path
                      d="M37.5039 19.8073L37.5563 20.46L37.9184 20.4308C37.7891 19.7996 37.5849 19.1896 37.3105 18.6113C37.4063 19.0003 37.4712 19.4 37.5039 19.8073Z"
                      fill="#171D34"
                    />
                    <path
                      d="M29.1996 9.08617L29.1333 9.09157H29.1328L28.5469 9.13856L28.5526 9.2101L28.5993 9.79145L28.8091 12.4029L28.8615 13.0556L29.5143 13.003C29.6801 12.9896 29.8456 12.9819 30.0105 12.9795V12.3246C29.8283 12.3271 29.6452 12.3356 29.4619 12.3503L29.4529 12.2383L29.4095 11.6976L29.2522 9.73888C30.6917 9.6233 32.1111 9.79291 33.4709 10.243C34.7839 10.6776 35.9857 11.3542 37.0428 12.2542C38.0998 13.154 38.9596 14.2323 39.5984 15.4592C40.2598 16.7296 40.6537 18.1039 40.7695 19.5434L40.4129 19.572C40.4641 19.7859 40.5087 20.0013 40.5463 20.2182L40.8218 20.1961L41.4746 20.1437L41.4222 19.491C41.2994 17.9636 40.8813 16.5054 40.1793 15.1568C39.5013 13.8547 38.5889 12.7103 37.4673 11.7555C36.3456 10.8007 35.0702 10.0827 33.6767 9.62133C32.8848 9.35906 32.0739 9.18667 31.2511 9.10449C31.2509 9.10449 31.2508 9.10449 31.2508 9.10449C30.5738 9.03705 29.8888 9.03083 29.1996 9.08617Z"
                      fill="#171D34"
                    />
                    <path
                      d="M17.7985 43.8578C17.6214 43.7108 17.3587 43.7352 17.2117 43.9123L16.9242 44.2585C16.7773 44.4356 16.8015 44.6984 16.9786 44.8454C17.1557 44.9924 17.4184 44.968 17.5654 44.7909L17.8529 44.4446C17.8696 44.4245 17.8841 44.4033 17.8964 44.3813C17.9924 44.2094 17.9554 43.9881 17.7985 43.8578Z"
                      fill="#171D34"
                    />
                    <path
                      d="M16.6052 45.2934C16.4281 45.1464 16.1654 45.1707 16.0184 45.3478L15.7309 45.6941C15.5839 45.8711 15.6082 46.1339 15.7853 46.2809C15.9624 46.4279 16.2251 46.4035 16.3721 46.2265L16.6596 45.8802C16.6763 45.8601 16.6908 45.8389 16.7031 45.8168C16.7991 45.6449 16.7621 45.4237 16.6052 45.2934Z"
                      fill="#171D34"
                    />
                    <path
                      d="M15.4137 46.7309C15.2367 46.5839 14.9739 46.6082 14.8269 46.7853L14.5394 47.1316C14.3925 47.3087 14.4168 47.5714 14.5939 47.7184C14.771 47.8654 15.0337 47.8411 15.1807 47.664L15.4682 47.3177C15.4849 47.2976 15.4994 47.2764 15.5117 47.2543C15.6077 47.0824 15.5707 46.8612 15.4137 46.7309Z"
                      fill="#171D34"
                    />
                    <path
                      d="M21.3356 39.641C21.1585 39.494 20.8958 39.5184 20.7488 39.6955L20.4613 40.0417C20.3144 40.2188 20.3387 40.4816 20.5157 40.6286C20.6928 40.7756 20.9555 40.7512 21.1025 40.5741L21.39 40.2278C21.4067 40.2077 21.4212 40.1865 21.4335 40.1645C21.5295 39.9926 21.4925 39.7713 21.3356 39.641Z"
                      fill="#171D34"
                    />
                    <path
                      d="M20.1442 41.0785C19.9672 40.9315 19.7044 40.9559 19.5574 41.133L19.2699 41.4792C19.1229 41.6563 19.1473 41.9191 19.3244 42.0661C19.5014 42.2131 19.7642 42.1887 19.9112 42.0116L20.1987 41.6653C20.2154 41.6452 20.2299 41.624 20.2422 41.602C20.3382 41.4301 20.3012 41.2088 20.1442 41.0785Z"
                      fill="#171D34"
                    />
                    <path
                      d="M18.9509 42.5141C18.7738 42.3671 18.511 42.3914 18.364 42.5685L18.0766 42.9148C17.9296 43.0919 17.9539 43.3546 18.131 43.5016C18.3081 43.6486 18.5708 43.6243 18.7178 43.4472L19.0053 43.1009C19.022 43.0808 19.0365 43.0596 19.0488 43.0375C19.1448 42.8656 19.1078 42.6444 18.9509 42.5141Z"
                      fill="#171D34"
                    />
                    <path
                      d="M35.8828 3.16823C35.9949 3.21406 36.1083 3.26106 36.2201 3.30795C36.2306 3.31235 36.2412 3.31635 36.2519 3.31993C36.3546 3.35441 36.4651 3.35096 36.5664 3.30952C36.6783 3.26378 36.7657 3.17721 36.8124 3.06573C36.9004 2.85592 36.8183 2.61216 36.6214 2.49876L36.6214 2.49874C36.6049 2.48928 36.5877 2.48077 36.5702 2.47341C36.4554 2.42525 36.3393 2.37717 36.2253 2.33054C35.9942 2.23611 35.7296 2.34717 35.6352 2.57811C35.5408 2.809 35.6519 3.07372 35.8828 3.16823Z"
                      fill="#171D34"
                    />
                    <path
                      d="M34.2227 2.63935C34.2276 2.64102 34.2327 2.64261 34.2377 2.64413C34.3536 2.67855 34.4711 2.71407 34.5871 2.74973C34.8256 2.82301 35.0793 2.68858 35.1526 2.45007C35.2177 2.23807 35.1213 2.01215 34.9233 1.91286C34.9008 1.90154 34.8771 1.89206 34.8529 1.88463C34.7331 1.84783 34.6128 1.81148 34.4955 1.7766C34.2563 1.70554 34.0039 1.84231 33.9328 2.08148C33.8633 2.31549 33.9928 2.56226 34.2227 2.63935Z"
                      fill="#171D34"
                    />
                    <path
                      d="M32.5545 2.3952C32.5811 2.40412 32.609 2.4107 32.6378 2.4146C32.7497 2.42976 32.8676 2.44649 32.9982 2.46571C33.2451 2.50204 33.4755 2.3308 33.5118 2.08395C33.543 1.87194 33.4196 1.66526 33.2183 1.59254C33.1899 1.58229 33.1602 1.57481 33.13 1.57038C32.9953 1.55055 32.8741 1.53336 32.7594 1.51781C32.5122 1.48429 32.2838 1.65816 32.2502 1.9054C32.2206 2.12383 32.3529 2.32754 32.5545 2.3952Z"
                      fill="#171D34"
                    />
                    <path
                      d="M30.8821 2.36201C30.9236 2.37594 30.9674 2.38385 31.0124 2.38524L31.0471 2.38634C31.157 2.38968 31.2667 2.39405 31.3731 2.39933C31.6223 2.41168 31.8351 2.219 31.8475 1.96981C31.8574 1.77003 31.7324 1.58492 31.5435 1.51966C31.5031 1.50567 31.4609 1.49758 31.4179 1.49545C31.3049 1.48985 31.1895 1.48525 31.0749 1.48176L31.041 1.4807C30.9202 1.47689 30.8051 1.52035 30.717 1.60309C30.6289 1.68583 30.5783 1.79793 30.5745 1.91872C30.5706 2.03954 30.6141 2.1546 30.6969 2.24272C30.7488 2.29804 30.8122 2.33856 30.8821 2.36201Z"
                      fill="#171D34"
                    />
                    <path
                      d="M29.0097 2.44807C29.0392 2.46982 29.0706 2.4877 29.1035 2.50158C29.1792 2.53352 29.2625 2.54417 29.3458 2.53166C29.4482 2.5163 29.5643 2.50059 29.7006 2.48359C29.9482 2.45272 30.1245 2.22618 30.0937 1.97858C30.0688 1.77959 29.9195 1.6229 29.7221 1.58865C29.6782 1.58102 29.6333 1.57999 29.5887 1.58555C29.4446 1.60351 29.3213 1.62024 29.2116 1.63668C28.9649 1.6737 28.7942 1.90455 28.8312 2.15128C28.8491 2.27083 28.9125 2.37621 29.0097 2.44807Z"
                      fill="#171D34"
                    />
                    <path
                      d="M27.2666 2.94244C27.2978 2.96159 27.3307 2.9767 27.3646 2.98772C27.4428 3.01305 27.5266 3.01652 27.6086 2.9969C27.7093 2.97282 27.8236 2.9472 27.958 2.91858C28.202 2.86659 28.3582 2.62576 28.3063 2.38173C28.2644 2.1856 28.1023 2.04229 27.9026 2.0251C27.8582 2.02126 27.8134 2.02408 27.7694 2.03345C27.6274 2.06368 27.506 2.09094 27.3981 2.11673C27.1554 2.17476 27.0052 2.4194 27.0632 2.66206C27.0914 2.77962 27.1636 2.87919 27.2666 2.94244Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.2009 39.917L23.4368 40.6812C23.3465 40.7713 23.2969 40.8913 23.2969 41.0188C23.2969 41.1464 23.3465 41.2663 23.4368 41.3565C23.5269 41.4467 23.6469 41.4964 23.7744 41.4964C23.902 41.4964 24.0219 41.4467 24.1121 41.3565L24.8763 40.5923C25.0625 40.4061 25.0625 40.1032 24.8763 39.917C24.6901 39.7308 24.3871 39.7308 24.2009 39.917Z"
                      fill="#171D34"
                    />
                    <path
                      d="M27.0144 38.2559C27.1367 38.2559 27.259 38.2094 27.3521 38.1163L28.1163 37.3521C28.3025 37.1659 28.3025 36.863 28.1163 36.6768C27.9301 36.4906 27.6271 36.4905 27.4409 36.6768L26.6768 37.4409C26.4906 37.6271 26.4906 37.9301 26.6768 38.1163C26.7698 38.2094 26.8921 38.2559 27.0144 38.2559Z"
                      fill="#171D34"
                    />
                    <path
                      d="M27.3521 39.917C27.1659 39.7308 26.8629 39.7308 26.6768 39.917C26.4906 40.1032 26.4906 40.4062 26.6768 40.5924L27.4409 41.3565C27.5311 41.4467 27.651 41.4964 27.7786 41.4964C27.9062 41.4964 28.0261 41.4467 28.1163 41.3565C28.2065 41.2663 28.2562 41.1464 28.2562 41.0188C28.2562 40.8913 28.2065 40.7714 28.1163 40.6812L27.3521 39.917Z"
                      fill="#171D34"
                    />
                    <path
                      d="M24.1121 36.677C24.0219 36.5868 23.902 36.5371 23.7744 36.5371C23.6469 36.5371 23.5269 36.5868 23.4368 36.677C23.3465 36.7672 23.2969 36.8871 23.2969 37.0147C23.2969 37.1422 23.3465 37.2621 23.4368 37.3523L24.2009 38.1165C24.294 38.2096 24.4163 38.2562 24.5386 38.2562C24.6609 38.2562 24.7832 38.2096 24.8763 38.1165C25.0625 37.9303 25.0625 37.6273 24.8763 37.4412L24.1121 36.677Z"
                      fill="#171D34"
                    />
                    <path
                      d="M0.644038 44.2195L0.104272 44.7593C-0.0347544 44.8983 -0.0347546 45.1245 0.104255 45.2635C0.171591 45.3309 0.261143 45.368 0.356375 45.368C0.451608 45.368 0.54116 45.3309 0.608495 45.2635L1.14828 44.7237C1.2873 44.5847 1.2873 44.3585 1.14828 44.2195C1.00928 44.0805 0.783097 44.0805 0.644038 44.2195Z"
                      fill="#171D34"
                    />
                    <path
                      d="M2.93328 41.9324L2.3935 42.4722C2.32614 42.5395 2.28906 42.629 2.28906 42.7243C2.28906 42.8195 2.32614 42.9091 2.3935 42.9764C2.46299 43.0459 2.5543 43.0807 2.64562 43.0807C2.73692 43.0807 2.82822 43.0459 2.89774 42.9764L3.43752 42.4366C3.57654 42.2976 3.57654 42.0714 3.43752 41.9324C3.29852 41.7934 3.07227 41.7934 2.93328 41.9324Z"
                      fill="#171D34"
                    />
                    <path
                      d="M2.89774 44.2195C2.75874 44.0805 2.53249 44.0805 2.3935 44.2195C2.32614 44.2868 2.28906 44.3764 2.28906 44.4716C2.28906 44.5669 2.32614 44.6564 2.3935 44.7237L2.93328 45.2635C3.00278 45.333 3.09408 45.3678 3.1854 45.3678C3.2767 45.3678 3.36801 45.333 3.43752 45.2635C3.57654 45.1245 3.57654 44.8983 3.43752 44.7593L2.89774 44.2195Z"
                      fill="#171D34"
                    />
                    <path
                      d="M0.608509 41.9326C0.541174 41.8652 0.451622 41.8281 0.356389 41.8281C0.261157 41.8281 0.171605 41.8652 0.10427 41.9326C-0.0347565 42.0716 -0.0347565 42.2978 0.10427 42.4368L0.644036 42.9766C0.713549 43.0461 0.804852 43.0809 0.896155 43.0809C0.987475 43.0809 1.07878 43.0461 1.14828 42.9766C1.2873 42.8376 1.2873 42.6114 1.14828 42.4724L0.608509 41.9326Z"
                      fill="#171D34"
                    />
                    <path
                      d="M11.5851 17.985C11.6764 17.985 11.7677 17.9502 11.8372 17.8807L12.377 17.3409C12.516 17.2019 12.516 16.9757 12.377 16.8367C12.238 16.6977 12.0118 16.6977 11.8727 16.8367L11.333 17.3765C11.2656 17.4438 11.2285 17.5333 11.2285 17.6286C11.2285 17.7238 11.2656 17.8134 11.333 17.8807C11.4025 17.9502 11.4938 17.985 11.5851 17.985Z"
                      fill="#171D34"
                    />
                    <path
                      d="M13.874 15.6959C13.9653 15.6959 14.0566 15.6612 14.1261 15.5917L14.6659 15.0519C14.8049 14.9129 14.8049 14.6866 14.6659 14.5476C14.5269 14.4086 14.3006 14.4086 14.1616 14.5476L13.6218 15.0874C13.4828 15.2264 13.4828 15.4527 13.6218 15.5917C13.6913 15.6612 13.7826 15.6959 13.874 15.6959Z"
                      fill="#171D34"
                    />
                    <path
                      d="M14.1616 17.8807C14.2311 17.9502 14.3224 17.985 14.4138 17.985C14.5051 17.985 14.5964 17.9502 14.6659 17.8807C14.8049 17.7417 14.8049 17.5155 14.6659 17.3765L14.1261 16.8367C13.9871 16.6977 13.7608 16.6977 13.6218 16.8367C13.4828 16.9757 13.4828 17.2019 13.6218 17.3409L14.1616 17.8807Z"
                      fill="#171D34"
                    />
                    <path
                      d="M11.8728 15.5916C11.9423 15.6612 12.0336 15.6959 12.1249 15.6959C12.2162 15.6959 12.3075 15.6612 12.377 15.5916C12.4444 15.5243 12.4815 15.4348 12.4815 15.3395C12.4815 15.2443 12.4444 15.1547 12.377 15.0874L11.8372 14.5476C11.6982 14.4086 11.472 14.4086 11.333 14.5476C11.2656 14.6149 11.2285 14.7045 11.2285 14.7997C11.2285 14.895 11.2656 14.9845 11.333 15.0519L11.8728 15.5916Z"
                      fill="#171D34"
                    />
                    <path
                      d="M47.103 27.4832L46.5633 28.023C46.4242 28.162 46.4242 28.3882 46.5633 28.5272C46.6328 28.5967 46.7241 28.6315 46.8154 28.6315C46.9067 28.6315 46.998 28.5967 47.0675 28.5272L47.6073 27.9874C47.7463 27.8484 47.7463 27.6222 47.6073 27.4832C47.4683 27.3441 47.242 27.3442 47.103 27.4832Z"
                      fill="#171D34"
                    />
                    <path
                      d="M49.1045 26.3424C49.1958 26.3424 49.2871 26.3076 49.3566 26.2381L49.8964 25.6984C50.0354 25.5593 50.0354 25.3331 49.8964 25.1941C49.7573 25.0551 49.5311 25.0551 49.3921 25.1941L48.8523 25.7339C48.7133 25.8729 48.7133 26.0991 48.8523 26.2381C48.9218 26.3076 49.0131 26.3424 49.1045 26.3424Z"
                      fill="#171D34"
                    />
                    <path
                      d="M49.8964 28.023L49.3566 27.4832C49.2175 27.3441 48.9913 27.3441 48.8523 27.4832C48.7133 27.6222 48.7133 27.8484 48.8523 27.9874L49.3921 28.5272C49.4616 28.5967 49.5529 28.6315 49.6442 28.6315C49.7355 28.6315 49.8268 28.5967 49.8963 28.5272C49.9637 28.4599 50.0008 28.3703 50.0008 28.2751C50.0008 28.1799 49.9637 28.0903 49.8964 28.023Z"
                      fill="#171D34"
                    />
                    <path
                      d="M47.0675 25.1941C46.9285 25.0551 46.7022 25.0551 46.5633 25.1941C46.4242 25.3331 46.4242 25.5593 46.5633 25.6983L47.103 26.2381C47.1725 26.3076 47.2638 26.3424 47.3552 26.3424C47.4465 26.3424 47.5378 26.3076 47.6073 26.2381C47.7463 26.0991 47.7463 25.8729 47.6073 25.7339L47.0675 25.1941Z"
                      fill="#171D34"
                    />
                    <path
                      d="M39.2902 4.54164C39.3815 4.54164 39.4728 4.50689 39.5423 4.43737L40.0821 3.89759C40.2211 3.75858 40.2211 3.53235 40.0821 3.39332C39.943 3.25433 39.7168 3.25429 39.5778 3.39332L39.038 3.93312C38.9707 4.00045 38.9336 4.09001 38.9336 4.18524C38.9336 4.28047 38.9707 4.37002 39.038 4.43736C39.1076 4.50689 39.1989 4.54164 39.2902 4.54164Z"
                      fill="#171D34"
                    />
                    <path
                      d="M41.579 2.25253C41.6704 2.25253 41.7617 2.21778 41.8312 2.14828L42.3709 1.6085C42.4383 1.54116 42.4754 1.45161 42.4754 1.35638C42.4754 1.26114 42.4383 1.17159 42.3709 1.10426C42.2319 0.965231 42.0057 0.965264 41.8667 1.10426L41.3269 1.64404C41.1879 1.78305 41.1879 2.00927 41.3269 2.14831C41.3964 2.21778 41.4877 2.25253 41.579 2.25253Z"
                      fill="#171D34"
                    />
                    <path
                      d="M41.8667 4.43735C41.9362 4.50686 42.0275 4.54162 42.1188 4.54162C42.2101 4.54162 42.3015 4.50686 42.3709 4.43735C42.51 4.29834 42.51 4.07212 42.3709 3.93311L41.8312 3.39333V3.39331C41.6922 3.2543 41.4659 3.25432 41.3269 3.39333C41.1879 3.53234 41.1879 3.75856 41.3269 3.89757L41.8667 4.43735Z"
                      fill="#171D34"
                    />
                    <path
                      d="M39.5777 2.14829C39.6472 2.21781 39.7385 2.25256 39.8298 2.25256C39.9211 2.25256 40.0124 2.21781 40.0819 2.14829C40.2209 2.00928 40.2209 1.78305 40.0819 1.64404L39.5421 1.10425C39.4031 0.96526 39.1769 0.96526 39.0379 1.10425C38.8988 1.24326 38.8988 1.4695 39.0379 1.60851L39.5777 2.14829Z"
                      fill="#171D34"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_524_19804">
                      <rect width="50" height="50" fill="white" />
                    </clipPath>
                  </defs>
                </svg>{" "}
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
                    year: distinctYears.selectedYear,
                    specialExpensesArr,
                    calculateCPPandELDeductionsForEmployed: {
                      party1: calculateCPPandELDeductionsForEmployed(1),
                      party2: calculateCPPandELDeductionsForEmployed(2),
                    },
                    calculateCPPandEIDeductionsForSelfEmployed: {
                      party1: calculateCPPandEIDeductionsForSelfEmployed(1),
                      party2: calculateCPPandEIDeductionsForSelfEmployed(2),
                    },
                    SecondAdditionalCPPEmployed:{
                      party1: SecondAdditionalCPPEmployed(1), 
                      party2: SecondAdditionalCPPEmployed(2)
                    },


                    SecondAdditionalCPPSelfEmployed:{
                      party1: SecondAdditionalCPPSelfEmployed(1), 
                      party2: SecondAdditionalCPPSelfEmployed(2)
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
              `${AUTH_ROUTES.CALCULATOR}?id=${getCalculatorIdFromQuery(
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

  // if(data.year == 2024){

  //   const newColumns = [
  //     new Column(
  //       "Second additional CPP Employed ",
  //       data.SecondAdditionalCPPEmployed.party1,
  //       data.SecondAdditionalCPPEmployed.party2
  //     ),
  //     new Column(
  //       "Second additional CPP Self Employed ",
  //       data.SecondAdditionalCPPSelfEmployed.party1,
  //       data.SecondAdditionalCPPSelfEmployed.party2 
  //     ),
  //   ];


  //   Deductions.splice(1, 0, ...newColumns);
  // }


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

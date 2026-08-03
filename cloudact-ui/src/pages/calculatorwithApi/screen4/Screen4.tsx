import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import ReactToPrint from "react-to-print";
import InputCustom from "../../../components/InputCustom";
import useQuery from "../../../hooks/useQuery";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import { childSupportDetails } from "../../../utils/Apis/calcChildSupport";
import { apiCalculatorById } from "../../../utils/Apis/calculator/Calculator_values_id";
import { replaceLastThreeChars } from "../../../utils/helpers";
import { formulaForChildSupport } from "../../../utils/helpers/calculator/taxCalculationFormula";
import { formatNumberInThousands } from "../../../utils/helpers/Formatting";

import {
  backgroundState,
  calculatorScreen2State,
  getCalculatorIdFromQuery,
} from "../Calculator";
//@ts-ignore
import Reports from "../reports/Reports.tsx";
//@ts-ignore
import CalculationReport from "../../freeCalculatorApi/reports/CalculationReport.tsx";

import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../screen1/Screen1";
import { totalNumberOfChildren } from "../screen2/Screen2";
import {
  changeReportIncompleteToComplete,
  determineTypeOfSplitting,
  getNumberOfChildrenWithParty1,
  getNumberOfChildrenWithParty2,
  getNumberOfChildrenWithSharing,
  supportQuantum,
} from "./Screen4";
import NPVCalculator from "../npvCalculation/NPVCalculator";
import CustomCheckbox from "../../../components/LayoutComponents/CustomCheckbox/CustomCheckbox";
import Restructuring from "./restructure/Restructuring.tsx";
import { getSvg } from "../assets/Svgs";

type Props = {
  screen1: {
    background: backgroundState;
    aboutTheChildren: aboutYourChildrenState;
    aboutTheRelationship: aboutTheRelationshipState;
  };
  screen2: calculatorScreen2State;
  screen3: Object;
  typeOfCalculatorSelected: string;
  props: any;
  label: any;
  lumpsum: any;
  lifeInsurence: any;
  includeLumpsum: Boolean;
  includeLifeInsurence: Boolean;
  scenarios: any;
  setScenarios: any;
  restructioring: any,
  setRestructioring: any,
  allApiDataCal: any,
  setAllApiDataCal: any
};


const Screen4 = ({
  screen1,
  screen2,
  typeOfCalculatorSelected,
  label,
  lumpsum,
  props,
  lifeInsurence,
  includeLumpsum,
  includeLifeInsurence,
  scenarios,
  setScenarios,
  restructioring,
  setRestructioring,
  allApiDataCal,
  setAllApiDataCal
}: Props) => {
  const query = useQuery();
  let calculator_report = useRef(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const history = useHistory();



  console.log("allApiDataCalScrren4", allApiDataCal)
  let { support_quantum_high, support_quantum_low, support_quantum_med } = allApiDataCal;

  // console.log( "low case support",low.withspecialExp.with_spousal_support.p1.childExp.childSupport.childsupport)
  // console.log( "med case support",med.withspecialExp.with_spousal_support.calulationAmount.party2SupportReceived )
  // console.log( "high case support",high.withspecialExp.with_spousal_support.calulationAmount.party2SupportReceived )


  // const getSpousalSupportFromApi = (type)=>{
  //   return allApiDataCal[type]?.withspecialExp?.with_spousal_support?.calulationAmount?.party2SupportReceived /12;
  // }

  // const getChildSupportFromApi = (type)=>{
  //   return allApiDataCal[type]?.withspecialExp.with_spousal_support.p1.childExp.childSupport.childsupport /12;
  // }





  const {
    highparty2: lumpsumHigh,
    midparty2: lumpsumMid,
    lowparty2: lumpsumLow,
  } = screen2.lumpsumReport;
  const {
    highparty2: lifeinsurenceHigh,
    midparty2: lifeinsurenceMid,
    lowparty2: lifeinsurenceLow,
  } = screen2.insurenceReport;





  const spousalSupportMedGreater = () => {
    return Math.round(
      Math.max(
        screen2.spousalSupport.spousalSupport1Med,
        screen2.spousalSupport.spousalSupport2Med
      )
    );
  };

  const spousalSupportLowGreater = () => {
    return Math.round(
      Math.max(
        screen2.spousalSupport.spousalSupport1Low,
        screen2.spousalSupport.spousalSupport2Low
      )
    );
  };

  const spousalSupportHighGreater = () => {
    return Math.round(
      Math.max(
        screen2.spousalSupport.spousalSupport1High,
        screen2.spousalSupport.spousalSupport2High
      )
    );
  };

  const getNumberOfChildWithParties = () => {
    return screen1.aboutTheChildren.count;
  };

  const childSupportGreater = (): number => {
    //if the custody is of splitting, then we need to net it off.
    //11802(party1) - 7008(party2)
    //this diff will go to party 2.

    //if party1 has child then child support will go to party 1 otherwise vice-versa.
    const childSupportParty1 = screen2.childSupport.childSupport1; //1351
    const childSupportParty2 = screen2.childSupport.childSupport2; //0


    const typeOfSplitting = determineTypeOfSplitting(
      getNumberOfChildWithParties(),
      totalNumberOfChildren(screen1.aboutTheChildren)
    );
    // we convert this logic on Screen 2 (-info-)
    // if (typeOfSplitting === "SPLIT" || typeOfSplitting === "SHARED") {
    //   if (childSupportParty1 > childSupportParty2) {
    //     return childSupportParty1 - childSupportParty2;
    //   } else {
    //     return childSupportParty2 - childSupportParty1;
    //   }
    // } else 
    if (typeOfSplitting === "HYBRID") {
      if (screen2.maximumChildLivesWith === 1) {
        return childSupportParty2 - screen2.childSupportReadOnly.party1;
      } else if (screen2.maximumChildLivesWith === 2) {
        return childSupportParty1 - screen2.childSupportReadOnly.party2;
      }
    }


    //which party has child will get the amount calculated by other party.
    //refer majority party excel file.
    else if (
      getNumberOfChildrenWithParty1(getNumberOfChildWithParties()) >
      getNumberOfChildrenWithParty2(getNumberOfChildWithParties())
    ) {
      return childSupportParty2;
    } else if (
      getNumberOfChildrenWithParty2(getNumberOfChildWithParties()) >
      getNumberOfChildrenWithParty1(getNumberOfChildWithParties())
    ) {
      return childSupportParty1;
    } else {
      return Math.max(childSupportParty1, childSupportParty2);
    }



    console.log("chilSuportParty1 on 4th screen after", childSupportParty1)
    console.log("chilSuportParty1 on 4th screen 2 after", childSupportParty2)
  };

  const determineSupportGivenTo = () => {
    const supportGivenTo = screen2.childSupport.givenTo;

    if (
      determineTypeOfSplitting(
        getNumberOfChildWithParties(),
        screen1.aboutTheChildren.numberOfChildren
      ) === "SPLIT"
    ) {
      if (supportGivenTo === screen1.background.party1FirstName) {
        return screen1.background.party1FirstName;
      } else {
        return screen1.background.party2FirstName;
      }
    }

    return supportGivenTo;
  };

  const fixDurationOfSupportFormat = (arr: number[]): string => {
    if (arr[0] > 9999999) {
      return "Indefinite";
    }

    return `${arr[0]} - ${arr[1]} years`;
  };

  const getChildSpecialExpenses = (type: "Low" | "Med" | "High") => {
    const { specialExpenses, specialExpensesArr } = screen2;
    const partyGivenBy =
      specialExpensesArr.party1.filter((data) => data.value === "21400")[0]
        ?.value >
        specialExpensesArr.party2.filter((data) => data.value === "21400")[0]
          ?.value
        ? 2
        : 1;

    if (type === "Low") {
      return partyGivenBy === 1
        ? specialExpenses.specialExpensesLow1
        : specialExpenses.specialExpensesLow2;
    } else if (type === "Med") {
      return partyGivenBy === 1
        ? specialExpenses.specialExpensesMed1
        : specialExpenses.specialExpensesMed2;
    } else {
      return partyGivenBy === 1
        ? specialExpenses.specialExpensesHigh1
        : specialExpenses.specialExpensesHigh2;
    }
  };

  const [reportData, setReportData] = useState({
    data: {},
    showReportTemplate: true,
  });

  useEffect(() => {
    // Minus the number of shared children as we are always adding in the screen2.tsx in modifyScreen1PropsIfChildShared.
    if (
      determineTypeOfSplitting(
        getNumberOfChildWithParties(),
        totalNumberOfChildren(screen1.aboutTheChildren)
      ) === "HYBRID"
    ) {
      screen1.aboutTheChildren.count.party1 -=
        screen1.aboutTheChildren.count.shared;
      screen1.aboutTheChildren.count.party2 -=
        screen1.aboutTheChildren.count.shared;
    }
  }, []);

  useEffect(() => {
    downloadReports(getCalculatorIdFromQuery(query));
  }, []);

  const downloadReports = async (id: number) => {
    const data = await apiCalculatorById.get_value(id);

    const ExtractedData = JSON.parse(data.report_data);
    // setRestructioring(ExtractedData.restructioring)
    console.log("ExtractedData", ExtractedData.restructioring)

    // const TaxAmountForLumpSumAndInsurence = JSON.parse(data.report_data)?.valueswithoutSpousalSupport
    // if(TaxAmountForLumpSumAndInsurence){
    //   setRestructioring(true)
    // }


    setReportData((prev) => ({
      data: ExtractedData,
      showReportTemplate: false,
    }));
  };

  const reportType = reportData?.data?.report_type;
  const [supportQuantum, setSupportQuantum] = useState<supportQuantum>({
    support1: {
      spousalSupport: spousalSupportLowGreater(),
      childSupport: childSupportGreater() / 12,
      childSpecialExpense: getChildSpecialExpenses("Low") / 12,
      spousalSupportGivenTo: screen2.childSupport.givenTo,
      childSupportGivenTo: determineSupportGivenTo(),
      childSupportSpecialExpenses: 0,
      totalSupport: 0,
    },
    support2: {
      spousalSupport: spousalSupportMedGreater(),
      childSupport: childSupportGreater() / 12,
      childSpecialExpense: getChildSpecialExpenses("Med") / 12,
      spousalSupportGivenTo: screen2.childSupport.givenTo,
      childSupportGivenTo: determineSupportGivenTo(),
      childSupportSpecialExpenses: 0,
      totalSupport: 0,
    },
    support3: {
      spousalSupport: spousalSupportHighGreater(),
      childSupport: childSupportGreater() / 12,
      childSpecialExpense: getChildSpecialExpenses("High") / 12,
      spousalSupportGivenTo: screen2.childSupport.givenTo,
      childSupportGivenTo: determineSupportGivenTo(),
      childSupportSpecialExpenses: 0,
      totalSupport: 0,
    },
    spousalSupportDurationRange: fixDurationOfSupportFormat(
      screen2.durationOfSupport
    ),
    loading: false,
    supportGivenTo: screen2.childSupport.givenTo,
  });


  const supportAmount = {
    party1: screen2.spousalSupport.spousalSupport1,
    party2: screen2.spousalSupport.spousalSupport2,
    // loading1: true,
    // loading2: true,
  };

  const supportAmountSpousal = {
    party1: screen2.childSupport.childSupport1,
    party2: screen2.childSupport.childSupport2,
  };

  const getTotalSupport1 = () => {
    const { childSpecialExpense, childSupport, spousalSupport } =
      supportQuantum.support1;

    return (
      Number(childSpecialExpense) +
      Number(childSupport) +
      Number(spousalSupport)
    );
  };

  const getTotalSupport2 = () => {
    const { childSpecialExpense, childSupport, spousalSupport } =
      supportQuantum.support2;

    return (
      Number(childSpecialExpense) +
      Number(childSupport) +
      Number(spousalSupport)
    );
  };

  const getTotalSupport3 = () => {
    const { childSpecialExpense, childSupport, spousalSupport } =
      supportQuantum.support3;

    return (
      Number(childSpecialExpense) +
      Number(childSupport) +
      Number(spousalSupport)
    );
  };

  const isShared = () => {
    return getNumberOfChildrenWithSharing(screen1.aboutTheChildren.count) > 0;
  };

  const getTotalNumberOfChildren = () => {
    return screen1.aboutTheChildren.numberOfChildren;
  };

  const getProvinceOfParty1 = () => {
    return screen1.background.party1province || "ON";
  };

  const getProvinceOfParty2 = () => {
    return screen1.background.party2province || "ON";
  };

  const calculateSupportForParty1 = () => {
    const incomeOver = getTotalIncomeParty1();
    const numChildren = isShared()
      ? getTotalNumberOfChildren()
      : getNumberOfChildrenWithParty2(getNumberOfChildWithParties());
    const province = getProvinceOfParty1();

    const data = {
      incomeOver: replaceLastThreeChars(incomeOver),
      numChildren,
      province,
    };

    try {
      childSupportDetails(data).then((res) => {
        const formulaResult = formulaForChildSupport({
          ...res,
          totalIncomeParty: parseInt(incomeOver),
        });

        supportAmount.party1 = formulaResult ? formulaResult : 0;
        supportAmount.loading1 = false;

        childSupportVal();
      });
    } catch (err) {
      console.log("err", err);
      supportAmount.loading1 = false;
      setSupportQuantum({ ...supportQuantum, loading: false });

      alert(err);
    }
  };

  const calculateSupportForParty2 = () => {
    const incomeOver = getTotalIncomeParty2();
    const numChildren = isShared()
      ? getTotalNumberOfChildren()
      : getNumberOfChildrenWithParty1(getNumberOfChildWithParties());
    const province = getProvinceOfParty2();

    const data = {
      incomeOver: replaceLastThreeChars(incomeOver),
      numChildren,
      province,
    };
    try {
      childSupportDetails(data).then((res) => {
        const formulaResult = formulaForChildSupport({
          ...res,
          totalIncomeParty: parseInt(incomeOver),
        });
        supportAmount.loading2 = false;
        supportAmount.party2 = formulaResult ? formulaResult : 0;
        childSupportVal();
      });
    } catch (err) {
      console.log("err", err);
      supportAmount.loading2 = false;
      setSupportQuantum({ ...supportQuantum, loading: false });

      alert(err);
    }
  };

  const childSupportVal = () => {
    if (!supportAmount.loading1 && !supportAmount.loading2) {
      const supportDetails: supportQuantum = supportQuantum;
      const diff = parseFloat(
        Math.abs(supportAmount.party1 - supportAmount.party2).toFixed(4)
      );

      supportDetails.support1.childSupport = diff;
      supportDetails.support2.childSupport = diff;
      supportDetails.support3.childSupport = diff;

      if (supportAmount.party1 > supportAmount.party2) {
        supportDetails.supportGivenTo = screen1.background.party2FirstName;
      } else {
        supportDetails.supportGivenTo = screen1.background.party1FirstName;
      }

      setSupportQuantum({
        ...supportDetails,
        loading: false,
      });
    }
  };

  const getTotalIncomeParty1 = () => {
    return screen2.totalIncomeParty1.toString();
  };

  const getTotalIncomeParty2 = () => {
    return screen2.totalIncomeParty2.toString();
  };

  const changeInputInSupport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupportQuantum({
      ...supportQuantum,
      [e.target.name]: e.target.value,
    });
  };

  const changeInputInSupport1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupportQuantum({
      ...supportQuantum,
      support1: {
        ...supportQuantum.support1,
        [e.target.name]: e.target.value,
      },
    });
  };

  const changeInputInSupport2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupportQuantum({
      ...supportQuantum,
      support2: {
        ...supportQuantum.support2,
        [e.target.name]: e.target.value,
      },
    });
  };

  const changeInputInSupport3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupportQuantum({
      ...supportQuantum,
      support3: {
        ...supportQuantum.support3,
        [e.target.name]: e.target.value,
      },
    });
  };

  const HusbandImage = () => (
    <div className="userImage">
      {getSvg('HusbandImage')}

      {screen1.background.party1FirstName}
    </div>
  );

  const WifeImage = () => (
    <div className="userImage">

      {getSvg('WifeImage')}
      {screen1.background.party2FirstName}
    </div>
  );

  interface ArrowDetails {
    amount: number | string;
    givenTo: boolean;
  }

  const AmountGivenToParty1 = (givenTo: string): boolean => {
    return screen1.background.party1FirstName === givenTo;
  };

  const ChildSpecialExpenseArrow = ({ amount, givenTo }: ArrowDetails) => {
    return (
      <div className="arrow" style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
        <span style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
          {formatNumberInThousands(amount)
            .toString()
            .replace(/(\.00|\.0+)$/, "")}{" "}
          Child Special Expense Support
        </span>
        {getSvg('Child Special Expense Support')}

      </div>
    );
  };

  const LumpsumArrow = ({ amount, givenTo }: ArrowDetails) => {
    return (
      <div className="arrow" style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
        <span style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
          {amount} {""}
          Lump Sum Amount
        </span>
        {getSvg('Lump Sum Amount')}
      </div>
    );
  };

  const LifeinsurenceArrow = ({ amount, givenTo }: ArrowDetails) => {
    return (
      <div className="arrow" style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
        <span style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
          {amount} {""}
          Lump Sum Amount
        </span>
        {getSvg('Lump Sum Amount')}
      </div>
    );
  };

  const SpousalSupportArrow = ({ amount, givenTo }: ArrowDetails) =>
    typeOfCalculatorSelected !== "CHILD_SUPPORT_CAL" && (
      <div className="arrow" style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
        {getSvg('SpousalSupportArrow')}

        <span style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
          {formatNumberInThousands(amount)
            .toString()
            .replace(/(\.00|\.0+)$/, "")}{" "}
          Spousal Support
        </span>
      </div>
    );

  const SpousalSupportArrowApi = ({ amount, givenTo }: ArrowDetails) =>
    typeOfCalculatorSelected !== "CHILD_SUPPORT_CAL" && (
      <div className="arrow" style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
        {getSvg('SpousalSupportArrow')}

        <span style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
          {formatNumberInThousands(amount)
            .toString()
            .replace(/(\.00|\.0+)$/, "")}{" "}
          Spousal Support  API V
        </span>
      </div>
    );

  const ChildSupportArrow = ({ amount, givenTo }: ArrowDetails) => (
    <div className="arrow" style={givenTo ? { transform: 'scaleX(-1)' } : {}}>

      {getSvg("ChildSupportArrow")}
      <span style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
        {formatNumberInThousands(amount)
          .toString()
          .replace(/(\.00|\.0+)$/, "")}{" "}
        Child Support(Table Amount)
      </span>
    </div>
  );
  const ChildSupportArrowApi = ({ amount, givenTo }: ArrowDetails) => (
    <div className="arrow" style={givenTo ? { transform: 'scaleX(-1)' } : {}}>

      {getSvg("ChildSupportArrow")}
      <span style={givenTo ? { transform: 'scaleX(-1)' } : {}}>
        {formatNumberInThousands(amount)
          .toString()
          .replace(/(\.00|\.0+)$/, "")}{" "}
        Child Support Api v(Table Amount)
      </span>
    </div>
  )

  const ChildSupportSpecialArrow = ({ amount, givenTo }: ArrowDetails) => (
    <div
      className="justify-content-center d-flex my-5"
      style={{ position: "relative" }}
    >
      <img src="/images/arrow_black.jpeg" className="w-75" alt="" />
      <span
        style={{ position: "absolute", top: "40%", color: "white" }}
        className="heading-5"
      >
        {formatNumberInThousands(amount)} Child Support (Special Expenses)
      </span>
    </div>
  );

  const handleChangeRestrcution = (event) => {
    const { checked } = event.target;
    setRestructioring(checked);
  };

  const saveScenariotoDB = async () => {
    let allreportresult = {
      ...screen2.report_data,
      scenarios: scenarios,
      restructioring: restructioring
    };
    if (getCalculatorIdFromQuery(query)) {
      await apiCalculatorById.edit_value(getCalculatorIdFromQuery(query), {
        report_data: allreportresult,
      });

      downloadReports(getCalculatorIdFromQuery(query));
    } else {
      alert("Please fill provice data first");
    }
  };


  const handleChildData = (value) => {
    // setCollectedValues((prevValues) => [...prevValues, value]);
    console.log("unnder value", value)
  }



  return (
    <>
      {/* <OverviewCal screen1={screen1} incomeDetails={{party1: screen2.totalIncomeParty1,party2: screen2.totalIncomeParty2,}}taxDetails={{ party1: 0, party2: 0 }}/> */}
      <div className="panel">
        Api Version
        {/* <input type="checkbox" onChange={handleChangeRestrcution} value={restructioring}/> */}
        <div className="pHead">
          <span className="h5">
            {getSvg('Support Quantum range')}

            Support Quantum range
          </span>
        </div>
        <div className="pBody">
          <span className="heading">Scenario 1- Low End</span>
          <div className="scenarioView">
            <HusbandImage />
            <div className="arrowView">

              <SpousalSupportArrowApi
                amount={support_quantum_low}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support3.spousalSupportGivenTo
                )}
              />

              {/* <ChildSupportArrowApi
                amount={getChildSupportFromApi('low')}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support1.childSupportGivenTo
                )}
              /> */}






              <SpousalSupportArrow
                amount={Math.round(supportQuantum.support1.spousalSupport)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support1.spousalSupportGivenTo
                )}
              />
              <ChildSupportArrow
                amount={Math.round(supportQuantum.support1.childSupport)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support1.childSupportGivenTo
                )}
              />
              <ChildSpecialExpenseArrow
                amount={Math.round(supportQuantum.support1.childSpecialExpense)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support1.childSupportGivenTo
                )}
              />
              {includeLumpsum && !includeLifeInsurence && (
                <LumpsumArrow amount={lumpsumLow} />
              )}

              {includeLifeInsurence && (
                <>
                  <LumpsumArrow amount={lumpsumLow} />
                  <LifeinsurenceArrow amount={lifeinsurenceLow} />
                </>
              )}
            </div>
            <WifeImage />
          </div>
          <span className="heading mt-5">Scenario 2- Midpoint</span>
          <div className="scenarioView">
            <HusbandImage />
            <div className="arrowView">

              <SpousalSupportArrowApi
                amount={support_quantum_med}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support3.spousalSupportGivenTo
                )}
              />
              {/* <ChildSupportArrowApi
                amount={getChildSupportFromApi('med')}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support1.childSupportGivenTo
                )}
              /> */}



              <SpousalSupportArrow
                amount={Math.round(supportQuantum.support2.spousalSupport)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support2.spousalSupportGivenTo
                )}
              />
              <ChildSupportArrow
                amount={Math.round(supportQuantum.support2.childSupport)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support2.childSupportGivenTo
                )}
              />
              <ChildSpecialExpenseArrow
                amount={Math.round(supportQuantum.support2.childSpecialExpense)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support2.childSupportGivenTo
                )}
              />

              {includeLumpsum && !includeLifeInsurence && (
                <LumpsumArrow amount={lumpsumMid} />
              )}

              {includeLifeInsurence && (
                <>
                  <LumpsumArrow amount={lumpsumMid} />
                  <LifeinsurenceArrow amount={lifeinsurenceMid} />
                </>
              )}
            </div>
            <WifeImage />
          </div>
          <span className="heading mt-5">Scenario 3- High End</span>
          <div className="scenarioView">
            <HusbandImage />
            <div className="arrowView">

              <SpousalSupportArrowApi
                amount={support_quantum_high}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support3.spousalSupportGivenTo
                )}
              />

              {/* <ChildSupportArrowApi
                amount={getChildSupportFromApi('high')}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support1.childSupportGivenTo
                )}
              /> */}



              <SpousalSupportArrow
                amount={Math.round(supportQuantum.support3.spousalSupport)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support3.spousalSupportGivenTo
                )}
              />
              <ChildSupportArrow
                amount={Math.round(supportQuantum.support3.childSupport)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support3.childSupportGivenTo
                )}
              />
              <ChildSpecialExpenseArrow
                amount={Math.round(supportQuantum.support3.childSpecialExpense)}
                givenTo={AmountGivenToParty1(
                  supportQuantum.support3.childSupportGivenTo
                )}
              />
              {includeLumpsum && !includeLifeInsurence && (
                <LumpsumArrow amount={lumpsumHigh} />
              )}

              {includeLifeInsurence && (
                <>
                  <LumpsumArrow amount={lumpsumHigh} />
                  <LifeinsurenceArrow amount={lifeinsurenceHigh} />
                </>
              )}
            </div>
            <WifeImage />
          </div>
          <div>

          </div>
          {typeOfCalculatorSelected !== "CHILD_SUPPORT_CAL" && (
            <>
              <div className="pHead">
                <span className="h5">

                  {
                    getSvg("Spousal Support Duration Range")
                  }
                  Spousal Support Duration Range
                </span>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <InputCustom
                      type="text"
                      handleChange={changeInputInSupport}
                      value={supportQuantum.spousalSupportDurationRange}
                      name="spousalSupportDurationRange"
                      label=""
                    ></InputCustom>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="d-flex justify-content-start">
        <CustomCheckbox
          ChangeFun={handleChangeRestrcution}
          label={"Restructuring the Support Amount"}
          checked={restructioring}
        />
      </div>





      {
        restructioring &&
        <div className="row">

          <div className="col-md-4">
            <Restructuring {...props}
              handleChildData={handleChildData} scenarioKey="scenario1" setScenarios={setScenarios}
              scenarios={scenarios}
            />
          </div>

          <div className="col-md-4">
            <Restructuring {...props}
              handleChildData={handleChildData} scenarioKey="scenario2" setScenarios={setScenarios}
              scenarios={scenarios}
            />
          </div>

          <div className="col-md-4">
            <Restructuring {...props}
              handleChildData={handleChildData} scenarioKey="scenario3" setScenarios={setScenarios}
              scenarios={scenarios}
            />
          </div>

          <div className="d-flex justify-content-center mt-4">
            <button className="btn btnPrimary rounded-pill" onClick={saveScenariotoDB}>
              Save
            </button>
          </div>


        </div>
      }




      <div className="btnGroup mb-3">
        <button
          className="btn btnPrimary rounded-pill"
          onClick={() =>
            history.push(
             `${AUTH_ROUTES.API_CALCULATOR}?id=${getCalculatorIdFromQuery(
                  query
                )}&step=2`
            )
          }
        >
          Back
        </button>
        <div className="d-flex">
          <button
            className="btn btnPrimary rounded-pill me-3"
            onClick={() => {
              history.push(AUTH_ROUTES.API_SUPPORT_CALCULATOR);
            }}
          >
            Home Page
          </button>
          <ReactToPrint
            trigger={() => (
              <button
                className="btn"
                style={{
                  backgroundColor: "#2d5aa0",
                  color: "#fff",
                  padding: "10px 30px",
                  borderRadius: "50px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="fa-solid fa-file-pdf" style={{ fontSize: "16px" }}></i>
                Download Report
              </button>
            )}
            content={() => reportRef.current}
            documentTitle={`CloudAct_Calculation_Report_${screen1.background.party1FirstName}_${screen1.background.party2FirstName}`}
            pageStyle={`
              @page {
                size: landscape;
                margin: 10mm;
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}
          />
          {query.get("saveValues") === "true" && (
            <button
              onClick={() => {
                changeReportIncompleteToComplete(
                  getCalculatorIdFromQuery(query)
                );
              }}
              className="btn btnPrimary rounded-pill"
            >
              <ReactToPrint
                pageStyle={`@page {
                  size: A4;
                  margin: 0;
                }
                body {
                  size: A4;
                  margin: 0;
                }`}
                onBeforePrint={() => {
                  const content = calculator_report.current;
                  if (content) {
                    content.style.height = "90%";
                  }
                }}
                trigger={() => (
                  <button className="btn btnPrimary rounded-pill">
                    Download Full Report
                  </button>
                )}
                content={() => calculator_report.current}
              />
            </button>
          )}
        </div>
      </div>
      {reportData.data && (
        <div>
          <Reports ref={calculator_report} data={reportData.data} />
        </div>
      )}

      {/* Hidden Report Template for PDF Generation */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          opacity: 0,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <CalculationReport
          ref={reportRef}
          background={screen1.background}
          aboutTheChildren={screen1.aboutTheChildren}
          aboutTheRelationship={screen1.aboutTheRelationship}
          screen2={screen2}
          typeOfCalculatorSelected={typeOfCalculatorSelected}
          supportQuantum={supportQuantum}
        />
      </div>

    </>
  );
};

export default Screen4;

import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useHistory } from "react-router";
import InputCustom from "../../../components/InputCustom";
import { childSupportDetails } from "../../../utils/Apis/calcChildSupport";
import { replaceLastThreeChars } from "../../../utils/helpers";
import {
  convertCurrencyFormattingToText,
  formatNumberInThousands
} from "../../../utils/helpers/Formatting";
import { backgroundState, calculatorScreen2State } from "../Calculator";
import {
  aboutTheRelationshipState,
  aboutYourChildrenState
} from "../screen1/Screen1";

type Props = {
  settingScreen3StateFromChild: (obj: any) => void;
  screen1: {
    background: backgroundState;
    aboutTheChildren: aboutYourChildrenState;
    aboutTheRelationship: aboutTheRelationshipState;
  };
  screen2: calculatorScreen2State;
  typeOfCalculatorSelected: string;
};

const Screen3 = ({ settingScreen3StateFromChild, screen1, screen2, typeOfCalculatorSelected }: Props) => {
  // const [credits, setCredits] = useState([
  //   {
  //     name: "Basic Personal Amount",
  //     party1: "",
  //     party2: "",
  //     lineRef: "",
  //   },
  // ]);
  // const [deductions, setDeductions] = useState([
  //   {
  //     name: "Enhanced CPP",
  //     party1: "",
  //     party2: "",
  //     lineRef: "",
  //   },
  // ]);
  // const [benefits, setBenefits] = useState([
  //   {
  //     name: "Canada Child Benefit",
  //     party1: "",
  //     party2: "",
  //     lineRef: "",
  //   },
  //   {
  //     name: "Canada GST/HST credit",
  //     party1: "",
  //     party2: "",
  //     lineRef: "",
  //   },
  //   {
  //     name: "Ontario Child Benefit",
  //     party1: "",
  //     party2: "",
  //     lineRef: "",
  //   },
  //   {
  //     name: "Ontario Sales Tax Benefit",
  //     party1: "",
  //     party2: "",
  //     lineRef: "",
  //   },
  // ]);

  const supportAmount = {
    party1: 0,
    party2: 0,
    loading1: true,
    loading2: true,
  };

  const history = useHistory();

  const [taxAndBenefits, setTaxAndBenefits] = useState({
    taxAmountParty1: '0',
    taxAmountParty2: '0',
    benefitAmount1: '0',
    benefitAmount2: '0',
    childSupportTable1: '0',
    childSupportTable2: '0',
  });

  const formulaForChildSupport = (data: any) => {
    console.log("formula data", data);
    const formula =
      data.basic +
      (data.totalIncomeParty - data.income_over) * (data.rate / 100);

    return formula;
  };

  const childSupportVal = () => {
    if (!supportAmount.loading1 && !supportAmount.loading2) {
      // const taxBenefitObj = taxAndBenefits;
      // const diff = parseFloat(
      //   Math.abs(supportAmount.party1 - supportAmount.party2).toFixed(2)
      // );

      // taxAndBenefits.childSupportTable1 = supportAmount.party1;
      // taxAndBenefits.childSupportTable2 = supportAmount.party2;

      setTaxAndBenefits((prev) => ({
        ...prev,
        childSupportTable1: supportAmount.party1.toFixed(2),
        childSupportTable2: supportAmount.party2.toFixed(2)
      }));
    }
  };

  const party1Name = () => {
    return screen1.background.party1FirstName;
  };

  const party2Name = () => {
    return screen1.background.party2FirstName;
  };

  const getTotalIncomeParty1 = () => {
    return screen2.totalIncomeParty1.toString();
  };

  const getTotalIncomeParty2 = () => {
    return screen2.totalIncomeParty2.toString();
  };

  // const getNumberOfChildWithParties = () => {
  //   return screen1.aboutTheChildren.count;
  // };

  // const getNumberOfChildrenWithParty2 = () => {
  //   //the num children gets changed in case of split child. E.g husband will pay for children of wife.
  //   return getNumberOfChildWithParties().party2;
  // };

  // const getNumberOfChildrenWithParty1 = () => {
  //   //the num children gets changed in case of split child. E.g husband will pay for children of wife.
  //   return getNumberOfChildWithParties().party1;
  // };

  // const getNumberOfChildrenWithSharing = () => {
  //   //the num children gets changed in case of split child. E.g husband will pay for children of wife.
  //   return getNumberOfChildWithParties().shared;
  // };

  // const isShared = () => {
  //   return getNumberOfChildrenWithSharing() > 0;
  // };

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
    const numChildren = getTotalNumberOfChildren();
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
        console.log("formula Result", formulaResult);

        supportAmount.party1 = formulaResult ? formulaResult : 0;
        supportAmount.loading1 = false;
        console.log("support Amount.party 1", supportAmount.party1);

        childSupportVal();
      });
    } catch (err) {
      console.log("err", err);
      supportAmount.loading1 = false;
      setTaxAndBenefits({ ...taxAndBenefits });
      alert(err);
    }
  };

  const calculateSupportForParty2 = () => {
    const incomeOver = getTotalIncomeParty2();
    const numChildren = getTotalNumberOfChildren();
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
        console.log("formula Result", formulaResult);
        supportAmount.loading2 = false;
        supportAmount.party2 = formulaResult ? formulaResult : 0;
        console.log("support Amount.party 2", supportAmount.party2);
        childSupportVal();
      });
    } catch (err) {
      console.log("err", err);
      supportAmount.loading2 = false;
      setTaxAndBenefits({ ...taxAndBenefits });
      alert(err);
    }
  };

  const passStateToParentAndNextPage = () => {
    settingScreen3StateFromChild(taxAndBenefits);

    history.push("/calculator?step=4");
  };

  const calculateChildSupport = () => {
    calculateSupportForParty1();
    calculateSupportForParty2();
  };

  useEffect(() => {
    calculateChildSupport();
  }, []);

  return (
    <Container>
      <div className="calculator__form my-5 py-5 px-5">
        <h4 className="heading-4">Tax And Credits</h4>
        <Row md={2} xs={1} className="my-4">
          <Col className="justify-content-center">
            <h4 className="heading-5 text-center ">{party1Name()}</h4>
            <InputCustom
              label="Tax and Deductions"
              type="number"
              handleChange={(event) =>
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  taxAmountParty1: event.target.value,
                })
              }
              value={taxAndBenefits.taxAmountParty1}
              margin="1.9rem 0"
            ></InputCustom>{" "}
            <InputCustom
              label="Benefits and Credit"
              type="number"
              handleChange={(event) =>
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  benefitAmount1: event.target.value,
                })
              }
              value={taxAndBenefits.benefitAmount1}
              margin="1.9rem 0"
            ></InputCustom>
            <InputCustom
              label="Child Support "
              type="text"
              handleChange={(event) =>
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  childSupportTable1: event.target.value,
                })
              }
              value={`${formatNumberInThousands(
                parseInt(taxAndBenefits.childSupportTable1) * 12
              )}`}
              margin="1.9rem 0"
            ></InputCustom>
            {/* <InputCustom
              label="Benefits and Credit"
              type="number"
              handleChange={(event) =>
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  benefitAmount1: event.target.value,
                })
              }
              value={taxAndBenefits.benefitAmount1}
              margin="1.9rem 0"
            ></InputCustom> */}
          </Col>
          <Col>
            <h4 className="heading-5 text-center ">{party2Name()}</h4>
            <InputCustom
              label="Tax And Deductions"
              type="number"
              handleChange={(event) =>
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  taxAmountParty2: convertCurrencyFormattingToText(
                    event.target.value
                  ),
                })
              }
              value={taxAndBenefits.taxAmountParty2}
              margin="1.9rem 0"
            ></InputCustom>{" "}
            {/* 
            <NumberFormat
              value={taxAndBenefits.taxAmountParty2}
              className="heading-5 my-4"
              inputMode="numeric"
              thousandSeparator={true}
              placeholder="Tax And Deductions"
              prefix={"$"}
              onChange={(event) => {
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  taxAmountParty2: convertCurrencyFormattingToText(
                    event.target.value
                  ),
                });
              }}
            /> */}
            <InputCustom
              label="Benefits and Credit"
              type="number"
              handleChange={(event) =>
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  benefitAmount2: event.target.value,
                })
              }
              value={taxAndBenefits.benefitAmount2}
              margin="1.9rem 0"
            ></InputCustom>
            <InputCustom
              label="Child Support"
              type="text"
              handleChange={(event) =>
                setTaxAndBenefits({
                  ...taxAndBenefits,
                  childSupportTable1: event.target.value,
                })
              }
              value={`${formatNumberInThousands(
                parseInt( taxAndBenefits.childSupportTable2) * 12
              )}`}
              margin="1.9rem 0"
            ></InputCustom>
         
          </Col>
        </Row>

        <button
          onClick={passStateToParentAndNextPage}
          className="text-white btn_primary_colored py-3 px-5 fw-bold d-flex ml-auto"
        >
          Next
        </button>
      </div>
    </Container>
  );
};

export default Screen3;

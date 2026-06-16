import React, { useState, useEffect } from "react";
import Navbar from "../../components/Dashboard/Navbar/Navbar";
import { getCurrentUserFromCookies } from "../../utils/helpers";
import FooterDash from "../../components/Dashboard/FooterDash/FooterDash";
import InputCustom from "../../components/InputCustom";
import { Alert, Snackbar, IconButton } from "@mui/material";
import { AiFillCloseSquare } from "react-icons/ai";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import AllRadioInputs from "./sections/AllRadioInputs";
import YearlyChecklistSectionA from "./sections/SectionA";
import YearlyChecklistSectionB from "./sections/SectionB";
import YearlyChecklistSectionC from "./sections/SectionC";
import YearlyChecklistSectionD from "./sections/SectionD";
import YearlyChecklistSectionE from "./sections/SectionE";

const YearlyChecklist = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const [formDataA, setFormDataA] = useState({
    reviewedTheStatusOfClients: "",
    closingLetterStatementAccount: "",
    outstandingPaymentToReceive: "",
    outstandingBalanceTrustAccount: [
      { client: "A", balance: 100 },
      { client: "B", balance: 200 },
      { client: "C", balance: 300 },
    ],
  });

  const [formDataB, setFormDataB] = useState({
    postedAllTimeEntry: "Yes",
    postedAllClientsExpenses: "Yes",
    issuedAllInvoicesToClients: "Yes",
    postedAllPaymentsReceived: "Yes",
    hasWriteOffDiscount: "Yes",
    receivedAllVendorBillsForYear: "Yes",
    postedAllVendorBillsOnQBO: "Yes",
  });

  const [formDataC, setFormDataC] = useState({});

  const [formData, setFormData] = useState({
    // reviewedTheStatusOfClients: "Yes",
    // closingLetterStatementAccount: "Yes",
    // outstandingPaymentToReceive: "Yes",

    // postedAllTimeEntry: "Yes",
    // postedAllClientsExpenses: "Yes",
    // issuedAllInvoicesToClients: "Yes",
    // postedAllPaymentsReceived: "Yes",
    // hasWriteOffDiscount: "Yes",
    // receivedAllVendorBillsForYear: "Yes",
    // postedAllVendorBillsOnQBO: "Yes",

    confirmCompositionOfBalance1: "Yes",
    confirmCompositionOfBalance1Reply: "",
    confirmCompositionOfBalance1Comment: "",
    confirmCompositionOfBalance2: "Yes",
    confirmCompositionOfBalance2Reply: "",
    confirmCompositionOfBalance2Comment: "",
    confirmCompositionOfMovement1: "Yes",
    confirmCompositionOfMovement1Comment: "",
    confirmCompositionOfMovement2: "Yes",
    confirmCompositionOfMovement2Comment: "",
    accuratelyReceivableAtDate: "Yes",
    confirmIfProvisionForBadDebts: "Yes",
    confirmAccuraterlyRecoverable: "Yes",
    confirmAccuraterlyRecorded: "Yes",
    otherCurrentAssets: "Yes",
    accountsPayable1: "Yes",
    otherLiabilitiesRecorded: "Yes",
    corporateTaxesAccuratelyRecorded: "Yes",
    HSTPayableRecorded: "Yes",
    PSTPayableRecorded: "Yes",
    bankLoansRecorded: "Yes",
    notesPayableRecorded: "Yes",
    shareCapitalRecorded: "Yes",
    dividendAccuratelyRecorded: "Yes",
    incomeSummaryRecorded: "Yes",
    incomeSummaryWriteOff: "Yes",
    disbursementIncomeRecorded: "Yes",
    discountsGivenRecorded: "Yes",
    referralFeesRecorded: "Yes",
    interestIncomeRecorded: "Yes",
    otherIncomeRecorded: "Yes",
    payrollSubsidyRecorded: "Yes",
    profitandLossTransAgree: "Yes",
    certificationOfAuthorisation: "Yes",
    lawyersAndParalegals: "Yes",
    haveComputedPST: "Yes",
  });

  const [modalData, setModalData] = useState({
    QBO: false,
    clio: false,
    custom: {
      show: false,
      body: "",
    },
  });

  const changeFormState = (label, value) => {
    return setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const changeModalToShow = (label) => {
    return setModalData((prev) => ({ ...prev, [label]: true }));
  };

  class ProfitLossGeneralExpense {
    constructor(expenseName, yearExpense, reviewNote) {
      this.expenseName = expenseName;
      this.yearExpense = yearExpense;
      this.reviewNote = reviewNote;
    }
  }

  const hideModalQBO = () => {
    return setModalData((prev) => ({ ...prev, QBO: false }));
  };

  const hideModalclio = () => {
    return setModalData((prev) => ({ ...prev, clio: false }));
  };

  const showAndHideQBONotification = () => {
    changeModalToShow("QBO");
    setTimeout(() => {
      hideModalQBO();
    }, 4000);
  };

  const showAndHideClioNotification = () => {
    changeModalToShow("clio");
    setTimeout(() => {
      hideModalclio();
    }, 4000);
  };

  const showCustomNotification = (body) => {
    setModalData((prev) => ({ ...prev, custom: { show: true, body } }));
    setTimeout(() => {
      setModalData((prev) => ({ ...prev, custom: { show: false, body: "" } }));
    }, 4000);
  };

  const [errorsA, setErrorsA] = useState({});
  const [errorsB, setErrorsB] = useState({});
  const [errorsC, setErrorsC] = useState({});
  const [errorsD, setErrorsD] = useState({});
  const [errorsE, setErrorsE] = useState({});

  const [activeStep, setActiveStep] = React.useState(0);

  const errorsForForms = (formNumber, errorsObj) => {
    switch (formNumber) {
      case 0:
        setErrorsA(errorsObj);
        break;
      case 1:
        setErrorsB(errorsObj);
        break;

      default:
        break;
    }
  };

  const checkIfArrNotEmpty = (obj, formNumber) => {
    const isFilled = Object.values(obj).every((e) => e !== "");

    if (!isFilled) {
      const notFilled = Object.keys(obj).filter((key) => obj[key] === "");

      console.log("not filled obj", obj, notFilled);

      const newObj = {};

      for (const key of Object.keys(obj)) {
        newObj[key] = false;
      }

      for (const key of notFilled) {
        newObj[key] = true;
      }

      errorsForForms(formNumber, newObj);
    }

    return isFilled;
  };

  const handleNext = (formNumber) => {
    switch (formNumber) {
      case 0:
        if (checkIfArrNotEmpty(formDataA, formNumber))
          incrementStep(formNumber);
        break;
      case 1:
        if (checkIfArrNotEmpty(formDataB, formNumber))
          incrementStep(formNumber);
        break;
      case 2:
        if (checkIfArrNotEmpty(formDataC, formNumber))
          incrementStep(formNumber);
        break;

      default:
        break;
    }
  };

  const incrementStep = (formNumber) => {
    switch (formNumber) {
      case 0:
        setErrorsA({});
        break;
      case 1:
        setErrorsB({});
        break;
      case 2:
        setErrorsC({});
        break;
      case 3:
        setErrorsD({});
        break;
      case 4:
        setErrorsE({});
        break;

      default:
        break;
    }

    // setErrors({})
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const [profitAndLossGeneralExp, setProfitAndLossGeneralExp] = useState([
    new ProfitLossGeneralExpense("Advertising and marketing expenses", "", ""),
    new ProfitLossGeneralExpense("Automobile Expense", "", ""),
    new ProfitLossGeneralExpense("Bad debts", "", ""),
    new ProfitLossGeneralExpense("Bank charges", "", ""),
    new ProfitLossGeneralExpense("Merchant Fees", "", ""),
    new ProfitLossGeneralExpense("Subcontractors", "", ""),
    new ProfitLossGeneralExpense("Donations", "", ""),
    new ProfitLossGeneralExpense("Dues and subscriptions", "", ""),
    new ProfitLossGeneralExpense("Software Subscriptions", "", ""),
    new ProfitLossGeneralExpense("Computer Equipment expense", "", ""),
    new ProfitLossGeneralExpense("Insurance", "", ""),
    new ProfitLossGeneralExpense("Interest expense", "", ""),
    new ProfitLossGeneralExpense("Continuing Legal Education", "", ""),
    new ProfitLossGeneralExpense("Law Society fees", "", ""),
    new ProfitLossGeneralExpense("Legal and professional fees", "", ""),
    new ProfitLossGeneralExpense("Membership fees", "", ""),
    new ProfitLossGeneralExpense("Referral Fees", "", ""),
    new ProfitLossGeneralExpense("Meals and entertainment", "", ""),
    new ProfitLossGeneralExpense("Agency fees", "", ""),
    new ProfitLossGeneralExpense("Court filing fees", "", ""),
    new ProfitLossGeneralExpense("IT Support fees", "", ""),
    new ProfitLossGeneralExpense("Licenses and Permits", "", ""),
    new ProfitLossGeneralExpense("Library/Research Charges", "", ""),
    new ProfitLossGeneralExpense("Office expenses", "", ""),
    new ProfitLossGeneralExpense(
      "Other general and administrative expenses",
      "",
      ""
    ),
    new ProfitLossGeneralExpense("Repair and maintenance", "", ""),
    new ProfitLossGeneralExpense("Stationery and printing", "", ""),
    new ProfitLossGeneralExpense("Commissions and fees", "", ""),
    new ProfitLossGeneralExpense("Disposal Fees", "", ""),
    new ProfitLossGeneralExpense("Non-Reimbursable Client Costs", "", ""),
    new ProfitLossGeneralExpense("Other expenses", "", ""),
  ]);

  const updateClioModal = (show) => {
    return (
      <Snackbar
        className="heading-5"
        variant={"filled"}
        color={"error"}
        onClose={() => setModalData((prev) => ({ ...prev, clio: false }))}
        open={modalData.clio}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={hideModalclio}
          >
            <AiFillCloseSquare fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={4000}
        message="Please update Clio"
      />
    );
  };

  const updateQBOModal = () => {
    return (
      <Snackbar
        className="heading-5"
        variant={"filled"}
        color={"error"}
        onClose={() =>
          setModalData((prev) => ({ ...prev, QBO: false, QBOReset: false }))
        }
        open={modalData.QBO}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={hideModalQBO}
          >
            <AiFillCloseSquare fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={4000}
        message="Please update Quickbooks"
      />
    );
  };

  const customModal = () => {
    return (
      <Snackbar
        className="heading-5"
        variant={"filled"}
        color={"error"}
        onClose={() =>
          setModalData((prev) => ({
            ...prev,
            custom: { show: false, body: "" },
          }))
        }
        open={modalData.custom.show}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() =>
              setModalData((prev) => ({
                ...prev,
                custom: { show: false, body: "" },
              }))
            }
          >
            <AiFillCloseSquare fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={4000}
        message={modalData.custom.body}
      />
    );
  };

  const steps = [
    {
      label: "Section A",
      comp: (
        <YearlyChecklistSectionA
          changeFormState={(label, value) =>
            setFormDataA((prev) => ({ ...prev, [label]: value }))
          }
          formData={formDataA}
          errors={errorsA}
        />
      ),
    },
    {
      label: "Section B",
      comp: (
        <YearlyChecklistSectionB
          changeFormState={(label, value) =>
            setFormDataB((prev) => ({ ...prev, [label]: value }))
          }
          formData={formDataB}
          errors={errorsB}
          setFormData={setFormDataB}
        />
      ),
    },
    {
      label: "Section C",
      comp: (
        <YearlyChecklistSectionC
          updateClioModal={updateClioModal}
          updateQBOModal={updateQBOModal}
          changeFormState={changeFormState}
          formData={formData}
          setFormData={setFormData}
          customModal={customModal}
          showCustomNotification={showCustomNotification}
          showAndHideClioNotification={showAndHideClioNotification}
          showAndHideQBONotification={showAndHideQBONotification}
          profitAndLossGeneralExp={profitAndLossGeneralExp}
        />
      ),
    },
    {
      label: "Section D",
      comp: (
        <YearlyChecklistSectionD
          changeFormState={changeFormState}
          formData={formData}
        />
      ),
    },
    {
      label: "Section E",
      comp: (
        <YearlyChecklistSectionE
          changeFormState={changeFormState}
          formData={formData}
        />
      ),
    },
  ];

  return (
    <div
      className="bg-light d-flex"
      style={{ minHeight: "100vh", maxHeight: "2000vh" }}
    >
      <Navbar setIsNavOpen={setIsNavOpen} />
      <page className="w-100">
        <div className="w-100 py-5 print">
          <div className="text-center py-5 " style={{ maxWidth: "60%" }}>
            <h1 className="heading-2">
              {getCurrentUserFromCookies().display_firmname}
            </h1>
            <p className="heading-normal fw-bold">
              <span className="text-primary-color">
                REVIEW CHECKLIST FOR THE FINANCIAL YEAR ENDED DECEMBER 31, 2020
              </span>{" "}
            </p>
          </div>

          <div
            className="bg-white align-self-center d-flex flex-column py-5 px-4 m-auto"
            style={{
              width: "85%",
              marginBottom: "2rem",
            }}
          >
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    className="cursor_pointer"
                    onClick={() => setActiveStep(index)}
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    {step.comp}
                    <Box sx={{ mb: 2 }}>
                      <div className="d-flex justify-content-end mt-4">
                        <button
                          className="btn_primary_colored py-3 px-4 mx-1"
                          onClick={() => handleNext(index)}
                        >
                          {index === steps.length - 1 ? "Finish" : "Next"}
                        </button>
                        <button
                          disabled={index === 0}
                          className={`btn_primary_empty border-dark py-3 mx-1 px-4 ${
                            index === 0 && "disabled"
                          }`}
                          onClick={handleBack}
                        >
                          Back
                        </button>
                      </div>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </div>
          <FooterDash />
        </div>
      </page>
    </div>
  );
};

export default YearlyChecklist;

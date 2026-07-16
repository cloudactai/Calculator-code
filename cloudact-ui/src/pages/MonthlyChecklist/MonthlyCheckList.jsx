import { Autocomplete, TextField } from "@mui/material";
import Cookies from "js-cookie";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import { Alert } from "react-bootstrap";
import { useHistory, useLocation } from "react-router";
import Navbar from "../../components/Dashboard/Navbar/Navbar";
import OnboardingSteps from "../../components/Setup/OnboardingSteps.jsx";
import SignOffButton from "../../components/Tasks/SignOffButton";
import axios from "../../utils/axios";
import reviewCheckList from "../../assets/images/reviewCheckList.svg";
import creditCardChecklist from "../../assets/images/creditCardChecklist.svg";
import generalAccountChecklist from "../../assets/images/generalAccountChecklist.svg";
import monthlyChecklistTrustDetailsById from "../../utils/Apis/monthlyChecklist/monthlyChecklistTrustDetailsById";
import monthlyChecklistGeneralById from "../../utils/Apis/monthlyChecklist/MonthlyChecklistGeneralById";
import { useDispatch, useSelector } from "react-redux";
import InfoHeader from "../../components/Dashboard/InfoHeader";
import { momentFunction } from "../../utils/moment";
import accountTasks from "../../assets/images/trustAc-2.svg";
import accountTasksDetails from "../../assets/images/accountTasks.svg";
import generalAccountDetails from "../../assets/images/generalAccountDetails.svg";
import otherDetails from "../../assets/images/otherDetails.svg";
import reportsDetails from "../../assets/images/reportsDetails.svg";
import cartReportDetails from "../../assets/images/cardReportDetails.svg";
import { removeNegSignAndWrapInBracketsWith2Fraction } from "../calculator/reports";
import {
  addUpNumbersFromArray,
  getAllUserInfo,
  getCurrentUserFromCookies,
  getUserId,
  getUserSID,
  isTaskSignedOffByPreparer,
  lastDateOfTheMonth,
  checkIfValueInArrayInEvery,
  checkIfValueInArrayInSome,
  formatDate,
} from "../../utils/helpers";
import { matterClientsAction } from "../../actions/matterActions";
import ModalInputCenter from "../../components/ModalInputCenter";
import {
  determineStartAndEndDatesOfATask,
  getMonthlyChecklistId,
  getMonthlyChecklistDetails,
  getMonthlyChecklistMonth,
  stepsInfo,
  stepsInfoForm1,
  stepsInfoForm2,
  stepsInfoForm3,
} from "./MonthlyChecklist";
import DatePicker from "react-date-picker";
import toast from "react-hot-toast";

import {
  formatNumberInThousands,
  formatNumber,
} from "../../utils/helpers/Formatting";

import { default as NumberFormat } from "react-number-format";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import Loader from "../../components/Loader";
import { getSvg } from "./checkListAssets/checklistAsset";
// PDF generation removed

const MonthlyCheckList = ({ activeFormProp, monthlyChecklistIDProp }) => {
  const intervalIdRef = useRef(null);
  const { userRole } = useSelector((state) => state.userChange);

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [monthlyChecklistID, setMonthlyChecklistID] = useState(
    monthlyChecklistIDProp || null
  );
  const [activeForm, setActiveForm] = useState(activeFormProp || 1);
  const [completedSteps, setCompletedSteps] = useState(1);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const [reportStatus, setReportStatus] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [trustAccountTableInfo, setTrustAccountTableInfo] = useState({
    clientTrustBalance: [],
    clientInactiveAccount: [],
    clientBalanceStatus: [],
    unClearedTransactionsPayment: [],
    clearedPayments: [],
    variance: 0,
    varianceComment: "",
    unClearedTransactionsReceipt: [],
    clearedReceipts: [],
    unidentifiedTrustFundsTable: [],
    detailsOfBankFeesProcessedInTrustAccount: [],
    detailsOfInterestOnTrustAccount: [],
    closingBalance: [],
    unClearedPaymentsDate: null,
    unClearedReceiptsDate: null,
    numberOfChequesGreaterThan2Months: null,
    loaded: false,
  });

  const [generalAccountTableInfo, setGeneralAccountTableInfo] = useState({
    clearedReceiptsGeneral: [],
    clearedPaymentsGeneral: [],
    unClearedReceipts: [],
    unClearedPayments: [],
    numberOfChequesGreaterThan2Months: [],
    variance: 0,
    varianceComment: "",
    closingBalanceCashback: "",
  });

  const [generalundepositFund, setGeneralundepositFund] = useState([]);

  console.log("generalAccountTableInfo", generalAccountTableInfo);

  const [activeHeight, setActiveHeight] = useState(null);
  const [downloadReportModal, setDownloadReportModal] = useState(false);
  const [readyToDisplayContent, setReadyToDisplayContent] = useState(false);
  const [loader, setLoader] = useState({
    form1: false,
  });

  let ref1 = useRef(null);
  let ref2 = useRef(null);
  let ref3 = useRef(null);
  let ref4 = useRef(null);
  let ref5 = useRef(null);
  let ref6 = useRef(null);
  let ref7 = useRef(null);
  let ref8 = useRef(null);
  let ref9 = useRef(null);
  let checklist_report = useRef(null);
  let report_btn = useRef(null);

  const dispatch = useDispatch();
  const matterClients = useSelector((state) => state.matterClients);

  const {
    loading,
    error,
    data: taxAndFinancialDetails,
  } = useSelector((state) => state.setupWizard.taxAndFinancialDetails);

  const { response } = useSelector((state) => state.userProfileInfo);

  const { data: matterClientList } = matterClients;

  const [dateMonth, setDateMonth] = useState("");
  const [taskStatus, setTaskStatus] = useState({
    ...getMonthlyChecklistDetails(),
    preparerSignOffError: "",
    approverSignOffError: "",
    dateBankReconciliation: "",
    batch_id: "",
    reportsError: "",
    reportDownloadStatus: "",
    reportsReadyForDownloading: false,
    reportsDownloadURL: "",
    showReportDownloadAlert: false,
  });

  console.log("taskStatus", taskStatus);

  console.log("history.location.state", history.location.state.task_preparer);

  const [trustAccountNames, setTrustAccountNames] = useState([
    { name: taskStatus.task_account, account_id: 1 },
  ]);
  const [generalAccountNames, setGeneralAccountNames] = useState([
    { name: taskStatus.task_account, account_id: 2 },
  ]);
  const [creditAccountNames, setCreditAccountNames] = useState([
    { name: taskStatus.task_account, account_id: 3 },
  ]);

  const [form1Data, setForm1Data] = useState({
    ...trustAccountTableInfo,
    options: {
      subForm1: {
        receivedTrustBankStatements: "",
        savedTrustBankStatements: "",
        postedTransactions: "",
        confirmReconciliation: "",
      },
      subForm2: {
        confirmInternalMatter: "",
        AreTrustFundsInvestedInBills: "",
        // allSourceDocumentsAvailable: "",
        // sequentiallyNumberedCheques: "",
        // Form9A: "",
        // BackupsForClientApprovalsInternal: "",
        // CancelledAndVoidedCheques: "",
        // AllChequesSignedAuthorised: "",
        // closedAnyTrustAccount: "",
        // HaveYouOpenedAnyTrustAccount: "",
        FiledTheForm3: "Not Applicable",
        HaveYouFiledTheForm2: "Not Applicable",
        unClearedPaymentQues1: "",
        unClearedPaymentQues2: "",
      },
      subForm3: {
        sequentiallyNumberedCheques: "",
        Form9A: "",
        BackupsForClientApprovalsInternal: "",
        CancelledAndVoidedCheques: "",
        closedAnyTrustAccount: "",
        HaveYouOpenedAnyTrustAccount: "",
      },
    },
    commentsOpen: false,
    comments: {
      comment1: "",
      comment2: "",
      comment3: "",
      comment4: "",
      endingBalance: 0,
    },
    fillAllDetails: false,
    trustAccountNames,
    matterClientName: [],
    matterOwnerConfirmed: false,
    detailsOverdrawnClient: [],
    totalAmountDetailsOverdrawnClient: 0,
    unidentifiedTrustFunds: 0,
    detailsOfBankFeesValue: 0,
    detailsOnTrustAccountValue: 0,
    interestTrustAccountValue: 0,
    unClearedTransactionsPayment: [],
    unClearedTransactionsReceipt: [],
    clearedReceipts: [],
    clearedPayments: [],
    noAndDetailsOfInactiveClient: [
      {
        Client: "A",
        Matter: 3801.23,
        DateOfLastActivity: "Feb-21",
        Balance: 100.0,
        id: 1,
      },
      {
        Client: "B",
        Matter: 1324.421,
        DateOfLastActivity: "Jan-21",
        Balance: 50.0,
        id: 2,
      },
    ],
    detailsOfBankFeesProcessedInTrustAccount: [],
    detailsOfInterestOnTrustAccount: [],
    detailsWithClientStatusClosed: [
      {
        Client: "A",
        Matter: "3801.23",
        Status: "Closed",
        Balance: 100.0,
        id: 1,
      },
    ],
    trustBalanceOfAccount: [],
    account_id: "",
  });

  const account_id = useRef("");
  const account_name = useRef("");
  const account_fromdate = useRef("");
  const account_todate = useRef("");

  const [form2Data, setForm2Data] = useState({
    ...generalAccountTableInfo,
    generalAccountNames,
    options: {
      subForm1: {
        operatingStatements: "",
        savedOperatingStatements: "",
        postedAllTransactions: "",
        postedAllMatter: "",
        bankReconciliationCompleted: "",
      },
      subForm2: {
        SequentiallyNumberedCheques: "",
        vendorInvoices: "",
        CancelledVoidedCheques: "",
        allSupportingDocumentation: "",
        BackupsForInternalApprovals: "",
        BillsForServiceFees: "",
        allGeneralChequesSigned: "",
        madeAllVendorPayments: "",
        outStandingMorethen2ques1: "",
        outStandingMorethen2ques2: "",
      },
    },
    comments: {},
    commentsOpen: false,
    fillAllDetails: false,
  });
  const [form3Data, setForm3Data] = useState({
    options: {
      subForm1: {
        receivedCreditCard: "",
        creditCardStatementsSaved: "",
        confirmBankReconciliationcompleted: "",
      },
      subForm2: {
        postedAllTransactionsCredit: "",
      },
      // receivedCreditCard: "",
      // creditCardStatementsSaved: "",
      // postedAllTransactionsCredit: "",
      // confirmBankReconciliationcompleted: "",
    },
    fillAllDetails: false,
    comments: {
      endingBalance: 0,
    },
    commentsOpen: false,
  });
  const [form4Data, setForm4Data] = useState({});
  const [form5Data, setForm5Data] = useState({});
  const [form6Data, setForm6Data] = useState({
    taxFilingDetails: [
      // {
      //   type: "PST Returns",
      //   filingFrequency: "Monthly",
      //   reportingPeriod: "April, 30 2021",
      //   filingDeadline: "May 31, 2021",
      //   paymentDeadline: "May 31, 2021",
      // },
      // {
      //   type: "GST/HST returns",
      //   filingFrequency: "Monthly",
      //   reportingPeriod: "April, 30 2021",
      //   paymentDeadline: "May 31, 2021",
      //   filingDeadline: "May 20, 2021",
      // },
      // {
      //   type: "Tax returns",
      //   filingFrequency: "Annually",
      //   reportingPeriod: "January 1, 2020 to December 30, 2020",
      //   filingDeadline: "June 30, 2021",
      //   paymentDeadline: "June 30, 2021",
      // },
    ],
  });
  console.log("form6DataDetails", form6Data);

  const [form7Data, setForm7Data] = useState({
    preparerDropdownList: [],
    preparerCurrentValue: "",
  });

  const [signOffinfo, setSignOffInfo] = useState({
    preparer: 0,
    approver: 0,
  });

  console.log("signOffinfoDD", signOffinfo);

  useEffect(() => {
    intervalIdRef.current = setInterval(() => {
      checkReportStatus();
    }, 3000);

    return () => {
      clearInterval(intervalIdRef.current); // Clear the interval on component unmount
    };
  }, [reportStatus, taskStatus.batch_id]);

  const isLeapYear = function (year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getDaysInMonth = function (year, month) {
    return [
      31,
      isLeapYear(year) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ][month];
  };

  useEffect(() => {
    if (taxAndFinancialDetails) {
      console.log("taxAndFinancialDetailsFGJKH", taxAndFinancialDetails);
      const taxFilingDetails = [];
      const currentUserProvince = getCurrentUserFromCookies().province;
      Object.entries(taxAndFinancialDetails).forEach((entry) => {
        if (entry[1] && entry[0] == "HST") {
          let TaxReturnMonth = momentFunction.addMonths(
            taxAndFinancialDetails.financialYearEnd.split("-")[1],
            "31",
            6
          );
          let dateStr = taxAndFinancialDetails.financialYearEnd;

          const [day, monthStr] = dateStr.split("-");

          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];

          const monthIndex = monthNames.findIndex((name) =>
            name.toLowerCase().startsWith(monthStr.toLowerCase())
          );

          const fullMonthName = monthNames[monthIndex];

          if (entry[1] == "Monthly") {
            const dateTime = new Date(dateMonth);
            const newFilingDateMonth = new Date(
              dateTime.setMonth(dateTime.getMonth() + 1)
            );

            newFilingDateMonth.setDate(
              getDaysInMonth(
                newFilingDateMonth.getFullYear(),
                newFilingDateMonth.getMonth()
              )
            );
            const newReportingPeriodDateMonth = new Date(dateMonth).setDate(
              getDaysInMonth(
                new Date(dateMonth).getFullYear(),
                new Date(dateMonth).getMonth()
              )
            );
            switch (entry[0]) {
              case "HST":
                taxFilingDetails.push({
                  type: "HST/GST returns",
                  filingFrequency: entry[1],
                  reportingPeriod: moment(newReportingPeriodDateMonth).format(
                    "DD-MMM-YYYY"
                  ),
                  filingDeadline:
                    moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                  paymentDeadline:
                    moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                });
                break;
            }

            if (dateMonth.split(" ")[0] == fullMonthName) {
              const currentYear = new Date().getFullYear();
              taxFilingDetails.push({
                type: "Tax returns",
                filingFrequency: "Annually",
                reportingPeriod: `31-${
                  taxAndFinancialDetails.financialYearEnd.split("-")[1]
                }-${currentYear}`,
                filingDeadline: `30-${TaxReturnMonth}-${currentYear}`,
                paymentDeadline: `30-${TaxReturnMonth}-${currentYear}`,
              });
            }
          } else if (entry[1] == "Quarterly") {
            if (
              [...taxAndFinancialDetails.months].includes(
                dateMonth.split(" ")[0]
              )
            ) {
              const dateTime = new Date(dateMonth);
              const newFilingDateMonth = new Date(
                dateTime.setMonth(dateTime.getMonth() + 1)
              );
              newFilingDateMonth.setDate(
                getDaysInMonth(
                  newFilingDateMonth.getFullYear(),
                  newFilingDateMonth.getMonth()
                )
              );
              const newReportingPeriodDateMonth = new Date(dateMonth).setDate(
                getDaysInMonth(
                  new Date(dateMonth).getFullYear(),
                  new Date(dateMonth).getMonth()
                )
              );
              switch (entry[0]) {
                case "HST":
                  taxFilingDetails.push({
                    type: "HST/GST returns",
                    filingFrequency: entry[1],
                    reportingPeriod: moment(newReportingPeriodDateMonth).format(
                      "DD-MMM-YYYY"
                    ),
                    filingDeadline:
                      moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                    paymentDeadline:
                      moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                  });
                  break;
              }
            }

            if (dateMonth.split(" ")[0] == fullMonthName) {
              const currentYear = new Date().getFullYear();
              taxFilingDetails.push({
                type: "Tax returns",
                filingFrequency: "Annually",
                reportingPeriod: `31-${
                  taxAndFinancialDetails.financialYearEnd.split("-")[1]
                }-${currentYear}`,
                filingDeadline: `30-${TaxReturnMonth}-${currentYear}`,
                paymentDeadline: `30-${TaxReturnMonth}-${currentYear}`,
              });
            }
          } else if (entry[1] == "Yearly") {
            if (
              [...taxAndFinancialDetails.months].includes(
                dateMonth.split(" ")[0]
              )
            ) {
              const dateTime = new Date(dateMonth);
              const newFilingDateMonth = new Date(
                dateTime.setMonth(dateTime.getMonth() + 3)
              );
              newFilingDateMonth.setDate(
                getDaysInMonth(
                  newFilingDateMonth.getFullYear(),
                  newFilingDateMonth.getMonth()
                )
              );
              const newReportingPeriodDateMonth = new Date(dateMonth).setDate(
                getDaysInMonth(
                  new Date(dateMonth).getFullYear(),
                  new Date(dateMonth).getMonth()
                )
              );
              switch (entry[0]) {
                case "HST":
                  taxFilingDetails.push({
                    type: "HST/GST returns",
                    filingFrequency: entry[1],
                    reportingPeriod: moment(newReportingPeriodDateMonth).format(
                      "DD-MMM-YYYY"
                    ),
                    filingDeadline:
                      moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                    paymentDeadline:
                      moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                  });
                  break;
              }
            }
            if (dateMonth.split(" ")[0] == fullMonthName) {
              const currentYear = new Date().getFullYear();
              taxFilingDetails.push({
                type: "Tax returns",
                filingFrequency: "Annually",
                reportingPeriod: `31-${
                  taxAndFinancialDetails.financialYearEnd.split("-")[1]
                }-${currentYear}`,
                filingDeadline: `30-${TaxReturnMonth}-${currentYear}`,
                paymentDeadline: `30-${TaxReturnMonth}-${currentYear}`,
              });
            }
          }
        }

        if (currentUserProvince === "BC") {
          if (entry[1]) {
            if (entry[1] == "Monthly") {
              const dateTime = new Date(dateMonth);
              const newFilingDateMonth = new Date(
                dateTime.setMonth(dateTime.getMonth() + 1)
              );
              newFilingDateMonth.setDate(
                getDaysInMonth(
                  newFilingDateMonth.getFullYear(),
                  newFilingDateMonth.getMonth()
                )
              );
              const newReportingPeriodDateMonth = new Date(dateMonth).setDate(
                getDaysInMonth(
                  new Date(dateMonth).getFullYear(),
                  new Date(dateMonth).getMonth()
                )
              );
              switch (entry[0]) {
                case "PST":
                  taxFilingDetails.push({
                    type: "PST returns",
                    filingFrequency: entry[1],
                    reportingPeriod: moment(newReportingPeriodDateMonth).format(
                      "DD-MMM-YYYY"
                    ),
                    filingDeadline:
                      moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                    paymentDeadline:
                      moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                  });
                  break;
              }
            } else if (entry[1] == "Quarterly") {
              if (
                [...taxAndFinancialDetails.PSTmonths].includes(
                  dateMonth.split(" ")[0]
                )
              ) {
                const dateTime = new Date(dateMonth);
                const newFilingDateMonth = new Date(
                  dateTime.setMonth(dateTime.getMonth() + 1)
                );
                newFilingDateMonth.setDate(
                  getDaysInMonth(
                    newFilingDateMonth.getFullYear(),
                    newFilingDateMonth.getMonth()
                  )
                );
                const newReportingPeriodDateMonth = new Date(dateMonth).setDate(
                  getDaysInMonth(
                    new Date(dateMonth).getFullYear(),
                    new Date(dateMonth).getMonth()
                  )
                );
                switch (entry[0]) {
                  case "PST":
                    taxFilingDetails.push({
                      type: "PST returns",
                      filingFrequency: entry[1],
                      reportingPeriod: moment(
                        newReportingPeriodDateMonth
                      ).format("DD-MMM-YYYY"),
                      filingDeadline:
                        moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                      paymentDeadline:
                        moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                    });
                    break;
                }
              }
            } else if (entry[1] == "Yearly") {
              if (
                [...taxAndFinancialDetails.PSTmonths].includes(
                  dateMonth.split(" ")[0]
                )
              ) {
                const dateTime = new Date(dateMonth);
                const newFilingDateMonth = new Date(
                  dateTime.setMonth(dateTime.getMonth() + 1)
                );
                newFilingDateMonth.setDate(
                  getDaysInMonth(
                    newFilingDateMonth.getFullYear(),
                    newFilingDateMonth.getMonth()
                  )
                );
                const newReportingPeriodDateMonth = new Date(dateMonth).setDate(
                  getDaysInMonth(
                    new Date(dateMonth).getFullYear(),
                    new Date(dateMonth).getMonth()
                  )
                );
                switch (entry[0]) {
                  case "PST":
                    taxFilingDetails.push({
                      type: "PST returns",
                      filingFrequency: entry[1],
                      reportingPeriod: moment(
                        newReportingPeriodDateMonth
                      ).format("DD-MMM-YYYY"),
                      filingDeadline:
                        moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                      paymentDeadline:
                        moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                    });
                    break;
                }
              }
            } else if (entry[1] == "Semi-annual") {
              if (
                [...taxAndFinancialDetails.PSTmonths].includes(
                  dateMonth.split(" ")[0]
                )
              ) {
                const dateTime = new Date(dateMonth);
                const newFilingDateMonth = new Date(
                  dateTime.setMonth(dateTime.getMonth() + 1)
                );
                newFilingDateMonth.setDate(
                  getDaysInMonth(
                    newFilingDateMonth.getFullYear(),
                    newFilingDateMonth.getMonth()
                  )
                );
                const newReportingPeriodDateMonth = new Date(dateMonth).setDate(
                  getDaysInMonth(
                    new Date(dateMonth).getFullYear(),
                    new Date(dateMonth).getMonth()
                  )
                );
                switch (entry[0]) {
                  case "PST":
                    taxFilingDetails.push({
                      type: "PST returns",
                      filingFrequency: entry[1],
                      reportingPeriod: moment(
                        newReportingPeriodDateMonth
                      ).format("DD-MMM-YYYY"),
                      filingDeadline:
                        moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                      paymentDeadline:
                        moment(newFilingDateMonth).format("DD-MMM-YYYY"),
                    });
                    break;
                }
              }
            }
          }
        }
      });
      setForm6Data({
        ...form6Data,
        taxFilingDetails,
      });

      console.log("taxFilingDetailsAAAA", taxFilingDetails);
    }
  }, [taxAndFinancialDetails, dateMonth]);

  useEffect(() => {
    if (!monthlyChecklistID && !Cookies.get("checklistId")) {
      Cookies.set("checklistId", {
        id: parseInt(history.location.state.id),
        month: history.location.state.month,
        task_status: history.location.state.task_status,
      });
      setMonthlyChecklistID(
        history.location.state.id ? parseInt(history.location.state.id) : null
      );

      setDateMonth(
        history.location.state.month
          ? JSON.parse(history.location.state.month)
          : getMonthlyChecklistMonth()
      );
    } else {
      setMonthlyChecklistID(JSON.parse(Cookies.get("checklistId")).id);
      setDateMonth(getMonthlyChecklistMonth());
    }
  }, []);

  useEffect(() => {
    const redirectToStep = () => {
      const step = new URLSearchParams(location.search).get("step");

      if (step) {
        setActiveForm(parseInt(step));
      }
      setActiveHeight(determineWhichHeight());
    };
    redirectToStep();
  }, [
    completedSteps,
    trustAccountTableInfo,
    generalAccountTableInfo,
    activeStep,
    creditAccountNames,
    generalAccountNames,
    trustAccountNames,
    activeForm,
    form2Data,
    form1Data,
  ]);

  useEffect(() => {
    const step = new URLSearchParams(location.search).get("step");
    console.log("step0", step);

    if (taskStatus.task_approverer_signoff) setIsFormDisabled(true);

    if (parseInt(step) === 1) {
      setLoader((prev) => ({
        ...prev,
        form1: true,
      }));

      monthlyChecklistTrustDetailsById(getMonthlyChecklistId())
        .then((body) => {
          console.log("CheckPrevData", body);

          account_id.current = body?.account_id;
          account_name.current = body?.task_type_account;
          account_fromdate.current = body?.task_from;
          account_todate.current = body?.task_to;

          if (body?.task_preparer_signoff) {
            setSignOffInfo((prev) => ({
              ...prev,
              preparer: body.task_preparer_signoff,
              approver: body.task_approverer_signoff,
            }));
          }

          if (body?.task_to && body?.task_from) {
            if (!isFormDisabled) {
              //a.5.2
              const clientTrustBalance = axios.get(
                `${getUserSID()}/client/trust/balance/${
                  account_todate.current
                }/${account_fromdate.current}/${account_name.current}`
              );
              dispatch(matterClientsAction());
              //a.5.3
              const clientInactiveAccount = axios.get(
                `/${getUserSID()}/inactive/accounts/${
                  account_fromdate.current
                }/${account_name.current}`
              );

              //a.5.4
              const clientBalanceStatus = axios.get(
                `/${getUserSID()}/closed/accounts/${account_name.current}`
              );

              const allRequests = [
                clientTrustBalance,
                clientInactiveAccount,
                clientBalanceStatus,
              ];

              Promise.all(allRequests)
                .then(([...res]) => {
                  console.log("check Respose Apidfgsth", [...res]);

                  setTrustAccountTableInfo((prev) => ({
                    ...prev,
                    clientTrustBalance: res[0]?.data?.data?.body,
                    clientInactiveAccount: res[1]?.data?.data?.body,
                    clientBalanceStatus: res[2]?.data?.data?.body,
                  }));

                  setReadyToDisplayContent(true);
                })
                .catch((err) => {
                  console.log("err of some requests", err);
                });
            }

            if (!isFormDisabled) {
              // a.5.1
              const unClearedTransactionsPayment = axios.post(
                `uncleared/payments/${getUserSID()}/${
                  account_fromdate.current
                }`,
                {
                  account_name: account_name.current,
                }
              );

              //a.5.1
              const clearedPayments = axios.get(
                `/cleared/transactions/payments/${getUserSID()}/${
                  account_todate.current
                }/${account_fromdate.current}/${account_name.current}`
              );

              //a.5.1
              const unClearedTransactionsReceipt = axios.post(
                `uncleared/receipts/${getUserSID()}/${account_todate.current}`,
                {
                  account_name: account_name.current,
                }
              );

              //shortfirmname
              const clearedReceipts = axios.get(
                `/cleared/transactions/receipts/${getUserSID()}/${
                  account_fromdate.current
                }/${account_todate.current}/Undeposited Funds`
              );

              const unidentifiedTrustFunds = axios.get(
                `/${getUserSID()}/client/unidentified/trust/funds/${
                  account_todate.current
                }`
              );

              const feeDetails = axios.get(
                `/${getUserSID()}/client/feedetails/trust/account/${
                  account_fromdate.current
                }/${account_todate.current}`
              );

              const interestOnTrustAccount = axios.get(
                `/${getUserSID()}/client/interestdetails/trust/account/${
                  account_fromdate.current
                }/${account_todate.current}`
              );

              const closingBalanceCashback = axios.post(
                `/cashback/balance/${account_todate.current}/${getUserSID()}`,
                {
                  account_name: account_name.current,
                }
              );

              const closingBalanceTrustLiability = axios.post(
                `balancesheet/${getUserSID()}/${account_fromdate.current}/${
                  account_todate.current
                }`,
                {
                  account: taskStatus.task_type_account,
                }
              );

              const closingBalanceTrustLedger = axios.post(
                `/trustledger/balance/${
                  account_todate.current
                }/${getUserSID()}`,
                {
                  account_name: account_name.current,
                }
              );

              const unClearedPaymentsDate = axios.post(
                `uncleared/payments/dates/${getUserSID()}/${
                  account_todate.current
                }`,
                {
                  account_name: account_name.current,
                }
              );

              const unClearedReceiptsDate = axios.post(
                `uncleared/receipts/dates/${getUserSID()}/${
                  account_todate.current
                }`,
                {
                  account_name: account_name.current,
                }
              );

              const numberOfChequesGreaterThan2Months = axios.post(
                `uncleared/cheques/dates/${getUserSID()}/${
                  account_todate.current
                }`,
                {
                  account_name: body?.task_type_account,
                }
              );

              const allRequests = [
                // clientTrustBalance,
                // clientInactiveAccount,
                // clientBalanceStatus,
                unClearedTransactionsPayment,
                clearedPayments,
                unClearedTransactionsReceipt,
                clearedReceipts,
                unidentifiedTrustFunds,
                feeDetails,
                interestOnTrustAccount,
                closingBalanceCashback,
                closingBalanceTrustLiability,
                closingBalanceTrustLedger,
                unClearedPaymentsDate,
                unClearedReceiptsDate,
                numberOfChequesGreaterThan2Months,
              ];

              console.log("checkResAllreq", allRequests);

              Promise.all(allRequests)
                .then(([...res]) => {
                  // toast('inn progress')

                  // console.log("check Respose Apidfgsth",[...res])
                  console.log("check Respose bla bla", [...res]);

                  // console.log("res[9]",res[9]?.data?.data?.body)

                  setTrustAccountTableInfo((prev) => ({
                    ...prev,
                    unClearedTransactionsPayment: res[0]?.data?.data.body,
                    clearedPayments: res[1]?.data?.data.body,
                    unClearedTransactionsReceipt: res[2]?.data?.data.body,
                    clearedReceipts: res[3]?.data?.data.body,
                    unidentifiedTrustFundsTable: res[4]?.data?.data.body,
                    detailsOfBankFeesProcessedInTrustAccount:
                      res[5]?.data?.data.body,
                    detailsOfInterestOnTrustAccount: res[6]?.data?.data.body,
                    // closed balance
                    closingBalance: [
                      parseFloat(res[7]?.data?.data?.body[0]["amount"]) || 0,
                      // parseFloat(res[8]?.data?.data?.body?.liability) || 0,
                      parseFloat(res[9]?.data?.data?.body[0]["amount"] || 0),
                    ],
                    unClearedPaymentsDate: Object.values(
                      res[10]?.data?.data?.body[0]
                    ).every((x) => x !== null)
                      ? res[10]?.data?.data?.body
                      : null,
                    unClearedReceiptsDate: Object.values(
                      res[11]?.data?.data?.body[0]
                    ).every((x) => x !== null)
                      ? res[11]?.data?.data?.body
                      : null,
                    numberOfChequesGreaterThan2Months: Object.values(
                      res[12]?.data?.data?.body[0]
                    ).every((x) => x !== null)
                      ? res[12]?.data?.data?.body
                      : null,
                    loaded: true,
                  }));
                })
                .catch((err) => {
                  toast.error("internal server error");

                  console.log("err of some requests", err);
                });
            }
          } else {
            toast.error("Error getting from and to date from server");
          }

          if (
            body.trust_account &&
            Object.keys(JSON.parse(body.trust_account)).length !== 0
          ) {
            // alert("its on alrrt if")
            const formData1 = JSON.parse(body.trust_account);
            const formData3 = JSON.parse(body.reports);

            setForm1Data({
              ...formData1,
              options: {
                ...formData1.options,
                subForm2: {
                  ...form1Data.options.subForm2,
                  ...formData1.options.subForm2,
                },
                subForm3: {
                  ...form1Data.options.subForm3,
                  ...formData1.options.subForm3,
                },
              },
            });
            setTaskStatus({ ...taskStatus, ...formData3 });
          }
        })
        .catch((err) => {
          console.log("err", err);
        })
        .finally(() => {
          setLoader((prev) => ({
            ...prev,
            form1: false,
          }));
        });
    } else if (parseInt(step) === 2) {
      setLoader((prev) => ({
        ...prev,
        form1: true,
      }));

      monthlyChecklistGeneralById(getMonthlyChecklistId())
        .then((body) => {
          console.log("checkAccoutsjg", body);

          account_name.current = body?.task_type_account;
          account_fromdate.current = body?.task_from;
          account_todate.current = body?.task_to;

          if (body?.task_preparer_signoff) {
            setSignOffInfo((prev) => ({
              ...prev,
              preparer: body.task_preparer_signoff,
              approver: body.task_approverer_signoff,
            }));
          }

          if (body.task_type_account !== null) {
            if (!isFormDisabled) {
              const unClearedReceipts = axios.post(
                `uncleared/receipts/${getUserSID()}/${account_todate.current}`,
                {
                  account_name: body.task_type_account,
                }
              );

              const unClearedPayments = axios.post(
                `/uncleared/payments/${getUserSID()}/${account_todate.current}`,
                {
                  account_name: body.task_type_account,
                }
              );

              const numberOfChequesGreaterThan2Months = axios.post(
                `uncleared/cheques/dates/${getUserSID()}/${
                  account_todate.current
                }`,
                {
                  account_name: body?.task_type_account,
                }
              );
              const closingBalanceCashback = axios.post(
                `/cashback/balance/${account_todate.current}/${getUserSID()}`,
                {
                  account_name: account_name.current,
                }
              );

              const closingCashbookBalance = axios.post(
                `/cashbookbalance/${getUserSID()}/${account_fromdate.current}/${
                  account_todate.current
                }`,
                {
                  type: generalAccountNames[0]?.name,
                }
              );

              const closingBalanceGeneralLiability = axios.post(
                `balancesheet/${getUserSID()}/${account_fromdate.current}/${
                  account_todate.current
                }`,
                {
                  account: taskStatus?.task_type_account,
                }
              );

              axios
                .post(
                  `/undepositfunds/${getUserSID()}/${
                    account_fromdate.current
                  }/${account_todate.current}`,
                  {
                    account: taskStatus?.task_type_account,
                  }
                )
                .then((res) => {
                  setGeneralundepositFund(res?.data?.data?.body);
                });

              const allRequests = [
                unClearedReceipts,
                unClearedPayments,
                numberOfChequesGreaterThan2Months,
                closingBalanceCashback,
                closingCashbookBalance,
                closingBalanceGeneralLiability,
              ];

              Promise.all(allRequests)
                .then(([...res]) => {
                  console.log("res of some requests in genral", res);

                  setGeneralAccountTableInfo({
                    ...generalAccountTableInfo,
                    unClearedReceipts: res[0]?.data.data.body,
                    unClearedPayments: res[1]?.data.data.body,
                    numberOfChequesGreaterThan2Months: res[2]?.data.data.body,
                    closingBalanceCashback:
                      res[5]?.data?.data?.body?.general || 0,
                  });

                  setReadyToDisplayContent(true);
                })
                .catch((err) => {
                  console.log("err of some requests in genral", err);
                });
            }
          }

          if (body.general_account !== null) {
            const formData2 = JSON.parse(body.general_account);
            const formData5 = JSON.parse(body.reports);

            if (!isFormDisabled) {
              const unClearedReceipts = axios.post(
                `uncleared/receipts/${getUserSID()}/${account_todate.current}`,
                {
                  account_name: body.task_type_account,
                }
              );
              const unClearedPayments = axios.post(
                `/uncleared/payments/${getUserSID()}/${account_todate.current}`,
                {
                  account_name: body.task_type_account,
                }
              );

              const numberOfChequesGreaterThan2Months = axios.post(
                `uncleared/cheques/dates/${getUserSID()}/${
                  account_todate.current
                }`,
                {
                  account_name: body?.task_type_account,
                }
              );

              const closingBalanceCashback = axios.post(
                `/cashback/balance/${account_todate.current}/${getUserSID()}`,
                {
                  account_name: account_name.current,
                }
              );

              const closingCashbookBalance = axios.post(
                `/cashbookbalance/${getUserSID()}/${account_fromdate.current}/${
                  account_todate.current
                }`,
                {
                  type: generalAccountNames[0]?.name,
                }
              );

              const closingBalanceGeneralLiability = axios.post(
                `balancesheet/${getUserSID()}/${account_fromdate.current}/${
                  account_todate.current
                }`,
                {
                  account: taskStatus?.task_type_account,
                }
              );

              axios
                .post(
                  `/undepositfunds/${getUserSID()}/${
                    account_fromdate.current
                  }/${account_todate.current}`,
                  {
                    account: taskStatus?.task_type_account,
                  }
                )
                .then((res) => {
                  setGeneralundepositFund(res?.data?.data?.body);
                });

              const allRequests = [
                unClearedReceipts,
                unClearedPayments,
                numberOfChequesGreaterThan2Months,
                closingBalanceCashback,
                closingCashbookBalance,
                closingBalanceGeneralLiability,
              ];

              Promise.all(allRequests)
                .then(([...res]) => {
                  console.log("res of some requests in genral", res);

                  setGeneralAccountTableInfo({
                    ...generalAccountTableInfo,
                    unClearedReceipts: res[0]?.data?.data?.body,
                    unClearedPayments: res[1]?.data?.data?.body,
                    numberOfChequesGreaterThan2Months: res[2]?.data?.data?.body,
                    closingBalanceCashback:
                      res[5]?.data?.data?.body?.general || 0,
                  });

                  setReadyToDisplayContent(true);
                })
                .catch((err) => {
                  console.log("err of some requests in genral", err);
                });
            }

            setTaskStatus({ ...taskStatus, ...formData5 });
            setForm2Data(formData2);
          }
        })
        .catch((err) => {
          console.log("err", err);
        })
        .finally(() => {
          setLoader((prev) => ({
            ...prev,
            form1: false,
          }));
        });
    } else if (parseInt(step) === 3) {
      axios
        .get(`/card/${getMonthlyChecklistId()}`)
        .then((res) => {
          const {
            data: {
              data: { body },
            },
          } = res;

          console.log("cardDettt", body);

          if (body !== null) {
            account_name.current = body?.task_type_account;
            account_fromdate.current = body?.task_from;
            account_todate.current = body?.task_to;

            if (body?.task_preparer_signoff) {
              setSignOffInfo((prev) => ({
                ...prev,
                preparer: body.task_preparer_signoff,
                approver: body.task_approverer_signoff,
              }));
            }

            const formData3 = JSON.parse(body.credit_cards);
            const formData5 = JSON.parse(body.reports);
            setForm3Data({
              ...formData3,
              options: {
                subForm1: {
                  ...form3Data.options?.subForm1,
                  ...formData3.options?.subForm1,
                },
                subForm2: {
                  ...form3Data.options?.subForm2,
                  ...formData3.options?.subForm2,
                },
              },
            });
            setTaskStatus({ ...taskStatus, ...formData5 });

            setReadyToDisplayContent(true);
          }
        })
        .catch((err) => {
          console.log("err", err);
        });
    }
  }, [history]);

  const checkIfFilledForm2 = async (e) => {
    e.preventDefault();

    setForm1Data({ ...form1Data, fillAllDetails: false });

    const obj = {
      ...form1Data,
      fillAllDetails: false,
      ...trustAccountTableInfo,
      trustAccountNames,
    };

    postForTrustObj(obj);
  };

  const checkIfFilledForm3 = async (e) => {
    e.preventDefault();
    const lengthOfValues = Object.values(form1Data.options.subForm2);

    let valuesAreEmptyForSome = checkIfValueInArrayInSome(lengthOfValues, "");
    if (valuesAreEmptyForSome) {
      setForm1Data({ ...form1Data, fillAllDetails: true });
    } else {
      setForm1Data({ ...form1Data, fillAllDetails: false });

      const obj = {
        ...form1Data,
        fillAllDetails: false,
        ...trustAccountTableInfo,
        trustAccountNames,
      };

      postForTrustObj(obj);
    }
  };

  const checkIfFilledForm4 = async (e) => {
    e.preventDefault();
    const lengthOfValues = Object.values(form1Data.options.subForm3);

    let valuesAreEmptyForSome = checkIfValueInArrayInSome(lengthOfValues, "");

    if (valuesAreEmptyForSome) {
      setForm1Data({ ...form1Data, fillAllDetails: true });
    } else {
      setForm1Data({ ...form1Data, fillAllDetails: false });

      const obj = {
        ...form1Data,
        fillAllDetails: false,
        ...trustAccountTableInfo,
        trustAccountNames,
      };

      postForTrustObj(obj);
    }
  };

  const determineWhichHeight = () => {
    switch (activeStep) {
      case 1:
        return ref1.scrollHeight;

      case 2:
        return ref2.scrollHeight;

      case 3:
        return ref3.scrollHeight;

      case 4:
        return ref4.scrollHeight;

      case 5:
        return ref5.scrollHeight;

      case 6:
        return ref6.scrollHeight;

      case 7:
        return ref7.scrollHeight;

      case 8:
        return ref8.scrollHeight;

      case 9:
        return ref9.scrollHeight;

      default:
        return "auto";
    }
  };

  const getFormState = (form) => {
    switch (form) {
      case 1:
        return form1Data;

      case 1.2:
        return form1Data;
      case 1.3:
        return form1Data;

      case 2:
        return form2Data;

      case 2.1:
        return form2Data;

      case 2.2:
        return form2Data;

      case 3:
        return form3Data;
      case 3.1:
        return form3Data;

      case 4:
        return form4Data;

      case 5:
        return form5Data;

      case 6:
        return form6Data;

      case 7:
        return form7Data;

      default:
        break;
    }
  };

  const changeFormState = (form, name, value) => {
    switch (form) {
      case 1:
        setForm1Data({
          ...form1Data,
          options: {
            ...form1Data.options,
            subForm1: { ...form1Data.options.subForm1, [name]: value },
          },
        });
        break;

      case 1.2:
        setForm1Data({
          ...form1Data,
          options: {
            ...form1Data.options,
            subForm2: { ...form1Data.options.subForm2, [name]: value },
          },
        });
        break;

      case 1.3:
        setForm1Data({
          ...form1Data,
          options: {
            ...form1Data.options,
            subForm3: { ...form1Data.options.subForm3, [name]: value },
          },
        });
        break;

      case 2:
        setForm2Data({
          ...form2Data,
          options: { ...form2Data.options, [name]: value },
        });
        break;

      case 2.1:
        setForm2Data({
          ...form2Data,
          options: {
            ...form2Data.options,
            subForm1: { ...form2Data.options.subForm1, [name]: value },
          },
        });
        break;

      case 2.2:
        setForm2Data({
          ...form2Data,
          options: {
            ...form2Data.options,
            subForm2: { ...form2Data.options.subForm2, [name]: value },
          },
        });
        break;

      case 3:
        setForm3Data({
          ...form3Data,
          options: { ...form3Data.options, [name]: value },
        });
        break;
      case 3.1:
        setForm3Data({
          ...form3Data,
          options: {
            ...form3Data.options,
            subForm1: {
              ...form3Data.options.subForm1,
              [name]: value,
            },
          },
        });
        break;
      default:
        break;
    }
  };

  const YesOrNo = (nameOfLabel, form, notApplicable = false, required) => {
    const notApplicableRadio = ["Yes", "No", "Not Applicable"];
    const YesOrNoArray = ["Yes", "No"];
    let arrForUsing = notApplicable ? notApplicableRadio : YesOrNoArray;

    return arrForUsing.map((e, index) => {
      return (
        <div className="checkboxGroup" key={nameOfLabel + form + index}>
          <label>
            <input
              name={nameOfLabel}
              disabled={isFormDisabled}
              type="radio"
              onChange={(e) => {
                changeFormState(form, nameOfLabel, e.target.value);
              }}
              checked={
                form === 1
                  ? getFormState(form).options.subForm1[nameOfLabel] === e
                  : form === 1.2
                  ? getFormState(form).options.subForm2[nameOfLabel] === e
                  : form === 1.3
                  ? getFormState(form).options.subForm3[nameOfLabel] === e
                  : form === 2.1
                  ? getFormState(form).options.subForm1[nameOfLabel] === e
                  : form === 2.2
                  ? getFormState(form).options.subForm2[nameOfLabel] === e
                  : form === 3.1
                  ? getFormState(form).options.subForm1[nameOfLabel] === e
                  : getFormState(form).options[nameOfLabel] === e
              }
              value={e}
            />{" "}
            {e}
          </label>
        </div>
      );
    });
  };

  const downloadReports = async () => {
    const step = new URLSearchParams(location.search).get("step");
    let pdfurl;

    const {
      data: { data },
    } = await axios.get(
      `/download/report/by/batch/${getUserSID()}/${
        taskStatus.batch_id[0]
      }/${monthlyChecklistID}`
    );
    if (
      data.status !== "error" &&
      data.code === 200 &&
      data.body.hasOwnProperty("zip_url")
    ) {
      setDownloadStatus(true);
      setTaskStatus({
        ...taskStatus,
        showReportDownloadAlert: true,
        reportDownloadStatus: "Reports Downloaded!",
        reportsDownloadURL: data.body.zip_url,
      });
      const link = document.createElement("a");
      link.href = data.body.zip_url;
      link.download = data.body.zip_url;
      link.click();
    } else {
      setDownloadStatus(true);
      setTaskStatus({
        ...taskStatus,
        showReportDownloadAlert: true,
        reportDownloadStatus: data.body,
      });
    }
  };

  const mapBasedOnChecklistType = {
    1: [
      "General Receipt Journal",
      "General Disbursement Journal",
      "General Journal",
      "Client General Journal",
      "General Bank Reconciliation",
      "Fees Book",
    ],
    2: ["Credit Card Reconciliation"],
    3: [
      "Trust Receipt Journal",
      "Trust Disbursement Journal",
      "Trust Journal",
      "Trust Listing",
      "Client Trust Ledger",
      "Trust Transfer",
      "Three Way Reconciliation",
      "Trust Bank Reconciliation",
    ],
  };

  // PDF generation removed

  const postToDB = async (type, obj) => {
    const response = await axios.post(`/${type}`, obj);

    return response;
  };

  const checkReportStatus = async () => {
    const { data } = await axios.get(
      `/processed/reports/status?batch_id=${taskStatus.batch_id[0]}`
    );

    if (data?.data?.body[0]?.status == "failed") {
      toast.error("For Some Reasons Report is Failed Please Get Report Again");
      clearInterval(intervalIdRef.current);
      setProcessing(false);
      return;
    }

    console.log("checkRel", data.data.body);

    setProcessing(true);
    if (data.data.code === 200 && data.data.status !== "error") {
      if (data.data.body?.length) {
        const status = data.data?.body[0]?.status;
        if (status === "processed") {
          setTaskStatus({
            ...taskStatus,
            reportsReadyForDownloading: true,
            showReportDownloadAlert: true,
            reportDownloadStatus: "Reports are ready to Download!",
          });
          setReportStatus(false);
          clearInterval(intervalIdRef.current);
          setProcessing(false);
        } else {
          setTaskStatus({
            ...taskStatus,
            showReportDownloadAlert: true,
            reportDownloadStatus: "Reports are processing. Please Wait",
            reportsReadyForDownloading: false,
          });
        }
      } else {
        clearInterval(intervalIdRef.current);
        setProcessing(false);
      }
    }
  };
  const postForTrustObj = async (obj) => {
    setForm1Data({ ...form1Data, ...obj });

    const trustObj = {
      task_id: getMonthlyChecklistId(),
      trust_account: obj,
    };

    const response = await postToDB("trust", trustObj);
    if (response.data.data.code === 200) {
      nextStep();
    } else {
      alert("Server Error: Contact Administration");
    }
  };

  const form1 = (typeOfList) => {
    return (
      <div
        ref={(divElement) => {
          if (activeStep === 1) ref1 = divElement;
        }}
      >
        <Loader isLoading={loader.form1} />
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            list={typeOfList}
            activeForm={activeForm}
            type="checklist"
            setActiveStepFunc={(e) => setActiveStep(e)}
          ></OnboardingSteps>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="titleHeader">
              <div className="innerTitle">
                <span>{getSvg("Lets get started")}</span>
                <label>Let's get started</label>
              </div>

              <div className="taskTypeTitle">
                {taskStatus.task_type === "Trust A/C checklist"
                  ? "Trust A/C"
                  : taskStatus.task_type === "General A/C checklist"
                  ? "General A/C"
                  : "Credit A/C"}
              </div>
            </div>
          </div>
        </div>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            const lengthOfValues = Object.values(form1Data.options.subForm1);
            const valuesAreYesForEvery = checkIfValueInArrayInEvery(
              lengthOfValues,
              "Yes"
            );
            const valuesAreEmptyForSome = checkIfValueInArrayInSome(
              lengthOfValues,
              ""
            );

            if (valuesAreEmptyForSome) {
              setForm1Data({ ...form1Data, fillAllDetails: true });
            } else {
              if (valuesAreYesForEvery) {
                const obj = {
                  ...form1Data,
                  fillAllDetails: false,
                  commentsOpen: false,
                  trustAccountNames,
                };

                postForTrustObj(obj);
              } else {
                const obj = {
                  ...form1Data,
                  commentsOpen: true,
                  fillAllDetails: false,
                  trustAccountNames,
                };
                postForTrustObj(obj);
              }
            }
          }}
        >
          <div className="col-md-8">
            <li
              className={`${
                form1Data.options.subForm1.receivedTrustBankStatements === "" &&
                form1Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you received your Trust bank statements for the month of{" "}
              {dateMonth}?
              {!isFormDisabled
                ? trustAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo(`${"receivedTrustBankStatements"}`, 1)}
                      </div>
                    );
                  })
                : form1Data.trustAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo(`${"receivedTrustBankStatements"}`, 1)}
                      </div>
                    );
                  })}
              {form1Data.options.subForm1["receivedTrustBankStatements"] ===
                "No" && (
                <div className="form-group">
                  <label>Comment</label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    disabled={isFormDisabled}
                    name="comment1"
                    value={form1Data.comments.comment1}
                    onChange={(e) => {
                      setForm1Data({
                        ...form1Data,
                        comments: {
                          ...form1Data.comments,
                          comment1: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              )}
            </li>
            <li
              className={`${
                form1Data.options.subForm1.savedTrustBankStatements === "" &&
                form1Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you saved your Trust bank statements on your local
              drive/One-drive/Dropbox?
              {!isFormDisabled
                ? trustAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo(`${"savedTrustBankStatements"}`, 1)}
                      </div>
                    );
                  })
                : form1Data.trustAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo(`${"savedTrustBankStatements"}`, 1)}
                      </div>
                    );
                  })}
              {form1Data.options.subForm1["savedTrustBankStatements"] ===
                "No" && (
                <div className="form-group">
                  <label>Comment</label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    disabled={isFormDisabled}
                    name="comment2"
                    value={form1Data.comments.comment2}
                    onChange={(e) => {
                      setForm1Data({
                        ...form1Data,
                        comments: {
                          ...form1Data.comments,
                          comment2: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              )}
            </li>
            <li
              className={`${
                form1Data.options.subForm1.postedTransactions === "" &&
                form1Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you posted all trust transactions on Clio for {dateMonth}?
              {!isFormDisabled
                ? trustAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("postedTransactions", 1)}
                      </div>
                    );
                  })
                : form1Data.trustAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo(`${"postedTransactions"}`, 1)}
                      </div>
                    );
                  })}
              {form1Data.options.subForm1["postedTransactions"] === "No" && (
                <div className="form-group">
                  <label>Comment</label>
                  <input
                    type="text"
                    disabled={isFormDisabled}
                    required
                    name="comment2"
                    value={form1Data.comments.comment3}
                    onChange={(e) => {
                      setForm1Data({
                        ...form1Data,
                        comments: {
                          ...form1Data.comments,
                          comment3: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              )}
            </li>
            <li
              className={`${
                form1Data.options.subForm1.confirmReconciliation === "" &&
                form1Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you reconciled the trust account balance?
              {!isFormDisabled
                ? trustAccountNames.map((e, index) => {
                    return (
                      <>
                        <div
                          key={index}
                          className="d-flex flex-wrap form-group flex-row m-0"
                        >
                          {YesOrNo("confirmReconciliation", 1)}
                        </div>
                        {form1Data.options.subForm1["confirmReconciliation"] ===
                          "Yes" && (
                          <div
                            className="form-group col-md-6"
                            style={{ marginLeft: "-13px" }}
                          >
                            <DatePicker
                              dayPlaceholder="DD"
                              monthPlaceholder="MM"
                              yearPlaceholder="YY"
                              format="MM/ dd/ yy"
                              minDate={new Date("December 17, 1901 00:00:00")}
                              maxDate={new Date("December 17, 2300 00:00:00")}
                              onChange={(event) =>
                                setForm1Data({
                                  ...form1Data,
                                  dateBankReconciliation: new Date(
                                    event
                                  ).getTime(),
                                })
                              }
                              name={"dateBankReconciliation"}
                              value={
                                form1Data.dateBankReconciliation
                                  ? new Date(form1Data.dateBankReconciliation)
                                  : ""
                              }
                            />
                          </div>
                        )}
                      </>
                    );
                  })
                : form1Data.trustAccountNames.map((e, index) => {
                    return (
                      <>
                        <div key={index}>
                          <label className="mt-2">{e.name}</label>
                          <div className="d-flex flex-wrap form-group flex-row m-0">
                            {YesOrNo("confirmReconciliation", 1)}
                          </div>
                        </div>
                        {form1Data.options.subForm1["confirmReconciliation"] ===
                          "Yes" && (
                          <div
                            className="form-group col-md-6"
                            style={{ marginLeft: "-13px" }}
                          >
                            <DatePicker
                              disabled
                              dayPlaceholder="DD"
                              monthPlaceholder="MM"
                              yearPlaceholder="YY"
                              format="MM/ dd/ yy"
                              minDate={new Date("December 17, 1901 00:00:00")}
                              maxDate={new Date("December 17, 2300 00:00:00")}
                              onChange={(event) =>
                                setForm1Data({
                                  ...form1Data,
                                  dateBankReconciliation: new Date(
                                    event
                                  ).getTime(),
                                })
                              }
                              name={"dateBankReconciliation"}
                              value={
                                form1Data.dateBankReconciliation
                                  ? new Date(form1Data.dateBankReconciliation)
                                  : ""
                              }
                            />
                          </div>
                        )}
                      </>
                    );
                  })}
            </li>

            {form1Data.fillAllDetails && (
              <Alert
                className="fw-bold d-flex justify-content-center  w-100"
                variant="warning"
              >
                Please fill all fields To Proceed
              </Alert>
            )}
          </div>
          <div className="col-md-4 text-end">
            <img src={reviewCheckList}></img>
          </div>
          <div className="col-md-12">
            <div className="btnGroup justify-content-between mt-5">
              <div></div>

              <button className="btn btnPrimary blue rounded-pill">
                Save & Next
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const determineVariance = () => {
    if (isFormDisabled) {
      if (
        parseFloat(form1Data.closingBalance[0]) ===
          parseFloat(form1Data.closingBalance[1]) &&
        parseFloat(form1Data.closingBalance[0]) ===
          parseFloat(form1Data.closingBalance[2])
      ) {
        return 0;
      } else {
        return parseFloat(
          form1Data.closingBalance[0] -
            form1Data.closingBalance[1] -
            form1Data.closingBalance[2]
        ).toFixed(2);
      }
    } else {
      if (
        parseFloat(trustAccountTableInfo.closingBalance[0]) ===
          parseFloat(trustAccountTableInfo.closingBalance[1]) &&
        parseFloat(trustAccountTableInfo.closingBalance[0]) ===
          parseFloat(trustAccountTableInfo.closingBalance[2])
      ) {
        return 0;
      } else {
        return parseFloat(
          trustAccountTableInfo.closingBalance[1] -
            trustAccountTableInfo.closingBalance[0]
        ).toFixed(2);
      }
    }
  };

  const form1second = (typeOfList) => {
    return (
      <div
        ref={(divElement) => {
          if (activeStep === 2) ref2 = divElement;
        }}
      >
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            list={typeOfList}
            activeForm={activeForm}
            setActiveStepFunc={(e) => setActiveStep(e)}
            type="checklist"
          ></OnboardingSteps>
        </div>

        <div className="onboarding_form_1">
          <div className="row">
            <div className="col-md-12">
              <div className="titleHeader">
                <div className="innerTitle">
                  <span>{getSvg("compiled all your documents")}</span>
                  <label>Great, You have compiled all your documents</label>
                </div>

                <div className="taskTypeTitle">Overview</div>
              </div>
            </div>
          </div>

          <form
            className="row"
            onSubmit={async (e) => {
              checkIfFilledForm2(e);
            }}
          >
            <div className="col-md-8">
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li
                className={`${
                  form1Data.comments.endingBalance === "" &&
                  form1Data.fillAllDetails
                    ? "text-error"
                    : ""
                }`}
              >
                Please confirm the closing trust account balance:
                <div className="form-group">
                  <NumberFormat
                    value={form1Data.comments.endingBalance}
                    inputMode="numeric"
                    thousandSeparator={true}
                    decimalScale={3}
                    defaultValue={0}
                    prefix={"$"}
                    disabled={isFormDisabled}
                    name="endingBalance"
                    onChange={(e) => {
                      setForm1Data({
                        ...form1Data,
                        comments: {
                          ...form1Data.comments,
                          endingBalance: e.target.value.replace(/[\$,]/g, ""),
                        },
                      });
                    }}
                  />
                </div>
              </li>
              <li>
                Overview of bank reconciliation
                <div className="tableOuter m-0 mt-2 mb-3 addTaskGrid">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        <th>Cash book balance</th>
                        <th>Client trust ledger balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {isFormDisabled
                          ? form1Data.closingBalance.map((e, index) => {
                              if (index === 1) {
                                return (
                                  <td>
                                    {e !== null
                                      ? formatNumberInThousands(e, 2)
                                      : "----------------"}
                                  </td>
                                );
                              }

                              return (
                                <td>
                                  {e !== null
                                    ? formatNumberInThousands(e, 2)
                                    : "----------------"}
                                </td>
                              );
                            })
                          : trustAccountTableInfo?.closingBalance?.map(
                              (e, index) => {
                                if (index === 1) {
                                  return (
                                    <td>
                                      {e !== null
                                        ? formatNumberInThousands(e, 2)
                                        : "----------------"}
                                    </td>
                                  );
                                }

                                return (
                                  <td>
                                    {e !== null
                                      ? formatNumberInThousands(e, 2)
                                      : "----------------"}
                                  </td>
                                );
                              }
                            )}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Difference</label>
                      {isFormDisabled ? (
                        <input
                          type="text"
                          value={formatNumber(determineVariance(), 2)}
                          disabled={isFormDisabled || true}
                        />
                      ) : (
                        <input
                          type="text"
                          value={formatNumber(determineVariance(), 2)}
                          disabled={isFormDisabled || true}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-6 d-flex align-items-center justify-content-center">
                    {determineVariance() === 0 ? (
                      <span className="text">
                        The trust cash book balance ties with the client trust
                        listing and client trust ledger.
                      </span>
                    ) : (
                      <div className="form-group">
                        <label>Comment</label>
                        <textarea
                          style={{ width: "401px" }}
                          className="form-control"
                          type="text"
                          required
                          disabled={isFormDisabled}
                          name="varianceComment"
                          value={trustAccountTableInfo.varianceComment}
                          onChange={(e) => {
                            setTrustAccountTableInfo({
                              ...trustAccountTableInfo,
                              varianceComment: e.target.value,
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </li>

              <li>
                <div>Uncleared bank transactions</div>

                <br />

                <div className="tableOuter m-0 addTaskGrid mb-4">
                  7.1 Have you reviewed the uncleared deposits? Are there
                  uncashed cheques (Deposits) that are outstanding for more than
                  two months?
                  <div className="d-flex flex-wrap form-group flex-row m-0">
                    {YesOrNo("unClearedPaymentQues1", 1.2)}
                  </div>
                  {form1Data.options.subForm2["unClearedPaymentQues1"] ===
                    "Yes" && (
                    <div className="form-group">
                      Outstanding deposits not due to timing differences merit
                      your immediate attention
                    </div>
                  )}
                  <br />
                  7.2 Have you reviewed the uncleared payments? Are there any
                  stale-dated cheques listed under the outstanding cheque list?
                  <div className="d-flex flex-wrap form-group flex-row m-0">
                    {YesOrNo("unClearedPaymentQues2", 1.2)}
                  </div>
                  {form1Data.options.subForm2["unClearedPaymentQues2"] ===
                    "Yes" && (
                    <div className="form-group">
                      You may consider reissuing the cheque(s) to your client(s)
                    </div>
                  )}
                </div>
              </li>
            </div>

            <div className="col-md-4 text-end">
              <img className="mt-5" src={accountTasks}></img>
            </div>
            <div className="col-md-12">
              {form1Data.fillAllDetails && (
                <Alert
                  className="fw-bold d-flex justify-content-center  w-100"
                  variant="warning"
                >
                  Please fill all fields To Proceed
                </Alert>
              )}
              <div className="btnGroup justify-content-between mt-5">
                <button
                  onClick={previousPage}
                  className="btn btnPrimary m-0 blue rounded-pill"
                >
                  Previous
                </button>
                <button
                  className="btn btnPrimary blue rounded-pill"
                  onClick={(e) => checkIfFilledForm2(e)}
                  type="submit"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const form1third = (typeOfList) => {
    return (
      <div
        ref={(divElement) => {
          if (activeStep === 2) ref2 = divElement;
        }}
      >
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            list={typeOfList}
            activeForm={activeForm}
            setActiveStepFunc={(e) => setActiveStep(e)}
            type="checklist"
          ></OnboardingSteps>
        </div>

        <div className="onboarding_form_1">
          <div className="row">
            <div className="col-md-12">
              <div className="titleHeader">
                <div className="innerTitle">
                  <span>{getSvg("Lets clarify some details")}</span>
                  <label>Perfect, Lets clarify some details</label>
                </div>

                <div className="taskTypeTitle">Account Details</div>
              </div>
            </div>
          </div>

          <form
            className="row"
            onSubmit={async (e) => {
              checkIfFilledForm3(e);
            }}
          >
            <div className="col-md-8">
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li>
                Details of overdrawn client balances
                <div className="tableOuter m-0 addTaskGrid">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Matter</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFormDisabled
                        ? form1Data?.clientTrustBalance?.map((e, index) => {
                            return (
                              <tr key={index}>
                                <td>{e.client_name}</td>
                                <td>{e.Matter_display_number}</td>
                                <td>
                                  {removeNegSignAndWrapInBracketsWith2Fraction(
                                    e.amount
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        : trustAccountTableInfo?.clientTrustBalance?.map(
                            (e, index) => {
                              return (
                                <tr key={index}>
                                  <td>{e.client_name}</td>
                                  <td>{e.Matter_display_number}</td>
                                  <td>
                                    {removeNegSignAndWrapInBracketsWith2Fraction(
                                      e.amount
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}

                      {isFormDisabled
                        ? form1Data?.clientTrustBalance?.length === 0 && (
                            <tr>
                              <td className="text-center" colSpan="3">
                                No Clients Yet
                              </td>
                            </tr>
                          )
                        : trustAccountTableInfo?.clientTrustBalance?.length ===
                            0 && (
                            <tr>
                              <td className="text-center" colSpan="3">
                                No Clients yet
                              </td>
                            </tr>
                          )}

                      {isFormDisabled
                        ? form1Data?.clientTrustBalance?.length !== 0 && (
                            <tr>
                              <td>Total:</td>
                              <td></td>
                              <td>
                                {removeNegSignAndWrapInBracketsWith2Fraction(
                                  form1Data.clientTrustBalance.reduce(
                                    (total, e) => total + e.amount,
                                    0
                                  )
                                )}
                              </td>
                            </tr>
                          )
                        : trustAccountTableInfo?.clientTrustBalance?.length !==
                            0 && (
                            <tr>
                              <td> Total:</td>
                              <td></td>
                              <td>
                                {removeNegSignAndWrapInBracketsWith2Fraction(
                                  trustAccountTableInfo?.clientTrustBalance?.reduce(
                                    (total, e) => total + e.amount,
                                    0
                                  )
                                )}
                              </td>
                            </tr>
                          )}
                    </tbody>
                  </table>
                </div>
              </li>
              <li>
                Details of inactive client accounts <br />
                <text>
                  (Inactive - there are no transaction on the client trust
                  ledger for last 2 months)
                </text>
                <div className="tableOuter m-0 addTaskGrid">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Matter</th>
                        <th>Date of Last Activity</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFormDisabled
                        ? form1Data?.clientInactiveAccount?.map((e, index) => {
                            return (
                              <tr key={index}>
                                <td>{e.client_name}</td>
                                <td>{e.Matter_display_number}</td>

                                <td>
                                  {momentFunction.formatDate(
                                    e.lastActdate,
                                    "DD/MM/YYYY"
                                  )}
                                </td>
                                <td>
                                  {removeNegSignAndWrapInBracketsWith2Fraction(
                                    e.amount
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        : trustAccountTableInfo?.clientInactiveAccount?.map(
                            (e, index) => {
                              return (
                                <tr key={index}>
                                  <td>{e.client_name}</td>
                                  <td>{e.Matter_display_number}</td>
                                  <td>
                                    {momentFunction.formatDate(
                                      e.lastActdate,
                                      "DD/MM/YYYY"
                                    )}
                                  </td>
                                  <td>
                                    {removeNegSignAndWrapInBracketsWith2Fraction(
                                      e.amount
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                      {isFormDisabled
                        ? form1Data.clientInactiveAccount.length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center">
                                No Clients Yet
                              </td>
                            </tr>
                          )
                        : trustAccountTableInfo.clientInactiveAccount.length ===
                            0 && (
                            <tr>
                              <td colSpan="4" className="text-center">
                                No Clients yet
                              </td>
                            </tr>
                          )}
                    </tbody>
                  </table>
                </div>
              </li>

              <li>
                Details of client balances with status 'Closed'
                <div className="tableOuter m-0 addTaskGrid">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Matter</th>
                        <th>Status</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFormDisabled
                        ? form1Data.clientBalanceStatus.map((e, index) => {
                            return (
                              <tr key={index}>
                                <td>{e.client_name}</td>
                                <td>{e.Matter_display_number}</td>
                                <td>Closed</td>
                                <td>
                                  {removeNegSignAndWrapInBracketsWith2Fraction(
                                    e.amount
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        : trustAccountTableInfo.clientBalanceStatus.map(
                            (e, index) => {
                              return (
                                <tr key={index}>
                                  <td>{e.client_name}</td>
                                  <td>{e.Matter_display_number}</td>
                                  <td>Closed</td>
                                  <td>
                                    {removeNegSignAndWrapInBracketsWith2Fraction(
                                      e.amount
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                      {isFormDisabled
                        ? form1Data.clientBalanceStatus.length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center">
                                No Clients Yet
                              </td>
                            </tr>
                          )
                        : trustAccountTableInfo.clientBalanceStatus.length ===
                            0 && (
                            <tr>
                              <td colSpan="4" className="text-center">
                                No Clients yet
                              </td>
                            </tr>
                          )}
                    </tbody>
                  </table>
                </div>
              </li>

              {/*  */}
              <li>
                There is an internal matter as at{" "}
                {moment(taskStatus.task_month).endOf("month").format("ll")} in
                the name of {getCurrentUserFromCookies().display_firmname}{" "}
                <br />
                <text
                  className={`lg ${
                    form1Data.options.subForm2.confirmInternalMatter === "" &&
                    form1Data.fillAllDetails
                      ? "text-error"
                      : ""
                  }`}
                >
                  Please confirm if any other internal matter has been
                  maintained in the name of the law firm
                </text>
                <div className="d-flex flex-wrap form-group flex-row">
                  {YesOrNo("confirmInternalMatter", 1.2, false)}
                </div>
                {form1Data.options.subForm2["confirmInternalMatter"] ===
                  "Yes" && (
                  <div className="form-group">
                    <Autocomplete
                      multiple
                      id="size-medium-outlined-multi"
                      disabled={isFormDisabled}
                      getOptionSelected={(option, value) => {
                        return option.client_name === value.client_name;
                      }}
                      options={matterClientList || []}
                      value={form1Data?.matterClientName}
                      onChange={(event, value) => {
                        setForm1Data({
                          ...form1Data,
                          matterClientName: value,
                          matterOwnerConfirmed: false,
                        });
                      }}
                      getOptionLabel={(e) =>
                        e.client_name + " - " + e.matter_display_nbr
                      }
                      defaultValue={form1Data.matterClientName}
                      renderInput={(params, index) => (
                        <TextField
                          {...params}
                          label="Select Matter Clients"
                          placeholder="Select Matter Clients"
                        />
                      )}
                    />
                  </div>
                )}
                <div className="fw-bold">
                  {addUpNumbersFromArray(
                    form1Data.trustBalanceOfAccount.map(({ Balance }) =>
                      parseInt(Balance)
                    )
                  ) > 0 &&
                    getAllUserInfo().province === "ON" && (
                      <div className="heading-normal">
                        The Law Society of Ontario doesn’t allow float or any
                        amount in the name of the lawyer or law firm or any
                        other name such as “miscellaneous”, “suspense” or
                        “unknown” in the mixed or pooled trust account.
                      </div>
                    )}

                  {addUpNumbersFromArray(
                    form1Data.trustBalanceOfAccount.map(({ Balance }) =>
                      parseInt(Balance)
                    )
                  ) > 0 &&
                    getAllUserInfo().province === "BC" && (
                      <div className="heading-normal">
                        The Law Society of British Columbia allows a deposit up
                        to $300 of the lawyer or law firm’s fund in the mixed or
                        pooled trust account.
                      </div>
                    )}

                  {addUpNumbersFromArray(
                    form1Data.trustBalanceOfAccount.map(({ Balance }) =>
                      parseInt(Balance)
                    )
                  ) > 0 &&
                    getAllUserInfo().province === "AB" && (
                      <div className="heading-normal">
                        The Law Society of Alberta allows a law firm to maintain
                        not more than $500 of the firm's own money in each of
                        the firm's pooled trust accounts.
                      </div>
                    )}
                </div>
                {form1Data.unidentifiedTrustFunds === 0 ? null : (
                  <div className="tableOuter m-0">
                    <table className="table customGrid">
                      <thead>
                        <tr>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isFormDisabled
                          ? form1Data?.unidentifiedTrustFundsTable.map(
                              (e, index) => {
                                return (
                                  <tr key={index}>
                                    <td>{e.Balance}</td>
                                  </tr>
                                );
                              }
                            )
                          : trustAccountTableInfo.unidentifiedTrustFundsTable.map(
                              (e, index) => {
                                return (
                                  <tr key={index}>
                                    <td>{e.Balance}</td>
                                  </tr>
                                );
                              }
                            )}
                      </tbody>
                    </table>
                  </div>
                )}
                {form1Data.detailsOfBankFeesValue === 0 ? null : (
                  <div className="tableOuter m-0">
                    <table className="table customGrid">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Bank Fees</th>
                        </tr>
                      </thead>

                      <tbody>
                        {isFormDisabled
                          ? form1Data.detailsOfBankFeesProcessedInTrustAccount.map(
                              (e, index) => {
                                return (
                                  <tr key={index}>
                                    <td>{e.id}</td>
                                    <td>{e.Balance}</td>
                                  </tr>
                                );
                              }
                            )
                          : trustAccountTableInfo.detailsOfBankFeesProcessedInTrustAccount.map(
                              (e, index) => {
                                return (
                                  <tr key={index}>
                                    <td>{e.id}</td>
                                    <td>{e.Balance}</td>
                                  </tr>
                                );
                              }
                            )}

                        <tr>
                          <td>Total</td>
                          <td>
                            {isFormDisabled
                              ? addUpNumbersFromArray(
                                  form1Data.detailsOfBankFeesProcessedInTrustAccount.map(
                                    ({ Balance }) => parseFloat(Balance)
                                  )
                                )
                              : addUpNumbersFromArray(
                                  trustAccountTableInfo.detailsOfBankFeesProcessedInTrustAccount.map(
                                    ({ Balance }) => parseFloat(Balance)
                                  )
                                )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {form1Data.detailsOnTrustAccountValue === 0 ? null : (
                  <div className="tableOuter m-0">
                    <table className="table customGrid">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Interest</th>
                        </tr>
                      </thead>

                      <tbody>
                        {isFormDisabled
                          ? form1Data.detailsOfInterestOnTrustAccount.map(
                              (e, index) => {
                                return (
                                  <tr key={index}>
                                    <td>{e.id}</td>
                                    <td>{e.Interest}</td>
                                  </tr>
                                );
                              }
                            )
                          : trustAccountTableInfo.detailsOfInterestOnTrustAccount.map(
                              (e, index) => {
                                return (
                                  <tr key={index}>
                                    <td>{e.id}</td>
                                    <td>{e.Interest}</td>
                                  </tr>
                                );
                              }
                            )}

                        <tr>
                          <td>Total</td>
                          <td>
                            {isFormDisabled
                              ? addUpNumbersFromArray(
                                  form1Data.detailsOfInterestOnTrustAccount.map(
                                    ({ Interest }) => parseFloat(Interest)
                                  )
                                )
                              : addUpNumbersFromArray(
                                  trustAccountTableInfo.detailsOfInterestOnTrustAccount.map(
                                    ({ Interest }) => parseFloat(Interest)
                                  )
                                )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
              {/*  */}

              <div className="form-group">
                <li
                  className={` ${
                    form1Data.options.subForm2.AreTrustFundsInvestedInBills ===
                      "" && form1Data.fillAllDetails
                      ? "text-error"
                      : ""
                  }`}
                >
                  Are trust funds invested in any instruments (Treasury bills,
                  money market funds)
                  <div className="d-flex flex-wrap form-group flex-row">
                    {YesOrNo("AreTrustFundsInvestedInBills", 1.2, false)}
                  </div>
                  {form1Data.options.subForm2[
                    "AreTrustFundsInvestedInBills"
                  ] === "Yes" && (
                    <div className="form-group">
                      <label>Interest of Trust Account</label>
                      <input
                        className="form-control"
                        type="number"
                        placeholder="Enter Interest of Trust Account "
                        value={
                          form1Data.interestTrustAccountValue !== 0
                            ? form1Data.interestTrustAccountValue
                            : ""
                        }
                        onChange={(e) => {
                          setForm1Data({
                            ...form1Data,
                            interestTrustAccountValue: e.target.value,
                          });
                        }}
                      />
                    </div>
                  )}
                </li>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <img className="mt-5" src={accountTasksDetails}></img>
            </div>
            <div className="col-md-12">
              {form1Data.fillAllDetails && (
                <Alert
                  className="fw-bold d-flex justify-content-center  w-100"
                  variant="warning"
                >
                  Please fill all fields To Proceed
                </Alert>
              )}
              <div className="btnGroup justify-content-between">
                <button
                  onClick={previousPage}
                  className="btn btnPrimary m-0 blue rounded-pill"
                >
                  Previous
                </button>
                <button
                  className="btn btnPrimary blue rounded-pill"
                  onClick={(e) => checkIfFilledForm2(e)}
                  type="submit"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const form1fourth = (typeOfList) => {
    return (
      <div
        ref={(divElement) => {
          if (activeStep === 2) ref2 = divElement;
        }}
      >
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            list={typeOfList}
            activeForm={activeForm}
            setActiveStepFunc={(e) => setActiveStep(e)}
            type="checklist"
          ></OnboardingSteps>
        </div>

        <div className="onboarding_form_1">
          <div className="row">
            <div className="col-md-12">
              <div className="titleHeader">
                <div className="innerTitle">
                  <span>{getSvg("few more questions")}</span>
                  <label>Good Job. A few more questions...</label>
                </div>

                <div className="taskTypeTitle">Other Details</div>
              </div>
            </div>
          </div>

          <form
            className="row"
            onSubmit={async (e) => {
              checkIfFilledForm4(e);
            }}
          >
            <div className="col-md-8">
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li className="blank"></li>
              <li>
                Are all source documents available for the trust transactions
                during the month?
                <div className="form-group-wrap mt-3">
                  <div className="form-group">
                    <label
                      className={`${
                        form1Data.options.subForm3.Form9A === "" &&
                        form1Data.fillAllDetails
                          ? "text-error"
                          : ""
                      }`}
                    >
                      E-transfer form
                    </label>
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("Form9A", 1.3, true, true)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label
                      className={`${
                        form1Data.options.subForm3
                          .sequentiallyNumberedCheques === "" &&
                        form1Data.fillAllDetails
                          ? "text-error"
                          : ""
                      }`}
                    >
                      Sequentially numbered cheques
                    </label>
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("sequentiallyNumberedCheques", 1.3, true, true)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label
                      className={`${
                        form1Data.options.subForm3
                          .BackupsForClientApprovalsInternal === "" &&
                        form1Data.fillAllDetails
                          ? "text-error"
                          : ""
                      }`}
                    >
                      Back-ups for client approvals and internal approvals
                    </label>
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo(
                        "BackupsForClientApprovalsInternal",
                        1.3,
                        true,
                        true
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label
                      className={`${
                        form1Data.options.subForm3.CancelledAndVoidedCheques ===
                          "" && form1Data.fillAllDetails
                          ? "text-error"
                          : ""
                      }`}
                    >
                      Cancelled and voided cheques
                    </label>
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("CancelledAndVoidedCheques", 1.3, true, true)}
                    </div>
                  </div>
                </div>
              </li>
              <li
                className={`Data.options.subForm3.AllChequesSignedAuthorised === "" && form1Data.fillAllDetails ? "text-error" : ""}`}
              >
                Are all cheques, bank drafts, electronic transactions
                signed/authorised by the appropriate signing officers of the law
                firm. Are all supporting documentation reviewed prior to
                signing/authorising
                <div className="d-flex flex-wrap form-group flex-row m-0 mt-2">
                  {YesOrNo("AllChequesSignedAuthorised", 1.3, true, true)}
                </div>
              </li>
              <li
                className={`${
                  form1Data.options.subForm3.closedAnyTrustAccount === "" &&
                  form1Data.fillAllDetails
                    ? "text-error"
                    : ""
                }`}
              >
                Please confirm if you have closed any trust account during last
                month
                <div className="d-flex flex-wrap form-group flex-row m-0 mt-2">
                  {YesOrNo("closedAnyTrustAccount", 1.3, true, true)}
                </div>
                {form1Data.options.subForm3["closedAnyTrustAccount"] ===
                  "Yes" &&
                  getCurrentUserFromCookies().province !== "BC" &&
                  getCurrentUserFromCookies().province !== "AB" && (
                    <div className="form-group mt-2">
                      <label
                        className={`${
                          form1Data.options.subForm2.FiledTheForm3 === "" &&
                          form1Data.fillAllDetails
                            ? "text-error"
                            : ""
                        }`}
                      >
                        Have you filed the Form 3: Report on Closing a Mixed
                        Trust Account to The Law Foundation of Ontario
                      </label>
                      <div className="d-flex flex-wrap form-group flex-row m-0">
                        {YesOrNo("FiledTheForm3", 1.3, true, true)}
                      </div>
                    </div>
                  )}
              </li>
              <li
                className={`${
                  form1Data.options.subForm3.HaveYouOpenedAnyTrustAccount ===
                    "" && form1Data.fillAllDetails
                    ? "text-error"
                    : ""
                }`}
              >
                Please confirm if you have opened any trust account during last
                month
                <div className="d-flex flex-wrap form-group flex-row mt-2">
                  {YesOrNo("HaveYouOpenedAnyTrustAccount", 1.3, true, true)}
                </div>
                {getAllUserInfo().province !== "ON" &&
                  form1Data.options.subForm3["HaveYouOpenedAnyTrustAccount"] ===
                    "Yes" &&
                  getCurrentUserFromCookies().province !== "BC" &&
                  getCurrentUserFromCookies().province !== "AB" && (
                    <div className="form-group">
                      <label
                        className={`${
                          form1Data.options.subForm2.HaveYouFiledTheForm2 ===
                            "" && form1Data.fillAllDetails
                            ? "text-error"
                            : ""
                        }`}
                      >
                        Have you filed the Form 2: Report on Opening a Mixed
                        Trust Account to The Law Foundation of Ontario
                      </label>
                      <div className="d-flex flex-wrap form-group flex-row m-0">
                        {YesOrNo("HaveYouFiledTheForm2", 1.3, true, true)}
                      </div>
                    </div>
                  )}
              </li>
            </div>
            <div className="col-md-4 text-end">
              <img className="mt-5" src={otherDetails}></img>
            </div>
            <div className="col-md-12">
              {form1Data.fillAllDetails && (
                <Alert
                  className="fw-bold d-flex justify-content-center  w-100"
                  variant="warning"
                >
                  Please fill all fields To Proceed
                </Alert>
              )}
              <div className="btnGroup justify-content-between">
                <button
                  onClick={previousPage}
                  className="btn btnPrimary m-0 blue rounded-pill"
                >
                  Previous
                </button>
                <button
                  className="btn btnPrimary blue rounded-pill"
                  // onClick={(e) => checkIfFilledForm2(e)}
                  type="submit"
                >
                  Save & Next
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const postForGeneralObj = async (obj) => {
    const generalObj = {
      task_id: getMonthlyChecklistId(),
      general_account: obj,
    };
    const response = await postToDB("general", generalObj);

    if (response.data.data.code === 200) {
      nextStep();
    } else {
      alert("Server Error");
    }
  };

  const form2 = (typeOfList, formNumber) => {
    return (
      <div
        ref={(divElement) => {
          if (formNumber === activeStep) {
            assignRef(divElement, activeForm, formNumber);
          }
        }}
      >
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            list={typeOfList}
            type="checklist"
            activeForm={activeForm}
            setActiveStepFunc={(e) => setActiveStep(e)}
          ></OnboardingSteps>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="titleHeader">
              <div className="innerTitle">
                <span>{getSvg("Lets get started")}</span>
                <label>Let's get started</label>
              </div>
              <div className="taskTypeTitle">General A/C</div>
            </div>
          </div>
        </div>

        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();

            const lengthOfValues = Object.values(form2Data.options.subForm1);
            const valuesAreYesForEvery = checkIfValueInArrayInEvery(
              lengthOfValues,
              "Yes"
            );
            const valuesAreEmptyForSome = checkIfValueInArrayInSome(
              lengthOfValues,
              ""
            );

            if (valuesAreEmptyForSome) {
              setForm2Data({ ...form2Data, fillAllDetails: true });
            } else {
              const obj = {
                ...form2Data,
                fillAllDetails: false,
                generalAccountNames,
              };

              postForGeneralObj(obj);
            }
          }}
        >
          <div className="col-md-8">
            <li
              className={`${
                form2Data?.options?.subForm1?.operatingStatements === "" &&
                form2Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you received your operating bank statements for {dateMonth}?
              {!isFormDisabled
                ? generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("operatingStatements", 2.1)}
                      </div>
                    );
                  })
                : form2Data.generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("operatingStatements", 2.1)}
                      </div>
                    );
                  })}
            </li>
            <li
              className={`${
                form2Data.options.subForm1.savedOperatingStatements === "" &&
                form2Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you saved your operating bank statements on your local
              drive/sharepoint?
              {!isFormDisabled
                ? generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("savedOperatingStatements", 2.1)}
                      </div>
                    );
                  })
                : form2Data.generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("savedOperatingStatements", 2.1)}
                      </div>
                    );
                  })}
            </li>
            <li
              className={`${
                form2Data.options.subForm1.postedAllTransactions === "" &&
                form2Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you posted all transactions related to the General Account on
              Clio/QBO for {dateMonth}?
              {!isFormDisabled
                ? generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("postedAllTransactions", 2.1)}
                      </div>
                    );
                  })
                : form2Data.generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("postedAllTransactions", 2.1)}
                      </div>
                    );
                  })}
            </li>
            <li
              className={`${
                form2Data.options.subForm1.postedAllMatter === "" &&
                form2Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you posted all matter related expenses on Clio/QBO for{" "}
              {dateMonth}?
              {!isFormDisabled
                ? generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("postedAllMatter", 2.1, true)}
                      </div>
                    );
                  })
                : form2Data.generalAccountNames.map((e, index) => {
                    return (
                      <div
                        key={index}
                        className="d-flex flex-wrap form-group flex-row m-0"
                      >
                        {YesOrNo("postedAllMatter", 2.1, true)}
                      </div>
                    );
                  })}
            </li>
            <li
              className={`${
                form2Data.options.subForm1.bankReconciliationCompleted === "" &&
                form2Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you reconciled the operating account balance?
              {!isFormDisabled
                ? generalAccountNames.map((e, index) => {
                    return (
                      <React.Fragment key={index}>
                        <div key={index}>
                          <div className="d-flex flex-wrap form-group flex-row m-0">
                            {YesOrNo("bankReconciliationCompleted", 2.1)}
                          </div>
                        </div>
                        {form2Data.options.subForm1[
                          "bankReconciliationCompleted"
                        ] === "Yes" && (
                          <div
                            className="form-group col-md-6"
                            style={{ marginLeft: "-13px" }}
                          >
                            <DatePicker
                              dayPlaceholder="DD"
                              monthPlaceholder="MM"
                              yearPlaceholder="YY"
                              format="MM/ dd/ yy"
                              minDate={new Date("December 17, 1901 00:00:00")}
                              maxDate={new Date("December 17, 2300 00:00:00")}
                              onChange={(event) =>
                                setForm2Data({
                                  ...form2Data,
                                  dateBankReconciliation: new Date(
                                    event
                                  ).getTime(),
                                })
                              }
                              name={"dateBankReconciliation"}
                              value={
                                form2Data.dateBankReconciliation
                                  ? new Date(form2Data.dateBankReconciliation)
                                  : ""
                              }
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                : form2Data.generalAccountNames.map((e, index) => {
                    return (
                      <React.Fragment key={index}>
                        <div key={index}>
                          <label className="mt-2">{e.name}</label>
                          <div className="d-flex flex-wrap form-group flex-row m-0">
                            {YesOrNo("bankReconciliationCompleted", 2.1)}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
            </li>
          </div>
          <div className="col-md-4 text-end">
            <img src={generalAccountChecklist}></img>
          </div>
          <div className="col-md-12">
            {form2Data.fillAllDetails && (
              <Alert
                className="fw-bold d-flex justify-content-center w-100"
                variant="warning"
              >
                Please fill all fields To Proceed
              </Alert>
            )}
            <div className="btnGroup justify-content-between">
              {/* <button
                className="btn btnPrimary m-0 blue rounded-pill"
                onClick={previousPage}
                disabled={true}
              >
                Previous
              </button> */}
              <div></div>
              <button
                className="btn btnPrimary blue rounded-pill"
                type="submit"
              >
                Save & Next
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const form2second = (typeOfList, formNumber) => {
    return (
      <div
        ref={(divElement) => {
          if (activeStep === formNumber) {
            assignRef(divElement, activeForm, formNumber);
          }
        }}
      >
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            activeForm={activeForm}
            list={typeOfList}
            type="checklist"
            setActiveStepFunc={(e) => setActiveStep(e)}
          ></OnboardingSteps>
        </div>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();

            const lengthOfValues = Object.values(form2Data.options.subForm2);
            const valuesAreYesForEvery = checkIfValueInArrayInEvery(
              lengthOfValues,
              "Yes"
            );
            const valuesAreEmptyForSome = checkIfValueInArrayInSome(
              lengthOfValues,
              ""
            );

            if (valuesAreEmptyForSome) {
              setForm2Data({ ...form2Data, fillAllDetails: true });
            } else {
              const obj = {
                ...form2Data,
                ...generalAccountTableInfo,
                fillAllDetails: false,
                generalAccountNames,
              };

              postForGeneralObj(obj);
            }
          }}
        >
          <div className="row">
            <div className="col-md-12">
              <div className="titleHeader">
                <div className="innerTitle">
                  <span>{getSvg("compiled all your documents")}</span>
                  <label>Great. You have compiled all your documents</label>
                </div>
                <div className="taskTypeTitle">Detail</div>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <li className="blank"></li>
            <li className="blank"></li>
            <li className="blank"></li>
            <li className="blank"></li>
            <li className="blank"></li>
            <li>
              Please confirm the closing balance for the operating account
              <NumberFormat
                className="form-control"
                value={form2Data.comments.endingBalance}
                inputMode="numeric"
                thousandSeparator={true}
                decimalScale={3}
                defaultValue={0}
                prefix={"$"}
                name="endingBalance"
                onChange={(e) => {
                  setForm2Data({
                    ...form2Data,
                    comments: {
                      ...form2Data.comments,
                      endingBalance: e.target.value.replace(/[\$,]/g, ""),
                    },
                  });
                }}
              />
            </li>

            <div className="form-group">
              <li>
                Details of bank reconciliation are as follows:
                <ol>
                  {/* <li>
                    Overview
                    <ol> */}
                  <li>
                    Overview of bank reconciliation
                    <div className="tableOuter m-0 mt-2 mb-3 addTaskGrid">
                      <table className="table customGrid">
                        <thead>
                          <tr>
                            <th>Cash Book balance</th>
                            <th>Bank statements</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              {generalAccountTableInfo?.closingBalanceCashback ===
                              null
                                ? "--------"
                                : removeNegSignAndWrapInBracketsWith2Fraction(
                                    generalAccountTableInfo?.closingBalanceCashback
                                  )}
                            </td>
                            <td>
                              {form2Data.comments.endingBalance
                                ? removeNegSignAndWrapInBracketsWith2Fraction(
                                    form2Data.comments.endingBalance
                                  )
                                : "----------"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </li>

                  <li>
                    Have you reviewed the uncleared deposits? Are there uncashed
                    cheques (Deposits) that are outstanding for more than two
                    months? <br />
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("outStandingMorethen2ques1", 2.2)}
                    </div>
                    {form2Data.options.subForm2["outStandingMorethen2ques1"] ===
                      "Yes" && (
                      <div className="form-group">
                        Outstanding deposits not due to timing differences merit
                        your immediate attention
                      </div>
                    )}
                  </li>

                  <li>
                    Details of uncleared payments in undeposited accounts:
                    {/* <p> { generalundepositFund.reduce((acc, element) => acc + element.amount, 0)
                         } </p> */}
                    <div
                      className="tableOuter m-0 mt-2 mb-3 addTaskGrid"
                      style={{
                        maxHeight: "400px",
                      }}
                    >
                      <table className="table customGrid">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Amount</th>
                          </tr>
                        </thead>

                        <tbody>
                          {generalundepositFund.map((element, index) => {
                            return (
                              <tr>
                                <td>
                                  {momentFunction.formatDate(element.date)}
                                </td>
                                <td>{element.name}</td>
                                <td>{element.memo}</td>
                                <td>
                                  {removeNegSignAndWrapInBracketsWith2Fraction(
                                    element.amount
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </li>

                  {/* </ol>


                  </li> */}
                </ol>
              </li>
              <li>
                Have you reviewed the uncleared payments? Are there any
                stale-dated cheques listed under the outstanding cheque list?{" "}
                <br />
                <div className="d-flex flex-wrap form-group flex-row m-0">
                  {YesOrNo("outStandingMorethen2ques2", 2.2)}
                </div>
                {form2Data.options.subForm2["outStandingMorethen2ques2"] ===
                  "Yes" && (
                  <div className="form-group">
                    You may consider re-issuing the cheque(s) to your client(s).
                  </div>
                )}
              </li>

              <li>
                Other Details
                <ol>
                  <li>
                    Are all source documents available for the general
                    transactions during the month?
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            className={`${
                              form2Data.options.subForm2
                                .SequentiallyNumberedCheques === "" &&
                              form2Data.fillAllDetails
                                ? "text-error"
                                : ""
                            }`}
                          >
                            Sequentially numbered cheques
                          </label>
                          <div className="d-flex flex-wrap">
                            {YesOrNo("SequentiallyNumberedCheques", 2.2, true)}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            className={`${
                              form2Data.options.subForm2.vendorInvoices ===
                                "" && form2Data.fillAllDetails
                                ? "text-error"
                                : ""
                            }`}
                          >
                            Vendor invoices
                          </label>
                          <div className="d-flex flex-wrap">
                            {YesOrNo("vendorInvoices", 2.2, true)}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            className={`${
                              form2Data.options.subForm2
                                .BackupsForInternalApprovals === "" &&
                              form2Data.fillAllDetails
                                ? "text-error"
                                : ""
                            }`}
                          >
                            Back-ups for internal approvals
                          </label>
                          <div className="d-flex flex-wrap">
                            {YesOrNo("BackupsForInternalApprovals", 2.2, true)}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            className={`${
                              form2Data.options.subForm2
                                .CancelledVoidedCheques === "" &&
                              form2Data.fillAllDetails
                                ? "text-error"
                                : ""
                            }`}
                          >
                            Cancelled and voided cheques
                          </label>
                          <div className="d-flex flex-wrap">
                            {YesOrNo("CancelledVoidedCheques", 2.2, true)}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            className={`${
                              form2Data.options.subForm2.BillsForServiceFees ===
                                "" && form2Data.fillAllDetails
                                ? "text-error"
                                : ""
                            }`}
                          >
                            Bills for service fees and disbursements
                          </label>
                          <div className="d-flex flex-wrap">
                            {YesOrNo("BillsForServiceFees", 2.2, true)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li
                    className={`${
                      form2Data.options.subForm2.allGeneralChequesSigned ===
                        "" && form2Data.fillAllDetails
                        ? "text-error"
                        : ""
                    }`}
                  >
                    Are all general cheques signed by the authorised
                    signatories.
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("allGeneralChequesSigned", 2.2, true)}
                    </div>
                  </li>
                  <li
                    className={`${
                      form2Data.options.subForm2.allSupportingDocumentation ===
                        "" && form2Data.fillAllDetails
                        ? "text-error"
                        : ""
                    }`}
                  >
                    Are all supporting documentation reviewed prior to signing
                    the general cheques.
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("allSupportingDocumentation", 2.2, true)}
                    </div>
                  </li>
                  <li
                    className={`${
                      form2Data.options.subForm2.madeAllVendorPayments === "" &&
                      form2Data.fillAllDetails
                        ? "text-error"
                        : ""
                    }`}
                  >
                    Have you made all your vendor payments?
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("madeAllVendorPayments", 2.2, true)}
                    </div>
                  </li>
                </ol>
              </li>
            </div>
          </div>
          <div className="col-md-4 text-end">
            <img src={generalAccountDetails}></img>
          </div>
          <div className="col-md-12">
            {form2Data.fillAllDetails && (
              <Alert
                className="fw-bold d-flex justify-content-center w-100"
                variant="warning"
              >
                Please fill all fields To Proceed
              </Alert>
            )}
            <div className="btnGroup justify-content-between">
              <button
                onClick={previousPage}
                className="btn btnPrimary m-0 blue rounded-pill"
              >
                Previous
              </button>
              <button
                className="btn btnPrimary blue rounded-pill"
                type="submit"
              >
                Save & Next
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const postToCardDB = async (obj) => {
    setForm3Data(obj);

    const cardObj = {
      task_id: getMonthlyChecklistId(),
      credit_cards: obj,
    };

    const response = await postToDB("card", cardObj);
    if (response.data.data.code === 200) {
      nextStep();
    } else {
      alert("Server Error");
    }
  };

  const form3 = (typeOfList, formNumber) => {
    return (
      <div
        ref={(divElement) => {
          if (activeStep === formNumber) {
            assignRef(divElement, activeForm, formNumber);
          }
        }}
      >
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            activeForm={activeForm}
            list={typeOfList}
            type="checklist"
            setActiveStepFunc={(e) => setActiveStep(e)}
          ></OnboardingSteps>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="titleHeader">
              <div className="innerTitle">
                <span>{getSvg("Lets get started")}</span>
                <label>Let's get started</label>
              </div>

              <div className="taskTypeTitle">
                {taskStatus.task_type === "Trust A/C checklist"
                  ? "Trust A/C"
                  : taskStatus.task_type === "General A/C checklist"
                  ? "General A/C"
                  : "Credit Cards"}
              </div>
            </div>
          </div>
        </div>
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();

            const lengthOfValues = Object.values(form3Data.options.subForm1);
            const valuesAreYesForEvery = checkIfValueInArrayInEvery(
              lengthOfValues,
              "Yes"
            );
            const valuesAreEmptyForSome = checkIfValueInArrayInSome(
              lengthOfValues,
              ""
            );

            if (valuesAreEmptyForSome) {
              setForm3Data({ ...form3Data, fillAllDetails: true });
            } else {
              setForm3Data({ ...form3Data, fillAllDetails: false });

              const obj = {
                ...form3Data,
                fillAllDetails: false,
                creditAccountNames,
              };

              postToCardDB(obj);
            }
          }}
        >
          <div className="col-md-8">
            <li
              className={`${
                form3Data.options.subForm1.receivedCreditCard === "" &&
                form3Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you received your credit card statements for {dateMonth}?
              {creditAccountNames.map((e, index) => {
                return (
                  <div
                    key={index}
                    className="d-flex flex-wrap form-group flex-row m-0"
                  >
                    {YesOrNo("receivedCreditCard", 3.1)}
                  </div>
                );
              })}
            </li>
            <li
              className={`${
                form3Data.options.subForm1.creditCardStatementsSaved === "" &&
                form3Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you saved your credit card statements on your local
              drive/sharepoint?
              {creditAccountNames.map((e, index) => {
                return (
                  <div
                    key={index}
                    className="d-flex flex-wrap form-group flex-row m-0"
                  >
                    {YesOrNo("creditCardStatementsSaved", 3.1)}
                  </div>
                );
              })}
            </li>
            <li
              className={`${
                form3Data.options.subForm1
                  .confirmBankReconciliationcompleted === "" &&
                form3Data.fillAllDetails
                  ? "text-error"
                  : ""
              }`}
            >
              Have you reconciled the credit card balance?
              {creditAccountNames.map((e, index) => {
                return (
                  <React.Fragment key={index}>
                    <div className="d-flex flex-wrap form-group flex-row m-0">
                      {YesOrNo("confirmBankReconciliationcompleted", 3.1)}
                    </div>
                  </React.Fragment>
                );
              })}
              {form3Data.options.subForm1[
                "confirmBankReconciliationcompleted"
              ] === "Yes" && (
                <div
                  className="form-group col-md-6"
                  style={{ marginLeft: "-13px" }}
                >
                  <DatePicker
                    dayPlaceholder="DD"
                    monthPlaceholder="MM"
                    yearPlaceholder="YY"
                    format="MM/ dd/ yy"
                    minDate={new Date("December 17, 1901 00:00:00")}
                    maxDate={new Date("December 17, 2300 00:00:00")}
                    onChange={(event) =>
                      setForm3Data({
                        ...form3Data,
                        dateBankReconciliation: new Date(event).getTime(),
                      })
                    }
                    name={"dateBankReconciliation"}
                    value={
                      form3Data.dateBankReconciliation
                        ? new Date(form3Data.dateBankReconciliation)
                        : ""
                    }
                  />
                </div>
              )}
            </li>
          </div>
          <div className="col-md-4 text-end">
            <img src={creditCardChecklist}></img>
          </div>
          <div className="col-md-12">
            {form3Data.fillAllDetails && (
              <Alert
                className="fw-bold d-flex justify-content-center  w-100 mt-4"
                variant="warning"
              >
                Please fill all fields To Proceed
              </Alert>
            )}
            <div className="btnGroup justify-content-between">
              <div></div>
              <button
                className="btn btnPrimary blue rounded-pill"
                type="submit"
              >
                Save & Next
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const assignRef = (element, activeForm, formNumber) => {
    switch (formNumber) {
      case 1:
        ref1 = element;
        break;
      case 2:
        ref2 = element;
        break;
      case 3:
        ref3 = element;
        break;
      case 4:
        ref4 = element;
        break;
      case 5:
        ref5 = element;
        break;

      default:
        break;
    }
  };

  const form5 = (typeOfList, formNumber) => {
    const handleTrustSubmit = () => {
      const monthAndYear = getMonthlyChecklistMonth();
      const fullDateStarting = 1 + " " + monthAndYear;
      const fullDateEnding =
        lastDateOfTheMonth(new Date(fullDateStarting).getMonth()) +
        " " +
        monthAndYear;

      if (isFormDisabled || completedSteps > formNumber) {
        nextStep();
      } else if (
        trustAccountNames.length !== 0 &&
        !isFormDisabled &&
        completedSteps > formNumber - 1
      ) {
        const obj = {
          requested_by_user: getUserId(),
          subscriber_id: getUserSID(),
          request_type: 0,
          report_type: 0,
          batch_id: getMonthlyChecklistId() + "_" + Math.random().toString(),
          from_date: account_fromdate.current,
          to_date: account_todate.current,
          category: [
            {
              account_value: {
                id: trustAccountNames[0].account_id,
                value: trustAccountNames[0].name,
              },
              matter_owner_value: {
                id: "",
                value: "All",
              },
              collection: [
                {
                  id: 1,
                  label: "Trust Receipts Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 2,
                  label: "Trust Disbursements Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 3,
                  label: "Trust Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 4,
                  label: "Trust Listing",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Hide Clients With Zero Balance",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 3,
                      label: "Show Clients With Status",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 4,
                      label: "Show Clients With Last Activity Date",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 5,
                      label: "Show Clients With Over Drawn Accounts",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 5,
                  label: "Client Trust Ledger",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Hide Clients With Zero Balance",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 3,
                      label: "Show Clients With Active Matters Only",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 4,
                      label: "Show Clients With Over Drawn Accounts",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 11,
                  label: "Trust Transfer",
                  selected: true,
                  options: [],
                },
                {
                  id: 12,
                  label: "Three Way Reconciliation",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: true,
                      value: form1Data.comments.endingBalance || "All",
                    },
                  ],
                },
                {
                  id: 13,
                  label: "Trust Reconciliation Report",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: true,
                      value: form1Data.comments.endingBalance || "All",
                    },
                  ],
                },
              ],
            },
            {
              account_value: {
                id: "",
                value: "",
              },
              matter_owner_value: {
                id: "",
                value: "",
              },
              collection: [
                {
                  id: 6,
                  label: "General Receipts Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 7,
                  label: "General Disbursements Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 8,
                  label: "General Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 9,
                  label: "Client's General Journal",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 14,
                  label: "General Reconciliation Report",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
              ],
            },
            {
              account_value: {
                id: "",
                value: "",
              },
              matter_owner_value: {
                id: "",
                value: "",
              },
              collection: [
                {
                  id: 10,
                  label: "Fees Book",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Show Clients With All Columns",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
              ],
            },
          ],
        };

        axios
          .post("/report/collection", obj)
          .then(async (res) => {
            if (res.data.data.code === 200) {
              const postData = await postToDB("trust", {
                task_id: getMonthlyChecklistId(),
                reports: {
                  batch_id: res.data.data.body.batchno,
                },
              });

              if (postData.data.data.code === 200) {
                setTaskStatus({
                  ...taskStatus,
                  batch_id: res.data.data.body.batchno,
                });

                setCompletedSteps(completedSteps + 1);
              }
            }
          })
          .catch((err) => {
            console.log("err", err);
          });
      } else {
        toast.error("Select trust reports");
        setTaskStatus({
          ...taskStatus,
          reportsError: "Please select an Account To Proceed",
        });
      }
    };
    return (
      <>
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            activeForm={activeForm}
            list={typeOfList}
            type="checklist"
            setActiveStepFunc={(e) => setActiveStep(e)}
          ></OnboardingSteps>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="titleHeader">
              <div className="innerTitle">
                <span>{getSvg("generate your reports")}</span>
                <label>Great. Ready to generate your reports...</label>
              </div>

              <div className="taskTypeTitle">Reports</div>
            </div>
          </div>
        </div>

        <div
          className="row"
          ref={(divElement) => {
            if (activeStep === formNumber) {
              assignRef(divElement, activeForm, formNumber);
            }
          }}
        >
          <div className="col-md-8">
            {typeOfList === stepsInfoForm1 ? (
              <div className="form-group">
                <label className="heading">Section B</label>
                <label>
                  The monthly Law Society compliance reports for the month of{" "}
                  {taskStatus.task_month} are as follows:
                </label>
                <ol className="text mt-2">
                  <li>Trust Receipts Journal</li>
                  <li>Trust Disbursements Journal</li>
                  <li>Trust Journal</li>
                  <li>Trust Listing</li>
                  <li>Client Trust Ledger</li>
                  <li>Trust Transfer</li>
                  <li>Three Way Reconciliation</li>
                  <li>Trust Reconciliation Report</li>
                </ol>
                {taskStatus.batch_id && (
                  <>
                    <Alert
                      className="d-flex flex-column align-items-start justify-content-center"
                      variant={"primary"}
                    >
                      {/* Please wait-Report download is in progress */}Download
                      Reports
                    </Alert>
                    {!taskStatus.reportsReadyForDownloading && (
                      <button
                        onClick={checkReportStatus}
                        className="btn btnPrimary blue"
                      >
                        Check Report Status
                      </button>
                    )}
                    {taskStatus.reportsReadyForDownloading && (
                      <button
                        onClick={downloadReports}
                        className="btn btnPrimary blue"
                      >
                        Download Reports
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : typeOfList === stepsInfoForm2 ? (
              <div className="form-group">
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>

                <li>
                  The monthly Law Society compliance reports for the month of{" "}
                  {taskStatus.task_month} are as follows:
                  <ol start="1">
                    <li>General Receipts Journal</li>
                    <li className="mt-0">General Disbursements Journal</li>
                    <li className="mt-0">General Journal</li>
                    <li className="mt-0">Client's General Journal</li>
                    <li className="mt-0">General Reconciliation Report</li>
                    <li className="mt-0">Fees Book</li>
                  </ol>
                </li>
                <ModalInputCenter
                  changeShow={() => setDownloadReportModal(false)}
                  show={downloadReportModal}
                  cancelOption="Ok"
                  heading={"Report generation details"}
                  handleClick={() => {}}
                >
                  <h4 style={{ fontSize: "16px" }}>
                    Reports are being generated and will be available in Report
                    History in some time.
                  </h4>
                </ModalInputCenter>
                {!taskStatus.reportsReadyForDownloading ? (
                  <button
                    className="btn btnPrimary mt-2 rounded-pill blue mb-3"
                    type="submit"
                    disabled={processing}
                    onClick={(e) => {
                      const monthAndYear = getMonthlyChecklistMonth();

                      const fullDateStarting = 1 + " " + monthAndYear;
                      const fullDateEnding =
                        lastDateOfTheMonth(
                          new Date(fullDateStarting).getMonth()
                        ) +
                        " " +
                        monthAndYear;
                      if (isFormDisabled || completedSteps > formNumber) {
                        // nextStep();
                      } else if (generalAccountNames !== null) {
                        const obj = {
                          requested_by_user: getUserId(),
                          subscriber_id: getUserSID(),
                          request_type: 0,
                          report_type: 0,
                          batch_id:
                            getMonthlyChecklistId() +
                            "_" +
                            Math.random().toString(),
                          from_date: account_fromdate.current,
                          to_date: account_todate.current,
                          category: [
                            {
                              account_value: {
                                id: generalAccountNames[0].account_id,
                                value: taskStatus.task_type_account,
                              },
                              matter_owner_value: {
                                id: "",
                                value: "All",
                              },
                              collection: [
                                {
                                  id: 1,
                                  label: "Trust Receipts Journal",
                                  selected: false,
                                  options: [],
                                },
                                {
                                  id: 2,
                                  label: "Trust Disbursements Journal",
                                  selected: false,
                                  options: [],
                                },
                                {
                                  id: 3,
                                  label: "Trust Journal",
                                  selected: false,
                                  options: [],
                                },
                                {
                                  id: 4,
                                  label: "Trust Listing",
                                  selected: false,
                                  options: [
                                    {
                                      id: 1,
                                      label: "Show Specific Clients",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 2,
                                      label: "Hide Clients With Zero Balance",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 3,
                                      label: "Show Clients With Status",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 4,
                                      label:
                                        "Show Clients With Last Activity Date",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 5,
                                      label:
                                        "Show Clients With Over Drawn Accounts",
                                      selected: false,
                                      value: "All",
                                    },
                                  ],
                                },
                                {
                                  id: 5,
                                  label: "Client Trust Ledger",
                                  selected: false,
                                  options: [
                                    {
                                      id: 1,
                                      label: "Show Specific Clients",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 2,
                                      label: "Hide Clients With Zero Balance",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 3,
                                      label:
                                        "Show Clients With Active Matters Only",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 4,
                                      label:
                                        "Show Clients With Over Drawn Accounts",
                                      selected: false,
                                      value: "All",
                                    },
                                  ],
                                },
                                {
                                  id: 11,
                                  label: "Trust Transfer",
                                  selected: false,
                                  options: [],
                                },
                                {
                                  id: 12,
                                  label: "Three Way Reconciliation",
                                  selected: false,
                                  options: [
                                    {
                                      id: 1,
                                      label:
                                        "Enter Ending bank statement balance",
                                      selected: false,
                                      value: "All",
                                    },
                                  ],
                                },
                                {
                                  id: 13,
                                  label: "Trust Reconciliation Report",
                                  selected: false,
                                  options: [
                                    {
                                      id: 1,
                                      label:
                                        "Enter Ending bank statement balance",
                                      selected: false,
                                      value: "All",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              account_value: {
                                id: generalAccountNames[0].account_id,
                                value: taskStatus.task_type_account,
                              },
                              matter_owner_value: {
                                id: "",
                                value: "",
                              },
                              collection: [
                                {
                                  id: 6,
                                  label: "General Receipts Journal",
                                  selected: true,
                                  options: [],
                                },
                                {
                                  id: 7,
                                  label: "General Disbursements Journal",
                                  selected: true,
                                  options: [
                                    {
                                      id: 1,
                                      label:
                                        "Enter Ending bank statement balance",
                                      selected: true,
                                      value:
                                        form2Data.comments.endingBalance ||
                                        "All",
                                    },
                                  ],
                                },
                                {
                                  id: 8,
                                  label: "General Journal",
                                  selected: true,
                                  options: [],
                                },
                                {
                                  id: 9,
                                  label: "Client's General Journal",
                                  selected: true,
                                  options: [
                                    {
                                      id: 1,
                                      label: "Show Specific Clients",
                                      selected: false,
                                      value: "All",
                                    },
                                  ],
                                },
                                {
                                  id: 14,
                                  label: "General Reconciliation Report",
                                  selected: true,
                                  options: [
                                    {
                                      id: 1,
                                      label:
                                        "Enter Ending bank statement balance",
                                      selected: true,
                                      //pass ending balance in all 4.
                                      value:
                                        form2Data.comments.endingBalance ||
                                        "All",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              account_value: {
                                id: "",
                                value: "Others",
                              },
                              matter_owner_value: {
                                id: "",
                                value: "All",
                              },
                              collection: [
                                {
                                  id: 10,
                                  label: "Fees Book",
                                  selected: true,
                                  options: [
                                    {
                                      id: 1,
                                      label: "Show Specific Clients",
                                      selected: false,
                                      value: "All",
                                    },
                                    {
                                      id: 2,
                                      label: "Show Clients With All Columns",
                                      selected: false,
                                      value: "All",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        };
                        console.log("✌️resobj --->", obj);

                        axios
                          .post("/report/collection", obj)
                          .then(async (res) => {
                            console.log("✌️resobj --->", res);

                            if (res.data.data.code === 200) {
                              const postData = await postToDB("general", {
                                task_id: getMonthlyChecklistId(),
                                reports: {
                                  batch_id: res.data.data.body.batchno,
                                },
                              });

                              if (postData.data.data.code === 200) {
                                setTaskStatus({
                                  ...taskStatus,
                                  batch_id: res.data.data.body.batchno,
                                });

                                // setCompletedSteps(completedSteps + 1);
                              }
                              setDownloadReportModal(true);
                              setProcessing(true);
                            }
                          })
                          .catch((err) => {
                            console.log("err", err);
                          });
                      } else {
                      }
                    }}
                  >
                    Generate Reports
                  </button>
                ) : (
                  <button
                    className="btn btnPrimary green rounded-pill"
                    onClick={downloadReports}
                  >
                    Download Reports
                  </button>
                )}
                {downloadStatus && (
                  <ModalInputCenter
                    heading="Reports Download Status"
                    cancelOption="Ok"
                    handleClick={(e) => {
                      e.preventDefault();
                      const link = document.createElement("a");
                      link.href = taskStatus.reportsDownloadURL;
                      link.download = taskStatus.batch_id;
                      link.click();
                    }}
                    changeShow={() => {
                      setTaskStatus({
                        ...taskStatus,
                        showReportDownloadAlert: false,
                      });
                      setDownloadStatus(false);
                    }}
                    show={taskStatus.showReportDownloadAlert}
                    action=""
                  >
                    {taskStatus.reportDownloadStatus}
                  </ModalInputCenter>
                )}
                {taskStatus.batch_id && (
                  <>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="titleHeader mb-0 mt-2">
                          <div className="innerTitle">
                            <span>{getSvg("Upcoming tax filing")}</span>
                            <label>Upcoming tax filing dates...</label>
                          </div>

                          <div className="taskTypeTitle"></div>
                        </div>
                      </div>
                    </div>
                    <div className="tableOuter m-0 mt-2 mb-4 addTaskGrid">
                      <table className="table customGrid">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Filing Frequency</th>
                            <th>Reporting Period</th>
                            <th>Filing Deadline</th>
                            <th>Payment Deadline</th>
                          </tr>
                        </thead>

                        {form6Data?.taxFilingDetails?.length ? (
                          <tbody>
                            {isFormDisabled
                              ? taskStatus?.taxFiling?.taxFilingDetails?.map(
                                  (e, index) => {
                                    return getAllUserInfo().province === "ON" &&
                                      index === 0 ? null : getAllUserInfo()
                                        .province === "BC" &&
                                      index === 1 ? null : (
                                      <tr key={index}>
                                        <td>{e.type}</td>
                                        <td>{e.filingFrequency}</td>
                                        <td>
                                          {momentFunction.removeDayFromDate(
                                            e.reportingPeriod
                                          )}
                                        </td>
                                        <td>
                                          {momentFunction.removeDayFromDate(
                                            e.filingDeadline
                                          )}
                                        </td>
                                        <td>
                                          {momentFunction.removeDayFromDate(
                                            e.paymentDeadline
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )
                              : form6Data.taxFilingDetails.map((e, index) => {
                                  return getAllUserInfo().province === "ON" &&
                                    index === 0 ? null : getAllUserInfo()
                                      .province === "BC" &&
                                    index === 1 ? null : (
                                    <tr key={index}>
                                      <td>{e.type}</td>
                                      <td>{e.filingFrequency}</td>
                                      <td>
                                        {momentFunction.removeDayFromDate(
                                          e.reportingPeriod
                                        )}
                                      </td>
                                      <td>
                                        {momentFunction.removeDayFromDate(
                                          e.filingDeadline
                                        )}
                                      </td>
                                      <td>
                                        {momentFunction.removeDayFromDate(
                                          e.paymentDeadline
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                          </tbody>
                        ) : (
                          <tbody>
                            <tr>
                              <td className="text-center ps-0 pe-0" colSpan="5">
                                No tax filing for this month
                              </td>
                            </tr>
                          </tbody>
                        )}
                      </table>
                    </div>

                    {/* general */}
                    <div className="innerTitle">
                      <span>{getSvg("sign off")}</span>
                      <label>Almost there, please sign off..</label>
                    </div>
                    <div className="form-group">
                      <label>
                        Name of preparer:&nbsp; {taskStatus.task_preparer_name}
                        <SignOffButton
                          disabledVal={
                            isFormDisabled || taskStatus.task_preparer_signoff
                              ? "disabled"
                              : taskStatus.task_preparer !== getUserId() &&
                                "disabled"
                          }
                          styles={`btn btnPrimary blue ${
                            isFormDisabled || taskStatus.task_preparer_signoff
                              ? "disabled"
                              : taskStatus.task_preparer !== getUserId() &&
                                "disabled"
                          }`}
                          onClickFunc={async (event) => {
                            event.preventDefault();

                            const postSignOffPreparer = await axios.post(
                              `/signoff/task/PREPARER`,
                              {
                                task_id: taskStatus.id,
                              }
                            );

                            if (postSignOffPreparer.data.data.code === 200) {
                              setTaskStatus((e) => ({
                                ...taskStatus,
                                task_preparer_signoff_date:
                                  new Date().toISOString(),
                                task_preparer_signoff: 1,
                                preparerSignOffError: "",
                              }));

                              setTimeout(() => {
                                Cookies.set(
                                  "checklistId",
                                  JSON.stringify(taskStatus)
                                );
                              }, 1000);
                            } else {
                              setTaskStatus(() => ({
                                ...taskStatus,
                                preparerSignOffError:
                                  "Preparer Sign Off Failed",
                              }));
                            }
                          }}
                        >
                          Sign Off
                        </SignOffButton>
                      </label>
                      {taskStatus.preparerSignOffError && (
                        <span className="text text-danger">
                          {taskStatus.preparerSignOffError}
                        </span>
                      )}
                      {taskStatus.task_preparer_signoff !== 1 &&
                        taskStatus.task_preparer !== getUserId() && (
                          <span className="text text-primary-color">
                            Log in with preparer {taskStatus.task_preparer_name}{" "}
                            to Sign
                          </span>
                        )}
                      {taskStatus.task_preparer_signoff === 1 && (
                        <span className="text text-success">
                          Preparer Sign Off Done at{" "}
                          {momentFunction.formatDate(
                            taskStatus.task_preparer_signoff_date
                          )}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        Name of Approver:&nbsp;
                        {getMonthlyChecklistDetails().task_approverer_name}
                        <SignOffButton
                          disabledVal={
                            isFormDisabled ||
                            taskStatus.task_approverer_signoff ||
                            taskStatus.task_preparer_signoff === 0
                              ? "disabled"
                              : taskStatus.task_approverer !== getUserId() &&
                                "disabled"
                          }
                          styles={`btn btnPrimary blue  
                            ${
                              isFormDisabled ||
                              taskStatus.task_approverer_signoff ||
                              taskStatus.task_preparer_signoff === 0
                                ? "disabled"
                                : taskStatus.task_approverer !== getUserId() &&
                                  "disabled"
                            }`}
                          onClickFunc={async (event) => {
                            event.preventDefault();

                            const postSignOffApprover = await axios.post(
                              `/signoff/task/REVIEWER`,
                              {
                                task_id: monthlyChecklistID,
                              }
                            );

                            console.log(
                              "postSignOffApproverD",
                              postSignOffApprover
                            );

                            if (postSignOffApprover.data.data.code === 200) {
                              setTaskStatus((e) => ({
                                ...taskStatus,
                                approverSignOffError: "",
                                task_approverer_signoff: 1,
                                task_approverer_signoff_date:
                                  new Date().toISOString(),
                              }));

                              // PDF generation removed

                              setTimeout(() => {
                                Cookies.set(
                                  "checklistId",
                                  JSON.stringify(taskStatus)
                                );
                              }, 1000);
                            } else {
                              setTaskStatus(() => ({
                                ...taskStatus,
                                approverSignOffError:
                                  "Approver Sign Off Failed",
                              }));
                            }
                          }}
                        >
                          Sign Off
                        </SignOffButton>
                      </label>
                      {taskStatus.approverSignOffError !== "" && (
                        <span className="text text-danger">
                          {taskStatus.approverSignOffError}
                        </span>
                      )}
                      {taskStatus.task_approverer_signoff === 0 &&
                        taskStatus.task_preparer_signoff === 1 &&
                        taskStatus.task_approverer !== getUserId() && (
                          <span className="text text-primary-color">
                            Log in with approver{" "}
                            {taskStatus.task_approverer_name} to Sign
                          </span>
                        )}
                      {taskStatus.task_approverer_signoff === 0 &&
                        taskStatus.task_approverer !== getUserId() &&
                        taskStatus.task_preparer_signoff === 0 && (
                          <span className="text text-primary-color">
                            Preparer Sign Off needed first
                          </span>
                        )}
                      {taskStatus.task_approverer_signoff === 0 &&
                        taskStatus.task_approverer === getUserId() &&
                        taskStatus.task_preparer_signoff === 0 && (
                          <span className="text text-primary-color">
                            Preparer Sign Off needed first
                          </span>
                        )}
                      {taskStatus.task_approverer_signoff === 1 && (
                        <span className="text text-success">
                          Approver Sign Off Done at{" "}
                          {momentFunction.formatDate(
                            taskStatus.task_approverer_signoff_date
                          )}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li>
                  Please, confirm the credit card statement balance
                  <NumberFormat
                    value={form3Data.comments.endingBalance}
                    className="form-control"
                    inputMode="numeric"
                    thousandSeparator={true}
                    decimalScale={3}
                    defaultValue={0}
                    prefix={"$"}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/[^\d.]+/, "");
                      setForm3Data({
                        ...form3Data,
                        comments: {
                          ...form3Data.comments,
                          endingBalance: inputValue.replace(/[\$,]/g, ""),
                        },
                      });
                    }}
                  />
                </li>

                <div className="form-group">
                  <li>
                    The monthly report for the month of {taskStatus.task_month}{" "}
                    is as follows:
                  </li>
                  <ol className="text mt-2">
                    <li>Credit Card Reconciliation</li>
                  </ol>
                  <ModalInputCenter
                    changeShow={() => setDownloadReportModal(false)}
                    show={downloadReportModal}
                    cancelOption="Ok"
                    heading={"Report generation details"}
                    handleClick={() => {}}
                  >
                    <h4 style={{ fontSize: "16px" }}>
                      Reports are being generated and will be available in
                      Report History in some time.
                    </h4>
                  </ModalInputCenter>
                  {!taskStatus.reportsReadyForDownloading ? (
                    <button
                      disabled={processing}
                      onClick={async (e) =>
                        // nextStep
                        {
                          const monthAndYear = getMonthlyChecklistMonth();

                          const fullDateStarting = 1 + " " + monthAndYear;
                          const fullDateEnding =
                            lastDateOfTheMonth(
                              new Date(fullDateStarting).getMonth()
                            ) +
                            " " +
                            monthAndYear;
                          const obj = {
                            ...form3Data,
                            fillAllDetails: false,
                            creditAccountNames,
                          };

                          setForm3Data(obj);

                          const cardObj = {
                            task_id: getMonthlyChecklistId(),
                            credit_cards: obj,
                          };

                          await postToDB("card", cardObj);
                          if (isFormDisabled || completedSteps > formNumber) {
                          } else if (
                            creditAccountNames.length !== 0 &&
                            !isFormDisabled &&
                            completedSteps > formNumber - 1
                          ) {
                            const obj = {
                              requested_by_user: getUserId(),
                              subscriber_id: getUserSID(),
                              from_date: account_fromdate.current,
                              to_date: account_todate.current,
                              report_type: 0,
                              batch_id:
                                getMonthlyChecklistId() +
                                "_" +
                                Math.random().toString(),
                              category: [
                                {
                                  account_value: {
                                    id: creditAccountNames[0].account_id,
                                    value: creditAccountNames[0].name,
                                  },
                                  matter_owner_value: {
                                    id: "",
                                    value: "All",
                                  },
                                  collection: [
                                    {
                                      id: 1,
                                      label: "Trust Receipt Journal",
                                      selected: false,
                                      options: [],
                                    },
                                    {
                                      id: 2,
                                      label: "Trust Disbursement Journal",
                                      selected: false,
                                      options: [],
                                    },
                                    {
                                      id: 3,
                                      label: "Trust Journal",
                                      selected: false,
                                      options: [],
                                    },
                                    {
                                      id: 4,
                                      label: "Trust Listing",
                                      selected: false,
                                      options: [
                                        {
                                          id: 1,
                                          label: "Show Specific Client",
                                          selected: false,
                                          value: "All",
                                        },
                                        {
                                          id: 2,
                                          label:
                                            "Show Clients With Zero Balance",
                                          selected: false,
                                          value: "All",
                                        },
                                        {
                                          id: 3,
                                          label:
                                            "Show Clients With Matter Status",
                                          selected: false,
                                          value: "All",
                                        },
                                        {
                                          id: 4,
                                          label:
                                            "Show Clients With Last Activity Date",
                                          selected: false,
                                          value: "All",
                                        },
                                        {
                                          id: 5,
                                          label:
                                            "Show Clients With Over Drawn Accounts",
                                          selected: false,
                                          value: "All",
                                        },
                                      ],
                                    },
                                    {
                                      id: 5,
                                      label: "Client Trust Ledger",
                                      selected: false,
                                      options: [
                                        {
                                          id: 1,
                                          label: "Show Specific Clients",
                                          selected: false,
                                          value: "All",
                                        },
                                        {
                                          id: 2,
                                          label:
                                            "Show Clients With Zero Balance",
                                          selected: false,
                                          value: "All",
                                        },
                                        {
                                          id: 3,
                                          label:
                                            "Show Clients With Active Matters",
                                          selected: false,
                                          value: "All",
                                        },
                                        {
                                          id: 4,
                                          label:
                                            "Show Clients With Over Drawn Accounts",
                                          selected: false,
                                          value: "All",
                                        },
                                      ],
                                    },
                                    {
                                      id: 11,
                                      label: "Trust Transfer Record",
                                      selected: false,
                                      options: [],
                                    },
                                    {
                                      id: 12,
                                      label: "Trust Three Way Reconciliation",
                                      selected: false,
                                      options: [
                                        {
                                          id: 1,
                                          label:
                                            "Enter Ending bank statement balance",
                                          selected: false,
                                          value: "All",
                                        },
                                      ],
                                    },
                                    {
                                      id: 13,
                                      label: "Trust Bank Reconciliation",
                                      selected: false,
                                      options: [
                                        {
                                          id: 1,
                                          label:
                                            "Enter Ending bank statement balance",
                                          selected: false,
                                          value: "All",
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  account_value: { id: "", value: "" },
                                  matter_owner_value: { id: "", value: "" },
                                  collection: [
                                    {
                                      id: 6,
                                      label: "General Receipt Journal",
                                      selected: false,
                                      options: [],
                                    },
                                    {
                                      id: 7,
                                      label: "General Disbursement Journal",
                                      selected: false,
                                      options: [],
                                    },
                                    {
                                      id: 8,
                                      label: "General Journal",
                                      selected: false,
                                      options: [],
                                    },
                                    {
                                      id: 9,
                                      label: "Client General Journal",
                                      selected: false,
                                      options: [
                                        {
                                          id: 1,
                                          label: "Show Specific Clients",
                                          selected: false,
                                          value: "All",
                                        },
                                      ],
                                    },
                                    {
                                      id: 14,
                                      label: "General Bank Reconciliation",
                                      selected: false,
                                      options: [
                                        {
                                          id: 1,
                                          label:
                                            "Enter Ending bank statement balance",
                                          selected: false,
                                          value: "All",
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  account_value: {
                                    id: creditAccountNames[0].account_id,
                                    value: creditAccountNames[0].name,
                                  },
                                  matter_owner_value: { id: "", value: "" },
                                  collection: [
                                    {
                                      id: 15,
                                      label: "Credit Card Reconciliation",
                                      selected: true,
                                      options: [
                                        {
                                          id: 1,
                                          label:
                                            "Enter Ending bank statement balance",
                                          selected: true,
                                          value:
                                            form3Data.comments.endingBalance ||
                                            "All",
                                          // value: "0.00",
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  account_value: { id: "", value: "" },
                                  matter_owner_value: { id: "", value: "" },
                                  collection: [
                                    {
                                      id: 10,
                                      label: "Fees Book",
                                      selected: false,
                                      options: [
                                        {
                                          id: 1,
                                          label: "Show Specific Clients",
                                          selected: false,
                                          value: "All",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            };

                            axios
                              .post("/report/collection", obj)
                              .then(async (res) => {
                                if (res.data.data.code === 200) {
                                  const postData = await postToDB("card", {
                                    task_id: getMonthlyChecklistId(),
                                    reports: {
                                      batch_id: res.data.data.body.batchno,
                                    },
                                  });

                                  if (postData.data.data.code === 200) {
                                    setTaskStatus({
                                      ...taskStatus,
                                      batch_id: res.data.data.body.batchno,
                                    });
                                    setDownloadReportModal(true);
                                    setProcessing(true);
                                    // setCompletedSteps(completedSteps + 1);
                                  }
                                }
                              })
                              .catch((err) => {
                                console.log("err", err);
                                toast.error("Error Generating Reports");
                              });
                          } else {
                            toast.error("Select Credit reports");
                          }
                        }
                      }
                      className="btn btnPrimary blue mt-2"
                    >
                      Generate Report
                    </button>
                  ) : (
                    <button
                      className="btn btnPrimary green rounded-pill"
                      onClick={downloadReports}
                    >
                      Download Reports
                    </button>
                  )}
                  {downloadStatus && (
                    <ModalInputCenter
                      heading="Reports Download Status"
                      cancelOption="Ok"
                      handleClick={(e) => {
                        e.preventDefault();
                        const link = document.createElement("a");
                        link.href = taskStatus.reportsDownloadURL;
                        link.download = taskStatus.batch_id;
                        link.click();
                      }}
                      changeShow={() => {
                        setTaskStatus({
                          ...taskStatus,
                          showReportDownloadAlert: false,
                        });
                        setDownloadStatus(false);
                      }}
                      show={taskStatus.showReportDownloadAlert}
                      action=""
                    >
                      {taskStatus.reportDownloadStatus}
                    </ModalInputCenter>
                  )}
                </div>
                {/* credit card  */}

                {/* credit card  */}
                <div className="innerTitle">
                  <span>{getSvg("sign off")}</span>
                  <label>Almost there, please sign off..</label>
                </div>
                <div className="form-group">
                  <label>
                    Name of preparer:&nbsp; {taskStatus.task_preparer_name}
                    <SignOffButton
                      disabledVal={
                        isFormDisabled || taskStatus.task_preparer_signoff
                          ? "disabled"
                          : taskStatus.task_preparer !== getUserId() &&
                            "disabled"
                      }
                      styles={`btn btnPrimary blue ${
                        isFormDisabled || taskStatus.task_preparer_signoff
                          ? "disabled"
                          : taskStatus.task_preparer !== getUserId() &&
                            "disabled"
                      }`}
                      onClickFunc={async (event) => {
                        event.preventDefault();

                        const postSignOffPreparer = await axios.post(
                          `/signoff/task/PREPARER`,
                          {
                            task_id: taskStatus.id,
                          }
                        );

                        if (postSignOffPreparer.data.data.code === 200) {
                          setTaskStatus((e) => ({
                            ...taskStatus,
                            task_preparer_signoff_date:
                              new Date().toISOString(),
                            task_preparer_signoff: 1,
                            preparerSignOffError: "",
                          }));

                          setTimeout(() => {
                            Cookies.set(
                              "checklistId",
                              JSON.stringify(taskStatus)
                            );
                          }, 1000);
                        } else {
                          setTaskStatus(() => ({
                            ...taskStatus,
                            preparerSignOffError: "Preparer Sign Off Failed",
                          }));
                        }
                      }}
                    >
                      Sign Off
                    </SignOffButton>
                  </label>
                  {taskStatus.preparerSignOffError && (
                    <span className="text text-danger">
                      {taskStatus.preparerSignOffError}
                    </span>
                  )}
                  {taskStatus.task_preparer_signoff !== 1 &&
                    taskStatus.task_preparer !== getUserId() && (
                      <span className="text text-primary-color">
                        Log in with preparer {taskStatus.task_preparer_name} to
                        Sign
                      </span>
                    )}
                  {taskStatus.task_preparer_signoff === 1 && (
                    <span className="text text-success">
                      Preparer Sign Off Done at{" "}
                      {momentFunction.formatDate(
                        taskStatus.task_preparer_signoff_date
                      )}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>
                    Name of Approver:&nbsp;
                    {getMonthlyChecklistDetails().task_approverer_name}
                    <SignOffButton
                      disabledVal={
                        isFormDisabled ||
                        taskStatus.task_approverer_signoff ||
                        taskStatus.task_preparer_signoff === 0
                          ? "disabled"
                          : taskStatus.task_approverer !== getUserId() &&
                            "disabled"
                      }
                      styles={`btn btnPrimary blue  ${
                        isFormDisabled ||
                        taskStatus.task_approverer_signoff ||
                        taskStatus.task_preparer_signoff === 0
                          ? "disabled"
                          : taskStatus.task_approverer !== getUserId() &&
                            "disabled"
                      }`}
                      onClickFunc={async (event) => {
                        event.preventDefault();

                        const postSignOffApprover = await axios.post(
                          `/signoff/task/REVIEWER`,
                          {
                            task_id: monthlyChecklistID,
                          }
                        );
                        console.log(
                          "✌️postSignOffApprover --->",
                          postSignOffApprover
                        );

                        if (postSignOffApprover.data.data.code === 200) {
                          setTaskStatus((e) => ({
                            ...taskStatus,
                            approverSignOffError: "",
                            task_approverer_signoff: 1,
                            task_approverer_signoff_date:
                              new Date().toISOString(),
                          }));

                          // PDF generation removed

                          setTimeout(() => {
                            Cookies.set(
                              "checklistId",
                              JSON.stringify(taskStatus)
                            );
                          }, 1000);
                        } else {
                          setTaskStatus(() => ({
                            ...taskStatus,
                            approverSignOffError: "Approver Sign Off Failed",
                          }));
                        }
                      }}
                    >
                      Sign Off
                    </SignOffButton>
                  </label>
                  {taskStatus.approverSignOffError !== "" && (
                    <span className="text text-danger">
                      {taskStatus.approverSignOffError}
                    </span>
                  )}
                  {taskStatus.task_approverer_signoff === 0 &&
                    taskStatus.task_preparer_signoff === 1 &&
                    taskStatus.task_approverer !== getUserId() && (
                      <span className="text text-primary-color">
                        Log in with approver {taskStatus.task_approverer_name}{" "}
                        to Sign
                      </span>
                    )}
                  {taskStatus.task_approverer_signoff === 0 &&
                    taskStatus.task_approverer !== getUserId() &&
                    taskStatus.task_preparer_signoff === 0 && (
                      <span className="text text-primary-color">
                        Preparer Sign Off needed first
                      </span>
                    )}
                  {taskStatus.task_approverer_signoff === 0 &&
                    taskStatus.task_approverer === getUserId() &&
                    taskStatus.task_preparer_signoff === 0 && (
                      <span className="text text-primary-color">
                        Preparer Sign Off needed first
                      </span>
                    )}
                  {taskStatus.task_approverer_signoff === 1 && (
                    <span className="text text-success">
                      Approver Sign Off Done at{" "}
                      {momentFunction.formatDate(
                        taskStatus.task_approverer_signoff_date
                      )}
                    </span>
                  )}
                </div>
              </>
            )}

            {taskStatus.reportsError && (
              <Alert variant="danger" className="text-error heading-6">
                {taskStatus.reportsError}
              </Alert>
            )}
          </div>
          <div className="col-md-4 text-end">
            {typeOfList === stepsInfoForm1 ? (
              <img className="mt-5" src={reportsDetails}></img>
            ) : typeOfList === stepsInfoForm2 ? (
              <img className="mt-5" src={reportsDetails}></img>
            ) : (
              <img className="mt-5" src={cartReportDetails}></img>
            )}
          </div>
          <div className="col-md-12">
            <div className="btnGroup justify-content-between mt-4">
              <button
                className="btn btnPrimary m-0 blue"
                onClick={previousPage}
              >
                Previous
              </button>
              {typeOfList === stepsInfoForm1 && (
                <button
                  className={`btn btnPrimary blue`}
                  type="submit"
                  onClick={handleTrustSubmit}
                >
                  {isFormDisabled || completedSteps > formNumber
                    ? "Next"
                    : "Generate all Trust Reports and Next"}
                </button>
              )}
              {typeOfList === stepsInfoForm2 && (
                <button
                  className="btn btnPrimary rounded-pill"
                  disabled={taskStatus.task_preparer_signoff !== 1}
                  onClick={() =>
                    history.push(AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE)
                  }
                >
                  Save & Finish
                </button>
              )}
              {typeOfList === stepsInfoForm3 && (
                <button
                  className="btn btnPrimary rounded-pill"
                  disabled={taskStatus.task_preparer_signoff !== 1}
                  onClick={() =>
                    history.push(AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE)
                  }
                >
                  Save & Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const nextStep = () => {
    setCompletedSteps(activeStep + 1);
    setActiveStep(activeStep + 1);
  };

  const form6 = (typeOfList, formNumber) => {
    return (
      <>
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            activeForm={activeForm}
            list={typeOfList}
            type="checklist"
            setActiveStepFunc={(e) => setActiveStep(e)}
          ></OnboardingSteps>
        </div>
        <div
          ref={(divElement) => {
            if (activeStep === formNumber) {
              assignRef(divElement, activeForm, formNumber);
            }
          }}
        >
          <form
            className="row"
            onSubmit={async (e) => {
              e.preventDefault();
              const generalTaxFilingObj = {
                task_id: getMonthlyChecklistId(),
                reports: {
                  batch_id: taskStatus.batch_id,
                  taxFiling: form6Data,
                },
              };
              const response = await postToDB("general", generalTaxFilingObj);
              if (response.data.data.code === 200) {
                nextStep();
              } else {
                alert("Server Error");
              }
            }}
          >
            <div className="form-group">
              <label className="heading">Section C</label>
              <label>Tax filing deadlines for the reconciling month:</label>
            </div>

            {form6Data.taxFilingDetails.length ? (
              <table className="my-3 w-100">
                <thead className="heading_row heading-5">
                  <tr>
                    <th>
                      <b>Type</b>
                    </th>
                    <th>
                      <b>Filing Frequency</b>
                    </th>
                    <th>
                      <b>Reporting Period</b>
                    </th>
                    <th>
                      <b>Filing Deadline</b>
                    </th>
                    <th>
                      <b>Payment Deadline</b>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isFormDisabled
                    ? taskStatus.taxFiling.taxFilingDetails.map((e, index) => {
                        return getAllUserInfo().province === "ON" &&
                          index === 0 ? null : getAllUserInfo().province ===
                            "BC" && index === 1 ? null : (
                          <tr key={index}>
                            <td>{e.type}</td>
                            <td>{e.filingFrequency}</td>
                            <td>{e.reportingPeriod}</td>
                            <td>{e.filingDeadline}</td>
                            <td>{e.paymentDeadline}</td>
                          </tr>
                        );
                      })
                    : form6Data.taxFilingDetails.map((e, index) => {
                        return getAllUserInfo().province === "ON" &&
                          index === 0 ? null : getAllUserInfo().province ===
                            "BC" && index === 1 ? null : (
                          <tr key={index}>
                            <td>{e.type}</td>
                            <td>{e.filingFrequency}</td>
                            <td>{e.reportingPeriod}</td>
                            <td>{e.filingDeadline}</td>
                            <td>{e.paymentDeadline}</td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            ) : (
              <h3 className="text-center my-5 mx-auto fw-bold">
                No tax filing for this month
              </h3>
            )}

            <hr className="line mt-4" style={{ width: "100%" }} />

            <div
              // style={{ paddingLeft: "15rem" }}
              className="d-flex mt-3 justify-content-between w-100 m-auto"
            >
              <button
                onClick={previousPage}
                className="btn_primary_empty px-4 py-3 mx-5 align-self-start"
              >
                Previous
              </button>{" "}
              <button
                className="btn_primary_colored px-4 py-3 mx-5 align-self-end"
                type="submit"
                // onClick={nextStep}
              >
                Save & Next
              </button>
            </div>
          </form>
        </div>
      </>
    );
  };

  const previousPage = () => {
    setActiveStep(activeStep - 1);
    // setCompletedSteps(completedSteps + 1);
  };

  const form7 = (typeOfList, formNumber) => {
    const handleTrustSubmitForm7 = () => {
      const monthAndYear = getMonthlyChecklistMonth();
      const fullDateStarting = 1 + " " + monthAndYear;
      const fullDateEnding =
        lastDateOfTheMonth(new Date(fullDateStarting).getMonth()) +
        " " +
        monthAndYear;

      if (isFormDisabled || completedSteps > formNumber) {
      } else if (
        trustAccountNames.length !== 0 &&
        !isFormDisabled &&
        completedSteps > formNumber - 1
      ) {
        const obj = {
          requested_by_user: getUserId(),
          subscriber_id: getUserSID(),
          request_type: 0,
          report_type: 0,
          batch_id: getMonthlyChecklistId() + "_" + Math.random().toString(),
          from_date: account_fromdate.current,
          to_date: account_todate.current,
          category: [
            {
              account_value: {
                id: trustAccountNames[0].account_id,
                value: trustAccountNames[0].name,
              },
              matter_owner_value: {
                id: "",
                value: "All",
              },
              collection: [
                {
                  id: 1,
                  label: "Trust Receipts Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 2,
                  label: "Trust Disbursements Journal",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: true,
                      value: form1Data.comments.endingBalance || "All",
                    },
                  ],
                },
                {
                  id: 3,
                  label: "Trust Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 4,
                  label: "Trust Listing",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Hide Clients With Zero Balance",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 3,
                      label: "Show Clients With Status",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 4,
                      label: "Show Clients With Last Activity Date",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 5,
                      label: "Show Clients With Over Drawn Accounts",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 5,
                  label: "Client Trust Ledger",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Hide Clients With Zero Balance",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 3,
                      label: "Show Clients With Active Matters Only",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 4,
                      label: "Show Clients With Over Drawn Accounts",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 11,
                  label: "Trust Transfer",
                  selected: true,
                  options: [],
                },
                {
                  id: 12,
                  label: "Three Way Reconciliation",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: true,
                      value: form1Data.comments.endingBalance || "All",
                    },
                  ],
                },
                {
                  id: 13,
                  label: "Trust Reconciliation Report",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: true,
                      value: form1Data.comments.endingBalance || "All",
                    },
                  ],
                },
              ],
            },
            {
              account_value: {
                id: "",
                value: "",
              },
              matter_owner_value: {
                id: "",
                value: "",
              },
              collection: [
                {
                  id: 6,
                  label: "General Receipts Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 7,
                  label: "General Disbursements Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 8,
                  label: "General Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 9,
                  label: "Client's General Journal",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 14,
                  label: "General Reconciliation Report",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
              ],
            },
            {
              account_value: {
                id: "",
                value: "",
              },
              matter_owner_value: {
                id: "",
                value: "",
              },
              collection: [
                {
                  id: 10,
                  label: "Fees Book",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Show Clients With All Columns",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
              ],
            },
          ],
        };
        console.log("✌️obj --->", obj);

        axios
          .post("/report/collection", obj)
          .then(async (res) => {
            if (res.data.data.code === 200) {
              const postData = await postToDB("trust", {
                task_id: getMonthlyChecklistId(),
                reports: {
                  batch_id: res.data.data.body.batchno,
                },
              });

              if (postData.data.data.code === 200) {
                setTaskStatus({
                  ...taskStatus,
                  batch_id: res.data.data.body.batchno,
                });

                setCompletedSteps(completedSteps + 1);
              }
              setReportStatus(true);
              setDownloadReportModal(true);
              setProcessing(true);
            }
          })
          .catch((err) => {
            console.log("err", err);
          });
      } else {
        toast.error("Select trust reports");
        setTaskStatus({
          ...taskStatus,
          reportsError: "Please select an Account To Proceed",
        });
      }
    };

    const handleGeneraleSubmitForm7 = () => {
      const monthAndYear = getMonthlyChecklistMonth();
      const fullDateStarting = 1 + " " + monthAndYear;
      if (isFormDisabled || completedSteps > formNumber) {
        nextStep();
      } else if (generalAccountNames !== null) {
        const obj = {
          requested_by_user: getUserId(),
          subscriber_id: getUserSID(),
          request_type: 0,
          report_type: 0,
          batch_id: getMonthlyChecklistId() + "_" + Math.random().toString(),
          from_date: account_fromdate.current,
          to_date: account_todate.current,
          category: [
            {
              account_value: {
                id: generalAccountNames[0].account_id,
                value: taskStatus.task_type_account,
              },
              matter_owner_value: {
                id: "",
                value: "All",
              },
              collection: [
                {
                  id: 1,
                  label: "Trust Receipts Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 2,
                  label: "Trust Disbursements Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 3,
                  label: "Trust Journal",
                  selected: false,
                  options: [],
                },
                {
                  id: 4,
                  label: "Trust Listing",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Hide Clients With Zero Balance",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 3,
                      label: "Show Clients With Status",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 4,
                      label: "Show Clients With Last Activity Date",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 5,
                      label: "Show Clients With Over Drawn Accounts",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 5,
                  label: "Client Trust Ledger",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Hide Clients With Zero Balance",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 3,
                      label: "Show Clients With Active Matters Only",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 4,
                      label: "Show Clients With Over Drawn Accounts",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 11,
                  label: "Trust Transfer",
                  selected: false,
                  options: [],
                },
                {
                  id: 12,
                  label: "Three Way Reconciliation",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 13,
                  label: "Trust Reconciliation Report",
                  selected: false,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
              ],
            },
            {
              account_value: {
                id: generalAccountNames[0].account_id,
                value: taskStatus.task_type_account,
              },
              matter_owner_value: {
                id: "",
                value: "",
              },
              collection: [
                {
                  id: 6,
                  label: "General Receipts Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 7,
                  label: "General Disbursements Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 8,
                  label: "General Journal",
                  selected: true,
                  options: [],
                },
                {
                  id: 9,
                  label: "Client's General Journal",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
                {
                  id: 14,
                  label: "General Reconciliation Report",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Enter Ending bank statement balance",
                      selected: true,
                      //pass ending balance in all 4.
                      value: form2Data.comments.endingBalance || "All",
                    },
                  ],
                },
              ],
            },
            {
              account_value: {
                id: "",
                value: "",
              },
              matter_owner_value: {
                id: "",
                value: "",
              },
              collection: [
                {
                  id: 10,
                  label: "Fees Book",
                  selected: true,
                  options: [
                    {
                      id: 1,
                      label: "Show Specific Clients",
                      selected: false,
                      value: "All",
                    },
                    {
                      id: 2,
                      label: "Show Clients With All Columns",
                      selected: false,
                      value: "All",
                    },
                  ],
                },
              ],
            },
          ],
        };
        console.log("generalObj --->", obj);

        axios
          .post("/report/collection", obj)
          .then(async (res) => {
            console.log("generalObj --->", res);

            if (res.data.data.code === 200) {
              const postData = await postToDB("general", {
                task_id: getMonthlyChecklistId(),
                reports: {
                  batch_id: res.data.data.body.batchno,
                },
              });

              if (postData.data.data.code === 200) {
                setTaskStatus({
                  ...taskStatus,
                  batch_id: res.data.data.body.batchno,
                });

                setCompletedSteps(completedSteps + 1);
              }
            }
          })
          .catch((err) => {
            console.log("err", err);
          });
      } else {
        toast.error("Select trust reports");
      }
    };

    return (
      <div
        ref={(divElement) => {
          if (formNumber === activeStep) {
            assignRef(divElement, activeForm, formNumber);
          }
        }}
      >
        <div className="wizardStepTask">
          <OnboardingSteps
            completedSteps={completedSteps}
            activeStep={activeStep}
            activeHeight={activeHeight}
            list={typeOfList}
            type="checklist"
            activeForm={activeForm}
            setActiveStepFunc={(e) => setActiveStep(e)}
          ></OnboardingSteps>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="titleHeader">
              <div className="innerTitle">
                <span>
                  {typeOfList === stepsInfoForm1
                    ? getSvg("generate your reports Step 1")
                    : typeOfList === stepsInfoForm2
                    ? getSvg("generate your reports Step 2")
                    : getSvg("generate your reports Step 3")}
                </span>
                <label>Ready to generate your reports...</label>
              </div>

              <div className="taskTypeTitle">Reports</div>
            </div>
          </div>
        </div>

        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            let type = "trust";
            let obj = {
              task_id: getMonthlyChecklistId(),
              reports: {
                batch_id: taskStatus.batch_id,
                taxFiling: form6Data,
                dateBankReconciliation: taskStatus.dateBankReconciliation,
              },
            };
            if (activeForm === 1) {
              type = "trust";
            } else if (activeForm === 2) {
              type = "general";
            } else if (activeForm === 3) {
              type = "card";
            }
            const postData = await postToDB(type, obj);
            if (postData.data.data.code === 200) {
              // history.push(AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE);
            } else {
              toast.error("error while posting date bank reconciliation");
            }
          }}
        >
          <div className="col-md-8">
            {typeOfList === stepsInfoForm1 ? (
              <div className="form-group mb-0">
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li className="blank"></li>
                <li>
                  The monthly Law Society compliance reports for the month of{" "}
                  {taskStatus.task_month} are as follows:
                </li>
                <ol start="1">
                  <li>Trust Receipts Journal</li>
                  <li className="mt-0">Trust Disbursements Journal</li>
                  <li className="mt-0">Trust Journal</li>
                  <li className="mt-0">Trust Listing</li>
                  <li className="mt-0">Client Trust Ledger</li>
                  <li className="mt-0">Trust Transfer</li>
                  <li className="mt-0">Three Way Reconciliation</li>
                  <li className="mt-0">Trust Reconciliation Report</li>
                </ol>
                <ModalInputCenter
                  changeShow={() => setDownloadReportModal(false)}
                  show={downloadReportModal}
                  cancelOption="Ok"
                  heading={"Report generation details"}
                  handleClick={() => {}}
                >
                  <h4 style={{ fontSize: "16px" }}>
                    Reports are being generated and will be available in Report
                    History in some time.
                  </h4>
                </ModalInputCenter>
                {!taskStatus.reportsReadyForDownloading ? (
                  <button
                    className={`btn btnPrimary blue rounded-pill`}
                    type="submit"
                    disabled={processing}
                    onClick={handleTrustSubmitForm7}
                  >
                    Generate reports
                  </button>
                ) : (
                  <button
                    className="btn btnPrimary green rounded-pill"
                    onClick={downloadReports}
                  >
                    Download Reports
                  </button>
                )}
                {downloadStatus && (
                  <ModalInputCenter
                    heading="Reports Download Status"
                    cancelOption="Ok"
                    handleClick={(e) => {
                      e.preventDefault();
                      const link = document.createElement("a");
                      link.href = taskStatus.reportsDownloadURL;
                      link.download = taskStatus.batch_id;
                      link.click();
                    }}
                    changeShow={() => {
                      setTaskStatus({
                        ...taskStatus,
                        showReportDownloadAlert: false,
                      });
                      setDownloadStatus(false);
                    }}
                    show={taskStatus.showReportDownloadAlert}
                    action=""
                  >
                    {taskStatus.reportDownloadStatus}
                  </ModalInputCenter>
                )}
              </div>
            ) : typeOfList === stepsInfoForm2 ? (
              <div className="form-group">
                <label className="heading">Section B</label>
                <label>
                  The monthly Law Society compliance reports for the month of{" "}
                  {taskStatus.task_month} are as follows:
                </label>
                <ol className="text mt-2">
                  <li>General Receipts Journal</li>
                  <li>General Disbursements Journal</li>
                  <li>General Journal</li>
                  <li>Client's General Journal</li>
                  <li>General Reconciliation Report</li>
                  <li>Fees Book</li>
                </ol>
                {taskStatus.batch_id && (
                  <>
                    <Alert
                      className="flex-column heading-5 d-flex justify-content-center align-items-start"
                      variant="warning"
                    >
                      Request for Reports send.
                    </Alert>
                    {!taskStatus.reportsReadyForDownloading && (
                      <button
                        onClick={checkReportStatus}
                        className="btn btnPrimary blue"
                      >
                        Check Report Status
                      </button>
                    )}
                    {taskStatus.reportsReadyForDownloading && (
                      <button
                        onClick={downloadReports}
                        className="btn btnPrimary blue"
                      >
                        Download Reports
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>
                    4. Please, confirm the credit card statement balances
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    disabled={isFormDisabled}
                    name="endingBalance"
                    value={formatNumber(form3Data.comments.endingBalance)}
                    onChange={(e) => {
                      setForm3Data({
                        ...form3Data,
                        comments: {
                          ...form3Data.comments,
                          endingBalance: parseInt(e.target.value.split("$")[1]),
                        },
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    5. The monthly report for the month of{" "}
                    {taskStatus.task_month} are as follows:
                  </label>
                  <ol className="text mt-2">
                    <li>1. Credit Card Reconciliation</li>
                  </ol>
                </div>
              </>
            )}

            {taskStatus.reportsError && (
              <Alert variant="danger" className="text-error heading-6">
                {taskStatus.reportsError}
              </Alert>
            )}
            <div className="col">
              <div className="btnGroup mb-3">
                {typeOfList === stepsInfoForm2 && (
                  <button
                    className="btn btnPrimary rounded-pill blue"
                    type="submit"
                    onClick={handleGeneraleSubmitForm7}
                  >
                    {isFormDisabled || completedSteps > formNumber
                      ? "Next"
                      : "Generate all General Reports and Next"}
                  </button>
                )}
              </div>
              {/* Trust button of prepare */}
              <div className="innerTitle mb-3">
                <span>{getSvg("sign off")}</span>
                <label>Almost there, please sign off..</label>
              </div>
              <div className="form-group">
                <label className="justify-content-start">
                  Name of preparer:&nbsp; {taskStatus.task_preparer_name}
                  <SignOffButton
                    disabledVal={
                      isFormDisabled || taskStatus.task_preparer_signoff
                        ? "disabled"
                        : taskStatus.task_preparer !== getUserId() && "disabled"
                    }
                    styles={`btn btnPrimary blue ms-5 ${
                      isFormDisabled || taskStatus.task_preparer_signoff
                        ? "disabled"
                        : taskStatus.task_preparer !== getUserId() && "disabled"
                    }`}
                    onClickFunc={async (event) => {
                      event.preventDefault();

                      const postSignOffPreparer = await axios.post(
                        `/signoff/task/PREPARER`,
                        {
                          task_id: taskStatus.id,
                        }
                      );

                      if (postSignOffPreparer.data.data.code === 200) {
                        setTaskStatus((e) => ({
                          ...taskStatus,
                          task_preparer_signoff_date: new Date().toISOString(),
                          task_preparer_signoff: 1,
                          preparerSignOffError: "",
                        }));

                        setTimeout(() => {
                          Cookies.set(
                            "checklistId",
                            JSON.stringify(taskStatus)
                          );
                        }, 1000);
                      } else {
                        setTaskStatus(() => ({
                          ...taskStatus,
                          preparerSignOffError: "Preparer Sign Off Failed",
                        }));
                      }
                    }}
                  >
                    Sign Off
                  </SignOffButton>
                </label>
                {taskStatus.preparerSignOffError && (
                  <span className="text text-danger">
                    {taskStatus.preparerSignOffError}
                  </span>
                )}
                {taskStatus.task_preparer_signoff !== 1 &&
                  taskStatus.task_preparer !== getUserId() && (
                    <span className="text text-primary-color">
                      Log in with preparer {taskStatus.task_preparer_name} to
                      Sign
                    </span>
                  )}
                {taskStatus.task_preparer_signoff === 1 && (
                  <span className="text text-success">
                    Preparer Sign Off Done at{" "}
                    {momentFunction.formatDate(
                      taskStatus.task_preparer_signoff_date
                    )}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="justify-content-start">
                  Name of Approver:&nbsp;
                  {getMonthlyChecklistDetails().task_approverer_name}
                  <SignOffButton
                    disabledVal={
                      isFormDisabled ||
                      taskStatus.task_approverer_signoff ||
                      taskStatus.task_preparer_signoff === 0
                        ? "disabled"
                        : taskStatus.task_approverer !== getUserId() &&
                          "disabled"
                    }
                    styles={`btn btnPrimary blue ms-5  ${
                      isFormDisabled ||
                      taskStatus.task_approverer_signoff ||
                      taskStatus.task_preparer_signoff === 0
                        ? "disabled"
                        : taskStatus.task_approverer !== getUserId() &&
                          "disabled"
                    }`}
                    onClickFunc={async (event) => {
                      event.preventDefault();

                      const postSignOffApprover = await axios.post(
                        `/signoff/task/REVIEWER`,
                        {
                          task_id: monthlyChecklistID,
                        }
                      );

                      if (postSignOffApprover.data.data.code === 200) {
                        setTaskStatus((e) => ({
                          ...taskStatus,
                          approverSignOffError: "",
                          task_approverer_signoff: 1,
                          task_approverer_signoff_date:
                            new Date().toISOString(),
                        }));

                        // PDF generation removed

                        setTimeout(() => {
                          Cookies.set(
                            "checklistId",
                            JSON.stringify(taskStatus)
                          );
                        }, 1000);
                      } else {
                        setTaskStatus(() => ({
                          ...taskStatus,
                          approverSignOffError: "Approver Sign Off Failed",
                        }));
                      }
                    }}
                  >
                    Sign Off
                  </SignOffButton>
                </label>
                {taskStatus.approverSignOffError !== "" && (
                  <span className="text text-danger">
                    {taskStatus.approverSignOffError}
                  </span>
                )}
                {taskStatus.task_approverer_signoff === 0 &&
                  taskStatus.task_preparer_signoff === 1 &&
                  taskStatus.task_approverer !== getUserId() && (
                    <span className="text text-primary-color">
                      Log in with approver {taskStatus.task_approverer_name} to
                      Sign
                    </span>
                  )}
                {taskStatus.task_approverer_signoff === 0 &&
                  taskStatus.task_approverer !== getUserId() &&
                  taskStatus.task_preparer_signoff === 0 && (
                    <span className="text text-primary-color">
                      Preparer Sign Off needed first
                    </span>
                  )}
                {taskStatus.task_approverer_signoff === 0 &&
                  taskStatus.task_approverer === getUserId() &&
                  taskStatus.task_preparer_signoff === 0 && (
                    <span className="text text-primary-color">
                      Preparer Sign Off needed first
                    </span>
                  )}
                {taskStatus.task_approverer_signoff === 1 && (
                  <span className="text text-success">
                    Approver Sign Off Done at{" "}
                    {momentFunction.formatDate(
                      taskStatus.task_approverer_signoff_date
                    )}
                  </span>
                )}
              </div>{" "}
            </div>
          </div>
          <div className="col-md-4 text-end">
            <img className="mt-5" src={reportsDetails}></img>
          </div>
          <div className="col-md-12">
            <div className="btnGroup justify-content-between mt-3">
              <button
                onClick={previousPage}
                className="btn btnPrimary blue m-0 rounded-pill"
              >
                Previous
              </button>
              <button
                className="btn btnPrimary rounded-pill"
                disabled={taskStatus.task_preparer_signoff !== 1}
                onClick={() =>
                  history.push(AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE)
                }
              >
                Save & Finish
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const handlePrint = useReactToPrint({
    content: () => checklist_report.current,
    // documentTitle: "Checklist",
    pageStyle: {
      "@page": { size: "A4", margin: "40px" },
      body: { size: "A4", margin: "50px" },
    },
  });

  const { userInfo } = useSelector((state) => state.userLogin);

  return (
    <section className="wrapper">
      <aside className="mainSide">
        <Navbar setIsNavOpen={setIsNavOpen} />
      </aside>
      <main>
        <InfoHeader
          title={`Welcome ${userInfo.username ? userInfo.username : ""} `}
        />
        <div className="row">
          <div className="col-md-10 offset-md-1">
            <div className="outerTitle">
              <div className="pHead">
                <span className="h5">
                  {getSvg("Monthly review Checklist")}
                  Monthly review checklist -{" "}
                  <span className="blueColor">{account_name.current}-</span>
                  <span className="blueColor">&nbsp;{dateMonth}</span>
                </span>
              </div>
            </div>
            <div className="panel Hauto">
              <ol className="pBody addTaskWizard">
                {/* activeForm 1 for only trust checklist */}
                {activeForm === 1 &&
                  activeStep === 1 &&
                  form1(stepsInfoForm1, 1)}
                {activeForm === 1 &&
                  activeStep === 2 &&
                  form1second(stepsInfoForm1, 2)}
                {activeForm === 1 &&
                  activeStep === 3 &&
                  form1third(stepsInfoForm1, 3)}
                {activeForm === 1 &&
                  activeStep === 4 &&
                  form1fourth(stepsInfoForm1, 4)}
                {activeForm === 1 &&
                  activeStep === 5 &&
                  form7(stepsInfoForm1, 5)}

                {/* activeForm 2 for only general checklist */}
                {activeForm === 2 &&
                  activeStep === 1 &&
                  form2(stepsInfoForm2, 1)}
                {activeForm === 2 &&
                  activeStep === 2 &&
                  form2second(stepsInfoForm2, 2)}
                {activeForm === 2 &&
                  activeStep === 3 &&
                  form5(stepsInfoForm2, 3)}

                {/* activeForm 3 for only card checklist */}
                {activeForm === 3 &&
                  activeStep === 1 &&
                  form3(stepsInfoForm3, 1)}
                {activeForm === 3 &&
                  activeStep === 2 &&
                  form5(stepsInfoForm3, 2)}
                {activeForm === 3 &&
                  activeStep === 3 &&
                  form7(stepsInfoForm3, 3)}
              </ol>
            </div>
          </div>
        </div>

        <div className="pb-3"> </div>
        {/* <div className="pb-3">
        <button onClick={handlePrint}>Click me </button>
        </div> */}

        {/* <div>
           <ChecklistPdf ref={checklist_report} data={{ type:activeForm}}  />
        </div> */}

        {/* <FooterDash /> */}
      </main>
    </section>
  );
};

export default MonthlyCheckList;

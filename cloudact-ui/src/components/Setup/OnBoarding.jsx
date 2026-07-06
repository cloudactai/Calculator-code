import { Autocomplete, TextField } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import Dropdown from "react-dropdown";
import moment from "moment";
import "react-dropdown/style.css";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router";
import ClipLoader from "react-spinners/ClipLoader";
import { taxAndFinancialDetailsAction } from "../../actions/setupWizardAction";
import { userChangeAction } from "../../actions/userActions";
import Edit from "../../assets/images/Edit Todo.png";
import axios from "../../utils/axios";
import toast from "react-hot-toast";
import { areaOfLawPracticeForm1 } from "../../utils/dataStatic";
import { fetchRequest } from "../../utils/fetchRequest";
import {
  getUserId,
  getUserSID,
  updateInfoInCurrentUser,
  getCurrentUserFromCookies,
} from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import InfoButton from "../InfoButton";
import InputCustom from "../InputCustom";
import ModalInputCenter from "../ModalInputCenter";
import DoubleInput from "./DoubleInput";
import OnboardingSteps from "./OnboardingSteps";

const OnBoarding = ({ isQBOConnected, familyLawTools, complianceReports }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [companyInfo, setCompanyInfo] = useState({ loaded: false });
  const [loaded, setLoaded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(1);
  const [form1Data, setForm1Data] = useState({
    areaOfLawPractice: [],
    BusinessNumber: "",
    CorporateTaxNumber: "",
    otherCorporateTaxNumber: [],
    GSTNumber: "",
    otherGSTNumbers: [],
    detailsOfPartners: "",
    partnershipNumber: "",
    otherPartnershipNumber: [],
    PSTNumber: "",
    typeOfPartner: "",
    Signature: "",
    PayrollNumber: "",
    otherPayrollNumber: [],
    selfEmployed: "",
    partnerAccount: [],
    typeFirmList: [
      {
        name: "Professional corporation",
        id: 1,
      },
      {
        name: "Sole proprietor",
        id: 2,
      },
      {
        name: "Limited liability partnership",
        id: 3,
      },
    ],
  });
  const [modalsForm1, setModalsForm1] = useState({
    showModalGST: false,
    gstInputVal: "",
    showModalPST: false,
    pstInputVal: "",
    showModalPartner: false,
    partnerInputVal: "",
    partnerTypeInputVal: "",
    showModalPayroll: false,
    payrollInputVal: "",
    showModalCorporateTaxNumber: false,
    corporateTaxNumberInputVal: "",
    showModalPartnershipNumber: false,
    partnershipNumber: "",
  });
  const [form2Data, setForm2Data] = useState({});
  const [form3Data, setForm3Data] = useState({
    addUserModalShow: false,
    reloadAgain: 0,
    form3DataUsers: [],
    modalUserEmail: "",
    modalUserName: "",
    indexToChange: 0,
    uidToChange: 0,
    modalUserRole: "",
    userAddedAsSomething: false,
    showLinkConfirmationSend: false,
  });
  const [form4Data, setForm4Data] = useState({
    trust_bank_accounts: [],
    general_bank_accounts: [],
    credit_card_accounts: [],
  });
  const [form5Data, setForm5Data] = useState({
    billingArrangement: [
      {
        name: "Time incurred fees",
        id: 1,
      },
      {
        name: "Fixed fee ",
        id: 2,
      },
      {
        name: "Sliding scale fees",
        id: 3,
      },
      {
        name: "Contigency fees",
        id: 4,
      },
      {
        name: "Evergreen retainers",
        id: 5,
      },
      {
        name: "Other",
        id: 6,
      },
    ],
    billingFrequency: [
      {
        name: "Bi-weekly",
        id: 1,
      },
      {
        name: "Bi-monthly",
        id: 2,
      },
      {
        name: "Monthly",
        id: 3,
      },
      {
        name: "Quarterly",
        id: 4,
      },
      {
        name: "Semi-annually",
        id: 5,
      },
      {
        name: "Upon completion",
        id: 6,
      },
      {
        name: "Other",
        id: 7,
      },
    ],
    serviceFeesCharged: [
      { name: "Time incurred fees", id: 1 },
      { name: "Fixed fee", id: 2 },
      { name: "Sliding scale fees", id: 3 },
      { name: "Contigency fees", id: 4 },
      { name: "Evergreen retainers", id: 5 },
      { name: "Other", id: 6 },
    ],
    disbursementFrequency: [
      {
        name: "Bi-weekly",
        id: 1,
      },
      {
        name: "Bi-monthly",
        id: 2,
      },
      {
        name: "Monthly",
        id: 3,
      },
      {
        name: "Quarterly",
        id: 4,
      },
      {
        name: "Semi-annually",
        id: 5,
      },
      {
        name: "Upon completion",
        id: 6,
      },
      {
        name: "Other",
        id: 7,
      },
    ],
    revenueCollection: [
      { name: "LawPay", id: 1 },
      { name: "Square", id: 2 },
      { name: "Stripe", id: 3 },
      { name: "Other", id: 4 },
    ],
    vendorPayments: [
      { name: "Plooto", id: 1 },
      { name: "Paypal", id: 2 },
      { name: "Bill.com", id: 3 },
      { name: "SparcPay.com", id: 4 },
      { name: "Other", id: 5 },
    ],
    vendor_payment: "",
  });
  const [form6Data, setForm6Data] = useState({
    payrollFrequency: [
      { name: "Weekly", id: 1 },
      { name: "Bi-weekly", id: 2 },
      { name: "Monthly", id: 3 },
      { name: "Other", id: 4 },
    ],
    newHeight: 0,
    third_party: "",
    billing_frequency: "",
    direct_payment: "",
    vendorPayments: [
      { name: "Plooto", id: 1 },
      { name: "Paypal", id: 2 },
      { name: "Bill.com", id: 3 },
      { name: "Other", id: 4 },
    ],
  });
  const [form7Data, setForm7Data] = useState({
    month_QBO: "",
    formCompleted: false,
  });

  const [snackbarState, setSnackbarState] = useState({
    open: false,
    msg: "",
  });

  const history = useHistory();
  let ref1 = useRef(null);
  let ref2 = useRef(null);
  let ref3 = useRef(null);
  let ref4 = useRef(null);
  let ref5 = useRef(null);
  let ref6 = useRef(null);
  let ref7 = useRef(null);
  let fileUploadForm = useRef(null);
  let refMultipleSelect = useRef(null);
  let refCountryDropDown1 = useRef(null);
  let roleDropdownRef = useRef(null);
  const [activeHeight, setActiveHeight] = useState(null);
  const location = useLocation();
  const countryDropdownList = ["Canada", "America"];
  const roleDropdownList = [
    { value: "Admin", label: "Administrator" },
    {
      value: "Preparer",
      label: "Preparer",
    },
    {
      value: "Reviewer",
      label: "Approver",
    },
  ];

  const provinceDropdownList = [
    { value: "ON", label: "Ontario" },
    { value: "AB", label: "Alberta" },
    { value: "BC", label: "British Columbia" },
    { value: "MB", label: "Manitoba" },
    { value: "SK", label: "Saskatchewan" },
  ];

  const dispatch = useDispatch();
  const { userRole } = useSelector((state) => state.userChange);

  const stepsInfo = [
    {
      id: 1,
      name: "Law firm details",
    },
    {
      id: 2,
      name: "Tax and financial details",
    },
    {
      id: 3,
      name: "CloudAct Platform Account roles",
    },
    // {
    //   id: 4,
    //   name: "Bank account details",
    // },
    // {
    //   id: 5,
    //   name: "Billing & other related information",
    // },
    // {
    //   id: 6,
    //   name: "Payroll",
    // },
    // {
    //   id: 7,
    //   name: "Other details",
    // },
  ];

  useEffect(() => {
    setActiveHeight(determineWhichHeight());
  }, [activeStep, form3Data, form1Data, form6Data, form7Data, form5Data]);

  const fetchCompanyData = async () => {
    try {
      console.log("Fetching company data...");
      const sid = getUserSID();

      const res = await axios.get(`/companyinfo/${sid}`);
      console.log("Company Info Response:", res);

      if (res.data.data.code === 200) {
        const companyData = res.data.data.body;
        const { CountrySubDivisionCode } = companyData.legaladdress;

        // Update province info in the current user session
        updateInfoInCurrentUser({ province: CountrySubDivisionCode });

        if(!CountrySubDivisionCode || CountrySubDivisionCode === ""){
          toast.error("Province is not setup in QBO");
        }

        // Now, update company data
        await updateCompanyData(companyData);
      } else if (res.data.data.code === 400) {
        const message = res.data.data.message.message;
        if (
          !complianceReports &&
          message === "Please reconnect with Clio and QuickBooks"
        ) {
          console.log(
            "Suppressed error: Please reconnect with Clio and QuickBooks"
          );
        } else {
          toast.error(message);
        }
      } else {
        throw new Error("Unexpected response code");
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast.error("Internal Server Error");
    }
  };

  const updateCompanyData = async (companyData) => {
    try {
      const sid = getUserSID();
      const res = await axios.put(`/update/companyData/${sid}`, {
        companyData,
      });
      console.log("Company data updated successfully:", res.data);
    } catch (error) {
      console.error("Error updating company data:", error);
      toast.error("Failed to update province");
    }
  };

  useEffect(() => {
    if (activeStep === 1) {
      const fetchData = async () => {
        console.log("Checking user role and fetching company data...");
        const user = getCurrentUserFromCookies();

        if (user.role !== "SUPERADMIN") {
          try {
            const sid = getUserSID();
            const companyDataResponse = await axios.get(
              `/getcompanydata/${sid}`
            );
            console.log("Company Data Response:", companyDataResponse.data);

            console.log("Company Data Response:", companyDataResponse.data);

            const isSuccess = companyDataResponse.data.code === 200;
            const companyInfo = companyDataResponse.data.data[0]?.companyInfo;

            if (isSuccess) {
              if (!companyInfo) {
                console.log(
                  "Company data exists, but company info is missing. Fetching company info..."
                );
                await fetchCompanyData();
              } else {
                console.log(
                  "Company data already exists, skipping API call",
                  companyInfo
                );
              }
            } else {
              console.log("Company data not found. Fetching company info...");
              await fetchCompanyData();
            }
          } catch (error) {
            console.error("Error fetching company data:", error);
            if (error?.response?.status !== 401) {
              toast.error("Failed to fetch company data.");
            }
          }
        }
      };

      fetchData();
    }
  }, []); // Runs only on the initial render

  useEffect(() => {
    //    if (activeStep === 1) {
    //   axios
    //     .get(`/companyinfo/${getUserSID()}`)
    //     .then((res) => {
    //       console.log("res", res);
    //       if (res.data.data.code === 200) {
    //         setCompanyInfo({ loaded: true, ...res.data.data.body });
    //         const {CountrySubDivisionCode } = res.data.data.body.legaladdress;
    // console.log('✌️CountrySubDivisionCode --->', CountrySubDivisionCode);
    //         if (CountrySubDivisionCode) {
    //           updateInfoInCurrentUser({province:CountrySubDivisionCode});
    //         }
    //       } else {
    //         throw res.data.data.status;
    //       }
    //     })
    //     .catch((err) => {
    //       console.log("err", err);
    //       setCompanyInfo({ loaded: true, companyInfo: {} });
    //     });
    // }

    const trustAccounts = axios.get(
      `/trust/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );
    const generalAccounts = axios.get(
      `/general/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );
    const cardAccounts = axios.get(
      `/card/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );
    Promise.all([trustAccounts, generalAccounts, cardAccounts])
      .then(([trustAccount, generalAccount, creditAccount]) => {
        const {
          data: {
            data: { body: trustAccountResponse },
          },
        } = trustAccount;
        const {
          data: {
            data: { body: generalAccountResponse },
          },
        } = generalAccount;
        const {
          data: {
            data: { body: creditAccountResponse },
          },
        } = creditAccount;

        setForm4Data({
          trust_bank_accounts: trustAccountResponse,
          general_bank_accounts: generalAccountResponse,
          credit_card_accounts: creditAccountResponse,
        });
      })
      .catch((err) => {
        console.log("err", err);
        alert("Server Error");
      });
  }, []);

  useEffect(() => {
    const allUsersData = [];
    const allReviewers = axios.get(`/user/list/${getUserSID()}/${getUserId()}`);
    const allPreparers = axios.get(`/user/list/${getUserSID()}/${getUserId()}`);
    const allAdmins = axios.get(`/user/list/${getUserSID()}/${getUserId()}`);
    Promise.all([allReviewers, allPreparers, allAdmins])
      .then(([allReviewer, allPreparer, allAdmins]) => {
        // const {
        //   data: {
        //     data: { body: reviewersData },
        //   },
        // } = allReviewer;

        // const {
        //   data: {
        //     data: { body: preparerData },
        //   },
        // } = allPreparer;
        const {
          data: {
            data: { body: adminData },
          },
        } = allAdmins;

        allUsersData.push(...adminData);

        setForm3Data({
          addUserModalShow: false,
          form3DataUsers: allUsersData,
          editUserShowModal: false,
          modalUserEmail: "",
          modalUserName: "",
          modalUserRole: "Preparer",
          indexToChange: 0,
          userAddedAsSomething: false,
          showLinkConfirmationSend: false,
        });
      })
      .catch((err) => {
        console.log("err", err);
      });
  }, [form3Data.reloadAgain]);

  useEffect(() => {
    const fetchData = async () => {
      axios
        .get(`/client/details/${getUserSID()}`)
        .then((res) => {
          const parsingData1 = JSON.parse(res.data.data.body.firm_details);
          console.log("parsing Data1", parsingData1);
          const parsingData2 = JSON.parse(
            res.data.data.body.financial_text_details
          );
          // const parsingData3 = JSON.parse(res.data.data.body.financial_reporting);
          const parsingData4 = JSON.parse(
            res.data.data.body.bank_account_details
          );
          const parsingData5 = JSON.parse(res.data.data.body.billing_info);
          const parsingData6 = JSON.parse(res.data.data.body.payroll);
          const parsingData7 = JSON.parse(res.data.data.body.other_details);

          setForm1Data({ ...form1Data, ...parsingData1 });
          setForm2Data({ ...form2Data, ...parsingData2 });

          setForm4Data({ ...form4Data, ...parsingData4 });
          setForm5Data({ ...form5Data, ...parsingData5 });
          setForm6Data({ ...form6Data, ...parsingData6 });
          setForm7Data({ ...form7Data, ...parsingData7 });

          let activeStepVar = 1;
          if (parsingData1.BusinessNumber === "") {
            setCompletedSteps(0);
            setActiveStep(1);
            activeStepVar = 1;
          } else if (parsingData2.HST === "") {
            setCompletedSteps(1);
            setActiveStep(2);
            activeStepVar = 2;
          } else if (parsingData5.vendor_payment === "") {
            setCompletedSteps(4);
            setActiveStep(3);
            activeStepVar = 5;
          } else if (parsingData6.direct_payment === "") {
            setCompletedSteps(5);
            setActiveStep(3);
            activeStepVar = 6;
          } else {
            // setCompletedSteps(7);
            // setActiveStep(7);
            // activeStepVar = 7;
          }

          setLoaded(true);
          setActiveHeight(determineWhichHeight(activeStepVar));
        })
        .catch((err) => {
          setForm1Data({ ...form1Data });
          setForm2Data({ ...form2Data });
          setForm3Data({ ...form3Data });
          setForm4Data({ ...form4Data });
          setForm5Data({ ...form5Data });
          setForm6Data({ ...form6Data });
          setForm7Data({ ...form7Data });
          setLoaded(true);
          console.log("err", err);
        });
    };

    fetchData();
  }, []);

  useEffect(() => {
    dispatch(
      taxAndFinancialDetailsAction({
        ...form2Data,
        months:
          form2Data.HST == "Quarterly"
            ? [
                momentFunction.addMonths(companyInfo.fiscalstartmonth, "1", 3),
                momentFunction.addMonths(companyInfo.fiscalstartmonth, "1", 6),
                momentFunction.addMonths(companyInfo.fiscalstartmonth, "1", 9),
                momentFunction.addMonths(companyInfo.fiscalstartmonth, "1", 12),
              ]
            : form2Data.HST == "Yearly"
            ? [momentFunction.addMonths(companyInfo.fiscalstartmonth, "1", 12)]
            : [],
        financialYearEnd: momentFunction.getPreviousMonthFromString(
          companyInfo.fiscalstartmonth
        ),
        annualTaxFilingDate:
          form1Data.typeFirm === "Sole proprietor" &&
          form1Data.selfEmployed === "No"
            ? "June"
            : form1Data.selfEmployed === "Yes"
            ? "June"
            : momentFunction.addMonths(companyInfo.fiscalstartmonth, "1", 6),
      })
    );
  }, [form2Data, companyInfo]);

  const determineWhichHeight = (activeStepVar = activeStep) => {
    console.log("in determine which step", activeStepVar);
    // console.log("ref 7", ref7.current.scrollHeight);
    switch (activeStepVar) {
      case 1:
        return ref1.current.scrollHeight;

      case 2:
        return ref2.current.scrollHeight;

      case 3:
        console.log("ref 3 ", ref3.current.scrollHeight);
        return ref3.current.scrollHeight;

      // case 4:
      //   return ref4.current.scrollHeight;

      // case 5:
      //   return ref5.current.scrollHeight;

      // case 6:
      //   return ref6.current.scrollHeight;

      // case 7:
      //   return ref7.current.scrollHeight;

      default:
        break;
    }
  };

  const getCompanyLegalAddress = (type) => {
    try {
      const { legaladdress } = companyInfo;

      switch (type) {
        case "street":
          if (!complianceReports) {
            return legaladdress?.Line1;
          }
          return legaladdress.Line1 + ", " + legaladdress.PostalCode;

        case "Country":
          return legaladdress?.Country;

        case "Province":
          return legaladdress?.CountrySubDivisionCode;

        default:
          break;
      }
    } catch (error) {
      console.log("err", error);
      return "";
    }
  };

  console.log(companyInfo);
  const showPSTColumns = () => {
    const province = getCompanyLegalAddress("Province");
    // const province =  companyInfo.legaladdress.CountrySubDivisionCode;
    console.log("getCompnay", province);
    if (province) {
      if (
        province === "BC" ||
        province === "SK" ||
        province === "QC" ||
        province === "MB"
      )
        return true;
    }
    return false;
  };

  const onChangeFirmDetails = (e) => {
    const name = e.target.name;
    const val = e.target.value;
    if (name === "companyname") {
      setCompanyInfo({ ...companyInfo, companyname: val });
    }
    if (name === "street") {
      setCompanyInfo({
        ...companyInfo,
        legaladdress: { ...companyInfo.legaladdress, Line1: val },
      });
    }
    if (name === "province") {
      setCompanyInfo({
        ...companyInfo,
        legaladdress: {
          ...companyInfo.legaladdress,
          CountrySubDivisionCode: val,
        },
      });
    }
    if (name === "country") {
      setCompanyInfo({
        ...companyInfo,
        legaladdress: { ...companyInfo.legaladdress, Country: val },
      });
    }
  };

  const onChangeInput = (e) => {
    const name = e.target.name;
    const val = e.target.value;

    setForm1Data({ ...form1Data, [name]: val });
  };

  const onChangeInput3 = (e) => {
    const name = e.target.name;
    const val = e.target.value;

    setForm3Data({ ...form3Data, [name]: val });
  };

  const onChangeInput6 = (e) => {
    const name = e.target.name;
    const val = e.target.value;

    setForm6Data({ ...form6Data, [name]: val });
  };

  const onChangeInput7 = (e) => {
    const name = e.target.name;
    const val = e.target.value;

    setForm7Data({ ...form7Data, [name]: val });
  };

  const handleSubmitForm1 = (e) => {
    e.preventDefault();
    axios
      .post("/client/details", {
        uid: getUserId(),
        sid: getUserSID(),
        firm_details: { ...form1Data },
        financial_text_details: { ...form2Data },
        financial_reporting: { ...form3Data },
        bank_account_details: { ...form4Data },
        billing_info: { ...form5Data },
        payroll: { ...form6Data },
        other_details: { ...form7Data },
      })
      .then(async (res) => {
        console.log("res", res);
        if (!complianceReports) {
          updateInfoInCurrentUser({
            province: companyInfo.legaladdress.CountrySubDivisionCode,
          });
          await updateCompanyData(companyInfo);
        }

        setCompletedSteps(1);
        setActiveStep(2);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const handleSubmitForm2 = (e) => {
    e.preventDefault();
    axios
      .post("/client/details", {
        uid: getUserId(),
        sid: getUserSID(),
        firm_details: { ...form1Data },
        financial_text_details: { ...form2Data },
        financial_reporting: { ...form3Data },
        bank_account_details: { ...form4Data },
        billing_info: { ...form5Data },
        payroll: { ...form6Data },
        other_details: { ...form7Data },
      })
      .then((res) => {
        console.log("res", res);
        // history.push("/setupwizard?step=4&form=3");
        setCompletedSteps(2);
        setActiveStep(3);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const handleSubmitForm3 = (e) => {
    e.preventDefault();
    axios
      .post("/client/details", {
        uid: getUserId(),
        sid: getUserSID(),
        firm_details: { ...form1Data },
        financial_text_details: { ...form2Data },
        financial_reporting: { ...form3Data },
        bank_account_details: { ...form4Data },
        billing_info: { ...form5Data },
        payroll: { ...form6Data },
        other_details: { ...form7Data },
      })
      .then((res) => {
        console.log("res", res);
        // history.push("/setupwizard?step=4&form=4");
        setCompletedSteps(3);
        // setActiveStep(4);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const handleSubmitForm4 = (e) => {
    e.preventDefault();

    axios
      .post("/client/details", {
        uid: getUserId(),
        sid: getUserSID(),
        firm_details: { ...form1Data },
        financial_text_details: { ...form2Data },
        financial_reporting: { ...form3Data },
        bank_account_details: { ...form4Data },
        billing_info: { ...form5Data },
        payroll: { ...form6Data },
        other_details: { ...form7Data },
      })
      .then((res) => {
        console.log("res", res);
        // history.push("/setupwizard?step=4&form=5");
        setCompletedSteps(4);
        setActiveStep(5);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const handleSubmitForm5 = (e) => {
    e.preventDefault();
    axios
      .post("/client/details", {
        uid: getUserId(),
        sid: getUserSID(),
        firm_details: { ...form1Data },
        financial_text_details: { ...form2Data },
        financial_reporting: { ...form3Data },
        bank_account_details: { ...form4Data },
        billing_info: { ...form5Data },
        payroll: { ...form6Data },
        other_details: { ...form7Data },
      })
      .then((res) => {
        console.log("res", res);
        // history.push("/setupwizard?step=4&form=6");
        setCompletedSteps(5);
        setActiveStep(6);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const checkFormDisabled = () => {
    if (complianceReports) {
      return true;
    }
    return false;
  };

  const handleSubmitForm6 = (e) => {
    e.preventDefault();
    axios
      .post("/client/details", {
        uid: getUserId(),
        sid: getUserSID(),
        firm_details: { ...form1Data },
        financial_text_details: { ...form2Data },
        financial_reporting: { ...form3Data },
        bank_account_details: { ...form4Data },
        billing_info: { ...form5Data },
        payroll: { ...form6Data },
        other_details: { ...form7Data },
      })
      .then((res) => {
        console.log("res", res);
        // history.push("/setupwizard?step=4&form=7");
        setCompletedSteps(6);
        // setActiveStep(7);
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const handleSubmitForm7 = (e) => {
    e.preventDefault();
    axios
      .post("/client/details", {
        uid: getUserId(),
        sid: getUserSID(),
        firm_details: { ...form1Data },
        financial_text_details: { ...form2Data },
        financial_reporting: { ...form3Data },
        bank_account_details: { ...form4Data },
        billing_info: { ...form5Data },
        payroll: { ...form6Data },
        other_details: { ...form7Data },
      })
      .then((res) => {
        console.log("res", res);
        setForm7Data({ ...form7Data, formCompleted: true });
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const LLPConditionalStatement = () => {
    return (
      form1Data["typeFirm"] === "Limited liability partnership" && (
        <>
          {form1Data.partnerAccount.map((ev, index) => {
            return (
              <>
                <div className="col-md-5" key={index}>
                  <InputCustom
                    type="text"
                    label="Name of Partner"
                    handleChange={(e) =>
                      setForm1Data({
                        ...form1Data,
                        detailsOfPartners: e.target.value,
                      })
                    }
                    value={ev.name}
                  ></InputCustom>
                </div>
                <div className="col-md-5" key={index}>
                  <InputCustom
                    type="text"
                    label="Type"
                    handleChange={(e) =>
                      setForm1Data({
                        ...form1Data,
                        typeOfPartner: e.target.value,
                      })
                    }
                    value={ev.type}
                  ></InputCustom>
                </div>
                <div className="col-md-2">
                  <span
                    className="crossBtn"
                    onClick={(e) => {
                      e.preventDefault();
                      const nameToDelete = form1Data.partnerAccount[index].name;
                      const deleteElement = form1Data.partnerAccount.splice(
                        index,
                        1
                      );
                      setForm1Data({
                        ...form1Data,
                        partnerAccount: form1Data.partnerAccount.filter(
                          (partner) => partner.name !== nameToDelete
                        ),
                      });
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </span>
                </div>
              </>
            );
          })}
          <span className="heading" style={{ margin: "-15px 0 0 0" }}>
            Please provide the details of partners.{" "}
            <a
              onClick={() =>
                setModalsForm1({
                  ...modalsForm1,
                  showModalPartner: true,
                  gstInputVal:
                    "RT00" +
                    (form1Data.GSTNumber && form1Data.otherGSTNumbers.length > 0
                      ? form1Data.otherGSTNumbers.length + 2
                      : !form1Data.GSTNumber
                      ? 1
                      : form1Data.otherGSTNumbers.length + 2),
                })
              }
            >
              + Add Partner
            </a>
          </span>
        </>
      )
    );
  };

  const form1 = () => {
    return (
      <>
        <OnboardingSteps
          list={stepsInfo}
          activeStep={activeStep}
          setActiveStepFunc={(e) => {
            setActiveStep(e);
            setCompletedSteps(e - 1);
          }}
          completedSteps={completedSteps}
          activeHeight={activeHeight}
        ></OnboardingSteps>
        <form
          ref={ref1}
          onSubmit={handleSubmitForm1}
          autoComplete="off"
          className="setUpAccount"
        >
          <div className="row">
            <span className="heading">
              Name & registered address{" "}
              <InfoButton>
                The Name & registered address has been grabbed from your
                Quickbook's account.
              </InfoButton>
            </span>
            <div className="col-md-6">
              <InputCustom
                type="text"
                label="Firm Name"
                name="companyname"
                value={companyInfo !== {} ? companyInfo.companyname : ""}
                className={checkFormDisabled() ? "disabled" : ""}
                required
                handleChange={onChangeFirmDetails}
                disabled={checkFormDisabled() ? true : false}
              ></InputCustom>
            </div>
            <div className="col-md-6">
              <InputCustom
                required
                type="text"
                id="outlined-basic"
                label="Street"
                name="street"
                disabled={checkFormDisabled() ? true : false}
                className={checkFormDisabled() ? "disabled" : ""}
                handleChange={onChangeFirmDetails}
                value={
                  companyInfo.legaladdress
                    ? // companyInfo.legaladdress.legaladdress.Line1 + ", " + companyInfo.legaladdress.PostalCode

                      getCompanyLegalAddress("street")
                    : ""
                }
              />
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Province</label>
                <Dropdown
                  options={provinceDropdownList}
                  value={
                    companyInfo !== {} && companyInfo.legaladdress
                      ? companyInfo.legaladdress.CountrySubDivisionCode
                      : ""
                  }
                  onChange={(e) => {
                    onChangeFirmDetails({
                      target: {
                        name: "province",
                        value: e.value,
                      },
                    });
                  }}
                ></Dropdown>
                {/* <label>Province</label>
                <input
                  required
                  type="text"
                  id="outlined-basic"
                  label="Registered Address"
                  variant="outlined"
                  name="province"
                  disabled={checkFormDisabled() ? true : false}
                  className={"form-control " + (checkFormDisabled() ? "disabled" : "")}
                  onChange={onChangeFirmDetails}
                  value={
                    companyInfo !== {}
                      ?
                      getCompanyLegalAddress("Province")
                      // companyInfo?.legaladdress?.CountrySubDivisionCode
                      : ""
                  }
                /> */}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Country</label>
                <input
                  required
                  type="text"
                  id="outlined-basic"
                  label="Registered Address"
                  variant="outlined"
                  name="country"
                  disabled={checkFormDisabled() ? true : false}
                  className={
                    "form-control " + (checkFormDisabled() ? "disabled" : "")
                  }
                  value={
                    companyInfo !== {}
                      ? getCompanyLegalAddress("Country")
                      : // companyInfo?.legaladdress?.Country
                        ""
                  }
                  onChange={onChangeFirmDetails}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Business number</label>
                <input
                  required
                  type="number"
                  label="Business number"
                  className="form-control"
                  name="BusinessNumber"
                  id="BusinessNumber"
                  value={form1Data.BusinessNumber}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length <= 9) onChangeInput(e);
                  }}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label
                      className={`${
                        (form1Data.NumberOfLawyers < 0 ||
                          !form1Data.NumberOfLawyers) &&
                        "text-error"
                      }`}
                    >
                      Number of lawyers
                    </label>
                    <input
                      required
                      type="number"
                      className={`form-control ${
                        form1Data.NumberOfLawyers >= 0 ? "" : "border_red"
                      }`}
                      min="0"
                      max="1000"
                      onChange={(e) => {
                        onChangeInput(e);
                      }}
                      name="NumberOfLawyers"
                      value={form1Data.NumberOfLawyers}
                    />
                    {form1Data.NumberOfLawyers < 0 && (
                      <span className="text text-error">
                        Please enter positive values
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label
                      className={`${
                        (form1Data.NumberOfParalegals < 0 ||
                          !form1Data.NumberOfParalegals) &&
                        "text-error"
                      }`}
                    >
                      Number of paralegals
                    </label>
                    <input
                      required
                      min="0"
                      max="1000"
                      type="number"
                      name="NumberOfParalegals"
                      className={`form-control ${
                        form1Data.NumberOfParalegals >= 0 ? "" : "border_red"
                      }`}
                      onChange={onChangeInput}
                      value={form1Data.NumberOfParalegals}
                    />
                    {form1Data.NumberOfParalegals < 0 && (
                      <span className="text text-error">
                        Please enter positive values
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Type of law firm</label>
                <div className="d-flex flex-wrap">
                  {form1Data?.typeFirmList?.map((e, index) => {
                    return (
                      <div key={e.id} className="checkboxGroup">
                        <label>
                          <input
                            required
                            type="radio"
                            name="typeFirm"
                            checked={form1Data["typeFirm"] === e.name}
                            value={e.name}
                            onChange={(e) => {
                              setForm1Data({
                                ...form1Data,
                                [e.target.name]: e.target.value,
                              });
                            }}
                          ></input>{" "}
                          {e.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label
                      className={`${
                        (form1Data.NumberOfOfficeStaff < 0 ||
                          !form1Data.NumberOfOfficeStaff) &&
                        "text-error"
                      }`}
                    >
                      Number of office staff
                    </label>
                    <input
                      required
                      min="0"
                      type="number"
                      max="1000"
                      name="NumberOfOfficeStaff"
                      className={`form-control ${
                        form1Data.NumberOfOfficeStaff >= 0 ? "" : "border_red"
                      }`}
                      value={form1Data.NumberOfOfficeStaff}
                      onChange={onChangeInput}
                    />
                    {form1Data.NumberOfOfficeStaff < 0 && (
                      <span className="text text-error">
                        Please enter positive values
                      </span>
                    )}
                  </div>
                </div>
                {form1Data.typeFirm === "Professional corporation" && (
                  <div className="col-md-6">
                    {form1Data.CorporateTaxNumber && (
                      <DoubleInput
                        fixedVal={form1Data.BusinessNumber || "Business Number"}
                        val={
                          form1Data.CorporateTaxNumber &&
                          form1Data.BusinessNumber
                            ? form1Data.CorporateTaxNumber
                            : ""
                        }
                        handleChange={(e) => {
                          setForm1Data({ ...form1Data, CorporateTaxNumber: e });
                        }}
                        name="CorporateTaxNumber"
                        labelValue="Corporate Tax Number"
                        showCross={true}
                        deleteElement={(e) => {
                          setForm1Data({
                            ...form1Data,
                            CorporateTaxNumber: "",
                          });
                        }}
                      />
                    )}
                    {form1Data.BusinessNumber &&
                      form1Data.otherCorporateTaxNumber.map((e, index) => {
                        return (
                          <DoubleInput
                            fixedVal={
                              form1Data.BusinessNumber || "Business Number"
                            }
                            val={form1Data.otherCorporateTaxNumber[index]}
                            handleChange={(event) => {
                              let allCorporateNumbers =
                                form1Data.otherCorporateTaxNumber;
                              allCorporateNumbers[index] = event;
                              setForm1Data({
                                ...form1Data,
                                otherCorporateTaxNumber: allCorporateNumbers,
                              });
                            }}
                            showCross={true}
                            deleteElement={(e) => {
                              setForm1Data({
                                ...form1Data,
                                otherCorporateTaxNumber:
                                  form1Data.otherCorporateTaxNumber.filter(
                                    (corporateNumber) => {
                                      return corporateNumber !== e;
                                    }
                                  ),
                              });
                            }}
                            name="corporate Number"
                            labelValue={`Corporate Tax Number ${index + 2}`}
                          />
                        );
                      })}
                    <a
                      className="text"
                      onClick={() => {
                        setModalsForm1({
                          ...modalsForm1,
                          showModalCorporateTaxNumber: true,
                          corporateTaxNumberInputVal:
                            "RC00" +
                            (form1Data.CorporateTaxNumber &&
                            form1Data.otherCorporateTaxNumber.length > 0
                              ? form1Data.otherCorporateTaxNumber.length + 2
                              : !form1Data.CorporateTaxNumber
                              ? 1
                              : form1Data.otherCorporateTaxNumber.length + 2),
                        });
                      }}
                    >
                      + Add Corporate Tax Number
                    </a>
                  </div>
                )}

                {form1Data.typeFirm === "Limited liability partnership" && (
                  <div className="col-md-6">
                    {form1Data.partnershipNumber && (
                      <DoubleInput
                        fixedVal={form1Data.BusinessNumber || "Business Number"}
                        val={
                          form1Data.partnershipNumber &&
                          form1Data.BusinessNumber
                            ? form1Data.partnershipNumber
                            : ""
                        }
                        handleChange={(e) => {
                          setForm1Data({ ...form1Data, partnershipNumber: e });
                        }}
                        name="PartnershipNumber"
                        labelValue="Partnership Number"
                        showCross={true}
                        deleteElement={(e) => {
                          setForm1Data({ ...form1Data, partnershipNumber: "" });
                        }}
                      />
                    )}
                    {form1Data.BusinessNumber &&
                      form1Data.otherPartnershipNumber.map((e, index) => {
                        return (
                          <DoubleInput
                            fixedVal={
                              form1Data.BusinessNumber || "Business Number"
                            }
                            val={form1Data.otherPartnershipNumber[index]}
                            handleChange={(event) => {
                              let allCorporateNumbers =
                                form1Data.otherPartnershipNumber;
                              allCorporateNumbers[index] = event;
                              setForm1Data({
                                ...form1Data,
                                otherPartnershipNumber: allCorporateNumbers,
                              });
                            }}
                            showCross={true}
                            deleteElement={(e) => {
                              setForm1Data({
                                ...form1Data,
                                otherPartnershipNumber:
                                  form1Data.otherPartnershipNumber.filter(
                                    (corporateNumber) => {
                                      return corporateNumber !== e;
                                    }
                                  ),
                              });
                            }}
                            name="Partnership Number"
                            labelValue={`Partnership Number ${index + 2}`}
                          />
                        );
                      })}
                    <a
                      className="text"
                      onClick={() => {
                        setModalsForm1({
                          ...modalsForm1,
                          showModalPartnershipNumber: true,
                          partnershipNumber:
                            "RZ" +
                            (form1Data.partnershipNumber &&
                            form1Data.otherPartnershipNumber.length > 0
                              ? form1Data.otherPartnershipNumber.length + 1000
                              : !form1Data.partnershipNumber
                              ? 1001
                              : form1Data.otherPartnershipNumber.length + 1001),
                        });
                      }}
                    >
                      + Add Partnership Number
                    </a>
                  </div>
                )}
              </div>
            </div>
            {LLPConditionalStatement()}
            <div className="col-md-6">
              {form1Data.GSTNumber && (
                <DoubleInput
                  fixedVal={form1Data.BusinessNumber || "Business Number"}
                  val={
                    form1Data.GSTNumber && form1Data.BusinessNumber
                      ? form1Data.GSTNumber
                      : ""
                  }
                  handleChange={(e) => {
                    setForm1Data({ ...form1Data, GSTNumber: e });
                  }}
                  name="GSTNumber"
                  labelValue="GST/HST number"
                  showCross={true}
                  deleteElement={(e) => {
                    setForm1Data({ ...form1Data, GSTNumber: "" });
                  }}
                />
              )}
              {form1Data.BusinessNumber &&
                form1Data.otherGSTNumbers.map((e, index) => {
                  return (
                    <DoubleInput
                      fixedVal={form1Data.BusinessNumber || "Business Number"}
                      val={form1Data.otherGSTNumbers[index]}
                      handleChange={(event) => {
                        let allGSTNumbers = form1Data.otherGSTNumbers;
                        allGSTNumbers[index] = event;
                        setForm1Data({
                          ...form1Data,
                          otherGSTNumbers: allGSTNumbers,
                        });
                      }}
                      name="GSTNumber"
                      labelValue={`GST/HST number ${index + 2}`}
                      showCross={true}
                      deleteElement={(e) => {
                        setForm1Data({
                          ...form1Data,
                          otherGSTNumbers: form1Data.otherGSTNumbers.filter(
                            (gstNumber) => {
                              return gstNumber !== e;
                            }
                          ),
                        });
                      }}
                    />
                  );
                })}
              <a
                className="text"
                onClick={() =>
                  setModalsForm1({
                    ...modalsForm1,
                    showModalGST: true,
                    gstInputVal:
                      "RT00" +
                      (form1Data.GSTNumber &&
                      form1Data.otherGSTNumbers.length > 0
                        ? form1Data.otherGSTNumbers.length + 2
                        : !form1Data.GSTNumber
                        ? 1
                        : form1Data.otherGSTNumbers.length + 2),
                  })
                }
              >
                + Add GST Number
              </a>
            </div>
            <div className="col-md-6">
              {form1Data.PayrollNumber && (
                <DoubleInput
                  fixedVal={form1Data.BusinessNumber || "Business Number"}
                  val={
                    form1Data.PayrollNumber && form1Data.BusinessNumber
                      ? form1Data.PayrollNumber
                      : ""
                  }
                  handleChange={(e) => {
                    setForm1Data({ ...form1Data, PayrollNumber: e });
                  }}
                  name="PayrollNumber"
                  labelValue="Payroll number"
                  showCross={true}
                  deleteElement={(e) => {
                    setForm1Data({ ...form1Data, PayrollNumber: "" });
                  }}
                />
              )}
              {form1Data.BusinessNumber &&
                form1Data.otherPayrollNumber.map((e, index) => {
                  return (
                    <DoubleInput
                      fixedVal={form1Data.BusinessNumber || "Business Number"}
                      val={form1Data.otherPayrollNumber[index]}
                      handleChange={(event) => {
                        let allPayrollNumbers = form1Data.otherPayrollNumber;
                        allPayrollNumbers[index] = event;
                        setForm1Data({
                          ...form1Data,
                          otherPayrollNumber: allPayrollNumbers,
                        });
                      }}
                      name="PayrollNumber"
                      labelValue={`Payroll number ${index + 2}`}
                      showCross={true}
                      deleteElement={(e) => {
                        setForm1Data({
                          ...form1Data,
                          otherPayrollNumber:
                            form1Data.otherPayrollNumber.filter(
                              (payrollNumber) => {
                                return payrollNumber !== e;
                              }
                            ),
                        });
                      }}
                    />
                  );
                })}
              <a
                className="text"
                onClick={() =>
                  setModalsForm1({
                    ...modalsForm1,
                    showModalPayroll: true,
                    payrollInputVal:
                      "RP00" +
                      (form1Data.PayrollNumber &&
                      form1Data.otherPayrollNumber.length > 0
                        ? form1Data.otherPayrollNumber.length + 2
                        : !form1Data.PayrollNumber
                        ? 1
                        : form1Data.otherPayrollNumber.length + 2),
                  })
                }
              >
                + Add payroll number
              </a>
            </div>
            <div className="col-md-12">
              <div className="form-group mt-3">
                <Autocomplete
                  multiple
                  id="size-medium-outlined-multi"
                  size="medium"
                  options={areaOfLawPracticeForm1}
                  onChange={(event, value) => {
                    setForm1Data({ ...form1Data, areaOfLawPractice: value });
                  }}
                  getOptionLabel={(option) => option.name}
                  defaultValue={form1Data.areaOfLawPractice}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Practice Area"
                      placeholder="Practice Area"
                    />
                  )}
                />
              </div>
            </div>
            {form1Data["typeFirm"] === "Sole Proprietor" && (
              <div className="col-md-6">
                <div className="form-group">
                  <label>Please confirm if you are self Employed</label>
                  <div className="checkboxGroup">
                    <label>
                      <input
                        type="radio"
                        name="employed"
                        value="Yes"
                        onChange={(e) => {
                          setForm1Data({
                            ...form1Data,
                            selfEmployed: e.target.value,
                          });
                        }}
                        checked={form1Data.selfEmployed === "Yes"}
                      />{" "}
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="employed"
                        value="No"
                        onChange={(e) => {
                          setForm1Data({
                            ...form1Data,
                            selfEmployed: e.target.value,
                          });
                        }}
                        checked={form1Data.selfEmployed === "No"}
                      />{" "}
                      No
                    </label>
                  </div>
                </div>
              </div>
            )}
            {form1Data.areaOfLawPractice.length >= 1 &&
              form1Data.areaOfLawPractice[0].name === "Other" && (
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Other - Area of Law Practice</label>
                    <input
                      required
                      type="text"
                      name="other_areaOfLaw"
                      value={form1Data.other_areaOfLaw}
                      onChange={(e) => {
                        setForm1Data({
                          ...form1Data,
                          [e.target.name]: e.target.value,
                        });
                      }}
                      className="form-control"
                      value={form1Data.other_areaOfLaw}
                    />
                  </div>
                </div>
              )}
            {showPSTColumns() && (
              <div className="col-md-6">
                <div className="form-group">
                  <label>PST Number</label>
                  <input
                    required
                    type="number"
                    className="form-control"
                    onChange={onChangeInput}
                    value={form1Data.PSTNumber}
                    name="PSTNumber"
                  />
                </div>
              </div>
            )}
            <div className="btnGroup mt-0">
              <button
                onClick={() => {
                  history.push("/setupwizard?step=3&completed=true");
                }}
                disabled="true"
                style={{ visibility: "hidden", opacity: 0 }}
                className="btn btnPrimary disabled"
              >
                Back
              </button>
              <button className="btn btnPrimary" type="submit">
                Save & Next
              </button>
            </div>
          </div>

          {modalsForm1.showModalPartner && (
            <ModalInputCenter
              heading="Add Partner"
              handleClick={() => {
                const newPartner = {
                  type: modalsForm1.partnerTypeInputVal,
                  name: modalsForm1.partnerInputVal,
                };
                setForm1Data({
                  ...form1Data,
                  partnerAccount: [...form1Data.partnerAccount, newPartner],
                });
                setModalsForm1({
                  ...modalsForm1,
                  partnerInputVal: "",
                  partnerTypeInputVal: "",
                  showModalPartner: false,
                });
              }}
              changeShow={() =>
                setModalsForm1({ ...modalsForm1, showModalPartner: false })
              }
              show={modalsForm1.showModalPartner}
              action="Add Partner"
            >
              <InputCustom
                type="text"
                label="Name of Partner"
                handleChange={(e) => {
                  setModalsForm1({
                    ...modalsForm1,
                    partnerInputVal: e.target.value,
                  });
                }}
              ></InputCustom>
              <InputCustom
                type="text"
                label="Type of Partner"
                handleChange={(e) => {
                  setModalsForm1({
                    ...modalsForm1,
                    partnerTypeInputVal: e.target.value,
                  });
                }}
              ></InputCustom>
            </ModalInputCenter>
          )}

          {modalsForm1.showModalGST && (
            <ModalInputCenter
              heading="Add GST/HST number"
              handleClick={() => {
                if (!form1Data.GSTNumber) {
                  setForm1Data({
                    ...form1Data,
                    GSTNumber: modalsForm1.gstInputVal,
                  });
                } else {
                  setForm1Data({
                    ...form1Data,
                    otherGSTNumbers: [
                      ...form1Data.otherGSTNumbers,
                      modalsForm1.gstInputVal,
                    ],
                  });
                }
                setModalsForm1({
                  ...modalsForm1,
                  gstInputVal: "",
                  showModalGST: false,
                });
              }}
              changeShow={() =>
                setModalsForm1({ ...modalsForm1, showModalGST: false })
              }
              show={modalsForm1.showModalGST}
              action="Add GST/HST number"
            >
              <DoubleInput
                fixedVal={form1Data.BusinessNumber || "Business Number"}
                val={modalsForm1.gstInputVal}
                handleChange={(event) => {
                  setModalsForm1({ ...modalsForm1, gstInputVal: event || " " });
                }}
                name="GSTNumber"
                labelValue={`GST/HST number`}
                showCross={true}
                deleteElement={(e) => {
                  setModalsForm1({ ...modalsForm1, gstInputVal: " " });
                }}
              />
            </ModalInputCenter>
          )}
          {modalsForm1.showModalPayroll && (
            <ModalInputCenter
              heading="Add payroll number"
              handleClick={() => {
                if (!form1Data.PayrollNumber) {
                  setForm1Data({
                    ...form1Data,
                    PayrollNumber: modalsForm1.payrollInputVal,
                  });
                } else {
                  setForm1Data({
                    ...form1Data,
                    otherPayrollNumber: [
                      ...form1Data.otherPayrollNumber,
                      modalsForm1.payrollInputVal,
                    ],
                  });
                }
                setModalsForm1({
                  ...modalsForm1,
                  payrollInputVal: "",
                  showModalPayroll: false,
                });
              }}
              changeShow={() =>
                setModalsForm1({ ...modalsForm1, showModalPayroll: false })
              }
              show={modalsForm1.showModalPayroll}
              action="Add payroll number"
            >
              <DoubleInput
                fixedVal={form1Data.BusinessNumber || "Business Number"}
                val={modalsForm1.payrollInputVal}
                handleChange={(event) => {
                  setModalsForm1({
                    ...modalsForm1,
                    payrollInputVal: event || " ",
                  });
                }}
                name="PayrollNumber"
                labelValue={`Payroll number`}
                showCross={true}
                deleteElement={(e) => {
                  setModalsForm1({ ...modalsForm1, payrollInputVal: " " });
                }}
              />
            </ModalInputCenter>
          )}
          {modalsForm1.showModalPartnershipNumber && (
            <ModalInputCenter
              heading="Add payroll number"
              handleClick={() => {
                if (!form1Data.partnershipNumber) {
                  setForm1Data({
                    ...form1Data,
                    partnershipNumber: modalsForm1.partnershipNumber,
                  });
                } else {
                  setForm1Data({
                    ...form1Data,
                    otherPartnershipNumber: [
                      ...form1Data.otherPartnershipNumber,
                      modalsForm1.partnershipNumber,
                    ],
                  });
                }
                setModalsForm1({
                  ...modalsForm1,
                  partnershipNumber: "",
                  showModalPartnershipNumber: false,
                });
              }}
              changeShow={() =>
                setModalsForm1({
                  ...modalsForm1,
                  showModalPartnershipNumber: false,
                })
              }
              show={modalsForm1.showModalPartnershipNumber}
              action="Add Partnership Number"
            >
              <DoubleInput
                fixedVal={form1Data.BusinessNumber || "Business Number"}
                val={modalsForm1.partnershipNumber}
                handleChange={(event) => {
                  setModalsForm1({
                    ...modalsForm1,
                    partnershipNumber: event || " ",
                  });
                }}
                name="PartnershipNumber"
                labelValue={`Partnership Number`}
                showCross={true}
                deleteElement={(e) => {
                  setModalsForm1({ ...modalsForm1, partnershipNumber: " " });
                }}
              />
            </ModalInputCenter>
          )}
          {modalsForm1.showModalCorporateTaxNumber && (
            <ModalInputCenter
              heading="Add Corporate Tax Number"
              handleClick={() => {
                if (!form1Data.CorporateTaxNumber) {
                  setForm1Data({
                    ...form1Data,
                    CorporateTaxNumber: modalsForm1.corporateTaxNumberInputVal,
                  });
                } else {
                  setForm1Data({
                    ...form1Data,
                    otherCorporateTaxNumber: [
                      ...form1Data.otherCorporateTaxNumber,
                      modalsForm1.corporateTaxNumberInputVal,
                    ],
                  });
                }
                setModalsForm1({
                  ...modalsForm1,
                  corporateTaxNumberInputVal: "",
                  showModalCorporateTaxNumber: false,
                });
              }}
              changeShow={() =>
                setModalsForm1({
                  ...modalsForm1,
                  showModalCorporateTaxNumber: false,
                })
              }
              show={modalsForm1.showModalCorporateTaxNumber}
              action="Add Corporate Tax Number"
            >
              <DoubleInput
                fixedVal={form1Data.BusinessNumber || "Business Number"}
                val={modalsForm1.corporateTaxNumberInputVal}
                handleChange={(event) => {
                  setModalsForm1({
                    ...modalsForm1,
                    corporateTaxNumberInputVal: event || " ",
                  });
                }}
                name="CorporateTaxNumber"
                labelValue={`Corporate Tax Number`}
                showCross={true}
                deleteElement={(e) => {
                  setModalsForm1({
                    ...modalsForm1,
                    corporateTaxNumberInputVal: " ",
                  });
                }}
              />
            </ModalInputCenter>
          )}
        </form>
      </>
    );
  };

  const form2 = () => {
    return (
      <>
        <OnboardingSteps
          list={stepsInfo}
          activeStep={activeStep}
          setActiveStepFunc={(e) => {
            setActiveStep(e);
            setCompletedSteps(e - 1);
          }}
          completedSteps={completedSteps}
          activeHeight={activeHeight}
        ></OnboardingSteps>
        <form ref={ref2} onSubmit={handleSubmitForm2} className="setUpAccount">
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label>Currency</label>
                <div className="d-flex flex-wrap">
                  <div className="checkboxGroup">
                    <label>
                      <input
                        required
                        name="currency"
                        type="radio"
                        checked={form2Data["currency"] === "Canadian Dollar"}
                        value="Canadian Dollar"
                        onChange={(e) => {
                          setForm2Data({
                            ...form2Data,
                            currency: "Canadian Dollar",
                          });
                        }}
                      ></input>{" "}
                      Canadian Dollar
                    </label>
                  </div>
                  <div className="checkboxGroup">
                    <label>
                      <input
                        required
                        name="currency"
                        type="radio"
                        checked={form2Data["currency"] === "USA Dollar"}
                        value="USA Dollar"
                        onChange={(e) => {
                          setForm2Data({
                            ...form2Data,
                            currency: "USA Dollar",
                          });
                        }}
                      ></input>{" "}
                      USA Dollar
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>HST/GST filing frequency</label>
                <div className="d-flex flex-wrap">
                  {["Monthly", "Quarterly", "Yearly"].map((e, index) => {
                    return (
                      <div key={index} className={`checkboxGroup`}>
                        <label>
                          <input
                            required
                            name="HST"
                            type="radio"
                            checked={form2Data["HST"] === e}
                            value={e}
                            onChange={(e) => {
                              setForm2Data({
                                ...form2Data,
                                [e.target.name]: e.target.value,
                              });
                            }}
                          ></input>{" "}
                          {e}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {showPSTColumns() && (
              <div className="col-md-6">
                <div className="form-group">
                  <label>Filing frequency for PST</label>
                  <div className="d-flex flex-wrap">
                    {["Monthly", "quarterly", "Semi-annual", "Yearly"].map(
                      (e, index) => {
                        return (
                          <div key={index} className={`checkboxGroup`}>
                            <label>
                              <input
                                required
                                name="PST"
                                type="radio"
                                checked={form2Data["PST"] === e}
                                value={e}
                                onChange={(e) => {
                                  setForm2Data({
                                    ...form2Data,
                                    [e.target.name]: e.target.value,
                                  });
                                }}
                              ></input>{" "}
                              {e}
                            </label>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="col-md-6">
              <div className="form-group">
                <label>Financial year end</label>
                <input
                  className="form-control"
                  required
                  type="text"
                  disabled="true"
                  value={
                    loaded &&
                    companyInfo &&
                    momentFunction.getPreviousMonthFromString(
                      companyInfo.fiscalstartmonth
                    )
                  }
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Annual tax filing date</label>
                <input
                  className="form-control"
                  required
                  type="text"
                  disabled="true"
                  value={
                    loaded &&
                    companyInfo &&
                    (form1Data.typeFirm === "Sole proprietor" &&
                    form1Data.selfEmployed === "No"
                      ? "30-Jun"
                      : form1Data.selfEmployed === "Yes"
                      ? "15-Jun"
                      : momentFunction.add6Months(companyInfo.fiscalstartmonth))
                  }
                />
              </div>
            </div>
          </div>
          <div className="btnGroup mt-0 mb-4">
            <button
              onClick={() => {
                setActiveStep(1);
              }}
              className="btn btnPrimary"
            >
              Back
            </button>
            <button className="btn btnPrimary" type="submit">
              Save & Next
            </button>
          </div>
        </form>
      </>
    );
  };

  const addUserToListForm3 = () => {
    setForm3Data({
      ...form3Data,
      addUserModalShow: true,
      modalUserEmail: "",
      modalUserRole: "",
      modalUserName: "",
    });
  };

  const form3 = () => {
    return (
      <>
        <OnboardingSteps
          list={stepsInfo}
          activeHeight={activeHeight}
          setActiveStepFunc={(e) => {
            setActiveStep(e);
            setCompletedSteps(e - 1);
          }}
          activeStep={activeStep}
          completedSteps={completedSteps}
        ></OnboardingSteps>

        <form className="setUpAccount" onSubmit={handleSubmitForm3} ref={ref3}>
          {form3Data.form3DataUsers !== null &&
            form3Data.form3DataUsers.length >= 1 && (
              <div className="tableOuter m-0">
                <table className="table customGrid">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form3Data.form3DataUsers.map((e, index) => {
                      return (
                        <tr>
                          <td>{e.username}</td>
                          <td>{e.email}</td>
                          <td>{e.role}</td>
                          <td className="actions">
                            <button
                              onClick={() => {
                                console.log("index", index);
                                console.log(
                                  "index",
                                  form3Data.form3DataUsers[index]
                                );
                                const { username, email, role, uid } =
                                  form3Data.form3DataUsers[index];
                                form3Data.modalUserEmail = email;
                                form3Data.modalUserName = username;
                                form3Data.modalUserRole = role;
                                form3Data.uidToChange = uid;
                                setForm3Data({
                                  ...form3Data,
                                  addUserModalShow: false,
                                  editUserShowModal: true,
                                  indexToChange: index,
                                });
                              }}
                              className="blueColor"
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button
                              onClick={() => {
                                console.log("index", index);
                                axios
                                  .delete(`/delete/${e.role}/${e.uid}/${e.sid}`)
                                  .then((res) => {
                                    console.log("res", res);
                                    setForm3Data({
                                      ...form3Data,
                                      reloadAgain: form3Data.reloadAgain + 1,
                                    });
                                  })
                                  .catch((err) => {
                                    console.log("err", err);
                                  });
                              }}
                              className="redColor"
                            >
                              <i className="fa-solid fa-trash-can"></i> Delete{" "}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          {form3Data.editUserShowModal && (
            <Modal
              className="customModal"
              show={form3Data.editUserShowModal}
              onHide={() =>
                setForm3Data({ ...form3Data, editUserShowModal: false })
              }
              size="md"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                  Edit User
                </Modal.Title>
              </Modal.Header>
              <div>
                <Modal.Body>
                  <div className="form-group mb-0">
                    <label>Role</label>
                    <Dropdown
                      options={roleDropdownList}
                      value={form3Data.modalUserRole || roleDropdownList[0]}
                      onChange={(e) => {
                        setForm3Data({ ...form3Data, modalUserRole: e.value });
                      }}
                      ref={(e) => (roleDropdownRef = e.value)}
                    ></Dropdown>
                  </div>
                </Modal.Body>
                <Modal.Footer className="btnGroup">
                  <button
                    className="btn btnPrimary"
                    onClick={() => {
                      console.log("ref", roleDropdownRef.state);
                      form3Data.modalUserEmailError = "";
                      form3Data.modalUserNameError = "";

                      if (form3Data.modalUserEmail === "") {
                        form3Data.modalUserEmailError = "Enter User Email";
                      }
                      if (form3Data.modalUserName === "") {
                        form3Data.modalUserNameError = "Enter User Name";
                      }

                      setForm3Data({
                        ...form3Data,
                      });

                      if (form3Data.modalUserEmail && form3Data.modalUserName) {
                        form3Data.modalUserEmailError = "";
                        form3Data.modalUserNameError = "";
                        const obj = {
                          email: form3Data.modalUserEmail,
                          role:
                            form3Data.modalUserRole ||
                            roleDropdownRef.state.selected,
                          name: form3Data.modalUserName,
                        };

                        console.log("obj", obj);

                        form3Data.form3DataUsers[form3Data.indexToChange].name =
                          form3Data.modalUserName;
                        form3Data.form3DataUsers[
                          form3Data.indexToChange
                        ].email = form3Data.modalUserEmail;
                        form3Data.form3DataUsers[form3Data.indexToChange].role =
                          form3Data.modalUserRole;

                        setForm3Data({ ...form3Data });

                        axios
                          .put(
                            "/edit/role",
                            JSON.stringify({
                              role: form3Data.modalUserRole.toUpperCase(),
                              uid: form3Data.uidToChange,
                            })
                          )
                          .then((res) => {
                            console.log("res", res);

                            setForm3Data({
                              ...form3Data,
                              editUserShowModal: false,
                              reloadAgain: form3Data.reloadAgain + 1,
                              form3DataUsers: [...form3Data.form3DataUsers],
                            });
                          })
                          .catch((err) => {
                            console.log("err", err);
                            form3Data.modalUserEmailError =
                              "Please Enter Valid Email";
                            form3Data.userAddedAsSomething = err.body;
                            setForm3Data({ ...form3Data });
                          });
                      }
                    }}
                  >
                    Edit User
                  </button>
                </Modal.Footer>
              </div>
            </Modal>
          )}
          <span className="text mt-2">
            <a onClick={() => addUserToListForm3()}>+ Add Users</a>
          </span>
          {form3Data.addUserModalShow && (
            <Modal
              className="customModal"
              show={form3Data.addUserModalShow}
              onHide={() =>
                setForm3Data({ ...form3Data, addUserModalShow: false })
              }
              size="md"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                  Add User
                </Modal.Title>
              </Modal.Header>
              <div>
                <Modal.Body>
                  <div className="form-group">
                    <label>User Name</label>
                    <input
                      type="text"
                      className={`form-control ${
                        form3Data.modalUserNameError && "border_red"
                      }`}
                      value={form3Data.modalUserName}
                      onChange={onChangeInput3}
                      required
                      name="modalUserName"
                    />
                  </div>
                  {form3Data.modalUserNameError && (
                    <span className="text-error text">
                      {form3Data.modalUserNameError}
                    </span>
                  )}
                  <div className="form-group">
                    <label>Role</label>
                    <Dropdown
                      options={roleDropdownList}
                      value={form3Data.modalUserRole || roleDropdownList[0]}
                      onChange={(e) => {
                        setForm3Data({ ...form3Data, modalUserRole: e.value });
                      }}
                      ref={(e) => (roleDropdownRef = e)}
                    ></Dropdown>
                  </div>
                  <div className="form-group mb-0">
                    <label>User Email</label>
                    <input
                      type="email"
                      required
                      className={`form-control ${
                        form3Data.modalUserEmailError && "border_red"
                      }`}
                      value={form3Data.modalUserEmail}
                      onChange={onChangeInput3}
                      name="modalUserEmail"
                    />
                  </div>
                  {form3Data.modalUserEmailError && (
                    <span className="text-error text">
                      {form3Data.modalUserEmailError}
                    </span>
                  )}
                </Modal.Body>
                <Modal.Footer className="btnGroup">
                  <button
                    className="btn btnPrimary"
                    onClick={() => {
                      console.log("ref", roleDropdownRef.state);
                      form3Data.modalUserEmailError = "";
                      form3Data.modalUserNameError = "";

                      if (form3Data.modalUserEmail === "") {
                        form3Data.modalUserEmailError = "Enter User Email";
                      }
                      if (form3Data.modalUserName === "") {
                        form3Data.modalUserNameError = "Enter User Name";
                      }

                      setForm3Data({
                        ...form3Data,
                      });

                      if (form3Data.modalUserEmail && form3Data.modalUserName) {
                        form3Data.modalUserEmailError = "";
                        form3Data.modalUserNameError = "";
                        const obj = {
                          email: form3Data.modalUserEmail,
                          role:
                            form3Data.modalUserRole ||
                            roleDropdownRef.state.selected.value,
                          name: form3Data.modalUserName,
                        };

                        console.log("obj", obj);

                        axios
                          .post("/add/client", {
                            email: form3Data.modalUserEmail.trim(),
                            role: (
                              form3Data.modalUserRole ||
                              roleDropdownRef.state.selected.value
                            ).toUpperCase(),
                            sid: getUserSID(),
                            uid: getUserId(),
                            user_name: form3Data.modalUserName.trim(),
                          })
                          .then((res) => {
                            console.log("res", res);

                            form3Data.showLinkConfirmationSend = true;
                            form3Data.userAddedAsSomething =
                              res.data.data.body || res.data.data.message;

                            let allUsers = [];
                            allUsers.push(obj);
                            setForm3Data({
                              ...form3Data,
                              newHeight: 4 + form3Data.newHeight,
                              form3DataUsers: [
                                ...form3Data.form3DataUsers,
                                ...allUsers,
                              ],
                              addUserModalShow: false,
                            });

                            if (
                              res.data.data.message ===
                              "Client creation link forward to his / her email successfully."
                            ) {
                              setSnackbarState((prev) => ({
                                ...prev,
                                open: true,
                                msg:
                                  res.data.data.body || res.data.data.message,
                              }));
                            } else {
                              alert(
                                res.data.data.body || res.data.data.message
                              );
                              window.location.reload();
                            }
                          })
                          .catch((err) => {
                            console.log("err", err);
                            form3Data.modalUserEmailError =
                              "Please Enter Valid Email";
                            form3Data.userAddedAsSomething = err.body;
                            setForm3Data({ ...form3Data });
                          });
                      }
                    }}
                  >
                    Add User
                  </button>
                </Modal.Footer>
              </div>
            </Modal>
          )}
          {form3Data.showLinkConfirmationSend && (
            <Modal
              className="customModal"
              onHide={() => {
                form3Data.showLinkConfirmationSend = false;
                form3Data.reloadAgain = form3Data.reloadAgain + 1;
                setForm3Data({ ...form3Data });
              }}
              show={form3Data.showLinkConfirmationSend}
              size="md"
              aria-labelledby="contained-modal-title-vcenter"
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                  User Added
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <span className="text">{form3Data.userAddedAsSomething}</span>
              </Modal.Body>
              <Modal.Footer className="btnGroup">
                <Button
                  className="btn btnPrimary"
                  onClick={() => {
                    form3Data.showLinkConfirmationSend = false;
                    form3Data.reloadAgain = form3Data.reloadAgain + 1;
                    setForm3Data({ ...form3Data });
                  }}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          )}
          <div className="btnGroup mt-3 mb-5">
            <button
              onClick={() => {
                setActiveStep(2);
              }}
              className="btn btnPrimary"
            >
              Back
            </button>
            <button className="btn btnPrimary" type="submit">
              Save
            </button>
          </div>
        </form>
      </>
    );
  };

  const form4 = () => {
    return (
      <>
        <OnboardingSteps
          list={stepsInfo}
          activeStep={activeStep}
          completedSteps={completedSteps}
          setActiveStepFunc={(e) => setActiveStep(e)}
          activeHeight={activeHeight}
        ></OnboardingSteps>
        <form onSubmit={handleSubmitForm4} className="setUpAccount" ref={ref4}>
          <div className="tableOuter m-0">
            <table className="table customGrid">
              <thead>
                <tr>
                  <th>Account type</th>
                  <th>Account name</th>
                </tr>
              </thead>
              <tbody>
                {form4Data.trust_bank_accounts.map((e) => {
                  if (e.name)
                    return (
                      <tr>
                        <td>Trust Bank</td>
                        <td>{e.name}</td>
                      </tr>
                    );
                })}

                {form4Data.general_bank_accounts.map((e) => {
                  if (e.name)
                    return (
                      <tr>
                        <td>General Bank</td>
                        <td>{e.name}</td>
                      </tr>
                    );
                })}

                {form4Data.credit_card_accounts.map((e) => {
                  return e.name ? (
                    <tr>
                      <td>Credit Card</td>
                      <td>{e.name}</td>
                    </tr>
                  ) : null;
                })}

                {form4Data.trust_bank_accounts.length === 0 && (
                  <tr>
                    <td>No Bank Account Yet</td>
                    <td>No Bank Yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="btnGroup mt-3 mb-5">
            <button
              className="btn btnPrimary"
              onClick={() => {
                setActiveStep(3);
              }}
            >
              Back
            </button>
            <button className="btn btnPrimary" type="submit">
              Save & Next
            </button>
          </div>
        </form>
      </>
    );
  };

  const form5 = () => {
    return (
      <>
        <OnboardingSteps
          list={stepsInfo}
          activeStep={activeStep}
          setActiveStepFunc={(e) => setActiveStep(e)}
          completedSteps={completedSteps}
          activeHeight={activeHeight}
        ></OnboardingSteps>
        <form ref={ref5} onSubmit={handleSubmitForm5} className="setUpAccount">
          <div className="form-group">
            <label>What is your billing arrangement?</label>
            <div className="d-flex flex-wrap">
              {form5Data.billingArrangement.map((e, index) => {
                return e.name !== "Specify" ? (
                  <div key={e.id} className="checkboxGroup">
                    <label>
                      <input
                        required
                        type="radio"
                        name="billing_arrangement"
                        checked={form5Data["billing_arrangement"] === e.name}
                        value={e.name}
                        onChange={(e) => {
                          if (e.target.value === "Other") {
                            form5Data.billingArrangement.push({
                              name: "Specify",
                              id: 7,
                            });
                            setForm5Data({ ...form5Data });
                          } else {
                            if (
                              form5Data.billingArrangement[
                                form5Data.billingArrangement.length - 1
                              ].name === "Specify"
                            ) {
                              form5Data.billingArrangement.pop();
                              setForm5Data({ ...form5Data });
                            }
                          }
                          setForm5Data({
                            ...form5Data,
                            [e.target.name]: e.target.value,
                          });
                        }}
                      />{" "}
                      {e.name}
                    </label>
                  </div>
                ) : (
                  <div className="col-md-12">
                    <div className="form-group mt-2">
                      <label>Other - please specify</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        onChange={(elem) => {
                          form5Data.billingArrangement[e.id - 1].value =
                            elem.target.value;
                          setForm5Data({ ...form5Data });
                        }}
                        name="specify"
                        value={form5Data.billingArrangement[e.id - 1].value}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label>What is your billing frequency?</label>
            <div className="d-flex flex-wrap">
              {form5Data.billingFrequency.map((e, index) => {
                return e.name !== "Specify" ? (
                  <div key={e.id} className="checkboxGroup">
                    <label>
                      <input
                        required
                        type="radio"
                        name="billing_frequency"
                        checked={form5Data["billing_frequency"] === e.name}
                        value={e.name}
                        onChange={(e) => {
                          if (e.target.value === "Other") {
                            form5Data.billingFrequency.push({
                              name: "Specify",
                              id: 8,
                            });
                            form5Data.newHeight += 20;
                            setForm5Data({
                              newHeight: form5Data.newHeight,
                              ...form5Data,
                            });
                          } else {
                            if (
                              form5Data.billingFrequency[
                                form5Data.billingFrequency.length - 1
                              ].name === "Specify"
                            ) {
                              form5Data.billingFrequency.pop();
                              form5Data.newHeight = form5Data.newHeight - 20;
                              setForm5Data({
                                ...form5Data,
                                newHeight: form5Data.newHeight,
                              });
                            }
                          }
                          setForm5Data({
                            ...form5Data,
                            [e.target.name]: e.target.value,
                          });
                        }}
                      />{" "}
                      {e.name}
                    </label>
                  </div>
                ) : (
                  <div className="col-md-12 mt-2">
                    <div className="form-group">
                      <label>Other - please specify</label>
                      <input
                        className="form-control"
                        type="text"
                        required
                        onChange={(elem) => {
                          form5Data.billingFrequency[e.id - 1].value =
                            elem.target.value;
                          setForm5Data({ ...form5Data });
                        }}
                        name="specify"
                        value={form5Data.billingFrequency[e.id - 1].value}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label>What is the frequency for disbursement recovery?</label>
            <div className="d-flex flex-wrap">
              {form5Data.disbursementFrequency.map((e, index) => {
                return e.name !== "Specify" ? (
                  <div key={index} className="checkboxGroup">
                    <label>
                      <input
                        required
                        type="radio"
                        name="disbursement_frequency"
                        checked={form5Data["disbursement_frequency"] === e.name}
                        value={e.name}
                        onChange={(e) => {
                          if (e.target.value === "Other") {
                            form5Data.disbursementFrequency.push({
                              name: "Specify",
                              id: 8,
                            });
                            form5Data.newHeight += 20;
                            setForm5Data({
                              newHeight: form5Data.newHeight,
                              ...form5Data,
                            });
                          } else {
                            if (
                              form5Data.disbursementFrequency[
                                form5Data.disbursementFrequency.length - 1
                              ].name === "Specify"
                            ) {
                              form5Data.disbursementFrequency.pop();
                              form5Data.newHeight = form5Data.newHeight - 20;
                              setForm5Data({
                                ...form5Data,
                                newHeight: form5Data.newHeight,
                              });
                            }
                          }
                          setForm5Data({
                            ...form5Data,
                            [e.target.name]: e.target.value,
                          });
                        }}
                      />{" "}
                      {e.name}
                    </label>
                  </div>
                ) : (
                  <div className="col-md-12 mt-2">
                    <div className="form-group">
                      <label>Other - please specify</label>
                      <input
                        className="form-control"
                        type="text"
                        required
                        onChange={(elem) => {
                          form5Data.disbursementFrequency[e.id - 1].value =
                            elem.target.value;
                          setForm5Data({ ...form5Data });
                        }}
                        name="specify"
                        value={form5Data.disbursementFrequency[e.id - 1].value}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label>
              Do you use any of the following applications for revenue
              collection?
            </label>
            <div className="d-flex flex-wrap">
              {form5Data.revenueCollection.map((e, index) => {
                return e.name !== "Specify" ? (
                  <div key={index} className="checkboxGroup">
                    <label>
                      <input
                        required
                        type="radio"
                        name="revenue_collection"
                        checked={form5Data["revenue_collection"] === e.name}
                        value={e.name}
                        onChange={(e) => {
                          if (e.target.value === "Other") {
                            form5Data.revenueCollection.push({
                              id: 5,
                              name: "Specify",
                            });
                            form5Data.newHeight += 20;
                            setForm5Data({
                              newHeight: form5Data.newHeight,
                              ...form5Data,
                            });
                          } else {
                            if (
                              form5Data.revenueCollection[
                                form5Data.revenueCollection.length - 1
                              ].name === "Specify"
                            ) {
                              form5Data.revenueCollection.pop();
                              form5Data.newHeight = form5Data.newHeight - 20;
                              setForm5Data({
                                ...form5Data,
                                newHeight: form5Data.newHeight,
                              });
                            }
                          }
                          setForm5Data({
                            ...form5Data,
                            [e.target.name]: e.target.value,
                          });
                        }}
                      />{" "}
                      {e.name}
                    </label>
                  </div>
                ) : (
                  <div className="col-md-12 mt-2">
                    <div className="form-group">
                      <label>Other - please specify</label>
                      <input
                        className="form-control"
                        type="text"
                        required
                        onChange={(elem) => {
                          form5Data.revenueCollection[e.id - 1].value =
                            elem.target.value;
                          setForm5Data({ ...form5Data });
                        }}
                        value={form5Data.revenueCollection[e.id - 1].value}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label>
              Do you use any of the following applications for vendor payments?
            </label>
            <div className="d-flex flex-wrap">
              {form5Data.vendorPayments.map((e) => {
                return e.name !== "Specify" ? (
                  <div key={e.id} className="checkboxGroup">
                    <label>
                      <input
                        required
                        type="radio"
                        name="vendor_payment"
                        checked={form5Data["vendor_payment"] === e.name}
                        value={e.name}
                        onChange={(e) => {
                          if (e.target.value === "Other") {
                            form5Data.vendorPayments.push({
                              id: 5,
                              name: "Specify",
                            });
                            form5Data.newHeight += 20;
                            setForm5Data({
                              newHeight: form5Data.newHeight,
                              ...form5Data,
                            });
                          } else {
                            if (
                              form5Data.vendorPayments[
                                form5Data.vendorPayments.length - 1
                              ].name === "Specify"
                            ) {
                              form5Data.vendorPayments.pop();
                              setForm5Data({ ...form5Data });
                            }
                          }
                          setForm5Data({
                            ...form5Data,
                            [e.target.name]: e.target.value,
                          });
                        }}
                      />
                      {e.name}
                    </label>
                  </div>
                ) : (
                  <div className="col-md-12 mt-2">
                    <div className="form-group">
                      <label>Other - please specify</label>
                      <input
                        className="form-control"
                        type="text"
                        required
                        onChange={(elem) => {
                          form5Data.vendorPayments[e.id - 1].value =
                            elem.target.value;
                          setForm5Data({ ...form5Data });
                        }}
                        value={form5Data.vendorPayments[e.id - 1].value}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="btnGroup mt-3 mb-5">
            <button
              onClick={() => {
                setActiveStep(4);
              }}
              className="btn btnPrimary"
            >
              Back
            </button>
            <button className="btn btnPrimary" type="submit">
              Save & Next
            </button>
          </div>
        </form>
      </>
    );
  };
  const form6 = () => {
    return (
      <>
        <OnboardingSteps
          list={stepsInfo}
          activeStep={activeStep}
          completedSteps={completedSteps}
          activeHeight={activeHeight}
          setActiveStepFunc={(e) => setActiveStep(e)}
        ></OnboardingSteps>
        <form ref={ref6} onSubmit={handleSubmitForm6} className="setUpAccount">
          <div className="col-md-4">
            <div className="form-group">
              <label
                className={`${
                  form6Data.numberOfEmployeesOnPayroll < 0 && "text-error"
                }`}
              >
                Number of Employees on Payroll
              </label>
              <input
                required
                type="number"
                className={`form-control ${
                  form6Data.numberOfEmployeesOnPayroll >= 0 ? "" : "border_red"
                }`}
                min="0"
                value={form6Data.numberOfEmployeesOnPayroll}
                onChange={onChangeInput6}
                name="numberOfEmployeesOnPayroll"
              />
              {form6Data.numberOfEmployeesOnPayroll < 0 && (
                <span className="text text-error">
                  Please enter positive values
                </span>
              )}
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label>What is your payroll frequency?</label>
                <div className="d-flex flex-wrap">
                  {form6Data.payrollFrequency.map((e, index) => {
                    return e.name !== "Specify" ? (
                      <div key={e.id} className="checkboxGroup">
                        <label>
                          <input
                            required
                            type="radio"
                            name="payroll_frequen"
                            checked={form6Data["payroll_frequen"] === e.name}
                            value={e.name}
                            onChange={(e) => {
                              if (e.target.value === "Other") {
                                form6Data.payrollFrequency.push({
                                  id: 5,
                                  name: "Specify",
                                });
                                setForm6Data({
                                  ...form6Data,
                                  payrollFrequency: form6Data.payrollFrequency,
                                });
                              } else {
                                if (
                                  form6Data.payrollFrequency[
                                    form6Data.payrollFrequency.length - 1
                                  ].name === "Specify"
                                ) {
                                  form6Data.payrollFrequency.pop();
                                  setForm6Data({ ...form6Data });
                                }
                              }
                              setForm6Data({
                                ...form6Data,
                                [e.target.name]: e.target.value,
                              });
                            }}
                          />{" "}
                          {e.name}
                        </label>
                      </div>
                    ) : (
                      <div className="col-md-12 mt-2">
                        <div className="form-group">
                          <label>Other - please specify</label>
                          <input
                            className="form-control"
                            type="text"
                            onChange={(elem) => {
                              form6Data.payrollFrequency[e.id - 1].value =
                                elem.target.value;
                              setForm6Data({ ...form6Data });
                            }}
                            required
                            value={form6Data.payrollFrequency[e.id - 1].value}
                            id=""
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>
                  Is a third-party provider engaged in your payroll related
                  work?
                </label>
                <div className="d-flex flex-wrap">
                  {["Yes", "No"].map((e, index) => {
                    return (
                      <div key={index} className="checkboxGroup">
                        <label>
                          <input
                            required
                            type="radio"
                            name="third_party"
                            checked={form6Data["third_party"] === e}
                            value={e}
                            onChange={(e) => {
                              setForm6Data({
                                ...form6Data,
                                [e.target.name]: e.target.value,
                              });
                            }}
                          />{" "}
                          {e}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
              {form6Data.third_party === "Yes" && (
                <div className="form-group">
                  <label>Other - Name of provider</label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    name="third_party_other"
                    value={form6Data.third_party_other}
                    onChange={(e) => {
                      setForm6Data({
                        ...form6Data,
                        [e.target.name]: e.target.value,
                      });
                    }}
                  />
                </div>
              )}
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>How are payroll payments made?</label>
                <div className="d-flex flex-wrap">
                  {["Direct Debit", "Cheques "].map((e, index) => {
                    return (
                      <div key={index} className="checkboxGroup">
                        <label>
                          <input
                            required
                            type="radio"
                            name="direct_payment"
                            checked={form6Data["direct_payment"] === e}
                            value={e}
                            onChange={(e) => {
                              setForm6Data({
                                ...form6Data,
                                [e.target.name]: e.target.value,
                              });
                            }}
                          />{" "}
                          {e}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Do you pay work insurance for your employees?</label>
                <div className="d-flex flex-wrap">
                  {["Yes", "No"].map((e, index) => {
                    return (
                      <div key={index} className="checkboxGroup">
                        <label>
                          <input
                            required
                            type="radio"
                            name="billing_frequency"
                            checked={form6Data["billing_frequency"] === e}
                            value={e}
                            onChange={(e) => {
                              setForm6Data({
                                ...form6Data,
                                [e.target.name]: e.target.value,
                              });
                            }}
                          />{" "}
                          {e}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
              {form6Data.billing_frequency === "Yes" && (
                <div className="form-group">
                  <label>Other - Confirm Frequency</label>
                  <input
                    className="form-group"
                    type="text"
                    required
                    value={form6Data.billing_frequency_other}
                    onChange={(e) => {
                      setForm6Data({
                        ...form6Data,
                        [e.target.name]: e.target.value,
                      });
                    }}
                    name="billing_frequency_other"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="btnGroup mt-0 mb-5">
            <button
              onClick={() => {
                setActiveStep(5);
              }}
              className="btn btnPrimary"
            >
              Back
            </button>
            <button className="btn btnPrimary" type="submit">
              Save
            </button>
          </div>
        </form>
      </>
    );
  };

  const form7 = () => {
    return (
      <div ref={ref7}>
        <OnboardingSteps
          list={stepsInfo}
          activeStep={activeStep}
          completedSteps={completedSteps}
          activeHeight={activeHeight}
          setActiveStepFunc={(e) => setActiveStep(e)}
        ></OnboardingSteps>
        <form
          encType="multipart/form-data"
          onSubmit={handleSubmitForm7}
          ref={(divElem) => {
            fileUploadForm = divElem;
          }}
        >
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label>How long have you been using Clio?</label>
                <input
                  className="form-control"
                  required
                  type="date"
                  name="month_clio"
                  id=""
                  value={form7Data.month_clio}
                  onChange={onChangeInput7}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>How long have you been using Quickbooks?</label>
                <input
                  className="form-control"
                  required
                  type="date"
                  name="month_QBO"
                  id=""
                  value={form7Data.month_QBO}
                  onChange={onChangeInput7}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>How are your back-ups being maintained?</label>
                <input
                  className="form-control"
                  required
                  type="text"
                  placeholder="eg: local drive, sharepoint"
                  value={form7Data.localDriveSharePoint}
                  name="localDriveSharePoint"
                  onChange={onChangeInput7}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group uploadView">
                <label>
                  Please upload your company logo. Photo size should be less
                  than 500KB
                </label>
                {!userRole.company_profile_pic && (
                  <span>
                    <input
                      type="file"
                      name="photo"
                      onChange={(event) => {
                        if (event.target.files && event.target.files[0]) {
                          form7Data.photo = URL.createObjectURL(
                            event.target.files[0]
                          );
                        }
                        const formData = new FormData();
                        formData.append(
                          "file",
                          event.target.files[0],
                          event.target.files[0].name
                        );
                        console.log("file name", event.target.files[0]);
                        console.log("form data", formData);
                        axios
                          .post(`/file/upload/${getUserId()}`, formData)
                          .then((res) => {
                            const { data } = res;
                            console.log("data file", data);
                            dispatch(
                              userChangeAction({
                                ...userRole,
                                company_profile_pic: data.data.body.file,
                              })
                            );
                            setForm7Data({
                              ...form7Data,
                              photo: data.data.body.file,
                            });
                            updateInfoInCurrentUser({
                              company_profile_pic: data.data.body.file,
                            });
                          })
                          .catch((err) => {
                            console.log("err", err);
                            alert(
                              "Photo size should not be greater than 500KB"
                            );
                          });
                      }}
                    />
                    <i className="fas fa-plus"></i>
                  </span>
                )}
                {userRole.company_profile_pic && (
                  <span>
                    <img
                      src={userRole.company_profile_pic}
                      alt={userRole.company_profile_pic}
                    />
                    <button
                      onClick={async () => {
                        setForm7Data({ ...form7Data, photo: "" });
                        const {
                          data: { data },
                        } = await fetchRequest(
                          "delete",
                          `company/profile/remove/${getUserSID()}`
                        );
                        if (data.code === 200) {
                          dispatch(
                            userChangeAction({
                              ...userRole,
                              company_profile_pic: null,
                            })
                          );
                          updateInfoInCurrentUser({
                            company_profile_pic: null,
                          });
                        }
                      }}
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </span>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Your Preferred Date Format</label>
                <div className="d-flex flex-wrap">
                  {["Canadian (mm/dd/yyyy)", "USA (mm/dd/yyyy)"].map(
                    (e, index) => {
                      return (
                        <div key={index} className="checkboxGroup">
                          <label>
                            <input
                              required
                              type="radio"
                              name="preferred_date"
                              checked={form7Data["preferred_date"] === e}
                              value={e}
                              onChange={(e) => {
                                setForm7Data({
                                  ...form7Data,
                                  [e.target.name]: e.target.value,
                                });
                              }}
                            />{" "}
                            {e}
                          </label>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>
                  Do you want to receive communications/updates from CloudAct?
                </label>
                <div className="d-flex flex-wrap">
                  {["Yes", "No"].map((e, index) => {
                    return (
                      <div key={index} className="checkboxGroup">
                        <label>
                          <input
                            required
                            type="radio"
                            name="revenue_collection"
                            checked={form7Data["revenue_collection"] === e}
                            value={e}
                            onChange={(e) => {
                              setForm7Data({
                                ...form7Data,
                                [e.target.name]: e.target.value,
                              });
                            }}
                          />
                          {e}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          {form7Data.formCompleted && (
            <ModalInputCenter
              heading="Form Saved and Completed!"
              cancelOption="Ok"
              handleClick={() => {
                setForm7Data({ ...form7Data, formCompleted: false });
              }}
              changeShow={() => {
                setForm7Data({ ...form7Data, formCompleted: false });
              }}
              show={form7Data.formCompleted}
              action=""
            >
              <span className="text">Onboarding Completed Successfully!</span>
            </ModalInputCenter>
          )}
          <div className="btnGroup m-0">
            <button
              onClick={() => {
                setActiveStep(6);
              }}
              className="btn btnPrimary"
            >
              Back
            </button>
            <button className="btn btnPrimary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <>
      {!loaded && <div className="loader">Loading...</div>}

      <div className="row mt-4">
        <div className="col-md-8 offset-md-2">
          <div className="panel Hauto mb-0">
            <div className="pBody OnboardingSteps">
              {activeStep === 1 && form1()}
              {activeStep === 2 && form2()}
              {activeStep === 3 && form3()}
              {/* {activeStep === 4 && form4()}
              {activeStep === 5 && form5()}
              {activeStep === 6 && form6()} */}
            </div>
          </div>
          <div className="btnGroup mb-5">
            <button
              className="btn btnPrimary"
              onClick={() => {
                history.push("/setupwizard?step=2&completed=true");
              }}
            >
              Back
            </button>
            <button
              className="btn btnPrimary"
              onClick={() => {
                history.push("/dashboard");
              }}
            >
              Save & Finish
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnBoarding;

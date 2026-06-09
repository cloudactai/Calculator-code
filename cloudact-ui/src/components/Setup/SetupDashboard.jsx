import { useEffect, useState, useRef } from "react";
import { Modal, Tab, Tabs } from "react-bootstrap";
import Dropdown from "react-dropdown";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import ProfilePic from "../../assets/images/profile_pic.jpeg";
import { fullRefreshAction, userChangeAction } from "../../actions/userActions";
import Snackbar from "@mui/material/Snackbar";
import axios from "../../utils/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { RiLoader3Fill } from "react-icons/ri";
import Multiselect from 'multiselect-react-dropdown';
import quickbooksImg from "./../../../src/assets/images/quickbooks.png";
import clioImg from "./../../../src/assets/images/clio.png";
import { RxCross2 } from "react-icons/rx";
import systemSyncImg from "./../../../src/assets/images/systemsync.png";
import accountDetailsImg from "./../../../src/assets/images/account_details.png"
import systemsyncImg from "./../../../src/assets/images/system_sync.png"
import taxBankFinancialImg from "./../../../src/assets/images/taxFinancialBank.png"
import payRollImg from "./../../../src/assets/images/payroll.png"
import billingImg from "./../../../src/assets/images/billing.png"
import otherDetailsImg from "./../../../src/assets/images/other_details.png"
import manageUsersImg from "./../../../src/assets/images/manage_users.png"
import { FaCheck } from "react-icons/fa6";
import { CiEdit } from "react-icons/ci";

import {
  clioConnectedOrNot,
  getCurrentUserFromCookies,
  getRegionOfUser,
  getUserId,
  getUserSID,
  intuitConnectedOrNot,
  updateInfoInCurrentUser,
} from "../../utils/helpers";
import { fetchRequest } from "../../utils/fetchRequest";
import { momentFunction } from "../../utils/moment";
import ModalInputCenter from "../ModalInputCenter";
import dataLoadApi from "../../utils/Apis/setup/data_load_status";
import moment from "moment";
import { Refresh } from "tabler-icons-react";
import Cookies from "js-cookie";
import { getSvg } from "./SetupAssets/getSvg";
import CookiesParser from "../../utils/cookieParser/Cookies";
import { decrypt } from "../../utils/Encrypted";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import Loader from "../Loader";
import { set } from "date-fns";

const SetupDashboard = () => {

  console.log("getUserSIDIII", getUserSID())

  const [staticData, setStaticData] = useState(false);
  const [setupDashboardInfo, setSetupDashboardInfo] = useState({
    reviewers: [],
    preparers: [],
    admin: [],
    loadedReviewers: false,
    loadedPreparers: false,
    allUsers: [],
    allTasks: [],
    loadedTasks: false,
    modalUserEmail: "",
    modalUserRole: "PREPARER",
    addUserModalShow: false,
    modalUserName: "",
    editUserModalShow: false,
    newUserAdded: 0,
    uidToChange: 0,
    modalUserEmailError: '',
    modalUserNameError: ''
  });
  const [saveLoading, setSaveLoading] = useState(false)
  const [companyInfo, setCompanyInfo] = useState({ loaded: false });
  const [setupDashboardAllData, setSetupDashboardAllData] = useState({
    uid: getUserId(),
    sid: getUserSID(),
    firm_details: {
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
      typeFirm: "Limited liability partnership",
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
    },

    financial_text_details: {
      HST: "Monthly",
      PST: "Monthly",
      currency: "Canadian Dollar"
    },

    financial_reporting: {
      indexToChange: 0,
      modalUserName: "",
      modalUserRole: "Preparer",
      form3DataUsers: [
        {
          sid: 1,
          uid: 8,
          role: "PREPARER",
          email: "mailto:test1@yopmail.com",
          username: "Xornor Test 1",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 9,
          role: "ADMIN",
          email: "mailto:test2@yopmail.com",
          username: "Xornor Test 2",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 12,
          role: "ADMIN",
          email: "mailto:test50@yopmail.com",
          username: "test50",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 15,
          role: "REVIEWER",
          email: "mailto:harkiratsinghvirdi1+2@gmail.com",
          username: "Harkirat",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 24,
          role: "PREPARER",
          email: "mailto:harkiratsinghvirdi4+1@gmail.com",
          username: "Harkirat",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 41,
          role: "PREPARER",
          email: "mailto:varinder+1@bivu.ca",
          username: "Varinder",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 16,
          role: "PREPARER",
          email: "mailto:harkiratsinghvirdi1+3@gmail.com",
          username: "Harkirat singh new",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 29,
          role: "REVIEWER",
          email: "mailto:harkiratsinghvirdi1+23@gmail.com",
          username: "Harkirat",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          sid: 1,
          uid: 55,
          role: "PREPARER",
          email: "mailto:harkiratsinghvirdi1+113@gmail.com",
          username: "Harkirat",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          side: 1,
          uid: 57,
          role: "ADMIN",
          email: "mailto:harkiratsinghvirdi1+114@gmail.com",
          username: "harkirat",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          side: 1,
          uid: 59,
          role: "ADMIN",
          email: "mailto:harkiratsinghvirdi1+116@gmail.com",
          username: "sadf",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        },
        {
          side: 1,
          uid: 60,
          role: "REVIEWER",
          email: "mailto:harkiratsinghvirdi1+117@gmail.com",
          username: "Harkirat Test",
          short_firmname: "RPDV",
          display_firmname: "Rodrigues Paiva LLP"
        }
      ],
      modalUserEmail: "",
      addUserModalShow: false,
      editUserShowModal: false,
      userAddedAsSomething: false,
      showLinkConfirmationSend: false
    },
    bank_account_details: {
      trust_bank_accounts: [

      ],
      credit_card_accounts: [

      ],
      general_bank_accounts: [

      ]
    },
    billing_info: {
      revenue_allo: "",
      service_fees: "",
      newHeight: 0,
      billing_frequency: "",
      assignee_For_Bills_Generation: "",
      billing_cycle: {
        type: "",
        data: []
      },
      revenue_collection: "",

      billing_arrangement: "",

      disbursement_frequency: "",
      billing_activities: "",
      time_and_expense_activity: "",
      client_multiple_matters: "",
      tax_charged_soft: "",
      tax_charged_hard: "",
      bill_approval: [],
      seperate_matter: "",
      notify_users: [],
      bill_preparer: [],
      set_specify_cutoff: "",
      billingActivities: [
        {
          name: "All details",
          id: 1,
        },
        {
          name: "Activity summary",
          id: 2,
        },
        {
          name: "Aggregate",
          id: 3,
        }],
      timeAndExpenseActivity: [
        {
          name: "Include time entries and expanses",
          id: 1,
        },
        {
          name: "Include time entries",
          id: 2,
        },
        {
          name: "Include expenses only",
          id: 3,
        }],

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
          name: "Daily",
          id: 1,
        },
        {
          name: "Weekly",
          id: 2,
        },
        // {
        //   name: "Bi-weekly",
        //   id: 3,
        // },
        {
          name: "Monthly",
          id: 4,
        },
        {
          name: "Semi-monthly",
          id: 5,
        },
        {
          name: "Other",
          id: 6,
        },
      ],
      assigneeForBillsGeneration: [
        {
          name: "CloudAct",
          id: 1,
        },
        {
          name: "Internal",
          id: 2,
        },
      ],
      billingCycle: [
        {
          // Monthly: 12 months
          Monthly: Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            name: new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(0, i)),
          })),

          // Weekly: 7 days of the week, excluding Saturday (index 5) and Sunday (index 6)
          Weekly: Array.from({ length: 7 }, (_, i) => ({
            id: i + 1,
            name: new Date(2024, 0, i + 1).toLocaleString('en-US', { weekday: 'long' }),
          })).filter(day => day.name !== "Saturday" && day.name !== "Sunday"),


          // Bi-Weekly: Pick every two weeks starting from the first day of the year (e.g., Monday)
          "Bi-weekly": Array.from({ length: 7 }, (_, i) => ({
            id: i + 1,
            name: new Date(2024, 0, i + 1).toLocaleString('en-US', { weekday: 'long' }),
          })),

          // Monthly-Dates: Dates from 1 to 28
          "Monthly-Dates": Array.from({ length: 28 }, (_, i) => ({
            id: i + 1,
            name: `${i + 1}`,
          })),

          "Semi-monthly": Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            name: new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(0, i)),
          })),
        },
      ],
      billOptions: [
        {
          name: "Yes",
          id: 1,
        },
        {
          name: "No",
          id: 2,
        }
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

    },
    payroll: {

      vendor_payment: "",
      payroll_frequen: "",
      numberOfEmployeesOnPayroll: 0,
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

    },
    other_details: {
      photo: "https://cloudact-image.s3.ca-central-1.amazonaws.com/1648492528850.png",
      month_QBO: "2020-01-19",
      month_clio: "2021-01-19",
      formCompleted: false,
      preferred_date: "Canadian (dd/mm/yyyy)",
      revenue_collection: "Yes",
      localDriveSharePoint: "local",

    },
    two_factor_task: "Yes",

  }
  )

  let history = useHistory();
  const [CompanyInfoAll, setCompanyInfoAll] = useState({
    loaded: false, isActive: "No",
    auto_archive_checklist: '',
    auto_archive_duration: 0,
    prepareDueDate: 0
  });

  console.log("CompanyInfoAll0", CompanyInfoAll)
  console.log('setupDashboardAllData', setupDashboardAllData)
  const [UserUnAuthorized, setUserUnAuthorized] = useState(false)

  const [snackbarState, setSnackbarState] = useState({
    open: false,
    msg: "",
  });


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

  const [dataLoadBatchesSuccess, setDataLoadBatchesSuccess] = useState({
    show: false,
    status: [],
  });


  useEffect(() => {
    const allReviewers = axios.get(`/user/list/${getUserSID()}/${getUserId()}`);

    const allTasks = axios.get(
      `/task/list/${getCurrentUserFromCookies().role
      }/${getUserId()}/${getUserSID()}?page=1&isComplianceForm=0`
    );

    const allUsersAxios = [allReviewers, allTasks];

    Promise.all(allUsersAxios).then(([...res]) => {
      console.log("res of all users", res);
      const allData = res?.map((e) => {
        const {
          data: {
            data: { body },
          },
        } = e;
        console.log("each body", body);
        return body;
      });

      setSetupDashboardInfo({
        ...setupDashboardInfo,
        allUsers: [...allData[0]],
        allTasks: allData[1].data,
        loadedPreparers: true,
        loadedReviewers: true,
        loadedTasks: true,
      });
    });
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      axios
        .get(`/client/details/${getUserSID()}`)
        .then((res) => {

          const parsingData1 = JSON.parse(res.data.data.body.firm_details);
          const parsingData2 = JSON.parse(res.data.data.body.bank_account_details);
          const parsingData3 = JSON.parse(res.data.data.body.billing_info);
          const parsingData4 = JSON.parse(res.data.data.body.financial_reporting);
          const parsingData5 = JSON.parse(res.data.data.body.financial_text_details);
          const parsingData6 = JSON.parse(res.data.data.body.other_details
          );
          const parsingData7 = JSON.parse(res.data.data.body.payroll);


          setSetupDashboardAllData((prev) => {
            const { billingCycle, billOptions, billingActivities, timeAndExpenseActivity, billingArrangement, billingFrequency, assigneeForBillsGeneration, serviceFeesCharged, disbursementFrequency, revenueCollection, vendorPayments, ...dynamicFields } = parsingData3;

            return {
              ...prev,
              firm_details: parsingData1,
              bank_account_details: parsingData2,
              billing_info: {
                ...prev.billing_info, // Retain static arrays and other existing fields
                ...dynamicFields,    // Update only the dynamic fields from parsingData3
              },
              financial_reporting: parsingData4,
              financial_text_details: parsingData5,
              other_details: parsingData6,
              payroll: parsingData7,
            };
          });



        })
        .catch((err) => {

          console.log("err", err);
        });
    };

    const fetchCompanyData = async () => {
      const { short_firmname, display_firmname } = getCurrentUserFromCookies();
      console.log("Fetching company data...");
    
      axios.get(`/companyinfo/${getUserSID()}`)
        .then((res) => {
          console.log("checkRes", res);
    
          if (res.data.data.code === 200) {
            const companyData = res.data.data.body;
    
            setCompanyInfoAll((prev) => ({
              ...prev,
              loaded: true,
              shortName: short_firmname,
              display_firmname,
              auto_archive_checklist: companyData.isArchive,
              auto_archive_duration: companyData.ArchiveDuration,
              prepareDueDate: companyData.prepareDueDate,
              ...companyData,
            }));
    
            setCompanyInfo({
              ...companyInfo,
              loaded: true,
              display_firmname,
              shortName: short_firmname,
              ...companyData,
            });
    
            // Now, update province data
            updateCompanyData(companyData);
    
          } else if (res.data.data.code === 400) {
            toast.error(res.data.data.message.message);
            setUserUnAuthorized(true);
            setCompanyInfo({ loaded: true, companyInfo: {} });
    
          } else {
            throw res.data;
          }
        })
        .catch((err) => {
          toast.error("Internal Server Error");
          console.log("Error fetching company data:", err);
    
          setCompanyInfoAll((prev) => ({
            ...prev,
            loaded: true,
            companyInfo: {}
          }));
        });
    };
    
    // Function to update province
    const updateCompanyData = async (companyData) => {
      axios.put(`/update/companyData/${getUserSID()}`, { companyData })
        .then((res) => {
          console.log("companyData updated successfully:", res.data);
        })
        .catch((err) => {
          console.error("Error updating province:", err);
          toast.error("Failed to update province");
        });
    };
    

    fetchCompanyData()

    fetchData();
  }, []);

  const handlSubmit = (e) => {
    e.preventDefault();
    setSaveLoading(true)

    axios
      .post("/client/details", setupDashboardAllData)
      .then((err) => {
        console.log("err", err);
        setSaveLoading(false)
      }).catch(() => {
        setSaveLoading(false)
      }).finally(() => {
        setSaveLoading(false)
        setStaticData(false)
      })

    axios.patch(`/archieve/on/off`, {
      sid: getUserSID(),
      archive: CompanyInfoAll.auto_archive_duration ? 1 : 0,
      duration: CompanyInfoAll.auto_archive_duration

    }).then((res) => {
      // toast.success('settings updated ');
      console.log("resOFArcgu", res);
    }).catch((err) => {
      toast.error('setting update failed');
      console.error("err", err);
    })

    axios.patch(`/prepare/due/date`, {
      sid: getUserSID(),
      dueDate: CompanyInfoAll.prepareDueDate

    }).then((res) => {
      toast.success('setting updated');
      console.log("resOFArcgu", res);
    }).catch((err) => {
      toast.error('setting update failed');
      console.error("err", err);
    })
  }



  const HighOrderProps = {
    setupDashboardAllData,
    setSetupDashboardAllData,
    handlSubmit,
    saveLoading,
    CompanyInfoAll,
    setCompanyInfoAll,
    setupDashboardInfo,
    setSetupDashboardInfo,
    setStaticData,
    staticData
  }





  return (
    <div className="row">
      <div className="col-lg-12">
        {!setupDashboardInfo.loadedReviewers &&
          !setupDashboardInfo.loadedPreparers && (
            <div className="loader">Loading...</div>
          )}
        <div className="panel">
          {/* <div className="pHead">
            <span className="h5">
              {getSvg('Law firm profile')}
              Law firm profile
            </span>
          </div> */}
          <div className="pBody settingTabs d-flex flex-row p-0">
            {setupDashboardInfo.addUserModalShow && (
              <ModalInputCenter
                show={setupDashboardInfo.addUserModalShow}
                changeShow={() =>
                  setSetupDashboardInfo({
                    ...setupDashboardInfo,
                    addUserModalShow: false,
                  })
                }
                handleClick={() => {
                  setupDashboardInfo.modalUserEmailError = "";
                  setupDashboardInfo.modalUserNameError = "";

                  if (setupDashboardInfo.modalUserEmail === "") {
                    setupDashboardInfo.modalUserEmailError = "Enter User Email";
                  }
                  if (setupDashboardInfo.modalUserName === "") {
                    setupDashboardInfo.modalUserNameError = "Enter User Name";
                  }

                  setSetupDashboardInfo({
                    ...setupDashboardInfo,
                  });

                  if (
                    setupDashboardInfo.modalUserEmail &&
                    setupDashboardInfo.modalUserName
                  ) {
                    setupDashboardInfo.modalUserEmailError = "";
                    setupDashboardInfo.modalUserNameError = "";
                    const obj = {
                      email: setupDashboardInfo.modalUserEmail
                        .trim()
                        .toLowerCase(),
                      role: setupDashboardInfo.modalUserRole,
                      name: setupDashboardInfo.modalUserName.trim(),
                    };

                    console.log("obj", obj);

                    axios
                      .post("/add/client", {
                        email: setupDashboardInfo.modalUserEmail
                          .trim()
                          .toLowerCase(),
                        role: setupDashboardInfo.modalUserRole.toUpperCase(),
                        uid: getUserId(),
                        sid: getUserSID(),
                        user_name: setupDashboardInfo.modalUserName.trim(),
                      })
                      .then((res) => {
                        console.log("res", res);
                        setupDashboardInfo.showLinkConfirmationSend = true;
                        setupDashboardInfo.userAddedAsSomething =
                          res.data.data.body || res.data.data.message;
                        setSetupDashboardInfo({
                          ...setupDashboardInfo,
                          addUserModalShow: false,
                          allUsers: [...setupDashboardInfo.allUsers],
                        });

                        let allUsers = [];
                        allUsers.push(obj);
                        setSetupDashboardInfo({
                          ...setupDashboardInfo,
                          loadedPreparers: false,
                          addUserModalShow: false,
                          newUserAdded: setupDashboardInfo.newUserAdded + 1,
                        });

                        if (
                          res.data.data.message ===
                          "Client creation link forward to his / her email successfully."
                        ) {
                          setSnackbarState((prev) => ({
                            ...prev,
                            open: true,
                            msg: res.data.data.body || res.data.data.message,
                          }));
                        } else {
                          alert(res.data.data.body || res.data.data.message);
                          window.location.reload();
                        }
                      })
                      .catch((err) => {
                        console.log('checkErrorState', err.response.data)
                        const error = err.response.data.data.message.data;
                        setupDashboardInfo.modalUserEmailError = error.message;
                        // setupDashboardInfo.userAddedAsSomething = err.body;
                        setSetupDashboardInfo({
                          ...setupDashboardInfo,
                          newUserAdded: false,
                        });
                      });
                  }
                }}
                action="Add Users"
                heading="Add Users"
                aria-labelledby="contained-modal-title-vcenter"
                centered
              >
                <div className="form-group">
                  <label>User Name</label>
                  <input
                    type="text"
                    className={`form-control ${setupDashboardInfo.modalUserNameError && "border_red"
                      }`}
                    value={setupDashboardInfo.modalUserName}
                    onChange={(e) => {
                      setSetupDashboardInfo({
                        ...setupDashboardInfo,
                        modalUserName: e.target.value,
                      });
                    }}
                    required
                    name="modalUserName"
                  />
                </div>
                {setupDashboardInfo.modalUserNameError && (
                  <span className="text-error text">
                    {setupDashboardInfo.modalUserNameError}
                  </span>
                )}
                <div className="form-group">
                  <label>Role</label>
                  <Dropdown
                    options={roleDropdownList}
                    value={
                      setupDashboardInfo.modalUserRole || roleDropdownList[0]
                    }
                    onChange={(e) => {
                      setSetupDashboardInfo({
                        ...setupDashboardInfo,
                        modalUserRole: e.value,
                      });
                    }}
                  ></Dropdown>
                </div>
                <div className="form-group mb-0">
                  <label>User Email</label>
                  <input
                    type="email"
                    required
                    className={`form-control ${setupDashboardInfo.modalUserEmailError && "border_red"
                      }`}
                    value={setupDashboardInfo.modalUserEmail}
                    onChange={(e) => {
                      setSetupDashboardInfo({
                        ...setupDashboardInfo,
                        modalUserEmail: e.target.value,
                      });
                    }}
                    name="modalUserEmail"
                  />
                </div>
                {setupDashboardInfo.modalUserEmailError && (
                  <span className="text-error text">
                    {setupDashboardInfo.modalUserEmailError}
                  </span>
                )}
              </ModalInputCenter>
            )}
            <Snackbar
              open={snackbarState.open}
              autoHideDuration={6000}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              className="heading-5"
              onClose={() =>
                setSnackbarState((prev) => ({ ...prev, open: false }))
              }
              message={snackbarState.msg}
              action={() =>
                setSnackbarState((prev) => ({ ...prev, open: false }))
              }
            />


            {setupDashboardInfo.editUserModalShow && (
              <Modal
                className="customModal"
                show={setupDashboardInfo.editUserModalShow}
                onHide={() =>
                  setSetupDashboardInfo({
                    ...setupDashboardInfo,
                    editUserModalShow: false,
                  })
                }
                size="md"
                aria-labelledby="contained-modal-title-vcenter"
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title id="contained-modal-title-vcenter">
                    Edit User Role
                  </Modal.Title>
                </Modal.Header>
                <div>
                  <Modal.Body>
                    <div className="form-group">
                      <label>Role</label>
                      <Dropdown
                        options={roleDropdownList}
                        value={
                          setupDashboardInfo.modalUserRole ||
                          roleDropdownList[0]
                        }
                        onChange={(e) => {
                          setSetupDashboardInfo({
                            ...setupDashboardInfo,
                            modalUserRole: e.value,
                          });
                        }}
                      ></Dropdown>
                    </div>
                    <div className="btnGroup">
                      <button
                        onClick={(e) => {
                          const obj = {
                            uid: setupDashboardInfo.uidToChange,
                            role: setupDashboardInfo.modalUserRole.toUpperCase(),
                          };
                          console.log("e", e);
                          console.log("obj", obj);
                          axios
                            .put("/edit/role", obj)
                            .then((res) => {
                              console.log("res", res);
                              setSetupDashboardInfo({
                                ...setupDashboardInfo,
                                editUserModalShow: false,
                              });
                              window.location.reload();
                            })
                            .catch((err) => {
                              console.log("err", err);
                            });
                        }}
                        className="btn btnPrimary"
                      >
                        Edit User
                      </button>
                    </div>
                  </Modal.Body>
                </div>
              </Modal>
            )}
            <Tabs
              defaultActiveKey="accountDetails"
              id="uncontrolled-tab-example"
              className="d-flex flex-column gap-3 p-5"
            >
              <Tab eventKey="accountDetails" title={
                <>
                  <img src={accountDetailsImg} alt="Account Details" style={{ marginRight: "5px" }} />
                  Account Details
                </>
              }>

                <AccountDetails props={HighOrderProps} />
              </Tab>
              <Tab eventKey="systemSync" title={
                <>
                  <img src={systemsyncImg} alt="System Sync" style={{ width: "20px", marginRight: "5px" }} />
                  System Sync
                </>
              }>
                <SystemSync props={HighOrderProps} />
              </Tab>

              <Tab
                eventKey="taxFinancialAndBank"
                title={
                  <>
                    <img src={taxBankFinancialImg} alt="Tax, Financial and bank" style={{ width: "20px", marginRight: "5px" }} />
                    Tax, Financial and bank
                  </>
                }
              >
                <TaxFinancialAndBank props={HighOrderProps} />
              </Tab>
              <Tab eventKey="payroll" title={
                <>
                  <img src={payRollImg} alt="Payroll" style={{ width: "20px", marginRight: "5px" }} />
                  Payroll
                </>
              }>
                <PayRoll props={HighOrderProps} />
              </Tab>
              {/* <Tab eventKey="invoicing" title="Invoicing">
                <Invoicing props={HighOrderProps} />
              </Tab> */}
              <Tab eventKey="Billing" title={
                <>
                  <img src={billingImg} alt="Billing" style={{ width: "20px", marginRight: "5px" }} />
                  Billing
                </>
              }>
                <Billing props={HighOrderProps} />
              </Tab>
              <Tab eventKey="otherDetails" title={
                <>
                  <img src={otherDetailsImg} alt="other details" style={{ width: "20px", marginRight: "5px" }} />
                  Other details
                </>
              }>
                <OtherDetails props={HighOrderProps} />
              </Tab>
              <Tab eventKey="manageUsers" title={
                <>
                  <img src={manageUsersImg} alt="Manage Users" style={{ width: "20px", marginRight: "5px" }} />
                  Manage users
                </>
              }>
                <ManageUsers props={HighOrderProps} />
              </Tab>

            </Tabs>
          </div>
        </div>
      </div>

    </div>
  );
};
const ManageUsers = ({ props }) => {
  const { setupDashboardAllData, setSetupDashboardAllData, handlSubmit, saveLoading, setupDashboardInfo, setSetupDashboardInfo } = props;
  return (

    <div className="col-lg-12 p-0">
      <div className="panel border-0">
        <div className="pHead">
          <span className="h5" style={{ fontSize: "19px" }}>

            {getSvg('Manage users')}
            Manage users
          </span>
          <div className="control">
            <a
              onClick={(e) => {
                setSetupDashboardInfo({
                  ...setupDashboardInfo,
                  modalUserEmail: "",
                  addUserModalShow: true,
                  modalUserRole: "Admin",
                  modalUserName: "",
                });
              }}
              className="btn btnPrimary"
            >
              Add User
            </a>
          </div>
        </div>
        <div className="pBody p-0">
          {setupDashboardInfo?.allUsers?.length >= 1 && (
            <div className="tableOuter" style={{ width: "100%", margin: "auto", boxShadow: "none" }}>
              <table className="table customGrid">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: "#73C3FD33" }}>User Name</th>
                    <th style={{ backgroundColor: "#73C3FD33" }}>Email</th>
                    <th style={{ backgroundColor: "#73C3FD33" }}>Role</th>
                    <th className="text-center" style={{ backgroundColor: "#73C3FD33" }}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {setupDashboardInfo?.allUsers?.map((e, index) => {
                    if (e.username && e.email) {
                      return (
                        <tr key={index}>
                          <td>
                            <span>{e.username}</span>
                          </td>
                          <td>
                            <span>{e.email}</span>
                          </td>
                          <td>
                            <span>{e.role}</span>
                          </td>
                          <td className="actions text-center mr-4">
                            <button
                              onClick={(elem) => {
                                setSetupDashboardInfo({
                                  ...setupDashboardInfo,
                                  editUserModalShow: true,
                                  uidToChange: e.uid,
                                });
                              }}
                              className="blueColor"
                            >
                              <i className="fa-solid fa-edit"></i> Edit
                            </button>
                            <button
                              onClick={(elem) => {
                                axios
                                  .delete(
                                    `/delete/${e.role}/${e.uid}/${e.sid}`
                                  )
                                  .then((res) => {
                                    console.log("res", res);
                                    setSetupDashboardInfo({
                                      ...setupDashboardInfo,
                                      loadedPreparers: false,
                                    });
                                    window.location.reload();
                                  })
                                  .catch((err) => {
                                    console.log("err", err);
                                  });
                              }}
                              className="redColor"
                            >
                              <i className="fa-solid fa-trash-can"></i> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={index}>
                          <td>---------</td>
                          <td>---------</td>
                          <td>{e.role}</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>

  )
}
const AccountDetails = ({ props }) => {
  let { setupDashboardAllData, setSetupDashboardAllData, handlSubmit, saveLoading, CompanyInfoAll, setCompanyInfoAll, staticData, setStaticData } = props;


  const dispatch = useDispatch();
  const { userRole } = useSelector((state) => state.userChange);
  const [form7Data, setForm7Data] = useState({
    month_QBO: "",
    formCompleted: false,
  });

  // useEffect(() => {
  //   console.log("err2332323", getUserSID(), getCurrentUserFromCookies().role);
  //   if(getCurrentUserFromCookies().role != Roles.SUPERADMIN){
  //     axios.get(`/companyinfo/${getUserSID()}`).then((res) => {
  //       const {CountrySubDivisionCode } = res.data.data.body.legaladdress;
  //         let updateData = {
  //           sid: getUserSID(),
  //           province: CountrySubDivisionCode
  //         }
  //         console.log('updateData',updateData)
  //         if(CountrySubDivisionCode !== getCurrentUserFromCookies().province){
  //           axios.put(
  //             `/update/province`, updateData).then((res) => {
  //               const { data } = res.data;
  //               updateInfoInCurrentUser({province:CountrySubDivisionCode})
  //               window.location.reload();
  //           }).catch((err) => {
  //             console.log('err',err)
  //             toast.error('Current province not match with QBO province')
  //           });
  //         }

  //     }).catch((err) => {
  //       console.error('Error getting company info or Token expired Please reconnect again')
  //       // toast.error('Error getting company info or Token expired Please reconnect again')
  //     });
  //   }
  // },[provinceChange]);

  const getCompanyLegalAddress = (type) => {
    try {

      const { legaladdress } = CompanyInfoAll;
      switch (type) {
        case "street":
          return legaladdress?.Line1 + ", " + legaladdress?.PostalCode;

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

  const onChangeInput = (e) => {
    const name = e.target.name;
    const val = e.target.value;


    setSetupDashboardAllData((prev) => ({
      ...prev, firm_details: {
        ...prev.firm_details,
        [name]: val
      }
    }))

  };

  const [isActive, setActive] = useState(false);
  const toggleClass = () => {
    setActive(!isActive);
  };


  return (
    <>
      <div className="userProfilePage pNone" style={{ justifyContent: "space-between" }}>

        <div className="d-flex align-items-center">
          {/* compny info component */}
          <div className="userPhoto">
            {userRole.company_profile_pic ? (
              <img
                src={userRole.company_profile_pic}
                alt={userRole.company_profile_pic}
              ></img>
            ) : (
              <img src={ProfilePic} alt="unknown"></img>
            )}
            <div className="controls">
              <a
                onClick={toggleClass}
                href="javascript:void(0)"
                className="profileControlBtn"
              >
                {getSvg('profileControlBtn')}

              </a>
              <div className={isActive ? "open controlsView" : "controlsView"}>
                <span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    name="profile_pic"
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
                          alert("Photo size should not be greater than 500KB");
                        });
                      setActive(false);
                    }}
                    placeholder="Edit Photo"
                  ></input>
                  {getSvg('Import Image')}
                  Import Image
                </span>
                <span
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
                      updateInfoInCurrentUser({ company_profile_pic: null });
                    }
                    setActive(false);
                  }}
                >


                  {getSvg('Delete Image')}
                  Delete Image
                </span>
              </div>
            </div>
          </div>
          <div className="userInfo">
            <strong>{CompanyInfoAll.loaded && CompanyInfoAll.companyname}</strong>
            <span>{CompanyInfoAll.loaded && CompanyInfoAll.shortName}</span>
            <span>
              {CompanyInfoAll.loaded && CompanyInfoAll !== {}
                ? getCompanyLegalAddress("Province")
                : ""}{" "}
              ,{" "}
              {CompanyInfoAll.loaded && CompanyInfoAll !== {}
                ? getCompanyLegalAddress("Country")
                : ""}
            </span>
          </div>
        </div>
        {/* <div className="d-flex gap-3">
              <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
              </button>
              <button class="btn btnPrimary ms-auto" type="submit" >
                {
                  saveLoading ?
                    <>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                    : <>"Save" <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

                }
              </button>
            </div> */}
      </div>
      {staticData ? (
        <>
          <form onSubmit={handlSubmit}>
            <div className="d-flex justify-content-end">
              <div className="d-flex gap-3">

                <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
                </button>
                <button class="btn btnPrimary ms-auto" type="submit" >
                  {
                    saveLoading ?
                      <>
                        <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                      : <>Save <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

                  }
                </button>
              </div>
            </div>
            <span className="heading mt-4">Law firm details</span>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Law firm name</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="CRM Company"
                    value={
                      CompanyInfoAll.loaded && CompanyInfoAll !== {}
                        ? CompanyInfoAll.companyname
                        : ""
                    }
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Type of law firm</label>
                  <select
                    className="form-select"
                    onChange={(e) => {
                      setSetupDashboardAllData((prev) => ({
                        ...prev, firm_details: {
                          ...prev.firm_details,
                          [e.target.name]: e.target.value,
                        }
                      }))


                    }}
                    name="typeFirm"
                    value={setupDashboardAllData?.firm_details?.typeFirm}
                  >

                    {setupDashboardAllData?.firm_details?.typeFirmList?.map((firm) => (
                      <option
                        key={firm.id}
                        value={firm.name}
                        selected={setupDashboardAllData?.firm_details?.typeFirm === firm.name}
                      >
                        {firm.name}
                      </option>
                    ))}

                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Business number</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Business number"
                    name="BusinessNumber"
                    onChange={(e) => {
                      console.log("e", e);
                      const text = e.target.value;
                      if (text?.length <= 9) onChangeInput(e);
                    }}

                    value={setupDashboardAllData?.firm_details.BusinessNumber}

                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>GST number</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="GST number"
                    name="GSTNumber"
                    onChange={(e) => {

                      setSetupDashboardAllData((prev) => ({
                        ...prev, firm_details: {
                          ...prev.firm_details,
                          [e.target.name]: e.target.value,
                        }
                      }))

                    }}
                    value={setupDashboardAllData?.firm_details.GSTNumber}


                  />
                </div>
              </div>
              {CompanyInfoAll?.legaladdress?.CountrySubDivisionCode === "BC" && (
                <div className="col-md-4">
                  <div className="form-group">
                    <label>PST number</label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="PST number"
                      name="PSTNumber"
                      onChange={(e) => {
                        setSetupDashboardAllData((prev) => ({
                          ...prev, firm_details: {
                            ...prev.firm_details,
                            [e.target.name]: e.target.value,
                          }
                        }))

                      }}
                      value={setupDashboardAllData?.firm_details?.PSTNumber}
                    />
                  </div>
                </div>
              )}
              {setupDashboardAllData?.firm_details?.typeFirm === "Limited liability partnership" && (
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Partnership number</label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Partnership Number"
                      name="partnershipNumber"
                      onChange={(e) => {

                        setSetupDashboardAllData((prev) => ({
                          ...prev, firm_details: {
                            ...prev.firm_details,
                            [e.target.name]: e.target.value,
                          }
                        }))


                      }}
                      value={setupDashboardAllData?.firm_details.partnershipNumber}
                    />
                  </div>
                </div>
              )}
              <div className="col-md-4">
                <div className="form-group">
                  <label>Law firm short name</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Law firm short name"
                    name="shortName"
                    disabled
                    onChange={(e) => {

                      setCompanyInfoAll((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }))


                    }}
                    value={CompanyInfoAll.shortName}
                  />
                </div>
              </div>

              {setupDashboardAllData?.firm_details?.typeFirm === "Limited liability partnership" && (
                <>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Name of Partner</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Name of Partner"
                        value={setupDashboardAllData?.firm_details.detailsOfPartners}
                        onChange={(e) => {

                          setSetupDashboardAllData((prev) => ({
                            ...prev, firm_details: {
                              ...prev.firm_details,
                              [e.target.name]: e.target.value,
                            }
                          }))


                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Partnership Number</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Partnership Number"
                        name="PartnershipNumber"
                        value={
                          setupDashboardAllData?.firm_details.partnershipNumber && setupDashboardAllData?.firm_details.BusinessNumber
                            ? setupDashboardAllData?.firm_details.partnershipNumber
                            : ""
                        }

                        onChange={(e) => {

                          setSetupDashboardAllData((prev) => ({
                            ...prev, firm_details: {
                              ...prev.firm_details,
                              [e.target.name]: e.target.value,
                            }
                          }))


                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Law Firm's short name</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Short Name"
                        name="shortName"
                        value={CompanyInfoAll.shortName ? CompanyInfoAll.shortName : ""}

                        onChange={(e) => {

                          setCompanyInfoAll((prev) => ({
                            ...prev,
                            shortName: e.target.value,
                          }))

                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="heading">Further Details</span>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Number of lawyers</label>
                  <input
                    className="form-control"
                    type="text"
                    onChange={(e) => {
                      onChangeInput(e);
                    }}
                    name="NumberOfLawyers"
                    placeholder="No of lawyers"
                    value={setupDashboardAllData?.firm_details.NumberOfLawyers}

                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Paralegals</label>
                  <input
                    className="form-control"
                    type="text"
                    name="NumberOfParalegals"
                    placeholder="No of paralegals"
                    onChange={onChangeInput}
                    value={setupDashboardAllData?.firm_details.NumberOfParalegals}

                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Number of office staff</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Number of office staff"
                    name="NumberOfOfficeStaff"
                    onChange={onChangeInput}
                    value={setupDashboardAllData?.firm_details.NumberOfOfficeStaff}
                  />
                </div>
              </div>
            </div>
            {/* <div className="btnGroup">

              <button class="btn btnPrimary ms-auto" type="submit" >
                {
                  saveLoading ?
                    <>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                    : "Save"
                }
              </button>


            </div> */}
          </form>
        </>
      ) : (
        <>
          <form onSubmit={handlSubmit}>
            <button className="editBtn btn btnPrimary ml-auto" onClick={() => setStaticData(true)}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
            </button>
            <span className="heading mt-4">Law firm details</span>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Law firm name</label>
                  <span>{
                    CompanyInfoAll.loaded && CompanyInfoAll !== {}
                      ? CompanyInfoAll.companyname
                      : ""
                  }</span>
                  {/* <input
                    className="form-control"
                    type="text"
                    placeholder="CRM Company"
                    value={
                      CompanyInfoAll.loaded && CompanyInfoAll !== {}
                        ? CompanyInfoAll.companyname
                        : ""
                    }
                  /> */}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Type of law firm</label>
                  <span>{setupDashboardAllData?.firm_details?.typeFirm}</span>
                  {/* <select
                    className="form-select"
                    onChange={(e) => {
                      setSetupDashboardAllData((prev) => ({
                        ...prev, firm_details: {
                          ...prev.firm_details,
                          [e.target.name]: e.target.value,
                        }
                      }))


                    }}
                    name="typeFirm"
                    value={setupDashboardAllData?.firm_details?.typeFirm}
                  > */}

                  {/* {setupDashboardAllData?.firm_details?.typeFirmList?.map((firm) => (
                      <option
                        key={firm.id}
                        value={firm.name}
                        selected={setupDashboardAllData?.firm_details?.typeFirm === firm.name}
                      >
                        {firm.name}
                      </option>
                    ))} */}

                  {/* </select> */}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Business number</label>
                  <span>{setupDashboardAllData?.firm_details.BusinessNumber}</span>
                  {/* <input
                    className="form-control"
                    type="text"
                    placeholder="Business number"
                    name="BusinessNumber"
                    onChange={(e) => {
                      console.log("e", e);
                      const text = e.target.value;
                      if (text?.length <= 9) onChangeInput(e);
                    }}

                    value={setupDashboardAllData?.firm_details.BusinessNumber}

                  /> */}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>GST number</label>
                  <span>{setupDashboardAllData?.firm_details.GSTNumber}</span>
                  {/* <input
                    className="form-control"
                    type="text"
                    placeholder="GST number"
                    name="GSTNumber"
                    onChange={(e) => {

                      setSetupDashboardAllData((prev) => ({
                        ...prev, firm_details: {
                          ...prev.firm_details,
                          [e.target.name]: e.target.value,
                        }
                      }))

                    }}
                    value={setupDashboardAllData?.firm_details.GSTNumber}


                  /> */}
                </div>
              </div>
              {CompanyInfoAll?.legaladdress?.CountrySubDivisionCode === "BC" && (
                <div className="col-md-4">
                  <div className="form-group">
                    <label>PST number</label>
                    <span>{setupDashboardAllData?.firm_details?.PSTNumber}</span>
                    {/* <input
                      className="form-control"
                      type="text"
                      placeholder="PST number"
                      name="PSTNumber"
                      onChange={(e) => {
                        setSetupDashboardAllData((prev) => ({
                          ...prev, firm_details: {
                            ...prev.firm_details,
                            [e.target.name]: e.target.value,
                          }
                        }))

                      }}
                      value={setupDashboardAllData?.firm_details?.PSTNumber}
                    /> */}
                  </div>
                </div>
              )}
              {setupDashboardAllData?.firm_details?.typeFirm === "Limited liability partnership" && (
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Partnership number</label>
                    <span>{setupDashboardAllData?.firm_details.partnershipNumber}</span>
                    {/* <input
                      className="form-control"
                      type="text"
                      placeholder="Partnership Number"
                      name="partnershipNumber"
                      onChange={(e) => {

                        setSetupDashboardAllData((prev) => ({
                          ...prev, firm_details: {
                            ...prev.firm_details,
                            [e.target.name]: e.target.value,
                          }
                        }))


                      }}
                      value={setupDashboardAllData?.firm_details.partnershipNumber}
                    /> */}
                  </div>
                </div>
              )}
              <div className="col-md-4">
                <div className="form-group">
                  <label>Law firm short name</label>
                  <span>{CompanyInfoAll.shortName}</span>
                  {/* <input
                    className="form-control"
                    type="text"
                    placeholder="Law firm short name"
                    name="shortName"
                    disabled
                    onChange={(e) => {

                      setCompanyInfoAll((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }))


                    }}
                    value={CompanyInfoAll.shortName}
                  /> */}
                </div>
              </div>

              {setupDashboardAllData?.firm_details?.typeFirm === "Limited liability partnership" && (
                <>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Name of Partner</label>
                      <span>{setupDashboardAllData?.firm_details.detailsOfPartners}</span>
                      {/* <input
                        className="form-control"
                        type="text"
                        placeholder="Name of Partner"
                        value={setupDashboardAllData?.firm_details.detailsOfPartners}
                        onChange={(e) => {

                          setSetupDashboardAllData((prev) => ({
                            ...prev, firm_details: {
                              ...prev.firm_details,
                              [e.target.name]: e.target.value,
                            }
                          }))


                        }}
                      /> */}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Partnership Number</label>
                      <span>{
                        setupDashboardAllData?.firm_details.partnershipNumber && setupDashboardAllData?.firm_details.BusinessNumber
                          ? setupDashboardAllData?.firm_details.partnershipNumber
                          : ""
                      }</span>
                      {/* <input
                        className="form-control"
                        type="text"
                        placeholder="Partnership Number"
                        name="PartnershipNumber"
                        value={
                          setupDashboardAllData?.firm_details.partnershipNumber && setupDashboardAllData?.firm_details.BusinessNumber
                            ? setupDashboardAllData?.firm_details.partnershipNumber
                            : ""
                        }

                        onChange={(e) => {

                          setSetupDashboardAllData((prev) => ({
                            ...prev, firm_details: {
                              ...prev.firm_details,
                              [e.target.name]: e.target.value,
                            }
                          }))


                        }}
                      /> */}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Law Firm's short name</label>
                      <span>{CompanyInfoAll.shortName ? CompanyInfoAll.shortName : ""}</span>
                      {/* <input
                        className="form-control"
                        type="text"
                        placeholder="Short Name"
                        name="shortName"
                        value={CompanyInfoAll.shortName ? CompanyInfoAll.shortName : ""}

                        onChange={(e) => {

                          setCompanyInfoAll((prev) => ({
                            ...prev,
                            shortName: e.target.value,
                          }))

                        }}
                      /> */}
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="heading">Further Details</span>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Number of lawyers</label>
                  <span>{setupDashboardAllData?.firm_details.NumberOfLawyers}</span>
                  {/* <input
                    className="form-control"
                    type="text"
                    onChange={(e) => {
                      onChangeInput(e);
                    }}
                    name="NumberOfLawyers"
                    placeholder="No of lawyers"
                    value={setupDashboardAllData?.firm_details.NumberOfLawyers}

                  /> */}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Paralegals</label>
                  <span>{setupDashboardAllData?.firm_details.NumberOfParalegals}</span>
                  {/* <input
                    className="form-control"
                    type="text"
                    name="NumberOfParalegals"
                    placeholder="No of paralegals"
                    onChange={onChangeInput}
                    value={setupDashboardAllData?.firm_details.NumberOfParalegals}

                  /> */}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Number of office staff</label>
                  <span>{setupDashboardAllData?.firm_details.NumberOfOfficeStaff}</span>
                  {/* <input
                    className="form-control"
                    type="text"
                    placeholder="Number of office staff"
                    name="NumberOfOfficeStaff"
                    onChange={onChangeInput}
                    value={setupDashboardAllData?.firm_details.NumberOfOfficeStaff}
                  /> */}
                </div>
              </div>
            </div>
            {/* <div className="btnGroup">

              <button class="btn btnPrimary ms-auto" type="submit" >
                {
                  saveLoading ?
                    <>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                    : "Save"
                }
              </button>


            </div> */}
          </form>
        </>
      )}
    </>
  );
};

const SystemSync = ({ props }) => {

  let { CompanyInfoAll, setCompanyInfoAll } = props;


  const dispatch = useDispatch();
  let history = useHistory();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [dataResetModal, setDataResetModal] = useState(false);
  const [showDataEraseAlert, setshowDataEraseAlert] = useState(false);
  const [isClioConnected, setIsClioConnected] = useState(false);
  const [isQBOConnected, setIsQBOConnected] = useState(false);
  const [popoverState, setPopoverState] = useState({
    open: false,
    index: 0,
  });
  const [dataLoadBatchesSuccess, setDataLoadBatchesSuccess] = useState({
    show: false,
    status: [],
  });
  const [isActive, setActive] = useState(false);
  const [dataloadLoader, setDataloadLoader] = useState(false);
  const toggleClass = () => {
    setActive(!isActive);
  };

  const handleDataLoad = () => {
    setshowDataEraseAlert(true);
  };

  const deleteDataLoad = () => {
    dispatch(fullRefreshAction());
  };

  const fetchDataLoadStatus = async () => {
    const dataTest = await dataLoadApi();
    setDataLoadBatchesSuccess((prev) => ({
      show: true,
      status: dataTest,
    }));
    setDataloadLoader(false);
  };

  useEffect(() => {
    fetchDataLoadStatus();
  }, []);

  const changeClioConnected = (e) => {
    setIsClioConnected(e);
  };

  const changeQBOConnected = (e) => {
    setIsQBOConnected(e);
  };

  const update = (value) => {
    let prevData = CookiesParser.get("allUserInfo");
    console.log("prevDataoFconkjketj setu", prevData);
    prevData = decrypt(prevData)
    Object.keys(value).forEach(function (val, key) {
      prevData[val] = value[val];
    });
    CookiesParser.set("allUserInfo", prevData, { path: "/" });
  };

  const disconnectService = (type) => {
    axios.get(
      `/disconnect/access?
        uid=${getUserId()}&type=${type}
        &region=
        ${type === "intuit" ? "us" : getRegionOfUser()}
        &sid=${getUserSID()}`
    )
      .then((res) => {
        console.log("res", res);
        if (res.data.data.code === 200) {
          if (type === "clio") {
            changeClioConnected(false);
            update({ authClio: false });
            history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
          } else if (type === "intuit") {
            changeQBOConnected(false);
            update({ authIntuit: false });
            history.push(`/setupwizard?step=2&connected=${isQBOConnected}`);
          }
        }
      })
      .catch((err) => {
        console.log("err", err);
        if (type === "clio") {
          history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
          changeClioConnected(true);
        } else if (type === "intuit") {
          changeQBOConnected(true);
          history.push(`/setupwizard?step=2&connected=${isQBOConnected}`);
        }
      });
  };

  return (
    <>
      <GetCompanyDetails />
      <Loader isLoading={dataloadLoader} />
      <ModalInputCenter
        changeShow={() => {
          setDataResetModal(false)
          setDataloadLoader(true)
        }


        }
        show={dataResetModal}
        cancelOption="Ok"
        heading={"Data Refresh"}
        handleClick={() => {
        }}


      >
        <h4 style={{ fontSize: "16px" }}>
          The process has been initiated and will be completed in some time.
        </h4>
      </ModalInputCenter>
      <ModalInputCenter
        changeShow={() => setshowDataEraseAlert(false)}
        show={showDataEraseAlert}
        action="Yes"
        cancelOption="No"
        handleClick={() => {
          if (getUserSID() && clioConnectedOrNot() && intuitConnectedOrNot()) {

            deleteDataLoad();

            setTimeout(() => {
              fetchDataLoadStatus();

            }, 2000)


          }
          setshowDataEraseAlert(false);
          setDataResetModal(true);
        }}
        heading={"Data Refresh"}
      >
        <h4 style={{ fontSize: "16px" }}>
          Are you sure that you want to delete the data and refresh?
        </h4>
      </ModalInputCenter>
      <h6 className="mt-4 mb-3 fw-bold">System Sync</h6>
      {/* <div className="syncSystemWrap"> */}
      <div className="row">
        <div className="col-lg-4">
          {/* <Link to="setupwizard?step=2&redirect=setup" className="syncConnect">
        <span>
          <strong>
            {clioConnectedOrNot() === true ? (
              <>Connected To Clio</>
            ) : (
              <>Clio not Connected</>
            )}
          </strong>
          {momentFunction.formatDate(
            userInfo.updated_at,
            "ddd, D MMM, YYYY - h:mm A"
          )}
        </span>
        {getSvg('Clio Connect')}

        {clioConnectedOrNot() === false ? (
          <span>
            {getSvg('Clio ConnectedOrnot')}

          </span>
        ) : (
          <span onClick={() => disconnectService("clio")}>
            {getSvg('Disconnected Clio')}

          </span>
        )}
      </Link> */}
          <Link to="setupwizard?step=2&redirect=setup" className="syncLink p-3 pb-0" style={{ textDecoration: "none", borderRadius: '8px' }}>
            <div><img src={quickbooksImg} /></div>
            <Refresh size={"20"} style={{ position: 'absolute', right: '10px', bottom: '10px', color: 'white' }} />
            <span>
              <p className="m-0 mt-4" style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>
                {clioConnectedOrNot() === true ? (
                  <>Connected To Clio</>
                ) : (
                  <>Clio not Connected</>
                )}
              </p>
              <p className="m-0" style={{ color: "white" }}>
                {momentFunction.formatDate(
                  userInfo.updated_at,
                  "ddd, D MMM, YYYY - h:mm A"
                )}
              </p>
            </span>
            <p>

              {clioConnectedOrNot() === false ? (
                <span style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }}>
                  <RxCross2 size={"20"} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }} />

                </span>
              ) : (
                <span onClick={() => disconnectService("clio")} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }}>
                  <RxCross2 size={"20"} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }} />

                </span>
              )}</p>
          </Link>
        </div>
        <div className="col-lg-4">
          {/* <Link to="setupwizard?step=2&redirect=setup" className="syncConnect QBO">
            <span>
              <strong>
                {intuitConnectedOrNot() === true ? (
                  <>Connected To QBO</>
                ) : (
                  <>QBO not Connected</>
                )}
              </strong>
              {momentFunction.formatDate(
                userInfo.updated_at,
                "ddd, D MMM, YYYY - h:mm A"
              )}
            </span>
            {getSvg('intuitConnectedOrNot')}

            {intuitConnectedOrNot() === false ? (
              <span>
                {getSvg('intuitConnectedOrNot_false')}

              </span>
            ) : (
              <span onClick={() => disconnectService("intuit")}>
                {getSvg('disconnectService')}

              </span>
            )}
          </Link> */}
          <Link to="setupwizard?step=2&redirect=setup" className="syncLink2 p-3 pb-0" style={{ textDecoration: "none", borderRadius: '8px' }}>
            <div><img src={clioImg} /></div>
            <Refresh size={"20"} style={{ position: 'absolute', right: '10px', bottom: '10px', color: 'white' }} />
            <span>
              <p className="m-0 mt-4" style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>
                {intuitConnectedOrNot() === true ? (
                  <>Connected To QBO</>
                ) : (
                  <>QBO not Connected</>
                )}
              </p>
              <p className="m-0" style={{ color: "white" }}>
                {momentFunction.formatDate(
                  userInfo.updated_at,
                  "ddd, D MMM, YYYY - h:mm A"
                )}
              </p>
            </span>
            <p>

              {intuitConnectedOrNot() === false ? (
                <span style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }}>
                  <RxCross2 size={"20"} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }} />

                </span>
              ) : (
                <span onClick={() => disconnectService("intuit")} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }}>
                  <RxCross2 size={"20"} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }} />

                </span>
              )}</p>
          </Link>
        </div>
        <div className="col-lg-4">
          <div className="syncConnect system  syncLink3 p-3 pb-0" style={{ height: "100%", background: "#73C3FD" }}>
            <div><img src={systemSyncImg} /></div>
            <span style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }}>
              <RxCross2 size={"20"} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }} />

            </span>


            <span>
              <strong>System Sync</strong>
              {dataLoadBatchesSuccess.show && (
                <span className="statusIcon">
                  {dataLoadBatchesSuccess.status.map((s, index) => {
                    return (
                      <span key={Math.random()}>
                        <i
                          aria-describedby={"simple-popover"}
                          onClick={(e) => {
                            setPopoverState((prev) => ({
                              ...prev,
                              open: true,
                              index: index,
                            }));
                            setTimeout(() => {
                              setPopoverState((prev) => ({
                                ...prev,
                                open: false,
                                index: index,
                              }));
                            }, 3500);
                          }}
                          style={{
                            color:
                              s.status === "processed"
                                ? "#0FFF50"
                                : s.status === "error"
                                  ? "#C70039"
                                  : "#ffe800",
                          }}
                          className="fas fa-circle"
                        ></i>
                        <span
                          className={`tooltipView ${index === popoverState.index &&
                            popoverState.open === true
                            ? "d-block"
                            : "d-none"
                            }`}
                          id={"simple-popover"}
                          anchorOrigin={{ vertical: "top", horizontal: "center" }}
                          onClose={() =>
                            setPopoverState((prev) => ({ ...prev, anchorEl: null }))
                          }
                          anchorEl={popoverState.anchorEl}
                          transformOrigin={{
                            vertical: "bottom",
                            horizontal: "center",
                          }}
                        >
                          Data{" "}
                          {s.status === "processed"
                            ? " successfully loaded "
                            : s.status === "failed"
                              ? "loading failed"
                              : "in progress"}{" "}
                          on: {moment(s.min_load_start).format("lll")}
                        </span>
                      </span>
                    );
                  })}
                </span>
              )}
            </span>

            {getSvg('refresh')}
            <span onClick={handleDataLoad} className="refresh-icon" style={{
              float: "right", position: "absolute", right: "10px", bottom: "9px"
            }}>
              <Refresh size={"21"} color="white" />
            </span>

          </div>




          {/* <div className="syncConnect system syncLink3 p-3 pb-0" style={{ textDecoration: "none", borderRadius: '8px' }}>
            <div><img src={systemSyncImg} /></div>
            <Refresh size={"20"} style={{ position: 'absolute', right: '10px', bottom: '10px', color: 'white' }} />
            <span>
              <p className="m-0 mt-4" style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}>System Sync</p>
              {dataLoadBatchesSuccess.show && (
                <span className="statusIcon d-flex align-items-center gap-1">
                  {dataLoadBatchesSuccess.status.map((s, index) => {
                    return (
                      <span key={Math.random()}>
                        <i
                          aria-describedby={"simple-popover"}
                          onClick={(e) => {
                            setPopoverState((prev) => ({
                              ...prev,
                              open: true,
                              index: index,
                            }));
                            setTimeout(() => {
                              setPopoverState((prev) => ({
                                ...prev,
                                open: false,
                                index: index,
                              }));
                            }, 3500);
                          }}
                          style={{
                            color:
                              s.status === "processed"
                                ? "#4CB528"
                                : s.status === "failed"
                                  ? "#C70039"
                                  : "#ffe800",
                          }}
                          className="fas fa-circle"
                        ></i>
                        <span
                          className={`tooltipView ${index === popoverState.index &&
                            popoverState.open === true
                            ? "d-block"
                            : "d-none"
                            }`}
                          id={"simple-popover"}
                          anchorOrigin={{ vertical: "top", horizontal: "center" }}
                          onClose={() =>
                            setPopoverState((prev) => ({ ...prev, anchorEl: null }))
                          }
                          anchorEl={popoverState.anchorEl}
                          transformOrigin={{
                            vertical: "bottom",
                            horizontal: "center",
                          }}
                        >
                          Data{" "}
                          {s.status === "processed"
                            ? " successfully loaded "
                            : s.status === "failed"
                              ? "loading failed"
                              : "in progress"}{" "}
                          on: {moment(s.min_load_start).format("lll")}
                        </span>
                      </span>
                    );
                  })}
                </span>
              
              )}
            </span>
            <p>

              {intuitConnectedOrNot() === false ? (
                <span style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }}>
                  <RxCross2 size={"20"} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }} />

                </span>
              ) : (
                <span onClick={() => disconnectService("intuit")} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }}>
                  <RxCross2 size={"20"} style={{ position: 'absolute', right: '5px', top: '5px', color: 'white' }} />

                </span>
              )}</p>
          </div> */}
        </div>
      </div>

      {/* </div> */}
    </>
  );
};

const TaxFinancialAndBank = ({ props }) => {
  // const [companyInfo, setCompanyInfo] = useState({ loaded: false });

  let { setupDashboardAllData, setSetupDashboardAllData, handlSubmit, saveLoading, CompanyInfoAll, setCompanyInfoAll, staticData, setStaticData } = props;


  const [form2Data, setForm2Data] = useState({
    HST: "Monthly",
    PST: "Monthly",
    currency: "Canadian Dollar"
  });

  const [form4Data, setForm4Data] = useState({
    trust_bank_accounts: [],
    general_bank_accounts: [],
    credit_card_accounts: [],
  });


  const [bankDetails, setBankDetails] = useState([]);


  useEffect(() => {
    // axios
    //   .get(`/companyinfo/${getUserSID()}`)
    //   .then((res) => {
    //     if (res.data.data.code === 200) {
    //       setCompanyInfo({
    //         ...companyInfo,
    //         loaded: true,
    //         ...res.data.data.body,
    //       });
    //     } else {
    //       throw res.data.data.status;
    //     }
    //   })
    //   .catch((err) => {
    //     console.log("err", err);
    //     setCompanyInfo({ loaded: true, companyInfo: {} });
    //   });

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

        const bankDetails = []
        for (let i = 0; i < trustAccountResponse.length; i++) {
          bankDetails.push({ ...trustAccountResponse[i], type: 'Trust' })
        }
        for (let i = 0; i < generalAccountResponse.length; i++) {
          bankDetails.push({ ...generalAccountResponse[i], type: 'General' })
        }
        setBankDetails(bankDetails)
      })
      .catch((err) => {
        console.log("err", err);
        alert("Server Error");
      });
  }, []);

  console.log(form4Data, "form4Data");


  const getCompanyLegalAddress = (type) => {
    try {
      // const { legaladdress } = companyInfo;
      const { legaladdress } = CompanyInfoAll;


      switch (type) {
        case "street":
          return legaladdress?.Line1 + ", " + legaladdress?.PostalCode;

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

  const showPSTColumns = () => {
    const province = getCompanyLegalAddress("Province");
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

  const refreshAccounts = () => {

  }

  return (
    <>
      <GetCompanyDetails />
      {/* {staticData ? (
        <div className="d-flex gap-3" style={{
          position: "absolute", right: "42px", top: "96px"
        }}>
          <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <button class="btn btnPrimary ms-auto" type="submit" >
            {
              saveLoading ?
                <>
                  <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
                : <>"Save" <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

            }
          </button>
        </div>
      ) : (
        <button className="editBtn btn btnPrimary" onClick={() => setStaticData(true)} style={{
          position: "absolute", right: "42px", top: "96px"
        }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
        </button>

      )} */}

      {staticData ? (
        <>
          <form onSubmit={handlSubmit} className="mt-3">

            <div className="d-flex justify-content-end" style={{
              position: "absolute", right: "42px", top: "96px"
            }}>
              <div className="gap-3 d-flex">
                <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
                </button>
                <button class="btn btnPrimary ms-auto" type="submit" >
                  {
                    saveLoading ?
                      <>
                        <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                      : <>Save <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

                  }
                </button></div>
            </div>


            <strong className="mb-4">Bank Details</strong>
            <span className="heading mt-3">Tax & financial Details</span>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>GST Number</label>
                  <input type="text" />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>HST/GST filing frequency</label>
                  <select
                    className="form-select"
                    onChange={(e) => {
                      setSetupDashboardAllData((prev) => ({
                        ...prev, financial_text_details: {
                          ...prev.financial_text_details,
                          [e.target.name]: e.target.value,
                        }
                      }))

                    }}
                    name="HST"
                    // value={form2Data.HST}
                    value={setupDashboardAllData.financial_text_details.HST}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label>Tax Number</label>
                  <input type="text" />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Financial year end</label>
                  <input
                    className="form-control"
                    required
                    type="text"
                    disabled="true"
                    value={
                      CompanyInfoAll &&
                      momentFunction.getPreviousMonthFromString(
                        CompanyInfoAll.fiscalstartmonth
                      )
                    }
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>Annual tax filing date</label>
                  <input
                    className="form-control"
                    required
                    type="text"
                    disabled="true"
                    value={momentFunction.add6Months(CompanyInfoAll.fiscalstartmonth)}
                  />
                </div>
              </div>
              {showPSTColumns() && (
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Filing frequency for PST</label>
                    <div className="d-flex flex-wrap">
                      {["Monthly", "Quarterly", "Semi-annual", "Yearly"].map(
                        (e, index) => {
                          return (
                            <div className="checkboxGroup" key={index}>
                              <label>
                                <input
                                  required
                                  name="PST"
                                  type="radio"
                                  checked={setupDashboardAllData?.financial_text_details["PST"] === e}
                                  value={e}
                                  onChange={(element) => {
                                    setSetupDashboardAllData((prev) => ({
                                      ...prev, financial_text_details: {
                                        ...prev.financial_text_details,
                                        [element.target.name]: e,
                                      }
                                    }))

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
              <div className="col-md-4">
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    className="form-select"
                    onChange={(e) => {
                      setForm2Data({
                        ...form2Data,
                        [e.target.name]: e.target.value,
                      });

                      setSetupDashboardAllData((prev) => ({
                        ...prev, financial_text_details: {
                          ...prev.financial_text_details,
                          [e.target.name]: e.target.value,
                        }
                      }))
                    }}
                    name="currency"
                    // value={form2Data.currency}
                    value={setupDashboardAllData.financial_text_details.currency}
                  >
                    <option value="Canadian Dollar">Canadian Dollar</option>
                    <option value="USA Dollar">US Dollar</option>
                  </select>
                </div>
              </div>




            </div>
            <span class="heading mt-3">Bank Details</span>
            <div className="tableOuter m-auto w-100">
             
              <table className="table customGrid">
              <thead className="w-100 heading_row">
                <tr>
                  <th style={{ backgroundColor: "#f1f9ff" }}>Account type</th>
                  <th style={{ backgroundColor: "#f1f9ff" }}>Account name</th>
                  <th style={{ backgroundColor: "#f1f9ff"}}>Account ID</th>
                </tr>
              </thead>
              <tbody>
                {bankDetails && bankDetails.length > 0 && bankDetails.map((detail) => (
                  <tr>
                    <td>
                      {detail.type}
                    </td>
                    <td>
                      {detail.name}
                    </td>
                    <td>
                      {detail.account_id}
                    </td>
                  </tr>
                ))}
                {/* {setupDashboardAllData?.bank_account_details?.trust_bank_accounts?.map((e) => {
                  if (e.name)
                    return (
                      <tr>
                        <td>Trust Bank</td>
                        <td>{e.name}</td>
                      </tr>
                    );
                })}

                {setupDashboardAllData?.bank_account_details?.general_bank_accounts?.map((e) => {
                  if (e.name)
                    return (
                      <tr>
                        <td>General Bank</td>
                        <td>{e.name}</td>
                      </tr>
                    );
                })}

                {setupDashboardAllData?.bank_account_details?.credit_card_accounts?.map((e) => {
                  return e.name ? (
                    <tr>
                      <td>Credit Card</td>
                      <td>{e.name}</td>
                    </tr>
                  ) : null;
                })} */}
{/* 
                {setupDashboardAllData?.bank_account_details?.trust_bank_accounts?.length === 0 && (
                  <tr>
                    <td>No Bank Account Yet</td>
                    <td>No Bank Yet</td>
                  </tr>
                )} */}

              </tbody>
            </table>
            </div>
          </form>
        </>
      ) : (
        <form onSubmit={handlSubmit} className="mt-3">
          <button className="editBtn btn btnPrimary ml-auto" onClick={() => setStaticData(true)} style={{
            position: "absolute", right: "42px", top: "96px"
          }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <strong className="mb-4">Bank Details</strong>
          <span className="heading mt-3">Tax & financial Details</span>
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>GST Number</label>
                <span></span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>HST/GST filing frequency</label>
                <span>{setupDashboardAllData.financial_text_details.HST}</span>
                {/* <select
                    className="form-select"
                    onChange={(e) => {
                      setSetupDashboardAllData((prev) => ({
                        ...prev, financial_text_details: {
                          ...prev.financial_text_details,
                          [e.target.name]: e.target.value,
                        }
                      }))

                    }}
                    name="HST"
                    // value={form2Data.HST}
                    value={setupDashboardAllData.financial_text_details.HST}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select> */}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Tax Number</label>
                {/* <input type="text" /> */}
                <span></span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Financial year end</label>
                <span>{
                  CompanyInfoAll &&
                  momentFunction.getPreviousMonthFromString(
                    CompanyInfoAll.fiscalstartmonth
                  )
                }</span>

                {/* <input
                    className="form-control"
                    required
                    type="text"
                    disabled="true"
                    value={
                      CompanyInfoAll &&
                      momentFunction.getPreviousMonthFromString(
                        CompanyInfoAll.fiscalstartmonth
                      )
                    }
                  /> */}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Annual tax filing date</label>
                <span>{momentFunction.add6Months(CompanyInfoAll.fiscalstartmonth)}</span>
                {/* <input
                    className="form-control"
                    required
                    type="text"
                    disabled="true"
                    value={momentFunction.add6Months(CompanyInfoAll.fiscalstartmonth)}
                  /> */}
              </div>
            </div>
            {showPSTColumns() && (
              <div className="col-md-4">
                <div className="form-group">
                  <label>Filing frequency for PST</label>
                  <div className="d-flex flex-wrap">
                    {["Monthly", "Quarterly", "Semi-annual", "Yearly"].map(
                      (e, index) => {
                        return (
                          <div className="checkboxGroup" key={index}>
                            <label>
                              <input
                                required
                                name="PST"
                                type="radio"
                                checked={setupDashboardAllData?.financial_text_details["PST"] === e}
                                value={e}
                                onChange={(element) => {
                                  setSetupDashboardAllData((prev) => ({
                                    ...prev, financial_text_details: {
                                      ...prev.financial_text_details,
                                      [element.target.name]: e,
                                    }
                                  }))

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
            <div className="col-md-4">
              <div className="form-group">
                <label>Currency</label>
                <span>{setupDashboardAllData.financial_text_details.currency}</span>
                {/* <select
                    className="form-select"
                    onChange={(e) => {
                      setForm2Data({
                        ...form2Data,
                        [e.target.name]: e.target.value,
                      });

                      setSetupDashboardAllData((prev) => ({
                        ...prev, financial_text_details: {
                          ...prev.financial_text_details,
                          [e.target.name]: e.target.value,
                        }
                      }))
                    }}
                    name="currency"
                    // value={form2Data.currency}
                    value={setupDashboardAllData.financial_text_details.currency}
                  > 
                    <option value="Canadian Dollar">Canadian Dollar</option>
                    <option value="USA Dollar">US Dollar</option>
                  </select>*/}
              </div>
            </div>




          </div>
          <span class="heading mt-3">Bank Details</span>
          <div className="tableOuter m-auto w-100">
            <table className="table customGrid">
              <thead className="w-100 heading_row">
                <tr>
                  <th style={{ backgroundColor: "#f1f9ff" }}>Account type</th>
                  <th style={{ backgroundColor: "#f1f9ff" }}>Account name</th>
                  <th style={{ backgroundColor: "#f1f9ff"}}>Account ID</th>
                </tr>
              </thead>
              <tbody>
                {bankDetails && bankDetails.length > 0 && bankDetails.map((detail) => (
                  <tr>
                    <td>
                      {detail.type}
                    </td>
                    <td>
                      {detail.name}
                    </td>
                    <td>
                      {detail.account_id}
                    </td>
                  </tr>
                ))}
                {/* {setupDashboardAllData?.bank_account_details?.trust_bank_accounts?.map((e) => {
                  if (e.name)
                    return (
                      <tr>
                        <td>Trust Bank</td>
                        <td>{e.name}</td>
                      </tr>
                    );
                })}

                {setupDashboardAllData?.bank_account_details?.general_bank_accounts?.map((e) => {
                  if (e.name)
                    return (
                      <tr>
                        <td>General Bank</td>
                        <td>{e.name}</td>
                      </tr>
                    );
                })}

                {setupDashboardAllData?.bank_account_details?.credit_card_accounts?.map((e) => {
                  return e.name ? (
                    <tr>
                      <td>Credit Card</td>
                      <td>{e.name}</td>
                    </tr>
                  ) : null;
                })} */}

                {/* {setupDashboardAllData?.bank_account_details?.trust_bank_accounts?.length === 0 && (
                  <tr>
                    <td>No Bank Account Yet</td>
                    <td>No Bank Yet</td>
                  </tr>
                )} */}

              </tbody>
            </table>
          </div>


        </form>
      )}
    </>
  );
};

const PayRoll = ({ props }) => {
  let { setupDashboardAllData, setSetupDashboardAllData, handlSubmit, saveLoading, staticData, setStaticData } = props;

  const onChangeInput6 = (e) => {
    const name = e.target.name;
    const val = e.target.value;

    setSetupDashboardAllData((prev) => ({
      ...prev, payroll: {
        ...prev.payroll,
        [name]: val
      }
    }))
  };

  return (
    <>
      <GetCompanyDetails />
      {/* {staticData ? (
        <div className="d-flex gap-3" style={{
          position: "absolute", right: "42px", top: "96px"
        }}>
          <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <button class="btn btnPrimary ms-auto" type="submit" >
            {
              saveLoading ?
                <>
                  <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
                : <>"Save" <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

            }
          </button>
        </div>
      ) : (
        <button className="editBtn btn btnPrimary" onClick={() => setStaticData(true)} style={{
          position: "absolute", right: "42px", top: "96px"
        }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
        </button>

      )} */}
      {staticData ? (
        <form onSubmit={handlSubmit} className="mt-3">


          <div className="d-flex justify-content-end" style={{
            position: "absolute", right: "42px", top: "96px"
          }}>
            <div className="d-flex gap-3">
              <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
              </button>
              <button class="btn btnPrimary ms-auto" type="submit" >
                {
                  saveLoading ?
                    <>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                    : <>Save <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

                }
              </button></div>
          </div>

          <strong className="mb-4">Payroll</strong>
          <div className="row mt-3 d-flex align-items-center">
            <div className="col-md-4">
              <div className="form-group">
                <label>What is your payroll frequency?</label>
                <select
                  className="form-select"
                  onChange={(e) => {
                    if (e.target.value === "Other") {
                      setupDashboardAllData.payroll.payrollFrequency.push({
                        id: 5,
                        name: "Specify",
                      });


                      setSetupDashboardAllData((prev) => ({
                        ...prev, payroll: {
                          ...prev.payroll,

                          [e.target.name]: e.target.value,

                        }
                      }))


                    }
                    else {
                      if (

                        setupDashboardAllData.payroll?.payrollFrequency[
                          setupDashboardAllData?.payroll?.payrollFrequency?.length - 1
                        ].name === "Specify"

                      ) {

                        setupDashboardAllData.payroll.payrollFrequency.pop();


                      }
                    }

                    setSetupDashboardAllData((prev) => ({
                      ...prev, payroll: {
                        ...prev.payroll,
                        [e.target.name]: e.target.value,


                      }
                    }))

                  }}
                  name="payroll_frequen"
                  value={setupDashboardAllData?.payroll?.payroll_frequen}
                >
                  <option value="">Choose an option</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Do you pay work insurance for your employees?</label>
                <select
                  className="form-select"
                  onChange={(e) => {

                    setSetupDashboardAllData((prev) => ({
                      ...prev, payroll: {
                        ...prev.payroll,
                        [e.target.name]: e.target.value,
                      }
                    }))

                  }}
                  name="billing_frequency"
                  value={setupDashboardAllData?.payroll?.billing_frequency}

                >
                  <option value="">Choose an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>
                  Is a third-party provider engaged in your payroll related work?
                </label>
                <select
                  className="form-select"
                  onChange={(e) => {

                    setSetupDashboardAllData((prev) => ({
                      ...prev, payroll: {
                        ...prev.payroll,
                        [e.target.name]: e.target.value,
                      }
                    }))

                  }}
                  name="third_party"
                  value={setupDashboardAllData?.payroll?.third_party} >
                  <option value="">Choose an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              {/* <div className="row"> */}
              {/* <div className="col-md-6"> */}
              <div className="form-group">
                <label>How are payroll payments made?</label>
                <select
                  className="form-select"
                  onChange={(e) => {

                    setSetupDashboardAllData((prev) => ({
                      ...prev, payroll:
                      {

                        ...prev.payroll,
                        [e.target.name]: e.target.value,
                      }
                    }))

                  }}
                  value={setupDashboardAllData?.payroll?.direct_payment}
                  name="direct_payment"
                >
                  <option value="">Choose an option</option>
                  <option value="Direct Debit">Direct Debit</option>
                  <option value="Cheques">Cheques</option>
                </select>
              </div>
              {/* </div> */}
              {/* <div className="col-md-6">
                <div className="form-group">
                  <label>Number of Employees on Payroll</label>
                  <input
                    required
                    type="number"
                    className={`form-control ${setupDashboardAllData.payroll.numberOfEmployeesOnPayroll >= 0
                      ? ""
                      : "border_red"
                      }`}
                    min="0"
                    value={setupDashboardAllData.payroll.numberOfEmployeesOnPayroll}
                    onChange={onChangeInput6}
                    name="numberOfEmployeesOnPayroll"
                  />
                  {setupDashboardAllData.payroll.numberOfEmployeesOnPayroll < 0 && (
                    <span className="text-error text">
                      Please enter positive values
                    </span>
                  )}
                </div>
              </div> */}
              {/* </div> */}
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Number of Employees on Payroll</label>
                <input
                  required
                  type="number"
                  className={`form-control ${setupDashboardAllData.payroll.numberOfEmployeesOnPayroll >= 0
                    ? ""
                    : "border_red"
                    }`}
                  min="0"
                  value={setupDashboardAllData.payroll.numberOfEmployeesOnPayroll}
                  onChange={onChangeInput6}
                  name="numberOfEmployeesOnPayroll"
                />
                {setupDashboardAllData.payroll.numberOfEmployeesOnPayroll < 0 && (
                  <span className="text-error text">
                    Please enter positive values
                  </span>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Payroll Number</label>
                <input
                  className="form-control"
                  required
                  type="text"
                  value={setupDashboardAllData.firm_details.PayrollNumber}
                  onChange={(e) => {
                    setSetupDashboardAllData((prev) => ({
                      ...prev, firm_details: {
                        ...prev.firm_details,
                        PayrollNumber: e.target.value
                      }
                    }))

                  }}
                />
              </div>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handlSubmit} className="mt-3">
          <button className="editBtn btn btnPrimary ml-auto" onClick={() => setStaticData(true)} style={{
            position: "absolute", right: "42px", top: "96px"
          }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <strong className="mb-4">Payroll</strong>
          <div className="row mt-3 d-flex align-items-center">
            <div className="col-md-4">
              <div className="form-group">
                <label>What is your payroll frequency?</label>
                <span>{setupDashboardAllData?.payroll?.payroll_frequen}</span>
                {/* <select
                className="form-select"
                onChange={(e) => {
                  if (e.target.value === "Other") {
                    setupDashboardAllData.payroll.payrollFrequency.push({
                      id: 5,
                      name: "Specify",
                    });


                    setSetupDashboardAllData((prev) => ({
                      ...prev, payroll: {
                        ...prev.payroll,

                        [e.target.name]: e.target.value,

                      }
                    }))


                  }
                  else {
                    if (

                      setupDashboardAllData.payroll?.payrollFrequency[
                        setupDashboardAllData?.payroll?.payrollFrequency?.length - 1
                      ].name === "Specify"

                    ) {

                      setupDashboardAllData.payroll.payrollFrequency.pop();


                    }
                  }

                  setSetupDashboardAllData((prev) => ({
                    ...prev, payroll: {
                      ...prev.payroll,
                      [e.target.name]: e.target.value,


                    }
                  }))

                }}
                name="payroll_frequen"
                value={setupDashboardAllData?.payroll?.payroll_frequen}
              >
                <option value="">Choose an option</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Other">Other</option>
              </select> */}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Do you pay work insurance for your employees?</label>
                <span>{setupDashboardAllData?.payroll?.billing_frequency}</span>
                {/* <select
                className="form-select"
                onChange={(e) => {

                  setSetupDashboardAllData((prev) => ({
                    ...prev, payroll: {
                      ...prev.payroll,
                      [e.target.name]: e.target.value,
                    }
                  }))

                }}
                name="billing_frequency"
                value={setupDashboardAllData?.payroll?.billing_frequency}

              >
                <option value="">Choose an option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select> */}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>
                  Is a third-party provider engaged in your payroll related work?
                </label>
                <span>{setupDashboardAllData?.payroll?.third_party}</span>
                {/* <select
                className="form-select"
                onChange={(e) => {

                  setSetupDashboardAllData((prev) => ({
                    ...prev, payroll: {
                      ...prev.payroll,
                      [e.target.name]: e.target.value,
                    }
                  }))

                }}
                name="third_party"
                value={setupDashboardAllData?.payroll?.third_party} >
                <option value="">Choose an option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select> */}
              </div>
            </div>
            <div className="col-md-4">
              {/* <div className="row"> */}
              {/* <div className="col-md-6"> */}
              <div className="form-group">
                <label>How are payroll payments made?</label>
                <span>{setupDashboardAllData?.payroll?.direct_payment}</span>
                {/* <select
                className="form-select"
                onChange={(e) => {

                  setSetupDashboardAllData((prev) => ({
                    ...prev, payroll:
                    {

                      ...prev.payroll,
                      [e.target.name]: e.target.value,
                    }
                  }))

                }}
                value={setupDashboardAllData?.payroll?.direct_payment}
                name="direct_payment"
              >
                <option value="">Choose an option</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Cheques">Cheques</option>
              </select> */}
              </div>
              {/* </div> */}
              {/* <div className="col-md-6">
                <div className="form-group">
                  <label>Number of Employees on Payroll</label>
                  <input
                    required
                    type="number"
                    className={`form-control ${setupDashboardAllData.payroll.numberOfEmployeesOnPayroll >= 0
                      ? ""
                      : "border_red"
                      }`}
                    min="0"
                    value={setupDashboardAllData.payroll.numberOfEmployeesOnPayroll}
                    onChange={onChangeInput6}
                    name="numberOfEmployeesOnPayroll"
                  />
                  {setupDashboardAllData.payroll.numberOfEmployeesOnPayroll < 0 && (
                    <span className="text-error text">
                      Please enter positive values
                    </span>
                  )}
                </div>
              </div> */}
              {/* </div> */}
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Number of Employees on Payroll</label>
                <span>{setupDashboardAllData.payroll.numberOfEmployeesOnPayroll}</span>
                {/* <input
                required
                type="number"
                className={`form-control ${setupDashboardAllData.payroll.numberOfEmployeesOnPayroll >= 0
                  ? ""
                  : "border_red"
                  }`}
                min="0"
                value={setupDashboardAllData.payroll.numberOfEmployeesOnPayroll}
                onChange={onChangeInput6}
                name="numberOfEmployeesOnPayroll"
              /> */}
                {/* {setupDashboardAllData.payroll.numberOfEmployeesOnPayroll < 0 && (
                <span className="text-error text">
                  Please enter positive values
                </span>
              )} */}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Payroll Number</label>
                <span>{setupDashboardAllData.firm_details.PayrollNumber}</span>
                {/* <input
                className="form-control"
                required
                type="text"
                value={setupDashboardAllData.firm_details.PayrollNumber}
                onChange={(e) => {
                  setSetupDashboardAllData((prev) => ({
                    ...prev, firm_details: {
                      ...prev.firm_details,
                      PayrollNumber: e.target.value
                    }
                  }))

                }}
              /> */}
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
};

const Billing = ({ props }) => {
  const { setupDashboardAllData, setSetupDashboardAllData, handlSubmit, saveLoading, staticData, setStaticData } = props;

  // const [selectedValue, setSelectedValue] = useState([]);
  // const [showCalendar, setShowCalendar] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const billingFrequency = setupDashboardAllData?.billing_info?.billing_frequency;
    const specify_cutoff = {
      Daily: "1 day before billing frequency",
      Weekly: "2 days before billing frequency",
      Monthly: "25th of each month",
      "Semi-monthly": "13th and 25th of each month",
      Other: "2 days before billing cycle date"
    };

    const cutoffValue = specify_cutoff[billingFrequency] || "Not specified";

    // Update the state only if the cutoffValue changes
    if (setupDashboardAllData?.billing_info?.set_specify_cutoff !== cutoffValue) {
      setSetupDashboardAllData(prev => ({
        ...prev,
        billing_info: {
          ...prev.billing_info,
          set_specify_cutoff: cutoffValue,
        }
      }));
    }
  }, [setupDashboardAllData?.billing_info?.billing_frequency]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`/user/list/${getUserSID()}/${getUserId()}/all`);

        console.log("API Full Response:", response); // Debug full response

        const { data } = response;

        console.log("API Response Data:", data, data?.data.body); // Debug response data
        if (data?.data.code === 200 && data?.data.status === "success") {
          const allUsers = data?.data.body || [];

          // Ensure each user has 'username' and 'uid'
          const formattedUsers = allUsers
            .filter((user) => user.username && user.uid) // Ensure valid fields
            .map((user) => ({
              username: user.username,
              uid: user.uid,
              role: user.role,
              email: user.email,
            }));

          // Use a Set to remove duplicate usernames
          const uniqueUsers = Array.from(
            new Map(
              formattedUsers.map((user) => [user.username, user]) // Map keyed by username
            ).values()
          );

          console.log("Unique Users:", uniqueUsers);
          setUsers(uniqueUsers);
        } else {
          throw new Error(data?.status || "Failed to fetch users");
        }
      } catch (err) {
        console.error("Error fetching users:", err.message || err);
      }
    };

    fetchUsers();
  }, []);

  // Handle select and remove events
  const handleMultiselectChange = (selectedList, type) => {
    const keyMap = {
      notify_users: { field: "notify_users", data: selectedList },
      bill_approval: { field: "bill_approval", data: selectedList },
      bill_preparer: { field: "bill_preparer", data: selectedList },
      default: { field: "billing_cycle", data: { type: "Bi-weekly", data: selectedList } },
    };

    const updateKey = keyMap[type] || keyMap["default"];

    setSetupDashboardAllData((prev) => ({
      ...prev,
      billing_info: {
        ...prev.billing_info,
        [updateKey.field]: updateKey.data,
      },
    }));
  };

  // Handle cancel and reset form
  const handleCancel = () => {
    setSetupDashboardAllData((prev) => {
      const { billingCycle, billOptions, billingActivities, timeAndExpenseActivity, billingArrangement, billingFrequency, assigneeForBillsGeneration, serviceFeesCharged, disbursementFrequency, revenueCollection, vendorPayments, ...dynamicFields } = prev.billing_info;

      // Empty the dynamic fields while retaining other data
      const emptiedDynamicFields = Object.keys(dynamicFields).reduce((acc, key) => {
        acc[key] = ""; // Or null/[] based on the field's expected data type
        return acc;
      }, {});

      return {
        ...prev,
        billing_info: {
          ...prev.billing_info,
          ...emptiedDynamicFields, // Clear only the dynamic fields
        },
      };
    });
  };


  return (
    <>
      <GetCompanyDetails />
      {/* {staticData ? (
        <div className="d-flex gap-3" style={{
          position: "absolute", right: "42px", top: "96px"
        }}>
          <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <button class="btn btnPrimary ms-auto" type="submit" >
            {
              saveLoading ?
                <>
                  <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
                : <>"Save" <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

            }
          </button>
        </div>
      ) : (
        <button className="editBtn btn btnPrimary" onClick={() => setStaticData(true)} style={{
          position: "absolute", right: "42px", top: "96px"
        }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
        </button>

      )} */}

      {staticData ? (
        <form onSubmit={handlSubmit} className="mt-3">
          <div className="d-flex justify-content-end" style={{
            position: "absolute", right: "42px", top: "96px"
          }}>
            <div className="d-flex gap-3">
              <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
              </button>
              <button class="btn btnPrimary ms-auto" type="submit" >
                {
                  saveLoading ?
                    <>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                    : <>Save <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

                }
              </button>
            </div></div>
          <strong className="mb-4 heading">Billing set-up</strong>
          <div className="row mt-3">
            {/* Billing Frequency */}
            <div className="col-md-4">
              <div className="form-group">
                <label>What is your billing frequency?</label>
                {/* <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData((prev) => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        billing_frequency: e.target.value,
                        ...(["Daily", "Monthly", "Semi-monthly"].includes(e.target.value) && { billing_cycle: { type: e.target.value, data: "" } }),
                      },
                    }));

                  }}
                  name="billing_frequency"
                  value={setupDashboardAllData?.billing_info?.billing_frequency}
                >
                  <option value="Choose an option">Choose an option</option>
                  {setupDashboardAllData?.billing_info?.billingFrequency?.map((e, index) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select> */}

                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.billingFrequency?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData((prev) => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        billing_frequency: e.value,
                        ...(["Daily", "Monthly", "Semi-monthly"].includes(e.value) && { billing_cycle: { type: e.value, data: "" } }),
                      },
                    }));
                  }}
                  value={{
                    label: setupDashboardAllData?.billing_info?.billing_frequency || "Choose an option",
                    value: setupDashboardAllData?.billing_info?.billing_frequency || "Choose an option",
                  }}
                  placeholder="Choose an option"
                />

              </div>
            </div>

            {/* Billing Cycle */}
            {!["Daily", "Monthly", "Semi-monthly"].includes(setupDashboardAllData?.billing_info?.billing_frequency)
              && (
                <div className="col-md-4 multi-select-options highlighted-area">
                  <div className="form-group">
                    <label>Which day does the billing cycle start?</label>
                    {setupDashboardAllData?.billing_info?.billing_frequency === "Bi-weekly" ? (
                      <>
                        {/* Debugging log */}
                        {console.log('Billing Cycle Data:', setupDashboardAllData?.billing_info?.billingCycle)}
                        <Multiselect
                          options={
                            setupDashboardAllData?.billing_info?.billingCycle?.[0]?.[
                            setupDashboardAllData?.billing_info?.billing_frequency
                            ] || []
                          }
                          selectedValues={
                            setupDashboardAllData?.billing_info?.billing_cycle?.type === "Bi-weekly"
                              ? setupDashboardAllData?.billing_info?.billing_cycle?.data || []
                              : []
                          }
                          onSelect={(selectedList) => {
                            if (selectedList.length > 1) {
                              // Restrict to only one item
                              selectedList = [selectedList[selectedList.length - 1]]; // Keep only the last selected item
                            }
                            handleMultiselectChange(selectedList, "billing_cycle")
                          }}
                          onRemove={(selectedList) => handleMultiselectChange(selectedList, "billing_cycle")}
                          displayValue="name"
                          placeholder="Select weeks (Bi-weekly)"
                        />
                      </>
                    ) : setupDashboardAllData?.billing_info?.billing_frequency === "Other" ? (
                      <div>
                        {/* Read-only input displaying the selected date */}
                        {/* <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={
                            setupDashboardAllData?.billing_info?.billing_cycle?.type === "Other" &&
                              setupDashboardAllData?.billing_info?.billing_cycle?.data
                              ? new Date(setupDashboardAllData.billing_info.billing_cycle.data).toLocaleDateString() // Format date for display
                              : ""
                          }
                          onClick={() => setShowCalendar(true)} // Open date input when clicked
                          placeholder="Click to select a date"
                        /> */}

                        {/* Conditional rendering of date input */}
                        {/* {showCalendar && ( */}
                        <div style={{ marginTop: '8px' }}>
                          <input
                            type="date"
                            className="form-control"
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              setSetupDashboardAllData((prev) => ({
                                ...prev,
                                billing_info: {
                                  ...prev.billing_info,
                                  billing_cycle: { type: "Other", data: selectedDate },
                                },
                              }));
                              // setShowCalendar(false); // Hide calendar after date is selected
                            }}
                            value={
                              setupDashboardAllData?.billing_info?.billing_cycle?.type === "Other" &&
                                setupDashboardAllData?.billing_info?.billing_cycle?.data
                                ? new Date(setupDashboardAllData.billing_info.billing_cycle.data)
                                  .toISOString()
                                  .split("T")[0] // Format date for input
                                : ""
                            }
                          />
                        </div>
                        {/* )} */}
                      </div>

                    ) : (
                      // <select
                      //   className="form-select"
                      //   onChange={(e) => {
                      //     setSetupDashboardAllData((prev) => ({
                      //       ...prev,
                      //       billing_info: {
                      //         ...prev.billing_info,
                      //         billing_cycle: {
                      //           type: setupDashboardAllData?.billing_info?.billing_frequency,
                      //           data: e.target.value
                      //         },
                      //       },
                      //     }));
                      //   }}
                      //   name="billing_cycle"
                      //   value={
                      //     setupDashboardAllData?.billing_info?.billing_cycle?.type ===
                      //       setupDashboardAllData?.billing_info?.billing_frequency
                      //       ? setupDashboardAllData?.billing_info?.billing_cycle?.data
                      //       : "Choose an option"
                      //   }
                      // >
                      //   <option value="Choose an option" disabled>
                      //     Select a day
                      //   </option>
                      //   {setupDashboardAllData?.billing_info?.billingCycle?.[0]?.[
                      //     setupDashboardAllData?.billing_info?.billing_frequency
                      //   ]?.map((e) => (
                      //     <option key={e.id} value={e.name}>
                      //       {e.name}
                      //     </option>
                      //   ))}
                      // </select>
                      <Dropdown
                        options={
                          setupDashboardAllData?.billing_info?.billingCycle?.[0]?.[
                            setupDashboardAllData?.billing_info?.billing_frequency
                          ]?.map((item) => ({
                            label: item.name,
                            value: item.name,
                          })) || []
                        }
                        onChange={(e) => {
                          setSetupDashboardAllData((prev) => ({
                            ...prev,
                            billing_info: {
                              ...prev.billing_info,
                              billing_cycle: {
                                type: setupDashboardAllData?.billing_info?.billing_frequency,
                                data: e.value,
                              },
                            },
                          }));
                        }}
                        value={
                          setupDashboardAllData?.billing_info?.billing_cycle?.type ===
                            setupDashboardAllData?.billing_info?.billing_frequency
                            ? {
                              label: setupDashboardAllData?.billing_info?.billing_cycle?.data || "Select a day",
                              value: setupDashboardAllData?.billing_info?.billing_cycle?.data || "Select a day",
                            }
                            : { label: "Select a day", value: "Select a day" }
                        }
                        placeholder="Select a day"
                      />

                    )}

                  </div>
                </div>

              )}

            {/* Assignee for Bill Generation */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Select Preparer for generating bills on Clio</label>
                {/* <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        assignee_For_Bills_Generation: e.target.value,
                      }
                    }));
                  }}
                  name="assignee_For_Bills_Generation"
                  value={setupDashboardAllData?.billing_info?.assignee_For_Bills_Generation}
                >
                  <option value="Choose an option">Choose an option</option>
                  {setupDashboardAllData?.billing_info?.assigneeForBillsGeneration?.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select> */}
                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.assigneeForBillsGeneration?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        assignee_For_Bills_Generation: e.value,
                      }
                    }));
                  }}
                  value={{
                    label: setupDashboardAllData?.billing_info?.assignee_For_Bills_Generation || "Choose an option",
                    value: setupDashboardAllData?.billing_info?.assignee_For_Bills_Generation || "Choose an option"
                  }}
                  placeholder="Choose an option"
                />

              </div>
            </div>

            {/* Preparer for Bill Generation */}
            {setupDashboardAllData?.billing_info?.assignee_For_Bills_Generation && (
              <div className="col-md-4 multi-select-options highlighted-area">
                <div className="form-group">
                  <label>Select user to prepare bills on Clio</label>

                  <Multiselect
                    className="multi-select-option"
                    options={
                      setupDashboardAllData.billing_info.assignee_For_Bills_Generation === "CloudAct"
                        ? users.filter(
                          user =>
                            (user.role === "ADMIN" || user.role === "PREPARER") &&
                            /@(cloudforlawfirms\.com\.ca|cloudforlawfirms\.com\.ai|cloudforlawfirms\.com|cloudact\.ca)$/i.test(user.email) // Include only specific domains
                        )

                        : users.filter(
                          user =>
                            !/@(cloudforlawfirms\.com\.ca|cloudforlawfirms\.com\.ai|cloudforlawfirms\.com|cloudact\.ca)$/i.test(user.email) // Exclude specified domains
                        )
                    }

                    selectedValues={setupDashboardAllData?.billing_info?.bill_preparer || []}
                    onSelect={(selectedList) => {
                      if (selectedList.length > 1) {
                        // Restrict to only one item
                        selectedList = [selectedList[selectedList.length - 1]]; // Keep only the last selected item
                      }
                      handleMultiselectChange(selectedList, "bill_preparer")
                    }}
                    onRemove={(selectedList) => handleMultiselectChange(selectedList, "bill_preparer")}
                    displayValue="username"
                    placeholder="Choose an option"
                  />
                </div>
              </div>
            )}

            {/* Notifications for Bill Cards */}
            <div className="col-md-4 multi-select-options highlighted-area">
              <div className="form-group ">
                <label>Select bill card notifications</label>

                <Multiselect
                  options={users}
                  selectedValues={
                    setupDashboardAllData?.billing_info?.notify_users || []
                  }
                  onSelect={(selectedList) => handleMultiselectChange(selectedList, "notify_users")}
                  onRemove={(selectedList) => handleMultiselectChange(selectedList, "notify_users")}
                  displayValue="username"
                  placeholder="Choose an option"
                />
              </div>
            </div>

            {/* Specify Cut-Off Days */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Specify billing cut-off day/date</label>
                <input
                  className="form-control"
                  readOnly
                  type="text"
                  name="set_specify_cutoff"
                  value={setupDashboardAllData?.billing_info?.set_specify_cutoff || "Not specified"}
                />
              </div>
            </div>

          </div>


          <strong className="mb-4 heading mt-4">Bill generation options on Clio</strong>
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="form-group">
                <label>Select the level of detail for billing activities (time and expenses)</label>
                {/* <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        billing_activities: e.target.value,
                      }
                    }));
                  }}
                  name="billing_activities"
                  value={setupDashboardAllData?.billing_info?.billing_activities}
                >
                  <option value="Choose an option">Choose an option</option>
                  {setupDashboardAllData?.billing_info?.billingActivities?.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select> */}
                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.billingActivities?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        billing_activities: e.value,
                      }
                    }));
                  }}
                  value={{
                    label: setupDashboardAllData?.billing_info?.billing_activities || "Choose an option",
                    value: setupDashboardAllData?.billing_info?.billing_activities || "Choose an option"
                  }}
                  placeholder="Choose an option"
                />

              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Select the activities (time and expense activities) to be included on bills </label>
                {/* <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        time_and_expense_activity: e.target.value,
                      }
                    }));
                  }}
                  name="time_and_expense_activity"
                  value={setupDashboardAllData?.billing_info?.time_and_expense_activity}
                >
                  <option value="Choose an option">Choose an option</option>
                  {setupDashboardAllData?.billing_info?.timeAndExpenseActivity?.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select> */}
                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.timeAndExpenseActivity?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        time_and_expense_activity: e.value,
                      }
                    }));
                  }}

                  value={
                    setupDashboardAllData?.billing_info?.time_and_expense_activity
                      ? {
                        label: setupDashboardAllData?.billing_info?.time_and_expense_activity,
                        value: setupDashboardAllData?.billing_info?.time_and_expense_activity,
                      }
                      : null // set value to null if no value is selected
                  }
                  placeholder="Choose an option"
                />


              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>If a client has multiple matters, are they combined into one bill</label>
                {/* <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        client_multiple_matters: e.target.value,
                      }
                    }));
                  }}
                  name="client_multiple_matters"
                  value={setupDashboardAllData?.billing_info?.client_multiple_matters}
                >
                  <option value="Choose an option">Choose an option</option>
                  {setupDashboardAllData?.billing_info?.billOptions?.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select> */}
                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.billOptions?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        client_multiple_matters: e.value,
                      }
                    }));
                  }}
                  placeholder="Choose an option"
                  value={{
                    label: setupDashboardAllData?.billing_info?.client_multiple_matters || "Choose an option",
                    value: setupDashboardAllData?.billing_info?.client_multiple_matters || "Choose an option"
                  }}

                />

              </div>
            </div>


            <div className="col-md-4 multi-select-options highlighted-area">
              <div className="form-group">
                <label>Select Approver to approve bills on Clio</label>
                <Multiselect
                  options={
                    users.filter(
                      user =>
                        (user.role === "ADMIN" || user.role === "REVIEWER") &&
                        !/@(cloudforlawfirms\.com\.ca|cloudforlawfirms\.com\.ai|cloudforlawfirms\.com|cloudact\.ca)$/i.test(user.email)
                    )
                  }

                  selectedValues={
                    setupDashboardAllData?.billing_info?.bill_approval || []
                  }
                  onSelect={(selectedList) => {
                    if (selectedList.length > 1) {
                      // Restrict to only one item
                      selectedList = [selectedList[selectedList.length - 1]]; // Keep only the last selected item
                    } handleMultiselectChange(selectedList, "bill_approval")
                  }}
                  onRemove={(selectedList) => handleMultiselectChange(selectedList, "bill_approval")}
                  displayValue="username"
                  placeholder="Choose an option"
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Is tax charged on soft costs</label>
                {/* <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        tax_charged_soft: e.target.value,
                      }
                    }));
                  }}
                  name="tax_charged_soft"
                  value={setupDashboardAllData?.billing_info?.tax_charged_soft}
                >
                  <option value="Choose an option">Choose an option</option>
                  {setupDashboardAllData?.billing_info?.billOptions?.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select> */}
                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.billOptions?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        tax_charged_soft: e.value,
                      }
                    }));
                  }}
                  value={{
                    label: setupDashboardAllData?.billing_info?.tax_charged_soft || "Choose an option",
                    value: setupDashboardAllData?.billing_info?.tax_charged_soft || "Choose an option"
                  }}
                  placeholder="Choose an option"
                />

              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Is tax charged on hard costs</label>
                {/* <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        tax_charged_hard: e.target.value,
                      }
                    }));
                  }}
                  name="tax_charged_hard"
                  value={setupDashboardAllData?.billing_info?.tax_charged_hard}
                >
                  <option value="Choose an option">Choose an option</option>
                  {setupDashboardAllData?.billing_info?.billOptions?.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select> */}
                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.billOptions?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData(prev => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        tax_charged_hard: e.value,
                      }
                    }));
                  }}
                  value={{
                    label: setupDashboardAllData?.billing_info?.tax_charged_hard || "Choose an option",
                    value: setupDashboardAllData?.billing_info?.tax_charged_hard || "Choose an option"
                  }}
                  placeholder="Choose an option"
                />

              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Is there a separate matter for billing consultation fees</label>
                <Dropdown
                  options={
                    setupDashboardAllData?.billing_info?.billOptions?.map((item) => ({
                      label: item.name,
                      value: item.name,
                    })) || []
                  }
                  onChange={(e) => {
                    setSetupDashboardAllData((prev) => ({
                      ...prev,
                      billing_info: {
                        ...prev.billing_info,
                        seperate_matter: e.value,
                      },
                    }));
                  }}
                  value={{
                    label: setupDashboardAllData?.billing_info?.seperate_matter || "Choose an option",
                    value: setupDashboardAllData?.billing_info?.seperate_matter || "Choose an option",
                  }}
                  placeholder="Choose an option"
                />
              </div>
            </div>

            {setupDashboardAllData?.billing_info?.seperate_matter === "Yes" && (
              <div className="col-md-4">
                <div className="form-group">
                  {/* Conditionally render input field if "Yes" is selected */}

                  <div className="form-group ">
                    <label>Please confirm the Matter number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter your Matter number"
                      value={setupDashboardAllData?.billing_info?.matter_number || ""}
                      onChange={(e) => {
                        setSetupDashboardAllData((prev) => ({
                          ...prev,
                          billing_info: {
                            ...prev.billing_info,
                            matter_number: e.target.value,
                          },
                        }));
                      }}
                    />
                  </div>

                </div>
              </div>
            )}



          </div>
        </form>
      ) : (
        <form onSubmit={handlSubmit} className="mt-3">
          <button className="editBtn btn btnPrimary ml-auto" onClick={() => setStaticData(true)} style={{
            position: "absolute", right: "42px", top: "96px"
          }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <strong className="mb-4 heading">Billing set-up</strong>
          <div className="row mt-3">
            {/* Billing Frequency */}
            <div className="col-md-4">
              <div className="form-group">
                <label>What is your billing frequency?</label>
                <span>{setupDashboardAllData?.billing_info?.billing_frequency}</span>
              </div>
            </div>

            {/* Billing Cycle */}
            {!["Daily", "Monthly", "Semi-monthly"].includes(setupDashboardAllData?.billing_info?.billing_frequency)
              && (
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Which day does the billing cycle start?</label>
                    <span>
                      {setupDashboardAllData?.billing_info?.billing_cycle?.type === "Other" &&
                        setupDashboardAllData?.billing_info?.billing_cycle?.data
                        ? isNaN(new Date(setupDashboardAllData.billing_info.billing_cycle.data))
                          ? "Invalid Date"
                          : new Date(setupDashboardAllData.billing_info.billing_cycle.data).toLocaleDateString()
                        : setupDashboardAllData?.billing_info?.billing_cycle?.data || "No data available"}
                    </span>
                  </div>
                </div>
              )}

            {/* Assignee for Bill Generation */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Select Preparer for generating bills on Clio</label>
                <span>{setupDashboardAllData?.billing_info?.assignee_For_Bills_Generation}</span>
              </div>
            </div>

            {/* Preparer for Bill Generation */}
            {setupDashboardAllData?.billing_info?.assignee_For_Bills_Generation && (
              <div className="col-md-4">
                <div className="form-group">
                  <label>Select user to prepare bills on Clio</label>
                  <span>{setupDashboardAllData?.billing_info?.bill_preparer?.map(user => user.username).join(', ')}</span>
                </div>
              </div>
            )}

            {/* Notifications for Bill Cards */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Select bill card notifications</label>
                <span>{setupDashboardAllData?.billing_info?.notify_users &&
                  setupDashboardAllData.billing_info.notify_users.length > 0
                  ? setupDashboardAllData.billing_info.notify_users
                    .map(user => user.username)
                    .join(', ')
                  : ''}</span>
              </div>
            </div>

            {/* Specify Cut-Off Days */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Specify billing cut-off day/date</label>
                <span>{setupDashboardAllData?.billing_info?.set_specify_cutoff || "Not specified"}</span>
              </div>
            </div>
          </div>


          <strong className="mb-4 heading mt-4">Bill generation options on Clio</strong>
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="form-group">
                <label>Select the level of detail for billing activities (time and expenses)</label>
                <span>{setupDashboardAllData?.billing_info?.billing_activities}</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Select the activities (time and expense activities) to be included on bills </label>
                <span>{setupDashboardAllData?.billing_info?.time_and_expense_activity}</span>
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>If a client has multiple matters, are they combined into one bill</label>
                <span>{setupDashboardAllData?.billing_info?.client_multiple_matters}</span>
              </div>
            </div>


            <div className="col-md-4">
              <div className="form-group">
                <label>Select Approver to approve bills on Clio</label>
                <span>
                  {setupDashboardAllData?.billing_info?.bill_approval &&
                    setupDashboardAllData.billing_info.bill_approval.length > 0
                    ? setupDashboardAllData.billing_info.bill_approval
                      .map(user => user.username)
                      .join(', ')
                    : ''}
                </span>
              </div>

            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Is tax charged on soft costs</label>
                <span>{setupDashboardAllData?.billing_info?.tax_charged_soft}</span>
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Is tax charged on hard costs</label>
                <span>{setupDashboardAllData?.billing_info?.tax_charged_hard}</span>
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Is there a separate matter for billing consultation fees</label>
                <span>{setupDashboardAllData?.billing_info?.seperate_matter}</span>
              </div>
            </div>


            {setupDashboardAllData?.billing_info?.seperate_matter == "Yes" && (
              <div className="col-md-4">
                <div className="form-group">
                  <label>Please confirm the Matter number</label>
                  <span>{setupDashboardAllData?.billing_info?.matter_number}</span>
                </div>
              </div>
            )}


          </div>
        </form>
      )}
    </>
  );
};


// const Invoicing = ({ props }) => {


//   let { setupDashboardAllData, setSetupDashboardAllData, handlSubmit, saveLoading } = props;


//   return (
//     <>
//       <GetCompanyDetails />
//       <form onSubmit={handlSubmit} className="mt-3">
//         <strong className="mb-4">Invoicing</strong>
//         <div className="row mt-3">
//           <div className="col-md-6">
//             <div className="form-group">
//               <label>What is your billing arrangement?</label>
//               <select
//                 className="form-select"
//                 onChange={(e) => {
//                   if (e.target.value === "Other") {
//                     setupDashboardAllData?.billing_info?.billingArrangement.push({
//                       name: "Specify",
//                       id: 7,
//                     });

//                     setSetupDashboardAllData((prev) => ({
//                       ...prev,
//                       billing_info: {
//                         ...prev.billing_info,
//                       }
//                     }))


//                   }
//                   else {
//                     if (
//                       setupDashboardAllData.billing_info.billingArrangement[
//                         setupDashboardAllData.billing_info?.billingArrangement?.length - 1
//                       ].name === "Specify"
//                     ) {
//                       setupDashboardAllData?.billing_info?.billingArrangement?.pop();
//                       setSetupDashboardAllData((prev) => ({
//                         ...prev,
//                         billing_info: {
//                           ...prev.billing_info,
//                         }
//                       }))


//                     }
//                   }

//                   setSetupDashboardAllData((prev) => ({
//                     ...prev,
//                     billing_info: {
//                       ...prev.billing_info,
//                       [e.target.name]: e.target.value,
//                     }
//                   }))


//                 }}
//                 name="billing_arrangement"
//                 value={setupDashboardAllData?.billing_info?.billing_arrangement}
//               >
//                 <option value="Choose an option">Choose an option</option>
//                 {setupDashboardAllData?.billing_info?.billingArrangement?.map((e, index) => {
//                   return (
//                     <option key={e.id} value={e.name}>
//                       {e.name}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </div>

//           <div className="col-md-6">
//             <div className="form-group">
//               <label>What is your billing frequency?</label>
//               <select
//                 className="form-select"
//                 onChange={(e) => {
//                   if (e.target.value === "Other") {
//                     setupDashboardAllData.billing_info.billingFrequency.push({
//                       name: "Specify",
//                       id: 8,
//                     });

//                     setSetupDashboardAllData((prev) => ({
//                       ...prev,
//                       billing_info: {
//                         ...prev.billing_info,
//                         newHeight: prev.billing_info.newHeight + 20
//                       }
//                     }));



//                   } else {
//                     if (
//                       setupDashboardAllData?.billing_info?.billingFrequency[
//                         setupDashboardAllData?.billing_info?.billingFrequency?.length - 1
//                       ].name === "Specify"
//                     ) {
//                       setupDashboardAllData.billing_info.billingFrequency.pop();

//                       setSetupDashboardAllData((prev) => ({
//                         ...prev,
//                         billing_info: {
//                           ...prev.billing_info,
//                           newHeight: prev.billing_info.newHeight - 20
//                         }
//                       }));
//                     }
//                   }


//                   setSetupDashboardAllData((prev) => ({
//                     ...prev,
//                     billing_info: {
//                       ...prev.billing_info,

//                       [e.target.name]: e.target.value,
//                     }
//                   }))

//                 }}
//                 name="billing_frequency"
//                 value={setupDashboardAllData?.billing_info?.billing_frequency}
//               >
//                 <option value="Choose an option">Choose an option</option>
//                 {setupDashboardAllData?.billing_info?.billingArrangement?.map((e, index) => {
//                   return (
//                     <option key={e.id} value={e.name}>
//                       {e.name}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </div>

//           <div className="col-md-6">
//             <div className="form-group">
//               <label>Which application is used for for vendor payments?</label>
//               <select
//                 className="form-select"
//                 onChange={(e) => {
//                   if (e.target.value === "Other") {
//                     setupDashboardAllData.billing_info.vendorPayments.push({
//                       id: 5,
//                       name: "Specify",
//                     });

//                     setSetupDashboardAllData((prev) => ({
//                       ...prev,
//                       billing_info: {
//                         ...prev.billing_info,
//                         newHeight: prev.billing_info.newHeight + 20
//                       }
//                     }));

//                   } else {
//                     if (
//                       setupDashboardAllData?.billing_info?.vendorPayments[
//                         setupDashboardAllData?.billing_info.vendorPayments?.length - 1
//                       ].name === "Specify"
//                     ) {
//                       setupDashboardAllData.billing_info.vendorPayments.pop();

//                       setSetupDashboardAllData((prev) => ({
//                         ...prev,
//                         billing_info: {
//                           ...prev.billing_info,
//                           vendorPayments: [...prev.billing_info.vendorPayments]
//                         }
//                       }));

//                     }
//                   }

//                   setSetupDashboardAllData((prev) => ({
//                     ...prev, billing_info: {
//                       ...prev.billing_info,
//                       [e.target.name]: e.target.value,

//                     }
//                   }));

//                 }}
//                 name="vendor_payment"
//                 value={setupDashboardAllData?.billing_info?.vendor_payment}

//               >
//                 <option value="Choose an option">Choose an option</option>
//                 {setupDashboardAllData?.billing_info?.vendorPayments?.map((e, index) => {
//                   return (
//                     <option key={e.id} value={e.name}>
//                       {e.name}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </div>

//           <div className="col-md-6">
//             <div className="form-group">
//               <label>Which application is used for revenue collection?</label>
//               <select
//                 className="form-select"
//                 onChange={(e) => {
//                   if (e.target.value === "Other") {
//                     setupDashboardAllData.billing_info.revenueCollection.push({
//                       id: 5,
//                       name: "Specify",
//                     });


//                     setSetupDashboardAllData((prev) => ({
//                       ...prev,
//                       billing_info: {
//                         ...prev.billing_info,
//                         newHeight: prev.billing_info.newHeight + 20
//                       }
//                     }));

//                   } else {
//                     if (
//                       setupDashboardAllData?.billing_info?.revenueCollection[
//                         setupDashboardAllData?.billing_info?.revenueCollection?.length - 1
//                       ].name === "Specify"
//                     ) {
//                       setupDashboardAllData.billing_info.revenueCollection.pop();
//                       setupDashboardAllData.billing_info.newHeight = setupDashboardAllData.billing_info.newHeight - 20;

//                       setSetupDashboardAllData((prev) => ({
//                         ...prev,
//                         billing_info: {
//                           ...prev.billing_info,
//                           newHeight: prev.billing_info.newHeight - 20,
//                           revenueCollection: [...prev.billing_info.revenueCollection]
//                         }
//                       }));

//                     }
//                   }


//                   setSetupDashboardAllData((prev) => ({
//                     ...prev,
//                     billing_info: {
//                       ...prev.billing_info,
//                       [e.target.name]: e.target.value
//                     }
//                   }));

//                 }}
//                 name="revenue_collection"
//                 value={setupDashboardAllData?.billing_info?.revenue_collection}

//               >
//                 <option value="Choose an option">Choose an option</option>
//                 {setupDashboardAllData?.billing_info?.revenueCollection?.map((e, index) => {
//                   return (
//                     <option key={e.id} value={e.name}>
//                       {e.name}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </div>

//           <div className="col-md-12">
//             <div className="form-group">
//               <label>What is the frequency for disbursement recovery?</label>
//               <select
//                 className="form-select"
//                 onChange={(e) => {
//                   if (e.target.value === "Other") {
//                     setupDashboardAllData.billing_info.disbursementFrequency.push({
//                       name: "Specify",
//                       id: 8,
//                     });

//                     setSetupDashboardAllData((prev) => ({
//                       ...prev,
//                       billing_info: {
//                         ...prev.billing_info,
//                         newHeight: prev.billing_info.newHeight + 20
//                       }
//                     }));

//                   } else {
//                     if (
//                       setupDashboardAllData?.billing_info?.disbursementFrequency[
//                         setupDashboardAllData?.billing_info?.disbursementFrequency?.length - 1
//                       ].name === "Specify"
//                     ) {
//                       setupDashboardAllData.billing_info.disbursementFrequency.pop();

//                       setSetupDashboardAllData((prev) => ({
//                         ...prev,
//                         billing_info: {
//                           ...prev.billing_info,
//                           newHeight: prev.billing_info.newHeight - 20,
//                           revenueCollection: [...prev.billing_info.revenueCollection]
//                         }
//                       }));

//                     }
//                   }


//                   setSetupDashboardAllData((prev) => ({
//                     ...prev,
//                     billing_info: {
//                       ...prev.billing_info,
//                       [e.target.name]: e.target.value
//                     }
//                   }));

//                 }}
//                 name="disbursement_frequency"
//                 value={setupDashboardAllData?.billing_info?.disbursement_frequency}

//               >
//                 <option value="Choose an option">Choose an option</option>
//                 {setupDashboardAllData?.billing_info?.disbursementFrequency?.map((e, index) => {
//                   return (
//                     <option key={e.id} value={e.name}>
//                       {e.name}
//                     </option>
//                   );
//                 })}
//               </select>
//             </div>
//           </div>
//         </div>

//         <div className="btnGroup">
//           <button class="btn btnPrimary ms-auto" type="submit" >
//             {
//               saveLoading ?
//                 <>
//                   <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
//                   Saving...
//                 </>

//                 : "Save"
//             }

//           </button>
//         </div>
//       </form>
//     </>
//   );
// };

const OtherDetails = ({ props }) => {

  let { setCompanyInfoAll, setupDashboardAllData, setSetupDashboardAllData, handlSubmit, saveLoading, CompanyInfoAll, staticData, setStaticData } = props;


  console.log('CompanyInfoAll', CompanyInfoAll.auto_archive_checklist, CompanyInfoAll.auto_archive_duration)

  const [form7Data, setForm7Data] = useState({
    month_QBO: "",
    formCompleted: false,
  });

  let fileUploadForm = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      axios
        .get(`/client/details/${getUserSID()}`)
        .then((res) => {
          const parsingData7 = JSON.parse(res.data.data.body.other_details);
          setForm7Data({ ...form7Data, ...parsingData7 });

          setSetupDashboardAllData((prev) => ({
            ...prev,
            other_details: parsingData7
          }))


        })
        .catch((err) => {
          setForm7Data({ ...form7Data });
          console.log("err", err);
        });
    };

    fetchData();
  }, []);

  const onChangeInput7 = (e) => {
    const name = e.target.name;
    const val = e.target.value;

    setSetupDashboardAllData((prev) => ({
      ...prev,
      other_details: {
        ...prev.other_details,
        [name]: val
      }
    }))

  };



  return (
    <>
      <GetCompanyDetails />
      {/* {staticData ? (
        <div className="d-flex gap-3" style={{
          position: "absolute", right: "42px", top: "96px"
        }}>
          <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <button class="btn btnPrimary ms-auto" type="submit" >
            {
              saveLoading ?
                <>
                  <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
                : <>"Save" <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

            }
          </button>
        </div>
      ) : (
        <button className="editBtn btn btnPrimary" onClick={() => setStaticData(true)} style={{
          position: "absolute", right: "42px", top: "96px"
        }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
        </button>
      )} */}
      {staticData ? (
        <form
          onSubmit={handlSubmit}
          className="mt-3"
          enctype="multipart/form-data"
          ref={(divElem) => {
            fileUploadForm = divElem;
          }}
        >
          <div className="d-flex justify-content-end" style={{
            position: "absolute", right: "42px", top: "96px"
          }}>
            <div className="d-flex gap-3">
              <button className="editBtn btn dismissBtn" onClick={() => setStaticData(false)}>Cancel <RxCross2 size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
              </button>
              <button class="btn btnPrimary ms-auto" type="submit" >
                {
                  saveLoading ?
                    <>
                      <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                    : <>Save <FaCheck size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} /></>

                }
              </button>
            </div>
          </div>

          <strong className="mb-4">Other Details</strong>
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="form-group">
                <label>Do you want to receive news from CloudAct?</label>
                <select
                  className="form-select"
                  value={setupDashboardAllData?.other_details?.revenue_collection}
                  onChange={(e) => {

                    setSetupDashboardAllData((prev) => ({
                      ...prev,
                      other_details: {
                        ...prev.other_details,
                        [e.target.name]: e.target.value,
                      }
                    }))

                  }}
                  name="revenue_collection"
                >
                  <option value="">Choose an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Your Preferred Date Format</label>
                <select
                  className="form-select"
                  onChange={(e) => {
                    setSetupDashboardAllData((prev) => ({
                      ...prev,
                      other_details: {
                        ...prev.other_details,
                        [e.target.name]: e.target.value,
                      }
                    }))

                  }}
                  name="preferred_date"
                  value={setupDashboardAllData?.other_details?.preferred_date}

                >
                  <option value="">Choose an option</option>
                  <option value="Canadian (mm/dd/yyyy)">
                    Canadian (mm/dd/yyyy)
                  </option>
                  <option value="USA (mm/dd/yyyy)">USA (mm/dd/yyyy)</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>How long have you been using Quickbooks?</label>
                <input
                  required
                  type="date"
                  name="month_QBO"
                  id=""
                  value={setupDashboardAllData.other_details.month_QBO}
                  onChange={onChangeInput7}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>How long have you been using Clio?</label>
                <input
                  className="form-control"
                  required
                  type="date"
                  name="month_clio"
                  id=""
                  value={setupDashboardAllData.other_details.month_clio}
                  onChange={onChangeInput7}
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>How are your back-ups being maintained?</label>
                <input
                  className="form-control"
                  required
                  type="text"
                  placeholder="eg: local drive, sharepoint"
                  value={setupDashboardAllData.other_details.localDriveSharePoint}
                  name="localDriveSharePoint"
                  onChange={onChangeInput7}
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Set-up automatic monthly task</label>
                <div >
                  <select
                    onChange={(e) => {
                      setSetupDashboardAllData((prev) => ({
                        ...prev,
                        two_factor_task: e.target.value
                      }))

                      setCompanyInfoAll((prev) => ({
                        ...prev,
                        isActive: e.target.value
                      }))
                    }
                    }

                    value={CompanyInfoAll?.isActive}
                    className="form-select" name="two_factor_task" >
                    <option value="">Choose an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>

                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Set-up automatic archive</label>
                <div
                  onChange={(e) => {
                    setCompanyInfoAll((prev) => ({
                      ...prev,
                      auto_archive_checklist: e.target.value
                    }))
                  }}

                >
                  <select
                    value={CompanyInfoAll.auto_archive_checklist}
                    className="form-select" name="two_factor_task" >
                    <option value="">Choose an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>

                </div>
              </div>
            </div>


            {
              CompanyInfoAll.auto_archive_checklist === "Yes" &&
              <div className="col-md-4">
                <div className="form-group">
                  <label>Automated Archive checklist after days?</label>
                  <div

                    onChange={(e) => {
                      setCompanyInfoAll((prev) => ({
                        ...prev,
                        'auto_archive_duration': e.target.value
                      }))
                    }}

                  >

                    <select
                      value={CompanyInfoAll.auto_archive_duration}
                      className="form-select" name="two_factor_task" >
                      <option value="">Choose an option</option>
                      {
                        Array.from({ length: 30 }, (_, index) => (
                          <option key={index + 1} value={index + 1}>
                            {index + 1}
                          </option>
                        ))
                      }
                    </select>

                    {/* <input
                    className="form-control"
                    required
                    type="text"
                    name="archive_checklist"
                    id=""
                    onChange={(e) => setCompanyInfoAll((prev) => ({
                      ...prev,
                      'auto_archive_duration': e.target.value
                    }))}

                    value={CompanyInfoAll.auto_archive_duration}

                  /> */}

                  </div>
                </div>
              </div>
            }



            <div className="col-md-4">
              <div className="form-group">
                <label>Select number of days for due date settings for Preparer</label>


                <div >
                  {/* <input
                  className="form-control"
                  required
                  type="text"
                  name="archive_checklist"
                  id=""
                  onChange={(e) => setCompanyInfoAll((prev) => ({
                    ...prev,
                    'prepareDueDate': e.target.value
                  }))}

                  value={CompanyInfoAll.prepareDueDate}

                /> */}

                  <select
                    onChange={(e) => setCompanyInfoAll((prev) => ({
                      ...prev,
                      'prepareDueDate': e.target.value
                    }))}
                    value={CompanyInfoAll.prepareDueDate}
                    className="form-select" name="two_factor_task" >
                    <option value="">Choose an option</option>
                    {
                      Array.from({ length: 30 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1}
                        </option>
                      ))
                    }
                  </select>

                </div>
              </div>
            </div>


          </div>

          {setupDashboardAllData?.other_details?.formCompleted && (
            <ModalInputCenter
              heading="Form Saved and Completed!"
              cancelOption="Ok"
              handleClick={
                () => {
                  setSetupDashboardAllData((prev) => ({
                    ...prev,
                    other_details: {
                      ...prev.other_details,
                      formCompleted: false
                    }
                  }))
                }
              }
              changeShow={() => {

                setSetupDashboardAllData((prev) => ({
                  ...prev,
                  other_details: {
                    ...prev.other_details,
                    formCompleted: false
                  }
                }))
              }}
              show={setupDashboardAllData.other_details.formCompleted}
              action=""
            >
              Onboarding Completed Successfully!
            </ModalInputCenter>
          )}
        </form>
      ) : (
        <form
          onSubmit={handlSubmit}
          className="mt-3"
          enctype="multipart/form-data"
          ref={(divElem) => {
            fileUploadForm = divElem;
          }}
        >
          <button className="editBtn btn btnPrimary ml-auto" onClick={() => setStaticData(true)} style={{
            position: "absolute", right: "42px", top: "96px"
          }}>Edit <CiEdit size={18} style={{ marginLeft: "5px", marginTop: "-3px" }} />
          </button>
          <strong className="mb-4">Other Details</strong>
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="form-group">
                <label>Do you want to receive news from CloudAct?</label>
                <span>{setupDashboardAllData?.other_details?.revenue_collection}</span>
                {/* <select
                className="form-select"
                value={setupDashboardAllData?.other_details?.revenue_collection}
                onChange={(e) => {

                  setSetupDashboardAllData((prev) => ({
                    ...prev,
                    other_details: {
                      ...prev.other_details,
                      [e.target.name]: e.target.value,
                    }
                  }))

                }}
                name="revenue_collection"
              >
                <option value="">Choose an option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select> */}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Your Preferred Date Format</label>
                <span>{setupDashboardAllData?.other_details?.preferred_date}</span>
                {/* <select
                className="form-select"
                onChange={(e) => {
                  setSetupDashboardAllData((prev) => ({
                    ...prev,
                    other_details: {
                      ...prev.other_details,
                      [e.target.name]: e.target.value,
                    }
                  }))

                }}
                name="preferred_date"
                value={setupDashboardAllData?.other_details?.preferred_date}

              >
                <option value="">Choose an option</option>
                <option value="Canadian (mm/dd/yyyy)">
                  Canadian (mm/dd/yyyy)
                </option>
                <option value="USA (mm/dd/yyyy)">USA (mm/dd/yyyy)</option>
              </select> */}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>How long have you been using Quickbooks?</label>
                <span>{setupDashboardAllData.other_details.month_QBO}</span>
                {/* <input
                required
                type="date"
                name="month_QBO"
                id=""
                value={setupDashboardAllData.other_details.month_QBO}
                onChange={onChangeInput7}
              /> */}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>How long have you been using Clio?</label>'
                <span>{setupDashboardAllData.other_details.month_clio}</span>
                {/* <input
                className="form-control"
                required
                type="date"
                name="month_clio"
                id=""
                value={setupDashboardAllData.other_details.month_clio}
                onChange={onChangeInput7}
              /> */}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>How are your back-ups being maintained?</label>
                <span>{setupDashboardAllData.other_details.localDriveSharePoint}</span>
                {/* <input
                className="form-control"
                required
                type="text"
                placeholder="eg: local drive, sharepoint"
                value={setupDashboardAllData.other_details.localDriveSharePoint}
                name="localDriveSharePoint"
                onChange={onChangeInput7}
              /> */}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Set-up automatic monthly task</label>
                <span>{CompanyInfoAll?.isActive}</span>
                {/* <div >
                <select
                  onChange={(e) => {
                    setSetupDashboardAllData((prev) => ({
                      ...prev,
                      two_factor_task: e.target.value
                    }))

                    setCompanyInfoAll((prev) => ({
                      ...prev,
                      isActive: e.target.value
                    }))
                  }
                  }

                  value={CompanyInfoAll?.isActive}
                  className="form-select" name="two_factor_task" >
                  <option value="">Choose an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>

              </div> */}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label>Set-up automatic archive</label>
                <span>{CompanyInfoAll.auto_archive_checklist}</span>
                {/* <div
                onChange={(e) => {
                  setCompanyInfoAll((prev) => ({
                    ...prev,
                    auto_archive_checklist: e.target.value
                  }))
                }}

              >
                <select
                  value={CompanyInfoAll.auto_archive_checklist}
                  className="form-select" name="two_factor_task" >
                  <option value="">Choose an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>

              </div> */}
              </div>
            </div>


            {
              CompanyInfoAll.auto_archive_checklist === "Yes" &&
              <div className="col-md-4">
                <div className="form-group">
                  <label>Automated Archive checklist after days?</label>
                  <span>{CompanyInfoAll.auto_archive_duration}</span>
                  {/* <div

                  onChange={(e) => {
                    setCompanyInfoAll((prev) => ({
                      ...prev,
                      'auto_archive_duration': e.target.value
                    }))
                  }}

                > */}

                  {/* <select
                    value={CompanyInfoAll.auto_archive_duration}
                    className="form-select" name="two_factor_task" >
                    <option value="">Choose an option</option>
                    {
                      Array.from({ length: 30 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1}
                        </option>
                      ))
                    }
                  </select> */}

                  {/* <input
                    className="form-control"
                    required
                    type="text"
                    name="archive_checklist"
                    id=""
                    onChange={(e) => setCompanyInfoAll((prev) => ({
                      ...prev,
                      'auto_archive_duration': e.target.value
                    }))}

                    value={CompanyInfoAll.auto_archive_duration}

                  /> */}

                  {/* </div> */}
                </div>
              </div>
            }



            <div className="col-md-4">
              <div className="form-group">
                <label>Select number of days for due date settings for Preparer</label>
                <span>{CompanyInfoAll.prepareDueDate}</span>

                {/* <div > */}
                {/* <input
                  className="form-control"
                  required
                  type="text"
                  name="archive_checklist"
                  id=""
                  onChange={(e) => setCompanyInfoAll((prev) => ({
                    ...prev,
                    'prepareDueDate': e.target.value
                  }))}

                  value={CompanyInfoAll.prepareDueDate}

                /> */}

                {/* <select
                  onChange={(e) => setCompanyInfoAll((prev) => ({
                    ...prev,
                    'prepareDueDate': e.target.value
                  }))}
                  value={CompanyInfoAll.prepareDueDate}
                  className="form-select" name="two_factor_task" >
                  <option value="">Choose an option</option>
                  {
                    Array.from({ length: 30 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}
                      </option>
                    ))
                  }
                </select> */}

                {/* </div> */}
              </div>
            </div>


          </div>

          {setupDashboardAllData?.other_details?.formCompleted && (
            <ModalInputCenter
              heading="Form Saved and Completed!"
              cancelOption="Ok"
              handleClick={
                () => {
                  setSetupDashboardAllData((prev) => ({
                    ...prev,
                    other_details: {
                      ...prev.other_details,
                      formCompleted: false
                    }
                  }))
                }
              }
              changeShow={() => {

                setSetupDashboardAllData((prev) => ({
                  ...prev,
                  other_details: {
                    ...prev.other_details,
                    formCompleted: false
                  }
                }))
              }}
              show={setupDashboardAllData.other_details.formCompleted}
              action=""
            >
              Onboarding Completed Successfully!
            </ModalInputCenter>
          )}
        </form>
      )}
    </>
  );
};

const GetCompanyDetails = () => {
  const dispatch = useDispatch();
  const { userRole } = useSelector((state) => state.userChange);
  const [form7Data, setForm7Data] = useState({
    month_QBO: "",
    formCompleted: false,
  });
  const [companyInfo, setCompanyInfo] = useState({});
  const [loading, setloading] = useState(false)
  console.log('companyInfodddf', companyInfo)
  const [isActive, setActive] = useState(false);

  const toggleClass = () => {
    setActive(!isActive);
  };

  // useEffect(() => {
  //   setloading(false)
  //   const { short_firmname, display_firmname } = getCurrentUserFromCookies();
  //   axios
  //     .get(`/companyinfo/${getUserSID()}`)
  //     .then((res) => {

  //       console.log('res.data.data.code', res.data.data)
  //       if (res.data.data.code === 200) {


  //         setCompanyInfo((prev) => ({
  //           ...prev,
  //           shortName: short_firmname,
  //           display_firmname,
  //           ...res.data.data.body,

  //         }))

  //       }

  //     })
  //     .catch((err) => {
  //       console.log("err", err);
  //       setCompanyInfo({ ...companyInfo, loaded: true, companyInfo: {} });
  //     }).finally((res) => {
  //       setloading(true)

  //     })
  // }, []);



  return (
    <div className="userProfilePage pNone">
      <div className="d-flex align-items-center">
        <div className="userPhoto">
          {userRole.company_profile_pic ? (
            <img
              src={userRole.company_profile_pic}
              alt={userRole.company_profile_pic}
            ></img>
          ) : (
            <img src={ProfilePic} alt="unknown"></img>
          )}
          <div className="controls">
            <a
              onClick={toggleClass}
              href="javascript:void(0)"
              className="profileControlBtn"
            >
              {getSvg('toggleClass')}

            </a>
            <div className={isActive ? "open controlsView" : "controlsView"}>
              <span>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  name="profile_pic"
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
                        alert("Photo size should not be greater than 500KB");
                      });
                  }}
                  placeholder="Edit Photo"
                ></input>
                {getSvg('Import Image')}

                Import Image
              </span>
              <span
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
                    updateInfoInCurrentUser({ company_profile_pic: null });
                  }
                }}
              >

                {getSvg('Delete Image')}
                Delete Image
              </span>
            </div>
          </div>
        </div>
        <div className="userInfo">

          <strong>{loading && companyInfo.companyname}</strong>
          <span>{loading && companyInfo.shortName}</span>
          <span>
            {loading && companyInfo.legaladdress?.CountrySubDivisionCode ? companyInfo?.legaladdress?.CountrySubDivisionCode : ""}
            {" "}
            ,{" "}
            {loading && companyInfo.legaladdress?.Country ? companyInfo?.legaladdress.Country : ""}
          </span>
        </div>
      </div>


    </div>
  );
};

export default SetupDashboard;

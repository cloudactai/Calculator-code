import { Autocomplete, TextField } from "@mui/material";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, Container, Row, Col, Button } from "react-bootstrap";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateRangeCalendar } from "@mui/x-date-pickers-pro/DateRangeCalendar";
import { useHistory } from "react-router";
import reload from "../../assets/images/reload.png";

import ChecboxInput from "../../components/LayoutComponents/ChecboxInput/ChecboxInput.tsx";
import Dropdown from "../../components/Dropdown.js";
import Layout from "../../components/LayoutComponents/Layout.jsx";
import TableHeading from "../../components/TableHeading.js";
import axios from "../../utils/axios.js";
import { useSelector } from "react-redux";
import { headingsForReportsGenerated } from "../../utils/dataStatic.js";
import { getSvg } from "./reportSvgs";
import {
  addOneDayToDate,
  clioConnectedOrNot,
  determineColor,
  getCurrentUserFromCookies,
  updateInfoInCurrentUser,
  getLastMonthDates,
  getRefreshDate,
  getUserId,
  getUserSID,
  handleClientChange,
  intuitConnectedOrNot,
} from "../../utils/helpers.js";
import { AUTH_ROUTES } from "../../routes/Routes.types.ts";
import ModalInputCenter from "../../components/ModalInputCenter.jsx";
import { getUserProvince } from "../../utils/helpers.js";
import toast from "react-hot-toast"


import "./RunReport.css";
import NumberFormat from "react-number-format";

const RunReport = ({ currentUserRole }) => {
  const { response } = useSelector((state) => state.userProfileInfo);
  const [showFailedAlert, setShowFailedAlert] = useState(false);

  const [customDateRangeModal, setCustomDateRangeModal] = useState(false);
  const [isToastShown, setIsToastShown] = useState(false);

  const [dateRange, setDateRange] = useState([null, null]);
  const [toDate, setToDate] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [isDisabled, setIsDisabled] = useState(true);
  const [allCollections, setAllCollections] = useState([]);
  const [allCollectionsLoaded, setAllCollectionsLoaded] = useState(false);
  const [trustReport, setTrustReport] = useState([]);
  const [generalReport, setGeneralReport] = useState([]);
  const [feesReport, setFeesReport] = useState([]);
  const [creditReport, setCreditReport] = useState([]);
  const [currentTrustReport, setCurrentTrustReport] = useState(null);

  console.log("currentTrustReportcheckuid",currentTrustReport)
  const [currentGeneralReport, setCurrentGeneralReport] = useState(null);
  const [currentCreditReport, setCurrentCreditReport] = useState(null);
  const [currentMatterOwner, setCurrentMatterOwner] = useState("All");
  const [matterOwnerList, setMatterOwnerList] = useState([]);
  const [generalReportList, setGeneralReportList] = useState([]);
  const [trustReportList, setTrustReportList] = useState([]);
  const [creditReportList, setCreditReportList] = useState([]);
  const [dataToPost, setDataToPost] = useState({});
  const [forceRender, setForceRender] = useState(true);
  const [searchForClientListAPI, setSearchForClientListAPI] = useState([]);
  const [searchForClientStatusAPI, setSearchForClientStatusAPI] = useState([]);
  const [searchForClientStatus, setSearchForClientStatus] = useState([]);
  const [searchForClient, setSearchForClient] = useState([]);
  const [inputNumberState, setInputNumberState] = useState({});
  // const [trustReportInputs, setTrustReportInputs] = useState();
  // const [GeneralReportInputs, setGeneralReportInputs] = useState({});
  const [activityDate, setActivityDate] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [showAlertError, setShowAlertError] = useState("");
  const [showProcessing, setShowProcessing] = useState(false);
  const [reportsDone, setReportsDone] = useState(false);
  const [loadReportsGenerated, setLoadReportsGenerated] = useState([]);
  const [reportsDoneAlert, setReportsDoneAlert] = useState(false);
  const [isDateSame, setisDateSame] = useState(false);
  const [showDateAlert, setShowDateAlert] = useState(false);
  const [reportsRanOnce, setReportsRanOnce] = useState(false);
  const [reportsGeneratedDetails, setReportsGeneratedDetails] = useState({});
  const province = getUserProvince();
  // const [selectedDateRangeOption, setSelectedDateRangeOption] =
  //   useState("lastMonth");

  let reportBatchId = useRef("");

  const [selectAllReports, setSelectAllReports] = useState({
    allTrustReports: false,
    allGeneralReports: false,
    allCreditCardReports: false,
  });
  const [reportsGeneratedAlert, setReportsGeneratedAlert] = useState(false);
  const generate_button = useRef(false);
  const [reportProcessingStatus, setReportProcessingStatus] = useState([]);

  const history = useHistory();

  const handleModalApply = () => {
    if (dateRange.every((date) => date !== null)) {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      setFromDate(startDate);
      setToDate(endDate);
    } else {
      setFromDate(null);
      setToDate(null);
    }
    setCustomDateRangeModal(false);
  };

  function allProcessed(array) {
    return array.every((value) => value === "processed");
  }
  function pending(array) {
    return array.every((value) => value === "failed");
  }
  

  useEffect(() => {
    let timer;
    if (showProcessing) {
      timer = setInterval(async () => {
        if (!showAlertError && reportBatchId.current?.batchno?.length) {
          const processedReports = (
            await Promise.all(
              reportBatchId.current?.batchno?.map((batchNo) =>
                axios.get(`/processed/reports/status?batch_id=${batchNo}`)
              )
            )
          ).filter((report) => report.data.data.body.length > 0)[0];

          if (
            processedReports?.data?.data?.code === 200 &&
            processedReports?.data?.data?.body
          ) {
            setReportProcessingStatus(processedReports.data.data.body);
            const statusOfReports = processedReports.data.data.body.map(
              ({ status }) => status
            );

            console.log("status of Reports", statusOfReports);

            //when reports are processed.
            if (allProcessed(statusOfReports)) {
              setShowProcessing(false);
              clearInterval(timer);
              setReportsGeneratedAlert(true);
              //show all reports status details in modal.
            }   else if(pending(statusOfReports))
              {
                setShowProcessing(false);
                clearInterval(timer);
                setShowFailedAlert(true);
              }
            
            
            else {
              setShowProcessing(true);
            }
          } else if(
            processedReports?.data?.data?.code === 200 &&
            processedReports?.data?.data?.body[0].status === "failed"
          ){
            alert("reprort processing error!");
            clearInterval(timer);
            
          }
        }
      }, 4000);
    } else {
      clearInterval(timer);
    }

    return () => clearInterval(timer);

  }, [showProcessing]);

  useEffect(() => {
    if (
      toDate != null &&
      fromDate != null &&
      clioConnectedOrNot() &&
      intuitConnectedOrNot() &&
      getRefreshDate() !== null
    ) {
      if (toDate === fromDate) {
        setisDateSame(true);
        setShowDateAlert(true);
        setShowAlertError("To Date and From Date must be different");

        setIsDisabled(true);
      } else {
         console.log(
          "new date changed",
          moment(toDate).add(1, "days").calendar()
        );

        let toDateEndTime = moment(toDate).add(1, "days");
        setIsDisabled(false);
      }
    }
  }, [toDate, fromDate, isDateSame, currentUserRole]);

  useEffect(() => {
    axios
      .get(`/trust/accounts?uid=${getUserId()}&sid=${getUserSID()}`)
      .then((res) => {
        const { body, code } = res.data.data;
        if (code === 200) {
          const accounts =
            body.length > 1 ? [{ account_id: 0, name: "All" }, ...body] : body;
          // const accounts = body;

          setTrustReportList(accounts);
        }
      })
      .catch((err) => {
        console.log("err", err);
      });

    axios
      .get(`/general/accounts?uid=${getUserId()}&sid=${getUserSID()}`)
      .then((res) => {
        const { body, code } = res.data.data;
        console.log("res.data.data gernral",res.data.data)
        if (code === 200) {
          const accounts =
            body.length > 1 ? [{ account_id: 0, name: "All" }, ...body] : body;
          // const accounts = body;
          setGeneralReportList(accounts);
        }
      })
      .catch((err) => {
        console.log("err", err);
      });

    axios
      .get(`/card/accounts?uid=${getUserId()}&sid=${getUserSID()}`)
      .then((res) => {
        const { body, code } = res.data.data;
        if (code === 200) {
          const accounts =
            body.length > 1 ? [{ account_id: 0, name: "All" }, ...body] : body;
            console.log("res.data.data credit",res.data.data)
          setCreditReportList(accounts);
        }
      })
      .catch((err) => {
        console.log("err", err);
      });

    axios
      .get(`/attorney?uid=${getUserId()}&sid=${getUserSID()}`)
      .then((res) => {
        const { body, code } = res.data.data;
        if (code === 200) {
          setMatterOwnerList([{ responsible_attorney_name: "All" }, ...body]);
        }
      })
      .catch((err) => {
        console.log("err", err);
      });

    axios
    .get(`/report/collection?province=${getCurrentUserFromCookies().province}&type=${0}`)

      .then((res) => {
        if (res.data.data.code === 200) {
          const { body } = res.data.data;


          // Trust Disbursement Journal
          if (body[0]?.category === "Trust" && body[0]?.collection[1]?.id === 2) {
            // Find the object with id: 2 and set its options to an empty array
            let trustDisbursementJournal = body[0].collection.find(item => item.id === 2);
            if (trustDisbursementJournal) {
              trustDisbursementJournal.options = [];
            }
          }

console.log('ResponceBody', body);


          if (body.length > 0) {
            body.forEach((category) => {
              category.collection.forEach((collection) => {
                // Check if the collection has options and if it has the specific option
                if (collection.options && collection.options.length > 0) {
                  const endingBalanceOption = collection.options.find(
                    (option) =>
                      option.label === "Enter Ending bank statement balance"
                  );

                  // Update the value to "0" if the option is found
                  if (endingBalanceOption) {
                    endingBalanceOption.value = "0";
                  }
                }
              });
            });
          }

          setAllCollections(body);
          setTrustReport(body[0]);
          setGeneralReport(body[1]);
          setFeesReport(body[2]);
          setCreditReport(body[3]);
          setAllCollectionsLoaded(true);
        } else {
          alert("No data found!");
          window.location.href = "/dashboard";
        }
      })
      .catch((err) => {
        console.log("err", err);
      });
  }, [currentUserRole]);


  const setStateForReportsType = (type) => {
    switch (type) {
      case "Trust":
        setTrustReport({ ...trustReport });
        break;

      case "General":
        setGeneralReport({ ...generalReport });
        break;

      case "Other":
        setFeesReport({ ...feesReport });
        break;

      default:
        break;
    }
  };

  const addDropdownStatus = (type, eParent, eChild) => {
    axios
      .get(`matter/status?sid=${getUserSID()}`)
      .then((res) => {
        console.log("res", res);
        const { body } = res.data.data;
        type.collection[eParent].options[eChild].status = body;
        setSearchForClientStatusAPI(body);

        type.collection[eParent].options[eChild].value = "All";
        setStateForReportsType(type);

        setForceRender(false);
        setTimeout(() => {
          setForceRender(true);
        }, 0.01);
      })
      .catch((error) => {
        console.log("err in matter status", error);
      });
  };
  const addDropdownClient = async (type, eParent, eChild) => {
    try {
      const allClients = await axios.get(`/clients?sid=${getUserSID()}`);
      console.log("allClients", allClients);

      if (allClients) {
        const { body } = allClients.data.data;
        type.collection[eParent].options[eChild].dropdown = body;

        setSearchForClientListAPI(body);
        setStateForReportsType(type);
        setForceRender(false);
        type.collection[eParent].options[eChild].value = "All";
        setTimeout(() => {
          setForceRender(true);
        }, 0.01);
      }
    } catch (error) {
      console.log("err", error);
    }
  };
  const addDropdownDateSelect = (type, eParent, eChild) => {
    type.collection[eParent].options[eChild].datePicker = true;
    type.collection[eParent].options[eChild].value = "All";
  };

  const chooseType = (type) => {
    switch (type) {
      case "Trust":
        return trustReport;

      case "General":
        return generalReport;

      case "CreditCard":
        return creditReport;

      case "Other":
        return feesReport;

      default:
        break;
    }
  };

  const checkToAddDropdown = (type, label, parentObj, childObj) => {
    console.log("label in check to add ", label);
    if (label.includes("Status")) {
      addDropdownStatus(chooseType(type), parentObj, childObj);
    }
    if (label.includes("Specific")) {
      addDropdownClient(chooseType(type), parentObj, childObj);
    }
    if (label.includes("Activity Date")) {
      addDropdownDateSelect(chooseType(type), parentObj, childObj);
    }
  };

  const removeDropdownDateSelect = (type, eParent, eChild) => {
    type.collection[eParent].options[eChild].datePicker = false;
    delete type.collection[eParent].options[eChild].datePicker;
  };

  const removeDropdownClient = (type, eParent, eChild) => {
    type.collection[eParent].options[eChild].dropdown = [];
    delete type.collection[eParent].options[eChild].dropdown;
  };

  const removeDropdownStatus = (type, eParent, eChild) => {
    type.collection[eParent].options[eChild].status = [];
    delete type.collection[eParent].options[eChild].status;
  };

  const removeDropdown = (type, label, parentObj, childObj) => {
    console.log("label in check to add ", label);
    if (label.includes("Status")) {
      removeDropdownStatus(chooseType(type), parentObj, childObj);
    }
    if (label.includes("Specific")) {
      removeDropdownClient(chooseType(type), parentObj, childObj);
    }
    if (label.includes("Activity Date")) {
      removeDropdownDateSelect(chooseType(type), parentObj, childObj);
    }
  };

  const handleTrustReportClick = (e) => {
console.log('✌️aaaaae --->', e);
    console.log("handle trust report click", e);

    if (e === "3.0") {
      console.log("clicked true", trustReport.collection);

      //if show specific client is selected. then unselect other options.
      trustReport.collection["3"].options.forEach((e, index) => {
        const selected = !trustReport.collection["3"].options[0].selected;

        console.log("selected", selected);

        // console.log("event", trustReport.collection['3'].options[0].selected);

        if (index !== 0 && selected) {
          e.selected = false;
          e.disabled = true;
        } else if (index !== 0 && !selected) {
          // e.selected = true;
          e.disabled = false;
        }
      });
    }

    if (e === "3.1") {
      console.log("show clients with zero balance.");

      trustReport.collection["3"].options.forEach((e, index) => {
        const selected = !trustReport.collection["3"].options[1].selected;

        console.log("selecteds", selected);

        if (index === 4 && selected) {
          e.selected = false;
          e.disabled = true;
        } else if (index === 4 && !selected) {
          // e.selected = true;
          e.disabled = false;
        }
      });
    }

    if (e === "3.4") {
      console.log("show clients with zero balance.");

      trustReport.collection["3"].options.forEach((e, index) => {
        const selected = !trustReport.collection["3"].options[4].selected;

        if (index === 1 && selected) {
          e.selected = false;
          e.disabled = true;
        } else if (index === 1 && !selected) {
          // e.selected = true;
          e.disabled = false;
        }
      });
    }

    if (e === "4.0") {
      console.log("clid");

      trustReport.collection["4"].options.forEach((e, index) => {
        const selected = !trustReport.collection["4"].options[0].selected;

        console.log("selected", selected);

        if (index !== 0 && selected) {
          e.selected = false;
          e.disabled = true;
        } else if (index !== 0 && !selected) {
          // e.selected = true;
          e.disabled = false;
        }
      });
    }

    if (e === "4.1") {
      console.log("show clients with zero balance.");

      trustReport.collection["4"].options.forEach((e, index) => {
        const selected = !trustReport.collection["4"].options[1].selected;

        console.log("selecteds", selected);

        if (index === 3 && selected) {
          e.selected = false;
          e.disabled = true;
        } else if (index === 3 && !selected) {
          // e.selected = true;
          e.disabled = false;
        }
      });
    }

    if (e === "4.3") {
      console.log("show clients with zero balance.");

      trustReport.collection["4"].options.forEach((e, index) => {
        const selected = !trustReport.collection["4"].options[3].selected;

        if (index === 1 && selected) {
          e.selected = false;
          e.disabled = true;
        } else if (index === 1 && !selected) {
          // e.selected = true;
          e.disabled = false;
        }
      });
    }

    if (e.includes(".")) {
      const bothObjs = e.split(".");
      const parentObj = bothObjs[0];
      const childObj = bothObjs[1];

      trustReport.collection[parentObj].options[childObj].selected =
        !trustReport.collection[parentObj].options[childObj].selected;

      if (trustReport.collection[parentObj].options[childObj].selected) {
        trustReport.collection[parentObj].options[childObj].value = 1;

        checkToAddDropdown(
          "Trust",
          trustReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      } else {
        trustReport.collection[parentObj].options[childObj].value = 0;
        removeDropdown(
          "Trust",
          trustReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      }
    } else {
      trustReport.collection[e].selected = !trustReport.collection[e].selected;

      if (!trustReport.collection[e].selected) {
        for (let i = 0; i < trustReport.collection[e].options.length; i++) {
          if (trustReport.collection[e].options[i].selected) {
            trustReport.collection[e].options[i].selected = false;
          }
        }
      }
    }

    const everyTrustChecked = trustReport.collection.every((e) => e.selected);

    setSelectAllReports({
      ...selectAllReports,
      allTrustReports: everyTrustChecked,
    });
    setTrustReport({ ...trustReport });
  };

  const handleFeesReportClick = (e) => {
    if (e.includes(".")) {
      const bothObjs = e.split(".");
      const parentObj = bothObjs[0];
      const childObj = bothObjs[1];

      feesReport.collection[parentObj].options[childObj].selected =
        !feesReport.collection[parentObj].options[childObj].selected;

      if (feesReport.collection[parentObj].options[childObj].selected) {
        feesReport.collection[parentObj].options[childObj].value = 1;

        checkToAddDropdown(
          "Other",
          feesReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      } else {
        feesReport.collection[parentObj].options[childObj].value = 0;
        removeDropdown(
          "Other",
          feesReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      }
    } else {
      feesReport.collection[e].selected = !feesReport.collection[e].selected;

      if (!feesReport.collection[e].selected) {
        for (let i = 0; i < feesReport.collection[e].options.length; i++) {
          if (feesReport.collection[e].options[i].selected) {
            feesReport.collection[e].options[i].selected = false;
          }
        }
      }
    }
    setFeesReport({ ...feesReport });
  };

  const handleGeneralReportClick = (e) => {
    if (e.includes(".")) {
      const bothObjs = e.split(".");
      const parentObj = bothObjs[0];
      const childObj = bothObjs[1];

      generalReport.collection[parentObj].options[childObj].selected =
        !generalReport.collection[parentObj].options[childObj].selected;

      if (generalReport.collection[parentObj].options[childObj].selected) {
        generalReport.collection[parentObj].options[childObj].value = 1;

        checkToAddDropdown(
          "General",
          generalReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      } else {
        generalReport.collection[parentObj].options[childObj].value = 0;
        removeDropdown(
          "General",
          generalReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      }
    } else {
      generalReport.collection[e].selected =
        !generalReport.collection[e].selected;

      if (!generalReport.collection[e].selected) {
        // console.log("general report", generalReport.collection);
        for (let i = 0; i < generalReport.collection[e].options.length; i++) {
          if (generalReport.collection[e].options[i].selected) {
            generalReport.collection[e].options[i].selected = false;
          }
        }
      }
    }

    const everyTrustChecked = generalReport.collection.every((e) => e.selected);

    console.log("every general ", everyTrustChecked);
    setSelectAllReports({
      ...selectAllReports,
      allGeneralReports: everyTrustChecked,
    });
    setGeneralReport({ ...generalReport });
  };

  const handleCreditCardReportClick = (e) => {
    console.log("e", e);
    if (e.includes(".")) {
      const bothObjs = e.split(".");
      const parentObj = bothObjs[0];
      const childObj = bothObjs[1];

      creditReport.collection[parentObj].options[childObj].selected =
        !creditReport.collection[parentObj].options[childObj].selected;

      if (creditReport.collection[parentObj].options[childObj].selected) {
        creditReport.collection[parentObj].options[childObj].value = 1;

        checkToAddDropdown(
          "CreditCard",
          creditReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      } else {
        creditReport.collection[parentObj].options[childObj].value = 0;
        removeDropdown(
          "CreditCard",
          creditReport.collection[parentObj].options[childObj].label,
          parentObj,
          childObj
        );
      }
    } else {
      creditReport.collection[e].selected =
        !creditReport.collection[e].selected;

      if (!creditReport.collection[e].selected) {
        // console.log("general report", creditReport.collection);
        for (let i = 0; i < creditReport.collection[e].options.length; i++) {
          if (creditReport.collection[e].options[i].selected) {
            creditReport.collection[e].options[i].selected = false;
          }
        }
      }
    }

    const everyTrustChecked = creditReport.collection.every((e) => e.selected);

    console.log("every credit card ", everyTrustChecked);
    setSelectAllReports({
      ...selectAllReports,
      allCreditCardReports: everyTrustChecked,
    });
    setCreditReport({ ...creditReport });
  };

  const changeClick = (e, type, allInfo) => {
    console.log("type", type);
    if (type === "Trust") {
      handleTrustReportClick(e);
    } else if (type === "Other") {
      handleFeesReportClick(e);
    } else if (type === "General") {
      handleGeneralReportClick(e);
    } else if (type === "CreditCard") {
      handleCreditCardReportClick(e);
    }
  };

  useEffect(() => {
    LoadReportsStatus();
  }, []);

  const LoadReportsStatus = () => {
    axios
      .get(`/pending/process?uid=${getUserId()}`)
      .then((res) => {
        console.log("res", res);
        const { body, code } = res.data.data;
        if (code === 200) {
          setLoadReportsGenerated(body);
          setReportsDone(true);
        } else {
          throw body;
        }
      })
      .catch((err) => {
        setLoadReportsGenerated([]);
        setReportsDone(false);
        console.log("err", err);
      });
  };

  const addAccount = (account_id, account_val, matter_val, collection) => {
    return {
      account_value: {
        id: account_id || "",
        value: account_val || "",
      },
      matter_owner_value: {
        id: "",
        value: matter_val || "",
      },
      collection: collection,
    };
  };

  const filterOnlyCollections = () => {
    const grouped = {};
    if (Object.keys(dataToPost).length) {
      const data = dataToPost.category
        ?.map((t) => {
          return t.collection.map((c) => {
            if (c.selected) {
              return {
                account: t?.account_value?.value,
                collection: c,
                label: c.label,
              };
            }
          });
        })
        .flat()
        ?.filter((item) => item != undefined)
        ?.map((f) => {
          if (f.label.includes("Trust")) {
            return {
              ...f,
              account: "Trust Account",
            };
          } else if (f.label.includes("Credit")) {
            return {
              ...f,
              account: "Credit Card Account",
            };
          } else if (f.label.includes("General")) {
            return {
              ...f,
              account: "General Account",
            };
          } else {
            return {
              ...f,
              account: "Others",
            };
          }
        });
      data?.forEach((item) => {
        const { account, collection } = item;
        if (!grouped[account]) {
          grouped[account] = { account, collections: [] };
        }
        grouped[account].collections.push(collection);
      });
      const result = Object.values(grouped);

      return result;
    }
  };

  const deleteUnNecessaryKeys = (type) => {
    type.collection.forEach((e) => {
      if (e.options.length >= 1) {
        e.options.forEach((s) => {
          if (s.hasOwnProperty("status")) {
            delete s.status;
          }
          if (s.hasOwnProperty("dropdown")) {
            delete s.dropdown;
          }
          if (s.hasOwnProperty("datePicker")) {
            delete s.datePicker;
          }
          if (s.value === "" && !s.selected) {
            s.value = "All";
          }
        });
      }
    });
  };

  const runReport = () => {
    console.log("currentTrustReport in report",currentTrustReport)
    if (toDate !== null && fromDate !== null) {
      const filterData = () => {
        deleteUnNecessaryKeys(trustReport);
        deleteUnNecessaryKeys(generalReport);
        deleteUnNecessaryKeys(feesReport);
        deleteUnNecessaryKeys(creditReport);
        setTrustReport({ ...trustReport });
        setGeneralReport({ ...generalReport });
        setCreditReport({ ...creditReport });
        setFeesReport({ ...feesReport });
      };
      filterData();

      const obj = {
        requested_by_user: getUserId(),
        subscriber_id: getUserSID(),
        from_date: new Date(fromDate).toISOString(),
        to_date: new Date(toDate).toISOString(),
        report_type: 0,
        category: [
          addAccount(
            currentTrustReport
              ? currentTrustReport[0]?.account_id
              : trustReportList
              ? trustReportList[0]?.account_id
              : "",
            currentTrustReport && currentTrustReport[0]?.name !== "All"
              ? currentTrustReport[0]?.name
              : trustReportList && trustReportList[0]?.name !== "All"
              ? trustReportList[0]?.name
              : trustReportList.map((e) => {
                  if (e.name !== "All") {
                    return e.name;
                  }
                }),
            currentMatterOwner ? currentMatterOwner : "All",
            trustReport.collection
          ),
          addAccount(
            currentGeneralReport
              ? currentGeneralReport[0]?.account_id
              : generalReportList
              ? generalReportList[0]?.account_id
              : "",
            currentGeneralReport && currentGeneralReport[0]?.name !== "All"
              ? currentGeneralReport[0]?.name
              : generalReportList && generalReportList[0]?.name !== "All"
              ? generalReportList[0]?.name
              : generalReportList?.map((e) => {
                  if (e.name !== "All") return e.name;
                }),
            "",
            generalReport?.collection
          ),
          addAccount(
            currentCreditReport
              ? currentCreditReport[0]?.account_id
              : creditReportList
              ? creditReportList[0]?.account_id
              : "",
            currentCreditReport && currentCreditReport[0].name !== "All"
              ? currentCreditReport[0]?.name
              : creditReportList && creditReportList[0]?.name !== "All"
              ? creditReportList[0]?.name
              : creditReportList.map((e) => {
                  if (e.name !== "All") return e.name;
                }),
            "",
            creditReport?.collection
          ),
          addAccount("", ["Others"], "", feesReport?.collection),
        ],
      };


      setShowAlertError("");

      setModalShow(true);
      console.log('✌️aaaaaaobj --->', obj);


      axios
        .post("/report/collection", obj)
        .then((res) => {
console.log('✌️res --->', res.data);
          setReportsRanOnce(true);
          if (res.data.data.code === 200) {
            console.log("allData which was send", obj);
            setDataToPost(obj);
            setReportsGeneratedDetails(res.data.data.body);
            reportBatchId.current = res.data.data.body;
            setModalShow(true);
            setReportsDoneAlert(true);
            setShowProcessing(true);
          } 
          
    
          
          else {

            throw res.data.data.body.message;
          }
        })
        .catch((err) => {
          // console.log("allData which was send", allData);
          console.log("err", err);
          setShowProcessing(false);
          setModalShow(false);
          setReportsRanOnce(true);
          setReportsDoneAlert(false);
          setReportsDone(false);
        });
    } else {
      setShowAlertError("Date Range must be selected first to run reports!");
    }
  };

  const resetValues = (type) => {
    type.collection.forEach((e) => {
      e.selected = false;
      if (e.options) {
        e.options.forEach((s) => {
          s.selected = false;
        });
      }
    });
  };

  const resetAllInputValues = () => {
    setSelectAllReports({
      allGeneralReports: false,
      allTrustReports: false,
      allCreditCardReports: false,
    });
    resetValues(trustReport);
    resetValues(generalReport);
    resetValues(feesReport);
    resetValues(creditReport);
  };


  const displayReportsOnPage = (type) => {
    const allInputs = [];
    const typename = type.category;

    type.collection.forEach((e, index) => {
      allInputs.push(
        <ChecboxInput
          val={e.label}
          changeClick={changeClick}
          id={index}
          typename={typename}
          checked={e.selected}
          isDisabled={() => {
            if (isDisabled) {
              return true;
            }

            if (e.disabled) {
              return true;
            }
          }}
          key={index}
        />
      );
      console.log("check eee",e)

      if (e.options.length > 0) {
        if (e.id === 4 || e.id === 19 || e.id === 34) {
          allInputs.push(
            <div
              className={`form-group mb-0  mt-2 ${
                isDisabled || !e.selected ? "d-none" : "show"
              }`}
            >
              <Autocomplete
                id="combo-box-demo"
                options={matterOwnerList.map(
                  (option) => option.responsible_attorney_name
                )}
                onChange={(event, value) => {
                  setCurrentMatterOwner(value);
                }}
                defaultValue={currentMatterOwner}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                  <TextField {...params} label="Matter Owner" />
                )}
              />
            </div>
          );
        }
        e.options.forEach((s, subIndex) => {
          if (s.label.includes("Enter")) {
            allInputs.push(
              <div
                className={`form-group mb-0 mt-2 ${
                  isDisabled || !e.selected ? "d-none" : "show"
                }`}
              >
                <label>{s.label}</label>
                <NumberFormat
                  value={e.value}
                  className="form-control"
                  inputMode="numeric"
                  thousandSeparator={true}
                  decimalScale={3}
                  defaultValue={0}
                  prefix={""}
                  onChange={(e) => {
                    s.value = e.target.value.trim().replace(/[^\d.]/g, "");
                    if (s.value) {
                      s.selected = true;
                    } else {
                      s.selected = false;
                    }
                    setInputNumberState({
                      ...inputNumberState,
                      [typename + "," + index + "." + subIndex]:
                        e.target.value.replace(/[^\d.]/g, ""),
                    });
                  }}
                />
              </div>
            );
          } else {
            allInputs.push(
              <ChecboxInput
                val={s.label}
                changeClick={changeClick}
                id={index + "." + subIndex}
                addClassName={`${
                  isDisabled || !e.selected ? "d-none" : "show"
                }`}
                typename={typename}
                checked={s.selected && e.selected}
                isDisabled={isDisabled || !e.selected || s.disabled}
                key={index + "." + subIndex}
              />
            );
          }

          if (s.hasOwnProperty("dropdown")) {
            if (s.dropdown.length >= 1) {
              allInputs.push(
                <div className="form-group mb-0 mt-2">
                  <Autocomplete
                    id="combo-box-demo"
                    options={s.dropdown.map((option) => option.client_name)}
                    onChange={(event, value) => {
                      console.log("evenet", event);
                      s.value = value;
                      setSearchForClient(value);
                    }}
                    defaultValue="All"
                    value={s.value}
                    getOptionLabel={(option) => option}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Client" />
                    )}
                  />
                </div>
              );
            }
          }

          if (s.hasOwnProperty("status") && s.status.length >= 1) {
            allInputs.push(
              <div className="form-group mb-0 mt-2">
                <Autocomplete
                  id="combo-box-demo"
                  options={s.status.map((option) => option.status)}
                  onChange={(event, value) => {
                    console.log("s.valuye", s.value);
                    s.value = value;

                    setSearchForClientStatus(value);
                  }}
                  defaultValue={searchForClientStatus}
                  getOptionLabel={(option) => option}
                  renderInput={(params) => (
                    <TextField {...params} label="Matter Status" />
                  )}
                />
              </div>
            );
          }

          if (s.hasOwnProperty("datePicker") && s.datePicker) {
            allInputs.push(
              <div className="form-group mb-0 mt-2">
                <label>Date</label>
                <input
                  type="date"
                  typename={typename}
                  onChange={(e) => {
                    setActivityDate(e.target.value);
                    const typeAtt = e.target.attributes["typename"].value;
                    s.value = e.target.value;
                    setStateForReportsType(typeAtt);
                  }}
                  className="form-control"
                  value={s.value}
                  name="datePicker"
                  id=""
                />
              </div>
            );
          }
        });
      }
    });

    return allInputs;
  };

  const checkIfAllRequiredFieldsFilled = () => {
    let allFilled = true;

    const checkIfAllReqFieldsFilled = allCollections.forEach((e) => {
      let eachReportType = e.collection;
      eachReportType.forEach((report) => {
        if (report.selected && report.options.length >= 1) {
          console.log("has Options and selected");
          let reportOptions = report.options.forEach((option) => {
            if (option.label.includes("Enter") && option.value === "") {
              console.log("option enter bank is empty");
              allFilled = false;
            }

            if (option.datePicker === true && option.value === "All") {
              console.log("option last Active date is empty");
              allFilled = false;
            }
          });
        }
      });
    });
    return allFilled;
  };

  return (
    <Layout title={`Welcome ${response?.username ? response?.username : ""}`}>
      {/* <BreadCrumb options={[{ option: "Report", link: "/reports" }]} currentPage="Generate law society compliance reports"/> */}
      <div className="pageFilter d-flex align-items-center justify-content-center">
        <span className="me-3 fw-bold mt-3">Select Date Range:</span>
        <div className="form-group mb-0">
          <label>From</label>
          <input
            type="date"
            className={`${isDisabled ? "" : ""} form-control`}
            name="start"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setToDate(addOneDayToDate(e.target.valueAsDate));
            }}
          />
        </div>
        <div className="form-group mb-0">
          <label>To</label>
          <input
            type="date"
            className={`${isDisabled ? "" : ""} form-control`}
            name="end"
            onChange={(e) => setToDate(e.target.value)}
            value={toDate}
          />
        </div>
        <button
          disabled={showProcessing}
          ref={generate_button}
          onClick={(e) => {
            e.preventDefault();

            if (showProcessing) {
              return;
            }

            if (!reportsRanOnce) {
              if (checkIfAllRequiredFieldsFilled()) {
                runReport();
              } else {
                setShowAlertError(
                  "Please fill all the fields(Enter ending bank statements and dates)"
                );
                setShowProcessing(false);
              }
            }
          }}
          className="btn btnPrimary rounded-pill generate"
        >
          {!showAlertError && showProcessing ? (
            <span className="d-flex align-items-center">
              Processing... <img src={reload} alt="reload" />{" "}
            </span>
          ) : (
            <span onClick={() => setShowProcessing(true)}>
              Generate Reports
            </span>
          )}
        </button>
      </div>

      {reportsGeneratedAlert && (
        <ModalInputCenter
          heading="Reports Generation Details!"
          show={reportsGeneratedAlert}
          changeShow={() => {
            setReportsGeneratedAlert(false);
            resetAllInputValues();
          }}
          action="OK"
          modalSize="modal-lg"
          handleClick={() => {
            setReportsGeneratedAlert(false);
            history.push(`${AUTH_ROUTES.REPORTS}?reporttype=0`);
          }}
        >
          <div className="tableOuter m-0 shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filterOnlyCollections()
                  ?.map((fc) =>
                    fc.collections.map((c) => {
console.log('✌️ddddddddddddddddddc --->', c);
                      return {
                        id: c.id,
                        requested_for: c.label,
                        status: "processed",
                      };
                    })
                  )
                  .flat()
                  .map((e, index) => {
                    return (
                      <tr key={index}>
                        <td>{e.requested_for}</td>
                        <td
                          className={`${
                            e.status === "processed" ? "greenColor" : "redColor"
                          } text-capitalize`}
                        >
                          {e.status}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </ModalInputCenter>
      )}
      {showFailedAlert && (
  <ModalInputCenter
    heading="Reports Generation Details - Failed!"
    show={showFailedAlert}
    changeShow={() => {
      setShowFailedAlert(false);
      resetAllInputValues();
    }}
    action="OK"
    modalSize="modal-lg"
    handleClick={() => {
      setShowFailedAlert(false);
      history.push(AUTH_ROUTES.REPORTS);
    }}
  >
    <div className="tableOuter m-0 shadow-none">
      <table className="table">
        <thead>
          <tr>
            <th>Report Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filterOnlyCollections()
            ?.map((fc) =>
              fc.collections.map((c) => {
                return {
                  id: c.id,
                  requested_for: c.label,
                  status: "failed",
                };
              })
            )
            .flat()
            .map((e, index) => {
              return (
                <tr key={index}>
                  <td>{e.requested_for}</td>
                  <td
                    className={`${
                      e.status === "processed" ? "greenColor" : "redColor"
                    } text-capitalize`}
                  >
                    {e.status}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  </ModalInputCenter>
)}

      <div className="row accountType">
        <div className="col-lg-4">
          <div className="panel">
            <div className="pHead">
              <span className="h5">
               {getSvg('Trust Account')}

               
                Trust Account
              </span>
            </div>
            <div className="pBody">

              {
                console.log("Check REs",forceRender , allCollectionsLoaded)

              }
              {allCollectionsLoaded && (
                <Dropdown
                 
                  isDisabled={isDisabled}
                  handleClientChange={handleClientChange}
                  type="Trust account name"
                  stateToChange={(e) => setCurrentTrustReport(e)}
                  list={trustReportList}
                  curClient={
                    currentTrustReport
                      ? currentTrustReport[0]?.name
                      : trustReportList.length >= 1
                      ? trustReportList[0]?.name
                      : "No Clients Yet"
                  }
                ></Dropdown>
              )}
              {forceRender && allCollectionsLoaded && (
                <>
                  <ChecboxInput
                    addClassName={"fw-bold"}
                    val="Select All Trust Reports"
                    changeClick={(id, typeName, allInfo) => {
                      if (allInfo.target.checked) {
                        trustReport.collection.forEach((e) => {
                          e.selected = true;
                        });
                      } else {
                        trustReport.collection.forEach((e) => {
                          e.selected = false;
                        });
                      }
                      setSelectAllReports({
                        ...selectAllReports,
                        allTrustReports: !selectAllReports.allTrustReports,
                      });
                      setTrustReport({ ...trustReport });
                    }}
                    id="1"
                    typename="Trust"
                    checked={selectAllReports.allTrustReports}
                    isDisabled={isDisabled}
                    key="1"
                  />
                  {displayReportsOnPage(trustReport)}
                </>
              )}
              {!forceRender && allCollectionsLoaded && (
                <>
                  <ChecboxInput
                    addClassName={"fw-bold"}
                    val="Select All Trust Reports"
                    changeClick={(id, typeName, allInfo) => {
                      console.log("all info", allInfo);
                      if (allInfo.target.checked) {
                        trustReport.collection.forEach((e) => {
                          e.selected = true;
                        });
                      } else {
                        trustReport.collection.forEach((e) => {
                          e.selected = false;
                        });
                      }
                      setSelectAllReports({
                        ...selectAllReports,
                        allTrustReports: !selectAllReports.allTrustReports,
                      });
                      setTrustReport({ ...trustReport });
                    }}
                    typename="Trust"
                    id="1"
                    checked={selectAllReports.allTrustReports}
                    isDisabled={isDisabled}
                    key="1"
                  />
                  {displayReportsOnPage(trustReport)}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="panel">
            <div className="pHead">
              <span className="h5">
               {getSvg('General Account')}
              
                General Account
              </span>
            </div>
            <div className="pBody">
              {allCollectionsLoaded && (
                <Dropdown
                  isDisabled={isDisabled}
                  handleClientChange={handleClientChange}
                  type="General account name"
                  stateToChange={(e) => setCurrentGeneralReport(e)}
                  list={generalReportList}
                  curClient={
                    currentGeneralReport
                      ? currentGeneralReport[0].name
                      : generalReportList.length >= 1
                      ? generalReportList[0].name
                      : "No Clients Yet"
                  }
                ></Dropdown>
              )}
              {allCollectionsLoaded && (
                <>
                  <ChecboxInput
                    addClassName={"fw-bold"}
                    val="Select All General Reports"
                    changeClick={(id, typeName, allInfo) => {
                      console.log("all info", allInfo);
                      if (allInfo.target.checked) {
                        generalReport.collection.forEach((e) => {
                          e.selected = true;
                        });
                      } else {
                        generalReport.collection.forEach((e) => {
                          e.selected = false;
                        });
                      }
                      setSelectAllReports({
                        ...selectAllReports,
                        allGeneralReports: !selectAllReports.allGeneralReports,
                      });
                      setGeneralReport({ ...generalReport });
                    }}
                    typename="general"
                    id="2"
                    checked={selectAllReports.allGeneralReports}
                    isDisabled={isDisabled}
                    key="1"
                  />
                  {displayReportsOnPage(generalReport)}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="panel">
            <div className="pHead">
              <span className="h5">
               {getSvg('Credit Card Account')}

                
                Credit Card Account
              </span>
            </div>
            <div className="pBody">
              {allCollectionsLoaded && (
                <Dropdown
                  isDisabled={isDisabled}
                  handleClientChange={handleClientChange}
                  type="Credit account name"
                  stateToChange={(e) => setCurrentCreditReport(e)}
                  list={creditReportList}
                  curClient={
                    currentCreditReport
                      ? currentCreditReport[0].name
                      : creditReportList.length >= 1
                      ? creditReportList[0].name
                      : "No Clients Yet"
                  }
                ></Dropdown>
              )}
              {allCollectionsLoaded && (
                <>{displayReportsOnPage(creditReport)}</>
              )}
            </div>
          </div>
          <div className="panel">
            <div className="pHead">
              <span className="h5">
               {getSvg('Fees Book & Client General Journal')}
               {province.replace(/['"]+/g, '') === "ON" ? "Fees Book & Client General Journal" : "Fees Book & Accounts Receivable Ledger"}
              </span>
            </div>
            <div className="pBody">
              {forceRender &&
                allCollectionsLoaded &&
                displayReportsOnPage(feesReport, "feesBook")}
              {!forceRender &&
                allCollectionsLoaded &&
                displayReportsOnPage(feesReport, "feesBook")}
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <div className="d-flex align-items-center">
          {showAlertError && (
            <Alert
              dismissible
              onClose={() => setShowAlertError("")}
              variant="warning"
              className="text-error heading-5 w-75"
              style={{ color: "#d93025" }}
            >
              {showAlertError}
            </Alert>
          )}

          {!allCollectionsLoaded && <div className="loader">Loading...</div>}

          {showDateAlert && (
            <Alert
              dismissible
              onClose={() => setShowDateAlert(false)}
              variant="warning"
              className="text-error heading-5 w-75"
              style={{ color: "#d93025" }}
            >
              Please select different Dates
            </Alert>
          )}

          {modalShow && (
            <ModalInputCenter
              show={modalShow}
              modalSize="modal-lg"
              changeShow={() => {
                setModalShow(false);
                // resetAllInputValues();
                LoadReportsStatus();
              }}
              size={"md"}
              heading={"Report Generation Details"}
              aria-labelledby="contained-modal-title-vcenter"
            >
              <div className="tableOuter m-0 shadow-none">
                <table className="table">
                  <thead>
                    <tr>
                      {allCollectionsLoaded &&
                        filterOnlyCollections()?.map((e, index) => {
                          return <th key={index}>{e.account}</th>;
                        })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {allCollectionsLoaded &&
                        filterOnlyCollections()?.map((e, index) => {
                          return (
                            <td style={{ verticalAlign: "top" }}>
                              {e.collections.map((c) => (
                                <span className="d-block" key={c.id}>
                                  <strong>{c.label}</strong>
                                </span>
                              ))}
                            </td>
                          );
                        })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </ModalInputCenter>
          )}
          {reportsDoneAlert && (
            <Alert
              dismissible
              onClose={() => setReportsDoneAlert(false)}
              variant="info"
              className="heading-5 w-75"
            >
              Reports are being generated. Please wait...
            </Alert>
          )}
        </div>
      </div>

    {/* comment report as per client's feedback */}
      {/* <ReportDisplaySection/> */}
      <div className="pt-4"></div>
    </Layout>
  );
};

export default RunReport;


// let ReportDisplaySection = ()=>{
//   return (
//     <>
//     {reportsDone && (
//         <div className="panel mb-0">
//           <div className="pHead">
//             <span className="h5">Reports</span>
//           </div>
//           <div className="pBody">
//             <div className="tableOuter">
//               <table className="table customGrid">
//                 <TableHeading headings={headingsForReportsGenerated} />
//                 <tbody>
//                   {loadReportsGenerated.slice(0, 15).map((e, index) => {
//                     return (
//                       <tr key={index}>
//                         <td>
//                           <span>{e.batch_id}</span>
//                         </td>
//                         <td>
//                           <span>{e.requested_by}</span>
//                         </td>
//                         <td>
//                           <span>{moment(e.requested_at).format("lll")}</span>
//                         </td>
//                         <td style={{ color: "orange" }}>
//                           <span>{e.count}</span>
//                         </td>
//                         <td style={{ color: determineColor(e.status) }}>
//                           <span>{e.status}</span>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   )
// }
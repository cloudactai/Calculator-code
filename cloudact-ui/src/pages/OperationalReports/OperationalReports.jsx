import { Autocomplete, TextField } from "@mui/material";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-bootstrap";
import { useHistory } from "react-router";
import reload from "../../assets/images/reload.png";

import ChecboxInput from "../../components/LayoutComponents/ChecboxInput/ChecboxInput.tsx";
import Dropdown from "../../components/Dropdown.js";
import Layout from "../../components/LayoutComponents/Layout.jsx";
import axios from "../../utils/axios.js";
import { useSelector } from "react-redux";
import { getSvg } from "./reportSvgs";
import {
  addOneDayToDate,
  clioConnectedOrNot,
  getCurrentUserFromCookies,
  getRefreshDate,
  getUserId,
  getUserSID,
  handleClientChange,
  intuitConnectedOrNot,
} from "../../utils/helpers.js";
import { AUTH_ROUTES } from "../../routes/Routes.types.ts";
import ModalInputCenter from "../../components/ModalInputCenter.jsx";

import "./OperationalReports.css";
import NumberFormat from "react-number-format";

const OperationalReports = ({ currentUserRole }) => {
  const { response } = useSelector((state) => state.userProfileInfo);
  const [customDateRangeModal, setCustomDateRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [toDate, setToDate] = useState(null);
  const [showFailedAlert, setShowFailedAlert] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [isDisabled, setIsDisabled] = useState(true);
  const [allCollections, setAllCollections] = useState([]);
  const [allCollectionsLoaded, setAllCollectionsLoaded] = useState(false);
  const [trustReport, setTrustReport] = useState([]);
  const [generalReport, setGeneralReport] = useState([]);
  const [feesReport, setFeesReport] = useState([]);
  const [creditReport, setCreditReport] = useState([]);
  const [currentTrustReport, setCurrentTrustReport] = useState(null);
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

            //when reports are processed.
            if (allProcessed(statusOfReports)) {
              setShowProcessing(false);
              clearInterval(timer);
              setReportsGeneratedAlert(true);
              //show all reports status details in modal.
            } else if (pending(statusOfReports)) {
              setShowProcessing(false);
              clearInterval(timer);
              setShowFailedAlert(true);
            }
            else {
              setShowProcessing(true);
            }
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

      .get(`/report/collection?province=${getCurrentUserFromCookies().province}&type=${1}`)

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
          function assignReports(reports) {

            let trustReport, generalReport, feesReport, creditReport;

            reports.forEach(report => {
              switch (report.category) {  // Assuming each report has a 'type' attribute
                case 'Trust':
                  trustReport = report;
                  break;
                case 'General':
                  generalReport = report;
                  break;
                case 'Other':
                  feesReport = report;
                  break;
                case 'Credit':
                  creditReport = report;
                  break;
                default:
                  console.log('Unknown report type:', report.type);
              }
            });

            setAllCollections(reports);
            setTrustReport(trustReport);
            setGeneralReport(generalReport);
            setFeesReport(feesReport);
            setCreditReport(creditReport);
          }



          assignReports(body);
          setAllCollectionsLoaded(true);
        } else {
          setAllCollectionsLoaded(true);
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

  const addDropdownAccounttrust = (type, eParent, eChild) => {
    axios
      .get(`/trust/accounts?uid=${getUserId()}&sid=${getUserSID()}`)
      .then((res) => {
        const { body } = res.data.data;
        type.collection[eParent].options[eChild].trustAccountDropdown = body;
        type.collection[eParent].options[eChild].value = '';
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

  const addDropdownAccountgeneral = (type, eParent, eChild) => {
    axios
      .get(`/general/accounts?uid=${getUserId()}&sid=${getUserSID()}`)
      .then((res) => {
        const { body } = res.data.data;
        type.collection[eParent].options[eChild].GeneralAccountDropdown = body;
        type.collection[eParent].options[eChild].value = 'All';
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

  const addDropdownResponsibleAttorney = (type, eParent, eChild) => {
    axios
      .get(`/attorney?uid=${getUserId()}&sid=${getUserSID()}`)
      .then((res) => {
        const { body } = res.data.data;
        console.log("attorney list", body);
        const filteredAttorneys = body.filter(attorney => attorney.responsible_attorney_name != null);
        type.collection[eParent].options[eChild].attorneyDropdown = [
          { responsible_attorney_name: "All" },
          ...filteredAttorneys,
        ];
        type.collection[eParent].options[eChild].value = "All";
        setStateForReportsType(type.category);

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
    if (label.includes("Trust account")) {
      addDropdownAccounttrust(chooseType(type), parentObj, childObj);
    }

    if (label.includes("General account")) {
      addDropdownAccountgeneral(chooseType(type), parentObj, childObj);
    }

    if (label.includes("Attorney")) {
      addDropdownResponsibleAttorney(chooseType(type), parentObj, childObj);
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
    console.log('CheclREportAcc', e)
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
    console.log("typeChangeClick", type, e);
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


    if (dataToPost && Object.keys(dataToPost)?.length !== 0) {
      const data = dataToPost && dataToPost?.category
        ?.map((t) => {
          return t && t?.collection?.length !== 0 && t?.collection?.map((c) => {
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
    if (type && type?.collection.length !== 0) {
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
    }

  };

  const runReport = () => {
    console.log("currentTrustReport in report", currentTrustReport)
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
        report_type: 1,
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
                : trustReportList?.map((e) => {
                  if (e.name !== "All") {
                    return e?.name;
                  }
                }),
            currentMatterOwner ? currentMatterOwner : "All",
            trustReport?.collection
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
                : creditReportList?.map((e) => {
                  if (e?.name !== "All") return e?.name;
                }),
            "",
            creditReport?.collection
          ),
          addAccount("", ["Others"], "", feesReport?.collection),
        ],
      };

      setShowAlertError("");

      setModalShow(true);


      axios
        .post("/report/collection", obj)
        .then((res) => {
          setReportsRanOnce(true);
          if (res.data.data.code === 200) {
            setDataToPost(obj);
            setReportsGeneratedDetails(res.data.data.body);
            reportBatchId.current = res.data.data.body;
            setModalShow(true);
            setReportsDoneAlert(true);
            setShowProcessing(true);
          } else {
            // console.log("allData which was send", allData);
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

      if (e.options.length > 0) {
        if (e.id === 4 || e.id === 19 || e.id === 34) {
          allInputs.push(
            <div
              className={`form-group mb-0  mt-2 ${isDisabled || !e.selected ? "d-none" : "show"
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
                className={`form-group mb-0 mt-2 ${isDisabled || !e.selected ? "d-none" : "show"
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
                addClassName={`${isDisabled || !e.selected ? "d-none" : "show"
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

          if (s.hasOwnProperty('trustAccountDropdown')) {
            allInputs.push(
              <div
                className={`form-group mb-0 mt-2 ml-4 ${isDisabled || !s.selected ? "d-none" : "show"
                  }`}
              >
                <label>Select Account</label>
                <select
                  className="form-control custom-select-operational"
                  style={{
                    border: '1px solid #73c3fd',
                    height: '40px',
                    maxWidth: '300px'
                  }}
                  value={s.value}
                  onChange={(e) => {
                    s.value = e.target.value;
                    setStateForReportsType(typename);
                  }}
                >
                   <option >Select Trust Account</option>
                  {s.trustAccountDropdown.map((option, index) => (
                    <option key={index}>{option.name}</option>
                  ))}
                </select>
              </div>

            );
          }

          if (s.hasOwnProperty('attorneyDropdown')) {
            allInputs.push(
              <div
                className={`form-group mb-0 mt-2 ml-4 ${isDisabled || !s.selected ? "d-none" : "show"}`}
              >
                <label>Select Responsible Attorney</label>
                <select
                  className="form-control custom-select-operational"
                  value={s.value}
                  onChange={(e) => {
                    s.value = e.target.value;
                    setStateForReportsType(typename);
                  }}
                  style={{
                    border: '1px solid #73c3fd',
                    height: '40px',
                    maxWidth: '300px'
                  }}
                >
                  {s.attorneyDropdown.map((option, index) => (
                    <option key={index} value={option.responsible_attorney_name}>
                      {option.responsible_attorney_name}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          

          if (s.hasOwnProperty("GeneralAccountDropdown")) {
            allInputs.push(
              <div
                className={`form-group mb-0 mt-2 ml-4 ${
                  isDisabled || !s.selected ? "d-none" : "show"
                }`}
              >
                <label>Select Account</label>
                <select
                  className="form-control custom-select-operational"
                  style={{
                    border: '1px solid #73c3fd',
                    height: '40px',
                    maxWidth: '300px'
                  }}
                  value={s.value}
                  onChange={(e) => {
                    s.value = e.target.value;
                    setStateForReportsType(typename);
                  }}
                >
                  <option >All</option>
                  {s.GeneralAccountDropdown.map((option) => (
                    <option>{option.name}</option>
                  ))}
                </select>
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
          let reportOptions = report.options.forEach((option) => {
            if (option.label.includes("Enter") && option.value === "") {
              allFilled = false;
            }

            if (option.datePicker === true && option.value === "All") {
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
            history.push(`${AUTH_ROUTES.REPORTS}?reporttype=${1}`);
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
                    fc?.collections.map((c) => {
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
                          className={`${e.status === "processed" ? "greenColor" : "redColor"
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
                          className={`${e.status === "processed" ? "greenColor" : "redColor"
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
        <div className="">
          <div className="panel">
            <div className="pHead">
              <span className="h5">
                {getSvg('Fees Book & Client General Journal')}
                Operational Reports
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
                    {/* <tr>
                      {allCollectionsLoaded &&
                        filterOnlyCollections()?.map((e, index) => {
                          return <th key={index}>{e.account}</th>;
                        })}
                    </tr> */}
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


      <div className="pt-4"></div>
    </Layout>
  );
};

export default OperationalReports;













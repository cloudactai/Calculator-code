import { useEffect, useState } from "react";
import {
  getAllUserInfo,
  getCurrentUserFromCookies,
  getFirmnameForSetup,
  getUserId,
  getUserSID,
  getEndOfDay,
  getMonthFromDigitWithCurrentYear
} from "../../utils/helpers";
import Dropdown from "react-dropdown";
import TaskSelector from "./TaskSelector";
import axios from "../../utils/axios";
import RadioInput from "../LayoutComponents/RadioInput";
import { useHistory } from "react-router-dom";
import { Alert } from "react-bootstrap";
import useQuery from "../../hooks/useQuery";
import CreateTaskForm from "./CreateTaskForm";
import ComplianceSelector from "./ComplianceSelector";
import { useDispatch, useSelector } from "react-redux";
import { matterClientsAction } from "../../actions/matterActions";
import createTaskImage from "../../assets/images/createTaskImage.svg";
import moment from "moment";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import ModalInputCenter from "../ModalInputCenter";
import toast from "react-hot-toast"
import { getSvg } from "./TasksAssets";
import Loader from "../Loader";
import { getBritishColumbiaList, getAlbertaList, getOntarioList } from "./getComplianceList";

const TaskTypeForm = ({ type }) => {
  const [generalAccountList, setGeneralAccountList] = useState([]);
  const [trustAccountList, setTrustAccountList] = useState([]);

  const [creditAccountList, setCreditAccountList] = useState([]);
  const dispatch = useDispatch();
  const [matterDisplayList, setMatterDisplayList] = useState([]);
  const [AllSelectedFiles, setAllSelectedFiles] = useState([]);

  const { data: matterClients } = useSelector((state) => state.matterClients);
  const history = useHistory();
  const query = useQuery();
  const [isFilled, setIsFilled] = useState(false);
  const [accountsList, setAccountsList] = useState([]);
  const [provinceFetched, setProvinceFetched] = useState("");
  const [loader, setLoader] = useState(false);
  const [selectedValues, setSelectedValues] = useState({
    typeOfTask: "",
    taskSelected: "",
    month: "",
    account: "",
    showError: "",
    clientNo: "",
    clientId: "",
    fileNo: [],
    province_form: "",
    clio_trust_account: "",
    clio_trust_account_id: null,
    generalAccountIdINcaseofSettlement: null,
    generalAccountIdINcaseofSettlement_id: null
  });

  console.log("selectedValuesINPUT", selectedValues);

  const [ComplianceFormData, setComplianceFormData] = useState({
    task_name: ''
  })


  // Create Task
  const [taskInfo, setTaskInfo] = useState({
    description: "",
    taskType: selectedValues.taskSelected,
    preparer: "",
    approver: "",
    showError: "",
    showAlertTask: "",
    monthChecklist: "",
    isComplianceForm: false,
    loadedPreparer: false,
    loadedReviewer: false,
    province_form: "",
    task_account: selectedValues.taskSelected,
    account_id: "",
    task_type_account: "",
    dueDate: null,
  });

  const [taskDate, settaskDate] = useState({
    task_from: '',
    task_to: ''
  });


  const [complianceFormMonth, setComplianceFormMonth] = useState({
    month: ''
  });

  const [selectedClientinfos, setSelectedClientinfos] = useState([]);

  useEffect(() => {
    const getMonthStartEndDates = (date) => {
      const start = moment(date).startOf('month').format('YYYY-MM-DD');
      const end = moment(date).endOf('month').format('YYYY-MM-DD');
      return { start, end };
    };

    if (selectedValues.month) {


      const [month, year] = selectedValues.month.split(' ');

      const { start, end } = getMonthStartEndDates(`${year}-${month}-01`);


      settaskDate({
        task_from: start,
        task_to: end
      })
    }


  }, [selectedValues.month]);


  const [preparerList, setPreparerList] = useState([]);
  const [reviewerList, setReviewerList] = useState([]);
  const [allDataFetched, setAllDataFetched] = useState([]);



  const [complianceState, setcomplianceState] = useState([{ client: {}, fileNumber: [] }]);
  const [reasonofPayment, setreasonofPayment] = useState({
    value: '',
    label: ''
  });

  console.log("complianceStateDataJSOn", JSON.stringify(complianceState));

  // Compliance from to management state 
  const [complianceFromToDates, setcomplianceFromToDates] = useState({
    task_from: null,
    task_to: null
  });

  const [complianceDataifCaseofOption1, setcomplianceDataifCaseofOption1] = useState([]);
  console.log("complianceDataifCaseofOption1", JSON.stringify(complianceDataifCaseofOption1));

  useEffect(() => {
    const taskType = selectedValues.taskSelected;
    const month = selectedValues.month;
    const account = selectedValues.taskSelected;
    const checklist = selectedValues.typeOfTask;

    const allUsers = axios.get(`/user/list/${getUserSID()}/${getUserId()}/all`);

    const generalAccountAPI = axios.get(
      `/general/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );
    const trustAccountAPI = axios.get(
      `/trust/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );

    const cardAccountAPI = axios.get(
      `/card/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );



    Promise.all([generalAccountAPI, trustAccountAPI, cardAccountAPI, allUsers])
      .then(([...res]) => {
        console.log('✌️res --->', res);
        console.log('✌️resXXXXXXXXXXXXXXXXXXXXXXXXXX --->', res[3]);

        console.log("trustAccountAPI cardAccountAPI", res[3].data.data.body)
        console.log("trustAccountAPI 12", res[2].data.data.body)

        const preparerList = Array.from(
          new Set(
            res[3].data.data.body
              .filter(({ role }) => role === "PREPARER" || role === "ADMIN")
              .map(({ username }) => username)
          )
        );

        console.log("cardAccountAPI>>", preparerList)
        // const reviewerList = res[3].data.data.body.map(
        //   ({ email, role, username }) => {
        //     if (role === "REVIEWER" || role === "ADMIN") {
        //       return username;
        //     }
        //     return null;
        //   }
        // );
        const reviewerList = Array.from(
          new Set(
            res[3].data.data.body
              .filter(({ role }) => role === "REVIEWER" || role === "ADMIN")
              .map(({ username }) => username)
          )
        );
        setPreparerList(preparerList.filter((e) => e !== null));
        setReviewerList(reviewerList.filter((e) => e !== null));
        setTaskInfo({
          ...taskInfo,
          loadedPreparer: true,
          loadedReviewer: true,
          taskType: taskType?.toUpperCase(),
          task_account: account,
          isComplianceForm: checklist === "Compliance Form" ? true : false,
          monthChecklist: month,
        });

        console.log("all users", ...res[3].data.data.body);

        setAllDataFetched([...allDataFetched, ...res[3].data.data.body]);
      })
      .catch((err) => {
        console.log("err all accounts", err);
        setTaskInfo({
          ...taskInfo,
          loadedPreparer: false,
          loadedReviewer: false,
        });

        setAllDataFetched([]);
      });
  }, [
    selectedValues.month,
    selectedValues.taskSelected,
    selectedValues.typeOfTask,
    selectedValues.taskSelected,
  ]);

  //task create function
  const handleSubmit = (e) => {
    e.preventDefault();

    let preparerName = allDataFetched.filter((e) => {
      return e.username.trim() === taskInfo.preparer.trim();
    });

    let approverName = allDataFetched.filter((e) => {
      return e.username.trim() === taskInfo.approver.trim();
    });

    if (
      taskInfo.taskType &&
      taskInfo.monthChecklist &&
      taskInfo.task_account &&
      // taskInfo.description &&
      selectedValues.account &&
      preparerName.length &&
      approverName.length &&
      taskDate.task_from &&
      taskDate.task_to &&
      taskInfo.dueDate
    ) {
      const obj = {
        task_created_by: getUserId(),
        sid: getUserSID(),

        task_type: taskInfo.taskType == 'GENERAL ACCOUNT' ? 'General A/C checklist' :
          taskInfo.taskType == 'TRUST ACCOUNT' ? 'Trust A/C checklist' :
            "Credit card checklist",

        task_month: taskInfo.monthChecklist,
        task_from: new Date(taskDate.task_from).toISOString(),
        task_to: getEndOfDay(new Date(taskDate.task_to)),
        task_due_date: new Date(taskInfo.dueDate).toISOString(),
        // task_description: `${taskInfo.description.replace(/['"]+/g, "")}`,
        task_description: "",
        task_preparer: preparerName[0]
          ? preparerName[0].uid
          : getAllUserInfo().id,
        task_approverer: approverName[0]
          ? approverName[0].uid
          : getAllUserInfo().id,
        task_approverer_name: !taskInfo.approver
          ? getAllUserInfo().username
          : taskInfo.approver,
        task_preparer_name: !taskInfo.preparer
          ? getAllUserInfo().username
          : taskInfo.preparer,
        task_type_account: selectedValues.account,
        task_account: selectedValues.account,
        task_version: 1,
        client_id: query.get("clientId") ? parseInt(query.get("clientId")) : "",
        isComplianceForm:
          query.get("checklist") === "Compliance Form" ? true : false,
        province_form: query.get("provinceForm") || '',
        clio_trust_account: query.get("clio_trust_account") || "",
        client_files_details: "",
        client_all_info: "",
        destinationFiles: "",
        reason_of_payment: "",
      };
      axios
        .post("/create/task", obj)
        .then((res) => {
          if (res.data.data.code !== 200) {
            setTaskInfo({
              ...taskInfo,
              showError: res.data.data.message,
              showAlertTask: res.data.data.message,
            });
          } else {
            history?.push(
              type === "MONTHLY_FORM"
                ? AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE
                : AUTH_ROUTES.COMPLIANCE_CHECKLIST_TABLE
            );
          }
        })
        .catch((err) => {
          console.log("err", err);
        });
    } else {
      setTaskInfo({
        ...taskInfo,
        showError: "Please Fill all the Details Above",
      });
    }
  };

  useEffect(() => {
    setLoader(true)
    axios.get(`/getcompanydata/${getUserSID()}`)
      .then((res) => {
        console.log("Province:", res.data.data[0].province);  // Log specific province
        setProvinceFetched(res.data.data[0].province);
        setLoader(false)
      })
  }, []);

  //compliance create function
  const handleComplianceFormSubmit = (e) => {

    e.preventDefault();
    const { task_from, task_to } = complianceFromToDates;

    if (
      reasonofPayment?.value === 'Settlement of invoices' &&
      (!task_from || isNaN(Date.parse(task_from)) ||
        !task_to || isNaN(Date.parse(task_to)))
    ) {
      toast.error('Please select "From" and "To" dates first.');
      return;
    }

    if (task_from, task_to &&
      reasonofPayment?.value === 'Settlement of invoices'
      && !complianceDataifCaseofOption1.length
    ) {
      console.log("complianceDataifCaseofOption1", complianceDataifCaseofOption1);
      toast.error('No transactions found for the selected date range.');
      return;
    }



    let preparerName = allDataFetched.filter((e) => {
      return e.username.trim() === taskInfo.preparer.trim();
    });

    let approverName = allDataFetched.filter((e) => {
      return e.username.trim() === taskInfo.approver.trim();
    });

    // in selectedClientinfos have filter those value which exist in 
    // complianceState other are moved 

    const complianceClientIds = complianceState.map(item => Number(item.client.client_id));

    let clientAllInfo = selectedClientinfos.filter((e) => {
      return complianceClientIds.includes(e.client_id);
    });


    if (
      taskInfo.taskType &&
      taskInfo.task_account &&
      selectedValues.taskSelected &&
      preparerName.length &&
      approverName.length &&
      taskInfo.dueDate &&
      ComplianceFormData.task_name
    ) {
      const obj = {
        task_created_by: getUserId(),
        sid: getUserSID(),
        task_type: selectedValues.taskSelected.toUpperCase(),
        task_month: getMonthFromDigitWithCurrentYear(new Date().getMonth() + 1),
        task_from: complianceFromToDates.task_from ? complianceFromToDates.task_from : new Date(Date.now()).toISOString(),
        task_to: complianceFromToDates.task_to ? complianceFromToDates.task_to : getEndOfDay(new Date(Date.now())),
        task_name: ComplianceFormData.task_name,
        client_matter: selectedValues.clientNo,
        task_description: "",
        task_preparer: preparerName[0]
          ? preparerName[0].uid
          : getAllUserInfo().id,
        task_approverer: approverName[0]
          ? approverName[0].uid
          : getAllUserInfo().id,
        task_approverer_name: !taskInfo.approver
          ? getAllUserInfo().username
          : taskInfo.approver,
        task_preparer_name: !taskInfo.preparer
          ? getAllUserInfo().username
          : taskInfo.preparer,
        task_account: selectedValues.fileNo,
        task_type_account: selectedValues.clio_trust_account,
        task_version: 1,
        client_id: selectedValues.clientId ? selectedValues.clientId : '00',
        isComplianceForm: true,
        province_form: query.get("provinceForm"),
        clio_trust_account: selectedValues.clio_trust_account_id,
        task_due_date: new Date(taskInfo.dueDate).toISOString(),
        // client_files_details: JSON.stringify(complianceState),
        client_files_details: reasonofPayment?.value === 'Settlement of invoices' ? JSON.stringify(complianceDataifCaseofOption1) : JSON.stringify(complianceState),
        client_all_info: JSON.stringify(clientAllInfo),
        destinationFiles: JSON.stringify(AllSelectedFiles),
        reason_of_payment: reasonofPayment?.value,
        generalAccount: { id: selectedValues.generalAccountIdINcaseofSettlement_id, name: selectedValues.generalAccountIdINcaseofSettlement },

      };
      axios.post("/create/task", obj).then((res) => {
        console.log('✌️ossssssssssbj --->', obj);
        if (res.data.data.code !== 200) {
          setTaskInfo({
            ...taskInfo,
            showError: res.data.data.message,
            showAlertTask: res.data.data.message,
          });
        } else {
          history.push(
            type === "MONTHLY_FORM"
              ? AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE
              : AUTH_ROUTES.COMPLIANCE_CHECKLIST_TABLE
          );
        }
      })
        .catch((err) => {
          toast.error("Err:", err.message)
          console.log("err", err);
        });
    } else {
      setTaskInfo({
        ...taskInfo,
        showError: "Please Fill all the Details Above",
      });
    }
  }

  // End of Create Task

  const checkSelection = () => {
    const { typeOfTask, taskSelected, month, account, clientNo, fileNo } =
      selectedValues;
    if (typeOfTask === "Compliance Form") {
      return (
        typeOfTask !== "" &&
        taskSelected !== "" &&
        clientNo !== "" &&
        fileNo !== ""
      );
    } else {
      return (
        typeOfTask !== "" &&
        taskSelected !== "" &&
        month !== "" &&
        account !== ""
      );
    }
  };

  const emptyStateForSelectedValues = {
    taskSelected: "",
    month: "",
    account: "",
    showError: "",
    clientNo: "",
    fileNo: "",
  };

  useEffect(() => {
    if (query.get("checklist") !== null && query.get("month") !== null) {
      console.log("query", query.get("checklist"));
      setIsFilled(true);
    } else {
      setIsFilled(false);
    }
  }, [query, history?.location?.search]);

  useEffect(() => {
    if (selectedValues.clientNo) {
      const getMatterDisplayNumbers = async () => {
        try {
          const {
            data: {
              data: { body },
            },
          } = await axios.get(
            `/matterdisplayNumber/${getUserSID()}/${selectedValues.clientId}`
          );

          if (body) {
            // setMatterDisplayList(body);
            console.log("before b body", body);


            const uniqueBody = [...new Set(body)];
            console.log("after sort body", uniqueBody);


            setMatterDisplayList(uniqueBody);
            setAllSelectedFiles((prev) => [...prev, ...uniqueBody])

          }
        } catch (error) {
          console.log("err", error);
          alert("Error fetching matter display Number");
        }
      };
      getMatterDisplayNumbers();

      const getClientInfowithClientID = async () => {
        console.log("client id in new fun", selectedValues.clientId);

        try {
          const myres = await axios.get(
            `/getClientInfowithClientID/${getUserSID()}/${selectedValues.clientId}`
          );

          if (myres?.data?.data?.body.length !== 0) {

            setSelectedClientinfos((prev) => ([...prev, myres?.data?.data?.body[0]]))
          }

        } catch (error) {
          console.log("err", error);
          alert("Error fetching getClientInfowithClientID");
        }



      };
      getClientInfowithClientID();


    }
  }, [selectedValues.clientNo, selectedValues.clientId]);

  useEffect(() => {
    const getTrustAccountNumbers = async () => {
      try {
        const {
          data: {
            data: { body },
          },
        } = await axios.get(`/clio-accounts/${getUserSID()}/Trust`);

        if (body) {
          console.log("trust account Number", body);
          setAccountsList(body);
        }
      } catch (error) {
        console.log("err", error);
        alert("Error fetching Trust account Number");
      }
    };
    getTrustAccountNumbers();
  }, []);

  useEffect(() => {
    const allUsers = axios.get(`/user/list/${getUserSID()}/${getUserId()}`);

    dispatch(matterClientsAction());
    const generalAccountAPI = axios.get(
      `/general/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );
    const trustAccountAPI = axios.get(
      `/trust/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );



    const cardAccountAPI = axios.get(
      `/card/accounts?uid=${getUserId()}&sid=${getUserSID()}`
    );

    Promise.all([generalAccountAPI, trustAccountAPI, cardAccountAPI, allUsers])
      .then(([...res]) => {
        console.log("res all accounts", res);

        const generalAccounts = res[0].data.data.body.map((element) => element);
        const trustAccounts = res[1].data.data.body.map((element) => element);

        const cardAccounts = res[2].data.data.body.map((element) => element);

        setGeneralAccountList(generalAccounts);
        setTrustAccountList(trustAccounts);

        setCreditAccountList(cardAccounts);
      })
      .catch((err) => {
        console.log("err all accounts", err);
        alert("Error fetching all accounts");
      });
  }, [dispatch]);
  console.log('✌️defdefdefdgedgdvgevded --->', selectedValues.generalAccountIdINcaseofSettlement_id);

  useEffect(() => {
    if (complianceFromToDates.task_from && complianceFromToDates.task_to) {
      axios.post(
        `/getTransactionByDateRange`, {
        start_date: complianceFromToDates.task_from,
        end_date: complianceFromToDates.task_to,
        trustAccountid: selectedValues.clio_trust_account_id,
        accountName: selectedValues.generalAccountIdINcaseofSettlement,
        sid: getUserSID()
      }
      ).then((res) => {
        let modifyedData = transformData(res.data);
        setcomplianceDataifCaseofOption1(modifyedData);
      }).catch((err) => {
        console.log("err transaction accounts", err);
      })

      console.log('CheckEffecthere', complianceFromToDates.task_from, complianceFromToDates.task_to)
    }

  }, [complianceFromToDates.task_from, complianceFromToDates.task_to]);

  const onChangeDropFunc = (param, e) => {

    if (param === "month") {
      setSelectedValues({ ...selectedValues, month: e });
    } else {
      setSelectedValues({ ...selectedValues, account: e });
    }
  };
  const dropdownValue = (param, type) => {
    if (param === "month" && type === selectedValues.taskSelected) {
      return selectedValues.month;
    } else if (param === "account" && type === selectedValues.taskSelected) {
      return selectedValues.account;
    } else {
      return "";
    }
  };

  const changeInputValue = (params, e) => {
    console.log('✌️essssssssssssssss --->', e);
    console.log('✌️parsssssssssssssssssssams --->', params);
    console.log("change input value", params, e);
    if (params === "ClientNo") {
      return setSelectedValues({
        ...selectedValues,
        clientNo: e?.client_name,
        clientId: e?.client_id,
        fileNo: "",
      });
    } else if (params === "FileNo") {
      console.log("change input value", params, e);
      return setSelectedValues({ ...selectedValues, fileNo: e });
    } else if (params === "cliotrustAccount") {
      console.log("clio trust ", e);
      return setSelectedValues({
        ...selectedValues,
        clio_trust_account: e.account_name,
        clio_trust_account_id: e.bank_account_id,
      });
    } else if (params === "generalAccountInCaseofSettlement") {
      return setSelectedValues({
        ...selectedValues,
        generalAccountIdINcaseofSettlement: e.value.account_name,
        generalAccountIdINcaseofSettlement_id: e.value.bank_account_id
      });
    }
    else {
      return "";
    }
  };

  const getInputValue = (params, type) => {
    if (params === "ClientNo" && type) {
      return selectedValues.clientNo;
    } else if (params === "FileNo" && type) {
      return selectedValues.fileNo;
    } else {
      return "";
    }
  };

  let complianceFormParent = {
    month: complianceFormMonth.month,
    task_from: taskDate.task_from,
    task_to: taskDate.task_to
  }


  function transformData(inputData) {
    const result = [];
    const clientMap = new Map();

    inputData.forEach(item => {
      const clientKey = item.client_id;
      console.log('checkAllacmout', item)
      const matterDetails = {
        matter_display_nbr: item.matter_display_number,
        client_id: clientKey,
        matter_description: item.matter_description,
        amount: item.funds_out
      };

      if (clientMap.has(clientKey)) {
        clientMap.get(clientKey).fileNumber.push(matterDetails);
      } else {
        const clientData = {
          client: {
            client_name: item.client_name,
            client_id: clientKey,
            matter_display_nbr: item.matter_display_number,
            responsible_attorney_name: item.responsible_attorney_name,
            responsible_attorney_email: item.originating_attorney_email,
            originating_attorney_email: item.originating_attorney_email,
            originating_attorney_name: item.originating_attorney_name,
            practice_area_name: item.practice_area_name,
            bank_transactions_id: item.bank_transactions_id,
            reference: item.bill_number
          },
          fileNumber: [matterDetails]
        };

        clientMap.set(clientKey, clientData);
        result.push(clientData);
      }
    });

    return result;
  }






  return (
    <>
      <>
        <Loader isLoading={loader} loadingMsg="Loading..." />
      </>
      <>
        {!isFilled ? (
          <>
            <div className="outerTitle">
              <div className="pHead p-0" style={{ minHeight: "60px" }}>
                <span className="h5">
                  {getSvg("Add Task")}
                  Add Task
                </span>
              </div>
            </div>
            <div className="panel Hauto addTaskPanel">
              <div className="pBody">
                <div className="row align-items-center">
                  <div className="col-md-9">
                    <div className="row">
                      <div className="col-md-5">
                        <div className="pHead pt-0">
                          <span className="h5">
                            {getSvg('Write task name ')}
                            Write task name
                          </span>
                        </div>
                        {type === "MONTHLY_FORM" && (
                          <form onSubmit={handleSubmit}>
                            <div className="row">
                              <div className="form-group">
                                <label>Task Name</label>
                                <input
                                  className="form-control"
                                  type="text"
                                  name='text_name'
                                  onChange={(e) => {
                                    setComplianceFormData((prev) => ({
                                      ...prev,
                                      task_name: e.target.value
                                    }))
                                  }}
                                  value={ComplianceFormData.task_name}
                                ></input>
                              </div>

                              <div className="col-md-12">
                                <div className="pHead pt-0">
                                  <span className="h5">
                                    {getSvg('Choose Due Date')}
                                    Choose Due Date
                                  </span>
                                </div>
                                <div className="form-group">
                                  <input
                                    type="date"
                                    className={`form-control`}
                                    name="start"
                                    value={taskInfo.dueDate}
                                    onChange={(e) => {
                                      setTaskInfo({
                                        ...taskInfo,
                                        dueDate: e.target.value,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            {taskInfo.showError && (
                              <Alert variant="info" className="mt-3 heading-5">
                                {taskInfo.showError}
                              </Alert>
                            )}
                          </form>
                        )}

                        {type !== "MONTHLY_FORM" && (
                          <form onSubmit={handleSubmit}>
                            <div className="row">
                              <div className="col-md-12">
                                <div className="form-group">
                                  <label>Task Name</label>
                                  <input
                                    className="form-control"
                                    type="text"
                                    name='text_name'
                                    onChange={(e) => {
                                      setComplianceFormData((prev) => ({
                                        ...prev,
                                        task_name: e.target.value
                                      }))
                                    }}
                                    value={ComplianceFormData.task_name}
                                  ></input>
                                </div>
                              </div>
                              <div className="col-md-12">
                                <div className="pHead pt-0">
                                  <span className="h5">
                                    {getSvg("Choose Due Date")}
                                    Choose Due Date
                                  </span>
                                </div>
                                <div className="form-group">
                                  <input
                                    type="date"
                                    className={`form-control`}
                                    name="start"
                                    value={taskInfo.dueDate}
                                    onChange={(e) => {
                                      setTaskInfo({
                                        ...taskInfo,
                                        dueDate: e.target.value,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            {taskInfo.showError && (
                              <Alert variant="info" className="mt-3 heading-5">
                                {taskInfo.showError}
                              </Alert>
                            )}
                          </form>

                        )}
                      </div>
                      <div className="col-md-5 offset-md-1 taskAddOpt">
                        <div className="pHead pt-0">
                          <span className="h5">
                            {getSvg('Select monthly review checklist')}
                            {/* Select monthly review checklist */}
                            {
                              type === "MONTHLY_FORM" ?
                                "Select monthly review checklist" :
                                "Select compliance form"
                            }
                          </span>
                        </div>
                        {type === "MONTHLY_FORM" && (
                          <>
                            <RadioInput
                              onChangeFunc={() =>
                                setSelectedValues({
                                  ...emptyStateForSelectedValues,
                                  typeOfTask: "Monthly review checklist",
                                })
                              }
                              checked={
                                selectedValues.typeOfTask ===
                                "Monthly review checklist"
                              }
                              name="TypeOfTask"
                              label="Monthly review checklist"
                            />
                            {[
                              {
                                typeOfTask: "Trust Account",
                                accounts: trustAccountList,
                              },
                              {
                                typeOfTask: "General Account",
                                accounts: generalAccountList,
                              },
                              {
                                typeOfTask: "Credit Card",
                                accounts: creditAccountList,
                              },
                            ].map((e, index) => {
                              return (
                                <TaskSelector
                                  key={index}
                                  isDisabled={
                                    selectedValues.typeOfTask !==
                                    "Monthly review checklist" &&
                                    selectedValues.taskSelected !== e.typeOfTask
                                  }
                                  taskType={e.typeOfTask}
                                  onChangeFunc={() =>
                                    setSelectedValues({
                                      ...selectedValues,
                                      taskSelected: e.typeOfTask,
                                      month: "",
                                      account: "",
                                    })
                                  }
                                  value={(param, type) =>
                                    dropdownValue(param, type)
                                  }
                                  amountValue={taskInfo.task_type_account}
                                  onChangeDropFunc={(value, e, type, all) => {
                                    onChangeDropFunc(value, e, type, all);
                                  }}
                                  checked={
                                    selectedValues.taskSelected === e.typeOfTask
                                  }
                                  account={e.accounts}
                                  onChangeFromToDate={(date) => {
                                    settaskDate((prev) => ({
                                      ...prev,
                                      [date.target.name]: date.target.value
                                    }))
                                  }}
                                  onChangeGetAccountId={(account_id) => {
                                    console.log("checkchnagefun", account_id)
                                    setTaskInfo((prev) => ({
                                      ...prev,
                                      account_id: account_id
                                    }))
                                  }}
                                  FromTovalue={taskDate}
                                />
                              );
                            })}
                            <>
                              <div className="pHead">
                                <span className="h5">
                                  {
                                    getSvg('Assign preparer and approver')
                                  }
                                  Assign preparer and approver
                                </span>
                              </div>
                              <div className="form-group">
                                <label>Assign Preparer: </label>
                                {taskInfo.loadedPreparer &&
                                  taskInfo.loadedReviewer && (
                                    <Dropdown
                                      options={preparerList}
                                      placeholder="List of Preparers"
                                      onChange={(e) => {
                                        setTaskInfo({
                                          ...taskInfo,
                                          preparer: e.value,
                                        });
                                      }}
                                    />
                                  )}
                              </div>
                              {taskInfo.showAlertTask && (
                                <ModalInputCenter
                                  heading="Task Already exists!"
                                  cancelOption="Ok"
                                  handleClick={() => {
                                    setTaskInfo({
                                      ...taskInfo,
                                      showAlertTask: "",
                                    });
                                  }}
                                  changeShow={() => {
                                    setTaskInfo({
                                      ...taskInfo,
                                      showAlertTask: "",
                                    });
                                    history.push(
                                      AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE
                                    );
                                  }}
                                  show={taskInfo.showAlertTask}
                                  action=""
                                >
                                  Task with the same details already exists.
                                  Please complete the task first.
                                </ModalInputCenter>
                              )}
                              <div className="form-group">
                                <label>Assign Approver: </label>
                                {taskInfo.loadedPreparer &&
                                  taskInfo.loadedReviewer && (
                                    <Dropdown
                                      options={
                                        reviewerList
                                          ? [...reviewerList]
                                          : getFirmnameForSetup()
                                      }
                                      onChange={(e) => {
                                        setTaskInfo({
                                          ...taskInfo,
                                          approver: e.value,
                                        });
                                      }}
                                      placeholder="List of Approvers"
                                    />
                                  )}
                              </div>

                            </>
                          </>
                        )}

                        {type !== "MONTHLY_FORM" && (
                          <>
                            <RadioInput
                              onChangeFunc={() =>
                                setSelectedValues({
                                  typeOfTask: "Compliance Form",
                                  ...emptyStateForSelectedValues,
                                })
                              }
                              checked={
                                selectedValues.typeOfTask === "Compliance Form"
                              }
                              name="TypeOfTask"
                              label="Compliance Form"
                            />
                            {getOntarioList.map((e, index) => {
                              console.log("provinceFetched", provinceFetched)
                              return (
                                // getCurrentUserFromCookies().province === "ON" && (

                                provinceFetched === "ON" && (
                                  <ComplianceSelector
                                    complianceState={complianceState}
                                    setcomplianceState={setcomplianceState}
                                    reasonofPayment={reasonofPayment}
                                    setreasonofPayment={setreasonofPayment}
                                    generalAccountList={generalAccountList}
                                    complianceFromToDates={complianceFromToDates}
                                    setcomplianceFromToDates={setcomplianceFromToDates}
                                    key={index}
                                    handleInputChange={(params, e) =>
                                      changeInputValue(params, e)}
                                    options={matterClients ? matterClients : []}
                                    options2={matterDisplayList ? matterDisplayList : ["Please select the Client First"]}
                                    isDisabled={selectedValues.typeOfTask !== "Compliance Form"}
                                    onChangeFunc={() => {
                                      setreasonofPayment("")
                                      setSelectedValues({
                                        ...selectedValues,
                                        taskSelected: e.label,
                                        province_form: e.province,
                                        clientNo: "",
                                        fileNo: "",
                                      })
                                    }
                                    }
                                    state={{ ...selectedValues, accountsList }}
                                    name="complianceType"
                                    getInputValue={(params, isSelected) =>
                                      getInputValue(params, isSelected)
                                    }
                                    data={e}
                                  />
                                )
                              );
                            })}

                            {getAlbertaList.map((e, index) => {
                              return (
                                // getCurrentUserFromCookies().province === "AB" && (
                                provinceFetched === "AB" && (
                                  <ComplianceSelector
                                    complianceState={complianceState}
                                    generalAccountList={generalAccountList}
                                    setcomplianceState={setcomplianceState}
                                    reasonofPayment={reasonofPayment}
                                    setreasonofPayment={setreasonofPayment}
                                    complianceFromToDates={complianceFromToDates}
                                    setcomplianceFromToDates={setcomplianceFromToDates}
                                    key={index}
                                    handleInputChange={(params, e) =>
                                      changeInputValue(params, e)
                                    }
                                    options={matterClients ? matterClients : []}
                                    options2={
                                      matterDisplayList
                                        ? matterDisplayList
                                        : ["Please select the Client First"]
                                    }
                                    isDisabled={
                                      selectedValues.typeOfTask !==
                                      "Compliance Form"
                                    }
                                    onChangeFunc={() => {
                                      setreasonofPayment("")
                                      setSelectedValues({
                                        ...selectedValues,
                                        taskSelected: e.label,
                                        province_form: e.province,
                                        clientNo: "",
                                        fileNo: "",
                                      })
                                    }}
                                    state={{ ...selectedValues, accountsList }}
                                    name="complianceType"
                                    getInputValue={(params, isSelected) =>
                                      getInputValue(params, isSelected)
                                    }
                                    data={e}
                                  />
                                )
                              );
                            })}

                            {getBritishColumbiaList.map((e, index) => {
                              return (
                                // getCurrentUserFromCookies().province === "BC" && (
                                provinceFetched === "BC" && (
                                  <ComplianceSelector
                                    complianceState={complianceState}
                                    generalAccountList={generalAccountList}
                                    setcomplianceState={setcomplianceState}
                                    reasonofPayment={reasonofPayment}
                                    setreasonofPayment={setreasonofPayment}
                                    complianceFromToDates={complianceFromToDates}
                                    setcomplianceFromToDates={setcomplianceFromToDates}
                                    key={index}
                                    handleInputChange={(params, e) =>
                                      changeInputValue(params, e)
                                    }
                                    options={matterClients ? matterClients : []}
                                    options2={
                                      matterDisplayList
                                        ? matterDisplayList
                                        : ["Please select the Client First"]
                                    }
                                    isDisabled={
                                      selectedValues.typeOfTask !==
                                      "Compliance Form"
                                    }
                                    onChangeFunc={() => {
                                      setreasonofPayment('')
                                      setSelectedValues({
                                        ...selectedValues,
                                        taskSelected: e.label,
                                        province_form: e.province,
                                        clientNo: "",
                                        fileNo: "",
                                      })
                                    }}
                                    state={{ ...selectedValues, accountsList }}
                                    name="complianceType"
                                    getInputValue={(params, isSelected) =>
                                      getInputValue(params, isSelected)
                                    }
                                    data={e}
                                  />
                                )
                              );
                            })}
                            <>
                              <div className="pHead">
                                <span className="h5">
                                  {getSvg("Assign preparer and approver")}
                                  Assign preparer and approver
                                </span>
                              </div>
                              <div className="form-group">
                                <label>Assign Preparer: </label>
                                {taskInfo.loadedPreparer &&
                                  taskInfo.loadedReviewer && (
                                    <Dropdown
                                      options={preparerList}
                                      placeholder="List of Preparers"
                                      onChange={(e) => {
                                        setTaskInfo({
                                          ...taskInfo,
                                          preparer: e.value,
                                        });
                                      }}
                                    />
                                  )}
                              </div>
                              <div className="form-group">
                                <label>Assign Approver: </label>
                                {taskInfo.loadedPreparer &&
                                  taskInfo.loadedReviewer && (
                                    <Dropdown
                                      options={
                                        reviewerList
                                          ? [...reviewerList]
                                          : getFirmnameForSetup()
                                      }
                                      onChange={(e) => {
                                        setTaskInfo({
                                          ...taskInfo,
                                          approver: e.value,
                                        });
                                      }}
                                      placeholder="List of Approvers"
                                    />
                                  )}
                              </div>
                            </>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 text-end">
                    <img src={createTaskImage}></img>
                  </div>
                </div>
                {selectedValues.showError && (
                  <Alert
                    dismissible
                    className="my-3 heading-5"
                    style={{ textAlign: "left" }}
                    variant="info"
                    onClose={() =>
                      setSelectedValues((prev) => ({ ...prev, showError: "" }))
                    } >
                    {selectedValues.showError}
                  </Alert>
                )}
                <div className="btnGroup">
                  <button
                    onClick={type === "MONTHLY_FORM" ? handleSubmit : handleComplianceFormSubmit}
                    className="btn btnPrimary ms-auto"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
            <div className="pb-4"></div>
          </>
        ) : (
          <CreateTaskForm type={type} data={complianceFormParent} />
        )}
      </>
    </>
  );
};

export default TaskTypeForm;


import { useEffect, useState } from "react";
import {
  getFirmnameForSetup,
  getUserId,
  getUserSID,
} from "../../utils/helpers";
import Dropdown from "react-dropdown";
import axios from "../../utils/axios";
import { useHistory } from "react-router-dom";
import { Alert } from "react-bootstrap";
import useQuery from "../../hooks/useQuery";
import { useDispatch, useSelector } from "react-redux";
import createWorkflowImage from "../../assets/images/CreateWorkflowImage.svg";
import moment from "moment";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import { getSvg } from "./WorkflowAssets";
import Loader from "../Loader";
import WorkflowLogo from '../../assets/images/workflow.svg'
import { findDueDateFromStartDate } from "../../utils/Dates/DateManipulation";

const WorkflowTypeForm = ({ type }) => {
  const dispatch = useDispatch();

  const history = useHistory();
  const query = useQuery();
  const [isFilled, setIsFilled] = useState(false);
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

  const [WorkflowData, setWorkflowData] = useState({
    workflowName: '',
    workflowType: "",
    preparer: "",
    approver: "",
    startDate: null,
    dueDate: null,
    startedBy: getUserId(),
    sid: getUserSID(),
    fileUrl: ""
  })


  // Create Task
  const [taskInfo, setTaskInfo] = useState({
    workflowName: "",
    workflowType: "",
    taskType: selectedValues.taskSelected,
    preparer: "",
    approver: "",
    showError: "",
    showAlertTask: "",
    loadedPreparer: false,
    loadedReviewer: false,
    startDate: null,
    dueDate: null,
  });

  useEffect(() => {
    const getMonthStartEndDates = (date) => {
      const start = moment(date).startOf('month').format('YYYY-MM-DD');
      const end = moment(date).endOf('month').format('YYYY-MM-DD');
      return { start, end };
    };
    if (selectedValues.month) {
      const [month, year] = selectedValues.month.split(' ');
      const { start, end } = getMonthStartEndDates(`${year}-${month}-01`);
    }


  }, [selectedValues.month]);


  const [preparerList, setPreparerList] = useState([]);
  const [reviewerList, setReviewerList] = useState([]);
  const [workflowTypesList, setworkflowTypesList] = useState(['Bank Reconciliation']);
  const [allDataFetched, setAllDataFetched] = useState([]);

  useEffect(() => {
    const taskType = selectedValues.taskSelected;
    const month = selectedValues.month;
    const account = selectedValues.taskSelected;
    const checklist = selectedValues.typeOfTask;

    const allUsers = axios.get(`/user/list/${getUserSID()}/${getUserId()}/all`);
    Promise.all([allUsers])
      .then(([...res]) => {
        console.log({allResponse: res});
        const preparerList = Array.from(
          new Set(
            res[0].data.data.body
              .filter(({ role }) => role === "PREPARER" || role === "ADMIN")
              .map(({ username }) => username)
          )
        );
        const reviewerList = Array.from(
          new Set(
            res[0].data.data.body
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

        setAllDataFetched([...allDataFetched, ...res[0].data.data.body]);
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
  const handleSubmit = async(e) => {
    e.preventDefault();
    try{
        try{
            const allDataResponse = await axios.get(
                `/getBillingDetail/bill/${getUserSID()}/${getUserId()}`
                );
                const allData = allDataResponse.data.data;
                
                const billingFrequency = allData[0]?.billing_info.billing_cycle;
                console.log(billingFrequency);
                const dueDate = findDueDateFromStartDate(new Date(WorkflowData.startDate), billingFrequency??'Weekly');
                WorkflowData['dueDate']= dueDate;
            }catch(error){
                console.log(error)
            }

            let preparerName = allDataFetched.filter((e) => {
                return e.username.trim() === WorkflowData.preparer;
            });
            let approverName = allDataFetched.filter((e) => {
                return e.username.trim() === WorkflowData.approver;
            });

            const payload = {...WorkflowData, preparerId: preparerName[0].uid, approverId: approverName[0].uid };
            const response = await axios.post('/addNewWorkflow', payload);
            if(response){
                history.push(AUTH_ROUTES.WORKFLOW_LIST)
            }
            return;
    }catch(error){
        console.log(error)
    }
  };

  useEffect(() => {
    if (query.get("checklist") !== null && query.get("month") !== null) {
      console.log("query", query.get("checklist"));
      setIsFilled(true);
    } else {
      setIsFilled(false);
    }
  }, [query, history?.location?.search]);

  return (
    <>
      <>
        <Loader isLoading={loader} loadingMsg="Loading..." />
      </>
      <>
          <>
            <div className="outerTitle">
              <div className="pHead p-0" style={{ minHeight: "60px" }}>
                <span className="h5" style={{gap: "8px"}}>
                  {/* {getSvg("Add Workflow")} */}
                  <img src={WorkflowLogo} alt="Workflow Icon" width="24" height="24" />
                  Add Workflow
                </span>
              </div>
            </div>
            <div className="panel Hauto addTaskPanel">
              <div className="pBody">
                <div className="row ">
                  <div className="col-md-6">
                  <div className="row align-items-end">
                    <div className="col-md-11">
                        <div className="pHead pt-0">
                          <span className="h5">
                            {getSvg("Write task name")}
                            Workflow name and description
                          </span>
                        </div>
               
                          <form onSubmit={handleSubmit}>
                          
                              <div className="form-group">
                                <label>Workflow name</label>
                                <input
                                  className="form-control"
                                  type="text"
                                  name='text_name'
                                  onChange={(e) => {
                                    setWorkflowData((prev) => ({
                                      ...prev,
                                      workflowName: e.target.value
                                    }))
                                  }}
                                  value={WorkflowData.workflowName}
                                ></input>
                              </div>
                              

                              <div >
                                <div className="pHead pt-0">
                                  <span className="h5">
                                    {getSvg("Choose Due Date")}
                                    Select workflow-start date
                                  </span>
                                </div>
                                <div className="form-group">
                                  <input
                                    type="date"
                                    className={`form-control`}
                                    name="start"
                                    placeholder="choose"
                                    value={WorkflowData.startDate}
                                    onChange={(e) => {
                                        setWorkflowData((prev) => ({
                                            ...prev,
                                            startDate: e.target.value
                                          }))
                                    }}
                                  />
                                </div>
                              </div>
                           
                            {taskInfo.showError && (
                              <Alert variant="info" className="mt-3 heading-5">
                                {taskInfo.showError}
                              </Alert>
                            )}
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
                                      placeholder="Choose Preparers"
                                      onChange={(e) => {
                                        console.log({e});
                                        setWorkflowData((prev) => ({
                                            ...prev,
                                            preparer: e.value
                                          }))
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
                                        setWorkflowData((prev) => ({
                                            ...prev,
                                            approver: e.value
                                          }))
                                      }}
                                      placeholder="Choose Approvers"
                                    />
                                  )}
                              </div>
                            </>
                          </form>
                        
                      </div>
                    </div>
                  </div>
                  <div className="col-md-5" >
                  <div className="pHead pt-0">
                          <span className="h5">
                            {getSvg("Choose Type")}
                            Select type of Workflow
                          </span>
                        </div>
                    <div className="form-group">
                                    <label>Type of workflow</label>
                                        <Dropdown
                                        options={
                                            workflowTypesList
                                            ? [...workflowTypesList]
                                            : getFirmnameForSetup()
                                        }
                                        onChange={(e) => {
                                            setWorkflowData((prev)=>({
                                                ...prev,
                                                workflowType: e.value
                                            }));
                                        }}
                                        placeholder="Choose workflow"
                                        />
                                   
                        </div>
                        <div></div>
                        <div className="col-md-3 text-end">
                                <img src={createWorkflowImage}></img>
                        </div>
                    
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
                    onClick={handleSubmit }
                    className="btn btnPrimary ms-auto"
                  >
                    Add Workflow
                  </button>
                </div>
              </div>
            </div>
            <div className="pb-4"></div>
          </>
        
      </>
    </>
  );
};

export default WorkflowTypeForm;


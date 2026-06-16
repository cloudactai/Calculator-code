import React, { useEffect, useState } from "react";
import { Alert, Container } from "react-bootstrap";
import Dropdown from "react-dropdown";
import { useHistory } from "react-router";
import ClipLoader from "react-spinners/ClipLoader";
import useQuery from "../../hooks/useQuery";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import axios from "../../utils/axios";
import createTaskImage from "../../assets/images/createTaskImage.svg";
import {
  getAllUserInfo,
  getFirmnameForSetup,
  getUserId,
  getUserSID,
  getEndOfDay
} from "../../utils/helpers";
import ModalInputCenter from "../ModalInputCenter";

const CreateTaskForm = ({
  type,
  selectedMonth,
  selectedAccount,
  selectedChecklist,
  selectedType,
  data
}) => {
  let query = useQuery();

  let {month ,task_from ,task_to } = data;

  
  const [taskInfo, setTaskInfo] = useState({
    description: "",
    taskType: selectedType,
    preparer: "",
    approver: "",
    showError: "",
    showAlertTask: "",
    monthChecklist: "",
    isComplianceForm: false,
    loadedPreparer: false,
    loadedReviewer: false,
    province_form: "",
    task_account: selectedAccount,
    dueDate :''
  });

  console.log("chektaskinfoMonth",taskInfo)
  const history = useHistory();
  const [preparerList, setPreparerList] = useState([]);
  const [reviewerList, setReviewerList] = useState([]);
  const [allDataFetched, setAllDataFetched] = useState([]);
  // const [monthDropdown, setMonthDropdown] = useState(last12Months());
  // const [generalAccountList, setGeneralAccountList] = useState([]);
  // const [trustAccountList, setTrustAccountList] = useState([]);
  // const [creditAccountList, setCreditAccountList] = useState([]);

  const [showWordCountAlert, setShowWordCountAlert] = useState("");

  // const dropdownTaskType = [
  //   "Trust Monthly",
  //   "General Monthly",
  //   "Credit Card Monthly",
  // ];

  useEffect(() => {
    const taskType = query.get("type") || selectedType;
    const month = query.get("month") || selectedMonth;
    const account = query.get("account") || selectedAccount;
    const checklist = query.get("checklist") || selectedChecklist;
    const provinceForm = query.get("provinceForm");

    console.log("province Form", provinceForm);

    const allUsers = axios.get(`/user/list/${getUserSID()}/${getUserId()}`);

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

        // const generalAccounts = res[0].data.data.body.map(({ name }) => name);
        // const trustAccounts = res[1].data.data.body.map(({ name }) => name);
        // const cardAccounts = res[2].data.data.body.map(({ name }) => name);
        const preparerList = res[3].data.data.body.map(
          ({ email, role, username }) => {
            if (role === "PREPARER") {
              return username;
            }
            return null;
          }
        );
        const reviewerList = res[3].data.data.body.map(
          ({ email, role, username }) => {
            if (role === "REVIEWER") {
              return username;
            }
            return null;
          }
        );

        // setGeneralAccountList(generalAccounts);
        // setTrustAccountList(trustAccounts);
        // setCreditAccountList(cardAccounts);
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
  }, [type, selectedMonth, selectedAccount, selectedChecklist, selectedType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("e", e);
    console.log("all data fetched", allDataFetched);
    let preparerName = allDataFetched.filter((e) => {
      return e.username.trim() === taskInfo.preparer;
    });

    let approverName = allDataFetched.filter((e) => {
      return e.username.trim() === taskInfo.approver;
    });

    if (
      taskInfo.taskType &&
      taskInfo.monthChecklist &&
      taskInfo.task_account &&
      taskInfo.description && 
      taskInfo.dueDate
    ) {
      const obj = {
        task_created_by: getUserId(),
        sid: getUserSID(),
        task_type: taskInfo.taskType.toUpperCase(),
        task_month: month,
        task_from : task_from,
        task_to:task_from,

        task_from: new Date(task_from).toISOString(),
        task_to: getEndOfDay(new Date(task_to)),

        task_description: `${taskInfo.description.replace(/['"]+/g, "")}`,
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
        task_account: taskInfo.task_account,
        task_type_account : taskInfo.task_account,
        task_version: 1,
        client_id: query.get("clientId") ? parseInt(query.get("clientId")) : "",
        isComplianceForm:
          query.get("checklist") === "Compliance Form" ? true : false,
        province_form: query.get("provinceForm"),
        clio_trust_account: query.get("clio_trust_account") || "",
        task_due_date: taskInfo.dueDate,
        reason_of_payment: "",
        
      };

      axios
        .post("/create/task", obj)
        .then((res) => {
          console.log("Created task", res);
          if (res.data.data.code !== 200) {
            console.log("task already exists", res.data.data.message);
            setTaskInfo({
              ...taskInfo,
              showError: res.data.data.message,
              showAlertTask: res.data.data.message,
            });
          } else {
            console.log("task created");

            history.push(
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

  return (
    <>
      <div className="panel">
        <div className="pHead">
          <span className="h5">
            <svg
              width="36"
              height="34"
              viewBox="0 0 36 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              <path
                opacity="0.4"
                d="M5.03711 5.86914V32.922H30.9627C33.4529 32.922 35.4716 30.9033 35.4716 28.4132V5.86914H5.03711Z"
                fill="#73C3FD"
              ></path>{" "}
              <path
                d="M26.454 28.4131H0.52832C0.52832 30.9032 2.547 32.9219 5.03713 32.9219H30.9628C28.4726 32.9219 26.454 30.9032 26.454 28.4131Z"
                fill="#73C3FD"
              ></path>{" "}
              <path
                opacity="0.5"
                d="M13.7731 6.71413C15.3294 6.71413 16.5911 5.45247 16.5911 3.89613C16.5911 2.33979 15.3294 1.07812 13.7731 1.07812C12.2167 1.07812 10.9551 2.33979 10.9551 3.89613C10.9551 5.45247 12.2167 6.71413 13.7731 6.71413Z"
                fill="#F6BD3D"
              ></path>{" "}
              <path
                d="M15.1821 5.30546C13.6258 5.30546 12.3641 4.04377 12.3641 2.48745C12.3641 2.07405 12.4538 1.68185 12.6138 1.32812C11.6359 1.77027 10.9551 2.75354 10.9551 3.89645C10.9551 5.45277 12.2168 6.71446 13.7731 6.71446C14.916 6.71446 15.8993 6.03363 16.3414 5.05578C15.9877 5.2157 15.5955 5.30546 15.1821 5.30546Z"
                fill="#F6BD3D"
              ></path>{" "}
              <path
                d="M35.4716 5.34041H31.5203C31.2285 5.34041 30.9919 5.57698 30.9919 5.86879C30.9919 6.16059 31.2285 6.39716 31.5203 6.39716H34.9432V28.4128C34.9432 30.6076 33.1576 32.3932 30.9628 32.3932C28.768 32.3932 26.9824 30.6076 26.9824 28.4128C26.9824 28.121 26.7458 27.8844 26.454 27.8844H13.7669C13.4751 27.8844 13.2385 28.121 13.2385 28.4128C13.2385 28.7046 13.4751 28.9412 13.7669 28.9412H25.9532C26.0997 30.3415 26.8224 31.5727 27.8791 32.3932H5.03718C3.02146 32.3932 1.35088 30.8872 1.09169 28.9412H11.2368C11.5286 28.9412 11.7652 28.7046 11.7652 28.4128C11.7652 28.121 11.5286 27.8844 11.2368 27.8844H5.56556V6.39716H11.553C12.1442 6.92258 12.9217 7.24256 13.773 7.24256C14.5053 7.24256 15.1829 7.0055 15.7345 6.60492L18.7536 9.62399C18.8567 9.72713 18.992 9.77877 19.1272 9.77877C19.2624 9.77877 19.3977 9.7272 19.5008 9.62399C19.7071 9.41764 19.7071 9.08307 19.5008 8.87679L17.0212 6.39716H29.0392C29.331 6.39716 29.5676 6.16059 29.5676 5.86879C29.5676 5.57698 29.331 5.34041 29.0392 5.34041H16.7913C17.0014 4.90292 17.1194 4.41308 17.1194 3.89618C17.1194 2.05103 15.6182 0.549805 13.773 0.549805C11.9278 0.549805 10.4266 2.05103 10.4266 3.89618C10.4266 4.41308 10.5445 4.90292 10.7547 5.34041H5.03718C4.74538 5.34041 4.50881 5.57698 4.50881 5.86879V27.8844H0.528376C0.236571 27.8844 0 28.121 0 28.4128C0 31.1903 2.25969 33.45 5.03718 33.45H30.9628C33.7403 33.45 36 31.1903 36 28.4128V5.86879C36 5.57698 35.7634 5.34041 35.4716 5.34041ZM13.773 1.60656C15.0355 1.60656 16.0626 2.63372 16.0626 3.89618C16.0626 4.47345 15.8474 5.00105 15.4937 5.40424C15.4871 5.40783 15.481 5.41199 15.4746 5.41586C15.4671 5.4203 15.4596 5.42453 15.4523 5.42939C15.4442 5.43481 15.4366 5.4408 15.4288 5.44665C15.4228 5.45116 15.4166 5.45532 15.4107 5.46011C15.3838 5.48223 15.359 5.50696 15.3369 5.53394C15.332 5.54 15.3276 5.54634 15.323 5.55254C15.3173 5.56007 15.3114 5.56747 15.3061 5.57536C15.3011 5.5829 15.2967 5.59079 15.292 5.59854C15.2884 5.60467 15.2844 5.61052 15.281 5.61679C14.8779 5.97066 14.3503 6.18581 13.773 6.18581C12.5105 6.18581 11.4834 5.15865 11.4834 3.89618C11.4834 2.63372 12.5105 1.60656 13.773 1.60656Z"
                fill="#171D34"
              ></path>{" "}
              <path
                d="M14.0194 14.8868C14.0194 14.595 13.7828 14.3584 13.491 14.3584H10.1094C9.81763 14.3584 9.58105 14.595 9.58105 14.8868C9.58105 15.1786 9.81763 15.4151 10.1094 15.4151H11.2736C11.2728 15.4268 11.2719 15.4385 11.2719 15.4504V19.3956C11.2719 19.6874 11.5084 19.924 11.8002 19.924C12.092 19.924 12.3286 19.6874 12.3286 19.3956V15.4504C12.3286 15.4385 12.3276 15.4268 12.3268 15.4151H13.491C13.7828 15.4151 14.0194 15.1786 14.0194 14.8868Z"
                fill="#171D34"
              ></path>{" "}
              <path
                d="M16.309 19.924C17.5327 19.924 18.5282 18.6756 18.5282 17.1412C18.5282 15.6068 17.5327 14.3584 16.309 14.3584C15.0854 14.3584 14.0898 15.6068 14.0898 17.1412C14.0898 18.6756 15.0854 19.924 16.309 19.924ZM16.309 15.4151C16.9391 15.4151 17.4714 16.2056 17.4714 17.1412C17.4714 18.0768 16.9391 18.8672 16.309 18.8672C15.6789 18.8672 15.1466 18.0768 15.1466 17.1412C15.1466 16.2056 15.6789 15.4151 16.309 15.4151Z"
                fill="#171D34"
              ></path>{" "}
              <path
                d="M26.4893 17.1412C26.4893 18.6756 27.4848 19.924 28.7084 19.924C29.9321 19.924 30.9276 18.6756 30.9276 17.1412C30.9276 15.6068 29.9321 14.3584 28.7084 14.3584C27.4848 14.3584 26.4893 15.6068 26.4893 17.1412ZM29.8709 17.1412C29.8709 18.0768 29.3385 18.8672 28.7084 18.8672C28.0783 18.8672 27.546 18.0768 27.546 17.1412C27.546 16.2056 28.0783 15.4151 28.7084 15.4151C29.3385 15.4151 29.8709 16.2056 29.8709 17.1412Z"
                fill="#171D34"
              ></path>{" "}
              <path
                d="M25.2919 17.1403C25.2919 14.4691 21.6249 13.8271 21.4688 13.8011C21.3156 13.7756 21.1588 13.8187 21.0403 13.9191C20.9219 14.0195 20.8535 14.167 20.8535 14.3223V19.3947C20.8535 19.6865 21.0901 19.9231 21.3819 19.9231C22.7343 19.9231 25.2919 19.3415 25.2919 17.1403ZM21.9103 14.996C22.7726 15.2551 24.2351 15.8803 24.2351 17.1403C24.2351 18.3774 22.7351 18.7281 21.9103 18.8273V14.996Z"
                fill="#171D34"
              ></path>{" "}
              <path
                d="M26.9821 22.2129C26.9821 21.9211 26.7455 21.6846 26.4537 21.6846H15.1817C14.8899 21.6846 14.6533 21.9211 14.6533 22.2129C14.6533 22.5048 14.8899 22.7413 15.1817 22.7413H26.4537C26.7455 22.7413 26.9821 22.5048 26.9821 22.2129Z"
                fill="#171D34"
              ></path>{" "}
              <path
                d="M16.3096 24.5029C16.0178 24.5029 15.7812 24.7395 15.7812 25.0313C15.7812 25.3231 16.0178 25.5597 16.3096 25.5597H23.6364C23.9282 25.5597 24.1648 25.3231 24.1648 25.0313C24.1648 24.7395 23.9282 24.5029 23.6364 24.5029H16.3096Z"
                fill="#171D34"
              ></path>{" "}
            </svg>{" "}
            Add Task
          </span>
        </div>
        <div className="pBody">
          <form onSubmit={handleSubmit}>
         
            <div className="row">
              <div className="col-md-5">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    onChange={(e) => {
                      let text = e.target.value;
                      if (text.length > 255) {
                        setShowWordCountAlert(
                          "The maximum character count for description is 255"
                        );
                      } else {
                        setTaskInfo({ ...taskInfo, description: text });
                        setShowWordCountAlert("");
                      }
                    }}
                    name="taskDesc"
                    cols="20"
                    rows="2"
                    value={taskInfo.description}
                  ></textarea>
                  <span className="text">
                    {taskInfo.description.length} word count
                  </span>
                  {showWordCountAlert && (
                    <span className="text text-danger">
                      {showWordCountAlert}
                    </span>
                  )}
                </div>

                <div className="form-group">
                <label>Due Date:</label>
                
                                <input
                                  type="date"
                                  className={`form-control`}
                                  name="dueDate"
                                  value={taskInfo.dueDate}
                                  onChange={(e) => {
                                    setTaskInfo({
                                      ...taskInfo,
                                      dueDate: e.target.value,
                                    });
                                  }}
                                />
                            

                  </div>

                <div className="form-group">
                  <label>Assign Preparer: </label>
                  {taskInfo.loadedPreparer && taskInfo.loadedReviewer && (
                    <Dropdown
                      options={preparerList}
                      placeholder="List of Preparers"
                      onChange={(e) => {
                        setTaskInfo({ ...taskInfo, preparer: e.value });
                      }}
                    />
                  )}
                </div>
                {taskInfo.showAlertTask && (
                  <ModalInputCenter
                    heading="Task Already exists!"
                    cancelOption="Ok"
                    handleClick={() => {
                      setTaskInfo({ ...taskInfo, showAlertTask: "" });
                    }}
                    changeShow={() => {
                      setTaskInfo({ ...taskInfo, showAlertTask: "" });
                      history.push(AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE);
                    }}
                    show={taskInfo.showAlertTask}
                    action=""
                  >
                    Task with the same details already exists. Please complete
                    the task first.
                  </ModalInputCenter>
                )}
                <div className="form-group">
                  <label>Assign Approver: </label>
                  {taskInfo.loadedPreparer && taskInfo.loadedReviewer && (
                    <Dropdown
                      options={
                        reviewerList ? [...reviewerList] : getFirmnameForSetup()
                      }
                      onChange={(e) => {
                        setTaskInfo({ ...taskInfo, approver: e.value });
                      }}
                      placeholder="List of Approvers"
                    />
                  )}
                </div>


              </div>

              
              <div className="col-md-4 offset-md-2 text-end">
                <img src={createTaskImage}></img>
              </div>
            </div>
            {taskInfo.showError && (
              <Alert variant="info" className="mt-3 heading-5">
                {taskInfo.showError}
              </Alert>
            )}
            <div className="btnGroup">
              <button
                className="btn btnPrimary ms-auto"
                onSubmit={handleSubmit}
                type="submit"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateTaskForm;

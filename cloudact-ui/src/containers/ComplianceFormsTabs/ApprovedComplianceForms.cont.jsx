import AdapterDateFns from "@mui/lab/AdapterDateFns";
import DatePicker from "@mui/lab/DatePicker";
import ReactToPrint from "react-to-print";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import { Pagination, TextField } from "@mui/material";
import Cookies from "js-cookie";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "../../utils/axios";
import {
  determineStep,
  getBodyStatusCode,
  getCurrentUserFromCookies,
  getUserId,
  getUserSID,
  isApiRequestSuccessfully,
  nameOfChecklist,
} from "../../utils/helpers";
import MonthlyChecklistCard from "../../components/Tasks/MonthlyChecklistCard";
import MonthlyChecklistTrust from "../../components/Tasks/MonthlyChecklistTrust";
import MonthlyChecklistGeneral from "../../components/Tasks/MonthlyChecklistGeneral";
import { Task } from "../../components/Tasks/Task";
import html2pdf from "html2pdf.js";
import Form9A from "../../pages/complianceForms/ON/Form9A/Form9A";

const ApprovedComplianceForm = () => {
  let printComponent = useRef(null);
  let compliancePDF = useRef(null);
  const [taskData, setTaskData] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [formsData, setFormsData] = useState([]);
  const [filterTasks, setFilterTasks] = useState({
    year: null,
    month: new Date(),
  });
  const [showFormToDownload, setShowFormToDownload] = useState({
    show: false,
    type: "trust",
  });
  const [allFormDetailsTrust, setAllFormDetailsTrust] = useState({
    form1Data: {},
    taskStatus: {},
    dateMonth: "",
  });
  const [allFormDetailsGeneral, setAllFormDetailsGeneral] = useState({
    form2Data: {},
    taskStatus: {},
    dateMonth: "",
  });

  const [allFormDetailsCard, setAllFormDetailsCard] = useState({
    form3Data: {},
    taskStatus: {},
    dateMonth: "",
  });
  const [filteredTaskList, setFilteredTaskList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await axios.get(
        `/task/list/${
          getCurrentUserFromCookies().role
        }/${getUserId()}/${getUserSID()}?page=${pageNumber}&isComplianceForm=1&status=DONE`
      );

      const { body, status, code } = getBodyStatusCode(data);

      console.log("body", body);

      if (isApiRequestSuccessfully(code, status)) {
        setFormsData(body);
        setFilteredTaskList(body.data);
      }
    };

    fetchData();
  }, [pageNumber, getCurrentUserFromCookies().role]);

  const handlePrint = (e) => {
    const { task_month, task_type } = e;
    console.log("print component", printComponent);
    const task_form_download = document.querySelector("#task_form_download");

    const settings = {
      filename: `${task_type.replaceAll(" ", "_")}_${task_month}`,
    };

    html2pdf().set(settings).from(task_form_download).save();
  };

  return (
    <Col>
      <div className="mb-4">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            InputProps={{ style: { fontSize: 15 } }}
            views={["year", "month"]}
            label="Year and Month"
            value={filterTasks.year}
            onChange={(newValue) => {
              const date = moment(newValue).format("MM YY");
              console.log("data filter", date);

              const filteringTasks = formsData.data.filter((e) => {
                if (moment(e.task_created_at).format("MM YY") === date) {
                  return e;
                }
                return null;
              });

              console.log("filtering task", formsData.data, filteringTasks);
              setFilteredTaskList(filteringTasks);

              setFilterTasks({ ...filterTasks, year: newValue });
            }}
            renderInput={(params) => (
              <TextField
                InputLabelProps={{
                  style: {
                    fontSize: 15,
                    top: "-5px",
                  },
                }}
                {...params}
                helperText={null}
              />
            )}
          />
        </LocalizationProvider>
      </div>

      <table className="w-100">
        <thead className="w-100 heading_row">
          <tr>
            {["Task name", "Client / Period", "Status"].map((e, index) => {
              return (
                <th
                  key={index}
                  style={{ textAlign: "left", whiteSpace: "nowrap" }}
                >
                  {e}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="w-100">
          {filteredTaskList.map((e, index) => {
            return (
              <tr key={index} style={{ textDecoration: "underline" }}>
                <td
                  style={{
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    textDecoration: "underline",
                    padding: "1rem 0 !important",
                  }}
                >
                  <Link
                    className="d-inline-block w-100"
                    style={{ textTransform: "capitalize" }}
                    to={{
                      pathname:
                        e.isComplianceForm === 1
                          ? `/compliance/form`
                          : `/tasks/form`,
                      state: e,
                      search: `step=${determineStep(e.task_type)}&form=1`,
                    }}
                    onClick={() => {
                      Cookies.set("checklistId", JSON.stringify(e));
                    }}
                  >
                    {nameOfChecklist(e.task_type)}
                  </Link>
                </td>
                <td
                  style={{
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    textDecoration: "underline",
                    padding: "1rem 0 !important",
                  }}
                >
                  <Link
                    className="d-inline-block w-100"
                    to={{
                      pathname:
                        e.isComplianceForm === 1
                          ? `/compliance/form`
                          : `/tasks/form`,
                      state: e,
                      search: `step=${determineStep(e.task_type)}&form=1`,
                    }}
                    onClick={() => {
                      Cookies.set("checklistId", JSON.stringify(e));
                    }}
                  >
                    {e.task_month}
                  </Link>
                </td>

                <td
                  style={{
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    textDecoration: "underline",
                    padding: "1rem 0 !important",
                  }}
                >
                  <Link
                    className="d-inline-block w-100"
                    to={{
                      pathname:
                        e.isComplianceForm === 1
                          ? `/compliance/form`
                          : `/tasks/form`,
                      state: e,
                      search: `step=${determineStep(e.task_type)}&form=1`,
                    }}
                    onClick={() => {
                      Cookies.set("checklistId", JSON.stringify(e));
                    }}
                  >
                    <p style={{ color: "green" }}>Completed</p>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: "none" }}>
        {showFormToDownload.show && showFormToDownload.type === "trust" && (
          <MonthlyChecklistTrust
            ref={printComponent}
            form1Data={allFormDetailsTrust.form1Data}
            taskStatus={allFormDetailsTrust.taskStatus}
            dateMonth={allFormDetailsTrust.dateMonth}
          />
        )}

        {showFormToDownload.show && showFormToDownload.type === "general" && (
          <MonthlyChecklistGeneral
            ref={printComponent}
            form6Data={allFormDetailsGeneral.form6Data}
            form2Data={allFormDetailsGeneral.form2Data}
            taskStatus={allFormDetailsGeneral.taskStatus}
            dateMonth={allFormDetailsGeneral.dateMonth}
          />
        )}

        {showFormToDownload.show && showFormToDownload.type === "card" && (
          <MonthlyChecklistCard
            ref={printComponent}
            form3Data={allFormDetailsCard.form3Data}
            taskStatus={allFormDetailsCard.taskStatus}
            dateMonth={allFormDetailsCard.dateMonth}
          />
        )}
      </div>

      {formsData?.pages > 1 && (
        <Pagination
          size={"medium"}
          page={pageNumber}
          count={formsData?.pages}
          onChange={(e, value) => {
            setPageNumber(value);
          }}
          variant="outlined"
          shape="rounded"
        />
      )}

      {formsData?.pages === 0 ||
        (filteredTaskList.length === 0 && (
          <p className="heading-5 mt-3 text-center">
            No Completed Tasks in {moment(filterTasks.year).format("MMMM YYYY")}
          </p>
        ))}
    </Col>
  );
};

export default ApprovedComplianceForm;

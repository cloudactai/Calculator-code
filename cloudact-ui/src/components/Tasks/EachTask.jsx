import Cookies from "js-cookie";
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  determineColorOfTask,
  determineStep,
  getUserSID,
  nameOfChecklist,
} from "../../utils/helpers";
import { useHistory } from "react-router";
import axios from '../../utils/axios';
import html2pdf from 'html2pdf.js';

const EachTask = ({ e, index, alignCenter, hasChild, isChild }) => {
  const history = useHistory();

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
  let printComponent = useRef(null);


  const handlePrint = (e) => {
    const { task_month, task_type } = e;
    console.log("print component", printComponent);
    const task_form_download = document.querySelector("#task_form_download");
    console.log("task_form_download", task_form_download);

    const settings = {
      filename: `${task_type.replaceAll(" ", "_")}_${task_month}`,
    };

    html2pdf().set(settings).from(task_form_download).save();
  };



  return (
    <tr onClick={() => {Cookies.set("checklistId", JSON.stringify(e));history.push({pathname:e.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,state: e,search: `step=${determineStep(e.task_type)}&form=1`,});}}>
      <td>
        <span><Link to={{pathname: e.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,state: e,search: `step=${determineStep(e.task_type)}&form=1`,}}onClick={() => {Cookies.set("checklistId", JSON.stringify(e));}}>{isChild && <span className="cursor_pointer">↳</span>}{nameOfChecklist(e.task_type)}</Link></span>
      </td>
      <td>
        <span>
          <Link
            to={{
              pathname:
                e.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
              state: e,
              search: `step=${determineStep(e.task_type)}&form=1`,
            }}
            onClick={() => {
              Cookies.set("checklistId", JSON.stringify(e));
            }}
          >
            {e.task_month}
          </Link>
        </span>
      </td>

      <td>
        <span>
          <Link
            className={`${determineColorOfTask(
              e.task_status
            )}`}
            to={{
              pathname:
                e.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
              state: e,
              search: `step=${determineStep(e.task_type)}&form=1`,
            }}
            onClick={() => {
              Cookies.set("checklistId", JSON.stringify(e));
            }}
          >
            {e.task_status === "INPROGRESS" ? "IN PROGRESS" : "COMPLETED"}
          </Link>
        </span>
      </td>
     
    </tr>
  );
};

export default EachTask;

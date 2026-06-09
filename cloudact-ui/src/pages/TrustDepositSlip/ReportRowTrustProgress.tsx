import { Link } from "react-router-dom";
import React from "react";

import {  nameOfChecklist } from "../../utils/helpers";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import {ReportRowTrustProgressProps} from "./interface/trustDepositInterface";


const ReportRowTrustProgress: React.FC<ReportRowTrustProgressProps> = ({ data, key, checkBoxFunction, isChecked }) => {

  let {task_month, task_status, pdf_url, task_name, task_type_account} = data;

  return (
    <>
      <tr key={data.id}>

        <td style={{ cursor: "pointer" }}>


          <input
            className={`form-check-input `}
            type="checkbox"
            onChange={() => checkBoxFunction(key, data.id)}
            style={{ cursor: "pointer", padding: "8px", marginLeft: "-31px" }}
            checked={isChecked}
          />

          <Link
            style={{ listStyle: "none", color: "black", textDecoration: "none" }}
            to={{
              pathname: AUTH_ROUTES.FORM_TASKS_TRUST_DEPOSIT_SLIP,
              state: data
            }}>
            {nameOfChecklist(task_name)}
          </Link>
        </td>
        <td>{task_month}</td>

        <td>{task_type_account}</td>
           <td>
          <span
            className={task_status === "INPROGRESS" ? "blueColor" : "greenColor"} >
            {task_status === "INPROGRESS" ? "In Progress" : task_status === "DONE"
              ? "Completed" : task_status}
          </span>
        </td>

        <td className="actions">
          {pdf_url ? (
            <a target="_blank" href={pdf_url} download >
              <button className="redColor">
                <i className="fa-solid fa-file-pdf"></i> PDF
              </button>
            </a>
          ) : (
            "Not approved"
          )}
        </td>

      </tr>

    </>
  )
}

export default ReportRowTrustProgress
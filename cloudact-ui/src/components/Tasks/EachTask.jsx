import Cookies from "js-cookie";
import React from "react";
import { Link } from "react-router-dom";
import {
  determineColorOfTask,
  determineStep,
  getUserSID,
  nameOfChecklist,
} from "../../utils/helpers";
import { useHistory } from "react-router";
import axios from '../../utils/axios';

const EachTask = ({ e, index, alignCenter, hasChild, isChild }) => {
  const history = useHistory();

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

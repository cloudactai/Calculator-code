import React, { useEffect} from "react";
import { useHistory, useParams } from "react-router";
import {
  fetchTaskDetails,
} from "../utils/Apis/monthlyChecklist/clientDetailsBySID";
import Cookies from "js-cookie";
import { AUTH_ROUTES } from "../routes/Routes.types";
import { determineStep } from "../utils/helpers";

const TasksId = () => {
  const history = useHistory();
  const {id}: {id: string} = useParams()

  useEffect(() => {
    const fetchBatchDetails = async () => {
      const data = await fetchTaskDetails(parseInt(id));
      const details = data[0];
    
      Cookies.set("checklistId", JSON.stringify(details));
      
      try {
        history.push({
          pathname:
            details.isComplianceForm === 1
              ? AUTH_ROUTES.COMPLIANCE_FORM
              : AUTH_ROUTES.TASKS_FORM,
              state: details,
              search: `step=${determineStep(details.task_type)}&form=1`
        });
      } catch (error) {
          console.log("error", error);
          alert("Task not found !")
          history.push("/")
      }
    };

    fetchBatchDetails();
  });

  return <div>
    Redirecting...
  </div>;
};

export default TasksId;

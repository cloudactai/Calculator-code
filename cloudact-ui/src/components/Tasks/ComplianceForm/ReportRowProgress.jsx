import {
  getColorFromPercentage,
} from "../../../utils/helpers";
import { Link } from "react-router-dom";
import { determineStep, nameOfChecklist } from "../../../utils/helpers";
import { momentFunction } from "../../../utils/moment";
const ReportRowProgress = ({ data, formsDataWithProgress , 
  key ,  checkBoxFunction ,isChecked

 }) => {

  let { isComplianceForm, task_type
    , task_month, task_status, id,pdf_url,
    task_account, task_due_date, report_url, task_type_account, task_preparer_signoff, task_approverer_signoff
  } = data;




  const getProgress = (preparerSignoff, approvererSignoff) => {


    const progress = (Number(preparerSignoff) + Number(approvererSignoff)) * 50;
    return `${progress}%`;
  };

 console.log('task_typeCCOMM',task_type)

  return (
    <>
      <tr key={data.id}>
        
        <td className="tdCheckBox">
          

        <input
            className={`form-check-input `}
            type="checkbox"
            onChange={() => checkBoxFunction(key , data.id)}
            checked={isChecked}
          />
          <span>
            <Link
              style={{ color: "#333" }}
              to={{
                pathname: isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
                state: data, search: `step=${determineStep(task_type)}&form=1`,
              }}>
              {nameOfChecklist(task_type)}
            </Link>
          </span>
        </td>
        <td>{task_month}</td>

        <td>
          <span>
            <div className="progressBar">
              <div className="inner " style={{ minWidth: '143px' }}>
                <span
                  style={{
                    width: getProgress(task_preparer_signoff, task_approverer_signoff),
                    backgroundColor:
                      getColorFromPercentage(
                      getProgress(task_preparer_signoff, task_approverer_signoff),
                      true)
                  }}
                >
                </span>

              </div>

              {
                getProgress(task_preparer_signoff, task_approverer_signoff)

              }

            </div>
          </span>
        </td>

        <td>{task_type_account}</td>

        <td>  {momentFunction.formatDate(task_due_date, "DD-MM-YYYY")}   </td>
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

export default ReportRowProgress
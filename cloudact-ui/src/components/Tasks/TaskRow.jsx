import Cookies from "js-cookie";
import React from "react";
import { Link } from "react-router-dom";
import { determineStep, getColorFromPercentage } from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
const TaskRow = ({ e, formsDataWithProgress  ,  handleAddid}) => {

  return (
    <tr className="text-center">
      <td className="tdCheckBox">
        <input
        type="checkbox"
        onChange={() => handleAddid(e.id)}
        >
        </input>
        <span>
        <Link
          style={{ color: "#333" }}
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
          {e.task_type}
        </Link>
        </span>
      </td>
      <td>
        <span>{e.task_month}</span>
      </td>
      <td>
        <span>
          <div className="progressBar">
            <div className="inner">
              <span
                style={{
                  width:
                    formsDataWithProgress &&
                    formsDataWithProgress.length &&
                    formsDataWithProgress.find((data) => data.id === e.id)
                      ?.progress
                      ? formsDataWithProgress &&
                        formsDataWithProgress.length &&
                        formsDataWithProgress.find((data) => data.id === e.id)
                          ?.progress + "%"
                      : "0%",
                  backgroundColor:
                    formsDataWithProgress &&
                    formsDataWithProgress.length &&
                    formsDataWithProgress.find((data) => data.id === e.id)
                      ?.progress
                      ? getColorFromPercentage(
                          formsDataWithProgress.find((data) => data.id === e.id)
                            ?.progress
                        )
                      : 0,
                }}
              ></span>
            </div>
            {formsDataWithProgress &&
            formsDataWithProgress.length &&
            formsDataWithProgress.find((data) => data.id === e.id)?.progress
              ? formsDataWithProgress &&
                formsDataWithProgress.length &&
                formsDataWithProgress.find((data) => data.id === e.id)
                  ?.progress + "%"
              : "0%"}
          </div>
        </span>
      </td>
      <td>
        <span >
          {/* use capitalize function for capital first word */}

          {/* {capitalizeFirstLetter(e.task_type_account)} */}

         {e.task_type_account}

        </span>
      </td>

      <td>
        <span >
          {/* use capitalize function for capital first word */}

          {/* {capitalizeFirstLetter(e.task_type_account)} */}
{
momentFunction.formatDate(e.task_due_date , "DD-MM-YYYY")
}
       

        </span>
      </td>


      <td>
        <span
          className={
            e.task_status === "INPROGRESS" ? "blueColor" : "greenColor"
          }
        >
{e.task_status === "INPROGRESS" ? "In Progress" : e.task_status === "DONE" ? "Approved" : e.task_status}
	


        </span>
      </td>

    




      <td className="actions">
  {e.pdf_url ? (
    <a target="_blank" href={e.pdf_url} download >
      <button className="redColor">
        <i className="fa-solid fa-file-pdf"></i> PDF
      </button>
    </a>
  ) : (
    "Not approved"
  )}
</td>



    </tr>
  );
};

export default TaskRow;

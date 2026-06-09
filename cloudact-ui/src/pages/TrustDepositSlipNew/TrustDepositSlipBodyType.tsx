
import { nameOfChecklist } from "../../utils/helpers";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import {  TrustDepositSlipProps } from "././interface/trustdepoInterface";

import { Link } from "react-router-dom";

const TrustDepositSlipBody: React.FC<TrustDepositSlipProps> = ({
  data,
  index,
  handleSelectIndividual,
  selectedReports
}) => {
 
  // destructuring data   
  let { task_month, pdf_url, task_name, task_type_account } = data;


  return (
    <>

      <tr key={index}  className={"highlight_blue text-left"} >

        <td className={"tdCheckBox"}>

          <input
            className={`form-check-input`}
            type="checkbox"
            checked={selectedReports.includes(data.id)}
            onChange={() => handleSelectIndividual(data.id)}
          />
          <span>
            <span>
              <Link
                style={{ listStyle: "none", color: "black", textDecoration: "none" }}
                to={{
                  pathname: AUTH_ROUTES.FORM_TASKS_TRUST_DEPOSIT_SLIP,
                  state: data
                }}>
                {nameOfChecklist(task_name)}
              </Link>
            </span>

          </span>

        </td>


        <td>{task_month}</td>


        <td>{task_type_account}</td>


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
  );
};

export default TrustDepositSlipBody;

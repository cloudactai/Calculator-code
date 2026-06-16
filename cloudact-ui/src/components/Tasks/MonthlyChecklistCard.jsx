import moment from "moment";
import React from "react";
import { getFirmnameForSetup } from "../../utils/helpers";
import { getMonthlyChecklistDetails } from "../../pages/MonthlyChecklist/MonthlyChecklist";

import SignOffButton from "./SignOffButton";
import { momentFunction } from "../../utils/moment";

const MonthlyChecklistCard = React.forwardRef(
  ({ taskStatus, form3Data, dateMonth }, ref) => {
    const YesOrNo = (nameOfLabel, form) => {
      return ["Yes", "No"].map((e, index) => {
        return (
          <div
            key={nameOfLabel + form + index}
            className={`${
              index === 0 ? "mx-4" : ""
            } d-flex justify-content-start align-items-center`}
          >
            <input
              required={"required"}
              name={nameOfLabel}
              disabled={true}
              type="radio"
              checked={form3Data.options[nameOfLabel] === e}
              value={e}
              className="radio_box mx-1"
            />
            <label className="heading-5">{e}</label>
          </div>
        );
      });
    };

    return (
      <div
        ref={ref}
        id="task_form_download"
        className="container d-flex align-items-center justify-content-center"
      >
        <form
          style={{ background: "#fff" }}
          className="d-flex py-5 px-5 flex-column align-items-start w-100"
        >
          <div className="heading-3 mb-4">
            {getFirmnameForSetup()[0].display_firmname}
          </div>
          j<h1 className="heading-4 mt-3">Section C</h1>
          <div className="heading-5 fw-bold mt-2">
            {" "}
            C.1 Have you received your credit card statements for
            {dateMonth}?
          </div>
          <div className="mx-5">
            {form3Data.creditAccountNames.map((e, index) => {
              return (
                <div key={index} className="d-flex mt-3">
                  <div className="heading-5 mr-1" style={{ width: "18rem" }}>
                    {e.name}
                  </div>
                  <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                    {YesOrNo("receivedCreditCard" + e.account_id, 3)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="heading-5 fw-bold mt-4">
            {" "}
            C.2 Have you saved your credit card statements on your local
            drive/One-drive/Dropbox?
          </div>
          <div className="mx-5">
            {form3Data.creditAccountNames.map((e, index) => {
              return (
                <div key={index} className="d-flex mt-3">
                  {/* <div className="heading-5 mr-1" style={{ width: "18rem" }}>
                    {e.name}
                  </div> */}
                  <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                    {YesOrNo("creditCardStatementsSaved" + e.account_id, 3)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="heading-5 fw-bold mt-4">
            {" "}
            C.3 Have you posted all transactions related to the credit card on
            QBO for {dateMonth}?
          </div>
          <div className="mx-5">
            {form3Data.creditAccountNames.map((e, index) => {
              return (
                <div key={index} className="d-flex mt-3">
                  <div className="heading-5 mr-1" style={{ width: "18rem" }}>
                    {e.name}
                  </div>
                  <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                    {YesOrNo("postedAllTransactionsCredit" + e.account_id, 3)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="heading-5 fw-bold mt-4">
            {" "}
            C.4 Please confirm if bank reconciliation is completed for following
            credit cards
          </div>
          <div className="mx-5">
            {form3Data.creditAccountNames.map((e, index) => {
              return (
                <React.Fragment key={index}>
                  <div className="d-flex mt-3">
                    <div className="heading-5 mr-1" style={{ width: "18rem" }}>
                      {e.name}
                    </div>
                    <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                      {YesOrNo(
                        "confirmBankReconciliationcompleted" + e.account_id,
                        3
                      )}
                    </div>
                  </div>

                  <div
                    className="d-flex heading-6 flex-column my-2"
                    style={{ paddingLeft: "35rem" }}
                  >
                    <p>If yes, please confirm ending bank statement balance</p>
                    <p>
                      If no, will request user to complete the reconciliation &
                      then proceed with the Other Sections on the Checklist
                    </p>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <h1 className="heading-4 mt-3">Section F</h1>
          <div className="heading-5 fw-bold mt-2">
            {" "}
            Date bank reconciliation completed on Quickbooks
          </div>
          <p className="heading-6">
            <input
              type="date"
              className="heading-5 text-dark"
              disabled={true}
              name="DateBank"
              value={form3Data.dateBankReconciliation}
            />
          </p>
          <p className="heading-6">
            The deadline as per Law Society is 25th of each month
          </p>
          <p className="heading-5 fw-bold mt-4">
            Date monthly checklist completed :{" "}
            <span className="heading-5 fw-light">
              {taskStatus.task_approverer_signoff
                ? momentFunction.formatDate(
                    taskStatus.task_approverer_signoff_date
                  )
                : "Not completed yet"}
            </span>
          </p>
          <div className="heading-5 fw-bold mt-4">
            Name of preparer :{" "}
            <span className="fw-light">{taskStatus.task_preparer_name}</span>
            {/* {isPreparerLoggedIn()} */}
            <SignOffButton
              disabledVal={true}
              styles={`heading-5 btn_primary_colored py-2 px-4 mx-2 ${
                taskStatus.task_preparer_signoff && "disabled"
              }`}
            >
              Sign Off
            </SignOffButton>
            {taskStatus.preparerSignOffError && (
              <span className="heading-5 mx-4 text-danger">
                {taskStatus.preparerSignOffError}
              </span>
            )}
            {taskStatus.task_preparer_signoff === 1 && (
              <span className="heading-5 mx-4 text-success">
                Preparer Sign Off Done
              </span>
            )}
          </div>
          <div className="heading-5 fw-bold mt-4">
            Name of Reviewer:{" "}
            <span className="fw-light">
              {getMonthlyChecklistDetails().task_approverer_name}
            </span>
            <SignOffButton
              disabledVal={true}
              styles={`heading-5 btn_primary_colored py-2 px-4 mx-2 ${
                taskStatus.task_approverer_signoff && "disabled"
              }`}
            >
              Sign Off
            </SignOffButton>
            {taskStatus.approverSignOffError !== "" && (
              <span className="heading-5 mx-4 text-danger">
                {taskStatus.approverSignOffError}
              </span>
            )}
            {taskStatus.task_approverer_signoff === 1 && (
              <span className="heading-5 mx-4 text-success">
                Approver Sign Off Done
              </span>
            )}
          </div>
        </form>
      </div>
    );
  }
);

export default MonthlyChecklistCard;

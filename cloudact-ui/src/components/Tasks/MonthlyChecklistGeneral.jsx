import React from "react";
import { getFirmnameForSetup } from "../../utils/helpers";
import moment from "moment";
import SignOffButton from "./SignOffButton";
import { momentFunction } from "../../utils/moment";

const MonthlyChecklistGeneral = React.forwardRef(
  ({ form2Data, dateMonth, taskStatus, form6Data }, ref) => {
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
              checked={form2Data.options[nameOfLabel] === e}
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
          className="d-flex py-4 px-5 flex-column align-items-start w-100"
        >
          <div className="heading-3 mb-4">
            {getFirmnameForSetup()[0].display_firmname}
          </div>
          <h1 className="heading-4 mt-3">Section B</h1>
          <div className="heading-5 fw-bold">
            {" "}
            B.1 Have you received your operating bank statements for {dateMonth}
            ?
          </div>

          {form2Data.generalAccountNames.map((e, index) => {
            return (
              <div key={index} className="d-flex mt-3">
                <div className="heading-5" style={{ width: "18rem" }}>
                  {e.name}
                </div>
                <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                  {YesOrNo("operatingStatements" + e.account_id, 2)}
                </div>
              </div>
            );
          })}

          <div className="heading-5 fw-bold mt-5">
            {" "}
            B.2 Have you saved your operating statements on your local
            drive/One-drive/Dropbox?
            {dateMonth}?
          </div>

          {form2Data.generalAccountNames.map((e) => {
            return (
              <div className="d-flex mt-3">
                {/* <div className="heading-5" style={{ width: "18rem" }}>
                  {e.name}
                </div> */}
                <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                  {YesOrNo("savedOperatingStatements" + e.account_id, 2)}
                </div>
              </div>
            );
          })}

          <div className="heading-5 fw-bold mt-5">
            {" "}
            B.3 Have you posted all transactions related to the General Account
            on Clio/QBO for {dateMonth}?
          </div>

          {form2Data.generalAccountNames.map((e) => {
            return (
              <div className="d-flex mt-3">
                <div className="heading-5" style={{ width: "18rem" }}>
                  {e.name}
                </div>
                <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                  {YesOrNo("postedAllTransactions" + e.account_id, 2)}
                </div>
              </div>
            );
          })}

          <div className="heading-5 fw-bold mt-5">
            {" "}
            B.4 Have you posted all matter related expenses on Clio/QBO for{" "}
            {dateMonth}?
          </div>

          {form2Data.generalAccountNames.map((e, index) => {
            return (
              <div className="d-flex mt-3">
                <div className="heading-5" style={{ width: "18rem" }}>
                  {e.name}
                </div>
                <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                  {YesOrNo("postedAllMatter" + e.account_id, 2)}
                </div>
              </div>
            );
          })}

          <div className="heading-5 fw-bold mt-5">
            {" "}
            B.5 Please confirm if bank reconciliation is completed for following
            operating accounts?
          </div>

          {form2Data.generalAccountNames.map((e, index) => {
            return (
              <React.Fragment key={index}>
                <div className="d-flex mt-3 justify-content-between">
                  <div style={{ width: "18rem" }} className="heading-5">
                    {e.name}
                  </div>
                  <div className="d-flex " style={{ paddingLeft: "15rem" }}>
                    {YesOrNo("bankReconciliationCompleted" + e.account_id, 2)}
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

          <div className="heading-5 fw-bold mt-5 w-100">
            {" "}
            B.6 Overview of bank reconciliation for (Operating account 1)
            <div className="mx-4">
              <p className="heading-5 ">B.6.1 Cash balance</p>
              <table className="my-3 w-100">
                <thead className="heading_row heading-5">
                  <tr style={{ textAlign: "center" }}>
                    <th>Cash Book balance</th>
                    <th>Bank statements</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td style={{ textAlign: "center" }}>300</td>
                    <td style={{ textAlign: "center" }}>300</td>
                  </tr>
                </tbody>
              </table>

              <div className="heading-5 fw-bold">
                B.6.2 Cleared transactions
              </div>
              <table className="my-3 w-100">
                <thead className="heading_row heading-5">
                  <tr style={{ textAlign: "center" }}>
                    <th>Total cleared receipts </th>
                    <th>Total cleared payments </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    {form2Data.clearedReceiptsGeneral.map((e, index) => {
                      return (
                        <td key={index} style={{ textAlign: "center" }}>
                          {e.count} receipts aggregating of ${e.amount}
                        </td>
                      );
                    })}

                    {form2Data.clearedPaymentsGeneral.map((e, index) => {
                      return (
                        <td key={index} style={{ textAlign: "center" }}>
                          {e.count} receipts aggregating of ${e.amount}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
              <div className="heading-5 fw-bold">
                B.6.3 Uncleared transactions
              </div>
              <table className="my-3 w-100">
                <thead className="heading_row heading-5">
                  <tr style={{ textAlign: "center" }}>
                    <th>Total uncleared receipts </th>
                    <th>Total uncleared payments </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    {form2Data.unClearedReceipts.map((e, index) => {
                      return (
                        <td key={index} style={{ textAlign: "center" }}>
                          {e.count} receipts aggregating of ${e.amount}
                        </td>
                      );
                    })}

                    {form2Data.unClearedPayments.map((e, index) => {
                      return (
                        <td key={index} style={{ textAlign: "center" }}>
                          {e.count} receipts aggregating of ${e.amount}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>

              <p className="heading-5 fw-bold">
                B.6.4 Number and details of uncleared cheques greater than 2
                months. Please action accordingly
              </p>
              <p className="heading-5">
                <span className="text-primary-color">----------</span>
              </p>

              <p className="heading-5 fw-bold mt-5">
                B.6.5 Uncleared transactions
              </p>

              <div className="heading-5 d-flex my-3 ">
                Are all source documents available for the trust transactions
                during the month?
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("allSourceDocumentsAvailableDuringMonth", 2)}
                </div>
              </div>
              <div className="heading-5 d-flex my-3 ">
                Sequentially numbered cheques
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("SequentiallyNumberedCheques", 2)}
                </div>
              </div>
              <div className="heading-5 d-flex my-3 ">
                Vendor invoices
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("vendorInvoices", 2)}
                </div>
              </div>
              <div className="heading-5 d-flex my-3 ">
                Back-ups for internal approvals
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("BackupsForInternalApprovals", 2)}
                </div>
              </div>
              <div className="heading-5 d-flex my-3 ">
                Cancelled and voided cheques
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("CancelledVoidedCheques", 2)}
                </div>
              </div>
              <div className="heading-5 d-flex my-3 ">
                Bills for service fees and disbursements
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("BillsForServiceFees", 2)}
                </div>
              </div>

              <p className="heading-5 fw-bold mt-5">
                B.6.6 Uncleared transactions
              </p>

              <div className="heading-5 d-flex my-3 ">
                Are all general cheques signed by the authorised signatories.
                Are all supporting documentation reviewed prior to signing.
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("allGeneralChequesSigned", 2)}
                </div>
              </div>
              <div className="heading-5 d-flex my-3 ">
                Have you made all your vendor payments?
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("madeAllVendorPayments", 2)}
                </div>
              </div>
            </div>
          </div>

          <h1 className="heading-4 mt-3">Section E</h1>
          <div className="heading-5 fw-bold mt-2">
            {" "}
            Tax filing deadlines for the reconciling month:
          </div>

          <table className="my-3 w-100">
            <thead className="heading_row heading-5">
              <tr>
                <th>Type</th>
                <th>Filing Frequency</th>
                <th>Reporting Period</th>
                <th>Filing Deadline</th>
                <th>Payment Deadline</th>
              </tr>
            </thead>

            <tbody>
              {form6Data.taxFilingDetails.map((e, index) => {
                return (
                  <tr key={index}>
                    <td className="fw-bold">{e.type}</td>
                    <td>{e.filingFrequency}</td>
                    <td>{e.reportingPeriod}</td>
                    <td>{e.filingDeadline}</td>
                    <td>{e.paymentDeadline}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
              value={form2Data.dateBankReconciliation}
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
              disabledVal={taskStatus.task_preparer_signoff}
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
            <span className="fw-light">{taskStatus.task_approverer_name}</span>
            <SignOffButton
              disabledVal={taskStatus.task_approverer_signoff}
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

export default MonthlyChecklistGeneral;

import React from "react";
import {
  addUpNumbersFromArray,
  getAllUserInfo,
  getCurrentUserFromCookies,
  getFirmnameForSetup,
} from "../../utils/helpers";
import SignOffButton from "./SignOffButton";
import moment from "moment";
import { Autocomplete, TextField } from "@mui/material";
import { getMonthlyChecklistDetails } from "../../pages/MonthlyChecklist/MonthlyChecklist";
import { momentFunction } from "../../utils/moment";
import { removeNegSignAndWrapInBrackets, wrapInBracketsIfNeg } from "../../pages/calculator/reports";

import { removeNegSignAndWrapInBracketsWith2Fraction } from "../../pages/calculator/reports";

const MonthlyChecklistTrust = React.forwardRef(
  ({ form1Data, dateMonth, taskStatus }, ref) => {
    const determineVariance = () => {
      if (
        parseFloat(form1Data.closingBalance[0]) ===
          parseFloat(form1Data.closingBalance[1]) &&
        parseFloat(form1Data.closingBalance[0]) ===
          parseFloat(form1Data.closingBalance[2])
      ) {
        return 0;
      } else {
        return (
          form1Data.closingBalance[0] -
          form1Data.closingBalance[1] -
          form1Data.closingBalance[2]
        );
      }
    };

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
              checked={
                form === 1.2
                  ? form1Data.options.subForm2[nameOfLabel] === e
                  : form1Data.options.subForm1[nameOfLabel] === e
              }
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
          <h1 className="heading-4">Section A</h1>
          <div
            className={`heading-5 fw-bold ${
              form1Data.options.subForm1.receivedTrustBankStatements === "" &&
              form1Data.fillAllDetails
                ? "text-error"
                : ""
            }`}
          >
            {" "}
            A.1 Have you received your Trust bank statements for the month of{" "}
            {dateMonth}
          </div>

          {form1Data.trustAccountNames.map((e, index) => {
            return (
              <div key={index} className="d-flex mt-3 mb-1">
                <div className="heading-5" style={{ width: "18rem" }}>
                  {e.name}
                </div>
                <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                  {YesOrNo(`${"receivedTrustBankStatements"}`, 1)}
                </div>
              </div>
            );
          })}
          {form1Data.commentsOpen && (
            <div className="mt-4 searchformfld">
              <input
                type="text"
                required
                className="heading-5"
                disabled={true}
                name="comment1"
                value={form1Data.comments.comment1}
              />
              <div className="floating-label">Comment</div>
            </div>
          )}
          <div className="heading-5 fw-bold mt-4">
            A.2 Have you saved your Trust bank statements on your local
            drive/One-drive/Dropbox?
          </div>

          {form1Data.trustAccountNames.map((e, index) => {
            return (
              <div key={index} className="d-flex mt-3">
                {/* <div className="heading-5" style={{ width: "18rem" }}>
                  {e.name}
                </div> */}
                <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                  {YesOrNo(`${"savedTrustBankStatements"}`, 1)}
                </div>
              </div>
            );
          })}

          {form1Data.commentsOpen && (
            <div className="mt-4 searchformfld">
              <input
                type="text"
                required
                disabled={true}
                name="comment2"
                value={form1Data.comments.comment2}
                className="heading-5"
              />
              <div className="floating-label">Comment</div>
            </div>
          )}

          <div className="heading-5 fw-bold mt-4">
            A.3 Have you posted all trust transactions on Clio for {dateMonth}?
          </div>
          {form1Data.trustAccountNames.map((e, index) => {
            return (
              <div key={index} className="d-flex mt-3">
                <div className="heading-5" style={{ width: "18rem" }}>
                  {e.name}
                </div>
                <div className="d-flex" style={{ paddingLeft: "15rem" }}>
                  {YesOrNo(`${"postedTransactions"}`, 1)}
                </div>
              </div>
            );
          })}
          {form1Data.commentsOpen && (
            <div className="mt-4 searchformfld">
              <input
                type="text"
                disabled={true}
                required
                name="comment2"
                className="heading-5"
                value={form1Data.comments.comment3}
              />
              <div className="floating-label">Comment</div>
            </div>
          )}
          <div className="heading-5 fw-bold mt-4">
            A.4 Please confirm bank reconciliation is completed for following
            Trust bank accounts
          </div>
          {form1Data.trustAccountNames.map((e, index) => {
            return (
              <>
                <div
                  key={index}
                  className="d-flex mt-3 justify-content-between"
                >
                  <div className="heading-5" style={{ width: "18rem" }}>
                    {e.name}
                  </div>
                  <div className="d-flex " style={{ paddingLeft: "15rem" }}>
                    {YesOrNo("confirmReconciliation", 1)}
                  </div>
                </div>
              </>
            );
          })}

          {form1Data.commentsOpen && (
            <div className="mt-4 searchformfld">
              <input
                type="text"
                disabled={true}
                required
                name="comment4"
                value={form1Data.comments.comment4}
                className="heading-5"
              />
              <div className="floating-label">Comment</div>
            </div>
          )}

          <div className="heading-5 fw-bold mt-4">
            A.5 Overview of bank reconciliation for {taskStatus.task_account}
          </div>

          <div className="heading-5 px-5 py-3">
            A.5.1 Closing balance for the month
            <table className="my-3 w-100">
              <thead className="heading_row heading-5">
                <tr>
                  <th>Cash Book balance</th>
                  <th>Total Trust liability balance</th>
                  <th>Total client trust ledger balance</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  {form1Data.closingBalance.map((e, index) => {
                    return <td>{e !== undefined ? e : "----------------"}</td>;
                  })}
                </tr>
              </tbody>
            </table>
            <div className="d-flex heading-5 align-items-center">
              <p className="heading-5">VARIANCE</p>
              <input
                type="number"
                value={determineVariance()}
                className="w-25 mx-4 disabled"
                disabled={true}
              />

              {determineVariance() === 0 ? (
                <p className="heading-normal my-4">
                  The trust cash book balance ties with the client trust listing
                  and client trust ledger.
                </p>
              ) : (
                <div className="mt-3 searchformfld mb-3">
                  <input
                    type="text"
                    required
                    className="heading-5 w-50 "
                    name="varianceComment"
                    value={form1Data.varianceComment}
                  />

                  <div className="floating-label">Comment</div>
                </div>
              )}
            </div>
            <div className="heading-5 fw-bold mt-4 hide">
              Cleared Transactions
            </div>
            <table className="my-3 w-100 hide">
              <thead className="heading_row heading-5">
                <tr>
                  <th>Total cleared receipts</th>
                  <th>Total cleared payments</th>
                </tr>
              </thead>

              <tbody className="hide">
                <tr>
                  {form1Data.clearedReceipts.map((e, index) => {
                    return (
                      <td className="hide" key={index}>
                        {e.count} receipts aggregating of ${e.total}
                      </td>
                    );
                  })}

                  {form1Data.clearedPayments.map((e, index) => {
                    return (
                      <td className="hide" key={index}>
                        {e.count} payments of ${e.total}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
            <div className="heading-5 fw-bold">Uncleared transactions</div>
            <table className="my-3 w-100">
              <thead className="heading_row heading-5">
                <tr>
                  <th>Total uncleared receipts </th>
                  <th>Total uncleared payments</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  {form1Data.unClearedTransactionsReceipt.map((e, index) => {
                    return (
                      <td key={index}>
                        {e.count} payments of $
                        {e["sum(amount)"] !== null ? e["sum(amount)"] : 0}
                      </td>
                    );
                  })}

                  {form1Data.unClearedTransactionsPayment.map((e) => {
                    return (
                      <td>
                        {e.count} receipts aggregating of $
                        {e["sum(amount)"] !== null ? e["sum(amount)"] : 0}{" "}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
            {form1Data.unClearedReceiptsDate && (
              <p className="heading-5 mt-5">
                Uncleared receipts date from{" "}
                {form1Data.unClearedReceiptsDate &&
                form1Data.unClearedReceiptsDate[0]["min(date)"] !== null
                  ? moment(
                      form1Data.unClearedReceiptsDate[0]["min(date)"]
                    ).format("DD MMM YYYY")
                  : "-----"}{" "}
                till{" "}
                {form1Data.unClearedReceiptsDate &&
                form1Data.unClearedReceiptsDate[0]["max(Date)"] !== null
                  ? moment(
                      form1Data.unClearedReceiptsDate[0]["min(date)"]
                    ).format("DD MMM YYYY")
                  : "-----"}
                .
              </p>
            )}
            <div>
              {form1Data.unClearedPaymentsDate && (
                <p className="heading-5 mt-3">
                  Uncleared payments date from{" "}
                  {form1Data.unClearedPaymentsDate
                    ? form1Data.unClearedPaymentsDate[0]["min(date)"]
                    : "-----"}{" "}
                  till{" "}
                  {form1Data.unClearedPaymentsDate
                    ? form1Data.unClearedPaymentsDate[0]["max(Date)"]
                    : "-----"}
                  .
                </p>
              )}
            </div>
            {form1Data.numberOfChequesGreaterThan2Months && (
              <p className="heading-5 fw-bold mt-5">
                Number and details of uncleared cheques greater than 2 months.
                Please action accordingly
                {/* if null && no uncleared cheques greater than 2 months */}
              </p>
            )}
            <>
              {form1Data.numberOfChequesGreaterThan2Months && (
                <p className="heading-normal">
                  {form1Data.numberOfChequesGreaterThan2Months &&
                    form1Data.numberOfChequesGreaterThan2Months[0].count}{" "}
                  uncleared cheques with a total of{" "}
                  {form1Data.numberOfChequesGreaterThan2Months &&
                    form1Data.numberOfChequesGreaterThan2Months[0][
                      "sum(amount)"
                    ]}
                </p>
              )}
            </>
            <div className="heading-5 mt-5 fw-bold">
              A.5.2 Client Trust Balances
            </div>
            <p className="heading-normal">
              Details of overdrawn client balances.
            </p>
            <table className="my-3 w-100">
              <thead className="heading_row heading-5">
                <tr style={{ textAlign: "left" }}>
                  <th>Client</th>
                  <th style={{ textAlign: "center" }}>Matter</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                </tr>
              </thead>

              <tbody>
                {form1Data.clientTrustBalance.map((e, index) => {
                  return (
                    <tr key={index}>
                      <td style={{ textAlign: "left" }}>{e.client_name}</td>
                      <td style={{ textAlign: "center" }}>
                        {e.Matter_display_number}
                      </td>
                      <td style={{ textAlign: "center" }}>{
                     removeNegSignAndWrapInBracketsWith2Fraction(e.amount)
                      
                      }</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {form1Data.clientTrustBalance.length === 0 && (
              <p
                className="w-100"
                style={{ textAlign: "center", margin: "auto" }}
              >
                No Clients Yet
              </p>
            )}

        

            {form1Data.clientTrustBalance.length !== 0 && (
              <div
                className="heading-5 mx-5 fw-bold"
                style={{ textAlign: "left" }}
              >
                
                Total: {
               removeNegSignAndWrapInBracketsWith2Fraction(
                  form1Data.clientTrustBalance.reduce(
                    (total, e) => total + parseFloat(e.amount), 0)
                    )}


              </div>
            )}
            <div className="heading-5 fw-bold mt-5">
              A.5.3 Number and details of inactive client accounts
            </div>
            <p className="heading-6">
              (Inactive - there are no transaction on the client trust ledger
              for last 2 months)
            </p>
            <table className="my-3 w-100">
              <thead className="heading_row heading-5">
                <tr style={{ textAlign: "center" }}>
                  <th>Client</th>
                  <th>Matter</th>
                  <th>Date of Last Activity</th>
                  <th>Balance</th>
                </tr>
              </thead>

              <tbody>
                {form1Data.clientInactiveAccount.map((e, index) => {
                  return (
                    <tr key={index}>
                      <td style={{ textAlign: "left" }}>{e.client_name}</td>
                      <td style={{ textAlign: "center" }}>
                        {e.Matter_display_number}
                      </td>
                      <td style={{ textAlign: "right" }}>{removeNegSignAndWrapInBracketsWith2Fraction(e.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {form1Data.clientInactiveAccount.length === 0 && (
              <p
                className="w-100"
                style={{ textAlign: "center", margin: "auto" }}
              >
                No Clients Yet
              </p>
            )}
            <div className="heading-5 fw-bold mt-5">
              A.5.4 Details of client balances with status 'Closed'
            </div>
            <table className="my-3 w-100">
              <thead className="heading_row heading-5">
                <tr style={{ textAlign: "center" }}>
                  <th>Client</th>
                  <th>Matter</th>
                  <th>Status</th>
                  <th>Balance</th>
                </tr>
              </thead>

              <tbody>
                {form1Data.clientBalanceStatus.map((e, index) => {
                  return (
                    <tr key={index}>
                      <td style={{ textAlign: "left" }}>{e.client_name}</td>
                      <td style={{ textAlign: "center" }}>
                        {e.Matter_display_number}
                      </td>
                      <td style={{ textAlign: "center" }}>Closed</td>
                      <td style={{ textAlign: "right" }}>{removeNegSignAndWrapInBracketsWith2Fraction(e.amount)}</td>
                    </tr>
                  );
                })}

                {form1Data.clientBalanceStatus.length === 0 && (
                  <p>No Clients Yet</p>
                )}
              </tbody>
            </table>
            <div className="heading-5 fw-bold mt-5">
              A.5.5 There is an internal matter as at{" "}
              {moment(taskStatus.task_month).endOf("month").format("ll")} in the
              name of {getFirmnameForSetup()[0].display_firmname}
            </div>
            <div className="heading-normal d-flex my-3">
              <p
                className={`heading-5 fw-bold ${
                  form1Data.options.subForm2.confirmInternalMatter === "" &&
                  form1Data.fillAllDetails
                    ? "text-error"
                    : ""
                }`}
              >
                Please confirm if any other internal matter has been maintained
                in the name of the law firm
              </p>
              <div className="d-flex mx-5">
                {YesOrNo("confirmInternalMatter", 1.2, false)}
              </div>
            </div>
            <div>
              {form1Data.options.subForm2["confirmInternalMatter"] ===
                "Yes" && (
                <>
                  <Autocomplete
                    multiple
                    id="size-medium-outlined-multi"
                    size="medium"
                    disabled={true}
                    className="heading-5 w-100 my-4"
                    getOptionSelected={(option, value) =>
                      option.client_name === value.client_name
                    }
                    options={form1Data.matterClientList || []}
                    value={form1Data?.matterClientName}
                    getOptionLabel={(e) => e.client_name}
                    defaultValue={form1Data.matterClientName}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        InputLabelProps={{
                          style: { fontSize: "1.5rem", top: "-5px" },
                        }}
                        label="Select Matter Clients"
                        placeholder="Select Matter Clients"
                      />
                    )}
                  />
                  <button
                    disabled={true}
                    className={`btn_primary_empty ml-auto py-3 px-4 my-3 ${
                      true && "disabled"
                    }`}
                  >
                    Confirm Matter Clients
                  </button>
                </>
              )}
            </div>
            {form1Data.matterOwnerConfirmed && (
              <table className="my-3 w-100">
                <thead className="heading_row heading-5">
                  <tr style={{ textAlign: "left" }}>
                    <th>Client</th>
                    <th>Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {form1Data.trustBalanceOfAccount.map((e, index) => {
                    return (
                      <tr key={index}>
                        <td style={{ textAlign: "left" }}>{e.Client}</td>

                        <td style={{ textAlign: "left" }}>{e.Balance}</td>
                      </tr>
                    );
                  })}

                  <tr>
                    <td style={{ textAlign: "left" }}>Total</td>
                    <td style={{ textAlign: "left" }}>
                      {addUpNumbersFromArray(
                        form1Data.trustBalanceOfAccount.map(({ Balance }) =>
                          parseInt(Balance)
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            <div className="my-5 fw-bold">
              {addUpNumbersFromArray(
                form1Data.trustBalanceOfAccount.map(({ Balance }) =>
                  parseInt(Balance)
                )
              ) > 0 &&
                getAllUserInfo().province === "ON" && (
                  <div className="heading-normal">
                    The Law Society of Ontario doesn’t allow float or any amount
                    in the name of the lawyer or law firm or any other name such
                    as “miscellaneous”, “suspense” or “unknown” in the mixed or
                    pooled trust account.
                  </div>
                )}

              {addUpNumbersFromArray(
                form1Data.trustBalanceOfAccount.map(({ Balance }) =>
                  parseInt(Balance)
                )
              ) > 0 &&
                getAllUserInfo().province === "BC" && (
                  <div className="heading-normal">
                    The Law Society of British Columbia allows a deposit up to
                    $300 of the lawyer or law firm’s fund in the mixed or pooled
                    trust account.
                  </div>
                )}

              {addUpNumbersFromArray(
                form1Data.trustBalanceOfAccount.map(({ Balance }) =>
                  parseInt(Balance)
                )
              ) > 0 &&
                getAllUserInfo().province === "AB" && (
                  <div className="heading-normal">
                    The Law Society of Alberta allows a law firm to maintain not
                    more than $500 of the firm's own money in each of the firm's
                    pooled trust accounts.
                  </div>
                )}
            </div>
            {/* <div className="d-flex heading-5 align-items-center">
              <p className="heading-5 fw-bold">
                A.5.6 Details of unidentified Trust Funds?
              </p>
              <input
                type="text"
                value={form1Data.unidentifiedTrustFunds}
                className={`w-25 mx-4  disabled`}
                disabled={true}
                placeholder="Unidentified Trust Funds"
              />
            </div> */}
            {form1Data.unidentifiedTrustFunds === 0 ? null : (
              <table className="my-5 w-100">
                <thead className="heading_row heading-5">
                  <tr style={{ textAlign: "center" }}>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {form1Data?.unidentifiedTrustFundsTable.map((e, index) => {
                    return (
                      <tr key={index}>
                        <td style={{ textAlign: "center" }}>{e.Balance}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {/* <div className="d-flex heading-5 align-items-center my-4">
              <p className="heading-5 fw-bold">
                A.5.7 Details of bank fees processed in the Trust Account
              </p>
              <input
                type="text"
                value={form1Data.detailsOfBankFeesValue}
                className={`w-25 mx-4  disabled`}
                disabled={true}
                placeholder="Unidentified Trust Funds"
              />
            </div> */}
            {form1Data.detailsOfBankFeesValue === 0 ? null : (
              <table className="my-3 w-100">
                <thead className="heading_row heading-5">
                  <tr style={{ textAlign: "left" }}>
                    <th>ID</th>
                    <th>Bank Fees</th>
                  </tr>
                </thead>

                <tbody>
                  {form1Data.detailsOfBankFeesProcessedInTrustAccount.map(
                    (e, index) => {
                      return (
                        <tr key={index}>
                          <td style={{ textAlign: "left" }}>{e.id}</td>
                          <td style={{ textAlign: "left" }}>{e.Balance}</td>
                        </tr>
                      );
                    }
                  )}

                  <tr>
                    <td>Total</td>
                    <td>
                      {addUpNumbersFromArray(
                        form1Data.detailsOfBankFeesProcessedInTrustAccount.map(
                          ({ Balance }) => parseFloat(Balance)
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            {/* <div className="d-flex heading-5 align-items-center my-4">
              <p className="heading-5 fw-bold">
                A.5.8 Details of interest on the Trust Account
              </p>
              <input
                type="text"
                value={form1Data.detailsOnTrustAccountValue}
                className={`w-25 mx-4  disabled`}
                disabled={true}
                placeholder="Unidentified Trust Funds"
              />
            </div> */}
            {form1Data.detailsOnTrustAccountValue === 0 ? null : (
              <table className="my-3 w-100">
                <thead className="heading_row heading-5">
                  <tr style={{ textAlign: "left" }}>
                    <th>ID</th>
                    <th>Interest</th>
                  </tr>
                </thead>

                <tbody>
                  {form1Data.detailsOfInterestOnTrustAccount.map((e, index) => {
                    return (
                      <tr key={index}>
                        <td style={{ textAlign: "left" }}>{e.id}</td>
                        <td style={{ textAlign: "left" }}>{e.Interest}</td>
                      </tr>
                    );
                  })}

                  <tr>
                    <td>Total</td>
                    <td>
                      {addUpNumbersFromArray(
                        form1Data.detailsOfInterestOnTrustAccount.map(
                          ({ Interest }) => parseFloat(Interest)
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            <div className={`heading-5 d-flex fw-bold my-4`}>
              <p
                className={` ${
                  form1Data.options.subForm2.AreTrustFundsInvestedInBills ===
                    "" && form1Data.fillAllDetails
                    ? "text-error"
                    : ""
                }`}
              >
                A.5.9 Are trust funds invested in any instruments (Treasury
                bills, money market funds)
              </p>
              <div className="d-flex" style={{ marginRight: "6rem" }}>
                {YesOrNo("AreTrustFundsInvestedInBills", 1.2, false)}
              </div>
            </div>
            {form1Data.options.subForm2["AreTrustFundsInvestedInBills"] ===
              "Yes" && (
              <input
                type="number"
                className="w-25"
                placeholder="Enter Interest of Trust Account "
                value={
                  form1Data.interestTrustAccountValue !== 0
                    ? form1Data.interestTrustAccountValue
                    : ""
                }
              />
            )}
          </div>

          <div className="heading-5 mt-5 fw-bold">A.6 Other details</div>

          <div className="mx-5 w-75">
            <div className="d-flex">
              <div className="heading-5  my-3 w-100">
                Are all source documents available for the trust transactions
                during the month?
              </div>
              <div className="d-flex">
                {YesOrNo("allSourceDocumentsAvailable", 1.2)}
              </div>
            </div>
            <div className="d-flex">
              <div className="heading-5  my-3 w-100">
                Sequentially numbered cheques
              </div>
              <div className="d-flex">
                {YesOrNo("sequentiallyNumberedCheques", 1.2)}
              </div>
            </div>
            <div className="d-flex">
              <div className="heading-5  my-3 w-100">Form 9A</div>
              <div className="d-flex">{YesOrNo("Form9A", 1.2)}</div>
            </div>
            <div className="d-flex">
              <div className="heading-5  my-3 w-100">
                {" "}
                Back-ups for client approvals and internal approvals
              </div>
              <div className="d-flex">
                {YesOrNo("BackupsForClientApprovalsInternal", 1.2)}
              </div>
            </div>
            <div className="d-flex">
              <div className="heading-5 my-3 w-100">
                {" "}
                Cancelled and voided cheques
              </div>
              <div className="d-flex flex-grow-1">
                {YesOrNo("CancelledAndVoidedCheques", 1.2)}
              </div>
            </div>

            <div className="d-flex">
              <div className="heading-5 my-3 w-100">
                {" "}
                Are all cheques, bank drafts, electronic transactions
                signed/authorised by the appropriate signing officers of the law
                firm. Are all supporting documentation reviewed prior to
                signing/authorising
              </div>
              <div className="d-flex">
                {YesOrNo("AllChequesSignedAuthorised", 1.2)}
              </div>
            </div>

            <div className="d-flex">
              <div className="heading-5 my-3 w-100">
                {" "}
                Please confirm if you have closed any trust account during last
                month
              </div>
              <div className="d-flex">
                {YesOrNo("closedAnyTrustAccount", 1.2)}
              </div>
            </div>

            {getCurrentUserFromCookies().province === "ON" && form1Data.options.subForm2["closedAnyTrustAccount"] === "Yes" && (
              <div className="heading-5 d-flex  my-3 ">
                <p
                  className={`heading-5 d-flex  ${
                    form1Data.options.subForm2.FiledTheForm3 === "" &&
                    form1Data.fillAllDetails
                      ? "text-error"
                      : ""
                  }`}
                >
                  Have you filed the Form 3: Report on Closing a Mixed Trust
                  Account to The Law Foundation of Ontario
                </p>
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("FiledTheForm3", 1.2, false)}
                </div>
              </div>
            )}
            <div className="d-flex">
              <div className="heading-5 my-3 w-100">
                {" "}
                Please confirm if you have opened any trust account during last
                month
              </div>
              <div className="d-flex">
                {YesOrNo("HaveYouOpenedAnyTrustAccount", 1.2)}
              </div>
            </div>

            {getCurrentUserFromCookies().province === "ON" && form1Data.options.subForm2["HaveYouOpenedAnyTrustAccount"] ===
              "Yes" && (
              <div className="heading-5 d-flex my-3 ">
                <p
                  className={`heading-5 d-flex  ${
                    form1Data.options.subForm2.HaveYouFiledTheForm2 === "" &&
                    form1Data.fillAllDetails
                      ? "text-error"
                      : ""
                  }`}
                >
                  Have you filed the Form 2: Report on Opening a Mixed Trust
                  Account to The Law Foundation of Ontario
                </p>
                <div className="d-flex" style={{ marginLeft: "auto" }}>
                  {YesOrNo("HaveYouFiledTheForm2", 1.2, false)}
                </div>
              </div>
            )}
          </div>

          <div>
            <div>
              <h1 className="heading-4 mt-3">Section B</h1>
              <p className="heading-5">
                The monthly Law Society compliance reports for the month of{" "}
                {taskStatus.task_month} are as follows:
              </p>
            </div>

            <ul className="heading-6">
              <li style={{ listStyle: "inside" }}>Trust Receipts Journal</li>
              <li style={{ listStyle: "inside" }}>
                Trust Disbursements Journal
              </li>
              <li style={{ listStyle: "inside" }}>Trust Journal</li>
              <li style={{ listStyle: "inside" }}>Trust Listing</li>
              <li style={{ listStyle: "inside" }}>Client Trust Ledger</li>
              <li style={{ listStyle: "inside" }}>Trust Transfer</li>
              <li style={{ listStyle: "inside" }}>Three Way Reconciliation</li>
              <li style={{ listStyle: "inside" }}>
                Trust Reconciliation Report
              </li>
            </ul>
          </div>

          <h1 className="heading-4 mt-3">Section C</h1>
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
              value={form1Data.dateBankReconciliation}
            />
          </p>

          <p className="heading-normal">
            {getAllUserInfo().province === "AB"
              ? "The deadline as per Law Society is within 1 month of the last day of each month (Rule 119.33 (4) (d))"
              : getAllUserInfo().province === "BC"
              ? "The deadline as per Law Society is within 30 days of the subsequent month (Rule 3-73)"
              : "The deadline as per Law Society is within 25 days of the subsequent month (Subsection 22 (2)) of By-Law 9)"}
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
            <span className="fw-light">
              {getMonthlyChecklistDetails().task_approverer_name}
            </span>
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

export default MonthlyChecklistTrust;

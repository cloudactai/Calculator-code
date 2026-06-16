import { useEffect, forwardRef, useState, useRef } from "react";
import monthlyChecklistTrustDetailsById from "../../../utils/Apis/monthlyChecklist/monthlyChecklistTrustDetailsById";
import monthlyChecklistGeneralById from "../../../utils/Apis/monthlyChecklist/MonthlyChecklistGeneralById";
import { getMonthlyChecklistId } from "../MonthlyChecklist";
import axios from "../../../utils/axios";
import { default as NumberFormat } from "react-number-format";
import DatePicker from "react-date-picker";
import { getSvg } from "../checkListAssets/checklistAsset";
import creditCardChecklist from "../../../assets/images/creditCardChecklist.svg";
import { removeNegSignAndWrapInBracketsWith2Fraction } from "../../calculator/reports";
import { formatNumberInThousands } from "../../../utils/helpers/Formatting";
import { formatNumber } from "../../../utils/validation";
import { Autocomplete } from "@mui/material";
import {
  addUpNumbersFromArray,
  getAllUserInfo,
  getCurrentUserFromCookies,
  getUserId,
  getUserSID,
  isTaskSignedOffByPreparer,
  lastDateOfTheMonth,
  checkIfValueInArrayInEvery,
  checkIfValueInArrayInSome,
} from "../../../utils/helpers";

import { getMonthlyChecklistDetails } from "../MonthlyChecklist";
import { momentFunction } from "../../../utils/moment";

const ChecklistPdf = forwardRef((props, ref) => {
  const { type } = props?.data;
  const account_name = useRef("");
  const account_fromdate = useRef("");
  const account_todate = useRef("");
  const account_id = useRef();

  const [cardDate, setCardData] = useState({
    options: {
      subForm1: {
        receivedCreditCard: "",
        creditCardStatementsSaved: "",
        confirmBankReconciliationcompleted: "",
      },
      subForm2: {
        postedAllTransactionsCredit: "",
      },
    },
    comments: { endingBalance: 0 },
    commentsOpen: false,
    dateBankReconciliation: "",
    creditAccountNames: [],
  });
  const [generalData, setGeneralData] = useState({
    generalAccountNames: "",
    options: {
      subForm1: {
        operatingStatements: "",
        savedOperatingStatements: "",
        postedAllTransactions: "",
        postedAllMatter: "",
        bankReconciliationCompleted: "",
      },
      subForm2: {
        SequentiallyNumberedCheques: "",
        vendorInvoices: "",
        CancelledVoidedCheques: "",
        allSupportingDocumentation: "",
        BackupsForInternalApprovals: "",
        BillsForServiceFees: "",
        allGeneralChequesSigned: "",
        madeAllVendorPayments: "",
        outStandingMorethen2ques1: "",
        outStandingMorethen2ques2: "",
      },
    },
    comments: {},
    commentsOpen: false,
    fillAllDetails: false,
  });

  const [trustData, setTrustData] = useState({
    options: {
      subForm1: {
        receivedTrustBankStatements: "",
        savedTrustBankStatements: "",
        postedTransactions: "",
        confirmReconciliation: "",
      },
      subForm2: {
        confirmInternalMatter: "",
        AreTrustFundsInvestedInBills: "",
        FiledTheForm3: "Not Applicable",
        HaveYouFiledTheForm2: "Not Applicable",
        unClearedPaymentQues1: "",
        unClearedPaymentQues2: "",
      },
      subForm3: {
        sequentiallyNumberedCheques: "",
        Form9A: "",
        BackupsForClientApprovalsInternal: "",
        CancelledAndVoidedCheques: "",
        closedAnyTrustAccount: "",
        HaveYouOpenedAnyTrustAccount: "",
      },
    },
    commentsOpen: false,
    comments: {
      comment1: "",
      comment2: "",
      comment3: "",
      comment4: "",
      endingBalance: 0,
    },
    fillAllDetails: false,
    trustAccountNames: [],
    matterClientName: [],
    matterOwnerConfirmed: false,
    detailsOverdrawnClient: [],
    totalAmountDetailsOverdrawnClient: 0,
    unidentifiedTrustFunds: 0,
    detailsOfBankFeesValue: 0,
    detailsOnTrustAccountValue: 0,
    interestTrustAccountValue: 0,
    unClearedTransactionsPayment: [],
    unClearedTransactionsReceipt: [],
    clearedReceipts: [],
    clearedPayments: [],
    noAndDetailsOfInactiveClient: [
      {
        Client: "A",
        Matter: 3801.23,
        DateOfLastActivity: "Feb-21",
        Balance: 100.0,
        id: 1,
      },
      {
        Client: "B",
        Matter: 1324.421,
        DateOfLastActivity: "Jan-21",
        Balance: 50.0,
        id: 2,
      },
    ],
    detailsOfBankFeesProcessedInTrustAccount: [],
    detailsOfInterestOnTrustAccount: [],
    detailsWithClientStatusClosed: [
      {
        Client: "A",
        Matter: "3801.23",
        Status: "Closed",
        Balance: 100.0,
        id: 1,
      },
    ],
    trustBalanceOfAccount: [],
    account_id: "",
  });

  const [generalAccountTableInfo, setGeneralAccountTableInfo] = useState({
    clearedReceiptsGeneral: [],
    clearedPaymentsGeneral: [],
    unClearedReceipts: [],
    unClearedPayments: [],
    numberOfChequesGreaterThan2Months: [],
    variance: 0,
    varianceComment: "",
    closingBalanceCashback: "",
  });

  useEffect(() => {
    if (type === 1) {
      monthlyChecklistTrustDetailsById(getMonthlyChecklistId()).then((body) => {
        account_id.current = body?.account_id;
        account_name.current = body?.task_type_account;
        account_fromdate.current = body?.task_from;
        account_todate.current = body?.task_to;

        console.log("body befor", body);

        if (
          body !== null &&
          body.trust_account &&
          Object.keys(JSON.parse(body.trust_account)).length !== 0
        ) {
          const formData1 = body?.trust_account
            ? JSON.parse(body?.trust_account)
            : "";
          const taskDetailsTrust = body?.reports
            ? JSON.parse(body?.reports)
            : "";

          console.log("formData1TRust", taskDetailsTrust);

          setTrustData((prev) => ({
            ...prev,
            comments: {
              ...prev.comments,
              ...formData1.comments,
            },
            detailsOfInterestOnTrustAccount:
              formData1?.detailsOfInterestOnTrustAccount,
            detailsOnTrustAccountValue: formData1?.detailsOnTrustAccountValue,
            closingBalance: formData1?.closingBalance,
            clientTrustBalance: formData1?.clientTrustBalance,
            dateBankReconciliation: formData1?.dateBankReconciliation,
            clientInactiveAccount: formData1?.clientInactiveAccount,
            clientBalanceStatus: formData1?.clientBalanceStatus,
            trustBalanceOfAccount: formData1?.trustBalanceOfAccount,
            unidentifiedTrustFundsTable: formData1?.unidentifiedTrustFundsTable,
            detailsOfBankFeesProcessedInTrustAccount:
              formData1?.detailsOfBankFeesProcessedInTrustAccount,
            // options: {
            //   ...formData1.options,
            //   subForm1: {
            //     ...prev.options.subForm1,
            //     ...formData1.options.subForm1,
            //   },
            //   subForm2: {
            //     ...prev.options.subForm2,
            //     ...formData1.options.subForm2,
            //   },
            //   subForm3: {
            //     ...prev.options.subForm3,
            //     ...formData1.options.subForm3,
            //   },
            // },

            options: {
              ...prev.options,
              subForm1: {
                ...(prev.options?.subForm1 || {}),
                ...(formData1.options?.subForm1 || {}),
              },
              subForm2: {
                ...(prev.options?.subForm2 || {}),
                ...(formData1.options?.subForm2 || {}),
              },
              subForm3: {
                ...(prev.options?.subForm3 || {}),
                ...(formData1.options?.subForm3 || {}),
              },
            },
          }));
        }
      });
    } else if (type === 2) {
      monthlyChecklistGeneralById(getMonthlyChecklistId()).then((body) => {
        if (
          body !== "" &&
          body !== null &&
          Object.keys(JSON.parse(body.general_account)).length !== 0
        ) {
          const generalInfo = body?.general_account
            ? JSON.parse(body?.general_account)
            : "";

          setGeneralData((prev) => ({
            ...prev,
            ...generalInfo,
          }));

          account_name.current = body?.task_type_account;
          account_fromdate.current = body?.task_from;
          account_todate.current = body?.task_to;
        }

        account_name.current = body?.task_type_account;
        account_fromdate.current = body?.task_from;
        account_todate.current = body?.task_to;

        // if (body !== null || body !== "" ) {
        //   const unClearedReceipts = axios.get(
        //     `uncleared/receipts/${getUserSID()}/${account_todate.current}/${body.task_type_account}`
        //   );

        //   const unClearedPayments =
        //     axios.get(`/uncleared/payments/${getUserSID()}/${account_todate.current}/${body.task_type_account}
        //       `);

        //   const numberOfChequesGreaterThan2Months = axios.get(
        //     `uncleared/cheques/dates/${getUserSID()}/${account_todate.current}/${body?.task_type_account}`
        //   );

        //   const closingBalanceCashback = axios.get(
        //     `/cashback/balance/${account_todate.current}/${getUserSID()}/${account_name.current}`
        //   );

        //   const closingCashbookBalance = axios.get(
        //     `/cashbookbalance/${getUserSID()}/${account_fromdate.current}/${account_todate.current}/${generalAccountNames[0]?.name
        //     }`
        //   );

        //   const closingBalanceGeneralLiability = axios.post(
        //     `balancesheet/${getUserSID()}/${account_fromdate.current}/${account_todate.current}`,
        //     {
        //       account: "",
        //     }
        //   );

        //   const allRequests = [
        //     unClearedReceipts,
        //     unClearedPayments,
        //     numberOfChequesGreaterThan2Months,
        //     closingBalanceCashback,
        //     closingCashbookBalance,
        //     closingBalanceGeneralLiability,
        //   ];

        //   Promise.all(allRequests)
        //     .then(([...res]) => {

        //       setGeneralAccountTableInfo((prev)=>({
        //         ...prev,
        //         unClearedReceipts: res[0]?.data.data.body,
        //         unClearedPayments: res[1]?.data.data.body,
        //         numberOfChequesGreaterThan2Months: res[2]?.data.data.body,
        //         closingBalanceCashback: res[5]?.data?.data?.body?.general || 0,
        //       }))

        //     })
        //     .catch((err) => {
        //       console.log("err of some requests in genral", err);
        //     });
        // }
      });
    } else if (type === 3) {
      axios
        .get(`/card/${getMonthlyChecklistId()}`)
        .then((res) => {
          const {
            data: {
              data: { body },
            },
          } = res;

          if (
            body !== null &&
            body !== "" &&
            Object.keys(JSON.parse(body.credit_cards)).length !== 0
          ) {
            const creditCardDetails = JSON.parse(body.credit_cards);
            console.log("creditCardDetails", creditCardDetails);

            setCardData((prev) => ({
              ...prev,
              ...creditCardDetails,
            }));
          }
        })
        .catch((err) => {
          console.log("err", err);
        });
    }
  }, [type]);

  return (
    <div ref={ref}>
      {renderFunction(type, cardDate, generalData, trustData)}
    </div>
  );
});

export default ChecklistPdf;

// function for check which checklist we need to render
const renderFunction = (type, cardDate, generalData, trustData) => {
  switch (type) {
    case 1:
      return TrustAccountChecklistPdf(trustData, type);
    case 2:
      return GeneralAccountChecklistPdf(generalData, type);
    case 3:
      return CardAccountChecklistPdf(cardDate, type);
    default:
      return TrustAccountChecklistPdf(trustData, type);
  }
};

// trust checklist questions
const TrustAccountChecklistPdf = (TrustData, type) => {
  //for finding deference
  const determineVariance = () => {
    if (
      parseFloat(TrustData?.closingBalance[0]) ===
      parseFloat(TrustData?.closingBalance[1])
    ) {
      return "0";
    } else {
      return Number(
        TrustData?.closingBalance[0] - TrustData?.closingBalance[1]
      );
    }
  };

  return (
    <div id="trust" className="row mt-4">
      <li className={""}>
        Have you received your Trust bank statements for the month of Null ?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(false, 3, TrustData, "receivedTrustBankStatements")}

          {TrustData?.options?.subForm1["receivedTrustBankStatements"] ===
            "No" && (
            <div className="form-group">
              <label>Comment</label>
              <input
                className="form-control"
                type="text"
                value={TrustData?.comments?.comment1}
              />
            </div>
          )}
        </div>
      </li>

      <li className={""}>
        Have you saved your Trust bank statements on your local
        drive/One-drive/Dropbox?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(false, 3, TrustData, "savedTrustBankStatements")}

          {TrustData?.options?.subForm1["savedTrustBankStatements"] ===
            "No" && (
            <div className="form-group">
              <label>Comment</label>
              <input
                className="form-control"
                type="text"
                value={TrustData?.comments?.comment2}
              />
            </div>
          )}
        </div>
      </li>

      <li className={""}>
        Have you posted all trust transactions on Clio for Null?
        {
          <div className="d-flex flex-wrap form-group flex-row m-0">
            {YesOrNo(false, 3, TrustData, "postedTransactions")}

            {TrustData?.options?.subForm1["postedTransactions"] === "No" && (
              <div className="form-group">
                <label>Comment</label>
                <input type="text" value={TrustData?.comments?.comment3} />
              </div>
            )}
          </div>
        }
      </li>
      <li className={""}>
        Have you reconciled the trust account balance?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(false, 3, TrustData, "confirmReconciliation")}

          {TrustData?.options?.subForm1["confirmReconciliation"] === "Yes" && (
            <div className="form-group col-md-6">
              <DatePicker
                format="MM/ dd/ yy"
                value={
                  TrustData?.dateBankReconciliation
                    ? new Date(TrustData?.dateBankReconciliation)
                    : ""
                }
              />
            </div>
          )}
        </div>
      </li>

      <li className={""}>
        Please confirm the closing trust account balance:
        <div className="form-group">
          <NumberFormat
            value={TrustData?.comments?.endingBalance}
            inputMode="numeric"
            prefix={"$"}
            name="endingBalance"
          />
        </div>
      </li>

      <li className={""}>
        Overview of bank reconciliation
        <div className="tableOuter m-0 mt-2 mb-3 addTaskGrid">
          <table className="table customGrid">
            <thead>
              <tr>
                <th>Cash book balance</th>
                <th>Client trust ledger balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {/* 0 */}
                {TrustData?.closingBalance?.length > 0 &&
                  TrustData?.closingBalance?.map((element, index) => {
                    return <td>{formatNumberInThousands(element, 2)}</td>;
                  })}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label>Difference</label>

              <input
                type="text"
                value={
                  TrustData?.closingBalance?.length > 0
                    ? determineVariance()
                    : 0
                }
              />
            </div>
          </div>
          <div className="col-md-6 d-flex align-items-center justify-content-center">
            {TrustData?.closingBalance?.length > 0 &&
            determineVariance() === 0 ? (
              <span className="text">
                The trust cash book balance ties with the client trust listing
                and client trust ledger.
              </span>
            ) : (
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  style={{ width: "401px" }}
                  className="form-control"
                  type="text"
                  value={"Dummy comment"}
                />
              </div>
            )}
          </div>
        </div>
      </li>

      <li className={""}>
        Uncleared bank transactions
        <div className="tableOuter m-0 addTaskGrid mb-4">
          Have you reviewed the uncleared deposits? Are there uncashed cheques
          (Deposits) that are outstanding for more than two months?
          <div className="d-flex flex-wrap form-group flex-row m-0">
            {YesOrNo(false, 3.2, TrustData, "unClearedPaymentQues1")}
          </div>
          {TrustData?.options?.subForm2["unClearedPaymentQues1"] === "Yes" && (
            <div className="form-group">
              Outstanding deposits not due to timing differences merit your
              immediate attention
            </div>
          )}
          <br />
          Have you reviewed the uncleared payments? Are there any stale-dated
          cheques listed under the outstanding cheque list?
          <div className="d-flex flex-wrap form-group flex-row m-0">
            {YesOrNo(false, 3.2, TrustData, "unClearedPaymentQues2")}
          </div>
          {TrustData?.options?.subForm2["unClearedPaymentQues2"] === "Yes" && (
            <div className="form-group">
              You may consider reissuing the cheque(s) to your client(s)
            </div>
          )}
        </div>
      </li>

      <li className={""}>
        Details of overdrawn client balances
        <div className="tableOuter m-0 addTaskGrid">
          <table className="table customGrid">
            <thead>
              <tr>
                <th>Client</th>
                <th>Matter</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {TrustData?.clientTrustBalance?.map((e, index) => {
                return (
                  <tr key={index}>
                    <td>{e.client_name}</td>
                    <td>{e.Matter_display_number}</td>
                    <td>
                      {removeNegSignAndWrapInBracketsWith2Fraction(e.amount)}
                    </td>
                  </tr>
                );
              })}

              {TrustData?.clientTrustBalance?.length === 0 && (
                <tr>
                  <td className="text-center" colSpan="3">
                    No Clients Yet
                  </td>
                </tr>
              )}

              {TrustData?.clientTrustBalance?.length !== 0 && (
                <tr>
                  <td>Total:</td>
                  <td></td>
                  <td>
                    {removeNegSignAndWrapInBracketsWith2Fraction(
                      TrustData?.clientTrustBalance?.reduce(
                        (total, e) => total + e.amount,
                        0
                      )
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </li>

      <li className={""}>
        Details of inactive client accounts <br />
        <text>
          (Inactive - there are no transaction on the client trust ledger for
          last 2 months)
        </text>
        <div className="tableOuter m-0 addTaskGrid">
          <table className="table customGrid">
            <thead>
              <tr>
                <th>Client</th>
                <th>Matter</th>
                <th>Date of Last Activity</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {TrustData?.clientInactiveAccount?.map((e, index) => {
                return (
                  <tr key={index}>
                    <td>{e.client_name}</td>
                    <td>{e.Matter_display_number}</td>
                    <td>
                      {momentFunction.formatDate(e.lastActdate, "DD/MM/YYYY")}
                    </td>
                    <td>
                      {removeNegSignAndWrapInBracketsWith2Fraction(e.amount)}
                    </td>
                  </tr>
                );
              })}

              {TrustData?.clientInactiveAccount?.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center">
                    No Clients Yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </li>

      <li className={""}>
        Details of client balances with status 'Closed'
        <div className="tableOuter m-0 addTaskGrid">
          <table className="table customGrid">
            <thead>
              <tr>
                <th>Client</th>
                <th>Matter</th>
                <th>Status</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {TrustData?.clientBalanceStatus?.map((e, index) => {
                return (
                  <tr key={index}>
                    <td>{e.client_name}</td>
                    <td>{e.Matter_display_number}</td>
                    <td>Closed</td>
                    <td>
                      {removeNegSignAndWrapInBracketsWith2Fraction(e.amount)}
                    </td>
                  </tr>
                );
              })}

              {TrustData?.clientBalanceStatus?.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center">
                    No Clients Yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </li>

      <li className={""}>
        There is an internal matter as at in the name of
        <br />
        <text className={`lg`}>
          Please confirm if any other internal matter has been maintained in the
          name of the law firm
        </text>
        <div className="d-flex flex-wrap form-group flex-row">
          {YesOrNo(false, 3.2, TrustData, "confirmInternalMatter")}
        </div>
        {TrustData?.options?.subForm2["confirmInternalMatter"] === "Yes" && (
          <div className="form-group">
            <Autocomplete multiple value={TrustData?.matterClientName} />
          </div>
        )}
        <div className="fw-bold">
          {console.log(
            "TrustData?.trustBalanceOfAccount",
            TrustData?.trustBalanceOfAccount
          )}

          {TrustData?.trustBalanceOfAccount
            ? addUpNumbersFromArray(
                TrustData?.trustBalanceOfAccount?.map(({ Balance }) =>
                  parseInt(Balance)
                )
              )
            : 0 > 0 &&
              getAllUserInfo().province === "ON" && (
                <div className="heading-normal">
                  The Law Society of Ontario doesn’t allow float or any amount
                  in the name of the lawyer or law firm or any other name such
                  as “miscellaneous”, “suspense” or “unknown” in the mixed or
                  pooled trust account.
                </div>
              )}

          {addUpNumbersFromArray(
            TrustData?.trustBalanceOfAccount?.map(({ Balance }) =>
              parseInt(Balance)
            )
          ) > 0 &&
            getAllUserInfo().province === "BC" && (
              <div className="heading-normal">
                The Law Society of British Columbia allows a deposit up to $300
                of the lawyer or law firm’s fund in the mixed or pooled trust
                account.
              </div>
            )}

          {addUpNumbersFromArray(
            TrustData?.trustBalanceOfAccount?.map(({ Balance }) =>
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
        {/* <div className="tableOuter m-0">
        <table className="table customGrid">
          <thead>
            <tr>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>


            {TrustData?.unidentifiedTrustFundsTable?.map(
              (e, index) => {
                return (
                  <tr key={index}>
                    <td>{e.Balance}</td>
                  </tr>
                );
              }
            )

            }


          </tbody>
        </table>
      </div> */}
        {TrustData?.detailsOfBankFeesValue === 0 ? null : (
          <div className="tableOuter m-0">
            <table className="table customGrid">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bank Fees</th>
                </tr>
              </thead>

              <tbody>
                {TrustData?.detailsOfBankFeesProcessedInTrustAccount?.map(
                  (e, index) => {
                    return (
                      <tr key={index}>
                        <td>{e.id}</td>
                        <td>{e.Balance}</td>
                      </tr>
                    );
                  }
                )}

                <tr>
                  <td>Total</td>
                  <td>
                    {addUpNumbersFromArray(
                      TrustData?.detailsOfBankFeesProcessedInTrustAccount?.map(
                        ({ Balance }) => parseFloat(Balance)
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {TrustData?.detailsOnTrustAccountValue === 0 ? null : (
          <div className="tableOuter m-0">
            <table className="table customGrid">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Interest</th>
                </tr>
              </thead>

              <tbody>
                {TrustData?.detailsOfInterestOnTrustAccount?.map((e, index) => {
                  return (
                    <tr key={index}>
                      <td>{e.id}</td>
                      <td>{e.Interest}</td>
                    </tr>
                  );
                })}

                <tr>
                  <td>Total</td>
                  <td>
                    {addUpNumbersFromArray(
                      TrustData?.detailsOfInterestOnTrustAccount?.map(
                        ({ Interest }) => parseFloat(Interest)
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </li>

      <li className={""}>
        Are trust funds invested in any instruments (Treasury bills, money
        market funds)
        <div className="d-flex flex-wrap form-group flex-row">
          {YesOrNo(false, 3.2, TrustData, "AreTrustFundsInvestedInBills")}
        </div>
        {TrustData?.options.subForm2["AreTrustFundsInvestedInBills"] ===
          "Yes" && (
          <div className="form-group">
            <label>Interest of Trust Account</label>
            <input
              className="form-control"
              type="number"
              value={
                TrustData?.interestTrustAccountValue !== 0
                  ? TrustData?.interestTrustAccountValue
                  : ""
              }
            />
          </div>
        )}
      </li>

      <li className={""}>
        Are all source documents available for the trust transactions during the
        month?
        <div className="form-group-wrap mt-3">
          <div className="form-group">
            <label className={""}>Form 9A</label>
            <div className="d-flex flex-wrap form-group flex-row m-0">
              {YesOrNo(true, 3.4, TrustData, "Form9A")}
            </div>
          </div>
          <div className="form-group">
            <label className={""}>Sequentially numbered cheques</label>
            <div className="d-flex flex-wrap form-group flex-row m-0">
              {YesOrNo(true, 3.4, TrustData, "sequentiallyNumberedCheques")}
            </div>
          </div>
          <div className="form-group">
            <label className={""}>
              Back-ups for client approvals and internal approvals
            </label>
            <div className="d-flex flex-wrap form-group flex-row m-0">
              {YesOrNo(
                true,
                3.4,
                TrustData,
                "BackupsForClientApprovalsInternal"
              )}
            </div>
          </div>
          <div className="form-group">
            <label className={""}>Cancelled and voided cheques</label>
            <div className="d-flex flex-wrap form-group flex-row m-0">
              {YesOrNo(true, 3.4, TrustData, "CancelledAndVoidedCheques")}
            </div>
          </div>
        </div>
      </li>
      <li className={""}>
        Are all cheques, bank drafts, electronic transactions signed/authorised
        by the appropriate signing officers of the law firm. Are all supporting
        documentation reviewed prior to signing/authorising
        <div className="d-flex flex-wrap form-group flex-row m-0 mt-2">
          {YesOrNo(true, 3.4, TrustData, "AllChequesSignedAuthorised")}
        </div>
      </li>

      <li className={""}>
        Please confirm if you have closed any trust account during last month
        <div className="d-flex flex-wrap form-group flex-row m-0 mt-2">
          {YesOrNo(true, 3.4, TrustData, "closedAnyTrustAccount")}
        </div>
        {getCurrentUserFromCookies().province === "ON" &&
          TrustData?.options.subForm3["closedAnyTrustAccount"] === "Yes" && (
            <div className="form-group mt-2">
              <label className={""}>
                Have you filed the Form 3: Report on Closing a Mixed Trust
                Account to The Law Foundation of Ontario
              </label>
              <div className="d-flex flex-wrap form-group flex-row m-0">
                {YesOrNo(false, 3.4, TrustData, "FiledTheForm3")}
              </div>
            </div>
          )}
      </li>
      <li className={""}>
        Please confirm if you have opened any trust account during last month
        <div className="d-flex flex-wrap form-group flex-row mt-2">
          {YesOrNo(true, 3.4, TrustData, "HaveYouOpenedAnyTrustAccount")}
        </div>
        {getCurrentUserFromCookies().province === "ON" &&
          TrustData?.options.subForm3["HaveYouOpenedAnyTrustAccount"] ===
            "Yes" && (
            <div className="form-group">
              <label className={""}>
                Have you filed the Form 2: Report on Opening a Mixed Trust
                Account to The Law Foundation of Ontario
              </label>
              <div className="d-flex flex-wrap form-group flex-row m-0">
                {YesOrNo(false, 3.4, TrustData, "HaveYouFiledTheForm2")}
              </div>
            </div>
          )}
      </li>

      <li className={""}>
        The monthly Law Society compliance reports for the month of Null are as
        follows:
      </li>
      <ol start="1">
        <li>Trust Receipts Journal</li>
        <li className="mt-0">Trust Disbursements Journal</li>
        <li className="mt-0">Trust Journal</li>
        <li className="mt-0">Trust Listing</li>
        <li className="mt-0">Client Trust Ledger</li>
        <li className="mt-0">Trust Transfer</li>
        <li className="mt-0">Three Way Reconciliation</li>
        <li className="mt-0">Trust Reconciliation Report</li>
      </ol>
    </div>
  );
};

// general checklist questions
const GeneralAccountChecklistPdf = (generalData, type) => {
  return (
    <div id="General" className="row mt-4">
      <li className={""}>
        Have you received your operating bank statements for Null?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(false, 2, generalData, "operatingStatements")}
        </div>
      </li>

      <li className={""}>
        Have you saved your operating bank statements on your local
        drive/sharepoint?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(false, 2, generalData, "savedOperatingStatements")}
        </div>
      </li>

      <li className={""}>
        Have you posted all transactions related to the General Account on
        Clio/QBO for Null?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(false, 2, generalData, "postedAllTransactions")}
        </div>
      </li>

      <li className={""}>
        Have you posted all matter related expenses on Clio/QBO for Null ?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(true, 2, generalData, "postedAllMatter")}
        </div>
      </li>

      <li className={""}>
        Have you reconciled the operating account balance?
        <div className="d-flex flex-wrap form-group flex-row m-0">
          {YesOrNo(true, 2, generalData, "bankReconciliationCompleted")}
          {generalData?.options?.subForm1["bankReconciliationCompleted"] ===
            "Yes" && (
            <div className="form-group  row">
              <div className="col-4"> </div>
              <div className="col-8">
                <DatePicker
                  format="MM/ dd/ yy"
                  value={
                    generalData?.dateBankReconciliation
                      ? new Date(generalData?.dateBankReconciliation)
                      : ""
                  }
                />
              </div>
              <div className="col-4"> </div>
            </div>
          )}
        </div>
      </li>

      <li className={""}>
        Please confirm the closing balance for the operating account
        <NumberFormat
          className="form-control"
          value={generalData?.comments?.endingBalance}
          inputMode="numeric"
          thousandSeparator={true}
          prefix={"$"}
        />
      </li>

      <li className={""}>
        Details of bank reconciliation are as follows:
        <ol>
          <li>
            Overview
            <ol>
              <li>
                Overview of bank reconciliation
                <div className="tableOuter m-0 mt-2 mb-3 addTaskGrid">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        <th>Cash Book balance</th>
                        <th>Bank statements</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          {/* {generalAccountTableInfo?.closingBalanceCashback ===
                                    null
                                    ? "--------"
                                    : removeNegSignAndWrapInBracketsWith2Fraction(
                                      generalAccountTableInfo?.closingBalanceCashback
                                    )} */}
                        </td>
                        <td>
                          {generalData?.comments.endingBalance
                            ? removeNegSignAndWrapInBracketsWith2Fraction(
                                generalData?.comments.endingBalance
                              )
                            : "----------"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </li>

              <li>
                Have you reviewed the uncleared deposits? Are there uncashed
                cheques (Deposits) that are outstanding for more than two
                months? <br />
                <div className="d-flex flex-wrap form-group flex-row m-0">
                  {YesOrNo(true, 2.2, generalData, "outStandingMorethen2ques1")}
                </div>
                {generalData.options.subForm2["outStandingMorethen2ques1"] ===
                  "Yes" && (
                  <div className="form-group">
                    Outstanding deposits not due to timing differences merit
                    your immediate attention
                  </div>
                )}
              </li>
              <li>
                Have you reviewed the uncleared payments? Are there any
                stale-dated cheques listed under the outstanding cheque list?{" "}
                <br />
                <div className="d-flex flex-wrap form-group flex-row m-0">
                  {YesOrNo(true, 2.2, generalData, "outStandingMorethen2ques2")}
                </div>
                {generalData?.options?.subForm2["outStandingMorethen2ques2"] ===
                  "Yes" && (
                  <div className="form-group">
                    You may consider re-issuing the cheque(s) to your client(s).
                  </div>
                )}
              </li>
            </ol>
          </li>
          <li>
            Other Details
            <ol>
              <li>
                Are all source documents available for the general transactions
                during the month?
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className={""}>
                        Sequentially numbered cheques
                      </label>
                      <div className="d-flex flex-wrap">
                        {YesOrNo(
                          true,
                          2.2,
                          generalData,
                          "SequentiallyNumberedCheques"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className={""}>Vendor invoices</label>
                      <div className="d-flex flex-wrap">
                        {YesOrNo(true, 2.2, generalData, "vendorInvoices")}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className={""}>
                        Back-ups for internal approvals
                      </label>
                      <div className="d-flex flex-wrap">
                        {YesOrNo(
                          true,
                          2.2,
                          generalData,
                          "BackupsForInternalApprovals"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className={""}>Cancelled and voided cheques</label>
                      <div className="d-flex flex-wrap">
                        {YesOrNo(
                          true,
                          2.2,
                          generalData,
                          "CancelledVoidedCheques"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className={""}>
                        Bills for service fees and disbursements
                      </label>
                      <div className="d-flex flex-wrap">
                        {YesOrNo(true, 2.2, generalData, "BillsForServiceFees")}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li className={""}>
                Are all general cheques signed by the authorised signatories.
                <div className="d-flex flex-wrap form-group flex-row m-0">
                  {YesOrNo(true, 2.2, generalData, "allGeneralChequesSigned")}
                </div>
              </li>
              <li className={""}>
                Are all supporting documentation reviewed prior to signing the
                general cheques.
                <div className="d-flex flex-wrap form-group flex-row m-0">
                  {YesOrNo(
                    true,
                    2.2,
                    generalData,
                    "allSupportingDocumentation"
                  )}
                </div>
              </li>
              <li className={""}>
                Have you made all your vendor payments?
                <div className="d-flex flex-wrap form-group flex-row m-0">
                  {YesOrNo(true, 2.2, generalData, "madeAllVendorPayments")}
                </div>
              </li>

              <li>
                The monthly Law Society compliance reports for the month of Null
                are as follows:
                <ol start="1">
                  <li>General Receipts Journal</li>
                  <li className="mt-0">General Disbursements Journal</li>
                  <li className="mt-0">General Journal</li>
                  <li className="mt-0">Client's General Journal</li>
                  <li className="mt-0">General Reconciliation Report</li>
                  <li className="mt-0">Fees Book</li>
                </ol>
              </li>
            </ol>
          </li>
        </ol>
      </li>
    </div>
  );
};

// credit-card checklist questions
const CardAccountChecklistPdf = (cardData, type) => {
  return (
    <div id="Card" className="row mt-4">
      {/* <Header data={type}/> */}

      <div className=" col-md-8 d-flex justify-content-center  flex-column">
        <div className="mt-3">
          <div className="titleHeader d-flex justify-content-between">
            <p style={{ fontSize: "21px", fontWeight: 800 }}>
              {`Monthly review checklist -${
                getMonthlyChecklistDetails().task_account
              }- ${getMonthlyChecklistDetails().task_month}
        `}
            </p>
          </div>
        </div>

        <ol>
          <p style={{ fontSize: "21px", fontWeight: 800 }}>
            Part A: Credit card details
          </p>

          <li className={""}>
            Have you received your credit card statements for Null ?
            <div className="d-flex form-group flex-row">
              {YesOrNo(false, 1, cardData, "receivedCreditCard")}
            </div>
          </li>

          <li className={""}>
            Have you saved your credit card statements on your local
            drive/sharepoint?
            <div className="d-flex form-group flex-row ">
              {YesOrNo(false, 1, cardData, "creditCardStatementsSaved")}
            </div>
          </li>

          <li className={""}>
            Credit card reconciliation completed on:
            <span style={{ fontWeight: 600, paddingLeft: "9px" }}>
              {cardData?.dateBankReconciliation
                ? momentFunction.formatDate(
                    cardData?.dateBankReconciliation,
                    "DDMMM YYYY"
                  )
                : "No yet completed"}
            </span>
          </li>

          <li className={""}>
            Credit card statement balance: $
            {cardData.comments.endingBalance
              ? cardData.comments.endingBalance
              : 0}
          </li>

          <p style={{ fontSize: "21px", fontWeight: 800, marginTop: "10px" }}>
            Part B: Sign off
          </p>

          <div className="d-flex flex-column">
            <p>
              Prepared by: {getMonthlyChecklistDetails().task_preparer_name}{" "}
            </p>
            <p>
              {" "}
              Approved by: {
                getMonthlyChecklistDetails().task_approverer_name
              }{" "}
            </p>
          </div>
        </ol>
      </div>

      {/* <div className="col-md-4 text-end">
            <img src={creditCardChecklist}></img>
          </div> */}
    </div>
  );
};

const YesOrNo = (notApplicable = false, form, Data, nameOfLabel) => {
  const notApplicableRadio = ["Yes", "No", "Not Applicable"];
  const YesOrNoArray = ["Yes", "No"];
  let arrForUsing = notApplicable ? notApplicableRadio : YesOrNoArray;

  return arrForUsing.map((e, index) => {
    return (
      <div className="checkboxGroup" key={index}>
        <label>
          <input
            type="radio"
            checked={
              form === 1
                ? Data?.options?.subForm1[nameOfLabel] === e
                : form === 2
                ? Data?.options?.subForm1[nameOfLabel] === e
                : form === 2.2
                ? Data?.options?.subForm2[nameOfLabel] === e
                : form === 3
                ? Data?.options?.subForm1[nameOfLabel] === e
                : form === 3.2
                ? Data?.options?.subForm2[nameOfLabel] === e
                : form === 3.4
                ? Data?.options?.subForm3[nameOfLabel] === e
                : Data?.options[nameOfLabel] === e
            }
            value={e}
          />
          {e}
        </label>
      </div>
    );
  });
};

const Header = ({ type }) => {
  return (
    <>
      <div className="col-md-8">
        <div className="titleHeader">
          <div className="innerTitle">
            <span>{getSvg("Lets get started")}</span>
            <label>Let's get started</label>
          </div>

          <div className="taskTypeTitle">
            {type === 1
              ? "Trust A/C"
              : type === 2
              ? "General A/C"
              : "Credit Cards"}
          </div>
        </div>
      </div>

      <div className="col-md-4 text-end">
        <img src={creditCardChecklist}></img>
      </div>
    </>
  );
};

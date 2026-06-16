import { useEffect, useState, useRef } from "react";
import Layout from "../LayoutComponents/Layout";
import {
  getCurrentUserFromCookies,
  getUserSID,
  getUserId,
  getShortFirmname,
} from "../../utils/helpers";
import { useHistory } from "react-router";
import axios from "../../utils/axios";
import Loader from "../Loader";
import { getSvg } from "../../pages/complianceForms/Compliance_assets";
import { useReactToPrint } from 'react-to-print';
import TrustDepositSlipCashTable from "./TrustDepositSlipCashTable";
import { removeNegSignAndWrapInBrackets, wrapInBracketsIfNeg } from "../../pages/calculator/reports";
import toast from "react-hot-toast";

const FormTrustDepositSlip = () => {
  const history = useHistory();

  const [bankAccountDetails, setBankAccountDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loader, setLoader] = useState(false);
  const [clientFilesDetails, setClientFilesDetails] = useState([]);
  const [clientFilesDetailsCheque, setClientFilesDetailsCheque] = useState([]);


  console.log('clientFileDeay', clientFilesDetails)

  const formTarget = useRef();
  const [valueErrorMismatch, setValueErrorMismatch] = useState({
  })
  const [amountDifference, setAmountDifference] = useState({})


  useEffect(() => {

    console.log('gsdfhkEffect', JSON.parse(history.location.state.client_files_details))

    let chequeTransactions = history.location.state.client_files_details && JSON.parse(history.location.state.client_files_details).filter(ele =>
      ele.value.transaction_type.toUpperCase().includes('CHECK') ||
      ele.value.transaction_type.toUpperCase().includes('CHEQUE') ||
      ele.value.confirmation.toUpperCase().includes('CHEQUE') ||
      ele.value.transaction_type.toUpperCase().includes('CHECK')
    );

    const cashTransactions = history.location.state.client_files_details && JSON.parse(history.location.state.client_files_details).filter(ele =>
      ele.value.confirmation.toUpperCase().includes('CASH') ||
      ele.value.transaction_type.toUpperCase().includes('CASH')
    );

    setClientFilesDetailsCheque(chequeTransactions)
    setClientFilesDetails(cashTransactions)
    setSelectedDate(history.location.state.task_due_date)
  }, [history])


  const { task_type_account, account_id, client_files_details, id } = history.location.state;

  useEffect(() => {
    setLoader(true)
    axios.get(`/clio-account-details/${account_id}/${getUserSID()}`).then((res) => {
      setBankAccountDetails(res.data.data.body[0])
      setLoader(false)
    }).catch((err) => {
      console.log(err)
      setLoader(false)
    })
  }, [account_id]);

  const ButtonWithLoader = ({ isLoading, onClick, text, disabled }) => (
    <button className="btn btnPrimary btn-sm mb-2" disabled={disabled} onClick={onClick}>
      {isLoading ?
        <>
          <i class="fa fa-refresh fa-spin " style={{ marginRight: '5px' }}></i>
          Loading...
        </>
        : text
      }
    </button>
  );

  const handlePrint = useReactToPrint({
    content: () => formTarget.current,
    documentTitle: 'Trust Deposit Slip',

    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
      }
    `,
  });

  const handleDownloadClick = () => {
    handlePrint();
  }

  const handleSaveClick = (key) => {

    let updatedFileDetails = [...clientFilesDetailsCheque, ...clientFilesDetails]

    let updateData = {
      sid: getUserSID(),
      uid: getUserId(),
      task_id: id,
      clientFilesDetails: updatedFileDetails,
      task_due_date: selectedDate
    }

    let data = {
      sid: getUserSID(),
      uid: getUserId(),
      content: formTarget.current.innerHTML,
      task_id: id,
      pdfname: 'Trust Deposit Slip',
      bucket: `cloudact-${getShortFirmname().toLowerCase()}`
    }

    Promise.all([
      axios.post('/save_trust_deposit_Slip', data),
      axios.put('/update/task/trust_deposit_slip', updateData)
    ]).then(responses => {
      toast.success('Saved successfully ');
      console.log('PDF created successfully:', responses[0]);
    }).catch(error => {
      toast.error('Something went wrong');
      console.error('Error in one of the requests:', error);
    });
  }

  const coinHandler = (event, index, totalAmount, nextInputReadValue, denomination) => {
    let { name, value } = event.target;

    let calculatedValue;
    if (denomination == 0) {
      calculatedValue = Number(value)
    } else {
      calculatedValue = value * denomination;
    }

    let newData = [...clientFilesDetails];
    let currentCoinData = newData[index].value.coin || {};
    let currentBillData = newData[index].value.bill || {};

    newData[index].value.bill = { ...currentBillData, [name]: value }
    newData[index].value.coin = { ...currentCoinData, [nextInputReadValue]: calculatedValue }

    let totalAmountWithSpecificIndex =
      (isNaN(newData[index].value.coin['5billamount']) ? 0 : newData[index].value.coin['5billamount']) +
      (isNaN(newData[index].value.coin['10billamount']) ? 0 : newData[index].value.coin['10billamount']) +
      (isNaN(newData[index].value.coin['20billamount']) ? 0 : newData[index].value.coin['20billamount']) +
      (isNaN(newData[index].value.coin['50billamount']) ? 0 : newData[index].value.coin['50billamount']) +
      (isNaN(newData[index].value.coin['100billamount']) ? 0 : newData[index].value.coin['100billamount']) +
      (isNaN(newData[index].value.coin['totalcoinamount']) ? 0 : newData[index].value.coin['totalcoinamount'])

    const key = `${index}-${name}`;
    newData[index].value.coin['totalamount'] = totalAmountWithSpecificIndex

    if (newData[index].value.coin['totalamount'] > totalAmount) {
      setValueErrorMismatch({
        ...valueErrorMismatch,
        [key]: true,
      });

      setAmountDifference({
        ...amountDifference,
        [key]: value - totalAmount
      })
    } else {

      setValueErrorMismatch({
        ...valueErrorMismatch,
        [key]: false,
      });
      setAmountDifference({
        ...amountDifference,
        [key]: 0
      })
    }
    setClientFilesDetails(newData);
  }


  return (
    <Layout title={'Welcome'}>
      <Loader isLoading={loader} loadingMsg="Loading..." />
      <div className="trustDepositOuterWrap">


        <div className="row">
          <div className="col-md-9" ref={formTarget}>
            {StyleSheet()}


            <div className="trustDepositWrapper">
              {/* <div className="leftSideWrap"> */}
              <section>
                <span className="pageTitle">DEPOSIT SLIP</span>
                <div className="upperHeaderView">
                  <span>
                    <text><b>Current Account:</b>{task_type_account}</text>
                    <text><b>Transit:</b>{bankAccountDetails?.transit_number} </text>
                    <text><b>Account Number:</b>{bankAccountDetails?.account_number}</text>
                  </span>
                  <text>Date:<input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value) }} /></text>
                </div>
                {
                  clientFilesDetailsCheque && clientFilesDetailsCheque.length !== 0 && <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Matter</th>
                        <th>Recieved from</th>
                        <th>Cheques and Credit Vouchers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        clientFilesDetailsCheque && clientFilesDetailsCheque.map((ele, index) => {
                          return <>
                            <tr key={index}>
                              <td>{ele.value.client_name}</td>
                              <td>{ele.value.matter_display_number}</td>
                              <td>{ele.value.other_party}</td>
                              <td>{removeNegSignAndWrapInBrackets(ele.value.amount)}</td>
                            </tr>
                          </>
                        })
                      }
                      <tr className="total">
                        <td style={{ textAlign: 'left' }} colSpan={3}>Total</td>
                        <td>{clientFilesDetailsCheque && removeNegSignAndWrapInBrackets(clientFilesDetailsCheque.reduce((acc, curr) => acc + curr.value.amount, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                }
                <TrustDepositSlipCashTable
                  setValueErrorMismatch={setValueErrorMismatch}
                  amountDifference={amountDifference}
                  valueErrorMismatch={valueErrorMismatch}
                  coinHandler={coinHandler}
                  clientFilesDetails={clientFilesDetails}
                />
                <table >
                  <thead>
                    <tr className="total">
                      <th style={{ textAlign: 'left', width: "20%", borderRight: "none" }}>Total</th>
                      <th style={{ textAlign: 'left', width: "20%", borderLeft: "none", borderRight: "none" }}></th>
                      <th style={{ textAlign: 'left', width: "20%", borderLeft: "none", borderRight: "none" }}></th>
                      <th className="totalTh" style={{ textAlign: 'left', width: "22%", borderLeft: "none", borderRight: "none" }}></th>
                      <th style={{ textAlign: 'center', width: "20%" }}>
                        {history.location.state.client_files_details &&
                          removeNegSignAndWrapInBrackets(
                            JSON.parse(history.location.state.client_files_details).reduce((acc, curr) => acc + curr.value.amount, 0))}

                      </th>
                    </tr>
                  </thead>
                </table>


              </section>
              {/* </div> */}
              <div className="rightSideWrap">
                <p>Credit amount of</p>
                <p>{ getCurrentUserFromCookies().display_firmname}</p>
                <p>Trust Account</p>

                <p>Depositor's</p>
                <p>Initials</p>

                <p>Teller's</p>
                <p>Initials</p>

                <p>Teller Stamp</p>

              </div>
              {/* <aside>
                <span>Credit amount of <br />CloutAct Demo <br />Trust Account</span>
                <span>Depositor's <br />Initials</span>
                <span>Teller's <br />Initials</span>
              </aside> */}
            </div>
          </div>

          <div className="col-md-3 pt-5">
            <div className="pt-5 mt-5 position-sticky" style={{ top: '210px' }}>
              <h5 className="mb-3">
                {getSvg('Compliance form')}
                Trust Deposit Slip
              </h5>

              Сheck the information in the document <br />
              and then you can save it or print it:

              <div className="d-flex mt-3" style={{ gap: '10px' }}>
                <ButtonWithLoader
                  // isLoading={loadingApprover.saveForm}
                  onClick={handleSaveClick}
                  text='Save Document'
                />

                <button className="btn btnPrimary btn-sm mb-2"
                  onClick={handleDownloadClick}
                >
                  Print/Download
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </Layout>
  );
};

export default FormTrustDepositSlip;



const StyleSheet = () => {
  return (<style>
    {`
      .trustDepositWrapper {
        display: flex;
      }
      @media print {
        @page{
          margin-top:10px !important;
        }
          .totalTh{
            width: 8% !important;
          }
        .trustDepositWrapper {
          padding: 40px;
          width: 100%;
        }
        .rightSideWrap{
          display:block !important;
          width: 20%;
          border: #b9e1fe solid 1px;
          border-left: none !important;
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
          text-align: center;
          font-weight:bold;
        }
        .trustDepositWrapper > section{
          width: 80% !important;
          border-top-right-radius: 0px;
         border-bottom-right-radius: 0px;
        }
      }
      .trustDepositWrapper > section{
        padding: 20px;
        border: #b9e1fe solid 1px;
        border-radius: 10px;
        display: flex;
        gap:10px;
        flex-direction: column;
        width: 100%;
      }
      .trustDepositWrapper .rightSideWrap{
          display: none;
          
        }
        .trustDepositWrapper .rightSideWrap p{
          margin:0;
        }
        .trustDepositWrapper .rightSideWrap p:first-child{
          padding: 20px 10px 20px 10px;
          margin: 0;
        }
        .trustDepositWrapper .rightSideWrap p:nth-child(2),
        .trustDepositWrapper .rightSideWrap p:nth-child(3),
        .trustDepositWrapper .rightSideWrap p:nth-child(5),
        .trustDepositWrapper .rightSideWrap p:nth-child(7){
          padding: 0px 10px 20px 10px;
        }
        .trustDepositWrapper .rightSideWrap p:nth-child(4),
        .trustDepositWrapper .rightSideWrap p:nth-child(6),
        .trustDepositWrapper .rightSideWrap p:nth-child(8){
          padding: 20px 0px 20px 0px;
          border-top: #b9e1fe solid 1px;
        }
      .trustDepositWrapper > section > span{
        display: flex;
        gap: 5px;
        align-items: center;
      }
      .trustDepositWrapper input{
        border:#999 solid 1px;
       
      }
      p:empty{
        display: none;}
      .trustDepositWrapper table td input {
       width: 150px;
       height: 40px;
        margin: auto;
        border: #b9e1fe solid 1px;
        border-radius: 10px;
        text-align: center;
      }

      .trustDepositWrapper > section > span text{
        margin-left: auto;
      }
      .trustDepositWrapper > section > *{
        width: 100%;
      }
      .trustDepositWrapper table:not(.noStyle) td, .trustDepositWrapper table:not(.noStyle) th{
        border:#b9e1fe solid 1px;
        text-align: center;
        padding:10px;
        vertical-align: baseline;
      }
        .trustDepositWrapper table:not(.noStyle) th {
    background: #e3f3ff;
}
      .trustDepositWrapper aside {
        min-width: 180px; 
        max-width: 180px;
        border: #ddd solid 1px;
      }
        
      .total td{
        font-weight: bold;
        font-size: 16px;
      }
      .trustDepositWrapper aside span{
        padding: 0 0 0 10px;
        display: flex;
        flex-direction: column;
        line-height: 70px;
        border-bottom: #ddd solid 1px;
      }
        .upperHeaderView {
    display: flex;
    justify-content: space-between;
}
.upperHeaderView span{
    display:flex;
    flex-direction:column;
    gap:5px;
}
.upperHeaderView text{
    display:flex;
    gap:5px;
    align-items:center;
}
    .upperHeaderView  input{
    
       width: 150px;
       height: 40px;
       padding: 0 10px;
        border: #b9e1fe solid 1px;
        border-radius: 10px;
        }
    .pageTitle {
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
}
    `}
  </style>
  )
}

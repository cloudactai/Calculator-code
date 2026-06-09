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

  const tdStyling = {
    border: '1px solid #dee2e6',
    padding: '3px 8px 3px 8px',
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
          <div className="col-md-8 d-flex" ref={formTarget}>
            <div className="pr-3 trustDepositInnerWrap">
              <span>DEPOSIT SLIP</span>
              <p className="m-0 mt-2">Current Account <span>- {task_type_account}</span></p>
              <p className="m-0 mt-2 d-flex">Date:
                <input type="date" className="d-block ml-3" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value) }} />
              </p>
              <p className="m-0 mt-2 d-flex justify-content-between">
                <span className="d-flex">
                  Transit:
                  <input type="text" value={bankAccountDetails?.transit_number} className="d-block ml-3 border-0" />
                </span>
                <span>Teller Stamp</span>
              </p>
              <p className="m-0 mt-2 d-flex">Account Number:
                <input type="text" value={bankAccountDetails?.account_number} className="d-block ml-3 border-0" />
              </p>

              <div className="tableOuterWrap w-100 mt-4">
                {
                  clientFilesDetailsCheque && clientFilesDetailsCheque.length !== 0 && <table className="w-100">
                    <thead>
                      <tr>
                        <th style={{ ...tdStyling }} className="fw-bold">Client</th>
                        <th style={{ ...tdStyling }} className="fw-bold">Matter</th>
                        <th style={{ ...tdStyling }} className="fw-bold">Recieved from</th>
                        <th style={{ ...tdStyling }} className="fw-bold">Cheques and Credit Vouchers</th>
                      </tr>
                    </thead>
                    <tbody>


                      {
                        clientFilesDetailsCheque && clientFilesDetailsCheque.map((ele, index) => {
                          return <>
                            <tr key={index}>
                              <td style={{ ...tdStyling }} scope="row">{ele.value.client_name}</td>
                              <td style={{ ...tdStyling }} scope="row">{ele.value.matter_display_number}</td>
                              <td style={{ ...tdStyling }} scope="row">{ele.value.other_party}</td>
                              <td style={{ ...tdStyling }} scope="row">{removeNegSignAndWrapInBrackets(ele.value.amount)}</td>
                            </tr>
                          </>
                        })
                      }

                      <tr>
                        <td style={{ ...tdStyling }} colSpan={3} className="fw-bold">Total</td>
                        <td style={{ ...tdStyling }} className="fw-bold">
                          {clientFilesDetailsCheque && removeNegSignAndWrapInBrackets(clientFilesDetailsCheque.reduce((acc, curr) => acc + curr.value.amount, 0))}
                        </td>

                      </tr>
                    </tbody>
                  </table>
                }

              </div>

              <div className="tableOuterWrap w-100 mt-4">
                <TrustDepositSlipCashTable
                  setValueErrorMismatch={setValueErrorMismatch}
                  amountDifference={amountDifference}
                  valueErrorMismatch={valueErrorMismatch}
                  coinHandler={coinHandler}
                  clientFilesDetails={clientFilesDetails}
                />

                <div className="tableOuterWrap w-100 mt-4">
                  <table className="w-100">
                    <tr>
                      <td className="fw-bold">Total</td>
                      <td className="fw-bold text-right">


                        {clientFilesDetails && removeNegSignAndWrapInBrackets(clientFilesDetails.reduce((acc, curr) => acc + curr.value.amount, 0))}


                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>



            <div className="pt-5 mt-5 border-left rightSideBarWithForm">

              <p className="border-bottom m-0">
                Credit amount of <br /> <span>CloutAct Demo</span><br /> Trust Account
              </p>
              <p className="mt-2 mb-4">
                Depositor's
              </p>
              <p className="border-bottom">Initials</p>
              <p className="mb-4">
                Teller's
              </p>
              <p className="border-bottom">Initials</p>
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

import { removeNegSignAndWrapInBrackets, wrapInBracketsIfNeg } from "../../pages/calculator/reports";
import { useState } from "react";
const TrustDepositSlipCashTable = ({ clientFilesDetails, amountDifference, coinHandler, valueErrorMismatch }) => {

  const cashTransactions = clientFilesDetails && clientFilesDetails.filter(ele =>
    ele.value.confirmation.toUpperCase().includes('CASH') ||
    ele.value.transaction_type.toUpperCase().includes('CASH')
  );

  return (
    <>
      {
        cashTransactions && cashTransactions.length
        !== 0 && <table >
          <thead>
            <tr>
              <th>Client</th>
              <th>Matter</th>
              <th>Recieved from</th>
              <th>Details</th>
              <th style={{ textAlign: 'center' }} colSpan={2}>Cash</th>
            </tr>
          </thead>

          <tbody>

            {
              cashTransactions && cashTransactions.map((ele, index) => {
               console.log('ele.valueUINmao',ele.value)
                return <>
                  <tr >
                    <td>{ele.value.client_name}</td>
                    <td>{ele.value.matter_display_number}</td>
                    <td>{ele.value.other_party}</td>

                    <td >
                      * $5
                    </td>

                    <td style={{textAlign: 'center' }}  >

                      <input
                        value={ele.value.bill['5billcount']}
                        style={{ border: valueErrorMismatch[`${index}-5billcount`] ? '2px solid red' : '' }}

                        name="5billcount"
                        type="text"
                        onChange={(e) => coinHandler(e, index, ele.value.amount, '5billamount', 5)} />
                      {
                        valueErrorMismatch[`${index}-5billcount`] &&
                        <p style={{ color: 'red' }}>
                          Amount mismatch
                        </p>
                      }

                    </td>

                    <td style={{textAlign: 'center' }} >
                      <input
                        value={ele.value.coin['5billamount']}
                        type="text"
                        name="5billamount"
                        readOnly
                      />
                    </td>

                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>* $10
                    </td>
                    <td style={{textAlign: 'center' }}  >
                      <input
                        value={ele.value.bill['10billcount']}
                        name="10billcount"
                        type="text"
                        style={{ border: valueErrorMismatch[`${index}-10billcount`] ? '2px solid red' : '' }}

                        onChange={(e) => coinHandler(e, index, ele.value.amount, '10billamount', 10)}
                      />

                      {
                        valueErrorMismatch[`${index}-10billcount`] && <p style={{ color: 'red' }}>
                          Amount mismatch
                        </p>
                      }


                    </td>
                    <td style={{textAlign: 'center' }}  >
                      <input
                        value={ele.value.coin['10billamount']}
                        name="10billamount"
                        type="text"
                        readOnly
                      />
                    </td>

                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>* $20
                    </td>
                    <td style={{textAlign: 'center' }}   >
                      <input
                        value={ele.value.bill['20billcount']}
                        name="20billcount"
                        type="text"
                        style={{ border: valueErrorMismatch[`${index}-20billcount`] ? '2px solid red' : '' }}

                        onChange={(e) => coinHandler(e, index, ele.value.amount, '20billamount', 20)} />

                      {
                        valueErrorMismatch[`${index}-20billcount`] && <p style={{ color: 'red' }}>
                          {valueErrorMismatch[`${index}-20billcount`] ? `Amount mismatch` : ''}
                        </p>
                      }


                    </td>

                    <td style={{textAlign: 'center' }} >
                      <input
                        value={ele.value.coin['20billamount']}
                        type="text"
                        name="20billamount"
                        readOnly
                      />
                    </td>

                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>* $50
                    </td>
                    <td style={{textAlign: 'center' }}>
                      <input
                        name="50billcount"
                        type="text"
                        onChange={(e) => coinHandler(e, index, ele.value.amount, '50billamount', 50)}
                        value={ele.value.bill['50billcount']}
                        style={{ border: valueErrorMismatch[`${index}-50billcount`] ? '2px solid red' : '' }}

                      />

                      {
                        valueErrorMismatch[`${index}-50billcount`] && <p style={{ color: 'red' }}>
                          Amount mismatch
                        </p>
                      }

                    </td>

                    <td style={{textAlign: 'center' }}>

                      <input
                        style={{ border: valueErrorMismatch[`${index}-50billamount`] ? '2px solid red' : '' }}


                        name="50billamount"
                        type="text"
                        value={ele.value.coin['50billamount']}
                        readOnly
                      />



                    </td>

                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>* $100
                    </td>
                    <td style={{textAlign: 'center' }}  >

                      <input
                        type="text"
                        value={ele.value.bill['100billcount']}
                        onChange={(e) => coinHandler(e, index, ele.value.amount, '100billamount', 100)}
                        name="100billcount"
                        style={{ border: valueErrorMismatch[`${index}-100billcount`] ? '2px solid red' : '' }}

                      />

                      {
                        valueErrorMismatch[`${index}-100billcount`] && <p style={{ color: 'red' }}>
                          Amount mismatch
                        </p>
                      }

                    </td>
                    <td style={{textAlign: 'center' }}   >

                      <input
                        type="text"
                        value={ele.value.coin['100billamount']}
                        readOnly
                        name="100billamount"

                      />

                    </td>

                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>coin
                    </td>
                    <td style={{textAlign: 'center' }}   >

                      {/* <input type="text" onChange={
                      (e) => handleCoinChange(e, index,300, ele.value.amount)
                    } value={ele.value.coin['totalcoincount']} name="totalcoincount" /> */}

                    </td>
                    <td style={{textAlign: 'center' }}   >
                       <input
                        style={{ border: valueErrorMismatch[`${index}-totalcoinamount`] ? '2px solid red' : '' }}
                        type="text"
                        onChange={(e) => coinHandler(e, index, ele.value.amount, 'totalcoinamount', 0)}
                        value={ele.value.coin['totalcoinamount']}
                        name="totalcoinamount" 
                       />

                      <p style={{ color: 'red' }}>
                        {valueErrorMismatch[`${index}-totalcoinamount`] ? `Amount mismatch- ${Math.round(amountDifference[`${index}-totalcoinamount`])}` : ''}
                      </p>

                    </td>

                  </tr>
                  <tr className="total">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td colSpan={2}>Cash Total
                    </td>
                    {/* <td style={{textAlign: 'center' }}>0</td> */}
                    <td style={{textAlign: 'center' }}>
                      {removeNegSignAndWrapInBrackets(ele.value.amount)}
                    </td>

                  </tr>


                </>
              })
            }

            <tr className="total">
              <td colSpan={5} style={{textAlign: 'left' }}>Total</td>

              <td style={{textAlign: 'center' }}>
                {cashTransactions && removeNegSignAndWrapInBrackets(cashTransactions.reduce((acc, curr) => acc + curr.value.amount, 0))}
              </td>

            </tr>

          </tbody>

        </table>
      }
    </>

  )
}

export default TrustDepositSlipCashTable

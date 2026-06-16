import React from 'react'
import InputCustom from '../../../components/InputCustom'
import AllRadioInputs from './AllRadioInputs'


const YearlyChecklistSectionC = ({formData, changeFormState, setFormData, showCustomNotification, customModal, showAndHideClioNotification, showAndHideQBONotification, updateClioModal, updateQBOModal, profitAndLossGeneralExp }) => {
  return (
      <section className='mt-5'>
          <div>
              <p className="heading-4 mt-5">
                  Section C: FINANCIAL REPORTS REVIEW
              </p>

              <p className='heading-5 fw-bold mt-3'>C.1 Balance Sheet - Assets</p>

              <div>
                  <p className='heading-5 fw-bold mt-3'>C.1.1 Fixed Assets</p>
                  <p className='heading-5 my-3'>
                      Fixed assets as at December 31, 2020 is as follows:
                  </p>
                  <table className="border ml-auto w-100">
                      <thead className="heading_row heading-5">
                          <tr>
                              <th>Fixed Assets</th>
                              <th>Book value</th>
                              <th>Accumulated Depreciation</th>
                              <th>Review Note</th>
                          </tr>
                      </thead>

                      <tbody>
                          <tr>
                              <td>-</td>
                              <td>
                                  <td className="p-0">2020</td>
                                  <td>2019</td>
                                  <td>Movement</td>
                              </td>
                              <td>
                                  <td className="p-0">2020</td>
                                  <td>2019</td>
                                  <td>Movement</td>
                              </td>
                              <td>Please confirm the composition of the balances and movement for each fixed asset</td>
                          </tr>

                          <tr>
                              <td>Computer Equipment</td>
                              <td>
                                  <td className="p-0">25000</td>
                                  <td>10000</td>
                                  <td>15000</td>
                              </td>
                              <td>
                                  <td className="p-0">5000</td>
                                  <td>5000</td>
                                  <td>-</td>
                              </td>
                              <td>
                                  <AllRadioInputs
                                      data={[
                                          {
                                              label:
                                                  "",
                                              value: "confirmCompositionOfBalance1",
                                          }
                                      ]}
                                      changeFormState={(label, value) =>
                                          changeFormState(label, value)
                                      }
                                      formState={formData}
                                  />

                                  {
                                      formData.confirmCompositionOfBalance1 === "Yes" && <InputCustom
                                          type={'text'}
                                          value={formData.confirmCompositionOfBalance1Reply}
                                          label={'Specify reply'}
                                          handleChange={(e) => setFormData((prev) => ({ ...prev, confirmCompositionOfBalance1Reply: e.target.value }))}
                                      />
                                  }


                                  {
                                      formData.confirmCompositionOfBalance1 === "No" && <InputCustom
                                          type={'text'}
                                          value={formData.confirmCompositionOfBalance1Comment}
                                          label={'Specify comment'}
                                          handleChange={(e) => setFormData((prev) => ({ ...prev, confirmCompositionOfBalance1Comment: e.target.value }))}
                                      />
                                  }
                              </td>

                          </tr>
                          <tr>
                              <td>Furniture and Equipment</td>
                              <td>
                                  <td className="p-0">35000</td>
                                  <td>25000</td>
                                  <td>10000</td>
                              </td>
                              <td>
                                  <td className="p-0">1000</td>
                                  <td>500</td>
                                  <td>-</td>
                              </td>
                              <td>
                                  <AllRadioInputs
                                      data={[
                                          {
                                              label:
                                                  "",
                                              value: "confirmCompositionOfBalance2",
                                          }
                                      ]}
                                      changeFormState={(label, value) =>
                                          changeFormState(label, value)
                                      }
                                      formState={formData}
                                  />

                                  {
                                      formData.confirmCompositionOfBalance2 === "Yes" && <InputCustom
                                          type={'text'}
                                          handleChange={(e) => setFormData((prev) => ({ ...prev, confirmCompositionOfBalance2Reply: e.target.value }))}
                                          value={formData.confirmCompositionOfBalance2Reply}
                                          label={'Specify reply'}

                                      />
                                  }
                                  {
                                      formData.confirmCompositionOfBalance2 === "No" && <InputCustom
                                          type={'text'}
                                          handleChange={(e) => setFormData((prev) => ({ ...prev, confirmCompositionOfBalance2Comment: e.target.value }))}
                                          value={formData.confirmCompositionOfBalance2Comment}
                                          label={'Specify comment'}
                                      />
                                  }
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
          <div>
              <p className='heading-5 fw-bold mt-5'>C.1.2 Investments</p>
              <p className='heading-5 my-3'>
                  Investments as at December 31, 2020 amounts to:
              </p>
              <table className="border ml-auto w-100">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th>Investments</th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Short-term Investments</td>
                          <td> 25,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>
                              15,000
                          </td>
                          <td>
                              <AllRadioInputs
                                  data={[
                                      {
                                          label:
                                              "Please confirm the composition of the movement in the investment balance",
                                          value: "confirmCompositionOfMovement1",
                                      }
                                  ]}
                                  changeFormState={(label, value) => {
                                      changeFormState(label, value)


                                  }}
                                  formState={formData}
                              />

                              {
                                  formData.confirmCompositionOfMovement1 === "No" && <InputCustom
                                      type={'text'}
                                      label={'Specify comment'}
                                      handleChange={(e) => setFormData((prev) => ({ ...prev, confirmCompositionOfMovement1Comment: e.target.value }))}
                                      value={formData.confirmCompositionOfMovement1Comment}
                                  />
                              }

                          </td>
                      </tr>

                      <tr>
                          <td>Long term investments</td>
                          <td className="p-0">35000</td>
                          <td>25000</td>
                          <td>10000</td>
                          <td>
                              <AllRadioInputs
                                  data={[
                                      {
                                          label:
                                              "Please confirm the composition of the movement in the investment balance",
                                          value: "confirmCompositionOfMovement2",
                                      }
                                  ]}
                                  changeFormState={(label, value) =>
                                      changeFormState(label, value)
                                  }
                                  formState={formData}
                              />


                              {
                                  formData.confirmCompositionOfMovement2 === "No" && <InputCustom
                                      type={'text'}
                                      margin="1rem 1rem"
                                      label={'Specify comment'}
                                      value={formData.confirmCompositionOfMovement2Comment}
                                      handleChange={(e) => setFormData((prev) => ({ ...prev, confirmCompositionOfMovement2Comment: e.target.value }))}
                                  />
                              }
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>


          <div>
              <p className='heading-5 fw-bold mt-5'>Current Assets</p>
              <p className='heading-5 my-3'>
                  Account receivable as at December 31, 2020 amounts to:
              </p>
              <table className="border ml-auto w-100">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Account receivables</td>
                          <td> 25,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>
                              15,000
                          </td>
                          <td>
                              <AllRadioInputs
                                  data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately receivable as at December 31, 2020",
                                          value: "accuratelyReceivableAtDate",
                                      }
                                  ]}
                                  changeFormState={(label, value) => {
                                      changeFormState(label, value)
                                      if (value === "No") {
                                          showCustomNotification('Notify user to recheck all posting of client payments')
                                      }
                                  }
                                  }
                                  formState={formData}
                              />

                          </td>
                      </tr>
                  </tbody>
              </table>

              {customModal()}

              <p className='heading-5 mt-5'>
                  Allowance for bad debts as at December 31, 2020 amounts to:
              </p>
              <table className="border ml-auto w-100">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Allowance for bad debts</td>
                          <td> 25,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>
                              15,000
                          </td>
                          <td>
                              <AllRadioInputs
                                  data={[
                                      {
                                          label:
                                              "Please confirm if the provision for bad debts is accurately posted as at December 31, 2020",
                                          value: "confirmIfProvisionForBadDebts",
                                      }
                                  ]}
                                  changeFormState={(label, value) => {

                                      changeFormState(label, value)

                                      if (value === "No") {
                                          showCustomNotification('Please check the breakdown of the balances and post any adjustments, if any')
                                      }
                                  }
                                  }
                                  formState={formData}
                              />
                          </td>
                      </tr>
                  </tbody>
              </table>


              <p className='heading-5 mt-5'>
                  Client disbursements recoverable as at December 31, 2020 amount to:
              </p>
              <table className="border ml-auto w-100">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Client disbursements recoverable</td>
                          <td> 25,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>
                              15,000
                          </td>
                          <td>
                              <AllRadioInputs
                                  data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recoverable as at December 31, 2020.",
                                          value: "confirmAccuraterlyRecoverable",
                                      }
                                  ]}
                                  changeFormState={(label, value) => {
                                      changeFormState(label, value)
                                      if (value === "No") {
                                          showCustomNotification('Please recharge to client as appropriate')
                                      }
                                  }
                                  }
                                  formState={formData}
                              />

                          </td>
                      </tr>
                  </tbody>
              </table>


              <p className='heading-5 mt-5'>
                  Prepaid Expense as at December 31, 2020 amount to:
              </p>
              <table className="border ml-auto w-100">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Prepaid expenses</td>
                          <td> 25,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>
                              15,000
                          </td>
                          <td>
                              <AllRadioInputs
                                  data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "confirmAccuraterlyRecorded",
                                      }
                                  ]}
                                  changeFormState={(label, value) => {
                                      changeFormState(label, value)
                                      if (value === "No") {
                                          showAndHideQBONotification()
                                      }
                                  }
                                  }
                                  formState={formData}
                              />

                          </td>
                      </tr>
                  </tbody>
              </table>


              <p className='heading-5 mt-5'>
                  Other current assets as at December 31,2020 amounts to:
              </p>
              <table className="border ml-auto w-100">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Other current assets</td>
                          <td> 25,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>
                              15,000
                          </td>
                          <td>
                              <AllRadioInputs
                                  data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "otherCurrentAssets",
                                      }
                                  ]}
                                  changeFormState={(label, value) => {
                                      changeFormState(label, value)
                                      if (value === "No") {
                                          showAndHideQBONotification()
                                      }
                                  }
                                  }
                                  formState={formData}
                              />
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <div className="my-5">
              <p className="heading-5 fw-bold my-4">
                  Balance sheet - Liabilities
              </p>

              <div>
                  <p className="heading-5">Accounts payable as at December 31, 2020 amount to:</p>


                  <table className="border ml-auto w-100">
                      <thead className="heading_row heading-5">
                          <tr>
                              <th></th>
                              <th>2020</th>
                              <th>2019</th>
                              <th>Movement</th>
                              <th>Review note</th>
                          </tr>
                      </thead>

                      <tbody>
                          <tr>
                              <td> I-Worx  	</td>
                              <td> 25,000
                              </td>
                              <td>
                                  10,000
                              </td>
                              <td>
                                  15,000
                              </td>
                              <td>
                                  <AllRadioInputs
                                      data={[
                                          {
                                              label:
                                                  "Please confirm if these are accurately recorded as at December 31, 2020",
                                              value: "accountsPayable1",
                                          }
                                      ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)
                                          if (value === "No") {
                                              showAndHideQBONotification()
                                          }
                                      }
                                      }
                                      formState={formData}
                                  />


                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>

          </div>

          <div className="my-5">
              <div>
                  <p className="heading-5  mt-4">
                      Accruals and other liabilities as at December 31, 2020 amount to:
                  </p>
                  <table className="border ml-auto w-100">
                      <thead className="heading_row heading-5">
                          <tr>
                              <th></th>
                              <th>2020</th>
                              <th>2019</th>
                              <th>Movement</th>
                              <th>Review note</th>
                          </tr>
                      </thead>

                      <tbody>
                          <tr>
                              <td>Accruals</td>
                              <td> 25,000
                              </td>
                              <td>
                                  10,000
                              </td>
                              <td>
                                  15,000
                              </td>
                              <td>
                                  <AllRadioInputs
                                      data={[
                                          {
                                              label:
                                                  "Please confirm if these are accurately recorded as at December 31, 2020",
                                              value: "otherLiabilitiesRecorded",
                                          }
                                      ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)
                                          if (value === "No") {
                                              showAndHideQBONotification()
                                          }
                                      }
                                      }
                                      formState={formData}
                                  />

                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>


          {/* need api for this */}
          <div className="d-flex justify-content-between">
              <p className="heading-5">
                  Corporate taxes payable as at December 31, 2020 is:
              </p>
              <p className="heading-5">
                  1200
              </p>
          </div>

          <AllRadioInputs
              data={[
                  {
                      label:
                          "Please confirm if these are accurately recorded as at December 31, 2020",
                      value: "corporateTaxesAccuratelyRecorded",
                  }
              ]}
              changeFormState={(label, value) => {
                  changeFormState(label, value);

                  if (value === "No") {
                      showAndHideQBONotification();
                  }
              }
              }
              formState={formData}
          />

          {/* {
                                formData.corporateTaxesAccuratelyRecorded === "No" && <ModalInputCenter
                                    heading={'Please confirm if these are accurately recorded as at December 31,2020'}
                                    show={modalData.corporateTaxesAccuratelyRecorded && formData.corporateTaxesAccuratelyRecorded === "No"}
                                    changeShow={() => setModalData((prev) => ({ ...prev, corporateTaxesAccuratelyRecorded: false }))}
                                >
                                    <p className="heading-5">
                                        Please confirm if these are accurately recorded as at December 31, 2020.
                                    </p>

                                </ModalInputCenter>
                            } */}


          <div className="d-flex justify-content-between mt-5">
              <p className="heading-5">
                  HST payable as at December 31, 2020 is
              </p>
              <p className="heading-5">
                  1200
              </p>
          </div>

          <AllRadioInputs
              data={[
                  {
                      label:
                          "Please confirm if these are accurately recorded as at December 31, 2020",
                      value: "HSTPayableRecorded",
                  }
              ]}
              changeFormState={(label, value) => {
                  changeFormState(label, value)

                  if (value === "No") {
                      showAndHideQBONotification();
                  }
              }
              }
              formState={formData}
          />

          {updateQBOModal()}


          <div className="d-flex justify-content-between mt-5">
              <p className="heading-5">
                  PST payable as at December 31, 2020 is
              </p>
              <p className="heading-5">
                  1200
              </p>
          </div>

          <AllRadioInputs
              data={[
                  {
                      label:
                          "Please confirm if these are accurately recorded as at December 31, 2020",
                      value: "PSTPayableRecorded",
                  }
              ]}
              changeFormState={(label, value) => {
                  changeFormState(label, value)

                  if (value === "No") {
                      showAndHideQBONotification();
                  }
              }
              }
              formState={formData}
          />

          {/* {
                                formData.PSTPayableRecorded === "No" && <ModalInputCenter
                                    heading={'Please confirm if these are accurately recorded as at December 31,2020'}
                                    show={modalData.corporateTaxesAccuratelyRecorded && formData.corporateTaxesAccuratelyRecorded === "No"}
                                    changeShow={() => setModalData((prev) => ({ ...prev, corporateTaxesAccuratelyRecorded: false }))}
                                >
                                    <p className="heading-5">
                                        Please confirm if these are accurately recorded as at December 31, 2020.
                                    </p>

                                </ModalInputCenter>
                            } */}


          <div>
              <p className="heading-5 fw-bold my-5">
                  Balance sheet - Long Term Liabilities
              </p>

              <div className="mt-3">
                  <p>Bank loans as at December 31, 2020 is </p>

                  <table className="border ml-auto w-100 mt-3">
                      <thead className="heading_row heading-5">
                          <tr>
                              <th></th>
                              <th>2020</th>
                              <th>2019</th>
                              <th>Movement</th>
                              <th>Review Note</th>
                          </tr>
                      </thead>

                      <tbody>
                          <tr>
                              <td>Bank loans</td>
                              <td>
                                  60,000
                              </td>
                              <td>
                                  10,000
                              </td>
                              <td>50,000</td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020",
                                          value: "bankLoansRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {

                                          changeFormState(label, value)

                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="mt-5">
              <p>Notes Payable as at December 31, 2020 is </p>

              <table className="border ml-auto w-100 mt-3">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review Note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Notes payment</td>
                          <td>
                              60,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>50,000</td>
                          <td>
                              <AllRadioInputs data={[
                                  {
                                      label:
                                          "Please confirm if these are accurately recorded as at December 31, 2020",
                                      value: "notesPayableRecorded",
                                  }
                              ]}
                                  changeFormState={(label, value) => {

                                      changeFormState(label, value)

                                      if (value === "No") {
                                          showAndHideQBONotification();
                                      }
                                  }
                                  }
                                  formState={formData} />

                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>


          {updateClioModal()}
          <div className="mt-5">
              <p className="heading-5 fw-bold my-4">Balance sheet - Equity </p>

              <p className="heading-5">Share Capital as at December 31, 2020 is</p>

              <table className="border ml-auto w-100 mt-3">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review Note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Share capital</td>
                          <td>
                              60,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>50,000</td>
                          <td>
                              <AllRadioInputs data={[
                                  {
                                      label:
                                          "Please confirm if these are accurately recorded as at December 31, 2020",
                                      value: "shareCapitalRecorded",
                                  }
                              ]}
                                  changeFormState={(label, value) => {

                                      changeFormState(label, value)


                                      if (value === "No") {
                                          showAndHideQBONotification();
                                      }
                                  }
                                  }
                                  formState={formData} />

                              {/* {formData.shareCapitalRecorded === "No" && <ModalInputCenter
                                                    show={modalData.shareCapitalRecorded && formData.shareCapitalRecorded === "No"}
                                                    changeShow={() => setModalData((prev) => ({ ...prev, shareCapitalRecorded: false }))}
                                                >
                                                    <p className="heading-5">
                                                        Please confirm if these are accurately recorded as at December 31, 2020.
                                                    </p>
                                                </ModalInputCenter>} */}

                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>


          <div className="mt-4">
              <p className="heading-5">Dividend as at December 31, 2020 is</p>

              <table className="border ml-auto w-100 mt-3">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>2019</th>
                          <th>Movement</th>
                          <th>Review Note</th>
                      </tr>
                  </thead>

                  <tbody>
                      <tr>
                          <td>Dividend</td>
                          <td>
                              60,000
                          </td>
                          <td>
                              10,000
                          </td>
                          <td>50,000</td>
                          <td>
                              <AllRadioInputs data={[
                                  {
                                      label:
                                          "Please confirm if these are accurately recorded as at December 31, 2020",
                                      value: "dividendAccuratelyRecorded",
                                  }
                              ]}
                                  changeFormState={(label, value) => {
                                      changeFormState(label, value)

                                      if (value === "No") {
                                          showAndHideQBONotification();
                                      }
                                  }
                                  }
                                  formState={formData} />
                              {/* 
                                                {formData.dividendAccuratelyRecorded === "No" && <ModalInputCenter
                                                    show={modalData.dividendAccuratelyRecorded && formData.dividendAccuratelyRecorded === "No"}
                                                    changeShow={() => setModalData((prev) => ({ ...prev, dividendAccuratelyRecorded: false }))}
                                                >
                                                    <p className="heading-5">
                                                        Please confirm if these are accurately recorded as at December 31, 2020.
                                                    </p>
                                                </ModalInputCenter>} */}
                          </td>
                      </tr>
                  </tbody>
              </table>


              <div className="d-flex justify-content-between mt-5">
                  <p className="heading-5">Retained earnings as at December 31, 2020 is</p>
                  <p>50000</p>
              </div>

          </div>

          <div>
              <p className="heading-5 my-4 fw-bold">Profit & Loss - Income</p>

              <div>
                  <p className="heading-5">
                      Income summary as at December 31, 2020
                  </p>

                  <table className="border ml-auto w-100 mt-3">
                      <thead className="heading_row heading-5">
                          <tr>
                              <th></th>
                              <th>2020</th>
                              <th>Review Note</th>
                          </tr>
                      </thead>

                      <tbody>
                          <tr>
                              <td>Fee income</td>
                              <td>
                                  100
                              </td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020",
                                          value: "incomeSummaryRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {

                                          changeFormState(label, value)


                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Have all write-offs, if any been posted on Clio",
                                          value: "incomeSummaryWriteOff",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)


                                          if (value === "No") {
                                              showAndHideClioNotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  {/* update clio */}
                              </td>
                          </tr>
                          <tr>
                              <td>Disbursement income</td>
                              <td>
                                  200
                              </td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "disbursementIncomeRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)

                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  {/* update quickbook */}
                              </td>
                          </tr>
                          <tr>
                              <td>Discounts given</td>
                              <td>
                                  300
                              </td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "discountsGivenRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)

                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  {/* update quickbook */}
                              </td>
                          </tr>
                          <tr>
                              <td>Referral fees</td>
                              <td>
                                  400
                              </td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "referralFeesRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)

                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  {/* update quickbook */}
                              </td>
                          </tr>
                          <tr>
                              <td>Interest income</td>
                              <td>
                                  500
                              </td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "interestIncomeRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)

                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  {/* update quickbook */}
                              </td>
                          </tr>
                          <tr>
                              <td>Other income</td>
                              <td>
                                  600
                              </td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "otherIncomeRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)

                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  {/* update quickbook */}
                              </td>
                          </tr>
                          <tr>
                              <td>Payroll subsidy</td>
                              <td>
                                  700
                              </td>
                              <td>
                                  <AllRadioInputs data={[
                                      {
                                          label:
                                              "Please confirm if these are accurately recorded as at December 31, 2020.",
                                          value: "payrollSubsidyRecorded",
                                      }
                                  ]}
                                      changeFormState={(label, value) => {
                                          changeFormState(label, value)

                                          if (value === "No") {
                                              showAndHideQBONotification();
                                          }
                                      }
                                      }
                                      formState={formData} />

                                  {/* update quickbook */}
                              </td>
                          </tr>
                          <tr>
                              <td>Total</td>
                              <td>
                                  2800
                              </td>
                              <td>

                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>

          <p className="heading-5 fw-bold mt-5">
              Profit & Loss - General Expenses
          </p>

          <p className="heading-5">
              Expense summary as at December 31, 2020 is:
          </p>

          <div className="">
              <table className="border ml-auto w-100 mt-3">
                  <thead className="heading_row heading-5">
                      <tr>
                          <th></th>
                          <th>2020</th>
                          <th>Review Note</th>
                      </tr>
                  </thead>

                  <tbody>
                      {profitAndLossGeneralExp.map((e) => {
                          return <tr>
                              <td>{e.expenseName}</td>
                              <td>{e.yearExpense}</td>
                              <td>
                                  {e.reviewNote}
                              </td>
                          </tr>
                      })}
                  </tbody>
              </table>
          </div>

          <p className="heading-5 fw-bold mt-5">
              Profit & Loss - Payroll
          </p>

          <p className="heading-5">
              You are required to file the T4 statement by February 28, 2021
          </p>

          <AllRadioInputs data={[
              {
                  label:
                      "Please confirm if payroll related transactions agree with the T4 statement for all employees ",
                  value: "profitandLossTransAgree",
              }
          ]}
              changeFormState={(label, value) =>
                  changeFormState(label, value)
              }
              formState={formData} />

      </section>

  )
}

export default YearlyChecklistSectionC
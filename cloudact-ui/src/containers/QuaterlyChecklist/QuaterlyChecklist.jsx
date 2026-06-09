import React, { useState } from "react";
import FooterDash from "../../components/Dashboard/FooterDash/FooterDash";
import Navbar from "../../components/Dashboard/Navbar/Navbar";
import ModalInputCenter from "../../components/ModalInputCenter";
import { getCurrentUserFromCookies } from "../../utils/helpers";
import { checkProvince } from "../../utils/helpers/province";

const QuaterlyChecklist = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [formData, setFormData] = useState({
    postedAllClientMatters: "Yes",
    postedAllClientExpenses: "Yes",
    issuedAllInvoicesToClients: "Yes",
    postedAllPaymentsFromClients: "Yes",
    writeOffDiscount: "Yes",
    haveReceivedVendorBills: "Yes",
    havePostedVendorBills: "Yes",
    haveComputedPST: "Yes",
  });

  const changeFormState = (label, value) => {
    return setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const [transactionLevyModal, setTransactionLevyModal] = useState({
    show: true,
  });

  return (
    <div
      className="bg-light d-flex"
      style={{ minHeight: "100vh", maxHeight: "2000vh" }}
    >
      <Navbar setIsNavOpen={setIsNavOpen} />
      <page className="w-100">
        <div className="w-100 py-5 print">
          <div className="text-center py-5 " style={{ maxWidth: "60%" }}>
            <h1 className="heading-2">
              {getCurrentUserFromCookies().display_firmname}
            </h1>
            <p className="heading-normal fw-bold">
              <span className="text-primary-color"> </span>{" "}
            </p>
          </div>

          <div
            className="bg-white align-self-center d-flex flex-column py-5 px-4 m-auto"
            style={{
              width: "70%",
              marginBottom: "2rem",
            }}
          >
            <p className="heading-4">Section C: Tax Filing</p>

            <div>
              <p className="heading-5 my-3 fw-bold">Client billings</p>

              <AllRadioInputs
                data={[
                  {
                    label:
                      "Have you posted all time entry to client matters till March 31, 2021 on Clio",
                    value: "postedAllClientMatters",
                  },
                  {
                    label:
                      "Have you posted all clients' expenses till March 31, 2021 on Clio",
                    value: "postedAllClientExpenses",
                  },
                  {
                    label:
                      "Have you issued all invoices to clients for the year ended March 31, 2021",
                    value: "issuedAllInvoicesToClients",
                  },
                  {
                    label:
                      "Have you posted all payments received from clients till March 31, 2021 on Clio",
                    value: "postedAllPaymentsFromClients",
                  },
                  {
                    label:
                      "Has write-offs/discount been considered on bills, as applicable",
                    value: "writeOffDiscount",
                  },
                ]}
                changeFormState={(label, value) =>
                  changeFormState(label, value)
                }
                formState={formData}
              />
            </div>

            <div>
              <p className="heading-5 mt-4 fw-bold">Firm Vendor Billings</p>

              <AllRadioInputs
                data={[
                  {
                    label:
                      "Have you received all your vendor bills for the year ended March 31, 2021",
                    value: "haveReceivedVendorBills",
                  },
                  {
                    label: "Have you posted all vendor bills on Quickbooks",
                    value: "havePostedVendorBills",
                  },
                ]}
                changeFormState={(label, value) =>
                  changeFormState(label, value)
                }
                formState={formData}
              />
            </div>

            {(checkProvince.isBC() ||
              checkProvince.isSK() ||
              checkProvince.isMB() ||
              checkProvince.isQB()) && (
              <div>
                <p className="heading-5 mt-4 fw-bold">PST computation</p>
                <AllRadioInputs
                  data={[
                    {
                      label:
                        "Have you computed the PST for the month-ended April 30, 2021 (quarter-ended March 31, 2021)",
                      value: "haveComputedPST",
                    },
                  ]}
                  changeFormState={(label, value) =>
                    changeFormState(label, value)
                  }
                  formState={formData}
                />
                {formData.haveComputedPST === "Yes" && (
                  <>
                    <table className="border mx-4 w-50 ml-auto">
                      <thead className="heading_row heading-5">
                        <tr>
                          <th>PST as calculated</th>
                          <th>PST as QBO</th>
                          <th>Difference</th>
                          <th>Review Note</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <td>1000</td>
                          <td>1000</td>
                          <td>-</td>
                          <td>-</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {checkProvince.isBC() && (
              <div className="mt-4">
                <p className="heading-5 my-3 fw-bold">PST filing</p>
                <AllRadioInputs
                  data={[
                    {
                      label:
                        "You can proceed to file your PST online by April 30, 2021",
                      value: "fileYourPST",
                    },
                  ]}
                  changeFormState={(label, value) =>
                    changeFormState(label, value)
                  }
                  formState={formData}
                />
              </div>
            )}

            <div className="my-3">
              <p className="heading-5 my-3 fw-bold">GST/HST computation</p>
              <AllRadioInputs
                data={[
                  {
                    label:
                      "Have you computed the GST/HST for the month-ended April 30, 2021 (quarter-ended March 31, 2021)",
                    value: "computedGSTHST",
                  },
                ]}
                changeFormState={(label, value) =>
                  changeFormState(label, value)
                }
                formState={formData}
              />
            </div>

            {formData.computedGSTHST === "Yes" && (
              <>
                <table className="border mx-4 w-50 ml-auto">
                  <thead className="heading_row heading-5">
                    <tr>
                      <th>GST/HST as calculated</th>
                      <th>GST/HST as per QBO</th>
                      <th>Difference</th>
                      <th>Review Note</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>1000</td>
                      <td>1000</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            <div>
              <p className="heading-5 fw-bold mt-5">GST/HST filing</p>

              <div className="d-flex justify-content-between">
                <p className="heading-5">
                  You can proceed to file your GST/HST online by April 30, 2021
                </p>
                <a
                  href={
                    "https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html"
                  }
                  className="heading-5 link_darkblue text-underline"
                >
                  My Business Account - Canada.ca
                </a>
              </div>
            </div>

            <div>
              <p className="heading-5 fw-bold mt-5">Transaction levy filing</p>
              <AllRadioInputs
                data={[
                  {
                    label:
                      "Please confirm if the transaction levies for the quarter ended March 31, 2021 have been posted on Clio",
                    value: "confirmTransactionLevies",
                  },
                ]}
                changeFormState={(label, value) =>
                  changeFormState(label, value)
                }
                formState={formData}
              />
            </div>

            {formData.confirmTransactionLevies === "Yes" && (
              <div className="">
                <p>
                  The transaction levy for the quarter ended March 31, 2021
                  amount to $500
                </p>

                <div>
                  <AllRadioInputs
                    data={[
                      {
                        label:
                          "Please confirm if the transaction levy is accurately payable as at March 31, 2021",
                        value: "confirmTransactionPayable",
                      },
                    ]}
                    changeFormState={(label, value) =>
                      changeFormState(label, value)
                    }
                    formState={formData}
                  />
                </div>
              </div>
            )}

            {formData.confirmTransactionPayable === "Yes" && (
              <div className="d-flex justify-content-between align-items-center">
                <p>
                  You can proceed to file your transaction levy online by April
                  30, 2021 - Click on below link
                </p>
                <a
                  href={"https://my.lawpro.ca/new_login/login.asp"}
                  className="heading-5 link_darkblue text-underline"
                >
                  Lawyer's Professional Indemnity Company: My LAWPRO
                </a>
              </div>
            )}

            {
              <ModalInputCenter
                heading={"Please recheck the posting on Clio"}
                show={
                  formData.confirmTransactionLevy === "No" &&
                  transactionLevyModal.show
                }
                changeShow={() =>
                  setTransactionLevyModal((prev) => ({ ...prev, show: false }))
                }
                action="Ok"
                handleClick={() =>
                  setTransactionLevyModal((prev) => ({ ...prev, show: false }))
                }
              >
                <p className="heading-5">Please recheck the posting on clio</p>
              </ModalInputCenter>
            }

            <div>
              <p className="heading-5 fw-bold mt-5">
                Trust Administration fees
              </p>

              <div>
                <AllRadioInputs
                  data={[
                    {
                      label:
                        "Please confirm if funds have been received in the Trust Funds for use other than retainer, legal fees for the quarter ended April 30, 2021",
                      value: "fundsReceivedOtherThanRetainer",
                    },
                  ]}
                  changeFormState={(label, value) =>
                    changeFormState(label, value)
                  }
                  formState={formData}
                />
              </div>
            </div>
          </div>
          <FooterDash />
        </div>
      </page>
    </div>
  );
};

const AllRadioInputs = ({ label, changeFormState, formState, data }) => {
  const YesOrNo = (label) => {
    return ["Yes", "No"].map((e, index) => {
      return (
        <div
          key={index}
          className={`
           mx-4
           d-flex justify-content-start align-items-center`}
        >
          <input
            name={label}
            type="radio"
            onChange={(e) => {
              changeFormState(label, e.target.value);
            }}
            checked={formState[label] === e}
            value={e}
            className="radio_box mx-1"
          />
          <label className="heading-5">{e}</label>
        </div>
      );
    });
  };

  return data.map((s, index) => {
    return (
      <div key={index} className="d-flex justify-content-between my-3">
        <p className="heading-5">{s.label}</p>

        <div className="d-flex">{YesOrNo(s.value)}</div>
      </div>
    );
  });
};

export default QuaterlyChecklist;

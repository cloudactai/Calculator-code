import React from 'react'
import InputCustom from '../../../components/InputCustom'
import AllRadioInputs from './AllRadioInputs'


const YearlyChecklistSectionB = ({ changeFormState, formData, setFormData, errors }) => {
    return (
        <div>
            <p className="heading-4">Section B: Billing</p>

            <p className="heading-5 fw-bold mt-3">B.1 Client billings</p>

            <AllRadioInputs
                data={[
                    {
                        label:
                            "Have you posted all time entry to client matters till December 31, 2020 on Clio",
                        value: "postedAllTimeEntry",
                    },
                    {
                        label:
                            "Have you posted all clients' expenses till December 31, 2020 on Clio",
                        value: "postedAllClientsExpenses",
                    },
                    {
                        label:
                            "Have you issued all invoices to clients for the year ended December 31, 2020",
                        value: "issuedAllInvoicesToClients",
                    },
                    {
                        label:
                            "Have you posted all payments received from clients till December 31, 2020 on Clio",
                        value: "postedAllPaymentsReceived",
                    },
                    {
                        label:
                            "Has write-offs/discount been considered on bills, as applicable",
                        value: "hasWriteOffDiscount",
                    },
                ]}
                changeFormState={(label, value) =>
                    changeFormState(label, value)
                }
                formState={formData}
                errors={errors}
            />


            <div>
                <p className="heading-5 fw-bold mt-4">B.2 Firm Vendor Billings</p>

                <AllRadioInputs
                    data={[
                        {
                            label:
                                "Have you received all your vendor bills for the year ended December 31, 2020",
                            value: "receivedAllVendorBillsForYear",
                        },
                        {
                            label:
                                "Have you posted all vendor bills on Quickbooks",
                            value: "postedAllVendorBillsOnQBO",
                        },
                    ]}
                    changeFormState={(label, value) =>
                        changeFormState(label, value)
                    }
                    formState={formData}
                    errors={errors}
                />
            </div>


         

        </div>
    )
}

export default YearlyChecklistSectionB
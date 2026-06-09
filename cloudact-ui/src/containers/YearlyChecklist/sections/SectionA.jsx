import React from 'react'
import AllRadioInputs from './AllRadioInputs'

const YearlyChecklistSectionA = ({ changeFormState, formData, errors }) => {
    return (
        <div>
            <p className="heading-4">SECTION A: MATTER MANAGEMENT</p>

            <AllRadioInputs
                data={[
                    {
                        label:
                            "A.1 Have you reviewed the status of client matters - Open/Closed.",
                        value: "reviewedTheStatusOfClients",
                    },
                ]}
                changeFormState={(label, value) =>
                    changeFormState(label, value)
                }
                formState={formData}
                errors={errors}
            />

            {
                formData.reviewedTheStatusOfClients === "Yes" && <div>
                    <AllRadioInputs
                        data={[
                            {
                                label:
                                    "For Closed matters, have you provided the client with a closing letter and statement of account",
                                value: "closingLetterStatementAccount",
                            },
                            {
                                label:
                                    "For Closed matters, is there any outstanding payment to be received",
                                value: "outstandingPaymentToReceive",
                            },
                        ]}
                        changeFormState={(label, value) =>
                            changeFormState(label, value)
                        }
                        formState={formData}
                        errors={errors}
                    />

                    <div className="d-flex justify-content-between">
                        <p className="heading-5 ">For following Closed matters, there is an outstanding balance in the Trust Accounts. Please action, as applicable.</p>
                        <table className="border mx-4 w-50 ml-auto">
                            <thead className="heading_row heading-5 w-100">
                                <tr>
                                    <th>Client</th>
                                    <th>Trust Account Balance</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr
                                    className='w-100'
                                >
                                    <td>A</td>
                                    <td>100</td>
                                </tr>
                                <tr
                                    className='w-100'>
                                    <td>B</td>
                                    <td>-100</td>
                                </tr>
                                <tr
                                    className='w-100'>
                                    <td>C</td>
                                    <td>20</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            }
        </div>
    )
}

export default YearlyChecklistSectionA
import React from 'react'
import AllRadioInputs from './AllRadioInputs'


const YearlyChecklistSectionE = ({ changeFormState, formData }) => {
    return (
        <section className="my-5">
            <div className="heading-4">
                Section E: Others
            </div>

            <AllRadioInputs
                data={[
                    {
                        label:
                            "Please confirm if the Certificate of Authorisation for the Professional Corporation has been renewed by Decemeber 31, 2020",
                        value: "certificationOfAuthorisation",
                    },
                ]}
                changeFormState={(label, value) =>
                    changeFormState(label, value)
                }
                formState={formData}
            />
            <AllRadioInputs
                data={[
                    {
                        label:
                            "Please confirm if all lawyers and paralegals have completed their CPD by December 31, 2020.",
                        value: "lawyersAndParalegals",
                    },
                ]}
                changeFormState={(label, value) =>
                    changeFormState(label, value)
                }
                formState={formData}
            />
        </section>
    )
}

export default YearlyChecklistSectionE
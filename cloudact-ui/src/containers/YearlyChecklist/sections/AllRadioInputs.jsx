import React, { useEffect } from 'react'

const AllRadioInputs = ({ changeFormState, formState, data, errors }) => {

    useEffect(() => {

    }, [formState])

    const YesOrNo = (label) => {

        return ["Yes", "No"].map((e, index) => {
            return (
                <div
                    key={index}
                    className={`mx-4 d-flex justify-content-start align-items-center`}
                >
                    <input
                        name={label}
                        type="radio"
                        onChange={(e) => {
                            changeFormState(label, e.target.value);
                        }}
                        checked={formState[label] === e}
                        value={e}
                        className={`radio_box mx-1`}
                    />
                    <label className={`${errors[label] === true && 'text-error'} heading-5`}>{e}</label>
                </div>
            );
        });
    };

    return data.map((s, index) => {
        let value = s.value;
        let containsError = errors[value] ? true : false;

        return (
            <div key={index} className="d-flex justify-content-between my-3">
                <p className={`heading-5  ${containsError === true &&  "text-error"} `}>{s.label}</p>

                <div className="d-flex">{YesOrNo(s.value)}</div>
            </div>
        );
    });
};

export default AllRadioInputs;
import { useState, useEffect } from 'react'

import objectProcessor from "../../utils/helpers/object-processing/objectProcessor";
import { Accordion } from "react-bootstrap";
import Dropdown from "../../components/Matters/Form/Dropdown";
import InputCustom from "../../components/InputCustom";

import other_persons_in_household from "../../assets/images/other_persons_in_household.svg";

const OtherPersonsInHousehold = ({ OtherPersonsInHouseholdData }) => {
    const [formData, setFormData] = useState({
        live_alone: "",
        name_of_person_married_to: "",
        name_of_other_adults: "",
        number_of_children: "",
        spouse_partner_work_status: "",
        amount_spouse_partner_earns: "",
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })

        // 
    }

    const handleWorkStatusChange = (e, li) => {
        setFormData({
            ...formData,
            spouse_partner_work_status: li.value,
        })

        // 
    }

    const [progress, setProgress] = useState(0);

    const calculateProgress = () => {
        let progress = 0;

        let fields = 0;
        let fieldsFilled = 0;

        ({ fields, fieldsFilled } = objectProcessor(formData));

        progress += (fieldsFilled / fields) * 100;

        if (formData.live_alone === "yes") {
            progress = 100;
        }

        progress = Math.round(progress);

        setProgress(progress);
    };

    const [isOpen, setIsOpen] = useState(false);
    const handleAccordionStatus = (e) => {
        setIsOpen(!isOpen);
        // 
    };

    useEffect(() => {
        calculateProgress();
        OtherPersonsInHouseholdData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        });
    }, [formData, progress, isOpen]);

    const workStatusList = [
        {
            name: "Full-time",
            value: "Full Time",
        },
        {
            name: "Part-time",
            value: "Part Time",
        },
        {
            name: "Unemployed",
            value: "Unemployed",
        },
        {
            name: "Retired",
            value: "Retired",
        },
        {
            name: "Disabled",
            value: "Disabled",
        },
        {
            name: "Other",
            value: "Other",
        },
    ]

    return (
        <Accordion.Item eventKey={9}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={other_persons_in_household} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Other persons in Household</div>
                        <div>{progress}%</div>
                    </div>
                    <div className={`progress-bar ${progress === 100 ? 'done' : ''}`} style={{ "--progress-width": `${progress}%` }}></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="row pb-4">
                    <label className="form-label-custom">
                        Does the client live alone?
                    </label>
                    <div className="form-group d-flex flex-row">
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="live_alone"
                                id="other_persons_in_household_yes"
                                value="yes"
                                checked={formData.live_alone === "yes"}
                                onChange={handleChange}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="other_persons_in_household_yes"
                            >
                                Yes
                            </label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="live_alone"
                                id="other_persons_in_household_no"
                                value="no"
                                checked={formData.live_alone === "no"}
                                onChange={handleChange}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="other_persons_in_household_no"
                            >
                                No
                            </label>
                        </div>
                    </div>

                    {formData.live_alone === "no" && (
                        <div className="inputs-group pb-10px pt-4">
                            <div className="inputs-row no-action pb-10px">
                                <div className="inputs">
                                    <label className="form-label mb-0">
                                        Full legal name of person married to or cohabitating
                                        with
                                    </label>
                                    <InputCustom
                                        type="text"
                                        placeholder="Enter Name"
                                        name="name_of_person_married_to"
                                        value={formData.name_of_person_married_to}
                                        handleChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputs-row no-action pb-10px">
                                <div className="inputs">
                                    <label className="form-label mb-0">
                                        Name of other adult(s) client living with
                                    </label>
                                    <InputCustom
                                        type="text"
                                        placeholder="Enter Name"
                                        name="name_of_other_adults"
                                        value={formData.name_of_other_adults}
                                        handleChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputs-row no-action pb-30px">
                                <div className="inputs">
                                    <label className="form-label mb-0">
                                        Number of children who live in the home
                                    </label>
                                    <InputCustom
                                        type="text"
                                        placeholder="Enter Number"
                                        name="number_of_children"
                                        value={formData.number_of_children}
                                        handleChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="inputs-row no-action pb-10px">
                                <div className="inputs">
                                    <label className="form-label mb-0">
                                        Spouse’s/partner’s work status:
                                    </label>
                                    <Dropdown
                                        list={workStatusList}
                                        curListItem={formData.spouse_partner_work_status}
                                        handleChange={handleWorkStatusChange}
                                    ></Dropdown>
                                </div>
                            </div>
                            <div className="inputs-row no-action pb-50px">
                                <div className="inputs">
                                    <label className="form-label mb-0">
                                        Amount spouse/partner earns:
                                    </label>
                                    <InputCustom
                                        type="text"
                                        placeholder="Enter Amount"
                                        name="amount_spouse_partner_earns"
                                        value={formData.amount_spouse_partner_earns}
                                        handleChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </Accordion.Body>
        </Accordion.Item>
    )
}

export default OtherPersonsInHousehold
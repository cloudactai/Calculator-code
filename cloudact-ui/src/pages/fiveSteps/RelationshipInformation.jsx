import { useState, useEffect } from 'react'

import { Accordion } from "react-bootstrap";
import Dropdown from "../../components/Matters/Form/Dropdown";
import InputCustom from "../../components/InputCustom";

import relationship_information from "../../assets/images/relationship_information.svg";

const RelationshipInformation = ({ RelationshipInformationData }) => {
    const [formData, setFormData] = useState({
        dateOfMarriage: "",
        placeOfMarriage: "",
        startedLivingTogether: "",
        neverLivedTogether: "",
        dateOfSeparation: "",
        stillLivingTogether: "",
    });


    const handleFormDataChange = (e) => {

        if (e.target.name === 'dateOfMarriage') {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value,
                ['startedLivingTogether']: e.target.value,
            });

        } else {

            setFormData({
                ...formData,
                [e.target.name]: e.target.value,
            });
        }
    }

    const [progress, setProgress] = useState(0);

    const calculateProgress = () => {
        let progress = 0;
        let fields = 0;
        let fieldsFilled = 0;

        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                fields++;
                // Handle both string and boolean values
                if (typeof formData[key] === 'boolean' || formData[key] !== "") {
                    fieldsFilled++;
                }
            }
        }

        progress += (fieldsFilled / fields) * 100;
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
        RelationshipInformationData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        })
    }, [formData, progress, isOpen]);

    // Add a separate handler for checkbox changes
    const handleCheckboxChange = (name) => {
        setFormData(prevState => ({
            ...prevState,
            [name]: !prevState[name]
        }));
    };

    const yesNoList = [
        {
            name: "Yes",
            value: "Yes",
        },
        {
            name: "No",
            value: "No",
        },
    ];

    return (
        <Accordion.Item eventKey={3}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={relationship_information} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Relationship information</div>
                        <div>{progress}%</div>
                    </div>
                    <div className={`progress-bar ${progress === 100 ? 'done' : ''}`} style={{ "--progress-width": `${progress}%` }}></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="row pb-4">
                    <div className="inputs-group pb-10px pt-4">
                        <div className="inputs-row labeled pb-10px">
                            <div className="inputs inputs-2-3">
                                <label className="form-label mb-0">
                                    Date of Marriage*
                                </label>
                                <InputCustom
                                    type="date"
                                    placeholder="Choose Date"
                                    name="dateOfMarriage"
                                    value={formData.dateOfMarriage}
                                    handleChange={handleFormDataChange}
                                />
                            </div>
                            <div className="inputs inputs-2-3">
                                <label className="form-label mb-0">
                                    Place of Marriage
                                </label>
                                <InputCustom
                                    type="test"
                                    placeholder="Enter Address"
                                    name="placeOfMarriage"
                                    value={formData.placeOfMarriage}
                                    handleChange={handleFormDataChange}
                                />
                            </div>
                        </div>

                        <div className="inputs-row labeled pb-10px">
                            <div className="inputs inputs-2-3">
                                <label className="form-label mb-0">
                                    Started Living Together*
                                </label>
                                <InputCustom
                                    type="date"
                                    placeholder="Choose Date"
                                    name="startedLivingTogether"
                                    value={formData.startedLivingTogether}
                                    handleChange={handleFormDataChange}
                                />
                            </div>
                            <div className="inputs inputs-2-3">
                                {/* <label className="form-label mb-0">
                                    Never Lived Together
                                </label>
                                <Dropdown
                                    handleChange={(e, li) => setFormData({
                                        ...formData,
                                        neverLivedTogether: li.value,
                                    })}
                                    list={yesNoList}
                                    curListItem={formData.neverLivedTogether}
                                ></Dropdown> */}
                                <div className="d-flex align-items-center" style={{ height: '38px' }}> {/* Added fixed height to match other inputs */}
                                    <input
                                        type="checkbox"
                                        id="neverLivedTogether"
                                        checked={formData.neverLivedTogether}
                                        onChange={() => handleCheckboxChange('neverLivedTogether')}
                                        className="form-check-input"
                                    />
                                    <label
                                        htmlFor="neverLivedTogether"
                                        className="form-label mb-0 ms-3" // Added ms-3 for left margin
                                        onClick={() => handleCheckboxChange('neverLivedTogether')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Never Lived Together
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="inputs-row labeled pb-20px">
                            <div className="inputs inputs-2-3">
                                <label className="form-label mb-0">
                                    Date of Separation
                                </label>
                                <InputCustom
                                    type="date"
                                    placeholder="Enter Date"
                                    name="dateOfSeparation"
                                    value={formData.dateOfSeparation}
                                    handleChange={handleFormDataChange}
                                />
                            </div>
                            <div className="inputs inputs-2-3">
                                <div className="d-flex align-items-center" style={{ height: '38px' }}> {/* Added fixed height to match other inputs */}
                                    <input
                                        type="checkbox"
                                        id="stillLivingTogether"
                                        checked={formData.stillLivingTogether}
                                        onChange={() => handleCheckboxChange('stillLivingTogether')}
                                        className="form-check-input"
                                    />
                                    <label
                                        htmlFor="stillLivingTogether"
                                        className="form-label mb-0 ms-3" // Added ms-3 for left margin
                                        onClick={() => handleCheckboxChange('stillLivingTogether')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Still Living Together
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Accordion.Body>
        </Accordion.Item>
    )
}

export default RelationshipInformation
import { useState, useEffect } from 'react'

import { Accordion } from "react-bootstrap";
import InputCustom from "../../components/InputCustom";

import employment_details from "../../assets/images/employment_details.svg";

const EmploymentDetails = ({ EmploymentDetailsData }) => {
    const [activeTab, setActiveTab] = useState("Client");

    const [formData, setFormData] = useState({
        client: {
            employmentStatus: "",
            employerName: "",
            employerAddress: "",
            employedSince: "",
            businessName: "",
            businessAddress: "",
            lastEmployed: "",
            role: "Client",
        },
        opposingParty: {
            employmentStatus: "",
            employerName: "",
            employerAddress: "",
            employedSince: "",
            businessName: "",
            businessAddress: "",
            lastEmployed: "",
            role: "Opposing Party",
        },
    });

    const handleFormDataChange = (e) => {
        if (activeTab === "Client") {
            setFormData({
                ...formData,
                client: {
                    ...formData.client,
                    [e.target.name]: e.target.value,
                },
            });
        } else {
            setFormData({
                ...formData,
                opposingParty: {
                    ...formData.opposingParty,
                    [e.target.name]: e.target.value,
                },
            });
        }

        // 
    }

    const [progress, setProgress] = useState(0);

    const calculateProgress = () => {
        let clientProgress = 0;
        let opposingPartyProgress = 0;

        // Client has 50% weight
        let clientFields = 0;
        let clientFieldsFilled = 0;

        for (const key in formData.client) {
            if (formData.client.employmentStatus === "employed") {
                if (key === "employerName" || key === "employerAddress" || key === "employedSince") {
                    clientFields++;
                    if (formData.client[key] !== "") {
                        clientFieldsFilled++;
                    }
                }
            } else if (formData.client.employmentStatus === "self_employed") {
                if (key === "businessName" || key === "businessAddress") {
                    clientFields++;
                    if (formData.client[key] !== "") {
                        clientFieldsFilled++;
                    }
                }
            } else if (formData.client.employmentStatus === "unemployed") {
                if (key === "lastEmployed") {
                    clientFields++;
                    if (formData.client[key] !== "") {
                        clientFieldsFilled++;
                    }
                }
            }
        }

        clientProgress += (clientFieldsFilled / clientFields) * 50;

        // Opposing Party has 50% weight
        let opposingPartyFields = 0;
        let opposingPartyFieldsFilled = 0;

        for (const key in formData.opposingParty) {
            if (formData.opposingParty.employmentStatus === "employed") {
                if (key === "employerName" || key === "employerAddress" || key === "employedSince") {
                    opposingPartyFields++;
                    if (formData.opposingParty[key] !== "") {
                        opposingPartyFieldsFilled++;
                    }
                }
            } else if (formData.opposingParty.employmentStatus === "self_employed") {
                if (key === "businessName" || key === "businessAddress") {
                    opposingPartyFields++;
                    if (formData.opposingParty[key] !== "") {
                        opposingPartyFieldsFilled++;
                    }
                }
            } else if (formData.opposingParty.employmentStatus === "unemployed") {
                if (key === "lastEmployed") {
                    opposingPartyFields++;
                    if (formData.opposingParty[key] !== "") {
                        opposingPartyFieldsFilled++;
                    }
                }
            }
        }

        opposingPartyProgress += (opposingPartyFieldsFilled / opposingPartyFields) * 50;

        isNaN(clientProgress) && (clientProgress = 0);
        isNaN(opposingPartyProgress) && (opposingPartyProgress = 0);

        let progress = clientProgress + opposingPartyProgress;

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
        EmploymentDetailsData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        });
    }, [formData, progress, isOpen]);

    return (
        <Accordion.Item eventKey={4}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={employment_details} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Employment details</div>
                        <div>{progress}%</div>
                    </div>
                    <div className={`progress-bar ${progress === 100 ? 'done' : ''}`} style={{ "--progress-width": `${progress}%` }}></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="tab-actions pb-30px">
                    <div
                        className={`tab-action ${activeTab === "Client" ? "active" : ""
                            }`}
                        onClick={() => setActiveTab("Client")}
                    >
                        Client
                    </div>
                    <div
                        className={`tab-action ${activeTab === "Opposing Party" ? "active" : ""
                            }`}
                        onClick={() => setActiveTab("Opposing Party")}
                    >
                        Opposing Party
                    </div>
                </div>

                {activeTab === "Client" ? (
                    <>
                        <div className="row pb-4">
                            <label className="form-label-custom">
                                What is the employment status of the client?
                            </label>
                            <div className="form-group">
                                {/* Radio inputs for Employed, Self Employed and Unemployed */}
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="employmentStatus"
                                        id="employed"
                                        value="employed"
                                        checked={formData.client.employmentStatus === "employed"}
                                        onChange={handleFormDataChange}
                                    />
                                    <label className="form-check-label" htmlFor="employed">
                                        Employed
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="employmentStatus"
                                        id="self_employed"
                                        value="self_employed"
                                        checked={formData.client.employmentStatus === "self_employed"}
                                        onChange={handleFormDataChange}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="self_employed"
                                    >
                                        Self Employed
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="employmentStatus"
                                        id="unemployed"
                                        value="unemployed"
                                        checked={formData.client.employmentStatus === "unemployed"}
                                        onChange={handleFormDataChange}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="unemployed"
                                    >
                                        Unemployed
                                    </label>
                                </div>
                            </div>
                        </div>

                        {formData.client.employmentStatus === "employed" && (
                            <div className="row pb-4">
                                <div className="inputs-group pb-10px">
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Name of Employer:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Name"
                                                name="employerName"
                                                value={formData.client.employerName}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Address of Employer:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Address"
                                                name="employerAddress"
                                                value={formData.client.employerAddress}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Employed since:
                                            </label>
                                            <InputCustom
                                                type="date"
                                                placeholder="Choose Date"
                                                name="employedSince"
                                                value={formData.client.employedSince}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.client.employmentStatus === "self_employed" && (
                            <div className="row pb-4">
                                <div className="inputs-group pb-10px">
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Name of Business:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Name"
                                                name="businessName"
                                                value={formData.client.businessName}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Address of Business:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Address"
                                                name="businessAddress"
                                                value={formData.client.businessAddress}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.client.employmentStatus === "unemployed" && (
                            <div className="row pb-4">
                                <div className="inputs-group pb-10px">
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                When last employed:
                                            </label>
                                            <InputCustom
                                                type="date"
                                                placeholder="Choose Date"
                                                name="lastEmployed"
                                                value={formData.client.lastEmployed}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="row pb-4">
                            <label className="form-label-custom">
                                What is the employment status of the client?
                            </label>
                            <div className="form-group">
                                {/* Radio inputs for Employed, Self Employed and Unemployed */}
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="employmentStatus"
                                        id="employed"
                                        value="employed"
                                        checked={formData.opposingParty.employmentStatus === "employed"}
                                        onChange={handleFormDataChange}
                                    />
                                    <label className="form-check-label" htmlFor="employed">
                                        Employed
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="employmentStatus"
                                        id="self_employed"
                                        value="self_employed"
                                        checked={formData.opposingParty.employmentStatus === "self_employed"}
                                        onChange={handleFormDataChange}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="self_employed"
                                    >
                                        Self Employed
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="employmentStatus"
                                        id="unemployed"
                                        value="unemployed"
                                        checked={formData.opposingParty.employmentStatus === "unemployed"}
                                        onChange={handleFormDataChange}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor="unemployed"
                                    >
                                        Unemployed
                                    </label>
                                </div>
                            </div>
                        </div>

                        {formData.opposingParty.employmentStatus === "employed" && (
                            <div className="row pb-4">
                                <div className="inputs-group pb-10px">
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Name of Employer:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Name"
                                                name="employerName"
                                                value={formData.opposingParty.employerName}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Address of Employer:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Address"
                                                name="employerAddress"
                                                value={formData.opposingParty.employerAddress}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Employed since:
                                            </label>
                                            <InputCustom
                                                type="date"
                                                placeholder="Choose Date"
                                                name="employedSince"
                                                value={formData.opposingParty.employedSince}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.opposingParty.employmentStatus === "self_employed" && (
                            <div className="row pb-4">
                                <div className="inputs-group pb-10px">
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Name of Business:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Name"
                                                name="businessName"
                                                value={formData.opposingParty.businessName}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                Address of Business:
                                            </label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Write Address"
                                                name="businessAddress"
                                                value={formData.opposingParty.businessAddress}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.opposingParty.employmentStatus === "unemployed" && (
                            <div className="row pb-4">
                                <div className="inputs-group pb-10px">
                                    <div className="inputs-row no-action pb-10px">
                                        <div className="inputs">
                                            <label className="form-label mb-0">
                                                When last employed:
                                            </label>
                                            <InputCustom
                                                type="date"
                                                placeholder="Choose Date"
                                                name="lastEmployed"
                                                value={formData.opposingParty.lastEmployed}
                                                handleChange={handleFormDataChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

            </Accordion.Body>
        </Accordion.Item>
    )
}

export default EmploymentDetails
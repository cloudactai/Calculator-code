import { useState, useEffect } from 'react'

import { Accordion } from "react-bootstrap";
import Dropdown from "../../components/Matters/Form/Dropdown";
import InputCustom from "../../components/InputCustom";

import income_and_benefits from "../../assets/images/income_and_benefits.svg";
import { benefitsDetails, financialYear, incomeDetails, incomeDetailsON, incomeDetailsBC } from '../../utils/matterData/categoryData';
import { getCurrentUserFromCookies } from '../../utils/helpers';

const IncomeAndBenefits = ({ IncomeAndBenefitsData }) => {

    const getIncomeDetails = () => {
        return getCurrentUserFromCookies().province === 'ON' ? incomeDetailsON : getCurrentUserFromCookies().province === 'BC' ? incomeDetailsBC : incomeDetails;
    }
    const [activeTab, setActiveTab] = useState("Client");

    const [formData, setFormData] = useState({
        financialYear: "",
        client: {
            income: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "Client",
                    incomeBenefit: "income"
                }
            ],
            benefit: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "Client",
                    incomeBenefit: "benefit"
                }
            ],
        },
        opposingParty: {
            income: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "Opposing Party",
                    incomeBenefit: "income"
                }
            ],
            benefit: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "Opposing Party",
                    incomeBenefit: "benefit"
                }
            ],
        },
    });

   

    const [total, setTotal] = useState({
        client: {
            income: {
                monthlyAmount: "0",
                yearlyAmount: "0",
            },
            benefit: {
                monthlyAmount: "0",
                yearlyAmount: "0",
            },
        },
        opposingParty: {
            income: {
                monthlyAmount: "0",
                yearlyAmount: "0",
            },
            benefit: {
                monthlyAmount: "0",
                yearlyAmount: "0",
            },
        },
    });

    useEffect(() => {
        updateTotals()
    }, [formData])

    const handleFinancialYear = (e, li) => {

        setFormData({
            ...formData,
            financialYear: li.value,
        });
        // let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        // const newFormData = { ...formData };
        // newFormData.client.income[index].type = li.name;
        // setFormData(newFormData);

        // 
    }

    // Client
    const handleClientIncomeTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.client.income[index].type = li.name;
        setFormData(newFormData);

        // 

    };

    const handleClientBenefitTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.client.benefit[index].type = li.name;
        setFormData(newFormData);

        // 
    };

    // Opposing Party
    const handleOpposingPartyIncomeTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.opposingParty.income[index].type = li.name;
        setFormData(newFormData);

        // 

    };

    const handleOpposingPartyBenefitTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.opposingParty.benefit[index].type = li.name;
        setFormData(newFormData);

        // 
    };


    // const handleCalculateTotal = (role) => {
    //     let totalMonthlyIncome = 0;
    //     let totalYearlyIncome = 0;
    //     let totalMonthlyBenefit = 0;
    //     let totalYearlyBenefit = 0;

    //     if (role === "client") {
    //         formData.client.income.forEach((item) => {

    //             if (isNaN(item.monthlyAmount) || item.monthlyAmount == "") {
    //                 item.monthlyAmount = '';
    //             }
    //             if (isNaN(item.yearlyAmount) || item.yearlyAmount == "") {
    //                 item.yearlyAmount = '';
    //             }
    //             totalMonthlyIncome += parseInt(item.monthlyAmount);
    //             totalYearlyIncome += parseInt(item.yearlyAmount);
    //         });

    //         formData.client.benefit.forEach((item) => {
    //             if (isNaN(item.monthlyAmount) || item.monthlyAmount == "") {
    //                 item.monthlyAmount = '';
    //             }
    //             if (isNaN(item.yearlyAmount) || item.yearlyAmount == "") {
    //                 item.yearlyAmount = '';
    //             }
    //             totalMonthlyBenefit += parseInt(item.monthlyAmount);
    //             totalYearlyBenefit += parseInt(item.yearlyAmount);
    //         });
    //     } else if (role === "opposingParty") {
    //         formData.opposingParty.income.forEach((item) => {
    //             if (isNaN(item.monthlyAmount) || item.monthlyAmount == "") {
    //                 item.monthlyAmount = '';
    //             }
    //             if (isNaN(item.yearlyAmount) || item.yearlyAmount == "") {
    //                 item.yearlyAmount = '';
    //             }
    //             totalMonthlyIncome += parseInt(item.monthlyAmount);
    //             totalYearlyIncome += parseInt(item.yearlyAmount);
    //         });

    //         formData.opposingParty.benefit.forEach((item) => {

    //             if (isNaN(item.monthlyAmount) || item.monthlyAmount == "") {
    //                 item.monthlyAmount = '';
    //             }
    //             if (isNaN(item.yearlyAmount) || item.yearlyAmount == "") {
    //                 item.yearlyAmount = '';
    //             }
    //             totalMonthlyBenefit += parseInt(item.monthlyAmount);
    //             totalYearlyBenefit += parseInt(item.yearlyAmount);

    //         });
    //     }

    //     switch (true) {
    //         case isNaN(totalMonthlyIncome):
    //             totalMonthlyIncome = '';
    //             break;
    //         case isNaN(totalYearlyIncome):
    //             totalYearlyIncome = '';
    //             break;
    //         case isNaN(totalMonthlyBenefit):
    //             totalMonthlyBenefit = '';
    //             break;
    //         case isNaN(totalYearlyBenefit):
    //             totalYearlyBenefit = '';
    //             break;
    //         default:
    //             break;
    //     }

    //     if (role === "client") {
    //         setTotal({
    //             ...total,
    //             client: {
    //                 income: {
    //                     monthlyAmount: totalMonthlyIncome,
    //                     yearlyAmount: totalYearlyIncome,
    //                 },
    //                 benefit: {
    //                     monthlyAmount: totalMonthlyBenefit,
    //                     yearlyAmount: totalYearlyBenefit,
    //                 },
    //             },
    //         });
    //     } else if (role === "opposingParty") {
    //         setTotal({
    //             ...total,
    //             opposingParty: {
    //                 income: {
    //                     monthlyAmount: totalMonthlyIncome,
    //                     yearlyAmount: totalYearlyIncome,
    //                 },
    //                 benefit: {
    //                     monthlyAmount: totalMonthlyBenefit,
    //                     yearlyAmount: totalYearlyBenefit,
    //                 },
    //             },
    //         });
    //     }
    // };

    const handleMonthlyChange = (index, e, role, type) => {

        if (role === 'client' && type === 'income') {
            const newFormData = { ...formData };
            const monthly = parseFloat(e.value) || '';
            newFormData.client.income[index][e.name] = monthly;
            const yearly = monthly * 12;
            newFormData.client.income[index]['yearlyAmount'] = yearly;
            setFormData(newFormData);

        }

        if (role === 'client' && type === 'benefit') {
            const newFormData = { ...formData };
            const monthly = parseFloat(e.value) || '';
            newFormData.client.benefit[index][e.name] = monthly;
            const yearly = monthly * 12;
            newFormData.client.benefit[index]['yearlyAmount'] = yearly;
            setFormData(newFormData);

        }

        if (role === 'opposingParty' && type === 'income') {
            const newFormData = { ...formData };
            const monthly = parseFloat(e.value) || '';
            newFormData.opposingParty.income[index][e.name] = monthly;
            const yearly = monthly * 12;
            newFormData.opposingParty.income[index]['yearlyAmount'] = yearly;
            setFormData(newFormData);

        }

        if (role === 'opposingParty' && type === 'benefit') {
            const newFormData = { ...formData };
            const monthly = parseFloat(e.value) || '';
            newFormData.opposingParty.benefit[index][e.name] = monthly;
            const yearly = monthly * 12;
            newFormData.opposingParty.benefit[index]['yearlyAmount'] = yearly;
            setFormData(newFormData);

        }

    };

    const handleYearlyChange = (index, e, role, type) => {

        if (role === 'client' && type === 'income') {
            const newFormData = { ...formData };

            const yearly = parseFloat(e.value) || '';

            newFormData.client.income[index][e.name] = yearly;
            const monthly = parseFloat(yearly / 12);

            newFormData.client.income[index]['monthlyAmount'] = monthly;

            setFormData(newFormData);
        }

        if (role === 'client' && type === 'benefit') {
            const newFormData = { ...formData };
            const yearly = parseFloat(e.value) || '';
            newFormData.client.benefit[index][e.name] = yearly;
            const monthly = parseFloat(yearly / 12);
            newFormData.client.benefit[index]['monthlyAmount'] = monthly;
            setFormData(newFormData);
        }

        if (role === 'opposingParty' && type === 'income') {
            const newFormData = { ...formData };
            const yearly = parseFloat(e.value) || '';
            newFormData.opposingParty.income[index][e.name] = yearly;
            const monthly = parseFloat(yearly / 12);
            newFormData.opposingParty.income[index]['monthlyAmount'] = monthly;
            setFormData(newFormData);
        }

        if (role === 'opposingParty' && type === 'benefit') {
            const newFormData = { ...formData };
            const yearly = parseFloat(e.value) || '';
            newFormData.opposingParty.benefit[index][e.name] = yearly;
            const monthly = parseFloat(yearly / 12);
            newFormData.opposingParty.benefit[index]['monthlyAmount'] = monthly;
            setFormData(newFormData);
        }
    };

    const updateTotals = () => {

        let totalMonthlyIncome;
        let totalYearlyIncome;
        let totalMonthlyBenefit;
        let totalYearlyBenefit;
        let clientData;
        let opposingPartyData;

        if (formData.client) {
            totalMonthlyIncome = formData.client.income.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);

            totalYearlyIncome = formData.client.income.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
            totalMonthlyBenefit = formData.client.benefit.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);
            totalYearlyBenefit = formData.client.benefit.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
            clientData = {
                client: {
                    income: {
                        monthlyAmount: parseFloat(totalMonthlyIncome),
                        yearlyAmount: parseFloat(totalYearlyIncome),
                    },
                    benefit: {
                        monthlyAmount: parseFloat(totalMonthlyBenefit),
                        yearlyAmount: parseFloat(totalYearlyBenefit),
                    },
                },
            }
        }

        if (formData.opposingParty) {
            totalMonthlyIncome = formData.opposingParty.income.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);
            totalYearlyIncome = formData.opposingParty.income.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
            totalMonthlyBenefit = formData.opposingParty.benefit.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);
            totalYearlyBenefit = formData.opposingParty.benefit.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
            opposingPartyData = {
                opposingParty: {
                    income: {
                        monthlyAmount: parseFloat(totalMonthlyIncome),
                        yearlyAmount: parseFloat(totalYearlyIncome),
                    },
                    benefit: {
                        monthlyAmount: parseFloat(totalMonthlyBenefit),
                        yearlyAmount: parseFloat(totalYearlyBenefit),
                    },
                },
            }
        }

        setTotal({
            client: clientData.client,
            opposingParty: opposingPartyData.opposingParty
        })
    };

    const [progress, setProgress] = useState(0);

    const calculateProgress = () => {
        let clientProgress = 0;
        let opposingPartyProgress = 0;

        // Client has 50% weight
        let clientFields = 0;
        let clientFieldsFilled = 0;

        // iterate over the income and benefit arrays, and calculate progress
        formData.client.income.forEach((item) => {
            // add the number of fields in each item to the total number of fields
            clientFields += Object.keys(item).length;
            // add the number of fields filled in each item to the total number of fields filled
            clientFieldsFilled += Object.values(item).filter((item) => item !== "").length;
        });

        formData.client.benefit.forEach((item) => {
            // add the number of fields in each item to the total number of fields
            clientFields += Object.keys(item).length;
            // add the number of fields filled in each item to the total number of fields filled
            clientFieldsFilled += Object.values(item).filter((item) => item !== "").length;
        });

        clientProgress += (clientFieldsFilled / clientFields) * 50;

        // Opposing Party has 50% weight
        let opposingPartyFields = 0;
        let opposingPartyFieldsFilled = 0;

        // iterate over the income and benefit arrays, and calculate progress
        formData.opposingParty.income.forEach((item) => {
            // add the number of fields in each item to the total number of fields
            opposingPartyFields += Object.keys(item).length;
            // add the number of fields filled in each item to the total number of fields filled
            opposingPartyFieldsFilled += Object.values(item).filter((item) => item !== "").length;
        });

        formData.opposingParty.benefit.forEach((item) => {
            // add the number of fields in each item to the total number of fields
            opposingPartyFields += Object.keys(item).length;
            // add the number of fields filled in each item to the total number of fields filled
            opposingPartyFieldsFilled += Object.values(item).filter((item) => item !== "").length;
        });

        opposingPartyProgress += (opposingPartyFieldsFilled / opposingPartyFields) * 50;

        isNaN(clientProgress) && (clientProgress = 0);
        isNaN(opposingPartyProgress) && (opposingPartyProgress = 0);

        let progress = clientProgress + opposingPartyProgress;
        progress = Math.round(progress);

        progress -= 3;


        if (formData.financialYear !== "") {
            progress += 3;
        }

        (progress < 0) && (progress = 0);

        setProgress(progress);
    };

    const [isOpen, setIsOpen] = useState(false);
    
    const handleAccordionStatus = (e) => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        calculateProgress();
        IncomeAndBenefitsData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        });
    }, [formData, progress, isOpen]);

    return (
        <Accordion.Item eventKey={5}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={income_and_benefits} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Income and benefits</div>
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
                <div className="pb-20px">
                    <div className="inputs-row">
                        <div className="inputs">
                            <div className="form-group">
                                <label className="form-label">Financial Year</label>
                                <Dropdown
                                    handleChange={handleFinancialYear}
                                    list={financialYear}
                                    curListItem={formData.financialYear}
                                ></Dropdown>
                            </div>
                            {/* <InputCustom
                                type="date"
                                name="financialYear"
                                label="Financial Year"
                                value={formData.financialYear}
                                handleChange={handleFormDataChange}
                            /> */}
                        </div>
                        <div className="action"></div>
                    </div>
                </div>

                {activeTab === "Client" ? (
                    <div className="tab-content ">
                        <div className="pb-30px">
                            <div className="sub-heading">Income</div>
                            {formData.client.income.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Income Type</label>
                                                <Dropdown
                                                    handleChange={handleClientIncomeTypeChange}
                                                    list={getIncomeDetails()}
                                                    curListItem={item.type}
                                                ></Dropdown>
                                            </div>
                                            <InputCustom
                                                type="text"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'client', 'income')}
                                            // handleChange={handleClientIncomeFormDataChange}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                // handleChange={handleClientIncomeFormDataChange}
                                                handleChange={(e) => handleYearlyChange(index, e.target, 'client', 'income')}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="action">
                                <button className="btn btn-link" onClick={() => {
                                    const newFormData = { ...formData };
                                    newFormData.client.income.push({
                                        type: "",
                                        monthlyAmount: "",
                                        yearlyAmount: "",
                                        role: "Client"
                                    });
                                    setFormData(newFormData);
                                }}>Add Income</button>
                            </div>

                            <div className="inputs-row">
                                <div className="inputs">
                                    <label className="form-label mb-0">Total Income</label>
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$ ${total.client.income.monthlyAmount}`}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$ ${total.client.income.yearlyAmount}`}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>

                        <div className="pb-30px">
                            <div className="sub-heading">Benefits</div>
                            {formData.client.benefit.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Benefit Type</label>
                                                <Dropdown
                                                    handleChange={handleClientBenefitTypeChange}
                                                    list={benefitsDetails}
                                                    curListItem={item.type}
                                                ></Dropdown>
                                            </div>
                                            <InputCustom
                                                type="text"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                // handleChange={handleClientBenefitFormDataChange}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'client', 'benefit')}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                // handleChange={handleClientBenefitFormDataChange}
                                                handleChange={(e) => handleYearlyChange(index, e.target, 'client', 'benefit')}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="action">
                                <button className="btn btn-link" onClick={() => {
                                    const newFormData = { ...formData };
                                    newFormData.client.benefit.push({
                                        type: "",
                                        monthlyAmount: "",
                                        yearlyAmount: "",
                                        role: "Client"
                                    });
                                    setFormData(newFormData);
                                }}>Add Benefit</button>
                            </div>

                            <div className="inputs-row">
                                <div className="inputs">
                                    <label className="form-label mb-0">Total Benefit</label>
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${total.client.benefit.monthlyAmount}` || 0}
                                    />

                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${total.client.benefit.yearlyAmount}` || 0}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="tab-content">
                        <div className="pb-30px">
                            <div className="sub-heading">Income</div>
                            {formData.opposingParty.income.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Income Type</label>
                                                <Dropdown
                                                    handleChange={handleOpposingPartyIncomeTypeChange}
                                                    list={getIncomeDetails()}
                                                    curListItem={item.type}
                                                ></Dropdown>
                                            </div>
                                            <InputCustom
                                                type="text"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                // handleChange={handleOpposingPartyIncomeFormDataChange}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'opposingParty', 'income')}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                // handleChange={handleOpposingPartyIncomeFormDataChange}
                                                handleChange={(e) => handleYearlyChange(index, e.target, 'opposingParty', 'income')}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="action">
                                <button className="btn btn-link" onClick={() => {
                                    const newFormData = { ...formData };
                                    newFormData.opposingParty.income.push({
                                        type: "",
                                        monthlyAmount: "",
                                        yearlyAmount: "",
                                        role: "Opposing Party"
                                    });
                                    setFormData(newFormData);
                                }}>Add Income</button>
                            </div>

                            <div className="inputs-row">
                                <div className="inputs">
                                    <label className="form-label mb-0">Total Income</label>
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${total.opposingParty.income.monthlyAmount}`}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${total.opposingParty.income.yearlyAmount}`}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>

                        <div className="pb-30px">
                            <div className="sub-heading">Benefits</div>
                            {formData.opposingParty.benefit.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Benefit Type</label>
                                                <Dropdown
                                                    handleChange={handleOpposingPartyBenefitTypeChange}
                                                    list={benefitsDetails}
                                                    curListItem={item.type}
                                                ></Dropdown>
                                            </div>
                                            <InputCustom
                                                type="text"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                // handleChange={handleOpposingPartyBenefitFormDataChange}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'opposingParty', 'benefit')}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                // handleChange={handleOpposingPartyBenefitFormDataChange}
                                                handleChange={(e) => handleYearlyChange(index, e.target, 'opposingParty', 'benefit')}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="action">
                                <button className="btn btn-link" onClick={() => {
                                    const newFormData = { ...formData };
                                    newFormData.opposingParty.benefit.push({
                                        type: "",
                                        monthlyAmount: "",
                                        yearlyAmount: "",
                                        role: "Opposing Party"
                                    });
                                    setFormData(newFormData);
                                }}>Add Benefit</button>
                            </div>

                            <div className="inputs-row">
                                <div className="inputs">
                                    <label className="form-label mb-0">Total Benefit</label>
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${total.opposingParty.benefit.monthlyAmount}`}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${total.opposingParty.benefit.yearlyAmount}`}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>
                    </div>
                )}
            </Accordion.Body>
        </Accordion.Item>
    )
}

export default IncomeAndBenefits
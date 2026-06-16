import { useState, useEffect } from 'react'

import { Accordion } from "react-bootstrap";
import Dropdown from "../../components/Matters/Form/Dropdown";
import InputCustom from "../../components/InputCustom";

import expenses from "../../assets/images/expenses.svg";
import { expenseDetails, expenseDetailsAB, expenseDetailsBC, financialYear, specialExpenses } from '../../utils/matterData/categoryData';
import { getCurrentUserFromCookies } from '../../utils/helpers';

const Expenses = ({ ExpensesData }) => {
    const [activeTab, setActiveTab] = useState("Client");
    const [selectedYear, setSelectedYear] = useState('');
    const getExpenseList = () => {
        return getCurrentUserFromCookies().province === 'AB' ? expenseDetailsAB : getCurrentUserFromCookies().province === 'BC' ? expenseDetailsBC : expenseDetails;
    }

    const [formData, setFormData] = useState({
        financialYear: '',
        client: {
            expenses: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "client"
                },
            ],
            specialChildExpenses: [
                {
                    childName: "",
                    amount: "",
                    type: "",
                    taxCredits: "",
                    role: "client"
                },
            ],
        },
        opposingParty: {
            expenses: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "opposingParty"
                },
            ],
            specialChildExpenses: [
                {
                    childName: "",
                    amount: "",
                    type: "",
                    taxCredits: "",
                    role: "opposingParty"
                },
            ],
        },
    });

    useEffect(() => {

        updateTotals()
    }, [formData, total])

    const [total, setTotal] = useState({

        client: {
            monthlyAmount: "",
            yearlyAmount: "",
        },
        opposingParty: {
            monthlyAmount: "",
            yearlyAmount: "",
        },
    });

    const handleYearChange = (e) => {
        const selectedDate = new Date(e.target.value);
        const year = selectedDate.getFullYear();
        setSelectedYear(year);

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

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

    const handleFormDataChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleClientExpenseTypeChange = (e, li) => {
        const index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        const newFormData = { ...formData };
        newFormData.client.expenses[index].type = li.value;
        setFormData(newFormData);

        // 
    };

    const handleClientSpecialChildExpenseTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        const newFormData = { ...formData };
        newFormData.client.specialChildExpenses[index].type = li.value;
        setFormData(newFormData);

        // 
    };

    const handleClientExpenseFormDataChange = (e) => {
        const index = e.target.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.client.expenses[index][e.target.name] = e.target.value;
        if (e.target.name == 'monthlyAmount') {
            let yearlyAmount = e.target.value * 12;
            newFormData.client.expenses[index]['yearlyAmount'] = yearlyAmount
        }
        setFormData(newFormData);

        handleCalculateTotal("client");
    };

    const handleClientSpecialChildExpenseFormDataChange = (e) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.client.specialChildExpenses[index][e.target.name] = e.target.value;
        setFormData(newFormData);

        // 
    };

    // Oppoisng Party
    const handleOpposingPartyExpenseTypeChange = (e, li) => {
        const index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        const newFormData = { ...formData };
        newFormData.opposingParty.expenses[index].type = li.value;
        setFormData(newFormData);

        // 
    };

    const handleOpposingPartySpecialChildExpenseTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        const newFormData = { ...formData };
        newFormData.opposingParty.specialChildExpenses[index].type = li.value;
        setFormData(newFormData);

        // 
    };

    const handleOpposingPartyExpenseFormDataChange = (e) => {
        const index = e.target.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.opposingParty.expenses[index][e.target.name] = e.target.value;
        if (e.target.name == 'monthlyAmount') {
            let yearlyAmount = e.target.value * 12;
            newFormData.opposingParty.expenses[index]['yearlyAmount'] = yearlyAmount
        }
        setFormData(newFormData);

        // 

        handleCalculateTotal("opposingParty");
    };

    const handleOpposingPartySpecialChildExpenseFormDataChange = (e) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.opposingParty.specialChildExpenses[index][e.target.name] = e.target.value;
        setFormData(newFormData);

        // 
    };

    const handleCalculateTotal = (role) => {
        let totalMonthlyAmount = 0;
        let totalYearlyAmount = 0;

        if (role === "client") {
            formData.client.expenses.forEach((item) => {
                if (isNaN(item.monthlyAmount) || item.monthlyAmount == "") {
                    item.monthlyAmount = "";
                }
                if (isNaN(item.yearlyAmount) || item.yearlyAmount == "") {
                    item.yearlyAmount = "";
                }
                totalMonthlyAmount += parseInt(item.monthlyAmount);
                totalYearlyAmount += parseInt(item.yearlyAmount);
            });
        } else if (role === "opposingParty") {
            formData.opposingParty.expenses.forEach((item) => {
                if (isNaN(item.monthlyAmount) || item.monthlyAmount == "") {
                    item.monthlyAmount = "";
                }
                if (isNaN(item.yearlyAmount) || item.yearlyAmount == "") {
                    item.yearlyAmount = "";
                }
                totalMonthlyAmount += parseInt(item.monthlyAmount);
                totalYearlyAmount += parseInt(item.yearlyAmount);
            });
        }

        switch (true) {
            case isNaN(totalMonthlyAmount):
                totalMonthlyAmount = "";
                break;
            case isNaN(totalYearlyAmount):
                totalYearlyAmount = "";
                break;
            default:
                break;
        }

        if (role === "client") {
            setTotal({
                ...total,
                client: {
                    monthlyAmount: totalMonthlyAmount,
                    yearlyAmount: totalYearlyAmount,
                },
            });
        } else if (role === "opposingParty") {
            setTotal({
                ...total,
                opposingParty: {
                    monthlyAmount: totalMonthlyAmount,
                    yearlyAmount: totalYearlyAmount,
                },
            });
        }
    };

    const handleMonthlyChange = (index, e, role) => {

        if (role === 'client') {
            const newFormData = { ...formData };
            const monthly = parseFloat(e.value) || '';
            newFormData.client.expenses[index][e.name] = monthly;
            const yearly = monthly * 12;
            newFormData.client.expenses[index]['yearlyAmount'] = yearly;
            setFormData(newFormData);
        }

        if (role === 'opposingParty') {
            const newFormData = { ...formData };
            const monthly = parseFloat(e.value) || '';
            newFormData.opposingParty.expenses[index][e.name] = monthly;
            const yearly = monthly * 12;
            newFormData.opposingParty.expenses[index]['yearlyAmount'] = yearly;
            setFormData(newFormData);
        }
    };

    const handleYearlyChange = (index, e, role) => {

        if (role === 'client') {
            const newFormData = { ...formData };

            const yearly = parseFloat(e.value) || '';

            newFormData.client.expenses[index][e.name] = yearly;
            const monthly = parseFloat(yearly / 12);

            newFormData.client.expenses[index]['monthlyAmount'] = monthly;

            setFormData(newFormData);
        }

        if (role === 'opposingParty') {
            const newFormData = { ...formData };

            const yearly = parseFloat(e.value) || '';

            newFormData.opposingParty.expenses[index][e.name] = yearly;
            const monthly = parseFloat(yearly / 12);

            newFormData.opposingParty.expenses[index]['monthlyAmount'] = monthly;

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
            totalMonthlyIncome = formData.client.expenses.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);

            totalYearlyIncome = formData.client.expenses.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
            clientData = {
                client: {
                    monthlyAmount: parseFloat(totalMonthlyIncome),
                    yearlyAmount: parseFloat(totalYearlyIncome),
                },
            }
        }

        if (formData.opposingParty) {
            totalMonthlyIncome = formData.opposingParty.expenses.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);
            totalYearlyIncome = formData.opposingParty.expenses.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
            opposingPartyData = {
                opposingParty: {
                    monthlyAmount: parseFloat(totalMonthlyIncome),
                    yearlyAmount: parseFloat(totalYearlyIncome),
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

        formData.client.expenses.forEach((item) => {
            clientFields += Object.keys(item).length;
            clientFieldsFilled += Object.values(item).filter((item) => item !== "").length;
        });

        formData.client.specialChildExpenses.forEach((item) => {
            clientFields += Object.keys(item).length;
            clientFieldsFilled += Object.values(item).filter((item) => item !== "").length;
        });

        clientProgress += (clientFieldsFilled / clientFields) * 50;

        // Opposing Party has 50% weight
        let opposingPartyFields = 0;
        let opposingPartyFieldsFilled = 0;

        formData.opposingParty.expenses.forEach((item) => {
            opposingPartyFields += Object.keys(item).length;
            opposingPartyFieldsFilled += Object.values(item).filter((item) => item !== "").length;
        });

        formData.opposingParty.specialChildExpenses.forEach((item) => {
            opposingPartyFields += Object.keys(item).length;
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
        // 
    };

    useEffect(() => {
        calculateProgress();
        ExpensesData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        });
    }, [formData, progress, isOpen]);

    const expensesList = [
        {
            name: "Household",
            value: "Household",
        },
        {
            name: "Transport",
            value: "Transport",
        },
        {
            name: "Food",
            value: "Food",
        },
        {
            name: "Clothing",
            value: "Clothing",
        },
        {
            name: "Medical",
            value: "Medical",
        },
        {
            name: "Education",
            value: "Education",
        },
        {
            name: "Entertainment",
            value: "Entertainment",
        },
        {
            name: "Other",
            value: "Other",
        },
    ];

    return (
        <Accordion.Item eventKey={6}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={expenses} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Expenses</div>
                        <div>{progress}%</div>
                    </div>
                    <div className={`progress-bar ${progress === 100 ? 'done' : ''}`} style={{ "--progress-width": `${progress}%` }}></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="tab-actions">
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
                <div className="pb-20px mt-5">
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
                            {/* <CustomDateInput 
                             type="month"
                             name="financialYear"
                             label="Financial Year"
                             value={`${selectedYear}-01` ? formData.financialYear : ''}
                             handleChange={handleYearChange}
                            /> */}
                            {/* <InputCustom
                                type="date"
                                name="financialYear"
                                label="Financial Year"
                                value={formData.financialYear}
                                handleChange={handleFormDataChange}
                            /> */}
                        </div>
                    </div>
                </div>

                {activeTab === "Client" ? (
                    <div className="tab-content">
                        <div className="pb-30px">
                            <div className="sub-heading">Expenses</div>

                            {formData.client.expenses.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Expense Type</label>
                                                <Dropdown
                                                    handleChange={handleClientExpenseTypeChange}
                                                    list={getExpenseList()}
                                                    curListItem={item.type}
                                                ></Dropdown>
                                            </div>
                                            <InputCustom
                                                type="text"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                // handleChange={handleClientExpenseFormDataChange}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'client')}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                // handleChange={handleClientExpenseFormDataChange}
                                                handleChange={(e) => handleYearlyChange(index, e.target, 'client')}
                                            />
                                        </div>

                                    </div>
                                )
                            })}

                            <div className="action">
                                <button
                                    className="btn btn-link"
                                    onClick={() => {
                                        const newFormData = { ...formData };
                                        newFormData.client.expenses.push({
                                            type: "",
                                            monthlyAmount: "",
                                            yearlyAmount: "",
                                            role: "client"
                                        });
                                        setFormData(newFormData);
                                    }}
                                >
                                    Add Expense
                                </button>
                            </div>

                            <div className="inputs-row">
                                <div className="inputs">
                                    <label className="form-label mb-0">
                                        Total Expenses
                                    </label>
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        value={`$${total.client.monthlyAmount}`}
                                        disabled={true}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        value={`$${total.client.yearlyAmount}`}
                                        disabled={true}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>

                        <div className="pb-30px">
                            <div className="sub-heading">Special child expenses</div>

                            {formData.client.specialChildExpenses.map((item, index) => {
                                return (
                                    <div className='pb-50px' data-key={index} key={index}>
                                        <div className="inputs-row pb-30px">
                                            <div className="inputs align-items-end">
                                                <InputCustom
                                                    type="text"
                                                    name="childName"
                                                    label="Expense Child Name"
                                                    value={item.childName}
                                                    handleChange={handleClientSpecialChildExpenseFormDataChange}
                                                />
                                                <InputCustom
                                                    type="text"
                                                    name="amount"
                                                    label="Amount"
                                                    value={item.amount}
                                                    handleChange={handleClientSpecialChildExpenseFormDataChange}
                                                />

                                            </div>
                                        </div>

                                        <div className="inputs-row">
                                            <div className="inputs align-items-end">
                                                <div className="form-group">
                                                    <label className="form-label">Expense Type</label>
                                                    <Dropdown
                                                        handleChange={handleClientSpecialChildExpenseTypeChange}
                                                        list={specialExpenses}
                                                        curListItem={item.type}
                                                    ></Dropdown>
                                                </div>
                                                <InputCustom
                                                    type="text"
                                                    name="taxCredits"
                                                    placeholder="Enter Amount"
                                                    label="Available tax credits/deductions"
                                                    value={item.taxCredits}
                                                    handleChange={handleClientSpecialChildExpenseFormDataChange}
                                                />

                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="action" style={{ marginTop: "-30px" }}>
                                <button
                                    className="btn btn-link"
                                    onClick={() => {
                                        const newFormData = { ...formData };
                                        newFormData.client.specialChildExpenses.push({
                                            childName: "",
                                            amount: "",
                                            type: "",
                                            taxCredits: "",
                                            role: "client"
                                        });
                                        setFormData(newFormData);
                                    }}
                                >
                                    Add Special Child Expense
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="tab-content">
                        <div className="pb-30px">
                            <div className="sub-heading">Expenses</div>

                            {formData.opposingParty.expenses.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Expense Type</label>
                                                <Dropdown
                                                    handleChange={handleOpposingPartyExpenseTypeChange}
                                                    list={getExpenseList()}
                                                    curListItem={item.type}
                                                ></Dropdown>
                                            </div>
                                            <InputCustom
                                                type="text"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                // handleChange={handleOpposingPartyExpenseFormDataChange}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'opposingParty')}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                // handleChange={handleOpposingPartyExpenseFormDataChange}
                                                handleChange={(e) => handleYearlyChange(index, e.target, 'opposingParty')}
                                            />
                                        </div>

                                    </div>
                                )
                            })}

                            <div className="action">
                                <button
                                    className="btn btn-link"
                                    onClick={() => {
                                        const newFormData = { ...formData };
                                        newFormData.opposingParty.expenses.push({
                                            type: "",
                                            monthlyAmount: "",
                                            yearlyAmount: "",
                                            role: "opposingParty"

                                        });
                                        setFormData(newFormData);
                                    }}
                                >
                                    Add Expense
                                </button>
                            </div>

                            <div className="inputs-row">
                                <div className="inputs">
                                    <label className="form-label mb-0">
                                        Total Expenses
                                    </label>
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        value={`$${total.opposingParty.monthlyAmount}`}
                                        disabled={true}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        value={`$${total.opposingParty.yearlyAmount}`}
                                        disabled={true}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>

                        <div className="pb-30px">
                            <div className="sub-heading">Special child expenses</div>

                            {formData.opposingParty.specialChildExpenses.map((item, index) => {
                                return (
                                    <div className='pb-50px' data-key={index} key={index}>
                                        <div className="inputs-row pb-30px">
                                            <div className="inputs align-items-end">
                                                <InputCustom
                                                    type="text"
                                                    name="childName"
                                                    label="Expense Child Name"
                                                    value={item.childName}
                                                    handleChange={handleOpposingPartySpecialChildExpenseFormDataChange}
                                                />
                                                <InputCustom
                                                    type="text"
                                                    name="amount"
                                                    label="Amount"
                                                    value={item.amount}
                                                    handleChange={handleOpposingPartySpecialChildExpenseFormDataChange}
                                                />

                                            </div>
                                        </div>

                                        <div className="inputs-row">
                                            <div className="inputs align-items-end">
                                                <div className="form-group">
                                                    <label className="form-label">Expense Type</label>
                                                    <Dropdown
                                                        handleChange={handleOpposingPartySpecialChildExpenseTypeChange}
                                                        list={specialExpenses}
                                                        curListItem={item.type}
                                                    ></Dropdown>
                                                </div>
                                                <InputCustom
                                                    type="text"
                                                    name="taxCredits"
                                                    placeholder="Enter Amount"
                                                    label="Available tax credits/deductions"
                                                    value={item.taxCredits}
                                                    handleChange={handleOpposingPartySpecialChildExpenseFormDataChange}
                                                />

                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="action" style={{ marginTop: "-30px" }}>
                                <button
                                    className="btn btn-link"
                                    onClick={() => {
                                        const newFormData = { ...formData };
                                        newFormData.opposingParty.specialChildExpenses.push({
                                            childName: "",
                                            amount: "",
                                            type: "",
                                            taxCredits: "",
                                            role: "opposingParty"
                                        });
                                        setFormData(newFormData);
                                    }}
                                >
                                    Add Special Child Expense
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }

            </Accordion.Body>
        </Accordion.Item>
    )
}

export default Expenses
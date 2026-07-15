import { useEffect, useState } from 'react'

import Dropdown from "../../components/Matters/Form/Dropdown";
import InputCustom from "../../components/InputCustom";
import Loader from '../../components/Loader'
import { IncomeBenefits } from '../../utils/Apis/matters/CustomHook/DocumentViewDataUpdate';
import { financialYear, incomeDetails, incomeDetailsON, incomeDetailsBC } from '../../utils/matterData/categoryData';
import { getCurrentUserFromCookies } from '../../utils/helpers';

const IncomeAndBenefitsSimple = ({ matterId, onUpdateFormData, matterData, activeTab, setActiveTab }) => {
    // const [loading, setLoading] = useState(true)
    const { selectIncomeData, selectIncomeDataLoading, selectIncomeDataError } = IncomeBenefits(matterId)
     const getIncomeDetails = () => {
        return getCurrentUserFromCookies().province === 'ON' ? incomeDetailsON : getCurrentUserFromCookies().province === 'BC' ? incomeDetailsBC : incomeDetails;
    }
    useEffect(() => {
        if (selectIncomeData && !selectIncomeDataLoading) {

            const savedRows = selectIncomeData?.body || [];
            const savedFinancialYear = savedRows.find(item => item.financialYear)?.financialYear;

            const incomeData = {
                // Each saved row also carries the year. That fallback makes the
                // form resilient while the separately stored matter header is
                // being refreshed after an AI intake.
                financialYear: matterData?.financial_year_income_benefits || savedFinancialYear || "",
                client: {
                    income: [],
                    benefit: []
                },
                opposingParty: {
                    income: [],
                    benefit: []
                }
            };

            const incomeBenefitTotal = {
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
            };

            savedRows.forEach(item => {
                const { type, monthlyAmount, yearlyAmount, role, incomeBenefit, id } = item;
                const newItem = { id, type, monthlyAmount, yearlyAmount, role };

                if (role === "Client") {
                    if (incomeBenefit === "income") {
                        incomeBenefitTotal.client.income.monthlyAmount = (parseFloat(newItem.monthlyAmount) + parseFloat(monthlyAmount)).toString();
                        incomeBenefitTotal.client.income.yearlyAmount = (parseFloat(newItem.yearlyAmount) + parseFloat(yearlyAmount)).toString();
                        incomeData.client.income.push(newItem);

                    } else if (incomeBenefit === "benefit") {
                        incomeBenefitTotal.client.benefit.monthlyAmount = (parseFloat(newItem.monthlyAmount) + parseFloat(monthlyAmount)).toString();
                        incomeBenefitTotal.client.benefit.yearlyAmount = (parseFloat(newItem.yearlyAmount) + parseFloat(yearlyAmount)).toString();
                        incomeData.client.benefit.push(newItem);
                    }
                } else if (role === "Opposing Party" || role === "opposingParty") {
                    if (incomeBenefit === "income") {
                        incomeBenefitTotal.opposingParty.income.monthlyAmount = (parseFloat(newItem.monthlyAmount) + parseFloat(monthlyAmount)).toString();
                        incomeBenefitTotal.opposingParty.income.yearlyAmount = (parseFloat(newItem.yearlyAmount) + parseFloat(yearlyAmount)).toString();
                        incomeData.opposingParty.income.push(newItem);
                    } else if (incomeBenefit === "benefit") {
                        incomeBenefitTotal.opposingParty.benefit.monthlyAmount = (parseFloat(newItem.monthlyAmount) + parseFloat(monthlyAmount)).toString();
                        incomeBenefitTotal.opposingParty.benefit.yearlyAmount = (parseFloat(newItem.yearlyAmount) + parseFloat(yearlyAmount)).toString();
                        incomeData.opposingParty.benefit.push(newItem);
                    }
                }
            });

            setFormData(incomeData)
            // setTotal(incomeBenefitTotal)
            updateTotals()

        }

    }, [selectIncomeData, selectIncomeDataLoading, matterData?.financial_year_income_benefits])


    const [formData, setFormData] = useState({
        financialYear: "",
        client: {
            income: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "Client"
                }
            ],
            benefit: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "Client"
                }
            ],
        },
        opposingParty: {
            income: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "opposingParty"
                }
            ],
            benefit: [
                {
                    type: "",
                    monthlyAmount: "",
                    yearlyAmount: "",
                    role: "opposingParty"
                }
            ],
        },
    });

    useEffect(() => {
        updateTotals()
    }, [formData])
    


    useEffect(() => {
        onUpdateFormData({
            type: 'incomeBenefits',
            incomeBenefits:
                formData,
        })
    }, [formData])

    const [totals, setTotal] = useState({
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

    const handleFormDataChange = (e) => {
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
    }

    const handleClientIncomeTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.client.income[index].type = li.name;
        setFormData(newFormData);

    };

    const handleClientBenefitTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.client.benefit[index].type = li.name;
        setFormData(newFormData);


    };

    const handleOpposingPartyIncomeTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.opposingParty.income[index].type = li.name;
        setFormData(newFormData);



    };

    const handleOpposingPartyBenefitTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;

        const newFormData = { ...formData };
        newFormData.opposingParty.benefit[index].type = li.name;
        setFormData(newFormData);


    };
    
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
            newFormData.client.income[index]['monthlyAmount'] =  monthly;
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



return (
    <>
        {selectIncomeDataLoading && (
            <Loader isLoading={selectIncomeDataLoading} />
        )}
        {selectIncomeData && !selectIncomeDataLoading && (
            <div className="accordion-body matterType">
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
                    <div className="tab-content matterType">
                        <div className="pb-30px  simple_background">
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
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                disabled={false}
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
                                        monthlyAmount: 0,
                                        yearlyAmount: 0,
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
                                        value={`$${totals.client.income.monthlyAmount}`}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${totals.client.income.yearlyAmount}`}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>

                        <div className="pb-30px mt-30px simple_background">
                            <div className="sub-heading">Benefits</div>
                            {formData.client.benefit.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Benefit Type</label>
                                                <Dropdown
                                                    handleChange={handleClientBenefitTypeChange}
                                                    list={getIncomeDetails()}
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
                                                disabled={false}
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
                                        value={`$${totals.client.benefit.monthlyAmount}` || 0}
                                    />

                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${totals.client.benefit.yearlyAmount}` || 0}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="tab-content matterType">
                        <div className="pb-30px simple_background">
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
                                                type="currency"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'opposingParty', 'income')}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                disabled={false}
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
                                        role: "opposingParty"
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
                                        value={`$${totals.opposingParty.income.monthlyAmount}`}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${totals.opposingParty.income.yearlyAmount}`}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>

                        <div className="pb-30px mt-30px simple_background">
                            <div className="sub-heading">Benefits</div>
                            {formData.opposingParty.benefit.map((item, index) => {
                                return (
                                    <div className="inputs-row repeater-row" data-key={index} key={index}>
                                        <div className="inputs">
                                            <div className="form-group">
                                                <label className="form-label">Benefit Type</label>
                                                <Dropdown
                                                    handleChange={handleOpposingPartyBenefitTypeChange}
                                                    list={getIncomeDetails()}
                                                    curListItem={item.type}
                                                ></Dropdown>
                                            </div>
                                            <InputCustom
                                                type="text"
                                                name="monthlyAmount"
                                                label="Monthly Amount"
                                                value={item.monthlyAmount}
                                                handleChange={(e) => handleMonthlyChange(index, e.target, 'opposingParty', 'benefit')}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="yearlyAmount"
                                                label="Yearly Amount"
                                                value={item.yearlyAmount}
                                                disabled={false}
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
                                        role: "opposingParty"
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
                                        value={`$${totals.opposingParty.benefit.monthlyAmount}`}
                                    />
                                    <InputCustom
                                        type="text"
                                        placeholder="$0"
                                        disabled={true}
                                        value={`$${totals.opposingParty.benefit.yearlyAmount}`}
                                    />
                                </div>
                                <div className="action"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
    </>
)
}

export default IncomeAndBenefitsSimple

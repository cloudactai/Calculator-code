import { useEffect, useState } from 'react'

import Dropdown from '../../components/Matters/Form/Dropdown'
import InputCustom from '../../components/InputCustom'
import { ChildrenData } from '../../utils/Apis/matters/CustomHook/DocumentViewDataUpdate'
import CustomDropDown from '../../components/Matters/Form/CustomDropdown'
import Loader from '../../components/Loader'
import { ExpenseData } from '../../utils/Apis/matters/CustomHook/ExpenseData'
import { expenseDetails, expenseDetailsBC, financialYear, specialExpenses } from '../../utils/matterData/categoryData'
import NumberFormat from 'react-number-format'
import { getCurrentUserFromCookies } from '../../utils/helpers'
import { matterProvinceCode } from '../../utils/matterProvince'
import { formatDollars } from '../../utils/helpers/Formatting'

const ExpensesSimple = ({ matterId, onUpdateFormData, matterData, activeTab, setActiveTab }) => {
  // The matter's province, not the signed-in user's: a BC matter shows the BC
  // expense types whoever opens it.
  const getExpenseList = () => {
        return matterProvinceCode(matterData, getCurrentUserFromCookies()?.province) === 'BC' ? expenseDetailsBC : expenseDetails;
  }

  const [loading, setLoading] = useState(true)

  const { selectChildrenData, selectChildrenDataLoading, selectChildrenDataError } = ChildrenData(matterId)
  const { selectExpenseData, selectExpenseDataLoading, selectExpenseDataError } = ExpenseData(matterId)

  useEffect(() => {
    if (selectChildrenData && selectExpenseData && !selectChildrenDataLoading && !selectExpenseDataLoading) {
      const receivedData = selectExpenseData.body
      
      if (!receivedData) {
        setLoading(false)
        // updateTotals()
      } else {
        const savedFinancialYear = [
          ...(receivedData?.client?.expenses || []),
          ...(receivedData?.client?.specialChildExpenses || []),
          ...(receivedData?.opposingParty?.expenses || []),
          ...(receivedData?.opposingParty?.specialChildExpenses || []),
        ].find(item => item.financialYear)?.financialYear
        const newFormData = {
          financialYear: matterData?.financial_year_expenses || savedFinancialYear || '',
          client: {
            expenses: receivedData.client && receivedData.client.expenses ? receivedData.client.expenses.map(expense => ({
              id: expense.id,
              type: expense.type,
              monthlyAmount: expense.monthlyAmount,
              yearlyAmount: expense.yearlyAmount,
              role: 'client'
            })) : {
              type: '',
              monthlyAmount: '',
              yearlyAmount: '',
              role: 'client'
            },
            specialChildExpenses: receivedData.client && receivedData.client.specialChildExpenses ? receivedData?.client?.specialChildExpenses.map(expense => ({
              id: expense.id,
              childName: expense.childName,
              amount: expense.amount,
              type: expense.type,
              taxCredits: expense.taxCredits,
              role: 'client'
            })) : {
              childName: '',
              amount: '',
              type: '',
              taxCredits: '',
              role: 'client'
            }
          },
          opposingParty: {
            expenses: receivedData?.opposingParty?.expenses.map(expense => ({
              id: expense.id,
              type: expense.type,
              monthlyAmount: expense.monthlyAmount,
              yearlyAmount: expense.yearlyAmount,
              role: 'opposingParty'
            })),
            specialChildExpenses: receivedData?.opposingParty?.specialChildExpenses.map(expense => ({
              id: expense.id,
              childName: expense.childName,
              amount: expense.amount,
              type: expense.type,
              taxCredits: expense.taxCredits,
              role: 'opposingParty'
            }))
          }
        };

        const childrenData = selectChildrenData?.body.map(item => ({
          name: item.childName,
          value: item.childName
        }))

        setChildren(childrenData)
        setFormData(newFormData);
        setLoading(false)
        updateTotals()
      }

    } else {
      setLoading(true)
    }
  }, [selectChildrenData, selectExpenseData, selectExpenseDataLoading, matterData?.financial_year_expenses])





  const [children, setChildren] = useState()

  const [formData, setFormData] = useState({
    financialYear: '',
    client: {
      expenses: [
        {
          type: '',
          monthlyAmount: '',
          yearlyAmount: '',
          role: 'client',
        }
      ],
      specialChildExpenses: [
        {
          childName: '',
          amount: '',
          type: '',
          taxCredits: '',
          role: 'client',
        }
      ]
    },
    opposingParty: {
      expenses: [
        {
          type: "",
          monthlyAmount: "",
          yearlyAmount: "",
          role: 'opposingParty'
        },
      ],
      specialChildExpenses: [
        {
          childName: "",
          amount: "",
          type: "",
          taxCredits: "",
          role: 'opposingParty'
        },
      ],
    },
  })

  useEffect(() => {


    updateTotals()
  }, [formData])

  const [total, setTotal] = useState({
    client: {
      monthlyAmount: '',
      yearlyAmount: ''
    },
    opposingParty: {
      monthlyAmount: '',
      yearlyAmount: ''
    }
  })

  useEffect(() => {

    onUpdateFormData({
      type: 'expenses',
      expenses: {
        data: formData
      },
    })
  }, [formData])

  const handleFormDataChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleClientChildNameChange = (e, li) => {

    let index = e.target.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement.dataset.key

    const newFormData = { ...formData }
    newFormData.client.specialChildExpenses[index].childName = li.value
    setFormData(newFormData)

  }

  const handleOpposingPartyChildNameChange = (e, li) => {
    let index = e.target.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement.dataset.key
    const newFormData = { ...formData }
    newFormData.opposingParty.specialChildExpenses[index].childName = li.value
    setFormData(newFormData)


  }

  const handleClientExpenseTypeChange = (e, li) => {
    const index =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.dataset.key
    const newFormData = { ...formData }
    newFormData.client.expenses[index].type = li.value
    setFormData(newFormData)
  }

  const handleClientSpecialChildExpenseTypeChange = (e, li) => {
    let index = e.target.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement.dataset.key
    const newFormData = { ...formData }
    newFormData.client.specialChildExpenses[index].type = li.value
    setFormData(newFormData)

  }

  const handleClientSpecialChildExpenseFormDataChange = e => {

    let index =

      e.target.parentElement.parentElement.parentElement.parentElement.dataset
        .key

    const newFormData = { ...formData }
    newFormData.client.specialChildExpenses[index][e.target.name] =
      e.target.value
    setFormData(newFormData)


  }

  // Oppoisng Party
  const handleOpposingPartyExpenseTypeChange = (e, li) => {
    const index =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.dataset.key
    const newFormData = { ...formData }
    newFormData.opposingParty.expenses[index].type = li.value
    setFormData(newFormData)


  }

  const handleOpposingPartySpecialChildExpenseTypeChange = (e, li) => {
    let index =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.dataset.key
    const newFormData = { ...formData }
    newFormData.opposingParty.specialChildExpenses[index].type = li.value
    setFormData(newFormData)


  }



  const handleOpposingPartySpecialChildExpenseFormDataChange = e => {
    let index =
      e.target.parentElement.parentElement.parentElement.parentElement.dataset
        .key

    const newFormData = { ...formData }
    newFormData.opposingParty.specialChildExpenses[index][e.target.name] =
      e.target.value
    setFormData(newFormData)


  }


 

  const handleMonthlyChange = (index, e, role) => {

    if (role === 'client') {
      const newFormData = { ...formData };
      const monthly = Math.round(parseFloat(e.value)) || '';
      newFormData.client.expenses[index][e.name] = monthly;
      const yearly = Math.round(parseFloat(monthly) * 12);
      newFormData.client.expenses[index]['yearlyAmount'] = yearly;
      setFormData(newFormData);
    }

    if (role === 'opposingParty') {
      const newFormData = { ...formData };
      const monthly = Math.round(parseFloat(e.value)) || '';
      newFormData.opposingParty.expenses[index][e.name] = monthly;
      const yearly = Math.round(parseFloat(monthly) * 12);
      newFormData.opposingParty.expenses[index]['yearlyAmount'] = yearly;
      setFormData(newFormData);
  }

  };


  const handleYearlyChange = (index, e, role) => {

    if (role === 'client') {
      const newFormData = { ...formData };

      const yearly = Math.round(parseFloat(e.value)) || 0;

      newFormData.client.expenses[index][e.name] = yearly;
      const monthly = Math.round(parseFloat(yearly) / 12);

      newFormData.client.expenses[index]['monthlyAmount'] = monthly;

      setFormData(newFormData);
    }

    if (role === 'opposingParty') {
      const newFormData = { ...formData };

      const yearly = Math.round(parseFloat(e.value)) || '';

      newFormData.opposingParty.expenses[index][e.name] = yearly;
      const monthly = Math.round(parseFloat(yearly) / 12);

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

    if (formData.client && Array.isArray(formData.client.expenses)) {
      totalMonthlyIncome = formData.client.expenses.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);
      totalYearlyIncome = formData.client.expenses.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
      clientData = {
        client: {
          monthlyAmount: parseFloat(totalMonthlyIncome) || 0,
          yearlyAmount: parseFloat(totalYearlyIncome) || 0,
        },
      }
    } else {
      clientData = {
        client: {
          monthlyAmount: 0,
          yearlyAmount: 0,
        },
      }
    }

    if (formData.opposingParty && Array.isArray(formData.opposingParty.expenses)) {
      totalMonthlyIncome = formData.opposingParty.expenses.reduce((acc, field) => acc + parseFloat(field.monthlyAmount), 0);
      totalYearlyIncome = formData.opposingParty.expenses.reduce((acc, field) => acc + parseFloat(field.yearlyAmount), 0);
      opposingPartyData = {
        opposingParty: {
          monthlyAmount: parseFloat(totalMonthlyIncome) || 0,
          yearlyAmount: parseFloat(totalYearlyIncome) || 0,
        },
      }
    } else {
      opposingPartyData = {
        opposingParty: {
          monthlyAmount: 0,
          yearlyAmount: 0,
        },
      }
    }

    setTotal({
      client: clientData.client,
      opposingParty: opposingPartyData.opposingParty
    })
  };

  const handleFinancialYear = (e, li) => {
    setFormData({
      ...formData,
      financialYear: li.value,
    });
  }

  return (

    <>
      {loading ? (
        <Loader isLoading={loading} />
      ) : (
        <div className='accordion-body matterType'>
          <div className='tab-actions'>
            <div
              className={`tab-action ${activeTab === 'Client' ? 'active' : ''}`}
              onClick={() => setActiveTab('Client')}
            >
              Client
            </div>
            <div
              className={`tab-action ${activeTab === 'Opposing Party' ? 'active' : ''
                }`}
              onClick={() => setActiveTab('Opposing Party')}
            >
              Opposing Party
            </div>
          </div>
          <div className='pb-30px mt-30px'>
            <div className='inputs-row'>
              <div className='inputs'>
                <Dropdown
                  handleChange={handleFinancialYear}
                  list={financialYear}
                  curListItem={formData.financialYear}
                ></Dropdown>
              </div>
            </div>
          </div>

          {activeTab === 'Client' ? (
            <div className='tab-content matterType'>
              <div className='pb-30px '>
                <div className='sub-heading'>Expenses</div>

                {formData && Array.isArray(formData.client.expenses) && formData?.client?.expenses?.map((item, index) => {
                  return (
                    <div
                      className='inputs-row repeater-row'
                      data-key={index}
                      key={index}
                    >
                      <div className='inputs'>
                        <div className='form-group'>
                          <label className='form-label'>Expense Type</label>
                          <CustomDropDown
                            handleChange={handleClientExpenseTypeChange}
                            list={getExpenseList()}
                            curListItem={item.type}
                          ></CustomDropDown>
                        </div>
                      
                        <InputCustom
                          type='amount'
                          name='monthlyAmount'
                          label='Monthly Amount'
                          value={item.monthlyAmount}
                          // handleChange={handleClientExpenseFormDataChange}
                          handleChange={(e) => handleMonthlyChange(index, e.target, 'client')}
                        />
                        <InputCustom
                          type='amount'
                          name='yearlyAmount'
                          label='Yearly Amount'
                          value={item.yearlyAmount}
                          // handleChange={handleClientExpenseFormDataChange}
                          handleChange={(e) => handleYearlyChange(index, e.target, 'client')}
                        />
                      </div>

                    </div>
                  )
                })}

                <div className='action'>
                  <button
                    className='btn btn-link'
                    onClick={() => {
                      const newFormData = { ...formData };

                      newFormData.client.expenses = Array.isArray(newFormData.client.expenses) ? newFormData.client.expenses : [];
                      newFormData.client.expenses.push({
                        type: '',
                        monthlyAmount: '',
                        yearlyAmount: '',
                        role: 'client'
                      });
                      setFormData(newFormData);
                    }}
                  >
                    Add Expense
                  </button>
                </div>

                <div className='inputs-row'>
                  <div className='inputs form-group'>
                    <label className='form-label mb-0'>Total Expenses</label>
                    <NumberFormat
                      value={total.client.monthlyAmount}
                      className='form-control'
                      inputMode='numeric'
                      thousandSeparator={true}
                      decimalScale={0}
                      defaultValue={0}
                      prefix={'$'}
                      disabled={true}
                    />
                    {/* <InputCustom
                          type="text"
                          placeholder="$0"
                          value={`$${total.client.monthlyAmount}`}
                          disabled={true}
                      /> */}
                    <NumberFormat
                      value={total.client.yearlyAmount}
                      className='form-control'
                      inputMode='numeric'
                      thousandSeparator={true}
                      decimalScale={0}
                      defaultValue={0}
                      prefix={'$'}
                      disabled={true}
                    />
                  </div>
                  <div className='action'></div>
                </div>
              </div>

              <div className='pb-30px'>
                <div className='sub-heading'>Special child expenses</div>

                {formData && Array.isArray(formData.client.specialChildExpenses) && formData.client.specialChildExpenses.map((item, index) => {
                  return (
                    <div className='pb-50px' data-key={index} key={index}>
                      <div className='inputs-row pb-30px'>
                        <div className='inputs align-items-end inputs-col-2'>
                          <div className='form-group'>
                            <label className='form-label'>Child Name</label>
                            <Dropdown
                              handleChange={
                                handleClientChildNameChange
                              }
                              list={children}
                              curListItem={item.childName}
                            ></Dropdown>
                          </div>

                          <InputCustom
                            type='amount'
                            name='amount'
                            label='Amount'
                            value={item.amount}
                            handleChange={
                              handleClientSpecialChildExpenseFormDataChange
                            }
                          />
                        </div>
                      </div>

                      <div className='inputs-row'>
                        <div className='inputs align-items-end inputs-col-2'>
                          <div className='form-group'>
                            <label className='form-label'>Expense Type</label>
                            <Dropdown
                              handleChange={
                                handleClientSpecialChildExpenseTypeChange
                              }
                              list={specialExpenses}
                              curListItem={item.type}
                            ></Dropdown>
                          </div>
                          <InputCustom
                            type='text'
                            name='taxCredits'
                            placeholder='Enter Amount'
                            label='Available tax credits/deductions'
                            value={item.taxCredits}
                            handleChange={
                              handleClientSpecialChildExpenseFormDataChange
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className='action' style={{ marginTop: '-30px' }}>
                  <button
                    className='btn btn-link'
                    onClick={() => {
                      const newFormData = { ...formData }
                      newFormData.client.specialChildExpenses = Array.isArray(newFormData.client.specialChildExpenses) ? newFormData.client.specialChildExpenses : [];
                      newFormData.client.specialChildExpenses.push({
                        childName: '',
                        amount: '',
                        type: '',
                        taxCredits: '',
                        role: 'client'
                      })
                      setFormData(newFormData)
                    }}
                  >
                    Add Special Child Expense
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='tab-content matterType'>
              <div className='pb-30px'>
                <div className='sub-heading'>Expenses</div>

                {formData && Array.isArray(formData.opposingParty.expenses) && formData.opposingParty.expenses.map((item, index) => {
                  return (
                    <div
                      className='inputs-row repeater-row'
                      data-key={index}
                      key={index}
                    >
                      <div className='inputs'>
                        <div className='form-group'>
                          <label className='form-label'>Expense Type</label>
                          {/* handleOpposingPartyExpenseTypeChange */}
                          <Dropdown
                            handleChange={
                              handleOpposingPartyExpenseTypeChange
                            }
                            list={getExpenseList()}
                            curListItem={item.type}
                          ></Dropdown>
                        </div>
                        <InputCustom
                          type='amount'
                          name='monthlyAmount'
                          label='Monthly Amount'
                          value={item.monthlyAmount}
                          // handleChange={handleOpposingPartyExpenseFormDataChange}
                          handleChange={(e) => handleMonthlyChange(index, e.target, 'opposingParty')}
                        />
                        <InputCustom
                          type='amount'
                          name='yearlyAmount'
                          label='Yearly Amount'
                          value={item.yearlyAmount}
                          // handleChange={handleOpposingPartyExpenseFormDataChange}
                          handleChange={(e) => handleYearlyChange(index, e.target, 'opposingParty')}
                        />
                      </div>

                    </div>
                  )
                })}

                <div className='action'>
                  <button
                    className='btn btn-link'
                    onClick={() => {
                      const newFormData = { ...formData }
                      newFormData.opposingParty.expenses = Array.isArray(newFormData.opposingParty.expenses) ? newFormData.opposingParty.expenses : [];
                      newFormData.opposingParty.expenses.push({
                        type: '',
                        monthlyAmount: '',
                        yearlyAmount: '',
                        role: 'opposingParty'
                      })
                      setFormData(newFormData)
                    }}
                  >
                    Add Expense
                  </button>
                </div>

                <div className='inputs-row'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>Total Expenses</label>
                    <InputCustom
                      type='text'
                      placeholder='$0'
                      value={`$${formatDollars(total.opposingParty.monthlyAmount)}`}
                      disabled={true}
                    />
                    <InputCustom
                      type='text'
                      placeholder='$0'
                      value={`$${formatDollars(total.opposingParty.yearlyAmount)}`}
                      disabled={true}
                    />
                  </div>
                  <div className='action'></div>
                </div>
              </div>

              <div className='pb-30px'>
                <div className='sub-heading'>Special child expenses</div>

                {formData && Array.isArray(formData.opposingParty.specialChildExpenses) && formData.opposingParty.specialChildExpenses.map((item, index) => {
                  return (
                    <div className='pb-50px' data-key={index} key={index}>
                      <div className='inputs-row pb-30px'>
                        <div className='inputs align-items-end inputs-col-2'>
                          <div className='form-group'>
                            <label className='form-label'>Child Name</label>
                            <Dropdown
                              handleChange={
                                handleOpposingPartyChildNameChange
                              }
                              list={children}
                              curListItem={item.childName}
                            ></Dropdown>
                          </div>

                          {/* <InputCustom
                        type='text'
                        name='childName'
                        label='Expense Child Name'
                        value={item.childName}
                        handleChange={
                          handleOpposingPartySpecialChildExpenseFormDataChange
                        }
                      /> */}
                          <InputCustom
                            type='amount'
                            name='amount'
                            label='Amount'
                            value={item.amount}
                            handleChange={
                              handleOpposingPartySpecialChildExpenseFormDataChange
                            }
                          />
                        </div>
                      </div>

                      <div className='inputs-row'>
                        <div className='inputs align-items-end inputs-col-2'>
                          <div className='form-group'>
                            <label className='form-label'>Expense Type</label>
                            <Dropdown
                              handleChange={
                                handleOpposingPartySpecialChildExpenseTypeChange
                              }
                              list={specialExpenses}
                              curListItem={item.type}
                            ></Dropdown>
                          </div>
                          <InputCustom
                            type='text'
                            name='taxCredits'
                            placeholder='Enter Amount'
                            label='Available tax credits/deductions'
                            value={item.taxCredits}
                            handleChange={
                              handleOpposingPartySpecialChildExpenseFormDataChange
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className='action' style={{ marginTop: '-30px' }}>
                  <button
                    className='btn btn-link'
                    onClick={() => {
                      const newFormData = { ...formData }
                      newFormData.opposingParty.specialChildExpenses = Array.isArray(newFormData.opposingParty.specialChildExpenses) ? newFormData.opposingParty.specialChildExpenses : [];
                      newFormData.opposingParty.specialChildExpenses.push({
                        childName: '',
                        amount: '',
                        type: '',
                        taxCredits: '',
                        role: 'opposingParty'
                      })
                      setFormData(newFormData)
                    }}
                  >
                    Add Special Child Expense
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default ExpensesSimple

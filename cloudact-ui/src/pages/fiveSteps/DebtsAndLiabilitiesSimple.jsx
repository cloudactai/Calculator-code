import { useEffect, useState } from 'react'

import InputCustom from '../../components/InputCustom'
import CustomDropDown from '../../components/Matters/Form/CustomDropdown'
import { debtsDetails } from '../../utils/matterData/categoryData'
import { DebtData } from '../../utils/Apis/matters/CustomHook/DebtData'
import Loader from '../../components/Loader'

const DebtsAndLiabilitiesSimple = ({ matterId, onUpdateFormData }) => {
  const [loading, setLoading] = useState(true)
  const { selectDebt, selectDebtLoading } = DebtData(matterId)


  useEffect(() => {
    if (selectDebt && !selectDebtLoading) {
      setFormData(selectDebt.body)
      setLoading(false)
      updateTotals()
    } else {
      setLoading(true)
    }
  }, [selectDebt, selectDebtLoading, loading])

  const [formData, setFormData] = useState([
    {
      category: '',
      details: '',
      on_date_of_marriage: '',
      on_valuation_date: '',
      today: ''
    }
  ])

  const [totals, setTotal] = useState({

    totalOnDateOfMarriage: '0',
    totalOnValuationDate: '0',
    totaltoday: '0',

  });


  useEffect(() => {
    onUpdateFormData({
      type: 'debtsLiabilities',
      debtsLiabilities: formData
    })
  }, [formData])

  const handleChange = (e) => {
    let key =
      e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset
        .key
    

    const newFormData = [...formData]
    newFormData[key][e.target.name] = e.target.value

    setFormData(newFormData)
  }

  const handleClientExpenseTypeChange = (e, li) => {
    let index =
      e.target.parentElement.parentElement.parentElement.parentElement.parentElement
        .parentElement.dataset.key
    
    const newFormData = [...formData]
    newFormData[index]['category'] = li.value
    setFormData(newFormData)


  }

  useEffect(() => {
    updateTotals()
  }, [formData])

  

  const updateTotals = () => {

    // let onDateofMarriage;
    // let onValuationDate;
    // let today;

    let onDateofMarriage = formData.reduce((acc, field) => {
      const value = field.on_date_of_marriage === '' ? 0 : parseFloat(field.on_date_of_marriage) || 0;
      return acc + value;
    }, 0);

    let onValuationDate = formData.reduce((acc, field) => {
      const value = field.on_valuation_date === '' ? 0 : parseFloat(field.on_valuation_date) || 0;
      return acc + value;
    }, 0);

    let today = formData.reduce((acc, field) => {
      const value = field.today === '' ? 0 : parseFloat(field.today) || 0;
      return acc + value;
    }, 0);


    setTotal({
      totalOnDateOfMarriage: parseFloat(onDateofMarriage) || 0 ,
      totalOnValuationDate: parseFloat(onValuationDate) || 0,
      totaltoday: parseFloat(today) || 0,
    })

  }

  return (
    <>
      {loading ? (
        <Loader isLoading={loading} />
      ) : (
        <div className='accordion-body'>
          <div className='pb-20px matterType'>
            <div className='tab-content matterType'>
              {formData.map((item, index) => {
                return (
                  <div
                    className='inputs-row repeater-row'
                    data-key={index}
                    key={index}
                  >
                    <div className='pb-30px mb-20px simple_background'>
                      <div className='inputs-row no-action pb-10px'>
                        <div className='inputs inputs-4'>
                          <label className='form-label mb-0'>Category</label>
                          <CustomDropDown
                            handleChange={handleClientExpenseTypeChange}
                            list={debtsDetails}
                            curListItem={item.category}
                          />
                        </div>
                      </div>
                      <div className='inputs-row no-action pb-50px'>
                        <div className='inputs inputs-4'>
                          <label className='form-label mb-0'>Details</label>
                          <InputCustom
                            type='text'
                            placeholder='Details'
                            name='details'
                            value={item.details}
                            handleChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className='inputs-row no-action'>
                        <div className='inputs inputs-4'>
                          <label className='form-label mb-0'>
                            Amount/Value
                          </label>
                          <InputCustom
                            type='text'
                            name='on_date_of_marriage'
                            label='on Date of marriage'
                            placeholder='N/A'
                            value={item.on_date_of_marriage || 0}
                            handleChange={handleChange}
                          />
                          <InputCustom
                            type='text'
                            name='on_valuation_date'
                            label='on Valuation date'
                            placeholder='N/A'
                            value={item.on_valuation_date || 0}
                            handleChange={handleChange}
                          />
                          <InputCustom
                            type='text'
                            name='today'
                            label='Today'
                            placeholder='N/A'
                            value={item.today || 0}
                            handleChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className='action'>
              <button
                className='btn btn-link'
                onClick={() => {
                  setFormData([
                    ...formData,
                    {
                      category: '',
                      details: '',
                      on_date_of_marriage: '',
                      on_valuation_date: '',
                      today: ''
                    }
                  ])
                }}
              // onClick={() => {
              //   setFormData([
              //     ...formData,
              //     {
              //       category: '',
              //       details: '',
              //       on_date_of_marriage: '',
              //       on_valuation_date: '',
              //       today: ''
              //     }
              //   ])
              // }}
              >
                Add More
              </button>
            </div>

            <div className="inputs-row">
              <div className="inputs inputs-4">
                <label className="form-label mb-0">Total Debts and Liabilities</label>
                <InputCustom
                  type="text"
                  label="on Date of marriage"
                  placeholder="$0"
                  disabled={true}
                  value={`$${totals.totalOnDateOfMarriage.toFixed(2)}`}
                />
                <InputCustom
                  type="text"
                  label="on Valuation date"
                  placeholder="$0"
                  disabled={true}
                  value={`$ ${totals.totalOnValuationDate.toFixed(2)}`}
                />
                <InputCustom
                  type="text"
                  label="Today"
                  placeholder="$0"
                  disabled={true}
                  value={`$${totals.totaltoday.toFixed(2)}`}
                />
              </div>
              <div className="action"></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DebtsAndLiabilitiesSimple

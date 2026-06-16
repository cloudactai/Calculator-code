import { useEffect, useState } from 'react'

import InputCustom from '../../components/InputCustom'
import Loader from '../../components/Loader'
import { EmploymentData } from '../../utils/Apis/matters/CustomHook/DocumentViewDataUpdate'

const EmploymentDetailsSimple = ({ matterId, onUpdateFormData, activeTab, setActiveTab }) => {
  const [loading, setLoading] = useState(true)
  const {  selectEmployment, selectEmploymentDataLoading,selectEmploymentDataError} = EmploymentData(matterId)

  useEffect(() => {
    if(selectEmployment && !selectEmploymentDataLoading){
      setFormData(selectEmployment)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [selectEmploymentDataLoading])

  const [formData, setFormData] = useState({
    client: {
      employmentStatus: '',
      employerName: '',
      employerAddress: '',
      employedSince: '',
      businessName: '',
      businessAddress: '',
      lastEmployed: ''
    },
    opposingParty: {
      employmentStatus: '',
      employerName: '',
      employerAddress: '',
      employedSince: '',
      businessName: '',
      businessAddress: '',
      lastEmployed: ''
    }
  })
  useEffect(() => {
   
    onUpdateFormData({
      type: 'employment',
      employment: {
        data: formData
      },
    })
  },[formData])
  
  const handleFormDataChange = e => {
    
    if (activeTab === 'Client') {
      setFormData({
        ...formData,
        client: {
          ...formData.client,
          [e.target.name]: e.target.value
        }
      })
    } else {
      setFormData({
        ...formData,
        opposingParty: {
          ...formData.opposingParty,
          [e.target.name]: e.target.value
        }
      })
    }

    
  }

  return (
    <>
     {selectEmploymentDataLoading ? (
        <Loader isLoading={selectEmploymentDataLoading} />
      ) : (
    <div className='accordion-body'>
      <div className='tab-actions pb-30px'>
        <div
          className={`tab-action ${activeTab === 'Client' ? 'active' : ''}`}
          onClick={() => setActiveTab('Client')}
        >
          Client
        </div>
        <div
          className={`tab-action ${
            activeTab === 'Opposing Party' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('Opposing Party')}
        >
          Opposing Party
        </div>
      </div>

      {activeTab === 'Client' ? (
        <>
          <div className='row pb-4'>
            <label className='form-label-custom'>
              What is the employment status of the client?
            </label>
            <div className='form-group'>
              {/* Radio inputs for Employed, Self Employed and Unemployed */}
              <div className='form-check form-check-inline'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='employmentStatus'
                  id='employed'
                  value='employed'
                  checked={formData?.client?.employmentStatus === 'employed' || ''}
                  onChange={handleFormDataChange}
                />
                <label className='form-check-label' htmlFor='employed'>
                  Employed
                </label>
              </div>
              <div className='form-check form-check-inline'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='employmentStatus'
                  id='self_employed'
                  value='self_employed'
                  checked={
                    formData?.client?.employmentStatus === 'self_employed' || ''
                  }
                  onChange={handleFormDataChange}
                />
                <label className='form-check-label' htmlFor='self_employed'>
                  Self Employed
                </label>
              </div>
              <div className='form-check form-check-inline'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='employmentStatus'
                  id='unemployed'
                  value='unemployed'
                  checked={formData?.client?.employmentStatus === 'unemployed' || ''}
                  onChange={handleFormDataChange}
                />
                <label className='form-check-label' htmlFor='unemployed'>
                  Unemployed
                </label>
              </div>
            </div>
          </div>

          {formData?.client?.employmentStatus === 'employed' && (
            <div className='row pb-4'>
              <div className='inputs-group pb-10px'>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>Name of Employer:</label>
                    <InputCustom
                      type='text'
                      placeholder='Write Name'
                      name='employerName'
                      value={formData?.client?.employerName}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>
                      Address of Employer:
                    </label>
                    <InputCustom
                      type='text'
                      placeholder='Write Address'
                      name='employerAddress'
                      value={formData?.client?.employerAddress}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>Employed since:</label>
                    <InputCustom
                      type='date'
                      placeholder='Choose Date'
                      name='employedSince'
                      value={formData?.client?.employedSince}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData?.client?.employmentStatus === 'self_employed' && (
            <div className='row pb-4'>
              <div className='inputs-group pb-10px'>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>Name of Business:</label>
                    <InputCustom
                      type='text'
                      placeholder='Write Name'
                      name='businessName'
                      value={formData?.client?.businessName}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>
                      Address of Business:
                    </label>
                    <InputCustom
                      type='text'
                      placeholder='Write Address'
                      name='businessAddress'
                      value={formData?.client?.businessAddress}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData?.client?.employmentStatus === 'unemployed' && (
            <div className='row pb-4'>
              <div className='inputs-group pb-10px'>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>
                      When last employed:
                    </label>
                    <InputCustom
                      type='date'
                      placeholder='Choose Date'
                      name='lastEmployed'
                      value={formData?.client?.lastEmployed}
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
          <div className='row pb-4'>
            <label className='form-label-custom'>
              What is the employment status of the client?
            </label>
            <div className='form-group'>
              {/* Radio inputs for Employed, Self Employed and Unemployed */}
              <div className='form-check form-check-inline'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='employmentStatus'
                  id='employed'
                  value='employed'
                  checked={
                    formData?.opposingParty?.employmentStatus === 'employed'
                  }
                  onChange={handleFormDataChange}
                />
                <label className='form-check-label' htmlFor='employed'>
                  Employed
                </label>
              </div>
              <div className='form-check form-check-inline'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='employmentStatus'
                  id='self_employed'
                  value='self_employed'
                  checked={
                    formData?.opposingParty?.employmentStatus === 'self_employed'
                  }
                  onChange={handleFormDataChange}
                />
                <label className='form-check-label' htmlFor='self_employed'>
                  Self Employed
                </label>
              </div>
              <div className='form-check form-check-inline'>
                <input
                  className='form-check-input'
                  type='radio'
                  name='employmentStatus'
                  id='unemployed'
                  value='unemployed'
                  checked={
                    formData?.opposingParty?.employmentStatus === 'unemployed'
                  }
                  onChange={handleFormDataChange}
                />
                <label className='form-check-label' htmlFor='unemployed'>
                  Unemployed
                </label>
              </div>
            </div>
          </div>

          {formData?.opposingParty?.employmentStatus === 'employed' && (
            <div className='row pb-4'>
              <div className='inputs-group pb-10px'>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>Name of Employer:</label>
                    <InputCustom
                      type='text'
                      placeholder='Write Name'
                      name='employerName'
                      value={formData.opposingParty.employerName}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>
                      Address of Employer:
                    </label>
                    <InputCustom
                      type='text'
                      placeholder='Write Address'
                      name='employerAddress'
                      value={formData.opposingParty.employerAddress}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>Employed since:</label>
                    <InputCustom
                      type='date'
                      placeholder='Choose Date'
                      name='employedSince'
                      value={formData.opposingParty.employedSince}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData?.opposingParty?.employmentStatus === 'self_employed' && (
            <div className='row pb-4'>
              <div className='inputs-group pb-10px'>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>Name of Business:</label>
                    <InputCustom
                      type='text'
                      placeholder='Write Name'
                      name='businessName'
                      value={formData.opposingParty.businessName}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>
                      Address of Business:
                    </label>
                    <InputCustom
                      type='text'
                      placeholder='Write Address'
                      name='businessAddress'
                      value={formData.opposingParty.businessAddress}
                      handleChange={handleFormDataChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData?.opposingParty?.employmentStatus === 'unemployed' && (
            <div className='row pb-4'>
              <div className='inputs-group pb-10px'>
                <div className='inputs-row no-action pb-10px'>
                  <div className='inputs'>
                    <label className='form-label mb-0'>
                      When last employed:
                    </label>
                    <InputCustom
                      type='date'
                      placeholder='Choose Date'
                      name='lastEmployed'
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
    </div>
    )}
    </>
  )
}

export default EmploymentDetailsSimple

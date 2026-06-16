import { useState, useEffect } from 'react'

import { Accordion } from 'react-bootstrap'
import Dropdown from '../../components/Matters/Form/Dropdown'
import InputCustom from '../../components/InputCustom'

import background_information from '../../assets/images/background_information.svg'
import lawyer from '../../assets/images/lawyer.svg'
import { getAllMunicipalities } from '../../utils/Apis/matters/getMunicipalities/getMunicipalitiesActions'
import { useDispatch, useSelector } from 'react-redux'
import { selectMunicipaltiesData } from '../../utils/Apis/matters/getMunicipalities/getMunicipalitiesSelectors'
import CustomDropDown from '../../components/Matters/Form/CustomDropdown'
import { clientBackground, opposingPartyBackground } from '../../utils/matterData/sampleData'

const BackgroundInformation = ({ BackgroundInformationData, MatterData }) => {

  const testing = false;

  const [clientFormData, setClientFormData] = useState({
    role: '',
    province: '',
    name: '',
    postalCode: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    email: '',
    municipality: '',
    representedBy: '',

    // Lawyer
    lawyerPostalCode: '',
    lawyerName: '',
    lawyerAddress: '',
    lawyerEmail: '',
    lawyerPhone: '',
    lawyerProvince: '',
    lawyerMunicipality: ''
  })

  const [opposingPartyFormData, setOpposingPartyFormData] = useState({
    role: '',
    province: '',
    name: '',
    postalCode: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    email: '',
    municipality: '',
    representedBy: '',

    // Lawyer
    lawyerPostalCode: '',
    lawyerName: '',
    lawyerAddress: '',
    lawyerEmail: '',
    lawyerPhone: '',
    lawyerProvince: '',
    lawyerMunicipality: ''
  })

  // Add this useEffect for testing
  useEffect(() => {
    if (testing === true) {
      console.log("🚀 ~ BackgroundInformation ~ testing:", clientBackground);
      setClientFormData(clientBackground);
      setOpposingPartyFormData(opposingPartyBackground)
    }
  }, [dispatch]);
 

  const dispatch = useDispatch()
  useEffect(() => {
    // dispatch(getAllMunicipalities(MatterData.province))
    dispatch(getAllMunicipalities(MatterData.province))
  }, [])

  const getMunicipalities = useSelector(selectMunicipaltiesData)

  const municipalities = getMunicipalities?.body.map(item => ({
    name: item.municipality,
    value: item.municipality
  }))

  const [bgInfoActiveTab, setBgInfoActiveTab] = useState('Client')
  const [progress, setProgress] = useState(0)



  // const calculateProgress = () => {
  //   let progress = 0

  //   // Client has 50% weight
  //   let clientFields = 0
  //   let clientFieldsFilled = 0

  //   for (const key in clientFormData) {
  //     if (clientFormData.hasOwnProperty(key)) {
  //       clientFields++
  //       if (clientFormData[key] !== '') {
  //         clientFieldsFilled++
  //       }
  //     }
  //   }

  //   progress += (clientFieldsFilled / clientFields) * 50

  //   // Opposing Party has 50% weight
  //   let opposingPartyFields = 0
  //   let opposingPartyFieldsFilled = 0

  //   for (const key in opposingPartyFormData) {
  //     if (opposingPartyFormData.hasOwnProperty(key)) {
  //       opposingPartyFields++
  //       if (opposingPartyFormData[key] !== '') {
  //         opposingPartyFieldsFilled++
  //       }
  //     }
  //   }

  //   progress += (opposingPartyFieldsFilled / opposingPartyFields) * 50

  //   progress = Math.round(progress)

  //   setProgress(progress)
  // }

  const calculateProgress = () => {
    let progress = 0;

    // Helper function to count filled required fields
    const countFilledRequiredFields = (data, isLawyer) => {
      const requiredFields = [
        'role',
        'province',
        'name',
        'postalCode',
        'phone',
        'address',
        'email'
      ];

      const lawyerRequiredFields = [
        'lawyerName',
        'lawyerAddress',
        'lawyerPhone',
        'lawyerEmail',
        'lawyerProvince'
      ];

      let totalFields = requiredFields.length;
      let filledFields = requiredFields.filter(field => data[field] !== '').length;

      // Only count lawyer fields if represented by lawyer
      if (isLawyer) {
        totalFields += lawyerRequiredFields.length;
        filledFields += lawyerRequiredFields.filter(field => data[field] !== '').length;
      }

      return { totalFields, filledFields };
    };

    // Calculate client progress (50% weight)
    const isClientLawyer = clientFormData.representedBy === 'Lawyer';
    const clientStats = countFilledRequiredFields(clientFormData, isClientLawyer);
    const clientProgress = (clientStats.filledFields / clientStats.totalFields) * 50;

    // Calculate opposing party progress (50% weight)
    const isOpposingPartyLawyer = opposingPartyFormData.representedBy === 'Lawyer';
    const opposingPartyStats = countFilledRequiredFields(opposingPartyFormData, isOpposingPartyLawyer);
    const opposingPartyProgress = (opposingPartyStats.filledFields / opposingPartyStats.totalFields) * 50;

    progress = Math.round(clientProgress + opposingPartyProgress);
    setProgress(progress);
  };

  const handleClientFormDataChange = e => {
    setClientFormData({
      ...clientFormData,
      [e.target.name]: e.target.value
    })
  }



  const handleOpposingPartyFormDataChange = e => {
    setOpposingPartyFormData({


      ...opposingPartyFormData,
      [e.target.name]: e.target.value
    })
  }

  const [isOpen, setIsOpen] = useState(false)
  const handleAccordionStatus = e => {
    setIsOpen(!isOpen)
    // 
  }

  useEffect(() => {
    calculateProgress()
    BackgroundInformationData({
      progress: progress,
      data: {
        client: clientFormData,
        opposingParty: opposingPartyFormData
      },
      isOpen: isOpen
    })
  }, [clientFormData, opposingPartyFormData, progress, isOpen])

  const handleRoleSelection = (e, selectedRole, formType) => {
    const selectedValue = selectedRole ? selectedRole.value : '';

    setClientRoleList(prevState =>
      prevState.map(role => {
        if (formType === 'client' && role.value === clientFormData.role) {
          return { ...role, selected: false };
        }
        if (formType === 'opposingParty' && role.value === opposingPartyFormData.role) {
          return { ...role, selected: false };
        }
        if (role.value === selectedValue) {
          return { ...role, selected: true };
        }
        return role;
      })
    );

    if (formType === 'client') {
      setClientFormData(prevState => ({ ...prevState, role: selectedValue }));
    } else if (formType === 'opposingParty') {
      setOpposingPartyFormData(prevState => ({ ...prevState, role: selectedValue }));
    }
  };

  const getFilteredRoleList = (currentRole) => {
    return clientRoleList.filter(role => !role.selected || role.value === currentRole);
  };


  const [clientRoleList, setClientRoleList] = useState([
    {
      id: 'client',
      name: 'Client',
      value: 'Client',
      selected: false
    },
    {
      id: 'opposingParty',
      name: 'Opposing Party',
      value: 'Opposing Party',
      selected: false
    },
    {
      id: 'other',
      name: 'Other',
      value: 'Other',
      selected: false
    }
  ])

  const provinceList = [
    {
      name: 'Ontario',
      value: 'Ontario'
    },
    {
      name: 'Quebec',
      value: 'Quebec'
    },
    {
      name: 'British Columbia',
      value: 'British Columbia'
    },
    {
      name: 'Alberta',
      value: 'Alberta'
    },
    {
      name: 'Manitoba',
      value: 'Manitoba'
    },
    {
      name: 'Saskatchewan',
      value: 'Saskatchewan'
    },
    {
      name: 'Nova Scotia',
      value: 'Nova Scotia'
    },
    {
      name: 'New Brunswick',
      value: 'New Brunswick'
    },
    {
      name: 'Newfoundland and Labrador',
      value: 'Newfoundland and Labrador'
    },
    {
      name: 'Prince Edward Island',
      value: 'Prince Edward Island'
    },
    {
      name: 'Northwest Territories',
      value: 'Northwest Territories'
    },
    {
      name: 'Nunavut',
      value: 'Nunavut'
    },
    {
      name: 'Yukon',
      value: 'Yukon'
    }
  ]

  const representedByList = [
    {
      name: 'Self',
      value: 'Self'
    },
    {
      name: 'Lawyer',
      value: 'Lawyer'
    }
  ]

  return (


    <Accordion.Item eventKey='0'>
      <Accordion.Header onClick={handleAccordionStatus}>
        <img src={background_information} alt='' />
        <div className='w-100 px-2' style={{ marginRight: '8%' }}>
          <div className='d-flex justify-content-between'>
            <div>Background information</div>
            <div>{progress}%</div>
          </div>
          <div
            className={`progress-bar ${progress === 100 ? 'done' : ''}`}
            style={{ '--progress-width': `${progress}%` }}
          ></div>
        </div>
      </Accordion.Header>
      <Accordion.Body>
        <div className='tab-actions'>
          <div
            className={`tab-action ${bgInfoActiveTab === 'Client' ? 'active' : ''
              }`}
            onClick={() => setBgInfoActiveTab('Client')}
          >
            Client
          </div>
          <div
            className={`tab-action ${bgInfoActiveTab === 'Opposing Party' ? 'active' : ''
              }`}
            onClick={() => setBgInfoActiveTab('Opposing Party')}
          >
            Opposing Party
          </div>
        </div>
        {bgInfoActiveTab === 'Client' ? (
          <div id='client' className='tab-content'>
            <div className='inputs-group pt-4'>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Role*</label>
                  <Dropdown
                    handleChange={(e, li) => handleRoleSelection(e, li, 'client')}
                    list={getFilteredRoleList(clientFormData.role)}
                    curListItem={clientFormData.role}
                  ></Dropdown>
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Province*</label>
                  <Dropdown
                    handleChange={(e, li) =>
                      setClientFormData({
                        ...clientFormData,
                        province: li.value
                      })
                    }
                    list={provinceList}
                    curListItem={clientFormData.province}
                  ></Dropdown>
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Full Legal Name*</label>
                  <InputCustom
                    type='text'
                    placeholder='Enter Name'
                    name='name'
                    value={clientFormData.name}
                    handleChange={handleClientFormDataChange}
                  />
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Postal Code*</label>
                  <InputCustom
                    type='text'
                    placeholder='Write Postal code'
                    name='postalCode'
                    value={clientFormData.postalCode}
                    handleChange={handleClientFormDataChange}
                  />
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Date of Birth</label>
                  <InputCustom
                    type='date'
                    placeholder='Select Date'
                    name='dateOfBirth'
                    value={clientFormData.dateOfBirth}
                    handleChange={handleClientFormDataChange}
                  />
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Phone*</label>
                  <InputCustom
                    type='text'
                    placeholder='Write Phone Number'
                    name='phone'
                    value={clientFormData.phone}
                    handleChange={handleClientFormDataChange}
                  />
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Address*</label>
                  <InputCustom
                    type='text'
                    placeholder='Write Address'
                    name='address'
                    value={clientFormData.address}
                    handleChange={handleClientFormDataChange}
                  />
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Email*</label>
                  <InputCustom
                    type='email'
                    placeholder='Write Email'
                    name='email'
                    value={clientFormData.email}
                    handleChange={handleClientFormDataChange}
                  />
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Municipality</label>

                  <CustomDropDown
                    list={municipalities}
                    label='name'
                    id='id'
                    handleChange={(e, li) =>
                      setClientFormData({
                        ...clientFormData,
                        municipality: li.value
                      })
                    }
                    curListItem={clientFormData.municipality}
                  />
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Represented by</label>
                  <Dropdown
                    handleChange={(e, li) =>
                      setClientFormData({
                        ...clientFormData,
                        representedBy: li.value
                      })
                    }
                    list={representedByList}
                    curListItem={clientFormData.representedBy}
                  ></Dropdown>
                </div>
              </div>
            </div>

            {clientFormData.representedBy === "Lawyer" && (
              <>
                <div className='sub-heading pt-0'>
                  <img src={lawyer} alt='lawyer' />
                  <span>Lawyer</span>
                </div>

                <div className='inputs-group pb-10px'>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Full Name*</label>
                      <InputCustom
                        type='text'
                        placeholder='Enter Name'
                        name='lawyerName'
                        value={clientFormData.lawyerName}
                        handleChange={handleClientFormDataChange}
                      />
                    </div>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Postal Code</label>
                      <InputCustom
                        type='text'
                        placeholder='Write Postal code'
                        name='lawyerPostalCode'
                        value={clientFormData.lawyerPostalCode}
                        handleChange={handleClientFormDataChange}
                      />
                    </div>
                  </div>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Address*</label>
                      <InputCustom
                        type='text'
                        placeholder='Write Address'
                        name='lawyerAddress'
                        value={clientFormData.lawyerAddress}
                        handleChange={handleClientFormDataChange}
                      />
                    </div>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Phone*</label>
                      <InputCustom
                        type='text'
                        placeholder='Write Phone'
                        name='lawyerPhone'
                        value={clientFormData.lawyerPhone}
                        handleChange={handleClientFormDataChange}
                      />
                    </div>
                  </div>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Municipality</label>
                      <CustomDropDown
                        list={municipalities}
                        handleChange={(e, li) =>
                          setClientFormData({
                            ...clientFormData,
                            lawyerMunicipality: li.value
                          })
                        }
                        curListItem={clientFormData.lawyerMunicipality}
                      />
                    </div>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Email*</label>
                      <InputCustom
                        type='email'
                        placeholder='Write Email'
                        name='lawyerEmail'
                        value={clientFormData.lawyerEmail}
                        handleChange={handleClientFormDataChange}
                      />
                    </div>
                  </div>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Province*</label>
                      <Dropdown
                        handleChange={(e, li) =>
                          setClientFormData({
                            ...clientFormData,
                            lawyerProvince: li.value
                          })
                        }
                        list={provinceList}
                        curListItem={clientFormData.lawyerProvince}
                      ></Dropdown>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div id='oppposingParty' className='tab-content'>
            <div className='inputs-group pt-4'>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Role*</label>
                  <Dropdown
                    handleChange={(e, li) => handleRoleSelection(e, li, 'opposingParty')}
                    list={getFilteredRoleList(opposingPartyFormData.role)}
                    curListItem={opposingPartyFormData.role}
                  ></Dropdown>
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Province*</label>
                  <Dropdown
                    handleChange={(e, li) =>
                      setOpposingPartyFormData({
                        ...opposingPartyFormData,
                        province: li.value
                      })
                    }
                    list={provinceList}
                    curListItem={opposingPartyFormData.province}
                  ></Dropdown>
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Full Legal Name*</label>
                  <InputCustom
                    type='text'
                    placeholder='Enter Name'
                    name='name'
                    value={opposingPartyFormData.name}
                    handleChange={handleOpposingPartyFormDataChange}
                  />
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Postal Code*</label>
                  <InputCustom
                    type='text'
                    placeholder='Write Postal code'
                    name='postalCode'
                    value={opposingPartyFormData.postalCode}
                    handleChange={handleOpposingPartyFormDataChange}
                  />
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Date of Birth</label>
                  <InputCustom
                    type='date'
                    placeholder='Select Date'
                    name='dateOfBirth'
                    value={opposingPartyFormData.dateOfBirth}
                    handleChange={handleOpposingPartyFormDataChange}
                  />
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Phone*</label>
                  <InputCustom
                    type='text'
                    placeholder='Write Phone Number'
                    name='phone'
                    value={opposingPartyFormData.phone}
                    handleChange={handleOpposingPartyFormDataChange}
                  />
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Address*</label>
                  <InputCustom
                    type='text'
                    placeholder='Write Address'
                    name='address'
                    value={opposingPartyFormData.address}
                    handleChange={handleOpposingPartyFormDataChange}
                  />
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Email*</label>
                  <InputCustom
                    type='email'
                    placeholder='Write Email'
                    name='email'
                    value={opposingPartyFormData.email}
                    handleChange={handleOpposingPartyFormDataChange}
                  />
                </div>
              </div>
              <div className='inputs-row labeled pb-20px'>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Municipality</label>
                  <Dropdown
                    handleChange={(e, li) =>
                      setOpposingPartyFormData({
                        ...opposingPartyFormData,
                        municipality: li.value
                      })
                    }
                    list={municipalities}
                    curListItem={opposingPartyFormData.municipality}
                  ></Dropdown>
                </div>
                <div className='inputs inputs-2-3'>
                  <label className='form-label mb-0'>Represented by</label>
                  <Dropdown
                    handleChange={(e, li) =>
                      setOpposingPartyFormData({
                        ...opposingPartyFormData,
                        representedBy: li.value
                      })
                    }
                    list={representedByList}
                    curListItem={opposingPartyFormData.representedBy}
                  ></Dropdown>
                </div>
              </div>
            </div>

            {opposingPartyFormData.representedBy === "Lawyer" && (
              <>
                <div className='sub-heading pt-0'>
                  <img src={lawyer} alt='Lawyer' />
                  <span>Lawyer</span>
                </div>

                <div className='inputs-group pb-10px'>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Full Name*</label>
                      <InputCustom
                        type='text'
                        placeholder='Enter Name'
                        name='lawyerName'
                        value={opposingPartyFormData.lawyerName}
                        handleChange={handleOpposingPartyFormDataChange}
                      />
                    </div>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Postal Code</label>
                      <InputCustom
                        type='text'
                        placeholder='Write Postal code'
                        name='lawyerPostalCode'
                        value={opposingPartyFormData.lawyerPostalCode}
                        handleChange={handleOpposingPartyFormDataChange}
                      />
                    </div>
                  </div>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Address*</label>
                      <InputCustom
                        type='text'
                        placeholder='Write Address'
                        name='lawyerAddress'
                        value={opposingPartyFormData.lawyerAddress}
                        handleChange={handleOpposingPartyFormDataChange}
                      />
                    </div>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Phone*</label>
                      <InputCustom
                        type='text'
                        placeholder='Write Phone'
                        name='lawyerPhone'
                        value={opposingPartyFormData.lawyerPhone}
                        handleChange={handleOpposingPartyFormDataChange}
                      />
                    </div>
                  </div>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Municipality</label>
                      <CustomDropDown
                        list={municipalities}
                        handleChange={(e, li) =>
                          setOpposingPartyFormData({
                            ...opposingPartyFormData,
                            lawyerMunicipality: li.value
                          })
                        }
                        curListItem={opposingPartyFormData.lawyerMunicipality}
                      />
                      {/* <Dropdown
                        handleChange={(e, li) =>
                          setOpposingPartyFormData({
                            ...clientFormData,
                            lawyerMunicipality: li.value
                          })
                        }
                        list={clientRoleList}
                        curListItem={opposingPartyFormData.lawyerMunicipality}
                      ></Dropdown> */}
                    </div>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Email*</label>
                      <InputCustom
                        type='email'
                        placeholder='Write Email'
                        name='lawyerEmail'
                        value={opposingPartyFormData.lawyerEmail}
                        handleChange={handleOpposingPartyFormDataChange}
                      />
                    </div>
                  </div>
                  <div className='inputs-row labeled pb-20px'>
                    <div className='inputs inputs-2-3'>
                      <label className='form-label mb-0'>Province*</label>
                      <Dropdown
                        handleChange={(e, li) =>
                          setOpposingPartyFormData({
                            ...opposingPartyFormData,
                            lawyerProvince: li.value
                          })
                        }
                        list={provinceList}
                        curListItem={opposingPartyFormData.lawyerProvince}
                      ></Dropdown>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Accordion.Body>
    </Accordion.Item>
  )
}

export default BackgroundInformation

import { useState, useEffect } from 'react'

import InputCustom from "../../../components/InputCustom";
import { assetsDetails, financialAssets } from '../../../utils/matterData/categoryData';
import CustomDropDown from '../../../components/Matters/Form/CustomDropdown';
import { formatNumber } from '../../../utils/helpers/Formatting'
const BankAccountsSavingsSecuritiesPension = ({ BankAccountsSavingsSecuritiesPensionData, assetsData }) => {
    
    const [opposingDiffers, setOpposingDiffers] = useState(false)
    const [formDataSet,  isFormDatSet] = useState(false)
    const [formData, setFormData] = useState([
        {
            category_bassp: "",
            institution: "",
            description_bassp: "",
            account_number: "",
            property_status_bassp: "",
            market_value: {
                client: {
                    on_date_of_marriage: "",
                    on_valuation_date: "",
                    today: ""
                },
                opposing_party: {
                    on_date_of_marriage: '',
                    on_valuation_date: '',
                    today: ''
                  }
            },
        },
    ]);

    useEffect(() => {
        if(assetsData){
          setFormData(assetsData);
          isFormDatSet(true)
          calculateTotal()
        }
      }, [assetsData, formDataSet])

    const [total, setTotal] = useState(0);

    const calculateTotal = () => {
        let total = 0;
        formData.forEach((item) => {
            total += parseInt(item?.market_value?.client?.today === "" ? 0 : item?.market_value?.client?.today);
        });

        setTotal(total);
    }

    const handleChange = (e) => {
        let key = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        // 

        let name = e.target.name;
        if (name === "" || name === undefined) {
            name = e.target.dataset.name;
        }
        // 

        const newFormData = [...formData];
        newFormData[key][name] = e.target.value;

        setFormData(newFormData);

        
    }

    const handleClientAssetTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        
        const newFormData = [...formData];
        newFormData[index]['category_bassp'] = li.value
        setFormData(newFormData)
    
        
      }

    const handleRadioChange = (e) => {
        let key = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        // 

        let name = e.target.name;
        if (name === "" || name === undefined) {
            name = e.target.dataset.name;
        }
        // 

        const newFormData = [...formData];
        newFormData[key][name] = e.target.value;

        if (e.target.value === 'opposing_Party_view_differs') {
            setOpposingDiffers(true)
          } else {
              setOpposingDiffers(false)
          }

        setFormData(newFormData);

        
    }


    const handleClientLandsChange = (e) => {
        let key = e.target.parentElement.parentElement.parentElement.parentElement.dataset.key;
        // 

        const newFormData = [...formData];
        newFormData[key].market_value.client[e.target.name] = e.target.value;

        setFormData(newFormData);

        calculateTotal();

        
    }

    const handleOpposingPartyLandsChange = e => {
        let key =
          e.target.parentElement.parentElement.parentElement.parentElement.dataset
            .key
        // 
    
        const newFormData = [...formData]
        newFormData[key].market_value.opposing_party[e.target.name] = e.target.value
    
        setFormData(newFormData)
    
        calculateTotal()
      }


    useEffect(() => {
        BankAccountsSavingsSecuritiesPensionData(formData);
    }, [formData]);

    return (
        <div className="pb-50px matterType">
            <div className="inputs-group pb-10px">
                <div className="header">
                    <div className="title">Bank accounts, savings, securities, pension</div>
                    <div>
                        <div className="calculated_amount">{formatNumber(total)}</div>
                    </div>
                </div>
                {formData.map((item, index) => (
                    <div className="body" data-key={index} key={index}>
                        <div className="spanned-rows">
                            <div className="inputs-rows">
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">Category</label>
                                        <CustomDropDown
                                            handleChange={handleClientAssetTypeChange}
                                            list={financialAssets}
                                            curListItem={item.category_bassp}
                                        />
                                        {/* <InputCustom
                                            type="text"
                                            placeholder="Category"
                                            name="category_bassp"
                                            value={item.category}
                                            handleChange={handleChange}
                                        /> */}
                                    </div>
                                </div>
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">
                                            Institution
                                        </label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Institution"
                                            name="institution"
                                            value={item.institution}
                                            handleChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">
                                            Description
                                        </label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Description"
                                            name="description_bassp"
                                            value={item.description_bassp}
                                            handleChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="inputs-row no-action">
                                    <div className="inputs">
                                        <label className="form-label mb-0">
                                            Account number
                                        </label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Account number"
                                            name="account_number"
                                            value={item.account_number}
                                            handleChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="checkbox-rows">
                                <div className="form-group">
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_bassp"
                                            id={"disposed_property_bassp" + index}
                                            value="disposed_property"
                                            checked={item.property_status_bassp === "disposed_property"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"disposed_property_bassp" + index}
                                        >
                                            Disposed property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_bassp"
                                            id={"excluded_property_bassp" + index}
                                            value="excluded_property"
                                            checked={item.property_status_bassp === "excluded_property"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"excluded_property_bassp" + index}
                                        >
                                            Excluded property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_bassp"
                                            id={"opposing_Party_view_differs_bassp" + index}
                                            value="opposing_Party_view_differs"
                                            checked={item.property_status_bassp === "opposing_Party_view_differs"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"opposing_Party_view_differs_bassp" + index}
                                        >
                                            Opposing Party view differs
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="inputs-row no-action">
                            <div className="inputs inputs-4">
                                <label className="form-label mb-0">
                                    Amount/Value
                                </label>
                                <InputCustom
                                    type="text"
                                    name="on_date_of_marriage"
                                    label="on Date of marriage"
                                    placeholder="Amount"
                                    value={item?.market_value?.client?.on_date_of_marriage}
                                    handleChange={handleClientLandsChange}
                                />
                                <InputCustom
                                    type="text"
                                    name="on_valuation_date"
                                    label="on Valuation date"
                                    placeholder="Amount"
                                    value={item?.market_value?.client?.on_valuation_date}
                                    handleChange={handleClientLandsChange}
                                />
                                <InputCustom
                                    type="text"
                                    name="today"
                                    label="Today"
                                    placeholder="Amount"
                                    value={item?.market_value?.client?.today}
                                    handleChange={handleClientLandsChange}
                                />
                            </div>
                            {opposingDiffers && (
                                <div className='inputs inputs-4 pt-4 pt-xl-0'>
                                    <label className='form-label mb-0'>
                                    Market value (Opposing Party)
                                    </label>
                                    <InputCustom
                                    type='text'
                                    name='on_date_of_marriage'
                                    label='on Date of marriage'
                                    placeholder='Amount'
                                    labelClassNames={'d-xl-none'}
                                    value={item?.market_value?.opposing_party?.on_date_of_marriage}
                                    handleChange={handleOpposingPartyLandsChange}
                                    />
                                    <InputCustom
                                    type='text'
                                    name='on_valuation_date'
                                    label='on Valuation date'
                                    placeholder='Amount'
                                    labelClassNames={'d-xl-none'}
                                    value={item?.market_value?.opposing_party?.on_valuation_date}
                                    handleChange={handleOpposingPartyLandsChange}
                                    />
                                    <InputCustom
                                    type='text'
                                    name='today'
                                    label='Today'
                                    placeholder='Amount'
                                    labelClassNames={'d-xl-none'}
                                    value={item?.market_value?.opposing_party?.today}
                                    handleChange={handleOpposingPartyLandsChange}
                                    />
                                </div>
                                )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="action">
                <button
                    className="btn btn-link"
                    onClick={() => {
                        setFormData([
                            ...formData,
                            {
                                category_bassp: "",
                                institution: "",
                                description_bassp: "",
                                account_number: "",
                                property_status_bassp: "",
                                market_value: {
                                    client: {
                                        on_date_of_marriage: "",
                                        on_valuation_date: "",
                                        today: ""
                                    },
                                    opposing_party: {
                                        on_date_of_marriage: '',
                                        on_valuation_date: '',
                                        today: ''
                                      }
                                },
                            },
                        ]);
                    }}
                >
                    Add Bank Accounts
                </button>
            </div>
        </div>
    )
}

export default BankAccountsSavingsSecuritiesPension
import { useEffect, useState } from 'react'

import InputCustom from "../../../components/InputCustom";
import { lifeInsurance } from '../../../utils/matterData/categoryData';
import CustomDropDown from '../../../components/Matters/Form/CustomDropdown';
import { formatNumber } from '../../../utils/helpers/Formatting'
const LifeAndDisabilityInsurance = ({ LifeAndDisabilityInsuranceData, assetsData }) => {
    const [formDataSet,  isFormDatSet] = useState(false)
   
    useEffect(() => {
        if(assetsData){
          setFormData(assetsData);
          isFormDatSet(true)
          calculateTotal()
        }
      }, [assetsData,formDataSet])


      const [formData, setFormData] = useState([
        {
            insurance_type: "",
            policy_no: "",
            owner: "",
            beneficiary: "",
            face_amount: "",
            property_status_ladi: "",
            market_value: {
                client: {
                    on_date_of_marriage: "",
                    on_valuation_date: "",
                    today: ""
                },
            },
        },
    ]);
    
    const [total, setTotal] = useState(0);

    const calculateTotal = () => {
        let total = 0;
        formData.forEach((item) => {
            total += parseInt(item?.market_value?.client?.today === "" ? 0 : item?.market_value?.client?.today);
        });

        setTotal(total);
    }

    const handleClientAssetTypeChange = (e, li) => {
        let index = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.dataset.key;
        
        
        const newFormData = [...formData];
        newFormData[index]['insurance_type'] = li.value
        setFormData(newFormData)
    
        
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

    useEffect(() => {
        LifeAndDisabilityInsuranceData(formData);
    }, [formData]);

    return (
        <div className="pb-50px matterType">
            <div className="inputs-group pb-10px">
                <div className="header">
                    <div className="title">Life & Disability insurance</div>
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
                                        <label className="form-label mb-0">Item</label>
                                        <CustomDropDown
                                            handleChange={handleClientAssetTypeChange}
                                            list={lifeInsurance}
                                            curListItem={item.insurance_type}
                                        />
                                    </div>
                                </div>
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">Company, Type and Policy No</label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Policy No"
                                            name="policy_no"
                                            value={item.policy_no}
                                            handleChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">
                                            Owner
                                        </label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Owner"
                                            name="owner"
                                            value={item.owner}
                                            handleChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">
                                            Beneficiary
                                        </label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Beneficiary Name"
                                            name="beneficiary"
                                            value={item.beneficiary}
                                            handleChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="inputs-row no-action">
                                    <div className="inputs">
                                        <label className="form-label mb-0">
                                            Face Amount
                                        </label>
                                        <InputCustom
                                            type="number"
                                            placeholder="Amount"
                                            name="face_amount"
                                            value={item.face_amount}
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
                                            data-name="property_status_ladi"
                                            id={"disposed_property_ladi" + index}
                                            value="disposed_property"
                                            checked={item.property_status_ladi === "disposed_property"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"disposed_property_ladi" + index}
                                        >
                                            Disposed property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_ladi"
                                            id={"excluded_property_ladi" + index}
                                            value="excluded_property"
                                            checked={item.property_status_ladi === "excluded_property"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"excluded_property_ladi" + index}
                                        >
                                            Excluded property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_ladi"
                                            id={"opposing_Party_view_differs_ladi" + index}
                                            value="opposing_Party_view_differs"
                                            checked={item.property_status_ladi === "opposing_Party_view_differs"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"opposing_Party_view_differs_ladi" + index}
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
                                    Cash Surrender Value
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
                                insurance_type: "",
                                policy_no: "",
                                owner: "",
                                beneficiary: "",
                                face_amount: "",
                                property_status_ladi: "",
                                market_value: {
                                    client: {
                                        on_date_of_marriage: "",
                                        on_valuation_date: "",
                                        today: ""
                                    },
                                },
                            },
                        ]);
                    }}
                >
                    Add Life & Disability insurance
                </button>
            </div>
        </div>
    )
}

export default LifeAndDisabilityInsurance
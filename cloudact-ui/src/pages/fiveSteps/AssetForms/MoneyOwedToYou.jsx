import { useState, useEffect } from 'react'

import InputCustom from "../../../components/InputCustom";
import { formatNumber } from '../../../utils/helpers/Formatting'
const MoneyOwedToYou = ({ MoneyOwedToYouData, assetsData }) => {
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
            details_moty: "",
            property_status_moty: "",
            market_value: {
                client: {
                    on_date_of_marriage: "",
                    on_valuation_date: "",
                    today: ""
                },
                opposing_party: {
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
        MoneyOwedToYouData(formData);
    }, [formData]);

    return (
        <div className="pb-50px">
            <div className="inputs-group pb-10px">
                <div className="header">
                    <div className="title">Money Owed To You</div>
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
                                        <label className="form-label mb-0">Details</label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Details"
                                            name="details_moty"
                                            value={item.details_moty}
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
                                            data-name="property_status_moty"
                                            id={"disposed_property_moty" + index}
                                            value="disposed_property"
                                            checked={item.property_status_moty === "disposed_property"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"disposed_property_moty" + index}
                                        >
                                            Disposed property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_moty"
                                            id={"excluded_property_moty" + index}
                                            value="excluded_property"
                                            checked={item.property_status_moty === "excluded_property"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"excluded_property_moty" + index}
                                        >
                                            Excluded property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_moty"
                                            id={"opposing_Party_view_differs_moty" + index}
                                            value="opposing_Party_view_differs"
                                            checked={item.property_status_moty === "opposing_Party_view_differs"}
                                            onChange={handleRadioChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"opposing_Party_view_differs_moty" + index}
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
                                    Amount
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
                                details_moty: "",
                                property_status_moty: "",
                                market_value: {
                                    client: {
                                        on_date_of_marriage: "",
                                        on_valuation_date: "",
                                        today: ""
                                    },
                                    opposing_party: {
                                        on_date_of_marriage: "",
                                        on_valuation_date: "",
                                        today: ""
                                    },
                                },
                            },
                        ]);
                    }}
                >
                    Add Money Owed To You
                </button>
            </div>
        </div>
    )
}

export default MoneyOwedToYou
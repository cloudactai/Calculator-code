import { useState, useEffect } from 'react'

import InputCustom from '../../../components/InputCustom'
import { formatNumber } from '../../../utils/helpers/Formatting'
const OtherProperty = ({ OtherPropertyData, assetsData }) => {
    console.log("🚀 ~ OtherProperty ~ assetsData:", assetsData)
    const [formDataSet, isFormDatSet] = useState(false)
    const [dataErrors, setDataErrors] = useState(null);
    const [formData, setFormData] = useState([
        {
            category_op: "",
            details_op: "",
            property_status_op: "",
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

    useEffect(() => {
        if(assetsData){
          setFormData(assetsData);
          calculateTotal()
          isFormDatSet(true)
        }
      }, [formDataSet])

      useEffect(() => {
        OtherPropertyData(formData)
        calculateTotal();
    }, [formData])

    const [total, setTotal] = useState(0)


    const handleLandsChange = e => {
        let key =
            e.target.parentElement.parentElement.parentElement.parentElement
                .parentElement.dataset.key
        if (key === '' || key === undefined) {
            key =
                e.target.parentElement.parentElement.parentElement.parentElement
                    .parentElement.parentElement.dataset.key
        }


        let name = e.target.name
        if (name === '' || name === undefined) {
            name = e.target.dataset.name
        }
        // 

        const newFormData = [...formData]
        newFormData[key][name] = e.target.value

        setFormData(newFormData)
    }

    const handleClientLandsChange = e => {
        let key =
            e.target.parentElement.parentElement.parentElement.parentElement.dataset
                .key
        // 

        const newFormData = [...formData]
        newFormData[key].market_value.client[e.target.name] = e.target.value

        setFormData(newFormData)

        calculateTotal()
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

    const calculateTotal = () => {
        let total = 0
        formData.forEach(item => {


            total += parseInt(
                item?.market_value?.client?.today === ''
                    ? 0
                    : item?.market_value?.client?.today
            )

            // total += parseInt(
            //     item?.market_value?.opposing_party?.today === ''
            //         ? 0
            //         : item?.market_value?.opposing_party?.today
            // )
        })

        setTotal(total)
    }

  

    return (
        <div className='pb-50px matterType'>
            <div className='inputs-group pb-10px'>
                <div className='header'>
                    <div className="title">Other Property</div>
                    <div>
                        <div className='calculated_amount'>{formatNumber(total)}</div>
                    </div>
                </div>
                {formData.map((item, index) => (
                    <div className="body" data-key={index} key={index}>
                        <div className="spanned-rows">
                            <div className="inputs-rows">
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">Category</label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Category"
                                            name="category_op"
                                            value={item.category_op}
                                            handleChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="inputs-row no-action pb-10px">
                                    <div className="inputs">
                                        <label className="form-label mb-0">
                                            Details
                                        </label>
                                        <InputCustom
                                            type="text"
                                            placeholder="Details"
                                            name="details_op"
                                            value={item.details_op}
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
                                            data-name="property_status_op"
                                            id={"disposed_property_op" + index}
                                            value="disposed_property"
                                            checked={item.property_status_op === "disposed_property"}
                                            onChange={handleLandsChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"disposed_property_op" + index}
                                        >
                                            Disposed property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_op"
                                            id={"excluded_property_op" + index}
                                            value="excluded_property"
                                            checked={item.property_status_op === "excluded_property"}
                                            onChange={handleLandsChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"excluded_property_op" + index}
                                        >
                                            Excluded property
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            data-name="property_status_op"
                                            id={"opposing_Party_view_differs_op" + index}
                                            value="opposing_Party_view_differs"
                                            checked={item.property_status_op === "opposing_Party_view_differs"}
                                            onChange={handleLandsChange}
                                            data-key={index}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={"opposing_Party_view_differs_op" + index}
                                        >
                                            Opposing Party view differs
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='inputs-row no-action'>
                            <div className='inputs inputs-4'>
                                <label className='form-label mb-0'>Market value (Client)</label>
                                <InputCustom
                                    type='amount'
                                    name='on_date_of_marriage'
                                    label='on Date of marriage'
                                    placeholder='Amount'
                                    value={item?.market_value?.client?.on_date_of_marriage}
                                    handleChange={handleClientLandsChange}
                                />
                                <InputCustom
                                    type='amount'
                                    name='on_valuation_date'
                                    label='on Valuation date'
                                    placeholder='Amount'
                                    value={item?.market_value?.client?.on_valuation_date}
                                    handleChange={handleClientLandsChange}
                                />
                                <InputCustom
                                    type='amount'
                                    name='today'
                                    label='Today'
                                    placeholder='Amount'
                                    value={item?.market_value?.client?.today}
                                    handleChange={handleClientLandsChange}
                                />
                            </div>
                            {item.property_status_op === 'opposing_Party_view_differs' && (
                                <div className='inputs inputs-4 pt-4 pt-xl-0'>
                                    <label className='form-label mb-0'>
                                        Market value (Opposing Party)
                                    </label>
                                    <InputCustom
                                        type='amount'
                                        name='on_date_of_marriage'
                                        label='on Date of marriage'
                                        placeholder='Amount'
                                        labelClassNames={'d-xl-none'}
                                        value={item?.market_value?.opposing_party?.on_date_of_marriage}
                                        handleChange={handleOpposingPartyLandsChange}
                                    />
                                    <InputCustom
                                        type='amount'
                                        name='on_valuation_date'
                                        label='on Valuation date'
                                        placeholder='Amount'
                                        labelClassNames={'d-xl-none'}
                                        value={item?.market_value?.opposing_party?.on_valuation_date}
                                        handleChange={handleOpposingPartyLandsChange}
                                    />
                                    <InputCustom
                                        type='amount'
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
            <div className='action'>
                <button
                    className='btn btn-link'
                    onClick={() => {
                        setFormData([
                            ...formData,
                            {
                                type: 'lands',
                                nature_and_type_of_ownership: '',
                                address_of_property: '',
                                property_status: '',
                                market_value: {
                                    client: {
                                        on_date_of_marriage: '',
                                        on_valuation_date: '',
                                        today: '',
                                        role: 'client'
                                    },
                                    opposing_party: {
                                        on_date_of_marriage: '',
                                        on_valuation_date: '',
                                        today: '',
                                        role: 'opposingParty'
                                    }
                                }
                            }
                        ])
                    }}
                >
                    Add Land
                </button>
            </div>
        </div>
    )
}

export default OtherProperty

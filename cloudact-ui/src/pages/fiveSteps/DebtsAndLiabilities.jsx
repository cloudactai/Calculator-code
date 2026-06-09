import { useState, useEffect } from 'react'

import objectProcessor from "../../utils/helpers/object-processing/objectProcessor";
import { Accordion } from "react-bootstrap";
import InputCustom from "../../components/InputCustom";

import debts_and_liabilities from "../../assets/images/debts_and_liabilities.svg";
import CustomDropDown from '../../components/Matters/Form/CustomDropdown';
import { debtsDetails } from '../../utils/matterData/categoryData';

const DebtsAndLiabilities = ({ DebtsAndLiabilitiesData }) => {
    const [formData, setFormData] = useState([
        {
            category: "",
            details: "",
            on_date_of_marriage: "",
            on_valuation_date: "",
            today: "",
        }
    ])

    const handleChange = (e, index) => {

        const newFormData = [...formData]
        newFormData[index][e.target.name] = e.target.value
    
        setFormData(newFormData)
      }

    const handleAmountChange = (e,index) => {
        

        const newFormData = [...formData]
        newFormData[index][e.target.name] = e.target.value

        setFormData(newFormData)
    }

    const handleCategoryTypeChange = (e, li,index) => {

        const newFormData = [...formData]
        newFormData[index]['category'] = li.value
        setFormData(newFormData)
    
    
      }

    const [progress, setProgress] = useState(0);

    const calculateProgress = () => {
        let progress = 0;

        let fields = 0;
        let fieldsFilled = 0;

        ({ fields, fieldsFilled } = objectProcessor(formData));

        progress += (fieldsFilled / fields) * 100;

        progress = Math.round(progress);

        setProgress(progress);
    };

    const [isOpen, setIsOpen] = useState(false);

    const handleAccordionStatus = (e) => {
        setIsOpen(!isOpen);
        // 
    };

    useEffect(() => {
        calculateProgress();
        DebtsAndLiabilitiesData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        });
    }, [formData, progress, isOpen]);

    return (
        <Accordion.Item eventKey={8}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={debts_and_liabilities} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Debts and Liabilities</div>
                        <div>{progress}%</div>
                    </div>
                    <div className={`progress-bar ${progress === 100 ? 'done' : ''}`} style={{ "--progress-width": `${progress}%` }}></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="pb-50px">

                    {formData.map((item, index) => {
                        return (
                                <div className="inputs-group pb-10px">
                                     <div className="body">
                                    <div className="inputs-row no-action pb-10px" data-key={index} key={index}>
                                        <div className="inputs inputs-4">
                                            <label className="form-label mb-0">Category</label>
                                            <CustomDropDown
                                                 handleChange={(e,li) => handleCategoryTypeChange(e,li,index) }
                                                // handleChange={(e, li) =>
                                                //     // setFormData({
                                                //     //     ...formData,
                                                //     //     category: li.value
                                                //     // })
                                                // }
                                                list={debtsDetails}
                                                curListItem={item.category}
                                            />
                                        </div>
                                    </div>
                                    <div className="inputs-row no-action pb-50px">
                                        <div className="inputs inputs-4">
                                            <label className="form-label mb-0">Details</label>
                                            <InputCustom
                                                type="text"
                                                placeholder="Details"
                                                name="details"
                                                value={item.details}
                                                handleChange={(e) => handleChange(e,index)}
                                            />
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
                                                placeholder="N/A"
                                                value={item.on_date_of_marriage}
                                                handleChange={(e) => handleAmountChange(e,index)}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="on_valuation_date"
                                                label="on Valuation date"
                                                placeholder="N/A"
                                                value={item.on_valuation_date}
                                                handleChange={(e) => handleAmountChange(e,index)}
                                            />
                                            <InputCustom
                                                type="text"
                                                name="today"
                                                label="Today"
                                                placeholder="N/A"
                                                value={item.today}
                                                handleChange={(e) => handleAmountChange(e,index)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="action">
                        <button className="btn btn-link" onClick={() => {
                            setFormData([
                                ...formData,
                                {
                                    category: "",
                                    details: "",
                                    on_date_of_marriage: "",
                                    on_valuation_date: "",
                                    today: "",
                                }
                            ])
                        }}>Add Liability</button>
                    </div>
                </div>
            </Accordion.Body>
        </Accordion.Item>
    )
}

export default DebtsAndLiabilities
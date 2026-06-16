import { useState, useEffect } from 'react'

import objectProcessor from "../../utils/helpers/object-processing/objectProcessor";
import { Accordion } from "react-bootstrap";
import InputCustom from "../../components/InputCustom";

import assets from "../../assets/images/assets.svg";
import Land from './AssetForms/Land';
import GeneralHouseholdItemsAndVehicles from './AssetForms/GeneralHouseholdItemsAndVehicles';
import BankAccountsSavingsSecuritiesPension from './AssetForms/BankAccountsSavingsSecuritiesPension';
import LifeAndDisabilityInsurance from './AssetForms/LifeAndDisabilityInsurance';
import BusinessInterest from './AssetForms/BusinessInterest';
import MoneyOwedToYou from './AssetForms/MoneyOwedToYou';
import OtherProperty from './AssetForms/OtherProperty';

const Assets = ({ AssetsData }) => {

    const [formData, setFormData] = useState({
        valuation_date: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }))


    }

    const landData = (data) => {
        setFormData({
            ...formData,
            lands: data
        });


    }

    const generalHouseholdItemsAndVehiclesData = (data) => {
        setFormData({
            ...formData,
            general_household_items_and_vehicles: data
        });


    }

    const BankAccountsSavingsSecuritiesPensionData = (data) => {
        setFormData({
            ...formData,
            bank_accounts_savings_securities_pension: data
        });


    }

    const LifeAndDisabilityInsuranceData = (data) => {
        setFormData({
            ...formData,
            life_and_disability_insurance: data
        });


    }

    const BusinessInterestData = (data) => {
        setFormData({
            ...formData,
            business_interest: data
        });


    }

    const MoneyOwedToYouData = (data) => {
        setFormData({
            ...formData,
            money_owed_to_you: data
        });


    }

    const OtherPropertyData = (data) => {
        setFormData({
            ...formData,
            other_property: data
        });


    }

    const [progress, setProgress] = useState(0);

    const calculateProgress = () => {
        let progress = 0;

        let fields = 0;
        let fieldsFilled = 0;

        ({ fields, fieldsFilled } = objectProcessor(formData));

        // 
        // 

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
        AssetsData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        });
    }, [formData, progress, isOpen]);

    return (
        <Accordion.Item eventKey={7}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={assets} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Assets</div>
                        <div>{progress}%</div>
                    </div>
                    <div className={`progress-bar ${progress === 100 ? 'done' : ''}`} style={{ "--progress-width": `${progress}%` }}></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="pb-30px">
                    <div className="inputs-row">
                        <div className="inputs inputs-4">
                            <label className="form-label mb-0">
                                Valuation date
                            </label>
                            <InputCustom
                                type="date"
                                placeholder="Choose Date"
                                name="valuation_date"
                                value={formData.valuation_date}
                                handleChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <Land landData={landData} />

                <GeneralHouseholdItemsAndVehicles generalHouseholdItemsAndVehiclesData={generalHouseholdItemsAndVehiclesData} />

                <BankAccountsSavingsSecuritiesPension BankAccountsSavingsSecuritiesPensionData={BankAccountsSavingsSecuritiesPensionData} />

                <LifeAndDisabilityInsurance LifeAndDisabilityInsuranceData={LifeAndDisabilityInsuranceData} />

                <BusinessInterest BusinessInterestData={BusinessInterestData} />

                <MoneyOwedToYou MoneyOwedToYouData={MoneyOwedToYouData} />

                <OtherProperty OtherPropertyData={OtherPropertyData} />

            </Accordion.Body>
        </Accordion.Item>
    )
}

export default Assets
import { useEffect, useState } from 'react'

import InputCustom from "../../components/InputCustom";

import Land from './AssetForms/Land';
import GeneralHouseholdItemsAndVehicles from './AssetForms/GeneralHouseholdItemsAndVehicles';
import BankAccountsSavingsSecuritiesPension from './AssetForms/BankAccountsSavingsSecuritiesPension';
import LifeAndDisabilityInsurance from './AssetForms/LifeAndDisabilityInsurance';
import BusinessInterest from './AssetForms/BusinessInterest';
import MoneyOwedToYou from './AssetForms/MoneyOwedToYou';
import OtherProperty from './AssetForms/OtherProperty';
import { AssetsData } from '../../utils/Apis/matters/CustomHook/DocumentViewDataUpdate';
import Loader from '../../components/Loader';

const AssetsSimple = ({ matterId, onUpdateFormData, matterData }) => {

    const { selectAssetsData, selectAssetsDataLoading, selectAssetsDataError } = AssetsData(matterId)

    useEffect(() => {

        if (selectAssetsData && !selectAssetsDataLoading) {
            setFormData(prevFormData => ({
                ...prevFormData,
                ...selectAssetsData.body
            }));
        }
    }, [selectAssetsDataLoading, selectAssetsData]);

    const [formData, setFormData] = useState({
        valuation_date: matterData.valuation_date,
    });
    console.log("🚀 ~ AssetsSimple ~ formData:", formData.business_interest)

    useEffect(() => {
        onUpdateFormData({
            type: 'assets',
            assets:
                formData,
        })
    }, [formData])



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

    return (
        <>
            {selectAssetsDataLoading ? (
                <Loader isLoading={selectAssetsDataLoading} />
            ) : (
                <div className="accordion-body">
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
                    {formData && (
                        <>
                            <Land landData={landData} assetsData={formData.lands} />

                            <GeneralHouseholdItemsAndVehicles generalHouseholdItemsAndVehiclesData={generalHouseholdItemsAndVehiclesData} assetsData={formData.general_household_items_and_vehicles} />

                            <BankAccountsSavingsSecuritiesPension BankAccountsSavingsSecuritiesPensionData={BankAccountsSavingsSecuritiesPensionData} assetsData={formData.bank_accounts_savings_securities_pension} />

                            <LifeAndDisabilityInsurance LifeAndDisabilityInsuranceData={LifeAndDisabilityInsuranceData} assetsData={formData.life_and_disability_insurance} />

                            <BusinessInterest BusinessInterestData={BusinessInterestData} assetsData={formData.business_interest} />

                            <MoneyOwedToYou MoneyOwedToYouData={MoneyOwedToYouData} assetsData={formData.money_owed_to_you} />

                            <OtherProperty OtherPropertyData={OtherPropertyData} assetsData={formData.other_property} />
                        </>
                    )}

                </div>
            )}
        </>
    )
}

export default AssetsSimple
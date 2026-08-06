import { useState, useEffect } from 'react'

import InputCustom from "../../components/InputCustom";
import CourtNameSelect from "../../components/Matters/Form/CourtNameSelect";

import { CourtData } from '../../utils/Apis/matters/CustomHook/CourtData';
import Loader from '../../components/Loader'
import { getCurrentUserFromCookies } from '../../utils/helpers';
import { matterProvinceCode } from '../../utils/matterProvince';

const CourtInformationSimple = ({ matterId, onUpdateFormData, matterData }) => {

    const [loading, setLoading] = useState(true)
    const { selectCourt, selectCourtLoading } = CourtData(matterId)

    useEffect(() => {
        if (selectCourt && !selectCourtLoading) {
            const courtData = selectCourt?.body[0]
            setFormData({
                id: courtData?.id || '',
                name: courtData?.court_name || '',
                fileNumber: courtData?.file_number || '',
                address: courtData?.address || '',
            })
            setLoading(false)
        }
    }, [selectCourt, loading])

    const [formData, setFormData] = useState({
        name: "",
        fileNumber: "",
        address: "",
    });

    useEffect(() => {
        onUpdateFormData({
            type: 'courtInfo',
            courtInfo: formData,
        })
    }, [formData])

    const handleFormDataChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    }

    // Picking a directory court fills its name and auto-populates the address.
    // A custom (non-directory) court keeps whatever address was already typed.
    const handleCourtSelect = ({ name, court }) => {
        setFormData((prev) => ({
            ...prev,
            name,
            address: court ? court.address : prev.address,
        }));
    }

    return (
        <>
            {loading ? (
                <Loader isLoading={loading} />
            ) : (
                <div className="accordion-body">
                    <div className="row matterType">
                        <div className="col-12 col-xl-4">
                            <div className="form-group">
                                <label className="form-label">Name*</label>
                                <CourtNameSelect
                                    value={formData.name}
                                    province={matterProvinceCode(matterData, getCurrentUserFromCookies()?.province)}
                                    onChange={handleCourtSelect}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-xl-4">
                            <InputCustom
                                label="File Number"
                                type="text"
                                placeholder="Enter File Number"
                                name="fileNumber"
                                value={formData.fileNumber}
                                handleChange={handleFormDataChange}
                            />
                        </div>
                        <div className="col-12 col-xl-4">
                            <InputCustom
                                label="Address"
                                type="text"
                                placeholder="Enter Address"
                                name="address"
                                value={formData.address}
                                handleChange={handleFormDataChange}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default CourtInformationSimple 
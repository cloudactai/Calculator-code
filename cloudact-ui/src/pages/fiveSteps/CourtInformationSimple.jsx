import { useState, useEffect } from 'react'

import InputCustom from "../../components/InputCustom";

import { CourtData } from '../../utils/Apis/matters/CustomHook/CourtData';
import Loader from '../../components/Loader'

const CourtInformationSimple = ({ matterId, onUpdateFormData }) => {

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
                                <InputCustom
                                    type="text"
                                    placeholder="Enter Court Name"
                                    name="name"
                                    value={formData.name}
                                    handleChange={handleFormDataChange}
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
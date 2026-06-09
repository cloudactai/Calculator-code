import { useState, useEffect } from 'react'

import InputCustom from "../../components/InputCustom";

import { useDispatch, useSelector } from 'react-redux';
import { getAllCourts } from '../../utils/Apis/matters/getCourts/getCourtsActions';
import { selectCourtsData } from '../../utils/Apis/matters/getCourts/getCourtsSelectors';
import CustomDropDown from '../../components/Matters/Form/CustomDropdown';
import { CourtData } from '../../utils/Apis/matters/CustomHook/CourtData';
import Loader from '../../components/Loader'

const CourtInformationSimple = ({ matterId, onUpdateFormData, matterData }) => {

    const dispatch = useDispatch();

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

    useEffect(() => {
        if (matterData) {
            dispatch(getAllCourts(matterData?.province))
        }
    }, [matterData])

    const courtsData = useSelector(selectCourtsData);

    const courtsList = courtsData?.body.map(item => {
        let data = {
            name: item.court_name,
            value: item.id,
        }
        return data;
    });


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

    const handleSelectChange = (e) => {

        let address = courtsData?.body.find(court => court.court_name === e.name)

        setFormData({
            ...formData,
            name: e.name,
            address: address.address_1 + ', ' + address.address_2
        })

    }

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
                                <CustomDropDown
                                    list={courtsList}
                                    handleChange={(e, li) => handleSelectChange(li)}
                                    curListItem={formData.name}
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
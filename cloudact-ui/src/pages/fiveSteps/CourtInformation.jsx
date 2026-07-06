import { useState, useEffect } from 'react'

import { Accordion } from "react-bootstrap";
import InputCustom from "../../components/InputCustom";

import court_information from "../../assets/images/court_information.svg";
import { useDispatch, useSelector } from 'react-redux';
import { getAllCourts } from '../../utils/Apis/matters/getCourts/getCourtsActions';
import { selectCourtsData } from '../../utils/Apis/matters/getCourts/getCourtsSelectors';
import CustomDropDown from '../../components/Matters/Form/CustomDropdown';

const CourtInformation = ({ CourtInformationData, MatterData }) => {

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAllCourts(MatterData?.province))
    },[])

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

        // 
    }

    const [progress, setProgress] = useState(0);

    const calculateProgress = () => {
        let progress = 0;

        let fields = 0;
        let fieldsFilled = 0;

        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                fields++;
                if (formData[key] !== "") {
                    fieldsFilled++;
                }
            }
        }

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
        CourtInformationData({
            progress: progress,
            data: formData,
            isOpen: isOpen
        });
    }, [formData, progress, isOpen]);



    return (
        <Accordion.Item eventKey={1}>
            <Accordion.Header onClick={handleAccordionStatus}>
                <img src={court_information} alt="" />
                <div className="w-100 px-2" style={{ marginRight: "8%" }}>
                    <div className="d-flex justify-content-between">
                        <div>Court information</div>
                        <div>{progress}%</div>
                    </div>
                    <div className={`progress-bar ${progress === 100 ? 'done' : ''}`} style={{ "--progress-width": `${progress}%` }}></div>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                <div className="row d-flex flex-row pb-4">
                    <div className="col-12 col-xl-4">
                        <div className="form-group">
                            <label className="form-label">Name*</label>
                            <CustomDropDown
                                list={courtsList}
                                handleChange={(e, li) => handleSelectChange(li)}
                                curListItem={formData.name}
                            />
                            {/* <Dropdown
                                handleChange={(e, li) => setFormData({
                                    ...formData,
                                    name: li.name,
                                })}
                                list={namesList}
                                curListItem={formData.name}
                            ></Dropdown> */}
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

            </Accordion.Body>
        </Accordion.Item>
    )
}

export default CourtInformation 
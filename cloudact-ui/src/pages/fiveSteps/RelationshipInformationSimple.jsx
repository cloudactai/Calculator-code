import { useEffect, useState } from 'react'

import Dropdown from "../../components/Matters/Form/Dropdown";
import InputCustom from "../../components/InputCustom";
import Loader from '../../components/Loader'
import { RelationshipData } from '../../utils/Apis/matters/CustomHook/DocumentViewDataUpdate';

const RelationshipInformationSimple = ({matterId, onUpdateFormData}) => {

    // const { selectRelationship,selectRelationshipLoading, selectBackgroundLoading } = useSingleMatterData(matterId);
    const {selectRelationship, selectRelationshipLoading} = RelationshipData(matterId)
    
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if(selectRelationship){
            setFormData({
                id: selectRelationship?.body[0]?.id || '',
                dateOfMarriage: selectRelationship?.body[0]?.dateOfMarriage || '',
                placeOfMarriage: selectRelationship?.body[0]?.placeOfMarriage || '',
                startedLivingTogether: selectRelationship?.body[0]?.startedLivingTogether || '',
                neverLivedTogether: selectRelationship?.body[0]?.neverLivedTogether || '',
                dateOfSeparation: selectRelationship?.body[0]?.dateOfSeparation || '',
                stillLivingTogether: selectRelationship?.body[0]?.stillLivingTogether === 0 ? 'Yes' : 'No',
            })
        }
        if(selectRelationshipLoading) setIsLoading(true);
        if(!selectRelationshipLoading) setIsLoading(false);

    }, [selectRelationshipLoading,selectRelationship])

   
    const [formData, setFormData] = useState({
        id: '',
        dateOfMarriage: '',
        placeOfMarriage: '',
        startedLivingTogether: '',
        neverLivedTogether: '',
        dateOfSeparation: '',
        stillLivingTogether: '',
    });


    useEffect(() => {
        onUpdateFormData({
          type: 'relationship',
          relationship: {
            data: formData
          },
        })
      },[formData,onUpdateFormData])

    const handleFormDataChange = (e) => {

        setFormData({
           
            
            ...formData,
            [e.target.name]: e.target.value,
        });
    }

    const yesNoList = [
        {
            name: "Yes",
            value: "Yes",
        },
        {
            name: "No",
            value: "No",
        },
    ];

    return (
       <>
        {isLoading ? (
          <Loader isLoading={isLoading} />
        ) : (
        <div className="accordion-body">
        <div className="row pb-4 matterType">
            <div className="inputs-group pb-10px pt-4">
                <div className="inputs-row labeled pb-10px">
                    <div className="inputs inputs-2-3">
                        <label className="form-label mb-0">
                            Date of Marriage*
                        </label>
                        <InputCustom
                            type="date"
                            placeholder="Choose Date"
                            name="dateOfMarriage"
                            value={formData.dateOfMarriage}
                            handleChange={handleFormDataChange}
                        />
                    </div>
                    <div className="inputs inputs-2-3">
                        <label className="form-label mb-0">
                            Place of Marriage
                        </label>
                        <InputCustom
                            type="test"
                            placeholder="Enter Address"
                            name="placeOfMarriage"
                            value={formData.placeOfMarriage}
                            handleChange={handleFormDataChange}
                        />
                    </div>
                </div>

                <div className="inputs-row labeled pb-10px">
                    <div className="inputs inputs-2-3">
                        <label className="form-label mb-0">
                            Started Living Together*
                        </label>
                        <InputCustom
                            type="date"
                            placeholder="Choose Date"
                            name="startedLivingTogether"
                            value={formData.startedLivingTogether}
                            handleChange={handleFormDataChange}
                        />
                    </div>
                    <div className="inputs inputs-2-3">
                        <label className="form-label mb-0">
                            Never Lived Together
                        </label>
                        <Dropdown
                            handleChange={(e, li) => setFormData({
                                ...formData,
                                neverLivedTogether: li.value,
                            })}
                            list={yesNoList}
                            curListItem={formData.neverLivedTogether}
                        ></Dropdown>
                    </div>
                </div>

                <div className="inputs-row labeled pb-20px">
                    <div className="inputs inputs-2-3">
                        <label className="form-label mb-0">
                            Date of Separation
                        </label>
                        <InputCustom
                            type="date"
                            placeholder="Enter Date"
                            name="dateOfSeparation"
                            value={formData.dateOfSeparation}
                            handleChange={handleFormDataChange}
                        />
                    </div>
                    <div className="inputs inputs-2-3">
                        <label className="form-label mb-0">
                            Still Living Together
                        </label>
                        <Dropdown
                            handleChange={(e, li) => setFormData({
                                ...formData,
                                stillLivingTogether: li.value,
                            })}
                            list={yesNoList}
                            curListItem={formData.stillLivingTogether}
                        ></Dropdown>
                    </div>
                </div>
            </div>
        </div>
        </div>
        )
    }
        </>

    )
}

export default RelationshipInformationSimple
import { useSelector } from "react-redux";
import Accordion from 'react-bootstrap/Accordion';

import Layout from "../../components/LayoutComponents/Layout";
import InputCustom from "../../components/InputCustom";
import CustomCheckbox from "../../components/Matters/Form/CustomCheckbox";
import { Link } from "react-router-dom";

const FillInformation = ({ currentUserRole }) => {
    const { response } = useSelector((state) => state.userProfileInfo);

    return (
        <Layout title={`Welcome ${response?.username ? response.username : ""} `}>
            <div className="fill-information-page panel trans">

                <div className="pBody">

                    <div className="row">
                        <div className="col-md-9">
                            <Accordion defaultActiveKey="0">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>Category of information 1</Accordion.Header>
                                    <Accordion.Body>
                                        <div className="inputs-row">
                                            <div className="inputs">
                                                <div className="form-group">
                                                    <InputCustom
                                                        type="text"
                                                        name="monthlyAmount"
                                                        label="Monthly Amount"
                                                        value={''}
                                                        handleChange={() => console.log("DOne")}
                                                    />
                                                </div>
                                                <InputCustom
                                                    type="text"
                                                    name="monthlyAmount"
                                                    label="Monthly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />
                                                <InputCustom
                                                    type="text"
                                                    name="yearlyAmount"
                                                    label="Yearly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />

                                                <div className="form-group">
                                                    <InputCustom
                                                        type="text"
                                                        name="monthlyAmount"
                                                        label="Monthly Amount"
                                                        value={''}
                                                        handleChange={() => console.log("DOne")}
                                                    />
                                                </div>
                                                <InputCustom
                                                    type="text"
                                                    name="monthlyAmount"
                                                    label="Monthly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />
                                                <InputCustom
                                                    type="text"
                                                    name="yearlyAmount"
                                                    label="Yearly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />
                                            </div>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="1">
                                    <Accordion.Header>Category of information 2</Accordion.Header>
                                    <Accordion.Body>
                                        <div className="inputs-row">
                                            <div className="inputs">
                                                <div className="form-group">
                                                    <InputCustom
                                                        type="text"
                                                        name="monthlyAmount"
                                                        label="Monthly Amount"
                                                        value={''}
                                                        handleChange={() => console.log("DOne")}
                                                    />
                                                </div>
                                                <InputCustom
                                                    type="text"
                                                    name="monthlyAmount"
                                                    label="Monthly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />
                                                <InputCustom
                                                    type="text"
                                                    name="yearlyAmount"
                                                    label="Yearly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />

                                                <div className="form-group">
                                                    <InputCustom
                                                        type="text"
                                                        name="monthlyAmount"
                                                        label="Monthly Amount"
                                                        value={''}
                                                        handleChange={() => console.log("DOne")}
                                                    />
                                                </div>
                                                <InputCustom
                                                    type="text"
                                                    name="monthlyAmount"
                                                    label="Monthly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />
                                                <InputCustom
                                                    type="text"
                                                    name="yearlyAmount"
                                                    label="Yearly Amount"
                                                    value={''}
                                                    handleChange={() => console.log("DOne")}
                                                />
                                            </div>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </div>
                        <div className="col-md-3">
                            <div className="page-sidebar">
                                <div className="head">List of Forms</div>
                                <div className="body">
                                    <div className="content">
                                        <CustomCheckbox label={"Form 13.1"} checked={false} />
                                        <CustomCheckbox label={"Form 8"} checked={true} />
                                        <CustomCheckbox label={"Form 36"} checked={true} />
                                    </div>
                                    <div className="actions">
                                        <Link to="/forms/create-new" className="btn btnPrimary rounded-pill">Back</Link>
                                        <Link to="/forms/create-new/fill-pdf" className="btn btnPrimary rounded-pill">Next</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modals */}

                </div>
            </div>
        </Layout >
    );
};



export default FillInformation;

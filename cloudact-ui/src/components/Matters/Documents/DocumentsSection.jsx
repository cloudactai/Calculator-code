import { useEffect, useState, useCallback } from 'react'

import { useDropzone } from 'react-dropzone';
import { Table } from "react-bootstrap";
import Accordion from 'react-bootstrap/Accordion';
import { useAccordionButton } from 'react-bootstrap/AccordionButton';

import CustomCheckbox from '../Form/CustomCheckbox';
import GeneralModal from '../Modals/GeneralModal';

import add_folder_linear from "../../../assets/images/add_folder_linear.svg";
import folder from "../../../assets/images/folder.svg";
import upload from "../../../assets/images/upload.svg";

function MyDropzone() {
    const onDrop = useCallback(acceptedFiles => {
        // Do something with the files
    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    return (
        <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>Drop the files here ...</p> :
                    <>
                        <img className="icon" src={folder} alt="folder" />
                        <p className="label">Drag your document here to start uploading</p>
                        <div className="divider">
                            <span>OR</span>
                        </div>
                        <button className="btn btnDefault blue">Browse Files</button>
                    </>
            }
        </div>
    )
}

const DocumentsSection = ({ files, formsData }) => {
    const [showAddFormModal, setShowAddFormModal] = useState(false);
    const [showUploadFormModal, setShowUploadFormModal] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const [forms, setForms] = useState([
        {
            category: "Divorce",
            icon: add_folder_linear,
            forms: [
                {
                    title: "Divorce with Children, support and property issues",
                    id: "DIVORCE_FORM_2",
                    checked: false,
                },
                {
                    title: "Enforcement of support agreement",
                    id: "DIVORCE_FORM_3",
                    checked: false,
                },
                {
                    title: "Answering family law application",
                    id: "DIVORCE_FORM_4",
                    checked: false,
                },
                {
                    title: "Replying to an answer",
                    id: "DIVORCE_FORM_5",
                    checked: false,
                },
                {
                    title: "Case conference",
                    id: "DIVORCE_FORM_6",
                    checked: false,
                },
                {
                    title: "Settlement conference",
                    id: "DIVORCE_FORM_7",
                    checked: false,
                },
                {
                    title: "Making and responding to motion",
                    id: "DIVORCE_FORM_8",
                    checked: false,
                },
                {
                    title: "Completing a net family property forms",
                    id: "DIVORCE_FORM_9",
                    checked: false,
                },
            ],
        },
        {
            category: "Adoption",
            icon: add_folder_linear,
            forms: [
                {
                    title: "Adoption",
                    id: "ADOPTION_FORM_1",
                    checked: false,
                },
                {
                    title: "Adoption 2",
                    id: "ADOPTION_FORM_2",
                    checked: false,
                },
                {
                    title: "Adoption 3",
                    id: "ADOPTION_FORM_3",
                    checked: false,
                },
            ],
        },
        {
            category: "Child Protection",
            icon: add_folder_linear,
            forms: [
                {
                    title: "Child Protection",
                    id: "CHILD_PROTECTION_FORM_1",
                    checked: false,
                },
                {
                    title: "Child Protection 2",
                    id: "CHILD_PROTECTION_FORM_2",
                    checked: false,
                },
                {
                    title: "Child Protection 3",
                    id: "CHILD_PROTECTION_FORM_3",
                    checked: false,
                },
            ],
        }]);

    const handleContinueAddForm = () => {
        setShowAddFormModal(false);
        formsData(forms);

        // set all forms to unchecked
        const newForms = [...forms];
        newForms.forEach((category) => {
            category.forms.forEach((form) => {
                form.checked = false;
            });
        });
    }

    return (
        <div className="forms-container mt-4">
            <div className="info">
                <div className="title">2. Documents upload</div>
                <div className="description">Please upload the following documents</div>
            </div>
            <div className="documents-table">
                <Table
                    hover
                    className="reports-table reports-table-primary"
                >
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Created On</th>
                            <th>Status</th>
                            <th>Attached To</th>
                            <th>Document ID</th>
                            <th>Sign off</th>
                        </tr>
                    </thead>
                    <tbody>

                        {files.map((file, index) => (
                            <tr key={index}>
                                <td className="folder file">
                                    <CustomCheckbox label={file.title} />
                                </td>
                                <td>{file.createdOn}</td>
                                <td>
                                    <span className="icon">
                                        {file.status}
                                        <span className="upload-icon" style={{ backgroundImage: `url(${upload})` }} />
                                    </span>
                                </td>
                                <td>Background</td>
                                <td>{file.docId}</td>
                                <td>{file.signOff}</td>
                            </tr>
                        ))}

                    </tbody>
                </Table>
            </div>
            <div className="document-actions">
                <span className="statusBadge" onClick={() => setShowUploadFormModal(true)}>Add Documents</span>
            </div>

            {/* BEGIN::Modals */}

            {/* BEGIN::Add Forms Modal */}
            <GeneralModal
                show={showAddFormModal}
                changeShow={() => setShowAddFormModal(false)}
                handleClick={() => setShowAddFormModal(false)}
                action=""
                // handleContinue={(state) => handleContinue(state)}
                handleContinue={() => handleContinueAddForm()}
                heading="Please select workflow"
                size="sm"
                dialogClassName={"summaryModal"}
                actions={
                    [
                        {
                            label: "Continue",
                            class: "btn btnPrimary rounded-pill",
                            action: () => handleContinueAddForm(),
                        },
                    ]
                }
            >
                <div className="add-forms-modal-body">
                    <Accordion defaultActiveKey="0" flush>

                        {forms.map((form, index) => (
                            <Accordion.Item eventKey={index} key={index}>
                                <Accordion.Header>
                                    <span className="folder-icon" style={{ backgroundImage: `url(${form.icon})` }} />
                                    <span className="folder-name">{form.category}</span>
                                </Accordion.Header>
                                <Accordion.Body>
                                    {form.forms.map((form, index_form) => (
                                        <div className="form-checkbox" key={`${index}-${index_form}`} onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();

                                            const newForms = [...forms];
                                            newForms[index].forms[index_form].checked = !newForms[index].forms[index_form].checked;
                                            setForms(newForms);
                                        }}>
                                            <CustomCheckbox label={form.title} checked={form.checked} />
                                        </div>
                                    ))}
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}

                    </Accordion>
                </div>

            </GeneralModal>
            {/* END::Add Forms Modal */}

            {/* BEGIN::Upload Forms Modal */}
            <GeneralModal
                show={showUploadFormModal}
                changeShow={() => setShowUploadFormModal(false)}
                handleClick={() => setShowUploadFormModal(false)}
                action=""
                // handleContinue={(state) => handleContinue(state)}
                handleContinue={() => handleContinueAddForm()}
                heading="Add File"
                size="sm"
                dialogClassName={"summaryModal upload-forms-modal"}
                actions={
                    [
                        {
                            label: "Confirm",
                            class: "btn btnDefault border-2",
                            action: () => handleContinueAddForm(),
                        },
                    ]
                }
            >
                <div className="upload-forms-modal-body">
                    <div className="form-group">
                        <label>Name the Document</label>
                        <input type="text" className="form-control" placeholder="Enter Document Name" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} />
                    </div>

                    <MyDropzone />
                </div>

            </GeneralModal>
            {/* END::Upload Forms Modal */}

            {/* END::Modals */}
        </div>
    )
}

export default DocumentsSection
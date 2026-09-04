import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import documents from '../../assets/images/documents.svg'
import AllFolders from './Folders/AllFolders';
import GeneralModal from './Modals/GeneralModal';
import CalculationPDf from './Documents/CalculationPdf';
import { formsService } from '../../services/formsService';
import { agreementsService } from '../../services/agreementsService';
import { downloadBlob } from '../../utils/downloadBlob';

// A folder holds two different kinds of document: form documents
// (MatterFormDocument, listed by formsService) and generated agreements
// (MatterAgreementDocument, listed by agreementsService). They live in
// separate tables and separate routes, so both have to be asked for — listing
// forms alone is what made the "Separation Agreements" folder read as empty
// right after a separation agreement was generated into it.
const LOAD_FAILED = Symbol('load failed');

export function MatterFormsList({ matterNumber, folderId }) {
    const history = useHistory();
    const [documents, setDocuments] = useState([]);
    const [agreements, setAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloadingId, setDownloadingId] = useState(null);

    const renameDocument = async (document) => {
        const name = window.prompt('Form name', document.file_name);
        if (!name?.trim() || name.trim() === document.file_name) return;
        try {
            await formsService.renameDocument(matterNumber, document.id, name.trim());
            setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, file_name: name.trim() } : item));
        } catch {
            setError('Could not rename this form.');
        }
    };

    const deleteDocument = async (document) => {
        if (!window.confirm(`Delete ${document.file_name}?`)) return;
        try {
            await formsService.deleteDocument(matterNumber, document.id);
            setDocuments((current) => current.filter((item) => item.id !== document.id));
        } catch {
            setError('Could not delete this form.');
        }
    };

    const downloadAgreement = async (agreement) => {
        setDownloadingId(agreement.id);
        try {
            const response = await agreementsService.downloadAgreementPdf(matterNumber, agreement.agreement_type);
            downloadBlob(new Blob([response.data], { type: 'application/pdf' }), agreement.file_name);
        } catch {
            setError('Could not download this agreement.');
        } finally {
            setDownloadingId(null);
        }
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        Promise.all([
            formsService.listDocuments(matterNumber, folderId).catch(() => LOAD_FAILED),
            agreementsService.listAgreements(matterNumber, folderId).catch(() => LOAD_FAILED),
        ])
            .then(([forms, generatedAgreements]) => {
                if (!active) return;
                if (forms === LOAD_FAILED && generatedAgreements === LOAD_FAILED) {
                    setError('Could not load this folder.');
                }
                setDocuments(forms === LOAD_FAILED ? [] : (forms || []));
                setAgreements(
                    generatedAgreements === LOAD_FAILED
                        ? []
                        : (generatedAgreements || []).filter((agreement) => agreement.has_pdf)
                );
            })
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [matterNumber, folderId]);

    if (loading) return <div className="description">Loading documents…</div>;
    if (error && !documents.length && !agreements.length) return <div className="description text-danger" role="alert">{error}</div>;
    if (!documents.length && !agreements.length) return <div className="description">Nothing has been created in this folder yet.</div>;

    return (
        <div className="documents-table mt-3">
            {error && <div className="description text-danger" role="alert">{error}</div>}
            <table className="table reports-table reports-table-primary">
                <thead><tr><th>Document</th><th>Status</th><th>Updated</th><th /></tr></thead>
                <tbody>
                    {agreements.map((agreement) => (
                        <tr key={`agreement-${agreement.id}`}>
                            <td>{agreement.file_name}</td>
                            <td>{String(agreement.status || '').replace(/_/g, ' ')}</td>
                            <td>{new Date(agreement.updated).toLocaleDateString()}</td>
                            <td className="d-flex gap-2">
                                <button
                                    className="btn btnPrimary rounded-pill"
                                    onClick={() => downloadAgreement(agreement)}
                                    disabled={downloadingId === agreement.id}
                                >
                                    {downloadingId === agreement.id ? 'Downloading…' : 'Download'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {documents.map((document) => (
                        <tr key={`form-${document.id}`}>
                            <td>{document.file_name}</td>
                            <td>{document.status.replace(/_/g, ' ')}</td>
                            <td>{new Date(document.updated).toLocaleDateString()}</td>
                            <td className="d-flex gap-2">
                                <button className="btn btnPrimary rounded-pill" onClick={() => history.push(`/matters/${encodeURIComponent(matterNumber)}/forms/${document.id}`)}>Open</button>
                                <button className="btn btnSecondary rounded-pill" onClick={() => renameDocument(document)}>Rename</button>
                                <button className="btn btnSecondary rounded-pill" onClick={() => deleteDocument(document)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function FolderStructure({ matter_id, matterData }) {
    console.log("🚀 ~ FolderStructure ~ matter_id:", matter_id)
    const [showAddFolderModal, setShowAddFolderModal] = useState(false)
    const [validationError, setValidationError] = useState(false)
    const history = useHistory();
    const [newFolderName, setNewFolderName] = useState('')

    useEffect(() => {
        if (!matter_id) return;
        formsService.listFolders(matter_id)
            .then(async (result) => {
                const mapped = result.map((folder) => ({
                    title: folder.title, folder_id: folder.id, matter_id,
                    created: folder.createdAt || folder.created, type: folder.type,
                }));
                // Auto-create a "Calculations" folder if one doesn't exist
                const hasCalcFolder = mapped.some(
                    (f) => f.title === "Calculations" || f.title === "Saved Calculations"
                );
                if (!hasCalcFolder) {
                    try {
                        const folder = await formsService.createFolder(matter_id, "Calculations", "calculations");
                        mapped.unshift({
                            title: folder.title, folder_id: folder.id, matter_id,
                            created: folder.createdAt || folder.created, type: folder.type || "calculations",
                        });
                    } catch (err) {
                        console.warn("Could not auto-create Calculations folder:", err);
                    }
                }
                setFolders(mapped);
            })
            .catch(() => setFolders([]));
    }, [matter_id]);


    const handleBackDirClick = () => {
        setCurrentFolder(null);
    }


    const [folders, setFolders] = useState([]);


    const [currentFolder, setCurrentFolder] = useState(null);

    const handleFolderClick = (folder) => {
        console.log("🚀 ~ handleFolderClick ~ folder:", folder)
        setCurrentFolder(folder);
    };

    const handleAddFolder = () => {
        setShowAddFolderModal(true)
    };

    const handleAddFile = (folder) => {
        const fileName = prompt('Enter file name:');
        if (fileName) {
            const newFile = { name: fileName };
            folder.files.push(newFile);
            setFolders([...folders]);
        }
    };


    useEffect(() => {
        if (newFolderName !== '') {
            setValidationError({
                newFolderName: ''
            })
        }

        // If folderName already exists
        const folderExists = folders.filter(file => file.title === newFolderName)
        if (folderExists.length > 0) {
            setValidationError({
                newFolderName: 'Folder name already exists'
            })
        }
    }, [newFolderName])



    const handleContinue = async () => {
        // If folderName is empty
        if (newFolderName === '') {
            setValidationError({
                newFolderName: 'Folder name is required'
            })
            return
        }

        // If folderName already exists
        const folderExists = folders.filter(file => file.title === newFolderName)

        if (folderExists.length > 0) {
            setValidationError({
                newFolderName: 'Folder name already exists'
            })
            return
        }



        try {
            const folder = await formsService.createFolder(matter_id, newFolderName, 'Folder');
            setFolders((current) => [...current, {
                title: folder.title, folder_id: folder.id, matter_id,
                created: folder.createdAt || folder.created, type: folder.type,
            }]);
            setShowAddFolderModal(false);
            setNewFolderName('');
            setValidationError(false);
        } catch {
            setValidationError({ newFolderName: 'Could not create folder' });
        }



    }

    return (
        <div className='document-container'>
            <div className='head'>
                <img src={documents} alt='' />
                <div> Documents </div>{' '}
            </div>
            <div className='body'>
                {!currentFolder && (
                    <AllFolders dirState={folders} handleDirClick={handleFolderClick} />
                )}

        {currentFolder && (
          <>
            {currentFolder.title === "Calculations" || currentFolder.title === "Saved Calculations" ? (
              <>
                <div className="info">
                  <div className="breadcrumbs"> {currentFolder.title} </div>{" "}
                  <div className="description">
                    Review your saved calculation reports here.
                  </div>{" "}
                </div>
                <CalculationPDf matterId={matter_id} />
              </>
            ) : (
              <>
                <div className="info">
                  <div className="breadcrumbs"> {currentFolder.title} </div>{" "}
                  <div className="description">
                    {currentFolder.type === "agreements"
                      ? "Agreements generated for this matter are saved here."
                      : "Forms created for this matter are saved here."}
                  </div>{" "}
                </div>
                <MatterFormsList
                  matterNumber={matter_id}
                  folderId={currentFolder.id || currentFolder.folder_id}
                />
              </>
            )}
          </>
        )}
        <div className="actions">
          {currentFolder ? (
            <>
              <span
                className="btn btnPrimary rounded-pill"
                onClick={handleBackDirClick}
              >
                {" "}
                Back{" "}
              </span>
              {/* <span
                className="btn btnPrimary rounded-pill"
                onClick={handleBackDirClick}
              >
                Mark Workflow as completed{" "}
              </span> */}
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <span
              className="btn btnPrimary rounded-pill"
              onClick={() => {
                localStorage.setItem('selectedCalculatorMatterNumber', JSON.stringify(matter_id));
                history.push('/SupportCalculator', { from: 'matters'})
              }}
            >
              Open Calculator
            </span>

            <span
              className="btn btnPrimary rounded-pill"
              onClick={handleAddFolder}
            >
              Add New Folder
            </span>
          </div>
          )}
        </div>
      </div>
      {/* BEGIN :: Add Folder Modal */}{" "}
      <GeneralModal
        show={showAddFolderModal}
        changeShow={() => setShowAddFolderModal(false)}
        handleClick={() => setShowAddFolderModal(false)}
        action=""
        // handleContinue={(state) => handleContinue(state)}
        handleContinue={() => handleContinue()}
        heading="Add New Folder"
        size="sm"
        dialogClassName={"summaryModal"}
      >
        <div className="add-folder-modal">
          <div className="form-group mt-4">
            <label> Folder Name </label>{" "}
            <input
              type="text"
              className={`form-control ${
                validationError && validationError.newFolderName
                  ? "is-invalid"
                  : ""
              }`}
              placeholder="Enter Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            {validationError && validationError.newFolderName && (
              <div className="invalid-feedback">
                {" "}
                {validationError.newFolderName}{" "}
              </div>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </GeneralModal>{" "}
      {/* END :: Add Folder Modal */}
    </div>
  );
}

export default FolderStructure;

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import documents from '../../assets/images/documents.svg'
import AllFolders from './Folders/AllFolders';
import GeneralModal from './Modals/GeneralModal';
import CalculationPDf from './Documents/CalculationPdf';
import { formsService } from '../../services/formsService';

function MatterFormsList({ matterNumber, folderId }) {
    const history = useHistory();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        formsService.listDocuments(matterNumber, folderId)
            .then((result) => active && setDocuments(result))
            .catch(() => active && setError('Could not load forms in this folder.'))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [matterNumber, folderId]);

    if (loading) return <div className="description">Loading forms…</div>;
    if (error) return <div className="description text-danger" role="alert">{error}</div>;
    if (!documents.length) return <div className="description">No forms have been created in this folder yet.</div>;

    return (
        <div className="documents-table mt-3">
            <table className="table reports-table reports-table-primary">
                <thead><tr><th>Form</th><th>Status</th><th>Updated</th><th /></tr></thead>
                <tbody>
                    {documents.map((document) => (
                        <tr key={document.id}>
                            <td>{document.file_name}</td>
                            <td>{document.status.replace(/_/g, ' ')}</td>
                            <td>{new Date(document.updated).toLocaleDateString()}</td>
                            <td><button className="btn btnPrimary rounded-pill" onClick={() => history.push(`/matters/${encodeURIComponent(matterNumber)}/forms/${document.id}`)}>Open</button></td>
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
            .then((result) => setFolders(result.map((folder) => ({
                title: folder.title, folder_id: folder.id, matter_id,
                created: folder.createdAt || folder.created, type: folder.type,
            }))))
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
            {currentFolder.title != "Saved Calculations" ? (
              <>
                <div className="info">
                  <div className="breadcrumbs"> {currentFolder.title} </div>{" "}
                  <div className="description">
                    Forms created for this matter are saved here.
                  </div>{" "}
                </div>
                <MatterFormsList
                  matterNumber={matter_id}
                  folderId={currentFolder.id || currentFolder.folder_id}
                />
              </>
            ) : (
              <>
                <div className="info">
                  <div className="breadcrumbs"> {currentFolder.title} </div>{" "}
                  <div className="description">
                    Review your Saved Calculations here{" "}
                  </div>{" "}
                </div>
                <CalculationPDf
                  files={currentFolder.contents || []}
                  matterId={matter_id}
                  province={matterData?.province}
                  folder_id={currentFolder.id || currentFolder.folder_id}
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

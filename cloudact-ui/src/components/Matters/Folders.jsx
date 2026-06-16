import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import documents from '../../assets/images/documents.svg'
import { selectMatterFoldersData, selectMatterFoldersLoading } from '../../utils/Apis/matters/getMatterFolders/getMattersFoldersSelectors';
import { useDispatch, useSelector } from 'react-redux';
import AllFolders from './Folders/AllFolders';
import Forms from './Documents/Forms';
import { getUserSID } from '../../utils/helpers';
import { createMatterFiles } from '../../utils/Apis/matters/createMatterFiles/createMatterFilesActions';
import GeneralModal from './Modals/GeneralModal';
import { selectCreateFoldersData } from '../../utils/Apis/matters/createMatterFolders/createMatterFoldersSelectors';
import { createMatterFolder } from '../../utils/Apis/matters/createMatterFolders/createMatterFoldersActions';
import { getMatterFolders } from '../../utils/Apis/matters/getMatterFolders/getMattersFoldersActions';
import CalculationPDf from './Documents/CalculationPdf';

function FolderStructure({ matter_id, matterData }) {
    console.log("🚀 ~ FolderStructure ~ matter_id:", matter_id)
    const [showAddFolderModal, setShowAddFolderModal] = useState(false)
    const [validationError, setValidationError] = useState(false)
    const history = useHistory();
    // const selectFolders = useSelector(selectMatterFoldersData)
    const [newFolderName, setNewFolderName] = useState('')

    const dispatch = useDispatch();

    const selectFolders = useSelector(selectMatterFoldersData)
    const selectFolderLoading = useSelector(selectMatterFoldersLoading)


    useEffect(() => {
        if (!matter_id) {
            console.error("matter_id is missing:", matter_id);
            return;
        }
        console.log("Dispatching getMatterFolders with matter_id:", matter_id);
        dispatch(getMatterFolders(matter_id));
    }, [matter_id, dispatch]);


    const handleBackDirClick = () => {
        setCurrentFolder(null);
        setFolders(selectFolders.body)
    }


    useEffect(() => {
        if (selectFolders) {
            const selectedFolders = selectFolders?.body

            // const foldersData = selectedFolders.filter(item => item.type === 'Folder');
            const foldersData = selectedFolders.map(folder => (
                {
                    title: folder.title,
                    folder_id: folder.id,
                    matter_id: folder.matter_id,
                    created: folder.created,
                    type: folder.type,
                    contents: folder.contents

                }
            ));

            setFolders(foldersData);
        }
    }, [selectFolders, selectFolderLoading])


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


    const formsData = (data) => {
        const newDirStack = [currentFolder]

        data.forEach(category => {
            category.forms.forEach(form => {
                const fileExists = currentFolder.contents.filter(file => file.docId === form.docId);
                if (fileExists && form.checked) {
                    const folderID = currentFolder;

                    const newFileData = {
                        sid: getUserSID(),
                        matter_id: folderID.matter_id,
                        folder_id: folderID.folder_id || folderID.id,
                        file_name: form.file_name,
                        docId: form.docId,
                        status: 'Open',
                        type: 'form'
                    }

                    dispatch(createMatterFiles(newFileData));

                    const newFile = {
                        id: form.id,
                        title: form.title,
                        createdOn: new Date().toISOString(),                        
                        status: 'Open',
                        docId: form.docId,
                        file_name: form.file_name,
                        folder_id: folderID.folder_id || folderID.id,
                        signOff: 'NC, VL',
                        type: 'form'
                    }

                    console.log("🚀 ~ formsData ~ newFile:", newFile)

                    newDirStack[newDirStack.length - 1].contents.push(newFile)
                }
            })

        })

    }

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



        const newDirectory = {
            title: newFolderName,
            matter_id: matter_id,
            sid: getUserSID(),
            type: 'Folder'
        }

        await dispatch(createMatterFolder(newDirectory))

        setShowAddFolderModal(false)

        const newDir = {
            title: newFolderName,
            folder_id: selectFolder?.body?.folder_id,
            matter_id: matter_id,
            created: '',
            type: 'Folder',
            contents: []
        }

        setFolders([...folders, newDir])

        dispatch(getMatterFolders(matter_id))

        setNewFolderName('')

        setValidationError(false)



    }

    const selectFolder = useSelector(selectCreateFoldersData);

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
                    In order to proceed with a divorce application, please
                    complete the following documents{" "}
                  </div>{" "}
                </div>
                <Forms
                  files={currentFolder.contents || []}
                  formsData={formsData}
                  matterId={matter_id}
                  province={matterData.province}
                  folder_id={currentFolder.id || currentFolder.folder_id}
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
                  formsData={formsData}
                  matterId={matter_id}
                  province={matterData.province}
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
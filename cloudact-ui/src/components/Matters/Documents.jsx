import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { Table } from 'react-bootstrap'

import documents from '../../assets/images/documents.svg'
import GeneralModal from './Modals/GeneralModal'
import AllDocuments from './Documents/AllDocuments'
import Forms from './Documents/Forms'
import DocumentsSection from './Documents/DocumentsSection'
import { foldersData } from '../../utils/matterData/sampleData'
import { useDispatch, useSelector } from 'react-redux'
import { getMatterFolders } from '../../utils/Apis/matters/getMatterFolders/getMattersFoldersActions'
import {
  selectMatterFoldersData,
  selectMatterFoldersLoading
} from '../../utils/Apis/matters/getMatterFolders/getMattersFoldersSelectors'
import { getUserSID } from '../../utils/helpers'
import { createMatterFolder } from '../../utils/Apis/matters/createMatterFolders/createMatterFoldersActions'
import { selectCreateFoldersData } from '../../utils/Apis/matters/createMatterFolders/createMatterFoldersSelectors'
import { createMatterFiles } from '../../utils/Apis/matters/createMatterFiles/createMatterFilesActions'
import { selectCreateFilesData, selectCreateFilesLoading } from '../../utils/Apis/matters/createMatterFiles/createMatterFilesSelectors'
import { getMatterFiles, getMatterFilesReset } from '../../utils/Apis/matters/getMatterFiles/getMattersFilesActions'
import { selectGetMatterFilesData, selectGetMatterFilesLoading } from '../../utils/Apis/matters/getMatterFiles/getMattersFilesSelectors'

const Documents = ({ matter_id }) => {
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [validationError, setValidationError] = useState(false)
  const [folders, setFolders] = useState(false)
  const dispatch = useDispatch()

  // useEffect(() => {
  //     dispatch(getMatterFolders(matter_id));
  // },[] )

  const selectFolders = useSelector(selectMatterFoldersData)
  const selectFolderLoading = useSelector(selectMatterFoldersLoading)

  const selectFiles = useSelector(selectGetMatterFilesData);
  const selectFilesLoading = useSelector(selectGetMatterFilesLoading)
  console.log("🚀 ~ Documents ~ selectFilesLoading:", selectFilesLoading)
  
  console.log("🚀 ~ Documents ~ selectFiles:", selectFiles)

  const selectMatterFolders = selectFolders?.body
  const selectMatterFiles = selectFiles?.body


  selectMatterFolders.forEach(folder => {
    if (!folder.hasOwnProperty('contents')) {
      folder.contents = []
    }
  })

  const [dirState, setDirState] = useState({
    rootDir: 'Documents',
    currentDir: 'Documents',
    dirStack: [
      {
        title: 'Documents',
        contents: selectFolders?.body
      }
    ]
  })

  const handleDirClick = (dir) => {
  console.log("🚀 ~ handleDirClick ~ dir:", dir.title)

    const fetchData = async () => {
      dispatch(getMatterFiles(matter_id,dir.id));
    };

   fetchData();

   if(selectFiles && !selectFilesLoading){
    dir.contents =  selectFiles?.body;
    setDirState({
      ...dirState,
      currentDir: dir.title,
      dirStack: [...dirState.dirStack, dir]
    })
  }
}
  
  
  const handleBackDirClick = () => {
    if (dirState.dirStack.length > 1) {
      const newDirStack = [...dirState.dirStack]
      newDirStack.pop()
      setDirState({
        ...dirState,
        currentDir: newDirStack[newDirStack.length - 1].title,
        dirStack: newDirStack
      })
    }
    dispatch(getMatterFilesReset());
  }

  const handleAddFolderClick = () => {
    setShowAddFolderModal(true)
  }

  const handleContinue = async () => {
    // If folderName is empty
    if (newFolderName === '') {
      setValidationError({
        newFolderName: 'Folder name is required'
      })
      return
    }

    // If folderName already exists
    const folderExists = dirState.dirStack[
      dirState.dirStack.length - 1
    ].contents.filter(file => file.title === newFolderName)

    if (folderExists.length > 0) {
      setValidationError({
        newFolderName: 'Folder name already exists'
      })
      return
    }

    setShowAddFolderModal(false)

    const newDirectory = {
      title: newFolderName,
      matter_id: matter_id,
      sid: getUserSID(),
      type: 'Folder'
    }

    await dispatch(createMatterFolder(newDirectory))

    const newDir = {
      title: newFolderName,
      createdOn: '01-31-2023',
      type: 'Folder',
      contents: []
    }

    const newDirStack = [...dirState.dirStack]
    newDirStack[newDirStack.length - 1].contents.push(newDir)

    setDirState({
      ...dirState,
      dirStack: newDirStack
    })

    setNewFolderName('')

    setValidationError(false)
  }

  const selectCreateFolder = useSelector(selectCreateFoldersData);
  
  const selectFilesData = useSelector(selectCreateFilesData)

  const formsData = (data) => {

    const newDirStack = [...dirState.dirStack]
   

    data.forEach(category => {
        category.forms.forEach(form => {
            const fileExists = dirState.dirStack[dirState.dirStack.length - 1].contents.filter(file => file.title === form.title)
            if (fileExists && form.checked) {
                const folderID = dirState.dirStack[dirState.dirStack.length - 1];

                const newFileData = {
                    sid: getUserSID(),
                    matter_id: folderID.matter_id,
                    folder_id: folderID.id,
                    file_name: form.title,
                    docId: form.id,
                    status: 'Open',
                    type: 'form'
                }

                dispatch(createMatterFiles(newFileData));

                const newFile = {
                        title: form.title,
                        createdOn: '01-16-2024',
                        status: 'Open',
                        docId: form.id,
                        signOff: 'NC, VL',
                        type: 'form'
                    }


              
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
    const folderExists = dirState.dirStack[
      dirState.dirStack.length - 1
    ].contents.filter(file => file.title === newFolderName)
    if (folderExists.length > 0) {
      setValidationError({
        newFolderName: 'Folder name already exists'
      })
    }
  }, [newFolderName])

  return (
    <div className='document-container'>
      <div className='head'>
        <img src={documents} alt='' />
        <div> Documents </div>{' '}
      </div>
      <div className='body'>
        <div>
          {' '}
          {dirState.currentDir !== dirState.rootDir && (
            <div className='info'>
              <div className='breadcrumbs'> {dirState.currentDir} </div>{' '}
              <div className='description'>
                In order to proceed with a divorce application, please complete
                the following documents{' '}
              </div>{' '}
            </div>
          )}
          {dirState.currentDir === dirState.rootDir && (
            <AllDocuments dirState={dirState} handleDirClick={handleDirClick} />
          )}
          {dirState.currentDir !== dirState.rootDir && (
            <>
              <Forms
                files={
                  dirState.dirStack[dirState.dirStack.length - 1].contents || []
                }
                formsData={formsData}
              />
              <DocumentsSection
                files={
                  dirState.dirStack[dirState.dirStack.length - 1].contents || []
                }
                formsData={formsData}
              />
            </>
          )}
        </div>

        <div
          className={`actions ${
            dirState.currentDir !== dirState.rootDir
              ? 'justify-content-between'
              : ''
          }`}
        >
          {' '}
          {dirState.currentDir !== dirState.rootDir && (
            <span
              className='btn btnPrimary rounded-pill'
              onClick={handleBackDirClick}
            >
              {' '}
              Back{' '}
            </span>
          )}
          {dirState.currentDir === dirState.rootDir ? (
            <>
            
            <span
              className='btn btnPrimary rounded-pill'
              onClick={handleAddFolderClick}
            >
              Add New Folder{' '}
            </span>
            </>
          ) : (
            <span
              className='btn btnPrimary rounded-pill'
              onClick={handleBackDirClick}
            >
              Mark Workflow as completed{' '}
            </span>
          )}
        </div>
      </div>
      {/* BEGIN :: Add Folder Modal */}{' '}
      <GeneralModal
        show={showAddFolderModal}
        changeShow={() => setShowAddFolderModal(false)}
        handleClick={() => setShowAddFolderModal(false)}
        action=''
        // handleContinue={(state) => handleContinue(state)}
        handleContinue={() => handleContinue()}
        heading='Add New Folder'
        size='sm'
        dialogClassName={'summaryModal'}
      >
        <div className='add-folder-modal'>
          <div className='form-group mt-4'>
            <label> Folder Name </label>{' '}
            <input
              type='text'
              className={`form-control ${
                validationError && validationError.newFolderName
                  ? 'is-invalid'
                  : ''
              }`}
              placeholder='Enter Folder Name'
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
            />
            {validationError && validationError.newFolderName && (
              <div className='invalid-feedback'>
                {' '}
                {validationError.newFolderName}{' '}
              </div>
            )}{' '}
          </div>{' '}
        </div>{' '}
      </GeneralModal>{' '}
      {/* END :: Add Folder Modal */}
    </div>
  )
}

export default Documents

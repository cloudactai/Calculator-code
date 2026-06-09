import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import GeneralModal from '../Modals/GeneralModal';
import folder from '../../../assets/images/folder.svg';
import toast from "react-hot-toast";
import axios from 'axios';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [isSizeExceeded, setIsSizeExceeded] = useState(false);

  useEffect(() => {
    const newTotalSize = uploadedFiles.reduce((sum, fileObj) => sum + fileObj.file.size, 0);
    setTotalSize(newTotalSize);
    setIsSizeExceeded(newTotalSize > MAX_SIZE);
  }, [uploadedFiles]);

  const clearFiles = () => {
    setUploadedFiles([]);
    setTotalSize(0);
    setIsSizeExceeded(false);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const sanitizeFileName = (fileName) => {
      let sanitized = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
      sanitized = sanitized.replace(/^\.+|\.+$/g, '');
      sanitized = sanitized.replace(/\.+/g, '.');
      sanitized = sanitized.replace(/^_+|_+$/g, '');
      return sanitized;
    };
  
    const filesWithNames = acceptedFiles.map((file) => {
      const extension = file.name.split('.').pop();
      const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'));
      const sanitizedName = sanitizeFileName(nameWithoutExtension);
      const newFileName = `${sanitizedName}.${extension}`;
      const modifiedFile = new File([file], newFileName, { type: file.type });
      return {
        file: Object.assign(modifiedFile, { title: newFileName })
      };
    });
  
    setUploadedFiles((prevFiles) => {
      const newFiles = [...prevFiles, ...filesWithNames];
      const newTotalSize = newFiles.reduce((sum, fileObj) => sum + fileObj.file.size, 0);
      if (newTotalSize > MAX_SIZE) {
        toast.error('Total file size exceeds 5 MB limit. Please remove some files.');
      }
      return newFiles;
    });
  }, []);
  
  const handleNameChange = (index, newTitle) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.map((fileObj, i) => {
        if (i === index) {
          const updatedFile = Object.assign(fileObj.file, { title: newTitle });
          return { ...fileObj, file: updatedFile, name: newTitle };
        }
        return fileObj;
      })
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const handleRemoveFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleContinueAddForm = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }
  
    if (isSizeExceeded) {
      toast.error('Total file size exceeds 5 MB limit. Please remove some files.');
      return;
    }
  
    setIsUploading(true);
    try {
      await onUpload(uploadedFiles.map(fileObj => fileObj.file));
      clearFiles();
      onClose();
    } catch (error) {
      console.error("error uploading files")
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <GeneralModal
      show={isOpen}
      changeShow={() => {
        clearFiles();
        onClose();
      }}      
      handleClick={onClose}
      handleContinue={handleContinueAddForm}
      heading="Add Files"
      size="sm"
      dialogClassName="summaryModal upload-forms-modal"
      actions={[
        {
          label: isUploading ? "Uploading..." : "Confirm",
          class: "btn btnDefault border-2",
          action: handleContinueAddForm,
          disabled: isUploading || isSizeExceeded,
        },
      ]}
    >
      <div className="upload-forms-modal-body">
        {isSizeExceeded && (
          <div className="alert alert-danger" role="alert">
            Total file size exceeds 5 MB limit. Please remove some files.
          </div>
        )}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-list">
            <h5>Selected Files:</h5>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {uploadedFiles.map((fileObj, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={fileObj.file.title}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder="Enter File Name"
                    className="form-control"
                    style={{ flexGrow: 1, marginRight: '10px' }}
                  />
                  <button
                    className="btn btnDefault"
                    onClick={() => handleRemoveFile(index)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <p>Total size: {(totalSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <>
              <img className="icon" src={folder} alt="folder" />
              <p className="label">Drag your documents here to start uploading</p>
              <div className="divider">
                <span>OR</span>
              </div>
              <button className="btn btnDefault blue">Browse Files</button>
            </>
          )}
        </div>
      </div>
    </GeneralModal>
  );
};

export default UploadModal;

import { useEffect, useState, useCallback } from "react";

import { useDropzone } from "react-dropzone";
import { Button, Table } from "react-bootstrap";
import Accordion from "react-bootstrap/Accordion";
import { useAccordionButton } from "react-bootstrap/AccordionButton";

import CustomCheckbox from "../Form/CustomCheckbox";
import GeneralModal from "../Modals/GeneralModal";

import add_folder_linear from "../../../assets/images/add_folder_linear.svg";
import folder from "../../../assets/images/folder.svg";
import searchIcon from "../../../assets/images/search.svg";
import moment from "moment";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { FormsArray } from "../../../utils/matterData/MatterFormData";
import axios from "../../../utils/axios";
import { getUserProvince, getUserRole, getUserSID } from "../../../utils/helpers";
import toast from "react-hot-toast";

function MyDropzone() {
  const onDrop = useCallback((acceptedFiles) => {
    console.log("🚀 ~ onDrop ~ acceptedFiles:", acceptedFiles);
    // Do something with the files
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <>
          <img className="icon" src={folder} alt="folder" />
          <p className="label">Drag your document here to start uploading</p>
          <div className="divider">
            <span>OR</span>
          </div>
          <button className="btn btnDefault blue">Browse Files</button>
        </>
      )}
    </div>
  );
}

const Forms = ({ files, formsData, matterId, province, folder_id }) => {
  const [showAddFormModal, setShowAddFormModal] = useState(false);
  const [showUploadFormModal, setShowUploadFormModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCheckboxes, setSelectedCheckboxes] = useState([]);
  const dispatch = useDispatch();
  let history = useHistory();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [localFiles, setLocalFiles] = useState(files || []);
  const [selectAll, setSelectAll] = useState(false);
  const [editingFileId, setEditingFileId] = useState(null);
  const [editedFileName, setEditedFileName] = useState("");

  const [forms, setForms] = useState([]);

  // Add a new state to trigger reloads
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Assuming you have an API call to fetch files
        // Replace this with your actual API call
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 1 second
        const sid = getUserSID();
        const response = await axios.get(
          `/get_folder_files/${sid}/${matterId}/${folder_id}`
        );
        const newFiles = await response.data.data.body;
        console.log("🚀 ~ fetchData ~ response:", newFiles);
        setLocalFiles(newFiles);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchData();
  }, [matterId, reload, files]); // Add reload as a dependency

  useEffect(() => {
    const fetchForms = async () => {
      let userProvince = getUserProvince();
      if (typeof userProvince === 'string') {
          userProvince = userProvince.replace(/^"(.*)"$/, '$1'); // Removes leading/trailing quotes
      }
      if (userProvince) {
        try {
          const formsArrayData = await FormsArray(userProvince, true);
          setForms(formsArrayData);
        } catch (error) {
          console.error("Error fetching forms:", error);
          setForms([]);
        }
      } else {
        setForms([]); // Clear forms if no province is available
      }
    };

    fetchForms();
  }, [province, files]);

  const handleContinueAddForm = async () => {
    setShowAddFormModal(false);
    setSearch("");
    formsData(forms);

    // Reset forms
    const newForms = [...forms];
    newForms.forEach((category) => {
      category.forms.forEach((form) => {
        form.checked = false;
      });
    });

    // Trigger a reload by incrementing the reload counter
    setReload((prev) => prev + 1);
  };

  const openFiles = () => {
    const files = selectedCheckboxes;
    console.log("🚀 ~ openFiles ~ files:", files);

    dispatch({
      type: "UPDATE_SELECTED_FORMS",
      payload: selectedFiles,
    });

    let serializedCheckedForms = JSON.stringify(selectedFiles);
    console.log(
      "🚀 ~ handleCreateNewFormSubmit ~ serializedCheckedForms:",
      selectedFiles
    );
    localStorage.setItem("checkedForms", serializedCheckedForms);

    let formData = {
      clientName: "",
      matterNumber: matterId,
    };
    console.log("🚀 ~ openFiles ~ formData:", formData);

    history.push({
      pathname: "/forms/create-new/fill-pdf",
      state: { formData },
    });
  };

  const handleCheckboxChange = (id, isChecked, docId) => {
    let newSelectedCheckboxes, newSelectedFiles;

    if (isChecked) {
      newSelectedCheckboxes = [...selectedCheckboxes, id];
      newSelectedFiles = [
        ...selectedFiles,
        {
          id: id,
          folder_id: docId.folder_id,
          file_name: docId.file_name,
          file_id: docId.id,
          type: docId.type,
          status: docId.status,
          docId: docId.docId,
          title: docId.file_name,
          shortTitle: docId.docId,
          checked: true,
        },
      ];
    } else {
      newSelectedCheckboxes = selectedCheckboxes.filter(
        (checkboxId) => checkboxId !== id
      );
      newSelectedFiles = selectedFiles.filter(
        (file) => file.id !== docId.docId
      );
    }

    setSelectedCheckboxes(newSelectedCheckboxes);
    setSelectedFiles(newSelectedFiles);
    setSelectAll(newSelectedCheckboxes.length === localFiles.length);
  };

  const handleSelectAll = (isChecked) => {
    setSelectAll(isChecked);

    if (isChecked) {
      const allIds = localFiles.map((file) => file.docId);
      const allFiles = localFiles.map((file) => ({
        id: file.docId,
        folder_id: file.folder_id,
        file_name: file.file_name,
        file_id: file.id,
        type: file.type,
        status: file.status,
        docId: file.docId,
        title: file.file_name,
        shortTitle: file.docId,
        checked: true,
      }));
      setSelectedCheckboxes(allIds);
      setSelectedFiles(allFiles);
    } else {
      setSelectedCheckboxes([]);
      setSelectedFiles([]);
    }
  };

  const startRenaming = (file) => {
    setEditingFileId(file.docId);
    setEditedFileName(file.file_name || file.title);
  };

  const cancelEdit = () => {
    setEditingFileId(null);
    setEditedFileName("");
  };

  const saveFileName = (file) => {
    if (!editedFileName.trim()) return;

    const updatedFiles = localFiles.map((f) =>
      f.docId === file.docId
        ? { ...f, file_name: editedFileName, title: editedFileName }
        : f
    );
    setLocalFiles(updatedFiles);
    setEditingFileId(null);

    // OPTIONAL: Call backend
    axios
      .put(
        `/rename_file/${file.sid}/${file.matter_id}/${file.folder_id}/${file.docId}`,
        { file_name: editedFileName }
      )
      .then(() => {
        toast.success("File renamed successfully");
        console.log("Renamed successfully");
      })
      .catch((err) => {
        toast.error("Something went wrong");
        console.error("Rename failed", err);
      });
  };

  const handleDeleteFile = (file) => {
    let user_info = getUserRole();

    if (window.confirm(`Delete "${file.file_name}"?`)) {
      setLocalFiles(localFiles.filter((f) => f.docId !== file.docId));

      // OPTIONAL: Backend call
      axios
        .delete(
          `/delete_file/${file.sid}/${user_info[0].short_firmname}/${file.matter_id}/${file.folder_id}/${file.docId}`
        )
        .then(() => {
          toast.success("File deleted successfully");
          console.log("Deleted successfully");
        })
        .catch((err) => {
          toast.error("Something went wrong");
          console.error("Delete failed", err);
        });
    }
  };

  return (
    <div className="forms-container">
      <div className="info">
        <div className="title">1. Forms</div>
        <div className="description">
          Please complete the following pre-filled forms
        </div>
      </div>
      <div className="documents-table">
        <Table hover className="table reports-table reports-table-primary">
          <thead>
            <tr>
              <th scope="col">
                <CustomCheckbox
                  id="select_all"
                  label="Document"
                  checked={selectAll}
                  onChange={(id, isChecked) => handleSelectAll(isChecked)}
                />
              </th>

              <th scope="col">Created On</th>
              {/* <th scope="col">Status</th> */}

              <th scope="col">Sign off</th>
            </tr>
          </thead>
          <tbody>
            {localFiles.map((file, index) => (
              <>
                {/* {JSON.stringify(file)} */}
                <tr key={index}>
                  <td className="folder file">
                    <CustomCheckbox
                      id={file.docId}
                      docId={file}
                      label=""
                      onChange={handleCheckboxChange}
                      checked={selectedCheckboxes.includes(file.docId)}
                    />

                    {editingFileId === file.docId ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <input
                          className="form-control d-inline w-auto"
                          value={editedFileName}
                          onChange={(e) => setEditedFileName(e.target.value)}
                          onBlur={() => {
                            if (
                              editedFileName.trim() !==
                              (file.file_name || file.title).trim()
                            ) {
                              saveFileName(file);
                            } else {
                              cancelEdit();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveFileName(file);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                        />

                        <i
                          className="fas fa-check text-success"
                          style={{ cursor: "pointer", fontSize: 14 }}
                          onClick={() => saveFileName(file)}
                          title="Save"
                        ></i>
                        <i
                          className="fas fa-times text-danger"
                          style={{ cursor: "pointer", fontSize: 14 }}
                          onClick={cancelEdit}
                          title="Cancel"
                        ></i>
                      </div>
                    ) : (
                      <>
                        <span>{file.title || file.file_name}</span>
                        <i
                          className="fas fa-pen mx-2"
                          style={{ cursor: "pointer", fontSize: 14 }}
                          onClick={() => startRenaming(file)}
                        ></i>
                        <i
                          className="fas fa-trash-alt text-danger"
                          style={{ cursor: "pointer", fontSize: 14 }}
                          onClick={() => handleDeleteFile(file)}
                        ></i>
                      </>
                    )}
                  </td>

                  <td>{moment(file.createdOn).format("D-MM-YYYY")}</td>
                  <td>{file.signOff}</td>
                </tr>
              </>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="forms-actions">
        {selectedCheckboxes.length > 0 ? (
          <>
            {/* <span className="statusBadge" onClick={""}>Add Support Calc</span> */}
            <span className="statusBadge" onClick={""}>
              Download
            </span>
            {/* <span className="statusBadge" onClick={() => setShowUploadFormModal(true)}>Upload</span> */}
            <span
              className="statusBadge"
              onClick={() => setShowAddFormModal(1)}
            >
              Add Forms
            </span>
            {/* <span className="statusBadge" onClick={""}>Complete Forms</span> */}
            <span className="statusBadge" onClick={""}>
              Sign off
            </span>
            <span className="statusBadge" onClick={() => openFiles()}>
              Open Files
            </span>
          </>
        ) : (
          <>
            {/* <span className="statusBadge" onClick={() => setShowUploadFormModal(true)}>Upload</span> */}
            <span
              className="statusBadge"
              onClick={() => setShowAddFormModal(1)}
            >
              Add Forms
            </span>
          </>
        )}
      </div>
      {/* BEGIN::Modals */}

      {/* BEGIN::Add Forms Modal */}
      <GeneralModal
        show={showAddFormModal}
        changeShow={() => setShowAddFormModal(false)}
        handleClick={() => setShowAddFormModal(false)}
        action=""
        handleContinue={() => handleContinueAddForm()}
        heading="Please select forms from below list"
        size="sm"
        dialogClassName={"newFormModal"}
        actions={[
          {
            label: "Continue",
            class: "btn btnPrimary rounded-pill",
            action: () => handleContinueAddForm(),
          },
        ]}
      >
        <div className="add-forms-modal-body">
          <div className="content">
            <div className="left">
              <div className="search">
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
                <div
                  className="icon"
                  style={{ backgroundImage: `url(${searchIcon})` }}
                />
              </div>
              <div className="navbar">
                {forms.map((form, index) => (
                  <div
                    className={
                      showAddFormModal === index + 1
                        ? "folder active"
                        : "folder"
                    }
                    key={index}
                    onClick={() => {
                      setShowAddFormModal(index + 1);
                      setSearch("");
                    }}
                  >
                    <span
                      className="folder-icon"
                      style={{ backgroundImage: `url(${form.icon})` }}
                    />
                    <span className="folder-name">{form.category}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="right">
              {search !== ""
                ? forms.map((form, index) => (
                    <div className="forms" key={index}>
                      {form.forms
                        .filter((form) =>
                          form.title
                            .toLowerCase()
                            .includes(search.toLowerCase())
                        )
                        .map((form, index_form) => (
                          <div
                            className="form-checkbox"
                            key={`${index}-${index_form}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();

                              const newForms = [...forms];
                              newForms[index].forms[index_form].checked =
                                !newForms[index].forms[index_form].checked;
                              setForms(newForms);
                            }}
                          >
                            <CustomCheckbox
                              label={form.title}
                              checked={form.checked}
                            />
                          </div>
                        ))}
                    </div>
                  ))
                : forms.map(
                    (form, index) =>
                      showAddFormModal === index + 1 && (
                        <div className="forms" key={index}>
                          {form.forms.map(
                            (form, index_form) =>
                              form.status == "active" && (
                                <div
                                  className="form-checkbox"
                                  key={`${index}-${index_form}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const newForms = [...forms];
                                    newForms[index].forms[index_form].checked =
                                      !newForms[index].forms[index_form]
                                        .checked;
                                    setForms(newForms);
                                  }}
                                >
                                  <CustomCheckbox
                                    label={form.title}
                                    checked={form.checked}
                                  />
                                </div>
                              )
                          )}
                        </div>
                      )
                  )}
            </div>
          </div>
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
        actions={[
          {
            label: "Confirm",
            class: "btn btnDefault border-2",
            action: () => handleContinueAddForm(),
          },
        ]}
      >
        <div className="upload-forms-modal-body">
          <div className="form-group">
            <label>Name the Document</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Document Name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
          </div>

          <MyDropzone />
        </div>
      </GeneralModal>
      {/* END::Upload Forms Modal */}

      {/* END::Modals */}
    </div>
  );
};

export default Forms;

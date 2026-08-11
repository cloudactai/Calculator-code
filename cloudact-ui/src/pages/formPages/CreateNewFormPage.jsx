import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";

import Layout from "../../components/LayoutComponents/Layout";
import GeneralModal from "../../components/Matters/Modals/GeneralModal";
import CustomCheckbox from "../../components/Matters/Form/CustomCheckbox";

import new_form from "../../assets/images/new_form.svg";
import laptop_gears from "../../assets/images/laptop_gears.svg";
import searchIcon from "../../assets/images/search.svg";
import cross from "../../assets/images/cross.svg";
import Loader from "../../components/Loader";
import CustomDropDown from "../../components/Matters/Form/CustomDropdown";
import { FormsArray } from "../../utils/matterData/MatterFormData";
import { formsService } from "../../services/formsService";

const CreateNewFormPage = ({ currentUserRole }) => {
  const { response } = useSelector((state) => state.userProfileInfo);
  const [showAddFormModal, setShowAddFormModal] = useState(false);
  const [matterData, setMatterData] = useState(null);
  const [matters, setMatters] = useState([]);
  const [isMattersLoading, setIsMattersLoading] = useState(true);

  // When arriving from a matter task, the matter number is passed in via
  // navigation state so the dropdown and downstream lookups start pre-filled.
  const location = useLocation();
  const prefilledMatterNumber = location.state?.matterNumber
    ? String(location.state.matterNumber)
    : "";

  const [formData, setFormData] = useState({
    clientName: "",
    matterNumber: prefilledMatterNumber,
  });

  useEffect(() => {
    const fetchForms = async () => {
      const province = matterData?.province;
      if (province) {
        try {
          const formsArrayData = await FormsArray(province, true, true);
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
  }, [matterData]);

  useEffect(() => {
    if (!formData.matterNumber) return;
    let active = true;
    formsService.getMatterContext(formData.matterNumber)
      .then((matter) => { if (active) setMatterData(matter); })
      .catch(() => { if (active) setMatterData(null); });
    return () => { active = false; };
  }, [formData.matterNumber]);

  const [search, setSearch] = useState("");

  let history = useHistory();

  const [forms, setForms] = useState([]);

  const handleContinueAddForm = () => {
    setShowAddFormModal(false);
    setSearch("");
  };

  useEffect(() => {
    let active = true;
    formsService.listMatters()
      .then((result) => { if (active) setMatters(Array.isArray(result) ? result : []); })
      .catch(() => { if (active) setMatters([]); })
      .finally(() => { if (active) setIsMattersLoading(false); });
    return () => { active = false; };
  }, []);

  const mattersList = matters.map((item) => ({
    name: item.matterNumber,
    value: item.matterNumber,
  }));

  const handleClientNumberChange = (e, li) => {
    setMatterData(null);
    setSelectedFolderId(null);
    setSelectedFolderTitle(null);
    setNewFolderTitle("");
    setFolderError("");
    setCreateError("");

    setFormData({
      ...formData,
      matterNumber: li.value,
    });
  };
  const handleFolderChange = (e, li) => {
    setSelectedFolderId(li.value);
    setSelectedFolderTitle(li.name);
  };

  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderTitle, setSelectedFolderTitle] = useState(null);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!formData.matterNumber) return;
    formsService.listFolders(formData.matterNumber)
      .then((result) => setFolders(result.map((folder) => ({
        title: folder.title, folder_id: folder.id, matter_id: formData.matterNumber,
        created: folder.createdAt || folder.created, type: folder.type,
      }))))
      .catch(() => setFolders([]));
  }, [formData.matterNumber]);

  const handleCreateNewFormSubmit = async (e) => {
    e.preventDefault();
    const selected = forms.flatMap((group) => group.forms.filter((form) => form.checked));
    if (!selectedFolderId || selected.length === 0) {
      setCreateError(!selectedFolderId ? "Create or select a folder before creating forms." : "Select at least one form to create.");
      return;
    }
    setCreateError("");
    try {
      const documents = await formsService.createDocuments(formData.matterNumber, selectedFolderId, selected.map((form) => form.id));
      const first = documents[0];
      if (first) history.push(`/matters/${encodeURIComponent(formData.matterNumber)}/forms/${first.id}`);
    } catch (error) {
      console.error("Could not create form documents", error);
    }
  };

  const handleCreateFolder = async () => {
    const title = newFolderTitle.trim();
    if (!title || !formData.matterNumber) return;
    setIsCreatingFolder(true);
    setFolderError("");
    try {
      const folder = await formsService.createFolder(formData.matterNumber, title);
      const createdFolder = {
        title: folder.title,
        folder_id: folder.id,
        matter_id: formData.matterNumber,
        created: folder.createdAt || folder.created,
        type: folder.type,
      };
      setFolders((current) => [...current.filter((item) => item.folder_id !== createdFolder.folder_id), createdFolder]);
      setSelectedFolderId(createdFolder.folder_id);
      setSelectedFolderTitle(createdFolder.title);
      setNewFolderTitle("");
    } catch (error) {
      setFolderError("Could not create that folder. Please try again.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <Layout title={`Welcome ${response?.username ? response.username : ""}`}>
      {isMattersLoading ? (
        <Loader isLoading={isMattersLoading} />
      ) : (
        <div className="create-new-form-page panel trans">
          <div className="pBody">
            <div className="row matterType">
              <div className="col-12">
                <div className="new-form-container">
                  <div className="head">
                    <img src={new_form} alt="" />
                    <div>New Form</div>
                  </div>
                  <div className="body py-4">
                    <div className="content-container">
                      <div className="content">
                        <div className="input-row mb-3">
                          <label className="label">
                            What is the Matter Number of the client?
                          </label>
                          <div className="inputs">
                            <div className="input-item">
                              <label className="form-label mb-0">
                                Matter Number
                              </label>
                              <CustomDropDown
                                handleChange={handleClientNumberChange}
                                list={mattersList}
                                curListItem={formData.matterNumber}
                              ></CustomDropDown>
                              <div className="d-flex align-items-center gap-2 mt-2">
                                <input
                                  className="form-control"
                                  aria-label="New folder name"
                                  placeholder="New folder name"
                                  value={newFolderTitle}
                                  onChange={(e) => setNewFolderTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCreateFolder();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="btn btnSecondary"
                                  onClick={handleCreateFolder}
                                  disabled={isCreatingFolder || !newFolderTitle.trim()}
                                >
                                  {isCreatingFolder ? "Creating…" : "Create folder"}
                                </button>
                              </div>
                              {folders.length === 0 && <small className="d-block mt-2">Create a folder to choose where this form will be saved.</small>}
                              {folderError && <small className="d-block mt-2 text-danger" role="alert">{folderError}</small>}
                            </div>
                          </div>
                        </div>
                        {matterData && (
                          <>
                            <p>
                              Selected Matter Province:{" "}
                              <strong>{matterData.province || "Not set"}</strong>
                            </p>
                            {/* The forms catalogue is chosen by the matter's
                                province — with none set there is nothing to
                                list, so say why instead of showing an empty
                                picker. */}
                            {!matterData.province && (
                              <p className="text-danger" role="alert">
                                This matter has no province set, so there are no
                                forms to choose from. Set the matter's province
                                to see the forms for that court.
                              </p>
                            )}
                            <p>
                              Client Name:{" "}
                              <strong>{matterData.client_id}</strong>
                            </p>
                            <div className="input-item">
                              <label className="form-label mb-0">
                                Select Folder
                              </label>
                              <CustomDropDown
                                handleChange={handleFolderChange}
                                list={folders.map((folder) => ({
                                  name: folder.title,
                                  value: folder.folder_id,
                                }))}
                                curListItem={selectedFolderTitle}
                              ></CustomDropDown>
                            </div>
                            <p>
                              Please select the forms you want to create from
                              following folders
                            </p>
                            {forms.map((form, index) => (
                              <div
                                className="folder"
                                key={index}
                                onClick={() => {
                                  setSearch("");
                                  setShowAddFormModal(index + 1);
                                }}
                              >
                                <span
                                  className="folder-icon"
                                  style={{
                                    backgroundImage: `url(${form.icon})`,
                                  }}
                                />
                                <span className="folder-name">
                                  {form.category}
                                </span>
                              </div>
                            ))}
                            <div className="output-forms">
                              {forms.map((form, index) =>
                                form.forms.map(
                                  (form, index_form) =>
                                    form.checked && (
                                      <div
                                        className="form"
                                        key={`${index}-${index_form}`}
                                      >
                                        <span className="name">
                                          {form.title}
                                        </span>
                                        <span
                                          className="icon"
                                          style={{
                                            backgroundImage: `url(${cross})`,
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();

                                            const newForms = [...forms];
                                            newForms[index].forms[
                                              index_form
                                            ].checked = false;
                                            setForms(newForms);
                                          }}
                                        />
                                      </div>
                                    )
                                )
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div
                        className="img"
                        style={{ backgroundImage: `url(${laptop_gears})` }}
                      ></div>
                    </div>
                    <div className="action">
                      {createError && <div className="text-danger mb-2" role="alert">{createError}</div>}
                      <button
                        className="btn btnPrimary rounded-pill"
                        onClick={handleCreateNewFormSubmit}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modals */}

            {/* BEGIN::Add Forms Modal */}
            <GeneralModal
              show={showAddFormModal}
              changeShow={() => setShowAddFormModal(false)}
              handleClick={() => setShowAddFormModal(false)}
              action=""
              // handleContinue={(state) => handleContinue(state)}
              handleContinue={() => handleContinueAddForm()}
              heading={`Please select forms from - ${matterData?.province || "this matter's province (not set)"}`}
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
                              .map((item, index_form) => ({ item, index_form }))
                              .filter(
                                ({ item }) =>
                                  item.status === "active" &&
                                  item.title
                                    .toLowerCase()
                                    .includes(search.toLowerCase())
                              )
                              .map(({ item: form, index_form }) => (
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
                              ))}
                          </div>
                        ))
                      : forms.map(
                          (form, index) =>
                            showAddFormModal === index + 1 && (
                              <div className="forms" key={index}>
                                {form.forms.map(
                                  (form, index_form) =>
                                    form.status === "active" && (
                                      <div
                                        className="form-checkbox"
                                        key={`${index}-${index_form}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();

                                          const newForms = [...forms];
                                          newForms[index].forms[
                                            index_form
                                          ].checked =
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
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CreateNewFormPage;

/* eslint-disable react/no-direct-mutation-state */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Layout from "../../components/LayoutComponents/Layout";
import { ViewIcon, DownloadIcon, DeleteIcon } from "../../assets/icons/icons";
import profile_summary from "../../assets/images/profile_summary.svg";
import background_information from "../../assets/images/background_information.svg";
import children_information from "../../assets/images/children_information.svg";
import relationship_information from "../../assets/images/relationship_information.svg";
import employment_details from "../../assets/images/employment_details.svg";
import income_and_benefits from "../../assets/images/income_and_benefits.svg";
import expenses from "../../assets/images/expenses.svg";
import assets from "../../assets/images/assets.svg";
import debts_and_liabilities from "../../assets/images/debts_and_liabilities.svg";
import other_persons_in_household from "../../assets/images/other_persons_in_household.svg";
import financial_summary from "../../assets/images/financial_summary.svg";
import court_information from "../../assets/images/court_information.svg";

import GeneralModal from "../../components/Matters/Modals/GeneralModal";
import BackgroundInformationSimple from "../fiveSteps/BackgroundInformationSimple";
import ChildrenInformationSimple from "../fiveSteps/ChildrenInformationSimple";
import RelationshipInformationSimple from "../fiveSteps/RelationshipInformationSimple";
import EmploymentDetailsSimple from "../fiveSteps/EmploymentDetailsSimple";
import IncomeAndBenefitsSimple from "../fiveSteps/IncomeAndBenefitsSimple";
import ExpensesSimple from "../fiveSteps/ExpensesSimple";
import AssetsSimple from "../fiveSteps/AssetsSimple";
import DebtsAndLiabilitiesSimple from "../fiveSteps/DebtsAndLiabilitiesSimple";
import OtherPersonsInHouseholdSimple from "../fiveSteps/OtherPersonsInHouseholdSimple";
import FinancialSummarySimple from "../fiveSteps/FinancialSummarySimple";
import { useParams } from "react-router";
import {
  getSingleMatter,
  getSingleMatterReset,
} from "../../utils/Apis/matters/getSingleMatter/getSingleMattersActions";
import { selectSingleMatterData } from "../../utils/Apis/matters/getSingleMatter/getSingleMattersSelectors";
import { selectMatterFoldersLoading } from "../../utils/Apis/matters/getMatterFolders/getMattersFoldersSelectors";
import Loader from "../../components/Loader";
import { getMatterFolders } from "../../utils/Apis/matters/getMatterFolders/getMattersFoldersActions";
import { getSingleMatterDataReset } from "../../utils/Apis/matters/getSingleMatterData/getSingleMattersDataActions";
import {
  updateMatterData,
  updateMatterReset,
} from "../../utils/Apis/matters/updateMatters/updateMatterDataActions";
import {
  selectMatterUpdateData,
  selectMatterUpdateLoading,
} from "../../utils/Apis/matters/updateMatters/updateMatterDataSelectors";
import FolderStructure from "../../components/Matters/Folders";
import toast from "react-hot-toast";
import CourtInformationSimple from "../fiveSteps/CourtInformationSimple";
import UploadModal from "../../components/Matters/UploadDocuments/UploadModal";
import axios from "../../utils/axios";
import { getShortFirmname, getUserSID } from "../../utils/helpers";
import { Table } from "react-bootstrap";
import { format } from "date-fns";

const SingleMatter = () => {
  const [modalData, setModalData] = useState(null);
  const [matterData, setMatterData] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [bgInfoActiveTab, setBgInfoActiveTab] = useState("Client"); //background info
  const [activeTab, setActiveTab] = useState(null); //children info
  const [empActiveTab, setEmpActiveTab] = useState("Client"); //employment details
  const [incomeActiveTab, setIncomeActiveTab] = useState("Client"); //income and benefits
  const [expensesActiveTab, setExpensesActiveTab] = useState("Client"); // expenses
  const [refreshDocuments, setRefreshDocuments] = useState(false);

  const [showUploadFormModal, setShowUploadFormModal] = useState(false);
  const [documents, setDocuments] = useState([]);

  const getTabForComponent = (component) => {
    switch (component) {
      case "BackgroundInformationSimple":
        return bgInfoActiveTab;
      case "ChildrenInformationSimple":
        return `child_${activeTab}`;
      case "EmploymentDetailsSimple":
        return empActiveTab;
      case "IncomeAndBenefitsSimple":
        return incomeActiveTab;
      case "ExpensesSimple":
        return expensesActiveTab;
      default:
        return null;
    }
  };

  const fetchDocuments = async () => {
    if (!modalData) return;

    const sid = getUserSID();
    const tab = getTabForComponent(modalData.component);

    try {
      const response = await axios.get("/get_user_documents", {
        params: {
          matter_id: id,
          type: modalData.component,
        },
        headers: {
          "X-SID": sid,
          "X-Tab": tab,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  };

  useEffect(() => {
    if (modalData) {
      fetchDocuments().then(setDocuments);
    }
  }, [
    modalData,
    bgInfoActiveTab,
    activeTab,
    empActiveTab,
    incomeActiveTab,
    expensesActiveTab,
    refreshDocuments,
  ]);

  const handleUpload = async (files) => {
    const formData = new FormData();
    const short_firmname = getShortFirmname();
    const sid = getUserSID();

    files.forEach((file, index) => {
      const sanitizedFileName = file.name.replace(/\s+/g, "_");
      formData.append("files", file);
      formData.append(`file_title[${index}]`, file.title || sanitizedFileName);
    });
    formData.append("matterId", id);
    formData.append("short_firmname", short_firmname);
    formData.append("sid", sid);
    formData.append("type", modalData.component);

    const tab = getTabForComponent(modalData.component);
    formData.append("tab", tab);

    let path = `${id}/${modalData.component.replace(/\s+/g, "_")}`;

    // Append the active tab only if it exists
    if (tab) {
      path += `/${tab.replace(/\s+/g, "_")}`;
    }
    formData.append("path", path);

    try {
      const response = await axios.post("/upload_user_documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Files uploaded successfully");
      setRefreshDocuments((prev) => !prev);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("File upload failed. Please try again");
    }
  };

  const handleViewDocument = async (fileUrl) => {
    try {
      const response = await axios.post("/get_presigned_url", {
        file_url: fileUrl,
      });
      console.log(response);
      const presignedUrl = response.data;
      window.open(presignedUrl, "_blank");
    } catch (error) {
      console.error("Error fetching presigned URL:", error);
      toast.error("Failed to view document");
    }
  };

  const handleDownloadDocument = async (fileUrl) => {
    try {
      const response = await axios.post("/download_documents", {
        file_url: fileUrl,
      });
      const presignedUrl = response.data;

      window.open(presignedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (doc) => {
    try {
      const fileUrl = doc.file_url;
      const title = doc.title;
      const response = await axios.post("/delete_document", {
        file_url: fileUrl,
        title: title,
      });
      if (response.status === 200) {
        // Remove the deleted document from the state
        setDocuments((prevDocuments) =>
          prevDocuments.filter((doc) => doc.title !== title)
        );
        toast.success("Document deleted successfully");
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const { id } = useParams();

  const dispatch = useDispatch();

  const { response } = useSelector((state) => state.userProfileInfo);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(getSingleMatter(id));
    };
    fetchData();
  }, [dispatch, matterData, id]);

  // useEffect(() => {
  //   dispatch(getMatterFolders(id))
  // }, [dispatch,id])

  const profileSummaryMenuList = [
    {
      title: "Background Information",
      icon: background_information,
      link: "/matters/background-information",
      component: "BackgroundInformationSimple",
    },
    {
      title: "Court Information",
      icon: court_information,
      link: "/matters/court-information",
      component: "CourtInformationSimple",
    },
    {
      title: "Children Information",
      icon: children_information,
      link: "/matters/children-information",
      component: "ChildrenInformationSimple",
    },
    {
      title: "Relationship Information",
      icon: relationship_information,
      link: "/matters/relationship-information",
      component: "RelationshipInformationSimple",
    },
    {
      title: "Employment Details",
      icon: employment_details,
      link: "/matters/employment-details",
      component: "EmploymentDetailsSimple",
    },
    {
      title: "Income and Benefits",
      icon: income_and_benefits,
      link: "/matters/income-and-benefits",
      component: "IncomeAndBenefitsSimple",
    },
    {
      title: "Expenses",
      icon: expenses,
      link: "/matters/expenses",
      component: "ExpensesSimple",
    },
    {
      title: "Assets",
      icon: assets,
      link: "/matters/assets",
      component: "AssetsSimple",
    },
    {
      title: "Debts and Liabilities",
      icon: debts_and_liabilities,
      link: "/matters/debts-and-liabilities",
      component: "DebtsAndLiabilitiesSimple",
    },
    {
      title: "Other Persons in Household",
      icon: other_persons_in_household,
      link: "/matters/other-persons-in-household",
      component: "OtherPersonsInHouseholdSimple",
    },
    // {
    //   title: "Financial Summary",
    //   icon: financial_summary,
    //   link: "/matters/financial-summary",
    //   component: "FinancialSummarySimple",
    // },
  ];

  const onUpdateFormData = (data) => {
    setFormData(data);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        type: formData.type,
        matter_id: id,
        data: formData,
      };
      dispatch(updateMatterData(data));
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
    }
  };

  const selectSingleMatter = useSelector(selectSingleMatterData);
  const selectUpdateMatter = useSelector(selectMatterUpdateData);
  const selectUpdateMatterLoading = useSelector(selectMatterUpdateLoading);

  useEffect(() => {
    if (
      selectSingleMatter &&
      selectSingleMatter.body[0] &&
      matterData === null
    ) {
      setMatterData(selectSingleMatter.body[0]);
    }
  }, [selectSingleMatter, matterData]);

  useEffect(() => {
    if (selectUpdateMatter) {
      setIsSaving(false);
      setModalData(null);

      toast.success("Data Successfully Saved", {
        position: "top-right",
        style: {
          borderRadius: "10px",
          background: "#FFF",
          color: "#000",
        },
      });
      dispatch(updateMatterReset());
    }
  }, [dispatch, selectUpdateMatterLoading, selectUpdateMatter]);

  const matterLoading = false;

  const openModal = (item) => {
    setModalData(item);
  };

  const handelClose = () => {
    dispatch(getSingleMatterDataReset("relationship"));
    dispatch(getSingleMatterDataReset("employment"));
    dispatch(getSingleMatterDataReset("assets"));
    dispatch(getSingleMatterDataReset("children"));
    dispatch(getSingleMatterDataReset("incomeBenefits"));
    dispatch(getSingleMatterDataReset("expenses"));
    dispatch(getSingleMatterReset());
    setMatterData(null);
    setModalData(null);
  };

  return (
    <Layout title={`Welcome ${response?.username ? response.username : ""} `}>
      {matterLoading ? (
        <Loader isLoading={matterLoading} />
      ) : (
        <div className="single-matter panel trans">
          <div className="pHead">
            <div className="info-container">
              <div className="info-row">
                <div className="label">Client Name:</div>
                <div className="value">
                  {selectSingleMatter && selectSingleMatter?.body[0].client_id}
                </div>
              </div>

              <div className="info-row">
                <div className="label">
                  <div className="label-text">Matter Number:</div>
                </div>
                <div className="value">{id}</div>
              </div>
            </div>
          </div>

          <div className="pBody">
            <div className="row matterType">
              <div className="col-12 col-xxl-5">
                <div className="summary-container">
                  <div className="head">
                    <img src={profile_summary} alt="" />
                    <div>Profile Summary</div>
                  </div>

                  <div className="body">
                    {profileSummaryMenuList.map((item, index) => (
                      <div className="profile-menu" key={index}>
                        <div className="info">
                          <img src={item.icon} alt="" />
                          <div>{item.title}</div>
                        </div>
                        <div className="actions">
                          <span
                            className="statusBadge"
                            onClick={() => openModal(item)}
                          >
                            View / Edit
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-12 col-xxl-7">
                {/* <Documents matter_id={id} />  */}
                <FolderStructure matter_id={id} matterData={matterData} />
              </div>
            </div>

            {/* Modals */}
            <GeneralModal
              show={modalData}
              changeShow={() => handelClose()}
              handleClick={() => setModalData(null)}
              handleContinue={handleSave}
              heading={modalData && modalData.title}
              modalWidth="900px"
              dialogClassName="matterModal"
              isLoading={isSaving}
            >
              {modalData &&
                modalData.component === "BackgroundInformationSimple" && (
                  <BackgroundInformationSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                    bgInfoActiveTab={bgInfoActiveTab}
                    setBgInfoActiveTab={setBgInfoActiveTab}
                  />
                )}
              {modalData &&
                modalData.component === "CourtInformationSimple" && (
                  <CourtInformationSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                    matterData={matterData}
                  />
                )}
              {modalData &&
                modalData.component === "ChildrenInformationSimple" && (
                  <ChildrenInformationSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                )}
              {modalData &&
                modalData.component === "RelationshipInformationSimple" && (
                  <RelationshipInformationSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                  />
                )}
              {modalData &&
                modalData.component === "EmploymentDetailsSimple" && (
                  <EmploymentDetailsSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                    activeTab={empActiveTab}
                    setActiveTab={setEmpActiveTab}
                  />
                )}
              {modalData &&
                modalData.component === "IncomeAndBenefitsSimple" && (
                  <IncomeAndBenefitsSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                    matterData={matterData}
                    activeTab={incomeActiveTab}
                    setActiveTab={setIncomeActiveTab}
                  />
                )}
              {modalData && modalData.component === "ExpensesSimple" && (
                <ExpensesSimple
                  matterId={id}
                  onUpdateFormData={onUpdateFormData}
                  matterData={matterData}
                  activeTab={expensesActiveTab}
                  setActiveTab={setExpensesActiveTab}
                />
              )}
              {modalData && modalData.component === "AssetsSimple" && (
                <AssetsSimple
                  matterId={id}
                  onUpdateFormData={onUpdateFormData}
                  matterData={matterData}
                />
              )}
              {modalData &&
                modalData.component === "DebtsAndLiabilitiesSimple" && (
                  <DebtsAndLiabilitiesSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                  />
                )}
              {modalData &&
                modalData.component === "OtherPersonsInHouseholdSimple" && (
                  <OtherPersonsInHouseholdSimple
                    matterId={id}
                    onUpdateFormData={onUpdateFormData}
                  />
                )}
              {modalData &&
                modalData.component === "FinancialSummarySimple" && (
                  <FinancialSummarySimple matterId={id} />
                )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "1rem",
                }}
              >
                <span
                  className="statusBadge"
                  onClick={() => setShowUploadFormModal(true)}
                >
                  Upload
                </span>
              </div>

              <div className="docs-container body document-container">
                <div
                  className="documents-table"
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  <Table
                    hover
                    className="reports-table reports-table-primary"
                    style={{ width: "100%" }}
                  >
                    <thead className="thead-primary">
                      <tr>
                        <th style={{ width: "60%" }}>Name of uploaded file</th>
                        <th style={{ width: "13%" }}>Date of adding</th>
                        <th style={{ width: "8%" }}>Size</th>
                        <th style={{ width: "8%" }}>Format</th>
                        <th style={{ width: "11%", textAlign: "center" }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc, index) => (
                        <tr key={index}>
                          <td>{doc.title}</td>
                          <td>
                            {format(new Date(doc.created_at), "yyyy-MM-dd")}
                          </td>
                          <td>{doc.size}</td>
                          <td>{doc.format}</td>
                          <td
                            style={{
                              display: "flex",
                              justifyContent: "space-around",
                              alignItems: "center",
                            }}
                          >
                            <span
                              onClick={() => handleViewDocument(doc.file_url)}
                              style={{ cursor: "pointer" }}
                            >
                              <ViewIcon />
                            </span>
                            <span
                              onClick={() =>
                                handleDownloadDocument(doc.file_url)
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <DownloadIcon />
                            </span>
                            <span
                              onClick={() => handleDelete(doc)}
                              style={{ cursor: "pointer" }}
                            >
                              <DeleteIcon />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </GeneralModal>
          </div>

          <UploadModal
            isOpen={showUploadFormModal}
            onClose={() => setShowUploadFormModal(false)}
            onUpload={handleUpload}
          />
        </div>
      )}
    </Layout>
  );
};

export default SingleMatter;

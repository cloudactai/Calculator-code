import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import GeneralModal from "../Matters/Modals/GeneralModal";
import FolderStructure from "../Matters/Folders";

import BackgroundInformationSimple from "../../pages/fiveSteps/BackgroundInformationSimple";
import CourtInformationSimple from "../../pages/fiveSteps/CourtInformationSimple";
import ChildrenInformationSimple from "../../pages/fiveSteps/ChildrenInformationSimple";
import RelationshipInformationSimple from "../../pages/fiveSteps/RelationshipInformationSimple";
import EmploymentDetailsSimple from "../../pages/fiveSteps/EmploymentDetailsSimple";
import IncomeAndBenefitsSimple from "../../pages/fiveSteps/IncomeAndBenefitsSimple";
import ExpensesSimple from "../../pages/fiveSteps/ExpensesSimple";
import AssetsSimple from "../../pages/fiveSteps/AssetsSimple";
import DebtsAndLiabilitiesSimple from "../../pages/fiveSteps/DebtsAndLiabilitiesSimple";
import OtherPersonsInHouseholdSimple from "../../pages/fiveSteps/OtherPersonsInHouseholdSimple";

import {
  updateMatterData,
  updateMatterReset,
} from "../../utils/Apis/matters/updateMatters/updateMatterDataActions";
import { selectMatterUpdateData } from "../../utils/Apis/matters/updateMatters/updateMatterDataSelectors";

import profile_summary from "../../assets/images/profile_summary.svg";
import background_information from "../../assets/images/background_information.svg";
import court_information from "../../assets/images/court_information.svg";
import children_information from "../../assets/images/children_information.svg";
import relationship_information from "../../assets/images/relationship_information.svg";
import employment_details from "../../assets/images/employment_details.svg";
import income_and_benefits from "../../assets/images/income_and_benefits.svg";
import expenses from "../../assets/images/expenses.svg";
import assets from "../../assets/images/assets.svg";
import debts_and_liabilities from "../../assets/images/debts_and_liabilities.svg";
import other_persons_in_household from "../../assets/images/other_persons_in_household.svg";

/**
 * ProfileSummaryPanel — the "View Information and Documents" screen.
 *
 * Ports the look of the old platform's matter profile page: a left column
 * listing every intake section (each opens that section's form in a modal to
 * view/edit the saved data) and a right column with the documents/folders panel.
 *
 * All data flows through the auth-server: the *Simple forms hydrate via
 * get_single_matter_data and save via update_matter (identical to the 5-step
 * accordion's save-as-you-go), and FolderStructure uses get_folders/create_folder.
 * The old page's per-section S3 upload table is intentionally dropped — that
 * storage does not exist on the new backend.
 *
 * Props:
 *   matterId    – matter number (string)
 *   matterData  – matter header row (client_id, province, …) for form context
 *   onBack      – () => void, return to the task list
 */

const SECTIONS = [
  { title: "Background Information", icon: background_information, component: "BackgroundInformationSimple" },
  { title: "Court Information", icon: court_information, component: "CourtInformationSimple" },
  { title: "Children Information", icon: children_information, component: "ChildrenInformationSimple" },
  { title: "Relationship Information", icon: relationship_information, component: "RelationshipInformationSimple" },
  { title: "Employment Details", icon: employment_details, component: "EmploymentDetailsSimple" },
  { title: "Income and Benefits", icon: income_and_benefits, component: "IncomeAndBenefitsSimple" },
  { title: "Expenses", icon: expenses, component: "ExpensesSimple" },
  { title: "Assets", icon: assets, component: "AssetsSimple" },
  { title: "Debts and Liabilities", icon: debts_and_liabilities, component: "DebtsAndLiabilitiesSimple" },
  { title: "Other Persons in Household", icon: other_persons_in_household, component: "OtherPersonsInHouseholdSimple" },
];

export default function ProfileSummaryPanel({ matterId, matterData, onBack }) {
  const dispatch = useDispatch();

  const [modalData, setModalData] = useState(null); // the open section, or null
  const [formData, setFormData] = useState({}); // latest body reported by the form
  const [isSaving, setIsSaving] = useState(false);

  // Per-form tab state (the *Simple forms drive Client / Opposing Party tabs).
  const [bgInfoActiveTab, setBgInfoActiveTab] = useState("Client");
  const [childActiveTab, setChildActiveTab] = useState(null);
  const [empActiveTab, setEmpActiveTab] = useState("Client");
  const [incomeActiveTab, setIncomeActiveTab] = useState("Client");
  const [expensesActiveTab, setExpensesActiveTab] = useState("Client");

  const selectUpdateMatter = useSelector(selectMatterUpdateData);

  // Clear any stale save result so the success effect below only reacts to a
  // save initiated from this screen.
  useEffect(() => {
    dispatch(updateMatterReset());
  }, [dispatch]);

  // After a save resolves, confirm and close the modal.
  useEffect(() => {
    if (selectUpdateMatter && isSaving) {
      setIsSaving(false);
      setModalData(null);
      toast.success("Data saved successfully", {
        position: "top-right",
        style: { borderRadius: "10px", background: "#FFF", color: "#000" },
      });
      dispatch(updateMatterReset());
    }
  }, [selectUpdateMatter, isSaving, dispatch]);

  const onUpdateFormData = (body) => setFormData(body);

  const handleSave = () => {
    if (!formData?.type) return;
    setIsSaving(true);
    dispatch(
      updateMatterData({ type: formData.type, matter_id: matterId, data: formData })
    );
  };

  const closeModal = () => {
    setModalData(null);
    setFormData({});
  };

  const renderForm = () => {
    if (!modalData) return null;
    switch (modalData.component) {
      case "BackgroundInformationSimple":
        return (
          <BackgroundInformationSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
            bgInfoActiveTab={bgInfoActiveTab}
            setBgInfoActiveTab={setBgInfoActiveTab}
          />
        );
      case "CourtInformationSimple":
        return (
          <CourtInformationSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
            matterData={matterData}
          />
        );
      case "ChildrenInformationSimple":
        return (
          <ChildrenInformationSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
            activeTab={childActiveTab}
            setActiveTab={setChildActiveTab}
          />
        );
      case "RelationshipInformationSimple":
        return (
          <RelationshipInformationSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
          />
        );
      case "EmploymentDetailsSimple":
        return (
          <EmploymentDetailsSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
            activeTab={empActiveTab}
            setActiveTab={setEmpActiveTab}
          />
        );
      case "IncomeAndBenefitsSimple":
        return (
          <IncomeAndBenefitsSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
            matterData={matterData}
            activeTab={incomeActiveTab}
            setActiveTab={setIncomeActiveTab}
          />
        );
      case "ExpensesSimple":
        return (
          <ExpensesSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
            matterData={matterData}
            activeTab={expensesActiveTab}
            setActiveTab={setExpensesActiveTab}
          />
        );
      case "AssetsSimple":
        return (
          <AssetsSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
            matterData={matterData}
          />
        );
      case "DebtsAndLiabilitiesSimple":
        return (
          <DebtsAndLiabilitiesSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
          />
        );
      case "OtherPersonsInHouseholdSimple":
        return (
          <OtherPersonsInHouseholdSimple
            matterId={matterId}
            onUpdateFormData={onUpdateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-summary-view">
      <button
        type="button"
        className="sm-back-btn"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "transparent",
          border: "none",
          color: "inherit",
          font: "inherit",
          cursor: "pointer",
          padding: "4px 0",
          marginBottom: "12px",
          opacity: 0.85,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Back to Tasks
      </button>

      <div className="row matterType">
        <div className="col-12 col-xxl-5">
          <div className="summary-container">
            <div className="head">
              <img src={profile_summary} alt="" />
              <div>Profile Summary</div>
            </div>
            <div className="body">
              {SECTIONS.map((item) => (
                <div className="profile-menu" key={item.component}>
                  <div className="info">
                    <img src={item.icon} alt="" />
                    <div>{item.title}</div>
                  </div>
                  <div className="actions">
                    <span
                      className="statusBadge"
                      onClick={() => setModalData(item)}
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
          <FolderStructure matter_id={matterId} matterData={matterData} />
        </div>
      </div>

      <GeneralModal
        show={!!modalData}
        changeShow={closeModal}
        handleClick={closeModal}
        heading={modalData && modalData.title}
        dialogClassName="matterModal"
        size="lg"
        isLoading={isSaving}
        actions={[
          { label: "Close", class: "btn btnPrimary blue", action: closeModal, disabled: isSaving },
          {
            label: isSaving ? "Saving…" : "Save",
            class: "btn btnDefault",
            action: handleSave,
            disabled: isSaving,
          },
        ]}
      >
        {renderForm()}
      </GeneralModal>
    </div>
  );
}

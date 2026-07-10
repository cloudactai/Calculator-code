/* eslint-disable react/no-direct-mutation-state */

import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router";

import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import MatterTaskList from "../../components/MatterWorkflow/MatterTaskList";
import MatterIntakeChoice from "../../components/MatterWorkflow/MatterIntakeChoice";
import ChildSupportChatPanel from "../../components/MatterWorkflow/ChildSupportChatPanel";
import SpousalSupportChatPanel from "../../components/MatterWorkflow/SpousalSupportChatPanel";
import MatterIntakeChatPanel from "../../components/MatterWorkflow/MatterIntakeChatPanel";

// --- Manual entry (editable Profile Summary forms) ---
import toast from "react-hot-toast";
import GeneralModal from "../../components/Matters/Modals/GeneralModal";
import BackgroundInformationSimple from "../fiveSteps/BackgroundInformationSimple";
import CourtInformationSimple from "../fiveSteps/CourtInformationSimple";
import ChildrenInformationSimple from "../fiveSteps/ChildrenInformationSimple";
import RelationshipInformationSimple from "../fiveSteps/RelationshipInformationSimple";
import EmploymentDetailsSimple from "../fiveSteps/EmploymentDetailsSimple";
import IncomeAndBenefitsSimple from "../fiveSteps/IncomeAndBenefitsSimple";
import ExpensesSimple from "../fiveSteps/ExpensesSimple";
import AssetsSimple from "../fiveSteps/AssetsSimple";
import DebtsAndLiabilitiesSimple from "../fiveSteps/DebtsAndLiabilitiesSimple";
import OtherPersonsInHouseholdSimple from "../fiveSteps/OtherPersonsInHouseholdSimple";
import {
  updateMatterData,
  updateMatterReset,
} from "../../utils/Apis/matters/updateMatters/updateMatterDataActions";
import {
  selectMatterUpdateData,
  selectMatterUpdateError,
} from "../../utils/Apis/matters/updateMatters/updateMatterDataSelectors";
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

import {
  getSingleMatter,
  getSingleMatterReset,
} from "../../utils/Apis/matters/getSingleMatter/getSingleMattersActions";
import {
  selectSingleMatterData,
  selectSingleMatterError,
  selectSingleMatterLoading,
} from "../../utils/Apis/matters/getSingleMatter/getSingleMattersSelectors";
import {
  getSingleMatterData,
  getSingleMatterDataReset,
} from "../../utils/Apis/matters/getSingleMatterData/getSingleMattersDataActions";
import { AUTH_ROUTES } from "../../routes/Routes.types";

/**
 * SingleMatter — task-list-based workflow for a divorce matter.
 *
 * Views:
 *   "tasks"          – the master task list (default)
 *   "intake_choice"  – AI Agent vs Manual entry selector
 *   "intake_chat"    – AI Agent chat for matter intake
 *   "child_support"  – AI Agent chat for child support calculation
 */

// Task definitions matching the Excel workflow document
const TASK_DEFS = [
  { id: "matter_intake", label: "MATTER INTAKE" },
  { id: "child_spousal_support", label: "CALCULATE CHILD & SPOUSAL SUPPORT" },
  { id: "draft_divorce_docs", label: "DRAFT DIVORCE APPLICATION DOCUMENTS" },
  { id: "review_forms", label: "REVIEW FORMS" },
  { id: "update_information", label: "UPDATE INFORMATION" },
  { id: "draft_separation", label: "DRAFT SEPARATION AGREEMENT" },
  { id: "file_separation", label: "FILE EXECUTED SEPARATION AGREEMENT" },
  { id: "file_support_order", label: "FILE CHILD AND SPOUSAL SUPPORT ORDER" },
  { id: "draft_divorce_order", label: "DRAFT DIVORCE ORDER" },
  { id: "file_divorce_cert", label: "FILE DIVORCE CERTIFICATE" },
  { id: "close_file", label: "CLOSE FILE" },
  { id: "general_query", label: "GENERAL QUERY" },
];

// Editable sections shown in the manual-entry "Profile Summary" list. Each opens
// a modal with the corresponding hydrated *Simple form; saving dispatches
// updateMatterData for that section.
const PROFILE_SECTIONS = [
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

const SingleMatter = () => {
  const { id } = useParams();
  console.log("[CLOUDACT-MATTER] SingleMatter mounted with id from URL params:", id);
  const dispatch = useDispatch();
  const history = useHistory();

  const [view, setView] = useState("tasks"); // tasks | intake_choice | intake_chat | support_choice | child_support | spousal_support
  const [matterData, setMatterData] = useState(null);
  const [taskStatuses, setTaskStatuses] = useState(() => {
    // Load persisted statuses from localStorage, falling back to not_started
    const storageKey = `matterTaskStatuses_${id}`;
    let saved = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      // ignore corrupt data
    }
    const initial = {};
    TASK_DEFS.forEach((t) => {
      initial[t.id] = saved[t.id] || "not_started";
    });
    return initial;
  });

  // Aggregated matter data for the chat context
  const [fullMatterData, setFullMatterData] = useState(null);

  // --- Manual entry (editable Profile Summary forms) ---
  const [modalData, setModalData] = useState(null); // which section modal is open
  const [manualFormData, setManualFormData] = useState({}); // latest edits from the open form
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false); // brief "Saved" flash after an auto-save
  const saveModeRef = useRef("auto"); // "auto" (blur/change) vs "manual" (Save button)
  const autoSaveTimer = useRef(null);
  const touchedRef = useRef(false); // true once the user edits the open section
  // Per-form active tabs (Client / Opposing Party etc.) — owned here so they
  // survive the form re-mounting and are available for save context.
  const [bgInfoActiveTab, setBgInfoActiveTab] = useState("Client");
  const [childActiveTab, setChildActiveTab] = useState(null);
  const [empActiveTab, setEmpActiveTab] = useState("Client");
  const [incomeActiveTab, setIncomeActiveTab] = useState("Client");
  const [expensesActiveTab, setExpensesActiveTab] = useState("Client");

  // Persist task statuses to localStorage whenever they change
  useEffect(() => {
    const storageKey = `matterTaskStatuses_${id}`;
    localStorage.setItem(storageKey, JSON.stringify(taskStatuses));
  }, [taskStatuses, id]);

  const { response } = useSelector((state) => state.userProfileInfo);
  const selectSingleMatter = useSelector(selectSingleMatterData);
  const singleMatterLoading = useSelector(selectSingleMatterLoading);
  const singleMatterError = useSelector(selectSingleMatterError);

  // Result of a per-section save (updateMatterData)
  const updateMatterResult = useSelector(selectMatterUpdateData);
  const updateMatterError = useSelector(selectMatterUpdateError);

  // Redux slices for matter sub-data
  const backgroundData = useSelector((state) => state.backgroundData?.data);
  const childrenData = useSelector((state) => state.childrenData?.data);
  const relationshipData = useSelector((state) => state.relationshipData?.data);
  const incomeBenefitsData = useSelector((state) => state.incomeBenefits?.data);
  const employmentData = useSelector((state) => state.employmentData?.data);
  const assetsData = useSelector((state) => state.assetsData?.data);
  const expenseData = useSelector((state) => state.expenseData?.data);
  const debtData = useSelector((state) => state.debtData?.data);
  const courtData = useSelector((state) => state.courtData?.data);

  // Fetch matter on mount
  useEffect(() => {
    dispatch(getSingleMatter(id));
  }, [dispatch, id]);

  // Set matter data from Redux
  useEffect(() => {
    const loadedMatter = selectSingleMatter?.body?.[0];
    if (loadedMatter && matterData?.matterNumber !== loadedMatter.matterNumber) {
      setMatterData(loadedMatter);
    } else if (!singleMatterLoading && !matterData) {
      setMatterData({ client_id: "", matterNumber: id });
    }
  }, [selectSingleMatter, matterData, singleMatterLoading, id]);

  // Once we have basic matter data, fetch the sub-data for chat context
  useEffect(() => {
    if (matterData) {
      dispatch(getSingleMatterData(id, "background"));
      dispatch(getSingleMatterData(id, "children"));
      dispatch(getSingleMatterData(id, "relationship"));
      dispatch(getSingleMatterData(id, "incomeBenefits"));
      dispatch(getSingleMatterData(id, "employment"));
      dispatch(getSingleMatterData(id, "assets"));
      dispatch(getSingleMatterData(id, "expenses"));
      dispatch(getSingleMatterData(id, "debt"));
      dispatch(getSingleMatterData(id, "court"));
    }
  }, [dispatch, id, matterData]);

  // Build aggregated matter data for the chat panel
  useEffect(() => {
    if (matterData) {
      setFullMatterData({
        client_id: matterData.client_id,
        matter_number: id,
        background_information: backgroundData?.body?.[0] || null,
        children_information: childrenData?.body || null,
        relationship_information: relationshipData?.body?.[0] || null,
        income_and_benefits: incomeBenefitsData?.body?.[0] || null,
        employment_information: employmentData?.body?.[0] || null,
        assets_information: assetsData?.body || null,
        expense_information: expenseData?.body?.[0] || null,
        debt_information: debtData?.body || null,
        court_information: courtData?.body?.[0] || null,
      });
    }
  }, [matterData, id, backgroundData, childrenData, relationshipData, incomeBenefitsData, employmentData, assetsData, expenseData, debtData, courtData]);

  const matterName =
    matterData?.client_id || history.location?.state?.clientName || "Matter";
  const matterWasNotFound = !singleMatterLoading && !selectSingleMatter?.body?.[0];

  // Build task list with statuses and disabled states
  // Only Matter Intake and Child & Spousal Support are enabled for now
  const tasks = TASK_DEFS.map((t) => {
    const enabled =
      t.id === "matter_intake" ||
      t.id === "child_spousal_support" ||
      t.id === "general_query";

    return {
      ...t,
      status: taskStatuses[t.id],
      disabled: !enabled,
    };
  });

  // Helper: update a task status in both React state and localStorage
  function persistTaskStatus(taskId, status) {
    const storageKey = `matterTaskStatuses_${id}`;
    setTaskStatuses((s) => {
      const updated = { ...s, [taskId]: status };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }

  function handleTaskStart(taskId) {
    if (taskId === "matter_intake") {
      if (taskStatuses.matter_intake === "not_started") {
        persistTaskStatus("matter_intake", "in_progress");
      }
      // Show the AI-vs-manual choice screen (handleIntakeChoice routes from there).
      setView("intake_choice");
    } else if (taskId === "child_spousal_support") {
      if (taskStatuses.child_spousal_support === "not_started") {
        persistTaskStatus("child_spousal_support", "in_progress");
      }
      setView("support_choice");
    } else if (taskId === "general_query") {
      // Future: open general query chat
    }
  }

  function handleIntakeChoice(choice) {
    if (choice === "ai") {
      setView("intake_chat");
    } else if (choice === "manual") {
      // 5-step accordion intake (hydrated forms that save as you go).
      history.push(`/5-steps/${id}`);
    }
  }

  function handleSupportChoice(choice) {
    if (choice === "ai") {
      setView("support_type_choice");
    } else if (choice === "manual") {
      // Store the matter number so the calculator welcome screen pre-selects it
      localStorage.setItem('selectedCalculatorMatterNumber', JSON.stringify(id));
      history.push("/SupportCalculator", { from: "matters" });
    }
  }

  function handleSupportTypeChoice(type) {
    if (type === "child") {
      setView("child_support");
    } else if (type === "spousal") {
      setView("spousal_support");
    }
  }

  function handleBackToTasks() {
    setView("tasks");
  }

  function handleChildSupportComplete() {
    setTaskStatuses((s) => ({
      ...s,
      child_spousal_support: "completed",
    }));
    setView("tasks");
  }

  // --- Manual entry handlers ---
  // Each *Simple form reports its current values up through here.
  function onUpdateFormData(data) {
    setManualFormData(data);
  }

  // Save the currently-open section via updateMatterData
  // (POST update_matter/{sid}/{matterId}/{type}). Explicit Save button.
  function handleManualSave() {
    if (!manualFormData?.type) return;
    saveModeRef.current = "manual";
    setIsSaving(true);
    dispatch(
      updateMatterData({
        type: manualFormData.type,
        matter_id: id,
        data: manualFormData,
      })
    );
  }

  function closeManualModal() {
    setModalData(null);
  }

  // The user has interacted with the open section — allow auto-save to run.
  function markTouched() {
    touchedRef.current = true;
  }

  // Reset per-section dirty/indicator state when a different section opens.
  useEffect(() => {
    touchedRef.current = false;
    setAutoSaved(false);
  }, [modalData]);

  // Save-as-you-go: once the user has edited the open section, save it shortly
  // after they stop typing / pick a dropdown option — silently, without closing.
  useEffect(() => {
    if (!modalData || !manualFormData?.type || !touchedRef.current) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveModeRef.current = "auto";
      dispatch(
        updateMatterData({
          type: manualFormData.type,
          matter_id: id,
          data: manualFormData,
        })
      );
    }, 800);
    return () => clearTimeout(autoSaveTimer.current);
  }, [manualFormData, modalData, id, dispatch]);

  // Fade the "Saved" flash after a moment.
  useEffect(() => {
    if (!autoSaved) return;
    const t = setTimeout(() => setAutoSaved(false), 2000);
    return () => clearTimeout(t);
  }, [autoSaved]);

  // React to a completed save. Auto-saves stay silent and keep the form open;
  // an explicit Save closes the modal, refreshes, and toasts.
  useEffect(() => {
    if (!updateMatterResult) return;
    setIsSaving(false);
    const wasManual = saveModeRef.current === "manual";
    saveModeRef.current = "auto";
    dispatch(updateMatterReset());

    if (!wasManual) {
      setAutoSaved(true);
      return;
    }

    setModalData(null);
    if (taskStatuses.matter_intake !== "completed") {
      persistTaskStatus("matter_intake", "in_progress");
    }
    // Refresh this section so reopening (and the chat context) show saved
    // values. The court form saves under "courtInfo" but is fetched as "court".
    if (manualFormData?.type) {
      const refetchType =
        manualFormData.type === "courtInfo" ? "court" : manualFormData.type;
      dispatch(getSingleMatterData(id, refetchType));
    }
    toast.success("Data Successfully Saved", {
      position: "top-right",
      style: { borderRadius: "10px", background: "#FFF", color: "#000" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateMatterResult]);

  // Don't leave the Save button stuck on "Saving…" if the request fails.
  useEffect(() => {
    if (updateMatterError) {
      setIsSaving(false);
      toast.error("Could not save. Please try again.", { position: "top-right" });
      dispatch(updateMatterReset());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateMatterError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(getSingleMatterDataReset("relationship"));
      dispatch(getSingleMatterDataReset("employment"));
      dispatch(getSingleMatterDataReset("assets"));
      dispatch(getSingleMatterDataReset("children"));
      dispatch(getSingleMatterDataReset("incomeBenefits"));
      dispatch(getSingleMatterDataReset("expenses"));
      dispatch(getSingleMatterDataReset("debt"));
      dispatch(getSingleMatterReset());
    };
  }, [dispatch]);

  const matterLoading = singleMatterLoading && !matterData;

  // Chat views lock the page to the viewport so only the chat window scrolls.
  const isChatView = ["intake_chat", "child_support", "spousal_support"].includes(
    view
  );

  // Chat panel titles are shown in the page header (the panels no longer render
  // their own header row).
  const CHAT_TITLES = {
    intake_chat: "Matter Intake — AI Assistant",
    child_support: "Child Support Calculator — AI Assistant",
    spousal_support: "Spousal Support Calculator — AI Assistant",
  };

  return (
    <Layout title={`Welcome ${response?.username ? response.username : ""} `}>
      {matterLoading ? (
        <Loader isLoading={matterLoading} />
      ) : (
        <div className={`single-matter panel trans${isChatView ? " has-chat" : ""}`}>
          {/* Matter header. In a chat view this row carries "Back to Tasks" and
              the panel title so the chat card itself needs no header. */}
          <div className="pHead">
            {isChatView ? (
              <div className="sm-chat-head">
                <button
                  type="button"
                  className="mw-chat-panel__back"
                  onClick={() => setView("tasks")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                  Back to Tasks
                </button>
                <h3 className="sm-chat-head__title">{CHAT_TITLES[view]}</h3>
              </div>
            ) : (
              <button
                type="button"
                className="sm-back-btn"
                onClick={() => history.push(AUTH_ROUTES.MATTER_DASHBOARD)}
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to Matters
              </button>
            )}
            <div className="info-container">
              <div className="info-row">
                <div className="label">Client Name:</div>
                <div className="value">{matterName}</div>
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
            {matterWasNotFound && (
              <div className="alert alert-warning" role="alert">
                {singleMatterError
                  ? "Matter details could not be loaded. You can still continue, or go back to Matters and refresh."
                  : "Matter details are still being created. You can continue, or go back to Matters and refresh."}
              </div>
            )}

            {/* Task list view (default) */}
            {view === "tasks" && (
              <MatterTaskList
                tasks={tasks}
                onStart={handleTaskStart}
                matterName={matterName}
              />
            )}

            {/* Matter Intake choice: AI or Manual */}
            {view === "intake_choice" && (
              <MatterIntakeChoice
                matterName={matterName}
                onChoose={handleIntakeChoice}
                onBack={handleBackToTasks}
              />
            )}

            {/* Manual entry: editable Profile Summary with hydrated forms
                that save per section (restored from the pre-migration app). */}
            {view === "manual_forms" && (
              <div className="manual-matter-forms">
                <div className="mw-intake-choice__header">
                  <button
                    className="mw-chat-panel__back"
                    onClick={() => setView("intake_choice")}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 12H5" />
                      <path d="M12 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <h3 className="mw-intake-choice__title">
                    Manual Entry{matterName ? ` — ${matterName}` : ""}
                  </h3>
                </div>

                <div className="row matterType">
                  <div className="col-12">
                    <div className="summary-container">
                      <div className="head">
                        <img src={profile_summary} alt="" />
                        <div>Profile Summary</div>
                      </div>
                      <div className="body">
                        {PROFILE_SECTIONS.map((item) => (
                          <div className="profile-menu" key={item.component}>
                            <div className="info">
                              <img src={item.icon} alt="" />
                              <div>{item.title}</div>
                            </div>
                            <div className="actions">
                              <span
                                className="statusBadge"
                                onClick={() => {
                                  setManualFormData({});
                                  setModalData(item);
                                }}
                              >
                                View / Edit
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section editor modal — hydrates + saves the chosen section */}
                <GeneralModal
                  show={!!modalData}
                  changeShow={closeManualModal}
                  handleContinue={handleManualSave}
                  heading={modalData?.title}
                  dialogClassName="matterModal"
                  isLoading={isSaving}
                >
                  <div onInput={markTouched} onClick={markTouched}>
                  {autoSaved && (
                    <div
                      style={{
                        textAlign: "right",
                        fontSize: "12px",
                        color: "#22c55e",
                        marginBottom: "4px",
                      }}
                    >
                      ✓ Saved
                    </div>
                  )}
                  {modalData?.component === "BackgroundInformationSimple" && (
                    <BackgroundInformationSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                      bgInfoActiveTab={bgInfoActiveTab}
                      setBgInfoActiveTab={setBgInfoActiveTab}
                    />
                  )}
                  {modalData?.component === "CourtInformationSimple" && (
                    <CourtInformationSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                      matterData={matterData}
                    />
                  )}
                  {modalData?.component === "ChildrenInformationSimple" && (
                    <ChildrenInformationSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                      activeTab={childActiveTab}
                      setActiveTab={setChildActiveTab}
                    />
                  )}
                  {modalData?.component === "RelationshipInformationSimple" && (
                    <RelationshipInformationSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                    />
                  )}
                  {modalData?.component === "EmploymentDetailsSimple" && (
                    <EmploymentDetailsSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                      activeTab={empActiveTab}
                      setActiveTab={setEmpActiveTab}
                    />
                  )}
                  {modalData?.component === "IncomeAndBenefitsSimple" && (
                    <IncomeAndBenefitsSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                      matterData={matterData}
                      activeTab={incomeActiveTab}
                      setActiveTab={setIncomeActiveTab}
                    />
                  )}
                  {modalData?.component === "ExpensesSimple" && (
                    <ExpensesSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                      matterData={matterData}
                      activeTab={expensesActiveTab}
                      setActiveTab={setExpensesActiveTab}
                    />
                  )}
                  {modalData?.component === "AssetsSimple" && (
                    <AssetsSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                      matterData={matterData}
                    />
                  )}
                  {modalData?.component === "DebtsAndLiabilitiesSimple" && (
                    <DebtsAndLiabilitiesSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                    />
                  )}
                  {modalData?.component === "OtherPersonsInHouseholdSimple" && (
                    <OtherPersonsInHouseholdSimple
                      matterId={id}
                      onUpdateFormData={onUpdateFormData}
                    />
                  )}
                  </div>
                </GeneralModal>
              </div>
            )}

            {/* Matter Intake via AI chat */}
            {view === "intake_chat" && (
              <MatterIntakeChatPanel
                matterData={fullMatterData}
                matterId={id}
                onComplete={() => {
                  // Fires on each incremental section save — mark the task underway
                  // (there is no reliable "all sections done" signal yet). The user
                  // stays in the chat and returns via "Back to Tasks".
                  if (taskStatuses.matter_intake !== "completed") {
                    persistTaskStatus("matter_intake", "in_progress");
                  }
                }}
              />
            )}

            {/* Child & Spousal Support choice: AI or Manual */}
            {view === "support_choice" && (
              <MatterIntakeChoice
                matterName={matterName}
                onChoose={handleSupportChoice}
                onBack={handleBackToTasks}
                title="Child & Spousal Support"
                subtitle="How do you want to calculate support?"
                aiFeatures={[
                  "AI-guided support calculation",
                  "Handles missing info automatically",
                  "What-if scenario support",
                  "Generates PDF report",
                ]}
                manualFeatures={[
                  "Traditional calculator interface",
                  "Enter income & expense data manually",
                  "Federal & provincial guidelines",
                  "Generate standard reports",
                ]}
                aiCta="Start Chat"
                manualCta="Open Calculator"
              />
            )}

            {/* Support type choice: Child or Spousal */}
            {view === "support_type_choice" && (
              <MatterIntakeChoice
                matterName={matterName}
                onChoose={handleSupportTypeChoice}
                onBack={() => setView("support_choice")}
                title="AI Support Calculator"
                subtitle="Which type of support do you want to calculate?"
                aiLabel="Child Support"
                aiCta="Start Child Support Chat"
                aiFeatures={[
                  "Federal Child Support Guidelines",
                  "Handles sole, shared & split custody",
                  "Schedule I table lookups",
                  "Explains results in plain language",
                ]}
                manualLabel="Spousal Support"
                manualCta="Start Spousal Support Chat"
                manualFeatures={[
                  "SSAG without-child & with-child formulas",
                  "AI picks the correct formula automatically",
                  "Iterative tax-converging calculation",
                  "Duration under Rule of 65",
                ]}
                aiValue="child"
                manualValue="spousal"
              />
            )}

            {/* Child Support chat */}
            {view === "child_support" && (
              <ChildSupportChatPanel
                matterData={fullMatterData}
                matterId={id}
                onComplete={handleChildSupportComplete}
              />
            )}

            {/* Spousal Support chat */}
            {view === "spousal_support" && (
              <SpousalSupportChatPanel
                matterData={fullMatterData}
                matterId={id}
                onComplete={() => {
                  setTaskStatuses((s) => ({
                    ...s,
                    child_spousal_support: "completed",
                  }));
                  setView("tasks");
                }}
              />
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SingleMatter;

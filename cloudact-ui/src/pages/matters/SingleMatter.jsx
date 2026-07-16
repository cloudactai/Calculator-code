/* eslint-disable react/no-direct-mutation-state */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router";

import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import MatterTaskList from "../../components/MatterWorkflow/MatterTaskList";
import MatterIntakeChoice from "../../components/MatterWorkflow/MatterIntakeChoice";
import ChildSupportChatPanel from "../../components/MatterWorkflow/ChildSupportChatPanel";
import SpousalSupportChatPanel from "../../components/MatterWorkflow/SpousalSupportChatPanel";
import MatterIntakeChatPanel from "../../components/MatterWorkflow/MatterIntakeChatPanel";
import ProfileSummaryPanel from "../../components/MatterWorkflow/ProfileSummaryPanel";

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
import { getMatterData } from "../../utils/Apis/matters/getMatterData/getMatterDataActions";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import { formsService } from "../../services/formsService";

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

const initialTaskStatuses = () => Object.fromEntries(
  TASK_DEFS.map((task) => [task.id, "not_started"])
);

const SingleMatter = () => {
  const { id } = useParams();
  console.log("[CLOUDACT-MATTER] SingleMatter mounted with id from URL params:", id);
  const dispatch = useDispatch();
  const history = useHistory();

  const [view, setView] = useState("tasks"); // tasks | intake_choice | intake_chat | support_choice | child_support | spousal_support
  const [matterData, setMatterData] = useState(null);
  const [taskStatuses, setTaskStatuses] = useState(initialTaskStatuses);

  // Aggregated matter data for the chat context
  const [fullMatterData, setFullMatterData] = useState(null);
  // Fresh database snapshot used only by matter intake. It is deliberately
  // separate from the legacy support-calculator context above.
  const [intakeMatterData, setIntakeMatterData] = useState(null);

  useEffect(() => {
    let active = true;
    setTaskStatuses(initialTaskStatuses());
    formsService.listTaskStates(id)
      .then((states) => {
        if (!active) return;
        setTaskStatuses({
          ...initialTaskStatuses(),
          ...Object.fromEntries(
            (Array.isArray(states) ? states : []).map(({ taskKey, status }) => [taskKey, status])
          ),
        });
      })
      .catch((error) => {
        // The task list stays usable; a failed request must never fall back to browser storage.
        console.error("Unable to load matter task states.", error);
      });
    return () => { active = false; };
  }, [id]);

  const { response } = useSelector((state) => state.userProfileInfo);
  const selectSingleMatter = useSelector(selectSingleMatterData);
  const singleMatterLoading = useSelector(selectSingleMatterLoading);
  const singleMatterError = useSelector(selectSingleMatterError);

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
    if (loadedMatter) {
      setMatterData(loadedMatter);
    } else if (!singleMatterLoading) {
      setMatterData((current) => current || { client_id: "", matterNumber: id });
    }
  }, [selectSingleMatter, singleMatterLoading, id]);

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
  // Forms work is backed by the new Forms API; remaining workflow steps stay
  // unavailable until their corresponding database-backed experiences exist.
  const tasks = TASK_DEFS.map((t) => {
    const enabled =
      t.id === "matter_intake" ||
      t.id === "child_spousal_support" ||
      t.id === "draft_divorce_docs" ||
      t.id === "review_forms" ||
      t.id === "general_query";

    return {
      ...t,
      status: taskStatuses[t.id],
      disabled: !enabled,
    };
  });

  function persistTaskStatus(taskId, status) {
    setTaskStatuses((current) => ({ ...current, [taskId]: status }));
    return formsService.setTaskState(id, taskId, status).catch((error) => {
      console.error("Unable to save matter task state.", error);
      // Reload the authoritative state if the optimistic update did not persist.
      return formsService.listTaskStates(id).then((states) => {
        setTaskStatuses({
          ...initialTaskStatuses(),
          ...Object.fromEntries(
            (Array.isArray(states) ? states : []).map(({ taskKey, status: savedStatus }) => [taskKey, savedStatus])
          ),
        });
      }).catch((refreshError) => {
        console.error("Unable to refresh matter task states.", refreshError);
      });
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
    } else if (taskId === "draft_divorce_docs") {
      if (taskStatuses.draft_divorce_docs === "not_started") {
        persistTaskStatus("draft_divorce_docs", "in_progress");
      }
      history.push("/forms/create-new");
    } else if (taskId === "review_forms") {
      if (taskStatuses.review_forms === "not_started") {
        persistTaskStatus("review_forms", "in_progress");
      }
      setView("profile_summary");
    } else if (taskId === "general_query") {
      // Future: open general query chat
    }
  }

  async function handleIntakeChoice(choice) {
    if (choice === "ai") {
      // Manual entry and earlier AI conversations write to the same database.
      // Refresh now so the agent sees those values before asking its first question.
      setIntakeMatterData(null);
      setView("intake_chat");
      const storedMatter = await dispatch(getMatterData(id));
      setIntakeMatterData(
        storedMatter || {
          matter_number: id,
          client_id: matterData?.client_id || "",
        }
      );
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
    persistTaskStatus("child_spousal_support", "completed");
    setView("tasks");
  }

  function handleMatterIntakeComplete() {
    persistTaskStatus("matter_intake", "completed");
    // Financial year and valuation date live on the matter header rather than
    // in the section row payloads. Reload it after the AI save so View / Edit
    // does not keep showing the pre-intake blank values.
    dispatch(getSingleMatter(id));
  }

  function handleViewInformation() {
    // The user may have just completed either intake path. Always refresh the
    // small matter header before opening forms that depend on its year/date.
    dispatch(getSingleMatter(id));
    setView("profile_summary");
  }

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

  // Client / matter identity — shown in the header in every view.
  const matterInfo = (
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
  );

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
              <>
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
                {matterInfo}
              </>
            ) : (
              <div
                className="sm-head-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px 30px",
                }}
              >
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
                {matterInfo}
              </div>
            )}
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
                onViewInfo={handleViewInformation}
              />
            )}

            {/* View Information and Documents: profile summary + folders */}
            {view === "profile_summary" && (
              <ProfileSummaryPanel
                matterId={id}
                matterData={matterData}
                onBack={handleBackToTasks}
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


            {/* Matter Intake via AI chat */}
            {view === "intake_chat" && (
              intakeMatterData ? (
                <MatterIntakeChatPanel
                  matterData={intakeMatterData}
                  matterId={id}
                  onComplete={handleMatterIntakeComplete}
                  onBack={() => setView("tasks")}
                  onSaved={(savedMatter) => {
                    setIntakeMatterData(savedMatter);
                    dispatch(getSingleMatter(id));
                  }}
                />
              ) : (
                <Loader isLoading />
              )
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
                  persistTaskStatus("child_spousal_support", "completed");
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

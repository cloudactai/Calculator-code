/* eslint-disable react/no-direct-mutation-state */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router";

import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import MatterTaskList from "../../components/MatterWorkflow/MatterTaskList";
import MatterIntakeChoice from "../../components/MatterWorkflow/MatterIntakeChoice";
import ChildSupportChatPanel from "../../components/MatterWorkflow/ChildSupportChatPanel";

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

const SingleMatter = () => {
  const { id } = useParams();
  console.log("[CLOUDACT-MATTER] SingleMatter mounted with id from URL params:", id);
  const dispatch = useDispatch();
  const history = useHistory();

  const [view, setView] = useState("tasks"); // tasks | intake_choice | intake_chat | support_choice | child_support
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

  // Persist task statuses to localStorage whenever they change
  useEffect(() => {
    const storageKey = `matterTaskStatuses_${id}`;
    localStorage.setItem(storageKey, JSON.stringify(taskStatuses));
  }, [taskStatuses, id]);

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

  const matterName = matterData?.client_id || "Matter";
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
      history.push(`/5-steps/${id}`);
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
      // Navigate to existing 5-step form
      history.push(`/5-steps/${id}`);
    }
  }

  function handleSupportChoice(choice) {
    if (choice === "ai") {
      setView("child_support");
    } else if (choice === "manual") {
      // Store the matter number so the calculator welcome screen pre-selects it
      localStorage.setItem('selectedCalculatorMatterNumber', JSON.stringify(id));
      history.push("/SupportCalculator", { from: "matters" });
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

  return (
    <Layout title={`Welcome ${response?.username ? response.username : ""} `}>
      {matterLoading ? (
        <Loader isLoading={matterLoading} />
      ) : (
        <div className="single-matter panel trans">
          {/* Matter header */}
          <div className="pHead">
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

            {/* Matter Intake via AI chat */}
            {view === "intake_chat" && (
              <ChildSupportChatPanel
                matterData={fullMatterData}
                matterId={id}
                onBack={handleBackToTasks}
                onComplete={() => {
                  setTaskStatuses((s) => ({
                    ...s,
                    matter_intake: "completed",
                  }));
                  setView("tasks");
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

            {/* Child Support chat */}
            {view === "child_support" && (
              <ChildSupportChatPanel
                matterData={fullMatterData}
                matterId={id}
                onBack={handleBackToTasks}
                onComplete={handleChildSupportComplete}
              />
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SingleMatter;

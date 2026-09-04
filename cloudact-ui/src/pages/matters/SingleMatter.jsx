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
import UpdateInformationChatPanel from "../../components/MatterWorkflow/UpdateInformationChatPanel";
import ProfileSummaryPanel from "../../components/MatterWorkflow/ProfileSummaryPanel";
import AgreementTypeList from "../../components/MatterWorkflow/AgreementTypeList";
import AgreementChatPanel from "../../components/MatterWorkflow/AgreementChatPanel";
import { getAgreementType } from "../../components/MatterWorkflow/agreementTypes";

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
import dataAxios from "../../utils/dataAxios";

/**
 * SingleMatter — task-list-based workflow for a divorce matter.
 *
 * Views:
 *   "tasks"          – the master task list (default)
 *   "intake_choice"  – AI Agent vs Manual entry selector
 *   "intake_chat"    – AI Agent chat for matter intake
 *   "child_support"  – AI Agent chat for child support calculation
 *   "update_information" – AI Agent chat that edits values already on file
 */

// Task definitions matching the Excel workflow document
const TASK_DEFS = [
  { id: "matter_intake", label: "MATTER INTAKE" },
  { id: "matter_intake_tax_return", label: "MATTER INTAKE USING TAX RETURN" },
  { id: "child_spousal_support", label: "CALCULATE CHILD & SPOUSAL SUPPORT" },
  { id: "draft_divorce_docs", label: "DRAFT DIVORCE APPLICATION DOCUMENTS" },
  { id: "review_forms", label: "REVIEW FORMS" },
  { id: "update_information", label: "UPDATE INFORMATION" },
  { id: "draft_agreements", label: "DRAFT AGREEMENTS" },
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
  const dispatch = useDispatch();
  const history = useHistory();

  const [view, setView] = useState("tasks"); // tasks | intake_choice | intake_chat | support_choice | child_support | spousal_support
  const [matterData, setMatterData] = useState(null);
  const [taskStatuses, setTaskStatuses] = useState(initialTaskStatuses);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Aggregated matter data for the chat context
  const [fullMatterData, setFullMatterData] = useState(null);
  // Latest saved calculation report for this matter (used for chat pre-fill)
  const [latestCalcReport, setLatestCalcReport] = useState(undefined); // undefined = not fetched yet
  // Fresh database snapshot used only by matter intake. It is deliberately
  // separate from the legacy support-calculator context above.
  const [intakeMatterData, setIntakeMatterData] = useState(null);
  // Fresh database snapshot for child / spousal support chats. Uses the same
  // getMatterData() call as intake so all fields arrive in one response.
  const [supportMatterData, setSupportMatterData] = useState(null);
  // Same snapshot shape, loaded separately for Update Information so the two
  // chats can never show each other's stale view of the record.
  const [updateMatterData, setUpdateMatterData] = useState(null);
  // Draft Agreements: which registry entry was chosen (AgreementTypeList),
  // and its own fresh snapshot — same reasoning as updateMatterData above.
  const [selectedAgreementType, setSelectedAgreementType] = useState(null);
  const [agreementMatterData, setAgreementMatterData] = useState(null);

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

  // Fetch latest saved calculation report for pre-filling the chat
  useEffect(() => {
    if (!matterData) return;
    let active = true;
    console.log("[SingleMatter] Fetching latest calc report for matter:", id);
    dataAxios
      .get(`matters/${id}/reports/latest`)
      .then((res) => {
        console.log("[SingleMatter] /reports/latest raw response:", JSON.stringify(res.data).slice(0, 500));
        const report = res.data?.data?.body ?? res.data?.data ?? null;
        if (active) {
          console.log("[SingleMatter] latestCalcReport parsed:", report ? JSON.stringify({ id: report.id, hasInputData: !!report.inputData, hasFullState: !!report.inputData?._fullState, hasScreen2: !!report.inputData?._fullState?.screen2 }) : "null (no saved calculation)");
          if (report?.inputData?._fullState?.screen2) {
            const s2 = report.inputData._fullState.screen2;
            console.log("[SingleMatter] screen2 incomes found — party1:", s2.totalIncomeParty1, "party2:", s2.totalIncomeParty2);
          }
          setLatestCalcReport(report);
        }
      })
      .catch((err) => {
        console.warn("[SingleMatter] Failed to fetch latest calc report:", err);
        if (active) setLatestCalcReport(null);
      });
    return () => { active = false; };
  }, [id, matterData]);

  // Build aggregated matter data for the chat panel
  // Wait until the latest calc report fetch completes (latestCalcReport !== undefined)
  useEffect(() => {
    if (matterData && latestCalcReport !== undefined) {
      // Extract income from the last saved calculation if available
      const fullState = latestCalcReport?.inputData?._fullState;
      let incomeInfo = null;
      if (fullState?.screen2) {
        const s2 = fullState.screen2;
        incomeInfo = {
          report_id: latestCalcReport.id,
          party1_income: s2.totalIncomeParty1,
          party2_income: s2.totalIncomeParty2,
          party1_province: fullState.background?.party1Province,
          party2_province: fullState.background?.party2Province,
        };
      }

      console.log("[SingleMatter] Building fullMatterData with latestCalcReport:", latestCalcReport ? `id=${latestCalcReport.id}` : "none", "incomeInfo:", incomeInfo);

      setFullMatterData({
        client_id: matterData.client_id,
        matter_number: id,
        background_information: backgroundData?.body?.[0] || null,
        children_information: childrenData?.body || null,
        relationship_information: relationshipData?.body?.[0] || null,
        // Income from the last saved calculation (not from MatterRecord)
        last_calculation: incomeInfo,
        last_calculation_full: fullState || null,
        income_benefits_information: incomeBenefitsData?.body || null,
        employment_information: employmentData?.body?.[0] || null,
        assets_information: assetsData?.body || null,
        expense_information: expenseData?.body?.[0] || null,
        debt_information: debtData?.body || null,
        court_information: courtData?.body?.[0] || null,
      });
    }
  }, [matterData, id, latestCalcReport, backgroundData, childrenData, relationshipData, incomeBenefitsData, employmentData, assetsData, expenseData, debtData, courtData]);

  const matterName =
    matterData?.client_id || history.location?.state?.clientName || "Matter";
  const matterWasNotFound = !singleMatterLoading && !selectSingleMatter?.body?.[0];

  // Build task list with statuses and disabled states
  // Forms work is backed by the new Forms API; remaining workflow steps stay
  // unavailable until their corresponding database-backed experiences exist.
  const tasks = TASK_DEFS.map((t) => {
    const enabled =
      t.id === "matter_intake" ||
      t.id === "matter_intake_tax_return" ||
      t.id === "child_spousal_support" ||
      t.id === "draft_divorce_docs" ||
      t.id === "review_forms" ||
      t.id === "update_information" ||
      t.id === "draft_agreements" ||
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

  async function handleTaskStart(taskId) {
    if (taskId === "matter_intake") {
      if (taskStatuses.matter_intake === "not_started") {
        persistTaskStatus("matter_intake", "in_progress");
      }
      // Show the AI-vs-manual choice screen (handleIntakeChoice routes from there).
      setView("intake_choice");
    } else if (taskId === "matter_intake_tax_return") {
      if (taskStatuses.matter_intake_tax_return === "not_started") {
        persistTaskStatus("matter_intake_tax_return", "in_progress");
      }
      // T1 upload → AI extraction → review → saves into THIS matter's intake.
      history.push(AUTH_ROUTES.T1_UPLOAD, { matterNumber: id });
    } else if (taskId === "child_spousal_support") {
      if (taskStatuses.child_spousal_support === "not_started") {
        persistTaskStatus("child_spousal_support", "in_progress");
      }
      setView("support_choice");
    } else if (taskId === "draft_divorce_docs") {
      if (taskStatuses.draft_divorce_docs === "not_started") {
        persistTaskStatus("draft_divorce_docs", "in_progress");
      }
      // Carry the matter number through so the create-new form page pre-selects it.
      history.push("/forms/create-new", { matterNumber: id });
    } else if (taskId === "review_forms") {
      if (taskStatuses.review_forms === "not_started") {
        persistTaskStatus("review_forms", "in_progress");
      }
      setView("profile_summary");
    } else if (taskId === "update_information") {
      // Deliberately never marked completed: changing information is recurring
      // work, so this task stays on Resume for the life of the matter. Any
      // status other than in_progress is corrected on open, which also reverts
      // matters an earlier build had already flipped to completed.
      if (taskStatuses.update_information !== "in_progress") {
        persistTaskStatus("update_information", "in_progress");
      }
      // The agent may only change values that are already on file, so it needs
      // the current database record before it asks its first question.
      setUpdateMatterData(null);
      setView("update_information");
      const storedMatter = await dispatch(getMatterData(id));
      setUpdateMatterData(
        storedMatter || {
          matter_number: id,
          client_id: matterData?.client_id || "",
        }
      );
    } else if (taskId === "draft_agreements") {
      // Recurring work like Update Information — an agreement can be revised
      // after a first draft, so this never auto-completes.
      if (taskStatuses.draft_agreements !== "in_progress") {
        persistTaskStatus("draft_agreements", "in_progress");
      }
      setView("agreement_choice");
    } else if (taskId === "general_query") {
      // Future: open general query chat
    }
  }

  async function handleAgreementTypeChoice(agreementTypeId) {
    setSelectedAgreementType(agreementTypeId);
    setAgreementMatterData(null);
    setView("agreement_chat");
    const storedMatter = await dispatch(getMatterData(id));
    setAgreementMatterData(
      storedMatter || {
        matter_number: id,
        client_id: matterData?.client_id || "",
      }
    );
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

  async function handleSupportTypeChoice(type) {
    if (type === "child" || type === "spousal") {
      setSupportMatterData(null);
      setView(type === "child" ? "child_support" : "spousal_support");
      const storedMatter = await dispatch(getMatterData(id));
      console.log("[SingleMatter] getMatterData for support chat:", storedMatter ? Object.keys(storedMatter) : "null");
      console.log("[SingleMatter] background rows:", storedMatter?.background?.length ?? 0, "children rows:", storedMatter?.children?.length ?? 0, "income_benefits rows:", storedMatter?.income_benefits?.length ?? 0);
      setSupportMatterData(
        storedMatter || {
          matter_number: id,
          client_id: matterData?.client_id || "",
        }
      );
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

  async function handleToggleMatterStatus() {
    if (!matterData || togglingStatus) return;
    const currentStatus = matterData.status ?? 0;
    const newStatus = currentStatus === 1 ? 0 : 1;
    setTogglingStatus(true);
    try {
      await dataAxios.patch(`update_matter_status/${id}`, { status: newStatus });

      // When marking as done, save computation results from the latest calc report
      if (newStatus === 1 && latestCalcReport) {
        const fullState = latestCalcReport.inputData?._fullState;
        await dataAxios.post(`matters/${id}/computation-results`, {
          calculationType: latestCalcReport.calculationType || "child_support",
          status: "completed",
          inputSummary: {
            party1_name: latestCalcReport.inputData?.party1_name,
            party2_name: latestCalcReport.inputData?.party2_name,
            party1_income: latestCalcReport.inputData?.party1_income,
            party2_income: latestCalcReport.inputData?.party2_income,
            children: latestCalcReport.inputData?.children,
            party1_province: fullState?.background?.party1Province,
            party2_province: fullState?.background?.party2Province,
          },
          resultSummary: latestCalcReport.resultData || {},
        }).catch((err) => console.warn("Failed to save computation result:", err));
      }

      setMatterData((prev) => ({ ...prev, status: newStatus }));
      dispatch(getSingleMatter(id));
    } catch (err) {
      console.error("Failed to toggle matter status:", err);
    } finally {
      setTogglingStatus(false);
    }
  }

  function handleViewCalcResults() {
    if (!latestCalcReport) {
      alert("No calculation results saved for this matter yet.");
      return;
    }
    localStorage.setItem(
      "viewCalculationData",
      JSON.stringify({
        inputData: latestCalcReport.inputData,
        resultData: latestCalcReport.resultData,
        calculationType: latestCalcReport.calculationType,
      })
    );
    localStorage.setItem(
      "selectedCalculatorMatterNumber",
      JSON.stringify(id)
    );
    localStorage.setItem("viewOnlyCalcResults", "true");
    history.push("/calculator");
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
  const isChatView = [
    "intake_chat",
    "child_support",
    "spousal_support",
    "update_information",
  ].includes(view);
  // Draft Agreements gets the same viewport lock, but split into a chat pane
  // and a live document pane instead of one full-width chat column.
  const isSplitView = view === "agreement_chat";

  // Chat panel titles are shown in the page header (the panels no longer render
  // their own header row).
  const CHAT_TITLES = {
    intake_chat: "Matter Intake — CloudAct",
    child_support: "Child Support Calculator — CloudAct",
    spousal_support: "Spousal Support Calculator — CloudAct",
    update_information: "Update Information — CloudAct",
    agreement_chat: `${getAgreementType(selectedAgreementType)?.label || "Draft Agreement"} — CloudAct`,
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
        <div className={`single-matter panel trans${isChatView ? " has-chat" : ""}${isSplitView ? " has-split" : ""}`}>
          {/* Matter header. In a chat view this row carries "Back to Tasks" and
              the panel title so the chat card itself needs no header. */}
          <div className="pHead">
            {isChatView || isSplitView ? (
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
              <>
                <MatterTaskList
                  tasks={tasks}
                  onStart={handleTaskStart}
                  onViewInfo={handleViewInformation}
                  onViewCalcResults={handleViewCalcResults}
                  matterStatus={matterData?.status ?? 0}
                  onToggleStatus={handleToggleMatterStatus}
                  togglingStatus={togglingStatus}
                />
              </>
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
                manualLabel="Manual Intake"
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

            {/* Update Information via AI chat */}
            {view === "update_information" && (
              updateMatterData ? (
                <UpdateInformationChatPanel
                  matterData={updateMatterData}
                  matterId={id}
                  onBack={handleBackToTasks}
                  onSaved={(savedMatter) => {
                    setUpdateMatterData(savedMatter);
                    // The change may have moved a matter-header field
                    // (valuation date, financial year), so re-read the header.
                    dispatch(getSingleMatter(id));
                  }}
                />
              ) : (
                <Loader isLoading />
              )
            )}

            {/* Draft Agreements: pick an agreement type from the registry */}
            {view === "agreement_choice" && (
              <AgreementTypeList
                matterName={matterName}
                onChoose={handleAgreementTypeChoice}
                onBack={handleBackToTasks}
              />
            )}

            {/* Draft Agreements: split chat + live document */}
            {view === "agreement_chat" && (
              agreementMatterData ? (
                <AgreementChatPanel
                  matterData={agreementMatterData}
                  matterId={id}
                  agreementType={selectedAgreementType}
                  onBack={handleBackToTasks}
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
                matterData={supportMatterData}
                matterId={id}
                onComplete={handleChildSupportComplete}
              />
            )}

            {/* Spousal Support chat */}
            {view === "spousal_support" && (
              <SpousalSupportChatPanel
                matterData={supportMatterData}
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

import React, { useState } from "react";
import "./MatterWorkflow.css";

/**
 * Task list for a single matter — mirrors the Excel workflow document.
 *
 * Props:
 *   tasks        – array of { id, label, status, disabled }
 *   onStart      – (taskId) => void   called when lawyer clicks Start / Resume
 *   onViewInfo   – () => void         opens the Profile Summary (info & documents)
 */

const STATUS_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_CLASSES = {
  not_started: "mw-status--not-started",
  in_progress: "mw-status--in-progress",
  completed: "mw-status--completed",
};

export default function MatterTaskList({ tasks, onStart, onMarkTaskDone, onViewInfo, onViewCalcResults, matterStatus, onToggleStatus, togglingStatus }) {
  const [docsHover, setDocsHover] = useState(false);
  const [calcHover, setCalcHover] = useState(false);
  const [statusHover, setStatusHover] = useState(false);
  const isCompleted = matterStatus === 1;
  return (
    <div className="mw-task-list">
      <div className="mw-task-list__header">
        <h2 className="mw-task-list__title">Task List</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {onToggleStatus && (
            <button
              type="button"
              onClick={onToggleStatus}
              disabled={togglingStatus}
              onMouseEnter={() => setStatusHover(true)}
              onMouseLeave={() => setStatusHover(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: isCompleted
                  ? "1px solid rgba(76, 175, 80, 0.45)"
                  : "1px solid rgba(33, 150, 243, 0.45)",
                background: statusHover
                  ? isCompleted
                    ? "rgba(76, 175, 80, 0.18)"
                    : "rgba(33, 150, 243, 0.18)"
                  : isCompleted
                    ? "rgba(76, 175, 80, 0.08)"
                    : "rgba(33, 150, 243, 0.08)",
                color: isCompleted ? "#4caf50" : "#2196f3",
                font: "inherit",
                fontSize: "14px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: togglingStatus ? "wait" : "pointer",
                transition: "background 0.2s ease, border-color 0.2s ease",
                opacity: togglingStatus ? 0.6 : 1,
              }}
            >
              {togglingStatus
                ? "Updating..."
                : isCompleted
                  ? "Reopen Matter"
                  : "Mark as Done"}
            </button>
          )}
          {onViewCalcResults && (
            <button
              type="button"
              onClick={onViewCalcResults}
              onMouseEnter={() => setCalcHover(true)}
              onMouseLeave={() => setCalcHover(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(76, 175, 80, 0.45)",
                background: calcHover
                  ? "rgba(76, 175, 80, 0.18)"
                  : "rgba(76, 175, 80, 0.08)",
                color: "#4caf50",
                font: "inherit",
                fontSize: "14px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
            >
              Calculation Results
            </button>
          )}
          {onViewInfo && (
            <button
              type="button"
              onClick={onViewInfo}
              onMouseEnter={() => setDocsHover(true)}
              onMouseLeave={() => setDocsHover(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(240, 185, 11, 0.45)",
                background: docsHover
                  ? "rgba(240, 185, 11, 0.18)"
                  : "rgba(240, 185, 11, 0.08)",
                color: "#e6b23a",
                font: "inherit",
                fontSize: "14px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
            >
              View Info &amp; Documents
            </button>
          )}
        </div>
      </div>

      {isCompleted && (
        <div style={{
          padding: "10px 16px",
          marginBottom: "12px",
          borderRadius: "8px",
          background: "rgba(76, 175, 80, 0.1)",
          border: "1px solid rgba(76, 175, 80, 0.3)",
          color: "#4caf50",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          This matter has been marked as completed.
        </div>
      )}

      <div className="mw-task-list__table">
        <div className="mw-task-list__row mw-task-list__row--head">
          <div className="mw-task-list__cell mw-task-list__cell--task">
            Tasks
          </div>
          <div className="mw-task-list__cell mw-task-list__cell--action">
            Action
          </div>
          <div className="mw-task-list__cell mw-task-list__cell--status">
            Status
          </div>
        </div>

        {tasks.map((t) => (
          <div
            className={`mw-task-list__row${t.disabled ? " is-disabled" : ""}`}
            key={t.id}
          >
            <div className="mw-task-list__cell mw-task-list__cell--task">
              {t.label}
            </div>

            <div className="mw-task-list__cell mw-task-list__cell--action" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {t.status === "completed" && t.id === "child_spousal_support" ? (
                <span style={{ color: "#4caf50", fontWeight: 600, fontSize: "13px" }}>Completed</span>
              ) : (
                <button
                  className={`mw-action-btn${
                    t.disabled ? " mw-action-btn--disabled" : ""
                  }${t.status === "in_progress" ? " mw-action-btn--resume" : ""}`}
                  disabled={t.disabled}
                  onClick={() => onStart(t.id)}
                >
                  {t.disabled
                    ? "Disabled"
                    : t.status === "in_progress"
                    ? "Resume"
                    : t.status === "completed"
                    ? "View"
                    : "Start"}
                </button>
              )}
              {onMarkTaskDone && t.status === "in_progress" && t.id === "child_spousal_support" && (
                <button
                  className="mw-action-btn"
                  style={{
                    background: "#4caf50",
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                    padding: "4px 12px",
                  }}
                  onClick={() => onMarkTaskDone(t.id)}
                >
                  Mark as Done
                </button>
              )}
            </div>

            <div className="mw-task-list__cell mw-task-list__cell--status">
              <span className={`mw-status ${STATUS_CLASSES[t.status]}`}>
                {STATUS_LABELS[t.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

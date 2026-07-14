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

export default function MatterTaskList({ tasks, onStart, onViewInfo }) {
  const [docsHover, setDocsHover] = useState(false);
  return (
    <div className="mw-task-list">
      <div className="mw-task-list__header">
        <h2 className="mw-task-list__title">Task List</h2>
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

            <div className="mw-task-list__cell mw-task-list__cell--action">
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

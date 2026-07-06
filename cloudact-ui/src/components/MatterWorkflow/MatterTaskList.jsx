import React from "react";
import "./MatterWorkflow.css";

/**
 * Task list for a single matter — mirrors the Excel workflow document.
 *
 * Props:
 *   tasks        – array of { id, label, status, disabled }
 *   onStart      – (taskId) => void   called when lawyer clicks Start / Resume
 *   matterName   – string, e.g. "John Doe"
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

export default function MatterTaskList({ tasks, onStart, matterName }) {
  return (
    <div className="mw-task-list">
      <div className="mw-task-list__header">
        <h2 className="mw-task-list__title">Task List</h2>
        {matterName && (
          <span className="mw-task-list__matter">Matter: {matterName}</span>
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

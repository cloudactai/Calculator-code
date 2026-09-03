import React from "react";
import { AGREEMENT_TYPES } from "./agreementTypes";
import "./MatterWorkflow.css";

/**
 * Chooser screen for the DRAFT AGREEMENTS task. Renders the AGREEMENT_TYPES
 * registry as clickable cards — today a single entry, Separation Agreement.
 * Distinct from MatterIntakeChoice, which is a fixed 2-card AI/Manual layout;
 * this is an open-ended, registry-driven list so a second agreement type is
 * one more entry here, not a new component.
 *
 * Props:
 *   matterName – string
 *   onChoose   – (agreementTypeId) => void
 *   onBack     – () => void
 */
export default function AgreementTypeList({ matterName, onChoose, onBack }) {
  return (
    <div className="mw-intake-choice">
      <div className="mw-intake-choice__header">
        <button type="button" className="mw-chat-panel__back" onClick={onBack}>
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
          Back to Tasks
        </button>
        <h3 className="mw-intake-choice__title">
          Draft Agreements{matterName ? ` — ${matterName}` : ""}
        </h3>
      </div>

      <p className="mw-intake-choice__subtitle">
        Which agreement do you want to draft?
      </p>

      <div className="mw-agreement-types">
        {AGREEMENT_TYPES.map((type) => (
          <div
            key={type.id}
            className={`mw-agreement-type-card${type.available ? "" : " mw-agreement-type-card--disabled"}`}
            role="button"
            tabIndex={type.available ? 0 : -1}
            aria-disabled={!type.available}
            onClick={() => type.available && onChoose(type.id)}
            onKeyDown={(e) => {
              if (type.available && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onChoose(type.id);
              }
            }}
          >
            <div className="mw-agreement-type-card__icon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h4 className="mw-agreement-type-card__title">{type.label}</h4>
            <p className="mw-agreement-type-card__desc">{type.description}</p>
            <div className="mw-agreement-type-card__cta">
              {type.available ? "Start Drafting" : "Coming soon"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

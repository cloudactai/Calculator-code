import React from "react";
import "./MatterWorkflow.css";

/**
 * Generic choice screen — AI Agent vs Manual entry.
 * Used for both Matter Intake and Child & Spousal Support tasks.
 *
 * Props:
 *   matterName   – string
 *   onChoose     – ("ai" | "manual") => void
 *   onBack       – () => void
 *   title        – string (default "Matter Intake")
 *   subtitle     – string (default "How do you want to enter client information?")
 *   aiFeatures   – string[] (bullet points for AI card)
 *   manualFeatures – string[] (bullet points for Manual card)
 *   aiCta        – string (default "Start Chat")
 *   manualCta    – string (default "Open Forms")
 */

const DEFAULT_AI_FEATURES = [
  "Guided question-by-question flow",
  "Accepts bulk info & asks only for gaps",
  "Pause and resume sessions",
  "Data saved to database on the fly",
];

const DEFAULT_MANUAL_FEATURES = [
  "5-step structured form",
  "Background, marriage, children",
  "Income, employment, financials",
  "Save all on form submit",
];

export default function MatterIntakeChoice({
  matterName,
  onChoose,
  onBack,
  title = "Matter Intake",
  subtitle = "How do you want to enter client information?",
  aiFeatures = DEFAULT_AI_FEATURES,
  manualFeatures = DEFAULT_MANUAL_FEATURES,
  aiCta = "Start Chat",
  manualCta = "Open Forms",
}) {
  return (
    <div className="mw-intake-choice">
      <div className="mw-intake-choice__header">
        <button className="mw-chat-panel__back" onClick={onBack}>
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
          {title}{matterName ? ` — ${matterName}` : ""}
        </h3>
      </div>

      <p className="mw-intake-choice__subtitle">{subtitle}</p>

      <div className="mw-intake-choice__cards">
        {/* AI Agent card */}
        <div
          className="mw-intake-card"
          onClick={() => onChoose("ai")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onChoose("ai")}
        >
          <div className="mw-intake-card__icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h4 className="mw-intake-card__title">Via AI Agent</h4>
          <ul className="mw-intake-card__features">
            {aiFeatures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <div className="mw-intake-card__cta">{aiCta}</div>
        </div>

        {/* Manual card */}
        <div
          className="mw-intake-card"
          onClick={() => onChoose("manual")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onChoose("manual")}
        >
          <div className="mw-intake-card__icon">
            <svg
              width="48"
              height="48"
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
          <h4 className="mw-intake-card__title">Manual Calculator</h4>
          <ul className="mw-intake-card__features">
            {manualFeatures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <div className="mw-intake-card__cta">{manualCta}</div>
        </div>
      </div>
    </div>
  );
}

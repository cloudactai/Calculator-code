import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { CALCULATOR_API } from "../../config";
import { saveMatter } from "../../utils/Apis/matters/saveMatterInformation/saveMattersActions";
import refreshIcon from "../../assets/images/refresh-icon.png";
import {
  buildStoredMatterContextMessage,
  normalizeStoredIntakeData,
} from "./matterIntakeContext";
import "./MatterWorkflow.css";

/**
 * Full-page inline matter-intake AI chat panel.
 *
 * Mirrors ChildSupportChatPanel's chat shell, but talks to the Flask /intake-chat
 * endpoint. That endpoint returns structured `saved_sections` (one per intake
 * section the agent updated). This panel sends only the current response's changes
 * to the authenticated backend, which merges non-blank fields into stored matter
 * data. Section names are accumulated only to show conversational progress.
 *
 * Props:
 *   matterData   – aggregated matter object (snake_case) used for pre-load context
 *   matterId     – string
 *   onComplete   – () => void   called once intake data has been saved
 */

// Human labels for the PascalCase section keys the agent returns.
const SECTION_LABELS = {
  Background: "Background",
  Relationship: "Relationship",
  Children: "Children",
  IncomeAndBenefits: "Income & benefits",
  EmploymentDetails: "Employment",
  Expenses: "Expenses",
  Assets: "Assets",
  DebtsAndLiabilities: "Debts",
  Court: "Court",
  OtherPersonsInHousehold: "Other persons",
};

function renderText(text) {
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export default function MatterIntakeChatPanel({
  matterData,
  matterId,
  onComplete,
  onBack,
}) {
  const dispatch = useDispatch();

  const [bubbles, setBubbles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [contextSent, setContextSent] = useState(false);
  const [savedSections, setSavedSections] = useState([]); // section keys captured so far
  const [intakeComplete, setIntakeComplete] = useState(false);

  const windowRef = useRef(null);
  const inputRef = useRef(null);
  // Progress only. Matter values live in the backend and must never be reconstructed
  // from this chat's incomplete local history.
  const capturedSectionsRef = useRef({});

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [bubbles, loading, warming]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!contextSent && matterData) {
      const storedSections = normalizeStoredIntakeData(matterData);
      Object.keys(storedSections).forEach((section) => {
        capturedSectionsRef.current[section] = true;
      });
      setSavedSections(Object.keys(capturedSectionsRef.current));

      const ctx = buildStoredMatterContextMessage(matterData);
      if (ctx) {
        setContextSent(true);
        send(ctx, { hideUserBubble: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData, contextSent]);

  // Persist only the changes returned in this response. The AI route applies these
  // as non-destructive patches; the manual forms retain full-section save semantics.
  async function persistSections(sections) {
    if (!Array.isArray(sections) || sections.length === 0) return;

    const sectionPatch = {};
    sections.forEach(({ section, data }) => {
      if (!section) return;
      capturedSectionsRef.current[section] = true;
      sectionPatch[section] = data;
    });

    if (Object.keys(sectionPatch).length === 0) return;

    await dispatch(
      saveMatter({
        matter_id: matterId,
        save_mode: "merge",
        data: sectionPatch,
      })
    );

    setSavedSections(Object.keys(capturedSectionsRef.current));
  }

  async function send(text, { hideUserBubble = false } = {}) {
    const userText = (text != null ? text : input).trim();
    if (!userText || loading) return;

    const nextMessages = [...messages, { role: "user", content: userText }];

    if (!hideUserBubble) {
      setBubbles((b) => [...b, { role: "user", text: userText }]);
    }
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const warmTimer = setTimeout(() => setWarming(true), 6000);

    try {
      const res = await fetch(`${CALCULATOR_API}/intake-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (data.error) {
        setBubbles((b) => [
          ...b,
          { role: "assistant", text: `Sorry — ${data.error}` },
        ]);
      } else {
        setBubbles((b) => [...b, { role: "assistant", text: data.reply }]);
        setMessages(data.messages || nextMessages);
        // Wait for persistence before marking the intake complete. The parent
        // refreshes matter-header fields (financial year / valuation date) in
        // response to completion, so firing it early creates a stale read race.
        await persistSections(data.saved_sections);
        // Prefer the service's explicit completion state. Keep wording detection
        // as a compatibility fallback while older deployments are still active.
        const replyText = data.reply || "";
        const completionReply =
          !/(?:not|isn't|is not|hasn't|has not)\s+(?:yet\s+)?(?:complete|completed|saved|been saved)/i.test(replyText) &&
          /intake.{0,60}(?:complete|completed|saved)|complete and saved|(?:everything|all (?:sections|information|details)).{0,60}(?:complete|completed|captured|saved)/i.test(replyText);
        if (data.intake_complete === true || completionReply) {
          setIntakeComplete(true);
          if (onComplete) onComplete();
        }
      }
    } catch {
      setBubbles((b) => [
        ...b,
        {
          role: "assistant",
          text: "Could not reach the intake service. Please try again.",
        },
      ]);
    } finally {
      clearTimeout(warmTimer);
      setWarming(false);
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function resetChat() {
    setBubbles([]);
    setMessages([]);
    setInput("");
    setContextSent(false);
    setSavedSections([]);
    setIntakeComplete(false);
    capturedSectionsRef.current = {};
  }

  return (
    <div className="mw-chat-panel">
      {savedSections.length > 0 && (
        <div className="mw-chat-panel__saved">
          Saved:{" "}
          {savedSections.map((s) => SECTION_LABELS[s] || s).join(" · ")}
        </div>
      )}

      <div className="mw-chat-panel__window" ref={windowRef}>
        {bubbles.length === 0 && !loading && (
          <div className="mw-chat-panel__welcome">
            <h3>Matter Intake Assistant</h3>
            <p>
              I'll walk you through client intake one step at a time — background,
              relationship, children, income, employment and more — and save each
              section as we go. You can paste details in bulk and I'll only ask for
              what's missing.
            </p>
            <div className="mw-chat-panel__starters">
              <button className="mw-chip" onClick={() => send("Let's start the intake")}>
                Start intake
              </button>
              <button
                className="mw-chip"
                onClick={() => send("What information do you need from me?")}
              >
                What info do you need?
              </button>
            </div>
          </div>
        )}

        {bubbles.map((b, i) => (
          <div key={i} className={`mw-chat-row mw-chat-row--${b.role}`}>
            <div className="mw-chat-row__label">
              {b.role === "user" ? "You" : "AI Assistant"}
            </div>
            <div
              className="mw-chat-bubble"
              dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
            />
          </div>
        ))}

        {loading && (
          <div className="mw-chat-row mw-chat-row--assistant">
            <div className="mw-chat-row__label">AI Assistant</div>
            <div className="mw-chat-bubble mw-chat-bubble--typing">
              {warming ? (
                "Warming up the server — first reply can take ~30s…"
              ) : (
                <>
                  <span className="mw-dot" />
                  <span className="mw-dot" />
                  <span className="mw-dot" />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {intakeComplete && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "10px 16px",
            margin: "0 0 10px",
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            borderRadius: "12px",
          }}
        >
          <span style={{ color: "#22c55e", fontWeight: 600 }}>
            ✓ Intake complete and saved. Return to Tasks when you’re ready.
          </span>
          <button
            className="btn btnPrimary rounded-pill"
            onClick={() => onBack && onBack()}
          >
            Back to Tasks
          </button>
        </div>
      )}

      <div className="mw-chat-panel__input-bar">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="mw-chat-panel__send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
        <button
          className="mw-chat-panel__reset"
          onClick={resetChat}
          aria-label="New conversation"
          title="New conversation"
        >
          <img
            src={refreshIcon}
            alt=""
            aria-hidden="true"
            className="mw-chat-panel__reset-icon"
          />
        </button>
      </div>
    </div>
  );
}

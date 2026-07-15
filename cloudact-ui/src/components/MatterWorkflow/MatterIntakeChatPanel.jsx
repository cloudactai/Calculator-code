import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { CALCULATOR_API } from "../../config";
import { saveMatter } from "../../utils/Apis/matters/saveMatterInformation/saveMattersActions";
import refreshIcon from "../../assets/images/refresh-icon.png";
import {
  getAllUserInfo,
  getCurrentUserFromCookies,
  getCompanyInfo,
  getUserProvince,
} from "../../utils/helpers";
import "./MatterWorkflow.css";

/**
 * Full-page inline matter-intake AI chat panel.
 *
 * Mirrors ChildSupportChatPanel's chat shell, but talks to the Flask /intake-chat
 * endpoint. That endpoint returns structured `saved_sections` (one per intake
 * section the agent completed); this panel accumulates them into a formsData blob
 * and persists the whole blob through the existing saveMatter action — exactly the
 * payload the manual 5-step form sends. The Render agent never touches the DB.
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

// Flatten the already-saved matter data into a plain-text primer so the agent
// starts knowing what's on file and only asks for the gaps. (Same approach as
// ChildSupportChatPanel.)
function buildContextMessage(matterData) {
  if (!matterData) return null;

  const parts = [];

  const userInfo = getAllUserInfo();
  const currentRole = getCurrentUserFromCookies();
  const companyInfo = getCompanyInfo();
  const province = getUserProvince();

  if (companyInfo?.company_name) parts.push(`Law firm: ${companyInfo.company_name}`);
  if (currentRole?.short_firmname) parts.push(`Firm ID: ${currentRole.short_firmname}`);
  if (userInfo?.first_name || userInfo?.last_name) {
    parts.push(
      `Lawyer / user: ${[userInfo.first_name, userInfo.last_name]
        .filter(Boolean)
        .join(" ")}`
    );
  }
  if (province) parts.push(`Province: ${province}`);

  if (matterData.matter_number) parts.push(`Matter number: ${matterData.matter_number}`);
  if (matterData.client_id) parts.push(`Client name: ${matterData.client_id}`);

  const bg = matterData.background_information;
  if (bg) {
    if (bg.client?.name) parts.push(`Party 1 (Client): ${bg.client.name}`);
    if (bg.client?.dateOfBirth) parts.push(`  DOB: ${bg.client.dateOfBirth}`);
    if (bg.client?.address) parts.push(`  Address: ${bg.client.address}`);
    if (bg.opposing_party?.name)
      parts.push(`Party 2 (Opposing Party): ${bg.opposing_party.name}`);
    if (bg.opposing_party?.dateOfBirth) parts.push(`  DOB: ${bg.opposing_party.dateOfBirth}`);
    if (bg.opposing_party?.address) parts.push(`  Address: ${bg.opposing_party.address}`);
  }

  const rel = matterData.relationship_information;
  if (rel) {
    if (rel.dateOfMarriage) parts.push(`Date of marriage: ${rel.dateOfMarriage}`);
    if (rel.dateOfSeparation) parts.push(`Date of separation: ${rel.dateOfSeparation}`);
    if (rel.typeOfRelationship) parts.push(`Relationship type: ${rel.typeOfRelationship}`);
  }

  const children = matterData.children_information;
  if (Array.isArray(children) && children.length > 0) {
    parts.push(`Number of children: ${children.length}`);
    children.forEach((c, idx) => {
      const info = [];
      if (c.childName) info.push(c.childName);
      if (c.dateOfBirth) info.push(`DOB: ${c.dateOfBirth}`);
      if (c.nowLivesWith) info.push(`lives with: ${c.nowLivesWith}`);
      if (info.length) parts.push(`  Child ${idx + 1}: ${info.join(", ")}`);
    });
  }

  const emp = matterData.employment_information;
  if (emp) {
    if (emp.client?.employerName) parts.push(`Party 1 employer: ${emp.client.employerName}`);
    if (emp.opposing_party?.employerName)
      parts.push(`Party 2 employer: ${emp.opposing_party.employerName}`);
  }

  const court = matterData.court_information;
  if (court) {
    if (court.name) parts.push(`Court: ${court.name}`);
    if (court.fileNumber) parts.push(`Court file number: ${court.fileNumber}`);
  }

  if (parts.length === 0) return null;

  return (
    "I'm starting a matter intake. Here is the information already on file:\n\n" +
    parts.join("\n") +
    "\n\nPlease continue the intake, only asking for details that are still missing."
  );
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
  // Accumulated formsData blob across the whole conversation. We save the WHOLE
  // blob each time (like the manual form) rather than per-section, so we don't rely
  // on the backend merging partial saves.
  const formsDataRef = useRef({});

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
      const ctx = buildContextMessage(matterData);
      if (ctx) {
        setContextSent(true);
        send(ctx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData, contextSent]);

  // Merge the agent's returned sections into the accumulated blob and persist it.
  async function persistSections(sections) {
    if (!Array.isArray(sections) || sections.length === 0) return;

    sections.forEach(({ section, data }) => {
      if (section) formsDataRef.current[section] = data;
    });

    await dispatch(
      saveMatter({
        matter_id: matterId,
        data: formsDataRef.current,
      })
    );

    setSavedSections(Object.keys(formsDataRef.current));
  }

  async function send(text) {
    const userText = (text != null ? text : input).trim();
    if (!userText || loading) return;

    const nextMessages = [...messages, { role: "user", content: userText }];

    setBubbles((b) => [...b, { role: "user", text: userText }]);
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
        // The agent has no "done" flag; detect its completion phrasing so we can
        // mark the task complete and offer a clear way back to Tasks.
        if (/intake (?:is (?:now )?complete|has been saved)|complete and saved/i.test(data.reply || "")) {
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
    formsDataRef.current = {};
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
            ✓ Intake complete and saved.
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

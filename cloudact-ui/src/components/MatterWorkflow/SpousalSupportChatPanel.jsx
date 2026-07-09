import React, { useEffect, useRef, useState } from "react";
import { CALCULATOR_API } from "../../config";
import {
  getAllUserInfo,
  getCurrentUserFromCookies,
  getCompanyInfo,
  getUserProvince,
} from "../../utils/helpers";
import "./MatterWorkflow.css";
import refreshIcon from "../../assets/images/refresh-icon.png";

/**
 * Full-page inline spousal support AI chat panel.
 *
 * Mirrors ChildSupportChatPanel but hits the /spousal-chat endpoint.
 * The AI determines whether to use the with-children or without-children
 * SSAG formula based on conversation with the user.
 *
 * Props:
 *   matterData   – the matter object from the DB (client name, incomes, children, etc.)
 *   matterId     – string
 *   onComplete   – () => void   called when computation is generated
 */

function renderText(text) {
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

function buildContextMessage(matterData) {
  if (!matterData) return null;

  const parts = [];

  // ── Session / firm context from cookies ──
  const userInfo = getAllUserInfo();
  const currentRole = getCurrentUserFromCookies();
  const companyInfo = getCompanyInfo();
  const province = getUserProvince();

  if (companyInfo?.company_name) {
    parts.push(`Law firm: ${companyInfo.company_name}`);
  }
  if (currentRole?.short_firmname) {
    parts.push(`Firm ID: ${currentRole.short_firmname}`);
  }
  if (userInfo?.first_name || userInfo?.last_name) {
    parts.push(
      `Lawyer / user: ${[userInfo.first_name, userInfo.last_name]
        .filter(Boolean)
        .join(" ")}`
    );
  }
  if (province) {
    parts.push(`Province: ${province}`);
  }

  // ── Matter identifiers ──
  if (matterData.matter_number) {
    parts.push(`Matter number: ${matterData.matter_number}`);
  }
  if (matterData.client_id) {
    parts.push(`Client name: ${matterData.client_id}`);
  }

  // ── Background / party info ──
  const bg = matterData.background_information;
  if (bg) {
    if (bg.client?.name) parts.push(`Party 1 (Client): ${bg.client.name}`);
    if (bg.client?.dateOfBirth)
      parts.push(`  DOB: ${bg.client.dateOfBirth}`);
    if (bg.client?.address)
      parts.push(`  Address: ${bg.client.address}`);
    if (bg.opposing_party?.name)
      parts.push(`Party 2 (Opposing Party): ${bg.opposing_party.name}`);
    if (bg.opposing_party?.dateOfBirth)
      parts.push(`  DOB: ${bg.opposing_party.dateOfBirth}`);
    if (bg.opposing_party?.address)
      parts.push(`  Address: ${bg.opposing_party.address}`);
  }

  // ── Relationship ──
  const rel = matterData.relationship_information;
  if (rel) {
    if (rel.dateOfMarriage)
      parts.push(`Date of marriage: ${rel.dateOfMarriage}`);
    if (rel.dateOfSeparation)
      parts.push(`Date of separation: ${rel.dateOfSeparation}`);
    if (rel.dateOfDivorce)
      parts.push(`Date of divorce: ${rel.dateOfDivorce}`);
    if (rel.typeOfRelationship)
      parts.push(`Relationship type: ${rel.typeOfRelationship}`);
  }

  // ── Children ──
  const children = matterData.children_information;
  if (children && Array.isArray(children) && children.length > 0) {
    parts.push(`Number of children: ${children.length}`);
    children.forEach((c, idx) => {
      const info = [];
      if (c.childName) info.push(c.childName);
      if (c.dateOfBirth) info.push(`DOB: ${c.dateOfBirth}`);
      if (c.nowLivesWith) info.push(`lives with: ${c.nowLivesWith}`);
      if (c.isDependent) info.push(`dependent: ${c.isDependent}`);
      if (info.length)
        parts.push(`  Child ${idx + 1}: ${info.join(", ")}`);
    });
  }

  // ── Income & benefits ──
  const income = matterData.income_and_benefits;
  if (income) {
    ["client", "opposing_party"].forEach((party, pi) => {
      const label = pi === 0 ? "Party 1" : "Party 2";
      const data = income[party];
      if (!data) return;

      if (data.income?.length) {
        const total = data.income.reduce(
          (sum, i) => sum + (parseFloat(i.yearlyAmount) || 0),
          0
        );
        if (total > 0) parts.push(`${label} gross annual income: $${total}`);
        data.income.forEach((inc) => {
          if (inc.source)
            parts.push(
              `  Source: ${inc.source} — $${inc.yearlyAmount || 0}/yr`
            );
        });
      }
      if (data.benefits?.length) {
        data.benefits.forEach((b) => {
          if (b.type)
            parts.push(
              `  Benefit: ${b.type} — $${b.yearlyAmount || b.amount || 0}`
            );
        });
      }
    });
  }

  // ── Employment ──
  const emp = matterData.employment_information;
  if (emp) {
    if (emp.client?.employer)
      parts.push(`Party 1 employer: ${emp.client.employer}`);
    if (emp.opposing_party?.employer)
      parts.push(`Party 2 employer: ${emp.opposing_party.employer}`);
  }

  // ── Assets ──
  const assets = matterData.assets_information;
  if (assets && Array.isArray(assets) && assets.length > 0) {
    parts.push(`Assets on file: ${assets.length}`);
    assets.forEach((a) => {
      const desc = a.description || a.type || "Asset";
      const val = a.value || a.amount || "";
      parts.push(`  ${desc}${val ? ` — $${val}` : ""}`);
    });
  }

  // ── Expenses ──
  const exp = matterData.expense_information;
  if (exp) {
    if (exp.client?.totalMonthlyExpenses)
      parts.push(
        `Party 1 monthly expenses: $${exp.client.totalMonthlyExpenses}`
      );
    if (exp.opposing_party?.totalMonthlyExpenses)
      parts.push(
        `Party 2 monthly expenses: $${exp.opposing_party.totalMonthlyExpenses}`
      );
  }

  // ── Debts ──
  const debts = matterData.debt_information;
  if (debts && Array.isArray(debts) && debts.length > 0) {
    parts.push(`Debts on file: ${debts.length}`);
    debts.forEach((d) => {
      const desc = d.description || d.creditor || "Debt";
      const val = d.amount || d.balance || "";
      parts.push(`  ${desc}${val ? ` — $${val}` : ""}`);
    });
  }

  // ── Court information ──
  const court = matterData.court_information;
  if (court) {
    if (court.courtName) parts.push(`Court: ${court.courtName}`);
    if (court.courtFileNumber)
      parts.push(`Court file number: ${court.courtFileNumber}`);
    if (court.municipality) parts.push(`Municipality: ${court.municipality}`);
  }

  if (parts.length === 0) return null;

  return (
    "I'm working on a divorce matter and need to calculate spousal support. Here is all the information I have:\n\n" +
    parts.join("\n") +
    "\n\nPlease use this information to help with the spousal support calculation. Ask me for any missing details."
  );
}

export default function SpousalSupportChatPanel({
  matterData,
  matterId,
  onComplete,
}) {
  const [bubbles, setBubbles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [contextSent, setContextSent] = useState(false);

  const windowRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [bubbles, loading, warming]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Auto-send context on mount if matter data exists
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
      const res = await fetch(`${CALCULATOR_API}/spousal-chat`, {
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
        setBubbles((b) => [
          ...b,
          { role: "assistant", text: data.reply },
        ]);
        setMessages(data.messages || nextMessages);
      }
    } catch {
      setBubbles((b) => [
        ...b,
        {
          role: "assistant",
          text: "Could not reach the calculator service. Please try again.",
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
  }

  return (
    <div className="mw-chat-panel">

      <div className="mw-chat-panel__window" ref={windowRef}>
        {bubbles.length === 0 && !loading && (
          <div className="mw-chat-panel__welcome">
            <h3>Ontario Spousal Support Calculator</h3>
            <p>
              I'll walk you through calculating spousal support under Ontario's
              Spousal Support Advisory Guidelines (SSAG). I'll determine the
              correct formula based on whether there are dependent children.
            </p>
            <div className="mw-chat-panel__starters">
              <button
                className="mw-chip"
                onClick={() => send("I need to calculate spousal support")}
              >
                Calculate spousal support
              </button>
              <button
                className="mw-chip"
                onClick={() =>
                  send("How does having children affect spousal support?")
                }
              >
                Children's impact on support
              </button>
              <button
                className="mw-chip"
                onClick={() => send("What info do you need from me?")}
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

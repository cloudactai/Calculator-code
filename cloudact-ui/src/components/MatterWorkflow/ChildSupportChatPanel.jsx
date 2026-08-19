import React, { useEffect, useRef, useState } from "react";
import { CALCULATOR_API } from "../../config";
import dataAxios from "../../utils/dataAxios";
import {
  getAllUserInfo,
  getCurrentUserFromCookies,
  getCompanyInfo,
  getUserProvince,
} from "../../utils/helpers";
import { matterProvinceCode } from "../../utils/matterProvince";
import { normalizeStoredIntakeData, SECTION_LABELS } from "./matterIntakeContext";
import "./MatterWorkflow.css";
import refreshIcon from "../../assets/images/refresh-icon.png";

/**
 * Full-page inline child support AI chat panel.
 *
 * Reuses the same Flask /chat endpoint as the floating FamilyLawChat widget,
 * but renders as an inline panel within the SingleMatter page and auto-loads
 * existing matter data as context.
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
    .replace(/\[([^\]]*(?:Download|Report)[^\]]*)\]\([^)]+\)/gi, "")
    .replace(/\n/g, "<br/>");
}

function extractDownloadUrl(text) {
  const match = String(text).match(/\[.+?\]\((\/download-report\/[^)]+)\)/);
  return match ? `${CALCULATOR_API}${match[1]}` : null;
}

function formatSections(sections) {
  const lines = [];

  const bg = sections.Background;
  if (bg) {
    const c = bg.client;
    const o = bg.opposingParty;
    if (c?.name) lines.push(`Party 1 (Client): ${c.name}`);
    if (c?.dateOfBirth) lines.push(`  DOB: ${c.dateOfBirth}`);
    if (c?.address) lines.push(`  Address: ${c.address}`);
    if (o?.name) lines.push(`Party 2 (Opposing Party): ${o.name}`);
    if (o?.dateOfBirth) lines.push(`  DOB: ${o.dateOfBirth}`);
    if (o?.address) lines.push(`  Address: ${o.address}`);
  }

  const rel = sections.Relationship;
  if (rel) {
    if (rel.dateOfMarriage) lines.push(`Date of marriage: ${rel.dateOfMarriage}`);
    if (rel.dateOfSeparation) lines.push(`Date of separation: ${rel.dateOfSeparation}`);
    if (rel.dateOfDivorce) lines.push(`Date of divorce: ${rel.dateOfDivorce}`);
    if (rel.typeOfRelationship) lines.push(`Relationship type: ${rel.typeOfRelationship}`);
  }

  const children = sections.Children;
  if (Array.isArray(children) && children.length > 0) {
    lines.push(`Number of children: ${children.length}`);
    children.forEach((c, i) => {
      const info = [];
      if (c.childName) info.push(c.childName);
      if (c.dateOfBirth) info.push(`DOB: ${c.dateOfBirth}`);
      if (c.nowLivesWith) info.push(`lives with: ${c.nowLivesWith}`);
      if (c.isDependent) info.push(`dependent: ${c.isDependent}`);
      if (info.length) lines.push(`  Child ${i + 1}: ${info.join(", ")}`);
    });
  }

  const inc = sections.IncomeAndBenefits;
  if (inc) {
    if (inc.financialYear) lines.push(`Financial year: ${inc.financialYear}`);
    const fmtPartyIncome = (party, label) => {
      if (!party) return;
      const incItems = Array.isArray(party.income) ? party.income : [];
      const benItems = Array.isArray(party.benefit) ? party.benefit : [];
      if (incItems.length) {
        lines.push(`${label} income:`);
        incItems.forEach((item) => {
          const desc = item.type || item.description || "Income";
          const amt = item.annual || item.monthly || item.amount || "";
          lines.push(`  ${desc}${amt ? `: $${amt}` : ""}`);
        });
      }
      if (benItems.length) {
        lines.push(`${label} benefits:`);
        benItems.forEach((item) => {
          const desc = item.type || item.description || "Benefit";
          const amt = item.annual || item.monthly || item.amount || "";
          lines.push(`  ${desc}${amt ? `: $${amt}` : ""}`);
        });
      }
    };
    fmtPartyIncome(inc.client, "Party 1");
    fmtPartyIncome(inc.opposingParty, "Party 2");
  }

  const emp = sections.EmploymentDetails;
  if (emp) {
    if (emp.client?.employer) lines.push(`Party 1 employer: ${emp.client.employer}`);
    if (emp.client?.position) lines.push(`  Position: ${emp.client.position}`);
    if (emp.opposingParty?.employer) lines.push(`Party 2 employer: ${emp.opposingParty.employer}`);
    if (emp.opposingParty?.position) lines.push(`  Position: ${emp.opposingParty.position}`);
  }

  const exp = sections.Expenses;
  if (exp) {
    const fmtExpenses = (party, label) => {
      if (!party) return;
      const items = Array.isArray(party.expenses) ? party.expenses : [];
      const special = Array.isArray(party.specialChildExpenses) ? party.specialChildExpenses : [];
      if (items.length) {
        lines.push(`${label} expenses:`);
        items.forEach((e) => {
          const desc = e.type || e.description || "Expense";
          const amt = e.monthly || e.annual || e.amount || "";
          lines.push(`  ${desc}${amt ? `: $${amt}` : ""}`);
        });
      }
      if (special.length) {
        lines.push(`${label} special child expenses:`);
        special.forEach((e) => {
          const desc = e.type || e.description || "Expense";
          const amt = e.monthly || e.annual || e.amount || "";
          lines.push(`  ${desc}${amt ? `: $${amt}` : ""}`);
        });
      }
    };
    fmtExpenses(exp.client, "Party 1");
    fmtExpenses(exp.opposingParty, "Party 2");
  }

  const assets = sections.Assets;
  if (assets) {
    if (assets.valuation_date) lines.push(`Valuation date: ${assets.valuation_date}`);
    Object.entries(assets).forEach(([category, items]) => {
      if (category === "valuation_date" || !Array.isArray(items) || !items.length) return;
      lines.push(`Assets — ${category}:`);
      items.forEach((a) => {
        const desc = a.description || a.type || category;
        const val = a.value || a.amount || "";
        lines.push(`  ${desc}${val ? `: $${val}` : ""}`);
      });
    });
  }

  const debts = sections.DebtsAndLiabilities;
  if (Array.isArray(debts) && debts.length) {
    lines.push(`Debts on file: ${debts.length}`);
    debts.forEach((d) => {
      const desc = d.description || d.creditor || "Debt";
      const val = d.amount || d.balance || "";
      lines.push(`  ${desc}${val ? `: $${val}` : ""}`);
    });
  }

  const court = sections.Court;
  if (court) {
    if (court.name) lines.push(`Court: ${court.name}`);
    if (court.fileNumber) lines.push(`Court file number: ${court.fileNumber}`);
    if (court.municipality) lines.push(`Municipality: ${court.municipality}`);
  }

  return lines;
}

function buildContextMessage(matterData) {
  if (!matterData) return null;

  const savedSections = normalizeStoredIntakeData(matterData);

  const allSections = Object.keys(SECTION_LABELS);
  const retrieved = allSections.filter((s) => s in savedSections);
  const missing = allSections.filter((s) => !(s in savedSections));
  console.log("[ChildChat] Matter data keys received:", Object.keys(matterData));
  console.log("[ChildChat] Sections retrieved:", retrieved.map((s) => SECTION_LABELS[s]).join(", ") || "none");
  console.log("[ChildChat] Sections missing:", missing.map((s) => SECTION_LABELS[s]).join(", ") || "none");

  // Session metadata — sent to AI only, not shown in the chat bubble
  const aiOnly = [];
  const userInfo = getAllUserInfo();
  const currentRole = getCurrentUserFromCookies();
  const companyInfo = getCompanyInfo();
  // The matter's province decides which tables apply, not the firm's.
  const province = matterProvinceCode(matterData, getUserProvince());

  if (companyInfo?.company_name) aiOnly.push(`Law firm: ${companyInfo.company_name}`);
  if (currentRole?.short_firmname) aiOnly.push(`Firm ID: ${currentRole.short_firmname}`);
  if (userInfo?.first_name || userInfo?.last_name) {
    aiOnly.push(
      `Lawyer / user: ${[userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ")}`
    );
  }
  if (province) aiOnly.push(`Province: ${province}`);
  if (matterData.matter_number) aiOnly.push(`Matter number: ${matterData.matter_number}`);
  if (matterData.client_id) aiOnly.push(`Client name: ${matterData.client_id}`);

  // Matter data — shown to user and sent to AI
  const displayParts = formatSections(savedSections);

  if (aiOnly.length === 0 && displayParts.length === 0) return null;

  const intro = "Here is all the information on file for this matter:\n\n";
  const aiBody = [...aiOnly, ...displayParts].join("\n");
  const displayBody = displayParts.join("\n");
  const closing = "\n\nPlease use this information to help with the calculation. Do not ask for values already listed — only ask about missing details.";

  return {
    display: displayBody.length > 0 ? intro + displayBody : null,
    ai: intro + aiBody + closing,
  };
}

export default function ChildSupportChatPanel({
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
  const [lastCalcResult, setLastCalcResult] = useState(null);
  const [savedToMatter, setSavedToMatter] = useState(false);
  const [savingToMatter, setSavingToMatter] = useState(false);

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
        send(ctx.ai, ctx.display);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData, contextSent]);

  async function send(text, displayText) {
    const userText = (text != null ? text : input).trim();
    if (!userText || loading) return;

    const hideUserBubble = displayText === null;
    const bubbleText = displayText || userText;
    const nextMessages = [...messages, { role: "user", content: userText }];

    if (!hideUserBubble) {
      setBubbles((b) => [...b, { role: "user", text: bubbleText }]);
    }
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const warmTimer = setTimeout(() => setWarming(true), 6000);

    try {
      const res = await fetch(`${CALCULATOR_API}/chat`, {
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

        // Store the calculation result for manual save via button
        if (data.calculationResult) {
          console.log("[ChildChat] calculationResult received, keys:", Object.keys(data.calculationResult));
          setLastCalcResult(data.calculationResult);
          setSavedToMatter(false);
        }
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

  async function saveToMatter() {
    if (!lastCalcResult || !matterId) return;
    setSavingToMatter(true);
    const cr = lastCalcResult;
    try {
      await dataAxios.post(`matters/${matterId}/reports`, {
        calculationType: "child_support",
        label: `${cr.party1_name || "Party 1"} v ${cr.party2_name || "Party 2"} - Child Support`,
        inputData: {
          _calcResult: cr,
          party1_name: cr.party1_name,
          party2_name: cr.party2_name,
          party1_income: cr.party1_income,
          party2_income: cr.party2_income,
          children: cr.children,
        },
        resultData: {
          scenario: cr.scenario,
          party1_monthly: cr.party1_monthly,
          party2_monthly: cr.party2_monthly,
          party1_annual: cr.party1_annual,
          party2_annual: cr.party2_annual,
          child_support_ref: cr.child_support_ref,
          net_payer: cr.net_payer,
          net_monthly: cr.net_monthly,
          net_annual: cr.net_annual,
        },
        pdfBase64: cr.pdf_base64 || null,
        pdfFilename: cr.pdf_filename || null,
      });
      console.log("[ChildChat] Report saved to DB");
      setSavedToMatter(true);
    } catch (err) {
      console.warn("[ChildChat] Failed to save report:", err);
      alert("Failed to save to matter. Please try again.");
    } finally {
      setSavingToMatter(false);
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
    setLastCalcResult(null);
    setSavedToMatter(false);
  }

  return (
    <div className="mw-chat-panel">

      <div className="mw-chat-panel__window" ref={windowRef}>
        {bubbles.length === 0 && !loading && (
          <div className="mw-chat-panel__welcome">
            <h3>Ontario Child Support Calculator</h3>
            <p>
              I'll walk you through calculating child support under Ontario's
              Federal Child Support Guidelines using the information already
              saved for this matter.
            </p>
            <div className="mw-chat-panel__starters">
              <button
                className="mw-chip"
                onClick={() => send("I need to calculate child support")}
              >
                Calculate child support
              </button>
              <button
                className="mw-chip"
                onClick={() =>
                  send("How does shared custody affect support?")
                }
              >
                Shared custody impact
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

        {bubbles.map((b, i) => {
          // Show action buttons on the last assistant bubble when a calc result exists.
          // Previously gated on extractDownloadUrl finding a markdown link in the AI
          // reply — if the model omitted or reformatted the link, both buttons vanished.
          const isLastAssistant = b.role === "assistant" && !bubbles.slice(i + 1).some(
            (fb) => fb.role === "assistant"
          );
          const showActions = isLastAssistant && lastCalcResult;
          return (
            <div key={i} className={`mw-chat-row mw-chat-row--${b.role}`}>
              <div className="mw-chat-row__label">
                {b.role === "user" ? "You" : "AI Assistant"}
              </div>
              <div
                className="mw-chat-bubble"
                dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
              />
              {showActions && (
                <div className="mw-action-buttons">
                  <button
                    className="mw-download-btn"
                    onClick={() => {
                      if (lastCalcResult.pdf_base64) {
                        const byteChars = atob(lastCalcResult.pdf_base64);
                        const byteArray = new Uint8Array(byteChars.length);
                        for (let j = 0; j < byteChars.length; j++) byteArray[j] = byteChars.charCodeAt(j);
                        const blob = new Blob([byteArray], { type: "application/pdf" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = lastCalcResult.pdf_filename || "child_support_report.pdf";
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      } else {
                        const serverUrl = extractDownloadUrl(b.text);
                        if (serverUrl) window.open(serverUrl, "_blank");
                      }
                    }}
                  >
                    Download PDF Report
                  </button>
                  {matterId && (
                    <button
                      className="mw-save-btn"
                      onClick={saveToMatter}
                      disabled={savingToMatter || savedToMatter}
                    >
                      {savedToMatter
                        ? "✓ Saved to Matter"
                        : savingToMatter
                        ? "Saving…"
                        : "Save to Matter"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

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

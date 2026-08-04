import React, { useEffect, useRef, useState } from "react";
import { CALCULATOR_API } from "../../config";
import dataAxios from "../../utils/dataAxios";
import {
  getAllUserInfo,
  getCurrentUserFromCookies,
  getCompanyInfo,
  getUserProvince,
} from "../../utils/helpers";
import { normalizeStoredIntakeData, SECTION_LABELS } from "./matterIntakeContext";
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
    .replace(/\[(.+?)\]\((\/download-report\/[^)]+)\)/g, "")
    .replace(/\n/g, "<br/>");
}

function extractDownloadUrl(text) {
  const match = String(text).match(/\[.+?\]\((\/download-report\/[^)]+)\)/);
  return match ? `${CALCULATOR_API}${match[1]}` : null;
}

function buildContextMessage(matterData) {
  if (!matterData) return null;

  const savedSections = normalizeStoredIntakeData(matterData);

  const allSections = Object.keys(SECTION_LABELS);
  const retrieved = allSections.filter((s) => s in savedSections);
  const missing = allSections.filter((s) => !(s in savedSections));
  console.log("[SpousalChat] Matter data keys received:", Object.keys(matterData));
  console.log("[SpousalChat] Sections retrieved:", retrieved.map((s) => SECTION_LABELS[s]).join(", ") || "none");
  console.log("[SpousalChat] Sections missing:", missing.map((s) => SECTION_LABELS[s]).join(", ") || "none");

  const sessionParts = [];
  const userInfo = getAllUserInfo();
  const currentRole = getCurrentUserFromCookies();
  const companyInfo = getCompanyInfo();
  const province = getUserProvince();

  if (companyInfo?.company_name) sessionParts.push(`Law firm: ${companyInfo.company_name}`);
  if (currentRole?.short_firmname) sessionParts.push(`Firm ID: ${currentRole.short_firmname}`);
  if (userInfo?.first_name || userInfo?.last_name) {
    sessionParts.push(
      `Lawyer / user: ${[userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ")}`
    );
  }
  if (province) sessionParts.push(`Province: ${province}`);

  const matter = {};
  if (matterData.matter_number) matter.matterNumber = matterData.matter_number;
  if (matterData.client_id) matter.clientName = matterData.client_id;

  if (!matter.matterNumber && Object.keys(savedSections).length === 0) return null;

  const snapshot = JSON.stringify({ matter, savedSections }, null, 2);
  const sessionLine = sessionParts.length > 0 ? sessionParts.join("\n") + "\n\n" : "";

  const intro = "I'm working on a divorce matter. Here is the authoritative database snapshot.\n" +
    "Do not ask for a value that is already populated — only ask about genuinely missing fields.\n" +
    "If I explicitly provide a different value, treat it as a correction.\n\n";

  const display = intro + sessionLine + snapshot;
  const ai = display + "\n\nPlease use this information to help with the calculation. Only ask me for missing details.";

  return { display, ai };
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
        // Show shortened version in UI, send full version to AI
        send(ctx.ai, ctx.display);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData, contextSent]);

  async function send(text, displayText) {
    const userText = (text != null ? text : input).trim();
    if (!userText || loading) return;

    const bubbleText = displayText || userText;
    const nextMessages = [...messages, { role: "user", content: userText }];

    setBubbles((b) => [...b, { role: "user", text: bubbleText }]);
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

        // Store the calculation result for manual save via button
        if (data.calculationResult) {
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

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function saveToMatter() {
    if (!lastCalcResult || !matterId) return;
    setSavingToMatter(true);
    const cr = lastCalcResult;
    try {
      await dataAxios.post(`matters/${matterId}/reports`, {
        calculationType: "spousal_support",
        label: `${cr.payor_name || cr.party1_name || "Party 1"} v ${cr.recipient_name || cr.party2_name || "Party 2"} - Spousal Support`,
        inputData: {
          party1_name: cr.party1_name,
          party2_name: cr.party2_name,
          party1_gross_income: cr.party1_gross_income,
          party2_gross_income: cr.party2_gross_income,
          children: cr.children,
        },
        resultData: {
          payor_name: cr.payor_name,
          recipient_name: cr.recipient_name,
          monthly_low: cr.monthly_low,
          monthly_mid: cr.monthly_mid,
          monthly_high: cr.monthly_high,
          annual_low: cr.annual_low,
          annual_mid: cr.annual_mid,
          annual_high: cr.annual_high,
          duration_label: cr.duration_label,
        },
        pdfBase64: cr.pdf_base64 || null,
        pdfFilename: cr.pdf_filename || null,
      });
      setSavedToMatter(true);
    } catch (err) {
      alert("Failed to save to matter. Please try again.");
    } finally {
      setSavingToMatter(false);
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

        {bubbles.map((b, i) => {
          const downloadUrl = b.role === "assistant" ? extractDownloadUrl(b.text) : null;
          const isLastDownloadBubble = downloadUrl && !bubbles.slice(i + 1).some(
            (fb) => fb.role === "assistant" && extractDownloadUrl(fb.text)
          );
          return (
            <div key={i} className={`mw-chat-row mw-chat-row--${b.role}`}>
              <div className="mw-chat-row__label">
                {b.role === "user" ? "You" : "AI Assistant"}
              </div>
              <div
                className="mw-chat-bubble"
                dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
              />
              {isLastDownloadBubble && (
                <div className="mw-action-buttons">
                  <a
                    className="mw-download-btn"
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    Download PDF Report
                  </a>
                  {matterId && lastCalcResult && (
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

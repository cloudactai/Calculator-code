import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { CALCULATOR_API } from "../../config";
import "./FamilyLawChat.css";

/**
 * Family Law calculators widget — a floating launcher (bottom-right) that opens
 * a panel exposing Marc's three Ontario family-law calculators in one place:
 *
 *   • Child Support  — AI assistant, POST {CALCULATOR_API}/chat
 *   • Income Tax     — AI assistant, POST {CALCULATOR_API}/tax-chat
 *   • Spousal Support — form calculator, POST {CALCULATOR_API}/spousal-calculate
 *
 * The two AI assistants share the same chat transport ({ messages } in,
 * { reply, messages } out) but keep separate conversations. Spousal Support is
 * a structured form (SSAG without-child formula) rather than a chat.
 *
 * Only rendered for signed-in users (gated in App.js on the session cookie).
 */

const CALCULATORS = [
  {
    id: "child",
    label: "Child Support",
    kind: "chat",
    endpoint: "/chat",
    title: "Ontario Child Support Calculator",
    intro:
      "I'll ask a few questions and calculate child support under Ontario's Federal Child Support Guidelines. Nothing is stored.",
    starters: [
      "I need to calculate child support",
      "How does shared custody affect support?",
      "What info do you need from me?",
    ],
  },
  {
    id: "tax",
    label: "Income Tax",
    kind: "chat",
    endpoint: "/tax-chat",
    title: "Ontario Income Tax Calculator",
    intro:
      "I'll ask about your income, deductions, and family situation, then calculate your federal and Ontario taxes and benefits for 2025. Nothing is stored.",
    starters: [
      "Calculate my taxes for 2025",
      "What information do you need from me?",
      "I have self-employment income",
    ],
  },
  {
    id: "spousal",
    label: "Spousal Support",
    kind: "chat",
    endpoint: "/spousal-chat",
    title: "Ontario Spousal Support Calculator",
    intro:
      "I'll ask a few questions and calculate spousal support under Ontario's Spousal Support Advisory Guidelines (SSAG). I'll determine the correct formula based on whether there are dependent children. Nothing is stored.",
    starters: [
      "I need to calculate spousal support",
      "How does having children affect spousal support?",
      "What info do you need from me?",
    ],
  },
];

const EMPTY_CHAT = { bubbles: [], messages: [] };

// Spousal support is now an AI chat — no form state needed.

// Minimal, safe formatting: escape HTML, then render **bold** and newlines.
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

export default function FamilyLawChat() {
  const [signedIn, setSignedIn] = useState(hasSession());
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeCalc, setActiveCalc] = useState("child");

  // Separate conversation per AI calculator so switching tabs preserves context.
  const [chats, setChats] = useState({
    child: { ...EMPTY_CHAT },
    tax: { ...EMPTY_CHAT },
    spousal: { ...EMPTY_CHAT },
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCalc, setLoadingCalc] = useState(null); // which calc is awaiting a reply
  const [warming, setWarming] = useState(false);

  // Spousal form state removed — now using AI chat.

  const windowRef = useRef(null);
  const inputRef = useRef(null);

  const calc = CALCULATORS.find((c) => c.id === activeCalc) || CALCULATORS[0];
  const chat = chats[activeCalc] || EMPTY_CHAT;

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [activeCalc, chats, loading, warming]);

  useEffect(() => {
    if (open && calc.kind === "chat" && inputRef.current) inputRef.current.focus();
  }, [open, activeCalc, calc.kind]);

  // The session cookie is set during login *after* this app first mounts, and
  // App doesn't re-render on SPA login — so re-check it (cheap cookie read) on
  // an interval and on tab focus, instead of evaluating sign-in only once.
  useEffect(() => {
    const recheck = () => setSignedIn(hasSession());
    const id = setInterval(recheck, 1500);
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  async function send(text) {
    if (calc.kind !== "chat") return;
    const userText = (text != null ? text : input).trim();
    if (!userText || loading) return;

    const id = calc.id;
    const prev = chats[id] || EMPTY_CHAT;
    const nextMessages = [...prev.messages, { role: "user", content: userText }];

    setChats((c) => ({
      ...c,
      [id]: {
        bubbles: [...prev.bubbles, { role: "user", text: userText }],
        messages: nextMessages,
      },
    }));
    setInput("");
    setLoading(true);
    setLoadingCalc(id);

    // Render free tier can cold-start (~30s) — show a notice after a few seconds.
    const warmTimer = setTimeout(() => setWarming(true), 6000);

    try {
      const res = await fetch(`${CALCULATOR_API}${calc.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      setChats((c) => {
        const cur = c[id];
        if (data.error) {
          return {
            ...c,
            [id]: {
              ...cur,
              bubbles: [...cur.bubbles, { role: "assistant", text: `Sorry — ${data.error}` }],
            },
          };
        }
        return {
          ...c,
          [id]: {
            bubbles: [...cur.bubbles, { role: "assistant", text: data.reply }],
            messages: data.messages || cur.messages,
          },
        };
      });
    } catch (err) {
      setChats((c) => {
        const cur = c[id];
        return {
          ...c,
          [id]: {
            ...cur,
            bubbles: [
              ...cur.bubbles,
              { role: "assistant", text: "Could not reach the calculator service. Please try again." },
            ],
          },
        };
      });
    } finally {
      clearTimeout(warmTimer);
      setWarming(false);
      setLoading(false);
      setLoadingCalc(null);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function resetActiveChat() {
    setChats((c) => ({ ...c, [activeCalc]: { ...EMPTY_CHAT } }));
    setInput("");
  }

  const showTyping = loading && loadingCalc === activeCalc;

  if (!signedIn) return null;

  return (
    <div className="flc-root">
      {open && (
        <div
          className={`flc-panel${fullscreen ? " is-fullscreen" : ""}`}
          role="dialog"
          aria-label="Family Law calculators"
        >
          <div className="flc-header">
            <div className="flc-header-top">
              <span className="flc-title">CloudAct · Family Law Calculators</span>
              <div className="flc-header-btns">
                <button
                  className="flc-icon-btn"
                  onClick={() => setFullscreen((f) => !f)}
                  aria-pressed={fullscreen}
                  aria-label={fullscreen ? "Exit full screen" : "Full screen"}
                  title={fullscreen ? "Exit full screen" : "Full screen"}
                >
                  {fullscreen ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 9H5V5" /><path d="M15 9h4V5" /><path d="M9 15H5v4" /><path d="M15 15h4v4" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                    </svg>
                  )}
                </button>
                <button
                  className="flc-icon-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flc-tabs" role="tablist">
              {CALCULATORS.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={activeCalc === c.id}
                  className={`flc-tab${activeCalc === c.id ? " is-active" : ""}`}
                  onClick={() => setActiveCalc(c.id)}
                  title={c.label}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <>
            <div className="flc-window" ref={windowRef}>
              {chat.bubbles.length === 0 && (
                <div className="flc-welcome">
                  <h3>{calc.title}</h3>
                  <p>{calc.intro}</p>
                  <div className="flc-starters">
                    {calc.starters.map((s) => (
                      <button key={s} className="flc-chip" onClick={() => send(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chat.bubbles.map((b, i) => {
                const downloadUrl = b.role === "assistant" ? extractDownloadUrl(b.text) : null;
                return (
                  <div key={i} className={`flc-row flc-${b.role}`}>
                    <div
                      className="flc-bubble"
                      dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
                    />
                    {downloadUrl && (
                      <a
                        className="mw-download-btn"
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        Download PDF Report
                      </a>
                    )}
                  </div>
                );
              })}

              {showTyping && (
                <div className="flc-row flc-assistant">
                  <div className="flc-bubble flc-typing">
                    {warming ? (
                      "Warming up the server — first reply can take ~30s…"
                    ) : (
                      <>
                        <span className="flc-dot" />
                        <span className="flc-dot" />
                        <span className="flc-dot" />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flc-input-bar">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="flc-send"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                ➤
              </button>
            </div>
            <div className="flc-footer">
              <button className="flc-reset" onClick={resetActiveChat}>
                New conversation
              </button>
            </div>
          </>
        </div>
      )}

      <button
        className={`flc-launcher${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close calculators" : "Open family law calculators"}
      >
        {open ? (
          "✕"
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

/** True when a signed-in session cookie is present. */
export function hasSession() {
  return Boolean(Cookies.get("allUserInfo"));
}

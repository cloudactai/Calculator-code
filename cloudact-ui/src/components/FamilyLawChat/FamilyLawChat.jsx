import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { CALCULATOR_API } from "../../config";
import "./FamilyLawChat.css";

/**
 * Family Law AI chat widget — a floating launcher (bottom-right) that opens a
 * chat panel powered by the Flask /chat backend (Marc's calculator service).
 *
 * Only rendered for signed-in users (gated in App.js on the session cookie).
 *
 * The calculator selector in the header has Child Support active (Marc's
 * working calculator) and two placeholder slots — Spousal Support (in
 * progress) and a third calculator (TBD) — reserved but not wired up yet.
 */

const CALCULATORS = [
  { id: "child", label: "Child Support", available: true },
  { id: "spousal", label: "Spousal Support", available: false },
  // TODO: third calculator name TBD — update label once confirmed.
  { id: "third", label: "Coming soon", available: false, hideBadge: true },
];

const STARTERS = [
  "I need to calculate child support",
  "How does shared custody affect support?",
  "What info do you need from me?",
];

// Minimal, safe formatting: escape HTML, then render **bold** and newlines.
function renderText(text) {
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export default function FamilyLawChat() {
  const [open, setOpen] = useState(false);
  const [activeCalc, setActiveCalc] = useState("ai");
  const [bubbles, setBubbles] = useState([]); // { role: 'user'|'assistant', text }
  const [apiMessages, setApiMessages] = useState([]); // full history for backend
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const windowRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [bubbles, loading, warming]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  async function send(text) {
    const userText = (text != null ? text : input).trim();
    if (!userText || loading) return;

    const nextApi = [...apiMessages, { role: "user", content: userText }];
    setBubbles((b) => [...b, { role: "user", text: userText }]);
    setApiMessages(nextApi);
    setInput("");
    setLoading(true);

    // Render free tier can cold-start (~30s) — show a notice after a few seconds.
    const warmTimer = setTimeout(() => setWarming(true), 6000);

    try {
      const res = await fetch(`${CALCULATOR_API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextApi }),
      });
      const data = await res.json();
      if (data.error) {
        setBubbles((b) => [
          ...b,
          { role: "assistant", text: `Sorry — ${data.error}` },
        ]);
      } else {
        setApiMessages(data.messages || nextApi);
        setBubbles((b) => [...b, { role: "assistant", text: data.reply }]);
      }
    } catch (err) {
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
    setApiMessages([]);
    setInput("");
  }

  return (
    <div className="flc-root">
      {open && (
        <div className="flc-panel" role="dialog" aria-label="Family Law assistant">
          <div className="flc-header">
            <div className="flc-header-top">
              <span className="flc-title">CloudAct · Family Law Calculator</span>
              <button
                className="flc-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flc-tabs" role="tablist">
              {CALCULATORS.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  className={`flc-tab${activeCalc === c.id ? " is-active" : ""}${
                    c.available ? "" : " is-disabled"
                  }`}
                  onClick={() => c.available && setActiveCalc(c.id)}
                  disabled={!c.available}
                  title={c.available ? c.label : `${c.label} — coming soon`}
                >
                  {c.label}
                  {!c.available && !c.hideBadge && (
                    <span className="flc-soon">Soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flc-window" ref={windowRef}>
            {bubbles.length === 0 && (
              <div className="flc-welcome">
                <h3>Ontario Child Support Calculator</h3>
                <p>
                  I'll ask a few questions and calculate child support under
                  Ontario's Federal Child Support Guidelines. Nothing is stored.
                </p>
                <div className="flc-starters">
                  {STARTERS.map((s) => (
                    <button key={s} className="flc-chip" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bubbles.map((b, i) => (
              <div key={i} className={`flc-row flc-${b.role}`}>
                <div
                  className="flc-bubble"
                  dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
                />
              </div>
            ))}

            {loading && (
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
            <button className="flc-reset" onClick={resetChat}>
              New conversation
            </button>
          </div>
        </div>
      )}

      <button
        className={`flc-launcher${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close calculator chat" : "Open calculator chat"}
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

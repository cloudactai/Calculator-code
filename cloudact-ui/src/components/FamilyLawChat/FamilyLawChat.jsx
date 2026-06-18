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
    kind: "form",
    endpoint: "/spousal-calculate",
    title: "Spousal Support Calculator",
    intro:
      "Estimate spousal support ranges under the Spousal Support Advisory Guidelines (SSAG) without-child formula.",
  },
];

const EMPTY_CHAT = { bubbles: [], messages: [] };

const EMPTY_SPOUSAL = {
  p1Name: "",
  p1Income: "",
  p2Name: "",
  p2Income: "",
  years: "",
  age: "",
  result: null,
  error: "",
  loading: false,
};

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

function fmtCAD(n) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

export default function FamilyLawChat() {
  const [signedIn, setSignedIn] = useState(hasSession());
  const [open, setOpen] = useState(false);
  const [activeCalc, setActiveCalc] = useState("child");

  // Separate conversation per AI calculator so switching tabs preserves context.
  const [chats, setChats] = useState({
    child: { ...EMPTY_CHAT },
    tax: { ...EMPTY_CHAT },
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCalc, setLoadingCalc] = useState(null); // which calc is awaiting a reply
  const [warming, setWarming] = useState(false);

  const [spousal, setSpousal] = useState({ ...EMPTY_SPOUSAL });

  const windowRef = useRef(null);
  const inputRef = useRef(null);

  const calc = CALCULATORS.find((c) => c.id === activeCalc) || CALCULATORS[0];
  const chat = chats[activeCalc] || EMPTY_CHAT;

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [activeCalc, chats, loading, warming, spousal.result, spousal.error]);

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

  async function calcSpousal() {
    const p1Income = parseFloat(spousal.p1Income);
    const p2Income = parseFloat(spousal.p2Income);
    const years = parseFloat(spousal.years);
    const age = parseFloat(spousal.age);

    let error = "";
    if (isNaN(p1Income) || isNaN(p2Income))
      error = "Please enter gross annual incomes for both parties.";
    else if (p1Income === p2Income)
      error = "Incomes are equal — no spousal support would be payable.";
    else if (isNaN(years) || years <= 0) error = "Please enter a valid number of years.";
    else if (isNaN(age) || age < 18) error = "Please enter the recipient's age (minimum 18).";

    if (error) {
      setSpousal((s) => ({ ...s, error, result: null }));
      return;
    }

    setSpousal((s) => ({ ...s, error: "", loading: true }));

    try {
      const res = await fetch(`${CALCULATOR_API}/spousal-calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The backend computes the SSAG without-child quantum from gross income.
        // Its route key has historically flip-flopped between *_net_income and
        // *_gross_income, so we send both (same gross value) to stay compatible.
        body: JSON.stringify({
          party1_name: spousal.p1Name.trim() || "Party 1",
          party2_name: spousal.p2Name.trim() || "Party 2",
          party1_net_income: p1Income,
          party2_net_income: p2Income,
          party1_gross_income: p1Income,
          party2_gross_income: p2Income,
          years,
          recipient_age: age,
          children: false,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSpousal((s) => ({ ...s, error: data.error, result: null, loading: false }));
      } else {
        setSpousal((s) => ({ ...s, result: data, error: "", loading: false }));
      }
    } catch (err) {
      setSpousal((s) => ({
        ...s,
        error: "Could not reach the calculator service. Please try again.",
        loading: false,
      }));
    }
  }

  const showTyping = loading && loadingCalc === activeCalc;

  if (!signedIn) return null;

  return (
    <div className="flc-root">
      {open && (
        <div className="flc-panel" role="dialog" aria-label="Family Law calculators">
          <div className="flc-header">
            <div className="flc-header-top">
              <span className="flc-title">CloudAct · Family Law Calculators</span>
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

          {calc.kind === "chat" ? (
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

                {chat.bubbles.map((b, i) => (
                  <div key={i} className={`flc-row flc-${b.role}`}>
                    <div
                      className="flc-bubble"
                      dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
                    />
                  </div>
                ))}

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
          ) : (
            <div className="flc-window flc-form-window" ref={windowRef}>
              <p className="flc-form-intro">{calc.intro}</p>

              <div className="flc-form-group">
                <div className="flc-form-label">Party 1</div>
                <input
                  className="flc-field"
                  type="text"
                  placeholder="Name (optional)"
                  value={spousal.p1Name}
                  onChange={(e) => setSpousal((s) => ({ ...s, p1Name: e.target.value }))}
                />
                <input
                  className="flc-field"
                  type="number"
                  min="0"
                  placeholder="Gross annual income ($)"
                  value={spousal.p1Income}
                  onChange={(e) => setSpousal((s) => ({ ...s, p1Income: e.target.value }))}
                />
              </div>

              <div className="flc-form-group">
                <div className="flc-form-label">Party 2</div>
                <input
                  className="flc-field"
                  type="text"
                  placeholder="Name (optional)"
                  value={spousal.p2Name}
                  onChange={(e) => setSpousal((s) => ({ ...s, p2Name: e.target.value }))}
                />
                <input
                  className="flc-field"
                  type="number"
                  min="0"
                  placeholder="Gross annual income ($)"
                  value={spousal.p2Income}
                  onChange={(e) => setSpousal((s) => ({ ...s, p2Income: e.target.value }))}
                />
              </div>

              <div className="flc-form-group">
                <div className="flc-form-label">Relationship</div>
                <input
                  className="flc-field"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Years of marriage / cohabitation"
                  value={spousal.years}
                  onChange={(e) => setSpousal((s) => ({ ...s, years: e.target.value }))}
                />
                <input
                  className="flc-field"
                  type="number"
                  min="18"
                  placeholder="Recipient's current age"
                  value={spousal.age}
                  onChange={(e) => setSpousal((s) => ({ ...s, age: e.target.value }))}
                />
                <p className="flc-form-hint">
                  The recipient is the lower-income spouse. Age is used to determine duration
                  under the Rule of 65.
                </p>
              </div>

              {spousal.error && <div className="flc-form-error">{spousal.error}</div>}

              <button
                className="flc-calc-btn"
                onClick={calcSpousal}
                disabled={spousal.loading}
              >
                {spousal.loading ? "Calculating…" : "Calculate Spousal Support"}
              </button>

              {spousal.result && <SpousalResult d={spousal.result} />}

              <p className="flc-disclaimer">
                Based on the SSAG without-child formula. Estimates only — not legal advice.
              </p>
            </div>
          )}
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

function SpousalResult({ d }) {
  const incomeDiff = d.net_income_diff != null ? d.net_income_diff : d.gross_income_diff;
  const rows = [
    { label: "Low", cls: "low", pct: d.pct_low, mo: d.monthly_low, yr: d.annual_low },
    { label: "Medium", cls: "med", pct: d.pct_med, mo: d.monthly_med, yr: d.annual_med },
    { label: "High", cls: "high", pct: d.pct_high, mo: d.monthly_high, yr: d.annual_high },
  ];

  return (
    <div className="flc-result">
      <div className="flc-result-meta">
        <div className="flc-meta-item">
          <span>Payor</span>
          <strong>{d.payor}</strong>
        </div>
        <div className="flc-meta-item">
          <span>Recipient</span>
          <strong>{d.recipient}</strong>
        </div>
        {incomeDiff != null && (
          <div className="flc-meta-item">
            <span>Income difference</span>
            <strong>{fmtCAD(incomeDiff)}/yr</strong>
          </div>
        )}
        {d.duration_label && (
          <div className="flc-meta-item">
            <span>Duration</span>
            <strong>{d.duration_label}</strong>
          </div>
        )}
      </div>

      <table className="flc-range">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>%</th>
            <th>Monthly</th>
            <th>Annual</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>
                <span className={`flc-tag flc-${r.cls}`}>{r.label}</span>
              </td>
              <td>{r.pct}%</td>
              <td>{fmtCAD(r.mo)}</td>
              <td>{fmtCAD(r.yr)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flc-verdict">
        <strong>
          {d.payor} pays {d.recipient}
        </strong>
        Between {fmtCAD(d.monthly_low)}/mo (low) and {fmtCAD(d.monthly_high)}/mo (high), with a
        midpoint of {fmtCAD(d.monthly_med)}/mo
        {d.duration_label ? ` — for ${String(d.duration_label).toLowerCase()}.` : "."}
      </div>
    </div>
  );
}

/** True when a signed-in session cookie is present. */
export function hasSession() {
  return Boolean(Cookies.get("allUserInfo"));
}

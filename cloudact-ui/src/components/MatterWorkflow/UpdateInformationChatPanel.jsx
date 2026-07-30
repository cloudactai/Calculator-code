import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { CALCULATOR_API } from "../../config";
import { patchMatterIntake } from "../../utils/Apis/matters/saveMatterInformation/saveMattersActions";
import refreshIcon from "../../assets/images/refresh-icon.png";
import {
  buildUpdateContextMessage,
  normalizeStoredIntakeData,
} from "./matterIntakeContext";
import { diffMatterSnapshots } from "./matterUpdateDiff";
import "./MatterWorkflow.css";

/**
 * Full-page inline "Update Information" AI chat panel.
 *
 * Same chat shell as MatterIntakeChatPanel, but it talks to the Flask
 * /update-chat endpoint, whose agent only edits values already on file. The
 * conversation opens by asking the lawyer what they want to change.
 *
 * Each reply that carries changes is written straight to the database through
 * the AI patch endpoint, which reads the matter back afterwards. The
 * "changed from X to Y" receipt under the reply is computed from that real
 * before/after pair, so it reflects what the database actually holds rather
 * than what the assistant said it did.
 *
 * Props:
 *   matterData      – fresh database snapshot (get_single_matter_data_all shape)
 *   matterId        – string
 *   onSaved         – (savedMatter) => void   after every successful write
 *   onChangeApplied – () => void              after a write that changed a value
 *   onBack          – () => void
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

export default function UpdateInformationChatPanel({
  matterData,
  matterId,
  onSaved,
  onChangeApplied,
  onBack,
}) {
  const dispatch = useDispatch();

  const [bubbles, setBubbles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [contextSent, setContextSent] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  const windowRef = useRef(null);
  const inputRef = useRef(null);
  // The database snapshot this conversation is working against. A ref, not
  // state, because it is the baseline for the next diff and must never be read
  // from a stale render closure.
  const snapshotRef = useRef(matterData || null);

  const storedSections = Object.keys(
    normalizeStoredIntakeData(matterData || {})
  );
  const nothingOnFile = !!matterData && storedSections.length === 0;

  useEffect(() => {
    snapshotRef.current = matterData || null;
  }, [matterData]);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [bubbles, loading, warming]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Open the conversation on its own: the agent's first message asks what the
  // lawyer wants to change. Skipped while the matter has nothing stored yet —
  // there would be nothing to update.
  useEffect(() => {
    if (contextSent || !matterData || nothingOnFile) return;
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData, contextSent, nothingOnFile]);

  function startConversation() {
    const primer = buildUpdateContextMessage(snapshotRef.current || matterData);
    if (!primer) return;
    setContextSent(true);
    send(primer, { hideUserBubble: true });
  }

  // Write this reply's changes, then report what the database actually did.
  // Never throws: a rejected write has to be visible in the transcript, because
  // the assistant has already claimed the change in the bubble above it.
  async function applyChanges(sections) {
    const patches = (Array.isArray(sections) ? sections : []).filter(
      ({ section, data }) => section && data !== undefined
    );
    if (patches.length === 0) return;

    const before = snapshotRef.current;
    try {
      const result = await dispatch(
        patchMatterIntake({ matter_id: matterId, patches })
      );
      const after = result?.matter || null;
      if (!after) {
        // Nothing to compare against, so claiming a change would be a guess.
        setBubbles((b) => [
          ...b,
          {
            role: "receipt",
            changes: [],
            note: "Saved, but the updated record could not be read back to confirm the new values.",
          },
        ]);
        return;
      }

      snapshotRef.current = after;
      const changes = diffMatterSnapshots(before, after);
      setBubbles((b) => [...b, { role: "receipt", changes }]);
      setChangeCount((n) => n + changes.length);
      if (onSaved) onSaved(after);
      if (changes.length > 0 && onChangeApplied) onChangeApplied();
    } catch {
      setBubbles((b) => [
        ...b,
        {
          role: "error",
          text: "That change was not saved — the database rejected the update, so nothing on file has changed. Please ask for it again.",
        },
      ]);
    }
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
      const res = await fetch(`${CALCULATOR_API}/update-chat`, {
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
        await applyChanges(data.saved_sections);
      }
    } catch {
      setBubbles((b) => [
        ...b,
        {
          role: "error",
          text: "The assistant could not be reached, so nothing was changed. Please send that again.",
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
    setChangeCount(0);
    // Re-opens the conversation from the latest snapshot, including any change
    // already made in this session.
    setContextSent(false);
  }

  return (
    <div className="mw-chat-panel">
      {changeCount > 0 && (
        <div className="mw-chat-panel__saved">
          Saved to the database: {changeCount}{" "}
          {changeCount === 1 ? "value" : "values"} changed in this session.
        </div>
      )}

      <div className="mw-chat-panel__window" ref={windowRef}>
        {bubbles.length === 0 && !loading && (
          <div className="mw-chat-panel__welcome">
            <h3>Update Information Assistant</h3>
            {nothingOnFile ? (
              <>
                <p>
                  Nothing is saved on this matter yet, so there is nothing to
                  update. Run <strong>Matter Intake</strong> first, then come
                  back here to change any saved value.
                </p>
                <div className="mw-chat-panel__starters">
                  <button className="mw-chip" onClick={() => onBack && onBack()}>
                    Back to Tasks
                  </button>
                </div>
              </>
            ) : (
              <p>
                Tell me what you want to change — a valuation, an address, an
                income figure, a date — and I'll confirm the old and new values
                and save the change straight away.
              </p>
            )}
          </div>
        )}

        {bubbles.map((b, i) => {
          if (b.role === "receipt") {
            return (
              <div key={i} className="mw-chat-row mw-chat-row--assistant">
                <div className="mw-chat-row__label">
                  {b.changes.length > 0 ? "Saved to database" : "Database unchanged"}
                </div>
                {b.changes.length > 0 ? (
                  <div className="mw-change-receipt">
                    <ul className="mw-change-receipt__list">
                      {b.changes.map((c, j) => (
                        <li key={j} className="mw-change-receipt__item">
                          <span className="mw-change-receipt__field">
                            {c.label}
                          </span>
                          <span className="mw-change-receipt__values">
                            <span className="mw-change-receipt__from">
                              {c.from}
                            </span>
                            <span className="mw-change-receipt__arrow">→</span>
                            <span className="mw-change-receipt__to">{c.to}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mw-change-receipt mw-change-receipt--empty">
                    {b.note ||
                      "No stored value changed — the record already held that value."}
                  </div>
                )}
              </div>
            );
          }

          if (b.role === "error") {
            return (
              <div key={i} className="mw-chat-row mw-chat-row--assistant">
                <div className="mw-chat-row__label">Not saved</div>
                <div className="mw-chat-bubble mw-chat-bubble--error">
                  {b.text}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={`mw-chat-row mw-chat-row--${b.role}`}>
              <div className="mw-chat-row__label">
                {b.role === "user" ? "You" : "AI Assistant"}
              </div>
              <div
                className="mw-chat-bubble"
                dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
              />
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
          placeholder="Describe the change you want to make…"
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

import React, { useEffect, useRef, useState } from "react";
import { CALCULATOR_API } from "../../config";
import { getAuthToken } from "../../utils/authToken";
import { agreementsService } from "../../services/agreementsService";
import { downloadBlob } from "../../utils/downloadBlob";
import { getAgreementType } from "./agreementTypes";
import {
  applyAgreementPatches,
  normalizeAgreementAnswers,
} from "./agreementSections";
import {
  buildAgreementData,
  fetchAgreementCalcReports,
  agreementOutstandingFields,
} from "./agreementResolver";
import { buildAgreementContextMessage } from "./agreementContext";
import SeparationAgreementDocument from "./SeparationAgreementDocument";
import refreshIcon from "../../assets/images/refresh-icon.png";
import "./MatterWorkflow.css";

/**
 * Split-pane chat + live document for drafting an agreement. Sibling to
 * UpdateInformationChatPanel.jsx (same chat shell/classes), but:
 *   - resumable: loads the matter's saved MatterAgreementDocument
 *     (answers + transcript) on open and shows the transcript as history,
 *     rather than always starting fresh;
 *   - drives a live document preview instead of writing to the database —
 *     every reply's saved_sections merge into local `answers` state, which
 *     both the preview and the next primer read from;
 *   - Save Draft persists {answers, transcript}; Generate PDF renders the
 *     preview's own HTML through Flask's /agreement-pdf (xhtml2pdf) and
 *     uploads the result.
 *
 * Props:
 *   matterData    – fresh database snapshot (getMatterData shape)
 *   matterId      – string
 *   agreementType – string, e.g. "separation_agreement"
 *   onBack        – () => void
 */

/** Flask's /agreement-chat and /agreement-pdf are guarded by the same
 * require_auth decorator as /update-chat, decoding the same JWT_SECRET the
 * auth-server signs its tokens with (userId claim) — so the lawyer's
 * existing session token authenticates here too, once it's actually sent. */
function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function renderText(text) {
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export default function AgreementChatPanel({
  matterData,
  matterId,
  agreementType = "separation_agreement",
  onBack,
}) {
  const agreementTypeInfo = getAgreementType(agreementType);

  const [resumed, setResumed] = useState(false);
  const [answers, setAnswers] = useState(normalizeAgreementAnswers({}));
  const [historyBubbles, setHistoryBubbles] = useState([]); // loaded transcript, shown as read-only history
  const [calcReports, setCalcReports] = useState({ childSupportReport: null, spousalSupportReport: null });

  const [bubbles, setBubbles] = useState([]); // this session's live turns
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [contextSent, setContextSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [hasPdf, setHasPdf] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);

  const windowRef = useRef(null);
  const inputRef = useRef(null);
  const previewRef = useRef(null);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Load the saved MatterAgreementDocument (answers + transcript) and the
  // matter's saved calculation reports (child/spousal support, read-only —
  // never written to here) once, on open.
  useEffect(() => {
    let active = true;
    setResumed(false);
    Promise.all([
      agreementsService.getAgreement(matterId, agreementType).catch((error) => {
        console.error("Unable to load the saved agreement.", error);
        return null;
      }),
      fetchAgreementCalcReports(matterId),
    ]).then(([saved, reports]) => {
      if (!active) return;
      setAnswers(normalizeAgreementAnswers(saved?.answers));
      setHistoryBubbles(Array.isArray(saved?.transcript) ? saved.transcript : []);
      setHasPdf(!!saved?.hasPdf);
      setCalcReports(reports);
      setResumed(true);
    });
    return () => {
      active = false;
    };
  }, [matterId, agreementType]);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [bubbles, loading, warming]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const agreementData = buildAgreementData({
    matterData,
    childSupportReport: calcReports.childSupportReport,
    spousalSupportReport: calcReports.spousalSupportReport,
    answers,
  });
  const outstanding = agreementOutstandingFields(agreementData);

  // Open the conversation once resume data has loaded. Skipped when nothing
  // is left to ask — starting a turn with no outstanding topic would just
  // waste a call and produce a reply with nothing to say.
  useEffect(() => {
    if (!resumed || contextSent || outstanding.length === 0) return;
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumed, contextSent, outstanding.length]);

  function startConversation() {
    const primer = buildAgreementContextMessage(agreementData);
    if (!primer) return;
    setContextSent(true);
    send(primer, { hideUserBubble: true });
  }

  function persistDraft(nextAnswers, nextBubbles) {
    const transcript = [...historyBubbles, ...nextBubbles].filter(
      (b) => b.role === "user" || b.role === "assistant"
    );
    setSaving(true);
    agreementsService
      .saveAgreementDraft(matterId, agreementType, { answers: nextAnswers, transcript })
      .catch((error) => {
        console.error("The agreement draft could not be saved.", error);
      })
      .finally(() => setSaving(false));
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
      const res = await fetch(`${CALCULATOR_API}/agreement-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (data.error) {
        setBubbles((b) => [...b, { role: "assistant", text: `Sorry — ${data.error}` }]);
      } else {
        const nextAnswers = applyAgreementPatches(answersRef.current, data.saved_sections);
        setAnswers(nextAnswers);
        setMessages(data.messages || nextMessages);
        setBubbles((b) => {
          const next = [...b, { role: "assistant", text: data.reply }];
          persistDraft(nextAnswers, next);
          return next;
        });
      }
    } catch {
      setBubbles((b) => [
        ...b,
        {
          role: "error",
          text: "The assistant could not be reached. Please send that again.",
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

  async function resetChat() {
    try {
      await agreementsService.resetAgreementChat(matterId, agreementType);
    } catch (error) {
      console.error("Unable to reset the agreement chat.", error);
    }
    setHistoryBubbles([]);
    setBubbles([]);
    setMessages([]);
    setInput("");
    setAnswers(normalizeAgreementAnswers({}));
    setContextSent(false);
  }

  async function handleSaveDraft() {
    persistDraft(answers, bubbles);
  }

  async function handleGeneratePdf() {
    if (!previewRef.current) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Separation Agreement</title></head><body>${previewRef.current.innerHTML}</body></html>`;
      const res = await fetch(`${CALCULATOR_API}/agreement-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not generate the PDF.");
      }
      const blob = await res.blob();
      const filename = `${agreementType}_${matterId}.pdf`;
      await agreementsService.saveAgreementPdf(matterId, agreementType, blob, filename);
      setHasPdf(true);
    } catch (error) {
      console.error("Could not generate the agreement PDF.", error);
      setPdfError(error.message || "Could not generate the PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloadBusy(true);
    try {
      const res = await agreementsService.downloadAgreementPdf(matterId, agreementType);
      const blob = new Blob([res.data], { type: "application/pdf" });
      downloadBlob(blob, `${agreementType}_${matterId}.pdf`);
    } catch (error) {
      console.error("Could not download the agreement PDF.", error);
    } finally {
      setDownloadBusy(false);
    }
  }

  const allBubbles = [...historyBubbles, ...bubbles];

  return (
    <div className="mw-agreement-panel">
      <div className="mw-chat-panel mw-agreement-panel__chat">
        <div className="mw-chat-panel__window" ref={windowRef}>
          {allBubbles.length === 0 && !loading && (
            <div className="mw-chat-panel__welcome">
              <h3>{agreementTypeInfo?.label || "Draft Agreement"} Assistant</h3>
              {outstanding.length === 0 ? (
                <p>
                  Everything this agreement needs has already been answered.
                  Review the preview on the right and generate the PDF when
                  you&rsquo;re ready.
                </p>
              ) : (
                <p>
                  I&rsquo;ll ask about the handful of details this agreement
                  still needs — everything already on file fills in
                  automatically on the right.
                </p>
              )}
            </div>
          )}

          {allBubbles.map((b, i) => {
            if (b.role === "error") {
              return (
                <div key={i} className="mw-chat-row mw-chat-row--assistant">
                  <div className="mw-chat-row__label">Not saved</div>
                  <div className="mw-chat-bubble mw-chat-bubble--error">{b.text}</div>
                </div>
              );
            }
            return (
              <div key={i} className={`mw-chat-row mw-chat-row--${b.role}`}>
                <div className="mw-chat-row__label">{b.role === "user" ? "You" : "CloudAct"}</div>
                <div
                  className="mw-chat-bubble"
                  dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
                />
              </div>
            );
          })}

          {loading && (
            <div className="mw-chat-row mw-chat-row--assistant">
              <div className="mw-chat-row__label">CloudAct</div>
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
            placeholder="Answer the assistant's question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="mw-chat-panel__send"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
          <button
            className="mw-chat-panel__reset"
            onClick={resetChat}
            aria-label="Reset chat — clears this conversation only, never saved matter data or a generated PDF"
            title="Reset chat (clears this conversation only — never saved matter data or a generated PDF)"
          >
            <img src={refreshIcon} alt="" aria-hidden="true" className="mw-chat-panel__reset-icon" />
          </button>
        </div>
      </div>

      <div className="mw-agreement-panel__preview">
        <div className="mw-agreement-panel__preview-scroll">
          <div ref={previewRef}>
            <SeparationAgreementDocument agreementData={agreementData} />
          </div>
        </div>

        <div className="mw-agreement-panel__toolbar-float">
          {pdfError && <div className="mw-agreement-panel__pdf-error">{pdfError}</div>}
          {saving && <span className="mw-agreement-panel__status">Saving draft…</span>}
          <div className="mw-agreement-panel__toolbar-buttons">
            <button
              type="button"
              className="mw-chip"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              Save Draft
            </button>
            <button
              type="button"
              className="mw-save-btn"
              onClick={handleGeneratePdf}
              disabled={pdfBusy}
            >
              {pdfBusy ? "Generating…" : "Generate PDF"}
            </button>
            {hasPdf && (
              <button
                type="button"
                className="mw-download-btn"
                onClick={handleDownloadPdf}
                disabled={downloadBusy}
              >
                {downloadBusy ? "Downloading…" : "Download PDF"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

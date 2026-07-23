import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Layout from "../../components/LayoutComponents/Layout";
import { CALCULATOR_API } from "../../config";
import { getAllMatters } from "../../utils/Apis/matters/getMatters/getMattersActions";
import { selectMattersData } from "../../utils/Apis/matters/getMatters/getMattersSelectors";
import { patchMatterIntake } from "../../utils/Apis/matters/saveMatterInformation/saveMattersActions";
import "../../components/MatterWorkflow/MatterWorkflow.css";
import "./T1Upload.css";

/**
 * T1 Upload — AI extraction page.
 *
 * Chat-style flow that mirrors the Matter Intake assistant's shell
 * (mw-chat-* classes) but is upload-driven instead of free-text:
 *
 *   1. Assistant asks for the client's T1 (PDF or photo).
 *   2. The user side of the chat shows an upload box; picking a file posts
 *      it (base64) to the Flask /t1-extract endpoint.
 *   3. While extraction runs, the assistant side shows a skeleton T1 page
 *      being "scanned".
 *   4. The extraction comes back as an editable review card. Nothing is
 *      persisted until the user picks a matter and confirms — saving goes
 *      through the same patch_matter_intake path as the AI intake agent,
 *      so the data lands exactly where the manual/AI intake stores it.
 */

const ACCEPTED_MEDIA_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const EXT_TO_MEDIA_TYPE = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const MAX_FILE_BYTES = 30 * 1024 * 1024; // backend caps the request at ~32 MB decoded

const EMPTY_TAXPAYER = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  maritalStatus: "",
  address: "",
  poBox: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
  email: "",
  spouseName: "",
};

const WELCOME_TEXT =
  "This tool reads a client's T1 Income Tax and Benefit Return and extracts " +
  "the intake details automatically. Upload the T1 below as a PDF or a clear " +
  "photo. You can review and edit all extracted identification and income " +
  "information before anything is saved.";

function fileMediaType(file) {
  if (ACCEPTED_MEDIA_TYPES.includes(file.type)) return file.type;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return EXT_TO_MEDIA_TYPE[ext] || null;
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function monthlyFromYearly(amount) {
  const v = parseFloat(String(amount).replace(/[^0-9.-]/g, ""));
  if (!isFinite(v)) return "";
  return (v / 12).toFixed(2);
}

/** Normalise the backend extraction into a fully-populated editable shape. */
function normalizeExtraction(extracted) {
  const ex = extracted || {};
  const taxpayer = { ...EMPTY_TAXPAYER, ...(ex.taxpayer || {}) };
  const incomeLines = (Array.isArray(ex.incomeLines) ? ex.incomeLines : [])
    .map((l) => ({
      line: l?.line || "",
      label: l?.label || "",
      amount: l?.amount || "",
    }));
  return {
    taxYear: ex.taxYear || "",
    taxpayer,
    incomeLines,
  };
}

/**
 * Convert the (user-reviewed) extraction into patch_matter_intake patches —
 * the same section shapes the AI intake agent saves, so the T1 data lands in
 * the matter's stored intake exactly like a conversational intake would.
 * Only non-blank values are sent: patches never clear stored data.
 */
function buildPatches(data) {
  const patches = [];
  const t = data.taxpayer || {};

  const client = {};
  const name = [t.firstName, t.lastName].map((s) => String(s || "").trim()).filter(Boolean).join(" ");
  if (name) client.name = name;
  if (t.dateOfBirth) client.dateOfBirth = t.dateOfBirth;
  const address = [t.address, t.city].map((s) => String(s || "").trim()).filter(Boolean).join(", ");
  if (address) client.address = address;
  if (String(t.poBox || "").trim()) client.poBox = String(t.poBox).trim();
  if (t.province) client.province = t.province;
  if (t.postalCode) client.postalCode = t.postalCode;
  if (t.phone) client.phone = t.phone;
  if (t.email) client.email = t.email;
  if (String(t.maritalStatus || "").trim()) client.maritalStatus = String(t.maritalStatus).trim();

  // The taxpayer's spouse (per the T1) is the opposing party on the matter.
  const opposingParty = {};
  const spouseName = String(t.spouseName || "").trim();
  if (spouseName) opposingParty.name = spouseName;

  const background = {};
  if (Object.keys(client).length > 0) background.client = { role: "Client", ...client };
  if (Object.keys(opposingParty).length > 0) background.opposingParty = { role: "Opposing Party", ...opposingParty };
  if (Object.keys(background).length > 0) {
    patches.push({ section: "Background", data: background });
  }

  const income = (data.incomeLines || [])
    .filter((l) => String(l.label || "").trim() && String(l.amount || "").trim())
    .map((l) => ({
      type: String(l.label).trim(),
      yearlyAmount: String(l.amount).trim(),
      monthlyAmount: monthlyFromYearly(l.amount),
    }));
  if (income.length > 0) {
    const sectionData = { client: { income } };
    if (String(data.taxYear || "").trim()) {
      sectionData.financialYear = String(data.taxYear).trim();
    }
    patches.push({ section: "IncomeAndBenefits", data: sectionData });
  }

  return patches;
}

export default function T1UploadPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { response } = useSelector((state) => state.userProfileInfo);
  const userMatters = useSelector(selectMattersData);
  const matters = Array.isArray(userMatters?.body) ? userMatters.body : [];

  // When launched from a matter's task list, the matter is fixed — the T1 data
  // saves straight into it and the matter picker is hidden.
  const lockedMatter = location.state?.matterNumber
    ? String(location.state.matterNumber)
    : "";

  // upload → scanning → review → saving → saved | declined ("error" pairs with uploadError)
  const [stage, setStage] = useState("upload");
  const [fileMeta, setFileMeta] = useState(null); // { name, size }
  const [data, setData] = useState(null); // editable extraction
  const [uploadError, setUploadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [selectedMatter, setSelectedMatter] = useState(lockedMatter);
  const [savedMatter, setSavedMatter] = useState("");

  const fileInputRef = useRef(null);
  const windowRef = useRef(null);

  useEffect(() => {
    dispatch(getAllMatters());
  }, [dispatch]);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [stage, uploadError, saveError]);

  function resetFlow() {
    setStage("upload");
    setFileMeta(null);
    setData(null);
    setUploadError(null);
    setSaveError(null);
    setSelectedMatter(lockedMatter);
    setSavedMatter("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function pickFile() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const mediaType = fileMediaType(file);
    if (!mediaType) {
      setUploadError("That file type isn't supported. Please upload the T1 as a PDF or an image (PNG, JPEG or WebP).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("That file is over 30 MB. Please upload a smaller copy of the T1.");
      return;
    }

    setUploadError(null);
    setFileMeta({ name: file.name, size: file.size });
    setStage("scanning");

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.slice(result.indexOf(",") + 1));
        };
        reader.onerror = () => reject(new Error("read-failed"));
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${CALCULATOR_API}/t1-extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_type: mediaType, data: base64 }),
      });
      const payload = await res.json();

      if (!res.ok || payload.error || !payload.extracted) {
        setUploadError(payload.error || "Something went wrong while reading the T1. Please try again.");
        setStage("upload");
        return;
      }

      setData(normalizeExtraction(payload.extracted));
      setStage("review");
    } catch {
      setUploadError("The T1 could not be scanned — the connection to the extraction service failed. Please try again.");
      setStage("upload");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function setTaxpayerField(key, value) {
    setData((d) => ({ ...d, taxpayer: { ...d.taxpayer, [key]: value } }));
  }

  function setTopField(key, value) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function setIncomeLine(index, key, value) {
    setData((d) => {
      const incomeLines = d.incomeLines.map((l, i) =>
        i === index ? { ...l, [key]: value } : l
      );
      return { ...d, incomeLines };
    });
  }

  function addIncomeLine() {
    setData((d) => ({
      ...d,
      incomeLines: [...d.incomeLines, { line: "", label: "", amount: "" }],
    }));
  }

  function removeIncomeLine(index) {
    setData((d) => ({
      ...d,
      incomeLines: d.incomeLines.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    if (!selectedMatter || !data) return;
    const patches = buildPatches(data);
    if (patches.length === 0) {
      setSaveError("There's nothing to save — add at least a name or one income line first.");
      return;
    }
    setSaveError(null);
    setStage("saving");
    try {
      await dispatch(patchMatterIntake({ matter_id: selectedMatter, patches }));
      setSavedMatter(selectedMatter);
      setStage("saved");
    } catch {
      setSaveError("The matter could not be updated. Your edits are still here — please try saving again.");
      setStage("review");
    }
  }

  function handleDecline() {
    setStage("declined");
  }

  const reviewLocked = stage === "saving" || stage === "saved" || stage === "declined";
  const showUploadBox = stage === "upload";
  const showReview = data && (stage === "review" || stage === "saving" || stage === "saved" || stage === "declined");

  const uploadIcon = (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

  return (
    <Layout title={`Welcome ${response?.username ? response.username : ""} `}>
      <div className="single-matter panel trans has-chat t1-page">
        <div className="pHead">
          <div className="sm-chat-head">
            <h3 className="sm-chat-head__title">T1 Upload</h3>
          </div>
          <span className="t1-page__tagline">
            Upload a client's T1 return and let the AI fill in the intake for you
          </span>
        </div>

        <div className="pBody">
          <div className="mw-chat-panel">
            <div className="mw-chat-panel__window" ref={windowRef}>
              {/* 1 — assistant welcome */}
              <div className="mw-chat-row mw-chat-row--assistant">
                <div className="mw-chat-row__label">AI Assistant</div>
                <div className="mw-chat-bubble">{WELCOME_TEXT}</div>
              </div>

              {/* 2 — user side: the chosen file (stays visible for the whole flow) */}
              {fileMeta && (
                <div className="mw-chat-row mw-chat-row--user">
                  <div className="mw-chat-row__label">You</div>
                  <div className="mw-chat-bubble">
                    <span className="t1-file-chip">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {fileMeta.name}
                      <em>({formatFileSize(fileMeta.size)})</em>
                    </span>
                  </div>
                </div>
              )}

              {/* upload / extraction error, followed by a fresh upload box */}
              {uploadError && (
                <div className="mw-chat-row mw-chat-row--assistant">
                  <div className="mw-chat-row__label">AI Assistant</div>
                  <div className="mw-chat-bubble">
                    <span className="t1-error">{uploadError}</span>
                  </div>
                </div>
              )}

              {showUploadBox && (
                <div className="mw-chat-row mw-chat-row--user">
                  <div className="mw-chat-row__label">You</div>
                  <button type="button" className="t1-upload-box" onClick={pickFile}>
                    <span className="t1-upload-box__icon">{uploadIcon}</span>
                    <span className="t1-upload-box__title">Upload</span>
                    <span className="t1-upload-box__hint">T1 return · PDF or photo</span>
                  </button>
                </div>
              )}

              {/* 3 — assistant side: skeleton T1 while scanning */}
              {stage === "scanning" && (
                <div className="mw-chat-row mw-chat-row--assistant">
                  <div className="mw-chat-row__label">AI Assistant</div>
                  <div className="mw-chat-bubble t1-scan-bubble">
                    <div className="t1-skel" aria-label="Scanning the uploaded T1">
                      <div className="t1-skel__page">
                        <div className="t1-skel__beam" />
                        <div className="t1-skel__header">
                          <span className="t1-skel__badge" />
                          <span className="t1-skel__line t1-skel__line--title" />
                        </div>
                        <div className="t1-skel__band" />
                        {[68, 44, 58, 36, 62, 48, 54].map((w, i) => (
                          <div className="t1-skel__row" key={i}>
                            <span className="t1-skel__line" style={{ width: `${w}%` }} />
                            <span className="t1-skel__box" />
                          </div>
                        ))}
                      </div>
                      <div className="t1-skel__caption">
                        Scanning your T1
                        <span className="mw-dot" />
                        <span className="mw-dot" />
                        <span className="mw-dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4 — assistant side: editable extraction + save prompt */}
              {showReview && (
                <div className="mw-chat-row mw-chat-row--assistant">
                  <div className="mw-chat-row__label">AI Assistant</div>
                  <div className="mw-chat-bubble t1-review">
                    <p className="t1-review__intro">
                      Based on documents provided, we have imputed the following
                      income to Party 1. Please review and edit:
                    </p>

                    <div className="t1-review__card">
                      <div className="t1-review__section">
                        <h4>Return</h4>
                        <div className="t1-review__grid">
                          <label>
                            Tax year
                            <input
                              value={data.taxYear}
                              disabled={reviewLocked}
                              onChange={(e) => setTopField("taxYear", e.target.value)}
                            />
                          </label>
                          <label>
                            Marital status
                            <input
                              value={data.taxpayer.maritalStatus}
                              disabled={reviewLocked}
                              onChange={(e) => setTaxpayerField("maritalStatus", e.target.value)}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="t1-review__section">
                        <h4>Taxpayer identification</h4>
                        <div className="t1-review__grid">
                          {[
                            ["firstName", "First name"],
                            ["lastName", "Last name"],
                            ["dateOfBirth", "Date of birth"],
                            ["address", "Street address"],
                            ["poBox", "PO Box"],
                            ["city", "City"],
                            ["province", "Province"],
                            ["postalCode", "Postal code"],
                            ["phone", "Phone"],
                            ["email", "Email"],
                            ["spouseName", "Spouse name"],
                          ].map(([key, label]) => (
                            <label key={key}>
                              {label}
                              <input
                                value={data.taxpayer[key]}
                                disabled={reviewLocked}
                                onChange={(e) => setTaxpayerField(key, e.target.value)}
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="t1-review__section">
                        <h4>Income</h4>
                        {data.incomeLines.length === 0 && (
                          <p className="t1-review__empty">
                            No income lines were found — add any that apply.
                          </p>
                        )}
                        {data.incomeLines.map((line, i) => (
                          <div className="t1-income-row" key={i}>
                            <input
                              className="t1-income-row__line"
                              placeholder="Line #"
                              value={line.line}
                              disabled={reviewLocked}
                              onChange={(e) => setIncomeLine(i, "line", e.target.value)}
                            />
                            <input
                              className="t1-income-row__label"
                              placeholder="Income type"
                              value={line.label}
                              disabled={reviewLocked}
                              onChange={(e) => setIncomeLine(i, "label", e.target.value)}
                            />
                            <input
                              className="t1-income-row__amount"
                              placeholder="Yearly amount"
                              value={line.amount}
                              disabled={reviewLocked}
                              onChange={(e) => setIncomeLine(i, "amount", e.target.value)}
                            />
                            {!reviewLocked && (
                              <button
                                type="button"
                                className="t1-income-row__remove"
                                aria-label="Remove income line"
                                title="Remove line"
                                onClick={() => removeIncomeLine(i)}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        {!reviewLocked && (
                          <button type="button" className="t1-add-line" onClick={addIncomeLine}>
                            + Add income line
                          </button>
                        )}
                      </div>
                    </div>

                    {(stage === "review" || stage === "saving") && (
                      <div className="t1-savebar">
                        <span className="t1-savebar__question">
                          Should I save this to a matter?
                        </span>
                        <div className="t1-savebar__controls">
                          {lockedMatter ? (
                            <span className="t1-savebar__matter">
                              Matter {lockedMatter}
                            </span>
                          ) : (
                            <select
                              value={selectedMatter}
                              disabled={stage === "saving"}
                              onChange={(e) => setSelectedMatter(e.target.value)}
                            >
                              <option value="">Select a matter…</option>
                              {matters.map((m) => (
                                <option key={m.matterNumber} value={m.matterNumber}>
                                  {m.matterNumber}
                                  {m.client_id ? ` — ${m.client_id}` : ""}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            className="btn btnPrimary rounded-pill t1-savebar__save"
                            disabled={!selectedMatter || stage === "saving"}
                            onClick={handleSave}
                          >
                            {stage === "saving" ? "Saving…" : "Save to matter"}
                          </button>
                          <button
                            type="button"
                            className="t1-savebar__decline"
                            disabled={stage === "saving"}
                            onClick={handleDecline}
                          >
                            Don't save
                          </button>
                        </div>
                        <span className="t1-savebar__hint">
                          The client's identification, marital status and income lines are
                          saved into the matter's intake. The uploaded file itself is
                          never stored.
                        </span>
                        {saveError && <span className="t1-error">{saveError}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5 — outcome */}
              {stage === "saved" && (
                <div className="mw-chat-row mw-chat-row--assistant">
                  <div className="mw-chat-row__label">AI Assistant</div>
                  <div className="mw-chat-bubble">
                    <span className="t1-success">
                      ✓ Fields populated.
                    </span>{" "}
                    Saved to matter {savedMatter}. The client's identification and
                    income are now in the matter's intake and will populate the
                    forms and calculator.
                    <div className="mw-chat-panel__starters">
                      <button className="mw-chip" onClick={resetFlow}>
                        Upload another T1
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {stage === "declined" && (
                <div className="mw-chat-row mw-chat-row--assistant">
                  <div className="mw-chat-row__label">AI Assistant</div>
                  <div className="mw-chat-bubble">
                    No problem — nothing was saved. Upload another T1 whenever
                    you're ready.
                    <div className="mw-chat-panel__starters">
                      <button className="mw-chip" onClick={resetFlow}>
                        Upload another T1
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={handleFileChosen}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

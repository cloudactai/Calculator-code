// Ported from Report-Generation (frontend/src/components/addLawFirm.jsx).
// Step 1 of the two-step setup wizard. Adapted for CRA + react-router-dom v5
// (useHistory instead of useNavigate; process.env instead of import.meta.env).
import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { apiPath } from "./apiUrls";
import { SETUP_WIZARD_API } from "../../config";
import cloudactLogo from "../../assets/images/cloudact-logo.svg";
import "./addLawFirm.css";

export default function AddLawFirm() {
  const history = useHistory();
  const location = useLocation();
  const initial = location.state?.formData || {};
  const [formData, setFormData] = useState({
    lawFirmName: initial.lawFirmName || "",
    shortName: initial.shortName || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleBack() {
    history.push("/home");
  }

  async function handleNext() {
    setError("");

    const lawFirmName = String(formData.lawFirmName || "").trim();
    const shortName = String(formData.shortName || "").trim().toUpperCase();

    if (!lawFirmName) {
      setError("Law firm name is required.");
      return;
    }
    if (!shortName) {
      setError("Short firm name is required.");
      return;
    }
    if (shortName.length < 3 || shortName.length > 6) {
      setError("Short firm name must be between 3 and 6 characters.");
      return;
    }
    if (!/^[A-Z]+$/.test(shortName)) {
      setError("Short firm name must contain capital letters only.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        apiPath(
          process.env.REACT_APP_API_BACKEND_URL_LAW_FIRM,
          `${SETUP_WIZARD_API}/api/law-firm`
        ),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firmName: lawFirmName,
            shortName,
          }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        history.push("/signIn");
        return;
      }
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save law firm.");
      }

      history.push({
        pathname: "/setupwizard/connect",
        state: {
          formData: {
            lawFirmName,
            shortName,
          },
        },
      });
    } catch (err) {
      setError(err?.message || "Failed to save law firm.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="alf-page">
      <Link to="/home" className="alf-logo-link" aria-label="Go to home">
        <img src={cloudactLogo} alt="CloudAct" className="alf-logo" />
      </Link>

      <h1 className="alf-heading">Set up your account</h1>

      <div className="alf-stepper" aria-label="Setup steps">
        <div className="alf-step">
          <div className="alf-step-dot is-current" />
          <div className="alf-step-label">Add a Law firm</div>
        </div>
        <div className="alf-step-line" />
        <div className="alf-step">
          <div className="alf-step-dot is-pending" />
          <div className="alf-step-label">Connect to Clio &amp; QBO</div>
        </div>
      </div>

      <div className="alf-card-wrap">
        <h2 className="alf-section-title">Add a Law Firm</h2>
        <p className="alf-subtitle">Enter organization details below</p>

        <div className="alf-field">
          <label className="alf-field-label" htmlFor="alf-lawFirmName">
            Law Firm name
          </label>
          <input
            id="alf-lawFirmName"
            type="text"
            className="alf-field-input"
            placeholder="Enter Law Firm name"
            value={formData.lawFirmName}
            onChange={(e) => handleChange("lawFirmName", e.target.value)}
          />
        </div>

        <div className="alf-field">
          <label className="alf-field-label" htmlFor="alf-shortName">
            Law Firm`s short name
          </label>
          <input
            id="alf-shortName"
            type="text"
            className="alf-field-input"
            placeholder="Enter Law Firm`s short name"
            value={formData.shortName}
            onChange={(e) => handleChange("shortName", e.target.value)}
          />
          <p className="alf-helper">
            *Short Name should not contain spaces and must be between 3 to 6
            characters.
          </p>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}
      </div>

      <div className="alf-actions">
        <button type="button" className="alf-button is-back" onClick={handleBack}>
          Back to Home
        </button>
        <button
          type="button"
          className="alf-button is-next"
          disabled={saving}
          onClick={handleNext}
        >
          {saving ? "Saving..." : "Next"}
        </button>
      </div>

      <p className="alf-footer">© 2026 CloudAct. All rights Reserved.</p>
    </div>
  );
}

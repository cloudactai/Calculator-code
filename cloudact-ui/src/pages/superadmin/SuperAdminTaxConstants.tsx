import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router";
import Layout from "../../components/LayoutComponents/Layout";
import Loader from "../../components/Loader";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import { RootState } from "./superadmininterface";
import axios from "../../utils/axios";
import { getCurrentUserFromCookies } from "../../utils/helpers";
import { Roles } from "../../routes/Role.types";

interface BracketRow {
  From: number;
  To: number;
  Income_over: number;
  Rate: number;
  Basic: number;
}

interface CareRateRow {
  From: number;
  To: number;
  Rate: number;
}

type ConstantValue = number | string | BracketRow[] | CareRateRow[];

interface YearConstants {
  [key: string]: ConstantValue;
}

interface TaxConstantsData {
  [year: string]: YearConstants;
}

const BRACKET_KEYS = [
  "FEDERAL_BRACKETS",
  "ON_BRACKETS",
  "BC_BRACKETS",
  "AB_BRACKETS",
  "SK_BRACKETS",
  "MB_BRACKETS",
  "ON_HEALTH",
  "ON_CARE_RATES",
];

const SECTION_LABELS: Record<string, string> = {
  FEDERAL_CREDIT_RATE: "Federal",
  BASIC_PERSONAL_AMOUNT_ON: "Ontario",
  BASE_CPP_LIMIT: "CPP",
  EI_RATE: "Employment Insurance",
  CWB_SINGLE_MAX: "Canada Workers Benefit",
  CCB_CHILD_UNDER_6: "Canada Child Benefit",
  GST_BASE_CREDIT: "GST/HST Benefit",
  OCB_BASE: "Ontario Child Benefit",
  OSTC_BASE: "Ontario Sales Tax Credit",
  CAI_INDIVIDUAL: "Climate Action Incentive (ON)",
  BC_CWB_SINGLE_MAX: "Canada Workers Benefit (BC)",
  BASIC_PERSONAL_AMOUNT_BC: "British Columbia",
  BC_TAX_REDUCTION_BASE: "BC Tax Reduction",
  BC_CHILD_BENEFIT_BASE_1: "BC Child Benefit",
  BC_CLIMATE_ACTION_BASIC: "BC Climate Action",
  BASIC_PERSONAL_AMOUNT_AB: "Alberta",
  AB_CWB_SINGLE_MAX: "Canada Workers Benefit (AB)",
  ACFB_BASE_1_CHILD: "Alberta Child & Family Benefit",
  AB_CLIMATE_ACTION_BASE: "Alberta Climate Action",
  BASIC_PERSONAL_AMOUNT_SK: "Saskatchewan",
  SK_CLIMATE_ACTION_BASE: "Saskatchewan Climate Action",
  SK_SLITC_INDIVIDUAL: "Saskatchewan Low-Income Tax Credit",
  BASIC_PERSONAL_AMOUNT_MB: "Manitoba",
  MB_CLIMATE_ACTION_BASE: "Manitoba Climate Action",
  ON_SURTAX_THRESHOLD_1: "Ontario Surtax",
  ON_TAX_REDUCTION_BASE: "Ontario Tax Reduction",
  ON_LIFT_MAX: "Ontario LIFT Credit",
};

function isComment(key: string): boolean {
  return key.startsWith("_comment") || key.startsWith("A") && key.includes("_COMMENT");
}

function isNumericConstant(key: string, value: ConstantValue): boolean {
  return typeof value === "number" && !isComment(key);
}

function isBracketArray(value: ConstantValue): value is BracketRow[] | CareRateRow[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === "object";
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Cpp/g, "CPP")
    .replace(/Ei /g, "EI ")
    .replace(/Ccb/g, "CCB")
    .replace(/Cwb/g, "CWB")
    .replace(/Gst/g, "GST")
    .replace(/Ocb/g, "OCB")
    .replace(/Ostc/g, "OSTC")
    .replace(/Cai/g, "CAI")
    .replace(/Bc /g, "BC ")
    .replace(/Ab /g, "AB ")
    .replace(/Sk /g, "SK ")
    .replace(/Mb /g, "MB ")
    .replace(/On /g, "ON ")
    .replace(/Acfb/g, "ACFB")
    .replace(/Slitc/g, "SLITC")
    .replace(/Bpa/g, "BPA")
    .replace(/Lift/g, "LIFT")
    .replace(/Fed$/g, "Federal")
    .replace(/Fed /g, "Federal ");
}

function formatValue(value: number): string {
  if (value >= 1 && value === Math.floor(value)) {
    return value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (value < 1 && value > 0) {
    return (value * 100).toFixed(2) + "%";
  }
  return value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

const SuperAdminTaxConstants: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.userLogin);
  const history = useHistory();
  const currentUser = getCurrentUserFromCookies();
  const isAdmin = currentUser?.role === Roles.ADMIN || currentUser?.role === Roles.SUPERADMIN;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allConstants, setAllConstants] = useState<TaxConstantsData>({});
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [editData, setEditData] = useState<YearConstants>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newYear, setNewYear] = useState("");
  const [showNewYearInput, setShowNewYearInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const fetchConstants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("tax-constants");
      const data = res.data?.data?.body || res.data;
      setAllConstants(data);
      const years = Object.keys(data).sort().reverse();
      if (years.length > 0 && !selectedYear) {
        setSelectedYear(years[0]);
        setEditData(JSON.parse(JSON.stringify(data[years[0]])));
      }
    } catch (error) {
      console.error("Failed to fetch tax constants:", error);
      setSaveMessage({ type: "error", text: "Failed to load tax constants" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConstants();
  }, [fetchConstants]);

  useEffect(() => {
    if (selectedYear && allConstants[selectedYear]) {
      setEditData(JSON.parse(JSON.stringify(allConstants[selectedYear])));
      setHasChanges(false);
      setSaveMessage(null);
    }
  }, [selectedYear]);

  const handleValueChange = (key: string, value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;

    setEditData((prev) => ({ ...prev, [key]: parsed }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleBracketChange = (
    bracketKey: string,
    rowIndex: number,
    field: string,
    value: string
  ) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;

    setEditData((prev) => {
      const brackets = JSON.parse(JSON.stringify(prev[bracketKey])) as Record<string, number>[];
      brackets[rowIndex][field] = parsed;
      return { ...prev, [bracketKey]: brackets };
    });
    setHasChanges(true);
    setSaveMessage(null);
  };

  const addBracketRow = (bracketKey: string) => {
    setEditData((prev) => {
      const brackets = JSON.parse(JSON.stringify(prev[bracketKey])) as Record<string, number>[];
      const lastRow = brackets[brackets.length - 1];
      const newRow: Record<string, number> = {};
      for (const field of Object.keys(lastRow)) {
        newRow[field] = 0;
      }
      brackets.push(newRow);
      return { ...prev, [bracketKey]: brackets };
    });
    setHasChanges(true);
  };

  const removeBracketRow = (bracketKey: string, rowIndex: number) => {
    setEditData((prev) => {
      const brackets = JSON.parse(JSON.stringify(prev[bracketKey])) as Record<string, number>[];
      brackets.splice(rowIndex, 1);
      return { ...prev, [bracketKey]: brackets };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedYear) return;
    setSaving(true);
    try {
      await axios.put(`tax-constants/${selectedYear}`, editData);
      setAllConstants((prev) => ({
        ...prev,
        [selectedYear]: JSON.parse(JSON.stringify(editData)),
      }));
      setHasChanges(false);
      setSaveMessage({ type: "success", text: `Tax constants for ${selectedYear} saved successfully` });
    } catch (error) {
      console.error("Failed to save tax constants:", error);
      setSaveMessage({ type: "error", text: "Failed to save tax constants" });
    }
    setSaving(false);
  };

  const handleDuplicate = async () => {
    if (!newYear || !selectedYear) return;
    if (allConstants[newYear]) {
      setSaveMessage({ type: "error", text: `Year ${newYear} already exists` });
      return;
    }

    setSaving(true);
    try {
      const duplicatedData = JSON.parse(JSON.stringify(editData));
      await axios.put(`tax-constants/${newYear}`, duplicatedData);
      setAllConstants((prev) => ({ ...prev, [newYear]: duplicatedData }));
      setSelectedYear(newYear);
      setEditData(duplicatedData);
      setShowNewYearInput(false);
      setNewYear("");
      setSaveMessage({ type: "success", text: `Tax constants duplicated to ${newYear}` });
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to duplicate year" });
    }
    setSaving(false);
  };

  const handleDiscard = () => {
    if (selectedYear && allConstants[selectedYear]) {
      setEditData(JSON.parse(JSON.stringify(allConstants[selectedYear])));
      setHasChanges(false);
      setSaveMessage(null);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const numericKeys = Object.keys(editData).filter(
    (key) => isNumericConstant(key, editData[key]) && !BRACKET_KEYS.includes(key)
  );

  const filteredKeys = searchTerm
    ? numericKeys.filter(
        (key) =>
          key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formatLabel(key).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : numericKeys;

  const groupedKeys: { label: string; keys: string[] }[] = [];
  let currentGroup: { label: string; keys: string[] } | null = null;

  for (const key of filteredKeys) {
    if (SECTION_LABELS[key]) {
      if (currentGroup) groupedKeys.push(currentGroup);
      currentGroup = { label: SECTION_LABELS[key], keys: [key] };
    } else if (currentGroup) {
      currentGroup.keys.push(key);
    } else {
      if (!currentGroup) currentGroup = { label: "General", keys: [] };
      currentGroup.keys.push(key);
    }
  }
  if (currentGroup) groupedKeys.push(currentGroup);

  const years = Object.keys(allConstants).sort().reverse();

  return (
    <Layout title={`Welcome ${userInfo ? userInfo.username : "Guest"}`}>
      <Loader isLoading={loading || saving} />

      <div className="panel" style={{ backgroundColor: "#F5F9FF" }}>
        <div className="pHead">
          <span className="h5">Tax Constants</span>
          <div className="control" style={{ gap: "8px", display: "flex", alignItems: "center" }}>
            <select
              className="form-select rounded-pill"
              value={selectedYear}
              onChange={(e) => {
                if (hasChanges && !window.confirm("You have unsaved changes. Discard them?")) return;
                setSelectedYear(e.target.value);
              }}
              style={{ width: "120px" }}
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {isAdmin && (showNewYearInput ? (
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <input
                  type="number"
                  className="form-control rounded-pill"
                  placeholder="e.g. 2026"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  style={{ width: "100px" }}
                />
                <button className="btn btnPrimary btn-sm" onClick={handleDuplicate} disabled={!newYear}>
                  Copy
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm rounded-pill"
                  onClick={() => {
                    setShowNewYearInput(false);
                    setNewYear("");
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-outline-primary btn-sm rounded-pill"
                onClick={() => setShowNewYearInput(true)}
              >
                + New Year
              </button>
            ))}

            <button
              className="btn btnPrimary"
              type="button"
              onClick={() => history.push(AUTH_ROUTES.SUPERADMINDB)}
            >
              Home
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div
            className="alert alert-info mx-3 mt-2 mb-0"
            role="alert"
            style={{ fontSize: "13px" }}
          >
            You are viewing tax constants in read-only mode. Only administrators can make changes.
          </div>
        )}

        {saveMessage && (
          <div
            className={`alert ${saveMessage.type === "success" ? "alert-success" : "alert-danger"} mx-3 mt-2 mb-0`}
            role="alert"
          >
            {saveMessage.text}
          </div>
        )}

        {isAdmin && hasChanges && (
          <div
            className="mx-3 mt-2 p-2 d-flex justify-content-between align-items-center"
            style={{
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              border: "1px solid #ffc107",
            }}
          >
            <span style={{ fontWeight: 500 }}>You have unsaved changes</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={handleDiscard}>
                Discard
              </button>
              <button className="btn btn-success btn-sm rounded-pill" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        )}

        <div className="mx-3 mt-2">
          <input
            type="text"
            className="form-control rounded-pill"
            placeholder="Search constants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="pBody pb-0">
          {/* Numeric constants grouped by section */}
          {groupedKeys.map((group) => {
            const isCollapsed = collapsedSections.has(group.label);
            return (
              <div key={group.label} className="mb-3">
                <div
                  onClick={() => toggleSection(group.label)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 12px",
                    backgroundColor: "#e8f0fe",
                    borderRadius: "6px",
                    fontWeight: 600,
                    fontSize: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                >
                  <span>{group.label}</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {isCollapsed ? "+" : "-"} {group.keys.length} values
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="tableOuter mt-1">
                    <table className="table customGrid" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: "50%" }}>Constant</th>
                          <th style={{ width: "25%" }}>Display</th>
                          <th style={{ width: "25%" }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.keys.map((key) => {
                          const val = editData[key] as number;
                          return (
                            <tr key={key}>
                              <td>
                                <span style={{ fontSize: "13px" }}>{formatLabel(key)}</span>
                                <br />
                                <code style={{ fontSize: "11px", color: "#888" }}>{key}</code>
                              </td>
                              <td>
                                <span style={{ fontSize: "13px", color: "#555" }}>
                                  {formatValue(val)}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={val}
                                  step="any"
                                  onChange={(e) => handleValueChange(key, e.target.value)}
                                  disabled={!isAdmin}
                                  style={{ maxWidth: "160px" }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bracket tables */}
          {BRACKET_KEYS.map((bracketKey) => {
            const brackets = editData[bracketKey];
            if (!isBracketArray(brackets)) return null;

            if (
              searchTerm &&
              !bracketKey.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !formatLabel(bracketKey).toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              return null;
            }

            const isCollapsed = collapsedSections.has(bracketKey);
            const fields = Object.keys(brackets[0]);

            return (
              <div key={bracketKey} className="mb-3">
                <div
                  onClick={() => toggleSection(bracketKey)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 12px",
                    backgroundColor: "#fce4ec",
                    borderRadius: "6px",
                    fontWeight: 600,
                    fontSize: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                >
                  <span>{formatLabel(bracketKey)}</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {isCollapsed ? "+" : "-"} {brackets.length} rows
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="tableOuter mt-1">
                    <table className="table customGrid" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: "40px" }}>#</th>
                          {fields.map((field) => (
                            <th key={field}>{field}</th>
                          ))}
                          {isAdmin && <th style={{ width: "60px" }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(brackets as Record<string, number>[]).map((row, rowIdx) => (
                          <tr key={rowIdx}>
                            <td style={{ color: "#999", fontSize: "12px" }}>{rowIdx + 1}</td>
                            {fields.map((field) => (
                              <td key={field}>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row[field]}
                                  step="any"
                                  onChange={(e) =>
                                    handleBracketChange(bracketKey, rowIdx, field, e.target.value)
                                  }
                                  disabled={!isAdmin}
                                  style={{ maxWidth: "140px" }}
                                />
                              </td>
                            ))}
                            {isAdmin && (
                              <td>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeBracketRow(bracketKey, rowIdx)}
                                  title="Remove row"
                                >
                                  x
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {isAdmin && (
                      <button
                        className="btn btn-outline-primary btn-sm mt-1 mb-2"
                        onClick={() => addBracketRow(bracketKey)}
                      >
                        + Add Row
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && hasChanges && (
          <div className="p-3 d-flex justify-content-end" style={{ gap: "8px" }}>
            <button className="btn btn-outline-secondary rounded-pill" onClick={handleDiscard}>
              Discard Changes
            </button>
            <button className="btn btn-success rounded-pill" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SuperAdminTaxConstants;

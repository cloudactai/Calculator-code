import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import dataAxios from "../../utils/dataAxios";

/**
 * Lists saved calculation reports for a matter and opens the full calculator
 * result screen (Screen4 with visual scenarios) when the user clicks "View".
 *
 * Props:
 *   matterId – matter number string (e.g. "CA-2026-00001")
 *   onBack   – () => void
 */
export default function CalculationResultsPanel({ matterId, onBack }) {
  const history = useHistory();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!matterId) return;
    let active = true;
    setLoading(true);
    dataAxios
      .get(`matters/${matterId}/reports`)
      .then((res) => {
        const body = res.data?.data?.body ?? res.data?.data ?? [];
        if (active) setReports(Array.isArray(body) ? body : []);
      })
      .catch(() => {
        if (active) setError("Could not load calculation reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [matterId]);

  const handleView = (report) => {
    localStorage.setItem(
      "viewCalculationData",
      JSON.stringify({
        inputData: report.inputData,
        resultData: report.resultData,
        calculationType: report.calculationType,
      })
    );
    localStorage.setItem(
      "selectedCalculatorMatterNumber",
      JSON.stringify(matterId)
    );
    history.push("/calculator");
  };

  const formatType = (type) => {
    if (type === "child_support") return "Child Support";
    if (type === "spousal_support") return "Spousal Support";
    return type || "";
  };

  if (loading) return <div style={{ padding: "24px" }}>Loading calculation results...</div>;
  if (error) return <div style={{ padding: "24px", color: "#d32f2f" }}>{error}</div>;
  if (!reports.length) return <div style={{ padding: "24px" }}>No calculation reports saved yet.</div>;

  return (
    <div className="mw-calc-results-list">
      <table className="table reports-table reports-table-primary">
        <thead>
          <tr>
            <th>Report</th>
            <th>Type</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.label || "Untitled"}</td>
              <td>{formatType(report.calculationType)}</td>
              <td>{new Date(report.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btnPrimary rounded-pill"
                  onClick={() => handleView(report)}
                >
                  View Results
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

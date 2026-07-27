import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import dataAxios, { DATA_API_BASE } from "../../../utils/dataAxios";
import { getAuthToken } from "../../../utils/authToken";

/**
 * Lists saved calculation reports for a matter (from MatterCalculationReport).
 * Shown inside the "Calculations" folder in FolderStructure.
 *
 * Props:
 *   matterId  – the matter number string (e.g. "CA-2026-00002")
 */
export default function CalculationPDf({ matterId }) {
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

  const handleDownloadPdf = async (report) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${DATA_API_BASE}/reports/${report.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("PDF not available");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.pdfFilename || `${report.label || "calculation_report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download PDF. The report may not have a PDF attached.");
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Delete "${report.label || "this report"}"?`)) return;
    try {
      await dataAxios.delete(`reports/${report.id}`);
      setReports((current) => current.filter((r) => r.id !== report.id));
    } catch {
      alert("Could not delete report.");
    }
  };

  const handleView = (report) => {
    // Store the report data so Calculator.tsx can restore it on mount
    localStorage.setItem(
      "viewCalculationData",
      JSON.stringify({
        inputData: report.inputData,
        resultData: report.resultData,
        calculationType: report.calculationType,
      })
    );
    // Keep the matter context
    localStorage.setItem(
      "selectedCalculatorMatterNumber",
      JSON.stringify(matterId)
    );
    history.push("/SupportCalculator");
  };

  const formatType = (type) => {
    if (type === "child_support") return "Child Support";
    if (type === "spousal_support") return "Spousal Support";
    return type || "—";
  };

  if (loading) return <div className="description">Loading reports…</div>;
  if (error) return <div className="description text-danger">{error}</div>;
  if (!reports.length)
    return <div className="description">No calculation reports saved yet.</div>;

  return (
    <div className="documents-table mt-3">
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
              <td className="d-flex gap-2">
                {report.pdfFilename && (
                  <button
                    className="btn btnPrimary rounded-pill"
                    onClick={() => handleDownloadPdf(report)}
                  >
                    Download PDF
                  </button>
                )}
                <button
                  className="btn btnSecondary rounded-pill"
                  onClick={() => handleDelete(report)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

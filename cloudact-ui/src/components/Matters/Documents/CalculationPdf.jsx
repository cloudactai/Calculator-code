import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import dataAxios from "../../../utils/dataAxios";
import html2pdf from "html2pdf.js";
import CalculationReport from "../../../pages/freeCalculatorApi/reports/CalculationReport.tsx";

/**
 * Lists saved calculation reports for a matter (from MatterCalculationReport).
 * Downloads regenerate the PDF on-the-fly using the same CalculationReport
 * component and html2pdf.js settings as the manual calculator, so the output
 * is always identical.
 *
 * Props:
 *   matterId  – the matter number string (e.g. "CA-2026-00002")
 */
export default function CalculationPDf({ matterId }) {
  const history = useHistory();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingId, setGeneratingId] = useState(null);

  // Holds the report data to render in the hidden CalculationReport
  const [renderReport, setRenderReport] = useState(null);
  const reportRef = useRef(null);

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

  // Once the hidden CalculationReport renders, generate PDF from it
  useEffect(() => {
    if (!renderReport || !reportRef.current) return;

    const generatePdf = async () => {
      try {
        await html2pdf()
          .set({
            margin: [10, 5, 10, 5],
            filename: renderReport.filename,
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, width: 1100, windowWidth: 1100 },
            jsPDF: { unit: "mm", format: "letter", orientation: "landscape" },
            pagebreak: { mode: ["css", "legacy"] },
          })
          .from(reportRef.current)
          .save();
      } catch (err) {
        console.error("[CalculationPdf] PDF generation failed:", err);
        alert("Could not generate PDF.");
      } finally {
        setRenderReport(null);
        setGeneratingId(null);
      }
    };

    // Small delay to ensure React has finished rendering the report DOM
    const timer = setTimeout(generatePdf, 300);
    return () => clearTimeout(timer);
  }, [renderReport]);

  const handleDownloadPdf = (report) => {
    const fullState = report.inputData?._fullState;
    if (!fullState) {
      alert("This report was saved without the data needed to regenerate a PDF. Please re-run the calculation and save again.");
      return;
    }

    setGeneratingId(report.id);

    // Build supportQuantum from saved data
    let sq = fullState.supportQuantum;
    if (!sq) {
      // Fallback: reconstruct from resultData if supportQuantum wasn't saved
      const rd = report.resultData || {};
      sq = {
        support1: {
          spousalSupport: rd.spousalSupportLow || 0,
          childSupport: (rd.childSupportGreater || 0) / 12,
          childSpecialExpense: 0,
          spousalSupportGivenTo: rd.spousalSupport?.givenTo || "",
          childSupportGivenTo: rd.supportGivenTo || "",
          childSupportSpecialExpenses: 0,
          totalSupport: 0,
        },
        support2: {
          spousalSupport: rd.spousalSupportMid || 0,
          childSupport: (rd.childSupportGreater || 0) / 12,
          childSpecialExpense: 0,
          spousalSupportGivenTo: rd.spousalSupport?.givenTo || "",
          childSupportGivenTo: rd.supportGivenTo || "",
          childSupportSpecialExpenses: 0,
          totalSupport: 0,
        },
        support3: {
          spousalSupport: rd.spousalSupportHigh || 0,
          childSupport: (rd.childSupportGreater || 0) / 12,
          childSpecialExpense: 0,
          spousalSupportGivenTo: rd.spousalSupport?.givenTo || "",
          childSupportGivenTo: rd.supportGivenTo || "",
          childSupportSpecialExpenses: 0,
          totalSupport: 0,
        },
        spousalSupportDurationRange: "",
        loading: false,
        supportGivenTo: rd.supportGivenTo || "",
      };
    }

    // Fix names saved with the old bug where fullLegalName was stored as firstName
    const bg = { ...fullState.background };
    if (bg.party1FirstName && bg.party1LastName && bg.party1FirstName.endsWith(bg.party1LastName)) {
      bg.party1FirstName = bg.party1FirstName.slice(0, -(bg.party1LastName.length)).trim() || bg.party1FirstName;
    }
    if (bg.party2FirstName && bg.party2LastName && bg.party2FirstName.endsWith(bg.party2LastName)) {
      bg.party2FirstName = bg.party2FirstName.slice(0, -(bg.party2LastName.length)).trim() || bg.party2FirstName;
    }

    setRenderReport({
      background: bg,
      aboutTheChildren: fullState.aboutTheChildren,
      aboutTheRelationship: fullState.aboutTheRelationship,
      screen2: fullState.screen2,
      typeOfCalculatorSelected: fullState.calculator_type,
      supportQuantum: sq,
      filename: report.pdfFilename || `${report.label || "calculation_report"}.pdf`,
    });
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
                <button
                  className="btn btnPrimary rounded-pill"
                  disabled={generatingId === report.id}
                  onClick={() => handleDownloadPdf(report)}
                >
                  {generatingId === report.id ? "Generating…" : "Download PDF"}
                </button>
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

      {/* Hidden CalculationReport for on-the-fly PDF generation */}
      {renderReport && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: "1100px",
            pointerEvents: "none",
            overflow: "visible",
            background: "#fff",
          }}
        >
          <CalculationReport
            ref={reportRef}
            background={renderReport.background}
            aboutTheChildren={renderReport.aboutTheChildren}
            aboutTheRelationship={renderReport.aboutTheRelationship}
            screen2={renderReport.screen2}
            typeOfCalculatorSelected={renderReport.typeOfCalculatorSelected}
            supportQuantum={renderReport.supportQuantum}
          />
        </div>
      )}
    </div>
  );
}

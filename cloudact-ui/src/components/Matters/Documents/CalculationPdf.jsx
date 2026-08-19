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

  /**
   * Build a _fullState-like object from the AI chat backend's _calcResult,
   * so CalculationReport can render the same styled PDF as the manual calculator.
   */
  const buildFullStateFromCalcResult = (cr, calculationType) => {
    const n = (v) => (typeof v === "number" ? v : Number(v) || 0);
    const isSpousal = calculationType === "spousal_support";
    const p1Income = n(cr.party1_income) || n(cr.party1_gross_income);
    const p2Income = n(cr.party2_income) || n(cr.party2_gross_income);
    const party1IsPayor = p1Income >= p2Income;
    const csMonthly = n(cr.monthly_cs_paid) || n(cr.child_support_paid) || 0;

    // Determine who receives child support
    const csGivenTo = party1IsPayor ? cr.party2_name : cr.party1_name;

    // Build children info from the saved children array
    const childrenArr = cr.children || [];
    const childrenInfo = childrenArr.map((c) => ({
      name: c.name || "",
      dateOfBirth: c.dob || c.date_of_birth || "",
      custodyArrangement: c.custody_arrangement || "",
      CSGTable: "Yes",
    }));
    const party1Kids = childrenArr.filter((c) => c.custody_arrangement === "Party 1").length;
    const party2Kids = childrenArr.filter((c) => c.custody_arrangement === "Party 2").length;

    return {
      background: {
        party1FirstName: cr.party1_name || "Party 1",
        party1LastName: "",
        party2FirstName: cr.party2_name || "Party 2",
        party2LastName: "",
        party1province: cr.party1_province || "ON",
        party2province: cr.party2_province || "ON",
        // Approximate DOBs from ages (used for age display only)
        party1DateOfBirth: cr.party1_age ? approximateDOB(n(cr.party1_age)) : "",
        party2DateOfBirth: cr.party2_age ? approximateDOB(n(cr.party2_age)) : "",
      },
      aboutTheChildren: {
        childrenInfo: childrenInfo,
        count: { party1: party1Kids, party2: party2Kids },
      },
      aboutTheRelationship: {
        dateOfMarriage: cr.date_of_marriage || "",
        dateOfSeparation: cr.date_of_separation || "",
      },
      screen2: {
        totalIncomeParty1: p1Income,
        totalIncomeParty2: p2Income,
        tax_year: cr.tax_year || new Date().getFullYear(),
        childSupport: {
          childSupport1: party1IsPayor ? csMonthly : 0,
          childSupport2: !party1IsPayor ? csMonthly : 0,
          givenTo: csGivenTo,
        },
        taxesFromApi: {
          party1Low: n(cr.party1_taxes_low),
          party1Mid: n(cr.party1_taxes_mid),
          party1High: n(cr.party1_taxes_high),
          party2Low: n(cr.party2_taxes_low),
          party2Mid: n(cr.party2_taxes_mid),
          party2High: n(cr.party2_taxes_high),
        },
        benefitsFromApi: {
          party1Low: n(cr.party1_benefits_low),
          party1Mid: n(cr.party1_benefits_mid),
          party1High: n(cr.party1_benefits_high),
          party2Low: n(cr.party2_benefits_low),
          party2Mid: n(cr.party2_benefits_mid),
          party2High: n(cr.party2_benefits_high),
        },
        disposableIncome: {
          party1Low: n(cr.party1_indi_low),
          party1Mid: n(cr.party1_indi_mid),
          party1High: n(cr.party1_indi_high),
          party2Low: n(cr.party2_indi_low),
          party2Mid: n(cr.party2_indi_mid),
          party2High: n(cr.party2_indi_high),
        },
        specialExpenses: { specialExpensesLow1: 0, specialExpensesLow2: 0 },
      },
      supportQuantum: isSpousal ? {
        support1: {
          spousalSupport: n(cr.spousal_low_monthly) || n(cr.monthly_low),
          childSupport: csMonthly,
          childSpecialExpense: 0,
          spousalSupportGivenTo: cr.recipient || csGivenTo,
          childSupportGivenTo: csGivenTo,
          childSupportSpecialExpenses: 0,
          totalSupport: 0,
        },
        support2: {
          spousalSupport: n(cr.spousal_mid_monthly) || n(cr.monthly_mid),
          childSupport: csMonthly,
          childSpecialExpense: 0,
          spousalSupportGivenTo: cr.recipient || csGivenTo,
          childSupportGivenTo: csGivenTo,
          childSupportSpecialExpenses: 0,
          totalSupport: 0,
        },
        support3: {
          spousalSupport: n(cr.spousal_high_monthly) || n(cr.monthly_high),
          childSupport: csMonthly,
          childSpecialExpense: 0,
          spousalSupportGivenTo: cr.recipient || csGivenTo,
          childSupportGivenTo: csGivenTo,
          childSupportSpecialExpenses: 0,
          totalSupport: 0,
        },
        spousalSupportDurationRange: cr.duration_label || "",
        loading: false,
        supportGivenTo: csGivenTo,
      } : {
        // Child support only — no spousal amounts
        support1: { spousalSupport: 0, childSupport: csMonthly, childSpecialExpense: 0, childSupportGivenTo: csGivenTo, childSupportSpecialExpenses: 0, totalSupport: 0 },
        support2: { spousalSupport: 0, childSupport: csMonthly, childSpecialExpense: 0, childSupportGivenTo: csGivenTo, childSupportSpecialExpenses: 0, totalSupport: 0 },
        support3: { spousalSupport: 0, childSupport: csMonthly, childSpecialExpense: 0, childSupportGivenTo: csGivenTo, childSupportSpecialExpenses: 0, totalSupport: 0 },
        spousalSupportDurationRange: "",
        loading: false,
        supportGivenTo: csGivenTo,
      },
      calculator_type: isSpousal ? "SPOUSAL" : "CHILD",
    };
  };

  /** Approximate a date-of-birth string from an age (years ago from today). */
  const approximateDOB = (age) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - age);
    return d.toISOString().split("T")[0];
  };

  const handleDownloadPdf = (report) => {
    // Try _fullState first (manual calculator), then build from _calcResult (AI chat)
    let fullState = report.inputData?._fullState;
    if (!fullState && report.inputData?._calcResult) {
      fullState = buildFullStateFromCalcResult(report.inputData._calcResult, report.calculationType);
    }
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
      const stripped = bg.party1FirstName.slice(0, -(bg.party1LastName.length)).trim();
      if (stripped) {
        bg.party1FirstName = stripped;
      } else {
        bg.party1LastName = "";
      }
    }
    if (bg.party2FirstName && bg.party2LastName && bg.party2FirstName.endsWith(bg.party2LastName)) {
      const stripped = bg.party2FirstName.slice(0, -(bg.party2LastName.length)).trim();
      if (stripped) {
        bg.party2FirstName = stripped;
      } else {
        bg.party2LastName = "";
      }
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

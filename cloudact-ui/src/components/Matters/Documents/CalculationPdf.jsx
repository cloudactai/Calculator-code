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
        console.log("[CalculationPdf] === REPORTS LOADED DEBUG ===");
        console.log("[CalculationPdf] Raw response:", JSON.stringify(res.data).substring(0, 500));
        const body = res.data?.data?.body ?? res.data?.data ?? [];
        const reports = Array.isArray(body) ? body : [];
        console.log("[CalculationPdf] Number of reports:", reports.length);
        reports.forEach((r, i) => {
          console.log(`[CalculationPdf] Report ${i}: id=${r.id}, type=${r.calculationType}, label=${r.label}`);
          console.log(`[CalculationPdf]   inputData keys:`, r.inputData ? Object.keys(r.inputData) : "NO inputData");
          console.log(`[CalculationPdf]   has _fullState:`, !!r.inputData?._fullState);
          console.log(`[CalculationPdf]   has _calcResult:`, !!r.inputData?._calcResult);
          if (r.inputData?._calcResult) {
            console.log(`[CalculationPdf]   _calcResult keys:`, Object.keys(r.inputData._calcResult));
          }
          console.log(`[CalculationPdf]   resultData keys:`, r.resultData ? Object.keys(r.resultData) : "NO resultData");
          console.log(`[CalculationPdf]   pdfBase64:`, r.pdfBase64 ? `PRESENT (${r.pdfBase64.length} chars)` : "MISSING");
          console.log(`[CalculationPdf]   pdfFilename:`, r.pdfFilename || "MISSING");
        });
        console.log("[CalculationPdf] === END REPORTS LOADED DEBUG ===");
        if (active) setReports(reports);
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
      console.log("[CalculationPdf] === PDF GENERATION DEBUG ===");
      console.log("[CalculationPdf] reportRef.current:", reportRef.current ? "PRESENT" : "NULL");
      console.log("[CalculationPdf] reportRef innerHTML length:", reportRef.current?.innerHTML?.length || 0);
      console.log("[CalculationPdf] reportRef innerHTML (first 500 chars):", reportRef.current?.innerHTML?.substring(0, 500));
      console.log("[CalculationPdf] renderReport.filename:", renderReport.filename);
      console.log("[CalculationPdf] renderReport.typeOfCalculatorSelected:", renderReport.typeOfCalculatorSelected);
      console.log("[CalculationPdf] renderReport.background:", JSON.stringify(renderReport.background));
      try {
        console.log("[CalculationPdf] Starting html2pdf generation...");
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
        console.log("[CalculationPdf] html2pdf generation SUCCEEDED");
      } catch (err) {
        console.error("[CalculationPdf] PDF generation FAILED:", err);
        console.error("[CalculationPdf] Error stack:", err.stack);
        alert("Could not generate PDF.");
      } finally {
        console.log("[CalculationPdf] === END PDF GENERATION DEBUG ===");
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
    console.log("[CalculationPdf] === DOWNLOAD PDF DEBUG ===");
    console.log("[CalculationPdf] Report id:", report.id);
    console.log("[CalculationPdf] Report calculationType:", report.calculationType);
    console.log("[CalculationPdf] Report label:", report.label);
    console.log("[CalculationPdf] inputData:", report.inputData ? "PRESENT" : "MISSING");
    console.log("[CalculationPdf] inputData keys:", report.inputData ? Object.keys(report.inputData) : "N/A");
    console.log("[CalculationPdf] has _fullState:", !!report.inputData?._fullState);
    console.log("[CalculationPdf] has _calcResult:", !!report.inputData?._calcResult);
    if (report.inputData?._calcResult) {
      console.log("[CalculationPdf] _calcResult keys:", Object.keys(report.inputData._calcResult));
      console.log("[CalculationPdf] _calcResult.party1_name:", report.inputData._calcResult.party1_name);
      console.log("[CalculationPdf] _calcResult.party1_income:", report.inputData._calcResult.party1_income);
      console.log("[CalculationPdf] _calcResult.party1_gross_income:", report.inputData._calcResult.party1_gross_income);
    }
    console.log("[CalculationPdf] resultData:", report.resultData ? "PRESENT" : "MISSING");
    console.log("[CalculationPdf] pdfBase64:", report.pdfBase64 ? `PRESENT (${report.pdfBase64.length} chars)` : "MISSING");

    // Try _fullState first (manual calculator), then build from _calcResult (AI chat)
    let fullState = report.inputData?._fullState;
    if (fullState) {
      console.log("[CalculationPdf] Using _fullState (manual calculator path)");
      console.log("[CalculationPdf] _fullState keys:", Object.keys(fullState));
    }
    if (!fullState && report.inputData?._calcResult) {
      console.log("[CalculationPdf] No _fullState, building from _calcResult (AI chat path)");
      fullState = buildFullStateFromCalcResult(report.inputData._calcResult, report.calculationType);
      console.log("[CalculationPdf] Built fullState keys:", Object.keys(fullState));
      console.log("[CalculationPdf] Built fullState.background:", JSON.stringify(fullState.background));
      console.log("[CalculationPdf] Built fullState.screen2.totalIncomeParty1:", fullState.screen2?.totalIncomeParty1);
      console.log("[CalculationPdf] Built fullState.screen2.totalIncomeParty2:", fullState.screen2?.totalIncomeParty2);
      console.log("[CalculationPdf] Built fullState.supportQuantum:", JSON.stringify(fullState.supportQuantum).substring(0, 500));
      console.log("[CalculationPdf] Built fullState.calculator_type:", fullState.calculator_type);
    }
    if (!fullState) {
      console.error("[CalculationPdf] FAILED: No _fullState and no _calcResult — cannot generate PDF");
      console.error("[CalculationPdf] Full inputData dump:", JSON.stringify(report.inputData).substring(0, 1000));
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

    const renderData = {
      background: bg,
      aboutTheChildren: fullState.aboutTheChildren,
      aboutTheRelationship: fullState.aboutTheRelationship,
      screen2: fullState.screen2,
      typeOfCalculatorSelected: fullState.calculator_type,
      supportQuantum: sq,
      filename: report.pdfFilename || `${report.label || "calculation_report"}.pdf`,
    };
    console.log("[CalculationPdf] === RENDER REPORT DATA ===");
    console.log("[CalculationPdf] background:", JSON.stringify(renderData.background));
    console.log("[CalculationPdf] aboutTheChildren:", JSON.stringify(renderData.aboutTheChildren));
    console.log("[CalculationPdf] aboutTheRelationship:", JSON.stringify(renderData.aboutTheRelationship));
    console.log("[CalculationPdf] screen2 keys:", renderData.screen2 ? Object.keys(renderData.screen2) : "MISSING");
    console.log("[CalculationPdf] screen2.totalIncomeParty1:", renderData.screen2?.totalIncomeParty1);
    console.log("[CalculationPdf] screen2.totalIncomeParty2:", renderData.screen2?.totalIncomeParty2);
    console.log("[CalculationPdf] typeOfCalculatorSelected:", renderData.typeOfCalculatorSelected);
    console.log("[CalculationPdf] supportQuantum:", JSON.stringify(renderData.supportQuantum).substring(0, 500));
    console.log("[CalculationPdf] filename:", renderData.filename);
    console.log("[CalculationPdf] === END RENDER REPORT DATA ===");
    setRenderReport(renderData);
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

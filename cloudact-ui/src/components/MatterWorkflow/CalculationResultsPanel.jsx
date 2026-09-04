import React, { useEffect, useState } from "react";
import dataAxios from "../../utils/dataAxios";
import CalculationReport from "../../pages/freeCalculatorApi/reports/CalculationReport.tsx";

/**
 * Renders the final calculation result screen for a matter.
 * Fetches saved reports and displays the CalculationReport component inline,
 * with a selector when multiple reports exist.
 *
 * Props:
 *   matterId – matter number string (e.g. "CA-2026-00001")
 *   onBack   – () => void
 */

export default function CalculationResultsPanel({ matterId, onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (!matterId) return;
    let active = true;
    setLoading(true);
    dataAxios
      .get(`matters/${matterId}/reports`)
      .then((res) => {
        const body = res.data?.data?.body ?? res.data?.data ?? [];
        const list = Array.isArray(body) ? body : [];
        if (active) {
          setReports(list);
          setSelectedIdx(0);
        }
      })
      .catch(() => {
        if (active) setError("Could not load calculation reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [matterId]);

  const n = (v) => (typeof v === "number" ? v : Number(v) || 0);

  const approximateDOB = (age) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - age);
    return d.toISOString().split("T")[0];
  };

  const buildFullStateFromCalcResult = (cr, calculationType) => {
    const isSpousal = calculationType === "spousal_support";
    const p1Income = n(cr.party1_income) || n(cr.party1_gross_income);
    const p2Income = n(cr.party2_income) || n(cr.party2_gross_income);
    const party1IsPayor = p1Income >= p2Income;
    const csMonthly = n(cr.monthly_cs_paid) || n(cr.child_support_paid) || 0;
    const csGivenTo = party1IsPayor ? cr.party2_name : cr.party1_name;

    const childrenArr = cr.children || [];
    const childrenInfo = childrenArr.map((c) => ({
      name: c.name || "",
      dateOfBirth: c.dob || c.date_of_birth || "",
      custodyArrangement: c.custody_arrangement || "",
      CSGTable: "Yes",
    }));
    const party1Kids = childrenArr.filter((c) => c.custody_arrangement === "Party 1").length;
    const party2Kids = childrenArr.filter((c) => c.custody_arrangement === "Party 2").length;

    const mapTaxProfiles = () => {
      const get = (key) => cr[key] || null;
      if (party1IsPayor) {
        return {
          party1Low: get("payor_tax_profile_low"), party1Mid: get("payor_tax_profile_mid"), party1High: get("payor_tax_profile_high"),
          party2Low: get("recipient_tax_profile_low"), party2Mid: get("recipient_tax_profile_mid"), party2High: get("recipient_tax_profile_high"),
        };
      }
      return {
        party1Low: get("recipient_tax_profile_low"), party1Mid: get("recipient_tax_profile_mid"), party1High: get("recipient_tax_profile_high"),
        party2Low: get("payor_tax_profile_low"), party2Mid: get("payor_tax_profile_mid"), party2High: get("payor_tax_profile_high"),
      };
    };
    const tp = mapTaxProfiles();
    const hasTaxProfile = !!(tp.party1Low || tp.party1Mid || tp.party1High);
    const taxVal = (profile, key) => (profile && typeof profile === "object" ? n(profile[key]) : 0);

    return {
      background: {
        party1FirstName: cr.party1_name || "Party 1", party1LastName: "",
        party2FirstName: cr.party2_name || "Party 2", party2LastName: "",
        party1province: cr.party1_province || "ON", party2province: cr.party2_province || "ON",
        party1DateOfBirth: cr.party1_age ? approximateDOB(n(cr.party1_age)) : "",
        party2DateOfBirth: cr.party2_age ? approximateDOB(n(cr.party2_age)) : "",
      },
      aboutTheChildren: {
        childrenInfo,
        count: { party1: party1Kids, party2: party2Kids },
      },
      aboutTheRelationship: {
        dateOfMarriage: cr.date_of_marriage || "",
        dateOfSeparation: cr.date_of_separation || "",
      },
      screen2: {
        totalIncomeParty1: p1Income, totalIncomeParty2: p2Income,
        tax_year: cr.tax_year || new Date().getFullYear(),
        childSupport: {
          childSupport1: party1IsPayor ? csMonthly : 0,
          childSupport2: !party1IsPayor ? csMonthly : 0,
          givenTo: csGivenTo,
        },
        taxesFromApi: {
          party1Low: hasTaxProfile ? taxVal(tp.party1Low, "total_taxes") : n(cr.party1_taxes_low),
          party1Mid: hasTaxProfile ? taxVal(tp.party1Mid, "total_taxes") : n(cr.party1_taxes_mid),
          party1High: hasTaxProfile ? taxVal(tp.party1High, "total_taxes") : n(cr.party1_taxes_high),
          party2Low: hasTaxProfile ? taxVal(tp.party2Low, "total_taxes") : n(cr.party2_taxes_low),
          party2Mid: hasTaxProfile ? taxVal(tp.party2Mid, "total_taxes") : n(cr.party2_taxes_mid),
          party2High: hasTaxProfile ? taxVal(tp.party2High, "total_taxes") : n(cr.party2_taxes_high),
        },
        benefitsFromApi: {
          party1Low: hasTaxProfile ? taxVal(tp.party1Low, "total_benefits") : n(cr.party1_benefits_low),
          party1Mid: hasTaxProfile ? taxVal(tp.party1Mid, "total_benefits") : n(cr.party1_benefits_mid),
          party1High: hasTaxProfile ? taxVal(tp.party1High, "total_benefits") : n(cr.party1_benefits_high),
          party2Low: hasTaxProfile ? taxVal(tp.party2Low, "total_benefits") : n(cr.party2_benefits_low),
          party2Mid: hasTaxProfile ? taxVal(tp.party2Mid, "total_benefits") : n(cr.party2_benefits_mid),
          party2High: hasTaxProfile ? taxVal(tp.party2High, "total_benefits") : n(cr.party2_benefits_high),
        },
        disposableIncome: {
          party1Low: n(cr.party1_indi_low), party1Mid: n(cr.party1_indi_mid), party1High: n(cr.party1_indi_high),
          party2Low: n(cr.party2_indi_low), party2Mid: n(cr.party2_indi_mid), party2High: n(cr.party2_indi_high),
        },
        specialExpenses: { specialExpensesLow1: 0, specialExpensesLow2: 0 },
        ...(hasTaxProfile ? { taxProfileFromApi: tp } : {}),
      },
      supportQuantum: isSpousal ? {
        support1: { spousalSupport: n(cr.spousal_low_monthly) || n(cr.monthly_low), childSupport: csMonthly, childSpecialExpense: 0, spousalSupportGivenTo: cr.recipient || csGivenTo, childSupportGivenTo: csGivenTo, childSupportSpecialExpenses: 0, totalSupport: 0 },
        support2: { spousalSupport: n(cr.spousal_mid_monthly) || n(cr.monthly_mid), childSupport: csMonthly, childSpecialExpense: 0, spousalSupportGivenTo: cr.recipient || csGivenTo, childSupportGivenTo: csGivenTo, childSupportSpecialExpenses: 0, totalSupport: 0 },
        support3: { spousalSupport: n(cr.spousal_high_monthly) || n(cr.monthly_high), childSupport: csMonthly, childSpecialExpense: 0, spousalSupportGivenTo: cr.recipient || csGivenTo, childSupportGivenTo: csGivenTo, childSupportSpecialExpenses: 0, totalSupport: 0 },
        spousalSupportDurationRange: cr.duration_label || "",
        loading: false,
        supportGivenTo: csGivenTo,
      } : {
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

  const getFullState = (report) => {
    let fullState = report.inputData?._fullState;
    if (!fullState && report.inputData?._calcResult) {
      fullState = buildFullStateFromCalcResult(report.inputData._calcResult, report.calculationType);
    }
    if (!fullState) return null;

    // Fix names saved with the old bug where fullLegalName was stored as firstName
    const bg = { ...fullState.background };
    if (bg.party1FirstName && bg.party1LastName && bg.party1FirstName.endsWith(bg.party1LastName)) {
      const stripped = bg.party1FirstName.slice(0, -(bg.party1LastName.length)).trim();
      if (stripped) bg.party1FirstName = stripped;
      else bg.party1LastName = "";
    }
    if (bg.party2FirstName && bg.party2LastName && bg.party2FirstName.endsWith(bg.party2LastName)) {
      const stripped = bg.party2FirstName.slice(0, -(bg.party2LastName.length)).trim();
      if (stripped) bg.party2FirstName = stripped;
      else bg.party2LastName = "";
    }

    let sq = fullState.supportQuantum;
    if (!sq) {
      const rd = report.resultData || {};
      sq = {
        support1: { spousalSupport: rd.spousalSupportLow || 0, childSupport: (rd.childSupportGreater || 0) / 12, childSpecialExpense: 0, spousalSupportGivenTo: rd.spousalSupport?.givenTo || "", childSupportGivenTo: rd.supportGivenTo || "", childSupportSpecialExpenses: 0, totalSupport: 0 },
        support2: { spousalSupport: rd.spousalSupportMid || 0, childSupport: (rd.childSupportGreater || 0) / 12, childSpecialExpense: 0, spousalSupportGivenTo: rd.spousalSupport?.givenTo || "", childSupportGivenTo: rd.supportGivenTo || "", childSupportSpecialExpenses: 0, totalSupport: 0 },
        support3: { spousalSupport: rd.spousalSupportHigh || 0, childSupport: (rd.childSupportGreater || 0) / 12, childSpecialExpense: 0, spousalSupportGivenTo: rd.spousalSupport?.givenTo || "", childSupportGivenTo: rd.supportGivenTo || "", childSupportSpecialExpenses: 0, totalSupport: 0 },
        spousalSupportDurationRange: "",
        loading: false,
        supportGivenTo: rd.supportGivenTo || "",
      };
    }

    return { background: bg, aboutTheChildren: fullState.aboutTheChildren, aboutTheRelationship: fullState.aboutTheRelationship, screen2: fullState.screen2, supportQuantum: sq, calculator_type: fullState.calculator_type };
  };

  const formatType = (type) => {
    if (type === "child_support") return "Child Support";
    if (type === "spousal_support") return "Spousal Support";
    return type || "";
  };

  if (loading) return <div style={{ padding: "24px" }}>Loading calculation results...</div>;
  if (error) return <div style={{ padding: "24px", color: "#d32f2f" }}>{error}</div>;
  if (!reports.length) return <div style={{ padding: "24px" }}>No calculation reports saved yet.</div>;

  const selectedReport = reports[selectedIdx];
  const fullState = selectedReport ? getFullState(selectedReport) : null;

  return (
    <div>
      {/* Report selector when multiple reports exist */}
      {reports.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          {reports.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedIdx(i)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: i === selectedIdx ? "2px solid #1976d2" : "1px solid rgba(0,0,0,0.15)",
                background: i === selectedIdx ? "rgba(25, 118, 210, 0.08)" : "transparent",
                color: i === selectedIdx ? "#1976d2" : "inherit",
                fontWeight: i === selectedIdx ? 600 : 400,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {r.label || "Untitled"} — {formatType(r.calculationType)}
            </button>
          ))}
        </div>
      )}

      {/* Report title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", color: "#666" }}>
          {formatType(selectedReport.calculationType)} — {new Date(selectedReport.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Inline calculation result screen */}
      {fullState ? (
        <div style={{ background: "#fff", borderRadius: "8px", overflow: "auto" }}>
          <CalculationReport
            background={fullState.background}
            aboutTheChildren={fullState.aboutTheChildren}
            aboutTheRelationship={fullState.aboutTheRelationship}
            screen2={fullState.screen2}
            typeOfCalculatorSelected={fullState.calculator_type}
            supportQuantum={fullState.supportQuantum}
          />
        </div>
      ) : (
        <div style={{ padding: "24px", color: "#d32f2f" }}>
          This report was saved without the data needed to display results. Please re-run the calculation.
        </div>
      )}
    </div>
  );
}

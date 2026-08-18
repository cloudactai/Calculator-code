import React, { forwardRef } from "react";
import { momentFunction } from "../../../utils/moment";
import { getProvinceForm } from "../../../utils/helpers/province";

interface CalculationReportProps {
  background: any;
  aboutTheChildren: any;
  aboutTheRelationship: any;
  screen2: any;
  typeOfCalculatorSelected: string;
  supportQuantum: any;
}

const CalculationReport = forwardRef<HTMLDivElement, CalculationReportProps>(
  ({ background, aboutTheChildren, aboutTheRelationship, screen2, typeOfCalculatorSelected, supportQuantum }, ref) => {

    // --- Data-driven conditionals ---
    const hasChildren = aboutTheChildren?.childrenInfo?.length > 0;
    const hasChildSupportData = (screen2?.childSupport?.childSupport1 > 0 || screen2?.childSupport?.childSupport2 > 0);
    const hasSpousalSupportData = (
      supportQuantum?.support1?.spousalSupport !== 0 ||
      supportQuantum?.support2?.spousalSupport !== 0 ||
      supportQuantum?.support3?.spousalSupport !== 0
    );
    const hasRelationshipDates = aboutTheRelationship?.dateOfMarriage || aboutTheRelationship?.dateOfSeparation;

    const typeStr = (typeOfCalculatorSelected || "").toUpperCase();
    const showChildSupport = hasChildren || hasChildSupportData || typeStr.includes("CHILD");
    const showSpousalSupport = hasSpousalSupportData || hasRelationshipDates || typeStr.includes("SPOUSAL");

    // --- Helpers ---
    const displayName = (first?: string, last?: string): string => {
      const f = (first || "").trim();
      const l = (last || "").trim();
      if (!f && !l) return "";
      if (!l || f === l || f.endsWith(` ${l}`) || f.endsWith(l)) return f;
      return `${f} ${l}`;
    };

    const party1Name = displayName(background?.party1FirstName, background?.party1LastName);
    const party2Name = displayName(background?.party2FirstName, background?.party2LastName);

    const safeNumber = (val: any): number => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const yearsOfMarriage = (): number => {
      if (!aboutTheRelationship?.dateOfMarriage || !aboutTheRelationship?.dateOfSeparation) return 0;
      return Math.round(momentFunction.differenceBetweenTwoDates(
        aboutTheRelationship.dateOfMarriage, aboutTheRelationship.dateOfSeparation
      ));
    };

    const recipientAgeAtSeparation = (): number => {
      const recipientDOB = safeNumber(screen2?.totalIncomeParty1) > safeNumber(screen2?.totalIncomeParty2)
        ? background?.party2DateOfBirth : background?.party1DateOfBirth;
      if (!recipientDOB) return 0;
      return Math.round(momentFunction.differenceBetweenNowAndThen(recipientDOB));
    };

    const youngestChildAge = (): number => {
      if (!aboutTheChildren?.childrenInfo?.length) return 0;
      const ages = aboutTheChildren.childrenInfo.map((c: any) => momentFunction.differenceBetweenNowAndThen(c.dateOfBirth));
      return Math.min(...ages);
    };

    const yearsUntilYoungestFinishesSchool = (): number => {
      const age = youngestChildAge();
      return age > 18 ? 0 : 18 - Math.round(age);
    };

    // --- Pre-computed data from screen2 (no business logic computation) ---
    const totalIncomeParty1 = safeNumber(screen2?.totalIncomeParty1);
    const totalIncomeParty2 = safeNumber(screen2?.totalIncomeParty2);

    // Child support: use supportQuantum (the actual calculated amount shown in scenarios)
    const childSupportMonthly = safeNumber(supportQuantum?.support1?.childSupport);
    const childSupportAnnual = childSupportMonthly * 12;

    // Determine who RECEIVES child support (givenTo = recipient's first name)
    const csGivenTo = supportQuantum?.support1?.childSupportGivenTo || supportQuantum?.supportGivenTo || screen2?.childSupport?.givenTo || "";
    // Party 1 PAYS child support if Party 2 receives it (i.e. givenTo matches Party 2's name)
    const party1PaysCS = csGivenTo === background?.party2FirstName;

    // Determine who is spousal support payor (higher income pays spousal)
    const party1IsPayor = totalIncomeParty1 > totalIncomeParty2;

    const getTaxYear = (): number => {
      const ty = safeNumber(screen2?.tax_year);
      return ty > 0 ? ty : new Date().getFullYear();
    };

    // Pre-computed values from screen2 state
    const guidelineIncome1 = totalIncomeParty1;
    const guidelineIncome2 = totalIncomeParty2;
    // Taxes from API (positive = taxes owed; negate for display as reduction)
    const taxLow1 = -safeNumber(screen2?.taxesFromApi?.party1Low);
    const taxLow2 = -safeNumber(screen2?.taxesFromApi?.party2Low);
    const taxMid1 = -safeNumber(screen2?.taxesFromApi?.party1Mid);
    const taxMid2 = -safeNumber(screen2?.taxesFromApi?.party2Mid);
    const taxHigh1 = -safeNumber(screen2?.taxesFromApi?.party1High);
    const taxHigh2 = -safeNumber(screen2?.taxesFromApi?.party2High);
    // Benefits from API (positive = credits received)
    const benefitsLow1 = safeNumber(screen2?.benefitsFromApi?.party1Low);
    const benefitsLow2 = safeNumber(screen2?.benefitsFromApi?.party2Low);
    const benefitsMid1 = safeNumber(screen2?.benefitsFromApi?.party1Mid);
    const benefitsMid2 = safeNumber(screen2?.benefitsFromApi?.party2Mid);
    const benefitsHigh1 = safeNumber(screen2?.benefitsFromApi?.party1High);
    const benefitsHigh2 = safeNumber(screen2?.benefitsFromApi?.party2High);
    const specialExpenses1 = safeNumber(screen2?.specialExpenses?.specialExpensesLow1);
    const specialExpenses2 = safeNumber(screen2?.specialExpenses?.specialExpensesLow2);

    // Disposable income — pre-computed by backend (INDI from Flask API)
    const disposableLow1 = safeNumber(screen2?.disposableIncome?.party1Low);
    const disposableLow2 = safeNumber(screen2?.disposableIncome?.party2Low);
    const disposableMid1 = safeNumber(screen2?.disposableIncome?.party1Mid);
    const disposableMid2 = safeNumber(screen2?.disposableIncome?.party2Mid);
    const disposableHigh1 = safeNumber(screen2?.disposableIncome?.party1High);
    const disposableHigh2 = safeNumber(screen2?.disposableIncome?.party2High);

    // --- Formatting ---
    const fmt = (val: number): string => {
      if (val === 0) return "$0";
      const abs = Math.abs(val);
      const s = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(Math.round(abs));
      return val < 0 ? `-$${s}` : `$${s}`;
    };

    const fmt2 = (val: number): string => {
      const abs = Math.abs(val);
      const s = new Intl.NumberFormat("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
      return val < 0 ? `-$${s}` : `$${s}`;
    };

    const claimsDep1 = aboutTheChildren?.count?.party1 > 0 ? "Yes" : "No";
    const claimsDep2 = aboutTheChildren?.count?.party2 > 0 ? "Yes" : "No";

    return (
      <div ref={ref} className="calc-report">
        <style>{`
          .calc-report {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            color: #333;
            padding: 20px 30px 0 30px;
            background: #fff;
            width: 960px;
          }
          .calc-report .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a1a2e;
            margin-bottom: 16px;
            padding-bottom: 6px;
            border-bottom: 2px solid #2d5aa0;
          }
          .calc-report .section-header {
            font-weight: bold;
            font-size: 12px;
            background: #d9e2f3;
            color: #1a1a2e;
            padding: 5px 10px;
            margin: 12px 0 4px 0;
          }
          .calc-report .top-row {
            display: flex;
            gap: 20px;
          }
          .calc-report .top-left {
            flex: 1;
          }
          .calc-report .top-right {
            flex: 1;
          }
          .calc-report table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
          }
          .calc-report > *:last-child {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
          }
          .calc-report table:last-child {
            margin-bottom: 0;
          }
          .calc-report td, .calc-report th {
            padding: 4px 8px;
            font-size: 11px;
            border: 1px solid #d0d0d0;
          }
          .calc-report th {
            background: #eef2f7;
            font-weight: bold;
            text-align: center;
          }
          .calc-report .lbl { text-align: left; }
          .calc-report .val { text-align: right; }
          .calc-report .bold-row td { font-weight: bold; }
          .calc-report .result-header { background: #c5d9a4 !important; }
          .calc-report .result-val {
            font-size: 13px;
            font-weight: bold;
            color: #1a1a2e;
          }
          .calc-report .details-table td,
          .calc-report .details-table th {
            font-size: 10px;
            padding: 3px 6px;
          }
          .calc-report .scenario-hdr {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
          }
          .calc-report .sub-hdr td {
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            background: #f5f5f5;
          }
          .calc-report .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @media print {
            .calc-report {
              padding: 15px 20px;
              width: 100% !important;
            }
          }
        `}</style>

        <div className="report-title">CLOUDACT FAMILY LAW TOOLS</div>

        {/* TOP ROW: Calculation Input (left) + Important Dates (right) */}
        <div className="top-row">
          <div className="top-left">
            <div className="section-header">Calculation Input</div>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>{party1Name}</th>
                  <th>{party2Name}</th>
                </tr>
                <tr>
                  <td></td>
                  <td className="val" style={{ fontWeight: "bold" }}>{party1IsPayor ? "Payor" : "Recipient"}</td>
                  <td className="val" style={{ fontWeight: "bold" }}>{party1IsPayor ? "Recipient" : "Payor"}</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="lbl">Age</td>
                  <td className="val">{background?.party1DateOfBirth ? Math.round(momentFunction.differenceBetweenNowAndThen(background.party1DateOfBirth)) : ""}</td>
                  <td className="val">{background?.party2DateOfBirth ? Math.round(momentFunction.differenceBetweenNowAndThen(background.party2DateOfBirth)) : ""}</td>
                </tr>
                <tr>
                  <td className="lbl">Province</td>
                  <td className="val">{getProvinceForm(background?.party1province)}</td>
                  <td className="val">{getProvinceForm(background?.party2province)}</td>
                </tr>
                <tr>
                  <td className="lbl">Employment income</td>
                  <td className="val">{fmt(totalIncomeParty1)}</td>
                  <td className="val">{fmt(totalIncomeParty2)}</td>
                </tr>
                <tr>
                  <td className="lbl">Claims dependent credit</td>
                  <td className="val">{claimsDep1}</td>
                  <td className="val">{claimsDep2}</td>
                </tr>
              </tbody>
            </table>

            {/* Children */}
            {hasChildren && (
              <table style={{ marginTop: "8px" }}>
                <thead>
                  <tr>
                    <th style={{ fontWeight: "bold" }}>Children</th>
                    <th>Lives with</th>
                    <th>CSG Table</th>
                  </tr>
                </thead>
                <tbody>
                  {aboutTheChildren.childrenInfo.map((child: any, idx: number) => {
                    const age = child.dateOfBirth ? Math.round(momentFunction.differenceBetweenNowAndThen(child.dateOfBirth)) : 0;
                    return (
                      <tr key={idx}>
                        <td className="lbl">{child.name}{age > 0 ? ` / ${age} yrs` : ""}</td>
                        <td className="val">{child.custodyArrangement || ""}</td>
                        <td className="val">{child.CSGTable || "Yes"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="top-right">
            <div className="section-header">Important dates</div>
            <table>
              <tbody>
                {hasRelationshipDates && (
                  <>
                    <tr>
                      <td className="lbl">Date of Marriage/Cohabitation</td>
                      <td className="val">{aboutTheRelationship?.dateOfMarriage ? momentFunction.formatDate(aboutTheRelationship.dateOfMarriage) : ""}</td>
                    </tr>
                    <tr>
                      <td className="lbl">Date of separation</td>
                      <td className="val">{aboutTheRelationship?.dateOfSeparation ? momentFunction.formatDate(aboutTheRelationship.dateOfSeparation) : ""}</td>
                    </tr>
                    <tr>
                      <td className="lbl">Length of marriage</td>
                      <td className="val">{yearsOfMarriage()} years</td>
                    </tr>
                    <tr>
                      <td className="lbl">Recipient age at separation</td>
                      <td className="val">{recipientAgeAtSeparation()} years old</td>
                    </tr>
                  </>
                )}
                {hasChildren && (
                  <tr>
                    <td className="lbl">Years till youngest child finishes school</td>
                    <td className="val">{yearsUntilYoungestFinishesSchool()} years</td>
                  </tr>
                )}
                <tr>
                  <td className="lbl">Tax year</td>
                  <td className="val">{getTaxYear()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RESULT SECTION - same width as top-left */}
        <div className="page-break-avoid" style={{ width: "calc(50% - 10px)" }}>
        <div className="section-header result-header">Result</div>
        <table>
          <tbody>
            {showChildSupport && (
              <tr className="bold-row">
                <td className="lbl" style={{ fontWeight: "bold" }}>Child Support (monthly)</td>
                <td className="val result-val">{fmt(Math.round(childSupportMonthly))}</td>
              </tr>
            )}
            {showSpousalSupport && (
              <>
                <tr>
                  <td className="lbl" colSpan={2} style={{ fontWeight: "bold" }}>Spousal Support (monthly)</td>
                </tr>
                <tr>
                  <td className="lbl" style={{ paddingLeft: "20px" }}>Low</td>
                  <td className="val result-val">{fmt(Math.round(safeNumber(supportQuantum?.support1?.spousalSupport)))}</td>
                </tr>
                <tr>
                  <td className="lbl" style={{ paddingLeft: "20px" }}>Mid</td>
                  <td className="val result-val">{fmt(Math.round(safeNumber(supportQuantum?.support2?.spousalSupport)))}</td>
                </tr>
                <tr>
                  <td className="lbl" style={{ paddingLeft: "20px" }}>High</td>
                  <td className="val result-val">{fmt(Math.round(safeNumber(supportQuantum?.support3?.spousalSupport)))}</td>
                </tr>
              </>
            )}
            {showSpousalSupport && supportQuantum?.spousalSupportDurationRange && (
              <tr className="bold-row">
                <td className="lbl" style={{ fontWeight: "bold" }}>Duration</td>
                <td className="val">{supportQuantum.spousalSupportDurationRange}</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* CALCULATION DETAILS - full width below result */}
        <table className="details-table" style={{ marginTop: "14px" }}>
          <thead>
            <tr>
              <th colSpan={7} className="section-header" style={{ textAlign: "left", margin: 0 }}>Calculation details</th>
            </tr>
            <tr>
              <th className="lbl"></th>
              <th colSpan={2} className="scenario-hdr">LOW</th>
              <th colSpan={2} className="scenario-hdr">MID</th>
              <th colSpan={2} className="scenario-hdr">HIGH</th>
            </tr>
            <tr className="sub-hdr">
              <td className="lbl"></td>
              <td>Party 1</td>
              <td>Party 2</td>
              <td>Party 1</td>
              <td>Party 2</td>
              <td>Party 1</td>
              <td>Party 2</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="lbl">Guideline income</td>
              <td className="val">{fmt(guidelineIncome1)}</td>
              <td className="val">{fmt(guidelineIncome2)}</td>
              <td className="val">{fmt(guidelineIncome1)}</td>
              <td className="val">{fmt(guidelineIncome2)}</td>
              <td className="val">{fmt(guidelineIncome1)}</td>
              <td className="val">{fmt(guidelineIncome2)}</td>
            </tr>
            <tr>
              <td className="lbl">Taxes and deductions</td>
              <td className="val">{fmt2(taxLow1)}</td>
              <td className="val">{fmt2(taxLow2)}</td>
              <td className="val">{fmt2(taxMid1)}</td>
              <td className="val">{fmt2(taxMid2)}</td>
              <td className="val">{fmt2(taxHigh1)}</td>
              <td className="val">{fmt2(taxHigh2)}</td>
            </tr>
            <tr>
              <td className="lbl">Benefits and credits</td>
              <td className="val">{fmt2(benefitsLow1)}</td>
              <td className="val">{fmt2(benefitsLow2)}</td>
              <td className="val">{fmt2(benefitsMid1)}</td>
              <td className="val">{fmt2(benefitsMid2)}</td>
              <td className="val">{fmt2(benefitsHigh1)}</td>
              <td className="val">{fmt2(benefitsHigh2)}</td>
            </tr>
            {showChildSupport && (
              <>
                <tr>
                  <td className="lbl">Child Support</td>
                  <td className="val">{party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{!party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{!party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{!party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                </tr>
                <tr>
                  <td className="lbl">Notional child support</td>
                  <td className="val">{!party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{!party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{!party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                  <td className="val">{party1PaysCS ? fmt(-childSupportAnnual) : ""}</td>
                </tr>
              </>
            )}
            <tr>
              <td className="lbl">Special expenses paid</td>
              <td className="val">{fmt(specialExpenses1)}</td>
              <td className="val">{fmt(specialExpenses2)}</td>
              <td className="val">{fmt(specialExpenses1)}</td>
              <td className="val">{fmt(specialExpenses2)}</td>
              <td className="val">{fmt(specialExpenses1)}</td>
              <td className="val">{fmt(specialExpenses2)}</td>
            </tr>
            <tr className="bold-row">
              <td className="lbl" style={{ fontWeight: "bold" }}>Total disposable income</td>
              <td className="val">{fmt2(disposableLow1)}</td>
              <td className="val">{fmt2(disposableLow2)}</td>
              <td className="val">{fmt2(disposableMid1)}</td>
              <td className="val">{fmt2(disposableMid2)}</td>
              <td className="val">{fmt2(disposableHigh1)}</td>
              <td className="val">{fmt2(disposableHigh2)}</td>
            </tr>
            {showSpousalSupport && (
              <tr className="bold-row">
                <td className="lbl" style={{ fontWeight: "bold" }}>Spousal Support (annual)</td>
                <td className="val" colSpan={2} style={{ textAlign: "center", fontWeight: "bold" }}>
                  {fmt(Math.round(safeNumber(supportQuantum?.support1?.spousalSupport) * 12))}
                </td>
                <td className="val" colSpan={2} style={{ textAlign: "center", fontWeight: "bold" }}>
                  {fmt(Math.round(safeNumber(supportQuantum?.support2?.spousalSupport) * 12))}
                </td>
                <td className="val" colSpan={2} style={{ textAlign: "center", fontWeight: "bold" }}>
                  {fmt(Math.round(safeNumber(supportQuantum?.support3?.spousalSupport) * 12))}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* TAX PROFILE SECTION */}
        {screen2?.taxProfileFromApi?.party1Low && (
          <>
            <style>{`
              .calc-report .tax-profile-table {
                margin-top: 14px;
              }
              .calc-report .tax-profile-table td,
              .calc-report .tax-profile-table th {
                font-size: 9.5px;
                padding: 2px 5px;
              }
              .calc-report .tax-section-row td {
                font-weight: bold;
                background: #fff;
                font-size: 10px;
                border: none;
                padding-top: 10px;
                padding-bottom: 4px;
              }
              .calc-report .tax-total-row td {
                font-weight: bold;
              }
            `}</style>
            {(() => {
              const tp = screen2.taxProfileFromApi;
              const p = (profile: any, key: string): number => safeNumber(profile?.[key]);
              const fmtP = (profile: any, key: string): string => fmt(Math.round(p(profile, key)));

              // Spousal support display: payor shows negative (paid), recipient shows positive (received)
              const fmtSS = (profile: any): string => {
                const paid = p(profile, "deductible_support_paid");
                const received = p(profile, "support_received");
                if (paid > 0) return `(${fmt(Math.round(paid))})`;
                if (received > 0) return fmt(Math.round(received));
                return "$0";
              };

              // Tax profile row helper
              const tpRow = (label: string, key: string) => (
                <tr>
                  <td className="lbl">{label}</td>
                  <td className="val">{fmtP(tp.party1Low, key)}</td>
                  <td className="val">{fmtP(tp.party1Mid, key)}</td>
                  <td className="val">{fmtP(tp.party1High, key)}</td>
                  <td className="val">{fmtP(tp.party2Low, key)}</td>
                  <td className="val">{fmtP(tp.party2Mid, key)}</td>
                  <td className="val">{fmtP(tp.party2High, key)}</td>
                </tr>
              );

              // Row with custom per-cell values
              const tpRowCustom = (label: string, vals: number[]) => (
                <tr>
                  <td className="lbl">{label}</td>
                  {vals.map((v, i) => <td key={i} className="val">{fmt(Math.round(v))}</td>)}
                </tr>
              );

              const sectionRow = (label: string) => (
                <tr className="tax-section-row">
                  <td colSpan={7}><strong>{label}</strong></td>
                </tr>
              );

              // CPP Deductions = cpp_enhanced - cpp2 (first additional CPP)
              const cppDeductions = (profile: any) => p(profile, "cpp_enhanced") - p(profile, "cpp2");

              return (
                <table className="tax-profile-table">
                  <thead>
                    <tr>
                      <th colSpan={7} className="section-header" style={{ textAlign: "left", margin: 0 }}>Tax Profile</th>
                    </tr>
                    <tr>
                      <th className="lbl"></th>
                      <th className="scenario-hdr">{party1Name || "Party 1"}</th>
                      <th className="scenario-hdr">{party1Name || "Party 1"}</th>
                      <th className="scenario-hdr">{party1Name || "Party 1"}</th>
                      <th className="scenario-hdr">{party2Name || "Party 2"}</th>
                      <th className="scenario-hdr">{party2Name || "Party 2"}</th>
                      <th className="scenario-hdr">{party2Name || "Party 2"}</th>
                    </tr>
                    <tr className="sub-hdr">
                      <td className="lbl"></td>
                      <td>Low</td>
                      <td>Med</td>
                      <td>High</td>
                      <td>Low</td>
                      <td>Med</td>
                      <td>High</td>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ── Income ── */}
                    {tpRow("Employment", "employed_income")}
                    {tpRow("Self Employment", "self_employed_income")}
                    <tr>
                      <td className="lbl">Spousal Support</td>
                      <td className="val">{fmtSS(tp.party1Low)}</td>
                      <td className="val">{fmtSS(tp.party1Mid)}</td>
                      <td className="val">{fmtSS(tp.party1High)}</td>
                      <td className="val">{fmtSS(tp.party2Low)}</td>
                      <td className="val">{fmtSS(tp.party2Mid)}</td>
                      <td className="val">{fmtSS(tp.party2High)}</td>
                    </tr>

                    {/* ── Deductions ── */}
                    {sectionRow("Deductions")}
                    {tpRowCustom("CPP Deductions", [
                      cppDeductions(tp.party1Low), cppDeductions(tp.party1Mid), cppDeductions(tp.party1High),
                      cppDeductions(tp.party2Low), cppDeductions(tp.party2Mid), cppDeductions(tp.party2High),
                    ])}
                    {tpRow("Second Additional CPP Employed", "cpp2")}
                    {tpRowCustom("Second Additional CPP Self Employed", [0, 0, 0, 0, 0, 0])}
                    {tpRow("Child Care Expenses", "child_care_expenses")}
                    {tpRow("Additional based on user input", "other_deductions")}
                    {tpRow("Taxable Income", "taxable_income")}

                    {/* ── Federal Credits ── */}
                    {sectionRow("Federal Credits")}
                    {tpRow("Basic Personal Amount", "basic_personal_amount_fed")}
                    {tpRow("Age Amount", "age_amount_fed")}
                    {tpRow("Eligible Dependent", "eligible_dependent_credit_fed")}
                    {tpRow("CPP", "cpp_base")}
                    {tpRow("EI", "ei")}
                    {tpRow("Canada Employment", "canada_employment_credit")}
                    {tpRowCustom("Additional based on user input", [0, 0, 0, 0, 0, 0])}
                    {tpRow("Disability Amount (Self)", "disability_credit_fed")}

                    {/* ── Provincial Credits ── */}
                    {sectionRow("Provincial Credits")}
                    {tpRow("Basic Personal Amount", "basic_personal_amount_prov")}
                    {tpRow("Eligible Dependent", "eligible_dependent_credit_prov")}
                    {tpRow("LIFT", "ontario_lift_credit")}
                    {tpRowCustom("Additional Based on user Input", [0, 0, 0, 0, 0, 0])}
                    {tpRow("Disability Amount (Self).. Ontario", "disability_credit_prov")}

                    {/* ── Taxes And Deductions ── */}
                    {sectionRow("Taxes And Deductions")}
                    {tpRow("Federal Tax", "federal_tax")}
                    {tpRow("Ontario Tax", "provincial_tax")}
                    {tpRow("CPP and EI for Employed", "cpp_ei_deductions")}
                    {tpRowCustom("CPP and EI for Self Employed", [0, 0, 0, 0, 0, 0])}
                    {tpRowCustom("Provincial Credits", [0, 0, 0, 0, 0, 0])}
                    <tr className="tax-total-row">
                      <td className="lbl">Total</td>
                      <td className="val">{fmtP(tp.party1Low, "total_taxes")}</td>
                      <td className="val">{fmtP(tp.party1Mid, "total_taxes")}</td>
                      <td className="val">{fmtP(tp.party1High, "total_taxes")}</td>
                      <td className="val">{fmtP(tp.party2Low, "total_taxes")}</td>
                      <td className="val">{fmtP(tp.party2Mid, "total_taxes")}</td>
                      <td className="val">{fmtP(tp.party2High, "total_taxes")}</td>
                    </tr>

                    {/* ── Benefits ── */}
                    {sectionRow("Benefits")}
                    {tpRow("Canada Child Benefit", "canada_child_benefit")}
                    {tpRowCustom("Child Disability", [0, 0, 0, 0, 0, 0])}
                    {tpRow("Climate action incentive", "climate_action_incentive")}
                    {tpRow("Canada Workers Benefit", "canada_workers_benefit")}
                    {tpRow("GST/HST Benefit", "gst_hst_benefit")}
                    {tpRow("Ontario Child Benefit", "provincial_child_benefit")}
                    {tpRow("Ontario Sales Tax Credit", "provincial_sales_tax_credit")}
                    <tr className="tax-total-row">
                      <td className="lbl">Total</td>
                      <td className="val">{fmtP(tp.party1Low, "total_benefits")}</td>
                      <td className="val">{fmtP(tp.party1Mid, "total_benefits")}</td>
                      <td className="val">{fmtP(tp.party1High, "total_benefits")}</td>
                      <td className="val">{fmtP(tp.party2Low, "total_benefits")}</td>
                      <td className="val">{fmtP(tp.party2Mid, "total_benefits")}</td>
                      <td className="val">{fmtP(tp.party2High, "total_benefits")}</td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </>
        )}
      </div>
    );
  }
);

CalculationReport.displayName = "CalculationReport";

export default CalculationReport;

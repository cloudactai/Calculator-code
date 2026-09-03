import React, { useEffect, useRef, useState } from "react";
import { CALCULATOR_API } from "../../config";
import dataAxios from "../../utils/dataAxios";
import { fetchRequest } from "../../utils/fetchRequest";
import { getAuthToken } from "../../utils/authToken";
import {
  getAllUserInfo,
  getCurrentUserFromCookies,
  getCompanyInfo,
  getUserProvince,
  getUserSID,
} from "../../utils/helpers";
import { matterProvinceCode } from "../../utils/matterProvince";
import { normalizeStoredIntakeData, SECTION_LABELS } from "./matterIntakeContext";
import "./MatterWorkflow.css";
import refreshIcon from "../../assets/images/refresh-icon.png";
import html2pdf from "html2pdf.js";
import CalculationReport from "../../pages/freeCalculatorApi/reports/CalculationReport.tsx";

/**
 * Full-page inline spousal support AI chat panel.
 *
 * Mirrors ChildSupportChatPanel but hits the /spousal-chat endpoint.
 * The AI determines whether to use the with-children or without-children
 * SSAG formula based on conversation with the user.
 *
 * Props:
 *   matterData   – the matter object from the DB (client name, incomes, children, etc.)
 *   matterId     – string
 *   onComplete   – () => void   called when computation is generated
 */

function renderText(text) {
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]*(?:Download|Report)[^\]]*)\]\([^)]+\)/gi, "")
    .replace(/\n/g, "<br/>");
}

function extractDownloadUrl(text) {
  const match = String(text).match(/\[.+?\]\((\/download-report\/[^)]+)\)/);
  return match ? `${CALCULATOR_API}${match[1]}` : null;
}

function formatSections(sections) {
  const lines = [];

  const bg = sections.Background;
  if (bg) {
    const c = bg.client;
    const o = bg.opposingParty;
    if (c?.name) lines.push(`Party 1 (Client): ${c.name}`);
    if (c?.dateOfBirth) lines.push(`  DOB: ${c.dateOfBirth}`);
    if (c?.address) lines.push(`  Address: ${c.address}`);
    if (o?.name) lines.push(`Party 2 (Opposing Party): ${o.name}`);
    if (o?.dateOfBirth) lines.push(`  DOB: ${o.dateOfBirth}`);
    if (o?.address) lines.push(`  Address: ${o.address}`);
  }

  const rel = sections.Relationship;
  if (rel) {
    if (rel.dateOfMarriage) lines.push(`Date of marriage: ${rel.dateOfMarriage}`);
    if (rel.dateOfSeparation) lines.push(`Date of separation: ${rel.dateOfSeparation}`);
    if (rel.dateOfDivorce) lines.push(`Date of divorce: ${rel.dateOfDivorce}`);
    if (rel.typeOfRelationship) lines.push(`Relationship type: ${rel.typeOfRelationship}`);
  }

  const children = sections.Children;
  if (Array.isArray(children) && children.length > 0) {
    lines.push(`Number of children: ${children.length}`);
    children.forEach((c, i) => {
      const info = [];
      if (c.childName) info.push(c.childName);
      if (c.dateOfBirth) info.push(`DOB: ${c.dateOfBirth}`);
      if (c.nowLivesWith) info.push(`lives with: ${c.nowLivesWith}`);
      if (c.isDependent) info.push(`dependent: ${c.isDependent}`);
      if (info.length) lines.push(`  Child ${i + 1}: ${info.join(", ")}`);
    });
  }

  const inc = sections.IncomeAndBenefits;
  if (inc) {
    if (inc.financialYear) lines.push(`Financial year: ${inc.financialYear}`);
    const fmtPartyIncome = (party, label) => {
      if (!party) return;
      const incItems = Array.isArray(party.income) ? party.income : [];
      const benItems = Array.isArray(party.benefit) ? party.benefit : [];
      let totalAnnualIncome = 0;
      if (incItems.length) {
        lines.push(`${label} income:`);
        incItems.forEach((item) => {
          const desc = item.type || item.description || "Income";
          const annual = Number(item.yearlyAmount) || Number(item.annual) || 0;
          const monthly = Number(item.monthlyAmount) || Number(item.monthly) || 0;
          const amt = annual || monthly * 12 || Number(item.amount) || 0;
          totalAnnualIncome += amt;
          lines.push(`  ${desc}${amt ? `: $${amt}/yr` : ""}`);
        });
        lines.push(`  TOTAL ANNUAL INCOME: $${totalAnnualIncome}`);
      }
      if (benItems.length) {
        lines.push(`${label} benefits:`);
        benItems.forEach((item) => {
          const desc = item.type || item.description || "Benefit";
          const amt = item.yearlyAmount || item.annual || item.monthlyAmount || item.monthly || item.amount || "";
          lines.push(`  ${desc}${amt ? `: $${amt}` : ""}`);
        });
      }
    };
    fmtPartyIncome(inc.client, "Party 1");
    fmtPartyIncome(inc.opposingParty, "Party 2");
  }

  const emp = sections.EmploymentDetails;
  if (emp) {
    if (emp.client?.employer) lines.push(`Party 1 employer: ${emp.client.employer}`);
    if (emp.client?.position) lines.push(`  Position: ${emp.client.position}`);
    if (emp.opposingParty?.employer) lines.push(`Party 2 employer: ${emp.opposingParty.employer}`);
    if (emp.opposingParty?.position) lines.push(`  Position: ${emp.opposingParty.position}`);
  }

  const exp = sections.Expenses;
  if (exp) {
    const fmtExpenses = (party, label) => {
      if (!party) return;
      const items = Array.isArray(party.expenses) ? party.expenses : [];
      const special = Array.isArray(party.specialChildExpenses) ? party.specialChildExpenses : [];
      if (items.length) {
        lines.push(`${label} expenses:`);
        items.forEach((e) => {
          const desc = e.type || e.description || "Expense";
          const amt = e.monthly || e.annual || e.amount || "";
          lines.push(`  ${desc}${amt ? `: $${amt}` : ""}`);
        });
      }
      if (special.length) {
        lines.push(`${label} special child expenses:`);
        special.forEach((e) => {
          const desc = e.type || e.description || "Expense";
          const amt = e.monthly || e.annual || e.amount || "";
          lines.push(`  ${desc}${amt ? `: $${amt}` : ""}`);
        });
      }
    };
    fmtExpenses(exp.client, "Party 1");
    fmtExpenses(exp.opposingParty, "Party 2");
  }

  const assets = sections.Assets;
  if (assets) {
    if (assets.valuation_date) lines.push(`Valuation date: ${assets.valuation_date}`);
    Object.entries(assets).forEach(([category, items]) => {
      if (category === "valuation_date" || !Array.isArray(items) || !items.length) return;
      lines.push(`Assets — ${category}:`);
      items.forEach((a) => {
        const desc = a.description || a.type || category;
        const val = a.value || a.amount || "";
        lines.push(`  ${desc}${val ? `: $${val}` : ""}`);
      });
    });
  }

  const debts = sections.DebtsAndLiabilities;
  if (Array.isArray(debts) && debts.length) {
    lines.push(`Debts on file: ${debts.length}`);
    debts.forEach((d) => {
      const desc = d.description || d.creditor || "Debt";
      const val = d.amount || d.balance || "";
      lines.push(`  ${desc}${val ? `: $${val}` : ""}`);
    });
  }

  const court = sections.Court;
  if (court) {
    if (court.name) lines.push(`Court: ${court.name}`);
    if (court.fileNumber) lines.push(`Court file number: ${court.fileNumber}`);
    if (court.municipality) lines.push(`Municipality: ${court.municipality}`);
  }

  return lines;
}

function buildContextMessage(matterData) {
  if (!matterData) return null;

  const savedSections = normalizeStoredIntakeData(matterData);

  const allSections = Object.keys(SECTION_LABELS);
  const retrieved = allSections.filter((s) => s in savedSections);
  const missing = allSections.filter((s) => !(s in savedSections));
  console.log("[SpousalChat] Matter data keys received:", Object.keys(matterData));
  console.log("[SpousalChat] Sections retrieved:", retrieved.map((s) => SECTION_LABELS[s]).join(", ") || "none");
  console.log("[SpousalChat] Sections missing:", missing.map((s) => SECTION_LABELS[s]).join(", ") || "none");

  // Session metadata — sent to AI only, not shown in the chat bubble
  const aiOnly = [];
  const userInfo = getAllUserInfo();
  const currentRole = getCurrentUserFromCookies();
  const companyInfo = getCompanyInfo();
  // The matter's province decides which tables apply, not the firm's.
  const province = matterProvinceCode(matterData, getUserProvince());

  if (companyInfo?.company_name) aiOnly.push(`Law firm: ${companyInfo.company_name}`);
  if (currentRole?.short_firmname) aiOnly.push(`Firm ID: ${currentRole.short_firmname}`);
  if (userInfo?.first_name || userInfo?.last_name) {
    aiOnly.push(
      `Lawyer / user: ${[userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ")}`
    );
  }
  if (province) aiOnly.push(`Province: ${province}`);
  if (matterData.matter_number) aiOnly.push(`Matter number: ${matterData.matter_number}`);
  if (matterData.client_id) aiOnly.push(`Client name: ${matterData.client_id}`);

  // Matter data — shown to user and sent to AI
  const displayParts = formatSections(savedSections);

  if (aiOnly.length === 0 && displayParts.length === 0) return null;

  const intro = "Here is all the information on file for this matter:\n\n";
  const aiBody = [...aiOnly, ...displayParts].join("\n");
  const displayBody = displayParts.join("\n");
  const closing = "\n\nPlease use this information to help with the calculation. Do not ask for values already listed — only ask about missing details.";

  return {
    display: null,
    ai: intro + aiBody + closing,
  };
}

export default function SpousalSupportChatPanel({
  matterData,
  matterId,
  onComplete,
}) {
  const [bubbles, setBubbles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);
  const [contextSent, setContextSent] = useState(false);
  const [lastCalcResult, setLastCalcResult] = useState(null);
  const [savedToMatter, setSavedToMatter] = useState(false);
  const [savingToMatter, setSavingToMatter] = useState(false);

  const windowRef = useRef(null);
  const inputRef = useRef(null);
  const reportRef = useRef(null);
  const [renderReport, setRenderReport] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Build the data shape CalculationReport.tsx expects from AI chat calc result
  function buildReportData(cr) {
    const n = (v) => (typeof v === "number" ? v : Number(v) || 0);
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

    const approximateDOB = (age) => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - age);
      return d.toISOString().split("T")[0];
    };

    // Map payor/recipient tax profiles → party1/party2
    const mapTaxProfiles = () => {
      const get = (key) => cr[key] || null;
      if (party1IsPayor) {
        return {
          party1Low: get("payor_tax_profile_low"),
          party1Mid: get("payor_tax_profile_mid"),
          party1High: get("payor_tax_profile_high"),
          party2Low: get("recipient_tax_profile_low"),
          party2Mid: get("recipient_tax_profile_mid"),
          party2High: get("recipient_tax_profile_high"),
        };
      }
      return {
        party1Low: get("recipient_tax_profile_low"),
        party1Mid: get("recipient_tax_profile_mid"),
        party1High: get("recipient_tax_profile_high"),
        party2Low: get("payor_tax_profile_low"),
        party2Mid: get("payor_tax_profile_mid"),
        party2High: get("payor_tax_profile_high"),
      };
    };

    const tp = mapTaxProfiles();
    const hasTaxProfile = !!(tp.party1Low || tp.party1Mid || tp.party1High);
    const taxVal = (profile, key) => (profile && typeof profile === "object" ? n(profile[key]) : 0);

    return {
      background: {
        party1FirstName: cr.party1_name || "Party 1",
        party1LastName: "",
        party2FirstName: cr.party2_name || "Party 2",
        party2LastName: "",
        party1province: cr.party1_province || "ON",
        party2province: cr.party2_province || "ON",
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
        totalIncomeParty1: p1Income,
        totalIncomeParty2: p2Income,
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
          party1Low: n(cr.party1_indi_low),
          party1Mid: n(cr.party1_indi_mid),
          party1High: n(cr.party1_indi_high),
          party2Low: n(cr.party2_indi_low),
          party2Mid: n(cr.party2_indi_mid),
          party2High: n(cr.party2_indi_high),
        },
        specialExpenses: { specialExpensesLow1: 0, specialExpensesLow2: 0 },
        ...(hasTaxProfile ? { taxProfileFromApi: tp } : {}),
      },
      supportQuantum: {
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
      },
    };
  }

  // Generate PDF once the hidden CalculationReport has rendered
  useEffect(() => {
    if (!renderReport || !reportRef.current) return;
    const timer = setTimeout(async () => {
      try {
        await html2pdf()
          .set({
            margin: [10, 5, 10, 5],
            filename: renderReport.filename || "spousal_support_report.pdf",
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, width: 1100, windowWidth: 1100 },
            jsPDF: { unit: "mm", format: "letter", orientation: "landscape" },
            pagebreak: { mode: ["css", "legacy"] },
          })
          .from(reportRef.current)
          .save();
      } catch (err) {
        console.error("[SpousalChat] PDF generation failed:", err);
        alert("Could not generate PDF.");
      } finally {
        setRenderReport(null);
        setGeneratingPdf(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [renderReport]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [bubbles, loading, warming]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Auto-send context on mount if matter data exists
  useEffect(() => {
    if (!contextSent && matterData) {
      const ctx = buildContextMessage(matterData);
      if (ctx) {
        setContextSent(true);
        // Show shortened version in UI, send full version to AI
        send(ctx.ai, ctx.display);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData, contextSent]);

  async function send(text, displayText) {
    const userText = (text != null ? text : input).trim();
    if (!userText || loading) return;

    const hideUserBubble = displayText === null;
    const bubbleText = displayText || userText;
    const nextMessages = [...messages, { role: "user", content: userText }];

    if (!hideUserBubble) {
      setBubbles((b) => [...b, { role: "user", text: bubbleText }]);
    }
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const warmTimer = setTimeout(() => setWarming(true), 6000);

    try {
      const token = getAuthToken();
      const res = await fetch(`${CALCULATOR_API}/spousal-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      console.log("[SpousalChat] === API RESPONSE DEBUG ===");
      console.log("[SpousalChat] Response status:", res.status);
      console.log("[SpousalChat] Response data keys:", Object.keys(data));
      console.log("[SpousalChat] data.reply length:", data.reply?.length || 0);
      console.log("[SpousalChat] data.calculationResult:", data.calculationResult ? "PRESENT" : "MISSING");
      if (data.calculationResult) {
        const cr = data.calculationResult;
        console.log("[SpousalChat] calculationResult keys:", Object.keys(cr));
        console.log("[SpousalChat] pdf_base64:", cr.pdf_base64 ? `PRESENT (${cr.pdf_base64.length} chars)` : "MISSING");
        console.log("[SpousalChat] pdf_filename:", cr.pdf_filename || "MISSING");
        if (cr._pdf_error) console.error("[SpousalChat] BACKEND PDF ERROR:", cr._pdf_error);
        console.log("[SpousalChat] payor_name:", cr.payor_name);
        console.log("[SpousalChat] recipient_name:", cr.recipient_name);
        console.log("[SpousalChat] monthly_low:", cr.monthly_low);
        console.log("[SpousalChat] monthly_mid:", cr.monthly_mid);
        console.log("[SpousalChat] monthly_high:", cr.monthly_high);
      }
      console.log("[SpousalChat] data.reply (first 300 chars):", data.reply?.substring(0, 300));
      console.log("[SpousalChat] === END API RESPONSE DEBUG ===");

      if (data.error) {
        setBubbles((b) => [
          ...b,
          { role: "assistant", text: `Sorry — ${data.error}` },
        ]);
      } else {
        setBubbles((b) => [
          ...b,
          { role: "assistant", text: data.reply },
        ]);
        setMessages(data.messages || nextMessages);

        // Store the calculation result for manual save via button
        if (data.calculationResult) {
          console.log("[SpousalChat] Storing calculationResult in state");
          setLastCalcResult(data.calculationResult);
          setSavedToMatter(false);
        } else {
          console.log("[SpousalChat] No calculationResult in this response — buttons will NOT show unless a previous result exists");
        }
      }
    } catch {
      setBubbles((b) => [
        ...b,
        {
          role: "assistant",
          text: "Could not reach the calculator service. Please try again.",
        },
      ]);
    } finally {
      clearTimeout(warmTimer);
      setWarming(false);
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function saveToMatter() {
    console.log("[SpousalChat] === SAVE TO MATTER DEBUG ===");
    console.log("[SpousalChat] lastCalcResult:", lastCalcResult ? "PRESENT" : "NULL");
    console.log("[SpousalChat] matterId:", matterId || "MISSING");
    if (!lastCalcResult || !matterId) {
      console.warn("[SpousalChat] saveToMatter aborted: lastCalcResult=", !!lastCalcResult, "matterId=", !!matterId);
      return;
    }
    setSavingToMatter(true);
    const cr = lastCalcResult;
    console.log("[SpousalChat] Saving with _calcResult keys:", Object.keys(cr));
    try {
      const reportData = buildReportData(cr);
      const label = `${cr.payor_name || cr.party1_name || "Party 1"} v ${cr.recipient_name || cr.party2_name || "Party 2"} - Spousal Support`;
      await dataAxios.post(`matters/${matterId}/reports`, {
        calculationType: "spousal_support",
        label,
        inputData: {
          _calcResult: cr,
          _fullState: {
            background: reportData.background,
            aboutTheChildren: reportData.aboutTheChildren,
            aboutTheRelationship: reportData.aboutTheRelationship,
            screen2: reportData.screen2,
            calculator_type: "SPOUSAL",
            supportQuantum: reportData.supportQuantum,
          },
          party1_name: cr.party1_name,
          party2_name: cr.party2_name,
          party1_gross_income: cr.party1_gross_income,
          party2_gross_income: cr.party2_gross_income,
          children: cr.children,
        },
        resultData: {
          payor_name: cr.payor_name,
          recipient_name: cr.recipient_name,
          monthly_low: cr.monthly_low,
          monthly_mid: cr.monthly_mid,
          monthly_high: cr.monthly_high,
          annual_low: cr.annual_low,
          annual_mid: cr.annual_mid,
          annual_high: cr.annual_high,
          duration_label: cr.duration_label,
        },
        pdfFilename: `${label}.pdf`,
      });
      console.log("[SpousalChat] Report saved to DB successfully");

      // ── Save form data to matter DB sections (mirrors manual calculator) ──
      const sid = getUserSID();
      const party1Name = cr.party1_name || cr.payor_name || "";
      const party2Name = cr.party2_name || cr.recipient_name || "";
      // Merge with existing matter data so intake-only fields aren't lost
      const rawBg = matterData?.background || [];
      const rawClientBg = (Array.isArray(rawBg) ? rawBg : []).find((r) => r.role === "Client") || {};
      const rawOpposingBg = (Array.isArray(rawBg) ? rawBg : []).find((r) => r.role === "Opposing Party") || {};
      const rawChildren = matterData?.children || [];
      const rawRel = (Array.isArray(matterData?.relationship) ? matterData.relationship[0] : matterData?.relationship) || {};

      // 1) Save background (party names, DOBs, provinces)
      const province = cr.province || cr.party1_province || matterData?.province || "";
      fetchRequest("post", `update_matter/${sid}/${matterId}/background`, [
        {
          ...rawClientBg,
          id: 1,
          role: "Client",
          name: party1Name || rawClientBg.name || "",
          dateOfBirth: cr.party1_dob || cr.party1_date_of_birth || rawClientBg.dateOfBirth || "",
          province: cr.party1_province || province || rawClientBg.province || "",
        },
        {
          ...rawOpposingBg,
          id: 2,
          role: "Opposing Party",
          name: party2Name || rawOpposingBg.name || "",
          dateOfBirth: cr.party2_dob || cr.party2_date_of_birth || rawOpposingBg.dateOfBirth || "",
          province: cr.party2_province || province || rawOpposingBg.province || "",
        },
      ]).catch((err) => console.warn("[SpousalChat] Failed to save background:", err));

      // 2) Save children details (spousal with-children formula includes children)
      const childrenArr = Array.isArray(cr.children) ? cr.children : [];
      if (childrenArr.length > 0) {
        const childrenRows = childrenArr.map((child, i) => {
          const rawChild = (Array.isArray(rawChildren) ? rawChildren : [])[i] || {};
          return {
            ...rawChild,
            id: i + 1,
            childName: child.name || child.childName || rawChild.childName || "",
            dateOfBirth: child.dateOfBirth || child.dob || rawChild.dateOfBirth || "",
            livesWith: child.custodyArrangement || child.livesWith || child.nowLivesWith || rawChild.livesWith || "",
            childOfRelationship: child.childOfRelationship || rawChild.childOfRelationship || "Yes",
          };
        });
        fetchRequest("post", `update_matter/${sid}/${matterId}/children`, childrenRows)
          .catch((err) => console.warn("[SpousalChat] Failed to save children:", err));
      }

      // 3) Save relationship details (marriage/separation dates and duration)
      fetchRequest("post", `update_matter/${sid}/${matterId}/relationship`, [{
        ...rawRel,
        id: 1,
        dateOfMarriage: cr.date_of_marriage || cr.marriage_date || rawRel.dateOfMarriage || "",
        dateOfSeparation: cr.date_of_separation || cr.separation_date || rawRel.dateOfSeparation || "",
      }]).catch((err) => console.warn("[SpousalChat] Failed to save relationship:", err));

      // 4) Save income to incomeBenefits section
      const buildIncomeRows = (income, roleLabel) => {
        const amt = parseFloat(income || "0");
        if (!amt) return [];
        return [{
          type: "Employment Income",
          yearlyAmount: String(amt),
          monthlyAmount: String(Math.round(amt / 12)),
          role: roleLabel,
          incomeBenefit: "income",
        }];
      };
      const party1Income = cr.party1_gross_income || cr.party1_income || 0;
      const party2Income = cr.party2_gross_income || cr.party2_income || 0;
      const rawIncomeBenefits = matterData?.income_benefits || [];
      const clientBenefitRows = (Array.isArray(rawIncomeBenefits) ? rawIncomeBenefits : [])
        .filter((r) => r.role === "Client" && r.incomeBenefit === "benefit");
      const opposingBenefitRows = (Array.isArray(rawIncomeBenefits) ? rawIncomeBenefits : [])
        .filter((r) => (r.role === "Opposing Party" || r.role === "opposingParty") && r.incomeBenefit === "benefit");
      fetchRequest("post", `update_matter/${sid}/${matterId}/incomeBenefits`, {
        incomeBenefits: {
          client: {
            income: buildIncomeRows(party1Income, "Client"),
            benefit: clientBenefitRows,
          },
          opposingParty: {
            income: buildIncomeRows(party2Income, "Opposing Party"),
            benefit: opposingBenefitRows,
          },
        },
      }).catch((err) => console.warn("[SpousalChat] Failed to save incomeBenefits:", err));

      // 5) Save calculator state so the manual calculator can restore it
      const calcState = {
        calculator_type: "spousal_support",
        background: {
          party1FirstName: (party1Name).split(" ")[0] || "",
          party1LastName: (party1Name).split(" ").slice(1).join(" ") || "",
          party2FirstName: (party2Name).split(" ")[0] || "",
          party2LastName: (party2Name).split(" ").slice(1).join(" ") || "",
          party1DateOfBirth: cr.party1_dob || cr.party1_date_of_birth || "",
          party2DateOfBirth: cr.party2_dob || cr.party2_date_of_birth || "",
          party1province: cr.party1_province || province || "",
          party2province: cr.party2_province || province || "",
        },
        aboutTheChildren: {
          numberOfChildren: childrenArr.length,
          childrenInfo: childrenArr.map((child) => ({
            name: child.name || child.childName || "",
            dateOfBirth: child.dateOfBirth || child.dob || "",
            custodyArrangement: child.custodyArrangement || child.livesWith || child.nowLivesWith || "",
          })),
        },
        aboutTheRelationship: {
          dateOfMarriage: cr.date_of_marriage || cr.marriage_date || "",
          dateOfSeparation: cr.date_of_separation || cr.separation_date || "",
        },
        income: {
          party1: party1Income ? [{ label: "Employment Income", amount: String(party1Income), value: "10100" }] : [],
          party2: party2Income ? [{ label: "Employment Income", amount: String(party2Income), value: "10100" }] : [],
        },
      };
      fetchRequest("post", `update_matter/${sid}/${matterId}/calculatorState`, [calcState])
        .catch((err) => console.warn("[SpousalChat] Failed to save calculatorState:", err));

      console.log("[SpousalChat] === END SAVE TO MATTER DEBUG ===");
      setSavedToMatter(true);
    } catch (err) {
      console.error("[SpousalChat] Failed to save report:", err);
      console.error("[SpousalChat] Error response:", err.response?.data);
      alert("Failed to save to matter. Please try again.");
    } finally {
      setSavingToMatter(false);
    }
  }

  function resetChat() {
    setBubbles([]);
    setMessages([]);
    setInput("");
    setContextSent(false);
    setLastCalcResult(null);
    setSavedToMatter(false);
  }

  return (
    <div className="mw-chat-panel">

      <div className="mw-chat-panel__window" ref={windowRef}>
        {bubbles.length === 0 && !loading && (
          <div className="mw-chat-panel__welcome">
            <h3>Ontario Spousal Support Calculator</h3>
            <p>
              I'll walk you through calculating spousal support under Ontario's
              Spousal Support Advisory Guidelines (SSAG). I'll determine the
              correct formula based on whether there are dependent children.
            </p>
            <div className="mw-chat-panel__starters">
              <button
                className="mw-chip"
                onClick={() => send("I need to calculate spousal support")}
              >
                Calculate spousal support
              </button>
              <button
                className="mw-chip"
                onClick={() =>
                  send("How does having children affect spousal support?")
                }
              >
                Children's impact on support
              </button>
              <button
                className="mw-chip"
                onClick={() => send("What info do you need from me?")}
              >
                What info do you need?
              </button>
            </div>
          </div>
        )}

        {bubbles.map((b, i) => {
          // Show action buttons on the last assistant bubble when a calc result exists.
          // Previously gated on extractDownloadUrl finding a markdown link in the AI
          // reply — if the model omitted or reformatted the link, both buttons vanished.
          const isLastAssistant = b.role === "assistant" && !bubbles.slice(i + 1).some(
            (fb) => fb.role === "assistant"
          );
          const showActions = isLastAssistant && lastCalcResult;
          return (
            <div key={i} className={`mw-chat-row mw-chat-row--${b.role}`}>
              <div className="mw-chat-row__label">
                {b.role === "user" ? "You" : "CloudAct"}
              </div>
              <div
                className="mw-chat-bubble"
                dangerouslySetInnerHTML={{ __html: renderText(b.text) }}
              />
              {showActions && (
                <div className="mw-action-buttons">
                  <button
                    className="mw-download-btn"
                    disabled={generatingPdf}
                    onClick={() => {
                      if (!lastCalcResult) return;
                      setGeneratingPdf(true);
                      const data = buildReportData(lastCalcResult);
                      setRenderReport({
                        ...data,
                        filename: lastCalcResult.pdf_filename || "spousal_support_report.pdf",
                      });
                    }}
                  >
                    {generatingPdf ? "Generating…" : "Download PDF Report"}
                  </button>
                  {matterId && (
                    <button
                      className="mw-save-btn"
                      onClick={saveToMatter}
                      disabled={savingToMatter || savedToMatter}
                    >
                      {savedToMatter
                        ? "✓ Saved to Matter"
                        : savingToMatter
                        ? "Saving…"
                        : "Save to Matter"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="mw-chat-row mw-chat-row--assistant">
            <div className="mw-chat-row__label">CloudAct</div>
            <div className="mw-chat-bubble mw-chat-bubble--typing">
              {warming ? (
                "Warming up the server — first reply can take ~30s…"
              ) : (
                <>
                  <span className="mw-dot" />
                  <span className="mw-dot" />
                  <span className="mw-dot" />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mw-chat-panel__input-bar">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="mw-chat-panel__send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
        <button
          className="mw-chat-panel__reset"
          onClick={resetChat}
          aria-label="New conversation"
          title="New conversation"
        >
          <img
            src={refreshIcon}
            alt=""
            aria-hidden="true"
            className="mw-chat-panel__reset-icon"
          />
        </button>
      </div>

      {/* Hidden CalculationReport for client-side PDF generation */}
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
            typeOfCalculatorSelected="SPOUSAL"
            supportQuantum={renderReport.supportQuantum}
          />
        </div>
      )}
    </div>
  );
}

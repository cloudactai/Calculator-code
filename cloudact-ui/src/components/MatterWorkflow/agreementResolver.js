import dataAxios from "../../utils/dataAxios";
import { normalizeAgreementAnswers } from "./agreementSections";

/**
 * Turns (matter snapshot, saved calculation reports, chat-collected answers)
 * into the one merged object both SeparationAgreementDocument.jsx and the
 * /agreement-chat primer read from. Nothing here writes anywhere — it only
 * resolves values that already exist, the same "database beats chat" rule
 * the field ledger documents.
 */

const rows = (value) => (Array.isArray(value) ? value : []);

const isBlank = (value) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

const normalizedRole = (value) =>
  String(value || "").trim().toLowerCase().replace(/[^a-z]/g, "");

function partyRow(items, party) {
  const expected = party === "client" ? "client" : "opposingparty";
  return rows(items).find((item) => normalizedRole(item?.role) === expected) || {};
}

function ageFromDob(dob) {
  if (!dob) return "";
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 && age < 200 ? age : "";
}

/** Party 1 = the matter's client; Party 2 = the opposing party — the same
 * convention every other intake/update surface in this app uses. */
function partyIdentity(matterData, party) {
  const person = partyRow(matterData?.background, party);
  return {
    name: person.name || "",
    address: person.address || "",
    municipality: person.municipality || "",
  };
}

function childList(matterData) {
  return rows(matterData?.children).map((child) => ({
    name: child.childName || child.name || "",
    dateOfBirth: child.dateOfBirth || "",
    age: child.age || ageFromDob(child.dateOfBirth),
  }));
}

/** Best-effort, read-only flatten of the matter's saved Assets/Debts into a
 * flat reference list — used only to show the chat agent (and the lawyer)
 * what's already on file, never written back. The Assets/Debts intake forms
 * do not yet record which party kept an item or whether it's jointly held
 * (the field ledger itself flags this as a follow-up), so the type/value
 * shape per category is read leniently rather than assumed exactly. */
function assetReferenceList(matterData) {
  const assets = matterData?.assets;
  if (!assets || typeof assets !== "object") return [];
  const out = [];
  for (const [category, items] of Object.entries(assets)) {
    if (category === "valuation_date" || !Array.isArray(items)) continue;
    for (const item of items) {
      const type =
        item?.nature_and_type_of_ownership ||
        item?.type ||
        item?.category ||
        item?.details ||
        category;
      const value =
        item?.market_value?.client?.today ??
        item?.market_value?.today ??
        item?.value ??
        "";
      const address = item?.address_of_property || "";
      if (isBlank(type) && isBlank(value) && isBlank(address)) continue;
      out.push({ category, type, value, address });
    }
  }
  return out;
}

function debtReferenceList(matterData) {
  return rows(matterData?.debts_liabilities)
    .map((item) => ({
      type: item?.category || item?.type || item?.details || "",
      amount: item?.value?.today ?? item?.value ?? item?.amount ?? "",
    }))
    .filter((item) => !isBlank(item.type) || !isBlank(item.amount));
}

/** Fetch this matter's saved calculation reports (child_support and
 * spousal_support), most recent of each type. Read-only — this never writes
 * to SavedCalculation/MatterCalculationReport, which is Marc's in-flight
 * save path (child_support.py / spousal_support.py). If neither type has a
 * saved report yet, both come back null and the agreement chat asks instead. */
export async function fetchAgreementCalcReports(matterId) {
  try {
    const res = await dataAxios.get(`matters/${matterId}/reports`);
    const reports = res.data?.data?.body ?? res.data?.data ?? [];
    const latestOfType = (type) =>
      rows(reports)
        .filter((r) => r.calculationType === type)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    return {
      childSupportReport: latestOfType("child_support"),
      spousalSupportReport: latestOfType("spousal_support"),
    };
  } catch (error) {
    console.error("Unable to load saved calculation reports for the agreement.", error);
    return { childSupportReport: null, spousalSupportReport: null };
  }
}

/**
 * Child support's payer/recipient/amount from the Federal Child Support
 * Guidelines table are a single deterministic figure (unlike SSAG spousal
 * support, always a low/mid/high range) — so a saved child_support report's
 * resultData is a safe, non-ambiguous DB source. Resolves to nulls (never
 * guesses) when the shape doesn't match what report_pdf.py's own child
 * support report already trusts.
 */
function resolveChildSupportFromReport(report) {
  const result = report?.resultData;
  if (!result || isBlank(result.net_payer)) return null;
  const p1 = result.party1_name;
  const p2 = result.party2_name;
  const payer = result.net_payer;
  let recipient = "";
  if (!isBlank(p1) && !isBlank(p2)) {
    recipient = String(p1).trim().toLowerCase() === String(payer).trim().toLowerCase() ? p2 : p1;
  }
  const amount = result.net_monthly;
  if (isBlank(payer) || isBlank(recipient) || isBlank(amount)) return null;
  return { payer, recipient, amount };
}

/**
 * Spousal support's guideline result is a low/mid/high range, not one agreed
 * figure — there is no single canonical "the amount" to read until the
 * parties (and Marc's still-in-flight save-after-calculation work) settle
 * on one. Resolved only in the narrow case where the three scenarios already
 * collapse to one number; otherwise the agreement chat asks (see
 * SpousalSupportFallback in agreementSections.js).
 */
function resolveSpousalSupportFromReport(report) {
  const result = report?.resultData;
  if (!result || isBlank(result.payor)) return null;
  const low = Number(result.monthly_low);
  const mid = Number(result.monthly_mid ?? result.monthly_med);
  const high = Number(result.monthly_high);
  if (![low, mid, high].every((n) => Number.isFinite(n))) return null;
  if (low !== mid || mid !== high) return null;
  if (mid <= 0) return null;
  return { include: true, payer: result.payor, amount: mid };
}

/**
 * Build the merged agreement data both the live document and the chat
 * primer read from. `answers` is the chat-collected blob from
 * MatterAgreementDocument.answers (already normalized).
 */
export function buildAgreementData({
  matterData,
  childSupportReport,
  spousalSupportReport,
  answers,
} = {}) {
  const a = normalizeAgreementAnswers(answers);
  const party1 = partyIdentity(matterData, "client");
  const party2 = partyIdentity(matterData, "opposingParty");
  const children = childList(matterData);
  const relationship = rows(matterData?.relationship)[0] || {};

  const childSupportResolved = resolveChildSupportFromReport(childSupportReport);
  const spousalSupportResolved = resolveSpousalSupportFromReport(spousalSupportReport);

  return {
    party1,
    party2,
    dateOfMarriage: relationship.dateOfMarriage || "",
    placeOfMarriage: relationship.placeOfMarriage || "",
    dateOfSeparation: relationship.dateOfSeparation || "",
    children,
    hasChildren: children.length > 0,

    childSupport: {
      resolved: !!childSupportResolved,
      payer: childSupportResolved?.payer || a.ChildSupportFallback.payer || "",
      recipient: childSupportResolved?.recipient || a.ChildSupportFallback.recipient || "",
      amount: childSupportResolved?.amount ?? a.ChildSupportFallback.amount ?? "",
      // Day of the month, matching the agreement's own "starting on the
      // [day] day of the first month following the date of separation"
      // wording — the same shape as spousalSupport.paymentStartDay below,
      // not a full calendar date.
      paymentDay: a.ChildSupport.paymentDay || "",
    },

    decisionMaking: {
      responsibility: a.DecisionMaking.responsibility || "",
    },

    parentingTime: {
      party1: {
        include: a.ParentingTime.party1.include ?? null,
        schedule: a.ParentingTime.party1.schedule || "",
      },
      party2: {
        include: a.ParentingTime.party2.include ?? null,
        schedule: a.ParentingTime.party2.schedule || "",
      },
    },

    visitation: {
      include: a.Visitation.include ?? null,
      startDate: a.Visitation.startDate || "",
      schedule: a.Visitation.schedule || "",
    },

    spousalSupport: {
      resolved: !!spousalSupportResolved,
      include: spousalSupportResolved?.include ?? a.SpousalSupportFallback.include ?? null,
      payer: spousalSupportResolved?.payer || a.SpousalSupportFallback.payer || "",
      amount: spousalSupportResolved?.amount ?? a.SpousalSupportFallback.amount ?? "",
      paymentStartDay: a.SpousalSupport.paymentStartDay || "",
      recipient: a.SpousalSupport.recipient || "",
    },

    equalization: {
      include: a.Equalization.include ?? null,
      payer: a.Equalization.payer || "",
      recipient: a.Equalization.recipient || "",
      amount: a.Equalization.amount || "",
      paymentDate: a.Equalization.paymentDate || "",
    },

    matrimonialHome: {
      hasSharedHome: a.MatrimonialHome.hasSharedHome ?? null,
      address: a.MatrimonialHome.address || "",
      sellingOrTransferring: a.MatrimonialHome.sellingOrTransferring || "",
      saleProceedsSharing: a.MatrimonialHome.saleProceedsSharing || "",
      recipientName: a.MatrimonialHome.recipientName || "",
      amount: a.MatrimonialHome.amount || "",
      transferRecipient: a.MatrimonialHome.transferRecipient || "",
      transferGivingUp: a.MatrimonialHome.transferGivingUp || "",
      transferDate: a.MatrimonialHome.transferDate || "",
    },

    assets: {
      party1: {
        hasKeptAssets: a.Assets.party1.hasKeptAssets ?? null,
        items: rows(a.Assets.party1.items),
      },
      party2: {
        hasKeptAssets: a.Assets.party2.hasKeptAssets ?? null,
        items: rows(a.Assets.party2.items),
      },
      joint: {
        hasJointAssets: a.Assets.joint.hasJointAssets ?? null,
        items: rows(a.Assets.joint.items),
      },
      onFile: assetReferenceList(matterData),
    },

    debts: {
      hasJointDebts: a.Debts.hasJointDebts ?? null,
      items: rows(a.Debts.items),
      onFile: debtReferenceList(matterData),
    },
  };
}

/**
 * Which chat-answerable topics still need an answer, for the primer's
 * "outstanding" list and for the chat panel's own "anything left?" gating.
 * Order matches the field ledger's own section order.
 */
export function agreementOutstandingFields(agreementData) {
  const out = [];
  const push = (key, label, done) => {
    if (!done) out.push({ key, label });
  };

  if (agreementData.hasChildren) {
    push(
      "childSupport",
      agreementData.childSupport.resolved ? "Day of the month child support payments begin" : "Who pays/receives child support, the amount, and the payment day",
      !!agreementData.childSupport.paymentDay &&
        !isBlank(agreementData.childSupport.payer) &&
        !isBlank(agreementData.childSupport.recipient) &&
        !isBlank(agreementData.childSupport.amount)
    );
    push(
      "decisionMaking",
      "Who has decision-making responsibility for the children",
      !!agreementData.decisionMaking.responsibility
    );
    push(
      "parentingTimeParty1",
      "Whether to include a Party 1 parenting-time schedule",
      agreementData.parentingTime.party1.include === false ||
        (agreementData.parentingTime.party1.include === true && !!agreementData.parentingTime.party1.schedule)
    );
    push(
      "parentingTimeParty2",
      "Whether to include a Party 2 parenting-time schedule",
      agreementData.parentingTime.party2.include === false ||
        (agreementData.parentingTime.party2.include === true && !!agreementData.parentingTime.party2.schedule)
    );
    push(
      "visitation",
      "Whether to include a visitation schedule",
      agreementData.visitation.include === false ||
        (agreementData.visitation.include === true &&
          !!agreementData.visitation.startDate &&
          !!agreementData.visitation.schedule)
    );
  }

  push(
    "spousalSupport",
    agreementData.spousalSupport.resolved
      ? "Spousal support payment start day and recipient"
      : "Whether spousal support applies, and its amount, payer, start day, and recipient",
    agreementData.spousalSupport.include === false ||
      (agreementData.spousalSupport.include === true &&
        !isBlank(agreementData.spousalSupport.payer) &&
        !isBlank(agreementData.spousalSupport.amount) &&
        !!agreementData.spousalSupport.paymentStartDay &&
        !!agreementData.spousalSupport.recipient)
  );

  push(
    "equalization",
    "Whether equalization payments apply, and their payer, recipient, amount, and date",
    agreementData.equalization.include === false ||
      (agreementData.equalization.include === true &&
        !isBlank(agreementData.equalization.payer) &&
        !isBlank(agreementData.equalization.recipient) &&
        !isBlank(agreementData.equalization.amount) &&
        !!agreementData.equalization.paymentDate)
  );

  push(
    "matrimonialHome",
    "Whether there's a shared home, and if so its sale/transfer terms",
    agreementData.matrimonialHome.hasSharedHome === false ||
      (agreementData.matrimonialHome.hasSharedHome === true &&
        !!agreementData.matrimonialHome.sellingOrTransferring)
  );

  push(
    "assetsParty1",
    "Whether Party 1 is keeping any assets after separation",
    agreementData.assets.party1.hasKeptAssets !== null
  );
  push(
    "assetsParty2",
    "Whether Party 2 is keeping any assets after separation",
    agreementData.assets.party2.hasKeptAssets !== null
  );
  push(
    "assetsJoint",
    "Whether any assets stay jointly owned",
    agreementData.assets.joint.hasJointAssets !== null
  );
  push(
    "debts",
    "Whether there are shared debts",
    agreementData.debts.hasJointDebts !== null
  );

  return out;
}

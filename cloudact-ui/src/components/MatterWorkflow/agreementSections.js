/**
 * The chat-collected answer shape for the Separation Agreement (v1), and the
 * merge logic for applying a `set_agreement_section` patch to it.
 *
 * This is the ONE place that names every section the /agreement-chat agent
 * can save to (AGREEMENT_SECTION_NAMES in app.py must list the same names) —
 * keep the two in sync when either changes.
 *
 * Every field here is a "Chat AI Agent" row from the field ledger (Agreements
 * tool /Questions.xlsx, Sheet2). The two ChildSupport/SpousalSupport
 * *Fallback* sections exist only because two ledger rows are marked
 * "Database (after calculation finalize)" with the comment "Marc to work on
 * saving of result after calc done" — that save path is Marc's in-flight
 * work and is never read from here. agreementResolver.js tries to resolve
 * those values from the matter's saved calculation reports first; the
 * fallback sections are only ever used, and only ever asked about, when that
 * resolution comes up empty.
 */

export const AGREEMENT_SECTION_NAMES = [
  "ChildSupport",
  "ChildSupportFallback",
  "DecisionMaking",
  "ParentingTime",
  "Visitation",
  "SpousalSupport",
  "SpousalSupportFallback",
  "Equalization",
  "MatrimonialHome",
  "Assets",
  "Debts",
];

export const EMPTY_AGREEMENT_ANSWERS = Object.freeze({
  ChildSupport: {},
  ChildSupportFallback: {},
  DecisionMaking: {},
  ParentingTime: { party1: {}, party2: {} },
  Visitation: {},
  SpousalSupport: {},
  SpousalSupportFallback: {},
  Equalization: {},
  MatrimonialHome: {},
  Assets: { party1: {}, party2: {}, joint: {} },
  Debts: {},
});

const isPlainObject = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Two-level merge: top-level section keys merge shallowly, and any nested
 * plain object one level down (ParentingTime.party1, Assets.joint, …) merges
 * shallowly too. Arrays (item lists) are replaced wholesale, matching the
 * system prompt's instruction to send the full list for whichever key is
 * being updated.
 */
function mergeSectionData(existing, patch) {
  const base = isPlainObject(existing) ? existing : {};
  if (!isPlainObject(patch)) return base;
  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] =
      isPlainObject(value) && isPlainObject(base[key])
        ? { ...base[key], ...value }
        : value;
  }
  return merged;
}

/** Apply one `{ section, data }` patch (as returned by /agreement-chat's
 * saved_sections) onto the current answers blob. Unknown section names are
 * ignored rather than thrown on, the same defensive stance the rest of the
 * chat plumbing takes toward model output. */
export function applyAgreementPatch(answers, { section, data } = {}) {
  if (!section || !AGREEMENT_SECTION_NAMES.includes(section) || data === undefined) {
    return answers;
  }
  return {
    ...answers,
    [section]: mergeSectionData(answers?.[section], data),
  };
}

export function applyAgreementPatches(answers, patches) {
  return (Array.isArray(patches) ? patches : []).reduce(
    (acc, patch) => applyAgreementPatch(acc, patch),
    answers || EMPTY_AGREEMENT_ANSWERS
  );
}

/** Normalize a stored/loaded answers blob so every section key the UI reads
 * unconditionally (nested party1/party2/joint included) is always present,
 * even if the row was created before a later field was added. */
export function normalizeAgreementAnswers(answers) {
  const source = isPlainObject(answers) ? answers : {};
  return {
    ...EMPTY_AGREEMENT_ANSWERS,
    ...source,
    ParentingTime: {
      ...EMPTY_AGREEMENT_ANSWERS.ParentingTime,
      ...(isPlainObject(source.ParentingTime) ? source.ParentingTime : {}),
    },
    Assets: {
      ...EMPTY_AGREEMENT_ANSWERS.Assets,
      ...(isPlainObject(source.Assets) ? source.Assets : {}),
    },
  };
}

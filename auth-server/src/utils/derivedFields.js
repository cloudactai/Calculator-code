// Fields the manual intake forms keep in lockstep, enforced here so every
// writer produces the same record.
//
// The five-steps forms derive one field from another as you type:
//   - Income & Benefits and Expenses link monthlyAmount <-> yearlyAmount
//     (IncomeAndBenefitsSimple.jsx / ExpensesSimple.jsx: monthly*12, yearly/12,
//     both Math.round-ed).
//   - Children derive age from dateOfBirth (calculateAge).
//
// A field-level AI patch can name just one side of a pair, which merges over
// the stored row and leaves its partner stale — a state the manual UI cannot
// produce. Deriving here, on the way in, means the AI intake chat, the update
// chat and the T1 upload all land the same consistent row the forms would.
//
// Yearly is authoritative when both are present: support is calculated on
// annual income (the Federal Child Support Guidelines are annual) and the
// yearly figure is what comes off a tax return. Deriving monthly from yearly is
// also a no-op for anything the manual form sends, because the form already
// rounds the same way in both directions.

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

/** Parse a stored amount ("56,000", "$5600", 5600) into a number, or null. */
const amountOf = (value) => {
  if (isBlank(value)) return null;
  const raw = typeof value === "number" ? value : String(value).replace(/[$,\s]/g, "");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Write `derived` to `field` only when the stored value is missing or actually
 * differs numerically. An untouched row keeps its existing representation, so
 * rows the manual form already made consistent are passed through unchanged.
 */
const withDerived = (row, field, derived) => {
  const current = amountOf(row[field]);
  if (current !== null && current === derived) return row;
  return { ...row, [field]: String(derived) };
};

/**
 * Parse a full date of birth: "YYYY-MM-DD" (optionally with a time part) or a
 * Unix-ms timestamp.
 *
 * Deliberately strict. Anything else — free text, or a bare year like "2010" —
 * returns null so the age is left as supplied rather than guessed at. V8's Date
 * parser is lenient enough to read a year out of "sometime in 2010", which is
 * exactly the kind of invention this must not do.
 */
const dateOf = (value) => {
  if (isBlank(value)) return null;

  const raw = typeof value === "number" ? String(value) : String(value).trim();

  if (/^\d+$/.test(raw)) {
    const ms = Number(raw);
    // Below this a bare number is a year or a nonsense value, not a timestamp.
    if (!Number.isFinite(ms) || ms <= 9999999999) return null;
    const fromMs = new Date(ms);
    return Number.isNaN(fromMs.getTime()) ? null : fromMs;
  }

  if (!/^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(raw)) return null;
  const parsed = new Date(raw.slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Age in completed years. Mirrors the frontend's calculateAge but reads the
 * date in UTC throughout, so the stored value does not shift with the server's
 * timezone the way a UTC-parsed date read with local getters would.
 */
function ageOnDate(dob, now = new Date()) {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Keep monthlyAmount and yearlyAmount in step (yearly wins when both exist). */
function linkMonthlyYearly(row) {
  if (!row || typeof row !== "object") return row;

  const yearly = amountOf(row.yearlyAmount);
  if (yearly !== null) return withDerived(row, "monthlyAmount", Math.round(yearly / 12));

  const monthly = amountOf(row.monthlyAmount);
  if (monthly !== null) return withDerived(row, "yearlyAmount", Math.round(monthly * 12));

  return row;
}

/** Keep a child's age in step with their date of birth. */
function linkChildAge(row, now = new Date()) {
  if (!row || typeof row !== "object") return row;

  const dob = dateOf(row.dateOfBirth);
  if (!dob) return row;

  const age = ageOnDate(dob, now);
  // A date of birth in the future would give a negative age; leave the row
  // alone rather than storing nonsense over what the user supplied.
  if (age < 0) return row;

  return withDerived(row, "age", age);
}

const DERIVERS = {
  income_benefits: linkMonthlyYearly,
  expenses: linkMonthlyYearly,
  children: linkChildAge,
};

/**
 * Apply whatever derivations the given record type has. Row types without a
 * derived pair (assets, debts, background, …) pass straight through.
 *
 * @param {string} rowType stored record type, e.g. "income_benefits"
 * @param {object[]} rows  incoming section rows
 * @param {Date} [now]     injectable clock, for age
 */
function applyDerivedFields(rowType, rows, now = new Date()) {
  const derive = DERIVERS[rowType];
  if (!derive || !Array.isArray(rows)) return rows;
  return rows.map((row) => derive(row, now));
}

module.exports = {
  applyDerivedFields,
  linkMonthlyYearly,
  linkChildAge,
};

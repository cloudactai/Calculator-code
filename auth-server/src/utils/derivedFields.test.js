const test = require("node:test");
const assert = require("node:assert");

const {
  applyDerivedFields,
  linkMonthlyYearly,
  linkChildAge,
} = require("./derivedFields");

// ── monthly <-> yearly ────────────────────────────────────────────────────────

test("a patch naming only the yearly amount refreshes the stale monthly", () => {
  // The reported bug: the AI changed yearly to 56000 and monthly stayed 5600.
  const row = linkMonthlyYearly({ type: "Employment income", yearlyAmount: "56000" });
  assert.strictEqual(row.yearlyAmount, "56000");
  assert.strictEqual(row.monthlyAmount, "4667");
});

test("a patch naming only the monthly amount derives the yearly", () => {
  const row = linkMonthlyYearly({ type: "Employment income", monthlyAmount: "5600" });
  assert.strictEqual(row.monthlyAmount, "5600");
  assert.strictEqual(row.yearlyAmount, "67200");
});

test("yearly wins when both are supplied and disagree", () => {
  const row = linkMonthlyYearly({ yearlyAmount: "56000", monthlyAmount: "5600" });
  assert.strictEqual(row.yearlyAmount, "56000");
  assert.strictEqual(row.monthlyAmount, "4667");
});

test("rows the manual form already made consistent are passed through untouched", () => {
  // Typing 5600 monthly makes the form write 67200 yearly.
  const fromMonthly = { monthlyAmount: 5600, yearlyAmount: 67200 };
  assert.strictEqual(linkMonthlyYearly(fromMonthly), fromMonthly);

  // Typing 56000 yearly makes the form write Math.round(56000/12) = 4667.
  const fromYearly = { monthlyAmount: 4667, yearlyAmount: 56000 };
  assert.strictEqual(linkMonthlyYearly(fromYearly), fromYearly);
});

test("the derived monthly is rounded, never a repeating decimal", () => {
  assert.strictEqual(linkMonthlyYearly({ yearlyAmount: "56000" }).monthlyAmount, "4667");
  assert.strictEqual(linkMonthlyYearly({ yearlyAmount: "10000" }).monthlyAmount, "833");
  assert.strictEqual(linkMonthlyYearly({ yearlyAmount: "1" }).monthlyAmount, "0");
});

test("deriving is idempotent — re-saving a row does not drift", () => {
  const once = linkMonthlyYearly({ yearlyAmount: "56000", monthlyAmount: "5600" });
  const twice = linkMonthlyYearly(once);
  assert.deepStrictEqual(twice, once);
  // Rounding must not feed back into the authoritative yearly figure.
  assert.strictEqual(twice.yearlyAmount, "56000");
});

test("formatted and numeric amounts are both understood", () => {
  assert.strictEqual(linkMonthlyYearly({ yearlyAmount: "$56,000" }).monthlyAmount, "4667");
  assert.strictEqual(linkMonthlyYearly({ yearlyAmount: 56000 }).monthlyAmount, "4667");
});

test("a zero yearly amount still derives, rather than being treated as absent", () => {
  const row = linkMonthlyYearly({ yearlyAmount: "0", monthlyAmount: "5600" });
  assert.strictEqual(row.monthlyAmount, "0");
});

test("rows with no amounts, or unparseable ones, are left alone", () => {
  const blank = { type: "Employment income", monthlyAmount: "", yearlyAmount: "" };
  assert.strictEqual(linkMonthlyYearly(blank), blank);

  const junk = { yearlyAmount: "see attached" };
  assert.strictEqual(linkMonthlyYearly(junk), junk);
});

// ── child age <- date of birth ────────────────────────────────────────────────

const NOW = new Date("2026-07-30T00:00:00Z");

test("a patch changing the date of birth refreshes the stale age", () => {
  const row = linkChildAge({ childName: "Rory", dateOfBirth: "2010-05-14", age: "9" }, NOW);
  assert.strictEqual(row.age, "16");
});

test("age accounts for a birthday that has not happened yet this year", () => {
  // Birthday later in 2026 — still 15.
  assert.strictEqual(linkChildAge({ dateOfBirth: "2010-09-14" }, NOW).age, "15");
  // Birthday today — turns 16.
  assert.strictEqual(linkChildAge({ dateOfBirth: "2010-07-30" }, NOW).age, "16");
  // Birthday tomorrow — still 15.
  assert.strictEqual(linkChildAge({ dateOfBirth: "2010-07-31" }, NOW).age, "15");
});

test("a date of birth stored as a unix-ms timestamp is understood", () => {
  const ms = String(Date.UTC(2010, 4, 14));
  assert.strictEqual(linkChildAge({ dateOfBirth: ms }, NOW).age, "16");
});

test("an already-correct age is passed through untouched", () => {
  const row = { childName: "Rory", dateOfBirth: "2010-05-14", age: 16 };
  assert.strictEqual(linkChildAge(row, NOW), row);
});

test("a missing, unparseable or future date of birth leaves age alone", () => {
  const noDob = { childName: "Rory", age: "9" };
  assert.strictEqual(linkChildAge(noDob, NOW), noDob);

  const junk = { dateOfBirth: "sometime in 2010", age: "9" };
  assert.strictEqual(linkChildAge(junk, NOW), junk);

  const unborn = { dateOfBirth: "2030-01-01", age: "" };
  assert.strictEqual(linkChildAge(unborn, NOW), unborn);
});

test("a partial date of birth is not guessed at", () => {
  // A bare year or year-month could be any age within a 12-month span; leave
  // whatever was supplied rather than assuming January 1st.
  const bareYear = { dateOfBirth: "2010", age: "9" };
  assert.strictEqual(linkChildAge(bareYear, NOW), bareYear);

  const yearMonth = { dateOfBirth: "2010-05", age: "9" };
  assert.strictEqual(linkChildAge(yearMonth, NOW), yearMonth);
});

test("a date of birth with a time component is still read", () => {
  assert.strictEqual(linkChildAge({ dateOfBirth: "2010-05-14T00:00:00.000Z" }, NOW).age, "16");
});

// ── dispatch by record type ───────────────────────────────────────────────────

test("income and expense rows are linked, other record types are not", () => {
  const income = applyDerivedFields("income_benefits", [{ yearlyAmount: "56000" }]);
  assert.strictEqual(income[0].monthlyAmount, "4667");

  const expenses = applyDerivedFields("expenses", [{ type: "Rent", monthlyAmount: "2000" }]);
  assert.strictEqual(expenses[0].yearlyAmount, "24000");

  const children = applyDerivedFields("children", [{ dateOfBirth: "2010-05-14" }], NOW);
  assert.strictEqual(children[0].age, "16");

  // A debt's three dated balances are independent figures, not a linked pair.
  const debtRow = { category: "Mortgages", on_valuation_date: "300000", today: "250000" };
  const debts = applyDerivedFields("debts_liabilities", [debtRow]);
  assert.strictEqual(debts[0], debtRow);

  // Assets carry a market_value block, not a monthly/yearly pair.
  const assetRow = { asset_type: "lands", address_of_property: "12 King St" };
  assert.strictEqual(applyDerivedFields("assets", [assetRow])[0], assetRow);
});

test("special child expenses keep their single amount untouched", () => {
  // s.7 expenses are { type, childName, amount, taxCredits } — no linked pair.
  const row = { type: "Hockey", childName: "Rory", amount: "1200" };
  assert.strictEqual(applyDerivedFields("special_expenses", [row])[0], row);
});

test("a non-array payload is returned unchanged", () => {
  assert.strictEqual(applyDerivedFields("income_benefits", undefined), undefined);
  assert.strictEqual(applyDerivedFields("income_benefits", null), null);
});

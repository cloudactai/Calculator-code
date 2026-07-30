const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { buildLegacyPrefill } = require("./formPrefillCompat");
const { prefillFields } = require("./formPrefillResolver");

const rowsOf = (records) => (dataType) => records[dataType] || [];
const templateMapping = (fileName) => require(path.join("..", "..", "form-template-export", fileName));

test("income prefill uses monthly amounts for financial statement forms", () => {
  const prefill = buildLegacyPrefill(rowsOf({
    income_benefits: [
      {
        role: "Client",
        type: "Employment income (before deductions)",
        monthlyAmount: "5,000",
        yearlyAmount: "60,000",
      },
      {
        role: "Opposing Party",
        type: "Pension income (including CPP and OAS)",
        monthlyAmount: "1,250",
        yearlyAmount: "15,000",
      },
    ],
  }));

  assert.equal(prefill.income.client.employmentIncome, "5000");
  assert.equal(prefill.income.opposingParty.pensionIncome, "1250");
});

test("income prefill derives a monthly amount when only yearly income is stored", () => {
  const prefill = buildLegacyPrefill(rowsOf({
    income_benefits: [
      {
        role: "Client",
        type: "Employment income (before deductions)",
        yearlyAmount: "60,000",
      },
    ],
  }));

  assert.equal(prefill.income.client.employmentIncome, "5000");
});

test("income prefill aggregates repeated income types as monthly values", () => {
  const prefill = buildLegacyPrefill(rowsOf({
    income_benefits: [
      {
        role: "Client",
        type: "Other income",
        monthlyAmount: "200",
        yearlyAmount: "2400",
      },
      {
        role: "Client",
        type: "Other sources of income",
        monthlyAmount: "300",
        yearlyAmount: "3600",
      },
    ],
  }));

  assert.equal(prefill.income.client.otherIncome, "500");
});

test("all financial statement templates receive monthly income prefills", () => {
  const prefill = buildLegacyPrefill(rowsOf({
    income_benefits: [
      {
        role: "Client",
        type: "Employment income (before deductions)",
        monthlyAmount: "5,000",
        yearlyAmount: "60,000",
      },
    ],
  }));

  for (const fileName of ["Form13.json", "Form13_1.json"]) {
    const result = prefillFields(prefill, templateMapping(fileName));
    assert.equal(result.values["client-employmentIncome"], "5000", fileName);
  }
});

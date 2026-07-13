// Calculator reference-data routes: tax brackets, dynamic values, and child
// support tables.  These were on the retired legacy /v1 backend and are now
// served as static JSON from this auth-server.
//
// Data sources:
//   tax_constants.json  – year-variable tax constants (brackets, credit
//                         amounts, benefit thresholds).  Add a new top-level
//                         key (e.g. "2026") when CRA publishes new values.
//   schedule_i.json     – Ontario child-support guideline tables.

const express = require("express");
const path = require("path");

const router = express.Router();

// ── Load data files ─────────────────────────────────────────────────────────
const TAX_CONSTANTS = require("../data/tax_constants.json");
const SCHEDULE_I = require("../data/schedule_i.json");

// Legacy response wrapper (same shape as mattersRoutes)
const ok = (body) => ({ data: { code: 200, status: "success", body } });

// ── Helpers ─────────────────────────────────────────────────────────────────

function getConstants(year) {
  const key = String(year);
  if (TAX_CONSTANTS[key]) return TAX_CONSTANTS[key];
  const best = Object.keys(TAX_CONSTANTS).sort().pop();
  return TAX_CONSTANTS[best];
}

/**
 * Build the Key/Value array the frontend's convertArrToObj() expects.
 * Province = "FED" → federal values; otherwise provincial values for that
 * province code (currently only "ON" is populated).
 */
function buildDynamicValues(year, province) {
  const c = getConstants(year);
  const kv = (Key, Value) => ({ Key, Value: Number(Value) });

  if (province === "FED") {
    // ── Federal values ────────────────────────────────────────────────────
    const lowerThreshold = c.CCB_LOWER_THRESHOLD;
    const upperThreshold = c.CCB_UPPER_THRESHOLD;
    const span = upperThreshold - lowerThreshold;

    return [
      kv("BasicPersonalAmountFed", c.BASIC_PERSONAL_AMOUNT_FED),
      kv("AmountForEligibleDependentFed", c.AMOUNT_FOR_ELIGIBLE_DEPENDENT_FED),
      kv("BaseCPPLimit", c.BASE_CPP_LIMIT),
      kv("CanadaEmploymentAmountLimit", c.CANADA_EMPLOYMENT_AMOUNT_LIMIT),
      kv("EILimit", c.EI_LIMIT),
      kv("EIRate", c.EI_RATE),
      kv("EnhancedCPPDeductionLimit", c.ENHANCED_CPP_LIMIT),
      kv("EnhancedCPPDeductionRate", 0.01),
      kv("SelfEmployedEnhCPPRate", 0.119),
      kv("SelfEmployedEnhCPPThreshold", c.SELF_EMPLOYED_ENH_CPP_THRESHOLD),
      kv("DisabilityAmount", c.DISABILITY_AMOUNT_FED),
      kv("AgeAmtBase", c.AGE_AMOUNT_BASE),
      kv("AgeAmtLowerThreshold", c.AGE_AMOUNT_LOWER_THRESHOLD),

      // CCB (Canada Child Benefit)
      kv("ChildBenefitBaseAmountLess6", c.CCB_CHILD_UNDER_6),
      kv("ChildBenefitBaseAmountMore6", c.CCB_CHILD_6_17),
      kv("CAChildBenefitReduLowerThreshold", lowerThreshold),
      kv("CAChildBenefitReduHighThreshold", upperThreshold),
      // Phase-1 totals at upper threshold boundary (phase1Rate × span)
      kv("CAChildBenefitBase1Child", span * 0.07),
      kv("CAChildBenefitBase2Child", span * 0.135),
      kv("CAChildBenefitBase3Child", span * 0.19),
      kv("CAChildBenefitBase4Child", span * 0.23),

      // GST/HST benefit
      kv("GSTBaseCredit", c.GST_BASE_CREDIT),
      kv("GSTDependentCredit", c.GST_ELIGIBLE_DEP),
      kv("GSTBaseAmount", c.GST_UPPER_THRESHOLD),

      // CWB (Canada Workers Benefit)
      kv("CAWorkerBenefitSingleMax", c.CWB_SINGLE_MAX),
      kv("CAWorkerBenefitFamMax", c.CWB_FAMILY_MAX),
      kv("CAWorkerBenefitSingleThreshold", c.CWB_SINGLE_THRESHOLD),
      kv("CAWorkerBenefitFamThreshold", c.CWB_FAMILY_THRESHOLD),

      // CPP2
      kv("CPP2MaxAmt", c.CPP2_MAX_AMT),
      kv("CPP2MaxPenEarning", c.CPP2_MAX_PEN_EARNING),
      kv("CPP2PenEarning", c.CPP2_PEN_EARNING),
      kv("CPP2Rate", 0.04),
    ];
  }

  // ── Provincial values (ON) ──────────────────────────────────────────────
  if (province === "ON") {
    return [
      kv("BasicPersonalAmount", c.BASIC_PERSONAL_AMOUNT_ON),
      kv("BasicPersonalAmountOntario", c.BASIC_PERSONAL_AMOUNT_ON),
      kv("AmountForEligibleDependent", c.AMOUNT_FOR_ELIGIBLE_DEPENDENT_ON),
      kv("AmountForEligibleDependentOntario", c.AMOUNT_FOR_ELIGIBLE_DEPENDENT_ON),
      kv("DisabilityProvAmount", c.DISABILITY_AMOUNT_ON),

      // Ontario surtax
      kv("ONSurtaxThreshold1", c.ON_SURTAX_THRESHOLD_1),
      kv("ONSurtaxThreshold2", c.ON_SURTAX_THRESHOLD_2),

      // Ontario tax reduction
      kv("ONTaxReductionBase", c.ON_TAX_REDUCTION_BASE),
      kv("ONTaxReductionDep", c.ON_TAX_REDUCTION_DEP),

      // Ontario LIFT
      kv("ONLIFTAmount", c.ON_LIFT_MAX),
      kv("ONLIFTIndividual", c.ON_LIFT_INDIVIDUAL_THRESHOLD),
      kv("ONLIFTReductionRate", 0.05),

      // OCB (Ontario Child Benefit)
      kv("ChildBenefitBasic", c.OCB_BASE),
      kv("ChildBenefitDeduction", c.OCB_THRESHOLD),

      // OSTC (Ontario Sales Tax Credit)
      kv("ONSalesTaxBase", c.OSTC_BASE),
      kv("ONSalesTaxThresholdFamily", c.OSTC_FAMILY_THRESHOLD),
      kv("ONSalesTaxThresholdSingle", c.OSTC_SINGLE_THRESHOLD),

      // Climate Action Incentive (Ontario)
      kv("ONClimateActionBase", c.CAI_INDIVIDUAL),
      kv("ONClimateActionChildFirstChild", c.CAI_FIRST_CHILD_SINGLE_PARENT),
      kv("ONClimateActionChildUnder19", c.CAI_PER_ADDITIONAL_CHILD),

      // Ontario age amount
      kv("TaxReductionBase", c.ON_AGE_AMOUNT_BASE),
      kv("TaxReductionThresholdCalc", c.ON_AGE_AMOUNT_THRESHOLD),
      kv("TaxReductionThresholdEligibility", c.ON_AGE_AMOUNT_THRESHOLD),
    ];
  }

  // Unsupported province — return empty array (frontend handles gracefully)
  return [];
}

/**
 * Build the tax-bracket rows the frontend's separateValuesDB() expects.
 * Returns rows tagged with Province: "FED", province, province+"-Health",
 * "ON-Ccare", and "ON-Mrate".
 */
function buildTaxBrackets(year, province) {
  const c = getConstants(year);
  const rows = [];

  // Federal brackets
  for (const b of c.FEDERAL_BRACKETS) {
    rows.push({ Province: "FED", From: b.From, To: b.To, Income_over: b.Income_over, Rate: b.Rate, Basic: b.Basic });
  }

  // Provincial brackets (ON)
  if (province === "ON" || !province) {
    for (const b of c.ON_BRACKETS) {
      rows.push({ Province: "ON", From: b.From, To: b.To, Income_over: b.Income_over, Rate: b.Rate, Basic: b.Basic });
    }

    // Ontario Health Premium
    for (const b of c.ON_HEALTH) {
      rows.push({ Province: "ON-Health", From: b.From, To: b.To, Income_over: b.Income_over, Rate: b.Rate, Basic: b.Basic });
    }

    // Ontario child-care credit rates
    for (const b of c.ON_CARE_RATES) {
      rows.push({ Province: "ON-Ccare", From: b.From, To: b.To, Rate: b.Rate });
    }

    // Combined marginal rates (federal + Ontario)
    const fedBrackets = c.FEDERAL_BRACKETS;
    const onBrackets = c.ON_BRACKETS;
    const breakpoints = new Set();
    for (const b of fedBrackets) { breakpoints.add(b.From); }
    for (const b of onBrackets) { breakpoints.add(b.From); }
    const sorted = [...breakpoints].sort((a, b) => a - b);

    for (let i = 0; i < sorted.length; i++) {
      const from = sorted[i];
      const to = i + 1 < sorted.length ? sorted[i + 1] - 1 : 9999999;
      const fedRate = fedBrackets.filter(b => b.From <= from && b.To >= from)[0]?.Rate || 0;
      const onRate = onBrackets.filter(b => b.From <= from && b.To >= from)[0]?.Rate || 0;
      rows.push({ Province: "ON-Mrate", From: from, To: to, Rate: +(fedRate + onRate).toFixed(4) });
    }
  }

  return rows;
}

// ── Routes ──────────────────────────────────────────────────────────────────

// Available tax years
router.get("/tax-calc-distinct-years", (req, res) => {
  const years = Object.keys(TAX_CONSTANTS)
    .map((y) => ({ year: Number(y) }))
    .sort((a, b) => b.year - a.year);
  return res.json(ok(years));
});

// Dynamic values (credit amounts, benefit thresholds, etc.)
router.get("/dynamic_values_by_year/:year/:province", (req, res) => {
  const year = Number(req.params.year);
  const province = req.params.province.toUpperCase();
  const values = buildDynamicValues(year, province);
  return res.json(ok(values));
});

// Tax bracket / rate tables
router.get("/tax-calc-values-by-year/:year", (req, res) => {
  const year = Number(req.params.year);
  // Include brackets for all provinces the frontend expects
  const rows = buildTaxBrackets(year, "ON");
  return res.json(ok(rows));
});

// Child support guideline tables (Schedule I)
router.get("/childSupport/values/:province/:noChild", (req, res) => {
  const province = req.params.province.toUpperCase();
  const childCounts = req.params.noChild
    .split(",")
    .map(Number)
    .filter((n) => n > 0);

  const filtered = SCHEDULE_I.filter(
    (row) =>
      row.province === province && childCounts.includes(row.no_of_Children)
  );

  return res.json(ok(filtered));
});

module.exports = router;

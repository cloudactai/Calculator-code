"""
spousal_support.py
------------------
Ontario SSAG spousal support calculators.

Contains two sets of functions:

1. Clean Python API (calculate_spousal_support_no_children / _with_children)
   Inputs are after-tax (net) annual incomes, before CS adjustments.

2. Frontend port (spousal_support_formula_by_rate, formula_for_calculating_duration_of_support,
   calculate_spousal_support_acc_to_salary_diff, etc.)
   Exact translation of taxCalculationFormula.ts / Screen2.ts.
   Bugs in the TypeScript are preserved intentionally (marked ⚠️).

3. Iterative engine (calculate_spousal_support_iterative)
   Calls tax.py on each step so spousal support ↔ taxes converge together.
   Uses damped fixed-point iteration (~6 steps per rate).

Public API summary
------------------
  calculate_spousal_support_no_children(...)  → SpousalSupportResult
  calculate_spousal_support_with_children(...) → SpousalSupportResult
  calculate_spousal_support_iterative(...)    → IterativeResult
"""

import contextlib
import io
import os
import sys
from dataclasses import dataclass

# Tax calculator lives in the same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tax import TaxInput, ChildInfo as TaxChildInfo, calculate_taxes  # noqa: E402
from child_support import (                                             # noqa: E402
    calculate_child_support,
    determine_type_of_splitting,
    ChildInfo as CSChildInfo,
)

def compute_child_counts(children: list) -> dict:
    """Build child_counts dict from a list of child dicts."""
    counts = {"party1": 0, "party2": 0, "shared": 0,
              "party1WithAdultChild": 0, "party2WithAdultChild": 0}
    for c in children:
        adult   = c.get("is_adult", False)
        custody = c.get("custody_arrangement", "")
        if custody == "Party 1":
            if adult: counts["party1WithAdultChild"] += 1
            else:     counts["party1"] += 1
        elif custody == "Party 2":
            if adult: counts["party2WithAdultChild"] += 1
            else:     counts["party2"] += 1
        elif custody == "Shared":
            counts["shared"] += 1
    return counts
import json as _json
_SCHEDULE_I_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schedule_i.json")
with open(_SCHEDULE_I_PATH) as _f:
    _SCHEDULE_I = _json.load(_f)


# Sentinel used for indefinite duration (matches frontend value)
INDEFINITE_SENTINEL = 999_999_999
INDEFINITE          = INDEFINITE_SENTINEL   # frontend alias


# ===========================================================================
# Dataclasses
# ===========================================================================

@dataclass
class SpousalSupportResult:
    payor:             str
    recipient:         str
    net_income_diff:   float   # annual after-tax, absolute value

    pct_low:           float   # as a percentage value, e.g. 37.5
    pct_med:           float
    pct_high:          float

    monthly_low:       float
    monthly_med:       float
    monthly_high:      float

    annual_low:        float
    annual_med:        float
    annual_high:       float

    duration_low:      float   # years; INDEFINITE_SENTINEL = indefinite
    duration_high:     float
    duration_label:    str     # human-readable


@dataclass
class IterativeResult:
    monthly_low:          float
    monthly_mid:          float
    monthly_high:         float
    annual_low:           float
    annual_mid:           float
    annual_high:          float
    payor_indi_low:       float
    recipient_indi_low:   float
    payor_indi_mid:       float
    recipient_indi_mid:   float
    payor_indi_high:      float
    recipient_indi_high:  float
    duration_low:         float
    duration_high:        float
    iterations_low:       int
    iterations_mid:       int
    iterations_high:      int
    monthly_cs_paid:      int


# ===========================================================================
# taxCalculationFormula.ts — lines 541–554
# formulaCalculateDurationLow / formulaCalculateDurationHigh
# ===========================================================================

def formula_calculate_duration_low(years_living_together: float, youngest_child: float) -> float:
    # Max(years living together * 0.5, 6 - youngest child's age)
    return max(years_living_together * 0.5, 6 - youngest_child)


def formula_calculate_duration_high(years_living_together: float, youngest_child: float) -> float:
    # Max(years living together * 1, 18 - youngest child's age)
    return max(years_living_together * 1, 18 - youngest_child)


# ===========================================================================
# taxCalculationFormula.ts — lines 557–564
# determineSpecialCase  (with children)
# ⚠️ Bug: missing `years >= 5` guard before Rule of 65 (per documentation)
# ===========================================================================

def determine_special_case(years_living_together: float, person_age_receiving_support: float) -> bool:
    return (
        years_living_together >= 20
        or years_living_together + person_age_receiving_support >= 65
    )


# ===========================================================================
# taxCalculationFormula.ts — lines 574–584
# determineSpecialCaseWithoutChildren
# ⚠️ Bug 1: uses party1_age (payor) instead of recipient age (per documentation)
# ⚠️ Bug 2: missing `years >= 5` guard before Rule of 65 (per documentation)
# ===========================================================================

def determine_special_case_without_children(party1_age: float, years_living_together: float) -> bool:
    # Frontend uses party1DateOfBirth = Party 1's age, NOT the recipient's age
    return (
        party1_age + years_living_together > 65
        or years_living_together > 20
    )


# ===========================================================================
# taxCalculationFormula.ts — lines 587–629
# formulaForCalculatingDurationOfSupport
# ===========================================================================

def formula_for_calculating_duration_of_support(
    years_living_together: float,   # pre-calculated from dateOfMarriage → dateOfSeparation
    has_children: bool,
    youngest_child_age: float,      # 0.0 if no children
    person_age_receiving_support: float,
    party1_age: float,              # used only in the without-children path (⚠️ see bug above)
) -> list[float]:
    """
    Returns [duration_low, duration_high].
    INDEFINITE_SENTINEL in either slot means indefinite.
    """
    duration_low  = INDEFINITE
    duration_high = INDEFINITE

    if has_children:
        is_special_case = determine_special_case(years_living_together, person_age_receiving_support)
        if not is_special_case:
            duration_low  = formula_calculate_duration_low(years_living_together, youngest_child_age)
            duration_high = formula_calculate_duration_high(years_living_together, youngest_child_age)
    else:
        is_special_case = determine_special_case_without_children(party1_age, years_living_together)
        if not is_special_case:
            duration_low  = years_living_together * 0.5
            duration_high = years_living_together * 1.0

    return [duration_low, duration_high]


# ===========================================================================
# taxCalculationFormula.ts — lines 815–832
# spousalSupportFormulaByRate  (with-children INDI formula)
# Used for low (0.40), mid (0.43), high (0.46)
# ===========================================================================

def spousal_support_formula_by_rate(
    household_income1: float,  # Payor disposable income (net − CS paid)
    household_income2: float,  # Recipient disposable income (net − notional CS)
    rate: float,
) -> float:
    # ((income1 + income2) * rate - min(income1, income2)) / 12
    val = round(
        ((household_income1 + household_income2) * rate
         - min(household_income1, household_income2))
        / 12,
        4,
    )
    return val if val > 0 else 0


# ===========================================================================
# taxCalculationFormula.ts — lines 834–857
# spousalSupportLowFormula / spousalSupportHighFormula
# (Hardcoded-rate wrappers — mid uses spousalSupportFormulaByRate(0.43))
# ===========================================================================

def spousal_support_low_formula(household_income1: float, household_income2: float) -> float:
    return spousal_support_formula_by_rate(household_income1, household_income2, 0.40)


def spousal_support_mid_formula(household_income1: float, household_income2: float) -> float:
    # No dedicated mid function in the TS — mid calls spousalSupportFormulaByRate(0.43)
    return spousal_support_formula_by_rate(household_income1, household_income2, 0.43)


def spousal_support_high_formula(household_income1: float, household_income2: float) -> float:
    return spousal_support_formula_by_rate(household_income1, household_income2, 0.46)


# ===========================================================================
# Screen2.ts — lines 682–694
# calculateLowMedHighOnWithoutChildren
# ===========================================================================

def calculate_low_med_high_on_without_children(years_living_together: float) -> dict:
    low  = min(0.015  * years_living_together, 0.5)
    med  = min(0.0175 * years_living_together, 0.5)
    high = min(0.02   * years_living_together, 0.5)
    return {"low": low, "med": med, "high": high}


# ===========================================================================
# Screen2.ts — lines 696–720
# calculateSpousalSupportAccToSalaryDiff  (without-children quantum)
# ===========================================================================

def calculate_spousal_support_acc_to_salary_diff(
    household_income1: float,   # Party 1 gross income
    household_income2: float,   # Party 2 gross income
    years_living_together: float,
) -> dict:
    gross_income_diff = abs(household_income1 - household_income2)
    pcts = calculate_low_med_high_on_without_children(years_living_together)

    low_support  = (pcts["low"]  * gross_income_diff) / 12
    med_support  = (pcts["med"]  * gross_income_diff) / 12
    high_support = (pcts["high"] * gross_income_diff) / 12

    return {
        "pct_low":      pcts["low"],
        "pct_med":      pcts["med"],
        "pct_high":     pcts["high"],
        "low_support":  low_support,
        "med_support":  med_support,
        "high_support": high_support,
    }


# ===========================================================================
# Screen2.ts — lines 736–744
# calculateDisposableIncome
# ===========================================================================

def calculate_disposable_income(
    taxable_income: float,
    total_taxes: float,
    total_benefits: float,
    child_support: float,   # annual CS *paid* by this party (0 if receiving)
) -> float:
    val = taxable_income - total_taxes + total_benefits - child_support
    return val if val > 0 else 0


# ===========================================================================
# Screen2.ts — lines 722–732
# limitForSpousalHighExceeded  (NDI 50% cap check)
# ===========================================================================

def limit_for_spousal_high_exceeded(
    disposable_income1: float,
    disposable_income2: float,
) -> float:
    return spousal_support_formula_by_rate(disposable_income1, disposable_income2, 0.5)


# ===========================================================================
# Private helpers — clean Python implementations
# ===========================================================================

def _applicable_percentages(years: float) -> tuple[float, float, float]:
    """
    SSAG without-child percentage ranges applied to net income difference.
    1.5% / 1.75% / 2.0% per year of cohabitation, capped at 50%.
    """
    low  = min(0.015  * years, 0.50)
    med  = min(0.0175 * years, 0.50)
    high = min(0.02   * years, 0.50)
    return low, med, high


def _duration(years: float, recipient_age: float) -> tuple[float, float, str]:
    """
    SSAG without-child duration rules.
    Indefinite if marriage >= 20 years OR (Rule of 65: years >= 5 AND recipient_age + years >= 65).
    Otherwise low = years * 0.5, high = years * 1.0.
    """
    rule_of_65    = years >= 5 and (recipient_age + years) >= 65
    long_marriage = years >= 20

    if rule_of_65 or long_marriage:
        return INDEFINITE_SENTINEL, INDEFINITE_SENTINEL, "Indefinite duration"

    dur_low  = round(years * 0.5, 1)
    dur_high = round(years * 1.0, 1)
    return dur_low, dur_high, f"{dur_low} – {dur_high} years"


def _duration_with_children(
    years: float,
    recipient_age: float,
    youngest_child_age: float,
) -> tuple[float, float, str]:
    """
    SSAG with-child duration rules (SSAG Chapter 8 / CloudAct frontend).

    Indefinite if:
      - marriage >= 20 years, OR
      - Rule of 65: years >= 5 AND recipient_age + years >= 65

    Otherwise (definite range):
      low  = max(years × 0.5, years until youngest child starts school (~age 6))
      high = max(years × 1.0, years until youngest child finishes secondary school (~age 18))
    """
    rule_of_65    = years >= 5 and (recipient_age + years) >= 65
    long_marriage = years >= 20

    if rule_of_65 or long_marriage:
        return INDEFINITE_SENTINEL, INDEFINITE_SENTINEL, "Indefinite duration"

    years_to_child_6  = max(0.0, round(6  - youngest_child_age, 1))
    years_to_child_18 = max(0.0, round(18 - youngest_child_age, 1))

    dur_low  = round(max(years * 0.5, years_to_child_6),  1)
    dur_high = round(max(years * 1.0, years_to_child_18), 1)

    if dur_low == dur_high:
        return dur_low, dur_high, f"{dur_low} years"
    return dur_low, dur_high, f"{dur_low} – {dur_high} years"


# ===========================================================================
# Iterative helper
# ===========================================================================

def _compute_net_indi(
    gross_income:            float,
    age:                     int,
    party_num:               int,
    children:                list,   # list of TaxChildInfo
    child_counts:            dict,   # {"party1": int, "party2": int, "shared": int}
    both_gross:              dict,   # {"party1": float, "party2": float}
    ss_paid_annual:          float,  # SS deduction for payor (0 for recipient)
    ss_received_annual:      float,  # SS income for recipient (0 for payor)
    cs_adjustment_annual:    float,  # actual CS paid (payor) OR notional CS (recipient)
    province:                str   = "ON",
    year:                    int   = 2025,
    # Deduction / income-type fields — default to 0 so existing callers are unaffected
    self_employed_income:    float = 0.0,
    other_income:            float = 0.0,
    child_care_expenses:     float = 0.0,
    other_deductions:        float = 0.0,
    eligible_for_disability: str   = "No",
) -> float:
    """
    Compute one party's INDI for one iteration step.

    INDI = net_income_after_tax − cs_adjustment

    Spousal support is tax-deductible for the payor and taxable for the
    recipient (post-1997 Ontario agreements).  Child support is NOT
    deductible / taxable — it affects INDI directly as a cash subtraction.

    Deduction fields default to 0, preserving the original behaviour when
    not supplied.  Pass non-zero values when the party has RRSP contributions,
    child care expenses, or other deductions that affect their net income.
    """
    inp = TaxInput(
        party_num               = party_num,
        province                = province,
        age                     = age,
        eligible_for_disability = eligible_for_disability,
        employed_income         = gross_income,
        self_employed_income    = self_employed_income,
        other_income            = other_income,
        support_received        = ss_received_annual,
        deductible_support_paid = ss_paid_annual,
        child_care_expenses     = child_care_expenses,
        other_deductions        = other_deductions,
        children                = children,
        type_of_splitting       = "SOLE",
        child_counts            = child_counts,
        child_support_amounts   = {},
        both_incomes            = both_gross,
        year                    = year,
    )
    # Suppress debug print statements inside tax.py
    with contextlib.redirect_stdout(io.StringIO()):
        result = calculate_taxes(inp)
    return result["net_income_after_tax"] - cs_adjustment_annual


# ===========================================================================
# Public API — without-child formula (clean Python)
# ===========================================================================

def calculate_spousal_support_no_children(
    party1_name:         str,
    party2_name:         str,
    party1_gross_income: float,   # annual gross income, CAD
    party2_gross_income: float,   # annual gross income, CAD
    years:               float,   # years of marriage / cohabitation
    recipient_age:       float,   # age of the lower-income spouse at separation
) -> SpousalSupportResult:
    """
    Calculate SSAG spousal support (without-child formula).

    Inputs are gross annual incomes. The higher-income party is the payor.
    Support quantum = applicable_percentage × gross_income_difference.
    Percentages: 1.5% / 1.75% / 2.0% per year, capped at 50%.
    """
    if years <= 0:
        raise ValueError("Years of marriage/cohabitation must be greater than 0.")
    if party1_gross_income < 0 or party2_gross_income < 0:
        raise ValueError("Incomes must be non-negative.")

    if party1_gross_income >= party2_gross_income:
        payor,      payor_gross = party1_name, party1_gross_income
        recipient,  recip_gross = party2_name, party2_gross_income
    else:
        payor,      payor_gross = party2_name, party2_gross_income
        recipient,  recip_gross = party1_name, party1_gross_income

    gross_diff = payor_gross - recip_gross

    pct_low, pct_med, pct_high = _applicable_percentages(years)

    monthly_low  = round((pct_low  * gross_diff) / 12, 2)
    monthly_med  = round((pct_med  * gross_diff) / 12, 2)
    monthly_high = round((pct_high * gross_diff) / 12, 2)

    annual_low  = round(pct_low  * gross_diff, 2)
    annual_med  = round(pct_med  * gross_diff, 2)
    annual_high = round(pct_high * gross_diff, 2)

    dur_low, dur_high, dur_label = _duration(years, recipient_age)

    return SpousalSupportResult(
        payor=payor,
        recipient=recipient,
        net_income_diff=round(gross_diff, 2),
        pct_low=round(pct_low  * 100, 2),
        pct_med=round(pct_med  * 100, 2),
        pct_high=round(pct_high * 100, 2),
        monthly_low=monthly_low,
        monthly_med=monthly_med,
        monthly_high=monthly_high,
        annual_low=annual_low,
        annual_med=annual_med,
        annual_high=annual_high,
        duration_low=dur_low,
        duration_high=dur_high,
        duration_label=dur_label,
    )


# Alias for backwards compatibility (test files import this name)
calculate_spousal_support = calculate_spousal_support_no_children


# ===========================================================================
# Public API — with-child formula (clean Python, non-iterative)
# ===========================================================================

def calculate_spousal_support_with_children(
    party1_name:                    str,
    party2_name:                    str,
    party1_net_income:              float,  # annual after-tax income (before CS adjustment), CAD
    party2_net_income:              float,  # annual after-tax income (before CS adjustment), CAD
    monthly_child_support:          float,  # Table CS paid by payor (monthly)
    monthly_notional_child_support: float,  # Hypothetical CS recipient would owe if roles reversed (monthly)
    years:                          float,  # years of marriage / cohabitation
    recipient_age:                  float,  # age of the lower-income spouse at separation
    youngest_child_age:             float,  # age of the youngest child at separation
) -> SpousalSupportResult:
    """
    Calculate SSAG spousal support (with-child formula, INDI approach).

    Implements the Individual Net Disposable Income (INDI) method per SSAG
    Chapter 8 and CloudAct documentation:

      Payor INDI  (F1) = payor net income − child support paid
      Recipient INDI (F2) = recipient net income − notional child support
                             (notional CS = hypothetical table amount the
                              recipient would owe if roles were reversed)
      Combined INDI (G) = F1 + F2

      Support low   = 40% × G − F2   →  recipient retains 40% of G
      Support mid   = 43% × G − F2   →  recipient retains 43% of G
      Support high  = 46% × G − F2   →  recipient retains 46% of G

    Net incomes are after tax and government benefits/credits, but before
    any child support or spousal support adjustments. Use
    calculate_spousal_support_iterative() when you need the full tax
    interaction to be modelled.
    """
    if years <= 0:
        raise ValueError("Years of marriage/cohabitation must be greater than 0.")
    if party1_net_income < 0 or party2_net_income < 0:
        raise ValueError("Incomes must be non-negative.")
    if monthly_child_support < 0:
        raise ValueError("Monthly child support must be non-negative.")
    if monthly_notional_child_support < 0:
        raise ValueError("Monthly notional child support must be non-negative.")
    if youngest_child_age < 0:
        raise ValueError("Youngest child age must be non-negative.")

    # Determine payor / recipient by unadjusted net income
    if party1_net_income >= party2_net_income:
        payor,     payor_net = party1_name, party1_net_income
        recipient, recip_net = party2_name, party2_net_income
    else:
        payor,     payor_net = party2_name, party2_net_income
        recipient, recip_net = party1_name, party1_net_income

    # Compute Individual Net Disposable Incomes (INDI)
    payor_indi    = payor_net - (monthly_child_support          * 12)
    recip_indi    = recip_net - (monthly_notional_child_support * 12)
    combined_indi = payor_indi + recip_indi

    # SSAG with-child percentages: 40% / 43% / 46%
    pct_low  = 0.40
    pct_med  = 0.43
    pct_high = 0.46

    # Support = pct × combined_INDI − recipient_INDI
    annual_low  = round(max(pct_low  * combined_indi - recip_indi, 0.0), 2)
    annual_med  = round(max(pct_med  * combined_indi - recip_indi, 0.0), 2)
    annual_high = round(max(pct_high * combined_indi - recip_indi, 0.0), 2)

    monthly_low  = round(annual_low  / 12, 2)
    monthly_med  = round(annual_med  / 12, 2)
    monthly_high = round(annual_high / 12, 2)

    dur_low, dur_high, dur_label = _duration_with_children(
        years, recipient_age, youngest_child_age
    )

    return SpousalSupportResult(
        payor=payor,
        recipient=recipient,
        net_income_diff=round(payor_indi - recip_indi, 2),
        pct_low=round(pct_low  * 100, 2),
        pct_med=round(pct_med  * 100, 2),
        pct_high=round(pct_high * 100, 2),
        monthly_low=monthly_low,
        monthly_med=monthly_med,
        monthly_high=monthly_high,
        annual_low=annual_low,
        annual_med=annual_med,
        annual_high=annual_high,
        duration_low=dur_low,
        duration_high=dur_high,
        duration_label=dur_label,
    )


# ===========================================================================
# Public API — with-child formula (iterative, full tax convergence)
# ===========================================================================

def calculate_spousal_support_iterative(
    payor_gross:            float,
    recipient_gross:        float,
    payor_age:              int,
    recipient_age:          int,
    years:                  float,
    children:               list,            # list of TaxChildInfo
    child_counts:           dict,            # {"party1": int, "party2": int, "shared": int}
    monthly_cs_paid:        float  = -1,     # -1 = compute from children via Schedule I
    monthly_notional_cs:    float  = -1,     # -1 = compute from children via Schedule I
    youngest_child_age:     float  = 0.0,
    province:               str    = "ON",
    year:                   int    = 2025,
    max_iter:               int    = 50,
    tol:                    float  = 0.01,
    payor_is_party1:        bool   = True,   # True when payor is the original UI "Party 1"
    # Deduction / income-type fields for each party — default to 0/No
    payor_self_employed_income:    float = 0.0,
    payor_other_income:            float = 0.0,
    payor_child_care_expenses:     float = 0.0,
    payor_other_deductions:        float = 0.0,
    payor_eligible_for_disability: str   = "No",
    recip_self_employed_income:    float = 0.0,
    recip_other_income:            float = 0.0,
    recip_child_care_expenses:     float = 0.0,
    recip_other_deductions:        float = 0.0,
    recip_eligible_for_disability: str   = "No",
) -> IterativeResult:
    """
    SSAG with-children spousal support via iterative INDI convergence.

    For each rate (40%, 43%, 46%) independently:
      Step 0  — start with SS = 0
      Step N  — compute both INDIs at current SS level (SS affects taxes)
              — recompute SS from spousal_support_formula_by_rate(INDI1, INDI2, rate)
              — stop when |new_SS − old_SS| < tol (dollars/month)

    Uses damped fixed-point iteration (alpha=0.5) to prevent oscillation.
    Converges in ~6 steps per rate for typical inputs.

    Because each rate converges to a different SS amount (which produces
    different tax positions), the INDI values differ across the three
    scenarios — matching the Excel iterative behaviour.
    """
    if monthly_cs_paid == -1 or monthly_notional_cs == -1:
        minor_total       = child_counts["party1"] + child_counts["party2"] + child_counts["shared"]
        type_of_splitting = determine_type_of_splitting(child_counts, minor_total) if minor_total > 0 else "SEPARATED"
        # Convert TaxChildInfo → CSChildInfo so calculate_child_support can access .csg_table etc.
        cs_children = [
            CSChildInfo(
                name                  = getattr(c, "name", ""),
                csg_table             = getattr(c, "csg_table", "No"),
                child_support_override= float(getattr(c, "child_support_override", 0)),
                custody_arrangement   = c.custody_arrangement,
            )
            for c in children
        ]
        # Pass incomes in ORIGINAL party order so custody_arrangement
        # ("Party 1" / "Party 2") lines up with the correct income.
        p1_income = payor_gross     if payor_is_party1 else recipient_gross
        p2_income = recipient_gross if payor_is_party1 else payor_gross
        cs_result         = calculate_child_support(
            children=cs_children,
            party1_guideline_income=p1_income,
            party2_guideline_income=p2_income,
            party1_province=province,
            party2_province=province,
            type_of_splitting=type_of_splitting,
            child_counts=child_counts,
            schedule_i_data=_SCHEDULE_I,
        )
        cs_ref       = cs_result["child_support_ref"]
        notional_ref = cs_result["notional_amount_ref"]
        # Pick the payor's CS obligation from the result using the original party key
        payor_party_key = "party1" if payor_is_party1 else "party2"
        recip_party_key = "party2" if payor_is_party1 else "party1"
        if monthly_cs_paid == -1:
            monthly_cs_paid  = cs_ref[payor_party_key]
        if monthly_notional_cs == -1:
            monthly_notional_cs = notional_ref[recip_party_key]
    cs_annual       = monthly_cs_paid    * 12
    notional_annual = monthly_notional_cs * 12
    both_gross      = {"party1": payor_gross, "party2": recipient_gross}

    rate_results: dict = {}

    for rate, label in [(0.40, "low"), (0.43, "mid"), (0.46, "high")]:
        ss         = 0.0
        payor_indi = 0.0
        recip_indi = 0.0
        iters      = 0

        for i in range(max_iter):
            ss_annual = ss * 12

            payor_indi = _compute_net_indi(
                gross_income             = payor_gross,
                age                      = payor_age,
                party_num                = 1,
                children                 = children,
                child_counts             = child_counts,
                both_gross               = both_gross,
                ss_paid_annual           = ss_annual,
                ss_received_annual       = 0.0,
                cs_adjustment_annual     = cs_annual,
                province                 = province,
                year                     = year,
                self_employed_income     = payor_self_employed_income,
                other_income             = payor_other_income,
                child_care_expenses      = payor_child_care_expenses,
                other_deductions         = payor_other_deductions,
                eligible_for_disability  = payor_eligible_for_disability,
            )

            recip_indi = _compute_net_indi(
                gross_income             = recipient_gross,
                age                      = recipient_age,
                party_num                = 2,
                children                 = children,
                child_counts             = child_counts,
                both_gross               = both_gross,
                ss_paid_annual           = 0.0,
                ss_received_annual       = ss_annual,
                cs_adjustment_annual     = notional_annual,
                province                 = province,
                year                     = year,
                self_employed_income     = recip_self_employed_income,
                other_income             = recip_other_income,
                child_care_expenses      = recip_child_care_expenses,
                other_deductions         = recip_other_deductions,
                eligible_for_disability  = recip_eligible_for_disability,
            )

            new_ss = spousal_support_formula_by_rate(payor_indi, recip_indi, rate)

            iters = i + 1
            if abs(new_ss - ss) < tol:
                ss = new_ss
                break
            # Damped update: average old and new estimate to prevent oscillation.
            # Without damping the loop alternates high/low (derivative ≈ -1) and
            # takes ~200 steps; damping converges in ~6 steps.
            ss = 0.5 * ss + 0.5 * new_ss

        rate_results[label] = {
            "monthly":    round(ss, 2),
            "payor_indi": round(payor_indi, 2),
            "recip_indi": round(recip_indi, 2),
            "iters":      iters,
        }

    dur = formula_for_calculating_duration_of_support(
        years_living_together        = years,
        has_children                 = True,
        youngest_child_age           = youngest_child_age,
        person_age_receiving_support = recipient_age,
        party1_age                   = payor_age,
    )

    return IterativeResult(
        monthly_low          = rate_results["low"]["monthly"],
        monthly_mid          = rate_results["mid"]["monthly"],
        monthly_high         = rate_results["high"]["monthly"],
        annual_low           = round(rate_results["low"]["monthly"]  * 12, 2),
        annual_mid           = round(rate_results["mid"]["monthly"]  * 12, 2),
        annual_high          = round(rate_results["high"]["monthly"] * 12, 2),
        payor_indi_low       = rate_results["low"]["payor_indi"],
        recipient_indi_low   = rate_results["low"]["recip_indi"],
        payor_indi_mid       = rate_results["mid"]["payor_indi"],
        recipient_indi_mid   = rate_results["mid"]["recip_indi"],
        payor_indi_high      = rate_results["high"]["payor_indi"],
        recipient_indi_high  = rate_results["high"]["recip_indi"],
        duration_low         = dur[0],
        duration_high        = dur[1],
        iterations_low       = rate_results["low"]["iters"],
        iterations_mid       = rate_results["mid"]["iters"],
        iterations_high      = rate_results["high"]["iters"],
        monthly_cs_paid      = monthly_cs_paid,
    )


# def calculate_spousal_support_iterative(
#     payor_gross:            float,
#     recipient_gross:        float,
#     payor_age:              int,
#     recipient_age:          int,
#     years:                  float,
#     children:               list,   # list of TaxChildInfo
#     child_counts:           dict,   # {"party1": int, "party2": int, "shared": int}
#     monthly_cs_paid:        float,  # Table CS paid by payor
#     monthly_notional_cs:    float,  # Notional CS (what recipient would owe)
#     youngest_child_age:     float,
#     province:               str = "ON",
#     year:                   int = 2025,
#     max_iter:               int = 50,
#     tol:                    float = 0.01,
# ) -> IterativeResult:
#     """
#     SSAG with-children spousal support via iterative INDI convergence.

#     For each rate (40%, 43%, 46%) independently:
#       Step 0  — start with SS = 0
#       Step N  — compute both INDIs at current SS level (SS affects taxes)
#               — recompute SS from spousal_support_formula_by_rate(INDI1, INDI2, rate)
#               — stop when |new_SS − old_SS| < tol (dollars/month)

#     Uses damped fixed-point iteration (alpha=0.5) to prevent oscillation.
#     Converges in ~6 steps per rate for typical inputs.

#     Because each rate converges to a different SS amount (which produces
#     different tax positions), the INDI values differ across the three
#     scenarios — matching the Excel iterative behaviour.
#     """
#     cs_annual       = monthly_cs_paid    * 12
#     notional_annual = monthly_notional_cs * 12
#     both_gross      = {"party1": payor_gross, "party2": recipient_gross}

#     rate_results: dict = {}

#     for rate, label in [(0.40, "low"), (0.43, "mid"), (0.46, "high")]:
#         ss         = 0.0
#         payor_indi = 0.0
#         recip_indi = 0.0
#         iters      = 0

#         for i in range(max_iter):
#             ss_annual = ss * 12

#             payor_indi = _compute_net_indi(
#                 gross_income         = payor_gross,
#                 age                  = payor_age,
#                 party_num            = 1,
#                 children             = children,
#                 child_counts         = child_counts,
#                 both_gross           = both_gross,
#                 ss_paid_annual       = ss_annual,
#                 ss_received_annual   = 0.0,
#                 cs_adjustment_annual = cs_annual,
#                 province             = province,
#                 year                 = year,
#             )

#             recip_indi = _compute_net_indi(
#                 gross_income         = recipient_gross,
#                 age                  = recipient_age,
#                 party_num            = 2,
#                 children             = children,
#                 child_counts         = child_counts,
#                 both_gross           = both_gross,
#                 ss_paid_annual       = 0.0,
#                 ss_received_annual   = ss_annual,
#                 cs_adjustment_annual = notional_annual,
#                 province             = province,
#                 year                 = year,
#             )

#             new_ss = spousal_support_formula_by_rate(payor_indi, recip_indi, rate)

#             iters = i + 1
#             if abs(new_ss - ss) < tol:
#                 ss = new_ss
#                 break
#             # Damped update: average old and new estimate to prevent oscillation.
#             # Without damping the loop alternates high/low (derivative ≈ -1) and
#             # takes ~200 steps; damping converges in ~6 steps.
#             ss = 0.5 * ss + 0.5 * new_ss

#         rate_results[label] = {
#             "monthly":    round(ss, 2),
#             "payor_indi": round(payor_indi, 2),
#             "recip_indi": round(recip_indi, 2),
#             "iters":      iters,
#         }

#     dur = formula_for_calculating_duration_of_support(
#         years_living_together        = years,
#         has_children                 = True,
#         youngest_child_age           = youngest_child_age,
#         person_age_receiving_support = recipient_age,
#         party1_age                   = payor_age,
#     )

#     return IterativeResult(
#         monthly_low          = rate_results["low"]["monthly"],
#         monthly_mid          = rate_results["mid"]["monthly"],
#         monthly_high         = rate_results["high"]["monthly"],
#         annual_low           = round(rate_results["low"]["monthly"]  * 12, 2),
#         annual_mid           = round(rate_results["mid"]["monthly"]  * 12, 2),
#         annual_high          = round(rate_results["high"]["monthly"] * 12, 2),
#         payor_indi_low       = rate_results["low"]["payor_indi"],
#         recipient_indi_low   = rate_results["low"]["recip_indi"],
#         payor_indi_mid       = rate_results["mid"]["payor_indi"],
#         recipient_indi_mid   = rate_results["mid"]["recip_indi"],
#         payor_indi_high      = rate_results["high"]["payor_indi"],
#         recipient_indi_high  = rate_results["high"]["recip_indi"],
#         duration_low         = dur[0],
#         duration_high        = dur[1],
#         iterations_low       = rate_results["low"]["iters"],
#         iterations_mid       = rate_results["mid"]["iters"],
#         iterations_high      = rate_results["high"]["iters"],
#     )


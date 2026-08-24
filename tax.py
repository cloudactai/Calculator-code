"""
tax.py
------
Canadian income-tax + benefits calculator supporting Ontario (ON),
British Columbia (BC), Alberta (AB), Saskatchewan (SK), and Manitoba (MB).

Year-variable constants (bracket tables, indexed amounts, etc.) are stored in
tax_constants.json and loaded at import time.  To update for a new tax year:

    1. Add a new top-level key (e.g. "2026") to tax_constants.json.
    2. Copy the "2025" block, then change every value that was updated by CRA /
       the province for that year.  The key names and JSON structure must stay
       the same — only the values change.

Public API
----------
    result = calculate_taxes(inp)            # TaxInput dataclass
    result = calculate_taxes_from_input(inp) # alias

Notes on Excel parity (2025):
    - Ontario tax reduction IS applied inside provincial_tax
      (max(2*(base+dep) - on_tax, 0) subtracted before LIFT).
    - Ontario LIFT credit IS applied inside provincial_tax.
    - CWB IS subtracted from total_taxes.
    - CCB / GST / OCB / OSTC all use taxable income (line 23600 net
      income) as their base, matching the Excel reference cell F23/G23.
"""

from __future__ import annotations
import json
import os
from dataclasses import dataclass
from datetime import date


# ===========================================================================
# LOAD YEAR-VARIABLE CONSTANTS FROM JSON (fallback)
# ===========================================================================

_CONSTANTS_PATH = os.path.join(os.path.dirname(__file__), "tax_constants.json")
with open(_CONSTANTS_PATH) as _f:
    _ALL_YEAR_CONSTANTS: dict = json.load(_f)


# ===========================================================================
# DATABASE CONNECTION (optional — falls back to JSON if unavailable)
# ===========================================================================

_DATABASE_URL = os.environ.get("DATABASE_URL")


def _fetch_from_db(year: int) -> dict | None:
    """Try to load constants for *year* from the TaxConstant table."""
    if not _DATABASE_URL:
        return None
    try:
        import psycopg2
        conn = psycopg2.connect(_DATABASE_URL, connect_timeout=5)
        try:
            cur = conn.cursor()
            cur.execute(
                'SELECT data FROM "TaxConstant" WHERE year = %s',
                (year,),
            )
            row = cur.fetchone()
            if row:
                data = row[0]
                return data if isinstance(data, dict) else json.loads(data)
        finally:
            conn.close()
    except Exception as exc:
        print(f"[tax.py] DB lookup failed for year {year}: {exc}")
    return None


def get_year_constants(year: int) -> dict:
    """
    Return the constants dict for *year*.
    Tries the database first, then falls back to the JSON file.
    """
    db_result = _fetch_from_db(year)
    if db_result is not None:
        print(f"[tax.py] Loaded constants for year {year} from database")
        return db_result

    print(f"[tax.py] DB fetch failed or unavailable for year {year}, falling back to JSON")
    key = str(year)
    if key in _ALL_YEAR_CONSTANTS:
        return _ALL_YEAR_CONSTANTS[key]
    best = max(_ALL_YEAR_CONSTANTS.keys())
    return _ALL_YEAR_CONSTANTS[best]


# ===========================================================================
# SECTION B — FIXED / STRUCTURAL  (only change if Parliament amends the Act)
# ===========================================================================

# --------------------------------------------------------------------------
# B1. CPP RATES AND FIXED PARAMETERS
# --------------------------------------------------------------------------
BASE_CPP_RATE                   = 0.0495   # 4.95%; CPP Act Schedule 2
BASE_CPP_EXEMPTION              = 3_500.00  # basic yearly exemption; fixed by regulation
ENHANCED_CPP_RATE               = 0.01     # 1%; CPP Act
CPP2_RATE                       = 0.04     # 4%; CPP Act Schedule 2
SELF_EMPLOYED_ENH_CPP_RATE      = 0.119    # 2 × (4.95% + 1%) = 11.9%
CPP2_SELF_EMPLOYED_RATE         = 0.08     # 2 × 4% = 8%

# --------------------------------------------------------------------------
# B2. ONTARIO PROVINCIAL CREDIT RATE AND AGE-AMOUNT PHASE-OUT RATES
# --------------------------------------------------------------------------
ON_CREDIT_RATE                  = 0.0505   # lowest Ontario bracket rate
AGE_AMOUNT_RATE                 = 0.15     # federal age-amount phase-out rate; fixed in ITA
ON_AGE_AMOUNT_RATE              = 0.15     # Ontario age-amount phase-out rate; fixed in Taxation Act
ON_LIFT_REDUCTION_RATE          = 0.05     # LIFT phase-out rate; fixed in ON428
ON_LIFT_RATE                    = 0.0505   # = ON_CREDIT_RATE; kept separate for clarity

# --------------------------------------------------------------------------
# B2b. BC PROVINCIAL CREDIT RATE AND TAX REDUCTION RATE
# --------------------------------------------------------------------------
BC_CREDIT_RATE                  = 0.0506   # lowest BC bracket rate
BC_AGE_AMOUNT_RATE              = 0.15     # BC age-amount phase-out rate
BC_TAX_REDUCTION_INCOME_RATE    = 0.0356   # income-dependent component of BC tax reduction
BC_CHILD_BENEFIT_REDUCTION_RATE = 0.04     # BC child benefit clawback rate
BC_CLIMATE_ACTION_REDUCTION     = 0.02     # BC climate action credit clawback rate

# --------------------------------------------------------------------------
# B2c. ALBERTA PROVINCIAL CREDIT RATE
# --------------------------------------------------------------------------
AB_AGE_AMOUNT_RATE              = 0.15     # Alberta age-amount phase-out rate

# --------------------------------------------------------------------------
# B2d. ACFB (Alberta Child and Family Benefit) REDUCTION RATES
#      These are structural (set by regulation, not indexed).
# --------------------------------------------------------------------------
ACFB_BASE_REDUCTION_RATES   = {1: 0.0805, 2: 0.1407, 3: 0.1609, 4: 0.2011}
ACFB_WORKING_REDUCTION_RATES = {1: 0.034, 2: 0.0649, 3: 0.0834, 4: 0.0895}
ACFB_WORKING_PHASE_IN_RATE  = 0.15  # working component phase-in rate

# --------------------------------------------------------------------------
# B2e. SASKATCHEWAN PROVINCIAL RATES
# --------------------------------------------------------------------------
SK_AGE_AMOUNT_RATE              = 0.15     # SK age-amount phase-out rate
SK_SLITC_REDUCTION_RATE         = 0.02     # SLITC phase-out rate

# --------------------------------------------------------------------------
# B2f. MANITOBA PROVINCIAL RATES
# --------------------------------------------------------------------------
MB_AGE_AMOUNT_RATE              = 0.15     # MB age-amount phase-out rate

# --------------------------------------------------------------------------
# B3. ONTARIO SURTAX RATES
# --------------------------------------------------------------------------
ON_SURTAX_RATE_1                = 0.20     # 20%; Taxation Act (unchanged since 2003)
ON_SURTAX_RATE_2                = 0.36     # 36%; Taxation Act (unchanged since 2003)

# --------------------------------------------------------------------------
# B4. CWB RATES
# --------------------------------------------------------------------------
CWB_RATE                        = 0.21     # phase-in rate; ITA Schedule 6
CWB_INCOME_FLOOR                = 3_000.00  # minimum earned income; fixed in ITA
CWB_REDUCTION_RATE              = 0.15     # phase-out rate; ITA Schedule 6
CWB_DISAB_BASE_PERCENT          = 0.27     # disability supplement phase-in rate
CWB_DISAB_RED_RATE_SINGLE       = 0.15     # disability phase-out rate (single)
CWB_DISAB_RED_RATE_FAMILY       = 0.15     # disability phase-out rate (family)

# --------------------------------------------------------------------------
# B5. CCB PHASE-OUT RATES  (ITA s.122.61; unchanged since CCB launch 2016)
# --------------------------------------------------------------------------
CCB_RATE_1_PHASE1               = 0.070
CCB_RATE_2_PHASE1               = 0.135
CCB_RATE_3_PHASE1               = 0.190
CCB_RATE_4_PHASE1               = 0.230
CCB_RATE_1_PHASE2               = 0.032
CCB_RATE_2_PHASE2               = 0.057
CCB_RATE_3_PHASE2               = 0.080
CCB_RATE_4_PHASE2               = 0.095

# --------------------------------------------------------------------------
# B6. GST/HST CLAWBACK RATE  (fixed at 5% in ITA s.122.5)
# --------------------------------------------------------------------------
GST_CLAWBACK_RATE               = 0.05

# --------------------------------------------------------------------------
# B7. OCB AND OSTC REDUCTION RATES  (fixed in Ontario regulations)
# --------------------------------------------------------------------------
OCB_REDUCTION_RATE              = 0.08
OSTC_REDUCTION_RATE             = 0.04


# ===========================================================================
# DATA CLASSES
# ===========================================================================

@dataclass
class ChildInfo:
    date_of_birth: str        # "YYYY-MM-DD"
    custody_arrangement: str  # "Party 1" | "Party 2" | "Shared"
    child_has_disability: str # "Yes" | "No"


@dataclass
class TaxInput:
    """
    Personal and income inputs for one party.
    Year-variable constants are loaded from tax_constants.json.
    """
    party_num: int
    province: str               # "ON"
    age: int
    eligible_for_disability: str  # "Yes" | "No"

    employed_income: float
    self_employed_income: float
    other_income: float

    support_received: float
    deductible_support_paid: float

    child_care_expenses: float
    other_deductions: float

    children: list[ChildInfo]
    type_of_splitting: str
    child_counts: dict          # {party1, party2, shared}

    child_support_amounts: dict # {party1, party2}
    both_incomes: dict          # {party1, party2}

    year: int = 2025


# ===========================================================================
# HELPERS
# ===========================================================================

def _find_bracket(brackets: list[dict], income: float) -> dict:
    for row in brackets:
        if row["From"] <= income <= row["To"]:
            return row
    raise ValueError(f"No bracket for income={income:,.2f}")


def _child_age(dob: str, year: int) -> int:
    """Age in years as of Jan 1 of tax year."""
    return year - int(dob[:4])


def _party_children(
    children: list[ChildInfo],
    party_num: int,
    children_live_with: int,
) -> list[ChildInfo]:
    """Children that belong to this party for credit/benefit purposes."""
    if children_live_with == party_num:
        return children
    if children_live_with == 4:
        tag = f"Party {party_num}"
        return [c for c in children if c.custody_arrangement == tag]
    return []


# ===========================================================================
# INCOME
# ===========================================================================

def calculate_taxable_income(
    employed_income: float,
    self_employed_income: float,
    other_income: float,
    support_received: float,
    deductible_support_paid: float,
    child_care_expenses: float,
    other_deductions: float,
    year: int = 2025,
) -> float:
    """
    Taxable income = gross + support_received − deductions.
    Deductions: support paid + enhanced CPP + child care (capped) + other.
    """
    gross = employed_income + self_employed_income + other_income
    enhanced = _enhanced_cpp_deduction(employed_income, self_employed_income, year)
    child_care_cap = _child_care_deduction(employed_income, child_care_expenses)
    total_deductions = (
        deductible_support_paid + enhanced + child_care_cap + other_deductions
    )
    return gross + support_received - total_deductions


# ===========================================================================
# CPP / EI  (internal)
# ===========================================================================

def _base_cpp(employed_income: float, self_employed_income: float, c: dict) -> float:
    return max(
        min(
            (employed_income + self_employed_income - BASE_CPP_EXEMPTION) * BASE_CPP_RATE,
            c["BASE_CPP_LIMIT"],
        ),
        0.0,
    )


def _ei(employed_income: float, c: dict) -> float:
    return min(employed_income * c["EI_RATE"], c["EI_LIMIT"])


def _enhanced_cpp_deduction(
    employed_income: float,
    self_employed_income: float,
    year: int = 2025,
) -> float:
    """Enhanced CPP1 + CPP2 deduction."""
    c = get_year_constants(year)
    if employed_income > 0:
        if employed_income <= c["CPP2_PEN_EARNING"]:
            cpp2 = 0.0
        elif employed_income > c["CPP2_MAX_PEN_EARNING"]:
            cpp2 = c["CPP2_MAX_AMT"]
        else:
            cpp2 = (employed_income - c["CPP2_PEN_EARNING"]) * CPP2_RATE
        enhanced = max(
            min(
                (employed_income - BASE_CPP_EXEMPTION) * ENHANCED_CPP_RATE,
                c["ENHANCED_CPP_LIMIT"],
            ),
            0.0,
        )
        return enhanced + cpp2

    if self_employed_income > 0:
        if self_employed_income <= c["CPP2_PEN_EARNING"]:
            cpp2 = 0.0
        elif self_employed_income > c["CPP2_MAX_PEN_EARNING"]:
            cpp2 = c["CPP2_SELF_EMPLOYED_MAX"]
        else:
            cpp2 = (self_employed_income - c["CPP2_PEN_EARNING"]) * CPP2_SELF_EMPLOYED_RATE
        se_base = (
            min(self_employed_income, c["SELF_EMPLOYED_ENH_CPP_THRESHOLD"]) - BASE_CPP_EXEMPTION
        ) * SELF_EMPLOYED_ENH_CPP_RATE
        base_cpp = _base_cpp(employed_income, self_employed_income, c)
        return se_base - base_cpp + cpp2

    return 0.0


def _child_care_deduction(employed_income: float, child_care_expenses: float) -> float:
    if child_care_expenses > 0:
        return min(employed_income * (2 / 3), child_care_expenses)
    return 0.0


def calculate_cpp_ei_deductions(
    employed_income: float,
    self_employed_income: float,
    year: int = 2025,
) -> float:
    """Total CPP + EI payroll deductions (cash outflows)."""
    c = get_year_constants(year)
    if employed_income > 0 or self_employed_income > 0:
        return (
            _ei(employed_income, c)
            + _base_cpp(employed_income, self_employed_income, c)
            + _enhanced_cpp_deduction(employed_income, self_employed_income, year)
        )
    return 0.0


# ===========================================================================
# FEDERAL TAX
# ===========================================================================

def _bpa_federal(taxable_income: float, c: dict) -> float:
    if taxable_income <= c["BPA_FED_THRESHOLD_LOW"]:
        return c["BASIC_PERSONAL_AMOUNT_FED"]
    if taxable_income > c["BPA_FED_THRESHOLD_HIGH"]:
        return c["BASIC_PERSONAL_AMOUNT_FED_MIN"]
    phase_in = (
        max(c["BPA_FED_THRESHOLD_HIGH"] - taxable_income, 0.0) / c["BPA_FED_PHASE_RANGE"]
    )
    return c["BASIC_PERSONAL_AMOUNT_FED_MIN"] + phase_in * (
        c["BASIC_PERSONAL_AMOUNT_FED"] - c["BASIC_PERSONAL_AMOUNT_FED_MIN"]
    )


def _age_amount_federal(age: int, taxable_income: float, c: dict) -> float:
    if age >= 65:
        return max(
            c["AGE_AMOUNT_BASE"]
            - max(taxable_income - c["AGE_AMOUNT_LOWER_THRESHOLD"], 0) * AGE_AMOUNT_RATE,
            0.0,
        )
    return 0.0


def _canada_employment_amount(employed_income: float, c: dict) -> float:
    return (
        min(c["CANADA_EMPLOYMENT_AMOUNT_LIMIT"], employed_income)
        if employed_income > 0 else 0.0
    )


def _eligible_dependent_federal(
    party_num: int, children_live_with: int, bpa_fed: float
) -> float:
    if (
        (party_num == 1 and children_live_with == 1)
        or (party_num == 2 and children_live_with == 2)
        or children_live_with == 4
    ):
        return bpa_fed
    return 0.0


def _total_federal_credits(
    total_income: float,
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    has_disability: bool,
    c: dict,
    year: int,
) -> float:
    bpa = _bpa_federal(taxable_income, c)
    print(
        f"bpa: {bpa} \nage amount: {_age_amount_federal(age, taxable_income, c)}\n"
        f" eligible dep {_eligible_dependent_federal(party_num, children_live_with, bpa)}"
    )
    print(
        f"bascpp: {_base_cpp(employed_income, self_employed_income, c)}\n"
        f" ei:{_ei(employed_income, c)}\n"
        f" canada employment amount {_canada_employment_amount(employed_income, c)}"
    )
    print(f"disability: {(c['DISABILITY_AMOUNT_FED'] if has_disability else 0.0)}")
    return (
        bpa
        + _age_amount_federal(age, taxable_income, c)
        + _eligible_dependent_federal(party_num, children_live_with, bpa)
        + _base_cpp(employed_income, self_employed_income, c)
        + _ei(employed_income, c)
        + _canada_employment_amount(employed_income, c)
        + (c["DISABILITY_AMOUNT_FED"] if has_disability else 0.0)
    )


def calculate_federal_tax(
    taxable_income: float,
    total_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    has_disability: bool,
    c: dict,
    year: int,
) -> float:
    """Federal tax after non-refundable credits."""
    row = _find_bracket(c["FEDERAL_BRACKETS"], taxable_income)
    credits = _total_federal_credits(
        total_income, taxable_income, employed_income, self_employed_income,
        age, party_num, children_live_with, has_disability, c, year,
    )
    tax = (
        row["Basic"]
        + (taxable_income - row["Income_over"]) * row["Rate"]
        - credits * c["FEDERAL_CREDIT_RATE"]
    )
    return max(tax, 0.0)


# ===========================================================================
# ONTARIO PROVINCIAL TAX
# ===========================================================================

def _eligible_dependent_ontario(party_num: int, children_live_with: int, c: dict) -> float:
    if (
        (party_num == 1 and children_live_with == 1)
        or (party_num == 2 and children_live_with == 2)
        or children_live_with == 4
    ):
        return c["AMOUNT_FOR_ELIGIBLE_DEPENDENT_ON"]
    return 0.0


def _age_amount_ontario(age: int, taxable_income: float, c: dict) -> float:
    if age >= 65:
        return max(
            c["ON_AGE_AMOUNT_BASE"]
            - max(taxable_income - c["ON_AGE_AMOUNT_THRESHOLD"], 0) * ON_AGE_AMOUNT_RATE,
            0.0,
        )
    return 0.0


def _total_ontario_credits(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    has_disability: bool,
    c: dict,
) -> float:
    return (
        c["BASIC_PERSONAL_AMOUNT_ON"]
        + _eligible_dependent_ontario(party_num, children_live_with, c)
        + _age_amount_ontario(age, taxable_income, c)
        + _base_cpp(employed_income, self_employed_income, c)
        + _ei(employed_income, c)
        + (c["DISABILITY_AMOUNT_ON"] if has_disability else 0.0)
    )


def _on_surtax(ontario_tax: float, c: dict) -> float:
    tier1 = max((ontario_tax - c["ON_SURTAX_THRESHOLD_1"]) * ON_SURTAX_RATE_1, 0.0)
    tier2 = max((ontario_tax - c["ON_SURTAX_THRESHOLD_2"]) * ON_SURTAX_RATE_2, 0.0)
    return tier1 + tier2


def _on_lift(employed_income: float, taxable_income: float, c: dict) -> float:
    return round(
        max(
            max(min(employed_income * ON_LIFT_RATE, c["ON_LIFT_MAX"]), 0.0)
            - max(taxable_income - c["ON_LIFT_INDIVIDUAL_THRESHOLD"], 0.0) * ON_LIFT_REDUCTION_RATE,
            0.0,
        ),
        4,
    )


def _on_health_premium(taxable_income: float, c: dict) -> float:
    row = _find_bracket(c["ON_HEALTH"], taxable_income)
    return row["Basic"] + (taxable_income - row["Income_over"]) * row["Rate"]


def calculate_ontario_tax(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    num_children: int,
    has_disability: bool,
    c: dict,
) -> float:
    """
    Ontario tax pipeline — matches Excel "Screen 2 -WithoutSplexp (2)" 2025:
      1. Basic ON tax = bracket_tax − credits × 5.05%  (Line 61)
      2. + surtax                                       (Line 68)
      3. − Ontario tax reduction  max(2*(base+dep) − tax, 0)   (Line 80)
         → capped at 0 before next step                 (Line 81/83)
      4. − LIFT credit                                  (Line 85/86)
         → capped at 0 before next step
      5. + health premium                               (Line 89)
    """
    prov_row = _find_bracket(c["ON_BRACKETS"], taxable_income)
    credits  = _total_ontario_credits(
        taxable_income, employed_income, self_employed_income,
        age, party_num, children_live_with, has_disability, c,
    )

    # Step 1 — basic ON tax after credits (Line 61)
    on_basic = max(
        prov_row["Basic"]
        + (taxable_income - prov_row["Income_over"]) * prov_row["Rate"]
        - credits * ON_CREDIT_RATE,
        0.0,
    )

    # Step 2 — surtax on basic ON tax (Line 68)
    on_with_surtax = on_basic + _on_surtax(on_basic, c)

    # Step 3 — Ontario tax reduction (Line 80 → 81)
    dep_add        = c["ON_TAX_REDUCTION_DEP"] if num_children > 0 else 0.0
    tax_reduction  = max((c["ON_TAX_REDUCTION_BASE"] + dep_add) * 2 - on_with_surtax, 0.0)
    after_reduction = max(on_with_surtax - tax_reduction, 0.0)

    # Step 4 — LIFT credit (Line 85 → 86)
    lift       = _on_lift(employed_income, taxable_income, c)
    after_lift = max(after_reduction - lift, 0.0)

    # Step 5 — health premium (Line 89)
    return after_lift + _on_health_premium(taxable_income, c)


# ===========================================================================
# BC PROVINCIAL TAX
# ===========================================================================

def _eligible_dependent_bc(party_num: int, children_live_with: int, c: dict) -> float:
    if (
        (party_num == 1 and children_live_with == 1)
        or (party_num == 2 and children_live_with == 2)
        or children_live_with == 4
    ):
        return c["AMOUNT_FOR_ELIGIBLE_DEPENDENT_BC"]
    return 0.0


def _age_amount_bc(age: int, taxable_income: float, c: dict) -> float:
    if age >= 65:
        return max(
            c["BC_AGE_AMOUNT_BASE"]
            - max(taxable_income - c["BC_AGE_AMOUNT_THRESHOLD"], 0) * BC_AGE_AMOUNT_RATE,
            0.0,
        )
    return 0.0


def _total_bc_credits(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    has_disability: bool,
    c: dict,
) -> float:
    return (
        c["BASIC_PERSONAL_AMOUNT_BC"]
        + _eligible_dependent_bc(party_num, children_live_with, c)
        + _age_amount_bc(age, taxable_income, c)
        + _base_cpp(employed_income, self_employed_income, c)
        + _ei(employed_income, c)
        + (c["DISABILITY_AMOUNT_BC"] if has_disability else 0.0)
    )


def calculate_bc_tax(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    num_children: int,
    has_disability: bool,
    c: dict,
) -> float:
    """
    BC provincial tax:
      1. Basic BC tax = bracket_tax − credits × 5.06%
      2. − BC tax reduction (income-tested, no surtax, no health premium, no LIFT)
    """
    prov_row = _find_bracket(c["BC_BRACKETS"], taxable_income)
    credits = _total_bc_credits(
        taxable_income, employed_income, self_employed_income,
        age, party_num, children_live_with, has_disability, c,
    )

    bc_tax_on_income = max(
        prov_row["Basic"]
        + (taxable_income - prov_row["Income_over"]) * prov_row["Rate"],
        0.0,
    )

    effect_of_credits = credits * BC_CREDIT_RATE

    tax_reduction_calc = (
        c["BC_TAX_REDUCTION_BASE"]
        + max((taxable_income - c["BC_TAX_REDUCTION_THRESHOLD_CALC"]) * BC_TAX_REDUCTION_INCOME_RATE, 0.0)
    )
    bc_tax_reduction = (
        0.0 if taxable_income >= c["BC_TAX_REDUCTION_THRESHOLD_ELIGIBILITY"]
        else tax_reduction_calc
    )

    return max(bc_tax_on_income - effect_of_credits - bc_tax_reduction, 0.0)


# ===========================================================================
# ALBERTA PROVINCIAL TAX
# ===========================================================================

def _eligible_dependent_ab(party_num: int, children_live_with: int, c: dict) -> float:
    if (
        (party_num == 1 and children_live_with == 1)
        or (party_num == 2 and children_live_with == 2)
        or children_live_with == 4
    ):
        return c["AMOUNT_FOR_ELIGIBLE_DEPENDENT_AB"]
    return 0.0


def _age_amount_ab(age: int, taxable_income: float, c: dict) -> float:
    if age >= 65:
        return max(
            c["AB_AGE_AMOUNT_BASE"]
            - max(taxable_income - c["AB_AGE_AMOUNT_THRESHOLD"], 0) * AB_AGE_AMOUNT_RATE,
            0.0,
        )
    return 0.0


def _total_ab_credits(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    has_disability: bool,
    c: dict,
) -> float:
    return (
        c["BASIC_PERSONAL_AMOUNT_AB"]
        + _eligible_dependent_ab(party_num, children_live_with, c)
        + _age_amount_ab(age, taxable_income, c)
        + _base_cpp(employed_income, self_employed_income, c)
        + _ei(employed_income, c)
        + (c["DISABILITY_AMOUNT_AB"] if has_disability else 0.0)
    )


def calculate_ab_tax(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    num_children: int,
    has_disability: bool,
    c: dict,
) -> float:
    """
    Alberta provincial tax:
      1. Basic AB tax = bracket_tax − credits × 8% (AB credit rate)
      No surtax, no health premium, no LIFT, no tax reduction.
    """
    prov_row = _find_bracket(c["AB_BRACKETS"], taxable_income)
    credits = _total_ab_credits(
        taxable_income, employed_income, self_employed_income,
        age, party_num, children_live_with, has_disability, c,
    )

    tax_on_income = max(
        prov_row["Basic"]
        + (taxable_income - prov_row["Income_over"]) * prov_row["Rate"],
        0.0,
    )
    effect_of_credits = credits * c["AB_CREDIT_RATE"]

    return max(tax_on_income - effect_of_credits, 0.0)


# ===========================================================================
# SASKATCHEWAN PROVINCIAL TAX
# ===========================================================================

def _eligible_dependent_sk(party_num: int, children_live_with: int, c: dict) -> float:
    if (
        (party_num == 1 and children_live_with == 1)
        or (party_num == 2 and children_live_with == 2)
        or children_live_with == 4
    ):
        return c["AMOUNT_FOR_ELIGIBLE_DEPENDENT_SK"]
    return 0.0


def _age_amount_sk(age: int, taxable_income: float, c: dict) -> float:
    if age >= 65:
        return max(
            c["SK_AGE_AMOUNT_BASE"]
            - max(taxable_income - c["SK_AGE_AMOUNT_THRESHOLD"], 0) * SK_AGE_AMOUNT_RATE,
            0.0,
        )
    return 0.0


def _sk_child_amount(party_children: list, year: int, c: dict) -> float:
    """SK child amount: $7,704 per child under 19."""
    count = sum(1 for ch in party_children if _child_age(ch.date_of_birth, year) < 19)
    return count * c["SK_CHILD_AMOUNT"]


def _sk_senior_supplement(age: int, c: dict) -> float:
    """SK senior supplementary amount for age 65+."""
    return c["SK_SENIOR_SUPPLEMENT"] if age >= 65 else 0.0


def _total_sk_credits(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    has_disability: bool,
    party_children: list,
    year: int,
    c: dict,
) -> float:
    return (
        c["BASIC_PERSONAL_AMOUNT_SK"]
        + _eligible_dependent_sk(party_num, children_live_with, c)
        + _age_amount_sk(age, taxable_income, c)
        + _sk_senior_supplement(age, c)
        + _sk_child_amount(party_children, year, c)
        + _base_cpp(employed_income, self_employed_income, c)
        + _ei(employed_income, c)
        + (c["DISABILITY_AMOUNT_SK"] if has_disability else 0.0)
    )


def calculate_sk_tax(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    num_children: int,
    has_disability: bool,
    party_children: list,
    year: int,
    c: dict,
) -> float:
    """
    Saskatchewan provincial tax:
      bracket_tax − credits × 10.5% (SK credit rate)
    No surtax, no health premium, no LIFT, no tax reduction.
    """
    prov_row = _find_bracket(c["SK_BRACKETS"], taxable_income)
    credits = _total_sk_credits(
        taxable_income, employed_income, self_employed_income,
        age, party_num, children_live_with, has_disability,
        party_children, year, c,
    )

    tax_on_income = max(
        prov_row["Basic"]
        + (taxable_income - prov_row["Income_over"]) * prov_row["Rate"],
        0.0,
    )
    effect_of_credits = credits * c["SK_CREDIT_RATE"]

    return max(tax_on_income - effect_of_credits, 0.0)


# ===========================================================================
# MANITOBA PROVINCIAL TAX
# ===========================================================================

def _eligible_dependent_mb(party_num: int, children_live_with: int, c: dict) -> float:
    if (
        (party_num == 1 and children_live_with == 1)
        or (party_num == 2 and children_live_with == 2)
        or children_live_with == 4
    ):
        return c["AMOUNT_FOR_ELIGIBLE_DEPENDENT_MB"]
    return 0.0


def _age_amount_mb(age: int, taxable_income: float, c: dict) -> float:
    if age >= 65:
        return max(
            c["MB_AGE_AMOUNT_BASE"]
            - max(taxable_income - c["MB_AGE_AMOUNT_THRESHOLD"], 0) * MB_AGE_AMOUNT_RATE,
            0.0,
        )
    return 0.0


def _mb_bpa(net_income: float, c: dict) -> float:
    """MB BPA with phase-out for high income ($200k–$400k)."""
    bpa = c["BASIC_PERSONAL_AMOUNT_MB"]
    start = c["MB_BPA_PHASE_OUT_START"]
    end = c["MB_BPA_PHASE_OUT_END"]
    if net_income <= start:
        return bpa
    if net_income >= end:
        return 0.0
    # Linear phase-out
    return bpa * (1.0 - (net_income - start) / (end - start))


def _total_mb_credits(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    has_disability: bool,
    c: dict,
) -> float:
    return (
        _mb_bpa(taxable_income, c)
        + _eligible_dependent_mb(party_num, children_live_with, c)
        + _age_amount_mb(age, taxable_income, c)
        + _base_cpp(employed_income, self_employed_income, c)
        + _ei(employed_income, c)
        + (c["DISABILITY_AMOUNT_MB"] if has_disability else 0.0)
    )


def calculate_mb_tax(
    taxable_income: float,
    employed_income: float,
    self_employed_income: float,
    age: int,
    party_num: int,
    children_live_with: int,
    num_children: int,
    has_disability: bool,
    c: dict,
) -> float:
    """
    Manitoba provincial tax:
      bracket_tax − credits × 10.8% (MB credit rate)
    No surtax, no health premium, no LIFT, no tax reduction.
    MB BPA phases out between $200k–$400k net income.
    """
    prov_row = _find_bracket(c["MB_BRACKETS"], taxable_income)
    credits = _total_mb_credits(
        taxable_income, employed_income, self_employed_income,
        age, party_num, children_live_with, has_disability, c,
    )

    tax_on_income = max(
        prov_row["Basic"]
        + (taxable_income - prov_row["Income_over"]) * prov_row["Rate"],
        0.0,
    )
    effect_of_credits = credits * c["MB_CREDIT_RATE"]

    return max(tax_on_income - effect_of_credits, 0.0)


# ===========================================================================
# BC BENEFITS
# ===========================================================================

def _bc_child_base(num_children: int, is_shared: bool, c: dict) -> float:
    if num_children <= 0:
        return 0.0
    amounts = [c["BC_CHILD_BENEFIT_BASE_1"]]
    if num_children >= 2:
        amounts.append(c["BC_CHILD_BENEFIT_BASE_2"])
    for _ in range(max(num_children - 2, 0)):
        amounts.append(c["BC_CHILD_BENEFIT_BASE_ADDL"])
    total = sum(amounts)
    return total / 2 if is_shared else total


def _bc_child_threshold(num_children: int, is_shared: bool, c: dict) -> float:
    if num_children <= 0:
        return 0.0
    amounts = [c["BC_CHILD_BENEFIT_THRESHOLD_1"]]
    if num_children >= 2:
        amounts.append(c["BC_CHILD_BENEFIT_THRESHOLD_2"])
    for _ in range(max(num_children - 2, 0)):
        amounts.append(c["BC_CHILD_BENEFIT_THRESHOLD_ADDL"])
    total = sum(amounts)
    return total / 2 if is_shared else total


def calculate_bc_child_benefit(
    taxable_income: float,
    num_children: int,
    is_shared: bool,
    c: dict,
) -> float:
    """BC Childhood Opportunity Benefit (annual) + supplement."""
    if num_children <= 0:
        return 0.0
    base = _bc_child_base(num_children, is_shared, c)
    deductions = max(
        (taxable_income - c["BC_CHILD_BENEFIT_LOWER_THRESHOLD"]) * BC_CHILD_BENEFIT_REDUCTION_RATE,
        0.0,
    )
    threshold = _bc_child_threshold(num_children, is_shared, c)
    benefit = max(base - deductions, threshold)
    supplement = c.get("BC_CHILD_BENEFIT_SUPPLEMENT", 0.0)
    return benefit + supplement


def calculate_bc_climate_action(
    taxable_income: float,
    num_children: int,
    c: dict,
) -> float:
    """BC Climate Action Tax Credit (annual)."""
    base = c["BC_CLIMATE_ACTION_BASIC"]
    if num_children >= 1:
        base += c["BC_CLIMATE_ACTION_FIRST_CHILD"]
    for _ in range(max(num_children - 1, 0)):
        base += c["BC_CLIMATE_ACTION_ADDL_CHILD"]

    if num_children > 0:
        reduction = max(
            (taxable_income - c["BC_CLIMATE_ACTION_FAMILY_THRESHOLD"]) * BC_CLIMATE_ACTION_REDUCTION,
            0.0,
        )
    else:
        reduction = max(
            (taxable_income - c["BC_CLIMATE_ACTION_SINGLE_THRESHOLD"]) * BC_CLIMATE_ACTION_REDUCTION,
            0.0,
        )
    return max(base - reduction, 0.0)


# ===========================================================================
# ALBERTA BENEFITS
# ===========================================================================

def calculate_ab_child_benefit(
    taxable_income: float,
    num_children: int,
    c: dict,
) -> float:
    """
    Alberta Child and Family Benefit (ACFB) — annual.
    Two components: family (base) and working, each with their own
    base amounts, thresholds, and reduction percentages.
    Capped at ACFB_CAP.
    """
    if num_children <= 0:
        return 0.0

    n = min(num_children, 4)

    # --- Family (base) component ---
    base_key = f"ACFB_BASE_{n}_CHILD" if n == 1 else f"ACFB_BASE_{n}_CHILDREN"
    family_base = c.get(base_key, c["ACFB_BASE_4_CHILDREN"])
    family_reduction_pct = ACFB_BASE_REDUCTION_RATES.get(n, ACFB_BASE_REDUCTION_RATES[4])
    family_excess = max(taxable_income - c["ACFB_BASE_THRESHOLD"], 0.0) if family_base > 0 else 0.0
    family_component = max(family_base - family_excess * family_reduction_pct, 0.0)

    # --- Working component ---
    working_key = f"ACFB_WORKING_{n}_CHILD" if n == 1 else f"ACFB_WORKING_{n}_CHILDREN"
    working_base = c.get(working_key, c["ACFB_WORKING_4_CHILDREN"])
    working_reduction_pct = ACFB_WORKING_REDUCTION_RATES.get(n, ACFB_WORKING_REDUCTION_RATES[4])
    working_excess = max(taxable_income - c["ACFB_WORKING_THRESHOLD"], 0.0) if working_base > 0 else 0.0
    working_component = max(working_base - working_excess * working_reduction_pct, 0.0)

    return min(family_component + working_component, c["ACFB_CAP"])


def calculate_ab_climate_action(
    party_children: list,
    year: int,
    c: dict,
) -> float:
    """Climate Action Incentive — Alberta amounts (annual)."""
    base = c["AB_CLIMATE_ACTION_BASE"]
    num_children = len(party_children)
    if num_children >= 1:
        base += c["AB_CLIMATE_ACTION_FIRST_CHILD"]
    if num_children >= 2:
        base += c["AB_CLIMATE_ACTION_ADDL_CHILD"] * (num_children - 1)
    return base


# ===========================================================================
# SASKATCHEWAN BENEFITS
# ===========================================================================

def calculate_sk_climate_action(
    party_children: list,
    year: int,
    c: dict,
) -> float:
    """Canada Carbon Rebate — SK amounts (annual). Program ended April 2025."""
    base = c["SK_CLIMATE_ACTION_BASE"]
    num_children = len(party_children)
    if num_children >= 1:
        base += c["SK_CLIMATE_ACTION_FIRST_CHILD"]
    if num_children >= 2:
        base += c["SK_CLIMATE_ACTION_ADDL_CHILD"] * (num_children - 1)
    return base


def calculate_sk_slitc(
    taxable_income: float,
    party_children: list,
    year: int,
    c: dict,
) -> float:
    """Saskatchewan Low-Income Tax Credit (annual, refundable)."""
    base = c["SK_SLITC_INDIVIDUAL"]
    # Add spouse/dependent amount (assumed for family law context)
    num_children = min(len(party_children), c.get("SK_SLITC_MAX_CHILDREN", 2))
    base += num_children * c["SK_SLITC_PER_CHILD"]

    reduction = max(
        (taxable_income - c["SK_SLITC_THRESHOLD"]) * SK_SLITC_REDUCTION_RATE,
        0.0,
    )
    return max(base - reduction, 0.0)


# ===========================================================================
# MANITOBA BENEFITS
# ===========================================================================

def calculate_mb_climate_action(
    party_children: list,
    year: int,
    c: dict,
) -> float:
    """Canada Carbon Rebate — MB amounts (annual). Program ended April 2025."""
    base = c["MB_CLIMATE_ACTION_BASE"]
    num_children = len(party_children)
    if num_children >= 1:
        base += c["MB_CLIMATE_ACTION_FIRST_CHILD"]
    if num_children >= 2:
        base += c["MB_CLIMATE_ACTION_ADDL_CHILD"] * (num_children - 1)
    return base


# ===========================================================================
# CHILD DIRECTION
# ===========================================================================

def which_party_children_live_with(
    child_counts: dict,
    child_support_amounts: dict,
    both_incomes: dict,
    party_num: int,
) -> int:
    """
    0=no children, 1=with party1, 2=with party2, 4=split.
    """
    p1     = child_counts.get("party1", 0)
    p2     = child_counts.get("party2", 0)
    shared = child_counts.get("shared", 0)
    total  = p1 + p2 + shared

    if total == 0:
        return 0

    # HYBRID
    if (p1 > 0 or p2 > 0) and shared > 0:
        return 1 if p1 >= p2 else 2

    # SHARED — all shared, use support then income as tiebreaker
    if total == shared:
        cs1 = child_support_amounts.get("party1", 0)
        cs2 = child_support_amounts.get("party2", 0)
        if cs1 > cs2: return 2
        if cs2 > cs1: return 1
        inc1 = both_incomes.get("party1", 0)
        inc2 = both_incomes.get("party2", 0)
        if inc1 > inc2: return 2
        if inc2 > inc1: return 1
        return 0

    # SEPARATED / SPLIT
    if p1 > 0 and party_num == 1: return 1
    if p2 > 0 and party_num == 2: return 2
    if p1 > 0 and p2 > 0:        return 4
    return 0


# ===========================================================================
# CANADA WORKERS BENEFIT
# ===========================================================================

def calculate_cwb(
    total_income: float,
    taxable_income: float,
    num_children_with_party: int,
    has_disability: bool,
    c: dict,
) -> float:
    """CWB refundable credit."""
    if num_children_with_party > 0:
        cwb_max   = c["CWB_FAMILY_MAX"]
        threshold = c["CWB_FAMILY_THRESHOLD"]
    else:
        cwb_max   = c["CWB_SINGLE_MAX"]
        threshold = c["CWB_SINGLE_THRESHOLD"]

    basic     = min((total_income - CWB_INCOME_FLOOR) * CWB_RATE, cwb_max)
    reduction = max((taxable_income - threshold) * CWB_REDUCTION_RATE, 0.0)
    cwb       = max(basic - reduction, 0.0)

    if has_disability:
        disab_base = min(
            (total_income - c["CWB_DISAB_BASE_THRESHOLD"]) * CWB_DISAB_BASE_PERCENT,
            c["CWB_DISAB_BASE_MAX"],
        )
        if num_children_with_party == 0:
            disab_red = max(
                (taxable_income - c["CWB_DISAB_RED_THRESHOLD_SINGLE"]) * CWB_DISAB_RED_RATE_SINGLE,
                0.0,
            )
        else:
            disab_red = max(
                (taxable_income - c["CWB_DISAB_RED_THRESHOLD_FAMILY"]) * CWB_DISAB_RED_RATE_FAMILY,
                0.0,
            )
        if disab_base - disab_red > 0:
            cwb += disab_base - disab_red

    return max(cwb, 0.0)


# ===========================================================================
# BENEFITS
# ===========================================================================

def calculate_ccb(
    gross_income: float,
    party_children: list[ChildInfo],
    year: int,
    c: dict,
) -> float:
    """
    Canada Child Benefit (annual).
    """
    if not party_children:
        return 0.0

    n = len(party_children)
    base = sum(
        c["CCB_CHILD_UNDER_6"] if _child_age(ch.date_of_birth, year) < 6 else c["CCB_CHILD_6_17"]
        for ch in party_children
        if _child_age(ch.date_of_birth, year) <= 17
    )

    if base == 0 or gross_income <= c["CCB_LOWER_THRESHOLD"]:
        return base

    if n == 1:
        rate1, rate2 = CCB_RATE_1_PHASE1, CCB_RATE_1_PHASE2
    elif n == 2:
        rate1, rate2 = CCB_RATE_2_PHASE1, CCB_RATE_2_PHASE2
    elif n == 3:
        rate1, rate2 = CCB_RATE_3_PHASE1, CCB_RATE_3_PHASE2
    else:
        rate1, rate2 = CCB_RATE_4_PHASE1, CCB_RATE_4_PHASE2

    phase1_income = min(gross_income, c["CCB_UPPER_THRESHOLD"]) - c["CCB_LOWER_THRESHOLD"]
    reduction = max(phase1_income, 0.0) * rate1

    if gross_income > c["CCB_UPPER_THRESHOLD"]:
        reduction += (gross_income - c["CCB_UPPER_THRESHOLD"]) * rate2

    return max(base - reduction, 0.0)


def calculate_gst_hst(
    taxable_income: float,
    party_children: list[ChildInfo],
    year: int,
    c: dict,
) -> float:
    """GST/HST benefit."""
    num_children = len([ch for ch in party_children if _child_age(ch.date_of_birth, year) <= 18])
    if num_children == 0:
        credit = c["GST_BASE_CREDIT"]
    elif num_children == 1:
        credit = c["GST_BASE_CREDIT"] + c["GST_ELIGIBLE_DEP"]
    else:
        credit = c["GST_BASE_CREDIT"] + c["GST_ELIGIBLE_DEP"] + c["GST_OTHER_DEP"] * (num_children - 1)

    clawback = max(taxable_income - c["GST_UPPER_THRESHOLD"], 0.0) * GST_CLAWBACK_RATE
    return max(credit - clawback, 0.0)


def calculate_ocb(
    taxable_income: float,
    party_children: list[ChildInfo],
    year: int,
    c: dict,
) -> float:
    """Ontario Child Benefit (annual)."""
    num_children = len([ch for ch in party_children if _child_age(ch.date_of_birth, year) <= 17])
    if num_children == 0:
        return 0.0

    reduction = max(taxable_income - c["OCB_THRESHOLD"], 0.0) * OCB_REDUCTION_RATE
    return max((c["OCB_BASE"] - reduction) * num_children, 0.0)


def calculate_ostc(
    taxable_income: float,
    party_children: list[ChildInfo],
    year: int,
    c: dict,
) -> float:
    """Ontario Sales Tax Credit."""
    num_children = len([ch for ch in party_children if _child_age(ch.date_of_birth, year) < 19])
    credit    = c["OSTC_BASE"] + c["OSTC_CHILD_UNDER_19"] * num_children
    threshold = c["OSTC_FAMILY_THRESHOLD"] if num_children > 0 else c["OSTC_SINGLE_THRESHOLD"]
    reduction = max(taxable_income - threshold, 0.0) * OSTC_REDUCTION_RATE
    return max(credit - reduction, 0.0)


def calculate_cai(
    party_children: list[ChildInfo],
    year: int,
    c: dict,
) -> float:
    """Climate Action Incentive (Ontario)."""
    base = c["CAI_INDIVIDUAL"]
    if party_children:
        base += c["CAI_FIRST_CHILD_SINGLE_PARENT"]
        base += c["CAI_PER_ADDITIONAL_CHILD"] * max(len(party_children) - 1, 0)
    return base


# ===========================================================================
# ONTARIO CHILD-CARE CREDIT ADJUSTMENT
# ===========================================================================

def _on_care_credit(taxable_income: float, child_care_capped: float, year: int, c: dict) -> float:
    if child_care_capped <= 0:
        return 0.0
    income_over = child_care_capped + taxable_income
    row = _find_bracket(c["ON_CARE_RATES"], income_over)
    top_up = 0.20 if year == 2021 else 0.0
    return child_care_capped * row["Rate"] * (1 + top_up)


# ===========================================================================
# BC CWB SUPPLEMENT
# ===========================================================================

def _bc_cwb_supplement(
    total_income: float,
    taxable_income: float,
    num_children_with_party: int,
    c: dict,
) -> float:
    """BC CWB supplement — applied unconditionally (matches spreadsheet)."""
    base = min(
        (total_income - c["BC_CWB_SUPPLEMENT_BASE_THRESHOLD"]) * c["BC_CWB_SUPPLEMENT_RATE"],
        c["BC_CWB_SUPPLEMENT_CAP"],
    )
    if num_children_with_party > 0:
        red_threshold = c["BC_CWB_SUPPLEMENT_RED_THRESHOLD_FAMILY"]
    else:
        red_threshold = c["BC_CWB_SUPPLEMENT_RED_THRESHOLD_SINGLE"]
    reduction = max((taxable_income - red_threshold) * c["BC_CWB_SUPPLEMENT_RED_RATE"], 0.0)
    return max(base - reduction, 0.0)


# ===========================================================================
# MAIN CALCULATION
# ===========================================================================

def calculate_taxes(inp: TaxInput) -> dict:
    """
    Full tax + benefit calculation for one party.
    Year-variable constants are loaded from tax_constants.json.
    """

    print(f"[tax.py] calculate_taxes called: year={inp.year}, province={inp.province}, party_num={inp.party_num}")
    print(f"[tax.py]   incomes: employed={inp.employed_income}, self_employed={inp.self_employed_income}, other={inp.other_income}")
    print(f"[tax.py]   support: received={inp.support_received}, deductible_paid={inp.deductible_support_paid}")

    # Load the right year's constants once
    c = get_year_constants(inp.year)

    # ── 1. Taxable income ────────────────────────────────────────────────────
    taxable_income = calculate_taxable_income(
        employed_income         = inp.employed_income,
        self_employed_income    = inp.self_employed_income,
        other_income            = inp.other_income,
        support_received        = inp.support_received,
        deductible_support_paid = inp.deductible_support_paid,
        child_care_expenses     = inp.child_care_expenses,
        other_deductions        = inp.other_deductions,
        year                    = inp.year,
    )

    total_income = inp.employed_income + inp.self_employed_income + inp.other_income

    # ── 2. Child direction ───────────────────────────────────────────────────
    children_live_with = which_party_children_live_with(
        child_counts          = inp.child_counts,
        child_support_amounts = inp.child_support_amounts,
        both_incomes          = inp.both_incomes,
        party_num             = inp.party_num,
    )
    party_children = _party_children(inp.children, inp.party_num, children_live_with)
    num_children   = len(inp.children)
    has_disability = inp.eligible_for_disability == "Yes"

    # ── 3. Federal credits breakdown ─────────────────────────────────────────
    bpa_fed      = _bpa_federal(taxable_income, c)
    age_amt_fed  = _age_amount_federal(inp.age, taxable_income, c)
    elig_dep_fed = _eligible_dependent_federal(inp.party_num, children_live_with, bpa_fed)
    cpp_contrib  = _base_cpp(inp.employed_income, inp.self_employed_income, c)
    ei_prem      = _ei(inp.employed_income, c)
    ca_emp_amt   = _canada_employment_amount(inp.employed_income, c)
    disab_fed    = c["DISABILITY_AMOUNT_FED"] if has_disability else 0.0
    total_fed_credits = _total_federal_credits(
        total_income, taxable_income,
        inp.employed_income, inp.self_employed_income,
        inp.age, inp.party_num, children_live_with, has_disability, c, inp.year,
    )

    # ── 4. Provincial credits breakdown (province-aware) ────────────────────
    province = inp.province

    if province == "BC":
        elig_dep_prov      = _eligible_dependent_bc(inp.party_num, children_live_with, c)
        age_amt_prov       = _age_amount_bc(inp.age, taxable_income, c)
        disab_prov         = c["DISABILITY_AMOUNT_BC"] if has_disability else 0.0
        total_prov_credits = _total_bc_credits(
            taxable_income, inp.employed_income, inp.self_employed_income,
            inp.age, inp.party_num, children_live_with, has_disability, c,
        )
        bpa_prov           = c["BASIC_PERSONAL_AMOUNT_BC"]
        prov_credit_rate   = BC_CREDIT_RATE
    elif province == "AB":
        elig_dep_prov      = _eligible_dependent_ab(inp.party_num, children_live_with, c)
        age_amt_prov       = _age_amount_ab(inp.age, taxable_income, c)
        disab_prov         = c["DISABILITY_AMOUNT_AB"] if has_disability else 0.0
        total_prov_credits = _total_ab_credits(
            taxable_income, inp.employed_income, inp.self_employed_income,
            inp.age, inp.party_num, children_live_with, has_disability, c,
        )
        bpa_prov           = c["BASIC_PERSONAL_AMOUNT_AB"]
        prov_credit_rate   = c["AB_CREDIT_RATE"]
    elif province == "SK":
        elig_dep_prov      = _eligible_dependent_sk(inp.party_num, children_live_with, c)
        age_amt_prov       = _age_amount_sk(inp.age, taxable_income, c)
        disab_prov         = c["DISABILITY_AMOUNT_SK"] if has_disability else 0.0
        total_prov_credits = _total_sk_credits(
            taxable_income, inp.employed_income, inp.self_employed_income,
            inp.age, inp.party_num, children_live_with, has_disability,
            party_children, inp.year, c,
        )
        bpa_prov           = c["BASIC_PERSONAL_AMOUNT_SK"]
        prov_credit_rate   = c["SK_CREDIT_RATE"]
    elif province == "MB":
        elig_dep_prov      = _eligible_dependent_mb(inp.party_num, children_live_with, c)
        age_amt_prov       = _age_amount_mb(inp.age, taxable_income, c)
        disab_prov         = c["DISABILITY_AMOUNT_MB"] if has_disability else 0.0
        total_prov_credits = _total_mb_credits(
            taxable_income, inp.employed_income, inp.self_employed_income,
            inp.age, inp.party_num, children_live_with, has_disability, c,
        )
        bpa_prov           = _mb_bpa(taxable_income, c)
        prov_credit_rate   = c["MB_CREDIT_RATE"]
    else:
        elig_dep_prov      = _eligible_dependent_ontario(inp.party_num, children_live_with, c)
        age_amt_prov       = _age_amount_ontario(inp.age, taxable_income, c)
        disab_prov         = c["DISABILITY_AMOUNT_ON"] if has_disability else 0.0
        total_prov_credits = _total_ontario_credits(
            taxable_income, inp.employed_income, inp.self_employed_income,
            inp.age, inp.party_num, children_live_with, has_disability, c,
        )
        bpa_prov           = c["BASIC_PERSONAL_AMOUNT_ON"]
        prov_credit_rate   = ON_CREDIT_RATE

    # ── 5. Federal tax ───────────────────────────────────────────────────────
    federal_tax = calculate_federal_tax(
        taxable_income       = taxable_income,
        total_income         = total_income,
        employed_income      = inp.employed_income,
        self_employed_income = inp.self_employed_income,
        age                  = inp.age,
        party_num            = inp.party_num,
        children_live_with   = children_live_with,
        has_disability       = has_disability,
        c                    = c,
        year                 = inp.year,
    )

    # ── 6. Provincial tax (province-aware) ───────────────────────────────────
    if province == "BC":
        prov_brackets_key   = "BC_BRACKETS"
        prov_row_for_report = _find_bracket(c["BC_BRACKETS"], taxable_income)
        provincial_tax = calculate_bc_tax(
            taxable_income       = taxable_income,
            employed_income      = inp.employed_income,
            self_employed_income = inp.self_employed_income,
            age                  = inp.age,
            party_num            = inp.party_num,
            children_live_with   = children_live_with,
            num_children         = len(party_children),
            has_disability       = has_disability,
            c                    = c,
        )
    elif province == "AB":
        prov_brackets_key   = "AB_BRACKETS"
        prov_row_for_report = _find_bracket(c["AB_BRACKETS"], taxable_income)
        provincial_tax = calculate_ab_tax(
            taxable_income       = taxable_income,
            employed_income      = inp.employed_income,
            self_employed_income = inp.self_employed_income,
            age                  = inp.age,
            party_num            = inp.party_num,
            children_live_with   = children_live_with,
            num_children         = len(party_children),
            has_disability       = has_disability,
            c                    = c,
        )
    elif province == "SK":
        prov_brackets_key   = "SK_BRACKETS"
        prov_row_for_report = _find_bracket(c["SK_BRACKETS"], taxable_income)
        provincial_tax = calculate_sk_tax(
            taxable_income       = taxable_income,
            employed_income      = inp.employed_income,
            self_employed_income = inp.self_employed_income,
            age                  = inp.age,
            party_num            = inp.party_num,
            children_live_with   = children_live_with,
            num_children         = len(party_children),
            has_disability       = has_disability,
            party_children       = party_children,
            year                 = inp.year,
            c                    = c,
        )
    elif province == "MB":
        prov_brackets_key   = "MB_BRACKETS"
        prov_row_for_report = _find_bracket(c["MB_BRACKETS"], taxable_income)
        provincial_tax = calculate_mb_tax(
            taxable_income       = taxable_income,
            employed_income      = inp.employed_income,
            self_employed_income = inp.self_employed_income,
            age                  = inp.age,
            party_num            = inp.party_num,
            children_live_with   = children_live_with,
            num_children         = len(party_children),
            has_disability       = has_disability,
            c                    = c,
        )
    else:
        prov_brackets_key   = "ON_BRACKETS"
        prov_row_for_report = _find_bracket(c["ON_BRACKETS"], taxable_income)
        provincial_tax = calculate_ontario_tax(
            taxable_income       = taxable_income,
            employed_income      = inp.employed_income,
            self_employed_income = inp.self_employed_income,
            age                  = inp.age,
            party_num            = inp.party_num,
            children_live_with   = children_live_with,
            num_children         = len(party_children),
            has_disability       = has_disability,
            c                    = c,
        )

    # ── 7. CPP/EI payroll deductions ─────────────────────────────────────────
    cpp_ei = calculate_cpp_ei_deductions(inp.employed_income, inp.self_employed_income, inp.year)

    # ── 8. Canada Workers Benefit ────────────────────────────────────────────
    num_children_with = inp.child_counts.get(f"party{inp.party_num}", 0)
    if province == "BC":
        bc_cwb_c = dict(c)
        bc_cwb_c["CWB_SINGLE_MAX"]   = c["BC_CWB_SINGLE_MAX"]
        bc_cwb_c["CWB_FAMILY_MAX"]   = c["BC_CWB_FAMILY_MAX"]
        bc_cwb_c["CWB_SINGLE_THRESHOLD"] = c["BC_CWB_SINGLE_THRESHOLD"]
        bc_cwb_c["CWB_FAMILY_THRESHOLD"] = c["BC_CWB_FAMILY_THRESHOLD"]
        cwb = calculate_cwb(
            total_income            = total_income,
            taxable_income          = taxable_income,
            num_children_with_party = num_children_with,
            has_disability          = has_disability,
            c                       = bc_cwb_c,
        )
        # BC CWB supplement excluded — already reflected in spousal support
        # cwb += _bc_cwb_supplement(total_income, taxable_income, num_children_with, c)
    elif province == "AB":
        ab_cwb_c = dict(c)
        ab_cwb_c["CWB_SINGLE_MAX"]       = c["AB_CWB_SINGLE_MAX"]
        ab_cwb_c["CWB_FAMILY_MAX"]        = c["AB_CWB_FAMILY_MAX"]
        ab_cwb_c["CWB_SINGLE_THRESHOLD"]  = c["AB_CWB_SINGLE_THRESHOLD"]
        ab_cwb_c["CWB_FAMILY_THRESHOLD"]  = c["AB_CWB_FAMILY_THRESHOLD"]
        cwb = calculate_cwb(
            total_income            = total_income,
            taxable_income          = taxable_income,
            num_children_with_party = num_children_with,
            has_disability          = has_disability,
            c                       = ab_cwb_c,
        )
    else:
        cwb = calculate_cwb(
            total_income            = total_income,
            taxable_income          = taxable_income,
            num_children_with_party = num_children_with,
            has_disability          = has_disability,
            c                       = c,
        )

    # ── 9. Provincial child-care credit adjustment ────────────────────────────
    capped_child_care = _child_care_deduction(inp.employed_income, inp.child_care_expenses)
    if province == "BC":
        prov_credits_adj = 0.0
    elif province == "AB":
        prov_credits_adj = 0.0   # Alberta has no provincial child-care credit
    elif province in ("SK", "MB"):
        prov_credits_adj = 0.0   # SK/MB have no provincial child-care credit
    else:
        prov_credits_adj = _on_care_credit(taxable_income, capped_child_care, inp.year, c)

    # ── 9b. Province-specific reporting intermediates ─────────────────────────
    if province == "BC":
        bc_row = _find_bracket(c["BC_BRACKETS"], taxable_income)
        bc_tax_on_income = max(
            bc_row["Basic"]
            + (taxable_income - bc_row["Income_over"]) * bc_row["Rate"],
            0.0,
        )
        bc_reduction_calc = (
            c["BC_TAX_REDUCTION_BASE"]
            + max((taxable_income - c["BC_TAX_REDUCTION_THRESHOLD_CALC"]) * BC_TAX_REDUCTION_INCOME_RATE, 0.0)
        )
        bc_tax_reduction_amt = (
            0.0 if taxable_income >= c["BC_TAX_REDUCTION_THRESHOLD_ELIGIBILITY"]
            else bc_reduction_calc
        )
        on_tax_reduction_amt = 0.0
        on_lift_amt          = 0.0
    elif province in ("AB", "SK", "MB"):
        on_tax_reduction_amt = 0.0
        on_lift_amt          = 0.0
        bc_tax_reduction_amt = 0.0
    else:
        bc_tax_reduction_amt = 0.0
        prov_row_on  = _find_bracket(c["ON_BRACKETS"], taxable_income)
        on_credits_v = _total_ontario_credits(
            taxable_income, inp.employed_income, inp.self_employed_income,
            inp.age, inp.party_num, children_live_with, has_disability, c,
        )
        _on_basic_v  = max(
            prov_row_on["Basic"]
            + (taxable_income - prov_row_on["Income_over"]) * prov_row_on["Rate"]
            - on_credits_v * ON_CREDIT_RATE,
            0.0,
        )
        _on_ws_v     = _on_basic_v + _on_surtax(_on_basic_v, c)
        dep_add_v    = c["ON_TAX_REDUCTION_DEP"] if len(party_children) > 0 else 0.0
        on_tax_reduction_amt = max((c["ON_TAX_REDUCTION_BASE"] + dep_add_v) * 2 - _on_ws_v, 0.0)
        on_lift_amt          = _on_lift(inp.employed_income, taxable_income, c)

    # ── 10. Total taxes ───────────────────────────────────────────────────────
    total_taxes = round(
        federal_tax + provincial_tax + cpp_ei - prov_credits_adj - cwb,
        4,
    )

    # ── 11. Benefits (province-aware) ─────────────────────────────────────────
    ccb  = calculate_ccb(taxable_income, party_children, inp.year, c)
    gst  = calculate_gst_hst(taxable_income, party_children, inp.year, c)

    if province == "BC":
        is_shared = inp.type_of_splitting == "SHARED"
        num_children_for_benefit = len([
            ch for ch in party_children if _child_age(ch.date_of_birth, inp.year) <= 17
        ])
        prov_child_benefit = calculate_bc_child_benefit(
            taxable_income, num_children_for_benefit, is_shared, c,
        )
        prov_sales_tax_credit = 0.0
        cai = 0.0
    elif province == "AB":
        num_children_for_benefit = len([
            ch for ch in party_children if _child_age(ch.date_of_birth, inp.year) <= 17
        ])
        prov_child_benefit    = calculate_ab_child_benefit(taxable_income, num_children_for_benefit, c)
        prov_sales_tax_credit = 0.0   # Alberta has no sales tax credit
        cai                   = calculate_ab_climate_action(party_children, inp.year, c)
    elif province == "SK":
        prov_child_benefit    = 0.0   # SK has no provincial child benefit
        prov_sales_tax_credit = calculate_sk_slitc(taxable_income, party_children, inp.year, c)
        cai                   = calculate_sk_climate_action(party_children, inp.year, c)
    elif province == "MB":
        prov_child_benefit    = 0.0   # MB has no provincial child benefit
        prov_sales_tax_credit = 0.0   # MB has no sales tax credit
        cai                   = calculate_mb_climate_action(party_children, inp.year, c)
    else:
        prov_child_benefit    = calculate_ocb(taxable_income, party_children, inp.year, c)
        prov_sales_tax_credit = calculate_ostc(taxable_income, party_children, inp.year, c)
        cai                   = calculate_cai(party_children, inp.year, c)

    total_benefits = ccb + gst + prov_child_benefit + prov_sales_tax_credit + cai

    # ── 12. Net income ────────────────────────────────────────────────────────
    net_income_after_tax = taxable_income - total_taxes + total_benefits

    # ── Intermediate values for reporting ────────────────────────────────────
    fed_row  = _find_bracket(c["FEDERAL_BRACKETS"], taxable_income)
    prov_basic_for_report = max(
        prov_row_for_report["Basic"]
        + (taxable_income - prov_row_for_report["Income_over"]) * prov_row_for_report["Rate"]
        - total_prov_credits * prov_credit_rate,
        0.0,
    )
    enhanced_cpp_amt = _enhanced_cpp_deduction(inp.employed_income, inp.self_employed_income, inp.year)

    _result = {
        # Income
        "gross_income":                   total_income,
        "taxable_income":                 taxable_income,

        # Federal credits
        "basic_personal_amount_fed":      bpa_fed,
        "age_amount_fed":                 age_amt_fed,
        "eligible_dependent_credit_fed":  elig_dep_fed,
        "cpp_base":                       cpp_contrib,
        "ei":                             ei_prem,
        "canada_employment_credit":       ca_emp_amt,
        "disability_credit_fed":          disab_fed,
        "cpp_ei_credit":                  cpp_contrib + ei_prem,
        "total_federal_credits":          total_fed_credits,

        # Provincial credits
        "basic_personal_amount_prov":     bpa_prov,
        "eligible_dependent_credit_prov": elig_dep_prov,
        "age_amount_prov":                age_amt_prov,
        "disability_credit_prov":         disab_prov,
        "total_provincial_credits":       total_prov_credits,

        # Tax before credits (raw bracket tax)
        "federal_tax_before_credits": (
            fed_row["Basic"]
            + (taxable_income - fed_row["Income_over"]) * fed_row["Rate"]
        ),
        "provincial_tax_before_credits": (
            prov_row_for_report["Basic"]
            + (taxable_income - prov_row_for_report["Income_over"]) * prov_row_for_report["Rate"]
        ),

        # Tax after credits
        "federal_tax":            federal_tax,
        "provincial_tax":         provincial_tax,
        "ontario_health_premium": _on_health_premium(taxable_income, c) if province == "ON" else 0.0,
        "ontario_surtax":         _on_surtax(prov_basic_for_report, c) if province == "ON" else 0.0,

        # CPP / EI
        "cpp_enhanced":           enhanced_cpp_amt,
        "cpp2": (
            enhanced_cpp_amt
            - max(
                min(
                    (inp.employed_income - BASE_CPP_EXEMPTION) * ENHANCED_CPP_RATE,
                    c["ENHANCED_CPP_LIMIT"],
                ),
                0.0,
            )
            if inp.employed_income > 0 else 0.0
        ),
        "cpp_ei_deductions":      cpp_ei,

        # Benefits
        "canada_workers_benefit":   cwb,
        "canada_child_benefit":     ccb,
        "gst_hst_benefit":          gst,
        "provincial_child_benefit": prov_child_benefit,
        "provincial_sales_tax_credit": prov_sales_tax_credit,
        "climate_action_incentive": cai,
        "total_benefits":           total_benefits,

        # Reporting fields
        "ontario_tax_reduction":  on_tax_reduction_amt,
        "ontario_lift_credit":    on_lift_amt,
        "bc_tax_reduction":       bc_tax_reduction_amt if province == "BC" else 0.0,

        # Summary
        "total_taxes":            total_taxes,
        "net_income_after_tax":   net_income_after_tax,
    }
    print(f"[tax.py] calculate_taxes result: federal_tax={federal_tax:.2f}, provincial_tax={provincial_tax:.2f}, "
          f"cpp_ei={cpp_ei:.2f}, total_taxes={total_taxes:.2f}, total_benefits={total_benefits:.2f}")
    return _result


def calculate_taxes_from_input(inp: TaxInput) -> dict:
    """Alias."""
    return calculate_taxes(inp)

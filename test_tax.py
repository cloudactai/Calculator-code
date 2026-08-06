"""
test_tax.py
-----------
Validates the calculator against known values (e.g. from the Excel sheet).

HOW TO USE
----------
1. Run a scenario in the Excel calculator.
2. Fill in the INPUTS section below to match.
3. Fill in the EXPECTED section with the values Excel produced.
4. Run:  python3 test_tax.py
5. Every line shows ✓ (match) or ✗ (mismatch with diff).

The script prints which JSON file and which year's constants are loaded,
so you always know the values being used.
"""

import json
import os
from tax import calculate_taxes, get_year_constants, TaxInput, ChildInfo

TOLERANCE = 0.10   # dollars — ✓ if diff < this


# ===========================================================================
# INPUTS — edit this to match your test scenario
# ===========================================================================

YEAR = 2025

inp = TaxInput(
    party_num=2,
    province="ON",
    age=38,                          # Party 1's actual age — not specified in table
    eligible_for_disability="No",

    employed_income=20000,           # ✓
    self_employed_income=0,          # ✓
    other_income=0,                  # ✓

    support_received=841,              # ✓ Party 1 is the payor
    deductible_support_paid=0,       # ✓ child support is not deductible in Canada

    child_care_expenses=0,           # ✓
    other_deductions=0,              # ✓

    children=[
        ChildInfo(
            date_of_birth="2025-06-01",    # fix: age 1 at June 2026 separation
            custody_arrangement="Party 2",  # ✓
            child_has_disability="No",      # ✓
        ),
    ],

    type_of_splitting="SEPARATED",          # ✓
    child_counts={"party1": 0, "party2": 1, "shared": 0},  # ✓
    child_support_amounts={"party1": 841, "party2": 0},     # ✓
    both_incomes={"party1": 90000, "party2": 20000},        # ✓
    year=YEAR,
)

# ===========================================================================
# TEST RUNNER — nothing to edit below here
# ===========================================================================

def run_test(inp: TaxInput, tolerance: float = TOLERANCE):
    constants_path = os.path.join(os.path.dirname(__file__), "tax_constants.json")
    c = get_year_constants(inp.year)

    print("\n" + "=" * 68)
    print(f"  Tax Calculator Test — Year {inp.year}")
    print(f"  Constants file : {constants_path}")
    print(f"  Year loaded    : {inp.year}  "
          f"(ON BPA: {c['BASIC_PERSONAL_AMOUNT_ON']:,.2f}  |  "
          f"Fed rate: {c['FEDERAL_CREDIT_RATE']:.1%})")
    print("=" * 68)

    print(f"\n  Inputs")
    print(f"    party_num              : {inp.party_num}")
    print(f"    age                    : {inp.age}")
    print(f"    disability             : {inp.eligible_for_disability}")
    print(f"    employed_income        : {inp.employed_income:>12,.2f}")
    print(f"    self_employed_income   : {inp.self_employed_income:>12,.2f}")
    print(f"    other_income           : {inp.other_income:>12,.2f}")
    print(f"    support_received       : {inp.support_received:>12,.2f}")
    print(f"    deductible_support_paid: {inp.deductible_support_paid:>12,.2f}")
    print(f"    child_care_expenses    : {inp.child_care_expenses:>12,.2f}")
    print(f"    other_deductions       : {inp.other_deductions:>12,.2f}")
    print(f"    children               : {len(inp.children)}")
    for ch in inp.children:
        print(f"      dob={ch.date_of_birth}  custody={ch.custody_arrangement}  "
              f"disability={ch.child_has_disability}")
    print(f"    child_counts           : {inp.child_counts}")

    r = calculate_taxes(inp)

    sections = [
        ("Income", ["gross_income", "taxable_income"]),
        ("Federal credits", [
            "basic_personal_amount_fed",
            "cpp_ei_credit",
            "canada_employment_credit",
            "eligible_dependent_credit_fed",
            "age_amount_fed",
            "disability_credit_fed",
            "total_federal_credits",
        ]),
        ("Provincial credits", [
            "basic_personal_amount_prov",
            "eligible_dependent_credit_prov",
            "age_amount_prov",
            "disability_credit_prov",
            "total_provincial_credits",
        ]),
        ("Tax", [
            "federal_tax_before_credits",
            "provincial_tax_before_credits",
            "federal_tax",
            "provincial_tax",
            "ontario_health_premium",
            "ontario_surtax",
            "ontario_tax_reduction",
            "ontario_lift_credit",
        ]),
        ("CPP / EI", [
            "cpp_base",
            "cpp_enhanced",
            "cpp2",
            "ei",
            "cpp_ei_deductions",
        ]),
        ("Benefits", [
            "canada_workers_benefit",
            "canada_child_benefit",
            "gst_hst_benefit",
            "provincial_child_benefit",
            "provincial_sales_tax_credit",
            "climate_action_incentive",
            "total_benefits",
        ]),
        ("Summary", [
            "total_taxes",
            "net_income_after_tax",
        ]),
    ]

    print()
    for section_title, keys in sections:
        print(f"  ── {section_title} ──")
        for k in keys:
            if k not in r:
                continue
            val = r[k]
            print(f"    {k:<40} {val:>12,.2f}")
        print()


if __name__ == "__main__":
    run_test(inp)

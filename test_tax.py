"""
test_tax.py
-----------
Validates the calculator against known values from the Excel sheet.

HOW TO USE
----------
1. Run a scenario in the Excel calculator.
2. Fill in the INPUTS section below to match.
3. Fill in the EXPECTED section with the values Excel produced.
4. Run:  python3 test_tax.py
5. Every line shows MATCH or DIFF with the difference.
"""

import json
import os
from tax import calculate_taxes, get_year_constants, TaxInput, ChildInfo

TOLERANCE = 1.0   # dollars


# ===========================================================================
# INPUTS — edit this to match your test scenario
# ===========================================================================

YEAR = 2025

inp_p1 = TaxInput(
    party_num=1,
    province="BC",
    age=40,
    eligible_for_disability="No",

    employed_income=60000,
    self_employed_income=0,
    other_income=0,

    support_received=0,
    deductible_support_paid=2115.2447632496915,

    child_care_expenses=0,
    other_deductions=0,

    children=[
        ChildInfo(
            date_of_birth="2025-06-01",
            custody_arrangement="Party 2",
            child_has_disability="No",
        ),
    ],

    type_of_splitting="SEPARATED",
    child_counts={"party1": 0, "party2": 1, "shared": 0},
    child_support_amounts={"party1": 578.4, "party2": 0},
    both_incomes={"party1": 60000, "party2": 20000},
    year=YEAR,
)

inp_p2 = TaxInput(
    party_num=2,
    province="BC",
    age=40,
    eligible_for_disability="No",

    employed_income=20000,
    self_employed_income=0,
    other_income=0,

    support_received=2115.2447632496915,
    deductible_support_paid=0,

    child_care_expenses=0,
    other_deductions=0,

    children=[
        ChildInfo(
            date_of_birth="2025-06-01",
            custody_arrangement="Party 2",
            child_has_disability="No",
        ),
    ],

    type_of_splitting="SEPARATED",
    child_counts={"party1": 0, "party2": 1, "shared": 0},
    child_support_amounts={"party1": 578.4, "party2": 0},
    both_incomes={"party1": 60000, "party2": 20000},
    year=YEAR,
)

# ===========================================================================
# EXPECTED VALUES from spreadsheet (Party 1 and Party 2)
# ===========================================================================

expected_p1 = {
    "gross_income":                  60000.00,
    "taxable_income":                57319.76,
    "basic_personal_amount_fed":     16129.00,
    "age_amount_fed":                0.00,
    "eligible_dependent_credit_fed": 0.00,
    "cpp_base":                      2796.75,
    "ei":                            984.00,
    "canada_employment_credit":      1471.00,
    "total_federal_credits":         21380.75,
    "basic_personal_amount_prov":    12932.00,
    "eligible_dependent_credit_prov": 0.00,
    "total_provincial_credits":      16712.75,
    "federal_tax":                   5211.16,
    "provincial_tax":                2266.99,
    "cpp_ei_deductions":             4345.75,
    "canada_workers_benefit":        0.00,
    "canada_child_benefit":          0.00,
    "gst_hst_benefit":               0.00,
    "provincial_child_benefit":      0.00,
    "climate_action_incentive":      0.00,
    "total_benefits":                0.00,
    "total_taxes":                   11823.90,
}

expected_p2 = {
    "gross_income":                  20000.00,
    "taxable_income":                21950.24,
    "basic_personal_amount_fed":     16129.00,
    "age_amount_fed":                0.00,
    "eligible_dependent_credit_fed": 16129.00,
    "cpp_base":                      816.75,
    "ei":                            328.00,
    "canada_employment_credit":      1471.00,
    "total_federal_credits":         34873.75,
    "basic_personal_amount_prov":    12932.00,
    "eligible_dependent_credit_prov": 11073.00,
    "total_provincial_credits":      25149.75,
    "federal_tax":                   0.00,
    "provincial_tax":                0.00,
    "cpp_ei_deductions":             1309.75,
    "canada_workers_benefit":        3634.00,
    "canada_child_benefit":          7997.00,
    "gst_hst_benefit":               882.00,
    "provincial_child_benefit":      2250.00,
    "provincial_sales_tax_credit":   0.00,
    "climate_action_incentive":      0.00,
    "total_benefits":                11129.00,
    "total_taxes":                   -2324.25,
}


# ===========================================================================
# TEST RUNNER
# ===========================================================================

def run_test(label: str, inp: TaxInput, expected: dict, tolerance: float = TOLERANCE):
    c = get_year_constants(inp.year)
    constants_path = os.path.join(os.path.dirname(__file__), "tax_constants.json")

    print("\n" + "=" * 72)
    print(f"  {label} — Year {inp.year}, Province {inp.province}")
    print(f"  Constants file: {constants_path}")
    print("=" * 72)

    r = calculate_taxes(inp)

    all_match = True
    for k, exp in expected.items():
        got = r.get(k, None)
        if got is None:
            print(f"    {k:<40} MISSING in output")
            all_match = False
            continue
        diff = got - exp
        if abs(diff) < tolerance:
            status = "MATCH"
        else:
            status = f"DIFF ({diff:+,.2f})"
            all_match = False
        print(f"    {k:<40} got={got:>12,.2f}  exp={exp:>12,.2f}  {status}")

    print()
    if all_match:
        print(f"    >>> ALL {len(expected)} VALUES MATCH <<<")
    else:
        mismatches = sum(
            1 for k, exp in expected.items()
            if k in r and abs(r[k] - exp) >= tolerance
        )
        print(f"    >>> {mismatches} MISMATCH(ES) <<<")
    print()


if __name__ == "__main__":
    run_test("BC Scenario 1 — Party 1", inp_p1, expected_p1)
    run_test("BC Scenario 1 — Party 2", inp_p2, expected_p2)

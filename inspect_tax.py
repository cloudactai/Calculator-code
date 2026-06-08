"""
inspect_tax.py
--------------
Pretty-prints every intermediate and final value from calculate_taxes
so you can compare against pen-and-paper numbers.

Usage:
    python3 inspect_tax.py

Edit the TaxInput at the bottom to match the scenario you're testing.
All constants and brackets are now hardcoded inside tax.py — no dicts needed.
"""

from tax import calculate_taxes, TaxInput, ChildInfo, _enhanced_cpp_deduction, CPP2_MAX_AMT, CPP2_PEN_EARNING, CPP2_MAX_PEN_EARNING, CPP2_RATE, ENHANCED_CPP_RATE, ENHANCED_CPP_LIMIT, BASE_CPP_EXEMPTION


def print_excel_summary(inp: TaxInput, label: str = ""):
    """
    Print a summary that matches the Excel sheet layout exactly.

    Covers all deduction, credit, tax, and benefit lines.
    Can be called for Party 1 and Party 2 separately.
    """
    r = calculate_taxes(inp)

    # Derive the two CPP deduction lines from inputs
    first_additional_cpp = max(
        min((inp.employed_income - BASE_CPP_EXEMPTION) * ENHANCED_CPP_RATE, ENHANCED_CPP_LIMIT),
        0.0,
    ) if inp.employed_income > 0 else 0.0

    if inp.employed_income > 0:
        if inp.employed_income <= CPP2_PEN_EARNING:
            second_additional_cpp = 0.0
        elif inp.employed_income > CPP2_MAX_PEN_EARNING:
            second_additional_cpp = CPP2_MAX_AMT
        else:
            second_additional_cpp = (inp.employed_income - CPP2_PEN_EARNING) * CPP2_RATE
    else:
        second_additional_cpp = 0.0

    W = 42  # label width

    def row(label, value, negative=False):
        if value == 0:
            print(f"  {label:<{W}} $           -")
        elif negative:
            print(f"  {label:<{W}} $  ({abs(value):>12,.2f})")
        else:
            print(f"  {label:<{W}} $   {value:>12,.2f}")

    title = f"  {label}  " if label else "  Tax Summary  "
    print("\n" + "=" * 60)
    print(title.center(60))
    print("=" * 60)

    print("\n  ── Deductions ──")
    row("First additional CPP",                    first_additional_cpp)
    row("Second additional CPP",                   second_additional_cpp)
    row("Support received",                        inp.support_received)
    row("Deductible support payments made",        inp.deductible_support_paid)
    row("Taxable amount after support",            r["taxable_income"])

    print("\n  ── Federal ──")
    row("Total Federal Credits",                   r["total_federal_credits"])
    row("Net Federal tax",                         r["federal_tax"])

    print("\n  ── Ontario ──")
    row("Total Ontario Credits",                   r["total_provincial_credits"])
    row("Provincial or territorial tax",           r["provincial_tax"])

    print("\n  ── CPP & EI deductions ──")
    row("CPP and EI deductions for employed",      r["cpp_ei_deductions"])

    print("\n  ── Benefits ──")
    row("Canada Workers Benefit",                  r["canada_workers_benefit"],
        negative=(r["canada_workers_benefit"] > 0))
    row("Canada Child Benefit",                    r["canada_child_benefit"])
    row("GST/HST Benefit",                         r["gst_hst_benefit"])
    row("Ontario Child Benefit",                   r["ontario_child_benefit"])
    row("Climate Action Incentive",                r["climate_action_incentive"])
    row("Ontario Sales Tax Credit",                r["ontario_sales_tax_credit"])

    print("  " + "-" * 56)
    row("Total Benefits",                          r["total_benefits"])

    print("\n  ── Summary ──")
    taxes_net = r["total_taxes"]
    row("Taxes and Deductions",                    abs(taxes_net),
        negative=(taxes_net > 0))
    print()

    return r


def inspect(inp: TaxInput, label: str = "", pen_and_paper: dict = None):
    """
    Run the calculator and print every output field grouped by category.

    pen_and_paper: optional {field: expected_value} for ✓/✗ comparison.
    """
    r = calculate_taxes(inp)
    pp = pen_and_paper or {}

    title = f"  {label}  " if label else "  Result  "
    print("=" * 60)
    print(title.center(60))
    print("=" * 60)

    sections = [
        ("Income", [
            "gross_income",
            "taxable_income",
        ]),
        ("Credits (federal)", [
            "basic_personal_amount_fed",
            "cpp_ei_credit",
            "canada_employment_credit",
            "eligible_dependent_credit_fed",
            "age_amount_fed",
            "disability_credit_fed",
            "total_federal_credits",
        ]),
        ("Credits (provincial)", [
            "basic_personal_amount_prov",
            "eligible_dependent_credit_prov",
            "age_amount_prov",
            "disability_credit_prov",
            "total_provincial_credits",
        ]),
        ("Tax before credits", [
            "federal_tax_before_credits",
            "provincial_tax_before_credits",
        ]),
        ("Tax after credits", [
            "federal_tax",
            "provincial_tax",
            "ontario_health_premium",
            "ontario_surtax",
        ]),
        ("CPP / EI", [
            "cpp_base",
            "cpp_enhanced",
            "cpp2",
            "ei",
            "cpp_ei_deductions",
        ]),
        ("Benefits / CWB", [
            "canada_workers_benefit",
            "canada_child_benefit",
            "gst_hst_benefit",
        ]),
        ("Summary", [
            "total_taxes",
            "net_income_after_tax",
        ]),
    ]

    for section_title, keys in sections:
        print(f"\n  ── {section_title} ──")
        for k in keys:
            if k not in r:
                continue
            val = r[k]
            val_str = f"{val:>14,.2f}" if isinstance(val, (int, float)) else f"{val!r:>14}"
            if k in pp:
                diff = val - pp[k]
                flag = "  ✓" if abs(diff) < 0.10 else f"  ✗  (expected {pp[k]:,.2f}, diff {diff:+.2f})"
                print(f"    {k:<40} {val_str}{flag}")
            else:
                print(f"    {k:<40} {val_str}")

    missing = [k for k in pp if k not in r]
    if missing:
        print(f"\n  ⚠ pen_and_paper keys not found in result: {missing}")

    print()
    return r


# ── Edit this section to match your test scenario ────────────────────────────

if __name__ == "__main__":

    result = inspect(
        TaxInput(
            party_num=1,
            province="ON",
            age=40,
            eligible_for_disability="No",
            employed_income=100_000,
            self_employed_income=0,
            other_income=0,
            support_received=0,
            deductible_support_paid=15_417,
            child_care_expenses=0,
            other_deductions=0,
            children=[],
            type_of_splitting="SEPARATED",
            child_counts={"party1": 0, "party2": 0, "shared": 0},
            child_support_amounts={"party1": 0, "party2": 0},
            both_incomes={"party1": 100000, "party2": 20_000},
            year=2025,
        ),
        label="Party 1 — 50k employed, support paid 15,417",
        pen_and_paper={
            # Add your expected values here, e.g.:
            # "taxable_income": 34_583,
            # "federal_tax":    1_234.00,
            # "total_taxes":    5_000.00,
        },
    )


inp = TaxInput(
    # Who
    party_num=1,              # 1 or 2
    province="ON",            # only ON supported right now
    age=40,                   # person's age
    eligible_for_disability="No",  # "Yes" or "No"

    # Income
    employed_income=200000,       # T4 employment (line 10100)
    self_employed_income=0,        # net self-employment income
    other_income=0,                # investment, rental, etc.

    # Support
    support_received=0,            # spousal support received (taxable)
    deductible_support_paid=15_417, # spousal support paid (deductible)

    # Deductions
    child_care_expenses=0,
    other_deductions=0,

    # Children — one entry per child
    children=[
        ChildInfo(
            date_of_birth="2012-06-01",      # "YYYY-MM-DD"
            custody_arrangement="Party 2",   # "Party 1", "Party 2", or "Shared"
            child_has_disability="No",       # "Yes" or "No"
        )
    ],

    # Arrangement
    type_of_splitting="SEPARATED",  # "SEPARATED", "SHARED", "SPLIT", or "HYBRID"
    child_counts={"party1": 0, "party2": 1, "shared": 0},

    # Cross-party values (needed for CWB and child direction logic)
    child_support_amounts={"party1": 1068, "party2": 0},  # annual gross CS
    both_incomes={"party1": 190000, "party2": 20_000},   # guideline incomes

    year=2025,
)
print_excel_summary(inp, label="Party 1")
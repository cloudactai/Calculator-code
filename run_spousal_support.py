"""
run_spousal_support.py
----------------------
Manual test runner for both SSAG spousal support formulas.
Edit the INPUTS sections, then run:  python3 run_spousal_support.py

Inputs are after-tax (net) annual incomes in CAD, before child support
adjustments. For the with-children formula, also supply the monthly notional
child support (hypothetical table amount the recipient would owe if roles
were reversed).
"""

from spousal_support import (
    calculate_spousal_support_no_children,
    calculate_spousal_support_with_children,
    calculate_spousal_support_iterative,
    formula_for_calculating_duration_of_support,
    INDEFINITE_SENTINEL,
)
from tax import ChildInfo


# ===========================================================================
# INPUTS — NO CHILDREN
# ===========================================================================

nc_party1_name         = "Husband"
nc_party2_name         = "Wife"
nc_party1_gross_income = 90000   # gross annual income, CAD
nc_party2_gross_income = 0   # gross annual income, CAD
nc_years               = 10       # years of marriage / cohabitation
nc_recipient_age       = 35       # age of the lower-income spouse at separation


# ===========================================================================
# INPUTS — WITH CHILDREN
# ===========================================================================

wc_party1_name                    = "Husband"
wc_party2_name                    = "Wife"
wc_party1_net_income              = 90000   # after-tax annual income (before CS adjustment), CAD
wc_party2_net_income              =20000   # after-tax annual income (before CS adjustment), CAD
wc_monthly_child_support          = 841    # Table CS paid by payor (monthly)
wc_monthly_notional_child_support = 128      # Hypothetical CS recipient would owe if roles reversed (monthly)
wc_years                          = 10       # years of marriage / cohabitation
wc_recipient_age                  = 38       # age of the lower-income spouse at separation
wc_youngest_child_age             = 1       # age of the youngest child at separation


# ===========================================================================
# RUNNER — nothing to edit below here
# ===========================================================================

def print_result(r, title, extra_inputs=None):
    print()
    print("=" * 60)
    print(f"  {title}")
    print("=" * 60)

    print(f"\n  Inputs")
    if extra_inputs:
        for label, value in extra_inputs:
            print(f"    {label:<30}: {value}")

    print(f"\n  Parties")
    print(f"    Payor                         : {r.payor}")
    print(f"    Recipient                     : {r.recipient}")
    print(f"    Net income difference (adj.)  : {round(r.net_income_diff):>12,}")

    print(f"\n  Percentages applied to net income difference")
    print(f"    Low   ({r.pct_low:.2f}%)   : {round(r.annual_low):>12,} / yr   |   {round(r.monthly_low):>10,} / mo")
    print(f"    Mid   ({r.pct_med:.2f}%)   : {round(r.annual_med):>12,} / yr   |   {round(r.monthly_med):>10,} / mo")
    print(f"    High  ({r.pct_high:.2f}%)  : {round(r.annual_high):>12,} / yr   |   {round(r.monthly_high):>10,} / mo")

    print(f"\n  Duration")
    print(f"    {r.duration_label}")
    if r.duration_low != INDEFINITE_SENTINEL:
        print(f"    Low  : {r.duration_low} years")
        print(f"    High : {r.duration_high} years")

    print()


# --- No children ---
r_nc = calculate_spousal_support_no_children(
    party1_name=nc_party1_name,
    party2_name=nc_party2_name,
    party1_gross_income=nc_party1_gross_income,
    party2_gross_income=nc_party2_gross_income,
    years=nc_years,
    recipient_age=nc_recipient_age,
)

print_result(r_nc, "SSAG Spousal Support — Without Children", extra_inputs=[
    (f"{nc_party1_name} gross income",  f"{nc_party1_gross_income:>12,.2f}"),
    (f"{nc_party2_name} gross income",  f"{nc_party2_gross_income:>12,.2f}"),
    ("Years of cohabitation",           nc_years),
    ("Recipient age",                   nc_recipient_age),
])


# --- With children ---
r_wc = calculate_spousal_support_with_children(
    party1_name=wc_party1_name,
    party2_name=wc_party2_name,
    party1_net_income=wc_party1_net_income,
    party2_net_income=wc_party2_net_income,
    monthly_child_support=wc_monthly_child_support,
    monthly_notional_child_support=wc_monthly_notional_child_support,
    years=wc_years,
    recipient_age=wc_recipient_age,
    youngest_child_age=wc_youngest_child_age,
)

print_result(r_wc, "SSAG Spousal Support — With Children", extra_inputs=[
    (f"{wc_party1_name} net income",    f"{wc_party1_net_income:>12,.2f}"),
    (f"{wc_party2_name} net income",    f"{wc_party2_net_income:>12,.2f}"),
    ("Monthly child support",           f"{wc_monthly_child_support:>12,.2f}"),
    ("Monthly notional child support",  f"{wc_monthly_notional_child_support:>12,.2f}"),
    ("Years of cohabitation",           wc_years),
    ("Recipient age",                   wc_recipient_age),
    ("Youngest child age",              wc_youngest_child_age),
])


# ===========================================================================
# INPUTS — ITERATIVE WITH-CHILDREN (tax.py convergence)
# ===========================================================================

it_payor_gross       = 99000.0
it_recipient_gross   = 60000.0
it_payor_age         = 35
it_recipient_age     = 35
it_years             = 20
it_children          = [
    ChildInfo(date_of_birth="2022-01-01", custody_arrangement="Party 2", child_has_disability="No"),
]
it_child_counts      = {"party1": 0, "party2": 1, "shared": 0}
it_payor_is_party1   = True
it_province          = "ON"
it_year              = 2025


# --- Iterative with children ---
r_it = calculate_spousal_support_iterative(
    payor_gross=it_payor_gross,
    recipient_gross=it_recipient_gross,
    payor_age=it_payor_age,
    recipient_age=it_recipient_age,
    years=it_years,
    children=it_children,
    child_counts=it_child_counts,
    payor_is_party1=it_payor_is_party1,
    province=it_province,
    year=it_year,
)

print()
print("=" * 60)
print("  ITERATIVE WITH-CHILDREN FORMULA  (tax.py convergence)")
print("=" * 60)
print()
print("  Results")
print(f"  {'Rate':<12} {'Monthly':>10} {'Annual':>12}    {'Payor INDI':>12} {'Recip INDI':>12} {'Iters':>7}")
print(f"  {'─'*12} {'─'*10} {'─'*12}    {'─'*12} {'─'*12} {'─'*7}")
print(f"  {'Low 40%':<12} {r_it.monthly_low:>10,.0f} {r_it.annual_low:>12,.0f}    {r_it.payor_indi_low:>12,.0f} {r_it.recipient_indi_low:>12,.0f} {r_it.iterations_low:>7}")
print(f"  {'Mid 43%':<12} {r_it.monthly_mid:>10,.0f} {r_it.annual_mid:>12,.0f}    {r_it.payor_indi_mid:>12,.0f} {r_it.recipient_indi_mid:>12,.0f} {r_it.iterations_mid:>7}")
print(f"  {'High 46%':<12} {r_it.monthly_high:>10,.0f} {r_it.annual_high:>12,.0f}    {r_it.payor_indi_high:>12,.0f} {r_it.recipient_indi_high:>12,.0f} {r_it.iterations_high:>7}")
print(f"  Monthly CS paid: {r_it.monthly_cs_paid}")
print()
dur_low  = r_it.duration_low
dur_high = r_it.duration_high
if dur_low == INDEFINITE_SENTINEL:
    print("  Duration        : Indefinite")
else:
    print(f"  Duration        : {dur_low:.1f} – {dur_high:.1f} years")
print()
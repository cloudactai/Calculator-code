"""
run_spousal_support.py
----------------------
Manual test runner for the SSAG spousal support calculator (without-child formula).
Edit the INPUTS section, then run:  python3 run_spousal_support.py

Inputs are after-tax (net) annual incomes in CAD.
"""

from spousal_support import calculate_spousal_support, INDEFINITE_SENTINEL


# ===========================================================================
# INPUTS — edit this to match your scenario
# ===========================================================================

party1_name       = "Husband"
party2_name       = "Wife"
party1_net_income = 120000   # after-tax annual income, CAD
party2_net_income = 20000   # after-tax annual income, CAD
years             = 3      # years of marriage / cohabitation
recipient_age     = 32       # age of the lower-income spouse at separation


# ===========================================================================
# RUNNER — nothing to edit below here
# ===========================================================================

r = calculate_spousal_support(
    party1_name=party1_name,
    party2_name=party2_name,
    party1_net_income=party1_net_income,
    party2_net_income=party2_net_income,
    years=years,
    recipient_age=recipient_age,
)

print()
print("=" * 60)
print("  SSAG Spousal Support — Without-Child Formula")
print("=" * 60)

print(f"\n  Inputs")
print(f"    {party1_name:<30} net income: {party1_net_income:>12,.2f}")
print(f"    {party2_name:<30} net income: {party2_net_income:>12,.2f}")
print(f"    Years of cohabitation    : {years}")
print(f"    Recipient age            : {recipient_age}")

print(f"\n  Parties")
print(f"    Payor                    : {r.payor}")
print(f"    Recipient                : {r.recipient}")
print(f"    Net income difference    : {round(r.net_income_diff):>12,}")

print(f"\n  Percentages applied to net income difference")
print(f"    Low   ({r.pct_low:.2f}%)              : {round(r.annual_low):>12,} / yr   |   {round(r.monthly_low):>10,} / mo")
print(f"    Mid   ({r.pct_med:.2f}%)             : {round(r.annual_med):>12,} / yr   |   {round(r.monthly_med):>10,} / mo")
print(f"    High  ({r.pct_high:.2f}%)              : {round(r.annual_high):>12,} / yr   |   {round(r.monthly_high):>10,} / mo")

print(f"\n  Duration")
if r.duration_low == INDEFINITE_SENTINEL:
    print(f"    {r.duration_label}")
else:
    print(f"    {r.duration_label}")
    print(f"    Low  : {r.duration_low} years")
    print(f"    High : {r.duration_high} years")

print()

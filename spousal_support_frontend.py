"""
spousal_support_frontend.py
---------------------------
Runner / test harness for the SSAG spousal support calculators.
All calculation functions live in spousal_support.py.

HOW TO RUN
----------
    python3 spousal_support_frontend.py

INPUTS
------
Edit the INPUTS sections inside run_iterative() and run() below.
"""

from spousal_support import (
    INDEFINITE_SENTINEL,
    TaxChildInfo,
    calculate_spousal_support_iterative,
    calculate_spousal_support_acc_to_salary_diff,
    formula_for_calculating_duration_of_support,
    spousal_support_low_formula,
    spousal_support_mid_formula,
    spousal_support_high_formula,
    limit_for_spousal_high_exceeded,
)

INDEFINITE = INDEFINITE_SENTINEL


# ===========================================================================
# RUNNER — ITERATIVE
# ===========================================================================

def run_iterative():
    """
    Scenario 1 (from Excel screenshot):
      Party 1 gross $90,000 | Party 2 gross $20,000
      1 child, age 5, sole custody Party 2
      Party 1 pays CS $841/mo, notional CS for Party 2 = $128/mo
      10 years cohabitation | Recipient (Party 2) age 38
    Expected: Low $376 / Mid $643 / High $926 / month
    """
    year = 2025   # use available tax constants; swap to 2021 when those are added

    # Child aged 5 at time of separation → approximate DOB
    children = [
        TaxChildInfo(
            date_of_birth        = "2012-01-01",
            custody_arrangement  = "Party 2",   # sole custody Party 2
            child_has_disability = "No",
        )
    ]
    child_counts = {"party1": 0, "party2": 1, "shared": 0}
    
    r = calculate_spousal_support_iterative(
        payor_gross         = 90000,
        recipient_gross     = 20000,
        payor_age           = 35,
        recipient_age       = 35,
        years               = 15.0,
        children            = children,
        child_counts        = child_counts,
        # monthly_cs_paid     = 841.0,
        # monthly_notional_cs = 128.0,
        youngest_child_age  = 15.0,
        province            = "ON",
        year                = year,
        payor_is_party1     = True,  # payor ($170k) is UI Party 2
    )

    print()
    print("=" * 60)
    print("  ITERATIVE WITH-CHILDREN FORMULA  (tax.py convergence)")
    print("=" * 60)
    print(f"\n  Results")
    print(f"    {'Rate':<8} {'Monthly':>10} {'Annual':>12}  {'Payor INDI':>12}  {'Recip INDI':>12}  {'Iters':>6}")
    print(f"    {'-'*8} {'-'*10} {'-'*12}  {'-'*12}  {'-'*12}  {'-'*6}")
    print(f"    {'Low 40%':<8} {r.monthly_low:>10,.0f} {r.annual_low:>12,.0f}  {r.payor_indi_low:>12,.0f}  {r.recipient_indi_low:>12,.0f}  {r.iterations_low:>6}")
    print(f"    {'Mid 43%':<8} {r.monthly_mid:>10,.0f} {r.annual_mid:>12,.0f}  {r.payor_indi_mid:>12,.0f}  {r.recipient_indi_mid:>12,.0f}  {r.iterations_mid:>6}")
    print(f"    {'High 46%':<8} {r.monthly_high:>10,.0f} {r.annual_high:>12,.0f}  {r.payor_indi_high:>12,.0f}  {r.recipient_indi_high:>12,.0f}  {r.iterations_high:>6}")
    print(f"    Monthly CS paid: {r.monthly_cs_paid} ")

    if r.duration_low >= INDEFINITE:
        print(f"\n  Duration          : Indefinite")
    else:
        print(f"\n  Duration          : {round(r.duration_low,1)} – {round(r.duration_high,1)} years")
    print()


# ===========================================================================
# RUNNER — NON-ITERATIVE (frontend formula, net incomes as inputs)
# ===========================================================================

def print_duration(label: str, low: float, high: float) -> None:
    if low >= INDEFINITE:
        print(f"  {label}: Indefinite")
    else:
        print(f"  {label}: {round(low, 1)} – {round(high, 1)} years")


def run():
    print()
    print("=" * 60)
    print("  WITHOUT-CHILDREN FORMULA")
    print("  (calculateSpousalSupportAccToSalaryDiff)")
    print("=" * 60)

    # --- INPUTS: WITHOUT CHILDREN ---
    nc_gross_income1 = 65_000   # Party 1 gross income, CAD
    nc_gross_income2 = 30_000   # Party 2 gross income, CAD
    nc_years         = 25.0     # Years of cohabitation
    nc_party1_age    = 38.0     # ⚠️ Frontend uses Party 1's age here (should be recipient's)
    nc_recipient_age = 38.0     # Correct per documentation — not used by frontend in this path

    nc = calculate_spousal_support_acc_to_salary_diff(
        household_income1     = nc_gross_income1,
        household_income2     = nc_gross_income2,
        years_living_together = nc_years,
    )
    nc_dur = formula_for_calculating_duration_of_support(
        years_living_together        = nc_years,
        has_children                 = False,
        youngest_child_age           = 0.0,
        person_age_receiving_support = nc_recipient_age,
        party1_age                   = nc_party1_age,
    )

    print(f"\n  Gross income diff : {abs(nc_gross_income1 - nc_gross_income2):>12,.2f}")
    print(f"\n  Low   ({nc['pct_low']*100:.2f}%/yr)  : {nc['low_support']:>10,.2f} / mo")
    print(f"  Mid   ({nc['pct_med']*100:.4f}%/yr) : {nc['med_support']:>10,.2f} / mo")
    print(f"  High  ({nc['pct_high']*100:.2f}%/yr)  : {nc['high_support']:>10,.2f} / mo")
    print(f"\n  Duration:")
    print_duration("  Range", nc_dur[0], nc_dur[1])

    print()
    print("=" * 60)
    print("  WITH-CHILDREN FORMULA")
    print("  (spousalSupportFormulaByRate — INDI approach)")
    print("=" * 60)

    # --- INPUTS: WITH CHILDREN ---
    wc_payor_net_income               = 66_535.18  # Payor net income after tax, CAD/yr
    wc_recipient_net_income           = 33_006.25  # Recipient net income after tax, CAD/yr
    wc_monthly_child_support          = 841.0       # Table CS payor pays monthly
    wc_monthly_notional_child_support = 128.0       # Hypothetical CS recipient would owe (monthly)
    wc_years                          = 10.0
    wc_youngest_child_age             = 1.0
    wc_recipient_age                  = 38.0
    wc_party1_age                     = 38.0        # Only used in without-children path

    wc_disposable_income1 = wc_payor_net_income     - (wc_monthly_child_support          * 12)
    wc_disposable_income2 = wc_recipient_net_income - (wc_monthly_notional_child_support * 12)

    monthly_low  = spousal_support_low_formula(wc_disposable_income1, wc_disposable_income2)
    monthly_mid  = spousal_support_mid_formula(wc_disposable_income1, wc_disposable_income2)
    monthly_high = spousal_support_high_formula(wc_disposable_income1, wc_disposable_income2)

    wc_dur = formula_for_calculating_duration_of_support(
        years_living_together        = wc_years,
        has_children                 = True,
        youngest_child_age           = wc_youngest_child_age,
        person_age_receiving_support = wc_recipient_age,
        party1_age                   = wc_party1_age,
    )

    combined = wc_disposable_income1 + wc_disposable_income2
    print(f"\n  Payor net income  : {wc_payor_net_income:>12,.2f}")
    print(f"  CS paid (annual)  : {wc_monthly_child_support*12:>12,.2f}")
    print(f"  Payor INDI        : {wc_disposable_income1:>12,.2f}")
    print(f"\n  Recipient net inc : {wc_recipient_net_income:>12,.2f}")
    print(f"  Notional CS (ann) : {wc_monthly_notional_child_support*12:>12,.2f}")
    print(f"  Recipient INDI    : {wc_disposable_income2:>12,.2f}")
    print(f"  Combined INDI     : {combined:>12,.2f}")
    print(f"\n  Low   (40%)       : {monthly_low:>10,.2f} / mo  |  {monthly_low*12:>10,.2f} / yr")
    print(f"  Mid   (43%)       : {monthly_mid:>10,.2f} / mo  |  {monthly_mid*12:>10,.2f} / yr")
    print(f"  High  (46%)       : {monthly_high:>10,.2f} / mo  |  {monthly_high*12:>10,.2f} / yr")
    print(f"\n  Duration:")
    print_duration("  Range", wc_dur[0], wc_dur[1])

    ndi_cap = limit_for_spousal_high_exceeded(wc_disposable_income1, wc_disposable_income2)
    print(f"\n  NDI 50% cap check : {ndi_cap:>10,.2f} / mo")

    print()


if __name__ == "__main__":
    run_iterative()

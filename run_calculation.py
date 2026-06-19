"""
run_calculation.py
------------------
Fill in the values below and run:

    python run_calculation.py

Results will be printed to the terminal.
"""

import json
import math
from child_support import calculate_child_support

# ---------------------------------------------------------------------------
# Load the Schedule I table (must be in the same folder)
# ---------------------------------------------------------------------------
with open("schedule_i.json") as f:
    SCHEDULE_I = json.load(f)


# ---------------------------------------------------------------------------
# Helper — prints results in a readable format
# ---------------------------------------------------------------------------
def run(label, **kwargs):
    print()
    print("=" * 60)
    print(f"  {label}")
    print("=" * 60)

    # Echo back the inputs so you can see exactly what was used
    print("\nINPUTS")
    print(f"  Party 1 income     : ${kwargs['party1_guideline_income']:>12,.2f}")
    print(f"  Party 2 income     : ${kwargs['party2_guideline_income']:>12,.2f}")
    print(f"  Party 1 province   : {kwargs['party1_province']}")
    print(f"  Party 2 province   : {kwargs['party2_province']}")
    print(f"  Splitting type     : {kwargs['type_of_splitting']}")
    cc = kwargs["child_counts"]
    print(f"  Children (P1/P2/Shared): {cc['party1']} / {cc['party2']} / {cc['shared']}")
    print(f"  Children list      : {kwargs['children']}")

    try:
        result = calculate_child_support(
            children=kwargs["children"],
            party1_guideline_income=kwargs["party1_guideline_income"],
            party2_guideline_income=kwargs["party2_guideline_income"],
            party1_province=kwargs["party1_province"],
            party2_province=kwargs["party2_province"],
            type_of_splitting=kwargs["type_of_splitting"],
            child_counts=kwargs["child_counts"],
            schedule_i_data=SCHEDULE_I,
        )

        print("\nRESULTS")
        print(f"  Party 1 gross monthly CS : ${result['party1']:>10,}")
        print(f"  Party 2 gross monthly CS : ${result['party2']:>10,}")
        print(f"  Party 1 gross annual CS  : ${result['party1'] * 12:>10,}")
        print(f"  Party 2 gross annual CS  : ${result['party2'] * 12:>10,}")

        ref = result["child_support_ref"]
        print(f"\n  child_support_ref party1 : ${ref['party1']:>10,}/month  (positive = pays)")
        print(f"  child_support_ref party2 : ${ref['party2']:>10,}/month  (negative = receives)")

        notional = result["notional_amount_ref"]
        print(f"\n  notional party1 (monthly): ${notional['party1']:>10,}")
        print(f"  notional party2 (monthly): ${notional['party2']:>10,}")

        # Net monthly payment and direction
        net_monthly = ref['party1'] - ref['party2']
        if net_monthly > 0:
            payer, payee = "Party 1", "Party 2"
        elif net_monthly < 0:
            payer, payee = "Party 2", "Party 1"
            net_monthly = abs(net_monthly)
        else:
            payer, payee = None, None

        print(f"\n  {'─' * 44}")
        if payer:
            print(f"  NET CHILD SUPPORT : {payer} pays {payee}  ${net_monthly:>8,}/month  (${net_monthly * 12:,}/year)")
        else:
            print(f"  NET CHILD SUPPORT : $0/month (amounts offset)")

    except ValueError as e:
        print(f"\n  ERROR: {e}")


# ===========================================================================
# SCENARIO 1 — SEPARATED
# All children live with Party 2. Party 1 pays.
# Change the values below to match your case.
# ===========================================================================
run(
    "SCENARIO 1 — SEPARATED (all children with Party 2)",

    party1_guideline_income = 90000,
    party2_guideline_income = 20000,
    party1_province         = "ON",
    party2_province         = "ON",

    type_of_splitting = "SEPARATED",

    child_counts = {
        "party1": 0,
        "party2": 1,
        "shared": 0,
        "party1WithAdultChild": 0,
        "party2WithAdultChild": 0,
    },

    # One dict per child.
    # csg_table: "No" = normal Schedule I table
    #            "Yes" = use child_support_override amount instead
    # child_support_override: monthly dollar amount (only used when csg_table = "Yes")
    # custody_arrangement: "Party 1" | "Party 2" | "Shared"
    children = [
        {"csg_table": "No", "child_support_override": 0, "custody_arrangement": "Party 2"},
        # {"csg_table": "No", "child_support_override": 0, "custody_arrangement": "Party 1"},
    ],
)
"""
child_support.py
----------------
Ontario Schedule I child support calculator — Python port of the
TypeScript/React logic in cloudact-frontend-main.

The TypeScript source is the single source of truth.  Known bugs in the
source are ported faithfully and flagged with  ⚠ BUG (SOURCE).

Public API
----------
calculate_child_support(...) -> dict
    Main entry point.  Returns annual amounts for both parties.

All other functions are helpers exposed so they can be unit-tested
individually.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class ChildInfo:
    """
    Mirrors the `childInfo` shape used by the TypeScript frontend.

    Only the fields required for Schedule I calculation are included.
    """
    name: str
    csg_table: str                 # "Yes" | "No"
    child_support_override: float  # monthly override; only used when csg_table == "Yes"
    custody_arrangement: str       # "Party 1" | "Party 2" | "Shared"


@dataclass
class ChildSupportInput:
    """
    Convenience wrapper for all inputs to calculate_child_support().

    ``party1_guideline_income`` and ``party2_guideline_income`` must already
    include regular income + Schedule III adjustments + non-taxable income
    (line 14700).  The caller is responsible for that summation.
    """
    party1_province: str
    party2_province: str
    party1_guideline_income: float
    party2_guideline_income: float
    children: list[ChildInfo]
    type_of_splitting: str          # "SEPARATED"|"SHARED"|"SPLIT"|"HYBRID"
    child_counts: dict              # {party1, party2, shared,
                                    #  party1WithAdultChild, party2WithAdultChild}
    schedule_i_data: list[dict]     # full Schedule I table rows


# ---------------------------------------------------------------------------
# Function 1 — replace_last_three_chars
# ---------------------------------------------------------------------------

def replace_last_three_chars(income: str) -> int:
    """
    Floor *income* DOWN to the nearest $1,000 for Schedule I table lookup.

    Source: ``utils/helpers.js`` → ``replaceLastThreeChars``

    TypeScript original:
        const allNumbersExceptLastThree = number.substring(0, number.length - 3);
        return parseInt(allNumbersExceptLastThree + "000");

    Examples
    --------
    >>> replace_last_three_chars("75400")
    75000
    >>> replace_last_three_chars("150001")
    150000
    >>> replace_last_three_chars("50000.99")
    50000
    """
    # Truncate any decimal portion first (matching parseInt behaviour).
    as_int_str = str(int(float(income)))
    return int(as_int_str[:-3] + "000") if len(as_int_str) > 3 else 0


# ---------------------------------------------------------------------------
# Function 2 — fetch_child_support_details
# ---------------------------------------------------------------------------

def fetch_child_support_details(
    data: list[dict],
    income: str,
    num_children: int,
    province: str,
) -> dict:
    """
    Filter the Schedule I table for the row that matches *income*,
    *num_children*, and *province*.

    Source: ``pages/calculator/screen4/childInfo.service.ts``
            → ``fetchChildSupportDetails``

    Parameters
    ----------
    data:
        Full Schedule I table as a list of dicts.  Each dict must have at
        least the keys ``no_of_Children``, ``province``, ``income_over``,
        ``basic``, ``rate``.
    income:
        Guideline income as a string (may include decimals; will be floored).
    num_children:
        Number of children for this lookup (may already have overrides
        subtracted by the caller).
    province:
        Two-letter province code, e.g. ``"ON"``.

    Returns
    -------
    dict
        The single matching Schedule I row.

    Raises
    ------
    ValueError
        If no matching row is found (bad income / province / child-count
        combination).
    """
    income_over = replace_last_three_chars(income)

    # The 2025 Schedule I table starts at $16,000.
    # Incomes below that threshold carry no table-based support obligation.
    if income_over < 16_000:
        return {"no_of_Children": num_children, "province": province,
                "income_over": 0, "basic": 0.0, "rate": 0.0, "from": 0, "To": 11999}

    # Cap at $149,000 — the 2021 Schedule I table tops out at the $149,000 band.
    # Incomes above $149,999 are high-income cases handled by Section 4 of the
    # Guidelines; we use the last table row as the floor for the formula.
    if income_over > 149_000:
        income_over = 149_000

    matches = [
        row for row in data
        if row["no_of_Children"] == num_children
        and row["province"] == province
        and row["income_over"] == income_over
    ]

    if not matches:
        raise ValueError(
            f"No Schedule I row found for "
            f"income_over={income_over}, num_children={num_children}, "
            f"province={province!r}"
        )

    return matches[0]


# ---------------------------------------------------------------------------
# Function 3 — formula_for_child_support
# ---------------------------------------------------------------------------

def formula_for_child_support(
    basic: float,
    total_income_party: float,
    income_over: float,
    rate: float,
) -> float:
    """
    Core Schedule I math.

    Source: ``utils/helpers/calculator/taxCalculationFormula.ts``
            → ``formulaForChildSupport``

    Formula:
        result = basic + (total_income_party - income_over) * (rate / 100)
        return max(result, 0)

    Returns a *monthly* dollar amount.

    Examples
    --------
    >>> round(formula_for_child_support(100, 75_400, 75_000, 1.22), 2)
    104.88
    """
    result = basic + (total_income_party - income_over) * (rate / 100)
    return max(result, 0.0)


# ---------------------------------------------------------------------------
# Function 4 — csg_override_values
# ---------------------------------------------------------------------------

def csg_override_values(children: list[dict | ChildInfo]) -> list[float]:
    """
    Return the monthly override amounts for children who bypass the Schedule I
    table (``csg_table == "Yes"`` and ``child_support_override > 0``).

    Source: ``pages/calculator/screen2/Screen2.ts`` → ``CSGOverrideValues``

    ⚠ BUG (SOURCE): The ``partyNum`` parameter and ``custodyArrangement``
    filter are dead code (commented out in the original).  Both parties
    therefore receive an identical list of ALL override children.
    This bug is ported faithfully — do NOT add party filtering here.

    Parameters
    ----------
    children:
        List of child records.  Accepts either ``ChildInfo`` dataclass
        instances or plain dicts with snake_case keys
        (``csg_table``, ``child_support_override``).

    Returns
    -------
    list[float]
        Monthly override amounts (one entry per qualifying child).
    """
    result: list[float] = []
    for child in children:
        if isinstance(child, ChildInfo):
            csg_table = child.csg_table
            override = child.child_support_override
        else:
            csg_table = child["csg_table"]
            override = child["child_support_override"]

        if csg_table == "Yes" and override > 0:
            result.append(float(override))

    return result


# ---------------------------------------------------------------------------
# Function 5 — determine_type_of_splitting
# ---------------------------------------------------------------------------

def determine_type_of_splitting(
    num_children: dict,
    total_children: int,
) -> str:
    """
    Determine the splitting arrangement from the child-count breakdown.

    Source: ``pages/calculator/screen4/Screen4.ts``
            → ``determineTypeOfSplitting``

    Parameters
    ----------
    num_children:
        Dict with keys ``party1``, ``party2``, ``shared``,
        ``party1WithAdultChild``, ``party2WithAdultChild``.
    total_children:
        Total number of relevant children
        (``party1 + party2 + shared`` typically).

    Returns
    -------
    str
        One of ``"HYBRID"``, ``"SHARED"``, ``"SEPARATED"``, ``"SPLIT"``.

    Examples
    --------
    >>> determine_type_of_splitting(
    ...     {"party1": 1, "party2WithAdultChild": 1, "shared": 1,
    ...      "party1WithAdultChild": 0, "party2": 0}, 2)
    'HYBRID'
    >>> determine_type_of_splitting(
    ...     {"party1": 0, "party2": 0, "shared": 2,
    ...      "party1WithAdultChild": 0, "party2WithAdultChild": 0}, 2)
    'SHARED'
    >>> determine_type_of_splitting(
    ...     {"party1": 0, "party2": 2, "shared": 0,
    ...      "party1WithAdultChild": 0, "party2WithAdultChild": 0}, 2)
    'SEPARATED'
    >>> determine_type_of_splitting(
    ...     {"party1": 1, "party2": 1, "shared": 0,
    ...      "party1WithAdultChild": 0, "party2WithAdultChild": 0}, 2)
    'SPLIT'
    """
    p1_adult = num_children.get("party1WithAdultChild", 0)
    p2_adult = num_children.get("party2WithAdultChild", 0)
    shared = num_children.get("shared", 0)
    party1 = num_children.get("party1", 0)
    party2 = num_children.get("party2", 0)

    if (p1_adult > 0 or p2_adult > 0) and shared > 0:
        return "HYBRID"

    if shared > 0:
        return "SHARED"

    if total_children != 0:
        if party1 == 0 and party2 == total_children:
            return "SEPARATED"
        elif party2 == 0 and party1 == total_children:
            return "SEPARATED"

    return "SPLIT"


# ---------------------------------------------------------------------------
# Function 6 — number_of_children_for_cs
# ---------------------------------------------------------------------------

def number_of_children_for_cs(
    child_counts: dict,
    type_of_splitting: str,
    party_num: int,
) -> int:
    """
    Return the child count to use when looking up a party's Schedule I amount.

    Source: ``pages/calculator/screen2/Screen2.tsx``
            → ``numberOfChildrenForCalculatingChildSupport``

    CRITICAL: For SPLIT and HYBRID the lookup uses the *other* party's
    children (the swap reflects the cross-payment obligation).

    Parameters
    ----------
    child_counts:
        Dict with at least ``party1``, ``party2``, ``shared`` keys.
    type_of_splitting:
        One of ``"SEPARATED"``, ``"SHARED"``, ``"SPLIT"``, ``"HYBRID"``.
    party_num:
        1 or 2.

    Returns
    -------
    int
        Number of children to use for the Schedule I table lookup.

    Examples
    --------
    >>> number_of_children_for_cs(
    ...     {"party1": 1, "party2": 2, "shared": 0}, "SPLIT", 1)
    2
    >>> number_of_children_for_cs(
    ...     {"party1": 1, "party2": 2, "shared": 0}, "SPLIT", 2)
    1
    >>> number_of_children_for_cs(
    ...     {"party1": 0, "party2": 2, "shared": 0}, "SEPARATED", 1)
    2
    """
    if type_of_splitting in ("SPLIT", "HYBRID"):
        # Swap: party1 looks up party2's count and vice versa.
        return child_counts["party2"] if party_num == 1 else child_counts["party1"]
    else:
        # SEPARATED | SHARED — use total children.
        return (
            child_counts["party1"]
            + child_counts["party2"]
            + child_counts["shared"]
        )


# ---------------------------------------------------------------------------
# Function 7 — maximum_child_lives_with
# ---------------------------------------------------------------------------

def maximum_child_lives_with(
    count: dict,
    cs_p1: float,
    cs_p2: float,
    income_p1: float,
    income_p2: float,
    party_num: int,
) -> int:
    """
    Determine which party "holds" the children for credit / payment assignment.

    Source: ``utils/helpers/calculator/creditTaxCalculationFormulas.ts``
            → ``maximumChildLivesWith``

    Return values
    -------------
    0  — no children (total == 0) or tie with no income difference
    1  — party1 holds the children (party2 pays)
    2  — party2 holds the children (party1 pays)
    4  — tie: both parties have exclusive children (SPLIT equal case)

    Parameters
    ----------
    count:
        Dict with ``party1``, ``party2``, ``shared`` keys.
    cs_p1, cs_p2:
        *Annual* gross child support amounts for each party
        (used as tiebreaker in the SHARED case).
    income_p1, income_p2:
        Guideline income for each party
        (secondary tiebreaker in the SHARED case).
    party_num:
        1 or 2 — relevant for SEPARATED / SPLIT majority branch.
    """
    party1 = count.get("party1", 0)
    party2 = count.get("party2", 0)
    shared = count.get("shared", 0)
    total = party1 + party2 + shared

    if total == 0:
        return 0

    # HYBRID: at least one exclusive child AND at least one shared child.
    if (party1 > 0 or party2 > 0) and shared > 0:
        return 1 if party1 > party2 else 2

    # All children are shared (SHARED case).
    if total == shared:
        if cs_p1 > cs_p2:
            return 2   # party1 pays more → children "with" party2
        elif cs_p2 > cs_p1:
            return 1   # party2 pays more → children "with" party1

        # Income tiebreaker.
        if income_p1 > income_p2:
            return 2
        elif income_p2 > income_p1:
            return 1
        else:
            return 0

    # SEPARATED / SPLIT — majority parenting or equal split.
    if party1 > 0 and party_num == 1:
        return 1
    elif party2 > 0 and party_num == 2:
        return 2
    elif party1 == party2 or (party1 > 0 and party2 > 0):
        return 4

    # Fallback (should not be reached in normal usage).
    return 0  # pragma: no cover


# ---------------------------------------------------------------------------
# Function 8 — calculate_child_support  (main orchestrator)
# ---------------------------------------------------------------------------

def calculate_child_support(
    children: list[dict | ChildInfo],
    party1_guideline_income: float,
    party2_guideline_income: float,
    party1_province: str,
    party2_province: str,
    type_of_splitting: str,
    child_counts: dict,
    schedule_i_data: list[dict],
) -> dict:
    """
    Main Schedule I child support calculation.

    Source: ``pages/calculator/screen2/Screen2.tsx`` → ``calculateChildSupport``

    Parameters
    ----------
    children:
        List of child records.  Each item is either a ``ChildInfo`` dataclass
        or a plain dict with keys ``csg_table`` and ``child_support_override``.
    party1_guideline_income, party2_guideline_income:
        Combined guideline income for each party (regular income +
        Schedule III adjustments + non-taxable income).  The caller must sum
        these before passing them in.
    party1_province, party2_province:
        Two-letter province codes, e.g. ``"ON"``.
    type_of_splitting:
        One of ``"SEPARATED"``, ``"SHARED"``, ``"SPLIT"``, ``"HYBRID"``.
    child_counts:
        Dict with keys ``party1``, ``party2``, ``shared``,
        ``party1WithAdultChild``, ``party2WithAdultChild``.
    schedule_i_data:
        Full Schedule I table as a list of dicts (all provinces / children
        counts / income bands).

    Returns
    -------
    dict with keys:
        ``party1``              — party1 gross annual child support
        ``party2``              — party2 gross annual child support
        ``child_support_ref``   — net payment direction
                                  {party1: amount, party2: amount}
                                  (SHARED: party1 positive, party2 negative)
        ``notional_amount_ref`` — phantom annual amount used in spousal
                                  support calculation
                                  {party1: amount, party2: amount}

    Known bugs ported faithfully
    ----------------------------
    1. ``csg_override_values`` ignores party — both parties return the same
       list (partyNum filter is commented out in source).
    2. Notional lookups do NOT subtract override count (only actual
       ``res1`` / ``res2`` lookups do).
    3. SHARED ``child_support_ref`` uses the *difference* (paid_by), not
       each party's gross amount.  Party2's value is stored as negative.
    """

    # ------------------------------------------------------------------
    # Step 1: CSG override lists
    # ------------------------------------------------------------------
    overrides_p1 = csg_override_values(children)
    overrides_p2 = csg_override_values(children)

    # ------------------------------------------------------------------
    # Step 2: Four Schedule I lookups
    # ------------------------------------------------------------------
    children_for_p1 = number_of_children_for_cs(child_counts, type_of_splitting, 1)
    children_for_p2 = number_of_children_for_cs(child_counts, type_of_splitting, 2)

    # Actual lookups — subtract override count.
    res1 = fetch_child_support_details(
        schedule_i_data,
        str(int(party1_guideline_income)),
        children_for_p1 - len(overrides_p1),
        party1_province,
    )
    res2 = fetch_child_support_details(
        schedule_i_data,
        str(int(party2_guideline_income)),
        children_for_p2 - len(overrides_p2),
        party2_province,
    )

    # Notional lookups — NO override subtraction (⚠ BUG (SOURCE) #2).
    # Note the argument swap: notional1 uses party2's child count, and
    # notional2 uses party1's child count.
    notional1 = fetch_child_support_details(
        schedule_i_data,
        str(int(party1_guideline_income)),
        children_for_p2,   # party2's count, no override deduction
        party1_province,
    )
    notional2 = fetch_child_support_details(
        schedule_i_data,
        str(int(party2_guideline_income)),
        children_for_p1,   # party1's count, no override deduction
        party2_province,
    )

    # ------------------------------------------------------------------
    # Step 3: Monthly amounts
    # ------------------------------------------------------------------
    cs_p1_monthly = formula_for_child_support(
        res1["basic"],
        party1_guideline_income,
        res1["income_over"],
        res1["rate"],
    )
    cs_p2_monthly = formula_for_child_support(
        res2["basic"],
        party2_guideline_income,
        res2["income_over"],
        res2["rate"],
    )

    # Absolute difference — used only in SHARED branch.
    paid_by_monthly = abs(cs_p1_monthly - cs_p2_monthly)

    notional_p1_monthly = formula_for_child_support(
        notional1["basic"],
        party1_guideline_income,
        notional1["income_over"],
        notional1["rate"],
    )
    notional_p2_monthly = formula_for_child_support(
        notional2["basic"],
        party2_guideline_income,
        notional2["income_over"],
        notional2["rate"],
    )

    # ------------------------------------------------------------------
    # Step 4: maximumChildLivesWith — called AFTER gross amounts are known.
    # Pass annual CS amounts so the SHARED tiebreaker works correctly.
    # ------------------------------------------------------------------
    lives_with_p1 = maximum_child_lives_with(
        child_counts,
        cs_p1_monthly * 12,
        cs_p2_monthly * 12,
        party1_guideline_income,
        party2_guideline_income,
        party_num=1,
    )
    lives_with_p2 = maximum_child_lives_with(
        child_counts,
        cs_p1_monthly * 12,
        cs_p2_monthly * 12,
        party1_guideline_income,
        party2_guideline_income,
        party_num=2,
    )

    override_sum_p1 = sum(overrides_p1)
    override_sum_p2 = sum(overrides_p2)

    # ------------------------------------------------------------------
    # Step 5: High Case (marginal tax gross-up) — NOT ported.
    # Dividing by 1.0 is a no-op, preserving the same arithmetic path.
    # ------------------------------------------------------------------
    # marginal_reciprocal_tax_p1 = 1.0
    # marginal_reciprocal_tax_p2 = 1.0

    # ------------------------------------------------------------------
    # Step 6: Scenario branches
    # ------------------------------------------------------------------
    if type_of_splitting == "SHARED":
        notional_amount_ref = {"party1": 0.0, "party2": 0.0}

        # ⚠ BUG (SOURCE) #3: uses *difference* not gross; party2 is negative.
        child_support_ref = {
            "party1": +(paid_by_monthly + override_sum_p1),
            "party2": -(paid_by_monthly + override_sum_p2),
        }

    else:  # SEPARATED | SPLIT | HYBRID
        notional_amount_ref = {
            "party1": notional_p1_monthly if lives_with_p1 == 1 else 0.0,
            "party2": notional_p2_monthly if lives_with_p2 == 2 else 0.0,
        }

        gross = {
            "party1": cs_p1_monthly + override_sum_p1,
            "party2": cs_p2_monthly + override_sum_p2,
        }

        child_support_ref = {
            "party1": gross["party1"] if lives_with_p2 == 2 else 0.0,
            "party2": gross["party2"] if lives_with_p1 == 1 else 0.0,
        }

    # ------------------------------------------------------------------
    # Step 7: Return  (monthly amounts, rounded up to whole dollars)
    # ------------------------------------------------------------------
    return {
        # Gross monthly amounts regardless of direction.
        "party1": math.ceil(cs_p1_monthly + override_sum_p1),
        "party2": math.ceil(cs_p2_monthly + override_sum_p2),
        # Net payment direction (who pays whom) — monthly.
        "child_support_ref": {
            "party1": math.ceil(child_support_ref["party1"]),
            "party2": math.ceil(child_support_ref["party2"]),
        },
        # Phantom amount used in spousal support iteration — monthly.
        "notional_amount_ref": {
            "party1": math.ceil(notional_amount_ref["party1"]),
            "party2": math.ceil(notional_amount_ref["party2"]),
        },
    }


# ---------------------------------------------------------------------------
# Convenience wrapper
# ---------------------------------------------------------------------------

def calculate_child_support_from_input(inp: ChildSupportInput) -> dict:
    """
    Thin wrapper that accepts a ``ChildSupportInput`` dataclass instead of
    individual keyword arguments.
    """
    return calculate_child_support(
        children=inp.children,
        party1_guideline_income=inp.party1_guideline_income,
        party2_guideline_income=inp.party2_guideline_income,
        party1_province=inp.party1_province,
        party2_province=inp.party2_province,
        type_of_splitting=inp.type_of_splitting,
        child_counts=inp.child_counts,
        schedule_i_data=inp.schedule_i_data,
    )

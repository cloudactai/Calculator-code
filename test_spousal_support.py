"""
test_spousal_support.py
-----------------------
Unit tests for spousal_support.py — SSAG without-child formula only.

HOW TO USE
----------
    python3 -m pytest test_spousal_support.py -v
    # or
    python3 test_spousal_support.py

COVERAGE
--------
- Payor/recipient assignment (higher earner pays)
- Quantum calculations (low / mid / high)
- Percentage cap at 50% (long marriages)
- Duration: definite range
- Duration: Rule of 65 (age + years >= 65)
- Duration: long marriage (>= 20 years)
- Edge cases: equal incomes, zero income recipient, very short marriage
- Input validation: zero/negative years, negative income
"""

import math
import pytest

from spousal_support import (
    calculate_spousal_support,
    calculate_spousal_support_iterative,
    _applicable_percentages,
    _duration,
    INDEFINITE_SENTINEL,
    SpousalSupportResult,
    IterativeResult,
)
from tax import ChildInfo as TaxChildInfo

TOLERANCE = 0.01   # dollars


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def approx(a: float, b: float) -> bool:
    return math.isclose(a, b, abs_tol=TOLERANCE)


# ---------------------------------------------------------------------------
# _applicable_percentages
# ---------------------------------------------------------------------------

class TestApplicablePercentages:

    def test_10_years(self):
        low, med, high = _applicable_percentages(10)
        assert approx(low,  0.15)
        assert approx(med,  0.175)
        assert approx(high, 0.20)

    def test_25_years(self):
        low, med, high = _applicable_percentages(25)
        assert approx(low,  0.375)
        assert approx(med,  0.4375)
        assert approx(high, 0.50)

    def test_cap_at_50_percent(self):
        """All three rates must be capped at 50% once years is large enough."""
        low, med, high = _applicable_percentages(35)
        assert approx(low,  0.50)
        assert approx(med,  0.50)
        assert approx(high, 0.50)

    def test_low_caps_at_years_33_plus(self):
        """Low rate (1.5%/yr) hits 50% at year 33.33..."""
        low, _, _ = _applicable_percentages(34)
        assert approx(low, 0.50)

    def test_fractional_years(self):
        low, med, high = _applicable_percentages(7.5)
        assert approx(low,  0.1125)
        assert approx(med,  0.13125)
        assert approx(high, 0.15)


# ---------------------------------------------------------------------------
# _duration
# ---------------------------------------------------------------------------

class TestDuration:

    def test_definite_duration(self):
        """10-year marriage, recipient age 45 → definite (45+10=55 < 65)."""
        dur_low, dur_high, label = _duration(10, 45)
        assert approx(dur_low,  5.0)
        assert approx(dur_high, 10.0)
        assert "5" in label and "10" in label

    def test_rule_of_65(self):
        """Rule of 65: age 55 + 10 years = 65 → indefinite."""
        dur_low, dur_high, label = _duration(10, 55)
        assert dur_low  == INDEFINITE_SENTINEL
        assert dur_high == INDEFINITE_SENTINEL
        assert "Indefinite" in label

    def test_rule_of_65_just_over(self):
        """age 56 + 10 years = 66 → indefinite."""
        dur_low, dur_high, label = _duration(10, 56)
        assert dur_low == INDEFINITE_SENTINEL

    def test_long_marriage_20_years(self):
        """Exactly 20 years → indefinite."""
        dur_low, dur_high, label = _duration(20, 40)
        assert dur_low  == INDEFINITE_SENTINEL
        assert dur_high == INDEFINITE_SENTINEL
        assert "Indefinite" in label

    def test_long_marriage_just_under_20(self):
        """19 years, age 30 → 30+19=49 < 65 → definite."""
        dur_low, dur_high, label = _duration(19, 30)
        assert approx(dur_low,  9.5)
        assert approx(dur_high, 19.0)

    def test_duration_label_definite_format(self):
        _, _, label = _duration(8, 40)
        # Should be "4.0 – 8.0 years" format
        assert "–" in label or "-" in label
        assert "years" in label


# ---------------------------------------------------------------------------
# calculate_spousal_support — quantum
# ---------------------------------------------------------------------------

class TestQuantum:

    def test_basic_scenario(self):
        """
        party1 net = 65 000, party2 net = 30 000, years = 25
        Expected from docs:
          pct_low=37.5%, pct_med=43.75%, pct_high=50.0%
          annual_low=13 125, annual_med=15 312.5, annual_high=17 500
          monthly_low≈1 093.75, monthly_med≈1 276.04, monthly_high≈1 458.33
        """
        r = calculate_spousal_support(
            party1_name="Husband",
            party2_name="Wife",
            party1_gross_income=65_000,
            party2_gross_income=30_000,
            years=25,
            recipient_age=45,
        )
        assert r.payor     == "Husband"
        assert r.recipient == "Wife"
        assert approx(r.net_income_diff, 35_000)
        assert approx(r.pct_low,   37.5)
        assert approx(r.pct_med,   43.75)
        assert approx(r.pct_high,  50.0)
        assert approx(r.annual_low,   13_125.0)
        assert approx(r.annual_med,   15_312.5)
        assert approx(r.annual_high,  17_500.0)
        assert approx(r.monthly_low,   1_093.75)
        assert approx(r.monthly_med,   1_276.04)
        assert approx(r.monthly_high,  1_458.33)

    def test_payor_recipient_flipped_when_party2_earns_more(self):
        """If party2 earns more, party2 becomes payor."""
        r = calculate_spousal_support(
            party1_name="Alice",
            party2_name="Bob",
            party1_gross_income=40_000,
            party2_gross_income=100_000,
            years=10,
            recipient_age=40,
        )
        assert r.payor     == "Bob"
        assert r.recipient == "Alice"
        assert approx(r.net_income_diff, 60_000)

    def test_equal_incomes_zero_support(self):
        """Equal net incomes → zero support at all levels."""
        r = calculate_spousal_support(
            party1_name="A",
            party2_name="B",
            party1_gross_income=80_000,
            party2_gross_income=80_000,
            years=12,
            recipient_age=40,
        )
        assert r.net_income_diff == 0.0
        assert r.annual_low  == 0.0
        assert r.annual_med  == 0.0
        assert r.annual_high == 0.0
        assert r.monthly_low  == 0.0
        assert r.monthly_med  == 0.0
        assert r.monthly_high == 0.0

    def test_zero_income_recipient(self):
        """Recipient has $0 income — full payor income drives the diff."""
        r = calculate_spousal_support(
            party1_name="Earner",
            party2_name="NonEarner",
            party1_gross_income=120_000,
            party2_gross_income=0,
            years=10,
            recipient_age=40,
        )
        assert approx(r.net_income_diff, 120_000)
        # 10 years → low pct = 15%, high pct = 20%
        assert approx(r.annual_low,  18_000.0)
        assert approx(r.annual_high, 24_000.0)

    def test_percentage_cap_long_marriage(self):
        """35-year marriage: all percentages should be capped at 50%."""
        r = calculate_spousal_support(
            party1_name="X",
            party2_name="Y",
            party1_gross_income=100_000,
            party2_gross_income=60_000,
            years=35,
            recipient_age=50,
        )
        assert approx(r.pct_low,  50.0)
        assert approx(r.pct_med,  50.0)
        assert approx(r.pct_high, 50.0)
        # All three annual amounts should be equal when all pcts are 50%
        assert approx(r.annual_low, r.annual_high)

    def test_monthly_equals_annual_divided_by_12(self):
        """monthly = annual / 12 for all three bands."""
        r = calculate_spousal_support(
            party1_name="P",
            party2_name="Q",
            party1_gross_income=90_000,
            party2_gross_income=50_000,
            years=8,
            recipient_age=38,
        )
        assert approx(r.monthly_low,  r.annual_low  / 12)
        assert approx(r.monthly_med,  r.annual_med  / 12)
        assert approx(r.monthly_high, r.annual_high / 12)


# ---------------------------------------------------------------------------
# calculate_spousal_support — duration
# ---------------------------------------------------------------------------

class TestDurationIntegration:

    def test_indefinite_rule_of_65(self):
        """age 55 + 10 years = 65 → Indefinite."""
        r = calculate_spousal_support(
            party1_name="A", party2_name="B",
            party1_gross_income=80_000, party2_gross_income=40_000,
            years=10, recipient_age=55,
        )
        assert r.duration_low  == INDEFINITE_SENTINEL
        assert r.duration_high == INDEFINITE_SENTINEL
        assert "Indefinite" in r.duration_label

    def test_indefinite_long_marriage(self):
        """20-year marriage → Indefinite regardless of age."""
        r = calculate_spousal_support(
            party1_name="A", party2_name="B",
            party1_gross_income=80_000, party2_gross_income=40_000,
            years=20, recipient_age=35,
        )
        assert r.duration_low  == INDEFINITE_SENTINEL
        assert "Indefinite" in r.duration_label

    def test_definite_duration_range(self):
        """10-year marriage, age 40 → 5–10 year range."""
        r = calculate_spousal_support(
            party1_name="A", party2_name="B",
            party1_gross_income=80_000, party2_gross_income=40_000,
            years=10, recipient_age=40,
        )
        assert approx(r.duration_low,  5.0)
        assert approx(r.duration_high, 10.0)
        assert "Indefinite" not in r.duration_label

    def test_short_marriage_duration(self):
        """3-year marriage → 1.5–3.0 year range."""
        r = calculate_spousal_support(
            party1_name="A", party2_name="B",
            party1_gross_income=80_000, party2_gross_income=40_000,
            years=3, recipient_age=30,
        )
        assert approx(r.duration_low,  1.5)
        assert approx(r.duration_high, 3.0)


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

class TestValidation:

    def test_zero_years_raises(self):
        with pytest.raises(ValueError, match="[Yy]ears"):
            calculate_spousal_support("A", "B", 80_000, 40_000, years=0, recipient_age=40)

    def test_negative_years_raises(self):
        with pytest.raises(ValueError):
            calculate_spousal_support("A", "B", 80_000, 40_000, years=-5, recipient_age=40)

    def test_negative_income_raises(self):
        with pytest.raises(ValueError):
            calculate_spousal_support("A", "B", -10_000, 40_000, years=10, recipient_age=40)

    def test_negative_income_party2_raises(self):
        with pytest.raises(ValueError):
            calculate_spousal_support("A", "B", 80_000, -5_000, years=10, recipient_age=40)


# ---------------------------------------------------------------------------
# Return type
# ---------------------------------------------------------------------------

class TestReturnType:

    def test_returns_dataclass(self):
        r = calculate_spousal_support("A", "B", 80_000, 40_000, years=10, recipient_age=40)
        assert isinstance(r, SpousalSupportResult)

    def test_all_fields_present(self):
        r = calculate_spousal_support("A", "B", 80_000, 40_000, years=10, recipient_age=40)
        for field in [
            "payor", "recipient", "net_income_diff",
            "pct_low", "pct_med", "pct_high",
            "monthly_low", "monthly_med", "monthly_high",
            "annual_low", "annual_med", "annual_high",
            "duration_low", "duration_high", "duration_label",
        ]:
            assert hasattr(r, field), f"Missing field: {field}"


# ---------------------------------------------------------------------------
# With-children formula (iterative, BC Scenario 1)
# ---------------------------------------------------------------------------

class TestWithChildren:
    """
    BC Scenario 1 from the frontend app:
      Party 1: 45 yrs, BC, employed income $60,000
      Party 2: 45 yrs, BC, employed income $20,000
      1 child age 3, lives with Party 2
      25-year relationship
    Expected: spousal support $0 (low/mid), $146 (high), indefinite duration.
    """

    @pytest.fixture()
    def bc_scenario_1(self):
        children = [
            TaxChildInfo(
                date_of_birth="2022-01-01",
                custody_arrangement="Party 2",
                child_has_disability="No",
            )
        ]
        child_counts = {
            "party1": 0, "party2": 1, "shared": 0,
            "party1WithAdultChild": 0, "party2WithAdultChild": 0,
        }
        return calculate_spousal_support_iterative(
            payor_gross=60_000,
            recipient_gross=20_000,
            payor_age=45,
            recipient_age=45,
            years=25,
            children=children,
            child_counts=child_counts,
            youngest_child_age=3,
            province="BC",
            year=2025,
            payor_is_party1=True,
        )

    def test_monthly_low_zero(self, bc_scenario_1):
        assert bc_scenario_1.monthly_low == 0

    def test_monthly_mid_zero(self, bc_scenario_1):
        assert bc_scenario_1.monthly_mid == 0

    def test_monthly_high(self, bc_scenario_1):
        assert approx(bc_scenario_1.monthly_high, 146.09)

    def test_annual_high(self, bc_scenario_1):
        assert approx(bc_scenario_1.annual_high, 1753.08)

    def test_duration_indefinite(self, bc_scenario_1):
        assert bc_scenario_1.duration_low == INDEFINITE_SENTINEL
        assert bc_scenario_1.duration_high == INDEFINITE_SENTINEL

    def test_child_support_amount(self, bc_scenario_1):
        assert bc_scenario_1.monthly_cs_paid == 563

    def test_payor_indi_high(self, bc_scenario_1):
        assert approx(bc_scenario_1.payor_indi_high, 41321.26)

    def test_recipient_indi_high(self, bc_scenario_1):
        assert approx(bc_scenario_1.recipient_indi_high, 31953.25)

    def test_converges_quickly(self, bc_scenario_1):
        assert bc_scenario_1.iterations_high <= 10


# ---------------------------------------------------------------------------
# Standalone runner (no pytest required)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    classes = [
        TestApplicablePercentages,
        TestDuration,
        TestQuantum,
        TestDurationIntegration,
        TestValidation,
        TestReturnType,
        TestWithChildren,
    ]

    passed = failed = 0
    for cls in classes:
        instance = cls()
        for name in [m for m in dir(cls) if m.startswith("test_")]:
            method = getattr(instance, name)
            label  = f"{cls.__name__}.{name}"
            try:
                method()
                print(f"  ✓  {label}")
                passed += 1
            except Exception as exc:
                print(f"  ✗  {label}")
                print(f"       {exc}")
                failed += 1

    print(f"\n{passed + failed} tests  —  {passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)

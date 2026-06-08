"""
spousal_support.py
------------------
Ontario SSAG spousal support calculator — without-child formula.
Based on Spousal Support Advisory Guidelines (SSAG).
"""

from dataclasses import dataclass
from typing import Literal


INDEFINITE_SENTINEL = 999_999_999


@dataclass
class SpousalSupportResult:
    payor:              str
    recipient:          str
    gross_income_diff:  float          # annual, absolute value

    pct_low:            float          
    pct_med:            float
    pct_high:           float

    monthly_low:        float
    monthly_med:        float
    monthly_high:       float

    annual_low:         float
    annual_med:         float
    annual_high:        float

    duration_low:       float          # years; INDEFINITE_SENTINEL = indefinite
    duration_high:      float
    duration_label:     str            # human-readable


def _applicable_percentages(years: float) -> tuple[float, float, float]:
    """SSAG without-child percentage ranges."""
    low  = min(0.015  * years, 0.50)
    med  = min(0.0175 * years, 0.50)
    high = min(0.02   * years, 0.50)
    return low, med, high


def _duration(years: float, recipient_age: float) -> tuple[float, float, str]:
    """
    SSAG without-child duration rules.
    Indefinite if marriage >= 20 years OR recipient age + years >= 65.
    Otherwise low = years * 0.5, high = years * 1.0.
    """
    rule_of_65 = (recipient_age + years) >= 65
    long_marriage = years >= 20

    if rule_of_65 or long_marriage:
        return (
            INDEFINITE_SENTINEL,
            INDEFINITE_SENTINEL,
            "Indefinite duration",
        )

    dur_low  = round(years * 0.5, 1)
    dur_high = round(years * 1.0, 1)
    return dur_low, dur_high, f"{dur_low} – {dur_high} years"


def calculate_spousal_support(
    party1_name:   str,
    party2_name:   str,
    party1_income: float,   # annual gross, CAD
    party2_income: float,   # annual gross, CAD
    years:         float,   # years of marriage / cohabitation
    recipient_age: float,   # age of the lower-income spouse
) -> SpousalSupportResult:
    """
    Calculate SSAG spousal support (without-child formula).
    The higher-income party is always the payor.
    """

    if years <= 0:
        raise ValueError("Years of marriage/cohabitation must be greater than 0.")
    if party1_income < 0 or party2_income < 0:
        raise ValueError("Incomes must be non-negative.")

    # Determine payor / recipient
    if party1_income >= party2_income:
        payor, payor_income     = party1_name, party1_income
        recipient, recip_income = party2_name, party2_income
    else:
        payor, payor_income     = party2_name, party2_income
        recipient, recip_income = party1_name, party1_income

    gross_diff = payor_income - recip_income   # always positive

    # Percentages
    pct_low, pct_med, pct_high = _applicable_percentages(years)

    # Monthly & annual amounts
    monthly_low  = round((pct_low  * gross_diff) / 12, 2)
    monthly_med  = round((pct_med  * gross_diff) / 12, 2)
    monthly_high = round((pct_high * gross_diff) / 12, 2)

    annual_low  = round(pct_low  * gross_diff, 2)
    annual_med  = round(pct_med  * gross_diff, 2)
    annual_high = round(pct_high * gross_diff, 2)

    # Duration
    dur_low, dur_high, dur_label = _duration(years, recipient_age)

    return SpousalSupportResult(
        payor=payor,
        recipient=recipient,
        gross_income_diff=round(gross_diff, 2),
        pct_low=round(pct_low * 100, 2),    # store as percentage, e.g. 15.0
        pct_med=round(pct_med * 100, 2),
        pct_high=round(pct_high * 100, 2),
        monthly_low=monthly_low,
        monthly_med=monthly_med,
        monthly_high=monthly_high,
        annual_low=annual_low,
        annual_med=annual_med,
        annual_high=annual_high,
        duration_low=dur_low,
        duration_high=dur_high,
        duration_label=dur_label,
    )
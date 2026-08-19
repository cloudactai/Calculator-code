"""
report_pdf.py
-------------
Generate PDF reports matching the CalculationReport.tsx layout exactly.

Uses xhtml2pdf to render the same HTML/CSS that the React frontend uses,
so both the manual calculator and the AI chat produce identical PDFs.
ReportLab is kept for the child-support report (unchanged).
"""

import os
import uuid
from datetime import date, datetime
from io import BytesIO

# xhtml2pdf for HTML → PDF (spousal report)
from xhtml2pdf import pisa

# ReportLab still used for child support report
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Directory for generated reports
REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


# ── Shared helpers ──────────────────────────────────────────────────────────

def _fmt(val):
    """Format a number as $X,XXX (negative with minus)."""
    if val is None:
        return ""
    val = round(float(val))
    if val == 0:
        return "$0"
    if val < 0:
        return f"-${abs(val):,.0f}"
    return f"${val:,.0f}"


def _fmt2(val):
    """Format a number as $X,XXX.XX (negative with minus)."""
    if val is None:
        return ""
    val = float(val)
    if val == 0:
        return "$0.00"
    if val < 0:
        return f"-${abs(val):,.2f}"
    return f"${val:,.2f}"


def _format_date_str(s):
    """Convert ISO date string to MM/DD/YYYY for display."""
    if not s:
        return ""
    try:
        d = datetime.fromisoformat(str(s)[:10])
        return d.strftime("%m/%d/%Y")
    except Exception:
        return str(s)


def _age_from_dob(dob_str):
    """Calculate age from a DOB string."""
    if not dob_str:
        return 0
    try:
        dob = date.fromisoformat(str(dob_str)[:10])
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return 0


# ─────────────────────────────────────────────────────────────────────────────
# Spousal Support Report — HTML template matching the manual calculator's
# multi-page CalculationReport layout (Reports.tsx pages)
# ─────────────────────────────────────────────────────────────────────────────

def _spousal_html(data: dict) -> str:
    """Build multi-page HTML matching the manual calculator's report layout."""
    p1 = data.get("party1_name", "Party 1")
    p2 = data.get("party2_name", "Party 2")
    p1_income = float(data.get("party1_income", 0))
    p2_income = float(data.get("party2_income", 0))
    payor = data.get("payor", "")
    recipient = data.get("recipient", "")
    p1_is_payor = (p1 == payor) if payor else (p1_income > p2_income)
    payor_name = p1 if p1_is_payor else p2
    recip_name = p2 if p1_is_payor else p1

    p1_age = data.get("party1_age", "")
    p2_age = data.get("party2_age", "")
    p1_prov = data.get("party1_province", "")
    p2_prov = data.get("party2_province", "")
    p1_claims = data.get("party1_claims_dependent", "")
    p2_claims = data.get("party2_claims_dependent", "")
    formula = data.get("formula", "")

    # Children
    children_raw = data.get("children", [])
    if isinstance(children_raw, list):
        children_list = children_raw
    else:
        children_list = data.get("children_list", [])
    has_children = len(children_list) > 0

    # Dates
    date_of_marriage = data.get("date_of_marriage", "")
    date_of_separation = data.get("date_of_separation", "")
    years = data.get("years_married", data.get("years", 0))
    years_float = float(years) if years else 0
    recipient_age = data.get("recipient_age", "")
    tax_year = data.get("tax_year", "") or date.today().year
    calc_date = data.get("calculation_date", "") or date.today().isoformat()

    # Support
    cs_monthly = float(data.get("monthly_cs_paid", data.get("child_support_paid", 0)))
    monthly_low = float(data.get("monthly_low", 0))
    monthly_mid = float(data.get("monthly_med", data.get("monthly_mid", 0)))
    monthly_high = float(data.get("monthly_high", 0))
    duration_label = data.get("duration_label", "")

    has_child_support = has_children and cs_monthly > 0
    has_spousal = (monthly_low != 0 or monthly_mid != 0 or monthly_high != 0
                   or date_of_marriage or date_of_separation)

    # SSAG percentages (no-children formula)
    pct_low = float(data.get("pct_low", 0))
    pct_med = float(data.get("pct_med", 0))
    pct_high = float(data.get("pct_high", 0))

    # Helper to get party-oriented values
    def _g(key, fb, default=0):
        return float(data.get(key, data.get(fb, default)))

    # Tax/benefit/INDI values
    tax_low_1  = -abs(_g("party1_taxes_low",  "payor_taxes_low" if p1_is_payor else "recipient_taxes_low"))
    tax_low_2  = -abs(_g("party2_taxes_low",  "recipient_taxes_low" if p1_is_payor else "payor_taxes_low"))
    tax_mid_1  = -abs(_g("party1_taxes_mid",  "payor_taxes_mid" if p1_is_payor else "recipient_taxes_mid"))
    tax_mid_2  = -abs(_g("party2_taxes_mid",  "recipient_taxes_mid" if p1_is_payor else "payor_taxes_mid"))
    tax_high_1 = -abs(_g("party1_taxes_high", "payor_taxes_high" if p1_is_payor else "recipient_taxes_high"))
    tax_high_2 = -abs(_g("party2_taxes_high", "recipient_taxes_high" if p1_is_payor else "payor_taxes_high"))

    ben_low_1  = _g("party1_benefits_low",  "payor_benefits_low" if p1_is_payor else "recipient_benefits_low")
    ben_low_2  = _g("party2_benefits_low",  "recipient_benefits_low" if p1_is_payor else "payor_benefits_low")
    ben_mid_1  = _g("party1_benefits_mid",  "payor_benefits_mid" if p1_is_payor else "recipient_benefits_mid")
    ben_mid_2  = _g("party2_benefits_mid",  "recipient_benefits_mid" if p1_is_payor else "payor_benefits_mid")
    ben_high_1 = _g("party1_benefits_high", "payor_benefits_high" if p1_is_payor else "recipient_benefits_high")
    ben_high_2 = _g("party2_benefits_high", "recipient_benefits_high" if p1_is_payor else "payor_benefits_high")

    disp_low_1  = _g("party1_indi_low",  "payor_indi_low" if p1_is_payor else "recipient_indi_low")
    disp_low_2  = _g("party2_indi_low",  "recipient_indi_low" if p1_is_payor else "payor_indi_low")
    disp_mid_1  = _g("party1_indi_mid",  "payor_indi_mid" if p1_is_payor else "recipient_indi_mid")
    disp_mid_2  = _g("party2_indi_mid",  "recipient_indi_mid" if p1_is_payor else "payor_indi_mid")
    disp_high_1 = _g("party1_indi_high", "payor_indi_high" if p1_is_payor else "recipient_indi_high")
    disp_high_2 = _g("party2_indi_high", "recipient_indi_high" if p1_is_payor else "payor_indi_high")

    se1 = float(data.get("special_expenses_party1", 0))
    se2 = float(data.get("special_expenses_party2", 0))

    cs_annual = round(cs_monthly * 12)
    cs_recipient_is_p2 = p1_is_payor

    # Youngest child age
    youngest_yrs = 0
    if has_children:
        child_ages = [_age_from_dob(c.get("date_of_birth", c.get("dob", ""))) for c in children_list]
        child_ages = [a for a in child_ages if a > 0]
        if child_ages:
            youngest_yrs = max(0, 18 - min(child_ages))

    # Gross income difference (for SSAG quantum)
    gross_diff = abs(p1_income - p2_income)

    # ── PAGE 1: Cover ──
    report_type_label = "Child and Spousal Support" if has_children else "Spousal Support"
    cover_page = f"""
    <div class="page cover-page">
      <div class="cover-content">
        <div class="cover-title">
          Report on {report_type_label} for {p1} and {p2} on {_format_date_str(calc_date)}.
        </div>
        <div class="cover-subtitle">
          Results and calculation details drawn from Cloud Act online calculator.
        </div>
      </div>
    </div>"""

    # ── PAGE 2: Calculation Input ──
    # Party 1 info table
    p1_role = "Payor" if p1_is_payor else "Recipient"
    p2_role = "Recipient" if p1_is_payor else "Payor"

    # Children table
    children_section = ""
    if has_children:
        child_trs = ""
        for c in children_list:
            name = c.get("name", "")
            dob = c.get("date_of_birth", c.get("dob", ""))
            dob_display = _format_date_str(dob)
            custody = c.get("custody_arrangement", c.get("custodyArrangement", ""))
            csg = c.get("csg_table", c.get("CSGTable", "Yes"))
            child_trs += f"""<tr>
              <td>{name}</td>
              <td>{dob_display}</td>
              <td>{custody}</td>
              <td>{csg}</td>
              <td>None</td>
            </tr>"""
        children_section = f"""
        <div class="table-wrapper" style="margin-top: 20px;">
          <table style="width: 700px;">
            <thead><tr>
              <th>Children</th><th>Date Of Birth</th><th>Lives With</th><th>CSG Table Applicable</th><th>Other</th>
            </tr></thead>
            <tbody>{child_trs}</tbody>
          </table>
        </div>"""

    # Important Dates section
    dates_items = ""
    if date_of_marriage:
        dates_items += f"""<div class="kv-row">
          <span class="kv-label">Date of Marriage / Cohabitation</span>
          <span class="kv-value">{_format_date_str(date_of_marriage)}</span>
        </div>"""
    if date_of_separation:
        dates_items += f"""<div class="kv-row">
          <span class="kv-label">Date of Separation</span>
          <span class="kv-value">{_format_date_str(date_of_separation)}</span>
        </div>"""
    if has_children and youngest_yrs >= 0:
        starts_school = max(0, 6 - min(child_ages)) if child_ages else 0
        finishes_school = max(0, 18 - min(child_ages)) if child_ages else 0
        dates_items += f"""<div class="kv-row">
          <span class="kv-label">Estimated No of years until youngest child starts full time school</span>
          <span class="kv-value">{starts_school}</span>
        </div>"""
        dates_items += f"""<div class="kv-row">
          <span class="kv-label">Estimated No of years until youngest child finishes high school</span>
          <span class="kv-value">{finishes_school}</span>
        </div>"""
    dates_items += f"""<div class="kv-row">
      <span class="kv-label">Tax Year</span>
      <span class="kv-value">{tax_year}</span>
    </div>"""

    input_page = f"""
    <div class="page">
      <div class="page-heading">CALCULATION INPUT</div>
      <div class="body-text" style="margin: 10px 0;">
        The tables below set out the information on which this report is based,
        and with which support is calculated in this report. Changing these
        inputs will change the support calculation. All inputs should be
        verified for accuracy.
      </div>

      <div class="body-text party-heading">
        <strong>{p1}, {p1_role}, Resident of {p1_prov if p1_prov else "N/A"}</strong>
      </div>
      <div class="table-wrapper">
        <table style="width: 700px;">
          <tbody>
            <tr><td><strong>Employment Income</strong></td><td style="text-align:right;">{_fmt(p1_income)}</td></tr>
            <tr><td><strong>Guideline Income</strong></td><td style="text-align:right;">{_fmt(p1_income)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="body-text party-heading" style="margin-top: 20px;">
        <strong>{p2}, {p2_role}, Resident of {p2_prov if p2_prov else "N/A"}</strong>
      </div>
      <div class="table-wrapper">
        <table style="width: 700px;">
          <tbody>
            <tr><td><strong>Employment Income</strong></td><td style="text-align:right;">{_fmt(p2_income)}</td></tr>
            <tr><td><strong>Guideline Income</strong></td><td style="text-align:right;">{_fmt(p2_income)}</td></tr>
          </tbody>
        </table>
      </div>

      {children_section}

      <div style="margin-top: 20px;">
        {dates_items}
      </div>
    </div>"""

    # ── PAGE 3: Result Summary ──
    result_text_items = ""
    if has_child_support:
        result_text_items += f"""<div class="result-block">
          <span class="result-label">Child Support</span>
          <span class="body-text">{payor_name} pays {recip_name} a basic Table amount of child support of {_fmt(round(cs_monthly))} per month (Per CSG-Table Amount).</span>
        </div>"""
    if has_spousal:
        formula_type = "without" if formula == "no_children" else "with"
        result_text_items += f"""<div class="result-block">
          <span class="result-label">Spousal Support</span>
          <span class="body-text">If entitlement is established, {payor_name} pays {recip_name} spousal support between {_fmt(round(monthly_low))} to {_fmt(round(monthly_high))} per month (midpoint of {_fmt(round(monthly_mid))}) for an undetermined period from the date of separation (Per SSAG- {formula_type} Child support Formula).</span>
        </div>"""

    # Scenario blocks
    scenario_blocks = ""
    scenarios = [
        ("1-Low", monthly_low),
        ("2-Mid", monthly_mid),
        ("3-High", monthly_high),
    ]
    for label, spousal_amt in scenarios:
        scenario_items = ""
        if has_child_support:
            scenario_items += f"""<div class="scenario-line">Child Support {_fmt(round(cs_monthly))}</div>"""
        if has_spousal:
            scenario_items += f"""<div class="scenario-line">Spousal Support {_fmt(round(spousal_amt))}</div>"""
        scenario_blocks += f"""
        <div class="scenario-box">
          <div class="scenario-title">Scenario {label}</div>
          <div class="scenario-flow">
            <span class="party-name">{p1}</span>
            <span class="flow-arrow">
              {scenario_items}
              <span class="arrow-symbol">&#8594;</span>
            </span>
            <span class="party-name">{p2}</span>
          </div>
        </div>"""

    result_page = f"""
    <div class="page">
      <div class="page-heading">RESULT SUMMARY</div>
      {result_text_items}
      {scenario_blocks}
    </div>"""

    # ── PAGE 4: Calculation Details - Spousal Support ──

    # For no_children formula: SSAG Quantum table (years, %, applicable %, gross diff, range, support)
    # For with_children formula: Full INDI table (guideline income, taxes, benefits, CS, spousal) × Low/Mid/High
    if formula == "no_children":
        # Applicable percentages (capped at 50%)
        applicable_low = min(pct_low, 0.50) if pct_low else (0.015 * years_float)
        applicable_med = min(pct_med, 0.50) if pct_med else (0.0175 * years_float)
        applicable_high = min(pct_high, 0.50) if pct_high else (0.02 * years_float)
        applicable_low = min(applicable_low, 0.50)
        applicable_med = min(applicable_med, 0.50)
        applicable_high = min(applicable_high, 0.50)

        ssag_range_low = gross_diff * applicable_low
        ssag_range_med = gross_diff * applicable_med
        ssag_range_high = gross_diff * applicable_high

        cap_row = ""
        if applicable_high >= 0.50:
            cap_row = f"""<tr>
              <td><strong>50% Recipient NDI cap on range</strong></td>
              <td></td><td></td>
              <td style="text-align:right;">{_fmt(round(monthly_high * 12))}</td>
            </tr>"""

        quantum_heading = "Without Child" if formula == "no_children" else "With Child"

        spousal_details_page = f"""
    <div class="page">
      <div class="page-heading">CALCULATION DETAILS - SPOUSAL SUPPORT</div>
      <div class="body-text sub-heading">A. SPOUSAL SUPPORT QUANTUM</div>
      <div class="info-box">
        The {quantum_heading} support formula: The range here is 1.5-2%, times the
        income difference between the spouse's gross income, times the years of
        cohabitation to a maximum of 50% of that income difference.
      </div>
      <div class="body-text" style="margin: 8px 0;">
        Calculation details (Annual) for each of the low, mid and high spousal
        support scenario are set out in the table below.
      </div>
      <div class="table-wrapper" style="margin-top: 10px;">
        <table style="width: 700px;">
          <thead>
            <tr>
              <th style="text-align:left;"></th>
              <th>Low</th>
              <th>Mid</th>
              <th>High</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Years of marriage/cohabitation</strong></td>
              <td style="text-align:right;">{int(years_float)}</td>
              <td style="text-align:right;">{int(years_float)}</td>
              <td style="text-align:right;">{int(years_float)}</td>
            </tr>
            <tr>
              <td><strong>Percent per year of marriage/cohabitation</strong></td>
              <td style="text-align:right;">1.5%</td>
              <td style="text-align:right;">1.75%</td>
              <td style="text-align:right;">2.0%</td>
            </tr>
            <tr>
              <td><strong>Applicable percentage</strong></td>
              <td style="text-align:right;">{applicable_low * 100:.2f}%</td>
              <td style="text-align:right;">{applicable_med * 100:.2f}%</td>
              <td style="text-align:right;">{applicable_high * 100:.2f}%</td>
            </tr>
            <tr>
              <td><strong>Gross Income Differential</strong></td>
              <td style="text-align:right;">{_fmt(round(gross_diff))}</td>
              <td style="text-align:right;">{_fmt(round(gross_diff))}</td>
              <td style="text-align:right;">{_fmt(round(gross_diff))}</td>
            </tr>
            <tr>
              <td><strong>SSAG range as calculated</strong></td>
              <td style="text-align:right;">{_fmt(round(ssag_range_low))}</td>
              <td style="text-align:right;">{_fmt(round(ssag_range_med))}</td>
              <td style="text-align:right;">{_fmt(round(ssag_range_high))}</td>
            </tr>
            {cap_row}
            <tr>
              <td><strong>Spousal Support</strong></td>
              <td style="text-align:right;">{_fmt(round(monthly_low * 12))}</td>
              <td style="text-align:right;">{_fmt(round(monthly_mid * 12))}</td>
              <td style="text-align:right;">{_fmt(round(monthly_high * 12))}</td>
            </tr>
          </tbody>
        </table>
      </div>"""
    else:
        # With children: full INDI table
        cs_p1_val = _fmt(-cs_annual) if p1_is_payor else ""
        cs_p2_val = _fmt(-cs_annual) if not p1_is_payor else ""
        not_p1_val = _fmt(-cs_annual) if not p1_is_payor else ""
        not_p2_val = _fmt(-cs_annual) if p1_is_payor else ""

        spousal_details_page = f"""
    <div class="page">
      <div class="page-heading">CALCULATION DETAILS - SPOUSAL SUPPORT</div>
      <div class="body-text sub-heading">C. SPOUSAL SUPPORT QUANTUM</div>
      <div class="info-box">
        The With Child support formula: Spousal support calculated below is based on a
        percentage of individual net disposable income. Support payments in the low, mid
        and high scenario will ensure the recipient a minimum of 40%, 43% and 46% of
        the total net disposable income respectively.
      </div>
      <div class="body-text" style="margin: 8px 0;">
        Calculation details (Annual) for each of the low, mid and high spousal
        support scenario are set out in the table below.
      </div>
      <div class="table-wrapper" style="margin-top: 10px;">
        <table style="width: 700px;">
          <thead>
            <tr>
              <th style="text-align:left;"></th>
              <th colspan="2">Low</th>
              <th colspan="2">Mid</th>
              <th colspan="2">High</th>
            </tr>
            <tr>
              <th style="text-align:left;"></th>
              <th>{p1}</th><th>{p2}</th>
              <th>{p1}</th><th>{p2}</th>
              <th>{p1}</th><th>{p2}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Guideline Income</strong></td>
              <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
              <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
              <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
            </tr>
            <tr>
              <td><strong>Taxes and deductions</strong></td>
              <td class="val">{_fmt2(tax_low_1)}</td><td class="val">{_fmt2(tax_low_2)}</td>
              <td class="val">{_fmt2(tax_mid_1)}</td><td class="val">{_fmt2(tax_mid_2)}</td>
              <td class="val">{_fmt2(tax_high_1)}</td><td class="val">{_fmt2(tax_high_2)}</td>
            </tr>
            <tr>
              <td><strong>Benefits and credits</strong></td>
              <td class="val">{_fmt2(ben_low_1)}</td><td class="val">{_fmt2(ben_low_2)}</td>
              <td class="val">{_fmt2(ben_mid_1)}</td><td class="val">{_fmt2(ben_mid_2)}</td>
              <td class="val">{_fmt2(ben_high_1)}</td><td class="val">{_fmt2(ben_high_2)}</td>
            </tr>
            <tr>
              <td><strong>Child Support</strong></td>
              <td class="val">{cs_p1_val}</td><td class="val">{cs_p2_val}</td>
              <td class="val">{cs_p1_val}</td><td class="val">{cs_p2_val}</td>
              <td class="val">{cs_p1_val}</td><td class="val">{cs_p2_val}</td>
            </tr>
            <tr>
              <td><strong>Notional Child Support</strong></td>
              <td class="val">{not_p1_val}</td><td class="val">{not_p2_val}</td>
              <td class="val">{not_p1_val}</td><td class="val">{not_p2_val}</td>
              <td class="val">{not_p1_val}</td><td class="val">{not_p2_val}</td>
            </tr>
            <tr>
              <td><strong>Special Expenses paid</strong></td>
              <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
              <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
              <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
            </tr>
            <tr>
              <td><strong>Percentage</strong></td>
              <td class="val">40%</td><td class="val">40%</td>
              <td class="val">43%</td><td class="val">43%</td>
              <td class="val">46%</td><td class="val">46%</td>
            </tr>
            <tr class="bold-row">
              <td><strong>Spousal Support</strong></td>
              <td class="val">{_fmt(round(monthly_low * 12))}</td><td class="val"></td>
              <td class="val">{_fmt(round(monthly_mid * 12))}</td><td class="val"></td>
              <td class="val">{_fmt(round(monthly_high * 12))}</td><td class="val"></td>
            </tr>
          </tbody>
        </table>
      </div>"""

    # Duration section (same for both formulas)
    duration_years = int(years_float) if years_float else 0
    rule_of_65 = "No"
    if years_float and recipient_age:
        recip_age_val = float(recipient_age)
        if years_float >= 20 or (years_float + recip_age_val >= 65):
            rule_of_65 = "Yes"
    over_20 = "Yes" if years_float > 20 else "No"

    duration_section_label = "B" if formula == "no_children" else "D"

    spousal_details_page += f"""
      <div class="info-box" style="margin-top: 20px;">
        <div class="sub-heading">{duration_section_label}. SPOUSAL SUPPORT DURATION</div>
        This report also provides a range of the intended duration of spousal
        support from the date of separation. The time period for which spousal
        support is payable is calculated based on the duration of relationship,
        age of parties and the age of the children (if any).
      </div>

      <div class="kv-row" style="margin-top: 10px;">
        <span class="kv-label">Duration of Relationship</span>
        <span class="kv-value">{duration_years} years</span>
      </div>
      <div class="kv-row">
        <span class="kv-label">Age of recipient at separation</span>
        <span class="kv-value">{int(float(recipient_age)) if recipient_age else "N/A"} years</span>
      </div>"""

    if has_children:
        starts_school_val = max(0, 6 - min(child_ages)) if child_ages else "Not applicable"
        finishes_school_val = max(0, 18 - min(child_ages)) if child_ages else "Not applicable"
        spousal_details_page += f"""
      <div class="kv-row">
        <span class="kv-label">Years Until Full Time School</span>
        <span class="kv-value">{starts_school_val}</span>
      </div>
      <div class="kv-row">
        <span class="kv-label">Years Until End of School</span>
        <span class="kv-value">{finishes_school_val}</span>
      </div>"""
    else:
        spousal_details_page += f"""
      <div class="kv-row">
        <span class="kv-label">Years Until Full Time School</span>
        <span class="kv-value">Not applicable</span>
      </div>
      <div class="kv-row">
        <span class="kv-label">Years Until End of School</span>
        <span class="kv-value">Not applicable</span>
      </div>"""

    spousal_details_page += f"""
      <div class="kv-row">
        <span class="kv-label">Over 20 year Relationship?</span>
        <span class="kv-value">{over_20}</span>
      </div>
      <div class="kv-row">
        <span class="kv-label">Rule of 65 applies?</span>
        <span class="kv-value">{rule_of_65}</span>
      </div>
      <div class="kv-row">
        <span class="kv-label">Duration of Support</span>
        <span class="kv-value">{duration_label if duration_label else "N/A"}</span>
      </div>
    </div>"""

    # ── PAGE 5: Net Cashflow Analysis ──
    cashflow_page = f"""
    <div class="page">
      <div class="page-heading">NET CASHFLOW ANALYSIS</div>
      <div class="body-text" style="margin: 10px 0;">
        The net after tax cash budget below is intended to be a reference point
        to assist the parties in understanding the cash that would be available
        to budget with on a monthly and annual basis.
      </div>
      <div class="table-wrapper" style="margin-top: 10px;">
        <table style="width: 700px;">
          <thead>
            <tr>
              <th style="text-align:left;"></th>
              <th colspan="2">Low</th>
              <th colspan="2">Mid</th>
              <th colspan="2">High</th>
            </tr>
            <tr>
              <th style="text-align:left;"></th>
              <th>{p1}</th><th>{p2}</th>
              <th>{p1}</th><th>{p2}</th>
              <th>{p1}</th><th>{p2}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Guideline income</strong></td>
              <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
              <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
              <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
            </tr>
            <tr>
              <td><strong>Taxes and deductions</strong></td>
              <td class="val">{_fmt2(tax_low_1)}</td><td class="val">{_fmt2(tax_low_2)}</td>
              <td class="val">{_fmt2(tax_mid_1)}</td><td class="val">{_fmt2(tax_mid_2)}</td>
              <td class="val">{_fmt2(tax_high_1)}</td><td class="val">{_fmt2(tax_high_2)}</td>
            </tr>
            <tr>
              <td><strong>Benefits and credits</strong></td>
              <td class="val">{_fmt2(ben_low_1)}</td><td class="val">{_fmt2(ben_low_2)}</td>
              <td class="val">{_fmt2(ben_mid_1)}</td><td class="val">{_fmt2(ben_mid_2)}</td>
              <td class="val">{_fmt2(ben_high_1)}</td><td class="val">{_fmt2(ben_high_2)}</td>
            </tr>"""

    if has_child_support:
        cs_p1_val = _fmt(-cs_annual) if p1_is_payor else ""
        cs_p2_val = _fmt(-cs_annual) if not p1_is_payor else ""
        cashflow_page += f"""
            <tr>
              <td><strong>Child Support</strong></td>
              <td class="val">{cs_p1_val}</td><td class="val">{cs_p2_val}</td>
              <td class="val">{cs_p1_val}</td><td class="val">{cs_p2_val}</td>
              <td class="val">{cs_p1_val}</td><td class="val">{cs_p2_val}</td>
            </tr>"""

    cashflow_page += f"""
            <tr>
              <td><strong>Special expenses paid</strong></td>
              <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
              <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
              <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
            </tr>
            <tr class="bold-row">
              <td><strong>Spousal Support (annual)</strong></td>
              <td class="val" colspan="2" style="text-align:center;">{_fmt(round(monthly_low * 12))}</td>
              <td class="val" colspan="2" style="text-align:center;">{_fmt(round(monthly_mid * 12))}</td>
              <td class="val" colspan="2" style="text-align:center;">{_fmt(round(monthly_high * 12))}</td>
            </tr>
            <tr class="bold-row">
              <td><strong>Total disposable income</strong></td>
              <td class="val">{_fmt2(disp_low_1)}</td><td class="val">{_fmt2(disp_low_2)}</td>
              <td class="val">{_fmt2(disp_mid_1)}</td><td class="val">{_fmt2(disp_mid_2)}</td>
              <td class="val">{_fmt2(disp_high_1)}</td><td class="val">{_fmt2(disp_high_2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>"""

    # ── PAGE 6: Terms of Use ──
    terms_page = """
    <div class="page">
      <div class="page-heading">TERMS OF USE</div>
      <div class="body-text" style="margin: 10px 0;">
        This support report was created using the Cloud Act support calculator.
        Please visit Cloud Act to learn more, or to perform your own support
        calculations.
      </div>
      <div class="body-text">
        Calculations are current based on the laws and regulations in force as
        of the date the report was calculated. The Calculator applies the federal
        Child Support Guidelines ("CSG"), which are legally binding in most
        provinces in Canada, and the federal Spousal Support Advisory Guidelines
        ("SSAG"), which are not legally binding but are widely used on an advisory
        basis. Note that actual taxes and benefits may vary based on
        interpretations and calculations performed by the Canada Revenue Agency
        or relevant provincial or territorial authorities.
      </div>
      <div class="body-text" style="margin-top: 10px;">
        This calculation is only as reliable as the inputs provided by the user:
        if income, expenses, taxes or benefits are different than set out in the
        calculation input page, the amount of support should be recalculated to
        reflect reality.
      </div>
      <div class="body-text" style="margin-top: 10px;">
        Although the Calculator generates child and spousal support amounts,
        support is not automatically payable in all circumstances. Family law is
        extremely complex and there are many other factors and legal issues not
        considered by this Calculator that could dramatically affect child and
        spousal support.
      </div>
      <div class="body-text" style="margin-top: 10px;">
        This report does not contain legal advice or establish a lawyer-client
        relationship. By using or referencing this report in any way, you agree
        to indemnify CloudAct for any loss, damages, costs, or expenses incurred
        by you or any third parties in relation to this report, howsoever arising,
        regardless of theory of liability.
      </div>
    </div>"""

    # ── Assemble full HTML ──
    # Count pages for footer
    page_count = 5  # cover, input, result, spousal details, terms
    if has_spousal and (disp_low_1 or disp_low_2):
        page_count = 6  # add cashflow page

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: letter;
    margin: 15mm 15mm 20mm 15mm;
  }}
  body {{
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #333;
    margin: 0;
    padding: 0;
  }}
  .page {{
    padding: 20px 10px;
    page-break-after: always;
    min-height: 600px;
  }}
  .page:last-child {{
    page-break-after: auto;
  }}

  /* Cover page */
  .cover-page {{
    display: block;
    padding-top: 280px;
    text-align: center;
  }}
  .cover-content {{
    margin: 0 auto;
    width: 500px;
  }}
  .cover-title {{
    font-size: 18px;
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 16px;
  }}
  .cover-subtitle {{
    font-size: 12px;
    color: #555;
  }}

  /* Page headings */
  .page-heading {{
    font-size: 14px;
    font-weight: bold;
    color: #1a1a2e;
    padding-bottom: 6px;
    border-bottom: 2px solid #2d5aa0;
    margin-bottom: 10px;
  }}

  /* Body text */
  .body-text {{
    font-size: 11px;
    color: #333;
    line-height: 1.5;
    margin: 4px 0;
  }}
  .sub-heading {{
    font-weight: bold;
    font-size: 12px;
    margin: 10px 0 4px 0;
  }}
  .party-heading {{
    margin: 20px 0 6px 10px;
    font-size: 11px;
  }}

  /* Info box (grey background) */
  .info-box {{
    background: #eee;
    padding: 8px 10px;
    font-size: 11px;
    line-height: 1.5;
    margin: 6px 0;
  }}

  /* Tables */
  .table-wrapper {{
    margin: 4px 0;
  }}
  table {{
    border-collapse: collapse;
    margin-bottom: 2px;
  }}
  td, th {{
    padding: 5px 8px;
    font-size: 11px;
    border: 1px solid #d0d0d0;
  }}
  th {{
    background: #eef2f7;
    font-weight: bold;
    text-align: center;
  }}
  .val {{
    text-align: right;
  }}
  .bold-row td {{
    font-weight: bold;
  }}

  /* Key-value rows (for Important Dates, Duration) */
  .kv-row {{
    border-bottom: 1px solid #d0d0d0;
    padding: 5px 8px;
    font-size: 11px;
  }}
  .kv-label {{
    font-weight: bold;
  }}
  .kv-value {{
    float: right;
  }}

  /* Result summary */
  .result-block {{
    margin: 12px 0;
  }}
  .result-label {{
    font-weight: bold;
    font-size: 12px;
    display: block;
    margin-bottom: 4px;
  }}

  /* Scenario blocks */
  .scenario-box {{
    margin: 16px 0;
    text-align: center;
  }}
  .scenario-title {{
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 6px;
  }}
  .scenario-flow {{
    margin: 0 auto;
    width: 500px;
  }}
  .party-name {{
    font-weight: bold;
    font-size: 12px;
  }}
  .flow-arrow {{
    display: inline;
    margin: 0 20px;
  }}
  .arrow-symbol {{
    font-size: 14px;
    margin-left: 10px;
  }}
  .scenario-line {{
    font-size: 11px;
    display: inline;
    margin: 0 6px;
  }}
</style>
</head>
<body>
{cover_page}
{input_page}
{result_page}
{spousal_details_page}
{cashflow_page}
{terms_page}
</body>
</html>"""
    return html


def generate_spousal_support_report(data: dict) -> str:
    """
    Generate a spousal support PDF report using the same HTML/CSS
    as CalculationReport.tsx. Returns filename (relative to REPORTS_DIR).
    """
    report_id = uuid.uuid4().hex[:12]
    filename = f"spousal_support_report_{report_id}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    html = _spousal_html(data)
    with open(filepath, "wb") as f:
        pisa_status = pisa.CreatePDF(html, dest=f)

    if pisa_status.err:
        print(f"[report_pdf] xhtml2pdf errors: {pisa_status.err}", flush=True)

    return filename


# ─────────────────────────────────────────────────────────────────────────────
# Child Support Report (unchanged — still uses ReportLab)
# ─────────────────────────────────────────────────────────────────────────────

DARK_BLUE   = HexColor("#1a1a2e")
HEADER_BG   = HexColor("#d9e2f3")
RESULT_BG   = HexColor("#c5d9a4")
LIGHT_GREY  = HexColor("#eef2f7")
SUBTLE_GREY = HexColor("#f5f5f5")
BORDER_GREY = HexColor("#d0d0d0")
ACCENT_BLUE = HexColor("#2d5aa0")


def _styles():
    """Create paragraph styles for the report."""
    ss = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ReportTitle", parent=ss["Normal"],
            fontName="Helvetica-Bold", fontSize=14,
            textColor=DARK_BLUE, spaceAfter=4,
        ),
        "section": ParagraphStyle(
            "SectionHeader", parent=ss["Normal"],
            fontName="Helvetica-Bold", fontSize=10,
            textColor=DARK_BLUE,
        ),
        "normal": ParagraphStyle(
            "ReportNormal", parent=ss["Normal"],
            fontName="Helvetica", fontSize=9,
        ),
        "small": ParagraphStyle(
            "ReportSmall", parent=ss["Normal"],
            fontName="Helvetica", fontSize=8,
        ),
        "bold": ParagraphStyle(
            "ReportBold", parent=ss["Normal"],
            fontName="Helvetica-Bold", fontSize=9,
        ),
    }


def _base_table_style():
    return [
        ("FONTNAME",   (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",   (0, 0), (-1, -1), 9),
        ("TEXTCOLOR",  (0, 0), (-1, -1), DARK_BLUE),
        ("GRID",       (0, 0), (-1, -1), 0.5, BORDER_GREY),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]


def generate_child_support_report(data: dict) -> str:
    """
    Generate a child support PDF report.
    Returns: filename (relative to REPORTS_DIR)
    """
    report_id = uuid.uuid4().hex[:12]
    filename = f"child_support_report_{report_id}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)
    styles = _styles()

    doc = SimpleDocTemplate(
        filepath, pagesize=letter,
        leftMargin=0.6*inch, rightMargin=0.6*inch,
        topMargin=0.5*inch, bottomMargin=0.5*inch,
    )
    elements = []

    # ── Title ──
    elements.append(Paragraph("CLOUDACT FAMILY LAW TOOLS", styles["title"]))
    elements.append(Spacer(1, 2))
    line_table = Table([[""]],  colWidths=[7*inch])
    line_table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 2, ACCENT_BLUE),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 10))

    p1 = data.get("party1_name", "Party 1")
    p2 = data.get("party2_name", "Party 2")
    p1_income = data.get("party1_income", 0)
    p2_income = data.get("party2_income", 0)
    children = data.get("children", [])

    # ── Calculation Input ──
    header_data = [
        [Paragraph("Calculation Input", styles["section"]), "", ""],
    ]
    header_table = Table(header_data, colWidths=[3*inch, 2*inch, 2*inch])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("SPAN", (0, 0), (-1, 0)),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("LEFTPADDING", (0, 0), (-1, 0), 6),
    ]))
    elements.append(header_table)

    input_data = [
        ["", p1, p2],
        ["Guideline income", _fmt(p1_income), _fmt(p2_income)],
        ["Scenario", data.get("scenario", ""), ""],
    ]
    input_table = Table(input_data, colWidths=[3*inch, 2*inch, 2*inch])
    ts = _base_table_style()
    ts += [
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]
    input_table.setStyle(TableStyle(ts))
    elements.append(input_table)
    elements.append(Spacer(1, 6))

    # ── Children table ──
    if children:
        ch_header = [
            [Paragraph("Children", styles["section"]), "", ""],
        ]
        ch_header_table = Table(ch_header, colWidths=[3*inch, 2*inch, 2*inch])
        ch_header_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
            ("SPAN", (0, 0), (-1, 0)),
            ("TOPPADDING", (0, 0), (-1, 0), 4),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
            ("LEFTPADDING", (0, 0), (-1, 0), 6),
        ]))
        elements.append(ch_header_table)

        ch_data = [["Name", "Lives with", "Adult"]]
        for c in children:
            name = c.get("name", "")
            custody = c.get("custody_arrangement", "")
            is_adult = "Yes" if c.get("is_adult", False) else "No"
            dob = c.get("dob", "")
            if dob:
                try:
                    d = date.fromisoformat(str(dob)[:10])
                    age = date.today().year - d.year - ((date.today().month, date.today().day) < (d.month, d.day))
                    name = f"{name} ({age} yrs)"
                except Exception:
                    pass
            ch_data.append([name, custody, is_adult])

        ch_table = Table(ch_data, colWidths=[3*inch, 2*inch, 2*inch])
        ts = _base_table_style()
        ts += [
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ]
        ch_table.setStyle(TableStyle(ts))
        elements.append(ch_table)
        elements.append(Spacer(1, 6))

    # ── Result ──
    result_header = Table(
        [[Paragraph("Result", styles["section"])]],
        colWidths=[7*inch],
    )
    result_header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), RESULT_BG),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("LEFTPADDING", (0, 0), (-1, 0), 6),
    ]))
    elements.append(result_header)

    cs_ref = data.get("child_support_ref", {})
    result_data = [
        ["Net payer", data.get("net_payer", "")],
        ["Child Support (monthly)", _fmt(data.get("net_monthly", 0))],
        ["Child Support (annual)", _fmt(data.get("net_annual", 0))],
    ]

    p1_m = cs_ref.get("party1_monthly", 0)
    p2_m = cs_ref.get("party2_monthly", 0)
    if p1_m > 0 and p2_m > 0:
        result_data.append([f"{p1} pays (monthly)", _fmt(p1_m)])
        result_data.append([f"{p2} pays (monthly)", _fmt(p2_m)])

    result_table = Table(result_data, colWidths=[4.5*inch, 2.5*inch])
    ts = _base_table_style()
    ts += [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (1, 0), (1, -1), 11),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]
    result_table.setStyle(TableStyle(ts))
    elements.append(result_table)

    doc.build(elements)
    return filename

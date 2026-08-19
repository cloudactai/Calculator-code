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
# Spousal Support Report — HTML template matching CalculationReport.tsx
# ─────────────────────────────────────────────────────────────────────────────

def _spousal_html(data: dict) -> str:
    """Build the exact same HTML as CalculationReport.tsx produces."""
    p1 = data.get("party1_name", "Party 1")
    p2 = data.get("party2_name", "Party 2")
    p1_income = float(data.get("party1_income", 0))
    p2_income = float(data.get("party2_income", 0))
    payor = data.get("payor", "")
    p1_is_payor = (p1 == payor) if payor else (p1_income > p2_income)

    p1_age = data.get("party1_age", "")
    p2_age = data.get("party2_age", "")
    p1_prov = data.get("party1_province", "")
    p2_prov = data.get("party2_province", "")
    p1_claims = data.get("party1_claims_dependent", "")
    p2_claims = data.get("party2_claims_dependent", "")

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
    recipient_age = data.get("recipient_age", "")
    tax_year = data.get("tax_year", "") or date.today().year

    # Support
    cs_monthly = float(data.get("monthly_cs_paid", data.get("child_support_paid", 0)))
    monthly_low = float(data.get("monthly_low", 0))
    monthly_mid = float(data.get("monthly_med", data.get("monthly_mid", 0)))
    monthly_high = float(data.get("monthly_high", 0))
    duration_label = data.get("duration_label", "")

    has_child_support = has_children and cs_monthly > 0
    has_spousal = (monthly_low != 0 or monthly_mid != 0 or monthly_high != 0
                   or date_of_marriage or date_of_separation)

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
    cs_recipient_is_p2 = p1_is_payor  # payor pays CS, so recipient gets it

    # Youngest child age
    youngest_yrs = 0
    if has_children:
        child_ages = [_age_from_dob(c.get("date_of_birth", c.get("dob", ""))) for c in children_list]
        child_ages = [a for a in child_ages if a > 0]
        if child_ages:
            youngest_yrs = max(0, 18 - min(child_ages))

    # ── Build HTML ──
    children_rows = ""
    if has_children:
        child_trs = ""
        for c in children_list:
            name = c.get("name", "")
            dob = c.get("date_of_birth", c.get("dob", ""))
            age = _age_from_dob(dob)
            label = f"{name} / {age} yrs" if age > 0 else name
            custody = c.get("custody_arrangement", c.get("custodyArrangement", ""))
            csg = c.get("csg_table", "Yes")
            child_trs += f"""<tr><td class="lbl">{label}</td><td class="val">{custody}</td><td class="val">{csg}</td></tr>"""
        children_rows = f"""
            <table width="355" style="margin-top: 4px;">
              <tr>
                <th width="155" style="font-weight:bold;">Children</th>
                <th width="100">Lives with</th>
                <th width="100">CSG Table</th>
              </tr>
              {child_trs}
            </table>"""

    # Important dates rows
    dates_rows = ""
    if date_of_marriage or date_of_separation:
        if date_of_marriage:
            dates_rows += f'<tr><td width="230" class="lbl">Date of Marriage/Cohabitation</td><td width="125" class="val">{_format_date_str(date_of_marriage)}</td></tr>'
        if date_of_separation:
            dates_rows += f'<tr><td width="230" class="lbl">Date of separation</td><td width="125" class="val">{_format_date_str(date_of_separation)}</td></tr>'
        if years:
            dates_rows += f'<tr><td width="230" class="lbl">Length of marriage</td><td width="125" class="val">{int(float(years))} years</td></tr>'
        if recipient_age:
            dates_rows += f'<tr><td width="230" class="lbl">Recipient age at separation</td><td width="125" class="val">{int(float(recipient_age))} years old</td></tr>'
    if has_children and youngest_yrs >= 0:
        dates_rows += f'<tr><td width="230" class="lbl">Years till youngest child finishes school</td><td width="125" class="val">{youngest_yrs} years</td></tr>'
    dates_rows += f'<tr><td width="230" class="lbl">Tax year</td><td width="125" class="val">{tax_year}</td></tr>'

    # Result rows
    result_rows = ""
    if has_child_support:
        result_rows += f'<tr class="bold-row"><td width="210" class="lbl" style="font-weight:bold;">Child Support (monthly)</td><td width="145" class="val result-val">{_fmt(round(cs_monthly))}</td></tr>'
    if has_spousal:
        result_rows += f'<tr><td width="210" class="lbl" style="font-weight:bold;">Spousal Support (monthly)</td><td width="145"></td></tr>'
        result_rows += f'<tr><td width="210" class="lbl" style="padding-left:20px;">Low</td><td width="145" class="val result-val">{_fmt(round(monthly_low))}</td></tr>'
        result_rows += f'<tr><td width="210" class="lbl" style="padding-left:20px;">Mid</td><td width="145" class="val result-val">{_fmt(round(monthly_mid))}</td></tr>'
        result_rows += f'<tr><td width="210" class="lbl" style="padding-left:20px;">High</td><td width="145" class="val result-val">{_fmt(round(monthly_high))}</td></tr>'
        if duration_label:
            result_rows += f'<tr class="bold-row"><td width="210" class="lbl" style="font-weight:bold;">Duration</td><td width="145" class="val">{duration_label}</td></tr>'

    # Child support detail rows
    cs_detail_rows = ""
    if has_child_support:
        cs_p1 = _fmt(-cs_annual) if cs_recipient_is_p2 else ""
        cs_p2 = _fmt(-cs_annual) if not cs_recipient_is_p2 else ""
        not_p1 = _fmt(-cs_annual) if not cs_recipient_is_p2 else ""
        not_p2 = _fmt(-cs_annual) if cs_recipient_is_p2 else ""
        cs_detail_rows = f"""
            <tr><td width="140" class="lbl">Child Support</td>
                <td width="98" class="val">{cs_p1}</td><td width="98" class="val">{cs_p2}</td>
                <td width="98" class="val">{cs_p1}</td><td width="98" class="val">{cs_p2}</td>
                <td width="98" class="val">{cs_p1}</td><td width="98" class="val">{cs_p2}</td></tr>
            <tr><td width="140" class="lbl">Notional child support</td>
                <td width="98" class="val">{not_p1}</td><td width="98" class="val">{not_p2}</td>
                <td width="98" class="val">{not_p1}</td><td width="98" class="val">{not_p2}</td>
                <td width="98" class="val">{not_p1}</td><td width="98" class="val">{not_p2}</td></tr>"""

    # Spousal annual row
    spousal_annual_row = ""
    if has_spousal:
        spousal_annual_row = f"""
            <tr class="bold-row">
              <td width="140" class="lbl" style="font-weight:bold;">Spousal Support (annual)</td>
              <td width="98" class="val">{_fmt(round(monthly_low * 12))}</td><td width="98" class="val"></td>
              <td width="98" class="val">{_fmt(round(monthly_mid * 12))}</td><td width="98" class="val"></td>
              <td width="98" class="val">{_fmt(round(monthly_high * 12))}</td><td width="98" class="val"></td>
            </tr>"""

    # ── Tax Profile page ──
    tax_profile_html = _build_tax_profile_page(data, p1, p2, p1_is_payor)

    # Terms of Use page removed per request
    terms_html = ""

    # Landscape letter: 792pt wide, 8mm margins each side = ~747pt usable
    # All widths must stay under 740px total
    # Two-column top: 355px + 15px gap + 355px = 725px
    # 7-col table: 140px label + 6 × 98px data = 728px

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: letter landscape;
    margin: 8mm 8mm 8mm 8mm;
  }}
  body {{
    margin: 0;
    padding: 0;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 9px;
    color: #333;
  }}
  .calc-report {{
    padding: 10px 5px;
  }}
  .report-title {{
    font-size: 14px;
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 8px;
    padding-bottom: 3px;
    border-bottom: 2px solid #2d5aa0;
  }}
  .section-header {{
    font-weight: bold;
    font-size: 10px;
    background-color: #d9e2f3;
    color: #1a1a2e;
    padding: 3px 6px;
    margin: 6px 0 1px 0;
  }}
  table {{
    border-collapse: collapse;
    margin-bottom: 1px;
  }}
  td, th {{
    padding: 2px 4px;
    font-size: 8px;
    border: 1px solid #ccc;
  }}
  th {{
    background-color: #eef2f7;
    font-weight: bold;
    text-align: center;
  }}
  .lbl {{ text-align: left; }}
  .val {{ text-align: right; }}
  .bold-row td {{ font-weight: bold; }}
  .result-header {{ background-color: #c5d9a4; }}
  .result-val {{
    font-size: 10px;
    font-weight: bold;
    color: #1a1a2e;
  }}
  .details-table td, .details-table th {{
    font-size: 8px;
    padding: 2px 3px;
  }}
  .scenario-hdr {{
    text-align: center;
    font-weight: bold;
    font-size: 9px;
  }}
  .sub-hdr td {{
    text-align: center;
    font-weight: bold;
    font-size: 8px;
    background-color: #f5f5f5;
  }}
  .page-break {{
    page-break-before: always;
  }}
  .terms-page {{
    font-family: Helvetica, Arial, sans-serif;
    font-size: 9px;
    color: #333;
    padding: 20px 30px;
  }}
  .terms-title {{
    font-size: 12px;
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 12px;
  }}
  .terms-text {{
    font-size: 9px;
    line-height: 1.5;
  }}
</style>
</head>
<body>

<!-- PAGE 1: Main Calculation Report -->
<div class="calc-report">
  <div class="report-title">CLOUDACT FAMILY LAW TOOLS</div>

  <!-- TOP ROW: side-by-side using outer table (xhtml2pdf doesn't support float) -->
  <table width="728" style="border:0;">
    <tr>
      <td width="355" style="vertical-align:top;border:0;padding:0 8px 0 0;">
        <div class="section-header">Calculation Input</div>
        <table width="355">
          <tr><th width="135"></th><th width="110">{p1}</th><th width="110">{p2}</th></tr>
          <tr><td width="135"></td><td width="110" class="val" style="font-weight:bold;">{"Payor" if p1_is_payor else "Recipient"}</td><td width="110" class="val" style="font-weight:bold;">{"Recipient" if p1_is_payor else "Payor"}</td></tr>
          <tr><td width="135" class="lbl">Age</td><td width="110" class="val">{p1_age if p1_age else ""}</td><td width="110" class="val">{p2_age if p2_age else ""}</td></tr>
          <tr><td width="135" class="lbl">Province</td><td width="110" class="val">{p1_prov}</td><td width="110" class="val">{p2_prov}</td></tr>
          <tr><td width="135" class="lbl">Employment income</td><td width="110" class="val">{_fmt(p1_income)}</td><td width="110" class="val">{_fmt(p2_income)}</td></tr>
          <tr><td width="135" class="lbl">Claims dep. credit</td><td width="110" class="val">{p1_claims or "No"}</td><td width="110" class="val">{p2_claims or "No"}</td></tr>
        </table>
        {children_rows}
      </td>
      <td width="355" style="vertical-align:top;border:0;padding:0;">
        <div class="section-header">Important dates</div>
        <table width="355">
          {dates_rows}
        </table>
      </td>
    </tr>
  </table>

  <!-- RESULT -->
  <div style="width:360px;">
    <div class="section-header result-header">Result</div>
    <table width="355">
      {result_rows}
    </table>
  </div>

  <!-- CALCULATION DETAILS — 7 columns, no colspan (xhtml2pdf breaks with colspan) -->
  <div class="section-header" style="margin-top:6px;">Calculation details</div>
  <table class="details-table" width="728">
    <tr>
      <td width="140" class="lbl" style="background-color:#eef2f7;font-weight:bold;"></td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;">LOW</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;">LOW</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;">MID</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;">MID</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;">HIGH</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;">HIGH</td>
    </tr>
    <tr class="sub-hdr">
      <td width="140" class="lbl"></td>
      <td width="98">{p1}</td><td width="98">{p2}</td>
      <td width="98">{p1}</td><td width="98">{p2}</td>
      <td width="98">{p1}</td><td width="98">{p2}</td>
    </tr>
    <tr>
      <td width="140" class="lbl">Guideline income</td>
      <td width="98" class="val">{_fmt(p1_income)}</td><td width="98" class="val">{_fmt(p2_income)}</td>
      <td width="98" class="val">{_fmt(p1_income)}</td><td width="98" class="val">{_fmt(p2_income)}</td>
      <td width="98" class="val">{_fmt(p1_income)}</td><td width="98" class="val">{_fmt(p2_income)}</td>
    </tr>
    <tr>
      <td width="140" class="lbl">Taxes and deductions</td>
      <td width="98" class="val">{_fmt(tax_low_1)}</td><td width="98" class="val">{_fmt(tax_low_2)}</td>
      <td width="98" class="val">{_fmt(tax_mid_1)}</td><td width="98" class="val">{_fmt(tax_mid_2)}</td>
      <td width="98" class="val">{_fmt(tax_high_1)}</td><td width="98" class="val">{_fmt(tax_high_2)}</td>
    </tr>
    <tr>
      <td width="140" class="lbl">Benefits and credits</td>
      <td width="98" class="val">{_fmt(ben_low_1)}</td><td width="98" class="val">{_fmt(ben_low_2)}</td>
      <td width="98" class="val">{_fmt(ben_mid_1)}</td><td width="98" class="val">{_fmt(ben_mid_2)}</td>
      <td width="98" class="val">{_fmt(ben_high_1)}</td><td width="98" class="val">{_fmt(ben_high_2)}</td>
    </tr>
    {cs_detail_rows}
    <tr>
      <td width="140" class="lbl">Special expenses paid</td>
      <td width="98" class="val">{_fmt(se1)}</td><td width="98" class="val">{_fmt(se2)}</td>
      <td width="98" class="val">{_fmt(se1)}</td><td width="98" class="val">{_fmt(se2)}</td>
      <td width="98" class="val">{_fmt(se1)}</td><td width="98" class="val">{_fmt(se2)}</td>
    </tr>
    <tr class="bold-row">
      <td width="140" class="lbl" style="font-weight:bold;">Total disposable income</td>
      <td width="98" class="val">{_fmt(disp_low_1)}</td><td width="98" class="val">{_fmt(disp_low_2)}</td>
      <td width="98" class="val">{_fmt(disp_mid_1)}</td><td width="98" class="val">{_fmt(disp_mid_2)}</td>
      <td width="98" class="val">{_fmt(disp_high_1)}</td><td width="98" class="val">{_fmt(disp_high_2)}</td>
    </tr>
    {spousal_annual_row}
  </table>
</div>

{tax_profile_html}

{terms_html}

</body>
</html>"""
    return html


def _tp_val(profile, key, default=0):
    """Safely get a value from a tax profile dict."""
    if not profile or not isinstance(profile, dict):
        return default
    v = profile.get(key, default)
    return float(v) if v is not None else default


def _build_tax_profile_page(data, p1, p2, p1_is_payor):
    """Build the Tax Profile page HTML (page 2).
    Uses tax profile dicts if available in data, otherwise skips."""
    # Try to get tax profile dicts
    if p1_is_payor:
        tp1_low = data.get("party1_tax_profile_low", data.get("payor_tax_profile_low"))
        tp1_mid = data.get("party1_tax_profile_mid", data.get("payor_tax_profile_mid"))
        tp1_high = data.get("party1_tax_profile_high", data.get("payor_tax_profile_high"))
        tp2_low = data.get("party2_tax_profile_low", data.get("recipient_tax_profile_low"))
        tp2_mid = data.get("party2_tax_profile_mid", data.get("recipient_tax_profile_mid"))
        tp2_high = data.get("party2_tax_profile_high", data.get("recipient_tax_profile_high"))
    else:
        tp1_low = data.get("party1_tax_profile_low", data.get("recipient_tax_profile_low"))
        tp1_mid = data.get("party1_tax_profile_mid", data.get("recipient_tax_profile_mid"))
        tp1_high = data.get("party1_tax_profile_high", data.get("recipient_tax_profile_high"))
        tp2_low = data.get("party2_tax_profile_low", data.get("payor_tax_profile_low"))
        tp2_mid = data.get("party2_tax_profile_mid", data.get("payor_tax_profile_mid"))
        tp2_high = data.get("party2_tax_profile_high", data.get("payor_tax_profile_high"))

    # If no tax profile data available, skip this page
    if not any([tp1_low, tp1_mid, tp1_high, tp2_low, tp2_mid, tp2_high]):
        return ""

    def _row(label, key, negate=False):
        vals = []
        for tp in [tp1_low, tp1_mid, tp1_high, tp2_low, tp2_mid, tp2_high]:
            v = _tp_val(tp, key)
            if negate:
                v = -abs(v) if v != 0 else 0
            vals.append(_fmt(v))
        return f"""<tr>
            <td width="140" class="lbl">{label}</td>
            <td width="98" class="val">{vals[0]}</td><td width="98" class="val">{vals[1]}</td><td width="98" class="val">{vals[2]}</td>
            <td width="98" class="val">{vals[3]}</td><td width="98" class="val">{vals[4]}</td><td width="98" class="val">{vals[5]}</td>
        </tr>"""

    def _section_hdr(label):
        return f"""<tr>
            <td width="140" style="font-weight:bold;background:#f0f0f0;padding:4px 6px;border:1px solid #d0d0d0;">{label}</td>
            <td width="98" style="background:#f0f0f0;border:1px solid #d0d0d0;"></td>
            <td width="98" style="background:#f0f0f0;border:1px solid #d0d0d0;"></td>
            <td width="98" style="background:#f0f0f0;border:1px solid #d0d0d0;"></td>
            <td width="98" style="background:#f0f0f0;border:1px solid #d0d0d0;"></td>
            <td width="98" style="background:#f0f0f0;border:1px solid #d0d0d0;"></td>
            <td width="98" style="background:#f0f0f0;border:1px solid #d0d0d0;"></td>
        </tr>"""

    province = data.get("party1_province", "Ontario")

    return f"""
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- PAGE 2: Tax Profile                                                    -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<div class="calc-report">
  <div class="report-title">CLOUDACT FAMILY LAW TOOLS</div>
  <div class="section-header">Tax Profile</div>
  <div style="font-size:10px;margin:4px 0 8px 0;color:#333;">
    The taxes paid and benefits received by each party will vary depending
    on the amount of spousal support that is paid. Detailed tax profiles for
    each party and each scenario are set out below.
  </div>
  <table class="details-table" width="728">
    <tr>
      <td width="140" class="lbl" style="background-color:#eef2f7;font-weight:bold;border:1px solid #d0d0d0;"></td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;border:1px solid #d0d0d0;">{p1}</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;border:1px solid #d0d0d0;">{p1}</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;border:1px solid #d0d0d0;">{p1}</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;border:1px solid #d0d0d0;">{p2}</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;border:1px solid #d0d0d0;">{p2}</td>
      <td width="98" class="scenario-hdr" style="background-color:#eef2f7;border:1px solid #d0d0d0;">{p2}</td>
    </tr>
    <tr class="sub-hdr">
      <td width="140" class="lbl"></td>
      <td width="98">Low</td><td width="98">Med</td><td width="98">High</td>
      <td width="98">Low</td><td width="98">Med</td><td width="98">High</td>
    </tr>
      {_section_hdr("Income")}
      {_row("Employment", "employed_income")}
      {_row("Self Employment", "self_employed_income")}
      {_row("Spousal Support", "deductible_support_paid", negate=True)}
      {_section_hdr("Deductions")}
      {_row("CPP Deductions", "cpp_deductions")}
      {_row("Child Care Expenses", "child_care_expenses")}
      {_section_hdr("Federal Credits")}
      {_row("Basic Personal Amount", "basic_personal_amount_federal")}
      {_row("CPP", "cpp_credit")}
      {_row("EI", "ei_credit")}
      {_row("Canada Employment", "canada_employment_credit")}
      {_section_hdr("Taxes and Deductions")}
      {_row("Federal Tax", "federal_tax")}
      {_row(f"{province} Tax", "provincial_tax")}
      {_row("CPP and EI", "cpp_ei_total")}
      {_section_hdr("Benefits")}
      {_row("Canada Child Benefit", "canada_child_benefit")}
      {_row("Climate Action Incentive", "climate_action_incentive")}
      {_row("GST/HST Benefit", "gst_hst_benefit")}
  </table>
</div>"""


def _build_terms_of_use_page():
    """Build the Terms of Use page HTML (last page)."""
    return """
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- LAST PAGE: Terms of Use                                                -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<div class="page-break"></div>
<div class="terms-page">
  <div class="terms-title">TERMS OF USE</div>
  <div class="terms-text">
    This support report was created using the Cloud Act support
    calculator. Please visit Cloud Act to learn more, or to
    perform your own support calculations.
    <br /><br />
    Calculations are current based on the laws and regulations in
    force as of the date the report was calculated. The Calculator applies
    the federal Child Support Guidelines ("CSG"), which are legally binding
    in most provinces in Canada, and the federal Spousal Support Advisory
    Guidelines ("SSAG"), which are not legally binding but are widely used
    on an advisory basis. Note that actual taxes and benefits may vary
    based on interpretations and calculations performed by the Canada
    Revenue Agency or relevant provincial or territorial authorities.
    <br /><br />
    This calculation is only as reliable as the inputs provided
    by the user: if income, expenses, taxes or benefits are different than
    set out in page 1, the amount of support should be recalculated to
    reflect reality.
    <br /><br />
    Although the Calculator generates child and spousal support
    amounts, support is not automatically payable in all circumstances.
    Family law is extremely complex and there are many other factors and
    legal issues not considered by this Calculator that could dramatically
    affect child and spousal support.
    <br /><br />
    This report does not contain legal advice or establish a
    lawyer-client relationship. By using or referencing this report in any
    way, you agree to indemnify CloudAct for any loss, damages, costs, or
    expenses incurred by you or any third parties in relation to this
    report, howsoever arising, regardless of theory of liability.
    <br /><br />
    If you have questions or concerns regarding this support
    calculation, please contact us.
  </div>
</div>"""


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

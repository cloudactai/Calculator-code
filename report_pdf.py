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
            <table style="margin-top: 8px; width: 440px;">
              <colgroup>
                <col style="width: 200px;" />
                <col style="width: 130px;" />
                <col style="width: 110px;" />
              </colgroup>
              <thead><tr>
                <th style="font-weight:bold;">Children</th><th>Lives with</th><th>CSG Table</th>
              </tr></thead>
              <tbody>{child_trs}</tbody>
            </table>"""

    # Important dates rows
    dates_rows = ""
    if date_of_marriage or date_of_separation:
        if date_of_marriage:
            dates_rows += f'<tr><td class="lbl">Date of Marriage/Cohabitation</td><td class="val">{_format_date_str(date_of_marriage)}</td></tr>'
        if date_of_separation:
            dates_rows += f'<tr><td class="lbl">Date of separation</td><td class="val">{_format_date_str(date_of_separation)}</td></tr>'
        if years:
            dates_rows += f'<tr><td class="lbl">Length of marriage</td><td class="val">{int(float(years))} years</td></tr>'
        if recipient_age:
            dates_rows += f'<tr><td class="lbl">Recipient age at separation</td><td class="val">{int(float(recipient_age))} years old</td></tr>'
    if has_children and youngest_yrs >= 0:
        dates_rows += f'<tr><td class="lbl">Years till youngest child finishes school</td><td class="val">{youngest_yrs} years</td></tr>'
    dates_rows += f'<tr><td class="lbl">Tax year</td><td class="val">{tax_year}</td></tr>'

    # Result rows
    result_rows = ""
    if has_child_support:
        result_rows += f'<tr class="bold-row"><td class="lbl" style="font-weight:bold;">Child Support (monthly)</td><td class="val result-val">{_fmt(round(cs_monthly))}</td></tr>'
    if has_spousal:
        result_rows += f'<tr><td class="lbl" colspan="2" style="font-weight:bold;">Spousal Support (monthly)</td></tr>'
        result_rows += f'<tr><td class="lbl" style="padding-left:20px;">Low</td><td class="val result-val">{_fmt(round(monthly_low))}</td></tr>'
        result_rows += f'<tr><td class="lbl" style="padding-left:20px;">Mid</td><td class="val result-val">{_fmt(round(monthly_mid))}</td></tr>'
        result_rows += f'<tr><td class="lbl" style="padding-left:20px;">High</td><td class="val result-val">{_fmt(round(monthly_high))}</td></tr>'
        if duration_label:
            result_rows += f'<tr class="bold-row"><td class="lbl" style="font-weight:bold;">Duration</td><td class="val">{duration_label}</td></tr>'

    # Child support detail rows
    cs_detail_rows = ""
    if has_child_support:
        cs_p1 = _fmt(-cs_annual) if cs_recipient_is_p2 else ""
        cs_p2 = _fmt(-cs_annual) if not cs_recipient_is_p2 else ""
        not_p1 = _fmt(-cs_annual) if not cs_recipient_is_p2 else ""
        not_p2 = _fmt(-cs_annual) if cs_recipient_is_p2 else ""
        cs_detail_rows = f"""
            <tr><td class="lbl">Child Support</td>
                <td class="val">{cs_p1}</td><td class="val">{cs_p2}</td>
                <td class="val">{cs_p1}</td><td class="val">{cs_p2}</td>
                <td class="val">{cs_p1}</td><td class="val">{cs_p2}</td></tr>
            <tr><td class="lbl">Notional child support</td>
                <td class="val">{not_p1}</td><td class="val">{not_p2}</td>
                <td class="val">{not_p1}</td><td class="val">{not_p2}</td>
                <td class="val">{not_p1}</td><td class="val">{not_p2}</td></tr>"""

    # Spousal annual row
    spousal_annual_row = ""
    if has_spousal:
        spousal_annual_row = f"""
            <tr class="bold-row">
              <td class="lbl" style="font-weight:bold;">Spousal Support (annual)</td>
              <td class="val" colspan="2" style="text-align:center;font-weight:bold;">{_fmt(round(monthly_low * 12))}</td>
              <td class="val" colspan="2" style="text-align:center;font-weight:bold;">{_fmt(round(monthly_mid * 12))}</td>
              <td class="val" colspan="2" style="text-align:center;font-weight:bold;">{_fmt(round(monthly_high * 12))}</td>
            </tr>"""

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: letter landscape;
    margin: 10mm 5mm 10mm 5mm;
  }}
  body {{
    margin: 0;
    padding: 0;
  }}
  .calc-report {{
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #333;
    padding: 20px 30px;
    background: #fff;
    width: 960px;
  }}
  .calc-report .report-title {{
    font-size: 16px;
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 16px;
    padding-bottom: 6px;
    border-bottom: 2px solid #2d5aa0;
  }}
  .calc-report .section-header {{
    font-weight: bold;
    font-size: 12px;
    background: #d9e2f3;
    color: #1a1a2e;
    padding: 5px 10px;
    margin: 12px 0 4px 0;
  }}
  .calc-report table {{
    border-collapse: collapse;
    margin-bottom: 2px;
  }}
  .calc-report td, .calc-report th {{
    padding: 4px 6px;
    font-size: 11px;
    border: 1px solid #d0d0d0;
  }}
  .calc-report th {{
    background: #eef2f7;
    font-weight: bold;
    text-align: center;
  }}
  .calc-report .lbl {{ text-align: left; }}
  .calc-report .val {{ text-align: right; }}
  .calc-report .bold-row td {{ font-weight: bold; }}
  .calc-report .result-header {{ background: #c5d9a4 !important; }}
  .calc-report .result-val {{
    font-size: 13px;
    font-weight: bold;
    color: #1a1a2e;
  }}
  .calc-report .details-table td,
  .calc-report .details-table th {{
    font-size: 10px;
    padding: 3px 6px;
  }}
  .calc-report .scenario-hdr {{
    text-align: center;
    font-weight: bold;
    font-size: 11px;
  }}
  .calc-report .sub-hdr td {{
    text-align: center;
    font-weight: bold;
    font-size: 10px;
    background: #f5f5f5;
  }}
</style>
</head>
<body>
<div class="calc-report">
  <div class="report-title">CLOUDACT FAMILY LAW TOOLS</div>

  <!-- TOP ROW: use float divs instead of nested tables (xhtml2pdf bug with nested tables) -->
  <div style="width:460px; float:left; margin-right:20px;">
      <div class="section-header">Calculation Input</div>
      <table style="width:460px;">
        <thead>
          <tr><th></th><th>{p1}</th><th>{p2}</th></tr>
          <tr><td></td><td class="val" style="font-weight:bold;">{"Payor" if p1_is_payor else "Recipient"}</td><td class="val" style="font-weight:bold;">{"Recipient" if p1_is_payor else "Payor"}</td></tr>
        </thead>
        <tbody>
          <tr><td class="lbl">Age</td><td class="val">{p1_age if p1_age else ""}</td><td class="val">{p2_age if p2_age else ""}</td></tr>
          <tr><td class="lbl">Province</td><td class="val">{p1_prov}</td><td class="val">{p2_prov}</td></tr>
          <tr><td class="lbl">Employment income</td><td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td></tr>
          <tr><td class="lbl">Claims dependent credit</td><td class="val">{p1_claims or "No"}</td><td class="val">{p2_claims or "No"}</td></tr>
        </tbody>
      </table>
      {children_rows}
  </div>
  <div style="width:460px; float:left;">
      <div class="section-header">Important dates</div>
      <table style="width:460px;"><tbody>{dates_rows}</tbody></table>
  </div>
  <div style="clear:both;"></div>

  <!-- RESULT -->
  <div style="width:470px;">
    <div class="section-header result-header">Result</div>
    <table style="width:450px;"><tbody>{result_rows}</tbody></table>
  </div>

  <!-- CALCULATION DETAILS -->
  <table class="details-table" style="margin-top:14px; width:960px;">
    <thead>
      <tr><th colspan="7" class="section-header" style="text-align:left;margin:0;">Calculation details</th></tr>
      <tr>
        <th class="lbl"></th>
        <th colspan="2" class="scenario-hdr">LOW</th>
        <th colspan="2" class="scenario-hdr">MID</th>
        <th colspan="2" class="scenario-hdr">HIGH</th>
      </tr>
      <tr class="sub-hdr">
        <td class="lbl"></td><td>Party 1</td><td>Party 2</td>
        <td>Party 1</td><td>Party 2</td><td>Party 1</td><td>Party 2</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="lbl">Guideline income</td>
        <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
        <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
        <td class="val">{_fmt(p1_income)}</td><td class="val">{_fmt(p2_income)}</td>
      </tr>
      <tr>
        <td class="lbl">Taxes and deductions</td>
        <td class="val">{_fmt2(tax_low_1)}</td><td class="val">{_fmt2(tax_low_2)}</td>
        <td class="val">{_fmt2(tax_mid_1)}</td><td class="val">{_fmt2(tax_mid_2)}</td>
        <td class="val">{_fmt2(tax_high_1)}</td><td class="val">{_fmt2(tax_high_2)}</td>
      </tr>
      <tr>
        <td class="lbl">Benefits and credits</td>
        <td class="val">{_fmt2(ben_low_1)}</td><td class="val">{_fmt2(ben_low_2)}</td>
        <td class="val">{_fmt2(ben_mid_1)}</td><td class="val">{_fmt2(ben_mid_2)}</td>
        <td class="val">{_fmt2(ben_high_1)}</td><td class="val">{_fmt2(ben_high_2)}</td>
      </tr>
      {cs_detail_rows}
      <tr>
        <td class="lbl">Special expenses paid</td>
        <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
        <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
        <td class="val">{_fmt(se1)}</td><td class="val">{_fmt(se2)}</td>
      </tr>
      <tr class="bold-row">
        <td class="lbl" style="font-weight:bold;">Total disposable income</td>
        <td class="val">{_fmt2(disp_low_1)}</td><td class="val">{_fmt2(disp_low_2)}</td>
        <td class="val">{_fmt2(disp_mid_1)}</td><td class="val">{_fmt2(disp_mid_2)}</td>
        <td class="val">{_fmt2(disp_high_1)}</td><td class="val">{_fmt2(disp_high_2)}</td>
      </tr>
      {spousal_annual_row}
    </tbody>
  </table>
</div>
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

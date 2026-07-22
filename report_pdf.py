"""
report_pdf.py
-------------
Generate PDF reports matching the CalculationReport.tsx layout for both
child support and spousal support calculations.

Uses reportlab to produce a professional single-page PDF with:
  - Title header
  - Calculation Input + Important Dates (side by side)
  - Result summary (child support, spousal support low/mid/high, duration)
  - Calculation details table (LOW / MID / HIGH × Party 1 / Party 2)
"""

import os
import uuid
from datetime import date, datetime
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


# ── Colors ───────────────────────────────────────────────────────────────────
DARK_BLUE   = HexColor("#1a1a2e")
HEADER_BG   = HexColor("#d9e2f3")
RESULT_BG   = HexColor("#c5d9a4")
LIGHT_GREY  = HexColor("#eef2f7")
SUBTLE_GREY = HexColor("#f5f5f5")
BORDER_GREY = HexColor("#d0d0d0")
ACCENT_BLUE = HexColor("#2d5aa0")


def _fmt(val):
    """Format a number as $X,XXX (negative in parentheses)."""
    if val is None:
        return ""
    val = round(float(val))
    if val == 0:
        return "$0"
    if val < 0:
        return f"-${abs(val):,.0f}"
    return f"${val:,.0f}"


def _format_date_str(s):
    """Convert ISO date string to MM/DD/YYYY for display."""
    if not s:
        return ""
    try:
        d = datetime.fromisoformat(str(s)[:10])
        return d.strftime("%m/%d/%Y")
    except Exception:
        return str(s)


def _fmt2(val):
    """Format a number as $X,XXX.XX (negative with minus sign)."""
    if val is None:
        return ""
    val = float(val)
    if val < 0:
        return f"-${abs(val):,.2f}"
    return f"${val:,.2f}"


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


# ─────────────────────────────────────────────────────────────────────────────
# Child Support Report
# ─────────────────────────────────────────────────────────────────────────────

def generate_child_support_report(data: dict) -> str:
    """
    Generate a child support PDF report.

    data keys:
        party1_name, party2_name, party1_income, party2_income,
        children (list of dicts with name, dob, custody_arrangement, is_adult),
        scenario, net_payer, net_monthly, net_annual,
        child_support_ref: { party1_monthly, party2_monthly, party1_annual, party2_annual }
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
    # Blue line
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

    # Show per-party breakdown if both have values
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


# ─────────────────────────────────────────────────────────────────────────────
# Spousal Support Report
# ─────────────────────────────────────────────────────────────────────────────

def generate_spousal_support_report(data: dict) -> str:
    """
    Generate a spousal support PDF report matching CalculationReport.tsx.

    Returns: filename (relative to REPORTS_DIR)
    """
    report_id = uuid.uuid4().hex[:12]
    filename = f"spousal_support_report_{report_id}.pdf"
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
    payor = data.get("payor", "")
    recipient = data.get("recipient", "")
    years = data.get("years_married", data.get("years", 0))
    # children can be a bool or a list; normalise
    children_raw = data.get("children", [])
    if isinstance(children_raw, list):
        has_children = len(children_raw) > 0
        children_list = children_raw
    else:
        has_children = bool(children_raw)
        children_list = data.get("children_list", [])

    cs_paid = data.get("monthly_cs_paid", 0)

    # ── Calculation Input + Important Dates (side by side) ──
    # Left: Calculation Input
    left_data = [
        [Paragraph("Calculation Input", styles["section"]), "", ""],
        ["", p1, p2],
        ["", "Payor" if p1 == payor else "Recipient",
             "Payor" if p2 == payor else "Recipient"],
    ]
    p1_age = data.get("party1_age", "")
    p2_age = data.get("party2_age", "")
    if p1_age or p2_age:
        left_data.append(["Age", str(p1_age) if p1_age else "", str(p2_age) if p2_age else ""])
    p1_prov = data.get("party1_province", "")
    p2_prov = data.get("party2_province", "")
    if p1_prov or p2_prov:
        left_data.append(["Province", p1_prov, p2_prov])
    left_data.append(["Employment income", _fmt(p1_income), _fmt(p2_income)])
    p1_claims = data.get("party1_claims_dependent", "")
    p2_claims = data.get("party2_claims_dependent", "")
    if p1_claims or p2_claims:
        left_data.append(["Claims dependent credit", p1_claims, p2_claims])

    left_table = Table(left_data, colWidths=[1.8*inch, 1.3*inch, 1.3*inch])
    ts = _base_table_style()
    ts += [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("SPAN", (0, 0), (-1, 0)),
        ("FONTNAME", (0, 1), (-1, 2), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT_GREY),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
    ]
    left_table.setStyle(TableStyle(ts))

    # Right: Important Dates
    right_data = [
        [Paragraph("Important dates", styles["section"]), ""],
    ]
    date_of_marriage = data.get("date_of_marriage", "")
    date_of_separation = data.get("date_of_separation", "")
    if date_of_marriage:
        right_data.append(["Date of Marriage/Cohabitation", _format_date_str(date_of_marriage)])
    if date_of_separation:
        right_data.append(["Date of separation", _format_date_str(date_of_separation)])
    if years:
        right_data.append(["Length of marriage", f"{int(years)} years"])
    recipient_age = data.get("recipient_age", "")
    if recipient_age:
        right_data.append(["Recipient age at separation", f"{int(float(recipient_age))} years old"])

    if has_children and children_list:
        today = date.today()
        child_ages = []
        for c in children_list:
            try:
                dob = date.fromisoformat(str(c.get("date_of_birth", c.get("dob", "")))[:10])
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                child_ages.append(age)
            except Exception:
                pass
        if child_ages:
            youngest = min(child_ages)
            yrs_to_18 = max(0, 18 - youngest)
            right_data.append(["Years till youngest child finishes school", f"{yrs_to_18} years"])

    tax_year = data.get("tax_year", "")
    if tax_year:
        right_data.append(["Tax year", str(tax_year)])

    right_table = Table(right_data, colWidths=[2.4*inch, 1.6*inch])
    ts = _base_table_style()
    ts += [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("SPAN", (0, 0), (-1, 0)),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
    ]
    right_table.setStyle(TableStyle(ts))

    # Combine side by side
    combined = Table(
        [[left_table, right_table]],
        colWidths=[4.5*inch, 4.1*inch],
    )
    combined.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(combined)
    elements.append(Spacer(1, 8))

    # ── Children table (if applicable) ──
    if has_children and children_list:
        ch_header = Table(
            [[Paragraph("Children", styles["section"]), "", ""]],
            colWidths=[3*inch, 2*inch, 2*inch],
        )
        ch_header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
            ("SPAN", (0, 0), (-1, 0)),
            ("TOPPADDING", (0, 0), (-1, 0), 4),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
            ("LEFTPADDING", (0, 0), (-1, 0), 6),
        ]))
        elements.append(ch_header)

        ch_data = [["Children", "Lives with", "CSG Table"]]
        today = date.today()
        for c in children_list:
            name = c.get("name", "")
            dob_str = str(c.get("date_of_birth", c.get("dob", "")))[:10]
            try:
                dob = date.fromisoformat(dob_str)
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                label = f"{name} / {age} yrs" if name else f"Child {age} yrs"
            except Exception:
                label = name or "Child"
            custody = c.get("custody_arrangement", c.get("custodyArrangement", ""))
            csg = c.get("csg_table", "Yes")
            ch_data.append([label, custody, csg])

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

    result_data = []

    # Child support line (if with-children)
    if has_children and cs_paid:
        result_data.append(["Child Support (monthly)", _fmt(cs_paid)])

    # Spousal support
    result_data.append(["Spousal Support (monthly)", ""])
    result_data.append(["  Low",  _fmt(data.get("monthly_low", 0))])
    result_data.append(["  Mid",  _fmt(data.get("monthly_med", data.get("monthly_mid", 0)))])
    result_data.append(["  High", _fmt(data.get("monthly_high", 0))])
    result_data.append(["Duration", data.get("duration_label", "")])

    if data.get("note"):
        result_data.append(["Note", data["note"]])

    result_table = Table(result_data, colWidths=[4.5*inch, 2.5*inch])
    ts = _base_table_style()
    ts += [
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (1, 0), (1, -1), 11),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]
    result_table.setStyle(TableStyle(ts))
    elements.append(result_table)
    elements.append(Spacer(1, 8))

    # ── Calculation Details ──
    detail_header = Table(
        [[Paragraph("Calculation details", styles["section"])]],
        colWidths=[7*inch],
    )
    detail_header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("LEFTPADDING", (0, 0), (-1, 0), 6),
    ]))
    elements.append(detail_header)

    # Determine party order: Party 1 / Party 2 (matching frontend)
    detail_data = [
        ["", "LOW", "", "MID", "", "HIGH", ""],
        ["", "Party 1", "Party 2", "Party 1", "Party 2", "Party 1", "Party 2"],
        ["Guideline income",
         _fmt(p1_income), _fmt(p2_income),
         _fmt(p1_income), _fmt(p2_income),
         _fmt(p1_income), _fmt(p2_income)],
        ["Taxes and deductions",
         _fmt2(-abs(float(data.get("party1_taxes_low", data.get("payor_taxes_low", 0))))),
         _fmt2(-abs(float(data.get("party2_taxes_low", data.get("recipient_taxes_low", 0))))),
         _fmt2(-abs(float(data.get("party1_taxes_mid", data.get("payor_taxes_mid", 0))))),
         _fmt2(-abs(float(data.get("party2_taxes_mid", data.get("recipient_taxes_mid", 0))))),
         _fmt2(-abs(float(data.get("party1_taxes_high", data.get("payor_taxes_high", 0))))),
         _fmt2(-abs(float(data.get("party2_taxes_high", data.get("recipient_taxes_high", 0)))))],
        ["Benefits and credits",
         _fmt2(float(data.get("party1_benefits_low", data.get("payor_benefits_low", 0)))),
         _fmt2(float(data.get("party2_benefits_low", data.get("recipient_benefits_low", 0)))),
         _fmt2(float(data.get("party1_benefits_mid", data.get("payor_benefits_mid", 0)))),
         _fmt2(float(data.get("party2_benefits_mid", data.get("recipient_benefits_mid", 0)))),
         _fmt2(float(data.get("party1_benefits_high", data.get("payor_benefits_high", 0)))),
         _fmt2(float(data.get("party2_benefits_high", data.get("recipient_benefits_high", 0))))],
    ]

    # Child Support + Notional child support rows (if with-children)
    if has_children and cs_paid:
        annual_cs = round(float(cs_paid) * 12)
        # Determine who pays: payor pays CS, recipient gets notional
        payor_is_p1 = (p1 == payor)
        cs_p1 = _fmt(-annual_cs) if payor_is_p1 else ""
        cs_p2 = _fmt(-annual_cs) if not payor_is_p1 else ""
        notional_p1 = _fmt(-annual_cs) if not payor_is_p1 else ""
        notional_p2 = _fmt(-annual_cs) if payor_is_p1 else ""
        detail_data.append(["Child Support",
                            cs_p1, cs_p2, cs_p1, cs_p2, cs_p1, cs_p2])
        detail_data.append(["Notional child support",
                            notional_p1, notional_p2, notional_p1, notional_p2, notional_p1, notional_p2])

    # Special expenses paid
    se1 = data.get("special_expenses_party1", 0)
    se2 = data.get("special_expenses_party2", 0)
    detail_data.append(["Special expenses paid",
                        _fmt(se1), _fmt(se2),
                        _fmt(se1), _fmt(se2),
                        _fmt(se1), _fmt(se2)])

    # Total disposable income
    detail_data.append(["Total disposable income",
     _fmt2(float(data.get("party1_indi_low", data.get("payor_indi_low", 0)))),
     _fmt2(float(data.get("party2_indi_low", data.get("recipient_indi_low", 0)))),
     _fmt2(float(data.get("party1_indi_mid", data.get("payor_indi_mid", 0)))),
     _fmt2(float(data.get("party2_indi_mid", data.get("recipient_indi_mid", 0)))),
     _fmt2(float(data.get("party1_indi_high", data.get("payor_indi_high", 0)))),
     _fmt2(float(data.get("party2_indi_high", data.get("recipient_indi_high", 0))))])

    # Spousal Support (annual)
    detail_data.append(["Spousal Support (annual)",
     _fmt(data.get("annual_low", 0)), "",
     _fmt(data.get("annual_med", data.get("annual_mid", 0))), "",
     _fmt(data.get("annual_high", 0)), ""])

    col_w = [1.8*inch] + [0.87*inch]*6
    detail_table = Table(detail_data, colWidths=col_w)
    ts = _base_table_style()
    ts += [
        ("FONTSIZE",   (0, 0), (-1, -1), 8),
        ("FONTNAME",   (0, 0), (-1, 1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
        ("BACKGROUND", (0, 1), (-1, 1), SUBTLE_GREY),
        ("ALIGN",      (1, 0), (-1, -1), "CENTER"),
        ("ALIGN",      (0, 0), (0, -1), "LEFT"),
        # Merge scenario headers
        ("SPAN", (1, 0), (2, 0)),
        ("SPAN", (3, 0), (4, 0)),
        ("SPAN", (5, 0), (6, 0)),
        # Merge annual spousal support across party columns
        ("SPAN", (1, -1), (2, -1)),
        ("SPAN", (3, -1), (4, -1)),
        ("SPAN", (5, -1), (6, -1)),
        # Bold last two rows
        ("FONTNAME", (0, -2), (-1, -1), "Helvetica-Bold"),
    ]
    detail_table.setStyle(TableStyle(ts))
    elements.append(detail_table)

    doc.build(elements)
    return filename

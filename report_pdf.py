"""
report_pdf.py
-------------
Generate PDF reports matching the CalculationReport.tsx layout for both
child support and spousal support calculations.

Uses ReportLab for both report types.
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
# Spousal Support Report  (ReportLab – matching CalculationReport.tsx)
# ─────────────────────────────────────────────────────────────────────────────

# Page usable width: letter (8.5") – 0.6" left – 0.6" right = 7.3"
_PAGE_W = 7.3 * inch

# React uses flex:1 + flex:1 with 20px gap → each side ≈ 50%.
# 7.3" / 2 = 3.65" per side, with 0.2" gap between.
_HALF_W = 3.45 * inch
_GAP = _PAGE_W - 2 * _HALF_W  # ~0.4"

# ── Calc Input table: 3 cols (must fit in _HALF_W) ──
_CI_COL0 = 1.45 * inch   # label
_CI_COL1 = 1.0 * inch    # party 1
_CI_COL2 = 1.0 * inch    # party 2
_CI_TOTAL = _HALF_W

# ── Important Dates table: 2 cols (must fit in _HALF_W) ──
_ID_COL0 = 2.15 * inch   # label
_ID_COL1 = 1.3 * inch    # value
_ID_TOTAL = _HALF_W

# ── Result table (half width, matching top-left) ──
_RES_COL0 = 2.1 * inch
_RES_COL1 = 1.35 * inch

# ── Calculation Details: 7 cols ──
_DET_COL0 = 1.6 * inch
_DET_COL  = (_PAGE_W - _DET_COL0) / 6  # ~0.95" each


def _section_header(text, width, bg=HEADER_BG):
    """One-row table acting as a coloured section header."""
    styles = _styles()
    t = Table([[Paragraph(text, styles["section"])]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), bg),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("LEFTPADDING", (0, 0), (-1, 0), 8),
    ]))
    return t


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
        leftMargin=0.6 * inch, rightMargin=0.6 * inch,
        topMargin=0.5 * inch, bottomMargin=0.5 * inch,
    )
    elements = []

    # ── Title ──
    elements.append(Paragraph("CLOUDACT FAMILY LAW TOOLS", styles["title"]))
    elements.append(Spacer(1, 2))
    line_table = Table([[""]], colWidths=[_PAGE_W])
    line_table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 2, ACCENT_BLUE),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 10))

    # ── Extract data ──
    p1 = data.get("party1_name", "Party 1")
    p2 = data.get("party2_name", "Party 2")
    p1_income = data.get("party1_income", 0)
    p2_income = data.get("party2_income", 0)
    payor = data.get("payor", "")
    recipient = data.get("recipient", "")
    years = data.get("years_married", data.get("years", 0))
    p1_is_payor = (p1 == payor) if payor else (float(p1_income) > float(p2_income))

    # children normalise
    children_raw = data.get("children", [])
    if isinstance(children_raw, list):
        has_children = len(children_raw) > 0
        children_list = children_raw
    else:
        has_children = bool(children_raw)
        children_list = data.get("children_list", [])

    cs_paid = float(data.get("monthly_cs_paid", 0))

    p1_age = data.get("party1_age", "")
    p2_age = data.get("party2_age", "")
    p1_prov = data.get("party1_province", "")
    p2_prov = data.get("party2_province", "")
    p1_claims = data.get("party1_claims_dependent", "")
    p2_claims = data.get("party2_claims_dependent", "")

    # ────────────────────────────────────────────────────────────────────────
    # LEFT TABLE: Calculation Input  (3 cols)
    # ────────────────────────────────────────────────────────────────────────
    ci_data = [
        ["", p1, p2],
        ["", "Payor" if p1_is_payor else "Recipient",
             "Recipient" if p1_is_payor else "Payor"],
        ["Age", str(p1_age) if p1_age else "", str(p2_age) if p2_age else ""],
        ["Province", p1_prov, p2_prov],
        ["Employment income", _fmt(p1_income), _fmt(p2_income)],
        ["Claims dependent credit",
         str(p1_claims) if p1_claims else "",
         str(p2_claims) if p2_claims else ""],
    ]

    ci_table = Table(ci_data, colWidths=[_CI_COL0, _CI_COL1, _CI_COL2])
    ci_ts = _base_table_style() + [
        # party name header row
        ("FONTNAME",   (0, 0), (-1, 1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
        ("ALIGN",      (1, 0), (-1, -1), "RIGHT"),
    ]
    ci_table.setStyle(TableStyle(ci_ts))

    # ── Children sub-table (inside left column) ──
    children_table = None
    if has_children and children_list:
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

        children_table = Table(ch_data, colWidths=[_CI_COL0, _CI_COL1, _CI_COL2])
        ch_ts = _base_table_style() + [
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
            ("ALIGN",      (1, 0), (-1, -1), "RIGHT"),
        ]
        children_table.setStyle(TableStyle(ch_ts))

    # ────────────────────────────────────────────────────────────────────────
    # RIGHT TABLE: Important Dates  (2 cols)
    # ────────────────────────────────────────────────────────────────────────
    id_data = []
    date_of_marriage = data.get("date_of_marriage", "")
    date_of_separation = data.get("date_of_separation", "")
    if date_of_marriage:
        id_data.append(["Date of Marriage/Cohabitation", _format_date_str(date_of_marriage)])
    if date_of_separation:
        id_data.append(["Date of separation", _format_date_str(date_of_separation)])
    if years:
        id_data.append(["Length of marriage", f"{int(years)} years"])
    recipient_age = data.get("recipient_age", "")
    if recipient_age:
        id_data.append(["Recipient age at separation", f"{int(float(recipient_age))} years old"])

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
            id_data.append(["Years till youngest child finishes school", f"{yrs_to_18} years"])

    tax_year = data.get("tax_year", "")
    if tax_year:
        id_data.append(["Tax year", str(tax_year)])

    if not id_data:
        id_data.append(["", ""])

    id_table = Table(id_data, colWidths=[_ID_COL0, _ID_COL1])
    id_ts = _base_table_style() + [
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]
    id_table.setStyle(TableStyle(id_ts))

    # ────────────────────────────────────────────────────────────────────────
    # BUILD RESULT TABLE (will go inside left column)
    # ────────────────────────────────────────────────────────────────────────
    res_w = _CI_TOTAL
    result_data = []

    # Child support line
    if has_children and cs_paid:
        result_data.append([
            Paragraph("<b>Child Support (monthly)</b>", styles["bold"]),
            Paragraph(f"<b>{_fmt(cs_paid)}</b>", ParagraphStyle(
                "resval", parent=styles["bold"], fontSize=11, alignment=2)),
        ])

    # Spousal support header
    result_data.append([
        Paragraph("<b>Spousal Support (monthly)</b>", styles["bold"]),
        "",
    ])
    # Low / Mid / High
    monthly_low = data.get("monthly_low", 0)
    monthly_mid = data.get("monthly_med", data.get("monthly_mid", 0))
    monthly_high = data.get("monthly_high", 0)
    indent_style = ParagraphStyle("indent", parent=styles["normal"], leftIndent=14)
    val_style = ParagraphStyle("resval", parent=styles["bold"], fontSize=11, alignment=2)

    result_data.append([Paragraph("Low", indent_style),
                        Paragraph(f"<b>{_fmt(monthly_low)}</b>", val_style)])
    result_data.append([Paragraph("Mid", indent_style),
                        Paragraph(f"<b>{_fmt(monthly_mid)}</b>", val_style)])
    result_data.append([Paragraph("High", indent_style),
                        Paragraph(f"<b>{_fmt(monthly_high)}</b>", val_style)])

    # Duration
    duration_label = data.get("duration_label", "")
    if duration_label:
        result_data.append([
            Paragraph("<b>Duration</b>", styles["bold"]),
            Paragraph(duration_label, ParagraphStyle("durval", parent=styles["normal"], alignment=2)),
        ])

    res_col0 = res_w * 0.62
    res_col1 = res_w * 0.38
    result_table = Table(result_data, colWidths=[res_col0, res_col1])
    res_ts = _base_table_style() + [
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]
    result_table.setStyle(TableStyle(res_ts))

    # ────────────────────────────────────────────────────────────────────────
    # SIDE-BY-SIDE: left (Calc Input + Children + Result) | right (Dates)
    # ────────────────────────────────────────────────────────────────────────

    # Build left column flowables
    left_flowables = [
        _section_header("Calculation Input", _CI_TOTAL),
        ci_table,
    ]
    if children_table:
        left_flowables.append(Spacer(1, 6))
        left_flowables.append(children_table)
    # Result goes below Calculation Input in the left column
    left_flowables.append(Spacer(1, 6))
    left_flowables.append(_section_header("Result", _CI_TOTAL, bg=RESULT_BG))
    left_flowables.append(result_table)

    # Build right column flowables
    right_flowables = [
        _section_header("Important dates", _ID_TOTAL),
        id_table,
    ]

    # Use nested tables for each column to stack flowables
    left_wrapper = Table([[f] for f in left_flowables], colWidths=[_CI_TOTAL])
    left_wrapper.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    right_wrapper = Table([[f] for f in right_flowables], colWidths=[_ID_TOTAL])
    right_wrapper.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))

    layout = Table(
        [[left_wrapper, "", right_wrapper]],
        colWidths=[_CI_TOTAL, _GAP, _ID_TOTAL],
    )
    layout.setStyle(TableStyle([
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
    ]))
    elements.append(layout)
    elements.append(Spacer(1, 8))

    # ────────────────────────────────────────────────────────────────────────
    # CALCULATION DETAILS  (full width, 7 columns)
    # ────────────────────────────────────────────────────────────────────────
    elements.append(_section_header("Calculation details", _PAGE_W))

    def _g(key, fb, default=0):
        return float(data.get(key, data.get(fb, default)))

    detail_data = [
        ["", "LOW", "", "MID", "", "HIGH", ""],
        ["", "Party 1", "Party 2", "Party 1", "Party 2", "Party 1", "Party 2"],
        ["Guideline income",
         _fmt(p1_income), _fmt(p2_income),
         _fmt(p1_income), _fmt(p2_income),
         _fmt(p1_income), _fmt(p2_income)],
        ["Taxes and deductions",
         _fmt2(-abs(_g("party1_taxes_low", "payor_taxes_low"))),
         _fmt2(-abs(_g("party2_taxes_low", "recipient_taxes_low"))),
         _fmt2(-abs(_g("party1_taxes_mid", "payor_taxes_mid"))),
         _fmt2(-abs(_g("party2_taxes_mid", "recipient_taxes_mid"))),
         _fmt2(-abs(_g("party1_taxes_high", "payor_taxes_high"))),
         _fmt2(-abs(_g("party2_taxes_high", "recipient_taxes_high")))],
        ["Benefits and credits",
         _fmt2(_g("party1_benefits_low", "payor_benefits_low")),
         _fmt2(_g("party2_benefits_low", "recipient_benefits_low")),
         _fmt2(_g("party1_benefits_mid", "payor_benefits_mid")),
         _fmt2(_g("party2_benefits_mid", "recipient_benefits_mid")),
         _fmt2(_g("party1_benefits_high", "payor_benefits_high")),
         _fmt2(_g("party2_benefits_high", "recipient_benefits_high"))],
    ]

    # Child Support + Notional
    if has_children and cs_paid:
        annual_cs = round(cs_paid * 12)
        cs_p1  = _fmt(-annual_cs) if p1_is_payor else ""
        cs_p2  = _fmt(-annual_cs) if not p1_is_payor else ""
        not_p1 = _fmt(-annual_cs) if not p1_is_payor else ""
        not_p2 = _fmt(-annual_cs) if p1_is_payor else ""
        detail_data.append(["Child Support",
                            cs_p1, cs_p2, cs_p1, cs_p2, cs_p1, cs_p2])
        detail_data.append(["Notional child support",
                            not_p1, not_p2, not_p1, not_p2, not_p1, not_p2])

    # Special expenses
    se1 = data.get("special_expenses_party1", 0)
    se2 = data.get("special_expenses_party2", 0)
    detail_data.append(["Special expenses paid",
                        _fmt(se1), _fmt(se2), _fmt(se1), _fmt(se2), _fmt(se1), _fmt(se2)])

    # Total disposable income
    detail_data.append(["Total disposable income",
        _fmt2(_g("party1_indi_low", "payor_indi_low")),
        _fmt2(_g("party2_indi_low", "recipient_indi_low")),
        _fmt2(_g("party1_indi_mid", "payor_indi_mid")),
        _fmt2(_g("party2_indi_mid", "recipient_indi_mid")),
        _fmt2(_g("party1_indi_high", "payor_indi_high")),
        _fmt2(_g("party2_indi_high", "recipient_indi_high"))])

    # Spousal Support (annual) – spans 2 cols per scenario
    detail_data.append(["Spousal Support (annual)",
        _fmt(data.get("annual_low", 0)), "",
        _fmt(data.get("annual_med", data.get("annual_mid", 0))), "",
        _fmt(data.get("annual_high", 0)), ""])

    col_w = [_DET_COL0] + [_DET_COL] * 6
    detail_table = Table(detail_data, colWidths=col_w)
    dt_ts = _base_table_style() + [
        ("FONTSIZE",   (0, 0), (-1, -1), 8),
        ("FONTNAME",   (0, 0), (-1, 1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
        ("BACKGROUND", (0, 1), (-1, 1), SUBTLE_GREY),
        ("ALIGN",      (1, 0), (-1, -1), "CENTER"),
        ("ALIGN",      (0, 0), (0, -1), "LEFT"),
        # Merge scenario headers: LOW, MID, HIGH
        ("SPAN", (1, 0), (2, 0)),
        ("SPAN", (3, 0), (4, 0)),
        ("SPAN", (5, 0), (6, 0)),
        # Merge annual spousal support across party columns
        ("SPAN", (1, -1), (2, -1)),
        ("SPAN", (3, -1), (4, -1)),
        ("SPAN", (5, -1), (6, -1)),
        # Bold last two rows (Total disposable + Spousal annual)
        ("FONTNAME", (0, -2), (-1, -1), "Helvetica-Bold"),
    ]
    detail_table.setStyle(TableStyle(dt_ts))
    elements.append(detail_table)

    doc.build(elements)
    return filename

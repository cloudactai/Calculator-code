"""Audit all PDF/JSON form pairs for pages with fillable blanks but no fields.

Detects bracket tokens ([name], [date], etc.), underscore runs, and
"Issued/Dated ... , 20" patterns on pages that have zero fields in the
JSON mapping.

Usage:
    python3 audit_missing_fields.py                # full scan
    python3 audit_missing_fields.py --prefix NSFD   # only NSFD_* forms
    python3 audit_missing_fields.py --out report.md # write to file
"""
import argparse
import json
import os
import re
import sys

import fitz

EXPORT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__)))), "form-template-export")

BRACKET_RE = re.compile(r"\[(?:name|date|amount|address|copy standard heading|"
                        r"date of birth|his/her|he/she|is/are|child/children|"
                        r"sworn/affirmed|name or blank|insert|number|time|"
                        r"municipality|county|city|town|province|postal code|"
                        r"telephone|fax|email|age|relationship|occupation|"
                        r"employer|income|reason|specify|description|location|"
                        r"type|year|month|day|hour|minute|set out|"
                        r"name of applicant|name of respondent|"
                        r"name of moving party, parties, or counsel)\]",
                        re.IGNORECASE)

UNDERSCORE_RE = re.compile(r"_{5,}")
ISSUED_DATE_RE = re.compile(r"(?:Issued|Dated)\b.*,\s*20\s*$", re.MULTILINE)


def get_page_fields(json_data, page_no):
    """Return list of fields on a given 1-indexed page."""
    return [f for f in json_data.get("staticFields", [])
            if f.get("page") == page_no]


def scan_page(page):
    """Return list of (blank_type, matched_text) found on the page."""
    text = page.get_text("text")
    findings = []

    for m in BRACKET_RE.finditer(text):
        findings.append(("bracket", m.group()))

    for m in UNDERSCORE_RE.finditer(text):
        findings.append(("underscore", m.group()[:20]))

    for m in ISSUED_DATE_RE.finditer(text):
        findings.append(("issued/dated", m.group().strip()[:60]))

    return findings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prefix", default=None,
                        help="only scan forms whose ID starts with this")
    parser.add_argument("--out", default=None,
                        help="write markdown report to this file")
    args = parser.parse_args()

    pdfs = sorted(f for f in os.listdir(EXPORT)
                  if f.endswith(".pdf") and not f.startswith("_"))

    if args.prefix:
        pdfs = [f for f in pdfs if f.startswith(args.prefix)]

    issues = []

    for pdf_name in pdfs:
        doc_id = pdf_name[:-4]
        json_path = os.path.join(EXPORT, f"{doc_id}.json")
        pdf_path = os.path.join(EXPORT, pdf_name)

        if not os.path.exists(json_path):
            continue

        with open(json_path) as f:
            try:
                json_data = json.load(f)
            except json.JSONDecodeError:
                continue

        try:
            doc = fitz.open(pdf_path)
        except Exception:
            continue

        for page_idx in range(len(doc)):
            page_no = page_idx + 1
            page = doc[page_idx]

            blanks = scan_page(page)
            if not blanks:
                continue

            fields_on_page = get_page_fields(json_data, page_no)
            if fields_on_page:
                continue

            issues.append({
                "doc_id": doc_id,
                "page": page_no,
                "total_pages": len(doc),
                "blanks": blanks,
            })

        doc.close()

    # Output
    lines = []
    lines.append(f"# Missing-Field Audit Report\n")
    lines.append(f"Scanned {len(pdfs)} PDF/JSON pairs. "
                 f"Found **{len(issues)}** pages with fillable blanks "
                 f"but zero fields in the JSON.\n")
    lines.append("---\n")

    if not issues:
        lines.append("No issues found.\n")
    else:
        by_doc = {}
        for iss in issues:
            by_doc.setdefault(iss["doc_id"], []).append(iss)

        lines.append(f"## Summary\n")
        lines.append(f"| Form | Page | Blanks found |")
        lines.append(f"|------|------|-------------|")
        for iss in issues:
            blank_summary = ", ".join(
                f"{bt}: `{txt}`" for bt, txt in iss["blanks"][:5])
            if len(iss["blanks"]) > 5:
                blank_summary += f" (+{len(iss['blanks']) - 5} more)"
            lines.append(
                f"| {iss['doc_id']} | {iss['page']}/{iss['total_pages']} "
                f"| {blank_summary} |")

        lines.append(f"\n---\n")
        lines.append(f"## Details\n")
        for doc_id, doc_issues in by_doc.items():
            lines.append(f"### {doc_id}\n")
            for iss in doc_issues:
                lines.append(f"**Page {iss['page']} of {iss['total_pages']}** "
                             f"— {len(iss['blanks'])} blank(s), 0 fields\n")
                for bt, txt in iss["blanks"]:
                    lines.append(f"- {bt}: `{txt}`")
                lines.append("")

    report = "\n".join(lines)

    if args.out:
        out_path = args.out if os.path.isabs(args.out) else os.path.join(
            os.getcwd(), args.out)
        with open(out_path, "w") as f:
            f.write(report)
        print(f"Report written to {out_path}")
    else:
        print(report)

    print(f"\n{len(issues)} issues across {len(set(i['doc_id'] for i in issues))} forms")


if __name__ == "__main__":
    main()

"""Add missing text fields to NSSC_60A_12 (Order for Mediation).

The original build only detected the two [name] bracket tokens for
Applicant and Respondent.  This script adds fields for all remaining
blanks: year, case number, justice name, issue lines 1-3, the time-
period extension bracket token, the issued date/year, and the
signature underscore.

Usage:
    python3 add_60a12_fields.py --check     # dry run
    python3 add_60a12_fields.py             # apply
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, TOOLS)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))

import bc_pipeline as bp  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
DOC_ID = "NSSC_60A_12"
PDF = os.path.join(EXPORT, f"{DOC_ID}.pdf")
MAP = os.path.join(EXPORT, f"{DOC_ID}.json")

SCALE = 1.5
STD_LINE = 13.3
GAP = 2.0


def _search(page, text):
    """Return first search_for hit or None."""
    hits = page.search_for(text)
    return hits[0] if hits else None


def make_field(index, x, y, w_pdf, h_pdf, page_no):
    return {
        "id": bp.new_id(DOC_ID, index),
        "type": "TextField",
        "x": round(x, 2),
        "y": round(y, 2),
        "width": round(w_pdf * SCALE, 2),
        "height": round(h_pdf * SCALE, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": page_no,
    }


def overlaps_any(x, y, w, h, placed, slack=1.0):
    r = fitz.Rect(x, y, x + w, y + h)
    for other in placed:
        if r.intersects(other) and (r & other).get_area() > slack:
            return True
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="dry run — show what would be added")
    args = parser.parse_args()

    with open(MAP) as f:
        data = json.load(f)

    existing = data.get("staticFields", [])
    placed = {}
    for fld in existing:
        p = fld["page"]
        r = fitz.Rect(fld["x"], fld["y"],
                      fld["x"] + fld["width"] / SCALE,
                      fld["y"] + fld["height"] / SCALE)
        placed.setdefault(p, []).append(r)

    doc = fitz.open(PDF)
    new_fields = []
    # Derive next_index from the highest existing index to avoid id collisions
    max_existing = 0
    for fld in existing:
        idx = fld["id"] - bp.new_id(DOC_ID, 0)
        if idx > max_existing:
            max_existing = idx
    next_index = max(max_existing + 1, len(existing) + 1)

    # ── PAGE 1 ──────────────────────────────────────────────
    p1 = doc[0]
    right_margin = 540.0

    # 1) Year field after "20" (top left)
    r20 = _search(p1, "20")
    if r20 and r20.y0 < 110:
        x = r20.x1 + GAP
        y = r20.y0
        w = 60.0
        h = STD_LINE
        if not overlaps_any(x, y, w, h, placed.get(1, [])):
            fld = make_field(next_index, x, y, w, h, 1)
            new_fields.append(("year (p1)", fld))
            placed.setdefault(1, []).append(fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    # 2) Case number field after "No."
    rno = _search(p1, "No.")
    if rno and rno.y0 < 110:
        x = rno.x1 + GAP
        y = rno.y0
        w = right_margin - x
        h = STD_LINE
        if not overlaps_any(x, y, w, h, placed.get(1, [])):
            fld = make_field(next_index, x, y, w, h, 1)
            new_fields.append(("case number", fld))
            placed.setdefault(1, []).append(fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    # 3) Justice name after "Before the Honourable Justice"
    rj = _search(p1, "Before the Honourable Justice")
    if rj:
        x = rj.x1 + GAP
        y = rj.y0
        w = right_margin - x
        h = STD_LINE
        if not overlaps_any(x, y, w, h, placed.get(1, [])):
            fld = make_field(next_index, x, y, w, h, 1)
            new_fields.append(("justice name", fld))
            placed.setdefault(1, []).append(fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    # 4-6) Issue lines 1, 2, 3
    for issue_num, punct in [("1", ";"), ("2", ";"), ("3", ".")]:
        hits_num = p1.search_for(issue_num)
        # Find the issue number that sits between y=470 and y=545
        for rn in hits_num:
            if 470 < rn.y0 < 545:
                x = rn.x1 + GAP
                # Find the punctuation on the same line
                hits_p = p1.search_for(punct)
                x1 = right_margin
                for rp in hits_p:
                    if abs(rp.y0 - rn.y0) < 3.0:
                        x1 = rp.x0 - GAP
                        break
                y = rn.y0
                w = x1 - x
                h = STD_LINE
                if w > 10 and not overlaps_any(x, y, w, h, placed.get(1, [])):
                    fld = make_field(next_index, x, y, w, h, 1)
                    new_fields.append((f"issue {issue_num}", fld))
                    placed.setdefault(1, []).append(
                        fitz.Rect(x, y, x + w, y + h))
                    next_index += 1
                break

    # 7) Time period extension bracket token
    # The bracket instruction "[insert time period ... months]" spans two
    # lines, but the user only needs a short field (e.g. "2 months").
    # Place it after "extended by" to the right margin on that line.
    r_ext = _search(p1, "extended by")
    if r_ext:
        x = r_ext.x1 + GAP
        y = r_ext.y0
        w = right_margin - x
        h = STD_LINE
        if w > 10 and not overlaps_any(x, y, w, h, placed.get(1, [])):
            fld = make_field(next_index, x, y, w, h, 1)
            new_fields.append(("time period extension", fld))
            placed.setdefault(1, []).append(
                fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    # ── PAGE 2 ──────────────────────────────────────────────
    p2 = doc[1]

    # 8) [date] field in "Issued [date] , 20"
    # The date field should span from after "Issued" up to the comma.
    r_issued = _search(p2, "Issued")
    r_comma20 = _search(p2, ", 20")
    if r_issued and r_comma20 and r_comma20.y0 > 230:
        x = r_issued.x1 + GAP
        y = r_issued.y0
        w = r_comma20.x0 - GAP - x
        h = STD_LINE
        if w > 10 and not overlaps_any(x, y, w, h, placed.get(2, [])):
            fld = make_field(next_index, x, y, w, h, 2)
            new_fields.append(("issued date", fld))
            placed.setdefault(2, []).append(fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    # 9) Year field after ", 20" on page 2
    if r_comma20 and r_comma20.y0 > 230:
        x = r_comma20.x1 + GAP
        y = r_comma20.y0
        w = 40.0
        h = STD_LINE
        if not overlaps_any(x, y, w, h, placed.get(2, [])):
            fld = make_field(next_index, x, y, w, h, 2)
            new_fields.append(("year (p2)", fld))
            placed.setdefault(2, []).append(fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    # 10) Signature underscore line
    r_sig = _search(p2, "______")
    if r_sig:
        x = r_sig.x0
        y = r_sig.y0
        w = r_sig.x1 - r_sig.x0
        h = STD_LINE
        if not overlaps_any(x, y, w, h, placed.get(2, [])):
            fld = make_field(next_index, x, y, w, h, 2)
            new_fields.append(("signature", fld))
            placed.setdefault(2, []).append(fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    doc.close()

    if not new_fields:
        print("nothing to add — all blanks already have fields")
        return

    print(f"{len(new_fields)} fields to add:")
    for label, fld in new_fields:
        p = fld["page"]
        x, y = fld["x"], fld["y"]
        w = fld["width"] / SCALE
        h = fld["height"] / SCALE
        print(f"  ADD  p{p}  x={x:.1f} y={y:.1f} w={w:.1f} h={h:.1f}  {label}")

    if args.check:
        print("(dry run — pass without --check to apply)")
        return

    for _, fld in new_fields:
        existing.append(fld)
    data["staticFields"] = existing

    with open(MAP, "w") as f:
        json.dump(data, f, indent=1)
    print(f"wrote {MAP}")


if __name__ == "__main__":
    main()

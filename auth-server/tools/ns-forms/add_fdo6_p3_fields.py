"""Add missing text fields to NSFD_FDO6 page 3 (Order for an Assessment Report).

Page 3 has "Issued [date] , 20" with two bracket-token blanks that the
original build missed because all detected blanks were on pages 1-2.

Usage:
    python3 add_fdo6_p3_fields.py --check     # dry run
    python3 add_fdo6_p3_fields.py             # apply
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
DOC_ID = "NSFD_FDO6"
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
    next_index = len(existing) + 1

    # ── PAGE 3 ──────────────────────────────────────────────
    p3 = doc[2]

    # 1) [date] field in "Issued [date] , 20"
    r_issued = _search(p3, "Issued")
    r_comma20 = _search(p3, ", 20")
    if r_issued and r_comma20 and abs(r_issued.y0 - r_comma20.y0) < 5.0:
        x = r_issued.x1 + GAP
        y = r_issued.y0
        w = r_comma20.x0 - GAP - x
        h = STD_LINE
        if w > 10 and not overlaps_any(x, y, w, h, placed.get(3, [])):
            fld = make_field(next_index, x, y, w, h, 3)
            new_fields.append(("issued date (p3)", fld))
            placed.setdefault(3, []).append(fitz.Rect(x, y, x + w, y + h))
            next_index += 1

    # 2) Year field after ", 20" on page 3
    if r_comma20:
        x = r_comma20.x1 + GAP
        y = r_comma20.y0
        w = 40.0
        h = STD_LINE
        if not overlaps_any(x, y, w, h, placed.get(3, [])):
            fld = make_field(next_index, x, y, w, h, 3)
            new_fields.append(("year (p3)", fld))
            placed.setdefault(3, []).append(fitz.Rect(x, y, x + w, y + h))
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

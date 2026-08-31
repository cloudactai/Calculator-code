"""Add missing text fields on NSSC_59_07 page 6.

The original build missed:
  Page 6:
    - Print name: text field
    - Signed on date and year
    - Name: text field (under Signature of applicant)

Court officer's certificate section is NOT user-fillable — no fields added there.

Usage:
    python3 add_5907_p6_fields.py --check     # dry run
    python3 add_5907_p6_fields.py             # apply
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))

import bc_pipeline as bp  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
DOC_ID = "NSSC_59_07"
PDF = os.path.join(EXPORT, f"{DOC_ID}.pdf")
MAP = os.path.join(EXPORT, f"{DOC_ID}.json")

SCALE = bp.SCALE          # 1.5
STD_LINE = 13.3
DATE_LINE = 11.0
GAP = 2.0
RIGHT_MARGIN = 540.0
YEAR_W = 25.0


def make_field(fid, x, y, w, h, page, ftype="TextField"):
    return {
        "id": fid,
        "type": ftype,
        "x": round(x, 2),
        "y": round(y, 2),
        "width": round(w * SCALE, 2),
        "height": round(h * SCALE, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": page,
    }


def field_rect(fld):
    return fitz.Rect(fld["x"], fld["y"],
                     fld["x"] + fld["width"] / SCALE,
                     fld["y"] + fld["height"] / SCALE)


def overlaps_existing(rect, existing_rects, slack=1.0):
    for other in existing_rects:
        if rect.intersects(other) and (rect & other).get_area() > slack:
            return True
    return False


def search_near_y(page, text, target_y, tol=5.0):
    best = None
    best_dist = float("inf")
    for r in page.search_for(text):
        dist = abs(r.y0 - target_y)
        if dist < tol and dist < best_dist:
            best = r
            best_dist = dist
    return best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="dry run — show what would be added")
    args = parser.parse_args()

    with open(MAP) as f:
        data = json.load(f)

    existing = data.get("staticFields", [])
    existing_rects_by_page = {}
    for fld in existing:
        p = fld["page"]
        existing_rects_by_page.setdefault(p, []).append(field_rect(fld))

    doc = fitz.open(PDF)

    new_fields = []
    next_index = len(existing) + 1

    def add(label, x, y, w, h, page_no, ftype="TextField"):
        nonlocal next_index
        rect = fitz.Rect(x, y, x + w, y + h)
        placed = existing_rects_by_page.get(page_no, [])
        if overlaps_existing(rect, placed):
            if args.check:
                print(f"  SKIP (overlap) p{page_no} {label}")
            return
        fid = bp.new_id(DOC_ID, next_index)
        fld = make_field(fid, x, y, w, h, page_no, ftype)
        new_fields.append(fld)
        placed.append(rect)
        existing_rects_by_page.setdefault(page_no, placed)
        if args.check:
            print(f"  ADD  p{page_no}  x={x:.1f} y={y:.1f} w={w:.1f} h={h:.1f}  {label}")
        next_index += 1

    # ===== PAGE 6 =====
    p6 = doc[5]

    # 1. Print name: text field
    pn = p6.search_for("Print name:")
    if pn:
        r = pn[0]
        fx = r.x1 + GAP
        add("print name", fx, r.y0, RIGHT_MARGIN - fx, STD_LINE, 6)

    # 2. Signed on date and year
    signed = p6.search_for("Signed on")
    c20 = search_near_y(p6, ", 20", 159.5, tol=5.0) if signed else None
    if signed and c20:
        fx = signed[0].x1 + GAP
        fw = c20.x0 - fx
        if fw > 10:
            add("signed date", fx, signed[0].y0, fw, DATE_LINE, 6)
        add("signed year", c20.x1, c20.y0, YEAR_W, DATE_LINE, 6)

    # 3. Name: field (under Signature of applicant, y~214.7)
    name_rects = p6.search_for("Name:")
    name_r = search_near_y(p6, "Name:", 214.7, tol=5.0)
    if name_r:
        fx = name_r.x1 + GAP
        add("applicant name", fx, name_r.y0, RIGHT_MARGIN - fx, STD_LINE, 6)

    doc.close()

    if not new_fields:
        print("nothing to add — all fields already exist")
        return

    print(f"{len(new_fields)} field(s) to add")

    if args.check:
        print("(dry run — pass without --check to apply)")
        return

    existing.extend(new_fields)
    data["staticFields"] = existing

    with open(MAP, "w") as f:
        json.dump(data, f, indent=1)
    print(f"wrote {MAP}")


if __name__ == "__main__":
    main()

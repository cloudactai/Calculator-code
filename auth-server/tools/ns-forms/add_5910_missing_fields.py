"""Add missing text fields on NSSC_59_10 pages 3–4.

The original build detected bracket tokens for the header area but missed
several blanks on pages 3 and 4:
  - [give specifics] bracket on the "other affidavits" line (page 3)
  - Contact information address text area (page 3)
  - Signed date and year fields (page 3)
  - Print name after respondent signature (page 3)
  - Print name after counsel signature (page 4)
  - Court officer filing date and year (page 4)

Usage:
    python3 add_5910_missing_fields.py --check     # dry run
    python3 add_5910_missing_fields.py             # apply
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
DOC_ID = "NSSC_59_10"
PDF = os.path.join(EXPORT, f"{DOC_ID}.pdf")
MAP = os.path.join(EXPORT, f"{DOC_ID}.json")

SCALE = bp.SCALE          # 1.5
STD_LINE = 13.3
GAP = 2.0
RIGHT_MARGIN = 540.0      # page right margin for fields


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


def search_one(page, text):
    rects = page.search_for(text)
    return rects[0] if rects else None


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
    page3 = doc[2]
    page4 = doc[3]

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

    # --- Page 3 ---

    # 1. [give specifics] after "other affidavits and documents"
    r = search_one(page3, "[give specifics]")
    if r:
        add("[give specifics]",
            r.x0, r.y0, RIGHT_MARGIN - r.x0, r.y1 - r.y0, 3)

    # 2. Contact address text area
    #    Between "designates the following address:" (y bottom ~175.2)
    #    and "Documents delivered..." (y top ~233.0)
    addr_top = search_one(page3, "The respondent designates the following address:")
    addr_bottom = search_one(page3, "Documents delivered to this address")
    if addr_top and addr_bottom:
        area_y = addr_top.y1 + 2.0
        area_h = addr_bottom.y0 - area_y - 2.0
        add("contact address",
            72.1, area_y, RIGHT_MARGIN - 72.1, area_h, 3, "TextArea")

    # 3. Signed date field — between "Signed" and ", 20"
    signed_r = search_one(page3, "Signed")
    comma20_r = search_one(page3, ", 20")
    if signed_r and comma20_r and abs(signed_r.y0 - comma20_r.y0) < 3:
        fx = signed_r.x1 + GAP
        fw = comma20_r.x0 - fx
        add("signed date",
            fx, signed_r.y0, fw, STD_LINE, 3)

    # 4. Signed year field — after ", 20"
    if comma20_r:
        fx = comma20_r.x1
        add("signed year",
            fx, comma20_r.y0, 30.0, STD_LINE, 3)

    # 5. Print name (respondent) — after "Print name:" on page 3
    pn_r = search_one(page3, "Print name:")
    if pn_r:
        fx = pn_r.x1 + GAP
        add("print name (respondent)",
            fx, pn_r.y0, RIGHT_MARGIN - fx, STD_LINE, 3)

    # --- Page 4 ---

    # 6. Print name (counsel) — after "Print name:" on page 4
    pn4_r = search_one(page4, "Print name:")
    if pn4_r:
        fx = pn4_r.x1 + GAP
        add("print name (counsel)",
            fx, pn4_r.y0, RIGHT_MARGIN - fx, STD_LINE, 4)

    # 7. Court officer filing date — between "filed with the court on" and ", 20"
    filed_r = search_one(page4, "I certify that this answer was filed with the court on")
    comma20_p4 = search_one(page4, ", 20")
    if filed_r and comma20_p4 and abs(filed_r.y0 - comma20_p4.y0) < 3:
        fx = filed_r.x1 + GAP
        fw = comma20_p4.x0 - fx
        add("court filing date",
            fx, filed_r.y0, fw, STD_LINE, 4)

    # 8. Court officer year — after ", 20" on page 4
    if comma20_p4:
        fx = comma20_p4.x1
        add("court filing year",
            fx, comma20_p4.y0, 30.0, STD_LINE, 4)

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

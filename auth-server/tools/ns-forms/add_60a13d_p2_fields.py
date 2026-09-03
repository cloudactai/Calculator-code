"""Add missing text fields on NSSC_60A_13D pages 1 and 2.

The original build missed bracket-token blanks:

  Page 1:
    - Prehearing conference date after "Act on" in paragraph 2

  Page 2:
    - Hearing date after "shall be held on" (the "[insert date …]" token)
    - Issued date — the "[date]" token in "Issued [date] , 20"

Usage:
    python3 add_60a13d_p2_fields.py --check   # dry run
    python3 add_60a13d_p2_fields.py           # apply
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))

import bc_pipeline as bp     # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
DOC_ID = "NSSC_60A_13D"
PDF = os.path.join(EXPORT, f"{DOC_ID}.pdf")
MAP = os.path.join(EXPORT, f"{DOC_ID}.json")

SCALE = bp.SCALE          # 1.5
STD_LINE = 13.3
GAP = 2.0


def make_field(index, x, y, width, page_no):
    return {
        "id": bp.new_id(DOC_ID, index),
        "type": "TextField",
        "x": round(x, 2),
        "y": round(y, 2),
        "width": round(width * SCALE, 2),
        "height": round(STD_LINE * SCALE, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": page_no,
    }


def existing_rects_for_page(existing, page_no):
    rects = []
    for fld in existing:
        if fld["page"] == page_no:
            rects.append(fitz.Rect(
                fld["x"], fld["y"],
                fld["x"] + fld["width"] / SCALE,
                fld["y"] + fld["height"] / SCALE,
            ))
    return rects


def overlaps_any(x, y, w, h, existing_rects, slack=1.0):
    r = fitz.Rect(x, y, x + w, y + h)
    for other in existing_rects:
        if r.intersects(other) and (r & other).get_area() > slack:
            return True
    return False


def add_field(label, fx, fy, fw, page_no, placed, new_fields, next_index, check):
    if not overlaps_any(fx, fy, fw, STD_LINE, placed):
        fld = make_field(next_index, fx, fy, fw, page_no)
        new_fields.append(fld)
        placed.append(fitz.Rect(fx, fy, fx + fw, fy + STD_LINE))
        if check:
            print(f"  ADD  p{page_no}  {label:24s}  x={fx:.1f} y={fy:.1f} w={fw:.1f}")
        return next_index + 1
    else:
        if check:
            print(f"  SKIP (overlap) {label}")
        return next_index


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="dry run — show what would be added")
    args = parser.parse_args()

    with open(MAP) as f:
        data = json.load(f)

    existing = data.get("staticFields", [])

    doc = fitz.open(PDF)
    new_fields = []
    next_index = len(existing) + 1

    # ── Page 1: prehearing conference date ──
    p1 = doc[0]
    placed_p1 = existing_rects_for_page(existing, 1)

    act_on = p1.search_for("Act on")
    if not act_on:
        print("ERROR: cannot find 'Act on' on page 1")
        sys.exit(1)
    # Use the match on the paragraph-2 line (y > 630)
    act_on = [r for r in act_on if r.y0 > 630]
    if not act_on:
        print("ERROR: cannot find 'Act on' in paragraph 2 on page 1")
        sys.exit(1)

    bracket = p1.search_for("[insert date")
    if not bracket:
        print("ERROR: cannot find '[insert date' on page 1")
        sys.exit(1)
    bracket_p1 = [r for r in bracket if r.y0 > 630]
    if not bracket_p1:
        print("ERROR: cannot find '[insert date' in paragraph 2 on page 1")
        sys.exit(1)

    fx = act_on[0].x1 + GAP
    fy = act_on[0].y1 - STD_LINE
    fw = bracket_p1[0].x1 + 40 - fx

    next_index = add_field("prehearing_conf_date", fx, fy, fw, 1,
                           placed_p1, new_fields, next_index, args.check)

    # ── Page 2: hearing date + issued date ──
    p2 = doc[1]
    placed_p2 = existing_rects_for_page(existing, 2)

    # Field: hearing date after "shall be held on"
    held_on = p2.search_for("shall be held on")
    if not held_on:
        print("ERROR: cannot find 'shall be held on' on page 2")
        sys.exit(1)

    bracket_p2 = p2.search_for("[insert date")
    field_end = bracket_p2[0].x1 + 40 if bracket_p2 else 539.0

    fx = held_on[0].x1 + GAP
    fy = held_on[0].y1 - STD_LINE
    fw = field_end - fx

    next_index = add_field("hearing_date", fx, fy, fw, 2,
                           placed_p2, new_fields, next_index, args.check)

    # Field: issued date — "[date]" in "Issued [date] , 20"
    issued = p2.search_for("Issued")
    comma20 = p2.search_for(", 20")
    if not issued or not comma20:
        print("ERROR: cannot find 'Issued' or ', 20' on page 2")
        sys.exit(1)

    fx = issued[0].x1 + GAP
    fy = issued[0].y1 - STD_LINE
    fw = comma20[0].x0 - GAP - fx

    next_index = add_field("issued_date", fx, fy, fw, 2,
                           placed_p2, new_fields, next_index, args.check)

    doc.close()

    if not new_fields:
        print("nothing to add — all fields already present")
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

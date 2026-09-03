"""Add missing text fields on NSSC_59_36 page 1.

The "Notice to Appear in Court" section (y > 400) has only 2 fields
(party names at the top) but many user-fillable bracket tokens and blanks:

  - Courthouse city/town (blank before ", [Street/Avenue]")
  - [Street/Avenue] — courthouse street address
  - City/town before ", Nova Scotia"
  - [a judge / name of judge] — which judge to appear before
  - Date blank before ", 20"
  - Year blank after ", 20"
  - Time blank (after "at")
  - [a.m./p.m.] — morning or afternoon selector
  - [the hearing of a motion... give details] — hearing type selector/text
  - [Number of hours or days] — duration set aside
  - [conference./hearing./trial.] — event type selector

Usage:
    python3 add_5936_p1_fields.py --check     # dry run
    python3 add_5936_p1_fields.py             # apply
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
DOC_ID = "NSSC_59_36"
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

    p1 = doc[0]

    # === Line at y~402: "at the courthouse at _____, [Street/Avenue], _____" ===

    # Courthouse city/town: after "at the courthouse at" to before ", ["
    r_courthouse = search_near_y(p1, "at the courthouse at", 402.0, tol=5.0)
    r_comma_bracket = search_near_y(p1, ",   [", 402.0, tol=5.0)
    if r_courthouse and r_comma_bracket:
        fx = r_courthouse.x1 + GAP
        fw = r_comma_bracket.x0 - fx
        if fw > 10:
            add("courthouse city", fx, r_courthouse.y0, fw, STD_LINE, 1)

    # [Street/Avenue] is a bracket token — the field replaces the entire token
    r_street = search_near_y(p1, "Street/Avenue", 402.0, tol=5.0)
    if r_street:
        # Bracket starts before "Street/Avenue" and ends after "]"
        # Token spans from "[" at ~415 to "]" at ~481.6 plus some padding
        r_open = search_near_y(p1, ",   [", 402.0, tol=5.0)
        r_close = search_near_y(p1, "]   ,", 402.0, tol=5.0)
        if r_open and r_close:
            fx = r_open.x1
            fw = r_close.x0 - fx
            if fw > 10:
                add("[Street/Avenue]", fx, r_street.y0, fw, STD_LINE, 1)

    # City/town after "]   ," to before ", Nova Scotia"
    r_close_comma = search_near_y(p1, "]   ,", 402.0, tol=5.0)
    r_nova = search_near_y(p1, ", Nova Scotia", 415.8, tol=5.0)
    if r_close_comma and r_nova:
        fx = r_close_comma.x1 + GAP
        # This field wraps to next line — extends from after "]   ," on line 1
        # to before ", Nova Scotia" on line 2
        # Use the remaining space on the first line
        fw = RIGHT_MARGIN - fx
        if fw > 10:
            add("city before Nova Scotia", fx, r_close_comma.y0, fw, STD_LINE, 1)

    # === Line at y~415.9: ", Nova Scotia and appear before [a judge/name of judge] on ___, 20__, at" ===

    # [a judge / name of judge] — bracket token between "before" and "]   on"
    r_before = search_near_y(p1, "appear before", 415.8, tol=5.0)
    r_bracket_on = search_near_y(p1, "]   on", 415.8, tol=5.0)
    if r_before and r_bracket_on:
        fx = r_before.x1 + GAP
        fw = r_bracket_on.x0 - fx
        if fw > 10:
            add("[judge name]", fx, r_before.y0, fw, STD_LINE, 1)

    # Date blank: after "]   on" to before ", 20"
    r_c20 = search_near_y(p1, ", 20", 415.8, tol=5.0)
    if r_bracket_on and r_c20:
        fx = r_bracket_on.x1 + GAP
        fw = r_c20.x0 - fx
        if fw > 10:
            add("date", fx, r_bracket_on.y0, fw, DATE_LINE, 1)

    # Year blank: after ", 20"
    if r_c20:
        fx = r_c20.x1
        add("year", fx, r_c20.y0, YEAR_W, DATE_LINE, 1)

    # Time blank: after "at" at end of this line
    r_at = search_near_y(p1, " at ", 415.8, tol=5.0)
    if not r_at:
        # Try searching just "at" near x=504 y=415
        for r in p1.search_for("at"):
            if abs(r.y0 - 415.8) < 5.0 and r.x0 > 500:
                r_at = r
                break
    if r_at and r_at.x0 > 500:
        fx = r_at.x1 + GAP
        fw = RIGHT_MARGIN - fx
        if fw > 5:
            add("time", fx, r_at.y0, fw, DATE_LINE, 1)

    # === Line at y~429.7: "[a.m./p.m.] for [the hearing of a motion... give details...]" ===

    # [a.m./p.m.] selector
    r_am = search_near_y(p1, "a.m./p.m.", 429.7, tol=5.0)
    if r_am:
        fx = 72.1
        fw = r_am.x1 + 4.0 - fx  # include the bracket
        add("[a.m./p.m.]", fx, r_am.y0, fw, STD_LINE, 1)

    # [the hearing of a motion for ... give details ... / trial. give details]
    # This is a large multi-line bracket token spanning y=429.7 to y=457.3
    r_for = search_near_y(p1, "for   [", 429.7, tol=5.0)
    r_give_end = search_near_y(p1, "give details ]", 457.3, tol=5.0)
    if r_for and r_give_end:
        fx = r_for.x1
        fw = RIGHT_MARGIN - fx
        fh = r_give_end.y1 - r_for.y0
        add("[hearing type details]", fx, r_for.y0, fw, fh, 1, "TextArea")

    # === Line at y~484.9: "[Number of hours or days have/has] been set aside for the [conference./hearing./trial.] ===

    # [Number of hours or days]
    r_num = search_near_y(p1, "[Number of hours or days", 484.9, tol=5.0)
    r_has = search_near_y(p1, "have/has", 484.9, tol=5.0)
    if r_num and r_has:
        fx = r_num.x0
        fw = r_has.x1 + 4.0 - fx
        add("[Number of hours or days]", fx, r_num.y0, fw, STD_LINE, 1)

    # [conference./hearing./trial.]
    r_conf = search_near_y(p1, "conference./hearing./trial.", 484.9, tol=5.0)
    if r_conf:
        # Include the surrounding brackets
        fx = r_conf.x0 - 4.0
        fw = r_conf.x1 + 4.0 - fx
        add("[conference/hearing/trial]", fx, r_conf.y0, fw, STD_LINE, 1)

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

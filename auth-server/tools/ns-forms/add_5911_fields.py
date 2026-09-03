"""Add missing text fields on NSSC_59_11 page 1.

The form has 2 fields (party names) but the lower half is missing fields:

  - Designated address TextArea (between "designates the following address:"
    and "Documents delivered to this address...")
  - Signed date (after "Signed")
  - Signed year (after ", 20")
  - Print name (after "Print name:" under respondent signature)
  - Print name (after "Print name:" under counsel signature)

Usage:
    python3 add_5911_fields.py --check     # dry run
    python3 add_5911_fields.py             # apply
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
DOC_ID = "NSSC_59_11"
PDF = os.path.join(EXPORT, f"{DOC_ID}.pdf")
MAP = os.path.join(EXPORT, f"{DOC_ID}.json")

SCALE = bp.SCALE          # 1.5
STD_LINE = 13.3
DATE_LINE = 11.0
GAP = 2.0
LEFT_MARGIN = 72.1
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

    # === 1. Designated address TextArea ===
    # Between "designates the following address:" (y~405.6)
    # and "Documents delivered to this address..." (y~520.5)
    r_addr = search_near_y(p1, "designates the following address:", 405.5, tol=5.0)
    r_docs = search_near_y(p1, "Documents delivered", 520.5, tol=5.0)
    if r_addr and r_docs:
        fx = LEFT_MARGIN
        fy = r_addr.y1 + GAP
        fw = RIGHT_MARGIN - fx
        fh = r_docs.y0 - GAP - fy
        if fh > 10:
            add("designated address", fx, fy, fw, fh, 1, "TextArea")

    # === 2. Signed date (after "Signed") ===
    r_signed = search_near_y(p1, "Signed", 566.5, tol=5.0)
    r_c20 = search_near_y(p1, ", 20", 566.5, tol=5.0)
    if r_signed and r_c20:
        fx = r_signed.x1 + GAP
        fw = r_c20.x0 - fx
        if fw > 10:
            add("signed date", fx, r_signed.y0, fw, DATE_LINE, 1)

    # === 3. Signed year (after ", 20") ===
    if r_c20:
        fx = r_c20.x1
        add("signed year", fx, r_c20.y0, YEAR_W, DATE_LINE, 1)

    # === 4. Print name under respondent signature ===
    # "Print name:" at y~624.0 x=360.1
    r_pn1 = search_near_y(p1, "Print name:", 624.0, tol=5.0)
    if r_pn1:
        fx = r_pn1.x1 + GAP
        fw = RIGHT_MARGIN - fx
        add("print name (respondent)", fx, r_pn1.y0, fw, STD_LINE, 1)

    # === 5. Print name under counsel signature ===
    # "Print name:" at y~704.5 x=360.1
    r_pn2 = search_near_y(p1, "Print name:", 704.5, tol=5.0)
    if r_pn2:
        fx = r_pn2.x1 + GAP
        fw = RIGHT_MARGIN - fx
        add("print name (counsel)", fx, r_pn2.y0, fw, STD_LINE, 1)

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

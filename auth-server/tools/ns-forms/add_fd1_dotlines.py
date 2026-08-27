"""Add text fields on dotted-line blanks for NSFD_FD1 pages 1–4.

The original build detected bracket tokens, tick glyphs, underscore runs,
and ruled-table cells — but NSFD FD1 uses **period runs** (`.....`) and
**ellipsis characters** (`…`) for most of its blanks, which none of the
detectors cover.  This script finds those runs on pages 1–4, measures
their extent from the PDF, and writes TextField entries into the mapping
JSON.

Usage:
    python3 add_fd1_dotlines.py --check     # dry run
    python3 add_fd1_dotlines.py             # apply
"""
import argparse
import json
import os
import re
import sys
import time

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, TOOLS)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp   # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
DOC_ID = "NSFD_FD1"
PDF = os.path.join(EXPORT, f"{DOC_ID}.pdf")
MAP = os.path.join(EXPORT, f"{DOC_ID}.json")

SCALE = A.SCALE
STD_LINE = A.STD_LINE

DOT_RUN = re.compile(r"[.…]{3,}")
PAGES = {1, 2, 3, 4}


def _spans(page):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                yield span


def _lines(page):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            if not spans:
                continue
            yield spans, fitz.Rect(line["bbox"])


def find_dot_blanks(page):
    """Return [(label, field_rect), ...] for every dotted-line blank."""
    results = []
    for spans, line_bbox in _lines(page):
        text = "".join(s["text"] for s in spans)
        m = DOT_RUN.search(text)
        if not m:
            continue

        label = re.sub(r"[.…\s]+$", "", text).strip()
        if not label:
            label = "(continuation)"

        dot_start_char = m.start()
        char_pos = 0
        dot_start_x = line_bbox.x0
        for s in spans:
            stext = s["text"]
            if char_pos + len(stext) > dot_start_char:
                sb = s["bbox"]
                if len(stext) > 0:
                    cw = (sb[2] - sb[0]) / len(stext)
                    offset = dot_start_char - char_pos
                    dot_start_x = sb[0] + offset * cw
                break
            char_pos += len(stext)

        x0 = dot_start_x
        x1 = line_bbox.x1
        y0 = line_bbox.y0
        y1 = line_bbox.y1
        height = max(y1 - y0, STD_LINE)

        field_rect = fitz.Rect(x0, y1 - height, x1, y1)
        results.append((label, field_rect))
    return results


def overlaps_any(rect, placed, slack=1.0):
    for other in placed:
        if rect.intersects(other) and (rect & other).get_area() > slack:
            return True
    return False


def make_field(index, rect, page_no):
    return {
        "id": bp.new_id(DOC_ID, index),
        "type": "TextField",
        "x": round(rect.x0, 2),
        "y": round(rect.y0, 2),
        "width": round(rect.width * SCALE, 2),
        "height": round(rect.height * SCALE, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": page_no,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="dry run — show what would be added")
    args = parser.parse_args()

    with open(MAP) as f:
        data = json.load(f)

    existing = data.get("staticFields", [])
    existing_rects = {}
    for fld in existing:
        p = fld["page"]
        r = fitz.Rect(fld["x"], fld["y"],
                      fld["x"] + fld["width"] / SCALE,
                      fld["y"] + fld["height"] / SCALE)
        existing_rects.setdefault(p, []).append(r)

    doc = fitz.open(PDF)
    new_fields = []
    next_index = len(existing) + 1

    for page_no in sorted(PAGES):
        page = doc[page_no - 1]
        placed = list(existing_rects.get(page_no, []))
        blanks = find_dot_blanks(page)

        for label, rect in blanks:
            if overlaps_any(rect, placed):
                if args.check:
                    print(f"  SKIP (overlap) p{page_no} {label}")
                continue

            placed.append(rect)
            fld = make_field(next_index, rect, page_no)
            next_index += 1
            new_fields.append(fld)

            if args.check:
                print(f"  ADD  p{page_no}  x={rect.x0:.1f} y={rect.y0:.1f} "
                      f"w={rect.width:.1f} h={rect.height:.1f}  {label}")

    doc.close()

    if not new_fields:
        print("nothing to add — all dotted-line blanks already have fields")
        return

    print(f"{len(new_fields)} fields to add across pages {sorted(PAGES)}")

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

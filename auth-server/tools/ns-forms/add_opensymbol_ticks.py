"""Add OpenSymbol U+F039 checkboxes to NS mapping JSONs.

These glyphs were missed by the original build because tick_boxes() only
looked for standard Unicode checkbox characters.  PDF.js renders them as "9"
because it can't map the PUA codepoint in the subset-embedded OpenSymbol font.

This script detects them the same way tick_boxes() does for regular ticks,
generates CheckBox fields with IDs that continue the existing sequence, and
merges them into the exported JSON without touching any existing field.

    python3 add_opensymbol_ticks.py --check          # dry run
    python3 add_opensymbol_ticks.py                   # apply
    python3 add_opensymbol_ticks.py --only NSSC_59_09 # one form
"""
import argparse
import json
import os
import sys
import zlib

import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

OPENSYMBOL_TICK = ""

AFFECTED = [
    "NSSC_59_09", "NSSC_59_10", "NSSC_59_12", "NSSC_59_25",
    "NSSC_59_26A", "NSSC_59_26B", "NSSC_59_35",
    "NSSC_59_44", "NSSC_59_45", "NSSC_59_46",
]


def new_id(doc_id, index):
    base = 1750000000000 + (zlib.crc32(doc_id.encode()) % 900000) * 1000
    return base + index


def detect_opensymbol_ticks(pdf_path):
    """Return list of (page_no, pymupdf.Rect) for each OpenSymbol tick."""
    doc = pymupdf.open(pdf_path)
    results = []
    for pn, page in enumerate(doc, start=1):
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    if "OpenSymbol" not in span.get("font", ""):
                        continue
                    for ch in span["text"]:
                        if ch != OPENSYMBOL_TICK:
                            continue
                        found = page.search_for(ch, clip=pymupdf.Rect(span["bbox"]))
                        for rect in found or []:
                            side = min(rect.width, rect.height)
                            results.append((pn, pymupdf.Rect(
                                rect.x0, rect.y0, rect.x0 + side, rect.y0 + side)))
    doc.close()
    return results


def overlaps_existing(rect, page, existing_fields, slack=2.0):
    for f in existing_fields:
        if f["page"] != page:
            continue
        fr = pymupdf.Rect(f["x"], f["y"],
                          f["x"] + f["width"], f["y"] + f["height"])
        if rect.intersects(fr) and (rect & fr).get_area() > slack:
            return True
    return False


def make_checkbox(doc_id, index, rect, page_no):
    return {
        "id": new_id(doc_id, index),
        "type": "CheckBox",
        "x": round(rect.x0, 2),
        "y": round(rect.y0, 2),
        "width": round(rect.width, 2),
        "height": round(rect.height, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": page_no,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run")
    ap.add_argument("--only", action="append", default=[])
    args = ap.parse_args()

    targets = args.only or AFFECTED
    total_added = 0

    for doc_id in targets:
        pdf_path = os.path.join(EXPORT, "%s.pdf" % doc_id)
        json_path = os.path.join(EXPORT, "%s.json" % doc_id)
        if not os.path.exists(pdf_path) or not os.path.exists(json_path):
            print("  %s: MISSING files, skipped" % doc_id)
            continue

        with open(json_path) as f:
            data = json.load(f)
        existing = data["staticFields"]

        ticks = detect_opensymbol_ticks(pdf_path)
        if not ticks:
            continue

        max_index = max(f["id"] % 1000 for f in existing) if existing else 0
        new_fields = []
        for page_no, rect in ticks:
            if overlaps_existing(rect, page_no, existing):
                continue
            max_index += 1
            new_fields.append(make_checkbox(doc_id, max_index, rect, page_no))

        if not new_fields:
            continue

        for nf in new_fields:
            print("  %s p%d id=%d: (%.1f,%.1f) %.1fx%.1f" % (
                doc_id, nf["page"], nf["id"], nf["x"], nf["y"],
                nf["width"], nf["height"]))

        if args.check:
            print("%-26s %d checkbox(es) would be added" % (doc_id, len(new_fields)))
        else:
            existing.extend(new_fields)
            existing.sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))
            with open(json_path, "w") as f:
                json.dump(data, f, indent=1)
                f.write("\n")
            print("%-26s %d checkbox(es) added" % (doc_id, len(new_fields)))

        total_added += len(new_fields)

    if args.check:
        print("\ntotal: %d checkbox(es) would be added" % total_added)
    else:
        if total_added:
            print("\ntotal: %d checkbox(es) added" % total_added)
        else:
            print("\nall OpenSymbol ticks already mapped")


if __name__ == "__main__":
    main()

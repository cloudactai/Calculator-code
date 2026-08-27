"""Seat OpenSymbol checkbox fields onto their actual ink.

The original add_opensymbol_ticks.py placed boxes at the character-cell origin,
but the "9" glyph renders lower within the cell. This script measures the ink
position at high zoom and corrects x, y, width, height — leaving every other
key untouched.

    python3 seat_opensymbol_ticks.py --check          # dry run
    python3 seat_opensymbol_ticks.py                   # apply
    python3 seat_opensymbol_ticks.py --only NSSC_59_35 # one form
"""
import argparse
import json
import os

import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

OPENSYMBOL_TICK = ""

AFFECTED = [
    "NSSC_59_09", "NSSC_59_10", "NSSC_59_12", "NSSC_59_25",
    "NSSC_59_26A", "NSSC_59_26B", "NSSC_59_35",
    "NSSC_59_44", "NSSC_59_45", "NSSC_59_46",
]


def _find_opensymbol_rects(page):
    """All OpenSymbol tick character cells on a page, as (cell_rect,)."""
    rects = []
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
                        rects.append(rect)
    return rects


def _measure_ink(page, cell_rect, zoom=20, threshold=128):
    """Render the cell area and find where the ink actually is."""
    pad = 1.0
    clip = pymupdf.Rect(cell_rect.x0 - pad, cell_rect.y0 - pad,
                         cell_rect.x1 + pad, cell_rect.y1 + pad)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip)
    w, h, samples, n = pix.width, pix.height, pix.samples, pix.n

    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            off = (y * w + x) * n
            if (samples[off] < threshold and samples[off + 1] < threshold
                    and samples[off + 2] < threshold):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < min_x:
        return None

    ink_x0 = clip.x0 + min_x / zoom
    ink_y0 = clip.y0 + min_y / zoom
    ink_x1 = clip.x0 + (max_x + 1) / zoom
    ink_y1 = clip.y0 + (max_y + 1) / zoom
    return pymupdf.Rect(ink_x0, ink_y0, ink_x1, ink_y1)


def _nearby(field, cell_rect, tolerance=3.0):
    """Does this field's position roughly match this cell rect?"""
    return (abs(field["x"] - cell_rect.x0) < tolerance
            and abs(field["y"] - cell_rect.y0) < cell_rect.height)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run")
    ap.add_argument("--only", action="append", default=[])
    args = ap.parse_args()

    targets = args.only or AFFECTED
    total_changed = 0

    for doc_id in targets:
        pdf_path = os.path.join(EXPORT, "%s.pdf" % doc_id)
        json_path = os.path.join(EXPORT, "%s.json" % doc_id)
        if not os.path.exists(pdf_path) or not os.path.exists(json_path):
            continue

        with open(json_path) as f:
            data = json.load(f)
        fields = data["staticFields"]
        checkboxes = [f for f in fields if f["type"] == "CheckBox"]

        doc = pymupdf.open(pdf_path)
        changed = 0
        matched_ids = set()

        for pn, page in enumerate(doc, start=1):
            cells = _find_opensymbol_rects(page)
            for cell in cells:
                ink = _measure_ink(page, cell)
                if ink is None:
                    continue

                side = min(ink.width, ink.height)
                new_x = round(ink.x0, 2)
                new_y = round(ink.y0, 2)
                new_w = round(side, 2)
                new_h = round(side, 2)

                for cb in checkboxes:
                    if cb["id"] in matched_ids:
                        continue
                    if cb["page"] != pn:
                        continue
                    if not _nearby(cb, cell):
                        continue

                    matched_ids.add(cb["id"])
                    old_x, old_y = cb["x"], cb["y"]
                    old_w, old_h = cb["width"], cb["height"]

                    if (abs(old_x - new_x) < 0.01 and abs(old_y - new_y) < 0.01
                            and abs(old_w - new_w) < 0.01):
                        break

                    print("  %s p%d id=%d: (%.1f,%.1f) %.1fx%.1f -> (%.1f,%.1f) %.1fx%.1f  delta=(%.1f,%.1f,%.1f,%.1f)"
                          % (doc_id, pn, cb["id"],
                             old_x, old_y, old_w, old_h,
                             new_x, new_y, new_w, new_h,
                             new_x - old_x, new_y - old_y,
                             new_w - old_w, new_h - old_h))

                    cb["x"] = new_x
                    cb["y"] = new_y
                    cb["width"] = new_w
                    cb["height"] = new_h
                    changed += 1
                    break

        doc.close()

        if changed == 0:
            continue

        if args.check:
            print("%-26s %d checkbox(es) would change" % (doc_id, changed))
        else:
            # Verify only geometry changed
            with open(json_path) as f:
                orig = json.load(f)
            for orig_f, new_f in zip(orig["staticFields"], fields):
                for key in orig_f:
                    if key in ("x", "y", "width", "height"):
                        continue
                    assert orig_f[key] == new_f[key], \
                        "non-geometry key %r changed on id %s" % (key, orig_f["id"])

            with open(json_path, "w") as f:
                json.dump(data, f, indent=1)
                f.write("\n")
            print("%-26s %d checkbox(es) reseated" % (doc_id, changed))

        total_changed += changed

    if total_changed == 0:
        print("all OpenSymbol checkboxes already seated on their ink")
    elif args.check:
        print("\ntotal: %d checkbox(es) would change" % total_changed)
    else:
        print("\ntotal: %d checkbox(es) reseated" % total_changed)


if __name__ == "__main__":
    main()

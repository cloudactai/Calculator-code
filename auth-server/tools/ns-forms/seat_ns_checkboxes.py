"""Seat Nova Scotia checkboxes on the rendered ink of their printed tick glyph.

    python3 seat_ns_checkboxes.py [--check] [--only NSSC_59_07]

The □/☐ character's bounding box from search_for is the advance width, which
is narrower than the printed square and starts at the top of the character
cell. The actual square sits in the lower portion of the cell at a consistent
ratio per font. The result: the mapped checkbox is sized and positioned on
the character cell, while the viewer's control needs to sit on the rendered
ink.

Measured at 40x on NSSC_59_07. The rendered square's offset from the
character cell is consistent within each font:

    TimesNewRomanPSMT □: y_offset/cell_h = 0.391, ink_w/cell_w = 0.764
    AppleSymbols      ☐: y_offset/cell_h = 0.314, ink_w/cell_w = 0.657
    Menlo-Regular     ☐: y_offset/cell_h = 0.365, ink_w/cell_w = 0.820

The ink square is effectively square (width ≈ height), and the x offset
centres it. This script applies those constants to every checkbox.

Writes back only x, y, width, height on CheckBox fields, asserting every
other key is byte-identical. Idempotent: a second run is a no-op.
"""
import argparse
import json
import os
import sys

try:
    import fitz
except ImportError:
    import pymupdf as fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
SCALE = 1.5

TICKS = "☐☑□■❑❐"

# Measured on NSSC_59_07 at 40x zoom with threshold=128.
# Key: (font_prefix, character). Font prefix because pymupdf may report
# slightly different names across renders; the leading word is stable.
INK_RATIOS = {
    ("Times", "□"):  {"y_ratio": 0.391, "w_ratio": 0.764},
    ("Apple", "☐"):  {"y_ratio": 0.314, "w_ratio": 0.657},
    ("Menlo", "☐"):  {"y_ratio": 0.365, "w_ratio": 0.820},
}

# Fallback: centre the square in the lower ~60% of the cell.
FALLBACK = {"y_ratio": 0.38, "w_ratio": 0.75}


def _ratios_for(font, char):
    for (prefix, ch), ratios in INK_RATIOS.items():
        if font.startswith(prefix) and ch == char:
            return ratios
    return FALLBACK


def _tick_info(page):
    """Every tick glyph as (search_rect, font, char)."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                for ch in span["text"]:
                    if ch not in TICKS:
                        continue
                    found = page.search_for(ch, clip=fitz.Rect(span["bbox"]))
                    for r in found or []:
                        out.append((r, span["font"], ch))
    return out


def nearest_tick(field, ticks, max_dist=20.0):
    fx = field["x"] + field["width"] / SCALE / 2
    fy = field["y"] + field["height"] / SCALE / 2
    best, best_dist = None, max_dist
    for t in ticks:
        rect, font, char = t
        tx = (rect.x0 + rect.x1) / 2
        ty = (rect.y0 + rect.y1) / 2
        dist = ((fx - tx) ** 2 + (fy - ty) ** 2) ** 0.5
        if dist < best_dist:
            best_dist = dist
            best = t
    return best


def repair_one(doc_id, check=False):
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    fields = json.load(open(mapping_path))["staticFields"]
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))

    checkboxes = [f for f in fields if f["type"] == "CheckBox"]
    if not checkboxes:
        pdf.close()
        return 0

    changes = 0
    pages_ticks = {}
    for cb in checkboxes:
        page_no = cb["page"]
        if page_no not in pages_ticks:
            pages_ticks[page_no] = _tick_info(pdf[page_no - 1])
        ticks = pages_ticks[page_no]

        tick = nearest_tick(cb, ticks)
        if tick is None:
            print("  %s p%d: checkbox at (%.1f, %.1f) has no nearby tick"
                  % (doc_id, page_no, cb["x"], cb["y"]))
            continue

        rect, font, char = tick
        ratios = _ratios_for(font, char)

        # The ink square: starts y_ratio down from the cell top, width is
        # w_ratio of the cell width, approximately square, x-centred.
        ink_h = rect.width * ratios["w_ratio"]
        ink_w = ink_h
        ink_y = rect.y0 + rect.height * ratios["y_ratio"]
        ink_x = rect.x0 + (rect.width - ink_w) / 2

        new_x = round(ink_x, 2)
        new_y = round(ink_y, 2)
        new_w = round(ink_w * SCALE, 2)
        new_h = round(ink_h * SCALE, 2)

        dx = abs(new_x - cb["x"])
        dy = abs(new_y - cb["y"])
        dw = abs(new_w - cb["width"])
        dh = abs(new_h - cb["height"])

        if dx > 0.05 or dy > 0.05 or dw > 0.05 or dh > 0.05:
            changes += 1
            if check:
                print("  %s p%d id=%s: (%.1f,%.1f) %.1fx%.1f -> (%.1f,%.1f) %.1fx%.1f  "
                      "delta=(%.1f,%.1f,%.1f,%.1f)"
                      % (doc_id, page_no, cb["id"],
                         cb["x"], cb["y"],
                         cb["width"], cb["height"],
                         new_x, new_y, new_w, new_h,
                         new_x - cb["x"], new_y - cb["y"],
                         new_w - cb["width"], new_h - cb["height"]))
            else:
                cb["x"] = new_x
                cb["y"] = new_y
                cb["width"] = new_w
                cb["height"] = new_h

    pdf.close()

    if changes and not check:
        original = json.load(open(mapping_path))
        orig_fields = original["staticFields"]
        for orig, patched in zip(orig_fields, fields):
            if orig["type"] != "CheckBox":
                assert orig == patched, (
                    "non-checkbox field changed: %s" % orig["id"])
            else:
                for key in orig:
                    if key in ("x", "y", "width", "height"):
                        continue
                    assert orig[key] == patched[key], (
                        "checkbox key %r changed on %s" % (key, orig["id"]))
        with open(mapping_path, "w") as fh:
            json.dump({"staticFields": fields}, fh, indent=1)
            fh.write("\n")

    return changes


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true",
                    help="dry run: print what would change without writing")
    ap.add_argument("--only", action="append", default=[],
                    help="limit to these docIds")
    args = ap.parse_args()

    sys.path.insert(0, HERE)
    from ns_sources import shipped_sources

    work = shipped_sources()
    if args.only:
        work = [s for s in work if s["docId"] in args.only]

    total = 0
    for src in work:
        n = repair_one(src["docId"], check=args.check)
        if n:
            print("%-26s %d checkbox(es) %s"
                  % (src["docId"], n, "would change" if args.check else "reseated"))
            total += n

    if not total:
        print("all checkboxes already seated on their ink")
    else:
        print("\ntotal: %d checkbox(es) %s"
              % (total, "would change" if args.check else "reseated"))


if __name__ == "__main__":
    main()

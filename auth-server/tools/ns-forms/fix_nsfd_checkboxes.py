"""Reseat NSFD checkbox fields to cover the full visible tick glyph.

The original seat_ns_checkboxes.py sized checkboxes to match only the inner
ink of the □/☐ glyph. In the app's PDF viewer the checkbox control appears
smaller than the printed tick character. This script sizes checkboxes to
cover the full glyph bounding box (square, bottom-aligned within the
character cell) so the interactive control aligns with the visible character.

Usage:
    python3 fix_nsfd_checkboxes.py --check         # dry run
    python3 fix_nsfd_checkboxes.py                 # apply
    python3 fix_nsfd_checkboxes.py --only NSFD_FD12A --check
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


def _tick_chars(page):
    """Every tick character as (bbox_rect, font, char) from the raw dict."""
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                for ch_info in span.get("chars", []):
                    c = ch_info["c"]
                    if c in TICKS:
                        r = fitz.Rect(ch_info["bbox"])
                        out.append((r, span["font"], c))
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
    with open(mapping_path) as f:
        data = json.load(f)
    fields = data["staticFields"]
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
            pages_ticks[page_no] = _tick_chars(pdf[page_no - 1])
        ticks = pages_ticks[page_no]

        tick = nearest_tick(cb, ticks)
        if tick is None:
            print("  %s p%d: checkbox at (%.1f, %.1f) has no nearby tick"
                  % (doc_id, page_no, cb["x"], cb["y"]))
            continue

        rect, font, char = tick

        # Use the glyph cell width as the checkbox size (square).
        # Position: x at glyph x0, y bottom-aligned within the cell.
        glyph_w = rect.width
        glyph_h = rect.height
        box_size = glyph_w  # square checkbox matching visible width

        new_x = round(rect.x0, 2)
        new_y = round(rect.y0 + (glyph_h - box_size), 2)
        new_w = round(box_size * SCALE, 2)
        new_h = round(box_size * SCALE, 2)

        dx = abs(new_x - cb["x"])
        dy = abs(new_y - cb["y"])
        dw = abs(new_w - cb["width"])
        dh = abs(new_h - cb["height"])

        if dx > 0.05 or dy > 0.05 or dw > 0.05 or dh > 0.05:
            changes += 1
            if check:
                print("  %s p%d id=%s: (%.1f,%.1f) %.1fx%.1f -> (%.1f,%.1f) %.1fx%.1f"
                      % (doc_id, page_no, cb["id"],
                         cb["x"], cb["y"],
                         cb["width"], cb["height"],
                         new_x, new_y, new_w, new_h))
            else:
                cb["x"] = new_x
                cb["y"] = new_y
                cb["width"] = new_w
                cb["height"] = new_h

    pdf.close()

    if changes and not check:
        # Verify only geometry keys changed on checkboxes
        orig_data = json.load(open(mapping_path))
        orig_fields = orig_data["staticFields"]
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

        data["staticFields"] = fields
        with open(mapping_path, "w") as fh:
            json.dump(data, fh, indent=1)
        print("  wrote %s" % mapping_path)

    return changes


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--only", action="append", default=[])
    args = ap.parse_args()

    # Collect all NSFD forms
    all_nsfd = sorted([
        f.replace(".json", "")
        for f in os.listdir(EXPORT)
        if f.startswith("NSFD_FD") and f.endswith(".json")
    ])

    if args.only:
        all_nsfd = [d for d in all_nsfd if d in args.only]

    total = 0
    for doc_id in all_nsfd:
        n = repair_one(doc_id, check=args.check)
        if n:
            print("%-26s %d checkbox(es) %s"
                  % (doc_id, n, "would change" if args.check else "reseated"))
            total += n

    if not total:
        print("all NSFD checkboxes already aligned with their glyphs")
    else:
        print("\ntotal: %d checkbox(es) %s"
              % (total, "would change" if args.check else "reseated"))


if __name__ == "__main__":
    main()

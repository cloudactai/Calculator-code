"""Shift single-line TextFields down off the caption text above them, NBKB batch.

The narrow two-column layout (English/French side by side, ~260pt wide) wraps
inline captions the single-wide-column forms never have to: "(b) the
petitioner intends to proceed in the ____ language;" does not fit on one line
at 260pt, so "the petitioner intends to proceed in the" wraps to its own
line and "language;" trails the blank on the line below it. The build placed
the field on the wrapped caption's own baseline instead of the row
"language;" actually sits on, so the box's top edge cuts across the
descenders of the line above it (confirmed on the render: "petitioner" and
"proceed" both visibly clipped by the field's top border on NBKB_72A p3).

Unlike a TextArea, a TextField is already at the one approved line height
(13.3pt) -- there is no slack to trim from the top without leaving less than
one line to type into. The correct move is different: shift the box *down*
to the row its own trailing text ("language;", "am/pm", "h") actually sits
on, keeping the same height. The bottom of a single-line field carries no
meaning to preserve the way a TextArea's does, so this is a straight move,
not a resize.

Safety: after the shift, the field must not land on top of *other* printed
text below it (checked the same way -- if it would, the shift is skipped and
reported for a manual look rather than guessed at). Only `y` is touched.

Usage:
    python3 shift_nb_textfields_off_captions.py --check     # dry run (default)
    python3 shift_nb_textfields_off_captions.py              # apply
"""
import argparse
import glob
import json
import os

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))

GAP = 1.5
SCALE = 1.5
# A genuine wrapped-caption overlap is a few points into the line above --
# 72A p3's confirmed case is 5.6pt. Packed adjacent single-line rows (a
# "Work:" field sitting 1-2pt into its own caption's bbox, with "Home:" right
# below it) produced multi-line iteration that walked the field two whole
# rows down onto a *different* field's row -- wrong. Capping the shift to one
# short, single-pass move and refusing anything that would need a second
# pass keeps this to the wrapped-caption case it was written for.
MAX_SHIFT = 10.0


def blocking_line_bottom(page, x0, x1, y0, height):
    """Bottom edge of the printed line whose bbox contains y0 (the field's
    current top), restricted to lines whose *text* -- not the line's bbox --
    horizontally overlaps [x0, x1].

    A line's bbox can carry a leading/trailing space whose own glyph box
    reaches a hair past the last real character (72A p3's "language;" line
    measures x0=233.2 by bbox, x0=236.1 by its first non-space word) -- using
    the bbox directly manufactured a 0.2pt false overlap that blocked the
    field from ever landing next to its own trailing text. Word-level boxes
    don't have that padding.
    """
    best = None
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            text = "".join(s["text"] for s in spans)
            if not text.strip():
                continue
            words = [w for w in page.get_text("words", clip=fitz.Rect(line["bbox"]))
                    if w[4].strip()]
            if not words:
                continue
            wx0 = min(w[0] for w in words)
            wx1 = max(w[2] for w in words)
            wy0 = min(w[1] for w in words)
            wy1 = max(w[3] for w in words)
            if wx1 <= x0 or wx0 >= x1:
                continue
            if wy0 < y0 < wy1:
                if best is None or wy1 > best:
                    best = wy1
    return best


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="dry run: print what would change, write nothing")
    args = parser.parse_args()

    docs = sorted(set(os.path.basename(p)[:-4]
                      for p in glob.glob(os.path.join(EXPORT, "NBKB_*.pdf"))))
    total = 0
    for doc_id in docs:
        json_path = os.path.join(EXPORT, "%s.json" % doc_id)
        mapping = json.load(open(json_path))
        fields = mapping["staticFields"]
        tfields = [f for f in fields if f["type"] == "TextField"]
        if not tfields:
            continue
        doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        changed = False
        for field in tfields:
            page = doc[field["page"] - 1]
            x0 = field["x"]
            x1 = field["x"] + field["width"] / SCALE
            height = field["height"] / SCALE
            cur_y = field["y"]
            line_bottom = blocking_line_bottom(page, x0, x1, cur_y, height)
            if line_bottom is None:
                continue
            new_y = round(line_bottom + GAP, 2)
            shift = new_y - cur_y
            if shift > MAX_SHIFT:
                print("%s p%d field %s: overlap would need a %.1fpt shift "
                      "(> %.0f) -- skipping, needs a manual look"
                      % (doc_id, field["page"], field["id"], shift, MAX_SHIFT))
                continue
            cur_y = new_y
            # Safety: the shifted box must not now land on other text below,
            # and must not need a *second* pass -- that shape is the packed-
            # adjacent-rows case, not a wrapped caption, and is refused.
            conflict = blocking_line_bottom(page, x0, x1, cur_y, height)
            if conflict is not None:
                print("%s p%d field %s: one shift still leaves an overlap -- "
                      "skipping, needs a manual look"
                      % (doc_id, field["page"], field["id"]))
                continue
            old_y = field["y"]
            print("%-10s p%-2d id=%-14s y %.1f -> %.1f"
                  % (doc_id, field["page"], field["id"], old_y, cur_y))
            total += 1
            if not args.check:
                field["y"] = cur_y
                changed = True
        doc.close()
        if changed:
            with open(json_path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")

    print("\n%d TextField(s) %s" % (total, "would be shifted" if args.check else "shifted"))


if __name__ == "__main__":
    main()

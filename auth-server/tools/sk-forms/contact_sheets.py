"""Gate E: render every page of every Saskatchewan form with its overlay drawn on.

Pages are tiled several to a sheet so the whole 195-page set can actually be
looked at, page by page, rather than sampled. Colours match the BC/ON QA
convention: orange = TextField, green = TextArea, red = CheckBox.

    python3 contact_sheets.py                 # all 40 forms
    python3 contact_sheets.py --only SKKB_15_47
    python3 contact_sheets.py --per-sheet 4

Sheets land in `_incoming_sk/sheets/`. Remember guide 7's warning: this draws the
stored rectangle, while the app draws its own bordered control inside it. Defects
that depend on the control's border (a box flush against type, two boxes sharing
a line) are caught by `verify_sk.py`, not by eye here.
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))

import build_sk_forms as B  # noqa: E402
from sk_sources import all_sources  # noqa: E402

SCALE = 1.5
COLOURS = {"CheckBox": (1, 0, 0), "TextArea": (0, 0.5, 0), "TextField": (1, 0.5, 0)}
SHEETS = os.path.join(B.STAGE, "sheets")


def render(doc_id, folder, per_sheet, zoom):
    pdf = os.path.join(folder, "%s.pdf" % doc_id)
    fields = json.load(open(os.path.join(folder, "%s.json" % doc_id)))["staticFields"]
    doc = fitz.open(pdf)
    pages = []
    for number, page in enumerate(doc, start=1):
        shape = page.new_shape()
        for field in [f for f in fields if f["page"] == number]:
            rect = fitz.Rect(field["x"], field["y"],
                             field["x"] + field["width"] / SCALE,
                             field["y"] + field["height"] / SCALE)
            shape.draw_rect(rect)
            shape.finish(color=COLOURS.get(field["type"], (0, 0, 1)), width=1.0)
        shape.commit()
        pages.append(page.get_pixmap(matrix=fitz.Matrix(zoom, zoom)))

    os.makedirs(SHEETS, exist_ok=True)
    written = []
    for start in range(0, len(pages), per_sheet):
        group = pages[start:start + per_sheet]
        columns = 2 if len(group) > 1 else 1
        rows = (len(group) + columns - 1) // columns
        width = max(p.width for p in group)
        height = max(p.height for p in group)
        sheet = fitz.open()
        board = sheet.new_page(width=width * columns, height=height * rows)
        for index, pix in enumerate(group):
            column, row = index % columns, index // columns
            board.insert_image(
                fitz.Rect(column * width, row * height,
                          column * width + pix.width, row * height + pix.height),
                pixmap=pix)
        first, last = start + 1, start + len(group)
        path = os.path.join(SHEETS, "%s_p%02d-%02d.png" % (doc_id, first, last))
        board.get_pixmap().save(path)
        sheet.close()
        written.append(path)
    doc.close()
    return written


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=None)
    parser.add_argument("--per-sheet", type=int, default=4)
    parser.add_argument("--zoom", type=float, default=1.35)
    parser.add_argument("--stage", action="store_true", default=True)
    args = parser.parse_args()

    folder = os.path.join(B.STAGE, "out") if args.stage else B.EXPORT
    sources = all_sources()
    if args.only:
        sources = [s for s in sources if s["docId"] in set(args.only)]
    total = 0
    for src in sources:
        written = render(src["docId"], folder, args.per_sheet, args.zoom)
        total += len(written)
        print("%-13s %d sheets" % (src["docId"], len(written)))
    print("\n%d sheets in %s" % (total, SHEETS))


if __name__ == "__main__":
    main()

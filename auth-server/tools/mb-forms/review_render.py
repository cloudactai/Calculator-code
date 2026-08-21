"""Render a promoted template's pages for visual review.

Two renders per page, which is what the review asks for:

  `source`  the authoritative government page, with nothing drawn on it
  `overlay` the shipped background with every mapped field drawn and labelled

The overlay draws the rectangle the mapping stores, colour-coded by type, with
each box's index printed in its corner so a finding can be written down against
something. It is deliberately *not* the QA render `build_*.py` writes: that one
is built from the staged map before promotion, and a review has to be done
against what is actually shipped.

    python3 review_render.py MBAD_4 --pages 2
    python3 review_render.py MBREL_A --both
"""
import argparse
import json
import os

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)),
                      "form-template-export")
SCALE = 1.5
COLOURS = {"CheckBox": (0.85, 0, 0),
           "TextArea": (0, 0.5, 0),
           "TextField": (0, 0.35, 0.9)}


def stage_for(doc_id):
    """Where this form's fetched source sits."""
    province = "_incoming_sk" if doc_id.startswith("SK") else "_incoming_mb"
    return os.path.join(EXPORT, province, "%s_source.pdf" % doc_id)


def render(doc_id, out_dir, pages=None, zoom=2.4, want_source=True,
           want_overlay=True):
    os.makedirs(out_dir, exist_ok=True)
    mapping = os.path.join(EXPORT, "%s.json" % doc_id)
    fields = json.load(open(mapping))["staticFields"]
    written = []

    if want_source:
        source = stage_for(doc_id)
        if os.path.exists(source):
            doc = fitz.open(source)
            for number in pages or range(1, doc.page_count + 1):
                path = os.path.join(out_dir, "%s_p%02d_source.png" % (doc_id, number))
                doc[number - 1].get_pixmap(
                    matrix=fitz.Matrix(zoom, zoom)).save(path)
                written.append(path)
            doc.close()

    if want_overlay:
        doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        for number in pages or range(1, doc.page_count + 1):
            page = doc[number - 1]
            shape = page.new_shape()
            on_page = [f for f in fields if f["page"] == number]
            for index, f in enumerate(on_page, start=1):
                rect = fitz.Rect(f["x"], f["y"],
                                 f["x"] + f["width"] / SCALE,
                                 f["y"] + f["height"] / SCALE)
                colour = COLOURS.get(f["type"], (0.6, 0, 0.6))
                shape.draw_rect(rect)
                shape.finish(color=colour, width=0.7, fill=colour, fill_opacity=0.10)
                shape.insert_text(fitz.Point(rect.x0 + 0.6, rect.y0 + 4.4),
                                  str(index), fontsize=4.2, color=colour)
            shape.commit()
            path = os.path.join(out_dir, "%s_p%02d_overlay.png" % (doc_id, number))
            page.get_pixmap(matrix=fitz.Matrix(zoom, zoom)).save(path)
            written.append(path)
        doc.close()
    return written


def summarise(doc_id):
    """One line per page: what the mapping puts there, for the ledger."""
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    rows = []
    for number in range(1, doc.page_count + 1):
        on_page = [f for f in fields if f["page"] == number]
        kinds = {}
        for f in on_page:
            kinds[f["type"]] = kinds.get(f["type"], 0) + 1
        rows.append({"page": number, "fields": len(on_page), "kinds": kinds})
    doc.close()
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("docId")
    parser.add_argument("--pages", type=int, nargs="*", default=None)
    parser.add_argument("--out", default=None)
    parser.add_argument("--zoom", type=float, default=2.4)
    parser.add_argument("--overlay-only", action="store_true")
    args = parser.parse_args()
    out = args.out or os.path.join(EXPORT, "_review", args.docId)
    written = render(args.docId, out, args.pages, args.zoom,
                     want_source=not args.overlay_only)
    for path in written:
        print(path)


if __name__ == "__main__":
    main()

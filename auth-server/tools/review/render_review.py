"""Render every page of a template three ways, for the page-by-page review.

The review a new batch has to pass asks two different questions of every page,
and they need two different pictures:

  **source**   the government's own page, nothing drawn on it. The authority.
  **overlay**  the shipped background with every mapped field outlined and
               numbered, so placement, extent and type can be judged against the
               source beside it.
  **filled**   the same page with a representative value *stamped into* every
               field the way `FillPdf.savePdf` stamps it -- same y-flip, same
               8pt Helvetica, same ZapfDingbats tick. This is the only view that
               shows clipping, a value overflowing its box, a multi-line answer
               in a one-line control, or a tick drawn outside its square.

An overlay alone cannot answer the second question: it draws the rectangle we
store, while the viewer draws its own bordered control inside that rectangle and
the export stamps text into it. Every defect class in the Saskatchewan README's
"five that only showed up in the app" is of that kind.

    python3 render_review.py MBPC_1                # all three, every page
    python3 render_review.py MBPC_1 --pages 1 2    # just those pages
    python3 render_review.py --sheet MBPC_1        # one contact sheet per view

Output goes to `form-template-export/_review/<docId>/`, which is gitignored:
these are working pictures, not artifacts. What is committed is the ledger the
reviewer fills in from them (`review_ledger.py`).
"""
import argparse
import json
import os

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)),
                      "auth-server", "form-template-export")
if not os.path.isdir(EXPORT):
    EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)),
                          "form-template-export")
REVIEW = os.path.join(EXPORT, "_review")
SCALE = 1.5

OUTLINE = {"CheckBox": (0.85, 0, 0),
           "TextArea": (0, 0.5, 0),
           "TextField": (0, 0.35, 0.9)}

# Representative values. Deliberately *ordinary* length rather than long: the
# point of the filled pass is that red -- a value the box cannot hold -- means a
# box that is genuinely too small for the answer the form asks for. A 30-
# character sample turns every short blank red (a court file number, a "20__"
# year slot) and the signal is lost in its own noise. "Jordan A. Whitfield" is
# 19 characters, about 76pt at 8pt Helvetica, which is a realistic name on a
# realistic name line.
SAMPLE = {
    "TextField": "Jordan A. Whitfield",
    "TextArea": ("The applicant seeks an order varying paragraph 4 of the order "
                 "of 12 March 2024, on the ground that there has been a material "
                 "change in circumstances since that order was made."),
    "CheckBox": "checked",
}


# Where each province's staged government source lives. PEI's entry is the one
# that needs a word of explanation: the "source" render for a PEI form is the
# LibreOffice render of the court's Word document, not a government PDF, because
# the court's own PDFs are XFA shells (see tools/pei-forms/README.md). It is
# still the right authority to review against -- it is the court's own document,
# typeset -- but when a page looks wrong the renderer is a suspect alongside the
# detector, which is not true of the other provinces.
STAGE = (("SK", "_incoming_sk"),
         ("MB", "_incoming_mb"),
         ("PEISC_", "_incoming_pei"))


def stage_for(doc_id):
    for prefix, folder in STAGE:
        if doc_id.startswith(prefix):
            return os.path.join(EXPORT, folder, "%s_source.pdf" % doc_id)
    return os.path.join(EXPORT, "_incoming_mb", "%s_source.pdf" % doc_id)


def _rect(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def render_source(doc_id, pages, zoom, out_dir):
    src = stage_for(doc_id)
    if not os.path.exists(src):
        return []
    doc = fitz.open(src)
    written = []
    for number in pages or range(1, doc.page_count + 1):
        if number > doc.page_count:
            continue
        path = os.path.join(out_dir, "%s_p%02d_source.png" % (doc_id, number))
        doc[number - 1].get_pixmap(matrix=fitz.Matrix(zoom, zoom)).save(path)
        written.append(path)
    doc.close()
    return written


def render_overlay(doc_id, fields, pages, zoom, out_dir):
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    written = []
    for number in pages or range(1, doc.page_count + 1):
        page = doc[number - 1]
        shape = page.new_shape()
        for index, field in enumerate(
                [f for f in fields if f["page"] == number], start=1):
            rect = _rect(field)
            colour = OUTLINE.get(field["type"], (0.6, 0, 0.6))
            shape.draw_rect(rect)
            shape.finish(color=colour, width=0.7, fill=colour, fill_opacity=0.10)
            if field.get("rule") == "bottom":
                shape.draw_line(fitz.Point(rect.x0, rect.y1),
                                fitz.Point(rect.x1, rect.y1))
                shape.finish(color=(0, 0, 0), width=0.7)
            shape.insert_text(fitz.Point(rect.x0 + 0.6, rect.y0 + 4.4),
                              str(index), fontsize=4.2, color=colour)
        shape.commit()
        path = os.path.join(out_dir, "%s_p%02d_overlay.png" % (doc_id, number))
        page.get_pixmap(matrix=fitz.Matrix(zoom, zoom)).save(path)
        written.append(path)
    doc.close()
    return written


def render_filled(doc_id, fields, pages, zoom, out_dir):
    """Stamp a representative value into every field, as the export does.

    Deliberately mirrors `FillPdf.savePdf`: the stored rectangle's `y` is the
    box top in a y-down frame, so the stamp flips it to
    `pageH - y - height/SCALE`, the text is 8pt Helvetica, and a checked box is
    ZapfDingbats "4". Getting that flip wrong is the single most common way an
    overlay that looks right exports wrong, so the review has to see the same
    arithmetic the export uses.
    """
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    written = []
    for number in pages or range(1, doc.page_count + 1):
        page = doc[number - 1]
        height = page.rect.height
        for field in [f for f in fields if f["page"] == number]:
            box_height = field["height"] / SCALE
            top = height - field["y"] - box_height
            rect = fitz.Rect(field["x"], height - top - box_height,
                             field["x"] + field["width"] / SCALE,
                             height - top)
            value = field.get("value") or SAMPLE.get(field["type"], "")
            if field["type"] == "CheckBox":
                page.insert_text(fitz.Point(rect.x0 + 1, rect.y1 - 1.5), "4",
                                 fontname="zadb",
                                 fontsize=min(rect.height, rect.width) * 0.9,
                                 color=(0, 0, 0.75))
                continue
            # White background to mask printed anchor text (bracket tokens,
            # underscore runs) — mirrors the drawRectangle in FillPdf.jsx.
            shape_bg = page.new_shape()
            shape_bg.draw_rect(rect)
            shape_bg.finish(color=None, fill=(1, 1, 1), fill_opacity=1.0)
            shape_bg.commit()
            if field.get("rule") == "bottom":
                shape_rule = page.new_shape()
                shape_rule.draw_line(fitz.Point(rect.x0, rect.y1),
                                     fitz.Point(rect.x1, rect.y1))
                shape_rule.finish(color=(0, 0, 0), width=0.7)
                shape_rule.commit()
            width = fitz.get_text_length(value, fontname="helv", fontsize=8)
            overflows = (field["type"] != "TextArea"
                         and width > (rect.width - 2))
            colour = (0.85, 0, 0) if overflows else (0, 0, 0.8)
            if field["type"] == "TextArea":
                page.insert_textbox(rect, value, fontname="helv", fontsize=8,
                                    color=colour, align=0)
            else:
                page.insert_text(fitz.Point(rect.x0 + 1, rect.y1 - 3.0), value,
                                 fontname="helv", fontsize=8, color=colour)
        path = os.path.join(out_dir, "%s_p%02d_filled.png" % (doc_id, number))
        page.get_pixmap(matrix=fitz.Matrix(zoom, zoom)).save(path)
        written.append(path)
    doc.close()
    return written


def render_combined(doc_id, fields, pages, zoom, out_dir):
    """Outline **and** value on one image.

    The two questions the review asks are about the same rectangle, and reading
    them from two files doubles the number of pages to open without adding
    anything: the outline says where the box is and what type it is, the stamped
    value says whether a real answer lands on the line and fits. Drawn together,
    one picture answers both, and the government's own page is underneath both
    of them.
    """
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    written = []
    for number in pages or range(1, doc.page_count + 1):
        page = doc[number - 1]
        height = page.rect.height
        shape = page.new_shape()
        for index, field in enumerate(
                [f for f in fields if f["page"] == number], start=1):
            rect = _rect(field)
            colour = OUTLINE.get(field["type"], (0.6, 0, 0.6))
            shape.draw_rect(rect)
            shape.finish(color=colour, width=0.6, fill=colour, fill_opacity=0.07)
            if field.get("rule") == "bottom":
                shape.draw_line(fitz.Point(rect.x0, rect.y1),
                                fitz.Point(rect.x1, rect.y1))
                shape.finish(color=(0, 0, 0), width=0.7)
            shape.insert_text(fitz.Point(rect.x0 + 0.6, rect.y0 + 4.0),
                              str(index), fontsize=4.0, color=colour)
        shape.commit()
        for field in [f for f in fields if f["page"] == number]:
            rect = _rect(field)
            value = field.get("value") or SAMPLE.get(field["type"], "")
            if field["type"] == "CheckBox":
                page.insert_text(fitz.Point(rect.x0 + 1, rect.y1 - 1.5), "4",
                                 fontname="zadb",
                                 fontsize=min(rect.height, rect.width) * 0.9,
                                 color=(0, 0, 0.8))
                continue
            # White background to mask printed anchor text.
            shape_bg = page.new_shape()
            shape_bg.draw_rect(rect)
            shape_bg.finish(color=None, fill=(1, 1, 1), fill_opacity=1.0)
            shape_bg.commit()
            if field.get("rule") == "bottom":
                shape_rule = page.new_shape()
                shape_rule.draw_line(fitz.Point(rect.x0, rect.y1),
                                     fitz.Point(rect.x1, rect.y1))
                shape_rule.finish(color=(0, 0, 0), width=0.7)
                shape_rule.commit()
            width = fitz.get_text_length(value, fontname="helv", fontsize=8)
            overflows = (field["type"] != "TextArea"
                         and width > (rect.width - 2))
            colour = (0.85, 0, 0) if overflows else (0, 0, 0.8)
            if field["type"] == "TextArea":
                page.insert_textbox(rect, value, fontname="helv", fontsize=8,
                                    color=colour, align=0)
            else:
                page.insert_text(fitz.Point(rect.x0 + 1, rect.y1 - 3.0), value,
                                 fontname="helv", fontsize=8, color=colour)
        path = os.path.join(out_dir, "%s_p%02d_combined.png" % (doc_id, number))
        page.get_pixmap(matrix=fitz.Matrix(zoom, zoom)).save(path)
        written.append(path)
    doc.close()
    return written


def contact_sheet(paths, out_path, columns=3):
    """Tile page renders into one image, for navigating a long form."""
    if not paths:
        return None
    pixmaps = [fitz.Pixmap(p) for p in paths]
    width = max(p.width for p in pixmaps)
    height = max(p.height for p in pixmaps)
    rows = (len(pixmaps) + columns - 1) // columns
    sheet = fitz.open()
    page = sheet.new_page(width=width * columns / 4.0,
                          height=height * rows / 4.0)
    for index, path in enumerate(paths):
        row, column = divmod(index, columns)
        cell = fitz.Rect(column * width / 4.0, row * height / 4.0,
                         (column + 1) * width / 4.0, (row + 1) * height / 4.0)
        page.insert_image(cell, filename=path)
    page.get_pixmap(matrix=fitz.Matrix(2, 2)).save(out_path)
    sheet.close()
    return out_path


def render(doc_id, pages=None, zoom=2.4, out_dir=None, views=("source", "overlay", "filled")):
    out_dir = out_dir or os.path.join(REVIEW, doc_id)
    os.makedirs(out_dir, exist_ok=True)
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    written = {}
    if "source" in views:
        written["source"] = render_source(doc_id, pages, zoom, out_dir)
    if "overlay" in views:
        written["overlay"] = render_overlay(doc_id, fields, pages, zoom, out_dir)
    if "filled" in views:
        written["filled"] = render_filled(doc_id, fields, pages, zoom, out_dir)
    if "combined" in views:
        written["combined"] = render_combined(doc_id, fields, pages, zoom, out_dir)
    return written


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("docId")
    parser.add_argument("--pages", type=int, nargs="*", default=None)
    parser.add_argument("--zoom", type=float, default=2.4)
    parser.add_argument("--views", nargs="*",
                        default=["source", "overlay", "filled"])
    parser.add_argument("--sheet", action="store_true",
                        help="also tile each view into one contact sheet")
    args = parser.parse_args()
    written = render(args.docId, args.pages, args.zoom, views=args.views)
    out_dir = os.path.join(REVIEW, args.docId)
    for view, paths in written.items():
        for path in paths:
            print(path)
        if args.sheet and paths:
            sheet = contact_sheet(
                paths, os.path.join(out_dir, "%s_%s_sheet.png" % (args.docId, view)))
            print(sheet)


if __name__ == "__main__":
    main()

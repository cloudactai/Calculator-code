"""Seating passes shared by the AcroForm-sourced provinces (NL, NB).

`bc_pipeline.extract` converts a government widget rectangle straight into an
overlay field, which is right as far as it goes: on an AcroForm source the
widget rect *is* the government's own geometry and the BC refinement passes
(mark snapping, ruled-block expansion, amount sizing) must stay off, because
they exist to recover geometry XFA never emitted and moving a real rect only
makes placement worse.

But three things still need correcting, and all three were measured on the
batches rather than assumed:

* **A checkbox rect is not the printed square.** Acrobat hangs the annotation
  around the glyph with a point or two of padding on each side, so a control
  taken from the rect visibly overhangs the box drawn under it. Saskatchewan
  shipped 304 boxes like that in 2026-08 before anyone noticed.
* **A text widget is far taller than its printed line.** Ontario measured the
  approved single-line height at 13.3 pt; government widgets routinely run two
  to three times that, and the editor top-aligns its input, so typed text floats
  above the rule instead of sitting on it.
* **A widget can lie outside the paper.** Newfoundland's Form F4.03A carries a
  checkbox at y = 796.02 on a 792 pt page. `clamp_to_page` cannot rescue it --
  it only ever shrinks height, and this box's *top* is already off-sheet.

`underscore_fields` is here for the same reason: both provinces publish a
handful of forms with no widget layer at all, whose blanks print as underscore
runs (the Saskatchewan vocabulary).
"""
import os
import re
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "bc-forms"))
sys.path.insert(0, os.path.join(HERE, "on-forms"))

import bc_pipeline as bp  # noqa: E402
import page_geom as G  # noqa: E402

SCALE = bp.SCALE
STD_LINE = G.STD_LINE      # 13.3 pt -- the approved single-line box height
SEAT_GAP = G.SEAT_GAP      # 1.26 pt -- box bottom sits this far above its rule

# A blank taller than this is a writing block, not a line, and keeps its height.
# Between the approved single-line height and the approved TextArea p25.
BLOCK_MIN = 22.0
TEXT_TYPES = ("TextField", "Number", "Date")


def seat_checkboxes(fields, background):
    """Seat each option on the square the page prints.

    The background must already be flattened: before that `get_drawings`
    returns the widget's own appearance box as well as the printed square, and
    the appearance box is the very rectangle being corrected.

    An option whose square cannot be found is left exactly where the government
    put it. That is not a failure to fix -- forms also declare options that
    print no square at all (a bare rule, a cell in a grid), and guessing at ink
    that is not there would move a control off its only anchor.
    """
    doc = fitz.open(background)
    moved = 0
    try:
        for field in fields:
            if field["type"] != "CheckBox":
                continue
            page = doc[field["page"] - 1]
            rect = fitz.Rect(field["x"], field["y"],
                             field["x"] + field["width"] / SCALE,
                             field["y"] + field["height"] / SCALE)
            mark = bp.printed_mark(page, rect)
            if not mark:
                continue
            if (abs(mark.x0 - rect.x0) < 0.2 and abs(mark.y0 - rect.y0) < 0.2
                    and abs(mark.width - rect.width) < 0.2):
                continue
            field["x"] = round(mark.x0, 2)
            field["y"] = round(mark.y0, 2)
            field["width"] = round(mark.width * SCALE, 2)
            field["height"] = round(mark.height * SCALE, 2)
            moved += 1
    finally:
        doc.close()
    return moved


def drop_offpage_fields(fields, page_sizes):
    """Remove any field lying wholly off the printed sheet; return what went.

    Reported rather than silently absorbed, so a source that starts emitting
    them in bulk is visible instead of quietly losing fields.
    """
    kept, dropped = [], []
    for field in fields:
        width, height = page_sizes[field["page"] - 1]
        if field["y"] >= height - 2 or field["x"] >= width - 2:
            dropped.append(field["id"])
            continue
        kept.append(field)
    fields[:] = kept
    return dropped


def refit_text_fields(fields, background):
    """Re-cut each single-line text field to the printed line and sit it on its rule.

    Only fields that are already a line are touched: a box at or above
    BLOCK_MIN is a writing block and keeps its height, and a TextArea is never
    touched. A line with no rule beneath it is still re-cut to the standard
    height but keeps its baseline, because the height is wrong independently of
    whether there is a rule to seat against.
    """
    doc = fitz.open(background)
    resized = seated = 0
    try:
        rules_by_page = {}
        for field in fields:
            if field["type"] not in TEXT_TYPES:
                continue
            height = field["height"] / SCALE
            if height >= BLOCK_MIN:
                continue
            page_no = field["page"]
            if page_no not in rules_by_page:
                rules_by_page[page_no] = G.hrules(doc[page_no - 1])
            rules = rules_by_page[page_no]

            bottom = field["y"] + height
            if abs(height - STD_LINE) > 0.05:
                field["height"] = round(STD_LINE * SCALE, 2)
                resized += 1
                # Shrink from the top, so the box stays where the text lands.
                field["y"] = round(bottom - STD_LINE, 2)

            rule = G.seat_rule(field, rules)
            if rule is not None:
                # `hrules` returns (y, x0, x1) -- the height is element 0.
                # Reading element 1 here seats the box against an *x*
                # coordinate, which silently moved Newfoundland fields by up to
                # 156 pt while every gate still reported zero findings; only the
                # QA render showed it.
                target = round(rule[0] - SEAT_GAP - STD_LINE, 2)
                if abs(target - field["y"]) > 0.05:
                    field["y"] = target
                    seated += 1
    finally:
        doc.close()
    return resized, seated


UNDERSCORE = re.compile(r"_{3,}")


def underscore_fields(background, doc_id):
    """Boxes for a flat form, read off its printed underscore runs.

    The Saskatchewan vocabulary and nothing more: a run of three or more
    underscores is a writing line, seated on the run's own measured ink. No
    option-square or ruled-grid detector is applied, because the forms this runs
    on do not print either and guessing would invent boxes.
    """
    doc = fitz.open(background)
    fields, index = [], 0
    try:
        for page_no, page in enumerate(doc, start=1):
            for block in page.get_text("dict")["blocks"]:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        for match in UNDERSCORE.finditer(span["text"]):
                            found = page.search_for(
                                span["text"][match.start():match.end()],
                                clip=fitz.Rect(span["bbox"]))
                            for rect in found or []:
                                if rect.width < 12:
                                    continue
                                index += 1
                                fields.append({
                                    "id": bp.new_id(doc_id, index),
                                    "type": "TextField",
                                    "x": round(rect.x0, 2),
                                    "y": round(rect.y1 - SEAT_GAP - STD_LINE, 2),
                                    "width": round(rect.width * SCALE, 2),
                                    "height": round(STD_LINE * SCALE, 2),
                                    "value": "",
                                    "fontSize": 9,
                                    "color": [0, 0, 0],
                                    "background": "none",
                                    "border": "none",
                                    "page": page_no,
                                })
        sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
        pages = doc.page_count
    finally:
        doc.close()
    audit = {"docId": doc_id, "pages": pages, "fields": len(fields),
             "checkboxes": 0, "textAreas": 0, "signaturesSkipped": 0,
             "signatureDetail": [], "widgetNames": [], "pageSizes": sizes}
    return fields, audit

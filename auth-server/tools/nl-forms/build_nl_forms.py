"""Build the Newfoundland templates: background PDF + overlay map + QA.

    python3 build_nl_forms.py [--only NLSC_F10_02A] [--category Financial] [--promote]

Without `--promote` it writes to `_incoming_nl/out` and prints the gate results
only.

## Two paths, and why

**Sixty of the 62 forms are AcroForm**, so the government's own widget
rectangles are the ground truth and the overlay is converted straight from them
by `bc_pipeline.extract`. The BC refinement passes (mark snapping, ruled-block
expansion, amount sizing) are deliberately *not* run, for the reason the Ontario
builder records: they exist to recover geometry XFA never emitted properly, and
moving a real AcroForm rectangle can only make placement worse.

Two passes *are* run, because both correct a defect this batch actually has and
both were measured on it rather than assumed:

* **Checkboxes are seated on the square the page prints.** Newfoundland's
  option widgets measure 9.8 x 7.7 -- not square, and larger than the printed
  box -- so a control taken from the widget rect visibly overhangs the box drawn
  under it. This is the same defect Saskatchewan's widget-path forms shipped
  with in 2026-08 and it has the same fix: measure the printed mark, seat the
  field on it, and leave alone any option that prints no square.

* **Single-line text fields are re-cut to the printed line and sat on their
  rule.** A Newfoundland widget rect has a median height of 18.8 pt against a
  13.3 pt printed line (p90 = 30.5), and the editor top-aligns its input, so
  typed text floats above the rule instead of sitting on it -- exactly Ontario's
  Defect 1. Blocks and multi-line areas keep their height.

**Two forms are flat** -- the Settlement Conference Brief and the file-access
Undertaking carry no widget layer at all. Their blanks print as underscore runs,
so those two take a printed-anchor path instead. They are listed in
`fetch_nl.KNOWN_STATIC`, and a third form losing its widgets is a fetch problem,
not something this builder silently absorbs.
"""
import argparse
import json
import os
import re
import shutil
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, os.path.join(TOOLS, "on-forms"))
sys.path.insert(0, HERE)

import bc_pipeline as bp  # noqa: E402
import page_geom as G  # noqa: E402
from fetch_nl import KNOWN_STATIC  # noqa: E402
from nl_sources import CATEGORY_ORDER, all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_nl")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

SCALE = bp.SCALE
STD_LINE = G.STD_LINE      # 13.3 pt -- the approved single-line box height
SEAT_GAP = G.SEAT_GAP      # 1.26 pt -- box bottom sits this far above its rule

# A blank taller than this is a writing block, not a line, and keeps its height.
# Same threshold the Ontario refit uses: between the approved single-line height
# and the approved TextArea p25.
BLOCK_MIN = 22.0
TEXT_TYPES = ("TextField", "Number", "Date")


def seat_checkboxes(fields, background):
    """Seat each option on the square the page prints, per the SK 2026-08 lesson.

    The background must already be flattened: before that the printed square and
    the widget's own appearance box are both returned, and the appearance box is
    the very rectangle being corrected. An option that prints no square is left
    where the government put it -- guessing at ink that is not there would move a
    control off its only anchor.
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
    """Remove any field that lies wholly off the printed sheet.

    Not a defensive clamp -- these exist. Form F4.03A carries a checkbox named
    "Check this box to dec_2" whose government rectangle starts at y = 796.02 on
    a 792 pt page, so the whole control sits below the paper: nothing is printed
    under it and no filer can ever see it. `clamp_to_page` cannot rescue it,
    because it only ever shrinks a box's height and this box's *top* is already
    past the edge; clamping just leaves an 8 pt stub hanging off the sheet.

    Dropping is the same rule the rest of the batch follows for a box with no
    printed anchor. Returns what was removed so it is reported rather than
    silently absorbed.
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
    """Re-cut every single-line text field to the printed line and sit it on its rule.

    Only the fields that are *already* a line are touched: a box at or above
    BLOCK_MIN is a writing block and keeps its height, and a TextArea is never
    touched at all. A line with no rule under it is still re-cut to the standard
    height but keeps its top, because the height is wrong independently of
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
                # Keep the baseline the filer sees: shrink from the top, so the
                # box stays where the text was going to land.
                field["y"] = round(bottom - STD_LINE, 2)

            rule = G.seat_rule(field, rules)
            if rule is not None:
                # `hrules` returns (y, x0, x1) -- the height is element 0. Reading
                # element 1 here seats the box against an *x* coordinate, which
                # silently moved fields by up to 156 pt while every gate still
                # reported zero findings; only the QA render showed it.
                target = round(rule[0] - SEAT_GAP - STD_LINE, 2)
                if abs(target - field["y"]) > 0.05:
                    field["y"] = target
                    seated += 1
    finally:
        doc.close()
    return resized, seated


UNDERSCORE = re.compile(r"_{3,}")


def underscore_fields(background, doc_id):
    """Boxes for the two flat forms, read off their printed underscore runs.

    This is the Saskatchewan vocabulary and nothing more: a run of three or more
    underscores is a writing line, seated on the run's own measured ink. These
    two forms print no option squares and no ruled grids, so no other detector
    is needed and none is guessed at.
    """
    doc = fitz.open(background)
    fields, index = [], 0
    try:
        for page_no, page in enumerate(doc, start=1):
            for block in page.get_text("dict")["blocks"]:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        for match in UNDERSCORE.finditer(span["text"]):
                            quads = page.search_for(
                                span["text"][match.start():match.end()],
                                clip=fitz.Rect(span["bbox"]))
                            for rect in quads or []:
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


def build_one(src, manifest):
    did = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % did)
    background = os.path.join(OUT, "%s.pdf" % did)
    pages = bp.flatten_background(source, background)

    if did in KNOWN_STATIC:
        fields, audit = underscore_fields(background, did)
        moved = resized = seated = 0
        dropped = []
    else:
        fields, audit = bp.extract(source, did)
        dropped = drop_offpage_fields(fields, audit["pageSizes"])
        bp.clamp_to_page(fields, audit["pageSizes"])
        moved = seat_checkboxes(fields, background)
        resized, seated = refit_text_fields(fields, background)

    bp.clamp_to_page(fields, audit["pageSizes"])
    geometry = bp.check_geometry(fields, audit["pageSizes"])
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % did))
    bp.write_mapping(os.path.join(OUT, "%s.json" % did), fields)

    audit.update(geometryProblems=geometry, overlapFlags=len(overlaps),
                 overlapDetail=overlaps[:20], checkboxesSeated=moved,
                 linesResized=resized, linesSeated=seated,
                 offPageDropped=dropped, fields=len(fields),
                 path="anchor" if did in KNOWN_STATIC else "widget")
    row = {
        "title": ("Form %s - %s" % (src["formNo"], src["title"])
                  if src["numbered"] else src["title"]),
        "shortTitle": ("NL %s" % src["formNo"]) if src["numbered"] else src["title"][:40],
        "footerText": manifest.get(did, {}).get("footerText") or src["court"],
        "status": "active",
        "fileName": "%s.pdf" % did,
        "docId": did,
        "province": "NL",
        "category": src["category"],
        "version": 1,
        "pageCount": pages,
    }
    return row, audit, geometry


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", action="append", default=[])
    ap.add_argument("--category", action="append", default=[])
    ap.add_argument("--promote", action="store_true")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    manifest = {m["docId"]: m for m in
                json.load(open(os.path.join(STAGE, "manifest.json")))}

    work = all_sources()
    if args.only:
        work = [s for s in work if s["docId"] in args.only]
    if args.category:
        work = [s for s in work if s["category"] in args.category]

    rows, audits, failures = [], [], []
    for src in work:
        row, audit, geometry = build_one(src, manifest)
        rows.append(row)
        audits.append(audit)
        if geometry:
            failures.append((src["docId"], "geometry", geometry[:3]))
        print("%-46s %-6s pages=%-3d fields=%-4d cb=%-4d seated=%-4d resized=%-4d geom=%-2d ovl=%d"
              % (src["docId"], audit["path"], audit["pages"], audit["fields"],
                 audit["checkboxes"], audit["checkboxesSeated"],
                 audit["linesResized"], len(geometry), audit["overlapFlags"]))

    rows.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]), r["docId"]))
    with open(os.path.join(OUT, "nl_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "nl_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    off = [(a["docId"], a["offPageDropped"]) for a in audits if a.get("offPageDropped")]
    print("\ngeometry failures: %s" % (failures or "none"))
    print("off-page fields dropped: %s" % (off or "none"))
    print("total: %d forms, %d pages, %d fields (%d checkboxes seated, %d lines re-cut)"
          % (len(audits), sum(a["pages"] for a in audits),
             sum(a["fields"] for a in audits),
             sum(a["checkboxesSeated"] for a in audits),
             sum(a["linesResized"] for a in audits)))
    if args.promote and not failures:
        for row in rows:
            did = row["docId"]
            shutil.copy(os.path.join(OUT, "%s.pdf" % did),
                        os.path.join(EXPORT, "%s.pdf" % did))
            shutil.copy(os.path.join(OUT, "%s.json" % did),
                        os.path.join(EXPORT, "%s.json" % did))
        print("promoted %d templates into form-template-export/" % len(rows))
    elif args.promote:
        print("NOT promoted -- fix the geometry failures first")


if __name__ == "__main__":
    main()

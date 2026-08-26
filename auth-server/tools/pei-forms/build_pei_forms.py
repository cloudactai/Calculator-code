"""Build the Prince Edward Island templates: background PDF + overlay map + QA.

    python3 build_pei_forms.py [--only PEISC_70A] [--category Financial] [--promote]

Like Nova Scotia, PEI is entirely a **printed-anchor** province here: every form
is built from the government's Word document, rendered to PDF by
`fetch_pei.py`, so there is never a widget rectangle to copy. See
`pei_sources.py` for why the Word source is used in preference to the fillable
PDFs (they are XFA, only 17 of the 34 have one, and flattening XFA is the most
fragile path in this repo).

The detectors are **Nova Scotia's**, unchanged, because PEI prints the same
vocabulary: Form 70A alone carries 49 underscore runs and 41 tick glyphs, and
Form 70I(A) (Statement of Income) sets its income table as a ruled grid. The
bracket token that dominates Nova Scotia is nearly absent here -- PEI writes its
blanks as underscore runs, closer to Saskatchewan -- but the detector costs
nothing to run and catches the handful that exist ("[name of corporation]" on
70I(A)).

**The background is ours, not the government's**, exactly as in Nova Scotia: if
a page looks wrong, LibreOffice is a suspect alongside the detector.
"""
import argparse
import json
import re
import os
import shutil
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, TOOLS)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, os.path.join(TOOLS, "on-forms"))
sys.path.insert(0, HERE)
# The anchor detectors are Nova Scotia's. PEI prints the same vocabulary --
# underscore runs, tick glyphs and ruled cells -- from the same kind of
# LibreOffice render, so there is one implementation and one place to fix it.
sys.path.insert(0, os.path.join(TOOLS, "ns-forms"))

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp  # noqa: E402
import ns_anchors as NA  # noqa: E402
import page_geom as G  # noqa: E402
from pei_sources import CATEGORY_ORDER, all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_pei")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

SCALE = A.SCALE
STD_LINE = A.STD_LINE
SEAT_GAP = A.SEAT_GAP

# Whether a token blank is a line or a writing block is decided by **what the
# token asks for**, not by how wide the box came out.
#
# Width was the obvious test and it is wrong: a token with nothing printed after
# it is extended to the right margin, so `[full name, including middle name(s)]`
# on the style of cause came out 440 pt wide and was typed as a TextArea -- a
# multi-line box for a single name, on the most-used line of the most-used form
# in the batch. Every party name in the batch is extended that way, so the
# defect was the rule, not an edge case.
#
# These are the tokens that genuinely want a paragraph.
BLOCK_TOKEN = re.compile(
    r"\b(describe|specifics|details?|particulars|set out|explain|reasons?|"
    r"list|summar|state (?:the|why|what)|nature of)\b", re.I)


def field(doc_id, index, kind, rect, page_no):
    return {
        "id": bp.new_id(doc_id, index),
        "type": kind,
        "x": round(rect.x0, 2),
        "y": round(rect.y0, 2),
        "width": round(rect.width * SCALE, 2),
        "height": round(rect.height * SCALE, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": page_no,
    }


def overlaps_any(rect, placed, slack=1.0):
    for other in placed:
        if rect.intersects(other) and (rect & other).get_area() > slack:
            return True
    return False


def detect(background, doc_id):
    """Every box on the form, in page order, from the printed anchors."""
    doc = fitz.open(background)
    fields, index = [], 0
    counts = {"token": 0, "tick": 0, "underscore": 0, "cell": 0, "dropped": 0}
    try:
        for page_no, page in enumerate(doc, start=1):
            placed = []
            # Ticks first: they are the smallest and most precisely anchored, so
            # a token box may not swallow one.
            for rect in NA.tick_boxes(page):
                if overlaps_any(rect, placed):
                    counts["dropped"] += 1
                    continue
                placed.append(rect)
                index += 1
                fields.append(field(doc_id, index, "CheckBox", rect, page_no))
                counts["tick"] += 1

            for rect in NA.underscore_boxes(page):
                seat = fitz.Rect(rect.x0, rect.y1 - SEAT_GAP - STD_LINE,
                                 rect.x1, rect.y1 - SEAT_GAP)
                if overlaps_any(seat, placed):
                    counts["dropped"] += 1
                    continue
                placed.append(seat)
                index += 1
                fields.append(field(doc_id, index, "TextField", seat, page_no))
                counts["underscore"] += 1

            for rect, token in NA.token_boxes(page):
                kind = "TextArea" if BLOCK_TOKEN.search(token) else "TextField"
                height = max(rect.height, STD_LINE)
                seat = fitz.Rect(rect.x0, rect.y1 - height, rect.x1, rect.y1)
                if overlaps_any(seat, placed):
                    counts["dropped"] += 1
                    continue
                placed.append(seat)
                index += 1
                fields.append(field(doc_id, index, kind, seat, page_no))
                counts["token"] += 1

            # Ruled cells last: a table cell that already holds a token, a tick
            # or an underscore blank is that blank's, not a second box.
            for rect in NA.cell_boxes(page, G):
                if overlaps_any(rect, placed):
                    counts["dropped"] += 1
                    continue
                placed.append(rect)
                index += 1
                fields.append(field(doc_id, index, "TextField", rect, page_no))
                counts["cell"] += 1

        sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
        pages = doc.page_count
    finally:
        doc.close()

    fields.sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))
    audit = {"docId": doc_id, "pages": pages, "fields": len(fields),
             "checkboxes": sum(1 for f in fields if f["type"] == "CheckBox"),
             "textAreas": sum(1 for f in fields if f["type"] == "TextArea"),
             "signaturesSkipped": 0, "signatureDetail": [], "widgetNames": [],
             "pageSizes": sizes, "anchors": counts}
    return fields, audit


def build_one(src, manifest):
    did = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % did)
    background = os.path.join(OUT, "%s.pdf" % did)
    # A LibreOffice render carries no widget layer, so "flattening" is a copy --
    # but it is still routed through the same call so the background this build
    # ships is produced the same way every other province's is.
    pages = bp.flatten_background(source, background)

    fields, audit = detect(background, did)
    A.drop_offpage_fields(fields, audit["pageSizes"])
    bp.clamp_to_page(fields, audit["pageSizes"])
    audit["fields"] = len(fields)

    geometry = bp.check_geometry(fields, audit["pageSizes"])
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % did))
    bp.write_mapping(os.path.join(OUT, "%s.json" % did), fields)

    audit.update(geometryProblems=geometry, overlapFlags=len(overlaps),
                 overlapDetail=overlaps[:20])
    row = {
        "title": "Form %s - %s" % (src["formNo"], src["title"]),
        "shortTitle": "PE %s" % src["formNo"],
        "footerText": manifest.get(did, {}).get("footerText") or src["court"],
        "status": "active",
        "fileName": "%s.pdf" % did,
        "docId": did,
        "province": "PE",
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
            failures.append((src["docId"], geometry[:3]))
        a = audit["anchors"]
        print("%-26s pages=%-3d fields=%-4d tok=%-4d tick=%-4d und=%-4d cell=%-4d drop=%-3d geom=%-2d ovl=%d"
              % (src["docId"], audit["pages"], audit["fields"], a["token"],
                 a["tick"], a["underscore"], a["cell"], a["dropped"],
                 len(geometry), audit["overlapFlags"]))

    rows.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]), r["docId"]))
    with open(os.path.join(OUT, "pei_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "pei_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    total = lambda k: sum(a["anchors"][k] for a in audits)  # noqa: E731
    print("\ngeometry failures: %s" % (failures or "none"))
    print("total: %d forms, %d pages, %d fields "
          "(%d token, %d tick, %d underscore, %d cell; %d dropped as overlapping)"
          % (len(audits), sum(a["pages"] for a in audits),
             sum(a["fields"] for a in audits), total("token"), total("tick"),
             total("underscore"), total("cell"), total("dropped")))
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

"""Build the Newfoundland Provincial Court templates: background + overlay + QA.

    python3 build_nl_pc_forms.py [--only NLPC_FORM1] [--group epo] [--promote]

Without `--promote` it writes to `_incoming_nl_pc/out` and prints the gates only.

**Two paths in one batch**, chosen per form from the fetch manifest rather than
assumed:

* **21 forms carry the court's own AcroForm widgets** and convert straight from
  them through `bc_pipeline.extract`, with the shared seating passes in
  `tools/acroform_seat.py`. The background is baked rather than stripped, for
  the reason the Nova Scotia ISO batch recorded: several of these forms draw
  their option squares in the widget border and nothing else.
* **13 forms carry no widget layer at all** -- the Financial Information Sheet
  and the whole emergency-protection set -- and take the printed-anchor path.
  Three vocabularies run over them, because the protection set uses three:
  underscore runs (`acroform_seat.underscore_fields`, Saskatchewan's), drawn
  writing rules and drawn option squares (`nl_pc_anchors`), and the U+2610 tick
  glyph (`ns_anchors.tick_boxes`, Nova Scotia's). Form 003 prints **no
  underscore at all**, so the Saskatchewan detector alone returned zero boxes
  for a page full of blanks; no ruled-cell detector is applied, because these
  pages set no tables.

The **Financial Information Sheet ships with no boxes and that is correct** --
it is a page of instructions about what financial documents to attach, with no
blank anywhere on it. Inventing a box where the page prints no anchor is the one
thing every province's builder refuses to do.

Form 1 is a **hybrid**: it carries both an XFA packet and a real widget layer.
The widget layer is the government's own geometry, so it takes the widget path
like any other AcroForm; only a file with XFA and *no* widgets would need the
headless flatten, and the fetch gate fails one of those rather than letting this
builder produce a page of nothing.
"""
import argparse
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, TOOLS)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(TOOLS, "ns-forms"))

import fitz  # noqa: E402

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp  # noqa: E402
import nl_pc_anchors as anchors  # noqa: E402
import ns_anchors  # noqa: E402
from nl_pc_sources import all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_nl_pc")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

SCALE = A.SCALE


def add_drawn_blanks(background, doc_id, fields):
    """Add the boxes a drawn rule or a drawn square marks, beside the underscores.

    Form 003 of the protection set prints **no underscore at all** -- its party
    lines are drawn rules and its options are drawn squares -- so the
    Saskatchewan detector alone returned zero boxes for a page full of blanks.
    Both vocabularies appear on the same pages as underscore runs elsewhere in
    the set, so all three run and anything landing on a box already found is
    dropped.
    """
    document = fitz.open(background)
    index = len(fields)
    added = 0
    try:
        for number, page in enumerate(document, start=1):
            existing = [box_of(f) for f in fields if f["page"] == number]
            for rect in anchors.rule_boxes(page):
                seat = fitz.Rect(rect.x0, rect.y1 - A.SEAT_GAP - A.STD_LINE,
                                 rect.x1, rect.y1 - A.SEAT_GAP)
                if overlaps_any(seat, existing):
                    continue
                index += 1
                added += 1
                existing.append(seat)
                fields.append(overlay(bp.new_id(doc_id, index), "TextField",
                                      seat, number))
            # Two ways an option can be printed here, and the protection set
            # uses both: Form 003 sets its options as the glyph U+2610 in
            # MS-Gothic (the Nova Scotia vocabulary), while others draw the
            # square as vector art. Neither detector finds the other's.
            for rect in ns_anchors.tick_boxes(page) + anchors.square_boxes(page):
                if overlaps_any(rect, existing):
                    continue
                index += 1
                added += 1
                existing.append(rect)
                fields.append(overlay(bp.new_id(doc_id, index), "CheckBox",
                                      rect, number))
    finally:
        document.close()
    fields.sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))
    return added


def box_of(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def overlaps_any(rect, taken, share=0.35):
    for other in taken:
        hit = rect & other
        if not hit.is_empty and hit.get_area() > share * min(rect.get_area(),
                                                             other.get_area()):
            return True
    return False


def overlay(field_id, kind, rect, page):
    return {
        "id": field_id,
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
        "page": page,
    }


def build_one(src, manifest):
    doc_id = src["docId"]
    entry = manifest[doc_id]
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    background = os.path.join(OUT, "%s.pdf" % doc_id)

    if entry["kind"] == "acroform":
        pages, cleared = A.flatten_baked(source, background)
        fields, audit = bp.extract(source, doc_id)
        dropped = A.drop_offpage_fields(fields, audit["pageSizes"])
        bp.clamp_to_page(fields, audit["pageSizes"])
        moved = A.seat_checkboxes(fields, background)
        resized, seated = A.refit_text_fields(fields, background)
        path = "widget"
    else:
        pages = bp.flatten_background(source, background)
        fields, audit = A.underscore_fields(background, doc_id)
        added = add_drawn_blanks(background, doc_id, fields)
        audit["fields"] = len(fields)
        audit["checkboxes"] = sum(1 for f in fields if f["type"] == "CheckBox")
        audit["drawnBlanks"] = added
        cleared = moved = resized = seated = 0
        dropped = []
        path = "anchor"

    bp.clamp_to_page(fields, audit["pageSizes"])
    geometry = bp.check_geometry(fields, audit["pageSizes"])
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)

    audit.update(geometryProblems=geometry, overlapFlags=len(overlaps),
                 overlapDetail=overlaps[:20], checkboxesSeated=moved,
                 linesResized=resized, linesSeated=seated,
                 offPageDropped=dropped, fields=len(fields), path=path,
                 valuesCleared=cleared)
    row = {
        "title": src["title"],
        "shortTitle": short_title(src),
        "footerText": entry.get("footerText") or src["court"],
        "status": "active",
        "fileName": "%s.pdf" % doc_id,
        "docId": doc_id,
        "province": "NL",
        "category": src["category"],
        "version": 1,
        "pageCount": pages,
    }
    return row, audit, geometry


def short_title(src):
    """What the picker shows in its narrow column.

    The Supreme Court set reads "NL F6.02A". These forms are numbered by two
    different schemes and several are not numbered at all, so the short title
    names the court as well: a user choosing between "Notice of Hearing" in the
    adult-adoption set and "Notice of Hearing" in the protection set has nothing
    else to tell them apart.
    """
    doc_id = src["docId"]
    if src["group"] == "epo":
        return "NL EPO %s" % doc_id.rsplit("_", 1)[1]
    tail = doc_id[len("NLPC_"):]
    if tail.startswith("FORM"):
        return "NL PC Form %s" % tail[len("FORM"):]
    if tail.startswith("AF"):
        return "NL PC %s" % tail
    if tail.startswith("SCHEDULE_"):
        return "NL PC Schedule %s" % tail.rsplit("_", 1)[1]
    return "NL PC %s" % src["title"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--group", action="append", default=[])
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    manifest = {m["docId"]: m for m in
                json.load(open(os.path.join(STAGE, "manifest.json")))}

    work = all_sources()
    if args.only:
        work = [s for s in work if s["docId"] in args.only]
    if args.group:
        work = [s for s in work if s["group"] in args.group]

    rows, audits, failures = [], [], []
    for src in work:
        row, audit, geometry = build_one(src, manifest)
        rows.append(row)
        audits.append(audit)
        if geometry:
            failures.append((src["docId"], geometry[:3]))
        print("%-34s %-6s pages=%-3d fields=%-4d cb=%-4d seated=%-4d resized=%-4d geom=%-2d ovl=%d"
              % (src["docId"], audit["path"], audit["pages"], audit["fields"],
                 audit["checkboxes"], audit["checkboxesSeated"],
                 audit["linesResized"], len(geometry), audit["overlapFlags"]))

    with open(os.path.join(OUT, "nl_pc_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "nl_pc_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    empty = [a["docId"] for a in audits if not a["fields"]]
    print("\ngeometry failures: %s" % (failures or "none"))
    print("values cleared before baking: %s"
          % ([(a["docId"], a["valuesCleared"]) for a in audits
              if a.get("valuesCleared")] or "none"))
    print("templates with no boxes at all: %s" % (empty or "none"))
    print("total: %d forms, %d pages, %d fields"
          % (len(audits), sum(a["pages"] for a in audits),
             sum(a["fields"] for a in audits)))
    if args.promote and not failures:
        for row in rows:
            doc_id = row["docId"]
            shutil.copy(os.path.join(OUT, "%s.pdf" % doc_id),
                        os.path.join(EXPORT, "%s.pdf" % doc_id))
            shutil.copy(os.path.join(OUT, "%s.json" % doc_id),
                        os.path.join(EXPORT, "%s.json" % doc_id))
        print("promoted %d templates into form-template-export/" % len(rows))
    elif args.promote:
        print("NOT promoted -- fix the geometry failures first")


if __name__ == "__main__":
    main()

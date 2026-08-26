"""Build the New Brunswick templates: background PDF + overlay map + QA.

    python3 build_nb_forms.py [--only NBKB_72J] [--category Financial] [--promote]

Without `--promote` it writes to `_incoming_nb/out` and prints the gate results
only.

**Twenty-nine of the 34 forms are AcroForm**, so the government's own widget
rectangles are the ground truth and the overlay converts straight from them via
`bc_pipeline.extract`. The seating passes are shared with Newfoundland and live
in `tools/acroform_seat.py`; the BC refinement passes stay off, for the reason
the Ontario builder records.

**Five forms carry no widget layer and no printed blank at all.** They are the
Rules of Court's own "APPENDIX OF FORMS" prose, with parenthetical instructions
where a blank would be, so they ship as a background with **zero boxes** --
inventing a box where the page prints no anchor is the one thing every
province's builder refuses to do. They are listed in `fetch_nb.KNOWN_STATIC`,
and a form *newly* losing its widgets is a fetch problem rather than something
this builder silently absorbs.
"""
import argparse
import json
import os
import shutil
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, TOOLS)
sys.path.insert(0, HERE)

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp  # noqa: E402
from fetch_nb import KNOWN_STATIC  # noqa: E402
from nb_sources import CATEGORY_ORDER, all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_nb")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

# The seating passes live in `tools/acroform_seat.py`, shared with New
# Brunswick: both provinces publish real AcroForms with the same three defects
# (checkbox rects larger than the printed square, text widgets far taller than
# the printed line, and the occasional widget off the sheet), so there is one
# implementation and one place to fix it.
SCALE = A.SCALE

def build_one(src, manifest):
    did = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % did)
    background = os.path.join(OUT, "%s.pdf" % did)
    pages = bp.flatten_background(source, background)

    if did in KNOWN_STATIC:
        fields, audit = A.underscore_fields(background, did)
        moved = resized = seated = 0
        dropped = []
    else:
        fields, audit = bp.extract(source, did)
        dropped = A.drop_offpage_fields(fields, audit["pageSizes"])
        bp.clamp_to_page(fields, audit["pageSizes"])
        moved = A.seat_checkboxes(fields, background)
        resized, seated = A.refit_text_fields(fields, background)

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
        "title": "Form %s - %s" % (src["formNo"], src["title"]),
        "shortTitle": "NB %s" % src["formNo"],
        "footerText": manifest.get(did, {}).get("footerText") or src["court"],
        "status": "active",
        "fileName": "%s.pdf" % did,
        "docId": did,
        "province": "NB",
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
    with open(os.path.join(OUT, "nb_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "nb_audit.json"), "w") as fh:
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

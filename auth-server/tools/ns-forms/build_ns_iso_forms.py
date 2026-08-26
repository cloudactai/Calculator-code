"""Build the Nova Scotia ISO templates: background PDF + overlay map + QA.

    python3 build_ns_iso_forms.py [--only NSISO_I] [--promote]

Without `--promote` it writes to `_incoming_ns_iso/out` and prints the gate
results only.

**This is the widget path, not Nova Scotia's usual one.** The 84 forms built by
`build_ns_forms.py` are LibreOffice renders of Word documents with no widget
layer, so every box there is read off printed ink. Every ISO form is a real
AcroForm, so the government's own rectangles are the ground truth and
`bc_pipeline.extract` converts straight from them. The BC refinement passes
(mark snapping, ruled-block expansion, amount sizing) stay **off**, for the
reason the Ontario builder records: they exist to recover geometry XFA never
emitted, and moving a real widget rect only makes placement worse.

The three seating corrections that do apply are shared with Newfoundland and New
Brunswick and live in `tools/acroform_seat.py`: a checkbox rect is not the
printed square, a text widget is far taller than its printed line, and a widget
can lie off the sheet.
"""
import argparse
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, TOOLS)
sys.path.insert(0, HERE)

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp  # noqa: E402
from ns_iso_sources import all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_ns_iso")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

SCALE = A.SCALE


def build_one(src, manifest):
    did = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % did)
    background = os.path.join(OUT, "%s.pdf" % did)
    # Baked, not simply stripped: these forms draw their option squares in the
    # widget border and nowhere else, so a plain flatten erases 172 of them.
    # See `acroform_seat.flatten_baked`.
    pages, cleared = A.flatten_baked(source, background)

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
                 offPageDropped=dropped, fields=len(fields), path="widget",
                 valuesCleared=cleared)
    row = {
        "title": src["catalogTitle"],
        "shortTitle": src["shortTitle"],
        "footerText": manifest.get(did, {}).get("footerText") or src["court"],
        "status": "active",
        "fileName": "%s.pdf" % did,
        "docId": did,
        "province": "NS",
        "category": src["category"],
        "version": 1,
        "pageCount": pages,
    }
    return row, audit, geometry


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", action="append", default=[])
    ap.add_argument("--promote", action="store_true")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    manifest = {m["docId"]: m for m in
                json.load(open(os.path.join(STAGE, "manifest.json")))}

    work = all_sources()
    if args.only:
        work = [s for s in work if s["docId"] in args.only]

    rows, audits, failures = [], [], []
    for src in work:
        row, audit, geometry = build_one(src, manifest)
        rows.append(row)
        audits.append(audit)
        if geometry:
            failures.append((src["docId"], "geometry", geometry[:3]))
        print("%-20s pages=%-3d fields=%-4d cb=%-4d seated=%-4d resized=%-4d geom=%-2d ovl=%d"
              % (src["docId"], audit["pages"], audit["fields"],
                 audit["checkboxes"], audit["checkboxesSeated"],
                 audit["linesResized"], len(geometry), audit["overlapFlags"]))

    with open(os.path.join(OUT, "ns_iso_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "ns_iso_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    off = [(a["docId"], a["offPageDropped"]) for a in audits if a.get("offPageDropped")]
    cleared = [(a["docId"], a["valuesCleared"]) for a in audits
               if a.get("valuesCleared")]
    print("\ngeometry failures: %s" % (failures or "none"))
    print("field values cleared before baking: %s" % (cleared or "none"))
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

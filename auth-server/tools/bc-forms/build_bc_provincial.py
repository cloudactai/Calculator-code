"""Build the 11 BC Provincial Court templates: background PDF + overlay map + QA.

Run: python3 build_bc_provincial.py [--promote]
Without --promote it writes to _incoming_bc/out and prints the gate results only.
"""
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
from bc_sources import PROVINCIAL, doc_id  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
STAGE = os.path.join(EXPORT, "_incoming_bc")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

# Court + function, per plan §7: the picker renders each as its own folder.
CATEGORY = {
    "3": "Provincial Court – Applications",
    "4": "Provincial Court – Financial",
    "16": "Provincial Court – Applications",
    "17": "Provincial Court – Applications",
    "18": "Provincial Court – Orders",
    "22": "Provincial Court – Trial",
    "42": "Provincial Court – Notices",
    "43": "Provincial Court – Notices",
    "44": "Provincial Court – Orders",
    "45": "Provincial Court – Evidence",
    "51": "Provincial Court – Filing",
}
# Order within the BC block: grouped by category, then by form number.
CATEGORY_ORDER = [
    "Provincial Court – Applications",
    "Provincial Court – Financial",
    "Provincial Court – Orders",
    "Provincial Court – Evidence",
    "Provincial Court – Trial",
    "Provincial Court – Notices",
    "Provincial Court – Filing",
]


def main():
    promote = "--promote" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    manifest = {m["docId"]: m for m in json.load(open(os.path.join(STAGE, "manifest.json")))}

    rows, audits, failures = [], [], []
    for form_no, name, pfa, _guid in PROVINCIAL:
        did = doc_id("Provincial", form_no)
        source = os.path.join(STAGE, "%s_source.pdf" % did)
        background = os.path.join(OUT, "%s.pdf" % did)
        pages = bp.flatten_background(source, background)
        fields, audit = bp.extract(source, did)
        bp.clamp_to_page(fields, audit["pageSizes"])
        nudged = bp.nudge_off_hint(background, fields)
        snapped, missed = bp.snap_checkboxes(background, fields)
        bp.assign_marks(background, fields)
        bp.stamp_shapes(background, fields)
        bp.snap_text_fields(background, fields)
        bp.expand_ruled_blocks(fields, background)
        bp.clear_printed_labels(background, fields)
        bp.merge_sliver_fields(background, fields)
        bp.size_amounts_to_dollar(background, fields)
        geometry = bp.check_geometry(fields, audit["pageSizes"])
        overlaps = bp.check_overlap(background, fields)
        bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % did))
        bp.write_mapping(os.path.join(OUT, "%s.json" % did), fields)

        audit.update(geometryProblems=geometry, overlapFlags=len(overlaps), overlapDetail=overlaps[:20])
        audits.append(audit)
        if geometry:
            failures.append((did, "geometry", geometry[:3]))
        rows.append({
            "title": "Form %s - %s" % (form_no, name),
            "shortTitle": "BC PC Form %s" % form_no,
            "footerText": manifest[did].get("footerText") or pfa,
            "status": "active",
            "fileName": "%s.pdf" % did,
            "docId": did,
            "province": "BC",
            "category": CATEGORY[form_no],
            "version": 1,
            "pageCount": pages,
            "_sortKey": (CATEGORY_ORDER.index(CATEGORY[form_no]), int(form_no)),
        })
        print("%-10s pages=%-3d fields=%-4d cb=%-4d sig-skipped=%-3d geom=%-2d overlap=%d"
              % (did, pages, audit["fields"], audit["checkboxes"], audit["signaturesSkipped"],
                 len(geometry), len(overlaps)))

    rows.sort(key=lambda r: r["_sortKey"])
    for row in rows:
        del row["_sortKey"]
    with open(os.path.join(OUT, "bc_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "bc_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    print("\ngeometry failures: %s" % (failures or "none"))
    print("total fields: %d across %d forms" % (sum(a["fields"] for a in audits), len(audits)))
    if promote and not failures:
        for row in rows:
            did = row["docId"]
            shutil.copy(os.path.join(OUT, "%s.pdf" % did), os.path.join(EXPORT, "%s.pdf" % did))
            shutil.copy(os.path.join(OUT, "%s.json" % did), os.path.join(EXPORT, "%s.json" % did))
        print("promoted %d templates into form-template-export/" % len(rows))


if __name__ == "__main__":
    main()

"""Re-run the geometry passes over the shipped BC templates, in place.

The detectors are what get corrected, not the field set, so this reads each
shipped background and rewrites only the four geometry keys. Nothing else in the
JSON is touched — no field is added, dropped or reordered — which is what makes
it safe to run against templates that already shipped, and it is checked rather
than assumed: a non-geometry difference aborts the write.

This exists because the XFA flatten the Supreme templates were cut from is no
longer staged, so a full rebuild is not available for them.

Writing also refreshes the form's QA render, the same overlay-on-background PDF
the full build produces — an in-place edit otherwise leaves the last build's
render on disk, showing geometry that is no longer what ships.

Run: python3 reapply_geometry.py [--write]
"""
import glob
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
QA = os.path.join(EXPORT, "_incoming_bc", "qa")


def reapply(path, write):
    doc_id = os.path.basename(path)[:-5]
    background = os.path.join(EXPORT, "%s.pdf" % doc_id)
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    before = json.dumps([{k: v for k, v in f.items()
                          if k not in ("x", "y", "width", "height")} for f in fields], sort_keys=True)
    # Start-to-end, not step-by-step: seating pulls a control back onto its mark
    # and the caption pass pushes it off again, so counting each step would
    # report churn on a run that settles exactly where it started.
    was = [(f["x"], f["y"], f["width"], f["height"]) for f in fields]

    doc = fitz.open(background)
    missed = 0
    for field in fields:
        if field["type"] != "CheckBox":
            continue
        page = doc[field["page"] - 1]
        box = fitz.Rect(field["x"], field["y"],
                        field["x"] + field["width"] / bp.SCALE,
                        field["y"] + field["height"] / bp.SCALE)
        mark = bp.printed_mark(page, box)
        if mark is None or mark.width < 3 or mark.height < 3:
            missed += 1
            continue
        centre = fitz.Point((mark.x0 + mark.x1) / 2, (mark.y0 + mark.y1) / 2)
        if not (box + (-12.0, -12.0, 12.0, 12.0)).contains(centre):
            missed += 1
            continue
        new = {"x": round(mark.x0, 2), "y": round(mark.y0, 2),
               "width": round(mark.width * bp.SCALE, 2),
               "height": round(mark.height * bp.SCALE, 2)}
        field.update(new)
    doc.close()
    bp.assign_marks(background, fields)
    bp.expand_ruled_blocks(fields, background)
    changed = sum(1 for old, f in zip(was, fields)
                  if old != (f["x"], f["y"], f["width"], f["height"]))

    after = json.dumps([{k: v for k, v in f.items()
                         if k not in ("x", "y", "width", "height")} for f in fields], sort_keys=True)
    if before != after:
        raise SystemExit("%s: a non-geometry key changed" % doc_id)
    if write and changed:
        bp.write_mapping(path, fields)
        os.makedirs(QA, exist_ok=True)
        bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    return changed, missed


def main():
    write = "--write" in sys.argv
    total = touched = 0
    for path in sorted(glob.glob(os.path.join(EXPORT, "BC*.json"))):
        changed, missed = reapply(path, write)
        total += changed
        touched += bool(changed)
        if changed or missed:
            print("%-12s changed=%-4d no-mark-found=%d" % (os.path.basename(path)[:-5], changed, missed))
    print("\n%d fields changed%s" % (total, "" if write else " (dry run, pass --write)"))
    if write:
        print("%d QA renders refreshed in %s" % (touched, QA))


if __name__ == "__main__":
    main()

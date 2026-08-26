"""Restore option squares that flattening erased, on templates already shipped.

    python3 repair_option_squares.py [--apply] [--province SK] [--only Form29]

`bc_pipeline.flatten_background` deletes the widget layer to make a background.
That is right wherever the printed square lives in the page content -- Ontario's
scans, BC's Provincial set, Newfoundland, New Brunswick -- and wrong wherever a
form draws its option squares in the **widget border and nothing else**, because
then the square goes with the widget and the filer is left with a caption beside
empty white space.

Nova Scotia's ISO batch is where this was found (172 squares across 16 of 18
forms). Sweeping the whole catalogue for checkboxes that cover no ink turned up
the same shape in two provinces that had already shipped:

| Province | Forms | Boxes |
| --- | --- | --- |
| Ontario | 44 | 615 |
| Saskatchewan | 17 | 221 |

This tool repairs those **without rebuilding them**. It re-flattens the source
with the option squares baked in and nothing else changed, then re-seats the
existing checkbox fields on the squares that are now printed. Text fields are
never touched, no field is added or removed, and a background whose squares were
already there is left exactly as it was.

Why not just re-run each province's builder: those templates have been reviewed,
and a full rebuild would re-derive every box from scratch, which is a much
larger change than the defect. A new batch should bake the whole widget layer at
build time (`acroform_seat.flatten_baked`) rather than repair afterwards.

The sweep that finds them is the same check `verify_*.py` runs -- a checkbox
covering no printed ink at all -- so a form listed here is a form its own
verifier would flag if the exemption lists were empty.
"""
import argparse
import json
import os
import shutil
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "bc-forms"))
sys.path.insert(0, HERE)

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp  # noqa: E402

EXPORT = os.path.join(os.path.dirname(HERE), "form-template-export")
SCALE = bp.SCALE

# Boxes the government declares where the page prints no square at all, checked
# by reading the page. These are not repairable and must not be reported as
# failures: a form can hang an option on a bare rule, a grid cell or a heading.
KNOWN_UNSQUARED = {("NBKB_72J", 13), ("NSISO_B", 1), ("NSISO_B", 2)}

# Whole templates whose options are printed as something other than a square.
# Saskatchewan's Form 15-47 is a checklist: the tick column is an **empty cell of
# a ruled table** and the cell's own borders are the box, so the control sits
# inside the rules and covers no ink by design. The form carries no widget layer
# at all (0 widgets in the source), so there is nothing to bake either.
UNSQUARED_FORMS = {"SKKB_15_47"}


def exempt(doc_id, page):
    return doc_id in UNSQUARED_FORMS or (doc_id, page) in KNOWN_UNSQUARED


# The verifiers call ink anything below 200 grey. That is too dark a test for
# this sweep: Ontario draws some of its option squares in a **pale grey** that
# reads about 220, so Forms 13C, 34G(1) and 34H came back "blank" with their
# squares plainly printed on the page. Repairing those changed nothing but the
# file's bytes. 235 still separates a drawn square from paper.
INK = 235


def covers_ink(page, field, pad=1.0):
    rect = fitz.Rect(field["x"] - pad, field["y"] - pad,
                     field["x"] + field["width"] / SCALE + pad,
                     field["y"] + field["height"] / SCALE + pad)
    pix = page.get_pixmap(clip=rect, colorspace=fitz.csGRAY, dpi=150)
    return any(byte < INK for byte in pix.samples)


def blank_checkboxes(pdf_path, fields):
    """The checkbox fields covering no printed ink on this background."""
    document = fitz.open(pdf_path)
    try:
        return [f for f in fields
                if f["type"] == "CheckBox"
                and not covers_ink(document[f["page"] - 1], f)]
    finally:
        document.close()


def find_source(doc_id):
    """The staged government file this template was built from, if it is here."""
    for name in sorted(os.listdir(EXPORT)):
        if not name.startswith("_incoming"):
            continue
        candidate = os.path.join(EXPORT, name, "%s_source.pdf" % doc_id)
        if os.path.exists(candidate):
            return candidate
    return None


def repair(doc_id, apply_changes):
    """Returns (before, after, note) -- how many blank boxes, and what happened."""
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(mapping_path))
    fields = mapping["staticFields"]

    blank = [f for f in blank_checkboxes(pdf, fields)
             if not exempt(doc_id, f["page"])]
    if not blank:
        return 0, 0, "clean"

    source = find_source(doc_id)
    if source is None:
        return len(blank), len(blank), "no staged source -- cannot repair"

    scratch = os.path.join(EXPORT, "_repair_%s.pdf" % doc_id)
    try:
        A.flatten_baked(source, scratch, only_buttons=True)
        if fitz.open(scratch).page_count != fitz.open(pdf).page_count:
            return len(blank), len(blank), "page count differs -- left alone"

        # Re-seat on the squares that are now printed. Only checkbox geometry
        # can move; every text field keeps the position it was reviewed at.
        moved = A.seat_checkboxes(fields, scratch)
        after = [f for f in blank_checkboxes(scratch, fields)
                 if not exempt(doc_id, f["page"])]
        note = "seated %d" % moved
        if len(after) >= len(blank):
            # Nothing gained. Leave the shipped file alone rather than rewrite
            # its bytes for no visible change -- and never make it worse:
            # Manitoba's protection-order forms come back with *more* blank
            # boxes after re-seating, which is a different defect from this one.
            return len(blank), len(after), note + " -- no gain, left alone"
        if apply_changes:
            shutil.move(scratch, pdf)
            with open(mapping_path, "w") as fh:
                json.dump(mapping, fh, indent=1)
        return len(blank), len(after), note
    finally:
        if os.path.exists(scratch):
            os.remove(scratch)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--province", action="append", default=[])
    parser.add_argument("--only", action="append", default=[])
    args = parser.parse_args()

    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    rows = [r for r in catalog
            if (not args.province or r.get("province") in args.province)
            and (not args.only or r["docId"] in args.only)]

    repaired = fixed_boxes = still = 0
    for row in rows:
        before, after, note = repair(row["docId"], args.apply)
        if not before:
            continue
        if after < before:
            repaired += 1
            fixed_boxes += before - after
        still += after
        print("%-4s %-20s %3d blank -> %3d  (%s)"
              % (row.get("province"), row["docId"], before, after, note))

    print("\n%s %d boxes across %d templates; %d still blank"
          % ("repaired" if args.apply else "would repair",
             fixed_boxes, repaired, still))
    if not args.apply:
        print("(dry run -- pass --apply to write)")


if __name__ == "__main__":
    main()

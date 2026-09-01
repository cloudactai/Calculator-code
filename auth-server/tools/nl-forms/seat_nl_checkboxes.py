"""Reseat NL checkbox overlays onto the printed square/glyph beneath them.

    python3 seat_nl_checkboxes.py [--only DOCID] [--check]

Finding: the NLEPO (Emergency Protection Order) batch's option widgets are
government AcroForm rectangles taken from the source PDF unmodified -- unlike
the Supreme Court (NLSC) batch, whose build runs a `seat_checkboxes` refinement
pass (`auth-server/tools/README` documents "1,552 options seated"). NLEPO does
call `acroform_seat.seat_checkboxes` from `build_nl_pc_forms.py`, but the
checkbox in NLEPO_002 p2 (and, on inspection, others sharing its glyph) still
sits at the raw widget position: x/y exactly match the printed "□"
character's *font bounding box* top-left, not the visible ink, which for this
glyph sits low in its own 16pt-tall box. The overlay therefore only grazes the
bottom ~1pt of the printed square instead of sitting on it. Confirmed with a
pixel-darkness scan (ink y=117.25-124.5 vs field y=108.7-118.3 before the fix)
and, independently, by calling the exact same `bc_pipeline.printed_mark`
function the build already trusts -- it correctly finds the ink
(Rect(71.7, 117.4, 79.1, 124.7)), proving the refinement pass never actually
ran against this field (or this whole batch), not that the detector fails.

`verify_nl.py`'s "checkboxes sit on printed ink" check only rejects a box that
covers *zero* ink at all, so a checkbox that clips just the bottom edge of its
square -- exactly this defect -- passes it silently. That's why this needed a
rendered, eyeballed page to catch, per the project's own "render and look"
rule; it was not visible in verifier output.

This script re-runs `printed_mark` (the identical function `seat_checkboxes`
uses at build time -- not a reimplementation) against every remaining NL
CheckBox field and snaps any that don't already sit tightly on their mark.
Only x/y/width/height are touched. A field whose mark can't be found (a
genuine option with no printed square of its own) is left exactly where it
is, same as the build-time pass does -- that is a real state, not a gap.

--check prints every field that would move (docId, page, old vs new rect,
shift in points) without writing. No flag applies and rewrites the JSON.
Idempotent: a second run finds nothing left to move.
"""
import argparse
import glob
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
sys.path.insert(0, HERE)

import bc_pipeline as bp  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
SCALE = 1.5

# Byte-identical guard: every key that must survive this script untouched.
FROZEN = ("id", "type", "value", "fontSize", "color", "background", "border",
          "page", "bind")


def nl_docs(only=None):
    docs = []
    for path in sorted(glob.glob(os.path.join(EXPORT, "NL*.json"))):
        doc_id = os.path.splitext(os.path.basename(path))[0]
        if only and doc_id != only:
            continue
        pdf = os.path.join(EXPORT, doc_id + ".pdf")
        if not os.path.exists(pdf):
            continue
        docs.append((doc_id, path, pdf))
    return docs


def process(doc_id, json_path, pdf_path, check):
    with open(json_path) as fh:
        data = json.load(fh)
    fields = data["staticFields"]

    doc = fitz.open(pdf_path)
    moves = []
    try:
        for field in fields:
            if field["type"] != "CheckBox":
                continue
            page = doc[field["page"] - 1]
            before = {k: field.get(k) for k in FROZEN}
            rect = fitz.Rect(field["x"], field["y"],
                              field["x"] + field["width"] / SCALE,
                              field["y"] + field["height"] / SCALE)
            mark = bp.printed_mark(page, rect)
            if not mark:
                continue
            if (abs(mark.x0 - rect.x0) < 0.2 and abs(mark.y0 - rect.y0) < 0.2
                    and abs(mark.width - rect.width) < 0.2
                    and abs(mark.height - rect.height) < 0.2):
                continue
            new_x, new_y = round(mark.x0, 2), round(mark.y0, 2)
            new_w = round(mark.width * SCALE, 2)
            new_h = round(mark.height * SCALE, 2)
            shift = ((new_x - field["x"]) ** 2 + (new_y - field["y"]) ** 2) ** 0.5
            moves.append((field["id"], field["page"], rect,
                          fitz.Rect(new_x, new_y, new_x + new_w / SCALE,
                                    new_y + new_h / SCALE), shift))
            if not check:
                field["x"], field["y"] = new_x, new_y
                field["width"], field["height"] = new_w, new_h
                after = {k: field.get(k) for k in FROZEN}
                assert before == after, f"{doc_id} field {field['id']} non-geometry key changed"
    finally:
        doc.close()

    if moves:
        print(f"{doc_id}: {len(moves)} checkbox(es) {'would move' if check else 'moved'}")
        for fid, pg, old, new, shift in moves:
            print(f"    id={fid} p{pg} {old} -> {new}  (shift {shift:.1f}pt)")

    if not check and moves:
        with open(json_path, "w") as fh:
            json.dump(data, fh, indent=2)
            fh.write("\n")

    return len(moves)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="limit to a single docId")
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    total = 0
    docs = nl_docs(args.only)
    if not docs:
        print("no matching NL templates found", file=sys.stderr)
        sys.exit(1)
    for doc_id, json_path, pdf_path in docs:
        total += process(doc_id, json_path, pdf_path, args.check)

    verb = "would move" if args.check else "moved"
    print(f"\nTotal: {total} checkbox(es) {verb} across {len(docs)} template(s).")


if __name__ == "__main__":
    main()

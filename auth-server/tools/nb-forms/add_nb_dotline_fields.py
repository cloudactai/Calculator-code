"""Add TextFields to the two NBKB forms that never got any.

`build_nb_forms.py` runs the AcroForm-extraction path for the 29 widget-bearing
forms, and the printed-anchor (dot-leader) path is reserved for the regulation
batch in `build_nb_reg_forms.py`. Two rule forms fell between them: NBKB_7A and
NBKB_72FF carry no AcroForm widgets *and* were never run through the dot-leader
builder, so they shipped with zero fields. The nb-forms README explains the
zero as "no printed blank anywhere on the page" -- true for 72M, 72N and 72O
(issued by the court/registrar, not the filer), but not true for these two:
both print the same spaced-dot vocabulary `nb_reg_anchors.leader_boxes()`
already knows how to read, measured directly off the shipped PDF:

    7A    "TO: ........", "DATED at ... , this ... day of ... , 19 ....",
          "Name of solicitor for plaintiff (or applicant): ....",
          "Name of Firm (if applicable): ....", "Business address: ....",
          "Name of plaintiff (or applicant): ....",
          "Address for service within New Brunswick: ...." (wraps to 2 lines)
    72FF  "I, ........, solicitor for the petitioner ...",
          "DATED at ........, N.B., this ... day of ........, 19 ...."

Two leaders on each form stay unboxed, on the same rule
`drop_nb_judge_signature.py` applies to the FSA orders: a signature rule never
gets a box. 72FF's last leader is captioned "solicitor for petitioner (or as
may be)" directly beneath it; 7A's leader at y=443 is captioned "Solicitor for
plaintiff (or applicant)" / "Avocat du demandeur (ou du requérant)" beneath it
on both columns. Excluded by an explicit caption check, not by omission.

7A prints its content twice, English left / French right (the Rules of Court
require the option, Rule 7 s.85-5). Only the English column gets fields here:
this catalogue's labels, binds and app UI are English throughout, and a filer
who completes the English column and prints leaves the French column blank on
the page exactly as a monolingual filer already would by hand -- that is not a
defect on a bilingual form, it is the normal case. The column boundary is a
plain x-split at 310pt: every English leader's right edge measures 305.4-
305.5pt and every French leader's left edge measures 328.4pt or more, so
nothing on the page sits in between.

Targets are found by re-running the detector, not hand-typed, so a change to
the source PDF is caught rather than silently mismatched -- but the *count* is
asserted against what this docstring says was measured, so a detector change
stops the script instead of silently boxing something new.

Usage:
    python3 add_nb_dotline_fields.py --check     # dry run (default action)
    python3 add_nb_dotline_fields.py              # apply
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, TOOLS)
sys.path.insert(0, HERE)

import fitz  # noqa: E402

import bc_pipeline as bp  # noqa: E402
import nb_reg_anchors as anchors  # noqa: E402
from build_nb_reg_forms import fit_to_line  # noqa: E402

EXPORT = os.path.abspath(os.path.join(TOOLS, "..", "form-template-export"))

# Caption text that marks a leader as a signature rule, not a data blank.
SIGNATURE_CAPTIONS = ("solicitor for petitioner", "solicitor for plaintiff",
                      "avocat du demandeur")

ENGLISH_MAX_X = 310.0

# docId -> expected number of fields once signature leaders and (for 7A) the
# French column are excluded. Asserted so a source-PDF change stops the script
# rather than silently boxing something new.
EXPECTED = {"NBKB_7A": 11, "NBKB_72FF": 4}


def caption_below(page, rect):
    clip = fitz.Rect(rect.x0 - 5, rect.y1 + 0.5, rect.x1 + 40, rect.y1 + 14)
    return page.get_text("text", clip=clip).strip().lower()


def is_signature_leader(page, rect):
    text = caption_below(page, rect)
    return any(needle in text for needle in SIGNATURE_CAPTIONS)


def targets_for(doc_id, page):
    words = page.get_text("words")
    out = []
    for rect in anchors.leader_boxes(page):
        if is_signature_leader(page, rect):
            continue
        if doc_id == "NBKB_7A" and rect.x0 >= ENGLISH_MAX_X:
            continue
        top, height = fit_to_line(rect, words)
        out.append((rect, top, height))
    return out


def build_fields(doc_id, existing_ids):
    path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    doc = fitz.open(path)
    try:
        assert doc.page_count == 1, "%s: expected 1 page" % doc_id
        page = doc[0]
        found = targets_for(doc_id, page)
    finally:
        doc.close()

    if len(found) != EXPECTED[doc_id]:
        sys.exit("%s: detector found %d leaders to box, expected %d -- "
                 "refusing to guess (source PDF may have changed)"
                 % (doc_id, len(found), EXPECTED[doc_id]))

    fields = []
    index = 1
    for rect, top, height in sorted(found, key=lambda t: (t[0].y0, t[0].x0)):
        while bp.new_id(doc_id, index) in existing_ids:
            index += 1
        fields.append({
            "id": bp.new_id(doc_id, index),
            "type": "TextField",
            "x": round(rect.x0, 2),
            "y": round(top, 2),
            "width": round(rect.width * bp.SCALE, 2),
            "height": round(height * bp.SCALE, 2),
            "value": "",
            "fontSize": 9,
            "color": [0, 0, 0],
            "background": "none",
            "border": "none",
            "page": 1,
        })
        index += 1
    return fields


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="dry run: print what would change, write nothing")
    args = parser.parse_args()

    for doc_id in sorted(EXPECTED):
        json_path = os.path.join(EXPORT, "%s.json" % doc_id)
        mapping = json.load(open(json_path))
        existing = mapping["staticFields"]
        if existing:
            print("%s: already has %d field(s) (no-op)" % (doc_id, len(existing)))
            continue
        existing_ids = {f["id"] for f in existing}
        new_fields = build_fields(doc_id, existing_ids)

        # Overlap sanity check: no two new fields may collide.
        for i, a in enumerate(new_fields):
            ra = fitz.Rect(a["x"], a["y"], a["x"] + a["width"] / bp.SCALE,
                           a["y"] + a["height"] / bp.SCALE)
            for b in new_fields[i + 1:]:
                rb = fitz.Rect(b["x"], b["y"], b["x"] + b["width"] / bp.SCALE,
                               b["y"] + b["height"] / bp.SCALE)
                if ra.intersects(rb):
                    sys.exit("%s: new fields %s and %s overlap -- refusing"
                             % (doc_id, a["id"], b["id"]))

        print("%s: %d field(s) to add" % (doc_id, len(new_fields)))
        for f in new_fields:
            print("  id=%-14s p%d x=%.1f y=%.1f w=%.1f h=%.1f"
                  % (f["id"], f["page"], f["x"], f["y"],
                     f["width"] / bp.SCALE, f["height"] / bp.SCALE))

        if not args.check:
            mapping["staticFields"] = existing + new_fields
            with open(json_path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")
            print("  written")


if __name__ == "__main__":
    main()

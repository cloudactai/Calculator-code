"""Widen NLPC_AF002 p2's "Print adult's name" box to the rule it sits on.

    python3 fix_nlpc_af002_name_width.py [--check]

Finding (session 4, NLPC page-by-page pass). A scan of every NLPC field that
sits on a printed underscore run, comparing the field's right edge against the
run's, turned up exactly one field that stops materially short of its blank:

    NLPC_AF002 p2  id 1750630925020  ("Print adult's name")
        printed rule   x 306.00 - 515.98   (baseline 310.50, 33 underscores)
        shipped field  x 306.55 - 456.55   -- ends 59.4pt before the rule does

Every other NLPC field on a run reaches within 18pt of its rule's end, so this
is a single outlier rather than a house style. On the rendered page the printed
underscores visibly continue past the right edge of the box, which reads as a
blank the box does not cover; a full adult name is also a poor fit in 150pt.

The fix moves the right edge out to the end of the printed rule and touches
nothing else: `x`, `y` and `height` are unchanged, only `width`. The rule's
extent is measured fresh from the shipped PDF on every run, so the script is
idempotent -- once the right edge is within RIGHT_TOL of the rule's end there
is nothing left to change.

Note the stored width is PDF points times SCALE (1.5). The measured rule length
is a true PDF-point value and must be multiplied before it is stored; see
FORM_FIXING_GUIDE.md, and NL_NB_AUDIT_LEDGER.md's "Session 3 CORRECTION" for
what forgetting it costs.
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

import bc_pipeline as bp  # noqa: E402

SCALE = bp.SCALE
DOC_ID = "NLPC_AF002"
PAGE = 2
FIELD_ID = 1750630925020
CAPTION = "Print adult’s name"
RIGHT_TOL = 2.0     # already reaching this close to the rule's end = nothing to do
FROZEN = ("id", "type", "value", "fontSize", "color", "background",
          "border", "page", "bind")


def rule_under(page, caption):
    """The underscore run immediately above `caption`, as (x0, x1, baseline)."""
    hits = page.search_for(caption)
    if len(hits) != 1:
        raise SystemExit("expected exactly one %r on p%d, found %d"
                         % (caption, PAGE, len(hits)))
    cap = hits[0]
    best = None
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                base = span["origin"][1]
                if not (cap.y0 - 20 < base <= cap.y0 + 1):
                    continue
                runs, cur = [], []
                for ch in span["chars"]:
                    if ch["c"] == "_":
                        cur.append(ch)
                    else:
                        if len(cur) >= 6:
                            runs.append(cur)
                        cur = []
                if len(cur) >= 6:
                    runs.append(cur)
                for run in runs:
                    x0 = min(c["bbox"][0] for c in run)
                    x1 = max(c["bbox"][2] for c in run)
                    if x1 < cap.x0 - 4 or x0 > cap.x1 + 4:
                        continue     # a run in some other column
                    if best is None or base > best[2]:
                        best = (x0, x1, base)
    if best is None:
        raise SystemExit("no underscore run found above %r" % caption)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    json_path = os.path.join(EXPORT, DOC_ID + ".json")
    data = json.load(open(json_path))
    fields = data["staticFields"]
    field = next((f for f in fields if f["id"] == FIELD_ID), None)
    if field is None:
        raise SystemExit("%s: field %s not found" % (DOC_ID, FIELD_ID))
    frozen_before = {k: field.get(k) for k in FROZEN}

    doc = fitz.open(os.path.join(EXPORT, DOC_ID + ".pdf"))
    x0, x1, base = rule_under(doc[PAGE - 1], CAPTION)
    doc.close()

    right = field["x"] + field["width"] / SCALE
    print("%s p%d id=%s  rule x=%.2f-%.2f (baseline %.2f)"
          % (DOC_ID, PAGE, FIELD_ID, x0, x1, base))
    print("    field right edge %.2f, rule ends %.2f -> %.2f short"
          % (right, x1, x1 - right))

    if x1 - right <= RIGHT_TOL:
        print("\nNothing to change.")
        return

    new_width = round((x1 - field["x"]) * SCALE, 2)
    print("    width %.2f -> %.2f  (x, y and height unchanged)"
          % (field["width"], new_width))

    if not args.check:
        field["width"] = new_width
        assert {k: field.get(k) for k in FROZEN} == frozen_before, \
            "only width may change"
        indent = 2 if open(json_path).read(4).startswith('{\n  "') else 1
        with open(json_path, "w") as fh:
            json.dump(data, fh, indent=indent)
            fh.write("\n")

    print("\n1 field %s." % ("would be widened" if args.check else "widened"))


if __name__ == "__main__":
    main()

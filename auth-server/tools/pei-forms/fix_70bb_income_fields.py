"""Seat Form 70BB's income-chart fields on the printed line, not above it.

`repair_pei_background.py`'s `reflow_70bb_income_chart()` rebuilt the printed
table (commit "Rebuild PEI 70BB income chart") but got two things wrong:

1. The two "20__" year fields sat at x=406, well right of where "20__"
   actually prints (x=392.9..403.9 -- PyMuPDF rawdict, page index 1) --
   floating in blank paper past the end of the row.

2. Every one of the six income fields' y was computed as if `height` were
   real PDF points. It is not: per `cloudact-ui/src/pages/formPages/
   textFieldGeometry.js`, a TextField's `width`/`height` are stored already
   multiplied by `PDF_FIELD_SCALE = 1.5`, while `x`/`y` stay in raw points.
   So a field's real on-page height is `height / 1.5`, and its real bottom
   edge is `y + height / 1.5` -- not `y + height`. Every one of these six
   fields had its bottom edge computed 1/3 of its own height too high,
   which is why each one rendered floating above the rule or underscores
   it was meant to sit on instead of touching them.

This script sets each field's `y` from its real target bottom edge (the
printed employer rule, or the text baseline the "$"/"20__" sit on) minus its
real height, and fixes the two year fields' `x`/`width` to actually cover
"20__"'s underscores (also correcting `width` for the same 1.5x convention).

It also removes "rule": "bottom" from the year and employer fields, which
already sit on printed ink (the employer rule, the "__" underscores) -- the
app's own rule there draws a second line on top of the first. The two amount
fields don't sit on any printed ink (the "$ ___ per year" gap is blank), so
they keep "rule": "bottom" for a visible writing line.

    python3 fix_70bb_income_fields.py --check
    python3 fix_70bb_income_fields.py
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
MAPPING_PATH = os.path.join(EXPORT, "PEISC_70BB.json")

# Target state for each of the six income fields. `x`/`y` are raw PDF points;
# `width`/`height` are pre-multiplied by PDF_FIELD_SCALE (1.5) per
# textFieldGeometry.js. `y` is picked so that `y + height / 1.5` (the box's
# real bottom edge) lands on the printed rule or text baseline it belongs on:
#   - amount fields: baseline of "$ ... per year for the year 20__" (574.39 /
#     592.39, PyMuPDF rawdict span bottoms)
#   - year fields: same baseline, over the "20__" underscores (x=392.9..403.9)
#   - employer fields: the printed employer rule (y=608.5 / 626.5)
FIELD_GEOMETRY = {
    1750127377063: {"x": 242.0, "y": 564.39, "width": 41.0, "height": 15.0,
                     "rule": "bottom", "compact": True},   # amount, Moving
    1750127377066: {"x": 242.0, "y": 582.39, "width": 41.0, "height": 15.0,
                     "rule": "bottom", "compact": True},   # amount, Responding
    1750127377139: {"x": 390.0, "y": 564.39, "width": 23.0, "height": 15.0,
                     "rule": None, "compact": None},       # year, Moving
    1750127377140: {"x": 390.0, "y": 582.39, "width": 23.0, "height": 15.0,
                     "rule": None, "compact": None},       # year, Responding
    1750127377141: {"x": 287.0, "y": 598.5, "width": 220.0, "height": 15.0,
                     "rule": None, "compact": None},       # employer, Moving
    1750127377142: {"x": 287.0, "y": 616.5, "width": 220.0, "height": 15.0,
                     "rule": None, "compact": None},       # employer, Responding
}

GEOMETRY_KEYS = ("x", "y", "width", "height")


def repair(apply_changes):
    with open(MAPPING_PATH) as handle:
        mapping = json.load(handle)

    changes = []
    for field in mapping["staticFields"]:
        fid = field.get("id")
        target = FIELD_GEOMETRY.get(fid)
        if target is None:
            continue

        for key in GEOMETRY_KEYS:
            if field.get(key) != target[key]:
                changes.append("field %s: %s %s->%s" % (fid, key, field.get(key), target[key]))
                if apply_changes:
                    field[key] = target[key]

        for key in ("rule", "compact"):
            want = target[key]
            have = field.get(key)
            if want is None and key in field:
                changes.append("field %s: drop %s" % (fid, key))
                if apply_changes:
                    field.pop(key, None)
            elif want is not None and have != want:
                changes.append("field %s: %s %s->%s" % (fid, key, have, want))
                if apply_changes:
                    field[key] = want

    if not changes:
        print("nothing to change")
        return

    for change in changes:
        print(("would change: " if not apply_changes else "changed: ") + change)

    if apply_changes:
        with open(MAPPING_PATH, "w") as handle:
            json.dump(mapping, handle, indent=2)
            handle.write("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repair(apply_changes=not args.check)


if __name__ == "__main__":
    main()

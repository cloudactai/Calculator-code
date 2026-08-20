"""Drop every writing box in the new Manitoba families onto its printed rule.

`RULE_CLEARANCE` seats a box's bottom edge *above* the rule it belongs to, by a
distance derived from where the underscore's ink sits inside its character box.
The viewer draws its own bordered control inside the rectangle we store, so that
clearance reads on screen as a control hovering above its line, with the printed
rule showing as a second line beneath it. Measured over every text box of the
four families, not one of the 1,427 was on its line:

    MBAD    562 boxes   median float 1.00pt
    MBCA     68 boxes   median float 1.29pt
    MBCFS   649 boxes   median float 1.29pt
    MBFA    148 boxes   median float 1.50pt

**Why this measures each box instead of nudging them all by one constant.**
Saskatchewan's two families each floated by a single value -- 0.75pt and 0.69pt,
identical across every box in the family -- so `sk-forms/build_sk_forms.py` seats
them with one constant per family and that is exactly equivalent to measuring.
Manitoba does not behave that way. Within one family the float ranges 1.25-1.62pt
(MBCFS) and 0.95-2.40pt (MBAD), because Manitoba draws its blanks two different
ways -- as underscore runs *and* as line-art segments -- and mixes font sizes on
one page. A constant would seat the bulk and leave the rest floating, which is
the defect it was meant to fix. Reading each box's own rule off the rendered page
self-corrects for both.

**Why this repairs in place instead of rebuilding.** `build_mb_forms.py`'s guide
§1 and its own `hand_finished()` guard: never rebuild a form that already carries
binds or hand-placed fields, because `--promote` is an `os.replace` and destroys
them. Every one of these forms is promoted and bound. So this writes back the
`y` key alone, asserting every other key is byte-identical first, the way
`rebind_mb_forms.py` writes back only `bind`.

Idempotent: a box already seated measures a zero shift and is left alone.

    python3 seat_mb_on_rules.py --check     # report, write nothing
    python3 seat_mb_on_rules.py             # apply
"""
import argparse
import collections
import glob
import json
import os
import statistics
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))

import build_mb_forms as B  # noqa: E402

EXPORT = B.EXPORT
SCALE = B.SCALE

# Rule 70 (MBKB_) is reviewed and shipped and is not to move; these are the four
# families added with the child-protection and adoption batch.
FAMILIES = ("MBCFS_", "MBCA_", "MBAD_", "MBFA_")

# Render zoom for finding the rule. 24x resolves a 0.6pt rule into ~14 rows, which
# is enough to place its middle to better than a tenth of a point.
ZOOM = 24.0
# A rule is darker than this and runs across most of what we sample.
INK_BELOW = 160
COVERAGE = 0.6
# Where to look for the rule, relative to the box's bottom edge. A box already
# seated has its rule straddling 0, so the window has to open slightly above.
LOOK_UP, LOOK_DOWN = 1.6, 4.0
# Sample the box's own width, inset past its left edge so the caption a blank is
# set hard against cannot be read as the rule.
SAMPLE_INSET, SAMPLE_MAX = 3.0, 80.0
SAMPLE_MIN = 8.0
# Refuse to move a box further than this: past it, whatever was found is not this
# box's rule and the box is better left where the builder put it.
MAX_SHIFT = 3.0
# Smaller than this is the measurement's own noise, not a move worth making.
DEAD_ZONE = 0.06


def rule_under(page, field):
    """(top, bottom) of the printed rule under this box, in points, or None."""
    left = field["x"]
    right = left + field["width"] / SCALE
    bottom = field["y"] + field["height"] / SCALE
    x0 = left + SAMPLE_INSET
    x1 = min(right - 1.0, x0 + SAMPLE_MAX)
    if x1 - x0 < SAMPLE_MIN:
        return None
    clip = fitz.Rect(x0, bottom - LOOK_UP, x1, bottom + LOOK_DOWN)
    clip &= page.rect
    if clip.is_empty or clip.height <= 0:
        return None
    pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), clip=clip,
                          colorspace=fitz.csGRAY)
    dark = []
    for y in range(pix.height):
        hits = sum(1 for x in range(pix.width) if pix.pixel(x, y)[0] < INK_BELOW)
        dark.append(hits >= pix.width * COVERAGE)
    runs, start = [], None
    for y, is_dark in enumerate(dark):
        if is_dark and start is None:
            start = y
        elif not is_dark and start is not None:
            runs.append((start, y))
            start = None
    if start is not None:
        runs.append((start, pix.height))
    if not runs:
        return None
    first, last = runs[0]
    return clip.y0 + first / ZOOM, clip.y0 + last / ZOOM


def shifts_for(doc_id):
    """{field id: new y} for every box that is off its rule."""
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    fields = json.load(open(path))["staticFields"]
    doc = fitz.open(pdf)
    moves, deltas = {}, []
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        page = doc[field["page"] - 1]
        found = rule_under(page, field)
        if found is None:
            continue
        top, low = found
        bottom = field["y"] + field["height"] / SCALE
        delta = (top + low) / 2.0 - bottom
        if abs(delta) < DEAD_ZONE or abs(delta) > MAX_SHIFT:
            continue
        moves[field["id"]] = round(field["y"] + delta, 2)
        deltas.append(delta)
    doc.close()
    return moves, deltas


def apply(doc_id, moves):
    """Write back the `y` key alone, asserting nothing else moved."""
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    before = {f["id"]: dict(f) for f in mapping["staticFields"]}
    for field in mapping["staticFields"]:
        if field["id"] in moves:
            field["y"] = moves[field["id"]]
    for field in mapping["staticFields"]:
        was = before[field["id"]]
        for key in was:
            if key == "y":
                continue
            assert was[key] == field[key], "%s %s: %s changed" % (doc_id, field["id"], key)
    with open(path, "w") as fh:
        json.dump(mapping, fh, indent=2)
        fh.write("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="report without writing")
    args = parser.parse_args()

    ids = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(EXPORT, "MB*.json"))
                 if " " not in os.path.basename(p)
                 and os.path.basename(p).startswith(FAMILIES))
    per_family = collections.defaultdict(list)
    total = 0
    for doc_id in ids:
        moves, deltas = shifts_for(doc_id)
        total += len(moves)
        per_family[doc_id.split("_")[0]].extend(deltas)
        if moves and not args.check:
            apply(doc_id, moves)
        print("%-13s seated=%-4d %s"
              % (doc_id, len(moves),
                 "median %+.2fpt" % statistics.median(deltas) if deltas else ""))
    print("\n%d boxes %s." % (total, "would move" if args.check else "seated on their rules"))
    for family in sorted(per_family):
        d = per_family[family]
        if d:
            print("  %-7s n=%-4d median %+.2fpt  range %+.2f..%+.2f"
                  % (family, len(d), statistics.median(d), min(d), max(d)))


if __name__ == "__main__":
    main()

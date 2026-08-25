"""Drop every writing box in the Saskatchewan and Manitoba sets onto its rule.

The builders seat a box's bottom edge *above* the rule it belongs to, by a
clearance derived from where an underscore's ink sits inside its character box.
The viewer then draws its own bordered control inside the rectangle we store, so
that clearance reads on screen as a control hovering above its line, with the
printed rule showing as a second line beneath it -- the float visible on
SKPD_PD5_C's "I, ______, am a solicitor".

This is the Manitoba tool (`mb-forms/seat_mb_on_rules.py`, moved here) with its
family list opened up to both provinces, because the float is not a Manitoba
property: it is what `RULE_CLEARANCE` and its Saskatchewan equivalent do, and
every family that has printed rules has it.

**Why this measures each box instead of nudging them all by one constant.**
Saskatchewan's SKCFS_ and SKAD_ families each floated by a single value, which is
why `build_sk_forms.py` seats those two with one constant apiece (`RULE_NUDGE`)
and that is exactly equivalent to measuring. The rest do not behave that way.
Within one family the float ranges 1.25-1.62pt (MBCFS) and 0.95-2.40pt (MBAD),
because Manitoba draws its blanks two different ways -- as underscore runs *and*
as line-art segments -- and mixes font sizes on one page; Saskatchewan's practice
directives are Word documents that do the same. A constant would seat the bulk
and leave the rest floating, which is the defect it was meant to fix. Reading
each box's own rule off the rendered page self-corrects for both.

**What it will not touch.** A box is moved only when a printed rule is actually
found in a 5.6pt window around its bottom edge, and then by at most MAX_SHIFT.
A box over blank paper -- every TextArea in a writing area, every box in a Word
template with no rules at all -- measures nothing and is left exactly where the
builder put it. On top of that, every rectangle either builder's `MANUAL_FIELDS`
places by hand is skipped outright: those coordinates were read off the page by
a person and record a decision, so an automatic seating pass does not get to
second-guess them (SKPD_PD4_A's "Conditions to attach:" is seated on the bottom
border of its own ruled cell, and centring it on that border would push the
control through it). Checkboxes are skipped too -- they sit on a printed square,
which the seating would walk them off. And a move that would bury a box in its
neighbour is refused outright, by `verify_mb.py`'s own `box-overlap` test run
before the move: correcting a float must not change which controls the page has.

**Why this repairs in place instead of rebuilding.** `build_mb_forms.py`'s guide
§1 and its own `hand_finished()` guard: never rebuild a form that already carries
binds or hand-placed fields, because `--promote` is an `os.replace` and destroys
them. Every one of these forms is promoted and bound. So this writes back the
`y` key alone, asserting every other key is byte-identical first, the way
`rebind_mb_forms.py` writes back only `bind`.

Convergent, and idempotent once converged: a box already seated measures its edge
inside the ink and is left alone. Over the 263 templates the second pass found
one box left to move, on MBISO_I, whose choice of rule changed once the boxes
around it had been seated; the third found none. Run it until it reports zero.

Named apart from `bc-forms/seat_on_rules.py`, which is the Ontario tool this one
grew out of: two files with one basename shadow each other on `sys.path` the
moment anything imports both trees, which is exactly what `one_line_boxes.py`
does.

    python3 seat_boxes_on_rules.py --check          # report, write nothing
    python3 seat_boxes_on_rules.py --family SKPD_   # one family
    python3 seat_boxes_on_rules.py                  # apply, both provinces
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
TOOLS = os.path.dirname(HERE)
for _dir in ("bc-forms", "sk-forms", "mb-forms"):
    sys.path.insert(0, os.path.join(TOOLS, _dir))

import bc_pipeline as bp  # noqa: E402
import build_sk_forms as SK  # noqa: E402
import build_mb_forms as MB  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
SCALE = bp.SCALE

# Every Saskatchewan and Manitoba family in the export. Both provinces' whole
# sets, deliberately: the earlier passes excluded Part 15 (SKKB_) and Rule 70
# (MBKB_) as "reviewed and shipped, and this is a seating preference rather than
# a defect". It is the same float on the same kind of rule, and a set where half
# the families sit on their lines and half hover above them reads worse than
# either alone, so they are in.
PROVINCES = ("SK", "MB")

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
# Smaller than this is the measurement's own noise, not a move worth making --
# and the noise floor is not a constant. A move is skipped when the box's bottom
# edge is already **inside the printed ink**, which is what "on its line" means
# and what the whole pass is for; a 0.72pt rule is centred to within 0.36pt by
# definition. A flat 0.06 floor instead chased the raster: at 24x one pixel row
# is 0.042pt, shifting the box shifts the clip window, and the ISO forms sat
# there oscillating by a tenth of a point a pass without ever converging.
DEAD_ZONE = 0.06
# A move that would bury a box this far into a neighbour is refused. Same share
# `verify_mb.py`'s own `box-overlap` check uses, so the pass cannot introduce a
# finding the verifier will then report.
OVERLAP_SHARE = 0.25
# How closely a field has to match a MANUAL_FIELDS rectangle to count as that
# hand-placed field. Generous on `y` because `nudge_onto_rules` has already
# moved SKCFS_ and SKAD_ manual entries by a constant; the left edge, width and
# height are what identify the box.
MANUAL_TOL, MANUAL_Y_TOL = 0.6, 3.0


def manual_boxes():
    """{doc_id: [(page, x0, x1, height), ...]} from both builders."""
    out = collections.defaultdict(list)
    for module in (SK, MB):
        for doc_id, entries in getattr(module, "MANUAL_FIELDS", {}).items():
            for page, rect, _kind in entries:
                out[doc_id].append((page, rect.x0, rect.x1, rect.height))
    return out


MANUAL = manual_boxes()


def is_manual(doc_id, field):
    """Was this field placed by hand in a builder's MANUAL_FIELDS?"""
    right = field["x"] + field["width"] / SCALE
    height = field["height"] / SCALE
    return any(page == field["page"]
               and abs(x0 - field["x"]) <= MANUAL_TOL
               and abs(x1 - right) <= MANUAL_TOL
               and abs(tall - height) <= MANUAL_Y_TOL
               for page, x0, x1, tall in MANUAL.get(doc_id, ()))


def rule_under(page, field, anchor=None):
    """(top, bottom) of the printed rule under this box, in points, or None.

    `anchor` overrides where to look. Left None the search is centred on the
    box's own bottom edge, which finds the rule a box is already close to. A box
    sitting in a **ruled cell** is given the cell's bottom border instead: that
    border is the rule it belongs to no matter how far off the box currently is,
    and the raster window is only 1.6pt deep, so without the override a box more
    than that above its border is invisible to the search. SKISO_G p1's
    "Reasons and documentation" box was 2.18pt *past* its border and hanging into
    the row beneath while its three row-mates sat on theirs.
    """
    left = field["x"]
    right = left + field["width"] / SCALE
    bottom = field["y"] + field["height"] / SCALE
    if anchor is not None:
        bottom = anchor
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
    # Straight off the sample buffer a row at a time. The per-pixel accessor
    # costs a Python call each, and this runs over ~90,000 boxes.
    samples, stride, width = pix.samples, pix.stride, pix.width
    need = width * COVERAGE
    dark = []
    for y in range(pix.height):
        row = samples[y * stride:y * stride + width]
        dark.append(sum(1 for value in row if value < INK_BELOW) >= need)
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
    # **The nearest run, not the first one.** The window opens LOOK_UP above the
    # box so that an already-seated box still finds the rule straddling its edge,
    # and on a tightly stacked row that same reach catches the rule belonging to
    # the box *above*. Taking the first run then walked the second box of each
    # pair up onto its neighbour -- MBISO_I p8 gained two `box-overlap` findings
    # that way -- and left the pass oscillating by a fifth of a point on the ISO
    # forms instead of converging. The rule a box belongs to is the one nearest
    # its own bottom edge.
    first, last = min(runs, key=lambda run: abs(
        (clip.y0 + (run[0] + run[1]) / 2.0 / ZOOM) - bottom))
    return clip.y0 + first / ZOOM, clip.y0 + last / ZOOM


# A box counts as living in a cell when this much of it is inside one. Below it
# the box merely overlaps a cell it does not belong to.
CELL_SHARE = 0.6
_CELLS = {}


def cells_for(doc_id, page):
    """The page's ruled cells, from the province's own builder, memoised."""
    key = (doc_id, page.number)
    if key not in _CELLS:
        try:
            if doc_id.startswith("MB"):
                found = MB.grid_cells(page)
            else:
                found = SK.grid_cells(page, SK.cell_max_height(doc_id))
            _CELLS[key] = [item[0] for item in found]
        except Exception:
            _CELLS[key] = []
    return _CELLS[key]


def cell_of(doc_id, page, box):
    """The smallest ruled cell this box lives in, or None."""
    best = None
    for cell in cells_for(doc_id, page):
        if (box & cell).get_area() <= CELL_SHARE * box.get_area():
            continue
        if best is None or cell.get_area() < best.get_area():
            best = cell
    return best


def _rect(field, y=None):
    top = field["y"] if y is None else y
    return fitz.Rect(field["x"], top,
                     field["x"] + field["width"] / SCALE,
                     top + field["height"] / SCALE)


def collides(field, y, neighbours):
    """Would seating this field at `y` bury it in one of its neighbours?

    `verify_mb.py`'s own `box-overlap` test, applied before the move rather than
    after it. Seating is allowed to correct a box's own float; it is not allowed
    to change which boxes the page has, and a box driven a point and a half up
    into the one above it is a different control from the one that was reviewed.
    """
    moved = _rect(field, y)
    for other in neighbours:
        if other["id"] == field["id"] or other["page"] != field["page"]:
            continue
        box = _rect(other)
        if (moved & box).get_area() > OVERLAP_SHARE * min(moved.get_area(),
                                                          box.get_area()):
            return True
    return False


def shifts_for(doc_id):
    """{field id: new y} for every box that is off its rule."""
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    fields = json.load(open(path))["staticFields"]
    doc = fitz.open(pdf)
    moves, deltas, skipped, blocked = {}, [], 0, 0
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        if is_manual(doc_id, field):
            skipped += 1
            continue
        page = doc[field["page"] - 1]
        cell = cell_of(doc_id, page, _rect(field))
        found = rule_under(page, field, anchor=cell.y1 if cell else None)
        if found is None:
            continue
        top, low = found
        bottom = field["y"] + field["height"] / SCALE
        delta = (top + low) / 2.0 - bottom
        settled = max(DEAD_ZONE, (low - top) / 2.0)
        if abs(delta) < settled or abs(delta) > MAX_SHIFT:
            continue
        if collides(field, field["y"] + delta, fields):
            blocked += 1
            continue
        moves[field["id"]] = round(field["y"] + delta, 2)
        deltas.append(delta)
    doc.close()
    return moves, deltas, skipped, blocked


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


def template_ids(prefixes):
    return sorted(os.path.basename(path)[:-5]
                  for path in glob.glob(os.path.join(EXPORT, "*.json"))
                  if " " not in os.path.basename(path)
                  and os.path.basename(path).startswith(prefixes))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="report without writing")
    parser.add_argument("--family", action="append", default=None,
                        help="prefix to limit the pass to, e.g. SKPD_")
    args = parser.parse_args()

    ids = template_ids(tuple(args.family) if args.family else PROVINCES)
    per_family = collections.defaultdict(list)
    total = held = refused = 0
    for doc_id in ids:
        moves, deltas, skipped, stopped = shifts_for(doc_id)
        total += len(moves)
        held += skipped
        refused += stopped
        per_family[doc_id.split("_")[0]].extend(deltas)
        if moves and not args.check:
            apply(doc_id, moves)
        notes = []
        if skipped:
            notes.append("manual held=%d" % skipped)
        if stopped:
            notes.append("collision held=%d" % stopped)
        print("%-24s seated=%-4d %-18s %s"
              % (doc_id, len(moves),
                 "median %+.2fpt" % statistics.median(deltas) if deltas else "",
                 "  ".join(notes)))
    print("\n%d boxes %s, %d hand-placed and %d colliding boxes left alone."
          % (total, "would move" if args.check else "seated on their rules",
             held, refused))
    for family in sorted(per_family):
        d = per_family[family]
        if d:
            print("  %-8s n=%-4d median %+.2fpt  range %+.2f..%+.2f"
                  % (family, len(d), statistics.median(d), min(d), max(d)))


if __name__ == "__main__":
    main()

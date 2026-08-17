"""Drop a checkbox row's write-in cell onto the line of type it belongs to.

Reported from the app on CFCSA Form 10.5: every write-in cell on the option lists
("Parent(s) / Guardian(s) ___", "Witness(es) ___", "Other ___ Specify") rides a few
points high, so what a user types sits above the printed option it answers, and the
"to attend at the" Other cell is tall enough that it covers the whole Case Conference /
Hearing / Trial / Continuation row above it.

Both come from the same place, and neither is an extraction bug. `build_bc3.seat_on_rules`
seats a cell's *bottom* on the rule it is written on, which is right for a ruled table;
but on these option lists BC draws the rule ~3.4 pt above the option label's baseline —
high enough that a cell seated on the rule ends up straddling the row above rather than
its own. The cell is on the correct rule; it is the row's type, not the rule, that says
where the writing should read.

So: a cell is dropped onto the line of body type its rule runs through — the option label
printed to its left — so that the two share a bottom edge and typed text reads level with
the option it answers. Bounds:

* **down only, and never more than `MAX_DROP`.** A cell can only move toward the label it
  answers; a cell already on its type does not move (`MIN_MOVE`).
* **body type only.** A rule on these forms also runs through the 7 pt caption printed
  under it ("Specify", "Include name(s)"); those are hints, not the row's label, so only
  spans of `MIN_LABEL_SIZE` and up define the row.
* **never onto the next row.** The drop stops `RULE_GAP` short of the next rule below.
* **an oversized cell is trimmed, not left hanging.** "to attend at the" Other is 14.8 pt
  on a 10.4 pt row, so seating it still leaves it over Case Conference; its top comes down
  to the row's own type, never below `MIN_HEIGHT`.

Only y and height move — x and width are asserted byte-identical afterwards (§7.8), and a
second run is a no-op (§7.9).

Run: python3 seat_rows_on_type.py [--apply]
"""
import argparse
import copy
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
import verify_bc2 as V  # noqa: E402

OUT = V.OUT
EXPORT = V.EXPORT

MAX_HEIGHT = 16.0       # taller than this is a block, not a single row of writing
MAX_DROP = 8.0          # a row's rule is never further than this from its own type
MIN_MOVE = 0.4          # below this the move is not worth making
MIN_HEIGHT = 10.0       # never trim a cell below what 9 pt writing needs
MIN_LABEL_SIZE = 8.5    # a caption smaller than this is a hint, not the row's label
RULE_GAP = 1.0          # keep clear of the next rule down
TRIM_SLACK = 1.5        # a top this far above the row's type is overhang, not headroom

FORMS = ["BCPC_CFCSA_10_5"]


def root_for(doc_id):
    return OUT if os.path.exists(os.path.join(OUT, "%s.pdf" % doc_id)) else EXPORT


def page_rules(page, min_width=25.0):
    """Every horizontal rule on the page, as (y, x0, x1)."""
    rules = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l" and abs(item[1].y - item[2].y) < 0.6:
                x0, x1 = sorted((item[1].x, item[2].x))
                if x1 - x0 >= min_width:
                    rules.append((round(item[1].y, 2), x0, x1))
            elif item[0] == "re" and item[1].height <= 1.5 and item[1].width >= min_width:
                rules.append((round(item[1].y0, 2), item[1].x0, item[1].x1))
    return sorted(rules)


def page_labels(page):
    """Every span of body type on the page, as (y0, y1, x0, x1)."""
    labels = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if span["size"] < MIN_LABEL_SIZE or not span["text"].strip():
                    continue
                x0, y0, x1, y1 = span["bbox"]
                labels.append((y0, y1, x0, x1))
    return labels


def rule_for(rules, box):
    """The rule this cell is seated on: the one its bottom edge rests against."""
    best = None
    for y, x0, x1 in rules:
        if not (-2.0 <= y - box.y1 <= 3.0):
            continue
        if x0 >= box.x1 or x1 <= box.x0:
            continue
        if best is None or abs(y - box.y1) < abs(best[0] - box.y1):
            best = (y, x0, x1)
    return best


def label_for(labels, rule, box):
    """The line of type the rule runs through, printed left of the cell.

    Matched on where the span *starts*, with no bound on how far left that is. Both ends
    of the obvious test are wrong here: "Scheduled for ... at" is one span whose trailing
    run of spaces reaches well past the date cell it labels, and "Director  Lawyer/Lawyer
    of Record for" is one span that starts 212 pt left of the rule its Name cell sits on.
    The rule-crossing test is what ties a span to the row; distance adds nothing.
    """
    y, _, _ = rule
    row = [lab for lab in labels if lab[0] < y < lab[1] and lab[2] < box.x0]
    if not row:
        return None
    return min(lab[0] for lab in row), max(lab[1] for lab in row)


def next_rule_below(rules, rule, box):
    for y, x0, x1 in rules:
        if y <= rule[0] + 4.0:
            continue
        if x0 >= box.x1 or x1 <= box.x0:
            continue
        return y
    return None


def drops(page, fields):
    """(field, y, height) for every cell on this page that is riding above its type."""
    rules, labels = page_rules(page), page_labels(page)
    moves = []
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        height = field["height"] / bp.SCALE
        if height > MAX_HEIGHT:
            continue
        box = fitz.Rect(field["x"], field["y"],
                        field["x"] + field["width"] / bp.SCALE, field["y"] + height)
        rule = rule_for(rules, box)
        if rule is None:
            continue
        label = label_for(labels, rule, box)
        if label is None:
            continue
        drop = min(label[1] - box.y1, MAX_DROP)
        below = next_rule_below(rules, rule, box)
        if below is not None:
            drop = min(drop, below - RULE_GAP - box.y1)
        if drop < MIN_MOVE:
            continue
        top, bottom = box.y0 + drop, box.y1 + drop
        # An oversized cell keeps hanging over the row above even once it is seated on
        # its own type; the overhang, not the seat, is what has to give.
        if top < label[0] - TRIM_SLACK:
            top = min(label[0], bottom - MIN_HEIGHT)
        moves.append((field, round(top, 2), round((bottom - top) * bp.SCALE, 2)))
    return moves


def repair(doc_id, apply_changes, verbose=False):
    root = root_for(doc_id)
    path = os.path.join(root, "%s.json" % doc_id)
    with open(path) as handle:
        data = json.load(handle)
    before = copy.deepcopy(data["staticFields"])

    doc = fitz.open(os.path.join(root, "%s.pdf" % doc_id))
    moved = 0
    for number, page in enumerate(doc, start=1):
        fields = [f for f in data["staticFields"] if f["page"] == number]
        for field, new_y, new_height in drops(page, fields):
            if verbose:
                print("  p%d y %.2f -> %.2f  h %.2f -> %.2f  (x %.1f w %.1f)"
                      % (number, field["y"], new_y, field["height"], new_height,
                         field["x"], field["width"]))
            field["y"], field["height"] = new_y, new_height
            moved += 1
    doc.close()

    for old, new in zip(before, data["staticFields"]):
        for key in new:
            if key not in ("y", "height"):
                assert old[key] == new[key], (doc_id, key)

    print("%s: %d cell(s) dropped onto their type" % (doc_id, moved))
    if apply_changes and moved:
        with open(path, "w") as handle:
            json.dump(data, handle, indent=1)
    return moved


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    for doc_id in FORMS:
        repair(doc_id, args.apply, args.verbose)


if __name__ == "__main__":
    main()

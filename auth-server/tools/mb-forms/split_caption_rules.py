"""Give the *whole* of a rule a box when a caption is printed in the middle of it.

Manitoba draws its blanks as line art, and Form 22A (and its siblings) print the
instruction inside the rule rather than under it:

    On ________(date)________, 20___, at ____(time)____, I personally served
    I served ________(identify person served)________ by leaving a copy ...

The builder boxes the run of rule *after* the caption and drops what is in front
of it, so on 22A the filer got a 44pt box on a 113pt rule and, where both halves
were narrow, no box at all -- "I served ___(identify person served)___" and
"her at ___(state address where the person was served)___" had nowhere to type.

This finds every drawn rule, subtracts the glyphs actually printed on it, and
adds a field on each clear stretch left over that is wide enough to write in.
It only ever *adds*: an existing box is left exactly where it is, so the seating
`seat_mb_on_rules.py` applied is preserved, and a stretch that already has a box
is skipped. Idempotent.

Repairs in place rather than rebuilding, for the reason in guide 1 and in
`hand_finished()`: these forms are promoted and bound, and `--promote` is an
`os.replace` that would destroy that.

    python3 split_caption_rules.py --only MBCFS_22A [--check]
"""
import argparse
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
MIN_W = B.MIN_BLANK_WIDTH
PAD = B.EDGE_CLEARANCE

# A glyph belongs to a rule only if it is printed *on* that rule. Measured on
# 22A: a glyph sitting on a rule has its box bottom 0.4-0.5pt below it, while the
# line above sits 10.5-12pt higher. The window has to be this tight -- opened to
# a line's height it swallowed the wrapped text above ("...re: transfer
# proceeding under s" over the "the hearing set for ___(date)___" rule), which
# read as a rule with no clear space at all and reported nothing to do.
GLYPH_ABOVE, GLYPH_BELOW = 3.0, 3.0
# A clear stretch is already served if a box covers this much of it.
COVERED = 0.5


def rules_on(page):
    horizontal, _vertical = B._segments(page)
    return [(k, s, e) for k, s, e in horizontal if e - s >= MIN_W]


def occupied(page, key, start, end):
    """Merged (x0, x1, text) of the printed glyphs sitting on this rule."""
    spans = []
    for text, boxes, _sizes in B.line_chars(page):
        for index, char in enumerate(text):
            if not char.strip():
                continue
            box = boxes[index]
            if not (key - GLYPH_ABOVE <= box.y1 <= key + GLYPH_BELOW):
                continue
            if box.x1 <= start or box.x0 >= end:
                continue
            spans.append((box.x0 - PAD, box.x1 + PAD, char))
    spans.sort()
    merged = []
    for lo, hi, char in spans:
        if merged and lo <= merged[-1][1] + PAD:
            merged[-1] = (merged[-1][0], max(merged[-1][1], hi), merged[-1][2] + char)
        else:
            merged.append((lo, hi, char))
    return merged


def interrupted(page, key, start, end):
    """Is a parenthesised caption printed *inside* this rule?

    That is the whole defect, and the test has to be this narrow. A rule with
    clear space and no interior caption is a rule the builder left alone on
    purpose -- a signature line, a heading's underline (whose text starts at the
    left edge, so its span touches `start` and is not interior), or one of the
    ruled narrative lines that already has a writing area over it. Adding boxes
    to those would undo deliberate decisions.
    """
    for lo, hi, text in occupied(page, key, start, end):
        if lo <= start + PAD or hi >= end - PAD:
            continue
        if text.strip().startswith("(") and text.strip().endswith(")"):
            return True
    return False


def clear_stretches(page, key, start, end):
    out, cursor = [], start
    for lo, hi, _text in occupied(page, key, start, end):
        if lo - cursor >= MIN_W:
            out.append((cursor, lo))
        cursor = max(cursor, hi)
    if end - cursor >= MIN_W:
        out.append((cursor, end))
    return out


def seating(fields, key):
    """(height, bottom-minus-rule) taken from boxes already seated on this rule."""
    on = [f for f in fields if abs(f["y"] + f["height"] / SCALE - key) < 3.0]
    if not on:
        return None
    return (statistics.median(f["height"] for f in on),
            statistics.median(f["y"] + f["height"] / SCALE - key for f in on))


def default_seating(fields):
    heights, offsets = [], []
    for f in fields:
        if f["type"] == "CheckBox":
            continue
        heights.append(f["height"])
        offsets.append(0.3)
    return (statistics.median(heights) if heights else 11.7 * SCALE,
            0.3)


def repair(doc_id, write):
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    fallback = default_seating(fields)
    added = []
    next_id = max(f["id"] for f in fields) + 1
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        mine = [f for f in fields if f["page"] == number and f["type"] != "CheckBox"]
        for key, start, end in rules_on(page):
            if not interrupted(page, key, start, end):
                continue
            seat = seating(mine, key) or fallback
            height, offset = seat
            # Only boxes seated on *this* rule can serve it. Comparing against
            # every field on the page instead lets a full-width writing area
            # elsewhere on the sheet mask every stretch, which is what made the
            # first run of this report nothing to do.
            on_rule = [f for f in mine
                       if abs(f["y"] + f["height"] / SCALE - key) < 4.0]
            for lo, hi in clear_stretches(page, key, start, end):
                covered = False
                for f in on_rule:
                    fx0, fx1 = f["x"], f["x"] + f["width"] / SCALE
                    if min(fx1, hi) - max(fx0, lo) > COVERED * (hi - lo):
                        covered = True
                        break
                if covered:
                    continue
                field = {
                    "id": next_id, "page": number, "type": "TextField",
                    "x": round(lo, 2),
                    "y": round(key + offset - height / SCALE, 2),
                    "width": round((hi - lo) * SCALE, 2),
                    "height": round(height, 2),
                }
                next_id += 1
                added.append(field)
                mine.append(field)
                on_rule.append(field)
    doc.close()
    if added and write:
        template = next(f for f in fields if f["type"] == "TextField")
        for field in added:
            for key_name, value in template.items():
                if key_name not in field and key_name != "bind":
                    field[key_name] = value
        fields.extend(added)
        fields.sort(key=lambda f: (f["page"], f["y"], f["x"]))
        with open(path, "w") as fh:
            json.dump(mapping, fh, indent=2)
            fh.write("\n")
    return added


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", required=True)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    total = 0
    for doc_id in args.only:
        added = repair(doc_id, not args.check)
        total += len(added)
        print("%-13s added=%d" % (doc_id, len(added)))
        for f in added:
            print("     p%d x %.1f w %.1f y %.1f"
                  % (f["page"], f["x"], f["width"] / SCALE, f["y"]))
    print("\n%d box(es) %s." % (total, "would be added" if args.check else "added"))


if __name__ == "__main__":
    main()

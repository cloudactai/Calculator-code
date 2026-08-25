"""Cut a one-line writing box down to one line of the form's own text.

Some boxes are seated correctly and still read wrong, because they are far taller
than the line they sit on. SKISO_I is the clearest case: its body is set 10pt on
an 11.1pt line, and 125 of its 225 text fields are taller than that -- the Start
Date, End Date and Year-to-Date columns are 21.6pt and the name field is 24.1pt,
near enough two lines each. On screen the viewer draws a control that size, so
the form reads as a column of slabs rather than a row of blanks.

**The height of one line, measured from the page rather than assumed.** The
builder's own `LINE_RATIO` (1.3) times the font the *page* is printed in, per
page, taken as the modal span size. Not the stored `fontSize`, which is the 9pt
the filled value is stamped in and has nothing to do with how tall the blank
should look: on SKISO_I that would give 11.7pt against a printed line of 11.1pt,
and on a form set in 12pt it would give a box shorter than its own line.

**Anchored at the bottom.** The box shrinks upward, so the bottom edge -- which
`seat_boxes_on_rules.py` put on the printed rule -- does not move. Shrinking from the
bottom instead would lift every box back off its line.

Only single-line `TextField`s. A `TextArea` is tall on purpose: it is the answer
space for a narrative, and its height is what says so. Checkboxes are seated on a
printed square. Anything in a builder's `MANUAL_FIELDS` is left alone, for the
reason `seat_boxes_on_rules.py` records: those coordinates are somebody's reading of
the page, height included.

Writes back `y` and `height` alone, asserting every other key is byte-identical
first -- the same in-place repair `seat_boxes_on_rules.py` and `rebind_mb_forms.py` do,
and for the same reason: these templates are promoted and bound, and rebuilding
would destroy that.

Idempotent: a box already one line high measures no change.

    python3 one_line_boxes.py --check SKISO_I     # report, write nothing
    python3 one_line_boxes.py SKISO_I MBISO_I     # apply
"""
import argparse
import collections
import json
import os
import statistics
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
for _dir in ("bc-forms", "sk-forms", "mb-forms"):
    sys.path.insert(0, os.path.join(TOOLS, _dir))

sys.path.insert(0, HERE)  # ahead of bc-forms, which has its own seat_on_rules
import seat_boxes_on_rules as SEAT  # noqa: E402

EXPORT = SEAT.EXPORT
SCALE = SEAT.SCALE
# The builder's own ratio: "a blank is one line of writing; the height follows
# the font it was set in" (`build_sk_forms.LINE_RATIO`).
LINE_RATIO = 1.3
# Ignore a box within this much of one line -- it already reads as one line, and
# trimming it is churn rather than a fix. A tenth of a line: at 0.3pt the pass
# wanted to shave 0.7pt off all 204 of MBISO_I's boxes, which nobody would see
# and which would rewrite the file for nothing.
DEAD_ZONE = 1.5
# A page with less text than this has no reliable modal size; leave it alone
# rather than resize its boxes against three words in a running head.
MIN_SPANS = 20


def page_font(page):
    """The size the page is actually printed in, or None if it barely is."""
    sizes = collections.Counter()
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if span["text"].strip():
                    sizes[round(span["size"], 1)] += len(span["text"].strip())
    if sum(sizes.values()) < MIN_SPANS:
        return None
    return sizes.most_common(1)[0][0]


def shifts_for(doc_id):
    """{field id: (new y, new height)} for every box taller than its line."""
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    fields = json.load(open(path))["staticFields"]
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    fonts = {}
    moves, cuts, held = {}, [], 0
    for field in fields:
        if field["type"] != "TextField":
            continue
        if SEAT.is_manual(doc_id, field):
            held += 1
            continue
        number = field["page"]
        if number not in fonts:
            fonts[number] = page_font(doc[number - 1]) if number - 1 < len(doc) else None
        font = fonts[number]
        if not font:
            continue
        one_line = round(font * LINE_RATIO, 2)
        height = field["height"] / SCALE
        if height - one_line < DEAD_ZONE:
            continue
        bottom = field["y"] + height
        moves[field["id"]] = (round(bottom - one_line, 2), round(one_line * SCALE, 2))
        cuts.append(height - one_line)
    doc.close()
    return moves, cuts, held


def apply(doc_id, moves):
    """Write back `y` and `height` alone, asserting nothing else moved."""
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    before = {f["id"]: dict(f) for f in mapping["staticFields"]}
    for field in mapping["staticFields"]:
        if field["id"] in moves:
            field["y"], field["height"] = moves[field["id"]]
    for field in mapping["staticFields"]:
        was = before[field["id"]]
        for key in was:
            if key in ("y", "height"):
                continue
            assert was[key] == field[key], "%s %s: %s changed" % (doc_id, field["id"], key)
    with open(path, "w") as fh:
        json.dump(mapping, fh, indent=2)
        fh.write("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("doc_ids", nargs="+")
    parser.add_argument("--check", action="store_true", help="report without writing")
    args = parser.parse_args()

    total = held = 0
    for doc_id in args.doc_ids:
        moves, cuts, skipped = shifts_for(doc_id)
        total += len(moves)
        held += skipped
        if moves and not args.check:
            apply(doc_id, moves)
        print("%-16s cut=%-4d %-22s %s"
              % (doc_id, len(moves),
                 "median -%.1fpt  max -%.1fpt" % (statistics.median(cuts), max(cuts))
                 if cuts else "",
                 "manual held=%d" % skipped if skipped else ""))
    print("\n%d boxes %s to one line, %d hand-placed boxes left alone."
          % (total, "would be cut" if args.check else "cut", held))


if __name__ == "__main__":
    main()

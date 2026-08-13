"""Make a batch-2 field's `type` agree with the box the government drew.

§8's "two `type` values for the same kind of table cell": XFA tags some cells
`TextField` and their neighbours `TextArea`, the build trusts the tag, and the app draws
the two differently — so one cell of a table row ends up not matching the rest. Reading
the forms found it batch-wide, most visibly on the heading of nearly every Supreme form,
where `Court File No.` comes out `TextArea` while `Court Registry` directly beneath it,
same width and same height, comes out `TextField`.

Two rules. The first reads the box's own height, which is unambiguous for a box that
cannot hold a second line; the second is §8's own wording and settles what height cannot.

The converse of the first rule — "a box two or more lines tall is a `TextArea`" — was
tried and **removed**. It is right for a table cell the government drew deep for wrapped
text, but a height rule applied blindly afterwards cannot tell that from the
government's own one-line fields whose box is tall only because their *caption* wraps:
it turned BCPC_12 p10's "Date on which the parties began to live together in a
marriage-like relationship (dd/mmm/yyyy)" into a `TextArea`, and did the same to F71's
day-counts, F62.1's "Date:" and F37's `$` amounts. That decision now lives in
`place_missing_bc2.cell_targets`, which has the cell's geometry in hand and only ever
types the cells it creates itself.

1. **A box one line tall is a `TextField`.** 439 `TextArea` fields are ≤ 20 pt, and
   their heights cluster at 11-18 pt — a box that size cannot hold a second line, so a
   multi-line control in it is wrong. (The approved single-line height is 13.3 pt.)

2. **Inside a column, the minority type loses.** For a run of three or more fields
   sharing a page, an x position and a width, a *strict* majority type converts the
   rest. This is what catches a mismatch whose boxes are all the same height — F1 p4's
   children table, whose first data row is `TextArea / TextField / TextArea` against
   `TextField x3` on the rows below it, all 26 pt.

3. **A box that is both tall and wide is a `TextArea`.** The removed converse rule failed
   because height alone cannot tell a deep writing block from a one-line field whose
   *caption* wraps. Width settles it: those one-line fields are narrow — F71's day-counts
   are 58.9 pt wide, BCPC_12 p10's date 146 pt, PD-58's date column 82.8 pt — while a
   writing block runs most of the text measure. So a `TextField` at least
   `MULTI_LINE_MIN` tall **and** `WIDE_MIN` wide becomes a `TextArea`, and so does one
   over `VERY_TALL` at any width, where no single value could need the room.

   Reading the appeal forms is what found this. F82.2, F82.3, F98.1 and F98.2 each end
   with a **152.7 pt** `TextField` — the last Part's writing area — directly under sibling
   Parts of 72.8 and 62.0 pt that are `TextArea`, so one Part of a four-Part statement of
   argument was drawn as a single-line box. F37 has fourteen more of the same shape, its
   full-width 62-69 pt narrative rows. The width test leaves every narrow one alone.

   A tall `TextField` whose *column* is mostly `TextArea` converts as well, which is what
   reaches F101 p2 and p4's odd cell out at 75.9 pt and 86 pt wide.

Only `type` is written; every other key is asserted byte-identical afterwards (§7.8),
and a second run is a no-op (§7.9).

Run: python3 normalise_types_bc2.py [--apply] [--only DOCID[,DOCID...]]
"""
import argparse
import collections
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch2 as src2  # noqa: E402
import verify_bc2 as V  # noqa: E402

OUT = V.OUT
SINGLE_LINE_MAX = 20.0   # at or under this a box holds one line
MULTI_LINE_MIN = 27.0    # at or over this it holds two, so it is a writing block
WIDE_MIN = 250.0         # ...and at this width it is one, not a tall narrow value cell
VERY_TALL = 100.0        # no single value needs this much room, whatever the width
COLUMN_MIN = 3           # a column needs this many members before its majority means anything


X_TOL = 3.0        # a column's fields share a left edge to within this
WIDTH_TOL = 8.0    # ...and a width to within this


def column_groups(fields):
    """Fields that form a column: same page, same left edge, same width.

    Clustered with a tolerance rather than bucketed by rounding. Rounding put F1 p4's
    children table into two groups, because its first row is 178.6 pt wide and the rows
    below it are 177.2 pt — a 1.4 pt difference that straddled a bucket boundary, so the
    row-1 cell ended up alone in a group of one and no majority could reach it.
    """
    groups = []
    by_page = collections.defaultdict(list)
    for field in fields:
        if field["type"] in ("TextField", "TextArea"):
            by_page[field["page"]].append(field)
    for page_fields in by_page.values():
        remaining = sorted(page_fields, key=lambda f: (f["x"], f["width"]))
        used = set()
        for anchor in remaining:
            if id(anchor) in used:
                continue
            member = [f for f in remaining
                      if id(f) not in used
                      and abs(f["x"] - anchor["x"]) <= X_TOL
                      and abs(f["width"] - anchor["width"]) <= WIDTH_TOL * V.SCALE]
            for f in member:
                used.add(id(f))
            groups.append(member)
    return groups


def normalise(fields):
    """Return (changes, ...) where each change is (field, old_type, new_type, why)."""
    changes = []

    for field in fields:
        if field["type"] not in ("TextField", "TextArea"):
            continue
        height = field["height"] / V.SCALE
        if field["type"] == "TextArea" and height <= SINGLE_LINE_MAX:
            changes.append((field, "TextArea", "TextField", "one line tall (%.1fpt)" % height))
    for field in fields:
        if field["type"] != "TextField":
            continue
        height = field["height"] / V.SCALE
        width = field["width"] / V.SCALE
        if height >= VERY_TALL:
            changes.append((field, "TextField", "TextArea",
                            "%.1fpt tall, past any single value" % height))
        elif height >= MULTI_LINE_MIN and width >= WIDE_MIN:
            changes.append((field, "TextField", "TextArea",
                            "tall and wide (%.1fx%.1fpt)" % (width, height)))
    for field, _old, new, _why in changes:
        field["type"] = new

    for members in column_groups(fields):
        if len(members) < 2:
            continue
        counts = collections.Counter(member["type"] for member in members)
        if counts["TextArea"] <= counts["TextField"]:
            continue
        for member in members:
            # A tall box in a column its neighbours make a writing column. Separate from
            # the majority rule below, which deliberately confines itself to the
            # ambiguous 20-27 pt band so it cannot fight the height rules.
            if member["type"] == "TextField" and member["height"] / V.SCALE >= MULTI_LINE_MIN:
                changes.append((member, "TextField", "TextArea",
                                "tall, in a column that is %d/%d TextArea"
                                % (counts["TextArea"], len(members))))
                member["type"] = "TextArea"

    for members in column_groups(fields):
        if len(members) < COLUMN_MIN:
            continue
        counts = collections.Counter(member["type"] for member in members)
        if len(counts) < 2:
            continue
        winner, votes = counts.most_common(1)[0]
        if votes <= len(members) / 2:
            continue    # no strict majority; leave the column alone
        for member in members:
            # Height is authoritative: rules 1 and 2 already settled any box that is
            # clearly one line or clearly two, and letting a column majority overrule
            # them makes the tool oscillate — the first run flipped 40 such fields to
            # `TextArea` and the second run flipped them straight back (§7.9). Only the
            # ambiguous band in between is the column's to decide.
            height = member["height"] / V.SCALE
            if height <= SINGLE_LINE_MAX or height >= MULTI_LINE_MIN:
                continue
            if member["type"] != winner:
                changes.append((member, member["type"], winner,
                                "column of %d is %d%% %s" % (len(members),
                                                             round(100 * votes / len(members)),
                                                             winner)))
                member["type"] = winner
    return changes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--only")
    args = parser.parse_args()

    doc_ids = [s["docId"] for s in src2.all_sources()]
    if args.only:
        want = set(args.only.split(","))
        doc_ids = [d for d in doc_ids if d in want]

    per_form = collections.Counter()
    why = collections.Counter()
    total = 0
    for doc_id in doc_ids:
        path = os.path.join(OUT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        before = copy.deepcopy(mapping["staticFields"])
        changes = normalise(mapping["staticFields"])
        if not changes:
            continue
        for _field, old, new, reason in changes:
            why["%s -> %s (%s)" % (old, new, reason.split("(")[0].strip())] += 1
        per_form[doc_id] = len(changes)
        total += len(changes)
        # §7.8: type is the only key this tool may touch.
        for old_field, new_field in zip(before, mapping["staticFields"]):
            for key in set(old_field) | set(new_field):
                if key == "type":
                    continue
                assert old_field.get(key) == new_field.get(key), (doc_id, old_field["id"], key)
        if args.apply:
            with open(path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")

    for reason, count in why.most_common():
        print("  %-46s %d" % (reason, count))
    print()
    for doc_id, count in per_form.most_common(12):
        print("%-14s %d field(s)" % (doc_id, count))
    print("\n%d type(s) normalised across %d forms%s"
          % (total, len(per_form), "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()

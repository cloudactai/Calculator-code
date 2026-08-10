"""Ask whether a field box sits where the printed page says it should.

`HANDOFF.md` §4 is the reason this file exists. The Ontario batch shipped visibly
wrong while every gate reported clean, because the gates measured the wrong things:

* `verify_on_forms.py` checked that files exist, no widgets were left behind, the
  geometry is in bounds and the binds use known vocabulary — **it never asked whether
  a box sits on its line**.
* `audit_on_forms.py` had its "oversized" rule deliberately disabled for AcroForm
  sources, because the 2-3x line-height boxes *are* the government's own widget
  rects — which is precisely the defect.
* `covers_printed_text` only flags a box on top of ink, and a box that starts halfway
  along its rule and overshoots the end covers nothing.

So this checks the four things that were actually wrong:

1. **Seated on the rule.** Every single-line text field must have a printed rule
   under it, with its bottom on that rule.
2. **The right shape for the blank.** A field on a rule is a `TextField` at the
   standard 13.3 pt; a field over open space may be a `TextArea` and may be tall.
   The pairing is asserted, not just the height — a check that only shrank things
   would wreck the genuine writing blocks.
3. **Strays.** A box with no rule, no cell, no shading and no ink near it.
4. **Boxes that cover the printed labels beside them**, and boxes that run across a
   drawn column separator.

    python3 check_seating.py             # the 90 new templates
    python3 check_seating.py --only Form25C --verbose
"""

import argparse
import collections
import json
import os

import on_scope
import page_geom as G

STD = G.STD_LINE
SEAT_GAP = G.SEAT_GAP
BLOCK_MIN = 22.0
SEAT_TOL = 1.0
TEXT_TYPES = ("TextField", "TextArea", "Number", "Date")


def check_form(doc_id, export):
    with open(os.path.join(export, doc_id + ".json")) as fh:
        fields = json.load(fh)["staticFields"]
    pages = G.load_pages(os.path.join(export, doc_id + ".pdf"))
    out = []

    def add(kind, f, detail):
        x0, y0, x1, y1 = G.box(f)
        out.append((kind, f["page"], f"[{x0:.0f},{y0:.0f} {x1:.0f},{y1:.0f}] {detail}"))

    for f in fields:
        pg = pages.get(f["page"])
        if pg is None:
            add("off-page", f, f"page {f['page']} is not in the PDF")
            continue
        x0, y0, x1, y1 = G.box(f)
        r = pg["rect"]
        if x0 < -1 or y0 < -1 or x1 > r.width + 1 or y1 > r.height + 1:
            add("out-of-bounds", f, "box leaves the page")
        if x1 - x0 <= 0 or y1 - y0 <= 0:
            add("degenerate", f, "non-positive width or height")
        if f["type"] not in TEXT_TYPES:
            continue

        rule = G.seat_rule(f, pg["rules"], below=14.0)
        cell = G.enclosing_cell(f, pg["rules"], pg["vlines"])
        h = y1 - y0
        block = h >= BLOCK_MIN

        if rule and not block:
            # 1 + 2: single line on a rule -> standard box, sitting on the rule.
            if abs(h - STD) > 0.2:
                # Short is legitimate where the form sets its text closer to the
                # writing line than the standard box is tall: the box is clamped so
                # it does not cover the words (see `_clear_ink_above`). Tall is not.
                pinched = h < STD and any(
                    min(x1, g[2]) - max(x0, g[0]) > 0.5 * (g[2] - g[0])
                    and y0 - 1.5 <= g[3] <= y0 + 0.5 for g in pg["glyphs"])
                if not pinched:
                    add("wrong-height", f, f"on a rule but {h:.1f} pt, not {STD}")
            if abs(rule[0] - (y1 + SEAT_GAP)) > SEAT_TOL:
                add("not-seated", f,
                    f"bottom {y1:.1f} but its rule is at {rule[0]:.1f}")
            if f["type"] == "TextArea":
                add("wrong-shape", f, "TextArea on a single printed rule")
        elif block:
            if f["type"] not in ("TextArea", "Table"):
                add("wrong-shape", f, f"{f['type']} {h:.0f} pt tall — a block wants a TextArea")
        elif cell:
            if abs(rule[0] - (y1 + SEAT_GAP)) > SEAT_TOL if rule else True:
                pass   # a short cell with no rule of its own; the cell is the anchor
        else:
            # 3: nothing printed to justify a box here. A blank in running text is
            # normal and correct — "I, ____, request ..." and "Child support: ____"
            # have no rule under them, and the caption on their own line is the
            # anchor (placement guide §6). What is not normal is a box with nothing
            # near it at all: that is the Word export's padding, not a blank.
            cy = (y0 + y1) / 2
            caption = any(w[1] - 2 <= cy <= w[3] + 2 and x0 - 45 < w[2] <= x0 + 3
                          for w in pg["ink"])
            shaded_hit = any(sx0 < x1 and sx1 > x0 and sy0 < y1 and sy1 > y0
                             for sx0, sy0, sx1, sy1 in pg["shaded"])
            near = any(w[2] > x0 - 20 and w[0] < x1 + 20 and w[3] > y0 - 20 and w[1] < y1 + 20
                       for w in pg["ink"])
            if not shaded_hit and not near:
                add("stray", f, "no rule, cell, shading or ink anywhere near it")
            elif not caption and not shaded_hit:
                add("no-anchor", f, "no rule, cell or caption on its line")

        # 4a: a box printed over the label that names it. Measured on glyphs, not
        # words: a money cell flattens to a `$` followed by the en-space padding its
        # value used to occupy, so the word rect spans the whole cell and a box that
        # correctly starts after the `$` would read as covering it.
        # A third of a line of type inside the box is already a box printed over
        # words: Form 43B p3 overlapped its caption by 38% and a 50% threshold let it
        # through.
        covered = [g for g in pg["glyphs"]
                   if min(x1, g[2]) - max(x0, g[0]) > 0.5 * (g[2] - g[0])
                   and min(y1, g[3]) - max(y0, g[1]) > 0.3 * (g[3] - g[1])]
        if len(covered) >= 3:
            add("covers-text", f,
                "covers printed " + repr("".join(g[4] for g in covered[:24])))

        # 4b: a single-line box straddling a drawn column separator.
        if not block:
            crossed = [v for v in pg["vlines"]
                       if x0 + 2 < v[0] < x1 - 2 and v[1] < y1 - 2 and v[2] > y0 + 2]
            if crossed:
                add("crosses-column", f,
                    f"runs across {len(crossed)} drawn column separator(s)")
    # 5: a column of table cells that is not all one shape. The app draws TextField
    # and TextArea differently, so a column with both reads as one cell that does not
    # match the rest of its table (placement guide §8). It is reported rather than
    # normalised: the split comes from the government's own multiline flags, and the
    # guide says normalise *per table* to the local majority — a judgement call on
    # each table, not something to apply across 48 columns unseen.
    for run in G.column_runs(fields):
        kinds = collections.Counter(m["type"] for m in run)
        if len(kinds) > 1:
            top = run[0]
            out.append(("mixed-column", top["page"],
                        f"x≈{top['x']:.0f}: {len(run)} stacked cells, "
                        + " + ".join(f"{n} {k}" for k, n in kinds.most_common())))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--export", default=on_scope.EXPORT)
    args = ap.parse_args()

    targets = args.only or on_scope.NEW_DOCIDS
    kinds = collections.Counter()
    per_form = {}
    for doc_id in targets:
        issues = check_form(doc_id, args.export)
        if issues:
            per_form[doc_id] = issues
        for k, _p, _d in issues:
            kinds[k] += 1

    for doc_id in targets:
        issues = per_form.get(doc_id)
        if not issues:
            continue
        by_kind = collections.Counter(k for k, _p, _d in issues)
        print(f"{doc_id:12s} " + ", ".join(f"{k} x{n}" for k, n in by_kind.most_common()))
        if args.verbose:
            for k, p, d in issues:
                print(f"    p{p} {k}: {d}")

    total = sum(kinds.values())
    print(f"\n{len(per_form)}/{len(targets)} forms with findings, {total} findings")
    for k, n in kinds.most_common():
        print(f"  {k:16s} {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

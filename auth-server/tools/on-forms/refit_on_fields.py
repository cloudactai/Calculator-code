"""Seat the Ontario batch's field boxes on the printed page.

Fixes the two defects recorded in `HANDOFF.md`:

* **Defect 1 — boxes far taller than the line.** A government AcroForm widget is
  routinely 2-3x a printed text line, and the editor top-aligns its input, so typed
  text floats above the rule. Every single-line text field is re-cut to the approved
  standard (13.3 pt) and sat on the rule it belongs to. Multi-line fields keep their
  height: the user's rule is "on an underline -> standard box; open space, a block,
  several lines -> text area", and only the first half is a shrink.

* **Defect 2 — the flat-sourced forms overshoot their rules.** `place_flat_fields.py`
  takes a box's left edge from where a Word field's en-space padding began and runs
  right to the next printed character, so boxes start mid-line and overrun. On those
  ten forms the box is snapped to the extent of the government's own printed rule,
  which is ground truth; a box with no rule, no cell, no shading and no ink near it
  is dropped.

Two numbers here are measurements, not guesses:

* **13.3 pt** — the single-line height in the 45 approved Ontario templates
  (2393 of 3254 fields sit at exactly 13.3; TextField p25 = median = p75 = 13.3).
* **1.26 pt** — how far a box bottom sits above its printed rule in that same
  approved set (p10 1.21, median 1.26, p90 1.48, over the 39 approved fields whose
  page still has vector rules to measure against; the rest are raster scans).

Only the 90 docIds in `on_scope.NEW_DOCIDS` are touched. Nothing but geometry and
`type` is written: every other key is copied through and asserted unchanged.

    python3 refit_on_fields.py            # dry run, prints what would change
    python3 refit_on_fields.py --apply
    python3 refit_on_fields.py --only Form25C --apply
"""

import argparse
import collections
import json
import os
import sys

import on_scope
import page_geom as G

SCALE = G.SCALE
STD = G.STD_LINE          # 13.3 pt
SEAT_GAP = 1.26           # box bottom sits this far above the rule
TEXT_TYPES = ("TextField", "TextArea", "Number", "Date")

# A blank taller than this is a writing block, not a line. Sits between the approved
# TextField height (13.3) and the approved TextArea p25 (24.5).
BLOCK_MIN = 22.0
# How far below a box bottom a rule may be and still be *that box's* rule. Ontario's
# table rows are ~33 pt, so this stays well inside one row.
SEAT_BELOW = 14.0
EDGE_INSET = 0.25         # approved median offset of a box edge inside its rule


def load(doc_id, export):
    with open(os.path.join(export, doc_id + ".json")) as fh:
        return json.load(fh)


def geometry_of(f):
    return (f["x"], f["y"], f["width"], f["height"], f["type"])


def _partition(rule, members, vlines):
    """Split a shared rule between the fields sitting on it, in reading order.

    Returns None when the members overlap each other or the split would produce an
    empty span. `place_flat_fields.py` sometimes emits several boxes over the same
    run of a line, and midpointing between overlapping boxes gives spans that are
    out of order or negative-width — Form 13C had 82 of them. Where that happens the
    boxes are not trustworthy enough to redistribute, so their widths are left alone
    and the fields are reported for a human.
    """
    _ry, rx0, rx1 = rule
    members = sorted(members, key=lambda f: f["x"])
    spans = [(f["x"], f["x"] + f["width"] / SCALE) for f in members]
    if any(b[0] < a[1] - 0.5 for a, b in zip(spans, spans[1:])):
        return None
    # Where the government drew a column separator in the gap, split there — it is
    # printed ground truth, and being fixed it also makes the split a fixed point.
    # Otherwise take the midpoint, quantised to half a point: without that the
    # midpoint of two already-split boxes lands a rounding step away from the split
    # that produced them, and every run nudges each width by 0.01 pt for ever.
    ry = rule[0]
    mids = []
    for a, b in zip(spans, spans[1:]):
        cut = [v[0] for v in vlines
               if a[1] - 0.5 <= v[0] <= b[0] + 0.5 and v[1] <= ry - 2 and v[2] >= ry - 2]
        mids.append(min(cut) if cut else round(a[1] + b[0]) / 2)
    edges = [rx0] + mids + [rx1]
    if any(hi - lo < 4.0 for lo, hi in zip(edges, edges[1:])):
        return None
    return list(zip(members, zip(edges, edges[1:])))


MIN_LINE = 8.0    # below this a box is too shallow to type in; report it instead


def _line_has_ink(f, pg, reach=90.0):
    """Is anything printed on this box's own line, in or just beside it?"""
    x0, y0, x1, y1 = G.box(f)
    # Share a band with the box, not merely sit near it: Form 43A prints "this __ day
    # of __, 20" on the line *above* its divider stray, and a loose vertical reach
    # counted that as the stray's own caption and kept it.
    return any(min(y1, g[3]) - max(y0, g[1]) > 0
               and g[2] > x0 - reach and g[0] < x1 + reach
               for g in pg["glyphs"])


def _clear_ink_above(f, pg, doc_id, notes):
    """Pull a seated box's top down so it does not cover the line printed above it.

    Occasionally a form sets its text closer to its writing line than the standard
    box is tall — Form 43B p3 leaves 10 pt between "… namely:" and its rule, so a
    13.3 pt box seated there reaches up through the words. The bottom has to stay on
    the rule, so the top is what gives way (guide §3: a box must not sit on printed
    content). Rare: two fields in the whole batch.
    """
    x0, y0, x1, y1 = G.box(f)
    top = y0
    for gx0, gy0, gx1, gy1, _c in pg["glyphs"]:
        if min(x1, gx1) - max(x0, gx0) < 0.5 * (gx1 - gx0):
            continue
        # Require a real bite out of the glyph, not a descender grazing the top
        # edge — without this the clamp fired on 173 perfectly good boxes.
        if min(y1, gy1) - max(y0, gy0) <= 0.3 * (gy1 - gy0):
            continue
        if gy1 - y0 > 0.7 * (y1 - y0):
            continue          # ink through the middle of the box is a different fault
        top = max(top, gy1 + 0.5)
    if top <= y0:
        return
    if y1 - top >= MIN_LINE:
        f["y"] = round(top, 2)
        f["height"] = round((y1 - top) * SCALE, 2)
    else:
        notes.append((doc_id, f["page"],
                      f"only {y1 - top:.1f} pt clear above the rule at y={y1 + SEAT_GAP:.0f}"))


def refit_form(doc_id, export, notes, data=None, pages=None):
    """Return (data, changed_count, dropped). `notes` collects what a human must place."""
    if data is None:
        data = load(doc_id, export)
    fields = data["staticFields"]
    if pages is None:
        pages = G.load_pages(os.path.join(export, doc_id + ".pdf"))
    acro = on_scope.is_acroform(doc_id)
    inferred = not acro

    # --- resolve each field's anchor once -------------------------------------
    original = {id(f): geometry_of(f) for f in fields}
    anchors = {}
    for f in fields:
        if f["type"] not in TEXT_TYPES:
            continue
        pg = pages.get(f["page"])
        if pg is None:
            notes.append((doc_id, f["page"], "field on a page the PDF does not have"))
            continue
        # A box must not begin on the caption printed inside its own cell — Ontario
        # sets "Court File Number" at the head of the box it names, and the widget
        # covers the lot, so the editor's first line lands on the words (guide §3).
        # Do this before reading the anchors: pulling the top down can turn what
        # looked like a writing block into the single line it really is.
        cap = G.ink_below_top(*G.box(f), pg["glyphs"])
        if cap is not None and G.box(f)[3] - (cap + 1.0) >= STD:
            f["height"] = round((G.box(f)[3] - cap - 1.0) * SCALE, 2)
            f["y"] = round(cap + 1.0, 2)

        # A heavy rule that divides the form into sections is not something to sit a
        # box on, so it is not a candidate at all. Ontario's writing lines are 0.5 pt;
        # a divider is a solid bar or a 2.25 pt stroke. Only the inferred sources ever
        # put a box on one — an AcroForm form's widgets are the government's own — and
        # excluding it here is what lets a writing area closed by a divider stay a
        # writing area (Form 43B item 28) while a one-line stray on the same bar still
        # falls through to the stray rule below (Form 43A, 34H).
        candidates = pg["rules"]
        if inferred:
            candidates = [r for r in candidates if not G.on_dark_bar(r, pg["bars"])]
        cell = G.enclosing_cell(f, pg["rules"], pg["vlines"])
        rule = G.seat_rule(f, candidates, below=SEAT_BELOW,
                           prefer="leftmost" if inferred else "overlap", cell=cell)
        anchors[id(f)] = (pg, rule, cell)

    # --- one column of a table is one shape ------------------------------------
    # The app draws TextField and TextArea differently, so a single odd cell in a
    # column reads as a mistake even when the government's flag put it there
    # (placement guide §8: normalise per table, to whichever the majority already
    # is — not globally, since a column of dates is legitimately single-line).
    # Only a lone dissenter is overruled; a column that is genuinely split is left
    # alone and reported.
    forced = {}
    for run in G.column_runs(fields):
        kinds = collections.Counter(f["type"] for f in run)
        if len(kinds) != 2:
            continue
        (major, _n), (minor, m) = kinds.most_common()
        if m != 1:
            continue
        for f in run:
            if f["type"] == minor:
                forced[id(f)] = major
                notes.append((doc_id, f["page"],
                              f"one {minor} in a column of {major}; normalised"))

    # --- flat sources: share a rule fairly rather than each taking all of it ---
    share, keep_width = {}, set()
    if inferred:
        by_rule = collections.defaultdict(list)
        for f in fields:
            a = anchors.get(id(f))
            if a and a[1]:
                by_rule[(f["page"], tuple(round(v, 1) for v in a[1]))].append(f)
        for (page_no, rule), members in by_rule.items():
            if len(members) < 2:
                continue
            split = _partition(rule, members, pages[page_no]["vlines"])
            if split is None:
                for f in members:
                    keep_width.add(id(f))
                notes.append((doc_id, page_no,
                              f"{len(members)} overlapping boxes share the rule at "
                              f"y={rule[0]:.0f}; widths left as built"))
                continue
            for f, span in split:
                share[id(f)] = span

    kept, changed, dropped = [], 0, 0
    for f in fields:
        a = anchors.get(id(f))
        if a is None:
            kept.append(f)
            continue
        pg, rule, cell = a
        before = original[id(f)]
        x0, y0, x1, y1 = G.box(f)

        # A heavy rule that divides the form into sections is not a writing line, and
        # a box seated on one is a stray. But a table's closing border is heavy too,
        # and Form 13C's totals row sits on exactly that — so the test is not the
        # rule alone: a real blank has its caption, its `$`, or *something* printed
        # on its own line. A divider has an empty band above it.
        # A signature line never gets a box (placement guide §5). Only the inferred
        # sources can put one there — an AcroForm form's widgets are the government's.
        # Test where the field will *land*, not where it currently sprawls: a flat
        # box that spans its own rule and the signature rule beside it is about to be
        # pulled back onto the first of the two, and is not a signature field at all.
        if inferred and (y1 - y0) < BLOCK_MIN and rule:
            sx0, sx1 = share.get(id(f), (rule[1], rule[2]))
            landing = dict(f, x=sx0, y=rule[0] - SEAT_GAP - STD,
                           width=(sx1 - sx0) * SCALE, height=STD * SCALE)
            if G.on_signature_line(landing, pg["ink"]):
                dropped += 1
                continue

        # A field's shape: the government's multiline flag where we have it (that is
        # what produced TextArea at build time), otherwise the size of the drawn cell.
        want = forced.get(id(f))
        if want:
            # A lone dissenter in a table column takes the column's shape, and the
            # geometry follows from that below.
            f["type"] = want
        if acro:
            # The government's own multiline flag produced TextArea at build time, so
            # it is ground truth for shape — but only where the rectangle agrees with
            # it. The user's rule is about the printed blank: "on an underline, the
            # standard box; open white space, a block, several lines, a text area."
            # So the two disagreements both resolve towards the rectangle: a
            # multiline flag on a one-line box is a single-line blank, and a
            # single-line flag on a box tall enough to hold a paragraph, with no rule
            # under it, is a writing block (Form 34D's is 427 pt).
            # A flagged writing block stays one even though its foot is a printed
            # rule — a ruled block is still a block, and squashing those to one line
            # would destroy 553 genuine writing areas.
            block = (y1 - y0) >= BLOCK_MIN and (f["type"] == "TextArea" or not rule)
            if want:
                block = want == "TextArea"
            if f["type"] == "TextArea" and not block:
                f["type"] = "TextField"
            elif f["type"] == "TextField" and block:
                f["type"] = "TextArea"
        else:
            # No government flag to read on an inferred source, so the drawn cell
            # decides. What matters is the cell's *writing area* — what is left once
            # the caption Ontario prints inside the cell is taken off the top. The
            # Court File Number cell is 28 pt tall but its caption occupies the first
            # ten, so it holds one line and not a paragraph.
            #
            # This must not depend on the field's current geometry: once a block has
            # been grown to fill its cell, the cell's own bottom border comes into
            # seating range, and a geometry-dependent test would flip it back to a
            # single line on the next run, and back again (guide §7.9).
            if cell:
                cap = G.ink_below_top(cell[0], cell[1], cell[2], cell[3], pg["glyphs"])
                write_top = max(cell[1], cap + 1.0) if cap is not None else cell[1]
                cell = (cell[0], write_top, cell[2], cell[3])
            # Require room for a block *after* the 1 pt inset the fill leaves, so the
            # box this produces still reads as a block to `check_seating.py`.
            in_cell = bool(cell) and (cell[3] - cell[1]) >= BLOCK_MIN + 2.0
            # A tall box over open paper with no rule under it is a writing area, not
            # a line — that is what `place_open_blanks.py` puts under a caption, and
            # calling it a TextField here would flatten every one of them.
            open_block = not rule and not cell and (y1 - y0) >= BLOCK_MIN
            block = in_cell or open_block
            if want:
                block = want == "TextArea"
            f["type"] = "TextArea" if block else "TextField"
            if open_block:
                kept.append(f)
                continue
            if cell and not block and not open_block:
                # A single line in a cell sits on the cell's own bottom border, and
                # starts past the caption printed at the head of the cell — Form 13C
                # sets "Full legal name:", "Address:", "Email:" inside the cell they
                # label (guide §3).
                lx0, lx1 = cell[0] + 1.0, cell[2] - 1.0
                edge = G.ink_right_edge(lx0, lx1, cell[3] - SEAT_GAP - STD,
                                        cell[3] - SEAT_GAP, pg["glyphs"])
                if edge is not None and edge + 1.5 < lx1 - 4:
                    lx0 = edge + 1.5
                f["x"] = round(lx0, 2)
                f["width"] = round((lx1 - lx0) * SCALE, 2)
                f["y"] = round(cell[3] - SEAT_GAP - STD, 2)
                f["height"] = round(STD * SCALE, 2)
                if geometry_of(f) != before:
                    changed += 1
                kept.append(f)
                continue

        if block:
            # An AcroForm writing block keeps the government's own rectangle: it is
            # ground truth, and growing it to the cell walks it onto the ruled
            # writing lines drawn *inside* the block (Form 29's three panels).
            # An inferred block has no such authority, so it fills its drawn cell.
            if inferred and cell and (cell[3] - cell[1]) >= BLOCK_MIN:
                f["x"] = round(cell[0] + 1.0, 2)
                f["y"] = round(cell[1] + 1.0, 2)
                f["width"] = round((cell[2] - cell[0] - 2.0) * SCALE, 2)
                f["height"] = round((cell[3] - cell[1] - 2.0) * SCALE, 2)
        elif rule:
            ry, rx0, rx1 = rule
            if inferred and id(f) not in keep_width:
                sx0, sx1 = share.get(id(f), (rx0, rx1))
                # The rule runs the width of its table row, so keep the box inside
                # the column its own line sits in...
                # Anchor the column search on the box's left edge, not its centre:
                # the edge stays inside the same column after the snap, so a second
                # run reaches the same answer, while a centre moves with the box.
                sx0, sx1 = G.column_bounds((sx0, sx1), x0, (y0 + y1) / 2, pg["vlines"])
                # ...and start it past whatever is printed at the head of the cell —
                # a `$` glyph, or a caption like "Address:" (guide §3 and §4).
                edge = G.ink_right_edge(sx0, sx1, ry - SEAT_GAP - STD, ry - SEAT_GAP,
                                        pg["glyphs"])
                if edge is not None and edge + 1.5 < sx1 - 4:
                    sx0 = edge + 1.5
                # ...and stop it before the tail of the sentence, where Word drew the
                # underline the full width of the line and set words over its end.
                tail = G.ink_left_edge(sx0, sx1, ry - SEAT_GAP - STD, ry - SEAT_GAP,
                                       pg["glyphs"])
                if tail is not None and tail - 1.5 > sx0 + 4:
                    sx1 = tail - 1.5
                if sx1 - sx0 >= 4:
                    f["x"] = round(sx0 + EDGE_INSET, 2)
                    f["width"] = round((sx1 - sx0 - 2 * EDGE_INSET) * SCALE, 2)
            f["y"] = round(ry - SEAT_GAP - STD, 2)
            f["height"] = round(STD * SCALE, 2)
            _clear_ink_above(f, pg, doc_id, notes)
        elif cell and (cell[3] - cell[1]) < BLOCK_MIN:
            # A short cell with no rule of its own: sit on the cell's bottom border.
            f["y"] = round(cell[3] - SEAT_GAP - STD, 2)
            f["height"] = round(STD * SCALE, 2)
            _clear_ink_above(f, pg, doc_id, notes)
        else:
            # Nothing printed to place it against. Drop it only if it is a single
            # line: that is what the Word export's en-space padding produces. A tall
            # box over open paper is a writing area — either one `place_open_blanks.py`
            # put under a caption, or a genuine block — and deleting those would undo
            # that tool every time this one ran.
            if inferred and (y1 - y0) < BLOCK_MIN and not _has_context(f, pg):
                dropped += 1
                continue
            notes.append((doc_id, f["page"],
                          f"no rule or cell under box [{x0:.0f},{y0:.0f} {x1:.0f},{y1:.0f}]"))

        if geometry_of(f) != before:
            changed += 1
        kept.append(f)

    data["staticFields"] = kept
    return data, changed, dropped


def _has_context(f, pg, reach=20.0):
    """Is there anything printed near this box that it could belong to?

    A placeholder run with no rule, no cell, no shading and no ink beside it is the
    Word export's padding, not a blank a lawyer fills in (HANDOFF.md §3, the stray
    box at the foot of Form 25C).
    """
    x0, y0, x1, y1 = G.box(f)
    for sx0, sy0, sx1, sy1 in pg["shaded"]:
        if sx0 < x1 and sx1 > x0 and sy0 < y1 + 2 and sy1 > y0 - 2:
            return True
    for wx0, wy0, wx1, wy1, _t in pg["ink"]:
        if wx1 > x0 - reach and wx0 < x1 + reach and wy1 > y0 - reach and wy0 < y1 + reach:
            # Ink on the box's own line means it is a blank in running text.
            if abs((wy0 + wy1) / 2 - (y0 + y1) / 2) < 6:
                return True
    return False


NON_GEOMETRY = None  # every key that is not x/y/width/height/type


def diff_non_geometry(old, new):
    """Every key except geometry must survive byte-identically (guide §7.8)."""
    geo = {"x", "y", "width", "height", "type"}
    bad = []
    old_by_id = {f["id"]: f for f in old}
    for f in new:
        o = old_by_id.get(f["id"])
        if o is None:
            bad.append((f["id"], "field id appeared"))
            continue
        for k in set(o) | set(f):
            if k in geo:
                continue
            if o.get(k) != f.get(k):
                bad.append((f["id"], k))
    return bad


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="write the templates")
    ap.add_argument("--only", nargs="*", help="restrict to these docIds")
    ap.add_argument("--export", default=on_scope.EXPORT)
    args = ap.parse_args()

    targets = args.only or on_scope.NEW_DOCIDS
    outside = [d for d in targets if d not in on_scope.NEW_DOCIDS]
    if outside:
        sys.exit(f"refusing: {outside} are outside the 90 new Ontario templates")

    before = on_scope.snapshot(args.export)
    notes, total, total_dropped, per_form = [], 0, 0, []
    for doc_id in targets:
        old = load(doc_id, args.export)["staticFields"]
        # Run to a fixed point. One pass is not always enough: a flat-sourced box can
        # start in the wrong column, so the first pass reads its column separators
        # from the wrong place and the second, now that the box has moved onto its
        # rule, reads them from the right one. Settling here rather than leaving the
        # caller to re-run keeps the tool idempotent (placement guide §7.9).
        pages = G.load_pages(os.path.join(args.export, doc_id + ".pdf"))
        data, changed, dropped = refit_form(doc_id, args.export, notes, pages=pages)
        for _ in range(4):
            probe = []
            data, again, more = refit_form(doc_id, args.export, probe, data=data, pages=pages)
            if not again and not more:
                break
            changed += again
            dropped += more
            notes = [n for n in notes if n[0] != doc_id] + probe
        else:
            notes.append((doc_id, 0, "geometry did not settle after 5 passes"))
        bad = diff_non_geometry(old, data["staticFields"])
        if bad:
            sys.exit(f"{doc_id}: non-geometry keys changed: {bad[:5]}")
        total += changed
        total_dropped += dropped
        if changed or dropped:
            per_form.append((doc_id, changed, dropped))
        if args.apply and (changed or dropped):
            path = os.path.join(args.export, doc_id + ".json")
            with open(path, "w") as fh:
                # indent=1 and no trailing newline: match how the templates were
                # written, so the diff shows the boxes that moved and nothing else.
                json.dump(data, fh, indent=1)

    for doc_id, changed, dropped in per_form:
        print(f"  {doc_id:12s} {changed:4d} re-seated" + (f", {dropped} dropped" if dropped else ""))
    print(f"\n{len(per_form)} forms, {total} fields re-seated, {total_dropped} strays dropped"
          f"{'' if args.apply else '  (dry run — pass --apply)'}")

    if notes:
        print(f"\n{len(notes)} fields left for a human to place:")
        by_form = collections.Counter(n[0] for n in notes)
        for doc_id, n in by_form.most_common():
            print(f"  {doc_id:12s} {n}")

    if args.apply:
        changed_protected = on_scope.check_scope(before, args.export)
        if changed_protected:
            sys.exit(f"SCOPE VIOLATION: {changed_protected}")
        print("\nscope check: the approved 45 ON and 43 BC templates are unchanged")


if __name__ == "__main__":
    main()

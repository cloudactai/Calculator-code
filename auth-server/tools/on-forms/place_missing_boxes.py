"""Fill in the blanks the build produced no box for at all.

`place_flat_fields.py` emits one box per Word field, and a Word form routinely draws
a row of blanks as a single field followed by plain underlines — so the first column
gets a box and the rest of the row gets nothing. Every report of a "missing text box"
in this batch was that shape:

* **Form 34G.1** p1 — "Full legal name / Date of birth / Sex / Birth registration
  number" is four ruled blanks on one line, and only the first had a box.
* **Form 34H** p1 item 2 — the same four columns, same fault.
* **Form 25C** — "the parents of the person are (full legal name of parents)" is two
  ruled blanks side by side; the second parent had nowhere to type.
* **Form 25C** — the Court File Number cell, and the five columns of the "person to
  be adopted" table, which shared one box laid across the lot.

Three rules, each anchored on something printed:

**A bare rule beside a ruled blank that does have a box gets one too.** The sibling
is the evidence: the government drew both lines at the same height for the same
purpose, so if one of them is fillable they both are. This is the placement guide's
"where a form repeats a block, diff the copies" (§8) turned into a rule.

Empty *cells* — Form 25C's adoption table, Form 34H's charge tables — are a separate
job and not done here.

Signature lines are skipped (guide §5), and so are heavy section dividers. Like
`place_open_blanks.py` this adds fields, so it is separate from `refit_on_fields.py`,
which asserts the field set never changes. Run it before the refit, which then seats
everything it produced.

    python3 place_missing_boxes.py                 # dry run
    python3 place_missing_boxes.py --apply
    python3 place_missing_boxes.py --only Form25C --verbose
"""

import argparse
import collections
import json
import os
import sys

import on_scope
import page_geom as G

SCALE = G.SCALE
STD = G.STD_LINE
SEAT_GAP = G.SEAT_GAP
BLOCK_MIN = 22.0
MIN_RULE = 24.0        # a rule shorter than this is a tick or a leader, not a blank
ROW_TOL = 1.5          # rules this close in y are the same printed line

# Form 13C page 4 is held back. Its grid reads differently depending on where you
# start, and boxing its empty cells leaves `refit_on_fields.py` flipping fields
# between a line and a block on every run. Anchoring `enclosing_cell` on a box's
# bottom edge rather than its centre was expected to cure this and did not, so the
# real cause is still unidentified; the page needs reading by hand.
HELD_BACK = {"Form13C"}


def _boxes_on(rule, fields, page_no):
    """Fields sitting on this rule."""
    ry, rx0, rx1 = rule
    out = []
    for f in fields:
        if f["page"] != page_no:
            continue
        x0, _y0, x1, y1 = G.box(f)
        if abs(y1 + SEAT_GAP - ry) > 4.0 and not (ry - 6 <= y1 <= ry + 8):
            continue
        if min(x1, rx1) - max(x0, rx0) > 0.35 * min(x1 - x0, rx1 - rx0):
            out.append(f)
    return out


def _template(fields, page_no, kind="TextField"):
    """Copy the styling the form already uses, so a new box matches its siblings."""
    match = next((f for f in fields if f["page"] == page_no and f["type"] == kind), None)
    match = match or next((f for f in fields if f["type"] in ("TextField", "TextArea")), None)
    base = {"value": "", "fontSize": 9, "color": [0, 0, 0],
            "background": "none", "border": "none"}
    if match:
        for k in base:
            if k in match:
                base[k] = match[k]
    base["value"] = ""
    return base


def _cell_of(x0, y0, x1, y1, rules, vlines):
    probe = {"x": x0, "y": y0, "width": (x1 - x0) * SCALE, "height": (y1 - y0) * SCALE}
    return G.enclosing_cell(probe, rules, vlines)


def find_missing(doc_id, export):
    with open(os.path.join(export, doc_id + ".json")) as fh:
        fields = json.load(fh)["staticFields"]
    pages = G.load_pages(os.path.join(export, doc_id + ".pdf"))
    added, splits = [], []

    for page_no, pg in pages.items():
        rules = [r for r in pg["rules"] if r[2] - r[1] >= MIN_RULE
                 and not G.on_dark_bar(r, pg["bars"])]

        # --- 1. a bare rule beside a ruled blank that has a box -----------------
        rows = collections.defaultdict(list)
        for r in rules:
            rows[round(r[0] / ROW_TOL)].append(r)
        for members in rows.values():
            if len(members) < 2:
                continue
            filled = [r for r in members if _boxes_on(r, fields, page_no)]
            bare = [r for r in members if not _boxes_on(r, fields, page_no)]
            if not filled or not bare:
                continue
            model = filled[0]
            for ry, rx0, rx1 in bare:
                probe = {"x": rx0, "y": ry - SEAT_GAP - STD,
                         "width": (rx1 - rx0) * SCALE, "height": STD * SCALE,
                         "type": "TextField", "page": page_no}
                if G.on_signature_line(probe, pg["ink"]) or \
                        G.on_role_line(probe, pg["ink"]):
                    continue
                # Never lay a box over the government's own words. Rules at the same
                # height are not always siblings: the party panel's interior dividers
                # line up with the Judge line beside them, and the panel's caption is
                # printed just above the divider, so the "sibling" evidence is bogus
                # there and the box would land on the caption.
                bx0, by0, bx1, by1 = rx0, ry - SEAT_GAP - STD, rx1, ry - SEAT_GAP
                # Not inside a box that already exists. A writing block's foot can be
                # a couple of points clear of the rule, so it does not read as sitting
                # *on* it, but dropping a second field inside it stacks the two.
                if any(f["page"] == page_no
                       and min(bx1, G.box(f)[2]) - max(bx0, G.box(f)[0]) > 2
                       and min(by1, G.box(f)[3]) - max(by0, G.box(f)[1]) > 2
                       for f in fields):
                    continue
                if sum(1 for g in pg["glyphs"]
                       if min(bx1, g[2]) - max(bx0, g[0]) > 0.5 * (g[2] - g[0])
                       and min(by1, g[3]) - max(by0, g[1]) > 0.3 * (g[3] - g[1])) >= 3:
                    continue
                added.append({"page": page_no, "x": round(rx0 + 0.25, 2),
                              "y": round(ry - SEAT_GAP - STD, 2),
                              "w": round(rx1 - rx0 - 0.5, 2), "h": STD,
                              "type": "TextField",
                              "why": f"bare rule beside a filled one at y={model[0]:.0f}"})

        # --- 2. an empty drawn cell --------------------------------------------
        # A cell with four borders, nothing in it and nothing printed inside it is a
        # blank by construction — Form 25C's adoption table shares one box across five
        # columns, and Form 34H's charge tables carry boxes in the middle column only.
        for cx0, cy0, cx1, cy1 in G.cell_grid(pg["rules"], pg["vlines"]):
            if cx1 - cx0 < MIN_RULE or cy1 - cy0 < 10:
                continue
            if any(f["page"] == page_no
                   and min(cx1, G.box(f)[2]) - max(cx0, G.box(f)[0]) > 2
                   and min(cy1, G.box(f)[3]) - max(cy0, G.box(f)[1]) > 2
                   for f in fields):
                continue
            # The same function the refit uses to size a box inside a cell. It
            # returns None when the cell has printing of its own, which is what keeps
            # this off header rows and label cells.
            space = G.cell_writing_box((cx0, cy0, cx1, cy1), pg["glyphs"])
            if space is None:
                continue
            probe = {"x": cx0, "y": space[0], "width": (cx1 - cx0) * SCALE,
                     "height": (space[1] - space[0]) * SCALE,
                     "type": "TextField", "page": page_no}
            if G.on_signature_line(probe, pg["ink"]) or G.on_role_line(probe, pg["ink"]):
                continue
            # Only place where the grid walk and `enclosing_cell` agree on the cell.
            # The two read a grid differently — one outward from a pair of vertical
            # lines, the other from a field's own centre — and on Form 13C p4 they
            # disagreed by a factor of three, so the refit kept re-deciding how tall
            # the new box should be and the pass never settled.
            back = G.enclosing_cell(probe, pg["rules"], pg["vlines"])
            if not back or abs(back[1] - cy0) > 2.0 or abs(back[3] - cy1) > 2.0:
                continue
            added.append({
                "page": page_no, "x": round(cx0 + 1.0, 2), "y": round(space[0], 2),
                "w": round(cx1 - cx0 - 2.0, 2), "h": round(space[1] - space[0], 2),
                "type": "TextField", "why": "empty drawn cell"})

        # --- 3. an instruction that says the name goes below it -----------------
        # Ontario's jurat prints "(Type or print name below if signature is
        # illegible.)" under the commissioner's signature line, and then leaves the
        # paper blank. The instruction is the anchor and it is explicit about where:
        # below itself, in the column of the line it is talking about.
        rows = collections.defaultdict(list)
        for g in pg["glyphs"]:
            rows[round(g[3], 1)].append(g)
        for key in sorted(rows):
            line = sorted(rows[key], key=lambda g: g[0])
            text = "".join(g[4] for g in line).lower()
            if "namebelow" not in text:
                continue
            lx0, lx1, ly1 = line[0][0], line[-1][2], key
            # The instruction may wrap; take the bottom of its last line.
            for k2 in sorted(rows):
                if key < k2 < key + 26 and rows[k2][0][0] > lx0 - 60:
                    ly1 = max(ly1, k2)
            above = [r for r in pg["rules"]
                     if r[0] < key - 8 and min(lx1, r[2]) - max(lx0, r[1]) > 0]
            if not above:
                continue
            col = max(above, key=lambda r: r[0])
            below = min([g[1] for g in pg["glyphs"] if g[1] > ly1 + 2]
                        + [r[0] for r in pg["rules"] if r[0] > ly1 + 2]
                        + [pg["rect"].height - 30.0])
            if below - ly1 < STD + 6:
                continue
            top = ly1 + 3.0
            if any(f["page"] == page_no
                   and min(col[2], G.box(f)[2]) - max(col[1], G.box(f)[0]) > 2
                   and min(top + STD, G.box(f)[3]) - max(top, G.box(f)[1]) > 2
                   for f in fields):
                continue
            added.append({"page": page_no, "x": round(col[1] + 0.25, 2),
                          "y": round(top, 2), "w": round(col[2] - col[1] - 0.5, 2),
                          "h": STD, "type": "TextField",
                          "why": "an instruction saying the name goes below it"})

    # The Court File Number cell is both a bare rule beside a filled one and an empty
    # drawn cell, so it is found twice; keep the first and drop anything overlapping.
    unique = []
    for a in added:
        ax0, ay0 = a["x"], a["y"]
        ax1, ay1 = ax0 + a["w"], ay0 + a["h"]
        if any(u["page"] == a["page"]
               and min(ax1, u["x"] + u["w"]) - max(ax0, u["x"]) > 2
               and min(ay1, u["y"] + u["h"]) - max(ay0, u["y"]) > 2
               for u in unique):
            continue
        unique.append(a)
    return fields, unique, splits


def apply_changes(doc_id, export, do_write):
    fields, added, splits = find_missing(doc_id, export)
    if not added and not splits:
        return 0, 0, [], []
    next_id = max((f["id"] for f in fields), default=1750000000000) + 1

    for s in splits:
        f = s["field"]
        first, *rest = s["spans"]
        f["x"] = round(first[0] + 0.5, 2)
        f["width"] = round((first[1] - first[0] - 1.0) * SCALE, 2)
        for lo, hi in rest:
            rec = {"id": next_id, "type": f["type"], "x": round(lo + 0.5, 2),
                   "y": f["y"], "width": round((hi - lo - 1.0) * SCALE, 2),
                   "height": f["height"]}
            rec.update(_template(fields, s["page"], f["type"]))
            rec["page"] = s["page"]
            fields.append(rec)
            next_id += 1

    for a in added:
        rec = {"id": next_id, "type": a["type"], "x": a["x"], "y": a["y"],
               "width": round(a["w"] * SCALE, 2), "height": round(a["h"] * SCALE, 2)}
        rec.update(_template(fields, a["page"], a["type"]))
        rec["page"] = a["page"]
        fields.append(rec)
        next_id += 1

    if do_write:
        with open(os.path.join(export, doc_id + ".json"), "w") as fh:
            json.dump({"staticFields": fields}, fh, indent=1)
    return len(added), sum(len(s["spans"]) - 1 for s in splits), added, splits


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--export", default=on_scope.EXPORT)
    args = ap.parse_args()

    targets = [d for d in (args.only or on_scope.NEW_DOCIDS) if d not in HELD_BACK]
    outside = [d for d in targets if d not in on_scope.NEW_DOCIDS]
    if outside:
        sys.exit(f"refusing: {outside} are outside the 90 new Ontario templates")

    before = on_scope.snapshot(args.export)
    tot_add, tot_split = 0, 0
    for doc_id in targets:
        # Run to a fixed point. Boxing a bare rule turns it into a *filled* rule, so
        # its own bare siblings become candidates on the next pass — Form 13C's
        # tables settle two passes in. Left to the caller this would need re-running
        # by hand, and the tool has to be idempotent (placement guide §7.9).
        n = m = 0
        added, splits = [], []
        for _ in range(6):
            dn, dm, dadded, dsplits = apply_changes(doc_id, args.export, args.apply)
            n += dn
            m += dm
            added += dadded
            splits += dsplits
            if not args.apply or (not dn and not dm):
                break
        if not n and not m:
            continue
        tot_add += n
        tot_split += m
        print(f"  {doc_id:12s} {n} box(es)" + (f", {m} from splitting a cell-spanning box" if m else ""))
        if args.verbose:
            for a in added:
                print(f"      p{a['page']} {a['type']:9s} {a['w']:.0f}x{a['h']:.0f} "
                      f"at ({a['x']:.0f},{a['y']:.0f})  — {a['why']}")
            for s in splits:
                print(f"      p{s['page']} split into {len(s['spans'])} cells")
    print(f"\n{tot_add} boxes added, {tot_split} from splits"
          f"{'' if args.apply else '  (dry run — pass --apply)'}")
    if args.apply:
        bad = on_scope.check_scope(before, args.export)
        if bad:
            sys.exit(f"SCOPE VIOLATION: {bad}")
        print("scope check: the approved 45 ON and 43 BC templates are unchanged")


if __name__ == "__main__":
    main()

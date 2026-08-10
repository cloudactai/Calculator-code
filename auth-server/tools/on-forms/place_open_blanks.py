"""Give a box to the answer areas that are bare white space on the government page.

Most blanks on these forms are a printed rule — a line the government drew for you
to write on — and `refit_on_fields.py` sits a box on each one. Some are not: the page
prints a question ending in a colon and then simply leaves paper. There is no rule,
no shading and no cell to measure against, so the build's golden rule ("never guess —
read the government's own page") left them with no box at all, and a lawyer cannot
type in them. Twenty-odd of those across the Word-sourced forms, including things as
central as Form 43's "Provide a brief summary of why you believe a binding judicial
dispute resolution hearing would be an effective way to resolve the issues".

The placement guide (§6) says how to place one by hand, and every edge it asks for is
readable here:

* **The top** is the last line of the caption that introduces the area.
* **The bottom** is whatever prints next — the next line of type, the next rule, or
  the foot of the page's text column.
* **The column** comes from a box the form already has of the same kind, so the new
  box lines up with the rest of the page rather than with the margins.

This tool *adds* fields, so it is deliberately separate from `refit_on_fields.py`,
which asserts the field set never changes — a tool guarding that cannot be the one
that changes it (guide §7.8). Run this first, then the refit.

    python3 place_open_blanks.py                 # dry run
    python3 place_open_blanks.py --apply
    python3 place_open_blanks.py --only Form43 --apply
"""

import argparse
import collections
import json
import os
import sys

import on_scope
import page_geom as G

SCALE = G.SCALE

MIN_BAND = 20.0      # shallower than this is line spacing, not a writing area
MAX_BAND = 260.0     # deeper than this is the end of the page, not a blank
FOOTER_GAP = 40.0    # ignore anything inside the page's bottom margin
CAPTION_END = (":", "?")


def _lines(pg):
    """Printed lines as (y0, y1, x0, x1, text), top to bottom."""
    rows = collections.defaultdict(list)
    for g in pg["glyphs"]:
        rows[round(g[3], 1)].append(g)
    out = []
    for _key, gs in rows.items():
        gs.sort(key=lambda g: g[0])
        out.append((min(g[1] for g in gs), max(g[3] for g in gs),
                    gs[0][0], gs[-1][2], "".join(g[4] for g in gs)))
    out.sort()
    return out


def _strip_hint(text):
    """Drop a trailing parenthetical, so "…as follows: (For each order, …)" reads
    as the caption it is.

    The hint may also run off the end of the line and close two lines later — Form
    34H p2 sets "the outstanding order(s) is/are as follows: (For each order, give
    the name of the court, date of order, name of judge," — so an unclosed bracket
    is cut too, otherwise the line reads as ending in a comma and the writing area
    below it is never found.
    """
    body = text.strip()
    while body.endswith(")") and "(" in body:
        body = body[:body.rindex("(")].strip()
    if body.count("(") > body.count(")"):
        body = body[:body.rindex("(")].strip()
    return body


MIN_CAPTION = 18     # a question is a sentence; "TOTAL 5:" is a table label


def _is_caption(text, before=""):
    body = _strip_hint(text)
    if not body.endswith(CAPTION_END):
        return False
    # A long question wraps, so its last line can be as short as "reasons:". Measure
    # the paragraph, not the line — otherwise Form 43B loses two real writing areas.
    body = (before.strip() + " " + body).strip() if before else body
    # Strip the item number so "9. I ask that…" is measured on its words.
    words = body.rstrip(":?").split()
    if words and words[0].rstrip(".").replace("(", "").replace(")", "").isalnum() \
            and any(c.isdigit() for c in words[0]):
        words = words[1:]
    return len(" ".join(words)) >= MIN_CAPTION


def _is_hint(text, depth=0):
    """Is this line a bracketed instruction rather than prose?

    A hint is a *complete* parenthetical — "(For each parent, state his or her full
    legal name…)" — or the start of one that closes on a later line. A numbered
    sub-clause like "(b) that this form may be filed with the court" also opens with a
    bracket, but closes it immediately and runs on as prose. Both tests below turn on
    that difference, so they share this one definition.
    """
    stripped = text.strip()
    if not stripped.startswith("("):
        return False
    after = depth + stripped.count("(") - stripped.count(")")
    return after > 0 or stripped.endswith(")")


def _absorb_hint(lines, idx, y1, lx0, reach=16.0):
    """Extend past the parenthetical hint lines that belong to this caption."""
    depth = lines[idx][4].count("(") - lines[idx][4].count(")")
    j = idx
    while j + 1 < len(lines):
        ny0, ny1, nx0, _nx1, ntext = lines[j + 1]
        if ny0 - y1 > reach:
            break
        if depth <= 0 and not _is_hint(ntext):
            break
        depth += ntext.count("(") - ntext.count(")")
        y1, lx0, j = ny1, min(lx0, nx0), j + 1
    return y1, lx0


def _column(fields, page_no, pg):
    """The left/right edges of this page's text column.

    A writing area should be as wide as the page's own type, not as wide as whatever
    single-line blank happens to be the biggest box on the page — Form 34G.1's
    stopped 140 pt short of the margin because it copied the width of a "name of
    person(s)" field. So the column is measured from the printed text, and an
    existing wide box can only widen it further.

    The footer ("FLR 34G.1 (March 1, 2018)    Page 3 of 3") is set to the full sheet
    width and would stretch the column past the margin, so it is left out.
    """
    body_bottom = pg["rect"].height - FOOTER_GAP
    ink = [g for g in pg["glyphs"] if g[3] < body_bottom]
    if not ink:
        return None
    left, right = min(g[0] for g in ink), max(g[2] for g in ink)
    wide = [f for f in fields
            if f["page"] == page_no and f["type"] in ("TextField", "TextArea")
            and f["width"] / SCALE > 200]
    if wide:
        left = min(left, min(f["x"] for f in wide))
        right = max(right, max(f["x"] + f["width"] / SCALE for f in wide))
    return (left, right)


def _covered(x0, y0, x1, y1, fields, page_no):
    for f in fields:
        if f["page"] != page_no:
            continue
        fx0, fy0, fx1, fy1 = G.box(f)
        if min(x1, fx1) - max(x0, fx0) > 0 and min(y1, fy1) - max(y0, fy0) > 2:
            return True
    return False


def find_blanks(doc_id, export):
    """Every caption-then-white-space area on this form that has no box."""
    with open(os.path.join(export, doc_id + ".json")) as fh:
        fields = json.load(fh)["staticFields"]
    pages = G.load_pages(os.path.join(export, doc_id + ".pdf"))
    found, widened = [], []

    for page_no, pg in pages.items():
        lines = _lines(pg)
        if not lines:
            continue
        column = _column(fields, page_no, pg)
        if column is None:
            continue
        col_x0, col_x1 = column
        page_bottom = pg["rect"].height - FOOTER_GAP
        # The footer line ("FLR 43 (September 24, 2024)   Page 1 of 4") is printed at
        # the very bottom; anything at or below it closes a band.
        stops = sorted([ln[0] for ln in lines] + [r[0] for r in pg["rules"]]
                       + [s[1] for s in pg["shaded"]] + [page_bottom])

        for idx, (y0, y1, lx0, lx1, text) in enumerate(lines):
            prev = lines[idx - 1] if idx else None
            before = prev[4] if prev and y0 - prev[1] < 16 else ""
            if not _is_caption(text, before):
                continue
            # A caption with other type printed to its right is a margin label, and
            # what it labels is beside it, not beneath it — Form 33D sets "WE AGREE:"
            # in the margin against the clauses it introduces.
            if any(ly0 < y1 and ly1 > y0 and lnx0 > lx1 + 2 and not _is_hint(lt)
                   for ly0, ly1, lnx0, _lnx1, lt in lines):
                continue
            # The guide's own recorded false positive (§6): the field sits *beside*
            # the caption, not under it. "Telephone number:" on Form 6C already has
            # its box on the same line, and the space below it is just the foot of
            # the page.
            if any(f["page"] == page_no and f["type"] in ("TextField", "TextArea")
                   and G.box(f)[3] > y0 - 2 and G.box(f)[1] < y1 + 2
                   and G.box(f)[2] > lx1 - 4
                   for f in fields):
                continue
            # The caption often carries a parenthetical hint — "(Explain any child's
            # special needs and how they should be addressed…)" — on the next line or
            # the next two. That hint belongs to the caption, not to the answer, so
            # the writing area starts below the whole of it.
            y1, lx0 = _absorb_hint(lines, idx, y1, lx0)
            # Where does the next printed thing start?
            below = [s for s in stops if s > y1 + 1.5]
            if not below:
                continue
            band_top, band_bottom = y1 + 2.0, min(below[0] - 2.0, y1 + 2.0 + MAX_BAND)
            height = band_bottom - band_top
            if height < MIN_BAND:
                continue
            # Indent the box to the caption's own left edge where that is further in
            # than the page column — a sub-question keeps its indent.
            x0 = max(col_x0, min(lx0, col_x1 - 120))
            here = [f for f in fields if f["page"] == page_no
                    and f["type"] == "TextArea"
                    and min(col_x1, G.box(f)[2]) - max(x0, G.box(f)[0]) > 0
                    and min(band_bottom, G.box(f)[3]) - max(band_top, G.box(f)[1]) > 2]
            if len(here) == 1 and here[0]["width"] / SCALE < (col_x1 - x0) - 8:
                # An area this tool placed on an earlier run, before the column was
                # measured from the page's own type. Widen it in place rather than
                # skipping the band and leaving it short.
                here[0]["x"] = round(x0, 2)
                here[0]["width"] = round((col_x1 - x0) * SCALE, 2)
                widened.append({"page": page_no, "caption": _strip_hint(text)[:60]})
                continue
            if _covered(x0, band_top, col_x1, band_bottom, fields, page_no):
                continue
            # Not inside a table: a column separator running through the band means
            # this is a grid of cells, and each cell wants its own box rather than
            # one box laid across the lot.
            if any(x0 + 2 < v[0] < col_x1 - 2 and v[1] < band_bottom and v[2] > band_top
                   for v in pg["vlines"]):
                continue
            found.append({
                "page": page_no, "x": round(x0, 2), "y": round(band_top, 2),
                "w": round(col_x1 - x0, 2), "h": round(height, 2),
                "caption": _strip_hint(text)[:70],
            })
    return fields, found, widened


def _template(fields, page_no):
    """Copy the styling the form already uses, so a new box matches its siblings."""
    for f in fields:
        if f["page"] == page_no and f["type"] == "TextArea":
            break
    else:
        f = next((x for x in fields if x["type"] in ("TextField", "TextArea")), None)
    base = {"value": "", "fontSize": 9, "color": [0, 0, 0],
            "background": "none", "border": "none"}
    if f:
        for k in base:
            if k in f:
                base[k] = f[k]
    base["value"] = ""
    return base


def add_blanks(doc_id, export, apply_changes):
    fields, found, widened = find_blanks(doc_id, export)
    if not found and not widened:
        return 0, [], widened
    next_id = max((f["id"] for f in fields), default=1750000000000) + 1
    for b in found:
        rec = {"id": next_id, "type": "TextArea", "x": b["x"], "y": b["y"],
               "width": round(b["w"] * SCALE, 2), "height": round(b["h"] * SCALE, 2)}
        rec.update(_template(fields, b["page"]))
        rec["page"] = b["page"]
        fields.append(rec)
        next_id += 1
    if apply_changes:
        path = os.path.join(export, doc_id + ".json")
        with open(path, "w") as fh:
            json.dump({"staticFields": fields}, fh, indent=1)
    return len(found), found, widened


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--export", default=on_scope.EXPORT)
    args = ap.parse_args()

    targets = args.only or on_scope.NEW_DOCIDS
    outside = [d for d in targets if d not in on_scope.NEW_DOCIDS]
    if outside:
        sys.exit(f"refusing: {outside} are outside the 90 new Ontario templates")

    before = on_scope.snapshot(args.export)
    total = wide = 0
    for doc_id in targets:
        n, found, widened = add_blanks(doc_id, args.export, args.apply)
        if not n and not widened:
            continue
        total += n
        wide += len(widened)
        bits = []
        if n:
            bits.append(f"{n} writing area(s)")
        if widened:
            bits.append(f"{len(widened)} widened to the text column")
        print(f"  {doc_id:12s} " + ", ".join(bits))
        if args.verbose:
            for b in found:
                print(f"      p{b['page']} {b['w']:.0f}x{b['h']:.0f} at "
                      f"({b['x']:.0f},{b['y']:.0f})  after {b['caption']!r}")
    print(f"\n{total} writing areas placed, {wide} widened"
          f"{'' if args.apply else '  (dry run — pass --apply)'}")
    if args.apply:
        bad = on_scope.check_scope(before, args.export)
        if bad:
            sys.exit(f"SCOPE VIOLATION: {bad}")
        print("scope check: the approved 45 ON and 43 BC templates are unchanged")


if __name__ == "__main__":
    main()

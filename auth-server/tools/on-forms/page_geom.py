"""Printed-page geometry: the rules, cells and ink a field is supposed to sit on.

Everything here reads the *printed background* of a promoted template — the PDF in
`form-template-export/` after the widget layer has been stripped. That page is the
government's own artwork, so it is the ground truth the placement guide's golden rule
points at ("never guess — read the government's own page").

Coordinates are PDF points, y down, matching the overlay convention in `docs/FORMS.md`
(`field.x`/`field.y` = box left/top in points, `width`/`height` = points x 1.5).
"""

import fitz

SCALE = 1.5          # JSON stores width/height as points x 1.5
STD_LINE = 13.3      # the approved single-line box height, in points


# --------------------------------------------------------------------------- ink

def _segments(page):
    """Split every drawing into horizontal and vertical primitives."""
    horiz, vert = [], []
    for d in page.get_drawings():
        for it in d["items"]:
            kind = it[0]
            if kind == "l":
                p1, p2 = it[1], it[2]
                if abs(p1.y - p2.y) <= 0.6 and abs(p1.x - p2.x) >= 3:
                    horiz.append(((p1.y + p2.y) / 2, min(p1.x, p2.x), max(p1.x, p2.x)))
                elif abs(p1.x - p2.x) <= 0.6 and abs(p1.y - p2.y) >= 3:
                    vert.append(((p1.x + p2.x) / 2, min(p1.y, p2.y), max(p1.y, p2.y)))
            elif kind == "re":
                r = it[1]
                # A thin filled rectangle is how some producers draw a rule.
                if r.height <= 2.0 and r.width >= 3:
                    horiz.append((r.y1, r.x0, r.x1))
                elif r.width <= 2.0 and r.height >= 3:
                    vert.append((r.x1, r.y0, r.y1))
                elif d.get("fill") is not None and d.get("color") is None:
                    pass          # a solid panel, not a border; handled by shaded()
                else:
                    # a stroked box contributes all four of its borders
                    horiz.append((r.y0, r.x0, r.x1))
                    horiz.append((r.y1, r.x0, r.x1))
                    vert.append((r.x0, r.y0, r.y1))
                    vert.append((r.x1, r.y0, r.y1))
    return horiz, vert


def _merge(segs, pos_tol=1.5, gap_tol=2.0):
    """Merge collinear segments that touch or nearly touch.

    `pos_tol` has to absorb a double-struck border: LibreOffice draws each table
    border of Form 13C as two lines 1 pt apart, and left unmerged a field flips
    between the pair from one run to the next.

    The anchor stays put once a group is opened, so a chain of segments cannot creep
    away from where it started, and the group reports the *lowest* line — the one the
    eye reads as the bottom of the blank. Both make the merge order-independent, and
    the tool has to be idempotent (placement guide §7.9).
    """
    out = []
    for pos, a, b in sorted(segs):
        for m in out:
            if abs(m[0] - pos) <= pos_tol and a <= m[2] + gap_tol and b >= m[1] - gap_tol:
                m[3] = max(m[3], pos)
                m[1] = min(m[1], a)
                m[2] = max(m[2], b)
                break
        else:
            out.append([pos, a, b, pos])
    return [(m[3], m[1], m[2]) for m in out]


def hrules(page, min_len=12.0):
    """Horizontal printed rules as (y, x0, x1), longest-lived first."""
    horiz, _ = _segments(page)
    return [r for r in _merge(horiz) if r[2] - r[1] >= min_len]


def vrules(page, min_len=6.0):
    """Vertical printed lines as (x, y0, y1)."""
    _, vert = _segments(page)
    return [r for r in _merge(vert) if r[2] - r[1] >= min_len]


def shaded(page, lo=0.55, hi=0.99):
    """Light-grey filled rectangles — the 'writing area' shading."""
    out = []
    for d in page.get_drawings():
        fill = d.get("fill")
        if not fill:
            continue
        if not all(lo <= c <= hi for c in fill[:3]):
            continue
        r = d["rect"]
        if r.width >= 8 and r.height >= 6:
            out.append((r.x0, r.y0, r.x1, r.y1))
    return out


def dark_bars(page, level=0.35, min_h=1.5, min_w=60.0, thick=1.5):
    """The heavy rules that divide a form into sections — never a writing line.

    Two shapes of the same thing, and a box seated on either is a stray:

    * a **solid dark rectangle**, drawn as a filled block *plus* a stroked line along
      its top edge — and that stroke reads as a printed rule like any other. Form 43A
      ended up with a full-width box on the divider above "To be completed by the
      Court", where the page has no blank at all.
    * a **thick stroked line**. Form 34H rules its jurat off with a 2.25 pt stroke.
      Ontario's actual writing lines are 0.5 pt, and its heaviest table border is
      0.75, so anything at 1.5 pt or above is structural.
    """
    out = []
    for d in page.get_drawings():
        r = d["rect"]
        fill = d.get("fill")
        if fill and sum(fill[:3]) / 3.0 <= level and r.height >= min_h and r.width >= min_w:
            out.append((r.x0, r.y0, r.x1, r.y1))
            continue
        if d.get("color") is not None and (d.get("width") or 0) >= thick:
            for it in d["items"]:
                if it[0] != "l":
                    continue
                p1, p2 = it[1], it[2]
                if abs(p1.y - p2.y) <= 0.6 and abs(p1.x - p2.x) >= min_w:
                    y = (p1.y + p2.y) / 2
                    out.append((min(p1.x, p2.x), y - 0.8, max(p1.x, p2.x), y + 0.8))
    return out


def on_dark_bar(rule, bars, tol=1.5):
    """Is this 'rule' just the edge of a solid divider bar?"""
    ry, rx0, rx1 = rule
    for bx0, by0, bx1, by1 in bars:
        if by0 - tol <= ry <= by1 + tol and _overlap(rx0, rx1, bx0, bx1) > 0.5 * (rx1 - rx0):
            return True
    return False


def words(page):
    """Printed words as (x0, y0, x1, y1, text), blank-only tokens dropped.

    The flatten leaves runs of spaces where a widget's value used to be; those carry
    a rectangle but no ink, and treating them as printed content makes a blank line
    look occupied.
    """
    return [(w[0], w[1], w[2], w[3], w[4]) for w in page.get_text("words") if w[4].strip()]


def chars(page):
    """Printed characters as (x0, y0, x1, y1, ch), whitespace dropped.

    Word rectangles are too coarse for two jobs the placement guide calls out. A
    money cell flattens to the token `"$\\u2002\\u2002\\u2002\\u2002\\u2002"` — a `$`
    glyph followed by the en-space padding where the widget's value used to be — so
    the *word* rect spans the whole cell, and a box that correctly starts just after
    the `$` reads as covering it. Same story for a caption printed inside a cell.
    Read characters (guide §2: "find the glyph at character level, not word level").
    """
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", ()):
            for span in line.get("spans", ()):
                for ch in span.get("chars", ()):
                    if not ch["c"].strip():
                        continue
                    x0, y0, x1, y1 = ch["bbox"]
                    out.append((x0, y0, x1, y1, ch["c"]))
    return out


def ink_left_edge(x0, x1, y0, y1, glyphs, right_frac=0.45):
    """Left edge of anything printed in the right part of a box's own line.

    A Word export sometimes draws the underline the full width of the line and then
    sets the sentence's tail over its end — Form 34G.1 p3 prints ", and was" on the
    last 45 pt of the rule its date box snaps to. Symmetric to `ink_right_edge`:
    where that stops a box starting on a `$`, this stops it running past its blank.
    Returns None when the band is clear.
    """
    cy = (y0 + y1) / 2
    start = x0 + right_frac * (x1 - x0)
    edge = None
    for gx0, gy0, gx1, gy1, _c in glyphs:
        if not (gy0 - 1 <= cy <= gy1 + 1):
            continue
        if gx0 <= start or gx0 >= x1 + 0.5:
            continue
        edge = gx0 if edge is None else min(edge, gx0)
    return edge


def ink_right_edge(x0, x1, y0, y1, glyphs, left_frac=0.6):
    """Right edge of anything printed in the left part of a box's own line.

    The placement guide (§3, §4) wants a box's left edge to clear a printed `$` or a
    caption shaded behind it, rather than sit on top. Returns None when the band is
    clear.
    """
    cy = (y0 + y1) / 2
    limit = x0 + left_frac * (x1 - x0)
    edge = None
    for gx0, gy0, gx1, gy1, _c in glyphs:
        if not (gy0 - 1 <= cy <= gy1 + 1):
            continue
        if gx1 <= x0 - 0.5 or gx0 >= limit:
            continue
        edge = gx1 if edge is None else max(edge, gx1)
    return edge


def field_shade(field, shaded, slack=1.5):
    """The Word form-field rectangle this box sits in, or None.

    LibreOffice paints every `w:textInput` light grey, and where an export carries
    that marking the shade is the government's own field rectangle — the same
    authority an AcroForm widget carries, and the refit does not trim those either.
    It matters because a field the government pre-filled has its *value* printed
    inside that rectangle, flush with the left edge, and the caption rules would
    otherwise start the box after the government's own answer.

    Containment is horizontal, with the vertical only required to overlap. The refit
    re-cuts a single line to the standard height and seats it on its rule, which
    lifts the box's top clear of a 12.6 pt shade — so a test that wanted the whole
    box inside stopped matching after the first pass, and the box lost the very
    protection that had kept its width, on the second.
    """
    x0, y0, x1, y1 = box(field)
    for sx0, sy0, sx1, sy1 in shaded:
        if (sx0 - slack <= x0 and x1 <= sx1 + slack
                and min(y1, sy1) - max(y0, sy0) > 0.4 * (y1 - y0)):
            return (sx0, sy0, sx1, sy1)
    return None


def ink_below_top(x0, y0, x1, y1, glyphs, top_frac=0.55, cover=0.6):
    """Bottom of the printed caption a box starts on top of, or None.

    Ontario prints the caption *inside* the cell it labels — "Court File Number" sits
    at the top of its own box — and the government widget covers the whole cell, so
    the editor's input starts on the words. The placement guide (§3) says to nudge
    the box below the hint rather than start on it. Only ink in the box's top band
    counts, and only ink the box substantially covers, so a caption printed beside
    the box does not drag its top down.
    """
    band = y0 + top_frac * (y1 - y0)
    edge = None
    for gx0, gy0, gx1, gy1, _c in glyphs:
        if gy1 > band or gy0 < y0 - 0.5:
            continue
        if min(x1, gx1) - max(x0, gx0) < cover * (gx1 - gx0):
            continue
        edge = gy1 if edge is None else max(edge, gy1)
    return edge


def cell_writing_box(cell, glyphs, max_h=21.5, min_h=8.0, pad=1.0):
    """Where a single-line box goes inside a drawn cell: (top, bottom), or None.

    A cell's bottom border is not an underline to perch a 13.3 pt line on — it is a
    box to fill. The approved templates say so: their Court File Number boxes are a
    median 17.2 pt tall and end 16.3 pt below the caption, taking the whole of the
    cell's writing space. Cutting them to 13.3 and sitting them on the border leaves
    the typed text jammed against the printed line and reading as clipped; and in the
    other direction, 536 boxes in this batch sit in cells with less than 13.3 pt of
    room, so the standard height overflowed the cell entirely.

    The writing space is whatever is under the caption Ontario prints inside the cell.
    It is capped at `max_h` so a single-line field in a tall cell stays a single line
    rather than silently turning into a writing block, and in that case it sits at the
    bottom of the space, on its border.

    Both `refit_on_fields.py` and `check_seating.py` call this. They have to agree on
    the answer, and the only way to guarantee that is for there to be one answer.
    """
    cap = ink_below_top(cell[0], cell[1], cell[2], cell[3], glyphs)
    top = (max(cell[1], cap) if cap is not None else cell[1]) + pad
    bottom = cell[3] - pad
    if bottom - top < min_h:
        return None
    if max_h is not None:
        top = max(top, bottom - max_h)
    # Only fill a cell whose writing space is actually clear. Where a caption sits
    # anywhere but the top — Ontario prints "municipality" and "province, state or
    # country" *under* the line they label, inside the same drawn box — growing the
    # field to fill the cell swallows the words. There the cell is not the anchor at
    # all, and returning None leaves the box on its rule at the standard height.
    for gx0, gy0, gx1, gy1, _c in glyphs:
        if min(cell[2], gx1) - max(cell[0], gx0) <= 0.5 * (gx1 - gx0):
            continue
        if min(bottom, gy1) - max(top, gy0) > 0.3 * (gy1 - gy0):
            return None
    return (top, bottom)


def column_bounds(span, anchor_x, cy, vlines):
    """Narrow a span to the drawn column that `anchor_x` sits in.

    The rule under a table row runs the full width of the row, so snapping a cell's
    box to that rule stretches it across every column separator on the row. The
    anchor is where the box was before it moved, which is the column it belongs to.
    """
    lo, hi = span
    for vx, vy0, vy1 in vlines:
        if not (vy0 <= cy + 1 and vy1 >= cy - 1):
            continue
        if lo + 2 < vx < anchor_x:
            lo = vx
        elif anchor_x < vx < hi - 2:
            hi = min(hi, vx)
    return lo, hi


# ------------------------------------------------------------------- field lookup

def box(field):
    """(x0, y0, x1, y1) of a stored field, in points."""
    return (field["x"], field["y"],
            field["x"] + field["width"] / SCALE,
            field["y"] + field["height"] / SCALE)


def _overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))


def seat_candidates(field, rules, above=4.0, below=9.0, min_frac=0.45):
    """Every printed rule running under this field's bottom edge, left to right.

    A field is 'on' a rule when the rule runs under its bottom edge (a little above
    it, if the widget overhung, or a little below) and the two share most of their
    horizontal run.
    """
    x0, _, x1, y1 = box(field)
    out = []
    for ry, rx0, rx1 in rules:
        if not (y1 - above <= ry <= y1 + below):
            continue
        ov = _overlap(x0, x1, rx0, rx1)
        if ov <= 0 or ov < min_frac * min(x1 - x0, rx1 - rx0):
            continue
        out.append(((ry, rx0, rx1), ov))
    out.sort(key=lambda c: c[0][1])
    return out


SEAT_GAP = 1.26   # measured on the approved 45: box bottom sits this far above its rule


def seat_rule(field, rules, above=4.0, below=9.0, min_frac=0.45, prefer="overlap",
              cell=None):
    """The printed rule this field sits on, or None.

    `prefer="overlap"` suits an AcroForm source, whose widget rectangle is the
    government's own and lines up with its rule already. `prefer="leftmost"` suits an
    inferred source: `place_flat_fields.py` runs a box rightward until it hits the
    next printed character, so one box routinely spans its own rule *and* the next
    one along — and the blank it really belongs to is the one it starts on. Taking
    the widest overlap there put Form 25C's "Date of signature" box on the judge's
    signature line instead.
    """
    cands = seat_candidates(field, rules, above, below, min_frac)
    if not cands:
        return None
    x0, _, x1, y1 = box(field)
    if prefer == "leftmost":
        return cands[0][0]

    # A box inside a drawn cell belongs to that cell's bottom border, full stop.
    # Neither of the alternatives is safe on its own: nearest-rule put Form 8D.2's
    # Court File Number on the full-width rule ruling off the whole header block,
    # 1.3 pt below the box, in preference to its own cell border 2.1 pt above it;
    # and best-span-match put Form 13C's table cells on the rule of the row *below*,
    # 14 pt away, because that rule happened to be exactly as wide as the box.
    if cell is not None:
        # The *closest* candidate to the border, not merely one within tolerance:
        # Form 13C's Word export double-strokes every table border 1 pt apart, so two
        # candidates sit either side of the cell edge and taking the first found put
        # every one of its cells a point low.
        near = [c for c in cands if abs(c[0][0] - cell[3]) < 2.0]
        if near:
            return min(near, key=lambda c: abs(c[0][0] - cell[3]))[0]

    def rank(cand):
        (ry, rx0, rx1), ov = cand
        # With no cell to go on, take the nearest rule below the box, and let how
        # closely the two spans match break a tie between rules at the same height.
        union = max(x1, rx1) - min(x0, rx0)
        fit = ov / union if union > 0 else 0.0
        return (-round(abs(ry - (y1 + SEAT_GAP)) / 2.0), fit)

    return max(cands, key=rank)[0]


SIGNATURE_STOP = ("signature", "signed")

# A line captioned with a bare role is a signature line even though it never says so:
# Form 43 rules off the judge's signature and labels it just "Justice", and Form 43A
# does the same with "Children's Lawyer". Placing a box there breaks the placement
# guide's §5 rule against boxing a signature.
SIGNATURE_ROLE = ("justice", "judge", "clerk", "commissioner", "registrar",
                  "witness", "deponent", "signature")
# ...unless the caption asks for the name in writing, which is a real field — the
# guide's own warning that "name of signature 1" must keep its box.
SIGNATURE_ROLE_EXCEPT = ("name", "print", "type", "printed", "date")


def on_signature_line(field, ink, reach=26.0):
    """Is this box sitting on a printed signature line? (placement guide §5)

    'Date of signature' keeps its box; the signature itself never gets one. The
    caption on these forms prints *below* its rule, so look down from the box.
    """
    x0, _, x1, y1 = box(field)
    for wx0, wy0, wx1, wy1, text in ink:
        if not (y1 - 2 <= wy0 <= y1 + reach):
            continue
        if _overlap(x0, x1, wx0, wx1) <= 0:
            continue
        low = text.lower().strip(":.,()")
        if low not in SIGNATURE_STOP:
            continue
        # "Date of signature" is a real field — look left for the qualifier.
        prior = [w for w in ink
                 if abs(w[3] - wy1) < 3 and w[2] <= wx0 + 1 and wx0 - w[2] < 40]
        if any(w[4].lower().strip() in ("of", "date") for w in prior):
            continue
        return True
    return False


def under_name_instruction(field, glyphs, reach=30.0):
    """Is this box in the space an instruction pointed at?

    Ontario's jurat prints "(Type or print name below if signature is illegible.)"
    and then leaves the paper blank. A box placed in that space has no rule, no cell
    and nothing on its own line, so every check reads it as a stray — this is the
    signal that says otherwise, and it is the same one that justified placing it.
    """
    x0, y0, x1, _ = box(field)
    rows = {}
    for gx0, gy0, gx1, gy1, ch in glyphs:
        if y0 - reach <= gy1 <= y0 + 1 and _overlap(x0, x1, gx0, gx1) > -60:
            rows.setdefault(round(gy1, 1), []).append((gx0, ch))
    for parts in rows.values():
        if "namebelow" in "".join(c for _x, c in sorted(parts)).lower():
            return True
    return False


def under_specify_instruction(field, glyphs, reach=22.0):
    """Is this box the answer to a printed "(Specify.)"?

    Ontario's checklists set "(k) Other joint application (Specify.)" and leave the
    next line blank for the answer — no rule, no cell, no shading and nothing at all
    printed on the blank's own line. Every other test therefore reads the box as the
    Word export's padding and drops it, and Form 34K lost all five of its "specify"
    blanks that way while its `_source.docx` says they are `w:textInput` fields.

    Same signal as `under_name_instruction` and the same justification: the page
    prints an instruction that says an answer goes here.
    """
    x0, y0, x1, _ = box(field)
    rows = {}
    for gx0, gy0, gx1, gy1, ch in glyphs:
        if y0 - reach <= gy1 <= y0 + 1 and _overlap(x0, x1, gx0, gx1) > -60:
            rows.setdefault(round(gy1, 1), []).append((gx0, ch))
    for parts in rows.values():
        if "specify" in "".join(c for _x, c in sorted(parts)).lower():
            return True
    return False


def on_role_line(field, ink, reach=26.0):
    """Is this box on a line captioned with a bare role — "Justice", "Clerk"?

    Those are signature lines that never use the word. The caption is read whole, so
    "Judge (print or type name)" and "Date of signature" keep their boxes.
    """
    x0, _, x1, y1 = box(field)
    rows = {}
    for wx0, wy0, wx1, wy1, text in ink:
        if y1 - 2 <= wy0 <= y1 + reach and _overlap(x0, x1, wx0, wx1) > 0:
            rows.setdefault(round(wy1, 1), []).append((wx0, text))
    for _key, parts in rows.items():
        words = [t.lower().strip(":.,()") for _x, t in sorted(parts)]
        # The role has to *lead* the caption. "Justice" and "Clerk of the court"
        # label the line above them; "Certificate of Clerk (Adoption)" is the form's
        # own title printed in the header, and matching it anywhere in the line cost
        # Form 34K its Court File Number box.
        if not words or words[0] not in SIGNATURE_ROLE:
            continue
        if any(w in SIGNATURE_ROLE_EXCEPT for w in words):
            continue
        return True
    return False


def clearance_above(field, rules, ink, rule_y, cap=64.0):
    """Vertical room between `rule_y` and the nearest printed thing above it.

    Bounded by `cap` so a rule with nothing at all above it (the top row of a
    borderless column) does not read as an unlimited writing block.
    """
    x0, _, x1, _ = box(field)
    top = rule_y - cap
    for ry, rx0, rx1 in rules:
        if ry < rule_y - 1.5 and _overlap(x0, x1, rx0, rx1) > 0.25 * (x1 - x0):
            top = max(top, ry)
    for wx0, wy0, wx1, wy1, _t in ink:
        if wy1 < rule_y - 1.5 and _overlap(x0, x1, wx0, wx1) > 0:
            top = max(top, wy1)
    return rule_y - top


def enclosing_cell(field, rules, vlines, pad=1.5):
    """The drawn cell containing this field, as (x0, y0, x1, y1), or None.

    Requires all four borders: a rule above and below, and a vertical line on each
    side that spans the gap between them.

    The vertical anchor is the box's **bottom edge**, not its centre. A box is pinned
    at the bottom — that is the edge that sits on a rule — while its centre moves
    every time the box is resized. Anchoring on the centre meant that filling a box
    to its cell could put the centre in a *different* cell, so the next run sized it
    against that one instead: Form 13C p4 flipped five fields between a 21.5 pt line
    and a 76 pt block for ever. The bottom edge does not move when the top does, so
    the answer is stable under the very change the refit makes.

    A cell's bottom border cannot also be its top. Anchoring on the bottom edge put
    that border within `pad` of the probe, so a box grown to fill its cell found the
    same rule twice, the cell collapsed to nothing and the field came back as having
    no cell at all — which reads as a box on a bare underline. That is how Form 29C's
    63 pt "typed or printed name … address for service" panel lost the government's
    own TextArea and ended up a 21.5 pt line at its foot, five-sixths of the panel
    dead. The top is therefore searched for *above the border that was found*, not
    above the box.
    """
    x0, y0, x1, y1 = box(field)
    cx, cy = (x0 + x1) / 2, y1 - pad
    below = [r for r in rules if r[0] >= cy - pad and r[1] <= cx <= r[2]]
    if not below:
        return None
    bot = min(below, key=lambda r: r[0])[0]
    above = [r for r in rules
             if r[0] <= cy + pad and r[0] < bot - 0.5 and r[1] <= cx <= r[2]]
    if not above:
        return None
    top = max(above, key=lambda r: r[0])[0]
    if bot - top < 4:
        return None
    left = [v for v in vlines if v[0] <= cx and v[1] <= top + pad and v[2] >= bot - pad]
    right = [v for v in vlines if v[0] >= cx and v[1] <= top + pad and v[2] >= bot - pad]
    if not left or not right:
        return None
    return (max(left, key=lambda v: v[0])[0], top,
            min(right, key=lambda v: v[0])[0], bot)


def cell_grid(rules, vlines, tol=1.5):
    """Every cell a drawn grid encloses, as (x0, y0, x1, y1).

    `enclosing_cell` answers "which cell is this field in", which by construction
    cannot find a cell that holds no field — and an empty cell is exactly what a
    missing box looks like. This walks the grid instead: for each pair of vertical
    lines that are neighbours across a band, the horizontal rules crossing that band
    cut it into cells.
    """
    out = []
    for vx, vy0, vy1 in vlines:
        for wx, wy0, wy1 in vlines:
            if wx <= vx + 4:
                continue
            top, bot = max(vy0, wy0), min(vy1, wy1)
            if bot - top < 8:
                continue
            # Neighbours: nothing else running the full height between them.
            if any(vx + 2 < ux < wx - 2 and uy0 <= top + tol and uy1 >= bot - tol
                   for ux, uy0, uy1 in vlines):
                continue
            crossing = sorted({r[0] for r in rules
                               if r[1] <= vx + tol and r[2] >= wx - tol
                               and top - tol <= r[0] <= bot + tol})
            for y0, y1 in zip(crossing, crossing[1:]):
                if y1 - y0 >= 8:
                    out.append((vx, y0, wx, y1))
    return out


def column_runs(fields, pages, min_len=3, max_gap=40.0):
    """Runs of stacked cells that really are one column of one table.

    Sharing a left edge is not enough — a party panel and the "RE:" line below it
    start at the same x without being a table at all, and grouping on x alone
    reported 48 "mixed" columns where only two exist. A column of table cells shares
    its left edge *and* its width, and its members follow each other down the page
    without a real gap.

    "Without a real gap" is measured on the **drawn cells**, not on the boxes.
    Consecutive cells of one table share a border: the bottom of one is the top of
    the next. A box floats inside its cell — its height is the shape the field ended
    up with — so a gap between boxes says nothing about whether two tables are one.
    Form 33E and Form 33F each set a party panel above an unrelated stack of ruled
    blanks at the same left edge and the same width, with 20 pt of blank page between
    the two grids; measured on the boxes those read as one column, and the panel
    became a lone dissenter among single lines. The refit obligingly normalised a
    51 pt writing block down to a line at the foot of its cell.

    A member with no drawn cell falls back to the gap between the boxes, so a column
    that is ruled but not boxed still groups.
    """
    cells = {}
    for f in fields:
        pg = pages.get(f["page"])
        if pg is not None:
            cells[id(f)] = enclosing_cell(f, pg["rules"], pg["vlines"])

    def joined(a, b):
        ca, cb = cells.get(id(a)), cells.get(id(b))
        if ca and cb:
            return abs(cb[1] - ca[3]) <= 1.5
        if ca or cb:
            # One of them is a drawn cell and the other is not, so they are not two
            # cells of one column whatever the gap says. Form 32A sets its party
            # name on a bare rule above the panel it labels, at the same left edge
            # and width, and that read as a column of six mixing two shapes.
            return False
        gap = b["y"] - (a["y"] + a["height"] / SCALE)
        return -2.0 <= gap <= max_gap

    buckets = {}
    for f in fields:
        if f["type"] not in ("TextField", "TextArea"):
            continue
        key = (f["page"], round(f["x"] / 2), round(f["width"] / 6))
        buckets.setdefault(key, []).append(f)
    runs = []
    for members in buckets.values():
        members.sort(key=lambda f: f["y"])
        run = [members[0]]
        for a, b in zip(members, members[1:]):
            if joined(a, b):
                run.append(b)
            else:
                if len(run) >= min_len:
                    runs.append(run)
                run = [b]
        if len(run) >= min_len:
            runs.append(run)
    return runs


def load_pages(pdf_path):
    """Per-page geometry, 1-indexed to match `field['page']`."""
    doc = fitz.open(pdf_path)
    pages = {}
    for i, page in enumerate(doc, start=1):
        pages[i] = {
            "rect": page.rect,
            "rules": hrules(page),
            "vlines": vrules(page),
            "shaded": shaded(page),
            "ink": words(page),
            "glyphs": chars(page),
            "bars": dark_bars(page),
        }
    doc.close()
    return pages

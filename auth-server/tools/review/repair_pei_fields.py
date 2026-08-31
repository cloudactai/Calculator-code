"""In-place repairs to the shipped Prince Edward Island templates.

Every one of these was found by opening a page's renders and looking at it; the
measurements here are what the page itself says, not what a gate inferred. The
tool follows the pattern `seat_boxes_on_rules.py` and `one_line_boxes.py` set:
it writes back only the fields it owns and asserts every field it does not touch
is byte-identical first, because these templates are promoted and rebuilding
them would destroy that.

Each pass is separately invocable and idempotent.

    python3 repair_pei_fields.py --check              # report, write nothing
    python3 repair_pei_fields.py --pass ticks blanks  # apply just those

## ticks -- 81 option squares that could not be ticked

PEI prints its option square in **six** vocabularies, and the builder knew two.
Counted over the whole batch:

    U+25A1  WHITE SQUARE  Times          155 covered      the one it knew
    U+2610  BALLOT BOX    AppleSymbols     4 covered      and this
    U+F0F0                Symbol          66 UNCOVERED    Forms 70R, 70BB
    U+F091                OpenSymbol       8 UNCOVERED    Form 70I(A)
    U+F039                OpenSymbol       6 UNCOVERED    Form 70I(C)
    U+F071                Wingdings        1 UNCOVERED    Form 70I(A)

159 covered is exactly the count the PEI README records as the whole tick
anchor, which is how the gap stayed invisible: the number matched what the
builder found, and nothing asked what it had missed. Form 70R is the worst of
it -- a Registrar's Certificate whose entire purpose is to be ticked, shipped
with 60 untickable squares.

**U+F039 deserves its own warning.** PDF text extraction renders it as the
digit `9`, so Form 70I(C) reads as `9 a) child care expenses ...`. Matching
bare "9" would be reckless; what makes it safe is the private-use codepoint
plus the symbol font, never the extracted character.

## PEI seats its boxes flat on the rule, where the rest of the catalogue does not

`SEAT_GAP` is 1.26pt and every province in this repo has used it: a box's
bottom edge is held that far *above* the rule it belongs to. Measured on the
rendered PEI pages the convention is being honoured exactly -- of 735 text
fields, 612 sit over a rule and their gap clusters hard on a median of
**1.08pt**, which is `SEAT_GAP` less rounding. Nothing was drifting.

It still reads as a float in the app, because a field is drawn with a visible
background and a 1.26pt sliver of page shows between it and the line. On
review that gap was judged wrong for PEI and `seat_flat` closes it: the bottom
edge is put **on** the rule's top edge. **This is deliberately PEI-only.**
Changing `SEAT_GAP` itself would move 32,080 fields across eight provinces and
would also have to carry `on-forms/check_seating.py`, whose gate asserts the
1.26 explicitly -- so the constant is left alone and the seating is expressed
here, as a pass, like every other PEI repair.

## the last three vocabularies do not print as squares

Fitting the boxes to their ink (`fit_ticks`) meant rasterising every one of
them, and that is how this surfaced: **80 of the 240 option markers in the
batch are not drawn as squares in the backgrounds we ship.** The Word sources
call for fonts this machine does not have, and LibreOffice substituted:

    U+F039  Form 70I(C)    6   prints the digit "9"
    U+F091  Form 70I(A)    8   prints a narrow .notdef rectangle
    U+F0F0  70R, 70BB     66   prints the Apple logo

`U+F039` is confirmed against the source rather than guessed: Form 70I(C)'s
`.docx` carries `<w:sym w:font="WP IconicSymbolsA" w:char="F039"/>`, and
`fc-list` finds no WP IconicSymbolsA installed. So these **are** option
squares -- the round-2 reading was right about that -- and the defect is in
the render, not in the reading. Form 70R is the one that matters: 60 of its
squares, on a certificate whose whole purpose is to be ticked.

The boxes are fitted to whatever the page actually prints, because that is the
mark the filer is aiming at. Fixing the substitution means installing the
fonts and re-rendering those backgrounds, which is a separate job with its own
review; `fit_ticks` is idempotent and re-running it afterwards re-fits them.

Geometry is measured off the rendered page, per glyph: a box is set to the
bounding box of the ink inside the glyph's type cell. Anchoring on the cell
was tried twice and is what the six vocabularies defeat -- see `fit_ticks`.

## blanks -- printed writing rules with no field

Two anchors, both of which the builder partly missed:

* **underscore runs.** Where one line ends in a rule and the next line also
  ends in one, only the lower of the two got a box -- Form 70A's items 9, 14
  and 16 are bare while 10 and 15 are filled.
* **drawn rules.** Form 70I(A)'s "Every second week" row prints `$`, a run of
  *spaces*, and draws its rule as geometry, so no underscore audit could see
  it. Manitoba's README warns about exactly this shape.

An underline under printed text is not a blank, so a stroke carrying glyphs
along more than a third of its length is left alone; that is what separates the
writing rule from the heading rule under "Marriage certificate".

## signatures -- 30 boxes on a signature line

The convention in this repo is that a signature rule carries no field: Manitoba
refuses them by caption and British Columbia ships `drop_signature_boxes.py`.
Nova Scotia's detectors, which PEI reuses unchanged, have no such refusal --
`signaturesSkipped` is a hardcoded `0` in both builders -- so PEI shipped
typeable boxes on "Signature of petitioner", "Signature of judge" and the rest.

The list is explicit rather than matched, because matching got it wrong four
times and every wrong answer was caught by opening the page:

* Form 70S page 2 -- the caption "(Signature of judge)" sits under the
  *interest rate* blank, which is a different rule further left.
* Form 70BB -- the caption line reads "Date            Signature", naming two
  rules, and a match would have taken the date box with it.
* Form 70A page 8 -- "Date ______  Signature of respondent ______" is set as
  two lines at the same height, and the rule two lines above them is the
  respondent's *address for service*. Matching on the nearest caption below
  claimed both the address rule and the date rule. They are kept.

The last of those is the trap the review brief names: a caption that reads as
if it belongs to the box beside it, and does not. It was invisible until the
idempotence check asked why the pass wanted to put a field back on a rule it
had just cleared.

**Office captions are deliberately left alone.** A rule captioned "Registrar",
"Prothonotary" or "A Commissioner for taking Affidavits" is arguably a
signature line too, and Manitoba drops those as well -- but PEI already ships
five such fields, removing them is not reversible from the ledger, and nothing
in the review said they read wrong. They are recorded as a known asymmetry
instead of quietly resolved.

## brackets -- 4 boxes on an instruction, not a blank

The bracket-token anchor gives PEI four fields and all four are spurious. On
Form 70I(A) the page prints `known as ______________ [name of Partnership]`:
the underscore run is the blank and the bracket is the label telling you what
to write in it, so the bracket box duplicates the field beside it and stamps
its value over the printed instruction. On Form 70I(D) the bracket tokens are
whole instruction lines -- "[Give particulars of all debts owing to you.]" --
with no blank in them at all.

## stubs -- 2 unusable 15pt boxes

Form 70A page 3 items 20 and 21 print `)___ ___________`: a three-character
underscore stub, a stray space, then the real rule. Each got its own box, and
the stub's is 15pt -- about three characters -- so the filled render shows the
two values overprinting into mush. They are one blank broken by a space in the
Word source, and are merged.

The merge threshold is 6pt, which is narrow on purpose: the two runs here are
3.2pt apart, while item 10 on page 2 prints two runs 19pt apart that really are
two blanks (surname, then given names). A looser threshold would have welded
those together.
"""
import argparse
import json
import math
import os
import re
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "pei-forms"))

import pei_general_heading as PGH  # noqa: E402
import pei_answer_space as PAS  # noqa: E402
import pei_inline_name_rules as PIN  # noqa: E402
import pei_repaginate as PRG  # noqa: E402
SCALE = 1.5

# The builder's line metrics, measured off fields it placed correctly: a blank
# is one line of writing, 13.3pt tall, and its top sits 3.45pt above the top of
# the text line it belongs to.
LINE_HEIGHT = 13.3
LINE_RISE = 3.45

# Option-square glyphs the builder did not know. Private-use codepoints only,
# each confirmed by eye against the rendered page -- U+F03D is also OpenSymbol
# private-use on these forms and is the apostrophe in "child=s", not a square.
MISSED_TICKS = {0xF0F0, 0xF091, 0xF039, 0xF071}

# Every codepoint PEI uses for its option square, known and missed alike --
# the seat_ticks pass below needs the full set, not just the ones the builder
# never boxed.
TICK_GLYPHS = MISSED_TICKS | {0x25A1, 0x2610, 0x2611, 0x2612}

# Rasterising a glyph cell to find the ink inside it. 12x puts about 0.08pt in
# a pixel, which is finer than any coordinate this file rounds to; 160 of 255
# separates PEI's hairline rules from the white of the page with room on both
# sides; 0.90 is the share of an edge that has to be inked before that edge is
# read as a rule crossing the clip rather than part of the mark.
INK_ZOOM = 12.0
INK_DARK = 160
INK_FULL = 0.90

# Finding the rule a text box sits on. The band reaches a little above the
# box's bottom edge as well as below it, because a few boxes already overlap
# their rule and those have to be raised rather than left alone. 0.70 of the
# box's width is enough ink to call a row a rule and low enough to still catch
# a rule that stops short of a box widened out to the margin. 2.5pt is the
# furthest a box is moved: beyond that the row found is a different rule --
# the next line of the form -- and the box is left where review put it.
SEAT_UP = 8.0
SEAT_DOWN = 12.0
SEAT_SHARE = 0.70
SEAT_MAX_MOVE = 2.5
# A box within this of its rule is already on it. `y` is stored to two
# decimals, so a seated box can still measure a few thousandths out; without a
# floor the pass would rewrite those for ever and never report zero.
SEAT_SETTLED = 0.02

# Above this share of its length carrying a glyph, a stroke underlines text
# rather than waiting for writing.
INKED = 0.34
MAX_RULE = 320
MIN_RUN = 3
MERGE_GAP = 6.0

CAPTION = re.compile(r"\bsign(ature|ed)\b", re.I)
OFFICE = re.compile(r"\b(registrar|prothonotary|commissioner)\b", re.I)

# Keyed on the box's own top-left corner rather than its index on the page, so
# the pass stays idempotent: once a box is gone there is nothing at that corner
# to match, where an index would silently point at whatever moved up into its
# place. Coordinates were read off the numbered overlay renders.
SIGNATURE_BOXES = [
    ('PEISC_70A', 8, 293.1, 111.7), ('PEISC_70A', 8, 326.6, 275.72),
    ('PEISC_70A', 8, 350.03, 419.02), ('PEISC_70A', 8, 374.12, 527.47),
    ('PEISC_70A_JOINT', 6, 303.1, 123.8),
    ('PEISC_70A_JOINT', 6, 303.1, 196.69), ('PEISC_70A_JOINT', 6, 280.65, 402.38),
    ('PEISC_70A_JOINT', 6, 324.1, 566.63), ('PEISC_70B', 2, 360.1, 266.62),
    ('PEISC_70B', 2, 356.6, 468.19), ('PEISC_70B_JOINT', 1, 378.1, 338.92),
    ('PEISC_70B_JOINT', 1, 367.1, 516.94), ('PEISC_70D', 1, 360.1, 284.95),
    ('PEISC_70D', 1, 360.1, 412.26), ('PEISC_70D', 1, 356.6, 636.93),
    ('PEISC_70J', 1, 204.15, 336.06), ('PEISC_70P', 1, 399.15, 312.69),
    ('PEISC_70Q', 1, 374.15, 358.89), ('PEISC_70U', 1, 306.1, 236.07),
    ('PEISC_70BB', 4, 325.75, 631.15), ('PEISC_70BB_1', 2, 290.25, 516.9),
    ('PEISC_70I_A', 3, 270.4, 639.45), ('PEISC_70I_B', 3, 277.0, 570.05),
    ('PEISC_70I_C', 2, 324.1, 284.12), ('PEISC_70I_D', 4, 134.6, 310.15),
    ('PEISC_70I_D', 4, 253.4, 310.15), ('PEISC_71A', 1, 394.15, 432.25),
    ('PEISC_71B', 1, 399.15, 362.39),
]

BRACKET_BOXES = [
    ('PEISC_70I_A', 3, 387.26, 279.66), ('PEISC_70I_A', 3, 221.1, 373.06),
    ('PEISC_70I_D', 3, 78.1, 227.01), ('PEISC_70I_D', 3, 78.1, 497.01),
]

# A blank whose printed underscore run is short relative to what the form is
# actually asking for -- a surname, given names, a place of residence -- with
# nothing else printed to its right on the same line. Widened out to the
# page's own right margin (540pt on Form 70A's letter-size page, the edge
# `pass_areas` and the CHILDREN table both already use), which is real blank
# paper on every one of these lines, not invented space. Read from the actual
# renders: a name run to a 60-75pt box overflows it badly enough that the tail
# of the typed value has no box behind it at all.
#
# (docId, page, field's own x/y corner, new right edge)
MARGIN_WIDEN = [
    ("PEISC_70A", 2, 372.77, 467.78, 540.0),   # item 9, surname
    ("PEISC_70A", 2, 402.48, 590.3, 540.0),   # item 16, given names
]


def pass_margin(doc_id, mapping, doc, taken):
    changes = {}
    for did, page, x, y, right in MARGIN_WIDEN:
        if did != doc_id:
            continue
        field = _at(mapping["staticFields"], page, x, y)
        if field is None:
            continue
        new_width = round((right - field["x"]) * SCALE, 2)
        if new_width <= field["width"]:
            continue          # already widened, or the page shrank under it
        changes[field["id"]] = {"width": new_width}
    return changes


# Signature rules the caption test cannot see, keyed on the rule's left end and
# baseline. On the jurat the deponent signs a rule in the right-hand column
# while the only caption on the page -- "A Commissioner for taking Affidavits"
# -- sits under the *left* column, so nothing below the deponent's rule names
# it. Without this the blanks pass puts a typeable box back on it.
BARE_RULES = [
    ('PEISC_70I_A', 3, 270.40, 654.01), ('PEISC_70I_B', 3, 277.00, 584.61),
    ('PEISC_70I_C', 2, 324.10, 298.68), ('PEISC_70A', 8, 374.12, 542.03),
    # The registrar's rule OFFICE_ONLY_DROP just cleared. Without this,
    # pass_blanks reads the now-uncovered underscore run underneath and puts
    # a client-facing box straight back on it on the very next run.
    ('PEISC_70A_JOINT', 1, 394.12, 314.37),
]


# (docId, page, stub corner, rule corner)
STUB_PAIRS = [
]


def doc_ids():
    return sorted(os.path.basename(p)[:-5]
                  for p in os.listdir(EXPORT)
                  if p.startswith("PEISC_") and p.endswith(".json"))


def load(doc_id):
    return json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))


def rect_of(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def page_fields(fields, page):
    """The page's fields in the builder's own order, which is what the numbered
    overlay render shows, so a hand-written index means the same thing here."""
    return [f for f in fields if f["page"] == page]


def new_id(taken):
    base = max(int(i) for i in taken) + 1
    while base in taken:
        base += 1
    taken.add(base)
    return base


def make_field(kind, page, x0, y0, x1, y1, taken, **extras):
    field = {
        "id": new_id(taken),
        "type": kind,
        "x": round(x0, 2),
        "y": round(y0, 2),
        "width": round((x1 - x0) * SCALE, 2),
        "height": round((y1 - y0) * SCALE, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": page,
    }
    field.update(extras)
    return field


# ---------------------------------------------------------------- page reading

def glyphs(page):
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for char in span["chars"]:
                    out.append((char["c"], span["font"], fitz.Rect(char["bbox"])))
    return out


def ink_rect(page, cell):
    """The bounding box of the ink actually drawn inside `cell`, in points.

    A glyph's reported bbox is its **type cell** -- the full em box, ascent to
    descent, advance width included -- and the mark inside it can be very much
    smaller. On Form 70BB the cell for a `U+25A1` is 5.44 x 9.96 and the square
    it draws is 4.17 x 4.17, sitting near the baseline: less than a fifth of
    the cell's area. No arithmetic on the cell recovers that, because the
    inset differs per font and per vocabulary, so the square is measured off
    the rendered page instead of inferred.

    **A page rule crossing the clip boundary is not the glyph.** PEI sets the
    option squares of Form 70BB inside a ruled table, and the cell's top edge
    lands within a rasterised pixel of the row rule: measured naively that
    square came out 5.50 x 8.00 instead of 4.17 x 4.17, and every box on the
    form would have inherited the error. Any fully inked row or column
    touching the edge of the clip is peeled off before the box is taken, which
    is safe because a glyph that genuinely filled an entire edge of its own
    type cell would have no white side bearing at all.

    Returns None for a cell that draws nothing, which a caller must treat as
    "leave this field alone" rather than as an empty box.
    """
    pixmap = page.get_pixmap(matrix=fitz.Matrix(INK_ZOOM, INK_ZOOM),
                             clip=cell, colorspace=fitz.csGRAY)
    wide, high, data = pixmap.width, pixmap.height, pixmap.samples
    if wide < 2 or high < 2:
        return None
    dark = [[data[y * wide + x] < INK_DARK for x in range(wide)]
            for y in range(high)]

    top, bottom, left, right = 0, high - 1, 0, wide - 1
    peeling = True
    while peeling and top < bottom and left < right:
        peeling = False
        span = right - left + 1
        if sum(dark[top][left:right + 1]) >= INK_FULL * span:
            top += 1
            peeling = True
        if bottom > top and sum(dark[bottom][left:right + 1]) >= INK_FULL * span:
            bottom -= 1
            peeling = True
        tall = bottom - top + 1
        if sum(dark[y][left] for y in range(top, bottom + 1)) >= INK_FULL * tall:
            left += 1
            peeling = True
        if right > left and sum(dark[y][right]
                                for y in range(top, bottom + 1)) >= INK_FULL * tall:
            right -= 1
            peeling = True

    x0, y0, x1, y1 = wide, high, -1, -1
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            if dark[y][x]:
                x0, x1 = min(x0, x), max(x1, x)
                y0, y1 = min(y0, y), max(y1, y)
    if x1 < 0:
        return None
    return fitz.Rect(cell.x0 + x0 / INK_ZOOM, cell.y0 + y0 / INK_ZOOM,
                     cell.x0 + (x1 + 1) / INK_ZOOM, cell.y0 + (y1 + 1) / INK_ZOOM)


def rule_under(page, rect):
    """Top edge of the rule this box sits on, or None if it sits on nothing.

    Read off the rendered page rather than from the underscore runs and
    strokes the other passes use, because a box's rule can be any of the
    three things PEI draws -- a run of underscore glyphs, a stroked line, or
    the bottom border of a table cell -- and at this point all that matters is
    where the ink is. A band is rasterised across the box's own width and the
    first row that is at least `SEAT_SHARE` inked is the rule; the nearest such
    row to the box's bottom edge wins, so a box between two close rules seats
    on its own.
    """
    # The band is snapped to the page's own raster grid rather than hung off
    # the box's bottom edge. Left unsnapped, moving a box re-phases the
    # sampling and the same rule measures up to 1/INK_ZOOM different, so the
    # pass chased its own tail: 609 boxes moved, then 79 of them asked to move
    # again by a twelfth of a point, for ever. Snapped, a rule has one answer
    # no matter where the box currently sits.
    band = fitz.Rect(rect.x0,
                     math.floor((rect.y1 - SEAT_UP) * INK_ZOOM) / INK_ZOOM,
                     rect.x1,
                     math.ceil((rect.y1 + SEAT_DOWN) * INK_ZOOM) / INK_ZOOM)
    if band.width < 4 or band.height < 1:
        return None
    pixmap = page.get_pixmap(matrix=fitz.Matrix(INK_ZOOM, INK_ZOOM),
                             clip=band, colorspace=fitz.csGRAY)
    wide, high, data = pixmap.width, pixmap.height, pixmap.samples
    if wide < 4:
        return None
    best, y = None, 0
    while y < high:
        share = sum(1 for x in range(wide) if data[y * wide + x] < INK_DARK) / wide
        if share < SEAT_SHARE:
            y += 1
            continue
        top = band.y0 + y / INK_ZOOM
        while y < high and (sum(1 for x in range(wide)
                                if data[y * wide + x] < INK_DARK) / wide) >= SEAT_SHARE:
            y += 1
        if best is None or abs(top - rect.y1) < abs(best - rect.y1):
            best = top
    return best


def inked_glyphs(page):
    """Glyphs that actually mark the page.

    Whitespace has a bounding box like any other character, and counting it as
    ink made every drawn rule look like an underline: Form 70I(A) sets its
    "Every second week" row as `$`, a run of spaces, `x 26 / 12`, so the stroke
    beneath the spaces measured as fully inked and the missing blank stayed
    missing. Underscores are excluded for the same reason -- a rule drawn under
    an underscore run is still a blank.
    """
    return [(c, f, r) for c, f, r in glyphs(page) if c.strip() and c != "_"]


def underscore_runs(page):
    runs = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                current = []
                for char in span["chars"]:
                    if char["c"] == "_":
                        current.append(char)
                    else:
                        if len(current) >= MIN_RUN:
                            runs.append(current)
                        current = []
                if len(current) >= MIN_RUN:
                    runs.append(current)
    out = []
    for run in runs:
        out.append((min(c["bbox"][0] for c in run),
                    min(c["bbox"][1] for c in run),
                    max(c["bbox"][2] for c in run),
                    max(c["bbox"][3] for c in run)))
    return out


def strokes(page):
    out = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                p, q = item[1], item[2]
                if abs(p.y - q.y) < 0.7 and abs(p.x - q.x) > 8:
                    out.append((min(p.x, q.x), max(p.x, q.x), (p.y + q.y) / 2))
            elif item[0] == "re":
                r = item[1]
                if r.height < 0.7 and r.width > 8:
                    out.append((r.x0, r.x1, (r.y0 + r.y1) / 2))
    return merge_collinear(out)


def merge_collinear(spans, gap=13.0):
    """Weld a rule that is drawn in pieces back into one rule.

    The jurat rule under "A Commissioner for taking Affidavits" arrives as four
    or five separate strokes on the same baseline. Left in pieces, each piece is
    short enough to look like a writing rule and none of them is near enough to
    the caption to be recognised as a signature line, so the pass wanted to put
    three or four little boxes along the commissioner's signature. Whole, it is
    one 180pt rule captioned by its office, and correctly left alone.

    The 13pt threshold is measured, not guessed: across the whole batch the gaps
    between collinear strokes are 0pt (eight of them), 6, 8, 12 and 17pt twice.
    The commissioner's rule needs 6.5 and 11.9pt welded; the two 17pt gaps are
    left alone.
    """
    out = []
    for x0, x1, y in sorted(spans, key=lambda s: (round(s[2], 1), s[0])):
        if out and abs(out[-1][2] - y) < 0.6 and x0 - out[-1][1] <= gap:
            out[-1] = (out[-1][0], max(out[-1][1], x1), out[-1][2])
        else:
            out.append((x0, x1, y))
    return [tuple(s) for s in out]


def inked_share(x0, x1, y, gs):
    spans = sorted((max(g.x0, x0), min(g.x1, x1))
                   for _c, _f, g in gs
                   if g.x1 > x0 and g.x0 < x1 and g.y0 < y and y - g.y1 <= 5.0)
    covered, end = 0.0, x0
    for a, b in spans:
        if b <= end:
            continue
        covered += b - max(a, end)
        end = b
    return covered / (x1 - x0)


def caption_near(page, rect, lines=None):
    """PEI captions its rules below-right, and sometimes inline to the left."""
    if lines is None:
        lines = []
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                lines.append((fitz.Rect(line["bbox"]),
                              "".join(s["text"] for s in line["spans"])))
    for lrect, text in lines:
        # A line of bare underscores is the rule itself, not a caption for it.
        # Form 70T's Registrar rule is set as its own text line, so without this
        # the rule matched itself, the caption came back as underscores, and the
        # office test never saw the word below.
        if not any(c.isalpha() for c in text):
            continue
        if 0 <= lrect.y0 - rect.y1 <= 20 and lrect.x1 > rect.x0 - 30 and lrect.x0 < rect.x1 + 30:
            return text
        # Inline to the left. The caption's own line often *contains* the
        # underscore run -- Form 70A prints "Signature of witness___________"
        # as one span -- so a line that overlaps the rule horizontally and
        # starts to its left counts too, not only one that ends just before it.
        if abs(lrect.y0 - rect.y0) < 8 and lrect.x0 < rect.x0 and lrect.x1 > rect.x0 - 6:
            return text
    return ""


# ------------------------------------------------------------------- the passes

def pass_fit_ticks(doc_id, mapping, doc, taken):
    """Fit every checkbox to the ink of the square it actually ticks.

    This supersedes the earlier "seat at the bottom of the glyph cell" rule,
    which fixed the direction of the error without fixing its size and so left
    all 240 boxes in the batch still visibly wrong. Measured against the ink
    of the printed square, that rule left a median offset of **+2.93pt
    vertically and up to +7.54pt**, with the box now hanging *below* the mark
    instead of above it -- it traded a gap at the top for a gap at the bottom.

    The reason no arithmetic on the cell was ever going to work is that both
    the inset and the shape are per-vocabulary, and PEI uses six:

        U+25A1  Times            155   cell 5.44 x 9.96   ink 4.17 x 4.17
        U+2610  AppleSymbols       4                      ink 5.4-6.6 square
        U+F0F0  Symbol            66   cell 7.90 x 11.25  ink 6.9 x 8.3
        U+F091  OpenSymbol         8                      ink 2.67 x 6.67
        U+F039  OpenSymbol         6                      ink 4.25 x 6.75
        U+F071  Wingdings          1                      ink 7.25 x 7.25

    The cell is between 1.4x and 2.4x the height of the mark inside it, and
    the mark is not square in three of the six. So the box is measured off the
    rendered page, per glyph, and the field is set to exactly that rectangle.

    **The last three vocabularies are not drawing squares at all**, which this
    measurement is how we found out -- see the module docstring. The box is
    fitted to what the page prints regardless, because that is the mark the
    filer is aiming at; if the backgrounds are ever re-rendered with the
    missing fonts installed, re-running this pass re-fits them.

    Idempotent by construction: a field already equal to its glyph's ink
    rounds to the same four numbers and reports no change.
    """
    changes = {}
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        cells = [rect for char, _font, rect in glyphs(page)
                 if ord(char) in TICK_GLYPHS]
        if not cells:
            continue
        measured, claimed = {}, set()
        for field in page_fields(mapping["staticFields"], number):
            if field["type"] != "CheckBox":
                continue
            here = rect_of(field)
            # The field came from one of these cells and has only ever been
            # nudged within it, so overlap identifies it. Nearest centre is the
            # fallback for a box that an earlier pass pushed clear of its cell.
            best, score = None, 0.0
            for cell in cells:
                area = (cell & here).get_area() if cell.intersects(here) else 0.0
                if area > score:
                    best, score = cell, area
            if best is None:
                best = min(cells, key=lambda c: abs((c.x0 + c.x1) / 2 - (here.x0 + here.x1) / 2)
                           + abs((c.y0 + c.y1) / 2 - (here.y0 + here.y1) / 2))
                if abs((best.x0 + best.x1) / 2 - (here.x0 + here.x1) / 2) > 8.0:
                    continue
            key = tuple(round(v, 2) for v in best)
            if key in claimed:
                continue          # one printed square, one box
            if key not in measured:
                measured[key] = ink_rect(page, best)
            ink = measured[key]
            if ink is None:
                continue
            claimed.add(key)
            want = {"x": round(ink.x0, 2), "y": round(ink.y0, 2),
                    "width": round(ink.width * SCALE, 2),
                    "height": round(ink.height * SCALE, 2)}
            if all(abs(field[k] - v) < 0.005 for k, v in want.items()):
                continue
            changes[field["id"]] = want
    return changes


def pass_seat_flat(doc_id, mapping, doc, taken):
    """Put every one-line writing box's bottom edge **on** the rule it sits over.

    **RECONSTRUCTED.** This pass was written but never committed and was lost
    from the working tree during the caption round; what survived is its
    section of the module docstring, its constants and `rule_under`. The body
    below is rewritten from those and then pinned to the five counts the
    original left behind -- four in the review note, one in its own `--check`
    output -- which together fix the predicate exactly:

        735  text fields in the batch          TextField
        609  seated onto their rule            TextField, either direction
          3  left alone, further than 2.5pt    TextField
        123  sitting over no rule at all       TextField
        610  reported by `--check`             609 + one 16.8pt TextArea

    That last one is what pins the TextArea rule. Every TextField is seated,
    whatever its height -- they run up to 35.6pt here and are still one
    writing line each. A TextArea is a paragraph box and its bottom edge is
    the bottom of a block rather than a rule, **except** where it is too short
    to hold two lines: exactly one is (16.8pt, Form 70BB.1) and the other 13
    over a rule are 35pt or more. 609 + 1 = 610. A pure height test cannot
    reproduce this -- the tall TextFields and the short TextArea overlap in
    height -- so the type is part of the test, and this is the only reading of
    the surviving material that matches all five counts.

    A checkbox is never seated -- it is fitted to the ink of its printed square
    by `fit_ticks` and has no rule, and the nearest inked row would take it off
    its mark.

    A box over no rule is left where review put it, and so is one whose nearest
    rule is further than `SEAT_MAX_MOVE`: past that the row found is the next
    line of the form, and moving the box would hand it to the wrong blank.
    """
    changes = {}
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        for field in page_fields(mapping["staticFields"], number):
            if field["type"] == "CheckBox":
                continue
            rect = rect_of(field)
            if field["type"] == "TextArea" and rect.height > 2 * LINE_HEIGHT:
                continue                    # a paragraph box, not a writing line
            top = rule_under(page, rect)
            if top is None:
                continue
            move = top - rect.y1
            if abs(move) < SEAT_SETTLED or abs(move) > SEAT_MAX_MOVE:
                continue
            changes[field["id"]] = {"y": round(field["y"] + move, 2)}
    return changes


def pass_ticks(doc_id, mapping, doc, taken):
    """Box the option squares the builder's vocabulary did not include.

    A new box is placed on the glyph's **ink**, not on its type cell, so it
    arrives already fitted rather than waiting for `fit_ticks` on a second
    run. A cell that draws nothing gets no box at all.
    """
    added = []
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        boxes = [rect_of(f) for f in page_fields(mapping["staticFields"], number)]
        for char, _font, rect in glyphs(page):
            if ord(char) not in MISSED_TICKS:
                continue
            if any((b & rect).get_area() > 0.25 * rect.get_area() for b in boxes):
                continue
            ink = ink_rect(page, rect)
            if ink is None:
                continue
            added.append(make_field("CheckBox", number, ink.x0, ink.y0,
                                    ink.x1, ink.y1, taken))
    return added


def pass_blanks(doc_id, mapping, doc, taken):
    added = []
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        boxes = [rect_of(f) for f in page_fields(mapping["staticFields"], number)]
        gs = inked_glyphs(page)
        lines = []
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                lines.append((fitz.Rect(line["bbox"]),
                              "".join(s["text"] for s in line["spans"])))

        bare = [(x, y) for did, pg, x, y in BARE_RULES
                if did == doc_id and pg == number]

        def wanted(rect):
            if any((b & rect).get_area() > 0.35 * rect.get_area() for b in boxes):
                return False
            if any(abs(rect.x0 - x) < 1.5 and abs(rect.y1 - y) < 4.0
                   for x, y in bare):
                return False
            caption = caption_near(page, rect, lines)
            return not (CAPTION.search(caption) or OFFICE.search(caption))

        for x0, y0, x1, y1 in underscore_runs(page):
            rect = fitz.Rect(x0, y0, x1, y1)
            if not wanted(rect):
                continue
            added.append(make_field("TextField", number, x0, y0 - LINE_RISE,
                                    x1, y0 - LINE_RISE + LINE_HEIGHT, taken))

        for x0, x1, y in strokes(page):
            if x1 - x0 > MAX_RULE or inked_share(x0, x1, y, gs) > INKED:
                continue
            rect = fitz.Rect(x0, y - LINE_HEIGHT + LINE_RISE, x1, y)
            if not wanted(rect):
                continue
            added.append(make_field("TextField", number, x0,
                                    y - LINE_HEIGHT + LINE_RISE, x1, y, taken))
    return added


def _at(fields, page, x, y, tol=0.05):
    for field in fields:
        if (field["page"] == page and abs(field["x"] - x) <= tol
                and abs(field["y"] - y) <= tol):
            return field
    return None


def _resolve(entries, mapping, doc_id):
    """(docId, page, x, y) -> field ids. Missing is fine -- already applied."""
    out = []
    for did, page, x, y in entries:
        if did != doc_id:
            continue
        field = _at(mapping["staticFields"], page, x, y)
        if field is not None:
            out.append(field["id"])
    return out


def pass_signatures(doc_id, mapping, doc, taken):
    return _resolve(SIGNATURE_BOXES, mapping, doc_id)


def pass_brackets(doc_id, mapping, doc, taken):
    return _resolve(BRACKET_BOXES, mapping, doc_id)


def pass_stubs(doc_id, mapping, doc, taken):
    """Weld a stub box into the rule beside it; returns (changes, drop)."""
    changes, drop = {}, []
    for did, page, sx, sy, rx, ry in STUB_PAIRS:
        if did != doc_id:
            continue
        stub = _at(mapping["staticFields"], page, sx, sy)
        rule = _at(mapping["staticFields"], page, rx, ry)
        if stub is None or rule is None:
            continue          # already merged
        gap = rule["x"] - (stub["x"] + stub["width"] / SCALE)
        if gap > MERGE_GAP:
            raise SystemExit("%s p%d: %.1fpt gap is wider than the %.1fpt merge "
                             "threshold; these are two blanks, not one"
                             % (did, page, gap, MERGE_GAP))
        right = rule["x"] + rule["width"] / SCALE
        changes[stub["id"]] = {"width": round((right - stub["x"]) * SCALE, 2)}
        drop.append(rule["id"])
    return changes, drop


def grid(page):
    """Horizontal and vertical rules of the page's ruled tables."""
    h, v = [], []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            segs = []
            if item[0] == "l":
                segs.append((item[1].x, item[1].y, item[2].x, item[2].y))
            elif item[0] == "re":
                r = item[1]
                if r.height < 0.9:
                    segs.append((r.x0, (r.y0 + r.y1) / 2, r.x1, (r.y0 + r.y1) / 2))
                elif r.width < 0.9:
                    segs.append(((r.x0 + r.x1) / 2, r.y0, (r.x0 + r.x1) / 2, r.y1))
                else:
                    segs += [(r.x0, r.y0, r.x1, r.y0), (r.x0, r.y1, r.x1, r.y1),
                             (r.x0, r.y0, r.x0, r.y1), (r.x1, r.y0, r.x1, r.y1)]
            for x0, y0, x1, y1 in segs:
                if abs(y0 - y1) < 0.7 and abs(x0 - x1) > 6:
                    h.append((min(x0, x1), max(x0, x1), (y0 + y1) / 2))
                elif abs(x0 - x1) < 0.7 and abs(y0 - y1) > 6:
                    v.append((min(y0, y1), max(y0, y1), (x0 + x1) / 2))
    return merge_collinear(h, gap=2.0), merge_collinear(v, gap=2.0)


def empty_cells(page, boxes):
    """Cells of a ruled table that hold nothing and carry no field.

    The cut is per row, not page-wide: PEI carries short rules belonging to one
    table that fall inside another table's column, and taking consecutive
    x-positions from a page-wide list splits a column in two and then rejects
    both halves. That is the mistake that cost Form 70I(A) its whole AMOUNT
    column, and the builder's README records the fix; this pass inherits it.
    """
    hs, vs = grid(page)
    inked = inked_glyphs(page)
    rows = sorted({round(y, 1) for _a, _b, y in hs})
    out = []
    for top, bottom in zip(rows, rows[1:]):
        # A band under 12pt cannot hold a line of the form's own text, so it is
        # a rule pair or a shaded strip rather than a row. Form 70I(D)'s
        # proposed-assets heading sits over a 9pt grey band that measured as
        # three cells and would have shipped three unusable boxes under the
        # answer area proper.
        if not 12 <= bottom - top <= 190:
            continue
        # verticals that actually span this row
        cuts = sorted({round(x, 1) for y0, y1, x in vs
                       if y0 <= top + 2 and y1 >= bottom - 2})
        if len(cuts) < 2:
            continue
        for left, right in zip(cuts, cuts[1:]):
            if right - left < 14:
                continue
            # the row's own top and bottom rules must span the cell
            def spanned(y):
                return any(abs(ry - y) < 1.5 and rx0 <= left + 3 and rx1 >= right - 3
                           for rx0, rx1, ry in hs)
            if not (spanned(top) and spanned(bottom)):
                continue
            cell = fitz.Rect(left + 1.5, top + 1.0, right - 1.5, bottom - 1.0)
            if any(cell.intersects(r) and (cell & r).get_area() > 0.4 * r.get_area()
                   for _c, _f, r in inked):
                continue
            if any((b & cell).get_area() > 0.25 * cell.get_area() for b in boxes):
                continue
            out.append(cell)
    return out


def pass_cells(doc_id, mapping, doc, taken):
    """A blank cell of a ruled table that got no box.

    The expensive direction, and the one every province in this catalogue has
    paid for: Nova Scotia's Form FD3 shipped its whole income table empty. Here
    it is Form 70BB's Responding Party block -- the two cells where the other
    side's name, address and lawyer go -- and Form 70I(B)'s Child Support and
    Spousal Support rows, which are one row holding two items and so were read
    as occupied.

    The answer space of a ruled cell is a `TextArea`: these are the places the
    form expects a name and address, or a paragraph, not a word on a line.
    """
    added = []
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        boxes = [rect_of(f) for f in page_fields(mapping["staticFields"], number)]
        for cell in empty_cells(page, boxes):
            kind = "TextArea" if cell.height >= 24 else "TextField"
            added.append(make_field(kind, number, cell.x0, cell.y0,
                                    cell.x1, cell.y1, taken))
    return added


# Explicit field additions the review missed and a reviewer asked for by
# name after seeing the live app: a real party-name box where Form 70A*
# prints "(Name)" as a bare placeholder rather than a rule, a "TO:" box Form
# 70A never gave the respondent's name and address anywhere to go, the court
# file number instruction, and the claim list's growable (ii)/(iii) slots
# under both Acts. None of these have a printed rule underneath them -- PEI's
# usual anchors (an underscore run, a ruled cell) find nothing here -- so
# they are named and measured against the page the same way NARRATIVE_AREAS
# is, rather than detected.
#
# (docId, page, x0, y0, x1, y1, type)
def _translate(doc_id, page, y):
    """One measured (page, y) carried through all four reflow passes, in order.

    `pei_general_heading` moved page 1 to fit a style of cause;
    `pei_answer_space` then cut answer bands into whatever page needed one;
    `pei_inline_name_rules` then reflowed the Statement of Lawyer's first line;
    `pei_repaginate` then absorbed whatever near-empty continuation pages that
    left behind into the page in front of them. Each pass measured its own
    cuts against the page the one before it left, so the translations compose
    in that order and only in that order -- reading a coordinate through a
    later pass's tables first would look it up against a page that never
    existed.
    """
    headed_page = PGH.page_for(doc_id, page, y)
    headed_y = PGH.shifted(doc_id, page, y)
    spaced_page = PAS.page_for(doc_id, headed_page, headed_y)
    spaced_y = PAS.shifted(doc_id, headed_page, headed_y)
    named_page = PIN.page_for(doc_id, spaced_page, spaced_y)
    named_y = PIN.shifted(doc_id, spaced_page, spaced_y)
    return (PRG.page_for(doc_id, named_page, named_y),
            PRG.shifted(doc_id, named_page, named_y))


def _reflowed(entries):
    """Move measured coordinates onto pages the reflow passes moved.

    Every coordinate in this file is what a page says, measured on the shipped
    template -- so when `pei_general_heading` reflows a page to make room for a
    style of cause, or `pei_answer_space` cuts an answer band into one, the
    tables below are describing the page as it was. They are translated here,
    at load, from the shifts those passes recorded, rather than being
    re-measured: the passes then compose in any order with this file, and a
    rebuilt-from-source template that has had neither run reads its own numbers
    unchanged.

    Where a reflow was taller than the page had room for, the tail spilled onto
    a continuation page spliced in directly behind it (`rebuild`, in both
    tools). An entry naming a y at or past that split is naming content that
    isn't on `page` any more, so the page number moves too -- and so does every
    entry on a *later* page of the same form, which is why `_translate` reads
    the page number as well as the y.
    """
    out = []
    for entry in entries:
        doc_id, page = entry[0], entry[1]
        moved = list(entry)
        y0 = moved[3] if len(moved) > 3 and isinstance(moved[3], (int, float)) else None
        if y0 is not None:
            moved[1], moved[3] = _translate(doc_id, page, y0)
        if len(moved) > 5 and isinstance(moved[5], (int, float)):
            _page, moved[5] = _translate(doc_id, page, moved[5])
        out.append(tuple(moved))
    return out


def _reflowed_corners(entries):
    """The same translation as `_reflowed`, for `(docId, page, x, y)`
    corner tables (`SIGNATURE_BOXES`, `OFFICE_ONLY_DROP`, and the rest) rather
    than `(docId, page, x0, y0, x1, y1, ...)` rectangles. Returns a list;
    callers that need a `set` wrap the result themselves.
    """
    out = []
    for doc_id, page, x, y in entries:
        new_page, new_y = _translate(doc_id, page, y)
        out.append((doc_id, new_page, x, new_y))
    return out


# Keyed to the box's own top-left corner, measured on the shipped template --
# so on a form the heading pass reflowed, this table is describing the page
# as it was. Reassigned here (rather than immediately after the list literal
# above) because `_reflowed_corners` has to exist first.
SIGNATURE_BOXES = _reflowed_corners(SIGNATURE_BOXES)
BARE_RULES = _reflowed_corners(BARE_RULES)


NAMED_FIELDS = [
    # Form 70A -- respondent's name and address. Sits on the "TO:" line only,
    # so the printed second caption line ("each respondent)") is left visible
    # underneath the box, matching the label-then-caption convention used
    # everywhere else in this batch.
    # Form 70A -- the claim's growable slots. (a)(i) already prints "a
    # divorce" and is left alone; (ii)/(iii) under both Acts get a box, since
    # the published form lets the petitioner add relief here.
    ("PEISC_70A", 1, 170.0, 589.77, 504.6, 603.07, "TextArea"),   # (a)(ii)
    ("PEISC_70A", 1, 170.0, 601.27, 504.6, 614.57, "TextArea"),   # (a)(iii)
    ("PEISC_70A", 1, 170.0, 624.37, 504.6, 637.67, "TextArea"),   # (b)(i)
    ("PEISC_70A", 1, 170.0, 635.97, 504.6, 649.27, "TextArea"),   # (b)(ii)
    ("PEISC_70A", 1, 170.0, 647.47, 504.6, 660.77, "TextArea"),   # (b)(iii)
    # Form 70A* -- the court file number instruction.
    # Form 70A* -- Spouse One's and Spouse Two's names. "(Name)" prints as a
    # bare placeholder with the party's role underneath, the same shape as
    # the bracket-token instructions on the financial statements: the box
    # replaces the placeholder, not the role label below it.
    # Form 70A* -- the same growable claim slots as 70A, one column further
    # right because the joint form indents (i)/(ii)/(iii) under (a)/(b).
    ("PEISC_70A_JOINT", 1, 188.0, 384.01, 504.6, 397.31, "TextArea"),   # (a)(ii)
    ("PEISC_70A_JOINT", 1, 188.0, 396.11, 504.6, 409.41, "TextArea"),   # (a)(iii)
    ("PEISC_70A_JOINT", 1, 188.0, 432.41, 504.6, 445.71, "TextArea"),   # (b)(i)
    ("PEISC_70A_JOINT", 1, 188.0, 444.51, 504.6, 457.81, "TextArea"),   # (b)(ii)
    ("PEISC_70A_JOINT", 1, 188.0, 456.61, 504.6, 469.91, "TextArea"),   # (b)(iii)
    # The "TO: (Name and address of ...)" line is 70A's own gap, repeated on
    # four more forms: a bare parenthetical instruction with no printed rule
    # under it, and nothing else on the line. Same fix as 70A's TO: field --
    # a box on the label's own line, right margin read off the page's own
    # rightmost ink -- extended to every other PEISC form that prints the
    # same shape.
    ("PEISC_70B", 1, 150.0, 668.91, 506.6, 682.21, "TextField"),   # AND TO
    # Form 70D -- "TO:  (Name and address...)" prints inline on one line, the
    # same shape as 70A*'s "(Name)" placeholders: the box replaces the
    # placeholder text itself, not a caption underneath it.
    # Standalone party and statement-of-lawyer placeholders.  These are real
    # answer spaces, unlike parenthetical drafting instructions in the body of
    # a form, so they receive a compact ruled field rather than literal
    # "(name)" text or a page-wide box.
    # Form 70D's lawyer-contact block, deliberately separate from the
    # signature rule above it.
    ("PEISC_70D", 1, 337.0, 660.13, 504.2, 670.13, "TextField"),
    ("PEISC_70D", 1, 343.0, 670.13, 504.2, 680.13, "TextField"),
    ("PEISC_70D", 1, 337.0, 680.13, 385.0, 690.13, "TextField"),
    ("PEISC_70D", 1, 425.0, 680.13, 504.2, 690.13, "TextField"),
    ("PEISC_70B", 2, 398.0, 490.54, 504.2, 500.54, "TextField"),
    ("PEISC_70B", 2, 404.0, 500.54, 504.2, 510.54, "TextField"),
    ("PEISC_70B", 2, 438.0, 510.54, 504.2, 520.54, "TextField"),
    ("PEISC_70U", 1, 345.0, 263.77, 504.0, 273.77, "TextField"),
    ("PEISC_70U", 1, 345.0, 275.27, 504.0, 285.27, "TextField"),
    ("PEISC_70U", 1, 345.0, 286.87, 504.0, 296.87, "TextField"),
    # The domestic-contracts row -- "Date / Nature of contract or arrangement /
    # Status" -- set as a row of column headings over open paper with no grid
    # under it. That is the same shape as Form 70I(D)'s Real Estate and Debts
    # headings that `pass_areas` already names, and it was missed here for the
    # same reason: a cell detector needs ruled cells and this row has none, so
    # both petitions shipped with the contracts row unfillable.
    #
    # The boxes go in the band **below** the headings. That is where the row is
    # written, and it is the only side with room: 22.8pt on 70A*, 23.6pt on
    # 70A, against 11.2pt above the headings, which is one line of leading.
    # Column edges are the midpoints between the printed captions, so each box
    # sits under its own heading. "Nature of contract or arrangement" is a
    # TextArea because what goes in it is a description -- the same reading
    # BLOCK_TOKEN gives the phrase "nature of" in the builder.
    ("PEISC_70A_JOINT", 5, 136.9, 227.5, 223.0, 245.0, "TextField"),  # Date
    ("PEISC_70A_JOINT", 5, 226.0, 227.5, 402.0, 245.0, "TextArea"),   # Nature
    ("PEISC_70A_JOINT", 5, 405.0, 227.5, 504.6, 245.0, "TextField"),  # Status
    ("PEISC_70A", 6, 122.5, 576.4, 179.0, 594.0, "TextField"),        # Date
    ("PEISC_70A", 6, 182.0, 576.4, 395.0, 594.0, "TextArea"),         # Nature
    ("PEISC_70A", 6, 398.0, 576.4, 506.6, 594.0, "TextField"),        # Status
]

# A TO writing line needs room for its printed instruction beneath it. Keep
# its rule at the measured bottom edge, but use a compact field above that
# rule so the instruction is no longer covered by the control.
NAMED_FIELDS = _reflowed(NAMED_FIELDS)

TO_NAMED_FIELDS = set(_reflowed_corners({
    ("PEISC_70B", 1, 150.0, 668.91),
}))

# Emptied when `pei_caption_lines.py` took the bracket captions. Every entry
# this held was a `(name)` placeholder set inline in the prose and overlaid by
# a compact field; the caption pass turns that shape into a writing rule with
# the caption reprinted small beneath it, and the rule carries its own field.
# Kept in place rather than deleted because `pass_named`'s layout switch below
# still tests membership. `set()`, not `{}`: an empty brace literal is a dict
# and the switch unions this with LAWYER_CONTACT_FIELDS.
RULED_NAME_FIELDS = set()

LAWYER_CONTACT_FIELDS = set(_reflowed_corners({
    ("PEISC_70D", 1, 337.0, 660.13),
    ("PEISC_70D", 1, 343.0, 670.13),
    ("PEISC_70D", 1, 337.0, 680.13),
    ("PEISC_70D", 1, 425.0, 680.13),
    ("PEISC_70B", 2, 398.0, 490.54),
    ("PEISC_70B", 2, 404.0, 500.54),
    ("PEISC_70B", 2, 438.0, 510.54),
    ("PEISC_70U", 1, 345.0, 263.77),
    ("PEISC_70U", 1, 345.0, 275.27),
    ("PEISC_70U", 1, 345.0, 286.87),
}))

COMPACT_EXISTING_NAME_RULES = _reflowed_corners([
    ("PEISC_70A_JOINT", 1, 300.0, 193.6),
    ("PEISC_70A_JOINT", 1, 300.0, 244.32),
])

TO_FIELD_HEIGHT = 10.0


def to_field_layout(y1):
    """Properties for a compact TO writing line, anchored on its rule."""
    return {
        "y": round(y1 - TO_FIELD_HEIGHT, 2),
        "height": round(TO_FIELD_HEIGHT * SCALE, 2),
        "fontSize": 7,
        "compact": True,
        "rule": "bottom",
    }


def ruled_name_layout(y1):
    """A short name rule, sized for the wording that introduces it."""
    return {
        "y": round(y1 - TO_FIELD_HEIGHT, 2),
        "height": round(TO_FIELD_HEIGHT * SCALE, 2),
        "fontSize": 7,
        "compact": True,
        "rule": "bottom",
    }


def pass_to_layout(doc_id, mapping, doc, taken):
    """Upgrade the already-added TO fields without changing any other field."""
    changes = {}
    for did, page, x0, y0, x1, y1, _kind in NAMED_FIELDS:
        if did != doc_id or (did, page, x0, y0) not in TO_NAMED_FIELDS:
            continue
        original = fitz.Rect(x0, y0, x1, y1)
        for field in page_fields(mapping["staticFields"], page):
            current = rect_of(field)
            if not (current.intersects(original)
                    and (current & original).get_area() > 0.5 * original.get_area()):
                continue
            target = to_field_layout(y1)
            if any(field.get(key) != value for key, value in target.items()):
                changes[field["id"]] = target
    return changes


def pass_compact_existing_names(doc_id, mapping, doc, taken):
    """Turn the two joint-petition name overlays into writing rules."""
    changes = {}
    for did, page, x, y in COMPACT_EXISTING_NAME_RULES:
        if did != doc_id:
            continue
        for field in page_fields(mapping["staticFields"], page):
            if abs(field["x"] - x) > 0.2 or abs(field["y"] - y) > 0.2:
                continue
            bottom = field["y"] + field["height"] / SCALE
            target = ruled_name_layout(bottom)
            if any(field.get(key) != value for key, value in target.items()):
                changes[field["id"]] = target
    return changes


# Form 70A's source leaves large, inconsistent gaps before a few short answer
# rules.  Keep the same close-to-label rhythm as item 7, reflow the court
# office address after its background label is moved left, and give item 19(b)
# the paragraph area its prompt calls for.
PEISC_70A_LAYOUT = {
    1750805871017: {"x": 331.0, "width": 259.0},   # item 4
    1750805871018: {"x": 192.0, "width": 126.0},   # item 5
    1750805871024: {"x": 223.0, "width": 229.5},   # item 13 date (153pt max)
    1750805871003: {"x": 369.0, "width": 202.5},   # court office address
    1750805871152: {
        "type": "TextArea", "x": 122.5, "y": 186.0,
        "width": 572.25, "height": 48.0, "fontSize": 8,
    },                                                # item 2 cohabitation dates
    1750805871032: {
        "type": "TextArea", "x": 144.1, "y": 178.0,
        "width": 539.85, "height": 45.0, "fontSize": 8,
    },                                                # item 19(b)
}

# Court-office addresses were authored with a 55–60pt rule, too short for an
# actual court address.  The background pass reflows their label and line; the
# mapping keeps the matching 135pt minimum overlay.
COURT_ADDRESS_FIELDS = {
    1750805871003: {"x": 369.0, "width": 202.5},
    1750047614002: {"x": 369.0, "width": 202.5},
    1750081877002: {"x": 369.0, "width": 202.5},
    1750796887006: {"x": 369.0, "width": 202.5},
}


def pass_70a_layout(doc_id, mapping, doc, taken):
    changes = {}
    for field in mapping["staticFields"]:
        target = PEISC_70A_LAYOUT.get(field["id"]) if doc_id == "PEISC_70A" else None
        if target and any(field.get(key) != value for key, value in target.items()):
            changes[field["id"]] = target
        address = COURT_ADDRESS_FIELDS.get(field["id"])
        if address and any(field.get(key) != value for key, value in address.items()):
            changes[field["id"]] = address
    # Match the two PDF background reflows.  The sentinel field makes the pass
    # idempotent without writing application-only metadata into the mapping.
    if doc_id != "PEISC_70A":
        return changes
    page_two = doc[1]
    item_four = next(f for f in mapping["staticFields"] if f["id"] == 1750805871017)
    if page_two.rect.height > 800 and item_four["y"] < 340:
        for field in page_fields(mapping["staticFields"], 2):
            if field["y"] >= 189.0:
                changes.setdefault(field["id"], {})["y"] = round(field["y"] + 30.0, 2)
    page_three = doc[2]
    residence = next(f for f in mapping["staticFields"] if f["id"] == 1750805871039)
    if page_three.rect.height > 800 and residence["y"] < 280:
        for field in page_fields(mapping["staticFields"], 3):
            if field["id"] != 1750805871032 and field["y"] >= 176.0:
                changes.setdefault(field["id"], {})["y"] = round(field["y"] + 34.0, 2)
    return changes

# An "Issued by ____ Registrar" rule is completed by court staff, not the
# party using this application.  Treat every PEI instance as a signature rule
# and leave it unboxed.  These are keyed to the field's own corner so the pass
# is idempotent and cannot reach the nearby Date or court-office-address fields.
OFFICE_ONLY_DROP = _reflowed_corners([
    ("PEISC_70A", 1, 389.62, 481.30),
    ("PEISC_70B", 1, 394.12, 599.56),
    ("PEISC_70R", 3, 341.37, 134.80),
])


def pass_named(doc_id, mapping, doc, taken):
    added = []
    for did, page, x0, y0, x1, y1, kind in NAMED_FIELDS:
        if did != doc_id:
            continue
        existing = [rect_of(f) for f in page_fields(mapping["staticFields"], page)]
        band = fitz.Rect(x0, y0, x1, y1)
        if any((r & band).get_area() > 0.5 * band.get_area() for r in existing):
            continue          # already added
        key = (did, page, x0, y0)
        extras = (to_field_layout(y1) if key in TO_NAMED_FIELDS
                  else ruled_name_layout(y1)
                  if key in RULED_NAME_FIELDS | LAWYER_CONTACT_FIELDS else {})
        added.append(make_field(kind, page, x0, y0, x1, y1, taken, **extras))
    return added


def pass_office_drop(doc_id, mapping, doc, taken):
    return _resolve(OFFICE_ONLY_DROP, mapping, doc_id)


# The unruled answer bands, measured off the page: left and right from the
# column heading the band belongs to, top from the heading's baseline, bottom
# from whatever is printed next. Named rather than detected, for the reason the
# docstring below gives.
NARRATIVE_AREAS = [
    ("PEISC_70I_D", 1, 72.10, 348.21, 540.00, 381.40),   # Real Estate
    ("PEISC_70I_D", 3, 72.10, 678.06, 540.00, 704.80),   # Debts
    ("PEISC_70I_D", 4, 72.10, 177.56, 540.00, 242.34),   # Proposed assets/debts
    # Item 34's "briefly outline the reasons here" band measures 23.6pt, under
    # the generic detector's 26pt floor -- which is why the automatic pass
    # left it out. Named in on request: it is genuinely short, but a filer
    # would rather have a tight box than none.
    ("PEISC_70A", 6, 108.10, 391.60, 540.00, 409.20),    # item 34
    # 70A*'s own copy of that band, which the same reasoning reaches and the
    # first pass missed on both forms: the joint petition asks item 34 in the
    # identical words, and its band -- from the tail of "briefly outline the
    # reasons here." to the DOMESTIC CONTRACTS heading -- measures 24.3pt, so
    # it is under the 26pt floor for the same reason 70A's is.
    ("PEISC_70A_JOINT", 5, 108.10, 129.30, 540.00, 147.60),   # item 34
    # "□ No  □ Yes. (Give details below)" -- the only two prompts in the batch
    # that both ask for a written answer and leave paper to write it on. A
    # sweep of all 34 templates found 79 prompts with no field under them and
    # exactly these two clear 22.8pt; every other one is 13.4pt or less, which
    # is leading rather than answer space, and is left bare for the reason
    # `pass_areas` records below.
    ("PEISC_70BB", 3, 141.10, 128.60, 510.90, 145.40),
    ("PEISC_70BB_1", 2, 105.60, 154.40, 473.50, 171.20),
]

# Measured on the shipped page like every other table here, and translated for
# the same reason. This one needed no translation until `pei_answer_space` ran:
# the heading pass only ever moved page 1, and nothing in this list is on a
# page 1. The answer-space pass cuts pages 6 of 70A and 5 of 70A*, and spills
# earlier pages of both, so item 34's band on each is now a page further on
# than the number written here.
NARRATIVE_AREAS = _reflowed(NARRATIVE_AREAS)


def pass_subcells(doc_id, mapping, doc, taken):
    """The clear part of a ruled cell whose text is only its own heading.

    Form 70BB.1 asks "RELATIONSHIP OF MOVING PARTY(IES) TO CHILD(REN):" at the
    top of a 60pt cell and leaves the rest of the cell blank for the answer.
    The empty-cell pass cannot take it -- the cell has text in it, so it is
    occupied -- and yet three quarters of it is the answer space. Form 70BB
    does the same with its Part 1 questions and Form 70BB.1 again with "What
    are you seeking from the Court?".

    Unlike the narrative bands, nothing here is invented: the box is the cell
    the form drew, less the lines the form printed in it. It is a `TextArea`
    because what goes in it is a description, and because a cell this tall
    drawn as a one-line control would misread the space the form is offering.
    """
    added = []
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        boxes = [rect_of(f) for f in page_fields(mapping["staticFields"], number)]
        inked = [r for _c, _f, r in inked_glyphs(page)]
        hs, vs = grid(page)
        rows = sorted({round(y, 1) for _a, _b, y in hs})
        for top, bottom in zip(rows, rows[1:]):
            if not 34 <= bottom - top <= 190:
                continue
            cuts = sorted({round(x, 1) for y0, y1, x in vs
                           if y0 <= top + 2 and y1 >= bottom - 2})
            if len(cuts) < 2:
                continue
            for left, right in zip(cuts, cuts[1:]):
                if right - left < 120:
                    continue
                cell = fitz.Rect(left + 1.5, top + 1.0, right - 1.5, bottom - 1.0)
                inside = [g for g in inked if cell.intersects(g)
                          and (cell & g).get_area() > 0.4 * g.get_area()]
                if not inside:
                    continue          # empty: pass_cells owns it
                # A cell whose heading already carries a field is answered on
                # its own line -- "Court File Number: ____" in Form 70BB.1's
                # masthead -- and the space under it is the cell's padding.
                head = fitz.Rect(cell.x0, cell.y0,
                                 cell.x1, max(g.y1 for g in inside))
                if any(b.intersects(head) for b in boxes):
                    continue
                floor = max(g.y1 for g in inside)
                # the heading must sit at the top of the cell, not fill it
                if floor - cell.y0 > 0.6 * cell.height:
                    continue
                band = fitz.Rect(cell.x0, floor + 3.0, cell.x1, cell.y1)
                if band.height < 26:
                    continue
                if any((b & band).get_area() > 0.25 * band.get_area() for b in boxes):
                    continue
                added.append(make_field("TextArea", number, band.x0, band.y0,
                                        band.x1, band.y1, taken))
    return added


def pass_areas(doc_id, mapping, doc, taken):
    """Give the unruled answer bands somewhere to type.

    Form 70I(D) sets four of its sections as a row of column headings --
    Ownership / Nature and Address of Real Estate / Value as of ___ -- over
    open paper, with no grid under them at all. There is nothing for a cell
    detector to find, so Real Estate, Debts and the proposed additions shipped
    with no way to enter a single row.

    **Named, not detected, and the reason is worth recording.** Three automatic
    rules were tried and every one of them was wrong in a way only the renders
    showed. Matching any line ending in a colon claimed "Court File Number:",
    which already has a field, and "C) Employment Insurance Benefits", which is
    a table row. Requiring an instruction or a question and blank paper beneath
    reduced the batch to three, and lost the real ones. Detecting a heading row
    with a wide band under it found this form and almost nothing else.

    What the failures were really saying is that **PEI has far less blank paper
    than it looks like it has.** The gap under "If yes, provide details." on
    Form 70A page 7 measures 20.6pt -- one line of leading, not an answer space.
    The court's expectation is that the drafter opens the Word document and
    inserts paragraphs, which is an affordance a fixed-geometry PDF overlay
    cannot reproduce at all. Boxing 20pt of leading would not give anyone room
    to write; it would only put a control where the form has none. So the three
    bands that genuinely are answer space are named here, and the rest is
    recorded as a limit of building these forms as flat PDFs.
    """
    added = []
    for did, page, x0, y0, x1, y1 in NARRATIVE_AREAS:
        if did != doc_id:
            continue
        boxes = [rect_of(f) for f in page_fields(mapping["staticFields"], page)]
        band = fitz.Rect(x0, y0, x1, y1)
        if any((b & band).get_area() > 0.3 * band.get_area() for b in boxes):
            continue          # already applied
        added.append(make_field("TextArea", page, x0, y0, x1, y1, taken))
    return added


DATE_MAX = 153.0
NORMAL_DATE_FIELDS = {
    ("PEISC_70A", 1750805871157), ("PEISC_70A", 1750805871159),
    ("PEISC_70A", 1750805871161), ("PEISC_70AA", 1750460040010),
    ("PEISC_70A_JOINT", 1750047614147), ("PEISC_70A_JOINT", 1750047614153),
    ("PEISC_70A_JOINT", 1750047614155), ("PEISC_70A_JOINT", 1750047614157),
    ("PEISC_70S", 1750131303020), ("PEISC_71B", 1750731700008),
    # Form 71B's registrar-certification date was a 345pt drafting rule.
    # It is a normal date, not a narrative answer, so keep it to the same
    # one-quarter-page maximum as the other standalone dates.
    ("PEISC_71B", 1750731700009),
    ("PEISC_71E", 1750796887018),
}


def pass_date_lengths(doc_id, mapping, doc, taken):
    return {f["id"]: {"width": min(f["width"], DATE_MAX * SCALE)}
            for f in mapping["staticFields"]
            if (doc_id, f["id"]) in NORMAL_DATE_FIELDS
            and f["width"] > DATE_MAX * SCALE}


PASSES = ("ticks", "fit_ticks", "blanks", "cells", "subcells", "areas",
         "named", "to_layout", "compact_existing_names", "margin", "signatures",
         "brackets", "office_drop", "stubs", "seat_flat", "70a_layout", "date_lengths")


def repair(doc_id, wanted, apply_changes):
    mapping = load(doc_id)
    before = {f["id"]: dict(f) for f in mapping["staticFields"]}
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    taken = {int(f["id"]) for f in mapping["staticFields"]}
    report = {}

    # add: new field dicts. drop: ids to remove. changes: id -> {key: value},
    # applied to whatever field survives the drop -- the one shape every pass
    # writes into, whether it is adding a box, deleting one, or nudging a
    # single property of a box that is otherwise left alone.
    added, dropped, changes = [], [], {}
    if "ticks" in wanted:
        got = pass_ticks(doc_id, mapping, doc, taken)
        report["ticks"] = len(got)
        added += got
    if "seat_flat" in wanted:
        got = pass_seat_flat(doc_id, mapping, doc, taken)
        report["seat_flat"] = len(got)
        changes.update(got)
    if "fit_ticks" in wanted:
        got = pass_fit_ticks(doc_id, mapping, doc, taken)
        report["fit_ticks"] = len(got)
        changes.update(got)
    if "blanks" in wanted:
        got = pass_blanks(doc_id, mapping, doc, taken)
        report["blanks"] = len(got)
        added += got
    if "cells" in wanted:
        got = pass_cells(doc_id, mapping, doc, taken)
        report["cells"] = len(got)
        added += got
    if "subcells" in wanted:
        got = pass_subcells(doc_id, mapping, doc, taken)
        report["subcells"] = len(got)
        added += got
    if "areas" in wanted:
        got = pass_areas(doc_id, mapping, doc, taken)
        report["areas"] = len(got)
        added += got
    if "named" in wanted:
        got = pass_named(doc_id, mapping, doc, taken)
        report["named"] = len(got)
        added += got
    if "to_layout" in wanted:
        got = pass_to_layout(doc_id, mapping, doc, taken)
        report["to_layout"] = len(got)
        changes.update(got)
    if "compact_existing_names" in wanted:
        got = pass_compact_existing_names(doc_id, mapping, doc, taken)
        report["compact_existing_names"] = len(got)
        changes.update(got)
    if "70a_layout" in wanted:
        got = pass_70a_layout(doc_id, mapping, doc, taken)
        report["70a_layout"] = len(got)
        changes.update(got)
    if "date_lengths" in wanted:
        got = pass_date_lengths(doc_id, mapping, doc, taken)
        report["date_lengths"] = len(got)
        changes.update(got)
    if "margin" in wanted:
        got = pass_margin(doc_id, mapping, doc, taken)
        report["margin"] = len(got)
        changes.update(got)
    if "signatures" in wanted:
        got = pass_signatures(doc_id, mapping, doc, taken)
        report["signatures"] = len(got)
        dropped += got
    if "brackets" in wanted:
        got = pass_brackets(doc_id, mapping, doc, taken)
        report["brackets"] = len(got)
        dropped += got
    if "office_drop" in wanted:
        got = pass_office_drop(doc_id, mapping, doc, taken)
        report["office_drop"] = len(got)
        dropped += got
    if "stubs" in wanted:
        stub_changes, drop = pass_stubs(doc_id, mapping, doc, taken)
        report["stubs"] = len(stub_changes)
        changes.update(stub_changes)
        dropped += drop
    doc.close()

    if not apply_changes:
        return report

    fields = [f for f in mapping["staticFields"] if f["id"] not in set(dropped)]
    for field in fields:
        if field["id"] in changes:
            field.update(changes[field["id"]])
    fields += added
    fields.sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))

    # Everything not owned by a pass must be byte-identical.
    owned = set(dropped) | set(changes) | {f["id"] for f in added}
    for field in fields:
        was = before.get(field["id"])
        if was is None or field["id"] in owned:
            continue
        assert was == field, "%s %s changed" % (doc_id, field["id"])

    # Nothing to say, nothing to write. Rewriting a template the passes did
    # not touch would churn its whole file for an indentation change and bury
    # the real diff, so a no-op leaves the file byte-identical -- and the
    # export's own format is `indent=1`, not this tool's preference.
    if not (added or dropped or changes):
        return report

    mapping["staticFields"] = fields
    with open(os.path.join(EXPORT, "%s.json" % doc_id), "w") as fh:
        json.dump(mapping, fh, indent=1)
        fh.write("\n")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pass", dest="passes", nargs="*", default=list(PASSES),
                        choices=PASSES)
    parser.add_argument("--only", nargs="*", default=None)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    wanted = set(args.passes)
    totals = {}
    for doc_id in (args.only or doc_ids()):
        report = repair(doc_id, wanted, not args.check)
        if any(report.values()):
            print("%-18s %s" % (doc_id, "  ".join(
                "%s=%d" % (k, v) for k, v in sorted(report.items()) if v)))
        for key, value in report.items():
            totals[key] = totals.get(key, 0) + value
    print("\n%s: %s" % ("would change" if args.check else "changed",
                        "  ".join("%s=%d" % kv for kv in sorted(totals.items()))))


if __name__ == "__main__":
    main()

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

Geometry is the builder's own, measured off a square it did get right: the box
is anchored at the glyph's top-left and is square with a side of the glyph's
*width* (the glyph box is taller than it is wide, being a text cell).

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
import os
import re
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
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
    ('PEISC_70A', 8, 293.1, 111.7), ('PEISC_70A', 8, 326.6, 256.65),
    ('PEISC_70A', 8, 350.03, 399.95), ('PEISC_70A', 8, 374.12, 508.4),
    ('PEISC_70A_JOINT', 6, 303.1, 123.8),
    ('PEISC_70A_JOINT', 6, 303.1, 184.3), ('PEISC_70A_JOINT', 6, 280.65, 364.7),
    ('PEISC_70A_JOINT', 6, 324.1, 524.3), ('PEISC_70B', 2, 360.1, 261.85),
    ('PEISC_70B', 2, 356.6, 458.65), ('PEISC_70B_JOINT', 1, 378.1, 334.15),
    ('PEISC_70B_JOINT', 1, 367.1, 507.4), ('PEISC_70D', 1, 360.1, 284.95),
    ('PEISC_70D', 1, 360.1, 388.9), ('PEISC_70D', 1, 356.6, 608.8),
    ('PEISC_70J', 1, 204.15, 284.95), ('PEISC_70P', 1, 399.15, 308.05),
    ('PEISC_70Q', 1, 374.15, 354.25), ('PEISC_70U', 1, 306.1, 230.2),
    ('PEISC_70BB', 4, 325.75, 631.15), ('PEISC_70BB_1', 2, 290.25, 516.9),
    ('PEISC_70I_A', 3, 270.4, 639.45), ('PEISC_70I_B', 3, 277.0, 570.05),
    ('PEISC_70I_C', 2, 324.1, 284.12), ('PEISC_70I_D', 4, 134.6, 310.15),
    ('PEISC_70I_D', 4, 253.4, 310.15), ('PEISC_71A', 1, 394.15, 400.45),
    ('PEISC_71B', 1, 399.15, 342.7),
]

BRACKET_BOXES = [
    ('PEISC_70I_A', 3, 387.26, 279.66), ('PEISC_70I_A', 3, 221.1, 373.06),
    ('PEISC_70I_D', 3, 78.1, 227.01), ('PEISC_70I_D', 3, 78.1, 497.01),
]

# Signature rules the caption test cannot see, keyed on the rule's left end and
# baseline. On the jurat the deponent signs a rule in the right-hand column
# while the only caption on the page -- "A Commissioner for taking Affidavits"
# -- sits under the *left* column, so nothing below the deponent's rule names
# it. Without this the blanks pass puts a typeable box back on it.
BARE_RULES = [
    ('PEISC_70I_A', 3, 270.40, 654.01), ('PEISC_70I_B', 3, 277.00, 584.61),
    ('PEISC_70I_C', 2, 324.10, 298.68), ('PEISC_70A', 8, 374.12, 522.96),
]


# (docId, page, stub corner, rule corner)
STUB_PAIRS = [
    ('PEISC_70A', 3, 430.85, 195.65, 449.08, 195.65),
    ('PEISC_70A', 3, 431.25, 218.75, 449.03, 218.75),
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


def make_field(kind, page, x0, y0, x1, y1, taken):
    return {
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


# ---------------------------------------------------------------- page reading

def glyphs(page):
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for char in span["chars"]:
                    out.append((char["c"], span["font"], fitz.Rect(char["bbox"])))
    return out


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

def pass_ticks(doc_id, mapping, doc, taken):
    added = []
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        boxes = [rect_of(f) for f in page_fields(mapping["staticFields"], number)]
        for char, _font, rect in glyphs(page):
            if ord(char) not in MISSED_TICKS:
                continue
            if any((b & rect).get_area() > 0.25 * rect.get_area() for b in boxes):
                continue
            side = rect.width
            added.append(make_field("CheckBox", number, rect.x0, rect.y0,
                                    rect.x0 + side, rect.y0 + side, taken))
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
    """Weld a stub box into the rule beside it; returns (widen, drop)."""
    widen, drop = {}, []
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
        widen[stub["id"]] = round((right - stub["x"]) * SCALE, 2)
        drop.append(rule["id"])
    return widen, drop


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


# The unruled answer bands, measured off the page: left and right from the
# column heading the band belongs to, top from the heading's baseline, bottom
# from whatever is printed next. Named rather than detected, for the reason the
# docstring below gives.
NARRATIVE_AREAS = [
    ("PEISC_70I_D", 1, 72.10, 348.21, 540.00, 381.40),   # Real Estate
    ("PEISC_70I_D", 3, 72.10, 678.06, 540.00, 704.80),   # Debts
    ("PEISC_70I_D", 4, 72.10, 177.56, 540.00, 242.34),   # Proposed assets/debts
]


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


PASSES = ("ticks", "blanks", "cells", "subcells", "areas", "signatures", "brackets", "stubs")


def repair(doc_id, wanted, apply_changes):
    mapping = load(doc_id)
    before = {f["id"]: dict(f) for f in mapping["staticFields"]}
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    taken = {int(f["id"]) for f in mapping["staticFields"]}
    report = {}

    added, dropped, widened = [], [], {}
    if "ticks" in wanted:
        got = pass_ticks(doc_id, mapping, doc, taken)
        report["ticks"] = len(got)
        added += got
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
    if "signatures" in wanted:
        got = pass_signatures(doc_id, mapping, doc, taken)
        report["signatures"] = len(got)
        dropped += got
    if "brackets" in wanted:
        got = pass_brackets(doc_id, mapping, doc, taken)
        report["brackets"] = len(got)
        dropped += got
    if "stubs" in wanted:
        widen, drop = pass_stubs(doc_id, mapping, doc, taken)
        report["stubs"] = len(widen)
        widened.update(widen)
        dropped += drop
    doc.close()

    if not apply_changes:
        return report

    fields = [f for f in mapping["staticFields"] if f["id"] not in set(dropped)]
    for field in fields:
        if field["id"] in widened:
            field["width"] = widened[field["id"]]
    fields += added
    fields.sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))

    # Everything not owned by a pass must be byte-identical.
    owned = set(dropped) | set(widened) | {f["id"] for f in added}
    for field in fields:
        was = before.get(field["id"])
        if was is None or field["id"] in owned:
            continue
        assert was == field, "%s %s changed" % (doc_id, field["id"])

    # Nothing to say, nothing to write. Rewriting a template the passes did
    # not touch would churn its whole file for an indentation change and bury
    # the real diff, so a no-op leaves the file byte-identical -- and the
    # export's own format is `indent=1`, not this tool's preference.
    if not (added or dropped or widened):
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

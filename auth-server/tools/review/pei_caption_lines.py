"""Give every PEI bracket caption a writing rule, a field, and its own line.

## what the page was doing wrong

PEI captions its blanks with a bracketed italic phrase set *inline*, in the
middle of the sentence it belongs to:

    8.  Petitioner's birthplace (province, state or country) __________

Three separate things go wrong with that once the page carries fields.

* **the caption is under the control.** The exporter draws a white rectangle
  behind every text field before it stamps the value (`FillPdf.savePdf`), so a
  field laid over the caption erases it on export and hides it in the app. The
  reviewer sees a box sitting on top of printed words.
* **the blank is the wrong size.** The printed rule starts *after* the caption,
  so a birthplace gets 100pt of writing line while the same page gives a
  surname 130pt. The caption is eating the answer space.
* **a caption is often the only thing there.** `(Date(s) of cohabitation)` on
  Form 70A page 2 and the whole `TO (Name and address of person summoned)`
  block on Form 71E print a caption and no rule at all, so nothing anchored a
  field and none was ever added.

The fix is the layout every other court form in this catalogue already uses:
the rule takes the line, and the caption goes underneath it, small.

    8.  Petitioner's birthplace ______________________________________
        (province, state or country)

## the page has to be made taller to do it

PEI sets these forms solid -- an 11pt Times body on an 11.5pt line. Measured
on Form 70A item 8 there is **2.47pt** of clear paper between the underscore
rule and the cap-height of item 9 below it. A 5pt caption in that gap
overprints the next line; the largest that clears is about 2.4pt, which is
0.85mm and unreadable on paper. Half the batch is like this: of 152 captions,
70 have under 4pt of room and 82 have 10pt or more.

So the space is *made*. `reflow` rebuilds the page from bands: the content
above the caption's line stays exactly where it is, everything below is
re-placed lower by the height the caption needs. Bands are copied with
`show_pdf_page`, which re-places the source page as a form XObject clipped to
the band -- the vector content is copied, not re-typeset, so nothing drifts
and no font is substituted. This is the one edit route that survives; the
`.doc` sources reflow at 2.25-3.66pt of drift per edit and were abandoned in
an earlier round.

Every band cut is taken on a raster row that is **white across the full page
width**, never at a glyph's reported cell bottom. A cell bottom is not the
bottom of the ink -- the `y` of "country" hangs below it -- and cutting there
shaves the descenders off the line above.

The room this needs was measured against each page's own footer before any of
it was written: 30 pages need space, the largest ask is 44pt (Form 71E page 1
and Form 70BB page 4), and every page has it. Four pages -- 70A p3, both
70A(JOINT) pages and 71E p1 -- have to push the page number down as well,
which still leaves each of them more than 70pt of bottom margin.

## a caption in a table cell is not reflowed

Form 70BB sets `Married on (date)` and `Yes. (Give details.)` inside a ruled
table. Inserting a band there would stretch the cell away from its own
borders, and the caption is not covering the answer space anyway -- the rest
of the row is the answer space. Those get a field fitted to the remainder of
the cell and the background is not touched at all.

## captions that ask for a paragraph are left alone

`(Give particulars.)`, `(Give details.)`, `(Give reasons below)` and
`(Explain.)` do not label a line. Form 70P prints "There is no possibility of
the reconciliation of the spouses because: (Give particulars.)" and the answer
is a paragraph, which wants a TextArea in the space the form provides -- on
Form 70BB, literally the empty table row underneath, which is why five of them
say "below". Giving those a one-line rule would be a worse answer than the
nothing they have now, so this pass records them and does not touch them.

## multi-part captions become labelled rules

`(Name and address of person summoned)` is three answers, not one. Where a
caption names more than one thing it gets one labelled rule per thing,
stacked, and the caption still goes underneath:

    TO   Name:    ________________________________
         Address: ________________________________
         (Name and address of person summoned)

    python3 pei_caption_lines.py --check
    python3 pei_caption_lines.py
    python3 pei_caption_lines.py --only PEISC_71E
"""
import argparse
import json
import os
import re
import sys
import tempfile

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import repair_pei_fields as R                                   # noqa: E402

EXPORT = R.EXPORT
SCALE = R.SCALE

# The caption, set under its rule. 5.6pt Times italic is the smallest size
# that still reads as words on paper rather than as a grey smudge; measured
# against the body it is almost exactly half, which is the proportion the
# printed forms already use for their own small print.
CAP_SIZE = 5.6
CAP_FONT = "tiit"                       # Times-Italic, the face the caption is already set in
CAP_ASC = 0.70                          # of the size: cap height above the baseline
CAP_DESC = 0.25                         # and descender below it
CAP_LEAD = 1.3                          # paper between the rule and the caption's cap line

# A labelled sub-rule on a multi-part caption. The label is Times roman at 7pt
# so it reads as part of the form rather than as an annotation on it.
LABEL_SIZE = 7.0
LABEL_FONT = "tiro"
SUB_PITCH = 11.5                        # the body's own line pitch

RULE_WIDTH = 0.6
FIELD_H = 10.0                          # matches TO_FIELD_HEIGHT in repair_pei_fields
FIELD_SIZE = 7

# A blank this narrow cannot hold the answer it is captioned for; widened out
# to whatever the line has free to its right, never past the text column.
MIN_ANSWER = 54.0
# A full writing line on these pages, measured off the rules the forms print
# for a party's name: Form 70A's "(Date)" rule is 130pt and its name rules run
# to the same width.
LINE_WIDTH = 130.0
# Ink this close to the right of a blank is the sentence continuing, not the
# next column, so the blank stops short of it.
INK_GAP = 3.5
# A rule this far from the caption on the same line belongs to it.
ADJACENT = 14.0
# Clear paper under a caption's line, at or above which no band is inserted.
ROOMY = 7.0
# Bottom margin the reflowed page keeps.
PAGE_FOOT = 36.0
# Paper left under a caption before the next thing on the page starts.
CLEARANCE = 0.8
# How far a new box may be moved to sit on its rule's ink.
SEAT_REACH = 2.0
# Punctuation a blank may push to the end of its widened rule.
TRAILING = ".,;:"
TRAIL_GAP = 1.0
# How close other printing has to be before a caption counts as set inline in
# it rather than standing alone in its own column.
GUTTER = 30.0
# The longest a bracketed phrase is allowed to run before the scanner gives up
# on the `(` that opened it. The batch's longest real caption is 87 characters;
# beyond this the `(` is an unclosed one and pairing it with a later `)` would
# swallow half a page of prose.
RUN_CHARS = 120
# What `new_id` counts from on a template that ships with no fields.
ID_FLOOR = 1750805871000


# --------------------------------------------------------------- what counts

# An answer caption: a bracketed phrase naming what goes in a blank. Written
# out rather than matched loosely, because the same page prints bracketed list
# markers, statutory cross-references and whole drafting instructions, and a
# loose match turns "(or the equivalent thereof from another jurisdiction)"
# into a writing rule in the middle of a sentence.
CAPTION = re.compile(r"""^(
    dates?|day|time|day\ and\ date(\ judgment\ given)?|d,\ m,\ y
  | date\(s\)\ of\ cohabitation
  | names?|full\ name(\ of\ deponent)?
  | name\ of\ (court|judge|spouses|petitioner|source)
  | name\ (if\ more\ than\ one(\ respondent)?|jurisdiction)
  | jurisdiction | court | court\ file\ no
  | address(\ of\ court\ office)?
  | place
  | (municipality\ and\ )?province,\ state\ or\ country
  | petitioner\ or\ respondent | spouse\ one\ or\ spouse\ two
  | identify\ party | part(y|ies)
  | names?\ ?,?\s*address.* | names?\ and\ address.*
  | name,\ telephone\ number\ and\ email\ address
)$""", re.X | re.I)

# Bracketed instructions that ask for a paragraph. Recorded, never rewritten
# -- see the module docstring.
NARRATIVE = re.compile(r"^(give |provide details|explain|specify )", re.I)

# The things a caption can be asking for, in the order a form asks for them.
PARTS = (("Name", re.compile(r"\bnames?\b", re.I)),
         ("Address", re.compile(r"\baddress(es)?\b", re.I)),
         ("Phone", re.compile(r"\b(telephone|phone)\b", re.I)),
         ("Email", re.compile(r"\bemail\b", re.I)))


def inner(text):
    """The caption without its brackets or trailing sentence punctuation."""
    t = re.sub(r"\s+", " ", text).strip()
    t = t[1:] if t.startswith("(") else t
    t = t.rstrip(".,;:")
    t = t[:-1] if t.endswith(")") else t
    return t.strip().rstrip(".")


def parts_of(text):
    """The labelled sub-rules a caption needs, or [] if it names one thing.

    "email address" names one thing, not two, so Address only counts where the
    word is not the tail of "email address" -- without that every lawyer block
    grew a spurious Address rule beside its Email rule.
    """
    t = inner(text)
    if not re.match(r"^names?\b", t, re.I):
        return []
    stripped = re.sub(r"\bemail\s+address(es)?\b", "email", t, flags=re.I)
    found = [label for label, pattern in PARTS
             if pattern.search(stripped if label == "Address" else t)]
    return found if len(found) > 1 else []


def page_chars(page):
    """Every character on the page with the baseline point it was set on.

    `origin` is what makes the trailing punctuation movable: a glyph can be
    re-set at a new x on exactly the baseline it was already on, so the moved
    full stop sits on the line rather than near it.
    """
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for char in span["chars"]:
                    out.append({"c": char["c"], "rect": fitz.Rect(char["bbox"]),
                                "origin": fitz.Point(char["origin"]),
                                "size": span["size"]})
    return out


def joined(run):
    """The run's characters as text, with the line break put back as a space.

    A caption that wraps arrives from the extractor as two lines with no
    separator between them, so "address of" + "person summoned" reads as
    "address ofperson summoned" -- which is then what gets reprinted under the
    rule.
    """
    text, previous = "", None
    for char, _rect, _size, line_no in run:
        if previous is not None and line_no != previous and not text.endswith(" "):
            text += " "
        text, previous = text + char, line_no
    return text


def brackets(page):
    """Every bracketed phrase on the page: its text, its size, its line rects.

    Scanned character by character, in reading order, rather than by word.
    Three things defeat a word-level scan and all three are on these pages:

    * **the sentence's punctuation is not the caption's.** `(day),` is one
      word, and taking the comma with the caption both deletes it from the
      sentence and reprints it under the rule. The run ends at the `)`.
    * **captions nest.** `(Date(s) of cohabitation)` closes twice; matching
      the first `)` would cut the caption at "Date(s".
    * **captions wrap.** `(Name and address of / person summoned)` is two
      lines of one phrase, so the scan runs across the lines of a block and
      keeps a rectangle per line -- the union spans the prose either side of
      it and must never be used to redact.
    """
    chars, line_no = [], 0
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for char in span["chars"]:
                    chars.append((char["c"], fitz.Rect(char["bbox"]),
                                  span["size"], line_no))
            line_no += 1

    out, position = [], 0
    while position < len(chars):
        if chars[position][0] != "(":
            position += 1
            continue
        open_rect, depth, close_at = chars[position][1], 0, None
        for scan in range(position, min(position + RUN_CHARS, len(chars))):
            char, rect, _size, _line = chars[scan]
            if rect.y1 - open_rect.y0 > 40:
                break                       # a phrase does not run down the page
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    close_at = scan
                    break
        if close_at is None:
            position += 1                   # an unclosed "(" -- do not let it swallow the page
            continue
        run = chars[position:close_at + 1]
        lines = {}
        for _c, rect, _s, key in run:
            lines[key] = (lines[key] | rect) if key in lines else rect
        ordered = [lines[key] for key in sorted(lines)]
        whole = ordered[0]
        for rect in ordered[1:]:
            whole |= rect
        out.append({"text": joined(run),
                    "rect": whole, "lines": ordered,
                    "chars": [rect for _c, rect, _s, _l in run],
                    "size": max(s for _c, _r, s, _l in run)})
        position = close_at + 1
    return out


# ------------------------------------------------------------ reading a page

def margin(page):
    """The left edge of the page's own text column."""
    edges = [rect.x0 for char, _font, rect in R.inked_glyphs(page)]
    return round(min(edges), 1) if edges else 72.0


def column(page):
    """The right edge of the page's own text column.

    Taken from the page rather than assumed, because the batch is not one page
    size: the 70A family sets a 504pt column on letter paper and the 70BB
    family runs to 522pt. A blank is never widened past this, so a widened
    rule still lines up with the justified text above it.
    """
    edges = [rect.x1 for char, _font, rect in R.inked_glyphs(page)]
    return round(max(edges), 1) if edges else page.rect.x1 - 72.0


def line_ink(page, rect):
    """Every inked glyph sharing a text line with `rect`."""
    middle = (rect.y0 + rect.y1) / 2
    return [g for _c, _f, g in R.inked_glyphs(page)
            if g.y0 < middle < g.y1 or abs((g.y0 + g.y1) / 2 - middle) < 4.0]


def line_rules(page, rect):
    """Writing rules on `rect`'s own line, each with the run that printed it.

    The fourth item is the underscore run's own rectangle where the rule is a
    run of `_` glyphs, and None where it is drawn geometry. The caller needs
    to tell them apart: a run it is about to draw over can be taken off the
    page, and a stroke cannot be removed as cheaply.

    A drawn stroke only counts near the line's **baseline**, never above its
    cap height. Form 70A page 3 sets "The children habitually reside in
    (municipality and province, state or country) ______" directly under the
    CHILDREN table, and that table's bottom border lands 0.1pt above the
    caption's own type cell. Read as this line's rule it put the writing rule
    on the table border and the caption back on the line it came from, printed
    over the sentence.
    """
    out = [(x0, x1, y1 - 0.4, fitz.Rect(x0, y0, x1, y1))
           for x0, y0, x1, y1 in R.underscore_runs(page)
           if abs((y0 + y1) / 2 - (rect.y0 + rect.y1) / 2) < 6.0]
    out += [(x0, x1, y, None) for x0, x1, y in R.strokes(page)
            if rect.y1 - 4.0 < y < rect.y1 + 6.0]
    return out


def page_rules(page):
    """Every writing rule on the page: underscore runs and drawn strokes."""
    return ([(x0, x1, y1 - 0.4) for x0, _y0, x1, y1 in R.underscore_runs(page)]
            + list(R.strokes(page)))


def standalone(page, lines, chars):
    """True when nothing else is printed beside the caption on its own line.

    "Beside" is within `GUTTER`, not anywhere on the line: these pages set two
    columns, and Form 70A page 1 prints "(Date)" at the left margin with
    "Registrar" 262pt away at the right. They share a line and have nothing to
    do with each other.

    This is what separates a caption that is *already* correctly set under its
    rule from one set inline in a sentence, and it has to be asked before the
    rule above is trusted. Form 70A item 8 prints

        7.  Petitioner's birth date  ______________
        8.  Petitioner's birthplace (province, state or country) ____

    and item 7's rule is directly above item 8's caption and overlaps it
    horizontally. Read on geometry alone that caption looks captioned-below,
    and the pass would have left inline captions on three forms untouched.
    """
    own = {(round(c.x0, 2), round(c.y0, 2)) for c in chars}
    head = lines[0]
    for glyph in line_ink(page, head):
        if (round(glyph.x0, 2), round(glyph.y0, 2)) in own:
            continue
        if glyph.x0 - head.x1 < GUTTER and head.x0 - glyph.x1 < GUTTER:
            return False
    return True


def rule_above(page, rect, rules):
    """The writing rule this caption is already set beneath, if there is one.

    Nothing may be printed between the two. Form 70J stacks a rule, then
    "(Signature of respondent/Spouse Two or lawyer for respondent/Spouse Two)",
    then "(Name, address, telephone number and email address)" -- three lines,
    11.5pt apart. On distance alone the rule is the Name caption's rule, and
    the labelled block drawn from it printed straight over the signature line.
    The rule belongs to the caption directly under it and to no other.
    """
    best = None
    for x0, x1, y in rules:
        if not (rect.y0 - 13.0 <= y <= rect.y0 - 0.5):
            continue
        if x1 <= rect.x0 - 6 or x0 >= rect.x1 + 6:
            continue
        if any(y < g.y0 and g.y1 <= rect.y0 + 1.0 and g.x1 > x0 and g.x0 < x1
               for _c, _f, g in R.inked_glyphs(page)):
            continue
        if best is None or y > best[2]:
            best = (x0, x1, y)
    return best


def cell_of(page, rect):
    """The table cell `rect` sits in, or None if the page is not ruled there.

    All four borders have to be found, and each has to actually span the
    caption -- a horizontal rule that stops short of it is the underline of a
    heading, and a vertical one that does not reach it is the next column's.
    """
    mid_x, mid_y = (rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2
    horizontal, vertical = [], []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                p, q = item[1], item[2]
            elif item[0] == "re" and (item[1].height < 0.9 or item[1].width < 0.9):
                r = item[1]
                p, q = fitz.Point(r.x0, r.y0), fitz.Point(r.x1, r.y1)
            else:
                continue
            if abs(p.y - q.y) < 0.9 and abs(p.x - q.x) > 8:
                horizontal.append((min(p.x, q.x), max(p.x, q.x), (p.y + q.y) / 2))
            elif abs(p.x - q.x) < 0.9 and abs(p.y - q.y) > 8:
                vertical.append((min(p.y, q.y), max(p.y, q.y), (p.x + q.x) / 2))
    above = [y for x0, x1, y in horizontal if x0 <= mid_x <= x1 and y < rect.y0 + 1]
    below = [y for x0, x1, y in horizontal if x0 <= mid_x <= x1 and y > rect.y1 - 1]
    left = [x for y0, y1, x in vertical if y0 <= mid_y <= y1 and x < rect.x0 + 1]
    right = [x for y0, y1, x in vertical if y0 <= mid_y <= y1 and x > rect.x1 - 1]
    if not (above and below and left and right):
        return None
    return fitz.Rect(max(left), max(above), min(right), min(below))


def clear_below(page, x0, x1, y):
    """Points of white paper under `y` across [x0, x1], up to 40."""
    band = fitz.Rect(x0, y, min(x1, page.rect.x1), min(y + 40, page.rect.y1))
    if band.width < 2 or band.height < 1:
        return 40.0
    pix = page.get_pixmap(matrix=fitz.Matrix(8, 8), clip=band, colorspace=fitz.csGRAY)
    wide, high, data = pix.width, pix.height, pix.samples
    for row in range(high):
        if any(data[row * wide + x] < R.INK_DARK for x in range(wide)):
            return row / 8.0
    return 40.0


def white_row(page, low, high):
    """The first raster row in [low, high] that is white across the whole page.

    A band cut has to land on one of these. A glyph's reported cell bottom is
    not the bottom of its ink -- a descender hangs below it -- so cutting at a
    cell boundary shaves the tails off the line above, and a cut inside a
    table rule slices the rule in two.
    """
    band = fitz.Rect(0, low, page.rect.x1, min(high, page.rect.y1))
    if band.height < 0.5:
        return None
    pix = page.get_pixmap(matrix=fitz.Matrix(8, 8), clip=band, colorspace=fitz.csGRAY)
    wide, high_px, data = pix.width, pix.height, pix.samples
    for row in range(high_px):
        if all(data[row * wide + x] >= R.INK_DARK for x in range(wide)):
            return band.y0 + row / 8.0
    return None


def cell_answer(page, cell):
    """The writing space left in a ruled cell after everything printed in it.

    The caption is not moved here and the cell is not reflowed -- see the
    module docstring -- so the blank is simply the rest of the row.
    """
    ink = [g for _c, _f, g in R.inked_glyphs(page) if cell.intersects(g)]
    right = max((g.x1 for g in ink), default=cell.x0)
    x0 = min(right + INK_GAP, cell.x1 - 6.0)
    x1 = cell.x1 - 2.0
    if x1 - x0 < MIN_ANSWER / 2:
        return None
    height = min(FIELD_H, cell.height - 3.0)
    return fitz.Rect(x0, cell.y1 - 1.5 - height, x1, cell.y1 - 1.5)


# ------------------------------------------------------------- planning a page

# The base-14 faces this pass draws with are WinAnsi, and PyMuPDF renders a
# character outside that encoding as a middle dot. PEI's captions are set with
# typographic quotes and dashes -- "(... of petitioner's lawyer)" -- so without
# this the reprinted caption reads "petitioner\u00b7s". Mapped rather than
# dropped: at 5.6pt an ASCII apostrophe is indistinguishable from a curly one.
LATIN = {0x2018: "'", 0x2019: "'", 0x201A: "'", 0x201B: "'",
         0x201C: '"', 0x201D: '"', 0x201E: '"',
         0x2013: "-", 0x2014: "-", 0x2015: "-", 0x2212: "-",
         0x2026: "...", 0x00A0: " ", 0x2009: " ", 0x200A: " ", 0x202F: " "}


def latin(text):
    """`text` with the typography the drawing fonts cannot encode folded down."""
    return "".join(LATIN.get(ord(ch), ch) for ch in text)


def wrap(text, size, width):
    """The caption broken to fit `width`, never breaking inside a word."""
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = (line + " " + word).strip()
        if line and fitz.get_text_length(trial, fontname=CAP_FONT, fontsize=size) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines


def free_bottom(page, lines, chars):
    """How far down the page the caption's own lines actually free up.

    A caption that wraps usually has the rest of its lines to itself, and
    taking it off the page frees them: the rule goes on the first line and the
    small caption is set in the space the other lines were using, so nothing
    has to move. Form 71E is the exception -- "...of this court at (address of
    / court office) on or before (date)..." wraps mid-sentence, and its second
    line goes on with the sentence. There the caption frees only its first
    line, and the space for the small caption has to be inserted directly
    under it, or the caption prints across the words that follow.
    """
    own = {(round(c.x0, 2), round(c.y0, 2)) for c in chars}
    bottom = lines[0].y1
    for line in lines[1:]:
        if any((round(g.x0, 2), round(g.y0, 2)) not in own
               for g in line_ink(page, line)):
            break
        bottom = line.y1
    return round(bottom, 2)


def answer_span(page, rect, lines, chars, chars_index, right, left_edge):
    """Where the blank this caption labels begins and ends, and its rule's y.

    The caption's own width is part of the answer space -- it is being taken
    off the line -- so the span starts where the caption started. Anything
    else printed on the same line is not, so the span stops `INK_GAP` short of
    it, and a blank is only widened out to the text column when the line has
    nothing printed after it at all.

    A caption that wraps is measured on its **first** line: the rule replaces
    that line, and the lines the caption used below it become the room the
    small caption is set in.
    """
    head = lines[0]
    first_bottom = head.y1
    # `head`, never the union rectangle. A caption that wraps mid-sentence has
    # a union spanning both lines end to end: Form 71E sets "...of this court
    # at (address of / court office) on or before...", whose union starts at
    # the left margin, and the rule was drawn from there straight under "YOU
    # ARE REQUIRED TO FILE". The answer space starts where the caption starts.
    x0, x1, y, covered = head.x0, head.x1, first_bottom - 0.4, []
    for rx0, rx1, ry, run in line_rules(page, head):
        if rx0 - head.x1 < ADJACENT and head.x0 - rx1 < ADJACENT:
            x0, x1, y = min(x0, rx0), max(x1, rx1), ry
            if run is not None:
                covered.append(run)
    # The caption's own glyphs are excluded by identity, not by geometry. A
    # type cell carries side bearing, so the `.` that ends "at (address)." has
    # a cell overlapping the `)`'s -- read geometrically it counts as part of
    # the caption, and the rule was drawn straight through the full stop.
    own = {(round(c.x0, 2), round(c.y0, 2)) for c in chars}
    ink = [g for g in line_ink(page, head)
           if (round(g.x0, 2), round(g.y0, 2)) not in own]
    before = [g.x1 for g in ink if g.x1 <= head.x0 + 0.5]
    after = [g.x0 for g in ink if g.x0 >= x1 - 0.5]
    keyed = {(round(g.x0, 2), round(g.y0, 2)) for g in ink if g.x0 >= x1 - 0.5}
    after_chars = sorted((c for c in chars_index
                          if (round(c["rect"].x0, 2), round(c["rect"].y0, 2)) in keyed),
                         key=lambda c: c["rect"].x0)
    if before:
        x0 = max(x0, max(before) + INK_GAP)
    # A blank that ends the sentence is cut short by the sentence's own full
    # stop: "at (address)." leaves 38pt for an address with 350pt of blank
    # paper beyond the stop. Where the *only* thing printed after the caption
    # on the line is that punctuation, it is moved to the far end of the
    # widened rule -- the same operation the caption itself gets, on one glyph.
    # Anything else after the caption, including a full stop with the sentence
    # continuing after it, stops the rule where it is.
    trail = []
    if after and all(g["c"] in TRAILING for g in after_chars):
        trail = list(after_chars)
        after = []
    limit = min(after) - INK_GAP if after else right
    x1 = min(max(x1, min(limit, right)), right)
    # A caption standing alone on its line has the whole line to spend. The
    # joint petition sets "(Name)" hard against the right margin above "Spouse
    # One", 30pt wide, which is not a name line; the rule is opened leftwards
    # to a full writing line, stopping at the page's own text margin.
    if not before and not after and x1 - x0 < MIN_ANSWER:
        x0 = round(max(left_edge, x1 - LINE_WIDTH), 2)
    if trail:
        x1 = round(x1 - sum(t["rect"].width for t in trail) - TRAIL_GAP, 2)
    # The printed run this rule replaces is taken off the page. Left there it
    # sits a fraction of a point off the drawn rule and the two together read
    # as one line that thickens over the run's own length. Only a run the new
    # rule fully covers is removed, so nothing is ever deleted without being
    # redrawn.
    covered = [run for run in covered if run.x0 >= x0 - 0.5 and run.x1 <= x1 + 0.5]
    return round(x0, 2), round(x1, 2), round(y, 2), round(first_bottom, 2), trail, covered


def stacked_job(page, item, above, labels, right):
    """A multi-part caption that already sits under a rule of its own.

    "(Name, address, telephone number and email address)" under a single rule
    is four answers on one line. The printed rule becomes the Name line and the
    other three are drawn beneath it; the caption then moves below all four.
    Labels are set to the *right* of their own column, ending just before the
    rules begin, because these blocks sit in the right half of the page with
    clear paper to their left and an inset label would print over the rule the
    page already carries.
    """
    rect, x0, x1, y = item["rect"], above[0], above[1], above[2]
    widest = max(fitz.get_text_length(label + ":", fontname=LABEL_FONT,
                                      fontsize=LABEL_SIZE) for label in labels)
    left = [g.x1 for g in line_ink(page, fitz.Rect(x0, y - 11, x1, y))
            if g.x1 <= x0 + 0.5]
    room = x0 - (max(left) + INK_GAP if left else 0.0)
    align = x0 - 2.0 if room > widest + 2.0 else None
    rules = [{"label": labels[i] + ":", "x0": x0, "rx0": x0, "x1": x1,
              "y": y + i * SUB_PITCH, "align": align}
             for i in range(len(labels))]
    cap_lines = wrap(latin(item["text"].strip()), CAP_SIZE, max(x1 - x0, 90.0))
    baseline = rules[-1]["y"] + CAP_LEAD + CAP_SIZE * CAP_ASC
    return {"kind": "reflow", "rect": rect, "text": item["text"],
            "phrase": inner(item["text"]), "lines": item["lines"], "rules": rules,
            "cap_lines": cap_lines, "cap_size": CAP_SIZE, "trail": [],
            "first_bottom": rect.y1, "line_bottom": rect.y1, "freed": rect.y1,
            "bottom": baseline + (len(cap_lines) - 1) * CAP_SIZE * 1.2
            + CAP_SIZE * CAP_DESC}


# A caption cut in half by the page break, the only one in the batch. Form 70B
# sets "AND TO  (Name and address of petitioner's" as the last line of page 1
# and "lawyer or petitioner)" as the first of page 2, so neither page carries a
# closed bracket and no scan of either sees a caption at all. It left the AND
# TO service block bare on a page whose TO block directly above it had been
# given labelled writing rules.
#
# The answer space belongs on page 1 with the rest of the block; the orphaned
# tail is taken off page 2, because the whole caption is reprinted under the
# rules on page 1 and leaving the tail would print half of it twice.
#
# (docId, page, the caption's line on that page, the whole caption, the page
#  the tail is on, the tail's line)
SPLIT_CAPTIONS = [
    ("PEISC_70B", 1, (180.1, 667.6, 316.6, 678.6),
     "(Name and address of petitioner\u2019s lawyer or petitioner)",
     2, (180.1, 115.2, 263.4, 126.3)),
]


def still_printed(page, box):
    """True while body-size text is still set in `box` -- the idempotence key.

    These two entries are the one place the pass works from a written-down
    rectangle rather than from what it found on the page, so they need their
    own "already done" test: once the caption has been taken off page 1 and
    the tail off page 2, both rectangles are blank paper.
    """
    rect = fitz.Rect(box)
    return any(size >= 8.0 and rect.intersects(cell)
               for _c, cell, size, _l in
               [(c["c"], c["rect"], c["size"], 0) for c in page_chars(page)])


def split_caption_items(page, doc_id, number):
    """The page-break-split captions on this page, shaped like `brackets` rows."""
    out = []
    for did, page_no, box, text, _tail_page, _tail in SPLIT_CAPTIONS:
        if did != doc_id or page_no != number or not still_printed(page, box):
            continue
        rect = fitz.Rect(box)
        out.append({"text": text, "rect": rect, "lines": [rect],
                    "chars": [rect], "size": 10.0})
    return out


def split_caption_tails(page, doc_id, number):
    """Rectangles on this page holding the tail of a split caption."""
    return [fitz.Rect(tail)
            for did, _p, _b, _t, tail_page, tail in SPLIT_CAPTIONS
            if did == doc_id and tail_page == number and still_printed(page, tail)]


def plan_page(page, right, left_edge, existing, extra=()):
    """Every caption job on one page, in two phases.

    The second phase is why: how far the page has to open up for a caption
    depends on what sits *under* it, and a text field counts. `FillPdf.savePdf`
    paints a white rectangle behind every field before it stamps the value, so
    a field on the next line whose box reaches up over the caption erases the
    caption on export -- exactly the defect this pass exists to fix, moved down
    one line. The rules the pass is about to draw create such fields too, so
    the obstacles cannot be known until every rule on the page is placed.
    """
    jobs, skipped, drafts = [], [], []
    chars_index = page_chars(page)
    rules_on_page = page_rules(page)
    for item in list(brackets(page)) + list(extra):
        text, rect, lines = item["text"], item["rect"], item["lines"]
        phrase = inner(text)
        if NARRATIVE.match(phrase):
            skipped.append((rect, phrase, "narrative"))
            continue
        if not CAPTION.match(phrase):
            continue
        if item["size"] < 8.0:
            continue                        # already set small: this pass has run
        cell = cell_of(page, rect)
        if cell is not None:
            target = cell_answer(page, cell)
            if target is not None and not any(
                    (box & target).get_area() > 0.6 * target.get_area()
                    for box in existing):   # a cell already answered stays as it is
                jobs.append({"kind": "cell", "rect": rect, "text": text,
                             "phrase": phrase, "cell": cell, "lines": lines,
                             "target": target})
            continue
        labels = parts_of(text)
        above = (rule_above(page, rect, rules_on_page)
                 if standalone(page, lines, item["chars"]) else None)
        if above is not None and not labels:
            continue        # the form already sets this caption under its rule
        if above is not None:
            # A contact block that is already ruled: keep the printed rule as
            # the first writing line and stack the rest under it, so the page's
            # own geometry is not redrawn to say the same thing.
            drafts.append(stacked_job(page, item, above, labels, right))
            continue
        x0, x1, y, first_bottom, trail, covered = answer_span(
            page, rect, lines, item["chars"], chars_index, right, left_edge)
        rules = []
        for index in range(max(1, len(labels))):
            label = labels[index] + ":" if labels else None
            offset = (fitz.get_text_length(label, fontname=LABEL_FONT,
                                           fontsize=LABEL_SIZE) + 3.0) if label else 0.0
            rules.append({"label": label, "x0": x0, "rx0": x0 + offset,
                          "x1": x1, "y": y + index * SUB_PITCH, "align": None})
        cap_lines = wrap(latin(text.strip()), CAP_SIZE, max(x1 - x0, 90.0))
        baseline = rules[-1]["y"] + CAP_LEAD + CAP_SIZE * CAP_ASC
        freed = free_bottom(page, lines, item["chars"])
        drafts.append({"kind": "reflow", "rect": rect, "text": text, "phrase": phrase,
                       "freed": freed,
                       "lines": lines, "rules": rules, "cap_lines": cap_lines,
                       "cap_size": CAP_SIZE, "first_bottom": first_bottom,
                       "trail": trail, "covered": covered,
                       "bottom": baseline + (len(cap_lines) - 1) * CAP_SIZE * 1.2
                       + CAP_SIZE * CAP_DESC,
                       "line_bottom": freed})

    for draft in drafts:
        draft["boxes"] = [fitz.Rect(rule["rx0"], rule["y"] - FIELD_H, rule["x1"], rule["y"])
                          for rule in draft["rules"]]
    for draft in drafts:
        rect = draft["rect"]
        # The band probed for room is the one the *caption* will occupy, not
        # the rule's: the caption is set from the rule's left edge and is
        # regularly wider or narrower than the rule above it. Probed over the
        # rule alone, Form 70S's "(date)" for the Children's Lawyer blank found
        # clear paper -- the line below stops just short of that 20pt rule --
        # and printed itself immediately after "presented by the petitioner).",
        # reading as part of that sentence. The gutter is what keeps a caption
        # from sitting *beside* the next line as well as on top of it.
        first, last = draft["rules"][0], draft["rules"][-1]
        widest = max(fitz.get_text_length(line, fontname=CAP_FONT,
                                          fontsize=CAP_SIZE)
                     for line in draft["cap_lines"])
        span = (min(first["x0"], last["x0"]) - GUTTER / 2,
                max(first["x1"], last["x0"] + widest + GUTTER / 2))
        # A job's own stacked sub-rules are not obstacles to its own caption --
        # they are the thing the caption belongs to.
        boxes = list(existing) + [box for other in drafts if other is not draft
                                  for box in other["boxes"]]
        edge = draft["freed"]
        tops = [box.y0 for box in boxes
                if box.y0 > edge - 0.5 and box.x1 > span[0] and box.x0 < span[1]]
        limit = min(edge + clear_below(page, span[0], span[1], edge + 0.2),
                    min(tops) if tops else 1e9)
        draft["need"] = max(0.0, round(draft["bottom"] - limit + CLEARANCE, 2))
        jobs.append(draft)
    for draft in drafts:
        draft.pop("boxes")
    return jobs, skipped


def cuts_for(page, jobs):
    """One band cut per text line that needs one, at a white raster row."""
    lines = {}
    for job in jobs:
        if job["kind"] != "reflow" or job["need"] <= 0.05:
            continue
        key = round(job["line_bottom"], 1)
        lines[key] = max(lines.get(key, 0.0), job["need"])
    cuts = []
    for bottom, need in sorted(lines.items()):
        row = white_row(page, bottom + 0.2, bottom + 14.0)
        if row is None:
            continue                        # nothing to cut on: leave the line alone
        cuts.append((round(row, 2), round(need, 2)))
    merged = []
    for row, need in cuts:
        if merged and row - merged[-1][0] < 0.5:
            merged[-1] = (merged[-1][0], max(merged[-1][1], need))
        else:
            merged.append((row, need))
    return merged


def shift_at(cuts, y):
    """How far down a point at `y` moves once the bands are inserted."""
    return sum(need for row, need in cuts if row <= y)


# ---------------------------------------------------------------- applying it

def redact_rects(job):
    """One rectangle per line the caption occupies.

    Never the union: a caption that wraps has a bounding box spanning both
    lines end to end, and redacting that takes the prose either side of it
    with it.
    """
    # Not padded. The sentence's own punctuation sits flush against the closing
    # bracket -- `(day),` and `(date).` -- and half a point of margin takes the
    # comma with the caption, deleting it from the sentence.
    return (list(job["lines"]) + [t["rect"] for t in job.get("trail", ())]
            + list(job.get("covered", ())))


def rebuild(src, plans):
    """Copy the document, re-placing each page's bands lower where asked.

    A page with no cut is copied object for object, so the pass touches only
    the pages it has a reason to touch.

    **Each band is cleaned before it is placed.** `show_pdf_page` re-places the
    whole source page and relies on a clip to hide the rest, and a clip is
    something the renderer honours but `get_drawings` does not: placed raw, a
    four-band page reports Form 70A's "Adultery" underline four times, once per
    band, at four different offsets. Only one of them is on the page. Every
    other tool in this directory reads rules out of `get_drawings` --
    `pass_blanks`, `seat_boxes_on_rules`, `audit_drawn_rules` -- so those ghosts
    would be read as writing rules and boxed. Redacting the out-of-band area
    with `REMOVE_IF_COVERED` deletes that line art for real, and no ink is ever
    lost to it because a cut only ever lands on a raster row that is white
    across the whole page.

    The redaction is `TEXT_NONE` on purpose. Text extraction already honours
    the clip -- the words come back once, at the right coordinates -- while a
    glyph's *cell* is taller than its ink and overlaps the cut, so removing
    text by rectangle would delete the line above and the line below the cut
    from both bands.
    """
    out, sources = fitz.open(), []
    for index in range(src.page_count):
        cuts = plans.get(index + 1, {}).get("cuts") or []
        if not cuts:
            out.insert_pdf(src, from_page=index, to_page=index)
            continue
        box = src[index].rect
        page = out.new_page(width=box.width, height=box.height)
        bands, previous, shift = [], 0.0, 0.0
        for row, need in cuts:
            bands.append((previous, row, shift))
            previous, shift = row, shift + need
        bands.append((previous, box.height, shift))
        for y0, y1, moved in bands:
            band = fitz.Rect(0, y0, box.width, y1)
            clean = fitz.open()
            clean.insert_pdf(src, from_page=index, to_page=index)
            for outside in (fitz.Rect(0, 0, box.width, y0),
                            fitz.Rect(0, y1, box.width, box.height)):
                if outside.height > 0.01:
                    clean[0].add_redact_annot(outside)
            clean[0].apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                                      graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED,
                                      text=fitz.PDF_REDACT_TEXT_NONE)
            page.show_pdf_page(fitz.Rect(0, y0 + moved, box.width, y1 + moved),
                               clean, 0, clip=band)
            sources.append(clean)
    return out, sources


def draw_page(page, jobs, cuts):
    """Draw the rules and the small captions onto the reflowed page."""
    drawn = []
    for job in jobs:
        if job["kind"] != "reflow":
            continue
        moved = shift_at(cuts, job["rect"].y0)
        for rule in job["rules"]:
            y = rule["y"] + moved
            if rule["label"]:
                width = fitz.get_text_length(rule["label"], fontname=LABEL_FONT,
                                             fontsize=LABEL_SIZE)
                at = rule["align"] - width if rule.get("align") else rule["x0"]
                page.insert_text(fitz.Point(at, y - 1.6), rule["label"],
                                 fontsize=LABEL_SIZE, fontname=LABEL_FONT, color=(0, 0, 0))
            page.draw_line(fitz.Point(rule["rx0"], y), fitz.Point(rule["x1"], y),
                           color=(0, 0, 0), width=RULE_WIDTH)
            drawn.append((rule["rx0"], rule["x1"], y))
        first = job["rules"][0]
        pen = first["x1"] + TRAIL_GAP
        for mark in job.get("trail", ()):
            page.insert_text(fitz.Point(pen, mark["origin"].y + moved), mark["c"],
                             fontsize=mark["size"], fontname=LABEL_FONT, color=(0, 0, 0))
            pen += mark["rect"].width
        last = job["rules"][-1]
        baseline = last["y"] + moved + CAP_LEAD + job["cap_size"] * CAP_ASC
        for index, line in enumerate(job["cap_lines"]):
            page.insert_text(fitz.Point(last["x0"], baseline + index * job["cap_size"] * 1.2),
                             line, fontsize=job["cap_size"], fontname=CAP_FONT,
                             color=(0, 0, 0))
    return drawn


def seat(page, rect):
    """Put the box's bottom edge on the top of the rule it is drawn over.

    Measured with `repair_pei_fields.rule_under`, which reads the ink off the
    rendered page, rather than from the y this pass drew the line at: the two
    differ by half a stroke, and `seat_flat` -- the pass that owns PEI's
    seating -- measures the ink. Seating a new field any other way leaves it
    reported as unseated for ever.
    """
    top = R.rule_under(page, rect)
    if top is None or abs(top - rect.y1) > SEAT_REACH:
        return rect
    return fitz.Rect(rect.x0, top - rect.height, rect.x1, top)


def field_rect(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def move_fields(fields, page_no, cuts):
    """Carry the page's existing fields down with the bands they sit in.

    A text field is placed by the rule under its **bottom** edge, and the cut
    for that rule's own line is below it, so measuring the shift at the bottom
    edge keeps a field with the line it belongs to. A checkbox is measured at
    its centre: it is fitted to the ink of a printed square and has no rule.
    """
    for field in fields:
        if field.get("page") != page_no:
            continue
        rect = field_rect(field)
        anchor = (rect.y0 + rect.y1) / 2 if field["type"] == "CheckBox" else rect.y1
        moved = shift_at(cuts, anchor)
        if moved:
            field["y"] = round(field["y"] + moved, 2)


def claim(fields, page_no, band, taken):
    """Drop the fields a new blank replaces, and report whether any was there.

    An existing box over the caption is exactly the defect being fixed -- it
    is the one printing a white rectangle over the printed words -- so it is
    replaced rather than left beside its successor. Checkboxes are never
    claimed: an option square is not a blank.
    """
    keep, replaced = [], 0
    for field in fields:
        rect = field_rect(field)
        if (field.get("page") != page_no or field["type"] == "CheckBox"
                or not rect.intersects(band)):
            keep.append(field)
            continue
        overlap = (rect & band).get_area()
        if overlap > 0.4 * min(rect.get_area(), band.get_area()):
            replaced += 1
            taken.discard(field["id"])
            continue
        keep.append(field)
    return keep, replaced


def plan(doc_id):
    """Everything this pass would do to one template, without doing any of it."""
    mapping = R.load(doc_id)
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    plans, narrative = {}, []
    try:
        for number in range(1, doc.page_count + 1):
            page = doc[number - 1]
            # Checkboxes count. A checkbox is fitted to the ink of its printed
            # square, so its rectangle *is* the square, and a caption dropped
            # onto it both prints over the mark and re-fits the box to the
            # caption's own ink the next time `fit_ticks` runs.
            existing = [field_rect(f) for f in mapping["staticFields"]
                        if f.get("page") == number]
            # And the *type cell* of every option square, which is taller than
            # the square drawn inside it. `fit_ticks` fits a checkbox to the ink
            # it finds in that cell, so a caption whose tail reaches into the
            # cell -- even without touching the square -- is measured as part of
            # the mark: on Form 70A page 4 that turned a 5.6 x 5.5pt box into
            # 6.8 x 10.8pt over the "Yes" square.
            existing += [rect for char, _font, rect in R.glyphs(page)
                         if ord(char) in R.TICK_GLYPHS]
            jobs, skipped = plan_page(page, column(page), margin(page), existing,
                                      split_caption_items(page, doc_id, number))
            narrative += [(number, phrase) for _rect, phrase, _why in skipped]
            tails = split_caption_tails(page, doc_id, number)
            if not jobs and not tails:
                continue
            plans[number] = {"jobs": jobs, "cuts": cuts_for(page, jobs),
                             "tails": tails}
    finally:
        doc.close()
    return mapping, plans, narrative


def budget(doc_id, plans):
    """Pages whose content would be pushed past the bottom margin. Must be []."""
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    over = []
    try:
        for number, page_plan in plans.items():
            cuts = page_plan["cuts"]
            if not cuts:
                continue
            page = doc[number - 1]
            bottom = max((fitz.Rect(b[:4]).y1 for b in page.get_text("blocks")), default=0.0)
            for _x0, _x1, y in R.strokes(page):
                bottom = max(bottom, y)
            after = bottom + shift_at(cuts, bottom)
            if after > page.rect.y1 - PAGE_FOOT:
                over.append((number, round(after, 1), round(page.rect.y1 - PAGE_FOOT, 1)))
    finally:
        doc.close()
    return over


def apply(doc_id, plans, mapping):
    """Redact, reflow, draw, and re-seat the fields. Returns a change count."""
    path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    src = fitz.open(path)
    fields = mapping["staticFields"]
    # A template can ship with no fields at all (Form 70J is a consent, printed
    # blank), and `new_id` needs something to count from. The floor is the base
    # the builder itself started at, so an id minted here sorts with the rest.
    taken = {int(f["id"]) for f in fields} or {ID_FLOOR}
    added = replaced = 0
    try:
        for number, page_plan in plans.items():
            page = src[number - 1]
            for job in page_plan["jobs"]:
                if job["kind"] == "reflow":
                    for rect in redact_rects(job):
                        page.add_redact_annot(rect, fill=(1, 1, 1))
            for rect in page_plan.get("tails", ()):
                page.add_redact_annot(rect, fill=(1, 1, 1))
        for page in src:
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
        out, sources = rebuild(src, plans)
        for number, page_plan in plans.items():
            cuts = page_plan["cuts"]
            move_fields(fields, number, cuts)
            for band in draw_page(out[number - 1], page_plan["jobs"], cuts):
                x0, x1, y = band
                rect = seat(out[number - 1], fitz.Rect(x0, y - FIELD_H, x1, y))
                fields, hits = claim(fields, number, rect, taken)
                replaced += hits
                fields.append(R.make_field("TextField", number, rect.x0, rect.y0,
                                           rect.x1, rect.y1, taken,
                                           fontSize=FIELD_SIZE, compact=True,
                                           rule="bottom"))
                added += 1
            for job in page_plan["jobs"]:
                if job["kind"] != "cell":
                    continue
                rect = seat(out[number - 1], job["target"])
                fields, hits = claim(fields, number, rect, taken)
                if hits:
                    replaced += hits
                fields.append(R.make_field("TextField", number, rect.x0, rect.y0,
                                           rect.x1, rect.y1, taken,
                                           fontSize=FIELD_SIZE, compact=True))
                added += 1
        mapping["staticFields"] = fields
        handle, temp = tempfile.mkstemp(suffix=".pdf", dir=EXPORT)
        os.close(handle)
        try:
            out.save(temp, garbage=4, deflate=True)
            os.replace(temp, path)
        finally:
            if os.path.exists(temp):
                os.unlink(temp)
        out.close()
        for source in sources:
            source.close()
    finally:
        src.close()
    with open(os.path.join(EXPORT, "%s.json" % doc_id), "w") as handle:
        json.dump(mapping, handle, indent=2)
        handle.write("\n")
    return added, replaced


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--only", nargs="*", default=None)
    args = parser.parse_args()

    wanted = args.only or R.doc_ids()
    totals = {"captions": 0, "reflowed": 0, "cells": 0, "narrative": 0,
              "added": 0, "replaced": 0, "space": 0.0}
    over_budget = []
    for doc_id in wanted:
        mapping, plans, narrative = plan(doc_id)
        jobs = [job for page_plan in plans.values() for job in page_plan["jobs"]]
        if not jobs and not narrative:
            continue
        space = sum(need for page_plan in plans.values()
                    for _row, need in page_plan["cuts"])
        totals["captions"] += len(jobs)
        totals["reflowed"] += sum(1 for job in jobs if job["kind"] == "reflow")
        totals["cells"] += sum(1 for job in jobs if job["kind"] == "cell")
        totals["narrative"] += len(narrative)
        totals["space"] += space
        over = budget(doc_id, plans)
        over_budget += [(doc_id,) + row for row in over]
        line = ("%-18s captions=%-3d reflow=%-3d cell=%-2d narrative=%-2d space=%.1fpt"
                % (doc_id, len(jobs),
                   sum(1 for job in jobs if job["kind"] == "reflow"),
                   sum(1 for job in jobs if job["kind"] == "cell"),
                   len(narrative), space))
        if not args.check and jobs:
            added, replaced = apply(doc_id, plans, mapping)
            totals["added"] += added
            totals["replaced"] += replaced
            line += "  fields+%d/-%d" % (added, replaced)
        print(line)

    if over_budget:
        print("OVER BUDGET (not applied cleanly):")
        for row in over_budget:
            print("   ", row)
    print("%s: captions=%d reflow=%d cell=%d narrative-left=%d space=%.0fpt "
          "fields+%d/-%d"
          % ("would change" if args.check else "changed", totals["captions"],
             totals["reflowed"], totals["cells"], totals["narrative"],
             totals["space"], totals["added"], totals["replaced"]))
    return 1 if over_budget else 0


if __name__ == "__main__":
    sys.exit(main())

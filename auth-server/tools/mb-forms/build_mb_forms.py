"""Build the Manitoba King's Bench (Family Division) templates from Rule 70 PDFs.

Like Saskatchewan, the Manitoba sources carry **no widgets and no XFA** -- they
are Word-derived PDFs with a real text layer -- so there is no government
rectangle to copy and every box is read off a printed anchor. What is new here is
*which* anchor, and it is the reason this is a separate builder rather than a
flag on the Saskatchewan one:

**Manitoba prints its writing lines as geometry, not as underscores.** Where the
King's Printer sets a blank as `______________`, Manitoba Justice's Word template
draws a filled rectangle about 0.8pt tall (Forms 70D, 70D.1, 70D.5, 70W) or a
stroked line (Form 70U, whose producer differs). Across the financial batch there
are 1,528 of those against 12 underscore runs, so a detector built on underscores
alone finds essentially nothing on these forms.

That single fact brings its own hazard, which is most of the care in this file.
Word draws an **underline under printed text with the very same primitive**. A
writing rule and the underline beneath "(A) TOTAL ANNUAL INCOME:" are the same
kind of object to `get_drawings()`, and telling them apart is what
`_is_underline` does: measured on Form 70D p3, an underline is covered by glyphs
over 94-95% of its length and a writing rule over 0%, so the cut at 50% has the
whole of that gap to sit in.

The four vocabularies the financial batch uses, and no others:

* **A printed rule** -- filled rect or stroked line -- is a blank to write on,
  unless it is a table border, an underline, or somebody's signature line.
* **A ruled grid** is a table, and an empty cell in it is a field. A cell the
  government already filled with a row label is not (guide 9.3); a cell holding
  only a `$` is an amount field that starts after the `$` (guide 4).
* **A run of underscores** is a blank, on the few forms that use them.
* **A `(full name)` caption under blank paper** is a blank: Manitoba's style of
  cause leaves the party lines as bare paper and captions them from *below*,
  so there is no rule and no cell to find.

**The background PDF ships byte-identical to the government's own file**, for
the reason Saskatchewan's does: the rules already print as the writing line, so
the most defensible background is the one Manitoba Justice published, and a
re-fetch can be diffed against what we ship.

Run:
    python3 build_mb_forms.py                 # the shipped batch, dry run
    python3 build_mb_forms.py --only MBKB_70D # one form
    python3 build_mb_forms.py --promote       # copy into form-template-export/
"""
import argparse
import collections
import json
import os
import re
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))

import bc_pipeline as bp  # noqa: E402
from mb_sources import all_sources, shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_mb")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

SCALE = bp.SCALE

# --- measured constants -----------------------------------------------------
# A printed rule is a filled rect this thin or thinner. Measured across the
# financial batch: every writing rule and table border is 0.72-0.84pt, and the
# next thicker filled rect on any of these pages is a 9pt shading band, so the
# cut has 8pt of clear air in it.
RULE_MAX_THICK = 1.6
# A box sits just clear of its own rule rather than on it (guide 9.1).
RULE_CLEARANCE = 1.3
# A blank is one line of writing; the height follows the font it was set in.
LINE_RATIO = 1.3
# The size to seat a rule at when no type shares its line. Form 70D, 70D.1 and
# 70W are set in 10pt throughout (1,366 of 1,431 glyphs on 70D p3); this is only
# ever reached by a rule standing alone on an otherwise blank line.
DEFAULT_FONT = 10.0
# Shorter than this is a stray, not a blank anyone can type in.
MIN_BLANK_WIDTH = 16.0
# Room left between a blank and a letter printed hard against it, and between a
# box and the rule of the blank above. Both exist because the viewer draws a
# bordered control inside the rectangle we store.
EDGE_CLEARANCE = 1.5
STACK_GAP = 1.0
# A stroked square in the checkbox size range. The financial batch prints none --
# Form 70Z's ballot boxes are a `☐` glyph, not geometry -- but the later batches
# do, and leaving the detector in costs nothing on a form with no squares.
CB_MIN, CB_MAX = 4.0, 20.0
# Table geometry, as Saskatchewan's: the width floor stays below a narrow
# furniture column so it can be *seen* and classified rather than silently
# dropped. Form 70D.5's valuation columns are the narrowest real data columns in
# the batch at 62pt, and Form 70U's row-label column the widest cell at 380pt.
CELL_MIN_WIDTH, CELL_MIN_HEIGHT, CELL_MAX_HEIGHT = 8.0, 12.0, 420.0
NARROW_COLUMN = 40.0
TICK_GLYPHS = set("✓✔√")
TICK_SIDE = 9.0
GRID_TOL = 1.5          # two rules this close are the same rule
GRID_COVER = 0.80       # a border must run this much of the cell's edge
# A cell taller than this many lines is a paragraph box, not a one-line cell.
TEXTAREA_LINES = 1.75
# Manitoba shades its table heading rows grey and leaves data rows white.
# Measured on Form 70D.5 p1: heading cells read 191-208, data cells 255.
SHADED_BELOW = 248
SHADE_ZOOM = 2.0

# The share of a rule's length that has to be covered by printed glyphs sitting
# on it before it is read as an underline rather than a blank. See the module
# docstring: the measured populations are 0% and 94-95%.
UNDERLINE_COVER = 0.50
# How far above a rule to look for the type that would make it an underline, as a
# multiple of the font size. One line: an underline's glyphs sit directly on it.
UNDERLINE_BAND = 1.3

UNDERSCORE_RUN = re.compile(r"_+")
TOTAL_ROW = re.compile(r"\b(sub)?total\b", re.I)

# --- signature vocabulary ---------------------------------------------------
# Manitoba captions its signature rules from below, in three shapes, all matched
# as a whole line so a sentence that mentions the office in passing is not read
# as a caption:
#
#   "Signature of Deponent", "Signature of Petitioner"   -- the word itself
#   "A Commissioner for Oaths in and for the Province of Manitoba"
#   "Deputy Registrar" / "Registrar"                      -- the office alone
MB_SIG_CAPTION = re.compile(r"^\s*\(?\s*(your\s+)?signature\b", re.I)
MB_COMMISSIONER = re.compile(
    r"^\s*a\s+commissioner\s+for\s+oaths\b|^\s*a\s+notary\s+public\b", re.I)
MB_SIG_EXCLUDE = re.compile(r"date of signature", re.I)
MB_ROLE_CAPTION = re.compile(
    r"^\s*\(?\s*(deputy\s+)?(local\s+)?(registrar|judge|justice|clerk|"
    r"associate\s+judge)\s*\)?\s*$", re.I)
# "My Commission expires: ______" is a real blank the commissioner fills in, and
# it sits inside the jurat block where the signature captions live. Naming it
# keeps it out of the signature sweep's reach.
MB_SIG_KEEP = re.compile(r"commission\s+expires", re.I)

# The jurat's bracket column. Manitoba sets its jurat as two columns joined by a
# run of ")" characters, with the deponent's signature rule to the right of them
# and *no caption at all* -- Form 70D p1 is the case. A rule that starts to the
# right of a bracket column and shares its vertical span is that signature line;
# nothing else on these forms sits in that position.
JURAT_BRACKET = ")"
JURAT_MIN_BRACKETS = 3
JURAT_BAND = 6.0
# The line pitch a bracket column is allowed to run at. Form 70D p1's jurat sets
# its brackets 12.6pt apart; the parenthesised captions that share an x with each
# other on the same page stand 246pt apart.
JURAT_MAX_PITCH = 20.0


def line_chars(page):
    """Every text line as (text, per-character rects, font size).

    Character boxes, not span boxes: a blank's width has to be the run's own
    extent, and a span can hold the caption printed either side of it.
    """
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            chars, boxes, sizes = [], [], []
            for span in line["spans"]:
                for char in span["chars"]:
                    chars.append(char["c"])
                    boxes.append(fitz.Rect(char["bbox"]))
                    sizes.append(span["size"])
            if chars:
                yield "".join(chars), boxes, sizes


def page_chars(page):
    """Every printed non-blank character on the page as (rect, char, size)."""
    out = []
    for text, boxes, sizes in line_chars(page):
        for index, char in enumerate(text):
            if char.strip():
                out.append((boxes[index], char, sizes[index]))
    return out


def signature_captions(page):
    """Rects of the captions that mark a rule as somebody's signature line."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if MB_SIG_EXCLUDE.search(text) or MB_SIG_KEEP.search(text):
                continue
            if (MB_SIG_CAPTION.search(text) or MB_COMMISSIONER.search(text)
                    or MB_ROLE_CAPTION.match(text)):
                out.append(fitz.Rect(line["bbox"]))
    return out


def jurat_brackets(page):
    """The x of each jurat bracket column, with the y span it runs over.

    Read as lines of ")" rather than as one glyph, because a single ")" is
    ordinary punctuation -- "(name)" ends in one on nearly every page. A column
    is three or more of them stacked, which is what the jurat prints and what
    prose never does.
    """
    marks = []
    for text, boxes, _sizes in line_chars(page):
        for index, char in enumerate(text):
            if char == JURAT_BRACKET:
                marks.append(boxes[index])
    columns = collections.defaultdict(list)
    for box in marks:
        columns[round((box.x0 + box.x1) / 2, 0)].append(box)

    out = []
    for x, members in columns.items():
        if len(members) < JURAT_MIN_BRACKETS:
            continue
        # A tight vertical stack, which is what separates a jurat's bracket
        # column from ordinary punctuation that happens to line up. Form 70D p1
        # sets its four brackets on a 12.6pt pitch; the ")" of "(FAMILY
        # DIVISION)" and of "(Petitioner/Respondent)" also agree on x to within
        # 0.03pt, but they stand 246pt apart, so the run test never joins them.
        # Nothing here reads the gap to the word before the bracket: two of the
        # four are printed straight after the comma ending the left column's
        # line, 3pt clear, and the other two after a full tab.
        tops = sorted(box.y0 for box in members)
        run = [tops[0]]
        best = list(run)
        for top in tops[1:]:
            if top - run[-1] <= JURAT_MAX_PITCH:
                run.append(top)
            else:
                run = [top]
            if len(run) > len(best):
                best = list(run)
        if len(best) < JURAT_MIN_BRACKETS:
            continue
        inside = [box for box in members if best[0] <= box.y0 <= best[-1]]
        out.append((x, min(b.y0 for b in inside), max(b.y1 for b in inside)))
    return out


# --- printed rules ----------------------------------------------------------

def _segments(page):
    """Horizontal and vertical rules as [centre, from, to] lists.

    Reads **both** primitives. Manitoba's main Word template emits every rule --
    writing line and table border alike -- as a filled rectangle a fraction of a
    point thick, while Form 70U's producer emits stroked lines; a build that read
    only one of the two found 1,076 rules on Form 70D.5 and none on Form 70U, or
    the reverse.
    """
    horizontal, vertical = [], []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                a, b = item[1], item[2]
                if abs(a.y - b.y) < 0.6 and abs(a.x - b.x) > 1:
                    horizontal.append([round((a.y + b.y) / 2, 1),
                                       min(a.x, b.x), max(a.x, b.x)])
                elif abs(a.x - b.x) < 0.6 and abs(a.y - b.y) > 1:
                    vertical.append([round((a.x + b.x) / 2, 1),
                                     min(a.y, b.y), max(a.y, b.y)])
            elif item[0] == "re":
                rect = fitz.Rect(item[1])
                if rect.height <= RULE_MAX_THICK and rect.width > 1:
                    horizontal.append([round((rect.y0 + rect.y1) / 2, 1),
                                       rect.x0, rect.x1])
                elif rect.width <= RULE_MAX_THICK and rect.height > 1:
                    vertical.append([round((rect.x0 + rect.x1) / 2, 1),
                                     rect.y0, rect.y1])
    return _merge_segments(horizontal), _merge_segments(vertical)


def _merge_segments(segments, tol=GRID_TOL):
    """Join collinear rules drawn as several touching pieces.

    Segments are gathered into bands of near-equal key **before** being ordered
    by position, rather than sorted on (key, start) together. Manitoba draws the
    underline under "(A) TOTAL ANNUAL INCOME:" and the amount rule 99pt to its
    right as two rects whose centres differ by a tenth of a point, so a combined
    sort hands them over right-hand-first -- and a "does this start where the
    last one ended" test then merged them into a single 273pt rule, which
    swallowed the heading and cost the amount its own box. Merging within a band,
    in position order, cannot join two rules that do not touch.
    """
    bands = []
    for key, start, end in sorted(segments):
        if bands and abs(bands[-1][0] - key) <= tol:
            bands[-1][1].append((start, end))
            continue
        bands.append((key, [(start, end)]))
    out = []
    for key, spans in bands:
        for start, end in sorted(spans):
            if out and out[-1][0] == key and start <= out[-1][2] + 2:
                out[-1][2] = max(out[-1][2], end)
                continue
            out.append([key, start, end])
    return out


def _covered(segments, key, start, end, tol=2.0, fraction=GRID_COVER):
    need = (end - start) * fraction
    for other_key, a, b in segments:
        if abs(other_key - key) <= tol and min(end, b) - max(start, a) >= need:
            return True
    return False


def _font_at(chars, key, x0, x1):
    """The size of the type sharing a rule's own line, for seating its box.

    Looked up on the rule's line rather than page-wide because these forms mix
    10pt body with 8pt italic captions, and a blank set beside an 8pt caption is
    still a 10pt blank -- so the *largest* size on the line is the right answer,
    not the nearest.
    """
    sizes = [size for box, _char, size in chars
             if key - UNDERLINE_BAND * DEFAULT_FONT <= (box.y0 + box.y1) / 2 <= key
             and box.x1 > x0 - 120 and box.x0 < x1 + 120]
    return max(sizes) if sizes else DEFAULT_FONT


def _is_underline(chars, key, x0, x1, size):
    """Is this rule the underline beneath printed type rather than a blank?

    Word draws both with the same primitive. The discriminator is how much of the
    rule's own length carries glyphs sitting on it: measured on Form 70D p3, the
    two underlines read 94% and 95% and all 44 writing rules read 0%.
    """
    width = x1 - x0
    if width <= 0:
        return False
    covered = 0.0
    for box, _char, _size in chars:
        centre = (box.y0 + box.y1) / 2
        if not key - UNDERLINE_BAND * size <= centre <= key:
            continue
        overlap = min(box.x1, x1) - max(box.x0, x0)
        if overlap > 0:
            covered += overlap
    return covered / width >= UNDERLINE_COVER


def _is_table_border(vertical, key, start, end):
    """Is this horizontal a table's rule rather than a line to write on?

    Two shapes, and the batch needs both. Neither depends on a *cell* surviving,
    which is the point: `grid_cells` refuses a merged full-width row, and its
    borders were then left looking like 690pt blanks lying across the table.

    **A vertical crosses it.** Form 70D.5's category rows ("Mortgages:", "Credit
    cards:") run the full width of a seven-column grid, so the column rules pass
    straight through their top and bottom borders.

    **Verticals stand at both of its ends.** Form 70D.5 p3's "Positions on
    Equalization" table has no interior columns at all -- just a box round the
    whole thing -- so nothing crosses its row rules, and all four of them read as
    writing lines. Its real writing rules are the short ones inside the box,
    which touch no vertical at either end.
    """
    for x, top, bottom in vertical:
        if start + 2 < x < end - 2 and top <= key + 2 and bottom >= key - 2:
            return True
    covers = [x for x, top, bottom in vertical
              if top <= key + 2 and bottom >= key - 2]
    return (any(abs(x - start) <= 2.0 for x in covers)
            and any(abs(x - end) <= 2.0 for x in covers))


def _clear_rule_start(chars, key, start, end, size):
    """Move a rule's left edge past type printed on the rule itself.

    Word sets a caption and the space to answer in as one underlined run: Form
    70D.1 p3 underlines "Other (specify):" and carries the same rule on for
    another 300pt as the writing line. The government's `$` is printed on its own
    amount rule the same way (guide 4). Both put printed type inside the rule's
    span, and a box seated on the whole span covers the label it is answering.

    Only the **left half** is searched. Type further right than that is not a
    label this rule belongs to, and trimming to it would throw the blank away.
    """
    limit = start + (end - start) / 2
    edge = start
    for box, _char, _size in chars:
        centre = (box.y0 + box.y1) / 2
        if not key - UNDERLINE_BAND * size <= centre <= key:
            continue
        if box.x1 <= start or box.x0 >= limit:
            continue
        edge = max(edge, box.x1 + EDGE_CLEARANCE)
    return edge


def _is_separator(chars, key, start, end, size):
    """Is this rule a section divider drawn across the page?

    Form 70D.1 p1 rules off the list of orders the court may make before "YOU
    MUST:", full width and in the same 0.8pt black as every writing line, so
    nothing about the object itself says which it is. Two things about its
    *placement* do, and both are needed:

    **It spans the page's whole text measure**, margin to margin. Manitoba's
    blanks are always bounded by something -- a caption to their left, a
    paragraph indent, or a table column. Measured across the batch: this is the
    only rule of 1,528 that runs the full measure of its page.

    **Nothing is printed on its own line.** That is what keeps a genuinely
    full-width answer line -- a caption with the rest of the line to write on --
    from being read as a divider in a later batch.
    """
    printed = [box for box, _char, _size in chars]
    if not printed:
        return False
    left = min(box.x0 for box in printed)
    right = max(box.x1 for box in printed)
    if not (start <= left + 3 and end >= right - 3):
        return False
    return not any(key - UNDERLINE_BAND * size <= (box.y0 + box.y1) / 2 <= key
                   for box in printed)


def printed_rules(page, cells):
    """Writing rules: horizontal rules that are neither a table border nor an underline.

    A rule that bounds a detected cell is that table's border and has already
    produced its own fields, so it is removed here rather than seated twice; a
    rule a vertical crosses is a border whose cells were refused. The match is on
    the rule's line and span, because a table's top border is one segment across
    several columns.
    """
    horizontal, vertical = _segments(page)
    chars = page_chars(page)
    borders = set()
    for rect, _text, _dollar, _caption in cells:
        borders.add(round(rect.y0, 0))
        borders.add(round(rect.y1, 0))

    out = []
    for key, start, end in horizontal:
        if end - start < MIN_BLANK_WIDTH:
            continue
        if any(abs(key - border) <= 2.0 for border in borders):
            continue
        if _is_table_border(vertical, key, start, end):
            continue
        size = _font_at(chars, key, start, end)
        if _is_underline(chars, key, start, end, size):
            continue
        if _is_separator(chars, key, start, end, size):
            continue
        start = _clear_rule_start(chars, key, start, end, size)
        if end - start < MIN_BLANK_WIDTH:
            continue
        out.append((fitz.Rect(start, key - size, end, key), key, size))
    return out


def seat_rules(rules):
    """Turn each printed rule into its box, never overlapping the rule above.

    A blank's box hangs *upward* from its own rule, one line deep, capped by the
    nearest rule above that shares any of its width -- Form 70D p1 sets the
    jurat's three rules on a 25pt pitch and Form 70D p3's income schedule stacks
    its amount rules on an 11.5pt pitch, against a 13pt box, so uncapped boxes
    would render as a crushed stack of borders.
    """
    seated = []
    for rect, key, size in rules:
        bottom = key - RULE_CLEARANCE
        height = size * LINE_RATIO
        above = [other_key for other, other_key, _s in rules
                 if other_key < key - 1
                 and other.x1 > rect.x0 and other.x0 < rect.x1]
        if above:
            height = min(height, key - max(above) - STACK_GAP)
        if height < 6:
            continue
        seated.append(fitz.Rect(rect.x0, bottom - height, rect.x1, bottom))
    return seated


def underscore_blanks(page):
    """Every printed `______` blank on the page, as (rect, rule_y, size).

    Manitoba uses these far less than Saskatchewan -- 12 across the financial
    batch against 1,528 drawn rules -- but Form 70U's "TOTAL: $______" and Form
    70D.5's "File No: FD______" are underscores, so both vocabularies have to be
    read on the same page.
    """
    blanks = []
    for text, boxes, sizes in line_chars(page):
        runs = [m.span() for m in UNDERSCORE_RUN.finditer(text)]
        merged = []
        for start, end in runs:
            if merged and not text[merged[-1][1]:start].strip():
                merged[-1] = (merged[-1][0], end)
                continue
            merged.append((start, end))
        for start, end in merged:
            rect = fitz.Rect(boxes[start])
            for box in boxes[start:end]:
                rect |= box
            if rect.width < MIN_BLANK_WIDTH:
                continue
            size = max(sizes[start:end])
            left, right = rect.x0, rect.x1
            if start > 0 and text[start - 1] not in " \t":
                left += EDGE_CLEARANCE
            if end < len(text) and text[end] not in " \t":
                right -= EDGE_CLEARANCE
            if right - left >= MIN_BLANK_WIDTH:
                rect = fitz.Rect(left, rect.y0, right, rect.y1)
            # The printed rule is the underscore glyph's own ink, which sits
            # above the bottom of its character box -- the same 0.175-of-the-font
            # ratio measured for Saskatchewan, on the same class of Word output.
            blanks.append((rect, rect.y1 - size * 0.175, size))
    return blanks


def checkboxes(page):
    """The printed stroked squares. One square is one control -- never union two."""
    out = []
    for drawing in page.get_drawings():
        if drawing["type"] != "s":
            continue
        for item in drawing["items"]:
            if item[0] != "re":
                continue
            rect = fitz.Rect(item[1])
            if CB_MIN < rect.width < CB_MAX and CB_MIN < rect.height < CB_MAX:
                out.append(rect)
    return out


# --- ruled tables -----------------------------------------------------------

def _line_spans(page):
    """Printed text lines as rects, for spotting a cell that is really a slice."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                out.append(fitz.Rect(line["bbox"]))
    return out


def _is_merged_slice(rect, lines, tolerance=2.0):
    """Does printed text cross this cell's own side borders?

    A real cell's contents stay inside it. Where they do not, the "cell" is a
    slice cut out of a merged region by a rule belonging to some other part of
    the table -- Form 70D.5's category rows ("Real property:", "TFSAs:") span the
    full width of a seven-column grid, so every one of them would otherwise
    arrive as seven cells with the label chopped across them.
    """
    for line in lines:
        if line.y1 <= rect.y0 or line.y0 >= rect.y1:
            continue
        if not (line.x1 > rect.x0 and line.x0 < rect.x1):
            continue
        if line.x0 < rect.x0 - tolerance or line.x1 > rect.x1 + tolerance:
            return True
    return False


def cell_contents(chars, rect):
    """What the government printed inside a cell, read by character centre.

    Not `get_text(clip=...)`: that admits a glyph only when its whole box is
    inside the clip, and an amount cell whose `$` is set flush with the top rule
    then reads as empty and takes a box placed on top of the printed `$` rather
    than after it. A character belongs to the cell its centre falls in, which
    needs no tolerance at all.
    """
    inside = [(box, char) for box, char, _size in chars
              if rect.x0 <= (box.x0 + box.x1) / 2 <= rect.x1
              and rect.y0 <= (box.y0 + box.y1) / 2 <= rect.y1]
    return "".join(char for _box, char in inside).strip(), inside


def caption_tail(rect, inside, text):
    """Where a cell's own printed label ends, if the label invites an entry beside it.

    Guide 9.3 says a cell the government already named is not a field, and on the
    Saskatchewan forms that was the whole story: a named cell is a row label with
    its answer in the next column along. Manitoba puts both in **one** cell --
    Form 70W's contact tables print "Address:", "Date of Birth:", "Social
    Insurance Number:" and expect the answer typed after the colon in the same
    box -- so refusing every named cell left that form with 12 fields for its 34
    printed questions.

    The colon is the signal, and it has to be the whole one: a label that fills
    its cell over several lines is a heading, not a question, and a label with no
    room left after it has nowhere to put the answer.
    """
    if not text.rstrip().endswith(":") or not inside:
        return None
    top = min(box.y0 for box, _char in inside)
    bottom = max(box.y1 for box, _char in inside)
    if bottom - top > CAPTION_MAX_LINE:
        return None  # a multi-line label filling the cell is a heading
    right = max(box.x1 for box, _char in inside)
    if rect.x1 - right < MIN_BLANK_WIDTH + EDGE_CLEARANCE * 2:
        return None
    return right


def grid_cells(page):
    """Ruled table cells, each with whatever the government printed inside it.

    Returns (rect, printed_text, dollar_rect, caption_right).

    The grid is built **per row band**, from the verticals that actually cover
    that band, rather than from one sorted list of every vertical on the page --
    a page often carries two tables with different column layouts, and a single
    global x-grid cuts each table's columns at the other table's rule positions.
    """
    horizontal, vertical = _segments(page)
    lines = _line_spans(page)
    chars = page_chars(page)
    ys = sorted({h[0] for h in horizontal})
    cells = []
    for top, bottom in zip(ys, ys[1:]):
        height = bottom - top
        if height < CELL_MIN_HEIGHT or height > CELL_MAX_HEIGHT:
            continue
        xs = sorted({v[0] for v in vertical if _covered([v], v[0], top, bottom)})
        for left, right in zip(xs, xs[1:]):
            if right - left < CELL_MIN_WIDTH:
                continue
            if not (_covered(horizontal, top, left, right)
                    and _covered(horizontal, bottom, left, right)):
                continue
            rect = fitz.Rect(left, top, right, bottom)
            if _is_merged_slice(rect, lines):
                continue
            text, inside = cell_contents(chars, rect)
            dollar = caption = None
            if text:
                stripped = text.replace("$", "").replace("0", "").strip()
                if "$" in text and not stripped:
                    # Guide 4: an amount cell. The `$` is the government's, and a
                    # printed `0` beside it is a stale default, not wording.
                    dollar = next((box for box, char in inside if char == "$"), None)
                    text = ""
                else:
                    caption = caption_tail(rect, inside, text)
            cells.append((rect, text, dollar, caption))
    return cells


def check_glyph_xs(page):
    """x-centres of every printed check mark on the page."""
    out = []
    for text, boxes, _sizes in line_chars(page):
        for index, char in enumerate(text):
            if char in TICK_GLYPHS:
                out.append((boxes[index].x0 + boxes[index].x1) / 2)
    return out


def classify_columns(page, cells, ignore):
    """Split a page's table columns into printed reference, tick, and fillable data.

    Three signals, in this order, each read off the printed page:

    1. **A printed check glyph over the column makes it a tick column** -- the
       column the form tells you to check, printing no square of its own.
    2. **A column whose non-empty cells differ from each other is printed data**
       (row labels, reference numbers). A column whose non-empty cells are all
       the same string is a repeated header over blank space, which is what a
       data column looks like -- that tolerates a header repeating per block,
       which Form 70D.5's asset tables do on all six pages.
    3. **Narrow columns are read as a group**, because a reference column that
       happens to be blank in one block is indistinguishable from a data column
       on its own evidence.

    `ignore` is the set of row tops that are headings, and it is what makes
    signal 2 usable on these forms. Manitoba stacks **two** header rows over each
    column -- Form 70U prints the column number "1" above the column title "Legal
    description and address of property" -- so every one of its data columns
    carries two distinct printed strings and the whole table read as the
    government's own reference grid, losing all three of its writing panels. A
    heading is not evidence about what the column below it holds.

    Returns {column key: "reference" | "tick" | "data"}.
    """
    columns = collections.defaultdict(list)
    for rect, text, _dollar, _caption in cells:
        columns[(round(rect.x0, 0), round(rect.x1, 0))].append((rect, text))

    ticks = check_glyph_xs(page)
    kinds = {}
    for key, members in columns.items():
        if any(key[0] <= x <= key[1] for x in ticks):
            kinds[key] = "tick"
            continue
        printed = {text for rect, text in members
                   if text and round(rect.y0) not in ignore}
        kinds[key] = "reference" if len(printed) > 1 else "data"

    keys = sorted(columns)

    def neighbour(key, side):
        """The column sharing this one's left or right border."""
        for other in keys:
            if other == key:
                continue
            if side == "left" and abs(other[1] - key[0]) < 2:
                return other
            if side == "right" and abs(other[0] - key[1]) < 2:
                return other
        return None

    for key in keys:
        if kinds[key] != "data" or key[1] - key[0] > NARROW_COLUMN:
            continue
        if any(text for _rect, text in columns[key]):
            continue
        left, right = neighbour(key, "left"), neighbour(key, "right")
        if left is None or right is None:
            continue
        if kinds[left] != "reference" or kinds[right] != "reference":
            continue
        if left[1] - left[0] <= NARROW_COLUMN and right[1] - right[0] > NARROW_COLUMN:
            kinds[key] = "tick"

    changed = True
    while changed:
        changed = False
        for key in keys:
            if kinds[key] != "data" or key[1] - key[0] > NARROW_COLUMN:
                continue
            width = key[1] - key[0]
            for side in ("left", "right"):
                other = neighbour(key, side)
                if other is None or kinds[other] != "reference":
                    continue
                other_width = other[1] - other[0]
                if other_width <= NARROW_COLUMN and abs(width - other_width) <= 3:
                    kinds[key] = "reference"
                    changed = True
                    break
    return kinds


def page_greyscale(page):
    """One render per page, to measure cell shading against."""
    return page.get_pixmap(matrix=fitz.Matrix(SHADE_ZOOM, SHADE_ZOOM))


def is_shaded(pix, page, rect):
    """Is this cell painted as a heading row rather than left white to write in?"""
    probe = rect + (2, 2, -2, -2)
    if probe.is_empty or probe.width < 1 or probe.height < 1:
        return False
    x0 = max(0, int((probe.x0 - page.rect.x0) * SHADE_ZOOM))
    y0 = max(0, int((probe.y0 - page.rect.y0) * SHADE_ZOOM))
    x1 = min(pix.width, int((probe.x1 - page.rect.x0) * SHADE_ZOOM))
    y1 = min(pix.height, int((probe.y1 - page.rect.y0) * SHADE_ZOOM))
    if x1 <= x0 or y1 <= y0:
        return False
    total = count = 0
    for y in range(y0, y1, 2):
        for x in range(x0, x1, 2):
            total += pix.pixel(x, y)[0]
            count += 1
    return count > 0 and total / count < SHADED_BELOW


def total_row_tops(cells):
    """Row tops whose printed label calls the row a total.

    Read per row rather than per cell, because the word is printed in the row's
    label cell and the cells that need the exemption are the empty ones beside it.
    """
    rows = collections.defaultdict(list)
    for rect, text, _dollar, _caption in cells:
        rows[round(rect.y0)].append(text)
    return {top for top, texts in rows.items()
            if TOTAL_ROW.search(" ".join(t for t in texts if t))}


def heading_row_tops(page, cells, total_rows):
    """Row tops that are a bold section title, whose empty cells are frame space.

    Bold is the signal, because these forms set their section titles bold and
    their data rows plain -- but a totals row is bold too, so those are exempted
    first, or Form 70U's "TOTAL:" rows would lose the boxes they need.
    """
    bold = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                # The flag bit, not just the font name. Form 70U is set in
                # Bookman, whose bold face reports as "BookmanITCbyBT-Light,Bol"
                # -- no "bold" anywhere in the string -- so a name test alone
                # found no heading rows on any of its 13 pages, and its column
                # titles were then read as printed data (see `classify_columns`).
                if not span["text"].strip():
                    continue
                if span["flags"] & 16 or "bold" in span["font"].lower():
                    bold.append(fitz.Rect(span["bbox"]))
    rows = collections.defaultdict(list)
    for rect, text, _dollar, _caption in cells:
        rows[round(rect.y0)].append((rect, text))
    out = set()
    for top, members in rows.items():
        if top in total_rows:
            continue
        labelled = [rect for rect, text in members if text]
        if labelled and any(span.intersects(rect) for rect in labelled for span in bold):
            out.add(top)
    return out


# --- writing areas the form draws nothing for -------------------------------

# Guide 6: a caption ending in ":" with an empty band under it is a writing area
# the form expects you to use but drew nothing for. Bands outside this range are
# a line of leading (too small) or the rest of the sheet (too large).
BAND_MIN, BAND_MAX = 22.0, 260.0
BAND_FOOTER = 45.0

# Manitoba's style of cause captions its party lines from **below** and draws no
# rule at all: Form 70D p1 leaves 25pt of paper and prints "(full name)" under
# it. Kept deliberately narrow -- name captions only -- because every other
# parenthesised caption on these forms sits under a rule or a cell that has
# already produced its own field.
# The trailing punctuation is not optional decoration: Form 70U sets its style of
# cause as "(full name)," and "(full name)," with the comma inside the caption
# line, and Form 70D sets it bare. Anchoring to a closing ")" alone missed both of
# Form 70U's party lines -- and that form draws them no rule either, so nothing
# else in this file would have found them.
CAPTION_BELOW = re.compile(r"^\(\s*full name[^)]*\)[,.;]?$|^\(\s*name\s*\)[,.;]?$", re.I)
# The line seated above such a caption, and the gap left between the two.
CAPTION_LINE_HEIGHT = 14.0
# A cell label taller than this is set over more than one line, which makes it a
# heading filling its cell rather than a question answered beside itself.
CAPTION_MAX_LINE = 16.0
CAPTION_GAP = 2.0


def writing_area_bands(page, placed, cells):
    """Answer spaces the form anchors with a caption and then leaves as paper.

    Three guards, each of which a form in this batch makes necessary. A caption
    that already has a field **on its own line** is answered beside itself, not
    below. A caption printed **inside a ruled cell** is answered by its table,
    never by the paper under it -- Form 70D.5 sets "(A) TOTAL ASSETS:" and
    "(A) - (B) = NET:" in the grid's own label column, and without this the gap
    between its two tables collected a 690pt paragraph box under each. And the
    band has to be bounded: the rest of an empty sheet is not an answer space.
    """
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append((fitz.Rect(line["bbox"]), text))
    lines.sort(key=lambda pair: pair[0].y0)
    floor = page.rect.height - BAND_FOOTER
    out = []
    for rect, text in lines:
        if not text.rstrip().endswith(":"):
            continue
        if any(box.y0 < rect.y1 and box.y1 > rect.y0 and box.x0 >= rect.x0
               for box in placed):
            continue
        if any(cell.contains(rect) for cell, _t, _d, _c in cells):
            continue
        below = [other.y0 for other, _t in lines if other.y0 > rect.y1 + 1]
        band = fitz.Rect(rect.x0, rect.y1 + 2, page.rect.width - 72,
                         min(min(below, default=floor), floor))
        # A caption set out in the right margin leaves no room for a band under
        # it; the rectangle then comes back empty or inverted, which reaches
        # `check_geometry` as a non-positive size rather than as no field at all.
        if band.width < MIN_BLANK_WIDTH:
            continue
        if not BAND_MIN <= band.height <= BAND_MAX:
            continue
        if any(band.intersects(box) for box in placed):
            continue
        out.append(band)
    return out


def caption_below_blanks(page, placed):
    """The party lines Manitoba captions from below and draws no rule for.

    Form 70D p1's style of cause is bare paper with "(full name)" centred under
    it, twice. There is no rule, no cell and no underscore, so every other
    detector in this file correctly finds nothing and the petitioner's and
    respondent's names have nowhere to go.

    The box is one line seated directly above the caption, as wide as the caption
    is allowed to be read -- and skipped where anything already covers that
    space, which is what keeps "(Petitioner/Respondent)" under Form 70D p1's
    "FINANCIAL STATEMENT OF ______" from being counted twice.
    """
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not CAPTION_BELOW.match(text):
                continue
            rect = fitz.Rect(line["bbox"])
            # A caption is a label for whatever is above it; give the blank the
            # generous width the style of cause actually uses, centred on the
            # caption, rather than the caption's own 40pt.
            centre = (rect.x0 + rect.x1) / 2
            half = max(rect.width, 200.0) / 2
            band = fitz.Rect(centre - half,
                             rect.y0 - CAPTION_GAP - CAPTION_LINE_HEIGHT,
                             centre + half, rect.y0 - CAPTION_GAP)
            band &= page.rect + (36, 36, -36, -36)
            if band.is_empty or band.width < MIN_BLANK_WIDTH:
                continue
            if any(band.intersects(box) for box in placed):
                continue
            if page.get_text("text", clip=band).strip():
                continue
            out.append(band)
    return out


def _field(doc_id, index, rect, kind, size=9):
    return {
        "id": bp.new_id(doc_id, index),
        "type": kind,
        "x": round(rect.x0, 2),
        "y": round(rect.y0, 2),
        "width": round(rect.width * SCALE, 2),
        "height": round(rect.height * SCALE, 2),
        "value": "",
        "fontSize": size,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": 0,
    }


def page_boxes(page):
    """Every candidate box on one page, as (rect, type), in reading order."""
    marks = checkboxes(page)
    boxes = [(rect, "CheckBox") for rect in marks]

    cells = grid_cells(page)
    pix = page_greyscale(page) if cells else None
    # Heading rows are worked out **before** the columns are classified: a
    # heading is not evidence about the column under it, and Manitoba stacks two
    # of them over every table. See `classify_columns`.
    total_rows = total_row_tops(cells)
    heading_rows = heading_row_tops(page, cells, total_rows)
    kinds = classify_columns(page, cells, heading_rows)
    filled_cells = []
    for rect, text, dollar, caption in cells:
        if text and caption is None:
            continue  # the government already wrote this cell's name (guide 9.3)
        if any(mark.intersects(rect) for mark in marks):
            continue  # a tick's own cell -- the printed checkbox is the field
        kind = kinds[(round(rect.x0, 0), round(rect.x1, 0))]
        if kind == "reference" and caption is None:
            continue  # a blank in the government's own reference grid
        # Shading marks a heading row -- but it also marks totals rows and some
        # amount rows, and neither of those is a heading. A row the form calls a
        # total, and any cell the form prints a `$` in, are places the filer
        # writes a figure: a heading never carries a `$`.
        if dollar is None and round(rect.y0) in heading_rows:
            continue  # frame space beside a bold section title
        if kind == "tick":
            cx, cy = (rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2
            boxes.append((fitz.Rect(cx - TICK_SIDE / 2, cy - TICK_SIDE / 2,
                                    cx + TICK_SIDE / 2, cy + TICK_SIDE / 2), "CheckBox"))
            filled_cells.append(rect)
            continue
        box = rect + (1.5, 1.5, -1.5, -1.5)
        if caption is not None:
            # The cell asks its own question ("Address:") and is answered inside
            # itself, so the field starts where the printed label stops.
            box = fitz.Rect(caption + EDGE_CLEARANCE * 2, box.y0, box.x1, box.y1)
        elif dollar is not None:
            # Guide 4: start after the `$`, and take both the height and the
            # vertical position from the glyph -- anchoring the top to a tall
            # cell instead leaves the printed `$` with nothing beside it.
            height = min(dollar.height * LINE_RATIO, box.height)
            top = min(max(dollar.y0, box.y0), box.y1 - height)
            box = fitz.Rect(dollar.x1 + 1.5, top, box.x1, top + height)
        if box.width < MIN_BLANK_WIDTH or box.height < 6:
            continue
        # The shading probe measures **the space the box will occupy**, not the
        # whole cell. `is_shaded` averages the pixels it is given, so a cell
        # carrying its own printed question averages dark from its own type: on
        # Form 70W, probing the cell read all 30 of "Address:", "Date of Birth:",
        # "Social Insurance Number:" and the rest as shaded heading rows and left
        # the form with 17 fields. The white space after the colon is both the
        # honest thing to measure and the thing that has to be white.
        if (dollar is None and round(rect.y0) not in total_rows
                and is_shaded(pix, page, box)):
            continue  # a shaded heading row (guide 9.2)
        lines = box.height / (SCALE * 6.0)
        boxes.append((box, "TextArea" if lines > TEXTAREA_LINES else "TextField"))
        filled_cells.append(rect)

    # Printed writing rules, which are the bulk of these forms. A rule inside a
    # cell that already got a field is that field seen twice; a rule inside one
    # that did *not* is a real blank, so the test is against the cells actually
    # filled rather than against every cell on the page.
    for box in seat_rules(printed_rules(page, cells)):
        if any(cell.intersects(box) and cell.get_area() > box.get_area()
               for cell in filled_cells):
            continue
        boxes.append((box, "TextField"))

    kept = []
    for rect, rule_y, size in underscore_blanks(page):
        if any(cell.intersects(rect) and cell.get_area() > rect.get_area()
               for cell in filled_cells):
            continue
        kept.append((rect, rule_y, size))
    for rect, rule_y, size in kept:
        bottom = rule_y - RULE_CLEARANCE
        boxes.append((fitz.Rect(rect.x0, bottom - size * LINE_RATIO, rect.x1, bottom),
                      "TextField"))

    placed = [rect for rect, _kind in boxes]
    for band in caption_below_blanks(page, placed):
        boxes.append((band, "TextField"))
    for band in writing_area_bands(page, [rect for rect, _kind in boxes], cells):
        boxes.append((band, "TextArea"))
    return clear_of_type(page, dedupe(boxes))


def dedupe(boxes, tolerance=2.0):
    """Drop a box that repeats one already found by another detector.

    Two vocabularies can describe the same blank -- an underscore run set on top
    of a drawn rule, which Form 70U does in its "TOTAL: $______" cells -- and two
    stacked controls in the viewer read as one control with a doubled border.
    """
    out = []
    for rect, kind in boxes:
        if any(other_kind == kind
               and abs(other.x0 - rect.x0) <= tolerance
               and abs(other.x1 - rect.x1) <= tolerance
               and abs(other.y0 - rect.y0) <= tolerance
               and abs(other.y1 - rect.y1) <= tolerance
               for other, other_kind in out):
            continue
        out.append((rect, kind))
    return out


def clear_of_type(page, boxes):
    """Trim any box whose side edge is flush against printed type.

    The viewer draws a bordered control inside the rectangle we store, so a gap
    that reads as correct in the overlay puts a border through a letter in the
    app. Checkboxes are left alone: they are seated on their printed square, and
    moving an edge to dodge the caption beside them would take them off it.
    """
    glyphs = []
    for text, char_boxes, _sizes in line_chars(page):
        for index, char in enumerate(text):
            if char not in " \t_":
                glyphs.append(char_boxes[index])
    out = []
    for rect, kind in boxes:
        if kind == "CheckBox":
            out.append((rect, kind))
            continue
        left, right = rect.x0, rect.x1
        # Run to a fixed point, not once. Trimming an edge to clear one glyph can
        # bring it up against a glyph that was already passed over: Form 70D p2's
        # third employment line ends 1.5pt short of the "." that closes it, and
        # pulling the edge back to clear that "." landed it 0.54pt from the "m"
        # of the line *above*, which overhangs the box's top corner and had been
        # checked -- and correctly ignored, as an overlap -- earlier in the pass.
        # Each glyph can only fire once, since a trim leaves exactly the
        # clearance the test demands, so this settles rather than oscillates.
        changed = True
        while changed:
            changed = False
            for glyph in glyphs:
                if glyph.y1 < rect.y0 + 2 or glyph.y0 > rect.y1 - 2:
                    continue
                if -0.5 <= left - glyph.x1 < EDGE_CLEARANCE:
                    left = glyph.x1 + EDGE_CLEARANCE
                    changed = True
                if -0.5 <= glyph.x0 - right < EDGE_CLEARANCE:
                    right = glyph.x0 - EDGE_CLEARANCE
                    changed = True
        if right - left >= MIN_BLANK_WIDTH:
            rect = fitz.Rect(left, rect.y0, right, rect.y1)
        out.append((rect, kind))
    return out


def drop_signature_rules(boxes, captions, brackets):
    """Guide 5: never put a typeable box on somebody's signature line.

    Two ways a Manitoba rule is a signature line.

    **A caption under it**, which claims the **nearest** rule above it rather
    than every rule in the window -- the jurat sets a date blank one line above
    "A Commissioner for Oaths in and for the Province of Manitoba", just inside
    the window, so a flat rule deleted the date along with the signature line.

    **A jurat bracket column to its left**, which is the case a caption cannot
    reach: Form 70D p1 sets the deponent's signature rule to the right of the
    jurat's ")" column with no caption anywhere near it.
    """
    doomed = set()
    for index, (rect, kind) in enumerate(boxes):
        if kind == "CheckBox":
            continue
        for x, top, bottom in brackets:
            if rect.x0 > x and rect.y0 < bottom + JURAT_BAND and rect.y1 > top - JURAT_BAND:
                doomed.add(index)
                break
    for caption in captions:
        best, best_gap = None, None
        for index, (rect, kind) in enumerate(boxes):
            if kind == "CheckBox" or index in doomed:
                continue
            if not bp.is_signature_box(rect, "", [caption]):
                continue
            gap = caption.y0 - rect.y1
            if best_gap is None or gap < best_gap:
                best, best_gap = index, gap
        if best is not None:
            doomed.add(best)
    kept = [b for i, b in enumerate(boxes) if i not in doomed]
    dropped = [boxes[i][0] for i in sorted(doomed)]
    return kept, dropped


def tick_rects(page):
    """The tick-column boxes, which have no printed square of their own.

    The verifier re-derives these so it can tell a legitimately square-less tick
    from a checkbox that has drifted off its printed square.
    """
    cells = grid_cells(page)
    if not cells:
        return []
    total_rows = total_row_tops(cells)
    kinds = classify_columns(page, cells, heading_row_tops(page, cells, total_rows))
    out = []
    for rect, text, _dollar, _caption in cells:
        if text or kinds[(round(rect.x0, 0), round(rect.x1, 0))] != "tick":
            continue
        cx, cy = (rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2
        out.append(fitz.Rect(cx - TICK_SIDE / 2, cy - TICK_SIDE / 2,
                             cx + TICK_SIDE / 2, cy + TICK_SIDE / 2))
    return out


def signature_rule_rects(page):
    """The boxes this page deliberately does not get, for the verifier to excuse."""
    return drop_signature_rules(page_boxes(page), signature_captions(page),
                                jurat_brackets(page))[1]


def build(src, promote=False):
    doc_id = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    doc = fitz.open(source)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    fields, skipped = [], 0
    index = 0
    for number, page in enumerate(doc, start=1):
        kept, dropped = drop_signature_rules(
            page_boxes(page), signature_captions(page), jurat_brackets(page))
        skipped += len(dropped)
        for rect, kind in kept:
            index += 1
            field = _field(doc_id, index, rect, kind)
            field["page"] = number
            fields.append(field)
    doc.close()

    bp.clamp_to_page(fields, page_sizes)
    problems = bp.check_geometry(fields, page_sizes)
    overlaps = bp.check_overlap(source, fields)

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    background = os.path.join(OUT, "%s.pdf" % doc_id)
    # The government's file, copied byte for byte -- see the module docstring.
    with open(source, "rb") as fh_in, open(background, "wb") as fh_out:
        fh_out.write(fh_in.read())
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))

    kinds = {}
    for field in fields:
        kinds[field["type"]] = kinds.get(field["type"], 0) + 1
    print("%-13s pages=%-3d fields=%-4d %-42s sig-skipped=%-3d geom=%-2d overlap=%d"
          % (doc_id, len(page_sizes), len(fields), kinds, skipped, len(problems),
             len(overlaps)))
    if problems:
        print("   geometry:", problems[:4])
    if promote and not problems:
        for extension in ("pdf", "json"):
            os.replace(os.path.join(OUT, "%s.%s" % (doc_id, extension)),
                       os.path.join(EXPORT, "%s.%s" % (doc_id, extension)))
    return {"docId": doc_id, "pages": len(page_sizes), "fields": len(fields),
            "kinds": kinds, "signatureSkipped": skipped,
            "geometry": problems, "overlap": overlaps}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=None)
    parser.add_argument("--category", default=None)
    parser.add_argument("--all", action="store_true",
                        help="include categories not yet shipped")
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()

    sources = all_sources() if args.all else shipped_sources()
    if args.only:
        sources = [s for s in all_sources() if s["docId"] in set(args.only)]
    if args.category:
        sources = [s for s in sources if s["shortCategory"] == args.category]

    report = [build(src, args.promote) for src in sources]
    total = sum(r["fields"] for r in report)
    bad = [r["docId"] for r in report if r["geometry"]]
    print("\n%d forms, %d fields, %d with geometry problems: %s"
          % (len(report), total, len(bad), ", ".join(bad) or "none"))
    with open(os.path.join(STAGE, "build_report.json"), "w") as fh:
        json.dump(report, fh, indent=1)


if __name__ == "__main__":
    main()

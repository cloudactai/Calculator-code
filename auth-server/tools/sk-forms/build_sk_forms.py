"""Build the Saskatchewan King's Bench family templates from the King's Printer PDFs.

The Saskatchewan sources are the easiest of the three provinces to read and the
hardest to guess at. They carry **no widgets and no XFA** -- the King's Printer
publishes Word-derived PDFs with a real text layer -- so there is no government
rectangle to copy the way BC Provincial's AcroForm or the flattened XFA DOM gave
one. Everything here is therefore read off printed anchors, in the three
vocabularies the whole 40-form set turns out to use and no others:

* **A run of underscores** is a blank to write on (1,590 across the set). The
  printed rule is the underscore's own ink, measured, not assumed.
* **A 9x9 stroked rectangle** is a checkbox (457 across the set, every one of
  them exactly 9x9 -- there is no second size and no glyph variant).
* **A ruled grid** is a table, and an empty cell in it is a field. A cell the
  government already filled with a row label is not (guide 9.3); a cell holding
  only a `$` is an amount field that starts after the `$` (guide 4).

**The background PDF ships byte-identical to the government's own file.** BC and
Ontario had to rewrite theirs -- strip a widget layer, flatten XFA, redact dotted
leaders that had captions inside them. Saskatchewan needs none of that: the
underscore runs already print as the writing line, so the most defensible
background is the one the King's Printer published. That also removes every
defect class in guide 6b (repairing a background we damaged), and it means a
re-fetch can be diffed against what we ship.

Run:
    python3 build_sk_forms.py                    # all 40, dry run
    python3 build_sk_forms.py --only SKKB_15_47  # one form
    python3 build_sk_forms.py --promote          # copy into form-template-export/
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
from sk_sources import all_sources, shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_sk")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

SCALE = bp.SCALE

# --- measured constants -----------------------------------------------------
# The printed rule is the underscore glyph's ink, which sits above the bottom of
# its character box. Measured on Form 15-47 p1 at 10pt: char box 139.40-154.48,
# ink 152.23-152.73, so the rule is 1.75pt up from the box bottom -- 0.175 of the
# font size. Expressed as a ratio so a form set in another size still lands right.
RULE_INSET_RATIO = 0.175
# A box sits just clear of its own rule rather than on it (guide 9.1).
RULE_CLEARANCE = 1.3
# ...and is then nudged back down onto it, for the child-protection and adoption
# forms only. RULE_CLEARANCE is derived from RULE_INSET_RATIO, which is where the
# underscore's ink sits inside its character box -- 0.175 of the font size,
# measured on Part 15's font. That leaves the stored rectangle's bottom edge
# floating above the printed rule, and the viewer draws its own bordered control
# inside the rectangle, so the float reads on screen as a control hovering above
# the line it belongs to with the rule showing as a second line beneath.
#
# **The two families need different amounts, because they are set in different
# fonts.** The child-protection forms are the King's Printer's own form PDFs; the
# adoption forms are cut out of the consolidation, whose font seats the underscore
# lower in its character box, so the one ratio under-shoots it. Measured over
# every text box in each family -- 317 and 388 of them -- the ink top sits 0.75pt
# below the box bottom on the child-protection forms and 0.69pt on the adoption
# forms, but the adoption rule is reached from further away: after a 1.0pt nudge
# the child-protection boxes land 0.21-0.29pt into their ink while the adoption
# boxes were still 0.64pt clear of theirs.
#
# Each value lands the edge mid-ink for its own family. Rendered at 26x against
# every candidate from 0.75 to 2.0: too little and the rule still shows beneath
# the border, too much and it reappears *inside* the box above the border, which
# is worse than the float it was meant to fix. The usable window is about half a
# point wide either side of these.
#
# Part 15 has the same float and is deliberately left alone: those 40 templates
# are reviewed and shipped, and this is a seating preference, not a defect.
RULE_NUDGE = {"SKCFS_": 1.0, "SKAD_": 1.95}
# A blank is one line of writing; the height follows the font it was set in.
LINE_RATIO = 1.3
# Shorter than this is a stray, not a blank anyone can type in. Applies to a
# ruled cell and to a drawn writing box.
MIN_BLANK_WIDTH = 16.0
# A printed underscore run gets a lower floor than a cell does. Part 15 alone
# supported 16pt for both, but the adoption consolidation sets its date slots
# tighter: the three Orders of Adoption print "The_ __ day of______, 20_ _" with
# a 15.2pt day slot and a 10.9pt year slot, so the order's own date was
# unfillable. Those, plus Form K's 13.9pt commission-expiry year, are the *only*
# underscore runs in the whole 76-form set between 8 and 16pt, and every one is a
# real day or year box. The floor is 9, not 10, because of what edge clearance
# leaves: the year slot prints as "20_ _" flush against its own "0", so the
# 10.9pt run becomes a 9.4pt box once it is moved off the type, and a 10pt floor
# threw that trim away and shipped the box sitting on the digit.
#
# Kept separate from MIN_BLANK_WIDTH rather than lowering that, because the same
# constant also floors the *cell* detector: dropping it to 10 admitted thirteen
# narrow table cells on Form 15-47, which would have moved a template that has
# already been reviewed and shipped.
MIN_RUN_WIDTH = 9.0
# Room left between a blank and a letter printed hard against it, and between a
# box and the rule of the blank above. Both exist because the viewer draws a
# bordered control inside the rectangle we store.
EDGE_CLEARANCE = 1.5
STACK_GAP = 1.0
# A checkbox on these forms is always a 9x9 stroked square.
CB_MIN, CB_MAX = 4.0, 20.0
# Table geometry. The width floor is deliberately below a tick column's 17.8pt:
# the checklist's narrow columns have to be *seen* so they can be classified,
# rather than silently dropped for being narrow (which is what hid Form 15-47's
# tick column and left its schedule column looking like the only fillable one).
# The height floor is a measurement, not a round number: across all 40 forms the
# empty-cell heights are 10 (x2), then 14 and up. The two 10pt cells are the
# sliver of frame Form 15-49 p3 encloses beside its "BANK ACCOUNTS" section
# title, and a 7.5pt box is not one anybody could type in.
CELL_MIN_WIDTH, CELL_MIN_HEIGHT, CELL_MAX_HEIGHT = 8.0, 12.0, 200.0
# A tick column is a column the form heads with a printed check glyph.
# Saskatchewan sets that glyph in Wingdings, so it arrives as U+F0FC in the
# private use area -- matching only the Unicode check marks finds nothing.
TICK_GLYPHS = set("\u2713\u2714\u221a\uf0fc")
# An option box the form types rather than draws. U+F07E is WP-MathA's open
# square and is the only one in the set; the Unicode ballot boxes are listed with
# it so a form that ever uses one is not silently missed. See glyph_checkboxes().
BOX_GLYPHS = set("\uf07e\u2610\u25a1\u274f\u2751\u2752")
# Zoom for measuring one glyph's ink, and the grey it has to beat to count as ink.
GLYPH_ZOOM = 8.0
GLYPH_INK_BELOW = 200
# How far past a printed `$` a drawn rule may start and still be that `$`'s
# amount line. Form K's five totals set the rule 4.0-4.6pt after the glyph; the
# ceiling is kept tight so a table border further along the row cannot claim it.
DOLLAR_RULE_GAP = 12.0
# Columns narrower than this are grid furniture (row numbers, schedule
# numbers) and are classified as a group rather than one at a time.
NARROW_COLUMN = 40.0
# The form's own checkbox metric, used to size a tick a column asks for but does
# not print a square for. Every one of the 457 printed squares in the set is 9x9.
TICK_SIDE = 9.0
GRID_TOL = 1.5          # two rules this close are the same rule
GRID_COVER = 0.80       # a border must run this much of the cell's edge
# A cell taller than this many lines is a paragraph box, not a one-line cell.
TEXTAREA_LINES = 1.75
# Saskatchewan shades a table's section-heading rows ("Source deductions",
# "Housing") and leaves its data rows white. Measured on Form 15-47 p11: every
# data cell reads 255, every heading cell 219 or 230, with nothing between -- so
# the cut is wide. The shading is not a per-row drawing (it is painted as a few
# large bands), which is why it is measured off a render rather than read out of
# get_drawings(); guide 6c does the same for rasterised pages.
SHADED_BELOW = 248
SHADE_ZOOM = 2.0

UNDERSCORE_RUN = re.compile(r"_+")
# Saskatchewan shades its section-heading rows *and* its totals rows the same
# grey, but only one of the two is a heading. A row the form calls a total is a
# figure the filer works out and writes in, so shading must not take its boxes:
# Form 15-47's SUBTOTAL rows on pages 13 and 17 lost all six.
TOTAL_ROW = re.compile(r"\b(sub)?total\b", re.I)

# Saskatchewan parenthesises its signature captions -- "(signature of party)",
# "(signature )" -- so bc_pipeline's `^signature` anchor never fires. The
# commissioner's rule is captioned by his title instead of by the word
# "signature", and it is anchored to the line start so the *instruction* that
# mentions commissioners for oaths in passing ("...the Registrar's Office in the
# Court House are commissioners for oaths") does not read as a caption.
SK_SIG_CAPTION = re.compile(r"^\s*\(?\s*(your\s+)?signature\b", re.I)
SK_COMMISSIONER = re.compile(r"^\s*a\s+commissioner\s+for\s+oaths\b", re.I)
SK_SIG_EXCLUDE = re.compile(r"date of signature", re.I)
# A court officer's rule is captioned by the office, not by the word "signature":
# the petition, the judgment, the certificate of divorce and three more all close
# with a rule captioned "Local Registrar". Matched as a whole line so the
# instruction that mentions the office in passing ("the staff members at the Local
# Registrar's Office in the Court House are commissioners for oaths") is not read
# as a caption -- that sentence is what an unanchored match would catch.
SK_ROLE_CAPTION = re.compile(
    r"^\s*\(?\s*(deputy\s+)?(local\s+)?(registrar|judge|justice|clerk)\s*\)?\s*$", re.I)

# The child-protection and adoption forms sign off by naming the signatory, and
# they name more offices than Part 15 does and at more length: "Officer",
# "Director", "Clerk of the Court/Local Registrar", "Minister of Community
# Resources and Employment", "(witness)", "(parent)". None matches
# SK_ROLE_CAPTION, which is a *bare* office and nothing else, so all of these
# signature rules were being filled -- Form P alone closes with four of them.
#
# Matching the vocabulary alone is not enough, because two of these words also
# caption an ordinary name blank: Form F heads "To:_______" with "(parent)"
# under it, and that is somewhere the filer writes. What separates them is the
# rule, not the caption -- a signature rule is *bare*, alone on its line, while a
# name blank is preceded on its own line by the words that ask for it ("To:",
# "I,"). So a caption in this vocabulary only condemns a rule that has nothing
# else printed on its line. That also keeps it off "(Name and birth date of
# child)", which sits below a bare rule on Form A but is not a role at all.
SK_OFFICE_CAPTION = re.compile(
    r"^\s*\(?\s*(?:officer|director|witness"
    r"|parents?(?:\s+or\s+person)?"
    r"|minister\b.*|clerk\b.*|(?:deputy\s+|local\s+)*registrar\b.*)\s*\)?\s*$", re.I)
# Not in that list, deliberately: "applicant" and "guardian". An applicant who
# signs is captioned "(Signature of applicant)", which SK_SIG_CAPTION already
# catches, so the word earns nothing here -- and it costs: adoption Form H heads
# a block of four addressees "TO:____ (applicant) / ____ (applicant) / ____
# (director for __ region) / ____ (agency, if applicable)", where the second
# addressee is a bare rule captioned "(applicant)" and is somewhere the filer
# writes. Including the word deleted it. "guardian" matches nothing in the set at
# all.
# How far below a rule its caption may sit, and still be its caption.
CAPTION_GAP = 24.0

# The government left these two answer lines as bare whitespace: there is no
# underscore, cell, or rectangle for the general detectors to measure.  Their
# bounds follow the (a)/(b) baselines and the neighbouring full-width answers.
MANUAL_FIELDS = {
    "SKKB_15_8A": [
        (1, fitz.Rect(151.0, 481.17, 516.0, 494.17), "TextField"),
        (1, fitz.Rect(151.0, 499.17, 516.0, 512.17), "TextField"),
    ],
    "SKKB_15_78": [
        (2, fitz.Rect(202.0, 379.03, 516.0, 392.03), "TextField"),
        (2, fitz.Rect(230.0, 394.03, 516.0, 407.03), "TextField"),
        # Item 8 requests particulars but leaves the rest of the page as bare
        # writing space: no underscores, grid, or standalone rectangle exists.
        (2, fitz.Rect(138.0, 559.0, 516.0, 747.0), "TextArea"),
        # "Known gap" (README): item 26 "My occupation is:" ends in a caption and
        # a tab, no rule -- unlike its twin two items down ("The
        # respondent's/petitioner's occupation is: ______"), which does. Built
        # against that twin's own geometry: field starts EDGE_CLEARANCE past
        # "is:" (measured 197.85), runs to the page's answer margin (516.0, the
        # same right edge item 27's field and every full-width answer on this
        # page use), and sits at the same offset above its own caption's line
        # top that item 27's field sits above its (0.97pt, height 13).
        (6, fitz.Rect(199.35, 107.23, 516.0, 120.23), "TextField"),
    ],
    "SKKB_15_61": [
        # Neither "Telephone Number:" caption on p3 has a field -- same shape as
        # 15-78's occupation gap: a caption and a tab, no rule, cell or
        # underscore for the general detectors to measure. Both sit at x=285 (the
        # same left margin as the signature rule above them) with the caption's
        # own text ending at x=376.49; the field starts EDGE_CLEARANCE past that
        # and runs to the form's own right answer margin (516.0, matching the
        # "DATED at" line above each). Petitioner's block, then respondent's.
        (3, fitz.Rect(377.99, 184.23, 516.0, 197.23), "TextField"),
        (3, fitz.Rect(377.99, 332.23, 516.0, 345.23), "TextField"),
    ],
}


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


def signature_captions(page):
    """Rects of the captions that mark a rule as somebody's signature line."""
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            lines.append((fitz.Rect(line["bbox"]),
                          "".join(span["text"] for span in line["spans"])))
    lines.sort(key=lambda pair: pair[0].y0)

    out = []
    for rect, text in lines:
        if SK_SIG_EXCLUDE.search(text):
            continue
        if (SK_SIG_CAPTION.search(text) or SK_COMMISSIONER.search(text)
                or SK_ROLE_CAPTION.match(text)):
            out.append(rect)
        elif SK_OFFICE_CAPTION.match(text) and _over_a_bare_rule(rect, lines):
            out.append(rect)
    return out


def _is_bare_rule(text):
    """A line that prints a rule and nothing else -- no words asking for a name."""
    return "_" in text and not any(ch.isalnum() for ch in text)


def _over_a_bare_rule(caption, lines):
    """Is the line this caption sits under a bare rule? See SK_OFFICE_CAPTION."""
    # Compared by the top of each line, not its bottom: a rule's line box hangs
    # below the caption's own top -- Form A sets the rule at y 428.6-443.7 and
    # "Officer" at 441.3, a 2.4pt overlap -- so a "strictly above" test on the
    # bottom edge finds no rule at all and every one of these was kept.
    above = [(rect, text) for rect, text in lines
             if rect.y0 < caption.y0 - 2 and caption.y0 - rect.y0 < CAPTION_GAP
             and rect.x1 > caption.x0 and rect.x0 < caption.x1]
    if not above:
        return False
    nearest = max(above, key=lambda pair: pair[0].y0)
    return _is_bare_rule(nearest[1])


def _span_width(boxes, start, end):
    """Printed width of one run of characters."""
    rect = fitz.Rect(boxes[start])
    for box in boxes[start:end]:
        rect |= box
    return rect.width


def underscore_blanks(page):
    """Every printed `______` blank on the page, as (rect, rule_y).

    Two runs separated by nothing but whitespace can be one blank: the forms set
    a blank as `_ ______________` (a lone underscore, a space, then the run)
    often enough that treating the pair as two fields would put a 3pt box in
    front of every one of them. Two runs separated by a *word* always stay
    separate -- the "of" in `______ of ______` is a real caption between two real
    blanks.

    But whitespace alone does not make two runs one blank, and reading the pages
    is what shows it: Saskatchewan sets a date of birth as three tab-separated
    rules captioned `(month) (day) (year)` underneath, and adoption Form L prints
    two of those. Merging on whitespace gave each a single 315pt box spanning all
    three, so a filer typing a date got one field where the form asks for three.
    The same shape is on the birth line of adoption Forms C-1 through C-6.

    So the merge is only for a **fragment** -- a run too narrow to be a blank on
    its own, which is exactly the case the rule was written for. If both runs
    could stand as their own blank, they are two blanks and stay two. That also
    keeps the year of `20_ _` attached to its own day slot, since both of those
    pieces are fragments.
    """
    blanks = []
    for text, boxes, sizes in line_chars(page):
        runs = [m.span() for m in UNDERSCORE_RUN.finditer(text)]
        merged = []
        for start, end in runs:
            if (merged and not text[merged[-1][1]:start].strip()
                    and min(_span_width(boxes, *merged[-1]),
                            _span_width(boxes, start, end)) < MIN_RUN_WIDTH):
                merged[-1] = (merged[-1][0], end)
                continue
            merged.append((start, end))
        for start, end in merged:
            rect = fitz.Rect(boxes[start])
            for box in boxes[start:end]:
                rect |= box
            if rect.width < MIN_RUN_WIDTH:
                continue
            size = max(sizes[start:end])
            # A blank set hard against a printed letter must not start *on* it.
            # The geometry is flush -- Form 15-47 p6 begins the run at exactly the
            # x where the "y" of "approximately" ends -- and the overlay rectangle
            # is therefore correct, but the viewer draws a bordered control inside
            # that rectangle and the border lands on the letter. Guide 2 records
            # the same one-sided bleed for checkbox marks. Give it a hair of room
            # at whichever end actually touches type.
            left, right = rect.x0, rect.x1
            if start > 0 and text[start - 1] not in " \t":
                left += EDGE_CLEARANCE
            if end < len(text) and text[end] not in " \t":
                right -= EDGE_CLEARANCE
            if right - left >= MIN_RUN_WIDTH:
                rect = fitz.Rect(left, rect.y0, right, rect.y1)
            blanks.append((rect, rect.y1 - size * RULE_INSET_RATIO, size))
    return blanks


def dollar_rule_blanks(page):
    """Amount blanks whose rule is *drawn* rather than typed as underscores.

    Adoption Form K sets its itemised rows as `$_______________` -- an underscore
    run, which `underscore_blanks` reads -- but sets its five totals (Total
    Income, Net Income, Total Expenses, Total Assets, Total Debts) as a `$`
    followed by a stroked horizontal line. Same anchor to the reader, different
    vocabulary to the detector, so all five totals of a financial statement
    shipped with the rule printed and nothing to type on.

    Deliberately narrow. The set is full of drawn horizontal rules -- every table
    border on every Part 15 form is one -- so this fires only on a rule whose left
    end sits just past a `$` printed on the same line, which is the government's
    own marker for "write a figure here". Grid borders never carry a `$`, and a
    rule that some other box already covers is left alone. Returned in the shape
    `underscore_blanks` uses, so the seating, the stacking pitch and the
    one-line-TextField rule are shared rather than reimplemented.
    """
    dollars = []
    for text, boxes, sizes in line_chars(page):
        for index, char in enumerate(text):
            if char == "$":
                dollars.append((fitz.Rect(boxes[index]), sizes[index]))
    if not dollars:
        return []

    blanks = []
    for drawing in page.get_drawings():
        if drawing["type"] != "s":
            continue
        rect = drawing["rect"]
        if rect.height > 2 or rect.width < MIN_BLANK_WIDTH:
            continue
        for glyph, size in dollars:
            # On the same line as the `$`, and starting just after it.
            if not (glyph.y0 - size < rect.y0 < glyph.y1 + size):
                continue
            if not (0 <= rect.x0 - glyph.x1 < DOLLAR_RULE_GAP):
                continue
            blanks.append((fitz.Rect(rect.x0 + EDGE_CLEARANCE, rect.y0 - size,
                                     rect.x1, rect.y0),
                           rect.y0, size))
            break
    return blanks


def seat_blanks(blanks, obstacles=()):
    """Turn each blank into its box, never overlapping the blank above it.

    A blank's box hangs *upward* from its own rule, one line deep. Where the form
    stacks blanks tighter than a line -- Form 15-47 p9 sets the five "Gross $____"
    rows on a 12pt pitch, against a 13pt box -- consecutive boxes overlap by a
    couple of points and the viewer renders them as a crushed stack of borders.
    The pitch is readable: it is the distance to the rule of the nearest blank
    above that shares any of this one's width.

    `obstacles` are the page's option boxes. A blank clears those too, because a
    checkbox is not a blank and so is invisible to the pitch rule above: child-
    protection Forms H and O set an option ("NOTICE OF ADJOURNMENT", "prepaid
    certified mail") directly over the `Re:____` line beneath it, and the blank's
    box rose 0.7pt into the checkbox. Only a real collision moves anything -- the
    box is seated first and pushed down only if it actually lands on one -- so a
    checkbox merely sitting somewhere above a blank changes nothing.
    """
    seated = []
    for rect, rule_y, size in blanks:
        bottom = rule_y - RULE_CLEARANCE
        height = size * LINE_RATIO
        above = [other_rule for other, other_rule, _s in blanks
                 if other_rule < rule_y - 1
                 and other.x1 > rect.x0 and other.x0 < rect.x1]
        if above:
            height = min(height, rule_y - max(above) - STACK_GAP)
        if height < 6:
            continue
        box = fitz.Rect(rect.x0, bottom - height, rect.x1, bottom)
        for mark in obstacles:
            if mark.x1 > box.x0 and mark.x0 < box.x1 and box.y0 < mark.y1 <= bottom:
                box = fitz.Rect(box.x0, mark.y1 + STACK_GAP, box.x1, bottom)
        if box.height < 6:
            continue
        seated.append(box)
    return seated


def glyph_checkboxes(page):
    """Option boxes the form *types* instead of drawing.

    Part 15 and the child-protection forms draw every option as a 9x9 stroked
    square, which `checkboxes()` reads off `get_drawings()`. The Adoption
    Regulations consolidation draws none: it sets its options as the glyph U+F07E
    in WP-MathA (WordPerfect's Math A), on pages where `get_drawings()` returns
    nothing whatsoever. The square detector therefore found no option on any of
    the 20 adoption forms, and Form C-1's "birth mother / birth father /
    guardian" shipped with nothing to tick -- the same private-use trick the
    Wingdings check glyph plays in `TICK_GLYPHS`.

    The glyph's *character* box is not the box: set at 20pt it measures
    14.94 x 23.34, while the square printed inside it is 13.5 x 13.4 and sits low
    in the character cell. Seating a control on the character box would put one
    half again too tall straddling the line above. So the ink is measured off a
    render, the way cell shading already is, rather than derived from the font
    size -- a form set at another size then still lands right.
    """
    out = []
    for text, boxes, _sizes in line_chars(page):
        for index, box in enumerate(boxes):
            if text[index] not in BOX_GLYPHS:
                continue
            ink = _glyph_ink(page, box)
            if ink is None:
                continue
            if CB_MIN < ink.width < CB_MAX and CB_MIN < ink.height < CB_MAX:
                out.append(ink)
    return out


def _glyph_ink(page, box):
    """The drawn extent of one glyph inside its character box, or None if blank."""
    pix = page.get_pixmap(clip=box, matrix=fitz.Matrix(GLYPH_ZOOM, GLYPH_ZOOM),
                          colorspace=fitz.csGRAY)
    xs, ys = [], []
    for y in range(pix.height):
        for x in range(pix.width):
            if pix.pixel(x, y)[0] < GLYPH_INK_BELOW:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return fitz.Rect(box.x0 + min(xs) / GLYPH_ZOOM,
                     box.y0 + min(ys) / GLYPH_ZOOM,
                     box.x0 + (max(xs) + 1) / GLYPH_ZOOM,
                     box.y0 + (max(ys) + 1) / GLYPH_ZOOM)


def checkboxes(page):
    """The printed 9x9 squares. One square is one control -- never union two."""
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


# A table border drawn as a filled rectangle is a border up to this thickness.
# Measured on the practice-directive sources: every one is 0.48pt, and the next
# thicker filled rect on those pages is the title's 1.2pt underline, so the cut
# has room in it. Same constant Manitoba calls RULE_MAX_THICK, for the same
# primitive.
FILL_RULE_MAX_THICK = 1.0


def _segments(page):
    """Horizontal and vertical rules as [key, from, to] lists.

    **A rule is a rule whether Word strokes it or fills it.** Part 15 and the two
    regulation families draw their grids as stroked lines, so this only ever
    needed the `"s"` path. The practice directives are a different Word export
    and draw every table border as a *filled rectangle* a half-point thick --
    128 of them on Directive 4's Form A, and not one stroked line -- so
    `grid_cells` returned nothing and the two child tables on the most important
    form in that family had no fields at all. This is exactly the primitive
    `tools/mb-forms` was written around; the difference is that here it is a
    border rather than a writing line.
    """
    horizontal, vertical = [], []
    for drawing in page.get_drawings():
        kind = drawing["type"]
        if kind == "s":
            for item in drawing["items"]:
                if item[0] != "l":
                    continue
                a, b = item[1], item[2]
                if abs(a.y - b.y) < 0.6 and abs(a.x - b.x) > 1:
                    horizontal.append([round((a.y + b.y) / 2, 1),
                                       min(a.x, b.x), max(a.x, b.x)])
                elif abs(a.x - b.x) < 0.6 and abs(a.y - b.y) > 1:
                    vertical.append([round((a.x + b.x) / 2, 1),
                                     min(a.y, b.y), max(a.y, b.y)])
        elif kind == "f":
            for item in drawing["items"]:
                if item[0] != "re":
                    continue
                rect = fitz.Rect(item[1])
                if rect.height <= FILL_RULE_MAX_THICK and rect.width > 1:
                    horizontal.append([round((rect.y0 + rect.y1) / 2, 1),
                                       rect.x0, rect.x1])
                elif rect.width <= FILL_RULE_MAX_THICK and rect.height > 1:
                    vertical.append([round((rect.x0 + rect.x1) / 2, 1),
                                     rect.y0, rect.y1])
    return _merge_segments(horizontal), _merge_segments(vertical)


def _merge_segments(segments, tol=GRID_TOL):
    """Join collinear rules drawn as several touching pieces."""
    out = []
    for key, start, end in sorted(segments):
        if out and abs(out[-1][0] - key) <= tol and start <= out[-1][2] + 2:
            out[-1] = [out[-1][0], min(out[-1][1], start), max(out[-1][2], end)]
            continue
        out.append([key, start, end])
    return out


def _covered(segments, key, start, end, tol=2.0, fraction=GRID_COVER):
    need = (end - start) * fraction
    for other_key, a, b in segments:
        if abs(other_key - key) <= tol and min(end, b) - max(start, a) >= need:
            return True
    return False


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
    slice cut out of a merged region by a rule belonging to some *other* table --
    Form 15-49 p3 runs three verticals down the full height of the page, straight
    through the instructions paragraph between its two tables, so the paragraph
    gets chopped into column-shaped pieces. Those pieces are not cells, and left
    in they make every column they touch look like printed reference data.
    """
    for line in lines:
        if line.y1 <= rect.y0 or line.y0 >= rect.y1:
            continue
        if not (line.x1 > rect.x0 and line.x0 < rect.x1):
            continue
        if line.x0 < rect.x0 - tolerance or line.x1 > rect.x1 + tolerance:
            return True
    return False


def page_chars(page):
    """Every printed character on the page as (rect, char), read once."""
    out = []
    for text, boxes, _sizes in line_chars(page):
        for index, char in enumerate(text):
            out.append((boxes[index], char))
    return out


def cell_contents(chars, rect):
    """What the government printed inside a cell, read by character centre.

    Not `get_text(clip=...)`: that admits a glyph only when its box is inside the
    clip, and the amount cells on Form 15-47 p20 set their `$` flush with the top
    rule, so a 1pt inset dropped it. The cell then read as empty and its box was
    placed at the cell's left edge -- on top of the printed `$` rather than after
    it, on 39 amount slots across the financial forms. A character belongs to the
    cell its centre falls in, which needs no tolerance at all.
    """
    inside = [(box, char) for box, char in chars
              if rect.x0 <= (box.x0 + box.x1) / 2 <= rect.x1
              and rect.y0 <= (box.y0 + box.y1) / 2 <= rect.y1]
    return "".join(char for _box, char in inside).strip(), inside


def grid_cells(page):
    """Ruled table cells, each with whatever the government printed inside it.

    Returns (rect, printed_text, dollar_rect).

    The grid is built **per row band**, from the verticals that actually cover
    that band, rather than from one sorted list of every vertical on the page.
    A page often carries two tables with different column layouts (Form 15-49 p3
    has a 6-column table above a 7-column one), and a single global x-grid cuts
    each table's columns at the *other* table's rule positions -- which left the
    property statement's Category and Institution columns with no cells at all,
    because neither half of the split had a border on both sides.
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
        # Only the verticals that run the whole depth of this band can bound a
        # cell in it; the rest belong to a different table on the same page.
        xs = sorted({v[0] for v in vertical
                     if _covered([v], v[0], top, bottom)})
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
            dollar = None
            if text:
                stripped = text.replace("$", "").replace("0", "").strip()
                if "$" in text and not stripped:
                    # Guide 4: an amount cell. The `$` is the government's, and a
                    # printed `0` beside it is a stale default, not wording.
                    dollar = next((box for box, char in inside if char == "$"), None)
                    text = ""
            cells.append((rect, text, dollar))
    return cells


def check_glyph_xs(page):
    """x-centres of every printed check mark on the page."""
    out = []
    for text, boxes, _sizes in line_chars(page):
        for index, char in enumerate(text):
            if char in TICK_GLYPHS:
                out.append((boxes[index].x0 + boxes[index].x1) / 2)
    return out


def classify_columns(page, cells, heading_rows=()):
    """Split a page's table columns into printed reference, tick, and fillable data.

    Saskatchewan's checklists are the reason this exists. Form 15-47 pages 3-5
    print a grid of "Schedules you must attach": rows describe your situation,
    columns 1-7 are schedule numbers, and a dot marks which schedule each row
    needs. Every one of those cells is *printed guidance*, but most are empty, so
    an emptiness test alone puts a text box in the middle of the government's own
    reference table -- which is what the first build did to column 7, the only
    column with no dot in the top block.

    Three signals, in this order, each read off the printed page:

    1. **A printed check glyph over the column makes it a tick column.** That is
       the column the form tells you to check, and it prints no square of its own.
       The glyph is looked up on the page rather than in the column's header
       *cell*, because the header of a merged heading row is often not a cell the
       grid detector can see.
    2. **A column whose non-empty cells differ from each other is printed data**
       -- row labels, or the schedule dots. A column whose non-empty cells are all
       the same string is a repeated header over blank space, which is what a data
       column looks like; that tolerates the header row repeating per block, which
       these tables do.
    3. **Narrow columns are read as a group.** Schedule column 6 carries no dot at
       all in the first block of page 3, so on its own evidence it is
       indistinguishable from a data column. It is not one: it sits in a run of
       seven equally narrow sibling columns, five of which are visibly reference.
       A narrow data column touching a narrow reference column of the same width
       is part of that grid. A tick column is never reclassified this way -- its
       neighbour is the row-number column, which is equally narrow and reference.

    Returns ({(table, x0, x1): "reference" | "tick" | "data"}, {row top: table}).
    The table map is returned rather than recomputed by the caller so the two
    always agree about where one table ends and the next begins.
    """
    columns = collections.defaultdict(list)
    for rect, text, _dollar in cells:
        # **A column belongs to a table, not to a page.** Signal 2 reads a
        # column whose non-empty cells differ as the government's own reference
        # data. A page carrying two tables one above the other hands every
        # column exactly that -- Directive 4's Form A stacks a "Child's Name /
        # Date of Birth / Mother / Father" table over a "Dates / Child's Name /
        # Legal Status / Time Out of Parental Care" one at the same four column
        # positions, so each column held two different headers and all sixteen
        # writing cells were read as printed guidance.
        #
        # Keying by table fixes it without touching what Form 15-47 relies on.
        # Excluding heading rows from the evidence, which is how Manitoba solves
        # its own version of this, does not: the checklist's schedule columns
        # carry nothing *but* headers and dots, and dropping the headers left
        # column 7 with no evidence and its narrow-column neighbours with none
        # either, which put twelve boxes into the middle of the government's
        # reference grid on page 4.
        columns[(round(rect.x0, 0), round(rect.x1, 0))].append(
            (rect, text, round(rect.y0) in heading_rows))

    ticks = check_glyph_xs(page)
    kinds = {}
    for key, members in columns.items():
        if any(key[0] <= x <= key[1] for x in ticks):
            kinds[key] = "tick"
            continue
        headings = {text for _rect, text, heading in members if text and heading}
        if len(headings) > 1:
            # **Two different headings in one column is two stacked tables**,
            # not the government's own reference data. Directive 4's Form A puts
            # a "Child's Name / Date of Birth / Mother / Father" table directly
            # above a "Dates / Child's Name / Legal Status / Time Out of
            # Parental Care" one at the same four column positions, so signal 2
            # saw two different strings per column and read all sixteen writing
            # cells as guidance. A genuinely repeated header -- which is what
            # Form 15-47's checklist prints once per block -- is the *same*
            # string every time and collapses to one, so it still counts as the
            # evidence that keeps the schedule columns reference.
            printed = {text for _rect, text, heading in members
                       if text and not heading}
        else:
            printed = {text for _rect, text, _heading in members if text}
        kinds[key] = "reference" if len(printed) > 1 else "data"

    keys = sorted(columns)

    def neighbour(key, side):
        """The column sharing this one's left or right border, in its own table."""
        for other in keys:
            if other == key:
                continue
            if side == "left" and abs(other[1] - key[0]) < 2:
                return other
            if side == "right" and abs(other[0] - key[1]) < 2:
                return other
        return None

    # A checklist runs over several pages and only heads its tick column with the
    # check glyph once. On Form 15-47 the glyph is printed on page 3; pages 4 and
    # 5 carry the same table with no glyph at all, so the column fell through to
    # text fields 17.7pt wide. Its structure is the same on every page and is
    # readable without the glyph: an entirely empty narrow column with the row
    # numbers on its left and the descriptions on its right.
    for key in keys:
        if kinds[key] != "data" or key[1] - key[0] > NARROW_COLUMN:
            continue
        if any(text for _rect, text, _heading in columns[key]):
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


def _dollar_rect(page, clip):
    """The `$` the government printed inside an amount cell."""
    for text, boxes, _sizes in line_chars(page):
        for index, box in enumerate(boxes):
            if text[index] != "$":
                continue
            if (box.x0 >= clip.x0 - 1 and box.x1 <= clip.x1 + 1
                    and box.y0 >= clip.y0 - 1 and box.y1 <= clip.y1 + 1):
                return box
    return None


def drawn_boxes(page):
    """Writing areas the form draws as a standalone rectangle.

    Not every writing area on these forms is a table cell or an underscore rule.
    Form 15-47 draws "Job/Occupation", "Name of employer" and "Name and address
    of business" as plain rectangles, and page 7 has no ruled grid on it at all --
    just five of these. They were invisible to the build, because `_segments`
    reads only line items and `checkboxes` takes only `re` items in the 4-20pt
    range, so 73 writing areas on Form 15-47 got no field.

    A rectangle qualifies when it is bigger than a checkbox and prints nothing
    inside it. The forms also draw bordered boxes around blocks of instructions,
    and those hold text, so the emptiness test excludes them.
    """
    out = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] != "re":
                continue
            rect = fitz.Rect(item[1])
            if CB_MIN < rect.width < CB_MAX and CB_MIN < rect.height < CB_MAX:
                continue
            if rect.width < MIN_BLANK_WIDTH or rect.height < CELL_MIN_HEIGHT:
                continue
            if page.get_text("text", clip=rect + (2, 2, -2, -2)).strip():
                continue
            out.append(rect)
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


# Guide 6: a caption ending in ":" with an empty band under it is a writing area
# the form expects you to use but drew nothing for. Bands outside this range are
# a line of leading (too small) or the rest of the sheet (too large).
BAND_MIN, BAND_MAX = 22.0, 260.0
BAND_FOOTER = 45.0


# A drawn writing rule is at most this thick, and must be at least this long to
# be worth a field. Measured on the practice directives: every writing rule is
# 0.48pt thick and the shortest is 63pt.
DRAWN_RULE_MIN_WIDTH = 24.0
# How far above a rule the box sits, and how tall it is. Matches the underscore
# path's seating so a page mixing both looks the same.
DRAWN_RULE_HEIGHT = 12.0
RULE_NUDGE_MIN = 0.6


def printed_rule_blanks(page):
    """Writing lines the form *draws* rather than setting as underscores.

    Part 15 and the two regulation families print every blank as a run of
    underscores, which is why `underscore_blanks` was the only text path this
    builder ever needed. The practice directives are a different Word export and
    draw theirs as thin filled rectangles -- Directive 8's Form D page 4 sets
    all six of "Telephone number:", "Fax number (if any):", "E-mail address (if
    any):" that way, and the page produced no boxes at all, then fell through to
    `template_prompt_fields` and got one full-page area per label.

    This is `mb-forms`' central primitive arriving in Saskatchewan. It is
    deliberately narrower than Manitoba's: a rule only counts where it is
    **not part of a grid** (no vertical crosses it, so it is not a table border)
    and something is **printed to its left on its own line** (so it is an answer
    to a caption, not a heading's underline or a footer separator).
    """
    horizontal, vertical = _segments(page)
    if not horizontal:
        return []
    rows = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if text.strip():
                rows.append((fitz.Rect(line["bbox"]), text))
    out = []
    for key, start, end in horizontal:
        if end - start < DRAWN_RULE_MIN_WIDTH:
            continue
        if any(abs(vk - x) < 2 and vs <= key <= ve
               for vk, vs, ve in vertical for x in (start, end)):
            continue  # a table border, which `grid_cells` owns
        caption = None
        for rect, text in rows:
            if rect.y1 < key - 14 or rect.y0 > key + 2:
                continue
            if rect.x1 <= start + 2:
                if caption is None or rect.x1 > caption.x1:
                    caption = rect
        if caption is None:
            continue
        if not caption.__class__ or not "".join(
                t for r, t in rows if r is caption).strip().rstrip().endswith(":"):
            continue
        out.append(fitz.Rect(start + EDGE_CLEARANCE, key - DRAWN_RULE_HEIGHT,
                             end, key - RULE_NUDGE_MIN))
    return out


def writing_area_bands(page, placed):
    """Answer spaces the form anchors with a caption and then leaves as paper.

    Form 15-47 p14 ends Schedule 3 with "If you are unable to provide proof of
    payment, indicate why here:" and then 68pt of blank page. There is no rule,
    no cell and no shading to detect, so every other rule in this file correctly
    finds nothing, and a lawyer has nowhere to answer.

    Two guards, both of which the guide records as necessary. A caption that
    already has a field **on its own line** is answered beside itself, not below
    -- that is what "c. Equals total annual expenses: $____" looks like, and it
    is the false positive this scan produces twice on this very form. And the
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
        # Answered beside the caption rather than under it.
        if any(box.y0 < rect.y1 and box.y1 > rect.y0 and box.x0 >= rect.x0
               for box in placed):
            continue
        # **A band is cut by whatever is *in* it, not by whatever *starts*
        # below it.** Testing `other.y0 > rect.y1` cannot see a line that begins
        # a fraction above where the caption ends: Directive 4's Form A sets
        # "SOCIAL WORKER:" 0.4pt above the bottom of "FSM NO.:" on the line
        # before, so the band opened straight over it. Any line reaching below
        # the caption bounds the band, and it is bounded at that line's own top.
        # Manitoba hit this exactly (`mb-forms` README §8, "A band is empty
        # paper").
        below = [other.y0 for other, _t in lines
                 if other is not rect and other.y1 > rect.y1 + 1]
        band = fitz.Rect(rect.x0, rect.y1 + 2, page.rect.width - 72,
                         min(min(below, default=floor), floor))
        if not BAND_MIN <= band.height <= BAND_MAX:
            continue
        if any(band.intersects(box) for box in placed):
            continue
        out.append(band)
    return out


def heading_row_tops(page, cells, total_rows):
    """Row tops that are a bold section title, whose empty cells are frame space.

    Form 15-49 p3 runs three rules down the full height of the sheet, so the band
    holding the bold title "3: BANK ACCOUNTS AND SAVINGS" is enclosed on the right
    by two more cells. They are not fields; they are the part of the frame the
    title does not reach. Bold is the signal, because the form sets its section
    titles bold and its data rows plain -- but a totals row is bold too, so those
    are exempted first, or "TOTAL VALUE OF BANK ACCOUNTS AND SAVINGS" would lose
    the boxes it needs. Across all 40 forms this rule removes exactly these two
    cells and nothing else.
    """
    bold = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if span["text"].strip() and "bold" in span["font"].lower():
                    bold.append(fitz.Rect(span["bbox"]))
    rows = collections.defaultdict(list)
    for rect, text, _dollar in cells:
        rows[round(rect.y0)].append((rect, text))
    out = set()
    for top, members in rows.items():
        if top in total_rows:
            continue
        labelled = [rect for rect, text in members if text]
        if labelled and any(span.intersects(rect) for rect in labelled for span in bold):
            out.add(top)
    return out


def total_row_tops(cells):
    """Row tops whose printed label calls the row a total.

    Read per row rather than per cell, because the word is printed in the row's
    label cell and the cells that need the exemption are the empty ones beside it.
    """
    rows = collections.defaultdict(list)
    for rect, text, _dollar in cells:
        rows[round(rect.y0)].append(text)
    return {top for top, texts in rows.items()
            if TOTAL_ROW.search(" ".join(t for t in texts if t))}


def page_boxes(page):
    """Every candidate box on one page, as (rect, type), in reading order."""
    marks = checkboxes(page) + glyph_checkboxes(page)
    boxes = [(rect, "CheckBox") for rect in marks]

    cells = grid_cells(page)
    pix = page_greyscale(page) if cells else None
    # Heading rows are worked out **before** the columns are classified: a
    # heading is not evidence about the column under it. See `classify_columns`.
    total_rows = total_row_tops(cells)
    heading_rows = heading_row_tops(page, cells, total_rows)
    kinds = classify_columns(page, cells, heading_rows)
    filled_cells = []
    for rect, text, dollar in cells:
        if text:
            continue  # the government already wrote this cell's name (guide 9.3)
        if any(mark.intersects(rect) for mark in marks):
            continue  # a tick's own cell -- the printed checkbox is the field
        kind = kinds[(round(rect.x0, 0), round(rect.x1, 0))]
        if kind == "reference":
            continue  # a blank in the government's own reference grid
        # Shading marks a section-heading row -- but it also marks totals rows and
        # some amount rows, and neither of those is a heading. A row the form
        # calls a total, and any cell the form prints a `$` in, are places the
        # filer writes a figure: a heading never carries a `$`.
        if dollar is None and round(rect.y0) in heading_rows:
            continue  # frame space beside a bold section title
        if (dollar is None and round(rect.y0) not in total_rows
                and is_shaded(pix, page, rect)):
            continue  # a shaded section-heading row (guide 9.2)
        if kind == "tick":
            # The column is headed by a check glyph and prints no square of its
            # own, so the tick is sized to the form's own 9pt box and centred in
            # the cell the column gives it.
            cx, cy = (rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2
            boxes.append((fitz.Rect(cx - TICK_SIDE / 2, cy - TICK_SIDE / 2,
                                    cx + TICK_SIDE / 2, cy + TICK_SIDE / 2), "CheckBox"))
            filled_cells.append(rect)
            continue
        box = rect + (1.5, 1.5, -1.5, -1.5)
        if dollar is not None:
            # Guide 4: start after the `$`, take the height from the glyph, and
            # -- the part that was wrong -- take the *vertical position* from the
            # glyph too. Anchoring the top to the cell instead put Form 15-47 p9's
            # self-employment amount 40pt above the `$` it belongs to, at the top
            # of a tall cell, leaving the printed `$` with nothing beside it.
            height = min(dollar.height * LINE_RATIO, box.height)
            top = min(max(dollar.y0, box.y0), box.y1 - height)
            box = fitz.Rect(dollar.x1 + 1.5, top, box.x1, top + height)
        if box.width < MIN_BLANK_WIDTH or box.height < 6:
            continue
        if dollar is not None:
            # An amount is one line, always -- so a `$` cell is always a
            # TextField. Left to the height rule it is not: the glyph-derived
            # height is 17.7pt, which is 1.97 lines and trips the TextArea
            # threshold, while the same `$` in a shorter cell falls under it. The
            # column then mixes a one-line input with a resizable box for what is
            # the same kind of figure (guide 8, "two type values for the same kind
            # of table cell"). The `$` settles it without measuring anything.
            kind = "TextField"
        else:
            kind = "TextArea" if box.height / (SCALE * 6.0) > TEXTAREA_LINES else "TextField"
        boxes.append((box, kind))
        filled_cells.append(rect)

    # Writing areas the form draws as a bare rectangle, which are neither a ruled
    # cell nor an underscore rule. Skipped where something already covers them.
    placed = [rect for rect, _kind in boxes]
    for rect in drawn_boxes(page):
        if any((rect & other).get_area() > 0.35 * rect.get_area() for other in placed):
            continue
        if is_shaded(pix, page, rect) if pix is not None else False:
            continue
        box = rect + (1.5, 1.5, -1.5, -1.5)
        if box.width < MIN_BLANK_WIDTH or box.height < 6:
            continue
        lines = box.height / (SCALE * 6.0)
        boxes.append((box, "TextArea" if lines > TEXTAREA_LINES else "TextField"))
        filled_cells.append(rect)

    kept = []
    for rect, rule_y, size in underscore_blanks(page) + dollar_rule_blanks(page):
        # A blank inside a cell or drawn box that already got a field is that
        # field, seen twice. A blank inside one that did *not* is a real one:
        # Form 15-47 p9 prints "A. Business income... Gross $_____ ...Net" inside
        # one labelled cell, so the cell is correctly skipped and the gross figure
        # still has to be typed.
        if any(cell.intersects(rect) and cell.get_area() > rect.get_area()
               for cell in filled_cells):
            continue
        kept.append((rect, rule_y, size))
    for box in seat_blanks(kept, marks):
        boxes.append((box, "TextField"))

    placed_now = [rect for rect, _kind in boxes]
    for rect in printed_rule_blanks(page):
        if any((rect & other).get_area() > 0.3 * rect.get_area()
               for other in placed_now):
            continue
        boxes.append((rect, "TextField"))

    for band in writing_area_bands(page, [rect for rect, _kind in boxes]):
        boxes.append((band, "TextArea"))
    if not boxes:
        boxes = template_prompt_fields(page)
    return clear_of_type(page, boxes)


# A label introducing an italic parenthetical the filer is meant to replace:
# "Date: (pre-trial date)", "Counsel: (name)". The label is short and ends in a
# colon; the parenthetical opens immediately after it.
TEMPLATE_PROMPT = re.compile(r"^\s*[^()]{1,70}:\s*\(")
# A bare label on its own line, whose prompt is the paragraph beneath it
# ("Summary:").
TEMPLATE_LABEL = re.compile(r"^\s*[A-Z][^()]{0,60}:\s*$")
# Clear space this wide to the right of a prompt is where the answer goes.
PROMPT_MIN_WIDTH = 60.0
# A trailing narrative block gets at least this much height to be worth a box.
NARRATIVE_MIN_HEIGHT = 24.0


def template_prompt_fields(page):
    """Boxes for a page that is a Word *template* rather than a ruled form.

    Practice Directive 4's Forms C and D print no rule, no underscore, no cell
    and no rectangle -- one drawn object on the whole sheet, the title's
    underline -- so every detector above correctly finds nothing and the form
    built with zero fields. What they print is a label and an italic
    parenthetical standing in for the answer: "Date: (pre-trial date)",
    "Mother: (name and date served)". The filer replaces the parenthetical.

    The answer area is therefore **the clear space after the prompt**, out to
    the same right margin the page's own longest line reaches, so the printed
    guidance stays readable beside the box rather than under it. A label whose
    prompt is a paragraph of its own ("Summary:") gets a `TextArea` in the blank
    space below that paragraph instead.

    Guarded by "the page produced nothing else". That is the condition this
    shape actually describes -- a prompt with nowhere to answer -- and it also
    means the rule cannot reach any of the 76 shipped templates, every page of
    which yields boxes from the detectors above. The Saskatchewan README's
    "Known gap" is the same shape met one instance at a time and hand-measured
    into `MANUAL_FIELDS`; this is the case where it is the whole form, and
    hand-measuring 17 fields across two forms would record coordinates instead
    of the reason for them.
    """
    rows = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if text.strip():
                rows.append((fitz.Rect(line["bbox"]), text))
    if not rows:
        return []
    right = max(rect.x1 for rect, _text in rows)
    left = min(rect.x0 for rect, _text in rows)
    floor = page.rect.height - 54.0

    boxes = []
    for index, (rect, text) in enumerate(rows):
        if TEMPLATE_PROMPT.match(text):
            # **Stop at whatever is printed next on the same row.** Directive
            # 4's Form B sets two columns on one line -- "COURT: (name)" and
            # "SOCIAL WORKER: (name)" -- so running every box out to the page's
            # right margin put the first column's answer across the second
            # column's label.
            edge = right
            for other, other_text in rows:
                if other is rect or not other_text.strip():
                    continue
                if other.y1 <= rect.y0 + 1 or other.y0 >= rect.y1 - 1:
                    continue  # a different row
                if other.x0 >= rect.x1 and other.x0 < edge:
                    edge = other.x0 - EDGE_CLEARANCE
            # Cap the bottom at the next row's top. A prompt line's own box is
            # its line height, and Directive 4's Forms B and D set consecutive
            # prompts 13.8pt apart on a 16.6pt line, so each box reached 2.8pt
            # into the one below and the viewer drew two controls through each
            # other.
            floor_here = rect.y1
            for other, other_text in rows:
                if other is rect or not other_text.strip():
                    continue
                if other.y0 >= rect.y1 - 0.5 or other.y0 <= rect.y0 + 0.5:
                    continue
                floor_here = min(floor_here, other.y0)
            below = [other.y0 for other, other_text in rows
                     if other_text.strip() and other.y0 > rect.y0 + 0.5]
            if below:
                floor_here = min(rect.y1, min(below))
            box = fitz.Rect(rect.x1 + EDGE_CLEARANCE, rect.y0, edge, floor_here)
            if box.width >= PROMPT_MIN_WIDTH and box.height >= 6:
                boxes.append((box, "TextField"))
            continue
        if not TEMPLATE_LABEL.match(text):
            continue
        # A bare label: its prompt is the paragraph under it, and the answer
        # goes in the clear space after **all** of it. Advancing a running
        # `bottom` row by row skips a line that starts above the line before it
        # ends -- which the justified prompt on Form C does -- and the area then
        # opened over the last line of the government's own instruction.
        below = [other for other, other_text in rows
                 if other.y0 >= rect.y0 and other is not rect and other_text.strip()]
        bottom = max([other.y1 for other in below] or [rect.y1])
        top = bottom + EDGE_CLEARANCE
        if floor - top >= NARRATIVE_MIN_HEIGHT:
            boxes.append((fitz.Rect(left, top, right, floor), "TextArea"))
    return boxes


def clear_of_type(page, boxes):
    """Trim any box whose side edge is flush against printed type.

    Applied to every box rather than only to underscore runs, because a ruled
    cell and a drawn rectangle butt against the next word just as often -- Form
    15-102's judgment line ends 0.18pt short of the word after it. The viewer
    draws a bordered control inside the rectangle we store, so a gap that reads
    as correct in the overlay puts a border through a letter in the app.

    Checkboxes are left alone: they are seated on their printed square, and
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
        for glyph in glyphs:
            if glyph.y1 < rect.y0 + 2 or glyph.y0 > rect.y1 - 2:
                continue
            if -0.5 <= left - glyph.x1 < EDGE_CLEARANCE:
                left = glyph.x1 + EDGE_CLEARANCE
            if -0.5 <= glyph.x0 - right < EDGE_CLEARANCE:
                right = glyph.x0 - EDGE_CLEARANCE
        # MIN_RUN_WIDTH, not MIN_BLANK_WIDTH: the trim is only *applied* if what
        # survives is still usable, and at a 16pt floor the three Orders of
        # Adoption kept their 15.2pt day slot untrimmed and flush against the "e"
        # of "The", which is the one thing this function exists to prevent.
        if right - left >= MIN_RUN_WIDTH:
            rect = fitz.Rect(left, rect.y0, right, rect.y1)
        out.append((rect, kind))
    return out


def drop_signature_rules(boxes, captions):
    """Guide 5, with one refinement Saskatchewan forces.

    A caption claims **the nearest rule above it**, not every rule inside the
    24pt window. The jurat sets "2_ _________ ." one line above "A Commissioner
    for Oaths for Saskatchewan", which puts the year blank 23.95pt clear of the
    caption -- just inside the window -- so a flat rule deleted the year along
    with the commissioner's signature line. Dealing each caption its closest
    candidate is the same "one mark is one candidate, never union the marks in
    range" reasoning guide 2 records for checkboxes.
    """
    doomed = set()
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
    kinds = classify_columns(page, cells)
    out = []
    for rect, text, _dollar in cells:
        if text or kinds[(round(rect.x0, 0), round(rect.x1, 0))] != "tick":
            continue
        cx, cy = (rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2
        out.append(fitz.Rect(cx - TICK_SIDE / 2, cy - TICK_SIDE / 2,
                             cx + TICK_SIDE / 2, cy + TICK_SIDE / 2))
    return out


def signature_rule_rects(page):
    """The boxes this page deliberately does not get, for the verifier to excuse."""
    return drop_signature_rules(page_boxes(page), signature_captions(page))[1]


def nudge_onto_rules(doc_id, fields):
    """Drop every writing box onto its printed rule. See RULE_NUDGE.

    Checkboxes are excluded and must be: they are seated on a printed square,
    which the nudge would walk them off. Applied after seating rather than inside
    it, so the stacking and obstacle rules still reason about the geometry the
    page actually prints, and so verify_sk.py -- which re-derives every check
    from the page -- is the thing that decides whether the result is sound.
    """
    nudge = next((v for prefix, v in RULE_NUDGE.items()
                  if doc_id.startswith(prefix)), None)
    if nudge is None:
        return
    for field in fields:
        if field["type"] != "CheckBox":
            field["y"] = round(field["y"] + nudge, 2)


def is_fillable(source):
    """Does this source carry the government's own field rectangles?

    Part 15 and the two regulation families are static PDFs read off printed
    anchors -- "all 76 sources are static, no widgets, no XFA" was true of them.
    It stops being true with `sk_sources_pd`: the 17 interjurisdictional support
    forms and the three federal relocation notices are AcroForm, carrying up to
    313 declared rectangles each, and detecting anchors where the form already
    declares its geometry is strictly worse.

    Asked of the file rather than read from the manifest, so a rebuild cannot
    disagree with a stale fetch. `page.widgets()` is a generator and therefore
    always truthy, so it has to be drained rather than tested.
    """
    doc = fitz.open(source)
    try:
        return any(len(list(page.widgets())) for page in doc)
    finally:
        doc.close()


def build_from_widgets(src, doc_id, source, promote):
    """The widget path: the form's own rectangles, and a flattened background.

    Identical to the Manitoba builder's, and for the reason the extraction is in
    `bc_pipeline` rather than in either: Manitoba and Saskatchewan publish their
    own copies of the same national ISO set, and this would otherwise be written
    twice.

    **The background is flattened, not copied**, which is the one respect in
    which these templates differ from every other Saskatchewan one. Leaving the
    widget layer would put the government's AcroForm fields underneath our
    overlay and the viewer would draw two controls per blank. The printed rules
    and captions live in the page content stream and are untouched.
    """
    fields, audit = bp.extract(source, doc_id)
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    background = os.path.join(OUT, "%s.pdf" % doc_id)
    pages = bp.flatten_background(source, background)
    page_sizes = audit["pageSizes"]
    if pages != len(page_sizes):
        raise SystemExit("%s: flatten changed the page count" % doc_id)
    bp.clamp_to_page(fields, page_sizes)
    problems = bp.check_geometry(fields, page_sizes)
    overlaps = bp.check_overlap(background, fields)
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    kinds = {}
    for field in fields:
        kinds[field["type"]] = kinds.get(field["type"], 0) + 1
    print("%-13s pages=%-3d fields=%-4d %-42s sig-skipped=%-3d geom=%-2d overlap=%d  [widgets]"
          % (doc_id, len(page_sizes), len(fields), kinds,
             audit["signaturesSkipped"], len(problems), len(overlaps)))
    if problems:
        print("   geometry:", problems[:4])
    if promote and not problems:
        for extension in ("pdf", "json"):
            os.replace(os.path.join(OUT, "%s.%s" % (doc_id, extension)),
                       os.path.join(EXPORT, "%s.%s" % (doc_id, extension)))
    return {"docId": doc_id, "pages": len(page_sizes), "fields": len(fields),
            "kinds": kinds, "signatureSkipped": audit["signaturesSkipped"],
            "geometry": problems, "overlap": overlaps, "source": "widgets",
            "widgetNames": audit["widgetNames"]}


def build(src, promote=False):
    doc_id = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    if is_fillable(source):
        return build_from_widgets(src, doc_id, source, promote)
    doc = fitz.open(source)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    fields, skipped = [], 0
    index = 0
    for number, page in enumerate(doc, start=1):
        captions = signature_captions(page)
        kept, dropped = drop_signature_rules(page_boxes(page), captions)
        skipped += len(dropped)
        for rect, kind in kept:
            index += 1
            field = _field(doc_id, index, rect, kind)
            field["page"] = number
            fields.append(field)
    for page_number, rect, kind in MANUAL_FIELDS.get(doc_id, []):
        index += 1
        field = _field(doc_id, index, rect, kind)
        field["page"] = page_number
        fields.append(field)
    doc.close()

    nudge_onto_rules(doc_id, fields)
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
          % (doc_id, len(page_sizes), len(fields), kinds, skipped, len(problems), len(overlaps)))
    if problems:
        print("   geometry:", problems[:4])
    if promote and not problems:
        for extension in ("pdf", "json"):
            os.replace(os.path.join(OUT, "%s.%s" % (doc_id, extension)),
                       os.path.join(EXPORT, "%s.%s" % (doc_id, extension)))
    return {"docId": doc_id, "pages": len(page_sizes), "fields": len(fields),
            "kinds": kinds, "signatureSkipped": skipped,
            "geometry": problems, "overlap": overlaps, "source": "anchors"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=None)
    parser.add_argument("--category", default=None)
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()

    sources = shipped_sources()
    if args.only:
        # From every recorded source, not just the shipped ones: a batch is
        # built and reviewed before its category is turned on.
        sources = [s for s in all_sources() if s["docId"] in set(args.only)]
    if args.category:
        sources = [s for s in sources if s["category"].endswith(args.category)]

    report = [build(src, args.promote) for src in sources]
    total = sum(r["fields"] for r in report)
    bad = [r["docId"] for r in report if r["geometry"]]
    print("\n%d forms, %d fields, %d with geometry problems: %s"
          % (len(report), total, len(bad), ", ".join(bad) or "none"))
    with open(os.path.join(STAGE, "build_report.json"), "w") as fh:
        json.dump(report, fh, indent=1)


if __name__ == "__main__":
    main()

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
import mb_marks  # noqa: E402
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
# What a box has to keep after `clear_of_type` trims it off printed type. This is
# deliberately below `MIN_BLANK_WIDTH`: that is the width a *blank* must have to
# earn a box at all, while this is the width a box that already exists must keep
# to be worth having. Conflating the two made a narrow blank keep its overlap.
MIN_TRIMMED_WIDTH = 8.0
STACK_GAP = 1.0
# What makes a neighbouring rule a *ceiling* rather than the blank next to it:
# it has to rise clear of this one and to overlap it by more than an edge.
# Manitoba's tightest genuine stack is Form 70D p3's amount rules at an 11.5pt
# pitch, so 3pt has the whole gap to sit in.
CEILING_MIN_RISE = 3.0
CEILING_MIN_OVERLAP = 1.0
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
# How much of a cell a label may fill and still be read as a question answered
# beside it, when it carries no colon. Measured on the relocation schedules:
# "Proposed date of relocation" uses 0.36 of its row.
CAPTION_MAX_FILL = 0.55
# How much smaller than the body a block has to be set to read as footnotes.
# Measured on Provincial Court Form 1 p5: 7.5pt notes under a 10.5pt body.
FOOTNOTE_SIZE_DROP = 1.5
# A sub-label inside a cell is at most this long. "E-mail address:" is 15
# characters and "Phone number:" 13; the shortest running sentence this has to
# refuse is 76.
SUB_CAPTION_MAX_CHARS = 40
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

# Glyphs that do not make a rule a heading's underline: the underscore run that
# *is* the blank, and the punctuation Manitoba sets hard against one.
IGNORED_ON_RULE = set("_ \t.,;:")

UNDERSCORE_RUN = re.compile(r"_+")
# A row the form calls a total, or an arithmetic step -- both are rows the filer
# writes a figure in, and both are set bold, which `heading_row_tops` otherwise
# reads as the government's own heading.
#
# **Matched without word boundaries**, because what this is tested against is a
# cell's contents with the spaces already removed: "Total Annual Family Income
# Before Adjustments" arrives as `TotalAnnualFamilyIncomeBeforeAdjustments`, so
# `\btotal\b` never matched one. Forms CFS-10, AA-7 and FA-1 lost all four of
# their totals to that, and Form 70D.5's twenty-four were put back by hand
# (`repair_mb_forms.fill_total_rows`) rather than by fixing it here.
TOTAL_ROW = re.compile(r"(sub)?total|^(add|subtract):", re.I)

# --- signature vocabulary ---------------------------------------------------
# Manitoba captions its signature rules from below, in three shapes, all matched
# as a whole line so a sentence that mentions the office in passing is not read
# as a caption:
#
#   "Signature of Deponent", "Signature of Petitioner"   -- the word itself
#   "A Commissioner for Oaths in and for the Province of Manitoba"
#   "Deputy Registrar" / "Registrar"                      -- the office alone
# A caption naming a signature, in **any word order**. Anchoring on "signature"
# at the start of the line missed every form that puts the role first -- Forms
# 70BB p2 and 70DD p1 write "Party's signature/signature of counsel", and Forms
# 70C and 70Y p1 write "Witness (signature)" and "Respondent (signature)" -- so
# six boxes shipped sitting on signature lines, which guide §5 forbids outright.
# Bounded to a caption's length so a sentence that merely mentions a signature
# is not read as one, and `MB_SIG_EXCLUDE` keeps the "Date of ... signature"
# boxes, which §5 exempts by name.
MB_SIG_CAPTION = re.compile(r"^[^.]{0,60}\bsignature\b[^.]{0,40}$", re.I)
# "of Oaths", not only "for Oaths": Form CA-2 p2 prints "A Commissioner of Oaths
# in and for The Province of Manitoba", and the whole jurat turned on that word.
MB_COMMISSIONER = re.compile(
    r"^\s*a\s+commissioner\s+(for|of)\s+oaths\b|^\s*a\s+notary\s+public\b", re.I)
# **A section heading is not a signature caption**, even when it contains the
# word. The relocation schedules number their sections "Part A —" to "Part G —",
# and "Part G — Signature of person giving notice" *introduces* the signature
# block rather than captioning a rule in it. It happened to sit 23pt under the
# "Other — please specify:" box on Schedule A p5, inside the 24pt window a
# caption claims its rule in, and deleted it. A genuine caption follows its own
# rule and never opens with the government's own section numbering.
MB_SECTION_HEADING = re.compile(r"^\s*part\s+[A-Za-z0-9]+\s*[\u2014\u2013-]", re.I)
MB_SIG_EXCLUDE = re.compile(r"\bdate\b", re.I)

# **The office alone** -- a court officer's signature line, captioned with
# nothing but the office. Parentheses are allowed here because Manitoba writes
# both "(judge)" and "Deputy Registrar", and a court officer is never a party, so
# there is no name blank for this to take by mistake.
# **No parentheses**, for the reason `MB_PARTY_CAPTION` gives below: Manitoba
# parenthesises the caption of a blank where a *name* is typed and leaves a
# signature caption bare. Form 70G p1's "order granted by ______ of ______" is
# captioned "(judge)" and "(court)" and asks for the judge's and the court's
# name; Form 70E.1 p2's "Issued by ______" over a bare "Deputy Registrar" is
# where the registrar signs. Accepting the optional bracket read Forms 70G,
# 70H, 70X, 70Y and CFS-12 as signature lines and deleted the blank that
# identifies the judge -- which product review flagged on 2026-08-20 as "read
# the sentence and surrounding labels before suppressing it".
MB_OFFICE_CAPTION = re.compile(
    r"^\s*(deputy\s+)?(local\s+)?(registrar|judge|justice|clerk|"
    r"associate\s+judge)\s*$", re.I)

# **The party alone**, which Rule 70 never needed: it captions every party
# signature "Signature of X", so a bare role word only ever named an officer. The
# child-protection and adoption forms caption a party's signature with nothing
# but the role -- "Witness", "Parent", "Guardian", "Applicant", "Executive
# Director/Regional Director" -- and 40 typeable boxes sat on signature lines
# because of it.
#
# Two restrictions, each of which a form makes necessary and neither of which
# geometry can supply -- the caption is centred under its rule in both cases, so
# there is nothing to measure:
#
# **No parentheses.** A parenthesised party role is Manitoba's *strike-out name*
# caption, not a signature: Form 70D p1's "FINANCIAL STATEMENT OF ______
# (Petitioner/Respondent)" and Form 70D.5's nine "(petitioner/respondent)" blanks
# all want the party's name typed on the rule, and dropping them would take the
# name off the front of a financial statement. The cost is Form CFS-19 p3's
# "(Petitioner)", which really is a signature line and keeps a box.
#
# **No trailing comma or full stop.** That is what keeps this off the style of
# cause: `style_of_cause_bands` places a box above "Petitioner," and
# "Respondent(s).", captioned by the very same words. Manitoba punctuates the
# style of cause and leaves a signature caption bare.
_QUALIFIER = (r"(?:deputy\s+|local\s+|associate\s+|executive\s+|regional\s+|"
              r"area\s+|agency\s+|case\s+conference\s+|prospective\s+|"
              r"adoptive\s+)*")
# "of the child", "of Child and Family Services" -- and "of Court" / "of the
# Court" / "of Provincial Court", which the Provincial Court Family Rules forms
# close with: Form 1 p1 sets "Issued by ______" over a bare "Clerk of Court",
# and that is where the clerk signs, not a blank the filer types in. Only these
# four; a role qualified by anything else is not one of the offices this list is
# about.
_SUFFIX = (r"s?(?:\s+[A-Z])?"
           r"(?:\s+of\s+(?:child\s+and\s+family\s+services|the\s+child|"
           r"(?:the\s+)?(?:provincial\s+)?court))?")


def _role_caption(words):
    """A caption made of nothing but role words, slashes and "or"."""
    role = _QUALIFIER + r"(?:" + words + r")" + _SUFFIX
    return re.compile(r"^\s*(?:a\s+)?" + role +
                      r"(?:\s*(?:/|\s+or\s+)\s*" + role + r")*\s*$", re.I)


MB_PARTY_CAPTION = _role_caption(
    r"registrar|judge|justice|clerk|parent|guardian|agency|director|"
    r"manager|deponent|informant|interpreter|mother|father")

# **"Witness" is the one role in that list whose rule is not a signature.**
# Manitoba pairs a signer with a witness on one line -- "Witness    Signature",
# "Witness    Respondent" -- and the witness's own rule is where the witness
# writes their *name*, which is why product review on 2026-08-20 asked for "an
# input on every line labelled Witness and none on the corresponding signature
# line". Form AA-5 p2 had the mistake both ways round: no field where the
# witness prints, and a field on the line the party signs.
#
# It still has to be recognised, because it is the anchor `MB_AMBIGUOUS_ROLE`
# resolves against -- a bare "Respondent" is a signature caption *because*
# "Witness" shares its line -- so it marks the block without condemning its own
# rule.
MB_WITNESS_CAPTION = _role_caption(r"witness")

# **The four roles that are not evidence on their own.** "Petitioner",
# "Respondent", "Applicant" and "Co-petitioner" caption a signature line on Forms
# CFS-19/20/21 and AA-6 -- and a *name blank* on Rule 70: Form 70A p4 sets
# "(e) Full name at birth:" over two columns and labels them "Petitioner" and
# "Respondent", and Form 70Z's style of cause closes with
# "Petitioner/Applicant/Respondent". The caption is centred under its rule in
# every one of those cases, so no measurement separates them.
#
# What does: **a signature block sets its captions side by side.** Manitoba pairs
# the signer with the witness on one line -- "Witness    Respondent",
# "Witness    Applicant" -- so a role sharing its line with a caption already
# known to be a signature is one too, and a role standing alone on its line is
# left as the name blank it usually is.
MB_AMBIGUOUS_ROLE = _role_caption(r"respondent|petitioner|co-petitioner|applicant")
# How close two captions have to sit to count as printed on the same line.
SAME_LINE_TOL = 2.0
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


def name_notes(page):
    """The `(full name)` notes -- what `drop_signature_rules` reads to tell a
    caption that belongs to the box above it from a role word reaching back over
    the style of cause's own note to get there.

    Only these lines, not every printed line: a signature block routinely sets
    *two* captions under its rule -- Form 70L p1 prints "Petitioner or
    Petitioner's Lawyer" and then "(signature of petitioner or petitioner's
    lawyer)" -- and treating the first as an obstacle would put a typeable box on
    the signature line it names.
    """
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if CAPTION_BELOW.match(text):
                out.append(fitz.Rect(line["bbox"]))
    return out


def signature_captions(page):
    """Rects of the captions that mark a rule as somebody's signature line.

    Two passes, because `MB_AMBIGUOUS_ROLE` is decided by its neighbours: a bare
    "Respondent" is a signature caption where it shares a line with one, and a
    column label where it stands alone (see the pattern's own note).
    """
    out, maybe, anchors = [], [], []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if (MB_SIG_EXCLUDE.search(text) or MB_SIG_KEEP.search(text)
                    or MB_SECTION_HEADING.match(text)):
                continue
            rect = fitz.Rect(line["bbox"])
            if MB_WITNESS_CAPTION.match(text):
                # Marks the signature block for the ambiguous-role test below
                # but keeps its own rule: see MB_WITNESS_CAPTION.
                anchors.append(rect)
            elif (MB_SIG_CAPTION.search(text) or MB_COMMISSIONER.search(text)
                    or MB_OFFICE_CAPTION.match(text)
                    or MB_PARTY_CAPTION.match(text)):
                out.append(rect)
                anchors.append(rect)
            elif MB_AMBIGUOUS_ROLE.match(text):
                maybe.append(rect)
    for rect in maybe:
        if any(abs(other.y0 - rect.y0) <= SAME_LINE_TOL and other != rect
               for other in anchors):
            out.append(rect)
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
            if char != JURAT_BRACKET:
                continue
            # **A jurat bracket closes its line; an enumerator opens one.** The
            # bracket column is the right-hand edge of the jurat, so nothing is
            # printed after it. An "(a)"/"(b)"/"(c)" list gives three ")" in a
            # tight vertical stack at the same x -- indistinguishable from a
            # jurat by pitch and count alone -- and Form 70I p1's "a true copy
            # of:" list is exactly that, so all three of its writing lines were
            # dropped as the deponent's signature rule and the affidavit shipped
            # with nowhere to describe what was served.
            if text[index + 1:].strip():
                continue
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

    **An underscore is not type for this purpose.** Where Manitoba sets a blank
    as `______________` it also draws a rule along it, so the run's own glyphs
    cover their rule 100% and the test above reads the blank as a heading. The
    financial batch has 3 underscore runs in 31 pages and never showed it; the
    other 38 forms have 793, and it misread 45 of them -- putting a genuine
    writing line on Form 70E p1's "on ___, ___, at ___" out of reach. Only
    letters and digits make a rule an underline; `_` is the blank itself.
    """
    width = x1 - x0
    if width <= 0:
        return False
    covered = 0.0
    for box, char, _size in chars:
        if char in IGNORED_ON_RULE:
            continue
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


# Letters printed on a rule *after* its left-hand caption split it into two
# blanks. Only alphanumerics count: the punctuation Manitoba sets against a blank
# ("of the ______, in the") and the `$` guide 4 anchors an amount to are on the
# rule too, and splitting on those would fragment every money line in the batch.
# 3pt joins the words of one caption -- "(name of person served/" -- without
# reaching the next blank, Manitoba's narrowest being 16.8pt.
CAPTION_JOIN = 3.0


def _rule_segments(chars, key, start, end, size):
    """One printed rule, split into the blanks the type on it leaves.

    Manitoba writes a short blank by **captioning it from inside**:
    `_______(date)_______`, `_______(occupation)_______`, `______(name)______`.
    Word draws one rule under the whole thing, so `_clear_rule_start` -- which
    searches only the left half, on purpose -- leaves the caption in the middle
    of the span and the box is seated straight over it. Forms CFS-22A and CFS-22B
    do this eleven times on one page each.

    The caption divides the rule into the segments either side of it, and both
    are real: "On ______(date)______, 20___" gives the filer more room before the
    caption than after. A rule with its caption at the left end still yields one
    segment, which is what `_clear_rule_start` has always returned.
    """
    start = _clear_rule_start(chars, key, start, end, size)
    runs = []
    for box, char, _size in chars:
        if not char.isalnum():
            continue
        centre = (box.y0 + box.y1) / 2
        if not key - UNDERLINE_BAND * size <= centre <= key:
            continue
        if box.x1 <= start or box.x0 >= end:
            continue
        runs.append((max(box.x0, start), min(box.x1, end)))
    runs.sort()
    merged = []
    for run_start, run_end in runs:
        if merged and run_start - merged[-1][1] <= CAPTION_JOIN:
            merged[-1][1] = max(merged[-1][1], run_end)
        else:
            merged.append([run_start, run_end])

    out, edge = [], start
    for run_start, run_end in merged:
        if run_start - EDGE_CLEARANCE - edge >= MIN_BLANK_WIDTH:
            out.append((edge, run_start - EDGE_CLEARANCE))
        edge = max(edge, run_end + EDGE_CLEARANCE)
    if end - edge >= MIN_BLANK_WIDTH:
        out.append((edge, end))
    return out


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


# A heading bracket: the pair of rules Manitoba draws above and below a
# document's title. Both are 0.8pt filled rects indistinguishable from a writing
# rule, and neither has anything printed on its own line, so every other test in
# `printed_rules` correctly passes them -- which put a text box over "O R D E R"
# and over "PETITION AND NOTICE OF HEARING" on 22 pages of the child-protection
# and adoption batch. See `heading_brackets`.
BRACKET_MIN_GAP, BRACKET_MAX_GAP = 10.0, 70.0
# How far the heading may sit off the pair's own centre. The genuine brackets in
# the batch measure 0.1-10.5pt; the nearest thing that is *not* one is Form 70A
# p5's left-aligned "(b) The respondent's full address ..." between two answer
# rules, at 80pt, so the cut has 68pt of clear air in it.
BRACKET_MAX_OFFSET = 12.0
# ...and the heading has to float between the rules rather than caption one of
# them. Measured as a fraction of the gap: the genuine brackets leave at least
# 0.30 clear above and below, while a caption ("Signature of Interpreter",
# "(Petitioner)", "Address") sits within 0.07 of the rule it belongs to.
BRACKET_MIN_CLEAR = 0.25
# A parenthetical between the rules is Manitoba's caption idiom, and it captions
# the rule *above* it -- Form CFS-17's backing sheet writes "(title of document)"
# between the pair and expects the title on the upper rule. Only the lower rule
# is decoration there.
BRACKET_CAPTION = re.compile(r"^\(.*\)[.,;]?$")


def heading_brackets(page):
    """The rule keys that bracket a printed heading rather than a blank.

    Returns the set of `round(key, 1)` to refuse. A bracket is two rules of the
    same span, `BRACKET_MIN_GAP` to `BRACKET_MAX_GAP` apart, with **exactly one**
    printed line between them, centred on the pair and clear of both rules.

    Both rules go, unless the line between is a parenthetical caption, in which
    case only the lower one does -- see `BRACKET_CAPTION`.
    """
    horizontal, _vertical = _segments(page)
    lines = []
    for text, boxes, _sizes in line_chars(page):
        if text.strip():
            lines.append((fitz.Rect(boxes[0]) | fitz.Rect(boxes[-1]), text.strip()))

    # A rule with type on its own line is a blank beside a caption, never a
    # bracket. The line is read at the rule's own baseline, which is where
    # `_is_underline` looks too.
    chars = page_chars(page)
    empty = []
    for key, start, end in horizontal:
        if end - start < MIN_BLANK_WIDTH:
            continue
        size = _font_at(chars, key, start, end)
        if any(abs((r.y0 + r.y1) / 2 - (key - size / 2)) < size * 0.6
               and r.x1 > start - 2 and r.x0 < end + 2 for r, _t in lines):
            continue
        empty.append((key, start, end))

    refused = set()
    for upper_key, start, end in empty:
        for lower_key, other_start, other_end in empty:
            gap = lower_key - upper_key
            if not BRACKET_MIN_GAP < gap < BRACKET_MAX_GAP:
                continue
            if abs(start - other_start) > 1 or abs(end - other_end) > 1:
                continue
            between = [(r, t) for r, t in lines if upper_key < (r.y0 + r.y1) / 2 < lower_key]
            if len(between) != 1:
                continue
            rect, text = between[0]
            if abs((rect.x0 + rect.x1) / 2 - (start + end) / 2) > BRACKET_MAX_OFFSET:
                continue
            if (rect.y0 - upper_key) / gap < BRACKET_MIN_CLEAR:
                continue
            if (lower_key - rect.y1) / gap < BRACKET_MIN_CLEAR:
                continue
            refused.add(round(lower_key, 1))
            if not BRACKET_CAPTION.match(text):
                refused.add(round(upper_key, 1))
    return refused


# What Manitoba prints below the last rule on a page, and nothing else on these
# forms looks like: the regulation citation ("M.R. 76/2000; 205/2001") and, on
# the forms filed in multiple copies, the distribution block ("Copy 1 - agency
# for court" ... "All five copies must be signed and witnessed").
CITATION_FOOTER = re.compile(
    r"^(M\.R\.|R\.M\.)\s*\d|^copy\s+\d|^all\s+\w+\s+copies\b", re.I)
# The separator above that footer starts at the page's left text margin. A blank
# is never set there: Manitoba indents its answer lines, so the commissioner's
# "My Commission expires ______" on the same forms starts at 173.5-182.5pt while
# the separator starts at 63 or 72. Width is deliberately not constrained -- the
# separator above a citation measures 57.5-76.6pt and the one above a
# distribution block runs the page's whole measure.
FOOTER_MARGIN_TOL = 2.0


def footer_separators(page):
    """The rule keys that separate the body from the regulation citation.

    Returns the set of `round(key, 1)` to refuse. Rule 70 has none of these --
    those forms print a "Form 70N (page 2 of 2)" footer instead -- which is why
    the financial and pleadings batches never met one. Twenty-three pages of the
    child-protection and adoption set do, and the box seated on the rule hangs
    *upward* into the last line of the form's own text: over "NOTE: Wording may
    be adapted if more than one child." on six forms, over "Backing for Forms
    CFS-19 and CFS-20." on another, and over the "Total Adjusted Annual Family
    Income" row of all three declarations of family income.
    """
    horizontal, _vertical = _segments(page)
    lines = []
    for text, boxes, sizes in line_chars(page):
        if text.strip():
            lines.append((fitz.Rect(boxes[0]) | fitz.Rect(boxes[-1]), text.strip(),
                          max(sizes) if sizes else 0.0))
    if not lines:
        return set()
    left = min(rect.x0 for rect, _t, _s in lines)
    body = collections.Counter(round(size, 1) for _r, _t, size in lines
                               if size).most_common(1)
    body_size = body[0][0] if body else 0.0

    refused = set()
    for key, start, end in horizontal:
        if abs(start - left) > FOOTER_MARGIN_TOL:
            continue
        # **A footnote separator is the same rule.** Manitoba also draws this
        # short left-margin rule above a block of *footnotes* -- Provincial
        # Court Form 1 p5 ends with five bulleted notes explaining what a
        # relocation is -- and there the text below is not a citation, so the
        # citation test alone left a 144pt typeable box hanging over the last
        # line of paragraph 9. What separates a footnote block from the body is
        # that it is set smaller: measured here, 7.5pt against the page's 10.5pt
        # body. Both tests are needed; the citation blocks are set at body size.
        below_sizes = [size for rect, _t, size in lines if rect.y1 > key and size]
        if (below_sizes and body_size
                and max(below_sizes) <= body_size - FOOTNOTE_SIZE_DROP):
            refused.add(round(key, 1))
            continue
        # Any line reaching below the rule, not only one starting below it:
        # Form AA-5 p2 draws its separator 2pt *inside* the citation's own line
        # box, so a test on the line's top saw nothing below the rule at all.
        below = [text for rect, text, _size in lines if rect.y1 > key]
        if not below or not all(CITATION_FOOTER.match(text) for text in below):
            continue
        refused.add(round(key, 1))
    return refused


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
    brackets = heading_brackets(page) | footer_separators(page)
    borders = set()
    for rect, _text, _dollar, _caption in cells:
        borders.add(round(rect.y0, 0))
        borders.add(round(rect.y1, 0))

    out = []
    for key, start, end in horizontal:
        if round(key, 1) in brackets:
            continue
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
        for seg_start, seg_end in _rule_segments(chars, key, start, end, size):
            out.append((fitz.Rect(seg_start, key - size, seg_end, key), key, size))
    return out


def seat_rules(rules, ceilings=()):
    """Turn each printed rule into its box, never overlapping the rule above.

    A blank's box hangs *upward* from its own rule, one line deep, capped by the
    nearest rule above that shares any of its width -- Form 70D p1 sets the
    jurat's three rules on a 25pt pitch and Form 70D p3's income schedule stacks
    its amount rules on an 11.5pt pitch, against a 13pt box, so uncapped boxes
    would render as a crushed stack of borders.

    `ceilings` are the other printed horizontals a box may not cross: the
    underlines. They are not writing rules and so are absent from `rules`, but a
    box that rises through one still draws its border across underlined type --
    Form 70E.2 p2 underlines "MY CHILDREN (… whether they are First Nation
    members):" one point above the "1)" answer line beneath it.
    """
    seated = []
    for rect, key, size in rules:
        bottom = key - RULE_CLEARANCE
        height = size * LINE_RATIO
        # **Overlap by more than a hair, and sit more than a hair above.** Two
        # blanks that abut on the same line -- Form 70H p10 sets a drawn rule
        # ending at x 134.2 and an underscore run starting at x 134.2, 1.2pt
        # apart vertically -- share an edge and a baseline, and reading the
        # neighbour as a ceiling capped the box to nothing and dropped the blank.
        above = [other_key for other, other_key, _s in rules
                 if other_key < key - CEILING_MIN_RISE
                 and min(other.x1, rect.x1) - max(other.x0, rect.x0) > CEILING_MIN_OVERLAP]
        above += [other_key for other_key, start, end in ceilings
                  if other_key < key - CEILING_MIN_RISE
                  and min(end, rect.x1) - max(start, rect.x0) > CEILING_MIN_OVERLAP]
        if above:
            # Measure the cap from the box's own bottom, not from its rule.
            # `bottom` is already RULE_CLEARANCE above `key`, so capping the
            # height at `key - ceiling - STACK_GAP` puts the top at
            # `ceiling + STACK_GAP - RULE_CLEARANCE` -- 0.3pt *through* the
            # thing it was meant to stop at, every time.
            height = min(height, bottom - (max(above) + STACK_GAP))
        if height < 6:
            continue
        seated.append(fitz.Rect(rect.x0, bottom - height, rect.x1, bottom))
    return seated


def underline_keys(page):
    """The printed underlines, as (y, x0, x1) -- ceilings for `seat_rules`."""
    horizontal, _vertical = _segments(page)
    chars = page_chars(page)
    out = []
    for key, start, end in horizontal:
        if end - start < MIN_BLANK_WIDTH:
            continue
        size = _font_at(chars, key, start, end)
        if _is_underline(chars, key, start, end, size):
            out.append((key, start, end))
    return out


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
    """Every printed option mark on the page. One mark is one control.

    Manitoba writes an option three ways and this is the single definition of
    "printed square" for the whole pipeline -- the builder places a control on
    each, and `verify_mb.check_checkbox_marks` asks the same function whether a
    stored control has one under it:

    * a **stroked square**, the vocabulary BC and Saskatchewan use;
    * a **`[ ]` bracket pair** (Forms 70D, 70D.1, 70A, 70B, …);
    * a **`☐` glyph** (Forms 70W, 70Z, …).

    The last two are *text*, so a detector that only reads vector art finds
    nothing at all on them. That is exactly what happened: the financial batch
    shipped with zero CheckBox fields against 30 printed options, and building
    the remaining 38 forms without this turned up 247 more. `mb_marks` measures
    the text ones off the page (glyph first, then refined to rendered ink).
    """
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
    for _kind, _font_box, square in mb_marks.marks(page):
        if not any(square.intersects(rect) for rect in out):
            out.append(square)
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
    # **The colon, or half the cell left empty after a one-line label.**
    # Manitoba's own forms mark the "answer me inside myself" cell with a colon
    # (Form 70W's "Address:", "Date of Birth:"), and that is the reliable
    # signal. The relocation schedules add a second shape: a bold row label with
    # no colon at all -- "Proposed date of relocation" -- with three-quarters of
    # the row left blank beside it. A label that is genuinely a heading fills its
    # row or is followed by its own answer cell, so requiring *most of the cell
    # to still be empty* separates the two without loosening the colon rule for
    # anything that already relies on it.
    if not inside:
        return None
    if not text.rstrip().endswith(":"):
        used = max(box.x1 for box, _char in inside) - rect.x0
        if used > (rect.x1 - rect.x0) * CAPTION_MAX_FILL:
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
# What is left of a caption's band after trimming it clear of the type above has
# to still be a line somebody can write a name on. Form 70T's respondent line
# keeps 9.4pt of the nominal 14 once "- and -" is cleared, which is the tightest
# real one in the batch; the party lines that keep a full line are all 14.0.
CAPTION_MIN_HEIGHT = 8.0


def writing_area_bands(page, placed, cells, obstacles=()):
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
        # A box closes a band as surely as printed type does, and one that is
        # about to be *deleted* closes it too: Form 70L p1's "Consented to:" is
        # followed by 80pt of paper and then the respondent's signature rule,
        # which `placed` does not carry (it is dropped) and no printed line
        # reports. Floored at the box's own top, not at the rule under it.
        below = [other.y0 for other, _t in lines if other.y0 > rect.y1 + 1]
        below += [box.y0 for box in obstacles
                  if box.y0 > rect.y1 + 1 and box.x1 > rect.x0]
        band = fitz.Rect(rect.x0, rect.y1 + 2, page.rect.width - 72,
                         min(min(below, default=floor), floor))
        # **A band is empty paper.** Taking the bottom from "the next line
        # starting more than 1pt below this caption" is not the same thing: a
        # sentence set immediately under its caption starts *within* that 1pt,
        # so it is skipped and the band closes on the line after it, swallowing
        # the government's own words. Forms 70A.1 and 70J p3 both do this --
        # "Reconciliation:" over "There is no possibility of reconciliation or
        # resumption of cohabitation." -- and a writing area over a printed
        # statement is guide 9.3. Cut the band at whatever actually prints in it.
        #
        # Tested on the line's whole rectangle, not on its top edge. Manitoba
        # sets a prompt tighter than its caption's own line box -- Form AA-15 p3
        # runs "(Specify the grounds to be argued...)" from y 312.5 while
        # "The grounds for the application are:" ends at 313.6 -- so a test on
        # `y0 > caption.y1` cannot see the very line it is meant to stop at, and
        # the band opened straight over the government's instruction. A line that
        # straddles the band's top pushes the top down; one below it sets the
        # bottom.
        for other, _t in lines:
            if other.y1 <= band.y0 + 0.5 or other.y0 >= band.y1:
                continue
            if other.x1 <= band.x0 or other.x0 >= band.x1:
                continue
            if other.y0 <= band.y0 + 0.5:
                band.y0 = max(band.y0, other.y1 + 1)
            else:
                band.y1 = min(band.y1, other.y0 - 1)
        if band.y1 <= band.y0:
            continue
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


# A narrative prompt: a parenthesised instruction telling the filer to write
# something, closing its own paragraph. Manitoba draws no rule for these -- the
# answer goes on the blank paper underneath -- so no other detector in this file
# finds them, and Form 70Q shipped as a Notice of Motion whose relief, grounds
# and documentary evidence all had nowhere to be written.
#
# Matched against the **paragraph**, not the line. Form 70Q's "THE GROUNDS FOR
# THE MOTION ARE (Specify the grounds to be argued, including a reference to any
# statutory provision or rule to be relied on.)" wraps, so the opening "(" and
# the closing ")" are on different lines and neither one matches alone. `.*`
# rather than `[^()]*` for the same reason in miniature: Form 70Y writes
# "(Insert clause(s) as set out in order)", with a bracket inside the bracket.
NARRATIVE_PROMPT = re.compile(
    r"\((?:state|specify|list|set out|explain|describe|insert|provide|give)\b"
    r".*\)[.\]\s]*$", re.I)
# One line of writing is a real answer space -- it is what Form 70Q leaves
# between "THE MOTION IS FOR (State here the precise relief sought.)" and the
# paragraph under it, and every box on these forms is about 14pt tall.
NARRATIVE_MIN = 12.0
NARRATIVE_MAX = 260.0
# How close under a box a parenthetical has to sit to be read as its caption
# rather than as a prompt. Manitoba sets a caption 2-4pt under its blank.
PROMPT_CAPTION_GAP = 6.0
# Lines closer together than this are one paragraph. Manitoba's body leading is
# 12-13pt and its paragraph gap 23pt or more, so the cut has 10pt of clear air.
PARA_LEADING = 18.0


def narrative_prompt_bands(page, placed, cells, obstacles=()):
    """Answer spaces for a prompt that names no rule, cell or blank of its own.

    Guide §6 and §9.5. The band runs from just under the instruction's own line
    to whatever prints next, and takes its column from the page's text measure.
    Everything that would make it a false positive is refused rather than
    trimmed, because a spurious writing area over printed type is worse than a
    missing one:

    * a prompt inside a ruled cell -- its table answers it;
    * a band with anything printed in it, or with a field already in it;
    * a band shorter than a line, or longer than `NARRATIVE_MAX` (which is what
      separates "the space the form left" from "the rest of the page").
    """
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append((fitz.Rect(line["bbox"]), text))
    lines.sort(key=lambda pair: (round(pair[0].y0, 1), pair[0].x0))

    # Join a line to the next only while its brackets are unbalanced, which is
    # exactly as far as a wrapped instruction runs and no further. Leading
    # cannot do this job here: Form 70Q sets 12.8pt between two *separate*
    # prompts and ~11pt inside one that wraps, so grouping by spacing swallowed
    # all three of its prompts into one and produced a single band.
    paragraphs = []
    index = 0
    while index < len(lines):
        rect, text = lines[index]
        whole, last_line = fitz.Rect(rect), rect
        while text.count("(") > text.count(")") and index + 1 < len(lines):
            index += 1
            nxt_rect, nxt_text = lines[index]
            text = "%s %s" % (text, nxt_text)
            whole |= nxt_rect
            last_line = nxt_rect
        paragraphs.append((whole, text, last_line))
        index += 1

    left = min((r.x0 for r, _t in lines), default=72.0)
    right = max((r.x1 for r, _t in lines), default=page.rect.width - 72)
    out = []
    for index, (whole, text, last_line) in enumerate(paragraphs):
        if not NARRATIVE_PROMPT.search(text):
            continue
        if any(cell.intersects(whole) for cell, _t, _d, _c in cells):
            continue
        # **A parenthetical printed under a blank is that blank's caption, not a
        # prompt for the paper below it.** Form CA-2 p1 ends with "person
        # ______ / (insert name if known)", and the caption matched
        # `NARRATIVE_PROMPT` on the word "insert", opening a 76pt writing area in
        # the bottom margin that answers nothing. Manitoba captions from below
        # throughout, so the box overhead is the whole signal.
        standalone = text.strip().startswith("(") and text.strip().endswith(")")
        if standalone and any(
                0 <= whole.y0 - box.y1 <= PROMPT_CAPTION_GAP
                and box.x1 > whole.x0 and box.x0 < whole.x1 for box in placed):
            continue
        # A box floors the band too, including one that is about to be
        # deleted -- Form 70Q p1 leaves 75pt between "(List the affidavits ... to
        # be relied on.)" and the lawyer's signature rule, and the answer space
        # is the paper above that rule's box, not over it.
        floor = min([other.y0 for other, _t, _l in paragraphs[index + 1:]
                     if other.y1 > last_line.y1 + 1]
                    + [box.y0 for box in obstacles if box.y0 > last_line.y1 + 1]
                    or [page.rect.height - BAND_FOOTER])
        band = fitz.Rect(left, last_line.y1 + 2, right,
                         min(floor - 1, last_line.y1 + 2 + NARRATIVE_MAX))
        if band.height < NARRATIVE_MIN:
            continue
        if any(band.intersects(box) for box in placed):
            continue
        if page.get_text("text", clip=band).strip():
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
            # **Trim the band to the clear paper, rather than refusing it.**
            # A full line's worth of space above the caption is what the style
            # of cause usually leaves, but not always: Form 70T sets "- and -"
            # 16pt above the respondent's "(full name)," so the band reached it
            # and the respondent -- alone of the two parties -- got no box at
            # all. Cut the top to whatever prints in the way and keep what is
            # left, provided it is still a line somebody can write on.
            for other in page.get_text("dict")["blocks"]:
                for other_line in other.get("lines", []):
                    if not "".join(s["text"] for s in other_line["spans"]).strip():
                        continue
                    box = fitz.Rect(other_line["bbox"])
                    if box.y1 <= band.y0 or box.y0 >= band.y1:
                        continue
                    if box.x1 <= band.x0 or box.x0 >= band.x1:
                        continue
                    band.y0 = max(band.y0, box.y1 + 1)
            if band.height < CAPTION_MIN_HEIGHT:
                continue
            if page.get_text("text", clip=band).strip():
                continue
            out.append(band)
    return out


# The role word Manitoba sets against the right margin to close a party's line
# in the style of cause. It closes with the comma or full stop that punctuates
# the style of cause, which is what separates it from the same word used as a
# signature caption ("Respondent" under a signed rule on Form CFS-19 p2).
STYLE_ROLE = re.compile(
    r"^(co-)?(petitioner|applicant|respondent)s?(\(s\))?(/(petitioner|applicant|"
    r"respondent)s?)?\s*[,.]$", re.I)
# The heading that opens a style of cause. Manitoba letterspaces it on some forms
# ("B E T W E E N :"), so it is matched on the letters rather than the string.
STYLE_BETWEEN = re.compile(r"^b\s*e\s*t\s*w\s*e\s*e\s*n\s*:?$", re.I)
# One line of writing above the role word, and how much clear paper there has to
# be for it. Measured across the batch: 22-25pt between the line above and the
# role word, against a 14pt box.
STYLE_LINE_HEIGHT = 14.0
STYLE_GAP = 2.0
STYLE_MIN_HEIGHT = 8.0


def style_of_cause_bands(page, placed):
    """The party lines of a style of cause that has no rule and no caption.

    Rule 70 draws its style of cause as a rule with a `(full name)` note under it
    (`caption_below_blanks`). The child-protection and adoption forms print
    neither -- Forms CFS-19, CFS-27 and AA-15 leave bare paper between
    "BETWEEN:" and a right-aligned "Petitioner," with nothing else on it -- so
    every other detector here correctly finds nothing and the parties have
    nowhere to go, on the most important line of the form.

    The role word is the anchor and the band is the clear line above it, from the
    page's left text measure across to where the role word ends, which is how a
    filed Manitoba style of cause is actually typed: the name at the left, the
    role at the right, on consecutive lines.

    `STYLE_BETWEEN` has to appear above it on the same page. Without that guard
    the same words read as signature captions -- Forms CFS-13 and CFS-19 caption
    signature rules "Parent" and "Respondent" -- and the punctuation alone is too
    thin a thread to hang a box on the wrong line of a court document.
    """
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append((fitz.Rect(line["bbox"]), text))
    lines.sort(key=lambda pair: (pair[0].y0, pair[0].x0))

    between = [rect.y1 for rect, text in lines if STYLE_BETWEEN.match(text)]
    if not between:
        return []
    opened = min(between)

    left = min((rect.x0 for rect, _t in lines), default=72.0)
    out = []
    for rect, text in lines:
        if rect.y0 < opened or not STYLE_ROLE.match(text):
            continue
        band = fitz.Rect(left, rect.y0 - STYLE_GAP - STYLE_LINE_HEIGHT,
                         rect.x1, rect.y0 - STYLE_GAP)
        if band.width < MIN_BLANK_WIDTH:
            continue
        # Trim to the clear paper rather than refuse it, as `caption_below_blanks`
        # does: "- and -" is set 22pt above the respondent's role word on several
        # of these forms, which is a line's worth minus the leading.
        for other, _t in lines:
            if other.y1 <= band.y0 or other.y0 >= band.y1:
                continue
            if other.x1 <= band.x0 or other.x0 >= band.x1:
                continue
            band.y0 = max(band.y0, other.y1 + 1)
        if band.height < STYLE_MIN_HEIGHT:
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


# A row label's answer sits in the next cell along, so the label's own cell gets
# nothing. Two cells share a row when their tops agree within this.
ROW_TOL = 2.0
# Clear space under a cell's printed label, below which it is not worth a box.
CELL_BAND_MIN = 22.0


def _row_has_empty_neighbour(rect, cells):
    """Is this labelled cell a row label, with its answer in the next column?

    Manitoba's own rule is that a cell may ask its question and be answered
    inside itself -- Form 70W prints "Address:" and expects the answer after the
    colon in the same box. The relocation schedules do the opposite and print
    "Name:" in its own narrow cell with a wide empty one beside it, which is
    Saskatchewan's arrangement (guide 9.3). Both are ruled tables and the cell
    alone cannot tell them apart; **the row can**. If something empty sits to the
    right on the same row, that is where the answer goes, and a box after the
    colon would be a second field for one question -- which is what Schedule A
    p1 had, on every line of Part A.
    """
    for other, text, _dollar, _caption in cells:
        if other == rect or text:
            continue
        if abs(other.y0 - rect.y0) > ROW_TOL:
            continue
        if other.x0 >= rect.x1 - 1:
            return True
    return False


def _row_is_one_line(page, rect, cells):
    """Does this empty cell sit in a row whose labels are a single line?

    An empty cell says nothing about how much is meant to be written in it --
    only its height, and `box.height / (SCALE * 6)` reads a 20pt row as 1.93
    lines and hands the filer a resizable area to type a name into. **The row's
    own labels do say**: Schedule A p1 sets "Name:", "Current address:" and
    "Current phone number:" one line each beside the cells the answers go in, so
    those cells are one line too. A cell whose row label wraps, or which has no
    labelled sibling at all, is left to the height rule.
    """
    for other, text, _dollar, _caption in cells:
        if other == rect or not text:
            continue
        if abs(other.y0 - rect.y0) > ROW_TOL:
            continue
        printed = 0
        for block in page.get_text("dict", clip=other + (1, 1, -1, -1))["blocks"]:
            for line in block.get("lines", []):
                if "".join(span["text"] for span in line["spans"]).strip():
                    printed += 1
        return printed == 1
    return False


def _cell_sub_captions(page, rect, marks=()):
    """One-line fields for the sub-labels printed inside a labelled cell.

    A cell is not always one question. The relocation schedules set "New contact
    information" as a cell heading and then print "E-mail address:" and "Phone
    number:" underneath it, each with three-quarters of the row left blank
    beside it -- two questions in one cell, and `_cell_answer_band` finds
    nothing because the space *below* the last of them is under `CELL_BAND_MIN`.

    Each such line is the same shape `_caption_right` recognises at cell level:
    a label ending in a colon with room left after it. Restricted to lines that
    are not the cell's first, because the first line is the cell's own heading
    and `_cell_answer_band` already owns the space under it.
    """
    inner = rect + (1.5, 1.5, -1.5, -1.5)
    rows = []
    for block in page.get_text("dict", clip=inner)["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if text.strip():
                rows.append((fitz.Rect(line["bbox"]), text))
    rows.sort(key=lambda pair: pair[0].y0)
    out = []
    for index, (line, text) in enumerate(rows):
        if index == 0 or not text.rstrip().endswith(":"):
            continue
        # **A sub-label is a label, not a sentence that happens to end in a
        # colon.** Schedule A's Part D closes its instruction with "...some of
        # the things you may want to include are:" and a box opened at the end
        # of it, in the middle of the government's own prose. A label is short.
        if len(text.strip()) > SUB_CAPTION_MAX_CHARS:
            continue
        # **A label with options under it is answered by ticking one**, not by
        # writing beside it. Schedule B sets "I am:" over five option marks in
        # one cell, and a box beside it offered a second way to answer the same
        # question. Schedule A's "Other -- please specify:" shares its line with
        # the mark it belongs to and has none below it, which is the difference.
        if any(mark.y0 > line.y1 - 1 and mark.y1 < rect.y1 for mark in marks):
            continue
        box = fitz.Rect(line.x1 + EDGE_CLEARANCE * 2, line.y0, inner.x1, line.y1)
        if box.width < MIN_BLANK_WIDTH:
            continue
        out.append(box)
    return out


def _cell_answer_band(page, rect):
    """The clear space under a cell's printed text, if it is worth a box.

    A labelled cell is not automatically non-writable: the relocation schedules
    set "Children's names" and the paragraph explaining them at the top of a
    215pt cell and leave the rest of it blank for the answer, and Form CA-1 p2
    does the same across nearly the whole page (README, "A labelled table cell
    can still contain writable space"). Segment the label from the answer rather
    than refusing the cell.
    """
    inner = rect + (1.5, 1.5, -1.5, -1.5)
    bottom = inner.y0
    for block in page.get_text("dict", clip=inner)["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if text.strip():
                bottom = max(bottom, fitz.Rect(line["bbox"]).y1)
    band = fitz.Rect(inner.x0, bottom + EDGE_CLEARANCE, inner.x1, inner.y1)
    if band.height < CELL_BAND_MIN or band.width < MIN_BLANK_WIDTH:
        return None
    return band


def dollar_twin_slots(page, boxes):
    """An amount slot for a printed `$` the page gives no rule or cell.

    Guide 4 says a `$` the government prints is a place a figure is typed, and
    `check_dollar_slots` asks the question directly. Manitoba almost always
    draws the rule beside it -- but not always: Provincial Court Form 4 page 5
    sets its expense rows as "Parking  $______" and then closes the block with
    "SUBTOTAL  $" and no rule at all, so the one figure that is the sum of the
    column had nowhere to go.

    The remedy is the one guide 9.6 gives for a caption with no writing area:
    **copy the twin.** Every other `$` on the page is the same column, so the
    slot takes its left edge from its own `$` and its right edge from the
    nearest `$` that does have a box. Nothing is invented; a page with no
    twin gets nothing.
    """
    dollars = []
    for text, char_boxes, _sizes in line_chars(page):
        for index, char in enumerate(text):
            if char == "$":
                dollars.append(char_boxes[index])
    if len(dollars) < 2:
        return []
    served, orphans = [], []
    for glyph in dollars:
        probe = fitz.Rect(glyph.x1, glyph.y0 - 2, glyph.x1 + 6, glyph.y1 + 2)
        if any(probe.intersects(rect) for rect, _kind in boxes):
            served.append(glyph)
        else:
            orphans.append(glyph)
    out = []
    for glyph in orphans:
        twin = None
        for other in served:
            if twin is None or abs(other.y0 - glyph.y0) < abs(twin.y0 - glyph.y0):
                twin = other
        if twin is None:
            continue
        right = None
        for rect, _kind in boxes:
            if rect.x0 >= twin.x1 - 1 and abs(rect.y0 - twin.y0) < 6:
                right = rect.x1 if right is None else max(right, rect.x1)
        if right is None or right - glyph.x1 < MIN_BLANK_WIDTH:
            continue
        height = glyph.height * LINE_RATIO
        out.append(fitz.Rect(glyph.x1 + 1.5, glyph.y1 - height, right, glyph.y1))
    return out


# Two boxes in the same column may not overlap vertically at all: the viewer
# draws a bordered control inside each, so even a fraction of a point puts one
# border through the other. Applied after everything else has decided where the
# boxes go, so it only ever trims.
STACK_CLEARANCE = 0.4


def cap_stacking(boxes):
    """Trim a box's bottom off the top of the box below it in its column."""
    out = []
    for rect, kind in boxes:
        if kind == "CheckBox":
            out.append((rect, kind))
            continue
        floor = rect.y1
        for other, other_kind in boxes:
            if other is rect or other_kind == "CheckBox":
                continue
            if other.y0 <= rect.y0 + 0.5 or other.y0 >= rect.y1:
                continue
            if other.x1 <= rect.x0 + 1 or other.x0 >= rect.x1 - 1:
                continue  # a different column
            floor = min(floor, other.y0 - STACK_CLEARANCE)
        if floor - rect.y0 < 6:
            out.append((rect, kind))
            continue
        out.append((fitz.Rect(rect.x0, rect.y0, rect.x1, floor), kind))
    return out


# Boxes the page gives no anchor for at all, measured off it by hand during the
# page-by-page review and recorded here rather than produced by a rule.
#
# Saskatchewan's `MANUAL_FIELDS` is the precedent and its README argues the case:
# a caption with clear space beside it and no rule, cell or rectangle is a real
# shape, but a sweep for it "produced one false positive and missed the
# occupation case entirely", and "a mis-tuned auto-placer that adds fields
# set-wide is a worse outcome than one missing box". Measured here across all
# 140 Manitoba forms, the same sweep offers 24 candidates of which eight are
# wrong -- "THIS COURT ORDERS:" and "For non-resident and deemed residents:"
# introduce the text *below* them, not an answer beside them, and two are total
# rows that already have their amount cells. So the rule is not shipped and the
# instances the review actually found are named.
#
# {docId: [(page, Rect, kind), ...]}
MANUAL_FIELDS = {
    # The relocation schedules close Part G with a signature rule, the date, and
    # then "Name (please print):" with the rest of the line blank and nothing
    # printed below it. The signature rule correctly gets no box; the printed
    # name is a field, and there is no rule, cell or run of underscores under it.
    "MBREL_A": [(5, fitz.Rect(191.5, 285.7, 542.0, 297.4), "TextField")],
    "MBREL_B": [(2, fitz.Rect(191.1, 432.1, 524.7, 443.8), "TextField")],
    "MBREL_C": [(3, fitz.Rect(191.5, 187.3, 474.9, 199.0), "TextField")],
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
        if text:
            # The mark guard applies to the *band* -- a cell full of options is
            # not one big writing space -- but not to the sub-labels, which are
            # individual lines and are checked against the marks themselves.
            # Schedule A's Part F prints three options and then "Other -- please
            # specify:", and skipping the whole cell left the filer nowhere to
            # say what "other" was.
            has_mark = any(mark.intersects(rect) for mark in marks)
            # **A cell with a big clear band under its label is an answer cell,
            # whatever else it looks like.** Asked after the heading-row test,
            # this never fires on the cell that needs it most: the relocation
            # schedules set "Proposal:" bold at the top of a 190pt cell, bold is
            # what `heading_row_tops` reads as a section title, and the whole
            # page came out with no field on it. A genuine heading fills its own
            # row, so its band is under `CELL_BAND_MIN` and it still gets
            # nothing.
            band = None if has_mark else _cell_answer_band(page, rect)
            # A sub-label whose row already carries an empty cell is answered
            # in that cell, not beside itself -- the same rule the cell-level
            # caption follows. Schedule B's e-mail row keeps its own trailing
            # cell where Schedule A's does not, and without this the filer got
            # two boxes for one address.
            subs = [] if _row_has_empty_neighbour(rect, cells) else [
                b for b in _cell_sub_captions(page, rect, marks)
                if not any(mark.intersects(b) for mark in marks)]
            if band is not None or subs:
                if band is not None:
                    boxes.append((band, "TextArea"))
                for sub in subs:
                    boxes.append((sub, "TextField"))
                filled_cells.append(rect)
                continue
        if text and caption is None:
            continue  # the government already wrote this cell's name (guide 9.3)
        if caption is not None and _row_has_empty_neighbour(rect, cells):
            continue  # a row label; its answer is the empty cell beside it
        if any(mark.intersects(rect) for mark in marks):
            continue  # a tick's own cell -- the printed checkbox is the field
        kind = kinds[(round(rect.x0, 0), round(rect.x1, 0))]
        if kind == "reference" and caption is None:
            continue  # a blank in the government's own reference grid
        # Shading marks a heading row -- but it also marks totals rows and some
        # amount rows, and neither of those is a heading. A row the form calls a
        # total, and any cell the form prints a `$` in, are places the filer
        # writes a figure: a heading never carries a `$`.
        if (dollar is None and caption is None
                and round(rect.y0) in heading_rows):
            continue  # frame space beside a bold section title
        if (dollar is None and caption is not None
                and round(rect.y0) in heading_rows
                and is_shaded(pix, page, fitz.Rect(
                    caption + EDGE_CLEARANCE * 2, rect.y0 + 1.5,
                    rect.x1 - 1.5, rect.y1 - 1.5))):
            # A bold label with room to answer beside it is a question, not a
            # heading. `heading_row_tops` reads bold as a section title, and the
            # relocation schedules set "Proposed date of relocation" bold with
            # three-quarters of its row blank -- so the one date the form exists
            # to record had nowhere to go. A real section heading here is
            # shaded as well as bold ("Part A —", "Part B —"), and this one is
            # not -- measured on **the space the answer will occupy**, not on
            # the cell, because `is_shaded` averages what it is given and a cell
            # carrying its own bold question averages dark from its own type.
            continue
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
        if caption is not None:
            # The answer goes after a label printed on one line, so it is one
            # line -- the same reasoning that makes a `$` cell always a
            # TextField. Measured against the cell instead, Schedule A p1's
            # 20pt "Name:" row came out at 1.93 "lines" and every field in
            # Part A was a resizable area for a single name.
            kind = "TextField"
        elif _row_is_one_line(page, rect, cells):
            kind = "TextField"
        else:
            lines = box.height / (SCALE * 6.0)
            kind = "TextArea" if lines > TEXTAREA_LINES else "TextField"
        boxes.append((box, kind))
        filled_cells.append(rect)

    kept = []
    for rect, rule_y, size in underscore_blanks(page):
        if any(cell.intersects(rect) and cell.get_area() > rect.get_area()
               for cell in filled_cells):
            continue
        kept.append((rect, rule_y, size))

    # Printed writing rules, which are the bulk of these forms. A rule inside a
    # cell that already got a field is that field seen twice; a rule inside one
    # that did *not* is a real blank, so the test is against the cells actually
    # filled rather than against every cell on the page.
    #
    # **An underscore run is a ceiling too.** The two vocabularies each cap
    # themselves against their own kind and neither knew about the other, so a
    # drawn rule seated under an underscore blank ran up into it: Form AA-2's
    # jurat sets "of ___________ in the province of" as underscores and the line
    # under it as a drawn rule, 0.2pt apart.
    ceilings = list(underline_keys(page))
    ceilings += [(rule_y, rect.x0, rect.x1) for rect, rule_y, _size in kept]
    for box in seat_rules(printed_rules(page, cells), ceilings):
        if any(cell.intersects(box) and cell.get_area() > box.get_area()
               for cell in filled_cells):
            continue
        boxes.append((box, "TextField"))

    # An underscore blank hangs upward from its own run and is capped by the run
    # above it, exactly as `seat_rules` caps a drawn rule -- the underscore path
    # simply never had the cap, because the financial batch has 3 runs in 31
    # pages and none of them stacked. Form 70T p1 sets its five-line
    # "circumstances necessitating this request" block on a 14.0pt pitch against
    # a 14.3pt box, so every line overlapped the one above it and the block
    # rendered as a crush of borders.
    for rect, rule_y, size in kept:
        bottom = rule_y - RULE_CLEARANCE
        height = size * LINE_RATIO
        above = [other_y for other, other_y, _s in kept
                 if other_y < rule_y - 1 and other.x1 > rect.x0 and other.x0 < rect.x1]
        if above:
            height = min(height, rule_y - max(above) - STACK_GAP)
        if height < 6:
            continue
        boxes.append((fitz.Rect(rect.x0, bottom - height, rect.x1, bottom),
                      "TextField"))

    # **A band is placed against the boxes that will survive, not against every
    # box found.** A writing area is refused where something already occupies it,
    # and a signature rule occupies its space right up until `build` deletes it --
    # so Form 70Q p1's documentary-evidence area was placed by
    # `narrative_prompt_bands`, vetoed by the lawyer's signature rule sitting in
    # it, and the rule then dropped, leaving neither. Forms 70G p8 and 70L p1 lose
    # their "The Applicant's Lawyer is:" and "Consented to:" areas the same way.
    captions = signature_captions(page)
    brackets = jurat_brackets(page)
    lines = name_notes(page)

    def surviving():
        """What will still be on the page after `build` drops the signatures."""
        return [rect for rect, _kind
                in drop_signature_rules(boxes, captions, brackets, lines)[0]]

    def every():
        """Everything found so far, signature rules included -- a band stops at a
        signature rule even though it may not be vetoed by one."""
        return [rect for rect, _kind in boxes]

    for band in caption_below_blanks(page, surviving()):
        boxes.append((band, "TextField"))
    for band in style_of_cause_bands(page, surviving()):
        boxes.append((band, "TextField"))
    for band in writing_area_bands(page, surviving(), cells, every()):
        boxes.append((band, "TextArea"))
    for band in narrative_prompt_bands(page, surviving(), cells, every()):
        boxes.append((band, "TextArea"))
    for slot in dollar_twin_slots(page, boxes):
        boxes.append((slot, "TextField"))
    return cap_stacking(clear_of_type(page, dedupe(boxes)))


def dedupe(boxes, tolerance=2.0):
    """Drop a box that repeats one already found by another detector.

    Two vocabularies can describe the same blank -- an underscore run set on top
    of a drawn rule, which Form 70U does in its "TOTAL: $______" cells -- and two
    stacked controls in the viewer read as one control with a doubled border.

    **The two need not agree on the extent, and then the longer one wins.** Word
    often draws the rule along only part of the run: Form 70E p6 sets "Dated at
    ______, this ___ day of ______, ___." with a rule over the right-hand end of
    each blank, so the rule says 16.7pt where the run says 105pt. Keeping the
    fragment leaves a box right-aligned inside its own blank with most of the
    line unreachable, so a box wholly inside another of the same kind is dropped
    however it was found. (Only visible since `_is_underline` stopped counting
    `_` as type, which is what hands these rules back as writing lines at all.)
    """
    def one_blank(a, b):
        """Do these two boxes describe the same printed blank?

        Same line, and really overlapping rather than merely adjacent -- "this
        ___ day of ______" is two blanks that touch, and must stay two.
        """
        if a.y1 <= b.y0 + tolerance or b.y1 <= a.y0 + tolerance:
            return False
        shared = min(a.x1, b.x1) - max(a.x0, b.x0)
        return shared > 0.5 * min(a.width, b.width)

    # Largest first, so a pair is anchored on the box that spans most of the
    # blank; the survivors go back into reading order, which numbers the fields.
    order = sorted(range(len(boxes)), key=lambda i: -boxes[i][0].get_area())
    merged = {}
    for index in order:
        rect, kind = boxes[index]
        host = next((j for j in merged
                     if boxes[j][1] == kind and one_blank(merged[j], rect)), None)
        if host is None:
            merged[index] = fitz.Rect(rect)
            continue
        # The two detectors disagree about where the blank ends -- Form 70DD p2's
        # "scheduled for ______," has the run starting 63pt left of the rule and
        # the rule ending 4.5pt right of the run -- so take everything either of
        # them found rather than picking one and losing the difference.
        merged[host] |= rect
    return [(merged[i], boxes[i][1]) for i in sorted(merged)]


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
        # **Keep the trim even when it makes the box narrow.** Refusing it at
        # `MIN_BLANK_WIDTH` does not leave the blank wide -- it leaves the box
        # *on the type*, which is the thing this function exists to prevent, and
        # `check_edge_clearance` then fails it. Forms CFS-22A/22B and AA-10/11
        # print "20___" and "___(time)___" as drawn rules butting straight up
        # against the "20", so the trim costs 1.3pt out of 16.5 and the whole
        # trim was being thrown away. The floor is what a box has to keep to
        # still be worth having, not what a blank has to be to earn one.
        if right - left >= MIN_TRIMMED_WIDTH:
            rect = fitz.Rect(left, rect.y0, right, rect.y1)
        out.append((rect, kind))
    return out


def drop_signature_rules(boxes, captions, brackets, lines=()):
    """Guide 5: never put a typeable box on somebody's signature line.

    Two ways a Manitoba rule is a signature line.

    **A caption under it**, which claims the **nearest** rule above it rather
    than every rule in the window -- the jurat sets a date blank one line above
    "A Commissioner for Oaths in and for the Province of Manitoba", just inside
    the window, so a flat rule deleted the date along with the signature line.

    **A jurat bracket column to its left**, which is the case a caption cannot
    reach: Form 70D p1 sets the deponent's signature rule to the right of the
    jurat's ")" column with no caption anywhere near it.

    `lines` are the page's `(full name)` notes, and a caption may not reach back
    over one. Manitoba's style of cause stacks that note between the party's
    blank and the role word, so once a bare role word counted as a signature
    caption (`MB_PARTY_CAPTION`) the role reached over the note and deleted the
    party's own name blank -- Form 70Z p2 loses both parties that way.
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
            # Compared on the two captions' **tops**, not on the intervening
            # line's bottom: Manitoba sets the style of cause's "(full name)"
            # note and its role word 0.2pt apart vertically on Form 70Z p2, so a
            # test on `other.y1 < caption.y0` never fires.
            if any(rect.y1 + 0.5 < other.y0 and other.y0 < caption.y0 - 1.0
                   and other.x1 > rect.x0 and other.x0 < rect.x1
                   for other in lines):
                continue  # something else is printed between them
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
                                jurat_brackets(page), name_notes(page))[1]


def hand_finished(doc_id):
    """Keys in a promoted map that a build cannot reproduce.

    Guide §1: never rebuild a form that already carries binds or hand-placed
    fields. `--promote` is an `os.replace`, so promoting over one silently
    destroys them -- on the financial batch that would be 20 binds, plus the
    24 total-row cells and the stray-area deletions `repair_mb_forms.py` applied
    in place. Returns the reasons, or an empty list if it is safe to overwrite.

    **A bind is the signal; a checkbox is not.** Checkboxes were the tell while
    only `repair_mb_forms.py` could place them, but the builder emits them now
    (see `checkboxes`), so counting them made every form block its own second
    promote -- silently, since a refusal here is not an error. Binds are added
    after promotion by `rebind_mb_forms.py` and a rebuild drops them, which is
    exactly the loss this guards; all five hand-finished forms carry at least
    one.
    """
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    if not os.path.exists(path):
        return []
    fields = json.load(open(path))["staticFields"]
    bound = sum(1 for f in fields if f.get("bind"))
    return ["%d bind(s)" % bound] if bound else []


def is_fillable(source):
    """Does this source carry the government's own field rectangles?

    Batches 1 and 2 are static Word-derived PDFs with no widget layer, which is
    why every box in them is read off a printed anchor. Batch 3 is not uniform:
    the ISO set, the two protection-order applications and the three federal
    notices are AcroForm (three of the ISO forms are XFA on top of that), and
    where the form declares its own rectangles, detecting anchors instead is
    strictly worse -- ISO Form A.1 offers 112 declared widgets against the 0
    rules and 25 underscore runs `page_boxes` finds on it.

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

    `bc_pipeline.extract` is the same code BC's Provincial forms take, including
    its geometric signature rule -- a short box printed directly above a
    "Signature..." caption gets no control, which is the pipeline's rule
    everywhere and the one thing a widget list will not tell you.

    **The background is flattened, not copied.** This is the one respect in
    which these templates differ from every other Manitoba one: leaving the
    widget layer in place would put the government's own AcroForm fields
    underneath our overlay, and the viewer would render two controls per blank.
    `flatten_background` deletes the widget annotations and the /AcroForm entry;
    the printed rules and captions live in the page content stream and are
    untouched, which the page-count assertion below and the review's own
    source-versus-overlay comparison both check.
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


def build(src, promote=False, force=False):
    doc_id = src["docId"]
    blockers = hand_finished(doc_id) if promote else []
    if blockers and not force:
        print("%-13s SKIPPED promote: promoted map carries %s (use --force to "
              "overwrite, or repair it in place)" % (doc_id, ", ".join(blockers)))
        promote = False
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    if is_fillable(source):
        return build_from_widgets(src, doc_id, source, promote)
    doc = fitz.open(source)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    fields, skipped = [], 0
    index = 0
    for number, page in enumerate(doc, start=1):
        kept, dropped = drop_signature_rules(
            page_boxes(page), signature_captions(page), jurat_brackets(page),
            name_notes(page))
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
            "geometry": problems, "overlap": overlaps, "source": "anchors"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=None)
    parser.add_argument("--category", default=None)
    parser.add_argument("--all", action="store_true",
                        help="include categories not yet shipped")
    parser.add_argument("--promote", action="store_true")
    parser.add_argument("--force", action="store_true",
                        help="promote even over a hand-finished map (see hand_finished)")
    args = parser.parse_args()

    sources = all_sources() if args.all else shipped_sources()
    if args.only:
        sources = [s for s in all_sources() if s["docId"] in set(args.only)]
    if args.category:
        sources = [s for s in sources if s["shortCategory"] == args.category]

    report = [build(src, args.promote, args.force) for src in sources]
    total = sum(r["fields"] for r in report)
    bad = [r["docId"] for r in report if r["geometry"]]
    print("\n%d forms, %d fields, %d with geometry problems: %s"
          % (len(report), total, len(bad), ", ".join(bad) or "none"))
    with open(os.path.join(STAGE, "build_report.json"), "w") as fh:
        json.dump(report, fh, indent=1)


if __name__ == "__main__":
    main()

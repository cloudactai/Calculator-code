"""Nova Scotia's printed-blank vocabulary, and the detectors for it.

Nova Scotia does not print its blanks the way any other province in this
catalogue does. Saskatchewan sets a blank as a run of underscores, Manitoba
draws it as a filled rectangle about 0.8 pt tall, BC and Ontario hand over a
widget rectangle. Nova Scotia writes an **instruction in square brackets** where
the content goes:

    Between: [copy standard heading]
    I, [name], of [community], Nova Scotia, make oath and say
    on [date] the respondent [describe] ...

Measured over all 84 rendered forms: **1,182 bracket tokens** (208 distinct)
against 418 underscore runs and 465 tick glyphs. Form 59.09, the Petition for
Divorce, prints **no underscore at all** and only five pieces of line art -- every
one of its blanks is a bracket token. A detector tuned on Saskatchewan or
Manitoba finds almost nothing here.

## Which brackets are blanks, and which are not

Most are blanks. Three kinds are not, and all three occur in bulk, so getting
this wrong either buries the form in boxes nobody can type into or drops real
blanks:

* **A slash means a strike-out choice, not a blank** -- 231 of them, 90
  distinct: `[child/children]`, `[a.m./p.m.]`, `[sworn to/affirmed]`,
  `[city/town]`, `[applicant/petitioner]`, `[I/we]`. The filer deletes the word
  that does not apply; there is nothing to type. This single rule accounts for
  every strike-out in the batch.

* **A directive about the document is not content.** `[copy standard heading]`
  (71), `[choose one]` (14), `[may delete the one that does not apply]` (7),
  `[delete if not applicable]` (6), `[if applicable]` (6). These tell the drafter
  what to do with the paragraph, not what to write in a gap.

  `[insert address]` is a blank and `[copy standard heading]` is not, which is
  the distinction worth stating: *insert* names the thing to supply, *copy*
  and *delete* act on text that is already there.

* **`[or]` (55) and `[s]` (12) are neither.** `[or]` joins two alternative
  paragraphs; `[s]` is the plural marker in "the respondent[s]". Both are part
  of the printed sentence.

Everything else is treated as a blank -- `[name]` (336), `[date]` (189),
`[amount]` (24), `[give specifics]`, `[describe]`, `[provide details]`,
`[community]`, `[refer to section(s) relied on]` and the rest of the long tail.
That is deliberately the default: a token the court printed to mark a gap is a
gap, and the exceptions above are enumerable while the blanks are not.

## The tokens stay printed

They are **not** redacted out of the background. BC's batch 3 recorded why:
MuPDF's redaction drops the whole text-showing operation, and clearing a caption
on CFCSA Form 5 took the sentence around it with it. Here
`[copy standard heading]` shares its text operation with the word "Between:", so
redacting it would take the word too. The token stays on the page under its box,
exactly as a Saskatchewan underscore run does.
"""
import re

import fitz

# A bracket token, kept short enough that a bracketed *sentence* of instructions
# is not mistaken for a blank.
TOKEN = re.compile(r"\[([^\[\]\n]{1,70})\]")

# Directives: they act on text already on the page rather than name content.
# What separates a directive from a blank is the **verb**, not the punctuation.
# "provide", "give", "state", "describe", "show", "set out", "list" ask for
# content; "copy", "delete", "add", "complete", "choose", "repeat" act on text
# that is already on the page. An earlier version rejected any bracket ending in
# a full stop, which threw away about twenty real blanks --
# "[give particulars of all debts owing to you.]",
# "[provide facts in support here.]" -- for the sake of catching two notes.
DIRECTIVE = re.compile(
    r"^(copy|delete|choose|omit|strike|repeat|use|add|complete|"
    r"if\b|as applicable|may delete|include|check|tick|"
    r"note\b|see\b|attach)\b", re.I)


# Not content in their own right.
NOT_BLANK = {"or", "and", "s", "es", "ies", "etc"}


def is_blank_token(text):
    """Is this bracket token a gap to type in?"""
    inner = re.sub(r"\s+", " ", text).strip()
    if not inner or len(inner) < 2:
        return False
    low = inner.lower()
    if "/" in inner:
        return False                      # a strike-out choice
    if low in NOT_BLANK:
        return False
    if DIRECTIVE.match(low):
        return False
    return True


def _spans(page):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                yield span


def text_column(page, margin=54.0):
    """The page's writing column, used to extend a trailing blank rightwards."""
    return page.rect.x0 + margin, page.rect.x1 - margin


def _lines(page):
    """Each text line as (joined text, bbox). Tokens are matched per **line**,
    not per span.

    Inline formatting splits a span mid-token: Nova Scotia italicises the
    statute name, so "[refer to section(s) in subsection 22(2) of the *Act*]"
    arrives as three spans -- "[refer ... of the ", "Act", "]" -- and a per-span
    regex never sees a complete bracket. Rule 60A cites the Act in italics on
    almost every form, so this silently dropped a blank per citation.
    """
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            if not spans:
                continue
            yield "".join(s["text"] for s in spans), fitz.Rect(line["bbox"])


def token_boxes(page, min_width=26.0):
    """Every bracket-token blank on the page, as (rect, token_text).

    A token with nothing printed after it on its own line is extended to the
    right edge of the text column: that is where the writing space actually is,
    and a box the width of the word "[name]" is too small to type a name into.
    A token with text after it keeps its own extent, so an inline blank never
    runs over the words that follow it.
    """
    left_margin, right_margin = text_column(page)
    words = page.get_text("words")
    out, taken = [], []
    for text, bbox in _lines(page):
        for match in TOKEN.finditer(text):
            raw = match.group(0)
            if not is_blank_token(match.group(1)):
                continue
            found = page.search_for(raw, clip=bbox)
            for rect in found or []:
                if any(rect.intersects(t) and (rect & t).get_area() > 1.0
                       for t in taken):
                    continue
                taken.append(fitz.Rect(rect))
                y0, y1 = rect.y0, rect.y1
                # Anything printed to the right, on this line, that is not the
                # token itself.
                after = [w for w in words
                         if w[0] >= rect.x1 - 0.5
                         and min(y1, w[3]) - max(y0, w[1]) > 0.4 * (y1 - y0)]
                if not after:
                    right = max(rect.x1, min(right_margin, page.rect.x1 - 18.0))
                else:
                    right = max(rect.x1, min(w[0] for w in after) - 2.0)
                if right - rect.x0 < min_width:
                    right = rect.x0 + min_width
                out.append((fitz.Rect(rect.x0, y0, right, y1), raw))
    return out


TICKS = "☐☑□■❑❐"


def tick_boxes(page):
    """Every printed option glyph, as a rect on the glyph's own ink."""
    out = []
    for span in _spans(page):
        for index, char in enumerate(span["text"]):
            if char not in TICKS:
                continue
            found = page.search_for(char, clip=fitz.Rect(span["bbox"]))
            for rect in found or []:
                # A tick glyph's character cell is taller than the square it
                # draws; square it off on the smaller dimension so the control
                # does not overhang the printed box.
                side = min(rect.width, rect.height)
                out.append(fitz.Rect(rect.x0, rect.y0, rect.x0 + side,
                                     rect.y0 + side))
    return out


UNDERSCORE = re.compile(r"_{3,}")


def underscore_boxes(page, min_width=12.0):
    """Every underscore-run blank, as a rect on the run's own printed ink."""
    out = []
    for span in _spans(page):
        for match in UNDERSCORE.finditer(span["text"]):
            run = span["text"][match.start():match.end()]
            for rect in page.search_for(run, clip=fitz.Rect(span["bbox"])) or []:
                if rect.width >= min_width:
                    out.append(rect)
    return out


# --- Ruled table cells -------------------------------------------------------
#
# The fourth vocabulary, and the one the first build of this province missed
# entirely. FD3 (Statement of Income) sets its whole income table as a ruled
# grid with empty AMOUNT and COMMENTS cells and **no token, no underscore and no
# tick anywhere in it**: 36 blanks on the single most important form for a
# financial prefill, and the first build put a box in none of them. FD4, FD6 and
# FD7 are the same shape.
#
# A shaded row is NOT refused. Manitoba's builder learned that the expensive
# way: a grey "heading row" rule ate Form 70D.5's TOTAL and NET rows, 24 empty
# cells, because Manitoba shades its totals the same grey as its headings. Nova
# Scotia shades SUB TOTAL and TOTAL MONTHLY INCOME identically, and those are
# cells a filer types in.

CELL_MIN_W = 24.0
CELL_MIN_H = 9.0
CELL_MAX_H = 46.0


def _grid(page, geom):
    """Merged horizontal and vertical rules, as (position, from, to) lists."""
    return (geom.hrules(page, min_len=24.0), geom.vrules(page, min_len=8.0))


CURRENCY = set("$¢")


def cell_boxes(page, geom, pad=1.5, cover=0.7):
    """Every empty cell of a ruled table, as a rect.

    A cell counts as empty when no glyph's centre falls inside it, so label and
    heading cells exclude themselves without a rule about which column is which.

    **Each row's cells are cut by the verticals that actually span that row**,
    not by every vertical on the page. Taking consecutive x-positions from a
    page-wide list looked right and was wrong: PEI's Form 70I(A) carries a short
    rule at x = 387 belonging to another table, which fell inside the AMOUNT
    column and split it in two -- and because that rule does not span the row,
    the four-borders test then rejected *both* halves. The whole AMOUNT column
    of a Statement of Income got no boxes while COMMENTS beside it got all of
    them.

    A cell holding nothing but a currency symbol is still a blank: the form
    prints "$" and expects the figure beside it, so the box starts after the
    symbol rather than the cell being called occupied.
    """
    hrules, vrules = _grid(page, geom)
    rows = sorted({round(r[0], 1) for r in hrules})
    if len(rows) < 2:
        return []
    glyphs = [(w[0], w[1], w[2], w[3], w[4]) for w in page.get_text("words")]
    out = []
    for top, bottom in zip(rows, rows[1:]):
        height = bottom - top
        if not (CELL_MIN_H <= height <= CELL_MAX_H):
            continue
        need_v = height * cover
        spanning = sorted({round(v[0], 1) for v in vrules
                           if min(v[2], bottom) - max(v[1], top) >= need_v})
        if len(spanning) < 2:
            continue
        for left, right in zip(spanning, spanning[1:]):
            if right - left < CELL_MIN_W:
                continue
            if not (_hrule_spans(hrules, top, left, right, cover)
                    and _hrule_spans(hrules, bottom, left, right, cover)):
                continue
            inside = [g for g in glyphs
                      if left < (g[0] + g[2]) / 2 < right
                      and top < (g[1] + g[3]) / 2 < bottom]
            if inside and any(g[4].strip() not in CURRENCY for g in inside):
                continue
            start_x = left
            if inside:
                start_x = max(g[2] for g in inside) + 1.0
            if right - start_x < CELL_MIN_W:
                continue
            out.append(fitz.Rect(start_x + pad, top + pad,
                                 right - pad, bottom - pad))
    return out


def _hrule_spans(hrules, y, left, right, cover, tol=2.0):
    need = (right - left) * cover
    return any(abs(r[0] - y) <= tol
               and min(r[2], right) - max(r[1], left) >= need
               for r in hrules)

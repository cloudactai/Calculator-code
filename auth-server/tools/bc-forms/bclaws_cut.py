"""Cut one enacted form out of a King's Printer consolidation.

A consolidation sets its schedule of forms as continuous copy: Form 1 ends
half way down page 45 and Form 2 starts underneath it on the same page. Taking
a page range therefore ships the neighbouring form as part of this one, which
on a court form is a filing hazard, not a cosmetic one. So the cut is made at
the forms' own enacting headings and the pages are re-laid:

1. Find every enacting heading in the schedule window. It is the centred
   "FORM n" line; the form's *own* printed title ("FORM 5" set at the left
   margin under "WARRANT") is not centred on the page and never wins, because
   only the first heading found for a given number is kept.
2. The form runs from its heading to the next heading, or to the last thing
   printed above the footer rule if it is the last form.
3. Each source page contributes the slice of its content band that falls in
   that range. Bands are packed onto fresh Letter pages at 1:1 — no scaling —
   so coordinates stay in points and the running head, the rule under it, the
   page number and the "Consolidation current to" line are all left behind.

Bands from consecutive source pages are continuous copy, so they are butted
together with no gap; a new output page starts only when the next band will
not fit.
"""
import re

import fitz

# The consolidation's furniture: a full-width rule under the running head and
# another above the page number. Everything between them is the form.
HEADER_RULE = 104.8
FOOTER_RULE = 719.8
RULE_TOLERANCE = 4.0
RULE_MIN_WIDTH = 300.0
RULE_INSET = 2.0

PAGE = fitz.paper_rect("letter")
MARGIN_TOP = 60.0
MARGIN_BOTTOM = 54.0
HEADING_PAD = 8.0

CENTRED = 40.0
HEADING = re.compile(r"^FORM\s+(\d+(?:\.\d+)?)\s*$")


def content_band(page):
    """(top, bottom) of the printed form area, read off the two full-width rules."""
    rules = sorted(d["rect"].y0 for d in page.get_drawings()
                   if d["rect"].height < 2 and d["rect"].width > RULE_MIN_WIDTH)
    top = next((y for y in rules if abs(y - HEADER_RULE) < RULE_TOLERANCE), HEADER_RULE)
    bottom = next((y for y in reversed(rules)
                   if abs(y - FOOTER_RULE) < RULE_TOLERANCE), FOOTER_RULE)
    # Inside the rules, not on them: a form continued onto the next page joins the
    # page before it, and the header rule would print across the join as if the
    # form itself drew it.
    return top + RULE_INSET, bottom - RULE_INSET


def headings(doc, first, last):
    """[(page_index, y, form_no)] for each enacting heading, in document order."""
    found, seen = [], set()
    for index in range(first - 1, last):
        page = doc[index]
        centre = page.rect.width / 2
        for block in page.get_text("blocks"):
            x0, y0, x1, _y1, text = block[0], block[1], block[2], block[3], block[4]
            match = HEADING.match(text.strip().split("\n")[0].strip())
            if not match or abs((x0 + x1) / 2 - centre) > CENTRED:
                continue
            if match.group(1) in seen:
                continue
            seen.add(match.group(1))
            found.append((index, y0, match.group(1)))
    return sorted(found)


def last_ink(page, band):
    """Bottom of the last thing printed inside the band — text or line art."""
    top, bottom = band
    lows = [b[3] for b in page.get_text("blocks") if top <= b[1] < bottom]
    lows += [d["rect"].y1 for d in page.get_drawings()
             if top <= d["rect"].y0 < bottom]
    return min(max(lows), bottom) if lows else top


def slices(doc, first, last, form_no):
    """[(page_index, y0, y1)] — the bands of the consolidation this form occupies."""
    marks = headings(doc, first, last)
    numbers = [m[2] for m in marks]
    if form_no not in numbers:
        raise LookupError("no enacting heading for FORM %s in pages %d-%d"
                          % (form_no, first, last))
    start = marks[numbers.index(form_no)]
    after = marks[numbers.index(form_no) + 1:]
    end = after[0] if after else None

    out = []
    last_index = end[0] if end else last - 1
    for index in range(start[0], last_index + 1):
        page = doc[index]
        top, bottom = content_band(page)
        if index == start[0]:
            top = max(top, start[1] - HEADING_PAD)
        if end and index == end[0]:
            bottom = min(bottom, end[1] - HEADING_PAD)
        elif index == last_index:
            bottom = min(bottom, last_ink(page, (top, bottom)) + HEADING_PAD)
        if bottom - top > 1:
            out.append((index, top, bottom))
    return out


def trimmed(doc, index, y0, y1):
    """A one-page copy of the source page with everything outside the band erased.

    `show_pdf_page`'s clip stops the neighbouring form and the running head from
    *printing*, but their paths stay in the page and `get_drawings()` still reports
    them — a 42 pt header fill reads to the cell detector as an empty ruled cell,
    and the overlay grows a field where the form has nothing at all. Redacting the
    strips (line art included) removes them for real.
    """
    scratch = fitz.open()
    scratch.insert_pdf(doc, from_page=index, to_page=index)
    page = scratch[0]
    width, height = page.rect.width, page.rect.height
    for strip in (fitz.Rect(0, 0, width, y0), fitz.Rect(0, y1, width, height)):
        if strip.height > 0:
            page.add_redact_annot(strip)
    page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
    return scratch


def cut(reg_path, form_no, window, dest):
    """Write the form as its own Letter-size PDF. Returns the page count."""
    doc = fitz.open(reg_path)
    out = fitz.open()
    usable = PAGE.height - MARGIN_TOP - MARGIN_BOTTOM
    page, cursor = None, 0.0
    for index, y0, y1 in slices(doc, window[0], window[1], form_no):
        height = y1 - y0
        if page is None or cursor + height > usable + 0.5:
            page = out.new_page(width=PAGE.width, height=PAGE.height)
            cursor = 0.0
        scratch = trimmed(doc, index, y0, y1)
        target = fitz.Rect(0, MARGIN_TOP + cursor, PAGE.width, MARGIN_TOP + cursor + height)
        clip = fitz.Rect(0, y0, scratch[0].rect.width, y1)
        page.show_pdf_page(target, scratch, 0, clip=clip)
        scratch.close()
        cursor += height
    out.save(dest, garbage=4, deflate=True, clean=True)
    pages = out.page_count
    out.close()
    doc.close()
    return pages

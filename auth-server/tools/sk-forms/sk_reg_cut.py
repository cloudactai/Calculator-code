"""Cut one enacted form out of a Saskatchewan King's Printer consolidation.

Why this exists at all, when the other 56 Saskatchewan forms are downloaded whole:
the King's Printer publishes each Adoption Regulations form as its own product on
the publications site, but **those PDFs have no usable text layer**. They are page
extracts whose fonts arrive with no ToUnicode map, so `get_text()` on Form A-1
returns the running head and nothing else, and on Form C-5 returns mojibake
(`%`, `#`, `!!!!` for the underscore runs). The Saskatchewan builder reads every
box off a printed anchor -- an underscore run, a stroked square, a ruled cell --
so a source with no text layer yields an empty form. The consolidation of the same
regulation carries a clean text layer for the identical pages, so it is the source
and the forms are cut out of it. (BC hit the mirror image of this in batch 3, where
the *consolidation's* appendix images were the broken ones and the standalone PDFs
were clean; `bc-forms/bclaws_cut.py` is this module's ancestor.)

A consolidation sets its schedule as continuous copy -- Form C-1 starts half way
down the page Form B ends on -- so a page range would ship the neighbouring form
as part of this one. On a court form that is a filing hazard, not a cosmetic one.
The cut is therefore made at the forms' own enacting headings and the pages are
re-laid:

1. Find every centred "FORM x" heading in the appendix window, including the
   headings of *repealed* forms. A repealed form is never emitted, but its heading
   is what bounds the bottom of the form printed above it -- Form B's repeal note
   sits between Form A-3 and Form C-1 -- so dropping it early would glue the two
   together.
2. The form runs from its heading to the next heading, or to the last thing
   printed above the footer if it is the last form in the window.
3. Each source page contributes the slice of its content band that falls in that
   range. Bands are packed onto fresh Letter pages at 1:1 -- no scaling -- so
   coordinates stay in points, and the page number and running head are left
   behind.

Bands from consecutive source pages are continuous copy, so they are butted
together with no gap; a new output page starts only when the next band will not fit.
"""
import re

import fitz

# This consolidation's furniture is *text*, not rules: the page number sits at
# y 36-47 and the "ADOPTION, 2003 / A-5.2 REG 1" running head at y 56-68, with the
# first body block never higher than y 97. BC read its band off two full-width
# rules; there is no rule anywhere on these pages, so the band is the measured gap
# between the running head and the top of the body.
HEAD_BOTTOM = 80.0
FOOT_TOP = 780.0

PAGE = fitz.paper_rect("letter")
MARGIN_TOP = 60.0
MARGIN_BOTTOM = 54.0
HEADING_PAD = 8.0

CENTRED = 40.0
# "FORM A", "FORM C-1", "FORM I-3". The hyphen in the consolidation is U+2011
# (non-breaking), not U+002D, so it is normalised before matching.
HEADING = re.compile(r"^FORM\s+([A-Z](?:-\d+)?)\s*$")
DASHES = {"‑": "-", "‐": "-", "‒": "-", "–": "-", "—": "-"}


def _normalise(text):
    for bad, good in DASHES.items():
        text = text.replace(bad, good)
    return text


def content_band(page):
    """(top, bottom) of the printed form area on a consolidation page."""
    return HEAD_BOTTOM, min(FOOT_TOP, page.rect.height)


def headings(doc, first, last):
    """[(page_index, y, form_no)] for each enacting heading, in document order.

    Only the first heading found for a given form number is kept, so a form that
    happens to print its own number again in its body cannot displace its heading.
    """
    found, seen = [], set()
    for index in range(first - 1, last):
        page = doc[index]
        centre = page.rect.width / 2
        for block in page.get_text("blocks"):
            x0, y0, x1, text = block[0], block[1], block[2], block[4]
            first_line = _normalise(text.strip().split("\n")[0].strip())
            match = HEADING.match(first_line)
            if not match or abs((x0 + x1) / 2 - centre) > CENTRED:
                continue
            if match.group(1) in seen:
                continue
            seen.add(match.group(1))
            found.append((index, y0, match.group(1)))
    return sorted(found)


def last_ink(page, band):
    """Bottom of the last thing printed inside the band -- text or line art."""
    top, bottom = band
    lows = [b[3] for b in page.get_text("blocks") if top <= b[1] < bottom]
    lows += [d["rect"].y1 for d in page.get_drawings() if top <= d["rect"].y0 < bottom]
    return min(max(lows), bottom) if lows else top


def has_ink(page, top, bottom):
    """True if anything at all is printed in the band."""
    if any(top <= b[1] < bottom and b[4].strip() for b in page.get_text("blocks")):
        return True
    return any(top <= d["rect"].y0 < bottom for d in page.get_drawings())


def slices(doc, first, last, form_no):
    """[(page_index, y0, y1)] -- the bands of the consolidation this form occupies."""
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
        # Trim every band to its own last ink, not just the final one. A form that
        # ends half way down a page would otherwise carry the rest of the sheet as
        # trailing whitespace, and a one-page form whose successor's heading opens
        # the next page would spill onto a second output page purely on that
        # whitespace (682 pt of band into 678 pt of usable height).
        if not has_ink(page, top, bottom):
            # The band above the next form's heading on a page this form only
            # reaches the top of: blank, and would ship as an empty extra page.
            continue
        bottom = min(bottom, last_ink(page, (top, bottom)) + HEADING_PAD)
        if bottom - top > 1:
            out.append((index, top, bottom))
    return out


def trimmed(doc, index, y0, y1):
    """A one-page copy of the source page with everything outside the band erased.

    `show_pdf_page`'s clip stops the neighbouring form and the running head from
    *printing*, but their paths stay in the page and `get_drawings()` still reports
    them, so the box detector would see line art the form does not have. Redacting
    the strips (line art included) removes them for real.
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
        target = fitz.Rect(0, MARGIN_TOP + cursor, PAGE.width,
                           MARGIN_TOP + cursor + height)
        clip = fitz.Rect(0, y0, scratch[0].rect.width, y1)
        page.show_pdf_page(target, scratch, 0, clip=clip)
        scratch.close()
        cursor += height
    out.save(dest, garbage=4, deflate=True, clean=True)
    pages = out.page_count
    out.close()
    doc.close()
    return pages

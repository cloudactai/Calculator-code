"""Place overlay fields on a flat PDF — one exported from Word, with no AcroForm.

The fourteen Word-only Ontario forms have no widget rectangles to read, so the
boxes have to come off the printed page. Every rule here reads something the
government actually printed; nothing is estimated from a layout guess.

Signals, in the order they are trusted:

1. **Merge tokens.** Forms 37A–37E are the court's own generation templates and
   carry `[[Jurisdiction]]`-style placeholders where the registry's system fills
   in. The token's own text rectangle is the field box, and the token has to be
   painted out of the background or it prints literally.
2. **Printed ☐ glyphs.** One glyph is one checkbox — never union two, they belong
   to different options (the lesson BC's stacked options taught).
3. **Small stroked squares.** The same control drawn as vector art rather than as
   a glyph. Classified by the printed outline, per the placement guide.
4. **Shaded rectangles.** LibreOffice renders a Word form field as a light grey
   box, so on the forms built that way the shading *is* the field. Drawn twice
   (fill then stroke), hence the dedupe.
5. **Placeholder padding.** The same Word field where nothing was shaded. These
   `-fil` documents use legacy form fields (`w:textInput`); LibreOffice imports
   them as plain text, but each leaves its padding — a run of en-spaces — exactly
   where the field sat. The run count matches the document's own field count one
   for one, which makes this the most faithful signal on these sources and the
   reason Form 43B went from 18 answer boxes to 66.
6. **Empty ruled cells** and **bordered panels**, for the blanks a form draws
   rather than fields.
7. **Ruled writing lines.** The widest clear run along a horizontal rule. Ontario
   prints the label on the line itself ("Email: ______"), so the box starts after
   the label rather than covering it; a rule inked end to end is an underline and
   yields nothing.

A form that yields nothing from any of these needs hand placement; the builder
reports it rather than shipping an empty map.

Counts are checkable: `w:textInput` and `w:checkBox` in the source `.docx` say
how many fields the form really has, and `audit_on_forms.py` sweeps the result
for stacked boxes, missed anchors and boxes sitting on printed ink.
"""
import re

import fitz

SCALE = 1.5
TOKEN = re.compile(r"\[\[[^\]]+\]\]")
# Everything a currency cell may print and still be a blank: the symbol itself,
# and the en/em/no-break spaces Word pads the cell with.
CURRENCY_ONLY = re.compile(r"[\s$    ]")
CURRENCY_GAP = 2.0
# A grey Word-form-field box. Anything taller is a table cell or a panel border.
SHADE_MIN_WIDTH, SHADE_MIN_HEIGHT, SHADE_MAX_HEIGHT = 18.0, 7.0, 90.0
# Above this a single-line box is really a writing area.
TEXTAREA_HEIGHT = 30.0
GLYPH_MIN, GLYPH_MAX = 4.0, 20.0
SQUARE_MIN, SQUARE_MAX, SQUARE_SKEW = 5.0, 16.0, 4.0
GLYPH_SKEW = 2.0
CELL_MIN_WIDTH, CELL_MIN_HEIGHT, CELL_MAX_HEIGHT = 40.0, 12.0, 120.0
# A writing line: thin, wide, and with the line's own writing height clear above it.
RULE_MAX_THICKNESS, RULE_MIN_WIDTH, LINE_HEIGHT = 2.0, 40.0, 13.0
# Clearance kept between a box and the label printed on its own line.
RULE_INK_GAP = 2.0
# How close a rule must sit to a box's edge to be that box's border.
FRAME_TOLERANCE = 2.0
# Beyond this a pair of rules is not one box but two unrelated lines.
FRAME_MAX_HEIGHT = 200.0
# The page-footer stamp Ontario prints under the separator rule on every page.
FOOTER_STAMP = re.compile(r"Page\s+\d+\s+of\s+\d+", re.I)
FOOTER_BAND = 18.0
# The padding a legacy Word form field leaves behind: a run of en/em/no-break
# spaces where the field sat. Two is already unambiguous — ordinary prose does
# not set two en-spaces in a row.
PLACEHOLDER = re.compile("[\u2002\u2003\u2007\u00a0]{2,}")
PLACEHOLDER_MIN_WIDTH = 20.0

# Merge token -> the matter data it stands for. The court's template fills these
# from its own registry; ours fills them from the matter.
TOKEN_BIND = {
    "jurisdiction": "court_info.courtName",
    "case location address": "court_info.courtOfficeAddress",
    "court file number": "court_info.courtFileNumber",
}
# A token the court's own signing process supplies. It is not something a lawyer
# types, so it gets no editable box — only the paint-out.
TOKEN_SKIP = ("applied signature",)


def key(rect, places=1):
    return (round(rect.x0, places), round(rect.y0, places),
            round(rect.x1, places), round(rect.y1, places))


def token_rects(page):
    """(rect, inner text) for every [[merge token]] printed on the page."""
    out = []
    for match in TOKEN.finditer(page.get_text()):
        for rect in page.search_for(match.group(0)):
            out.append((rect, match.group(0)[2:-2].strip().lower()))
    return out


def glyph_rects(page):
    """Rect of each printed empty-checkbox glyph, one per box."""
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                for char in span.get("chars", []):
                    if char["c"] not in bp_glyphs():
                        continue
                    rect = fitz.Rect(char["bbox"])
                    if GLYPH_MIN <= rect.width <= GLYPH_MAX:
                        out.append(refine_glyph(page, rect))
    return out


def refine_glyph(page, rect):
    """Fit the box to the square the glyph actually draws.

    A glyph's font box is much taller than its visible mark — 8.8 × 16.1 for an
    8.8pt box on Form 34K — and the mark sits low in it, so using the font box
    puts the control high and oblong. The ink is measured inside the glyph's own
    box, where there is no neighbouring letter to bleed onto; a measurement that
    comes back non-square is rejected for a square centred on the glyph.
    """
    import bc_pipeline
    ink = bc_pipeline.ink_bounds(page, rect)
    if ink and ink.width > 1 and abs(ink.width - ink.height) <= GLYPH_SKEW:
        return ink
    middle = (rect.y0 + rect.y1) / 2
    side = min(rect.width, rect.height)
    return fitz.Rect(rect.x0, middle - side / 2, rect.x0 + side, middle + side / 2)


def bp_glyphs():
    # Imported lazily so this module can be read without the BC package on sys.path.
    import bc_pipeline
    return bc_pipeline.BOX_GLYPHS


def shade_rects(page):
    """The grey boxes LibreOffice draws for a Word form field, deduplicated.

    Word also shades ordinary table cells, and Form 13C shades its printed row
    labels ("Matrimonial Home") the same grey as its blanks, so a rect with
    printed words in it is a label and not a field. A lone currency symbol is the
    exception: those cells *are* amount fields, and the box starts just right of
    the symbol so the first digit does not land on it.
    """
    seen, out = set(), []
    for drawing in page.get_drawings():
        rect, fill = drawing["rect"], drawing.get("fill")
        if not fill:
            continue
        if not (rect.width >= SHADE_MIN_WIDTH and SHADE_MIN_HEIGHT <= rect.height <= SHADE_MAX_HEIGHT):
            continue
        if not (min(fill) > 0.75 and max(fill) < 0.98):  # grey: not white, not a rule
            continue
        if key(rect) in seen:
            continue
        printed = page.get_text("text", clip=rect)
        if CURRENCY_ONLY.sub("", printed):
            continue
        seen.add(key(rect))
        out.append(after_currency(page, rect) if "$" in printed else rect)
    return out


def after_currency(page, rect):
    """Start an amount box just right of the `$` the cell already prints.

    Measured at character level, not word level. Word pads the cell as
    `"$"` + five en-spaces, and the *word* rectangle covers that padding — using
    it put the box's left edge past the cell's own right edge, so every amount
    box silently fell back to covering its `$`. The glyph is ~7pt of a 34pt run.
    """
    signs = [fitz.Rect(char["bbox"]) for char in page_chars(page, rect) if char["c"] == "$"]
    if not signs:
        return rect
    left = max(sign.x1 for sign in signs) + CURRENCY_GAP
    return fitz.Rect(left, rect.y0, rect.x1, rect.y1) if rect.x1 - left >= 12 else rect


def covers_printed_text(pdf_path, fields):
    """Boxes that sit on printed ink, measured character by character.

    `bc_pipeline.check_overlap` compares against whole words, which is wrong on
    these forms: Word pads an amount cell as `"$"` + five en-spaces and hands
    that back as one word, so a box correctly placed *after* the symbol still
    covers 75% of the "word" and reads as a failure. Only inked characters count
    here, and a printed checkbox glyph is what a checkbox is supposed to sit on.
    """
    import bc_pipeline
    doc = fitz.open(pdf_path)
    flagged = []
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        marks = [(fitz.Rect(c["bbox"]), c["c"]) for c in page_chars(page, page.rect)
                 if c["c"].strip() and c["c"] not in bc_pipeline.BOX_GLYPHS]
        for item in [f for f in fields if f["page"] == number]:
            box = fitz.Rect(item["x"], item["y"],
                            item["x"] + item["width"] / SCALE,
                            item["y"] + item["height"] / SCALE)
            for rect, char in marks:
                overlap = box & rect
                if overlap.is_empty or rect.get_area() <= 1:
                    continue
                if overlap.get_area() > 0.6 * rect.get_area():
                    flagged.append({"page": number, "id": item["id"], "char": char})
                    break
    doc.close()
    return flagged


def page_chars(page, clip):
    for block in page.get_text("rawdict", clip=clip)["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                for char in span.get("chars", []):
                    yield char


def vector_squares(page):
    """Checkboxes drawn as small stroked squares rather than printed as a glyph."""
    out = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if not drawing.get("color") or drawing.get("fill"):
            continue  # a filled shape is shading, not an empty control outline
        if not (SQUARE_MIN <= rect.width <= SQUARE_MAX and SQUARE_MIN <= rect.height <= SQUARE_MAX):
            continue
        if abs(rect.width - rect.height) > SQUARE_SKEW:
            continue  # these controls are square; a 4:1 rectangle is a rule or a cell
        out.append(rect)
    return out


def ruled_cells(page):
    """Empty ruled cells. A cell with anything printed in it is not a blank."""
    rects = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if not (rect.width >= CELL_MIN_WIDTH and CELL_MIN_HEIGHT <= rect.height <= CELL_MAX_HEIGHT):
            continue
        if page.get_text("text", clip=rect).strip():
            continue
        rects.append(rect)
    # Drop a box that merely frames other boxes — the table's outer border.
    return [r for r in rects if sum(1 for o in rects if o != r and r.contains(o)) < 2]


def rule_blanks(page):
    """Horizontal rules a lawyer writes on, as a box sitting on the line.

    A rule is rarely blank end to end. Ontario prints the label on the line
    itself — "Email: ______", "$ ______", "…(specify) ______" — so the box is
    the widest *clear* run along the rule rather than the whole rule. Rejecting
    an inked line outright would drop the very field the label is asking for; a
    line that is inked all the way across is an underline and yields nothing.
    """
    ink = [fitz.Rect(char["bbox"]) for char in page_chars(page, page.rect) if char["c"].strip()]
    frames = box_frames(page)
    out = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.height > RULE_MAX_THICKNESS or rect.width < RULE_MIN_WIDTH:
            continue
        if not drawing.get("color"):
            continue
        if is_frame_edge(rect, frames) or is_footer_rule(page, rect):
            continue
        band = fitz.Rect(rect.x0, rect.y0 - LINE_HEIGHT, rect.x1, rect.y0)
        blocked = sorted((max(r.x0, band.x0) - RULE_INK_GAP, min(r.x1, band.x1) + RULE_INK_GAP)
                         for r in ink if not (band & r).is_empty)
        span = widest_gap(band.x0, band.x1, blocked)
        if span and span[1] - span[0] >= RULE_MIN_WIDTH:
            out.append(fitz.Rect(span[0], band.y0, span[1], band.y1))
    return out


def placeholder_runs(page):
    """Where a legacy Word form field was, from the padding it left behind.

    Ontario's `-fil` documents use legacy Word form fields (`w:textInput`).
    LibreOffice imports those as plain text, so nothing is drawn and nothing is
    exported — but each one leaves its placeholder padding, a run of en-spaces,
    at exactly the spot the field occupied. The run count matches the document's
    own field count one for one (76 on Form 43B, 404 on Form 13C), which makes
    this the most faithful signal available on these sources.

    The padding is only ~28pt wide because a Word field grows as you type, so the
    box is extended rightward to the next printed character on the line, or to
    the page's own text margin when the field ends the line.
    """
    out = []
    page_edge = text_margin(page)
    cells = box_frames(page)
    # Every printed character on the page, not just the ones in the run's own
    # text line: Ontario sets the caption after a field as a separate block, so
    # a same-line-only lookup let the box run straight over "of child(ren) from
    # our relationship" and the like.
    ink = [fitz.Rect(c["bbox"]) for c in page_chars(page, page.rect) if c["c"].strip()]
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            chars = [c for span in line.get("spans", []) for c in span.get("chars", [])]
            text = "".join(c["c"] for c in chars)
            for match in PLACEHOLDER.finditer(text):
                run = chars[match.start():match.end()]
                box = fitz.Rect(run[0]["bbox"])
                for char in run:
                    box |= fitz.Rect(char["bbox"])
                # A run inside a table cell may only grow to that cell's edge.
                # Without this, Form 13C's leftmost column stretched across the
                # sheet and swallowed the 300-odd shaded cells beside it.
                holding = [c for c in cells if c.contains(fitz.Point(box.x0 + 1, (box.y0 + box.y1) / 2))]
                limit = min((c.x1 for c in holding), default=page_edge) - RULE_INK_GAP
                middle = (box.y0 + box.y1) / 2
                after = [r.x0 for r in ink
                         if r.x0 >= box.x1 and r.y0 < middle < r.y1]
                box.x1 = max(box.x1, min(min(after) - RULE_INK_GAP if after else limit, limit))
                if box.width >= PLACEHOLDER_MIN_WIDTH:
                    out.append(box)
    return out


def text_margin(page, default_inset=40.0):
    """The right edge of the page's own printed text column."""
    edges = [w[2] for w in page.get_text("words") if w[4].strip()]
    return max(edges) if edges else page.rect.width - default_inset


def is_footer_rule(page, rect):
    """True when this rule is the separator above the form's own page footer.

    Word draws one across every page, and it looks exactly like a writing line:
    thin, wide, nothing above it. It is identified by what is printed *under*
    it — the form's edition stamp and "Page 2 of 6". A margin cutoff would be
    wrong here: Form 43A page 3 carries two genuine writing lines 33pt from the
    top, captioned "Children's Lawyer's name" and its signature.
    """
    below = fitz.Rect(0, rect.y1, page.rect.width, min(rect.y1 + FOOTER_BAND, page.rect.height))
    return bool(FOOTER_STAMP.search(page.get_text("text", clip=below)))


def box_frames(page):
    """Bordered panels and table cells, however the form drew them.

    Ontario draws its party panels as four separate line segments rather than as
    one rectangle, so reading `get_drawings()` rects alone finds nothing there.
    That cost twice over: the panel's own top rule was mistaken for a writing
    line (a box landed across the "Applicant(s)" heading), and the panel's
    interior — the address block a lawyer actually fills — got no field at all.
    So segments are reassembled into the boxes they outline.
    """
    rects = [d["rect"] for d in page.get_drawings()
             if d["rect"].width >= CELL_MIN_WIDTH and d["rect"].height >= CELL_MIN_HEIGHT]
    horizontal, vertical = [], []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.height <= RULE_MAX_THICKNESS and rect.width >= CELL_MIN_WIDTH:
            horizontal.append(rect)
        elif rect.width <= RULE_MAX_THICKNESS and rect.height >= CELL_MIN_HEIGHT:
            vertical.append(rect)

    for top in horizontal:
        for bottom in horizontal:
            height = bottom.y0 - top.y1
            if not CELL_MIN_HEIGHT <= height <= FRAME_MAX_HEIGHT:
                continue
            if abs(top.x0 - bottom.x0) > FRAME_TOLERANCE or abs(top.x1 - bottom.x1) > FRAME_TOLERANCE:
                continue
            sides = [v for v in vertical
                     if v.y0 <= top.y1 + FRAME_TOLERANCE and v.y1 >= bottom.y0 - FRAME_TOLERANCE
                     and (abs(v.x0 - top.x0) <= FRAME_TOLERANCE or abs(v.x1 - top.x1) <= FRAME_TOLERANCE)]
            if len({round(v.x0) for v in sides}) >= 2:
                rects.append(fitz.Rect(top.x0, top.y0, bottom.x1, bottom.y1))
    return rects


def frame_writing_areas(page, frames):
    """The empty part of each bordered panel, around whatever it already prints.

    A party panel prints its instruction ("Full legal name & address for service
    — street & number, …") across the top and leaves the rest blank, so the field
    is the blank remainder below. A single-line labelled row — Form 13C's
    "Email:" — has no room below, and there the writing space is what is left to
    the *right* of the label. Both shapes are handled; a cell printed full is
    neither and yields nothing.
    """
    # Reassembling segments finds the row *and* the two-row block around it. Only
    # the innermost box is a field: on Form 13C the outer one spans the
    # "Respondent(s)" heading plus the row beneath, and its "below the heading"
    # area ran straight across the "Full legal name:" row's own field.
    innermost = [f for f in frames if not any(o != f and f.contains(o) for o in frames)]
    out = []
    for frame in innermost:
        inner = fitz.Rect(frame.x0 + 1, frame.y0 + 1, frame.x1 - 1, frame.y1 - 1)
        if inner.width < CELL_MIN_WIDTH or inner.height < CELL_MIN_HEIGHT:
            continue
        ink = [fitz.Rect(c["bbox"]) for c in page_chars(page, inner) if c["c"].strip()]
        below = fitz.Rect(inner.x0, max((r.y1 for r in ink), default=inner.y0) + 1,
                          inner.x1, inner.y1)
        if below.height >= CELL_MIN_HEIGHT:
            out.append(below)
            continue
        # Only a row punctuated as a label offers writing space beside it. Without
        # this, Form 13C's "Respondent(s)" section heading and its footnote — both
        # single-line rows in the same table — each grew a field after the text.
        if not page.get_text("text", clip=inner).strip().endswith(":"):
            continue
        beside = fitz.Rect(max((r.x1 for r in ink), default=inner.x0) + RULE_INK_GAP,
                           inner.y0, inner.x1, inner.y1)
        if beside.width >= RULE_MIN_WIDTH:
            out.append(beside)
    return out


def is_frame_edge(rect, frames):
    """True when this rule is the top or bottom border of a box.

    A border is not a blank. Ontario draws its party panels and tables as
    separate edge segments, so without this every panel grew a spurious field
    lying across its own top rule — on Form 43 that put a box over the
    "Applicant(s)" heading and another under each panel.
    """
    for frame in frames:
        if rect.x0 < frame.x0 - FRAME_TOLERANCE or rect.x1 > frame.x1 + FRAME_TOLERANCE:
            continue
        if abs(rect.y0 - frame.y0) <= FRAME_TOLERANCE or abs(rect.y1 - frame.y1) <= FRAME_TOLERANCE:
            return True
    return False


def widest_gap(left, right, blocked):
    """The longest stretch of [left, right] not covered by any blocked interval."""
    best, cursor = None, left
    for start, end in blocked:
        if start > cursor and (best is None or start - cursor > best[1] - best[0]):
            best = (cursor, start)
        cursor = max(cursor, end)
    if right > cursor and (best is None or right - cursor > best[1] - best[0]):
        best = (cursor, right)
    return best


def field(doc_id, index, rect, kind, bind=None):
    import bc_pipeline
    out = {
        "id": bc_pipeline.new_id(doc_id, index),
        "type": kind,
        "x": round(rect.x0, 2),
        "y": round(rect.y0, 2),
        "width": round(rect.width * SCALE, 2),
        "height": round(rect.height * SCALE, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": None,
    }
    if bind:
        out["bind"] = bind
    return out


def place(source_path, doc_id, background_path):
    """Write the printed background and return (fields, report).

    The background is the source with every merge token painted out, so the page
    reads as a blank form rather than as the court's unfilled template.
    """
    doc = fitz.open(source_path)
    fields, report = [], {"tokens": 0, "checkboxes": 0, "shaded": 0, "paintedOut": 0}
    index = 0

    for number, page in enumerate(doc, start=1):
        claimed = []

        for rect, name in token_rects(page):
            page.add_redact_annot(rect)  # the token must not print
            report["paintedOut"] += 1
            if any(skip in name for skip in TOKEN_SKIP):
                continue
            index += 1
            item = field(doc_id, index, rect, "TextField", TOKEN_BIND.get(name))
            item["page"] = number
            fields.append(item)
            claimed.append(rect)
            report["tokens"] += 1

        shaded = shade_rects(page)
        # Where the source used Word form fields, the shading marks every real
        # blank — so an unshaded rule is a border, not a writing line. On Form 13C
        # all ten rule-derived boxes were table borders: the page-header rule, the
        # table's bottom border, the footnote row, and the gap beside
        # "EQUALIZATION PAYMENTS". Pages with no shading rely on rules as usual.
        rules = [] if shaded else rule_blanks(page)

        for source, rects, kind in (("checkboxes", glyph_rects(page), "CheckBox"),
                                    ("squares", vector_squares(page), "CheckBox"),
                                    ("shaded", shaded, None),
                                    ("placeholders", placeholder_runs(page), None),
                                    ("cells", ruled_cells(page), None),
                                    ("panels", frame_writing_areas(page, box_frames(page)), None),
                                    ("rules", rules, None)):
            for rect in rects:
                # Signals overlap: a token sits inside its own shading, a cell
                # border is also a rule, a tick sits inside the cell beside it.
                # First claim wins, so the more trustworthy signal keeps the spot.
                if any(not (rect & other).is_empty for other in claimed):
                    continue
                index += 1
                shape = kind or ("TextArea" if rect.height > TEXTAREA_HEIGHT else "TextField")
                item = field(doc_id, index, rect, shape)
                item["page"] = number
                fields.append(item)
                claimed.append(rect)
                report[source] = report.get(source, 0) + 1

        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    doc.save(background_path, garbage=4, deflate=True, clean=True)
    report["pageSizes"] = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    report["pages"] = doc.page_count
    doc.close()

    return fields, report

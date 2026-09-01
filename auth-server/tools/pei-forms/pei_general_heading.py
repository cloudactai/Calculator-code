"""Draw a real general heading where PEI prints the instruction `(General heading)`.

22 of the 34 shipped PEI forms print that instruction and nothing else, so a
generated petition comes out with no court file number, no court, no party names
-- and the words "(General heading)" still on the client's copy. This tool
replaces the instruction with the style of cause the instruction is asking for.

**The vocabulary is transcribed from Form 70I(A), not invented; the layout is
Ontario's.** PEI prints a full style of cause on exactly two forms in this
batch, and 70I(A) page 1 supplies the words: `No.`, the court and
`(Family Section)` centred in bold, `Applicant/Petitioner`, `Respondent`. But
70I(A)'s own layout -- an underscore rule with the role captioned below it and
to the right -- read as an odd, unlabelled line when it was the only thing on
an otherwise bare page, so the block is drawn **label-then-box** instead, the
way Ontario's own general heading works (Form 12's and Form 38's Court File
Number field is a bordered box under a caption, not a bare rule): every box on
the block starts at the same `BOX_INDENT` and is the same width, so
`Court File No.:`, `Applicant/Petitioner:` and `Respondent:` line up on one
edge. The one content addition is the file number box itself: PEI prints `No.`
over bare white space, which the batch's golden rule correctly refuses to box,
so the box is what makes `court_info.courtFileNumber` a legal bind rather than
a special case.

**Room is made by band reflow, never by scaling text.** The page is rebuilt from
`show_pdf_page` bands, exactly as `repair_pei_background.reflow_peisc_70a` does:
the source page is re-placed as a form XObject clipped to a y-band, so vector
content is copied rather than re-typeset and nothing drifts. Two sources of
space, both free:

* the **top gap** -- PEI's Word sources open with blank paragraphs, so most forms
  start their title 43-66pt below the 72pt margin. Moving the title band up to
  the margin touches nothing else.
* the **placeholder itself** -- 11pt, or 22pt on the six forms that also print
  `(Court seal)`, because the seal becomes a ring in the left column beside the
  block and costs no vertical space at all.

Fields on the page move by their own band's constant, so the page-by-page review
-- the re-seated checkboxes, the named fields, the dropped signature boxes --
survives as an exact translation. Nothing is re-detected.

    python3 pei_general_heading.py --only PEISC_70A --out-dir /tmp/review
    python3 pei_general_heading.py --check
"""
import argparse
import json
import os
import re
import shutil
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
SCALE = 1.5

PAGE_TOP = 72.0            # the sheet's own top margin, read off 70I(A)
GAP = 9.0                  # air above and below the block
BODY = 10.0                # Times 10, the size every PEI heading is set in
LEAD = 11.1                # the leading LibreOffice gives Times 10 here
FIELD_H = 15.0              # box height -- one line of 10pt type plus padding
STROKE = 0.6                # the box border weight, Ontario's own (Form 12/38)

# Two columns. Every field box starts on the page's own **midline** --
# `Court File No.:`, `Applicant/Petitioner:` and `Respondent:` all line up
# against it, labels right-aligned into it and boxes left-aligned out of it --
# and the whole left column, otherwise empty, carries the court name and a
# seal ring sized to the room that gives it rather than squeezed beside a
# rule the way the first two drafts of this block drew it.
LABEL_GAP = 6.0              # label's own right edge to the midline

FIELD_ROW = 28.0            # box row to box row, generous now the left
                             # column is doing its own work beside them
CENTRE_ROW = 12.5            # one centred title line to the next
TOP_PAD = 3.0                # first box's top, below the block's own top
SEAL_GAP = 7.0                # title block to the seal ring below it
BOTTOM_PAD = 6.0              # last row/ring to the block's own bottom

MARGIN_BOTTOM = 60.0        # every rebuilt page keeps this much clear paper
                            # at its own foot -- the sheet's own bottom margin

# What each headed page was moved by, written at apply time and read by
# `tools/review/repair_pei_fields.py`, whose repair tables are absolute
# coordinates measured on the *shipped* page. Without this the claim slots
# named on 70A page 1 would be looked for 40pt above where they now sit and
# added a second time.
SHIFTS = os.path.join(HERE, "heading_shifts.json")

COURT = "Supreme Court of Prince Edward Island"
SECTION = "(Family Section)"
PROBE = COURT            # idempotence: the block is already on the page

# The placeholder vocabulary this pass removes -- "(General heading)" always,
# and PEI's own seal/court/file-number captions beside it in whichever order
# the source prints them, parens or not, capitalized or not. 70U and 70V
# print all three of "(Court)", "(Court seal)" and "(General heading)" as a
# short row of captions rather than one line each above the other, so a walk
# that only recognized "(Court seal)" stopped at "(Court file no.)" between
# them and never reached the rest of the row.
PLACEHOLDER = re.compile(
    r"^\(?general heading\)?$|^\(?court seal\)?$"
    r"|^\(?court\)?$|^\(?court file no\.?\)?$", re.I)

# Which block each form gets. Rule 70 says "petitioner", Rule 71 says
# "applicant"; 70I(A) prints the compound on a Rule 70 form, so the compound is
# what PEI itself uses and what `pei_binds` matches as one label.
FORMS = {
    "PEISC_70A": {"seal": True},
    "PEISC_70AA": {"seal": False},
    "PEISC_70CC": {"seal": False},
    "PEISC_70D": {"seal": False},
    "PEISC_70E": {"seal": False},
    "PEISC_70EE": {"seal": False},
    "PEISC_70H": {"seal": False},
    "PEISC_70J": {"seal": False},
    "PEISC_70M": {"seal": False},
    "PEISC_70N": {"seal": False},
    "PEISC_70O": {"seal": False},
    "PEISC_70P": {"seal": False},
    "PEISC_70Q": {"seal": False},
    "PEISC_70DD": {"seal": True},
    "PEISC_70R": {"seal": True},
    "PEISC_70U": {"seal": True},
    "PEISC_70V": {"seal": True},
    "PEISC_71E": {"seal": True},
    # The counterpetition captions are longer than the ordinary party labels.
    # Give their right-aligned text a 12pt gutter before the unchanged field
    # column, so the final two labels never meet the control border.
    "PEISC_70F": {"seal": False, "second_title": True, "label_gap": 12.0},
    "PEISC_70G": {"seal": False, "second_title": True, "label_gap": 12.0},
    # These three forms print fragments of the court heading rather than the
    # literal ``(General heading)`` instruction.  They used to be repaired by
    # a separate, oversized PDF overlay.  Treat their complete fragment as the
    # placeholder band so they get this module's compact, source-reflowed
    # heading too.
    "PEISC_70S": {"seal": True},
    "PEISC_70T": {"seal": True},
    "PEISC_71A": {"seal": True},
    # PEISC_70B is out of scope for this pass, like 71B: unlike every other
    # second_title form, its own source already carries a full "AND BETWEEN"
    # party block (a name rule, "Petitioner by counterpetition", "and",
    # another name rule, "Respondents to the counterpetition") between the
    # placeholder and the real body text -- exactly what this pass's own
    # Petitioner/Respondent-by-Counterpetition rows are meant to replace, not
    # sit above. Removing that block too is a 70B-specific change, not a
    # generic one; left for its own pass rather than shipped half done.
}

# The legacy forms above have no single placeholder line to measure.  These
# are the complete printed heading fragments, measured from their clean
# LibreOffice backgrounds.  The lower edge deliberately stops before the
# first real title/body line, so the band reflow preserves legal text exactly.
LEGACY_BANDS = {
    "PEISC_70S": (149.5, 230.5),
    "PEISC_70T": (172.5, 207.5),
    "PEISC_71A": (138.0, 207.5),
}


def base14(bold=False):
    return "tibo" if bold else "tiro"


def width(text, bold=False, size=BODY):
    return fitz.get_text_length(text, fontname=base14(bold), fontsize=size)


def block_bottom(second_title=False):
    """The y offset, relative to the block's top, of its last drawn edge.

    Kept as its own function rather than a constant so `rebuild`'s room
    calculation and `draw_block`'s own row arithmetic cannot drift apart --
    the failure mode `pei_binds`' README warns about elsewhere in this batch,
    a number that matched what a tool produced rather than what the page
    needed. The title sits full-width across the top; the two columns below
    it -- the seal on the left, three field rows (five with a second title)
    on the right -- decide the rest.
    """
    rows = 5 if second_title else 3
    columns_top = 2 * CENTRE_ROW + SEAL_GAP
    return columns_top + TOP_PAD + FIELD_H + (rows - 1) * FIELD_ROW + BOTTOM_PAD


def draw_block(page, left, right, top, seal, second_title=False, party_rows=None,
               label_gap=LABEL_GAP):
    """Draw the heading and return the fields that belong on it.

    The court name and `(Family Section)` are centred across the **whole**
    block width, same as the placeholder they replace. Below that, two
    columns: the **right** column is a plain label-then-box list -- Ontario's
    own convention (Form 12's and Form 38's Court File Number field is a
    bordered box after a caption, not a bare rule) -- with every box starting
    on the page's own midline: labels are right-aligned into it, boxes
    left-aligned out of it, so `Court File No.:`, `Applicant/Petitioner:` and
    `Respondent:` all line up on the same edge and no box is longer than
    another. The **left** column, otherwise empty paper below the title,
    carries a seal ring sized to fill the room the right column's rows define.

    `party_rows` overrides the two (or four, with `second_title`) party rows
    below Court File No. -- 70A_JOINT's own "Spouse One"/"Spouse Two", rather
    than "Applicant/Petitioner"/"Respondent", the way its two spouses jointly
    petition together rather than opposing each other. The row count and
    layout are unchanged; only the label text and bind differ.
    """
    mid = (left + right) / 2.0

    def text(x, y, s, bold=False, size=BODY, colour=(0, 0, 0)):
        page.insert_text(fitz.Point(x, y), s, fontsize=size,
                         fontname=base14(bold), color=colour)

    def centred(y, s, bold=False):
        text((left + right) / 2 - width(s, bold) / 2, y, s, bold)

    def field_row(y, label, bind):
        text(mid - label_gap - width(label), y - 4.0, label)
        rect = fitz.Rect(mid, y - FIELD_H, right, y)
        page.draw_rect(rect, color=(0, 0, 0), width=STROKE)
        return (rect, bind)

    centred(top + CENTRE_ROW, COURT, bold=True)
    centred(top + 2 * CENTRE_ROW, SECTION, bold=True)
    columns_top = top + 2 * CENTRE_ROW + SEAL_GAP

    rows = list(party_rows) if party_rows else [
        ("Applicant/Petitioner:", "applicant.fullLegalName"),
        ("Respondent:", "respondent.fullLegalName")]
    rows = [("Court File No.:", "court_info.courtFileNumber")] + rows
    if second_title:
        rows += [("Petitioner by Counterpetition:", None),
                ("Respondent by Counterpetition:", None)]

    fields = []
    y = columns_top + TOP_PAD + FIELD_H
    for label, bind in rows:
        fields.append(field_row(y, label, bind))
        y += FIELD_ROW
    bottom = y - FIELD_ROW + BOTTOM_PAD  # last box's bottom, plus the pad

    if seal:
        # A reserved area, not a seal: an empty ring where PEI prints
        # "(Court seal)", carrying no field -- the registry stamps it. Sized
        # to fill the space actually free below the title: not the whole
        # left column, but only out to the **widest label's own left edge** --
        # "Applicant/Petitioner:" reaches further left than "Respondent:"
        # does, and a radius sized off the column's raw width read past it
        # and printed the ring under the label's own text.
        seal_x1 = min(mid - label_gap - width(label) for label, _ in rows) - 8.0
        radius = min((bottom - columns_top) / 2.0 - 3.0,
                    (seal_x1 - left) / 2.0 - 2.0)
        centre = fitz.Point(left + (seal_x1 - left) / 2.0, columns_top + radius + 3.0)
        page.draw_circle(centre, radius, color=(0.55, 0.55, 0.55), width=0.7)
        cap = "Court seal"
        page.insert_text(fitz.Point(centre.x - width(cap, size=8) / 2,
                                    centre.y + 3.0), cap,
                         fontsize=8, fontname=base14(), color=(0.55, 0.55, 0.55))

    # Every drawn box gets a plain field, bound or not -- the same convention
    # the rest of this batch already follows for a printed rule with nowhere
    # to bind it (the "TO:" boxes, e.g.): the counterpetition rows on 70B/70F/
    # 70G stay unbound (the plan's own call -- a counterpetition's party isn't
    # reliably the matter's applicant or respondent, so this repo doesn't
    # guess), but the box is still something a filer can click into and type,
    # not empty paper with no home for a click. Leaving it out here would just
    # move the same box into `repair_pei_fields.py`'s `pass_cells` queue --
    # the same field, discovered a second time by a different tool.
    return fields


def record_shift(doc_id, page_no, hold_top, hold_bottom, lift, drop, spill=None):
    shifts = json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}
    entry = {"page": page_no, "holdTop": round(hold_top, 2),
             "holdBottom": round(hold_bottom, 2), "lift": lift, "drop": drop}
    if spill:
        split_y, shift2, cont_page = spill
        entry["split"] = round(split_y, 2)
        entry["shift2"] = shift2
        entry["contPage"] = cont_page
    shifts[doc_id] = entry
    with open(SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2, sort_keys=True)


def shift_for(doc_id, page_no):
    """(hold_top, hold_bottom, lift, drop, split, shift2, cont_page) or None.

    Only for `page_no == entry["page"]` -- the one page this pass actually
    reflowed. A later page that just got renumbered by a spliced-in
    continuation (see `page_for`) didn't have anything inside it moved, so
    there is no y-shift to report for it.
    """
    if not os.path.exists(SHIFTS):
        return None
    entry = json.load(open(SHIFTS)).get(doc_id)
    if not entry or entry["page"] != page_no:
        return None
    return (entry["holdTop"], entry["holdBottom"], entry["lift"], entry["drop"],
            entry.get("split"), entry.get("shift2"), entry.get("contPage"))


def shifted(doc_id, page_no, y):
    """Move one measured y from the pre-heading page onto the shipped page."""
    entry = shift_for(doc_id, page_no)
    if entry is None:
        return y
    hold_top, hold_bottom, lift, drop, split, shift2, _ = entry
    if y <= hold_top:
        return round(y - lift, 2)
    if split is not None and y >= split:
        return round(y + shift2, 2)
    if y >= hold_bottom:
        return round(y + drop, 2)
    return y


def page_for(doc_id, page_no, y):
    """The page a measured (page_no, y) now lives on, after heading + spill.

    A coordinate table elsewhere in this batch was measured against the
    *pre-heading* page. Two different things can have moved it:

    * `page_no` is the headed page itself, and `y` is at or past the spill's
      own split -- its content followed the tail onto the continuation page.
    * `page_no` is a page *after* the headed one, on a form that already had
      more pages (70B, 70R): the continuation is spliced in right after the
      headed page (`rebuild`), so every page from the old `page_no + 1` on
      was pushed back by one to make room for it, regardless of `y`.
    """
    if not os.path.exists(SHIFTS):
        return page_no
    entry = json.load(open(SHIFTS)).get(doc_id)
    if not entry:
        return page_no
    headed_page, cont_page = entry["page"], entry.get("contPage")
    if page_no == headed_page:
        split = entry.get("split")
        return cont_page if split is not None and y >= split else page_no
    if cont_page is not None and page_no > headed_page:
        return page_no + 1
    return page_no


def reseat(page, fields):
    """Snap a shifted box back onto its rule.

    The band shift is exact at two decimals, but the ink is carried by an
    XObject matrix and re-extracted rule extents round differently, so a rule
    can land up to 0.05pt from where the arithmetic put it -- enough for
    `pass_seat_flat` to see a float and want to move the box. The seat is read
    with that pass's own `rule_under`, imported late because it imports this
    module in turn, and only the rounding scale is corrected: anything larger
    is a genuine float this pass does not own.
    """
    sys.path.insert(0, os.path.join(os.path.dirname(HERE), "review"))
    from repair_pei_fields import rule_under  # noqa: E402  (late: see above)

    for field in fields:
        rect = fitz.Rect(field["x"], field["y"],
                         field["x"] + field["width"] / SCALE,
                         field["y"] + field["height"] / SCALE)
        top = rule_under(page, rect)
        if top is None:
            continue
        move = top - rect.y1
        if 0 < abs(move) < 0.1:
            field["y"] = round(field["y"] + move, 2)


def page_lines(page):
    """Every non-blank text line on the page, as `(y0, y1, text)`, sorted.

    Line-level, not block-level: PyMuPDF's paragraph grouping folds unrelated
    lines into the same block wherever they sit close together -- 70D's block
    runs from "(General heading)" straight through "ANSWER" and the numbered
    admissions, and 70B's runs from an italic drafting note, through
    "(General heading)", through the "AND BETWEEN:" style-of-cause block that
    follows it, all as one block. A block-level view of the page reports that
    whole span as one thing, which both eats real content when removing the
    placeholder and misjudges where the page's own title block ends when
    placing this pass's own heading beneath it.
    """
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if text.strip():
                lines.append((line["bbox"][1], line["bbox"][3], text.strip()))
    lines.sort()
    return lines


def measure(page, doc_id=None):
    """The page's own margins and the placeholder band, read off the page."""
    words = [w for w in page.get_text("words") if w[4].strip()]
    left = min(w[0] for w in words)
    right = max(w[2] for w in words)
    blocks = page.get_text("blocks")
    title_top = min(b[1] for b in blocks)

    if doc_id in LEGACY_BANDS:
        hold_top, hold_bottom = LEGACY_BANDS[doc_id]
        return left, right, title_top, hold_top, hold_bottom

    lines = page_lines(page)
    holder_idx = [i for i, l in enumerate(lines) if "General heading" in l[2]]
    if len(holder_idx) != 1:
        raise ValueError("expected exactly one (General heading) line")
    idx = holder_idx[0]
    # PEI prints the seal caption immediately next to the placeholder -- as
    # the line right after it (70DD, 70R, 71E, 70B) or, just as often, the
    # line right *before* it (70U, 70V) -- and it is the same instruction as
    # "(General heading)", not body content: left in place it would print a
    # second, redundant "(Court seal)" underneath the ring this pass draws in
    # its place. Both directions are walked out from the placeholder's own
    # line for as long as the neighbour matches the same small vocabulary.
    lo = hi = idx
    while lo > 0 and PLACEHOLDER.match(lines[lo - 1][2]):
        lo -= 1
    while hi < len(lines) - 1 and PLACEHOLDER.match(lines[hi + 1][2]):
        hi += 1
    hold_top, hold_bottom_edge = lines[lo][0], lines[hi][1]
    # Cut below the placeholder's descenders, not on its reported bottom edge:
    # a text line's box stops at the baseline's descent and the glyphs of
    # "(General heading)" print a hair past it, so clipping on hold_bottom_edge
    # leaves a grey sliver at the top of the shifted band. Halfway to the next
    # line is blank paper on every form in this batch.
    below = min((y0 for y0, y1, t in lines if y0 > hold_bottom_edge),
                default=hold_bottom_edge + 1)
    return left, right, title_top, hold_top, (hold_bottom_edge + below) / 2


FOOTER = re.compile(r"^\d{1,3}$")


def footer_top(source, hold_bottom, h):
    """y0 of a lone page-number footer near the foot of the page, or `None`.

    A page number is the sheet's own numbering, not flowing body content --
    always just digits, always the last thing printed. It doesn't belong in
    the "below" band this pass shifts, or a form whose real content ends well
    above the foot of the page reports an overflow that is really the "1"
    walking past the margin on its own (70CC, 70E, 70O, all one printed line
    with 300-500pt of blank paper above it).
    """
    candidates = [b[1] for b in source.get_text("blocks")
                 if b[1] >= hold_bottom - 0.1 and b[1] > h - 150
                 and FOOTER.match(b[4].strip())]
    return min(candidates) if candidates else None


def band(doc, page_no, keep):
    """A one-page document holding only the ink inside `keep`.

    **A clip is not enough.** `show_pdf_page(..., clip=...)` places the whole
    source page as a form XObject and hides the rest behind a BBox: it prints
    correctly, but `get_text` and `get_drawings` still read the hidden ink, so
    every detector in `repair_pei_fields` sees the body of the page a second
    time at the wrong offset -- and the instruction "(General heading)" stays
    extractable in a document that is supposed to no longer say it. The bands
    are therefore redacted rather than clipped, so the page holds exactly what
    it prints.
    """
    page = doc[page_no - 1]
    width, height = page.rect.width, page.rect.height
    out = fitz.open()
    out.insert_pdf(doc, from_page=page_no - 1, to_page=page_no - 1)
    target = out[0]
    for rect in (fitz.Rect(0, 0, width, keep.y0),
                 fitz.Rect(0, keep.y1, width, height)):
        if rect.get_area() > 0:
            target.add_redact_annot(rect)
    target.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                            graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED)
    return out


def rebuild(doc, page_no, left, right, title_top, hold_top, hold_bottom, seal,
           second_title=False, page_fields=(), party_rows=None, label_gap=LABEL_GAP):
    """Rebuild the page from bands. Returns (block fields, lift, drop, spill).

    On most forms the placeholder's 11-22pt and the top gap are room enough
    and this is a straight three-band shift. On the rest the block is taller
    than what those two sources free, and the "below" band's own tail has to
    move off page 1 -- taken at a block boundary (`page.get_text("blocks")`),
    never inside a paragraph, the same rule the plan specifies. `page_fields`
    -- the (y0, y1) of every field already on this page -- is folded into the
    same boundary search: a printed paragraph and the field sitting on it are
    usually the same span, but a field can run past its own paragraph's
    reported box (a growable claim slot, a tall TextArea), and the split has
    to clear the field's own edge too or `shift_fields` finds one straddling
    it a moment later.

    `spill` is `None` when nothing moved, or `(split_y, shift2, cont_page)`:
    `split_y` is the tail's own y0 on the *source* page, `shift2` is what
    carries it onto a fresh sheet's own top margin, and `cont_page` is where
    it lands -- always `page_no + 1`, spliced in right after the page it
    spilled from. On a form that already had more pages (70B, 70R, in this
    batch) everything from the old `page_no + 1` on is pushed back by one to
    make room, which is why `shift_fields` also renumbers fields it isn't
    otherwise touching, and why every other hardcoded `(docId, page, ...)`
    table elsewhere in this batch reads its page through `page_for` rather
    than the literal number it was measured against. The alternative --
    appending the continuation at the very end instead of splicing it in --
    was tried first and rejected: on a multi-page form the spilled tail is a
    direct continuation of page 1's own last paragraph, and a reader would
    meet the rest of that paragraph (correctly, on the old page 2) *before*
    reaching the piece that's supposed to come first.
    """
    source = doc[page_no - 1]
    w, h = source.rect.width, source.rect.height
    lift = title_top - PAGE_TOP                    # band A moves up by this
    # The block sits under everything the "above" band actually carries, not
    # just the page's own title -- 70B prints a real instructional paragraph
    # ("Where all respondents to the counterpetition are already parties...")
    # between its title and the placeholder, and a block-level view of the
    # page folds that paragraph into the same block as the placeholder,
    # underselling where the "above" band's own last line actually falls.
    title_bottom = max(y1 for y0, y1, t in page_lines(source) if y1 <= hold_top)
    top = title_bottom - lift + GAP
    drop = (top + block_bottom(second_title) + GAP) - hold_bottom  # band C

    # Whole points at two decimals, so a shifted box lands exactly where it
    # sat relative to its rule and `pass_seat_flat` has nothing to correct.
    lift, drop = round(lift, 2), round(drop, 2)

    # A page-number footer is the sheet's own numbering, not flowing body
    # text -- it doesn't move with `drop`, or a form whose real content ends
    # well short of the foot of the page (70CC, 70E, 70O among them) reports
    # an overflow that is really just "1" walking past the margin on its own.
    # Left in place, everything else is measured and shifted as if it were
    # never there.
    foot = footer_top(source, hold_bottom, h)
    body_end = foot if foot is not None else h

    # The last original y a block's own *bottom* can reach and still land
    # inside the margin once shifted by `drop` -- a block's top can sit well
    # inside this limit while its bottom (a wrapped line, a box) crosses it,
    # so the test is on the edge that actually has to fit, not the one that
    # happens to start early. A footer that stays in place is itself a lower
    # bound, not just an exemption: real content shifted by `drop` still has
    # to clear the gap above the footer's own fixed position (71E's "Issued
    # by" row sits close enough above its "1" that shifting the row down
    # without shifting the footer would print one over the other), so the
    # tighter of the two limits governs.
    limit = h - MARGIN_BOTTOM - drop
    if foot is not None:
        limit = min(limit, foot - GAP - drop)
    below_blocks = sorted(
        {(b[1], b[3]) for b in source.get_text("blocks")
         if hold_bottom - 0.1 <= b[1] < body_end - 0.1}
        | {(y0, y1) for y0, y1 in page_fields
           if hold_bottom - 0.1 <= y0 < body_end - 0.1})
    # Merged into non-overlapping spans before testing against `limit`: a
    # side-by-side pair of columns (name/address for two different people,
    # each its own block or field) shares a y-range without ever being on top
    # of each other, and a naive "first thing whose own bottom crosses" test
    # walks the split forward through every one of them in turn, past the
    # margin, rather than seeing the row of columns as the one unit it is and
    # moving all of it to the continuation together.
    merged = []
    for y0, y1 in below_blocks:
        if merged and y0 <= merged[-1][1] + 0.1:
            merged[-1] = (merged[-1][0], max(merged[-1][1], y1))
        else:
            merged.append((y0, y1))
    split_y = next((y0 for y0, y1 in merged if y1 > limit + 0.01), None)
    below_bottom = split_y if split_y is not None else body_end

    above = band(doc, page_no, fitz.Rect(0, 0, w, hold_top))
    below = band(doc, page_no, fitz.Rect(0, hold_bottom, w, below_bottom))
    tail = (band(doc, page_no, fitz.Rect(0, split_y, w, body_end))
           if split_y is not None else None)
    footer = band(doc, page_no, fitz.Rect(0, foot, w, h)) if foot is not None else None

    out = fitz.open()
    page = out.new_page(width=w, height=h)
    page.show_pdf_page(fitz.Rect(0, -lift, w, h - lift), above, 0)
    page.show_pdf_page(fitz.Rect(0, drop, w, h + drop), below, 0)
    above.close()
    below.close()
    if footer is not None:
        page.show_pdf_page(fitz.Rect(0, 0, w, h), footer, 0)   # unshifted
        footer.close()
    fields = draw_block(page, left, right, top, seal, second_title, party_rows,
                        label_gap)

    bottom = max(b[3] for b in page.get_text("blocks"))
    if bottom > h - MARGIN_BOTTOM:
        raise ValueError("page 1 overflows its bottom margin: %.1f" % bottom)

    cont_doc, shift2 = None, None
    if tail is not None:
        shift2 = round(PAGE_TOP - split_y, 2)
        cont_doc = fitz.open()
        cont_page = cont_doc.new_page(width=w, height=h)
        cont_page.show_pdf_page(fitz.Rect(0, shift2, w, h + shift2), tail, 0)
        tail.close()
        tail_bottom = max(b[3] for b in cont_page.get_text("blocks"))
        if tail_bottom > h - MARGIN_BOTTOM:
            raise ValueError("continuation page overflows: %.1f" % tail_bottom)

    doc.delete_page(page_no - 1)
    doc.insert_pdf(out, from_page=0, to_page=0,
                   start_at=page_no - 1, links=False, annots=False)

    spill = None
    if cont_doc is not None:
        # Spliced in right after the page it spilled from -- not appended at
        # the end -- so a form that already had more pages keeps reading in
        # physical order: the tail of page 1's last paragraph now sits on the
        # page immediately following it, exactly where a reader expects it,
        # ahead of whatever used to be page 2.
        cont_page_no = page_no + 1
        doc.insert_pdf(cont_doc, from_page=0, to_page=0,
                       start_at=page_no, links=False, annots=False)
        spill = (split_y, shift2, cont_page_no)

    return fields, lift, drop, spill


def shift_fields(mapping, page_no, hold_top, hold_bottom, lift, drop, spill=None):
    """Shift every field on `page_no`, and return the ids of any dropped."""
    split_y, shift2, cont_page_no = spill if spill else (None, None, None)
    dropped = []
    for field in mapping["staticFields"]:
        if field["page"] != page_no:
            # A spilled continuation is spliced in right after `page_no`
            # (see `rebuild`), so every field already on a later page has to
            # move back by one to make room for it -- the same reason every
            # other hardcoded `(docId, page, ...)` table elsewhere in this
            # batch reads its page through `page_for` rather than the literal
            # number it was measured against.
            if spill and field["page"] > page_no:
                field["page"] += 1
            continue
        y0, y1 = field["y"], field["y"] + field["height"] / SCALE
        # Checked before the "above" test, with a point of slack either way:
        # a "compact"/`rule: "bottom"` field (70U/70V's own "(Court)" and
        # "(Court file no.)" blanks) stores its rect a hair above the rule it
        # actually anchors to, which can land its own bottom a few tenths of
        # a point short of `hold_top` -- close enough that it's the same
        # printed row, not a field that happens to sit just above it.
        if y0 >= hold_top - 1.0 and y1 <= hold_bottom + 1.0:
            # Sat entirely on the placeholder's own printed rule -- 70U and
            # 70V carry a blank "(Court)" / "(Court file no.)" line, unbound,
            # doing exactly the job this pass's own Court File No. box now
            # does. The rule it sat on is gone; so is the field.
            dropped.append(field["id"])
        elif y1 <= hold_top:
            field["y"] = round(field["y"] - lift, 2)
        elif y0 >= hold_bottom:
            if split_y is not None and y0 >= split_y:
                field["page"] = cont_page_no
                field["y"] = round(field["y"] + shift2, 2)
            elif split_y is not None and y1 > split_y:
                raise ValueError("a field straddles the spill split")
            else:
                field["y"] = round(field["y"] + drop, 2)
        else:
            raise ValueError("a field straddles the placeholder band")
    if dropped:
        mapping["staticFields"] = [f for f in mapping["staticFields"]
                                   if f["id"] not in dropped]
    return dropped


def new_ids(mapping, count):
    base = max(f["id"] for f in mapping["staticFields"])
    return [base + 1 + i for i in range(count)]


def add_fields(mapping, page_no, placed):
    for field_id, (rect, bind) in zip(new_ids(mapping, len(placed)), placed):
        field = {
            "id": field_id,
            "type": "TextField",
            "x": round(rect.x0, 2),
            "y": round(rect.y0, 2),
            "width": round(rect.width * SCALE, 2),
            "height": round(rect.height * SCALE, 2),
            "value": "",
            "fontSize": 9,
            "color": [0, 0, 0],
            "background": "none",
            "border": "none",
            "page": page_no,
        }
        # A counterpetition row (bind is None -- see draw_block) matches every
        # other plain, unbound field in this batch: no "bind" key at all,
        # rather than one holding null.
        if bind:
            field["bind"] = bind
        mapping["staticFields"].append(field)


def apply(doc_id, spec, out_dir, check, baseline_dir=None):
    source_dir = baseline_dir or EXPORT
    pdf_in = os.path.join(source_dir, "%s.pdf" % doc_id)
    json_in = os.path.join(source_dir, "%s.json" % doc_id)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))
    before = json.dumps(mapping["staticFields"], sort_keys=True)

    def already_headed(text):
        # PROBE alone is not enough -- several forms mention the court's own
        # name in a body sentence ("no order made by the Supreme Court of
        # Prince Edward Island extending the time...", 70V) with the
        # placeholder still on the page. Idempotence means *this pass ran*,
        # which only the placeholder's absence actually tells us.
        return PROBE in text and "(General heading)" not in text

    if already_headed(doc[0].get_text()) or (
            out_dir and os.path.exists(os.path.join(out_dir, "%s.pdf" % doc_id))
            and already_headed(fitz.open(os.path.join(out_dir, "%s.pdf" % doc_id))[0].get_text())):
        print("%-12s already headed, skipped" % doc_id)
        return 0
    left, right, title_top, hold_top, hold_bottom = measure(doc[0], doc_id)
    if check:
        print("%-12s would head: margins %.1f-%.1f, placeholder %.1f-%.1f"
              % (doc_id, left, right, hold_top, hold_bottom))
        return 1

    page1_fields = [(f["y"], f["y"] + f["height"] / SCALE)
                   for f in mapping["staticFields"] if f["page"] == 1]
    placed, lift, drop, spill = rebuild(doc, 1, left, right, title_top,
                                       hold_top, hold_bottom, spec["seal"],
                                       spec.get("second_title", False),
                                       page1_fields, label_gap=spec.get("label_gap", LABEL_GAP))
    dropped = shift_fields(mapping, 1, hold_top, hold_bottom, lift, drop, spill)
    moved = json.loads(before)
    assert len(moved) == len(mapping["staticFields"]) + len(dropped), (
        "a field went missing that wasn't explicitly dropped")
    # Reseated before the block's own boxes exist -- `rule_under` rasterises
    # the ink around each box, and a box drawn with a *centred* stroke (this
    # block's own, Ontario-style) reads its own border's ink as sitting half a
    # stroke width above its stored edge, which is not a float to correct but
    # a property of a field that draws its own complete border rather than
    # sitting over a separately-drawn rule. Only fields that were moved by the
    # band shift are genuine seating candidates here.
    reseat(doc[0], [f for f in mapping["staticFields"] if f["page"] == 1])
    if spill:
        cont_page_no = spill[2]
        reseat(doc[cont_page_no - 1],
              [f for f in mapping["staticFields"] if f["page"] == cont_page_no])
    add_fields(mapping, 1, placed)

    target = out_dir or EXPORT
    os.makedirs(target, exist_ok=True)
    if target != EXPORT:
        for name in ("%s.pdf" % doc_id, "%s.json" % doc_id):
            if not os.path.exists(os.path.join(target, name)):
                shutil.copy(os.path.join(EXPORT, name), os.path.join(target, name))
    # Written beside the target and moved into place: PyMuPDF refuses a
    # non-incremental save over the file it has open, and an incremental save
    # would keep the old page objects in the shipped background.
    tmp = os.path.join(target, "%s.pdf.tmp" % doc_id)
    doc.save(tmp, deflate=True, garbage=3)
    doc.close()
    os.replace(tmp, os.path.join(target, "%s.pdf" % doc_id))
    with open(os.path.join(target, "%s.json" % doc_id), "w") as handle:
        json.dump(mapping, handle, indent=2)
    record_shift(doc_id, 1, hold_top, hold_bottom, lift, drop, spill)
    bound = sum(1 for _, bind in placed if bind)
    tail = ", spilled onto page %d" % spill[2] if spill else ""
    drop_note = ", -%d obsolete" % len(dropped) if dropped else ""
    print("%-12s headed: title up %.1f, body down %.1f, +%d fields (%d bound)%s%s"
          % (doc_id, lift, drop, len(placed), bound, tail, drop_note))
    return 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--out-dir")
    parser.add_argument("--baseline-dir",
                        help="clean source template directory; output remains --out-dir or the export")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = 0
    for doc_id, spec in sorted(FORMS.items()):
        if args.only and doc_id != args.only:
            continue
        changed += apply(doc_id, spec, args.out_dir, args.check, args.baseline_dir)
    print("%d form(s) %s" % (changed, "to change" if args.check else "changed"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

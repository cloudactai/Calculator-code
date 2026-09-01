"""Reclaim PEI continuation pages that carry almost nothing.

Rounds six, eight and ten made room by *sizing* an answer box, spilling
whatever followed it onto a fresh sheet. Some of those sheets came back
carrying only a few lines -- a signature block, a closing paragraph, the tail
of one item -- while the page immediately behind them still has hundreds of
points of clear paper below its own content. That is not a sizing problem;
it is a pagination problem, and the fix is the mirror image of a spill: pull
the *next* page's content up into the *previous* page's own tail, drop the
page that emptied out, and let every later page renumber back by one.

**Most absorptions are whole-page.** A page is dropped only when its *entire*
content -- top margin to its own footer, or to its own last line where it has
none -- fits, unshifted internally and never re-typeset, into the clear paper
already sitting below the page in front of it. No cut is made through the
middle of either page, so there is nothing for `validate_cut` to refuse and
nothing for a whiteout to duplicate. The tool still reuses
`pei_general_heading`'s `band()` -- a redaction, not a clip, so a detector
never sees the ink twice -- and its footer-aware margin math (`footer_top`,
`MARGIN_BOTTOM`), because a page being absorbed sometimes still carries its
own page-number stamp, and that stamp has to land with the content it
belongs to, not be left behind or overwritten.

**A front-trim is the one exception**, for a page whose own tail is too full
to take a whole neighbour but whose *head* can be cut cleanly onto the page in
front of it -- `validate_cut`, reused from `pei_answer_space`, is what proves
the cut is clean. The head moves up as its own band, exactly like a merge; the
tail that stays behind is re-placed at the top margin the head used to start
on, closing the gap. Trimming a page's head can free enough of its own tail
that the page *behind* it now qualifies for an ordinary whole-page merge --
that cascade is not automatic, it is a second `PLAN` entry, but it is why a
front-trim is always applied before the merges that follow it.

Both compose as the fourth link in `repair_pei_fields._translate`, after
`pei_general_heading`, `pei_answer_space` and `pei_inline_name_rules`: this
pass's own `shifted()`/`page_for()` read the page as those three left it, and
a front-trim's own translation runs first, since it always runs first on the
page.

    python3 pei_repaginate.py --check
    python3 pei_repaginate.py --only PEISC_70DD
"""
import argparse
import json
import os
import sys

import fitz

import pei_general_heading as PGH
import pei_answer_space as PAS

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = PGH.EXPORT
SCALE = PGH.SCALE

SHIFTS = os.path.join(HERE, "repaginate_shifts.json")
FRONTCUT_SHIFTS = os.path.join(HERE, "frontcut_shifts.json")
ANSWER_BAND_SHIFTS = os.path.join(HERE, "answer_band_shifts.json")

# What a merge drops onto -- the gap between the keep page's own last content
# and the paper it is absorbing, and the gap that paper's own tail must still
# clear before whatever comes after it (its own footer, if it carries one, or
# the keep page's own footer, if it already had one before this pass ran).
# Kept small and explicit per merge, in the same spirit as the small
# `PAD`/`GAP` constants the rest of this batch already reads off real
# clearances rather than inventing a single number for every page: the room
# here is measured in single points, not the 9-12pt this batch spends where
# a whole page is free to give it.
DEFAULT_BEFORE_GAP = 12.0
DEFAULT_FOOTER_GAP = 6.0

# `repair_pei_fields.caption_near` reads a caption below a rule from up to
# 20pt away. A merge that happens to land its first line inside that window,
# below a rule the live `pass_blanks` detector was already reading as
# uncaptioned, changes what that detector reports -- not because anything on
# the page it already owned moved, but because a caption that had spilled onto
# the page behind it comes back into range. Real when it happens (Form 70D's
# "Signature of lawyer" rule gets its own caption back), but out of scope for
# a pass whose only job is moving paper: `repair_pei_fields.py --check` is a
# gate on this pass precisely because it must report nothing new. Every
# `beforeGap` in `PLAN` therefore clears this window.
CAPTION_WINDOW = 20.0

# (docId, keepPage, dropPage, beforeGap, footerGap, note)
#   keepPage keeps its own number and gains dropPage's entire content on its
#   own tail; dropPage is deleted and every later page renumbers back by one.
PLAN = [
    ("PEISC_70DD", 1, 2, 1.5, 4.0,
     "the Respondent's name/address/phone/email block, which had a page to "
     "itself for one printed line"),
    ("PEISC_71E", 2, 3, DEFAULT_BEFORE_GAP, DEFAULT_FOOTER_GAP,
     "the Date/Issued by/Address of court office block that closed the form"),
    # A wider before-gap than the rest of this PLAN: page 2's own last rule
    # (Date ___ / Signature of lawyer ___, at y1 469.94) was left uncaptioned
    # by the spill this pass undoes -- `repair_pei_fields.caption_near` reads
    # up to CAPTION_WINDOW below a rule for its caption, and page 3's own
    # "Signature of lawyer / Name:" line is exactly that caption, arriving
    # back on the same page for the first time since the spill. Landed any
    # closer than the window, it re-captions that rule and `pass_blanks`
    # stops flagging it -- true, but a second pass's job, not this one's; see
    # CAPTION_WINDOW.
    ("PEISC_70D", 2, 3, CAPTION_WINDOW + 2.0, DEFAULT_FOOTER_GAP,
     "the lawyer's own Name/Address/Phone/Email rules, the tail of the "
     "Statement of Lawyer"),
    ("PEISC_70R", 2, 3, DEFAULT_BEFORE_GAP, DEFAULT_FOOTER_GAP,
     "items 5 through 10 -- grounds for divorce through Notice to "
     "Petitioner -- which restores the form's own original page 2"),
    ("PEISC_70A_JOINT", 4, 5, DEFAULT_BEFORE_GAP, DEFAULT_FOOTER_GAP,
     "item 32's remaining child-support options, which restores the form's "
     "own original page 4"),
    # Page 8's own content -- the closing Date/Signature rule for Spouse
    # Two's Statement of Lawyer -- is 26pt, and page 7 only has room for it
    # once its own front-trim (below) has run: that cut opens 95.83pt at
    # page 7's own tail, which is what this merge lands in. Composed, not
    # coincidental -- see FRONT_TRIM.
    ("PEISC_70A_JOINT", 7, 8, DEFAULT_BEFORE_GAP, DEFAULT_FOOTER_GAP,
     "the closing Date/Signature rule for Spouse Two's lawyer, the very "
     "last line of the Statement of Lawyer"),
]

# (docId, sourcePage, keepPage, cutY, beforeGap, note)
#   Everything on sourcePage above cutY moves onto keepPage's own tail, band
#   for band, the same as a whole-page merge. Everything at or below cutY
#   stays on sourcePage, shifted up to close the gap -- its first line lands
#   where the moved head used to start, so the page keeps its own original
#   top margin rather than acquiring a new one.
FRONT_TRIM = [
    # Form 70A's page 8 closes with item 37's heading while page 9 starts
    # with the question and answer area that belong to it.  The whole item is
    # clear of item 38 by 9.9pt, so it can come back to its heading without
    # touching the following disclosure section or its field.
    ("PEISC_70A", 9, 8, 220.0, DEFAULT_BEFORE_GAP,
     "item 37's question and answer area"),
    # 70A*'s page 7 opens with two complete signature blocks -- Date/
    # Signature rule, then Name/Address/Phone/Email and its caption -- one
    # for each spouse, before "STATEMENT OF LAWYER FOR SPOUSE ONE" begins.
    # The two blocks read as one continuous run in the text layer (the
    # caption closing Spouse Two's block overlaps the heading's own line by
    # 1.3pt, so no cut is possible between them), but the *gap between the
    # two spouses' blocks* is a clean 13.01pt -- text, art and every field on
    # the page are clear of it. Only Spouse One's block moves; Spouse Two's
    # stays with the heading it already touches.
    ("PEISC_70A_JOINT", 7, 6, 193.5, DEFAULT_BEFORE_GAP,
     "Spouse One's own Date/Signature and Name/Address/Phone/Email block"),
]

# (docId, page, cutY, addedHeight, x0, x1, fieldId, note)
#
# These are the few narrative areas found only after a previous continuation
# left the prompt and its following section on the same page.  Unlike the
# old overlay-only repair, this inserts real paper first, so the field cannot
# cover the court text below it.  The existing answer-space pass owns source
# pages; this late pass owns their already-reflowed final page numbers.
ANSWER_BANDS = [
    ("PEISC_70A", 10, 145.0, 200.0, 122.5, 506.6, 1750805871179,
     "item 42, condonation or connivance details"),
]


def load_shifts():
    return json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}


def entries_for(doc_id):
    return load_shifts().get(doc_id, [])


def load_frontcut_shifts():
    return json.load(open(FRONTCUT_SHIFTS)) if os.path.exists(FRONTCUT_SHIFTS) else {}


def frontcut_entries_for(doc_id):
    return load_frontcut_shifts().get(doc_id, [])


def load_answer_band_shifts():
    return json.load(open(ANSWER_BAND_SHIFTS)) if os.path.exists(ANSWER_BAND_SHIFTS) else {}


def answer_band_entries_for(doc_id):
    return load_answer_band_shifts().get(doc_id, [])


def record_frontcut(doc_id, source_page, keep_page, cut_y, shift_above, shift_below):
    shifts = load_frontcut_shifts()
    rows = [e for e in shifts.get(doc_id, []) if e["sourcePage"] != source_page]
    rows.append({"sourcePage": source_page, "keepPage": keep_page,
                "cutY": round(cut_y, 2), "shiftAbove": round(shift_above, 2),
                "shiftBelow": round(shift_below, 2)})
    shifts[doc_id] = sorted(rows, key=lambda e: e["sourcePage"])
    with open(FRONTCUT_SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2, sort_keys=True)


def record_answer_band(doc_id, page_no, cut_y, shift):
    shifts = load_answer_band_shifts()
    rows = [e for e in shifts.get(doc_id, []) if e["page"] != page_no]
    rows.append({"page": page_no, "cutY": round(cut_y, 2),
                 "shift": round(shift, 2)})
    shifts[doc_id] = sorted(rows, key=lambda e: e["page"])
    with open(ANSWER_BAND_SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2, sort_keys=True)


def _frontcut_translate(doc_id, page_no, y):
    """(page, y) after a front-trim, before any whole-page merge.

    Runs first in the composition, because a front-trim always runs first on
    the page it touches -- see `FRONT_TRIM`'s own docstring note on why a
    merge that depends on one is a separate, later `PLAN` entry.
    """
    for entry in frontcut_entries_for(doc_id):
        if entry["sourcePage"] != page_no:
            continue
        if y < entry["cutY"] - 0.01:
            return entry["keepPage"], round(y + entry["shiftAbove"], 2)
        return page_no, round(y + entry["shiftBelow"], 2)
    return page_no, y


def _answer_band_translate(doc_id, page_no, y):
    """Translate a coordinate through a late, same-page answer-band insert."""
    for entry in answer_band_entries_for(doc_id):
        if entry["page"] == page_no and y >= entry["cutY"] - 0.01:
            return round(y + entry["shift"], 2)
    return y


def shifted(doc_id, page_no, y):
    """Move one y measured on the page as `pei_inline_name_rules` left it.

    A page's content is dropped onto a keep page at most once -- a keep
    page's own tail is only ever added to, never itself dropped in a later
    merge -- so the first (and only) entry whose `dropPage` matches is the
    answer, regardless of how many merges this document has been through.
    """
    page_no, y = _frontcut_translate(doc_id, page_no, y)
    for entry in entries_for(doc_id):
        if entry["dropPage"] == page_no:
            return _answer_band_translate(doc_id, page_no,
                                           round(y + entry["shift"], 2))
    return _answer_band_translate(doc_id, page_no, y)


def page_for(doc_id, page_no, y):
    """The page a (page, y) measured before this pass now lives on.

    Walked entry by entry **in the order the merges were actually applied**,
    not sorted by page number: each entry's own `dropPage`/`keepPage` are
    numbers as they stood right before that merge ran, which is a numbering
    only the entries before it in application order have already disturbed.
    70A_JOINT is the case that forces this -- its second merge (page 7 onto
    page 8's old numbering) only exists because the first merge had already
    renumbered the document once, and a page-count-keyed remap (this file's
    first design) silently mixed the two numberings together.
    """
    page_no, y = _frontcut_translate(doc_id, page_no, y)
    for entry in entries_for(doc_id):
        if page_no == entry["dropPage"]:
            page_no = entry["keepPage"]
        elif page_no > entry["dropPage"]:
            page_no -= 1
    return page_no


def record(doc_id, keep_page, drop_page, shift):
    """Append one merge, in application order -- never re-sorted.

    `page_for`'s walk depends on `entries_for` returning merges in the order
    they actually ran, which page-number order does not always match once a
    document has had more than one (see `page_for`'s own note).
    """
    shifts = load_shifts()
    rows = [e for e in shifts.get(doc_id, []) if e["dropPage"] != drop_page]
    rows.append({"keepPage": keep_page, "dropPage": drop_page, "shift": round(shift, 2)})
    shifts[doc_id] = rows
    with open(SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2)


# --------------------------------------------------------------- measuring

def content_span(page, footer_y, lo=None, hi=None):
    """(top, bottom) of every real block and the widest field, footer excluded.

    `lo`/`hi` bound the search to one side of a front-trim's own cut -- the
    same span this function already measured for a whole page, just narrowed.
    """
    tops, bottoms = [], []
    for b in page.get_text("blocks"):
        if not (b[6] == 0 and b[4].strip()):
            continue
        if footer_y is not None and b[1] >= footer_y - 0.1:
            continue
        if lo is not None and b[1] < lo - 0.01:
            continue
        if hi is not None and b[3] > hi + 0.01:
            continue
        tops.append(b[1])
        bottoms.append(b[3])
    if not tops:
        return None
    return min(tops), max(bottoms)


def field_span(mapping, page_no, footer_y, lo=None, hi=None):
    tops, bottoms = [], []
    for f in mapping["staticFields"]:
        if f["page"] != page_no:
            continue
        y0, y1 = f["y"], f["y"] + f["height"] / SCALE
        if footer_y is not None and y0 >= footer_y - 0.1:
            continue
        if lo is not None and y0 < lo - 0.01:
            continue
        if hi is not None and y1 > hi + 0.01:
            continue
        tops.append(y0)
        bottoms.append(y1)
    if not tops:
        return None
    return min(tops), max(bottoms)


def full_span(page, mapping, page_no, footer_y, lo=None, hi=None):
    spans = [s for s in (content_span(page, footer_y, lo, hi),
                         field_span(mapping, page_no, footer_y, lo, hi))
            if s is not None]
    if not spans:
        return None
    return min(s[0] for s in spans), max(s[1] for s in spans)


# --------------------------------------------------------------- rebuilding

def rebuild(doc, keep_page, drop_page, shift):
    """Shift `drop_page` wholesale onto `keep_page`'s own tail, then drop it."""
    keep = doc[keep_page - 1]
    drop = doc[drop_page - 1]
    w, h = keep.rect.width, keep.rect.height
    dw, dh = drop.rect.width, drop.rect.height

    piece = PGH.band(doc, drop_page, fitz.Rect(0, 0, dw, dh))
    keep.show_pdf_page(fitz.Rect(0, shift, w, max(h, dh + shift)), piece, 0)
    piece.close()

    bottom = max((b[3] for b in keep.get_text("blocks") if b[6] == 0 and b[4].strip()),
                default=0)
    if bottom > h - PGH.MARGIN_BOTTOM + 0.01:
        raise ValueError("page %d overflows its bottom margin: %.2f" % (keep_page, bottom))

    doc.delete_page(drop_page - 1)


def rebuild_front_trim(doc, source_page, keep_page, cut_y, shift_above, shift_below):
    """Move `source_page`'s head onto `keep_page`'s tail; close the gap it left.

    The tail's own page-number stamp, if it carries one, is a fourth band and
    does not move -- the same convention every reflow in this batch keeps for
    a footer, and the reason one is worth keeping here: shifting real content
    up while leaving the stamp exactly where it was is what turns "the gap
    this cut closed" into free paper *before* the stamp, which is the only
    room a later merge (page 8 onto this same page, in `PLAN`) has to land in.
    Shifting the stamp by the same amount would only relocate that free paper
    to below it, where nothing can reach it.
    """
    source = doc[source_page - 1]
    keep = doc[keep_page - 1]
    w, h = source.rect.width, source.rect.height
    kw, kh = keep.rect.width, keep.rect.height

    foot = PGH.footer_top(source, cut_y, h)
    body_end = foot if foot is not None else h

    above = PGH.band(doc, source_page, fitz.Rect(0, 0, w, cut_y))
    below = PGH.band(doc, source_page, fitz.Rect(0, cut_y, w, body_end))
    footer = PGH.band(doc, source_page, fitz.Rect(0, foot, w, h)) if foot is not None else None

    keep.show_pdf_page(fitz.Rect(0, shift_above, kw, max(kh, h + shift_above)), above, 0)
    above.close()
    keep_bottom = max((b[3] for b in keep.get_text("blocks") if b[6] == 0 and b[4].strip()),
                      default=0)
    if keep_bottom > kh - PGH.MARGIN_BOTTOM + 0.01:
        below.close()
        if footer is not None:
            footer.close()
        raise ValueError("page %d overflows its bottom margin: %.2f"
                         % (keep_page, keep_bottom))

    out = fitz.open()
    page = out.new_page(width=w, height=h)
    page.show_pdf_page(fitz.Rect(0, shift_below, w, h + shift_below), below, 0)
    below.close()
    if footer is not None:
        page.show_pdf_page(fitz.Rect(0, 0, w, h), footer, 0)   # unshifted
        footer.close()
    doc.delete_page(source_page - 1)
    doc.insert_pdf(out, from_page=0, to_page=0, start_at=source_page - 1,
                   links=False, annots=False)
    out.close()


def shift_front_trim_fields(mapping, source_page, keep_page, cut_y, shift_above, shift_below):
    """Move every field on `source_page` by whichever band it sits in."""
    moved, kept = [], []
    for field in mapping["staticFields"]:
        if field["page"] != source_page:
            continue
        y0, y1 = field["y"], field["y"] + field["height"] / SCALE
        if y1 <= cut_y + 0.01:
            field["page"] = keep_page
            field["y"] = round(field["y"] + shift_above, 2)
            moved.append(field["id"])
        elif y0 >= cut_y - 0.01:
            field["y"] = round(field["y"] + shift_below, 2)
            kept.append(field["id"])
        else:
            raise ValueError("field %d straddles the front-trim cut at %.2f"
                             % (field["id"], cut_y))
    return moved, kept


def refit_ticks(doc_id, mapping, doc, field_ids):
    """`pei_answer_space.refit_ticks`, scoped to the fields this merge moved.

    That pass scopes itself by *page*, which is right where a whole page was
    rebuilt and everything on it moved. Here only the absorbed page's own
    fields moved -- the keep page's own pre-existing fields are untouched --
    so scoping by page would also "fix" any pre-existing rounding on a
    checkbox this pass never touched, which is exactly the kind of drift
    `repair_pei_fields.py --check` exists to catch.
    """
    sys.path.insert(0, os.path.join(os.path.dirname(HERE), "review"))
    from repair_pei_fields import pass_fit_ticks  # noqa: E402  (late: cycle)

    fixed = 0
    by_id = {f["id"]: f for f in mapping["staticFields"]}
    for field_id, target in pass_fit_ticks(doc_id, mapping, doc, set()).items():
        if field_id not in field_ids:
            continue
        field = by_id.get(field_id)
        if field is None:
            continue
        if any(abs(target[key] - field[key]) >= PAS.TICK_ROUNDING for key in target):
            continue
        field.update(target)
        fixed += 1
    return fixed


def shift_fields(mapping, keep_page, drop_page, shift):
    for field in mapping["staticFields"]:
        if field["page"] == drop_page:
            field["page"] = keep_page
            field["y"] = round(field["y"] + shift, 2)
        elif field["page"] > drop_page:
            field["page"] -= 1


def apply_front_trim(doc_id, source_page, keep_page, cut_y, before_gap, check):
    if any(e["sourcePage"] == source_page for e in frontcut_entries_for(doc_id)):
        print("%-16s p%d already trimmed, skipped" % (doc_id, source_page))
        return 0

    pdf_in = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_in = os.path.join(EXPORT, "%s.json" % doc_id)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))
    if not (1 <= keep_page < source_page <= doc.page_count):
        raise ValueError("%s: keep %d / trim %d out of range for %d pages"
                         % (doc_id, keep_page, source_page, doc.page_count))

    source = doc[source_page - 1]
    keep = doc[keep_page - 1]
    PAS.validate_cut(source, mapping, source_page, cut_y)
    source_foot = PGH.footer_top(source, cut_y, source.rect.height)

    above = full_span(source, mapping, source_page, None, hi=cut_y)
    if above is None:
        raise ValueError("%s p%d: nothing above %.2f to trim" % (doc_id, source_page, cut_y))
    above_top, _above_bottom = above
    # The stamp, if any, is excluded here and never moves (`rebuild_front_trim`):
    # the free paper this trim opens is between the shifted content and the
    # stamp's own fixed position, not below the stamp where nothing can use it.
    below = full_span(source, mapping, source_page, source_foot, lo=cut_y)
    if below is None:
        raise ValueError("%s p%d: nothing below %.2f left on the page" % (doc_id, source_page, cut_y))
    below_top, below_bottom = below

    keep_foot = PGH.footer_top(keep, 0, keep.rect.height)
    keep_span = full_span(keep, mapping, keep_page, keep_foot)
    if keep_span is None:
        raise ValueError("%s p%d: no content found to measure from" % (doc_id, keep_page))
    _keep_top, keep_bottom = keep_span

    target_top = keep_bottom + before_gap
    shift_above = round(target_top - above_top, 2)
    # The tail that stays behind is re-based to the same top margin the
    # trimmed head used to open the page with -- not an arbitrary new
    # position, the one this page already had.
    shift_below = round(above_top - below_top, 2)
    if shift_below >= 0:
        raise ValueError("%s p%d: front-trim shift is not upward (%.2f)"
                         % (doc_id, source_page, shift_below))

    limit = keep.rect.height - PGH.MARGIN_BOTTOM
    if keep_foot is not None:
        limit = min(limit, keep_foot - DEFAULT_FOOTER_GAP)
    new_bottom = round(_above_bottom + shift_above, 2)

    # The tail's own sanity check: its content, shifted up, still has to clear
    # its own unmoved stamp (or the sheet's own margin, if it has none).
    tail_limit = source.rect.height - PGH.MARGIN_BOTTOM
    if source_foot is not None:
        tail_limit = min(tail_limit, source_foot - DEFAULT_FOOTER_GAP)
    new_tail_bottom = round(below_bottom + shift_below, 2)
    opened = round((source_foot if source_foot is not None else source.rect.height)
                   - DEFAULT_FOOTER_GAP - new_tail_bottom, 2)

    print("%-16s p%d head <- p%d: shift %.2f, lands at %.2f (limit %.2f); "
         "p%d tail shift %.2f, lands at %.2f, opens %.2fpt at its own tail%s"
         % (doc_id, keep_page, source_page, shift_above, new_bottom, limit,
            source_page, shift_below, new_tail_bottom, opened,
            "" if new_bottom <= limit + 0.01 else "  OVERFLOW"))
    if new_bottom > limit + 0.01:
        raise ValueError("%s: p%d's head onto p%d overflows by %.2fpt"
                         % (doc_id, source_page, keep_page, new_bottom - limit))
    if new_tail_bottom > tail_limit + 0.01:
        raise ValueError("%s: p%d's own tail overflows by %.2fpt after trimming"
                         % (doc_id, source_page, new_tail_bottom - tail_limit))
    if check:
        doc.close()
        return 1

    rebuild_front_trim(doc, source_page, keep_page, cut_y, shift_above, shift_below)
    moved, kept = shift_front_trim_fields(mapping, source_page, keep_page, cut_y,
                                          shift_above, shift_below)

    PGH.reseat(doc[keep_page - 1],
              [f for f in mapping["staticFields"]
               if f["page"] == keep_page and f["id"] in moved])
    PGH.reseat(doc[source_page - 1],
              [f for f in mapping["staticFields"]
               if f["page"] == source_page and f["id"] in kept])
    refit_ticks(doc_id, mapping, doc, set(moved) | set(kept))

    tmp = pdf_in + ".tmp"
    doc.save(tmp, deflate=True, garbage=3)
    doc.close()
    os.replace(tmp, pdf_in)
    with open(json_in, "w") as handle:
        json.dump(mapping, handle, indent=2)
    record_frontcut(doc_id, source_page, keep_page, cut_y, shift_above, shift_below)
    print("%-16s p%d trimmed, %d field(s) moved to p%d, %d kept"
         % (doc_id, source_page, len(moved), keep_page, len(kept)))
    return 1


# --------------------------------------------------------------------- main

def apply(doc_id, keep_page, drop_page, before_gap, footer_gap, check):
    if any(e["dropPage"] == drop_page for e in entries_for(doc_id)):
        print("%-16s p%d already merged, skipped" % (doc_id, drop_page))
        return 0

    pdf_in = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_in = os.path.join(EXPORT, "%s.json" % doc_id)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))
    old_count = doc.page_count
    if not (1 <= keep_page < drop_page <= old_count):
        raise ValueError("%s: keep %d / drop %d out of range for %d pages"
                         % (doc_id, keep_page, drop_page, old_count))

    keep = doc[keep_page - 1]
    drop = doc[drop_page - 1]
    keep_foot = PGH.footer_top(keep, 0, keep.rect.height)
    drop_foot = PGH.footer_top(drop, 0, drop.rect.height)

    keep_span = full_span(keep, mapping, keep_page, keep_foot)
    if keep_span is None:
        raise ValueError("%s p%d: no content found to measure from" % (doc_id, keep_page))
    _keep_top, keep_bottom = keep_span

    drop_span = full_span(drop, mapping, drop_page, drop_foot)
    if drop_span is None:
        raise ValueError("%s p%d: no content found to bring across" % (doc_id, drop_page))
    drop_top, _drop_bottom = drop_span

    target_top = keep_bottom + before_gap
    shift = round(target_top - drop_top, 2)

    # The ceiling this merge has to clear: the keep page's own footer if it
    # already had one (this pass never moves a page's own pre-existing
    # footer), else the sheet's ordinary bottom margin.
    limit = keep.rect.height - PGH.MARGIN_BOTTOM
    if keep_foot is not None:
        limit = min(limit, keep_foot - footer_gap)

    # What has to land under that ceiling: the dropped page's own content, or
    # -- where it carries its own page-number stamp -- that stamp's own
    # printed extent, since the whole page moves as one band and the stamp
    # becomes the merged page's own footer.
    if drop_foot is not None:
        landing = max(b[3] for b in drop.get_text("blocks")
                     if b[6] == 0 and b[4].strip() and b[1] >= drop_foot - 0.1)
    else:
        landing = drop_span[1]
    new_bottom = round(landing + shift, 2)

    print("%-16s p%d <- p%d: shift %.2f, lands at %.2f (limit %.2f)%s"
         % (doc_id, keep_page, drop_page, shift, new_bottom, limit,
            "" if new_bottom <= limit + 0.01 else "  OVERFLOW"))
    if new_bottom > limit + 0.01:
        raise ValueError("%s: p%d onto p%d overflows by %.2fpt"
                         % (doc_id, drop_page, keep_page, new_bottom - limit))
    if check:
        doc.close()
        return 1

    rebuild(doc, keep_page, drop_page, shift)
    dropped_fields = [f["id"] for f in mapping["staticFields"] if f["page"] == drop_page]
    shift_fields(mapping, keep_page, drop_page, shift)

    PGH.reseat(doc[keep_page - 1],
              [f for f in mapping["staticFields"]
               if f["page"] == keep_page and f["id"] in dropped_fields])
    refit_ticks(doc_id, mapping, doc, set(dropped_fields))

    tmp = pdf_in + ".tmp"
    doc.save(tmp, deflate=True, garbage=3)
    doc.close()
    os.replace(tmp, pdf_in)
    with open(json_in, "w") as handle:
        json.dump(mapping, handle, indent=2)
    record(doc_id, keep_page, drop_page, shift)
    print("%-16s merged: %d -> %d pages" % (doc_id, old_count, old_count - 1))
    return 1


def apply_answer_band(doc_id, page_no, cut_y, height, x0, x1, field_id, check):
    """Insert real paper for a late narrative field and re-seat its tail.

    This deliberately reuses the answer-space pass's band rebuild rather than
    placing a larger field over the existing page.  It is late only because
    the prompt reached this final page through earlier continuations.
    """
    if any(e["page"] == page_no for e in answer_band_entries_for(doc_id)):
        print("%-16s p%d answer band already spaced, skipped" % (doc_id, page_no))
        return 0

    pdf_in = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_in = os.path.join(EXPORT, "%s.json" % doc_id)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))
    if not 1 <= page_no <= doc.page_count:
        raise ValueError("%s: page %d out of range for %d pages"
                         % (doc_id, page_no, doc.page_count))

    field = next((f for f in mapping["staticFields"] if f["id"] == field_id), None)
    if field is None:
        raise ValueError("%s p%d: missing answer field %d" % (doc_id, page_no, field_id))
    if field["page"] != page_no:
        raise ValueError("%s: answer field %d is on page %d, not %d"
                         % (doc_id, field_id, field["page"], page_no))

    # The old field is an overlay placed on the free paper.  Remove it from
    # the measurement before proving the new cut, then add it back inside the
    # paper we create below the prompt.
    mapping["staticFields"].remove(field)
    page = doc[page_no - 1]
    PAS.validate_cut(page, mapping, page_no, cut_y)
    limit = PAS.usable_bottom(page, cut_y)
    if height < PAS.LINE_HEIGHT + 2 * PAS.PAD:
        raise ValueError("%s p%d: answer band is under one writing line" % (doc_id, page_no))

    page_fields = [(f["y"], f["y"] + f["height"] / SCALE)
                   for f in mapping["staticFields"] if f["page"] == page_no]
    PAS.scrub_whiteouts(doc, page_no, [(cut_y, height)])
    spill, _total = PAS.rebuild(doc, page_no, [(cut_y, height)], page_fields)
    if spill:
        raise ValueError("%s p%d: bounded answer band unexpectedly spilled" % (doc_id, page_no))
    PAS.shift_fields(mapping, page_no, [(cut_y, height)], spill)

    field.update({
        "type": "TextArea", "x": round(x0, 2), "y": round(cut_y + PAS.PAD, 2),
        "width": round((x1 - x0) * SCALE, 2),
        "height": round((height - 2 * PAS.PAD) * SCALE, 2),
        "fontSize": 9, "page": page_no,
    })
    mapping["staticFields"].append(field)
    mapping["staticFields"].sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))

    print("%-16s p%d item 42: +%.1fpt answer band, tail lands below %.2f%s"
          % (doc_id, page_no, height, limit,
             "  OVERFLOW" if max((b[3] for b in doc[page_no - 1].get_text("blocks")
                                  if b[6] == 0 and b[4].strip()), default=0) > limit + 0.01 else ""))
    if check:
        doc.close()
        return 1

    PGH.reseat(doc[page_no - 1],
               [f for f in mapping["staticFields"] if f["page"] == page_no and f["id"] != field_id])
    tmp = pdf_in + ".tmp"
    doc.save(tmp, deflate=True, garbage=3)
    doc.close()
    os.replace(tmp, pdf_in)
    with open(json_in, "w") as handle:
        json.dump(mapping, handle, indent=2)
    record_answer_band(doc_id, page_no, cut_y, height)
    print("%-16s p%d answer band added; field %d is %.1fpt wide"
          % (doc_id, page_no, field_id, x1 - x0))
    return 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = 0
    # Front-trims first: a merge in PLAN can depend on the tail room one of
    # them opens up (see PEISC_70A_JOINT's page 7 <- page 8 entry), so this
    # order is not cosmetic.
    for doc_id, source_page, keep_page, cut_y, before_gap, _note in FRONT_TRIM:
        if args.only and doc_id != args.only:
            continue
        changed += apply_front_trim(doc_id, source_page, keep_page, cut_y, before_gap, args.check)
    for doc_id, keep_page, drop_page, before_gap, footer_gap, _note in PLAN:
        if args.only and doc_id != args.only:
            continue
        changed += apply(doc_id, keep_page, drop_page, before_gap, footer_gap, args.check)
    for doc_id, page_no, cut_y, height, x0, x1, field_id, _note in ANSWER_BANDS:
        if args.only and doc_id != args.only:
            continue
        changed += apply_answer_band(doc_id, page_no, cut_y, height, x0, x1,
                                     field_id, args.check)
    print("%d %s" % (changed, "change(s) to make" if args.check else "change(s) made"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

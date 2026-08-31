"""Reclaim PEI continuation pages that carry almost nothing.

Rounds six, eight and ten made room by *sizing* an answer box, spilling
whatever followed it onto a fresh sheet. Some of those sheets came back
carrying only a few lines -- a signature block, a closing paragraph, the tail
of one item -- while the page immediately behind them still has hundreds of
points of clear paper below its own content. That is not a sizing problem;
it is a pagination problem, and the fix is the mirror image of a spill: pull
the *next* page's content up into the *previous* page's own tail, drop the
page that emptied out, and let every later page renumber back by one.

**Only whole-page absorptions are made here.** A page is dropped only when
its *entire* content -- top margin to its own footer, or to its own last
line where it has none -- fits, unshifted internally and never re-typeset,
into the clear paper already sitting below the page in front of it. No cut
is made through the middle of either page, so there is nothing for
`validate_cut` to refuse and nothing for a whiteout to duplicate: the whole
mechanism `pei_answer_space.py` needed for a mid-page cut does not apply
here. The tool still reuses `pei_general_heading`'s `band()` -- a redaction,
not a clip, so a detector never sees the ink twice -- and its footer-aware
margin math (`footer_top`, `MARGIN_BOTTOM`), because a page being absorbed
sometimes still carries its own page-number stamp, and that stamp has to
land with the content it belongs to, not be left behind or overwritten.

A merge composes as the fourth link in `repair_pei_fields._translate`, after
`pei_general_heading`, `pei_answer_space` and `pei_inline_name_rules`: this
pass's own `shifted()`/`page_for()` read the page as those three left it.

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
]


def load_shifts():
    return json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}


def entries_for(doc_id):
    return load_shifts().get(doc_id, {}).get("entries", [])


def shifted(doc_id, page_no, y):
    """Move one y measured on the page as `pei_inline_name_rules` left it."""
    for entry in entries_for(doc_id):
        if entry["dropPage"] == page_no:
            return round(y + entry["shift"], 2)
    return y


def _page_map(doc_id):
    data = load_shifts().get(doc_id)
    if not data:
        return None
    entries = data["entries"]
    old_count = data["oldCount"]
    drop_to_keep = {e["dropPage"]: e["keepPage"] for e in entries}
    new_num = {}
    counter = 0
    for old in range(1, old_count + 1):
        if old in drop_to_keep:
            continue
        counter += 1
        new_num[old] = counter
    return new_num, drop_to_keep


def page_for(doc_id, page_no, y):
    """The page a (page, y) measured before this pass now lives on."""
    mapped = _page_map(doc_id)
    if mapped is None:
        return page_no
    new_num, drop_to_keep = mapped
    if page_no in drop_to_keep:
        return new_num[drop_to_keep[page_no]]
    return new_num[page_no]


def record(doc_id, keep_page, drop_page, shift, old_count):
    shifts = load_shifts()
    data = shifts.get(doc_id, {"entries": [], "oldCount": old_count})
    data["entries"] = [e for e in data["entries"] if e["dropPage"] != drop_page]
    data["entries"].append({"keepPage": keep_page, "dropPage": drop_page,
                            "shift": round(shift, 2)})
    data["entries"].sort(key=lambda e: e["dropPage"])
    data["oldCount"] = old_count
    shifts[doc_id] = data
    with open(SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2, sort_keys=True)


# --------------------------------------------------------------- measuring

def content_span(page, footer_y):
    """(top, bottom) of every real block and the widest field, footer excluded."""
    tops, bottoms = [], []
    for b in page.get_text("blocks"):
        if b[6] == 0 and b[4].strip() and (footer_y is None or b[1] < footer_y - 0.1):
            tops.append(b[1])
            bottoms.append(b[3])
    if not tops:
        return None
    return min(tops), max(bottoms)


def field_span(mapping, page_no, footer_y):
    tops, bottoms = [], []
    for f in mapping["staticFields"]:
        if f["page"] != page_no:
            continue
        y0, y1 = f["y"], f["y"] + f["height"] / SCALE
        if footer_y is not None and y0 >= footer_y - 0.1:
            continue
        tops.append(y0)
        bottoms.append(y1)
    if not tops:
        return None
    return min(tops), max(bottoms)


def full_span(page, mapping, page_no, footer_y):
    spans = [s for s in (content_span(page, footer_y), field_span(mapping, page_no, footer_y))
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
    record(doc_id, keep_page, drop_page, shift, old_count)
    print("%-16s merged: %d -> %d pages" % (doc_id, old_count, old_count - 1))
    return 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = 0
    for doc_id, keep_page, drop_page, before_gap, footer_gap, _note in PLAN:
        if args.only and doc_id != args.only:
            continue
        changed += apply(doc_id, keep_page, drop_page, before_gap, footer_gap, args.check)
    print("%d %s" % (changed, "merge(s) to make" if args.check else "merge(s) made"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

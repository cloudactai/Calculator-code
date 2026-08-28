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

# Every field box on the block starts at the same x and is the same width,
# label-then-box like Ontario's own general heading (Form 12, Form 38's Court
# File Number box) rather than PEI's underscore-rule-with-caption-below-right.
# `BOX_INDENT` is fixed rather than computed from the longest label on a given
# form, so a page carrying the two-party rows and a page carrying the
# counterpetition rows besides still line their boxes up on the same x --
# "Respondent by Counterpetition:" (127.8pt at 10pt Times) is the longest
# label this block ever prints and still clears it by 17pt.
BOX_INDENT = 145.0

FIELD_ROW = 26.0            # box row to box row
CENTRE_ROW = 12.5            # one centred title line to the next
ROW_GAP = 8.0                # centred title block to the field row after it

# What each headed page was moved by, written at apply time and read by
# `tools/review/repair_pei_fields.py`, whose repair tables are absolute
# coordinates measured on the *shipped* page. Without this the claim slots
# named on 70A page 1 would be looked for 40pt above where they now sit and
# added a second time.
SHIFTS = os.path.join(HERE, "heading_shifts.json")

COURT = "Supreme Court of Prince Edward Island"
SECTION = "(Family Section)"
PROBE = COURT            # idempotence: the block is already on the page

# Which block each form gets. Rule 70 says "petitioner", Rule 71 says
# "applicant"; 70I(A) prints the compound on a Rule 70 form, so the compound is
# what PEI itself uses and what `pei_binds` matches as one label.
FORMS = {
    "PEISC_70A": {"seal": True},
}


def base14(bold=False):
    return "tibo" if bold else "tiro"


def width(text, bold=False, size=BODY):
    return fitz.get_text_length(text, fontname=base14(bold), fontsize=size)


def block_bottom(second_title=False):
    """The y offset, relative to the block's top, of its last drawn edge.

    Kept as its own function rather than a constant so `rebuild`'s `BLOCK_H`
    and `draw_block`'s own row arithmetic cannot drift apart -- the failure
    mode `pei_binds`' README warns about elsewhere in this batch, a number
    that matched what a tool produced rather than what the page needed.
    """
    y = FIELD_H
    y += ROW_GAP + CENTRE_ROW
    y += CENTRE_ROW
    y += ROW_GAP + FIELD_H
    y += FIELD_ROW
    if second_title:
        y += ROW_GAP + FIELD_H
        y += FIELD_ROW
    return y


def draw_block(page, left, right, top, seal, second_title=False):
    """Draw the heading and return the fields that belong on it.

    Label-then-box, Ontario's own convention (Form 12's and Form 38's Court
    File Number field is a bordered box, not a bare underscore rule) rather
    than PEI's own "rule, with the role captioned below it and to the right":
    every box on the block starts at the same `BOX_INDENT` and is the same
    width, so "Court File No.:", "Applicant/Petitioner:" and "Respondent:"
    line up on one edge and none of them is longer than another.
    """
    def text(x, y, s, bold=False, size=BODY, colour=(0, 0, 0)):
        page.insert_text(fitz.Point(x, y), s, fontsize=size,
                         fontname=base14(bold), color=colour)

    def centred(y, s, bold=False):
        text((left + right) / 2 - width(s, bold) / 2, y, s, bold)

    box_x0 = left + BOX_INDENT
    box_x1 = right

    def field_row(y, label, bind):
        text(left, y - 4.0, label)
        rect = fitz.Rect(box_x0, y - FIELD_H, box_x1, y)
        page.draw_rect(rect, color=(0, 0, 0), width=STROKE)
        return (rect, bind)

    fields = []
    y = top + FIELD_H
    fields.append(field_row(y, "Court File No.:", "court_info.courtFileNumber"))

    y += ROW_GAP + CENTRE_ROW
    centred(y, COURT, bold=True)
    y += CENTRE_ROW
    centred(y, SECTION, bold=True)

    y += ROW_GAP + FIELD_H
    fields.append(field_row(y, "Applicant/Petitioner:", "applicant.fullLegalName"))
    y += FIELD_ROW
    fields.append(field_row(y, "Respondent:", "respondent.fullLegalName"))

    if second_title:
        y += ROW_GAP + FIELD_H
        centred(y - FIELD_H - 2.0, "AND BETWEEN:", bold=True)
        y += FIELD_H
        fields.append(field_row(y, "Petitioner by Counterpetition:", None))
        y += FIELD_ROW
        fields.append(field_row(y, "Respondent by Counterpetition:", None))

    if seal:
        # A reserved area, not a seal: an empty ring where PEI prints
        # "(Court seal)", carrying no field -- the registry stamps it. Sized
        # to the gap between the file-number row and the centred court name
        # so it clears the "Court File No." label above and the
        # "Applicant/Petitioner" label below.
        seal_top = top + FIELD_H + ROW_GAP
        centre = fitz.Point(left + 24.0, seal_top + CENTRE_ROW)
        page.draw_circle(centre, 19.0, color=(0.55, 0.55, 0.55), width=0.6)
        cap = "Court seal"
        page.insert_text(fitz.Point(centre.x - width(cap, size=6) / 2,
                                    centre.y + 2.0), cap,
                         fontsize=6, fontname=base14(), color=(0.55, 0.55, 0.55))

    return [(rect, bind) for rect, bind in fields if bind]


def record_shift(doc_id, page_no, hold_top, hold_bottom, lift, drop):
    shifts = json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}
    shifts[doc_id] = {"page": page_no, "holdTop": round(hold_top, 2),
                      "holdBottom": round(hold_bottom, 2),
                      "lift": lift, "drop": drop}
    with open(SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2, sort_keys=True)


def shift_for(doc_id, page_no):
    """(hold_top, hold_bottom, lift, drop) for a headed page, or None."""
    if not os.path.exists(SHIFTS):
        return None
    entry = json.load(open(SHIFTS)).get(doc_id)
    if not entry or entry["page"] != page_no:
        return None
    return entry["holdTop"], entry["holdBottom"], entry["lift"], entry["drop"]


def shifted(doc_id, page_no, y):
    """Move one measured y from the pre-heading page onto the shipped page."""
    entry = shift_for(doc_id, page_no)
    if entry is None:
        return y
    hold_top, hold_bottom, lift, drop = entry
    if y <= hold_top:
        return round(y - lift, 2)
    if y >= hold_bottom:
        return round(y + drop, 2)
    return y


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


def measure(page):
    """The page's own margins and the placeholder band, read off the page."""
    words = [w for w in page.get_text("words") if w[4].strip()]
    left = min(w[0] for w in words)
    right = max(w[2] for w in words)
    blocks = page.get_text("blocks")
    holder = [b for b in blocks if "General heading" in b[4]]
    if len(holder) != 1:
        raise ValueError("expected exactly one (General heading) block")
    holder = holder[0]
    title_top = min(b[1] for b in blocks)
    # Cut below the placeholder's descenders, not on its reported bottom edge:
    # a text block's box stops at the baseline's descent and the glyphs of
    # "(General heading)" print a hair past it, so clipping on holder[3] leaves
    # a grey sliver at the top of the shifted band. Halfway to the next block
    # is blank paper on every form in this batch.
    below = min((b[1] for b in blocks if b[1] > holder[3]), default=holder[3] + 1)
    return left, right, title_top, holder[1], (holder[3] + below) / 2


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
           second_title=False):
    """Rebuild the page from three bands and return (block fields, shifts)."""
    source = doc[page_no - 1]
    w, h = source.rect.width, source.rect.height
    lift = title_top - PAGE_TOP                    # band A moves up by this
    # The block sits under the lifted title, not under the lifted placeholder.
    title_bottom = max(b[3] for b in source.get_text("blocks") if b[3] <= hold_top)
    top = title_bottom - lift + GAP
    drop = (top + block_bottom(second_title) + GAP) - hold_bottom  # band C

    # Whole points at two decimals, so a shifted box lands exactly where it
    # sat relative to its rule and `pass_seat_flat` has nothing to correct.
    lift, drop = round(lift, 2), round(drop, 2)

    out = fitz.open()
    page = out.new_page(width=w, height=h)
    above = band(doc, page_no, fitz.Rect(0, 0, w, hold_top))
    below = band(doc, page_no, fitz.Rect(0, hold_bottom, w, h))
    page.show_pdf_page(fitz.Rect(0, -lift, w, h - lift), above, 0)
    page.show_pdf_page(fitz.Rect(0, drop, w, h + drop), below, 0)
    above.close()
    below.close()
    fields = draw_block(page, left, right, top, seal, second_title)

    bottom = max(b[3] for b in page.get_text("blocks"))
    if bottom > h - 60.0:
        raise ValueError("page 1 overflows its bottom margin: %.1f" % bottom)

    doc.delete_page(page_no - 1)
    doc.insert_pdf(out, from_page=0, to_page=0,
                   start_at=page_no - 1, links=False, annots=False)
    return fields, lift, drop


def shift_fields(mapping, page_no, hold_top, hold_bottom, lift, drop):
    for field in mapping["staticFields"]:
        if field["page"] != page_no:
            continue
        if field["y"] + field["height"] / SCALE <= hold_top:
            field["y"] = round(field["y"] - lift, 2)
        elif field["y"] >= hold_bottom:
            field["y"] = round(field["y"] + drop, 2)
        else:
            raise ValueError("a field straddles the placeholder band")


def new_ids(mapping, count):
    base = max(f["id"] for f in mapping["staticFields"])
    return [base + 1 + i for i in range(count)]


def add_fields(mapping, page_no, placed):
    for field_id, (rect, bind) in zip(new_ids(mapping, len(placed)), placed):
        mapping["staticFields"].append({
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
            "bind": bind,
        })


def apply(doc_id, spec, out_dir, check):
    pdf_in = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_in = os.path.join(EXPORT, "%s.json" % doc_id)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))
    before = json.dumps(mapping["staticFields"], sort_keys=True)

    if PROBE in doc[0].get_text() or (
            out_dir and os.path.exists(os.path.join(out_dir, "%s.pdf" % doc_id))
            and PROBE in fitz.open(os.path.join(out_dir, "%s.pdf" % doc_id))[0].get_text()):
        print("%-12s already headed, skipped" % doc_id)
        return 0
    left, right, title_top, hold_top, hold_bottom = measure(doc[0])
    if check:
        print("%-12s would head: margins %.1f-%.1f, placeholder %.1f-%.1f"
              % (doc_id, left, right, hold_top, hold_bottom))
        return 1

    placed, lift, drop = rebuild(doc, 1, left, right, title_top,
                                 hold_top, hold_bottom, spec["seal"],
                                 spec.get("second_title", False))
    shift_fields(mapping, 1, hold_top, hold_bottom, lift, drop)
    moved = json.loads(before)
    assert len(moved) == len(mapping["staticFields"]), "no field may be dropped"
    # Reseated before the block's own boxes exist -- `rule_under` rasterises
    # the ink around each box, and a box drawn with a *centred* stroke (this
    # block's own, Ontario-style) reads its own border's ink as sitting half a
    # stroke width above its stored edge, which is not a float to correct but
    # a property of a field that draws its own complete border rather than
    # sitting over a separately-drawn rule. Only fields that were moved by the
    # band shift are genuine seating candidates here.
    reseat(doc[0], [f for f in mapping["staticFields"] if f["page"] == 1])
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
    record_shift(doc_id, 1, hold_top, hold_bottom, lift, drop)
    print("%-12s headed: title up %.1f, body down %.1f, +%d bound fields"
          % (doc_id, lift, drop, len(placed)))
    return 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--out-dir")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = 0
    for doc_id, spec in sorted(FORMS.items()):
        if args.only and doc_id != args.only:
            continue
        changed += apply(doc_id, spec, args.out_dir, args.check)
    print("%d form(s) %s" % (changed, "to change" if args.check else "changed"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

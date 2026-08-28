"""Draw a real general heading where PEI prints the instruction `(General heading)`.

22 of the 34 shipped PEI forms print that instruction and nothing else, so a
generated petition comes out with no court file number, no court, no party names
-- and the words "(General heading)" still on the client's copy. This tool
replaces the instruction with the style of cause the instruction is asking for.

**The block is transcribed from Form 70I(A), not invented.** PEI prints a full
style of cause on exactly two forms in this batch, and 70I(A) page 1 is the
model: `No.` right, the court and `(Family Section)` centred in bold, `Between:`
at the left margin, two underscore rules with the role captioned *below and to
the right* of each -- the PEI convention `pei_binds` reads. The one addition is a
**rule after `No.`**: PEI prints the file number over bare white space, which the
batch's golden rule correctly refuses to box, so the rule is what makes
`court_info.courtFileNumber` a legal bind rather than a special case.

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
RULE_W = 205.0             # 70I(A)'s party rule, measured
RULE_INDENT = 95.0         # its left edge, relative to the page's own margin
FIELD_H = 13.3             # 9pt field, the height 70I(A)'s party boxes carry
STROKE = 0.7               # the rule width `repair_pei_background` draws with

# Offsets from the block's top. Tighter than 70I(A)'s own 127pt -- the air
# between its party rules is cut from 46pt to 38 -- because the difference is
# whole forms not needing a continuation page.
Y_NUMBER = 10.0
Y_COURT = 21.5
Y_SECTION = 32.6
Y_BETWEEN = 43.7
Y_RULE1 = 59.7
Y_ROLE1 = 70.8
Y_AND = 81.9
Y_RULE2 = 97.9
Y_ROLE2 = 109.0
BLOCK_H = 112.0

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


def draw_block(page, left, right, top, seal):
    """Draw the heading and return the fields that belong on it."""
    def text(x, dy, s, bold=False, size=BODY, colour=(0, 0, 0)):
        page.insert_text(fitz.Point(x, top + dy), s, fontsize=size,
                         fontname=base14(bold), color=colour)

    def centred(dy, s, bold=False):
        text((left + right) / 2 - width(s, bold) / 2, dy, s, bold)

    def rule(dy, x0, x1):
        page.draw_line(fitz.Point(x0, top + dy), fitz.Point(x1, top + dy),
                       color=(0, 0, 0), width=0.7)

    # No. ______________  -- the rule PEI does not print, so the file number
    # has a printed anchor and can be bound.
    number_x1 = right
    number_x0 = right - 140.0
    text(number_x0 - 4 - width("No."), Y_NUMBER - 0.5, "No.")
    rule(Y_NUMBER, number_x0, number_x1)

    centred(Y_COURT, COURT, bold=True)
    centred(Y_SECTION, SECTION, bold=True)
    text(left, Y_BETWEEN, "Between:")

    rx0 = left + RULE_INDENT
    rx1 = rx0 + RULE_W
    rule(Y_RULE1, rx0, rx1)
    text(right - width("Applicant/Petitioner"), Y_ROLE1, "Applicant/Petitioner")
    text((rx0 + rx1) / 2 - width("and") / 2, Y_AND, "and")
    rule(Y_RULE2, rx0, rx1)
    text(right - width("Respondent"), Y_ROLE2, "Respondent")

    if seal:
        # A reserved area, not a seal: an empty ring where PEI prints
        # "(Court seal)", carrying no field -- the registry stamps it.
        centre = fitz.Point(left + 30.0, top + 76.0)
        page.draw_circle(centre, 27.0, color=(0.55, 0.55, 0.55), width=0.6)
        cap = "Court seal"
        page.insert_text(fitz.Point(centre.x - width(cap, size=7) / 2,
                                    centre.y + 2.5), cap,
                         fontsize=7, fontname=base14(), color=(0.55, 0.55, 0.55))

    # Seated on the rule's **top edge**, not its centre: `rule_under` in
    # `repair_pei_fields` reads a stroke's bounding box, so a box seated on the
    # centre line reads as 0.35pt of float and `pass_seat_flat` would move it.
    seat = STROKE / 2.0
    return [
        (fitz.Rect(number_x0, top + Y_NUMBER - seat - FIELD_H,
                   number_x1, top + Y_NUMBER - seat),
         "court_info.courtFileNumber"),
        (fitz.Rect(rx0, top + Y_RULE1 - seat - FIELD_H, rx1, top + Y_RULE1 - seat),
         "applicant.fullLegalName"),
        (fitz.Rect(rx0, top + Y_RULE2 - seat - FIELD_H, rx1, top + Y_RULE2 - seat),
         "respondent.fullLegalName"),
    ]


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


def rebuild(doc, page_no, left, right, title_top, hold_top, hold_bottom, seal):
    """Rebuild the page from three bands and return (block fields, shifts)."""
    source = doc[page_no - 1]
    w, h = source.rect.width, source.rect.height
    lift = title_top - PAGE_TOP                    # band A moves up by this
    # The block sits under the lifted title, not under the lifted placeholder.
    title_bottom = max(b[3] for b in source.get_text("blocks") if b[3] <= hold_top)
    top = title_bottom - lift + GAP
    drop = (top + BLOCK_H + GAP) - hold_bottom     # band C moves down by this

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
    fields = draw_block(page, left, right, top, seal)

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
                                 hold_top, hold_bottom, spec["seal"])
    shift_fields(mapping, 1, hold_top, hold_bottom, lift, drop)
    moved = json.loads(before)
    assert len(moved) == len(mapping["staticFields"]), "no field may be dropped"
    add_fields(mapping, 1, placed)
    # After the new boxes exist, so the block's own three are seated by the
    # same reading as everything the shift moved.
    reseat(doc[0], [f for f in mapping["staticFields"] if f["page"] == 1])

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

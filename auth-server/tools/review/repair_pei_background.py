"""Small, PEI-only background corrections that cannot be expressed as fields.

The Word-source PDFs occasionally carry a drafting cue in addition to the
actual labelled answer line.  These masks remove only the duplicate cue from
the shipped background; they never touch legal prose or a real writing rule.

    python3 repair_pei_background.py --check
    python3 repair_pei_background.py
"""
import argparse
import json
import os
import tempfile

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))

# (document id, 1-based page, rectangle around the redundant printed cue)
# Form 70D has `(Date)` after the answer drafting instruction and then its
# actual `Dated __________` line immediately below.  The former is not an
# answer space and made the page look as though it required two dates.
MASKS = [
    ("PEISC_70D", 1, (106.0, 251.0, 136.5, 267.5)),
]

# A second, shorter printed blank the source repeats immediately after the
# first. Form 70A*'s items 20 and 21 both read "has resided in (municipality
# and province, state or country) _____, _________ since (date) ______" --
# two separate underscore runs before "since", not one. 70A's own equivalent
# item 20 prints the same shape without the comma between them, and there the
# two runs sit close enough that this batch's own detector already reads them
# as one continuous rule; here the comma splits them, and the second run
# carries no caption of its own anywhere on the page -- it duplicates the
# first blank's own answer rather than asking for a second one. Removed the
# same way `MASKS` above removes a duplicate printed cue, and its field with
# it (`DUPLICATE_BLANK_DROP` in `repair_pei_fields.py`).
DUPLICATE_BLANKS = [
    ("PEISC_70A_JOINT", 2, (440.0, 345.0, 484.5, 359.0)),
]

# A lawyer signature is not contact information.  Where the form provides a
# dedicated block beneath that signature, replace its dense parenthetical with
# compact labelled writing rules.
CONTACT_BLOCKS = [
    ("PEISC_70D", 1, (301.0, 634.0, 505.0, 673.0)),
    ("PEISC_70B", 2, (360.0, 482.0, 505.0, 513.0)),
]

# Form 70A gives the court-office address only 55pt after a long label.  Move
# the label left on the same baseline, preserving the form's typography, so
# the writing rule can be widened to 135pt without obscuring any printed text.
# (document, 1-based page, old-line rectangle, new label baseline, new rule
# baseline).  Every replacement uses the same 135pt answer rule.
COURT_ADDRESS_REFLOWS = [
    ("PEISC_70A", 1, (265.0, 504.0, 506.0, 520.0), 516.8, 518.0),
    # Shifted -50.57pt: pei_general_heading's box-format conversion pulled
    # everything below the old heading up when it replaced it (see
    # convert_70a_joint_heading.py, heading_shifts.json). This reflow itself
    # was already applied before that conversion; the coordinates just have
    # to move with the content they describe, or `has_court_address_reflow`
    # reads the old baseline, finds nothing there any more, and tries to
    # redo a reflow that's already on the page.
    ("PEISC_70A_JOINT", 1, (265.0, 272.43, 506.0, 289.43), 284.73, 285.93),
    ("PEISC_70B", 1, (265.0, 623.0, 506.0, 640.0), 635.1, 636.3),
    # Moved to page 2: this content was on 71E's page 1, past the general-
    # heading pass's own spill split, so it followed its tail onto the
    # continuation page that pass spliced in (heading_shifts.json). Same
    # reflow, same reason to move as 70A_JOINT's above -- content described
    # by a fixed coordinate has to follow it when the page reflows.
    ("PEISC_71E", 2, (265.0, 98.03, 506.0, 114.03), 109.73, 110.93),
]

# (zero-based page, split y, added height).  These are true reflows: the
# lower part of the printed page is shifted down intact, creating answer space
# rather than drawing an input over a heading or legal text.
PEISC_70A_PAGE_REFLOWS = ((1, 189.0, 30.0), (2, 176.0, 34.0))
NORMAL_DATE_FIELDS = {("PEISC_70A", 1750805871157), ("PEISC_70A", 1750805871159), ("PEISC_70A", 1750805871161), ("PEISC_70AA", 1750460040010), ("PEISC_70A_JOINT", 1750047614147), ("PEISC_70A_JOINT", 1750047614153), ("PEISC_70A_JOINT", 1750047614155), ("PEISC_70A_JOINT", 1750047614157), ("PEISC_70S", 1750131303020), ("PEISC_71E", 1750796887018)}

# Form 70B*'s respondent-signature instruction devoted four lines to contact
# details that the form already collects immediately below the signature.
# Keep the legally useful strike-out direction, but use the recovered paper to
# lower the signature rule and give a signer a clearer visual separation from
# the certification above it.
RESPONDENT_SIGNATURE_REFLOWS = [
    ("PEISC_70B_JOINT", 1, (220.0, 451.0, 523.0, 522.5)),
]

# The lawyer's signature rule sits directly above its contact block.  Move the
# complete right-hand signing block down together so the signature has a clear
# signing band without crowding the contact fields below it.
LAWYER_SIGNATURE_REFLOWS = [
    ("PEISC_70B_JOINT", 1, (350.0, 645.0, 523.0, 730.0), 30.0),
]
LAWYER_CONTACT_FIELD_IDS = {1750487331010, 1750487331011,
                            1750487331012, 1750487331013}

# On Form 70D, page 2, the lawyer signature rule originally shared the Date
# baseline, leaving no usable writing room above it.  The signature caption is
# already lower on the page, so only the rule needs to move.
LAWYER_SIGNATURE_LINE_RELOCATIONS = [
    ("PEISC_70D", 2, (350.0, 457.0, 505.0, 472.0), 489.0),
]

# Form 70E's footer Date rule spans almost the entire page, despite the date
# being a short value.  Reduce it to a conventional one-inch writing line.
DATE_RULE_SHORTENINGS = [
    ("PEISC_70E", 1, 600.38, 108.1, 504.2, 170.1),
]

# Form 70F has the same overlong footer date rule, but unlike 70E it also has
# an editable field seated on that rule.  Its field width must shrink with the
# printed rule.
DATE_FIELD_SHORTENINGS = [
    ("PEISC_70F", 1, 589.23, 108.1, 504.2, 218.1, 1750703948006),
]

# Form 70B's lawyer signature rule is followed by its contact block; retain
# the missing caption so the otherwise bare line has an unambiguous purpose.
MISSING_LAWYER_SIGNATURE_CAPTIONS = [
    ("PEISC_70B", 2, 678.0, 356.6, 501.6),
]

# Existing 70B* output already contains the first signature-spacing pass.
# Re-seat those two blocks once at their roomier final positions; fresh builds
# go straight to those positions through the tables above.
EXTRA_70B_JOINT_SIGNATURE_SPACE = ("PEISC_70B_JOINT", 1)


def has_duplicate_prompt(page, rect):
    # A text block can span the whole answer paragraph, so its geometry is too
    # broad for an idempotence check.  Match the exact standalone prompt.
    return any(word[4] == "(Date)" and rect.intersects(fitz.Rect(word[:4]))
               for word in page.get_text("words"))


def has_underscore_run(page, rect):
    """A word of nothing but underscores sitting inside `rect`.

    Matched at the word level (`set(w[4]) == {"_"}`), the same test
    `repair_pei_background.cap_date_rules` already uses to find a printed
    rule -- a run this short is always one word, never glued to a caption the
    way a label-and-rule pair elsewhere in this batch can be.
    """
    return any(set(word[4]) == {"_"} and rect.intersects(fitz.Rect(word[:4]))
               for word in page.get_text("words"))


def has_contact_caption(page, rect, doc_id):
    words = " ".join(
        word[4].lower() for word in page.get_text("words")
        if rect.intersects(fitz.Rect(word[:4])))
    return "email address of lawyer" in words


def has_court_address_reflow(page, label_baseline):
    return any(word[4] == "Address" and word[0] < 300
               and abs(word[1] - (label_baseline - 10.5)) < 3
               for word in page.get_text("words"))


def has_respondent_signature_prompt(page, rect):
    words = " ".join(word[4].lower() for word in page.get_text("words")
                     if rect.intersects(fitz.Rect(word[:4])))
    return "where the respondent acts" in words


def has_lawyer_signature_rule(page, rect):
    # The moved label remains inside the broad repair rectangle, so its old
    # baseline -- not merely its text -- is the idempotence marker.
    return any(word[4] == "Signature" and word[1] < 662.0
               and rect.intersects(fitz.Rect(word[:4]))
               for word in page.get_text("words"))


def has_lawyer_signature_line_at_date(page, rect):
    return any(set(word[4]) == {"_"} and word[0] > 350.0
               and rect.intersects(fitz.Rect(word[:4]))
               for word in page.get_text("words"))


def has_long_date_rule(page, baseline, start, end):
    return any(item[0] == "l" and abs(item[1].x - start) < 1.0
               and abs(item[2].x - end) < 1.0
               and abs(item[1].y - baseline) < 1.0
               for drawing in page.get_drawings() for item in drawing["items"])


def has_first_short_70e_date_rule(page):
    return any(item[0] == "l" and abs(item[1].x - 108.1) < 1.0
               and abs(item[2].x - 218.1) < 1.0
               and abs(item[1].y - 600.38) < 1.0
               for drawing in page.get_drawings() for item in drawing["items"])


def has_uncaptioned_lawyer_signature_rule(page, baseline, start, end):
    has_rule = any(item[0] == "l" and abs(item[1].x - start) < 1.0
                   and abs(item[2].x - end) < 1.0
                   and abs(item[1].y - baseline) < 1.0
                   for drawing in page.get_drawings() for item in drawing["items"])
    has_rule = has_rule or any(set(word[4]) == {"_"}
                               and abs(word[0] - start) < 2.0
                               and abs(word[1] - baseline) < 2.0
                               for word in page.get_text("words"))
    has_caption = any(word[4] == "Signature" and baseline < word[1] < baseline + 25
                      for word in page.get_text("words"))
    return has_rule and not has_caption


def has_first_signature_spacing_pass(page):
    respondent = any(word[4] == "Signature" and 473.0 < word[1] < 476.0
                     for word in page.get_text("words"))
    lawyer = any(word[4] == "Signature" and 663.0 < word[1] < 666.0
                 for word in page.get_text("words"))
    return respondent and lawyer


def has_lawyer_signature_artifact(page):
    return any(word[4] == "r" and word[0] > 520.0
               and 663.0 < word[1] < 666.0
               for word in page.get_text("words"))


def has_overflowing_lawyer_signature_caption(page):
    return any(word[4] == "Signature" and word[0] > 440.0
               and 675.0 < word[1] < 678.0
               for word in page.get_text("words"))


def draw_contact_rules(page, doc_id):
    labels = (("Name:", 304, 641, 337, 504),
              ("Address:", 304, 651, 343, 504),
              ("Phone:", 304, 661, 337, 385),
              ("Email:", 390, 661, 425, 504))
    if doc_id == "PEISC_70B":
        labels = (("Name:", 365, 491, 398, 504),
                  ("Address:", 365, 501, 404, 504),
                  ("Phone / email:", 365, 511, 438, 504))
    for label, lx, baseline, x0, x1 in labels:
        page.insert_text(fitz.Point(lx, baseline - 1), label, fontsize=6.3,
                         fontname="helv", color=(0, 0, 0))
        page.draw_line(fitz.Point(x0, baseline), fitz.Point(x1, baseline),
                       color=(0, 0, 0), width=0.7)


def draw_court_address_reflow(page, label_baseline, rule_baseline):
    page.insert_text(fitz.Point(274.0, label_baseline), "Address of court office",
                     fontsize=10, fontname="tiro", color=(0, 0, 0))
    page.draw_line(fitz.Point(369.0, rule_baseline), fitz.Point(504.0, rule_baseline),
                   color=(0, 0, 0), width=0.7)


def draw_respondent_signature_reflow(page):
    # Keep the Date rule where it is; only the respondent's signature rule
    # needs more room.  The compact instruction occupies the space released by
    # removing the duplicated contact-detail direction.
    page.draw_line(fitz.Point(378.1, 486.0), fitz.Point(513.1, 486.0),
                   color=(0, 0, 0), width=0.7)
    page.insert_text(fitz.Point(314.45, 498.0), "Signature of respondent",
                     fontsize=11, fontname="tiro", color=(0, 0, 0))
    page.insert_textbox(
        fitz.Rect(224.5, 501.0, 522.2, 534.0),
        "(Where the counterpetition does not include a claim for a divorce, "
        "strike out the statement of lawyer appearing below.)",
        fontsize=9.5, fontname="tiit", color=(0, 0, 0), align=fitz.TEXT_ALIGN_CENTER,
    )


def draw_lawyer_signature_reflow(page, delta):
    line_y = 646.75 + delta
    page.draw_line(fitz.Point(367.1, line_y), fitz.Point(522.1, line_y),
                   color=(0, 0, 0), width=0.7)
    page.insert_text(fitz.Point(433.3, 658.3 + delta), "Signature of lawyer",
                     fontsize=11, fontname="tiro", color=(0, 0, 0))
    for label, baseline, x0 in (
        ("Name:", 681.0 + delta, 404.0),
        ("Address:", 692.5 + delta, 410.0),
        ("Phone:", 704.0 + delta, 405.0),
        ("Email:", 715.5 + delta, 404.0),
    ):
        page.insert_text(fitz.Point(382.5, baseline - 0.1), label,
                         fontsize=9.3, fontname="tiro", color=(0, 0, 0))
        page.draw_line(fitz.Point(x0, baseline), fitz.Point(522.0, baseline),
                       color=(0, 0, 0), width=0.7)
    page.insert_textbox(
        fitz.Rect(382.5, 732.0 + delta, 522.0, 750.0 + delta),
        "(Name, address, telephone number and email address of lawyer)",
        fontsize=6.3, fontname="tiit", color=(0, 0, 0),
    )


def draw_lawyer_signature_line(page, baseline):
    page.draw_line(fitz.Point(356.6, baseline), fitz.Point(501.6, baseline),
                   color=(0, 0, 0), width=0.7)


def draw_short_date_rule(page, baseline, start, end):
    page.draw_line(fitz.Point(start, baseline), fitz.Point(end, baseline),
                   color=(0, 0, 0), width=0.7)
    page.insert_text(fitz.Point(108.1, 606.6), "(Date)", fontsize=6.3,
                     fontname="tiit", color=(0, 0, 0))
    page.insert_text(fitz.Point(358.44, 606.67), "Name:", fontsize=9.3,
                     fontname="tiro", color=(0, 0, 0))


def draw_short_date_field_rule(page, baseline, start, end):
    page.draw_line(fitz.Point(start, baseline), fitz.Point(end, baseline),
                   color=(0, 0, 0), width=0.7)
    page.insert_text(fitz.Point(108.1, 595.5), "(Date)", fontsize=6.3,
                     fontname="tiit", color=(0, 0, 0))


def draw_lawyer_signature_caption(page, baseline):
    page.insert_text(fitz.Point(423.3, baseline + 12.0), "Signature of lawyer",
                     fontsize=11, fontname="tiro", color=(0, 0, 0))


def shorten_date_field(doc_id, field_id, short_width):
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    with open(mapping_path) as handle:
        mapping = json.load(handle)
    for field in mapping["staticFields"]:
        if field["id"] == field_id:
            field["width"] = short_width
            with open(mapping_path, "w") as handle:
                json.dump(mapping, handle, indent=2)
            return
    raise KeyError("%s field %s not found" % (doc_id, field_id))


def shift_lawyer_contact_fields(doc_id, page_no, delta):
    """Keep the editable lawyer contact fields seated on their moved rules."""
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    with open(mapping_path) as handle:
        mapping = json.load(handle)
    moved = 0
    for field in mapping["staticFields"]:
        if field["page"] == page_no and field["id"] in LAWYER_CONTACT_FIELD_IDS:
            field["y"] = round(field["y"] + delta, 2)
            moved += 1
    if moved:
        with open(mapping_path, "w") as handle:
            json.dump(mapping, handle, indent=2)
    return moved


def draw_reflowed_answer_rules(page, page_index):
    if page_index == 1:
        # Replace the single cohabitation-date rule with the lower edge of the
        # new multi-line writing area.  Its caption remains directly above it.
        page.draw_rect(fitz.Rect(182.0, 170.0, 506.0, 185.0),
                       color=None, fill=(1, 1, 1), overlay=True)
        page.insert_text(fitz.Point(122.5, 183.4), "Date(s) of cohabitation",
                         fontsize=7, fontname="tiro", color=(0, 0, 0))
        page.draw_line(fitz.Point(122.5, 218.0), fitz.Point(504.0, 218.0),
                       color=(0, 0, 0), width=0.7)
    elif page_index == 2:
        # The original five-character rule after "because:" is replaced by
        # the bottom edge of the paragraph area below the prompt.
        page.draw_rect(fitz.Rect(466.0, 156.0, 496.0, 176.0),
                       color=None, fill=(1, 1, 1), overlay=True)
        page.draw_line(fitz.Point(144.1, 208.0), fitz.Point(504.0, 208.0),
                       color=(0, 0, 0), width=0.7)


def has_moved_70a_rules(page):
    expected = ((331.0, 357.0, 504.0), (192.0, 426.25, 276.0),
                (223.0, 595.0, 376.0))
    lines = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                lines.append((item[1], item[2]))
    return all(any(abs(start.x - x0) < 0.2 and abs(start.y - y) < 0.2
                       and abs(end.x - x1) < 0.2 and abs(end.y - y) < 0.2
                       for start, end in lines)
               for x0, y, x1 in expected)


def cap_date_rules(doc_id, doc, apply_changes):
    mapping = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))
    changed = 0
    for field in mapping["staticFields"]:
        if (doc_id, field["id"]) not in NORMAL_DATE_FIELDS:
            continue
        page = doc[field["page"] - 1]
        x0, y0 = field["x"], field["y"]
        x1, y1 = x0 + field["width"] / 1.5, y0 + field["height"] / 1.5
        baseline = y1 - .6
        if any(item[0] == "l" and abs(item[1].x-x0)<.3 and abs(item[2].x-x1)<.3 and abs(item[1].y-baseline)<.3 for d in page.get_drawings() for item in d["items"]):
            continue
        ends = [w[2] for w in page.get_text("words") if set(w[4]) == {"_"} and abs(w[0]-x0)<2 and y0-4 <= w[1] <= y1+4]
        ends += [item[2].x for d in page.get_drawings() for item in d["items"] if item[0] == "l" and abs(item[1].x-x0)<2 and abs(item[1].y-baseline)<3]
        old_x1 = max(ends, default=x1)
        if old_x1 <= x1 + 1:
            continue
        changed += 1
        if apply_changes:
            page.draw_rect(fitz.Rect(x1-.5,y0-1,old_x1+1,y1+2), color=None, fill=(1,1,1), overlay=True)
            page.draw_line(fitz.Point(x0,baseline), fitz.Point(x1,baseline), color=(0,0,0), width=.7)
    return changed


def draw_70a_moved_rules(page):
    """Place page-two writing rules directly beneath their relocated fields."""
    for old, start, end, baseline in (
        ((397.0, 344.0, 505.0, 359.0), 331.0, 504.0, 357.0),  # item 4
        ((214.0, 413.0, 278.0, 428.0), 192.0, 276.0, 426.25), # item 5
        ((322.0, 582.0, 386.0, 597.0), 223.0, 376.0, 595.0), # item 13
    ):
        page.draw_rect(fitz.Rect(old), color=None, fill=(1, 1, 1), overlay=True)
        page.draw_line(fitz.Point(start, baseline), fitz.Point(end, baseline),
                       color=(0, 0, 0), width=0.7)


def reflow_peisc_70a(doc):
    """Insert measured answer bands on pages 2 and 3 without scaling text."""
    if doc[1].rect.height > 800 or doc[2].rect.height > 800:
        return None
    rebuilt = fitz.open()
    by_page = {page_index: (split, delta)
               for page_index, split, delta in PEISC_70A_PAGE_REFLOWS}
    for page_index in range(doc.page_count):
        source = doc[page_index]
        details = by_page.get(page_index)
        if details is None:
            rebuilt.insert_pdf(doc, from_page=page_index, to_page=page_index)
            continue
        split, delta = details
        width, height = source.rect.width, source.rect.height
        page = rebuilt.new_page(width=width, height=height + delta)
        page.show_pdf_page(fitz.Rect(0, 0, width, split), doc, page_index,
                           clip=fitz.Rect(0, 0, width, split))
        page.show_pdf_page(fitz.Rect(0, split + delta, width, height + delta),
                           doc, page_index,
                           clip=fitz.Rect(0, split, width, height))
        draw_reflowed_answer_rules(page, page_index)
    return rebuilt


def repair(doc_id, apply_changes):
    path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    doc = fitz.open(path)
    changed = 0
    try:
        for did, page_no, coords in MASKS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            rect = fitz.Rect(coords)
            if not has_duplicate_prompt(page, rect):
                continue
            changed += 1
            if apply_changes:
                page.add_redact_annot(rect, fill=(1, 1, 1))
        for did, page_no, coords in DUPLICATE_BLANKS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            rect = fitz.Rect(coords)
            if not has_underscore_run(page, rect):
                continue
            changed += 1
            if apply_changes:
                page.add_redact_annot(rect, fill=(1, 1, 1))
        contacts = []
        for did, page_no, coords in CONTACT_BLOCKS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            rect = fitz.Rect(coords)
            if not has_contact_caption(page, rect, did):
                continue
            changed += 1
            contacts.append((page, did))
            if apply_changes:
                page.add_redact_annot(rect, fill=(1, 1, 1))
        court_addresses = []
        for did, page_no, coords, label_baseline, rule_baseline in COURT_ADDRESS_REFLOWS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            if has_court_address_reflow(page, label_baseline):
                continue
            changed += 1
            court_addresses.append((page, label_baseline, rule_baseline))
            if apply_changes:
                page.add_redact_annot(fitz.Rect(coords), fill=(1, 1, 1))
        respondent_signatures = []
        for did, page_no, coords in RESPONDENT_SIGNATURE_REFLOWS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            rect = fitz.Rect(coords)
            if not has_respondent_signature_prompt(page, rect):
                continue
            changed += 1
            respondent_signatures.append(page)
            if apply_changes:
                page.add_redact_annot(rect, fill=(1, 1, 1))
        lawyer_signatures = []
        for did, page_no, coords, delta in LAWYER_SIGNATURE_REFLOWS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            rect = fitz.Rect(coords)
            if not has_lawyer_signature_rule(page, rect):
                continue
            changed += 1
            lawyer_signatures.append((page, page_no, delta))
            if apply_changes:
                page.add_redact_annot(rect, fill=(1, 1, 1))
        lawyer_signature_lines = []
        for did, page_no, coords, baseline in LAWYER_SIGNATURE_LINE_RELOCATIONS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            rect = fitz.Rect(coords)
            if not has_lawyer_signature_line_at_date(page, rect):
                continue
            changed += 1
            lawyer_signature_lines.append((page, baseline))
            if apply_changes:
                page.add_redact_annot(rect, fill=(1, 1, 1))
        short_date_rules = []
        for did, page_no, baseline, start, end, short_end in DATE_RULE_SHORTENINGS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            if not has_long_date_rule(page, baseline, start, end):
                continue
            changed += 1
            short_date_rules.append((page, baseline, start, short_end))
            if apply_changes:
                # Cover the full original stroke so the vector line is removed
                # in one piece. The Date and Name captions share its narrow
                # row, and are re-set with the replacement rule below.
                page.add_redact_annot(fitz.Rect(104.0, 598.0, 506.0, 603.0), fill=(1, 1, 1))
        short_date_fields = []
        for did, page_no, baseline, start, end, short_end, field_id in DATE_FIELD_SHORTENINGS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            if not has_long_date_rule(page, baseline, start, end):
                continue
            changed += 1
            short_date_fields.append((page, baseline, start, short_end, field_id))
            if apply_changes:
                page.add_redact_annot(fitz.Rect(104.0, 587.0, 506.0, 592.0), fill=(1, 1, 1))
                page.add_redact_annot(fitz.Rect(378.0, 594.0, 506.0, 608.0), fill=(1, 1, 1))
        shorter_70e_date_rule = False
        if doc_id == "PEISC_70E":
            page = doc[0]
            if has_first_short_70e_date_rule(page):
                changed += 1
                shorter_70e_date_rule = True
                page.add_redact_annot(fitz.Rect(104.0, 598.0, 220.0, 603.0), fill=(1, 1, 1))
        missing_lawyer_captions = []
        for did, page_no, baseline, start, end in MISSING_LAWYER_SIGNATURE_CAPTIONS:
            if did != doc_id:
                continue
            page = doc[page_no - 1]
            if has_uncaptioned_lawyer_signature_rule(page, baseline, start, end):
                changed += 1
                missing_lawyer_captions.append((page, baseline))
        extra_signature_space = False
        if doc_id == EXTRA_70B_JOINT_SIGNATURE_SPACE[0]:
            page = doc[EXTRA_70B_JOINT_SIGNATURE_SPACE[1] - 1]
            if has_first_signature_spacing_pass(page):
                changed += 1
                extra_signature_space = True
                page.add_redact_annot(fitz.Rect(220.0, 472.0, 523.0, 525.0), fill=(1, 1, 1))
                page.add_redact_annot(fitz.Rect(350.0, 662.0, 523.0, 782.0), fill=(1, 1, 1))
        lawyer_signature_artifact = False
        if doc_id == "PEISC_70B_JOINT":
            page = doc[0]
            if has_lawyer_signature_artifact(page):
                changed += 1
                lawyer_signature_artifact = True
                page.add_redact_annot(fitz.Rect(524.0, 662.0, 532.0, 681.0), fill=(1, 1, 1))
        lawyer_caption_reposition = False
        if doc_id == "PEISC_70B_JOINT":
            page = doc[0]
            if has_overflowing_lawyer_signature_caption(page):
                changed += 1
                lawyer_caption_reposition = True
                page.add_redact_annot(fitz.Rect(430.0, 675.0, 535.0, 694.0), fill=(1, 1, 1))
        reflow = (doc_id == "PEISC_70A"
                  and doc[1].rect.height <= 800 and doc[2].rect.height <= 800)
        moved_rules = (doc_id == "PEISC_70A" and not reflow
                       and not has_moved_70a_rules(doc[1]))
        changed += (int(reflow) + int(moved_rules)
                    + cap_date_rules(doc_id, doc, apply_changes))
        if changed and apply_changes:
            for page in doc:
                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
            for page, did in contacts:
                draw_contact_rules(page, did)
            for page, label_baseline, rule_baseline in court_addresses:
                draw_court_address_reflow(page, label_baseline, rule_baseline)
            for page in respondent_signatures:
                draw_respondent_signature_reflow(page)
            for page, page_no, delta in lawyer_signatures:
                draw_lawyer_signature_reflow(page, delta)
                shift_lawyer_contact_fields(doc_id, page_no, delta)
            for page, baseline in lawyer_signature_lines:
                draw_lawyer_signature_line(page, baseline)
            for page, baseline, start, end in short_date_rules:
                draw_short_date_rule(page, baseline, start, end)
            for page, baseline, start, end, field_id in short_date_fields:
                draw_short_date_field_rule(page, baseline, start, end)
                shorten_date_field(doc_id, field_id, (end - start) * 1.5)
            if shorter_70e_date_rule:
                page = doc[0]
                page.draw_line(fitz.Point(108.1, 600.38), fitz.Point(170.1, 600.38),
                               color=(0, 0, 0), width=0.7)
                page.insert_text(fitz.Point(108.1, 606.6), "(Date)", fontsize=6.3,
                                 fontname="tiit", color=(0, 0, 0))
            for page, baseline in missing_lawyer_captions:
                draw_lawyer_signature_caption(page, baseline)
            if extra_signature_space:
                page = doc[EXTRA_70B_JOINT_SIGNATURE_SPACE[1] - 1]
                draw_respondent_signature_reflow(page)
                draw_lawyer_signature_reflow(page, 30.0)
                shift_lawyer_contact_fields(doc_id, 1, 12.0)
            if lawyer_caption_reposition:
                page = doc[0]
                page.draw_line(fitz.Point(367.1, 676.75), fitz.Point(522.1, 676.75),
                               color=(0, 0, 0), width=0.7)
                page.insert_text(fitz.Point(433.3, 688.3), "Signature of lawyer",
                                 fontsize=11, fontname="tiro", color=(0, 0, 0))
            rebuilt = reflow_peisc_70a(doc) if reflow else None
            if reflow:
                draw_70a_moved_rules(rebuilt[1])
            elif moved_rules:
                draw_70a_moved_rules(doc[1])
            fd, temp_path = tempfile.mkstemp(suffix=".pdf", dir=EXPORT)
            os.close(fd)
            try:
                (rebuilt or doc).save(temp_path, garbage=4, deflate=True)
                os.replace(temp_path, path)
            finally:
                if rebuilt is not None:
                    rebuilt.close()
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
    finally:
        doc.close()
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    total = 0
    for doc_id in sorted({row[0] for row in MASKS + DUPLICATE_BLANKS + CONTACT_BLOCKS + COURT_ADDRESS_REFLOWS + RESPONDENT_SIGNATURE_REFLOWS + LAWYER_SIGNATURE_REFLOWS + LAWYER_SIGNATURE_LINE_RELOCATIONS + DATE_RULE_SHORTENINGS + DATE_FIELD_SHORTENINGS + MISSING_LAWYER_SIGNATURE_CAPTIONS} | {did for did, _ in NORMAL_DATE_FIELDS}):
        count = repair(doc_id, not args.check)
        print("%s duplicate_prompts=%d" % (doc_id, count))
        total += count
    print(("would change" if args.check else "changed") + ": duplicate_prompts=%d" % total)


if __name__ == "__main__":
    main()

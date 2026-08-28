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
    ("PEISC_70A_JOINT", 1, (265.0, 323.0, 506.0, 340.0), 335.3, 336.5),
    ("PEISC_70B", 1, (265.0, 623.0, 506.0, 640.0), 635.1, 636.3),
    ("PEISC_71E", 1, (265.0, 655.0, 506.0, 671.0), 666.7, 667.9),
]

# (zero-based page, split y, added height).  These are true reflows: the
# lower part of the printed page is shifted down intact, creating answer space
# rather than drawing an input over a heading or legal text.
PEISC_70A_PAGE_REFLOWS = ((1, 189.0, 30.0), (2, 176.0, 34.0))
NORMAL_DATE_FIELDS = {("PEISC_70A", 1750805871157), ("PEISC_70A", 1750805871159), ("PEISC_70A", 1750805871161), ("PEISC_70AA", 1750460040010), ("PEISC_70A_JOINT", 1750047614147), ("PEISC_70A_JOINT", 1750047614153), ("PEISC_70A_JOINT", 1750047614155), ("PEISC_70A_JOINT", 1750047614157), ("PEISC_70S", 1750131303020), ("PEISC_71B", 1750731700008), ("PEISC_71B", 1750731700009), ("PEISC_71E", 1750796887018)}

FORM_71B_DUPLICATE_REGISTRAR = (459.0, 401.0, 510.0, 428.0)
FORM_71B_OPENING_SPLIT = 198.0
FORM_71B_OPENING_DELTA = 35.0
FORM_71B_TERMS_SOURCE_SPLIT = 316.0
FORM_71B_TERMS_DELTA = 95.0


def has_duplicate_prompt(page, rect):
    # A text block can span the whole answer paragraph, so its geometry is too
    # broad for an idempotence check.  Match the exact standalone prompt.
    return any(word[4] == "(Date)" and rect.intersects(fitz.Rect(word[:4]))
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


def has_duplicate_71b_registrar(page):
    # The legitimate label moves down with the opening reflow; only the second
    # label, which sat another 23pt below it in the source, is redundant.
    threshold = 540 if has_71b_full_reflow(page) else 405 + (page.rect.height - 792)
    return any(word[4] == "Registrar" and word[1] > threshold
               for word in page.get_text("words"))


def draw_71b_opening_reflow(page):
    """Put the opening address on a clear line, with the prose below it."""
    page.draw_rect(fitz.Rect(140.0, 170.0, 506.0, 235.0), color=None,
                   fill=(1, 1, 1), overlay=True)
    page.insert_text(fitz.Point(267.25, 183.5), "RECOGNIZANCE", fontsize=12,
                     fontname="tiro", color=(0, 0, 0))
    page.insert_text(fitz.Point(144.1, 205.0), "I,", fontsize=12,
                     fontname="tiro", color=(0, 0, 0))
    page.draw_line(fitz.Point(153.4, 207.16), fitz.Point(197.23, 207.16),
                   color=(0, 0, 0), width=.7)
    page.insert_text(fitz.Point(199.7, 205.0), ", of", fontsize=12,
                     fontname="tiro", color=(0, 0, 0))
    page.draw_line(fitz.Point(214.36, 207.16), fitz.Point(280.36, 207.16),
                   color=(0, 0, 0), width=.7)
    page.insert_text(fitz.Point(282.8, 205.0), ",", fontsize=12,
                     fontname="tiro", color=(0, 0, 0))
    page.insert_text(fitz.Point(153.4, 214.2), "(full name)", fontsize=7,
                     fontname="tiro", color=(0, 0, 0))
    page.insert_text(fitz.Point(214.36, 214.2), "(address)", fontsize=7,
                     fontname="tiro", color=(0, 0, 0))
    page.insert_text(fitz.Point(144.1, 228.0),
                     "acknowledge that I am indebted to Her Majesty the Queen in",
                     fontsize=12, fontname="tiro", color=(0, 0, 0))
    # Restore the full premises-address rule that was shortened in the prior
    # pass.  It is intentionally long enough for a civic address.
    y = 285.18 + FORM_71B_OPENING_DELTA
    page.draw_line(fitz.Point(278.43, y), fitz.Point(500.43, y),
                   color=(0, 0, 0), width=.7)


def reflow_peisc_71b(doc):
    """Insert one prose line in the opening sentence without scaling it."""
    existing_delta = doc[0].rect.height - 792.0
    remaining_delta = FORM_71B_OPENING_DELTA - existing_delta
    if remaining_delta <= .1:
        return None
    source = doc[0]
    width, height = source.rect.width, source.rect.height
    rebuilt = fitz.open()
    split = FORM_71B_OPENING_SPLIT + existing_delta
    page = rebuilt.new_page(width=width, height=height + remaining_delta)
    page.show_pdf_page(fitz.Rect(0, 0, width, split), doc, 0,
                       clip=fitz.Rect(0, 0, width, split))
    page.show_pdf_page(fitz.Rect(0, split + remaining_delta,
                                 width, height + remaining_delta), doc, 0,
                       clip=fitz.Rect(0, split, width, height))
    draw_71b_opening_reflow(page)
    return rebuilt


def has_71b_full_reflow(page):
    return any(item[0] == "l" and abs(item[1].x - 350.0) < .2
               and abs(item[1].y - 429.0) < .2 and abs(item[2].x - 504.0) < .2
               for drawing in page.get_drawings() for item in drawing["items"])


def reflow_peisc_71b_full(doc):
    """Reflow 71B inside a letter page; the viewer's field scale stays valid."""
    source = doc[0]
    width, height = source.rect.width, source.rect.height
    rebuilt = fitz.open()
    page = rebuilt.new_page(width=width, height=height)
    # Opening address gets one line; the terms block gets 95pt.  The footer
    # remains comfortably above the original page number, so the page itself
    # never changes height (critical for overlay alignment in the viewer).
    page.show_pdf_page(fitz.Rect(0, 0, width, FORM_71B_OPENING_SPLIT), doc, 0,
                       clip=fitz.Rect(0, 0, width, FORM_71B_OPENING_SPLIT))
    page.show_pdf_page(fitz.Rect(0, FORM_71B_OPENING_SPLIT + FORM_71B_OPENING_DELTA,
                                 width, FORM_71B_TERMS_SOURCE_SPLIT + FORM_71B_OPENING_DELTA), doc, 0,
                       clip=fitz.Rect(0, FORM_71B_OPENING_SPLIT, width,
                                      FORM_71B_TERMS_SOURCE_SPLIT))
    lower_top = FORM_71B_TERMS_SOURCE_SPLIT + FORM_71B_OPENING_DELTA + FORM_71B_TERMS_DELTA
    page.show_pdf_page(fitz.Rect(0, lower_top, width, 650.0 + FORM_71B_OPENING_DELTA + FORM_71B_TERMS_DELTA), doc, 0,
                       clip=fitz.Rect(0, FORM_71B_TERMS_SOURCE_SPLIT, width, 650.0))
    # Keep only the original page number/footer area in its normal place.
    page.show_pdf_page(fitz.Rect(0, 650.0, width, height), doc, 0,
                       clip=fitz.Rect(0, 650.0, width, height))
    draw_71b_opening_reflow(page)
    page.draw_line(fitz.Point(180.1, 416.0), fitz.Point(504.0, 416.0),
                   color=(0, 0, 0), width=.7)
    # The source's combined Date/Signature line is ambiguous.  Draw distinct
    # rules for the recognizant's date and signature before the certification.
    page.draw_rect(fitz.Rect(365.0, 447.0, 510.0, 472.4), color=None,
                   fill=(1, 1, 1), overlay=True)
    page.draw_line(fitz.Point(180.1, 429.0), fitz.Point(333.1, 429.0),
                   color=(0, 0, 0), width=.7)
    page.draw_line(fitz.Point(350.0, 429.0), fitz.Point(504.0, 429.0),
                   color=(0, 0, 0), width=.7)
    page.insert_text(fitz.Point(180.1, 438.2), "(Date)", fontsize=7,
                     fontname="tiro", color=(0, 0, 0))
    page.insert_text(fitz.Point(458.7, 438.2), "(Signature)", fontsize=10,
                     fontname="tiro", color=(0, 0, 0))
    # Cap the registrar-certification date after it has moved with the footer.
    page.draw_rect(fitz.Rect(260.6, 515.0, 455.0, 521.0), color=None,
                   fill=(1, 1, 1), overlay=True)
    page.draw_line(fitz.Point(108.1, 517.15), fitz.Point(261.1, 517.15),
                   color=(0, 0, 0), width=.7)
    return rebuilt


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


def repair(doc_id, apply_changes, source_path=None):
    path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    doc = fitz.open(source_path or path)
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
        reflow = (doc_id == "PEISC_70A"
                  and doc[1].rect.height <= 800 and doc[2].rect.height <= 800)
        reflow_71b = (doc_id == "PEISC_71B" and not has_71b_full_reflow(doc[0]))
        moved_rules = (doc_id == "PEISC_70A" and not reflow
                       and not has_moved_70a_rules(doc[1]))
        duplicate_71b_registrar = (doc_id == "PEISC_71B"
                                   and has_duplicate_71b_registrar(doc[0]))
        changed += (int(reflow) + int(reflow_71b) + int(moved_rules)
                    + cap_date_rules(doc_id, doc, apply_changes)
                    + int(duplicate_71b_registrar))
        if changed and apply_changes:
            if duplicate_71b_registrar:
                doc[0].add_redact_annot(fitz.Rect(FORM_71B_DUPLICATE_REGISTRAR), fill=(1, 1, 1))
            for page in doc:
                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
            for page, did in contacts:
                draw_contact_rules(page, did)
            for page, label_baseline, rule_baseline in court_addresses:
                draw_court_address_reflow(page, label_baseline, rule_baseline)
            rebuilt = (reflow_peisc_70a(doc) if reflow
                       else reflow_peisc_71b_full(doc) if reflow_71b else None)
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
    ap.add_argument("--source-71b", help="one-time pristine Form 71B source for a full rebuild")
    args = ap.parse_args()
    total = 0
    for doc_id in sorted({row[0] for row in MASKS + CONTACT_BLOCKS + COURT_ADDRESS_REFLOWS} | {did for did, _ in NORMAL_DATE_FIELDS}):
        source = args.source_71b if doc_id == "PEISC_71B" else None
        count = repair(doc_id, not args.check, source)
        print("%s duplicate_prompts=%d" % (doc_id, count))
        total += count
    print(("would change" if args.check else "changed") + ": duplicate_prompts=%d" % total)


if __name__ == "__main__":
    main()

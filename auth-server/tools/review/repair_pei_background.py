"""Small, PEI-only background corrections that cannot be expressed as fields.

The Word-source PDFs occasionally carry a drafting cue in addition to the
actual labelled answer line.  These masks remove only the duplicate cue from
the shipped background; they never touch legal prose or a real writing rule.

    python3 repair_pei_background.py --check
    python3 repair_pei_background.py
"""
import argparse
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
        if changed and apply_changes:
            for page in doc:
                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
            for page, did in contacts:
                draw_contact_rules(page, did)
            fd, temp_path = tempfile.mkstemp(suffix=".pdf", dir=EXPORT)
            os.close(fd)
            try:
                doc.save(temp_path, garbage=4, deflate=True)
                os.replace(temp_path, path)
            finally:
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
    for doc_id in sorted({row[0] for row in MASKS + CONTACT_BLOCKS}):
        count = repair(doc_id, not args.check)
        print("%s duplicate_prompts=%d" % (doc_id, count))
        total += count
    print(("would change" if args.check else "changed") + ": duplicate_prompts=%d" % total)


if __name__ == "__main__":
    main()

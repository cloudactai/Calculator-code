"""Unstack two mis-flowed label lines in F8's income table (page 5).

Rows 11 and 19 each carry a two-line bold label, and pdf.js set one line of each
a full line adrift — two leadings from its pair instead of one. So "(line 8 as
adjusted by lines 9 and 10)" printed across the "CHILD SUPPORT GUIDELINE INCOME
TO DETERMINE SPECIAL EXPENSES" banner beneath it, and "Total income to be used
for a spousal support claim" printed across row 18's "Canada Child Tax Benefit
and BC Family Bonus".

This is the printed page, not the overlay: no field is involved, and the fields on
the page are untouched.

Each line moves to exactly one leading from the line it belongs with, and the
leading is measured off this page's own correctly-set labels (rows 10 and 14 both
use 12 pt) rather than assumed.

Redaction takes every character its rectangle touches, and a line that overlaps
its neighbour necessarily touches it, so the neighbours are re-laid too: anything
caught is put back at its original origin, and only the mis-set line is put back
at its corrected one. The page's faces are embedded TrueType, so the original
font is reused rather than substituted.

Run: python3 repair_f8_rows.py [--write]
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
from build_bc_wizard import collisions  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
DOC_ID = "BCSC_F8"
QA = os.path.join(EXPORT, "_incoming_bc", "qa")
PAGE = 5

# (line that is adrift, the line it belongs with, which side of it it sits on)
MOVES = [
    ("(line 8 as adjusted by lines 9 and 10)",
     "Child support guidelines income for basic child support", +1),
    ("Total income to be used for a spousal support claim",
     "(line 11 plus lines 16, 17 and 18)", -1),
]


def spans(page):
    return [span
            for block in page.get_text("dict")["blocks"]
            for line in block.get("lines", [])
            for span in line["spans"]
            if span["text"].strip()]


def leading(found):
    """The line spacing this page's correctly-set two-line labels use."""
    pairs = [("Adjustments in accordance", "line 8 of Schedule B"),
             ("Add Canada Child Tax Benefit relating", "expenses are sought")]
    seen = set()
    for first, second in pairs:
        top = next((s for s in found if s["text"].strip().startswith(first)), None)
        bottom = next((s for s in found if s["text"].strip().startswith(second)), None)
        if top and bottom:
            seen.add(round(bottom["origin"][1] - top["origin"][1], 2))
    if len(seen) != 1:
        raise SystemExit("page 5's own labels disagree on leading: %s" % sorted(seen))
    return seen.pop()


def main():
    write = "--write" in sys.argv
    background = os.path.join(EXPORT, "%s.pdf" % DOC_ID)
    doc = fitz.open(background)
    page = doc[PAGE - 1]
    found = spans(page)
    step = leading(found)
    print("leading measured from this page's own labels: %.2f pt" % step)

    # Keyed by xref, not by name: the page carries two subsets of Liberation Sans
    # that both report as "LiberationSans", and a subset only holds the glyphs its
    # own text used, so picking by name can land on a face missing half the word.
    faces = []
    for xref, *_ in page.get_fonts():
        buffer = doc.extract_font(xref)[3]
        if buffer:
            faces.append(fitz.Font(fontbuffer=buffer))

    def face_for(span):
        """The embedded face that reproduces this span's own printed width."""
        want = span["bbox"][2] - span["bbox"][0]
        scored = [(abs(face.text_length(span["text"], fontsize=span["size"]) - want), index)
                  for index, face in enumerate(faces)]
        drift, index = min(scored)
        # Proportional: a wrong face is wrong by a lot (a regular standing in for
        # a bold, or a subset missing glyphs), while the right one differs only by
        # rounding accumulated across the line.
        if drift > max(0.6, 0.004 * want):
            raise SystemExit("no embedded face reproduces %r (best off by %.2f pt of %.2f)"
                             % (span["text"][:40], drift, want))
        return faces[index]

    plan, caught = [], []
    for adrift_text, anchor_text, side in MOVES:
        adrift = next((s for s in found if s["text"].strip() == adrift_text), None)
        anchor = next((s for s in found if s["text"].strip() == anchor_text), None)
        if adrift is None or anchor is None:
            raise SystemExit("could not find %r / %r" % (adrift_text[:30], anchor_text[:30]))
        target = anchor["origin"][1] + side * step
        print("   %-52s y %.2f -> %.2f" % (repr(adrift_text[:50]), adrift["origin"][1], target))
        plan.append((adrift, target))
        rect = fitz.Rect(adrift["bbox"])
        for span in found:
            if span is not adrift and not (rect & fitz.Rect(span["bbox"])).is_empty:
                caught.append(span)
                print("        re-laid where it was: %r" % span["text"].strip()[:52])

    if not write:
        doc.close()
        print("(dry run, pass --write)")
        return

    # Redact each span whole. Clearing only the overlapping rectangle leaves the
    # rest of a neighbour on the page, and re-laying it then prints it twice.
    for span in [adrift for adrift, _ in plan] + caught:
        page.add_redact_annot(fitz.Rect(span["bbox"]))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE)

    writer = fitz.TextWriter(page.rect)
    for span, y in plan + [(s, s["origin"][1]) for s in caught]:
        writer.append(fitz.Point(span["origin"][0], y), span["text"],
                      font=face_for(span), fontsize=span["size"])
    writer.write_text(page, color=(0, 0, 0))

    doc.save(background, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc.close()

    check = fitz.open(background)
    print("collisions on p%d after: %s" % (PAGE, collisions(check[PAGE - 1]) or "none"))
    bp.qa_render(background,
                 json.load(open(os.path.join(EXPORT, "%s.json" % DOC_ID)))["staticFields"],
                 os.path.join(QA, "%s_qa.pdf" % DOC_ID))
    check.close()


if __name__ == "__main__":
    main()

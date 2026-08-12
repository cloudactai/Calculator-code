"""Seat F19.4's discovery table header inside its own header row (page 2).

The table under "3. Examinations for Discovery" has a two-line header cell, the same
shape as the cell beside it ("Date by which step to be" / "completed"):

    Examination by            Examination of
    (party name)              (party and person name)

pdf.js flows the first line of those two cells *outside* the table, onto the second
line of the paragraph above, so the page prints
"completed by the date indicated:" with "Examination by" superimposed on it and the
header cells reading only "(party name)". That is the one genuine printed-text
collision in the batch — the rest of the flagged pairs were wrapped cell text and
inline `$` markers, confirmed correct by reading the pages.

Nothing has to be re-flowed or re-measured to fix it. The header row is 27 pt, i.e.
two 12 pt lines at baselines 617 and 629, and in cells 1 and 2 the second line is
empty. So the repair is: drop the strays and the label, then draw the label pair back
on the right baselines. Every x position is reused exactly as the government set it —
each is already centred in its cell — so only the baseline changes.

Run: python3 repair_f19_4_header.py [--promote]
"""
import json
import os
import shutil
import sys

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
OUT = os.path.join(EXPORT, "_incoming_bc2", "out")

DOC_ID = "BCSC_F19_4"
PAGE = 2
FONT = "helv"          # ArialMT's metric-compatible base-14 stand-in
SIZE = 9.89

# Both lines of the paragraph above the table, re-typeset once the band is cleared.
#
# Both lines are cleared and redrawn, not just the one the strays landed on. Redaction
# works on glyph bounding boxes, and these two lines' boxes touch (line 1 ends at
# y 585.10, line 2 starts at 585.05), so any band that catches line 2 also catches the
# tail of line 1 — the first attempt at this repair ate "The following examinations
# for discovery will be conducte" that way. Clearing both and restoring both from the
# government's own strings, at the government's own origins, is exact instead.
PARAGRAPH = [
    ("\xa0\xa0\xa0\xa0\xa0\xa0\xa0  The following examinations for discovery will be"
     " conducted, not exceed the time limits indicated and be", 55.41, 583.0),
    ("\xa0\xa0\xa0\xa0\xa0\xa0\xa0  completed by the date indicated:", 55.41, 594.0),
]
# Header cells: (text, x, baseline). Line 1 sits at 617, line 2 at 629 — the
# baselines the neighbouring "Date by which step to be / completed" cell already uses.
HEADER = [
    ("Examination by", 83.25, 617.0),
    ("(party name)", 89.02, 629.0),
    ("Examination of", 228.36, 617.0),
    ("(party and person name)", 206.95, 629.0),
]
# Bands to clear: the paragraph's second line plus both strays, and the two header
# cells' first line. Chosen to miss every printed rule (the row's top border is at
# 607.5 and its bottom at 634.5).
BANDS = [
    fitz.Rect(50.0, 572.0, 535.0, 598.0),
    fitz.Rect(56.0, 609.0, 178.5, 621.0),
    fitz.Rect(182.0, 609.0, 340.5, 621.0),
]


def main():
    promote = "--promote" in sys.argv
    path = os.path.join(OUT, "%s.pdf" % DOC_ID)
    mapping = json.load(open(os.path.join(OUT, "%s.json" % DOC_ID)))["staticFields"]

    # A field box inside a band would be a box on printed text, which is a different
    # defect and must not be papered over by a redraw.
    for field in mapping:
        if field["page"] != PAGE:
            continue
        box = fitz.Rect(field["x"], field["y"],
                        field["x"] + field["width"] / 1.5,
                        field["y"] + field["height"] / 1.5)
        for band in BANDS:
            if box.intersects(band):
                raise SystemExit("%s p%d: field %s sits in a repair band"
                                 % (DOC_ID, PAGE, field["id"]))

    doc = fitz.open(path)
    page = doc[PAGE - 1]
    for band in BANDS:
        # fill=False so the redaction removes glyphs without painting a white patch
        # over the table's rules; line art is kept for the same reason.
        page.add_redact_annot(band, fill=False)
    page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_NONE)

    for text, x, baseline in PARAGRAPH + HEADER:
        page.insert_text((x, baseline), text, fontname=FONT, fontsize=SIZE, color=(0, 0, 0))

    tmp = path + ".tmp"
    doc.save(tmp, garbage=4, deflate=True)
    doc.close()
    os.replace(tmp, path)

    from build_bc_batch2 import printed_collisions
    doc = fitz.open(path)
    hits = printed_collisions(doc[PAGE - 1])
    lines = sorted(
        (round(fitz.Rect(l["bbox"]).y0, 1), "".join(s["text"] for s in l["spans"]).strip())
        for b in doc[PAGE - 1].get_text("dict")["blocks"] for l in b.get("lines", [])
        if 580 < fitz.Rect(l["bbox"]).y0 < 640)
    doc.close()
    print("%s p%d repaired; collisions now: %d" % (DOC_ID, PAGE, len(hits)))
    for y, text in lines:
        print("   y=%-7.1f %r" % (y, text))
    if hits:
        raise SystemExit("still colliding: %s" % hits)

    if promote:
        for extension in ("pdf", "json"):
            shutil.copy(os.path.join(OUT, "%s.%s" % (DOC_ID, extension)),
                        os.path.join(EXPORT, "%s.%s" % (DOC_ID, extension)))
        print("promoted %s" % DOC_ID)


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()

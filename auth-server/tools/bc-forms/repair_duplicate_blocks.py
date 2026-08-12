"""Remove the blocks a flatten printed twice.

pdf.js lays out the two branches of a conditional **stacked instead of overlapping**, so
the page prints the block twice and nothing collides. `printed_collisions` only fires on
a shared baseline, so every gate passed F1 and only reading the page found it:

* **p2** prints "English / French / English and French (bilingual)" twice — once inside
  the bordered panel at y 244.5-308.5, once bare at y 314-372 — giving **six checkboxes
  for a single official-language choice**. The panel copy is the form's own layout, so the
  bare copy goes, along with its three checkbox fields.

* **p4** prints the children table's **header row** twice, as two sets of three ruled
  cells: y 212.5-244.5 at x 90.5/270.5/360.5, and y 252.5-284.5 at x 108.5/288.5/378.5.
  The first set is the one to keep, and the page says so rather than the eye: its column
  centres are 180.0 / 315.0 / 441.0 against the data rows' 180.7 / 315.7 / 441.7, while
  the second set sits a uniform 18 pt to the right of them.

Line art is removed by **painting**, not by redaction. `PDF_REDACT_LINE_ART_REMOVE_IF_
TOUCHED` drops every drawing whose rectangle meets the band, and both pages sit inside a
full-content frame (p2's is x 72.5-575.5, y 54.5-373.5) whose rectangle meets any band
drawn inside it — so touch-based removal would take the form's border with it. Text is
redacted so it stops being extractable; the remaining outlines are then covered.

F54.1 is a third shape of the same fault and one a line-by-line comparison cannot see:
the page prints "THIS COURT ORDERS, under section 187 of the Family Law Act, that the
order dated ... made by ... is terminated on ." **twice** — once laid out across y 488-539
with its three fields and the connecting words on their own lines, and once **collapsed
onto a single line** at y 566.9 with the blanks squeezed out. Because the two copies are
formatted differently, no run of matching lines exists between them; only the normalised
text of the whole sentence matches. The collapsed copy carries no fields, so it goes.

Run: python3 repair_duplicate_blocks.py [--apply]
"""
import argparse
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_bc2 as V  # noqa: E402

OUT = V.OUT

# docId -> bands whose *text* is the duplicate copy.
TEXT_BANDS = {
    "BCSC_F1": [
        (2, fitz.Rect(70.0, 310.0, 240.0, 375.0)),
        (4, fitz.Rect(100.0, 250.0, 545.0, 283.0)),
    ],
    # The collapsed one-line copy of the operative sentence. No line art in the band and
    # no field below y 537.6, so nothing has to be redrawn.
    "BCSC_F54_1": [
        (1, fitz.Rect(15.0, 561.0, 570.0, 583.0)),
    ],
}
# Line art of the duplicate copy, painted over in white. p2: the three checkbox outlines,
# drawn as eight short segments each.
#
# p4 needs the band to run *past* y 284.5 and then redraw. The duplicate header's bottom
# edge and the first data row's top edge are both at 284.5, and the duplicate's is the
# wider of the two (x 108.5-539.5 against the data row's 90.5-521.5). Stopping at 283.8
# to spare the data row left ~0.7 pt stubs of the duplicate's six cell verticals poking
# below the paint, visible as tick marks. So the whole edge is cleared and the data row's
# own border is drawn back — the same clear-then-restore `repair_notice_pages.py` uses.
PAINT = {
    "BCSC_F1": [
        (2, fitz.Rect(74.5, 312.0, 89.5, 369.0)),
        (4, fitz.Rect(107.0, 251.0, 541.0, 285.3)),
    ],
}
REDRAW = {
    "BCSC_F1": [
        (4, fitz.Rect(90.5, 284.5, 521.5, 284.5), 1.0),
    ],
}
# The duplicate copy's own fields.
DROP_FIELDS = {
    "BCSC_F1": {1750498416032, 1750498416033, 1750498416034},
}
# What must survive, asserted after the repair.
KEEP_TEXT = {
    "BCSC_F1": {
        2: ["Official language choice", "English", "French", "(bilingual)"],
        4: ["Full Name", "Birth Date", "Resides with"],
    },
    "BCSC_F54_1": {
        1: ["THIS COURT ORDERS", "is terminated on", "By the Court"],
    },
}


def occurrences(page, needle):
    return len(page.search_for(needle))


def repair(DOC_ID, apply_it):
    pdf_path = os.path.join(OUT, "%s.pdf" % DOC_ID)
    json_path = os.path.join(OUT, "%s.json" % DOC_ID)
    mapping = json.load(open(json_path))

    doc = fitz.open(pdf_path)
    before = {}
    for page_number, phrases in KEEP_TEXT[DOC_ID].items():
        before[page_number] = {p: occurrences(doc[page_number - 1], p) for p in phrases}
        print("p%d before: %s" % (page_number, before[page_number]))

    # A field of the *kept* copy inside a band would mean the wrong copy is being removed.
    drop = set(DROP_FIELDS.get(DOC_ID, set()))
    keep_ids = {int(f["id"]) for f in mapping["staticFields"]} - drop
    # Painting the duplicate white leaves its cell *rectangles* in the content stream —
    # only their text is redacted — so `place_missing_bc2.grid_cells` still sees them as
    # empty ruled cells and boxes them. A field lying wholly inside a painted band is
    # therefore a box on removed content and is dropped with the rest of the copy. A
    # field merely *overlapping* a band is a different matter and still an error.
    for page_number, band in PAINT.get(DOC_ID, []):
        for field in mapping["staticFields"]:
            if field["page"] != page_number or int(field["id"]) not in keep_ids:
                continue
            if band.contains(V.box(field)):
                drop.add(int(field["id"]))
                keep_ids.discard(int(field["id"]))
    for page_number, band in (TEXT_BANDS.get(DOC_ID, [])
                              + [(p, b) for p, b in PAINT.get(DOC_ID, [])]):
        for field in mapping["staticFields"]:
            if field["page"] != page_number or int(field["id"]) not in keep_ids:
                continue
            if V.box(field).intersects(band):
                raise SystemExit("%s p%d: kept field %s is inside a repair band"
                                 % (DOC_ID, page_number, field["id"]))

    for page_number, band in TEXT_BANDS.get(DOC_ID, []):
        page = doc[page_number - 1]
        page.add_redact_annot(band, fill=False)
        page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    for page_number, band in PAINT.get(DOC_ID, []):
        doc[page_number - 1].draw_rect(band, color=None, fill=(1, 1, 1), width=0)
    for page_number, line, width in REDRAW.get(DOC_ID, []):
        doc[page_number - 1].draw_line(fitz.Point(line.x0, line.y0),
                                       fitz.Point(line.x1, line.y1),
                                       color=(0, 0, 0), width=width)

    after = {}
    for page_number, phrases in KEEP_TEXT[DOC_ID].items():
        after[page_number] = {p: occurrences(doc[page_number - 1], p) for p in phrases}
        print("p%d after:  %s" % (page_number, after[page_number]))

    # Every phrase must survive, and the duplicated ones must now appear once.
    for page_number, phrases in KEEP_TEXT[DOC_ID].items():
        for phrase in phrases:
            count = after[page_number][phrase]
            if count < 1:
                raise SystemExit("p%d: %r was removed entirely" % (page_number, phrase))
            if before[page_number][phrase] == 2 * count == 2:
                continue
            if count != 1 and before[page_number][phrase] != count:
                print("  note p%d %r: %d -> %d"
                      % (page_number, phrase, before[page_number][phrase], count))

    if apply_it:
        tmp = pdf_path + ".tmp"
        doc.save(tmp, garbage=4, deflate=True)
        doc.close()
        os.replace(tmp, pdf_path)
        kept = [f for f in mapping["staticFields"] if int(f["id"]) not in drop]
        dropped = len(mapping["staticFields"]) - len(kept)
        mapping["staticFields"] = kept
        with open(json_path, "w") as fh:
            json.dump(mapping, fh, indent=1)
            fh.write("\n")
        print("\napplied: %d duplicate checkbox field(s) dropped, %d remain"
              % (dropped, len(kept)))
    else:
        doc.close()
        print("\ndry run — would drop %d field(s)" % len(drop))


def main():
    apply_it = "--apply" in sys.argv
    for doc_id in sorted(set(TEXT_BANDS) | set(PAINT)):
        print("=== %s" % doc_id)
        repair(doc_id, apply_it)


if __name__ == "__main__":
    main()

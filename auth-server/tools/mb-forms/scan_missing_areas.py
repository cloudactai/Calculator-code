"""Sweep the templates for an answer prompt that has nowhere to answer.

Guide §6 and §9.6: the defects that survive every geometric gate are the ones
where the government *asks* for something in prose and the builder found no
rule, cell or underscore to hang a box on. There is no geometry to measure, so
the only way to find them is to read the words and then ask whether anything
was placed near them.

The vocabulary below is the set of phrases Manitoba actually uses to open an
answer -- "(specify)", "(describe ...)", "as follows:", "particulars", "give
details", "state", "explain", "reasons" -- plus the bare caption ending in ":"
that §6 names as an anchor.

**Where an answer is allowed to live**, and why both are needed:

  * *beside* the prompt -- "Other (specify) ______" puts the blank on the same
    line, which is Manitoba's usual habit; and
  * *under* it -- "The circumstances ... are as follows:" opens the band below,
    down to whatever prints next.

A prompt with a field in either place is answered. One with neither is a
candidate, and every candidate needs reading before it is believed: a heading
ending in ":" over a ruled table is answered by the table, and a column title
is not a prompt at all. That is why this prints context rather than a verdict.

    python3 scan_missing_areas.py              # every promoted MB template
    python3 scan_missing_areas.py MBKB_70D     # named forms
"""
import glob
import json
import os
import re
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_mb_forms as B  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
SCALE = 1.5

PROMPTS = [
    ("specify", re.compile(r"\(\s*specify", re.I)),
    ("describe", re.compile(r"\(\s*(fully\s+)?describ", re.I)),
    ("description", re.compile(r"\bdescription\b", re.I)),
    ("as follows", re.compile(r"\bas follows\s*:", re.I)),
    ("particulars", re.compile(r"\bparticulars\b", re.I)),
    ("give details", re.compile(r"\bgive (details|reasons)\b", re.I)),
    ("state/explain", re.compile(r"\b(state|explain|set out|list all|list the)\b", re.I)),
    ("reasons", re.compile(r"\breasons?\s*\)?\s*:?\s*$", re.I)),
    ("if yes", re.compile(r"\bif (yes|so)\b", re.I)),
    ("caption:", re.compile(r":\s*$")),
]

# How far to the right of a prompt an answer may sit, and how far below.
BESIDE = 420.0
BELOW_MAX = 320.0
# A candidate needs somewhere an answer could actually go. Below: at least one
# line of clear paper. Beside: enough width to be a blank rather than the tail
# of a justified line.
MIN_BAND = 12.0
MIN_BESIDE = 60.0
# A prompt printed inside a ruled cell is answered by its table, not by the
# paper under it -- Form 70U repeats "Description" and "State if you agree or
# disagree with ..." as column titles on eleven pages, and every one of them is
# answered by the writing panel beneath the heading row.
IN_CELL_PAD = 1.0


def boxes_for(doc_id):
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    by_page = {}
    for f in fields:
        by_page.setdefault(f["page"], []).append(
            fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE,
                      f["y"] + f["height"] / SCALE))
    return by_page


def lines_of(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(s["text"] for s in line["spans"]).strip()
            if text:
                out.append((fitz.Rect(line["bbox"]), text))
    out.sort(key=lambda pair: (round(pair[0].y0, 1), pair[0].x0))
    return out


def scan(doc_id):
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    by_page = boxes_for(doc_id)
    hits = []
    for number, page in enumerate(pdf, start=1):
        mine = by_page.get(number, [])
        lines = lines_of(page)
        cells = [cell for cell, _t, _d, _c in B.grid_cells(page)]
        for index, (rect, text) in enumerate(lines):
            labels = [name for name, pattern in PROMPTS if pattern.search(text)]
            if not labels:
                continue
            if any(cell.x0 - IN_CELL_PAD <= rect.x0 and rect.x1 <= cell.x1 + IN_CELL_PAD
                   and cell.y0 - IN_CELL_PAD <= rect.y0 and rect.y1 <= cell.y1 + IN_CELL_PAD
                   for cell in cells):
                continue  # a table's own furniture; the table answers it

            beside = fitz.Rect(rect.x1, rect.y0 - 2, min(rect.x1 + BESIDE, page.rect.width),
                               rect.y1 + 2)
            floor = min([other.y0 for other, _t in lines[index + 1:]
                         if other.y1 > rect.y1 + 1] or [page.rect.height - 54])
            below = fitz.Rect(rect.x0, rect.y1 + 1, page.rect.width - 54,
                              min(floor, rect.y1 + BELOW_MAX))
            if any(b.intersects(rect) or b.intersects(beside) or b.intersects(below)
                   for b in mine):
                continue

            # Is there anywhere an answer could actually go? A wrapped fragment
            # of a heading has neither: no clear line under it (the next line of
            # the same heading is 1-2pt away) and no room beside it.
            band = max(0.0, below.y1 - below.y0)
            room = page.rect.width - 54 - rect.x1
            if band < MIN_BAND and room < MIN_BESIDE:
                continue
            hits.append((number, labels, text, band, room))
    pdf.close()
    return hits


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    floor = 25.0
    for arg in sys.argv[1:]:
        if arg.startswith("--min-band="):
            floor = float(arg.split("=", 1)[1])
    names = args or sorted(
        os.path.basename(p)[:-4] for p in glob.glob(os.path.join(EXPORT, "MBKB_*.pdf")))

    rows = []
    for doc_id in names:
        for number, labels, text, band, room in scan(doc_id):
            rows.append((band, doc_id, number, labels, text, room))
    rows.sort(reverse=True)

    # **Ranked by how much unexplained blank paper there is.** A numbered
    # section heading ("14. Costs:") is answered by the items under it and shows
    # a band of one line; a genuinely missing writing area leaves the rest of
    # the block empty. Everything below the floor is almost all headings, so it
    # is counted rather than listed.
    shown = [r for r in rows if r[0] >= floor]
    for band, doc_id, number, labels, text, room in shown:
        print("%-12s p%-2d band=%6.1fpt beside=%5.1f  %-14s %s"
              % (doc_id, number, band, room, ",".join(labels)[:14], text[:60]))
    print("\n%d prompt(s) with a band of %.0fpt or more and no field."
          % (len(shown), floor))
    print("%d more below that floor (mostly section headings answered by the "
          "items under them) -- rerun with --min-band=0 to see them." % (len(rows) - len(shown)))


if __name__ == "__main__":
    main()

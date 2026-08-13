"""Move a printed label the flatten dropped into the wrong row.

Reported from the app on F8 p10: "TOTAL ANNUAL EXPENSES" prints across the rule at
y 395.5 and lands on top of "TOTAL MONTHLY EXPENSES" in the row above, so the two totals
read as one smudged line.

`build_bc_batch2.printed_collisions` cannot see either of these — it only fires when two
pieces of text share a **baseline**, and here the baselines are 8 pt apart for a 9.89 pt
font. The test that does find them is leading under one em with glyphs actually
intersecting: across both batches that gives **7 pairs**, and only two are real —

* **F8 p10** — the annual total, below;
* **F20 p1** — the heading's third line, "FACT", printed over
  "[Do not include documents listed under Part 2, 3 or 4.]".

The other five are the two-column Provincial guidance pages (BCPC_30 p4, where the body
and the grey sidebar sit side by side and only their line boxes touch) and SUP916/PFA916's
underscore rules, whose descenders reach into the caption beneath — both correct as
printed.

The repair is the one `repair_f19_4_header.py` established: clear the glyphs with a
redaction that keeps line art (`fill=False`, `LINE_ART_NONE`, so the table rule the label
straddles survives), then draw the same string back at the same x on a corrected baseline.

And its hard-won lesson, which cost a first attempt here too: **redaction works on glyph
boxes, so the band takes every glyph it touches, not just the ones being moved.** Clearing
F8's annual label ate most of "TOTAL MONTHLY EXPENSES" above it, leaving "TO"; clearing
F20's "FACT" ate "include" from the line below. So the tool does not take a hand-written
list of neighbours: it finds every span the band intersects, and restores all of them —
the one being moved at its new baseline, the rest exactly where they were.
Nothing is re-measured or re-flowed — but the text must be redrawn in the page's **own
embedded font**, not in a base-14 stand-in. F19.4's repair could use `helv` because that
page's ArialMT matches Helvetica to 0.2%; F8 p10 cannot, because the flatten embedded a
*condensed* Liberation Sans Bold subset there and Helvetica-Bold sets the same string 14%
wider — enough to run "TOTAL ANNUAL EXPENSES" into the `$` beside it. The font is chosen by
measurement: of the fonts the page embeds, the one that reproduces the span's own width
within 1% is the one it was set in, and the redrawn width is asserted afterwards.

Run: python3 repair_printed_labels.py [--apply]
"""
import argparse
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_bc2 as V  # noqa: E402

OUT = V.OUT
EXPORT = V.EXPORT
PAD = 0.6

# docId -> [(page, text as printed, x, old baseline, dy, why)]
#
# F8: the row is 395.5-427.5 and holds two lines, the label and "[multiply TOTAL MONTHLY
# EXPENSES by 12]" at baseline 421. Moving the label from 397 to 407 puts it on the row's
# first line, which is where its own $ box already sits.
#
# F20: the heading is three lines at 433 / 445 / 457 on 12 pt leading, and the instruction
# under it is at 459 — 2 pt below the third line, so "FACT" overprints "include". There is
# no room to move the instruction (the table starts at y 464.5), so the whole heading goes
# up 8 pt, which leaves 2.35 pt under the "[party]" caption above it and a normal paragraph
# gap below. All three lines move together: they are one block and redrawing part of it
# would break the 12 pt leading.
MOVES = {
    "BCSC_F8": [
        (10, "TOTAL ANNUAL EXPENSES", 331.75, 397.0, 10.0,
         "the annual total was printed across the rule into the monthly row"),
    ],
    "BCSC_F20": [
        (1, "Part 1:  DOCUMENTS THAT ARE OR HAVE BEEN IN THE LISTING PARTY",
         106.41, 433.0, -8.0, "heading line 1, moved with the block"),
        (1, "AND THAT COULD BE USED BY ANY PARTY AT TRIAL TO PROVE OR DISPROVE A MATERIAL",
         139.41, 445.0, -8.0, "heading line 2, moved with the block"),
        (1, "FACT", 139.41, 457.0, -8.0,
         "heading line 3, which was printed over the instruction below it"),
    ],
}


def root_for(doc_id):
    return OUT if os.path.exists(os.path.join(OUT, "%s.pdf" % doc_id)) else EXPORT


def span_at(page, x, baseline):
    """The printed span whose origin is (x, baseline), with its text and font."""
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if (abs(span["origin"][0] - x) < 0.6
                        and abs(span["origin"][1] - baseline) < 0.6):
                    return span
    return None


def repair(doc_id, apply_it):
    moves = MOVES[doc_id]
    root = root_for(doc_id)
    pdf_path = os.path.join(root, "%s.pdf" % doc_id)
    fields = json.load(open(os.path.join(root, "%s.json" % doc_id)))["staticFields"]
    doc = fitz.open(pdf_path)

    plan = []
    for page_number, text, x, baseline, dy, why in moves:
        page = doc[page_number - 1]
        span = span_at(page, x, baseline)
        if span is None:
            if span_at(page, x, baseline + dy) is not None:
                continue                      # already moved; re-runs are a no-op (§7.9)
            raise SystemExit("%s p%d: no span at %.2f,%.2f — the page has changed"
                             % (doc_id, page_number, x, baseline))
        # A prefix, not the whole string: the table records enough to identify the span
        # beyond doubt, and the text redrawn is the page's own, so a stray typo in this
        # file can never rewrite what the government printed.
        if not span["text"].strip().startswith(text.strip()):
            raise SystemExit("%s p%d: span at %.2f,%.2f reads %r, expected it to start %r"
                             % (doc_id, page_number, x, baseline, span["text"][:60], text[:60]))
        band = fitz.Rect(span["bbox"]) + (-PAD, -PAD, PAD, PAD)
        for field in fields:
            if field["page"] == page_number and V.box(field).intersects(band):
                raise SystemExit("%s p%d: field %s sits in the band — a box on printed "
                                 "text is a different defect"
                                 % (doc_id, page_number, field["id"]))
        # Redacting only the target's narrow band can clip a few glyphs from a nearby
        # span while leaving the rest of that old span searchable.  Expand transitively
        # to complete intersecting spans, then clear each victim's full glyph box.
        # This keeps both the rendered page and its extracted/searchable text clean.
        for victim in complete_spans_in(page, band):
            moved = (abs(victim["origin"][0] - x) < 0.6
                     and abs(victim["origin"][1] - baseline) < 0.6)
            alias, buffer = embedded_font(doc, page_number, victim)
            # Measured the same way it will be checked afterwards — searched for, and
            # stripped — so trailing spaces in the span cannot make the widths disagree.
            victim_band = fitz.Rect(victim["bbox"]) + (-PAD, -PAD, PAD, PAD)
            plan.append((page_number, victim_band, victim["text"], victim["origin"][0],
                         victim["origin"][1] + (dy if moved else 0.0),
                         alias, buffer, victim["size"],
                         why if moved else "collateral of the band, restored in place",
                         printed_width(page, victim)))

    if not plan:
        print("%-12s already repaired" % doc_id)
        doc.close()
        return False

    for row in plan:
        page = doc[row[0] - 1]
        page.add_redact_annot(row[1], fill=False)
        page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    for page_number, _band, text, x, baseline, alias, buffer, size, why, width in plan:
        page = doc[page_number - 1]
        if buffer is not None:
            page.insert_font(fontname=alias, fontbuffer=buffer)
        page.insert_text((x, baseline), text, fontname=alias, fontsize=size,
                         color=(0, 0, 0))
        print("%-12s p%-2d %-26s baseline -> %6.1f  (%s)"
              % (doc_id, page_number, repr(text.strip())[:26], baseline, why))

    for page_number in sorted({row[0] for row in plan}):
        page = doc[page_number - 1]
        for _p, _b, text, x, base, _a, _buf, _s, _w, width in plan:
            # Searched for, not looked up by origin: a redraw may split one span into
            # several, and the check that matters is that the phrase is back on the page
            # at its original width — the test that catches a wrong or subsetted font.
            needle = text.strip().replace("\xa0", " ")
            rects = [r for r in page.search_for(needle) if abs(r.y1 - base) < 6]
            if not rects:
                raise SystemExit("%s p%d: %r did not come back"
                                 % (doc_id, page_number, needle[:40]))
            redrawn = max(r.width for r in rects)
            if abs(redrawn - width) > max(1.0, 0.02 * width):
                raise SystemExit("%s p%d: %r came back %.2fpt wide, was %.2f — wrong font"
                                 % (doc_id, page_number, needle[:30], redrawn, width))
        left = tight_pairs(page)
        if left:
            raise SystemExit("%s p%d: still colliding: %s" % (doc_id, page_number, left))

    if apply_it:
        tmp = pdf_path + ".tmp"
        doc.save(tmp, garbage=4, deflate=True)
        doc.close()
        os.replace(tmp, pdf_path)
        if root is OUT:
            import shutil
            shutil.copy(pdf_path, os.path.join(EXPORT, "%s.pdf" % doc_id))
    else:
        doc.close()
    return True


def printed_width(page, span):
    """The span's width as `search_for` measures it, ignoring trailing spaces."""
    needle = span["text"].strip().replace("\xa0", " ")
    rects = [r for r in page.search_for(needle)
             if abs(r.y1 - span["origin"][1]) < 6] if needle else []
    return max((r.width for r in rects), default=span["bbox"][2] - span["bbox"][0])


def complete_spans_in(page, band):
    """Every complete printed span connected to ``band`` by glyph-box overlap."""
    spans = [span
             for block in page.get_text("dict")["blocks"]
             for line in block.get("lines", [])
             for span in line["spans"]
             if span["text"].strip()]
    selected = []
    regions = [band]
    remaining = list(spans)
    while True:
        added = [span for span in remaining
                 if any(fitz.Rect(span["bbox"]).intersects(region)
                        for region in regions)]
        if not added:
            # Preserve the page's reading order when the spans are written back.  This
            # lets text extraction join punctuation and styled text on one baseline.
            return sorted(selected,
                          key=lambda span: (round(span["origin"][1], 1),
                                            span["origin"][0]))
        selected.extend(added)
        for span in added:
            regions.append(fitz.Rect(span["bbox"]) + (-PAD, -PAD, PAD, PAD))
            remaining.remove(span)


def embedded_font(doc, page_number, span):
    """The page's own font for this span, picked by which one reproduces its width.

    Returns (alias, fontbuffer), or a base-14 name with None when the page embeds nothing
    that matches — in which case the width assertion after the redraw is the backstop.
    """
    actual = span["bbox"][2] - span["bbox"][0]
    for entry in doc.get_page_fonts(page_number - 1):
        xref = entry[0]
        try:
            buffer = doc.extract_font(xref)[3]
            if not buffer:
                continue
            width = fitz.Font(fontbuffer=buffer).text_length(span["text"],
                                                             fontsize=span["size"])
        except Exception:
            continue
        if abs(width - actual) <= max(0.6, 0.01 * actual):
            return ("emb%d" % xref, buffer)
    return ("hebo" if "Bold" in span["font"] else "helv", None)


def tight_pairs(page):
    """Glyphs from two baselines less than one em apart that actually intersect."""
    chars = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for char in span["chars"]:
                    if char["c"].strip():
                        chars.append((fitz.Rect(char["bbox"]),
                                      round(span["origin"][1], 1), span["size"]))
    chars.sort(key=lambda item: item[0].x0)
    found = set()
    for index, (rect, baseline, size) in enumerate(chars):
        for other, other_baseline, other_size in chars[index + 1:]:
            if other.x0 > rect.x1:
                break
            gap = abs(baseline - other_baseline)
            if gap < 0.5 or gap >= 0.9 * min(size, other_size):
                continue
            if (min(rect.x1, other.x1) - max(rect.x0, other.x0) > 0.8
                    and min(rect.y1, other.y1) - max(rect.y0, other.y0) > 1.5):
                found.add((min(baseline, other_baseline), max(baseline, other_baseline)))
    return sorted(found)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    changed = sum(repair(doc_id, args.apply) for doc_id in sorted(MOVES))
    print("\n%d form(s) repaired%s" % (changed, "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()

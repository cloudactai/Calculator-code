"""Gates for the Saskatchewan templates (placement guide 7).

Every check is a measurement against the government's own printed page, re-derived
from scratch rather than compared to whatever the builder happened to store.

Why the printed-text check is per character, not per word: `get_text("words")`
hands back `birth:___________________________` and `$______________` as single
tokens, because Saskatchewan sets its blanks hard against the caption that
introduces them. A word-level test either flags every correctly-placed box for
the underscores it is *supposed* to sit on, or -- once underscores are excused --
waves through a box that really has covered the word glued to them. Reading
characters separates the caption from its rule exactly. This is the same lesson
guide 2 records for finding checkbox glyphs.

    python3 verify_sk.py            # every promoted template
    python3 verify_sk.py --stage    # the staged build in _incoming_sk/out
"""
import argparse
import collections
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))

import bc_pipeline as bp  # noqa: E402
import build_sk_forms as B  # noqa: E402
from sk_sources import shipped_sources  # noqa: E402

SCALE = bp.SCALE
EXPORT = B.EXPORT
STAGE = B.STAGE

# Characters a field box is entitled to cover: its own printed rule, the `$` it
# is anchored to, and the punctuation the form sets against a blank.
IGNORABLE = set("_$ \t.,;:()")
# Narrower than this is a sliver worth justifying. Part 15's smallest legitimate
# blank is 21.2pt: Saskatchewan prints the year as "2 _____" and that run holds
# the last two digits (Form 15-78 p2, and the same slot in every jurat). The
# adoption consolidation sets the identical slot as "20____" at 17.4pt -- 16 of
# the 20 forms carry one in the "Dated at ... this __ day of ____, 20__" line --
# and Form H's "Honourable____ Justice" prints a 17.7pt rule for the judge's
# name. Smaller still are the date slots the three Orders of Adoption set as
# "The_ __ day of______, 20_ _": a 15.2pt day and a 10.9pt year, and the year
# becomes 9.4pt once edge clearance moves it off its own "0". The floor sits just
# under the smallest of those rather than at a round number, so a 3pt stray still
# has to justify itself.
MIN_FIELD_WIDTH = 9.0


def box_of(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def check_printed_text(doc, fields, problems):
    """A box may sit on its rule; it may not sit on the words around it."""
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        chars = []
        for _text, boxes, _sizes in B.line_chars(page):
            for index, box in enumerate(boxes):
                if _text[index] in IGNORABLE:
                    continue
                chars.append((box, _text[index]))
        for field in [f for f in fields if f["page"] == number]:
            box = box_of(field)
            covered = [c for rect, c in chars
                       if (box & rect).get_area() > 0.5 * rect.get_area() and rect.get_area() > 1]
            if len(covered) >= 3:
                problems.append({
                    "check": "printed-text", "page": number, "id": field["id"],
                    "detail": "covers %r" % "".join(covered[:24]),
                })


def check_checkbox_marks(doc, fields, problems):
    """Every checkbox must sit on a printed square, and one square per control."""
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        # Both option vocabularies: the stroked 9x9 square Part 15 and the
        # child-protection forms draw, and the U+F07E glyph the adoption
        # consolidation types instead of drawing. Still re-derived from the page
        # rather than taken from the builder, so a control has to land on real ink.
        marks = B.checkboxes(page) + B.glyph_checkboxes(page)
        ticks = B.tick_rects(page)
        taken = {}
        for field in [f for f in fields if f["page"] == number and f["type"] == "CheckBox"]:
            box = box_of(field)
            hit = next((m for m in marks if (m & box).get_area() > 0.6 * m.get_area()), None)
            if hit is None and any((t & box).get_area() > 0.6 * t.get_area() for t in ticks):
                continue  # a tick column's box: the column's check-glyph heading
                          # is its anchor, and it prints no square to sit on
            if hit is None:
                problems.append({"check": "checkbox-mark", "page": number,
                                 "id": field["id"], "detail": "no printed square under it"})
                continue
            key = (round(hit.x0, 1), round(hit.y0, 1))
            if key in taken:
                problems.append({"check": "checkbox-shared", "page": number,
                                 "id": field["id"],
                                 "detail": "shares a square with %s" % taken[key]})
            taken[key] = field["id"]


def _on_a_signature_rule(rect, dropped):
    """Is this box one of the rules the build deliberately leaves empty?"""
    return any((rect & other).get_area() > 0.5 * min(rect.get_area(), other.get_area())
               for other in dropped)


def check_unfilled_blanks(doc, fields, problems):
    """Guide 9.6: a printed blank with no field on it is one a lawyer cannot use.

    A signature rule is a blank with no field *on purpose*, so it is excused here
    by re-running the very rule that dropped it -- not by a hardcoded list.
    """
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        mine = [box_of(f) for f in fields if f["page"] == number]
        dropped = B.signature_rule_rects(page)
        for rect, _rule, _size in B.underscore_blanks(page):
            probe = fitz.Rect(rect.x0, rect.y0 - 4, rect.x1, rect.y1 + 2)
            if any(probe.intersects(other) for other in mine):
                continue
            if _on_a_signature_rule(probe, dropped):
                continue
            problems.append({"check": "unfilled-blank", "page": number, "id": None,
                             "detail": "a %.0fpt blank at %.0f,%.0f has no field"
                                       % (rect.width, rect.x0, rect.y0)})


def check_signatures(doc, fields, problems):
    """Guide 5: nothing may sit on a signature or commissioner rule.

    Re-derived the same way the build decides it: a caption claims its *nearest*
    rule. Testing every box against every caption in range would flag the jurat's
    year blank, which sits a line above the commissioner's caption and is a field
    a lawyer has to fill in.
    """
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        dropped = B.signature_rule_rects(page)
        if not dropped:
            continue
        for field in [f for f in fields if f["page"] == number and f["type"] != "CheckBox"]:
            if _on_a_signature_rule(box_of(field), dropped):
                problems.append({"check": "signature", "page": number, "id": field["id"],
                                 "detail": "box sits on a signature rule"})


def check_structure(fields, page_sizes, problems):
    """Duplicate ids, shared positions, overlapping boxes, slivers, bounds."""
    for detail in bp.check_geometry(fields, page_sizes):
        problems.append({"check": "geometry", "page": None, "id": None, "detail": detail})

    seen = {}
    for field in fields:
        key = (field["page"], round(field["x"], 1), round(field["y"], 1))
        if key in seen:
            problems.append({"check": "duplicate-position", "page": field["page"],
                             "id": field["id"], "detail": "same x/y as %s" % seen[key]})
        seen[key] = field["id"]

    by_page = collections.defaultdict(list)
    for field in fields:
        by_page[field["page"]].append(field)
    for number, group in by_page.items():
        for i, first in enumerate(group):
            a = box_of(first)
            for second in group[i + 1:]:
                b = box_of(second)
                overlap = (a & b).get_area()
                if overlap > 0.25 * min(a.get_area(), b.get_area()):
                    problems.append({"check": "box-overlap", "page": number,
                                     "id": first["id"],
                                     "detail": "overlaps %s" % second["id"]})

    for field in fields:
        if field["type"] == "CheckBox":
            continue
        if field["width"] / SCALE < MIN_FIELD_WIDTH:
            problems.append({"check": "sliver", "page": field["page"], "id": field["id"],
                             "detail": "%.1fpt wide" % (field["width"] / SCALE)})


def check_unfilled_rectangles(doc, fields, problems):
    """A writing area the form draws as a rectangle, with no field on it.

    This is the check that would have caught the biggest defect in the first
    build: 73 of Form 15-47's writing areas -- "Job/Occupation", "Name of
    employer", the whole of page 7 -- are drawn as plain rectangles rather than
    as ruled cells or underscore rules, and nothing placed a field on them.

    Shaded rectangles are excused, because a shaded row is a section heading
    (the same rule the build uses), and so are rectangles holding printed text.
    """
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        mine = [box_of(f) for f in fields if f["page"] == number]
        cells = B.grid_cells(page)
        pix = B.page_greyscale(page)
        for rect in B.drawn_boxes(page):
            if any((rect & other).get_area() > 0.35 * rect.get_area() for other in mine):
                continue
            if B.is_shaded(pix, page, rect):
                continue
            problems.append({"check": "unfilled-rectangle", "page": number, "id": None,
                             "detail": "a %.0fx%.0f drawn box at %.0f,%.0f has no field"
                                       % (rect.width, rect.height, rect.x0, rect.y0)})


def check_amount_seating(doc, fields, problems):
    """An amount box must sit on its own `$`, not merely in the same cell.

    Form 15-47 p9 puts the self-employment `$` two-thirds of the way down a tall
    cell; anchoring the box to the cell's top left the printed `$` with nothing
    beside it and the box 40pt adrift.
    """
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        dollars = []
        for text, boxes, _sizes in B.line_chars(page):
            for index, char in enumerate(text):
                if char == "$":
                    dollars.append(boxes[index])
        for field in [f for f in fields if f["page"] == number]:
            box = box_of(field)
            mine = [d for d in dollars
                    if 0 <= box.x0 - d.x1 <= 6 and d.y0 < box.y1 and d.y1 > box.y0]
            if not mine:
                continue
            nearest = min(mine, key=lambda d: abs(d.y0 - box.y0))
            if abs(nearest.y0 - box.y0) > 6:
                problems.append({"check": "amount-seating", "page": number,
                                 "id": field["id"],
                                 "detail": "box top %.1f but its $ is at %.1f"
                                           % (box.y0, nearest.y0)})


def check_stacking(doc, fields, problems):
    """Two boxes in the same column may not overlap vertically at all.

    The generic overlap gate is an area test and passes a 2pt bleed between two
    13pt boxes; the viewer draws a border on each and renders them as a crushed
    stack (Form 15-47 p9's five "Gross $____" rows, set on a 12pt pitch).
    """
    by_page = collections.defaultdict(list)
    for field in fields:
        by_page[field["page"]].append(field)
    for number, group in by_page.items():
        boxes = sorted(((box_of(f), f) for f in group), key=lambda pair: pair[0].y0)
        for index, (first, field) in enumerate(boxes):
            for second, other in boxes[index + 1:]:
                if second.y0 >= first.y1 - 0.01:
                    break
                overlap_x = min(first.x1, second.x1) - max(first.x0, second.x0)
                if overlap_x > 1.0:
                    problems.append({
                        "check": "stacked", "page": number, "id": field["id"],
                        "detail": "overlaps %s by %.1fpt vertically"
                                  % (other["id"], first.y1 - second.y0)})
                    break


def check_edge_clearance(doc, fields, problems):
    """A box may not start flush against a letter printed on its own line.

    The overlay rectangle is correct in these cases -- Saskatchewan sets a blank
    at exactly the x where the preceding word ends -- but the viewer draws a
    bordered control inside it and the border sits on the letter.
    """
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        glyphs = []
        for text, boxes, _sizes in B.line_chars(page):
            for index, char in enumerate(text):
                if char not in " \t_":
                    glyphs.append(boxes[index])
        for field in [f for f in fields if f["page"] == number and f["type"] != "CheckBox"]:
            box = box_of(field)
            for glyph in glyphs:
                if glyph.y1 < box.y0 + 2 or glyph.y0 > box.y1 - 2:
                    continue
                if -0.5 <= box.x0 - glyph.x1 < 1.0 or -0.5 <= glyph.x0 - box.x1 < 1.0:
                    problems.append({"check": "edge-clearance", "page": number,
                                     "id": field["id"],
                                     "detail": "starts flush against printed type"})
                    break


def check_dollar_slots(doc, fields, problems):
    """Every printed `$` that opens an empty amount slot must have a box after it.

    The strongest single signal on a financial form: the government prints a `$`
    exactly where a figure is to be written. Three separate faults hid behind it
    -- a `$` set flush with its cell's top rule so the cell read as empty and the
    box landed *on* the `$`; a shaded amount row skipped as if it were a section
    heading; and a tall cell whose box sat at the top instead of beside the glyph.
    39 slots on the two financial forms. A `$` followed by a digit is prose
    ("$150,000 per year"), not a slot.
    """
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        here = [f for f in fields if f["page"] == number]
        mine = [box_of(f) for f in here]
        for text, boxes, _sizes in B.line_chars(page):
            for index, char in enumerate(text):
                if char != "$":
                    continue
                following = text[index + 1:index + 3].strip()
                if following and following[0].isdigit():
                    continue
                glyph = boxes[index]
                # An amount is one line, so its control is a TextField. A column
                # that mixes TextField and TextArea for the same kind of figure
                # reads as two different inputs (guide 8).
                for field in here:
                    box = box_of(field)
                    if (box.x0 >= glyph.x1 - 1 and box.x0 - glyph.x1 < 40
                            and box.y0 < glyph.y1 and box.y1 > glyph.y0
                            and field["type"] != "TextField"):
                        problems.append({"check": "dollar-type", "page": number,
                                         "id": field["id"],
                                         "detail": "amount box is %s, not TextField"
                                                   % field["type"]})
                if any((box & glyph).get_area() > 0.4 * glyph.get_area() for box in mine):
                    problems.append({"check": "dollar-covered", "page": number, "id": None,
                                     "detail": "a box covers the $ at %.0f,%.0f"
                                               % (glyph.x0, glyph.y0)})
                    continue
                if any(box.x0 >= glyph.x1 - 1 and box.x0 - glyph.x1 < 40
                       and box.y0 < glyph.y1 and box.y1 > glyph.y0 for box in mine):
                    continue
                problems.append({"check": "dollar-slot", "page": number, "id": None,
                                 "detail": "the $ at %.0f,%.0f has no box beside it"
                                           % (glyph.x0, glyph.y0)})


CHECKS = (check_printed_text, check_checkbox_marks, check_unfilled_blanks,
          check_signatures, check_unfilled_rectangles, check_amount_seating,
          check_stacking, check_edge_clearance, check_dollar_slots)


def verify(doc_id, folder):
    pdf = os.path.join(folder, "%s.pdf" % doc_id)
    mapping = os.path.join(folder, "%s.json" % doc_id)
    if not (os.path.exists(pdf) and os.path.exists(mapping)):
        return [{"check": "missing", "page": None, "id": None, "detail": "no pdf/json"}]
    fields = json.load(open(mapping))["staticFields"]
    doc = fitz.open(pdf)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    problems = []
    check_structure(fields, page_sizes, problems)
    for check in CHECKS:
        check(doc, fields, problems)
    doc.close()
    return problems


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", action="store_true",
                        help="verify the staged build rather than the promoted templates")
    parser.add_argument("--only", action="append", default=None)
    parser.add_argument("--category", default=None)
    args = parser.parse_args()

    folder = os.path.join(STAGE, "out") if args.stage else EXPORT
    sources = shipped_sources()
    if args.only:
        sources = [s for s in sources if s["docId"] in set(args.only)]
    if args.category:
        sources = [s for s in sources if s["category"].endswith(args.category)]

    totals = collections.Counter()
    report = {}
    for src in sources:
        problems = verify(src["docId"], folder)
        report[src["docId"]] = problems
        kinds = collections.Counter(p["check"] for p in problems)
        totals.update(kinds)
        flag = "OK " if not problems else "%-3d" % len(problems)
        print("%-13s %s %s" % (src["docId"], flag, dict(kinds) if kinds else ""))
    print("\n%d forms. Findings: %s" % (len(sources), dict(totals) or "none"))
    with open(os.path.join(STAGE, "verify_report.json"), "w") as fh:
        json.dump(report, fh, indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())

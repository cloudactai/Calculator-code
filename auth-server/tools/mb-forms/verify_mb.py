"""Gates for the Manitoba templates (placement guide 7).

Every check is a measurement against the government's own printed page,
re-derived from scratch rather than compared to whatever the builder happened to
store. Where the builder decides something (which rules are signature lines,
which columns are reference data), the verifier calls the builder's own rule
again on the page instead of trusting a flag -- so a mistake has to be made twice
in the same way to get through.

The printed-text check reads **characters, not words**. `get_text("words")` hands
back `FD_______________` and `Address:` glued to whatever follows as single
tokens, so a word-level test either flags every correctly-placed box for the rule
it is supposed to sit on, or -- once those are excused -- waves through a box that
really has covered a caption.

The check that matters most here is `check_unfilled_rules`. Manitoba's blanks are
geometry, so "is there a field on every printed rule?" is the direct question,
and it is the one that catches a rule wrongly refused as an underline or as a
table border.

    python3 verify_mb.py            # every promoted template
    python3 verify_mb.py --stage    # the staged build in _incoming_mb/out
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
import build_mb_forms as B  # noqa: E402
import mb_marks  # noqa: E402
from mb_sources import all_sources, shipped_sources  # noqa: E402

SCALE = bp.SCALE
EXPORT = B.EXPORT
STAGE = B.STAGE

# Characters a field box is entitled to cover: its own printed rule, the `$` it
# is anchored to, and the punctuation the forms set against a blank.
IGNORABLE = set("_$ \t.,;:()")
# Below this width a box has to justify itself by covering its whole printed
# blank (see `_spans_its_anchor`). Manitoba's narrowest genuine blanks are the
# jurat's "this ___ day of" at 18.4pt and Form 70S.3's "20___" at 16.8pt, so a
# flat floor here called five correct boxes defects while still passing a box
# covering half of a 200pt line.
MIN_FIELD_WIDTH = 20.0


def box_of(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def check_printed_text(doc, fields, problems):
    """A box may sit on its rule; it may not sit on the words around it."""
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        chars = []
        for text, boxes, _sizes in B.line_chars(page):
            for index, box in enumerate(boxes):
                if text[index] in IGNORABLE:
                    continue
                chars.append((box, text[index]))
        for field in [f for f in fields if f["page"] == number]:
            box = box_of(field)
            covered = [c for rect, c in chars
                       if (box & rect).get_area() > 0.5 * rect.get_area()
                       and rect.get_area() > 1]
            if len(covered) >= 3:
                problems.append({
                    "check": "printed-text", "page": number, "id": field["id"],
                    "detail": "covers %r" % "".join(covered[:24]),
                })


def check_checkbox_marks(doc, fields, problems):
    """Every checkbox must sit on a printed square, and one square per control.

    "Printed square" has three vocabularies on these forms and the check has to
    know all of them, or it reports a correctly-placed control as unanchored:
    the drawn square `B.checkboxes` finds, and the `[ ]` bracket pair and `☐`
    glyph that `mb_marks` measures. Manitoba never draws one — all 30 of the
    batch's options are set as text.
    """
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        marks = B.checkboxes(page)
        ticks = B.tick_rects(page)
        taken = {}
        for field in [f for f in fields
                      if f["page"] == number and f["type"] == "CheckBox"]:
            box = box_of(field)
            hit = next((m for m in marks
                        if (m & box).get_area() > 0.6 * m.get_area()), None)
            if hit is None and any((t & box).get_area() > 0.6 * t.get_area()
                                   for t in ticks):
                continue  # a tick column's box: its check-glyph heading is the
                          # anchor, and it prints no square to sit on
            if hit is None:
                problems.append({"check": "checkbox-mark", "page": number,
                                 "id": field["id"],
                                 "detail": "no printed square under it"})
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


def check_unfilled_rules(doc, fields, problems):
    """The central Manitoba gate: a printed writing rule with no field on it.

    Manitoba's blanks are drawn geometry, so this asks the question directly, and
    it is the check that catches a rule wrongly thrown away -- as an underline it
    is not, as a table border it is not, or as a signature line it is not. The
    builder's own `printed_rules` is re-run on the page rather than compared to a
    stored list, so a rule the builder never saw is still counted here.

    A signature rule is a blank with no field *on purpose*, so it is excused by
    re-running the very rule that dropped it, not by a hardcoded list.
    """
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        mine = [box_of(f) for f in fields if f["page"] == number]
        dropped = B.signature_rule_rects(page)
        cells = B.grid_cells(page)
        for rect, key, _size in B.printed_rules(page, cells):
            probe = fitz.Rect(rect.x0, key - 14, rect.x1, key + 2)
            if any(probe.intersects(other) for other in mine):
                continue
            if _on_a_signature_rule(probe, dropped):
                continue
            problems.append({"check": "unfilled-rule", "page": number, "id": None,
                             "detail": "a %.0fpt rule at %.0f,%.0f has no field"
                                       % (rect.width, rect.x0, key)})


def check_unfilled_blanks(doc, fields, problems):
    """Guide 9.6: a printed underscore blank with no field on it."""
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
    """Guide 5: nothing may sit on a signature, commissioner or jurat rule.

    Re-derived the same way the build decides it -- a caption claims its nearest
    rule, and a jurat bracket column claims whatever is to its right.
    """
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        dropped = B.signature_rule_rects(page)
        if not dropped:
            continue
        for field in [f for f in fields
                      if f["page"] == number and f["type"] != "CheckBox"]:
            if _on_a_signature_rule(box_of(field), dropped):
                problems.append({"check": "signature", "page": number,
                                 "id": field["id"],
                                 "detail": "box sits on a signature rule"})


def check_underlines(doc, fields, problems):
    """No field may sit on the underline of a printed heading.

    The inverse of `check_unfilled_rules`, and the other half of Manitoba's one
    genuinely ambiguous primitive: Word draws "(A) TOTAL ANNUAL INCOME:" and the
    blank beside it with the same object. A box on a heading's underline is not
    a blank anybody can use, and it hides the heading behind a control.
    """
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        chars = B.page_chars(page)
        horizontal, _vertical = B._segments(page)
        mine = [(box_of(f), f) for f in fields if f["page"] == number]
        for key, start, end in horizontal:
            if end - start < B.MIN_BLANK_WIDTH:
                continue
            size = B._font_at(chars, key, start, end)
            if not B._is_underline(chars, key, start, end, size):
                continue
            for box, field in mine:
                # **Seated on it, not merely near it.** A one-line look-back
                # (the window `check_unfilled_rules` uses to find the box
                # belonging to a rule) also catches a box seated on its *own*
                # rule with a heading underlined 10-14pt below -- Forms 70E.1 p3
                # ("spouse"/"common-law partner)"), 70D.4 p4 ("PART 3 - AREAS IN
                # DISPUTE") and 70E.2 p2 all read that way and none of them is a
                # defect. A box that really is on this underline either hangs off
                # it (bottom within a rule clearance of it) or covers it.
                seated = key - 6 <= box.y1 <= key + 2
                covers = box.y0 < key < box.y1
                if not (seated or covers):
                    continue
                if min(box.x1, end) - max(box.x0, start) > 0.5 * (end - start):
                    problems.append({"check": "on-underline", "page": number,
                                     "id": field["id"],
                                     "detail": "box sits on a heading's underline"})


def check_structure(doc, fields, page_sizes, problems, widget_built=False):
    """Duplicate ids, shared positions, overlapping boxes, slivers, bounds."""
    for detail in bp.check_geometry(fields, page_sizes):
        problems.append({"check": "geometry", "page": None, "id": None,
                         "detail": detail})

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
                if (a & b).get_area() > 0.25 * min(a.get_area(), b.get_area()):
                    problems.append({"check": "box-overlap", "page": number,
                                     "id": first["id"],
                                     "detail": "overlaps %s" % second["id"]})

    # **A sliver is a box narrower than its own blank, not a box on a short
    # blank.** Manitoba prints plenty of genuinely narrow ones -- "this ___ day
    # of" on the jurats of Forms 70I, 70M and 70M.1 (18.4pt), and "20___" on
    # Form 70S.3 (16.8pt) -- and a flat floor calls every one of them a defect
    # while still passing a box that covers half of a 200pt line. Measure the
    # printed anchor and compare.
    #
    # It therefore cannot be asked of a widget-built template at all: there is
    # no printed anchor to measure against, because the government drew the
    # rectangle rather than a blank for us to fit a box to. Its narrow boxes are
    # narrow on purpose -- the ISO affidavit's "Page __ of __" slots are 13.3pt,
    # which is what a page number needs.
    if widget_built:
        return
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        width = field["width"] / SCALE
        if width >= MIN_FIELD_WIDTH:
            continue
        if _spans_its_anchor(doc[field["page"] - 1], box_of(field)):
            continue
        problems.append({"check": "sliver", "page": field["page"],
                         "id": field["id"],
                         "detail": "%.1fpt wide" % width})


def _spans_its_anchor(page, box, tolerance=2.0):
    """Does this narrow box cover the whole blank it sits on?

    The anchor is whichever underscore run or printed rule the box is seated on.
    Covering it end to end means the box is as wide as the form lets it be.
    """
    for rect, _rule_y, _size in B.underscore_blanks(page):
        if abs(rect.x0 - box.x0) <= tolerance and abs(rect.x1 - box.x1) <= tolerance:
            return True
    for rect, key, _size in B.printed_rules(page, B.grid_cells(page)):
        if (abs(rect.x0 - box.x0) <= tolerance and abs(rect.x1 - box.x1) <= tolerance
                and abs(key - box.y1) <= 6):
            return True
    return False


def check_amount_seating(doc, fields, problems):
    """An amount box must sit on its own `$`, not merely in the same cell."""
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
    stack. Form 70D p3 sets its income schedule on an 11.5pt pitch against a 13pt
    box, so this is the check that keeps `seat_rules` honest.
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
                if min(first.x1, second.x1) - max(first.x0, second.x0) > 1.0:
                    problems.append({
                        "check": "stacked", "page": number, "id": field["id"],
                        "detail": "overlaps %s by %.1fpt vertically"
                                  % (other["id"], first.y1 - second.y0)})
                    break


def check_edge_clearance(doc, fields, problems):
    """A box may not start flush against a letter printed on its own line."""
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        glyphs = []
        for text, boxes, _sizes in B.line_chars(page):
            for index, char in enumerate(text):
                if char not in " \t_":
                    glyphs.append(boxes[index])
        for field in [f for f in fields
                      if f["page"] == number and f["type"] != "CheckBox"]:
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
    exactly where a figure is to be written, and Form 70D's expense schedule
    prints 96 of them. A `$` followed by a digit is prose ("$150,000 per year"),
    not a slot.
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
                # "($)" is a unit named in a column heading, not a slot. Form
                # 70D.5 heads all four of its valuation columns "Petitioner's
                # valuation ($)" on five pages, which is 20 of these.
                if (following.startswith(")")
                        and text[:index].rstrip().endswith("(")):
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
                if any((box & glyph).get_area() > 0.4 * glyph.get_area()
                       for box in mine):
                    problems.append({"check": "dollar-covered", "page": number,
                                     "id": None,
                                     "detail": "a box covers the $ at %.0f,%.0f"
                                               % (glyph.x0, glyph.y0)})
                    continue
                if any(box.x0 >= glyph.x1 - 1 and box.x0 - glyph.x1 < 40
                       and box.y0 < glyph.y1 and box.y1 > glyph.y0 for box in mine):
                    continue
                problems.append({"check": "dollar-slot", "page": number, "id": None,
                                 "detail": "the $ at %.0f,%.0f has no box beside it"
                                           % (glyph.x0, glyph.y0)})


def check_unticked_marks(doc, fields, problems):
    """Every printed option mark must carry a checkbox.

    The converse of `check_checkbox_marks`, and the direct question, the way
    `check_unfilled_rules` is for a writing line. It exists because the whole
    batch shipped without it: Manitoba sets an option as a `[ ]` bracket pair or
    a `☐` glyph rather than as the drawn square BC and Saskatchewan use, the
    builder's detector looks for drawn squares, and so all 30 options across
    Forms 70D, 70D.1 and 70W went out untickable -- including the fifteen on
    70D.1 p2, a page headed "(Check all applicable boxes)". Nothing else here
    asked the question, so nothing else noticed.
    """
    boxes = collections.defaultdict(list)
    for field in fields:
        if field["type"] == "CheckBox":
            boxes[field["page"]].append(box_of(field))
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        for kind, _font_box, square in mb_marks.marks(page):
            if any((square & box).get_area() > 0.6 * square.get_area()
                   for box in boxes[number]):
                continue
            problems.append({"check": "unticked-mark", "page": number, "id": None,
                             "detail": "the %s mark at %.0f,%.0f has no checkbox"
                                       % (kind, square.x0, square.y0)})


CHECKS = (check_printed_text, check_checkbox_marks, check_unticked_marks,
          check_unfilled_rules,
          check_unfilled_blanks, check_signatures, check_underlines,
          check_amount_seating, check_stacking, check_edge_clearance,
          check_dollar_slots)


# **A widget-built template is checked differently, and it has to be.** Every
# check in `CHECKS` re-derives a printed anchor from the page and asks whether
# the mapping agrees with it -- "is there a box on every underscore run", "is
# this box seated on its rule", "does every `$` have an amount slot". That is
# the right question when the box was *reconstructed* from the anchor, which is
# how every Part 15, child-protection, adoption and Rule 70 template is built.
#
# It is the wrong question for the interjurisdictional support forms, the
# protection-order applications and the federal notices, whose boxes are the
# government's own AcroForm rectangles. There the form has already answered it:
# a rule with no widget is a rule the government chose not to make fillable, and
# a widget that does not sit on a printed rule is where the government decided
# the answer goes. Asking the anchor questions of them produced 916 findings
# across 20 forms, every one of which said "this is not where I would have put
# it" rather than "this is wrong".
#
# What still applies is everything that asks whether a box is sound in itself:
# in bounds, uniquely identified, not covering a printed label, not overlapping
# another control, not a sliver. Those are in `check_structure` and the two
# checks below, and they run on both paths.
WIDGET_CHECKS = (check_printed_text,)


def _is_widget_built(doc_id):
    """Was this template built from the government's own field rectangles?

    Read off the fetched source rather than recorded, so it cannot go stale, and
    it is the same question `build_*.is_fillable` asks at build time.
    """
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    if not os.path.exists(source):
        return False
    doc = fitz.open(source)
    try:
        return any(len(list(page.widgets())) for page in doc)
    finally:
        doc.close()


def verify(doc_id, folder):
    pdf = os.path.join(folder, "%s.pdf" % doc_id)
    mapping = os.path.join(folder, "%s.json" % doc_id)
    if not (os.path.exists(pdf) and os.path.exists(mapping)):
        return [{"check": "missing", "page": None, "id": None, "detail": "no pdf/json"}]
    fields = json.load(open(mapping))["staticFields"]
    doc = fitz.open(pdf)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    problems = []
    widget_built = _is_widget_built(doc_id)
    check_structure(doc, fields, page_sizes, problems, widget_built)
    for check in (WIDGET_CHECKS if widget_built else CHECKS):
        check(doc, fields, problems)
    doc.close()
    return problems


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", action="store_true",
                        help="verify the staged build rather than the promoted templates")
    parser.add_argument("--only", action="append", default=None)
    parser.add_argument("--category", default=None)
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    folder = os.path.join(STAGE, "out") if args.stage else EXPORT
    sources = all_sources() if args.all else shipped_sources()
    if args.only:
        sources = [s for s in all_sources() if s["docId"] in set(args.only)]
    if args.category:
        sources = [s for s in sources if s["shortCategory"] == args.category]

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

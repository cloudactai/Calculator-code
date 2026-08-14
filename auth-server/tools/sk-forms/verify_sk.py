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
from sk_sources import all_sources  # noqa: E402

SCALE = bp.SCALE
EXPORT = B.EXPORT
STAGE = B.STAGE

# Characters a field box is entitled to cover: its own printed rule, the `$` it
# is anchored to, and the punctuation the form sets against a blank.
IGNORABLE = set("_$ \t.,;:()")
# Narrower than this is a sliver worth justifying. The smallest legitimate blank
# in the whole 40-form set is 21.2pt: Saskatchewan prints the year as "2 _____"
# and that run holds the last two digits (Form 15-78 p2, and the same slot in
# every jurat). The floor sits just under it rather than at a round number.
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
        marks = B.checkboxes(page)
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


CHECKS = (check_printed_text, check_checkbox_marks, check_unfilled_blanks, check_signatures)


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
    sources = all_sources()
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

"""Sweep every promoted Ontario template for the faults a render would show.

`verify_on_forms.py` proves each field is well-formed and on the page.
This asks the harder questions a person notices when they look at a page:

- **stacked** — two boxes covering the same spot. A lawyer can only type into
  whichever one the editor puts on top, so the other is dead.
- **missed** — a printed anchor (a ☐ glyph, a grey Word field, an empty ruled
  cell) with no box on it: a blank that cannot be filled.
- **oversized** — a box taller than a writing area has any business being,
  usually a frame that swallowed a whole section.
- **slivers** — a box too small to type into.
- **runaway** — a box wider than the page's own text column, which normally
  means two columns were merged into one field.

Run: python3 audit_on_forms.py [--all] [docId ...]
Without arguments it audits the templates this batch produced.
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "bc-forms")))

import place_flat_fields as flat  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
SCALE = 1.5

STACK_SHARE = 0.5      # of the smaller box
SLIVER_WIDTH = 8.0
CHECK_MIN = 4.0
SLIVER_HEIGHT = 6.0
MAX_FIELD_HEIGHT = 260.0
ANCHOR_COVERED = 0.35  # of the anchor


def box_of(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def anchors(page):
    """Everything on the page that a field is supposed to be sitting on."""
    found = [("glyph", r) for r in flat.glyph_rects(page)]
    found += [("shaded", r) for r in flat.shade_rects(page)]
    found += [("cell", r) for r in flat.ruled_cells(page)]
    return found


def inferred_sources():
    """docIds whose boxes were read off the printed page rather than off widgets."""
    path = os.path.join(EXPORT, "_incoming_on", "out", "on_audit.json")
    if not os.path.exists(path):
        return set()
    return {a["docId"] for a in json.load(open(path)) if a.get("source") in ("flat", "xfa")}


def audit(doc_id, inferred=False):
    mapping = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    problems = []

    for number, page in enumerate(doc, start=1):
        here = [(f, box_of(f)) for f in mapping if f["page"] == number]

        for index, (field, box) in enumerate(here):
            for other, other_box in here[index + 1:]:
                overlap = box & other_box
                if overlap.is_empty:
                    continue
                smaller = min(box.get_area(), other_box.get_area())
                if smaller > 0 and overlap.get_area() > STACK_SHARE * smaller:
                    problems.append(("stacked", number, "%s over %s" % (field["id"], other["id"])))

            # A checkbox is small by nature — the ink-refined ☐ glyphs come out
            # ~7pt square, which is the printed box, not a sliver.
            floor = CHECK_MIN if field["type"] == "CheckBox" else SLIVER_WIDTH
            if box.width < floor or box.height < min(floor, SLIVER_HEIGHT):
                problems.append(("sliver", number, "%s is %.0f×%.0f" % (field["id"], box.width, box.height)))
            # Only meaningful where the box was inferred. On an AcroForm source a
            # tall box is the government's own widget — Form 26 p6 and Form 33B.2
            # p4 both give a full page to one "give reasons" area, and that is the
            # form, not a fault.
            if inferred and field["type"] != "CheckBox" and box.height > MAX_FIELD_HEIGHT:
                problems.append(("oversized", number, "%s is %.0f tall" % (field["id"], box.height)))
            if box.width > page.rect.width - 20:
                problems.append(("runaway", number, "%s spans %.0f of %.0f"
                                 % (field["id"], box.width, page.rect.width)))

        for kind, anchor in anchors(page):
            if anchor.get_area() <= 1:
                continue
            covered = max(((anchor & box).get_area() for _, box in here), default=0.0)
            if covered < ANCHOR_COVERED * anchor.get_area():
                problems.append(("missed-%s" % kind, number,
                                 "%.0f,%.0f %.0f×%.0f" % (anchor.x0, anchor.y0, anchor.width, anchor.height)))

    doc.close()
    return problems


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        targets = args
    elif "--all" in sys.argv:
        targets = [i["docId"] for i in json.load(open(os.path.join(EXPORT, "catalog.json")))
                   if i["province"] == "ON"]
    else:
        targets = [r["docId"] for r in
                   json.load(open(os.path.join(EXPORT, "_incoming_on", "out", "on_rows.json")))]

    inferred = inferred_sources()
    totals, dirty = {}, 0
    for doc_id in targets:
        problems = audit(doc_id, doc_id in inferred)
        if not problems:
            continue
        dirty += 1
        counts = {}
        for kind, _, _ in problems:
            counts[kind] = counts.get(kind, 0) + 1
        totals = {k: totals.get(k, 0) + v for k, v in counts.items()} | \
                 {k: v for k, v in totals.items() if k not in counts}
        print("%-12s %s" % (doc_id, "  ".join("%s=%d" % kv for kv in sorted(counts.items()))))
        for kind, page, detail in problems[:4]:
            print("             p%-2d %-14s %s" % (page, kind, detail))

    print("\n%d of %d templates flagged" % (dirty, len(targets)))
    print("totals: %s" % ("  ".join("%s=%d" % kv for kv in sorted(totals.items())) or "clean"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

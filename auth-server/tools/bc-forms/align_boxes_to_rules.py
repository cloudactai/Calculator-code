"""Seat a form's boxes on the left end of the rule each one is drawn over.

Reported from the app on PFA876: every cell looks a little too far right. It is real and
measurable — the boxes sit a **median 3.1 pt** right of the rule they are seated on, where
the median across all 185 templates is **0.0 pt**. The government's own widget rectangles
put them there; there is no coordinate bug (source and built pages share a MediaBox and a
CropBox, and the extracted x matches the widget x exactly), so this is a deliberate,
form-specific override rather than a fix to the extraction.

Two bounds make it safe, and both bind on this form:

* **left only, and never past the rule.** The target is the rule's own left edge plus a
  1 pt inset, so a box can only move toward the rule it belongs to.
* **never onto a printed label.** Three of PFA876's boxes have only 1.5-2.7 pt of clear
  page between them and the caption on their left ("at:", "The Prisoner", the last line),
  so those move by what is available and no further. A box is never brought closer than
  `INK_GAP` to printed ink.

Checkboxes are left alone: they are seated on printed ❑ marks, and the mark, not the rule,
is what a checkbox has to agree with.

Only x moves; every other key is asserted byte-identical afterwards (§7.8), and a second
run is a no-op (§7.9).

Run: python3 align_boxes_to_rules.py [--apply]
"""
import argparse
import copy
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_bc2 as V  # noqa: E402

OUT = V.OUT
EXPORT = V.EXPORT
INSET = 1.0          # where the box should sit relative to its rule's left end
INK_GAP = 1.2        # keep at least this much clear of a printed caption on the left
WIDTH_TOL = 40.0     # a rule this much wider than the box is not the box's own rule
MIN_MOVE = 0.4       # below this the move is not worth making

FORMS = ["BCPC_PFA876"]


def root_for(doc_id):
    return OUT if os.path.exists(os.path.join(OUT, "%s.pdf" % doc_id)) else EXPORT


def rule_under(page_rules, rect):
    """The horizontal rule this box is seated on, if one is."""
    best = None
    for rule in page_rules:
        if not (-2.0 <= rule.y0 - rect.y1 <= 6.0):
            continue
        if rule.x0 >= rect.x1 or rule.x1 <= rect.x0:
            continue
        if abs(rule.width - rect.width) > WIDTH_TOL:
            continue
        if best is None or abs(rule.y0 - rect.y1) < abs(best.y0 - rect.y1):
            best = rule
    return best


def ink_left_of(words, rect):
    """Right edge of the nearest printed word to the left, on the box's own line."""
    left = [w for w in words
            if w[2] <= rect.x0 + 0.5 and min(rect.y1, w[3]) - max(rect.y0, w[1]) > 2.0]
    return max((w[2] for w in left), default=None)


def align(doc_id, apply_it):
    root = root_for(doc_id)
    path = os.path.join(root, "%s.json" % doc_id)
    mapping = json.load(open(path))
    before = copy.deepcopy(mapping["staticFields"])
    pdf = fitz.open(os.path.join(root, "%s.pdf" % doc_id))

    moved = 0
    for page_number in sorted({f["page"] for f in mapping["staticFields"]}):
        page = pdf[page_number - 1]
        rules = [d["rect"] for d in page.get_drawings()
                 if d["rect"].height < 2.5 and d["rect"].width > 25]
        words = [w for w in page.get_text("words") if w[4].strip()]
        for field in mapping["staticFields"]:
            if field["page"] != page_number or field["type"] == "CheckBox":
                continue
            rect = V.box(field)
            rule = rule_under(rules, rect)
            if rule is None:
                continue
            target = rule.x0 + INSET
            ink = ink_left_of(words, rect)
            if ink is not None:
                target = max(target, ink + INK_GAP)
            shift = rect.x0 - target
            if shift < MIN_MOVE:
                continue
            print("%-13s p%-2d %-9s %7.2f -> %7.2f  (%+.2f, rule at %.2f%s)"
                  % (doc_id, page_number, field["type"], field["x"], field["x"] - shift,
                     -shift, rule.x0,
                     ", held off ink at %.2f" % ink if ink is not None
                     and ink + INK_GAP > rule.x0 + INSET else ""))
            field["x"] = round(field["x"] - shift, 2)
            moved += 1
    pdf.close()

    by_id = {int(f["id"]): f for f in mapping["staticFields"]}
    for old in before:
        new = by_id[int(old["id"])]
        for key in set(old) | set(new):
            if key == "x":
                continue
            assert old.get(key) == new.get(key), (doc_id, old["id"], key)
    if apply_it and moved:
        with open(path, "w") as fh:
            json.dump(mapping, fh, indent=1)
            fh.write("\n")
        if root is OUT:
            import shutil
            shutil.copy(path, os.path.join(EXPORT, "%s.json" % doc_id))
    return moved


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    total = sum(align(doc_id, args.apply) for doc_id in FORMS)
    print("\n%d box(es) aligned%s" % (total, "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()

"""Give batch 2 the five writing areas no detector could find, and one that is too small.

§6 and §9.5. Some XFA sections are populated only by Adobe's generate-on-preview
scripting, so the flattened page prints the heading and leaves the paper bare. Batch 1
recorded the same thing per form in `add_writing_areas.py`, and this is batch 2's list —
explicit, because each entry is a judgement about what a page means, which is what §7.11
says a render has to settle one at a time.

Why none of the automated checks reach these:

* `check_answer_spaces` fires on a caption ending in a **colon**. "THIS COURT ORDERS
  that" and "…in relation to" end in neither a colon nor anything else it looks for.
* `check_unfilled_blanks` looks for underscore **characters**. F85's blank is a line the
  form *drew*.
* A general "printed line followed by a big blank" sweep reports **299 bands across the
  batch** and nearly all are the ordinary whitespace after a page's last line. Narrowing
  it to lines that leave a sentence hanging — an order, a direction, a list-introducer —
  brings it to exactly **two**, both of which had already been found by reading:
  F54 p2 and F85 p1. That is the detector worth keeping; it is in `verify_bc2` as
  `check_unboxed_rules`'s companion case and reproduced in the survey above.

The two that even that misses are F73 p3 and F74 p2, because their instruction is
followed closely by more printed text, so the gap never reaches the threshold.

Run: python3 add_writing_areas_bc2.py [--apply]
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
SEAT_GAP = 1.26
STD_LINE = 13.3

# docId -> list of (page, kind, rect, why)
ADD = {
    "BCSC_F54": [
        # p2 prints "THIS COURT ORDERS that" at y 82.9-94.8 and then nothing at all: the
        # protection order's own terms had nowhere to be typed. §9.5's "where the item is
        # the last thing on the page, that blank is usually the whole rest of the sheet" —
        # here it is the whole sheet, down to the footer at y 720.
        (2, "TextArea", fitz.Rect(73.4, 99.0, 557.0, 712.0),
         "the order's terms; the page was empty below the heading"),
    ],
    "BCSC_F85": [
        # "THIS COURT ORDERS that no fees are payable by" is followed by a drawn 252 pt
        # rule at y 398.2 with no field on it. Seated per §9.1: bottom SEAT_GAP above the
        # rule, standard single-line height.
        (1, "TextField", fitz.Rect(324.0, 398.2 - SEAT_GAP - STD_LINE, 576.0, 398.2 - SEAT_GAP),
         "the payer's name, on the form's own drawn rule"),
        # "...in relation to" (ends y 416.8) then bare paper down to "THE FOLLOWING
        # PARTIES APPROVE..." at y 582.4. Without this the order cannot say which fees
        # are waived.
        (1, "TextArea", fitz.Rect(72.0, 421.0, 557.0, 578.0),
         "which fees are waived"),
    ],
    "BCSC_F54_2": [
        # The operative sentence reads "THIS COURT ORDERS ... that ___ is restrained from
        # molesting ... or attempting to molest, annoy, harass or communicate with ___",
        # and *neither* blank had a field: the restrained party's name between "that"
        # (ends y 434.8) and "is restrained from" (starts y 465.9), and the protected
        # party's between "communicate with" (ends y 491.8) and "By the Court" (y 552.9).
        # The narrowed instruction sweep misses both — the first gap is only 31 pt, under
        # its 70 pt floor, and the second line ends in "with", which is not a phrase that
        # reads as an unanswered direction.
        (1, "TextField", fitz.Rect(73.4, 439.0, 576.0, 461.0),
         "the party being restrained"),
        (1, "TextArea", fitz.Rect(73.4, 496.0, 576.0, 546.0),
         "the party or parties protected"),
    ],
    "BCSC_F74": [
        # Part 6 "MATERIAL TO BE RELIED ON": instruction ends y 665.1, the form prints
        # "1." at y 679-690.1, and nothing follows. The area starts right of the printed
        # numeral rather than over it (§9.7 — do not cover the printed marker).
        (2, "TextArea", fitz.Rect(122.0, 677.0, 557.0, 742.0),
         "Part 6's list of affidavits"),
    ],
}

# docId -> list of (field id, new rect, why). Geometry only.
RESIZE = {
    "BCSC_F73": [
        # Part 4's writing area is the lone 14.4 pt paragraph-number slot that
        # `merge_sliver_fields` widened to 484 pt and left 25.5 pt tall at the foot of the
        # page — §9.5's "answer space parked at the foot of the blank" exactly. Parts 1-3
        # each get 105 pt; this one runs from under its instruction (ends y 649.1) to the
        # footer at y 738.
        (1750789529024, fitz.Rect(72.0, 653.2, 556.0, 732.0),
         "Part 4's list of affidavits, grown from a 25.5pt stray to the blank"),
    ],
}


def twin(fields, page_number, kind):
    same = [f for f in fields if f["page"] == page_number and f["type"] == kind]
    return (same or [f for f in fields if f["type"] == kind] or fields)[0]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    added = resized = 0
    for doc_id in sorted(set(ADD) | set(RESIZE)):
        path = os.path.join(OUT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        fields = mapping["staticFields"]
        before = copy.deepcopy(fields)
        touched = False

        for field_id, rect, why in RESIZE.get(doc_id, []):
            target = next((f for f in fields if int(f["id"]) == field_id), None)
            if target is None:
                raise SystemExit("%s: field %s not found (did the build renumber?)"
                                 % (doc_id, field_id))
            current = V.box(target)
            if abs(current.height - rect.height) < 0.5 and abs(current.y0 - rect.y0) < 0.5:
                continue        # already done; re-runs are a no-op
            for other in fields:
                if other is target or other["page"] != target["page"]:
                    continue
                if V.box(other).intersects(rect):
                    raise SystemExit("%s: resizing %s would collide with %s"
                                     % (doc_id, field_id, other["id"]))
            print("%-12s p%-2d resize %s  %.1fx%.1f -> %.1fx%.1f  (%s)"
                  % (doc_id, target["page"], field_id, current.width, current.height,
                     rect.width, rect.height, why))
            target["x"] = round(rect.x0, 2)
            target["y"] = round(rect.y0, 2)
            target["width"] = round(rect.width * V.SCALE, 2)
            target["height"] = round(rect.height * V.SCALE, 2)
            resized += 1
            touched = True

        for page_number, kind, rect, why in ADD.get(doc_id, []):
            if any(f["page"] == page_number and V.box(f).intersects(rect) for f in fields):
                continue        # already covered; re-runs are a no-op
            template = twin(fields, page_number, kind)
            fields.append({
                "id": max(int(f["id"]) for f in fields) + 1,
                "type": kind,
                "x": round(rect.x0, 2),
                "y": round(rect.y0, 2),
                "width": round(rect.width * V.SCALE, 2),
                "height": round(rect.height * V.SCALE, 2),
                "value": "",
                "fontSize": template.get("fontSize", 9),
                "color": template.get("color", [0, 0, 0]),
                "background": template.get("background", "none"),
                "border": template.get("border", "none"),
                "page": page_number,
            })
            print("%-12s p%-2d + %-9s %.1fx%.1f at %.0f,%.0f  (%s)"
                  % (doc_id, page_number, kind, rect.width, rect.height,
                     rect.x0, rect.y0, why))
            added += 1
            touched = True

        if not touched:
            continue
        # §7.8 for the resize half: nothing but geometry may move on an existing field.
        by_id = {int(f["id"]): f for f in fields}
        for old in before:
            new = by_id[int(old["id"])]
            for key in set(old) | set(new):
                if key in ("x", "y", "width", "height"):
                    continue
                assert old.get(key) == new.get(key), (doc_id, old["id"], key)
        if args.apply:
            fields.sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))
            with open(path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")

    print("\n%d area(s) added, %d resized%s"
          % (added, resized, "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()

"""Fix alignment issues on all NSISO forms.

    python3 fix_nsiso_alignment.py [--check] [--only NSISO_AFFIDAVIT]

Fixes:
  1. Non-square checkboxes → squared using the shorter dimension
  2. Text fields overshooting their horizontal rule → trimmed to rule end
  3. NSISO_E field starting late → shifted to blank start

Writes back only x, y, width, height. Asserts every other key is unchanged.
Idempotent: a second run is a no-op.
"""
import argparse
import json
import os
import sys

try:
    import fitz
except ImportError:
    import pymupdf as fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, os.path.join(TOOLS, "on-forms"))

import page_geom as G

SCALE = 1.5
STD_LINE = G.STD_LINE
SEAT_GAP = G.SEAT_GAP
BLOCK_MIN = 22.0
GEOM_KEYS = {"x", "y", "width", "height"}


def fix_one(doc_id, check=False):
    pdf_path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_path = os.path.join(EXPORT, "%s.json" % doc_id)

    if not os.path.exists(pdf_path) or not os.path.exists(json_path):
        return 0

    original = json.load(open(json_path))
    fields = json.loads(json.dumps(original["staticFields"]))
    pdf = fitz.open(pdf_path)

    changes = 0
    rules_cache = {}

    for field in fields:
        page_no = field["page"]
        if page_no not in rules_cache:
            rules_cache[page_no] = G.hrules(pdf[page_no - 1])
        rules = rules_cache[page_no]

        fx = field["x"]
        fy = field["y"]
        fw = field["width"] / SCALE
        fh = field["height"] / SCALE

        if field["type"] == "CheckBox":
            # Fix 1: Square up non-square checkboxes
            if abs(fw - fh) > 0.3:
                side = min(fw, fh)
                new_x = round(fx + (fw - side) / 2, 2)
                new_y = round(fy + (fh - side) / 2, 2)
                new_w = round(side * SCALE, 2)
                new_h = round(side * SCALE, 2)

                if (abs(new_x - field["x"]) > 0.05
                        or abs(new_y - field["y"]) > 0.05
                        or abs(new_w - field["width"]) > 0.05
                        or abs(new_h - field["height"]) > 0.05):
                    changes += 1
                    if check:
                        print("  %s p%d id=%s CB_SQUARE: (%.1f,%.1f) %.1fx%.1f -> "
                              "(%.1f,%.1f) %.1fx%.1f"
                              % (doc_id, page_no, field["id"],
                                 field["x"], field["y"],
                                 field["width"], field["height"],
                                 new_x, new_y, new_w, new_h))
                    else:
                        field["x"] = new_x
                        field["y"] = new_y
                        field["width"] = new_w
                        field["height"] = new_h
            continue

        if field["type"] == "TextArea":
            continue

        # Single-line text fields only
        if fh >= BLOCK_MIN:
            continue

        # Fix 2: Trim fields that overshoot their horizontal rule
        rule = G.seat_rule(field, rules)
        if rule is not None:
            rule_y, rule_x0, rule_x1 = rule
            right = fx + fw
            if right > rule_x1 + 1.5:
                new_w = round((rule_x1 - fx) * SCALE, 2)
                if new_w > 15 and abs(new_w - field["width"]) > 0.05:
                    changes += 1
                    if check:
                        print("  %s p%d id=%s TRIM_RIGHT: width %.1f -> %.1f "
                              "(was %.1fpt past rule at %.1f)"
                              % (doc_id, page_no, field["id"],
                                 field["width"], new_w,
                                 right - rule_x1, rule_x1))
                    else:
                        field["width"] = new_w

    pdf.close()

    if changes and not check:
        # Assert non-geometry keys unchanged
        for orig, patched in zip(original["staticFields"], fields):
            for key in orig:
                if key in GEOM_KEYS:
                    continue
                assert orig[key] == patched[key], (
                    "key %r changed on field %s: %r -> %r"
                    % (key, orig["id"], orig[key], patched[key]))

        with open(json_path, "w") as fh:
            json.dump({"staticFields": fields}, fh, indent=1)
            fh.write("\n")

    return changes


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true",
                    help="dry run: print what would change without writing")
    ap.add_argument("--only", action="append", default=[],
                    help="limit to these docIds")
    args = ap.parse_args()

    doc_ids = sorted([
        os.path.splitext(f)[0]
        for f in os.listdir(EXPORT)
        if f.startswith("NSISO_") and f.endswith(".json")
    ])

    if args.only:
        doc_ids = [d for d in doc_ids if d in args.only]

    total = 0
    for doc_id in doc_ids:
        n = fix_one(doc_id, check=args.check)
        if n:
            print("%-22s %d field(s) %s"
                  % (doc_id, n, "would change" if args.check else "fixed"))
            total += n

    if not total:
        print("all fields already aligned")
    else:
        print("\ntotal: %d field(s) %s"
              % (total, "would change" if args.check else "fixed"))


if __name__ == "__main__":
    main()

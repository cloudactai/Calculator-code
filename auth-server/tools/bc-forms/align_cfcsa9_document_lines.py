"""Align Form 9's document-list fields to the printed writing rules.

The six rules under "List each document served" all run from x=96 to x=576,
but extraction left alternating fields inset on the left and beyond the rule on
the right. This pass changes only x/width for those six fields and asserts that
the expected rules still exist before writing the promoted mapping.

Run: python3 align_cfcsa9_document_lines.py [--apply]
"""
import argparse
import copy
import json
import os

import fitz


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EXPORT = os.path.join(ROOT, "form-template-export")
DOC_ID = "BCPC_CFCSA_9"
FIELD_IDS = {
    1750726218019,
    1750726218020,
    1750726218021,
    1750726218022,
    1750726218023,
    1750726218024,
}
LEFT = 96.0
RIGHT = 576.0
SCALE = 1.5
RULE_Y = {393.75, 410.75, 426.75, 442.75, 458.75, 474.75}
TOLERANCE = 0.6


def repair(apply_changes=False):
    mapping_path = os.path.join(EXPORT, f"{DOC_ID}.json")
    pdf_path = os.path.join(EXPORT, f"{DOC_ID}.pdf")
    with open(mapping_path) as handle:
        mapping = json.load(handle)

    fields = {field["id"]: field for field in mapping["staticFields"]}
    missing = FIELD_IDS - set(fields)
    if missing:
        raise SystemExit(f"{DOC_ID}: missing fields {sorted(missing)}")

    document = fitz.open(pdf_path)
    rules = set()
    for drawing in document[0].get_drawings():
        for item in drawing["items"]:
            if item[0] != "l" or abs(item[1].y - item[2].y) >= TOLERANCE:
                continue
            x0, x1 = sorted((item[1].x, item[2].x))
            if (360 < item[1].y < 490
                    and abs(x0 - LEFT) < TOLERANCE
                    and abs(x1 - RIGHT) < TOLERANCE):
                rules.add(round(item[1].y, 2))
    document.close()
    if rules != RULE_Y:
        raise SystemExit(f"{DOC_ID}: expected rules {sorted(RULE_Y)}, found {sorted(rules)}")

    before = copy.deepcopy(mapping)
    changed = 0
    target_width = (RIGHT - LEFT) * SCALE
    for field_id in FIELD_IDS:
        field = fields[field_id]
        if (field["x"], field["width"]) != (LEFT, target_width):
            field["x"] = LEFT
            field["width"] = target_width
            changed += 1

    untouched = copy.deepcopy(mapping)
    old_fields = {field["id"]: field for field in before["staticFields"]}
    for field in untouched["staticFields"]:
        if field["id"] in FIELD_IDS:
            field["x"] = old_fields[field["id"]]["x"]
            field["width"] = old_fields[field["id"]]["width"]
    if untouched != before:
        raise SystemExit(f"{DOC_ID}: pass changed data outside the six x/width pairs")

    print(f"{DOC_ID}: {changed} document-list field(s) aligned to x={LEFT:.0f}..{RIGHT:.0f}")
    if apply_changes and changed:
        with open(mapping_path, "w") as handle:
            json.dump(mapping, handle, indent=1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    repair(args.apply)


if __name__ == "__main__":
    main()

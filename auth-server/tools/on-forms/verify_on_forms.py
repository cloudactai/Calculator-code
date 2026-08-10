"""Post-build checks over the promoted Ontario templates.

Run after `build_on_forms.py --promote` and `merge_on_catalog.py --promote`:

    python3 verify_on_forms.py

Checks, in order:
  1. every catalogued ON row has both a PDF and a mapping on disk;
  2. the template PDFs carry no native widgets (the app draws its own overlay,
     and a leftover AcroForm layer would double up on every field);
  3. field geometry is in-bounds, positive and uniquely identified;
  4. no bind uses vocabulary that was not already in a shipped template — a new
     path would silently resolve to nothing at prefill time;
  5. sortOrder is unique within each province.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
SCALE = 1.5
TYPES = {"TextField", "TextArea", "CheckBox", "Number", "Date", "Table"}


def binds(mapping):
    out = set()
    for field in mapping["staticFields"]:
        for path in str(field.get("bind") or "").split(","):
            if path.strip():
                out.add(path.strip())
    return out


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    new_rows = json.load(open(os.path.join(EXPORT, "_incoming_on", "out", "on_rows.json")))
    new_ids = {row["docId"] for row in new_rows}
    problems = []

    old_vocab = set()
    for item in catalog:
        if item["docId"] in new_ids:
            continue
        path = os.path.join(EXPORT, "%s.json" % item["docId"])
        if os.path.exists(path):
            old_vocab |= binds(json.load(open(path)))

    for item in catalog:
        did = item["docId"]
        pdf = os.path.join(EXPORT, item.get("fileName") or "%s.pdf" % did)
        mapping_path = os.path.join(EXPORT, "%s.json" % did)
        if not os.path.exists(pdf) or not os.path.exists(mapping_path):
            problems.append("%s: missing PDF or mapping" % did)
            continue
        if did not in new_ids:
            continue

        doc = fitz.open(pdf)
        widgets = sum(len(list(page.widgets())) for page in doc)
        sizes = [(page.rect.width, page.rect.height) for page in doc]
        doc.close()
        if widgets:
            problems.append("%s: %d native widgets left on the background" % (did, widgets))

        fields = json.load(open(mapping_path))["staticFields"]
        if not fields:
            problems.append("%s: mapping has no fields" % did)
        seen = set()
        for field in fields:
            if field["id"] in seen:
                problems.append("%s: duplicate field id %s" % (did, field["id"]))
            seen.add(field["id"])
            if field["type"] not in TYPES:
                problems.append("%s: unknown field type %s" % (did, field["type"]))
            if not 1 <= field["page"] <= len(sizes):
                problems.append("%s: field %s on page %s of %d" % (did, field["id"], field["page"], len(sizes)))
                continue
            width, height = sizes[field["page"] - 1]
            if field["width"] <= 0 or field["height"] <= 0:
                problems.append("%s: field %s has non-positive size" % (did, field["id"]))
            if field["x"] < -2 or field["y"] < -2 \
                    or field["x"] + field["width"] / SCALE > width + 2 \
                    or field["y"] + field["height"] / SCALE > height + 2:
                problems.append("%s: field %s is off the page" % (did, field["id"]))

        unknown = binds(json.load(open(mapping_path))) - old_vocab
        if unknown:
            problems.append("%s: bind vocabulary not used by any shipped form: %s" % (did, sorted(unknown)))

    by_province = {}
    for item in catalog:
        by_province.setdefault(item["province"], []).append(item["sortOrder"])
    for province, orders in by_province.items():
        if len(set(orders)) != len(orders):
            problems.append("%s: duplicate sortOrder" % province)

    counts = {p: len(o) for p, o in by_province.items()}
    print("catalog: %s | new this batch: %d" % (counts, len(new_rows)))
    if problems:
        for problem in problems:
            print("  FAIL %s" % problem)
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

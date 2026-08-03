"""Apply the BC field-placement rules to the Ontario templates.

Ontario cannot be rebuilt: its field maps carry prefill binds, calculations and
linked fields that only exist in the committed JSON. So the rules are applied to
the existing maps in place, touching geometry and nothing else.

Run without --promote to see what would change; nothing is written.
"""
import json
import os
import re
import shutil
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
GEOMETRY = ("x", "y", "width", "height")
# Everything that is not geometry must come through untouched.
PRESERVED = ("bind", "calculationName", "calculationType", "calculationValue", "isAgeField",
             "isCalculated", "isCombined", "isDerived", "linkedAgeField", "linkedToField",
             "linkedToId", "readOnly", "source", "sourceFields", "sourceType", "value", "id",
             "type", "page", "fontSize", "color", "background", "border")


PARSE_FLOAT = re.compile(r"^\s*[-+]?(\d+\.?\d*|\.\d+)")


def numeric(fields):
    """Ontario stores some sizes as strings; work in floats.

    A few are malformed — Form 13A has x="97NaN". The editor reads these with
    JavaScript parseFloat, which stops at the first bad character and yields 97,
    so the same leading-number rule is used here and the rendered position is
    unchanged.
    """
    coerced = malformed = 0
    for field in fields:
        for key in GEOMETRY:
            value = field.get(key)
            if not isinstance(value, str):
                continue
            match = PARSE_FLOAT.match(value)
            if not match:
                continue
            field[key] = float(match.group(0))
            coerced += 1
            try:
                float(value)
            except ValueError:
                malformed += 1
    return coerced, malformed


def main():
    promote = "--promote" in sys.argv
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    doc_ids = [c["docId"] for c in catalog if c["province"] == "ON"]

    totals = {"forms": 0, "fields": 0, "moved": 0, "shape": 0, "binds_before": 0,
              "binds_after": 0, "keys_lost": 0, "coerced": 0, "malformed": 0}
    per_form = []
    for doc_id in doc_ids:
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
        original = json.load(open(path))["staticFields"]
        before = {f["id"]: dict(f) for f in original}
        fields = json.loads(json.dumps(original))
        coerced, malformed = numeric(fields)
        totals["coerced"] += coerced
        totals["malformed"] += malformed

        # Record the printed shape so the editor draws a circle where the form
        # prints one, exactly as the BC templates do.
        page_cache = fitz.open(pdf)
        for field in fields:
            if field["type"] != "CheckBox":
                continue
            page = page_cache[field["page"] - 1]
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / bp.SCALE,
                            field["y"] + field["height"] / bp.SCALE)
            mark = bp.printed_mark(page, box)
            shape = "square"
            if mark:
                curves = sum(1 for d in page.get_drawings() if d["rect"].intersects(mark)
                             for item in d["items"] if item[0] == "c")
                straight = sum(1 for d in page.get_drawings() if d["rect"].intersects(mark)
                               for item in d["items"] if item[0] in ("re", "l"))
                if curves > straight and curves:
                    shape = "circle"
            if field.get("shape") != shape:
                totals["shape"] += 1
            field["shape"] = shape
        page_cache.close()

        bp.snap_checkboxes(pdf, fields)
        bp.snap_text_fields(pdf, fields)
        bp.expand_ruled_blocks(fields, pdf)
        bp.clear_printed_labels(pdf, fields)
        bp.size_amounts_to_dollar(pdf, fields)

        def as_float(value):
            if isinstance(value, (int, float)):
                return float(value)
            match = PARSE_FLOAT.match(str(value))
            return float(match.group(0)) if match else 0.0

        moved = 0
        for field in fields:
            old = before[field["id"]]
            # Compare what the editor actually rendered before, not the raw string.
            if any(abs(as_float(field[k]) - as_float(old[k])) > 0.5 for k in GEOMETRY):
                moved += 1
            for key in PRESERVED:
                if key in old and old[key] != field.get(key):
                    totals["keys_lost"] += 1
        totals["forms"] += 1
        totals["fields"] += len(fields)
        totals["moved"] += moved
        totals["binds_before"] += sum(1 for f in original if f.get("bind"))
        totals["binds_after"] += sum(1 for f in fields if f.get("bind"))
        if moved:
            per_form.append((doc_id, moved, len(fields)))
        if promote:
            with open(path, "w") as fh:
                json.dump({"staticFields": fields}, fh, indent=1)

    print("Ontario: %d forms, %d fields" % (totals["forms"], totals["fields"]))
    print("  geometry changed by the rules : %d field(s)" % totals["moved"])
    print("  shape recorded                : %d" % totals["shape"])
    print("  string sizes made numeric     : %d (of which malformed: %d)" % (totals["coerced"], totals["malformed"]))
    print("  prefill binds before/after    : %d / %d" % (totals["binds_before"], totals["binds_after"]))
    print("  non-geometry values altered   : %d" % totals["keys_lost"])
    for row in sorted(per_form, key=lambda r: -r[1])[:12]:
        print("     %-9s %d of %d fields move" % row)
    if promote:
        print("written")


if __name__ == "__main__":
    main()

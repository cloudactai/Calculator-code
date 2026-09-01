"""Add a writing line for Form 70BB's extracurricular-activities caption.

Page 4 (JSON page 4 / doc index 3) reads "...the following extraordinary
expenses for extracurricular activities:" and then leaves the printed page
blank until the next checkbox line ("I am not claiming special or
extraordinary expenses") -- a caption with no answer space of its own. Give
it one.

    python3 add_70bb_activities_field.py --check
    python3 add_70bb_activities_field.py
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
MAPPING_PATH = os.path.join(EXPORT, "PEISC_70BB.json")

FIELD_ID = 1750127377061

# "...extracurricular activities:" prints at y=124.1..135.2; the next line
# ("I am not claiming...") starts at y=158.3 -- both PyMuPDF word boxes, doc
# index 3. x/y raw points; width/height pre-multiplied by PDF_FIELD_SCALE
# (1.5, textFieldGeometry.js), bottom edge (y + height/1.5) at 156.3, just
# above the next line.
NEW_FIELD = {
    "id": FIELD_ID,
    "type": "TextField",
    "x": 141.0,
    "y": 143.0,
    "width": 540.0,
    "height": 19.95,
    "value": "",
    "fontSize": 9,
    "color": [0, 0, 0],
    "background": "none",
    "border": "none",
    "page": 4,
    "rule": "bottom",
    "compact": True,
}


def repair(apply_changes):
    with open(MAPPING_PATH) as handle:
        mapping = json.load(handle)

    if any(field.get("id") == FIELD_ID for field in mapping["staticFields"]):
        print("nothing to change")
        return

    print(("would add: " if not apply_changes else "added: ") + "field %s on page %s" % (
        FIELD_ID, NEW_FIELD["page"]))

    if apply_changes:
        mapping["staticFields"].append(dict(NEW_FIELD))
        with open(MAPPING_PATH, "w") as handle:
            json.dump(mapping, handle, indent=2)
            handle.write("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repair(apply_changes=not args.check)


if __name__ == "__main__":
    main()

"""One-off: add the missing Month/Year fields on NLEPO_003 p2's "what date did
this happen?" line.

    python3 add_nlepo_003_datefields.py [--check]

Finding: the printed line under item 2(b) has three separate underscore
blanks captioned "Day / Month / Year", but the build only produced a
TextField for "Day" (id 1750798505013). Text extraction finds no underscore
characters here at all (`get_text('words')` returns just the caption words),
and `get_drawings()`/`get_cdrawings()` find nothing either -- the lines don't
match any detector this pipeline has, which is presumably why they were
missed rather than a bug in an existing detector. Confirmed with a
pixel-darkness row scan (`get_pixmap` + numpy, same technique the guide
recommends for lossy-extraction NL pages): a single mostly-dark row at
y=250.75pt has three distinct dark segments at x=220.0-272.0 (Day, already
fielded), x=283.5-379.25 (Month, missing) and x=388.0-459.75 (Year, missing).

This is a genuinely missing pair of fields on a genuine printed blank (issue
class 7), not a placement fix, so it adds rather than moves. Geometry mirrors
the existing Day field exactly (same y/height), width/x taken from the
pixel-measured line segments. --check prints without writing; no flag writes.
Idempotent: running again finds the target ids already present and does
nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
JSON_PATH = os.path.join(EXPORT, "NLEPO_003.json")

DAY_FIELD_ID = 1750798505013
NEW_MONTH_ID = 1750798505013001  # derived, not a real bc_pipeline.new_id -- see below
NEW_YEAR_ID = 1750798505013002

# Pixel-measured against the printed line (see docstring). y/height match the
# existing Day field (1750798505013) exactly.
NEW_FIELDS = [
    {
        "id": 1750798505201,
        "type": "TextField",
        "x": 283.5,
        "y": 236.62,
        "width": round((379.25 - 283.5) * 1.5, 2),
        "height": 19.95,
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": 2,
    },
    {
        "id": 1750798505202,
        "type": "TextField",
        "x": 388.0,
        "y": 236.62,
        "width": round((459.75 - 388.0) * 1.5, 2),
        "height": 19.95,
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": 2,
    },
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    with open(JSON_PATH) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    existing_ids = {f["id"] for f in fields}

    to_add = [f for f in NEW_FIELDS if f["id"] not in existing_ids]
    if not to_add:
        print("NLEPO_003: nothing to add (already present)")
        return

    for f in to_add:
        label = "Month" if f["x"] < 400 else "Year"
        print(f"NLEPO_003: {'would add' if args.check else 'adding'} {label} "
              f"field id={f['id']} x={f['x']} y={f['y']} "
              f"w={f['width']/1.5:.1f} h={f['height']/1.5:.1f}")

    if args.check:
        return

    fields.extend(to_add)
    with open(JSON_PATH, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print(f"NLEPO_003: {len(to_add)} field(s) added")


if __name__ == "__main__":
    main()

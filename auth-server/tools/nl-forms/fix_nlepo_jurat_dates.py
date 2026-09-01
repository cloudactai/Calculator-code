"""Fix oversized "Dated this ___ day of ___, 20__." / "SWORN TO ... at ___,
in the Province ..., this ___ day of ___, 20__:" jurat date fields on
NLEPO_002 p1 and NLEPO_003 p4.

    python3 fix_nlepo_jurat_dates.py [--check]

Finding: while doing the full page-by-page pass, found that both forms'
jurat/signing-date fields are wider than their printed blanks, overlapping
adjacent printed captions -- confirmed visually on NLEPO_003 p4 (a render
showed what looked like a stray line struck through "Province", caused by
field 1750798505042 starting only ~2.5pt below the "Province" text row
above it) and by geometry on NLEPO_002 p1 (fields 025/028 overlap each
other by 27pt). Pixel-darkness row scans (get_pixmap + numpy, since these
underscore runs are either literal underscore glyphs mid-word or drawn as
short rules not caught cleanly by word extraction) against the *unmodified*
base PDF give the true blank extents:

NLEPO_002 p1 "Dated this ___ day of ___, 20___." (y=659.76 row):
    day blank:   x=113.8-164.0   (field 1750029983023 was 113.76 w=75.33,
                                   overlapping "day" caption by ~23pt)
    month blank: x=194.2-281.7   (field 1750029983025 was 194.16 w=127.53,
                                   overlapping "20" caption and field 028
                                   by ~27pt)
    year blank:  x=294.2-316.65  (field 1750029983028 was 294.24 w=29.98,
                                   ~7.5pt past the printed period; tightened
                                   for consistency, not because it collided
                                   with anything)

NLEPO_003 p4 "SWORN TO (OR AFFIRMED) before me at ___, in the Province of
Newfoundland and Labrador, this ___ day of ___, 20___:" (3 wrapped lines):
    at blank:      x=69.5-182.0   (field 1750798505041 was 69.5 w=167.07,
                                    overlapping "in the Province" by ~55pt)
    "this" blank:  x=221.8-259.3  (field 1750798505042 was 221.93 w=56.34,
                                    overlapping trailing blank margin by ~19pt;
                                    combined with sitting only 2.5pt below the
                                    "Province" line above, produced the
                                    strikethrough-through-"Province" look)
    "day of" blank (month name): x=89.3-171.8 (field 1750798505043 was
                                    89.42 w=123.88 -- one field spanning BOTH
                                    the month blank AND across the comma,
                                    "20", and ":" captions to x=213.3)
    "20__:" blank (2-digit year): x=188.5-201.8 -- genuinely a SECOND,
                                    separate blank with no field at all
                                    (043 was incorrectly covering it by
                                    being oversized instead of a second
                                    field existing). Added as a new field,
                                    mirroring how NLEPO_002's own day/
                                    month/year row already uses 3 distinct
                                    fields for the same "day / month-name /
                                    2-digit-year" pattern.

Only x/width are changed on existing fields (y/height/type/etc. untouched);
one new TextField is added for the previously-missing 2-digit-year blank on
NLEPO_003 p4, id 1750798505204, y/height copied from its row-mate (043).

--check prints without writing; no flag writes. Idempotent: a second run
finds every field already at target geometry and does nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

# path -> { field id: (x, width) } geometry fixes for existing fields
FIXES = {
    "NLEPO_002.json": {
        1750029983023: (113.76, 50.24),
        1750029983025: (194.16, 87.54),
        1750029983028: (294.24, 22.41),
    },
    "NLEPO_003.json": {
        1750798505041: (69.5, 112.5),
        1750798505042: (221.93, 37.5),
        1750798505043: (89.42, 82.38),
    },
}

# path -> new field(s) to add for genuinely missing blanks
ADDITIONS = {
    "NLEPO_003.json": [
        {
            "id": 1750798505204,
            "type": "TextField",
            "x": 188.5,
            "y": 489.39,
            "width": 13.3,
            "height": 19.95,
            "value": "",
            "fontSize": 9,
            "color": [0, 0, 0],
            "background": "none",
            "border": "none",
            "page": 4,
        },
    ],
}


def process(fname, check):
    path = os.path.join(EXPORT, fname)
    with open(path) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    by_id = {f["id"]: f for f in fields}

    changed = False

    for fid, (x, width) in FIXES.get(fname, {}).items():
        f = by_id.get(fid)
        if f is None:
            print(f"{fname}: WARNING field id={fid} not found, skipping")
            continue
        if abs(f["x"] - x) < 0.01 and abs(f["width"] - width) < 0.01:
            continue
        print(f"{fname}: {'would fix' if check else 'fixing'} id={fid} "
              f"x {f['x']}->{x} width {f['width']}->{width}")
        if not check:
            f["x"] = x
            f["width"] = width
        changed = True

    existing_ids = {f["id"] for f in fields}
    to_add = [nf for nf in ADDITIONS.get(fname, []) if nf["id"] not in existing_ids]
    for nf in to_add:
        print(f"{fname}: {'would add' if check else 'adding'} year field "
              f"id={nf['id']} x={nf['x']} y={nf['y']} w={nf['width']}")
        changed = True

    if check:
        return changed

    if to_add:
        fields.extend(to_add)

    if changed:
        with open(path, "w") as fh:
            json.dump(data, fh, indent=2)
            fh.write("\n")
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    any_changed = False
    for fname in ("NLEPO_002.json", "NLEPO_003.json"):
        if process(fname, args.check):
            any_changed = True

    if not any_changed:
        print("nothing to fix (already at target geometry)")


if __name__ == "__main__":
    main()

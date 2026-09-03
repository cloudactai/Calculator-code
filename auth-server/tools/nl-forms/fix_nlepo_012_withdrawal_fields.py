"""Fix NLEPO_012 p1's two withdrawal-clause fields ("I hereby withdraw my
application to ___, which was filed on ___.").

    python3 fix_nlepo_012_withdrawal_fields.py [--check]

Two separate findings from the full page-by-page pass:

1. Field 1750567230005 ("...application to ___,") was x=201.24 width=459.79,
   right edge 661.03 -- past the page's own right edge (595.0pt wide page).
   The true underscore run (get_text('rawdict') char boxes) runs 201.2-507.8
   before the comma. Fixed width=306.56.

2. Field 1750567230006 ("...filed on ___.", the next line down) was
   y=326.44, which put its top 3.96pt *above* the bottom of the line above
   it (row 1 ends at y=330.4) -- confirmed visually: a render showed a
   stray horizontal line struck through "my application to" on row 1,
   directly above and horizontally coincident with this field (x=133.08-
   308.29 overlaps "my application to" at x=130.7-198.8). Same mechanism as
   the NLEPO_003 p4 jurat finding (a field's box top edge intruding into
   the text row above it), except there the fix was a pure width trim; here
   the two printed lines are only 11.2pt apart (tighter than the field's
   own 19.95pt standard height), so the field cannot avoid the row above it
   without moving down. Fixed y=330.4 (flush with row 1's own bottom, zero
   overlap). Width was also 175.21 (edge 308.29), well past the true blank
   end at 249.9 (before the trailing period); tightened to 116.82 while
   already touching this field.

Only x/y/width change (height/type/etc. untouched).

--check prints without writing; no flag writes. Idempotent: a second run
finds both fields already at target geometry and does nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
JSON_PATH = os.path.join(EXPORT, "NLEPO_012.json")

# id -> (x, y, width)
FIXES = {
    1750567230005: (201.24, 315.87, 306.56),
    1750567230006: (133.08, 330.4, 116.82),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    with open(JSON_PATH) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    by_id = {f["id"]: f for f in fields}

    changed = False
    for fid, (x, y, width) in FIXES.items():
        f = by_id.get(fid)
        if f is None:
            print(f"NLEPO_012: WARNING field id={fid} not found, skipping")
            continue
        if abs(f["x"] - x) < 0.01 and abs(f["y"] - y) < 0.01 and abs(f["width"] - width) < 0.01:
            continue
        print(f"NLEPO_012: {'would fix' if args.check else 'fixing'} id={fid} "
              f"x {f['x']}->{x} y {f['y']}->{y} width {f['width']}->{width}")
        if not args.check:
            f["x"] = x
            f["y"] = y
            f["width"] = width
        changed = True

    if not changed:
        print("NLEPO_012: nothing to fix (already at target geometry)")
        return

    if args.check:
        return

    with open(JSON_PATH, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print("NLEPO_012: 2 field(s) fixed")


if __name__ == "__main__":
    main()

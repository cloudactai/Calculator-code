"""Fix NLEPO_003 p2's Day/Month/Year date-fields (item 2(b)) to use the exact
pixel-measured underline widths instead of an invented 1.5x padding factor.

    python3 fix_nlepo_003_datefields.py [--check]

Background: add_nlepo_003_datefields.py added Month/Year TextFields for a
previously-unfielded pair of blanks, sized at 1.5x the pixel-measured
underline segment (a factor back-derived from the pre-existing Day field's
own width/segment ratio, on the assumption the pixel scan undercounted the
true line width). After applying and rendering, this turned out wrong: the
1.5x Day field (width 78.3, right edge 298.31) visually overlaps the 1.5x
Month field (starts at x=283.5) by ~14.8pt -- confirmed in
NLEPO_003_p02_combined.png, where sample text in the Day box runs directly
into the Month box with no gap. Same risk existed for Month/Year (right edge
523.1 vs Year start 388.0 -- also overlapping).

Fix: use the pixel-scan segment widths verbatim (no padding), matching the
actual printed underline extents:
    Day:   x=220.0-272.0   (width 52.0)
    Month: x=283.5-379.25  (width 95.75)
    Year:  x=388.0-459.75  (width 71.75)
This leaves genuine gaps between fields (11.5pt Day-Month, 8.75pt
Month-Year) matching the printed gaps between the underline segments, and
touches only x/width on all three fields (y/height/type/etc. untouched).
The pre-existing Day field (id 1750798505013) is included because its
over-wide 78.3pt was the root cause of the Day/Month collision -- this is a
geometry-only correction backed by the same pixel-scan evidence documented
in add_nlepo_003_datefields.py, not an independent invention.

--check prints without writing; no flag writes. Idempotent: a second run
finds all three fields already at target geometry and does nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
JSON_PATH = os.path.join(EXPORT, "NLEPO_003.json")

# id -> (x, width), taken verbatim from the pixel-darkness scan segments.
TARGETS = {
    1750798505013: (220.01, 51.99),   # Day (pre-existing; was width 78.3)
    1750798505201: (283.5, 95.75),    # Month (was width 143.62)
    1750798505202: (388.0, 71.75),    # Year (was width 107.62)
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    with open(JSON_PATH) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    by_id = {f["id"]: f for f in fields}

    changed = []
    for fid, (x, width) in TARGETS.items():
        f = by_id.get(fid)
        if f is None:
            print(f"NLEPO_003: WARNING field id={fid} not found, skipping")
            continue
        if abs(f["x"] - x) < 0.01 and abs(f["width"] - width) < 0.01:
            continue
        before = (f["x"], f["width"])
        print(f"NLEPO_003: {'would fix' if args.check else 'fixing'} id={fid} "
              f"x {before[0]}->{x} width {before[1]}->{width}")
        if not args.check:
            f["x"] = x
            f["width"] = width
        changed.append(fid)

    if not changed:
        print("NLEPO_003: nothing to fix (already at target geometry)")
        return

    if args.check:
        return

    with open(JSON_PATH, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print(f"NLEPO_003: {len(changed)} field(s) fixed")


if __name__ == "__main__":
    main()

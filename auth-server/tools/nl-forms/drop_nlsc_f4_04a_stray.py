"""Drop one oversized stray duplicate on NLSC_F4_04A p6.

    python3 drop_nlsc_f4_04a_stray.py [--check]

Finding (session 4, NLSC page-by-page pass). `audit_fields.py` reports exactly
one overlap above 40% in the whole of NLSC:

    NLSC_F4_04A p6 f20/f32 OVERLAP 60%

The two fields are on the children's table, in the Child 4 "Child's Full Name"
cell, which the page draws at x 355.44-539.76, y 374.88-396.00:

    id 1750033802128   x 355.64-539.41   y 381.91-395.21   h 13.30
    id 1750033802140   x 429.42-608.00   y 373.57-402.37   h 28.80

The first fits the printed cell exactly -- inset a fraction of a point from the
side rules, bottom 0.79pt above the bottom rule, which is this batch's cell
convention (measured on NLSC_F5_06A p6: inset ~1.0, lift ~0.78). The second
fits nothing: it is 68pt wider than the table itself, running past the right-
hand rule at 539.76 into the page margin; it is 28.8pt tall against a 17.76pt
row; and it straddles the "Child 3 / Child 4" header row above. Rendered at 6x
it is plainly a stray box laid over the correctly-placed one. Neither carries a
bind, and both are TextFields.

This is the duplicate class `dedupe_nl_fields.py` exists to remove, missed by a
hair: that script drops a same-type pair overlapping **more than 0.6** of the
smaller box, and this pair measures **0.599**. A scan of the whole NL corpus for
same-type pairs in the 0.45-0.60 band returns this one pair and nothing else, so
the gap is specific rather than systemic and is closed here rather than by
lowering a corpus-wide threshold.

Note the keeper is chosen by *fit*, not by size. `dedupe_nl_fields.py` keeps the
largest field in a cluster, on the reasoning that the largest is the one sized
to the full blank; here that rule would keep exactly the wrong one, because the
oversized field is the defect. That is why this is a separate, explicit script
with the cell measured from the page, and not a threshold change.

Removing a whole field entry sits outside the guide's normal
x/y/width/height convention, so the script is narrow by construction: it
verifies, against the shipped PDF, that the survivor still fits the printed cell
and that the field being dropped still overshoots it, and refuses to write if
either is no longer true. Idempotent -- once dropped there is nothing to find.
"""
import argparse
import json
import os

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

SCALE = 1.5
DOC_ID = "NLSC_F4_04A"
PAGE = 6
KEEP_ID = 1750033802128
DROP_ID = 1750033802140
CELL = (355.44, 374.88, 539.76, 396.00)     # re-checked against the page;
#   the top rule is drawn at 374.88 and the side rules start a little below it
#   at 378.24, which is why the vertical test below allows that slack.
FIT_TOL = 2.5        # the survivor must sit within this of the cell's rules
OVERSHOOT = 20.0     # the dropped field must overshoot the cell by at least this


def cell_on_page(page):
    """Confirm the printed cell is still where the docstring says it is."""
    hs = [d["rect"] for d in page.get_drawings()
          if d["rect"].height < 2.0 and d["rect"].width > 25]
    vs = [d["rect"] for d in page.get_drawings()
          if d["rect"].width < 2.0 and d["rect"].height > 6]
    x0, y0, x1, y1 = CELL
    top = any(abs(h.y0 - y0) < 1.5 and h.x0 <= x0 + 3 and h.x1 >= x1 - 3 for h in hs)
    bot = any(abs(h.y0 - y1) < 1.5 and h.x0 <= x0 + 3 and h.x1 >= x1 - 3 for h in hs)
    left = any(abs(v.x0 - x0) < 1.5 and v.y0 <= y0 + 5 and v.y1 >= y1 - 3 for v in vs)
    right = any(abs(v.x0 - x1) < 1.5 and v.y0 <= y0 + 5 and v.y1 >= y1 - 3 for v in vs)
    return top, bot, left, right


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    json_path = os.path.join(EXPORT, DOC_ID + ".json")
    data = json.load(open(json_path))
    fields = data["staticFields"]

    keep = next((f for f in fields if f["id"] == KEEP_ID), None)
    drop = next((f for f in fields if f["id"] == DROP_ID), None)
    if keep is None:
        raise SystemExit("%s: survivor %s is missing -- refusing to touch anything"
                         % (DOC_ID, KEEP_ID))
    if drop is None:
        print("  %s p%d: id=%s already dropped." % (DOC_ID, PAGE, DROP_ID))
        print("\n0 field(s) dropped.")
        return

    doc = fitz.open(os.path.join(EXPORT, DOC_ID + ".pdf"))
    sides = cell_on_page(doc[PAGE - 1])
    doc.close()
    if not all(sides):
        raise SystemExit("%s p%d: printed cell %s no longer has all four rules "
                         "(top,bottom,left,right)=%s -- refusing"
                         % (DOC_ID, PAGE, CELL, sides))

    cx0, cy0, cx1, cy1 = CELL
    k = fitz.Rect(keep["x"], keep["y"],
                  keep["x"] + keep["width"] / SCALE,
                  keep["y"] + keep["height"] / SCALE)
    d = fitz.Rect(drop["x"], drop["y"],
                  drop["x"] + drop["width"] / SCALE,
                  drop["y"] + drop["height"] / SCALE)

    fits = (k.x0 > cx0 - FIT_TOL and k.x1 < cx1 + FIT_TOL
            and k.y0 > cy0 - FIT_TOL and k.y1 < cy1 + FIT_TOL)
    overshoots = (d.x1 - cx1) > OVERSHOOT or (d.y1 - cy1) > OVERSHOOT
    print("  survivor  id=%s %s  fits the printed cell: %s" % (KEEP_ID, list(map(lambda v: round(v, 2), k)), fits))
    print("  dropping  id=%s %s  overshoots it by %.1fpt right, %.1fpt low: %s"
          % (DROP_ID, list(map(lambda v: round(v, 2), d)), d.x1 - cx1, d.y1 - cy1, overshoots))
    if not fits or not overshoots:
        raise SystemExit("%s: the geometry no longer matches the finding -- refusing"
                         % DOC_ID)
    if drop.get("bind") and drop.get("bind") != keep.get("bind"):
        raise SystemExit("%s: %s carries bind %r the survivor lacks -- refusing"
                         % (DOC_ID, DROP_ID, drop["bind"]))

    if not args.check:
        before = len(fields)
        data["staticFields"] = [f for f in fields if f["id"] != DROP_ID]
        assert before - len(data["staticFields"]) == 1
        assert any(f["id"] == KEEP_ID for f in data["staticFields"])
        indent = 2 if open(json_path).read(4).startswith('{\n  "') else 1
        with open(json_path, "w") as fh:
            json.dump(data, fh, indent=indent)
            fh.write("\n")

    print("\n1 field %s." % ("would be dropped" if args.check else "dropped"))


if __name__ == "__main__":
    main()

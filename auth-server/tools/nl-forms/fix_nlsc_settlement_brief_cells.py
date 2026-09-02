"""Re-seat two Settlement Conference Brief fields into their own ruled cell.

    python3 fix_nlsc_settlement_brief_cells.py [--check]

`field_nlsc_settlement_brief.py` placed the "Relationship of the parties" and
"Place of marriage" answers with its FILLS rule -- start just after the label
word, run to a right-hand limit. That rule is right for the inline
"Month:/Day:/Year:" and "$" blanks it was written for, but wrong here: both of
these rows are two-column ruled table rows, and the answer belongs in the
right-hand cell, not immediately after the label. The result was:

  * "Relationship of the parties (eg. married)" -- the field started at 192.43,
    one point after the word "parties", and ran straight over the printed
    parenthetical "(eg. married)" (193.49-235.64), hiding it. This is issue
    class 1 (field covers printed caption); `audit_fields.py` reported it as
    NLSC_SETTLEMENT_CONFERENCE_BRIEF p2 f44 COVERS-TEXT ' (egeg. mamarried)d) '.
  * "Place of marriage" -- the field started at 154.37, inside the label column,
    and crossed the cell's own left rule at 264.41.

The correct geometry is the CELLS convention this same script already uses for
the "Applicant's/Respondent's Full Name" rows on this very page, measured off
the sibling AcroForm NLSC_F5_06A p6: a cell field is inset CELL_INSET (1.0pt)
from both side rules and its bottom sits CELL_LIFT (0.78pt) above the cell's
bottom rule. Cross-checked against the other sibling, NLSC_F4_03A p6, which
prints this identical relationship table as an AcroForm and whose government
widgets sit at:

    Relationship of the parties   x = 265.85, width = 284.40 true pts
    Place of marriage             x = 265.63, width = 182.49 true pts

The cell-derived values below land at x = 265.89 / 265.89 and width 283.55 /
184.77 -- within 0.26pt and 2.3pt of the government's own boxes.

The main fielding script skips any blank an existing field already covers, so
it cannot correct these two itself; its FILLS entries are moved to CELLS in the
same change so a fresh run would place them correctly, and this script re-seats
the two fields that already shipped (commit adbff36).

Only x/y/width/height change. The rows are located by their printed drawn
rules on every run, and a field is only touched while it still starts left of
its cell's left rule -- so a second run is a no-op.

Widths/heights are stored as PDF points x SCALE (1.5); see FORM_FIXING_GUIDE.md.
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

import bc_pipeline as bp  # noqa: E402

DOC_ID = "NLSC_SETTLEMENT_CONFERENCE_BRIEF"
SCALE = bp.SCALE
STD_LINE = 13.3
CELL_INSET = 1.00
CELL_LIFT = 0.78

# (page, label word that names the row, its printed word bottom)
ROWS = [
    (2, "parties", 592.22, "Relationship of the parties"),
    (2, "marriage", 647.66, "Place of marriage"),
]

GEOM = ("x", "y", "width", "height")


def hrules(page):
    return [(round(d["rect"].y0, 2), d["rect"].x0, d["rect"].x1)
            for d in page.get_drawings()
            if d["rect"].height < 2.0 and d["rect"].width > 25]


def value_cell(page, word_bottom):
    """The right-hand cell of the ruled row whose printed text bottom is given."""
    rules = hrules(page)
    tops = sorted({y for y, _, _ in rules if y < word_bottom - 2})
    bots = sorted({y for y, _, _ in rules if y > word_bottom - 2})
    if not tops or not bots:
        raise SystemExit("%s: no row rules around y=%.2f" % (DOC_ID, word_bottom))
    y0, y1 = tops[-1], bots[0]
    # segments on the row's own top rule, right of the label column
    segs = sorted((x0, x1) for y, x0, x1 in rules
                  if abs(y - y0) < 0.5 and x0 > 200)
    if not segs:
        raise SystemExit("%s: no value cell on row y=%.2f" % (DOC_ID, y0))
    return segs[0][0], y0, segs[0][1], y1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    json_path = os.path.join(EXPORT, DOC_ID + ".json")
    data = json.load(open(json_path))
    fields = data["staticFields"]
    frozen = {f["id"]: {k: v for k, v in f.items() if k not in GEOM}
              for f in fields}
    doc = fitz.open(os.path.join(EXPORT, DOC_ID + ".pdf"))

    changed = 0
    for page_no, label, word_bottom, note in ROWS:
        page = doc[page_no - 1]
        cx0, cy0, cx1, cy1 = value_cell(page, word_bottom)

        x = cx0 + CELL_INSET
        y = (cy1 - CELL_LIFT) - STD_LINE
        w = (cx1 - CELL_INSET) - x

        # the field on this row that has not yet been seated in its cell
        hits = [f for f in fields
                if f["page"] == page_no and f["type"] == "TextField"
                and cy0 - 1 < f["y"] + f["height"] / SCALE < cy1 + 1
                and f["x"] < cx0]
        if not hits:
            continue
        if len(hits) > 1:
            raise SystemExit("%s p%d: %d candidates on the %s row"
                             % (DOC_ID, page_no, len(hits), note))
        f = hits[0]
        print("%s p%d id=%d  %s" % (DOC_ID, page_no, f["id"], note))
        print("    was x=%.2f y=%.2f w=%.2f h=%.2f  (right=%.2f)"
              % (f["x"], f["y"], f["width"], f["height"],
                 f["x"] + f["width"] / SCALE))
        print("    now x=%.2f y=%.2f w=%.2f h=%.2f  (cell %.2f-%.2f)"
              % (x, y, round(w * SCALE, 2), round(STD_LINE * SCALE, 2), cx0, cx1))
        f["x"] = round(x, 2)
        f["y"] = round(y, 2)
        f["width"] = round(w * SCALE, 2)
        f["height"] = round(STD_LINE * SCALE, 2)
        changed += 1

    for f in fields:
        assert {k: v for k, v in f.items() if k not in GEOM} == frozen[f["id"]], \
            "non-geometry key changed on id=%d" % f["id"]

    print("%d field(s) re-seated" % changed)
    if changed and not args.check:
        with open(json_path, "w") as fh:
            json.dump(data, fh, indent=2)
            fh.write("\n")
        print("written")
    elif args.check:
        print("(dry run, nothing written)")


if __name__ == "__main__":
    main()

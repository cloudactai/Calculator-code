"""Page-by-page repairs to the shipped Manitoba templates.

Everything here was found by reading all 31 pages of the batch with the overlay
drawn on (guide §7.10 / §9: the measurements in `verify_mb.py` pass clean on
every one of these, because each defect is a thing no existing check was
looking for). The repairs are applied **in place** to the promoted maps, never
by rebuilding: `bind` and every other non-geometry key is asserted byte-identical
on the way through (guide §1, §7.8).

    python3 repair_mb_forms.py [--check]

`--check` reports without writing. A second run is a no-op (guide §7.9).

The five repairs, in the order they were found:

**1. Not one of the batch's 30 printed option marks was tickable.** Manitoba
writes an option as a `[ ]` bracket pair (70D, 70D.1) or a `☐` glyph (70W)
rather than as the drawn square BC and Saskatchewan use, so the builder's
checkbox detector found nothing and all five forms shipped with zero CheckBox
fields. Form 70D.1 p2 is the worst of it: the page says "(Check all applicable
boxes)" over fifteen options and carried one field, the court file number.
`mb_marks.py` measures each mark off the page; this adds a CheckBox on it.

**2. Two stray text areas per page on Form 70D.5 p2 and p4.** The first opens
in the blank margin under "(A) TOTAL ASSETS:" and runs down into the next
table, covering its outer border and part of the "DEBTS / PETITIONER'S DEBTS /
RESPONDENT'S DEBTS / COMMENTS" heading row — guide §9.2, a row of boxes parked
in a table's heading. The second floats in blank paper below the NET row,
anchored to nothing. Neither has a blank to fill; both are deleted.

**3. The totals on Form 70D.5 could not be typed.** "(A) TOTAL ASSETS:",
"(B) TOTAL DEBTS:" and "(A) – (B) = NET:" (and their (C)/(D) twins on p4) are
each ruled into four valuation cells, and all 24 were empty of fields — the
most consequential figures on a family property statement, left unfillable.
This is guide §4's Form 8 lesson in a different dialect: a rule meant to keep
boxes off the government's own headings (`is_shaded`, which reads a grey band)
also refused these, because Manitoba shades its total rows the same grey.

**4. Form 70U p1's Part 1 value box sat on its column heading.** It is the
topmost box in its column and 13.0pt tall against the column's modal 10.4 —
exactly the §9.2 signal — and the extra height reached up over "VALUE (total
from Part)". Its bottom is already seated correctly on Part 1's rule, so the
repair takes the column's height and leaves the seat alone.

**5. Form 70U p1's "of ___," box covered the comma closing its line** (guide
§3: the box must clear printed content). Its right edge is pulled back to
clear the glyph.
"""
import argparse
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mb_marks  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "..", "form-template-export")
FORMS = ["MBKB_70D", "MBKB_70D_1", "MBKB_70D_5", "MBKB_70U", "MBKB_70W"]

# Overlay convention (README "Overlay convention"): x/y are points, width/height
# are points x 1.5.
SCALE = 1.5

# Repair 2: the stray text areas, identified by the page and top edge the build
# gave them. Matching on geometry rather than on id keeps the record honest if
# the form is ever rebuilt, and keeps this script a no-op once they are gone.
STRAY_AREAS = [("MBKB_70D_5", 2, 255.6), ("MBKB_70D_5", 2, 530.1),
               ("MBKB_70D_5", 4, 297.9), ("MBKB_70D_5", 4, 526.1)]

# Repair 3: the total rows, as (page, label). The cells themselves are read off
# the printed grid — only the row's own name is named here.
TOTAL_ROWS = [(2, "(A) TOTAL ASSETS"), (2, "(B) TOTAL DEBTS"), (2, "(A) – (B) = NET"),
              (4, "(C) TOTAL ASSETS"), (4, "(D) TOTAL DEBTS"), (4, "(C) – (D) = NET")]

RULE_MAX_THICK = 1.6  # README "Overlay convention"
GEOMETRY = ("x", "y", "width", "height")


def load(doc_id):
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    with open(path) as handle:
        return path, json.load(handle)


def save(path, data):
    """Write the map back the way the batch writes it (guide §9.12)."""
    with open(path, "w") as handle:
        json.dump(data, handle, indent=1)
        handle.write("\n")


def new_field(template, **geometry):
    """A field copied from its twin, with only the geometry changed (§9.6)."""
    field = dict(template)
    field.pop("bind", None)
    field["value"] = ""
    field.update(geometry)
    return field


def next_id(fields):
    return max(int(f["id"]) for f in fields) + 1


# --------------------------------------------------------------------------
# Repair 1 — a CheckBox on every printed option mark
# --------------------------------------------------------------------------

def add_checkboxes(doc_id, data, pdf):
    fields = data["staticFields"]
    added = []
    for number, page in enumerate(pdf, start=1):
        for kind, _font_box, square in mb_marks.marks(page):
            if any(f["type"] == "CheckBox" and f["page"] == number
                   and abs(f["x"] - square.x0) < 1.0 and abs(f["y"] - square.y0) < 1.0
                   for f in fields):
                continue  # already placed: this run is a no-op
            added.append({
                "id": next_id(fields) + len(added),
                "type": "CheckBox",
                "x": round(square.x0, 2),
                "y": round(square.y0, 2),
                "width": round(square.width * SCALE, 2),
                "height": round(square.height * SCALE, 2),
                "value": "",
                "fontSize": 9,
                "color": [0, 0, 0],
                "background": "none",
                "border": "none",
                "page": number,
                "shape": "square",
            })
    fields.extend(added)
    return ["p%d %s mark at (%.2f, %.2f)" % (f["page"], "checkbox", f["x"], f["y"])
            for f in added]


# --------------------------------------------------------------------------
# Repair 2 — delete the stray text areas
# --------------------------------------------------------------------------

def drop_strays(doc_id, data):
    wanted = [(page, y) for form, page, y in STRAY_AREAS if form == doc_id]
    if not wanted:
        return []
    keep, dropped = [], []
    for field in data["staticFields"]:
        hit = any(field["page"] == page and abs(field["y"] - y) < 0.5
                  and field["type"] == "TextArea" for page, y in wanted)
        (dropped if hit else keep).append(field)
    data["staticFields"] = keep
    return ["p%d stray TextArea at y %.1f" % (f["page"], f["y"]) for f in dropped]


# --------------------------------------------------------------------------
# Repair 3 — a box in every empty cell of Form 70D.5's total rows
# --------------------------------------------------------------------------

def _rules(page):
    """Horizontal and vertical printed rules, as sorted coordinate lists."""
    horizontal, vertical = set(), set()
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.height <= RULE_MAX_THICK and rect.width > 40:
            horizontal.add(round(rect.y0, 1))
        if rect.width <= RULE_MAX_THICK and rect.height > 5:
            vertical.add(round(rect.x0, 1))
    return sorted(horizontal), sorted(vertical)


def _row_band(page, label):
    """The pair of printed rules that close the row carrying `label`."""
    horizontal, _ = _rules(page)
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text.startswith(label):
                continue
            top = max([h for h in horizontal if h < line["bbox"][1] - 0.5], default=None)
            bottom = min([h for h in horizontal if h > line["bbox"][3] - 0.5], default=None)
            if top is not None and bottom is not None:
                return top, bottom
    return None


def _row_cells(page, top, bottom):
    """The cells of the row, from the verticals that actually cross it.

    Manitoba stops the grid at the Comments columns on a total row — those two
    columns are not ruled there — so reading the crossing verticals rather than
    assuming the header's column set is what keeps a box out of them.
    """
    crossing = sorted({round(d["rect"].x0, 1) for d in page.get_drawings()
                       if d["rect"].width <= RULE_MAX_THICK
                       and d["rect"].y0 <= top + 1 and d["rect"].y1 >= bottom - 1})
    return list(zip(crossing, crossing[1:]))


def _cell_is_named(page, left, right, top, bottom):
    """Does the government already print something in this cell? (guide §9.3)

    On every one of these rows the leftmost cell carries the row's own name —
    "(A) TOTAL ASSETS:" — and a box there would sit on the label. The four
    cells to its right are empty but for spaces.
    """
    cell = fitz.Rect(left, top, right, bottom)
    return any(not (rect & cell).is_empty for _, rect in mb_marks._chars(page))


def _column_geometry(fields, page_number, left, right):
    """x/width/insets of the data boxes already living in this column."""
    inside = [f for f in fields if f["page"] == page_number
              and f["type"] == "TextField" and left < f["x"] < right]
    if not inside:
        return None
    xs = sorted(f["x"] for f in inside)
    widths = sorted(f["width"] for f in inside)
    return xs[len(xs) // 2], widths[len(widths) // 2]


def _row_insets(page, fields, page_number):
    """How far the batch's own data boxes sit inside their row's rules."""
    horizontal, _ = _rules(page)
    tops, bottoms = [], []
    for field in fields:
        if field["page"] != page_number or field["type"] != "TextField":
            continue
        box_bottom = field["y"] + field["height"] / SCALE
        above = max([h for h in horizontal if h < field["y"]], default=None)
        below = min([h for h in horizontal if h > box_bottom], default=None)
        if above is None or below is None or below - above > 20:
            continue
        tops.append(field["y"] - above)
        bottoms.append(below - box_bottom)
    if not tops:
        return 1.9, 1.1
    tops.sort()
    bottoms.sort()
    return tops[len(tops) // 2], bottoms[len(bottoms) // 2]


def fill_total_rows(doc_id, data, pdf):
    if doc_id != "MBKB_70D_5":
        return []
    fields = data["staticFields"]
    template = next(f for f in fields if f["type"] == "TextField" and f["page"] == 2)
    added = []
    for page_number, label in TOTAL_ROWS:
        page = pdf[page_number - 1]
        band = _row_band(page, label)
        if band is None:
            raise SystemExit("%s: no printed row found for %r" % (doc_id, label))
        top, bottom = band
        inset_top, inset_bottom = _row_insets(page, fields, page_number)
        for left, right in _row_cells(page, top, bottom):
            if _cell_is_named(page, left, right, top, bottom):
                continue  # the label column, which carries the row's own name
            column = _column_geometry(fields, page_number, left, right)
            if column is None:
                continue
            x, width = column
            y = top + inset_top
            height = (bottom - inset_bottom) - y
            if any(f["page"] == page_number and abs(f["x"] - x) < 0.5
                   and abs(f["y"] - y) < 0.5 for f in fields):
                continue
            added.append(new_field(template, id=next_id(fields) + len(added),
                                   page=page_number, x=round(x, 2), y=round(y, 2),
                                   width=round(width, 2),
                                   height=round(height * SCALE, 2)))
    fields.extend(added)
    return ["p%d total cell at (%.2f, %.2f)" % (f["page"], f["x"], f["y"]) for f in added]


# --------------------------------------------------------------------------
# Repairs 4 and 5 — Form 70U page 1
# --------------------------------------------------------------------------

VALUE_COLUMN_X = 362.16   # Form 70U p1's "VALUE (total from Part)" column
VALUE_COLUMN_TOP = 500.0  # the "of ___," box on the line above sits at x 361.92


def reseat_70u_heading_box(doc_id, data, pdf):
    """Repair 4: take the column's height, keep the box's seat on its rule.

    The column is picked by an exact x and a top edge, not by a tolerance. A
    0.5pt one reaches the `of ___,` box at x 361.92 twenty-five lines up the
    page, which is not in this column at all -- and being the topmost match, it
    was the box this repair resized.
    """
    if doc_id != "MBKB_70U":
        return []
    fields = [f for f in data["staticFields"] if f["page"] == 1]
    column = sorted([f for f in fields
                     if abs(f["x"] - VALUE_COLUMN_X) < 0.05 and f["y"] > VALUE_COLUMN_TOP],
                    key=lambda f: f["y"])
    if len(column) < 3:
        return []
    heights = sorted(f["height"] for f in column[1:])
    modal = heights[len(heights) // 2]
    top = column[0]
    if abs(top["height"] - modal) < 0.05:
        return []
    seat = top["y"] + top["height"] / SCALE
    top["height"] = modal
    top["y"] = round(seat - modal / SCALE, 2)
    return ["p1 Part 1 value box reseated to the column height (%.2f)" % modal]


def clear_70u_comma(doc_id, data, pdf):
    """Repair 5: pull the box's right edge back off the printed comma."""
    if doc_id != "MBKB_70U":
        return []
    page = pdf[0]
    field = next((f for f in data["staticFields"]
                  if f["page"] == 1 and abs(f["x"] - 361.92) < 0.05
                  and f["y"] < VALUE_COLUMN_TOP), None)
    if field is None:
        return []
    box = fitz.Rect(field["x"], field["y"],
                    field["x"] + field["width"] / SCALE,
                    field["y"] + field["height"] / SCALE)
    covered = [rect for char, rect in mb_marks._chars(page)
               if not (rect & box).is_empty and rect.x0 > box.x0]
    if not covered:
        return []
    limit = min(rect.x0 for rect in covered) - 1.5
    field["width"] = round((limit - field["x"]) * SCALE, 2)
    return ["p1 'of ___,' box trimmed to clear the printed comma"]


# --------------------------------------------------------------------------

def repair(doc_id, check):
    path, data = load(doc_id)
    before = {int(f["id"]): {k: v for k, v in f.items() if k not in GEOMETRY}
              for f in data["staticFields"]}
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))

    notes = []
    notes += drop_strays(doc_id, data)
    notes += reseat_70u_heading_box(doc_id, data, pdf)
    notes += clear_70u_comma(doc_id, data, pdf)
    notes += fill_total_rows(doc_id, data, pdf)
    notes += add_checkboxes(doc_id, data, pdf)

    dropped = {f["id"] for f in data["staticFields"]}
    for field in data["staticFields"]:
        key = int(field["id"])
        if key not in before:
            continue  # a field this run added
        after = {k: v for k, v in field.items() if k not in GEOMETRY}
        if after != before[key]:
            raise SystemExit("%s: id %d changed a non-geometry key" % (doc_id, key))
    if len(dropped) != len(data["staticFields"]):
        raise SystemExit("%s: duplicate id" % doc_id)

    pdf.close()
    if notes and not check:
        save(path, data)
    return notes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="report without writing")
    parser.add_argument("forms", nargs="*", default=None)
    args = parser.parse_args()

    total = 0
    for doc_id in (args.forms or FORMS):
        notes = repair(doc_id, args.check)
        total += len(notes)
        print("%-12s %s" % (doc_id, "%d change(s)" % len(notes) if notes else "no change"))
        for note in notes:
            print("               %s" % note)
    print("\n%d change(s)%s" % (total, " (check only, nothing written)" if args.check else ""))


if __name__ == "__main__":
    main()

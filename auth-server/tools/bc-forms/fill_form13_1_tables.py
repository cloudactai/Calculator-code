"""Give Form 13.1's property tables their missing lines and their missing totals.

Three faults, all in Parts 4 to 8, and all the same shape -- the overlay stops
short of what the printed table asks for:

* Several tables carry fewer entry lines than the printed cell has room for.
  The cell is open -- there are no printed rules inside it -- so the capacity is
  measured: from the first line, at the pitch the table's own lines already use,
  down to the rule that closes the cell.
* Every table totals the "on valuation date" column and none of them totals
  "today", so the shaded cell under that column, which prints its own "$", has
  nothing behind it. Each new total mirrors the valuation total beside it: the
  same rows, the same box, moved across by the gap between the two columns.
* Part 8 answered "Category / Details / Value" with one line, and its Details
  column with a single tall area rather than a line per entry. It becomes five
  lines of three boxes like every other table on the form.

The two totals on page 8 that the form shades but still prints a "$" in -- items
24 and 25 -- get a plain box, not a calculation: the form does not say what
arithmetic belongs in that column, and a box the user can fill is honest where a
guessed formula would not be.

Existing fields keep their ids, their binds and their calculations. The only
edits to them are the sourceFields of a table total, which is extended to cover
the lines added below it, and Part 8's Details area, which becomes the first of
its five lines.

Run: python3 fill_form13_1_tables.py [--write]
"""
import collections
import copy
import io
import json
import os
import re
import sys

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend "
          "/Calculator-code/auth-server/form-template-export")
DOC_ID = "Form13_1"
SCALE = 1.5
DPI = 300
CLEAR = 1.5      # how close to the closing rule a line's foot may come

# The total under each table, and the column it sums. The mirror for "today"
# is built from these.
TOTALS = {
    "calc-1730577114807": ("land", "onValuationDate", "today"),
    "calc-1730577154447": ("household", "onValuationDate", "today"),
    "calc-1730577214659": ("bank", "onValuationDate", "today"),
    "calc-1731022369820": ("life", "onValuationDate", "today"),
    "calc-1731022554580": ("interests", "onValuationDate", "today"),
    "calc-1731022740098": ("moneyOwed", "onValuationDate", "today"),
    "calc-1731022812683": ("otherProperty", "onValuationDate", "today"),
    "calc-1731022941029": ("debts", "on_valuation_date", "today"),
}

# Page 8's items 24 and 25: the field that holds the first column, and the
# calculation whose column the second one lines up with.
SHADED = [("calc-1731023134095", "calc-1731023091086"),
          ("calc-1731023180980", "calc-1731023091086")]

PART8 = {"category": 1731024593089, "details": 1731024594089, "value": 1731024595089}
PART8_LINES = 5


def closing_rule(page, x0, x1, top):
    """The y of the first full-width rule below `top` -- where the cell ends."""
    band = fitz.Rect(x0, top, x1, min(top + 140, page.rect.y1))
    pixmap = page.get_pixmap(clip=band, dpi=DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples
    for row in range(height):
        base = row * width
        if sum(1 for column in range(width) if samples[base + column] < 150) > 0.85 * width:
            return band.y0 + row * 72.0 / DPI
    return None


def table_rows(fields):
    """{(page, group): {index: {column: field}}} for every "group-n-column" id."""
    tables = collections.defaultdict(lambda: collections.defaultdict(dict))
    for field in fields:
        if not isinstance(field["id"], str):
            continue
        match = re.match(r"(.+)-(\d+)-(.+)$", field["id"])
        if match:
            tables[(field["page"], match.group(1))][int(match.group(2))][match.group(3)] = field
    return tables


def main():
    write = "--write" in sys.argv
    path = os.path.join(EXPORT, "%s.json" % DOC_ID)
    raw = open(path).read()
    data = json.loads(raw)
    fields = data["staticFields"]
    by_id = {f["id"]: f for f in fields}
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % DOC_ID))
    added = []

    # 1. Fill each table down to the rule that closes it.
    for (page_number, group), rows in sorted(table_rows(fields).items()):
        index = sorted(rows)
        tops = [min(f["y"] for f in rows[i].values()) for i in index]
        if len(tops) < 2:
            continue
        pitch = (tops[-1] - tops[0]) / (len(tops) - 1)
        height = max(f["height"] for f in rows[index[0]].values()) / SCALE
        left = min(f["x"] for f in rows[index[0]].values())
        right = max(f["x"] + f["width"] / SCALE for f in rows[index[0]].values())
        rule = closing_rule(pdf[page_number - 1], left, right, tops[-1] + height + 1)
        if rule is None:
            continue
        # The pitch is an average of lines that were placed by hand, so allow a
        # line whose foot lands a fraction past where the average puts it.
        room = (rule - CLEAR - height - tops[0]) / pitch
        capacity = int(room + 0.15) + 1
        for extra in range(len(index), capacity):
            for column, template in rows[index[-1]].items():
                field = copy.deepcopy(template)
                field["id"] = "%s-%d-%s" % (group, extra, column)
                field["y"] = round(tops[0] + extra * pitch, 2)
                if field["id"] in by_id:
                    continue
                added.append(field)
                by_id[field["id"]] = field
            print("p%d %-14s line %d added at y=%.2f (cell closes at %.2f)"
                  % (page_number, group, extra, tops[0] + extra * pitch, rule))
    fields.extend(added)

    # 2. Each table total covers every line of its table, including new ones.
    rows_now = table_rows(fields)
    for total_id, (group, column, _) in TOTALS.items():
        total = by_id[total_id]
        page_number = total["page"]
        rows = rows_now[(page_number, group)]
        sources = ["%s-%d-%s" % (group, i, column) for i in sorted(rows)
                   if column in rows[i]]
        if sources != total["sourceFields"]:
            print("%-22s now sums %d lines (was %d)"
                  % (total_id, len(sources), len(total["sourceFields"])))
            total["sourceFields"] = sources

    # 3. The "today" column gets the total the form prints a "$" for.
    for total_id, (group, column, other) in TOTALS.items():
        total = by_id[total_id]
        rows = rows_now[(total["page"], group)]
        first = rows[min(rows)]
        if column not in first or other not in first:
            continue
        mirror_id = "calc-%s-today" % group
        if mirror_id in by_id:
            continue
        mirror = copy.deepcopy(total)
        mirror["id"] = mirror_id
        mirror["x"] = round(total["x"] + first[other]["x"] - first[column]["x"], 2)
        mirror["sourceFields"] = ["%s-%d-%s" % (group, i, other) for i in sorted(rows)
                                  if other in rows[i]]
        mirror["calculationName"] = "total%s%sToday" % (group[0].upper(), group[1:])
        fields.append(mirror)
        by_id[mirror_id] = mirror
        print("p%d %-14s today total added at x=%.2f y=%.2f"
              % (mirror["page"], group, mirror["x"], mirror["y"]))

    # 4. Page 8's shaded items 24 and 25 print a "$" and had nothing behind it.
    for first_id, column_id in SHADED:
        first, column = by_id[first_id], by_id[column_id]
        new_id = "%s-second" % first_id
        if new_id in by_id:
            continue
        field = copy.deepcopy(first)
        field["id"] = new_id
        field["x"] = column["x"]
        field["width"] = column["width"]
        for key in ("isCalculated", "calculationType", "sourceFields",
                    "calculationName", "isDerived"):
            field.pop(key, None)
        fields.append(field)
        by_id[new_id] = field
        print("p%d shaded box added beside %s at x=%.2f y=%.2f"
              % (field["page"], first_id, field["x"], field["y"]))

    # 5. Part 8 answers with five lines of three boxes, not one tall area.
    category, details, value = (by_id[PART8[k]] for k in ("category", "details", "value"))
    if details["type"] == "TextArea":
        page_number = category["page"]
        top = min(category["y"], details["y"], value["y"])
        height = category["height"] / SCALE
        rule = closing_rule(pdf[page_number - 1], category["x"],
                            value["x"] + value["width"] / SCALE, top + height + 1)
        pitch = (rule - CLEAR - height - top) / (PART8_LINES - 1)
        details["type"] = category["type"]
        details["height"] = category["height"]
        for column in (category, details, value):
            column["y"] = round(top, 2)
        for line in range(1, PART8_LINES):
            for column in (category, details, value):
                field = copy.deepcopy(column)
                field["id"] = "%s-%d" % (column["id"], line)
                field["y"] = round(top + line * pitch, 2)
                fields.append(field)
        print("p%d Part 8 now has %d lines at pitch %.2f (cell closes at %.2f)"
              % (page_number, PART8_LINES, pitch, rule))
    pdf.close()

    ids = [f["id"] for f in fields]
    assert len(set(ids)) == len(ids), "duplicate id"
    fields.sort(key=lambda f: (f["page"], f["y"], f["x"]))

    if write:
        out = io.StringIO()
        json.dump(data, out, indent=1)
        open(path, "w").write(out.getvalue())
    else:
        print("\n(dry run, pass --write)")


if __name__ == "__main__":
    main()

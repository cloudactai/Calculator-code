"""Put a box on every Ontario writing line that asks to be typed on and has none.

A sweep of the 45 forms for printed lines with no field on them turns up three
kinds of thing: the borders of boxes and tables, which want no field; signature
lines, which are signed by hand after printing and are left empty on every form
here; and lines the form itself asks you to type on, which are the misses.

The third kind is told apart by what the form prints about the line -- the
caption under it, or the words before it. A line captioned "Commissioner for
taking affidavits (Type or print name below if signature is illegible)" wants a
name typed on it, and four forms have one with no field while a fifth, Form 14A,
has one with. The same goes for a date, and for the two lines of Form 8A's
lawyer's certificate.

Everything about the box comes off the line: its span is the line's span, it
rests 1 pt above it, and it is one line of type deep.

Run: python3 add_missing_line_fields.py [--write] [FormXX ...]
"""
import glob
import io
import json
import os
import sys

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend "
          "/Calculator-code/auth-server/form-template-export")
SCALE = 1.5
DPI = 150
STEP = 72.0 / DPI
INK = 170
LINE = 4.0 / 3.0
CLEAR = 1.0
MIN_RUN = 60.0     # shorter than this is a dash, not a writing line

# What the form says about a line it wants typed on. Matched lower-cased, on the
# caption printed under the line, or on the words that run into it from the left.
UNDER = ("commissioner for taking affidavits", "print name", "type or print",
         "date", "name of witness")
BEFORE = ("my name is", "i am the lawyer for")

# The same misses on pages that are scans, where there is no caption to read.
# Each line was found by the same sweep and then looked at: the four jurats want
# the commissioner's name typed on them, as Form 14A's does and has a box for,
# and Form 15C's wants the name and title of whoever signs the consent.
# doc_id -> [(page, y, x0, x1)]
SCANNED = {
    "Form13": [(6, 683.0, 181.0, 378.0)],
    "Form13_1": [(9, 643.7, 180.0, 385.0)],
    "Form15": [(7, 665.8, 203.0, 376.0)],
    "Form15B": [(6, 566.9, 182.0, 371.0)],
    "Form15C": [(4, 533.3, 32.0, 295.0)],
}


def segments(page):
    """(y, x0, x1) for each horizontal run of ink at least MIN_RUN long."""
    pixmap = page.get_pixmap(dpi=DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples
    runs = []
    for y in range(height):
        base = y * width
        start = None
        for x in range(width + 1):
            dark = x < width and samples[base + x] < INK
            if dark and start is None:
                start = x
            elif not dark and start is not None:
                if (x - start) * STEP >= MIN_RUN:
                    runs.append((y * STEP, start * STEP, x * STEP))
                start = None

    merged = []
    for y, x0, x1 in runs:
        joined = next((m for m in merged
                       if abs(m[0] - y) < 2.5 and not (x1 < m[1] - 4 or x0 > m[2] + 4)), None)
        if joined:
            joined[0], joined[1], joined[2] = max(joined[0], y), min(joined[1], x0), max(joined[2], x1)
        else:
            merged.append([y, x0, x1])
    return merged


def asked_for(page, y, x0, x1):
    """True if the form's own words say this line is typed on."""
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip().lower()
            if not text:
                continue
            rect = fitz.Rect(line["bbox"])
            under = y - 3 < rect.y0 < y + 16 and rect.x1 > x0 and rect.x0 < x1
            before = abs((rect.y0 + rect.y1) / 2 - y) < 9 and x0 - 140 < rect.x1 <= x0 + 2
            if under and text.startswith(UNDER):
                return True
            # "and I am the lawyer for (name) ____" runs the words into the line,
            # so the phrase is looked for anywhere in them, not just at the front.
            if before and any(phrase in text for phrase in BEFORE):
                return True
    return False


def ruled_cell(page, y, x0, x1):
    """True if a vertical rule crosses this line -- it is a table, not a blank."""
    # Below the line: a table's dividers hang off its header rule, and the space
    # above a writing line is by definition empty.
    band = fitz.Rect(x0 + 2, y + 1, x1 - 2, y + 13) & page.rect
    if band.is_empty:
        return False
    pixmap = page.get_pixmap(clip=band, dpi=DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples
    for x in range(width):
        if all(samples[y0 * width + x] < INK for y0 in range(height)):
            return True
    return False


def claimed(fields, page_number, y, x0, x1):
    for field in fields:
        if field["page"] != page_number:
            continue
        left, right = field["x"], field["x"] + field["width"] / SCALE
        foot = field["y"] + field["height"] / SCALE
        if min(right, x1) - max(left, x0) > 0.45 * (x1 - x0) and -3 < y - foot < 9:
            return True
    return False


def main():
    write = "--write" in sys.argv
    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    paths = [os.path.join(EXPORT, "%s.json" % w) for w in wanted] or \
        sorted(glob.glob(os.path.join(EXPORT, "Form*.json")))

    total = 0
    for path in paths:
        doc_id = os.path.basename(path)[:-5]
        data = json.loads(open(path).read())
        fields = data["staticFields"]
        pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))

        added = []
        lines = []
        for number in range(1, pdf.page_count + 1):
            page = pdf[number - 1]
            for y, x0, x1 in segments(page):
                if y < 60 or y > page.rect.y1 - 40:
                    continue
                if claimed(fields, number, y, x0, x1):
                    continue
                if not asked_for(page, y, x0, x1) or ruled_cell(page, y, x0, x1):
                    continue
                lines.append((number, y, x0, x1))
        for number, y, x0, x1 in SCANNED.get(doc_id, []):
            if not claimed(fields, number, y, x0, x1):
                lines.append((number, y, x0, x1))
        taken = {f["id"] for f in fields}
        for number, y, x0, x1 in lines:
            height = round(10 * LINE * SCALE, 2)
            index = 0
            while "line-p%d-%d" % (number, index) in taken:
                index += 1
            taken.add("line-p%d-%d" % (number, index))
            added.append({
                "id": "line-p%d-%d" % (number, index),
                "type": "TextField",
                "x": round(x0, 2),
                "y": round(y - CLEAR - height / SCALE, 2),
                "width": round((x1 - x0) * SCALE, 2),
                "height": height,
                "value": "",
                "fontSize": 10,
                "color": [0, 0, 0],
                "background": "none",
                "border": "none",
                "page": number,
            })
            print("   %-9s p%-2d line at y=%.1f x=%.0f-%.0f" % (doc_id, number, y, x0, x1))
        pdf.close()
        total += len(added)

        if write and added:
            existing = {f["id"] for f in fields}
            for field in added:
                assert field["id"] not in existing, field["id"]
            fields.extend(added)
            fields.sort(key=lambda f: (f["page"], f["y"], f["x"]))
            out = io.StringIO()
            json.dump(data, out, indent=1)
            open(path, "w").write(out.getvalue())

    print("\n%d boxes added%s" % (total, "" if write else " (dry run, pass --write)"))


if __name__ == "__main__":
    main()

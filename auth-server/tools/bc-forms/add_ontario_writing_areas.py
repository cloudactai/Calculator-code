"""Give an Ontario page the writing area its blank half is asking for.

Two forms print a heading, or a note, and then leave the rest of the page empty
for the answer -- Form 17C's offer to settle under the NOTE box, and Form 14A's
continuation page, which says in as many words to rule a line through whatever
space is left over.

Both backgrounds are scans, so the band is found as ink (guide §6c): the page is
read line by line, the tallest run of rows with nothing printed on them is the
answer space, and its column is taken from the printed block that closes it --
the note above on 17C, the caption and rule below on 14A.

Re-runnable: a band already covered by a box is left alone.

Run: python3 add_ontario_writing_areas.py [--write]
"""
import io
import json
import os
import sys

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend "
          "/Calculator-code/auth-server/form-template-export")
SCALE = 1.5
DPI = 150
INK = 160
PAD = 4.0

# doc_id -> (page, the printed block whose column the area borrows, as a band)
PLAN = {
    "Form17C": (5, (126.0, 286.0)),   # the NOTE box above the space
    "Form14A": (2, (566.0, 600.0)),   # the caption and rule below it
}


def profile(page):
    """How much ink is on each row of the page, and the row height in points."""
    pixmap = page.get_pixmap(dpi=DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples
    rows = []
    for y in range(height):
        base = y * width
        rows.append(sum(1 for x in range(width) if samples[base + x] < INK))
    return rows, 72.0 / DPI


def tallest_gap(page):
    """The deepest band of rows with nothing printed on them, in points."""
    rows, step = profile(page)
    best, start = None, None
    for y, ink in enumerate(rows + [1]):
        if not ink:
            start = y if start is None else start
            continue
        if start is not None:
            if best is None or y - start > best[1] - best[0]:
                best = (start, y)
            start = None
    return None if best is None else (best[0] * step, best[1] * step)


def column(page, band):
    """The left and right edge of the ink in `band` -- the block's own column."""
    clip = fitz.Rect(0, band[0], page.rect.x1, band[1])
    pixmap = page.get_pixmap(clip=clip, dpi=DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples
    columns = [x for x in range(width)
               if any(samples[y * width + x] < INK for y in range(height))]
    if not columns:
        return None
    step = 72.0 / DPI
    return columns[0] * step, (columns[-1] + 1) * step


def covered(fields, page_number, area):
    for field in fields:
        if field["page"] != page_number:
            continue
        box = fitz.Rect(field["x"], field["y"],
                        field["x"] + field["width"] / SCALE,
                        field["y"] + field["height"] / SCALE)
        if (area & box).get_area() > 0.5 * area.get_area():
            return True
    return False


def main():
    write = "--write" in sys.argv
    for doc_id, (page_number, anchor) in PLAN.items():
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        data = json.loads(open(path).read())
        fields = data["staticFields"]
        pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        page = pdf[page_number - 1]

        gap = tallest_gap(page)
        edges = column(page, anchor)
        if gap is None or edges is None:
            raise SystemExit("%s p%d: nothing to measure" % (doc_id, page_number))
        area = fitz.Rect(edges[0], gap[0] + PAD, edges[1], gap[1] - PAD)
        pdf.close()

        if covered(fields, page_number, area):
            print("%-8s p%d already has a box in that space" % (doc_id, page_number))
            continue

        numeric = [f["id"] for f in fields if isinstance(f["id"], int)]
        fields.append({
            "id": max(numeric) + 1,
            "type": "TextArea",
            "x": round(area.x0, 2),
            "y": round(area.y0, 2),
            "width": round(area.width * SCALE, 2),
            "height": round(area.height * SCALE, 2),
            "value": "",
            "fontSize": 10,
            "color": [0, 0, 0],
            "background": "none",
            "border": "none",
            "page": page_number,
        })
        print("%-8s p%d writing area x=%.2f y=%.2f %.2fx%.2f"
              % (doc_id, page_number, area.x0, area.y0, area.width, area.height))

        if write:
            fields.sort(key=lambda f: (f["page"], f["y"], f["x"]))
            out = io.StringIO()
            json.dump(data, out, indent=1)
            open(path, "w").write(out.getvalue())

    if not write:
        print("\n(dry run, pass --write)")


if __name__ == "__main__":
    main()

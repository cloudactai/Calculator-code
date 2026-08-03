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

# Captions answered in the space beneath them, on pages that carry their text.
# doc_id -> [(page, caption)]
CAPTIONS = {
    "Form32_1": [(3, "is to pay child support for the following children:"),
                 (3, "The special or extraordinary expenses for the children")],
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


def lines(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                out.append((fitz.Rect(line["bbox"]), text))
    return sorted(out, key=lambda item: item[0].y0)


def answer_gap(page, caption):
    """The empty band under a caption: down to whatever prints next.

    The column runs from the caption's own margin out to the widest line in the
    body of the page, which is how far the form itself sets type.
    """
    printed = lines(page)
    anchor = next((rect for rect, text in printed if text.startswith(caption)), None)
    if anchor is None:
        raise SystemExit("caption %r not found" % caption)
    floor = min([rect.y0 for rect, _ in printed if rect.y0 > anchor.y1 + 1] + [page.rect.y1])
    left = min(rect.x0 for rect, _ in printed if abs(rect.y0 - anchor.y0) < 2)
    right = max(rect.x1 for rect, _ in printed)
    return fitz.Rect(left, anchor.y1 + PAD, right, floor - PAD)


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


def wanted(doc_id, pdf):
    """(page, area) for every writing area this form is short of."""
    out = []
    if doc_id in PLAN:
        page_number, anchor = PLAN[doc_id]
        page = pdf[page_number - 1]
        gap = tallest_gap(page)
        edges = column(page, anchor)
        if gap is None or edges is None:
            raise SystemExit("%s p%d: nothing to measure" % (doc_id, page_number))
        out.append((page_number, fitz.Rect(edges[0], gap[0] + PAD, edges[1], gap[1] - PAD)))
    for page_number, caption in CAPTIONS.get(doc_id, []):
        out.append((page_number, answer_gap(pdf[page_number - 1], caption)))
    return out


def main():
    write = "--write" in sys.argv
    for doc_id in sorted(set(PLAN) | set(CAPTIONS)):
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        data = json.loads(open(path).read())
        fields = data["staticFields"]
        pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        areas = wanted(doc_id, pdf)
        pdf.close()

        added = 0
        for page_number, area in areas:
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
            added += 1
            print("%-8s p%d writing area x=%.2f y=%.2f %.2fx%.2f"
                  % (doc_id, page_number, area.x0, area.y0, area.width, area.height))

        if write and added:
            fields.sort(key=lambda f: (f["page"], f["y"], f["x"]))
            out = io.StringIO()
            json.dump(data, out, indent=1)
            open(path, "w").write(out.getvalue())

    if not write:
        print("\n(dry run, pass --write)")


if __name__ == "__main__":
    main()

"""Sit Form 6's address boxes on the lines printed inside their panels.

Form 6 is a card: the From and To blocks are printed as tinted panels with dotted
writing lines across them. The overlay put a box near each line rather than on
it -- a couple of points high, and narrower than the panel -- so the page shows
the printed line and a box that misses it, which reads as two boxes stacked.

The panels are found by their tint and the lines by the dark rows inside them,
both measured off the page, and each box is then set to the width of its panel
and to the line it belongs on. Nothing else on the form is touched.

seat_on_rules leaves these alone: it wants a rule that runs solid under most of
the box, and these are dotted.

Run: python3 seat_form6_panels.py [--write]
"""
import io
import json
import os
import sys

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend "
          "/Calculator-code/auth-server/form-template-export")
DOC_ID = "Form6"
SCALE = 1.5
DPI = 300
CLEAR = 1.0


def panels(page):
    """The tinted writing panels on the page."""
    pixmap = page.get_pixmap(dpi=DPI)
    width, height, n, samples = pixmap.width, pixmap.height, pixmap.n, pixmap.samples
    tint = bytearray(1 if (samples[i * n] > 240 and 210 < samples[i * n + 1] < 248
                           and 175 < samples[i * n + 2] < 230) else 0
                     for i in range(width * height))
    step = 72.0 / DPI

    found = []
    for start in range(width * height):
        if not tint[start]:
            continue
        stack, size = [start], 0
        x0 = x1 = start % width
        y0 = y1 = start // width
        tint[start] = 0
        while stack:
            pixel = stack.pop()
            px, py = pixel % width, pixel // width
            size += 1
            x0, x1, y0, y1 = min(x0, px), max(x1, px), min(y0, py), max(y1, py)
            for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                if 0 <= nx < width and 0 <= ny < height and tint[ny * width + nx]:
                    tint[ny * width + nx] = 0
                    stack.append(ny * width + nx)
        if size > 2000:
            found.append(fitz.Rect(x0 * step, y0 * step, (x1 + 1) * step, (y1 + 1) * step))

    # The dotted lines cut a panel into pieces; a panel is the pieces stacked.
    found.sort(key=lambda r: (round(r.x0), r.y0))
    merged = []
    for rect in found:
        if merged and abs(merged[-1].x0 - rect.x0) < 2 and rect.y0 - merged[-1].y1 < 6:
            merged[-1] |= rect
        else:
            merged.append(fitz.Rect(rect))
    return merged


def writing_lines(page, panel):
    """The y of each dotted line in a panel, plus the line its foot makes."""
    pixmap = page.get_pixmap(clip=panel, dpi=DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples
    step = 72.0 / DPI

    rows = []
    for y in range(height):
        base = y * width
        dark = sum(1 for x in range(width) if samples[base + x] < 200)
        # Dotted: never solid, but far darker than the tint around it.
        if dark > 0.3 * width:
            rows.append(y)
    lines = []
    for y in rows:
        if lines and y - lines[-1][-1] <= 2:
            lines[-1].append(y)
        else:
            lines.append([y])
    return [panel.y0 + line[-1] * step for line in lines]


def main():
    write = "--write" in sys.argv
    path = os.path.join(EXPORT, "%s.json" % DOC_ID)
    data = json.loads(open(path).read())
    fields = data["staticFields"]
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % DOC_ID))
    moved = 0

    for number in range(1, pdf.page_count + 1):
        page = pdf[number - 1]
        for panel in panels(page):
            inside = [f for f in fields
                      if f["page"] == number and f["type"] != "CheckBox"
                      and panel.x0 - 4 < f["x"] < panel.x1
                      and panel.y0 - 6 < f["y"] < panel.y1]
            lines = writing_lines(page, panel)
            if not inside or len(lines) != len(inside):
                print("panel %s: %d boxes, %d printed lines -- left alone"
                      % ([round(v, 1) for v in panel], len(inside), len(lines)))
                continue
            inside.sort(key=lambda f: f["y"])
            for field, line in zip(inside, lines):
                height = field["height"] / SCALE
                before = (field["x"], field["y"], field["width"])
                field["x"] = round(panel.x0, 2)
                field["width"] = round(panel.width * SCALE, 2)
                field["y"] = round(line - CLEAR - height, 2)
                if (field["x"], field["y"], field["width"]) != before:
                    moved += 1
                    print("   p%d %s -> x=%.2f y=%.2f w=%.2f (line at %.2f)"
                          % (number, field["id"], field["x"], field["y"],
                             field["width"], line))
    pdf.close()

    print("\n%d boxes seated%s" % (moved, "" if write else " (dry run, pass --write)"))
    if write and moved:
        out = io.StringIO()
        json.dump(data, out, indent=1)
        open(path, "w").write(out.getvalue())


if __name__ == "__main__":
    main()

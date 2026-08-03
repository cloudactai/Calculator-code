"""Sit each Ontario checkbox on the square that is printed under it.

Guide §2 has the app draw its tick at the field's own rect, so a control that is
wider than the printed outline hangs off it. On BC that is settled by reading the
box glyph or the vector art; two thirds of the Ontario backgrounds are scans with
neither, so §6c applies instead and the outline is measured as ink.

For each control a window a little larger than the control is rendered at 400 dpi
and the dark pixels in it are grouped. An outline is taken as the group that is
roughly square, is close to the size a checkbox is on these forms, is hollow (a
letter or a filled rule is not), and sits nearest the control's own centre. The
field is then set to that group's bounds.

Nothing is guessed: a control whose window holds no such group keeps exactly the
geometry it has, and a group that would move the control more than a few points
is refused as well — at that distance it is likelier to be a neighbouring box
than this control's own.

Run: python3 fit_ontario_checkboxes.py [--write] [FormXX ...]
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
DPI = 400
PAD = 7.0          # how far outside the control to look, in points
MIN_SIDE = 4.0     # the smallest printed checkbox on these forms (Form6's)
MAX_SIDE = 20.0
MAX_FULLNESS = 0.3
MAX_SHIFT = 5.0    # how far a control may be moved onto its outline
INK = 160          # 0-255; the scans are clean black on white


def groups(page, window):
    """(bounds, how full it is) for each connected dark blob in `window`.

    Bounds are in page points. Fullness is the share of the blob's own middle
    that is ink — near zero for an outline, high for a letter or a filled rule.
    """
    pixmap = page.get_pixmap(clip=window, dpi=DPI, colorspace=fitz.csGRAY)
    width, height = pixmap.width, pixmap.height
    samples = pixmap.samples
    dark = bytearray(1 if samples[i] < INK else 0 for i in range(width * height))
    scale = 72.0 / DPI

    found = []
    for start in range(width * height):
        if not dark[start]:
            continue
        stack, pixels = [start], []
        x0 = x1 = start % width
        y0 = y1 = start // width
        dark[start] = 0
        while stack:
            pixel = stack.pop()
            px, py = pixel % width, pixel // width
            pixels.append((px, py))
            x0, x1, y0, y1 = min(x0, px), max(x1, px), min(y0, py), max(y1, py)
            for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                if 0 <= nx < width and 0 <= ny < height and dark[ny * width + nx]:
                    dark[ny * width + nx] = 0
                    stack.append(ny * width + nx)

        inset_x, inset_y = (x1 - x0) * 0.3, (y1 - y0) * 0.3
        inner = [1 for px, py in pixels
                 if x0 + inset_x < px < x1 - inset_x and y0 + inset_y < py < y1 - inset_y]
        area = max(1.0, (x1 - x0 - 2 * inset_x) * (y1 - y0 - 2 * inset_y))
        found.append((fitz.Rect(window.x0 + x0 * scale, window.y0 + y0 * scale,
                                window.x0 + (x1 + 1) * scale,
                                window.y0 + (y1 + 1) * scale),
                      len(inner) / area))
    return found


def outline(page, box):
    """The printed square this control belongs on, or None if it cannot be read."""
    window = fitz.Rect(box.x0 - PAD, box.y0 - PAD, box.x1 + PAD, box.y1 + PAD)
    window = window & page.rect
    if window.is_empty:
        return None

    centre = ((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2)
    candidates = []
    for blob, fullness in groups(page, window):
        side = max(blob.width, blob.height)
        if not MIN_SIDE <= side <= MAX_SIDE:
            continue
        if not 0.85 <= blob.width / max(blob.height, 0.01) <= 1.18:
            continue
        # An outline is empty in the middle. A letter that happens to be square,
        # or a rule that happens to be short, is not.
        if fullness > MAX_FULLNESS:
            continue
        # A blob that touches the window edge is something running out of it.
        if blob.x0 <= window.x0 + 0.2 or blob.x1 >= window.x1 - 0.2 \
                or blob.y0 <= window.y0 + 0.2 or blob.y1 >= window.y1 - 0.2:
            continue
        drift = max(abs((blob.x0 + blob.x1) / 2 - centre[0]),
                    abs((blob.y0 + blob.y1) / 2 - centre[1]))
        if drift > MAX_SHIFT:
            continue
        candidates.append((drift, blob))
    if not candidates:
        return None
    return min(candidates, key=lambda item: item[0])[1]


def main():
    write = "--write" in sys.argv
    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    paths = [os.path.join(EXPORT, "%s.json" % w) for w in wanted] or \
        sorted(glob.glob(os.path.join(EXPORT, "Form*.json")))

    fitted = skipped = 0
    for path in paths:
        doc_id = os.path.basename(path)[:-5]
        raw = open(path).read()
        data = json.loads(raw)
        fields = data["staticFields"]
        boxes = [f for f in fields if f["type"] == "CheckBox"]
        if not boxes:
            continue

        pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        changed = here_skipped = 0
        for field in boxes:
            page = pdf[field["page"] - 1]
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            mark = outline(page, box)
            if mark is None:
                here_skipped += 1
                continue
            new = (round(mark.x0, 2), round(mark.y0, 2),
                   round(mark.width * SCALE, 2), round(mark.height * SCALE, 2))
            if new == (field["x"], field["y"], field["width"], field["height"]):
                continue
            field["x"], field["y"], field["width"], field["height"] = new
            changed += 1
        pdf.close()
        fitted += changed
        skipped += here_skipped
        print("%-10s %3d checkboxes: %3d fitted, %3d left alone"
              % (doc_id, len(boxes), changed, here_skipped))

        if write and changed:
            # Geometry only: nothing else in the file may differ.
            check = json.loads(raw)
            for before, after in zip(check["staticFields"], fields):
                assert {k: v for k, v in before.items()
                        if k not in ("x", "y", "width", "height")} == \
                    {k: v for k, v in after.items()
                     if k not in ("x", "y", "width", "height")}, before["id"]
            out = io.StringIO()
            json.dump(data, out, indent=1)
            open(path, "w").write(out.getvalue())

    print("\n%d checkboxes fitted, %d left as they were%s"
          % (fitted, skipped, "" if write else " (dry run, pass --write)"))


if __name__ == "__main__":
    main()

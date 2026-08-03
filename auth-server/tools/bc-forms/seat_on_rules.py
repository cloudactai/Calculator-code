"""Sit each Ontario text box on the line that is printed under it.

Where the form answers a caption with a plain underline -- "Age: ______" -- the
box belongs on that line, so what is typed reads as written on it. The overlays
mostly float a point or two above, and on some forms rather more, which is what
gives a filled page its stepped look.

The rule is found as ink, since two thirds of these backgrounds are scans: a
horizontal run of dark pixels, at least as wide as the box, in a narrow band
around the box's own foot. The box is then set to rest 1 pt above it.

A box is left exactly as it is unless the rule is already close to its foot --
within 6 pt either way. That is the difference between an underline, which the
box is meant to sit on, and the bottom border of a table cell, which is a good
deal further down and which the box should not be dragged onto. Nothing moves
sideways, and nothing is resized.

Run: python3 seat_on_rules.py [--write] [FormXX ...]
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
DPI = 300
NEAR = 6.0        # how far from the foot a rule may be and still be its own
CLEAR = 1.0       # where the box comes to rest above the rule
COVERAGE = 0.8    # how much of the box's width the rule must run under
LINE = 4.0 / 3.0  # a line of type, as a multiple of the point size
PANEL = 1.7       # over this many lines deep, a box is a panel, not a line
INK = 150


def rule_under(page, box):
    """The y of the printed line this box belongs on, or None.

    Read as ink rather than as vector art or text: most of these backgrounds are
    scans, where the line is neither.
    """
    # Snapped to the render's own pixel grid, so that moving a box and looking
    # again reads the rule at the same y rather than a pixel off it.
    step = 72.0 / DPI
    top = int((box.y1 - NEAR) / step) * step
    band = fitz.Rect(box.x0, top, box.x1, top + 2 * NEAR) & page.rect
    if band.is_empty or band.width < 8:
        return None
    pixmap = page.get_pixmap(clip=band, dpi=DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples

    runs = []
    for row in range(height):
        base = row * width
        dark = sum(1 for column in range(width) if samples[base + column] < INK)
        if dark >= COVERAGE * width:
            y = band.y0 + row * 72.0 / DPI
            if runs and y - runs[-1][-1] < 1.0:
                runs[-1].append(y)
            else:
                runs.append([y])
    if not runs:
        return None
    # The line the box sits on is the one nearest its foot; take its top edge,
    # so a rule drawn 2 pt thick does not push the box up by its thickness.
    return min((abs(run[0] - box.y1), run[0]) for run in runs)[1]


def main():
    write = "--write" in sys.argv
    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    paths = [os.path.join(EXPORT, "%s.json" % w) for w in wanted] or \
        sorted(glob.glob(os.path.join(EXPORT, "Form*.json")))

    seated = 0
    for path in paths:
        doc_id = os.path.basename(path)[:-5]
        raw = open(path).read()
        data = json.loads(raw)
        fields = data["staticFields"]
        pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))

        moved = []
        for field in fields:
            if field["type"] == "CheckBox":
                continue
            page = pdf[field["page"] - 1]
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            rule = rule_under(page, box)
            if rule is None:
                continue
            # A box on an underline holds one line. Some came out several lines
            # deep -- Form 20B's signature blocks are 86 pt of empty page above
            # their rule -- which reads as a panel where the form draws a line.
            # A genuinely multi-line answer is a TextArea and is left alone.
            height = round(field["fontSize"] * LINE * SCALE, 2)
            if field["type"] == "TextField" and field["height"] > PANEL * height:
                print("   %-10s p%-2d %s %.0f pt tall on an underline -> one line"
                      % (doc_id, field["page"], field["id"],
                         field["height"] / SCALE))
                field["height"] = height
                box.y0 = box.y1 - height / SCALE
            y = round(rule - CLEAR - box.height, 2)
            if y == field["y"]:
                continue
            moved.append((field["page"], field["id"], field["y"], y))
            field["y"] = y
        pdf.close()
        seated += len(moved)
        if moved:
            print("%-10s %3d of %3d boxes seated (largest move %.2f pt)"
                  % (doc_id, len(moved), len(fields),
                     max(abs(m[3] - m[2]) for m in moved)))

        if write and moved:
            check = json.loads(raw)
            for before, after in zip(check["staticFields"], fields):
                assert {k: v for k, v in before.items() if k not in ("y", "height")} == \
                    {k: v for k, v in after.items() if k not in ("y", "height")}, before["id"]
            out = io.StringIO()
            json.dump(data, out, indent=1)
            open(path, "w").write(out.getvalue())

    print("\n%d boxes seated%s" % (seated, "" if write else " (dry run, pass --write)"))


if __name__ == "__main__":
    main()

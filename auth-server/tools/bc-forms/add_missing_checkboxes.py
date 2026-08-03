"""Give an Ontario page a control for every checkbox it prints.

Some overlays carry the page's text boxes and none of its ticks -- Form 32.1 is
the clearest case, where all three pages print their squares and not one has a
control behind it.

The squares are found the way fit_ontario_checkboxes measures the ones it already
has (guide §6c): the page is rendered, the dark pixels are grouped, and a group
is a checkbox if it is close to square, the size a checkbox is on these forms,
and hollow in the middle. That last test is what keeps the bowl of an "o" or a
"d" out -- those come back at about 7 pt on this form, well under a real box, but
the test costs nothing and the pages differ.

A square that already has a control over it is left alone, so this only ever adds
what is missing and can be re-run.

Run: python3 add_missing_checkboxes.py [--write] [FormXX ...]
"""
import glob
import io
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fit_ontario_checkboxes as fit  # noqa: E402

EXPORT = fit.EXPORT
SCALE = fit.SCALE
MIN_SIDE = 9.5     # under this is type, not a box
MAX_SIDE = 18.0


def is_outline(page, box):
    """True if all four sides of `box` are drawn and its middle is empty.

    A checkbox is a rectangle. Hollowness alone is not enough to say so -- the
    wheel of the accessibility symbol in Form 32.1's footer is hollow, square and
    exactly checkbox-sized -- but a ring fails on its corners where a box does
    not.
    """
    pixmap = page.get_pixmap(clip=box, dpi=fit.DPI, colorspace=fitz.csGRAY)
    width, height, samples = pixmap.width, pixmap.height, pixmap.samples
    if width < 4 or height < 4:
        return False

    def dark(x, y):
        return samples[y * width + x] < fit.INK

    sides = [
        sum(1 for x in range(width) if any(dark(x, y) for y in range(2))) / width,
        sum(1 for x in range(width) if any(dark(x, y) for y in range(height - 2, height))) / width,
        sum(1 for y in range(height) if any(dark(x, y) for x in range(2))) / height,
        sum(1 for y in range(height) if any(dark(x, y) for x in range(width - 2, width))) / height,
    ]
    return min(sides) > 0.85


def printed_boxes(page):
    """Every printed checkbox on the page, as a rect."""
    found = []
    for blob, fullness in fit.groups(page, page.rect):
        side = max(blob.width, blob.height)
        if not MIN_SIDE <= side <= MAX_SIDE:
            continue
        if not 0.85 <= blob.width / max(blob.height, 0.01) <= 1.18:
            continue
        if fullness > fit.MAX_FULLNESS:
            continue
        if not is_outline(page, blob):
            continue
        found.append(blob)
    return sorted(found, key=lambda r: (round(r.y0), r.x0))


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
        for number in range(1, pdf.page_count + 1):
            page = pdf[number - 1]
            here = [f for f in fields if f["page"] == number]
            for box in printed_boxes(page):
                covered = False
                for field in here:
                    rect = fitz.Rect(field["x"], field["y"],
                                     field["x"] + field["width"] / SCALE,
                                     field["y"] + field["height"] / SCALE)
                    if (rect & box).get_area() > 0.3 * box.get_area():
                        covered = True
                        break
                if covered:
                    continue
                added.append({
                    "id": "cb-p%d-%d" % (number, len(added)),
                    "type": "CheckBox",
                    "x": round(box.x0, 2),
                    "y": round(box.y0, 2),
                    "width": round(box.width * SCALE, 2),
                    "height": round(box.height * SCALE, 2),
                    "value": "",
                    "fontSize": 10,
                    "color": [0, 0, 0],
                    "page": number,
                    "shape": "square",
                })
        pdf.close()

        if added:
            counts = {}
            for field in added:
                counts[field["page"]] = counts.get(field["page"], 0) + 1
            print("%-10s %d checkboxes added (%s)"
                  % (doc_id, len(added),
                     ", ".join("p%d: %d" % item for item in sorted(counts.items()))))
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

    print("\n%d checkboxes added%s" % (total, "" if write else " (dry run, pass --write)"))


if __name__ == "__main__":
    main()

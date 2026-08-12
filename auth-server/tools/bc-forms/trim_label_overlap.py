"""Pull batch-2 field boxes clear of the printed captions they cover.

Two faults, both found by `verify_bc2.py` and both confirmed on renders:

  * **A box reaching up into its caption** (`edge-cuts-caption`). BC sets a caption on
    its own line directly above the writing space, and the government's widget /
    XFA rect often starts inside that caption. BCSC_SUP916 and its Provincial twin
    BCPC_PFA916 do it on nearly every field: "Alias(es)", "Current or last known
    address", "Employer" and the rest all have the box's top edge through them.
  * **A box running onto the label at the end of its row** (`box-on-text`). BCPC_23's
    "Name:" row is captioned "(WITNESS)" at the far right and BCPC_33/34's is
    "(DEBTOR)"; the widget spans the whole shaded band, label included.

The fix in both cases is §3's: the writing area belongs *beside or under* the printed
label, never on it. So the offending edge is moved to the far side of the label's ink
and nothing else about the field changes.

Rules this obeys:
  * **Ink, not font boxes.** Trim to where the letters actually are (§2's rule 3), or
    every box loses 2-3 pt of usable height to ascender space it never covered.
  * **Shrink only.** A box is never grown or moved; only the intruding edge comes in.
  * **Refuse to make a box unusable.** Below `MIN_HEIGHT`/`MIN_WIDTH` the trim is
    reported instead of applied — a box that small is a different defect and wants a
    human, not a nudge.
  * **Geometry only.** Every other key is asserted byte-identical afterwards (§1's
    last bullet, §7.8), and a second run is a no-op (§7.9).

Run: python3 trim_label_overlap.py [--apply] [--only DOCID[,DOCID...]]
Without --apply it reports what it would do and changes nothing.
"""
import argparse
import copy
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch2 as src2  # noqa: E402
import verify_bc2 as V  # noqa: E402

OUT = V.OUT
GAP = 1.2           # clearance left between the box edge and the label's ink
MIN_HEIGHT = 10.0   # below this a text box cannot hold a line of type
MIN_WIDTH = 24.0
DARK = 170


def ink_rows(page, rect, dark=DARK):
    """(top, bottom) of the printed ink inside `rect`, in page points, or None."""
    if rect.is_empty or rect.width <= 0 or rect.height <= 0:
        return None
    zoom = 6.0
    pixels = page.get_pixmap(clip=rect, colorspace=fitz.csGRAY,
                             matrix=fitz.Matrix(zoom, zoom))
    if not pixels.width or not pixels.height:
        return None
    rows = [y for y in range(pixels.height)
            if any(pixels.samples[y * pixels.stride + x] < dark for x in range(pixels.width))]
    if not rows:
        return None
    return rect.y0 + rows[0] / zoom, rect.y0 + (rows[-1] + 1) / zoom


def ink_columns(page, rect, dark=DARK):
    """(left, right) of the printed ink inside `rect`, in page points, or None."""
    if rect.is_empty or rect.width <= 0 or rect.height <= 0:
        return None
    zoom = 6.0
    pixels = page.get_pixmap(clip=rect, colorspace=fitz.csGRAY,
                             matrix=fitz.Matrix(zoom, zoom))
    if not pixels.width or not pixels.height:
        return None
    cols = [x for x in range(pixels.width)
            if any(pixels.samples[y * pixels.stride + x] < dark for y in range(pixels.height))]
    if not cols:
        return None
    return rect.x0 + cols[0] / zoom, rect.x0 + (cols[-1] + 1) / zoom


def vertical_trim(page, field, rect):
    """New (y0, y1) pulling the box clear of any caption its edges run through."""
    y0, y1 = rect.y0, rect.y1
    for line_rect, text in V.printed_lines(page):
        shared = min(rect.x1, line_rect.x1) - max(rect.x0, line_rect.x0)
        if shared < 0.5 * min(rect.width, line_rect.width):
            continue
        for name, edge in (("top", rect.y0), ("bottom", rect.y1)):
            if not line_rect.y0 + 1.0 < edge < line_rect.y1 - 1.0:
                continue
            strip = (rect & line_rect) & page.rect
            ink = ink_rows(page, strip)
            if ink is None:
                continue
            if name == "top":
                y0 = max(y0, ink[1] + GAP)
            else:
                y1 = min(y1, ink[0] - GAP)
    return y0, y1


def horizontal_trim(page, field, rect):
    """New (x0, x1) pulling the box clear of a printed label inside it.

    Only the label's own side is trimmed: a label in the box's left third pushes the
    left edge right, one in the right third pulls the right edge left. A word in the
    middle is not a caption the box can be trimmed off, so it is left for the report.
    """
    x0, x1 = rect.x0, rect.x1
    for line_rect, text in V.printed_lines(page):
        shared = (rect & line_rect) & page.rect
        if shared.is_empty or shared.width <= 0:
            continue
        # Only a label the box genuinely sits on, i.e. covering most of its height.
        if shared.height < 0.55 * min(rect.height, line_rect.height):
            continue
        ink = ink_columns(page, shared)
        if ink is None:
            continue
        centre = (ink[0] + ink[1]) / 2
        third = rect.x0 + rect.width / 3
        two_thirds = rect.x0 + 2 * rect.width / 3
        if centre >= two_thirds:
            x1 = min(x1, ink[0] - GAP)
        elif centre <= third:
            x0 = max(x0, ink[1] + GAP)
    return x0, x1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--only")
    args = parser.parse_args()

    doc_ids = [s["docId"] for s in src2.all_sources()]
    if args.only:
        want = set(args.only.split(","))
        doc_ids = [d for d in doc_ids if d in want]

    changed = refused = 0
    per_form = {}
    for doc_id in doc_ids:
        path = os.path.join(OUT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        before = copy.deepcopy(mapping["staticFields"])
        pdf = fitz.open(os.path.join(OUT, "%s.pdf" % doc_id))
        touched = 0

        for field in mapping["staticFields"]:
            if field["type"] == "CheckBox":
                continue
            page = pdf[field["page"] - 1]
            rect = V.box(field)
            y0, y1 = vertical_trim(page, field, rect)
            x0, x1 = horizontal_trim(page, field, fitz.Rect(rect.x0, y0, rect.x1, y1))
            if (round(y0, 2), round(y1, 2), round(x0, 2), round(x1, 2)) == (
                    round(rect.y0, 2), round(rect.y1, 2), round(rect.x0, 2), round(rect.x1, 2)):
                continue
            if y1 - y0 < MIN_HEIGHT or x1 - x0 < MIN_WIDTH:
                print("REFUSED %-14s p%-3d %s -> %.1fx%.1f is too small to fill"
                      % (doc_id, field["page"], field["id"], x1 - x0, y1 - y0))
                refused += 1
                continue
            field["x"] = round(x0, 2)
            field["y"] = round(y0, 2)
            field["width"] = round((x1 - x0) * V.SCALE, 2)
            field["height"] = round((y1 - y0) * V.SCALE, 2)
            touched += 1
        pdf.close()

        if touched:
            per_form[doc_id] = touched
            changed += touched
            # §7.8: geometry is the only thing this tool may touch.
            for old, new in zip(before, mapping["staticFields"]):
                for key in set(old) | set(new):
                    if key in ("x", "y", "width", "height"):
                        continue
                    assert old.get(key) == new.get(key), (doc_id, old["id"], key)
            if args.apply:
                with open(path, "w") as fh:
                    json.dump(mapping, fh, indent=1)
                    fh.write("\n")

    for doc_id, count in sorted(per_form.items(), key=lambda kv: -kv[1]):
        print("%-14s %d field(s) trimmed" % (doc_id, count))
    print("\n%d fields trimmed across %d forms, %d refused%s"
          % (changed, len(per_form), refused, "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()

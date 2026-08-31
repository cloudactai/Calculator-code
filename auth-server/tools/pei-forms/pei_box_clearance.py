"""Take every PEI writing box off the printed line above it.

The live app draws a field as a filled box, so anything the rect covers is
gone from the page. Across this batch 76 boxes reach 0.1pt to 4.5pt up into
the line of type above them, and on the worst of them -- Form 70A*'s items 27
to 30 -- a whole caption ("Terms of the order requested", "Current
arrangements") and the prompt of item 29 disappear under the box.

The cause is that PEI sets a caption directly over its rule with almost no
leading, and a writing box is 13.3pt tall (`repair_pei_fields.LINE_HEIGHT`)
whatever the gap it has to live in. Where the gap is 10pt the box takes the
missing 3.3pt out of the caption.

**The bottom edge never moves.** It sits on the printed rule, which is this
province's own convention -- `repair_pei_fields.pass_seat_flat` seats PEI flat
on the rule where the other seven provinces keep a 1.26pt gap, and every one
of these boxes was reviewed and seated there. So the room is taken off the
top: the box gets shorter, not lower, and it still starts and ends on the
paper the review put it on.

## What counts as ink

Not the font box. A word's reported bbox runs from the font's full ascender to
its full descender, so a caption of lowercase letters reports about 1.8pt of
empty air below its baseline and a box tucked into that air reads as an
overlap when it covers nothing. The reverse is also true -- a 'q' or a 'g'
fills that air completely. Only a render tells the two apart, so ink is
measured off one at `DPI`.

Nor is it words. PEI glues a label to its own rule -- "dated______________",
"$______________", "Source:_______", "____________," -- so a word token spans
both the rule the box is entitled to sit on and the label it must not cover.
Characters separate them cleanly: an underscore is rule, an option square
belongs to its own checkbox, everything else is type.

## What it will not do

Three shapes of overlap are not a height problem and are left alone, listed by
`--check` so they stay visible:

* **type below the box** (34 boxes) -- almost always the comma or full stop
  that ends the sentence the rule is embedded in, sitting on the same baseline
  as the writing line. Shortening cannot reach it and lowering would take the
  box off its rule; it would need the box to end before the punctuation, which
  is a width decision this pass does not make.
* **type through the middle** (27 boxes) -- a label inside the box's own
  column: 70I(A)'s "$" markers, 70BB's "dated", 70U's "Prince Edward Island".
  The box starts too far left, which is again a width decision.
* **a box that cannot clear the ink and still hold its own type.** A 9pt font
  needs `MIN_HEIGHT`; below that the box would be a slot too small to write
  in, which is worse than the overlap. Two refuse on that ground and are
  named in the report.

Contact under `MIN_BITE` is left alone as well -- at `DPI` that is two pixels,
which is the render's own resolution rather than a measurement.

    python3 pei_box_clearance.py --check
    python3 pei_box_clearance.py
"""
import argparse
import json
import os
import sys

import fitz
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
SCALE = 1.5

DPI = 400                  # 0.18pt per pixel, so a 0.5pt bite is ~3 pixels
THRESH = 190               # darker than this is ink
GAP = 0.5                  # clear paper wanted between the type and the box
MIN_BITE = 0.5             # under this the edge only grazes the glyph
MIN_HEIGHT = 10.0          # a 9pt writing line, with its own leading

RULE_CHARS = set("_")
SQUARES = set("□☐❏◻")

LOG = os.path.join(HERE, "box_clearance_log.json")


def pei_ids():
    cat = json.load(open(os.path.join(EXPORT, "catalog.json")))
    return sorted(r["docId"] for r in cat if r.get("province") == "PE")


def rect_of(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def ink_mask(page):
    pm = page.get_pixmap(dpi=DPI, colorspace=fitz.csGRAY, alpha=False)
    arr = np.frombuffer(pm.samples, dtype=np.uint8).reshape(pm.height, pm.width)
    return arr < THRESH, DPI / 72.0


def inked(mask, scale, box):
    """The inked sub-rectangle of `box` in points, or None where it is blank."""
    h, w = mask.shape
    x0, x1 = max(0, int(box.x0 * scale)), min(w, int(np.ceil(box.x1 * scale)))
    y0, y1 = max(0, int(box.y0 * scale)), min(h, int(np.ceil(box.y1 * scale)))
    if x1 <= x0 or y1 <= y0:
        return None
    sub = mask[y0:y1, x0:x1]
    if not sub.any():
        return None
    rows, cols = np.flatnonzero(sub.any(axis=1)), np.flatnonzero(sub.any(axis=0))
    return fitz.Rect((x0 + cols[0]) / scale, (y0 + rows[0]) / scale,
                     (x0 + cols[-1] + 1) / scale, (y0 + rows[-1] + 1) / scale)


def type_runs(page, mask, scale):
    """Every run of consecutive type characters, with its true inked box.

    Broken on underscores, whitespace and option squares, so a run is only
    ever the printed words -- never the rule a box sits on, never the square a
    checkbox is fitted to.
    """
    runs = []
    for block in page.get_text("rawdict")["blocks"]:
        if block.get("type"):
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                chars, box = [], None
                for ch in span.get("chars", []):
                    c = ch["c"]
                    if c in RULE_CHARS or c in SQUARES or not c.strip():
                        if chars:
                            runs.append(("".join(chars), box))
                        chars, box = [], None
                        continue
                    chars.append(c)
                    cell = fitz.Rect(ch["bbox"])
                    box = cell if box is None else (box | cell)
                if chars:
                    runs.append(("".join(chars), box))
    out = []
    for text, box in runs:
        ink = inked(mask, scale, box)
        if ink is not None:
            out.append((text, ink))
    return out


def classify(field, runs):
    """(above, middle, below) -- the type this field's rect covers, by where."""
    rect = rect_of(field)
    mid = (rect.y0 + rect.y1) / 2.0
    above, middle, below = [], [], []
    for text, ink in runs:
        hit = ink & rect
        if hit.is_empty or hit.get_area() <= 0.0:
            continue
        if ink.y1 <= mid:
            above.append((text, ink))
        elif ink.y0 >= mid:
            below.append((text, ink))
        else:
            middle.append((text, ink))
    return rect, above, middle, below


def plan_field(field, runs):
    """What to do about one field: a new (y, height), or a reason not to."""
    rect, above, middle, below = classify(field, runs)
    if not above:
        if middle:
            return None, "type through the middle: %s" % _names(middle)
        if below:
            return None, "type below the box: %s" % _names(below)
        return None, None
    ceiling = max(ink.y1 for _t, ink in above)
    bite = ceiling - rect.y0
    if bite < MIN_BITE:
        return None, None
    # A hair of clear paper is wanted, but the box's own usable height is
    # worth more than the hair: the gap is given up before the box is.
    for gap in (GAP, 0.0):
        top = round(ceiling + gap, 2)
        if rect.y1 - top >= MIN_HEIGHT:
            return (top, round((rect.y1 - top) * SCALE, 2)), None
    return None, ("cannot clear %.2fpt and still hold %.1fpt: %s"
                  % (bite, MIN_HEIGHT, _names(above)))


def _names(hits):
    """The covered type as it reads on the page, not as a bag of words.

    `type_runs` walks the page's own block/line/span order, and `classify`
    keeps that order, so the runs are already in reading order and joining
    them reconstructs the caption a reviewer would recognise -- "Terms of the
    order requested", where sorting the set gives "Terms of order requested
    the". Reading order is not re-derived from coordinates: a line that mixes
    roman and italic reports a different ink top for each, and grouping by
    that splits the line into interleaved fragments.
    """
    words = [text for text, _ink in hits]
    return " ".join(words[:9]) + (" ..." if len(words) > 9 else "")


def run(check):
    log, refused, changed = {}, [], 0
    for doc_id in pei_ids():
        doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        by_page = {}
        for field in mapping["staticFields"]:
            by_page.setdefault(field["page"], []).append(field)
        rows, touched = [], 0
        for page_no, fields in sorted(by_page.items()):
            page = doc[page_no - 1]
            mask, scale = ink_mask(page)
            runs = type_runs(page, mask, scale)
            for field in fields:
                if field["type"] == "CheckBox":
                    continue        # fitted to its own square by `fit_ticks`
                move, reason = plan_field(field, runs)
                if reason:
                    refused.append((doc_id, page_no, field["id"], reason))
                if move is None:
                    continue
                top, height = move
                rows.append({
                    "id": field["id"], "page": page_no,
                    "from": [field["y"], field["height"]],
                    "to": [top, height],
                    "covered": _names(classify(field, runs)[1]),
                })
                if not check:
                    field["y"], field["height"] = top, height
                touched += 1
        doc.close()
        if touched:
            log[doc_id] = rows
            changed += touched
            print("%-18s %d box(es) shortened" % (doc_id, touched))
        if touched and not check:
            with open(path, "w") as handle:
                json.dump(mapping, handle, indent=2)

    blocked = [r for r in refused if r[3].startswith("cannot clear")]
    other = [r for r in refused if not r[3].startswith("cannot clear")]
    print("\n%s: %d box(es) across %d form(s)"
          % ("would shorten" if check else "shortened", changed, len(log)))
    if blocked:
        print("left alone, no room to shorten into:")
        for doc_id, page_no, fid, reason in blocked:
            print("  %-18s p%-2d %s  %s" % (doc_id, page_no, fid, reason))
    print("left alone, not a height problem: %d (%d through the middle, %d below)"
          % (len(other),
             sum(1 for r in other if "middle" in r[3]),
             sum(1 for r in other if "below" in r[3])))
    if not check:
        with open(LOG, "w") as handle:
            json.dump(log, handle, indent=2, sort_keys=True)
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    return run(parser.parse_args().check)


if __name__ == "__main__":
    sys.exit(main())

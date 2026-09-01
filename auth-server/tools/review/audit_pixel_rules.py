"""Direction aid for the page-by-page review -- NOT a gate.

Writing rules that are neither typed as underscores nor emitted as vector
geometry, found by scanning the rendered page for horizontal runs of dark
pixels, and reported when no field sits on them.

`audit_anchors.py` finds blanks written as runs of `_`; `audit_drawn_rules.py`
finds blanks drawn with `get_drawings()`. Some pages print a rule that neither
can see. NLPC_AF003 p2 is the case that prompted this: its jurat reads

    SWORN/AFFIRMED BEFORE ME
    at ____________________, NL
    on ________________, 2____,

and the two rules are plainly there on the rendered page, but `get_text` yields
only the words ("at", ", NL", "on", ", 2_") with a whitespace gap between them,
and `page.get_drawings()` returns just three rectangles, none of them these.
The rules survive only as ink in the page's content stream. The NL README
records the same lossy-extraction defect for other Provincial Court forms, so a
blank that no text- or vector-side detector can see is a class of miss the
review needs its own instrument for.

Method, and why each filter is there:

* Render the page greyscale and find, in each pixel row, maximal runs of dark
  pixels at least MIN_RULE points long. A writing rule is one to three pixel
  rows tall at the render resolution; anything thicker is a filled bar or a
  table header, so runs are collapsed across adjacent rows and a stack deeper
  than MAX_THICK points is dropped.
* Drop a run whose length exceeds MAX_RULE -- that is a table border or a
  section divider, not somewhere to write.
* Drop a run that underlines text. What separates a writing rule from an
  underline is what sits on it: a heading underline carries glyphs along its
  whole length, a writing rule has empty space above it because the writing has
  not happened yet. Same INKED threshold, and the same reasoning, as
  `audit_drawn_rules.py`.
* Drop a run a field already covers, and a run that coincides with a vertical
  stroke at both ends (a ruled table cell, handled by the cell-side check).

Every hit is a page to open, and every miss is still a page to open.

    python3 audit_pixel_rules.py NLPC_AF003 NLPC_AF005 ...
    python3 audit_pixel_rules.py --pages 2 NLPC_AF003
"""
import argparse
import json
import os

import fitz

EXPORT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                      "..", "..", "form-template-export"))
SCALE = 1.5
DPI = 200
PT = 72.0 / DPI        # points per pixel
DARK = 150             # 8-bit grey below this counts as ink
MIN_RULE = 24.0        # shorter than this is a hyphen, a dash, a minus sign
MAX_RULE = 330.0       # longer than this is a table border or a page divider
MAX_THICK = 2.4        # a rule is thin; thicker is a filled bar
INKED = 0.34           # above this share of glyph cover it underlines text
GAP = 4                # pixels of white that break one run into two


def rule_runs(page):
    """Horizontal dark runs on the rendered page, in PDF points."""
    pix = page.get_pixmap(colorspace=fitz.csGRAY, dpi=DPI)
    w, h, stride, data = pix.width, pix.height, pix.stride, pix.samples
    found = []
    for row in range(h):
        base = row * stride
        runs = []
        start = None
        gap = 0
        for col in range(w):
            if data[base + col] < DARK:
                if start is None:
                    start = col
                gap = 0
            elif start is not None:
                gap += 1
                if gap > GAP:
                    runs.append((start, col - gap))
                    start = None
        if start is not None:
            runs.append((start, w - 1))
        for a, b in runs:
            if (b - a) * PT >= MIN_RULE:
                found.append((row, a, b))

    # Collapse runs that repeat on adjacent rows into one rule.
    found.sort()
    merged = []
    for row, a, b in found:
        for m in merged:
            if m["row1"] >= row - 1 and not (b < m["a"] - 3 or a > m["b"] + 3):
                m["row1"] = row
                m["a"] = min(m["a"], a)
                m["b"] = max(m["b"], b)
                break
        else:
            merged.append({"row0": row, "row1": row, "a": a, "b": b})

    out = []
    for m in merged:
        thick = (m["row1"] - m["row0"] + 1) * PT
        if thick > MAX_THICK:
            continue
        x0, x1 = m["a"] * PT, m["b"] * PT
        if not (MIN_RULE <= x1 - x0 <= MAX_RULE):
            continue
        out.append((x0, x1, (m["row0"] + m["row1"]) / 2.0 * PT))
    return out


def glyph_rects(page):
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for ch in span["chars"]:
                    if ch["c"].strip() and ch["c"] != "_":
                        out.append(fitz.Rect(ch["bbox"]))
    return out


def inked_share(x0, x1, y, glyphs):
    """Fraction of the rule's length carrying a glyph that sits on it."""
    spans = sorted((max(g.x0, x0), min(g.x1, x1))
                   for g in glyphs
                   if g.x1 > x0 and g.x0 < x1 and g.y0 < y and y - g.y1 <= 5.0)
    covered, end = 0.0, x0
    for a, b in spans:
        if b <= end:
            continue
        covered += b - max(a, end)
        end = b
    return covered / (x1 - x0) if x1 > x0 else 1.0


def verticals(page):
    out = []
    for d in page.get_drawings():
        r = d["rect"]
        if r.width < 2.0 and r.height > 8:
            out.append(r)
    return out


def audit(doc_id, pages=None):
    fields = json.load(open(os.path.join(EXPORT, doc_id + ".json")))["staticFields"]
    doc = fitz.open(os.path.join(EXPORT, doc_id + ".pdf"))
    hits = []
    for n in range(1, doc.page_count + 1):
        if pages and n not in pages:
            continue
        page = doc[n - 1]
        glyphs = glyph_rects(page)
        vs = verticals(page)
        rects = [fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE,
                           f["y"] + f["height"] / SCALE)
                 for f in fields if f["page"] == n]
        for x0, x1, y in rule_runs(page):
            if inked_share(x0, x1, y, glyphs) > INKED:
                continue
            # a ruled table cell has a vertical stroke at each end of the rule
            ends = sum(1 for v in vs if v.y0 - 2 <= y <= v.y1 + 2
                       and (abs(v.x0 - x0) < 3 or abs(v.x0 - x1) < 3))
            if ends >= 2:
                continue
            band = fitz.Rect(x0 + 2, y - 11, x1 - 2, y - 0.5)
            if band.get_area() <= 0:
                continue
            if any((r & band).get_area() > 0.30 * band.get_area() for r in rects):
                continue
            hits.append("%s p%d  UNCOVERED pixel rule x=%.1f-%.1f y=%.1f (%.0fpt)"
                        % (doc_id, n, x0, x1, y, x1 - x0))
    doc.close()
    return hits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("docs", nargs="+")
    ap.add_argument("--pages", type=int, nargs="*")
    args = ap.parse_args()
    out = []
    for d in args.docs:
        out += audit(d, args.pages)
    for h in out:
        print(h)
    print("total:", len(out))


if __name__ == "__main__":
    main()

"""Direction aids for the page-by-page review -- NOT a gate.

Every hit here is a page to open. Every *miss* here is still a page to open:
the defects that cost the other provinces most -- a whole income table with no
boxes, a bind naming the wrong column, a background glyph rendered as an Apple
logo -- are invisible to all three of these. They exist to point the eye, and
the review is what the eye does next.

Writing rules drawn as geometry rather than typed as
underscores, with no field on them.

Drawn writing-rules with no field on them.

PEI writes most blanks as underscore runs, but not all: Form 70I(A)'s
"Every second week" row prints `$` then a run of spaces and draws the rule as
geometry -- exactly the shape Manitoba's README warns about, and invisible to a
run-of-underscores audit.

**What separates a writing rule from an underline** is what sits on it. A
heading underline ("Child support", "Marriage certificate") has glyphs along its
whole length; a writing rule has empty space above it, because the writing has
not happened yet. So each stroke is measured for the fraction of its length that
carries a glyph immediately above, and anything over a third is text decoration
rather than a blank.
"""
import json, os, sys, fitz
EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
INKED = 0.34          # above this share of glyph cover, the stroke underlines text
MAX_RULE = 320        # longer than this and it is a table border, not a blank


def strokes(page):
    out = []
    for d in page.get_drawings():
        for item in d["items"]:
            if item[0] == "l":
                p, q = item[1], item[2]
                if abs(p.y - q.y) < 0.7 and abs(p.x - q.x) > 8:
                    out.append((min(p.x, q.x), max(p.x, q.x), (p.y + q.y) / 2))
            elif item[0] == "re":
                r = item[1]
                if r.height < 0.7 and r.width > 8:
                    out.append((r.x0, r.x1, (r.y0 + r.y1) / 2))
    return out


def glyphs(page):
    out = []
    for b in page.get_text("rawdict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                for c in s["chars"]:
                    if c["c"].strip():
                        out.append(fitz.Rect(c["bbox"]))
    return out


def inked_share(x0, x1, y, gs):
    """Fraction of the stroke's length with a glyph sitting on it."""
    covered = 0.0
    spans = sorted((max(g.x0, x0), min(g.x1, x1))
                   for g in gs
                   if g.x1 > x0 and g.x0 < x1 and g.y0 < y and y - g.y1 <= 5.0)
    end = x0
    for a, b in spans:
        if b <= end:
            continue
        covered += b - max(a, end)
        end = b
    return covered / (x1 - x0)


def audit(doc_id):
    fields = json.load(open(os.path.join(EXPORT, doc_id + ".json")))["staticFields"]
    doc = fitz.open(os.path.join(EXPORT, doc_id + ".pdf"))
    hits = []
    for n in range(1, doc.page_count + 1):
        page = doc[n - 1]
        ss, gs = strokes(page), glyphs(page)
        rects = [fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / 1.5,
                           f["y"] + f["height"] / 1.5)
                 for f in fields if f["page"] == n]
        for (x0, x1, y) in ss:
            if x1 - x0 > MAX_RULE:
                continue
            if inked_share(x0, x1, y, gs) > INKED:
                continue
            band = fitz.Rect(x0 + 2, y - 11, x1 - 2, y - 0.5)
            if band.get_area() <= 0:
                continue
            if any((r & band).get_area() > 0.30 * band.get_area() for r in rects):
                continue
            hits.append("%s p%d  UNCOVERED drawn rule x=%.1f-%.1f y=%.1f (%.0fpt)"
                        % (doc_id, n, x0, x1, y, x1 - x0))
    return hits


if __name__ == "__main__":
    out = []
    for d in sys.argv[1:]:
        out += audit(d)
    for h in out:
        print(h)
    print("total:", len(out))

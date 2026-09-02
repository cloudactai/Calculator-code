"""Compare every shipped NLSC field set against the government's own AcroForm.

    python3 audit_nlsc_vs_source.py [DOCID ...]

Sixty of the 62 NLSC forms are published by the Supreme Court as real AcroForms,
and `build_nl_forms.py` derives the mapping JSON from those widgets (the shipped
background is the same PDF flattened, so it has no widget layer of its own). The
staged originals are still on disk in `form-template-export/_incoming_nl/` as
`<DOCID>_source.pdf`, which makes them the ground truth for this province: a
blank the government fields is a blank the app should field, and a blank the
government leaves bare is a deliberate omission, not a gap to fill.

That distinction is not one the eye can make from a render. On NLSC_F25_03A p4
the Part B "Divorce:" row prints a colon and every sibling row in the same table
carries a description box, so it reads as an obvious omission -- but the
government's own widget list has only a checkbox ("DivorceB") on that row and no
text field, so adding one would be inventing. On NLSC_F10_04A p2 the whole
"SWORN TO or AFFIRMED at ___, this ___ day of ___, 20___" jurat renders bare,
and the government has four widgets sitting exactly on those four underscore
runs -- so there the fields really were dropped.

This script reports both directions:

    DROPPED  a source widget with no field anywhere near it in the shipped JSON
    EXTRA    a shipped field with no source widget near it

Matching is positional, not by name: the build reseats every widget (checkbox
rects shrink to the printed square, text widgets are cut to the 13.3pt standard
line and re-seated on their rule), so rects move by a few points and names are
not carried into the JSON at all. A source widget counts as matched when some
shipped field on the same page overlaps it horizontally and sits within
V_TOL points vertically -- tolerances chosen well above the largest reseat the
build performs and well below the gap to the next printed row.

Read-only: this script never writes.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
INCOMING = os.path.join(EXPORT, "_incoming_nl")
SCALE = 1.5

V_TOL = 14.0     # vertical slack between a widget and its reseated field
H_FRAC = 0.30    # fraction of the narrower box that must overlap horizontally


def field_rect(f):
    return fitz.Rect(f["x"], f["y"],
                     f["x"] + f["width"] / SCALE,
                     f["y"] + f["height"] / SCALE)


def hoverlap(a, b):
    lo, hi = max(a.x0, b.x0), min(a.x1, b.x1)
    if hi <= lo:
        return 0.0
    return (hi - lo) / max(1e-6, min(a.width, b.width))


def near(a, b):
    if hoverlap(a, b) < H_FRAC:
        return False
    return abs(a.y0 - b.y0) < V_TOL or abs(a.y1 - b.y1) < V_TOL or \
        (a.y0 < b.y0 and a.y1 > b.y1) or (b.y0 < a.y0 and b.y1 > a.y1)


def audit(doc_id):
    src_path = os.path.join(INCOMING, doc_id + "_source.pdf")
    if not os.path.exists(src_path):
        return []
    fields = json.load(open(os.path.join(EXPORT, doc_id + ".json")))["staticFields"]
    src = fitz.open(src_path)
    out = []
    for pno in range(1, src.page_count + 1):
        widgets = list(src[pno - 1].widgets())
        mine = [f for f in fields if f["page"] == pno]
        rects = [field_rect(f) for f in mine]
        used = set()
        for w in widgets:
            hit = [i for i, r in enumerate(rects) if near(w.rect, r)]
            if hit:
                used.update(hit)
            else:
                out.append("%s p%d  DROPPED  %-34s rect=(%.1f, %.1f, %.1f, %.1f)"
                           % (doc_id, pno, (w.field_name or "?")[:34], *w.rect))
        for i, r in enumerate(rects):
            if i not in used:
                out.append("%s p%d  EXTRA    %-34s rect=(%.1f, %.1f, %.1f, %.1f)"
                           % (doc_id, pno, mine[i]["type"], r.x0, r.y0, r.x1, r.y1))
    return out


def main():
    docs = sys.argv[1:]
    if not docs:
        docs = sorted(f[:-5] for f in os.listdir(EXPORT)
                      if f.startswith("NLSC_") and f.endswith(".json"))
    total = 0
    for d in docs:
        rows = audit(d)
        for r in rows:
            print(r)
        total += len(rows)
    print("total: %d" % total)


if __name__ == "__main__":
    main()

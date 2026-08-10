"""Render templates with their field boxes drawn on, for eyes-on review.

`HANDOFF.md` §5 is blunt about why this exists: every defect in the Ontario batch was
found by looking at a render, and none by the automated gates. This rebuilds the
throwaway contact-sheet script as a tool.

    python3 contact_sheet.py --only Form25C            # one page per image
    python3 contact_sheet.py --grid 2x2                # contact sheets, all 90
    python3 contact_sheet.py --only Form25C --before   # boxes as currently on disk
                                                       # vs. what the refit would do

Output lands in `form-template-export/_incoming_on/qa/`, which is gitignored.

**A render of the overlay is not a render of the app** (placement guide §7): these
draw the stored box, the viewer draws its own control inside it. Anything that turns
on how the *control* looks has to be checked in the app.
"""

import argparse
import json
import os

import fitz

import on_scope

QA = os.path.join(on_scope.EXPORT, "_incoming_on", "qa")
ZOOM = 1.6

# Field type -> stroke colour. Distinct hues so a mis-typed field is obvious.
COLOURS = {
    "TextField": (0.85, 0.10, 0.10),
    "TextArea": (0.10, 0.35, 0.90),
    "CheckBox": (0.00, 0.60, 0.20),
    "Number": (0.85, 0.45, 0.00),
    "Date": (0.55, 0.15, 0.75),
}


def draw_page(page, fields, rules=False):
    """Stamp each field's box onto the page, plus optionally the detected rules."""
    if rules:
        import page_geom as G
        for ry, rx0, rx1 in G.hrules(page):
            page.draw_line(fitz.Point(rx0, ry), fitz.Point(rx1, ry),
                           color=(0.6, 0.6, 0.6), width=1.4, dashes="[2 2] 0")
    for f in fields:
        r = fitz.Rect(f["x"], f["y"],
                      f["x"] + f["width"] / 1.5,
                      f["y"] + f["height"] / 1.5)
        col = COLOURS.get(f["type"], (0.5, 0.5, 0.5))
        page.draw_rect(r, color=col, width=0.7)


def render(doc_id, export, out_dir, grid=None, rules=False):
    with open(os.path.join(export, doc_id + ".json")) as fh:
        fields = json.load(fh)["staticFields"]
    by_page = {}
    for f in fields:
        by_page.setdefault(f["page"], []).append(f)

    doc = fitz.open(os.path.join(export, doc_id + ".pdf"))
    pix = []
    for i, page in enumerate(doc, start=1):
        draw_page(page, by_page.get(i, []), rules=rules)
        pix.append((i, page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))))

    os.makedirs(out_dir, exist_ok=True)
    written = []
    if not grid:
        for i, pm in pix:
            path = os.path.join(out_dir, f"{doc_id}_p{i}.png")
            pm.save(path)
            written.append(path)
    else:
        cols, rows = grid
        per = cols * rows
        for start in range(0, len(pix), per):
            chunk = pix[start:start + per]
            w = max(p.width for _i, p in chunk)
            h = max(p.height for _i, p in chunk)
            sheet = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, w * cols, h * rows), False)
            sheet.clear_with(255)
            for n, (_i, pm) in enumerate(chunk):
                pm.set_origin((n % cols) * w, (n // cols) * h)
                sheet.copy(pm, pm.irect)
            path = os.path.join(out_dir, f"{doc_id}_sheet{start // per + 1}.png")
            sheet.save(path)
            written.append(path)
    doc.close()
    return written


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--grid", help="e.g. 2x2 to build contact sheets")
    ap.add_argument("--rules", action="store_true", help="also draw the detected printed rules")
    ap.add_argument("--out", default=QA)
    ap.add_argument("--export", default=on_scope.EXPORT)
    args = ap.parse_args()

    grid = None
    if args.grid:
        c, r = args.grid.lower().split("x")
        grid = (int(c), int(r))

    targets = args.only or on_scope.NEW_DOCIDS
    n = 0
    for doc_id in targets:
        n += len(render(doc_id, args.export, args.out, grid, args.rules))
    print(f"{n} images in {args.out}")


if __name__ == "__main__":
    main()

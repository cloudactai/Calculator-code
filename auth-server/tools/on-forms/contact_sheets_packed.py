"""Render every page of the batch into contact sheets, packed across forms.

`contact_sheet.py` renders one form per sheet, which is 103 images for 230 pages.
This packs a fixed grid regardless of form boundaries and stamps each cell with its
docId and page number, so a suspicious cell can be looked up at full size.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import fitz            # noqa: E402
import contact_sheet as CS   # noqa: E402
import on_scope        # noqa: E402

OUT = os.path.join(on_scope.EXPORT, "_incoming_on", "qa", "sheets")
COLS, ROWS = 3, 2
ZOOM = 1.35


def pages_in_order():
    for doc_id in on_scope.NEW_DOCIDS:
        fields = json.load(open(os.path.join(on_scope.EXPORT, doc_id + ".json")))["staticFields"]
        n = max(f["page"] for f in fields)
        for p in range(1, n + 1):
            yield doc_id, p, [f for f in fields if f["page"] == p]


def main():
    os.makedirs(OUT, exist_ok=True)
    todo = list(pages_in_order())
    per = COLS * ROWS
    sheets = (len(todo) + per - 1) // per
    print("%d pages -> %d sheets of %d" % (len(todo), sheets, per))
    for s in range(sheets):
        chunk = todo[s * per:(s + 1) * per]
        tiles = []
        for doc_id, pno, fields in chunk:
            d = fitz.open(os.path.join(on_scope.EXPORT, doc_id + ".pdf"))
            page = d[pno - 1]
            CS.draw_page(page, fields)
            # stamp the identity into the top-left corner
            page.draw_rect(fitz.Rect(0, 0, 150, 15), color=None, fill=(1, 1, 1))
            page.insert_text(fitz.Point(4, 11), "%s p%d" % (doc_id, pno),
                             fontsize=10, color=(0.9, 0, 0.6))
            tiles.append(page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM)))
            d.close()
        w = max(t.width for t in tiles)
        h = max(t.height for t in tiles)
        out = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, w * COLS, h * ROWS), False)
        out.clear_with(255)
        for i, t in enumerate(tiles):
            t.set_origin((i % COLS) * w, (i // COLS) * h)
            out.copy(t, t.irect)
        out.save(os.path.join(OUT, "sheet%02d.png" % (s + 1)))
    print("written to", OUT)


if __name__ == "__main__":
    main()

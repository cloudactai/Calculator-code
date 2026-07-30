"""Contact sheets: every page of every BC template with its overlay boxes drawn.

Orange = TextField, green = TextArea, red = CheckBox. Six pages per sheet so a
whole form can be eyeballed for boxes that miss their blank.
"""
import json
import os
import sys

import fitz

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
QA = os.path.join(EXPORT, "_incoming_bc", "sheets")
SCALE = 1.5
PER_SHEET = 6
COLS = 3
ZOOM = 1.35
COLORS = {"CheckBox": (1, 0, 0), "TextArea": (0, 0.5, 0), "TextField": (1, 0.5, 0)}


def sheets_for(doc_id):
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    by_page = {}
    for f in fields:
        by_page.setdefault(f["page"], []).append(f)

    pixmaps = []
    for number, page in enumerate(pdf, start=1):
        shape = page.new_shape()
        for f in by_page.get(number, []):
            rect = fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE, f["y"] + f["height"] / SCALE)
            shape.draw_rect(rect)
            shape.finish(color=COLORS.get(f["type"], (0, 0, 1)), width=1.0)
        shape.commit()
        pixmaps.append(page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM)))
    pdf.close()

    written = []
    for start in range(0, len(pixmaps), PER_SHEET):
        chunk = pixmaps[start:start + PER_SHEET]
        cell_w = max(p.width for p in chunk)
        cell_h = max(p.height for p in chunk)
        rows = (len(chunk) + COLS - 1) // COLS
        sheet = fitz.open()
        page = sheet.new_page(width=cell_w * min(COLS, len(chunk)), height=cell_h * rows)
        for index, pix in enumerate(chunk):
            col, row = index % COLS, index // COLS
            box = fitz.Rect(col * cell_w, row * cell_h, col * cell_w + pix.width, row * cell_h + pix.height)
            page.insert_image(box, pixmap=pix)
        path = os.path.join(QA, "%s_%02d.png" % (doc_id, start // PER_SHEET + 1))
        page.get_pixmap().save(path)
        written.append((path, start + 1, start + len(chunk)))
        sheet.close()
    return written


def main():
    os.makedirs(QA, exist_ok=True)
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    doc_ids = [c["docId"] for c in catalog if c["province"] == "BC"]
    if len(sys.argv) > 1:
        doc_ids = [d for d in doc_ids if d in sys.argv[1:]]
    total = 0
    for doc_id in doc_ids:
        written = sheets_for(doc_id)
        total += len(written)
        print("%-12s %d sheet(s): %s" % (doc_id, len(written),
                                         ", ".join("p%d-%d" % (a, b) for _, a, b in written)))
    print("\n%d sheets in %s" % (total, QA))


if __name__ == "__main__":
    main()

"""Contact sheets for the batch-2 templates: every page, with its overlay drawn.

Same idea as contact_sheets.py, pointed at _incoming_bc2/out so sheets can be made
before the templates are promoted, and laid out 6-up in reading order so a whole form
is a handful of images. Orange = TextField, green = TextArea, red = CheckBox.

§7.10 is why this exists: the measurements catch systematic faults, the renders catch
the ones no measurement thought to check. §9.12's caveat still applies — this draws the
stored box, not the control the app draws inside it.

    python3 contact_sheets2.py                  # all 145
    python3 contact_sheets2.py BCSC_F30 BCPC_6  # named forms only
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch2 as src2  # noqa: E402

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
OUT = os.path.join(EXPORT, "_incoming_bc2", "out")
SHEETS = os.path.join(EXPORT, "_incoming_bc2", "sheets")
SCALE = 1.5
PER_SHEET = 6
COLS = 3
ZOOM = 1.15
LABEL = 13
COLORS = {"CheckBox": (1, 0, 0), "TextArea": (0, 0.5, 0), "TextField": (1, 0.5, 0)}


def sheets_for(doc_id):
    pdf = fitz.open(os.path.join(OUT, "%s.pdf" % doc_id))
    fields = json.load(open(os.path.join(OUT, "%s.json" % doc_id)))["staticFields"]
    by_page = {}
    for field in fields:
        by_page.setdefault(field["page"], []).append(field)

    pixmaps = []
    for number, page in enumerate(pdf, start=1):
        shape = page.new_shape()
        for field in by_page.get(number, []):
            rect = fitz.Rect(field["x"], field["y"],
                             field["x"] + field["width"] / SCALE,
                             field["y"] + field["height"] / SCALE)
            shape.draw_rect(rect)
            shape.finish(color=COLORS.get(field["type"], (0, 0, 1)), width=1.0)
        shape.commit()
        pixmaps.append((number, page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))))
    pdf.close()

    written = []
    for start in range(0, len(pixmaps), PER_SHEET):
        chunk = pixmaps[start:start + PER_SHEET]
        cell_w = max(p.width for _n, p in chunk)
        cell_h = max(p.height for _n, p in chunk) + LABEL
        rows = (len(chunk) + COLS - 1) // COLS
        sheet = fitz.open()
        page = sheet.new_page(width=cell_w * min(COLS, len(chunk)), height=cell_h * rows)
        for index, (number, pix) in enumerate(chunk):
            col, row = index % COLS, index // COLS
            origin_x, origin_y = col * cell_w, row * cell_h
            # Page number on the sheet, so a defect can be reported against a page.
            page.insert_text((origin_x + 3, origin_y + LABEL - 3),
                             "%s p%d  (%d fields)" % (doc_id, number,
                                                      len(by_page.get(number, []))),
                             fontsize=9, color=(0, 0, 0.8))
            page.insert_image(fitz.Rect(origin_x, origin_y + LABEL,
                                        origin_x + pix.width, origin_y + LABEL + pix.height),
                              pixmap=pix)
        path = os.path.join(SHEETS, "%s_%02d.png" % (doc_id, start // PER_SHEET + 1))
        page.get_pixmap().save(path)
        written.append((path, chunk[0][0], chunk[-1][0]))
        sheet.close()
    return written


def main():
    os.makedirs(SHEETS, exist_ok=True)
    doc_ids = [s["docId"] for s in src2.all_sources()]
    if len(sys.argv) > 1:
        doc_ids = [d for d in doc_ids if d in sys.argv[1:]]
    total = 0
    for doc_id in doc_ids:
        written = sheets_for(doc_id)
        total += len(written)
        print("%-14s %d sheet(s): %s" % (doc_id, len(written),
                                         ", ".join("p%d-%d" % (a, b) for _p, a, b in written)))
    print("\n%d sheets in %s" % (total, SHEETS))


if __name__ == "__main__":
    main()

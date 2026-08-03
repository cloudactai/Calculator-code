"""Alignment sweep: flag any overlay box that is not sitting on blank space.

A correctly placed field covers a blank (white, or the form's light grey fill, or
an empty ruled row). A misplaced one covers printed ink — a label, a caption, a
table header. Rendering each page and measuring ink inside every box catches that
across every page of every form, which eyeballing a sample cannot.
"""
import json
import os
import sys

import fitz

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
SCALE = 1.5
ZOOM = 2.0
# Below this the pixel is ink, not paper or the form's grey field shading.
DARK = 160


def sweep(doc_id):
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    flags = []
    by_page = {}
    for f in fields:
        by_page.setdefault(f["page"], []).append(f)

    for page_number, page_fields in sorted(by_page.items()):
        page = pdf[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), colorspace=fitz.csGRAY)
        width, height = pix.width, pix.height
        samples = pix.samples
        for f in page_fields:
            x0 = int(f["x"] * ZOOM)
            y0 = int(f["y"] * ZOOM)
            x1 = int((f["x"] + f["width"] / SCALE) * ZOOM)
            y1 = int((f["y"] + f["height"] / SCALE) * ZOOM)
            # Ignore the 1px border the printed field box itself may draw.
            x0, y0 = max(x0 + 1, 0), max(y0 + 1, 0)
            x1, y1 = min(x1 - 1, width), min(y1 - 1, height)
            if x1 <= x0 or y1 <= y0:
                continue
            dark = total = 0
            for y in range(y0, y1):
                row = y * width
                for x in range(x0, x1):
                    total += 1
                    if samples[row + x] < DARK:
                        dark += 1
            if total and dark / total > 0.06:
                flags.append({"page": page_number, "id": f["id"], "type": f["type"],
                              "ink": round(dark / total, 3),
                              "box": [f["x"], f["y"], round(f["width"] / SCALE, 1),
                                      round(f["height"] / SCALE, 1)]})
    pdf.close()
    return len(fields), flags


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    doc_ids = [c["docId"] for c in catalog if c["province"] == "BC"]
    if len(sys.argv) > 1:
        doc_ids = [d for d in doc_ids if d in sys.argv[1:]]
    report = {}
    for doc_id in doc_ids:
        count, flags = sweep(doc_id)
        report[doc_id] = flags
        marker = "" if not flags else "  <-- %d" % len(flags)
        print("%-12s fields=%-4d inked=%-4d%s" % (doc_id, count, len(flags), marker))
    with open(os.path.join(EXPORT, "_incoming_bc", "ink_sweep.json"), "w") as fh:
        json.dump(report, fh, indent=1)
    total = sum(len(v) for v in report.values())
    print("\n%d boxes sitting on ink across %d forms" % (total, len(doc_ids)))


if __name__ == "__main__":
    main()

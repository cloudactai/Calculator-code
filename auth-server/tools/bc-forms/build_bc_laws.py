"""Build a BC Supreme template from the BC Laws (regulation) text of the form.

Used for the Adobe interview forms, whose published fillable file is a wizard and
carries no field boxes to copy. Here the blanks are printed dotted leaders
("......[name]......") and ruled table cells, so box geometry is detected from the
text and vector layers the way the Ontario Word forms were handled.

Run: python3 build_bc_laws.py <docId> <source.pdf> [--promote]
"""
import json
import os
import re
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
OUT = os.path.join(EXPORT, "_incoming_bc", "out")
QA = os.path.join(EXPORT, "_incoming_bc", "qa")

# A run of dots is the form's blank. Three is enough to be deliberate rather than
# an ellipsis inside a sentence.
DOT_RUN = re.compile(r"\.{4,}")
MIN_WIDTH = 18.0
LINE_HEIGHT = 13.0


def dotted_blanks(page):
    """Rects covering each printed run of dots, merged across adjacent words."""
    blanks = []
    for x0, y0, x1, y1, word, block, line, _ in page.get_text("words"):
        for match in DOT_RUN.finditer(word):
            # Position the run within the word by character width.
            per_char = (x1 - x0) / max(len(word), 1)
            start = x0 + per_char * match.start()
            end = x0 + per_char * match.end()
            blanks.append([start, y0, end, y1, block, line])

    blanks.sort(key=lambda b: (b[4], b[5], b[0]))
    merged = []
    for blank in blanks:
        if merged:
            last = merged[-1]
            same_line = last[4] == blank[4] and last[5] == blank[5]
            # A "......[name]......" blank is one field interrupted by its caption.
            if same_line and blank[0] - last[2] < 46 and abs(blank[1] - last[1]) < 3:
                last[2] = blank[2]
                last[3] = max(last[3], blank[3])
                continue
        merged.append(blank)
    return [fitz.Rect(b[0], b[1], b[2], b[3]) for b in merged if b[2] - b[0] >= MIN_WIDTH]


def table_cells(page, min_width=40.0, min_height=12.0):
    """Empty ruled cells — the regulation renders its tables as vector boxes."""
    rects = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.width >= min_width and min_height <= rect.height <= 120:
            rects.append(rect)
    # Drop a box that merely contains other boxes (the table's outer frame).
    keep = []
    for rect in rects:
        inner = sum(1 for other in rects if other != rect and rect.contains(other))
        if inner < 2:
            keep.append(rect)
    return keep


def build(doc_id, source, promote=False):
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    background = os.path.join(OUT, "%s.pdf" % doc_id)
    doc = fitz.open(source)
    doc.save(background, garbage=4, deflate=True, clean=True)
    doc.close()

    doc = fitz.open(background)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    fields, skipped = [], []
    index = 0
    for number, page in enumerate(doc, start=1):
        captions = bp.signature_captions(page)
        boxes = [(r, "TextField") for r in dotted_blanks(page)]
        boxes += [(r, "TextArea") for r in table_cells(page)]
        for rect, kind in boxes:
            if any(rect.intersects(other) and other != rect for other, _ in boxes if other.get_area() > rect.get_area() * 4):
                continue
            if bp.is_signature_box(rect, "", captions):
                skipped.append({"page": number, "why": "signature"})
                continue
            height = max(rect.height, LINE_HEIGHT)
            index += 1
            fields.append({
                "id": bp.new_id(doc_id, index), "type": kind,
                "x": round(rect.x0, 2), "y": round(rect.y0 - 1, 2),
                "width": round(rect.width * bp.SCALE, 2),
                "height": round(height * bp.SCALE, 2),
                "value": "", "fontSize": 9, "color": [0, 0, 0],
                "background": "none", "border": "none", "page": number,
            })
    doc.close()

    bp.clamp_to_page(fields, page_sizes)
    problems = bp.check_geometry(fields, page_sizes)
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)
    print("%-12s pages=%-3d fields=%-4d sig-skipped=%-3d geom=%-2d overlap=%d"
          % (doc_id, len(page_sizes), len(fields), len(skipped), len(problems), len(overlaps)))
    if problems:
        print("  geometry:", problems[:4])
    if promote and not problems:
        for extension in ("pdf", "json"):
            os.replace(os.path.join(OUT, "%s.%s" % (doc_id, extension)),
                       os.path.join(EXPORT, "%s.%s" % (doc_id, extension)))
        print("  promoted")
    return fields


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2], "--promote" in sys.argv)

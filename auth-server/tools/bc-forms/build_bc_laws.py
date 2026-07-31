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


def line_chars(page):
    """Every text line as (chars, bboxes), using exact per-character geometry.

    Estimating a dot run's position from average character width clips real text
    off the ends ("Court File No.:" losing its "o.:"), so the character boxes the
    PDF itself carries are used instead.
    """
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            chars, boxes = [], []
            for span in line["spans"]:
                for char in span["chars"]:
                    chars.append(char["c"])
                    boxes.append(fitz.Rect(char["bbox"]))
            if chars:
                yield "".join(chars), boxes


def dotted_blanks(page):
    """Rects covering each printed blank: a run of dots plus any caption inside it.

    The regulation writes a blank as "......[name]......", so the bracketed caption
    between two dot runs belongs to the same field.
    """
    blanks = []
    for text, boxes in line_chars(page):
        spans = [m.span() for m in DOT_RUN.finditer(text)]
        merged = []
        for start, end in spans:
            if merged:
                gap = text[merged[-1][1]:start]
                # Absorb a bracketed caption sitting between two dot runs.
                if gap.strip().startswith("[") or (len(gap) <= 40 and "]" in gap):
                    merged[-1] = (merged[-1][0], end)
                    continue
            merged.append((start, end))
        for start, end in merged:
            rect = fitz.Rect(boxes[start])
            for box in boxes[start:end]:
                rect |= box
            if rect.width >= MIN_WIDTH:
                blanks.append(rect)
    return blanks


def caption_tails(page, blanks):
    """Every bracketed caption that belongs to a blank, across line wraps.

    "[briefly indicate this person's relationship to other parties to this family
    law case]" opens on the blank's line and closes on the next, so the span is
    tracked in reading order and each line's portion cleared.
    """
    lines = list(line_chars(page))
    tails = []
    open_span = None  # (list of rects collected so far)
    for text, boxes in lines:
        cursor = 0
        while cursor < len(text):
            if open_span is None:
                start = text.find("[", cursor)
                if start < 0:
                    break
                open_span = []
                cursor = start
            end = text.find("]", cursor)
            stop = (end + 1) if end >= 0 else len(text)
            rect = fitz.Rect(boxes[cursor])
            for box in boxes[cursor:stop]:
                rect |= box
            open_span.append(rect)
            cursor = stop
            if end < 0:
                break  # caption continues on the following line
            # A caption counts as part of a blank when a dot run touches it.
            if any(r.intersects(b) or abs(r.x0 - b.x1) < 8 or abs(b.x0 - r.x1) < 8
                   for r in open_span for b in blanks):
                tails.extend(open_span)
            open_span = None
    return tails


def table_cells(page, min_width=40.0, min_height=12.0):
    """Empty ruled cells — the regulation renders its tables as vector boxes.

    A cell only counts when nothing is printed inside it. The regulation also
    draws bordered boxes around blocks of instructions, and those are not fields.
    """
    rects = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if not (rect.width >= min_width and min_height <= rect.height <= 120):
            continue
        if page.get_text("text", clip=rect).strip():
            continue
        rects.append(rect)
    # Drop a box that merely contains other boxes (the table's outer frame).
    keep = []
    for rect in rects:
        inner = sum(1 for other in rects if other != rect and rect.contains(other))
        if inner < 2:
            keep.append(rect)
    return keep


LABEL_BLANK = re.compile(r"^(Claimant|Respondent)s?\(?s?\)?\s*:\s*$", re.I)


def label_blanks(page, right_margin=72.0):
    """Boxes for "Claimant:" style lines, where the blank is bare whitespace.

    The regulation prints the label and leaves the rest of the line empty, so
    there are no dots for the leader detector to find.
    """
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not LABEL_BLANK.match(text):
                continue
            x0, y0, x1, y1 = line["bbox"]
            out.append(fitz.Rect(x1 + 6, y0, page.rect.width - right_margin, y1))
    return [r for r in out if r.width >= MIN_WIDTH]


def clear_blanks(page, rects, tails=()):
    """Erase the dots and the inline caption, and rule a clean line to write on.

    The regulation writes a blank as "......[name]......", so the caption sits
    inside the field rather than under it. Left printed, a typed name lands on
    top of the word "[name]"; removing it leaves the blank the caption describes.
    """
    for rect in list(rects) + list(tails):
        page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions()
    # Rule the line under the whole blank, caption included, so the printed line
    # and the editable box are the same width.
    for rect in merge_same_line(rects, tails):
        page.draw_line(fitz.Point(rect.x0, rect.y1), fitz.Point(rect.x1, rect.y1),
                       color=(0, 0, 0), width=0.5)


def merge_same_line(rects, tails):
    """Blanks, each widened to swallow a caption printed on its own line."""
    merged = [fitz.Rect(r) for r in rects]
    for tail in tails:
        for index, rect in enumerate(merged):
            on_line = abs(rect.y0 - tail.y0) < 4
            touching = tail.x0 - rect.x1 < 10 and rect.x0 - tail.x1 < 10
            if on_line and touching:
                # `rect |= tail` would rebind the loop variable, not the element.
                merged[index] = rect | tail
                break
        else:
            merged.append(fitz.Rect(tail))
    merged.sort(key=lambda r: (round(r.y0), r.x0))
    joined = []
    for rect in merged:
        if joined and abs(joined[-1].y0 - rect.y0) < 4 and rect.x0 - joined[-1].x1 < 10:
            joined[-1] = joined[-1] | rect
            continue
        joined.append(rect)
    return joined


def build(doc_id, source, promote=False):
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    background = os.path.join(OUT, "%s.pdf" % doc_id)
    # Pass 1: find every dotted blank, then clear them so the background prints
    # as ruled lines instead of dots-plus-caption.
    doc = fitz.open(source)
    per_page_blanks, per_page_cells = [], []
    for page in doc:
        blanks = dotted_blanks(page)
        tails = caption_tails(page, blanks)
        # Cells must be read before redacting: the white fill left behind by a
        # redaction is itself a rectangle with no text in it, which the cell
        # detector would otherwise report as an empty cell over every blank.
        per_page_cells.append(table_cells(page))
        # The field box is the ruled line, so both come from the same merge.
        per_page_blanks.append(merge_same_line(blanks, tails))
        clear_blanks(page, blanks, tails)
    doc.save(background, garbage=4, deflate=True, clean=True)
    doc.close()

    doc = fitz.open(background)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    fields, skipped = [], []
    index = 0
    for number, page in enumerate(doc, start=1):
        captions = bp.signature_captions(page)
        boxes = [(r, "TextField") for r in per_page_blanks[number - 1]]
        boxes += [(r, "TextField") for r in label_blanks(page)]
        boxes += [(r, "TextArea") for r in per_page_cells[number - 1]]
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

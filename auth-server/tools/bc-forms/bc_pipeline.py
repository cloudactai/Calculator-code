"""BC form pipeline: AcroForm source PDF -> printed background PDF + overlay field map.

Overlay convention (proven against the Ontario templates, see Form8A):
  field.x = widget rect left in points, field.y = rect top in points (y grows down,
  which is already PyMuPDF's page space), width/height = points * SCALE.
  FillPdf.savePdf stamps y = pageH - field.y - height/SCALE.

The government's own widget rectangles are the authoritative field boxes, so reusing
their geometry means boxes can never land on a printed label.
"""
import json
import re
import zlib

import fitz

SCALE = 1.5

# A signature box is short; a tall box near a signature caption is something else
# (an address block, say), so only short boxes are dropped. Ontario lesson, §6.
SIG_MAX_HEIGHT = 35
SIG_CAPTION = re.compile(r"^\s*signature\b", re.I)
SIG_DATE_CAPTION = re.compile(r"date of signature", re.I)
# Printed empty-checkbox glyphs. A checkbox overlay is *supposed* to sit on one,
# so they must never count as a label the box is covering.
BOX_GLYPHS = set("❑☐□⃞◻▢")


def field_type(widget):
    """Map a PDF widget to one of the three overlay types the editor supports."""
    kind = widget.field_type_string
    if kind in ("CheckBox", "RadioButton"):
        return "CheckBox"
    if kind == "Text":
        multiline = bool(widget.field_flags & 4096)  # Ff bit 13 = multiline
        return "TextArea" if multiline else "TextField"
    if kind in ("ComboBox", "ListBox"):
        return "TextField"
    return None  # Signature / Button / unknown -> no overlay box


def signature_captions(page):
    """Rects of printed 'Signature...' captions, excluding 'Date of signature'."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"])
            if SIG_CAPTION.search(text) and not SIG_DATE_CAPTION.search(text):
                out.append(fitz.Rect(line["bbox"]))
    return out


def is_signature_box(rect, widget_name, captions):
    """A short box sitting directly above a printed 'Signature...' caption.

    Deliberately geometric only. BC names the *print name* boxes beside a signature
    line things like "name of signature 1", so a name-based rule would strip the
    very fields a lawyer has to type into.
    """
    if rect.height >= SIG_MAX_HEIGHT:
        return False
    for caption in captions:
        below = 0 <= caption.y0 - rect.y1 <= 24  # caption printed under the box
        overlapping_x = rect.x1 > caption.x0 - 12 and rect.x0 < caption.x1 + 12
        if below and overlapping_x:
            return True
    return False


def new_id(doc_id, index):
    """Stable, collision-free integer ids in the same shape the editor already uses."""
    base = 1750000000000 + (zlib.crc32(doc_id.encode()) % 900000) * 1000
    return base + index


def extract(source_path, doc_id):
    """Return (overlay fields, per-form audit) for an AcroForm source PDF."""
    doc = fitz.open(source_path)
    fields, skipped_signatures = [], []
    index = 0
    for page_number, page in enumerate(doc, start=1):
        captions = signature_captions(page)
        for widget in page.widgets():
            kind = field_type(widget)
            rect = fitz.Rect(widget.rect)
            name = widget.field_name or ""
            if kind is None:
                skipped_signatures.append({"page": page_number, "name": name, "why": widget.field_type_string})
                continue
            if rect.width <= 1 or rect.height <= 1:
                continue
            if kind != "CheckBox" and is_signature_box(rect, name, captions):
                skipped_signatures.append({"page": page_number, "name": name, "why": "signature"})
                continue
            index += 1
            fields.append({
                "id": new_id(doc_id, index),
                "type": kind,
                **({"shape": "circle" if widget.field_type_string == "RadioButton" else "square"}
                   if kind == "CheckBox" else {}),
                "x": round(rect.x0, 2),
                "y": round(rect.y0, 2),
                "width": round(rect.width * SCALE, 2),
                "height": round(rect.height * SCALE, 2),
                "value": "",
                "fontSize": 9,
                "color": [0, 0, 0],
                "background": "none",
                "border": "none",
                "page": page_number,
            })
    audit = {
        "docId": doc_id,
        "pages": doc.page_count,
        "fields": len(fields),
        "checkboxes": sum(1 for f in fields if f["type"] == "CheckBox"),
        "textAreas": sum(1 for f in fields if f["type"] == "TextArea"),
        "signaturesSkipped": len(skipped_signatures),
        "signatureDetail": skipped_signatures,
        "pageSizes": [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc],
    }
    doc.close()
    return fields, audit


def nudge_off_hint(pdf_path, fields, min_remaining=14.0):
    """Move a box's top below any printed hint line it starts on.

    Acrobat hides a field's placeholder once you type; a flattened background keeps
    it printed, so a box whose first line sits on "List the details of the order you
    are asking for" would have the lawyer's first line land on top of that hint.
    Only boxes with room to spare are nudged.
    """
    doc = fitz.open(pdf_path)
    nudged = 0
    for page_number in sorted({f["page"] for f in fields}):
        words = doc[page_number - 1].get_text("words")
        for f in [x for x in fields if x["page"] == page_number]:
            height = f["height"] / SCALE
            if height < min_remaining * 2:
                continue
            box = fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE, f["y"] + height)
            top_band = fitz.Rect(box.x0, box.y0, box.x1, box.y0 + min_remaining)
            bottoms = [
                y1 for x0, y0, x1, y1, word, *_ in words
                if word.strip() and not set(word.strip()) <= BOX_GLYPHS
                and not (top_band & fitz.Rect(x0, y0, x1, y1)).is_empty
            ]
            if not bottoms:
                continue
            new_top = max(bottoms) + 1.0
            if new_top <= f["y"] or box.y1 - new_top < min_remaining:
                continue
            f["height"] = round((box.y1 - new_top) * SCALE, 2)
            f["y"] = round(new_top, 2)
            nudged += 1
    doc.close()
    return nudged


def printed_mark(page, box, pad=3.0):
    """The tick target actually printed under a checkbox overlay.

    BC prints two kinds: the Supreme forms draw a rounded square (or a circle for
    a radio group) as vector art, the Provincial forms print a ❑ glyph. Either
    way the overlay should sit exactly on it rather than on the larger box XFA
    allocated around it.
    """
    search = fitz.Rect(box.x0 - pad, box.y0 - pad, box.x1 + pad, box.y1 + pad)
    found = None
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if not (3 <= rect.width <= 26 and 3 <= rect.height <= 26):
            continue
        if not rect.intersects(search):
            continue
        if (rect & search).get_area() < 0.25 * rect.get_area():
            continue
        found = rect if found is None else (found | rect)
    if found is None:
        for x0, y0, x1, y1, word, *_ in page.get_text("words", clip=search):
            if word.strip() and set(word.strip()) <= BOX_GLYPHS:
                glyph = fitz.Rect(x0, y0, x1, y1)
                found = glyph if found is None else (found | glyph)
    if found is None:
        return None
    refined = ink_bounds(page, found)
    if refined and 0.62 <= refined.width / max(refined.height, 0.01) <= 1.6:
        return refined
    # The ink measure picked up a neighbouring line. These marks are square, so
    # fall back to a square centred on the candidate rather than trust it.
    side = min(found.width, found.height)
    centre_x, centre_y = (found.x0 + found.x1) / 2, (found.y0 + found.y1) / 2
    return fitz.Rect(centre_x - side / 2, centre_y - side / 2,
                     centre_x + side / 2, centre_y + side / 2)


def ink_bounds(page, rect, zoom=6.0, pad=1.0, dark=170):
    """Tighten a candidate to the pixels actually inked.

    A ❑ glyph reports its font box — 9 x 14 for a 9 x 9 square — and a vector
    stroke reports its path box. Rendering the candidate and measuring the ink
    gives the mark a lawyer actually sees, which is what the control must match.
    """
    area = fitz.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad)
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=area, colorspace=fitz.csGRAY)
    if not pix.width or not pix.height:
        return None
    samples = pix.samples
    min_x, min_y, max_x, max_y = pix.width, pix.height, -1, -1
    for y in range(pix.height):
        row = y * pix.width
        for x in range(pix.width):
            if samples[row + x] < dark:
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
    if max_x < 0:
        return None
    return fitz.Rect(area.x0 + min_x / zoom, area.y0 + min_y / zoom,
                     area.x0 + (max_x + 1) / zoom, area.y0 + (max_y + 1) / zoom)


def snap_checkboxes(pdf_path, fields, max_shift=12.0):
    """Move each checkbox overlay onto the mark printed beneath it.

    XFA hands back a box sized for a whole text line, so a 10 pt square ends up
    inside an 18 pt tall field and the control floats above the mark. Snapping is
    skipped when nothing is found or the correction is implausibly large.
    """
    doc = fitz.open(pdf_path)
    snapped = missed = 0
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        for field in [f for f in fields if f["page"] == page_number and f["type"] == "CheckBox"]:
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            mark = printed_mark(page, box)
            if mark is None or mark.width < 3 or mark.height < 3:
                missed += 1
                continue
            if abs(mark.x0 - box.x0) > max_shift or abs(mark.y0 - box.y0) > max_shift:
                missed += 1
                continue
            field["x"] = round(mark.x0, 2)
            field["y"] = round(mark.y0, 2)
            field["width"] = round(mark.width * SCALE, 2)
            field["height"] = round(mark.height * SCALE, 2)
            snapped += 1
    doc.close()
    return snapped, missed


def flatten_background(source_path, dest_path):
    """Write the source as a printed background: no /AcroForm, no widget annots.

    The printed rules, boxes and captions live in the page content, so deleting the
    widget layer leaves the government's form exactly as it prints — matching the
    Ontario templates, which carry 0 native fields.
    """
    doc = fitz.open(source_path)
    for page in doc:
        for widget in list(page.widgets()):
            page.delete_widget(widget)
    doc.xref_set_key(doc.pdf_catalog(), "AcroForm", "null")
    doc.save(dest_path, garbage=4, deflate=True, clean=True)
    doc.close()
    check = fitz.open(dest_path)
    remaining = sum(len(list(page.widgets())) for page in check)
    pages = check.page_count
    check.close()
    if remaining:
        raise SystemExit("%s still has %d widgets after flatten" % (dest_path, remaining))
    return pages


def clamp_to_page(fields, page_sizes, margin=4.0):
    """Trim a box that runs off the sheet back to the page edge.

    XFA lays some header boxes (Court File No., Court Registry) wider than the
    printed rule they sit on, which would put part of a stamped field off-paper.
    """
    clamped = 0
    for f in fields:
        width, height = page_sizes[f["page"] - 1]
        right = f["x"] + f["width"] / SCALE
        if right > width - margin:
            f["width"] = round(max(width - margin - f["x"], 8) * SCALE, 2)
            clamped += 1
        bottom = f["y"] + f["height"] / SCALE
        if bottom > height - margin:
            f["height"] = round(max(height - margin - f["y"], 8) * SCALE, 2)
            clamped += 1
    return clamped


def check_geometry(fields, page_sizes):
    """Gate C: in-bounds, positive size, unique ids, valid page indices."""
    problems = []
    seen = set()
    for f in fields:
        if f["id"] in seen:
            problems.append("duplicate id %s" % f["id"])
        seen.add(f["id"])
        if not 1 <= f["page"] <= len(page_sizes):
            problems.append("field %s page %s out of range" % (f["id"], f["page"]))
            continue
        width, height = page_sizes[f["page"] - 1]
        if f["width"] <= 0 or f["height"] <= 0:
            problems.append("field %s non-positive size" % f["id"])
        if f["x"] < -2 or f["y"] < -2:
            problems.append("field %s above/left of page" % f["id"])
        if f["x"] + f["width"] / SCALE > width + 2:
            problems.append("field %s past right edge" % f["id"])
        if f["y"] + f["height"] / SCALE > height + 2:
            problems.append("field %s past bottom edge" % f["id"])
    return problems


def check_overlap(pdf_path, fields):
    """Gate F: flag a box that covers printed label text rather than a blank."""
    doc = fitz.open(pdf_path)
    flagged = []
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        words = page.get_text("words")
        for f in [x for x in fields if x["page"] == page_number]:
            box = fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE, f["y"] + f["height"] / SCALE)
            for x0, y0, x1, y1, word, *_ in words:
                word_rect = fitz.Rect(x0, y0, x1, y1)
                overlap = box & word_rect
                if overlap.is_empty or not word.strip():
                    continue
                if set(word.strip()) <= BOX_GLYPHS:
                    continue  # a checkbox overlay landing on its printed square
                # Ignore a grazing touch; flag only a box genuinely covering a label.
                if overlap.get_area() > 0.55 * word_rect.get_area() and word_rect.get_area() > 4:
                    flagged.append({"page": page_number, "id": f["id"], "word": word})
                    break
    doc.close()
    return flagged


def qa_render(pdf_path, fields, out_path, zoom=2.0):
    """Gate E: every page rendered with its overlay boxes drawn on top."""
    doc = fitz.open(pdf_path)
    out = fitz.open()
    colors = {"CheckBox": (1, 0, 0), "TextArea": (0, 0.45, 0), "TextField": (1, 0.55, 0)}
    for page_number, page in enumerate(doc, start=1):
        shape = page.new_shape()
        for f in [x for x in fields if x["page"] == page_number]:
            rect = fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE, f["y"] + f["height"] / SCALE)
            shape.draw_rect(rect)
            shape.finish(color=colors.get(f["type"], (0, 0, 1)), width=0.8)
        shape.commit()
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        new = out.new_page(width=page.rect.width, height=page.rect.height)
        new.insert_image(new.rect, pixmap=pix)
    out.save(out_path, deflate=True)
    out.close()
    doc.close()


def write_mapping(path, fields):
    with open(path, "w") as fh:
        json.dump({"staticFields": fields}, fh, indent=1)

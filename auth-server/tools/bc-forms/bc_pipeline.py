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

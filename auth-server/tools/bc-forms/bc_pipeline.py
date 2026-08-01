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
    # The printed ❑ wins outright. BC shades a panel behind it, and that shading
    # is a rectangle of much the same size, so taking vector art first unioned
    # the two and dropped the control below its own tick box.
    for x0, y0, x1, y1, word, *_ in page.get_text("words", clip=search):
        if word.strip() and set(word.strip()) <= BOX_GLYPHS:
            glyph = fitz.Rect(x0, y0, x1, y1)
            found = glyph if found is None else (found | glyph)
    if found is None:
        for drawing in page.get_drawings():
            rect = drawing["rect"]
            if not (3 <= rect.width <= 26 and 3 <= rect.height <= 26):
                continue
            if not rect.intersects(search):
                continue
            if (rect & search).get_area() < 0.25 * rect.get_area():
                continue
            # Skip the shading itself: it is a filled grey panel, not the outline.
            fill = drawing.get("fill")
            if fill and min(fill) > 0.75 and max(fill) < 0.99 and not drawing.get("color"):
                continue
            found = rect if found is None else (found | rect)
    if found is None:
        return None
    refined = ink_bounds(page, found)
    if refined and 0.78 <= refined.width / max(refined.height, 0.01) <= 1.28:
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
            # Accept any mark sitting inside the field's own box. A distance limit
            # rejected the mark on a two-line option, where the circle is centred
            # about 14 pt down, and left the control a tall oval.
            centre = fitz.Point((mark.x0 + mark.x1) / 2, (mark.y0 + mark.y1) / 2)
            if not (box + (-max_shift, -max_shift, max_shift, max_shift)).contains(centre):
                missed += 1
                continue
            field["x"] = round(mark.x0, 2)
            field["y"] = round(mark.y0, 2)
            field["width"] = round(mark.width * SCALE, 2)
            field["height"] = round(mark.height * SCALE, 2)
            snapped += 1
    doc.close()
    return snapped, missed


def shaded_boxes(page, min_width=20.0, min_height=6.0, max_height=60.0):
    """The light grey rectangles BC prints to show where writing goes."""
    out = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        fill = drawing.get("fill")
        if not fill or not (rect.width >= min_width and min_height <= rect.height <= max_height):
            continue
        if min(fill) > 0.75 and max(fill) < 0.98:  # grey, not white and not a rule
            out.append(rect)
    return out


def snap_text_fields(pdf_path, fields, tolerance=6.0):
    """Fit a text field to the grey box printed under it.

    XFA sizes a field to its text line, which runs a few points taller than the
    shading the form prints, so the editable area stood proud of the box a lawyer
    sees. Only fields with a clear single match are moved.
    """
    doc = fitz.open(pdf_path)
    snapped = 0
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        # Up to a full table cell: a description cell runs about 72 pt, and the
        # field XFA gives back is one line, so the writing area has to be found
        # from the shading rather than from the field.
        # A description cell may be a whole table cell tall. An amount is one
        # line whatever the cell around it looks like, so amounts only ever snap
        # to shading of about a row's height.
        cell_boxes = shaded_boxes(page, max_height=220.0)
        row_boxes = [g for g in cell_boxes if g.height <= 60.0]
        if not cell_boxes:
            continue
        dollars = [fitz.Rect(w[:4]) for w in page.get_text("words") if w[4].strip() == "$"]
        dollars = [fitz.Rect(w[:4]) for w in page.get_text("words") if w[4].strip() == "$"]
        for field in [f for f in fields if f["page"] == page_number and f["type"] in ("TextField", "TextArea")]:
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            # An amount cell is identified from the page, not from the field type:
            # BC prints a $ on the field's own line, either inside the field or
            # immediately to its left. An amount is one line of text, so such a
            # field takes the cell's width but keeps its own height — only a
            # description cell is grown to fill a tall cell.
            # An amount cell is read off the page: a $ on the field's own line,
            # inside the field or just to its left.
            money = any(d.y0 < box.y1 and d.y1 > box.y0
                        and box.x0 - 30 <= d.x1 <= box.x0 + box.width * 0.5
                        for d in dollars)
            candidates = row_boxes if money else cell_boxes
            hits = [g for g in candidates
                    if not (g & box).is_empty
                    and (g & box).get_area() > 0.45 * min(g.get_area(), box.get_area())]
            if not hits:
                continue
            # Grey rows butt up against each other, so a field that grazes the row
            # above would union two rows, blow the height guard and end up snapped
            # to nothing. Take the row it really sits on, then join only the cells
            # on that same row (a wide field split across several shaded cells).
            best = max(hits, key=lambda g: (g & box).get_area())
            target = best
            for extra in hits:
                if abs(extra.y0 - best.y0) < 2 and abs(extra.y1 - best.y1) < 2:
                    target |= extra
            # A real cell matches the field in at least one dimension: a wide
            # shaded row shares its height, a tall description cell shares its
            # width. Something far bigger in both is a background panel, not this
            # field's writing area.
            if target.width > box.width * 1.6 and target.height > box.height * 1.6:
                continue
            field["x"] = round(target.x0, 2)
            field["width"] = round(target.width * SCALE, 2)
            field["y"] = round(target.y0, 2)
            field["height"] = round(target.height * SCALE, 2)
            snapped += 1
    doc.close()
    return snapped


def clear_printed_labels(pdf_path, fields, gap=1.5, left_zone=0.6):
    """Start a field after anything printed inside its own writing area.

    BC shades behind its labels, so fitting a field to its grey box can swallow
    the "$" of an amount cell or a caption like "Address:" — a lawyer would type
    over the printed word. The left edge therefore moves past whatever the form
    already prints in the left part of the box. Text further right is a hint
    sitting beside the writing space and is left alone.
    """
    doc = fitz.open(pdf_path)
    fixed = 0
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        words = [(fitz.Rect(w[:4]), w[4]) for w in page.get_text("words") if w[4].strip()]
        for field in [f for f in fields if f["page"] == page_number and f["type"] in ("TextField", "TextArea")]:
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            limit = box.x0 + box.width * left_zone
            covered = [r for r, text in words
                       if r.x1 <= limit
                       and not (r & box).is_empty
                       and (r & box).get_area() > 0.55 * r.get_area()]
            if not covered:
                continue
            left = max(r.x1 for r in covered) + gap
            if left <= box.x0 or box.x1 - left < 8:
                continue
            field["x"] = round(left, 2)
            field["width"] = round((box.x1 - left) * SCALE, 2)
            fixed += 1
    doc.close()
    return fixed


def size_amounts_to_dollar(pdf_path, fields):
    """Make every amount box exactly as tall as the $ printed beside it.

    Fitting an amount to its shaded row makes the boxes disagree down a column,
    because BC's rows are not all one line: a two-line row gave a 23 pt box next
    to 16 pt neighbours. The $ is the same size all down the column, so sizing to
    it gives one height per page, and it is always shorter than the row so the
    box still sits inside its shading.
    """
    doc = fitz.open(pdf_path)
    changed = 0
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        dollars = [fitz.Rect(w[:4]) for w in page.get_text("words") if w[4].strip() == "$"]
        if not dollars:
            continue
        cells = shaded_boxes(page, max_height=220.0)
        for field in [f for f in fields if f["page"] == page_number and f["type"] in ("TextField", "TextArea")]:
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            cell = next((c for c in cells
                         if c.contains(fitz.Point(box.x0 + 1, (box.y0 + box.y1) / 2))), None)
            # In a tall cell BC prints the $ at the bottom, within a point of the
            # cell below, so the $ must belong to this field's own cell rather
            # than merely overlap its line.
            near = [d for d in dollars
                    if box.x0 - 30 <= d.x1 <= box.x0 + box.width * 0.5
                    and (cell.contains(fitz.Point((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2))
                         if cell else (d.y0 < box.y1 and d.y1 > box.y0))]
            if not near:
                continue
            sign = min(near, key=lambda d: abs(d.x1 - box.x0))
            height = min(sign.height, cell.height) if cell else sign.height
            top = (sign.y0 + sign.y1) / 2 - height / 2
            if cell:
                top = min(max(top, cell.y0), cell.y1 - height)
            field["y"] = round(top, 2)
            field["height"] = round(height * SCALE, 2)
            changed += 1
    doc.close()
    return changed


def expand_ruled_blocks(fields, pdf_path, max_gap=4.0, edge=3.0):
    """Grow a field over the whole ruled block it belongs to.

    BC draws a multi-line writing area as several shaded rows stacked a point or
    two apart, and only one field is placed on it, so snapping to a single row
    left a one-line input in a four-line block. Rows are joined only while they
    share the field's left and right edges and no other field sits on them —
    which is what keeps stacked-but-separate rows (Address, City, Email) apart.
    """
    doc = fitz.open(pdf_path)
    grown = 0
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        rows = sorted(shaded_boxes(page, max_height=220.0), key=lambda r: r.y0)
        page_fields = [f for f in fields if f["page"] == page_number]
        others = [fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE,
                            f["y"] + f["height"] / SCALE) for f in page_fields]
        for index, field in enumerate(page_fields):
            if field["type"] not in ("TextField", "TextArea"):
                continue
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            column = [r for r in rows
                      if abs(r.x0 - box.x0) <= edge and abs(r.x1 - box.x1) <= edge]
            if len(column) < 2:
                continue
            here = next((i for i, r in enumerate(column)
                         if not (r & box).is_empty
                         and (r & box).get_area() > 0.45 * min(r.get_area(), box.get_area())), None)
            if here is None:
                continue

            def free(row):
                return not any(j != index and not (row & other).is_empty
                               and (row & other).get_area() > 0.4 * other.get_area()
                               for j, other in enumerate(others))

            block = fitz.Rect(column[here])
            for step in (-1, 1):
                cursor = here + step
                while 0 <= cursor < len(column):
                    row = column[cursor]
                    gap = (block.y0 - row.y1) if step < 0 else (row.y0 - block.y1)
                    if gap > max_gap or gap < -1 or not free(row):
                        break
                    block |= row
                    cursor += step
            if block.height <= box.height + 1:
                continue
            field["y"] = round(block.y0, 2)
            field["height"] = round(block.height * SCALE, 2)
            others[index] = block
            grown += 1
    doc.close()
    return grown


def printed_shape(page, rect, drawings=None):
    """Circle or square, decided by what the form draws — not by the field type.

    The field type is not a reliable guide: BC Provincial uses radio groups for
    mutually exclusive options but prints them as ❑ squares, so trusting "radio
    means circle" put a circle between two squares. The drawn outline settles it.
    A rounded square is four corner curves plus four straight sides; a circle is
    curves with essentially no straight segments.
    """
    curves = straight = 0
    for drawing in (drawings if drawings is not None else page.get_drawings()):
        box = drawing["rect"]
        if box.width > 26 or box.height > 26 or not box.intersects(rect):
            continue
        for item in drawing["items"]:
            if item[0] == "c":
                curves += 1
            elif item[0] in ("re", "l"):
                straight += 1
    return "circle" if curves and straight <= 2 else "square"


def stamp_shapes(pdf_path, fields):
    """Record circle/square on every checkbox from the printed outline."""
    doc = fitz.open(pdf_path)
    counts = {"circle": 0, "square": 0}
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        drawings = page.get_drawings()
        for field in [f for f in fields if f["page"] == page_number and f["type"] == "CheckBox"]:
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / SCALE,
                            field["y"] + field["height"] / SCALE)
            shape = printed_shape(page, box, drawings)
            field["shape"] = shape
            counts[shape] += 1
    doc.close()
    return counts


def merge_sliver_fields(pdf_path, fields, max_width=22.0, gap=12.0, margin=54.0):
    """Fold XFA's narrow leading cell into the writing area beside it.

    XFA emits a ~14 pt cell to the left of a free-text block — the paragraph
    marker — and hands it back as its own field. On screen that reads as a stray
    little box next to the real one. Where a wide field follows on the same line
    the two become one; where the sliver stands alone it grows to the writing
    area it labels.
    """
    doc = fitz.open(pdf_path)
    merged = grown = 0
    drop = []
    for page_number in sorted({f["page"] for f in fields}):
        page = doc[page_number - 1]
        page_fields = [f for f in fields if f["page"] == page_number and f["type"] != "CheckBox"]
        right_edge = page.rect.width - margin
        for field in page_fields:
            width = field["width"] / SCALE
            if width >= max_width:
                continue
            left, top = field["x"], field["y"]
            height = field["height"] / SCALE
            beside = [g for g in page_fields
                      if g is not field and abs(g["y"] - top) < 4
                      # Tolerance, not zero: the sliver's right edge and the
                      # block's left edge are the same coordinate, and the
                      # subtraction lands a hair below zero.
                      and -0.5 <= g["x"] - (left + width) < gap]
            if beside:
                partner = min(beside, key=lambda g: g["x"])
                field["width"] = round((partner["x"] + partner["width"] / SCALE - left) * SCALE, 2)
                field["height"] = round(max(height, partner["height"] / SCALE) * SCALE, 2)
                field["type"] = "TextArea"
                drop.append(partner)
                merged += 1
                continue
            # Nothing beside it: grow to the writing area, stopping at whatever
            # is printed or fielded to the right.
            blockers = [g["x"] for g in page_fields
                        if g is not field and abs(g["y"] - top) < 4 and g["x"] > left]
            for x0, y0, x1, y1, word, *_ in page.get_text("words"):
                if word.strip() and x0 > left + width and y1 > top + 2 and y0 < top + height - 2:
                    blockers.append(x0)
            limit = min([right_edge] + blockers) - 2
            if limit - left > width + 20:
                field["width"] = round((limit - left) * SCALE, 2)
                field["type"] = "TextArea"
                grown += 1
    for field in drop:
        fields.remove(field)
    doc.close()
    return merged, grown


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

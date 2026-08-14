"""Build the batch-3 templates: child protection (CFCSA) and adoption.

Two paths, chosen by what the source actually is (fetch_bc3 records it):

* **acroform** — the 17 published CFCSA forms. Identical to the batch-1 and
  batch-2 Provincial path: strip the widget layer to leave the government's own
  printed background, convert each widget rectangle to the overlay convention,
  then run the shared placement chain. The widget rect is ground truth
  (placement guide §1) so there is nothing to detect.

* **bclaws** — CFCSA Forms 5 and 10 and the six adoption forms, none of which
  the government publishes as a fillable PDF. Their source is the form as
  enacted, so the blanks have to be read off the printed page (§1, last resort).
  Three anchors carry all eight forms, and each is something the page prints:

  1. a run of printed dots — one box per run;
  2. a ruled line with clear space above it — how CFCSA Forms 5 and 10 write a
     blank, where the adoption schedule uses dots;
  3. an empty ruled cell, for the tables.

  Checkboxes come from the printed mark and nothing else (§2): a Wingdings `❑`
  on the CFCSA forms, a drawn 6 pt square on Form 10, a literal `[ ]` on
  adoption Form 1. No mark, no checkbox.

  **The background ships exactly as the King's Printer set it.** `build_bc_laws`
  (batch 1) redacts each leader and rules a clean line in its place, which reads
  better but cannot be done safely here: the regulation opens a caption inside
  the span that carries the sentence, so redacting `[Court Location]` on CFCSA
  Form 5 took "the person did not attend this Court at" with it — MuPDF drops a
  whole text-showing operation the annotation touches. So the dots stay printed
  and a box is placed on each run, between the captions rather than over them,
  which is how the Ontario templates treat a dotted leader anyway (§9.1).

Run: python3 build_bc3.py [--promote]
Without --promote it writes to _incoming_bc3/out and prints the gate results.
"""
import argparse
import json
import os
import re
import shutil
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
import bc_sources_batch3 as src3  # noqa: E402
import build_bc_laws as laws  # noqa: E402

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_bc3")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

LINE_HEIGHT = 13.0
MIN_FIELD_HEIGHT = 7.0
# How tall a vertical rule has to be before it counts as a table's side. CFCSA
# Form 5 rules each section separator as an 11 pt filled rectangle, whose two short
# ends would otherwise make every separator look like a one-row table and cost the
# section its writing line.
MIN_TABLE_SIDE = 20.0
# A rule this wide spans the page, so it may be closing a section rather than
# offering a line to write on.
FULL_WIDTH_RULE = 300.0
MIN_BLANK_WIDTH = 18.0

# Wingdings 0xA8 is the open box the CFCSA forms print; it arrives as a private-use
# code point, so the standard ❑/☐ set does not see it.
WINGDINGS_BOX = ""
BOX_GLYPHS = bp.BOX_GLYPHS | {WINGDINGS_BOX}

# A drawn tick on these forms is a small square outline. Anything larger is a panel.
MARK_MIN, MARK_MAX = 4.0, 12.0

# A literal "[ ]" tick, as adoption Form 1 prints its two options.
BRACKET_TICK = re.compile(r"\[\s+\]")

# Never a box on one of these (placement guide §5). The regulation captions its
# signature lines in brackets and puts the commissioner's role under the rule, so
# neither shape is caught by the bare "^signature" rule bc_pipeline uses.
# The jurat sets its caption in the right-hand column of a braced block, so the line
# arrives as ") [Signature of person consenting]" — leading punctuation and all.
# Anchoring on "^signature" the way bc_pipeline does never matches it.
SIG_CAPTION = re.compile(
    r"^[\s\[\]()]*(?:signature[^.\]]*|a commissioner for taking affidavits)[\]:]?",
    re.I)
SIG_DATE = re.compile(r"date of signature", re.I)


# ---------------------------------------------------------------- acroform path

def place(background, fields):
    """The shared placement chain — the same calls, in the same order, as batch 2."""
    bp.nudge_off_hint(background, fields)
    bp.snap_checkboxes(background, fields)
    bp.assign_marks(background, fields)
    bp.stamp_shapes(background, fields)
    bp.snap_text_fields(background, fields)
    bp.expand_ruled_blocks(fields, background)
    bp.clear_printed_labels(background, fields)
    bp.merge_sliver_fields(background, fields)
    bp.size_amounts_to_dollar(background, fields)
    separate_shared_marks(background, fields)


def build_acroform(src):
    doc_id = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    background = os.path.join(OUT, "%s.pdf" % doc_id)
    pages = bp.flatten_background(source, background)
    fields, audit = bp.extract(source, doc_id)
    doc = fitz.open(background)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    doc.close()
    bp.clamp_to_page(fields, page_sizes)
    place(background, fields)
    return background, pages, page_sizes, fields, audit


# ------------------------------------------------------------------ bclaws path

def signature_captions(page, blanks):
    """(captions that forbid a box above them, runs that are themselves signatures).

    A signature caption condemns *one* thing, and which one depends on where the
    line's own blank is. "[Signature] .......... [Name (please print)] ........"
    and "Signature of applicant: ................." both put the signature line to
    the caption's right, so the run after the caption is dropped and the line
    above is left alone — that line is Form 4's "Phone number", which §5's
    caption-underneath rule was otherwise deleting. Only a caption with no blank
    of its own — the jurat's ") [Signature of person consenting]" printed under
    the rule it labels — condemns the box above it.
    """
    captions, doomed = [], []
    for text, boxes, spans in line_chars(page):
        match = SIG_CAPTION.search(text)
        if not match or SIG_DATE.search(text):
            continue
        rect = fitz.Rect(boxes[match.start()])
        for box in boxes[match.start():match.end()]:
            rect |= box
        after = sorted((b for b in blanks
                        if abs(b.y0 - rect.y0) < 4 and b.x0 >= rect.x1 - 2),
                       key=lambda r: r.x0)
        if after:
            doomed.append(after[0])
        else:
            captions.append(rect)
    return captions, doomed


def dot_runs(page):
    """One rect per printed run of dots — the regulation's way of writing a blank.

    Runs are deliberately *not* merged across the `[caption]` between them: the
    caption stays printed, so a merged box would put typed text on top of the
    government's own instruction.
    """
    out = []
    for _text, boxes, spans in line_chars(page):
        for start, end in spans:
            rect = fitz.Rect(boxes[start])
            for box in boxes[start:end]:
                rect |= box
            if rect.width >= MIN_BLANK_WIDTH:
                out.append(rect)
    return out


def line_chars(page):
    """Every text line as (text, per-character boxes, dot-run spans)."""
    for text, boxes in laws.line_chars(page):
        yield text, boxes, [m.span() for m in laws.DOT_RUN.finditer(text)]


def printed_ticks(page):
    """Every printed tick on the page: glyph, drawn square, or a literal "[ ]"."""
    marks = []
    for text, boxes, _spans in line_chars(page):
        for index, char in enumerate(text):
            if char in bp.BOX_GLYPHS:
                marks.append(fitz.Rect(boxes[index]))
        for match in BRACKET_TICK.finditer(text):
            rect = fitz.Rect(boxes[match.start()])
            for box in boxes[match.start():match.end()]:
                rect |= box
            marks.append(rect)
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if (MARK_MIN <= rect.width <= MARK_MAX and MARK_MIN <= rect.height <= MARK_MAX
                and abs(rect.width - rect.height) <= 2.5
                and any(item[0] == "re" for item in drawing["items"])):
            marks.append(rect)
    # One mark is one candidate (§2): merge only art drawn over the *same* mark,
    # which means a real overlap and not a shared edge. CFCSA Form 11 stacks its
    # options 10 pt apart with a 10.5 pt square on each, so consecutive squares
    # touch; merging on any intersection turned two of them into one candidate and
    # left an option a lawyer could not tick.
    merged = []
    for rect in sorted(marks, key=lambda r: (round(r.y0, 1), r.x0)):
        if merged:
            shared = merged[-1] & rect
            smaller = min(merged[-1].get_area(), rect.get_area())
            if not shared.is_empty and smaller > 0 and shared.get_area() > 0.5 * smaller:
                merged[-1] |= rect
                continue
        merged.append(fitz.Rect(rect))
    return merged


def separate_shared_marks(background, fields, reach=26.0):
    """Deal a free printed mark to each control that shares one (§2, §7.7).

    `bp.assign_marks` gives up here: it re-reads the candidates through
    `mark_candidates`, which merges two squares that touch, so it finds fewer
    marks than there are controls and declines to move anything. The marks are
    read again with the overlap-based clustering above, only the colliding
    controls are touched, and a mark another control already holds is skipped.
    """
    doc = fitz.open(background)
    moved = 0
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        controls = [f for f in fields if f["page"] == number and f["type"] == "CheckBox"]
        held = {}
        for field in controls:
            held.setdefault((round(field["x"], 1), round(field["y"], 1)), []).append(field)
        ticks = printed_ticks(page)
        for (x, y), sharing in sorted(held.items()):
            if len(sharing) < 2:
                continue
            taken = {spot for spot in held if spot != (x, y)}
            free = [t for t in sorted(ticks, key=lambda r: (round(r.y0, 1), r.x0))
                    if abs(t.y0 - y) <= reach and abs(t.x0 - x) <= reach
                    and (round(t.x0, 1), round(t.y0, 1)) not in taken]
            if len(free) < len(sharing):
                continue
            for field, mark in zip(sorted(sharing, key=lambda f: f["id"]), free):
                field.update(x=round(mark.x0, 2), y=round(mark.y0, 2),
                             width=round(mark.width * bp.SCALE, 2),
                             height=round(mark.height * bp.SCALE, 2))
                moved += 1
    doc.close()
    return moved


def segments(page, thickness=1.5, min_length=8.0):
    """Every straight rule on the page as (horizontals, verticals).

    Read off the path *items*, not the drawing's bounding box: the regulation
    draws a table's frame as one four-sided `re`, whose bbox is the whole table
    and says nothing about where the rules are.
    """
    horizontal, vertical = [], []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                edges = [(item[1], item[2])]
            elif item[0] == "re":
                rect = item[1]
                if rect.height <= thickness:
                    horizontal.append(fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y1))
                    continue
                if rect.width <= thickness:
                    vertical.append(fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y1))
                    continue
                if drawing["type"] == "f":
                    # A *filled* rectangle is a band of ink, not a frame: CFCSA
                    # Form 5 paints each section separator as an 11 pt fill with
                    # the visible hairline drawn separately inside it, so reading
                    # its edges as rules gave the separator three stacked boxes.
                    continue
                corners = [rect.top_left, rect.top_right, rect.bottom_right, rect.bottom_left]
                edges = list(zip(corners, corners[1:] + corners[:1]))
            else:
                continue
            for start, end in edges:
                rect = fitz.Rect(min(start.x, end.x), min(start.y, end.y),
                                 max(start.x, end.x), max(start.y, end.y))
                if rect.height <= thickness and rect.width >= min_length:
                    horizontal.append(rect)
                elif rect.width <= thickness and rect.height >= min_length:
                    vertical.append(rect)
    return horizontal, vertical


def prints_in(page, band, share=0.3):
    """True if the page prints a word inside `band`.

    Measured word by word. `get_text(clip=...)` filters whole *lines* by
    intersection, so it both reports a caption printed below a rule as being
    inside the band above it and misses a word that only partly enters — the
    exact two mistakes this test cannot make.
    """
    for x0, y0, x1, y1, word, *_ in page.get_text("words"):
        rect = fitz.Rect(x0, y0, x1, y1)
        overlap = rect & band
        if word.strip() and not overlap.is_empty and rect.get_area() > 1:
            if overlap.get_area() > share * rect.get_area():
                return True
    return False


def grid_cells(page, min_width=30.0, min_height=6.0, inset=0.75):
    """Empty cells of a ruled table, one per column — not one per row.

    The regulation rules its tables as separate horizontal and vertical lines, so
    there is no drawn rectangle per cell to read. A cell is the space between two
    consecutive horizontal rules and two consecutive verticals that both span it;
    a cell with anything printed in it is a column heading, not a blank (§9.2).
    """
    horizontal, vertical = segments(page)
    rows = sorted({round(r.y0, 1) for r in horizontal})
    cells = []
    for top, bottom in zip(rows, rows[1:]):
        if not min_height <= bottom - top <= 120:
            continue
        # The side rules of a table run past the row they bound. Requiring that
        # keeps a decorative band — CFCSA Form 5 rules its section separators as a
        # 11 pt filled rectangle — from reading as a one-row table.
        spanning = sorted({round(v.x0, 1) for v in vertical
                           if v.y0 <= top + 2 and v.y1 >= bottom - 2
                           and v.y1 - v.y0 >= (bottom - top) * 1.6})
        if len(spanning) < 2:
            continue
        for left, right in zip(spanning, spanning[1:]):
            cell = fitz.Rect(left + inset, top + inset, right - inset, bottom - inset)
            if cell.width < min_width or cell.height < min_height:
                continue
            if prints_in(page, cell):
                continue
            cells.append(cell)
    return cells


def ruled_blanks(page, min_width=40.0, clearance=7.0):
    """Horizontal rules the form draws to be written on.

    A rule counts when nothing is printed in the band just above it — that band is
    the writing space. A rule under printed text is an underline; a rule a vertical
    crosses is a table's row separator and belongs to `grid_cells`, which reads the
    row's *cells* rather than boxing the whole row.
    """
    horizontal, vertical = segments(page)
    out = []
    for rect in horizontal:
        if rect.width < min_width:
            continue
        if any(v.y0 - 2 <= rect.y0 <= v.y1 + 2 and rect.x0 - 2 <= v.x0 <= rect.x1 + 2
               and v.y1 - v.y0 >= MIN_TABLE_SIDE for v in vertical):
            continue
        band = fitz.Rect(rect.x0, rect.y0 - clearance, rect.x1, rect.y0 - 0.5)
        if band.height <= 0 or prints_in(page, band):
            continue
        if rect.width >= FULL_WIDTH_RULE and not answers_a_caption(page, rect):
            continue
        out.append(fitz.Rect(rect.x0, ceiling(page, rect), rect.x1, rect.y0))
    return out


ASKS = re.compile(r"(:|\])\s*$")


def answers_a_caption(page, rule, reach=40.0):
    """Is the space above this full-width rule somebody's answer?

    A rule that runs the width of the page is as likely to close a section as to
    be written on. CFCSA Form 5 uses one for both: under "[Name(s)]" it is the
    writing space, under the court's name it is the heading's underscore. The one
    that asks for something is preceded by a caption that asks — a line ending in
    ':' or a bracketed label such as '[Name(s)]'.
    """
    for x0, y0, x1, y1, word, *_ in page.get_text("words"):
        if rule.y0 - reach <= y1 <= rule.y0 and x1 > rule.x0 and x0 < rule.x1:
            if ASKS.search(word):
                return True
    return False


def ceiling(page, rule, gap=0.5):
    """How high a box on `rule` may reach: one line, or the type above it.

    CFCSA Form 10 sets "after attendance in court at a ____" 10 pt under the option
    above it, so a flat 13 pt box drew a line straight through "a court appearance
    is not required" — a box on its own rule but over its neighbour's words.
    """
    above = [y1 for x0, y0, x1, y1, word, *_ in page.get_text("words")
             if word.strip() and y1 <= rule.y0 + 0.5 and x1 > rule.x0 and x0 < rule.x1]
    limit = max(above) + gap if above else 0.0
    return max(rule.y0 - LINE_HEIGHT, limit)


# A heading whose writing space is the band *underneath* it. CFCSA Form 5 prints
# its two bare and Form 10 draws a panel around each, and in both cases the caption
# is the only thing on the page that says where the answer goes — Form 10's panel
# is one cell with the heading inside it, so the grid reader sees a cell with text
# in it and correctly declines to box it.
HEADER_CAPTIONS = ("court file number", "court location",
                   "registry file number", "registry location")


def header_captions(page, taken, height=13.0, width_factor=1.6, gap=1.0):
    """A field under a bare "Court File Number" / "Court Location" heading."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text.lower().rstrip(":") not in HEADER_CAPTIONS:
                continue
            caption = fitz.Rect(line["bbox"])
            right = min(caption.x0 + caption.width * width_factor, page.rect.width - 96)
            below = [y0 for x0, y0, x1, y1, word, *_ in page.get_text("words")
                     if word.strip() and y0 > caption.y1 + gap and x1 > caption.x0
                     and x0 < right]
            bottom = min([caption.y1 + gap + height] + [y - 1 for y in below])
            box = fitz.Rect(caption.x0, caption.y1 + gap, right, bottom)
            if (box.height < MIN_FIELD_HEIGHT or prints_in(page, box)
                    or any(box.intersects(o) for o in taken)):
                continue
            out.append(box)
    return out


def caption_bands(page, taken, min_height=25.0, margin=6.0):
    """A caption ending in ':' with an empty band under it is an answer space (§6).

    Used only where the form leaves the answer to a narrative item unruled — CFCSA
    Form 10's "THIS COURT ORDERS:" and Form 5's "under the following terms (if
    any):". The band closes at whatever prints next, and a band a field already
    covers is skipped, so the pass is re-runnable.
    """
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append((fitz.Rect(line["bbox"]), text))
    lines.sort(key=lambda item: item[0].y0)
    horizontal, _vertical = segments(page)

    out = []
    for index, (rect, text) in enumerate(lines):
        if not text.endswith(":"):
            continue
        below = [other.y0 for other, _ in lines[index + 1:] if other.y0 > rect.y1 + 1]
        below += [rule.y0 for rule in horizontal if rule.y0 > rect.y1 + 1]
        bottom = min(below) if below else page.rect.height - 54
        band = fitz.Rect(rect.x0, rect.y1 + margin, page.rect.width - 96, bottom - margin)
        if band.height < min_height or band.width < 100:
            continue
        if any(band.intersects(other) for other in taken):
            continue
        out.append(band)
    return out


def dedupe(rects, tolerance=2.0):
    """Drop a rect that repeats one already kept, and one swallowed by a bigger one."""
    kept = []
    for rect in sorted(rects, key=lambda r: -r.get_area()):
        if any(other.contains(rect) or
               (abs(other.x0 - rect.x0) < tolerance and abs(other.y0 - rect.y0) < tolerance
                and abs(other.x1 - rect.x1) < tolerance and abs(other.y1 - rect.y1) < tolerance)
               for other in kept):
            continue
        kept.append(rect)
    return kept


def build_bclaws(src):
    """Read the blanks off the enacted page. The page itself is not touched."""
    doc_id = src["docId"]
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    background = os.path.join(OUT, "%s.pdf" % doc_id)
    shutil.copy(source, background)

    doc = fitz.open(background)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    fields, skipped, index = [], [], 0
    for number, page in enumerate(doc, start=1):
        ticks = printed_ticks(page)
        blanks = dot_runs(page)
        captions, doomed = signature_captions(page, blanks)
        skipped += [{"page": number, "y": round(r.y0, 1), "why": "signature leader"}
                    for r in doomed]

        boxes = [(r, "CheckBox") for r in ticks]
        # A writing area never sits on a tick, and a tick is never a blank.
        for rect in dedupe([r for r in blanks if r not in doomed] + ruled_blanks(page)):
            if not any(t.intersects(rect) for t in ticks):
                boxes.append((rect, "TextField"))
        for rect in grid_cells(page):
            if not any(other.intersects(rect) for other, _ in boxes):
                boxes.append((rect, "TextArea"))
        for rect in header_captions(page, [other for other, _ in boxes]):
            boxes.append((rect, "TextField"))
        for rect in caption_bands(page, [other for other, _ in boxes]):
            boxes.append((rect, "TextArea"))

        for rect, kind in boxes:
            if rect.width < MIN_BLANK_WIDTH and kind != "CheckBox":
                continue
            if kind != "CheckBox" and bp.is_signature_box(rect, "", captions):
                skipped.append({"page": number, "y": round(rect.y0, 1), "why": "signature"})
                continue
            # The rect's own height, never a nominal one: a box grown to a flat
            # LINE_HEIGHT runs past the rule it sits on and covers the caption
            # printed under it ("(signature)" on CFCSA Form 10).
            height = max(rect.height, MIN_FIELD_HEIGHT)
            index += 1
            fields.append({
                "id": bp.new_id(doc_id, index), "type": kind,
                "x": round(rect.x0, 2), "y": round(rect.y0 - (0 if kind == "CheckBox" else 1), 2),
                "width": round(rect.width * bp.SCALE, 2),
                "height": round(height * bp.SCALE, 2),
                "value": "", "fontSize": 9, "color": [0, 0, 0],
                "background": "none", "border": "none", "page": number,
            })
            if kind == "CheckBox":
                fields[-1]["shape"] = "square"
    pages = doc.page_count
    doc.close()

    bp.clamp_to_page(fields, page_sizes)
    audit = {"docId": doc_id, "fields": len(fields),
             "checkboxes": sum(1 for f in fields if f["type"] == "CheckBox"),
             "signaturesSkipped": len(skipped), "signatureDetail": skipped,
             "pageSizes": page_sizes}
    return background, pages, page_sizes, fields, audit


# ----------------------------------------------------------------------- driver

def check_overlap(background, fields):
    """Gate F, with the regulation's dotted leaders exempted.

    `bp.check_overlap` flags a box covering a printed word. On these forms the
    writing line *is* a printed word — a run of dots — so every correct box on an
    adoption form reports as a defect. A word made only of dots is the blank the
    box belongs on (§9.1), the same exemption bc_pipeline already makes for a
    checkbox landing on its printed square.
    """
    return [flag for flag in bp.check_overlap(background, fields)
            if set(flag["word"].strip()) != {"."}]


def footer_text(src, manifest_entry):
    if src["family"] == "CFCSA" and src.get("pfaCode"):
        return manifest_entry.get("footerText") or src["pfaCode"]
    if src["kind"] == "bclaws":
        return "B.C. Reg. %s" % src["reg"].replace("_", "/")
    return manifest_entry.get("footerText") or None


def row_for(src, pages, manifest_entry):
    prefix = "BC PC CFCSA" if src["family"] == "CFCSA" else "BC Adoption"
    return {
        "title": "Form %s - %s" % (src["formNo"], src["name"]),
        "shortTitle": "%s Form %s" % (prefix, src["formNo"]),
        "footerText": footer_text(src, manifest_entry),
        "status": "active",
        "fileName": "%s.pdf" % src["docId"],
        "docId": src["docId"],
        "province": "BC",
        "category": src["category"],
        "version": 1,
        "pageCount": pages,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--promote", action="store_true")
    parser.add_argument("--only", default=None, help="comma-separated docIds")
    args = parser.parse_args()

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    manifest = {m["docId"]: m for m in json.load(open(os.path.join(STAGE, "manifest.json")))}
    wanted = set(args.only.split(",")) if args.only else None

    rows, audits, failures = [], [], []
    for src in src3.all_sources():
        if wanted and src["docId"] not in wanted:
            continue
        builder = build_acroform if src["kind"] == "acroform" else build_bclaws
        background, pages, page_sizes, fields, audit = builder(src)

        geometry = bp.check_geometry(fields, page_sizes)
        overlaps = check_overlap(background, fields)
        bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % src["docId"]))
        bp.write_mapping(os.path.join(OUT, "%s.json" % src["docId"]), fields)

        audit.update(docId=src["docId"], kind=src["kind"], pages=pages,
                     fields=len(fields),
                     checkboxes=sum(1 for f in fields if f["type"] == "CheckBox"),
                     geometryProblems=geometry, overlapFlags=len(overlaps),
                     overlapDetail=overlaps[:20])
        audits.append(audit)
        if geometry:
            failures.append((src["docId"], "geometry", geometry[:3]))
        rows.append(row_for(src, pages, manifest[src["docId"]]))
        print("%-20s %-8s pages=%-3d fields=%-4d cb=%-4d sig-skipped=%-3d geom=%-2d overlap=%d"
              % (src["docId"], src["kind"], pages, audit["fields"], audit["checkboxes"],
                 audit.get("signaturesSkipped", 0), len(geometry), len(overlaps)))

    with open(os.path.join(OUT, "bc3_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "bc3_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    print("\ngeometry failures: %s" % (failures or "none"))
    print("total fields: %d across %d forms" % (sum(a["fields"] for a in audits), len(audits)))
    if args.promote and not failures:
        for row in rows:
            for extension in ("pdf", "json"):
                shutil.copy(os.path.join(OUT, "%s.%s" % (row["docId"], extension)),
                            os.path.join(EXPORT, "%s.%s" % (row["docId"], extension)))
        print("promoted %d templates into form-template-export/" % len(rows))


if __name__ == "__main__":
    main()

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
import collections
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

def nudge_off_hint(background, fields, min_remaining=14.0):
    """`bp.nudge_off_hint`, but a caption to the left is not a hint.

    A hint is printed *inside* the writing area, so only a word starting at or
    after the box's left edge counts. A word starting to the left of it is the
    cell's own caption, which the box merely clips — CFCSA Form 2's parent panel
    prints "Name" at the far left of its first line, and treating that as a hint
    dropped the whole box onto the panel's second line and left the first blank.
    `clear_printed_labels` deals with a caption: move right, not down.
    """
    doc = fitz.open(background)
    nudged = 0
    for number in sorted({f["page"] for f in fields}):
        words = doc[number - 1].get_text("words")
        for field in [f for f in fields if f["page"] == number]:
            height = field["height"] / bp.SCALE
            if height < min_remaining * 2:
                continue
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / bp.SCALE, field["y"] + height)
            band = fitz.Rect(box.x0, box.y0, box.x1, box.y0 + min_remaining)
            bottoms = [y1 for x0, y0, x1, y1, word, *_ in words
                       if word.strip() and not set(word.strip()) <= bp.BOX_GLYPHS
                       and x0 >= box.x0 - 0.5
                       and not (band & fitz.Rect(x0, y0, x1, y1)).is_empty]
            if not bottoms:
                continue
            top = max(bottoms) + 1.0
            if top <= field["y"] or box.y1 - top < min_remaining:
                continue
            field["height"] = round((box.y1 - top) * bp.SCALE, 2)
            field["y"] = round(top, 2)
            nudged += 1
    doc.close()
    return nudged


def clear_printed_labels(background, fields, gap=1.5, zone=0.6):
    """`bp.clear_printed_labels`, widened to the two edges it was missing.

    The shared rule moves a field's left edge past a caption **mostly covered** by
    the box. BC's CFCSA forms set their captions hard against the cell and the
    government's widget starts a point or two inside the last letter, so only
    15-20% of the word is covered and the rule read it as clear — the field prints
    over the tail of "Name", "Postal Code", "Phone", "Email Address". Two shapes
    are added, both judged by where the word *starts* rather than by how much of
    it is covered:

    * a caption the left edge cuts through (it starts left of the box);
    * the next cell's caption, printed just past the right edge — BC lays
      "Province | Postal Code | Phone | Fax" across one ruled row and each widget
      runs on under the caption of the cell after it.
    """
    doc = fitz.open(background)
    fixed = 0
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        words = [fitz.Rect(w[:4]) for w in page.get_text("words") if w[4].strip()]
        for field in [f for f in fields if f["page"] == number
                      and f["type"] in ("TextField", "TextArea")]:
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / bp.SCALE,
                            field["y"] + field["height"] / bp.SCALE)
            limit = box.x0 + box.width * zone
            # On the *line*, not merely touching it. A box seated on its own rule
            # ends a fraction of a point inside the line above — CFCSA Form 2's
            # "This application is filed by:" heading overhangs the Name box below
            # it by 0.6 pt — and reading that as a caption in the box shoved the
            # field 47 pt to the right, into the middle of its own cell.
            on_line = [r for r in words if min(r.y1, box.y1) - max(r.y0, box.y0)
                       > 0.4 * r.height]
            covered = [r for r in on_line if r.x1 <= limit
                       and ((r & box).get_area() > 0.55 * r.get_area()
                            or r.x0 < box.x0 - 0.5 < r.x1)]
            trailing = [r for r in on_line
                        if r.x1 > box.x1 + 0.5 and box.x1 > r.x0 >= limit]
            left = max([r.x1 + gap for r in covered] + [box.x0])
            right = min([r.x0 - gap for r in trailing] + [box.x1])
            if right - left < 8 or (left == box.x0 and right == box.x1):
                continue
            field["x"] = round(left, 2)
            field["width"] = round((right - left) * bp.SCALE, 2)
            fixed += 1
    doc.close()
    return fixed


def place(background, fields):
    """The batch-2 chain, with batch 3's own versions of two of its steps."""
    nudge_off_hint(background, fields)
    bp.snap_checkboxes(background, fields)
    bp.assign_marks(background, fields)
    bp.stamp_shapes(background, fields)
    bp.snap_text_fields(background, fields)
    bp.expand_ruled_blocks(fields, background)
    clear_printed_labels(background, fields)
    bp.merge_sliver_fields(background, fields)
    bp.size_amounts_to_dollar(background, fields)
    separate_shared_marks(background, fields)
    seat_on_rules(background, fields)
    harmonise_rows(fields)
    harmonise_columns(background, fields)
    clamp_to_frames(background, fields)


# A cell taller than this is a writing *area*, not one of the small ruled lines,
# and it is left to `expand_ruled_blocks`.
SINGLE_LINE_MAX = 20.0
# How far above its rule the box's bottom edge sits, and how far below the rule
# above it the top edge starts.
SEAT = 0.5
HEAD = 1.0


def row_rules(page, min_width=25.0):
    """Every horizontal rule on the page, as (y, x0, x1).

    Read off the path items rather than the drawing bboxes, and including the
    hairline `re` BC uses for a rule, so a row's own line is found whether the
    form drew it as a stroke or as a filled sliver.
    """
    out = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l" and abs(item[1].y - item[2].y) < 0.6:
                x0, x1 = sorted((item[1].x, item[2].x))
                if x1 - x0 >= min_width:
                    out.append((round(item[1].y, 2), x0, x1))
            elif item[0] == "re" and item[1].height <= 1.5 and item[1].width >= min_width:
                out.append((round(item[1].y0, 2), item[1].x0, item[1].x1))
    return sorted(set(out))


def seat_on_rules(background, fields, reach=6.0, lift=8.0):
    """Sit every small ruled cell on its own rule, sized to its own row.

    BC's widget rectangles disagree about how tall a one-line cell is: 825 of them
    across these forms come in fourteen heights between 11.2 and 16.5 pt, so a
    single ruled row prints boxes of three different sizes that do not line up.
    Each is re-cut from the two rules that bound it — bottom seated on the rule it
    is written on, top just under the rule above — which keeps a row internally
    consistent without inventing a batch-wide number that no page actually uses.

    A cell is only touched when both rules are there and they span it. Anything
    taller than a single line, and anything not sitting on a rule, is left alone —
    which includes the last row of a panel, written on the panel's own border. A
    border was tried as a rule here and rejected: it re-cut boxes elsewhere onto
    printed type, taking `box-on-text` from 17 to 30 across the batch.

    `lift` is how far a widget may hang *below* the rule it is written on and
    still be recognised as that row's cell. An oversized widget does hang: the
    third date-of-birth cell of CFCSA Form 3's child table is 16.5 pt tall in a
    10.5 pt row and its bottom clears the table's last rule by 4.04 pt, which the
    original 4.0 missed by four hundredths of a point and left as the one box on
    the page at the wrong size. The rule chosen this way is still required to lie
    in the box's lower half, so a cell is never re-seated on the rule above it.
    """
    doc = fitz.open(background)
    seated = 0
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        rules = row_rules(page)
        for field in [f for f in fields if f["page"] == number
                      and f["type"] in ("TextField", "TextArea")]:
            box = fitz.Rect(field["x"], field["y"],
                            field["x"] + field["width"] / bp.SCALE,
                            field["y"] + field["height"] / bp.SCALE)
            if box.height > SINGLE_LINE_MAX:
                continue
            # "Spans this cell" means covers most of it, not all of it: BC's
            # widgets on Form 1 run about 5 pt past the right end of the table's
            # own rules, which a containment test reads as "no rule here" and
            # leaves the cell at whatever height the widget happened to have.
            spanning = [(y, x0, x1) for y, x0, x1 in rules
                        if min(x1, box.x1) - max(x0, box.x0) >= 0.85 * box.width]
            below = [y for y, _x0, _x1 in spanning
                     if -lift <= y - box.y1 <= reach and y > (box.y0 + box.y1) / 2]
            if not below:
                continue
            rule = min(below, key=lambda y: abs(y - box.y1))
            above = [y for y, _x0, _x1 in spanning if y < rule - 4]
            if not above:
                continue
            top = max(above) + HEAD
            bottom = rule - SEAT
            if bottom - top < MIN_FIELD_HEIGHT or bottom - top > SINGLE_LINE_MAX:
                continue
            if abs(top - box.y0) < 0.05 and abs(bottom - box.y1) < 0.05:
                continue
            field["y"] = round(top, 2)
            field["height"] = round((bottom - top) * bp.SCALE, 2)
            # And stop at the table's own edge when the widget ran past it.
            edge = max(x1 for y, _x0, x1 in spanning if y == rule)
            if 0 < box.x1 - edge <= 8:
                field["width"] = round((edge - box.x0) * bp.SCALE, 2)
            seated += 1
    doc.close()
    return seated


def harmonise_rows(fields, tolerance=1.5):
    """Give every cell on one ruled row the same top and height.

    `seat_on_rules` works a cell at a time and skips any it cannot find both rules
    for, which leaves a row with one box a different size from its neighbours —
    the exact thing the row seating exists to prevent. Cells are grouped by the
    line they sit on and made to match the one the most of them already agree on.
    """
    rows = {}
    for field in fields:
        if field["type"] == "CheckBox" or field["height"] / bp.SCALE > SINGLE_LINE_MAX:
            continue
        key = (field["page"], round((field["y"] + field["height"] / bp.SCALE) / tolerance))
        rows.setdefault(key, []).append(field)
    changed = 0
    for group in rows.values():
        if len(group) < 2:
            continue
        shapes = collections.Counter((f["y"], f["height"]) for f in group)
        # Most cells win; where none does, the taller shape wins, because a box
        # too tall for its row is untidy and a box too short crops what is typed.
        top, height = max(shapes, key=lambda shape: (shapes[shape], shape[1]))
        for field in group:
            if (field["y"], field["height"]) == (top, height):
                continue
            field["y"], field["height"] = top, height
            changed += 1
    return changed


def harmonise_columns(background, fields, tolerance=2.5, gap=1.2):
    """Give every cell in one table column the same left edge and width.

    `harmonise_rows` squares a row up; nothing squares a column. A stacked table —
    CFCSA Form 3's three child rows, Name and Date of Birth — gets each of its
    cells from a separate widget rectangle, and BC's disagree slightly: the three
    Name cells start at 98.86, 98.56 and 97.95. Every one is right on its own row
    and the column still steps down the page. Cells are clustered by left edge and
    width, both within `tolerance`, and the cluster is squared on the shape most
    of them already have.

    Two bounds keep it from being a licence to move boxes around. A cell only ever
    moves within `tolerance`, so this cannot rescue a box that is in the wrong
    place — that is the row and rule passes' job. And a cell is left where it is
    rather than brought closer than `gap` to a caption printed to its left, the
    same bound `align_boxes_to_rules` puts on the batch-2 templates: a column is
    worth less than a legible caption.

    Checkboxes are left alone. They are seated on the printed ❑, and the mark, not
    the column, is what a checkbox has to agree with.
    """
    doc = fitz.open(background)
    changed = 0
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        words = [fitz.Rect(w[:4]) for w in page.get_text("words") if w[4].strip()]
        cells = [f for f in fields if f["page"] == number and f["type"] != "CheckBox"]
        for column in cluster_columns(cells, tolerance):
            shapes = collections.Counter((f["x"], f["width"]) for f in column)
            # Most cells win, as on a row; where none does, the shape furthest
            # right, which is the one that cannot push the column onto a caption.
            x, width = max(shapes, key=lambda shape: (shapes[shape], shape[0]))
            for field in column:
                if (field["x"], field["width"]) == (x, width):
                    continue
                if (abs(x - field["x"]) > tolerance
                        or abs(width - field["width"]) / bp.SCALE > tolerance):
                    continue
                ink = ink_left_of(words, field)
                if x < field["x"] and ink is not None and x < ink + gap:
                    continue
                field["x"], field["width"] = x, width
                changed += 1
    doc.close()
    return changed


def cluster_columns(cells, tolerance):
    """The groups of two or more cells that share a left edge and a width.

    Single-linkage on both edges at once, so a column survives its cells drifting
    a little from top to bottom, and a cell on the same left edge but a different
    width — a full-width line above a two-column table — starts a column of its
    own rather than dragging the table's cells out to its length.
    """
    columns = []
    for cell in sorted(cells, key=lambda f: (f["x"], f["width"])):
        for column in columns:
            if (abs(cell["x"] - column[-1]["x"]) <= tolerance
                    and abs(cell["width"] - column[-1]["width"]) / bp.SCALE <= tolerance):
                column.append(cell)
                break
        else:
            columns.append([cell])
    return [c for c in columns if len({f["y"] for f in c}) > 1]


def ink_left_of(words, field):
    """Right edge of the nearest printed word to the left, on the cell's own line."""
    box = fitz.Rect(field["x"], field["y"],
                    field["x"] + field["width"] / bp.SCALE,
                    field["y"] + field["height"] / bp.SCALE)
    left = [w for w in words
            if w.x1 <= box.x0 + 0.5 and min(box.y1, w.y1) - max(box.y0, w.y0) > 2.0]
    return max((w.x1 for w in left), default=None)


def clamp_to_frames(background, fields, overrun=24.0, inset=1.0):
    """Pull a field back inside the panel the form draws around it.

    The widget rectangle is ground truth for *where* a field goes (§1), but it is
    not always inside the box the page prints: CFCSA Form 2 p5's "Details of the
    order requested" widget runs 7.5 pt below the panel that encloses it. Acrobat
    clips a field to itself and never shows the overhang; our overlay draws the
    stored rectangle, so it hangs out of the printed frame.

    Only a genuine overhang is clamped — the frame has to enclose the field's
    centre and the field may only be reaching past one edge, by less than
    `overrun`. A field that spans a frame edge by more than that is crossing the
    frame on purpose and is left alone.
    """
    doc = fitz.open(background)
    clamped = 0
    for number in sorted({f["page"] for f in fields}):
        page = doc[number - 1]
        frames = [d["rect"] for d in page.get_drawings()
                  if d["type"] == "s" and d["rect"].width > 100 and d["rect"].height > 20
                  and any(item[0] == "re" for item in d["items"])]
        for field in [f for f in fields if f["page"] == number]:
            rect = fitz.Rect(field["x"], field["y"],
                             field["x"] + field["width"] / bp.SCALE,
                             field["y"] + field["height"] / bp.SCALE)
            centre = fitz.Point((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2)
            holding = [f for f in frames if f.contains(centre)]
            if not holding:
                continue
            frame = min(holding, key=lambda f: f.get_area())
            top = max(rect.y0, frame.y0 + inset) if 0 < frame.y0 - rect.y0 < overrun else rect.y0
            bottom = (min(rect.y1, frame.y1 - inset)
                      if 0 < rect.y1 - frame.y1 < overrun else rect.y1)
            if bottom - top < 8 or (top == rect.y0 and bottom == rect.y1):
                continue
            field["y"] = round(top, 2)
            field["height"] = round((bottom - top) * bp.SCALE, 2)
            clamped += 1
    doc.close()
    return clamped


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

    # The consolidation forms are built from the printed anchors, so their boxes
    # already sit on their rules; they still get the row pass, because a table row
    # read cell by cell can come out a fraction of a point out of line.
    harmonise_rows(fields)
    harmonise_columns(background, fields)
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

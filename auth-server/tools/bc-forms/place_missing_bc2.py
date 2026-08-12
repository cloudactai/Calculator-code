"""Give a box to the batch-2 blanks that came out of the build with none.

§9.6: "not every missing field is on a page you were told about." Two shapes of it in
this batch, both found by `verify_bc2.py` and both confirmed on renders:

* **A printed `______` rule with no field on it.** BCSC_F101 and BCSC_F37 are published
  with a `blank_page` variant — the same court document as their `data_entry_page`
  variant, but typeset for handwriting, so its blanks are printed underscore rules
  rather than XFA fields. That variant is the right one to ship (its conditional
  paragraphs each appear once, where the data-entry variant prints both branches of
  items 7 and 13 on top of each other), which leaves its rules needing boxes.
  A few more turn up singly: BCPC_23's witness row, SUP916/PFA916's postal-code cell.

* **A narrative item whose answer space is bare paper.** §9.5's shape — the page prints
  an instruction ending in a colon and simply leaves the sheet.

Guards, each of which exists because the naive version was wrong on a real page:

* **Skip paragraph-number slots.** F37 prints an 18 pt `___` slot at the left margin
  beside items 11-15. §8's F38 precedent says those are `[#]` paragraph-number slots in
  a static `<draw>`, not blanks, and a box on one is a box on decoration. Width alone
  separates them: they are 18 pt against a real blank's 29 pt minimum.

  An earlier version also required a run to start right of the page's "body margin",
  taken as the modal left edge of the printed lines. That excluded three genuine blanks
  on F101 p4 and p5, because on a page whose text is mostly the right-hand columns of a
  table the modal left edge is 337 pt or 480 pt, not the margin. Width is the test that
  actually holds.
* **Seat on the rule, not near it** (§9.1): the new box's bottom sits `SEAT_GAP` above
  the printed run, and its height is the standard single line.
* **Copy a twin** (§9.6's last paragraph): `fontSize`, `color`, `page` and the rest come
  from a field the same form already has, so a new box matches the page around it.
* **Add only.** This tool changes the field *set*, so it is deliberately separate from
  `trim_label_overlap.py`, which asserts the set never changes (§7.8).
* **Re-runnable** (§7.9): a blank that already has a box is left alone, so a second run
  is a no-op.

Run: python3 place_missing_bc2.py [--apply] [--only DOCID[,DOCID...]]
"""
import argparse
import collections
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
import bc_sources_batch2 as src2  # noqa: E402
import verify_bc2 as V  # noqa: E402
from trim_label_overlap import GAP, MIN_HEIGHT, MIN_WIDTH, ink_columns  # noqa: E402

OUT = V.OUT
STAGE = os.path.dirname(OUT)
SC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "xfa", "sc_out2")
STD_LINE = 13.3     # the approved single-line box height
SEAT_GAP = 1.26     # measured on the approved forms: box bottom sits this far above its rule
MIN_RUN = 24.0      # narrower than this is a paragraph-number slot, not a blank
AREA_PAD = 2.0


# A page with more printed text than this is prose — a guidance page, not a form page.
# `cell_targets` is the only target type restricted by it, and this is the signal that
# actually separates the two cases, after two blunter ones failed:
#
#   * "the government gave this page no field" is true of BCPC_6 p3 (a guidance page,
#     wrongly boxed) *and* of F37 p9 and F101 p3 (real form pages that needed boxes).
#     Structurally the three are identical, so that test cannot tell them apart.
#   * an empty ruled rectangle is weak evidence on its own — BCPC_6 p3's was a cell of
#     the *instructions* table, "Schedules or forms for specific family law matters".
#
# Text density does separate them cleanly, by roughly an order of magnitude: the
# instruction pages in this batch run 2,000-5,600 characters (BCPC_6 p3 is 4,361) and
# the sparse form pages run 53-924 (F37 p9 is 533).
#
# The underscore-rule and answer-area targets are deliberately *not* restricted: a
# printed `______`, or an instruction ending in a colon, is strong evidence on any page.
PROSE_CHARS = 1500


# Answer spaces that measure like a narrative item but are not one, with the reason.
# Kept explicit rather than generalised: each is a judgement about what the page means,
# which is the kind of call §7.11 says a render has to settle one at a time.
SKIP_AREAS = {
    # "A. Personal Information:" is a section heading; the section's answer is the
    # Claimant 1 / Claimant 2 table that opens page 2, so page 1's trailing space is a
    # page break, not an unanswered item.
    ("BCSC_F1", 1, "Personal Information:"),
}


def twin(fields, page_number, kind):
    """A field to copy the non-geometry keys from — same page for preference."""
    same = [f for f in fields if f["page"] == page_number and f["type"] == kind]
    anywhere = [f for f in fields if f["type"] == kind]
    pool = same or anywhere or fields
    return pool[0] if pool else None


def make(template, doc_id, index, kind, rect, page_number):
    field = dict(template) if template else {}
    field.update({
        "id": int("%d%03d" % (int(str(abs(hash(doc_id))) [:10]), index)) if not template else None,
        "type": kind,
        "x": round(rect.x0, 2),
        "y": round(rect.y0, 2),
        "width": round(rect.width * V.SCALE, 2),
        "height": round(rect.height * V.SCALE, 2),
        "value": "",
        "page": page_number,
    })
    field.pop("bind", None)
    field.pop("shape", None)
    return field


def next_ids(fields, count):
    """Continue the form's own id sequence — §9.6 notes a gap in it is itself a hint."""
    base = max(int(f["id"]) for f in fields)
    return [base + 1 + offset for offset in range(count)]


def underscore_targets(page, boxes):
    """Printed `______` rules that have no field and are not number-gutter slots."""
    out = []
    for run in V.underscore_runs(page):
        if run.width < MIN_RUN:
            continue
        probe = fitz.Rect(run.x0, run.y0 - STD_LINE, run.x1, run.y1 + 1.0)
        if any(not (probe & existing).is_empty
               and (probe & existing).get_area() > 0.2 * min(probe.get_area(),
                                                             existing.get_area())
               for existing in boxes):
            continue
        out.append(fitz.Rect(run.x0, run.y1 - SEAT_GAP - STD_LINE, run.x1, run.y1 - SEAT_GAP))
    return out


def grid_cells(page, min_width=28.0, min_height=10.0,
               max_width=480.0, max_height=220.0):
    """A table's cells: the cell-sized rectangles the form draws, plus any grid its
    rules imply.

    Reading the rules *first* was wrong. F37 p9 draws every cell as its own `re` and no
    lines at all, so rebuilding a grid from edges only succeeded where the edges of the
    per-cell rectangles happened to line up into a full grid — column 1 of each table
    got boxes and columns 2 and 3 got none. A rectangle of cell size **is** a cell;
    nothing has to be inferred. The line-derived grid stays as the fallback for forms
    that genuinely draw a table as lines.

    A rectangle that contains another candidate is a frame or a section band, not a
    cell (this page's 467x599 outer frame and its 467x43 heading bands), so it is
    dropped rather than boxed.
    """
    drawn = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] != "re":
                continue
            rect = +item[1]
            if (min_width <= rect.width <= max_width
                    and min_height <= rect.height <= max_height):
                drawn.append(rect)
    cells = []
    for rect in drawn:
        inner = [o for o in drawn
                 if o is not rect and rect.contains(o) and o.get_area() < 0.9 * rect.get_area()]
        if not inner:
            cells.append(rect)

    horizontals, verticals = [], []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                start, end = item[1], item[2]
                if abs(start.y - end.y) < 0.7 and abs(start.x - end.x) > min_width:
                    horizontals.append((start.y, min(start.x, end.x), max(start.x, end.x)))
                elif abs(start.x - end.x) < 0.7 and abs(start.y - end.y) > min_height:
                    verticals.append((start.x, min(start.y, end.y), max(start.y, end.y)))
            elif item[0] == "re":
                rect = item[1]
                if rect.width > min_width and rect.height < 1.5:
                    horizontals.append((rect.y0, rect.x0, rect.x1))
                elif rect.height > min_height and rect.width < 1.5:
                    verticals.append((rect.x0, rect.y0, rect.y1))
                elif rect.width > min_width and rect.height > min_height:
                    horizontals += [(rect.y0, rect.x0, rect.x1), (rect.y1, rect.x0, rect.x1)]
                    verticals += [(rect.x0, rect.y0, rect.y1), (rect.x1, rect.y0, rect.y1)]

    def spanned_h(y, left, right):
        return any(abs(y - yy) < 1.2 and a - 1 <= left and b + 1 >= right
                   for yy, a, b in horizontals)

    def spanned_v(x, top, bottom):
        return any(abs(x - xx) < 1.2 and a - 1 <= top and b + 1 >= bottom
                   for xx, a, b in verticals)

    ys = sorted({round(y, 1) for y, _a, _b in horizontals})
    for row in range(len(ys) - 1):
        top, bottom = ys[row], ys[row + 1]
        if bottom - top < min_height:
            continue
        # Columns are derived **per row band**, from only the verticals that actually
        # span that band. Taking every x on the page splits a row at rules belonging to
        # other tables: on F37 p9, table 2's verticals at x 360 and x 504.5 cut table 1's
        # second and third columns short, and the span test then correctly rejected the
        # truncated candidates — so those columns got no box at all.
        xs = sorted({round(x, 1) for x, a, b in verticals
                     if a - 1 <= top and b + 1 >= bottom})
        for col in range(len(xs) - 1):
            left, right = xs[col], xs[col + 1]
            if right - left < min_width:
                continue
            if not (spanned_h(top, left, right) and spanned_h(bottom, left, right)
                    and spanned_v(left, top, bottom) and spanned_v(right, top, bottom)):
                continue
            candidate = fitz.Rect(left, top, right, bottom)
            if any(abs(candidate.x0 - c.x0) < 2 and abs(candidate.y0 - c.y0) < 2
                   and abs(candidate.x1 - c.x1) < 2 and abs(candidate.y1 - c.y1) < 2
                   for c in cells):
                continue
            cells.append(candidate)
    return cells


# A cell holding only these is still an empty cell: they are the form's own furniture,
# not a label. `$` gets special handling below — §7.5 says the amount field goes beside
# its `$`, so the box is inset past the glyph rather than skipped or laid over it.
CELL_FURNITURE = set("$.,:;()-–— \t\xa0")


def cell_targets(page, boxes):
    """Empty table cells with no field in them.

    F101 and F37 are the handwriting-typeset variant of their document (see the module
    docstring), so their tables are drawn for a pen: ruled cells with no XFA field
    behind them.

    A cell is only a target if it is **empty** — a cell holding printed text is a column
    heading or a row label, and §9.3's rule is that a box never goes on one. But a cell
    whose only content is a printed `$` *is* empty: F37 p9's whole Monthly Amount column
    is that, and skipping it as "has printed content" left the column unfillable. Such a
    cell gets a box inset past the `$`'s ink, never over it.
    """
    out = []
    for cell in grid_cells(page):
        text = page.get_text(clip=cell).strip()
        if text and not set(text) <= CELL_FURNITURE:
            continue
        if any((cell & existing).get_area()
               > 0.25 * min(cell.get_area(), existing.get_area()) for existing in boxes):
            continue
        # Inset so the box sits inside the cell's rules rather than on them.
        left = cell.x0 + 1.5
        if text:
            # Measure the `$`'s ink *inside* the cell's borders. Measuring the whole
            # cell rect reads its own drawn border as ink, so the right-hand extent came
            # back as the cell's right edge and the inset collapsed the box to zero
            # width — F37 p9's entire Monthly Amount column was dropped as "too small".
            inner = fitz.Rect(cell.x0 + 2.0, cell.y0 + 2.0, cell.x1 - 2.0, cell.y1 - 2.0)
            ink = ink_columns(page, inner)
            if ink is not None:
                left = max(left, ink[1] + GAP)
        target = fitz.Rect(left, cell.y0 + 1.5, cell.x1 - 1.5, cell.y1 - 1.5)
        if target.width < MIN_WIDTH or target.height < MIN_HEIGHT:
            continue
        out.append(target)
    return out


def area_targets(page, boxes, doc_id, page_number):
    """Bare answer space under an instruction that ends in a colon (§9.5)."""
    lines = sorted(V.printed_lines(page), key=lambda item: item[0].y0)
    floor = page.rect.height - 60.0
    out = []
    for index, (rect, text) in enumerate(lines):
        if not text.rstrip().endswith(":"):
            continue
        if (doc_id, page_number, text.strip()[-40:]) in SKIP_AREAS or any(
                doc_id == d and page_number == p and text.strip().endswith(t)
                for d, p, t in SKIP_AREAS):
            continue
        if any(existing.x0 >= rect.x1 - 2 and existing.y1 > rect.y0 and existing.y0 < rect.y1
               for existing in boxes):
            continue
        below = [other for other, _t in lines[index + 1:] if other.y0 > rect.y1 + 2]
        bottom = min([other.y0 for other in below] + [floor])
        if bottom - rect.y1 < 40.0:
            continue
        space = fitz.Rect(rect.x0, rect.y1 + AREA_PAD,
                          page.rect.width - 60.0, bottom - AREA_PAD)
        if any(not (space & existing).is_empty for existing in boxes):
            continue
        out.append(space)
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--only")
    args = parser.parse_args()

    doc_ids = [s["docId"] for s in src2.all_sources()]
    if args.only:
        want = set(args.only.split(","))
        doc_ids = [d for d in doc_ids if d in want]

    added_total = 0
    for doc_id in doc_ids:
        path = os.path.join(OUT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        fields = mapping["staticFields"]
        pdf = fitz.open(os.path.join(OUT, "%s.pdf" % doc_id))
        by_page = collections.defaultdict(list)
        for field in fields:
            by_page[field["page"]].append(V.box(field))

        pending = []
        for page_number in range(1, pdf.page_count + 1):
            page = pdf[page_number - 1]
            boxes = by_page.get(page_number, [])
            # §5, and §7.6 as the gate that catches it: a printed rule under a signature
            # caption is not a blank to be filled. The first run of this tool put a box
            # on four of them (S-51 p3, BCPC_23 p1, PFA876 p1, PFA893 p1) because an
            # underscore rule looks identical to any other. The build's own signature
            # test is the one to reuse, so both passes agree on what a signature is.
            captions = bp.signature_captions(page)
            for rect in underscore_targets(page, boxes):
                if bp.is_signature_box(rect, None, captions):
                    print("%-14s p%-3d skip signature rule at %.1f,%.1f"
                          % (doc_id, page_number, rect.x0, rect.y0))
                    continue
                pending.append((page_number, "TextField", rect))
            for rect in area_targets(page, boxes, doc_id, page_number):
                pending.append((page_number, "TextArea", rect))
            # Cells last: an answer area or a rule blank is the stronger anchor, and
            # placing those first means a cell already covered by one is skipped.
            if len(page.get_text().strip()) < PROSE_CHARS:
                covered = list(boxes) + [r for _p, _k, r in pending if _p == page_number]
                for rect in cell_targets(page, covered):
                    if bp.is_signature_box(rect, None, captions):
                        continue
                    # The cell's own height decides the control: a cell two lines or
                    # more deep is a writing block (§9.5), a shallow one holds a value.
                    # This belongs here, where the cell geometry is in hand, rather than
                    # in `normalise_types_bc2` — a height rule applied blindly afterwards
                    # also caught the government's *own* tall one-line fields, turning
                    # BCPC_12 p10's "Date on which the parties began to live together"
                    # into a TextArea because its caption wraps to two lines, and doing
                    # the same to F71's day-counts and F62.1's "Date:".
                    kind = "TextArea" if rect.height >= 27.0 else "TextField"
                    pending.append((page_number, kind, rect))
        pdf.close()

        if not pending:
            continue
        ids = next_ids(fields, len(pending))
        for new_id, (page_number, kind, rect) in zip(ids, pending):
            template = twin(fields, page_number, kind)
            field = {
                "id": new_id,
                "type": kind,
                "x": round(rect.x0, 2),
                "y": round(rect.y0, 2),
                "width": round(rect.width * V.SCALE, 2),
                "height": round(rect.height * V.SCALE, 2),
                "value": "",
                "fontSize": (template or {}).get("fontSize", 9),
                "color": (template or {}).get("color", [0, 0, 0]),
                "background": (template or {}).get("background", "none"),
                "border": (template or {}).get("border", "none"),
                "page": page_number,
            }
            fields.append(field)
            print("%-14s p%-3d + %-9s %5.1f,%5.1f %5.1fx%4.1f"
                  % (doc_id, page_number, kind, rect.x0, rect.y0, rect.width, rect.height))
        added_total += len(pending)
        if args.apply:
            fields.sort(key=lambda f: (f["page"], round(f["y"], 1), round(f["x"], 1)))
            with open(path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")

    print("\n%d field(s) added%s" % (added_total, "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()

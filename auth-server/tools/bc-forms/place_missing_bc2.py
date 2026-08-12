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

OUT = V.OUT
STD_LINE = 13.3     # the approved single-line box height
SEAT_GAP = 1.26     # measured on the approved forms: box bottom sits this far above its rule
MIN_RUN = 24.0      # narrower than this is a paragraph-number slot, not a blank
AREA_PAD = 2.0


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


def grid_cells(page, min_width=28.0, min_height=10.0):
    """Rectangles fully enclosed by drawn rules — a table's cells.

    Built from the rules rather than from `get_drawings()` rectangles because these
    forms draw a table as separate lines as often as as a rect. A candidate counts only
    if all four of its sides are actually spanned by a rule, so the "cells" of a page
    that merely has a rule above and below some text are not invented.
    """
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
    xs = sorted({round(x, 1) for x, _a, _b in verticals})
    cells = []
    for row in range(len(ys) - 1):
        for col in range(len(xs) - 1):
            top, bottom, left, right = ys[row], ys[row + 1], xs[col], xs[col + 1]
            if bottom - top < min_height or right - left < min_width:
                continue
            if (spanned_h(top, left, right) and spanned_h(bottom, left, right)
                    and spanned_v(left, top, bottom) and spanned_v(right, top, bottom)):
                cells.append(fitz.Rect(left, top, right, bottom))
    return cells


def cell_targets(page, boxes):
    """Empty table cells with no field in them.

    F101 and F37 are the handwriting-typeset variant of their document (see the module
    docstring), so their tables are drawn for a pen: ruled cells with no XFA field
    behind them. 63 and 58 of them respectively, out of 156 across the batch.

    A cell is only a target if it is **empty** — a cell holding printed text is a column
    heading or a row label, and §9.3's rule is that a box never goes on one.
    """
    out = []
    for cell in grid_cells(page):
        if page.get_text(clip=cell).strip():
            continue
        if any((cell & existing).get_area()
               > 0.25 * min(cell.get_area(), existing.get_area()) for existing in boxes):
            continue
        # Inset so the box sits inside the cell's rules rather than on them.
        out.append(fitz.Rect(cell.x0 + 1.5, cell.y0 + 1.5, cell.x1 - 1.5, cell.y1 - 1.5))
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
            covered = list(boxes) + [r for _p, _k, r in pending if _p == page_number]
            for rect in cell_targets(page, covered):
                if bp.is_signature_box(rect, None, captions):
                    continue
                pending.append((page_number, "TextField", rect))
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

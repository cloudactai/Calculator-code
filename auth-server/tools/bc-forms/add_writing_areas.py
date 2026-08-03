"""Give the order and response forms the writing areas XFA never emitted.

Guide §6: some XFA sections are populated only by Adobe's generate-on-preview
scripting, so the pages we can flatten come back with the heading printed and no
field behind it. That is not a misplaced box, it is an absent one, and no
detector can find it — the page has to be read and the area placed by hand.

Three shapes of it:

* F32 Part 1 (p1) and Parts 4, 5 and 6 (p2) print their heading, their bracketed
  instruction, and then the note "[if more space is required - attach page...]"
  with nothing between. The note is the anchor: the writing area is the gap
  directly above it, closed at the top by the last line of the instruction.
* F51 and F52 print "THIS COURT ORDERS that" near the foot of p1 and then a
  wholly empty p2 to continue on. The body runs from under that heading to the
  footer, and the continuation page carries the same column.
* F3 and F5 — the claim and the counterclaim, the same page either side — print
  "for the following reasons:" and leave the space under it empty. The box runs
  down to whatever prints next, which is the rule closing the section.

Re-runnable: a band already covered by a box is left alone, so this does not
double up on the areas it has already added.

Every edge here is read off the page — the anchor lines at run time, the column
from the boxes the form already has — so nothing is estimated. The one judgement
is that a continuation page opens at the same margin it is indented to, which is
the form's own left margin.

Run: python3 add_writing_areas.py [--write]
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
QA = os.path.join(EXPORT, "_incoming_bc", "qa")
MORE_SPACE = "if more space is required"
FOOTER = 700.0
PAD = 4.0

# doc_id -> (pages carrying a "[if more space]" gap, order-body spec or None,
#            captions whose answer space was never emitted)
# The order-body spec is (heading, page of the heading, continuation page).
PLAN = {
    "BCSC_F32": ([1, 2], None, []),
    "BCSC_F51": ([], ("THIS COURT ORDERS that", 1, 2), []),
    "BCSC_F52": ([], ("THIS COURT ORDERS that", 1, 2), []),
    # F3 and F5 are the claim and the counterclaim, the same page either side.
    "BCSC_F3": ([], None, [(3, "for the following reasons:")]),
    "BCSC_F5": ([], None, [(2, "for the following reasons:")]),
    # The same order body as F51 and F52, missed there because this one's
    # heading carries a colon.
    "BCSC_F51_1": ([], None, [(1, "THIS COURT ORDERS that:")]),
}


def lines(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                out.append((fitz.Rect(line["bbox"]), text))
    return sorted(out, key=lambda item: item[0].y0)


def note_column(fields, indent):
    """The column F32's existing Part bodies use, matched by their own indent.

    Parts 2 and 3 already carry a box, and Parts 1, 4, 5 and 6 are the same kind
    of field on the same form, so the column is copied from them rather than
    guessed from the margins.
    """
    siblings = [f for f in fields
                if abs(f["x"] - indent) < 1.0 and f["width"] / bp.SCALE > 300]
    return max((f["width"] / bp.SCALE for f in siblings), default=None)


def order_column(fields, page_number, left):
    """How wide the order body runs: out to the widest box already on that page."""
    on_page = [f for f in fields if f["page"] == page_number]
    return max((f["x"] + f["width"] / bp.SCALE for f in on_page), default=None)


def answer_space(page, caption):
    """The empty band under a caption: down to the next thing printed below it.

    "for the following reasons:" and "THIS COURT ORDERS that:" are answered in
    the space beneath them, and on these forms that space came back empty. The
    floor is whatever prints next — the next line of type, or the rule that ends
    the section — so the box stops where the form does.
    """
    anchor = next((r for r, t in lines(page) if t.startswith(caption)), None)
    if anchor is None:
        return None
    floor = min([r.y0 for r, _ in lines(page) if r.y0 > anchor.y1 + 1 and r.y0 < FOOTER]
                + [d["rect"].y0 for d in page.get_drawings()
                   if d["rect"].width > 200 and d["rect"].height < 3
                   and anchor.y1 + 1 < d["rect"].y0 < FOOTER]
                + [FOOTER])
    return anchor.x0, anchor.y1 + PAD, floor - PAD


def already_there(fields, page_number, x, y, width, height):
    """True if a box already covers this band — keeps a re-run from doubling up."""
    band = fitz.Rect(x, y, x + width, y + height)
    for field in fields:
        if field["page"] != page_number:
            continue
        box = fitz.Rect(field["x"], field["y"],
                        field["x"] + field["width"] / bp.SCALE,
                        field["y"] + field["height"] / bp.SCALE)
        if (band & box).get_area() > 0.5 * band.get_area():
            return True
    return False


def gaps_above_notes(page):
    """(indent, top, bottom) of each empty band directly above a '[if more space]' note."""
    found = []
    page_lines = lines(page)
    for index, (rect, text) in enumerate(page_lines):
        if MORE_SPACE not in text:
            continue
        above = [r for r, _ in page_lines[:index] if r.y1 <= rect.y0]
        if not above:
            continue
        closest = max(above, key=lambda r: r.y1)
        if rect.y0 - closest.y1 > 12:
            found.append((closest.x0, closest.y1 + PAD, rect.y0 - PAD))
    return found


def main():
    write = "--write" in sys.argv
    added_total = 0
    for doc_id, (note_pages, order, captions) in PLAN.items():
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        background = os.path.join(EXPORT, "%s.pdf" % doc_id)
        fields = json.load(open(path))["staticFields"]
        base = bp.new_id(doc_id, 0)
        next_index = max(f["id"] for f in fields) - base + 1
        doc = fitz.open(background)
        new = []

        for page_number in note_pages:
            for indent, top, bottom in gaps_above_notes(doc[page_number - 1]):
                width = note_column(fields, indent)
                if width is None:
                    raise SystemExit("%s p%d: no Part body to take a column from"
                                     % (doc_id, page_number))
                new.append((page_number, indent, top, width, bottom - top))

        if order:
            heading, heading_page, carry_on = order
            anchor = next((r for r, t in lines(doc[heading_page - 1])
                           if t.startswith(heading)), None)
            if anchor is None:
                raise SystemExit("%s: heading %r not found" % (doc_id, heading))
            right = order_column(fields, heading_page, anchor.x0)
            width = right - anchor.x0
            new.append((heading_page, anchor.x0, anchor.y1 + PAD, width,
                        FOOTER - anchor.y1 - PAD))
            # The continuation page opens at the margin the heading is set to.
            new.append((carry_on, anchor.x0, anchor.x0, width, FOOTER - anchor.x0))

        for page_number, caption in captions:
            space = answer_space(doc[page_number - 1], caption)
            if space is None:
                raise SystemExit("%s p%d: caption %r not found" % (doc_id, page_number, caption))
            left, top, bottom = space
            right = order_column(fields, page_number, left)
            new.append((page_number, left, top, right - left, bottom - top))

        new = [item for item in new
               if not already_there(fields, item[0], item[1], item[2], item[3], item[4])]
        for page_number, x, y, w, h in new:
            next_index += 1
            fields.append({
                "id": base + next_index,
                "type": "TextArea",
                "x": round(x, 2),
                "y": round(y, 2),
                "width": round(w * bp.SCALE, 2),
                "height": round(h * bp.SCALE, 2),
                "value": "",
                "fontSize": 9,
                "color": [0, 0, 0],
                "background": "none",
                "border": "none",
                "page": page_number,
            })
            print("   %-10s p%-2d writing area x=%.2f y=%.2f %.2fx%.2f"
                  % (doc_id, page_number, x, y, w, h))
        added_total += len(new)

        if write and new:
            fields.sort(key=lambda f: (f["page"], f["id"]))
            bp.write_mapping(path, fields)
            os.makedirs(QA, exist_ok=True)
            bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
        doc.close()

    print("\n%d writing areas added%s" % (added_total, "" if write else " (dry run, pass --write)"))


if __name__ == "__main__":
    main()

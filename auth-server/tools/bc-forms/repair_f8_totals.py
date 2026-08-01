"""Give F8's calculated totals a box a lawyer can type in.

Form F8's income tables carry rows that Adobe computes — "child support guidelines
income for basic child support", the special-expenses and spousal-support totals,
and the line-11 figure each of those sections repeats. XFA's default for those is
zero, and the flatten printed it, so the shipped background carries a literal "$0"
on pages 4, 5 and 10. overlay_fields then does the right thing with what it is
given and declines to put a box over a printed default, which leaves the totals
permanently zero and untypeable — the single most consequential field on a
financial statement.

Zero is a stale default here, not the government's wording, so the digit is
redacted and the row gets the same box every other amount row in its column
already has — same left edge, same width, same height — sitting on the `$`'s own
line. The `$` itself is left printed, as on the rows that were already fillable.

Run: python3 repair_f8_totals.py [--write]
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
DOC_ID = "BCSC_F8"
QA = os.path.join(EXPORT, "_incoming_bc", "qa")


def zero_rows(page):
    """(dollar rect, zero-digit rect) for every printed '$0' on the page."""
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                text = "".join(char["c"] for char in span["chars"]).strip()
                if text not in ("$0", "$0.00"):
                    continue
                chars = [c for c in span["chars"] if c["c"].strip()]
                dollar = fitz.Rect(chars[0]["bbox"])
                digits = None
                for char in chars[1:]:
                    rect = fitz.Rect(char["bbox"])
                    digits = rect if digits is None else (digits | rect)
                if digits is not None:
                    out.append((dollar, digits))
    return out


def column(fields, page_number, dollar, reach=6.0):
    """The left edge, width and height every other amount box in this column uses.

    Taken from the page rather than assumed: F8's columns differ page to page, and
    a total must line up with the rows it totals rather than with its own `$` —
    page 10 prints the `$` of a computed row half a point left of the `$` on the
    rows above it, so keying off the glyph alone would step the column.
    """
    siblings = [f for f in fields
                if f["page"] == page_number and 0 <= f["x"] - dollar.x1 < reach]
    if not siblings:
        return None
    left = min(f["x"] for f in siblings)
    width = max(f["width"] for f in siblings)
    height = max(f["height"] for f in siblings)
    return left, width, height


def main():
    write = "--write" in sys.argv
    path = os.path.join(EXPORT, "%s.json" % DOC_ID)
    background = os.path.join(EXPORT, "%s.pdf" % DOC_ID)
    fields = json.load(open(path))["staticFields"]
    base = bp.new_id(DOC_ID, 0)
    next_index = max(f["id"] for f in fields) - base + 1

    doc = fitz.open(background)
    added, skipped = [], []
    for page_number, page in enumerate(doc, start=1):
        for dollar, digits in zero_rows(page):
            size = column(fields, page_number, dollar)
            if size is None:
                skipped.append((page_number, round(dollar.x1, 2), round(dollar.y0, 2)))
                continue
            page.add_redact_annot(digits)
            left, width, height = size
            fields.append({
                "id": base + next_index,
                "type": "TextField",
                "x": round(left, 2),
                "y": round(dollar.y0, 2),
                "width": width,
                "height": height,
                "value": "",
                "fontSize": 9,
                "color": [0, 0, 0],
                "background": "none",
                "border": "none",
                "page": page_number,
                "shape": None,
            })
            fields[-1].pop("shape")
            next_index += 1
            added.append((page_number, round(left, 2), round(dollar.y0, 2)))
        if page.annots(types=[fitz.PDF_ANNOT_REDACT]):
            # Text only: the cell's rules and the grey fill are the form, not the default.
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                                  graphics=fitz.PDF_REDACT_LINE_ART_NONE)

    for page_number, x, y in added:
        print("   p%-3d box added at x=%.2f y=%.2f" % (page_number, x, y))
    print("%d totals freed, %d skipped %s" % (len(added), len(skipped), skipped or ""))

    if write:
        doc.save(background, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
        doc.close()
        fields.sort(key=lambda f: (f["page"], f["id"]))
        bp.write_mapping(path, fields)
        os.makedirs(QA, exist_ok=True)
        bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % DOC_ID))
        leftover = fitz.open(background)
        remaining = sum(len(zero_rows(p)) for p in leftover)
        leftover.close()
        print("printed '$0' remaining in background: %d" % remaining)
    else:
        doc.close()
        print("(dry run, pass --write)")


if __name__ == "__main__":
    main()

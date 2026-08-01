"""Reopen the collapsed "at ____," line in F38's second jurat.

F38 carries the jurat twice — the plain affidavit ends on page 5, and the
video-conference variant of the same affidavit ends on pages 7-8. The two blocks
are identical in the template and lay out identically on page 7, but on page 8
the flatten collapsed the place line: the writing slot came out 6.19 pt wide
instead of 176.31, and the comma that closes the line was set right up against
"at" to match.

The overlay was faithful to that — it is the printed page that is wrong — so the
repair moves the printed comma back to the column it occupies on page 7 and gives
the field the width its twin has. Everything else in the block already agrees
with page 7 and is left alone.

Run: python3 repair_f38_jurat.py [--write]
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
DOC_ID = "BCSC_F38"
QA = os.path.join(EXPORT, "_incoming_bc", "qa")
GOOD_PAGE, BAD_PAGE = 7, 8


def place_line(page):
    """The 'at' caption, the comma that closes it, and the comma's type size."""
    at = comma = None
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                text = span["text"].strip()
                if text == "at" and at is None:
                    at = span
                elif text == "," and at is not None and comma is None \
                        and abs(span["bbox"][1] - at["bbox"][1]) < 6:
                    comma = span
        if at is not None and comma is not None:
            break
    return at, comma


def main():
    write = "--write" in sys.argv
    path = os.path.join(EXPORT, "%s.json" % DOC_ID)
    background = os.path.join(EXPORT, "%s.pdf" % DOC_ID)
    fields = json.load(open(path))["staticFields"]

    doc = fitz.open(background)
    good_at, good_comma = place_line(doc[GOOD_PAGE - 1])
    bad_at, bad_comma = place_line(doc[BAD_PAGE - 1])
    if not all((good_at, good_comma, bad_at, bad_comma)):
        raise SystemExit("could not read the place line on both pages")

    # The comma's offset from "at" is what page 7 establishes; page 8 keeps its
    # own baseline, so only the horizontal position is taken across.
    target_x = good_comma["bbox"][0] - good_at["bbox"][0] + bad_at["bbox"][0]
    print("p%d comma x %.2f -> %.2f (p%d has it %.2f past 'at')"
          % (BAD_PAGE, bad_comma["bbox"][0], target_x, GOOD_PAGE,
             good_comma["bbox"][0] - good_at["bbox"][0]))

    good = [f for f in fields if f["page"] == GOOD_PAGE
            and abs(f["y"] - (good_at["bbox"][1] + 0.0)) < 12 and f["width"] / bp.SCALE > 20]
    if not good:
        raise SystemExit("no place field found on page %d" % GOOD_PAGE)
    width = max(f["width"] for f in good)

    target = None
    for f in fields:
        if f["page"] != BAD_PAGE:
            continue
        if abs(f["y"] - bad_comma["bbox"][1]) < 12 and f["width"] / bp.SCALE < 20:
            target = f
    if target is None:
        raise SystemExit("no collapsed place field found on page %d" % BAD_PAGE)
    print("p%d field width %.2f -> %.2f" % (BAD_PAGE, target["width"] / bp.SCALE, width / bp.SCALE))

    if not write:
        doc.close()
        print("(dry run, pass --write)")
        return

    page = doc[BAD_PAGE - 1]
    rect = fitz.Rect(bad_comma["bbox"])
    page.add_redact_annot(rect)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    # The page's own face is a Type 3 font the flatten built and cannot be set
    # with; at this size a comma is a comma, so a base font carries it.
    page.insert_text(fitz.Point(target_x, bad_comma["origin"][1]), ",",
                     fontname="helv", fontsize=bad_comma["size"], color=(0, 0, 0))
    target["width"] = width
    doc.save(background, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
    doc.close()
    bp.write_mapping(path, fields)
    os.makedirs(QA, exist_ok=True)
    check = fitz.open(background)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % DOC_ID))
    _, moved = place_line(check[BAD_PAGE - 1])
    print("comma now at x=%.2f" % moved["bbox"][0])
    check.close()


if __name__ == "__main__":
    main()

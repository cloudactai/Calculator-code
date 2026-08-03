"""Put F38's three jurats back on the same footing.

F38 carries the jurat three times — the plain affidavit ends on page 5, and the
video-conference variant of the same affidavit ends on pages 7-8. They are one
block in the template, so the two faults here are both places the flatten broke
step with itself, and each is measured against the copies that came out right.

* Page 8's place line collapsed: the writing slot came out 6.19 pt wide where
  page 7 has 176.31, with the comma that closes the line set hard against "at"
  to match. The overlay was faithful to that — the printed page is what is wrong
  — so the comma moves back to page 7's column and the field takes its width.
* Page 5 is a field short. Pages 7 and 8 have five each; page 5 has four, and the
  one missing is the date on the "on ____" line, where the rule is printed and
  there is nothing to type on.

Both halves are skipped if they have already been applied, so this is safe to
re-run.

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
DATE_PAGE = 5


def missing_date_field(page, fields):
    """The date box on the jurat's "on ____" line, where XFA emitted none.

    F38 carries the jurat three times. Pages 7 and 8 have five fields each; page 5
    has four, and the one it is short of is the date — the rule is printed under
    "on" and there is nothing to type on.

    Every edge comes off page 5 itself: left and width from that printed rule,
    offset by the same hair this page's own four boxes are offset from their
    rules, at their height and their distance below the rule.
    """
    on = next((fitz.Rect(line["bbox"])
               for block in page.get_text("dict")["blocks"]
               for line in block.get("lines", [])
               if "".join(s["text"] for s in line["spans"]).strip() == "on"), None)
    if on is None:
        raise SystemExit("page %d: no 'on' caption in the jurat" % DATE_PAGE)

    rules = [d["rect"] for d in page.get_drawings()
             if d["rect"].height < 3 and 40 < d["rect"].width < 400
             and on.y0 < d["rect"].y0 < on.y1 + 14 and d["rect"].x0 > on.x1]
    if not rules:
        raise SystemExit("page %d: no printed rule on the 'on' line" % DATE_PAGE)
    rule = min(rules, key=lambda r: r.y0)

    here = [f for f in fields if f["page"] == DATE_PAGE]
    if any(abs(f["y"] + f["height"] / bp.SCALE - rule.y0) < 14
           and f["x"] < rule.x1 and f["x"] + f["width"] / bp.SCALE > rule.x0 for f in here):
        print("p%d date field already present" % DATE_PAGE)
        return None

    # How this page seats a box on a printed rule, measured from its own four.
    fit = []
    for field in here:
        bottom = field["y"] + field["height"] / bp.SCALE
        for drawing in page.get_drawings():
            r = drawing["rect"]
            if r.height < 3 and 40 < r.width < 400 and abs(bottom - r.y0) < 4 \
                    and abs(field["x"] - r.x0) < 3:
                fit.append((field["x"] - r.x0, field["width"] / bp.SCALE - r.width,
                            bottom - r.y0, field["height"]))
    if not fit:
        raise SystemExit("page %d: no box/rule pair to take the fit from" % DATE_PAGE)
    dx = sum(f[0] for f in fit) / len(fit)
    dw = sum(f[1] for f in fit) / len(fit)
    drop = sum(f[2] for f in fit) / len(fit)
    height = max(f[3] for f in fit)
    print("p%d fit from its own %d boxes: dx %+.2f dw %+.2f bottom %+.2f below rule, h %.2f"
          % (DATE_PAGE, len(fit), dx, dw, drop, height / bp.SCALE))

    return {
        "id": max(f["id"] for f in fields) + 1,
        "type": "TextField",
        "x": round(rule.x0 + dx, 2),
        "y": round(rule.y0 + drop - height / bp.SCALE, 2),
        "width": round((rule.width + dw) * bp.SCALE, 2),
        "height": round(height, 2),
        "value": "",
        "fontSize": 9,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": DATE_PAGE,
    }


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
        print("p%d place line already reopened" % BAD_PAGE)
    else:
        print("p%d field width %.2f -> %.2f"
              % (BAD_PAGE, target["width"] / bp.SCALE, width / bp.SCALE))

    date_box = missing_date_field(doc[DATE_PAGE - 1], fields)

    if not write:
        doc.close()
        print("(dry run, pass --write)")
        return

    if target is not None:
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
    if date_box:
        fields.append(date_box)
        fields.sort(key=lambda f: (f["page"], f["id"]))
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

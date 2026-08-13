"""Restore the five missing proposed-order choices in BCSC Form F37 section 6.

The source XFA builds this section dynamically.  The flattened browser copy retained
only "The proposed order" and dropped all five choices (and their controls).  This is a
form-specific repair: replace that incomplete band on page 2 and add one checkbox plus
one details field for each published choice.

Run: python3 repair_f37_section6.py [--write]
"""

import argparse
import json
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[2] / "form-template-export"
PDF_PATH = ROOT / "BCSC_F37.pdf"
JSON_PATH = ROOT / "BCSC_F37.json"

PAGE_NUMBER = 2
BAND = fitz.Rect(68, 612, 580, 710)
HEADER_Y = 625
ROW_TOPS = (633, 647, 661, 675, 689)
LABELS = (
    "Amount accords with the Child Support Guidelines",
    "Different amount by consent",
    "Different amount because of special provisions",
    "Amount follows the section 4(c) income agreement",
    "No child support; describe the other arrangements",
)
CHECK_IDS = tuple(1750748996301 + i * 2 for i in range(5))
DETAIL_IDS = tuple(1750748996302 + i * 2 for i in range(5))


def field(field_id, kind, x, y, width, height):
    return {
        "id": field_id,
        "type": kind,
        "x": x,
        "y": y,
        # Mapping dimensions are screen dimensions at the form's 1.5 render scale.
        "width": width * 1.5,
        "height": height * 1.5,
        "value": "",
        "fontSize": 8,
        "color": [0, 0, 0],
        "background": "none",
        "border": "none",
        "page": PAGE_NUMBER,
    }


def repair_pdf(write):
    doc = fitz.open(PDF_PATH)
    page = doc[PAGE_NUMBER - 1]
    already = bool(page.search_for("Different amount because of special provisions"))
    if already:
        doc.close()
        return False

    page.add_redact_annot(BAND, fill=(1, 1, 1))
    page.apply_redactions()
    page.insert_text((75, HEADER_Y), "6.", fontsize=9, fontname="helv", color=(0, 0, 0))
    page.insert_text(
        (97, HEADER_Y),
        "Select one proposed-order provision, then complete its details:",
        fontsize=8.5,
        fontname="helv",
        color=(0, 0, 0),
    )

    shape = page.new_shape()
    for top, label in zip(ROW_TOPS, LABELS):
        shape.draw_rect(fitz.Rect(98, top + 1, 106, top + 9))
        shape.draw_line(fitz.Point(359, top + 11), fitz.Point(573, top + 11))
        page.insert_text(
            fitz.Point(112, top + 9),
            label,
            fontsize=7.2,
            fontname="helv",
            color=(0, 0, 0),
        )
    shape.finish(color=(0, 0, 0), width=0.65)
    shape.commit()

    if write:
        tmp = PDF_PATH.with_suffix(".tmp.pdf")
        doc.save(tmp, garbage=4, deflate=True)
        doc.close()
        tmp.replace(PDF_PATH)
    else:
        doc.close()
    return True


def repair_json(write):
    mapping = json.loads(JSON_PATH.read_text())
    fields = mapping["staticFields"]
    wanted = set(CHECK_IDS + DETAIL_IDS)
    existing = {int(item["id"]) for item in fields if str(item.get("id", "")).isdigit()}
    missing = wanted - existing
    if not missing:
        return False

    additions = []
    for top, check_id, detail_id in zip(ROW_TOPS, CHECK_IDS, DETAIL_IDS):
        if check_id in missing:
            additions.append(field(check_id, "CheckBox", 97, top, 10, 10))
        if detail_id in missing:
            additions.append(field(detail_id, "TextField", 359, top - 1, 214, 12))
    fields.extend(additions)
    if write:
        JSON_PATH.write_text(json.dumps(mapping, indent=1) + "\n")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    pdf_changed = repair_pdf(args.write)
    json_changed = repair_json(args.write)
    state = "repaired" if pdf_changed or json_changed else "already repaired"
    suffix = "" if args.write else " (dry run)"
    print("BCSC_F37 section 6: %s%s" % (state, suffix))


if __name__ == "__main__":
    main()

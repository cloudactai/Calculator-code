"""Build the 12 BC Supreme forms whose file front-loads an Adobe wizard.

These carry the same court document several times: a data-entry section, a filled
"printed_page" variant, an "instructional_sheet" variant, and a blank one. Only
the blank variant is the form a lawyer files. XFA names the subform, so
xfa/blank_pages.mjs reads the split off the template and this keeps just those
pages — and just the government field boxes that sit on them.

Run: python3 build_bc_wizard.py [--promote]
"""
import json
import os
import shutil
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
from build_bc_supreme import CATEGORY_ORDER, footer_text, overlay_fields  # noqa: E402

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
STAGE = os.path.join(EXPORT, "_incoming_bc")
SC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "xfa", "sc_out")
BLANKMAPS = os.path.join(STAGE, "blankmaps")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

FORMS = [
    ("BCSC_F1_1", "F1.1", "Application for divorce (Civil Marriage Act)", "Supreme Court – Divorce"),
    ("BCSC_F1_2", "F1.2", "Certificate of divorce (Civil Marriage Act)", "Supreme Court – Divorce"),
    ("BCSC_F3", "F3", "Notice of family claim", "Supreme Court – Applications"),
    ("BCSC_F4", "F4", "Response to family claim", "Supreme Court – Applications"),
    ("BCSC_F5", "F5", "Counterclaim", "Supreme Court – Applications"),
    ("BCSC_F6", "F6", "Response to counterclaim", "Supreme Court – Applications"),
    ("BCSC_F31", "F31", "Notice of application", "Supreme Court – Applications"),
    ("BCSC_F38", "F38", "Affidavit - desk order divorce", "Supreme Court – Divorce"),
    ("BCSC_F45", "F45", "Trial brief", "Supreme Court – Trial"),
    ("BCSC_F51", "F51", "Order made after application", "Supreme Court – Orders"),
    ("BCSC_F51_1", "F51.1", "Order made at judicial case conference", "Supreme Court – Orders"),
    ("BCSC_F52", "F52", "Final order", "Supreme Court – Orders"),
]


def collisions(page):
    """Printed lines drawn on top of each other.

    pdf.js positions a flowed subform without running Adobe's layout engine, so a
    few conditional paragraphs can land on the same band. Those pages are not
    filable and must be caught rather than shipped.
    """
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append((fitz.Rect(line["bbox"]), text))
    hits = []
    for index, (rect, text) in enumerate(lines):
        for other, other_text in lines[index + 1:]:
            overlap = rect & other
            if overlap.is_empty:
                continue
            if overlap.get_area() > 0.35 * min(rect.get_area(), other.get_area()):
                hits.append((text[:40], other_text[:40]))
    return hits


def build(doc_id, form_no, name, category):
    blank = json.load(open(os.path.join(BLANKMAPS, "%s.json" % doc_id)))["blank"]
    if not blank:
        raise SystemExit("%s: no blank printed pages found" % doc_id)

    background = os.path.join(OUT, "%s.pdf" % doc_id)
    doc = fitz.open(os.path.join(SC, "%s.pdf" % doc_id))
    doc.select([p - 1 for p in blank])
    doc.save(background, garbage=4, deflate=True, clean=True)
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    pages = doc.page_count
    overlapping = {index + 1: collisions(page) for index, page in enumerate(doc)}
    overlapping = {k: v for k, v in overlapping.items() if v}
    doc.close()

    # Keep only the field boxes that sit on the blank pages, renumbered to match.
    renumber = {old: new for new, old in enumerate(blank, start=1)}
    raw = [dict(f, page=renumber[f["page"]])
           for f in json.load(open(os.path.join(SC, "%s.fields.json" % doc_id)))
           if f["page"] in renumber]

    fields, skipped, baked = overlay_fields(doc_id, raw, page_sizes, background)
    bp.clamp_to_page(fields, page_sizes)
    bp.nudge_off_hint(background, fields)
    snapped, missed = bp.snap_checkboxes(background, fields)
    bp.snap_text_fields(background, fields)
    problems = bp.check_geometry(fields, page_sizes)
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)

    audit = {"docId": doc_id, "pages": pages, "sourcePages": blank, "fields": len(fields),
             "checkboxes": sum(1 for f in fields if f["type"] == "CheckBox"),
             "signaturesSkipped": len(skipped), "printedDefaults": len(baked),
             "geometryProblems": problems, "overlapFlags": len(overlaps),
             "collisionPages": {str(k): v for k, v in overlapping.items()}}
    row = {"title": "Form %s - %s" % (form_no, name), "shortTitle": "BC SC Form %s" % form_no,
           "footerText": footer_text(background), "status": "active",
           "fileName": "%s.pdf" % doc_id, "docId": doc_id, "province": "BC",
           "category": category, "version": 1, "pageCount": pages,
           "_sortKey": (CATEGORY_ORDER.index(category), float(form_no[1:]))}
    print("%-11s src p%s -> %-2d pages  fields=%-4d cb=%-3d sig=%-2d baked=%-3d geom=%-2d overlap=%-2d collide=%d"
          % (doc_id, "%d-%d" % (min(blank), max(blank)), pages, len(fields), audit["checkboxes"],
             len(skipped), len(baked), len(problems), len(overlaps), len(overlapping)))
    return row, audit


def main():
    promote = "--promote" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    rows, audits = [], []
    for entry in FORMS:
        row, audit = build(*entry)
        rows.append(row)
        audits.append(audit)

    bad = [a["docId"] for a in audits if a["geometryProblems"]]
    collide = {a["docId"]: sorted(a["collisionPages"]) for a in audits if a["collisionPages"]}
    print("\ngeometry failures: %s" % (bad or "none"))
    print("pages with overlapping printed text: %s" % (collide or "none"))
    print("total fields: %d across %d forms" % (sum(a["fields"] for a in audits), len(audits)))

    with open(os.path.join(OUT, "bc_wizard_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    # Fold into the Supreme rows so the BC block stays ordered by category.
    sc_path = os.path.join(OUT, "bc_sc_rows.json")
    existing = [r for r in json.load(open(sc_path)) if r["docId"] not in {x["docId"] for x in rows}]
    for row in existing:
        row["_sortKey"] = (CATEGORY_ORDER.index(row["category"]), float(row["shortTitle"].split("F")[-1]))
    withheld = set(bad) if "--force" in sys.argv else set(bad) | set(collide)
    combined = existing + [r for r in rows if r["docId"] not in withheld]
    combined.sort(key=lambda r: r["_sortKey"])
    for row in combined:
        row.pop("_sortKey", None)
    with open(sc_path, "w") as fh:
        json.dump(combined, fh, indent=1)
    print("bc_sc_rows.json now holds %d Supreme rows" % len(combined))

    # Promote per form, not all-or-nothing: one form with a bad page must not hold
    # back the rest, and a form with a bad page must never ship.
    blocked = set(bad) | set(collide)
    # --force ships a form whose only defect is overlapping *printed* text, for a
    # human to judge. Geometry failures are never overridable: those mean a field
    # box is wrong, which is a filling bug rather than a legibility one.
    if "--force" in sys.argv:
        blocked = set(bad)
    if promote:
        shipped = []
        for row in rows:
            if row["docId"] in blocked:
                continue
            for extension in ("pdf", "json"):
                shutil.copy(os.path.join(OUT, "%s.%s" % (row["docId"], extension)),
                            os.path.join(EXPORT, "%s.%s" % (row["docId"], extension)))
            shipped.append(row["docId"])
        print("promoted %d of %d; held back: %s" % (len(shipped), len(rows), sorted(blocked) or "none"))
    return blocked


if __name__ == "__main__":
    main()

"""Fetch, build and catalogue Ontario's three Hague Convention support forms.

    python3 build_on_hague.py [--promote]

Ontario is a contracting party to the **2007 Hague Convention on the
International Recovery of Child Support**, and publishes three forms for it
beside its interjurisdictional (ISO) set: an application to establish a
decision, an application to modify one, and the financial circumstances form
both rely on. They are how a support claim reaches a country outside Canada that
is not covered by the ISO Act's reciprocal arrangements -- the ISO forms cannot
be used there -- so without them the catalogue stops at the Canadian border.

**No other province in this catalogue publishes an equivalent**: the Hague
annexes are used through each province's central authority, and Ontario is the
only one of the eight that puts its own fillable version on the record.

Why they were missing: they are not on `ontariocourtforms.on.ca`, which is what
`scrape_on_index.py` reads. They live in the **Central Forms Repository**
(`forms.mgcs.gov.on.ca`, ON00599-ON00601), the government's general forms
service, and the file names are the Convention's own annex letters (Annex C,
Annex D1, Annex E) rather than anything an index of court forms would list.

They are real AcroForms -- Annex C alone carries 166 widgets -- so this is the
widget path, with the shared seating passes and the baked flatten from
`tools/acroform_seat.py`. `--promote` also appends the rows to `catalog.json`;
they sit at the end of the ON block, and `merge_on_catalog.py` leaves them there
because they carry no position in the court's index.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, TOOLS)

import fitz  # noqa: E402

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_on_hague")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

CFR = "https://forms.mgcs.gov.on.ca/dataset/"
CATEGORY = "Interjurisdictional Support"
COURT = "Ministry of the Attorney General (Ontario Central Authority)"

# (docId, CFR number, title, resource path, the phrase the file must print)
SOURCES = [
    ("FormHagueEstablishment", "ON00599",
     "Hague Convention - Application for Establishment of a Decision",
     "b8ebb813-9b7f-4ff8-a4ce-f765993ddb46/resource/"
     "8eac28f9-c341-49b1-bef5-5ca0b4f1243e/download/on00559e_annexc.pdf",
     "establishment of a decision"),
    ("FormHagueModification", "ON00600",
     "Hague Convention - Application for Modification of a Decision",
     "cd59ec81-28db-4df1-99b0-5cc30a20c65b/resource/"
     "e85202b0-b4c7-429f-9f57-28036d8fca3f/download/on00600e_annex_d1.pdf",
     "modification of a decision"),
    ("FormHagueFinancial", "ON00601",
     "Hague Convention - Financial Circumstances Form",
     "1e753d2f-67a9-41af-bd82-35597af9c8e8/resource/"
     "c4a627c4-ec34-4f20-9d2d-27d2d839b43f/download/on00601e_annexe.pdf",
     "financial circumstances"),
]


def download(url, dest):
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, url],
        check=True,
    )


def build_one(doc_id, number, title, path, phrase):
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    if not os.path.exists(source) or os.path.getsize(source) == 0:
        download(CFR + path, source)
    blob = open(source, "rb").read()
    problems = []
    if not blob.startswith(b"%PDF"):
        return None, None, ["%s: not a PDF" % doc_id]

    document = fitz.open(source)
    text = " ".join(page.get_text() for page in document).lower()
    widgets = sum(len(list(page.widgets())) for page in document)
    document.close()
    if phrase not in " ".join(text.split()):
        problems.append("%s: does not print %r" % (doc_id, phrase))
    if not widgets:
        problems.append("%s: no widgets -- expected an AcroForm" % doc_id)

    background = os.path.join(OUT, "%s.pdf" % doc_id)
    pages, cleared = A.flatten_baked(source, background)
    fields, audit = bp.extract(source, doc_id)
    dropped = A.drop_offpage_fields(fields, audit["pageSizes"])
    bp.clamp_to_page(fields, audit["pageSizes"])
    moved = A.seat_checkboxes(fields, background)
    resized, seated = A.refit_text_fields(fields, background)
    bp.clamp_to_page(fields, audit["pageSizes"])

    geometry = bp.check_geometry(fields, audit["pageSizes"])
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)
    problems.extend("%s: %s" % (doc_id, item) for item in geometry)

    audit.update(geometryProblems=geometry, overlapFlags=len(overlaps),
                 overlapDetail=overlaps[:20], checkboxesSeated=moved,
                 linesResized=resized, linesSeated=seated,
                 offPageDropped=dropped, fields=len(fields), path="widget",
                 valuesCleared=cleared, cfrNumber=number)
    row = {
        "title": title,
        "shortTitle": "ON %s" % number,
        "footerText": COURT,
        "status": "active",
        "fileName": "%s.pdf" % doc_id,
        "docId": doc_id,
        "province": "ON",
        "category": CATEGORY,
        "version": 1,
        "pageCount": pages,
    }
    return row, audit, problems


def merge(rows):
    """Append the rows to the ON block and regenerate audit.json."""
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    new = {row["docId"] for row in rows}
    keep = [item for item in catalog if item["docId"] not in new]
    highest = max(item["sortOrder"] for item in keep
                  if item.get("province") == "ON")
    on_rows = [item for item in keep if item.get("province") == "ON"]
    others = [item for item in keep if item.get("province") != "ON"]
    for offset, row in enumerate(rows, start=1):
        row = dict(row)
        row["sortOrder"] = highest + offset
        on_rows.append(row)

    merged = on_rows + others
    included = []
    for item in merged:
        mapping = json.load(open(os.path.join(EXPORT, "%s.json" % item["docId"])))
        included.append({"docId": item["docId"], "pdf": "%s.pdf" % item["docId"],
                         "mapping": "%s.json" % item["docId"],
                         "fields": len(mapping["staticFields"])})
    audit = {"included": included, "excluded": [],
             "counts": {"included": len(included), "excluded": 0}}
    with open(os.path.join(EXPORT, "catalog.json"), "w") as fh:
        json.dump(merged, fh, indent=2)
        fh.write("\n")
    with open(os.path.join(EXPORT, "audit.json"), "w") as fh:
        json.dump(audit, fh, indent=2)
        fh.write("\n")
    print("catalog: %d rows, ON now %d" % (len(merged), len(on_rows)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()
    for folder in (STAGE, OUT, QA):
        os.makedirs(folder, exist_ok=True)

    rows, audits, problems = [], [], []
    for doc_id, number, title, path, phrase in SOURCES:
        row, audit, issues = build_one(doc_id, number, title, path, phrase)
        problems.extend(issues)
        if row is None:
            continue
        rows.append(row)
        audits.append(audit)
        print("%-24s pages=%-3d fields=%-4d cb=%-4d seated=%-4d geom=%-2d ovl=%d"
              % (doc_id, audit["pages"], audit["fields"], audit["checkboxes"],
                 audit["checkboxesSeated"], len(audit["geometryProblems"]),
                 audit["overlapFlags"]))

    with open(os.path.join(OUT, "on_hague_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "on_hague_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    print("\ntotal: %d forms, %d pages, %d fields"
          % (len(audits), sum(a["pages"] for a in audits),
             sum(a["fields"] for a in audits)))
    if problems:
        print("problems (%d):" % len(problems))
        for line in problems:
            print("  %s" % line)
    else:
        print("no problems")

    if args.promote and not problems:
        for row in rows:
            doc_id = row["docId"]
            shutil.copy(os.path.join(OUT, "%s.pdf" % doc_id),
                        os.path.join(EXPORT, "%s.pdf" % doc_id))
            shutil.copy(os.path.join(OUT, "%s.json" % doc_id),
                        os.path.join(EXPORT, "%s.json" % doc_id))
        merge(rows)
        print("promoted %d templates" % len(rows))
    elif args.promote:
        print("NOT promoted -- fix the problems first")


if __name__ == "__main__":
    main()

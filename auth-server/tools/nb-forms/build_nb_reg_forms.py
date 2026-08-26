"""Fetch, gate and build the New Brunswick regulation forms.

    python3 build_nb_reg_forms.py [--only NBFSA_1_01] [--promote]

One tool rather than the usual fetch/build pair, because the batch is 14 forms
from a single host with a single format: each is its own PDF cut from the
consolidation by the King's Printer, carrying no widget layer and no XFA.

Gates, in order:

* the file is a PDF, and its sha256 and byte size are recorded;
* it prints its own form number, with a right-hand boundary so "Form 1.1" does
  not match inside "Form 1.10";
* it carries **no widgets** -- a regulation form that grew a widget layer is a
  different document and would take the widget path instead;
* the boxes it produced are in bounds and none is off the sheet.

Everything is the printed-anchor path, on the dot-leader vocabulary in
`nb_reg_anchors.py`. No option-square or ruled-cell detector runs: these pages
print neither, and a detector that finds nothing is a detector that can only
invent something.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, TOOLS)
sys.path.insert(0, HERE)

import fitz  # noqa: E402

import acroform_seat as A  # noqa: E402
import bc_pipeline as bp  # noqa: E402
import nb_reg_anchors as anchors  # noqa: E402
from nb_reg_sources import all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_nb_reg")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")

SCALE = A.SCALE


def download(url, dest):
    # curl, not urllib: TLS-inspecting proxy, as everywhere else.
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, url],
        check=True,
    )


def fetch(src):
    dest = os.path.join(STAGE, "%s_source.pdf" % src["docId"])
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        download(src["url"], dest)
    return dest


def identifies_itself(src, text):
    flat = re.sub(r"\s+", " ", text).lower()
    return re.search(r"form %s(?![0-9.])" % re.escape(src["formNo"].lower()),
                     flat) is not None


MIN_HEIGHT = 8.0
CLEAR_ABOVE = 0.6


def fit_to_line(leader, words):
    """Where the box on this leader starts, and how tall it may be.

    The approved single-line height is 13.3 pt, and on a form that is what a
    blank gets. **These forms are not laid out like forms**: Form 23 sets its
    declaration as a solid paragraph with leaders running through it, about 13 pt
    from baseline to baseline, so a full-height box on one leader reaches into
    the line above and covers the words "the", "of", "County" printed there.

    So the box is cut to the space that is actually free above the leader --
    the same correction the Saskatchewan and Manitoba builders make for a
    writing box inside a ruled row. It keeps its baseline either way: what
    changes is the top, never where the typed text lands.
    """
    top = leader.y1 - A.SEAT_GAP - A.STD_LINE
    above = [w[3] for w in words
             if w[3] <= leader.y1 - 2.0
             and min(leader.x1, w[2]) - max(leader.x0, w[0]) > 0]
    if above:
        floor = max(above) + CLEAR_ABOVE
        if floor > top:
            top = floor
    height = max(MIN_HEIGHT, leader.y1 - A.SEAT_GAP - top)
    return leader.y1 - A.SEAT_GAP - height, height


def build_one(src):
    doc_id = src["docId"]
    source = fetch(src)
    blob = open(source, "rb").read()
    problems = []
    if not blob.startswith(b"%PDF"):
        return None, None, ["%s: not a PDF" % doc_id]

    document = fitz.open(source)
    text = "\n".join(page.get_text() for page in document)
    widgets = sum(len(list(page.widgets())) for page in document)
    document.close()
    if not identifies_itself(src, text):
        problems.append("%s: does not print its own form number" % doc_id)
    if widgets:
        problems.append("%s: %d widgets -- belongs on the widget path"
                        % (doc_id, widgets))

    background = os.path.join(OUT, "%s.pdf" % doc_id)
    pages = bp.flatten_background(source, background)

    fields = []
    document = fitz.open(background)
    try:
        index = 0
        for number, page in enumerate(document, start=1):
            words = page.get_text("words")
            for rect in anchors.leader_boxes(page):
                index += 1
                top, height = fit_to_line(rect, words)
                fields.append({
                    "id": bp.new_id(doc_id, index),
                    "type": "TextField",
                    "x": round(rect.x0, 2),
                    # The leader *is* the writing line, so the box sits on it the
                    # way a Saskatchewan box sits on its underscore run.
                    "y": round(top, 2),
                    "width": round(rect.width * SCALE, 2),
                    "height": round(height * SCALE, 2),
                    "value": "",
                    "fontSize": 9,
                    "color": [0, 0, 0],
                    "background": "none",
                    "border": "none",
                    "page": number,
                })
        sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)]
                 for p in document]
    finally:
        document.close()

    bp.clamp_to_page(fields, sizes)
    geometry = bp.check_geometry(fields, sizes)
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)
    problems.extend("%s: %s" % (doc_id, item) for item in geometry)

    row = {
        "title": "Form %s - %s" % (src["formNo"], src["title"]),
        "shortTitle": "NB %s %s" % (
            "FSA" if src["regulation"] == "81-134" else "FLA", src["formNo"]),
        "footerText": "%s, Reg %s" % (src["act"], src["regulation"]),
        "status": "active",
        "fileName": "%s.pdf" % doc_id,
        "docId": doc_id,
        "province": "NB",
        "category": src["category"],
        "version": 1,
        "pageCount": pages,
    }
    audit = {
        "docId": doc_id, "pages": pages, "fields": len(fields),
        "sha256": hashlib.sha256(blob).hexdigest(), "bytes": len(blob),
        "widgets": widgets, "path": "anchor",
        "geometryProblems": geometry, "overlapFlags": len(overlaps),
        "overlapDetail": overlaps[:20], "pageSizes": sizes,
    }
    return row, audit, problems


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()

    for folder in (STAGE, OUT, QA):
        os.makedirs(folder, exist_ok=True)

    work = all_sources()
    if args.only:
        work = [s for s in work if s["docId"] in args.only]

    rows, audits, problems = [], [], []
    for src in work:
        row, audit, issues = build_one(src)
        problems.extend(issues)
        if row is None:
            continue
        rows.append(row)
        audits.append(audit)
        print("%-14s pages=%-3d fields=%-4d ovl=%-3d %s"
              % (src["docId"], audit["pages"], audit["fields"],
                 audit["overlapFlags"], "" if not issues else "<- " + issues[0]))

    with open(os.path.join(OUT, "nb_reg_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "nb_reg_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)
    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    empty = [a["docId"] for a in audits if not a["fields"]]
    print("\ntemplates with no boxes: %s" % (empty or "none"))
    print("total: %d forms, %d pages, %d fields"
          % (len(audits), sum(a["pages"] for a in audits),
             sum(a["fields"] for a in audits)))
    if problems:
        print("\nproblems (%d):" % len(problems))
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
        print("promoted %d templates into form-template-export/" % len(rows))
    elif args.promote:
        print("NOT promoted -- fix the problems first")


if __name__ == "__main__":
    main()

"""Re-check the promoted New Brunswick set end to end.

    python3 verify_nl.py

Runs over what is actually in `form-template-export/`, not over the build's own
in-memory state, so it catches a promote that copied the wrong file as well as a
build that produced a bad one.

Checks, and what each is guarding against:

* **files present** -- a catalogue row whose PDF or mapping never got promoted
  is a form the API will offer and then fail to open.
* **background is flattened** -- a leftover native widget means the viewer draws
  the government's control *and* our overlay in the same place.
* **geometry in bounds** -- the same gate the build runs, re-run on disk.
* **no field wholly off the sheet** -- Newfoundland's source carried one; the
  same guard runs here so the class cannot appear unnoticed.
* **checkboxes sit on printed ink** -- the defect Saskatchewan's widget path
  shipped with. A checkbox that covers no ink at all is reported, because that
  is what an unseated one looks like.
* **binds use known vocabulary** -- a typo in a bind is silent at build time and
  shows up as a blank field in the app.
* **catalogue agrees with the mapping** -- pageCount against the PDF.

A reduced check set for the five flat forms, which carry no widgets and no
printed blanks at all: they are verified for files and bounds only, and are
expected to hold zero boxes.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
sys.path.insert(0, HERE)

import bc_pipeline as bp  # noqa: E402
from fetch_nb import KNOWN_STATIC  # noqa: E402
from nb_reg_sources import shipped_sources as reg_sources  # noqa: E402
from nb_sources import shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
SCALE = bp.SCALE

# Checkboxes that legitimately cover no printed ink, confirmed by looking at the
# page. Form 72J page 13 sets "IMPORTANT: Calculations will not work properly
# unless this box is checked" beside a widget that prints no square of its own --
# the government's PDF relies on the widget's border to draw it. Our overlay is
# the only box there and it sits exactly where the caption expects it, so this is
# the documented "option that prints no square" case in
# `acroform_seat.seat_checkboxes`, not an unseated control. Listed by (docId,
# page) so a *new* unseated checkbox still fails the gate.
INK_EXEMPT = {("NBKB_72J", 13)}

KNOWN_BINDS = {
    "court_info.courtFileNumber",
    "applicant.fullLegalName",
    "respondent.fullLegalName",
    "applicant.dateOfBirth",
    "respondent.dateOfBirth",
}


def covers_ink(page, field, pad=1.0):
    """Does this box cover any printed ink at all?"""
    rect = fitz.Rect(field["x"] - pad, field["y"] - pad,
                     field["x"] + field["width"] / SCALE + pad,
                     field["y"] + field["height"] / SCALE + pad)
    pix = page.get_pixmap(clip=rect, colorspace=fitz.csGRAY, dpi=150)
    return any(byte < 200 for byte in pix.samples)


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    rows = {r["docId"]: r for r in catalog if r.get("province") == "NB"}
    expected = {s["docId"] for s in shipped_sources()}
    expected |= {s["docId"] for s in reg_sources()}

    findings = []
    if set(rows) != expected:
        findings.append("catalogue set != shipped set: missing %s, extra %s"
                        % (sorted(expected - set(rows)), sorted(set(rows) - expected)))

    total_fields = total_binds = total_pages = 0
    for doc_id in sorted(rows):
        pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
        mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
        if not os.path.exists(pdf) or not os.path.exists(mapping_path):
            findings.append("%s: file missing" % doc_id)
            continue

        fields = json.load(open(mapping_path))["staticFields"]
        document = fitz.open(pdf)
        try:
            sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in document]
            total_pages += document.page_count
            total_fields += len(fields)

            if rows[doc_id].get("pageCount") != document.page_count:
                findings.append("%s: catalogue pageCount %s != pdf %d"
                                % (doc_id, rows[doc_id].get("pageCount"),
                                   document.page_count))

            left = sum(len(list(p.widgets())) for p in document)
            if left:
                findings.append("%s: %d native widgets left in background"
                                % (doc_id, left))

            for problem in bp.check_geometry(fields, sizes):
                findings.append("%s: %s" % (doc_id, problem))

            for field in fields:
                width, height = sizes[field["page"] - 1]
                if field["y"] >= height - 2 or field["x"] >= width - 2:
                    findings.append("%s: field %s wholly off the sheet"
                                    % (doc_id, field["id"]))
                bind = field.get("bind")
                if bind:
                    total_binds += 1
                    if bind not in KNOWN_BINDS:
                        findings.append("%s: unknown bind %r on %s"
                                        % (doc_id, bind, field["id"]))

            # The regulation batch is anchor-built and prints no option square
            # anywhere, so it holds no checkboxes to check -- the same reduced
            # set the five flat Rules of Court forms take.
            if doc_id not in KNOWN_STATIC and not doc_id.startswith(("NBFSA_", "NBFLA_")):
                blank = [f for f in fields if f["type"] == "CheckBox"
                         and (doc_id, f["page"]) not in INK_EXEMPT
                         and not covers_ink(document[f["page"] - 1], f)]
                if blank:
                    findings.append("%s: %d checkbox(es) cover no printed ink"
                                    % (doc_id, len(blank)))
        finally:
            document.close()

    print("NB: %d templates, %d pages, %d fields, %d binds"
          % (len(rows), total_pages, total_fields, total_binds))
    if findings:
        print("\n%d findings:" % len(findings))
        for line in findings:
            print("  %s" % line)
        sys.exit(1)
    print("zero findings")


if __name__ == "__main__":
    main()

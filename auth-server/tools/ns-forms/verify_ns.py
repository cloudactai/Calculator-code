"""Re-check the promoted Nova Scotia set end to end.

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
* **no field wholly off the sheet** -- the same guard the AcroForm provinces
  run, kept here because a LibreOffice render can place a table past the page.
* **checkboxes sit on printed ink** -- the defect Saskatchewan's widget path
  shipped with. A checkbox that covers no ink at all is reported, because that
  is what an unseated one looks like.
* **binds use known vocabulary** -- a typo in a bind is silent at build time and
  shows up as a blank field in the app.
* **catalogue agrees with the mapping** -- pageCount against the PDF.

Both Nova Scotia batches are verified together, because the catalogue offers
them together: the 84 rule forms anchor-built from LibreOffice renders and the
18 ISO forms built from the government's own AcroForms. Every check runs on
every form -- there is no reduced set for either path.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
sys.path.insert(0, HERE)

import bc_pipeline as bp  # noqa: E402
from ns_iso_sources import shipped_sources as iso_sources  # noqa: E402
from ns_sources import shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
SCALE = bp.SCALE

# Checkboxes that legitimately cover no printed ink, confirmed by looking at the
# page rather than assumed. Form B declares an option widget beside two lines
# that print no square at all: the heading of section 4 ("I believe that the
# Respondent should acknowledge parentage ... (check all that apply)") and the
# "Provide an explanation in Section 9 below" note on page 2. Both are prose the
# government hung a spare widget on. That is the "option that prints no square"
# case `acroform_seat.seat_checkboxes` leaves alone. Listed by (docId, page) so a
# *new* unseated checkbox still fails the gate.
INK_EXEMPT = {("NSISO_B", 1), ("NSISO_B", 2)}

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
    rows = {r["docId"]: r for r in catalog if r.get("province") == "NS"}
    expected = {s["docId"] for s in shipped_sources()}
    expected |= {s["docId"] for s in iso_sources()}

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

            blank = [f for f in fields if f["type"] == "CheckBox"
                     and (doc_id, f["page"]) not in INK_EXEMPT
                     and not covers_ink(document[f["page"] - 1], f)]
            if blank:
                findings.append("%s: %d checkbox(es) cover no printed ink"
                                % (doc_id, len(blank)))
        finally:
            document.close()

    print("NS: %d templates, %d pages, %d fields, %d binds"
          % (len(rows), total_pages, total_fields, total_binds))
    if findings:
        print("\n%d findings:" % len(findings))
        for line in findings:
            print("  %s" % line)
        sys.exit(1)
    print("zero findings")


if __name__ == "__main__":
    main()

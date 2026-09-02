"""Re-flatten NLSC_SUBPOENA's background, which shipped with its header and
footer truncated.

    python3 fix_nlsc_subpoena_background.py [--check]

`bc_pipeline.flatten_background` saves the widget-stripped source with
`clean=True`, which asks MuPDF to rewrite every content stream. On one page in
the whole NL/NB corpus that rewrite goes wrong: four text runs in the Subpoena's
header and footer are re-emitted one character at a time with the wrong advance
widths, so each run overruns its space and the tail is dropped. The printed page
ships reading

    Form 46.23A(ru                    Court File No.
    Rules of the Supre      Page 1    Form Last Updated: F

where the government's own PDF reads

    Form 46.23A(rule 46.23(1))        Court File No. __________
    Rules of the Supreme Court, 1986  Page 1 of 1
                                      Form Last Updated: February 21, 2018

This is a background defect, not a field defect: no detector in `tools/review`
looks at the printed page's own text, and the field geometry is unaffected. It
was found by reading the rendered page, then confirmed by re-flattening every
one of the 144 staged NL and NB sources without `clean` and diffing the result
against what shipped -- this is the only page in the corpus that lost any text.

The repair drops `clean=True` for this one file and changes nothing else. The
page keeps its size, its single page, and zero widgets, and the mapping JSON is
not touched at all, so every field keeps the coordinates it already had.

`bc_pipeline.flatten_background` itself is deliberately left alone: it is shared
by eight provinces, every one of which would need re-verifying, and no other
page in this audit's scope is affected.
"""
import argparse
import os
import re
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)),
                      "form-template-export")

DOC_ID = "NLSC_SUBPOENA"
SOURCE = os.path.join(EXPORT, "_incoming_nl", "%s_source.pdf" % DOC_ID)
TARGET = os.path.join(EXPORT, "%s.pdf" % DOC_ID)

# The runs the shipped background truncates. Each must read in full afterwards.
MUST_READ = [
    "Form 46.23A(rule 46.23(1))",
    "Rules of the Supreme Court, 1986",
    "Page 1 of 1",
    "Form Last Updated: February 21, 2018",
]


def squashed(text):
    return re.sub(r"\s+", "", text)


def flatten(source_path):
    """The source as a printed background, without MuPDF's stream rewrite."""
    doc = fitz.open(source_path)
    for page in doc:
        for widget in list(page.widgets()):
            page.delete_widget(widget)
    doc.xref_set_key(doc.pdf_catalog(), "AcroForm", "null")
    # garbage/deflate as the pipeline does; `clean` is what corrupts this page.
    return doc.tobytes(garbage=4, deflate=True)


def page_text(data):
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        return [page.get_text() for page in doc], [
            fitz.Rect(page.rect) for page in doc], sum(
                len(list(page.widgets())) for page in doc)
    finally:
        doc.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(SOURCE):
        raise SystemExit("missing staged source: %s" % SOURCE)

    rebuilt = flatten(SOURCE)
    new_text, new_rects, new_widgets = page_text(rebuilt)

    old = fitz.open(TARGET)
    old_text = [page.get_text() for page in old]
    old_rects = [fitz.Rect(page.rect) for page in old]
    old.close()

    # Nothing about the page's shape may change -- only the text that was lost.
    assert len(new_text) == len(old_text) == 1, "page count changed"
    assert new_rects == old_rects, "page size changed: %s -> %s" % (
        old_rects, new_rects)
    assert new_widgets == 0, "%d widgets survived the flatten" % new_widgets

    missing = [s for s in MUST_READ if squashed(s) not in squashed(new_text[0])]
    assert not missing, "rebuilt page still does not read: %r" % missing
    recovered = [s for s in MUST_READ if squashed(s) not in squashed(old_text[0])]

    if squashed(new_text[0]) == squashed(old_text[0]):
        print("%s: background already reads in full, nothing to change" % DOC_ID)
        return

    print("%s p1: %d characters of printed text restored" % (
        DOC_ID, len(squashed(new_text[0])) - len(squashed(old_text[0]))))
    for line in recovered:
        print("    now reads in full: %r" % line)

    if args.check:
        print("--check: not written")
        return

    with open(TARGET, "wb") as fh:
        fh.write(rebuilt)
    print("wrote %s" % TARGET)


if __name__ == "__main__":
    sys.exit(main())

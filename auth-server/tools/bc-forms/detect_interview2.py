"""Which batch-2 Supreme flattens carry an Adobe interview section in front of the form?

This is the check batch 1 got wrong twice, in opposite directions, so it reports
evidence per page rather than a verdict per file (BC_MIGRATION_PLAN STATUS):

  * The first attempt scanned the whole document for interview phrasing and excluded
    any form whose *first* section is a wizard — but for F3 the real court document is
    still in the same file, on pages 20-60. Excluding it was wrong.
  * So the question is never "does this file contain a wizard", it is "where does the
    filing document start, and is it in here at all".

Signals, per page:
  wizard   — Adobe's own interview wording, or the plumbing fields the wizard uses to
             carry state (`TempStringName`, `Document Type Code`) which never appear
             on a filed page.
  heading  — the page prints the form's own rule-book heading ("FORM F19.3 (RULE ...)"),
             which only the filing document does.

A clean form is: no wizard page, heading on page 1. Anything else gets read by hand.

Run: python3 detect_interview2.py
"""
import json
import os
import re
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch2 as src2  # noqa: E402

SC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "xfa", "sc_out2")

INTERVIEW_PHRASES = (
    "will populate when form is previewed",
    "mandatory paragraphs",
    "click preview",
    "press preview",
    "this is not the form you file",
    "do not file this page",
    "for internal use",
)
PLUMBING = ("tempstringname", "document type code", "documenttypecode", "temp string")


def heading_re(form_no):
    """'F19.3' -> matches 'FORM F19.3', 'FORM F 19.3', 'Form F19 .3'."""
    body = re.escape(form_no.lstrip("F")).replace(r"\.", r"\s*\.\s*")
    return re.compile(r"form\s*f\s*%s\b" % body, re.I)


def main():
    rows = []
    for src in src2.all_sources():
        pdf = os.path.join(SC, "%s.pdf" % src["docId"])
        if not os.path.exists(pdf):
            continue  # AcroForm form, not flattened
        doc = fitz.open(pdf)
        pages = doc.page_count
        texts = [re.sub(r"\s+", " ", doc[i].get_text()).lower() for i in range(pages)]
        doc.close()

        names = ""
        fpath = os.path.join(SC, "%s.fields.json" % src["docId"])
        if os.path.exists(fpath):
            names = " ".join(str(f.get("name") or "") for f in json.load(open(fpath))).lower()

        rx = heading_re(src["formNo"]) if src["formNo"].startswith("F") else None
        wizard_pages = [i + 1 for i, t in enumerate(texts)
                        if any(p in t for p in INTERVIEW_PHRASES)]
        heading_pages = [i + 1 for i, t in enumerate(texts) if rx and rx.search(t)] if rx else []
        plumbing = [p for p in PLUMBING if p in names]

        clean = not wizard_pages and not plumbing and (heading_pages[:1] == [1] or not rx)
        rows.append(dict(docId=src["docId"], formNo=src["formNo"], pages=pages,
                         wizardPages=wizard_pages, headingPages=heading_pages[:6],
                         plumbing=plumbing, clean=clean))

    dirty = [r for r in rows if not r["clean"]]
    for r in rows:
        if not r["clean"]:
            print("REVIEW %-14s pages=%-3d wizard=%-14s heading=%-16s plumbing=%s" % (
                r["docId"], r["pages"], r["wizardPages"] or "-",
                r["headingPages"] or "-", r["plumbing"] or "-"))
    with open(os.path.join(SC, "interview-report.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    print("\n%d flattened, %d clean, %d to read by hand" % (
        len(rows), len(rows) - len(dirty), len(dirty)))


if __name__ == "__main__":
    main()

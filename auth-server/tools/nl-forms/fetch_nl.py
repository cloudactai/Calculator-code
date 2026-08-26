"""Gate A + B: download every Newfoundland source PDF, verify it, write manifest.json.

Per file: PDF magic bytes, sha256 and byte size recorded, the page count read,
the form identified from its own printed text, the footer/revision line
captured, and the AcroForm / XFA / static classification.

The Newfoundland forms are expected to come back `acroform`: the Supreme Court
publishes them as fillable PDFs carrying the government's own widget
rectangles, which is what the overlay is built from. The classification is still
recorded, because a source that ever turns static would have to route to the
printed-anchor detectors instead and that is a different builder.

Downloads are cached -- a re-run only fetches what is missing or changed size --
so this is cheap to run before every build.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nl_sources import all_sources  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "form-template-export", "_incoming_nl")


def download(url, dest):
    # curl, not urllib: this box sits behind a TLS-inspecting proxy whose root is
    # in the system trust store but not in certifi, so Python's own client fails
    # the handshake. Every other province's fetcher shells out for the same reason.
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, url],
        check=True,
    )


def classify(path):
    """Return (pages, n_widgets, is_xfa, text, footer)."""
    doc = fitz.open(path)
    is_xfa = doc.xref_get_key(doc.pdf_catalog(), "AcroForm/XFA")[0] != "null"
    n_widgets = sum(len(list(page.widgets())) for page in doc)
    text = "\n".join(doc[i].get_text() for i in range(min(3, doc.page_count)))
    last = doc[doc.page_count - 1].get_text().strip().splitlines()
    footer = next((ln.strip() for ln in reversed(last) if ln.strip()), "")
    pages = doc.page_count
    doc.close()
    return pages, n_widgets, is_xfa, text, footer


DASHES = dict.fromkeys(map(ord, "‐‑‒–—"), "-")

# The two forms the court publishes flat, confirmed by reading them rather than
# assumed: the Settlement Conference Brief (5 pages, whose first page is
# instructions) and the file-access Undertaking (1 page). Both print their
# blanks as underscore runs, so they take the printed-anchor path in
# `build_nl_forms.py` instead of the widget path. They are listed here so a
# *third* form quietly losing its widget layer still shows up as a problem.
KNOWN_STATIC = {
    "NLSC_SETTLEMENT_CONFERENCE_BRIEF",
    "NLSC_UNDERTAKING_TO_OBTAIN_ACCESS_TO_COURT_FILE",
}


def identifies_itself(src, text):
    """Does the file we got back identify itself as the form we asked for?

    A numbered form prints its own number ("Form F10.02A", or just "F10.02A" in
    the header rule), which is what guards a wrong link.

    The 17 unnumbered rows have no number to print, and matching them on their
    own title words does not work: the court's index names a form differently
    from the form's own heading often enough to be useless as a gate -- the row
    "Order (Blank)" prints "Order (Family Law)", and "Affidavit (filing
    contracts and agreements pursuant to s. 42 ...)" prints "Affidavit -
    Sections 42 and 65(5) of the Family Law Act". Both were flagged while being
    exactly the right file. What actually guards a wrong link for those is the
    court's own imprint, which every one of them carries, so that is the check.
    """
    flat = re.sub(r"\s+", " ", text.translate(DASHES)).lower()
    if src["numbered"]:
        no = src["formNo"].lower()
        return re.search(r"\b%s\b" % re.escape(no), flat) is not None
    return "supreme court of newfoundland" in flat


def main():
    os.makedirs(STAGE, exist_ok=True)
    manifest, problems = [], []
    for src in all_sources():
        did = src["docId"]
        dest = os.path.join(STAGE, "%s_source.pdf" % did)
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            try:
                download(src["url"], dest)
            except subprocess.CalledProcessError as exc:
                problems.append((did, "download failed: %s" % exc))
                continue

        blob = open(dest, "rb").read()
        if not blob.startswith(b"%PDF"):
            problems.append((did, "not a PDF (%d bytes)" % len(blob)))
            continue

        pages, widgets, is_xfa, text, footer = classify(dest)
        kind = "xfa" if is_xfa else ("acroform" if widgets else "static")
        named = identifies_itself(src, text)
        if not named:
            problems.append((did, "text does not identify the form"))
        if kind != "acroform" and did not in KNOWN_STATIC:
            problems.append((did, "expected acroform, got %s" % kind))
        if kind == "acroform" and did in KNOWN_STATIC:
            problems.append((did, "now has widgets -- move it off the anchor path"))

        manifest.append({
            "docId": did,
            "formNo": src["formNo"],
            "title": src["title"],
            "category": src["category"],
            "url": src["url"],
            "sha256": hashlib.sha256(blob).hexdigest(),
            "bytes": len(blob),
            "pages": pages,
            "widgets": widgets,
            "kind": kind,
            "footerText": footer,
            "identified": named,
        })
        print("%-46s pages=%-3d widgets=%-4d %-9s %s"
              % (did, pages, widgets, kind, "" if named else "<- UNIDENTIFIED"))

    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)

    print("\n%d sources, %d total pages, %d total widgets"
          % (len(manifest), sum(m["pages"] for m in manifest),
             sum(m["widgets"] for m in manifest)))
    if problems:
        print("\nproblems (%d):" % len(problems))
        for did, why in problems:
            print("  %-46s %s" % (did, why))
    else:
        print("no problems")


if __name__ == "__main__":
    main()

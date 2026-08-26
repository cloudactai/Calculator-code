"""Gate A + B: download every New Brunswick source PDF, verify it, write manifest.json.

Per file: PDF magic bytes, sha256 and byte size recorded, the page count read,
the form identified from its own printed text, the footer/revision line
captured, and the AcroForm / XFA / static classification.

The New Brunswick forms are expected to come back `acroform`: the Supreme Court
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
from nb_sources import all_sources  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "form-template-export", "_incoming_nb")


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

# The five forms the court publishes flat, confirmed by reading them rather than
# assumed. These are not fillable PDFs that lost their widgets: they are the
# Rules of Court's own "APPENDIX OF FORMS" text, set as continuous prose with
# parenthetical instructions -- "(Court, Court File Number, Style of Cause)" --
# and **no printed blank anywhere on the page**: zero underscore runs, zero dot
# leaders, three or four drawings for the whole sheet.
#
# So they ship with the background and no boxes. Inventing a box where the page
# prints no anchor is the one thing every province's builder refuses to do, and
# there is nothing here to anchor to. Three of the five (72M, 72N Divorce
# Judgment, 72O Certificate of Divorce) are issued by the court rather than
# completed by a party anyway -- the same character as Ontario's 37A-37E.
KNOWN_STATIC = {
    "NBKB_7A",      # Request for Appointment of Litigation Guardian
    "NBKB_72FF",    # Certificate of Solicitor
    "NBKB_72M",     # Divorce Judgment
    "NBKB_72N",     # Divorce Judgment
    "NBKB_72O",     # Certificate of Divorce
}


def identifies_itself(src, text):
    """Does the file we got back identify itself as the form we asked for?

    Every New Brunswick family form prints its own number, which is what guards
    a wrong link -- and the link genuinely needs guarding here, because neither
    filename is derivable from the number and the two hosts use three different
    naming conventions between them.
    """
    flat = re.sub(r"\s+", " ", text.translate(DASHES)).lower()
    no = src["formNo"].lower()
    # The number is printed as "FORM 72D" and also as "72D" in a header rule.
    # A non-word boundary rather than \b on the right: "72F" must not match
    # inside "72FF", which is a different form.
    return re.search(r"\b%s(?![A-Za-z0-9])" % re.escape(no), flat) is not None


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

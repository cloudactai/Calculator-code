"""Gates A + B for the Nova Scotia ISO batch: download, verify, write manifest.

Per file: PDF magic bytes, sha256 and byte size, the page count, the widget
count, the AcroForm / XFA / static classification, the form identified from its
own printed text, and the footer line.

**Every ISO form is expected to come back `acroform`.** That is the whole reason
this batch takes the widget path instead of Nova Scotia's printed-anchor one,
and a form that ever turned up static or XFA would need a different builder, so
the classification fails the gate rather than being absorbed.

The identification check earns its place here: these files are cross-referenced
to a fault -- Form D names A.1, A.2, A.3, A.4, C and H on its own first page --
so "the text mentions a form number" proves nothing on its own. What is checked
is that the file prints **its own** number, which a wrong link would not.

Downloads are cached; a re-run only fetches what is missing.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ns_iso_sources import all_sources  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "form-template-export", "_incoming_ns_iso")


def download(url, dest):
    # curl, not urllib: this box sits behind a TLS-inspecting proxy whose root
    # is in the system trust store but not in certifi, so Python's own client
    # fails the handshake. Every province's fetcher shells out for this reason.
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
QUOTES = dict.fromkeys(map(ord, "’‘"), "'")


def identifies_itself(src, text):
    """Does the file we got back print the phrase that names it?

    For a numbered form the phrase is "form a.1", matched with a right-hand
    boundary so "Form A.1" does not match inside a hypothetical "Form A.10".
    The three unnumbered forms give a phrase off their own face instead.
    """
    flat = re.sub(r"\s+", " ", text.translate(DASHES).translate(QUOTES)).lower()
    return re.search(r"%s(?![A-Za-z0-9.])" % re.escape(src["identify"]),
                     flat) is not None


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
        if kind != "acroform":
            problems.append((did, "expected acroform, got %s" % kind))

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
        print("%-20s pages=%-3d widgets=%-4d %-9s %s"
              % (did, pages, widgets, kind, "" if named else "<- UNIDENTIFIED"))

    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)

    print("\n%d sources, %d total pages, %d total widgets"
          % (len(manifest), sum(m["pages"] for m in manifest),
             sum(m["widgets"] for m in manifest)))
    if problems:
        print("\nproblems (%d):" % len(problems))
        for did, why in problems:
            print("  %-20s %s" % (did, why))
    else:
        print("no problems")


if __name__ == "__main__":
    main()

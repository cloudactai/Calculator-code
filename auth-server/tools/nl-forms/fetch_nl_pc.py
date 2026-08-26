"""Gates A + B for the Newfoundland Provincial Court batch.

Per file: PDF magic bytes, sha256 and byte size, page count, widget count, the
AcroForm / XFA / static classification, and that the file identifies itself as a
Provincial Court form.

**The classification is the point here, not a formality.** This batch is mixed:
some forms carry the court's own AcroForm widgets and take the widget path, and
others carry no widget layer at all and take the printed-anchor path. The
builder reads `kind` from this manifest rather than guessing, so a form that
changes format upstream shows up as a changed manifest line instead of a
silently worse template.

Identification is by the court's own imprint rather than a form number, for the
reason `fetch_nl.py` records: several of these forms print no number at all (the
Supporting Affidavit, the Schedules, every adult-adoption form), so matching a
number would reject the majority of a correct batch.

**The imprint is matched loosely, and it has to be.** Text extraction on these
files is lossy: Form 2's heading comes back as "IN THE PROVIN D LABRADOR" and
its "BETWEEN:" as "E N:", because the font's ToUnicode map drops characters.
The page itself renders perfectly -- this is an extraction artefact, not damaged
ink -- but it means an exact phrase test fails on a correct file. Matching
"Labrador" *or* "Provincial Court" identifies 33 of the 34; the Recalculation
Clause prints neither, and names its own heading in `nl_pc_sources.IDENTIFY`.

Worth carrying forward: the same lossy extraction is why no printed-anchor
detector should be pointed at the AcroForm files here. It does not affect the
static ones, whose text comes back whole.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nl_pc_sources import all_sources  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "form-template-export", "_incoming_nl_pc")

IMPRINT = re.compile(r"labrador|provincial court", re.I)


def download(url, dest):
    # curl, not urllib: TLS-inspecting proxy whose root is in the system trust
    # store but not in certifi. Every province's fetcher shells out for this.
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, url],
        check=True,
    )


def classify(path):
    doc = fitz.open(path)
    is_xfa = doc.xref_get_key(doc.pdf_catalog(), "AcroForm/XFA")[0] != "null"
    widgets = sum(len(list(page.widgets())) for page in doc)
    text = "\n".join(doc[i].get_text() for i in range(min(3, doc.page_count)))
    last = doc[doc.page_count - 1].get_text().strip().splitlines()
    footer = next((line.strip() for line in reversed(last) if line.strip()), "")
    pages = doc.page_count
    doc.close()
    return pages, widgets, is_xfa, text, footer


def main():
    os.makedirs(STAGE, exist_ok=True)
    manifest, problems = [], []
    for src in all_sources():
        doc_id = src["docId"]
        dest = os.path.join(STAGE, "%s_source.pdf" % doc_id)
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            try:
                download(src["url"], dest)
            except subprocess.CalledProcessError as exc:
                problems.append((doc_id, "download failed: %s" % exc))
                continue

        blob = open(dest, "rb").read()
        if not blob.startswith(b"%PDF"):
            problems.append((doc_id, "not a PDF (%d bytes)" % len(blob)))
            continue

        pages, widgets, is_xfa, text, footer = classify(dest)
        # A form carrying widgets is built from them whether or not an XFA
        # packet is also present: Form 1 is a hybrid, and its AcroForm layer is
        # the government's real geometry. Only a file with XFA and *no* widgets
        # would need the headless flatten.
        kind = "acroform" if widgets else ("xfa" if is_xfa else "static")
        flat = re.sub(r"\s+", " ", text).lower()
        want = src.get("identify")
        named = (want in flat) if want else (IMPRINT.search(flat) is not None)
        if not named:
            problems.append((doc_id, "no Provincial Court imprint"))
        if kind == "xfa":
            problems.append((doc_id, "XFA with no widget layer -- needs the flatten path"))

        manifest.append({
            "docId": doc_id,
            "title": src["title"],
            "category": src["category"],
            "group": src["group"],
            "url": src["url"],
            "sha256": hashlib.sha256(blob).hexdigest(),
            "bytes": len(blob),
            "pages": pages,
            "widgets": widgets,
            "xfaPresent": is_xfa,
            "kind": kind,
            "footerText": footer,
            "identified": named,
        })
        print("%-34s pages=%-3d widgets=%-4d %-9s %s"
              % (doc_id, pages, widgets, kind, "" if named else "<- UNIDENTIFIED"))

    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)

    kinds = {}
    for item in manifest:
        kinds[item["kind"]] = kinds.get(item["kind"], 0) + 1
    print("\n%d sources, %d pages, %d widgets, %s"
          % (len(manifest), sum(m["pages"] for m in manifest),
             sum(m["widgets"] for m in manifest), kinds))
    if problems:
        print("\nproblems (%d):" % len(problems))
        for doc_id, why in problems:
            print("  %-34s %s" % (doc_id, why))
    else:
        print("no problems")


if __name__ == "__main__":
    main()

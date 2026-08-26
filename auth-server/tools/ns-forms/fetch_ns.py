"""Gate A + B: download every Nova Scotia source, render it, verify, write manifest.json.

Nova Scotia publishes **only Word documents** -- no PDF edition of any family
form exists, fillable or otherwise -- so this stage does two things the other
provinces' fetchers do not have to:

1. downloads the `.doc`/`.docx`, and
2. renders it to PDF with **LibreOffice**, which is the background the overlay
   is built on.

That makes the background *ours*, not the government's, which is the one place
Nova Scotia is weaker than Saskatchewan (whose PDF ships byte-identical to the
King's Printer's file). Manitoba's batch 3 has the same property for its twenty
Word-only forms, and it is recorded for the same reason: if a form ever looks
wrong on the page, the renderer is a suspect, not just the detector.

Per file: the download's sha256 and byte size, the rendered page count, the
form's own number found in the rendered text, and the confirmation that the
render carries **no widgets and no XFA** (a Word export never does; if one ever
did it would have to route to the widget path instead).

Renders are cached on the source's sha256, so re-running only re-renders what
actually changed upstream.

    python3 fetch_ns.py [--force]
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.parse as up

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ns_sources import all_sources  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(HERE)), "form-template-export", "_incoming_ns")
SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"


def download(url, dest):
    # curl, not urllib: TLS-inspecting proxy, as with every other province. The
    # URL is re-quoted because Nova Scotia's paths carry literal spaces
    # ("/Rule 59 Forms/"), which curl will not send raw.
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, up.quote(url, safe=":/?&=%")],
        check=True,
    )


def render(src, out_dir):
    """Word -> PDF through LibreOffice. Returns the produced path."""
    subprocess.run(
        [SOFFICE, "--headless", "--convert-to", "pdf", "--outdir", out_dir, src],
        check=True, capture_output=True,
    )
    produced = os.path.join(
        out_dir, re.sub(r"\.docx?$", ".pdf", os.path.basename(src), flags=re.I))
    if not os.path.exists(produced):
        raise RuntimeError("LibreOffice produced nothing for %s" % src)
    return produced


def classify(path):
    doc = fitz.open(path)
    is_xfa = doc.xref_get_key(doc.pdf_catalog(), "AcroForm/XFA")[0] != "null"
    widgets = sum(len(list(page.widgets())) for page in doc)
    text = "\n".join(doc[i].get_text() for i in range(min(3, doc.page_count)))
    pages = doc.page_count
    doc.close()
    return pages, widgets, is_xfa, text


DASHES = dict.fromkeys(map(ord, "‐‑‒–—"), "-")


def identifies_itself(src, text):
    """Does the rendered file print the form number we asked for?

    A CPR form prints "Form 59.07"; an FD form prints "Form FD3" or "FD 3". The
    right-hand boundary must reject a longer number -- "60A.2" must not match
    inside "60A.20" -- so a digit or letter immediately after the number fails.
    """
    flat = re.sub(r"\s+", " ", text.translate(DASHES)).lower()
    no = src["formNo"].lower()
    if src["family"] == "FD":
        loose = re.sub(r"^(fdo?)\s*", r"\1\\s*", re.escape(no))
        return re.search(r"\b%s(?![0-9a-z])" % loose, flat) is not None
    return re.search(r"\b%s(?![0-9a-z.])" % re.escape(no), flat) is not None


def main():
    force = "--force" in sys.argv
    os.makedirs(STAGE, exist_ok=True)
    cache_path = os.path.join(STAGE, "render_cache.json")
    cache = json.load(open(cache_path)) if os.path.exists(cache_path) else {}

    manifest, problems = [], []
    for src in all_sources():
        did = src["docId"]
        ext = ".docx" if src["url"].lower().endswith(".docx") else ".doc"
        word = os.path.join(STAGE, "%s_source%s" % (did, ext))
        rendered = os.path.join(STAGE, "%s_source.pdf" % did)

        if not os.path.exists(word) or os.path.getsize(word) == 0:
            try:
                download(src["url"], word)
            except subprocess.CalledProcessError as exc:
                problems.append((did, "download failed: %s" % exc))
                continue

        blob = open(word, "rb").read()
        digest = hashlib.sha256(blob).hexdigest()
        if force or cache.get(did) != digest or not os.path.exists(rendered):
            try:
                produced = render(word, STAGE)
            except Exception as exc:                       # noqa: BLE001
                problems.append((did, "render failed: %s" % exc))
                continue
            if produced != rendered:
                os.replace(produced, rendered)
            cache[did] = digest

        pages, widgets, is_xfa, text = classify(rendered)
        named = identifies_itself(src, text)
        if not named:
            problems.append((did, "rendered text does not print form %s" % src["formNo"]))
        if widgets or is_xfa:
            problems.append((did, "render carries widgets/XFA -- use the widget path"))

        manifest.append({
            "docId": did, "formNo": src["formNo"], "title": src["title"],
            "rule": src["rule"], "category": src["category"], "url": src["url"],
            "sha256": digest, "bytes": len(blob), "pages": pages,
            "widgets": widgets, "kind": "word-render", "identified": named,
        })
        print("%-26s pages=%-3d %s" % (did, pages, "" if named else "<- UNIDENTIFIED"))

    with open(cache_path, "w") as fh:
        json.dump(cache, fh, indent=1)
    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)

    print("\n%d sources, %d rendered pages"
          % (len(manifest), sum(m["pages"] for m in manifest)))
    if problems:
        print("\nproblems (%d):" % len(problems))
        for did, why in problems:
            print("  %-26s %s" % (did, why))
    else:
        print("no problems")


if __name__ == "__main__":
    main()

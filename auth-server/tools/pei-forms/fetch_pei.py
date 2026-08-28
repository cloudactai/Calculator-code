"""Gate A + B: download every Prince Edward Island source, render it, verify, write manifest.json.

Prince Edward Island publishes **only Word documents** -- no PDF edition of any family
form exists, fillable or otherwise -- so this stage does two things the other
provinces' fetchers do not have to:

1. downloads the `.doc`/`.docx`, and
2. renders it to PDF with **LibreOffice**, which is the background the overlay
   is built on.

That makes the background *ours*, not the government's, which is the one place
Prince Edward Island is weaker than Saskatchewan (whose PDF ships byte-identical to the
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
from pei_sources import all_sources  # noqa: E402
from reflow_pei_71b_source import build as reflow_pei_71b_source  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(HERE)), "form-template-export", "_incoming_pei")
SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"


def download(url, dest):
    # curl, not urllib: TLS-inspecting proxy, as with every other province. The
    # URL is re-quoted because Prince Edward Island's paths carry literal spaces
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

    A PEI form prints "Form 70A" or "FORM 70 I (A)". The number is matched
    loosely on internal spacing -- the court sets "70 I (A)" with spaces on the
    page and "70I(A)" in its index -- but strictly on the right-hand boundary,
    so "70B" does not match inside "70BB" and "70A" does not match inside
    "70AA". The joint petition carries the court's "*" marker in the index only;
    the page prints plain "70A", so the marker is dropped before matching.
    """
    flat = re.sub(r"\s+", " ", text.translate(DASHES)).lower()
    no = src["formNo"].lower().rstrip("*")
    loose = r"\s*".join(re.escape(ch) for ch in no if not ch.isspace())
    return re.search(r"\b%s(?![0-9a-z])" % loose, flat) is not None


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
        render_digest = digest
        render_source = word
        if did == "PEISC_71B":
            # Form 71B needs source-level flow changes.  Include this script in
            # the cache key so a layout correction always triggers a rerender,
            # while the manifest continues to record the government file's
            # own digest.
            reflow_script = os.path.join(HERE, "reflow_pei_71b_source.py")
            render_digest = hashlib.sha256(
                blob + open(reflow_script, "rb").read()).hexdigest()
            render_source = os.path.join(STAGE, "%s_reflow.docx" % did)
        if force or cache.get(did) != render_digest or not os.path.exists(rendered):
            try:
                if did == "PEISC_71B":
                    reflow_pei_71b_source(word, render_source)
                produced = render(render_source, STAGE)
            except Exception as exc:                       # noqa: BLE001
                problems.append((did, "render failed: %s" % exc))
                continue
            if produced != rendered:
                os.replace(produced, rendered)
            cache[did] = render_digest

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

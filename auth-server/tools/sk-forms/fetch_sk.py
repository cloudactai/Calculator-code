"""Gate A + B: download every Saskatchewan source PDF, verify it, write manifest.json.

Per file: PDF magic bytes, page count against the count the publications site
advertises, sha256 and byte size recorded, the form's own number found in the text
(guards a wrong product id), the footer/revision line captured, and the
AcroForm / XFA / static classification.

The Saskatchewan forms are expected to come back `static`: the King's Printer
publishes them as Word-derived PDFs with a real text layer and no widgets at all.
The classification is still recorded, because a source that ever turns fillable
should route to the widget path rather than the detector path.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sk_reg_cut  # noqa: E402
from sk_sources import all_sources  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "form-template-export", "_incoming_sk")


def download(url, dest):
    # curl, not urllib: this box sits behind a TLS-inspecting proxy whose root is in
    # the system trust store but not in certifi, so Python's own client fails the
    # handshake. The BC fetcher shells out for the same reason.
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, url],
        check=True,
    )


def classify(path):
    """Return (pages, n_acroform_fields, is_xfa, text, footer)."""
    doc = fitz.open(path)
    is_xfa = doc.xref_get_key(doc.pdf_catalog(), "AcroForm/XFA")[0] != "null"
    n_fields = sum(len(list(page.widgets())) for page in doc)
    text = "\n".join(doc[i].get_text() for i in range(min(3, doc.page_count)))
    last = doc[doc.page_count - 1].get_text().strip().splitlines()
    footer = next((ln.strip() for ln in reversed(last) if ln.strip()), "")
    pages = doc.page_count
    doc.close()
    return pages, n_fields, is_xfa, text, footer


# The adoption consolidation sets its form numbers with a non-breaking hyphen
# (U+2011), so "FORM C-1" searched for with an ASCII hyphen finds nothing and a
# correctly cut form would be flagged as the wrong one.
DASHES = dict.fromkeys(map(ord, "‐‑‒–—"), "-")


def title_present(src, text):
    """Does the file we got back identify itself as the form we asked for?

    Part 15 and the two regulation families print their own number ("Form
    15-47", "FORM C-1"), which is what guards a wrong product id.

    The practice-directive forms do not, consistently: a directive numbers its
    appendices in its own scheme ("FAM-PD #7-1"), names some in full and leaves
    Directive 4's four with no marker at all. Those rows carry an explicit
    `textCheck` phrase instead, matched against the whole directive rather than
    the cut window -- see `sk_sources_pd._row` for why.
    """
    flat = re.sub(r"\s+", " ", text.translate(DASHES)).lower()
    phrase = src.get("textCheck")
    if phrase:
        return re.sub(r"\s+", " ", phrase.translate(DASHES)).lower() in flat
    return re.search(r"form\s*%s\b" % re.escape(src["formNo"].lower()), flat) is not None


def obtain(src, dest):
    """Put this form's source PDF at `dest`.

    Most forms are their own product and are downloaded whole. Two families are
    cut out of a larger document that is downloaded once and shared: the
    adoption forms out of the regulation's consolidation (`sk_reg_cut.py` has
    why they cannot be downloaded individually), and the Directive 3-7 forms out
    of their own practice directive.
    """
    cut = src.get("cut")
    if not cut:
        download(src["url"], dest)
        return
    shared = os.path.join(STAGE, src["sourceFile"])
    if not os.path.exists(shared) or os.path.getsize(shared) == 0:
        download(src["url"], shared)
    if "formNo" in cut:
        # The adoption forms: located inside the consolidation by their own
        # enacting heading, so a repagination is caught rather than shipped.
        sk_reg_cut.cut(shared, cut["formNo"], cut["window"], dest)
        return
    # A practice-directive appendix, which has no enacting heading to find it
    # by, so the window is page numbers. Out-of-range is raised rather than
    # silently clipped: a reissued directive that grew a page would otherwise
    # produce a short form instead of stopping the fetch.
    first, last = cut["window"]
    doc = fitz.open(shared)
    try:
        if last > doc.page_count:
            raise LookupError(
                "%s wants pages %d-%d of a %d-page document"
                % (src["docId"], first, last, doc.page_count))
        out = fitz.open()
        out.insert_pdf(doc, from_page=first - 1, to_page=last - 1)
        out.save(dest)
        out.close()
    finally:
        doc.close()


def identity_text(src, dest):
    """The text `title_present` should be asked about.

    For a form cut by page window this is the **whole directive**, not the cut:
    a directive names its appendices on its own contents page but not always
    inside them -- Directive 6's memo is titled on page 1 and its form starts on
    page 2 under a bare "APPENDIX A". The window itself is validated by its
    bounds in `obtain`.
    """
    cut = src.get("cut")
    if cut and "formNo" not in cut:
        shared = os.path.join(STAGE, src["sourceFile"])
        doc = fitz.open(shared)
        try:
            return "\n".join(doc[i].get_text() for i in range(doc.page_count))
        finally:
            doc.close()
    return None


def main():
    os.makedirs(STAGE, exist_ok=True)
    manifest = []
    for src in all_sources():
        dest = os.path.join(STAGE, "%s_source.pdf" % src["docId"])
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            try:
                obtain(src, dest)
            except (subprocess.CalledProcessError, LookupError) as exc:
                print("SOURCE FAIL %s: %s" % (src["docId"], exc))
                manifest.append(dict(src, ok=False, error="source failed: %s" % exc))
                continue
        raw = open(dest, "rb").read()
        entry = dict(src)
        entry["file"] = os.path.basename(dest)
        entry["bytes"] = len(raw)
        entry["sha256"] = hashlib.sha256(raw).hexdigest()
        if raw[:4] != b"%PDF":
            entry.update(ok=False, error="not a PDF")
            manifest.append(entry)
            print("BAD MAGIC %s" % src["docId"])
            continue
        try:
            pages, n_fields, is_xfa, text, footer = classify(dest)
        except Exception as exc:  # noqa: BLE001
            entry.update(ok=False, error="unreadable: %s" % exc)
            manifest.append(entry)
            print("UNREADABLE %s: %s" % (src["docId"], exc))
            continue
        entry["pages"] = pages
        entry["acroFields"] = n_fields
        entry["kind"] = "xfa" if is_xfa else ("acroform" if n_fields else "static")
        entry["footerText"] = footer[:120]
        entry["titleFound"] = title_present(src, identity_text(src, dest) or text)
        entry["pagesMatch"] = pages == src["expectedPages"]
        entry["ok"] = pages > 0 and entry["titleFound"] and entry["pagesMatch"]
        manifest.append(entry)
        print("%-12s pages=%-3d fields=%-4d kind=%-8s title=%-5s %s"
              % (src["docId"], pages, n_fields, entry["kind"], entry["titleFound"],
                 footer[:44]))
    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    bad = [m["docId"] for m in manifest if not m.get("ok")]
    kinds = {}
    for m in manifest:
        kinds[m.get("kind", "?")] = kinds.get(m.get("kind", "?"), 0) + 1
    print("\n%d entries %s, %d flagged: %s"
          % (len(manifest), kinds, len(bad), ", ".join(bad) or "none"))


if __name__ == "__main__":
    main()

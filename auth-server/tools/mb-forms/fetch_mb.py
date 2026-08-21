"""Gate A + B: download every Manitoba source PDF, verify it, write manifest.json.

Per file: PDF magic bytes, page count against what `mb_sources` records, sha256
and byte size, the form's own number found in its text (guards a wrong slug --
the URL is derived, so a typo in a form number returns somebody else's form
rather than a 404), the footer line, and the AcroForm / XFA / static
classification.

Batch 3 adds two source kinds batches 1 and 2 never had, and both are handled
here rather than in the builder:

* **Word.** The 20 forms on the Manitoba Courts site are published only as .doc
  or .docx. `sourceFormat` says so and `convert_to_pdf` renders them through
  LibreOffice, because there is no official PDF to fetch. The rendering is not
  the government's file -- see `mb_sources_batch3` -- so the manifest records
  `converted: true` and the converter's identity, and the FOAEAA forms are
  checked against the pagination they print in their own header.
* **AcroForm.** The 17 ISO forms carry real widgets. They are classified here
  exactly as before; it is the builder that has no path for them yet.

The batch-1 and batch-2 forms are expected to come back `static`: Manitoba Justice publishes
Word-derived PDFs with a real text layer and no widgets. The classification is
still recorded, because a source that ever turns fillable should route to the
widget path rather than the detector path.

Every Rule 70 form is fetched, not only the batch being built: verifying the
whole published set costs one pass and surfaces a form that has been renumbered
or withdrawn before it turns into a mystery in a later batch.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mb_sources import all_sources  # noqa: E402

STAGE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "form-template-export", "_incoming_mb")


def download(url, dest):
    # curl, not urllib: this box sits behind a TLS-inspecting proxy whose root is
    # in the system trust store but not in certifi, so Python's own client fails
    # the handshake. The BC and SK fetchers shell out for the same reason.
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, url],
        check=True,
    )


SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"


def soffice_bin():
    """LibreOffice, wherever this box keeps it."""
    return shutil.which("soffice") or shutil.which("libreoffice") or (
        SOFFICE if os.path.exists(SOFFICE) else None)


def convert_to_pdf(src_path, dest):
    """Render a .doc/.docx to PDF. Returns the converter's version string.

    Only ever called for a form the government publishes in no other format.
    LibreOffice writes `<stem>.pdf` into `--outdir` and gives no way to name the
    output, so it converts into a scratch directory and the result is moved.
    """
    exe = soffice_bin()
    if exe is None:
        raise RuntimeError("LibreOffice not found; cannot convert %s" % src_path)
    outdir = os.path.join(os.path.dirname(dest), "_convert")
    os.makedirs(outdir, exist_ok=True)
    subprocess.run([exe, "--headless", "--convert-to", "pdf", "--outdir", outdir,
                    src_path], check=True, capture_output=True)
    produced = os.path.join(
        outdir, os.path.splitext(os.path.basename(src_path))[0] + ".pdf")
    if not os.path.exists(produced):
        raise RuntimeError("conversion produced nothing for %s" % src_path)
    shutil.move(produced, dest)
    ver = subprocess.run([exe, "--version"], capture_output=True, text=True)
    return " ".join(ver.stdout.split()) or "unknown"


def declared_pages(text):
    """The page count a FOAEAA form prints in its own header ("page 1/3").

    The only independent check available on a converted form: if LibreOffice
    paginates differently from the Word original, the form's own header says so.
    """
    m = re.search(r"page\s*1\s*/\s*(\d+)", text, re.I)
    return int(m.group(1)) if m else None


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


def title_present(src, text):
    """Does the file we got back identify itself as the form we asked for?

    Batches 1 and 2 derive every URL from a form number, so the check is that
    the form prints that number: matched with a trailing boundary that is not a
    dot, so Form 70D does not accept a page of Form 70D.1, since the slug drops
    the dot and that is exactly how a typo lands on the wrong file.

    Batch 3 does not have one URL scheme, and several of its forms print no
    number at all -- the child-protection briefs, the protection orders and the
    federal notices are titled and nothing else. Those rows carry an explicit
    `numberCheck` or `textCheck` instead, and it is used in preference to the
    form number, which for them is a label rather than something printed.
    """
    flat = re.sub(r"\s+", " ", text).lower()
    phrase = src.get("textCheck")
    if phrase:
        return re.sub(r"\s+", " ", phrase).lower() in flat
    number = src.get("numberCheck") or src["formNo"]
    return re.search(r"form\s*%s(?![\w.])" % re.escape(number.lower()),
                     flat) is not None


def main():
    os.makedirs(STAGE, exist_ok=True)
    manifest = []
    for src in all_sources():
        dest = os.path.join(STAGE, "%s_source.pdf" % src["docId"])
        fmt = src.get("sourceFormat", "pdf")
        converter = None
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            try:
                if fmt == "pdf":
                    download(src["url"], dest)
                else:
                    raw_path = os.path.join(
                        STAGE, "%s_source.%s" % (src["docId"], fmt))
                    download(src["url"], raw_path)
                    converter = convert_to_pdf(raw_path, dest)
            except (subprocess.CalledProcessError, RuntimeError) as exc:
                print("DOWNLOAD FAIL %s: %s" % (src["docId"], exc))
                manifest.append(dict(src, ok=False, error="download failed: %s" % exc))
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
        entry["titleFound"] = title_present(src, text)
        entry["pagesMatch"] = pages == src["expectedPages"]
        if fmt != "pdf":
            entry["converted"] = True
            entry["converter"] = converter
            # The form's own header is the only independent check on a
            # rendering; where it prints one, it has to agree.
            declared = declared_pages(text)
            entry["declaredPages"] = declared
            entry["paginationMatch"] = declared is None or declared == pages
        entry["ok"] = (pages > 0 and entry["titleFound"] and entry["pagesMatch"]
                       and entry.get("paginationMatch", True))
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

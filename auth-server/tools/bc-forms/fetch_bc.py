"""Gate A + B: download every BC source PDF, verify it, and write manifest.json.

Verification per file: PDF magic bytes, page count > 0, sha256/bytes recorded,
form number/title text present in the extracted text (guards a wrong GUID),
footer/edition line captured, and AcroForm-vs-XFA classification.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bc_sources import all_sources  # noqa: E402

STAGE = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export/_incoming_bc"


def download(url, dest):
    subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", "-o", dest, url],
        check=True,
    )


def classify(path):
    """Return (pages, n_acroform_fields, is_xfa, text_of_first_pages, footer)."""
    doc = fitz.open(path)
    # An XFA form carries /AcroForm -> /XFA even when it exposes no widgets, and
    # its single classic page is Adobe's "Please wait..." placeholder.
    is_xfa = doc.xref_get_key(doc.pdf_catalog(), "AcroForm/XFA")[0] != "null"
    n_fields = 0
    for page in doc:
        n_fields += len(list(page.widgets()))
    text = "\n".join(doc[i].get_text() for i in range(min(3, doc.page_count)))
    last = doc[doc.page_count - 1].get_text().strip().splitlines()
    footer = next((ln.strip() for ln in reversed(last) if ln.strip()), "")
    pages = doc.page_count
    doc.close()
    return pages, n_fields, is_xfa, text, footer


PLACEHOLDER = "may not be able to display this type of document"


def title_present(src, text):
    """Loose check that the PDF really is the requested form."""
    flat = re.sub(r"\s+", " ", text).lower()
    if src["court"] == "Supreme":
        want = src["formNo"].lower()  # e.g. "f8", "f51.1"
        return re.search(r"form\s*%s\b" % re.escape(want.lstrip("f")), flat) is not None or want in flat
    if src["pfaCode"] and src["pfaCode"].lower() in flat:
        return True
    return re.search(r"form\s*%s\b" % re.escape(src["formNo"]), flat) is not None


def main():
    os.makedirs(STAGE, exist_ok=True)
    manifest = []
    for src in all_sources():
        dest = os.path.join(STAGE, "%s_source.pdf" % src["docId"])
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            try:
                download(src["url"], dest)
            except subprocess.CalledProcessError as exc:
                print("DOWNLOAD FAIL %s: %s" % (src["docId"], exc))
                manifest.append(dict(src, ok=False, error="download failed"))
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
        entry["kind"] = "xfa" if is_xfa or PLACEHOLDER in text else ("acroform" if n_fields else "static")
        entry["placeholder"] = PLACEHOLDER in text
        entry["footerText"] = footer[:120]
        entry["titleFound"] = title_present(src, text)
        entry["ok"] = pages > 0 and (entry["titleFound"] or entry["kind"] == "xfa")
        manifest.append(entry)
        print("%-12s %-9s pages=%-3d fields=%-4d kind=%-8s title=%-5s %s" % (
            src["docId"], src["court"], pages, n_fields, entry["kind"],
            entry["titleFound"], footer[:48]))
    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    bad = [m["docId"] for m in manifest if not m.get("ok")]
    print("\n%d entries, %d flagged: %s" % (len(manifest), len(bad), ", ".join(bad) or "none"))


if __name__ == "__main__":
    main()

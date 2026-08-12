"""Gates A + B for batch 2: download every remaining BC source PDF, verify, manifest.

Same checks as fetch_bc.py (PDF magic, page count, the form's own number/title present
in the text, AcroForm-vs-XFA classification), against bc_sources_batch2 and staging in
_incoming_bc2/ so batch 1's staging and shipped templates are never touched.

Run: python3 fetch_bc2.py
"""
import hashlib
import json
import os
import re
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bc_sources_batch2 import all_sources  # noqa: E402
from fetch_bc import PLACEHOLDER, classify, download  # noqa: E402

STAGE = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
         "/auth-server/form-template-export/_incoming_bc2")


def title_present(src, text):
    """Loose check that the PDF really is the requested form.

    Batch 2 needs a wider net than batch 1: it includes forms addressed by an
    administrative code rather than a rule-book number (PFA907, SUP914, PD-58), and
    Supreme forms with a sub-number the page prints as "FORM F19.3" or "Form F19 .3".
    A hit on the code, the number, or the printed title all count.
    """
    flat = re.sub(r"\s+", " ", text).lower()
    if src.get("pfaCode") and src["pfaCode"].lower().replace("pfa", "pfa ") in flat:
        return True
    if src.get("pfaCode") and src["pfaCode"].lower() in flat:
        return True
    no = src["formNo"].lower()
    if re.search(r"form\s*%s\b" % re.escape(no.lstrip("f")), flat):
        return True
    if re.search(r"\b%s\b" % re.escape(no), flat):
        return True
    # Fall back to the index's own title — enough words to not match by accident.
    words = [w for w in re.findall(r"[a-z]{4,}", src["name"].lower())]
    return bool(words) and sum(1 for w in words if w in flat) >= max(1, len(words) // 2)


def main():
    os.makedirs(STAGE, exist_ok=True)
    manifest = []
    for src in all_sources():
        dest = os.path.join(STAGE, "%s_source.pdf" % src["docId"])
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            download(src["url"], dest)
        raw = open(dest, "rb").read()
        entry = dict(src)
        entry["file"] = os.path.basename(dest)
        entry["bytes"] = len(raw)
        entry["sha256"] = hashlib.sha256(raw).hexdigest()
        if raw[:4] != b"%PDF":
            entry.update(ok=False, error="not a PDF")
            manifest.append(entry)
            continue
        pages, n_fields, is_xfa, text, footer = classify(dest)
        entry["pages"] = pages
        entry["acroFields"] = n_fields
        entry["kind"] = "xfa" if is_xfa or PLACEHOLDER in text else ("acroform" if n_fields else "static")
        entry["placeholder"] = PLACEHOLDER in text
        entry["footerText"] = footer[:120]
        entry["titleFound"] = title_present(src, text)
        entry["ok"] = pages > 0 and (entry["titleFound"] or entry["kind"] == "xfa")
        manifest.append(entry)
        print("%-14s %-11s pages=%-3d fields=%-4d kind=%-8s title=%-5s %s" % (
            src["docId"], src["court"], pages, n_fields, entry["kind"],
            entry["titleFound"], footer[:44]))
    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    bad = [m["docId"] for m in manifest if not m.get("ok")]
    print("\n%d entries, %d flagged: %s" % (len(manifest), len(bad), ", ".join(bad) or "none"))


if __name__ == "__main__":
    main()

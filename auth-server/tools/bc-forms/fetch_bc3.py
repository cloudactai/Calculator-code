"""Gates A + B for batch 3: download the child-protection and adoption sources.

Two kinds of source, so two kinds of fetch:

* `acroform` — a government fillable PDF, downloaded whole, checked exactly as
  batches 1 and 2 were (PDF magic, page count, the form's own number or PFA code
  present in the text, AcroForm-vs-XFA classification).
* `bclaws` — a form set as continuous copy inside a King's Printer consolidation.
  The consolidation is downloaded once and each form is **cut out of it at its
  own enacting heading** (`bclaws_cut.py`) into its own Letter-size PDF, then
  checked the same way. Nothing here trusts a page number: a re-consolidation
  that repaginates moves the heading with the form, and a form whose heading has
  gone raises rather than shipping its neighbour under the right name.

Run: python3 fetch_bc3.py
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch3 as src3  # noqa: E402
import bclaws_cut  # noqa: E402
from fetch_bc import PLACEHOLDER, classify, download  # noqa: E402

STAGE = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
         "/auth-server/form-template-export/_incoming_bc3")


def title_present(src, text):
    """Loose check that the PDF really is the requested form."""
    flat = re.sub(r"\s+", " ", text).lower()
    if src.get("pfaCode") and src["pfaCode"].lower().replace("pfa", "pfa ") in flat:
        return True
    if src.get("pfaCode") and src["pfaCode"].lower() in flat:
        return True
    if re.search(r"form\s*%s\b" % re.escape(src["formNo"]), flat):
        return True
    words = re.findall(r"[a-z]{4,}", src["name"].lower())
    return bool(words) and sum(1 for w in words if w in flat) >= max(1, len(words) // 2)


def consolidation(url, name):
    """Download a King's Printer consolidation once and keep it in staging."""
    path = os.path.join(STAGE, "_reg_%s.pdf" % name)
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        download(url, path)
    return path


def only_form(path, form_no):
    """True if the cut carries this form's heading and no other form's.

    The cut is made at the headings, so a second enacting heading in the output
    means a neighbouring form came along with it.
    """
    doc = fitz.open(path)
    text = " ".join(doc[i].get_text() for i in range(doc.page_count))
    doc.close()
    found = set(re.findall(r"FORM\s+(\d+(?:\.\d+)?)", text.upper()))
    return found == {form_no}


def main():
    os.makedirs(STAGE, exist_ok=True)
    regs = {}
    manifest = []
    for src in src3.all_sources():
        dest = os.path.join(STAGE, "%s_source.pdf" % src["docId"])
        entry = dict(src)
        if src["kind"] == "bclaws":
            reg = src["reg"]
            if reg not in regs:
                regs[reg] = consolidation(src["url"], reg)
            bclaws_cut.cut(regs[reg], src["formNo"], src3.SCHEDULE[reg], dest)
            entry["regSha256"] = hashlib.sha256(open(regs[reg], "rb").read()).hexdigest()
            entry["cutClean"] = only_form(dest, src["formNo"])
            if not entry["cutClean"]:
                entry.update(ok=False, error="cut carries a second form's heading")
                manifest.append(entry)
                print("CUT MISMATCH %s: %s" % (src["docId"], entry["error"]))
                continue
        elif not os.path.exists(dest) or os.path.getsize(dest) == 0:
            try:
                download(src["url"], dest)
            except subprocess.CalledProcessError as exc:
                print("DOWNLOAD FAIL %s: %s" % (src["docId"], exc))
                manifest.append(dict(entry, ok=False, error="download failed"))
                continue

        raw = open(dest, "rb").read()
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
        entry["actualKind"] = ("xfa" if is_xfa or PLACEHOLDER in text
                               else "acroform" if n_fields else "static")
        entry["footerText"] = footer[:120]
        entry["titleFound"] = title_present(src, text)
        entry["ok"] = pages > 0 and entry["titleFound"] and entry["actualKind"] != "xfa"
        if src["kind"] == "acroform" and entry["actualKind"] != "acroform":
            entry.update(ok=False, error="expected AcroForm, got %s" % entry["actualKind"])
        manifest.append(entry)
        print("%-20s %-9s pages=%-3d fields=%-4d kind=%-8s title=%-5s %s" % (
            src["docId"], src["family"], pages, n_fields, entry["actualKind"],
            entry["titleFound"], footer[:40]))

    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    bad = [m["docId"] for m in manifest if not m.get("ok")]
    print("\n%d entries, %d flagged: %s" % (len(manifest), len(bad), ", ".join(bad) or "none"))


if __name__ == "__main__":
    main()

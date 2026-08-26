"""Prince Edward Island family form sources.

Published by the Courts of PEI on one forms page covering the whole Rules of
Civil Procedure. `pei_sources.json` records the family rows, captured from that
page; this module adds the docId and the picker category.

docId scheme: `PEISC_<formNo>` with the punctuation folded --
"70I(A)" -> PEISC_70I_A, "70A*" -> PEISC_70A_JOINT, "70BB.1" -> PEISC_70BB_1.

## Scope

**34 forms** -- the whole of the two family rules:

| Rule | What it is | Forms |
| --- | --- | --- |
| 70 | Divorce Actions | 31 |
| 71 | Family Law Proceedings | 3 |

**Rule 65 is Estates of Deceased Persons, not family**, and is out of scope. It
is worth naming because it is the trap on this page: Rule 65 carries the largest
form family PEI publishes -- 65A through 65DDD, about 72 forms -- and a scoping
pass that went by form count rather than by reading the rule titles would have
pulled the entire probate set in. Probate is deliberately out of scope in every
province of this catalogue.

## Two sources per form, and why the Word one is used

PEI publishes most forms twice: a fillable PDF and a `.doc`/`.docx`. **The Word
document is what this pipeline builds from, for all 34.**

The fillable PDFs are **XFA** -- Adobe LiveCycle documents that render as the
"Please wait…" placeholder outside Adobe and carry no AcroForm layer at all
(`f-70a.pdf` reports 0 widgets and `AcroForm/XFA` present). Building from them
means the headless pdf.js + Chrome flatten BC's Supreme set needs, which is the
most fragile path in this repo -- it needed a pdf.js source patch to stop
`<signature>` widgets dropping their captions, and a local HTTP server to render
against.

Against that, only 17 of the 34 forms have a PDF at all, while **all 34 have a
Word version**, and the Word renders carry the anchors the detectors want: Form
70A alone prints 49 underscore runs and 41 tick glyphs, and Form 70I(A)
(Statement of Income) sets its income table as a ruled grid. So the Word path is
both uniform across the batch and lower-risk.

The cost is recorded rather than hidden: **the background is ours, not the
government's**, exactly as in Nova Scotia. If PEI's XFA geometry is ever wanted,
the flatten route is `tools/bc-forms/xfa/` and the sources are in
`pei_sources.json` under `pdf`.

## Fetching

The `courts.pe.ca` **HTML pages sit behind a Radware bot-check** that curl
cannot pass -- which is why `pei_sources.json` was captured with a real browser
rather than scraped. The **file host is not gated**: everything under
`/sites/.../files/` fetches fine with curl, so `fetch_pei.py` needs no browser.
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, "pei_sources.json")

COURT = "Supreme Court of Prince Edward Island (Family Section)"

CATEGORY = {
    "70A": "Pleadings", "70A*": "Pleadings", "70B": "Pleadings",
    "70B*": "Pleadings", "70D": "Pleadings", "70E": "Pleadings",
    "70F": "Pleadings", "70G": "Pleadings", "70H": "Pleadings",
    "70I(A)": "Financial", "70I(B)": "Financial", "70I(C)": "Financial",
    "70I(D)": "Financial", "70J": "Financial",
    "70AA": "Case Management", "70BB": "Case Management",
    "70BB.1": "Case Management", "70CC": "Case Management",
    "70C": "Service", "70DD": "Service", "70EE": "Service",
    "70M": "Child Protection", "70N": "Child Protection",
    "70O": "Applications", "70P": "Affidavits", "70Q": "Affidavits",
    "70V": "Affidavits",
    "70R": "Divorce & Judgment", "70S": "Divorce & Judgment",
    "70T": "Divorce & Judgment", "70U": "Divorce & Judgment",
    "71A": "Enforcement", "71B": "Enforcement", "71E": "Enforcement",
}

CATEGORY_ORDER = [
    "Pleadings",
    "Financial",
    "Applications",
    "Case Management",
    "Service",
    "Affidavits",
    "Divorce & Judgment",
    "Child Protection",
    "Enforcement",
    "Other",
]

SHIPPED_CATEGORIES = set(CATEGORY_ORDER)


def doc_id(form_no):
    # "70A*" is the court's own marker for the joint version of Form 70A, which
    # is a different document with the same number; spelling it out keeps the
    # docId readable and free of a character no filename should carry.
    if form_no.endswith("*"):
        return "PEISC_" + form_no[:-1] + "_JOINT"
    slug = re.sub(r"[()]", "_", form_no).replace(".", "_")
    return "PEISC_" + re.sub(r"_+", "_", slug).strip("_")


def sort_key(form_no):
    match = re.match(r"^(\d+)([A-Z]+)?", form_no)
    if not match:
        return (999, "", form_no)
    return (int(match.group(1)), match.group(2) or "", form_no)


def all_sources():
    data = json.load(open(SOURCES))
    base = data["base"]
    out = []
    for row in data["forms"]:
        form_no = row["formNo"]
        out.append({
            "formNo": form_no,
            "docId": doc_id(form_no),
            "title": row["title"],
            "rule": row["rule"],
            "category": CATEGORY.get(form_no, "Other"),
            # The Word document, for every form -- see the module docstring.
            "url": base + row["word"],
            "pdfUrl": (base + row["pdf"]) if row.get("pdf") else None,
            "court": COURT,
        })
    out.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]),
                            sort_key(r["formNo"])))
    return out


def shipped_sources():
    return [r for r in all_sources() if r["category"] in SHIPPED_CATEGORIES]

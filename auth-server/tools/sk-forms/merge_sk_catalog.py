"""Merge the Saskatchewan rows into catalog.json + audit.json (gate H prep).

Saskatchewan gets its own contiguous sortOrder block, clear of every other
province. The API filters by province, so sortOrder only orders forms *within*
Saskatchewan and none of the other provinces moves.

**Where that block starts is read from the catalog, not written down here.**
This used to hardcode 301, "clear of Ontario's 1-135 and BC's 101-288" — but BC
has since grown to 313, and Manitoba now occupies 501-543, so the hardcoded 301
had quietly drifted into BC's block (`auth-server/tools/mb-forms/merge_mb_catalog.py`
hit the identical bug first; this is the same fix). Rounding up from whatever the
other provinces currently occupy keeps the block clear without anyone having to
remember to edit a constant here.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from sk_sources import CATEGORY_ORDER, all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
SK_BLOCK = 100  # blocks are allocated a round hundred at a time
# The picker groups by category and BC already sets the house style: an en dash
# between the court and the function, not a hyphen.
DASH = "–"

# The King's Printer's product names, tidied where they read as a fragment out of
# the context of its own index. "Financial Statement of" is the form's heading
# with the party's name struck off the end; "Affidavit or Respondent" is a
# typo in the publications catalogue for Form 15-82, whose own first page reads
# "Affidavit of Petitioner (or Respondent)".
TITLE_OVERRIDE = {
    "15-47": "Financial Statement",
    "15-49": "Property Statement",
    "15-82": "Affidavit of Petitioner (or Respondent)",
}


def sk_start(keep):
    """The next free hundred above every other province's rows."""
    highest = max(item["sortOrder"] for item in keep)
    return (highest // SK_BLOCK + 1) * SK_BLOCK + 1


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    manifest = {m["docId"]: m for m in
                json.load(open(os.path.join(EXPORT, "_incoming_sk", "manifest.json")))}

    keep = [item for item in catalog if item.get("province") != "SK"]
    other_orders = [(item["province"], item["sortOrder"]) for item in keep]
    assert len(set(other_orders)) == len(other_orders), "sortOrder collision outside SK"
    start = sk_start(keep)

    rows = []
    for offset, src in enumerate(all_sources()):
        doc_id = src["docId"]
        pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
        doc = fitz.open(pdf)
        page_count = doc.page_count
        doc.close()
        title = TITLE_OVERRIDE.get(src["formNo"], src["title"])
        rows.append({
            "title": "Form %s - %s" % (src["formNo"], title),
            "shortTitle": "SK KB %s" % src["formNo"],
            "footerText": manifest[doc_id].get("footerText") or None,
            "status": "active",
            "fileName": "%s.pdf" % doc_id,
            "docId": doc_id,
            "province": "SK",
            "category": src["category"].replace(" - ", " %s " % DASH),
            "version": 1,
            "pageCount": page_count,
            "sortOrder": start + offset,
        })

    merged = keep + rows
    with open(os.path.join(EXPORT, "catalog.json"), "w") as fh:
        json.dump(merged, fh, indent=2)
        fh.write("\n")

    included = []
    for item in merged:
        mapping = json.load(open(os.path.join(EXPORT, "%s.json" % item["docId"])))
        included.append({"docId": item["docId"], "pdf": "%s.pdf" % item["docId"],
                         "mapping": "%s.json" % item["docId"],
                         "fields": len(mapping["staticFields"])})
    audit = {"included": included, "excluded": [],
             "counts": {"included": len(included), "excluded": 0}}
    with open(os.path.join(EXPORT, "audit.json"), "w") as fh:
        json.dump(audit, fh, indent=2)
        fh.write("\n")

    counts = {}
    for item in merged:
        counts[item["province"]] = counts.get(item["province"], 0) + 1
    print("catalog: %d rows %s" % (len(merged), counts))
    for category in CATEGORY_ORDER:
        group = [r for r in rows if r["category"].endswith(category)]
        print("  %-22s %d" % (category, len(group)))
        for row in group:
            print("      %-4d %-13s %s" % (row["sortOrder"], row["docId"], row["title"][:52]))


if __name__ == "__main__":
    main()

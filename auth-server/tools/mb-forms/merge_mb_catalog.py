"""Merge the Manitoba rows into catalog.json + audit.json (gate H prep).

Manitoba gets its own contiguous sortOrder block, clear of every other province.
The API filters by province, so sortOrder only orders forms *within* Manitoba and
none of the other provinces moves.

**Where that block starts is read from the catalog, not written down here.** It
was 401 when this batch shipped, against BC's 101-288 and Saskatchewan's 301-340;
BC has since grown to 313 and Saskatchewan moved to 401-440, so the hardcoded
401 had come to name Saskatchewan's block, and re-running this tool silently
moved all five Manitoba rows on top of it. Rounding up from whatever the other
provinces currently occupy keeps the block clear without anyone having to
remember to edit a constant here.

Only the shipped batch is written. A row for a form that has not been built would
advertise a template the API cannot serve, so `mb_sources.SHIPPED_CATEGORIES` is
the single switch: add a category there, build it, and re-run this.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mb_sources import CATEGORY_ORDER, shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
MB_BLOCK = 100  # blocks are allocated a round hundred at a time
# The picker groups by category and BC set the house style: an en dash between
# the court and the function, not a hyphen.
DASH = "–"


def mb_start(keep):
    """The next free hundred above every other province's rows."""
    highest = max(item["sortOrder"] for item in keep)
    return (highest // MB_BLOCK + 1) * MB_BLOCK + 1


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    manifest = {m["docId"]: m for m in
                json.load(open(os.path.join(EXPORT, "_incoming_mb", "manifest.json")))}

    keep = [item for item in catalog if item.get("province") != "MB"]
    other_orders = [(item["province"], item["sortOrder"]) for item in keep]
    assert len(set(other_orders)) == len(other_orders), "sortOrder collision outside MB"

    start = mb_start(keep)
    rows = []
    for offset, src in enumerate(shipped_sources()):
        doc_id = src["docId"]
        doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        page_count = doc.page_count
        doc.close()
        rows.append({
            # Most forms are "Form 70D", so the picker reads "Form 70D - Financial
            # Statement". A batch-3 family that is not numbered that way -- a
            # relocation Schedule, a child-protection brief, a protection-order
            # application carrying a CRT number, a practice-directive appendix --
            # carries its own `catalogTitle` rather than being forced through a
            # template that would print "Form Form 1" or "Form Intake Brief of
            # Agency - Intake Brief of Agency".
            "title": src.get("catalogTitle") or "Form %s - %s" % (src["formNo"], src["title"]),
            "shortTitle": src.get("shortTitle") or "MB KB %s" % src["formNo"],
            "footerText": manifest[doc_id].get("footerText") or None,
            "status": "active",
            "fileName": "%s.pdf" % doc_id,
            "docId": doc_id,
            "province": "MB",
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
    short = {r["docId"]: s["shortCategory"]
             for r, s in zip(rows, shipped_sources())}
    for category in CATEGORY_ORDER:
        # Matched on the source's own `shortCategory`: the row's category has had
        # its hyphen swapped for the picker's en dash, so `endswith` on the
        # written name stopped matching as soon as a batch-2 category
        # ("Child Protection - Applications") carried one.
        group = [r for r in rows if short[r["docId"]] == category]
        if not group:
            continue
        print("  %-22s %d" % (category, len(group)))
        for row in group:
            print("      %-4d %-13s %s" % (row["sortOrder"], row["docId"], row["title"][:56]))


if __name__ == "__main__":
    main()

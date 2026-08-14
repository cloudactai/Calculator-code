"""Merge the Manitoba rows into catalog.json + audit.json (gate H prep).

Manitoba gets its own contiguous sortOrder block starting at 401, clear of
Ontario's 1-135, BC's 101-288 and Saskatchewan's 301-340. The API filters by
province, so sortOrder only orders forms *within* Manitoba and none of the other
provinces moves.

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
MB_START = 401
# The picker groups by category and BC set the house style: an en dash between
# the court and the function, not a hyphen.
DASH = "–"


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    manifest = {m["docId"]: m for m in
                json.load(open(os.path.join(EXPORT, "_incoming_mb", "manifest.json")))}

    keep = [item for item in catalog if item.get("province") != "MB"]
    other_orders = [(item["province"], item["sortOrder"]) for item in keep]
    assert len(set(other_orders)) == len(other_orders), "sortOrder collision outside MB"

    rows = []
    for offset, src in enumerate(shipped_sources()):
        doc_id = src["docId"]
        doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        page_count = doc.page_count
        doc.close()
        rows.append({
            "title": "Form %s - %s" % (src["formNo"], src["title"]),
            "shortTitle": "MB KB %s" % src["formNo"],
            "footerText": manifest[doc_id].get("footerText") or None,
            "status": "active",
            "fileName": "%s.pdf" % doc_id,
            "docId": doc_id,
            "province": "MB",
            "category": src["category"].replace(" - ", " %s " % DASH),
            "version": 1,
            "pageCount": page_count,
            "sortOrder": MB_START + offset,
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
        if not group:
            continue
        print("  %-22s %d" % (category, len(group)))
        for row in group:
            print("      %-4d %-13s %s" % (row["sortOrder"], row["docId"], row["title"][:56]))


if __name__ == "__main__":
    main()

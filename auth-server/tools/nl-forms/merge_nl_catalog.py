"""Merge the Newfoundland rows into catalog.json + audit.json.

Newfoundland gets its own contiguous sortOrder block, clear of every other
province. The API filters by province, so sortOrder only orders forms *within*
Newfoundland and none of the other provinces moves.

**Where that block starts is read from the catalog, not written down here.**
Saskatchewan's merger hardcoded 301 and Manitoba's hardcoded 401; both quietly
drifted into a neighbour's block as the other provinces grew, and re-running the
tool silently moved a whole province on top of another. Rounding up from
whatever the catalogue currently occupies keeps the block clear without anyone
having to remember to edit a constant here. **Re-running a catalog tool is not
side-effect free**, so this one derives.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from nl_sources import shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
BLOCK = 100  # blocks are allocated a round hundred at a time


def nl_start(keep):
    """The next free hundred above every other province's rows."""
    highest = max(item["sortOrder"] for item in keep)
    return (highest // BLOCK + 1) * BLOCK + 1


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    manifest = {m["docId"]: m for m in
                json.load(open(os.path.join(EXPORT, "_incoming_nl", "manifest.json")))}

    keep = [item for item in catalog if item.get("province") != "NL"]
    other = [(item["province"], item["sortOrder"]) for item in keep]
    assert len(set(other)) == len(other), "sortOrder collision outside NL"
    start = nl_start(keep)

    rows = []
    for offset, src in enumerate(shipped_sources()):
        doc_id = src["docId"]
        pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
        if not os.path.exists(pdf):
            sys.exit("%s not promoted -- run build_nl_forms.py --promote first" % doc_id)
        doc = fitz.open(pdf)
        page_count = doc.page_count
        doc.close()
        rows.append({
            # A numbered form reads "Form F10.02A - Financial Statement". The 17
            # the court publishes with no number would otherwise print
            # "Form ORDER_BLANK - ...", so they carry their printed name alone.
            "title": ("Form %s - %s" % (src["formNo"], src["title"])
                      if src["numbered"] else src["title"]),
            "shortTitle": (("NL %s" % src["formNo"]) if src["numbered"]
                           else src["title"][:40]),
            "footerText": manifest[doc_id].get("footerText") or None,
            "status": "active",
            "fileName": "%s.pdf" % doc_id,
            "docId": doc_id,
            "province": "NL",
            "category": src["category"],
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
    print("NL block: %d..%d" % (start, start + len(rows) - 1))
    seen = []
    for row in rows:
        if row["category"] not in seen:
            seen.append(row["category"])
    for category in seen:
        group = [r for r in rows if r["category"] == category]
        print("  %-30s %d" % (category, len(group)))


if __name__ == "__main__":
    main()

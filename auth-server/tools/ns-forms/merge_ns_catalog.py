"""Merge the Nova Scotia rows into catalog.json + audit.json.

Nova Scotia gets its own contiguous sortOrder block, clear of every other
province. The API filters by province, so sortOrder only orders forms *within*
Nova Scotia and none of the other provinces moves.

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
from ns_iso_sources import shipped_sources as iso_sources  # noqa: E402
from ns_sources import shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
BLOCK = 100  # blocks are allocated a round hundred at a time


def ns_start(keep):
    """The next free hundred above every other province's rows."""
    highest = max(item["sortOrder"] for item in keep)
    return (highest // BLOCK + 1) * BLOCK + 1


def rows_to_merge():
    """Both Nova Scotia batches, each carrying how it names itself.

    The 84 rule forms all have a number and take the "Form 59.09 - Petition for
    Divorce" shape. Three of the 18 ISO forms have no number at all -- the ISO
    Affidavit, the Additional Locate Information form, the Notice to Set Aside
    Registration -- so that shape would print a dangling "Form  - " for them and
    each carries its own catalogue title instead.
    """
    for src in shipped_sources():
        yield {"src": src, "batch": "_incoming_ns",
               "title": "Form %s - %s" % (src["formNo"], src["title"]),
               "shortTitle": "NS %s" % src["formNo"]}
    for src in iso_sources():
        yield {"src": src, "batch": "_incoming_ns_iso",
               "title": src["catalogTitle"], "shortTitle": src["shortTitle"]}


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    manifest = {}
    for batch in ("_incoming_ns", "_incoming_ns_iso"):
        for item in json.load(open(os.path.join(EXPORT, batch, "manifest.json"))):
            manifest[item["docId"]] = item

    keep = [item for item in catalog if item.get("province") != "NS"]
    other = [(item["province"], item["sortOrder"]) for item in keep]
    assert len(set(other)) == len(other), "sortOrder collision outside NL"
    start = ns_start(keep)

    rows = []
    for offset, entry in enumerate(rows_to_merge()):
        src = entry["src"]
        doc_id = src["docId"]
        pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
        if not os.path.exists(pdf):
            sys.exit("%s not promoted -- run the builder for %s with --promote first"
                     % (doc_id, entry["batch"]))
        doc = fitz.open(pdf)
        page_count = doc.page_count
        doc.close()
        rows.append({
            "title": entry["title"],
            "shortTitle": entry["shortTitle"],
            "footerText": manifest[doc_id].get("footerText") or None,
            "status": "active",
            "fileName": "%s.pdf" % doc_id,
            "docId": doc_id,
            "province": "NS",
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
    print("NS block: %d..%d" % (start, start + len(rows) - 1))
    seen = []
    for row in rows:
        if row["category"] not in seen:
            seen.append(row["category"])
    for category in seen:
        group = [r for r in rows if r["category"] == category]
        print("  %-30s %d" % (category, len(group)))


if __name__ == "__main__":
    main()

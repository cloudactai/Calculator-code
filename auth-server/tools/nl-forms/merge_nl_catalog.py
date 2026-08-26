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
from nl_pc_sources import shipped_sources as pc_sources  # noqa: E402
from nl_sources import CATEGORY_ORDER, shipped_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
BLOCK = 100  # blocks are allocated a round hundred at a time


def nl_start(keep):
    """The next free hundred above every other province's rows."""
    highest = max(item["sortOrder"] for item in keep)
    return (highest // BLOCK + 1) * BLOCK + 1


def rows_to_merge():
    """Both Newfoundland batches, each carrying how it names itself.

    The Supreme Court set numbers most of its forms ("Form F10.02A - Financial
    Statement") and leaves 17 unnumbered, which carry their printed name alone.
    The Provincial Court set numbers nothing the same way -- Form 1 to Form 8B,
    AF001 to AF006, and the protection set 001 to 012 -- so its short titles
    name the court as well, which is what tells the two "Notice of Hearing"
    forms apart in the picker.
    """
    out = []
    for src in shipped_sources():
        src = dict(src)
        src["catalogTitle"] = ("Form %s - %s" % (src["formNo"], src["title"])
                               if src["numbered"] else src["title"])
        src["catalogShortTitle"] = (("NL %s" % src["formNo"])
                                    if src["numbered"] else src["title"][:40])
        out.append(src)
    rows = json.load(open(os.path.join(
        EXPORT, "_incoming_nl_pc", "out", "nl_pc_rows.json")))
    built = {row["docId"]: row for row in rows}
    for src in pc_sources():
        src = dict(src)
        row = built[src["docId"]]
        src["catalogTitle"] = row["title"]
        src["catalogShortTitle"] = row["shortTitle"]
        out.append(src)
    # Both batches interleaved by category, so the picker's folders read the
    # same whichever court a form comes from. Order inside a category is the
    # order each batch lists its own forms in.
    return sorted(enumerate(out),
                  key=lambda pair: (CATEGORY_ORDER.index(pair[1]["category"]),
                                    pair[0]))


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    manifest = {}
    for batch in ("_incoming_nl", "_incoming_nl_pc"):
        for item in json.load(open(os.path.join(EXPORT, batch, "manifest.json"))):
            manifest[item["docId"]] = item

    keep = [item for item in catalog if item.get("province") != "NL"]
    other = [(item["province"], item["sortOrder"]) for item in keep]
    assert len(set(other)) == len(other), "sortOrder collision outside NL"
    start = nl_start(keep)

    rows = []
    for offset, (_, src) in enumerate(rows_to_merge()):
        doc_id = src["docId"]
        pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
        if not os.path.exists(pdf):
            sys.exit("%s not promoted -- run build_nl_forms.py --promote first" % doc_id)
        doc = fitz.open(pdf)
        page_count = doc.page_count
        doc.close()
        rows.append({
            "title": src["catalogTitle"],
            "shortTitle": src["catalogShortTitle"],
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

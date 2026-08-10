"""Merge the new Ontario rows into catalog.json and regenerate audit.json.

The whole ON block is re-sequenced into the order the government's own index
lists the forms, so each category folder reads the way a lawyer expects (8, 8.01,
8A, 8B, 8B.1 …) instead of putting 80 new forms after the original 45. Only
`sortOrder` changes on the shipped rows — title, category, docId and every
template file are left exactly as they are.

`sortOrder` is only ever read inside a province-filtered query
(`formsRoutes.js` orders by sortOrder within `where.province`), so ON's numbers
running past BC's 101 block is not a collision.

Run: python3 merge_on_catalog.py [--promote]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))

# Form 00 is our own Continuing Record cover — no government form exists, so it
# has no index position and stays first.
CUSTOM_FIRST = {"Form00": -1}


def index_order():
    sources = json.load(open(os.path.join(HERE, "on_sources.json")))
    from fetch_on import doc_id
    return {doc_id(row["num"]): position for position, row in enumerate(sources)}


def main():
    promote = "--promote" in sys.argv
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    new_rows = json.load(open(os.path.join(EXPORT, "_incoming_on", "out", "on_rows.json")))
    order = index_order()

    # A row this batch produced replaces its own earlier copy — re-running the
    # merge after a rebuild is expected. A row that collides with a template from
    # a *different* province is a real mistake and stops the merge.
    rebuilt = {row["docId"] for row in new_rows}
    clashes = [item["docId"] for item in catalog
               if item["docId"] in rebuilt and item.get("province") != "ON"]
    if clashes:
        raise SystemExit("these docIds are catalogued under another province: %s" % ", ".join(clashes))

    on_rows = [item for item in catalog
               if item.get("province") == "ON" and item["docId"] not in rebuilt] + new_rows
    others = [item for item in catalog if item.get("province") != "ON"]
    for row in new_rows:
        row.pop("_indexOrder", None)

    on_rows.sort(key=lambda item: CUSTOM_FIRST.get(item["docId"], order.get(item["docId"], 10 ** 6)))
    for position, row in enumerate(on_rows, start=1):
        row["sortOrder"] = position

    merged = on_rows + others
    included = []
    for item in merged:
        mapping = json.load(open(os.path.join(EXPORT, "%s.json" % item["docId"])))
        included.append({"docId": item["docId"], "pdf": "%s.pdf" % item["docId"],
                         "mapping": "%s.json" % item["docId"], "fields": len(mapping["staticFields"])})
    audit = {"included": included, "excluded": [], "counts": {"included": len(included), "excluded": 0}}

    print("catalog would hold %d rows (%d ON, %d other); %d new"
          % (len(merged), len(on_rows), len(others), len(new_rows)))
    folders = {}
    for row in on_rows:
        folders.setdefault(row["category"], []).append(row["shortTitle"])
    for category in sorted(folders):
        print("  %-28s %2d  %s" % (category, len(folders[category]), " ".join(folders[category])))

    if not promote:
        print("\ndry run — pass --promote to write catalog.json and audit.json")
        return
    with open(os.path.join(EXPORT, "catalog.json"), "w") as fh:
        json.dump(merged, fh, indent=2)
        fh.write("\n")
    with open(os.path.join(EXPORT, "audit.json"), "w") as fh:
        json.dump(audit, fh, indent=2)
        fh.write("\n")
    print("\nwrote catalog.json and audit.json")


if __name__ == "__main__":
    main()

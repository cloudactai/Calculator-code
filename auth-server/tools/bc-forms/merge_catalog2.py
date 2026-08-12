"""Promote the batch-2 templates and rewrite the BC block of catalog.json.

The BC block keeps one contiguous `sortOrder` run (the API filters by province, so
Ontario's ordering is untouched), and the two batches are interleaved by court, folder
and form number rather than appended — a picker that listed Form F1 after Form F96
because it shipped later would be unusable.

Batch 1's rows are read back from the shipped catalog rather than rebuilt, so nothing
here can disturb a template whose geometry the user has already reviewed; only their
`sortOrder` and `category` move, and the category only to match batch 2's folder naming.

    python3 merge_catalog2.py [--promote]

Without --promote it prints the resulting order and writes nothing.
"""
import argparse
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch2 as src2  # noqa: E402

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
OUT = os.path.join(EXPORT, "_incoming_bc2", "out")
BC_START = 101

COURT_ORDER = ["Supreme", "Provincial"]


def folder_order(court):
    return src2.SUP_CATEGORY_ORDER if court == "Supreme" else src2.PROV_CATEGORY_ORDER


def parse_category(category):
    """'Supreme Court – Applications' -> ('Supreme', 'Applications')."""
    court, _, folder = category.partition(" Court – ")
    return court, folder


def form_key(row):
    """Numeric where the form has a number; lettered codes sort after, by name."""
    short = row["shortTitle"]
    raw = short.split()[-1].lstrip("F")
    try:
        return (0, float(raw), "")
    except ValueError:
        return (1, 0.0, short)


def sort_key(row):
    court, folder = parse_category(row["category"])
    order = folder_order(court)
    return (COURT_ORDER.index(court) if court in COURT_ORDER else 9,
            order.index(folder) if folder in order else 99,
            form_key(row))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()

    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    batch2 = json.load(open(os.path.join(OUT, "bc2_rows.json")))
    new_ids = {row["docId"] for row in batch2}

    other = [item for item in catalog if item.get("province") != "BC"]
    batch1 = [item for item in catalog
              if item.get("province") == "BC" and item["docId"] not in new_ids]
    orders = [item["sortOrder"] for item in other]
    assert len(set(orders)) == len(orders), "non-BC sortOrder collision"

    rows = batch1 + batch2
    unknown = [r["category"] for r in rows if parse_category(r["category"])[1]
               not in folder_order(parse_category(r["category"])[0])]
    assert not unknown, "category not in a folder order: %s" % sorted(set(unknown))
    rows.sort(key=sort_key)
    for offset, row in enumerate(rows):
        row["sortOrder"] = BC_START + offset

    if args.promote:
        for row in batch2:
            for extension in ("pdf", "json"):
                shutil.copy(os.path.join(OUT, "%s.%s" % (row["docId"], extension)),
                            os.path.join(EXPORT, "%s.%s" % (row["docId"], extension)))
        print("promoted %d batch-2 templates" % len(batch2))

    merged = other + rows
    # Every catalogued row must have its two files. On a dry run the batch-2 templates
    # are still in staging, so each row is checked where it currently lives.
    for row in rows:
        root = EXPORT if (args.promote or row["docId"] not in new_ids) else OUT
        for extension in ("pdf", "json"):
            path = os.path.join(root, "%s.%s" % (row["docId"], extension))
            assert os.path.exists(path), "catalogued but not on disk: %s" % path

    if args.promote:
        with open(os.path.join(EXPORT, "catalog.json"), "w") as fh:
            json.dump(merged, fh, indent=2)
            fh.write("\n")

        included = []
        for item in merged:
            mapping = json.load(open(os.path.join(EXPORT, "%s.json" % item["docId"])))
            included.append({"docId": item["docId"], "pdf": "%s.pdf" % item["docId"],
                             "mapping": "%s.json" % item["docId"],
                             "fields": len(mapping["staticFields"])})
        with open(os.path.join(EXPORT, "audit.json"), "w") as fh:
            json.dump({"included": included, "excluded": [],
                       "counts": {"included": len(included), "excluded": 0}}, fh, indent=2)
            fh.write("\n")

    print("catalog: %d rows (%d ON, %d BC — %d batch 1, %d batch 2)%s" % (
        len(merged), sum(1 for i in merged if i["province"] == "ON"), len(rows),
        len(batch1), len(batch2), "" if args.promote else "   (dry run)"))
    last = None
    for row in rows:
        if row["category"] != last:
            print("  %s" % row["category"])
            last = row["category"]
        print("     %-4d %-14s %s" % (row["sortOrder"], row["docId"], row["title"][:56]))


if __name__ == "__main__":
    main()

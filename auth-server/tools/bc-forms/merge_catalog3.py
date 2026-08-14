"""Promote the batch-3 templates and rewrite the BC block of catalog.json.

Same shape as `merge_catalog2.py`: the BC block keeps one contiguous `sortOrder`
run, batches are interleaved by court, folder and form number rather than
appended, and the rows of the earlier batches are read back from the shipped
catalog so nothing here can disturb a template whose geometry has been reviewed —
only its `sortOrder` moves.

Batch 3 adds three folders and needs the run to grow past where Saskatchewan
starts, so the other provinces' blocks are pushed out to keep every `sortOrder`
unique. Their *order* is untouched; only the numbers change, and the API filters
by province before sorting, so no picker sees the difference.

    python3 merge_catalog3.py [--promote]

Without --promote it prints the resulting order and writes nothing.
"""
import argparse
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch2 as src2  # noqa: E402
import bc_sources_batch3 as src3  # noqa: E402

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
OUT = os.path.join(EXPORT, "_incoming_bc3", "out")

BC_START = 101
# Where each of the other provinces' blocks restarts once BC has grown. Round
# numbers with room to spare, so the next batch does not move them again.
PROVINCE_START = {"SK": 401, "MB": 501}

COURT_ORDER = ["Supreme", "Provincial", "Adoption"]

# Batch 3's folders, added to batch 2's orders. Adoption sits with the other
# Supreme Court originating processes, after Divorce. Child protection goes last
# in the Provincial block: it is a different statute from the Family Law Act
# forms above it, and a lawyer reaching for Form 3 must not find the CFCSA one.
SUP_CATEGORY_ORDER = src2.SUP_CATEGORY_ORDER[:]
SUP_CATEGORY_ORDER.insert(SUP_CATEGORY_ORDER.index("Divorce") + 1, "Adoption")
PROV_CATEGORY_ORDER = src2.PROV_CATEGORY_ORDER + ["Child Protection"]
ADOPTION_CATEGORY_ORDER = ["Director of Adoption"]

# Inside the one Child Protection folder, forms group by what they do.
CFCSA_FOLDER = {s["docId"]: s["folder"] for s in src3.all_sources()
                if s["family"] == "CFCSA"}


def folder_order(court):
    return {"Supreme": SUP_CATEGORY_ORDER,
            "Provincial": PROV_CATEGORY_ORDER}.get(court, ADOPTION_CATEGORY_ORDER)


def parse_category(category):
    """'Supreme Court – Applications' -> ('Supreme', 'Applications')."""
    for separator in (" Court – ", " – "):
        court, found, folder = category.partition(separator)
        if found:
            return court, folder
    return category, ""


def form_key(row):
    """Numeric where the form has a number; lettered codes sort after, by name."""
    short = row["shortTitle"]
    raw = short.split()[-1].lstrip("F")
    try:
        return (0, src3.form_key(raw), "")
    except ValueError:
        return (1, (), short)


def sort_key(row):
    court, folder = parse_category(row["category"])
    order = folder_order(court)
    within = CFCSA_FOLDER.get(row["docId"])
    return (COURT_ORDER.index(court) if court in COURT_ORDER else 9,
            order.index(folder) if folder in order else 99,
            src3.CFCSA_FOLDER_ORDER.index(within) if within else 0,
            form_key(row))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()

    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    batch3 = json.load(open(os.path.join(OUT, "bc3_rows.json")))
    new_ids = {row["docId"] for row in batch3}

    earlier = [item for item in catalog
               if item.get("province") == "BC" and item["docId"] not in new_ids]
    rows = earlier + batch3
    unknown = [r["category"] for r in rows
               if parse_category(r["category"])[1] not in folder_order(
                   parse_category(r["category"])[0])]
    assert not unknown, "category not in a folder order: %s" % sorted(set(unknown))
    rows.sort(key=sort_key)
    for order, row in enumerate(rows, start=BC_START):
        row["sortOrder"] = order

    others = [item for item in catalog if item.get("province") != "BC"]
    for province, start in PROVINCE_START.items():
        block = sorted((item for item in others if item.get("province") == province),
                       key=lambda item: item["sortOrder"])
        for order, item in enumerate(block, start=start):
            item["sortOrder"] = order

    merged = others + rows
    merged.sort(key=lambda item: (item.get("province") != "ON", item["sortOrder"]))
    orders = [(item["province"], item["sortOrder"]) for item in merged]
    assert len(set(orders)) == len(orders), "sortOrder collision within a province"
    assert len({item["docId"] for item in merged}) == len(merged), "duplicate docId"

    court = None
    for row in rows:
        if parse_category(row["category"])[0] != court:
            court, = [parse_category(row["category"])[0]]
            print("\n--- %s" % court)
        if row["docId"] in new_ids:
            print("  %4d %-20s %-38s %s"
                  % (row["sortOrder"], row["docId"], row["category"], row["title"][:44]))
    print("\nBC block: %d rows, sortOrder %d..%d" % (len(rows), rows[0]["sortOrder"],
                                                     rows[-1]["sortOrder"]))

    if not args.promote:
        return
    for row in batch3:
        for extension in ("pdf", "json"):
            name = "%s.%s" % (row["docId"], extension)
            shutil.copy(os.path.join(OUT, name), os.path.join(EXPORT, name))
    # indent=2, the shipped catalog's own formatting (§9.12): writing it any other
    # way reformats all 393 rows and buries the change.
    with open(os.path.join(EXPORT, "catalog.json"), "w") as fh:
        json.dump(merged, fh, indent=2)
        fh.write("\n")

    included = [{"docId": item["docId"], "pdf": "%s.pdf" % item["docId"],
                 "mapping": "%s.json" % item["docId"],
                 "fields": len(json.load(
                     open(os.path.join(EXPORT, "%s.json" % item["docId"])))["staticFields"])}
                for item in merged]
    with open(os.path.join(EXPORT, "audit.json"), "w") as fh:
        json.dump({"included": included, "excluded": [],
                   "counts": {"included": len(included), "excluded": 0}}, fh, indent=2)
        fh.write("\n")
    print("promoted %d templates and rewrote catalog.json + audit.json" % len(batch3))


if __name__ == "__main__":
    main()

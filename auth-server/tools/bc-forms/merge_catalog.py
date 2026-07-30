"""Merge BC rows into catalog.json + audit.json (gate H prep).

BC gets its own contiguous sortOrder block starting at 101; the API filters by
province, so ON's 1-45 ordering is untouched.
"""
import json
import os

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
BC_START = 101


def main():
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    rows = json.load(open(os.path.join(EXPORT, "_incoming_bc", "out", "bc_rows.json")))
    rows += json.load(open(os.path.join(EXPORT, "_incoming_bc", "out", "bc_sc_rows.json")))

    keep = [item for item in catalog if item.get("province") != "BC"]
    on_orders = [item["sortOrder"] for item in keep]
    assert len(set(on_orders)) == len(on_orders), "ON sortOrder collision"

    for offset, row in enumerate(rows):
        row["sortOrder"] = BC_START + offset
    merged = keep + rows
    with open(os.path.join(EXPORT, "catalog.json"), "w") as fh:
        json.dump(merged, fh, indent=2)
        fh.write("\n")

    included = []
    for item in merged:
        mapping = json.load(open(os.path.join(EXPORT, "%s.json" % item["docId"])))
        included.append({"docId": item["docId"], "pdf": "%s.pdf" % item["docId"],
                         "mapping": "%s.json" % item["docId"], "fields": len(mapping["staticFields"])})
    audit = {"included": included, "excluded": [], "counts": {"included": len(included), "excluded": 0}}
    with open(os.path.join(EXPORT, "audit.json"), "w") as fh:
        json.dump(audit, fh, indent=2)
        fh.write("\n")

    print("catalog: %d rows (%d ON, %d BC)" % (
        len(merged), sum(1 for i in merged if i["province"] == "ON"),
        sum(1 for i in merged if i["province"] == "BC")))
    for row in rows:
        print("  %-4d %-10s %-34s %s" % (row["sortOrder"], row["docId"], row["category"], row["title"][:44]))


if __name__ == "__main__":
    main()

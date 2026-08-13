"""§8 for batch 1, which the type pass was written too late to cover.

`normalise_types_bc2.py` was built while batch 2 was being read and only ever ran over
batch 2's 145 forms. Batch 1's 43 were extracted before it existed, so they still carry the
mismatch it was written for: **246 `TextArea` fields one line tall across 32 forms**, which
the app draws as a multi-line control in a box that cannot hold a second line.

Only **rule 1** is applied here — "a box one line tall is a `TextField`". It is the
unambiguous half of §8: no box under 20 pt can hold a second line, so a multi-line control
in one is wrong whatever its neighbours do. Batch 2's other two rules are deliberately not
run over batch 1:

* the column-majority rule needs the whole batch read page by page before its verdicts can
  be trusted, which is how it was used on batch 2;
* the tall-and-wide rule would flip the labelled **address-for-service** blocks to
  `TextArea`, which is the opposite of what they are being set to below.

## The address-for-service blocks

Requested directly: these should be `TextField` so the text sits vertically centred rather
than top-aligned in a box three lines deep. The government is already of two minds about
them — **F4 p4's is a `TextField` 102 pt tall** while F3, F5, F6, F68 and F89's are
`TextArea` at 48-67 pt — so this settles the family one way rather than inventing a
convention. The trade-off is real and worth stating: a single-line control will not wrap,
so an address longer than about 90 characters runs past the visible box.

Matched on page and geometry, never on field id, so a rebuild that renumbers cannot retype
the wrong box. Only `type` is written; every other key is asserted byte-identical
afterwards (§7.8), and a second run is a no-op (§7.9).

Run: python3 normalise_types_bc1.py [--apply]
"""
import argparse
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources as src1        # noqa: E402
import verify_bc2 as V           # noqa: E402

EXPORT = V.EXPORT
OUT = V.OUT
SINGLE_LINE_MAX = 20.0
TOL = 0.6

# docId -> [(page, x, y, what it is)]. The box a caption reading "Address for service"
# labels, in the forms that draw it as a block rather than a line.
ADDRESS_BOXES = {
    "BCSC_F3": [(4, 185.00, 171.98, "the claimant's address for service")],
    "BCSC_F5": [(3, 165.59, 195.23, "the respondent's address for service")],
    "BCSC_F6": [(3, 168.83, 99.30, "the filing party's address for service")],
    "BCSC_F68": [(2, 214.22, 594.28, "the creditor's address for service")],
    "BCSC_F89": [(2, 72.00, 118.67, "the lawyer's address for service")],
}


def root_for(doc_id):
    """Batch 2 is repaired in staging, batch 1 in the export — decided by what is there."""
    return OUT if os.path.exists(os.path.join(OUT, "%s.pdf" % doc_id)) else EXPORT


def retype(fields, doc_id, one_liners):
    changes = []
    for page_number, x, y, why in ADDRESS_BOXES.get(doc_id, []):
        match = [f for f in fields
                 if f["page"] == page_number and abs(f["x"] - x) <= TOL
                 and abs(f["y"] - y) <= TOL]
        if len(match) != 1:
            raise SystemExit("%s p%d %.2f,%.2f matched %d fields, expected 1"
                             % (doc_id, page_number, x, y, len(match)))
        field = match[0]
        if field["type"] != "TextField":
            changes.append((field, field["type"], "TextField", why))
    if one_liners:
        for field in fields:
            height = field["height"] / V.SCALE
            if field["type"] == "TextArea" and height <= SINGLE_LINE_MAX:
                changes.append((field, "TextArea", "TextField",
                                "one line tall (%.1fpt)" % height))
    for field, _old, new, _why in changes:
        field["type"] = new
    return changes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    batch1 = {source["docId"] for source in src1.all_sources()}
    doc_ids = sorted(batch1 | set(ADDRESS_BOXES))
    total = 0
    per_form = []
    for doc_id in doc_ids:
        root = root_for(doc_id)
        path = os.path.join(root, "%s.json" % doc_id)
        if not os.path.exists(path):
            continue
        mapping = json.load(open(path))
        before = copy.deepcopy(mapping["staticFields"])
        changes = retype(mapping["staticFields"], doc_id, doc_id in batch1)
        if not changes:
            continue
        addresses = [c for c in changes if not c[3].startswith("one line")]
        for field, old, new, why in addresses:
            print("%-12s p%-2d %-9s -> %-9s at %6.1f,%6.1f  (%s)"
                  % (doc_id, field["page"], old, new, field["x"], field["y"], why))
        per_form.append((doc_id, len(changes), len(addresses)))
        total += len(changes)

        by_id = {int(f["id"]): f for f in mapping["staticFields"]}
        for old_field in before:
            new_field = by_id[int(old_field["id"])]
            for key in set(old_field) | set(new_field):
                if key == "type":
                    continue
                assert old_field.get(key) == new_field.get(key), (doc_id, old_field["id"])
        if args.apply:
            with open(path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")
            # A batch-2 form is repaired in staging; the export copy needs it too, since
            # promote is not being re-run for one field.
            if root is OUT:
                export_path = os.path.join(EXPORT, "%s.json" % doc_id)
                exported = json.load(open(export_path))
                staged = {int(f["id"]): f["type"] for f in mapping["staticFields"]}
                for field in exported["staticFields"]:
                    field["type"] = staged.get(int(field["id"]), field["type"])
                with open(export_path, "w") as fh:
                    json.dump(exported, fh, indent=1)
                    fh.write("\n")

    print()
    for doc_id, count, addresses in sorted(per_form, key=lambda row: -row[1])[:12]:
        print("%-12s %3d retyped%s" % (doc_id, count,
                                       "  (%d address block)" % addresses if addresses else ""))
    print("\n%d type(s) corrected across %d forms%s"
          % (total, len(per_form), "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()

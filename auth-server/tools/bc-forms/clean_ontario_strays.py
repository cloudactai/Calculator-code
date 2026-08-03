"""Drop the Ontario fields that are duplicates of a field already on the page.

Guide §7 asks for a duplicate/overlap scan. Across the 45 Ontario forms it finds
three faults, all of them a box that was emitted twice and none of them carrying
a bind, a calculation or a link:

* Form13A p3 and p4 — the tables are four columns of 25 rows, and one column on
  each page came out with extras: on p3 four boxes in the 97pt column set 4-7 pt
  off the row the other three columns agree on, plus four parked off-page at
  x=3832/9832; on p4 two in the 367pt column, likewise off the row. The row grid
  is the evidence: every column holds exactly 25 rows once these are gone.
* Form15 p8 — checkbox 120 sits exactly on top of 119, and the page prints three
  boxes below the Financial Statement line for the four controls.
* Form17E p1 — id 33 appears twice, byte for byte. The editor keys by id, so the
  second copy was never reachable.

Nothing is moved and nothing is resized: the only edit is the removal, and every
surviving field is checked byte-identical before the file is written.

Run: python3 clean_ontario_strays.py [--write]
"""
import json
import os
import sys

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend "
          "/Calculator-code/auth-server/form-template-export")

# doc_id -> ids to drop. A duplicated id drops one of the two copies.
DROP = {
    # p3: off the row grid its own table keeps.
    "Form13A": [1728474492397, 1728474492213, 1728474491973, 1728474492525,
                # p3: off the page altogether.
                1728473931702, 1728473932334, 1728473932494, 1728473932626,
                # p4: same fault, the 367pt column.
                1728475874575, 1728475874719],
    "Form15": [120],
    "Form17E": [33],
}


def main():
    write = "--write" in sys.argv
    for doc_id, drop in DROP.items():
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        data = json.load(open(path))
        fields = data["staticFields"]

        kept, removed = [], []
        for field in fields:
            # A duplicated id is dropped once, not twice.
            if field["id"] in drop and field["id"] not in [f["id"] for f in removed]:
                removed.append(field)
            else:
                kept.append(field)

        missing = set(drop) - {f["id"] for f in removed}
        if missing:
            print("%s: already clean (%s not present)" % (doc_id, sorted(missing)))
        for field in removed:
            print("   %-8s p%-2d drop %s %s at x=%s y=%s %sx%s"
                  % (doc_id, field["page"], field["type"], field["id"],
                     field["x"], field["y"], field["width"], field["height"]))
        if not removed:
            continue

        # Everything that stays must be untouched, keys and all.
        before = {id(f): f for f in fields}
        for field in kept:
            assert before[id(field)] is field
        assert len(kept) == len(fields) - len(removed)

        if write:
            data["staticFields"] = kept
            with open(path, "w") as handle:
                json.dump(data, handle, indent=1)

    if not write:
        print("\n(dry run, pass --write)")


if __name__ == "__main__":
    main()

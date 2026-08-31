"""Eighth pass on Prince Edward Island, 2026-08-30.

`pei_box_clearance.py`. The live app fills a field's rect, so whatever the rect
covers is gone from the page -- and 76 boxes in this batch reached up into the
line of type above them. On Form 70A* items 25 to 30 that took whole captions
with it: "Terms of the order requested", "Current arrangements", and the whole
of item 29's prompt printed under its own answer box.

The cause is a mismatch the field tables cannot show. PEI sets a caption
directly over its rule with almost no leading, and a writing box is 13.3pt
tall whatever the gap it has to live in; where the gap is 10pt the box takes
the missing 3.3pt out of the caption. The review saw these pages twice and
passed them, which is fair -- an overlap of 2 to 4pt is invisible on a
background render and only appears once the app paints the box.

**The bottom edge did not move.** It sits on the printed rule -- this
province's own convention, `repair_pei_fields.pass_seat_flat` seating PEI flat
where the other seven keep 1.26pt -- so the room came off the top and every
box still starts and ends on the paper review put it on. 58 boxes shortened,
by 1.4 to 11.2pt, none below 10pt. `repair_pei_fields --check` reports exactly
what it reported before, which is the proof that no seat was disturbed.

No page gains or loses anything, so this round annotates existing rows.
"""
import review_ledger as L

NOTE = ("Round 8: writing boxes on this page were shortened from the top by "
        "pei_box_clearance.py, which measures printed ink off a render rather "
        "than off font boxes and takes each box off the line of type above it. "
        "The bottom edge is unchanged -- it stays seated on its rule -- so the "
        "box is shorter, not lower, and no box was left under 10pt.")

# Only what a reviewer would notice on the page, derived from the log at run
# time rather than typed out, so the row cannot drift from what the tool did.
LOG = "../pei-forms/box_clearance_log.json"


def main():
    import json, os
    here = os.path.dirname(os.path.abspath(__file__))
    log = json.load(open(os.path.join(here, LOG)))
    rows = L.load()
    touched = 0
    for doc_id, entries in sorted(log.items()):
        by_page = {}
        for entry in entries:
            by_page.setdefault(entry["page"], []).append(entry)
        for page, entries_on_page in sorted(by_page.items()):
            covered = sorted({e["covered"] for e in entries_on_page if e["covered"]})
            n = len(entries_on_page)
            line = NOTE + " %s here, %s covering %s." % (
                "One box" if n == 1 else "%d boxes" % n,
                "which had been" if n == 1 else "between them",
                "; ".join('"%s"' % c for c in covered[:4]))
            for row in rows:
                if row["docId"] == doc_id and row["page"] == page:
                    if NOTE not in row.get("notes", ""):
                        row["notes"] = (row.get("notes", "") + " " + line).strip()
                        touched += 1
    L.save(rows)
    print("%d page(s) annotated" % touched)


if __name__ == "__main__":
    main()

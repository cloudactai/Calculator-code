"""Tenth pass on Prince Edward Island, 2026-08-31.

Three of round 6's answer boxes took the rest of their page and spilled the
tail onto a sheet of its own, the way 70F and 70G did before round 8 sized
them. The sheets they bought carried 82 to 334pt of content and 333 to 577pt
of blank paper. `pei_answer_space`'s PLAN now gives 70B, 70B* and 70E explicit
heights measured off the paper above their own tail, so all three are one page
shorter:

    70B         3 -> 2 pages     38 -> 13 writing lines
    70B*        2 -> 1 page      33 ->  7 writing lines
    70E         2 -> 1 page      27 -> 20 writing lines

70B and 70B* reserve 16.32pt of that room for round 7, whose Statement of
Lawyer reflow lands on the very page the tail comes back to and pushes it
down by a line; sized to the bare tail they overflowed the bottom margin.

The continuation rows go, and their `corrections` with them -- each said only
"New page carrying ...", which stops being true when the page does. What was
on them is not lost: rounds 6, 7 and 8 all re-ran on the rebuilt forms and
their own recorders put the notes back on the page the content now sits on.
"""
import review_ledger as L

# (docId, the continuation that is gone, the page its content came back to)
COLLAPSED = [
    ("PEISC_70B", 3, 2, "the Declaration of Respondent, the respondent's "
                        "address block and the Statement of Lawyer"),
    ("PEISC_70B_JOINT", 2, 1, "the Declaration of Respondent, the respondent's "
                              "address block and the Statement of Lawyer"),
    ("PEISC_70E", 2, 1, "the Date/Name/Address/Phone block and the TO: block"),
]

NOTE = ("Round 10: this form no longer spills. Round 6's answer box had taken "
        "the rest of the page and pushed the tail onto a sheet of its own; it "
        "now takes an explicit height measured off the paper above that tail, "
        "so %s is back on this page and the sheet behind it is gone. The "
        "answer space is smaller for it and still answers the prompt.")


def main():
    rows = L.load()
    dead = {(d, p) for d, p, _t, _w in COLLAPSED}
    kept = [r for r in rows if (r["docId"], r["page"]) not in dead]
    dropped = len(rows) - len(kept)

    touched = 0
    for doc_id, _gone, target, what in COLLAPSED:
        for row in kept:
            if row["docId"] == doc_id and row["page"] == target:
                line = NOTE % what
                if "Round 10:" not in row.get("notes", ""):
                    row["notes"] = (row.get("notes", "") + " " + line).strip()
                    touched += 1
    L.save(kept)
    print("%d continuation row(s) dropped, %d page(s) annotated" % (dropped, touched))


if __name__ == "__main__":
    main()

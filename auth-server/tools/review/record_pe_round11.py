"""Eleventh pass on Prince Edward Island, 2026-08-31.

`pei_repaginate.py` pulled five near-empty continuation pages back onto the
page in front of them -- whole-page absorptions, nothing cut, nothing
re-typeset. 74 -> 69 pages:

    PEISC_70DD        2 -> 1   the Respondent's own email block
    PEISC_71E         3 -> 2   the affidavit-close block
    PEISC_70D         3 -> 2   the lawyer's own contact rules
    PEISC_70R         4 -> 3   items 5-10, restoring the form's own page 2
    PEISC_70A_JOINT   9 -> 8   item 32's remaining child-support options

Every dropped page was itself a continuation `record_pe_round6.py` recorded
as new paper -- the round that spilled it. The rows it wrote come off the
ledger with it; what was on them is not lost, it is back on the page in
front of them, which is what the note on that page now says.

**Every later page renumbers, not just the tail.** Unlike round 10's three
collapses -- each the last page of its own form -- 70R's and 70A_JOINT's
drops sit mid-document, so every row after them moves back by one. The remap
is derived from `repaginate_shifts.json` through `PRG.page_for` rather than
hardcoded, the same discipline `record_pe_round6.py` used for the spills
themselves.
"""
import os
import sys

import review_ledger as L

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "pei-forms"))
import pei_repaginate as PRG  # noqa: E402

P = "pass"

# (docId, dropped page (pre-round-11 numbering), what came back onto the
#  keep page in front of it)
COLLAPSED = [
    ("PEISC_70DD", 2, "the Respondent's Name/Address/Phone/Email block"),
    ("PEISC_71E", 3, "the Date/Issued by/Address of court office block"),
    ("PEISC_70D", 3, "the lawyer's own Name/Address/Phone/Email rules"),
    ("PEISC_70R", 3, "items 5 through 10 -- Grounds for Divorce through "
                     "Notice to Petitioner"),
    ("PEISC_70A_JOINT", 5, "item 32's remaining child-support options"),
]

NOTE = ("Round 11: this page absorbed the page behind it, which carried %s "
        "and had nothing else on it. pei_repaginate.py moved that page's own "
        "content wholesale onto this page's tail -- band-reflowed, not "
        "re-typeset -- and every later page in this form renumbered back by "
        "one. See pei_repaginate.py.")


def main():
    shifts = PRG.load_shifts()
    if not shifts:
        sys.exit("no repaginate_shifts.json -- run pei_repaginate.py first")

    rows = L.load()
    dead = set()
    remapped = touched = 0

    for doc_id, drop_page, what in COLLAPSED:
        if doc_id not in shifts:
            continue
        entries = shifts[doc_id]["entries"]
        keep_page = next(e["keepPage"] for e in entries if e["dropPage"] == drop_page)
        dead.add((doc_id, drop_page))

        for row in rows:
            if row["docId"] != doc_id:
                continue
            if row["page"] == keep_page and NOTE % what not in row.get("notes", ""):
                row["notes"] = (row.get("notes", "") + " " + (NOTE % what)).strip()
                touched += 1

    kept = [r for r in rows if (r["docId"], r["page"]) not in dead]
    dropped = len(rows) - len(kept)

    for row in kept:
        if row["docId"] not in shifts:
            continue
        new_page = PRG.page_for(row["docId"], row["page"], 0.0)
        if new_page != row["page"]:
            row["page"] = new_page
            remapped += 1

    L.save(kept)
    print("%d continuation row(s) dropped, %d page(s) annotated, %d row(s) renumbered"
         % (dropped, touched, remapped))


if __name__ == "__main__":
    main()

"""Twelfth pass on Prince Edward Island, 2026-08-31.

`pei_repaginate.py` gained a second mechanism -- a front-trim -- and used it
once, on `PEISC_70A_JOINT`: Spouse One's own Date/Signature and
Name/Address/Phone/Email block moved from the top of page 7 onto page 6's
tail, closing a gap that in turn opened enough room at page 7's own tail to
take page 8's last two lines (the closing Date/Signature rule for Spouse
Two's lawyer) as an ordinary whole-page merge. 8 -> 7 pages.

Page 8's row comes off the ledger with it; what was on it is not lost, it is
back on page 7, which is what the note there now says. Page 6 and page 7 both
keep their own review history and gain one line saying what this round moved
across them.

**Not `PRG.page_for` directly, and not filtered by which page numbers the
ledger currently holds either.** `page_for` walks a document's *entire* merge
history from its pre-repagination numbering, which is exactly right for
translating a coordinate measured once and never touched since -- but this
ledger's current rows are themselves the *output* of round 11's own remap.
Handing them to `page_for` would re-apply round 11's own merge a second time,
and a page-number filter cannot catch that: round 11's entry drops page 5 in
the *pre-round-11* numbering, and the post-round-11 ledger also happens to
have a live row numbered 5 -- a different page, same number, by coincidence.

The fix is to name the one entry this round actually added, `pei_repaginate
.record` only ever appends (never re-sorts, see its own docstring), so the
*last* entry for this document is always the most recent merge -- which is
this round's, since a ledger sync runs immediately after the pass that
produced it. A front-trim never needs any of this: it moves content between
two page numbers that both already exist and go on existing, so it never
changes what page a ledger row belongs on.
"""
import os
import sys

import review_ledger as L

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "pei-forms"))
import pei_repaginate as PRG  # noqa: E402

P = "pass"
DOC_ID = "PEISC_70A_JOINT"

# (dropped page, what came back onto the page it merged into)
COLLAPSED = [
    (8, "the closing Date/Signature rule for Spouse Two's lawyer, the very "
       "last line of the Statement of Lawyer"),
]

FRONT_TRIM_NOTE = ("Round 12: pei_repaginate.py front-trimmed this page. "
                   "Spouse One's own Date/Signature and Name/Address/Phone/"
                   "Email block moved off the top of page 7 onto this page's "
                   "own tail -- band-reflowed, not re-typeset. See "
                   "pei_repaginate.py.")
TAIL_LOST_NOTE = ("Round 12: this page's own head -- Spouse One's Date/"
                  "Signature and Name/Address/Phone/Email block -- moved to "
                  "page 6, and the tail that stayed was shifted up to close "
                  "the gap. The room that opened at this page's own tail is "
                  "what let it absorb %s next. See pei_repaginate.py.")


def main():
    entries = PRG.entries_for(DOC_ID)
    if not entries:
        sys.exit("no repaginate_shifts.json entries for %s" % DOC_ID)
    this_round = entries[-1]           # append-only, see the module docstring
    if this_round["dropPage"] != COLLAPSED[0][0]:
        sys.exit("the latest merge (drops p%d) doesn't match what this round "
                 "expects to have recorded (p%d) -- already run, or a later "
                 "merge landed first?" % (this_round["dropPage"], COLLAPSED[0][0]))

    def remap(page_no):
        if page_no == this_round["dropPage"]:
            return this_round["keepPage"]
        if page_no > this_round["dropPage"]:
            return page_no - 1
        return page_no

    rows = L.load()
    dead = {(DOC_ID, p) for p, _what in COLLAPSED}
    kept = [r for r in rows if (r["docId"], r["page"]) not in dead]
    dropped = len(rows) - len(kept)

    touched = 0
    for row in kept:
        if row["docId"] != DOC_ID:
            continue
        if row["page"] == 6 and FRONT_TRIM_NOTE not in row.get("notes", ""):
            row["notes"] = (row.get("notes", "") + " " + FRONT_TRIM_NOTE).strip()
            touched += 1
        if row["page"] == 7 and "Round 12:" not in row.get("notes", ""):
            what = ", ".join(w for _p, w in COLLAPSED)
            row["notes"] = (row.get("notes", "") + " " + (TAIL_LOST_NOTE % what)).strip()
            touched += 1

    remapped = 0
    for row in kept:
        if row["docId"] != DOC_ID:
            continue
        new_page = remap(row["page"])
        if new_page != row["page"]:
            row["page"] = new_page
            remapped += 1

    L.save(kept)
    print("%d row(s) dropped, %d page(s) annotated, %d row(s) renumbered"
         % (dropped, touched, remapped))


if __name__ == "__main__":
    main()

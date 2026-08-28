"""Fourth pass on Prince Edward Island, 2026-08-28.

`pei_general_heading.py` put a real general heading -- court file number,
court name, applicant/petitioner, respondent -- on the 19 PEISC forms (of the
22 that printed the bare instruction `(General heading)`) that a single band
reflow could accommodate. Three more of the 22 were skipped: 70B carries its
own pre-existing "AND BETWEEN" party block that the same fix would have to
replace rather than sit above (a 70B-specific change, not a generic one, left
for its own pass); 71B is the DOCX-source-reflowed form already out of scope
for this tool.

The block fits in the page's own top gap and the placeholder's reclaimed
space on 15 of the 19. On the other four -- 70D, 70DD, 70R, 71E -- the block
was taller than the room those two sources freed, and the page's own tail
spilled onto a continuation page spliced in right after it (`rebuild`,
`pei_general_heading.py`), which is why each gains exactly one page. This
records that new page for the ledger; the headed page 1 itself (and, for
70R, its unchanged pages 2-3) already carry rows from earlier rounds and are
untouched here.
"""
import review_ledger as L

P = "pass"

NOTE = ("General heading added (court file number, court name, "
        "applicant/petitioner, respondent) -- see pei_general_heading.py and "
        "GENERAL_HEADING_PLAN.md. The block was taller than the page's own "
        "top gap and reclaimed placeholder space could hold, so the page's "
        "tail spilled onto this continuation page, spliced in right after "
        "the page it came from so the form still reads start to finish in "
        "physical page order.")

ROWS = {
    "PEISC_70D": (2, "New page: the page 1 tail (lawyer's name/address/"
                  "phone/email block) that didn't fit after the heading was "
                  "added.", NOTE),
    "PEISC_70DD": (2, "New page: the page 1 tail (respondent's email field) "
                   "that didn't fit after the heading was added.", NOTE),
    "PEISC_70R": (4, "New page: the page 1 tail (the Claim for Relief "
                  "section's remaining items) that didn't fit after the "
                  "heading was added. Pages 2-3 are unchanged, just "
                  "renumbered to 3-4 to keep the spilled page immediately "
                  "after page 1.", NOTE),
    "PEISC_71E": (2, "New page: the page 1 tail (the Date/Issued by/Address "
                  "of court office block) that didn't fit after the heading "
                  "was added.", NOTE),
}


def main():
    written = 0
    for doc_id, (page, corrections, notes) in ROWS.items():
        L.record(doc_id, page, P, P, corrections=corrections, notes=notes)
        written += 1
    print("%d rows written" % written)


if __name__ == "__main__":
    main()

"""Third pass on Prince Edward Island, 2026-08-28.

Every other PEISC form was opened page by page and checked against the two
bug classes 70A and 70A_JOINT had already been repaired for: a printed line
whose blank runs short of the page's own margin with nothing else on the
line, and a growable (i)/(ii)/(iii) relief list left unboxed. Neither class
turned up anywhere else in the batch -- every remaining line-end blank and
every enumerated list in the other 31 forms was already sized to the page's
own content, and none of the non-70A forms print a growable claim list at
all.

What did turn up, on eleven more forms, is the same shape 70A's own "TO:"
fix was written for: a bare parenthetical instruction --
"TO: (Name and address of ...)" -- printing on its own line or inline after
the label, with no rule under it and nothing else on the line. Each is
boxed the same way 70A's was: on the label's own line (or, where the
placeholder sits inline, replacing the placeholder text itself), out to the
page's own rightmost ink, read fresh off each page rather than assumed from
70A's margin.

This replaces the ledger rows only for the pages this round's fixes
touched. Every other PE row from rounds 1 and 2 stands unchanged.
"""
import review_ledger as L

P = "pass"
B3 = "2026-08-28, round 3"

NOTE = ("Added a TextField for the bare 'TO: (Name and address of ...)' "
        "instruction, which had never had a field -- the same gap 70A's own "
        "'TO:' fix closed, extended here on request to the other PEISC forms "
        "that print the same shape. The right edge is each page's own "
        "rightmost printed ink, not a number carried over from 70A.")

ROWS = {
 "PEISC_70B": (1, "Added two TextFields: 'TO (Name and address of "
               "respondent to the counterpetition other than the "
               "petitioner)' and 'AND TO (Name and address of petitioner's "
               "lawyer or petitioner)', both bare with no printed rule.",
               NOTE),
 "PEISC_70D": (1, "Added a TextField for 'TO:  (Name and address of "
               "petitioner's lawyer or petitioner)', printed inline on one "
               "line with no rule.", NOTE),
 "PEISC_70CC": (1, "Added a TextField for 'TO:  (Name and address of "
                "lawyer or party receiving notice)'.", NOTE),
 "PEISC_70DD": (1, "Added a TextField for 'TO: (Name, address, telephone "
                "number and email address of Respondent)'.", NOTE),
 "PEISC_70E": (1, "Added a TextField for 'TO (Name and address of "
               "respondent's lawyer or respondent)'.", NOTE),
 "PEISC_70EE": (1, "Added a TextField for 'TO:  (parties)'.", NOTE),
 "PEISC_70F": (1, "Added a TextField for 'TO (Name and address of "
               "respondent's lawyer or respondent)'.", NOTE),
 "PEISC_70G": (1, "Added a TextField for 'TO (Name and address of lawyer "
               "or party to be served)'.", NOTE),
 "PEISC_70H": (1, "Added a TextField for 'TO (Name and address of lawyer "
               "or party on whom notice is served)'.", NOTE),
 "PEISC_70M": (1, "Added a TextField for 'TO (Names and addresses of "
               "lawyer or parties receiving notice)'.", NOTE),
 "PEISC_71E": (1, "Added a TextField for 'TO (Name and address of person "
               "summoned)'.", NOTE),
}


def main():
    written = 0
    for doc_id, (page, corrections, notes) in ROWS.items():
        L.record(doc_id, page, P, P, corrections=corrections, notes=notes)
        written += 1
    print("%d rows updated" % written)


if __name__ == "__main__":
    main()

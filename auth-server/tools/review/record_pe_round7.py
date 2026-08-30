"""Seventh pass on Prince Edward Island, 2026-08-30.

`pei_inline_name_rules.py`. The Statement of Lawyer prints "I, ____, lawyer for
the petitioner, certify ..." on five forms, and the court's own typesetting
gives the name **28pt**. The mapping had honoured that rule exactly, so the
shipped field was 28pt too -- and `render_review`'s filled view showed a name of
ordinary length overflowing it and printing across the word "lawyer". A
collision, not a tight fit, and it was there from the first build.

Nothing could be widened in place: the line is justified to the right margin, so
a wider box would have covered the court's own words. The line is reflowed
instead -- its tail moves to its own line at the paragraph's continuation
indent and the blank takes the whole of line 1, 28pt becoming 334-422pt. The
sentence is **copied** as a clipped form XObject rather than re-typeset, so its
glyphs and justification spacing are the page's own.

No page gains or loses anything: this round adds no pages and moves none, so it
records what changed on four pages that already have rows rather than writing
new ones.
"""
import review_ledger as L

NOTE = ("Round 7: the Statement of Lawyer's first line was reflowed by "
        "pei_inline_name_rules.py. The lawyer's name blank was 28pt -- the "
        "court's own measure -- and a name of ordinary length overflowed it "
        "and printed over the following words. The tail of the line now sits "
        "on its own line at the paragraph's continuation indent and the blank "
        "runs the width of line 1. The moved text is copied as a clipped "
        "XObject, not re-set; only the rule's extension and the (name) "
        "caption, which straddles the band edge, are drawn.")

PAGES = [
    ("PEISC_70A", 11, "item 46"),
    ("PEISC_70B", 3, "the Statement of Lawyer"),
    ("PEISC_70B_JOINT", 2, "the Statement of Lawyer"),
    ("PEISC_70A_JOINT", 8, "items 42(a) and 43(a), both lawyers' statements"),
]


def main():
    rows = L.load()
    touched = 0
    for doc_id, page, where in PAGES:
        for row in rows:
            if row["docId"] == doc_id and row["page"] == page:
                line = NOTE + " Affects %s." % where
                if line not in row.get("notes", ""):
                    row["notes"] = (row.get("notes", "") + " " + line).strip()
                    touched += 1
    L.save(rows)
    print("%d page(s) annotated" % touched)


if __name__ == "__main__":
    main()

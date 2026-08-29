"""Sixth pass on Prince Edward Island, 2026-08-29.

`pei_answer_space.py` made room where a narrative prompt asks for a written
answer and the form gives it one line or none: the seven pleadings that say
"set out in separate, consecutively numbered paragraphs" and shipped with
13.3pt or nothing at all, Form 70A's and 70A*'s grounds and disclosure items,
and the two motion-for-judgment affidavits' "(Give particulars.)" prompts.
33 answer areas across 11 forms.

**This revisits the decision `repair_pei_fields.pass_areas` recorded** -- that
PEI has less blank paper than it looks like it has, so an undersized band is
better left unboxed than boxed at 20pt of leading. That was right while nothing
could add paper to a fixed-geometry PDF. `pei_general_heading` then built the
band reflow and the spill, so the room can now be *made* rather than found, and
the premise the refusal rested on no longer holds.

**Nine forms gain pages, so this round renumbers as well as records.** A
continuation is spliced in directly behind the page it spilled from, which
pushes every later page back one -- Form 70A's own page 3 is now page 4 -- and
a ledger keyed by page number would otherwise describe the wrong sheet. The
remap is derived from `answer_space_shifts.json` through `PAS.page_for` rather
than typed out here, so it cannot drift from what the tool actually did, and
every existing row keeps the corrections and notes its own round wrote.

Idempotent: a document whose ledger already runs past its old page count is
recognised as remapped and left alone.
"""
import os
import sys

import fitz

import review_ledger as L

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "pei-forms"))
import pei_answer_space as PAS  # noqa: E402

P = "pass"

# What each continuation page carries, in round 4's voice: the tail of the page
# it spilled from, named so the row says what a reviewer would actually see.
TAILS = {
    ("PEISC_70A", 3): "the \"Information about the respondent\" section "
                      "(items 13-18 and the Marriage certificate heading)",
    ("PEISC_70A", 8): "the Domestic Contracts section (item 36 and its table) "
                      "and the Other Court Proceedings heading",
    ("PEISC_70A", 10): "the Collusion/Condonation items 41-42, the Trial item "
                       "43 and the Declaration of Petitioner",
    ("PEISC_70A_JOINT", 4): "the tail of item 31's child-support options",
    ("PEISC_70A_JOINT", 7): "the No Collusion section (item 40) and the "
                            "Declaration of Spouses (item 41(a)-(d))",
    ("PEISC_70A_JOINT", 9): "the Date and Signature of lawyer rules closing "
                            "the Statement of Lawyer for Spouse Two",
    ("PEISC_70B", 3): "the Declaration of Respondent, the respondent's address "
                      "block and the Statement of Lawyer",
    ("PEISC_70B_JOINT", 2): "the Declaration of Respondent, the respondent's "
                            "address block and the Statement of Lawyer",
    ("PEISC_70D", 2): "the respondent's lawyer contact block, the Dated and "
                      "Signature rules, the TO: block and the Declaration",
    ("PEISC_70E", 2): "the Date/Name/Address/Phone block and the TO: block",
    ("PEISC_70F", 2): "the Date/Name/Address/Phone block and the TO: block",
    ("PEISC_70G", 2): "the Date/Name/Address/Phone block and the TO: block",
    ("PEISC_71E", 2): "the affidavit-evidence paragraph, which now also "
                      "carries the answer area it never had a field for",
}

NEW_NOTE = ("New page, spliced in directly behind the page it spilled from so "
            "the form still reads start to finish in physical page order. It "
            "carries %s, displaced when pei_answer_space.py cut an answer area "
            "into that page. Background is band-reflowed, never scaled, and "
            "the pass adds no ink. See pei_answer_space.py.")

CUT_NOTE = ("Round 6: pei_answer_space.py cut an answer area into this page "
            "for a narrative prompt that shipped with one line or none. The "
            "background is band-reflowed rather than re-typeset, so every "
            "field on the page moved by its own band's constant and nothing "
            "was re-detected.")


def page_map(doc_id, entries):
    """({old page: new page}, new pages, old count, new count) from the shifts."""
    doc = fitz.open(os.path.join(PAS.EXPORT, "%s.pdf" % doc_id))
    new_count = doc.page_count
    doc.close()
    old_count = new_count - sum(1 for e in entries if e.get("contPage"))
    # y=0 is the top of the old page and so never past a spill's own split:
    # this reads the page move alone, not the move plus the split.
    moved = {p: PAS.page_for(doc_id, p, 0.0) for p in range(1, old_count + 1)}
    fresh = sorted(set(range(1, new_count + 1)) - set(moved.values()))
    return moved, fresh, old_count, new_count


def main():
    shifts = PAS.load_shifts()
    if not shifts:
        sys.exit("no answer_space_shifts.json -- run pei_answer_space.py first")

    rows = L.load()
    remapped = 0
    for doc_id, entries in sorted(shifts.items()):
        moved, _fresh, old_count, _new = page_map(doc_id, entries)
        pages = [r["page"] for r in rows if r["docId"] == doc_id]
        if not pages or max(pages) > old_count:
            continue          # never recorded, or already remapped
        for row in rows:
            if (row["docId"] == doc_id and row["page"] in moved
                    and moved[row["page"]] != row["page"]):
                row["page"] = moved[row["page"]]
                remapped += 1
    L.save(rows)

    written = 0
    for doc_id, entries in sorted(shifts.items()):
        _moved, fresh, _old, _new = page_map(doc_id, entries)
        for page in fresh:
            tail = TAILS.get((doc_id, page))
            if tail is None:
                sys.exit("%s p%d: no tail description for this new page"
                         % (doc_id, page))
            L.record(doc_id, page, P, P,
                     corrections="New page carrying %s." % tail,
                     notes=NEW_NOTE % tail)
            written += 1

    # The cut pages keep their own history and gain one line saying what this
    # round did to them, rather than being overwritten by it.
    rows = L.load()
    touched = 0
    for doc_id, page_no in sorted(PAS.PLAN):
        moved, _fresh, _old, _new = page_map(doc_id, shifts.get(doc_id, []))
        final = moved.get(page_no, page_no)
        for row in rows:
            if (row["docId"] == doc_id and row["page"] == final
                    and CUT_NOTE not in row.get("notes", "")):
                row["notes"] = (row.get("notes", "") + " " + CUT_NOTE).strip()
                touched += 1
    L.save(rows)

    print("%d rows renumbered, %d new pages recorded, %d cut pages annotated"
          % (remapped, written, touched))


if __name__ == "__main__":
    main()

"""Write Prince Edward Island's rows into the per-page review ledger.

One row per page, from the notes taken while the renders were open. Both reads
were done against `_review/PEISC_*/`: the first against the overlay and the
government's own page, the second against the regenerated output after the
repairs in `repair_pei_fields.py`.

**PEI's source and background render pixel-identical.** All 64 pages were
compared at 1.5x and every one matched, which follows from the province's build
path -- the background is a LibreOffice render of the court's Word document and
`flatten_background` copies it rather than modifying it. So for this province
the `combined` view carries both reads on the authoritative page, and
`sourceReviewed` means the staged court document was compared, not merely
assumed.
"""
import review_ledger as L

P = "pass"

# docId -> {page: (corrections, notes)}
ROWS = {
 "PEISC_70A": {
  1: ("", "Backing page. Date, 'Issued by' and the court-office rule all seated. "
         "The CLAIM block's slots (a)(ii)-(iii) and (b)(i)-(iii) are numbered "
         "lines with no rule and about one line of leading each -- drafting "
         "space in Word, not an answer space a fixed overlay can offer."),
  2: ("Items 9, 14 and 16 had no field. Where one line ends in a rule and the "
      "next does too, only the lower one was boxed; three of the six marriage "
      "details on this page were unanswerable.",
      "All 12 option squares tick inside their printed square. Item 10 keeps "
      "two boxes, correctly -- its two runs are 19pt apart and are surname and "
      "given names."),
  3: ("Items 20 and 21 print ')___ ___________'; the 3-character stub had its "
      "own 15pt box and the two stamped values overprinted. Merged, gap 3.2pt. "
      "The children's table row 5 column 4 had no cell field -- the next line "
      "of body text starts 0.05pt above the table's bottom rule, so the cell "
      "read as occupied.",
      "Children's table now 5x4 complete."),
  4: ("", "Parenting and support items complete; every option square tickable."),
  5: ("", "Six cells of the support table, all covered."),
  6: ("", "Three tables complete. Item 36's Date/Nature/Status headings stand "
         "over 18pt of leading -- one line, not a table body."),
  7: ("", "No field on this page, and none can be placed: it is a full page of "
         "'If yes, provide details' questions whose bands measure 20.6pt, a "
         "single line of leading. Recorded as a limit of the flat-PDF build."),
  8: ("Dropped four boxes from signature rules -- petitioner, lawyer, "
      "respondent and the acknowledgement's own 'Signature'.",
      "JUDGMENT CALL, and the one that nearly went wrong: the caption line "
      "reads 'Date ______  Signature of respondent ______' at one height, and "
      "the rule two lines above is the respondent's ADDRESS FOR SERVICE. "
      "Matching on the nearest caption claimed the address and date rules too. "
      "Both are kept; only the three signature rules and the witness rule are "
      "bare."),
 },
 "PEISC_70A_JOINT": {
  1: ("Item 9's rule had no field.",
      "The style of cause prints '(Name)' over 'Spouse One' and 'Spouse Two' "
      "with no rule under either, so there is no party box and no bind. That "
      "is the form, not the build."),
  2: ("Items 15, 19(b) and 22(b) had no field; 19(b) is a full-width 72-"
      "character rule for the reasons a spouse gives.",
      "Children's table 4x4 complete. Items 20/21 keep two boxes each -- "
      "municipality and province, separated by the form's own comma."),
  3: ("", "Every rule boxed; values land on their rules under the captions."),
  4: ("", "Four tables complete."),
  5: ("", "No field, and none placeable: the same page of questions as 70A p7, "
         "with bands of 20-22pt."),
  6: ("Dropped four boxes from the two spouses' and two lawyers' signature "
      "rules.", "The four date rules are kept and correctly seated."),
 },
 "PEISC_70B": {
  1: ("", "Date and 'Issued by' seated. '(General heading)' style of cause, so "
         "no party box, correctly."),
  2: ("The second of the respondent's two address rules had no field. Dropped "
      "two boxes from the respondent's and lawyer's signature rules.",
      "Both address lines now answerable."),
 },
 "PEISC_70B_JOINT": {
  1: ("Second address rule had no field; two signature boxes dropped.",
      "Same shape as 70B page 2, on one page."),
 },
 "PEISC_70D": {
  1: ("Item 2's 'paragraphs ___' blank and the second address rule had no "
      "field. Three signature boxes dropped.",
      "Answer, address and lawyer blocks complete."),
 },
 "PEISC_70E": {1: ("Item 2's blank had no field.",
                   "Item 4's '(Set out in separate paragraphs)' is followed by "
                   "11pt before '(Date)' -- no answer space exists on the page.")},
 "PEISC_70F": {1: ("", "Four fields, every printed blank covered.")},
 "PEISC_70G": {1: ("", "Four fields, every printed blank covered.")},
 "PEISC_70H": {1: ("", "Two fields, both seated.")},
 "PEISC_70I_A": {
  1: ("Chart 1's 'Every second week' CONVERSION FORMULA cell had no field: the "
      "row prints '$', a run of spaces and 'x 26 / 12' and draws its rule as "
      "geometry, so no underscore audit could see it.",
      "Both conversion charts and the gross-income table complete. The two "
      "shaded Monthly cells keep a box -- the cost the builder's README "
      "accepts, and it is still only two."),
  2: ("Four option squares had no checkbox -- three OpenSymbol U+F091 and one "
      "Wingdings U+F071.",
      "30 table cells plus the two table-amount lines all covered."),
  3: ("Five OpenSymbol U+F091 squares had no checkbox. Dropped the two "
      "bracket-token boxes, which sat on '[name of Partnership]' and '[name of "
      "corporation]' -- the label, not the blank, which is the underscore run "
      "beside each. Dropped the deponent's signature box.",
      "All five 'I AM ...' options now tickable."),
 },
 "PEISC_70I_B": {
  1: ("", "43 fields; party lines bound; expense table rows 1-16 complete."),
  2: ("The Child Support and Spousal Support row had no cells in either "
      "column -- one row holding two numbered items, so it read as occupied.",
      "66 cells otherwise complete."),
  3: ("Dropped the deponent's signature box.",
      "Summary table, name/occupation table and jurat complete. The SUMMARY "
      "heading row keeps two boxes: shaded-cell cost, as recorded."),
 },
 "PEISC_70I_C": {
  1: ("Six option squares had no checkbox. They are OpenSymbol U+F039, which "
      "text extraction renders as the digit 9 -- the page reads '9 a) child "
      "care expenses'. Matched on codepoint and font, never on the character.",
      "The 5x3 expense table and item 4's rule all covered."),
  2: ("Three of item 5's answer rules had no field. Dropped the deponent's "
      "signature box.",
      "The commissioner's rule is drawn in three pieces 6.5 and 11.9pt apart; "
      "welded before testing, it reads as one 180pt office rule and is left "
      "bare."),
 },
 "PEISC_70I_D": {
  1: ("Item 1's 'jointly with ___' blank had no field. Added a TextArea for "
      "the Real Estate body: the section is a row of column headings over 33pt "
      "of open paper with no grid at all, so nothing was enterable.",
      "Household items and Vehicles tables complete."),
  2: ("", "Pensions, RRSPs, savings and securities tables complete."),
  3: ("Dropped the bracket-token boxes on '[Give particulars of all debts "
      "owing to you.]' and '[Show any other property...]' -- whole instruction "
      "lines with no blank in them. Added a TextArea for the Debts body.",
      "Life insurance, accounts receivable and business interests complete."),
  4: ("Dropped the commissioner's and deponent's signature boxes. Added a "
      "TextArea for the proposed-assets body; the three 9pt strips the cell "
      "detector had put on the shaded band under the headings are gone -- 9pt "
      "cannot hold a line of the form's own text.",
      "The answer band now wraps a real paragraph."),
 },
 "PEISC_70J": {1: ("Dropped the box on the respondent's signature rule.",
                   "The form is two signature blocks and a recital; it "
                   "correctly ends with no field at all.")},
 "PEISC_70O": {1: ("", "Three fields; respondent name, date and lawyer block.")},
 "PEISC_70AA": {1: ("", "11 fields. The four ballot boxes (U+2610, AppleSymbols "
                        "and ArialUnicodeMS) were already covered. The rule over "
                        "'D. Registrar' keeps its field -- see the office-caption "
                        "note in the README.")},
 "PEISC_70BB": {
  1: ("The Responding Party's two cells -- the other side's name and address, "
      "and their lawyer's -- had no fields at all.",
      "JUDGMENT CALL: Part 1's 'MOVING PARTY: | Age: | Birthdate:' rows are "
      "cells that hold their own label, so no cell field can be placed without "
      "splitting them. Left, and recorded."),
  2: ("", "Parts 2 and 3 option squares and income lines covered. Two boxes in "
         "the narrow item-number column (f44, f48) are pre-existing and "
         "harmless; they sit in a column that is empty on continuation rows."),
  3: ("Five Symbol U+F0F0 squares had no checkbox; the 'A written agreement "
      "dated ___' rule had no field.",
      "See the U+F0F0 note on Form 70R -- the same substituted glyph."),
  4: ("One U+F0F0 square had no checkbox. Dropped the box on 'Signature of "
      "party or party's lawyer'. Added a TextArea for item 14's answer cell.",
      "The Date rule beside the signature is kept -- the caption line names "
      "both rules."),
  5: ("", "One field; the page is a continuation."),
  6: ("", "A blank trailing page from the Word render. Nothing printed, "
         "nothing to box."),
 },
 "PEISC_70BB_1": {
  1: ("All four Moving and Responding Party cells were empty of fields. Items "
      "1 and 2 -- relationship of each party to the children -- are 60pt cells "
      "holding only their heading, with the answer space beneath; added a "
      "TextArea for the clear part of each.",
      "Children's table 5x5 complete."),
  2: ("The 'A written agreement dated ___' rule had no field. Dropped the box "
      "on 'Signature of party or party's lawyer'. Added TextAreas for items 7 "
      "and 8, whose answer space is the lower part of their own cell.",
      "Every option square on the page ticks inside its square."),
 },
 "PEISC_70CC": {1: ("", "Two fields, date and lawyer block.")},
 "PEISC_70C": {1: ("", "One field. The rest of the page is bracketed "
                       "instructions with no rule.")},
 "PEISC_70DD": {1: ("", "File number, date and the court-office rule.")},
 "PEISC_70EE": {1: ("", "Six fields; the hearing date, year and hour blanks all "
                        "seated. The rule over 'Registrar' keeps its field.")},
 "PEISC_70P": {1: ("Dropped the box on 'Petitioner's signature'.",
                   "The deponent-name blank is kept. Items 1 and 2 ask for "
                   "particulars over 20.6pt of leading -- no answer space.")},
 "PEISC_70Q": {1: ("Dropped the box on '(Respondent's signature)'.",
                   "Same shape as 70P.")},
 "PEISC_70V": {1: ("", "Six fields; name, address, county and the dated line.")},
 "PEISC_70R": {
  1: ("27 option squares had no checkbox.",
      "THE WORST DEFECT IN THE BATCH, and a background one as well: every "
      "option square on this form renders as an Apple logo. LibreOffice mapped "
      "the court's checkbox to Symbol U+F0F0. A Registrar's Certificate whose "
      "whole purpose is to be ticked shipped with 60 untickable squares and a "
      "wrong glyph under each. The fields are now correct; the printed glyph "
      "still needs a font substitution at render time, which is a rebuild."),
  2: ("33 option squares had no checkbox.", "Same U+F0F0 substitution."),
  3: ("", "Date and the court-office rule; no option squares on this page."),
 },
 "PEISC_70S": {
  1: ("The second of item 2's two rules had no field.",
      "The rest of the page is bracketed alternative recitals."),
  2: ("", "JUDGMENT CALL: field 1 is the interest-rate blank and the caption "
         "'(Signature of judge)' below it belongs to a rule further right. "
         "Kept. This is why the signature list is written out rather than "
         "matched."),
 },
 "PEISC_70T": {1: ("The 'solemnized at ___' and 'on ___' blanks had no fields.",
                   "The Registrar's rule is left bare, consistent with the "
                   "other jurat and office rules this pass does not add to.")},
 "PEISC_70U": {1: ("Dropped the box on '(signature)'.",
                   "The dated line's four blanks are kept. 'Name:/Address:/"
                   "Phone:' have no rule and no measurable space.")},
 "PEISC_70M": {1: ("", "Date and the Director's block.")},
 "PEISC_70N": {1: ("", "One field; the rest is '(identify party)' instructions.")},
 "PEISC_71A": {1: ("Dropped the box on '(Signature of judge)'.",
                   "The warrant then carries no field: every other slot on it "
                   "is a bracketed instruction with no rule.")},
 "PEISC_71B": {1: ("Rebuilt the legacy Word source and left both signature rules unboxed.",
                   "Name and address no longer collide; item (c) has a full writing band; "
                   "the recognizant, court-order and Registrar dates are labelled distinctly.")},
 "PEISC_71E": {1: ("The 'Travel allowance $___' and 'TOTAL $___' blanks had no "
                   "fields.",
                   "Attendance money block now adds up on the page.")},
}


def main():
    pages = L.catalogue_pages()
    written = 0
    for _province, src in L.scope():
        doc_id = src["docId"]
        if not doc_id.startswith("PEISC_"):
            continue
        for page in range(1, (pages.get(doc_id) or 0) + 1):
            corrections, notes = ROWS[doc_id][page]
            L.record(doc_id, page, P, P, corrections=corrections, notes=notes)
            written += 1
    print("%d PEI rows written" % written)


if __name__ == "__main__":
    main()

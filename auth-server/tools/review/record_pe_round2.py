"""Second pass on Prince Edward Island, 2026-08-28.

Not a re-review from scratch: this replaces the ledger rows only for the
pages a second round of fixes actually touched (checkbox re-seating across
the batch, plus a handful of fields added by name on request), each verified
against a fresh render before being written. Every other PE row from the
first pass stands unchanged.
"""
import review_ledger as L

P = "pass"
B2 = "2026-08-28, round 2"

ROWS = {
 "PEISC_70A": {
  1: ("Added a field for 'TO: (Name and address of each respondent)', which "
      "had never had one -- the caption printed directly after 'TO:' with no "
      "rule at all. Added five TextAreas for the claim's growable (a)(ii)/"
      "(iii) and (b)(i)/(ii)/(iii) slots; (a)(i) 'a divorce' is left as "
      "printed text, unboxed, since it is the fixed default the form itself "
      "prints.",
      "The TO: box sits on 'TO:'s own line only, so the printed caption's "
      "second line ('each respondent)') remains visible underneath it, "
      "matching the label-then-caption convention used throughout this "
      "batch. Requested by name after review of the live app."),
  2: ("Re-seated 12 checkboxes: every one had been anchored at the top of "
      "its glyph's cell instead of the bottom, hovering 4.5-6pt above the "
      "printed square.",
      "Items 11/12/17/18's option squares now sit on their printed marks."),
  3: ("Re-seated 6 checkboxes.", "No change to field extent, only position."),
  4: ("Re-seated 2 checkboxes.", "No change to field extent, only position."),
  6: ("Re-seated 4 checkboxes. Added the item 34 answer band named in "
      "NARRATIVE_AREAS -- 23.6pt, under the generic detector's floor, kept "
      "in on request rather than left as another unreachable band.",
      "34's band is tight but usable."),
  8: ("Re-seated 2 checkboxes.", "The acknowledgement-of-service options "
     "tick inside their printed squares now."),
 },
 "PEISC_70A_JOINT": {
  1: ("Added Spouse One's and Spouse Two's name fields, replacing the "
      "'(Name)' placeholders the same way a bracket-token instruction is "
      "replaced elsewhere; added the court file number field; added five "
      "TextAreas for the growable claim slots (a)(ii)/(iii) and (b)(i)/(ii)/"
      "(iii); dropped the 'Issued by ______ Registrar' field -- a court "
      "field, not a client one, the same class this batch otherwise leaves "
      "bare.",
      "Dropping 'Issued by' exposed its own underscore run to the blanks "
      "detector on the very next run, which tried to put a field straight "
      "back on it; added to BARE_RULES to hold the removal."),
  2: ("Re-seated 12 checkboxes.", "Items 11/12/17/18 and 19's certificate "
     "options tick inside their printed squares now."),
  3: ("Re-seated 6 checkboxes.", "No change to field extent, only position."),
  4: ("Re-seated 12 checkboxes.", "No change to field extent, only position."),
 },
 "PEISC_70AA": {
  1: ("Re-seated 4 checkboxes.", "The two document-list options and the "
     "pre-motion-conference-memorandum sub-options tick correctly now."),
 },
 "PEISC_70BB": {
  1: ("", "No checkboxes on this page; unaffected by seat_ticks. Listed "
         "because a neighbouring pass touched the doc, not this page."),
  2: ("Re-seated 21 checkboxes.", "Every RELATIONSHIP-DATES and ISSUES-"
     "grid option ticks inside its printed square now."),
  3: ("Re-seated 6 checkboxes, one of them a Symbol U+F0F0 square.",
      "Item 10's order/agreement options and item 11's yes/no now seat "
      "correctly."),
  4: ("Re-seated 27 checkboxes, one of them U+F0F0.", "Items 13 through 19's "
     "option grids all tick inside their printed squares now."),
 },
 "PEISC_70BB_1": {
  2: ("Re-seated 23 checkboxes.", "PART 2's yes/no/unsure grid across items "
     "4-12 all tick correctly now."),
 },
 "PEISC_70I_A": {
  2: ("Re-seated 4 checkboxes (OpenSymbol U+F091/U+F039 and Wingdings "
      "U+F071).", "Chart options tick on their printed squares now."),
  3: ("Re-seated 5 checkboxes (OpenSymbol U+F091).", "The 'I AM ...' status "
     "options all seat correctly now."),
 },
 "PEISC_70I_C": {
  1: ("Re-seated 6 checkboxes (OpenSymbol U+F039, the ones that extract as "
      "the digit 9).", "Items 1(a)-(f)'s reason options tick correctly now."),
 },
 "PEISC_70R": {
  1: ("Re-seated 27 checkboxes (Symbol U+F0F0).",
      "Every option in sections 1-4 now sits on its printed square. The "
      "square itself still renders as an Apple logo in the background -- a "
      "font-substitution issue in the LibreOffice render, recorded in the "
      "README, not something a field-position fix can reach."),
  2: ("Re-seated 33 checkboxes (Symbol U+F0F0).",
      "Sections 5-10 all seat correctly now; same background-glyph caveat."),
 },
}


def main():
    pages = L.catalogue_pages()
    written = 0
    for doc_id, rows in ROWS.items():
        for page, (corrections, notes) in rows.items():
            L.record(doc_id, page, P, P, corrections=corrections, notes=notes)
            written += 1
    print("%d rows updated" % written)


if __name__ == "__main__":
    main()

# Manitoba forms pipeline

Regenerates the Manitoba templates in `form-template-export/` from the
government sources. Everything here is a build tool — the repo ships only the
produced `MBKB_*.pdf/.json` plus `catalog.json`. Staging lives in the gitignored
`form-template-export/_incoming_mb/`; the page renders a review reads are in the
gitignored `form-template-export/_review/`, written by `../review/`.

Requires Python 3 with PyMuPDF (`fitz`), and **LibreOffice** for the twenty
batch-3 forms the government publishes only as Word documents (§10). No Chrome
and no Adobe: unlike BC, the XFA sources here are *static* and need no headless
flatten.

## Scope

**140 forms in three batches: 522 pages, 7,836 fields, 398 binds, zero
findings.**

All 140 are fetched and verified on every pass, and all 140 are built,
catalogued and bound.

**Batch 1 -- the 43 family-law forms of Rule 70** of the Court of King's Bench
Rules, published by Manitoba Justice. The civil parts and the probate forms are
deliberately out of scope, matching the Ontario, BC and Saskatchewan catalogues.

**Batch 2 -- the 43 child-protection and adoption forms** Manitoba prescribes by
*regulation* rather than by a court rule (`mb_sources_batch2.py`, and §8 below).
Rule 70 is Manitoba's equivalent of BC's Family Rules sets only; it prescribes no
child-protection and no adoption form, which is why the catalogue carried none
until 2026-08-18. Sources: M.R. 16/99 Schedule A (21 CFS forms), M.R. 14/99
(3 CA forms), M.R. 19/99 Schedule B (18 AA forms) and M.R. 21/99 (FA-1).

All 86 are recorded — Rule 70 in `mb_sources.py`, the rest in
`mb_sources_batch2.py` — and all 86 are fetched, so a form that is renumbered or
withdrawn surfaces immediately. `mb_sources.all_sources()` is the aggregation
point every tool here reads its work list from; adding a batch is a new
`mb_sources_batch*.py` plus one entry in `_BATCHES`. Each batch carries its own
`SHIPPED_CATEGORIES`, the switch for what is built, catalogued and bound.

Batch 3 -- **the 54 forms neither Rule 70 nor those regulations carry**
(`mb_sources_batch3.py`, and §10 below): the *Provincial* Court's own family
rules, the relocation notices under The Family Law Act, the child-protection
briefs, the FOAEAA packages, the interjurisdictional support set, the protection
orders, and the three federal Divorce Act notices. **54 forms, 243 pages, 3,668
fields, 140 binds**, shipped 2026-08-21.

Rule 70: **43 forms, 188 pages, 2,680 fields, 229 binds**, all nine categories
shipped. The financial five shipped first (2026-08-14); the other 38 followed,
and §7 records what building them taught. Batch 2: **43 forms, 91 pages,
1,488 fields, 29 binds**, shipped 2026-08-18, and §8 records what *it* taught.

| Category | Forms | Notes |
| --- | --- | --- |
| Financial | 5 | 70D, 70D.1, 70D.5, 70U, 70W |
| Pleadings | 6 | 70A, 70A.1, 70B, 70J, 70K, 70L |
| Applications | 10 | 70E, 70E.1, 70E.3, 70F, 70G, 70H, 70H.1, 70H.2, 70Q, 70BB |
| Case Management | 8 | 70D.2, 70D.3, 70D.4, 70R, 70S.3, 70T, 70Z, 70DD |
| Service | 2 | 70C, 70I |
| Affidavits | 3 | 70E.2, 70M, 70M.1 |
| Orders & Judgments | 5 | 70N, 70O, 70O.1, 70P, 70CC |
| Enforcement | 2 | 70X, 70Y |
| Other | 2 | 70V, 70AA |

Batch 2 (`mb_sources_batch2.SHIPPED_CATEGORIES`), one prefix per regulation:

| Category | Forms | Notes |
| --- | --- | --- |
| Child Protection – Applications | 5 | CFS-11, CFS-12, CFS-17, CFS-19, CFS-20 |
| Child Protection – Guardianship | 4 | CFS-13, CFS-14, CFS-15, CFS-16 |
| Child Protection – Warrants | 4 | CFS-23, CFS-24, CFS-25, CFS-26 |
| Child Protection – Orders | 2 | CFS-27, CFS-28 |
| Child Protection – Service & Notice | 5 | CFS-3, CFS-21, CFS-22A, CFS-22B, CFS-29 |
| Child Protection – Financial | 1 | CFS-10 |
| Child Abuse Registry | 3 | CA-1, CA-2, CA-3 |
| Adoption – Placement | 7 | AA-1 to AA-6, AA-13 |
| Adoption – Consents | 5 | AA-8 to AA-12 |
| Adoption – Court | 5 | AA-14, AA-14.1, AA-15, AA-16, AA-17 |
| Adoption – Financial | 2 | AA-7, FA-1 |


## 1. Fetch and verify sources (gates A, B)

```
python3 fetch_mb.py
```

Downloads all 86 forms into `_incoming_mb/`, verifies PDF magic, the page count
against `mb_sources.py`, and that the form prints its own number ("Form 70D") in
its text, then writes `_incoming_mb/manifest.json` with sha256, byte size, page
count, footer line and `kind`.

The download URL is **derived, not recorded**, in both batches. Rule 70 is served
from a slug built out of the form number (`70D` → `70de.pdf`, `70D.1` →
`70d1e.pdf`). Batch 2 is served out of one directory per regulation, each with
its own filename convention (`form_cfs-22ae.pdf`, but `aa14_1e.pdf`), which is
why every batch-2 row carries its regulation and `REGULATIONS` holds the pattern.
Either way there is nothing to go stale except the numbers themselves. That is also why
the form-number check matches with a non-dot boundary — the slug drops the dot,
which is exactly how a typo lands on Form 70D.1 while asking for Form 70D.

> `curl`, not Python's HTTP client: this box sits behind a TLS-inspecting proxy
> whose root is in the system trust store but not in certifi. The BC and SK
> fetchers shell out for the same reason.

All 86 come back `static` — no widgets, no XFA.

## 2. Build

```
python3 build_mb_forms.py [--only MBKB_70D] [--category Financial] [--all] [--promote]
```

**Manitoba prints its writing lines as geometry, not as underscores.** This is
the one fact that makes it a separate builder rather than a flag on the
Saskatchewan one. Where the King's Printer sets a blank as `______________`,
Manitoba Justice's Word template draws a filled rectangle about 0.8pt tall, and
Form 70U's producer draws a stroked line. Across this batch:

| Anchor | Count | Becomes |
| --- | --- | --- |
| A printed rule (filled rect or stroked line) | 1,528 | a text field seated on it |
| A ruled grid | — | a field per empty cell |
| A run of underscores | 796 | a text field |
| A `(full name)` caption under blank paper | 6 | a text field above the caption |
| A role word closing a style of cause | 24 | a text field above it (§8) |
| A printed `[ ]` or `☐` option mark | 277 | a checkbox on the mark (§7) |

**The background PDF ships byte-identical to the government's file** — the same
choice Saskatchewan made, and for the same reason: the rules already print as the
writing line, so the most defensible background is the published one, and a
re-fetch can be diffed against what we ship.

### The one genuinely ambiguous primitive

Word draws **an underline under printed text with the same object** as a writing
rule. `get_drawings()` cannot tell "(A) TOTAL ANNUAL INCOME:" from the blank
beside it. The discriminator is how much of the rule's own length carries glyphs
sitting on it: measured on Form 70D p3, the two underlines read **94% and 95%**
and all 44 writing rules read **0%**, so the cut at 50% has that whole gap to sit
in. `verify_mb.py` checks both directions — a rule with no field, and a field on
an underline.

### What the builder refuses to fill

- **A table border**, in two shapes. One a vertical crosses (Form 70D.5's
  full-width category rows, which `grid_cells` correctly refuses as merged, so no
  *cell* marks their borders). One with verticals standing at **both ends** —
  Form 70D.5 p3's "Positions on Equalization" table has no interior columns at
  all, so nothing crosses its row rules and all four read as 690pt blanks.
- **A heading bracket**, the pair of rules Manitoba draws above and below a
  document's title (§8). Neither has anything printed on its own line, so
  everything else here correctly passes them.
- **A footer separator**, the short left-margin rule above the regulation
  citation or the copy-distribution block (§8).
- **A section separator.** Form 70D.1 p1 rules off the list of orders the court
  may make before "YOU MUST:", in the same 0.8pt black as every writing line, so
  nothing about the object says which it is. Two things about its placement do,
  and both are required: it spans the page's **whole text measure** (the only
  rule of 1,528 in the batch that does — Manitoba's blanks are always bounded by
  a caption, an indent or a column), and **nothing is printed on its own line**,
  which is what would keep a genuinely full-width answer line in a later batch.
- **A cell the government already named** — but see below, because Manitoba's
  version of this rule is not Saskatchewan's.
- **A shaded heading row**, measured off a render rather than read from
  `get_drawings()`. The probe measures **the space the box will occupy**, not the
  cell: `is_shaded` averages the pixels it is given, so a cell carrying its own
  printed question averages dark from its own type, and probing the cell read all
  30 of Form 70W's questions as headings.
- **A signature rule**, in two vocabularies. A caption *below* it ("Signature of
  Deponent", "A Commissioner for Oaths in and for the Province of Manitoba", or
  the office alone), which claims its **nearest** rule rather than every rule in
  the window. And a **jurat bracket column** — Manitoba sets its jurat as two
  columns joined by a run of `)` characters with the deponent's signature rule to
  the right of them and *no caption anywhere near it*, which no caption rule can
  reach. A bracket column is three or more `)` in a tight vertical stack that
  **close their lines** — nothing is printed after them. Nothing reads the gap to
  the word *before*, because two of Form 70D's four are printed 3pt after the
  comma ending the left column's line; but what comes after is decisive, and an
  "(a)/(b)/(c)" list is otherwise indistinguishable (§7).

### What it fills that Saskatchewan's rules would not

- **A labelled cell that asks its own question.** Guide 9.3 says a named cell is
  not a field, and on the Saskatchewan forms that was the whole story: a named
  cell is a row label with its answer in the next column. Manitoba puts both in
  **one** cell — Form 70W prints "Address:", "Date of Birth:", "Social Insurance
  Number:" and expects the answer after the colon in the same box. The colon is
  the signal, and the label must be one line with room left after it.
- **A `(full name)` caption over blank paper.** Manitoba's style of cause
  captions its party lines from *below* and, on Form 70U, draws them no rule at
  all — so every other detector here correctly finds nothing and the petitioner
  and respondent have nowhere to go. The trailing comma matters: Form 70U writes
  `(full name),` and Form 70D writes it bare.
- **Amount cells**, which start just after the government's `$` (guide 4).

### Two lessons that were bugs first

- **Merge rules within a key band, in position order.** Sorting `(key, start)`
  together hands over a right-hand segment before a left-hand one when their
  centres differ by a tenth of a point — which merged a 141pt underline with an
  amount rule 99pt away into one 273pt rule, swallowing the heading and losing
  the amount box. (Inherited from the SK merge, where underscore anchors meant it
  could never fire.)
- **Trim to a fixed point, not once.** Clearing a box's edge off one glyph can
  bring it up against a glyph already passed over: Form 70D p2's third employment
  line ends 1.5pt short of its closing ".", and pulling back to clear that "."
  landed it 0.54pt from the "m" of the line above.

### A heading is not evidence about its column

Manitoba stacks **two** header rows over each table — Form 70U prints the column
number "1" above the column title "Legal description and address of property" —
so every data column carries two distinct printed strings and Saskatchewan's
"non-empty cells differ ⇒ printed reference data" test read the whole table as
the government's own reference grid, losing all three writing panels on 13 pages.
Heading rows are therefore computed *before* the columns are classified and
excluded from the evidence. Bold detection reads the **flag bit**, not the font
name: Form 70U's bold face reports as `BookmanITCbyBT-Light,Bol`.

## 3. Verify (gates C–H)

```
python3 verify_mb.py [--stage] [--all]
```

Re-derives every check from the page rather than comparing against what the
builder stored; where the builder makes a judgement, the verifier calls the
builder's own rule again, so a mistake has to be made twice in the same way to
get through. Checks: printed-text coverage, checkbox-on-a-printed-square,
**unticked marks**, **unfilled rules**, unfilled underscore blanks, signature
rules, **fields on underlines**, amount seating, vertical stacking, edge
clearance, dollar slots, bounds, duplicate ids, shared positions, box overlap
and slivers.

`check_unfilled_rules` is the one that matters most here: Manitoba's blanks are
geometry, so "is there a field on every printed rule?" is the direct question,
and it is what catches a rule wrongly refused.

`check_unticked_marks` is the same question asked of options, and it exists
because the batch shipped without it — see §6.

The printed-text check reads **characters, not words**. `get_text("words")` hands
back `FD_______________` as one token, so a word-level test either flags every
correctly-placed box for the rule it is supposed to sit on, or waves through a
box that has covered a caption.

Current state: **86 forms, 4,168 fields, zero findings**, and the build is
idempotent (two runs produce byte-identical maps).

## 4. Catalog

```
python3 merge_mb_catalog.py
cd ../.. && npm run forms:validate-export
```

Rewrites the MB block of `catalog.json` (sortOrder derived from the block above
whatever the other provinces occupy — 701–786 today) and regenerates `audit.json`.
The picker grouping is matched on the source's own `shortCategory`, not on the
row's category string: the row has had its hyphen swapped for the picker's en
dash, so an `endswith` on the written name stopped matching the moment a batch-2
category ("Child Protection - Applications") carried one.
Only the shipped batch is written — a row for a form that has not been built
would advertise a template the API cannot serve.

## 5. Prefill binds

```
python3 rebind_mb_forms.py [--check]
```

Writes back **only** the `bind` key, asserting every other key is byte-identical
first, so it is safe on templates whose geometry is already approved; a second
run is a no-op. Run it after any rebuild, which drops binds.

**Manitoba's style of cause reads differently from every other province in the
catalogue.** Ontario, BC and Saskatchewan all print the caption to the *left* of
its blank. Manitoba prints the file number that way, but captions its party lines
from *underneath*, split over two lines — a `(full name)` note, then the role
word:

```
                ____________________
                   (full name)
                                         petitioner
```

Both parts are required. `(full name)` alone says only that a person's name goes
on the line — Form 70D's deponent line is captioned that way too — and the role
word alone is 25pt of blank page away from any number of other rules.

The file-number caption is matched against **the caption's own ink**, not the
text line's bounding box: Manitoba pads the line out to the tab stop with spaces,
and Form 70D.5 runs the blank's underscores inside the very same line, so the
bbox reaches 130pt past what the form prints. One rule then reads all four
layouts ("File # FD", "File No. FD", "File No: FD").

229 fields bind across the 43 Rule 70 forms and 29 across batch 2: the court file
number on every page that prints one, plus the applicant and respondent wherever
the style of cause names them.

Deliberately left unbound, with reasons in `mb_binds.py`:

- **The judicial centre** ("______ Centre"), for the reason BC's registry line
  and Saskatchewan's JUDICIAL CENTRE are. It names the centre the proceeding is
  filed in ("Winnipeg", "Brandon"); the matter has no such field, and
  `court_info` holds the court's *name*.
- **Form 70W's two contact tables.** The form collects address, date of birth,
  social insurance number and mother's maiden name for the "person required to
  make payments" and again for the "person entitled to receive payments". Which
  is the matter's client depends on the support order, which the matter does not
  record, and the failure mode is not a blank line — it is one party's SIN
  printed under the other party's name, on a form that goes to the Maintenance
  Enforcement Program.
- **Strike-out and role-neutral captions**: Form 70D's "FINANCIAL STATEMENT OF
  ______ (Petitioner/Respondent)", Form 70U's "the initiating party/responding
  party", Form 70D.1's "(specify full name of the party who is to provide
  information)". All are completed by striking out what does not apply, and none
  says which party is the client.

## 6. Repairs found by reading the pages (`repair_mb_forms.py`)

All 31 pages of the batch were read individually with the overlay drawn on,
after `verify_mb.py` reported zero findings on all five forms. It found 60
things, in four kinds, and **every one of them was invisible to the gates
because no gate was asking the question** — guide §9's through-line exactly.

    python3 repair_mb_forms.py [--check]

Applied in place to the promoted maps, never by rebuilding; all 20 binds and
every other non-geometry key are asserted byte-identical, and a second run is a
no-op.

- **30 printed options, none of them tickable.** Manitoba writes an option as a
  `[ ]` bracket pair (70D, 70D.1) or a `☐` glyph (70W). The builder's checkbox
  detector looks for the drawn square BC and Saskatchewan use, so it found
  nothing, and all five forms shipped with **zero** CheckBox fields. Form 70D.1
  p2 is the worst of it: fifteen options under the heading "(Check all
  applicable boxes)", and the page carried one field — the court file number.
  `mb_marks.py` measures each mark off the page; `check_unticked_marks` now asks
  the direct question so it cannot recur.
- **24 untypeable totals on Form 70D.5.** "(A) TOTAL ASSETS:", "(B) TOTAL
  DEBTS:", "(A) – (B) = NET:" and their (C)/(D) twins on p4 are each ruled into
  four valuation cells, and every one was empty. This is guide §4's Form 8
  lesson in another dialect: the `is_shaded` rule that keeps boxes off the
  government's own headings also refused these, because Manitoba shades a total
  row the same grey as a heading.
- **4 stray text areas on Form 70D.5 p2 and p4.** One per page opened in the
  margin under the TOTAL ASSETS row and ran down into the *next* table, covering
  its border and part of its column-heading row (guide §9.2); the other floated
  in blank paper below the NET row, anchored to nothing.
- **2 boxes on Form 70U p1**: the Part 1 value box was the topmost in its column
  and 13.0pt against the column's modal 10.4 — the §9.2 signal — and the extra
  height sat on "VALUE (total from Part)"; and the `of ___,` box covered the
  comma closing its own line.
- **Form 70A.1 p2's first relief checklist** used a ruled table for layout, so
  19 empty cells around the actual checkbox marks became false text fields.
  They are removed, and the printed rule beside `other (specify)` receives the
  checklist's only text field.

Two things deliberately **not** changed, both recorded rather than guessed at:

- **Form 70D.1 p3's "(Name and address of lawyer or party filing)" and "TO:
  (Name and address of other party's lawyer or of other party)"** have no
  writing area. There is a clear band under each, so guide §6's caption anchor
  arguably applies — but neither caption has a twin anywhere in the batch to
  take a column from, and §6 is explicit that where the geometry cannot be read
  off the page it should be said so rather than invented. Worth a decision.
- **Form 70D p2 item 2(a)'s three year boxes graze the descenders of the line
  above.** They are geometrically identical to item 2(b)'s on the same page;
  only the absence of a paragraph gap makes 2(a) look struck through. The strict
  measure — does a box cover a third of a printed glyph? — is clean across the
  whole batch, and the loose measure ("does the box reach into the line above?")
  returns 419 hits that are overwhelmingly a row label sitting beside its own
  cell, which is guide §9.2's documented false-positive trap. Left alone.

## 7. What the other 38 forms taught (2026-08-17)

The financial five were 31 pages of drawn rules and grids. The remaining 38 are
157 pages that lean the other way — **793 underscore runs against the financial
batch's 3** — so they are much closer to Saskatchewan in vocabulary, and most of
what follows is a rule that had simply never been exercised. Gate findings went
**309 → 0**; every fix below is in the builder or the gates, not a per-form
patch.

- **`--promote` is an `os.replace` and will happily overwrite a finished map.**
  Running it over the batch would have destroyed the financial five's 30
  checkboxes, 24 total-row cells and 20 binds. `hand_finished` now blocks it.
  The signal is **binds**, not checkboxes: checkboxes were the tell only while
  `repair_mb_forms.py` was the one placing them, and once the builder emitted
  them too, counting them made every form silently refuse its own second promote.
- **247 more untickable options**, the same defect as the financial five's 30.
  `checkboxes()` is now the single definition of "printed square" for build and
  verify alike, covering the drawn square, the `[ ]` pair and the `☐` glyph, so
  this is structural rather than a repair. `check_unticked_marks` asks the
  converse question.
- **An underscore is not type, for the purpose of spotting an underline.** Word
  draws a rule along each `______` run, so the run covers its own rule 100% and
  `_is_underline` read 45 genuine writing lines as headings. Excluding `_` fixes
  it; Form 70D p3's two real heading underlines still measure 94–95%, which is
  the regression test.
- **…and then the rule and the run both claim the blank.** They rarely agree on
  its extent — Form 70E p6's "Dated at ______, this ___ day of ______, ___."
  draws each rule over only the right-hand end of its run — so `dedupe` now
  merges two same-line boxes that really overlap into their union. Picking one
  and dropping the other left boxes right-aligned inside their own blanks
  (16.7pt against a 105pt line); keeping both stacked two controls per blank.
- **The underscore path had no stacking cap.** `seat_rules` caps a box against
  the rule above it; the underscore branch never did, because nothing in the
  financial batch stacked. Form 70T p1's five-line block rendered as a crush of
  borders. While fixing it: the cap was measured from the rule rather than from
  the box's own bottom, so it had always landed `RULE_CLEARANCE` **past** the
  thing it was meant to stop at.
- **An underline is a ceiling too.** A box hanging up from its rule can cross an
  underlined heading one point above it (Form 70E.2 p2). `seat_rules` now takes
  the underlines as additional ceilings.
- **A band is empty paper.** `writing_area_bands` took its bottom from "the next
  line starting more than 1pt below the caption", which skips a sentence set
  immediately under it — so Forms 70A.1 and 70J p3 put a writing area over
  "There is no possibility of reconciliation or resumption of cohabitation."
  Cut the band at whatever prints in it.
- **Trim a caption's band, don't refuse it.** Form 70T sets "- and -" 16pt above
  the respondent's `(full name),`, so the band reached it and the respondent —
  alone of the two parties — got no box at all.
- **`(a)` `(b)` `(c)` is not a jurat.** Three `)` in a tight vertical stack at
  one x is exactly the jurat bracket column, so Form 70I p1's list of documents
  served was dropped as the deponent's signature rule — and
  `check_unfilled_blanks` excused all three by re-running the same detector. A
  jurat bracket *closes* its line; an enumerator opens one. See guide §9.14b:
  where a check excuses itself by consulting the rule under test, the excuses
  have to be looked at.
- **A sliver is a box narrower than its own blank**, not a box on a short blank.
  Manitoba prints "this ___ day of" (18.4pt) and "20___" (16.8pt); a flat floor
  called five correct boxes defects while still passing a box covering half of a
  200pt line.

Still open, recorded rather than guessed at: Form 70D.1 p3's two "(Name and
address of…)" captions have no writing area and no twin in the batch to take a
column from. Form AA-15 p3's "TO: (name and address of each respondent)" is the
same shape and needs the same decision. Form CFS-11 p2 was resolved by product
review on 2026-08-20: two text lines fill the available band before the
"APPLICATION" heading, matching the adjacent CFS-12 form's control treatment.

**Three Rule 70 items closed on 2026-08-18**, while building batch 2:

- **Form 70Q p1's documentary-evidence area** was placed by
  `narrative_prompt_bands` all along and then *vetoed by the lawyer's signature
  rule sitting in it* — which `build` deletes a moment later, leaving neither.
  `page_boxes` now offers the band detectors the boxes that will **survive**
  `drop_signature_rules`, and offers every box, signature rules included, as a
  **floor**, so the band stops above the rule rather than over it. Form 70G p8's
  "The Applicant's Lawyer is:" and six more documentary-evidence areas (70H,
  70H.1, 70H.2, 70DD, 70C, 70D, 70D.1, 70A.1) came back with it.
- **Form 70L p1's "Consented to:" has no writing area because it does not need
  one.** It heads the petitioner's signature block: 17pt of paper and then the
  signature rule, captioned "Petitioner or Petitioner's Lawyer". The consent is
  given by signing, `BAND_MIN` refuses the 17pt, and `scan_missing_areas.py`
  still reports it — as the one prompt in 86 forms with a band and no field,
  which is the honest place for it to sit.

## 8. What child protection and adoption taught (2026-08-18)

Rule 70 is 43 forms from one Word template. Batch 2 is 43 forms from four
regulations spanning 1999 to 2025, and it broke six rules that had been correct
for 188 pages. Findings went **15 → 0** across three build/verify rounds, and
every fix is in the builder or the gates. **Rule 70's own output is unchanged by
all of them** except where it is strictly better — the diff against a build from
the previous builder is 10 writing areas gained and 3 boxes removed from judges'
signature lines, and that was checked on every one of the 43 before promoting.

- **A heading bracket is not two blanks.** Manitoba rules a document's title
  above and below — `_______ / O R D E R / _______` — in the same 0.8pt filled
  rect as a writing line, with nothing printed on either rule's own line, so
  every test in `printed_rules` correctly passed them and 22 pages carried a text
  box across the form's own title. `heading_brackets` refuses a pair of
  same-span rules with exactly one line between them, centred on the pair and
  clear of both. The genuine ones leave ≥0.30 of the gap above and below the
  heading; a *caption* ("Signature of Interpreter", "(Petitioner)") hugs its rule
  within 0.07, and the nearest non-bracket in Rule 70 is 68pt off centre.
  A parenthetical between the rules captions the rule **above** it — Form CFS-17's
  backing sheet writes "(title of document)" there — so only the lower rule goes.
- **The footer separator.** Word draws a short rule at the left margin above the
  regulation citation ("M.R. 76/2000; 205/2001") and above the copy-distribution
  block. Rule 70 has none — it prints "Form 70N (page 2 of 2)" instead — so 23
  pages seated a box on one, hanging *upward* into the last line of the form's
  own text: over "NOTE: Wording may be adapted if more than one child." six
  times. `footer_separators` refuses a left-margin rule below which everything
  printed is the citation or the distribution block. Read on the lines'
  **bottoms**: Form AA-5 p2 draws the separator 2pt inside the citation's own
  line box.
- **A caption can be printed in the middle of its own blank.**
  `_______(date)_______`, `______(occupation)______`: Word draws one rule under
  the whole thing, and `_clear_rule_start` searches only the left half on
  purpose, so the box was seated straight over the caption — eleven times on one
  page of Forms CFS-22A and CFS-22B. `_rule_segments` splits the rule at the
  type on it and keeps both sides, which is right: "On ______(date)______" gives
  the filer more room before the caption than after. Alphanumerics only — the
  punctuation Manitoba sets against a blank, and guide §4's `$`, are on the rule
  too.
- **The style of cause with no rule and no caption.** Rule 70 draws a rule and
  captions it `(full name)`. Forms CFS-19, CFS-27 and AA-15 leave bare paper
  between "BETWEEN:" and a right-aligned "Petitioner," — so every detector here
  correctly found nothing and the parties had nowhere to go, on the most
  important line of the form. `style_of_cause_bands` takes the role word as the
  anchor and opens the clear line above it, from the left text measure across to
  where the role word ends, which is how a filed Manitoba style of cause is
  typed. "BETWEEN:" must appear above it: without that guard the same words read
  as the signature captions on Forms CFS-13 and CFS-19 p2.
- **A bare role word is a signature caption here, and 40 boxes sat on signature
  lines.** Rule 70 captions every party signature "Signature of X", so
  `MB_ROLE_CAPTION` only ever had to know four court offices. Batch 2 writes
  "Witness", "Parent", "Guardian", "Executive Director/Regional Director". Two
  restrictions, neither of which geometry can supply — the caption is centred
  under its rule in every case, so there is nothing to measure:
  **no parentheses**, because a parenthesised party role is Manitoba's
  *strike-out name* caption (Form 70D p1's "FINANCIAL STATEMENT OF ______
  (Petitioner/Respondent)", Form 70D.5's nine); and **no trailing comma or full
  stop**, which is the whole difference between a signature caption and the
  style-of-cause role word above. "Petitioner", "Respondent", "Applicant" and
  "Co-petitioner" are ambiguous even then — Form 70A p4 labels two *name*
  columns with them — so they are accepted only where they **share a line with a
  caption already known to be a signature**, which is how Manitoba sets a
  signature block: "Witness    Respondent". And a caption may not reach back over
  a `(full name)` note to claim the blank above it, or Form 70Z p2 loses both
  parties.
- **A total row is bold, and the label arrives with its spaces removed.**
  `TOTAL_ROW` was `\btotal\b`, tested against a cell's contents — which is
  `TotalAnnualFamilyIncomeBeforeAdjustments`, so it had never matched **anything**,
  and Form 70D.5's twenty-four totals were put back by hand
  (`repair_mb_forms.fill_total_rows`) rather than by fixing it. Forms CFS-10,
  AA-7 and FA-1 lost 42 cells the same way. Now matched as a substring, plus the
  "Add:" and "Subtract:" arithmetic rows, which are bold for the same reason.

Four smaller ones, each a rule that had simply never been exercised:

- **`clear_of_type` was throwing its own trim away.** Refusing it at
  `MIN_BLANK_WIDTH` does not leave the blank wide — it leaves the box *on the
  type*. "20___" set as a drawn rule butting against the "20" costs 1.3pt out of
  16.5. `MIN_TRIMMED_WIDTH` is what a box must **keep**, not what a blank must
  **be** to earn one.
- **A neighbour is not a ceiling.** Two blanks abutting on one line — Form 70H
  p10's drawn rule ending at x 134.2 and an underscore run starting at 134.2,
  1.2pt apart — shared an edge and a baseline, and reading one as the other's
  ceiling capped the box to nothing. `CEILING_MIN_RISE`/`CEILING_MIN_OVERLAP`.
  While there: an underscore run is a ceiling for a drawn rule, which nothing
  had told `seat_rules` (Form AA-2's jurat, 0.2pt).
- **A band is cut by whatever *is in* it, not by whatever *starts below* it.**
  Form AA-15 p3 runs "(Specify the grounds…)" from y 312.5 while its own caption
  "The grounds for the application are:" ends at 313.6 — 1.1pt of overlap — so a
  test on `y0 > caption.y1` could not see the line it was meant to stop at, and
  the writing area opened over the government's instruction.
- **A parenthetical under a blank is that blank's caption.** Form CA-2 p1 ends
  "person ______ / (insert name if known)", which matched `NARRATIVE_PROMPT` on
  the word "insert" and opened 76pt of writing area in the bottom margin. Only
  where the parenthetical is the **whole** paragraph: Form 70C's "(Insert your
  full name, address …)" closes a sentence that begins with the form's own words
  and is a genuine prompt.

Recorded rather than guessed at:

- **The child-protection style of cause is deliberately unbound**
  (`mb_binds.UNBOUND_STYLE_PREFIXES`). The petitioner on a Form CFS-19 petition
  is the child and family services agency and the respondents are the parents —
  the reverse of every other form in the catalogue, where the party who starts
  the case is the matter's client. Binding it would print the client's name as
  the agency bringing a protection proceeding against them. Adoption *is* bound:
  the applicant is the person seeking to adopt.
- **Forms CFS-27/28's "THE HONOURABLE ______ JUSTICE"** has no writing area. The
  judge's name goes in a gap between two printed lines with a jurat bracket
  column to the right and no rule, caption or cell anywhere near it; guide §6 is
  explicit that where the geometry cannot be read off the page it should be said
  so rather than invented.
- **Form CFS-19 p3's "(Petitioner)"** keeps a text box on what is really a
  signature line. It is the price of the no-parentheses rule above, and the rule
  is worth more than the box: without it Form 70D p1's financial statement loses
  the line the party's name goes on.

## 9. Reading the pages

Both batches were read page by page with the overlay drawn on, after
`verify_mb.py` reported zero findings — guide §9's through-line, and it held
again: **six of the nine defects in §8 were invisible to every gate**, because
no gate was asking the question. The renders come out of `_incoming_mb/qa/`,
which `build_mb_forms.py` writes on every run.

`scan_missing_areas.py` is the other half — it reads the *words* and asks
whether anything was placed near them, which is the only way to find a prompt
with nowhere to answer. Across all 86 forms it now reports one hit, Form 70L
p1's "Consented to:", and §7 records why that is the right answer rather than a
missing field.

## Overlay convention

Unchanged from Saskatchewan, BC and Ontario. `field.x` = box left in points,
`field.y` = box top in points (y down), `width`/`height` = points × 1.5.
`FillPdf.savePdf` stamps `y = pageH − field.y − height/1.5`.

The measured constant specific to Manitoba: the printed rule is a filled
rectangle 0.72–0.84pt thick, and the box is seated 1.3pt above its centre. The
next thicker filled rect on any of these pages is a 9pt shading band, so the
`RULE_MAX_THICK = 1.6` cut has 8pt of clear air in it.

## Seating boxes on their printed rules

```
python3 seat_mb_on_rules.py [--check]
```

`RULE_CLEARANCE` seats a box's bottom edge *above* the rule it belongs to. The
viewer draws its own bordered control inside the rectangle we store, so that
clearance reads on screen as a control hovering above its line, with the printed
rule showing as a second line beneath it. Not one of the 1,427 text boxes in the
four child-protection and adoption families was on its line.

**It measures each box rather than nudging them all by a constant.**
Saskatchewan's two families each floated by a single value -- 0.75pt and 0.69pt,
identical across every box -- so `sk-forms` seats them with one constant per
family, which there is exactly equivalent to measuring. Manitoba does not behave
that way: within one family the float ranges 1.25-1.62pt (MBCFS) and 0.95-2.40pt
(MBAD), because Manitoba draws its blanks two different ways -- underscore runs
*and* line-art segments -- and mixes font sizes on a page. A constant would seat
the bulk and leave the rest floating, which is the defect it was meant to fix.
Reading each box's own rule off the rendered page self-corrects for both.

| Family | Boxes | Shift applied | Result |
| --- | --- | --- | --- |
| `MBAD_` | 562 | median +1.34pt | 562/562 on the line |
| `MBCA_` | 68 | median +1.61pt | 68/68 |
| `MBCFS_` | 648 | median +1.61pt | 648/649 |
| `MBFA_` | 148 | median +1.92pt | 148/148 |

The one box left is one with no measurable rule beneath it; a box whose rule
cannot be found is left exactly where the builder put it, as are the 61 writing
areas that sit in blank space. Checkboxes are excluded and must be -- they are
seated on a printed mark, which the shift would walk them off.

**It repairs in place rather than rebuilding**, for the reason in guide 1 and in
`hand_finished()`: every one of these forms is promoted and bound, and
`--promote` is an `os.replace` that would destroy that. So it writes back the `y`
key alone, asserting every other key is byte-identical first, the way
`rebind_mb_forms.py` writes back only `bind`. Idempotent -- a box already seated
measures a zero shift. Rule 70 (`MBKB_`) has the same float and is deliberately
left alone: those 43 templates are reviewed and shipped, and this is a seating
preference rather than a defect.

Verified against a HEAD baseline rather than in isolation: `verify_mb.py` reports
the identical findings before and after, so the shift introduces none.

## A caption printed inside the rule

```
python3 split_caption_rules.py --only MBCFS_22A [--check]
```

Manitoba draws its blanks as line art, and some forms print the instruction
*inside* the rule rather than under it:

    On ________(date)________, 20___, at ____(time)____, I personally served
    I served ________(identify person served)________ by leaving a copy ...

The builder boxes the stretch of rule after the caption and drops what is in
front of it. On Form 22A that gave the filer a 44pt box on a 113pt rule, and
where both halves were narrow it gave nothing at all -- "I served ___(identify
person served)___" and "her at ___(state address where the person was served)___"
had nowhere to type on the whole of page 2.

This finds each drawn rule, subtracts the glyphs actually printed on it, and adds
a field on every clear stretch wide enough to write in. It only ever **adds**, so
the seating `seat_mb_on_rules.py` applied is preserved and a stretch that already
has a box is skipped. Idempotent.

Two things it has to get right, both found by it reporting the wrong answer first:

- **Only boxes seated on *this* rule can serve it.** Testing a stretch against
  every field on the page lets a full-width writing area elsewhere on the sheet
  mask all of them, and the first run reported nothing to do at all.
- **A glyph belongs to a rule only if it is printed on it.** Measured on 22A, a
  glyph sitting on a rule has its box bottom 0.4-0.5pt below it while the line
  above sits 10.5-12pt higher. Opened to a line's height, the window swallowed
  the wrapped text above ("...re: transfer proceeding under s" over the "the
  hearing set for ___(date)___" rule) and read that rule as having no clear space.

And one it deliberately refuses: a rule is only touched if a **parenthesised
caption is printed in its interior**. A rule with clear space and no interior
caption is one the builder left alone on purpose -- a signature line, a heading's
underline (whose text starts at the left edge, so its span is not interior), or a
ruled narrative line that already has a writing area over it. Without that filter
the first pass proposed 16 boxes, six of them on exactly those.

### Moving the caption under the rule instead

```
python3 caption_under_rule.py --only MBCFS_22A [--check]
```

Boxing a rule either side of its caption leaves the caption sitting between two
controls and the writing space cut in half. This takes it off the line instead:
the glyphs are redacted out of the background and redrawn *underneath* the rule
at a fraction of the size, and the rule -- clear end to end now -- gets **one**
box across the whole of it. Ten captions on 22A.

The size is per caption, not fixed, because the room under a rule is not: 5.5pt
where there is space, down to 3.8pt under "(name)" and "(dated)" on page 1, where
the next line of the same sentence starts 4.0pt below the rule. It is the largest
size whose ascender and descender fit the measured gap.

Moving a caption can make a rule fillable that never was. 22A's "which
___(is/are)___ returnable on" left 3.5pt and 4.7pt either side of the caption,
both under `MIN_BLANK_WIDTH`, so it had no box at all; clearing the caption makes
the whole 41.8pt rule writable and it gets one.

> **This is the one place the pipeline rewrites the government's page.** Every
> other Manitoba background ships byte-identical to the King's Printer's file,
> which is the property that lets a re-fetch be diffed against what we ship. That
> is not true of a form this has touched, and it is a layout change to a
> prescribed court form: the instruction still reads, in the same words, at the
> same point in the sentence, but small and below the line rather than on it.
> Whether that is acceptable is a decision about the form, not about the code.
>
> `build_mb_forms.py` copies the source PDF over the promoted one, so **a rebuild
> reverts this** and it has to be re-run afterwards. It is idempotent: a caption
> already moved is no longer on its rule, so there is nothing left to find.

**A caption that spans a line break** is handled too. 22A sets "(name of person
served/ name of person and agency served)" across two lines: the opening half on
the rule that ends one line, the closing half on the rule that starts the next.
Neither half reads as a caption on its own, so both were skipped and both rules
stayed unfillable. The whole caption goes under the *first* of the two rules --
at this size it fits on one line -- and both rules are then cleared and boxed.

Sized to fit the rule it goes under as well as the gap beneath it: joined, the
caption is 56 characters and would overrun the 122pt rule at 5.5pt, so it steps
down until it fits (5.0pt here).

The caption ends at its bracket, and this matters: the form sets the sentence's
comma hard against it -- "...agency served) ," -- so the comma falls in the same
glyph run. Carried along, it was redacted off the line it punctuates and
reappeared inside the caption, leaving line 2 reading " with a true copy of".
Everything after the closing bracket stays where the form put it.

## Product-review regressions to check on Manitoba forms (2026-08-20)

The following defects were found while reviewing Manitoba child-protection,
adoption, child-abuse and family-income forms in the viewer. They are recurring
layout patterns, not isolated coordinate fixes. Apply these checks to the whole
form and to repeated structures on the same page.

### Checkboxes can be symbol-font text

Do not look only for Unicode checkbox characters or vector squares. Manitoba
source PDFs also encode printed check marks as ordinary-looking text in symbol
fonts:

- CFS-19 page 2 and CFS-20 page 2 use the literal character `9` in
  `WP-IconicSymbolsA`.
- FA-1 pages 1 and 2 use the literal character `G` in
  `WPTypographicSymbols`.

When the page says "check appropriate box(es)" or "check only one", visually
account for every printed box. Measure the rendered ink, not the symbol font's
full character box, and create a `CheckBox` with `shape: "square"`. Mapping
width and height remain rendered points multiplied by 1.5. Check every option;
finding one box does not prove the group is complete.

### Blank party bands around `-and-` need separate fields

Style-of-cause pages often have large blank bands whose only nearby text is a
right-aligned role caption. Examples include CFS-13, CFS-14, CFS-15 and AD-10,
AD-11, AD-13 and AD-14_1. Captions seen in this review include:

- `("the agency")`, `("the parent or parents")`,
  `("the guardian or guardians")` and `("the mother")`
- `(prospective adoptive parent)` and `(birth parent/guardian)`
- bare `Applicant` and `Respondent`

Add one single-line `TextField` in the clear band immediately above each role
caption, including both parties separated by `-and-`. Do not cover the whole
style-of-cause area with one `TextArea`; AD-10 demonstrated that this prevents
the applicant and respondent from being entered independently.

AD-16 and AD-17 have the related child/application pattern: the child's given
names and birth-registration number and the applicant are two distinct blank
bands and require two distinct single-line fields.

### Context decides whether a ruled blank is a signature

A parenthesised caption is not automatically a signature caption. CFS-12's
`(judge)` blank occurs in the sentence structure `___ of ___ of ___` alongside
court and jurisdiction information, so it is a data field. Read the sentence
and surrounding labels before suppressing it.

Conversely, do not place an input on a line explicitly labelled `Signature`.
For repeated witness/signature rows, add inputs to every line labelled
`Witness` and leave every corresponding signature line untouched. AD-5 page 2
has two such rows; checking only the first row caused both a missing witness
field and an erroneous signature field.

### Match field type to the printed writing structure

- Use separate single-line `TextField`s for separate printed rules. CFS-22A
  page 2 originally had one large `TextArea` spanning three writing lines; each
  rule needs its own field.
- Use a `TextArea` only for a genuinely open narrative region. AD-4 page 1 had
  an erroneous large area above existing Name, Address and Occupation lines;
  AD-4 page 2 and AD-5 page 2 had erroneous areas under `IN THE PRESENCE OF`.
  Those areas must be removed, with the actual witness lines handled separately.
- A `TO:` or name-and-address block can require multiple single-line fields even
  when OCR sees one blank region. CFS-11 page 2 uses two fields in the available
  band, following the structure visible in CFS-12.

### A labelled table cell can still contain writable space

Do not classify an entire table cell as non-writable merely because its label is
printed inside it. CA-1 page 2 exposed this failure across almost the whole page.
The blank space below the label still needs an input for alleged-abuser names,
known names, address, city/town, province, phone numbers, dates, agency fields
and the abuse co-ordinator. Segment the label area from the answer area. Its
large Section B information block is the contrasting case: it is a genuine
`TextArea`, ending above the printed instruction to attach more pages.

### Bold and total rows still need inputs

Bold text, shading and the word `Total` are not reasons to suppress numeric
cells. CFS-10 and FA-1 both lost all three fields in these rows:

- page 3: `Total Deductions from Annual Family Income`
- page 4: `Total Adjusted Annual Family Income`

These are three single-line money fields per row (both Applicant columns and
the Total column), not text areas. Audit every numeric column. Normalized PDF
text may remove spaces or merge bold runs, so total-row matching must tolerate
those extraction differences.

### Required regression pass

For every Manitoba mapping repair:

1. Inspect the entire affected page, not only the reported location. Count all
   checkbox options, party bands, ruled lines, repeated witness rows and table
   columns.
2. Render the overlay and verify that controls sit on the intended printed ink
   without covering labels or signature lines.
3. Validate unique IDs, positive dimensions, page bounds and printed-text
   overlap, then dry-run the importer for every affected `docId`.
4. Update `form-template-export/audit.json` whenever a mapping's field count
   changes. When removing a false field, assert that its ID and type are gone.
5. Put the fix in the builder/repair source when possible. If a promoted mapping
   is deliberately hand-finished, document that exception because rebuilding
   can overwrite it.

## 10. Batch 3 -- the six families Rule 70 and the regulations do not carry (2026-08-21)

`mb_sources_batch3.py`. **54 forms, 243 pages, 3,668 fields, 140 binds, zero
findings.** The catalogue is 140 Manitoba templates.

| Category | Forms | Pages | Fields | Binds |
| --- | --- | --- | --- | --- |
| Provincial Court - Family Rules | 8 | 36 | 623 | 55 |
| Relocation - Family Law Act | 3 | 10 | 41 | 0 |
| Relocation - Divorce Act (federal) | 3 | 18 | 61 | 0 |
| Child Protection - Briefs | 4 | 16 | 86 | 8 |
| FOAEAA | 16 | 77 | 795 | 77 |
| Interjurisdictional Support | 17 | 62 | 1,577 | 0 |
| Protection Orders | 3 | 24 | 485 | 0 |

Six hosts and three file formats, against one host and one format for batches 1
and 2 -- and this is the batch where every source kind the repository knows
about turns up in one province.

### The widget path

**22 of the 54 carry the government's own field rectangles**: all 17 ISO forms,
both protection-order applications and all three federal notices, up to 309
widgets on ISO Form I. `fetch_mb.py` has always said a fillable source "should
route to the widget path rather than the detector path"; `build_mb_forms.is_fillable`
is that route, and it calls `bc_pipeline.extract` -- the same code BC's
Provincial forms take -- rather than growing a third copy of it. Reading what
the form declares is strictly better than detecting anchors: `page_boxes` finds
0 rules and 25 underscore runs on ISO Form A.1 against 112 declared widgets.

Two consequences worth knowing:

- **The background is flattened, not copied.** These are the only Manitoba
  templates whose PDF is not byte-identical to the government's file. Leaving
  the widget layer would put the government's AcroForm fields underneath our
  overlay and the viewer would draw two controls per blank, so
  `flatten_background` deletes the widget annotations and the /AcroForm entry.
  The printed page is untouched: on ISO Form B the flattened render is
  **pixel-identical** to the source at 2x on all three pages, and the text layer
  compares equal.
- **`verify_mb.py` asks a widget template different questions.** Every check in
  `CHECKS` re-derives a printed anchor and asks whether the mapping agrees with
  it, which is the right question only when the box was reconstructed from that
  anchor. Asked of the ISO set it produced 814 findings across the province,
  every one of them saying "this is not where I would have put it" rather than
  "this is wrong". `WIDGET_CHECKS` keeps what still applies -- bounds, unique
  ids, overlap, and a box covering printed text -- and the sliver test is
  skipped for the same reason (the ISO affidavit's "Page __ of __" slots are
  13.3pt because a page number needs 13.3pt).

### XFA

ISO Forms B, F and H are XFA. They are **static** XFA: the AcroForm layer and
the page content stream are the authoritative rendering, which is checked rather
than assumed -- flattening Form B leaves a pixel-identical page and zero
widgets. So they need no headless flatten and take the ordinary widget path, and
BC's `xfa/` tooling is not involved. A *dynamic* XFA source would not behave
that way and would have to be caught here; the fetch classification records
`xfa` on every one of them so a future reissue is visible.

### Word

**20 forms have no official PDF at all** -- the four child-protection briefs are
`.doc` and all sixteen FOAEAA forms are `.docx`. `fetch_mb.py` renders them
through LibreOffice, and this is a real change to what the pipeline ships: every
other Manitoba background is byte-identical to the King's Printer's file, and a
rendering is not the prescribed form. It is checked rather than trusted -- every
FOAEAA form prints its own pagination in its header ("Form 1A - FOAEAA - page
1/3") and all sixteen conversions reproduce the declared count exactly; the four
briefs print no such marker, so their page counts are the conversion's own and
are a regression guard only. The manifest records `converted: true` and the
converter's version for each. Whether a converted prescribed form is acceptable
is a decision about the form rather than about the code, in the same sense
`caption_under_rule.py` is, and it is recorded rather than made silently.

### What the batch taught the detectors

Every fix is in the builder or the gates, and each was checked against the 86
already-shipped templates before being kept.

- **An option can be an ordinary letter in a symbol font.** WordPerfect's symbol
  faces map their box onto a character that reads as text, so `get_text()`
  returns `G` (WPTypographicSymbols) or `9` (WP-IconicSymbolsA) and nothing
  about the string says it is a square. `mb_marks.SYMBOL_MARKS` names the pair,
  font and character together, because a bare "G" is a letter everywhere else on
  the page. This is what left the relocation schedules with no tickable options
  at all -- and it is the same defect behind twelve of the seventeen findings
  that stood on the shipped batch (§11).
- **A parenthesised office is a name blank, not a signature.** `(judge)` and
  `(court)` caption the blanks in "order granted by ______ of ______", which
  name the judge and the court; a bare "Deputy Registrar" or "Clerk of Court" is
  where an officer signs. `MB_OFFICE_CAPTION` no longer accepts the optional
  bracket, which is the rule `MB_PARTY_CAPTION` already stated.
- **A witness writes their name; they do not sign.** `MB_WITNESS_CAPTION` marks
  the signature block for the ambiguous-role test without condemning its own
  rule, so "Witness    Signature" gets a box under the first and none under the
  second.
- **A row label's answer is the cell beside it.** Manitoba's own rule is that a
  cell may ask its question and be answered inside itself (Form 70W's
  "Address:"); the relocation schedules do the opposite, and the cell alone
  cannot tell them apart. The *row* can: something empty to the right is where
  the answer goes.
- **A cell answered after a one-line label is one line.** Measured against the
  cell instead, Schedule A's 20pt "Name:" row came out at 1.93 "lines" and every
  field in Part A was a resizable area for a single name.
- **A labelled cell can still have writable space.** The schedules set
  "Children's names" and its explanatory paragraph at the top of a 215pt cell
  and leave the rest blank; `_cell_answer_band` segments the label from the
  answer rather than refusing the cell.
- **A `$` with no rule takes its twin's column** (`dollar_twin_slots`).
  Provincial Court Form 4 p5 sets its expense rows as "Parking  $______" and
  closes with "SUBTOTAL  $" and no rule at all, so the one figure that is the
  sum of the column had nowhere to go.
- **An amount control inherits the printed prefix's line box**
  (`fit_currency_anchors`). A `$`, `-$`, `=$`, or standalone table `=` supplies
  both the vertical position and height; the field begins immediately after
  that prefix instead of filling or dropping to the bottom of a tall cell.
- **Two boxes in a column may not overlap at all** (`cap_stacking`). The viewer
  draws a bordered control inside each, so even 0.3pt puts one border through
  the other.

## 11. The findings that stood on the shipped batch, and how they closed

`verify_mb.py` reported **17 findings on six forms** at the batch-3 starting
commit -- not a regression in the mappings but the gates failing to keep up with
the hand repairs made during product review, and every one an instance already
written up under "Product-review regressions" below.

* **Twelve `checkbox-mark`** on CFS-19, CFS-20 and FA-1: the repairs had added
  `CheckBox` fields for marks printed as symbol-font letters, and
  `check_unticked_marks` only knew the drawn square, the `[ ]` pair and the `☐`
  glyph, so it read a correctly-placed box as sitting on nothing. Closed by
  teaching `mb_marks` the vocabulary, which is structural rather than a repair.
* **Five `signature`** on CFS-12, AA-4 and AA-5: `(judge)` and the witness lines,
  above.

Correcting those three detectors then made the builder *keep* rules the
already-promoted maps had no field on -- 52 of them across 26 forms. Those maps
cannot be rebuilt (`hand_finished` blocks `--promote` because they carry binds),
so `repair_mb_forms.add_missing_rule_fields` asks the corrected builder what it
would put on each rule the gates report as unfilled and adds exactly that. It
names no coordinates and is a no-op once applied. Two more repairs came out of
the same pass: `drop_signature_line_fields` removes a box the corrected builder
now drops, and `drop_presence_areas` removes the writing area opened under "IN
THE PRESENCE OF", which product review had asked for and which was also sitting
on the witness rule underneath it and stopping that rule getting its own box.

**Both provinces now verify with zero findings** -- Manitoba 140 forms,
Saskatchewan 121.

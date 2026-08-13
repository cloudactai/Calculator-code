# BC batch 2 — page-by-page visual review

One entry per group of the picker's folders, in catalog order. 145 forms, 421 pages,
167 contact sheets in `_incoming_bc2/sheets/` (regenerate with
`python3 contact_sheets2.py`). Nothing here is fixed until the render has been read —
placement guide §7.11.

Status key: **OK** looked at, nothing to change · **FIX** defect confirmed on the page ·
**JUDGEMENT** defensible either way, decision recorded.

---

## Two batch-wide classes the visual pass found that the gates did not

### A. Duplicated printed blocks (the flatten drew both branches of a conditional)

`build_bc_batch2.py`'s collision check only fires when two pieces of text are drawn on
the *same baseline*. Where pdf.js lays the two branches out **stacked instead of
overlapping**, the page prints the block twice and every gate passes. Found on F1:

* **p2** prints "English / French / English and French (bilingual)" twice — once inside
  the bordered panel at y 244–308, once bare at y 314–372 — so the form offers six
  checkboxes for a single official-language choice.
* **p4** prints the children table's header row twice, at y 218–240 and again at
  y 257–280, before the first data row at y 285.

A first sweep for repeated consecutive line runs reports 141 hits across 22 forms, but
it counts sub-blocks separately and does not yet know that some repetition is correct:
F1 p8/p9 are two lawyer's certificates and p10/p11 two party's certificates, which the
form itself asks for ("each of the lawyers must complete a certificate"). Needs the
maximal-block fix and a legitimate-repeat rule before the count means anything.

### B. A single-line slot typed `TextArea`

§8's "two `type` values for the same kind of cell", batch-wide: **443 `TextArea` fields
are ≤20 pt tall** across 93 of the 145 forms, and **89 adjacent same-column rows carry
different types** across 83 forms. The most visible instance is the heading block on
nearly every Supreme form — `Court File No.` comes out `TextArea` while `Court Registry`
directly beneath it, same width, same height, comes out `TextField`. The app draws the
two differently, so the two lines of one heading do not match.

XFA tags these cells inconsistently and the build trusts the tag. §8's rule is to
normalise **per table, to whichever the majority already is** — not globally, since
single-line cells like dates and hour counts are legitimately `TextField`.

---

## Group 1 — Supreme Court – Applications (5 forms, 22 pages, 7 sheets)

| Form | Pages | Verdict |
|---|---|---|
| F1 Notice of joint family claim | 13 | **FIX** ×3 |
| F73 Petition to the court | 4 | **FIX** ×2 |
| F74 Response to petition | 3 | **FIX** ×2 |
| F78 Jurisdictional response | 1 | **FIX** ×1 (class B only) |
| F90 Objection | 1 | **FIX** ×1 (class B only) |

### F1 — Notice of joint family claim
* p1 **OK**. Heading, both claimants, relationship-history checkboxes and their date
  boxes all seated. "A. Personal Information:" correctly has no answer area — the
  section's answer is the table that opens p2 (recorded in `place_missing_bc2.SKIP_AREAS`).
* p2 **FIX** — class A, duplicated official-language block, 3 spurious checkboxes.
* p3 **OK**. Both confirmations, proof-of-marriage checkbox with its filing box, and the
  two "because" writing areas.
* p4 **FIX** — class A, duplicated children-table header. Also **FIX**: the table's
  first data row is typed `TextArea / TextField / TextArea` against `TextField ×3` on
  rows 2–4 (§8 — normalise to the row majority).
* p5 **OK**. Spousal support and property areas; "B. Other property claims" is the area
  `place_missing_bc2.py` added, correctly filling the blank under the instruction.
* p6 **OK**. Item 7, addresses for service, both signature blocks — no box on either
  signature rule, print-name boxes below their captions (§9.8).
* p7 **OK** — instruction page, 0 fields, correctly so.
* p8–p13 **OK**. Two lawyer's certificates, two party's certificates, two legal
  adviser's certificates. The repetition is what the form asks for, not a flatten fault.

### F73 — Petition to the court
* p1 **FIX** — class B (`Court File No.` `TextArea` vs `Court Registry` `TextField`).
  Everything else seated: parties, "ON NOTICE TO", registry address, time estimate, and
  a single correct official-language panel.
* p2 **OK**. Both "brought by" options, address for service, fax/e-mail, lawyer's
  address. The one-line address-for-service box is the government's own rect and the
  instruction asks only for a street address — left as published.
* p3 **FIX** — **Part 4 "Material to be relied on" has no answer area.** The government's
  XFA emits a *pair* per Part: a 14.4 pt paragraph-number `input` at x 72 and a 447.6 pt
  `textarea` at x 86.4. Parts 1–3 have both; Part 4 has only the number slot, and
  `merge_sliver_fields` widened that lone 25.5 pt slot to 484 pt at the foot of the page.
  So the item reads as a stray line, which is §9.5's exact shape.
* p4 **OK**. Part 4's continuation area, date, signature checkboxes with the print-name
  box, and the court-only panel — no box on the judge's signature rule.
* **JUDGEMENT**: on Parts 1–3 the pipeline merged each number slot into its adjacent
  writing area, giving one box per Part instead of two. Batch 1 shipped with the same
  behaviour, so it is left alone for consistency rather than split now.

### F74 — Response to petition
* p1 **FIX** — class B twice: the heading pair, and Part 1's paragraph-number blank typed
  `TextField` against Part 2's identical blank typed `TextArea`.
* p2 **FIX** — same as F73 p3: **Part 6 "Material to be relied on" has no field**, only
  the printed "1.", with the writing area appearing on p3.
* p3 **OK**. Continuation area, date, signature block, address for service, fax, e-mail,
  lawyer's name, and the notice panel.

### F78 — Jurisdictional response
* p1 **FIX** — class B (heading pair) only. Otherwise clean: name box, both
  jurisdiction checkboxes on their marks, date, signature checkboxes with the print-name
  box below the caption, address for service, fax and e-mail.

### F90 — Objection
* p1 **FIX** — class B (heading pair) only. Otherwise clean: party and lawyer boxes,
  date, signature checkboxes, print-name box.

---

## Group 2 — Provincial Court – Applications (2 forms, 15 pages, 3 sheets)

Both **OK**. The Provincial AcroForm path produces clean pages here — every writing cell
boxed, every column heading left alone, no box on a signature rule.

| Form | Pages | Verdict |
|---|---|---|
| Form 9 Application for permission and review of family justice manager order | 3 | **OK** |
| Form 15 Application about priority parenting matter | 12 | **OK** |

* **Form 9** — p1 heading block, both parties, the additional-party checkbox and its two
  rows, the notice checkbox, and the court-appearance block all seated. p2 instructions,
  0 fields, correct. p3 item 5's reason area fills its blank; address-for-service block
  complete. The two stacked boxes under "Lawyer's name and firm name" are the
  government's own pair of widgets — a second ruled line for a long firm name, which is
  §9.6's "take the band, not the first hit", already right.
* **Form 15** — p1–p3 and p6 are cover and instruction pages with 0 fields, correct.
  p4's children table boxes its four data rows and leaves the column headings clear
  (§9.2 avoided). p5's whole priority-parenting checkbox list is on its marks. p7, p8,
  p10 put a `TextArea` over each ruled writing block rather than a line at its foot
  (§9.5 avoided). Schedule 1 (p9) and Schedule 2 (p11–p12) complete, including the
  Indigenous-ancestry list where the bulleted Treaty First Nation names correctly get no
  boxes.

## Group 3 — Provincial Court – Replies (3 forms, 64 pages, 11 sheets)

| Form | Pages | Verdict |
|---|---|---|
| Form 6 Reply to an application about a family law matter | 42 | **FIX** ×1 (p3) — all 42 pages read |
| Form 8 Reply to a counter application | 16 | **OK** |
| Form 19 Written response to application | 6 | **OK** |

* **Form 19** — all 6 pages OK. p1–p3 instructions with 0 fields; p4's parties and
  reply blocks; p5's five narrative areas each filling their ruled block; p6's
  continuation area, additional-page checkbox and address-for-service block.
* **Form 8** — all 16 pages OK. Schedules 1–6 complete: every narrative area fills its
  ruled block, the undue-hardship and companion-animal checkbox lists are all on their
  marks, and the Schedule 6 animals table boxes its rows and leaves its heading clear.
  p3's instruction table prints `❑` glyphs and correctly gets no fields.
  *Source quirk, not ours*: p13's footer reads "Schedule 5" while the page is Schedule 4.
  The government's PDF says that; the text is left as published.
* **Form 6** — **only p1–p6 read so far** (sheet 1 of 7). p1, p2, p4 are cover and
  instruction pages with 0 fields, correct. p5's parties, relationship and children
  blocks are seated, with the children table's heading left clear. p6's continuation
  row, item 5, the cultural-heritage area, the existing-order Yes/No pairs and the
  Part 6 reply panel are all correct. **p3 FIX**, see below.
  **p7–p42 read and all clean.** Schedules 1–17 mirror Form 8's structure exactly (the
  two are the reply pair), which is itself a good sign: every narrative area fills its
  ruled block, every checkbox list sits on its marks, the guardian and companion-animal
  tables box their rows and leave their headings clear, and the Indigenous-ancestry list
  correctly puts no boxes on the bulleted Treaty First Nation names.

### A regression my own placement pass introduced — BCPC_6 p3

`place_missing_bc2.py`'s `cell_targets` added field `…468` (85×13 pt at x 320.6, y 390.6)
into an **empty cell of the instructions table** on Form 6 p3 — the "Schedules or forms
for specific family law matters, as applicable" panel. Page 3 is guidance, not a form
page, and the government gives it no fields at all.

The naive guard — "never add to a page the government left field-less" — is **wrong**,
and F37 p9 proves it: that page has no government fields either, and it is a real form
page (Supplementary Child Support Fact Sheet E) whose tables genuinely need boxes. So
the guard has to be narrower: `cell_targets` may only fire on a page that already
carries a government field, because a ruled table wanting cells is on a form page. The
underscore-rule and answer-area targets keep firing anywhere, since a printed blank is
far stronger evidence than an empty rectangle.

29 fields sit on pages with no government field: BCPC_6 p3 (1, wrong), BCSC_F101 (2) and
BCSC_F37 (26) — the last two intended, being the handwriting-typeset variant.

### And the same page shows `cell_targets` is *under*-reaching — F37 p9

On F37 p9 only the **first column** of each table got boxes. Two causes, both in
`cell_targets`:

* **A cell holding only a printed `$` is skipped as "has printed content".** The
  Monthly Amount column is exactly that, and §7.5 says the amount field belongs beside
  its `$`, not on it — so those cells need a box inset past the glyph, not no box.
* The "Terms of debt", "Relationship" and "Nature of duty" columns are empty and still
  got nothing, and section 2's expenses table got nothing at all — so the
  four-sides-spanned test is rejecting real cells. Needs reading against the page's
  actual rules before it is loosened.

---

## Group 4 — Supreme Court – Financial (1 form, 1 page)

| Form | Pages | Verdict |
|---|---|---|
| F9 Agreement as to annual income | 1 | **FIX** ×1 (class B only) |

Clean apart from the heading pair. The amount box starts *after* the printed `$`, which
is §7.5 satisfied.

## Group 5 — Supreme Court – Orders (6 forms, 16 pages)

| Form | Pages | Verdict |
|---|---|---|
| F19.4 Case plan order | 4 | **OK** (p2 repaired earlier) |
| F25 Order for examination of persons outside the jurisdiction | 3 | **FIX** ×1 (class B only) |
| F27 Order for issue of a letter of request | 1 | **FIX** ×1 (class B only) |
| F83 Order to register foreign judgment | 2 | **FIX** ×1 (class B only) |
| F85 Order to waive fees | 2 | **FIX** ×2 — see below |
| PD-58 Sealing order | 4 -> 3 | **FIXED** — duplicated sections dropped |

* **F19.4** — p2's collided discovery-table header is repaired and reads correctly. p1's
  three party rows, both judge checkboxes, the conference block and both signature blocks
  are right. p3 and p4's step tables and the trial block are complete.
  **JUDGEMENT**: p1 has a box under "By the Court." above the "Registrar" caption. Batch
  1's F51, F52 and F33 — already reviewed and shipped — all carry a box in the same
  place, so this matches the approved set rather than departing from it.
* **F25** — all three pages complete: the "BEFORE" block, the application and hearing
  lines, all four address areas, and the two narrow day-count boxes (34 pt, legitimately
  small number fields, above the 22 pt sliver floor). p3's "By the Court." correctly has
  no box, there being no registrar caption.
* **F85 — the worst form found so far.** Two blanks with no field at all on p1:
  1. "THIS COURT ORDERS that no fees are payable by" is followed by a **drawn 252 pt
     rule** at x 324, y 397.7 with nothing on it.
  2. "…in relation to" is followed by roughly 200 pt of bare paper with no field, so the
     order cannot say which fees are waived.
  p2 carries only "By the Court" and no field, which is correct (§5).

### A third detector gap, found by F85 — `rule-no-field`

`check_unfilled_blanks` looks for underscore *characters*, so a writing line the form
drew as **line art** is invisible to it, and `check_answer_spaces` only fires on a
caption ending in a colon — "in relation to" ends in neither. F85 slipped through both.

`verify_bc2.check_unboxed_rules` now covers the first half of that gap. Calibrating it
mattered: the naive version reported **277 rules across 44 forms**, including 8 on
BCPC_19, a form confirmed clean by reading all six of its pages. Two exclusions fix it —
a rule that is the edge of a drawn box is a panel border, and a rule doubled within
~2 pt is a decorative double border. That takes it to **115 across 32 forms**, with
BCPC_19 at zero and F85's real one retained. The heaviest are S-51 (32), SUP916 (11),
F1 (9), F37 (8), BCPC_12 (7) and PFA916 (7) — the same handful of forms that keep coming
up. Each still needs a page read before anything is placed.

The second half of the gap — an answer space introduced by something other than a colon
— has no detector yet and is being caught by reading.

### Placement-pass bugs found and fixed this round

* `cell_targets` boxed the **instructions table** on BCPC_6 p3. Guarded by page text
  density: cells are only placed on pages under 1,500 characters, which separates the
  guidance pages (2,000–5,600 chars; BCPC_6 p3 is 4,361) from the sparse form pages
  (53–924; F37 p9 is 533). Two blunter guards were tried and rejected — see the comment
  in `place_missing_bc2.py`.
* `grid_cells` read the table **rules first** and so missed every cell of a table drawn
  as per-cell rectangles — F37 p9's columns 2 and 3. A cell-sized rectangle is now taken
  as a cell directly.
* The grid fallback built its columns from **every x on the page**, so table 2's
  verticals at x 360 and x 504.5 cut table 1's columns short on F37 p9. Columns are now
  derived per row band from only the verticals that span it.
* `ink_columns` measured a cell's **own drawn border** as ink, so insetting an amount box
  past its `$` collapsed it to zero width and F37 p9's whole Monthly Amount column was
  dropped as "too small". It now measures inside the borders.

F37 p9 now boxes all three columns of tables 1 and 3 and the amount column of table 2,
each amount box starting past its `$`. **Still outstanding on that page**: table 2's
"DETAILS OF EXPENSE" column, where the government's own rules are irregular (its top
rule spans x 73–361 while the cell needs 91–379), so the four-sides test rejects it.
Left rather than loosening the rule and risking invented cells elsewhere.

### F27, F83 — clean apart from class B

* **F27** (1 page) — the "BEFORE THE HONOURABLE" block, the application and hearing
  lines, and the date are all seated. Items 1 and 2 are fixed text with no blanks, and
  "By the Court." correctly carries no box.
* **F83** (2 pages) — p1's judgment-dated and court-name boxes are right. p2 completes
  the sentence across the page break — creditor area, debtor box, "the sum of $[box]",
  and the costs pair — with both amount boxes starting after their printed `$` (§7.5).

### PD-58 — the document was in the file twice, now resolved

Shipped as 4 pages, and **two of its sections appeared twice**: p2's five-row sealing
table was repeated on p3, and p3's item 3 was repeated on p4 in a different layout. This
is class A again, but at section scale rather than block scale, and no gate saw it — the
copies are on different pages, so nothing collides and nothing overlaps.

`blank_pages.mjs` could not help: it reports all four pages as `wizard`, the template
naming no subform. So the split was resolved by reading the pages, which is what the
guide's golden rule asks for when the template is silent:

* p2 is essential — only it carries item 1 and item 2's redaction direction;
* p4 is essential — only it carries the signature blocks;
* therefore **p3 is the spurious variant**, duplicating p2's table and p4's item 3.

`build_bc_batch2.KEEP_PAGES` now keeps p1, p2 and p4, giving a coherent three-page order,
and the re-render confirms it: heading and before-block, then orders with the complete
table and item 2, then access and both signature blocks with no box on either signature
rule. Row 1b "Entire court file" correctly has no Description box — the row names itself.

**JUDGEMENT**: the Duration column carries two or three stacked boxes per row against the
header's three options ("until further order of the Court; until the first day of trial;
or until a specific date"). They are the government's own fields and do not overlap
(§7.7 clean), so they stand.

---

## Progress

**Groups 1–5 complete: 32 forms, 124 of 421 pages read.** Groups 6–31 (~113 forms,
~297 pages) still to read.

---

## Class A and class B fixed

### Class B — `type` normalised against the box the government drew (`normalise_types_bc2.py`)

**640 types corrected across 103 of the 145 forms**, then stable. Three rules, the first
two reading the box's own height and the third §8's own wording:

1. **One line tall -> `TextField`.** 439 `TextArea` fields were ≤ 20 pt, clustering at
   11-18 pt. A box that size cannot hold a second line.
2. **Two or more lines tall -> `TextArea`.** 179 `TextField` fields were ≥ 27 pt, nearly
   all table cells `place_missing_bc2.py` added from cell geometry — the government drew
   the cell tall because it expects wrapped text (§9.5 says this outright).
3. **A column's minority type loses**, for a run of ≥3 fields sharing a page, left edge
   and width. This is what reached F1 p4's children table, whose first data row was
   `TextArea / TextField / TextArea` against `TextField x3` below it, all 26 pt.

Two things had to be got right, both §7 rules:

* **Clustering, not rounding** (§7.9's cousin). Bucketing the column key by
  `round(width/4)` split F1 p4's table in two, because its first row is 178.6 pt wide and
  the rows below are 177.2 pt — 1.4 pt across a bucket boundary — leaving the row-1 cell
  alone in a group of one where no majority could reach it.
* **Height is authoritative over the column majority.** Letting rule 3 overrule rules 1
  and 2 made the tool **oscillate**: the first run flipped 40 fields to `TextArea` and a
  second run flipped them straight back. Rule 3 is now confined to the ambiguous
  20-27 pt band. Runs 2 and 3 report zero changes, and the residual count for all three
  rules is zero.

Final types across the batch: 2,584 `TextField`, 1,335 `CheckBox`, 779 `TextArea`.

### Class A — F1's duplicated blocks removed (`repair_f1_duplicates.py`)

Both copies confirmed and the right one kept on evidence rather than by eye:

* **p2** — the bare language block at y 314-372 removed with its three checkbox fields,
  leaving the panelled copy at y 244.5-308.5. The render now shows **three** language
  checkboxes for one choice, not six.
* **p4** — the second header row removed. Which copy to keep was settled by column
  centres: the kept set reads 180.0 / 315.0 / 441.0 against the data rows' 180.7 / 315.7
  / 441.7, while the removed set sat a uniform 18 pt right of them.

Two techniques worth recording:

* **Line art is painted out, not redacted.** `PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED`
  drops every drawing whose rectangle meets the band, and both pages sit inside a
  full-content frame (p2's is x 72.5-575.5, y 54.5-373.5) that meets any band inside it —
  so touch-based removal would have taken the form's own border with it.
* **Clear past a shared edge, then draw it back.** The duplicate header's bottom edge and
  the data row's top edge are both at y 284.5, and the duplicate's is the wider
  (x 108.5-539.5 against 90.5-521.5). Stopping short of it left 0.7 pt stubs of six cell
  verticals showing as tick marks, so the whole edge is now cleared and the data row's own
  border redrawn — `repair_notice_pages.py`'s technique.

### Class A is *not* safely automatable beyond these

A within-page duplicate-block sweep reports **62 blocks across 33 forms**, and sampling
shows most are correct: F1 p6's "Fax (optional) / E-mail (optional)" is the Claimant 1
and Claimant 2 blocks, F19.4 p2's "Step / Date by which step to be completed" is two
different tables, F25 p2's "[name of person to be examined] / [address]" is two persons.
Repetition alone cannot tell those from a flatten fault — F1's two were identifiable only
by *what the copies meant*: one question offered twice, and one table given two
misaligned headers. So the 62 stay a **worklist to check while reading each page**, not
something to act on in bulk.

## Pipeline order

The passes are order-dependent and must run:

```
build_bc_batch2.py            # regenerates PDFs and JSONs, dropping repairs and binds
repair_f19_4_header.py        # per-form background repairs
repair_duplicate_blocks.py --apply
drop_hidden_branches.py --apply   # removes text the government's scripts hide
place_missing_bc2.py --apply  # adds fields (and retracts the two it should not have added)
add_writing_areas_bc2.py --apply
drop_signature_boxes.py --apply   # §5 — also touches batch 1, which has no rebuild
trim_label_overlap.py --apply # adjusts geometry (asserts the field set is unchanged)
normalise_types_bc2.py --apply
build_bc_batch2.py --rows-only
merge_catalog2.py --promote
rebind_bc_forms.py
```

`place_missing_bc2.py` no longer cares whether it runs before or after
`repair_duplicate_blocks.py` (it skips the painted bands either way), and it asks
`verify_bc2.on_signature_rule` rather than `bp.is_signature_box`, so the chain can no longer
undo §5 — see "Two pipeline traps" below.

---

## Groups 6-9 (part) — Protection Orders, Agreements, and the F54 family

| Form | Pages | Verdict |
|---|---|---|
| SUP914 Request for protection order registry search | 2 | **OK** |
| Form 26 Request to file an agreement | 3 | **OK** |
| Form 12 Application about a protection order | 15 | **OK** |
| F54.1 Order terminating a protection order | 1 | **FIXED** — duplicated sentence |
| F54.2 Restraining order | 1 | **FIXED** — both blanks had no field |

* **SUP914** — an English/French mirror pair, both complete. The sideways printed title
  down the right edge is a **printed backer**, not a rotated writing line, so it correctly
  gets no `VerticalTextField` (§9.9 applies only where something must be written on a
  rotated rule).
* **Form 26** — cover and instruction pages carry 0 fields, correctly; p3's parties,
  agreement date, six statutory-provision checkboxes and address block are all seated.
* **Form 12** — 15 pages, all clean. Its affidavit line, three separate person tables,
  the whole firearms/weapons Yes-No ladder with its explain areas, and both children
  tables are right, headings left clear throughout.

### F54.2 — neither blank in the operative sentence had a field

The sentence reads "THIS COURT ORDERS … that **___** is restrained from molesting …
or attempting to molest, annoy, harass or communicate with **___**", and *both* blanks
were missing. A restraining order could name neither the restrained party nor the
protected one.

Both escape the narrowed instruction sweep: the first gap is 31 pt, under its 70 pt
floor, and the second line ends in "with", which is not a phrase that reads as an
unanswered direction. Only reading the page found them.

### F54.1 — a fourth shape of class A, invisible to line-run comparison

The page prints "THIS COURT ORDERS, under section 187 of the *Family Law Act*, that the
order dated … made by … is terminated on ." **twice**:

* y 488-539, **laid out** across several lines with its three fields and the connecting
  words "made by" and "is terminated on" on their own lines;
* y 566.9, **collapsed onto one line** with the blanks squeezed out and no fields at all.

Because the copies are formatted differently there is no run of matching lines between
them, so the within-page duplicate sweep cannot see it — only the normalised text of the
whole sentence matches. The collapsed copy is removed.

### An interaction between two of the repairs

Painting a duplicate white leaves its cell **rectangles** in the content stream — only
the text is redacted — so `place_missing_bc2.grid_cells` still saw F1 p4's removed header
cells as empty ruled cells and boxed them. Two things fix it, and both are in place:
`repair_duplicate_blocks` now drops any field lying wholly inside a painted band, and it
runs **after** placement in the chain, so the duplicate's text is still present when the
cells are examined and they are skipped as "has printed content" in the first place. The
field count fell from 247 to 244, which is exactly the three header cells no longer being
invented.

---

## Groups 6-15 (part) — 7 more forms read

| Form | Pages | Verdict |
|---|---|---|
| PFA876 Order for attendance of a prisoner | 1 | **OK** |
| Form 27 Request to file a determination of parenting coordinator | 3 | **OK** |
| Form 28 Request to file an order | 4 | **OK** |
| S-51 Consent for child protection record check | 3 | **OK** |
| Form 5 Guardianship affidavit | 7 | **OK** |
| F24 Notice to admit | 2 | **OK** |
| F19.3 Case plan proposal | 3 -> 2 | **FIXED** — data-entry page dropped |

### F19.3 — page 1 was an Adobe data-entry page

Shipped as three pages, and p1 was never part of the filed document: dashed data-entry
borders around its party blocks, and its content (name of party / name of counsel /
address for delivery / telephone) is collected again by p2's "Party submitting this case
plan proposal". `KEEP_PAGES` now keeps p2-p3.

**The footer stamp is the test that settles it.** Every filed page of these forms carries
the government's "Last updated … / Page of" line; F19.3 p1 does not. Sweeping the batch
for a page missing that stamp on a form that stamps the rest gives **ten** pages, and the
split is clean: nine carry **zero fields** and are the Provincial "important information
about your appearance" inserts, which legitimately have neither footer nor fields. The
tenth is F19.3 p1, with 15 fields on it. That is worth keeping as a check.

### Two boxes that look like signature boxes and are not

Twice a contact sheet appeared to show an overlay box sitting on a signature rule —
PFA876's commissioner and applicant lines, and Form 5 p7's "Signature" — and both times
the geometry showed **no field there at all**: what the sheet renders is the form's own
printed rectangle. At sheet scale a thin printed rule and an orange overlay border are
easy to confuse. **Check §5 findings against the field list, not the render.**

### The real §5 candidates: BCPC_33 and BCPC_34

A sweep for a field sitting directly above a signature or role caption gives six hits
across the batch, and reading each settles five of them:

* **S-51 p3, BCPC_48 p1, BCPC_49 p1** — *fine*. Their "Signature" line carries no box; the
  boxes sit above the commissioner-identification and print-name captions, which is
  §9.8's own pattern.
* **F19.4 p1** — the "Registrar" box, already recorded as matching batch 1's shipped
  F51/F52/F33.
* **BCPC_33 p1 and BCPC_34 p1** — **a box directly on the printed rule above "Judge or
  Justice of the Peace in and for the Province of British Columbia"**, with the date box
  beside it on its own rule. §5 says a signature line gets no box; batch 1's Registrar
  precedent says otherwise. Both are court-completed either way, so nothing a lawyer
  fills is affected. **Flagged for a decision rather than changed.**

### F101 — two table headers printed twice

Item 7's header on p4 (copies at y 138.5-176.5 and 177.5-215.5, data from 216.5) and item
8's on p5 (copies at y 171.5-242.5 and 243.5-314.5, data from 315.5). Both are full ruled
rows, and unlike F1 p4 the two copies are **exactly aligned** — same columns, stacked in
y — so the column-centre test that settled F1 does not apply here.

What settles it instead is **which copy leaves the header abutting its data**: keeping the
upper one would leave a 40 pt band between header and first row that reads as an empty
row, so the upper copy goes.

The first attempt left an **orphaned "Item" cell** floating above p5's real header: the
header's leftmost column sits at x 126.5-161.5 and the band started at x 155, so that one
cell survived the paint. Widened to x 120.

*Residual, cosmetic*: p4's first data row is 46 pt against 42 pt on rows 2-5, and starts
1-2 pt off their column edges — its cells come from the government's XFA while the rows
below come from cell placement. Every box still sits inside its own cell.

---

## Coverage

| | forms | pages |
|---|---|---|
| Read and settled | 46 | ~220 |
| Not yet read | 99 | ~200 |
| **Total** | **145** | **420** |

Groups 1-5 complete, 6-9 complete but for PFA914, 14 complete. Groups 10-13 partly read.
Groups 16-31 untouched.

### Case Management (group 13) — four of five forms read, all clean

* **Form 11** *Application for case management order without notice or attendance* (13 pp)
  — clean throughout. Cover and three instruction pages carry no fields; Schedules 1-5 are
  complete, including Schedule 2's alternative-service block on p9 where every method
  (posting, relative, registered/regular mail, email, text, instant message, last known
  address, other) has its own boxes with the captions below them.
* **Form 10** *Application for case management order* (8 pp) — clean. p5's twenty-option
  case-management checkbox list is all on its marks; p7 is the appearance-information
  insert with no fields, correctly.
* **Form 39** *Request for scheduling* (6 pp) — clean, including p6's interim-order
  options where each option's text sits on its own printed rule and the checkboxes stay
  on their marks.
* **PFA920** *Consent adjournment* (1 pp) — clean. The "Registry"/"JCM" pair are the two
  `checkbox-no-mark` advisories: the form prints no `❑` glyph there, only the label, so the
  control sits at the government's own widget position. Correct as placed.

Still outstanding in 10-15: PFA914, F84, F86, F97, Form 23, F22, F23, F26, F28, F47, F49,
PFA893, F44, F48, F100 — 15 forms, roughly 30 pages.

---

## §5 applied to signature rules, in both batches

The user has confirmed that **the Registrar line is a signature line**. §5 is unconditional
about those, so every box on one comes off — including batch 1's, which had been left alone
until now and which batch 2 had been made *consistent* with, propagating the same fault.

**10 boxes removed across 10 forms** (`drop_signature_boxes.py`):

| Batch | Form | Page | Rule |
|---|---|---|---|
| 1 | F1.2 | 1 | Registrar |
| 1 | F51 | 3 | Registrar |
| 1 | F51.1 | 2 | Registrar |
| 1 | F52 | 3 | Registrar |
| 2 | F19.4 | 1 | Registrar |
| 2 | Form 33 | 1 | Judge or Justice of the Peace |
| 2 | Form 34 | 1 | Judge or Justice of the Peace |
| 2 | Form 48 | 1 | A commissioner for taking affidavits |
| 2 | Form 49 | 1 | A commissioner for taking affidavits |
| 2 | S-51 | 3 | A commissioner for taking affidavits |

Targets are matched on **page plus geometry**, not field id, so a rebuild that renumbers
fields cannot miss one or hit the wrong box — and each entry must match exactly one field
or the tool stops. That assertion earned its keep immediately: Form 34 puts the jurat's
**Date box on the same baseline** as the judge's rule, so matching on y alone found two
fields and the tool refused rather than guessing. x is now part of every target.

Three candidates the sweep raised and reading rejected:

* **PFA893 p1** — the flagged box is the full-width "Further court directions" writing
  area; the "Signature" caption 18 pt below it belongs to the rule beneath, which has no box.
* **F38 p5** — the box after the printed "on" is the jurat's date.
* **F33** — has no box on its Registrar rule at all; the three fields there are the
  BEFORE A JUDGE / ASSOCIATE JUDGE / REGISTRAR checkboxes. An earlier looser probe had
  wrongly reported this one.

Kept in every case: the **print-name box** above a "[type or print name]" or "(print name
or affix stamp of commissioner)" caption. That caption labels the box above it, and §9.8
wants that box — it is the signature rule's box that must go, not this one. F51 p3 now
reads correctly: Registrar rule bare, both party signature rules bare, print-name and
party-name boxes intact.

---

# Second pass — the remaining 105 forms

Tracked in `BC_BATCH2_REVIEW_STATE.json` beside this log, one row per form with its group
and status,
so the reading survives a break. Renders are one page per PNG rather than 6-up sheets;
the sheets are for triage and a page has to be read at full size to be judged.

## A batch-wide class the *template* found, not the page

`drop_hidden_branches.py`. pdf.js draws the static layout and never runs the
`layout:ready` scripts Acrobat runs, so any subform the government **hides by default** is
printed anyway. Sweeping all 145 sources for `presence = "hidden"` inside a
ready/initialize script and then checking whether the guarded text reached our page gives
59 hits, and the three-way split matters:

* **26 conditional** — hidden unless some control is set. Eight are real and removed
  (below); the rest are pages the blank form is *meant* to carry (F37's fact sheets A–F,
  F1/F102's `_____ Registry` rule, F17.1's list of orders).
* **33 unconditional** — hidden at `ready` and shown again by the template's own
  `print_scripts.print_blank_copy_get()` branch. These are the
  `[if more space is required - attach page…]` notes; a blank form is where they belong,
  and the approved batch shows them throughout.
* the page-variant subforms (`blank_printed_page`, `data_entry_page`, …), which
  `blank_pages.mjs` already owns.

**Removed: 8 blocks across 8 forms.**

| Form | Page | Block | Guard |
|---|---|---|---|
| F15 | 3 | video-conference paragraphs 3, 4 | `CheckBox1.rawValue == "0"` |
| F16 | 2 | same, unnumbered | same |
| F70 | 2 | same, paragraphs 3, 4 | same |
| F84 | 2 | same, paragraphs 4, 5 | `VideoConfAffidavitChkbox` |
| F86 | 2 | same, paragraphs 11, 12 | `CheckBox1.rawValue == "0"` |
| F97 | 2 | same, unnumbered | same |
| F32.001 | 1 | the three ticked-option echoes | `paperCopy.CheckBoxN.rawValue == 1` |
| F29 | 2 | the second signature block (+4 fields) | `addSignature.ShowYN == "1"` |

The affidavit six are the ones that mattered. Each printed, unconditionally, "**I was not
physically present** before the person before whom this affidavit was sworn or affirmed" —
false for an affidavit sworn in person, on six forms, with nothing the deponent could
strike. F84 settles that the removal is what the government wants rather than a guess: it
guards the bracketed *instruction* with `print_blank_copy_get()=="Y" && CheckBox1 == "0"`,
so on the blank printed copy the instruction shows and the paragraphs do not. The
instruction is kept on all six — it is what tells the filer to insert the paragraphs when
they do apply, and F15, F16, F70 and F97 each carry a free `paragraph_txt` line for it.

## Group 2 — Supreme Court – Notices (6 forms, 10 pages)

| Form | Pages | Verdict |
|---|---|---|
| F2 Notice of withdrawal from joint family law case | 1 | **OK** |
| F7 Notice of withdrawal (divorce claimed) | 2 | **OK** |
| F39 Notice of discontinuance | 2 | **OK** |
| F40 Notice of withdrawal | 2 | **FIX** ×1 |
| F76 Notice of order | 2 | **OK** |
| F77 Notice of interest | 1 | **OK** |

* **F2** — heading, both claimants, the party box, date, and the two signature checkboxes
  with the print-name box on its rule. No box on a signature rule.
* **F7** — p1's eight sub-options are all on their marks. The two top-level marks are
  printed **circles**, not squares — the XFA makes them radio buttons — and the box is
  correctly around the circle; at sheet scale that reads as a misplaced box and is not one.
  p2's describe-the-part area, date and print-name box are right.
* **F40 — FIX.** p1's second option ends "…in respect of the following claim(s) in this
  family law case:" followed by the printed list marker **"(a)"** and 176 pt of bare paper
  with **no field**: the withdrawal could not say which claims it covered. F39, the
  discontinuance twin, proves the shape — it gives the same list a 25.5 pt area on p1 *and*
  a 105 pt continuation on p2, where F40 had only the p2 half. Area added right of the
  marker, not over it (§9.7).
* **F76, F77** — complete, addresses for service included.

### A detector for the "(a)" class, and what it found

A printed list marker in the left half of the page, nothing printed to its right, no field
on its line and >25 pt of blank below it: **25 hits, one real**. The other 24 are
Provincial **cover-page form numbers** (the big "1", "26", "30" a cover prints) and the
last word of a printed "🠆 Complete Schedule 6" instruction. F40 p1 is the only genuine one
in the batch, so the class is closed rather than left as a worklist.

## Group 4 — Supreme Court – Service (7 forms, 15 pages)

| Form | Pages | Verdict |
|---|---|---|
| F11 Notice for publication | 2 | **OK** — source typo noted |
| F13 Notice and summary of document | 3 | **OK** |
| F14 Certificate | 2 | **OK** |
| F15 Affidavit of personal service | 3 | **FIXED** — hidden branch |
| F16 Affidavit of ordinary service | 2 | **FIXED** — hidden branch |
| F18 Certificate of service by sheriff | 1 | **OK** |
| SUP916 Request for service of family protection order | 2 | **OK** |

* **F11** — *source quirk, not ours*: p2 prints "and the order for service by advertisement
  from the **and the order for service by advertisement from the**". The doubling is inside
  a single government draw's rich text, so it is their typo, not a flatten fault, and is
  left as published — the same treatment Form 8 p13's mislabelled footer got.
* **F14** — p1's item 2 ("That the document has not been served, by reason of the following
  facts:") is the last line on the page and its writing area is the first thing on p2. That
  is a page break, not F40's fault: only 25 pt of paper is left below the caption, where
  F40 had 176.
* **F15** — p1's two unlabelled full-width bars are the government's own `paragraph1_txt`
  and `paragraph2_txt`. p2's third option puts its two sub-checkboxes hard against the
  following word, which reads like a box over text and is not: the printed ❑ is drawn at
  exactly x 72.2-81.8 / 313.2-322.8 and the box sits on it.
* **F15, F16** — *cosmetic, source layout*: the heading's printed rule runs x 503→**648**
  on a 612 pt page, so it reaches the paper's edge. The fields stop at 608, inside the
  page and correctly seated after their captions, so nothing is unusable.
* **SUP916** — an English/French mirror pair, every writing cell of the party-details grid
  boxed. **JUDGEMENT**: the "FOR REGISTRY USE ONLY" panel's ~14 checkboxes, its process-
  server rule and its Address rectangle get no boxes, because the government gave widgets
  to exactly one field in that panel ("Other"). The panel says in print who completes it,
  which is the difference between this and F37 p9, where "the government left the page
  field-less" was rejected as a reason.

## Group 5 — Supreme Court – Requisitions (10 forms, 18 pages)

| Form | Pages | Verdict |
|---|---|---|
| F12 Request | 2 | **OK** |
| F17.1 Requisition – filing of agreement | 1 | **OK** |
| F17.2 Requisition – parenting coordinator determination | 1 | **OK** |
| F17.3 Requisition – arbitration award | 1 | **OK** |
| F18.1 Requisition – general (application) | 2 | **OK** |
| F19.1 Requisition – method of attendance | 3 | **OK** |
| F29 Requisition for consent order or order without notice | 2 | **FIXED** ×1 + **JUDGEMENT** |
| F32.001 Requisition – chambers practice | 2 | **FIXED** ×1 |
| F32.01 Requisition – short notice | 2 | **OK** |
| F94.1 Requisition – leave (vexatious litigant) | 2 | **OK** |

* **F17.1, F17.2** — the heading's role slot is a *box* here, not the printed "Claimant:"
  the other Supreme forms show, because these templates give the dropdown no default value.
  Each form follows its own source; both readings are right for the form they are on.
* **F19.1** — 64 fields over three pages, all seated: every conference date and location
  pair, all four communication-medium ladders, the role checkboxes with their
  "[please specify]" box, and the endorsement panel.
* **F29 — JUDGEMENT.** p1's item 3 prints its two ❑ marks at y 621.5 and 639.5 and their
  two statements at y 654 and 672 — the marks stacked *above* the labels instead of beside
  them, because pdf.js wrapped the `lr-tb` subform's text column below its checkbox column.
  The order is preserved, so which mark belongs to which statement is still legible, and
  the boxes sit on the government's own printed ❑. Moving them beside the labels would
  unseat them from those marks and leave two stray printed ❑ behind, which is worse.
* **F18.1 p2, F32.01 p2, F94.1 p2** — the court-completed panels *are* boxed here, unlike
  SUP916's, because the government gave them widgets. The rule is the same in both places:
  the source's widget set decides.
* **F94.1 p2** — "Signature of person requesting leave" carries no box; the box below it is
  the print-name box under its own caption (§9.8).

## Group 8 — Supreme Court – Discovery (6 forms, 12 pages) — all **OK**

F22 Interrogatories, F23 Subpoena to witness, F26 Instructions to examiner, F28 Letter of
request, F47 Notice to produce, F49 Notice of intention to call adverse party. Nothing to
change on any page: every signature rule bare with its print-name box below (§9.8), every
writing area filling its blank, and F49 p2 and F23 p2's quoted rule text correctly carrying
no fields.

## Group 9 — Supreme Court – Filing (5 forms, 7 pages)

| Form | Pages | Verdict |
|---|---|---|
| F32.1 Order signing instructions | 1 | **OK** |
| F32.2 Cover page | 1 | **OK** |
| F86.1 Language change and confirmation | 2 | **OK** |
| F86.2 Notice of extension – official languages | 1 | **OK** |
| F95 Fax cover sheet | 2 | **FIX** ×1 (§5) |

* **F95 p2 — a box on a signature rule, and the gate could not see it.** The payment block's
  rule at y 530 is captioned "**authorizing signature (Credit Card)**", and a 223×31 pt
  `TextArea` sat on it. §5 governs a credit-card authorisation as much as a jurat, so the box
  is gone (`drop_signature_boxes.py`, now 11 forms); the "print name as it appears on credit
  card" box above it stays.
  Why the gate missed it: `ROLE_CAPTION` only matched "signature" at the **start** of a
  caption. It now matches anywhere, with `date` added to the disqualifying words so
  BCPC_7 p1's "Date of signature (dd/mmm/yyyy)" is not swept up, and the vertical tolerance
  starts at −3 pt because a box seated on its rule lands a fraction *inside* the caption's
  line box — F95's was at −0.2. Re-sweeping the batch with the widened test gives **two**
  hits: this one and PFA893 p1, already read and kept.
* **F32.2** — 23 fields, all seated, including the two dashed-bordered party panels (the
  dashes are the government's own printed rectangles).

## Group 10 — Supreme Court – Divorce (3 forms, 6 pages) — all **OK**

F35 Requisition – undefended family law case, F36 Certificate of pleadings, F102 Statement of
information for corollary relief. F102's three Yes/No ladders and their detail areas are
complete over all three pages; its `_______ Registry` conditional prints as a boxed field,
not as the underscore variant.

## Group 11 — Supreme Court – Enforcement (22 forms, 40 pages) — all **OK**

F41, F42, F50, F57, F58, F59, F60, F61, F62, F62.1, F62.2, F63, F64, F65, F66, F67, F68, F69,
F70, F92, F93, F94. The largest group in the batch and the cleanest: every amount box starts
after its printed `$` (§7.5), every "Registrar", "By the Court.", "Examiner", "Surety",
"Person conducting sale" and "Signature of person being released" line carries **no** box,
and each judge's print-name box sits under its own caption. F70's video-conference paragraphs
are the hidden branch removed above.

Two things read and left as published:

* **F60 p1 and F61 p1** print "ordered that the **,** [box], deliver to the **,** [box]" —
  the role word is composed by the template at fill time and comes out empty, leaving a
  stray comma. F59, the same writ with checkboxes instead of a composed sentence, shows what
  the government intended. There is no rule and no blank to place a box on, and inventing a
  role field on a registrar-issued writ is not a placement decision.
* **F41 p2**'s "Endorsement To Guarantee No." has no field after "No.". The template's field
  list (`From`, `To`, `Date`, `Paragraph`) confirms the government gives none, and there is
  no rule or underscore there either.

## Group 12 — Supreme Court – Trial (3 forms, 4 pages) — all **OK**

F44 Notice of trial, F48 Notice of intention to proceed, F100 Certificate of mediation. F44's
trial table and contact table box their data rows and leave the column headings clear;
F100's "Signature of mediator" rule is bare, with the mediator's three detail boxes below the
caption.

## Group 14 — Supreme Court – Costs (5 forms, 8 pages)

| Form | Pages | Verdict |
|---|---|---|
| F71 Bill of costs | 3 | **FIX** ×1 — my own regression |
| F71.1 List of expenses | 1 | **OK** |
| F72 Certificate of costs or expenses | 2 | **OK** |
| F99 Demand | 1 | **OK** |
| F99.1 Offer to settle costs or expenses | 1 | **OK** |

* **F71 p1 — two boxes in the table's title bar**, at x 73.5 and x 411.5 on the
  "PART B - TARIFF ITEMS" row. Not the government's: that row is three grey `<draw>` cells —
  the titled one and an empty one either side — and `place_missing_bc2.cell_targets` read the
  empty pair as cells wanting fields. §9.2. Both retracted, and the guard that stops it
  recurring is in the same file (`whole_row_shaded`).
* **F71 p2** is a good check that the type rules held: every day-count box is a `TextField`
  and every amount box a `TextField`, while items 8 and 9's printed fixed "250" correctly get
  no box at all.
* **F72 p2** carries **two** consent signature blocks, and that is the form's own instruction
  ("a signature line in the following form must be completed and signed by or for each
  consenting party"), not F29's script-added duplicate.

### Why the shaded-cell guard had to be narrow

"A field inside a grey box" cannot be the test: the Provincial forms shade the writing cell
of nearly every labelled row, and **hundreds** of the government's own widgets sit inside
one. What separates a header row is that the shading runs the whole width of the row, label
included, where a labelled writing row shades only the part being written in.

## Group 15 — Supreme Court – Appeals (11 forms, 21 pages)

F79, F80, F81, F82, F82.1, F82.2, F82.3, F82.4, F98, F98.1, F98.2 — every page **OK** on
placement, with one type fault found by reading and fixed batch-wide (below). F82.1 p2's
two approving-party signature blocks are the form's own instruction; every "By the Court.",
"Registrar" and "Signature of" rule is bare with its print-name box beneath.

*Checked and not a defect*: on F98.1 and F98.2 the party box's left edge appears to touch
the printed "Appellant" / "Respondent". It abuts it — the label ends at x 116.0 and the box
starts at x 116.0 — which is why the ink test never flagged it.

## Group 16 — Supreme Court – Evidence (3 forms, 9 pages)

F84 Affidavit of attainment of majority, F86 Affidavit in support to waive fees, F97
Declaration. All three carried the video-conference hidden branch, now removed; everything
else on the nine pages is right, including F86's three financial tables (each amount box
after its printed `$`) and its three exhibit stamps, and F97 p2's registry authorisation
panel.

## Group 17 — Supreme Court – Representation (2 forms, 2 pages) — both **OK**

F87 Notice of appointment or change of lawyer, F88 Notice of intention to act in person.

### The type rule the log claimed and the code never had

This log has said since the class-B pass that "**a box two or more lines tall becomes a
`TextArea`** — 179 fields". That was wrong: the rule was tried, found to be wrong on
one-line fields whose *caption* wraps, and removed, and the 179 conversions were actually
`place_missing_bc2` typing the cells it creates. Nothing has ever converted a
**government-drawn** tall `TextField`, and reading the appeal forms found what that left:

* **F82.2, F82.3, F98.1 and F98.2** each end with a **152.7 pt** `TextField` — the last
  Part's writing area — directly below sibling Parts of 72.8 and 62.0 pt that are
  `TextArea`. One Part of every statement of argument was a single-line box.
* **F37** has fourteen more of the same shape, its full-width 62-69 pt narrative rows,
  including the three on p3 either side of the item-8 rule.

The rule is now implemented with the test the first attempt lacked — **width**. A one-line
field whose caption wraps is narrow (F71's day-counts 58.9 pt, BCPC_12 p10's date 146 pt,
PD-58's date column 82.8 pt); a writing block runs most of the text measure. So a
`TextField` ≥27 pt tall **and** ≥250 pt wide converts, as does anything over 100 pt tall at
any width, as does a tall one whose column is mostly `TextArea` (F101 p2 and p4's odd cell
out). **27 fields across 10 forms**, then stable, and every narrow value cell left alone.

### F37 p3 — item 8 had a rule and no field

"Medical coverage is" is followed by 41 pt of paper and a **drawn** rule at y 255 with
nothing on it, while items 7, 9, 10 and the three unnumbered rows around it each have a
69.2 pt writing area. `check_unfilled_blanks` cannot see it (line art, not underscores);
it was sitting in the `rule-no-field` advisories. Area added across the band, bottom seated
above the rule.

*Also settled on that page*: its three `blank-no-field` advisories are the printed `___`
paragraph-number slots at the left margin, which §8 says get no box. No action.

### Two pipeline traps the same dry run exposed

Neither had reached a shipped template, and both would have on the next rebuild:

1. **Placement would have put boxes straight back on four signature rules** —
   BCPC_33, BCPC_34, BCPC_48 and BCPC_49, the ones §5 had just cleared. `place_missing_bc2`
   was asking `bp.is_signature_box`, which only knows a caption starting with "Signature",
   so "Judge or Justice of the Peace" and "A commissioner for taking affidavits" read as
   ordinary blanks. It now asks `verify_bc2.on_signature_rule`, so the placement pass and the
   gate agree on what a signature is.
2. **Placement re-added ten painted-out cells** — F1 p4's and F101 p4/p5's duplicate header
   rows. Painting a duplicate leaves its cell rectangles, so on an already-repaired PDF those
   cells look empty. The chain's order (repair *after* placement) hid this; `cell_targets`
   now skips `repair_duplicate_blocks.PAINT`'s bands outright, so the order no longer matters
   and the pass is safe to re-run.

## The Provincial groups (22 forms, 53 pages) — all **OK**

| Group | Forms | Pages |
|---|---|---|
| 18 Notices | Form 1, Form 2, Form 20, Form 46, Form 50 | 17 |
| 19 Evidence | Form 23 | 1 |
| 21 Service | Form 7, Form 47, PFA110, PFA916 | 4 |
| 23 Case Management | PFA893 | 1 |
| 24 Protection Orders | PFA914 | 1 |
| 26 Enforcement | Form 29, Form 30, Form 31, Form 35 | 20 |
| 27 Representation | Form 40, Form 41, PFA923 | 3 |
| 28 Filing | Form 52 | 1 |
| 29 Trial | PFA709 | 4 |
| 31 Requisitions | PFA907 | 1 |

Nothing to change on any of the 53 pages, which brings the Provincial AcroForm path to
**37 of 37 forms read with one defect between them** (BCPC_6 p3, and that one was mine).
Every writing cell is boxed, every column heading left clear, every checkbox on its printed
mark, and every signature rule bare with the date box beside it — Form 7's shaded signature
area, Form 20 p2's "Signature of Local Manager or Designate", Form 23's "Signature of person
issuing subpoena", Form 50 p2's two consent blocks, PFA709 p4 and PFA907 all read that way.

* **The 20 zero-field pages** were read as a set and are all guidance: cover pages, the
  "complete this form online" page, "Need legal help?", the "Preparing a … Form N"
  instruction sheet, the "IMPORTANT INFORMATION ABOUT YOUR APPEARANCE" insert, and PFA709's
  tips page. Their 0 fields are correct.
* **PFA893 p1 — the §5 candidate, resolved.** What looks like a box on the "Signature" rule
  of the FOR COURT USE ONLY panel is the panel's own printed rectangle. The field list has
  the 36.6 pt "Further court directions" area ending at y 663.6 and the Date box at
  y 670.6-684.3, and nothing between the rule and the caption at y 682. Recorded again
  because this is the third time a printed rule has read as an overlay box: **check §5
  findings against the field list, not the render.**
* **PFA916** is PFA110's and SUP916's sibling and gets the same JUDGEMENT: the government
  gives its "FOR REGISTRY USE ONLY" panel one widget ("Other"), so the panel's checkboxes and
  its Address rectangle stay unboxed. PFA110's sheriff-use panel *is* boxed — because there
  the government gave widgets. The source's widget set decides, form by form.
* **PFA923** carries 31 fields against the source's 31 widgets, so its part-width
  date-of-birth cells are the government's own geometry, not a placement fault.

---

## Coverage — complete

| | forms | pages |
|---|---|---|
| Read and settled | **145** | **419** |
| Not yet read | 0 | 0 |

`BC_BATCH2_REVIEW_STATE.json` holds the per-form record: docId, form number, group, court,
category, page and field counts, and status. It sits beside this log rather than in
`_incoming_bc2/`, which is build staging and gitignored — the review record is documentation
and belongs in the repo.

## What the second pass changed

| Fix | Forms |
|---|---|
| Script-hidden branches removed (§9 class A, 5th shape) | F15, F16, F29, F32.001, F70, F84, F86, F97 |
| Missing writing area added | F40 p1, F37 p3 |
| Box removed from a signature rule (§5) | F95 p2 |
| Heading-row strays retracted (my regression) | F71 p1 ×2 |
| `TextField` -> `TextArea` where the box is a writing block (§8) | 27 fields on F15, F16, F19.4, F37, F82.2, F82.3, F85, F98.1, F98.2, F101 |

Gate state: **0 blocking**, 277 advisory, every advisory class read and accounted for:

* `rule-no-field` 107 — **table borders and signature rules.** S-51 p2 alone accounts for 32:
  its repeating child table draws a 110 pt and a 250 pt rule per row, and every writing cell
  in it is boxed. Same for BCPC_12's schedules, SUP916/PFA916's grids and F1's heading rules.
* `edge-cuts-caption` 84 — all on SUP916 (52), PFA916 (29), S-51 (2) and PFA876 (1), where
  the government's own widgets sit tight under the captions of a dense grid.
* `page-no-fields` 66 — cover, instruction, quoted-rule and appearance-insert pages, each one
  read.
* `sliver` 7, `heading-stray` 4, `checkbox-no-mark` 2, `box-on-text` 1,
  `answer-space-no-field` 1, `blank-no-field` 5 — narrow value cells, box heights against a
  column mode, PFA920's missing printed glyph, and F37's paragraph-number slots. All recorded
  above or in the first pass.

---

# Batch 1, swept with the same test

A question about F32's third party row sent the hidden-branch sweep over **batch 1's 43
sources**, which it had never been run against — it was written for batch 2. It found the
same class, including on the most-filed form in the set.

**Removed (3 forms).** The identical video-conference guard, so each printed "I was not
physically present before the person before whom this affidavit was sworn or affirmed" on
a blank form:

| Form | Page | Guard |
|---|---|---|
| **F8 Financial statement** | 2 | `…AffidavitByVideo.CheckBox1.rawValue == "0"` |
| F30 Affidavit – desk order divorce | 2 | `VideoConfAffidavitChkbox.rawValue == "0"` |
| F38 Child support affidavit | 7 | `xfa.record.affidavit_sworn_or_affirmed_by_video_conference.value == "0"` |

F38 is the one where the bracketed instruction never reached the flattened page, so both
phrases go entirely rather than halving, and the two 14.4 pt paragraph-number slots beside
them go too. Its guard reads the record rather than a checkbox, and that field's default in
the source's own `datasets` is `"0"` — checked, not assumed.

**Read and kept**, because a blank printed copy is where they belong:

* **F31 p1** — "This matter is within the jurisdiction of an associate judge." and "This
  matter is not…". The script hides one, but both print **with a checkbox each**, which is
  how a paper form offers a choice. Not a contradiction on the page.
* **F5 p9 and p10** — sections 3 and 4 (current and proposed parenting arrangements),
  guarded by the section-2 checkbox printed directly above them. Same shape as F37's fact
  sheets: a conditional *section* of the published form.
* **F33 p1, F34 p1** — the italic "[For each order, if any, made for parenting time…]"
  instruction above the order area. Guidance.
* **F3, F4, F5 p1's `_____ Registry` rule** and **F21 p1's slash-list party label** — the
  same two cases kept in batch 2.

**Recorded, not changed — F17 p1.** "This requisition is supported by the following:" is
followed by its instruction, then "(Click if you require the … paragraphs)", and there is
**no writing area**. The hint is real guidance on the government's form — a button inserts
`_subRepeating` rows — but our static page has no button, and the gap between the last
printed hint (y 635) and "Date:" (y 650) is **15 pt**, too little for a usable box. The
form's own "[if more space is required - attach page and state "See Attached"]" is the
filer's route. Cramming a 15 pt box under a line that says "click" would be worse than the
gap; flagged here instead.

### And the question that started it — F32's party rows

The two boxes beside "Claimant:" and "Respondent:" and the **unlabelled pair below them**
are all the government's. F32's template holds `sop_sf` **twice** plus one `sop_add_sf`,
where F39 and F41 hold one of each — and on those two forms the `sop_add_sf` instance is
the visible "Respondent:" row, which is what proves the additional-party row renders on a
blank form. F32's third row simply has no default role label, because its role only gets
one when the green "Add Additional Parties" button is clicked, and that button is
`relevant="-print"`. The field ids confirm it independently: 005 and 006 sit mid-sequence
in the extraction order, where a field added by a placement pass would be appended after
the highest id.

---

# Three questions from the app, answered

## 1. F32 p1 — should the Part 1 area have a second box below the note?

**No.** The area is 484 x 34 pt at y 578, and the government prints
"[if more space is required - attach page and state \"See Attached\"]" directly under it at
y 616, leaving 110 pt of blank page below the note. The 34 pt is not a placement choice —
the printed sentence above ends at y 574 and the note begins at 616, so the area exactly
fills the gap the government left.

Two reasons not to add a second box under the note. It would sit beneath an instruction
that tells the filer to **attach a page instead**, which reads as contradicting it; and the
same "attach page" note governs roughly twenty other forms in the set (F22, F24, F39, F44,
F68, F70, F71, F73, F74, F86 …), every one of which has one area, the note, and nothing
after it. Adding one here alone would make F32 the odd form out; adding it everywhere would
invent a writing area the government does not have.

## 2. Address for service is now a `TextField`

Five labelled address blocks retyped so the text sits vertically centred:
F3 p4, F5 p3, F6 p3, F68 p2, F89 p2. **F4 p4's was already a `TextField`** at 102 pt tall,
so this settles a family the government itself is inconsistent about rather than inventing a
convention.

*Worth knowing*: a single-line control does not wrap, so an address much past ~90 characters
will run beyond the visible box on these five.

### And the pass batch 1 never had

Checking those boxes showed batch 1 had never been through the §8 type pass at all —
`normalise_types_bc2.py` was written while batch 2 was being read and only ever ran over
batch 2. Batch 1 still carried **246 `TextArea` fields one line tall across 32 forms**
(F45 34, F8 28, F38 26, F3 24, F5 17 …), each drawing a multi-line control in a box that
cannot hold a second line. `normalise_types_bc1.py` applies **rule 1 only** — the
unambiguous half — for 251 corrections across 33 forms including the five address blocks.

Rules 2 and 3 are deliberately not run over batch 1: the column-majority rule needs the
batch read page by page first, and the tall-and-wide rule would flip those very address
blocks back to `TextArea`.

## 3. "Endorsed:" — the signature line is missing, and not only there

**Confirmed against both authorities, and it is our fault, not the government's.**

* The prescribed form in the Rules (BC Laws, Supreme Court Family Rules, Appendix A) ends
  F32.01 with `Endorsed:` then `Judge/Associate Judge/Registrar ....` then `Date ....`.
* The government's own fillable template has it too — as a `<field>` whose `<ui>` is a
  `<signature>` and whose caption, `placement="bottom"`, reads
  **"Judge / Associate Judge / Registrar"**.

Unpatched pdf.js renders an XFA `<signature>` widget as nothing, and that caption belongs
to the widget rather than to a separate `<draw>`, so the words vanish with it. The
pre-fix sweep of both batches found **95 signature captions in the sources, 73 of which
never reached the page**
— "Registrar", "Signature of", "A commissioner for taking affidavits for British Columbia",
"Signature of Judge or Associate Judge", "Signature of new lawyer", and so on, across ~40
forms.

**Resolved in the flatten on 2026-08-13.** `xfa/patch_pdfjs_signature.mjs`, applied by
`fetch_pdfjs.sh`, gives pdf.js's unsupported `<signature>` UI a non-editable blank signing
area. Its bottom border prints the signature rule, and pdf.js's existing
`placement="bottom"` layout puts the source caption underneath. The first implementation
put the border on the outer field container and therefore left the caption above the rule;
the corrected structure keeps the border on the blank signing-area child.

F19, F18.1, F32.01 and F32.001 were re-rendered and promoted. Their restored captions are
"Signature of", "Judge / Associate Judge / Registrar", or "Judge / Associate Judge" as
specified by each source. The controls contain no `input`, `textarea` or `select`, so they
never enter the editable overlay map and §5 remains intact. Automated verification asserts
that each caption is below its corresponding rule; the normal geometry, overlap, native-
widget and export-import gates also pass.

The shared fix applies to future XFA renders. Other already-promoted PDFs from the earlier
95-field sweep change only when they are explicitly re-rendered through the corrected
pipeline; do not claim their missing captions are repaired merely because the build tool is.

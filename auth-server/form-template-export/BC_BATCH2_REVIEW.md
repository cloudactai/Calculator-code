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
repair_f1_duplicates.py
place_missing_bc2.py --apply  # adds fields
trim_label_overlap.py --apply # adjusts geometry (asserts the field set is unchanged)
normalise_types_bc2.py --apply
build_bc_batch2.py --rows-only
merge_catalog2.py --promote
rebind_bc_forms.py
```

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

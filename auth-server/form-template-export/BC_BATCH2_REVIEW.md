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

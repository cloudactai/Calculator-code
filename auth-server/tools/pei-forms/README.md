# Prince Edward Island forms pipeline

Builds the PEI templates in `form-template-export/` from the Courts of PEI's own
forms page. Staging lives in the gitignored
`form-template-export/_incoming_pei/`.

Requires Python 3 with PyMuPDF (`fitz`), `python-docx`, and **LibreOffice**. No
Chrome, no Adobe.

## Scope

**34 forms, 81 pages, 1,232 fields, 67 binds, zero findings.** Catalogue rows
3601–3634.

> Was 34 forms / 64 pages / 1,143 fields / 4 binds as first shipped. The binds
> came from the general-heading pass (`GENERAL_HEADING_PLAN.md`), which put a
> real style of cause on 20 forms that had printed only `(General heading)`;
> the pages and most of the fields came from that pass and from the
> answer-space pass below, both of which add a continuation page where a
> reflow no longer fits on the sheet it started on.

> **Reviewed page by page, 2026-08-27 and 2026-08-28.** All 64 pages were
> read twice against their renders; 36 were corrected on the first pass and a
> further 18 on the second, after the live app surfaced two defect classes
> the first pass's renders had not made visible: every checkbox in the batch
> was seated 4.5-6pt too high, and several pages had no field at all where
> the published form expects one (a respondent's name and address, a joint
> petition's two spouses, a claim list's growable slots). The row-per-page
> record is in `tools/review/ledger.json`, the repairs in
> `tools/review/repair_pei_fields.py`. See **What the page-by-page review
> found**, below.

| Rule | What it is | Forms |
| --- | --- | --- |
| 70 | Divorce Actions | 31 |
| 71 | Family Law Proceedings | 3 |

### Rule 65 is the trap

**Rule 65 is *Estates of Deceased Persons*, not family**, and is out of scope.
It is worth naming because it carries the largest form family PEI publishes —
65A through 65DDD, about **72 forms**, more than twice the family set — and a
scoping pass that went by form count, or that assumed PEI numbers its rules like
Ontario, would have pulled the entire probate set in and shipped it as family
law. The rule titles were read out of the consolidated rulebook before anything
was fetched. Probate is deliberately out of scope in every province of this
catalogue.

## Two sources per form, and why the Word one is used

PEI publishes most forms twice: a fillable PDF and a `.doc`/`.docx`. **This
pipeline builds from the Word document, for all 34.**

The fillable PDFs are **XFA** — Adobe LiveCycle documents that render as the
"Please wait…" placeholder outside Adobe and carry no AcroForm layer at all
(`f-70a.pdf` reports 0 widgets with `AcroForm/XFA` present). Building from them
means the headless pdf.js + Chrome flatten that BC's Supreme set needs, which is
the most fragile path in this repo: it required a pdf.js source patch to stop
`<signature>` widgets dropping their captions, and a local HTTP server to render
against.

Against that:

- only **17 of the 34** forms have a PDF at all, while **all 34** have a Word
  version, so the Word path is the only uniform one; and
- the Word renders carry the anchors the detectors want — Form 70A alone prints
  **49 underscore runs and 41 tick glyphs**, and Form 70I(A) (Statement of
  Income) sets its income table as a ruled grid.

The cost is recorded rather than hidden: **the background is ours, not the
government's**, exactly as in Nova Scotia. If PEI's XFA geometry is ever wanted,
the flatten route is `tools/bc-forms/xfa/` and the PDF URLs are kept in
`pei_sources.json` under `pdf`.

## Fetching, and the bot-check

The **`courts.pe.ca` HTML pages sit behind a Radware bot-check** that curl
cannot pass — which is why `pei_sources.json` was captured with a real browser
rather than scraped, and why there is no `scrape_pei_index.py` here.

The **file host is not gated**: everything under `/sites/.../files/` fetches
fine with curl, so `fetch_pei.py` needs no browser and runs like every other
province's.

```
python3 fetch_pei.py [--force]
```

Downloads the Word source, renders it with LibreOffice, and verifies sha256,
byte size, rendered page count, and that the form prints its own number. The
number is matched loosely on internal spacing — the court sets "70 I (A)" on the
page and "70I(A)" in its index — but strictly on the right-hand boundary, so
"70B" does not match inside "70BB" and "70A" does not match inside "70AA".

## Build

```
python3 build_pei_forms.py [--only PEISC_70A] [--category Financial] [--promote]
```

### Form 71B is reflowed in Word, not patched in PDF

Form 71B is the one source-layout exception.  The published legacy `.doc`
places its short name and address placeholders inside one dense paragraph,
leaves no writing space after item (c), separates two signing roles
ambiguously, and ends with a duplicate `Registrar` label.  Earlier repairs
masked that rendered paragraph and drew replacement PDF text.  Browser zoom
made the underlying and replacement text diverge, producing the overlap and
mixed-font result that a source rebuild is supposed to prevent.

`fetch_pei.py` now runs `reflow_pei_71b_source.py` before LibreOffice renders
this form.  The tool validates the legal copy against the government Word
file, rebuilds the page as a native DOCX in Times New Roman, and lets Word flow
all content normally.  It provides:

- separate, fixed-width opening name and address rules, with the address rule
  longer than the name rule and clear of the word `of`;
- a source-created writing band and matching bottom rule after item (c);
- distinct recognizant and Registrar signature rules, as the published source
  requires, with no text fields on either signature;
- explicit labels for the recognizant date, court-order date, and Registrar
  date; and
- one Registrar label.

The reflow script is part of Form 71B's render-cache key, so changing it forces
a new source PDF.  `build_pei_forms.py` maps the source-created rules while
retaining the form's existing semantic field IDs.  No Form 71B code remains in
`repair_pei_background.py`; rerunning the review repairs cannot layer text over
this source-generated page again.

For the other 33 forms, the detectors are **Nova Scotia's, unchanged**
(`tools/ns-forms/ns_anchors.py`), because PEI prints the same vocabulary from
the same kind of LibreOffice render.
The bracket token that dominates Nova Scotia is nearly absent here — PEI writes
its blanks as underscore runs, closer to Saskatchewan — but the detector costs
nothing to run and catches the handful that exist.

| Anchor | Count | Becomes |
| --- | --- | --- |
| an empty cell of a ruled table | 449 | a text field |
| a run of three or more underscores | 254 | a text field |
| a tick glyph — `☐` | 159 | a checkbox |
| a bracket token | 4 | a text field |

**Read the tick row as a warning, not a total.** 159 is the number of squares
the detector *found*, and it matched, which is exactly why nobody asked what it
had missed. There were 240.

### What the ruled-cell detector had to learn here

Form 70I(A), the Statement of Income, is what forced two fixes that now benefit
Nova Scotia as well:

- **A row's cells are cut by the verticals that span *that row*.** Taking
  consecutive x-positions from a page-wide list looked right and was wrong: PEI
  carries a short rule at x = 387 belonging to another table, which fell inside
  the AMOUNT column and split it in two — and because that rule does not span
  the row, the four-borders test then rejected *both* halves. The whole AMOUNT
  column of a Statement of Income got no boxes while COMMENTS beside it got all
  of them.
- **A cell holding nothing but a currency symbol is still a blank.** The form
  prints `$` and expects the figure beside it, so the box starts after the
  symbol rather than the cell counting as occupied. Saskatchewan hit the same
  shape from the other direction (a drawn rule after a `$`).

### A known, accepted cost

**Confirmed by the review, and still only that.** Across both conversion
charts on Form 70I(A) the count is two, as recorded. A **fully shaded "not
applicable" cell still gets a box** — on the conversion
charts, the Monthly row's CONVERSION FORMULA cell is a solid grey block meaning
no conversion is needed, and it is boxed anyway. Refusing shaded cells is not an
option: Manitoba's builder tried exactly that and its grey "heading row" rule
ate Form 70D.5's TOTAL and NET rows, 24 empty cells, because Manitoba shades its
totals the same grey as its headings — and Nova Scotia shades SUB TOTAL and
TOTAL MONTHLY INCOME identically. Two spurious boxes per conversion chart is the
cheaper error.

## What the page-by-page review found

Every page was opened. Six defect classes came out of it, and only one of them
was visible to any gate.

### Six vocabularies for one square, and the builder knew two

PEI prints its option square six ways. Counted across the whole batch:

| Codepoint | Font | Count | Was it boxed? |
| --- | --- | --- | --- |
| `U+25A1` WHITE SQUARE | Times New Roman | 155 | yes |
| `U+2610` BALLOT BOX | AppleSymbols / Arial Unicode | 4 | yes |
| `U+F0F0` | Symbol | 66 | **no** |
| `U+F091` | OpenSymbol | 8 | **no** |
| `U+F039` | OpenSymbol | 6 | **no** |
| `U+F071` | Wingdings | 1 | **no** |

**Form 70R is the worst of it.** A Registrar's Certificate exists to be ticked,
and all 60 of its squares were untickable. Worse, they do not print as squares
at all: LibreOffice mapped the court's checkbox to Symbol `U+F0F0`, which
renders as an **Apple logo**. The fields are now correct, but the glyph in the
background is still wrong, and fixing that means a font substitution at render
time — a rebuild, not an in-place repair. It is the clearest case yet of the
warning at the top of this file: *when a page looks wrong, the renderer is a
suspect alongside the detector.*

**`U+F039` deserves its own line.** Text extraction renders it as the digit
`9`, so Form 70I(C) reads as `9 a) child care expenses …`. Matching a bare "9"
would be reckless; what makes it safe is the private-use codepoint together
with the symbol font, never the extracted character.

### Blanks with no field — 24

Two shapes. Where one line ends in a rule and the next line does too, only the
lower one was boxed, so Form 70A's items 9, 14 and 16 were unanswerable while
10 and 15 were fine. And Form 70I(A)'s "Every second week" row prints `$`, a
run of *spaces*, and draws its rule as geometry — invisible to any
underscore audit, exactly the shape Manitoba's README warns about.

### Boxes on signature lines — 28

The convention in this repo is that a signature rule carries no field:
Manitoba refuses them by caption, BC ships `drop_signature_boxes.py`. Neither
Nova Scotia's builder nor this one has any such refusal — `signaturesSkipped`
is a hardcoded `0` in both — so PEI shipped typeable boxes on "Signature of
petitioner", "Signature of judge" and 26 others. **Nova Scotia's 102 pages
inherit the same gap and have not been reviewed.**

The list in the repair tool is written out rather than matched, because
matching was wrong four times and every wrong answer was caught by opening the
page. The sharpest: Form 70A page 8 sets `Date ______  Signature of respondent
______` at one height, and the rule two lines above them is the respondent's
*address for service*. Matching on the nearest caption claimed the address and
the date as signatures.

**Office captions are deliberately left alone.** A rule captioned "Registrar",
"Prothonotary" or "A Commissioner for taking Affidavits" is arguably a
signature line too, and Manitoba drops those as well. PEI already ships five
such fields; removing them is not something the ledger can undo, and nothing in
the review said they read wrong. Recorded as a known asymmetry rather than
quietly resolved.

### Four bracket-token boxes, all four spurious

The bracket anchor gives PEI four fields and none of them is a blank. Form
70I(A) prints `known as ______________ [name of Partnership]` — the underscore
run is the blank, the bracket is the label — so the bracket box duplicated the
field beside it and stamped its value over the printed instruction. On Form
70I(D) the bracket tokens are whole instruction lines with no blank in them at
all.

### Empty cells and answer bands — 17 added

Form 70BB's **Responding Party block** had no fields at all: the two cells
where the other side's name, address and lawyer go. Form 70I(B)'s Child Support
and Spousal Support row is one row holding two numbered items, so it read as
occupied and got nothing. Form 70I(D) sets Real Estate, Debts and the proposed
additions as a row of column headings over open paper with no grid under them,
so three whole sections were unenterable.

### Every checkbox in the batch was seated on the wrong part of its glyph

Confirmed only on the second pass, because the first pass's renders draw a
number and an outline over each field and never show the printed glyph
underneath at the same time a human is looking for a 4.5pt gap. Opening the
live app did.

A character's reported bounding box is its full type cell, ascent to
descent; the printed square itself occupies only the bottom slice of it. The
builder anchored every checkbox at the top of that cell using the glyph's
width as the side of a square -- correct in width, wrong in y, on all six
vocabularies and on every checkbox the earlier `pass_ticks` repair added
too. Measured on Form 70A: a `☐` cell is 5.4 x 9.96pt; a box sized to that
width and anchored at the cell's top sits 4.5pt above where the mark is
actually drawn. On Form 70R's `U+F0F0` glyphs the cell is 7.9 x 11.25 -- same
shape, same direction of error.

**240 checkboxes were re-seated, the whole population.** The fix is
anchoring at the bottom of the glyph's cell instead of the top, keeping the
field's existing width as the side of the square; it is the identity
function on anything not already sitting exactly on a glyph's top-left
corner, so a second run touches nothing already fixed.

### Fields added by name after the live app surfaced them

Four more requests, none of them anchored to a printed rule the way the rest
of this batch is, so each is a named, measured entry rather than a detected
one:

* Form 70A's **"TO:"** line never had anywhere to put the respondent's name
  and address -- the caption printed directly after the label with no rule.
* Form 70A*'s two **"(Name)"** placeholders over "Spouse One" / "Spouse Two"
  print as bare instructions, the same shape as a bracket-token elsewhere in
  this batch; a field now replaces each placeholder rather than leaving the
  role label with nothing above it.
* Both forms' claim lists -- **(a)(ii)/(iii)** under the *Divorce Act* and
  **(b)(i)/(ii)/(iii)** under the *Family Law Act* -- are growable slots on
  the published form; (a)(i) prints "a divorce" as a fixed default and is
  left alone, but the rest had never been boxed at all.
* Form 70A*'s **"Issued by ______ Registrar"** line had a client-facing
  field on it, which is backwards: it is the court's own signature rule, the
  same class this batch otherwise leaves bare (`BARE_RULES`,
  `SIGNATURE_BOXES`). Dropped, not left as a further asymmetry.

### What could not be repaired, and why

> **Superseded in round 6 — see "Sixth pass: making the answer space" below.**
> The reasoning here was sound while it was written, and it is left standing
> because the conclusion it reached was reversed by a change in what the batch
> could do, not by anyone deciding it had been wrong.

**PEI has far less blank paper than it looks like it has.** The gap under "If
yes, provide details." on Form 70A page 7 measures **20.6pt** — one line of
leading. Form 70A page 7 and Form 70A* page 5 are full pages of such questions
and carry no field at all; Form 70A page 1's claim slots `(a)(ii)`, `(iii)` and
`(b)(i)`–`(iii)` are numbered lines with nothing after them.

The court's expectation is that the drafter opens the Word document and inserts
paragraphs, which is an affordance a fixed-geometry PDF overlay cannot
reproduce. Boxing 20pt of leading would not give anyone room to write; it would
only put a control where the form has none. Three bands that genuinely are
answer space are named in the repair tool; the rest is recorded here as a limit
of building these forms as flat PDFs, not as a defect anyone can fix in the
mapping.

## Third pass: the other 31 forms, and one gap repeated eleven times

Round 2 fixed 70A and 70A\* for two bug classes: a printed line-end blank
sized to less than the page's real content margin, and a growable
`(i)`/`(ii)`/`(iii)` relief list left unboxed past its first line. Round 3
opened every remaining PEISC form -- source, overlay and, where a form had
more than one page, the combined view -- looking for the same two classes.

**Neither turned up again.** Every other line-end blank in the batch is
already sized to genuine blank paper, and no other PEISC form prints a
growable claim list at all -- that shape is specific to the petition, which
only 70A and 70A\* are.

**What did turn up, on eleven forms, is 70A's own "TO:" gap, repeated.** A
bare parenthetical instruction -- `TO: (Name and address of ...)` -- prints
on its own line, or inline after the label, with no rule under it and
nothing else on the line, the same shape 70A's `NAMED_FIELDS` entry was
already written for. Found and fixed on:

| Form | What prints there |
| --- | --- |
| 70B | `TO (Name and address of respondent to the counterpetition...)` and `AND TO (Name and address of petitioner's lawyer or petitioner)` -- two boxes |
| 70D | `TO:  (Name and address of petitioner's lawyer or petitioner)`, inline |
| 70CC | `TO:  (Name and address of lawyer or party receiving notice)` |
| 70DD | `TO: (Name, address, telephone number and email address of Respondent)` |
| 70E | `TO (Name and address of respondent's lawyer or respondent)` |
| 70EE | `TO:  (parties)`, inline |
| 70F | `TO (Name and address of respondent's lawyer or respondent)` |
| 70G | `TO (Name and address of lawyer or party to be served)` |
| 70H | `TO (Name and address of lawyer or party on whom notice is served)` |
| 70M | `TO (Names and addresses of lawyer or parties receiving notice)` |
| 71E | `TO (Name and address of person summoned)` |

Each box sits on the label's own line -- or, where the placeholder prints
inline (70D, 70EE), replaces the placeholder text the way 70A\*'s "(Name)"
placeholders were replaced in round 2 -- out to the page's own rightmost
printed ink, read fresh off each page rather than carried over as a flat
number. 12 fields added in total (70B gets two). Everything the sweep
otherwise looked at -- 70AA, 70BB, 70BB.1, 70I(A)-(D), 70J, 70P, 70Q, 70R,
70S, 70T, 70U, 70V, 71A, 71B -- was already boxed correctly by rounds 1 and 2
and needed nothing further.

```
python3 repair_pei_fields.py --check   # idempotent both before and after
python3 repair_pei_fields.py
python3 record_pe_round3.py
```

## Sixth pass: making the answer space

`pei_answer_space.py`. **33 answer areas on 18 pages of 11 forms.**

Round 3 found the narrative prompts and, in "What could not be repaired",
refused them: the gap under a prompt was leading, not answer space, and boxing
20pt of leading gives nobody room to write. That was right. What changed is not
the reading but the toolkit — `pei_general_heading` built a band reflow that
copies vector content with `show_pdf_page` and spills a tail it can no longer
fit onto a continuation page. With that, the answer to an undersized prompt is
to **make** the paper rather than to look for it, and the refusal's premise is
gone. Recorded rather than quietly reversed: the old section is left standing
with a pointer here.

Worst of it, and the reason this was worth doing: **seven of the batch's
pleadings ask a party to plead their whole case "in separate, consecutively
numbered paragraphs" and gave them at most one line — four gave them nothing at
all.** 70B, 70B*, 70D, 70E, 70F, 70G and 70A's item 35 now each get the rest of
their page, 12 to 31 writing lines, with the date/signature/service block that
followed spilled behind them.

Sizing is read off the prompt's own wording, never off the size of the gap it
was given: a numbered-paragraph instruction gets a third to half a page, an "if
yes, provide details" gets three to five lines, a table gets nothing (70A's
item 36 and the child-support grids are answered row by row and were already
boxed). 70A's item 34 — "briefly outline the reasons here" — was already
correctly brief and is untouched.

**The pass adds no ink.** Backgrounds are only ever cut into bands and
re-placed lower; the answer space is empty paper carrying a `TextArea`, which
is what `NARRATIVE_AREAS`, `pass_cells` and `pass_subcells` already do. Nothing
is scaled — this batch has refused that three times now.

Three things it had to learn, none of which the field tables would have shown:

* **A cut must land in clear paper, and "clear" includes the invisible.**
  LibreOffice leaves white-on-white rectangles all over these pages. A band
  redaction keeps art it does not wholly cover, so a cut through one duplicates
  it and the copy paints white over whatever the lower band lands on. 70D's and
  70G's natural cuts both sit inside one. `validate_cut` refuses any cut
  crossing type, art or a field; `scrub_whiteouts` removes a crossed rectangle
  only where no glyph sits inside it, on a hairline band so a second whiteout
  stacked below it is left alone.
* **A rebuilt page has to be re-seated and re-fitted.** The shift is exact at
  two decimals but the ink rides an XObject matrix, so re-extracted extents
  round differently — 0.04pt on text boxes, 0.09pt on option squares. `reseat`
  (the heading pass's) and `refit_ticks` correct that rounding scale and
  nothing larger, so `repair_pei_fields --check` reports **exactly what it
  reported before this pass ran.**
* **Nine forms gain pages, so the ledger renumbers.** A continuation is spliced
  in behind the page it spilled from, so 70A's own page 3 is now page 4.
  `record_pe_round6.py` derives the remap from `answer_space_shifts.json`
  rather than hardcoding it.

### What this pass still does not fix

* **70A's item 42** (condonation/connivance — "give details and set out the
  facts") gets no box. Page 7 has 7.5pt of slack; four disclosure items already
  spill its tail, and item 42 lands on the continuation immediately followed by
  the TRIAL heading, with the free paper below *that*. Boxing the leading under
  it would repeat the mistake this pass exists to correct. It needs a cut on
  the continuation page — a second round over a page this pass created — which
  is a mechanism, not a measurement, and is left for its own change.
* **70BB and 70BB.1** are ruled tables end to end. A band cut through a table
  slices its vertical rules, which `validate_cut` refuses outright — the
  refusal is the proof, not an oversight. Their prompts need the grid redrawn,
  not the page reflowed.
* **70I(C)'s item 4** ("unable to obtain receipts, for the following reasons")
  sits at the foot of a full page with nothing below it to displace, so there
  is no band to grow into without separating the prompt from its answer.

```
python3 pei_answer_space.py --check      # validates every cut, writes nothing
python3 pei_answer_space.py
python3 ../review/record_pe_round6.py
```

## Seventh pass: the lawyer's name had 28pt

`pei_inline_name_rules.py`. **5 instances on 4 pages.**

Five forms print "I, ____, lawyer for the petitioner, certify to this court
that I have complied with the requirements of section 7.7 …", and the court's
own typesetting gives the name **28pt** — about eight characters. The mapping
had honoured that rule exactly, which is why nothing flagged it: the box was a
faithful copy of the blank. `render_review`'s **filled** view is what showed the
defect, and it is the reason that view exists — a name of ordinary length
overflows in red and prints across the word "lawyer". It had been there since
the first build.

Nothing could be widened in place. The line is justified to the right margin, so
a wider box covers the court's own words. The line is reflowed instead: its tail
moves onto its own line at the paragraph's continuation indent, and the blank
takes the whole of line 1 — 28pt becomes 334–422pt.

    46. I, ____, lawyer for the petitioner, certify to this court that I have
        complied with the requirements of section 7.7 ...

    46. I, ______________________________________________ ,
          (name)
        lawyer for the petitioner, certify to this court that I have
        complied with the requirements of section 7.7 ...

**The sentence is copied, not re-typeset** — lifted as a clipped form XObject
and re-placed, so its glyphs, spacing and justification are the page's own. Two
things are drawn: the rule's extension (the same 0.6pt stroke) and the `(name)`
caption, six glyphs of Times-Italic 5.6 re-drawn at its own origin because it
straddles the band edge and cannot ride across it. That is the move
`repair_pei_background.COURT_ADDRESS_REFLOWS` already makes to widen a 55pt
court-office rule to 135pt.

Three things this pass had to learn, none of them visible on a render:

* **A redaction takes the glyphs it touches.** Boxing the `(name)` caption to
  remove it reached a point and a half into the line below and took letters out
  of the middle of a word — the first render printed `re    ments of section
  7.7`. The caption straddles the cut, so the band edges delete it anyway; it
  needs no redaction of its own.
* **A strip keeps the art its surround merely touches.** Each relocated strip
  carried its own copy of the writing rule and both whiteouts, +6 drawings per
  instance, all of them invisible. Strips are carved with
  `REMOVE_IF_TOUCHED`; bands are not, and must not be.
* **Scrubbing a stroked rectangle by its own box does not scrub it.** The
  stroke is centred on the path, so the box does not cover the ink and
  `REMOVE_IF_COVERED` keeps it. Scrub on a hairline at the cut instead, the way
  `pei_answer_space` does.

```
python3 pei_inline_name_rules.py --check
python3 pei_inline_name_rules.py
python3 ../review/record_pe_round7.py
```

## Catalogue, binds, verify

```
python3 merge_pei_catalog.py
python3 rebind_pei_forms.py [--check]
python3 verify_pei.py
npm run forms:validate-export     # from auth-server/
```

> **`merge_pei_catalog.py` is not free to re-run just to correct a page
> count.** It rebuilds the whole PEI block and re-derives `sortOrder` from
> whatever the catalogue currently occupies (its own docstring says so), and
> another province has grown past 3600 since PEI was merged — so running it in
> round 6 moved all 34 PEI rows from 3601–3634 to 4101–4134 as a side effect of
> a nine-row `pageCount` change. Round 6 therefore updated `pageCount` in place
> and left `sortOrder` alone. `audit.json` is separately stale (its field counts
> lag several provinces, Nova Scotia included) and was left as found rather than
> regenerated inside an unrelated change.

**PEI captions its party lines below-right**, which is a third convention: NL and
NS print the role beside the box, BC and SK print it to the left, and PEI puts it
on the line *under* the box toward the right margin.

```
Between:  [__________________]
                                   Applicant/Petitioner
```

Only the **rightmost contiguous run** of words in that band is read. Taking the
whole band picked up the "and" joining the two party lines and the heading of
the next section, so the applicant's caption arrived as "and
Applicant/Petitioner" and the respondent's as "Statement of Income of ____".

"Applicant/Petitioner" is matched explicitly as **one label naming one box** —
Rule 70 says *petitioner* and Rule 71 says *applicant* — rather than being
treated as the strike-out choice a slash marks elsewhere in this batch.

**Only 4 binds, across 2 forms, and that is the right answer.** Most PEI forms
do not print a style of cause at all: they print the instruction
`(General heading)` and leave the drafter to paste the heading block in. Where
there is no party box there is nothing to bind, and the two financial forms that
do print a full style of cause are the two that get bound.

## Reviewing it again

The source and the shipped background once rendered **pixel-identical on all 64
pages**, which followed from the build path: `flatten_background` copies a
LibreOffice render rather than modifying it.

**That invariant no longer holds, and a reviewer should not trust it.** Four
passes now rewrite the background itself — `reflow_pei_71b_source.py` (71B),
`pei_general_heading.py` plus `convert_70a_joint_heading.py` (a style of cause
on 20 forms), `pei_answer_space.py` (answer space on 18 pages of 11 forms) and
`pei_inline_name_rules.py` (the Statement of Lawyer's first line on 4 pages).
Every one of them reflows the page in bands copied with `show_pdf_page`, so
nothing is re-typeset and nothing drifts, but the shipped page is no longer the
source page and the source is no longer the only thing worth reading. On a
reflowed page read the **shipped background**, not the `.doc`; on the rest the
`combined` view still carries both reads at once:

```
python3 ../review/render_review.py PEISC_70R --views combined
python3 ../review/repair_pei_fields.py --check     # every pass is idempotent
python3 ../review/review_ledger.py --check --province PE
```

## Overlay convention

Unchanged: `field.x` = box left in points, `field.y` = box top in points (y
down), `width`/`height` = points × 1.5, and `FillPdf.savePdf` stamps
`y = pageH − field.y − height/1.5`.

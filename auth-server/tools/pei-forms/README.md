# Prince Edward Island forms pipeline

Builds the PEI templates in `form-template-export/` from the Courts of PEI's own
forms page. Staging lives in the gitignored
`form-template-export/_incoming_pei/`.

Requires Python 3 with PyMuPDF (`fitz`) and **LibreOffice**. No Chrome, no
Adobe.

## Scope

**34 forms, 64 pages, 954 fields, 4 binds, zero findings.** Catalogue rows
3601–3634.

> **Reviewed page by page, 2026-08-27.** All 64 pages were read twice against
> their renders and 36 of them were corrected; the row-per-page record is in
> `tools/review/ledger.json` and the repairs are in
> `tools/review/repair_pei_fields.py`. See **What the page-by-page review
> found**, below — the headline is that the builder knew two of PEI's *six*
> option-square vocabularies, so 81 squares could not be ticked, 60 of them on
> one form.

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

The detectors are **Nova Scotia's, unchanged** (`tools/ns-forms/ns_anchors.py`),
because PEI prints the same vocabulary from the same kind of LibreOffice render.
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

### What could not be repaired, and why

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

## Catalogue, binds, verify

```
python3 merge_pei_catalog.py
python3 rebind_pei_forms.py [--check]
python3 verify_pei.py
npm run forms:validate-export     # from auth-server/
```

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

The source and the shipped background render **pixel-identical on all 64
pages** — which follows from the build path, since `flatten_background` copies
a LibreOffice render rather than modifying it. So for this province the
`combined` view of `tools/review/render_review.py` carries both reads on the
authoritative page:

```
python3 ../review/render_review.py PEISC_70R --views combined
python3 ../review/repair_pei_fields.py --check     # every pass is idempotent
python3 ../review/review_ledger.py --check --province PE
```

## Overlay convention

Unchanged: `field.x` = box left in points, `field.y` = box top in points (y
down), `width`/`height` = points × 1.5, and `FillPdf.savePdf` stamps
`y = pageH − field.y − height/1.5`.

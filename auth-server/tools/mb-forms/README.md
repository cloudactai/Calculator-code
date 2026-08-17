# Manitoba forms pipeline

Regenerates the Manitoba templates in `form-template-export/` from the
government sources. Everything here is a build tool — the repo ships only the
produced `MBKB_*.pdf/.json` plus `catalog.json`. Staging lives in the gitignored
`form-template-export/_incoming_mb/`.

Requires Python 3 with PyMuPDF (`fitz`). **No Chrome, no Node, no Adobe**: like
Saskatchewan and unlike BC, nothing here has to be flattened.

## Scope

The **43 family-law forms of Rule 70** of the Court of King's Bench Rules,
published by Manitoba Justice. The civil parts and the probate forms are
deliberately out of scope, matching the Ontario, BC and Saskatchewan catalogues.

All 43 are recorded in `mb_sources.py` and fetched, so a form that is renumbered
or withdrawn surfaces immediately. Only the categories named in
`SHIPPED_CATEGORIES` are built, catalogued and bound. **This batch ships
`Financial` — 5 forms, 777 fields.** Adding a category is one edit there, then
build → verify → merge → rebind.

| Form | Title | Pages | Fields |
| --- | --- | --- | --- |
| 70D | Financial Statement | 8 | 288 |
| 70D.1 | Demand for Financial Information | 3 | 34 |
| 70D.5 | Comparative Family Property Statement | 6 | 292 |
| 70U | Summary of Assets and Liabilities | 13 | 104 |
| 70W | Recalculation and Enforcement Information Form | 1 | 55 |

## 1. Fetch and verify sources (gates A, B)

```
python3 fetch_mb.py
```

Downloads all 43 forms into `_incoming_mb/`, verifies PDF magic, the page count
against `mb_sources.py`, and that the form prints its own number ("Form 70D") in
its text, then writes `_incoming_mb/manifest.json` with sha256, byte size, page
count, footer line and `kind`.

The download URL is **derived, not recorded**: Manitoba serves each form from a
slug built out of the form number (`70D` → `70de.pdf`, `70D.1` → `70d1e.pdf`),
so there is nothing to go stale except the numbers themselves. That is also why
the form-number check matches with a non-dot boundary — the slug drops the dot,
which is exactly how a typo lands on Form 70D.1 while asking for Form 70D.

> `curl`, not Python's HTTP client: this box sits behind a TLS-inspecting proxy
> whose root is in the system trust store but not in certifi. The BC and SK
> fetchers shell out for the same reason.

All 43 come back `static` — no widgets, no XFA.

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
| A run of underscores | 12 | a text field |
| A `(full name)` caption under blank paper | 6 | a text field above the caption |

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
  reach. A bracket column is three or more `)` in a tight vertical stack; nothing
  reads the gap to the word before, because two of Form 70D's four are printed
  3pt after the comma ending the left column's line.

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

Current state: **5 forms, 777 fields, zero findings**, and the build is
idempotent (two runs produce byte-identical maps).

## 4. Catalog

```
python3 merge_mb_catalog.py
cd ../.. && npm run forms:validate-export
```

Rewrites the MB block of `catalog.json` (sortOrder from 401, clear of Ontario's
1–135, BC's 101–288 and Saskatchewan's 301–340) and regenerates `audit.json`.
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

20 fields bind: the court file number on every page that prints one, plus the
applicant and respondent on 70D, 70D.1 and 70U.

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

## Overlay convention

Unchanged from Saskatchewan, BC and Ontario. `field.x` = box left in points,
`field.y` = box top in points (y down), `width`/`height` = points × 1.5.
`FillPdf.savePdf` stamps `y = pageH − field.y − height/1.5`.

The measured constant specific to Manitoba: the printed rule is a filled
rectangle 0.72–0.84pt thick, and the box is seated 1.3pt above its centre. The
next thicker filled rect on any of these pages is a 9pt shading band, so the
`RULE_MAX_THICK = 1.6` cut has 8pt of clear air in it.

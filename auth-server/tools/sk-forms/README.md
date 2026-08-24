# Saskatchewan forms pipeline

Regenerates the Saskatchewan templates in `form-template-export/` from the
government sources. Everything here is a build tool — the repo ships only the
produced `SKKB_*.pdf/.json` plus `catalog.json`. Staging lives in the gitignored
`form-template-export/_incoming_sk/`.

Requires Python 3 with PyMuPDF (`fitz`) and Node. **No Chrome and no Adobe**:
unlike BC, nothing here has to be flattened.

## Scope

**121 forms across four families**, matching the breadth Ontario and BC carry.
All 121 are fetched, built, catalogued, bound and verified with **zero
findings**. Everything
downstream of the fetcher reads `shipped_sources()` rather than `all_sources()`,
which is new: Saskatchewan had no such split while `all_sources()` *was* the
shipped set, and without it `merge_sk_catalog.py` would write a catalogue row for
a template the API cannot serve.

| Family | Source | Forms | docId |
| --- | --- | --- | --- |
| Part 15 of The King's Bench Rules | one product per form | 40 | `SKKB_` |
| The Child and Family Services Regulations, c C-7.2 Reg 1 | one product per form | 16 (A-P) | `SKCFS_` |
| The Adoption Regulations, 2003, c A-5.2 Reg 1 | cut from the consolidation | 20 | `SKAD_` |

Part 15 is general family-division procedure and prescribes **no** child
protection and **no** adoption form -- the same split BC has, where the two
Family Rules books prescribe neither and batch 3 had to go to the CFCSA and
Adoption regulations for them. Saskatchewan runs those families under separate
statutes, and each statute's regulation carries its own appendix of forms.
`sk_sources_cp.py` records that scope and the reasons for it.

Five adoption forms are prescribed but **repealed**, and are not shipped: Forms
B and J (SR 114/2017), Form E (SR 99/2004), and Forms N and O (SR 11/2016).
Forms N and O are the trap -- the King's Printer still serves standalone product
PDFs for both, because the products were never retired when the regulation
repealed the forms, so the *regulation's appendix* decides the scope here and not
the product list.

Part 16 (probate and estates) and the civil parts remain deliberately out of
scope, matching the Ontario and BC catalogues.

### Why adoption is cut from the consolidation

22 of the 25 adoption forms do have their own product PDFs, and they are
unusable: their fonts carry no ToUnicode map, so `get_text()` on Form A-1 returns
the running head and nothing else, and on Form C-5 returns mojibake. This builder
reads every box off a printed anchor, so a source with no text layer builds an
empty form. The consolidation's text layer is clean for the identical pages, so
`sk_reg_cut.py` cuts each form out of it at the forms' own enacting headings --
including the headings of the repealed forms, which are what bound the bottom of
the form printed above them. (BC hit the mirror image in batch 3, where the
consolidation's images were broken and the standalone PDFs were clean.)

## 1. Fetch and verify sources (gates A, B)

```
python3 fetch_sk.py
```

Downloads every form in `sk_sources.py` into `_incoming_sk/`, verifies PDF magic,
that the page count matches what the publications site advertises, and that the
form prints its own number ("Form 15-47") in its text, then writes
`_incoming_sk/manifest.json` with sha256, byte size, page count, the Gazette
amendment line, and `kind`.

Sources come from the publications site's own API — the download URL is built
from the product and format ids recorded in `sk_sources.py`, so any source can be
re-fetched verbatim and diffed against what we ship.

> `curl`, not Python's HTTP client: this box sits behind a TLS-inspecting proxy
> whose root is in the system trust store but not in certifi. The BC fetcher
> shells out for the same reason.

## 2. Build

```
python3 build_sk_forms.py [--only SKKB_15_47] [--category Financial] [--promote]
```

**All 76 sources are static PDFs — no widgets, no XFA.** There is no government
rectangle to copy, so every box is read off a printed anchor. The whole 40-form
set uses exactly three vocabularies and no others:

| Anchor | Count | Becomes |
| --- | --- | --- |
| A run of underscores | 1,590 | a text field seated on the run's own measured ink |
| A 9×9 stroked square | 457 | a checkbox (there is no second size, and no glyph variant) |
| A ruled grid | — | a field per empty cell |
| A **U+F07E glyph** in WP-MathA | 21 | a checkbox, seated on the glyph's measured ink |
| A **drawn rule after a `$`** | 5 | a one-line amount field |

The last two are the adoption consolidation's own vocabulary and are the reason
the first build of it shipped 20 forms with no option boxes at all:

- **The option box is typed, not drawn.** `get_drawings()` returns *nothing* on
  those pages -- the options are the glyph U+F07E set in WP-MathA (WordPerfect's
  Math A), the same private-use trick the Wingdings check glyph plays in the tick
  column. The glyph's *character* box is not the box: at 20pt it measures
  14.94 × 23.34 while the square printed inside it is 13.5 × 13.4 and sits low in
  the cell, so the ink is measured off a render rather than taken from the font
  size.
- **An amount rule can be line art.** Adoption Form K sets its itemised rows as
  `$_______________` but its five totals (Total Income, Net Income, Total
  Expenses, Total Assets, Total Debts) as a `$` followed by a stroked line — so
  every total of a financial statement had a printed rule and nothing to type on.
  The detector is deliberately narrow: a rule only counts if its left end sits
  within 12pt of a `$` printed on the same line, because every table border in the
  set is also a drawn horizontal rule and none of them carries a `$`.

**The background PDF ships byte-identical to the government's file.** BC and
Ontario had to rewrite theirs — strip a widget layer, flatten XFA, redact dotted
leaders with captions inside them. Saskatchewan needs none of that, because the
underscore runs already print as the writing line. That removes every defect
class in placement-guide §6b (repairing a background we damaged).

### What the builder refuses to fill

Reading tables is most of the work, and most of it is deciding what is *not* a
field:

- **A cell the government already named** — the row labels down the left of the
  expense schedule (guide §9.3).
- **A cell in a printed reference grid.** Form 15-47's checklist prints
  "Schedules you must attach" as columns 1–7 with a dot marking which schedule
  each row needs. Those cells are guidance, and most are empty. The signal is the
  *column*, not the cell: a column whose non-empty cells differ from each other is
  printed data; one whose non-empty cells are all the same string is a repeated
  header over blank space. Narrow columns are then read as a group, because
  schedule column 6 carries no dot at all in the first block and on its own
  evidence is indistinguishable from a data column.
- **A shaded section-heading row** ("Source deductions", "Housing"). Measured off
  a render, not read from `get_drawings()` — the shading is painted as a few
  large bands rather than per row. Data cells read 255 and heading cells 219–230,
  with nothing between.
- **A signature, commissioner's or court officer's rule** (guide §5). Three
  vocabularies: `(signature of party)` in parentheses, `A Commissioner for Oaths
  for Saskatchewan`, and the office alone — six forms close with a rule captioned
  just `Local Registrar`. The role is matched as a whole line, so the instruction
  that mentions the office in passing ("the staff members at the Local
  Registrar's Office ... are commissioners for oaths") is not read as a caption.
  One further refinement Saskatchewan forces: a caption claims its **nearest**
  rule, not every rule in the 24pt window. The jurat sets `2_ _________ .` one line above "A Commissioner
  for Oaths for Saskatchewan", 23.95pt clear of it, so a flat rule deleted the
  year along with the signature line.

### What it does fill that is easy to miss

- **The tick column.** The checklist's narrow second column is headed by a check
  glyph — set in Wingdings, so it arrives as `U+F0FC`, not `U+2713`. It prints no
  square of its own, so its ticks are sized to the form's own 9pt box and centred
  in the cell. The glyph is printed once, on page 3; pages 4 and 5 carry the same
  table with no glyph, so the column is also recognised structurally — an
  entirely empty narrow column with the row numbers on its left and the
  descriptions on its right.
- **A blank inside a labelled cell.** Form 15-47 p9 prints
  "A. Business income… Gross $_____ …Net" inside one labelled cell. The cell is
  correctly skipped, and the gross figure still has to be typed.
- **Amount cells**, which start just after the government's `$` (guide §4).

### One thing to know about the grid

The grid is built **per row band**, from the verticals that actually cover that
band, not from one sorted list of every vertical on the page. Form 15-49 p3 has a
6-column table above a 7-column one and runs three rules down the full height of
the sheet; a single global x-grid cut each table's columns at the *other* table's
rule positions and left the property statement's Category and Institution columns
with no cells at all. A cell whose printed text crosses its own side borders is a
slice of a merged region, not a cell, and is discarded.

## 3. Verify (gate C–H)

```
python3 verify_sk.py [--stage]
```

Re-derives all **14** checks from the page rather than comparing against what the
builder stored: printed-text coverage, checkbox-on-a-printed-square, unfilled
blanks, unfilled drawn rectangles, `$` slots (missing, covered, and typed as anything but a one-line TextField), amount
seating, vertical stacking, edge clearance, signature rules, bounds, duplicate
ids, shared positions, box overlap and slivers.

Five of those exist because the first batch shipped with defects that only showed
up **in the app**: the overlay render draws the stored rectangle, while the viewer
draws its own bordered control inside it (guide §7). `--stage` checks the staged build; the default checks the promoted
templates.

The printed-text check reads **characters, not words**. `get_text("words")` hands
back `birth:___________________________` as one token, so a word-level test
either flags every correctly-placed box for the underscores it is supposed to sit
on, or — once underscores are excused — waves through a box that really has
covered the caption glued to them.

Current state: **121 forms, 6,531 fields, zero findings**, and the build is
idempotent (two runs produce byte-identical maps). The 40 Part 15 templates are
byte-identical to what they were before the other two families were added, which
is asserted directly rather than assumed -- the floors that had to move to fit
the adoption forms are scoped so that nothing already reviewed and shipped moves.

## 4. Catalog

```
python3 merge_sk_catalog.py
cd ../.. && npm run forms:validate-export
```

Rewrites the SK block of `catalog.json` and regenerates `audit.json`. The block
start is **derived from what the other provinces currently occupy**, not written
down: SK now lands at 801–876, above Manitoba's 701–786. `TITLE_OVERRIDE` is
keyed by docId rather than form number, because a form number is only unique
within its family and there is now a Form L under both regulations.

## 5. Prefill binds

```
python3 rebind_sk_forms.py [--check]
```

Writes back **only** the `bind` key, asserting every other key is byte-identical
first, so it is safe on templates whose geometry is already approved; a second run
is a no-op. Run it after any rebuild, which drops binds.

39 of the 40 **Part 15** forms open with the same heading, and the caption is
printed to the **left** of its blank, which is the only place it is read from.
105 fields bind: the court file number on 39 forms, the respondent on 37, the
applicant on 29.

**The child-protection and adoption forms bind nothing, by design.** They do not
print that heading block: they open "Judicial Centre of______" — the one line
Part 15 also refuses — and name their parties in running prose, labelling them
*underneath* the rule ("(name(s) of applicant(s))") where this tool does not
read. Binding from an underneath-caption would be a new rule with its own failure
mode on documents where a wrong name is worse than a blank: an adoption
"applicant" is the prospective adoptive parent, and a child-protection proceeding
is brought by the ministry against a parent, so neither maps onto the matter's
applicant/respondent the way a petitioner does. Reasons are in `sk_binds.py`.

Deliberately left unbound, with reasons in `sk_binds.py`:

- **JUDICIAL CENTRE**, for the reason BC's registry line is. It names the centre
  the proceeding is filed in ("Regina"); the matter has no such field, and
  `court_info` holds the court's *name*. A wrong answer on a court document is
  worse than a blank one.
- **Numbered and plural parties** — Form 15-100A's "CO-PETITIONERS" and
  "PETITIONER (1)/(2)", and Form 15-82's "PETITIONER/RESPONDENT", none of which
  say which party is the matter's client.
- **Form 15-103** (Certificate of Divorce) carries no binds at all: it says
  "(Omit Style of Cause)" and heads with an inline `NO. ____ 2 ____` instead of a
  captioned block, so there is no caption to read.

## Overlay convention

Unchanged from BC and Ontario. `field.x` = box left in points, `field.y` = box
top in points (y down), `width`/`height` = points × 1.5. `FillPdf.savePdf` stamps
`y = pageH − field.y − height/1.5`.

### Seating a box on its rule

`RULE_CLEARANCE` is derived from `RULE_INSET_RATIO` -- where the underscore's
ink sits inside its character box, 0.175 of the font size, measured on Part 15's
font. That leaves the stored rectangle's bottom edge floating above the printed
rule. The viewer draws its own bordered control inside the rectangle, so the
float reads on screen as a control hovering above the line it belongs to, with
the rule showing as a second line beneath it. `RULE_NUDGE` puts it back down.

**The two families need different amounts, because they are set in different
fonts.** The child-protection forms are the King's Printer's own form PDFs; the
adoption forms are cut out of the consolidation, whose font seats the underscore
lower in its character box, so one ratio cannot serve both. A single 1.0pt nudge
seated the child-protection boxes correctly and left every adoption box still
0.64pt clear of its rule -- which is exactly what it looked like in the viewer.

| Family | Nudge | Result, measured over every text box |
| --- | --- | --- |
| `SKCFS_` | 1.0pt | bottom edge 0.21pt into the ink, 317/317 on the line |
| `SKAD_` | 1.95pt | bottom edge 0.29pt into the ink, 388/388 on the line |

Each value lands the edge mid-ink for its own family. Rendered at 26x against
every candidate from 0.75 to 2.0: too little and the rule still shows beneath the
border, too much and it reappears *inside* the box above the border, which is
worse than the float it was meant to fix. The usable window is about half a point
either side.

Text boxes only -- a checkbox is seated on a printed square and the nudge would
walk it off, so 712 text fields move and all 73 option boxes stay put. **Part 15
has the same float and is deliberately left alone**: those 40 templates are
reviewed and shipped, and this is a seating preference, not a defect. Widening it
to them is one more entry in `RULE_NUDGE`.

The nudge is applied *after* seating, not inside it, so the stacking and obstacle
rules still reason about the geometry the page actually prints -- and so
`verify_sk.py`, which re-derives every check from the page, is what decides
whether the result is sound rather than the builder asserting it.

The one measured constant specific to Saskatchewan: the printed rule is the
underscore glyph's own ink, which sits above the bottom of its character box.
Measured on Form 15-47 p1 at 10pt — char box 139.40–154.48, ink 152.23–152.73 —
so the rule is 1.75pt up, or 0.175 of the font size. It is stored as a ratio so a
form set in another size still lands right.

## Known gap

**Form 15-8A p1, item 2(a) and (b)** prints two answer labels followed by bare
whitespace rather than rules. The builder therefore carries two measured manual
one-line fields in `MANUAL_FIELDS`; they extend from just after each label to the
same right margin as the neighbouring long answers.

**Form 15-78 p2, item 6(b)(i) and (ii)** likewise leaves bare whitespace after
the two list prompts. Its measured manual fields begin after `(i)` and after
`(ii) etc.` respectively, and extend to the form's right answer margin.

**Form 15-78 p2, item 8** asks for particulars proving the marriage and leaves
the remainder of the page as bare writing space. A measured manual text area
runs from below the paragraph to the standard footer clearance.

**Fixed 2026-08-18, by hand, not by sweep.** Two more instances of the same
shape — a caption and a tab, no rule, no cell, no rectangle — turned up by
searching the batch for the words that open an answer ("(specify", "as
follows:", bare `:` captions, etc.) and checking whether anything was placed
near each hit:

- **Form 15-78 p6, item 26 "My occupation is:"** had no field; its own twin two
  items down ("The respondent's/petitioner's occupation is: ______") does carry
  a rule, which is what made the omission visible. Built against that twin's
  geometry: starts `EDGE_CLEARANCE` past "is:", runs to the page's own answer
  margin.
- **Form 15-61 p3, both "Telephone Number:" captions** (petitioner's and
  respondent's, in the jurat block) had no field either. Same shape, same fix:
  starts `EDGE_CLEARANCE` past the caption, runs to the margin the "DATED at"
  line above each one uses.

Guide §9.6's remedy is to copy the twin, and a sweep for that shape was written
once and **not** shipped: matching a caption to its twin across 195 pages
produced one false positive and missed the occupation case entirely, and a
mis-tuned auto-placer that adds fields set-wide is a worse outcome than one
missing box. Both fixes above are hand-measured entries in `MANUAL_FIELDS`, not
a general rule — the next instance of this shape still needs a human to read
the page and confirm there's really nowhere printed to answer before adding a
box.

## What the child-protection and adoption review turned up

The 41 new pages were rendered with the overlay drawn and read one at a time.
Five defect classes came out of it, all now fixed and all re-checked by
`verify_sk.py`:

1. **No option boxes at all on the 20 adoption forms** — the U+F07E glyph, above.
2. **Every total on adoption Form K unfillable** — the drawn amount rule, above.
3. **Signature rules filled, in a vocabulary Part 15 never used.** Part 15 closes
   with `(signature of party)`, `A Commissioner for Oaths` or a bare office
   (`Local Registrar`). These two families name the signatory instead, and at more
   length: `Officer`, `Director`, `Clerk of the Court/Local Registrar`, `Minister
   of Community Resources and Employment`, `(witness)`, `(Parents)`, `(Parent or
   person)`. Nineteen signature rules were being filled, Form P alone closing with
   four of them.

   Matching that vocabulary is **not** sufficient, and this is the part worth
   remembering: two of those words also caption an ordinary name blank. Form F
   heads `To:_______` with `(parent)` under it, and adoption Form H heads a block
   of four addressees whose second line is a bare rule captioned `(applicant)`.
   Both are places the filer writes. What separates them is the *rule*, not the
   caption — a signature rule is **bare**, alone on its line, while a name blank
   is preceded on its own line by the words that ask for it. So a caption in this
   vocabulary only condemns a rule with nothing else printed on its line. That
   also keeps it off `(Name and birth date of child)`, which sits below a bare
   rule on Form A and is not a role at all. `applicant` and `guardian` were then
   dropped from the vocabulary outright: an applicant who signs is captioned
   `(Signature of applicant)`, which the existing rule already catches, so the
   word earned nothing and cost Form H a real field.

   Comparison is by the **top** of each line, not its bottom: a rule's line box
   hangs below the caption's own top (Form A sets the rule at y 428.6–443.7 and
   `Officer` at 441.3, a 2.4pt overlap), so a "strictly above" test on the bottom
   edge found no rule at all and kept every one of them.
4. **A blank seated into the checkbox above it.** The stacking pitch only knew
   about other blanks, so on Forms H and O an option printed directly over the
   `Re:____` beneath it left the blank's box 0.7pt inside the checkbox.
5. **A date of birth typed into one box instead of three.** Two runs separated
   by nothing but whitespace were merged into one blank. That rule was written
   for a *fragment* -- the forms set a blank as `_ ______________`, and treating
   the lone underscore as its own field would put a 3pt box in front of every one
   of them -- but it also glued together runs that are separately captioned.
   Saskatchewan sets a date of birth as three tab-separated rules with `(month)
   (day) (year)` printed underneath, and adoption Form L prints two of those, so
   a filer got a single 315pt box where the form asks for three entries. The same
   shape is on the birth line of Forms C-1 to C-6 and the Orders of Adoption. The
   merge is now only for a run too narrow to stand as a blank on its own; if both
   sides could, they stay two. 14 forms gained boxes, and no Part 15 template
   moved -- its one merged pair is Form 15-48B's witness/signature line, which is
   dropped as a signature rule whether it is read as one rule or two.

   Where the government prints *one* rule under two captions -- Form C-6 sets
   `(month) (day)` under a single 138pt rule -- it stays one box. Splitting that
   would mean inventing a boundary the form does not print.
6. **Date slots dropped for being narrow.** The three Orders of Adoption print
   `The_ __ day of______, 20_ _`, whose day slot measures 15.2pt and year slot
   10.9pt, so the order's own date could not be typed. See `MIN_RUN_WIDTH`.

### Still open

- **Adoption sources are current to 2017.** The consolidation still prints "Court
  of Queen=s Bench" (with the `=` the King's Printer's own font substitution
  produces for an apostrophe) where the 2024 child-protection consolidation prints
  "King's Bench". That is the state of the enacted form and is shipped as
  published, not silently corrected.
- **`expectedPages` for the adoption forms is the count our own cut produces**,
  not one the publications site advertises, so it is a regression guard rather
  than an independent check. A re-issued consolidation that reflows will change
  the cut length and stop the fetcher, which is the intent.
- The two families carry **no prefill binds**; see above for why that is a
  decision rather than an omission.

## Batch 3 -- practice directives, ISO, interpersonal violence, appeal (2026-08-21)

`sk_sources_pd.py`. **45 forms, 149 pages, 2,346 fields, 24 binds, zero
findings.** The catalogue is 121 Saskatchewan templates.

| Category | Forms | Pages | Fields | Binds |
| --- | --- | --- | --- | --- |
| Practice Directive - Pre-Trial | 2 | 8 | 56 | 2 |
| Practice Directive - Affidavit Objections | 2 | 2 | 17 | 0 |
| Practice Directive - Family Services | 4 | 6 | 64 | 0 |
| Practice Directive - Summary Hearings | 2 | 2 | 10 | 0 |
| Practice Directive - Chambers | 1 | 4 | 94 | 1 |
| Practice Directive - Case Conferences | 5 | 20 | 182 | 1 |
| Practice Directive - FOAEAA | 6 | 16 | 166 | 12 |
| Interjurisdictional Support | 17 | 62 | 1,544 | 8 |
| Interpersonal Violence | 2 | 9 | 137 | 0 |
| Relocation - Divorce Act (federal) | 3 | 18 | 61 | 0 |
| Court of Appeal | 1 | 2 | 15 | 0 |

### Cutting a form out of its directive

Directives 3 to 7 publish their forms only as appendices inside the directive,
so `fetch_sk.obtain` grew a second cut path beside the adoption one. They are
not the same cut and the difference is the point: an adoption form is found by
its **own enacting heading**, which is what makes a repagination safe, but a
practice directive has no enacting heading and titles its appendices
inconsistently ("FORM A", "APPENDIX B - FORM FAM-PD #7-1", or nothing at all --
Directive 4's four forms open straight onto "INITIAL SUMMARY"). So the window is
page numbers, and an out-of-range window raises rather than clipping: a reissued
directive that grew a page would otherwise ship a short form instead of stopping
the fetch. All 14 cuts produce exactly the window recorded for them.

The identity check for a cut form reads the **whole directive**, not the window.
Directive 6 is why: its memo is titled on page 1 and its form starts on page 2
under a bare "APPENDIX A", so nothing in the window names it.

**Deliberately not cut:** Directive 5's Appendix A (explanatory material for a
self-represented litigant) and Directive 7's Appendix A (a guide, which the
catalogue excludes in every province).

**The French trap.** Every directive is bilingual, and the Court of Appeal serves
its *Formule* 1a from a **later** directory than its Form 1a -- so
`2023/07/CA_Civ_Form1a.pdf` is French and `2022/09/Form-1a-Notice-of-Appeal.pdf`
is the English form. Taking the newer URL gets the wrong language.

### The widget path

**20 of the 45 carry the government's own field rectangles** -- all 17 ISO forms
and the three federal notices, up to 313 widgets on ISO Form I -- so
"all 76 sources are static PDFs, no widgets, no XFA" stops being true with this
batch. `build_sk_forms.is_fillable` routes them to `bc_pipeline.extract`, the
same code Manitoba's copy of the same national set takes and the same code BC's
Provincial forms take. The background is flattened rather than copied, for the
reason `mb-forms` §10 gives, and `verify_sk.WIDGET_CHECKS` asks a widget
template only the questions that still apply to it.

### What the batch taught the detectors

Every fix was checked against the 76 already-shipped templates, whose geometry
is **byte-identical** before and after -- asserted directly rather than assumed.

- **A rule is a rule whether Word strokes it or fills it.** Part 15 and the two
  regulation families draw their grids as stroked lines; the practice directives
  are a different Word export and draw every border as a filled rectangle a
  half-point thick -- 128 of them on Directive 4's Form A and not one stroked
  line -- so `grid_cells` returned nothing and the two child tables on the most
  important form in that family had no fields at all.
- **Writing lines can be drawn too** (`printed_rule_blanks`), which is
  `mb-forms`' central primitive arriving in Saskatchewan. Directive 8's Form D
  page 4 sets all six of its answer lines that way; the page produced no boxes,
  fell through to `template_prompt_fields` and got one full-page area per label.
- **Two different headings in one column is two stacked tables**, not the
  government's own reference data. Directive 4's Form A puts two four-column
  tables at the same column positions, so signal 2 saw two different strings per
  column and read all sixteen writing cells as guidance. A genuinely repeated
  header -- Form 15-47's checklist prints one per block -- is the *same* string
  and still counts as the evidence that keeps the schedule columns reference.
- **A page can be a Word template rather than a ruled form**
  (`template_prompt_fields`). Directive 4's Forms C and D print one drawn object
  on the whole sheet and set every answer as an italic parenthetical the filer
  replaces. The box goes in the clear space *after* the prompt, stopping at
  whatever is printed next on the row, so the guidance stays readable beside it.
  Guarded by "the page produced nothing else", which is the condition the shape
  describes and which also keeps it away from all 76 shipped templates.
- **A band is cut by whatever is *in* it, not by whatever *starts* below it** --
  the same lesson `mb-forms` README §8 records. Directive 4's Form A sets
  "SOCIAL WORKER:" 0.4pt above the bottom of the line before it, so the band
  opened straight over it.

## Batch 3 -- the record of how it was sourced

`sk_sources_pd.py` records what Part 15 and the two regulations do not carry:
the forms the Court of King's Bench prescribes by **family practice directive**,
the interjurisdictional support set, the emergency intervention forms, the Court
of Appeal's civil notice of appeal, and the federal relocation notices.
**45 rows, 149 pages.** `SHIPPED_CATEGORIES` is empty, so the fetcher verifies
all 45 on every pass and nothing downstream sees them. The catalogue is unchanged
at 76.

| Family | Forms | Pages | Sourced |
| --- | --- | --- | --- |
| Family Practice Directive 1 | 2 | 8 | standalone PDF |
| Family Practice Directives 3-7 | 14 | 30 | **cut from the directive** |
| Family Practice Directive 8 | 6 | 16 | standalone PDF |
| Interjurisdictional support (ISO) | 17 | 62 | King's Printer, **AcroForm** |
| Victims of Interpersonal Violence | 2 | 9 | King's Printer, PDF |
| Divorce Act relocation (federal) | 3 | 18 | Justice Canada, **AcroForm** |
| Court of Appeal, civil Form 1a | 1 | 2 | sasklawcourts.ca, PDF |

Gate A/B is green: **121 entries, 0 flagged**, and all 14 directive cuts produce
exactly the window recorded for them.

### Cutting a form out of its directive

Directives 3 to 7 publish their forms only as appendices inside the directive, so
`fetch_sk.obtain` grew a second cut path beside the adoption one. They are not
the same cut and the difference is the point: an adoption form is found by its
**own enacting heading**, which is what makes a repagination safe, but a practice
directive has no enacting heading and titles its appendices inconsistently
("FORM A", "APPENDIX B - FORM FAM-PD #7-1", or nothing at all -- Directive 4's
four forms open straight onto "INITIAL SUMMARY"). So the window is page numbers,
and an out-of-range window raises rather than clipping: a reissued directive that
grew a page would otherwise ship a short form instead of stopping the fetch.

The identity check for a cut form therefore reads the **whole directive**, not
the window. Directive 6 is why: its memo is titled on page 1 and its form starts
on page 2 under a bare "APPENDIX A", so nothing in the window names it.

**Deliberately not cut:** Directive 5's Appendix A (explanatory material for a
self-represented litigant) and Directive 7's Appendix A (a guide, which the
catalogue excludes in every province). Both are recorded in `sk_sources_pd` so
the decision is not re-derived.

**The French trap.** Every directive is bilingual, and the Court of Appeal serves
its *Formule* 1a from a **later** directory than its Form 1a -- so
`2023/07/CA_Civ_Form1a.pdf` is French and `2022/09/Form-1a-Notice-of-Appeal.pdf`
is the English form. Taking the newer URL gets the wrong language.

### Why none of it is built yet

The 22 practice-directive forms and the 3 statics are within the existing
builder's vocabulary and need reading, not new detectors. The **17 ISO forms are
not**: they carry 104-313 government-defined widgets each, and `build_sk_forms.py`
reads every box off a printed anchor -- the README's "all 76 sources are static
PDFs, no widgets, no XFA" stops being true with this batch. Detecting anchors
where the form already declares its rectangles is strictly worse, so this family
should reuse Ontario's or BC's widget extraction rather than grow a third copy.
Manitoba's copy of the same national set has the same problem.

### The same national forms, twice

Manitoba publishes its own copy of the ISO set. The two are **not**
byte-identical -- different layout, different widget names (`res_first_name` here,
`First Name` there) -- and their classifications differ: all 17 are AcroForm
here, but Manitoba's Forms B, F and H are XFA. Their titles differ too; the
King's Printer names Form L "Respondent's Answer to Application" where Manitoba's
copy prints "Respondent's Response to Application". Each province records its own
source, which is also what keeps them independently re-fetchable.

The federal relocation forms are the different case -- one federal document, no
provincial copy -- and `FormTemplate` carries one province per row, so they are
recorded once per province with province-distinct doc IDs (`SKDIV_1` /
`MBDIV_1`). One shared row would reach only one province's picker.

## What reading the last 69 pages found

The 25 practice-directive, interpersonal-violence and Court of Appeal templates
were read page by page against the government's own page and against a filled
render. **Every automated gate was green before this review started and stayed
green through all six defects below** -- which is the point of doing it, and the
reason `review/ledger.json` exists. Each defect is a class, not a one-off, and
each is recorded here in the form the next batch can look for.

- **An option glyph can be an ordinary letter.** Form A of the Interpersonal
  Violence set prints its seven options as `G` in WPTypographicSymbols, where
  `G` is the open square. The codepoint is U+0047, so `BOX_GLYPHS` cannot hold
  it without turning every `G` in the body text into a control, and all 28 marks
  across eight pages shipped with nothing to tick. `FONT_BOX_GLYPHS` keys on the
  font instead. Ask what makes a vocabulary distinctive before assuming it is
  the codepoint -- Manitoba's `[ ]` needed a width cut for the same reason
  (guide 9.13).

- **The ink probe can union two marks.** Guide 2's "one mark is one candidate"
  is usually about the search window; it applies just as much to the pixels.
  Directive 8 stacks options 14.6pt apart inside a 25.3pt character cell, so
  each glyph's box contains most of its neighbour's square: one option came back
  8.0 x 16.6 covering both squares, and eleven more marks came back 9.x x 16.5.
  Masking the neighbouring characters -- Manitoba's fix -- is wrong when the
  cells overlap by more than half, because the mask eats the ink being measured.
  Contiguous runs of ink rows separate them cleanly (2.4 / **7.75** / 1.9 inside
  one cell); keep the square run.

- **A bare office is not only a signature caption.** `SK_ROLE_CAPTION` matched
  "REGISTRAR" on the Court of Appeal's notice, where it is the first line of the
  court's mailing address, and it claimed the rule belonging to a *different*
  addressee -- deleting the respondent's service line. `check_unfilled_blanks`
  then excused the loss by re-running the same detector, which is guide 9.14b's
  blind spot arriving for the second time in this pipeline. A signature caption
  sits under a bare rule; an addressee sits under somebody else's answer.
  `SK_OFFICE_CAPTION` had that gate from the start and `SK_ROLE_CAPTION` did not.

- **A rule is a rule whether the province types it or draws it.** The gate above
  was text-only when first written and would have put a box on Directive 8's
  "Local Registrar" rules, which are drawn rather than typed. Both readings of a
  rule have to be checked wherever one is.

- **A signing rule the government forgot to caption.** Guide 5 finds a signature
  rule by its caption, and Directive 3's two forms print none, so both took a
  field on the party's own signature line. The rest of the family captions the
  identical position. Where a caption is missing, the structure still identifies
  it: a bare rule, directly under the line the form executes itself on, set in
  the right-hand column. Two fields across 121 templates.

- **One writing line, two anchors.** Directive 7 draws its contact-block rules
  from x 288 *and* types underscores over the last one from x 306. The typed run
  won and the box came out 18pt short, out of line with the five above it. The
  right edge is the discriminator: a table border also runs under the inline
  blanks in its cells (Form 15-47 p9, p13 overhang by 180-285pt), but this run's
  own rule ends where the run ends. One line in 121 templates.

**And two shapes that looked like defects and were not** -- both settled by
measuring rather than by eye, which is the other half of this work:

- Practice Directive 1's Parts 5 and 6 look like one-line boxes in a large
  blank. They are 17.6pt in a 21.6pt band and 24.1pt in a 28.1pt band: they fill
  what the page gives them. The Court of Appeal's items 2-6 look like narrative
  answers with no writing area, and every gap on that sheet is the document's
  uniform 18pt paragraph leading, so there is no band to anchor to.
- Form A of the Interpersonal Violence set carries its order four times, and
  page 1 has one writing line fewer than its three twins -- exactly guide 8's
  "diff the copies" signal. The government's page 1 genuinely prints one rule
  fewer. Checking the source beat repairing against the "good" copy.

`MANUAL_DROPS` is new and holds one entry, for a field parked in a table's
column heading (guide 9.2) on a table whose rows are all the same height, so the
height signal cannot fire. The structural signal that is left was measured
against all 121 templates and would delete 50 legitimate fields on forms already
reviewed and shipped, so the page that was actually read is recorded instead of
a rule that is wrong 50 times.

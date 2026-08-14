# Saskatchewan forms pipeline

Regenerates the Saskatchewan templates in `form-template-export/` from the
government sources. Everything here is a build tool — the repo ships only the
produced `SKKB_*.pdf/.json` plus `catalog.json`. Staging lives in the gitignored
`form-template-export/_incoming_sk/`.

Requires Python 3 with PyMuPDF (`fitz`) and Node. **No Chrome and no Adobe**:
unlike BC, nothing here has to be flattened.

## Scope

The 40 family-law forms of **Part 15 of The King's Bench Rules**, published by
the Office of the King's Printer. Part 16 (probate and estates) and the civil
parts are deliberately out of scope, matching the Ontario and BC catalogues.

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

**All 40 sources are static PDFs — no widgets, no XFA.** There is no government
rectangle to copy, so every box is read off a printed anchor. The whole 40-form
set uses exactly three vocabularies and no others:

| Anchor | Count | Becomes |
| --- | --- | --- |
| A run of underscores | 1,590 | a text field seated on the run's own measured ink |
| A 9×9 stroked square | 457 | a checkbox (there is no second size, and no glyph variant) |
| A ruled grid | — | a field per empty cell |

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

Current state: **40 forms, 3,087 fields, zero findings**, and the build is
idempotent (two runs produce byte-identical maps).

## 4. Catalog

```
python3 merge_sk_catalog.py
cd ../.. && npm run forms:validate-export
```

Rewrites the SK block of `catalog.json` (sortOrder from 301, clear of Ontario's
1–135 and BC's 101–288) and regenerates `audit.json`.

## 5. Prefill binds

```
python3 rebind_sk_forms.py [--check]
```

Writes back **only** the `bind` key, asserting every other key is byte-identical
first, so it is safe on templates whose geometry is already approved; a second run
is a no-op. Run it after any rebuild, which drops binds.

39 of the 40 forms open with the same heading, and the caption is printed to the
**left** of its blank, which is the only place it is read from. 105 fields bind:
the court file number on 39 forms, the respondent on 37, the applicant on 29.

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

**Form 15-78 p6, item 26 "My occupation is:"** has no field. The line ends with a
caption and a tab, and the government printed no rule, no cell and no rectangle
after it — so every detector here correctly finds nothing. Its own twin two items
down ("The respondent's/petitioner's occupation is: ______") does carry a rule,
which is what makes the omission visible.

Guide §9.6's remedy is to copy the twin, and a sweep for that shape was written
and then **not** shipped: matching a caption to its twin across 195 pages produced
one false positive and missed this case, and a mis-tuned auto-placer that adds
fields set-wide is a worse outcome than one missing box. Fix it by hand against
the twin's geometry, or tune the sweep and review a render before applying it
broadly (guide "change discipline").

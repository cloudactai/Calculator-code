# Field placement guide (for Claude, next form batch)

This is the accumulated ruleset for placing `staticFields` (text fields, text
areas, checkboxes) on a form template — text and checkbox alike — learned from
building the 43 BC forms, then from reading the shipped Ontario ones in the app
(§9). Read this before touching field geometry on a new form, BC or otherwise.
The build scripts are in `auth-server/tools/bc-forms/` and
`auth-server/tools/on-forms/`; this file is the "why" and the "what to check,"
not the code itself.

**Golden rule: never guess.** Every rule below reads the government's own page
— the printed shading, the printed glyph, the printed `$`, the printed line —
and places the field against that. If a form doesn't fit an existing rule,
read the page and find the real anchor before inventing a number.

**Change discipline: do not overwrite this file, or re-run a placement rule
across already-shipped forms, until the user has looked at a render and said
it's better.** Every rule in here was arrived at by shipping something, being
shown a screenshot of what was wrong, and fixing that specific case — several
times the "fix" introduced a new regression the user then had to catch. Ship
one render, wait for confirmation, then apply broadly. Don't apply a new rule
retroactively to forms the user hasn't re-reviewed.

---

## 1. Where field boxes come from

- **AcroForm sources** (has real widgets): read the widget's own `/Rect`. Never
  estimate a fillable-form box — the widget rectangle is ground truth.
- **XFA sources** (Adobe LiveCycle, no native widgets): flatten headlessly via
  pdf.js `enableXfa` + Chrome print (see `xfa/render.html`,
  `xfa/print_xfa.mjs`), then read field boxes off the *rendered DOM*, not off
  a layout guess. Coordinates come back in PDF points.
- **No fields at all** (plain text/no interactive form, e.g. some BC Laws
  consolidations): last resort only. Detect blanks from printed dotted leaders
  or ruled lines (`build_bc_laws.py`), and expect to hand-tune more than usual.
- **Never rebuild a form that already has prefill binds, calculations, or
  linked fields you didn't create** (this hit Ontario). Apply geometry fixes
  *in place* to the existing JSON; preserve every non-geometry key
  (`bind`, `calculationType`, `calculationValue`, `linkedToId`, `isDerived`,
  `isCalculated`, `sourceFields`, `value`, etc.) byte-for-byte. Diff the
  before/after on every non-geometry key and confirm zero changes before
  shipping.

## 2. Checkboxes / radio controls

**Shape must come from the printed outline, not the field type.** BC
Provincial prints its mutually-exclusive options as `❑` squares even though
they're backed by AcroForm radio buttons — trusting "radio → circle" put a
circle in the middle of a row of squares. Classify by what's drawn:

- Rounded square: ~4 corner curves *and* ~4 straight segments in the vector
  art under the box.
- True circle: curves with (almost) no straight segments (allow ≤2, for stray
  artifacts).
- Printed glyph (`❑ ☐ □ ▢`): square, full stop — no vector analysis needed.

**Find the glyph at character level, not word level.** BC sets the caption hard
against the tick, so the text extractor hands back `❑Yes` and `❑No` as single
tokens. Testing a whole token for glyph-ness therefore misses the mark on
exactly the forms that print one: 125 controls on BCPC_3, BCPC_17 and BCPC_22
came back with *no mark found at all*, kept their raw 14.4pt XFA box, and read
as an oversized rectangle sitting over the option text. Read `rawdict` chars.

**One mark is one candidate. Never union the marks in range.**

- One glyph is one candidate. A `❑` is a single character, so a second one in
  the search area belongs to the *next option*. BCPC_22 p2 stacks its options
  14pt apart, within reach, and unioning the pair gave a 27pt candidate that
  failed the squareness test and fell back to a square centred **in the gap
  between the two boxes**. Same fault on BCPC_3 p9/p21, BCPC_17 p6, F43 p1.
- Vector art *clusters* per mark. One mark is often drawn as several paths — a
  white disc with a grey ring over it — and those must merge; but F43's two
  signature circles are 14pt apart and merging *those* put both controls
  midway between them. Cluster by intersection, then pick the best cluster.

**Position/size must come from the printed mark, checked in this order:**

1. The printed glyph text (`❑` etc.), if present — **glyph wins over vector
   art**. BC often shades a grey panel *behind* the glyph that is roughly the
   same size as the glyph itself; if you check vector shapes first, you union
   the shading with the glyph and the control ends up too tall, offset low,
   or both. Glyph first, always.
2. Vector art (circle/rounded-square outline), skipping filled grey panels
   (a "shading" rect has a `fill` in the light-grey range and no `color`/
   stroke — exclude it explicitly).
3. Refine the chosen candidate to actual rendered ink (render at high zoom,
   measure the dark pixel bounding box) — a `❑` glyph's *font* box is much
   taller than the visible glyph (e.g. 9×14 for a 9×9 square).
4. **Ink may shrink a candidate freely but may only grow it evenly, and never
   onto a printed letter.** A stroke sits astride its path rectangle and a
   glyph outline overflows its advance width; both overshoot the same on
   either side. Bleed from a neighbour is one-sided — where BC starts the
   caption at the very coordinate the mark ends (F32, F46), the ink measure's
   own padding swallowed the first letter's stem and the control came out
   ~1.2pt wide of the circle, sitting on the letter. 414 of 838 were affected.
   Matching overshoots are not proof either: F32 reads
   `Signature of(circle)application`, with a letter hard against the mark on
   *both* sides, so the two bleeds cancelled and the box came out 2pt fatter
   than the identical one a line below. Cap growth at the smaller of the two
   overshoots **and** refuse to grow onto a letter the candidate didn't touch.
5. If the ink measurement comes back non-square (grabbed a neighbouring line),
   reject it and fall back to a square centered on the original candidate —
   these marks are always square or circular, never a 4:1 rectangle.
6. Accept a match at any vertical offset within the field's own allocated
   box, however far down — some two-line options have the mark centered
   ~14pt below the top of the box XFA/AcroForm handed you. Don't cap the
   search distance; cap it to "is the match still inside this field's box."

**Two controls can genuinely want the same mark.** XFA sometimes hands back
identical boxes for both options — BCPC_3 p9 stacks "I am the child's guardian"
and "I am applying to be appointed" on the same geometry, F43 does it with its
two signature circles — and a per-field detector cannot see the clash, so one
option ends up unclickable. Deal the surrounding marks out in reading order,
skipping any a neighbour already holds. Two dead ends, both tried and reverted:

- Patching up per field *reached wider* and robbed the option above instead of
  taking the free mark below it.
- Routing the whole page through the new assignment disturbed 138 already
  correct Supreme controls, because the refinement saw a different search
  window than `printed_mark` does. **Touch only controls that actually
  collide.**

**Check on every build:** re-derive shape and position from the page and diff
against what you stored. Zero mismatches is the bar — 576/838 and later
0/838 were both real measurements on this project, not estimates. Add a
duplicate-position scan: controls sharing an x/y went 6 → 0 once the above
landed, and any above zero means an option a lawyer cannot tick.

## 3. Text fields / text areas

**Fit the printed shaded box exactly, when there is one.** BC draws light-grey
rectangles to show the writing area. Read `shaded_boxes()` — grey fill, not
white, not a rule line — and size/position the field to match it, not to
whatever height XFA/AcroForm handed you (which is often just one text line,
even inside a much taller cell).

- When a field's box overlaps a shaded region, pick the **shaded row it
  actually sits on** (highest-overlap match), not the union of every row it
  grazes — grey rows on BC forms butt directly against each other, so
  unioning two rows silently doubles a field's height and shifts it.
- A field claims a **whole ruled block** (multiple stacked shaded rows, e.g.
  a 4-line "describe the expenses" box) only when: the rows share its left
  *and* right edges, and no other field already claims one of those rows.
  That second condition is what keeps genuinely separate stacked rows
  (Address / City / Email, one row each) from merging into one giant box.
- A shaded shape that is bigger than the field in **both** width and height
  is a background panel, not this field's cell — ignore it. (A real cell
  matches the field in at least one dimension.)
- **Collapse overlapping shaded rects into bands before walking a block.** BC
  paints a row as an outer shaded rectangle with a second, slightly inset one
  on top of it. Both come back from `shaded_boxes()`, and interleaved by y
  they read as rows overlapping each other by a dozen points — so the walk
  down the block hits a negative gap between a row and the row *nested inside
  it* and stops at the first line. BCPC_16 p5's three-line block covered one
  and a half lines because of this.

**XFA's "paragraph marker" sliver.** XFA sometimes emits a narrow (~14pt)
column to the left of a free-text block as its own separate field — this
renders as a tiny stray box sitting beside the real writing area:

- If there's a wide field immediately to the right (within ~12pt gap): merge
  them into one field spanning both, drop the duplicate.
- If the sliver stands alone: grow it rightward to the actual writing area —
  stop at the next printed word or the next field, whichever is closer, or
  the page's right margin.
- **The two branches need different width limits.** A narrow cell butted
  against a wide block on the same line is a paragraph marker whatever its
  exact width, so merge up to ~32pt — F51.1's is 27pt and a flat 22 left it
  stranded beside the order body. A cell *standing alone* might be a real
  small field, so keep growing at the tighter ~22pt: F31's "minutes" box is
  24.69pt and must not be stretched across the page. Require the merge
  partner to be a genuine block (>100pt), not just any neighbour.
- **Tolerance bug to remember:** matching "the sliver's right edge equals the
  neighbor's left edge" with `>= 0` silently matches nothing, because
  floating-point subtraction of two things that should be equal lands at
  `-1e-13`. Use a small negative tolerance (e.g. `-0.5`), not `>= 0`.

**Printed content inside the field's own box** (this is not the same as
missing a whole box — it's a field whose box is right but which covers text):

- The left edge must clear anything printed in the box's left ~60%: a `$`
  sign, or a caption BC has shaded behind (e.g. "Address:"). Move the left
  edge to just past that printed content, don't just leave it overlapping.
- A field whose first line starts on a printed placeholder/hint (grey italic
  instruction text that Acrobat would normally hide once you type, but which
  survives on a flattened/rasterized background) must be nudged below that
  hint line, not started on top of it.

## 4. Amount ($) fields specifically

- Identify an amount field from the page: a `$` glyph sitting on the field's
  own line, either inside the field box or immediately to its left.
- The field starts just after the `$` glyph ends (small fixed gap, ~1.5pt) —
  never on top of it, never far detached from it either.
- **Height comes from the `$` glyph's own height**, not from the row/cell it
  sits in — a form can have several different row heights (single-line vs.
  multi-line rows) but the `$` glyph is a consistent size throughout, so
  sizing to the glyph keeps every amount box in a column visually
  consistent instead of "tall in some rows, short in others."
- Clamp to the shaded cell when the cell is *shorter* than the natural
  glyph-based height (don't let the box overflow a tight cell), but don't
  force the box to *fill* a tall cell just because the cell is tall — a
  one-line amount in a 3-line cell should stay one line, sitting on the `$`.
- When there are multiple `$` glyphs in a tall cell (a multi-row cell where
  BC repeats the `$` per sub-row), match each field to the `$` **inside that
  field's own shaded sub-cell**, not just the nearest `$` in raw pixel
  distance — a naive nearest-match can pair a field with the `$` belonging to
  the cell above or below it, especially when BC prints a cell's `$` near
  its *bottom* edge (within a point of the next cell starting).
- **A printed `$0` is a stale default, not the government's wording.** XFA's
  default for a computed row is zero, and the flatten prints it, so
  `overlay_fields` correctly declines to put a box over what looks like a
  printed default — leaving the most consequential figures on a financial
  statement permanently zero and untypeable (F8 pages 4, 5, 10). Redact the
  digit, keep the `$`, and give the row the same box the rest of its column
  has. Take the box's left edge from **the column**, not from its own `$`:
  F8 p10 prints the `$` of a computed row a point left of the `$` above it,
  and keying off the glyph steps the column out of line.

## 5. Signature lines — never place a box

- Detect the printed "Signature" caption (case-insensitive, word-boundary),
  excluding "Date of signature" (that one keeps its box).
- Any candidate field box whose **height is short** (a single signature-line
  height, not a paragraph box) and sits near a detected signature caption
  gets dropped entirely — no field, no box, nothing rendered there.
- Don't rely on the field's *name* to decide this ("name of signature 1" is
  a legitimate fillable field for the signer's printed name, not the
  signature line itself — name-matching on "signature" is too broad and
  will delete real fields).
- **Known false positive, don't "fix" it blindly.** The rule drops a short box
  printed 0–24pt above a caption, and a caption *enclosed by a drawn border*
  labels the box it sits inside rather than anything above it. F38 p5's date
  box trips this because "signature of deponent" sits 20pt below it inside the
  rectangle `[54.5, 471.5, 269.5, 508.5]`. Loosening the rule changes what
  every form drops at build time, so leave it and record the exception.

## 6. Blank/generated content that XFA doesn't hand you

Some XFA forms have entire sections that only get populated by Adobe's
"generate on preview" scripting, and produce **zero fields and zero useful
content** on the pages we can flatten (a header and nothing else). This is
different from a missing field — there's genuinely no template content there
to place a box against. Flag these explicitly rather than silently shipping
a blank page:

- Report page-by-page field counts as part of the build; a content page
  (has body text, not just a header/footer) with 0 fields is worth a second
  look — it may need a manually-added writing area, not an automatic fix.

**Placing one by hand: anchor every edge to something printed.** The pages that
needed this were F32 Parts 1 and 4–6, F51/F52's order body and blank
continuation page, and F3 p3 / F5 p2's "for the following reasons:".

- A `[if more space is required — attach page…]` note is an anchor: the writing
  area is the gap directly above it, closed at the top by the last line of the
  instruction.
- A caption ending in `:` with an empty band under it is an anchor: run the box
  down to whatever prints next — the next line of type, or the rule that closes
  the section.
- Take the **column from a box the form already has** of the same kind (F32's
  Parts 2 and 3 already carried one, so Parts 1 and 4–6 copy it). Only fall
  back to margins when there is no sibling.
- The one thing that cannot be read off the page is where a *blank continuation
  page* opens. Use the margin its heading is set to, and say so.
- **Scan for these rather than waiting to be told**: captions ending in `:`
  followed by a big empty band with no field. Nine candidates across 43 forms,
  of which five were false positives (the field sits *beside* the caption, not
  under it) and one was a signature block. Check each before adding.
- Make the tool **re-runnable**: skip a band already covered by a box. That
  guard is also what correctly ruled out F51.1, which already had its body.

**Sanity-check by structure, not just by eye.** F38 carries the same jurat
three times; pages 7 and 8 had five fields each and page 5 had four. That count
is what proved the missing "on ____" date box, and it beats guessing from the
look of a page. Where a form repeats a block, diff the copies.

## 6b. Repairing the printed page itself

Sometimes the overlay is faithful and the *background* is wrong, because pdf.js
laid the XFA out without Adobe's engine. Two shapes of it were fixed here: F38
p8's place line collapsed to a 6pt slot where p7 has 176pt, and F8 p5 set one
line of a two-line label a full leading adrift so it printed across its
neighbour. Both were repaired against the copy that came out right.

- **Redaction takes every character its rectangle touches.** A line overlapping
  its neighbour touches it by definition, so clearing just the overlap leaves
  the rest of the neighbour behind, and re-laying it then prints it twice.
  Clear each affected span *whole* and put them all back.
- **Pick the font by measurement, not by name.** F8 p5 carries two subsets of
  Liberation Sans that both report as `LiberationSans`, and a subset only holds
  the glyphs its own text used. Choosing by name re-set a row in the wrong one
  and it came out in a visibly different typeface. Choose the embedded face
  whose `text_length` reproduces the span's own printed width, and refuse to
  write if none does — that guard caught a bad write here.
- Some flattened pages use a **Type 3 font** that cannot be typeset with. At
  small sizes a base font carries a punctuation mark (F38's comma); for a whole
  sentence it would not, so check.
- Take the correction from the page's own measurements: F8's leading came from
  two correctly-set labels on the same page (both 12pt), not from a guess.

## 6c. Rasterised backgrounds

Roughly half the Ontario templates are scanned images — no text layer, no
vector art — so every detector in §2–§5 finds nothing and silently does
nothing. **Measure printed ink instead**: render the band and find the rows
with dark pixels. Form 8 p5's missing writing area was placed that way — ink
stops at y 127.2 and resumes at 164.5, a clear 37.3pt — with the column copied
from the two detail boxes the page already puts under a tick.

## 7. Testing checklist for every new form batch

Run these as **measurements**, not eyeballing, then also actually look at
rendered pages — measurements catch systematic bugs, renders catch the ones
your measurement didn't think to check:

1. **Shape match**: for every checkbox, re-derive shape from the printed
   outline and diff against stored `shape`. Must be 0 mismatches.
2. **Mark alignment**: for every checkbox, re-derive position from the
   printed mark and diff against stored x/y. Report median + 95th
   percentile offset — should be ~0.00pt median, small 95th percentile.
3. **Sliver scan**: flag any non-checkbox field narrower than ~22pt — each
   one should have a specific justification (real small table cell) or be
   merged/grown.
4. **Shaded-box fit**: for every field with a matching shaded row, diff
   stored box against the shaded row's box. Should match closely, except
   where the field legitimately spans multiple rows.
5. **`$` field audit**: for every amount field, confirm (a) it doesn't cover
   the `$` glyph, (b) it's on the same line/sub-cell as its own `$`, (c) its
   height matches the glyph-derived height for that page/column, not some
   other row's height.
6. **Signature audit**: confirm no box sits on a detected "Signature" line;
   confirm "Date of signature" and printed-name fields still have boxes.
   Known exception in §5 — check a flag before acting on it.
7. **Duplicate and overlap scan**: no two controls may share an x/y (one of
   them is unclickable), no two field boxes may overlap by more than a
   quarter, no field may sit outside its page, and no id may be used twice.
   All four have been real on this project — 6 shared positions across BC,
   an exact duplicate record on Form 17E, four fields parked at x≈9832 on
   Form 13A, and the same id used by two records.
8. **Non-geometry diff** (only relevant when editing existing maps, e.g.
   Ontario): every `bind`, `calculationType`, `linkedToId`, etc. must be
   byte-identical before/after. Any change here is a bug. Assert it in the
   tool rather than checking by eye — and note that a tool guarding this
   *cannot* be the one that adds or removes a field, since the field count
   changing is exactly what it refuses.
9. **Idempotence**: run the tool twice. The second run must report no change.
   Two passes that each correct the other oscillate happily and look fine on
   a single run — count start-to-end, not per step.
10. **Actual visual check** — render representative pages (especially ones
   flagged by 1-6, plus a random sample of "normal" pages) and look for:
   description/text boxes that are one line tall when the printed cell is
   clearly multi-line; boxes overlapping printed labels/words; checkboxes
   that read as ovals/rectangles instead of matching the printed shape;
   stray extra boxes; missing boxes on pages that have visible blank
   lines/cells.
11. Only after the user confirms a render looks right: apply the same rule to
    the rest of the batch, and only then update this guide / commit the rule
    as "settled."

**A render of the overlay is not a render of the app.** These QA renders draw
the stored box; the viewer draws its own control inside it. A conclusion that
depends on how the control *looks* has to be checked in the app, not here — a
render was used once in this project to argue a control was too fat, and the
control was the right size all along.

## 8. Known-fragile spots to double check on every new form

These specific patterns have broken more than once — check them explicitly,
don't assume a general rule already covers them:

- A checkbox/radio row where the printed shape doesn't match the underlying
  widget type (radio-shaped-as-square).
- Multi-row tables where a wide field could accidentally union two shaded
  rows (height ends up ~2x expected).
- Two-line checkbox options where the printed mark sits well below the top
  of the field's nominal box.
- Amount columns inside a multi-row cell, where more than one `$` sign
  appears close together vertically.
- Pages with a caption block that BC shades solid grey behind (looks like a
  field but is a label — the label text itself must be preserved, only the
  writing space to its right/below should get a field).
- Any page whose only content is a header/footer with 0 fields — check
  whether that's actually correct (a genuinely blank/instructions-only page)
  or a sign that XFA-generated content didn't survive the flatten.
- Options stacked close together (~14pt) where a search area reaches the next
  option's mark — the union of two marks lands the control in the gap between
  them, which looks like a small offset rather than a wrong mark.
- A narrow box beside an option is **not** automatically a tick. F38 p7 has two
  14.4pt boxes that look exactly like tick squares; the government's XFA shows
  they sit in a static `<draw>` and are `[#]` paragraph-number slots. When in
  doubt, read the `<template>` stream out of the source PDF and look at whether
  the thing is a `<field>` or a `<draw>`. That check has overturned a
  confident-looking reading of the geometry more than once.
- A form that carries the same block more than once (F38's three jurats, F3 vs
  F5 as claim and counterclaim) — a fault in one copy is usually in the others,
  and the good copy is the measurement to repair against. F5 p2 had the same
  missing writing area as F3 p3 and was only found by looking.
- Two `type` values for the same kind of table cell. XFA tags some cells
  `TextField` and their neighbours `TextArea`, and the app draws them
  differently, so a table row ends up with one cell that does not match the
  rest (F45 p3, F5 p9). Normalise per table, to whichever the majority already
  is — not globally, since single-line cells like dates and hour counts are
  legitimately `TextField`.
- A box seated on **a** rule is not the same as a box seated on **its** rule
  (§9.1), and a table's heading cell is a favourite parking spot for a stray
  row of boxes (§9.2).

## 9. Defects found by reading the shipped Ontario templates in the app

Everything in §1–§8 is about *building* a form. This section is what the user
found afterwards, one screenshot at a time, on templates that had already
passed every gate. Each entry says what the defect looks like, why the existing
checks did not see it, and how to find the rest of its kind before shipping.

The through-line: **every one of these was found by looking at a page, not by a
measurement.** Where a detector is given below, it exists because the obvious
detector had already failed on that defect.

### 9.1 On a rule, but the wrong rule

A blank's writing line is usually a **dotted leader**; the solid rules near it
are the table frame and the row separators. A box that has drifted a few points
down lands on the solid rule underneath and still looks seated — nearest-rule
matching scores it as correct, because it *is* on a rule.

- Form 33B.1 p7: "care and custody of" and "other (Specify.)" sat ~4.3pt low,
  on the frame line instead of their dotted leaders.
- Form 25D p3: "starting on (date)" sat 6.3pt low, on the frame line closing
  the add-ons box.

**Check it this way**: for each field, find the dotted leader whose x-range
overlaps the box, and require the box's bottom to sit ~1.3pt above *that*
line. Do not take the nearest rule of any kind. `get_drawings()` reports the
leader with a `dashes` value (e.g. `[.48 .96] 0`) and the frame with `None`,
so the two are distinguishable without guessing.

### 9.2 A row of boxes parked in the table's heading

Six forms carried a full row of fields sitting inside the column-heading cell,
over "Birthdate / Age / Sex / Full Legal Name(s) of Parent(s)" or the like:
33B.1 p2, 33B.2 p2, 8B.1 p3, 8B.2 p3, 17B p2, 35.1 p4 and p5.

The heading cell is tall, so these boxes are sized to it (32.25 in the stored
units, against ~24 for a data row) and clip the heading text by only a point or
two — which is why "field overlaps printed bold type" both missed them and
drowned in false positives (every `$` in Form 13C).

**Check it this way**: group fields into columns by x and width, sort each
column by y, and flag the topmost field whose height differs from that column's
modal height. That is what a heading stray looks like and a data row does not.
Confirm against the page before deleting — on BCSC F5 p9 the same signal is a
genuinely taller first data row.

### 9.3 A box on a cell the form has already filled in

Form 13C names some of its own rows — "Matrimonial Home", "Household goods &
furniture", "Cars, boats, vehicles", "Jewellery, art, electronics…", "Other
special items", "Assets", "Debts and other liabilities". Each had a field
covering the printed label. The blank rows *below* those labels legitimately
have one.

This is §3's "printed content inside the field's own box" seen at row level:
the test is whether the printed text is the row's own name (drop the box) or an
instruction the writing area sits under (keep it, moved clear).

### 9.4 Multi-line rows, and rows that only look multi-line

Two variants, and telling them apart matters more than either fix:

- **A double-height row whose cells fill only its first line.** Form 13C (b)'s
  "Jewellery, art, electronics, tools, sports & hobby, equipment" row is two
  label lines tall; its Description / Comments / Document Number boxes covered
  the top half. Grow them to the row.
- **A row that is not there at all.** Form 13C (e)'s first row is also two lines
  tall, but its grey shading covers only the first line, so the white strip
  underneath reads exactly like an empty row with no fields. It is not one, and
  a row of fields was added there before the page settled the question.

**Count the anchors before deciding.** The form prints one `$` per money row
(13C (e): three `$` at y 120.1 / 144.3 / 158.0, against three rows) and every
other table on the page runs one shaded band per row. Shading alone is not
enough — it can cover part of a row. Match `$` count, band count and field rows
to each other, and if they disagree, read the page.

### 9.5 The answer space parked at the foot of the blank

Narrative items ("The important facts supporting… are as follows:") should get
a text area filling the blank **under the instructions**. Several instead had a
thin full-width `TextField` at the very bottom of the blank, overlapping the
next section's banner or the page footer: 43B items 12, 25, 27 and 43C item 5.
It reads as a stray line rather than an answer space.

- Take the top edge from the last line of the instructions, the bottom from
  whatever closes the blank — the next banner's rect, the footer, or the page's
  bottom margin.
- Where the item is the last thing on the page, that blank is usually the whole
  rest of the sheet (33C and 33D item 5). A printed "Put a line through any
  space left on this page" caption sitting inside it is expected; the caption
  refers to that very space.
- `type` matters: these are `TextArea`, not `TextField`, or the app gives one
  line inside a four-line box.

### 9.6 Blanks with a printed anchor and no field at all

Not every missing field is on a page you were told about. When one turns up,
**search the whole set for its anchor phrase** — it is usually systematic:

- "Print or type full legal name" — the left cell of the signature block had no
  field on 33C and 33D while its right-hand twin ("Relationship to child…") had
  one. Sweeping the phrase across all 178 templates found exactly those two.
- Narrative items with no field: 43B 18 and 19, 43C 9.
- An option with a checkbox and nowhere to write: Form 20's "(Other; specify.)".
- A second ruled line for the same answer: Form 33E's program name/address has
  rules at y 412.6 **and** 430.5. The box was on the lower one, so the upper one
  looked unfillable. A scan window that stopped at 425 reported one rule and one
  problem; the band was two lines all along. Take the band, not the first hit.

A **gap in the id sequence** is a hint of the same thing — 33C's and 33D's
missing name fields were ids `…009`, `…012`, `…015`, absent between fields that
were present. Worth scanning for.

Build a new field by **copying its twin** and changing only the geometry that
must change (the row's y and height come from the twin; the x and width come
from the cell). That keeps `fontSize`, `color`, `page` and the rest consistent
with the form around it.

### 9.7 Inline blanks are not full-width lines

Form 43B item 8, "There is/are *(number)* ____ of child(ren) from our
relationship", had a full-width 8pt sliver under the sentence. The blank is the
gap **between the two printed phrases** — from the end of "(number)" to the
start of "of child(ren)" — at the standard box height. Sized as a line under
the sentence it reads as an answer area, and the count no longer visibly
belongs to the table it introduces.

### 9.8 Signature blocks and jurats

§5's rule (never a box on a signature line) holds, and two more from the
Ontario jurats:

- **The print-name box goes below the caption, not on the rule.** Form 20A p2
  had it on the commissioner's signature rule. It belongs under "(Type or print
  name below if signature is illegible.)", which is where 26, 28B, 29D, 29E, 34,
  34A and the rest of the set put theirs.
- **The blank before "before me at" is not a field.** That is where the
  commissioner writes "Sworn" or "Affirmed" by hand.
- Where the jurat sits at the very foot of the page there may be no room below
  the caption at all (20A p2 has ~3pt before the footer). Cramped jurats in this
  set — 32.1A, 32C, 30B, 34F, 34I — simply have no print-name box. Either is
  defensible; do not squeeze a box into the footer without saying so.
- When placing a signature-block field, pair it against the **name row's** twin,
  never the signature row's, so the geometry can't be copied onto a signature
  line by accident.

### 9.9 Sideways backers (`VerticalTextField`)

Warrant backers print their block rotated (Forms 32B, 32D). The type exists for
this: footprint tall and narrow, `rotation: 270`, edited through a horizontal
pop-up. Getting it right:

- The footprint is the box **as it sits on the page** — width = the standard
  thickness across the rule, height = the run along it. A wide, flat box here is
  the defect, not the layout.
- Seat it on the **left** of the vertical rule; that is "above the line" once
  the page is turned.
- A plain `TextField` on one of these rules (32D's two) prints horizontally
  across a vertical line. Convert rather than nudge.
- `savePdf` burns these with an `MK /R` rotation using the same footprint, so a
  correct box in the viewer is a correct box in the export.

### 9.10 Two units in one record — the mistake to expect

`x`/`y` are **points**; `width`/`height` are **points × 1.5** (§ "Overlay
convention", and `PDFViewer.jsx` positions with `x * scale` while sizing with
`width` as-is). Compute a box's geometry in points and write the sizes straight
in and it comes out two-thirds the intended size — which happened to 32B and
32D's vertical fields and had to be corrected in the following commit. Convert
sizes on the way in, and sanity-check by rendering with `width / 1.5`.

### 9.11 Artwork the placer mistook for a field

Form 32.1A's accessibility footer prints two wheelchair icons, and both had a
text field on them. Any small footer image is a candidate: sweep for fields
covering >40% of an image bbox. This was the only one across 178 templates, so
it is a check, not a class.

### 9.12 Judging the fix

- **The app serves templates from the database**, not from these JSON files
  (`/form-templates/:docId/versions/:version/pdf`, imported by
  `auth-server/scripts/import-form-templates.js`). A fix pushed here does not
  appear in the viewer until the templates are re-imported and deployed, so a
  screenshot that still shows a defect is not evidence the fix failed.
- **Preserve the file's formatting.** These maps are written with 1-space
  indent; `json.dump(..., indent=2)` reformats all 400 records and buries the
  one-line change. Write with `indent=1` and a trailing newline.
- Render the page with the boxes drawn on and read it before committing. Every
  fix in this section was confirmed that way, and two were wrong on the first
  attempt in a way only the render showed.

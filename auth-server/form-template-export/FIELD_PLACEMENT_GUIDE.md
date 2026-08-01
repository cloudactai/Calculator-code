# Field placement guide (for Claude, next form batch)

This is the accumulated ruleset for placing `staticFields` (text fields, text
areas, checkboxes) on a form template — text and checkbox alike — learned from
building the 43 BC forms. Read this before touching field geometry on a new
form, BC or otherwise. The build scripts are in `auth-server/tools/bc-forms/`;
this file is the "why" and the "what to check," not the code itself.

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

**Position/size must come from the printed mark, checked in this order:**

1. The printed glyph text (`❑` etc.), if present — **glyph wins over vector
   art**. BC often shades a grey panel *behind* the glyph that is roughly the
   same size as the glyph itself; if you check vector shapes first, you union
   the shading with the glyph and the control ends up too tall, offset low,
   or both. Glyph first, always.
2. Vector art (circle/rounded-square outline), skipping filled grey panels
   (a "shading" rect has a `fill` in the light-grey range and no `color`/
   stroke — exclude it explicitly).
3. Refine either candidate to actual rendered ink (render at high zoom,
   measure the dark pixel bounding box) — a `❑` glyph's *font* box is much
   taller than the visible glyph (e.g. 9×14 for a 9×9 square).
4. If the ink measurement comes back wildly non-square (grabbed a
   neighboring line), reject it and fall back to a square centered on the
   original candidate — these marks are always square or circular, never a
   4:1 rectangle.
5. Accept a match at any vertical offset within the field's own allocated
   box, however far down — some two-line options have the mark centered
   ~14pt below the top of the box XFA/AcroForm handed you. Don't cap the
   search distance; cap it to "is the match still inside this field's box."

**Check on every build:** re-derive shape and position from the page and diff
against what you stored. Zero mismatches is the bar — 576/838 and later
0/838 were both real measurements on this project, not estimates.

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

**XFA's "paragraph marker" sliver.** XFA sometimes emits a narrow (~14pt)
column to the left of a free-text block as its own separate field — this
renders as a tiny stray box sitting beside the real writing area. Detect
fields narrower than ~22pt next to a wider field on the same line:

- If there's a wide field immediately to the right (within ~12pt gap): merge
  them into one field spanning both, drop the duplicate.
- If the sliver stands alone: grow it rightward to the actual writing area —
  stop at the next printed word or the next field, whichever is closer, or
  the page's right margin.
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
7. **Non-geometry diff** (only relevant when editing existing maps, e.g.
   Ontario): every `bind`, `calculationType`, `linkedToId`, etc. must be
   byte-identical before/after. Any change here is a bug.
8. **Actual visual check** — render representative pages (especially ones
   flagged by 1-6, plus a random sample of "normal" pages) and look for:
   description/text boxes that are one line tall when the printed cell is
   clearly multi-line; boxes overlapping printed labels/words; checkboxes
   that read as ovals/rectangles instead of matching the printed shape;
   stray extra boxes; missing boxes on pages that have visible blank
   lines/cells.
9. Only after the user confirms a render looks right: apply the same rule to
   the rest of the batch, and only then update this guide / commit the rule
   as "settled."

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

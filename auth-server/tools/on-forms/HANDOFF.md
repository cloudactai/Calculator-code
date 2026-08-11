# Ontario forms — handoff

Written 2026-08-10, after the geometry refit described in §2 and revised the same
day after the pass described in §8. The batch of 90 new Ontario templates had
shipped with two confirmed defects; those and five more are now fixed, the
templates are idempotent under the tooling, and what remains is **review**.

**Read this before touching field geometry.**

Companion reading, all in this repo:

- `form-template-export/ON_REVIEW_LIST.md` — the per-form checklist to work
  through. Generated, not typed: rebuild it with `review_list.py`.
- `form-template-export/FIELD_PLACEMENT_GUIDE.md` — the accumulated ruleset for
  placing boxes. Its golden rule ("never guess — read the government's own page")
  and its change discipline ("ship one render, wait for confirmation, then apply
  broadly").
- `tools/on-forms/README.md` — how the Ontario pipeline runs, end to end.
- `form-template-export/MIGRATION_PLAN_REMAINING20.md` — per-form migration status.
- `docs/FORMS.md` — how the Forms feature works in the app, including the overlay
  coordinate convention and how `FillPdf.savePdf` stamps a field.
- `tools/bc-forms/README.md` — the BC pipeline this one reuses.

---

## 1. Where things stand

135 of Ontario's 140 published family-law forms are catalogued (was 45), plus 43
BC. The 90 added in this batch have had their geometry refit; the 45 approved
Ontario templates and the 43 BC ones are **byte-identical** and always were.

Gates, all green:

```
python3 place_open_blanks.py     # 0 changes — a fixed point
python3 place_missing_boxes.py   # 0 changes — a fixed point
python3 refit_on_fields.py       # 0 changes — a fixed point
python3 check_seating.py         # 12 findings, every one read against the page (§8)
python3 verify_on_forms.py       # all checks passed
python3 audit_on_forms.py --all  # 0 of 135 flagged — clean
npm run forms:validate-export && npm test
```

Nothing is held back from the tooling any more: Form 13C's page 4 was the last
exception and §8 explains what was really wrong with it.

## 2. What the refit did

`refit_on_fields.py`, over the 90 docIds in `on_scope.NEW_DOCIDS` only, after
`place_open_blanks.py`. **About 3000 fields re-seated and 46 strays dropped**, and
2924 of the 3041 TextFields now sit at exactly the approved 13.3 pt (was 0).

### Defect 1 — boxes far taller than the line, text floats

An overlay box took its height from the government's AcroForm widget, which is
routinely 2–3× a printed text line. The editor top-aligns the input, so typed text
sat well above the printed rule instead of on it.

**The rule, from the user:**

> If it sits on **an underline, it gets the standard-size box.** Otherwise —
> open white space, a block, several lines — it should be a **text area.**

Both halves matter, and both are implemented. Every single-line field is re-cut to
13.3 pt and sat on its rule; every writing block keeps its height. Two numbers drive
it, and both are **measurements taken off the 45 approved templates**, not guesses:

| | |
| --- | --- |
| single-line height | **13.3 pt** (2393 of 3254 approved fields sit at exactly this; TextField p25 = median = p75 = 13.3) |
| gap from box bottom to its rule | **1.26 pt** (p10 1.21, p90 1.48) |

Shape is decided from the government's own **multiline flag**, still readable in
the `_source.pdf` widgets — that is what produced `TextArea` at build time, and it
is ground truth. It is overridden only where the rectangle plainly disagrees: a
multiline flag on a box one line tall is a single-line blank, and a single-line
flag on a box tall enough to hold a paragraph with no rule under it is a writing
block (Form 34D's is 427 pt).

### Defect 2 — Form 25C, and the flat-form placement generally

Ten forms are built by `place_flat_fields.py` from a Word export. Their boxes took
a left edge from where the Word field's en-space padding began — mid-line when the
field is padded or centred — and ran right to "the next printed character or the
cell edge". Neither end was tied to the printed rule, so boxes started late and
overshot. On Form 25C, six of 23 fields were wrong.

Those ten forms now snap to the government's own printed rule, which is ground
truth, with three constraints that each came out of a render:

- **The leftmost overlapping rule wins, not the widest overlap.** A flat box
  routinely spans its own rule *and* the next one along; the blank it belongs to is
  the one it starts on. Taking the widest overlap put Form 25C's "Date of
  signature" box on the judge's signature line.
- **Stay inside the column.** A rule runs the full width of its table row.
- **Start past what is printed at the head of the cell** — a `$` glyph, or a
  caption like "Full legal name:" that Form 13C sets inside the cell it labels.

A box with no rule, no cell, no shading and no ink near it is dropped: that is the
Word export's padding, not a blank. A box that would land on a signature line is
dropped (guide §5), and so is one seated on a heavy section divider — though only
when it is a single line, since a table's closing border is heavy too and Form 13C's
totals row sits on exactly that.

### The blanks with no rule at all — `place_open_blanks.py`

Some answer areas are not a rule and not a cell. The page prints a question ending in
a colon and then leaves paper, so there is nothing to measure against and the golden
rule left them with **no box at all** — including Form 43's "Provide a brief summary
of why you believe a binding judicial dispute resolution hearing would be an
effective way to resolve the issues". A lawyer could not type in any of them.

`place_open_blanks.py` places **27** of these, using the anchors the placement guide
§6 already names: the top is the last line of the caption (including a bracketed hint
that may wrap over two lines), the bottom is whatever prints next, and the column
comes from a box the form already has, so the new area lines up with the page. It
adds fields, so it is deliberately a separate tool from the refit, which asserts the
field set never changes — a tool guarding that cannot be the one that changes it
(guide §7.8). **Run it before the refit.**

Three things it must not mistake for a question, each found by looking at what it
produced:

- **A numbered sub-clause is not a hint.** "(b) that this form may be filed with the
  court…" opens with a bracket like a hint but closes it immediately and runs on as
  prose; treating it as one swallowed two clauses of Form 33D under a box.
- **A margin label is not a caption.** Form 33D sets "WE AGREE:" in the margin
  against the clauses it introduces — what it labels is beside it, not beneath it.
  A bracketed hint to the right is fine, which is the same distinction again.
- **A table label is not a question.** "TOTAL 5:" ends in a colon; a real question is
  a sentence, and its answer area has no column separator running through it.

## 3. What is left — review

**Nothing here is a known defect. What is left is that a person has not looked at
every page yet.** Coverage of this pass, counted honestly:

- 90 templates, **230 pages**.
- Pages read as a render: **~112**, across **43 forms** (~82 in the first pass,
  ~30 more in the pass described in §8).
- **All 11 inferred-geometry forms are fully reviewed** — the ten Word-sourced
  (13C, 25C, 26D, 34G.1, 34H, 34K, 43, 43A, 43B, 43C) and the XFA one (20). Those
  are the ones whose box *widths* moved, so they carried the risk.
- Of the 79 AcroForm forms, roughly 32 have been read and 47 are unread.

Three faults were found by looking, after the gates had gone quiet — a box seated
on a section divider, a box running past its blank into the tail of a sentence,
and a box reaching up through the line of type above it. All three are fixed and
each now has a check. That is the pattern the last handoff recorded, and it held —
and §8 is five more of it.

One whole class of fault is now swept mechanically rather than by eye.
`check_seating.py` walks the printed **rules** as well as the fields and reports a
blank the template cannot type on: a rule Ontario labelled with a caption set
directly under it, with no box. It finds none across the 90, and it was checked
against pages that are missing one (deleting the "(Name of court)" box from Forms
8D, 25D, 26 and 34A makes it name all four). That is the fault every "missing text
box" report in this batch turned out to be, so an unread AcroForm page is now a
smaller risk than the raw count suggests.

Work through `ON_REVIEW_LIST.md`. What is left to catch by eye is a box that is
*present but wrong* in a way no check names yet.

Render with `contact_sheet.py`, and check against the government's own PDF in
`_incoming_on/`, not just for tidiness.

### Known gaps a geometry pass cannot close

These need a field **added or split**, which `refit_on_fields.py` deliberately will
not do — it asserts the field set is unchanged, and a tool that guards that cannot
also be the one that changes it (guide §7.8).

- **Form 25C** has no box for its Court File Number, and one wide box across the
  five columns of its "person to be adopted" table.
- **Form 34H** p1: only the first of the four columns under item 2 (Full legal
  name / Date of birth / Sex / Birth registration number) has a box.
- **Form 33B.1** p3 item 8 and **Form 43B** p3 item 8 — the child table has boxes in
  only one of its columns.

~~**Form 34K** p2's two "(Specify.)" blanks~~ — **fixed, and there were five of
them, not two.** See §8.

### The 12 open `check_seating.py` findings

All 12 are **`no-anchor`**: a box with no rule and no cell to measure against. Each
has now been read against the government's own page and is correct. Eight are the
answer line under a caption that names what goes there — "(Name and address of
secure treatment program.)" on Form 8C p2, "(State frequency of compounding)" on
Form 26 p6, "(name of lawyer(s))" on Form 34G p3 — and four are blanks in running
text: the time in "will hear a motion at __ __" on Forms 25E and 32A, Form 30B's
jurat, and the date that wraps onto a second line on Form 43B. They are reported
because there is nothing printed to measure them against, which is the check
working, not a defect.

### Table columns that mix shapes

A column of table cells is one shape throughout, and **no column in the batch
genuinely mixes them.** The two that appeared to — Form 33E and Form 33F — were
misgrouped, and normalising them destroyed a writing block each; §8 has the story.

An earlier count of "48 mixed columns" was wrong, and worth remembering why: it
grouped cells by their left edge alone, which lumps a party panel together with the
"RE:" line beneath it. `page_geom.column_runs()` is the definition that replaced it,
and both `refit_on_fields.py` and `check_seating.py` use it. It has since been
corrected twice, both times because a *box* gap is not a *table* gap:

- members of one column sit in cells that **share a border** — the bottom of one is
  the top of the next. Measured on the boxes, Form 33E's party panel and the stack
  of ruled blanks 20 pt below it read as one column of four.
- a field in a drawn cell and a field that is not in one are **never** two cells of
  one column, whatever the gap. Form 32A sets a party's name on a bare rule directly
  above the panel it labels, at the same left edge and width.

Where a table's *rows* mix shapes — "Court location" as a line beside "Court orders
made" as a block, on Form 35.1 — that is the government's own multiline flag saying
the two columns hold different things, and it is left alone. So is a cell the
government marked taller than its column-mates, which holds more lines than they do
(Form 13C's "Jewellery, art, electronics, tools, sports & hobby, equipment").

Where a table's *rows* mix shapes — "Court location" as a line beside "Court orders
made" as a block, on Form 35.1 — that is the government's own multiline flag saying
the two columns hold different things, and it is left alone.

### One inconsistency to settle

A header cell drawn as a box roughly 45 pt tall — "Judge (print or type name)",
"Date of order", "Court office address" — becomes a `TextArea` filling the box when
the page has no rule under it (Form A.25A, Form 8.0.1) but a single 13.3 pt line
when it does (Form 25C, Form 25D). Both follow the stated rule; they just look
different side by side. If you want these always single-line, it is a small change
to `refit_on_fields.py`, but it argues with "open white space gets a text area", so
it needs your call rather than mine.

### Still outstanding from the catalogue (unchanged)

- **37A–37E** are excluded, by the user's decision. They are the registry's own
  generation templates (they print `[[Jurisdiction]]` merge placeholders) and are
  issued by the court, not completed by a party. Listed in `COURT_ISSUED` in
  `build_on_forms.py`; the pipeline builds them cleanly if reconsidered.
- **Form 29G is held back** — its XFA flatten runs the Payor/Garnishee panels off
  the sheet edge. The background is wrong, so no overlay work fixes it.

## 4. The gates, and why they now measure the right thing

This was the important part of the last handoff. Everything reported "clean" while
the forms looked wrong, because the checks measured the wrong properties:

- `verify_on_forms.py` — files present, no leftover widgets, geometry in bounds,
  bind vocabulary known. **Never asked whether a box sits on its line.**
- `audit_on_forms.py` — stacked boxes, missed anchors, oversized, slivers, runaway
  widths. **The "oversized" rule was deliberately disabled for AcroForm sources**,
  because the 2–3× line-height boxes are the government's own widget rects — which
  is precisely the defect.
- `covers_printed_text` — only flags a box *on top of* ink. A box that starts in the
  middle of its rule and overshoots the end covers no text, so it passed.

`check_seating.py` is the answer to that. It asks, per field:

1. **Seated on the rule.** A single-line field must have a printed rule under it,
   its bottom on that rule within a point.
2. **The right shape for the blank.** A field on a rule is a `TextField` at 13.3 pt;
   a field over open space may be a `TextArea` and may be tall. It asserts the
   *pairing*, not just the height — a check that only shrank things would wreck the
   genuine writing blocks.
3. **Strays and unanchored boxes**, split apart: a blank in running text
   ("I, ____, request …") has no rule and is perfectly correct, so only a box with
   nothing near it at all is reported as a stray.
4. **Boxes over printed labels, and boxes across a drawn column separator** —
   measured on *characters*, not words. A money cell flattens to a `$` followed by
   the en-space padding its value used to occupy, so the word rectangle spans the
   whole cell and a correctly-placed box reads as covering it.

`on_scope.py` holds the scope guard: the 90 docIds, and a before/after sha256 of
every protected template. `refit_on_fields.py` refuses a docId outside the 90 and
aborts if any approved file changed.

## 5. Rules of the road

- **Never touch the approved 45 Ontario templates or the 43 BC ones.** An earlier
  draft of this document suggested changing vertical alignment in `PDFViewer.jsx` to
  fix every province at once — **that is ruled out**, because it would change how the
  approved forms render.
- **Any geometry pass must be idempotent.** Two passes that each correct the other
  oscillate happily and look fine on a single run. Three separate oscillations were
  found and fixed here (a geometry-dependent block test, a shared-rule split that
  drifted 0.01 pt per run, and an asymmetric seat window that walked a box onto the
  next rule down). `refit_on_fields.py` runs itself to a fixed point and
  `python3 refit_on_fields.py` must report zero changes.
- **`FIELD_PLACEMENT_GUIDE.md` has not been rewritten.** Its change discipline says
  a rule is only settled once the user has looked at a render and agreed. The rules
  added here are recorded in §2 above and in the tools' own docstrings; fold them
  into the guide once the review in §3 is done.

## 6. Rebuilding

```
cd auth-server/tools/on-forms
python3 build_on_forms.py            # dry; --promote writes into form-template-export/
python3 merge_on_catalog.py          # dry; --promote rewrites catalog.json + audit.json
python3 place_open_blanks.py --apply   # box the answer areas that have no rule
python3 place_missing_boxes.py --apply # box the blanks the build produced none for
python3 refit_on_fields.py --apply     # seat the boxes on the printed page
python3 check_seating.py
python3 verify_on_forms.py
python3 audit_on_forms.py --all
python3 contact_sheet.py --grid 2x2  # renders for review, into _incoming_on/qa/
python3 review_list.py > ../../form-template-export/ON_REVIEW_LIST.md
cd ../.. && npm run forms:validate-export && npm test
```

`build_on_forms.py` writes the government's raw widget rects, so **`refit_on_fields.py`
has to run after it** or defect 1 comes straight back.

**Run the three placement passes round twice.** Each tool is a fixed point on its
own, but they are not jointly one on the first lap: `place_missing_boxes.py` reads
"a bare rule beside a ruled blank that *has a box*", and on Form 34K one of those
boxes only comes to sit on its rule once the refit has seated it. A second lap
settles it, and a third changes nothing.

Staging in `form-template-export/_incoming_on/` is gitignored and already holds
every government source plus the LibreOffice PDF conversions, so nothing needs
re-downloading. QA renders land in `_incoming_on/qa/`.

There is one piece of ground truth worth using on the Word-sourced forms: the
`w:textInput` and `w:checkBox` counts inside each `_source.docx` say how many
fields the form actually has. Compare against what the build produces.

## 7. Decisions already made — do not relitigate

- **Form 37 moved** to Interjurisdictional Support from Child Protection.
- **No prefill binds on the Word-sourced or XFA forms** — those sources carry no
  field names, so nothing is bound rather than guessed.
- **Word is not scriptable for docx→PDF** — 16.76 compiles
  `save as … format PDF` but the running app rejects it (-1708). LibreOffice is
  installed and `convert_docx.sh` uses it. Word leaves `~$name.docx` lock files
  that must be skipped when globbing.

## 8. The second pass — five more defects, and what they had in common

Written after working the "still open" list from the first pass. Every item on it
is closed, and each turned out to be a different symptom of a smaller number of
causes. One change, one verification, one commit throughout.

### 8.1 A cell's bottom border cannot also be its top

`enclosing_cell` anchors on a box's bottom edge — the edge that does not move. That
put the cell's own bottom border within `pad` of the probe, so a box **grown to fill
its cell** found the same rule as both the cell's top and its bottom, the cell
collapsed to zero height, and the function reported no cell at all.

A field with no cell reads as a field on a bare underline, so the refit demoted the
government's own `TextArea` to a single line and cut it to 21.5 pt at the foot of
the panel. That is the "63 pt panel with one line at its foot, five-sixths dead"
the first pass reported on Forms 29C and 32A — and those two were only the widest
of **52 fields across 13 forms**. The party panels on Form 29C were the same fault:
one row of each "Full legal name & address for service" panel a line, the other a
block, which is why the page looked half-right.

**The government's multiline flag was correct every time.** It is worth being clear
about this, because the first pass filed it under "the government's own metadata
disagreeing with its own page" and it was nothing of the kind. The flag is not
readable from a template once the refit has overwritten it, so the fix is a repair
as well as a code change: those forms are replayed from the build output in
`_incoming_on/out/`, which still holds it.

The same collapsed cell was **the cause of Form 13C p4's non-idempotence**, the one
the first pass could not identify. Five full cycles of all three placement tools now
leave the template byte-identical.

### 8.2 Two tables that line up are still two tables

`column_runs` decided who was in a column from the gap between the *boxes*. A box
floats inside its cell — its height is whatever shape the field ended up with — so
that gap says nothing about whether two grids are one table. Forms 33E and 33F each
set a party panel above an unrelated stack of ruled blanks at the same left edge and
width with 20 pt of blank page between, so the panel was a lone `TextArea` among
three single lines and the normaliser flattened it. On Form 33E
`place_missing_boxes.py` then filled the space it had vacated, leaving two stacked
single lines where the government drew one writing area.

Consecutive cells of one table **share a border**. That is what a run is measured on
now, and a field in a drawn cell is never in a column with a field that is not
(Form 32A's party-name line above its panel).

### 8.3 A drawn grid has more cells than blanks

Form 13C was held back because boxing its empty cells left the refit flipping fields
on every run. The flipping was §8.1, but the rule was wrong for that form anyway: it
wanted 26 boxes, and the form's own `_source.docx` holds 404 `w:textInput` and 3
`w:checkBox` against the 404 boxes it already had. What the rule found is the spacer
band Form 13C rules between each pair of money rows — drawn on all four sides,
empty, and not a blank.

Form 13C is the only Ontario Word export whose LibreOffice conversion carries the
grey form-field marking, and there it is complete: **385 of its 401 boxes sit on it,
against 0 of the 339 across the other nine.** So where an export marks its own
fields, an unmarked cell is not one — a question with one answer per document and a
0%-to-96% margin rather than a threshold to land on.

### 8.4 A field the government filled in for you is still a field

A Word field with a `<w:default>` renders that text instead of the en-space padding
an empty one leaves, so the build reads it as printed page furniture. Form 13C has
seven, and two independent sources name the same seven: the marked rectangles no box
touches, and the seven `w:textInput` elements carrying a default. They are the
category cell of a table row whose every other column is fillable — the ITEM column
of "(b) General household items and vehicles" was four uneditable rows above two
editable ones.

Three things had to learn that ink inside a marked rectangle is the field's *value*,
not a caption: the refit's caption rules, which started each box after the
government's own answer; the column normaliser, which flipped the two-line
"Jewellery, art, electronics, tools, sports & hobby, equipment" cell on every pass;
and the sibling rule, which read that double-height row's closing rule as a row of
blanks and boxed the lower half of six cells that already had a box.

**The government's suggestion stays printed on the flattened background**, so
overtyping one leaves both readable. That is the cost of a default value that can no
longer get out of the way; the alternative was a row a lawyer cannot edit at all. If
you would rather have the words painted out and carried in the field's `value`, that
is a change to `place_flat_fields.py` and the background, and it needs your call.

### 8.5 A printed "(Specify.)" says an answer goes on the next line

Form 34K page 3 was reported as looking off. The page is fine: its `.docx` carries
no page break at all, so LibreOffice chose where to break and a table row that would
not split pushed two items onto a page of their own — pages 3 and 5 are spill, which
is also why they carry no Court File Number header. Nothing is lost: the source has
166 ☐ characters and so does the flattened page, and every one has its box.

What was wrong is elsewhere. The source holds 15 `w:textInput` and the template had
13 boxes. The build placed all five missing ones correctly from the placeholder
padding, and the refit dropped them as strays — with reason, since a "specify" blank
has no rule, no cell, no shading and nothing on its own line, which is exactly the
shape of the padding the stray rule exists to delete. The difference is that the
page prints an instruction saying an answer goes there, the same signal
`under_name_instruction` already read for Ontario's jurat. The first pass listed two
of these; there were five.

### 8.6 The gate that runs the other way

Every check until now starts from a field and asks whether the page justifies it.
The fault a lawyer meets first runs the other way: the government drew a line and
the template cannot type on it. `check_seating.py` now walks the rules too, and
reports a rule Ontario labelled with a caption set **directly** under it that has no
box. Directly is what makes it precise — a genuine caption sits 0.4 to 0.7 pt below
its rule, while the heading of the next section under a header separator is 7.8 pt
or further.

It reports nothing across the 90, so it was tested against pages that are missing
one: deleting the "(Name of court)" box from Forms 8D, 25D, 26 and 34A makes it name
all four.

### What kept coming up

- **A fixed point is not the same as being right.** Four of these five survived
  because the tool had already destroyed the evidence for the correct answer — a
  demoted `TextArea` is 21.5 pt tall, and the height test that demoted it then says
  it is a line. Ask what a rule reads *before* the pass, not after.
- **A rule that reads the field's own geometry will eventually read its own output.**
  Where the answer can come from the printed page instead — a drawn cell, a marked
  rectangle — take it from there; the page does not move.
- **Two heuristics disagreeing means neither is looking at the structure.** The cell
  border that was also a cell top, the box gap standing in for a table gap, the
  caption test that could not tell a value from a label: each was settled by naming
  a fact about the drawn page, never by tuning a tolerance.
- **The government's own source counts are the cheapest check there is.** `w:textInput`
  found the five Form 34K blanks, ruled out 26 of Form 13C's 26 proposed boxes, and
  named its seven pre-filled ones. Use them before reasoning about geometry.

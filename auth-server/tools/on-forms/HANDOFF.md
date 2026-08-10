# Ontario forms — handoff

Written 2026-08-10, after the geometry refit described in §2. The batch of 90 new
Ontario templates had shipped with two confirmed defects; both are now fixed, the
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
python3 refit_on_fields.py       # 0 changes — the pass is a fixed point
python3 check_seating.py         # 16 findings, all reviewed (see §4)
python3 verify_on_forms.py       # all checks passed
python3 audit_on_forms.py --all  # 0 of 135 flagged
npm run forms:validate-export && npm test
```

## 2. What the refit did

`refit_on_fields.py`, over the 90 docIds in `on_scope.NEW_DOCIDS` only.
**2993 fields re-seated, 41 strays dropped.** 2925 of the 3041 TextFields now sit
at exactly the approved 13.3 pt (was 0).

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
dropped (guide §5).

## 3. What is left — review

**Nothing here is a known defect. What is left is that a person has not looked at
every page yet.** Coverage of this pass, counted honestly:

- 90 templates, **230 pages**.
- Pages read as a render during this work: **20**, across 12 forms — including
  every source class (AcroForm, Word, XFA) and both before and after.
- Forms with every page checked: **3** (25C, 26D, 35.1A).

Work through `ON_REVIEW_LIST.md`. Take the **Word** and **XFA** rows first: those
14 boxes were inferred from the printed page, so their widths moved as well as
their heights. The 78 AcroForm rows kept the government's own rectangle
horizontally and only moved vertically, so they carry much less risk.

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
- **Form 34K** p2: "(k) Other joint application (Specify.)" and "(l) (Other.
  Specify.)" have no box for the specify.
- **Form 43** item 3, **Form 43B** item 5 — writing areas that are bare white space
  on the government page. Per the golden rule they were deliberately left without a
  box; worth revisiting, since a lawyer cannot type there.

### The 16 open `check_seating.py` findings

- **`no-anchor` ×15** — a government widget sitting in open white space with no
  rule, cell or caption on its own line. These are the government's own boxes and
  are almost certainly right; they are reported so a person confirms rather than
  assumes.
- **`covers-text` ×1** — Form 34G.1 p3, a flat-sourced box that runs past its blank
  onto ", and was".

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
python3 refit_on_fields.py --apply   # seat the boxes on the printed page
python3 check_seating.py
python3 verify_on_forms.py
python3 audit_on_forms.py --all
python3 contact_sheet.py --grid 2x2  # renders for review, into _incoming_on/qa/
python3 review_list.py > ../../form-template-export/ON_REVIEW_LIST.md
cd ../.. && npm run forms:validate-export && npm test
```

`build_on_forms.py` writes the government's raw widget rects, so **`refit_on_fields.py`
has to run after it** or defect 1 comes straight back.

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

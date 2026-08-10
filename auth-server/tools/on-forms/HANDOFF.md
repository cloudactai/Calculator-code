# Ontario forms — handoff

Written 2026-08-10, at the point where the 90 new Ontario templates were pushed
and then found to be visibly wrong in the editor. **Read this before touching
field geometry.**

Companion reading, all in this repo:

- `form-template-export/FIELD_PLACEMENT_GUIDE.md` — the accumulated ruleset for
  placing boxes. Its golden rule ("never guess — read the government's own page")
  and its change discipline ("ship one render, wait for confirmation, then apply
  broadly") are the two things that were not followed closely enough.
- `tools/on-forms/README.md` — how the Ontario pipeline runs, end to end.
- `form-template-export/MIGRATION_PLAN_REMAINING20.md` — per-form migration status.
- `docs/FORMS.md` — how the Forms feature works in the app, including the overlay
  coordinate convention and how `FillPdf.savePdf` stamps a field.
- `tools/bc-forms/README.md` — the BC pipeline this one reuses.

---

## 1. Where things stand

135 of Ontario's 140 published family-law forms are catalogued (was 45), plus 43
BC. Pushed to `main` (merge `d393b32`) and to branch `on-forms`. The deployed
app imports them in the background on start, one template per process.

**The templates are in production and they are not right.** Two defect classes
are confirmed below. Nothing here is a catalogue or import problem — the field
geometry itself is wrong.

## 2. Confirmed defect 1 — boxes far taller than the line, text floats

An overlay box takes its height from the government's AcroForm widget, which is
routinely 2–3× a printed text line. The editor top-aligns the input, so typed
text sits well above the printed rule instead of on it.

### THE RULE, from the user

> If it sits on **an underline, it gets the standard-size box.** Otherwise —
> open white space, a block, several lines — it should be a **text area.**

Both halves matter. Not every box should shrink: a writing block genuinely needs
to be tall. What is wrong is a *single-line* field on a printed rule being given
a two- or three-line box.

### The standard size is 13.3 pt — measured, not invented

Taken from the 45 Ontario templates the user reviewed and approved:

| | |
| --- | --- |
| fields at exactly 13.3 pt | 2393 of 3254 |
| `TextField` height | p25 = median = p75 = **13.3 pt** |
| `TextArea` height | median 40.7 pt (p25 24.5, p75 61.0) |

So the approved set already follows the rule exactly: single line on a rule =
13.3 pt `TextField`; open block = `TextArea` sized to the space. Match it.
(13.3 pt is the on-page height; the JSON stores height × 1.5, i.e. 20.0.)

### Scope — the 90 new templates ONLY

**Do not touch the 45 Ontario templates shipped before this work, or the 43 BC
ones. The user has reviewed those and is happy with them.** An earlier draft of
this document suggested changing vertical alignment in `PDFViewer.jsx` to fix
every province at once — **that is ruled out**, because it would change how the
approved forms render.

Work to do, new templates only:

| | count |
| --- | --- |
| `TextField` already at the standard | 959 |
| `TextField` off the standard, to re-seat on its rule | **2151** |
| `TextArea` — judge individually against the rule above | 727 |

Heaviest: Form26 (192), Form33B_1 (130), Form33B_2 (91), Form26A (80),
Form23C (77), Form15D (76), Form25D (76), Form26C (66), Form35_1A (65),
Form28 (63). Only 5 of the 90 need no height work.

Re-seating is not just resizing: a single-line box must end up **sitting on its
printed rule**, so the height change and the vertical position change together.
Show the user one render and get agreement before applying it broadly — that is
the placement guide's change discipline, and skipping it is how this batch went
out wrong.

## 3. Confirmed defect 2 — Form 25C, and the flat-form placement generally

Form 25C is one of the ten built by `place_flat_fields.py` from a Word export.
Six of its 23 fields are wrong, verified against the page's own printed rules:

| field box | should sit on | what happened |
| --- | --- | --- |
| 277,60 → 578,71 | rule x 146..432 | starts mid-line, runs 146pt past the rule's end into the Court File Number box |
| 277,90 → 452,101 | rule x 146..432 | starts mid-line, overruns |
| 76,164 → 150,174 | rule x 37..137 | "Judge (print or type name)", starts mid-rule, overruns |
| 39,677 → 578,688 | rule x 37..296 | "Date of signature" runs across into the signature area |
| 144,708 → 578,719 | rule x 37..277 | same |
| 425,733 → 578,743 | no rule, no caption | a stray box with nothing under it |

**Root cause.** The placeholder-run signal takes the box's left edge from where
the Word field's en-space padding began — which is mid-line when the field is
padded or centred — and then extends rightward to "the next printed character,
or the cell/page edge". Neither end is tied to the printed rule the field belongs
to, so boxes start late and overshoot.

**The fix direction:** when a placeholder run sits on or just above a printed
rule, snap the box to that rule's own extent. The rule is the government's line;
it is ground truth and it is already being detected (`rule_blanks`). The
next-character logic should only apply where there is no rule. A run with no rule
and no caption near it — like the stray box above — should be dropped.

## 4. Why the automated checks passed, and what they must check instead

This is the important part. Everything was "clean" while the forms looked like
this, because the checks measured the wrong properties:

- `verify_on_forms.py` — files present, no leftover widgets, geometry in bounds,
  bind vocabulary known. **Never asked whether a box sits on its line.**
- `audit_on_forms.py` — stacked boxes, missed anchors, oversized, slivers,
  runaway widths. **The 2–3× line-height boxes are the government's own widget
  rects, so the "oversized" rule was deliberately disabled for AcroForm sources
  — which is precisely the defect the user is seeing.**
- `covers_printed_text` — only flags a box *on top of* ink. A box that starts in
  the middle of its rule and overshoots the end covers no text, so it passed.

Checks worth adding before any refit:

1. **Seated on the rule.** For every text field, find the printed rule it belongs
   to and assert the box's left/right edges match it within a couple of points,
   and that its bottom sits on the rule. Flag any field with no rule *and* no
   shading *and* no cell — that finds strays like 25C's bottom box.
2. **The right shape for the blank.** A field on a printed underline must be a
   `TextField` at the standard 13.3 pt. A field over open white space may be a
   `TextArea` and may be tall. Assert the pairing, not just the height — a check
   that only shrinks things would wreck the genuine writing blocks.
3. **Scope guard.** Assert that nothing outside the 90 new docIds changed. The
   approved 45 ON and 43 BC templates must come through byte-identical; diff them
   before and after any geometry pass and confirm zero changes.
4. **Render every page.** Non-negotiable — see below.

## 5. Every page must be reviewed individually

Coverage at the time of the push, counted honestly:

- 90 templates, **230 pages**.
- Pages read as a render at the shipped build: **8**.
- Forms with every page checked: **1** (Form 34H).
- Forms with no page ever looked at: **75 of 90**.

Every defect found so far was found by looking at a render, and none by the
gates. There is no shortcut here: the next pass has to go page by page, all 230,
and the previously-shipped 45 ON and 43 BC need at least a sweep for defect 1.

A contact-sheet generator (2×2 pages per image, form/page labelled) was used and
works well; rebuild it in `tools/on-forms/` rather than as a throwaway script,
and check the render against the government's own PDF, not just for tidiness.

## 6. Priority order

1. **Form 25C** — worst example, and small. Fix it, show a render, get agreement.
2. **The other nine flat-sourced forms** — 13C, 26D, 34G.1, 34H, 34K, 43, 43A,
   43B, 43C. Same rule-snapping fix applies; these carry inference, not
   government geometry.
3. **Defect 1 across the 90 new templates** (2151 fields) — one render agreed
   first, then applied. Never outside those 90.
4. **The 78 AcroForm forms, page by page.**

Throughout: the 45 approved Ontario templates and the 43 BC ones are off limits.

## 7. Decisions already made — do not relitigate

- **37A–37E are excluded**, by the user's decision. They are the registry's own
  generation templates (they print `[[Jurisdiction]]` merge placeholders) and are
  issued by the court, not completed by a party. Listed in `COURT_ISSUED` in
  `build_on_forms.py`; the pipeline builds them cleanly if reconsidered.
- **Form 29G is held back** — its XFA flatten runs the Payor/Garnishee panels off
  the sheet edge. The background is wrong, so no overlay work fixes it.
- **Form 37 moved** to Interjurisdictional Support from Child Protection.
- **No prefill binds on the Word-sourced or XFA forms** — those sources carry no
  field names, so nothing is bound rather than guessed.
- **Word is not scriptable for docx→PDF** — 16.76 compiles
  `save as … format PDF` but the running app rejects it (-1708). LibreOffice is
  installed and `convert_docx.sh` uses it. Word leaves `~$name.docx` lock files
  that must be skipped when globbing.

## 8. Rebuilding

```
cd auth-server/tools/on-forms
python3 build_on_forms.py            # dry; --promote writes into form-template-export/
python3 merge_on_catalog.py          # dry; --promote rewrites catalog.json + audit.json
python3 verify_on_forms.py
python3 audit_on_forms.py --all
cd ../.. && npm run forms:validate-export && npm test
```

Staging in `form-template-export/_incoming_on/` is gitignored and already holds
every government source plus the LibreOffice PDF conversions, so nothing needs
re-downloading. QA renders land in `_incoming_on/qa/`.

There is one piece of ground truth worth using on the Word-sourced forms: the
`w:textInput` and `w:checkBox` counts inside each `_source.docx` say how many
fields the form actually has. Compare against what the build produces.

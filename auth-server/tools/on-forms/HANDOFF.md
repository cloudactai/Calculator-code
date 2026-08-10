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

Measured against a ~13pt line, text fields taller than 1.6 lines:

| set | affected |
| --- | --- |
| the 90 new templates | 1114 of 3837 (29%) |
| the 45 ON templates shipped before this work | 424 of 3254 (13%) |
| BC | 389 of 1839 (21%) |

Worst: Form26C 96%, Form00 90%, Form35_1A 89%, Form29J 88%, Form34E 85%,
Form22A 78%, Form28 76%, BCSC_F20 76%.

**This is not confined to the new batch.** Any fix reaches templates that were
shipped long before, and BC as well, which is exactly the situation the placement
guide's change discipline warns about. Decide deliberately whether to:

- normalise single-line text fields to one line height, seated on the printed
  rule (a data fix, per template, reviewable); or
- change vertical alignment in the editor (`PDFViewer.jsx`), which fixes every
  province at once but changes rendering for every already-approved form.

Either way it needs the user to see a render and agree before it goes wide.

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
   and that its baseline sits on the rule. Flag any field with no rule *and* no
   shading *and* no cell — that finds strays like 25C's bottom box.
2. **Height sanity.** Assert a single-line field is within ~1.3 lines of the
   page's own font size, or is explicitly a multi-line writing area.
3. **Render every page.** Non-negotiable — see below.

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
3. **Defect 1 across all 178 templates** — decide data-fix vs editor-alignment
   first, get agreement on one render, then apply.
4. **The 78 AcroForm forms, page by page.**

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

# Saskatchewan Forms Migration — status

_Written 2026-08-14. Companion to `BC_MIGRATION_PLAN.md` and the Ontario notes in
this folder. The build tooling and the full "why" live in
`auth-server/tools/sk-forms/README.md`._

---

## STATUS — complete

**Shipped: 40 of 40** Part 15 family-law forms, catalog rows 301–340,
`npm run forms:validate-export` green, **3,087 fields, zero findings across 13 gates**,
and no Ontario or BC template touched.

Financial forms were built and reviewed first, as asked; the other 32 followed
through the same pipeline once the detectors were settled against them.

| Category | Forms |
| --- | --- |
| King's Bench – Financial | 8 |
| King's Bench – Pleadings | 8 |
| King's Bench – Applications | 14 |
| King's Bench – Service | 2 |
| King's Bench – Affidavits | 2 |
| King's Bench – Divorce & Judgment | 4 |
| King's Bench – Conferences | 1 |
| King's Bench – Enforcement | 1 |

---

## Scope

**Part 15 of The King's Bench Rules** — the family-law part — published by the
Office of the King's Printer through the Saskatchewan Publications Centre. Part
16 (probate and estates, 35 forms) and the civil parts are out of scope, matching
what Ontario and BC ship.

There is one court and one division (Court of King's Bench, Family Law Division),
so unlike BC there is no court-level split to encode; categories carry the
function only, prefixed "King's Bench –" so the picker reads consistently beside
the BC folders.

---

## What was different from BC and Ontario

**The sources are the cleanest of the three provinces, and the least
self-describing.**

1. **No widgets, no XFA, no flatten.** All 40 are Word-derived static PDFs with a
   real text layer. There is no AcroForm `/Rect` to copy (BC Provincial) and no
   rendered XFA DOM to read geometry off (BC Supreme), so every box is detected
   from a printed anchor. But there is also no flatten step, no Chrome, no Adobe,
   and none of the manual export budget the BC plan had to reserve.

2. **The background ships byte-identical to the government's file.** The
   underscore runs already print as the writing line, so nothing is redacted,
   stripped or re-typeset. This is the first of the three provinces where that is
   true, and it removes every defect class in placement-guide §6b.

3. **The vocabulary is uniform.** Across all 40 forms: 1,590 underscore blanks,
   457 checkboxes — every one of them exactly 9×9, with no second size and no
   glyph variant — and ruled grids. That uniformity is why a single detector
   covers the set.

---

## The findings worth carrying forward

Each was found by looking at a page, not by a measurement, and each is now a
check. The last four were found only after the forms were opened **in the app** —
the QA render draws the stored rectangle, the viewer draws its own bordered
control inside it, and that difference hid every one of them (guide §7).

1. **A printed reference grid is not a set of empty fields.** Form 15-47's
   checklist prints "Schedules you must attach" as columns 1–7 with dots. Most of
   those cells are empty, and the first build put text boxes down column 7 — the
   only column with no dot in the top block. The discriminator is the column, not
   the cell, and narrow columns have to be read as a group.

2. **A signature caption claims its nearest rule, not every rule in range.** The
   jurat's year blank sits 23.95pt above "A Commissioner for Oaths", just inside
   the 24pt window, and was being deleted as if it were the signature line. This
   is the same "one mark is one candidate, never union the marks in range"
   reasoning guide §2 records for checkboxes, applied to captions.

3. **A page's grid must be built per row band.** Form 15-49 p3 stacks a 6-column
   table above a 7-column one and runs three rules down the full sheet. One global
   x-grid cut each table at the other's rule positions and silently produced *no
   cells at all* for the property statement's Category and Institution columns —
   a whole-column loss that no bounds or overlap check would ever flag.

4. **Not every writing area is a cell or a rule.** 73 of Form 15-47's are a plain
   drawn rectangle, and its page 7 has no grid at all — just five of them. Nothing
   looked at `re` items except the 9×9 checkbox detector.

5. **Read a cell by character centre, not by `get_text(clip=...)`.** That call
   admits a glyph only when its box is inside the clip, and 39 amount cells set
   their `$` flush with the top rule — so the cell read as empty and its box was
   placed *on* the `$`.

6. **Shading marks headings, totals and some amount rows alike.** Only the first
   is a heading. A row the form calls a total, and any cell carrying a `$`, keep
   their boxes; a heading never carries a `$`.

7. **Geometry that is correct in the overlay can still be wrong in the app.** A
   box flush against printed type, and two boxes on a 12pt pitch each one line
   deep, both measure fine and both render as a border through a letter or a
   crushed stack. The viewer's control needs the clearance, not the rectangle.

---

## Prefill

105 fields bound: court file number on 39 forms, respondent on 37, applicant on
29. Saskatchewan's petitioner is the party who starts the case, which is the
matter's client, so it binds to `applicant` — the same assumption Ontario and BC
already make. `buildPrefillData` needed no Saskatchewan branch; the resolver
reads bind paths from the document's own map and the roots it produces are
province-agnostic.

Deliberately unbound: **JUDICIAL CENTRE** (for the reason BC's registry line is —
the matter has no such field, and filling it from `courtName` would print the
court's name onto a line asking which centre); numbered and plural parties; and
Form 15-103, which omits the style of cause entirely.

---

## No frontend or API work was required

Province switching was already wired end to end, and `provinceCodeOf` in
`cloudact-ui/src/utils/canadianProvinces.js` already knew Saskatchewan. The
picker groups categories dynamically, so the eight King's Bench folders appear on
their own. Adding Saskatchewan was producing `SKKB_*.pdf` + `.json` overlays and
`catalog.json` rows with `province:"SK"`, exactly as the BC plan predicted for
any third province.

---

## Remaining / not done

- **Deploy smoke (BC plan gate K)** needs a database and a deploy, so it is not
  runnable here. Note that `BC_MIGRATION_PLAN.md` §9's bootstrap changes are the
  prerequisite for landing a batch this size without timing out Render's port
  scan; this batch adds 40 templates to an existing 323.
- **Per-form prefill past the heading.** As with BC, anything beyond the court
  file number and the parties is per-form work.
- **One known gap:** Form 15-78 p6 item 26 "My occupation is:" has no field. The
  government printed no rule, cell or rectangle after the caption, so nothing here
  detects it; its twin two items down does carry a rule. Guide §9.6's copy-the-twin
  sweep was written and deliberately not shipped — across 195 pages it produced a
  false positive and missed this case, and an auto-placer that adds fields set-wide
  is worse than one missing box. See `tools/sk-forms/README.md`.
- **A render of the overlay is not a render of the app** (guide §7). The pages
  reviewed here were QA renders; the templates still want a look in the viewer
  once they are imported and deployed.

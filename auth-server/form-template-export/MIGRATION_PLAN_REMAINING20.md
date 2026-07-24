# Migrating the remaining 20 Ontario forms

_Investigated 2026-07-24. Target set: 45 forms. Already migrated: 25. Remaining: 20._

## Key finding: nothing was lost in the original migration

The original migration (from `Scripts/cloud-act-api-master/public/documents/`) was **complete
relative to its source**. That source repo only ever contained **25** Ontario family-law PDFs,
and all 25 are present here (`.pdf` + `.json` field map + `catalog.json` entry, sortOrder 1–25).
A full sweep of `~/Documents/CloudAct` found **none** of the other 20 forms anywhere on disk —
they were never in the source, so they must be sourced fresh from the official site
(`ontariocourtforms.on.ca`).

## Availability of the 20 (all staged in `_incoming/`)

| # | Form | Category (proposed) | Source | Native fillable fields |
|---|------|--------------------|--------|------------------------|
| 1 | 00 – Cover / Continuing Record | Continuing Record | **NO STANDALONE GOV FORM** | — |
| 2 | 4 – Notice of Change in Representation | Representation | PDF ✓ | 19 |
| 3 | 6A – Advertisement | Service | PDF ✓ | 16 |
| 4 | 12 – Notice of Withdrawal | Representation | PDF ✓ | 24 |
| 5 | 14D – Order on Motion Without Notice | Motions | PDF ✓ | 33 |
| 6 | 17 – Conference Notice | Conferences | PDF ✓ | 24 |
| 7 | 20B – Letter of Request | Evidence/Discovery | PDF ✓ | 35 |
| 8 | 22 – Request to Admit | Evidence/Discovery | PDF ✓ | 39 |
| 9 | 23A – Summons to Witness Outside Ontario | Evidence/Discovery | PDF ✓ | 41 |
| 10 | 25F – Restraining Order | Orders | PDF ✓ | 56 |
| 11 | 25G – Restraining Order on Motion w/o Notice | Orders | PDF ✓ | 63 |
| 12 | 25H – Order Terminating Restraining Order | Orders | PDF ✓ | 40 |
| 13 | 31 – Notice of Contempt Motion | Enforcement | PDF ✓ | 41 |
| 14 | 32 – Bond (Recognizance) | Enforcement | PDF ✓ | 58 |
| 15 | 32.1 – Request to Enforce Family Arbitration Award | Enforcement | **DOCX ONLY** | — |
| 16 | 37 – Notice of Hearing | Child Protection | **DOCX ONLY** | — |
| 17 | 8B – Application (Child Protection & Status Review) | Child Protection | PDF ✓ | 131 |
| 18 | 36A – Certificate of Clerk (Divorce) | Divorce | PDF ✓ | 105 |
| 19 | 36B – Certificate of Divorce | Divorce | PDF ✓ | 37 |
| 20 | 27A – Request for Statement of Income | Financial/Disclosure | PDF ✓ | 11 |

**17 have current, already-fillable PDFs. 2 are Word-only. 1 has no standalone form.**

## What this changes vs. the original migration

The original 25 were image/flat PDFs that needed boxes drawn **by hand**. These 17 already carry
native AcroForm widgets, so their field rectangles (x/y/w/h) can be **extracted programmatically**
to auto-scaffold each `FormXX.json` overlay — most of the manual box work disappears.

Note the app's fill model is a **coordinate overlay**, not native AcroForm filling: the repo's 25
PDFs are decrypted + flattened (0 native fields) and the app draws its own `staticFields`
(x/y/w/h + `bind`) on top. So the pipeline per form is:

1. Decrypt (empty owner password) + flatten the PDF to match repo convention.
2. Extract native widget rects → generate a `FormXX.json` `staticFields` scaffold.
3. Assign `bind` paths (canonical matter data) — auto-match by field name, hand-fix the rest.
4. Add `catalog.json` entry (title, shortTitle, footerText, docId, province ON, category, sortOrder).
5. Add `audit.json` entry.
6. Verify alignment: every blank except signatures has a box (same QA pass as before).
7. Prefill bindings deferred to the existing `PREFILL_PLAN.md` track (only 8A + 13 wired so far).

## Open items needing a decision

- **Form 00 (Continuing Record cover):** no standalone government form exists. Options: build a
  simple cover template ourselves, or drop it from the set (44 forms).
- **Forms 32.1 & 37 (Word-only):** convert `.docx` → PDF (LibreOffice headless) then run the same
  pipeline. Fields will be drawn from scratch (no native widgets).
- **Ordering:** append new forms as sortOrder 26–45, or re-sequence all 45 to match the master list.

## Staged files

All downloads are in `_incoming/` (17 `.pdf`, `Form32_1.docx`, `Form37.docx`).

---

## STATUS — 2026-07-24 (executed)

**43 of 45 forms now migrated** (was 25). Catalog resequenced to master-list order
1–45 with proper categories; `audit.json` refreshed. Dry-run import passes; the
prefill resolver resolves 100% of every new form's bound heading fields with zero
dead binds introduced.

Done this pass (18 new): **Form 00** (custom Continuing Record cover, built from
scratch) + the 17 official fillable PDFs (**4, 6A, 12, 14D, 17, 20B, 22, 23A, 25F,
25G, 25H, 31, 32, 8B, 36A, 36B, 27A**).

Pipeline used for the 17: decrypt → extract the government AcroForm widget rects →
convert to the app's overlay convention (`x`=left pt, `y`=top pt, `w/h`=pt×1.5, the
convention proven from `savePdf` in `FillPdf.jsx` + `Form25A.json`) → strip
AcroForm/widgets to a clean printed background (matches the repo's 0-native-field
convention) → auto-bind the standard heading (court file/name/address, applicant,
respondent, and their lawyers) by field name → render an overlay-over-PDF QA image
per page and eyeball alignment + bounds-check every field. Because the boxes come
from the government's own widget geometry, they match the official fillable spots
exactly. XFA-named forms (6A, 20B, 22, 25F/G/H, 31, 32, 36B) get correct editable
boxes everywhere but no auto-bind (machine field names) — heading prefill for those
can be added later by position, on the PREFILL_PLAN track.

### Form 32.1 & Form 37 — DONE (user supplied Word→PDF exports)

The user saved both as PDFs into `_incoming/`. These have no AcroForm, so fields were
placed from the PDF's own vectors + text: heading boxes via `cluster_drawings()`,
checkboxes via the ☐ glyph (U+2610), body blanks via dotted-underline detection, and
`THE CHILD(REN)` grid via table-cell detection. Repeated court-file headers on later
pages are bound by locating the "Court File Number" label; signature lines are left
unboxed by design. QA-rendered every page, bounds-checked, resolver-verified.

- **Form 32.1** — sortOrder 15, category Enforcement, 68 fields (9 bound), 3 pages.
- **Form 37** — sortOrder 16, category Child Protection, 26 fields (8 bound), 2 pages.

## ALL 45 MIGRATED — catalog sortOrder 1–45 contiguous, audit excluded=0, dry-run passes.


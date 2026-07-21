# Ontario Forms — Prefill & Editability Plan

_Generated from the live templates in this folder. Numbers are exact field-map
counts. Goal for every form: **auto-fill the standard client data on first
generation, and make every remaining blank an editable text box** — the Form 8A /
Form 13 page-1 standard._

## Status — UPDATE (Phase 0 complete)

**The backend compatibility adapter is DONE** — `formPrefillCompat.js`
(`buildLegacyPrefill`) rebuilds the full legacy vocabulary from live records and
is spread over `buildPrefillData`. Verified with the real resolver against **all
25 field maps**: every bound field resolves to correct values (income yearly,
expenses monthly, special expenses, generic + structured `assets`, net-family-
property `items`, `mortgages`/`debts.items`, `theChildren`, `relationshipDates`,
`matter_data`). Backend-only, field maps unchanged → no re-import; effective on
auth-server restart, for newly generated documents. One intentionally-blank
field: `expenses.client.transportation.repairsAndMaintenance` (indistinguishable
from the housing label in the live data → left editable).

**So every form now auto-fills its existing mapped fields.** What remains per form
is the *"editable box on every blank"* part — adding NEW fields where the PDF has
a write-in area but none exists yet (needs per-form visual/OCR placement on the
image-based PDFs). Fully finished incl. new placement: **Form 8A, Form 13**.

---

## Status (original)
- **Form 8A — DONE & verified.** Page-1 general heading + page-3 family
  history/children auto-fill; backend exposes `age`/`dateOfBirth`/`residence`;
  bootstrap re-imports a template when its field map changes (auto-deploy).

## The recipe (what worked on Form 8A)
1. Extract label + table-grid coordinates from the PDF (PyMuPDF), don't eyeball.
2. Bind to the **live** prefill vocabulary the backend actually produces.
3. Render an overlay of the proposed boxes over the PDF and eyeball alignment.
4. Run the real `formPrefillResolver` against sample data to prove binds resolve.
5. Every placed field is editable; bound ones just start filled.
6. Dry-run validate, commit; bootstrap auto-re-imports on mapping change.

## TWO HARD CONSTRAINTS discovered (read before starting any form)

### 1. Only Form 8A has a PDF text layer — the other 24 are image-based
`PyMuPDF` returns **0 characters** for every other PDF, so step 1 above (auto-
extract label coordinates) only worked for 8A. For the rest, placement must come
from **existing field positions in the JSON** (already placed via the old Form
Mapper) plus **rendered-image visual verification**. To place *new* fields
accurately, install OCR: `brew install tesseract && pip install pytesseract`,
then OCR each page image to recover label boxes. (Not currently installed.)

### 2. Bind-vocabulary mismatch — many 'bound' fields DON'T auto-fill today
The existing maps were authored for the **old cloud-act-api** data shape. The
current auth-server `buildPrefillData` produces a **different** vocabulary, so
binds only resolve when the root matches. Classification used below:

- **Reliable (resolves now):** `court_info`, `applicant`, `respondent`,
  `applicantsLawyer`, `respondentsLawyer`, `children`, `relationship` (+`matter`,
  `court`, `profile`). Verified end-to-end on Form 8A.
- **Uncertain (root exists, sub-paths likely mismatch):** `income`, `expenses`,
  `assets`, `debts`, `employmentStatus`, `support` — need shape verification.
- **Dead (root not produced → never fills):** `theChildren`, `relationshipDates`,
  `specialExpenses`, `mortgages`, `items`, `lineofcredits`, `otherloans`,
  `outstandingcreditcardbalances`, `unpaidsupportamounts`, `otherdebts`,
  `matter_data`.

## Strategy (highest leverage first)
**Phase 0 — Backend compatibility adapter (do this once, before per-form work).**
Extend `buildPrefillData` to also expose the legacy vocabulary, mapped from the
live matter records. This lights up hundreds of already-placed bound fields across
~20 forms with zero repositioning. Required translations (verify each shape):

| Legacy bind | Maps from (live record) |
|---|---|
| `theChildren[i].fullLegalName` | `children[i].childName` |
| `theChildren[i].age` | `children[i].age` |
| `theChildren[i].birthdate` | `children[i].dateOfBirth` |
| `theChildren[i].nowLivingWith` | `children[i].nowLivesWith` |
| `theChildren[i].muncipilityAndProvince` | not captured → leave editable |
| `relationshipDates.marriedOn.date` | `relationship.data.dateOfMarriage` |
| `relationshipDates.startedLivingTogetherOn.date` | `relationship.data.startedLivingTogether` |
| `relationshipDates.separatedOn.date` | `relationship.data.dateOfSeparation` |
| `relationshipDates.*.checked` | derive boolean from the matching date/flag |
| `income.client.*` / `expenses.client.*` | incomeBenefits / expenses records (field-level map) |
| `assets.bank[i]` / `mortgages[i]` / `items[i]` | assets record sub-collections (field-level map) |
| `specialExpenses.client[i]` | expenses.specialChildExpenses |
| `employmentStatus.client.*` | employment record (Client row) |
| `debts.items[i]` | debt record rows |

**Phase 1 — Per-form pass** (order below): verify the heading fills, add missing
standard fields, and drop editable text boxes on every remaining blank. Use the
existing positions + rendered-image checks (OCR where new placement is needed).

## Reusable assets already built
- Prefill vocabulary + `ageFromDob` + `residence` (formsRoutes `buildPrefillData`).
- Checksum-drift bootstrap (`bootstrap-forms.js`) → edits deploy on restart.
- PyMuPDF extract + overlay-verify workflow.
- The general-heading bind set (identical on every form's page 1).

## Per-form coverage (exact)

| # | Form | Pages | Fields | Bound | Reliable | Uncertain | Dead | Editable-only |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| 1 | Form 8A (Form8A) | 6 | 64 | 52 | 52 | 0 | 0 | 12 |
| 2 | Form 13 (Form13) | 8 | 324 | 208 | 26 | 121 | 61 | 116 |
| 3 | Form 13.1 (Form13_1) | 10 | 405 | 309 | 27 | 236 | 46 | 96 |
| 4 | Form 13.A (Form13A) | 7 | 621 | 25 | 25 | 0 | 0 | 596 |
| 5 | Form 13.B (Form13B) | 3 | 191 | 145 | 14 | 0 | 131 | 46 |
| 6 | Form 6 (Form6) | 1 | 32 | 4 | 4 | 0 | 0 | 28 |
| 7 | Form 6B (Form6B) | 3 | 104 | 11 | 11 | 0 | 0 | 93 |
| 8 | Form 8 (Form8) | 5 | 141 | 60 | 18 | 0 | 42 | 81 |
| 9 | Form 10 (Form10) | 5 | 83 | 23 | 23 | 0 | 0 | 60 |
| 10 | Form 10A (Form10A) | 2 | 23 | 13 | 13 | 0 | 0 | 10 |
| 11 | Form 14 (Form14) | 2 | 15 | 8 | 8 | 0 | 0 | 7 |
| 12 | Form 14A (Form14A) | 2 | 21 | 14 | 14 | 0 | 0 | 7 |
| 13 | Form 14B (Form14B) | 3 | 23 | 9 | 8 | 0 | 1 | 14 |
| 14 | Form 14C (Form14C) | 2 | 51 | 9 | 9 | 0 | 0 | 42 |
| 15 | Form 15 (Form15) | 8 | 156 | 48 | 29 | 0 | 19 | 108 |
| 16 | Form 15B (Form15B) | 7 | 133 | 24 | 24 | 0 | 0 | 109 |
| 17 | Form 15C (Form15C) | 5 | 167 | 35 | 23 | 0 | 12 | 132 |
| 18 | Form 17A (Form17A) | 4 | 120 | 39 | 12 | 0 | 27 | 81 |
| 19 | Form 17C (Form17C) | 5 | 115 | 39 | 13 | 0 | 26 | 76 |
| 20 | Form 17E (Form17E) | 5 | 156 | 11 | 11 | 0 | 0 | 145 |
| 21 | Form 23 (Form23) | 2 | 28 | 12 | 12 | 0 | 0 | 16 |
| 22 | Form 25 (Form25) | 2 | 21 | 8 | 8 | 0 | 0 | 13 |
| 23 | Form 25A (Form25A) | 2 | 26 | 12 | 12 | 0 | 0 | 14 |
| 24 | Form 26B (Form26B) | 2 | 32 | 8 | 8 | 0 | 0 | 24 |
| 25 | Form 36 (Form36) | 4 | 75 | 22 | 10 | 0 | 12 | 53 |

- **Reliable** = bound fields that auto-fill today.
- **Dead** = bound fields using legacy vocab (fixed wholesale by Phase 0).
- **Editable-only** = fields with no bind (already user-editable).
- Blank spots with *no field at all* still need editable boxes added (Phase 1).

## Recommended sequence
0. **Phase 0 backend adapter** (unblocks dead binds across all forms).
1. **Finish Form 8A** editable boxes on pages 2/4/5/6.
2. **Verify tier:** Form 13, Form 13.1, Form 13.B (highest existing coverage).
3. **Form 8** (General Application) — sibling of 8A, reuses its field set.
4. **Light forms:** 6, 6B, 10A, 14, 14A, 14B, 14C, 23, 25, 25A, 26B.
5. **Heavy forms:** 10, 15, 15B, 15C, 17A, 17C, 17E, 36, 13.A.

## Per-form detail

### 1. Form 8A — Form 8A - Application (Divorce)
`Form8A` · 6 pages · 64 fields (52 bound / 12 editable-only)

- **Auto-fills today (reliable):** 52 fields — `applicant, applicantsLawyer, children, court_info, relationship, respondent, respondentsLawyer`
- **Plan:** DONE for pages 1 & 3. Remaining: editable boxes on pages 2/4/5/6.

### 2. Form 13 — Form 13 - Financial Statement (Support Claims)
`Form13` · 8 pages · 324 fields (208 bound / 116 editable-only)

- **Auto-fills today (reliable):** 26 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Uncertain (verify shape):** 121 fields — `assets, expenses, income`
- **Dead legacy binds (fix via Phase 0):** 61 fields — `lineofcredits, mortgages, otherdebts, otherloans, outstandingcreditcardbalances, specialExpenses, unpaidsupportamounts`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; verify financial sub-paths; add editable boxes on remaining blanks.

### 3. Form 13.1 — Form 13.1 - Financial Statement (Property and Support Claims)
`Form13_1` · 10 pages · 405 fields (309 bound / 96 editable-only)

- **Auto-fills today (reliable):** 27 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Uncertain (verify shape):** 236 fields — `assets, debts, employmentStatus, expenses, income`
- **Dead legacy binds (fix via Phase 0):** 46 fields — `items, specialExpenses`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; verify financial sub-paths; add editable boxes on remaining blanks.

### 4. Form 13.A — Form 13.A - Certificate of Financial Disclosure
`Form13A` · 7 pages · 621 fields (25 bound / 596 editable-only)

- **Auto-fills today (reliable):** 25 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 5. Form 13.B — Form 13.B - Net Family Property
`Form13B` · 3 pages · 191 fields (145 bound / 46 editable-only)

- **Auto-fills today (reliable):** 14 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 131 fields — `items`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

### 6. Form 6 — Form 6: Acknowledgement of Service
`Form6` · 1 pages · 32 fields (4 bound / 28 editable-only)

- **Auto-fills today (reliable):** 4 fields — `applicant, court_info`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 7. Form 6B — Form 6B : Affidavit of Service
`Form6B` · 3 pages · 104 fields (11 bound / 93 editable-only)

- **Auto-fills today (reliable):** 11 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 8. Form 8 — Form 8: Application (General)
`Form8` · 5 pages · 141 fields (60 bound / 81 editable-only)

- **Auto-fills today (reliable):** 18 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 42 fields — `relationshipDates, theChildren`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

### 9. Form 10 — Form 10: Answer
`Form10` · 5 pages · 83 fields (23 bound / 60 editable-only)

- **Auto-fills today (reliable):** 23 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 10. Form 10A — Form 10A: Reply
`Form10A` · 2 pages · 23 fields (13 bound / 10 editable-only)

- **Auto-fills today (reliable):** 13 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 11. Form 14 — Form 14: Notice of Motion
`Form14` · 2 pages · 15 fields (8 bound / 7 editable-only)

- **Auto-fills today (reliable):** 8 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 12. Form 14A — Form 14A: Affidavit (General - Case Reports)
`Form14A` · 2 pages · 21 fields (14 bound / 7 editable-only)

- **Auto-fills today (reliable):** 14 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 13. Form 14B — Form 14B: Motion Form
`Form14B` · 3 pages · 23 fields (9 bound / 14 editable-only)

- **Auto-fills today (reliable):** 8 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 1 fields — `matter_data`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

### 14. Form 14C — Form 14C : Confirmation of motion
`Form14C` · 2 pages · 51 fields (9 bound / 42 editable-only)

- **Auto-fills today (reliable):** 9 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 15. Form 15 — Form 15: Motion to Change
`Form15` · 8 pages · 156 fields (48 bound / 108 editable-only)

- **Auto-fills today (reliable):** 29 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 19 fields — `relationshipDates, theChildren`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

### 16. Form 15B — Form 15B: Response to Motion to Change
`Form15B` · 7 pages · 133 fields (24 bound / 109 editable-only)

- **Auto-fills today (reliable):** 24 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 17. Form 15C — Form 15C: Consent Motion to Change
`Form15C` · 5 pages · 167 fields (35 bound / 132 editable-only)

- **Auto-fills today (reliable):** 23 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 12 fields — `theChildren`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

### 18. Form 17A — Form 17A: Case Conference Brief - General
`Form17A` · 4 pages · 120 fields (39 bound / 81 editable-only)

- **Auto-fills today (reliable):** 12 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 27 fields — `relationshipDates, theChildren`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

### 19. Form 17C — Form 17C: Settlement Conference Brief - General
`Form17C` · 5 pages · 115 fields (39 bound / 76 editable-only)

- **Auto-fills today (reliable):** 13 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 26 fields — `relationshipDates, theChildren`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

### 20. Form 17E — Form 17E: Trial management conference brief
`Form17E` · 5 pages · 156 fields (11 bound / 145 editable-only)

- **Auto-fills today (reliable):** 11 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 21. Form 23 — Form 23: Summons to Witness
`Form23` · 2 pages · 28 fields (12 bound / 16 editable-only)

- **Auto-fills today (reliable):** 12 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 22. Form 25 — Form 25: Order (General)
`Form25` · 2 pages · 21 fields (8 bound / 13 editable-only)

- **Auto-fills today (reliable):** 8 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 23. Form 25A — Form 25A: Divorce Order
`Form25A` · 2 pages · 26 fields (12 bound / 14 editable-only)

- **Auto-fills today (reliable):** 12 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 24. Form 26B — Form 26B: Affidavit for Filing Domestic Contract with Court
`Form26B` · 2 pages · 32 fields (8 bound / 24 editable-only)

- **Auto-fills today (reliable):** 8 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Plan:** confirm page-1 heading fills; add editable boxes on remaining blanks.

### 25. Form 36 — Form 36: Affidavit for Divorce
`Form36` · 4 pages · 75 fields (22 bound / 53 editable-only)

- **Auto-fills today (reliable):** 10 fields — `applicant, applicantsLawyer, court_info, respondent, respondentsLawyer`
- **Dead legacy binds (fix via Phase 0):** 12 fields — `theChildren`
- **Plan:** confirm page-1 heading fills; Phase 0 revives the dead binds; add editable boxes on remaining blanks.

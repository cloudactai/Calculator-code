# Manitoba Forms Migration — status

_Written 2026-08-14. Companion to `SK_MIGRATION_PLAN.md` and `BC_MIGRATION_PLAN.md`.
The build tooling and the full "why" live in `auth-server/tools/mb-forms/README.md`._

---

## STATUS — batch 1 (Financial) complete

**Shipped: 5 of 43** Rule 70 family-law forms — the Financial category —
catalog rows 401–405, `npm run forms:validate-export` green, **723 fields, zero
findings across 14 gates**, 20 prefill binds, and no Ontario, BC or Saskatchewan
template touched.

Financial forms were built and reviewed first, as asked. The remaining 38 are
already catalogued, fetched and verified in `mb_sources.py`; shipping a category
is one edit to `SHIPPED_CATEGORIES`, then build → verify → merge → rebind.

| Form | Title | Pages | Fields |
| --- | --- | --- | --- |
| 70D | Financial Statement | 8 | 285 |
| 70D.1 | Demand for Financial Information | 3 | 12 |
| 70D.5 | Comparative Family Property Statement | 6 | 272 |
| 70U | Summary of Assets and Liabilities | 13 | 104 |
| 70W | Recalculation and Enforcement Information Form | 1 | 50 |

Remaining, recorded and fetched but not yet built: Pleadings (6), Applications
(10), Case Management (8), Service (2), Affidavits (3), Orders & Judgments (5),
Enforcement (2), Other (2).

---

## Scope

**Rule 70 of the Court of King's Bench Rules** — the family part — published by
Manitoba Justice at `web2.gov.mb.ca/laws/rules/`. The civil parts and the probate
forms are out of scope, matching what Ontario, BC and Saskatchewan ship.

There is one court and one division (Court of King's Bench, Family Division), so
like Saskatchewan and unlike BC there is no court-level split to encode.
Categories carry the function only, prefixed "King's Bench –" so the picker reads
consistently beside Saskatchewan's.

The **five financial forms** are the ones a support or property calculation
actually needs: 70D is the mandatory financial statement under Rule 70.07
(annual income, monthly expenses, assets, debts), 70U and 70D.5 are the property
statements, 70D.1 is the disclosure demand, and 70W is what goes to the
Maintenance Enforcement Program and the Child Support Service.

---

## What was new about Manitoba

Each province so far has reached the same overlay convention from a different
source. Ontario is largely **scanned images**; BC is **AcroForm** (Provincial)
and **XFA needing a headless flatten** (Supreme); Saskatchewan is **static
Word-derived PDFs whose blanks are printed underscore runs**.

Manitoba is static Word-derived PDFs too — no widgets, no XFA on any of the 43 —
but **its blanks are drawn geometry, not underscores**. A Manitoba writing line
is a filled rectangle about 0.8pt tall (or, on Form 70U, a stroked line). Across
the financial batch there are 1,528 of those against 12 underscore runs, so the
Saskatchewan detector run unchanged over these forms finds almost nothing.

That one difference carries the batch's main hazard: **Word draws an underline
under printed text with the very same primitive**. Telling a heading's underline
from a blank is a measurement — an underline is covered by glyphs over 94–95% of
its length, a writing rule over 0% — and the verifier checks it in both
directions.

Three further Manitoba-specific shapes, each of which cost a defect before it was
understood:

- **The jurat has no caption.** Manitoba sets its jurat as two columns joined by
  a run of `)` characters, with the deponent's signature rule to the right of
  them and no caption anywhere near it. No caption rule can reach it; the bracket
  column is the anchor.
- **A cell can ask its own question.** Saskatchewan's "a named cell is not a
  field" is right there and wrong here: Form 70W prints "Address:", "Date of
  Birth:", "Social Insurance Number:" and expects the answer after the colon in
  the same cell.
- **The style of cause is captioned from below**, and on Form 70U is drawn no
  rule at all — just blank paper with `(full name),` under it.

---

## Prefill

20 fields bind. The court file number on every page that prints one, and the
applicant and respondent on 70D, 70D.1 and 70U.

Deliberately unbound, with the reasoning in `mb_binds.py`: the **judicial
centre** (the matter has no such field, and a wrong centre on a court document is
worse than a blank one — the same call BC's registry line and Saskatchewan's
JUDICIAL CENTRE got); **Form 70W's payor and payee contact tables** (which party
pays depends on the support order, which the matter does not record, and the
failure mode is one party's SIN printed under the other's name on a form that
goes to Maintenance Enforcement); and the **strike-out captions** —
"(Petitioner/Respondent)", "the initiating party/responding party" — which by
construction do not say which party is the client.

---

## Gates

`verify_mb.py` re-derives every check from the government's page rather than
comparing against what the builder stored, and where the builder makes a
judgement it calls the builder's own rule again, so a mistake has to be made
twice in the same way to get through.

printed-text coverage · checkbox-on-a-printed-square · **unfilled rules** ·
unfilled underscore blanks · signature rules · **fields on underlines** · amount
seating · vertical stacking · edge clearance · dollar slots · bounds · duplicate
ids · shared positions · box overlap and slivers.

**Zero findings.** The build is idempotent — two runs produce byte-identical
maps — and every background PDF ships byte-identical to the file Manitoba
Justice published, so a re-fetch can be diffed against what we ship.

---

## Frontend

No change was needed. `CreateNewFormPage` groups whatever categories the API
returns, and `provinceCodeOf` already maps "Manitoba" → `MB`
(`cloudact-ui/src/utils/canadianProvinces.js`). A matter whose province is
Manitoba now shows a "King's Bench – Financial" folder with these five forms.

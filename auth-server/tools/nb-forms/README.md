# New Brunswick forms pipeline

Builds the New Brunswick templates in `form-template-export/` from the Court of
King's Bench (Family Division)'s own forms page. Everything here is a build tool
— the repo ships only the produced `NBKB_*.pdf/.json` plus `catalog.json`.
Staging lives in the gitignored `form-template-export/_incoming_nb/`.

Requires Python 3 with PyMuPDF (`fitz`). No Chrome, no Adobe, no LibreOffice.

## Scope

**34 forms, 224 pages, 3,737 fields, 68 binds, zero findings.** Catalogue rows
3401–3434.

The whole of the court's Family Division forms page:

| Rule | What it is | Forms |
| --- | --- | --- |
| 72 | Divorce Proceedings | 72A–72O, 72U, 72FF |
| 73 | Family Division | 73A, 73AA, 73F, 73G, 73H, 73I |
| 81 | Family Law Rule (case-management districts) | 81A–81C, 81F–81I |
| 7, 18, 37, 47 | general procedure, listed by the court on its family page | 7A, 18A, 37A, 47B |

The general-procedure four are in scope for the reason the court lists them
there: a family proceeding uses them. The civil rules and the probate forms are
out of scope, matching every other province in this catalogue.

### Recorded, not yet built

The court's page also links two **regulations**, each carrying its own schedule
of forms as continuous enacted text: **NB Reg 2021-18** (Family Law Act forms)
and **NB Reg 81-134** (Family Services Act forms, which is where New
Brunswick's child protection lives). Those are a separate batch on the pattern
BC batch 3, SK adoption and MB batch 2 all follow — cut each form out of the
consolidation at its own enacting heading. **Not excluded by decision, just not
built yet.**

Six `.docx` drafting aids are also linked (a notice of application, a notice of
motion, two FOAEAA affidavits and four draft orders). Those are Word templates a
lawyer edits rather than prescribed forms with blanks to fill; they would take
the Nova Scotia LibreOffice path.

## 1. Refresh the index (optional)

```
python3 scrape_nb_index.py
```

Rewrites `nb_sources.json` from the court's page, which lists one form per
`<li>` with **two** links — the printed form and the fillable one:

```html
<li>Answer - <a href=".../FORM-72d-e.pdf">72D</a>
             - <a href=".../Form_72D.pdf">Fillable</a></li>
```

**Neither filename is derivable from the form number.** 72D is served as
`Form_72D.pdf`, 72C as `CSS-FOL-SNB-45-9048E.pdf`, 72A as
`FORM-fillable-72a-b.pdf`, and the two links sit on different hosts
(`www2.gnb.ca` and Service New Brunswick's `pxw1.snb.ca`). There is no pattern
to reconstruct, which is why the links are scraped and recorded rather than
built — Manitoba's slugs *are* derivable, New Brunswick's are not, and
pretending otherwise fetches the wrong form silently.

## 2. Fetch and verify sources (gates A, B)

```
python3 fetch_nb.py
```

Verifies PDF magic, page count, footer, AcroForm/XFA/static classification, and
that the file prints its own form number. Writes `manifest.json` with sha256 and
byte size. Downloads are cached.

The form-number check uses a **non-word boundary on the right**: `72F` must not
match inside `72FF`, which is a different form.

29 of the 34 come back AcroForm. The other five are in `fetch_nb.KNOWN_STATIC`;
a form *newly* losing its widget layer is reported as a problem rather than
absorbed.

> `curl`, not Python's HTTP client: TLS-inspecting proxy whose root is in the
> system trust store but not in certifi. Every province's fetcher shells out.

## 3. Build

```
python3 build_nb_forms.py [--only NBKB_72J] [--category Financial] [--promote]
```

The 29 AcroForm sources convert straight from the government's widget
rectangles via `bc_pipeline.extract`, then run the seating passes shared with
Newfoundland in **`tools/acroform_seat.py`** — checkboxes seated on their
printed square (349 of them), single-line text fields re-cut to the 13.3 pt
printed line and sat on their rule (2,197 of them), and any field wholly off the
sheet dropped and reported. The BC refinement passes stay off, for the reason
the Ontario builder records.

### The five forms with no boxes, and why

`7A`, `72FF`, `72M`, `72N` and `72O` ship as a **background with zero fields**.
They are not fillable PDFs that lost their widgets: they are the Rules of
Court's own *"APPENDIX OF FORMS"* text, set as continuous prose with
parenthetical instructions where a blank would be —

```
FORM 72M  DIVORCE JUDGMENT  (Court, Court File Number, Style of Cause)
```

— and **no printed blank anywhere on the page**: zero underscore runs, zero dot
leaders, three or four drawings for the whole sheet. Inventing a box where the
page prints no anchor is the one thing every province's builder refuses to do,
and there is nothing here to anchor to. Three of the five (72M, 72N Divorce
Judgment, 72O Certificate of Divorce) are issued by the court rather than
completed by a party anyway — the same character as Ontario's 37A–37E.

**Render the pages and look at them.** `_incoming_nb/qa/<docId>_qa.pdf` is
written on every build. Newfoundland's batch shipped a 156 pt seating error past
a gate that reported zero findings; only the render showed it.

## 4. Catalogue

```
python3 merge_nb_catalog.py
```

Rewrites the NB block of `catalog.json` and regenerates `audit.json`. The block
start is **derived** from what the other provinces currently occupy, not
hardcoded — SK's merger hardcoded 301 and MB's 401 and both drifted into a
neighbour's block as the catalogue grew.

## 5. Prefill binds

```
python3 rebind_nb_forms.py [--check]
```

Writes back only the `bind` key, asserts every other key is byte-identical
first, no-ops on a second run.

New Brunswick's widget names are far better than Newfoundland's — real names
like `court file number`, `applicant`, `respondent` rather than Acrobat's guess
at the nearest text. **They still lie**, and that is why nothing binds on a name
alone:

```
Form 81A page 6:  widget "APPLICANT",  caption printed to its left: "Age:"
Form 81A page 7:  widget "RESPONDENT", caption printed to its left: "Age:"
```

Those are columns of a parties table. Binding on the name would have printed a
full legal name into a box asking for an age, on a sworn document. So a party
name is bound only when the widget name **and** the page agree: the field is in
the heading block (page 1, above y = 340, where every form in this batch sets
its style of cause) and its printed left caption is not disqualifying (`age`,
`date of birth`, `occupation`, `address`, …). Form 81A ends up with **no** party
binds, which is the correct answer.

The court file number needs no corroboration: `court file number` is printed in
the header on 23 of the 34 forms and has no second sense anywhere in the batch.

## 6. Verify

```
python3 verify_nb.py
npm run forms:validate-export     # from auth-server/
```

Runs over what is actually in `form-template-export/`: files present, background
flattened, geometry in bounds, no field off the sheet, every checkbox covering
printed ink, binds from a known vocabulary, catalogue `pageCount` against the
PDF.

One documented exemption, `INK_EXEMPT`: Form 72J page 13 sets *"IMPORTANT:
Calculations will not work properly unless this box is checked"* beside a widget
that prints no square of its own — the government's PDF relies on the widget's
border to draw it. Our overlay is the only box there and sits exactly where the
caption expects it. It is listed by `(docId, page)` so a *new* unseated checkbox
still fails the gate.

## Overlay convention

Unchanged: `field.x` = box left in points, `field.y` = box top in points (y
down), `width`/`height` = points × 1.5, and `FillPdf.savePdf` stamps
`y = pageH − field.y − height/1.5`.

# Newfoundland and Labrador forms pipeline

Builds the Newfoundland templates in `form-template-export/` from the Supreme
Court's own Family Law Forms page. Everything here is a build tool — the repo
ships only the produced `NLSC_*.pdf/.json` plus `catalog.json`. Staging lives in
the gitignored `form-template-export/_incoming_nl/`.

Requires Python 3 with PyMuPDF (`fitz`). **No Chrome, no Adobe, no LibreOffice**:
unlike BC and PEI nothing here is XFA, and unlike Nova Scotia nothing has to be
rendered from Word.

## Scope

**62 forms, 352 pages, 4,424 fields, 84 binds, zero findings.** Catalogue rows
3301–3362.

The whole of the Supreme Court (Family Division) **Family Law Forms** page: 45
rule-numbered forms (F4.03A … F40.04A, including the six `F16A.*` FOAEAA
affidavits) and 17 the court publishes with **no** number — the three order
templates, the three FOAEAA orders, "Affidavit (Family Law)", "Subpoena",
"Settlement Conference Brief", the representation notices and the file-access
Undertaking.

Those 17 are in scope on the same footing as the numbered ones: they are
ordinary filing documents, not drafting aids, and a lawyer reaches for the
blank Order template as often as anything on the page. They simply have no
number to key on, so `scrape_nl_index.py` gives each a slug docId built from its
printed title.

Civil, criminal, probate and guardianship proceedings are out of scope, matching
the Ontario, BC, Saskatchewan and Manitoba catalogues — the court lists those
under their own tabs.

> **Child protection and adoption are not here.** Newfoundland runs both under
> the *Children, Youth and Families Act* rather than the Family Rules, and the
> court's family page prescribes neither. That is the same split BC, SK and MB
> all have, and it means a second batch is where those belong — not a gap in
> this one. Nothing has been excluded by defect.

## 1. Refresh the index (optional)

```
python3 scrape_nl_index.py
```

Rewrites `nl_sources.json` from the court's own table — every form number,
title, PDF link and Word link. Run it when the court publishes a new edition;
otherwise the committed copy is enough.

Two parsing rules here are load-bearing, both learned from dropping real forms:
the `Form ` prefix is optional (only the six FOAEAA affidavits carry it, and
requiring the bare number silently dropped all six), and a row with no number at
all is kept rather than skipped.

## 2. Fetch and verify sources (gates A, B)

```
python3 fetch_nl.py
```

Downloads into `_incoming_nl/`, verifies PDF magic, reads the page count,
captures the footer/revision line, classifies AcroForm / XFA / static, and
checks the file identifies itself as the form we asked for. Writes
`manifest.json` with sha256 and byte size. Downloads are cached.

All 62 come back **AcroForm** except two, listed in `fetch_nl.KNOWN_STATIC`. A
*third* form losing its widget layer is reported as a problem rather than
absorbed.

> `curl`, not Python's HTTP client: this box sits behind a TLS-inspecting proxy
> whose root is in the system trust store but not in certifi. The BC, SK and MB
> fetchers shell out for the same reason.

The identity check for the 17 unnumbered rows is the **court's own imprint**,
not their title words. The court's index names a form differently from the
form's own heading often enough that title matching is useless as a gate — the
row "Order (Blank)" prints "Order (Family Law)", and "Affidavit (filing
contracts and agreements pursuant to s. 42 …)" prints "Affidavit – Sections 42
and 65(5) of the Family Law Act". Both were flagged while being exactly the
right file.

## 3. Build

```
python3 build_nl_forms.py [--only NLSC_F10_02A] [--category Financial] [--promote]
```

**Sixty of the 62 are AcroForm**, so the government's widget rectangles are
ground truth and the overlay is converted straight from them by
`bc_pipeline.extract`. The BC refinement passes (mark snapping, ruled-block
expansion, amount sizing) are deliberately **not** run, for the reason the
Ontario builder records: they exist to recover geometry XFA never emitted
properly, and moving a real AcroForm rectangle can only make placement worse.

Three passes *are* run, each against a defect this batch actually has:

| Pass | Why | Effect |
| --- | --- | --- |
| `seat_checkboxes` | NL option widgets measure 9.8 × 7.7 — not square, and bigger than the printed box, so the control overhangs it | 1,552 options seated on their printed square |
| `refit_text_fields` | widget rect median height 18.8 pt against a 13.3 pt printed line (p90 = 30.5); the editor top-aligns, so text floats above the rule | 1,791 lines re-cut and sat on their rule |
| `drop_offpage_fields` | Form F4.03A's source carries a checkbox at y = 796.02 on a 792 pt page — wholly below the paper | 1 field dropped, and reported |

**Two forms are flat** — the Settlement Conference Brief and the file-access
Undertaking carry no widget layer. Their blanks print as underscore runs, so
they take a printed-anchor path (the Saskatchewan vocabulary, and nothing more:
they have no option squares and no ruled grids, so no other detector is guessed
at).

### The bug this batch cost, and how it was found

`page_geom.hrules` returns **`(y, x0, x1)`** — the height is element **0**.
`refit_text_fields` first read element `1`, which seated every box against an
*x* coordinate. Fields moved by up to **156 pt**, boxes stacked on each other
and ran off the panel edge — and `check_geometry` still reported **zero
findings**, because a field moved to a wrong place on the same page is still in
bounds.

It was caught by opening the QA render and looking at it. That is the fourth
province in a row where the gates passed a batch the eye rejected, so: **render
the pages, and look at them.** `_incoming_nl/qa/<docId>_qa.pdf` is written on
every build, colour-coded by field type.

## 4. Catalogue

```
python3 merge_nl_catalog.py
```

Rewrites the NL block of `catalog.json` and regenerates `audit.json`. The block
start is **derived** from whatever the other provinces currently occupy, not
hardcoded: Saskatchewan's merger hardcoded 301 and Manitoba's 401, and both
quietly drifted into a neighbour's block as the catalogue grew, so re-running
the tool silently moved a whole province on top of another. **Re-running a
catalog tool is not side-effect free** unless it derives.

sortOrder is province-scoped (the API orders within a province filter), so ON's
1–135 and BC's 101–313 overlapping is not a collision.

## 5. Prefill binds, after the boxes are approved

```
python3 rebind_nl_forms.py [--check]
```

Writes back only the `bind` key, asserts every other key is byte-identical
first, and leaves any bind already present alone. A second run is a no-op.

**The party role is read from the word printed to the *right* of the box**,
which is the opposite of BC and Saskatchewan (both captioned from the left) and
is the whole reason this province needs its own binder:

```
BETWEEN:  [_______________]  APPLICANT
AND:      [_______________]  RESPONDENT
```

**Widget names are not trusted, and the reason is measurable.** Acrobat
auto-named these fields from whatever text sat nearest when the form was built,
so the applicant's box on F4.03A is named `between` and the respondent's is
named `and` — and `and` occurs 41 times across the batch on boxes with nothing
to do with a party. This is Ontario's "a widget's name can lie — check the
printed page, not the name", applied before it could cost a defect rather than
after.

Deliberately left blank:

- **The court file number, on most forms.** Newfoundland prints it inside a
  panel headed "FOR COURT USE ONLY" and publishes no widget inside that panel —
  the registry completes it. Where a form offers a file-number box outside that
  panel it is bound (Subpoena is the one that does).
- **The second-party line.** "SECOND APPLICANT" / "SECOND RESPONDENT" sits
  beside a "NOT APPLICABLE" tick; the matter has one applicant and one
  respondent and nothing says which role a second party takes. Same position
  BC's numbered-party lines are in.

## 6. Verify

```
python3 verify_nl.py
npm run forms:validate-export     # from auth-server/
```

Runs over what is actually in `form-template-export/`, so it catches a promote
that copied the wrong file as well as a build that produced a bad one: files
present, background flattened (no native widgets left), geometry in bounds, no
field off the sheet, **every checkbox covering printed ink** (an unseated one
covers none), binds drawn from a known vocabulary, and catalogue `pageCount`
against the PDF. The two flat forms run a reduced set — they have no widgets to
compare against.

## The Provincial Court batch — 34 forms

**34 forms, 61 pages, 1,465 fields, zero findings.** Newfoundland now ships 96.

```
python3 fetch_nl_pc.py                      # gates A + B
python3 build_nl_pc_forms.py [--group epo] [--promote]
python3 merge_nl_catalog.py                 # merges both batches
python3 rebind_nl_forms.py [--check]        # covers NLSC_, NLPC_, NLEPO_
python3 verify_nl.py
```

The 62 forms above are all **Supreme Court**. That is half of Newfoundland's
family practice: outside the Avalon Peninsula and the west coast a family
application is filed in the **Provincial Court**, under its own Family Rules and
its own forms, and a matter in Labrador could not be started on anything the
catalogue held. Those rules also govern the Adoption Act, the Children Youth and
Families Act and the rest — which is where Newfoundland's child-protection forms
turned out to live: in the general application set, not in a family of their own.

| Group | Forms | docId |
| --- | --- | --- |
| Family application | 16 | `NLPC_*` |
| Adult adoption | 6 | `NLPC_AF*` |
| Emergency protection orders | 12 | `NLEPO_*` |

The **emergency-protection set** is published on its own page under the *Family
Violence Protection Act*, which is why the first pass missed it. Peace bonds
(criminal), small claims and the duty-judge schedule are on those same pages and
are out of scope.

### Three things this batch cost

1. **Text extraction on these files is lossy.** Form 2's heading comes back as
   "IN THE PROVIN D LABRADOR" and its "BETWEEN:" as "E N:" — the font's
   ToUnicode map drops characters. The page renders perfectly; only the
   extraction is damaged. The fetch gate matches "Labrador" *or* "Provincial
   Court" because of it, and it is the reason no printed-anchor detector should
   ever be pointed at the AcroForm files here.
2. **One page can print blanks three ways.** Form 003 of the protection set uses
   drawn rules for its party lines and the glyph U+2610 for its options, and no
   underscore anywhere: the Saskatchewan detector alone found **zero** boxes on
   it. `nl_pc_anchors.py` adds drawn rules and drawn squares, and Nova Scotia's
   `tick_boxes` supplies the glyph. What separates a writing rule from a frame
   border is a **printed label to its left on the line's own baseline** — that
   one test rejects the quotation-box borders and heading rules without
   enumerating them.
3. **A form with no blanks gets no boxes.** The Financial Information Sheet is a
   page of instructions about what to attach. It ships with zero fields, and
   that is the correct answer, not a gap.

`INK_EXEMPT` gains two entries: Forms 4 and 6 mark their options with an
**underscore run** rather than a square ("__ Original (Court)", "_____ Case
Conference"), so the government's widget sits beside a line and covers no ink.

## Overlay convention

Unchanged from every other province: `field.x` = box left in points, `field.y` =
box top in points (y down), `width`/`height` = points × 1.5, and
`FillPdf.savePdf` stamps `y = pageH − field.y − height/1.5`.

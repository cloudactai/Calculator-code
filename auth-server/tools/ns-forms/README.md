# Nova Scotia forms pipeline

Builds the Nova Scotia templates in `form-template-export/` from the Courts of
Nova Scotia's own forms pages. Everything here is a build tool — the repo ships
only the produced `NSSC_*/NSFD_*.pdf/.json` plus `catalog.json`. Staging lives
in the gitignored `form-template-export/_incoming_ns/`.

Requires Python 3 with PyMuPDF (`fitz`) and **LibreOffice**. No Chrome, no
Adobe.

## Scope

**84 forms, 227 pages, 2,249 fields, 103 binds, zero findings.** Catalogue rows
3501–3584.

| Rule | What it is | Forms |
| --- | --- | --- |
| 59 | Family Division Rules | 24 |
| 60A | Child and Adult Protection | 35 |
| 61 | Adoption | 4 |
| FD | Family Division Practice Memorandum (FD1–FD14, FDO1–FDO6) | 21 |

Nova Scotia is **the only province in this catalogue whose child-protection and
adoption forms are prescribed by the court's own rules** rather than by a
regulation — Rules 60A and 61 are part of the Civil Procedure Rules. So unlike
BC, SK, MB and NB, there is no second batch to go and find in a consolidation:
this is the complete family set in one pass.

The other 30-odd Civil Procedure Rules are general civil and criminal procedure
and are out of scope, matching every other province. Rule 82 (Administration of
Civil Proceedings) is worth naming because the family forms *reference* it —
"complete the heading as required by Rule 82" — but it is the standard-heading
rule for all civil proceedings, not a family form.

## The one fact that matters

**Every Nova Scotia form is a Word document.** There is no PDF edition at all —
not fillable, not flattened — so each is rendered through LibreOffice before
anything can be read off it, and **the background we ship is ours, not the
government's**. That is the one place this province is weaker than Saskatchewan,
whose PDF ships byte-identical to the King's Printer's own file. When a page
looks wrong, the renderer is a suspect alongside the detector.

## 1. Refresh the index (optional)

```
python3 scrape_ns_index.py
```

Two pages: the Civil Procedure Rules forms (Rules 59, 60A, 61) and the Family
Division Practice Memorandum forms (the FD series).

Three things here are load-bearing:

- **The CPR links are wrapped in Microsoft's Office web viewer**
  (`view.officeapps.live.com/op/view.aspx?src=…`). Scraping the wrapper verbatim
  downloads Microsoft's HTML viewer instead of the form; the real URL is the
  percent-decoded `src`.
- **The rule comes from the URL's own folder** (`/Rule 59 Forms/`), not from the
  page heading it sits under. The two disagree on the CPR page.
- **The filename wins over the page label for the FD series.** The court lists
  its order templates as "FD 01" … "FD 06", but the files are
  `FDO1_Interim_Order_…` and the forms print **"Form FDO1"** — letter O, for
  *Order*, not a zero. Taking the label produced four docIds that no form
  identifies itself by.

## 2. Fetch and render (gates A, B)

```
python3 fetch_ns.py [--force]
```

Downloads the `.doc`/`.docx`, renders it to PDF with LibreOffice, and verifies:
sha256 and byte size of the source, rendered page count, the form's own number
printed in the render, and that the render carries no widgets and no XFA.
Renders are cached on the source's sha256, so a re-run only re-renders what
changed upstream.

The form-number check needs a right-hand boundary that rejects a longer number —
`60A.2` must not match inside `60A.20`.

> `curl`, not Python's HTTP client: TLS-inspecting proxy. The URL is re-quoted
> because Nova Scotia's paths carry literal spaces (`/Rule 59 Forms/`).

## 3. Build

```
python3 build_ns_forms.py [--only NSFD_FD3] [--category Financial] [--promote]
```

Entirely a printed-anchor province — there is never a government rectangle to
copy. `ns_anchors.py` reads four vocabularies, and the batch uses no others:

| Anchor | Count | Becomes |
| --- | --- | --- |
| a bracket token — `[name]`, `[date]`, `[describe]` | 972 | a text field |
| a tick glyph — `☐` | 465 | a checkbox |
| a run of three or more underscores | 418 | a text field |
| an empty cell of a ruled table | 394 | a text field |

### The bracket token, and which ones are blanks

This is what makes Nova Scotia its own builder. Form 59.09, the Petition for
Divorce, prints **no underscore at all** and five pieces of line art — every
blank on it is a token. Saskatchewan's or Manitoba's detector finds almost
nothing here.

Most brackets are blanks. Three kinds are not, and all three occur in bulk:

- **A slash is a strike-out choice, not a blank** — 231 of them, 90 distinct:
  `[child/children]`, `[a.m./p.m.]`, `[sworn to/affirmed]`, `[city/town]`,
  `[I/we]`. The filer deletes the word that does not apply.
- **A directive acts on text already there** — `[copy standard heading]` (71),
  `[choose one]` (14), `[delete if not applicable]` (6). Note that
  `[insert address]` *is* a blank: *insert* names the thing to supply, *copy*
  and *delete* act on existing text.
- **`[or]` (55) and `[s]` (12)** are part of the printed sentence — `[s]` is the
  plural marker in "the respondent[s]".

Everything else is a blank. That default is deliberate: the exceptions are
enumerable, the blanks are not.

### Three defects this batch cost, all found by looking at a render

1. **A token split across spans was invisible.** Nova Scotia italicises the
   statute name, so `[refer to section(s) in subsection 22(2) of the *Act*]`
   arrives as three spans and a per-span regex never sees a complete bracket.
   Rule 60A cites the Act in italics on nearly every form, so this dropped a
   blank per citation. Tokens are matched **per line**.
2. **Width is the wrong test for a writing block.** A token with nothing after
   it is extended to the right margin, so `[full name, including middle
   name(s)]` came out 440 pt wide and was typed as a multi-line `TextArea` — for
   a single name, on the style of cause of every form in the batch. The type now
   comes from **what the token asks for** (`describe`, `specifics`, `details`,
   `particulars`), not from how wide the box came out.
3. **The ruled-cell vocabulary was missing entirely.** FD3, the Statement of
   Income, sets its whole income table as a ruled grid with empty AMOUNT and
   COMMENTS cells and no token, tick or underscore anywhere in it: 36 blanks on
   the most important form in the batch for a financial prefill, and the first
   build boxed none of them. FD4, FD6 and FD7 are the same shape.

**A shaded row is not refused.** Manitoba learned that the expensive way — a
grey "heading row" rule ate Form 70D.5's TOTAL and NET rows, 24 empty cells,
because Manitoba shades its totals the same grey as its headings. Nova Scotia
shades SUB TOTAL and TOTAL MONTHLY INCOME identically, and a filer types in
those.

### The tokens stay printed

They are **not** redacted out of the background. BC's batch 3 recorded why:
MuPDF's redaction drops the whole text-showing operation, and clearing a caption
on CFCSA Form 5 took the sentence around it with it. Here `[copy standard
heading]` shares its text operation with the word "Between:". The token stays on
the page under its box, exactly as a Saskatchewan underscore run does.

## 4. Catalogue

```
python3 merge_ns_catalog.py
```

Block start derived, not hardcoded — see the NL/NB READMEs for why.

## 5. Prefill binds

```
python3 rebind_ns_forms.py [--check]
```

The party role is read from the word printed to the **right** of the box, as in
Newfoundland — and for a stronger reason here: there is no widget name to read
at all, because every source is a Word render, so the printed text is the only
description a box has.

**`Respondent[s]` is why the role pattern tolerates a trailing plural.** Nova
Scotia prints the plural marker as its own bracket token, which `ns_anchors`
deliberately does not treat as a blank, so it stays part of the caption and the
text to the right reads "respondent s" after normalising. Writing that pattern
as `respondent s?` makes the **space mandatory** and matches only the plural —
which is exactly what happened, binding 13 respondents and not one applicant
before it was caught.

**The court file number is not bound.** Nova Scotia prints `20___  No. ____` at
the head of every form with no token, no underscore and no rule — bare white
space. A blank with no printed anchor gets no box, so there is no field to bind.

## 6. Verify

```
python3 verify_ns.py
npm run forms:validate-export     # from auth-server/
```

Files present, geometry in bounds, no field off the sheet, every checkbox
covering printed ink, binds from a known vocabulary, catalogue `pageCount`
against the PDF. All 84 run the same checks — there is no widget path here and
so no reduced set.

## Overlay convention

Unchanged: `field.x` = box left in points, `field.y` = box top in points (y
down), `width`/`height` = points × 1.5, and `FillPdf.savePdf` stamps
`y = pageH − field.y − height/1.5`.

# Ontario forms pipeline

Adds the Ontario family-law forms that are not in `form-template-export/` yet,
straight from the government index at
<https://ontariocourtforms.on.ca/en/family-law-rules-forms/>. It is additive by
construction: `fetch_on.py` skips any docId already in `catalog.json`, and
`merge_on_catalog.py` refuses to run if a new row would collide with a shipped
one. No existing template file is ever rewritten.

Requires Python 3 with PyMuPDF (`fitz`); the XFA step also needs Node and Google
Chrome.

## 1. Refresh the index (optional)

```
python3 scrape_on_index.py
```

Rewrites `on_sources.json` — every form number, title, PDF link and Word link on
the index page. Run it when the government publishes a new edition; otherwise
the committed copy is enough.

## 2. Fetch what is missing

```
python3 fetch_on.py
```

Downloads into the gitignored `form-template-export/_incoming_on/` and writes a
`manifest.json` recording each form's URL, byte size and whether it is Word-only.
Downloads are cached, so re-running only picks up what is new.

## 3. Flatten the XFA-only forms

```
sh render_xfa.sh
```

Forms 20 and 29G are Adobe LiveCycle documents with no AcroForm layer — outside
Adobe they render as the "requires Adobe Reader 8" notice and nothing else. This
loads them with pdf.js `enableXfa` and prints the laid-out DOM with headless
Chrome, exporting the government's own field boxes alongside. Skip this step and
those two forms are simply reported as deferred.

## 4. Build

```
python3 build_on_forms.py [--promote]
```

Per form: strip the widget layer to leave the printed page as the background,
convert each government widget rectangle to the overlay convention, bind the
standard heading fields by widget name (`on_binds.py`), then run the geometry,
signature and label-overlap gates and write a QA render per page into
`_incoming_on/qa/`. `--promote` copies the results into `form-template-export/`.

Deliberately *not* run here: the BC refinement passes (mark snapping, ruled-block
expansion, amount sizing). Those exist to recover geometry XFA never emitted
properly. Ontario's AcroForm rectangles are ground truth, so moving them can only
make placement worse.

## 5. Seat the boxes on the printed page

```
python3 refit_on_fields.py [--apply]
```

`build_on_forms.py` writes the government's raw widget rectangles, and those are
routinely 2–3× a printed text line — the editor top-aligns its input, so typed text
floats above the rule instead of sitting on it. This pass re-cuts every single-line
field to the approved 13.3 pt and sits it on its rule, leaves writing blocks tall,
and on the ten Word-sourced forms snaps the box's *width* to the printed rule too
(their widths were inferred, not government geometry). **Run it after every build**
or that defect comes straight back. See `HANDOFF.md` §2 for the full rule set and
where its two constants were measured.

It only ever touches the 90 docIds in `on_scope.py`, writes nothing but geometry
and `type`, and runs itself to a fixed point — a second run must report zero
changes.

## 6. Catalogue and verify

```
python3 merge_on_catalog.py [--promote]
python3 check_seating.py
python3 verify_on_forms.py
python3 audit_on_forms.py --all
npm run forms:validate-export     # from auth-server/
```

`check_seating.py` asks the question the other three missed while the batch shipped
visibly wrong: does each box actually sit on the printed rule it belongs to, and is
it the right shape for the blank underneath it? It also finds strays, boxes over
printed labels, and boxes running across a drawn column separator. `HANDOFF.md` §4
explains why the older gates could not see any of that.

## 7. Review

```
python3 contact_sheet.py [--grid 2x2] [--rules] [--only FormXX]
python3 review_list.py > ../../form-template-export/ON_REVIEW_LIST.md
```

`contact_sheet.py` renders each page with its field boxes drawn on, into
`_incoming_on/qa/`; colour tells you the field type, so a mis-shaped field shows up
at a glance. Every defect in this batch was found by looking at one of these and
none by the gates, so the renders are not optional. Note that **a render of the
overlay is not a render of the app** — these draw the stored box, the viewer draws
its own control inside it.

`review_list.py` regenerates the per-form checklist a person works through.

Read `FIELD_PLACEMENT_GUIDE.md` §9 before working through a review. It is the
list of defects found by reading shipped templates in the app — boxes on the
frame line instead of their dotted leader, a row of fields parked in a table's
heading, answer areas parked at the foot of their blank, anchors with no field
— with the detector for each, written because the obvious detector had already
missed it.

`merge_on_catalog.py` re-sequences the whole ON block into the order the
government index lists the forms, so each category folder reads 8, 8.01, 8A,
8B, 8B.1 … rather than appending 80 forms after the original 45. Only
`sortOrder` changes on already-shipped rows. `verify_on_forms.py` re-checks the
promoted set end to end: files present, no native widgets left behind, geometry
in bounds, and no bind using vocabulary a shipped form does not already use.

`audit_on_forms.py` asks the questions a person notices on a render, which is
what the other two miss: boxes stacked on each other, printed anchors with no
box, boxes too small to type into, and boxes wider than the page's text column.
Run it over `--all` after any placement change. For a Word-sourced form there is
also a ground truth to check against — `w:textInput` and `w:checkBox` counts in
the source `.docx` say how many fields the form actually has.

## Categories

`on_catalog.py` maps each form number to its picker folder. It reuses the folders
the original 45 create wherever one fits; Adoption, Affidavits, Appeals, Case
Management, Dispute Resolution and Interjurisdictional Support are new folders
for form families that had no representative in the original set.

## What is not in the catalogue, and why

- **Forms 37A–37E** are excluded by decision, not by defect. They are the
  registry's own generation templates: they print `[[Jurisdiction]]`-style merge
  placeholders and are issued by the court rather than completed by a party.
  `place_flat_fields.py` builds them cleanly (it strips the tokens and binds the
  two that map to matter data) if that is ever reconsidered — remove them from
  `COURT_ISSUED` in `build_on_forms.py`.
- **Form 29G.** Its XFA flatten indents the Payor and Garnishee panels by their
  own row labels, so the right-hand lawyer panel prints past the sheet edge. The
  defect is in the printed background, not the field boxes, so no overlay work
  fixes it; it is listed in `HELD_BACK` in `build_on_forms.py`.
- **No prefill binds on the Word-sourced or XFA forms.** A flat page carries no
  field names to match, so nothing is bound rather than guessed. Same position
  the XFA-named forms in the 2026-07 batch are in; heading prefill for both stays
  on the `PREFILL_PLAN.md` track, to be placed by position.
- **Blanks with no printed anchor stay empty.** Form 43's "I, ______," and its
  question 3 summary area are bare white space on the government page, with no
  rule, shading or cell to read. Per the placement guide's golden rule they get
  no box; a lawyer types those in the exported PDF.

## Word-only sources

Fifteen forms are published as `.docx` with no usable PDF (13C, 25C, 26D, 34G.1,
34H, 34K, 37A–37E, 43, 43A–43C — plus 37E, whose listed PDF the site 404s).

```
sh convert_docx.sh
```

LibreOffice if installed, otherwise Pages. Word is deliberately not scripted:
16.76 compiles `save as … file format format PDF` but the running app rejects it
with -1708, so that route looks correct right up until it fails. Word's
**File > Save As > PDF** menu item works and is the best-fidelity option if you
would rather export by hand — save as `<docId>_source.pdf` in `_incoming_on/`,
beside the `.docx`, and the build treats it like a downloaded source.

A Word export has no AcroForm layer, so those forms go through
`place_flat_fields.py` instead, which reads the boxes off the printed page.
- **Form 29G.** Its XFA flatten indents the Payor and Garnishee panels by their
  own row labels, so the right-hand lawyer panel prints past the sheet edge. The
  defect is in the printed background, not the field boxes, so no overlay work
  fixes it; it is listed in `HELD_BACK` in `build_on_forms.py`.

## Overlay convention

Unchanged from the BC batch: `field.x` = box left in points, `field.y` = box top
in points (y down), `width`/`height` = points × 1.5, and `FillPdf.savePdf` stamps
`y = pageH − field.y − height/1.5`.

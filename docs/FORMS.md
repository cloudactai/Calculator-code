# Forms

The **Forms** area is where a matter's court documents (family-law PDFs such as Form 8A
and Form 13) are created, prefilled from the matter's data, edited, saved, and
exported as completed PDFs. It is reached from a matter's task list
("DRAFT DIVORCE APPLICATION DOCUMENTS") and produces the physical documents a lawyer
files with the court.

> **Not every document is a form.** The engine described here fills a *fixed government
> page*: a static background PDF with one field per x/y box. A drafted agreement has no such
> page — whole sections appear or disappear and its text is of unpredictable length — so
> **Draft Agreements** is a separate feature with its own renderer and its own storage. See
> "Draft Agreements" in [MATTERS.md](MATTERS.md).

> **Origin.** Like the rest of `cloudact-ui/`, the forms pages were taken from
> `cloudact-frontend-main`, the UI for the main CloudAct SaaS platform. The original app
> carried a large **client-side** prefill and binding engine that mapped matter data into
> PDF field values in the browser. That engine is still present in
> [FillPdf.jsx](cloudact-ui/src/pages/formPages/FillPdf.jsx), but it is **commented out
> and no longer used**: prefilled values and field mappings now arrive ready-made from
> the authenticated Forms API. This "old versus new" split is the most important thing to
> understand about this code.

---

## Where it lives

| Piece | File |
| --- | --- |
| Create-new-form page | [cloudact-ui/src/pages/formPages/CreateNewFormPage.jsx](cloudact-ui/src/pages/formPages/CreateNewFormPage.jsx) |
| Form editor / viewer | [cloudact-ui/src/pages/formPages/FillPdf.jsx](cloudact-ui/src/pages/formPages/FillPdf.jsx) |
| PDF render + field overlays | [cloudact-ui/src/pages/formPages/PDFViewer.jsx](cloudact-ui/src/pages/formPages/PDFViewer.jsx) |
| API service | [cloudact-ui/src/services/formsService.js](cloudact-ui/src/services/formsService.js) |
| Form catalog builder | [cloudact-ui/src/utils/matterData/MatterFormData.jsx](cloudact-ui/src/utils/matterData/MatterFormData.jsx) |
| Toolbar (zoom/paging) | [cloudact-ui/src/components/FormPages/forms/newComponents/ModernToolbar.jsx](cloudact-ui/src/components/FormPages/forms/newComponents/ModernToolbar.jsx) |
| Calculation manager (sidebar) | [cloudact-ui/src/components/FormPages/forms/newComponents/CalculationManager.jsx](cloudact-ui/src/components/FormPages/forms/newComponents/CalculationManager.jsx) |

Routes involved ([Routes.jsx](cloudact-ui/src/routes/Routes.jsx),
[Routes.types.ts](cloudact-ui/src/routes/Routes.types.ts)):

- `/forms/create-new` → `CreateNewFormPage` (pick a matter, a folder, and which forms)
- `/matters/:matterNumber/forms/:documentId` → `FillPdf` (open one saved form document)
- `/forms/create-new/fill-pdf` and `/forms/create-new/fill-information` → **legacy
  routes, now redirect** back to `/forms/create-new`.

---

## Step 1 — Create new form(s)

[CreateNewFormPage.jsx](cloudact-ui/src/pages/formPages/CreateNewFormPage.jsx) is the
entry point. Flow:

1. **Pick a matter.** On mount it loads the user's matters via
   `formsService.listMatters()` into a dropdown. When arriving from a matter task, the
   matter number comes in through `location.state.matterNumber` and pre-fills the
   dropdown.
2. **Load matter context.** Whenever `formData.matterNumber` changes, it calls
   `formsService.getMatterContext(matterNumber)` to get the matter's **province** and
   client name. The province drives which forms are available.
3. **Load the form catalog for that province.** `FormsArray(province, true, true)` from
   [MatterFormData.jsx](cloudact-ui/src/utils/matterData/MatterFormData.jsx) hits
   `GET /forms?province=<XX>&production_ready=true&mapping_ready=true`. It normalizes
   province names through `provinceCodeOf` (`ontario → ON`, `alberta → AB`,
   `british columbia → BC`, `saskatchewan → SK`) and groups the returned templates
   into **category folders** dynamically (ordered by the API's `sortOrder`, then
   title) — so any catalogued category becomes its own folder, not just a hardcoded
   Divorce / Child-Protection pair. This is why adding a province needs no frontend
   change: Saskatchewan's eight "King's Bench – …" folders appeared on their own.
4. **Pick / create a folder.** Forms must be saved into a folder. The page lists
   existing folders (`formsService.listFolders`) and lets you create one
   (`formsService.createFolder`). A form cannot be created without a folder.
5. **Select forms.** Clicking a category opens the "Add Forms" modal
   (`GeneralModal`), which has a searchable list of that category's forms with
   checkboxes. Selected forms show as chips on the main page (removable via the ✕).
   Only `status === "active"` forms are offered.
6. **Create.** `handleCreateNewFormSubmit` gathers every checked form and calls
   `formsService.createDocuments(matterNumber, folderId, templateIds)`. That returns
   the newly-created **document** records; the page navigates to the first one at
   `/matters/<matterNumber>/forms/<documentId>` — i.e. straight into the editor.

`production_ready` / `mapping_ready` filters ensure only forms that are actually
finished *and* have a working field mapping are offered — see the migration status in
the project's forms migration notes.

---

## Step 2 — Fill / view a form

[FillPdf.jsx](cloudact-ui/src/pages/formPages/FillPdf.jsx) is the editor. It is a large
file, but most of its length is the **retired legacy prefill engine** (a commented-out
block of about 1,400 lines: `bindFieldsToData` and its helpers). The active logic is at
the top and bottom of the file.

### Loading a document

Keyed off the route params `:matterNumber` / `:documentId`, it loads two things in
parallel:

- `formsService.getDocument(matterNumber, documentId)` → the saved **document**:
  `id`, `docId`, `file_name`, `folder_id`, `revision`, `template_version`, and the two
  things that matter most:
  - `mapping.staticFields` — the field definitions (id, type, page, x/y/width/height,
    font, color, etc.). **These come from the server now**, not from client-side code.
  - `fieldValues` — the prefilled/saved values keyed by field id.
- `formsService.listDocuments(matterNumber)` → all saved forms for that matter, used to
  populate the "List of Forms" sidebar so you can jump between sibling documents.

The active form's PDF is then fetched as a blob from
`/form-templates/<docId>/versions/<template_version>/pdf` and turned into an object URL.

### Building the on-screen form

When both the PDF blob and the document are ready, `loadPdf()`:

1. Loads the PDF with `pdf-lib` to read the page count.
2. Takes `remoteDocument.mapping.staticFields` and, for each field, overlays the saved
   value from `remoteDocument.fieldValues[field.id]` if present. This produces the
   `fields` array. (If `staticFields` is missing, it errors out — the mapping is
   required.)
3. Renders via `PDFViewer`.

### Rendering — PDF + draggable overlays

[PDFViewer.jsx](cloudact-ui/src/pages/formPages/PDFViewer.jsx) renders the current page
with `react-pdf`'s `<Document>`/`<Page>` (text and annotation layers disabled — the PDF
is treated as a flat image), then absolutely-positions each field for the current page
as an `Rnd` (react-rnd) box at `field.x * scale, field.y * scale`. Inside each box it
renders the right input by `field.type`:

- `TextField` → text input
- `TextArea` → textarea
- `Number` → `react-currency-format` (thousands separators)
- `Date` → date input (reformats through `formatDate`)
- `Table` → an editable/ sortable table
- default → a checkbox (`value === 'checked'`)

Dragging/resizing is gated behind `isEditable` (currently the editor runs read-only for
positioning — the fields are placed from the server mapping, not moved by the user).
`ModernToolbar` handles page navigation and zoom (`scale`); `CalculationManager` in the
sidebar handles computed fields.

### Saving

Two distinct save paths, both through `formsService` with optimistic-concurrency
`revision` numbers:

- **Save Document** (`handleSave`) → serializes `fields` into a `{ id: value }` map and
  PATCHes via `formsService.saveDocument(matter, docId, revision, fieldValues, "IN_PROGRESS")`.
  A `409` means someone else changed it — reload before saving. On success it bumps the
  local `revision`.
- **Download Document** (`savePdf`) → this is the real export. It re-loads the template
  PDF with `pdf-lib`, and for every field **creates a matching AcroForm field**
  (`createTextField` / `createCheckBox`) at the mapped coordinates
  (`y = pageHeight - y - height/scale`), sets its value, styles it (8pt Helvetica /
  ZaDb for checks), and marks it read-only. The filled PDF bytes are then:
  1. uploaded via `formsService.saveGeneratedPdf(...)` (versioned by
     `generated_pdf_revision`, with the generation time recorded), and
  2. downloaded to the user as `<file_name>-completed.pdf`, and
  3. previewed in a modal iframe.

### The sidebar

Shows `CalculationManager` plus a button per sibling form. Selecting a different form
navigates to its `/matters/:matterNumber/forms/:documentId` URL (which re-runs the whole
load), rather than mutating state in place — this fixed a bug where re-selecting the
same object blanked the viewer without re-triggering the load effect.

---

## Old versus new — the prefill split (important)

This is the most likely source of confusion for anyone new to the file:

- **Old platform (`cloudact-frontend-main`):** the browser held the field mappings and a
  large `bindFieldsToData` engine that walked through the matter's assets, debts,
  children and so on, and calculated each PDF field's value in the browser. That code is
  still visible in [FillPdf.jsx](cloudact-ui/src/pages/formPages/FillPdf.jsx) inside a
  long `/* … */` block (roughly lines 240–1663), along with the `calculateAge`,
  `generateDetails` and `formatNumberWithCommas` helpers. **It never runs** and must not
  be called. It remains in place only until a separate clean-up removes it.
- **Now:** the **Forms API** owns both the field mapping (`mapping.staticFields`) and the
  prefilled values (`fieldValues`). The editor just overlays values onto the mapping and
  lets the user tweak/save. The forms are **image-based PDFs** with an overlay coordinate
  convention; the mapping is produced by a server-side extract-from-AcroForm / vector
  pipeline. (See "Prefill" and "Field placement" below for how a value
  reaches a box and how a box is checked, and the project's forms-migration notes for the full
  mapping pipeline and per-form status — the catalogue holds **138 Ontario,
  213 BC, 121 Saskatchewan, 140 Manitoba, 102 Nova Scotia, 96 Newfoundland and
  Labrador, 48 New Brunswick and 34 Prince Edward Island** templates -- 892 in
  all, across all eight provinces migrated so far. Build tooling is per
  province, in `auth-server/tools/on-forms/`, `bc-forms/`, `sk-forms/`,
  `mb-forms/`, `ns-forms/`, `nl-forms/`, `nb-forms/` and `pei-forms/`.)

  The provinces reach the same overlay convention from very different
  sources, which is the thing to know before touching any of them. There are
  really only three paths, and which one a province takes is decided entirely
  by what its government publishes:

  - **A widget path**, where the government hands over its own AcroForm
    rectangles and they are converted directly. Ontario's PDF forms, BC's
    Provincial Court set, the whole of **Newfoundland** (60 of 62) and
    **New Brunswick** (29 of 34), and **Nova Scotia's 18 ISO forms** take it. The BC refinement passes stay *off*
    here: they exist to recover geometry XFA never emitted, and moving a real
    widget rect only makes placement worse. The shared seating passes live in
    `auth-server/tools/acroform_seat.py`.
  - **A flatten path**, for XFA (Adobe LiveCycle) sources, which render as a
    "Please wait…" placeholder outside Adobe. BC's Supreme set and a few
    Ontario forms go through headless pdf.js + Chrome
    (`tools/bc-forms/xfa/`). It is the most fragile route in the repo.
  - **A printed-anchor path**, where there is no widget anywhere and every box
    is read off the printed page. Saskatchewan, Manitoba, **Nova Scotia** and
    **Prince Edward Island** take it, and the anchors differ per province (see
    below).

  In detail: Ontario is
  largely **scanned images**, BC is **AcroForm** (Provincial) and **XFA needing a
  headless flatten** (Supreme) — plus, for the child-protection and adoption forms
  the government publishes only as enacted text, pages **cut out of a King's
  Printer consolidation** — and Saskatchewan and Manitoba are both **static
  Word-derived PDFs with a real text layer and no widgets at all** — so their boxes
  are detected from printed anchors and their backgrounds ship byte-identical to
  the government's file.

  **Nova Scotia and Prince Edward Island are both rendered from Word.** Nova
  Scotia publishes *no* PDF edition of any *court rule* form, and PEI's fillable
  PDFs are XFA and cover only half its set, so both are converted through
  LibreOffice — which means their backgrounds are **ours, not the
  government's**, and the renderer is a suspect whenever a page looks wrong.
  Manitoba's twenty Word-only batch-3 forms share that property.

  Nova Scotia also prints its blanks in a way no other province does: as an
  **instruction in square brackets** — "I, [name], of [community], Nova
  Scotia" — 1,182 of them against 418 underscore runs. Its Petition for
  Divorce prints no underscore at all. Three kinds of bracket are *not* blanks
  and all three occur in bulk: a slash is a strike-out choice
  (`[child/children]`), a directive acts on text already there (`[copy
  standard heading]`), and `[or]` and `[s]` are part of the printed sentence.
  PEI, despite sharing the detectors, barely uses brackets — it writes
  underscore runs, closer to Saskatchewan.

  **Several provinces are more than one batch**, and the second one is never on
  the court's forms page. Newfoundland's Provincial Court publishes its own
  family set (34 forms, including the emergency-protection orders) for the parts
  of the province the Supreme Court's Family Division does not cover; New
  Brunswick's child-protection and parentage forms are in Regulation 81-134
  under the Family Services Act, printed as **spaced dot leaders**, a vocabulary
  no other batch uses; and Ontario's three Hague Convention support forms live
  in the Central Forms Repository rather than on ontariocourtforms.on.ca.

  **Nova Scotia is two batches, not one** (since 2026-08-26). Its 18
  Interjurisdictional Support Orders forms are prescribed by a statute rather
  than a Civil Procedure Rule and are published on `nsfamilylaw.ca`, not on
  `courts.ns.ca`, so the scrape of the court's forms pages could not see them.
  They are real AcroForms and take the widget path, which makes them the only
  Nova Scotia templates whose background is the government's own file. They also
  forced a change to how a background is flattened: their option squares are
  drawn by the **widget border and nothing else**, so deleting the widget layer
  erased 172 printed checkboxes across 16 forms. `acroform_seat.flatten_baked`
  bakes the appearance streams into the page first — after clearing any value a
  field already holds, which would otherwise be printed into the background
  under our own box.

  Since 2026-08-21 both prairie provinces also carry families that are **not**
  static: the interjurisdictional support set, Manitoba's protection-order
  applications and the federal relocation notices are **AcroForm**, and three of
  Manitoba's ISO forms are **static XFA**. Those take a widget path -- the
  government's own rectangles, read by `bc-forms/bc_pipeline.extract` and shipped
  over a flattened background -- rather than the anchor detectors, and their
  verifier runs a reduced check set for the same reason. Twenty Manitoba forms
  have no official PDF at all and are rendered from the government's `.doc`/
  `.docx` through LibreOffice, which is the one place a Manitoba background is
  not the King's Printer's own bytes.

  Saskatchewan and Manitoba are *not* the same pipeline, and that is the trap.
  Saskatchewan prints its blanks as **underscore runs** (plus 9×9 squares and
  ruled grids); Manitoba prints them as **drawn geometry** — a filled rectangle
  about 0.8pt tall, or a stroked line — 1,528 of those against 12 underscore runs
  in the Manitoba financial batch, so the Saskatchewan detector run over a
  Manitoba form finds almost nothing. Word also draws the underline beneath a
  printed heading with that same primitive, so `tools/mb-forms/` separates the two
  by measuring how much of a rule's own length carries glyphs sitting on it: a
  heading's underline reads 94–95%, a blank reads 0%.

If you're adding a form or fixing a field position, the fix almost always belongs in the
**template/mapping on the backend**, not in this React code.

## Prefill — where a field's value comes from

Every field in a mapping JSON may carry a **`bind`**: a dotted path — or a comma-separated
list of paths, joined with `", "` — into a **prefill vocabulary** the server assembles per
matter. A field with no `bind` is simply an empty box for the lawyer to type in.

`buildPrefillData(matter, userId)` in
[auth-server/src/routes/formsRoutes.js](../auth-server/src/routes/formsRoutes.js) builds
that vocabulary, from three sources and nothing else:

| Source | What it contributes |
| --- | --- |
| The matter's `MatterRecord` rows | everything intake collected — parties, children, court, relationship, employment, income, expenses, assets, debts. The same rows the AI and manual intakes both write, so a form fills identically either way (see [MATTERS.md](MATTERS.md)). |
| The signed-in `User` profile | the **lawyer's** own name, address, phone and email — what a form asks about the filing solicitor, which is not matter data. |
| The matter's completed `SavedCalculation` runs | the child- and spousal-support figures, most recent first. |

[formPrefillCompat.js](../auth-server/src/utils/formPrefillCompat.js)'s
`buildLegacyPrefill` rebuilds the **old platform's** vocabulary from those same records and
is spread over the modern object. That is why binds written against the legacy names still
resolve: both vocabularies are present at once. The layer also derives what nothing stores —
a monthly income from a yearly figure, an age from a date of birth.

`prefillFields()`
([formPrefillResolver.js](../auth-server/src/utils/formPrefillResolver.js)) then walks
`mapping.staticFields`, resolves each `bind`, and returns two maps: the `fieldValues`, and a
**`fieldProvenance`** marking every filled field `"prefill"`. A `PATCH` marks the fields it
carries `"manual"`. That single flag is what makes the next point safe.

**Prefill re-runs on every read (since 2026-09-01).** It used to run exactly once, at
document creation — so anything entered or corrected *afterwards* (a date of birth, the
court, the opposing lawyer, an expense) never reached a document that already existed, and
the only way to pick it up was to delete the form and create it again. `refreshUnmanualFields()`
now re-resolves, on every `GET /matters/:m/forms/:id`, every bound field whose provenance is
not `"manual"`. So an open form catches up with the matter, a value the user typed by hand is
never overwritten, and a field with no bind is never touched.

**One caveat worth knowing:** `handleSave` posts *every* field on the page, not only the ones
that changed, so the first **Save Document** marks the whole document `"manual"` and it stops
catching up from then on. Before that first save it refreshes on every open. If a form is
reported as "not picking up the new address", check whether it has been saved.

### How much is bound, per province

Binds are added by each province's own `rebind_*` script, which writes back only the `bind`
key and asserts every other key is unchanged — so re-binding never moves a reviewed box.
Coverage is deliberately uneven: Ontario, the first province and the one whose forms are
filed most, is bound field-by-field; the rest carry the general heading, the parties and the
lawyers, which is what almost every form asks for on page 1.

| | Templates | Fields | Binds | Templates with ≥1 bind |
|---|---|---|---|---|
| Ontario | 138 | 9,789 | 1,988 | 134 |
| British Columbia | 213 | 8,657 | 403 | 196 |
| Manitoba | 140 | 8,125 | 394 | 81 |
| Saskatchewan | 121 | 6,531 | 137 | 54 |
| Newfoundland and Labrador | 96 | 5,867 | 130 | 72 |
| Nova Scotia | 102 | 4,572 | 104 | 61 |
| New Brunswick | 48 | 4,047 | 79 | 39 |
| Prince Edward Island | 34 | 1,267 | 79 | 27 |
| **Total** | **892** | **48,855** | **3,314** | **664** |

Some blanks stay unbound on purpose, because a value would be worse than the empty box: BC's
registry line (the vocabulary holds a court, not a registry), the payor/recipient panels on
Ontario Forms 26D/30A/30B/31 (the payor is not reliably the respondent), second-party rows on
any panel (a matter has one applicant and one respondent), and the 14 "APPLICANT or
CO-APPLICANT" boxes in Newfoundland, which need a decision on co-applicant semantics rather
than a measurement. `auth-server/form-template-export/PREFILL_PLAN.md` is the running record.

**A bind is a claim about the data, and can be wrong in a way no coordinate check sees.**
The September 2026 pass over Ontario's financial statements is the cautionary example: every
asset table on Form 13 pages 4–5 was bound to the same generic `assets[0..2]`, so all ten
tables rendered the same three rows; Form 13.1's page-8 "value on date of marriage" table was
summing *today's* values; and its item 22 summed 2 of the 7 asset categories, understating
Part 9's Net Family Property. All three produced a well-placed, plausible, wrong number. When
a form has one table per asset subtype, each table must be bound to its own collection.

---

## Field placement, and how a form gets reviewed

A mapping JSON is the whole of a form's placement, and its coordinate convention has one trap
in it:

- **`x`, `y`** are raw **PDF points**, origin at the **top-left** of the page.
- **`width`, `height`** are PDF points **multiplied by 1.5** (`SCALE` in
  `auth-server/tools/bc-forms/acroform_seat.py`). Anything measured off the page — a pixel
  scan, a `get_text('words')` box, a `get_drawings()` rule — is a true PDF point value and
  must be multiplied by 1.5 before it is stored.

Forgetting that multiplication renders the field at two-thirds of the size measured, and a
render **will not look obviously wrong**: a too-narrow invisible box just leaves unused
whitespace, where only a too-*wide* box produces the overlap-with-caption look reviewers
watch for. A whole session of Newfoundland EPO date-field "fixes" shipped silently undersized
this way before being caught.
[auth-server/tools/FORM_FIXING_GUIDE.md](../auth-server/tools/FORM_FIXING_GUIDE.md) is the
full guide, including the sanity check to run before trusting new geometry math on a province
you have not touched before.

### The review loop

Automated gates are necessary and not sufficient — both prairie READMEs record batches whose
real defects were invisible to every gate, because no gate was asking that question. So each
page is **read twice** ([tools/review/review_ledger.py](../auth-server/tools/review/review_ledger.py)):

1. **Pass 1 — the overlay against the government's own page.** Is there a field on everything
   that can be written on; is anything sitting on printed text or on a signature line; is each
   field the right type and extent?
2. **Pass 2 — the filled render.** Does a real value land on the line, fit its box and wrap
   where it should; does a tick land inside its square?

The result of each pass is written to `tools/review/ledger.json`, one row per page, with
whatever was corrected in between. `review_ledger.py --check` is the gate over it: one row per
page of every template in scope, both passes `pass`, and the ledger's page total equal to the
catalogue's. A row cannot be marked reviewed by the tool — it is recorded from the reviewer's
own notes after the renders in `_review/<docId>/` have actually been opened, which is the one
part of this no script can do. The ledger currently holds **290 pages across 95 templates**
(the Saskatchewan, Manitoba and PEI batches).

The mechanical loop around that reading: render with `tools/review/render_review.py` into the
gitignored `form-template-export/_review/<DOCID>/`, fix in the JSON through a per-province
repair script (each idempotent, each with a `--check` mode), **re-render anything you touch**,
then re-run the province verifier (`tools/nl-forms/verify_nl.py`, `tools/nb-forms/verify_nb.py`,
and their siblings) and `npm run forms:validate-export`.

### Where the sweep stands

The Atlantic set has since had a complete page-by-page audit
([auth-server/tools/NL_NB_AUDIT_LEDGER.md](../auth-server/tools/NL_NB_AUDIT_LEDGER.md) is the
per-page record, `OK` / `FIX` / `LEFT` per page):

| | Templates | Pages | Fields | Binds | Verifier |
|---|---|---|---|---|---|
| Newfoundland and Labrador | 96 | 413 | 5,867 | 130 | `verify_nl.py` — zero findings |
| New Brunswick | 48 | 242 | 4,047 | 79 | `verify_nb.py` — zero findings |

Every mechanical class is now closed, which changes what the sweep is *for*. A detector cannot
find what is left, so read for the things only reading catches: a table correct field-by-field
but wrong as a set, a bind naming the wrong column (the pattern behind four of the last
session's fixes — suspect any form whose style of cause is unusual), and printed text that is
wrong on the page (the `NLSC_SUBPOENA` header and footer, lost to the background flatten,
which no tool in `tools/review` looks for).

**Three false positives are established and must not be re-investigated:** the render's generic
"Jordan A. Whitfield" sample overflowing a narrow date or amount field; a field's top border
sitting on the caption's baseline (measured at 0pt intrusion corpus-wide); and a field that
stops short of a printed rule where the government's own widget stops there too.

Known, deliberate, carried forward: the 14 unbound co-applicant boxes above;
`NLSC_REQUEST_FOR_CERTIFICATE_OF_DIVORCE`'s "Court File No. (if known)", whose caption sits
94pt away, past the binder's 90pt reach; `F16A_04A` p6, where the government's ex parte annex
omits a box its inter partes twin has (faithful to source, flagged, not invented); and
`bc_pipeline.flatten_background` still passing `clean=True` — the root cause of the Subpoena
defect, left alone because it is shared by all eight provinces and every one would need
re-verifying. No other NL or NB page is affected by it (measured).

---

## The API surface

Everything routes through [formsService.js](cloudact-ui/src/services/formsService.js)
(a thin wrapper over the shared axios instance, which carries auth). Key calls:

| Method | Endpoint |
| --- | --- |
| `listMatters()` | `GET /matters` |
| `getMatterContext(m)` | `GET /matters/:m` |
| `listTemplates(prov)` | `GET /forms?province&production_ready&mapping_ready` |
| `createDocuments(m, folderId, templateIds)` | `POST /matters/:m/forms` |
| `getDocument(m, id)` | `GET /matters/:m/forms/:id` |
| `saveDocument(m, id, revision, fieldValues, status)` | `PATCH /matters/:m/forms/:id` |
| `saveGeneratedPdf(m, id, revision, blob, ms)` | `PUT /matters/:m/forms/:id/pdf` |
| `listPdfRevisions(m, id)` | `GET /matters/:m/forms/:id/pdf/revisions` |
| `listDocuments(m, folderId?)` | `GET /matters/:m/forms` |
| `createFolder(m, title, type)` | `POST /matters/:m/folders` |
| `listFolders(m)` | `GET /matters/:m/folders` |
| `renameDocument` / `deleteDocument` | `PATCH`/`DELETE /matters/:m/forms/:id[/name]` |

These are served by the auth-server (see [../auth-server/](../auth-server/)), which also
bootstraps the form templates. The template PDF blobs are fetched separately at
`/form-templates/:docId/versions/:version/pdf`.

---

## Common pitfalls

- **The large commented block in FillPdf is unused code.** Do not reconnect it; the
  mappings and values come from the API.
- **There are two revision counters.** `revision` protects the field-value document; a
  separate `generated_pdf_revision` protects the exported PDF. Either can return a `409`.
- **Coordinates are overlay coordinates.** The export flips `y` using
  `pageHeight - y - height/scale`. Get this wrong and the fields land in the wrong place.
- **Missing BC signature captions are a flattening issue, not an overlay issue.** An
  unpatched pdf.js XFA render drops `<signature>` widgets and captions such as
  "Signature of" or "Judge / Associate Judge / Registrar". The BC pipeline's
  `xfa/patch_pdfjs_signature.mjs` preserves a non-editable signing area; its rule must
  remain above a `placement="bottom"` caption. Do not add an editable field or patch the
  React viewer to compensate.
- **A form must have a folder** before it can be created, and only forms that are both
  `production_ready` and `mapping_ready` are offered.
- **Switching forms is a navigation**, not a state change: the form reloads through the
  URL.
- **The province determines the catalogue**, and the province comes from the matter
  context, so a matter with no province shows no forms.
- **`width` and `height` in a mapping JSON are PDF points × 1.5; `x` and `y` are not.**
  Storing a measured width without that factor renders the box at two-thirds size, and the
  render does not look obviously wrong. See "Field placement" above.
- **Prefill is re-applied on every GET, not only at creation.** What protects a value the
  lawyer typed is `fieldProvenance[fieldId] === "manual"`. Because **Save Document** posts
  every field, one save marks the entire document manual and it stops refreshing — that is
  the answer to "why didn't this form pick up the change?", and the thing to keep in mind
  before altering how saving records provenance.
- **A `Date` field's input takes an ISO value, not the printed one.** `PDFViewer` round-trips
  through ISO and builds the `Date` from local year/month/day components; parsing a picked
  date as UTC and reading it back with local getters shifted every date a day west of UTC.
- **A bind can be well-placed and still wrong.** A table bound to a generic collection, or a
  total that misses categories, renders perfectly and reports a false number — the Form 13 /
  13.1 failures above. Check what a bind *means*, not just where it lands.

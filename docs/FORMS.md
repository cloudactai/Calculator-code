# Forms

The **Forms** area is where a matter's court documents (family-law PDFs such as Form 8A
and Form 13) are created, prefilled from the matter's data, edited, saved, and
exported as completed PDFs. It is reached from a matter's task list
("DRAFT DIVORCE APPLICATION DOCUMENTS") and produces the physical documents a lawyer
files with the court.

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
  pipeline. (See the project's forms-migration and prefill-plan notes for the full
  mapping pipeline and per-form status — the catalogue holds **135 Ontario, 213 BC,
  40 Saskatchewan and 5 Manitoba** templates. Build tooling is per province, in
  `auth-server/tools/on-forms/`, `auth-server/tools/bc-forms/`,
  `auth-server/tools/sk-forms/` and `auth-server/tools/mb-forms/`.)

  The four provinces reach the same overlay convention from very different
  sources, which is the thing to know before touching any of them: Ontario is
  largely **scanned images**, BC is **AcroForm** (Provincial) and **XFA needing a
  headless flatten** (Supreme) — plus, for the child-protection and adoption forms
  the government publishes only as enacted text, pages **cut out of a King's
  Printer consolidation** — and Saskatchewan and Manitoba are both **static
  Word-derived PDFs with a real text layer and no widgets at all** — so their boxes
  are detected from printed anchors and their backgrounds ship byte-identical to
  the government's file.

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

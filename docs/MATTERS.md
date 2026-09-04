# Matters

The **Matters** area is the case-management part of the app: the list of every file a
lawyer is working on, and the per-matter workspace where intake, support
calculations, and document drafting all happen. It is the centre of the workflow:
almost every other feature is reached by opening a matter first.

> **Origin.** The `cloudact-ui/` React app was taken from `cloudact-frontend-main`, the
> UI for the main CloudAct SaaS platform, and adapted for this project. Much of the
> styling, the component naming (`panel trans`, `pHead`/`pBody`, `statusBadge`,
> `customBadge`, the modal shells), and the Redux wiring come directly from that parent
> app. Where code comments refer to "the old platform", they mean
> `cloudact-frontend-main`. The chatbot panels described below deliberately reuse the
> same chat UI and backend endpoints as the platform's report-generation chat (the
> floating FamilyLawChat widget), so the two look and behave the same.

---

## Where it lives

| Piece                             | File                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Matter list / dashboard           | [cloudact-ui/src/pages/matters/matterDashboard.jsx](cloudact-ui/src/pages/matters/matterDashboard.jsx)                                                  |
| Single-matter workspace           | [cloudact-ui/src/pages/matters/SingleMatter.jsx](cloudact-ui/src/pages/matters/SingleMatter.jsx)                                                        |
| Task list component               | [cloudact-ui/src/components/MatterWorkflow/MatterTaskList.jsx](cloudact-ui/src/components/MatterWorkflow/MatterTaskList.jsx)                            |
| AI-vs-manual chooser              | [cloudact-ui/src/components/MatterWorkflow/MatterIntakeChoice.jsx](cloudact-ui/src/components/MatterWorkflow/MatterIntakeChoice.jsx)                    |
| Intake chat panel                 | [cloudact-ui/src/components/MatterWorkflow/MatterIntakeChatPanel.jsx](cloudact-ui/src/components/MatterWorkflow/MatterIntakeChatPanel.jsx)              |
| Update-information chat panel     | [cloudact-ui/src/components/MatterWorkflow/UpdateInformationChatPanel.jsx](cloudact-ui/src/components/MatterWorkflow/UpdateInformationChatPanel.jsx)    |
| Before/after change diff          | [cloudact-ui/src/components/MatterWorkflow/matterUpdateDiff.js](cloudact-ui/src/components/MatterWorkflow/matterUpdateDiff.js)                          |
| Child support chat panel          | [cloudact-ui/src/components/MatterWorkflow/ChildSupportChatPanel.jsx](cloudact-ui/src/components/MatterWorkflow/ChildSupportChatPanel.jsx)              |
| Spousal support chat panel        | [cloudact-ui/src/components/MatterWorkflow/SpousalSupportChatPanel.jsx](cloudact-ui/src/components/MatterWorkflow/SpousalSupportChatPanel.jsx)          |
| Profile summary + documents       | [cloudact-ui/src/components/MatterWorkflow/ProfileSummaryPanel.jsx](cloudact-ui/src/components/MatterWorkflow/ProfileSummaryPanel.jsx)                  |
| Agreement-type chooser            | [cloudact-ui/src/components/MatterWorkflow/AgreementTypeList.jsx](cloudact-ui/src/components/MatterWorkflow/AgreementTypeList.jsx)                      |
| Agreement chat + live preview     | [cloudact-ui/src/components/MatterWorkflow/AgreementChatPanel.jsx](cloudact-ui/src/components/MatterWorkflow/AgreementChatPanel.jsx)                    |
| Live Separation Agreement doc     | [cloudact-ui/src/components/MatterWorkflow/SeparationAgreementDocument.jsx](cloudact-ui/src/components/MatterWorkflow/SeparationAgreementDocument.jsx)  |
| Agreement data resolver / context | [cloudact-ui/src/components/MatterWorkflow/agreementResolver.js](cloudact-ui/src/components/MatterWorkflow/agreementResolver.js), [agreementContext.js](cloudact-ui/src/components/MatterWorkflow/agreementContext.js), [agreementSections.js](cloudact-ui/src/components/MatterWorkflow/agreementSections.js) |
| Agreement-type registry           | [cloudact-ui/src/components/MatterWorkflow/agreementTypes.js](cloudact-ui/src/components/MatterWorkflow/agreementTypes.js)                              |
| Shared chat/context styling       | [cloudact-ui/src/components/MatterWorkflow/MatterWorkflow.css](cloudact-ui/src/components/MatterWorkflow/MatterWorkflow.css)                            |
| Stored-intake context builder     | [cloudact-ui/src/components/MatterWorkflow/matterIntakeContext.js](cloudact-ui/src/components/MatterWorkflow/matterIntakeContext.js)                    |
| API service (forms/folders/tasks) | [cloudact-ui/src/services/formsService.js](cloudact-ui/src/services/formsService.js)                                                                    |
| API service (agreements)          | [cloudact-ui/src/services/agreementsService.js](cloudact-ui/src/services/agreementsService.js)                                                          |
| Routes                            | [cloudact-ui/src/routes/Routes.jsx](cloudact-ui/src/routes/Routes.jsx), [cloudact-ui/src/routes/Routes.types.ts](cloudact-ui/src/routes/Routes.types.ts) |

Routes involved:

- `/matter-dashboard` → `MatterDashboard`
- `/single-matter/:id` → `SingleMatter` (the `:id` is the **matter number**, e.g. `CA-2024-00001`)
- `/5-steps/:id` → the manual 5-step accordion intake
- `/t1-upload` → tax-return upload intake
- `/matters/:matterNumber/forms/:documentId` → the form editor (see [FORMS.md](FORMS.md))

---

## The matter dashboard

[matterDashboard.jsx](cloudact-ui/src/pages/matters/matterDashboard.jsx) is a paginated,
searchable table of every matter belonging to the signed-in user (scoped by `sid`).

**Data flow**

- On mount it dispatches `getAllMatters()` and reads the result through the
  `selectMattersData` selector (`utils/Apis/matters/getMatters/…`). Rows come back
  under `response.body` — see the documented example shape in the file header comment
  (id, `client_id`, `matterNumber`, `clientRole`, `childrenInvolved`, `province`,
  `checkedItems`, `information_completed`, `status`, `source`, `valuation_date`, …).
- Search filters client-side across `matterNumber`, `client_id`, and `source`.
- Pagination is client-side too: 10 rows per page (`itemsPerPage`), with a sliding
  window of page buttons rendered via react-bootstrap `Pagination`.
- `information_completed` and `status` render as colored `customBadge` / `statusBadge`
  pills.

**Creating a matter**

The **New Matter** button opens `NewMatterModal`. On continue, `handleContinue(state)`:

1. Generates a matter number if the modal did not supply one, in the format
   `CA-<year>-<zero-padded count>` (e.g. `CA-2024-00007`).
2. Builds `formData` (sid from `getUserSID()`, checked services, client name, role,
   children-involved flag, province) and only proceeds if every required field is present.
3. Dispatches `createMatter(formData)` and, on success, navigates to
   `/single-matter/<matterNumber>`.

**Opening a matter** pushes to `/single-matter/<matterNumber>` and carries
`clientName` in router state, so the single-matter header can show the client name
even if the `get_single_matter` response omits `client_id`.

`Import Matter` is present but intentionally disabled for now.

---

## The single-matter workspace

[SingleMatter.jsx](cloudact-ui/src/pages/matters/SingleMatter.jsx) is a single page
that swaps between several **views** driven by local `view` state rather than by
routing. This keeps the whole matter workflow on one screen with a persistent header.

### Views

| `view` value                          | What shows                                |
| --------------------------------------- | ----------------------------------------- |
| `tasks` (default)                     | The master task list                      |
| `intake_choice`                       | AI Agent vs Manual intake chooser         |
| `intake_chat`                         | AI matter-intake chat                     |
| `support_choice`                      | AI vs Manual support calculation          |
| `support_type_choice`                 | Child vs Spousal support                  |
| `child_support` / `spousal_support` | The respective AI chat panels             |
| `update_information`                  | AI chat that edits values already on file |
| `agreement_choice`                    | Draft Agreements type chooser (registry)  |
| `agreement_chat`                      | Agreement chat + live document (split pane) |
| `profile_summary`                     | "View Information and Documents" screen   |

The header (client name + matter number) is rendered in every view. In a chat view
the header row instead carries a **Back to Tasks** button and the chat title, so the
chat card itself needs no header of its own (`isChatView`, `CHAT_TITLES`).

### The task list

Tasks are defined once in `TASK_DEFS` and mirror the Excel workflow document
(MATTER INTAKE, MATTER INTAKE USING TAX RETURN, CALCULATE CHILD & SPOUSAL SUPPORT,
DRAFT DIVORCE APPLICATION DOCUMENTS, REVIEW FORMS, … through CLOSE FILE and
GENERAL QUERY). Only a subset is currently **enabled** — the ones with a real
database-backed experience. The rest render as "Disabled" until their feature is built.

**Task status is server-backed.** On mount and on every `id` change, the page loads
statuses via `formsService.listTaskStates(id)` and merges them over a
`not_started` baseline. `persistTaskStatus(taskId, status)` optimistically updates
local state and PUTs to `formsService.setTaskState(...)`; if that write fails it
reloads the authoritative state from the server. **There is deliberately no
localStorage fallback**: a failed request must never leave the screen showing something
different from the database.

`handleTaskStart(taskId)` decides what each task does:

- **matter_intake** → marks in-progress, shows the `intake_choice` chooser.
- **matter_intake_tax_return** → navigates to `/t1-upload` with the matter number in
  state (T1 upload → AI extraction → review → saves into this matter's intake).
- **child_spousal_support** → shows `support_choice`.
- **draft_divorce_docs** → navigates to `/forms/create-new` with the matter number, so
  the form-creation page pre-selects it (this is the bridge into the Forms area — see
  [FORMS.md](FORMS.md)).
- **review_forms** → shows `profile_summary`.
- **update_information** → marks the task in progress, re-reads the full matter record
  (`getMatterData`), and shows `update_information`, the AI chat that changes values
  already on file. This task is never marked completed; see the note further down.
- **draft_agreements** ("DRAFT AGREEMENTS") → marks the task in progress and shows
  `agreement_choice`, a chooser rendered from a small registry (`AGREEMENT_TYPES` in
  [agreementTypes.js](cloudact-ui/src/components/MatterWorkflow/agreementTypes.js)) —
  one entry today, Separation Agreement. Picking a type re-reads the full matter record
  (`getMatterData`, same as update_information) and opens `agreement_chat`. Like
  update_information this task never auto-completes — an agreement can be revised after
  a first draft. See "Draft Agreements" below.

### Loading matter data

The page pulls data in layers:

1. `getSingleMatter(id)` loads the header row (`selectSingleMatter.body[0]`) into
   `matterData`. If it cannot load, it falls back to a stub `{ client_id: "", matterNumber: id }`
   so the page stays usable, and shows a non-blocking warning banner.
2. Once `matterData` exists, it dispatches `getSingleMatterData(id, <section>)` for
   every intake section: `background`, `children`, `relationship`, `incomeBenefits`,
   `employment`, `assets`, `expenses`, `debt`, `court`. Each lands in its own Redux
   slice.
3. Those slices are aggregated into `fullMatterData` (snake_case shape) which is the
   context object handed to the **support** chat panels.

On unmount the page resets all those slices to avoid leaking one matter's data into
the next.

### Intake: AI vs Manual — two paths, one database

`handleIntakeChoice(choice)`:

- **manual** → navigates to `/5-steps/:id`, the 5-step accordion intake. These are the
  `*Simple` forms, which load from the database and save as you go.
- **ai** → switches to the `intake_chat` view. **Before showing the chat it re-fetches
  the stored matter data** via `getMatterData(id)` into `intakeMatterData`. This step
  matters: manual entry and earlier AI conversations write to the *same* backend record,
  so the agent must see the latest saved values before asking its first question. This fresh
  snapshot (`intakeMatterData`) is kept deliberately separate from the legacy
  `fullMatterData` used by the support calculators.

### Support calculations

`handleSupportChoice` → `handleSupportTypeChoice` leads to either the child or the
spousal chat panel. The **manual** support path stores the matter number in
`localStorage` under `selectedCalculatorMatterNumber` and navigates to
`/SupportCalculator` so the calculator's welcome screen pre-selects the matter.

Completing child or spousal support persists `child_spousal_support` = `completed`.

### Completion side-effects

`handleMatterIntakeComplete` and `handleViewInformation` both re-dispatch
`getSingleMatter(id)` after an AI save. Financial year and valuation date live on the
**matter header row**, not in the section payloads, so the header must be reloaded or
the profile summary would keep showing pre-intake blanks.

---

## The chat panels (and why they match report-generation)

The four panels — `MatterIntakeChatPanel`, `UpdateInformationChatPanel`,
`ChildSupportChatPanel`, `SpousalSupportChatPanel` — all share the same chat shell
(the `mw-chat-*` classes in
[MatterWorkflow.css](cloudact-ui/src/components/MatterWorkflow/MatterWorkflow.css)):
a scrolling window of alternating "You" / "AI Assistant" bubbles, a typing indicator
(with a "warming up the server" message after ~6s because the first Flask reply can be
slow), quick-start chips, a textarea input bar, and a reset button.

**This is intentionally the same UI as the main platform's report-generation chat.**
The support panels talk to the same Flask `/chat` endpoint as the floating
FamilyLawChat widget in `cloudact-frontend-main`, and they parse the assistant's
Markdown reply the same way — including pulling out a `/download-report/…` link and
turning it into a downloadable PDF report (`extractDownloadUrl` in
[ChildSupportChatPanel.jsx](cloudact-ui/src/components/MatterWorkflow/ChildSupportChatPanel.jsx)).
So "the chatbot generates a report" works identically here and in the parent app.

Where they differ:

- **Support panels** (`/chat`) auto-load matter context (firm, lawyer, province,
  incomes, children…) via `buildContextMessage`, then let the lawyer converse and
  ultimately download a support-calculation report PDF.
- **Intake panel** (`/intake-chat`) is about *capturing* data, not reporting. Each
  reply returns structured `saved_sections`; the panel forwards only that response's
  changes to the authenticated backend via `patchMatterIntake` (non-destructive
  field-level merge). Section names accumulate to drive the "Saved: Background ·
  Relationship · …" progress strip. **Intake is only marked complete when the
  backend's validation of the reloaded record says so** (`saved.completion.complete`),
  never from the AI's own wording. The context primer message is sent once, hidden
  from the visible transcript, using `buildStoredMatterContextMessage` /
  `normalizeStoredIntakeData` from
  [matterIntakeContext.js](cloudact-ui/src/components/MatterWorkflow/matterIntakeContext.js).
- **Update-information panel** (`/update-chat`) only *edits* values already on file.
  It sends the same hidden snapshot primer (`buildUpdateContextMessage`) and the agent
  opens the conversation by asking what the lawyer wants to change. It writes through
  the same `patchMatterIntake` endpoint and the same `save_matter_section` section
  shapes as intake — the Flask side shares one `INTAKE_SECTION_SHAPES` constant
  between `INTAKE_SYSTEM` and `UPDATE_SYSTEM` so the two agents can never drift apart.

  **The "changed from X to Y" line the lawyer sees is not the model's claim.** The
  agent states the change in prose, but the green receipt underneath is computed by
  `diffMatterSnapshots`
  ([matterUpdateDiff.js](cloudact-ui/src/components/MatterWorkflow/matterUpdateDiff.js))
  by comparing the snapshot held *before* the patch with the record the write endpoint
  read *back*. Both are normalised through `normalizeStoredIntakeData`, so row ids and
  blank placeholders never appear as changes. A write that changed nothing is reported
  as such, and a rejected write shows a "not saved" message even when the reply above it
  claims otherwise.

  **The conversation is deliberately not persisted; the change log is.** Replaying an
  old transcript would feed the agent a stale snapshot primer, resend the client's
  whole financial record to the model on every turn, and keep a second copy of that
  record on disk. So each visit starts a fresh chat against current data, while the
  verified receipts are appended to a per-matter change log
  ([changeLog.js](../auth-server/src/utils/changeLog.js)) and shown collapsed at the top
  of the panel: a dated record of what was amended, which is the part with lasting value
  on a file. It is stored in `MatterRecord` under the `matter_change_log` dataType, so it
  needed no migration (see [DATABASE.html](DATABASE.html)). Entries are appended inside a
  Serializable transaction, so two saves in flight cannot overwrite each other, and the
  log is limited to 200 entries. A failed append does not put the change itself in doubt:
  the write has already succeeded, so only the history entry is lost.

  **UPDATE INFORMATION never reaches "Completed"** — changing information is
  recurring work, so the task stays on Resume for the life of the matter, and any
  other stored status is corrected when the task is opened.

The Flask base URL comes from `CALCULATOR_API` in
[cloudact-ui/src/config.ts](cloudact-ui/src/config.ts).

---

## Draft Agreements

Drafting an agreement is a different shape of problem than filling in a government
court form: the document has whole sections that appear or disappear (no children →
no Children/Child-Support/Parenting blocks at all) and free-text fields of
unpredictable length. The fixed-coordinate Forms engine ([FORMS.md](FORMS.md)) is
built for a static background PDF with one field per x/y box — the wrong shape for
that. Draft Agreements renders the agreement as a **live HTML document that mirrors
the source docx**, conditionally, and exports it with the same `xhtml2pdf` pipeline
[report_pdf.py](../report_pdf.py) already uses for the calculation reports — one
templating system, not two.

**The source of truth is the lawyer's own document.** Two files ship in the
repository's `Agreements tool/` folder and are what the feature is measured against:
`Separation Agreement (1).docx`, the precedent the live preview reproduces **verbatim** —
same clause text, same ALL-CAPS headings, and the exported PDF matches its page size,
margins and font sizes — and `Questions.xlsx`, the field ledger saying, for every blank in
that precedent, where its value comes from (matter data, a calculation, or the chat) and
who owns the gap where it does not come from anywhere yet. When a clause looks wrong,
compare it against the docx before changing the component; when a value is missing, check
which source the ledger assigns it to.

**Picking a type.** Starting the task opens `AgreementTypeList.jsx`, cards rendered
from the `AGREEMENT_TYPES` registry in
[agreementTypes.js](cloudact-ui/src/components/MatterWorkflow/agreementTypes.js).
Adding a second agreement type later is one registry entry plus one document
component and one system prompt — nothing in `SingleMatter.jsx`'s routing, the
chooser, or the persistence layer needs to change.

**The chat + live preview.** `AgreementChatPanel.jsx` is a split-pane view: the chat
on the left uses the same `mw-chat-*` shell and classes as the other panels (see
"The chat panels" above), and `SeparationAgreementDocument.jsx` renders live on the
right, re-rendering on every answer. Behind the scenes:

- `agreementResolver.buildAgreementData()` merges three sources into one object the
  document and the chat primer both read from: the matter snapshot (parties, dates,
  children — from `getMatterData`, same as update_information/intake), the matter's
  saved calculation reports (child/spousal support amounts, read-only), and the
  chat-collected `answers` blob.
- **Two field ledger rows are marked "Database (after calculation finalize)"** with
  the sheet's own comment "Marc to work on saving of result after calc done" — that
  save-after-calculation work is a separate, in-flight change to
  `child_support.py`/`spousal_support.py` and is never read from or written to here.
  `resolveChildSupportFromReport()` reads the matter's most recent `child_support`
  calculation report instead (a single deterministic Federal Guidelines figure).
  Spousal support has no equivalent single figure yet — SSAG always returns a
  low/mid/high range — so it resolves only in the narrow case where the three
  scenarios already collapse to one number; otherwise the chat asks, and the answer
  is stored only in `SpousalSupportFallback`, never in `child_support.py` /
  `spousal_support.py` or their tables.
- `agreementOutstandingFields()` lists exactly what the chat still needs to ask,
  driving both the primer sent to `/agreement-chat` and the panel's own "nothing left
  to ask" welcome state.
- The Assets/Debts/Matrimonial-Home sections are chat-collected in full for v1: the
  matter's saved Assets are recorded by category (land, vehicles, bank accounts…),
  not by which party kept them or whether they're jointly held — the field ledger's
  own comments flag this as follow-up work on the Assets intake form, not something
  this feature invents a heuristic around. The read-only `assetsOnFile`/`debtsOnFile`
  lists are still shown to the agent so the lawyer confirms ownership instead of
  retyping type and value from memory.

**Resuming, without replaying a stale primer.** Like update_information, the primer
is a snapshot that goes stale the moment matter data changes — so the conversation is
never replayed as literal prior turns. Unlike update_information, the conversation
*does* resume: `MatterAgreementDocument` (see [DATABASE.html](DATABASE.html)) persists
`answers` (chat-collected fields, keyed by section — the source of truth for "what
chat already knows") and `transcript` (the display-only bubble log) per
`(matter, agreementType)`. On open, `buildAgreementContextMessage()` builds a fresh
primer from live matter data plus the persisted `answers`, and the persisted
`transcript` renders above the live conversation as read-only history — so the lawyer
sees a continuous conversation without the model ever re-consuming stale turns.
**Reset Chat** clears `transcript` and `answers` on that one row only — never
`MatterRecord` (this chat never writes there), and never a PDF already generated on
purpose.

**Export.** "Save Draft" persists `answers` + `transcript` only (cheap, frequent —
fired after every reply). "Generate PDF" serializes the *already-rendered*
`SeparationAgreementDocument` HTML (styles inlined via an embedded `<style>` tag, so
it needs no external stylesheet) and posts it to Flask's `POST /agreement-pdf`, which
hands it to `xhtml2pdf` and returns the PDF bytes — the same HTML the lawyer already
reviewed on screen, so the export matches the preview exactly. The frontend then PUTs
those bytes to `PUT /v1/matters/:id/agreements/:type/pdf`
([agreementRoutes.js](../auth-server/src/routes/agreementRoutes.js)), which files them
into a per-matter "Separation Agreements" `MatterFolder` the same way form documents
are organized, and stores them on `MatterAgreementDocument.pdfBytes`.

**Where it lands in Documents.** A folder holds two unrelated tables:
`MatterFormDocument` (listed by `GET /v1/matters/:id/forms`) and
`MatterAgreementDocument` (listed by `GET /v1/matters/:id/agreements`, which takes the
same optional `folderId` and returns only rows that have actually been generated, in
the folder table's key shape — `agreementFolderDto()` in
[agreementDocument.js](../auth-server/src/utils/agreementDocument.js)). The folder view
in [Folders.jsx](../cloudact-ui/src/components/Matters/Folders.jsx) asks for both and
renders them in one table; agreements get a Download button rather than
Open/Rename/Delete, since a generated agreement is edited through the chat, not the
form filler. Listing forms alone is what previously made the "Separation Agreements"
folder read as empty immediately after generating into it.

> **Response envelope.** `agreementRoutes.js` replies in the legacy
> `{ data: { code, status, body } }` shape (like `mattersRoutes.js`), not
> `formsRoutes.js`'s plain `{ data }`. `agreementsService.js` therefore unwraps
> *two* levels — peeling only the outer `data` hands callers `{ code, status, body }`,
> which reads as an empty folder and as a draft with no saved answers, with no error
> anywhere. `agreementsService.test.js` pins this against the real service with only
> `axios` mocked; component tests that mock the service itself cannot catch it.

**Tests.** The feature ships with its own suites, worth running before touching it:
`SeparationAgreementDocument.test.jsx` (the conditional sections and the clause text),
`agreementResolver.test.js` (which source wins for each field), `agreementSections.test.js`,
`AgreementTypeList.test.jsx`, `AgreementChatPanel.test.jsx` and
`Matters/Folders.test.jsx` (the folder listing shows generated agreements) on the
frontend, `auth-server/src/utils/agreementDocument.test.js` (`npm test` there), plus
[test_agreement_endpoints.py](../test_agreement_endpoints.py) against Flask. The document
suite is what caught two real bugs that a read-through had passed over. Note the CRA
`resetMocks` default when adding to them: a mock's implementation is cleared between tests,
so set it inside each test rather than once at the top of the file.

**Backend chat endpoint.** `POST /agreement-chat` in [app.py](../app.py) is the same
bounded Anthropic tool-use loop as `/update-chat`, with its own system prompt scoped
to only the "Chat AI Agent" ledger rows and a `set_agreement_section` tool (patch
semantics, like `save_matter_section`) in place of it. It reuses
`should_nudge_intake_reply` from [intake_chat_guard.py](../intake_chat_guard.py)
rather than reinventing the "promised to save but didn't call the tool" stall guard.
Like every chat endpoint here it never touches the database itself — it returns
patches for the authenticated frontend to merge into `answers` and persist.

---

## The profile summary ("View Information and Documents")

[ProfileSummaryPanel.jsx](cloudact-ui/src/components/MatterWorkflow/ProfileSummaryPanel.jsx)
ports the old platform's matter-profile page:

- A left column lists every intake **section** (Background, Court, Children,
  Relationship, Employment, Income & Benefits, Expenses, Assets, Debts, Other Persons).
  **View / Edit** opens that section's `*Simple` form (from
  [cloudact-ui/src/pages/fiveSteps/](cloudact-ui/src/pages/fiveSteps/)) inside a modal.
  These are the exact same hydrate-from-DB / save-as-you-go forms used by the 5-step
  manual intake, so AI-captured and manually-entered data render and edit the same way.
- Saving dispatches `updateMatterData({ type, matter_id, data })`; on success an effect
  closes the modal and shows a confirmation toast.
- The right column is the documents/folders panel (`FolderStructure`), backed by
  `get_folders` / `create_folder`.

> The old page's per-section S3 upload table is intentionally dropped — that storage
> does not exist on the new backend.

---

## Backend & auth

All matter/forms/folders/task calls go through the shared axios instance
([cloudact-ui/src/utils/axios.js](cloudact-ui/src/utils/axios.js)) and are handled by
the auth-server (see [../auth-server/](../auth-server/)); the conversational endpoints
(`/chat`, `/intake-chat`, `/update-chat`, `/agreement-chat`, `/agreement-pdf`,
`/download-report`) are served by the Flask app ([../app.py](../app.py)). Matter data
(`getSingleMatter`, `getSingleMatterData`, `getMatterData`, `createMatter`,
`updateMatterData`, `patchMatterIntake`) flows through the Redux action/selector
modules under [cloudact-ui/src/utils/Apis/matters/](cloudact-ui/src/utils/Apis/matters/).
Draft Agreements persistence (`MatterAgreementDocument` — answers, transcript, PDF)
goes through `agreementsService.js` and
[agreementRoutes.js](../auth-server/src/routes/agreementRoutes.js) instead, a sibling
to `calculationReportsRoutes.js`.

## Common pitfalls

- **`:id` is the matter *number*, not the numeric database id.** Everything is keyed on
  the readable `CA-YYYY-NNNNN` string.
- **Views are local state, not routes.** Refreshing the browser returns you to the
  `tasks` view; only `/5-steps`, `/t1-upload`, and the forms editor are real URLs.
- **Task status must be saved to the server.** The code deliberately refuses a
  browser-storage fallback.
- **Matter data is re-fetched before AI intake** so the agent sees earlier saves. This is
  a deliberate step in `handleIntakeChoice`, not an oversight.
- **Header fields (financial year, valuation date) live on the matter row**, so the
  header must be reloaded after an intake save.
- **Draft Agreements never touches `child_support.py` / `spousal_support.py` or their
  save-after-calculation work.** It only ever *reads* a matter's saved calculation
  reports; any support figure it can't find there is asked in chat and stored solely
  in `MatterAgreementDocument.answers` (the `*Fallback` sections), never in a
  calculator table.
- **Draft Agreements' chat transcript is not deleted between visits** — only
  update_information (and the support panels) start fresh every time. Reset Chat is
  the only thing that clears an agreement's transcript/answers, and it never touches
  a PDF already generated on purpose.

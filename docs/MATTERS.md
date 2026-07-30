# Matters

The **Matters** area is the case-management surface of the app: the list of every
file a lawyer is working, and the per-matter workspace where intake, support
calculations, and document drafting all happen. It is the heart of the workflow —
almost every other feature is reached by opening a matter first.

> **Provenance.** The `cloudact-ui/` React app was pulled from `cloudact-frontend-main`,
> the UI for the main CloudAct SaaS platform, and adapted for this project. A lot of
> the styling, component vocabulary (`panel trans`, `pHead`/`pBody`, `statusBadge`,
> `customBadge`, the modal shells), and the Redux plumbing come straight from that
> parent app. Where you see "the old platform" referenced in code comments, that's
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
| Shared chat/context styling       | [cloudact-ui/src/components/MatterWorkflow/MatterWorkflow.css](cloudact-ui/src/components/MatterWorkflow/MatterWorkflow.css)                            |
| Stored-intake context builder     | [cloudact-ui/src/components/MatterWorkflow/matterIntakeContext.js](cloudact-ui/src/components/MatterWorkflow/matterIntakeContext.js)                    |
| API service (forms/folders/tasks) | [cloudact-ui/src/services/formsService.js](cloudact-ui/src/services/formsService.js)                                                                    |
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

1. Generates a matter number if the modal didn't supply one, in the format
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

| `view` value                          | What shows                              |
| --------------------------------------- | --------------------------------------- |
| `tasks` (default)                     | The master task list                    |
| `intake_choice`                       | AI Agent vs Manual intake chooser       |
| `intake_chat`                         | AI matter-intake chat                   |
| `support_choice`                      | AI vs Manual support calculation        |
| `support_type_choice`                 | Child vs Spousal support                |
| `child_support` / `spousal_support` | The respective AI chat panels           |
| `update_information`                  | AI chat that edits values already on file |
| `profile_summary`                     | "View Information and Documents" screen |

The header (client name + matter number) is rendered in every view. In a chat view
the header row instead carries a **Back to Tasks** button and the chat title, so the
chat card itself needs no header of its own (`isChatView`, `CHAT_TITLES`).

### The task list

Tasks are defined once in `TASK_DEFS` and mirror the Excel workflow document
(MATTER INTAKE, MATTER INTAKE USING TAX RETURN, CALCULATE CHILD & SPOUSAL SUPPORT,
DRAFT DIVORCE APPLICATION DOCUMENTS, REVIEW FORMS, … through CLOSE FILE and
GENERAL QUERY). Only a subset is currently **enabled** — the ones with a real
database-backed experience; the rest render as "Disabled" until their feature exists.

**Task status is server-backed.** On mount and on every `id` change, the page loads
statuses via `formsService.listTaskStates(id)` and merges them over a
`not_started` baseline. `persistTaskStatus(taskId, status)` optimistically updates
local state and PUTs to `formsService.setTaskState(...)`; if that write fails it
reloads the authoritative state from the server. **There is deliberately no
localStorage fallback** — a failed request must never silently diverge from the DB.

`handleTaskStart(taskId)` is the router for what each task does:

- **matter_intake** → marks in-progress, shows the `intake_choice` chooser.
- **matter_intake_tax_return** → navigates to `/t1-upload` with the matter number in
  state (T1 upload → AI extraction → review → saves into this matter's intake).
- **child_spousal_support** → shows `support_choice`.
- **draft_divorce_docs** → navigates to `/forms/create-new` with the matter number, so
  the form-creation page pre-selects it (this is the bridge into the Forms area — see
  [FORMS.md](FORMS.md)).
- **review_forms** → shows `profile_summary`.
- **update_information** → marks in-progress, re-reads the full matter record
  (`getMatterData`) and shows `update_information` — the AI chat that changes values
  already on file. Flips to completed on the first change that actually altered a
  stored value.

### Loading matter data

The page pulls data in layers:

1. `getSingleMatter(id)` loads the header row (`selectSingleMatter.body[0]`) into
   `matterData`. If it can't load, it falls back to a stub `{ client_id: "", matterNumber: id }`
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

- **manual** → navigates to `/5-steps/:id`, the 5-step accordion intake. These are
  the *Simple forms that hydrate from the DB and save as you go.
- **ai** → switches to the `intake_chat` view. **Crucially, before showing the chat it
  re-fetches stored matter data** via `getMatterData(id)` into `intakeMatterData`.
  Manual entry and earlier AI conversations write to the *same* backend record, so the
  agent must see the latest saved values before asking its first question. This fresh
  snapshot (`intakeMatterData`) is kept deliberately separate from the legacy
  `fullMatterData` used by the support calculators.

### Support calculations

`handleSupportChoice` → `handleSupportTypeChoice` funnels into either the child or
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
  from the snapshot held *before* the patch against the record the write endpoint read
  *back* — both normalised through `normalizeStoredIntakeData`, so row ids and blank
  placeholders never surface as changes. A write that altered nothing says so, and a
  rejected write posts a "not saved" bubble that contradicts the reply above it.

The Flask base URL comes from `CALCULATOR_API` in
[cloudact-ui/src/config.ts](cloudact-ui/src/config.ts).

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
- Saving dispatches `updateMatterData({ type, matter_id, data })`; a success effect
  closes the modal and toasts.
- The right column is the documents/folders panel (`FolderStructure`), backed by
  `get_folders` / `create_folder`.

> The old page's per-section S3 upload table is intentionally dropped — that storage
> doesn't exist on the new backend.

---

## Backend & auth

All matter/forms/folders/task calls go through the shared axios instance
([cloudact-ui/src/utils/axios.js](cloudact-ui/src/utils/axios.js)) and are handled by
the auth-server (see [../auth-server/](../auth-server/)); the conversational endpoints
(`/chat`, `/intake-chat`, `/update-chat`, `/download-report`) are served by the Flask app
([../app.py](../app.py)). Matter data (`getSingleMatter`, `getSingleMatterData`,
`getMatterData`, `createMatter`, `updateMatterData`, `patchMatterIntake`) flows through
the Redux action/selector modules under
[cloudact-ui/src/utils/Apis/matters/](cloudact-ui/src/utils/Apis/matters/).

## Gotchas worth knowing

- **`:id` is the matter *number*, not the numeric DB id.** Everything keys off the
  human-readable `CA-YYYY-NNNNN` string.
- **Views are local state, not routes.** Refreshing the browser drops you back to the
  `tasks` view; only `/5-steps`, `/t1-upload`, and the forms editor are real URLs.
- **Task status must round-trip to the server**; the code specifically refuses a
  browser-storage fallback.
- **Re-fetch matter data before AI intake** so the agent sees prior saves — this is a
  deliberate step in `handleIntakeChoice`, not an accident.
- **Header fields (financial year, valuation date) live on the matter row**, so reload
  the header after an intake save.

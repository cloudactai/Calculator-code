# Saved calculations & completing a calculation

How calculation results are persisted to the database, how the "Save to Matter"
button works, what happens when a calculation task or matter is marked as done, and
how saved results are viewed, downloaded, and re-opened later. Start here if a
saved calculation is missing, a PDF download from the documents tab fails, or the
dashboard's "Completed Calculations" count is wrong.

> **Relationship to other docs.** This document covers the persistence layer for
> calculations — everything that happens *after* the math engine returns a result.
> For the calculation engines themselves (child support, spousal support, tax), the
> AI chat workflows, and the PDF report generator that produces the initial report,
> see [CALCULATORS.md](CALCULATORS.md). For the matter workflow and task list that
> contains the calculator panels, see [MATTERS.md](MATTERS.md). For the deployment
> topology and environment variables, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Where it lives

**Auth-server (persistence API)**

| Piece | File |
| --- | --- |
| Calculation report routes (save, list, latest, download PDF, delete) | [auth-server/src/routes/calculationReportsRoutes.js](../auth-server/src/routes/calculationReportsRoutes.js) |
| Computation result routes (save on task/matter completion, list, get, update, delete) | [auth-server/src/routes/computationResultsRoutes.js](../auth-server/src/routes/computationResultsRoutes.js) |
| Database schema (`MatterCalculationReport`, `ComputationResult`) | [auth-server/prisma/schema.prisma](../auth-server/prisma/schema.prisma) |
| Derived-field normaliser (monthly/yearly, child age) | [auth-server/src/utils/derivedFields.js](../auth-server/src/utils/derivedFields.js) |

**Frontend (save, view, download)**

| Piece | File |
| --- | --- |
| Save-to-matter logic (child support chat) | [ChildSupportChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/ChildSupportChatPanel.jsx) — `saveToMatter()` |
| Save-to-matter logic (spousal support chat) | [SpousalSupportChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/SpousalSupportChatPanel.jsx) — `saveToMatter()` |
| Task/matter completion + view-results logic | [SingleMatter.jsx](../cloudact-ui/src/pages/matters/SingleMatter.jsx) — `handleMarkTaskDone()`, `handleToggleMatterStatus()`, `handleViewCalcResults()` |
| Saved reports list + PDF regeneration (documents tab) | [CalculationPdf.jsx](../cloudact-ui/src/components/Matters/Documents/CalculationPdf.jsx) |
| Saved reports list (task-list view) | [CalculationResultsPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/CalculationResultsPanel.jsx) |
| PDF report component (shared with manual calculator) | [CalculationReport.tsx](../cloudact-ui/src/pages/freeCalculatorApi/reports/CalculationReport.tsx) |

---

## Database models

Two Prisma models handle calculation persistence. They are deliberately separate:
`MatterCalculationReport` is the full record (inputs, outputs, PDF bytes) saved
every time the user clicks **Save to Matter**; `ComputationResult` is a lightweight
summary created only when the calculation task or the matter itself is marked as
done, designed for cross-matter queries (e.g. the dashboard's "Completed
Calculations" count).

### `MatterCalculationReport`

Stores every saved calculation run. One matter can have many reports — the user may
re-run the calculator with different inputs or for a different support type. Defined
in [schema.prisma](../auth-server/prisma/schema.prisma).

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | Int (PK) | Auto-incrementing primary key. |
| `userId` | String (FK → User) | The user who saved it. All queries are scoped by user. |
| `matterId` | Int (FK → Matter) | The matter this report belongs to. |
| `calculationType` | String | `"child_support"` or `"spousal_support"`. |
| `taxYear` | String? | Optional tax year the calculation was run for. |
| `label` | String? | User-friendly name, e.g. `"Smith v Jones - Child Support"`. Auto-generated from party names and calculation type. |
| `inputData` | JSON | Full calculation inputs. See "What inputData contains" below. |
| `resultData` | JSON | Calculation outputs. See "What resultData contains" below. |
| `pdfBytes` | Bytes? | The generated PDF as raw binary. Excluded from list queries (`GET /v1/matters/:id/reports`) to keep them fast. |
| `pdfFilename` | String? | Original filename for download headers, e.g. `"Smith v Jones - Child Support.pdf"`. |
| `createdAt` | DateTime | Timestamp of the save. |

### `ComputationResult`

Created when the "CALCULATE CHILD & SPOUSAL SUPPORT" task is marked done, or when
the matter is toggled to done status. One matter can have multiple results
(one per completion action). Defined in
[schema.prisma](../auth-server/prisma/schema.prisma).

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | Int (PK) | Auto-incrementing primary key. |
| `userId` | String (FK → User) | The user who completed it. |
| `matterId` | Int (FK → Matter) | The matter this result belongs to. |
| `calculationType` | String | `"child_support"` or `"spousal_support"`. |
| `status` | String | `"completed"` (default) or `"draft"`. Updatable via PATCH. |
| `inputSummary` | JSON | Key inputs only: `party1_name`, `party2_name`, `party1_income`, `party2_income`, `children`, `party1_province`, `party2_province`. |
| `resultSummary` | JSON | Key outputs: the full `resultData` from the latest `MatterCalculationReport`. |
| `notes` | String? | Optional user notes, updatable via PATCH. |
| `completedAt` | DateTime | When the computation was finalised. |
| `createdAt` | DateTime | Row creation timestamp. |
| `updatedAt` | DateTime | Last modification timestamp. |

---

## What "Save to Matter" does

When the user clicks **Save to Matter** in a child support or spousal support chat
panel, `saveToMatter()` runs five writes in sequence. All writes go through the
auth-server; the Flask backend is not involved.

### 1. Save the calculation report

`POST /v1/matters/:id/reports` with the full calculation record:

```
{
  calculationType: "child_support",
  label:           "Smith v Jones - Child Support",
  inputData: {
    _calcResult: { ... },   // raw tool result from the AI
    _fullState:  { ... },   // manual-calculator-shaped object for PDF rendering
    party1_name, party2_name, party1_income, party2_income, children
  },
  resultData: {
    scenario, party1_monthly, party2_monthly, party1_annual, party2_annual,
    net_payer, net_monthly, net_annual, child_support_ref
  },
  pdfFilename: "Smith v Jones - Child Support.pdf"
}
```

The `_calcResult` field preserves the raw output from the Flask AI tool call. The
`_fullState` field is the same shape the manual calculator uses internally (with
`background`, `aboutTheChildren`, `aboutTheRelationship`, `screen2`,
`supportQuantum`, and `calculator_type` keys), so the `CalculationReport.tsx`
component can render an identical PDF from either path.

### 2. Write back matter sections

The chat panel also updates the matter's own database sections so that party names,
incomes, children, and dates from the calculation are reflected in the matter
record. This keeps the matter data consistent for forms, agreements, and other
tools that read it. The sections written:

- **Background** (`update_matter/:sid/:matterId/background`) — party names, dates
  of birth, provinces. Merged with existing rows so intake-only fields (address,
  occupation, etc.) are preserved.
- **Children** (`update_matter/:sid/:matterId/children`) — names, dates of birth,
  custody arrangements. Merged with any existing children rows.
- **Relationship** (`update_matter/:sid/:matterId/relationship`) — marriage and
  separation dates.
- **Income & Benefits** (`update_matter/:sid/:matterId/incomeBenefits`) —
  employment income rows for both parties (Client and Opposing Party). Existing
  benefit rows are preserved; only the income rows are replaced.

### 3. Save calculator state

A `calculatorState` blob is written to `update_matter/:sid/:matterId/calculatorState`
so the manual calculator can restore the same inputs if the user later switches from
the AI chat to the form-based calculator. The blob contains `calculator_type`,
`background` (first/last names, DOBs, provinces), `aboutTheChildren`
(count + details), and `income` (party income line items).

### 4. Set UI state

`savedToMatter` is set to `true`, which disables the button and shows
"Saved to Matter" in the chat panel.

### 5. Error handling

Each matter-section write (steps 2–3) runs independently with `.catch()` so a
failure in one does not block the others or the primary report save. The primary
save (step 1) does block: if it fails, an alert is shown and `savedToMatter`
remains false.

---

## What happens when a calculation is completed

There is no separate "Complete Calculation" button. Completion happens through the
task lifecycle in
[SingleMatter.jsx](../cloudact-ui/src/pages/matters/SingleMatter.jsx), in two
places:

### Marking the task done

`handleMarkTaskDone("child_spousal_support")` persists the task status as
`"completed"` and, if a `latestCalcReport` exists, saves a `ComputationResult`:

```
POST /v1/matters/:id/computation-results
{
  calculationType: latestCalcReport.calculationType,
  status:          "completed",
  inputSummary: {
    party1_name, party2_name, party1_income, party2_income,
    children, party1_province, party2_province
  },
  resultSummary: latestCalcReport.resultData
}
```

The `inputSummary` is a subset of the report's `inputData` — just the fields
needed for dashboard display and cross-matter querying. The `resultSummary` is the
full `resultData` from the latest report.

### Marking the matter as done

`handleToggleMatterStatus()` toggles the matter's `status` field between 0 (open)
and 1 (done). When toggling to done, the same `ComputationResult` write fires if
`latestCalcReport` exists. This covers matters where the user completes the matter
without explicitly marking the individual task.

### The `onComplete` callback

`handleChildSupportComplete()` is called by the child support chat panel when the
AI generates a calculation result. It marks the task as `"completed"` and returns
the user to the task list view. It does **not** create a `ComputationResult` — that
only happens via the explicit mark-done actions above.

---

## How `latestCalcReport` is loaded

On mount, `SingleMatter.jsx` fetches `GET /v1/matters/:id/reports/latest` to load
the most recent `MatterCalculationReport`. The route
([calculationReportsRoutes.js](../auth-server/src/routes/calculationReportsRoutes.js))
returns the latest report for the matter ordered by `createdAt desc`, excluding
`pdfBytes` from the response.

`latestCalcReport` is used for:

- **Completion writes** — the `inputSummary` and `resultSummary` on the
  `ComputationResult` are derived from it (see above).
- **View Results** — the task-list header's "View Results" button
  (`handleViewCalcResults()`) passes the report's `inputData` and `resultData` to
  the manual calculator via `localStorage`.
- **Existence check** — when the `child_spousal_support` task is already
  `"completed"`, clicking it again does nothing (early return in
  `handleTaskStart`).

---

## Viewing saved results

Saved calculation reports surface in three places in the UI.

### Documents tab — `CalculationPdf.jsx`

[CalculationPdf.jsx](../cloudact-ui/src/components/Matters/Documents/CalculationPdf.jsx)
is rendered in the matter's documents/folders panel (the right column of
ProfileSummaryPanel). It lists all `MatterCalculationReport` rows for the matter
via `GET /v1/matters/:id/reports`.

Each row shows the label, calculation type, and date, with two actions:

- **Download PDF** — regenerates the PDF on-the-fly using `html2pdf.js` and the
  `CalculationReport.tsx` React component. The component is rendered in a hidden
  off-screen `div` (1100px wide, white background), then `html2pdf` captures it
  to a landscape Letter PDF. The data comes from either `_fullState` (if saved by
  the manual calculator) or from `buildFullStateFromCalcResult(_calcResult)` (if
  saved by the AI chat). The stored `pdfBytes` are **not** used for this download
  — PDF is always regenerated client-side so the layout matches the current version
  of the report component.

- **Delete** — `DELETE /v1/reports/:id`, with a confirmation dialog.

> **Why regenerate instead of serving the stored PDF?** The stored `pdfBytes` are
> the server-side PDF (ReportLab for child support, xhtml2pdf for spousal support —
> see [CALCULATORS.md](CALCULATORS.md)). The documents tab uses the *client-side*
> `CalculationReport.tsx` + `html2pdf.js` pipeline instead, which produces the same
> styled landscape report the manual calculator generates. The two pipelines produce
> visually different PDFs, so the documents tab uses its own for consistency with the
> manual calculator's output.

### Task-list "View Results" — `SingleMatter.jsx`

`handleViewCalcResults()` passes the latest report's data through three
`localStorage` keys and navigates to `/calculator`:

| Key | Value |
| --- | --- |
| `viewCalculationData` | `{ inputData, resultData, calculationType }` from the report |
| `selectedCalculatorMatterNumber` | The matter number string |
| `viewOnlyCalcResults` | `"true"` — puts the calculator in read-only result view |

The manual calculator's welcome screen
([WelcomeScreen.jsx](../cloudact-ui/src/pages/calculator/WelcomeScreen/WelcomeScreen.jsx))
checks for `viewCalculationData` on mount. When present, it hydrates the calculator
state from the stored `_fullState` and jumps directly to Screen 4 (the result
screen with visual scenarios), skipping the input screens.

### Task-list reports panel — `CalculationResultsPanel.jsx`

[CalculationResultsPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/CalculationResultsPanel.jsx)
is a simpler list view used from the task-list area. It lists all reports for the
matter with a **View Results** button that uses the same `localStorage` bridge to
navigate to `/calculator` (but to the `/calculator` route rather than
`/SupportCalculator`).

---

## Auth-server API endpoints

All endpoints require authentication (JWT cookie). Matter lookups accept either the
`matterNumber` string (e.g. `CA-2026-00001`) or the numeric database id.

### Calculation reports

| Endpoint | Method | Description |
| --- | --- | --- |
| `/v1/matters/:id/reports` | POST | Save a new report. Body: `{ calculationType, inputData, resultData, pdfBase64?, pdfFilename?, taxYear?, label? }`. Returns `{ id }`. |
| `/v1/matters/:id/reports/latest` | GET | Get the most recent report for the matter (excludes `pdfBytes`). Returns the report object or `null`. |
| `/v1/matters/:id/reports` | GET | List all reports for the matter (excludes `pdfBytes`), newest first. |
| `/v1/reports/:id/pdf` | GET | Download a report's stored PDF as `application/pdf`. |
| `/v1/reports/:id` | DELETE | Delete a report and its PDF. |

### Computation results

| Endpoint | Method | Description |
| --- | --- | --- |
| `/v1/matters/:id/computation-results` | POST | Save a computation result. Body: `{ calculationType, inputSummary, resultSummary, status?, notes? }`. Returns `{ id }`. |
| `/v1/matters/:id/computation-results` | GET | List computation results for the matter, newest first. |
| `/v1/computation-results/:id` | GET | Get a single computation result. |
| `/v1/computation-results/:id` | PATCH | Update `notes` and/or `status`. |
| `/v1/computation-results/:id` | DELETE | Delete a computation result. |

---

## What `inputData` contains

The `inputData` JSON on `MatterCalculationReport` carries everything needed to
re-render the result screen and regenerate the PDF. It has three layers:

| Key | Source | Purpose |
| --- | --- | --- |
| `_calcResult` | Raw AI tool result from Flask | The unmodified output of `run_calc_tool()` / `run_spousal_calc_tool()` — party names, incomes, children, scenario, amounts, tax profiles, INDI breakdowns. Used by `CalculationPdf.jsx` as a fallback when `_fullState` is absent. |
| `_fullState` | Built by `saveToMatter()` | The same shape the manual calculator uses: `background`, `aboutTheChildren`, `aboutTheRelationship`, `screen2` (incomes, taxes, benefits, disposable income), `supportQuantum` (support amounts for three scenarios), and `calculator_type` (`"CHILD"` or `"SPOUSAL"`). This is what `CalculationReport.tsx` reads directly. |
| Top-level fields | Extracted for querying | `party1_name`, `party2_name`, `party1_income`, `party2_income`, `children` — duplicated at the top level so the listing and dashboard can show them without parsing the nested objects. |

When `_fullState` is present (the normal case), `CalculationPdf.jsx` uses it
directly. When only `_calcResult` exists (older saves or edge cases),
`buildFullStateFromCalcResult()` in `CalculationPdf.jsx` constructs the `_fullState`
shape from the raw result — mapping `party1_income` → `screen2.totalIncomeParty1`,
`children` → `aboutTheChildren.childrenInfo`, tax profiles →
`screen2.taxesFromApi` / `benefitsFromApi` / `disposableIncome`, and so on.

---

## What `resultData` contains

The `resultData` JSON varies by calculation type:

**Child support:**
```
{
  scenario:        "SEPARATED" | "SHARED" | "SPLIT" | "HYBRID",
  party1_monthly:  1250,
  party2_monthly:  0,
  party1_annual:   15000,
  party2_annual:   0,
  net_payer:       "Party 1",
  net_monthly:     1250,
  net_annual:      15000,
  child_support_ref: 1250
}
```

**Spousal support:**
```
{
  scenario,
  spousal_low_monthly, spousal_mid_monthly, spousal_high_monthly,
  spousal_low_annual,  spousal_mid_annual,  spousal_high_annual,
  recipient:           "Party 2",
  duration_label:      "7.5 to 15 years",
  party1_indi_low, party1_indi_mid, party1_indi_high,
  party2_indi_low, party2_indi_mid, party2_indi_high,
  party1_taxes_low, ..., party2_benefits_high,
  monthly_cs_paid, child_support_paid
}
```

---

## Common pitfalls

- **The documents tab regenerates the PDF client-side.** It does *not* serve the
  stored `pdfBytes` from the database. If the `CalculationReport.tsx` component
  changes, existing reports will render with the new layout on their next download.
  The stored `pdfBytes` are still available via `GET /v1/reports/:id/pdf` but are
  not used by the UI.

- **`_fullState` vs `_calcResult`.** Reports saved by the AI chat have both;
  reports saved by the manual calculator have only `_fullState`. If neither is
  present, `CalculationPdf.jsx` shows an alert asking the user to re-run the
  calculation. Adding new fields to the AI tool result (`_calcResult`) requires a
  corresponding update to `buildFullStateFromCalcResult()` if they should appear in
  the PDF.

- **`pdfBytes` is excluded from list queries.** The `GET /v1/matters/:id/reports`
  and `GET /v1/matters/:id/reports/latest` responses omit `pdfBytes` (it can be
  megabytes per report). Use `GET /v1/reports/:id/pdf` to download the stored PDF
  directly.

- **Computation results are only created on explicit completion.** The `onComplete`
  callback from the chat panel marks the task as done but does not create a
  `ComputationResult`. Only `handleMarkTaskDone()` and
  `handleToggleMatterStatus()` do that — and only when `latestCalcReport` is not
  null.

- **The matter-section write-back is fire-and-forget.** Steps 2–3 of
  `saveToMatter()` run with `.catch()` and do not block. A failure there means the
  calculation report is saved but the matter's background/children/income sections
  may be stale. The next AI intake or update chat will re-read the matter and see
  whatever was last successfully written.

- **`viewCalculationData` in `localStorage` is a one-shot bridge.** The manual
  calculator reads and clears it on mount. If the user navigates away before the
  calculator loads, the data is lost and they need to click "View Results" again.

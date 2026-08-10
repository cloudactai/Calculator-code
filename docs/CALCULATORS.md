# Calculators, AI chat assistants & the calculation engine

How the child support, spousal support, and tax calculators work — the math engines,
the AI chat workflows, the form-based endpoints, and the PDF reports they produce.
Start here if you are debugging a wrong calculation result, a chat that loops or
stalls, a PDF that fails to generate, or a "Save to Matter" that does not persist.

> **Relationship to other docs.** This document covers the Flask backend's
> calculation and AI features (everything under [app.py](../app.py)). For the
> hosting, environment variables, and deployment topology, see
> [ARCHITECTURE.md](ARCHITECTURE.md). For authentication and session cookies, see
> [AUTHENTICATION.md](AUTHENTICATION.md). For the matter workflow that *contains*
> the calculator chat panels, see [MATTERS.md](MATTERS.md).

---

## Where it lives

**Backend (Flask — [app.py](../app.py))**

| Piece | File |
| --- | --- |
| All endpoints & AI agent loops | [app.py](../app.py) |
| PDF report generator | [report_pdf.py](../report_pdf.py) |
| Generated reports directory | `generated_reports/` (created at import time) |
| Child support math engine | [child_support.py](../child_support.py) |
| Spousal support math engine | [spousal_support.py](../spousal_support.py) |
| Tax engine (ON + BC) | [tax.py](../tax.py) |
| Tax year constants | [tax_constants.json](../tax_constants.json) |
| Schedule I table data (ON + BC, 2025) | [schedule_i.json](../schedule_i.json) |
| Standalone calculator HTML | [templates/calculator.html](../templates/calculator.html) |
| Standalone spousal chat HTML | [templates/spousal-chat.html](../templates/spousal-chat.html) |

**Frontend chat panels ([cloudact-ui/src/components/MatterWorkflow/](../cloudact-ui/src/components/MatterWorkflow/))**

| Piece | File |
| --- | --- |
| Child support chat panel | [ChildSupportChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/ChildSupportChatPanel.jsx) |
| Spousal support chat panel | [SpousalSupportChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/SpousalSupportChatPanel.jsx) |
| Matter intake chat panel | [MatterIntakeChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/MatterIntakeChatPanel.jsx) |
| Update information chat panel | [UpdateInformationChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/UpdateInformationChatPanel.jsx) |
| Floating calculator chat widget | [FamilyLawChat.jsx](../cloudact-ui/src/components/FamilyLawChat/FamilyLawChat.jsx) |
| Shared chat/context styling | [MatterWorkflow.css](../cloudact-ui/src/components/MatterWorkflow/MatterWorkflow.css) |
| Context builder for stored intake | [matterIntakeContext.js](../cloudact-ui/src/components/MatterWorkflow/matterIntakeContext.js) |

---

## Background

Calculating child support and spousal support in Canada requires accurate interpretation
of the Federal Child Support Guidelines (Schedule I), the Spousal Support Advisory
Guidelines (SSAG), and each province's full tax and benefit regime. Family-law
professionals often spend significant time on manual lookups and iterative tax
calculations across complex custody scenarios (separated, shared, split, hybrid) and
both SSAG formulas (with and without children).

The platform currently supports **Ontario (ON)** and **British Columbia (BC)**. The
province affects three things: the Schedule I table amounts used for child support
lookups, the provincial tax brackets and credits applied by the tax engine, and the
provincial benefit programs included in INDI calculations. The child support chat AI
is required to ask the user which province the calculation is for before proceeding,
and will not default to Ontario — the `province` field must be set to `"ON"` or `"BC"`.

The platform addresses this by combining a child support calculator, a spousal support
calculator, a tax calculator, a matter-intake agent, and an update-information agent —
all powered by Claude claude-sonnet-4-6 with tool-use support. Users receive accurate
monthly and annual child support figures for all custody scenarios, low/mid/high SSAG
spousal support ranges with duration, individual net disposable income (INDI)
breakdowns, complete tax and benefit calculations, and auto-generated PDF reports.
Calculation results and matter data are persisted through the authenticated frontend
for legal-professional use.

---

## Technology stack (calculator-specific)

The full deployment topology is in [ARCHITECTURE.md](ARCHITECTURE.md). This section
covers only the pieces that matter for the calculators.

| Layer | What |
| --- | --- |
| **Frontend** | React + Vite for the authenticated legal-professional interface (matter workflow, intake forms, calculator chat panels). HTML5 / CSS3 / vanilla JavaScript for the standalone calculator form and legacy chat interface. `marked.js` renders AI markdown responses inside chat bubbles as styled HTML. |
| **Backend** | Python 3 / Flask handling all calculation endpoints (`/calculate`, `/chat`, `/spousal-calculate`, `/spousal-chat`, `/intake-chat`, `/update-chat`, `/tax-chat`, `/t1-extract`) plus AI agent loops and PDF generation. The Anthropic Python SDK interfaces with Claude claude-sonnet-4-6 for every AI chat assistant with tool-use support. |
| **Child support engine** | [child_support.py](../child_support.py) implements the Federal Child Support Guidelines for all four custody scenarios. Province-aware: each party carries a `province` field (`"ON"` or `"BC"`) that selects the correct Schedule I rows. |
| **Spousal support engine** | [spousal_support.py](../spousal_support.py) provides three APIs: a without-children percentage formula (1.5% / 1.75% / 2.0% × gross income difference × years), a with-children iterative tax-converging formula (damped fixed-point iteration calling the tax engine per step), and a wrapper that routes to the appropriate formula. Accepts a `province` parameter (defaults to `"ON"`) that is forwarded to the tax engine so provincial taxes converge correctly for BC or Ontario. |
| **Tax engine** | [tax.py](../tax.py) — full Canadian income-tax and benefits calculator supporting Ontario and British Columbia. Year-variable constants (bracket tables, indexed amounts) are stored in [tax_constants.json](../tax_constants.json). **Ontario-specific:** provincial income tax, surtax, Ontario health premium, LIFT credit, Ontario Child Benefit (OCB), Ontario Sales Tax Credit (OSTC). **BC-specific:** provincial income tax with BC tax reduction, BC Child Benefit, BC Climate Action Tax Credit, BC-specific CWB thresholds. **Shared federal:** income tax, CPP/EI, Canada Workers Benefit (CWB), Canada Child Benefit (CCB), GST/HST credit, Climate Action Incentive Payment (CAIP). |
| **Data** | [schedule_i.json](../schedule_i.json) (2025 Federal Child Support Guidelines Schedule I table for both ON and BC — 1608 rows, keyed by `province`). [tax_constants.json](../tax_constants.json) (year-keyed tax brackets and indexed amounts for both provinces). Prisma / PostgreSQL (auth server and matter database, separate service). No persistent user data in the calculator backend — all session data is in-memory; persisted data flows through the authenticated frontend into the auth-server database. |
| **PDF generation** | ReportLab produces PDF reports for child and spousal support results. |
| **Hosting** | Render.com for the Flask backend; Vercel for the React frontend. See [ARCHITECTURE.md](ARCHITECTURE.md) for details. |

---

## Province support

The platform currently supports two provinces. Adding a new province requires three
data additions and no structural code changes:

| Component | Ontario (ON) | British Columbia (BC) |
| --- | --- | --- |
| **Schedule I rows** | [schedule_i.json](../schedule_i.json), `"province": "ON"` | [schedule_i.json](../schedule_i.json), `"province": "BC"` |
| **Tax brackets & credits** | [tax_constants.json](../tax_constants.json) — `ON_BRACKETS`, `BASIC_PERSONAL_AMOUNT_ON`, Ontario health premium, surtax, LIFT, OCB, OSTC constants | [tax_constants.json](../tax_constants.json) — `BC_BRACKETS`, `BASIC_PERSONAL_AMOUNT_BC`, BC tax reduction, BC Child Benefit, BC Climate Action constants |
| **Tax engine functions** | `calculate_ontario_tax()`, Ontario surtax, Ontario health premium, `calculate_ontario_child_benefit()`, `calculate_ontario_sales_tax_credit()` | `calculate_bc_tax()`, BC tax reduction, `calculate_bc_child_benefit()`, `calculate_bc_climate_action()`, BC-specific CWB thresholds |
| **Child support** | Fully supported | Fully supported (same engine, different Schedule I rows) |
| **Spousal support** | Fully supported (iterative formula calls ON tax engine) | Fully supported (iterative formula calls BC tax engine via `province` parameter) |
| **Child support AI chat** | Supported — AI asks province early | Supported — AI asks province early |
| **Tax AI chat** | Supported (system prompt scoped to ON) | Engine supports BC; AI prompt currently restricts to ON only |

The child support engine in [child_support.py](../child_support.py) is inherently
province-agnostic — it looks up Schedule I rows by province and computes obligations
from whatever rows match. The tax engine in [tax.py](../tax.py) branches on
`province == "BC"` vs `"ON"` at each province-specific calculation point (provincial
credits, provincial tax, provincial benefits). To add a third province, one would add
its Schedule I rows to `schedule_i.json`, its tax constants to `tax_constants.json`,
and its `calculate_<province>_tax()` and benefit functions to `tax.py`.

---

## Workflows

The platform provides multiple workflows sharing common backend calculation engines.
Each workflow is described below with its end-to-end data flow.

### 1. Child support calculator — form workflow

1. User loads the calculator at `/` (Flask serves `templates/calculator.html` with
   static CSS and JS).
2. User enters Party 1 and Party 2 guideline incomes and adds children with custody
   arrangements via the form UI.
3. On submit, the browser POSTs JSON to `/calculate`.
4. Flask calls `compute_child_counts()` to categorize children, then
   `determine_type_of_splitting()` to classify the scenario as SEPARATED, SHARED,
   SPLIT, or HYBRID.
5. `calculate_child_support()` runs the Schedule I formula against
   [schedule_i.json](../schedule_i.json) for each party, filtering rows by the
   party's province (`"ON"` or `"BC"`).
6. JSON result is returned. The browser renders monthly and annual figures for both
   parties with a net-payer verdict.
7. The backend auto-generates a PDF report via ReportLab containing the input
   parameters, scenario classification, per-party gross obligations, and final
   net-payer determination. The PDF is saved to a server-side temporary directory and
   returned to the browser as both a download URL (`/download-report/:filename`) and
   a base64-encoded payload.
8. The frontend displays a **Download PDF Report** button (using the URL or base64)
   and a **Save to Matter** button that persists the calculation result and the PDF
   attachment to the matter record in the auth-server database, associating the
   report with the current matter for future retrieval.

### 2. Child support AI chat workflow

1. User opens the Child Support chat panel within the matter workflow. The panel
   auto-loads existing matter data as context.
2. The `buildContextMessage` function splits matter data into two channels: session
   metadata (law firm, firm ID, lawyer name, province, matter number, client name) is
   placed in an `aiOnly` array sent only to the AI, while actual matter data (party
   names, DOBs, incomes, children, etc.) is placed in a `display` array shown in the
   chat bubble. (See *AI chat panel architecture* below for full details.)
3. When display data exists, it appears as a user bubble. When only session metadata
   exists (no visible matter data), the display returns `null` and the user bubble is
   hidden entirely — the AI still receives all data.
4. The first message is sent as an automated database snapshot. The AI system prompt
   instructs Claude to treat it as pre-existing information (not user-typed), so it
   does not thank the user for providing it.
5. Browser POSTs the full message history to `/chat`. Flask passes messages to Claude
   claude-sonnet-4-6 via the Anthropic API with a `calculate_child_support` tool
   definition. The tool schema includes a `province` field with enum `["ON", "BC"]`.
6. The AI system prompt requires Claude to ask which province the calculation is for
   (Ontario or British Columbia) early in the conversation. If the matter data already
   includes a province, the AI uses that and confirms it. Claude collects any remaining
   missing details conversationally, then invokes the tool.
7. Flask intercepts the tool call, runs `run_calc_tool()` which calls the same
   `calculate_child_support()` engine used by the form, and auto-generates a PDF
   report.
8. The tool result (including a download URL and base64-encoded PDF) is returned to
   Claude. Claude explains the outcome in plain language and includes the download
   link.
9. The frontend displays a **Download PDF Report** button and a **Save to Matter**
   button allowing the user to persist the calculation result to the matter record.

### 3. Spousal support calculator — form workflow

1. User submits party incomes, ages, relationship duration, children details, and
   province (`"ON"` or `"BC"`, defaults to `"ON"` if omitted) to
   `/spousal-calculate`.
2. The backend determines whether to use the without-children formula or the
   with-children iterative tax-converging formula.
3. **Without children:** applies 1.5% / 1.75% / 2.0% × gross income difference ×
   years of relationship for low/mid/high amounts.
4. **With children:** runs `calculate_spousal_support_iterative()`, which uses damped
   fixed-point iteration (~6 steps per rate) calling the tax engine on each step so
   spousal support and taxes converge together. The province is forwarded to the tax
   engine so BC or Ontario brackets, credits, and benefits are used correctly. Child
   support amounts are auto-computed from children's details and incomes.
5. Returns low/mid/high monthly and annual spousal support amounts, INDI (Individual
   Net Disposable Income) breakdowns, tax and benefit details for all three scenarios,
   and duration ranges.
6. The backend auto-generates a PDF report via ReportLab containing party details,
   relationship duration, the formula path used (without-children or with-children
   iterative), low/mid/high monthly and annual spousal support amounts, INDI
   breakdowns, tax and benefit line items, and the SSAG duration range.
7. The frontend displays a **Download PDF Report** button and a **Save to Matter**
   button that persists the calculation result and PDF attachment to the matter record.

### 4. Spousal support AI chat workflow

1. User opens the Spousal Support chat panel within the matter workflow. Like the
   child support panel, it auto-loads matter data with the same display/aiOnly split.
2. Session metadata is hidden from the chat bubble; only matter data is shown. If no
   visible matter data exists, the bubble is hidden entirely.
3. Browser POSTs to `/spousal-chat`. The AI determines the correct path:
   - **Path A** (no children or all children 18+): collects gross incomes, years of
     relationship, and recipient age. Uses the without-children percentage formula.
     Does not ask about deductions.
   - **Path B** (minor children present): collects gross incomes, both parties' ages,
     children's DOBs and custody, and optional deductions (RRSP, child care). Uses the
     iterative tax-converging formula. Child support amounts are auto-computed.
4. Flask calls `run_spousal_calc_tool()` which routes to the appropriate formula and
   auto-generates a PDF report.
5. Results include payor/recipient determination, low/mid/high spousal support
   amounts, INDI breakdowns (for the with-children path), and duration ranges.
6. **Download PDF Report** and **Save to Matter** buttons are displayed, same as child
   support.

### 5. Matter intake AI chat workflow

1. User opens the intake chat panel. Any existing matter data is loaded as context.
2. The AI works through ten intake sections in order: Background, Relationship,
   Children, IncomeAndBenefits, EmploymentDetails, Expenses, Assets,
   DebtsAndLiabilities, Court, and OtherPersonsInHousehold. It calls
   `save_matter_section` for each section as data is collected.
3. Each save is a PATCH — only new or changed fields are sent, preserving existing
   values. The endpoint never writes to the database itself; it returns collected
   sections so the authenticated frontend persists them.
4. A stall guard detects when the AI promises to save but does not emit tool calls,
   and nudges it to actually call the tool.
5. When all required sections are complete, the AI sends a final "Intake complete and
   saved" summary.

### 6. Update information AI chat workflow

1. Uses the same `save_matter_section` tool as intake but with a different system
   prompt focused on editing existing values.
2. Opens with the current matter snapshot and asks what the user wants to change.
3. For each change, the AI identifies the matching record, calls
   `save_matter_section` with a minimal patch, and reports the change as "Updated
   [field] from [old] to [new]".
4. Never runs a fresh intake — stays available for as many individual changes as the
   user wants.

### 7. Tax calculator AI chat workflow

1. The AI collects age, tax year, disability status, income sources (employment,
   self-employment, other, support received, support paid), deductions (child care,
   other), and children's details.
2. It calls the `calculate_taxes` tool which runs the full tax engine. The tool
   accepts an optional `province` parameter (`"ON"` or `"BC"`, defaults to `"ON"`).
   The engine computes federal/provincial brackets, CPP/EI, and province-specific
   items: Ontario health premium, surtax, and LIFT credit for ON; BC tax reduction for
   BC. Benefit programs include CWB, CCB, GST/HST credit, and CAIP (shared), plus
   Ontario Child Benefit and OSTC (ON) or BC Child Benefit and BC Climate Action Tax
   Credit (BC).
3. Returns a comprehensive breakdown with every line item, displayed as a formatted
   table.

> **Current AI prompt limitation.** The tax chat system prompt currently instructs
> Claude to handle "Ontario income tax only" and decline other provinces. The
> underlying `calculate_taxes` function and `TaxInput` dataclass fully support BC,
> and the spousal support iterative formula already calls it with `province="BC"` when
> appropriate. Updating the tax chat system prompt to offer BC as an option is a
> straightforward change.

---

## AI chat panel architecture

Both the Child Support and Spousal Support chat panels
([ChildSupportChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/ChildSupportChatPanel.jsx)
and
[SpousalSupportChatPanel.jsx](../cloudact-ui/src/components/MatterWorkflow/SpousalSupportChatPanel.jsx))
share a common architecture for handling matter context. The intake and update panels
follow the same pattern.

### Context message construction (`buildContextMessage`)

The `buildContextMessage` function returns an object with two properties: `display`
(what the user sees in the chat bubble) and `ai` (what is sent to the AI). This
separation ensures the AI has full context while the user interface remains clean.

**Session metadata** — law firm name, firm ID, lawyer/user name, province, matter
number, and client name — is placed in an `aiOnly` array. This data is included in the
`ai` text sent to Claude but excluded from the `display` text shown in the chat bubble.

**Matter data** — party names, dates of birth, addresses, relationship details,
children, incomes, expenses, assets, debts, and court information — is formatted via
the `formatSections` function and included in both `display` and `ai`.

When there is no visible matter data (only session metadata), `display` returns `null`.
The send function checks for `displayText === null` and hides the user bubble entirely,
preventing an empty or metadata-only bubble from appearing. The AI still receives all
information it needs via the `ai` text.

### The `send` function

`send(text, displayText)` accepts two parameters: `text` (sent to the AI) and
`displayText` (shown in the chat bubble).

- When `displayText` is explicitly `null`, the `const hideUserBubble = displayText === null` check triggers and no user bubble is rendered.
- When `displayText` is a string, it is shown as the bubble content.
- When `displayText` is `undefined` (normal user messages), the user's typed text is shown.

### Auto-context on mount

Both panels auto-send context on mount via a `useEffect` hook. When `matterData` is
present and context has not been sent, `buildContextMessage` is called and the result
is passed to `send(ctx.ai, ctx.display)`. This means the AI receives the full matter
snapshot immediately when the panel opens, and the user sees only the relevant matter
data (or nothing if there is only session metadata).

---

## PDF report generation

Both the child support and spousal support workflows produce downloadable PDF reports.
All generation logic lives in [report_pdf.py](../report_pdf.py), which exposes two
functions: `generate_child_support_report()` and `generate_spousal_support_report()`.
Reports are written to a `generated_reports/` directory (created at import time) and
served to the browser via the `GET /download-report/:filename` endpoint.

### How reports are triggered

Reports are generated automatically in two contexts. In the **form workflows**
(`/calculate` and `/spousal-calculate`), the backend calls the generator immediately
after the calculation completes and includes both a `download_url` (e.g.
`/download-report/child_support_report_a1b2c3d4e5f6.pdf`) and a `pdf_base64` payload
in the JSON response. In the **AI chat workflows** (`/chat` and `/spousal-chat`), the
same generation happens inside `run_calc_tool()` / `run_spousal_calc_tool()` after the
AI invokes the calculation tool — the tool result returned to Claude includes the
download URL so it can present the link to the user. Both workflows also expose
standalone report tools (`generate_report` and `generate_spousal_report`) that Claude
can call separately if it needs to regenerate a report with different parameters.

### Child support report (ReportLab)

The child support report uses ReportLab's `SimpleDocTemplate` to build a structured
PDF with US Letter page size. The layout includes a branded title ("CLOUDACT FAMILY
LAW TOOLS"), a calculation input section showing both parties' guideline incomes and
the custody scenario, a children table listing each child's name, age, custody
arrangement, and adult status, and a result section showing the net payer, monthly and
annual child support amounts, and per-party obligations for offset scenarios. The
report uses a consistent colour scheme (dark blue text, light blue headers, green
result background) with Helvetica typography. Each report filename includes a random
UUID segment for uniqueness.

### Spousal support report (xhtml2pdf)

The spousal support report uses xhtml2pdf to render an HTML template that matches the
`CalculationReport.tsx` React component's layout exactly, ensuring the PDF and the
in-browser preview look identical. The HTML template includes party information (names,
incomes, ages, provinces), important dates (marriage, separation, relationship
duration, recipient age at separation), a children table with custody and CSG table
status, a child support section (if applicable), and the spousal support results
showing low/mid/high monthly and annual amounts with duration ranges.

When the with-children SSAG formula is used, the report additionally includes a
detailed INDI (Individual Net Disposable Income) breakdown for each scenario
(low/mid/high), showing gross income, taxes, government benefits, child support
adjustments, spousal support flows, and the resulting disposable income for both
parties. This allows the lawyer to verify the iterative tax-converging calculation at
every step.

### Delivery to the frontend

The frontend receives each PDF in two forms. The `download_url` path
(`/download-report/:filename`) allows immediate download via a **Download PDF Report**
button. The `pdf_base64` field contains the raw PDF bytes as a base64 string, which the
**Save to Matter** button sends to the auth-server database as an attachment on the
matter record, so the report is permanently associated with the matter and retrievable
later without regeneration.

---

## API endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/calculate` | POST | Form-based child support calculation. Accepts party incomes, children array, and province (`"ON"` or `"BC"`). Returns scenario type, monthly/annual amounts, and net payer. |
| `/chat` | POST | Child support AI chat. Message-loop with Claude using `calculate_child_support` tool (province-aware, ON/BC). Auto-generates PDF report. Returns calculation result for frontend persistence. |
| `/spousal-calculate` | POST | Form-based spousal support calculation. Accepts province (`"ON"` or `"BC"`, defaults to `"ON"`). Routes to no-children formula or iterative with-children engine. Returns low/mid/high amounts, INDI, taxes, benefits, and duration. |
| `/spousal-chat` | POST | Spousal support AI chat. Message-loop with Claude using `calculate_spousal_support` tool. Province-aware. Two paths: without-children (gross % formula) and with-children (iterative tax-converging). Auto-generates PDF. |
| `/intake-chat` | POST | Matter intake AI agent. Collects ten sections of family-law intake data via `save_matter_section` tool. Returns collected sections for frontend persistence. Includes stall guard. |
| `/update-chat` | POST | Update information AI agent. Same tool as intake but for editing existing values. Returns patches for frontend persistence. |
| `/tax-chat` | POST | Tax calculator AI chat. Collects income/deduction/children data and runs the full tax engine (ON/BC supported by engine; AI prompt currently scoped to ON). Returns comprehensive breakdown. |
| `/t1-extract` | POST | T1 tax return extraction. Parses uploaded tax returns; explicitly never extracts SINs. |
| `/download-report/:filename` | GET | Serves generated PDF reports for download. |

---

## Deployment notes

> **Full deployment documentation is in [ARCHITECTURE.md](ARCHITECTURE.md).** This
> section covers only the calculator-specific deployment steps.

1. Push code to the GitHub repository — the `main` branch triggers auto-deploy on
   Render for the backend and Vercel for the frontend.
2. Add `ANTHROPIC_API_KEY` as an environment variable in the Render service dashboard.
3. The backend auto-starts using the [Procfile](../Procfile) command. All calculator
   and AI chat endpoints are accessible at the Render service URL.
4. The frontend React app is built and deployed via Vercel, configured with the
   `CALCULATOR_API` URL pointing to the Render backend.

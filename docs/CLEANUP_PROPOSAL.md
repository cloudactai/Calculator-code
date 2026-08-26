# CloudAct cleanup proposal

Status: in progress. Level 1 has started; the rest of the proposal is unchanged.

## Completed so far

| Change | Commit | Lines |
| --- | --- | --- |
| `StaticFields.js` + `fetchFieldData.js` deleted | `5779b8b` | -36,886 |
| `FillPdf.jsx` retired prefill engine deleted (note at 251-256 kept) | `512f46d` | -1,417 |

Deferred by decision: `MatterFormData_old.jsx` stays for now.

### Verifying the remaining batches

`npm run build` cannot be used as the gate. It currently fails in
`src/pages/calculator/screen2/Screen2.tsx` line 4953 on
`@typescript-eslint/no-unused-expressions`, which is Marc's in-flight calculator
work and unrelated to any cleanup. The failure reproduces with every deleted file
restored, so a red build is not evidence that a deletion broke something.

Use these instead:

1. `CI=true npx react-scripts test --watchAll=false`, and diff the PASS/FAIL suite
   list against a stashed baseline. The stable signature is 18 passed, 9 failed
   (the calculator suites plus `Navbar.test.js`, which fails because
   `powerbi-client` calls `crypto.getRandomValues` at import time under jsdom).
2. For deletions, re-resolve every import specifier in the surviving files against
   the removed set, with comments stripped so commented-out imports do not count
   as live edges.
3. For a commented-out block, confirm the comment delimiters first. Check that no
   stray `*/` closes it early, then parse the stripped file through
   `@babel/parser` with the `jsx` plugin before committing.

Scope: primarily `cloudact-ui`, excluding Marc's calculator implementations. The calculator UI was inspected only where necessary to understand imports. Root Python calculator code, `cloudact-ui/src/pages/calculator*`, `freeCalculator*`, and `InProgressCalc` are not removal targets in this proposal.

## How candidates were checked

- Traced imports from `src/index.tsx`, app routes, tests, setup files, JavaScript/TypeScript imports, dynamic imports, CSS/SCSS imports, and asset URLs.
- Searched the full repository for direct references to every Level 1 candidate.
- Distinguished an unused action/selector from a reducer that is still registered in the Redux store.
- Treated files that might be retained for rollback, generated manually, loaded by convention, or used outside the frontend build as Level 2 or 3 even when no current import was found.
- Did not classify explanatory comments as dead code. The broad comment scan is only a lead list; it is not evidence by itself.

## Level 1 — definitely remove

These are excluded from execution/build output or have no importer/reference anywhere in the repository. They can be removed as a first, reviewable cleanup batch.

### Generated and accidental files

- `cloudact-ui/src/assets/.sass-cache/`: 41 tracked Ruby Sass compiler-cache files, about 2.6 MB. This is generated cache data, not source.
- `cloudact-ui/src/test_write_permission`: empty probe file.
- `cloudact-ui/src/assets/css/css`
- `cloudact-ui/src/assets/scss/css`

The last two files contain a Ruby Sass `ENOENT` error page, not usable stylesheets.

### Large confirmed dead code

- **DONE (`5779b8b`)** `cloudact-ui/src/utils/Apis/matters/CustomHook/StaticFields.js`: 36,870 lines / about 748 KB. The same field geometry ships as `auth-server/form-template-export/<docId>.json`, loads into `FormTemplateVersion.fieldMapping`, and reaches the editor over the forms API, which `FillPdf` reads at `remoteDocument.mapping?.staticFields` with no fallback to the local copy.
- **DEFERRED** `cloudact-ui/src/utils/matterData/MatterFormData_old.jsx`: 487 lines, no repository reference. It hardcodes 42 forms across 2 provinces; the live `MatterFormData.jsx` fetches the catalogue from `/forms`, which now serves 609 templates across BC, MB, ON and SK. Held back by decision, not by doubt.
- **DONE (`512f46d`)** The block comment in `cloudact-ui/src/pages/formPages/FillPdf.jsx` from the second `/*` at line 257 through its close at line 1673: 1,417 lines. Of the 88 symbols it defined, only `index` appeared in live code, as an unrelated handler parameter; its centrepiece `bindFieldsToData` was never called. The explanatory note at 251-256 was kept.

### Confirmed orphan modules

Each file below is outside the entry-point import graph and has no external source reference:

- `cloudact-ui/src/components/DeleteLoader/DeleteLoader.jsx`
- `cloudact-ui/src/components/FormPages/forms/newComponents/ApplicantsTable.jsx`
- `cloudact-ui/src/components/FormPages/forms/newComponents/CalculationComponent.jsx`
- `cloudact-ui/src/components/FormPages/forms/newComponents/CreateChildrensTable.jsx`
- `cloudact-ui/src/components/FormPages/forms/newComponents/DynamicChildrenTable.jsx`
- `cloudact-ui/src/components/FormPages/forms/newComponents/PageFooters.jsx`
- `cloudact-ui/src/components/FormPages/forms/newComponents/PageHeaders.jsx`
- `cloudact-ui/src/components/FormPages/forms/newComponents/TableGeneratorModal.tsx`
- `cloudact-ui/src/components/LayoutComponents/LabelAndInput/LabelAndInput.tsx`
- `cloudact-ui/src/components/Matters/Documents/AllDocuments.jsx`
- `cloudact-ui/src/components/Matters/Documents/DocumentsSection.jsx`
- `cloudact-ui/src/components/Matters/Form/SearchableDropdown.js`
- `cloudact-ui/src/components/Tasks/ComplianceSelectorOld.jsx`
- `cloudact-ui/src/containers/ComplianceFormsTabs/AllComplianceForms.cont.jsx`
- `cloudact-ui/src/containers/ComplianceFormsTabs/ApprovedComplianceForms.cont.jsx`
- `cloudact-ui/src/containers/ComplianceFormsTabs/InprogressComplianceForms.cont.jsx`
- `cloudact-ui/src/containers/Dashboard/DashboardTables/DashboardCards.jsx`
- `cloudact-ui/src/containers/Dashboard/DashboardTables/DashboardTable.jsx`
- `cloudact-ui/src/containers/Dashboard/DoubleDonutChart.jsx`
- `cloudact-ui/src/hooks/pdfForms/useFieldOperations.js`
- `cloudact-ui/src/hooks/pdfForms/useTableOperations.js`
- `cloudact-ui/src/pages/Setupwizard.jsx`
- `cloudact-ui/src/pages/Workflow/initialElements.js`
- `cloudact-ui/src/pages/complianceForms/ComplianceFormLayout.tsx`
- `cloudact-ui/src/pages/fiveSteps/FinancialSummarySimple.jsx`
- `cloudact-ui/src/utils/Apis/matters/CustomHook/CalculateTotals.js`
- ~~`cloudact-ui/src/utils/Apis/matters/CustomHook/fetchFieldData.js`~~ **DONE (`5779b8b`)** — fetched the same `staticFields` from `/documents/json_data/<form>.json`, a directory that no longer exists under `public/`.
- `cloudact-ui/src/utils/Apis/matters/getPdfData/getPdfData.jsx`
- `cloudact-ui/src/utils/Apis/matters/http-request.service.ts`
- `cloudact-ui/src/utils/Apis/uploadProfilePhoto.ts`
- `cloudact-ui/src/utils/PowerBi/authService.tsx`
- `cloudact-ui/src/utils/matterData/assetsCalculations.js`
- `cloudact-ui/src/utils/matterData/calculationUtils.js`
- `cloudact-ui/src/utils/matterData/dataObjects.tsx`
- `cloudact-ui/src/utils/matterData/emptyDataArray.js`
- `cloudact-ui/src/utils/pdfForms/fieldUtils.js`
- `cloudact-ui/src/utils/pdfForms/pdfUtils.js`

### Dead Redux limbs, while preserving live reducers

Remove these unreferenced actions/selectors only. Reducer files registered by `src/store/index.js` must stay.

- `SaveFormFields/saveFormFieldsActions.js`
- `SaveFormFields/saveFormFieldsReducers.js`
- `createMatterFiles/createMatterFilesActions.js`
- `createMatterFiles/createMatterFilesSelectors.js`
- `createMatterFolders/createMatterFoldersActions.js`
- `createMatterFolders/createMatterFoldersSelectors.js`
- `getFileData/getFileDataActions.js`
- `getFileData/getFileDataSelector.js`
- `getMatterData/getMatterDataSelectors.js`
- `getMatterFiles/getMattersFilesActions.js`
- `getMatterFiles/getMattersFilesSelectors.js`
- `getMatterFolders/getMattersFoldersActions.js`
- `getMatterFolders/getMattersFoldersSelectors.js`
- `saveFileData/saveFileDataActions.js`
- `saveFileData/saveFileDataSelector.js`
- `saveMatterInformation/saveMattersSelector.js`

All paths in this subsection are under `cloudact-ui/src/utils/Apis/matters/`.

### Unused stylesheets

These have no JavaScript/TypeScript import and are not pulled in by the active `src/assets/css/main.css`:

- `cloudact-ui/src/index.css`
- `cloudact-ui/src/App.css`
- `cloudact-ui/src/assets/css/build/main.css`
- `cloudact-ui/src/assets/css/homeComponent.css`
- `cloudact-ui/src/assets/css/components/forms.css`
- `cloudact-ui/src/assets/css/pages/five-steps.css`
- `cloudact-ui/src/assets/css/pages/formPages/fill-pdf.css`
- `cloudact-ui/src/assets/css/pages/formPages/flr25.css`
- `cloudact-ui/src/assets/css/pages/formPages/pdfpages.css`
- `cloudact-ui/src/assets/css/pages/matter.css`
- `cloudact-ui/src/assets/css/pages/reports.css`
- `cloudact-ui/src/assets/css/pages/single-matter.css`
- `cloudact-ui/src/pages/Workflow/workflow.css`
- `cloudact-ui/src/components/Workflow/WorkflowStep.css`
- `cloudact-ui/src/pages/TrustDepositSlipNew/styles/TrustDepositSlipBody.module.css`

Do not confuse root `src/App.css` with `src/components/FormPages/forms/App.css`; the latter is actively imported and must stay.

### Commented-out route replacements

Remove the disabled JSX route blocks in `src/routes/Routes.jsx` for the former reports, compliance checklist, monthly checklist, and trust-deposit-slip implementations. The live replacements immediately following them are the routes that compile. Then remove an old import only if the component has no other live route/reference after the block is deleted.

Also remove isolated commented imports such as the two disabled CSS imports in `src/index.tsx`; they have no effect and source control already preserves their history.

## Level 2 — maybe remove, after product confirmation

These appear unused in the current app but represent whole features, old implementations, or possible source-of-truth files. Confirm that rollback/history is not being kept in-tree, then delete as a separate batch.

### Superseded feature implementations

- `src/pages/reporthistory/ReportsPage.js` and its exclusive dependency tree: replaced on the reports route by `NewReportHistory`.
- `src/pages/MonthlyChecklist/ComplianceTable.jsx`: replaced on its route by `ComplianceFormsNew`.
- `src/pages/MonthlyChecklist/MonthlyChecklistTable.jsx`: replaced on its route by `MonthlyChecklistNew`.
- `src/pages/TrustDepositSlip/TrustDepositSlip.tsx`: replaced on its route by `TrustDepositSlipnewType`.
- `src/pages/TrustDepositSlipNew/TrustDepositSlipnew.jsx`: its import is commented out and it has no active route.
- The non-`Simple` five-step form components (`Assets.jsx`, `BackgroundInformation.jsx`, `ChildrenInformation.jsx`, `CourtInformation.jsx`, `DebtsAndLiabilities.jsx`, `EmploymentDetails.jsx`, `Expenses.jsx`, `FinancialSummary.jsx`, `IncomeAndBenefits.jsx`, `OtherPersonsInHousehold.jsx`, and `RelationshipInformation.jsx`). `FiveStepsPage` uses the corresponding `*Simple` components, but these older screens may intentionally be retained for reference.
- Old setup/onboarding components that are outside the entry graph, including `components/Setup/Login.js`, `LoginForm.js`, `LoginSteps.js`, and `OnBoarding.jsx`. Confirm the current account/setup flow before removing the family.
- Old monthly-checklist, compliance, dashboard, document, and form-editor subtrees that become unreachable once the obsolete route/component roots above are removed. Re-run the import graph after each root deletion rather than guessing at shared children.

### SCSS source trees

- `cloudact-ui/src/assets/scss/` (about 172 KB)
- `cloudact-ui/src/styles/scss/` (about 84 KB)

The app imports `src/assets/css/main.css` directly, has no Sass package/build script, and imports neither SCSS tree. They look like abandoned sources for older generated CSS. Confirm nobody manually edits/compiles them outside the repository before deleting them.

### Package dependencies

The following runtime packages had no source import during the audit and are candidates for removal, but should be removed in small groups with a clean install, build, and smoke test because package usage can occur through configuration or peers:

- `@cyntler/react-doc-viewer`
- `@material-ui/core`
- `@reduxjs/toolkit`
- `bootstrap-select`
- `dayjs`
- `docxtemplater`
- `dotenv`
- `faker`
- `file-saver`
- `lzutf8`
- `moment-timezone`
- `number-formatter`
- `pizzip`
- `powerbi-client-react`
- `qs`
- `react-doc-viewer`
- `react-file-viewer`
- `react-flatpickr`
- `react-flow-renderer`
- `react-html-parser`
- `react-html-renderer`
- `sweetalert2-react-content`
- `web-vitals`

Do not remove `react-scripts`, `typescript`, or ESLint/parser packages merely because import search finds no application import; they are build-tool dependencies. Likewise, Emotion packages may be peer dependencies of MUI and need dependency-tree verification.

### Root legacy entry points

- `app0.py` is not referenced by the Procfile (`gunicorn app:app`) or other project code.
- Root `frontend/`, `static/`, and `templates/calculator.html` are not served by the current Flask app based on its current configuration.
- Standalone scripts such as `inspect_tax.py`, `fetch_dv.py`, `run_calculation.py`, `run_spousal_support.py`, and `spousal_support_frontend.py` are not application imports.

These are calculator/backend-adjacent and therefore outside the requested removal scope. They should only be removed with Marc/backend-owner confirmation.

The same exclusion applies to the currently unreferenced frontend calculator helpers `src/actions/calculatorPageActions.js`, `src/utils/Apis/calcTax.ts`, `src/utils/Apis/calculator/fetchAllCalculatorTasks.ts`, and `src/utils/Apis/calculator/fetchCalculatorDataByID.ts`.

## Level 3 — could clean up, but probably keep for now

- Large active components such as `SetupDashboard.jsx`, active compliance forms, active matter screens, and `Routes.jsx`. They contain stale comments and could be split up, but they are live code; refactoring them adds risk without proving dead-code removal.
- The parallel calculator implementations. They contain substantial duplication, but they were explicitly excluded and several variants are routed or imported by shared reports.
- Documentation in both Markdown and DOCX. It is duplicated by format, but may be intentional for different audiences.
- Public PDFs, form templates, images, and icons. Filename/reference scans are not strong enough evidence because these can be addressed by data returned from the backend or by runtime paths.
- Type declaration files such as `custom.d.ts`, `declarations.d.ts`, `global.d.ts`, and `react-app-env.d.ts`. They need not be imported to affect TypeScript compilation.
- Normal explanatory comments, TODOs, disabled logging notes, and legal/business-rule commentary. Remove only comments that are clearly old executable code; useful context is not clutter.
- Local ignored output (`node_modules`, `cloudact-ui/build`, `generated_reports`, Python caches). It is not tracked, so deleting it does not clean the repository. It can be cleared locally only when disk space is the goal.

## Recommended execution order

1. ~~Commit the existing unrelated Manitoba-form work or otherwise isolate it before cleanup.~~ Done in `713fce9`.
2. Apply Level 1 in small commits: generated junk, retired comment block, dead modules/Redux limbs, then orphan CSS.
3. Run the frontend tests and production build after each group, plus smoke tests for login, matters, five-step intake, forms/PDF editing, workflow, reports, and trust-deposit slip.
4. Re-run the reachability/reference audit; deleting dead roots should expose additional exclusive child modules and assets.
5. Review Level 2 feature families with the product/backend owner before deleting them.

The Manitoba form-builder change that was unstaged when this audit began is now committed separately as `713fce9`; no cleanup commit touches it.

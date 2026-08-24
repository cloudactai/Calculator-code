# New-chat prompt: complete Manitoba and Saskatchewan forms

Copy everything below this line into a new Codex chat opened at the repository root.

---

Implement every missing Manitoba and Saskatchewan family-law form listed below, end to end, using the repository's current form-generation, mapping, verification, catalogue, and import workflow. Continue until the work is complete, verified, committed, and pushed to `main`.

## Authority and expected outcome

You are authorized to:

- add and modify the form source manifests, pipeline scripts, generated PDFs, mappings, catalog entries, audit output, tests, and relevant documentation;
- download current forms from official government/court sources;
- run all required builders, renderers, validators, contact-sheet tools, tests, and database/export checks;
- commit only the changes made for this task; and
- push the completed commit(s) to the remote `main` branch.

Do not stop at research, source downloads, a partial batch, generated mappings, or automated tests. The deliverable is production-ready forms in the catalogue with every page visually reviewed. Do not claim completion if any form or page remains unreviewed, any verification finding remains unresolved, or the push has not succeeded.

Before editing, inspect the current branch, remotes, worktree, and applicable instructions. Preserve all unrelated user changes. Never discard, overwrite, reset, or include unrelated changes in your commits. If `main` has moved, integrate safely without destructive Git operations. If a genuine conflict or protected-branch restriction prevents a safe push, stop and report the exact blocker and the completed commit hash; otherwise push to `main` as requested.

## Mandatory documentation to read in full

Read these files completely before taking implementation action, plus every directly referenced workflow file needed for the selected pipelines:

- `docs/FORMS.md`
- `auth-server/FORMS_RELEASE.md`
- `auth-server/tools/mb-forms/README.md`
- `auth-server/tools/sk-forms/README.md`
- `auth-server/tools/mb-forms/mb_sources.py`
- `auth-server/tools/mb-forms/mb_sources_batch2.py`
- `auth-server/tools/sk-forms/sk_sources.py`
- `auth-server/tools/sk-forms/sk_sources_cp.py`

Also inspect the Ontario catalogue and Ontario pipeline as the scope benchmark:

- `auth-server/tools/on-forms/README.md`
- `auth-server/form-template-export/catalog.json`

Ontario's scope is the tie-breaker: include family-specific court, practice-direction, support, enforcement, appeal, protection, child-protection, and adoption forms analogous to categories Ontario carries. Do not expand into probate, estates, criminal, unrelated civil, guides, French duplicates, internal-only administrative paperwork, or repealed forms.

Follow the current Manitoba and Saskatchewan workflows exactly. Extend them with coherent new batches/modules rather than building a one-off importer. Preserve existing doc IDs, sort order, mappings, PDFs, binds, and catalogue rows byte-for-byte unless a verified defect requires a targeted correction.

## Forms to implement

First verify every title, form number, revision date, and source URL against the current official court/government source. If an official form has been replaced, renamed, renumbered, or repealed, implement the current replacement and document the discrepancy. Never use a third-party copy when an official source exists.

### Manitoba: 51 province-specific additions

#### Provincial Court Family Rules — 8

1. Form 1 — Application for Relief
2. Form 2 — Answer
3. Form 3 — Reply to Answer
4. Form 4 — Financial Statement
5. Form 5 — Order
6. Form 6 — Notice of Application for Guardianship
7. Form 7 — Affidavit
8. Form 8 — Garnishing Order (Attaching Debts)

Official starting point: `https://web2.gov.mb.ca/laws/rules/regforms_e.php?set=fla`

#### Manitoba Family Law Regulation relocation forms — 3

9. Schedule A — Notice of Proposed Relocation
10. Schedule B — Notice of Objection to Proposed Relocation
11. Schedule C — Notice of Change of Residence

Official starting point: `https://www.gov.mb.ca/familylaw/parenting/relocation.html`

#### Child-protection court briefs — 4

12. Intake Brief of Agency
13. Intake Brief of Parents
14. Pre-Hearing Brief of Agency
15. Pre-Hearing Brief of Parents

Official starting point: `https://www.manitobacourts.mb.ca/court-of-queens-bench/procedure-rules-and-forms/forms/`

#### Manitoba FOAEAA packages — 16

Locate request to establish or vary support:

16. Form 1a — FOAEAA Application
17. Form 1b — FOAEAA Affidavit
18. Form 1c — FOAEAA Order Authorization
19. Form 1d — FOAEAA Order Disclosure

Financial request to establish or vary support:

20. Form 2a — FOAEAA Application
21. Form 2b — FOAEAA Affidavit
22. Form 2c — FOAEAA Order Authorization
23. Form 2d — FOAEAA Order Disclosure

Locate request to enforce parenting, contact, custody, or access:

24. Form 3a — FOAEAA Application
25. Form 3b — FOAEAA Affidavit
26. Form 3c — FOAEAA Order Authorization
27. Form 3d — FOAEAA Order Disclosure

Locate/financial request to enforce support:

28. Form 4a — FOAEAA Application
29. Form 4b — FOAEAA Affidavit
30. Form 4c — FOAEAA Order Authorization
31. Form 4d — FOAEAA Order Disclosure

Official starting point: `https://www.manitobacourts.mb.ca/court-of-queens-bench/procedure-rules-and-forms/forms/family-orders-and-agreements-enforcement-assistance-act-canada-foaeaa/`

#### Manitoba interjurisdictional support — 17

32. Form A.1 — Support Application under The Inter-jurisdictional Support Orders Act
33. Form A.2 — Support Variation Application under The Inter-jurisdictional Support Orders Act
34. Form A.3 — Support Application under the Divorce Act
35. Form A.4 — Support Variation Application under the Divorce Act
36. Form B — Parentage
37. Form C — Child Support Claim
38. Form D — Request for a Support Order if the Respondent Does Not Provide Financial Information
39. Form E — Request for Child Support Different from the Table Amount
40. Form F — Special or Extraordinary Expense Claim
41. Form G — Request to Pay Child Support Different from the Table Amount
42. Form H — Support for Claimant/Applicant
43. Form I — Financial Information
44. Form J — Child Status and Financial Statement
45. Form K — Evidence to Support Variation of a Support Order
46. Form L — Respondent's Response to Application
47. ISO Affidavit
48. Additional Locate Information Form

Official starting point: `https://www.gov.mb.ca/familylaw/money/iso_forms.html`

#### Manitoba protection orders — 3

49. Application for a Protection Order
50. Application for a Protection Order on Behalf of Another Person
51. Confidential Personal Information Form

Official starting point: `https://www.gov.mb.ca/justice/vs/po/protect.html`

### Saskatchewan: 42 province-specific additions

#### Family Practice Directive 1 — 2

1. Pre-Trial Brief
2. Schedule A — Family Property Statement/Proposed Distribution

#### Family Practice Directive 3 — 2

3. Form A — Notice of Objection to Affidavit Evidence
4. Form B — Response to Notice of Objection

#### Family Practice Directive 4 — 4

5. Form A — Initial Summary
6. Form B — Court Appearance Memo
7. Form C — Applicant Pre-Trial Form
8. Form D — Respondent Pre-Trial Form

#### Family Practice Directive 5 — 2

9. Appendix B — Suggested Terms for a Disclosure of Affidavits Order
10. Appendix C — Undertaking to Obtain Copies of Affidavits

Do not catalogue Appendix A; it is explanatory material, not a fillable form.

#### Family Practice Directive 6 — 1

11. Family Chambers Appearance Memo

#### Family Practice Directive 7 — 5

12. Form 7-1 — Certificate of Compliance with Practice Directive 7
13. Form 7-2 — Request for Judicial Case Conference
14. Form 7-3 — Joint Request for Judicial Case Conference
15. Form 7-4 — Notice of Judicial Case Conference
16. Form 7-5 — Judicial Case Conference Appearance Memo

#### Family Practice Directive 8 — 6

17. Form A — FOAEAA Application for Information to Establish or Vary Support
18. Form B — Order Authorizing a Court Official to Request Information for Support
19. Form C — Order Authorizing Release of Information for Support
20. Form D — FOAEAA Application for Information to Enforce a Family-Law Provision
21. Form E — Order Authorizing a Court Official to Request Enforcement Information
22. Form F — Order Authorizing Release of Enforcement Information

Official practice-directive starting point: `https://sasklawcourts.ca/kings-bench/rules-practice-directives/`

#### Saskatchewan interjurisdictional support — 17

23. Form A.1 — Support Application under The Interjurisdictional Support Orders Act
24. Form A.2 — Support Variation Application under The Interjurisdictional Support Orders Act
25. Form A.3 — Support Application under the Divorce Act
26. Form A.4 — Support Variation Application under the Divorce Act
27. Form B — Parentage
28. Form C — Child Support Claim
29. Form D — Request for Support Order if the Respondent Does Not Provide Financial Information
30. Form E — Request for Child Support Different from the Table Amount
31. Form F — Special or Extraordinary Expense Claim
32. Form G — Request to Pay Child Support Different from the Table Amount
33. Form H — Support for Claimant/Applicant
34. Form I — Financial Information
35. Form J — Child Status and Financial Statement
36. Form K — Evidence to Support Variation of a Support Order
37. Form L — Respondent's Response to Application
38. ISO Affidavit
39. Additional Locate Information Form

Official starting point: `https://www.saskatchewan.ca/residents/family-and-social-support/child-support/information-on-child-support/`

#### Saskatchewan interpersonal violence — 2

40. Form A — Emergency Intervention Order
41. Form B — Summons for Rehearing of Emergency Intervention Order

Official starting point: the current `Victims of Interpersonal Violence Regulations, V-6.02 Reg 1` from Publications Saskatchewan.

#### Saskatchewan appeal — 1

42. Court of Appeal Civil Form 1a — Notice of Appeal

Official starting point: `https://sasklawcourts.ca/court-of-appeal/rules-practice-directives/`

### Shared federal Divorce Act relocation forms — 3

These forms must be available to Manitoba and Saskatchewan matters:

1. Form 1 — Notice of Relocation
2. Form 2 — Notice of Objection to Relocation
3. Form 3 — Notice of Change of Place of Residence: Person with Contact

Use the current official Department of Justice Canada forms. Because `FormTemplate` currently has one province per row, reuse a shared source asset only if the existing architecture safely supports it; otherwise create separate province-specific template records and doc IDs for MB and SK without collisions. Do not silently make these available to only one province.

## Required implementation method

For each new batch:

1. Record every official source declaratively in the appropriate source module, including stable doc ID, official title, category, source URL or official product/format IDs, expected page count, and source filename.
2. Fetch the official source and record reproducible provenance: checksum, byte size, page count, form/revision identity, and retrieval metadata consistent with the existing manifests.
3. Preserve the official background. Flatten or convert only where the documented pipeline requires it.
4. Run the province's automated field-detection/build process first. Use measured heuristics grounded in the source PDFs—not arbitrary coordinates—to cover repeated structures.
5. Run automated verification and missing-area scans.
6. Perform manual, page-specific repairs only after the first automated pass. Record each exception explicitly in the relevant repair/manual-field structure with a reason. Do not hide a general detector defect behind dozens of unexplained hard-coded boxes.
7. Add safe prefill binds only where the printed caption unambiguously maps to matter data. A wrong legal name or role is worse than a blank field. Document intentionally unbound fields.
8. Merge the new rows into `catalog.json` with clear categories and stable sort order. Generate/update audit output using the existing workflow.
9. Import/validate using the release-safe workflow. Confirm every new template is production-ready and mapping-ready.
10. Update the Manitoba/Saskatchewan READMEs, `docs/FORMS.md`, counts, source scope, commands, QA statistics, known exceptions, and release notes. Remove stale counts such as the old Manitoba 5 / Saskatchewan 40 summary.

## Mandatory page-by-page visual review

Automated verification is necessary but not sufficient. Review **every page of every new form individually without skipping any page**.

For each source form:

1. Render the clean source/background pages.
2. Render QA pages with every detected field visibly overlaid and identified.
3. Compare each QA page directly with its corresponding source page at readable resolution.
4. Inspect every writing line, blank, checkbox, radio/choice mark, date segment, amount slot, table cell, signature area, initials box, court/file heading, party-name field, continuation area, and multiline response area.
5. Check for missing fields, extra fields, fields on printed text, fields on signatures, wrong types, wrong page assignment, duplicate IDs, overlapping controls, clipped controls, narrow slivers, incorrect dimensions, bad vertical seating, table-row drift, footer/header collisions, and controls outside page bounds.
6. Check that checkboxes are checkboxes, multiline areas are multiline text fields, numeric/currency/date fields use the correct type where supported, and no control obscures legally meaningful text.
7. Correct the defects, rebuild, and inspect the affected page again.
8. After a form passes, review every page of that form a second time from the regenerated final output—not from a stale intermediate render.

Create a machine-readable review ledger (JSON or CSV) committed with the pipeline QA artifacts or documentation. It must contain one row per form page with at least:

- province;
- doc ID;
- form title;
- page number;
- source reviewed;
- overlay reviewed;
- first-pass result;
- corrections made;
- final-pass result; and
- reviewer/status timestamp or build identifier.

The ledger page count must equal the sum of the final page counts of all new templates. Add a check that fails if any page is absent, duplicated, or not marked as passing both source/overlay review and final re-review. Do not bulk-mark pages as reviewed without actually opening and inspecting their rendered images.

Generate contact sheets for navigation, but do not treat a contact sheet alone as sufficient review when text or field geometry is too small to judge. Open full-resolution page renders as needed. For long forms, review sequentially and keep an explicit cursor/checklist so interruptions cannot cause skipped pages.

## Verification gates

Before committing, all of the following must pass:

- province-specific fetch/source verification for every new source;
- province-specific builders are idempotent;
- province-specific verification reports have zero unexplained findings;
- missing-area scans have zero unexplained hits;
- no missing PDF/JSON pairs;
- no duplicate doc IDs or catalogue sort-order collisions;
- every mapping field is in bounds and has a unique stable ID;
- every new catalogue row points to the correct current PDF and mapping;
- export/catalogue validation passes;
- the full relevant backend and frontend test suites pass;
- the per-page review ledger is complete and passes its coverage check;
- a clean rebuild produces no unexpected diff;
- `git diff --check` passes; and
- final `git status` contains no accidental generated, temporary, source-download, or unrelated files.

Then perform a separate final audit:

1. Recount forms by province and family/category.
2. Compare implemented doc IDs against the complete requested inventory above.
3. Compare official-source manifests against catalogue rows and exported PDF/JSON pairs.
4. Re-run all validators and relevant tests from a clean final working state.
5. Sample prefill behavior in the app/API for each new family and verify that the picker groups and opens every form correctly.
6. Confirm all documentation counts match the actual catalogue.

## Commit and push

When every gate passes:

1. Review the final diff carefully.
2. Commit only task-related files with clear commit messages.
3. Confirm the commit is based safely on current `main` and that no unrelated work is included.
4. Push the completed work to remote `main`.
5. Report the pushed commit hash, final Manitoba and Saskatchewan counts, forms added by family, total pages reviewed, total fields created, bind counts, all verification/test commands and results, and any deliberately excluded or intentionally unbound items with reasons.

Do not report success based only on scripts returning zero. Completion requires both automated verification and documented individual visual inspection of every final page.

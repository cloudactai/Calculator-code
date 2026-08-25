# Tax engine — how taxes are calculated and how to update them

How the tax engine works across both the Flask backend and the React frontend,
what data it depends on, how to add a new tax year, and how to add a new
province. Start here if a tax calculation is wrong, a new year needs to be
added, or you need to understand how taxes feed into the child support and
spousal support calculators.

> **Relationship to other docs.** This document covers the tax calculation
> layer specifically. For the calculator workflows that *use* the tax engine
> (child support, spousal support, AI chat), see
> [CALCULATORS.md](CALCULATORS.md). For the hosting and deployment topology, see
> [ARCHITECTURE.md](ARCHITECTURE.md). For authentication, see
> [AUTHENTICATION.md](AUTHENTICATION.md).

---

## Where it lives

The tax engine exists in two independent implementations — the **Flask backend**
(Python) used by the AI chat and spousal support iterative formula, and the
**React frontend** (TypeScript) used by the in-app calculator screens.

### Backend (Flask — Python)

| Piece | File |
| --- | --- |
| Tax engine (all provinces) | [tax.py](../tax.py) |
| Year-variable constants (JSON fallback) | [tax_constants.json](../tax_constants.json) |
| Seed script (JSON → database) | [auth-server/scripts/seed-tax-constants.js](../auth-server/scripts/seed-tax-constants.js) |
| SuperAdmin tax constants UI | [cloudact-ui/src/pages/superadmin/SuperAdminTaxConstants.tsx](../cloudact-ui/src/pages/superadmin/SuperAdminTaxConstants.tsx) |

### Frontend (React — TypeScript)

| Piece | File |
| --- | --- |
| Tax calculation formulas (federal/provincial tax, benefits, CPP/EI, spousal support) | [cloudact-ui/src/utils/helpers/calculator/taxCalculationFormula.ts](../cloudact-ui/src/utils/helpers/calculator/taxCalculationFormula.ts) |
| Tax credit formulas (BPA, age amount, eligible dependent, CPP/EI credits, Canada employment) | [cloudact-ui/src/utils/helpers/calculator/creditTaxCalculationFormulas.ts](../cloudact-ui/src/utils/helpers/calculator/creditTaxCalculationFormulas.ts) |
| Federal tax wrapper | [cloudact-ui/src/utils/helpers/calculator/FederalTax/FederalTax.ts](../cloudact-ui/src/utils/helpers/calculator/FederalTax/FederalTax.ts) |
| Provincial tax wrapper (ON, BC, AB) | [cloudact-ui/src/utils/helpers/calculator/ProvincialTax/provincialTax.ts](../cloudact-ui/src/utils/helpers/calculator/ProvincialTax/provincialTax.ts) |
| Child benefit formulas | [cloudact-ui/src/utils/helpers/calculator/ChildBenefit/ChildBenefit.ts](../cloudact-ui/src/utils/helpers/calculator/ChildBenefit/ChildBenefit.ts) |
| Workers benefit formulas | [cloudact-ui/src/utils/helpers/calculator/WorkersBenefit/workersBenefits.ts](../cloudact-ui/src/utils/helpers/calculator/WorkersBenefit/workersBenefits.ts) |

### Frontend API layer (fetching tax data)

| Piece | File |
| --- | --- |
| Fetch tax bracket for a specific income/province/year | [cloudact-ui/src/utils/Apis/calcTax.ts](../cloudact-ui/src/utils/Apis/calcTax.ts) |
| Fetch dynamic values (province + federal) for a year | [cloudact-ui/src/utils/Apis/calculator/fetchAllDynamicValues.ts](../cloudact-ui/src/utils/Apis/calculator/fetchAllDynamicValues.ts) |
| Fetch all values in tax reference DB for a year | [cloudact-ui/src/utils/Apis/calculator/fetchAllValuesInTaxRefDB.ts](../cloudact-ui/src/utils/Apis/calculator/fetchAllValuesInTaxRefDB.ts) |
| Fetch specific tax and deduction for an amount | [cloudact-ui/src/utils/Apis/calculator/fetchSpecificTaxandDeductionforAmount.ts](../cloudact-ui/src/utils/Apis/calculator/fetchSpecificTaxandDeductionforAmount.ts) |
| Fetch distinct years available in tax reference | [cloudact-ui/src/utils/Apis/getDistinctYearsInTaxRef.ts](../cloudact-ui/src/utils/Apis/getDistinctYearsInTaxRef.ts) |

---

## How the two engines relate

The **backend** engine in [tax.py](../tax.py) is the authoritative, complete
implementation. It is used by:

- The spousal support iterative formula (`calculate_spousal_support_iterative`
  in [spousal_support.py](../spousal_support.py)), which calls the tax engine on
  every iteration step so spousal support and taxes converge together.
- All AI chat workflows (`/chat`, `/spousal-chat`, `/tax-chat`) via the tool
  functions that Claude invokes.

The **frontend** engine in the TypeScript files is used by the in-app calculator
screens (Screen 2 / Screen 4) for real-time tax computation as the user adjusts
inputs. It fetches tax brackets and dynamic values from the auth-server's
database API, then runs the same formulas client-side.

Both engines implement the same formulas and should produce matching results.
When updating tax logic, both must be changed.

---

## Constants: two categories

Tax constants are split into two categories, documented at the top of
[tax.py](../tax.py):

### Section A — Year-variable (update every year)

These change annually as CRA and the provinces index amounts for inflation.
They live in [tax_constants.json](../tax_constants.json), keyed by year
(e.g. `"2025"`). Examples:

- **Bracket tables:** `FEDERAL_BRACKETS`, `ON_BRACKETS`, `BC_BRACKETS`,
  `AB_BRACKETS`, `SK_BRACKETS`, `MB_BRACKETS`, `ON_HEALTH`
- **Personal credit amounts:** `BASIC_PERSONAL_AMOUNT_FED`,
  `BASIC_PERSONAL_AMOUNT_ON`, `BASIC_PERSONAL_AMOUNT_BC`, etc.
- **CPP limits:** `BASE_CPP_LIMIT`, `ENHANCED_CPP_LIMIT`, `CPP2_MAX_AMT`
- **EI:** `EI_RATE`, `EI_LIMIT`
- **Benefit amounts:** CWB, CCB, GST/HST, OCB, OSTC, CAI, BC Child Benefit,
  BC Climate Action, ACFB, SK/MB climate action, SK SLITC

Each constant in `tax_constants.json` has a preceding comment key (e.g.
`"A7_FED_BRACKETS_COMMENT"`) that documents its source and purpose.

### Section B — Structural (rarely change)

These are set by statute and only change if Parliament or a provincial
legislature amends the relevant act. They are hardcoded in
[tax.py](../tax.py) as module-level Python constants. Examples:

- `BASE_CPP_RATE = 0.0495` (CPP Act Schedule 2)
- `ON_CREDIT_RATE = 0.0505` (lowest Ontario bracket rate)
- `BC_CREDIT_RATE = 0.0506` (lowest BC bracket rate)
- `ON_SURTAX_RATE_1 = 0.20`, `ON_SURTAX_RATE_2 = 0.36`
- `CWB_RATE = 0.21`, `CWB_REDUCTION_RATE = 0.15`
- CCB phase-out rates (`CCB_RATE_1_PHASE1` through `CCB_RATE_4_PHASE2`)
- `GST_CLAWBACK_RATE = 0.05`
- `OCB_REDUCTION_RATE = 0.08`, `OSTC_REDUCTION_RATE = 0.04`
- ACFB reduction rate tables, SK/MB structural rates

---

## Constants storage and loading

The backend supports two storage paths for year-variable constants:

### 1. Database (primary — via SuperAdmin UI)

The `TaxConstant` Prisma model stores one JSON blob per year. The SuperAdmin
page at `/superadmin/tax-constants`
([SuperAdminTaxConstants.tsx](../cloudact-ui/src/pages/superadmin/SuperAdminTaxConstants.tsx))
lets admins view and edit every constant grouped by section (Federal, Ontario,
BC, Alberta, etc.), with bracket tables rendered as editable rows.

When [tax.py](../tax.py) needs constants for a year, `get_year_constants(year)`
first queries the `TaxConstant` table via `_fetch_from_db()`. If the database
row exists, it returns that data.

### 2. JSON file (fallback)

If the database is unavailable or has no row for the requested year,
`get_year_constants()` falls back to [tax_constants.json](../tax_constants.json).
If the requested year is not in the JSON either, it uses the highest available
year.

### Seeding the database from JSON

The seed script [auth-server/scripts/seed-tax-constants.js](../auth-server/scripts/seed-tax-constants.js)
loads `tax_constants.json` into the `TaxConstant` table. It uses upsert, so it
is safe to re-run:

```bash
node auth-server/scripts/seed-tax-constants.js
```

### Frontend constants loading

The frontend fetches constants from the auth-server API, not from the JSON file:

- **Tax brackets:** `GET /tax-calc/:incomeOver/:province/:year` — returns the
  matching bracket row (From, To, Basic, Rate, Income_over).
- **Dynamic values:** `GET /dynamic_values_by_year/:year/:province` — returns
  the set of named constants for a province and year. The frontend calls this
  twice (once for the province, once for `"FED"`) and merges the results.
- **All bracket rows:** `GET /tax-calc-values-by-year/:year` — returns every
  bracket row for a year.
- **Available years:** `GET /tax-calc-distinct-years` — returns the list of
  years that have data.

These values are stored in the Redux store under `dynamicValues.data` and
accessed by the formula functions via `store.getState().dynamicValues.data`.

---

## Tax calculation pipeline

Both the backend and frontend follow the same pipeline. The backend version in
`calculate_taxes()` ([tax.py:1342](../tax.py)) is the canonical reference:

### 1. Taxable income

```
taxable_income = employed + self_employed + other + support_received
                − deductible_support_paid
                − enhanced_cpp_deduction
                − child_care_deduction
                − other_deductions
```

- **Enhanced CPP deduction** includes CPP1 enhanced (1% rate, capped) and CPP2
  (4% rate on earnings between the first and second ceilings).
- **Child care deduction** is capped at `min(employed_income × 2/3, expenses)`.

### 2. Child direction

Determines which party the children live with for credit/benefit purposes.
Returns `0` (no children), `1` (with Party 1), `2` (with Party 2), or `4`
(split). This affects eligible dependent credits and child benefit allocation.

### 3. Federal non-refundable credits

Sum of:

| Credit | Description |
| --- | --- |
| Basic Personal Amount (BPA) | Income-tested; phases from full to minimum between 4th/5th bracket floors |
| Age amount | For age 65+; phases out at 15% above threshold |
| Eligible dependent | Equal to BPA; awarded to the party children live with |
| Base CPP contribution | `min((employed + self_employed − 3500) × 4.95%, limit)` |
| EI premiums | `min(employed × EI rate, EI limit)` |
| Canada employment amount | `min(limit, employed_income)` for employed only |
| Disability amount | Fixed amount if eligible |

### 4. Provincial non-refundable credits

Same structure as federal but with province-specific amounts and rates:

| Province | Credit rate | Notable differences |
| --- | --- | --- |
| **ON** | 5.05% | Ontario-specific eligible dependent amount, ON age amount |
| **BC** | 5.06% | BC-specific amounts, BC age amount |
| **AB** | 8.00% | Alberta-specific amounts, AB age amount |
| **SK** | 10.5% | SK child amount ($7,704/child under 19), senior supplement |
| **MB** | 10.8% | BPA phases out between $200k–$400k net income |

### 5. Federal tax

```
federal_tax = max(bracket_tax − total_federal_credits × credit_rate, 0)
```

Where `bracket_tax = Basic + (taxable_income − Income_over) × Rate` from the
matching federal bracket row.

### 6. Provincial tax

Each province has its own pipeline:

**Ontario:**
1. Basic ON tax = `bracket_tax − credits × 5.05%`
2. \+ Ontario surtax: `20% × max(tax − threshold_1, 0) + 36% × max(tax − threshold_2, 0)`
3. − Ontario tax reduction: `max(2 × (base + dep_add) − tax_with_surtax, 0)`
4. − LIFT credit: `max(min(employed × 5.05%, max_lift) − max(taxable − threshold, 0) × 5%, 0)`
5. \+ Ontario Health Premium (stepped bracket table, unchanged since 2004)

**British Columbia:**
1. Basic BC tax = `bracket_tax − credits × 5.06%`
2. − BC tax reduction (income-tested, zeroed above eligibility threshold)
3. No surtax, no health premium, no LIFT

**Alberta:**
1. Basic AB tax = `bracket_tax − credits × 8%`
2. No surtax, no health premium, no LIFT, no tax reduction

**Saskatchewan:**
1. Basic SK tax = `bracket_tax − credits × 10.5%`
2. No surtax, no health premium, no LIFT, no tax reduction

**Manitoba:**
1. Basic MB tax = `bracket_tax − credits × 10.8%`
2. No surtax, no health premium, no LIFT, no tax reduction
3. BPA phases out for high income ($200k–$400k)

### 7. CPP/EI payroll deductions

Cash outflows: `EI + base_CPP + enhanced_CPP_deduction`. These reduce take-home
pay but are not part of the bracket tax.

### 8. Canada Workers Benefit (CWB)

Refundable tax credit. Uses province-specific thresholds and maximums (BC, AB
have different values from the federal defaults). BC also has a CWB supplement
(currently excluded from the main calculation — see comment in tax.py).

### 9. Provincial child-care credit adjustment

Ontario only: an additional child-care credit based on income-dependent rates
from the `ON_CARE_RATES` table. BC, AB, SK, and MB have no provincial
child-care credit.

### 10. Total taxes

```
total_taxes = federal_tax + provincial_tax + cpp_ei − prov_care_credit − cwb
```

### 11. Benefits

| Benefit | Scope | Description |
| --- | --- | --- |
| **Canada Child Benefit (CCB)** | Federal | Per-child amounts (under 6 / 6–17), two-phase clawback |
| **GST/HST credit** | Federal | Base + dependent credits, clawed back at 5% above threshold |
| **Provincial child benefit** | ON: OCB, BC: Childhood Opportunity Benefit, AB: ACFB | Province-specific per-child amounts with income clawback |
| **Provincial sales tax credit** | ON: OSTC, SK: SLITC | Income-tested refundable credit |
| **Climate Action Incentive (CAI)** | ON, AB, SK, MB | Fixed per-person/child amounts (program cancelled April 2025 for AB/SK/MB; values retained for 2025 calculations) |

```
total_benefits = CCB + GST/HST + prov_child_benefit + prov_sales_tax_credit + CAI
```

### 12. Net income

```
net_income_after_tax = taxable_income − total_taxes + total_benefits
```

---

## Province support summary

| Feature | ON | BC | AB | SK | MB |
| --- | --- | --- | --- | --- | --- |
| Provincial tax brackets | Yes | Yes | Yes | Yes | Yes |
| Surtax | Yes | No | No | No | No |
| Health premium | Yes | No | No | No | No |
| LIFT credit | Yes | No | No | No | No |
| Tax reduction | Yes | Yes | No | No | No |
| Provincial child benefit | OCB | BC Child Benefit | ACFB | No | No |
| Provincial sales tax credit | OSTC | No | No | SLITC | No |
| Climate action | CAI | BC Climate Action | AB Climate Action | SK Climate Action | MB Climate Action |
| Provincial child-care credit | Yes | No | No | No | No |
| CWB (province-specific amounts) | Federal defaults | BC-specific | AB-specific | Federal defaults | Federal defaults |
| BPA phase-out | No | No | No | No | Yes ($200k–$400k) |
| Child amount (per child under 19) | No | No | No | Yes ($7,704) | No |
| Senior supplement | No | No | No | Yes ($2,028) | No |

---

## How to add a new tax year

Adding a new tax year requires updating the constants data — no code changes
are needed unless Parliament changes a structural rate.

### Step 1 — Update tax_constants.json

1. Open [tax_constants.json](../tax_constants.json).
2. Copy the most recent year's block (e.g. `"2025": {...}`).
3. Add a new top-level key (e.g. `"2026"`).
4. Update every value that changed for the new year. The key names and JSON
   structure must stay the same — only the values change.
5. Update the comment keys with new source references if applicable.

### Step 2 — Seed the database

Run the seed script to load the new year into the `TaxConstant` table:

```bash
node auth-server/scripts/seed-tax-constants.js
```

Alternatively, use the SuperAdmin UI at `/superadmin/tax-constants` to edit
constants directly in the database.

### Step 3 — Update the frontend dynamic values

The frontend fetches constants from the auth-server database. Once the database
is seeded, the frontend will automatically pick up the new year when the user
selects it in the calculator.

### Step 4 — Verify

- Run the backend test suite to check calculations against known-good values.
- Compare results with the reference Excel spreadsheet for the new year.
- Test both the AI chat tax calculator and the in-app calculator screens.

---

## How to add a new province

Adding a new province requires both data and code changes.

### 1. Tax constants

Add the province's constants to [tax_constants.json](../tax_constants.json):
- Provincial bracket table (e.g. `"XX_BRACKETS"`)
- Basic personal amount, eligible dependent amount, disability amount
- Age amount base and threshold
- Provincial credit rate
- Any province-specific benefit amounts (child benefit, sales tax credit,
  climate action)
- Province-specific CWB amounts if they differ from federal defaults

### 2. Backend code (tax.py)

Add to [tax.py](../tax.py):
1. **Structural rates** in Section B (credit rate, reduction rates, etc.)
2. **Credit functions:** `_eligible_dependent_xx()`, `_age_amount_xx()`,
   `_total_xx_credits()`
3. **Provincial tax function:** `calculate_xx_tax()`
4. **Benefit functions:** child benefit, sales tax credit, climate action as
   applicable
5. **Branch in `calculate_taxes()`:** Add `elif province == "XX":` blocks in
   steps 4, 6, 8, 9, 9b, and 11 where province-specific logic is dispatched.

### 3. Frontend code

Add corresponding TypeScript implementations:
- Provincial tax function in `provincialTax.ts`
- Benefit formulas as needed
- Dynamic values interface additions in `creditTaxCalculationFormulas.ts`

### 4. Schedule I data

Add Schedule I rows for the new province to
[schedule_i.json](../schedule_i.json) with `"province": "XX"`.

### 5. AI chat prompts

Update the system prompts in [app.py](../app.py) for the child support chat,
spousal support chat, and tax chat to include the new province as an option.

---

## How taxes are consumed by other calculators

### Child support calculator

The child support calculator does **not** use the tax engine directly. It uses
the Federal Child Support Guidelines Schedule I table
([schedule_i.json](../schedule_i.json)) to look up table amounts based on
income and number of children. The tax engine is only involved indirectly
through the INDI (Individual Net Disposable Income) breakdown shown in
spousal support reports.

### Spousal support calculator (with children — iterative formula)

The spousal support with-children formula in
[spousal_support.py](../spousal_support.py) is the primary consumer of the
tax engine. It uses **damped fixed-point iteration** (~6 steps per rate)
where each step:

1. Proposes a spousal support amount.
2. Adjusts each party's income by the proposed support (payor deducts, recipient
   adds).
3. Calls `calculate_taxes()` for each party with the adjusted income.
4. Computes INDI = `taxable_income − total_taxes + total_benefits − child_support`.
5. Computes the next spousal support amount from the INDI difference.
6. Applies damping and repeats until convergence.

This means the tax engine runs approximately 18 times per spousal support
calculation (6 iterations × 3 rates [low/mid/high]). The `province` parameter
is forwarded so the correct provincial taxes are used.

### Tax chat AI workflow

The `/tax-chat` endpoint collects income, deductions, and children data, then
calls `calculate_taxes()` directly. The result is returned as a comprehensive
line-item breakdown.

> **Current AI prompt limitation.** The tax chat system prompt currently
> instructs Claude to handle "Ontario income tax only (2024 or 2025)" and
> politely decline other provinces. The underlying `calculate_taxes` function
> fully supports all five provinces. Updating the tax chat prompt to offer all
> provinces is a straightforward change.

---

## Testing

Backend tests live alongside the tax engine:

- [cloudact-ui/src/utils/helpers/calculator/taxCalculationFormula.spec.ts](../cloudact-ui/src/utils/helpers/calculator/taxCalculationFormula.spec.ts) — frontend formula tests
- [cloudact-ui/src/utils/helpers/calculator/creditTaxCalculationFormulas.spec.ts](../cloudact-ui/src/utils/helpers/calculator/creditTaxCalculationFormulas.spec.ts) — frontend credit tests

When verifying tax calculations, compare against:
- The reference Excel spreadsheet (the original source of truth for formulas)
- CRA's published tax tables and benefit calculators
- Provincial government published rates

---

## Common debugging scenarios

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| Tax amounts differ from Excel spreadsheet | Constants outdated or wrong bracket matched | Check `tax_constants.json` values against the spreadsheet; verify `_find_bracket()` returns the correct row |
| Frontend and backend produce different results | One engine updated but not the other | Compare the formula in `tax.py` with the TypeScript equivalent; check that both use the same constants |
| New year not available in calculator | Constants not seeded to database | Run the seed script or add via SuperAdmin UI |
| Provincial tax is zero when it should not be | Province not passed or defaulting to wrong province | Check that `province` is being forwarded correctly through the call chain |
| Benefits seem wrong | Child direction logic returning unexpected value | Check `which_party_children_live_with()` — the logic for SHARED, SPLIT, and HYBRID custody can be subtle |
| CWB amount differs between provinces | Province-specific CWB thresholds not applied | BC and AB override the federal CWB constants; check the `elif province ==` block in step 8 |
| Ontario tax unexpectedly high or low | Surtax, tax reduction, or LIFT not applied correctly | The Ontario pipeline has five steps — verify each one in order |
| SuperAdmin edits not reflected | Database constants not being loaded | Check that `DATABASE_URL` is set in the Flask service environment; look for `[tax.py] DB fetch failed` in logs |

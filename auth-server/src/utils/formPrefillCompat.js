/*
 * Legacy prefill compatibility layer.
 *
 * The Ontario form field maps were authored against the old cloud-act-api data
 * shape (income.client.employmentIncome, expenses.client.housing.rentOrMortgage,
 * mortgages[i], theChildren[i], relationshipDates.*, ...). The current
 * auth-server stores the same information as flat, category-typed rows keyed by
 * a human label. This module rebuilds the legacy-shaped objects from those live
 * records so the existing binds resolve without touching the field maps.
 *
 * Income and expenses are reported monthly in the Financial Statement source
 * rows. The forms calculate annual income from the monthly total themselves.
 * Missing values collapse to "" so the field stays blank (and editable)
 * rather than showing 0.
 */

const num = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const monthly = (row) => num(row?.monthlyAmount) ?? (num(row?.yearlyAmount) != null ? num(row.yearlyAmount) / 12 : null);
const asText = (n) => (n === null || n === 0 ? "" : String(Math.round(n)));

// Live income/benefit labels -> legacy income.<party>.<key>
const INCOME_MAP = {
  "Employment income (before deductions)": "employmentIncome",
  "Commissions, tips and bonuses": "commissionTipsBonuses",
  "Self-employment income": "selfEmploymentIncome",
  "Employment insurance benefits": "employmentInsuranceBenefits",
  "Social assistance income (including ODSP payments)": "socialAssistanceIncome",
  "Government assistance income": "socialAssistanceIncome",
  "Interest and investment income": "interestInvestmentIncome",
  "Pension income (including CPP and OAS)": "pensionIncome",
  "Spousal support received from a former spouse/partner": "spousalSupport",
  "Workers compensation benefits": "workersCompensationBenefits",
  "Other sources of income": "otherIncome",
  "Other income": "otherIncome",
  "Child tax benefits": "childTaxBenefits",
};

// Live expense labels -> legacy [group, leaf]
const EXPENSE_MAP = {
  "CPP contributions": ["automaticDeductions", "cppContributions"],
  "EI premiums": ["automaticDeductions", "eiPremiums"],
  "Income taxes": ["automaticDeductions", "incomeTaxes"],
  "Employee pension contributions": ["automaticDeductions", "employeePensionContributions"],
  "Union dues": ["automaticDeductions", "unionDues"],
  "Rent or mortgage": ["housing", "rentOrMortgage"],
  "Property taxes": ["housing", "propertyTaxes"],
  "Property insurance": ["housing", "propertyInsurance"],
  "Condominium fees": ["housing", "condominiumFees"],
  "Repairs and maintenance": ["housing", "repairsAndMaintenance"],
  Water: ["utilities", "water"],
  Heat: ["utilities", "heat"],
  Electricity: ["utilities", "electricity"],
  Telephone: ["utilities", "telephone"],
  "Cell Phone": ["utilities", "cellPhone"],
  Cable: ["utilities", "cable"],
  Internet: ["utilities", "internet"],
  Groceries: ["householdExpenses", "groceries"],
  "Household supplies": ["householdExpenses", "householdSupplies"],
  "Meals outside the home": ["householdExpenses", "mealsOutsideTheHome"],
  "Pet care": ["householdExpenses", "petCare"],
  "Laundry and Dry Cleaning": ["householdExpenses", "laundryAndDryCleaning"],
  "Daycare expenses": ["childcare", "daycare"],
  "Babysitting costs": ["childcare", "babysitting"],
  "Public transit, taxis": ["transportation", "publicTransit"],
  "Gas and oil": ["transportation", "gasAndOil"],
  "Car insurance and licence": ["transportation", "insurance"],
  Parking: ["transportation", "parking"],
  "Car Loan or Lease Payments": ["transportation", "carPayments"],
  "Health insurance premiums": ["health", "insurance"],
  "Dental expenses": ["health", "dental"],
  "Medicine and drugs": ["health", "medicine"],
  "Eye care": ["health", "eyecare"],
  Clothing: ["personal", "clothing"],
  "Hair care and beauty": ["personal", "haircare"],
  "Alcohol and tobacco": ["personal", "alcohol"],
  "Education (specify)": ["personal", "education"],
  "Entertainment/recreation (including children)": ["personal", "entertainment"],
  Gifts: ["personal", "gifts"],
  "Life Insurance premiums": ["other", "lifeInsurance"],
  "RRSP/RESP withdrawals": ["other", "rrsp"],
  Vacations: ["other", "vacations"],
  "School fees and supplies": ["other", "school"],
  "Clothing for children": ["other", "clothingForChildren"],
  "Children's activities": ["other", "childrenActivities"],
  "Summer camp expenses": ["other", "summerCamp"],
  "Debt payments": ["other", "debtPayments"],
  "Support paid for other children": ["other", "supportPaidForOtherChildren"],
  "Other expenses not shown above (specify)": ["other", "other"],
};

// Live debt category -> legacy collection name
const DEBT_MAP = {
  Mortgages: "mortgages",
  "Line of credits": "lineofcredits",
  "Other loans": "otherloans",
  "Outstanding credit card balances": "outstandingcreditcardbalances",
  "Unpaid Support Amounts": "unpaidsupportamounts",
  "Other Debts": "otherdebts",
};

const partyKey = (role) => (role === "Opposing Party" || role === "opposingParty" ? "opposingParty" : "client");

function buildIncome(rows) {
  const out = { client: {}, opposingParty: {} };
  for (const row of rows) {
    const key = INCOME_MAP[row?.type];
    if (!key) continue;
    const party = partyKey(row.role);
    const prev = num(out[party][key]) || 0;
    out[party][key] = asText(prev + (monthly(row) || 0));
  }
  return out;
}

function buildExpenses(rows) {
  const out = { client: {}, opposingParty: {} };
  for (const row of rows) {
    const map = EXPENSE_MAP[row?.type];
    if (!map) continue;
    const [group, leaf] = map;
    const party = partyKey(row.role);
    out[party][group] = out[party][group] || {};
    const prev = num(out[party][group][leaf]) || 0;
    out[party][group][leaf] = asText(prev + (monthly(row) || 0));
  }
  return out;
}

function buildSpecialExpenses(rows) {
  const out = { client: [], opposingParty: [] };
  for (const row of rows) {
    out[partyKey(row.role)].push({
      name: row?.childName || "",
      expenses: row?.type || "",
      amount: asText(num(row?.amount)),
      tax: row?.taxCredits || "",
    });
  }
  return out;
}

function buildDebts(rows) {
  const collections = {
    mortgages: [], lineofcredits: [], otherloans: [],
    outstandingcreditcardbalances: [], unpaidsupportamounts: [], otherdebts: [],
  };
  for (const row of rows) {
    const name = DEBT_MAP[row?.category];
    if (!name) continue;
    collections[name].push({
      details: row?.details || "",
      monthlyPayment: asText(num(row?.monthlyPayment)),
      on_valuation_date: asText(num(row?.on_valuation_date)),
      on_date_of_marriage: asText(num(row?.on_date_of_marriage)),
      today: asText(num(row?.today)),
    });
  }
  return collections;
}

// market_value is stored as { client:{on_date_of_marriage,on_valuation_date,today}, opposing_party:{...} }
const mvClient = (row) => (row?.market_value && typeof row.market_value === "object" && !Array.isArray(row.market_value) ? row.market_value.client : row?.market_value?.[0]) || {};
const STATUS_FIELD = {
  lands: "property_status", other_property: "property_status_op", business_interest: "property_status_bi",
  general_household_items_and_vehicles: "property_status_ghiav", bank_accounts_savings_securities_pension: "property_status_bassp",
  life_and_disability_insurance: "property_status_ladi", money_owed_to_you: "property_status_moty",
};
const itemLabel = (row) =>
  row?.item || row?.description_bassp || row?.description_ghiav || row?.details_moty ||
  row?.details_op || row?.firm_name || row?.address_of_property || "";

// Generic flat list (Form 13's assets[i]) with per-subtype collections attached
// as properties (Form 13.1's assets.bank[i] etc.). Arrays can carry named props.
function buildAssets(rows) {
  const flat = rows.map((row) => {
    const mv = mvClient(row);
    return {
      category: row?.category || row?.category_bassp || row?.category_op || row?.asset_type || "",
      description: itemLabel(row),
      firm_name: row?.firm_name || "",
      address: row?.address_of_property || "",
      type: row?.type || row?.asset_type || "",
      ownership: row?.nature_and_type_of_ownership || row?.ownership || "",
      today: asText(num(mv.today)),
    };
  });
  const of = (t) => rows.filter((r) => r?.asset_type === t);
  const mvMap = (row, extra) => {
    const mv = mvClient(row);
    return {
      onDateOfMarriage: asText(num(mv.on_date_of_marriage)),
      onValuationDate: asText(num(mv.on_valuation_date)),
      today: asText(num(mv.today)),
      ...extra,
    };
  };
  flat.bank = of("bank_accounts_savings_securities_pension").map((r) => mvMap(r, {
    category: r.category_bassp || r.category || "", institution: r.institution || "",
    account_number: r.account_number || "", description: r.description_bassp || "",
  }));
  flat.land = of("lands").map((r) => mvMap(r, { address: r.address_of_property || "", ownership: r.nature_and_type_of_ownership || "" }));
  // General household & vehicles split by their item category so each table row
  // (goods/furniture, vehicles, jewellery/art, other special) fills separately.
  const hhRow = (r) => mvMap(r, { description: r.description_ghiav || "", isInPossession: r.isInPossession || "" });
  const hhCat = (r) => {
    const s = String(r?.item || "").toLowerCase();
    if (/car|boat|vehicle/.test(s)) return "vehicles";
    if (/jewel|art|electronic|tool|sport|hobby/.test(s)) return "jewellery";
    if (/other\s+special/.test(s)) return "otherItems";
    return "household"; // goods / furniture / fixtures / default
  };
  const hh = of("general_household_items_and_vehicles");
  flat.household = hh.filter((r) => hhCat(r) === "household").map(hhRow);
  flat.vehicles = hh.filter((r) => hhCat(r) === "vehicles").map(hhRow);
  flat.jewellery = hh.filter((r) => hhCat(r) === "jewellery").map(hhRow);
  flat.otherItems = hh.filter((r) => hhCat(r) === "otherItems").map(hhRow);
  flat.interests = of("business_interest").map((r) => mvMap(r, { firm_name: r.firm_name || "", interest: r.interest || "" }));
  flat.life = of("life_and_disability_insurance").map((r) => mvMap(r, { policy_no: r.policy_no || "", owner: r.owner || "", beneficiary: r.beneficiary || "", face_amount: asText(num(r.face_amount)) }));
  flat.moneyOwed = of("money_owed_to_you").map((r) => mvMap(r, { details: r.details_moty || "" }));
  flat.otherProperty = of("other_property").map((r) => mvMap(r, { category: r.category_op || "", details: r.details_op || "" }));
  // Per-category asset totals (today, client). Liabilities are left blank/editable.
  const totalToday = (t) => {
    const sum = of(t).reduce((acc, r) => acc + (num(mvClient(r).today) || 0), 0);
    return { assets: asText(sum), liabilities: "" };
  };
  flat.property = {
    bank: totalToday("bank_accounts_savings_securities_pension"), land: totalToday("lands"),
    household: totalToday("general_household_items_and_vehicles"), interests: totalToday("business_interest"),
    life: totalToday("life_and_disability_insurance"), moneyOwed: totalToday("money_owed_to_you"),
    otherProperty: totalToday("other_property"), debts: { assets: "", liabilities: "" },
  };
  return flat;
}

// Net Family Property "items" (Form 13.B / 13.1): one row per asset, market_value
// passed through so items[i].market_value.client.today resolves directly.
function buildItems(rows) {
  return rows.map((row) => ({
    category: row?.category || row?.category_bassp || row?.category_op || row?.asset_type || "",
    item: itemLabel(row),
    property_status: row?.[STATUS_FIELD[row?.asset_type]] || row?.property_status || "",
    on_valuation_date: asText(num(mvClient(row).on_valuation_date)),
    today: asText(num(mvClient(row).today)),
    market_value: row?.market_value || {},
  }));
}

// Generic debts list (Form 13.1 debts.items[i]).
function buildDebtItems(rows) {
  return rows.map((row) => ({
    category: row?.category || "",
    details: row?.details || "",
    on_date_of_marriage: asText(num(row?.on_date_of_marriage)),
    on_valuation_date: asText(num(row?.on_valuation_date)),
    today: asText(num(row?.today)),
  }));
}

function buildChildren(rows) {
  return rows.map((c) => ({
    fullLegalName: c?.childName || "",
    age: c?.age != null ? String(c.age) : "",
    birthdate: c?.dateOfBirth || "",
    nowLivingWith: c?.nowLivesWith || "",
    muncipilityAndProvince: c?.muncipilityAndProvince || c?.residence || "",
  }));
}

function buildRelationshipDates(rel) {
  const d = rel?.data || rel || {};
  const flag = (v) => (v ? "checked" : "");
  return {
    marriedOn: { date: d.dateOfMarriage || "", checked: flag(d.dateOfMarriage) },
    startedLivingTogetherOn: { date: d.startedLivingTogether || "", checked: flag(d.startedLivingTogether) },
    separatedOn: { date: d.dateOfSeparation || "", checked: flag(d.dateOfSeparation) },
    isNeverLivedTogether: { checked: d.neverLivedTogether ? "checked" : "" },
  };
}

/**
 * Build the legacy-shaped prefill vocabulary from raw matter records.
 * `rowsOf(dataType)` returns the stored array for that dataType (or []).
 */
function buildLegacyPrefill(rowsOf, relationshipRecord) {
  const debtRows = rowsOf("debts_liabilities");
  return {
    income: buildIncome(rowsOf("income_benefits")),
    expenses: buildExpenses(rowsOf("expenses")),
    specialExpenses: buildSpecialExpenses(rowsOf("special_expenses")),
    assets: buildAssets(rowsOf("assets")),
    items: buildItems(rowsOf("assets")),
    ...buildDebts(debtRows),
    debts: { items: buildDebtItems(debtRows) },
    theChildren: buildChildren(rowsOf("children")),
    relationshipDates: buildRelationshipDates(relationshipRecord),
  };
}

module.exports = { buildLegacyPrefill, INCOME_MAP, EXPENSE_MAP, DEBT_MAP };

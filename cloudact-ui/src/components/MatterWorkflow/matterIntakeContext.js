/** Human labels for the PascalCase section keys the intake agents use. */
export const SECTION_LABELS = {
  Background: "Background",
  Relationship: "Relationship",
  Children: "Children",
  IncomeAndBenefits: "Income & benefits",
  EmploymentDetails: "Employment",
  Expenses: "Expenses",
  Assets: "Assets",
  DebtsAndLiabilities: "Debts",
  Court: "Court",
  OtherPersonsInHousehold: "Other persons",
};

const DATABASE_METADATA_FIELDS = new Set([
  "id",
  "asset_type",
  "expenseType",
  "incomeBenefit",
]);

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

/** Format a value that may be a Unix-ms timestamp into YYYY-MM-DD. */
const fmtDate = (value) => {
  if (value == null) return value;
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n === "number" && !isNaN(n) && n > 9999999999 && n < 9999999999999) {
    return new Date(n).toISOString().slice(0, 10);
  }
  return value;
};

const DATE_KEYS = new Set([
  "dateOfMarriage",
  "dateOfSeparation",
  "dateOfDivorce",
  "dateOfBirth",
  "valuation_date",
]);

const compactStoredValue = (value, key = "", depth = 0) => {
  if (
    DATABASE_METADATA_FIELDS.has(key) ||
    (key === "financialYear" && depth > 1) ||
    isBlank(value)
  ) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => compactStoredValue(item, "", depth + 1))
      .filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([childKey, childValue]) => [
        childKey,
        compactStoredValue(childValue, childKey, depth + 1),
      ])
      .filter(([, childValue]) => childValue !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  if (DATE_KEYS.has(key)) return fmtDate(value);
  return value;
};

const rows = (value) => (Array.isArray(value) ? value : []);

const normalizedRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const partyRow = (items, party) => {
  const expected = party === "client" ? "client" : "opposingparty";
  return rows(items).find((item) => normalizedRole(item?.role) === expected);
};

const addSection = (sections, name, value) => {
  const compacted = compactStoredValue(value);
  if (compacted !== undefined) sections[name] = compacted;
};

const firstFinancialYear = (...collections) => {
  for (const collection of collections) {
    const match = rows(collection).find((item) => !isBlank(item?.financialYear));
    if (match) return match.financialYear;
  }
  return undefined;
};

const incomeParty = (items, party) => {
  const expected = party === "client" ? "client" : "opposingparty";
  const partyItems = rows(items).filter(
    (item) => normalizedRole(item?.role) === expected
  );
  return {
    income: partyItems.filter(
      (item) => String(item?.incomeBenefit || "income").toLowerCase() !== "benefit"
    ),
    benefit: partyItems.filter(
      (item) => String(item?.incomeBenefit || "").toLowerCase() === "benefit"
    ),
  };
};

/**
 * Convert the database's read model into the same section model documented for
 * the intake agent. Blank form placeholders and database-only metadata are
 * removed so the model can clearly distinguish saved values from missing ones.
 */
export function normalizeStoredIntakeData(matterData = {}) {
  const sections = {};

  addSection(sections, "Background", {
    client: partyRow(matterData.background, "client"),
    opposingParty: partyRow(matterData.background, "opposingParty"),
  });

  addSection(sections, "Relationship", rows(matterData.relationship)[0]);
  addSection(sections, "Children", matterData.children);

  const incomeRows = rows(matterData.income_benefits);
  addSection(sections, "IncomeAndBenefits", {
    financialYear:
      matterData.financial_year_income_benefits || firstFinancialYear(incomeRows),
    client: incomeParty(incomeRows, "client"),
    opposingParty: incomeParty(incomeRows, "opposingParty"),
  });

  addSection(sections, "EmploymentDetails", {
    client: partyRow(matterData.employment, "client"),
    opposingParty: partyRow(matterData.employment, "opposingParty"),
  });

  const expenseData = matterData.expenses || {};
  const clientExpenses = expenseData.client || {};
  const opposingExpenses = expenseData.opposingParty || {};
  addSection(sections, "Expenses", {
    financialYear:
      matterData.financial_year_expenses ||
      firstFinancialYear(
        clientExpenses.expenses,
        clientExpenses.specialChildExpenses,
        opposingExpenses.expenses,
        opposingExpenses.specialChildExpenses
      ),
    client: {
      expenses: clientExpenses.expenses,
      specialChildExpenses: clientExpenses.specialChildExpenses,
    },
    opposingParty: {
      expenses: opposingExpenses.expenses,
      specialChildExpenses: opposingExpenses.specialChildExpenses,
    },
  });

  const assetData = { valuation_date: matterData.valuation_date };
  for (const [category, items] of Object.entries(matterData.assets || {})) {
    assetData[category] = items;
  }
  addSection(sections, "Assets", assetData);

  addSection(sections, "DebtsAndLiabilities", matterData.debts_liabilities);

  const court = rows(matterData.court_info)[0];
  if (court) {
    addSection(sections, "Court", {
      ...court,
      name: court.name || court.court_name,
      fileNumber: court.fileNumber || court.file_number,
      court_name: undefined,
      file_number: undefined,
    });
  }

  addSection(
    sections,
    "OtherPersonsInHousehold",
    rows(matterData.other_persons)[0]
  );

  return sections;
}

const matterIdentityOf = (matterData) =>
  compactStoredValue({
    matterNumber: matterData.matter_number,
    clientName: matterData.client_id,
  });

export function buildStoredMatterContextMessage(matterData) {
  if (!matterData) return null;

  const savedSections = normalizeStoredIntakeData(matterData);
  const matterIdentity = matterIdentityOf(matterData);

  if (!matterIdentity && Object.keys(savedSections).length === 0) return null;

  return [
    "Continue this matter intake using the authoritative database snapshot below.",
    "Do not ask for a value that is already populated. Do not save unchanged database values again.",
    "Ask only for genuinely missing information. If I explicitly provide a different value, treat it as a correction and save only that correction plus the record identity needed to match it.",
    "Never interpret an omitted value as a request to clear saved information.",
    "",
    JSON.stringify(
      {
        matter: matterIdentity,
        savedSections,
      },
      null,
      2
    ),
  ].join("\n");
}

/**
 * Primer for the update-information agent. Unlike the intake primer this is
 * always produced, because an empty file is still something the agent has to be
 * told about before it asks its first question.
 */
export function buildUpdateContextMessage(matterData) {
  if (!matterData) return null;

  return [
    "I want to change information already saved on this matter.",
    "The authoritative database snapshot follows. Values that are not listed are not stored.",
    "Ask me what I want to change. Do not run an intake, do not work through the sections in order, and do not ask me for anything I have not asked to change.",
    "When I name a change, save only that change and tell me the old value and the new value.",
    "",
    JSON.stringify(
      {
        matter: matterIdentityOf(matterData),
        savedSections: normalizeStoredIntakeData(matterData),
      },
      null,
      2
    ),
  ].join("\n");
}

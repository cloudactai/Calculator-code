// Legacy-compatible /v1 data routes: matters (five-steps forms, folders/files
// metadata, per-file form data) and saved calculator values - everything the
// CRA frontend used to get from the legacy law-firm cloud-act-api backend,
// now stored per-user in this server's Postgres.
//
// Wire compatibility: responses use the legacy wrapper
//     { data: { code: 200, status: "success", body } }
// (see cloud-act-api services/successMsg.js) because the frontend's
// getBodyStatusCode()/reducers destructure exactly that. The :sid path params
// are legacy firm ids - they are accepted but IGNORED; ownership comes from
// the authenticated user (req.user.id). Matters are addressed by matterNumber
// (legacy child tables key on it), with a numeric-id fallback.
//
// Manual five-step saves replace a complete section. AI intake saves use a
// non-destructive patch mode so partial conversational updates cannot erase
// fields or sibling rows captured in earlier chats.
const express = require("express");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  isBlankValue,
  mergeRecordRows,
} = require("../utils/matterPatchMerge");

const router = express.Router();
router.use(authMiddleware);

// Legacy response wrappers
const ok = (body) => ({ data: { code: 200, status: "success", body } });
const errorBody = (message, code = 404) => ({
  data: { code, status: "error", message },
});

// Row arrays are stored as JSON; readers expect row-ish objects with ids.
const assignIds = (rows) =>
  (Array.isArray(rows) ? rows : []).map((row, i) => ({ id: i + 1, ...row }));

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
};

const num = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// AI extraction is conversational, while several legacy form controls only
// render a selection for their exact stored enum. Normalise common human labels
// at the persistence boundary so older prompts/clients also round-trip safely.
const normalizeEmploymentStatus = (value) => {
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return {
    employed: "employed",
    self_employed: "self_employed",
    selfemployed: "self_employed",
    unemployed: "unemployed",
  }[key] ?? value ?? "";
};

const normalizePropertyStatus = (value) => {
  const key = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return {
    disposed: "disposed_property",
    disposed_property: "disposed_property",
    excluded: "excluded_property",
    excluded_property: "excluded_property",
    opposing_party_view_differs: "opposing_Party_view_differs",
  }[key] ?? value ?? "";
};

const normalizeAssetItem = (assetType, item) => {
  const normalized = { ...(item || {}) };
  const statusFieldByType = {
    lands: "property_status",
    other_property: "property_status_op",
    business_interest: "property_status_bi",
    general_household_items_and_vehicles: "property_status_ghiav",
    bank_accounts_savings_securities_pension: "property_status_bassp",
    life_and_disability_insurance: "property_status_ladi",
    money_owed_to_you: "property_status_moty",
  };
  const statusField = statusFieldByType[assetType];
  if (statusField) normalized[statusField] = normalizePropertyStatus(normalized[statusField]);

  if (assetType === "general_household_items_and_vehicles") {
    const itemKey = String(normalized.item ?? "").trim().toLowerCase();
    if (["car", "cars", "boat", "boats", "vehicle", "vehicles"].includes(itemKey)) {
      normalized.item = "Cars, Boats, Vehicles";
    }
    const possession = String(normalized.isInPossession ?? "").trim().toLowerCase();
    if (possession === "yes" || possession === "no") {
      normalized.isInPossession = possession === "yes" ? "Yes" : "No";
    }
  }

  if (assetType === "bank_accounts_savings_securities_pension") {
    const rawCategory = String(normalized.category_bassp ?? "").trim();
    const categoryKey = rawCategory.toLowerCase();
    const category = {
      chequing: "Bank accounts",
      checking: "Bank accounts",
      "bank account": "Bank accounts",
      "bank accounts": "Bank accounts",
      rrsp: "Savings Plans",
      resp: "Savings Plans",
      tfsa: "Savings Plans",
      pension: "Savings Plans",
    }[categoryKey];
    if (category) {
      normalized.category_bassp = category;
      if (!normalized.description_bassp && rawCategory !== category) {
        normalized.description_bassp = rawCategory;
      }
    }
  }

  return normalized;
};

// Matter helpers
async function findMatter(userId, matterParam, db = prisma) {
  const asNumber = Number(matterParam);
  return db.matter.findFirst({
    where: {
      userId,
      OR: [
        { matterNumber: String(matterParam) },
        ...(Number.isInteger(asNumber) && asNumber > 0 ? [{ id: asNumber }] : []),
      ],
    },
  });
}

// Legacy f_ca_matters row shape the dashboard/list pages consume.
function matterRow(matter) {
  return {
    id: matter.id,
    client_id: matter.clientName,
    matterNumber: matter.matterNumber,
    clientRole: matter.clientRole,
    childrenInvolved: matter.childrenInvolved,
    province: matter.province,
    checkedItems: matter.checkedItems,
    sid: matter.userId,
    information_completed: matter.informationCompleted,
    status: matter.status,
    source: matter.source,
    firstflag: matter.firstflag,
    valuation_date: matter.valuationDate,
    financial_year_income_benefits: matter.fyIncomeBenefits,
    financial_year_expenses: matter.fyExpenses,
    created: matter.createdAt,
  };
}

async function getRecordRows(matterId, dataType, db = prisma) {
  const record = await db.matterRecord.findUnique({
    where: { matterId_dataType: { matterId, dataType } },
  });
  return Array.isArray(record?.data) ? record.data : record?.data ?? [];
}

async function putRecord(matterId, dataType, data, db = prisma) {
  await db.matterRecord.upsert({
    where: { matterId_dataType: { matterId, dataType } },
    create: { matterId, dataType, data },
    update: { data },
  });
}

async function saveRecordRows(
  matterId,
  dataType,
  incomingRows,
  { merge = false, db = prisma, ...mergeOptions } = {}
) {
  let rows = toArray(incomingRows);
  if (merge) {
    const existingRows = toArray(await getRecordRows(matterId, dataType, db));
    rows = mergeRecordRows(existingRows, rows, mergeOptions);
  }
  // Patch mode can append to legacy rows whose ids are not contiguous. Reindex
  // the final ordered collection so a newly appended row cannot reuse an id.
  const rowsWithIds = merge
    ? rows.map((row, index) => ({ ...row, id: index + 1 }))
    : assignIds(rows);
  await putRecord(matterId, dataType, rowsWithIds, db);
  return rowsWithIds;
}

// Save-side transforms (port of cloud-act-api saveMatter)
//
// Party rows are split back apart on read by an EXACT role match of "Client" /
// "Opposing Party" (see the five-steps Simple forms + DocumentViewDataUpdate hook).
// `role` is forced AFTER the spread so an agent-supplied role (e.g. the matter
// role "Applicant"/"Respondent" the intake bot puts on Background) can't clobber
// the party discriminator the forms hydrate on.
const withRole = (obj, role) => ({ ...(obj || {}), role });

async function saveSections(matter, info, { merge = false, db = prisma } = {}) {
  const matterPatch = {};

  if (info.Background) {
    await saveRecordRows(
      matter.id,
      "background",
      [
        withRole(info.Background.client, "Client"),
        withRole(info.Background.opposingParty, "Opposing Party"),
      ],
      { merge, db, identityGroups: [["role"]] }
    );
  }

  if (info.Court) {
    // The Court Simple form hydrates on court_name / file_number; the intake bot
    // (and legacy save) speak name / fileNumber, so normalise to the form's names.
    const courtRows = toArray(info.Court).map((c) => ({
      ...c,
      court_name: c.court_name ?? c.name ?? "",
      file_number: c.file_number ?? c.fileNumber ?? "",
      address: c.address ?? "",
    }));
    await saveRecordRows(matter.id, "court", courtRows, { merge, db, singleton: true });
  }

  if (info.Children) {
    await saveRecordRows(
      matter.id,
      "children",
      Object.values(info.Children),
      {
        merge, db,
        identityGroups: [
          ["childName", "dateOfBirth"],
          ["childName"],
          ["dateOfBirth"],
        ],
      }
    );
  }

  if (info.Relationship) {
    await saveRecordRows(
      matter.id,
      "relationship",
      toArray(info.Relationship),
      { merge, singleton: true }
    );
  }

  if (info.EmploymentDetails) {
    const normalizeEmployment = (party) => ({
      ...(party || {}),
      employmentStatus: normalizeEmploymentStatus(party?.employmentStatus),
    });
    await saveRecordRows(
      matter.id,
      "employment",
      [
        withRole(normalizeEmployment(info.EmploymentDetails.client), "Client"),
        withRole(normalizeEmployment(info.EmploymentDetails.opposingParty), "Opposing Party"),
      ],
      { merge, db, identityGroups: [["role"]] }
    );
  }

  if (info.IncomeAndBenefits) {
    const section = info.IncomeAndBenefits;
    const financialYear = isBlankValue(section.financialYear)
      ? matter.fyIncomeBenefits
      : section.financialYear;
    // Key indexes section.client / section.opposingParty; roleLabel is the exact
    // discriminator the Income Simple form splits on ("Client"/"Opposing Party").
    const rows = [
      ["client", "Client"],
      ["opposingParty", "Opposing Party"],
    ].flatMap(([key, roleLabel]) => {
      const party = section[key] || {};
      const tag = (items, incomeBenefit) =>
        toArray(items).map((item) => ({
          ...item,
          role: roleLabel,
          incomeBenefit,
          financialYear,
        }));
      return [...tag(party.income, "income"), ...tag(party.benefit, "benefit")];
    });
    await saveRecordRows(matter.id, "income_benefits", rows, {
      merge, db,
      identityGroups: [["role", "incomeBenefit", "type", "financialYear"]],
    });
    if (!isBlankValue(financialYear)) matterPatch.fyIncomeBenefits = financialYear;
  }

  if (info.Expenses) {
    const section = info.Expenses;
    const financialYear = isBlankValue(section.financialYear)
      ? matter.fyExpenses
      : section.financialYear;
    const collect = (key, expenseType) =>
      ["client", "opposingParty"].flatMap((role) =>
        toArray((section[role] || {})[key]).map((item) => ({
          ...item,
          role: item?.role || role,
          expenseType,
          financialYear,
        }))
      );
    await saveRecordRows(
      matter.id,
      "expenses",
      collect("expenses", "expenses"),
      { merge, db, identityGroups: [["role", "type", "financialYear"]] }
    );
    await saveRecordRows(
      matter.id,
      "special_expenses",
      collect("specialChildExpenses", "specialChildExpenses"),
      { merge, db, identityGroups: [["role", "type", "childName", "financialYear"]] }
    );
    if (!isBlankValue(financialYear)) matterPatch.fyExpenses = financialYear;
  }

  if (info.Assets) {
    const section = info.Assets;
    const ASSET_TYPES = [
      "lands",
      "other_property",
      "business_interest",
      "general_household_items_and_vehicles",
      "bank_accounts_savings_securities_pension",
      "life_and_disability_insurance",
      "money_owed_to_you",
    ];
    const rows = ASSET_TYPES.flatMap((asset_type) =>
      toArray(section[asset_type]).map((item) => ({
        ...normalizeAssetItem(asset_type, item),
        asset_type,
      }))
    );
    const assetRows = await saveRecordRows(matter.id, "assets", rows, {
      merge, db,
      identityGroups: [
        ["asset_type", "address_of_property"],
        ["asset_type", "details_op"],
        ["asset_type", "firm_name"],
        ["asset_type", "description_ghiav"],
        ["asset_type", "account_number"],
        ["asset_type", "policy_no"],
        ["asset_type", "details_moty"],
      ],
      uniqueFallbackFields: ["asset_type"],
    });

    // Legacy also kept a flat market-value table; data_all exposes it.
    const marketValueRows = assetRows.flatMap((row) =>
      toArray(row.market_value).map((mv) => ({
        asset_id: row.id,
        asset_type: row.asset_type,
        ...(typeof mv === "object" && mv !== null ? mv : { value: mv }),
      }))
    );
    await putRecord(matter.id, "assets_market_value", assignIds(marketValueRows), db);
    if (!isBlankValue(section.valuation_date)) {
      matterPatch.valuationDate = section.valuation_date;
    }
  }

  if (info.DebtsAndLiabilities) {
    await saveRecordRows(
      matter.id,
      "debts_liabilities",
      toArray(info.DebtsAndLiabilities),
      {
        merge, db,
        identityGroups: [["category", "details"], ["details"]],
        uniqueFallbackFields: ["category"],
      }
    );
  }

  if (info.OtherPersonsInHousehold) {
    await saveRecordRows(
      matter.id,
      "opih",
      toArray(info.OtherPersonsInHousehold),
      { merge, db, singleton: true }
    );
  }

  if (Object.keys(matterPatch).length > 0) {
    await db.matter.update({ where: { id: matter.id }, data: matterPatch });
  }
}

// Read-side transforms (port of cloud-act-api getSingleMatterData)
const emptyExpensesParty = () => ({
  expenses: [],
  specialChildExpenses: [],
  expensesTotals: { totalMonthly: 0, totalYearly: 0 },
  specialChildExpensesTotals: { totalMonthly: 0, totalYearly: 0 },
});

function shapeExpenses(expenseRows, specialRows) {
  const shaped = { client: emptyExpensesParty(), opposingParty: emptyExpensesParty() };
  for (const row of expenseRows) {
    const role = row.role === "opposingParty" ? "opposingParty" : "client";
    shaped[role].expenses.push(row);
  }
  for (const row of specialRows) {
    const role = row.role === "opposingParty" ? "opposingParty" : "client";
    shaped[role].specialChildExpenses.push(row);
  }
  for (const role of ["client", "opposingParty"]) {
    shaped[role].expensesTotals = {
      totalMonthly: shaped[role].expenses.reduce((acc, e) => acc + num(e.monthlyAmount), 0),
      totalYearly: shaped[role].expenses.reduce((acc, e) => acc + num(e.yearlyAmount), 0),
    };
    shaped[role].specialChildExpensesTotals = {
      totalMonthly: shaped[role].specialChildExpenses.reduce((acc, e) => acc + num(e.amount), 0),
      totalYearly: shaped[role].specialChildExpenses.reduce((acc, e) => acc + num(e.amount), 0),
    };
  }
  return shaped;
}

function shapeAssets(assetRows) {
  const grouped = {};
  for (const row of assetRows) {
    const type = row.asset_type || "other_property";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(row);
  }
  return grouped;
}

async function loadMatterDataAll(matter, matterId, db = prisma) {
  const rowsOf = async (type) => matter ? toArray(await getRecordRows(matter.id, type, db)) : [];
  const [background, children, court, employment, debts, relationship, opih, incomeBenefits,
    marketValue, assets, expenses, special] = await Promise.all([
    rowsOf("background"), rowsOf("children"), rowsOf("court"), rowsOf("employment"),
    rowsOf("debts_liabilities"), rowsOf("relationship"), rowsOf("opih"),
    rowsOf("income_benefits"), rowsOf("assets_market_value"), rowsOf("assets"),
    rowsOf("expenses"), rowsOf("special_expenses"),
  ]);
  return {
    matter_number: matter?.matterNumber || String(matterId), client_id: matter?.clientName || "",
    valuation_date: matter?.valuationDate || "",
    financial_year_income_benefits: matter?.fyIncomeBenefits || "",
    financial_year_expenses: matter?.fyExpenses || "",
    background, children, court_info: court, employment, debts_liabilities: debts,
    relationship, other_persons: opih, income_benefits: incomeBenefits,
    assets_market_value: marketValue, assets: shapeAssets(assets),
    expenses: shapeExpenses(expenses, special),
  };
}

// Completion is determined only from persisted values. This intentionally has
// no language-model or reply-text input.
function validateMatterIntake(data) {
  const missing = [];
  const party = (role) => data.background.find((row) => row.role === role) || {};
  for (const role of ["Client", "Opposing Party"]) {
    if (isBlankValue(party(role).name)) missing.push(`Background.${role === "Client" ? "client" : "opposingParty"}.name`);
  }
  const relationship = data.relationship[0] || {};
  for (const field of ["dateOfMarriage", "dateOfSeparation"]) {
    if (isBlankValue(relationship[field])) missing.push(`Relationship.${field}`);
  }
  for (const role of ["Client", "Opposing Party"]) {
    const row = data.employment.find((item) => item.role === role) || {};
    if (isBlankValue(row.employmentStatus)) missing.push(`EmploymentDetails.${role === "Client" ? "client" : "opposingParty"}.employmentStatus`);
  }
  if (!data.income_benefits.some((row) => row.role === "Client" && row.incomeBenefit === "income")) missing.push("IncomeAndBenefits.client.income");
  if (!data.income_benefits.some((row) => row.role === "Opposing Party" && row.incomeBenefit === "income")) missing.push("IncomeAndBenefits.opposingParty.income");
  return { complete: missing.length === 0, missing };
}

// dataType aliases: the UI dispatches a few names the legacy controller
// spelled differently (or, for "debt", not at all - a legacy dead-end).
const ROW_TYPES = {
  background: "background",
  children: "children",
  court: "court",
  employment: "employment",
  relationship: "relationship",
  otherPersons: "opih",
  incomeBenefits: "income_benefits",
  debtsLiabilities: "debts_liabilities",
  debt: "debts_liabilities",
  marketValue: "assets_market_value",
  lands: "assets",
  folders: "folders",
};

// Matter routes
router.post("/create_matter/:sid", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.matterNumber || !body.clientName) {
      return res
        .status(404)
        .json(errorBody("matterNumber and clientName are required."));
    }
    const checkedItems = Array.isArray(body.checkedItems)
      ? JSON.stringify(body.checkedItems)
      : body.checkedItems ?? null;
    const fields = {
      clientName: String(body.clientName),
      clientRole: body.clientRole ?? null,
      childrenInvolved: body.childrenInvolved ?? null,
      province: body.province ?? null,
      checkedItems,
      firstflag: 1,
    };
    const matter = await prisma.matter.upsert({
      where: {
        userId_matterNumber: {
          userId: req.user.id,
          matterNumber: String(body.matterNumber),
        },
      },
      create: {
        userId: req.user.id,
        matterNumber: String(body.matterNumber),
        ...fields,
      },
      update: fields,
    });
    return res.json(ok({ id: matter.id, insertId: matter.id }));
  } catch (err) {
    console.log("POST /v1/create_matter failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not create matter.", 500));
  }
});

router.get("/get_matters/:sid", async (req, res) => {
  try {
    const matters = await prisma.matter.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
    });
    return res.json(ok(matters.map(matterRow)));
  } catch (err) {
    console.log("GET /v1/get_matters failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list matters.", 500));
  }
});

router.get("/get_single_matter/:sid/:matter_id", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    return res.json(ok(matter ? [matterRow(matter)] : []));
  } catch (err) {
    console.log("GET /v1/get_single_matter failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not load matter.", 500));
  }
});

router.post("/save_matter/:sid/:matter_id", async (req, res) => {
  try {
    const info = req.body?.data;
    if (!info || typeof info !== "object") {
      return res.status(404).json(errorBody("No form data supplied."));
    }
    let matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) {
      // Five-steps can save before the create call settles - don't lose data.
      matter = await prisma.matter.create({
        data: {
          userId: req.user.id,
          matterNumber: String(req.params.matter_id),
          clientName: "",
        },
      });
    }
    // AI callers explicitly opt into field-level merge semantics. Other callers
    // retain the legacy full-section replacement behaviour by default.
    const merge = req.body?.save_mode === "merge";
    await saveSections(matter, info, { merge });
    return res.json(ok(req.body));
  } catch (err) {
    console.log("POST /v1/save_matter failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save matter.", 500));
  }
});

const AI_PATCH_SECTIONS = new Set([
  "Background", "Relationship", "Children", "IncomeAndBenefits",
  "EmploymentDetails", "Expenses", "Assets", "DebtsAndLiabilities",
  "Court", "OtherPersonsInHousehold",
]);

// Dedicated AI-only write path. Unlike save_matter, this endpoint never offers
// replacement semantics and does not trust a client-provided save mode.
router.post("/patch_matter_intake/:sid/:matter_id", async (req, res) => {
  const patches = req.body?.patches;
  if (req.body?.source !== "ai-intake" || !Array.isArray(patches)) {
    return res.status(400).json(errorBody("AI intake patches are required.", 400));
  }
  if (patches.some((patch) => !patch || !AI_PATCH_SECTIONS.has(patch.section) || patch.data === undefined)) {
    return res.status(400).json(errorBody("Each patch needs a supported section and data.", 400));
  }

  // Serializable prevents two concurrent chat replies from both merging against
  // the same stale JSON record. Postgres reports a retryable conflict as P2034.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        let matter = await findMatter(req.user.id, req.params.matter_id, tx);
        if (!matter) {
          matter = await tx.matter.create({
            data: { userId: req.user.id, matterNumber: String(req.params.matter_id), clientName: "" },
          });
        }
        for (const patch of patches) {
          await saveSections(matter, { [patch.section]: patch.data }, { merge: true, db: tx });
          // Header fields may have changed; the final read must be authoritative.
          matter = await tx.matter.findUnique({ where: { id: matter.id } });
        }
        const savedMatter = await loadMatterDataAll(matter, req.params.matter_id, tx);
        return { saved: true, matter: savedMatter, completion: validateMatterIntake(savedMatter) };
      }, { isolationLevel: "Serializable" });
      return res.json(ok(result));
    } catch (err) {
      if (err?.code === "P2034" && attempt < 2) continue;
      if (err?.code === "AMBIGUOUS_PATCH") {
        return res.status(409).json(errorBody(err.message, 409));
      }
      console.log("POST /v1/patch_matter_intake failed:", err?.message || err);
      return res.status(500).json(errorBody("Could not apply AI intake patch.", 500));
    }
  }
});

// Manual per-section saves (the five-steps Simple forms + Profile Summary
// modals) POST a WRAPPED body, e.g. { type:"children", children:[...] } or
// { type:"relationship", relationship:{ data:{...} } }. Map each to the same
// PascalCase section payload save_matter uses, so a single-section update runs
// through the identical saveSections transforms and stores the row shape the
// read side hydrates. Storing the wrapper raw (the old behaviour) never
// round-trips — the read expects section rows, not a { type, section } object.
const UPDATE_SECTION_MAP = {
  background: { key: "Background", pick: (b) => b.background },
  court: { key: "Court", pick: (b) => b.courtInfo ?? b.court },
  courtInfo: { key: "Court", pick: (b) => b.courtInfo ?? b.court },
  children: { key: "Children", pick: (b) => b.children },
  relationship: { key: "Relationship", pick: (b) => b.relationship?.data ?? b.relationship },
  employment: { key: "EmploymentDetails", pick: (b) => b.employment?.data ?? b.employment },
  incomeBenefits: { key: "IncomeAndBenefits", pick: (b) => b.incomeBenefits },
  expenses: { key: "Expenses", pick: (b) => b.expenses?.data ?? b.expenses },
  assets: { key: "Assets", pick: (b) => b.assets },
  debtsLiabilities: { key: "DebtsAndLiabilities", pick: (b) => b.debtsLiabilities },
  debt: { key: "DebtsAndLiabilities", pick: (b) => b.debtsLiabilities ?? b.debt },
  otherPersons: { key: "OtherPersonsInHousehold", pick: (b) => b.otherPersons },
};

router.post("/update_matter/:sid/:matter_id/:data_type", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));

    const mapping = UPDATE_SECTION_MAP[req.params.data_type];
    const payload = mapping ? mapping.pick(req.body || {}) : undefined;
    if (mapping && payload !== undefined) {
      await saveSections(matter, { [mapping.key]: payload });
    } else {
      // Unmapped types (folders, form_fields, …) keep the legacy raw store.
      const storedType = ROW_TYPES[req.params.data_type] || req.params.data_type;
      await putRecord(matter.id, storedType, assignIds(toArray(req.body)));
    }
    return res.json(ok(req.body));
  } catch (err) {
    console.log("POST /v1/update_matter failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not update matter.", 500));
  }
});

router.post("/SAVE_FORM_FIELDS/:sid/:matter_id", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));

    await putRecord(matter.id, "form_fields", [req.body || {}]);
    return res.json(ok(req.body || {}));
  } catch (err) {
    console.log("POST /v1/SAVE_FORM_FIELDS failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save form fields.", 500));
  }
});

router.get(
  "/get_single_matter_data/:sid/:matter_id/:data_type",
  async (req, res) => {
    try {
      const { data_type } = req.params;
      const matter = await findMatter(req.user.id, req.params.matter_id);
      if (!matter) {
        return res.json(
          ok(data_type === "expenses" || data_type === "assets" ? {} : [])
        );
      }

      if (data_type === "expenses") {
        const [expenses, special] = await Promise.all([
          getRecordRows(matter.id, "expenses"),
          getRecordRows(matter.id, "special_expenses"),
        ]);
        return res.json(ok(shapeExpenses(toArray(expenses), toArray(special))));
      }
      if (data_type === "assets") {
        const assets = await getRecordRows(matter.id, "assets");
        return res.json(ok(shapeAssets(toArray(assets))));
      }
      const stored = ROW_TYPES[data_type];
      if (!stored) return res.json(ok([]));
      const rows = await getRecordRows(matter.id, stored);
      return res.json(ok(toArray(rows)));
    } catch (err) {
      console.log("GET /v1/get_single_matter_data failed:", err?.message || err);
      return res.status(500).json(errorBody("Could not load matter data.", 500));
    }
  }
);

router.get(
  "/get_single_matter_data_all/:sid/:matter_id",
  async (req, res) => {
    try {
      const matter = await findMatter(req.user.id, req.params.matter_id);
      const rowsOf = async (type) =>
        matter ? toArray(await getRecordRows(matter.id, type)) : [];

      const [
        background,
        children,
        court,
        employment,
        debts,
        relationship,
        opih,
        incomeBenefits,
        marketValue,
        assets,
        expenses,
        special,
      ] = await Promise.all([
        rowsOf("background"),
        rowsOf("children"),
        rowsOf("court"),
        rowsOf("employment"),
        rowsOf("debts_liabilities"),
        rowsOf("relationship"),
        rowsOf("opih"),
        rowsOf("income_benefits"),
        rowsOf("assets_market_value"),
        rowsOf("assets"),
        rowsOf("expenses"),
        rowsOf("special_expenses"),
      ]);

      return res.json(
        ok({
          matter_number: matter?.matterNumber || String(req.params.matter_id),
          client_id: matter?.clientName || "",
          valuation_date: matter?.valuationDate || "",
          financial_year_income_benefits: matter?.fyIncomeBenefits || "",
          financial_year_expenses: matter?.fyExpenses || "",
          background,
          children,
          court_info: court,
          employment,
          debts_liabilities: debts,
          relationship,
          other_persons: opih,
          income_benefits: incomeBenefits,
          assets_market_value: marketValue,
          assets: shapeAssets(assets),
          expenses: shapeExpenses(expenses, special),
        })
      );
    } catch (err) {
      console.log(
        "GET /v1/get_single_matter_data_all failed:",
        err?.message || err
      );
      return res.status(500).json(errorBody("Could not load matter data.", 500));
    }
  }
);

// Reference data: the legacy dev backend returns empty lists for these too,
// so parity is an empty body until ON reference data gets a real home here.
router.get("/get_municipalities/:sid/:province", (req, res) =>
  res.json(ok([]))
);
router.get("/get_courts/:sid/:province", (req, res) => res.json(ok([])));

// Folders & files metadata (documents live in matter records for now)
router.post("/create_folder", async (req, res) => {
  try {
    const { matter_id, title, type } = req.body || {};
    const matter = await findMatter(req.user.id, matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));
    const rawTitle = String(title ?? "Untitled").trim();
    const normalizedTitle = rawTitle.replace(/\s+/g, " ").toLocaleLowerCase();
    const saved = await prisma.matterFolder.upsert({
      where: { matterId_normalizedTitle: { matterId: matter.id, normalizedTitle } },
      create: { matterId: matter.id, title: rawTitle, normalizedTitle, type: type ?? null },
      update: {},
    });
    const folder = { id: saved.id, title: saved.title, type: saved.type, matter_id: matter.matterNumber, sid: req.user.id, created: saved.createdAt };
    return res.json(ok(folder));
  } catch (err) {
    console.log("POST /v1/create_folder failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not create folder.", 500));
  }
});

router.get("/get_folders/:sid/:matter_id", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.json(ok([]));
    const normalized = await prisma.matterFolder.findMany({ where: { matterId: matter.id }, orderBy: { createdAt: "asc" } });
    const folders = normalized.length
      ? normalized.map((folder) => ({ id: folder.id, title: folder.title, type: folder.type, matter_id: matter.matterNumber, sid: req.user.id, created: folder.createdAt }))
      : toArray(await getRecordRows(matter.id, "folders"));
    return res.json(ok(folders));
  } catch (err) {
    console.log("GET /v1/get_folders failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list folders.", 500));
  }
});

router.post("/add_files", async (req, res) => {
  try {
    const body = req.body || {};
    const matter = await findMatter(req.user.id, body.matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));
    const files = toArray(await getRecordRows(matter.id, "files"));
    const file = {
      id: files.reduce((max, f) => Math.max(max, f.id || 0), 0) + 1,
      ...body,
      sid: req.user.id,
      created: new Date().toISOString(),
    };
    await putRecord(matter.id, "files", [...files, file]);
    return res.json(ok(file));
  } catch (err) {
    console.log("POST /v1/add_files failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not add file.", 500));
  }
});

router.get("/get_files/:sid/:matter_id/:folder_id", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    const files = matter ? toArray(await getRecordRows(matter.id, "files")) : [];
    const inFolder = files.filter(
      (f) => String(f.folder_id) === String(req.params.folder_id)
    );
    return res.json(ok(inFolder));
  } catch (err) {
    console.log("GET /v1/get_files failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list files.", 500));
  }
});

router.post("/save_file_data/:sid/:matter_id", async (req, res) => {
  try {
    const body = req.body || {};
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));
    const key = `file_data:${body.folder_id ?? "0"}:${body.file_id ?? "0"}`;
    await putRecord(matter.id, key, [body]);
    return res.json(ok(body));
  } catch (err) {
    console.log("POST /v1/save_file_data failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save file data.", 500));
  }
});

router.get(
  "/get_file_data/:sid/:short_firmname/:matter_id/:folder_id/:file_id",
  async (req, res) => {
    try {
      const matter = await findMatter(req.user.id, req.params.matter_id);
      if (!matter) return res.json(ok([]));
      const key = `file_data:${req.params.folder_id}:${req.params.file_id}`;
      const rows = toArray(await getRecordRows(matter.id, key));
      return res.json(ok(rows));
    } catch (err) {
      console.log("GET /v1/get_file_data failed:", err?.message || err);
      return res.status(500).json(errorBody("Could not load file data.", 500));
    }
  }
);

// Saved calculator values (legacy tbl_calculator_values)
function savedCalcFields(body) {
  return {
    label: body.label != null ? String(body.label) : undefined,
    description: body.description != null ? String(body.description) : undefined,
    taxYear: body.tax_year != null ? String(body.tax_year) : undefined,
    status: body.status != null ? String(body.status) : undefined,
    type: body.type != null ? String(body.type) : undefined,
    calculatorType:
      body.calculator_type != null ? String(body.calculator_type) : undefined,
    matterId: body.matter_id != null ? String(body.matter_id) : undefined,
    data:
      body.data != null
        ? typeof body.data === "string"
          ? body.data
          : JSON.stringify(body.data)
        : undefined,
    reportUrl: body.report_url != null ? String(body.report_url) : undefined,
    reportData:
      body.report_data != null
        ? typeof body.report_data === "string"
          ? body.report_data
          : JSON.stringify(body.report_data)
        : undefined,
    createdBy: body.created_by != null ? String(body.created_by) : undefined,
  };
}

router.post("/calculator/save_values", async (req, res) => {
  try {
    const body = req.body || {};
    const fields = savedCalcFields(body);
    if (fields.matterId) {
      const matter = await findMatter(req.user.id, fields.matterId);
      if (matter) fields.matterDbId = matter.id;
    }
    if (body.id) {
      const existing = await prisma.savedCalculation.findFirst({
        where: { id: Number(body.id), userId: req.user.id },
      });
      if (!existing) return res.status(404).json(errorBody("Not found."));
      const updated = await prisma.savedCalculation.update({
        where: { id: existing.id },
        data: fields,
      });
      return res.json(ok({ id: updated.id }));
    }
    if (!fields.label) {
      return res.status(404).json(errorBody("Label is required."));
    }
    const duplicate = await prisma.savedCalculation.findFirst({
      where: { userId: req.user.id, label: fields.label },
    });
    if (duplicate) {
      return res
        .status(404)
        .json(errorBody(`Label name ${fields.label} already exists.`));
    }
    const created = await prisma.savedCalculation.create({
      data: { userId: req.user.id, ...fields, label: fields.label },
    });
    return res.json(ok({ id: created.id, insertId: created.id }));
  } catch (err) {
    console.log("POST /v1/calculator/save_values failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save calculation.", 500));
  }
});

router.patch("/calculator/save_values/:id", async (req, res) => {
  try {
    const existing = await prisma.savedCalculation.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json(errorBody("Not found."));
    const fields = savedCalcFields(req.body || {});
    if (fields.matterId) {
      const matter = await findMatter(req.user.id, fields.matterId);
      if (matter) fields.matterDbId = matter.id;
    }
    const updated = await prisma.savedCalculation.update({
      where: { id: existing.id },
      data: fields,
    });
    return res.json(ok({ id: updated.id }));
  } catch (err) {
    console.log("PATCH /v1/calculator/save_values failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not update calculation.", 500));
  }
});

router.get("/matters/:matter_id/calculations/latest/:type", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.json(ok(null));
    const calculation = await prisma.savedCalculation.findFirst({
      where: { userId: req.user.id, matterDbId: matter.id, type: req.params.type, status: "completed" },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(ok(calculation ? { id: calculation.id, type: calculation.type, tax_year: calculation.taxYear, data: calculation.data, updated_at: calculation.updatedAt } : null));
  } catch (err) {
    return res.status(500).json(errorBody("Could not load calculation.", 500));
  }
});

router.get("/calculator/get_values/:sid", async (req, res) => {
  try {
    const rows = await prisma.savedCalculation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json(
      ok(
        rows.map((row) => ({
          id: row.id,
          label: row.label,
          description: row.description,
          status: row.status,
          calculator_type: row.calculatorType,
          created_by: row.createdBy,
          created_at: row.createdAt,
        }))
      )
    );
  } catch (err) {
    console.log("GET /v1/calculator/get_values failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list calculations.", 500));
  }
});

// Save report PDF for a saved calculation
router.put("/calculator/save_report_pdf/:id", express.raw({ type: "application/pdf", limit: "20mb" }), async (req, res) => {
  try {
    const pdf = Buffer.isBuffer(req.body) ? req.body : null;
    if (!pdf || pdf.length === 0) return res.status(400).json(errorBody("PDF body is required."));
    const existing = await prisma.savedCalculation.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json(errorBody("Calculation not found."));
    await prisma.savedCalculation.update({
      where: { id: existing.id },
      data: { reportPdf: pdf },
    });
    return res.json(ok({ id: existing.id, pdfBytes: pdf.length }));
  } catch (err) {
    console.log("PUT /v1/calculator/save_report_pdf failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save report PDF.", 500));
  }
});

// Serve report PDF for a saved calculation
router.get("/calculator/get_report_pdf/:id", async (req, res) => {
  try {
    const row = await prisma.savedCalculation.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
      select: { reportPdf: true, label: true },
    });
    if (!row?.reportPdf) return res.status(404).json(errorBody("No PDF found for this calculation."));
    res.type("application/pdf");
    res.set("Content-Disposition", `inline; filename="${(row.label || "report").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`);
    return res.send(row.reportPdf);
  } catch (err) {
    console.log("GET /v1/calculator/get_report_pdf failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not retrieve report PDF.", 500));
  }
});

router.get("/calculator/get_values_by_matter/:matter_id", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.json(ok([]));
    const rows = await prisma.savedCalculation.findMany({
      where: { userId: req.user.id, matterDbId: matter.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, label: true, description: true, status: true,
        calculatorType: true, createdBy: true, createdAt: true,
        reportPdf: false,
      },
    });
    // Check which rows have a PDF without loading the bytes
    const idsWithPdf = new Set(
      (await prisma.$queryRaw`SELECT id FROM "SavedCalculation" WHERE "matterDbId" = ${matter.id} AND "reportPdf" IS NOT NULL`).map((r) => r.id)
    );
    return res.json(
      ok(
        rows.map((row) => ({
          id: row.id,
          label: row.label,
          description: row.description,
          status: row.status,
          calculator_type: row.calculatorType,
          created_by: row.createdBy,
          created_at: row.createdAt,
          has_pdf: idsWithPdf.has(row.id),
        }))
      )
    );
  } catch (err) {
    console.log("GET /v1/calculator/get_values_by_matter failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list calculations for matter.", 500));
  }
});

router.get("/calculator/get_data_by_stored_id/:id", async (req, res) => {
  try {
    const row = await prisma.savedCalculation.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!row) return res.status(404).json(errorBody("No Data Found!"));
    return res.json(
      ok([
        {
          data: row.data,
          label: row.label,
          description: row.description,
          created_by: row.createdBy,
          report_data: row.reportData,
        },
      ])
    );
  } catch (err) {
    console.log(
      "GET /v1/calculator/get_data_by_stored_id failed:",
      err?.message || err
    );
    return res.status(500).json(errorBody("Could not load calculation.", 500));
  }
});

router.delete("/calculator/delete_value/:id", async (req, res) => {
  try {
    const row = await prisma.savedCalculation.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    });
    if (!row) return res.status(404).json(errorBody("Not found."));
    await prisma.savedCalculation.delete({ where: { id: row.id } });
    return res.json(ok({ id: row.id }));
  } catch (err) {
    console.log(
      "DELETE /v1/calculator/delete_value failed:",
      err?.message || err
    );
    return res.status(500).json(errorBody("Could not delete calculation.", 500));
  }
});

// Calculator welcome screen: client + matter pickers. The personal build has
// no separate clients table (legacy f_ca_clients) - clients are derived from
// the user's matters, so the pickers show exactly what the user created.
router.get("/clients", async (req, res) => {
  try {
    const matters = await prisma.matter.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
    });
    const seen = new Set();
    const clients = [];
    for (const matter of matters) {
      const name = matter.clientName || "";
      if (!name || seen.has(name)) continue;
      seen.add(name);
      clients.push({
        id: clients.length + 1,
        client_id: name,
        client_name: name,
        client_type: matter.clientRole || "Client",
        sid: matter.userId,
      });
    }
    return res.json(ok(clients));
  } catch (err) {
    console.log("GET /v1/clients failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not list clients.", 500));
  }
});

router.get("/matterdisplayNumber/:sid/:clientId", async (req, res) => {
  try {
    const matters = await prisma.matter.findMany({
      where: { userId: req.user.id, clientName: String(req.params.clientId) },
      orderBy: { createdAt: "asc" },
    });
    return res.json(
      ok(
        matters.map((matter) => ({
          id: matter.id,
          matter_display_nbr: matter.matterNumber,
          matterNumber: matter.matterNumber,
          client_id: matter.clientName,
        }))
      )
    );
  } catch (err) {
    console.log("GET /v1/matterdisplayNumber failed:", err?.message || err);
    return res
      .status(500)
      .json(errorBody("Could not list matter numbers.", 500));
  }
});

module.exports = router;

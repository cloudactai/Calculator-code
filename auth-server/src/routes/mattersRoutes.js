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
// Save semantics improve on legacy: each five-steps section REPLACES that
// section's rows (legacy blindly re-INSERTed, duplicating rows on re-save).
const express = require("express");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");

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

// Matter helpers
async function findMatter(userId, matterParam) {
  const asNumber = Number(matterParam);
  return prisma.matter.findFirst({
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

async function getRecordRows(matterId, dataType) {
  const record = await prisma.matterRecord.findUnique({
    where: { matterId_dataType: { matterId, dataType } },
  });
  return Array.isArray(record?.data) ? record.data : record?.data ?? [];
}

async function putRecord(matterId, dataType, data) {
  await prisma.matterRecord.upsert({
    where: { matterId_dataType: { matterId, dataType } },
    create: { matterId, dataType, data },
    update: { data },
  });
}

// Save-side transforms (port of cloud-act-api saveMatter)
const withRole = (obj, role) => ({ role, ...(obj || {}) });

async function saveSections(matter, info) {
  const matterPatch = {};

  if (info.Background) {
    await putRecord(
      matter.id,
      "background",
      assignIds([
        withRole(info.Background.client, "client"),
        withRole(info.Background.opposingParty, "opposingParty"),
      ])
    );
  }

  if (info.Court) {
    await putRecord(matter.id, "court", assignIds(toArray(info.Court)));
  }

  if (info.Children) {
    await putRecord(
      matter.id,
      "children",
      assignIds(Object.values(info.Children))
    );
  }

  if (info.Relationship) {
    await putRecord(
      matter.id,
      "relationship",
      assignIds(toArray(info.Relationship))
    );
  }

  if (info.EmploymentDetails) {
    await putRecord(
      matter.id,
      "employment",
      assignIds([
        withRole(info.EmploymentDetails.client, "client"),
        withRole(info.EmploymentDetails.opposingParty, "opposingParty"),
      ])
    );
  }

  if (info.IncomeAndBenefits) {
    const section = info.IncomeAndBenefits;
    const financialYear = section.financialYear;
    const rows = ["client", "opposingParty"].flatMap((role) => {
      const party = section[role] || {};
      const tag = (items, incomeBenefit) =>
        toArray(items).map((item) => ({
          ...item,
          role: item?.role || role,
          incomeBenefit,
          financialYear,
        }));
      return [...tag(party.income, "income"), ...tag(party.benefit, "benefit")];
    });
    await putRecord(matter.id, "income_benefits", assignIds(rows));
    matterPatch.fyIncomeBenefits = financialYear ?? matter.fyIncomeBenefits;
  }

  if (info.Expenses) {
    const section = info.Expenses;
    const financialYear = section.financialYear;
    const collect = (key, expenseType) =>
      ["client", "opposingParty"].flatMap((role) =>
        toArray((section[role] || {})[key]).map((item) => ({
          ...item,
          role: item?.role || role,
          expenseType,
          financialYear,
        }))
      );
    await putRecord(
      matter.id,
      "expenses",
      assignIds(collect("expenses", "expenses"))
    );
    await putRecord(
      matter.id,
      "special_expenses",
      assignIds(collect("specialChildExpenses", "specialChildExpenses"))
    );
    matterPatch.fyExpenses = financialYear ?? matter.fyExpenses;
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
      toArray(section[asset_type]).map((item) => ({ ...item, asset_type }))
    );
    const assetRows = assignIds(rows);
    await putRecord(matter.id, "assets", assetRows);

    // Legacy also kept a flat market-value table; data_all exposes it.
    const marketValueRows = assetRows.flatMap((row) =>
      toArray(row.market_value).map((mv) => ({
        asset_id: row.id,
        asset_type: row.asset_type,
        ...(typeof mv === "object" && mv !== null ? mv : { value: mv }),
      }))
    );
    await putRecord(matter.id, "assets_market_value", assignIds(marketValueRows));
    if (section.valuation_date !== undefined) {
      matterPatch.valuationDate = section.valuation_date;
    }
  }

  if (info.DebtsAndLiabilities) {
    await putRecord(
      matter.id,
      "debts_liabilities",
      assignIds(toArray(info.DebtsAndLiabilities))
    );
  }

  if (info.OtherPersonsInHousehold) {
    await putRecord(
      matter.id,
      "opih",
      assignIds(toArray(info.OtherPersonsInHousehold))
    );
  }

  if (Object.keys(matterPatch).length > 0) {
    await prisma.matter.update({ where: { id: matter.id }, data: matterPatch });
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
    await saveSections(matter, info);
    return res.json(ok(req.body));
  } catch (err) {
    console.log("POST /v1/save_matter failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not save matter.", 500));
  }
});

router.post("/update_matter/:sid/:matter_id/:data_type", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    if (!matter) return res.status(404).json(errorBody("Matter not found."));

    const storedType = ROW_TYPES[req.params.data_type] || req.params.data_type;
    await putRecord(matter.id, storedType, assignIds(toArray(req.body)));
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
    const folders = toArray(await getRecordRows(matter.id, "folders"));
    const folder = {
      id: folders.reduce((max, f) => Math.max(max, f.id || 0), 0) + 1,
      title: title ?? "Untitled",
      type: type ?? null,
      matter_id: matter.matterNumber,
      sid: req.user.id,
      created: new Date().toISOString(),
    };
    await putRecord(matter.id, "folders", [...folders, folder]);
    return res.json(ok(folder));
  } catch (err) {
    console.log("POST /v1/create_folder failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not create folder.", 500));
  }
});

router.get("/get_folders/:sid/:matter_id", async (req, res) => {
  try {
    const matter = await findMatter(req.user.id, req.params.matter_id);
    const folders = matter ? toArray(await getRecordRows(matter.id, "folders")) : [];
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
    const updated = await prisma.savedCalculation.update({
      where: { id: existing.id },
      data: savedCalcFields(req.body || {}),
    });
    return res.json(ok({ id: updated.id }));
  } catch (err) {
    console.log("PATCH /v1/calculator/save_values failed:", err?.message || err);
    return res.status(500).json(errorBody("Could not update calculation.", 500));
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

module.exports = router;

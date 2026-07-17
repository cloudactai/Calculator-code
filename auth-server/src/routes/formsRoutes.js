const crypto = require("crypto");
const express = require("express");
const path = require("path");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const { parseStoredJson, prefillFields, supportType } = require("../utils/formPrefillResolver");

const router = express.Router();
router.use(authMiddleware);

// The database-backed Forms flow remains enabled by default so existing
// production users are not interrupted. Set FORMS_DATABASE_BACKEND=false to
// stop Forms traffic at this boundary during a controlled rollback.
const formsDatabaseBackendEnabled = !["false", "0", "off"].includes(
  String(process.env.FORMS_DATABASE_BACKEND || "true").trim().toLowerCase()
);
router.use((req, res, next) => {
  if (formsDatabaseBackendEnabled) return next();
  return res.status(503).json({ message: "The Forms service is temporarily unavailable." });
});

const formsRequestMetricsEnabled = !["false", "0", "off"].includes(
  String(process.env.FORMS_REQUEST_METRICS || "true").trim().toLowerCase()
);
router.use((req, res, next) => {
  if (!formsRequestMetricsEnabled) return next();
  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    // Keep production telemetry free of matter numbers, user IDs, and field values.
    if (req.method !== "GET" || res.statusCode >= 400) {
      console.info(JSON.stringify({
        event: "forms_request",
        method: req.method,
        status: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
      }));
    }
  });
  return next();
});

const normaliseFolderTitle = (value) => String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();

async function matterForUser(userId, matterNumber) {
  const id = Number(matterNumber);
  return prisma.matter.findFirst({
    where: { userId, OR: [{ matterNumber: String(matterNumber) }, ...(Number.isInteger(id) ? [{ id }] : [])] },
  });
}

const TASK_STATUSES = new Set(["not_started", "in_progress", "completed"]);

function templateDto(template) {
  return {
    form_id: template.id,
    doc_id: template.docId,
    province: template.province,
    category: template.category,
    title: template.title,
    short_title: template.shortTitle,
    file_name: template.fileName,
    footer_text: template.footerText,
    status: template.status,
    production_ready: template.productionReady,
    mapping_ready: template.mappingReady,
  };
}

function matterDto(matter) {
  return {
    matterNumber: matter.matterNumber,
    client_id: matter.clientName,
    province: matter.province,
  };
}

function documentDto(document) {
  const template = document.templateVersion.template;
  return {
    id: document.id,
    matter_id: document.matterId,
    folder_id: document.folderId,
    file_name: document.displayName,
    docId: template.docId,
    status: document.status,
    revision: document.revision,
    generated_pdf_revision: document.generatedPdfRevision,
    template_version: document.templateVersion.version,
    created: document.createdAt,
    updated: document.updatedAt,
  };
}

async function activeTemplateVersion(docId, version) {
  return prisma.formTemplateVersion.findFirst({
    where: {
      ...(Number.isInteger(version) ? { version } : { active: true }),
      template: { docId },
    },
    orderBy: { version: "desc" },
  });
}

function canManageTemplateMappings(userId) {
  return new Set(
    String(process.env.FORMS_TEMPLATE_ADMIN_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  ).has(String(userId));
}

function validFieldMapping(mapping) {
  return mapping
    && typeof mapping === "object"
    && !Array.isArray(mapping)
    && Array.isArray(mapping.staticFields)
    && mapping.staticFields.every((field) => field && typeof field === "object" && !Array.isArray(field) && String(field.id || "").trim());
}

function sendTemplatePdf(res, version) {
  if (!version || (!version.pdfBytes && !version.pdfPath)) {
    return res.status(404).json({ message: "PDF template is unavailable." });
  }
  res.type("application/pdf");
  if (version.pdfPath) {
    const templatesRoot = path.resolve(__dirname, "..", "..", "form-template-export");
    const filePath = path.resolve(templatesRoot, version.pdfPath);
    if (!filePath.startsWith(`${templatesRoot}${path.sep}`)) {
      return res.status(400).json({ message: "Invalid PDF template path." });
    }
    return res.sendFile(filePath);
  }
  return res.send(Buffer.from(version.pdfBytes));
}

async function buildPrefillData(matter, userId) {
  const [records, profile, calculations] = await Promise.all([
    prisma.matterRecord.findMany({ where: { matterId: matter.id } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, name: true, email: true, phoneNumber: true, street: true, addressProvince: true, country: true },
    }),
    prisma.savedCalculation.findMany({
      where: {
        userId,
        status: { equals: "completed", mode: "insensitive" },
        OR: [{ matterDbId: matter.id }, { matterId: matter.matterNumber }],
      },
      select: { type: true, calculatorType: true, data: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const rows = (type) => {
    const data = records.find((record) => record.dataType === type)?.data;
    return Array.isArray(data) ? data : [];
  };
  const party = (role) => rows("background").find((item) => item.role === role) || {};
  const lawyer = (person) => ({
    fullLegalName: person.lawyerName || "", address: person.lawyerAddress || "",
    phoneAndFax: person.lawyerPhone || "", email: person.lawyerEmail || "",
  });
  const person = (value) => ({
    fullLegalName: value.name || "", address: value.address || "",
    phoneAndFax: value.phoneAndFax || value.phone || "", email: value.email || "",
  });
  const client = party("Client");
  const opposingParty = party("Opposing Party");
  const court = rows("court")[0] || {};
  const employmentRows = rows("employment");
  const byRole = (collection, role) => collection.find((item) => item.role === role) || {};
  const support = {};
  for (const calculation of calculations) {
    const type = supportType(calculation);
    if (type && !support[type]) support[type] = parseStoredJson(calculation.data);
  }
  const applicantLawyer = lawyer(client);
  const respondentLawyer = lawyer(opposingParty);
  return {
    matter: { matterNumber: matter.matterNumber, province: matter.province, clientName: matter.clientName },
    court_info: { courtName: court.court_name || "", courtFileNumber: court.file_number || "", courtOfficeAddress: court.address || "" },
    court: court,
    applicant: person(client), applicantLawyer, applicantsLawyer: applicantLawyer,
    respondent: person(opposingParty), respondentLawyer, respondentsLawyer: respondentLawyer,
    employmentStatus: { client: byRole(employmentRows, "Client"), opposingParty: byRole(employmentRows, "Opposing Party") },
    children: rows("children"), relationship: rows("relationship")[0] || {},
    income: rows("incomeBenefits")[0] || rows("income_benefits")[0] || {},
    expenses: rows("expenses")[0] || {},
    assets: rows("assets")[0] || {},
    debts: rows("debt")[0] || rows("debts_liabilities")[0] || {},
    profile: profile || {},
    support,
  };
}

// Catalog response intentionally keeps the source UI's field names.
router.get("/forms", async (req, res) => {
  const provinceInput = String(req.query.province || "").trim().toUpperCase();
  const province = { ONTARIO: "ON", ALBERTA: "AB", "BRITISH COLUMBIA": "BC" }[provinceInput] || provinceInput;
  const where = {
    ...(province ? { province } : {}),
    ...(req.query.production_ready === "true" ? { productionReady: true } : {}),
    ...(req.query.mapping_ready === "true" ? { mappingReady: true } : {}),
  };
  const templates = await prisma.formTemplate.findMany({ where, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
  return res.json({ data: templates.map(templateDto) });
});

router.get("/form-template-provinces", async (req, res) => {
  const provinces = await prisma.formTemplate.findMany({
    where: { productionReady: true, mappingReady: true },
    distinct: ["province"],
    select: { province: true },
    orderBy: { province: "asc" },
  });
  return res.json({ data: provinces });
});

router.get("/form-templates/:docId/active", async (req, res) => {
  const docId = String(req.params.docId || "");
  if (!/^[\w.-]+$/.test(docId)) return res.status(400).json({ message: "Invalid template." });
  const version = await activeTemplateVersion(docId);
  if (!version) return res.status(404).json({ message: "Template is unavailable." });
  return res.json({ data: { docId, version: version.version } });
});

router.get("/matters", async (req, res) => {
  const matters = await prisma.matter.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: "desc" },
    select: { matterNumber: true, clientName: true, province: true },
  });
  return res.json({ data: matters.map(matterDto) });
});

router.get("/matters/:matterNumber", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  if (!matter) return res.status(404).json({ message: "Matter not found." });
  return res.json({ data: matterDto(matter) });
});

router.get("/matters/:matterNumber/task-states", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  if (!matter) return res.status(404).json({ message: "Matter not found." });
  const states = await prisma.matterTaskState.findMany({
    where: { matterId: matter.id },
    select: { taskKey: true, status: true, updatedAt: true },
  });
  return res.json({ data: states });
});

router.put("/matters/:matterNumber/task-states/:taskKey", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const taskKey = String(req.params.taskKey || "").trim();
  const status = String(req.body?.status || "").trim();
  if (!matter) return res.status(404).json({ message: "Matter not found." });
  if (!/^[a-z][a-z0-9_]{0,99}$/.test(taskKey) || !TASK_STATUSES.has(status)) {
    return res.status(400).json({ message: "A valid task key and status are required." });
  }
  const taskState = await prisma.matterTaskState.upsert({
    where: { matterId_taskKey: { matterId: matter.id, taskKey } },
    create: { matterId: matter.id, taskKey, status },
    update: { status },
    select: { taskKey: true, status: true, updatedAt: true },
  });
  return res.json({ data: taskState });
});

router.get("/form-templates/:docId/versions/:version/pdf", async (req, res) => {
  const docId = String(req.params.docId || "");
  const version = Number(req.params.version);
  if (!/^[\w.-]+$/.test(docId) || !Number.isInteger(version) || version < 1) {
    return res.status(400).json({ message: "Invalid template version." });
  }
  return sendTemplatePdf(res, await activeTemplateVersion(docId, version));
});

router.get("/form-templates/:docId/versions/:version/mapping", async (req, res) => {
  const docId = String(req.params.docId || "");
  const version = Number(req.params.version);
  if (!/^[\w.-]+$/.test(docId) || !Number.isInteger(version) || version < 1) {
    return res.status(400).json({ message: "Invalid template version." });
  }
  const templateVersion = await activeTemplateVersion(docId, version);
  if (!templateVersion?.fieldMapping) return res.status(404).json({ message: "Field mapping is unavailable." });
  return res.json(templateVersion.fieldMapping);
});

router.post("/form-templates/:docId/versions/:version/mapping", async (req, res) => {
  if (!canManageTemplateMappings(req.user.id)) {
    return res.status(403).json({ message: "You are not allowed to publish form template mappings." });
  }
  const docId = String(req.params.docId || "");
  const version = Number(req.params.version);
  const mapping = req.body?.mapping;
  if (!/^[\w.-]+$/.test(docId) || !Number.isInteger(version) || version < 1 || !validFieldMapping(mapping)) {
    return res.status(400).json({ message: "A valid template version and field mapping are required." });
  }
  const mappingChecksum = crypto.createHash("sha256").update(JSON.stringify(mapping)).digest("hex");
  const published = await prisma.$transaction(async (tx) => {
    const source = await tx.formTemplateVersion.findFirst({
      where: { version, template: { docId } },
      include: { template: true },
    });
    if (!source) return null;
    const latest = await tx.formTemplateVersion.aggregate({ where: { templateId: source.templateId }, _max: { version: true } });
    const nextVersion = (latest._max.version || 0) + 1;
    await tx.formTemplateVersion.updateMany({ where: { templateId: source.templateId, active: true }, data: { active: false } });
    const created = await tx.formTemplateVersion.create({
      data: {
        templateId: source.templateId,
        version: nextVersion,
        pdfBytes: source.pdfBytes,
        pdfPath: source.pdfPath,
        pageCount: source.pageCount,
        pdfChecksum: source.pdfChecksum,
        fieldMapping: mapping,
        mappingChecksum,
        effectiveDate: new Date(),
        active: true,
      },
    });
    await tx.formTemplate.update({ where: { id: source.templateId }, data: { mappingReady: true } });
    return created;
  });
  if (!published) return res.status(404).json({ message: "Template version not found." });
  return res.status(201).json({ data: { docId, version: published.version, mappingChecksum: published.mappingChecksum } });
});

router.post("/matters/:matterNumber/forms", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const { folderId, templateIds } = req.body || {};
  if (!matter || !Array.isArray(templateIds) || templateIds.length === 0) return res.status(400).json({ message: "A matter and at least one form are required." });
  const ids = [...new Set(templateIds.map(Number).filter(Number.isInteger))];
  const prefillData = await buildPrefillData(matter, req.user.id);
  const result = await prisma.$transaction(async (tx) => {
    if (folderId != null) {
      const folder = await tx.matterFolder.findFirst({ where: { id: Number(folderId), matterId: matter.id } });
      if (!folder) throw Object.assign(new Error("Folder not found."), { status: 404 });
    }
    const versions = await tx.formTemplateVersion.findMany({ where: { active: true, templateId: { in: ids }, template: { productionReady: true, mappingReady: true } }, include: { template: true } });
    if (versions.length !== ids.length) throw Object.assign(new Error("One or more selected templates are not production ready."), { status: 400 });
    const documents = [];
    for (const version of versions) {
      const initial = prefillFields(prefillData, version.fieldMapping);
      documents.push(await tx.matterFormDocument.create({ data: { matterId: matter.id, folderId: folderId == null ? null : Number(folderId), templateVersionId: version.id, displayName: version.template.fileName, fieldValues: initial.values, fieldProvenance: initial.provenance }, include: { templateVersion: { include: { template: true } } } }));
    }
    return documents;
  }).catch((error) => { throw error; });
  return res.status(201).json({ data: result.map(documentDto) });
});

router.get("/matters/:matterNumber/forms", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  if (!matter) return res.status(404).json({ message: "Matter not found." });
  const documents = await prisma.matterFormDocument.findMany({ where: { matterId: matter.id, ...(req.query.folderId ? { folderId: Number(req.query.folderId) } : {}) }, include: { templateVersion: { include: { template: true } } }, orderBy: { updatedAt: "desc" } });
  return res.json({ data: documents.map(documentDto) });
});

router.get("/matters/:matterNumber/forms/:documentId", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const document = matter && await prisma.matterFormDocument.findFirst({ where: { id: Number(req.params.documentId), matterId: matter.id }, include: { templateVersion: { include: { template: true } } } });
  if (!document) return res.status(404).json({ message: "Form document not found." });
  return res.json({ data: { ...documentDto(document), fieldValues: document.fieldValues, fieldProvenance: document.fieldProvenance, mapping: document.templateVersion.fieldMapping } });
});

router.patch("/matters/:matterNumber/forms/:documentId", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const existing = matter && await prisma.matterFormDocument.findFirst({ where: { id: Number(req.params.documentId), matterId: matter.id } });
  if (!existing) return res.status(404).json({ message: "Form document not found." });
  const expectedRevision = Number(req.body?.revision);
  if (!Number.isInteger(expectedRevision) || expectedRevision !== existing.revision) return res.status(409).json({ message: "This form changed elsewhere. Reload it before saving.", revision: existing.revision });
  const values = req.body?.fieldValues;
  if (!values || typeof values !== "object" || Array.isArray(values)) return res.status(400).json({ message: "fieldValues must be an object." });
  const provenance = Object.fromEntries(Object.keys(values).map((id) => [id, "manual"]));
  const updated = await prisma.matterFormDocument.update({ where: { id: existing.id }, data: { fieldValues: values, fieldProvenance: { ...(existing.fieldProvenance || {}), ...provenance }, revision: { increment: 1 }, ...(req.body.status ? { status: String(req.body.status) } : {}) }, include: { templateVersion: { include: { template: true } } } });
  return res.json({ data: documentDto(updated) });
});

router.patch("/matters/:matterNumber/forms/:documentId/name", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const name = String(req.body?.displayName || "").trim();
  if (!matter || !name || name.length > 255) return res.status(400).json({ message: "A valid display name is required." });
  const updated = await prisma.matterFormDocument.updateMany({ where: { id: Number(req.params.documentId), matterId: matter.id }, data: { displayName: name } });
  if (!updated.count) return res.status(404).json({ message: "Form document not found." });
  return res.json({ data: { id: Number(req.params.documentId), displayName: name } });
});

router.delete("/matters/:matterNumber/forms/:documentId", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const deleted = matter && await prisma.matterFormDocument.deleteMany({ where: { id: Number(req.params.documentId), matterId: matter.id } });
  if (!deleted?.count) return res.status(404).json({ message: "Form document not found." });
  return res.status(204).end();
});

router.put("/matters/:matterNumber/forms/:documentId/pdf", express.raw({ type: "application/pdf", limit: "20mb" }), async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const encoded = String(req.body?.pdfBase64 || "").replace(/^data:application\/pdf;base64,/, "");
  const pdf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(encoded, "base64");
  if (!matter || (!Buffer.isBuffer(req.body) && !encoded) || pdf.length > 20 * 1024 * 1024 || pdf.subarray(0, 4).toString() !== "%PDF") return res.status(400).json({ message: "A PDF under 20 MB is required." });
  const expectedRevision = Number(req.query.revision ?? req.body?.revision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    return res.status(400).json({ message: "A generated PDF revision is required." });
  }
  const generationDuration = req.query.generationMs ?? req.body?.generationMs;
  const generationMs = Number(generationDuration);
  if (generationDuration != null && (!Number.isFinite(generationMs) || generationMs < 0 || generationMs > 30 * 60 * 1000)) {
    return res.status(400).json({ message: "Invalid PDF generation duration." });
  }
  const checksum = crypto.createHash("sha256").update(pdf).digest("hex");
  let document;
  try {
    document = await prisma.$transaction(async (tx) => {
      const existing = await tx.matterFormDocument.findFirst({
        where: { id: Number(req.params.documentId), matterId: matter.id },
        select: { id: true, generatedPdfRevision: true },
      });
      if (!existing) return null;
      if (existing.generatedPdfRevision !== expectedRevision) {
        throw Object.assign(new Error("This completed PDF changed elsewhere. Reload it before saving."), { status: 409, revision: existing.generatedPdfRevision });
      }
      const generatedPdfRevision = expectedRevision + 1;
      const generatedAt = new Date();
      const updated = await tx.matterFormDocument.updateMany({
        where: { id: existing.id, generatedPdfRevision: expectedRevision },
        // The immutable revision is the source of truth. Do not duplicate large
        // completed PDFs in MatterFormDocument as well as MatterFormPdfRevision.
        data: { generatedAt, generatedPdfRevision },
      });
      if (!updated.count) {
        throw Object.assign(new Error("This completed PDF changed elsewhere. Reload it before saving."), { status: 409 });
      }
      await tx.matterFormPdfRevision.create({
        data: { documentId: existing.id, revision: generatedPdfRevision, checksum, pdf },
      });
      return { generatedPdfRevision, generatedAt };
    });
  } catch (error) {
    if (error.status === 409) return res.status(409).json({ message: error.message, revision: error.revision });
    throw error;
  }
  if (!document) return res.status(404).json({ message: "Form document not found." });
  console.info(JSON.stringify({
    event: "forms_pdf_saved",
    revision: document.generatedPdfRevision,
    pdfBytes: pdf.length,
    ...(Number.isFinite(generationMs) ? { generationMs } : {}),
  }));
  return res.json({ data: { checksum, revision: document.generatedPdfRevision, created: document.generatedAt } });
});

router.get("/matters/:matterNumber/forms/:documentId/pdf", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const document = matter && await prisma.matterFormDocument.findFirst({
    where: { id: Number(req.params.documentId), matterId: matter.id },
    select: {
      generatedPdf: true,
      displayName: true,
      pdfRevisions: { orderBy: { revision: "desc" }, take: 1, select: { pdf: true } },
    },
  });
  const pdf = document?.pdfRevisions?.[0]?.pdf || document?.generatedPdf;
  if (!pdf) return res.status(404).json({ message: "Generated PDF not found." });
  res.type("application/pdf");
  res.attachment(document.displayName.replace(/\.pdf$/i, "") + "-completed.pdf");
  return res.send(Buffer.from(pdf));
});

router.get("/matters/:matterNumber/forms/:documentId/pdf/revisions", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const document = matter && await prisma.matterFormDocument.findFirst({
    where: { id: Number(req.params.documentId), matterId: matter.id },
    select: { id: true },
  });
  if (!document) return res.status(404).json({ message: "Form document not found." });
  const revisions = await prisma.matterFormPdfRevision.findMany({
    where: { documentId: document.id },
    select: { revision: true, checksum: true, createdAt: true },
    orderBy: { revision: "desc" },
  });
  return res.json({ data: revisions.map((revision) => ({
    revision: revision.revision,
    checksum: revision.checksum,
    created: revision.createdAt,
  })) });
});

router.post("/matters/:matterNumber/folders", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const title = String(req.body?.title || "").trim();
  if (!matter || !title) return res.status(400).json({ message: "Matter and folder title are required." });
  const folder = await prisma.matterFolder.upsert({ where: { matterId_normalizedTitle: { matterId: matter.id, normalizedTitle: normaliseFolderTitle(title) } }, create: { matterId: matter.id, title, normalizedTitle: normaliseFolderTitle(title), type: req.body?.type || null }, update: {} });
  return res.status(201).json({ data: folder });
});

router.get("/matters/:matterNumber/folders", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  if (!matter) return res.status(404).json({ message: "Matter not found." });
  const folders = await prisma.matterFolder.findMany({ where: { matterId: matter.id }, orderBy: { createdAt: "asc" } });
  return res.json({ data: folders });
});

module.exports = router;

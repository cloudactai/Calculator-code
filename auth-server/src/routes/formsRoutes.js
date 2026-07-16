const crypto = require("crypto");
const express = require("express");
const path = require("path");
const prisma = require("../../prismaClient");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

const legacyOk = (body) => ({ data: { code: 200, status: "success", body } });
const legacyError = (message, code = 404) => ({ data: { code, status: "error", message } });
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
    template_version: document.templateVersion.version,
    created: document.createdAt,
    updated: document.updatedAt,
  };
}

function readPath(source, path) {
  return String(path || "").split(".").reduce((value, key) => value == null ? undefined : value[key], source);
}

async function prefillFields(matter, mapping) {
  const records = await prisma.matterRecord.findMany({ where: { matterId: matter.id } });
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
  const data = {
    matter: { matterNumber: matter.matterNumber, province: matter.province, clientName: matter.clientName },
    court_info: { courtName: court.court_name || "", courtFileNumber: court.file_number || "", courtOfficeAddress: court.address || "" },
    applicant: person(client), applicantsLawyer: lawyer(client),
    respondent: person(opposingParty), respondentsLawyer: lawyer(opposingParty),
    employmentStatus: { client: byRole(employmentRows, "Client"), opposingParty: byRole(employmentRows, "Opposing Party") },
    children: rows("children"), relationship: rows("relationship")[0] || {},
  };
  const fields = Array.isArray(mapping?.staticFields) ? mapping.staticFields : [];
  const values = {};
  const provenance = {};
  for (const field of fields) {
    if (!field?.id || !field.bind) continue;
    const value = readPath(data, field.bind);
    if (value !== undefined && value !== null && value !== "") {
      values[field.id] = value;
      provenance[field.id] = "prefill";
    }
  }
  return { values, provenance };
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

router.get("/fetch-pdf", async (req, res) => {
  const fileName = String(req.query.fileName || "");
  if (!/^[\w.-]+\.pdf$/i.test(fileName)) return res.status(400).json(legacyError("Invalid file name.", 400));
  const docId = fileName.replace(/\.pdf$/i, "");
  const version = await prisma.formTemplateVersion.findFirst({
    where: { active: true, template: { OR: [{ fileName }, { docId }] } },
    orderBy: { version: "desc" },
  });
  if (!version || (!version.pdfBytes && !version.pdfPath)) return res.status(404).json(legacyError("PDF template is unavailable."));
  res.type("application/pdf");
  if (version.pdfPath) {
    const templatesRoot = path.resolve(__dirname, "..", "..", "form-template-export");
    const filePath = path.resolve(templatesRoot, version.pdfPath);
    if (!filePath.startsWith(`${templatesRoot}${path.sep}`)) return res.status(400).json(legacyError("Invalid PDF template path.", 400));
    return res.sendFile(filePath);
  }
  return res.send(Buffer.from(version.pdfBytes));
});

router.get("/fetch-json", async (req, res) => {
  const fileName = String(req.query.fileName || "");
  if (!/^[\w.-]+\.json$/i.test(fileName)) return res.status(400).json(legacyError("Invalid file name.", 400));
  const stem = fileName.replace(/\.json$/i, "");
  const version = await prisma.formTemplateVersion.findFirst({ where: { active: true, template: { docId: stem } }, orderBy: { version: "desc" } });
  if (!version?.fieldMapping) return res.status(404).json(legacyError("Field mapping is unavailable."));
  return res.json(version.fieldMapping);
});

router.post("/matters/:matterNumber/forms", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const { folderId, templateIds } = req.body || {};
  if (!matter || !Array.isArray(templateIds) || templateIds.length === 0) return res.status(400).json({ message: "A matter and at least one form are required." });
  const ids = [...new Set(templateIds.map(Number).filter(Number.isInteger))];
  const result = await prisma.$transaction(async (tx) => {
    if (folderId != null) {
      const folder = await tx.matterFolder.findFirst({ where: { id: Number(folderId), matterId: matter.id } });
      if (!folder) throw Object.assign(new Error("Folder not found."), { status: 404 });
    }
    const versions = await tx.formTemplateVersion.findMany({ where: { active: true, templateId: { in: ids }, template: { productionReady: true, mappingReady: true } }, include: { template: true } });
    if (versions.length !== ids.length) throw Object.assign(new Error("One or more selected templates are not production ready."), { status: 400 });
    const documents = [];
    for (const version of versions) {
      const initial = await prefillFields(matter, version.fieldMapping);
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

router.put("/matters/:matterNumber/forms/:documentId/pdf", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const encoded = String(req.body?.pdfBase64 || "").replace(/^data:application\/pdf;base64,/, "");
  const pdf = Buffer.from(encoded, "base64");
  if (!matter || !encoded || pdf.length > 20 * 1024 * 1024 || pdf.subarray(0, 4).toString() !== "%PDF") return res.status(400).json({ message: "A PDF under 20 MB is required." });
  const updated = await prisma.matterFormDocument.updateMany({ where: { id: Number(req.params.documentId), matterId: matter.id }, data: { generatedPdf: pdf, generatedAt: new Date() } });
  if (!updated.count) return res.status(404).json({ message: "Form document not found." });
  return res.json({ data: { checksum: crypto.createHash("sha256").update(pdf).digest("hex") } });
});

router.get("/matters/:matterNumber/forms/:documentId/pdf", async (req, res) => {
  const matter = await matterForUser(req.user.id, req.params.matterNumber);
  const document = matter && await prisma.matterFormDocument.findFirst({ where: { id: Number(req.params.documentId), matterId: matter.id }, select: { generatedPdf: true, displayName: true } });
  if (!document?.generatedPdf) return res.status(404).json({ message: "Generated PDF not found." });
  res.type("application/pdf");
  res.attachment(document.displayName.replace(/\.pdf$/i, "") + "-completed.pdf");
  return res.send(Buffer.from(document.generatedPdf));
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

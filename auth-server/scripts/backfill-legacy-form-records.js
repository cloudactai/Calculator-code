/*
 * Idempotently moves legacy MatterRecord folders, files, and file_data rows
 * into the normalized Forms tables. Run after templates are imported.
 *
 * Usage: node scripts/backfill-legacy-form-records.js [--dry-run]
 */
const prisma = require("../prismaClient");
const dryRun = process.argv.includes("--dry-run");
const normalise = (value) => String(value || "Untitled").trim().replace(/\s+/g, " ").toLocaleLowerCase();
const asRows = (record) => Array.isArray(record?.data) ? record.data : [];

function valuesFromLegacyRecord(record) {
  const fields = record?.data?.[0]?.data?.staticFields || record?.data?.staticFields || record?.data?.[0]?.staticFields;
  if (!Array.isArray(fields)) return {};
  return Object.fromEntries(fields.filter((field) => field?.id != null).map((field) => [String(field.id), field.value ?? ""]));
}

async function main() {
  const matters = await prisma.matter.findMany({ include: { records: true } });
  const templates = await prisma.formTemplateVersion.findMany({ where: { active: true }, include: { template: true }, orderBy: { version: "desc" } });
  const versionByDocId = new Map();
  for (const version of templates) if (!versionByDocId.has(version.template.docId)) versionByDocId.set(version.template.docId, version);
  const report = { matters: matters.length, folders: 0, documents: 0, skippedTemplates: [], malformedFiles: [] };

  for (const matter of matters) {
    const folders = asRows(matter.records.find((record) => record.dataType === "folders"));
    const folderByLegacyId = new Map();
    for (const legacyFolder of folders) {
      const title = String(legacyFolder.title || "Untitled").trim() || "Untitled";
      const data = { matterId: matter.id, title, normalizedTitle: normalise(title), type: legacyFolder.type || null };
      const folder = dryRun ? data : await prisma.matterFolder.upsert({
        where: { matterId_normalizedTitle: { matterId: matter.id, normalizedTitle: data.normalizedTitle } }, create: data, update: {},
      });
      folderByLegacyId.set(String(legacyFolder.id), folder);
      report.folders += 1;
    }

    const files = asRows(matter.records.find((record) => record.dataType === "files"));
    for (const file of files) {
      const docId = String(file.docId || "");
      const version = versionByDocId.get(docId);
      if (!docId || !version) { report.skippedTemplates.push({ matter: matter.matterNumber, fileId: file.id, docId }); continue; }
      const legacyFolderId = String(file.folder_id ?? "");
      const folder = folderByLegacyId.get(legacyFolderId);
      const dataRecord = matter.records.find((record) => record.dataType === `file_data:${legacyFolderId}:${file.docId}` || record.dataType === `file_data:${legacyFolderId}:${file.id}`);
      const fieldValues = valuesFromLegacyRecord(dataRecord);
      const documentData = { matterId: matter.id, folderId: folder?.id ?? null, templateVersionId: version.id, displayName: String(file.file_name || version.template.fileName), status: String(file.status || "OPEN").toUpperCase(), fieldValues, fieldProvenance: Object.fromEntries(Object.keys(fieldValues).map((id) => [id, "legacy"])) };
      if (!dryRun) {
        const existing = await prisma.matterFormDocument.findFirst({ where: { matterId: documentData.matterId, folderId: documentData.folderId, templateVersionId: documentData.templateVersionId, displayName: documentData.displayName } });
        if (!existing) await prisma.matterFormDocument.create({ data: documentData });
      }
      report.documents += 1;
    }
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

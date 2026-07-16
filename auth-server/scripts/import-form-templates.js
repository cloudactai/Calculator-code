/*
 * Usage: node scripts/import-form-templates.js /absolute/path/to/export
 * Export must contain catalog.json plus <docId>.pdf and <docId>.json files.
 * This deliberately fails closed: a template is never production-ready unless
 * both the legal artifact and its field map passed validation.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
let prisma;

const dir = process.argv[2];
if (!dir) throw new Error("Usage: node scripts/import-form-templates.js <export-directory>");
const dryRun = process.argv.includes("--dry-run");
const onlyDocId = process.argv.includes("--doc-id")
  ? process.argv[process.argv.indexOf("--doc-id") + 1]
  : null;
if (process.argv.includes("--doc-id") && !onlyDocId) throw new Error("--doc-id requires a template docId.");
const catalog = JSON.parse(fs.readFileSync(path.join(dir, "catalog.json"), "utf8"));
if (!Array.isArray(catalog)) throw new Error("catalog.json must be an array.");

function checksum(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  if (!dryRun) prisma = require("../prismaClient");
  const seen = new Set();
  const selectedCatalog = onlyDocId ? catalog.filter((item) => item.docId === onlyDocId) : catalog;
  if (onlyDocId && selectedCatalog.length !== 1) throw new Error(`Unknown template docId: ${onlyDocId}`);
  for (let index = 0; index < selectedCatalog.length; index += 1) {
    const item = selectedCatalog[index];
    if (!item.docId || seen.has(item.docId)) throw new Error(`Duplicate or missing docId: ${item.docId || "<missing>"}`);
    seen.add(item.docId);
    const pdfPath = path.join(dir, `${item.docId}.pdf`);
    const descriptor = fs.openSync(pdfPath, "r");
    const header = Buffer.alloc(4);
    fs.readSync(descriptor, header, 0, 4, 0);
    fs.closeSync(descriptor);
    const pdf = fs.readFileSync(pdfPath);
    const mappingBytes = fs.readFileSync(path.join(dir, `${item.docId}.json`));
    const mapping = JSON.parse(mappingBytes.toString("utf8"));
    const fields = mapping.staticFields;
    if (!header.equals(Buffer.from("%PDF"))) throw new Error(`${item.docId}: invalid PDF`);
    if (!Array.isArray(fields) || fields.some((field) => !field.id || !Number.isInteger(field.page) || field.page < 1)) throw new Error(`${item.docId}: invalid field map`);
    const pdfChecksum = checksum(pdf);
    const mappingChecksum = checksum(mappingBytes);
    if (dryRun) continue;
    const template = await prisma.formTemplate.upsert({
      where: { docId: item.docId },
      create: { docId: item.docId, province: item.province, category: item.category, title: item.title, shortTitle: item.shortTitle || null, fileName: item.fileName || `${item.docId}.pdf`, footerText: item.footerText || null, status: item.status || "active", productionReady: true, mappingReady: true, sortOrder: item.sortOrder || index },
      update: { province: item.province, category: item.category, title: item.title, shortTitle: item.shortTitle || null, fileName: item.fileName || `${item.docId}.pdf`, footerText: item.footerText || null, status: item.status || "active", productionReady: true, mappingReady: true, sortOrder: item.sortOrder || index },
    });
    const version = Number(item.version || 1);
    await prisma.formTemplateVersion.upsert({
      where: { templateId_version: { templateId: template.id, version } },
      create: { templateId: template.id, version, pdfPath: `${item.docId}.pdf`, fieldMapping: mapping, pageCount: item.pageCount || null, pdfChecksum, mappingChecksum, effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null },
      update: { pdfBytes: null, pdfPath: `${item.docId}.pdf`, fieldMapping: mapping, pageCount: item.pageCount || null, pdfChecksum, mappingChecksum, effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null, active: true },
    });
  }
}

main().then(() => console.log(dryRun ? "Form template export validated." : `Form template${onlyDocId ? ` ${onlyDocId}` : "s"} imported.`)).finally(() => prisma?.$disconnect());

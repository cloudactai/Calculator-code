/*
 * Creates a self-contained, reviewable import bundle from the checked-out
 * legacy repositories. It copies only catalogued Ontario forms with a matching
 * PDF and JSON field map, normalizing the JSON filename to <docId>.json.
 *
 * Usage:
 *   node scripts/prepare-legacy-form-export.js <legacy-api-root> <legacy-ui-root>
 */
const fs = require("fs");
const path = require("path");

const [apiRoot, uiRoot] = process.argv.slice(2);
if (!apiRoot || !uiRoot) throw new Error("Usage: node scripts/prepare-legacy-form-export.js <legacy-api-root> <legacy-ui-root>");

const documentsDir = path.join(apiRoot, "public", "documents");
const mappingsDir = path.join(documentsDir, "json_data");
const source = fs.readFileSync(path.join(uiRoot, "src", "utils", "matterData", "MatterFormData_old.jsx"), "utf8");
const outputDir = path.resolve(__dirname, "..", "form-template-export");
const audit = { included: [], missingPdf: [], missingMapping: [], invalidMapping: [], unlistedPdf: [], unlistedMapping: [] };

fs.mkdirSync(outputDir, { recursive: true });
for (const name of fs.readdirSync(outputDir)) {
  if (name !== "README.md") fs.rmSync(path.join(outputDir, name), { recursive: true, force: true });
}

const filesByStem = (directory, extension) => new Map(
  fs.readdirSync(directory)
    .filter((name) => name.toLowerCase().endsWith(extension))
    .map((name) => [path.basename(name, path.extname(name)).toLowerCase(), name])
);
const pdfs = filesByStem(documentsDir, ".pdf");
const mappings = filesByStem(mappingsDir, ".json");
const valueOf = (block, key) => block.match(new RegExp(`"${key}":\\s*"([^"]+)"`))?.[1] || null;
const listed = [...source.matchAll(/\{[\s\S]*?"docId":\s*"[^"]+"[\s\S]*?\}/g)]
  .map((match) => ({
    title: valueOf(match[0], "title"), shortTitle: valueOf(match[0], "shortTitle"),
    footerText: valueOf(match[0], "footer_text"), status: valueOf(match[0], "status"),
    fileName: valueOf(match[0], "file_name"), docId: valueOf(match[0], "docId"),
  }))
  .filter((item) => item.title && item.shortTitle && item.status && item.fileName && item.docId);

const catalog = [];
for (const item of listed) {
  const key = item.docId.toLowerCase();
  const pdfName = pdfs.get(key);
  const mappingName = mappings.get(key);
  if (!pdfName) { audit.missingPdf.push(item.docId); continue; }
  if (!mappingName) { audit.missingMapping.push(item.docId); continue; }
  let mapping;
  try {
    mapping = JSON.parse(fs.readFileSync(path.join(mappingsDir, mappingName), "utf8"));
    if (!Array.isArray(mapping.staticFields)) throw new Error("staticFields is missing");
  } catch (error) {
    audit.invalidMapping.push({ docId: item.docId, reason: error.message });
    continue;
  }
  fs.copyFileSync(path.join(documentsDir, pdfName), path.join(outputDir, `${item.docId}.pdf`));
  fs.copyFileSync(path.join(mappingsDir, mappingName), path.join(outputDir, `${item.docId}.json`));
  catalog.push({ ...item, fileName: `${item.docId}.pdf`, province: "ON", category: "Divorce", version: 1, sortOrder: catalog.length + 1 });
  audit.included.push({ docId: item.docId, pdf: pdfName, mapping: mappingName, fields: mapping.staticFields.length });
}

const listedIds = new Set(listed.map((item) => item.docId.toLowerCase()));
audit.unlistedPdf = [...pdfs.entries()].filter(([stem]) => !listedIds.has(stem)).map(([, name]) => name);
audit.unlistedMapping = [...mappings.entries()].filter(([stem]) => !listedIds.has(stem)).map(([, name]) => name);
fs.writeFileSync(path.join(outputDir, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
console.log(`Prepared ${catalog.length} templates in ${outputDir}`);
console.log(`Audit: ${path.join(outputDir, "audit.json")}`);

/*
 * Render-safe one-time Forms bootstrap. It checks the catalog count, releases
 * its database client, then imports templates in isolated processes only when
 * the database is incomplete. Existing deployments restart quickly.
 */
const { spawnSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const prisma = require("../prismaClient");
const exportDir = path.join(__dirname, "..", "form-template-export");
const catalog = require(path.join(exportDir, "catalog.json"));

// Checksum of a template's field-map file, matching how the importer hashes it.
// Lets the bootstrap notice when a mapping was edited and needs re-importing.
function fileMappingChecksum(docId) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(path.join(exportDir, `${docId}.json`))).digest("hex");
  } catch {
    return null;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: path.join(__dirname, ".."), stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status || 1);
}

async function main() {
  const [count, incompleteVersions, templates] = await Promise.all([
    prisma.formTemplate.count(),
    prisma.formTemplateVersion.count({
      where: {
        active: true,
        OR: [
          { pdfPath: null },
          { pdfChecksum: null },
          { mappingChecksum: null },
        ],
      },
    }),
    prisma.formTemplate.findMany({
      select: { docId: true, versions: { where: { active: true }, select: { mappingChecksum: true }, orderBy: { version: "desc" }, take: 1 } },
    }),
  ]);
  await prisma.$disconnect();
  // A stored mapping whose checksum no longer matches its exported file means an
  // edited field map has not been imported yet.
  const dbSums = new Map(templates.map((t) => [t.docId, t.versions[0]?.mappingChecksum || null]));
  const drifted = catalog
    .filter((item) => dbSums.has(item.docId) && dbSums.get(item.docId) !== fileMappingChecksum(item.docId))
    .map((item) => item.docId);
  if (count < catalog.length || incompleteVersions > 0 || drifted.length > 0) {
    const reason = drifted.length ? `mapping changed for ${drifted.join(", ")}` : `${count}/${catalog.length} templates, ${incompleteVersions} incomplete versions`;
    console.log(`Forms catalog requires refresh (${reason}).`);
    run(process.execPath, [path.join(__dirname, "import-form-templates-render-safe.js")]);
  } else {
    console.log(`Forms catalog already complete (${count}/${catalog.length}).`);
  }
}

main().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exitCode = 1; });

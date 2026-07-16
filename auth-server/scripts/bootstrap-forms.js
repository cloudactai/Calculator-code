/*
 * Render-safe one-time Forms bootstrap. It checks the catalog count, releases
 * its database client, then imports templates in isolated processes only when
 * the database is incomplete. Existing deployments restart quickly.
 */
const { spawnSync } = require("child_process");
const path = require("path");
const prisma = require("../prismaClient");
const catalog = require(path.join(__dirname, "..", "form-template-export", "catalog.json"));

function run(command, args) {
  const result = spawnSync(command, args, { cwd: path.join(__dirname, ".."), stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status || 1);
}

async function main() {
  const count = await prisma.formTemplate.count();
  await prisma.$disconnect();
  if (count < catalog.length) {
    console.log(`Forms catalog has ${count}/${catalog.length} templates; completing import.`);
    run(process.execPath, [path.join(__dirname, "import-form-templates-render-safe.js")]);
  } else {
    console.log(`Forms catalog already complete (${count}/${catalog.length}).`);
  }
  run(process.execPath, [path.join(__dirname, "backfill-legacy-form-records.js")]);
}

main().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exitCode = 1; });

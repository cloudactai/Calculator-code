/* Imports one PDF template in a fresh Node process at a time for 512 MB hosts. */
const { spawnSync } = require("child_process");
const path = require("path");
const catalog = require(path.join(__dirname, "..", "form-template-export", "catalog.json"));
const dryRun = process.argv.includes("--dry-run");

for (const { docId } of catalog) {
  const args = [path.join(__dirname, "import-form-templates.js"), "form-template-export", "--doc-id", docId];
  if (dryRun) args.push("--dry-run");
  const result = spawnSync(process.execPath, args, {
    cwd: path.join(__dirname, ".."), stdio: "inherit", env: process.env,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(dryRun ? "All form templates validated safely." : "All form templates imported safely.");

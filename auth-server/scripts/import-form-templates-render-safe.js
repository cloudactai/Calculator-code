/* Imports one PDF template in a fresh Node process at a time for 512 MB hosts.
 * With no filter it imports the whole catalog; pass `--doc-id X [--doc-id Y ...]`
 * to import only those templates (used by the bootstrap to refresh just the
 * templates that changed). */
const { spawnSync } = require("child_process");
const path = require("path");
const catalog = require(path.join(__dirname, "..", "form-template-export", "catalog.json"));
const dryRun = process.argv.includes("--dry-run");

const only = [];
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === "--doc-id" && process.argv[i + 1]) only.push(process.argv[i + 1]);
}
const templates = only.length ? catalog.filter((item) => only.includes(item.docId)) : catalog;

for (const { docId } of templates) {
  const args = [path.join(__dirname, "import-form-templates.js"), "form-template-export", "--doc-id", docId];
  if (dryRun) args.push("--dry-run");
  const result = spawnSync(process.execPath, args, {
    cwd: path.join(__dirname, ".."), stdio: "inherit", env: process.env,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(dryRun ? "All form templates validated safely." : "All form templates imported safely.");

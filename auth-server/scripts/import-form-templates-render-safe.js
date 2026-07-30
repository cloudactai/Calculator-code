/* Imports one PDF template in a fresh Node process at a time for 512 MB hosts.
 * With no filter it imports the whole catalog; pass `--doc-id X [--doc-id Y ...]`
 * to import only those templates (used by the bootstrap to refresh just the
 * templates that changed).
 *
 * A single bad or slow template must never stall a deploy, so each import runs
 * under a timeout and a failure is logged and skipped rather than aborting the
 * batch. The exit code still reports whether everything landed. */
const { spawnSync } = require("child_process");
const path = require("path");
const catalog = require(path.join(__dirname, "..", "form-template-export", "catalog.json"));
const dryRun = process.argv.includes("--dry-run");

// Big multi-page templates take ~11 s each; this is a hang guard, not a budget.
const PER_FORM_TIMEOUT_MS = Number(process.env.FORMS_IMPORT_TIMEOUT_MS || 120000);

const only = [];
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === "--doc-id" && process.argv[i + 1]) only.push(process.argv[i + 1]);
}
const templates = only.length ? catalog.filter((item) => only.includes(item.docId)) : catalog;
const missing = only.filter((docId) => !catalog.some((item) => item.docId === docId));
if (missing.length) console.error(`Skipping unknown docId(s): ${missing.join(", ")}`);

const failed = [];
let imported = 0;
for (const { docId } of templates) {
  const args = [path.join(__dirname, "import-form-templates.js"), "form-template-export", "--doc-id", docId];
  if (dryRun) args.push("--dry-run");
  const started = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd: path.join(__dirname, ".."), stdio: "inherit", env: process.env, timeout: PER_FORM_TIMEOUT_MS,
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (result.error?.code === "ETIMEDOUT" || result.signal) {
    failed.push(docId);
    console.error(`forms_import ${docId} timed out after ${seconds}s (killed, continuing).`);
  } else if (result.status !== 0) {
    failed.push(docId);
    console.error(`forms_import ${docId} failed with code ${result.status} after ${seconds}s (continuing).`);
  } else {
    imported += 1;
    console.log(`forms_import ${docId} ok in ${seconds}s.`);
  }
}

const verb = dryRun ? "validated" : "imported";
console.log(`Form templates ${verb}: ${imported}/${templates.length}${failed.length ? `, failed: ${failed.join(", ")}` : ""}.`);
if (failed.length || missing.length) process.exitCode = 1;

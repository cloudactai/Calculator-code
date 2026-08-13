/* Keep XFA signature rules and captions when flattening with pdf.js.
 *
 * pdf.js models <ui><signature> but does not implement Signature[$toHTML]().
 * Field[$toHTML]() consequently receives an empty UI and drops the field's caption
 * along with the unsupported widget.  These are printed captions such as
 * "Judge / Associate Judge / Registrar", not editable form data.
 *
 * Patch the reproducibly downloaded worker rather than committing the ~5 MB vendor
 * bundle.  The emitted div deliberately contains no input, textarea, or select, so
 * render.html will print the rule and caption without exporting a fillable overlay.
 *
 * Usage: node patch_pdfjs_signature.mjs [path/to/pdf.worker.mjs]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const workerPath = process.argv[2] || path.join(here, "pdf.worker.mjs");
let source = fs.readFileSync(workerPath, "utf8");

const classStart = source.indexOf("class Signature extends XFAObject {");
const nextClass = source.indexOf("\nclass Signing extends XFAObject {", classStart);
if (classStart < 0 || nextClass < 0) {
  throw new Error("pdf.js XFA Signature class was not found; inspect the new vendor build");
}

const signatureClass = source.slice(classStart, nextClass);
if (signatureClass.includes('style.width = "100%";')) {
  console.log(`${workerPath}: XFA signature patch already present`);
  process.exit(0);
}

const classClose = source.lastIndexOf("\n}", nextClass);
if (classClose < classStart) {
  throw new Error("pdf.js XFA Signature class closing brace was not found");
}

const oldImplementation = `
  [\$toHTML]() {
    const style = toStyle(this, "border", "margin");
    return HTMLResult.success({
      name: "div",
      attributes: {
        class: ["xfaLabel", "xfaSignature"],
        style
      },
      children: []
    });
  }
`;

const implementation = `
  [\$toHTML]() {
    const style = toStyle(this, "border", "margin");
    style.width = "100%";
    return HTMLResult.success({
      name: "div",
      attributes: {
        class: ["xfaLabel"]
      },
      children: [{
        name: "div",
        attributes: {
          class: ["xfaSignature"],
          style
        },
        children: []
      }]
    });
  }
`;

if (signatureClass.includes("class: [\"xfaSignature\"]")) {
  const styleLine = '    const style = toStyle(this, "border", "margin");\n';
  const styleAt = source.indexOf(styleLine, classStart);
  if (styleAt < 0 || styleAt > nextClass) {
    throw new Error("the XFA signature rule width could not be upgraded");
  }
  const afterStyle = styleAt + styleLine.length;
  source = source.slice(0, afterStyle) + '    style.width = "100%";\n' + source.slice(afterStyle);
} else if (signatureClass.includes("class: [\"xfaLabel\", \"xfaSignature\"]")) {
  if (!source.includes(oldImplementation)) {
    throw new Error("the previous XFA signature patch could not be upgraded");
  }
  source = source.replace(oldImplementation, implementation);
} else {
  source = source.slice(0, classClose) + implementation + source.slice(classClose);
}
fs.writeFileSync(workerPath, source);

const patchedClass = source.slice(classStart, nextClass + implementation.length);
if (!patchedClass.includes("[\$toHTML]()") ||
    !patchedClass.includes("class: [\"xfaSignature\"]")) {
  throw new Error("pdf.js XFA signature patch verification failed");
}
console.log(`${workerPath}: XFA signature rules and captions enabled`);
